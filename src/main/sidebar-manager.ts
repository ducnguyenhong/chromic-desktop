import { BrowserWindow, WebContentsView } from 'electron'
import { join } from 'path'
import { getActiveTabId, resizeTab } from './tab-manager'

interface Sidebar {
  view: WebContentsView
  width: number
}

const sidebars: Record<string, Sidebar> = {} // key là tabId
const defaultWidth: number = 400

// ================= OPEN / CLOSE =================
export const openSidebar = (
  mainWindow: BrowserWindow,
  options: { url?: string; file?: string; tabId?: string }
) => {
  const tabId = options.tabId
  if (!tabId) return

  // Nếu sidebar đã tồn tại cho tab này, remove trước
  if (sidebars[tabId]) {
    closeSidebar(mainWindow, tabId)
  }

  const sidebar = new WebContentsView({
    webPreferences: {
      preload: join(__dirname, '../preload/index.js'),
      sandbox: false
    }
  })

  if (options.url) sidebar.webContents.loadURL(options.url)
  else if (options.file)
    sidebar.webContents.loadFile(join(__dirname, `../renderer/${options.file}`))

  sidebars[tabId] = { view: sidebar, width: defaultWidth }

  // Nếu tab hiện tại là tabId, attach sidebar
  const activeId = getActiveTabId()
  if (activeId === tabId) {
    mainWindow.contentView.addChildView(sidebar)
    layoutSidebar(mainWindow, tabId)
  }
}

export const closeSidebar = (mainWindow: BrowserWindow, tabId: string) => {
  const sb = sidebars[tabId]
  if (!sb) return

  mainWindow.contentView.removeChildView(sb.view)
  sb.view.webContents.close()
  delete sidebars[tabId]

  // Nếu tab đang active, resize tab để full width
  const activeId = getActiveTabId()
  if (activeId === tabId) {
    resizeTab(mainWindow, activeId)
  }
}

// ================= LAYOUT / RESIZE =================
export const layoutSidebar = (mainWindow: BrowserWindow, tabId: string) => {
  const sb = sidebars[tabId]
  if (!sb) return

  const bounds = mainWindow.getBounds()
  const x = bounds.width - sb.width
  const y = 118
  const height = bounds.height - 134

  sb.view.setBounds({ x, y, width: sb.width, height })

  // Resize tab hiện tại để nhường chỗ sidebar
  const activeId = getActiveTabId()
  if (activeId === tabId) {
    resizeTab(mainWindow, activeId)
  }
}

export const resizeSidebar = (mainWindow: BrowserWindow, tabId: string, newWidth: number) => {
  const sb = sidebars[tabId]
  if (!sb) return

  sb.width = newWidth
  layoutSidebar(mainWindow, tabId)
}

// ================= TAB SWITCH =================
export const onTabActivated = (mainWindow: BrowserWindow, tabId: string) => {
  // Ẩn tất cả sidebar
  Object.values(sidebars).forEach((sb) => {
    mainWindow.contentView.removeChildView(sb.view)
  })

  // Hiển thị sidebar tab đang active
  const sb = sidebars[tabId]
  if (sb) {
    mainWindow.contentView.addChildView(sb.view)
    layoutSidebar(mainWindow, tabId)
  }
}

// ================= GETTERS =================
export const hasSidebarForTab = (tabId: string) => !!sidebars[tabId]
export const getSidebarWidth = (tabId: string) => sidebars[tabId]?.width ?? defaultWidth
