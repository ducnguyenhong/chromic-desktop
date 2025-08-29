import { create } from 'zustand'

export type Tab = {
  id: string
  title: string
  url: string
  isLoading: boolean
  secure: boolean
}

type TabState = {
  tabs: Tab[]
  activeId: string | null
  addTab: (tab: { id: string; title?: string; url?: string }) => void
  closeTab: (id: string) => void
  setActive: (id: string) => void
  updateTab: (id: string, patch: Partial<Tab>) => void
}

const HOMEPAGE = 'https://www.google.com'

export const useTabs = create<TabState>((set, get) => ({
  tabs: [],
  activeId: null,

  addTab: ({ id, title, url }) => {
    const exists = get().tabs.some((t) => t.id === id)
    if (exists) return
    const newTab: Tab = {
      id,
      title: title ?? 'New Tab',
      url: url ?? HOMEPAGE,
      isLoading: true,
      secure: true
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
  }
}))

// Đồng bộ từ main process
if (typeof window !== 'undefined' && (window as any).tabs) {
  window.tabs.onCreated(({ id, url, title }) => {
    useTabs.getState().addTab({ id, url, title })
  })

  window.tabs.onActivated((id: string) => {
    useTabs.getState().setActive(id)
  })

  window.tabs.onClosed((id: string) => {
    useTabs.getState().closeTab(id)
  })

  window.tabs.onSync((list: { id: string; url: string; title: string }[]) => {
    list.forEach((tab) => {
      useTabs.getState().addTab(tab)
    })
    if (list.length > 0) {
      useTabs.getState().setActive(list[list.length - 1].id)
    }
  })

  window.tabs.onUpdated(({ id, title, url, isLoading }) => {
    const patch: Partial<Tab> = {}
    if (typeof title === 'string' && title.length > 0) patch.title = title
    if (typeof url === 'string' && url.length > 0) patch.url = url
    if (typeof isLoading === 'boolean') patch.isLoading = isLoading

    if (Object.keys(patch).length > 0) {
      useTabs.getState().updateTab(id, patch)
    }
  })
}
