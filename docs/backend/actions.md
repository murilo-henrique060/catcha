# Visão Geral dos Controladores no Backend

O backend do Catcha está totalmente contido dentro do diretório `/lib/actions`. Ele utiliza Next.js Server Actions para interagir com segurança com o banco de dados Supabase. 

Recentemente, a arquitetura foi refatorada seguindo princípios de **Programação Orientada a Objetos (POO)**. As lógicas de negócios principais (Core) residem em `/lib/core/` sob a forma de Classes (ex: `UserController`, `CardActions`), as quais herdam de um `BaseController` para o gerenciamento comum de dependências e injeção do cliente do Supabase. Os arquivos em `/lib/actions/` (na raiz do módulo) são instâncias Server Actions puras que encapsulam e chamam os métodos dessas classes, garantindo total compatibilidade com o Next.js e isolamento de estado.

Esses controladores atuam como ponte entre a interface (UI) no lado do cliente e o banco de dados, aplicando lógica de negócios, validações e Row-Level Security (Segurança a Nível de Linha).

## Diagrama de Classes PlantUML

O diagrama a seguir ilustra os principais módulos dentro do diretório `/lib/core/` e suas responsabilidades chaves.

![Diagrama de Classes](/docs/images/class-diagram.png)

```plantuml
@startuml
skinparam packageStyle rectangle
skinparam class {
    BackgroundColor White
    ArrowColor #B01070
    BorderColor #B01070
}

package "Backend (/lib/actions)" {
    
    class AuthController {
        + login(request: LoginRequest)
        + register(request: RegisterRequest)
        + forgotPassword(request: { email: string })
        + changePassword(request: ChangePasswordRequest)
        + logout()
        + getCurrentUser()
    }

    class UserController {
        + getUserProfile()
        + updateProfile(username: string)
        + makeAdmin(targetUserId: string)
        + removeAdmin(targetUserId: string)
    }

    class CardActions {
        + drawCard()
        + accelerateDraw()
        + buyCat(catId: number)
        + sellCat(catId: number)
        + getAllCats()
        + submitNewCat(name: string, rarity: string, base64Image: string)
        + getCreatedCats()
        + getPendingCats()
        + approveCard(catId: number)
        + rejectCard(catId: number)
    }

    class FriendController {
        + sendFriendRequest(receiverId: string)
        + acceptFriendRequest(senderId: string)
        + declineFriendRequest(senderId: string)
        + removeFriend(friendId: string)
        + searchUsers(query: string)
        + getPublicPlayers()
        + fetchFriendships()
    }

    class TradeController {
        + createTradeOffer(friendId: string, catId: number)
        + counterTradeOffer(tradeId: string, counterCatId: number)
        + acceptTrade(tradeId: string)
        + rejectTrade(tradeId: string)
        + cancelTrade(tradeId: string)
        + getActiveTrades(profileId: string)
    }

    class GiftController {
        + sendGift(friendId: string, catId: number)
        + receiveGift(giftId: string)
        + getGiftsHistory(profileId: string)
    }

    class ShopController {
        + getShopItems()
        + buyItem(itemId: string)
    }

    class ItemController {
        + getUserItems()
    }

    class ExchangeController {
        + getCurrentExchange()
        + joinExchange(catId: number, desiredRarity: string)
        + leaveExchange()
        + fetchExchangeMatches()
        + executeMatch(exchangeId: string)
        + claimExchangeCard(matchId: string)
    }

}

AuthController ..> UserController : "Autentica"
FriendController ..> TradeController : "Trocas requerem amigos"
FriendController ..> GiftController : "Presentes requerem amigos"
CardActions ..> ShopController : "Moeda & Economia"
@enduml
```

## Módulos Principais

### 1. AuthController
Lida com todos os fluxos de autenticação do usuário, incluindo login, registro, recuperação de senha e gerenciamento de sessão. Ele interage diretamente com o Supabase Auth.

### 2. UserController
Busca e atualiza os dados do perfil do usuário, incluindo a contagem global de notificações (trocas pendentes, presentes não lidos, pedidos de amizade) usados na barra de navegação. Adicionalmente, lida com a promoção e o rebaixamento de usuários para o cargo de administrador (`admin`), utilizando a Service Role Key do Supabase para contornar políticas de segurança (RLS) e atualizar os papéis no banco de dados.

### 3. CardActions
Gerencia o loop central do jogo: sorteio de cartas sob um tempo de espera (cooldown), utilização de itens para acelerar esse tempo e compra/venda de cartas repetidas por moeda no jogo. Também lida com a submissão de novos gatos pelos usuários. Para administradores, o módulo fornece ações (aprovamento/rejeição de cartas e busca de cartas pendentes) que utilizam a Service Role Key para contornar o RLS de inserções e atualizações restritas na tabela pública de gatos.

### 4. TradeController & GiftController
Aplica a regra de limite de 1 troca ativa globalmente. Lida com a oferta de cartas, negociação de contrapropostas e execução segura da dedução atômica das cartas. A lógica de presentes apresenta um tempo de espera automático para prevenir spam.

### 5. ShopController & ItemController
Gerencia a economia no jogo, permitindo aos usuários gastar moedas ganhas em itens consumíveis que pulam o tempo de espera do sorteio.

### 6. ExchangeController
Lida com eventos cronometrados globais onde os jogadores colocam cartas de raridades menores em um pool para possivelmente encontrar um par correspondente e receber cartas das raridades maiores desejadas. Inclui mecânicas de resgate e rastreamento de status.
