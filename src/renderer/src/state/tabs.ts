import { HOME_PAGE_URL } from '@renderer/utils/const'
import { create } from 'zustand'

export type Tab = {
  id: string
  title: string
  url: string
  isLoading: boolean
  secure: boolean
  windowId?: number
}

type TabState = {
  tabs: Tab[]
  activeId: string | null
  addTab: (tab: { id: string; title?: string; url?: string; windowId?: number }) => void
  closeTab: (id: string) => void
  setActive: (id: string) => void
  updateTab: (id: string, patch: Partial<Tab>) => void
  reorderTabs: (sourceId: string, targetId: string) => void
  moveTabToWindow: (id: string, newWindowId: number) => void
}

export const useTabs = create<TabState>((set, get) => ({
  tabs: [],
  activeId: null,

  addTab: ({ id, title, url, windowId }) => {
    const exists = get().tabs.some((t) => t.id === id)
    if (exists) return
    const newTab: Tab = {
      id,
      title: title ?? 'New Tab',
      url: url ?? HOME_PAGE_URL,
      isLoading: false,
      secure: true,
      windowId
    }
    set((state) => ({ tabs: [...state.tabs, newTab], activeId: id }))
  },

  closeTab: (id) => {
    set((state) => {
      const tabs = state.tabs.filter((t) => t.id !== id)
      const activeId =
        state.activeId === id ? (tabs.length ? tabs[tabs.length - 1].id : null) : state.activeId
      return { tabs, activeId }
    })
  },

  setActive: (id) => set({ activeId: id }),

  updateTab: (id, patch) => {
    set((state) => ({
      tabs: state.tabs.map((t) => (t.id === id ? { ...t, ...patch } : t))
    }))
  },

  reorderTabs: (sourceId, targetId) => {
    set((state) => {
      const tabs = [...state.tabs]
      const sourceIndex = tabs.findIndex((t) => t.id === sourceId)
      const targetIndex = tabs.findIndex((t) => t.id === targetId)
      if (sourceIndex === -1 || targetIndex === -1) return {}
      const [removed] = tabs.splice(sourceIndex, 1)
      tabs.splice(targetIndex, 0, removed)
      return { tabs }
    })
  },

  moveTabToWindow: (id, newWindowId) => {
    set((state) => ({
      tabs: state.tabs.map((t) =>
        t.id === id
          ? {
              ...t,
              windowId: newWindowId
            }
          : t
      )
    }))
  }
}))

// Đồng bộ từ main process
if (typeof window !== 'undefined' && (window as any).tabs) {
  window.tabs.onCreated(({ id, url, title, windowId }) => {
    useTabs.getState().addTab({ id, url, title, windowId })
  })

  window.tabs.onActivated((id: string) => {
    useTabs.getState().setActive(id)
  })

  window.tabs.onClosed((id: string) => {
    useTabs.getState().closeTab(id)
  })

  window.tabs.onSync((list: { id: string; url: string; title: string; windowId?: number }[]) => {
    list.forEach((tab) => {
      useTabs.getState().addTab(tab)
    })
    if (list.length > 0) {
      useTabs.getState().setActive(list[list.length - 1].id)
    }
  })

  window.tabs.onUpdated(({ id, patch }) => {
    useTabs.getState().updateTab(id, patch)
  })
}
