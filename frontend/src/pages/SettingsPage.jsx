import { api } from "../api/client.js";
import { PageHeader, Skeleton } from "../components/ui/index.js";
import { useSession } from "../context/SessionContext.jsx";
import { useApi } from "../hooks/useApi.js";
import { useDocumentTitle } from "../hooks/useDocumentTitle.js";
import { ProfileForm } from "./ProfileForm.jsx";

export function SettingsPage() {
  useDocumentTitle("Edit profile");
  const { user } = useSession();

  const { data: profile, loading } = useApi(
    (signal) => (user ? api.get(`/api/v1/profiles/${user.handle}`, signal) : Promise.resolve(null)),
    [user?.handle]
  );

  return (
    <div className="mx-auto max-w-2xl">
      <PageHeader title="Edit profile" description="How you appear to other travellers." />
      {loading || !profile ? <Skeleton className="h-96 w-full" /> : <ProfileForm profile={profile} />}
    </div>
  );
}
