import { redirect } from "next/navigation";
import { getUserProfile } from "@/lib/controllers/UserController";
import { getPublicPlayers } from "@/lib/controllers/FriendController";
import { getAllCats } from "@/lib/controllers/CardActions";
import { PublicoWidget } from "@/ui/widgets/publico-widget";

export default async function PublicoPage() {
  const profileData = await getUserProfile();

  if (!profileData || !profileData.profile) {
    redirect("/auth/login");
  }

  const players = await getPublicPlayers();
  const allCats = await getAllCats();

  return (
    <section className="flex-grow">
      <PublicoWidget players={players} totalCatsCount={allCats.length} />
    </section>
  );
}
