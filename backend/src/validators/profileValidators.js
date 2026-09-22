import { z } from "zod";

export const profileUpdateSchema = z.object({
  displayName: z.string().min(1, "Required").max(80),
  bio: z.string().max(500).nullish(),
  location: z.string().max(120).nullish(),
  avatarUrl: z.string().url().nullish().or(z.literal("")),
  isPrivate: z.boolean().optional(),
});
