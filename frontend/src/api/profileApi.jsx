import { ENDPOINTS } from "../constants/endpoints.jsx";
import { api } from "./client.jsx";

export const getProfile = (handle, signal) => api.get(ENDPOINTS.profiles.byHandle(handle), signal);
export const updateProfile = (handle, patch) => api.patch(ENDPOINTS.profiles.byHandle(handle), patch);
