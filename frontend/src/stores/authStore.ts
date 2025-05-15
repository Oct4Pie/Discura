import axios from "axios";
import { create } from "zustand";
import { persist, createJSONStorage } from "zustand/middleware";
import { User } from "../types/user";
import { AuthenticationService, configureAuthHeaders } from "../api";

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
          console.log("[Auth] Initializing auth with stored token");
          set({ isLoading: true });

          try {
            // Instead of directly calling the API and not storing data,
            // call our fetchUserProfile method which properly sets the user data
            await get().fetchUserProfile();
            
            // Profile fetch successful, user is authenticated
            console.log("[Auth] Successfully initialized auth state from stored token");
            set((state) => ({
              ...state,
              isAuthenticated: true,
            }));
          } catch (error) {
            console.error(
              "[Auth] Failed to initialize auth with stored token:",
              error,
            );
            set({
              token: null,
              user: null,
              isAuthenticated: false,
              error: "Session expired. Please login again.",
            });

            // Make sure to clear token in both places
            configureAuthHeaders(null);
          } finally {
            set({ isLoading: false });
          }
        }
      },

      login: async (token: string) => {
        console.log(
          "[Auth] Login attempt with token:",
          token ? token.substring(0, 10) + "..." : "missing",
        );
        set({ isLoading: true, error: null });

        try {
          // Validate token format
          if (!token || token.trim() === "") {
            throw new Error("Invalid token");
          }

          // Set the token first - this is our single source of truth
          console.log("[Auth] Setting token in state...");
          set({ token });

          // No need to manually configure headers for AuthenticationService
          // It will use the token from the store via the TOKEN resolver

          // Fetch user profile
          console.log("[Auth] Fetching user profile...");
          await get().fetchUserProfile();

          // Get the current state
          const state = get();
          console.log("[Auth] Current state after profile fetch:", {
            hasToken: !!state.token,
            hasUser: !!state.user,
          });

          // Only set authenticated if we have both token and user data
          if (state.token && state.user) {
            console.log(
              "[Auth] Authentication successful, setting isAuthenticated to true",
            );
            // Update state atomically
            set((state) => ({
              ...state,
              isAuthenticated: true,
              isLoading: false,
            }));
            return; // Important: Return here after successful auth
          }

          // If we get here, something is missing
          console.error("[Auth] Login failed: Missing token or user data");
          throw new Error("Login failed: Missing token or user data");
        } catch (error) {
          console.error("[Auth] Login error:", error);
          // Clear everything on failure
          console.log("[Auth] Clearing auth state due to login failure");
          set({
            error: "Authentication failed. Please try again.",
            isAuthenticated: false,
            token: null,
            user: null,
            isLoading: false,
          });

          // Make sure to clear token in both places
          configureAuthHeaders(null);

          throw error;
        }
      },

      logout: async () => {
        console.log("[Auth] Logout requested");
        set({ isLoading: true });

        try {
          // Only call logout endpoint if we're authenticated
          if (get().isAuthenticated) {
            console.log(
              "[Auth] Calling logout endpoint using AuthenticationService...",
            );
            await AuthenticationService.logout();
          }
        } catch (error) {
          console.error("[Auth] Logout error:", error);
        } finally {
          // Always clear auth state
          console.log("[Auth] Clearing auth state after logout");
          set({
            token: null,
            user: null,
            isAuthenticated: false,
            isLoading: false,
            error: null,
          });

          // Make sure to clear token in both places
          configureAuthHeaders(null);
        }
      },

      fetchUserProfile: async () => {
        console.log("[Auth] Fetching user profile...");
        try {
          const response = await AuthenticationService.getProfile();
          console.log("[Auth] Profile fetch successful:", response);

          // Add type guard to check if the response is UserProfileResponseDto
          if ("user" in response) {
            // Update state atomically with the user from the response
            set((state) => ({
              ...state,
              user: response.user,
              isAuthenticated: !!state.token, // Only authenticate if we have a token
            }));
          } else {
            throw new Error("Invalid profile response format");
          }
        } catch (error) {
          console.error("[Auth] Error fetching user profile:", error);
          // Reset auth state on profile fetch failure
          console.log(
            "[Auth] Clearing auth state due to profile fetch failure",
          );
          set({
            isAuthenticated: false,
            token: null,
            user: null,
          });

          // Make sure to clear token in both places
          configureAuthHeaders(null);

          throw error;
        }
      },
    }),
    {
      name: "auth-storage",
      // Only persist the token
      partialize: (state) => ({ token: state.token }),
      storage: createJSONStorage(() => localStorage),
    },
  ),
);
