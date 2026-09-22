// Pieces reused across more than one operation's schema.
import { z } from "zod";

export const handleSchema = z
  .string()
  .min(3, "At least 3 characters")
  .max(30, "At most 30 characters")
  .regex(/^[a-z0-9_]+$/, "Lowercase letters, numbers and underscores only");

export const coordSchema = z.object({
  lng: z.number().min(-180).max(180),
  lat: z.number().min(-90).max(90),
});

export const EXPENSE_CATEGORIES = [
  "fuel", "food", "stay", "tolls", "tickets", "activities", "transport", "other",
];
