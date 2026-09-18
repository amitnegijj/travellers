import { ENDPOINTS } from "../constants/endpoints.js";
import { api } from "./client.js";

/** `form` is a FormData carrying the file plus its downscaled dimensions. */
export const uploadImage = (form) => api.post(ENDPOINTS.media, form);
