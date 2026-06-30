export const unstable_instant = { prefetch: "static" };

import { Suspense } from "react";
import { redirect } from "next/navigation";
import { getBasicProfile } from "@/lib/controllers/UserController";
import { getAllCats } from "@/lib/controllers/CardActions";
import { ShopWidget } from "@/ui/widgets/shop-widget";
import { ShopSkeleton } from "@/ui/components/skeletons";

export default async function ShopPage() {
  return (
    <Suspense fallback={<ShopSkeleton />}>
      <ShopContent />
    </Suspense>
  );
}

async function ShopContent() {
  const profileData = await getBasicProfile();

  if (!profileData || !profileData.profile) {
    redirect("/auth/login");
  }

  const allCats = await getAllCats();

  return (
    <ShopWidget allCats={allCats} />
  );
}
