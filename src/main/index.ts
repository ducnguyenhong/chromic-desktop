import { electronApp, optimizer } from '@electron-toolkit/utils'
import { app } from 'electron'
import { createMainWindow } from './main-window'
import { registerTabIpc } from './tab-manager'

app.whenReady().then(() => {
  electronApp.setAppUserModelId('com.chromic')

  app.on('browser-window-created', (_, window) => {
    optimizer.watchWindowShortcuts(window)
  })

  const mainWindow = createMainWindow()
  registerTabIpc(mainWindow)

  app.on('activate', () => {
    if (createMainWindow().isDestroyed()) {
      createMainWindow()
    }
  })
})

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit()
  }
})
