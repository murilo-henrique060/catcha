export const unstable_instant = {
  prefetch: "runtime",
  samples: [
    {
      params: { username: "test_username" }
    }
  ]
};

import { Suspense } from "react";
import { redirect, notFound } from "next/navigation";
import { getBasicProfile } from "@/lib/actions/UserController";
import { getUserCards } from "@/lib/actions/CardController";
import { AlbumWidget } from "@/ui/widgets/album-widget";
import { createSupabaseServerClient } from "@/lib/services/supabase/server";
import { AlbumSkeleton } from "@/ui/components/skeletons";

type PageProps = {
  params: Promise<{
    username: string;
  }>;
};

export default async function PublicPlayerAlbumPage({ params }: PageProps) {
  return (
    <Suspense fallback={<AlbumSkeleton />}>
      <PublicPlayerAlbumContent params={params} />
    </Suspense>
  );
}

async function PublicPlayerAlbumContent({ params }: { params: Promise<{ username: string }> }) {
  const resolvedParams = await params;
  const currentProfileData = await getBasicProfile();

  if (!currentProfileData || !currentProfileData.profile) {
    redirect("/auth/login");
  }

  // 1. Fetch target player profile by username
  const supabase = await createSupabaseServerClient();
  const { data: targetProfile, error } = await supabase
    .from('profiles')
    .select('id, username')
    .eq('username', resolvedParams.username)
    .maybeSingle();

  if (error || !targetProfile) {
    notFound();
  }

  // 2. Fetch target player's cards
  const cards = await getUserCards(targetProfile.id);

  return (
    <AlbumWidget username={targetProfile.username} initialCards={cards} backUrl="/home/public" />
  );
}
