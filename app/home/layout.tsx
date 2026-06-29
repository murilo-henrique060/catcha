import { redirect } from "next/navigation";
import { getUserProfile } from "@/lib/controllers/UserController";
import { NavbarWidget } from "@/ui/widgets/navbar";

export default async function HomeLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const profileData = await getUserProfile();

  if (!profileData || !profileData.profile) {
    redirect("/auth/login");
  }

  const { profile } = profileData;
  const username = profile.username ?? "Username";

  return (
    <div className="flex flex-col min-h-screen bg-[#F7F5F7]">
      <NavbarWidget username={username} coins={profile.money} />
      {children}
    </div>
  );
}
