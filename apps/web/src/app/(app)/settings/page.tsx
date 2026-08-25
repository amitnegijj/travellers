import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { PageHeader } from "@/components/ui";
import { getSessionUser } from "@/lib/auth";
import { queryOne } from "@/lib/db";
import { ProfileForm } from "./profile-form";

export const metadata: Metadata = { title: "Edit profile" };
export const dynamic = "force-dynamic";

export default async function SettingsPage() {
  const user = await getSessionUser();
  if (!user) redirect("/login");

  const profile = await queryOne<{
    handle: string; displayName: string; bio: string | null;
    location: string | null; avatarUrl: string | null; isPrivate: boolean;
  }>(
    `select handle, display_name as "displayName", bio, location,
            avatar_url as "avatarUrl", is_private as "isPrivate"
       from profiles where id = $1`,
    [user.id]
  );

  if (!profile) redirect("/login");

  return (
    <div className="mx-auto max-w-2xl">
      <PageHeader title="Edit profile" description="How you appear to other travellers." />
      <ProfileForm profile={profile} />
    </div>
  );
}
