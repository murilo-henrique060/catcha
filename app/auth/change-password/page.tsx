import { Metadata } from "next";
import { redirect } from "next/navigation";

import { createSupabaseServerClient } from "@/lib/services/supabase/server";
import { ChangePasswordForm } from "@/ui/widgets/change-password-form";

export const metadata: Metadata = {
  title: "Catcha - Alterar senha",
  description: "Defina uma nova senha para acessar sua conta",
};

export default async function ChangePasswordPage() {
  const supabase = await createSupabaseServerClient();
  const { data } = await supabase.auth.getUser();

  if (!data.user) {
    redirect("/auth/login?error=invalid_recovery_session");
  }

  return (
    <main className="flex min-h-screen items-center justify-center bg-[url('/images/landpage-hero-background.png')] bg-cover bg-no-repeat bg-center px-6 py-12">
      <ChangePasswordForm />
    </main>
  );
}

