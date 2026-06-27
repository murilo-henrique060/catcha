import { Metadata } from "next";
import { redirect } from "next/navigation";

import Image from "next/image";
import Link from "next/link";

import { changePasswordAction } from "../actions";
import { createSupabaseServerClient } from "@/lib/supabase/server";

export const metadata: Metadata = {
  title: "Catcha - Alterar senha",
  description: "Defina uma nova senha para acessar sua conta",
};

type ChangePasswordPageProps = {
  searchParams?: Promise<{
    error?: string;
  }>;
};

function getErrorMessage(error?: string) {
  if (!error) {
    return null;
  }

  const messages: Record<string, string> = {
    missing_required_fields: "Preencha os campos de nova senha e confirmacao.",
    passwords_do_not_match: "As senhas nao coincidem. Confira e tente novamente.",
    password_too_short: "A senha precisa ter pelo menos 6 caracteres.",
    change_password_failed: "Nao foi possivel alterar sua senha agora. Tente novamente.",
  };

  return messages[error] ?? "Ocorreu um erro ao atualizar a senha. Tente novamente.";
}

export default async function ChangePasswordPage({ searchParams }: ChangePasswordPageProps) {
  const resolvedSearchParams = (await searchParams) ?? {};
  const supabase = await createSupabaseServerClient();
  const { data } = await supabase.auth.getUser();

  if (!data.user) {
    redirect("/auth/login?error=invalid_recovery_session");
  }

  const message = getErrorMessage(resolvedSearchParams.error);

  return (
    <main className="flex min-h-screen items-center justify-center bg-[url('/images/landpage-hero-background.png')] px-6 py-12">
      <form action={changePasswordAction} className="w-full max-w-md rounded-3xl bg-white p-8 text-center shadow-[0_4px_6px_0_rgba(0,0,0,0.25)]">
        <Image
          className="mx-auto"
          src="/images/logo.png"
          alt="Logo da Catcha"
          width={100}
          height={20}
          priority
        />

        <h1 className="mt-6 text-xl font-bold uppercase text-[#B01070]">Definir nova senha</h1>

        {message ? (
          <p className="mt-4 rounded-md border border-[#FF99D7] bg-[#FF99D7]/10 px-4 py-3 text-sm text-[#B01070]">
            {message}
          </p>
        ) : null}

        <div className="mt-4 text-left text-[#B01070]">
          <label htmlFor="password" className="block text-sm font-bold uppercase">
            Nova senha
          </label>
          <input
            type="password"
            id="password"
            name="password"
            className="mt-1 w-full rounded-md border border-gray-300 px-3 py-2 focus:border-[#FF99D7] focus:ring focus:ring-[#FF99D7]/50"
            placeholder="Digite sua nova senha"
            required
          />
        </div>

        <div className="mt-4 text-left text-[#B01070]">
          <label htmlFor="confirmPassword" className="block text-sm font-bold uppercase">
            Confirmacao de senha
          </label>
          <input
            type="password"
            id="confirmPassword"
            name="confirmPassword"
            className="mt-1 w-full rounded-md border border-gray-300 px-3 py-2 focus:border-[#FF99D7] focus:ring focus:ring-[#FF99D7]/50"
            placeholder="Confirme sua nova senha"
            required
          />
        </div>

        <button
          type="submit"
          className="mt-6 w-full rounded-md bg-[#B01070] px-4 py-2 text-sm font-bold uppercase text-white hover:bg-[#FF99D7] focus:outline-none focus:ring focus:ring-[#FF99D7]/50"
        >
          Alterar senha
        </button>

        <p className="mt-2 text-sm text-[#B01070]">
          <Link href="/auth/login" className="font-bold text-[#B01070] hover:text-[#FF99D7]">
            Voltar para login
          </Link>
        </p>
      </form>
    </main>
  );
}
