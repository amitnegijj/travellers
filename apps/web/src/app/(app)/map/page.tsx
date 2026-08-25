import type { Metadata } from "next";
import { PageHeader } from "@/components/ui";
import { query } from "@/lib/db";
import { MapExplorer } from "./map-explorer";

export const metadata: Metadata = { title: "Map" };
export const dynamic = "force-dynamic";

export default async function MapPage() {
  const [destinations, places] = await Promise.all([
    query(
      `select d.id, d.slug, d.name, d.region, d.cover_url as "coverUrl",
              st_x(d.centroid::geometry) as lng, st_y(d.centroid::geometry) as lat,
              (select count(*) from journeys j
                where j.destination_id = d.id and j.status='published')::int as "journeyCount"
         from destinations d`
    ),
    query(
      `select pl.id, pl.slug, pl.name, c.slug as "categorySlug",
              st_x(pl.location::geometry) as lng, st_y(pl.location::geometry) as lat
         from places pl left join place_categories c on c.id = pl.category_id`
    ),
  ]);

  return (
    <>
      <PageHeader
        title="Map"
        description="Every destination and place, plotted. Filter by what you're looking for."
      />
      <MapExplorer destinations={destinations as never[]} places={places as never[]} />
    </>
  );
}
