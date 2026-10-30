import axios from "axios";

// Instance axios tunggal — sesi via cookie httpOnly, jadi wajib withCredentials
const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL || "http://localhost:4000/api",
  withCredentials: true,
});

export default api;
