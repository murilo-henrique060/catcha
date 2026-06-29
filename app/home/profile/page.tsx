import { redirect } from "next/navigation";
import { getUserProfile } from "@/lib/controllers/UserController";
import { ProfileForm } from "@/ui/widgets/profile-form";

export default async function ProfilePage() {
  const profileData = await getUserProfile();

  if (!profileData || !profileData.profile) {
    redirect("/auth/login");
  }

  const { profile, email } = profileData;
  const username = profile.username ?? "Username";

  return (
    <section className="flex-grow flex items-center justify-center px-4 py-8">
      <ProfileForm initialEmail={email} initialUsername={username} />
    </section>
  );
}