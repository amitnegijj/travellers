import { ENDPOINTS } from "../constants/endpoints.js";
import { api } from "./client.js";

export const getProfile = (handle, signal) => api.get(ENDPOINTS.profiles.byHandle(handle), signal);
export const updateProfile = (handle, patch) => api.patch(ENDPOINTS.profiles.byHandle(handle), patch);
