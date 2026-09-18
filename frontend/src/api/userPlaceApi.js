import { ENDPOINTS } from "../constants/endpoints.js";
import { api } from "./client.js";

export const listPlaces = (handle, signal) => api.get(ENDPOINTS.profiles.places(handle), signal);
export const createPlace = (handle, input) => api.post(ENDPOINTS.profiles.places(handle), input);
export const updatePlace = (id, patch) => api.patch(ENDPOINTS.userPlaces.byId(id), patch);
export const deletePlace = (id) => api.delete(ENDPOINTS.userPlaces.byId(id));
