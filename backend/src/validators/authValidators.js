import { z } from "zod";
import { handleSchema } from "./shared.js";

export const signupSchema = z.object({
  email: z.string().email("Enter a valid email"),
  password: z.string().min(8, "At least 8 characters").max(200),
  handle: handleSchema,
  displayName: z.string().min(1, "Required").max(80),
});

export const loginSchema = z.object({
  email: z.string().email("Enter a valid email"),
  password: z.string().min(1, "Required"),
});
