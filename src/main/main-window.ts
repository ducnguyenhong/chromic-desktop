import { is } from '@electron-toolkit/utils'
import { BrowserWindow } from 'electron'
import { join } from 'path'
import { createTab, getAllTabs } from './tab-manager'
import { HOME_PAGE_URL } from './utils/const'

export const createMainWindow = (): BrowserWindow => {
  const mainWindow = new BrowserWindow({
    width: 1820,
    height: 980,
    minWidth: 640,
    minHeight: 640,
    show: false,
    autoHideMenuBar: true,
    webPreferences: {
      preload: join(__dirname, '../preload/index.js'),
      sandbox: false
    },
    titleBarOverlay: {
      color: '#e6e6e6',
      symbolColor: '#262626',
      height: 38
    },
    titleBarStyle: 'hidden'
  })

  mainWindow.on('ready-to-show', () => {
    mainWindow.show()
    mainWindow.maximize()

    mainWindow.on('ready-to-show', () => {
      mainWindow.show()
      // gửi danh sách tab hiện có xuống renderer
      mainWindow.webContents.send('tabs:sync', getAllTabs())
    })
  })

  if (is.dev && process.env['ELECTRON_RENDERER_URL']) {
    mainWindow.loadURL(process.env['ELECTRON_RENDERER_URL'])
  } else {
    mainWindow.loadFile(join(__dirname, '../renderer/index.html'))
  }

  // Mở sẵn 1 tab khi app start
  createTab(mainWindow, HOME_PAGE_URL)

  return mainWindow
}
