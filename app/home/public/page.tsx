export const unstable_instant = { prefetch: "static" };

import { Suspense } from "react";
import { redirect } from "next/navigation";
import { getUserProfile } from "@/lib/controllers/UserController";
import { getPublicPlayers } from "@/lib/controllers/FriendController";
import { getAllCats } from "@/lib/controllers/CardActions";
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
  const profileData = await getUserProfile();

  if (!profileData || !profileData.profile) {
    redirect("/auth/login");
  }

  const players = await getPublicPlayers();
  const allCats = await getAllCats();

  return (
    <section className="flex-grow">
      <PublicWidget players={players} totalCatsCount={allCats.length} />
    </section>
  );
}
