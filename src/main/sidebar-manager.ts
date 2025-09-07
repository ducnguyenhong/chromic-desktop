import { BrowserWindow, WebContentsView } from 'electron'
import { join } from 'path'

interface Sidebar {
  view: WebContentsView
  width: number
  separator?: WebContentsView
}

const sidebars: Record<string, Sidebar> = {} // key là tabId
const defaultWidth = 800
const separatorWidth = 1

// ================= OPEN / CLOSE =================
// ... phần import và interface giữ nguyên

export const openSidebar = (
  mainWindow: BrowserWindow,
  options: { url?: string; file?: string; tabId?: string },
  resizeTabCallback?: () => void
) => {
  const tabId = options.tabId
  if (!tabId) return

  if (sidebars[tabId]) closeSidebar(mainWindow, tabId)

  // Sidebar chính
  const sidebar = new WebContentsView({
    webPreferences: { sandbox: false }
  })
  sidebar.webContents.loadURL('about:blank')
  sidebar.webContents.once('dom-ready', () => {
    sidebar.webContents.insertCSS(`
      body { margin:0; overflow:auto; }
    `)
    if (options.url) sidebar.webContents.loadURL(options.url)
    else if (options.file)
      sidebar.webContents.loadFile(join(__dirname, `../renderer/${options.file}`))
  })
  mainWindow.contentView.addChildView(sidebar)

  // Separator
  const separator = new WebContentsView({ webPreferences: { sandbox: false } })
  separator.webContents.loadURL('about:blank')
  separator.webContents.once('dom-ready', () => {
    separator.webContents.insertCSS(`
      body { margin:0; background: #cccccc; }
    `)
  })
  mainWindow.contentView.addChildView(separator)

  sidebars[tabId] = { view: sidebar, width: defaultWidth, separator }

  layoutSidebar(mainWindow, tabId)

  if (resizeTabCallback) resizeTabCallback()
}

// Đóng sidebar
export const closeSidebar = (mainWindow: BrowserWindow, tabId: string) => {
  const sb = sidebars[tabId]
  if (!sb) return

  mainWindow.contentView.removeChildView(sb.view)
  sb.view.webContents.close()

  if (sb.separator) {
    mainWindow.contentView.removeChildView(sb.separator)
    sb.separator.webContents.close()
  }

  delete sidebars[tabId]
}

// ================= LAYOUT / RESIZE =================
export const layoutSidebar = (mainWindow: BrowserWindow, tabId: string) => {
  const sb = sidebars[tabId]
  if (!sb) return

  const bounds = mainWindow.getBounds()
  const y = 118
  const height = bounds.height - 134
  const sidebarX = bounds.width - sb.width - 16
  const separatorX = sidebarX - separatorWidth

  // Sidebar
  sb.view.setBounds({
    x: sidebarX,
    y,
    width: sb.width,
    height
  })

  // Separator
  if (sb.separator) {
    sb.separator.setBounds({
      x: separatorX,
      y,
      width: separatorWidth,
      height
    })
  }
}

// Resize sidebar
export const resizeSidebar = (mainWindow: BrowserWindow, tabId: string, newWidth: number) => {
  const sb = sidebars[tabId]
  if (!sb) return

  sb.width = newWidth
  layoutSidebar(mainWindow, tabId)
}

// ================= TAB SWITCH =================
export const onTabActivated = (mainWindow: BrowserWindow, tabId: string) => {
  // Ẩn tất cả sidebar + separator
  Object.values(sidebars).forEach((sb) => {
    mainWindow.contentView.removeChildView(sb.view)
    if (sb.separator) mainWindow.contentView.removeChildView(sb.separator)
  })

  const sb = sidebars[tabId]
  if (sb) {
    mainWindow.contentView.addChildView(sb.view)
    if (sb.separator) mainWindow.contentView.addChildView(sb.separator)
    layoutSidebar(mainWindow, tabId)
  }
}

// ================= GETTERS =================
export const hasSidebarForTab = (tabId: string) => !!sidebars[tabId]
export const getSidebarWidth = (tabId: string) => sidebars[tabId]?.width ?? defaultWidth
