// One schema per operation, matching frontend/src/lib/validation.js so the
// API route and the client form never drift on input shape. The two copies
// aren't linked (each app installs standalone, no shared workspace package)
// — if you change a rule here, change it there too.
import { z } from "zod";

export const handleSchema = z
  .string()
  .min(3, "At least 3 characters")
  .max(30, "At most 30 characters")
  .regex(/^[a-z0-9_]+$/, "Lowercase letters, numbers and underscores only");

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

export const profileUpdateSchema = z.object({
  displayName: z.string().min(1, "Required").max(80),
  bio: z.string().max(500).nullish(),
  location: z.string().max(120).nullish(),
  avatarUrl: z.string().url().nullish().or(z.literal("")),
  isPrivate: z.boolean().optional(),
});

const coord = z.object({ lng: z.number().min(-180).max(180), lat: z.number().min(-90).max(90) });

export const stopSchema = z.object({
  name: z.string().min(1, "Required").max(120),
  note: z.string().max(1000).nullish(),
  lng: z.number().min(-180).max(180).nullish(),
  lat: z.number().min(-90).max(90).nullish(),
  arrivedOn: z.string().nullish(),
});

export const EXPENSE_CATEGORIES = [
  "fuel", "food", "stay", "tolls", "tickets", "activities", "transport", "other",
];

export const expenseSchema = z.object({
  category: z.enum(EXPENSE_CATEGORIES).default("other"),
  label: z.string().max(120).nullish(),
  // Rupees in the UI, minor units on the wire. Never a float.
  amountMinor: z.number().int().min(0).max(1_000_000_000),
  spentOn: z.string().nullish(),
});

export const tipSchema = z.object({
  kind: z.enum(["tip", "warning"]).default("tip"),
  body: z.string().min(1, "Required").max(1000),
});

export const journeyCreateSchema = z.object({
  title: z.string().min(3, "At least 3 characters").max(160),
  summary: z.string().max(4000).nullish(),
  coverUrl: z.string().nullish(),
  originName: z.string().max(120).nullish(),
  origin: coord.nullish(),
  destinationName: z.string().max(120).nullish(),
  destination: coord.nullish(),
  destinationId: z.string().uuid().nullish(),
  distanceM: z.number().int().min(0).max(50_000_000).nullish(),
  durationMin: z.number().int().min(0).max(1_000_000).nullish(),
  startDate: z.string().nullish(),
  endDate: z.string().nullish(),
  travelStyle: z.string().max(40).nullish(),
  difficulty: z.enum(["easy", "moderate", "hard"]).nullish(),
  vehicle: z.string().max(80).nullish(),
  bestSeason: z.array(z.string().max(12)).max(12).default([]),
  stops: z.array(stopSchema).max(60).default([]),
  expenses: z.array(expenseSchema).max(100).default([]),
  tips: z.array(tipSchema).max(40).default([]),
  mediaIds: z.array(z.string().uuid()).max(30).default([]),
  publish: z.boolean().default(false),
});

// `.partial()` alone is not enough: the create schema's `.default([])` survives
// it, so a patch that only changes the title would arrive with empty arrays and
// wipe every stop, expense, tip and photo. Here absence must mean "leave alone".
export const journeyUpdateSchema = journeyCreateSchema.partial().extend({
  title: z.string().min(3).max(160).optional(),
  bestSeason: z.array(z.string().max(12)).max(12).optional(),
  stops: z.array(stopSchema).max(60).optional(),
  expenses: z.array(expenseSchema).max(100).optional(),
  tips: z.array(tipSchema).max(40).optional(),
  mediaIds: z.array(z.string().uuid()).max(30).optional(),
  publish: z.boolean().optional(),
});

export const commentSchema = z.object({
  body: z.string().min(1, "Say something").max(2000),
});

// ------------------------------------------------- personal travel map pins

export const userPlaceCreateSchema = z.object({
  name: z.string().min(1, "Give the place a name").max(120),
  note: z.string().max(2000).nullish(),
  lng: z.number().min(-180).max(180),
  lat: z.number().min(-90).max(90),
  photoUrl: z.string().nullish(),
  // Defaults to private: the safe choice for someone's location history.
  visibility: z.enum(["public", "private"]).default("private"),
  visitedOn: z.string().nullish(),
  destinationId: z.string().uuid().nullish(),
});

export const userPlaceUpdateSchema = z.object({
  name: z.string().min(1).max(120).optional(),
  note: z.string().max(2000).nullish(),
  visibility: z.enum(["public", "private"]).optional(),
  visitedOn: z.string().nullish(),
});
