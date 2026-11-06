import { create } from "zustand";

interface User {
  id: string;
  name: string;
  email: string;
  role: "candidate" | "recruiter";
}

interface AuthState {
  user: User | null;
  token: string | null;
  isAuthenticated: boolean;
  login: (userData: User, token: string) => void;
  logout: () => void;
  hydrate: () => void;
}

const useAuthStore = create<AuthState>((set) => ({
  user: null,
  token: null,
  isAuthenticated: false,

  login: (userData, token) => {
    localStorage.setItem("token", token);
    localStorage.setItem("user", JSON.stringify(userData));
    set({ user: userData, token, isAuthenticated: true });
  },

  logout: () => {
    localStorage.removeItem("token");
    localStorage.removeItem("user");
    set({ user: null, token: null, isAuthenticated: false });
  },

  hydrate: () => {
    if (typeof window !== "undefined") {
      const token = localStorage.getItem("token");
      const user = localStorage.getItem("user");
      if (token && user) {
        set({ user: JSON.parse(user), token, isAuthenticated: true });
      }
    }
  },
}));

export default useAuthStore;