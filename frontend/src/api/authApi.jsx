import { ENDPOINTS } from "../constants/endpoints.jsx";
import { api } from "./client.jsx";

export const login = (credentials) => api.post(ENDPOINTS.auth.login, credentials);
export const signup = (input) => api.post(ENDPOINTS.auth.signup, input);
export const logout = () => api.post(ENDPOINTS.auth.logout);
export const getMe = (signal) => api.get(ENDPOINTS.auth.me, signal);
