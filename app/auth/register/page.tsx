import Image from "next/image";
import Link from "next/link";

export default function RegisterPage() {
	return (
		<main className="flex min-h-screen items-center justify-center bg-[url('/images/landpage-hero-background.png')] px-6 py-12">
			<form className="w-full max-w-md rounded-3xl bg-white p-8 text-center shadow-[0_4px_6px_0_rgba(0,0,0,0.25)]">
				<Image
					className="mx-auto"
					src="/images/logo-primary.png"
					alt="Catcha logo"
					width={100}
					height={20}
					priority
				/>

				<div className="mt-4 text-left text-[#B01070]">
					<label htmlFor="username" className="block text-sm font-bold uppercase">
						Nome de usuário
					</label>
					<input
						type="text"
						id="username"
						name="username"
						className="mt-1 w-full rounded-md border border-gray-300 px-3 py-2 focus:border-[#FF99D7] focus:ring focus:ring-[#FF99D7]/50"
						placeholder="Digite seu usuário"
					/>
				</div>

				<div className="mt-4 text-left text-[#B01070]">
					<label htmlFor="email" className="block text-sm font-bold uppercase">
						Email
					</label>
					<input
						type="email"
						id="email"
						name="email"
						className="mt-1 w-full rounded-md border border-gray-300 px-3 py-2 focus:border-[#FF99D7] focus:ring focus:ring-[#FF99D7]/50"
						placeholder="Digite seu email"
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
					/>
				</div>

        <div className="mt-4 flex items-center gap-2 text-sm text-[#B01070]">
          <input
            type="checkbox"
            id="terms"
            name="terms"
            className="h-4 w-4 rounded border-gray-300 text-[#B01070] focus:ring-[#B01070]"
          />
          <label htmlFor="terms">
            Aceitar 
            <Link href="/terms-and-conditions" className="ms-1 font-bold text-[#B01070] hover:text-[#FF99D7]">
              Termos e Condições
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
						Faça login
					</Link>
				</p>
			</form>
		</main>
	);
}
