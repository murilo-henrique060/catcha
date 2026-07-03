export const unstable_instant = { prefetch: "static" };

import { Suspense } from "react";
import { redirect } from "next/navigation";
import { getBasicProfile } from "@/lib/controllers/UserController";
import { getCardsCountPerRarity } from "@/lib/controllers/CardController";
import { DRAW_INTERVAL_MS } from "@/lib/controllers/core/CardController";
import { StatsWidget } from "@/ui/widgets/stats";
import { DrawArea } from "@/ui/widgets/draw-area";
import { HomeSkeleton } from "@/ui/components/skeletons";

export default async function HomePage() {
  return (
    <Suspense fallback={<HomeSkeleton />}>
      <HomeContent />
    </Suspense>
  );
}

async function HomeContent() {
  const profileData = await getBasicProfile();

  if (!profileData || !profileData.profile) {
    redirect("/auth/login");
  }

  const rarityTotals = await getCardsCountPerRarity();
  const serverTime = new Date().toISOString();

  return (
    <section className="flex-grow flex py-4">
      <div className="flex-grow-9 flex flex-col items-center justify-center gap-4">
        <DrawArea drawIntervalMs={DRAW_INTERVAL_MS} serverTime={serverTime} />
      </div>
      <div className="flex-grow-3 flex items-center justify-center">
        <StatsWidget rarityTotals={rarityTotals} />
      </div>
    </section>
  );
}
