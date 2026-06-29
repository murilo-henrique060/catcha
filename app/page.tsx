export const unstable_instant = false;

import { redirect } from "next/navigation";

import Image from "next/image";
import Link from "next/link";

import { GiCardDraw } from "react-icons/gi";

import { Navbar } from "@/ui/components/navbar";
import { NavbarButton } from "@/ui/components/navbar-button";
import { Button } from "@/ui/components/button";
import { createSupabaseServerClient } from "@/lib/services/supabase/server";

export default async function Home() {
  const supabase = await createSupabaseServerClient();
  const { data } = await supabase.auth.getUser();

  if (data.user) {
    redirect("/home");
  }

  return (
    <div className="flex flex-col flex-1">
      <Navbar className="flex flex-row items-center justify-between gap-4">
        <Image
          src="/images/logo.png"
          alt="Logo da Catcha"
          width={150}
          height={50}
          priority
        />
        <div>
          <Link href="/auth/login">
            <NavbarButton>Entrar</NavbarButton>
          </Link>
          <Link href="/auth/register">
            <NavbarButton className="ml-2">Cadastrar</NavbarButton>
          </Link>
        </div>
      </Navbar>
      <main className="flex flex-1 w-full flex-col items-center justify-center bg-[url('/images/landpage-hero-background.png')] bg-cover bg-no-repeat bg-center">
        <h1 className="text-4xl font-bold text-center text-white italic uppercase drop-shadow-[0_4px_6px_0_rgba(0,0,0,0.25)]">
          O Universo dos Gatos Colecionáveis Espera por Você!
        </h1>
        <p className="mt-4 text-lg text-center text-white font-light italic drop-shadow-[0_4px_6px_0_rgba(0,0,0,0.25)]">
          Colete gatos ilustrados e troque com seus amigos até completar o seu álbum perfeito.
        </p>
        <Link href="/auth/register">
          <Button className="mt-6">
            <GiCardDraw className="mr-1" size={30} />
            Comece a colecionar agora!
          </Button>
        </Link>
      </main>
    </div>
  );
}
