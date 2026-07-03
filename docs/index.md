# Catcha - Documentação

Bem-vindo à documentação do **Catcha**, um jogo de coleção e troca de cartas baseado na web.

## Índice

1. [Visão Geral do Backend (Server Actions Controladores Core)](./backend/actions.md)
2. [Autenticação e Armazenamento](./backend/auth-and-storage.md)
3. [Esquema do Banco de Dados](./database/schema.md)
4. [Guia de Desenvolvimento Local](./development.md)
5. [Guia de Implantação em Produção](./deploy.md)

## Funcionalidades Principais

- **Coleção de Cartas**: Sorteie cartas geradas aleatoriamente com diferentes raridades. Acompanhe sua coleção no seu álbum.
- **Criação de Cartas**: Desenhe e submeta suas próprias cartas de gatos! Acompanhe a aprovação e faça parte da coleção global do jogo.
- **Sistema de Trocas**: Proponha, faça contrapropostas e aceite trocas com seus amigos para completar sua coleção.
- **Presentes**: Envie cartas repetidas para seus amigos como presentes.
- **Loja e Economia**: Venda cartas repetidas por moedas e compre itens na loja para acelerar seus sorteios.
- **Social**: Procure por jogadores públicos, envie solicitações de amizade e gerencie suas conexões.
- **Intercâmbios**: Participe de eventos globais de troca de cartas onde os jogadores reúnem cartas para receber novas da raridade desejada.

*Toda a lógica de backend é manipulada com segurança por server actions no diretório `/lib`, suportada pelo Supabase para banco de dados, autenticação e armazenamento de arquivos.*
