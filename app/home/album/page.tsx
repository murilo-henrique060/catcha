export const unstable_instant = { prefetch: "static" };

import { Suspense } from "react";
import { redirect } from "next/navigation";
import { getBasicProfile } from "@/lib/actions/UserController";
import { getUserCards } from "@/lib/actions/CardController";
import { AlbumWidget } from "@/ui/widgets/album-widget";
import { AlbumSkeleton } from "@/ui/components/skeletons";

export default async function AlbumPage() {
  return (
    <Suspense fallback={<AlbumSkeleton />}>
      <AlbumContent />
    </Suspense>
  );
}

async function AlbumContent() {
  const profileData = await getBasicProfile();

  if (!profileData || !profileData.profile) {
    redirect("/auth/login");
  }

  const { profile } = profileData;
  const cards = await getUserCards(profile.id);
  const username = profile.username ?? "Username";

  return (
    <AlbumWidget username={username} initialCards={cards} />
  );
}
