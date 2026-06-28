import { Metadata } from "next";
import { redirect } from "next/navigation";

import Image from "next/image";
import Link from "next/link";

import { loginAction } from "../actions";
import { createSupabaseServerClient } from "@/lib/services/supabase/server";

export const metadata: Metadata = {
  title: "Catcha - Entrar",
  description: "Entre na sua conta para colecionar gatos ilustrados",
};

type LoginPageProps = {
  searchParams?: Promise<{
    registered?: string;
    verified?: string;
    error?: string;
    password_reset?: string;
  }>;
};

function getMessage(searchParams: {
  registered?: string;
  verified?: string;
  error?: string;
  password_reset?: string;
}) {
  if (searchParams.password_reset === "1") {
    return "Senha alterada com sucesso. Entre com sua nova senha.";
  }

  if (searchParams.error) {
    const messages: Record<string, string> = {
      "preencha-os-campos-obrigatorios": "Preencha e-mail e senha para continuar.",
      invalid_recovery_session: "Seu link de recuperacao expirou ou e invalido. Solicite um novo e-mail.",
      invalid_credentials: "E-mail ou senha invalidos.",
    };

    return messages[searchParams.error] ?? decodeURIComponent(searchParams.error);
  }

  if (searchParams.registered === "1" && searchParams.verified === "1") {
    return "Cadastro realizado. Verifique seu e-mail para ativar a conta antes de entrar.";
  }

  return null;
}

export default async function LoginPage({ searchParams }: LoginPageProps) {
  const resolvedSearchParams = (await searchParams) ?? {};
  const supabase = await createSupabaseServerClient();
  const { data } = await supabase.auth.getUser();

  if (data.user) {
    redirect("/home");
  }

  const message = getMessage(resolvedSearchParams);

  return (
    <main className="flex min-h-screen items-center justify-center bg-[url('/images/landpage-hero-background.png')] px-6 py-12">
      <form action={loginAction} className="w-full max-w-md rounded-3xl bg-white p-8 text-center shadow-[0_4px_6px_0_rgba(0,0,0,0.25)]">
        <Image
          className="mx-auto"
          src="/images/logo.png"
          alt="Logo da Catcha"
          width={100}
          height={20}
          priority
        />

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

        <div className="mt-4 text-left text-[#B01070]">
          <label htmlFor="password" className="block text-sm font-bold uppercase">
            Senha
          </label>
          <input
            type="password"
            id="password"
            name="password"
            placeholder="Digite sua senha"
            className="mt-1 w-full rounded-md border border-gray-300 px-3 py-2 focus:border-[#FF99D7] focus:ring focus:ring-[#FF99D7]/50"
            required
          />

          <Link
            href="/auth/forgot-password"
            className="mt-1 block text-end text-xs font-bold text-[#B01070] hover:text-[#FF99D7]"
          >
            Esqueceu sua senha?
          </Link>            
        </div>

        <div className="flex items-center gap-2 text-sm text-[#B01070]">
          <input
            type="checkbox"
            id="remember"
            name="remember"
            className="h-4 w-4 rounded border-gray-300 text-[#B01070] focus:ring-[#B01070]"
          />
          <label htmlFor="remember" className="font-bold">
            Lembrar-me
          </label>
        </div>

        <button
          type="submit"
          className="mt-6 w-full rounded-md bg-[#B01070] px-4 py-2 text-sm font-bold uppercase text-white hover:bg-[#FF99D7] focus:outline-none focus:ring focus:ring-[#FF99D7]/50"
        >
          Entrar
        </button>

        <p className="mt-2 text-sm text-[#B01070]">
          Não tem uma conta?{" "}
          <Link
            href="/auth/register"
            className="font-bold text-[#B01070] hover:text-[#FF99D7]"
          >
            Cadastre-se
          </Link>
        </p>
      </form>
    </main>
  );
}