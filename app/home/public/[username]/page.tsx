import { redirect, notFound } from "next/navigation";
import { getUserProfile } from "@/lib/controllers/UserController";
import { getUserCards } from "@/lib/controllers/CardController";
import { AlbumWidget } from "@/ui/widgets/album-widget";
import { createSupabaseServerClient } from "@/lib/services/supabase/server";

type PageProps = {
  params: Promise<{
    username: string;
  }>;
};

export default async function PublicPlayerAlbumPage({ params }: PageProps) {
  const resolvedParams = await params;
  const currentProfileData = await getUserProfile();

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
    <AlbumWidget username={targetProfile.username} initialCards={cards} />
  );
}
