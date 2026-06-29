# Guia de Implantação

Para implantar o Catcha, é necessário configurar tanto o frontend no Next.js quanto o backend no Supabase. Siga estes passos para colocar seu ambiente de produção para funcionar com segurança.

## Pré-requisitos

1. Uma conta na [Vercel](https://vercel.com) (recomendado para o Next.js).
2. Uma conta no [Supabase](https://supabase.com).
3. Um repositório Git hospedando o código-fonte do Catcha.

## 1. Configuração de Produção do Supabase

Antes de implantar o frontend, você deve preparar o banco de dados de produção.

1. **Crie um Novo Projeto**: No painel do Supabase, crie um novo projeto.
2. **Envie o Esquema do Banco de Dados**: Use a CLI do Supabase para aplicar suas migrações no banco de produção:
   ```bash
   supabase link --project-ref <id-do-seu-projeto-em-producao>
   supabase db push
   ```
3. **Configure o Storage**: Certifique-se de que o bucket `cats` seja criado no Supabase Storage e definido como **Público (Public)**. Faça o upload das imagens de produção das cartas neste bucket.
4. **Configure a Autenticação**: 
   - Habilite a autenticação por E-mail.
   - Atualize a **Site URL** em `Authentication -> URL Configuration` para corresponder ao seu domínio de produção (ex.: `https://catcha.vercel.app`).
   - Configure as Redirect URLs (ex.: `https://catcha.vercel.app/auth/callback`).

## 2. Implantação do Frontend na Vercel

A Vercel oferece implantação sem configurações complexas para aplicativos Next.js.

1. **Importe o Projeto**: Faça login na Vercel e importe seu repositório Git do Catcha.
2. **Configure as Variáveis de Ambiente**: Adicione as seguintes Variáveis de Ambiente nas configurações de deploy da Vercel:
   - `NEXT_PUBLIC_SUPABASE_URL`: A URL do seu Projeto Supabase.
   - `NEXT_PUBLIC_SUPABASE_ANON_KEY`: A chave pública (anon key) do seu Supabase.
   - `NEXT_PUBLIC_SITE_URL`: O seu domínio exato de produção (ex.: `https://catcha.vercel.app`).
3. **Implantar**: Clique em "Deploy". A Vercel compilará automaticamente o aplicativo Next.js utilizando `pnpm run build` e fará o deploy das funções serverless.

## 3. Verificação Pós-Implantação

Após a conclusão da implantação:
- Acesse sua URL de produção.
- Teste o fluxo de registro (certifique-se de que os e-mails de verificação sejam entregues).
- Verifique se o Row Level Security (RLS) do Supabase está ativo e funcionando corretamente.
- Teste se o painel `/home` consegue buscar imagens com sucesso do bucket de Storage do Supabase.
