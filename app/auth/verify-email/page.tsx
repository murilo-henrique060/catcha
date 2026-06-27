import { Metadata } from "next";
import { redirect } from "next/navigation";

import Image from "next/image";
import Link from "next/link";

import { createSupabaseServerClient } from "@/lib/supabase/server";

export const metadata: Metadata = {
  title: "Catcha - Verifique seu e-mail",
  description: "Confirme seu e-mail para concluir o cadastro e entrar na sua conta",
};

type VerifyEmailPageProps = {
  searchParams?: Promise<{
    email?: string;
    reason?: string;
  }>;
};

function getMessage(reason?: string) {
  if (reason === "login") {
    return "Seu e-mail ainda não foi verificado. Confira sua caixa de entrada para ativar a conta.";
  }

  if (reason === "recovery") {
    return "Enviamos um link de recuperacao de senha para seu e-mail. Abra a mensagem para continuar.";
  }

  return "Enviamos um link de confirmação para seu e-mail. Abra a mensagem e clique no link para ativar sua conta.";
}

export default async function VerifyEmailPage({ searchParams }: VerifyEmailPageProps) {
  const resolvedSearchParams = (await searchParams) ?? {};
  const supabase = await createSupabaseServerClient();
  const { data } = await supabase.auth.getUser();

  if (data.user) {
    redirect("/home");
  }

  const email = resolvedSearchParams.email;
  const message = getMessage(resolvedSearchParams.reason);

  return (
    <main className="flex min-h-screen items-center justify-center bg-[url('/images/landpage-hero-background.png')] px-6 py-12">
      <section className="w-full max-w-md rounded-3xl bg-white p-8 text-center shadow-[0_4px_6px_0_rgba(0,0,0,0.25)]">
        <Image
          className="mx-auto"
          src="/images/logo.png"
          alt="Logo da Catcha"
          width={100}
          height={20}
          priority
        />

        <h1 className="mt-6 text-xl font-bold uppercase text-[#B01070]">Verifique seu e-mail</h1>

        <p className="mt-3 text-sm text-[#B01070]">{message}</p>

        {email ? (
          <p className="mt-2 text-sm font-bold text-[#B01070]">E-mail informado: {email}</p>
        ) : null}

        <p className="mt-6 text-sm text-[#B01070]">
          Já confirmou o e-mail?{" "}
          <Link href="/auth/login" className="font-bold text-[#B01070] hover:text-[#FF99D7]">
            Entrar agora
          </Link>
        </p>

        <p className="mt-2 text-sm text-[#B01070]">
          Não encontrou a mensagem? Verifique o spam ou{" "}
          <Link href="/auth/register" className="font-bold text-[#B01070] hover:text-[#FF99D7]">
            cadastre-se novamente
          </Link>
          .
        </p>
      </section>
    </main>
  );
}
