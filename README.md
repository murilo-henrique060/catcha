# Catcha

![Catcha Logo](public/images/logo.png)

Bem-vindo ao **Catcha**, um jogo de coleção e troca de cartas baseado na web! Sorteie cartas de gatos fofos e raros, complete seu álbum e faça trocas com seus amigos para colecionar todos.

## Funcionalidades

- 🐾 **Colete Cartas**: Sorteie cartas geradas aleatoriamente com várias raridades (Comum, Incomum, Rara, Épica, Lendária, Mítica).
- 🤝 **Trocas e Presentes**: Proponha, faça contrapropostas e aceite trocas de cartas com seus amigos, ou envie cartas repetidas como presentes.
- 🛒 **Economia no Jogo**: Venda cartas repetidas para ganhar moedas e compre itens consumíveis na loja para acelerar o tempo de espera dos seus sorteios.
- 🌐 **Intercâmbios Globais**: Junte suas cartas em eventos de intercâmbio global para tentar conseguir cartas de raridades maiores!

## Tecnologias Utilizadas

- **Frontend**: [Next.js](https://nextjs.org/) (App Router), React, Tailwind CSS
- **Backend & Banco de Dados**: [Supabase](https://supabase.com/) (PostgreSQL)
- **Autenticação**: Supabase Auth (Verificação por E-mail)
- **Armazenamento (Storage)**: Supabase Storage (Buckets Públicos para as Imagens das Cartas)

## Documentação

A documentação completa do projeto está disponível no diretório `/docs`:

- 📖 [Índice Principal da Documentação](./docs/index.md)
- 🛠️ [Guia de Desenvolvimento Local](./docs/development.md)
- 🚀 [Guia de Implantação em Produção](./docs/deploy.md)
- ⚙️ [Controladores do Backend & Diagrama PlantUML](./docs/backend/controllers.md)
- 🗄️ [Esquema do Banco de Dados](./docs/database/schema.md)

## Início Rápido (Desenvolvimento)

Para começar o desenvolvimento local, certifique-se de ter o Docker e o pnpm instalados e, em seguida, execute:

```bash
pnpm install
supabase start
supabase db reset
pnpm run dev
```

Para instruções completas de configuração e requisitos de variáveis de ambiente, consulte o [Guia de Desenvolvimento Local](./docs/development.md).

## Licença

Este projeto está licenciado sob a Licença MIT.
