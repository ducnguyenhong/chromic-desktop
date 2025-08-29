import { BrowserView, BrowserWindow, ipcMain } from 'electron'
import { join } from 'path'

interface Tab {
  id: string
  view: BrowserView
}

const tabs: Record<string, Tab> = {}
let activeTabId: string | null = null

export const createTab = (mainWindow: BrowserWindow, url: string): string => {
  const id = `tab-${Date.now()}`
  const view = new BrowserView({
    webPreferences: {
      preload: join(__dirname, '../preload/index.js'),
      sandbox: false
    }
  })

  view.webContents.loadURL(url)

  // Khi bắt đầu load
  view.webContents.on('did-start-loading', () => {
    const url = view.webContents.getURL()
    mainWindow.webContents.send('tabs:updated', {
      id,
      patch: {
        isLoading: true,
        url // update luôn url khi bắt đầu load
      }
    })
  })

  // Khi load xong
  view.webContents.on('did-stop-loading', () => {
    const url = view.webContents.getURL()
    const title = view.webContents.getTitle()
    const patch: Partial<Tab> = { isLoading: false }

    if (title && title.trim() !== '') patch.title = title
    if (url && url.trim() !== '') patch.url = url

    mainWindow.webContents.send('tabs:updated', {
      id,
      ...patch
    })
  })

  // Khi title thay đổi
  view.webContents.on('page-title-updated', (_, title) => {
    mainWindow.webContents.send('tabs:updated', {
      id,
      patch: { title }
    })
  })

  // Khi tiêu đề thay đổi → cập nhật tab.title
  view.webContents.on('page-title-updated', (_, title) => {
    mainWindow.webContents.send('tabs:updated', {
      id,
      patch: { title }
    })
  })

  tabs[id] = { id, view }
  setActiveTab(mainWindow, id)

  return id
}

export const setActiveTab = (mainWindow: BrowserWindow, id: string) => {
  if (!tabs[id]) return
  activeTabId = id

  // dùng API ổn định, 1 view tại một thời điểm
  mainWindow.setBrowserView(tabs[id].view)
  resizeActiveTab(mainWindow)

  // thông báo renderer
  mainWindow.webContents.send('tabs:activated', id)
}

export const closeTab = (mainWindow: BrowserWindow, id: string) => {
  if (!tabs[id]) return

  const view = tabs[id].view
  // gỡ view hiện tại nếu đang hiển thị chính
  if (activeTabId === id) {
    // clear view khỏi window
    // không có API remove khi dùng setBrowserView, nên thay bằng set null
    // nhiều bản Electron cho phép setBrowserView(null); nếu TS cằn nhằn có thể ép kiểu any
    try {
      // @ts-expect-error: một số d.ts cũ không khai báo null
      mainWindow.setBrowserView(null)
    } catch {
      ;(mainWindow as any).setBrowserView(null)
    }
  }

  // destroy nội dung
  try {
    // dùng webContents.destroy; nếu d.ts cảnh báo có thể ép kiểu any
    ;(view.webContents as any).destroy()
  } catch {
    // fallback nếu cần
  }

  delete tabs[id]
  // thông báo renderer
  mainWindow.webContents.send('tabs:closed', id)

  // chọn tab khác nếu còn
  if (activeTabId === id) {
    const remaining = Object.keys(tabs)
    if (remaining.length > 0) {
      setActiveTab(mainWindow, remaining[remaining.length - 1])
    } else {
      activeTabId = null
    }
  }
}

export const resizeActiveTab = (mainWindow: BrowserWindow) => {
  if (!activeTabId) return
  const bounds = mainWindow.getBounds()
  tabs[activeTabId].view.setBounds({
    x: 0,
    y: 120, // 👈 tăng thêm (ví dụ 120px thay vì 100px)
    width: bounds.width,
    height: bounds.height - 120
  })
  tabs[activeTabId].view.setAutoResize({ width: true, height: true })
}

// IPC để renderer gọi
export const registerTabIpc = (mainWindow: BrowserWindow) => {
  ipcMain.handle('tabs:create', (_, url: string) => createTab(mainWindow, url))
  ipcMain.handle('tabs:activate', (_, id: string) => setActiveTab(mainWindow, id))
  ipcMain.handle('tabs:close', (_, id: string) => closeTab(mainWindow, id))

  ipcMain.handle('tabs:navigate', (_, id: string, url: string) => navigateTab(id, url))
  ipcMain.handle('tabs:back', (_, id: string) => goBack(id))
  ipcMain.handle('tabs:forward', (_, id: string) => goForward(id))
  ipcMain.handle('tabs:reload', (_, id: string) => reloadTab(id))

  // resize khi thay đổi kích thước cửa sổ
  mainWindow.on('resize', () => resizeActiveTab(mainWindow))
  mainWindow.on('maximize', () => resizeActiveTab(mainWindow))
  mainWindow.on('unmaximize', () => resizeActiveTab(mainWindow))
}

export const getAllTabs = () => {
  return Object.values(tabs).map((t) => ({
    id: t.id,
    url: t.view.webContents.getURL(),
    title: t.view.webContents.getTitle() || 'New Tab'
  }))
}

export const navigateTab = (id: string, url: string) => {
  if (!tabs[id]) return
  tabs[id].view.webContents.loadURL(url)
}

export const goBack = (id: string) => {
  if (tabs[id]?.view.webContents.canGoBack()) {
    tabs[id].view.webContents.goBack()
  }
}

export const goForward = (id: string) => {
  if (tabs[id]?.view.webContents.canGoForward()) {
    tabs[id].view.webContents.goForward()
  }
}

export const reloadTab = (id: string) => {
  tabs[id]?.view.webContents.reload()
}
