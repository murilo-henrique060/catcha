import { Metadata } from "next";
import { redirect } from "next/navigation";

import { createSupabaseServerClient } from "@/lib/services/supabase/server";
import { LoginForm } from "@/ui/widgets/login-form";

export const metadata: Metadata = {
  title: "Catcha - Entrar",
  description: "Entre na sua conta para colecionar gatos ilustrados",
};

export default async function LoginPage() {
  const supabase = await createSupabaseServerClient();
  const { data } = await supabase.auth.getUser();

  if (data.user) {
    redirect("/home");
  }

  return (
    <main className="flex min-h-screen items-center justify-center bg-[url('/images/landpage-hero-background.png')] px-6 py-12">
      <LoginForm />
    </main>
  );
}