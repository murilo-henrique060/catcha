"use client";

import Image from "next/image";
import Link from "next/link";

type ErrorPageProps = {
  error: Error & { digest?: string };
  reset: () => void;
};

export default function ErrorPage({ error, reset }: ErrorPageProps) {
  return (
    <main className="flex min-h-screen items-center justify-center bg-[url('/images/landpage-hero-background.png')] px-6 py-12">
      <section className="w-full max-w-md rounded-3xl bg-white p-8 text-center shadow-[0_4px_6px_0_rgba(0,0,0,0.25)]">
        <Image
          className="mx-auto"
          src="/images/logo-primary.png"
          alt="Logo da Catcha"
          width={100}
          height={20}
          priority
        />

        <p className="mt-6 text-sm font-bold uppercase tracking-[0.2em] text-[#B01070]">
          Ocorreu um erro
        </p>
        <h1 className="mt-3 text-3xl font-bold italic uppercase text-[#B01070]">
          Erro ao carregar a página
        </h1>
        <p className="mt-4 text-sm leading-6 text-[#B01070]/90">
          Não foi possível carregar esta parte do Catcha no momento. Você pode tentar novamente ou voltar para a home.
        </p>

        {error.digest ? (
          <p className="mt-4 text-xs font-mono text-[#B01070]/70">
            Referência: {error.digest}
          </p>
        ) : null}

        <div className="mt-6 flex flex-col gap-3 sm:flex-row">
          <button
            type="button"
            onClick={() => reset()}
            className="w-full rounded-md bg-[#B01070] px-4 py-2 text-sm font-bold uppercase text-white transition-colors duration-300 hover:bg-[#FF99D7] focus:outline-none focus:ring focus:ring-[#FF99D7]/50"
          >
            Tentar novamente
          </button>
          <Link
            href="/"
            className="inline-flex w-full items-center justify-center rounded-md border border-[#B01070] px-4 py-2 text-sm font-bold uppercase text-[#B01070] transition-colors duration-300 hover:bg-[#FF99D7] hover:text-white focus:outline-none focus:ring focus:ring-[#FF99D7]/50"
          >
            Voltar para a home
          </Link>
        </div>
      </section>
    </main>
  );
}