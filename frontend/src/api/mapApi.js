import { ENDPOINTS } from "../constants/endpoints.js";
import { api } from "./client.js";

export const getMapFeatures = (signal) => api.get(ENDPOINTS.map, signal);
