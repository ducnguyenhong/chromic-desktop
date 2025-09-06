import { is } from '@electron-toolkit/utils'
import { BrowserWindow, ipcMain, WebContentsView } from 'electron'
import { join } from 'path'

interface Tab {
  id: string
  view: WebContentsView
  windowId?: number
  isLoading?: boolean
  title?: string
}

const tabs: Record<string, Tab> = {}
let activeTabId: string | null = null

let sidePanel: WebContentsView | null = null
let readerWidth = 400

export const createTab = (mainWindow: BrowserWindow): string => {
  const id = `tab-${Date.now()}`
  const view = new WebContentsView({
    webPreferences: {
      preload: join(__dirname, '../preload/index.js'),
      sandbox: false
    }
  })

  if (is.dev && process.env.ELECTRON_RENDERER_URL) {
    view.webContents.loadURL(`${process.env.ELECTRON_RENDERER_URL}/chromic_home.html`)
  } else {
    view.webContents.loadFile(join(__dirname, '../renderer/chromic_home.html'))
  }
  // Khi bắt đầu load
  view.webContents.on('did-start-loading', () => {
    mainWindow.webContents.send('tabs:updated', {
      id,
      patch: { isLoading: true }
    })
  })

  // Khi URL thay đổi (redirect / click link)
  view.webContents.on('did-navigate', (_event, url) => {
    mainWindow.webContents.send('tabs:updated', {
      id,
      patch: { url }
    })
  })

  // Khi URL thay đổi trong trang (SPA / #hash)
  view.webContents.on('did-navigate-in-page', (_event, url) => {
    mainWindow.webContents.send('tabs:updated', {
      id,
      patch: { url }
    })
  })

  // Khi load xong
  view.webContents.on('did-stop-loading', () => {
    const title = view.webContents.getTitle()
    const patch: Partial<Tab> = { isLoading: false }
    if (title && title.trim() !== '') patch.title = title

    mainWindow.webContents.send('tabs:updated', { id, patch })
  })

  // Khi title thay đổi
  view.webContents.on('page-title-updated', (_event, title) => {
    mainWindow.webContents.send('tabs:updated', {
      id,
      patch: { title }
    })
  })

  // Khi load fail (VD: back trong lúc đang tải, DNS fail, cancel request...)
  view.webContents.on('did-fail-load', () => {
    mainWindow.webContents.send('tabs:updated', {
      id,
      patch: { isLoading: false }
    })
  })

  tabs[id] = { id, view, windowId: mainWindow.id }
  setActiveTab(mainWindow, id)

  // --- Giật lại focus ---
  const stealBackFocus = () => {
    mainWindow.webContents.focus()
    mainWindow.webContents.send('ui:focus-address-bar')
  }

  // Giật ngay sau khi addChildView
  setTimeout(stealBackFocus, 0)

  // Và giật lại khi view load (phòng trường hợp bị cướp muộn)
  view.webContents.once('did-start-loading', () => setTimeout(stealBackFocus, 0))
  view.webContents.once('dom-ready', () => setTimeout(stealBackFocus, 0))

  return id
}

export const setActiveTab = (mainWindow: BrowserWindow, id: string) => {
  if (!tabs[id]) return
  activeTabId = id

  // Sau đó add view mới
  const view = tabs[id].view
  mainWindow.contentView.addChildView(view)
  resizeActiveTab(mainWindow)

  mainWindow.webContents.send('tabs:activated', id)
}

export const closeTab = (mainWindow: BrowserWindow, id: string) => {
  if (!tabs[id]) return
  const view = tabs[id].view

  // if (activeTabId === id) {
  mainWindow.contentView.removeChildView(view)
  view.webContents.close()
  // }

  delete tabs[id]
  mainWindow.webContents.send('tabs:closed', id)

  if (activeTabId === id) {
    const remaining = Object.keys(tabs)
    if (remaining.length > 0) setActiveTab(mainWindow, remaining[remaining.length - 1])
    else activeTabId = null
  }
}

export const resizeActiveTab = (mainWindow: BrowserWindow) => {
  if (!activeTabId) return
  const bounds = mainWindow.getBounds()
  tabs[activeTabId].view.setBounds({
    x: 0,
    y: 118, // chừa cho tab bar + URL bar
    width: bounds.width - 16,
    height: bounds.height - 134
  })
  // tabs[activeTabId].view.setAutoResize({ width: true, height: true })
}

// Navigate / Back / Forward / Reload
export const navigateTab = (id: string, url: string) => {
  if (!tabs[id]) return
  tabs[id].view.webContents.loadURL(url)
}

export const goBack = (id: string) => {
  if (tabs[id]?.view.webContents.navigationHistory.canGoBack())
    tabs[id].view.webContents.navigationHistory.goBack()
}

export const goForward = (id: string) => {
  if (tabs[id]?.view.webContents.navigationHistory.canGoForward())
    tabs[id].view.webContents.navigationHistory.goForward()
}

export const reloadTab = (id: string) => {
  tabs[id]?.view.webContents.reload()
}

