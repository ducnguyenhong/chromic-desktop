import { is } from '@electron-toolkit/utils'
import { BrowserWindow, ipcMain, WebContentsView } from 'electron'
import { join } from 'path'
import {
  closeSidebar,
  getSidebarWidth,
  hasSidebarForTab,
  onTabActivated,
  openSidebar,
  resizeSidebar
} from './sidebar-manager'

export interface Tab {
  id: string
  view: WebContentsView
  windowId?: number
  isLoading?: boolean
  title?: string
  url?: string
}

const tabs: Record<string, Tab> = {}
let activeTabId: string | null = null

// ================= TAB CORE =================
export const createTab = (mainWindow: BrowserWindow, url?: string): string => {
  const id = `tab-${Date.now()}`
  const view = new WebContentsView({
    webPreferences: {
      preload: join(__dirname, '../preload/index.js'),
      sandbox: false
    }
  })

  const loadDefaultFile = () => {
    if (is.dev && process.env.ELECTRON_RENDERER_URL) {
      view.webContents.loadURL(`${process.env.ELECTRON_RENDERER_URL}/chromic_home.html`)
    } else {
      view.webContents.loadFile(join(__dirname, '../renderer/chromic_home.html'))
    }
  }

  if (!url) loadDefaultFile()
  else view.webContents.loadURL(url)

  // --- Events ---
  view.webContents.on('did-start-loading', () => {
    mainWindow.webContents.send('tabs:updated', { id, patch: { isLoading: true } })
  })
  view.webContents.on('did-stop-loading', () => {
    const title = view.webContents.getTitle()
    const patch: Partial<Tab> = { isLoading: false }
    if (title) patch.title = title
    mainWindow.webContents.send('tabs:updated', { id, patch })
  })
  view.webContents.on('page-title-updated', (_e, title) => {
    mainWindow.webContents.send('tabs:updated', { id, patch: { title } })
  })
  view.webContents.on('did-navigate', (_e, newUrl) => {
    mainWindow.webContents.send('tabs:updated', { id, patch: { url: newUrl } })
  })
  view.webContents.on('did-navigate-in-page', (_e, newUrl) => {
    mainWindow.webContents.send('tabs:updated', { id, patch: { url: newUrl } })
  })
  view.webContents.on('did-fail-load', () => {
    mainWindow.webContents.send('tabs:updated', { id, patch: { isLoading: false } })
  })

  tabs[id] = { id, view, windowId: mainWindow.id, title: 'New Tab', url }
  setActiveTab(mainWindow, id)

  // Focus address bar
  const focusAddress = () => {
    mainWindow.webContents.focus()
    mainWindow.webContents.send('ui:focus-address-bar')
  }
  setTimeout(focusAddress, 0)
  view.webContents.once('dom-ready', () => setTimeout(focusAddress, 0))

  return id
}

// ================= GETTERS =================
export const getTabById = (id: string) => tabs[id] ?? null
export const getActiveTabId = () => activeTabId
export const getAllTabs = () =>
  Object.values(tabs).map((t) => ({
    id: t.id,
    url: t.view.webContents.getURL(),
    title: t.view.webContents.getTitle() || 'Chromic',
    windowId: t.windowId
  }))

// ================= TAB LAYOUT =================
export const setActiveTab = (mainWindow: BrowserWindow, id: string) => {
  if (!tabs[id]) return
  activeTabId = id

  // Remove all tab views
  Object.values(tabs).forEach((t) => mainWindow.contentView.removeChildView(t.view))

  // Add active tab view
  const tab = tabs[id]
  mainWindow.contentView.addChildView(tab.view)

  // Layout sidebar nếu tab hiện tại có
  if (hasSidebarForTab(id)) {
    onTabActivated(mainWindow, id)
  }

  resizeActiveTab(mainWindow)
  mainWindow.webContents.send('tabs:activated', id)
}

export const resizeTab = (mainWindow: BrowserWindow, id: string) => {
  const tab = tabs[id]
  if (!tab) return

  const bounds = mainWindow.getBounds()
  const y = 118
  const height = bounds.height - 134
  const sidebarWidth = hasSidebarForTab(id) ? getSidebarWidth(id) : 0
  const width = bounds.width - sidebarWidth - 16

  tab.view.setBounds({ x: 0, y, width, height })
}

export const resizeActiveTab = (mainWindow: BrowserWindow) => {
  if (!activeTabId) return
  resizeTab(mainWindow, activeTabId)
}

export const resizeAllTabs = (mainWindow: BrowserWindow) => {
  Object.keys(tabs).forEach((id) => resizeTab(mainWindow, id))
}

