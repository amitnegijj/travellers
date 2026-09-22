import { ENDPOINTS } from "../constants/endpoints.jsx";
import { api } from "./client.jsx";

export const getMapFeatures = (signal) => api.get(ENDPOINTS.map, signal);
