import axios from 'axios';
import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import api from '../services/api';

interface User {
  id: string;
  username: string;
  discriminator: string;
  avatar: string;
  email: string;
  bots: any[];
}

interface AuthState {
  token: string | null;
  user: User | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  error: string | null;
  login: (token: string) => Promise<void>;
  logout: () => Promise<void>;
  fetchUserProfile: () => Promise<void>;
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set, get) => ({
      token: null,
      user: null,
      isAuthenticated: false,
      isLoading: false,
      error: null,

      login: async (token: string) => {
        set({ isLoading: true, error: null });
        
        try {
          // Set the token and Authorization header
          set({ token });
          axios.defaults.headers.common['Authorization'] = `Bearer ${token}`;
          api.defaults.headers.common['Authorization'] = `Bearer ${token}`;
          
          // Fetch user data
          await get().fetchUserProfile();
          
          // Only set isAuthenticated if profile fetch succeeds
          set({ isAuthenticated: true, isLoading: false });
        } catch (error) {
          console.error('Login error:', error);
          set({ 
            error: 'Authentication failed. Please try again.',
            isAuthenticated: false,
            token: null,
            isLoading: false
          });
          // Clear auth header on failure
          delete axios.defaults.headers.common['Authorization'];
          delete api.defaults.headers.common['Authorization'];
        }
      },
      
      logout: async () => {
        set({ isLoading: true });
        
        try {
          // Call logout endpoint using our API service
          if (get().isAuthenticated) {
            await api.post('/api/auth/logout');
          }
        } catch (error) {
          console.error('Logout error:', error);
        } finally {
          // Clear auth state regardless of API success
          set({
            token: null,
            user: null,
            isAuthenticated: false,
            isLoading: false,
            error: null
          });
          
          // Remove auth header
          delete axios.defaults.headers.common['Authorization'];
          delete api.defaults.headers.common['Authorization'];
        }
      },
      
      fetchUserProfile: async () => {
        try {
          // Use our API service
          const response = await api.get('/api/auth/profile');
          set({ user: response.data.user });
        } catch (error) {
          console.error('Error fetching user profile:', error);
          // Reset authentication state on profile fetch failure
          set({ 
            isAuthenticated: false,
            token: null,
            user: null
          });
          throw error;
        }
      }
    }),
    {
      name: 'auth-storage',
      // Only store the token in localStorage, everything else is session-specific
      partialize: (state) => ({ token: state.token }),
    }
  )
);
