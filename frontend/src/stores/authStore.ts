import axios from 'axios';
import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
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
  initialize: () => Promise<void>;
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set, get) => ({
      token: null,
      user: null,
      isAuthenticated: false,
      isLoading: false,
      error: null,

      initialize: async () => {
        const { token } = get();
        
        if (token) {
          console.log('Initializing auth with stored token');
          set({ isLoading: true });
          
          try {
            // Set auth headers with the stored token
            axios.defaults.headers.common['Authorization'] = `Bearer ${token}`;
            api.defaults.headers.common['Authorization'] = `Bearer ${token}`;
            
            // Try to fetch user profile with the stored token
            await get().fetchUserProfile();
            
            // If we get here, token was valid and profile was fetched
            console.log('Successfully initialized auth state from stored token');
          } catch (error) {
            console.error('Failed to initialize auth with stored token:', error);
            set({ 
              token: null, 
              user: null, 
              isAuthenticated: false,
              error: 'Session expired. Please login again.'
            });
            
            // Clear auth headers
            delete axios.defaults.headers.common['Authorization'];
            delete api.defaults.headers.common['Authorization'];
          } finally {
            set({ isLoading: false });
          }
        }
      },

      login: async (token: string) => {
        console.log('Login attempt with token:', token ? 'present' : 'missing');
        set({ isLoading: true, error: null });
        
        try {
          // Set the token first
          console.log('Setting token in state...');
          set({ token });
          
          // Set auth headers
          console.log('Setting auth headers...');
          axios.defaults.headers.common['Authorization'] = `Bearer ${token}`;
          api.defaults.headers.common['Authorization'] = `Bearer ${token}`;
          
          // Fetch user profile
          console.log('Fetching user profile...');
          await get().fetchUserProfile();
          
          // Get the current state
          const state = get();
          console.log('Current state after profile fetch:', {
            hasToken: !!state.token,
            hasUser: !!state.user
          });
          
          // Only set authenticated if we have both token and user data
          if (state.token && state.user) {
            console.log('Authentication successful, setting isAuthenticated to true');
            // Update state atomically
            set((state) => ({ 
              ...state,
              isAuthenticated: true,
              isLoading: false
            }));
            return; // Important: Return here after successful auth
          }
          
          // If we get here, something is missing
          console.error('Login failed: Missing token or user data');
          throw new Error('Login failed: Missing token or user data');
        } catch (error) {
          console.error('Login error:', error);
          // Clear everything on failure
          console.log('Clearing auth state due to login failure');
          set({ 
            error: 'Authentication failed. Please try again.',
            isAuthenticated: false,
            token: null,
            user: null,
            isLoading: false
          });
          // Clear auth headers
          delete axios.defaults.headers.common['Authorization'];
          delete api.defaults.headers.common['Authorization'];
          throw error;
        }
      },
      
      logout: async () => {
        console.log('Logout requested');
        set({ isLoading: true });
        
        try {
          // Only call logout endpoint if we're authenticated
          if (get().isAuthenticated) {
            console.log('Calling logout endpoint...');
            await api.post('/api/auth/logout');
          }
        } catch (error) {
          console.error('Logout error:', error);
        } finally {
          // Always clear auth state
          console.log('Clearing auth state after logout');
          set({
            token: null,
            user: null,
            isAuthenticated: false,
            isLoading: false,
            error: null
          });
          
          // Remove auth headers
          delete axios.defaults.headers.common['Authorization'];
          delete api.defaults.headers.common['Authorization'];
        }
      },
      
      fetchUserProfile: async () => {
        console.log('Fetching user profile...');
        try {
          const response = await api.get('/api/auth/profile');
          console.log('Profile fetch successful:', response.data);
          // Update state atomically
          set((state) => ({
            ...state,
            user: response.data.user,
            isAuthenticated: true
          }));
        } catch (error) {
          console.error('Error fetching user profile:', error);
          // Reset auth state on profile fetch failure
          console.log('Clearing auth state due to profile fetch failure');
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
      // Only persist the token
      partialize: (state) => ({ token: state.token }),
      storage: createJSONStorage(() => localStorage)
    }
  )
);
