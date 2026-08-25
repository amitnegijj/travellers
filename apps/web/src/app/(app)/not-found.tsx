import { Compass } from "lucide-react";
import { EmptyState, LinkButton } from "@/components/ui";

export default function NotFound() {
  return (
    <div className="py-12">
      <EmptyState
        icon={<Compass size={32} />}
        title="This page doesn't exist"
        description="The route you followed leads nowhere. Happens on the road too."
        action={<LinkButton href="/">Back to the feed</LinkButton>}
      />
    </div>
  );
}
