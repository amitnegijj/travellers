import { ENDPOINTS } from "../constants/endpoints.js";
import { api } from "./client.js";

export const login = (credentials) => api.post(ENDPOINTS.auth.login, credentials);
export const signup = (input) => api.post(ENDPOINTS.auth.signup, input);
export const logout = () => api.post(ENDPOINTS.auth.logout);
export const getMe = (signal) => api.get(ENDPOINTS.auth.me, signal);
