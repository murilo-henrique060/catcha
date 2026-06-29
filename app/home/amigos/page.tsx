import { redirect } from "next/navigation";
import { getUserProfile } from "@/lib/controllers/UserController";
import { getFriendships } from "@/lib/controllers/FriendController";
import { AmigosWidget } from "@/ui/widgets/amigos-widget";

export default async function AmigosPage() {
  const profileData = await getUserProfile();

  if (!profileData || !profileData.profile) {
    redirect("/auth/login");
  }

  const friendships = await getFriendships();

  return (
    <section className="flex-grow">
      <AmigosWidget initialFriendships={friendships} />
    </section>
  );
}
