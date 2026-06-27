import Image from "next/image";

export default function UnsupportedMobilePage() {
  return (
    <main className="flex min-h-screen items-center justify-center bg-[#B01070] px-6 py-12 text-white">
      <section className="w-full max-w-md rounded-3xl border-2 border-[#FF99D7] bg-[#8C1D6B] p-8 text-center shadow-[0_4px_6px_0_rgba(0,0,0,0.25)]">
        <Image
          className="mx-auto"
          src="/images/logo.png"
          alt="Logo da Catcha"
          width={150}
          height={50}
          priority
        />
        <h1 className="mt-4 text-3xl font-bold italic uppercase leading-tight">
          Ainda não suportamos celulares!
        </h1>
        <p className="mt-4 text-base leading-7 text-white/90">
          No momento, nosso site é otimizado apenas para computadores. Por favor, acesse em um dispositivo desktop para aproveitar a experiência completa.
        </p>
      </section>
    </main>
  );
}