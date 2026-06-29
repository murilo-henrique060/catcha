import { Metadata } from "next";
import { redirect } from "next/navigation";

import Image from "next/image";
import Link from "next/link";

import { createSupabaseServerClient } from "@/lib/services/supabase/server";
import { ForgotPasswordForm } from "@/ui/widgets/forgot-password-form";

export const metadata: Metadata = {
  title: "Catcha - Recuperar senha",
  description: "Receba por e-mail as instrucoes para redefinir sua senha",
};

export default async function ForgotPasswordPage() {
  const supabase = await createSupabaseServerClient();
  const { data } = await supabase.auth.getUser();

  if (data.user) {
    redirect("/");
  }

  return (
    <main className="flex min-h-screen items-center justify-center bg-[url('/images/landpage-hero-background.png')] bg-cover bg-no-repeat bg-center px-6 py-12">
      <section className="w-full max-w-md rounded-3xl bg-white p-8 text-center shadow-[0_4px_6px_0_rgba(0,0,0,0.25)]">
        <Image
          className="mx-auto"
          src="/images/logo.png"
          alt="Logo da Catcha"
          width={100}
          height={20}
          priority
        />

        <h1 className="mt-6 text-xl font-bold uppercase text-[#B01070]">Recuperar senha</h1>

        <p className="mt-2 text-sm text-[#B01070] mb-6">
          Digite seu e-mail para receber o link de redefinicao de senha.
        </p>

        <ForgotPasswordForm />

        <div className="mt-6 space-y-2 text-sm text-gray-500">
          <p>
            Lembrou a senha?{" "}
            <Link href="/auth/login" className="font-bold text-[#B01070] hover:text-[#FF99D7]">
              Fazer login
            </Link>
          </p>
        </div>
      </section>
    </main>
  );
}
