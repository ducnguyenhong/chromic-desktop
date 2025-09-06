import { electronAPI } from '@electron-toolkit/preload'
import { contextBridge, ipcRenderer } from 'electron'

const tabs = {
  create: (url: string) => ipcRenderer.invoke('tabs:create', url),
  activate: (id: string) => ipcRenderer.invoke('tabs:activate', id),
  close: (id: string) => ipcRenderer.invoke('tabs:close', id),
  navigate: (id: string, url: string) => ipcRenderer.invoke('tabs:navigate', id, url),
  back: (id: string) => ipcRenderer.invoke('tabs:back', id),
  forward: (id: string) => ipcRenderer.invoke('tabs:forward', id),
  reload: (id: string) => ipcRenderer.invoke('tabs:reload', id),

  // Sự kiện một lần
  onCreated: (cb) => ipcRenderer.on('tabs:created', (_e, payload) => cb(payload)),
  onActivated: (cb) => ipcRenderer.on('tabs:activated', (_e, id) => cb(id)),
  onClosed: (cb) => ipcRenderer.on('tabs:closed', (_e, id) => cb(id)),
  // Quan trọng: cập nhật (title, url, isLoading, ...)
  onUpdated: (cb) => ipcRenderer.on('tabs:updated', (_e, payload) => cb(payload)),
  onSync: (cb) => ipcRenderer.on('tabs:sync', (_e, list) => cb(list)),

  openSettings: () => ipcRenderer.invoke('tabs:openSettings'),
  inspectCurrent: () => ipcRenderer.invoke('tabs:inspect'),

  navigateCurrent: (url: string) => ipcRenderer.invoke('tabs:navigateCurrent', url)
}

const reader = {
  toggle: () => ipcRenderer.invoke('reader:toggle'),
  resize: (delta: number) => ipcRenderer.invoke('reader:resize', delta)
}

const ui = {
  onFocusAddressBar: (cb: () => void) => ipcRenderer.on('ui:focus-address-bar', cb)
}

if (process.contextIsolated) {
  try {
    contextBridge.exposeInMainWorld('electron', electronAPI)
    contextBridge.exposeInMainWorld('tabs', tabs)
    contextBridge.exposeInMainWorld('reader', reader)
    contextBridge.exposeInMainWorld('ui', ui)
  } catch (error) {
    console.error(error)
  }
} else {
  // @ts-ignore
  window.electron = electronAPI
  // @ts-ignore
  window.tabs = tabs
  // @ts-ignore
  window.reader = reader
  // @ts-ignore
  window.ui = ui
}
