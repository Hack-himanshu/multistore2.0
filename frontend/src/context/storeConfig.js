import { create } from 'zustand';
import { storeService } from '../services/api';

const useStoreConfig = create((set, get) => ({
  store: null,
  isLoading: false,
  error: null,
  isSaving: false,

  fetchMyStore: async () => {
    set({ isLoading: true, error: null });
    try {
      const { data } = await storeService.getMyStore();
      set({ store: data.store, isLoading: false });
      return data.store;
    } catch (err) {
      set({ error: err.response?.data?.message || 'Failed to load store', isLoading: false });
    }
  },

  updateStore: async (updates) => {
    set({ isSaving: true });
    try {
      const { data } = await storeService.updateMyStore(updates);
      set({ store: data.store, isSaving: false });
      return { success: true };
    } catch (err) {
      set({ isSaving: false });
      return { success: false, message: err.response?.data?.message };
    }
  },

  updateTheme: async (themeSettings) => {
    set({ isSaving: true });
    try {
      const { data } = await storeService.updateTheme(themeSettings);
      set((state) => ({
        store: { ...state.store, themeSettings: data.themeSettings },
        isSaving: false,
      }));
      return { success: true };
    } catch (err) {
      set({ isSaving: false });
      return { success: false, message: err.response?.data?.message };
    }
  },

  updateHomepage: async (homepageSections) => {
    set({ isSaving: true });
    try {
      const { data } = await storeService.updateHomepage(homepageSections);
      set((state) => ({
        store: { ...state.store, homepageSections: data.homepageSections },
        isSaving: false,
      }));
      return { success: true };
    } catch (err) {
      set({ isSaving: false });
      return { success: false, message: err.response?.data?.message };
    }
  },

  // Local optimistic updates (for live theme preview)
  setThemeLocally: (themeSettings) => {
    set((state) => ({
      store: { ...state.store, themeSettings: { ...state.store?.themeSettings, ...themeSettings } },
    }));
  },

  setSectionLocally: (section, value) => {
    set((state) => ({
      store: {
        ...state.store,
        homepageSections: {
          ...state.store?.homepageSections,
          [section]: { ...state.store?.homepageSections?.[section], ...value },
        },
      },
    }));
  },
}));

export default useStoreConfig;
