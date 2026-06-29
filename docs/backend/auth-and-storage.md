# Autenticação e Armazenamento

O Catcha utiliza o Supabase tanto para Autenticação quanto para Armazenamento de Objetos (Storage). Isso garante um gerenciamento seguro, escalável e padronizado de identidades de usuários e ativos do jogo.

## Autenticação

A autenticação é totalmente gerenciada pelo Supabase Auth, integrado ao Next.js usando `@supabase/ssr` para lidar de forma segura com cookies em Server Components e Server Actions.

### Funcionalidades
- **Registro**: Usuários criam contas usando e-mail e senha. A verificação do e-mail é exigida antes que o login seja permitido.
- **Login**: Login tradicional por e-mail/senha. Lida com cenários onde o e-mail do usuário não foi verificado, reenviando automaticamente o e-mail de verificação e redirecionando-o para uma página de espera.
- **Recuperação de Senha**: Fluxo seguro de redefinição de senha utilizando os modelos de e-mail integrados do Supabase e links diretos (deep linking) para a rota `/auth/change-password`.
- **Segurança no Lado do Servidor**: O utilitário `createSupabaseServerClient` anexa a sessão do usuário autenticado de forma transparente em todas as chamadas ao banco de dados, garantindo que o Row Level Security (RLS) do Postgres identifique corretamente o `auth.uid()`.

## Armazenamento (Storage)

O Supabase Storage é utilizado para hospedar ativos estáticos, especificamente as imagens das cartas representando os gatos.

### Imagens dos Gatos
- Cada carta na tabela `cats` do banco de dados possui uma string `image_path` (ex.: `"cats/my_rare_cat.png"`).
- Esses caminhos correspondem a buckets públicos hospedados no Supabase Storage.
- Por ser um bucket público, o frontend em Next.js pode servir essas imagens diretamente sem exigir URLs assinadas, o que permite um carregamento rápido via CDN para o `AlbumWidget` e o `PublicWidget`.
