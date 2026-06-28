import { redirect } from "next/navigation";

import { getUserProfile } from "@/lib/controllers/UserController";
import { NavbarWidget } from "@/ui/widgets/navbar";
import { DRAW_INTERVAL_MS, getCardsCountPerRarity } from "@/lib/controllers/CardController";
import { StatsWidget } from "@/ui/widgets/stats";
import { DrawArea } from "@/ui/widgets/draw-area";

export default async function HomePage() {
  const profileData = await getUserProfile();

  if (!profileData || !profileData.profile) {
    redirect("/auth/login");
  }

  const { profile } = profileData;
  const username = profile.username ?? "Username";
  const rarityTotals = await getCardsCountPerRarity();

  return (
    <main className="flex flex-col min-h-screen bg-[#F7F5F7]">
      <NavbarWidget username={username} coins={profile.money} />
      <section className="flex-grow flex py-4">
        <div className="flex-grow-9 flex flex-col items-center justify-center gap-4">
          <DrawArea drawIntervalMs={DRAW_INTERVAL_MS} />
        </div>
        <div className="flex-grow-3 flex items-center justify-center">
          <StatsWidget rarityTotals={rarityTotals} />
        </div>
      </section>
    </main>
  );
}

