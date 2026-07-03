export const unstable_instant = { prefetch: "static" };

import { Suspense } from "react";
import { redirect } from "next/navigation";
import { getBasicProfile } from "@/lib/actions/UserController";
import { ProfileForm } from "@/ui/widgets/profile-form";
import { ProfileSkeleton } from "@/ui/components/skeletons";

export default async function ProfilePage() {
  return (
    <Suspense fallback={<ProfileSkeleton />}>
      <ProfileContent />
    </Suspense>
  );
}

async function ProfileContent() {
  const profileData = await getBasicProfile();

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