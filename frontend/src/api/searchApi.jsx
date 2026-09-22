import { ENDPOINTS } from "../constants/endpoints.jsx";
import { api } from "./client.jsx";

export const search = (term, signal) =>
  api.get(`${ENDPOINTS.search}?q=${encodeURIComponent(term)}`, signal);
