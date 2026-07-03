'use client'

import { useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { changePassword } from "@/lib/controllers/AuthController";
import { ChangePasswordRequest } from "@/lib/controllers/core/AuthController";


export function ChangePasswordForm() {
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [submit, setSubmit] = useState<boolean>(false);

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const data = new FormData(e.currentTarget);
    setSubmit(() => true);
    setErrors({});

    const request: ChangePasswordRequest = {
      password: String(data.get("password") ?? ""),
      confirmPassword: String(data.get("confirmPassword") ?? "") };

    const result = await changePassword(request);

    if (result.errors) {
      const errorMap: Record<string, string> = {};
      for (const [key, value] of Object.entries(result.errors)) {
        if (typeof value === 'object' && value !== null && 'errors' in value) {
          errorMap[key] = String(value.errors);
        }
      }
      setErrors(errorMap);
    } else {
      window.location.href = "/auth/login?password_reset=1";
    }

    setSubmit(() => false);
  };

  return (
    <form onSubmit={handleSubmit} className="w-full max-w-md rounded-3xl bg-white p-8 text-center shadow-[0_4px_6px_0_rgba(0,0,0,0.25)]">
      <Image
        className="mx-auto"
        src="/images/logo.png"
        alt="Logo da Catcha"
        width={100}
        height={20}
        priority
      />

      <h1 className="mt-6 text-xl font-bold uppercase text-[#B01070]">Definir nova senha</h1>

      {errors.general ? (
        <p className="mt-4 rounded-md border border-[#FF99D7] bg-[#FF99D7]/10 px-4 py-3 text-sm text-[#B01070]">
          {errors.general}
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
        />
        {errors?.password && (
          <p className="mt-1 text-sm text-[#B01070]">
            {errors.password}
          </p>
        )}
      </div>

      <div className="mt-4 text-left text-[#B01070]">
        <label htmlFor="confirmPassword" className="block text-sm font-bold uppercase">
          Confirmação de senha
        </label>
        <input
          type="password"
          id="confirmPassword"
          name="confirmPassword"
          className="mt-1 w-full rounded-md border border-gray-300 px-3 py-2 focus:border-[#FF99D7] focus:ring focus:ring-[#FF99D7]/50"
          placeholder="Confirme sua nova senha"
        />
        {errors?.confirmPassword && (
          <p className="mt-1 text-sm text-[#B01070]">
            {errors.confirmPassword}
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
        {submit ? (
          <div className="mx-auto h-5 w-5 animate-spin rounded-full border-2 border-solid border-white border-t-transparent"></div>
        ) : (
          "Alterar senha"
        )}
      </button>

      <p className="mt-2 text-sm text-[#B01070]">
        <Link href="/auth/login" className="font-bold text-[#B01070] hover:text-[#FF99D7]">
          Voltar para login
        </Link>
      </p>
    </form>
  );
}
