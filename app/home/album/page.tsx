import { redirect } from "next/navigation";
import { getUserProfile } from "@/lib/controllers/UserController";
import { AlbumWidget } from "@/ui/widgets/album-widget";

export default async function AlbumPage() {
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
