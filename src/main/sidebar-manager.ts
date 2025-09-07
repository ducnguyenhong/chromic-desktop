// src/main/sidebar-manager.ts
import { BrowserWindow, WebContentsView } from 'electron'
import { join } from 'path'

interface Sidebar {
  view: WebContentsView
  width: number
  separator?: WebContentsView
}

const sidebars: Record<string, Sidebar> = {}
const defaultWidth = 800
const separatorWidth = 2

// Open sidebar (không tự resize các tab khác ở đây)
export const openSidebar = (
  mainWindow: BrowserWindow,
  options: { url?: string; file?: string; tabId?: string },
  resizeTabCallback?: () => void
) => {
  const tabId = options.tabId
  if (!tabId) return

  // nếu đã có, đóng trước (đảm bảo addChildView ko duplicate)
  if (sidebars[tabId]) {
    closeSidebar(mainWindow, tabId)
  }

  // --- Sidebar view ---
  const sidebar = new WebContentsView({
    webPreferences: {
      preload: join(__dirname, '../preload/index.js'), // dùng preload chính
      sandbox: false
    }
  })
  // load a blank first so preload runs; then load real content (if any)
  sidebar.webContents.loadURL('about:blank')
  sidebar.webContents.once('dom-ready', () => {
    // allow internal page to scroll
    sidebar.webContents.insertCSS(`body { margin:0; overflow:auto; }`)
    if (options.url) sidebar.webContents.loadURL(options.url)
    else if (options.file)
      sidebar.webContents.loadFile(join(__dirname, `../renderer/${options.file}`))
  })
  mainWindow.contentView.addChildView(sidebar)

  // --- Separator view ---
  const separator = new WebContentsView({
    webPreferences: {
      preload: join(__dirname, '../preload/index.js'), // same preload => window.separatorAPI available
      sandbox: false
    }
  })
  separator.webContents.loadURL('about:blank')
  separator.webContents.once('dom-ready', () => {
    // style separator so it's visible and cursor is correct
    separator.webContents.insertCSS(`
      html,body { margin:0; height:100%; }
      body { background: #e6e6e6; cursor: col-resize; -webkit-user-select:none; }
    `)

    // set up event listeners in page context which call window.separatorAPI.drag
    // we avoid using require(); window.separatorAPI is exposed by preload
    try {
      const js = `(function(tabId){
        let dragging = false;
        let lastX = 0;

        const startDrag = (e) => {
          dragging = true;
          lastX = e.clientX;
        };

        const stopDrag = () => {
          dragging = false;
        };

        const onDrag = (e) => {
          if (!dragging) return;
          const delta = e.clientX - lastX;
          lastX = e.clientX;
          if (window.separatorAPI && window.separatorAPI.drag) {
            window.separatorAPI.drag(tabId, delta);
          }
        };

        document.body.addEventListener('mousedown', startDrag);
        window.addEventListener('mouseup', stopDrag);
        window.addEventListener('mousemove', onDrag);
      })(${JSON.stringify(tabId)});`
      // run it (no require used)
      separator.webContents.executeJavaScript(js).catch((err) => {
        console.error('separator exec script error', err)
      })
    } catch (err) {
      console.error('separator setup error', err)
    }
  })
  mainWindow.contentView.addChildView(separator)

  sidebars[tabId] = { view: sidebar, width: defaultWidth, separator }

  // layout and ask caller to resize active tab if desired
  layoutSidebar(mainWindow, tabId)
  if (resizeTabCallback) resizeTabCallback()
}

// Close sidebar
export const closeSidebar = (
  mainWindow: BrowserWindow,
  tabId: string,
  resizeTabCallback?: () => void
) => {
  const sb = sidebars[tabId]
  if (!sb) return

  try {
    mainWindow.contentView.removeChildView(sb.view)
    sb.view.webContents.close()
  } catch (e) {
    /* ignore */
  }

  if (sb.separator) {
    try {
      mainWindow.contentView.removeChildView(sb.separator)
      sb.separator.webContents.close()
    } catch (e) {
      /* ignore */
    }
  }

  delete sidebars[tabId]
  if (resizeTabCallback) resizeTabCallback()
}

// Layout sidebar + separator (KHÔNG truy cập tabs trực tiếp)
export const layoutSidebar = (mainWindow: BrowserWindow, tabId: string) => {
  const sb = sidebars[tabId]
  if (!sb) return

  const bounds = mainWindow.getBounds()
  const y = 118
  const height = bounds.height - 134
  // place sidebar at right, but keep your existing margin (-16 used in your code)
  const sidebarX = bounds.width - sb.width - 16
  const separatorX = sidebarX - separatorWidth

  sb.view.setBounds({ x: sidebarX, y, width: sb.width, height })

  if (sb.separator) {
    sb.separator.setBounds({ x: separatorX, y, width: separatorWidth, height })
  }
}

// resize called from tab-manager when needed
export const resizeSidebar = (mainWindow: BrowserWindow, tabId: string, newWidth: number) => {
  const sb = sidebars[tabId]
  if (!sb) return
  sb.width = Math.max(100, newWidth)
  layoutSidebar(mainWindow, tabId)
}

// when switching tabs: hide all and show only that tab's sidebar
export const onTabActivated = (mainWindow: BrowserWindow, tabId: string) => {
  Object.values(sidebars).forEach((s) => {
    try {
      mainWindow.contentView.removeChildView(s.view)
      if (s.separator) mainWindow.contentView.removeChildView(s.separator)
    } catch (e) {
      /* ignore */
    }
  })
  const sb = sidebars[tabId]
  if (!sb) return
  mainWindow.contentView.addChildView(sb.view)
  if (sb.separator) mainWindow.contentView.addChildView(sb.separator)
  layoutSidebar(mainWindow, tabId)
}

// Getter
export const hasSidebarForTab = (tabId: string) => !!sidebars[tabId]
export const getSidebarWidth = (tabId: string) => sidebars[tabId]?.width ?? defaultWidth

// Function to be called from tab-manager when ipcMain receives drag events
let resizeScheduled = false

export const handleSidebarDrag = (mainWindow: BrowserWindow, tabId: string, deltaX: number) => {
  const sb = sidebars[tabId]
  if (!sb) return

  sb.width = Math.max(100, sb.width - deltaX)

  if (!resizeScheduled) {
    resizeScheduled = true
    setImmediate(() => {
      layoutSidebar(mainWindow, tabId)
      resizeScheduled = false
    })
  }
}
