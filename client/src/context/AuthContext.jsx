import { createContext, useContext } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import api from "../lib/axios.js";

const AuthContext = createContext(null);

// Sumber kebenaran sesi: query /auth/me via TanStack Query (dipakai ProtectedRoute)
export function AuthProvider({ children }) {
  const queryClient = useQueryClient();

  const { data, isLoading } = useQuery({
    queryKey: ["me"],
    queryFn: async () => (await api.get("/auth/me")).data.data,
    retry: false, // 401 = belum login, bukan error jaringan
    staleTime: 5 * 60 * 1000,
  });

  const user = data ?? null;

  // Login: server set cookie httpOnly, lalu simpan user ke cache "me"
  const login = async (credentials) => {
    const res = await api.post("/auth/login", credentials);
    queryClient.setQueryData(["me"], res.data.data);
    return res.data.data;
  };

  // Logout: hapus cookie di server + kosongkan cache user
  const logout = async () => {
    try {
      await api.post("/auth/logout");
    } finally {
      queryClient.setQueryData(["me"], null);
    }
  };

  return <AuthContext.Provider value={{ user, isLoading, login, logout }}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth harus dipakai di dalam <AuthProvider>");
  return ctx;
}
