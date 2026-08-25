import { handler, ok } from "@/lib/api";
import { mapFeatures } from "@/server/places";

export const GET = handler(async () => ok(await mapFeatures()));
