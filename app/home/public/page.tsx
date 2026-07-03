export const unstable_instant = { prefetch: "static" };

import { Suspense } from "react";
import { redirect } from "next/navigation";
import { getBasicProfile } from "@/lib/actions/UserController";
import { getPublicPlayers } from "@/lib/actions/FriendController";
import { getAllCats } from "@/lib/actions/CardActions";
import { PublicWidget } from "@/ui/widgets/public-widget";
import { PublicSkeleton } from "@/ui/components/skeletons";

export default async function PublicPage() {
  return (
    <Suspense fallback={<PublicSkeleton />}>
      <PublicContent />
    </Suspense>
  );
}

async function PublicContent() {
  const profileData = await getBasicProfile();

  if (!profileData || !profileData.profile) {
    redirect("/auth/login");
  }

  const players = await getPublicPlayers();
  const allCats = await getAllCats();

  return (
    <section className="flex-grow">
      <PublicWidget players={players} totalCatsCount={allCats.length} currentUserRole={profileData.profile.role} />
    </section>
  );
}
