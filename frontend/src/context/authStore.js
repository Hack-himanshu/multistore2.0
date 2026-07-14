import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { authService } from '../services/api';

const useAuthStore = create(
  persist(
    (set, get) => ({
      user: null,
      token: null,
      store: null,
      isAuthenticated: false,
      isLoading: false,
      error: null,

      // ── Actions ──────────────────────────────────────────────────────────────

      register: async (formData) => {
        set({ isLoading: true, error: null });
        try {
          const { data } = await authService.register(formData);
          localStorage.setItem('ms_token', data.token);
          set({
            user: data.user,
            token: data.token,
            isAuthenticated: true,
            isLoading: false,
          });
          return { success: true, user: data.user };
        } catch (err) {
          const message = err.response?.data?.message || 'Registration failed';
          set({ error: message, isLoading: false });
          return { success: false, message };
        }
      },

      login: async (credentials) => {
        set({ isLoading: true, error: null });
        try {
          const { data } = await authService.login(credentials);
          localStorage.setItem('ms_token', data.token);
          set({
            user: data.user,
            token: data.token,
            isAuthenticated: true,
            isLoading: false,
          });
          return { success: true, user: data.user };
        } catch (err) {
          const message = err.response?.data?.message || 'Login failed';
          set({ error: message, isLoading: false });
          return { success: false, message };
        }
      },

      logout: () => {
        localStorage.removeItem('ms_token');
        set({ user: null, token: null, store: null, isAuthenticated: false, error: null });
      },

      fetchMe: async () => {
        const token = localStorage.getItem('ms_token');
        if (!token) return;
        set({ isLoading: true });
        try {
          const { data } = await authService.getMe();
          set({
            user: data.user,
            store: data.user.store,
            isAuthenticated: true,
            isLoading: false,
          });
        } catch {
          set({ isLoading: false, isAuthenticated: false });
          localStorage.removeItem('ms_token');
        }
      },

      setStore: (store) => set({ store }),

      clearError: () => set({ error: null }),
    }),
    {
      name: 'ms_auth',
      partialize: (state) => ({
        user: state.user,
        token: state.token,
        isAuthenticated: state.isAuthenticated,
      }),
    }
  )
);

export default useAuthStore;
