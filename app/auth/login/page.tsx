import Image from "next/image";
import Link from "next/link";

export default function LoginPage() {
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
          <label htmlFor="email" className="block text-sm font-bold uppercase">
            Email
          </label>
          <input
            type="email"
            id="email"
            name="email"
            className="mt-1 w-full rounded-md border border-gray-300 px-3 py-2 focus:border-[#FF99D7] focus:ring focus:ring-[#FF99D7]/50"
            placeholder="Digite seu email"
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