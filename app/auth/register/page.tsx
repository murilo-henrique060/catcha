import { Metadata } from "next";
import { redirect } from "next/navigation";

import Image from "next/image";
import Link from "next/link";

import { registerAction } from "../actions";
import { createSupabaseServerClient } from "@/lib/supabase/server";

export const metadata: Metadata = {
	title: "Catcha - Cadastro",
	description: "Crie sua conta para começar a colecionar gatos ilustrados",
};

type RegisterPageProps = {
  searchParams?: Promise<{
    error?: string;
  }>;
};

function getRegisterErrorMessage(error?: string) {
	if (!error) {
		return null;
	}

	const messages: Record<string, string> = {
		missing_required_fields: "Preencha todos os campos obrigatorios.",
		passwords_do_not_match: "As senhas nao coincidem. Confira e tente novamente.",
		terms_not_accepted: "Voce precisa aceitar os Termos e condicoes para continuar.",
		email_already_registered: "Este e-mail ja esta cadastrado. Tente entrar na sua conta.",
		register_failed: "Nao foi possivel concluir o cadastro agora. Tente novamente em instantes.",
	};

	return messages[error] ?? "Ocorreu um erro ao processar seu cadastro. Tente novamente.";
}

export default async function RegisterPage({ searchParams }: RegisterPageProps) {
	const resolvedSearchParams = (await searchParams) ?? {};
	const supabase = await createSupabaseServerClient();
	const { data } = await supabase.auth.getUser();

	if (data.user) {
		redirect("/home");
	}

	const message = getRegisterErrorMessage(resolvedSearchParams.error);

	return (
		<main className="flex min-h-screen items-center justify-center bg-[url('/images/landpage-hero-background.png')] px-6 py-12">
			<form action={registerAction} className="w-full max-w-md rounded-3xl bg-white p-8 text-center shadow-[0_4px_6px_0_rgba(0,0,0,0.25)]">
				<Image
					className="mx-auto"
					src="/images/logo.png"
					alt="Logo da Catcha"
					width={150}
					height={50}
					priority
				/>

				{message ? (
					<p className="mt-4 rounded-md border border-[#FF99D7] bg-[#FF99D7]/10 px-4 py-3 text-sm text-[#B01070]">
						{message}
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
						required
					/>
				</div>

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
						required
					/>
				</div>

        <div className="mt-4 flex items-center gap-2 text-sm text-[#B01070]">
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

				<button
					type="submit"
					className="mt-6 w-full rounded-md bg-[#B01070] px-4 py-2 text-sm font-bold uppercase text-white hover:bg-[#FF99D7] focus:outline-none focus:ring focus:ring-[#FF99D7]/50"
				>
					Cadastrar
				</button>

				<p className="mt-2 text-sm text-[#B01070]">
					Já tem uma conta?{" "}
					<Link href="/auth/login" className="font-bold text-[#B01070] hover:text-[#FF99D7]">
						Entre agora
					</Link>
				</p>
			</form>
		</main>
	);
}
