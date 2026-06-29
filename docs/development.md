# Guia de Desenvolvimento

Este guia cobre tudo o que você precisa saber para configurar o Catcha para desenvolvimento local, executar o ambiente local do Supabase e contribuir para o código.

## Configuração do Ambiente Local

O Catcha utiliza uma stack local do Supabase via Docker para emular o banco de dados de produção e os serviços de autenticação.

### Pré-requisitos
- [Node.js](https://nodejs.org/) (v20+)
- [pnpm](https://pnpm.io/)
- [Docker Desktop](https://www.docker.com/) (Deve estar em execução para o Supabase local)
- [Supabase CLI](https://supabase.com/docs/guides/cli)

### 1. Instalar Dependências
Clone o repositório e instale as dependências do Node.js:
```bash
git clone <url-do-repositorio>
cd catcha
pnpm install
```

### 2. Iniciar o Supabase Local
Certifique-se de que o Docker está rodando e, em seguida, inicialize e inicie a stack local do Supabase:
```bash
supabase init
supabase start
```
Este comando subirá o Postgres, GoTrue (Auth), PostgREST (API) e Storage localmente. Ao terminar, ele exibirá suas credenciais locais.

### 3. Variáveis de Ambiente
Crie um arquivo `.env.local` no diretório raiz e preencha-o com as credenciais locais do Supabase fornecidas no passo anterior:

```env
NEXT_PUBLIC_SUPABASE_URL=http://127.0.0.1:54321
NEXT_PUBLIC_SUPABASE_ANON_KEY=<sua-chave-anon-local>
NEXT_PUBLIC_SITE_URL=http://localhost:3000
```

### 4. Migrações de Banco de Dados e Seed
Aplique as migrações mais recentes e popule o banco de dados com os dados iniciais de teste (como os gatos padrão e itens):
```bash
supabase db reset
```
*Nota: Qualquer alteração que você fizer no esquema do banco de dados localmente deve ser capturada utilizando `supabase db diff -f nome_da_migracao`.*

### 5. Executar o Servidor de Desenvolvimento do Next.js
Inicie o servidor de desenvolvimento local do Next.js:
```bash
pnpm run dev
```
Você agora pode acessar o aplicativo em [http://localhost:3000](http://localhost:3000).

## Formatação e Linting de Código

O Catcha usa as regras de linting padrão do Next.js. Antes de enviar um PR ou fazer push do código, certifique-se de que seu código passa nas verificações de build e lint:
```bash
pnpm run build
pnpm run lint
```
