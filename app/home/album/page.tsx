export const unstable_instant = { prefetch: "static" };

import { Suspense } from "react";
import { redirect } from "next/navigation";
import { getUserProfile } from "@/lib/controllers/UserController";
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
  const profileData = await getUserProfile();

  if (!profileData || !profileData.profile) {
    redirect("/auth/login");
  }

  const { profile, cards } = profileData;
  const username = profile.username ?? "Username";

  return (
    <AlbumWidget username={username} initialCards={cards} />
  );
}
