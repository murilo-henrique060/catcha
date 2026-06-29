import { Metadata } from "next";
import { redirect } from "next/navigation";

import Image from "next/image";
import Link from "next/link";

import { getCurrentUser } from "@/lib/controllers/AuthController";

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

export default async function VerifyEmailPage({ searchParams }: VerifyEmailPageProps) {
  const resolvedSearchParams = (await searchParams) ?? {};
  const user = await getCurrentUser();

  if (user) {
    redirect("/home");
  }

  const email = resolvedSearchParams.email;
  const reason = resolvedSearchParams.reason;

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

        <h1 className="mt-6 text-xl font-bold uppercase text-[#B01070]">Verifique seu e-mail</h1>

        <p className="mt-3 text-sm text-[#B01070]">{
          reason === "login"
            ? "Seu e-mail ainda não foi verificado. Enviamos um novo link de confirmação para sua caixa de entrada para você ativar a conta."
            : reason === "recovery"
              ? "Enviamos um link de recuperacao de senha para seu e-mail. Abra a mensagem para continuar."
              : "Enviamos um link de confirmação para seu e-mail. Abra a mensagem e clique no link para ativar sua conta."
        }</p>

        {email ? (
          <p className="mt-4 text-sm font-bold text-[#B01070]">{email}</p>
        ) : null}

        <p className="mt-4 text-sm text-[#B01070]">
          Já confirmou o e-mail?{" "}
          <Link href="/auth/login" className="font-bold text-[#B01070] hover:text-[#FF99D7]">
            Entrar agora
          </Link>
        </p>
      </section>
    </main>
  );
}
