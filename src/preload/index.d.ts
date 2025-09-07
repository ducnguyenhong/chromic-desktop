import { ElectronAPI } from '@electron-toolkit/preload'

declare global {
  interface Window {
    electron: ElectronAPI
    api: unknown
    tabs: any
    reader: any
    ui: any
    sidebar: any
    setupSeparator: any
  }
}
