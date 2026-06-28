import { redirect } from "next/navigation";
import { getUserProfile } from "@/lib/controllers/UserController";
import { NavbarWidget } from "@/ui/widgets/navbar";
import { ProfileForm } from "@/ui/widgets/profile-form";

export default async function ProfilePage() {
  const profileData = await getUserProfile();

  if (!profileData || !profileData.profile) {
    redirect("/auth/login");
  }

  const { profile, email } = profileData;
  const username = profile.username ?? "Username";

  return (
    <main className="flex flex-col min-h-screen bg-[#F7F5F7]">
      <NavbarWidget username={username} coins={profile.money} />

      <section className="flex-grow flex items-center justify-center px-4 py-8">
        <ProfileForm initialEmail={email} initialUsername={username} />
      </section>
    </main>
  );
}