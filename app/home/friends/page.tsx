export const unstable_instant = { prefetch: "static" };

import { Suspense } from "react";
import { redirect } from "next/navigation";
import { getBasicProfile } from "@/lib/actions/UserController";
import { getFriendships } from "@/lib/actions/FriendController";
import { FriendsWidget } from "@/ui/widgets/friends-widget";
import { FriendsSkeleton } from "@/ui/components/skeletons";

export default async function FriendsPage() {
  return (
    <Suspense fallback={<FriendsSkeleton />}>
      <FriendsContent />
    </Suspense>
  );
}

import { getActiveTrades } from "@/lib/actions/TradeController";
import { getGiftsHistory } from "@/lib/actions/GiftController";

async function FriendsContent() {
  const profileData = await getBasicProfile();

  if (!profileData || !profileData.profile) {
    redirect("/auth/login");
  }

  const profileId = profileData.profile.id;

  const [friendships, activeTrades, giftsHistory] = await Promise.all([
    getFriendships(),
    getActiveTrades(profileId),
    getGiftsHistory(profileId)
  ]);

  return (
    <section className="flex-grow">
      <FriendsWidget 
        initialFriendships={friendships} 
        initialTrades={activeTrades}
        initialGifts={giftsHistory}
        currentUserId={profileId}
      />
    </section>
  );
}
