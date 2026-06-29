import { redirect } from "next/navigation";
import { getUserProfile } from "@/lib/controllers/UserController";
import { getAllCats } from "@/lib/controllers/CardActions";
import { ShopWidget } from "@/ui/widgets/shop-widget";

export default async function ShopPage() {
  const profileData = await getUserProfile();

  if (!profileData || !profileData.profile) {
    redirect("/auth/login");
  }

  const allCats = await getAllCats();

  return (
    <ShopWidget allCats={allCats} />
  );
}
