# Arquitetura do Backend (Next.js Server Actions + POO)

O backend do Catcha foi desenhado para ser robusto, escalável e fortemente tipado. Toda a lógica de negócios e persistência de dados está localizada em `/lib`, que atua como ponte segura entre a Interface de Usuário (UI) e o banco de dados Supabase. 

Recentemente, o backend passou por uma grande refatoração utilizando **Programação Orientada a Objetos (POO)** para lidar melhor com injeção de dependências, isolamento de escopo e encapsulamento.

## Estrutura de Pastas

1. **`/lib/core/`**: Contém o coração da aplicação. Aqui ficam as **Classes** de Controladores que herdam do `BaseController`. Essas classes contêm métodos puros (`public async`) e propriedades (`private`), garantindo um estado bem definido para execução da lógica e manipulação de recursos.
2. **`/lib/actions/`**: Contém os arquivos marcados com `'use server'`. Eles importam e instanciam as classes do `core` e exportam funções wrappers estáticas para serem consumidas diretamente pelos Client Components (React).

---

## Diagrama de Classes e Arquitetura

O diagrama abaixo apresenta o modelo arquitetural do backend, detalhando o relacionamento de herança, injeção de classes (composição) e a camada de funções exportadas para o Frontend (Server Actions).

![Diagrama de Arquitetura](/docs/images/architecture-diagram.png)

```plantuml
@startuml
!theme plain
skinparam backgroundColor #FFFFFF
skinparam ArrowColor #B01070
skinparam DefaultFontName "Inter, sans-serif"
skinparam RoundCorner 12
skinparam class {
    BackgroundColor White
    BorderColor #B01070
    HeaderBackgroundColor #FCE8F4
    FontColor #333333
    AttributeFontColor #475569
}
skinparam package {
    BackgroundColor #F9FAFB
    BorderColor #E2E8F0
    FontColor #1E293B
    FontSize 14
    FontStyle bold
}

package "Next.js Server Actions (/lib/actions)" {
    class "UserActions" << (S,#FF99D7) Server Action >> {
        + getUserProfile()
        + updateProfile()
        + makeAdmin()
    }
    class "CardActions" << (S,#FF99D7) Server Action >> {
        + drawCard()
        + submitNewCat()
        + approveCard()
    }
    class "FriendActions" << (S,#FF99D7) Server Action >> {
        + sendFriendRequest()
        + acceptFriendRequest()
    }
    class "TradeActions" << (S,#FF99D7) Server Action >> {
        + createTradeOffer()
        + acceptTrade()
    }
}

package "Lógica de Negócios Core (/lib/core)" {
    
    abstract class BaseController {
        # getClient()
        # getAdminClient()
    }

    class AuthController extends BaseController {
        + login()
        + register()
        + logout()
    }

    class UserController extends BaseController {
        - itemController: ItemController
        - cardController: CardController
        - exchangeController: ExchangeController
        + getBasicProfile()
        + checkUsernameExists()
        + makeAdmin()
    }

    class CardController extends BaseController {
        + drawCard()
        + buyCat()
        + submitNewCat()
        - executeCardDraw()
    }

    class FriendController extends BaseController {
        + getFriendships()
        + getPublicPlayers()
    }

    class TradeController extends BaseController {
        - cardController: CardController
        + createTradeOffer()
        - refundCard()
    }
    
    class ItemController extends BaseController {
        + getUserItems()
    }
    
    class ExchangeController extends BaseController {
        + getCurrentExchange()
    }
}

' Relacionamentos e Composições
UserController *-- ItemController : "Composição"
UserController *-- CardController : "Composição"
UserController *-- ExchangeController : "Composição"
TradeController *-- CardController : "Composição"

' Relacionamento Actions -> Core
"UserActions" ..> UserController : "Instancia & Encapsula"
"CardActions" ..> CardController : "Instancia & Encapsula"
"FriendActions" ..> FriendController : "Instancia & Encapsula"
"TradeActions" ..> TradeController : "Instancia & Encapsula"

note top of "Lógica de Negócios Core (/lib/core)"
  O Core encapsula as regras de negócio puras, 
  utilizando POO para evitar vazamento de 'this'
  e evitar ciclos de dependência globais.
end note

@enduml
```

## Módulos Principais

### 1. BaseController (O Alicerce)
Classe abstrata base para todos os controladores no Core. Fornece métodos utilitários, tratamento de erros padrão e métodos dinâmicos (`getClient()`, `getAdminClient()`), assegurando que todos os controladores derivados operem sob a mesma instância segura atrelada aos cookies da requisição.

### 2. Padrão de Composição (Injeção de Instâncias)
Controladores complexos como `UserController` e `TradeController` possuem propriedades privadas que são instâncias de outros controladores (ex: `this.itemController`). O `BaseController` permite uma modularização total e isolada no ciclo de requisição. Isso resolve problemas clássicos de escopo (`this` sendo sobrescrito) em funções *Server Actions* puras.

### 3. Segurança e Service Roles
Alguns fluxos críticos do sistema requerem que as políticas do banco de dados (RLS) sejam ignoradas via backend para operações controladas, como promover um usuário a administrador (`makeAdmin`) ou aprovar cartas da comunidade (`approveCard`). O ambiente em Node no Next.js Server Components permite utilizar a variável `SUPABASE_SERVICE_ROLE_KEY` em segredo absoluto, tornando as inserções seguras contra adulteração de requests.

### 4. Transações Atômicas (Trocas & Presentes)
O módulo `TradeController` cuida da economia entre jogadores de forma atômica. Quando uma troca é inicializada (`createTradeOffer`), a carta oferecida é temporariamente deduzida da conta para prevenir duplicação fraudulenta de cartas em sessões paralelas. Caso a troca seja cancelada por uma contraproposta ou recusa do amigo, o método privado `refundCard()` ressarce o remetente de forma garantida.