// Từ home chuyển hướng load url
export const navigateCurrent = (url: string) => {
  if (!activeTabId) return
  const tab = tabs[activeTabId]
  if (tab) {
    tab.view.webContents.loadURL(url)
  }
}

// Tear-off tab: di chuyển sang cửa sổ mới
export const tearOffTab = (id: string) => {
  if (!tabs[id]) return
  const tab = tabs[id]
  // const oldWindowId = tab.windowId

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
  resizeActiveTab(newWindow)

  // sync trạng thái sang renderer
  newWindow.webContents.send('tabs:sync', [
    {
      id: tab.id,
      url: tab.view.webContents.getURL(),
      title: tab.view.webContents.getTitle(),
      windowId: newWindow.id
    }
  ])
}

function toggleReaderMode(mainWindow: BrowserWindow) {
  if (!mainWindow) return

  if (sidePanel) {
    // Tắt reader
    mainWindow.contentView.removeChildView(sidePanel)
    sidePanel.webContents.close()
    sidePanel = null

    const bounds = mainWindow.getBounds()
    const mainView = activeTabId ? tabs[activeTabId].view : null
    if (mainView) {
      mainView.setBounds({
        x: 0,
        y: 118,
        width: bounds.width - 16,
        height: bounds.height - 134
      })
    }
    return
  }

  // Bật reader
  sidePanel = new WebContentsView({
    webPreferences: {
      preload: join(__dirname, '../preload/index.js'),
      sandbox: false
    }
  })
  mainWindow.contentView.addChildView(sidePanel)

  const bounds = mainWindow.getBounds()
  const leftWidth = bounds.width - readerWidth
  const mainView = activeTabId ? tabs[activeTabId].view : null

  if (mainView) {
    mainView.setBounds({
      x: 0,
      y: 118,
      width: leftWidth,
      height: bounds.height - 134
    })
  }

  sidePanel.setBounds({
    x: leftWidth,
    y: 118,
    width: readerWidth,
    height: bounds.height - 134
  })
  if (is.dev && process.env.ELECTRON_RENDERER_URL) {
    sidePanel.webContents.loadURL(`${process.env.ELECTRON_RENDERER_URL}/chromic_settings.html`)
  } else {
    sidePanel.webContents.loadFile(join(__dirname, '../renderer/chromic_settings.html'))
  }
}

function resizeReader(mainWindow: BrowserWindow, delta: number) {
  if (!mainWindow || !sidePanel) return
  const bounds = mainWindow.getBounds()

  const minWidth = 200
  const maxWidth = bounds.width - 200
  readerWidth = Math.min(Math.max(readerWidth + delta, minWidth), maxWidth)

  const mainView = activeTabId ? tabs[activeTabId].view : null
  if (mainView) {
    mainView.setBounds({
      x: 0,
      y: 118,
      width: bounds.width - readerWidth,
      height: bounds.height - 134
    })
  }

  sidePanel.setBounds({
    x: bounds.width - readerWidth,
    y: 118,
    width: readerWidth,
    height: bounds.height - 134
  })
}

const inspectActiveTab = () => {
  if (!activeTabId) return
  const tab = tabs[activeTabId]
  if (tab?.view) {
    tab.view.webContents.openDevTools()
  }
}

export const getAllTabs = () => {
  return Object.values(tabs).map((t) => ({
    id: t.id,
    url: t.view.webContents.getURL(),
    title: t.view.webContents.getTitle() || 'Chromic',
    windowId: t.windowId
  }))
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

// IPC
export const registerTabIpc = (mainWindow: BrowserWindow) => {
  ipcMain.handle('tabs:create', () => createTab(mainWindow))
  ipcMain.handle('tabs:activate', (_, id: string) => setActiveTab(mainWindow, id))
  ipcMain.handle('tabs:close', (_, id: string) => closeTab(mainWindow, id))
  ipcMain.handle('tabs:navigate', (_, id: string, url: string) => navigateTab(id, url))
  ipcMain.handle('tabs:back', (_, id: string) => goBack(id))
  ipcMain.handle('tabs:forward', (_, id: string) => goForward(id))
  ipcMain.handle('tabs:reload', (_, id: string) => reloadTab(id))
  ipcMain.handle('tabs:tearOff', (_, id: string) => tearOffTab(id))
  ipcMain.handle('tabs:openSettings', () => openSettingsTab(mainWindow))
  ipcMain.handle('tabs:inspect', () => inspectActiveTab())
  ipcMain.handle('tabs:navigateCurrent', (_e, url: string) => navigateCurrent(url))

  ipcMain.handle('reader:toggle', () => toggleReaderMode(mainWindow))
  ipcMain.handle('reader:resize', (_e, delta: number) => resizeReader(mainWindow, delta))

  mainWindow.on('resize', () => resizeActiveTab(mainWindow))
  mainWindow.on('maximize', () => resizeActiveTab(mainWindow))
  mainWindow.on('unmaximize', () => resizeActiveTab(mainWindow))
}