// ================= TAB NAVIGATION =================
export const navigateTab = (id: string, url: string) => {
  const tab = tabs[id]
  if (!tab) return
  tab.view.webContents.loadURL(url)
}
export const navigateCurrent = (url: string) => {
  if (!activeTabId) return
  navigateTab(activeTabId, url)
}
export const goBack = (id: string) => {
  const tab = tabs[id]
  if (tab?.view.webContents.navigationHistory.canGoBack())
    tab.view.webContents.navigationHistory.goBack()
}
export const goForward = (id: string) => {
  const tab = tabs[id]
  if (tab?.view.webContents.navigationHistory.canGoForward())
    tab.view.webContents.navigationHistory.goForward()
}
export const reloadTab = (id: string) => {
  const tab = tabs[id]
  tab?.view.webContents.reload()
}

// ================= TAB CLOSE =================
export const closeTab = (mainWindow: BrowserWindow, id: string) => {
  const tab = tabs[id]
  if (!tab) return

  // Close sidebar nếu có
  if (hasSidebarForTab(id)) closeSidebar(mainWindow, id)

  mainWindow.contentView.removeChildView(tab.view)
  tab.view.webContents.close()
  delete tabs[id]

  // Set active tab mới nếu cần
  if (activeTabId === id) {
    const remaining = Object.keys(tabs)
    if (remaining.length > 0) setActiveTab(mainWindow, remaining[remaining.length - 1])
    else activeTabId = null
  }

  mainWindow.webContents.send('tabs:closed', id)
}

// ================= TEAR-OFF / SETTINGS =================
export const tearOffTab = (id: string) => {
  const tab = tabs[id]
  if (!tab) return

  const newWindow = new BrowserWindow({
    width: 900,
    height: 700,
    webPreferences: {
      preload: join(__dirname, '../preload/index.js'),
      sandbox: false
    }
  })
  newWindow.show()
  newWindow.contentView.addChildView(tab.view)
  tab.windowId = newWindow.id
  resizeTab(newWindow, id)

  newWindow.webContents.send('tabs:sync', [
    {
      id: tab.id,
      url: tab.view.webContents.getURL(),
      title: tab.view.webContents.getTitle(),
      windowId: newWindow.id
    }
  ])
}

export const openSettingsTab = (mainWindow: BrowserWindow) => {
  const existing = Object.values(tabs).find((t) => t.title === 'Settings')
  if (existing) {
    setActiveTab(mainWindow, existing.id)
    return existing.id
  }

  const id = `tab-${Date.now()}`
  const view = new WebContentsView({
    webPreferences: { preload: join(__dirname, '../preload/index.js'), sandbox: false }
  })

  if (is.dev && process.env.ELECTRON_RENDERER_URL) {
    view.webContents.loadURL(`${process.env.ELECTRON_RENDERER_URL}/chromic_settings.html`)
  } else {
    view.webContents.loadFile(join(__dirname, '../renderer/chromic_settings.html'))
  }

  tabs[id] = { id, view, windowId: mainWindow.id, title: 'Settings' }
  mainWindow.contentView.addChildView(view)
  setActiveTab(mainWindow, id)
  mainWindow.webContents.send('tabs:updated', { id, patch: { title: 'Settings' } })
  return id
}

// ================= INSPECT =================
export const inspectActiveTab = () => {
  if (!activeTabId) return
  const tab = tabs[activeTabId]
  tab?.view.webContents.openDevTools()
}

// ================= IPC =================
export const registerTabIpc = (mainWindow: BrowserWindow) => {
  ipcMain.handle('tabs:create', () => createTab(mainWindow))
  ipcMain.handle('tabs:activate', (_e, id: string) => setActiveTab(mainWindow, id))
  ipcMain.handle('tabs:close', (_e, id: string) => closeTab(mainWindow, id))
  ipcMain.handle('tabs:navigate', (_e, id: string, url: string) => navigateTab(id, url))
  ipcMain.handle('tabs:back', (_e, id: string) => goBack(id))
  ipcMain.handle('tabs:forward', (_e, id: string) => goForward(id))
  ipcMain.handle('tabs:reload', (_e, id: string) => reloadTab(id))
  ipcMain.handle('tabs:tearOff', (_e, id: string) => tearOffTab(id))
  ipcMain.handle('tabs:openSettings', () => openSettingsTab(mainWindow))
  ipcMain.handle('tabs:inspect', () => inspectActiveTab())
  ipcMain.handle('tabs:navigateCurrent', (_e, url: string) => navigateCurrent(url))

  mainWindow.on('resize', () => resizeActiveTab(mainWindow))
  mainWindow.on('maximize', () => resizeActiveTab(mainWindow))
  mainWindow.on('unmaximize', () => resizeActiveTab(mainWindow))
}

export const registerSidebarIpc = (mainWindow: BrowserWindow) => {
  ipcMain.handle('sidebar:open', (_e, target: { url?: string; file?: string; tabId: string }) =>
    openSidebar(mainWindow, target)
  )

  ipcMain.handle('sidebar:close', (_e, tabId: string) => closeSidebar(mainWindow, tabId))

  ipcMain.handle('sidebar:resize', (_e, tabId: string, width: number) =>
    resizeSidebar(mainWindow, tabId, width)
  )

  ipcMain.handle('sidebar:has', (_e, tabId: string) => hasSidebarForTab(tabId))
}
