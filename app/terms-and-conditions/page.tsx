import { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";

export const metadata: Metadata = {
  title: "Catcha - Termos e Condições",
  description: "Termos e Condições de Uso da plataforma Catcha",
};

export default function TermsAndConditionsPage() {
  return (
    <main className="flex min-h-screen items-center justify-center bg-[url('/images/landpage-hero-background.png')] bg-cover bg-no-repeat bg-center px-6 py-12">
      <div className="w-full max-w-2xl max-h-[80vh] overflow-y-auto custom-scrollbar rounded-3xl bg-white p-8 shadow-[0_4px_6px_0_rgba(0,0,0,0.25)] text-left flex flex-col items-center">
        <Image
          className="mb-6"
          src="/images/logo.png"
          alt="Logo da Catcha"
          width={150}
          height={50}
          priority
        />
        
        <h1 className="text-2xl font-bold uppercase text-[#B01070] mb-4 text-center">
          Termos e Condições de Uso
        </h1>
        
        <div className="w-full text-[#B01070]/90 text-sm space-y-4 mb-6">
          <p>
            Bem-vindo ao <strong>Catcha</strong>! Ao acessar ou usar nosso serviço, você concorda em cumprir e ser regido por estes Termos e Condições de Uso.
          </p>
          
          <h2 className="text-base font-bold uppercase text-[#B01070] mt-4">
            1. Aceitação dos Termos
          </h2>
          <p>
            Ao criar uma conta ou utilizar os serviços do Catcha, você declara que tem pelo menos 13 anos de idade e que concorda com estes termos. Se você não concorda com qualquer parte destes termos, não deverá acessar ou utilizar a plataforma.
          </p>
          
          <h2 className="text-base font-bold uppercase text-[#B01070] mt-4">
            2. Descrição do Serviço
          </h2>
          <p>
            O Catcha é um jogo eletrônico baseado na web focado em colecionar e gerenciar gatos ilustrados. Oferecemos funcionalidades como sorteio de cartas, trocas entre usuários e uma loja virtual no jogo. Todos os itens, moedas virtuais e cartas obtidos no jogo não possuem valor monetário real e são intransferíveis fora do sistema do jogo.
          </p>

          <h2 className="text-base font-bold uppercase text-[#B01070] mt-4">
            3. Registro e Segurança da Conta
          </h2>
          <p>
            Para usufruir de todas as funcionalidades, você deve registrar uma conta fornecendo um e-mail válido, nome de usuário e senha. Você é responsável por manter a confidencialidade de suas credenciais de acesso e por todas as atividades que ocorram sob sua conta. Caso suspeite de qualquer uso não autorizado, notifique-nos imediatamente.
          </p>
          
          <h2 className="text-base font-bold uppercase text-[#B01070] mt-4">
            4. Regras de Conduta e Uso Aceitável
          </h2>
          <p>
            Você concorda em não:
          </p>
          <ul className="list-disc pl-6 space-y-1">
            <li>Utilizar trapaças, hacks, scripts automáticos (bots) ou qualquer método não autorizado para obter vantagens no jogo.</li>
            <li>Perturbar a experiência de outros jogadores, insultar, assediar ou propagar discursos de ódio.</li>
            <li>Tentar explorar falhas (exploits) do sistema ou realizar engenharia reversa do código-fonte.</li>
            <li>Negociar itens do jogo por dinheiro ou bens reais fora da plataforma oficial de trocas.</li>
          </ul>
          
          <h2 className="text-base font-bold uppercase text-[#B01070] mt-4">
            5. Propriedade Intelectual
          </h2>
          <p>
            Todo o design, ilustrações de gatos, marcas registradas, códigos, logotipos e conteúdos do Catcha são de propriedade exclusiva dos seus criadores e protegidos pelas leis de propriedade intelectual. Nenhum elemento da plataforma pode ser copiado, reproduzido ou distribuído sem autorização prévia por escrito.
          </p>
          
          <h2 className="text-base font-bold uppercase text-[#B01070] mt-4">
            6. Modificações e Suspensão de Serviços
          </h2>
          <p>
            Reservamo-nos o direito de alterar, suspender ou encerrar qualquer aspecto do jogo a qualquer momento, incluindo o balanceamento de moedas, cartas e preços na loja, sem aviso prévio. Também podemos suspender ou banir permanentemente contas que violem estes Termos.
          </p>
          
          <h2 className="text-base font-bold uppercase text-[#B01070] mt-4">
            7. Limitação de Responsabilidade
          </h2>
          <p>
            O Catcha é fornecido "no estado em que se encontra" e "conforme disponível". Não garantimos que o serviço será ininterrupto ou inteiramente livre de erros. Utilizamos a plataforma Supabase para gerenciar logins e credenciais de forma segura, porém a segurança e a integridade do armazenamento de dados em nuvem é de responsabilidade da provedora do serviço (Supabase). Em nenhum caso seremos responsáveis por danos decorrentes do uso ou da incapacidade de usar o serviço.
          </p>
        </div>
        
        <Link
          href="/auth/register"
          className="w-full text-center rounded-lg bg-[#B01070] hover:bg-[#FF99D7] text-white font-bold uppercase text-sm px-4 py-3 transition-colors shadow-[0_4px_6px_0_rgba(0,0,0,0.25)]"
        >
          Voltar para o cadastro
        </Link>
      </div>
    </main>
  );
}
