import { redirect } from "next/navigation";
import { getUserProfile } from "@/lib/controllers/UserController";
import { DRAW_INTERVAL_MS, getCardsCountPerRarity } from "@/lib/controllers/CardController";
import { StatsWidget } from "@/ui/widgets/stats";
import { DrawArea } from "@/ui/widgets/draw-area";

export default async function HomePage() {
  const profileData = await getUserProfile();

  if (!profileData || !profileData.profile) {
    redirect("/auth/login");
  }

  const rarityTotals = await getCardsCountPerRarity();

  return (
    <section className="flex-grow flex py-4">
      <div className="flex-grow-9 flex flex-col items-center justify-center gap-4">
        <DrawArea drawIntervalMs={DRAW_INTERVAL_MS} />
      </div>
      <div className="flex-grow-3 flex items-center justify-center">
        <StatsWidget rarityTotals={rarityTotals} />
      </div>
    </section>
  );
}
