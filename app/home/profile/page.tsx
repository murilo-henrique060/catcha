import { redirect } from "next/navigation";

import { createSupabaseServerClient } from "@/lib/supabase/server";
import { NavbarWidget } from "@/widgets/navbar";

export default async function ProfilePage() {
  const supabase = await createSupabaseServerClient();
  const { data } = await supabase.auth.getUser();

  if (!data.user) {
    redirect("/auth/login");
  }

  const username = data.user.user_metadata?.username ?? "Username";

  return (
    <main className="min-h-screen bg-[url('/images/landpage-hero-background.png')] bg-cover bg-center bg-no-repeat">
      <NavbarWidget username={username} />

      <section className="mx-auto flex min-h-[calc(100vh-3.5rem)] w-full max-w-7xl items-center justify-center px-6 py-12 text-center">
        <div className="max-w-2xl rounded-3xl border border-white/15 bg-white/10 px-6 py-10 text-white shadow-[0_18px_40px_rgba(0,0,0,0.25)] backdrop-blur-sm sm:px-10">
          <h1 className="text-3xl font-bold italic uppercase sm:text-5xl">Perfil</h1>
          <p className="mt-4 text-base italic text-white/90 sm:text-lg">
            Aqui você pode exibir e editar os dados do usuário.
          </p>
        </div>
      </section>
    </main>
  );
}