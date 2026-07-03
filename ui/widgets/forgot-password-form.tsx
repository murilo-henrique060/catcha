"use client";

import { useState } from "react";
import { forgotPassword } from "@/lib/actions/AuthController";

export function ForgotPasswordForm() {
  const [email, setEmail] = useState("");
  const [isSubmiting, setIsSubmiting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setIsSubmiting(true);
    setError(null);

    if (!email) {
      setError("Informe seu e-mail para receber o link de recuperação.");
      setIsSubmiting(false);
      return;
    }

    const res = await forgotPassword({ email });

    if (res.errors) {
      setError(res.errors.general?.errors || "Ocorreu um erro. Tente novamente.");
      setIsSubmiting(false);
    } else {
      window.location.href = "/auth/login?message=recovery_email_sent";
    }
  };

  return (
    <>
      {error && (
        <div className="mb-4 bg-red-50 border-l-4 border-red-500 p-4 rounded-md text-left">
          <p className="text-sm text-red-700">{error}</p>
        </div>
      )}

      <form onSubmit={handleSubmit} className="flex flex-col gap-4">
        <input
          type="email"
          name="email"
          placeholder="E-mail"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          className="w-full rounded-xl border border-gray-200 bg-gray-50 px-4 py-3 text-sm focus:border-[#B01070] focus:outline-none focus:ring-1 focus:ring-[#B01070]"
        />

        <button
          type="submit"
          disabled={isSubmiting}
          className="w-full rounded-xl bg-[#B01070] py-3 text-sm font-bold text-white transition-colors hover:bg-[#FF99D7] disabled:opacity-50"
        >
          {isSubmiting ? "Enviando..." : "Enviar link de recuperação"}
        </button>
      </form>
    </>
  );
}
