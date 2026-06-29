import Image from "next/image";
import Link from "next/link";

export default function NotFound() {
  return (
    <main className="flex min-h-screen items-center justify-center bg-[url('/images/landpage-hero-background.png')] bg-cover bg-no-repeat bg-center px-6 py-12">
      <section className="w-full max-w-md rounded-3xl bg-white p-8 text-center shadow-[0_4px_6px_0_rgba(0,0,0,0.25)]">
        <Image
          className="mx-auto"
          src="/images/logo.png"
          alt="Logo da Catcha"
          width={100}
          height={20}
          priority
        />

        <p className="mt-6 text-sm font-bold uppercase tracking-[0.2em] text-[#B01070]">
          Página não encontrada
        </p>
        <h1 className="mt-3 text-5xl font-bold italic uppercase text-[#B01070]">
          404
        </h1>
        <p className="mt-4 text-sm leading-6 text-[#B01070]/90">
          A página que você está procurando não existe ou foi movida.
        </p>

        <Link
          href="/"
          className="mt-6 inline-flex w-full items-center justify-center rounded-md bg-[#B01070] px-4 py-2 text-sm font-bold uppercase text-white transition-colors duration-300 hover:bg-[#FF99D7] focus:outline-none focus:ring focus:ring-[#FF99D7]/50"
        >
          Voltar para o início
        </Link>
      </section>
    </main>
  );
}