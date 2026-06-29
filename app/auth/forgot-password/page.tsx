import { Metadata } from "next";
import { redirect } from "next/navigation";

import Image from "next/image";
import Link from "next/link";

import { forgotPasswordAction } from "../actions";
import { createSupabaseServerClient } from "@/lib/services/supabase/server";

export const metadata: Metadata = {
  title: "Catcha - Recuperar senha",
  description: "Receba por e-mail as instrucoes para redefinir sua senha",
};

type ForgotPasswordPageProps = {
  searchParams?: Promise<{
    error?: string;
  }>;
};

function getErrorMessage(error?: string) {
  if (!error) {
    return null;
  }

  const messages: Record<string, string> = {
    missing_email: "Informe seu e-mail para receber o link de recuperacao.",
    recovery_email_failed: "Nao foi possivel enviar o e-mail de recuperacao agora. Tente novamente em instantes.",
  };

  return messages[error] ?? "Ocorreu um erro ao solicitar a recuperacao de senha. Tente novamente.";
}

export default async function ForgotPasswordPage({ searchParams }: ForgotPasswordPageProps) {
  const resolvedSearchParams = (await searchParams) ?? {};
  const supabase = await createSupabaseServerClient();
  const { data } = await supabase.auth.getUser();

  if (data.user) {
    redirect("/");
  }

  const message = getErrorMessage(resolvedSearchParams.error);

  return (
    <main className="flex min-h-screen items-center justify-center bg-[url('/images/landpage-hero-background.png')] bg-cover bg-no-repeat bg-center px-6 py-12">
      <form action={forgotPasswordAction} className="w-full max-w-md rounded-3xl bg-white p-8 text-center shadow-[0_4px_6px_0_rgba(0,0,0,0.25)]">
        <Image
          className="mx-auto"
          src="/images/logo.png"
          alt="Logo da Catcha"
          width={100}
          height={20}
          priority
        />

        <h1 className="mt-6 text-xl font-bold uppercase text-[#B01070]">Recuperar senha</h1>

        <p className="mt-2 text-sm text-[#B01070]">
          Digite seu e-mail para receber o link de redefinicao de senha.
        </p>

        {message ? (
          <p className="mt-4 rounded-md border border-[#FF99D7] bg-[#FF99D7]/10 px-4 py-3 text-sm text-[#B01070]">
            {message}
          </p>
        ) : null}

        <div className="mt-4 text-left text-[#B01070]">
          <label htmlFor="email" className="block text-sm font-bold uppercase">
            E-mail
          </label>
          <input
            type="email"
            id="email"
            name="email"
            className="mt-1 w-full rounded-md border border-gray-300 px-3 py-2 focus:border-[#FF99D7] focus:ring focus:ring-[#FF99D7]/50"
            placeholder="Digite seu e-mail"
            required
          />
        </div>

        <button
          type="submit"
          className="mt-6 w-full rounded-md bg-[#B01070] px-4 py-2 text-sm font-bold uppercase text-white hover:bg-[#FF99D7] focus:outline-none focus:ring focus:ring-[#FF99D7]/50"
        >
          Enviar link
        </button>

        <p className="mt-2 text-sm text-[#B01070]">
          Lembrou sua senha?{" "}
          <Link href="/auth/login" className="font-bold text-[#B01070] hover:text-[#FF99D7]">
            Voltar para login
          </Link>
        </p>
      </form>
    </main>
  );
}
