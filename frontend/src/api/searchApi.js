import { ENDPOINTS } from "../constants/endpoints.js";
import { api } from "./client.js";

export const search = (term, signal) =>
  api.get(`${ENDPOINTS.search}?q=${encodeURIComponent(term)}`, signal);
