import { z } from "zod";

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
