import { z } from "zod";
import { coordSchema, EXPENSE_CATEGORIES } from "./shared.js";

export const stopSchema = z.object({
  name: z.string().min(1, "Required").max(120),
  note: z.string().max(1000).nullish(),
  lng: z.number().min(-180).max(180).nullish(),
  lat: z.number().min(-90).max(90).nullish(),
  arrivedOn: z.string().nullish(),
});

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
  origin: coordSchema.nullish(),
  destinationName: z.string().max(120).nullish(),
  destination: coordSchema.nullish(),
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
