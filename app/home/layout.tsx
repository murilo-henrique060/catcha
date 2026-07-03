import { Suspense } from "react";
import { redirect } from "next/navigation";
import { getBasicProfile } from "@/lib/actions/UserController";
import { NavbarWidget } from "@/ui/widgets/navbar";
import { NavbarSkeleton } from "@/ui/components/skeletons";

export default async function HomeLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="flex flex-col min-h-screen bg-[#F7F5F7]">
      <Suspense fallback={<NavbarSkeleton />}>
        <HomeNavbarWrapper />
      </Suspense>
      {children}
    </div>
  );
}

async function HomeNavbarWrapper() {
  const profileData = await getBasicProfile();

  if (!profileData || !profileData.profile) {
    redirect("/auth/login");
  }

  const { profile } = profileData;
  const username = profile.username ?? "Username";

  return (
    <NavbarWidget username={username} coins={profile.money} />
  );
}
