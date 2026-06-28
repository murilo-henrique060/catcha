'use client'

import { useState, Suspense } from "react";
import Image from "next/image";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { LoginRequest, login } from "@/lib/controllers/AuthController";

function LoginFormInner() {
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [submit, setSubmit] = useState<boolean>(false);
  const searchParams = useSearchParams();

  const registered = searchParams.get("registered");
  const verified = searchParams.get("verified");
  const errorParam = searchParams.get("error");
  const passwordReset = searchParams.get("password_reset");

  const getInitialMessage = () => {
    if (passwordReset === "1") {
      return "Senha alterada com sucesso. Entre com sua nova senha.";
    }

    if (errorParam) {
      const messages: Record<string, string> = {
        "preencha-os-campos-obrigatorios": "Preencha e-mail e senha para continuar.",
        invalid_recovery_session: "Seu link de recuperacao expirou ou e invalido. Solicite um novo e-mail.",
        invalid_credentials: "E-mail ou senha invalidos.",
      };

      return messages[errorParam] ?? decodeURIComponent(errorParam);
    }

    if (registered === "1" && verified === "1") {
      return "Cadastro realizado. Verifique seu e-mail para ativar a conta antes de entrar.";
    }

    return null;
  };

  const initialMessage = getInitialMessage();

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const data = new FormData(e.currentTarget);
    setSubmit(() => true);
    setErrors({});

    const request: LoginRequest = {
      email: String(data.get("email") ?? "").trim(),
      password: String(data.get("password") ?? ""),
      rememberMe: data.get("rememberMe") === "on",
    };

    const result = await login(request);

    if (result.errors) {
      const errorMap: Record<string, string> = {};
      
      // If the email is not confirmed, redirect them to verify-email page
      if ('emailNotConfirmed' in result.errors && result.errors.emailNotConfirmed) {
        window.location.href = `/auth/verify-email?reason=login&email=${encodeURIComponent(request.email)}`;
        return;
      }

      for (const [key, value] of Object.entries(result.errors)) {
        if (key !== 'emailNotConfirmed' && typeof value === 'object' && value !== null && 'errors' in value) {
          errorMap[key] = String(value.errors);
        }
      }
      setErrors(errorMap);
    } else {
      window.location.href = "/home";
    }

    setSubmit(() => false);
  };

  return (
    <form onSubmit={handleSubmit} className="w-full max-w-md rounded-3xl bg-white p-8 text-center shadow-[0_4px_6px_0_rgba(0,0,0,0.25)]">
      <Image
        className="mx-auto"
        src="/images/logo.png"
        alt="Logo da Catcha"
        width={150}
        height={50}
        priority
      />

      {errors.general || initialMessage ? (
        <p className="mt-4 rounded-md border border-[#FF99D7] bg-[#FF99D7]/10 px-4 py-3 text-sm text-[#B01070]">
          {errors.general || initialMessage}
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
        />
        {errors?.email && (
          <p className="mt-1 text-sm text-[#B01070]">
            {errors.email}
          </p>
        )}
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
        />
        {errors?.password && (
          <p className="mt-1 text-sm text-[#B01070]">
            {errors.password}
          </p>
        )}
        <Link
          href="/auth/forgot-password"
          className="mt-1 block text-end text-xs font-bold text-[#B01070] hover:text-[#FF99D7]"
        >
          Esqueceu sua senha?
        </Link>
      </div>

      <div className="mt-4 flex items-center gap-2 text-sm text-[#B01070]">
        <input
          type="checkbox"
          id="rememberMe"
          name="rememberMe"
          value="on"
          className="h-4 w-4 rounded border-gray-300 text-[#B01070] focus:ring-[#B01070]"
        />
        <label htmlFor="rememberMe" className="font-bold">
          Lembrar-me
        </label>
      </div>

      <button
        type="submit"
        className={[
          "mt-6 w-full rounded-md bg-[#B01070] px-4 py-2 text-sm",
          "font-bold uppercase text-white hover:bg-[#FF99D7]",
          "focus:outline-none focus:ring focus:ring-[#FF99D7]/50",
          submit ? "opacity-50 bg-[#B01070]/50 focus:ring-0" : "",
        ]
          .filter(Boolean)
          .join(" ")}
        disabled={submit}
      >
        {submit ? (
          <div className="mx-auto h-5 w-5 animate-spin rounded-full border-2 border-solid border-white border-t-transparent"></div>
        ) : (
          "Entrar"
        )}
      </button>

      <p className="mt-2 text-sm text-[#B01070]">
        Não tem uma conta?{" "}
        <Link href="/auth/register" className="font-bold text-[#B01070] hover:text-[#FF99D7]">
          Cadastre-se
        </Link>
      </p>
    </form>
  );
}

export function LoginForm() {
  return (
    <Suspense fallback={<div className="h-5 w-5 animate-spin rounded-full border-2 border-solid border-[#B01070] border-t-transparent"></div>}>
      <LoginFormInner />
    </Suspense>
  );
}
