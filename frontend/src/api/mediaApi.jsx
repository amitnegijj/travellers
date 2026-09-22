import { ENDPOINTS } from "../constants/endpoints.jsx";
import { api } from "./client.jsx";

/** `form` is a FormData carrying the file plus its downscaled dimensions. */
export const uploadImage = (form) => api.post(ENDPOINTS.media, form);
