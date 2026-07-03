'use client'

import { useState } from "react";

import Image from "next/image";
import Link from "next/link";

import { getCurrentUser, register } from "@/lib/controllers/AuthController";
import { RegisterRequest } from "@/lib/controllers/core/AuthController";


export function RegisterForm() {
  const [errors, setErrors] = useState<Record<string, string>>({});
	const [submit, setSubmit] = useState<boolean>(false);

	const handleSubmit = async (e: React.SubmitEvent<HTMLFormElement>) => {
    e.preventDefault();
    const data = new FormData(e.currentTarget);
    console.log("Form data submitted:", Object.fromEntries(data.entries()));
    setSubmit(() => true);
    setErrors({});

    const request: RegisterRequest = {
      username: String(data.get("username") ?? "").trim(),
      email: String(data.get("email") ?? "").trim(),
      password: String(data.get("password") ?? ""),
      confirmPassword: String(data.get("confirmPassword") ?? ""),
      terms: data.get("terms") === "on" };

    const { errors: registerErrors } = await register(request);

    if (registerErrors) {
      const errorMap: Record<string, string> = {};
      for (const [key, value] of Object.entries(registerErrors)) {
        errorMap[key] = String(value.errors);
      }
      console.log("Validation errors:", errorMap);
      setErrors(errorMap);
    } else {
      window.location.href = "/auth/verify-email?reason=register&email=" + encodeURIComponent(request.email);
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

      {errors?.general ? (
        <p className="mt-4 rounded-md border border-[#FF99D7] bg-[#FF99D7]/10 px-4 py-3 text-sm text-[#B01070]">
          {errors.general}
        </p>
      ) : null}

      <div className="mt-4 text-left text-[#B01070]">
        <label htmlFor="username" className="block text-sm font-bold uppercase">
          Nome de usuário
        </label>
        <input
          type="text"
          id="username"
          name="username"
          className="mt-1 w-full rounded-md border border-gray-300 px-3 py-2 focus:border-[#FF99D7] focus:ring focus:ring-[#FF99D7]/50"
          placeholder="Digite seu nome de usuário"
        />
        {errors?.username && (
          <p className="mt-1 text-sm text-[#B01070]">
            {errors.username}
          </p>
        )}
      </div>

      <div className="mt-4 text-left text-[#B01070]">
        <label htmlFor="email" className="block text-sm font-bold uppercase">
          E-mail
        </label>
        <input
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
      </div>

      <div className="mt-4 text-left text-[#B01070]">
        <label htmlFor="confirmPassword" className="block text-sm font-bold uppercase">
          Confirmação de Senha
        </label>
        <input
          type="password"
          id="confirmPassword"
          name="confirmPassword"
          placeholder="Confirme sua senha"
          className="mt-1 w-full rounded-md border border-gray-300 px-3 py-2 focus:border-[#FF99D7] focus:ring focus:ring-[#FF99D7]/50"
        />
        {errors?.confirmPassword && (
          <p className="mt-1 text-sm text-[#B01070]">
            {errors.confirmPassword}
          </p>
        )}
      </div>

      <div className="mt-4 text-left">
        <div className="flex items-center gap-2 text-sm text-[#B01070]">
          <input
            type="checkbox"
            id="terms"
            name="terms"
            value="on"
            className="h-4 w-4 rounded border-gray-300 text-[#B01070] focus:ring-[#B01070]"
          />
          <label htmlFor="terms">
            Aceito
            <Link href="/terms-and-conditions" className="ms-1 font-bold text-[#B01070] hover:text-[#FF99D7]">
              Termos e condições
            </Link>
          </label>
        </div>
        {errors?.terms && (
          <p className="mt-1 text-sm text-[#B01070]">
            {errors.terms}
          </p>
        )}
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
        {submit ? 
          <div className="mx-auto h-5 w-5 animate-spin rounded-full border-2 border-solid border-white border-t-transparent"></div>
          : "Cadastrar"}
      </button>

      <p className="mt-2 text-sm text-[#B01070]">
        Já tem uma conta?{" "}
        <Link href="/auth/login" className="font-bold text-[#B01070] hover:text-[#FF99D7]">
          Entre agora
        </Link>
      </p>
    </form>
  )
}