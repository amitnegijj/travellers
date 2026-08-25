import { AppError, handler, ok, parseBody } from "@/lib/api";
import { getSessionUser, requireUser } from "@/lib/auth";
import { queryOne } from "@/lib/db";
import { profileUpdateSchema } from "@/lib/validation";

type Ctx = { params: Promise<{ handle: string }> };

export const GET = handler(async (_req: Request, ctx: Ctx) => {
  const { handle } = await ctx.params;
  const viewer = await getSessionUser();

  const profile = await queryOne(
    `select p.id, p.handle, p.display_name as "displayName", p.bio, p.location,
            p.avatar_url as "avatarUrl", p.is_private as "isPrivate", p.created_at as "createdAt",
            (select count(*) from follows f where f.following_id = p.id)::int as "followerCount",
            (select count(*) from follows f where f.follower_id  = p.id)::int as "followingCount",
            (select count(*) from journeys j
              where j.author_id = p.id and j.status = 'published')::int as "journeyCount",
            case when $2::uuid is null then false
                 else exists (select 1 from follows f
                               where f.follower_id = $2::uuid and f.following_id = p.id)
            end as "isFollowing"
       from profiles p
      where p.handle = $1`,
    [handle, viewer?.id ?? null]
  );

  if (!profile) throw new AppError("not_found", "No such profile");
  return ok(profile);
});

export const PATCH = handler(async (req: Request, ctx: Ctx) => {
  const { handle } = await ctx.params;
  const user = await requireUser();

  if (user.handle.toLowerCase() !== handle.toLowerCase()) {
    throw new AppError("forbidden", "You can only edit your own profile");
  }

  const input = await parseBody(req, profileUpdateSchema);

  const updated = await queryOne(
    `update profiles
        set display_name = $2,
            bio          = $3,
            location     = $4,
            avatar_url   = nullif($5, ''),
            is_private   = coalesce($6, is_private)
      where id = $1
      returning id, handle, display_name as "displayName", bio, location,
                avatar_url as "avatarUrl", is_private as "isPrivate"`,
    [user.id, input.displayName, input.bio ?? null, input.location ?? null,
     input.avatarUrl ?? null, input.isPrivate ?? null]
  );

  return ok(updated);
});
