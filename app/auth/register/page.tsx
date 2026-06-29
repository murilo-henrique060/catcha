 import { Metadata } from "next";
import { redirect } from "next/navigation";

import { getCurrentUser } from "@/lib/controllers/AuthController";

import { RegisterForm } from "@/ui/widgets/register-form";

export const metadata: Metadata = {
	title: "Catcha - Cadastro",
	description: "Crie sua conta para começar a colecionar gatos ilustrados",
};

export default async function RegisterPage() {
	const user = await getCurrentUser();
	if (user) {
		redirect("/home");
	}

	return (
		<main className="flex min-h-screen items-center justify-center bg-[url('/images/landpage-hero-background.png')] bg-cover bg-no-repeat bg-center px-6 py-12">
			<RegisterForm />
		</main>
	);
}
