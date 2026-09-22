// Vercel serverless entry point. Every /api/* request is rewritten here (see
// vercel.json) and handed to the same Express app `npm run dev` runs locally.
import { createApp } from "../backend/src/app.js";

export default createApp();
