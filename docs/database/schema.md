# Esquema do Banco de Dados

O banco de dados depende do PostgreSQL hospedado pelo Supabase. A segurança e a integridade dos dados são aplicadas no nível do banco de dados por meio de restrições rígidas de Chaves Estrangeiras e políticas de Row Level Security (RLS).

![Modelo do Banco](/docs/images/database-diagram.png)

## Tabelas Principais

### `profiles`
Armazena dados do usuário e estado do jogo.
- `id` (UUID): Faz referência a `auth.users(id)`.
- `username` (Text): Nome de exibição único.
- `money` (Integer): Saldo de moeda do jogo.
- `next_draw` (Timestamp): A hora exata em que o usuário tem permissão para sortear uma nova carta gratuitamente.
- `role` (user_role): Define o nível de permissão do usuário (`user`, `admin`, `superadmin`).

### `cats`
O catálogo central de todas as cartas possíveis no jogo.
- `id` (BigInt): Chave primária.
- `name` (Text): Nome do gato.
- `rarity` (Text): Define o valor e o peso/chance de drop (ex.: Comum, Rara, Lendária).
- `image_path` (Text): Caminho para a imagem no bucket do Supabase Storage.
- `status` (user_role): Status da aprovação da carta (`pending`, `approved`, `rejected`).
- `reject_message` (Text): Mensagem opcional indicando o motivo de rejeição.
- `submitter_id` (UUID): Referência a `profiles(id)`, indicando o jogador que criou a carta.

### `profiles_cats`
Uma junção muitos-para-muitos representando o Álbum/Inventário de um usuário.
- `profile_id` (UUID): O proprietário.
- `cat_id` (BigInt): A carta possuída.
- `quantity` (Integer): A quantidade de duplicatas possuídas. Quando chega a 0 aciona um DELETE via validações do RLS.

## Tabelas Sociais

### `friendships`
- `id` (UUID)
- `sender_id` (UUID): Usuário que enviou o convite.
- `receiver_id` (UUID): Usuário que recebeu o convite.
- `status` (Text): 'pending' (pendente), 'accepted' (aceito) ou 'declined' (recusado).

### `trades`
Registra os acordos de trocas de cartas ativas e o histórico.
- `id` (UUID)
- `sender_id` & `receiver_id` (UUID)
- `sender_cat_id` & `receiver_cat_id` (BigInt): As cartas propostas para troca.
- `status` (Text): 'pending' (pendente), 'countered' (contraproposta), 'completed' (concluída), 'cancelled' (cancelada), 'rejected' (rejeitada).

### `gifts`
Registra transferências unidirecionais de cartas.
- `id` (UUID)
- `sender_id` & `receiver_id` (UUID)
- `cat_id` (BigInt)
- `status` (Text): 'pending' (não resgatado) ou 'received' (resgatado).

## Tabelas da Loja e Eventos

### `shop_items`
Tabela estática de itens consumíveis disponíveis para compra.
- `id` (UUID)
- `name`, `description`, `price`, `type`
- `effect_value` (Integer): Ex.: o número de milissegundos subtraídos de `next_draw`.

### `user_items`
Acompanha os itens consumíveis de propriedade do usuário.
- `profile_id` & `item_id` (UUID)
- `quantity` (Integer)

### `exchanges`, `exchange_participants`, `exchange_matches`
Tabelas para lidar com eventos globais assíncronos de negociação (Intercâmbios). Os usuários depositam uma carta no pool (`exchange_participants`) e o sistema eventualmente calcula combinações (`exchange_matches`), conectando usuários que atenderam aos requisitos de raridade desejados uns dos outros.
