import { BaseController } from "./BaseController";
import { FriendController } from "./FriendController";
import { UserController } from "./UserController";
import { revalidatePath } from "next/cache";

export class TradeController extends BaseController {
  // Associação (POO): TradeController utiliza FriendController
  private friendController: FriendController;
  private userController: UserController;

  constructor() {
    super("TradeController");
    this.friendController = new FriendController();
    this.userController = new UserController();
  }

  public getModuleDescription(): string {
    return "Módulo responsável por gerenciar propostas e efetivação de trocas de cartas.";
  }

/**
 * Inicia uma oferta de troca de cartas com um amigo.
 * Valida a regra de limite de 1 troca ativa simultânea para ambos os usuários.
 * A carta oferecida é deduzida do inventário do remetente e fica "presa" na troca.
 *
 * @param friendId - UUID do amigo com quem deseja trocar.
 * @param catId - O ID da carta que está sendo oferecida.
 * @returns Objeto com sucesso ou o erro especificando a regra violada.
 */
public async createTradeOffer(friendId: string, catId: number) {
  const supabase = await this.getClient();
  const user = await this.userController.getUserProfile();

  if (!user || !user.profile) return { error: "Não autenticado." };
  const senderId = user.profile.id;

  if (senderId === friendId) return { error: "Não pode trocar consigo mesmo." };

  // 1. Verify friendship
  const { data: friendship, error: friendError } = await supabase
    .from('friendships')
    .select('*')
    .or(`and(sender_id.eq.${senderId},receiver_id.eq.${friendId}),and(sender_id.eq.${friendId},receiver_id.eq.${senderId})`)
    .eq('status', 'accepted')
    .maybeSingle();

  if (friendError || !friendship) return { error: "Só é possível trocar com amigos." };

  // 1.5 Verify active trade limits (max 1 per user)
  const { count: senderActiveTrades } = await supabase
    .from('trades')
    .select('*', { count: 'exact', head: true })
    .or(`sender_id.eq.${senderId},receiver_id.eq.${senderId}`)
    .in('status', ['pending', 'countered']);

  if (senderActiveTrades && senderActiveTrades > 0) return { error: "Você já possui uma troca em andamento." };

  const { count: receiverActiveTrades } = await supabase
    .from('trades')
    .select('*', { count: 'exact', head: true })
    .or(`sender_id.eq.${friendId},receiver_id.eq.${friendId}`)
    .in('status', ['pending', 'countered']);

  if (receiverActiveTrades && receiverActiveTrades > 0) return { error: "Este amigo já possui uma troca em andamento." };

  // 2. Verify and deduct card
  const { data: senderCard } = await supabase
    .from('profiles_cats')
    .select('quantity')
    .eq('profile_id', senderId)
    .eq('cat_id', catId)
    .maybeSingle();

  if (!senderCard || senderCard.quantity < 1) return { error: "Você não possui esta carta." };

  let deductError = null;
  let affectedRows = 0;
  if (senderCard.quantity === 1) {
    const { data, error } = await supabase.from('profiles_cats').delete().eq('profile_id', senderId).eq('cat_id', catId).select();
    deductError = error;
    if (data) affectedRows = data.length;
  } else {
    const { data, error } = await supabase.from('profiles_cats').update({ quantity: senderCard.quantity - 1 }).eq('profile_id', senderId).eq('cat_id', catId).select();
    deductError = error;
    if (data) affectedRows = data.length;
  }

  if (deductError) {
    console.error("Error deducting card in trade offer:", deductError);
    return { error: "Erro ao deduzir a carta para a troca: " + deductError.message };
  }
  if (affectedRows === 0) {
    console.error("0 rows updated during trade deduction. RLS or not found.");
    return { error: "Erro: Nenhuma carta foi deduzida (possível bloqueio de permissão)." };
  }

  // 3. Create pending trade
  const { error } = await supabase.from('trades').insert({
    sender_id: senderId,
    receiver_id: friendId,
    sender_cat_id: catId,
    status: 'pending'
  });

  if (error) {
    // refund on error
    await this.refundCard(senderId, catId);
    return { error: "Erro ao criar oferta de troca." };
  }

  revalidatePath("/home/album");
  revalidatePath("/home/friends");
  return { success: true };
}

/**
 * Responde a uma oferta de troca ('pending') propondo uma carta em troca.
 * A carta da contraproposta é deduzida do inventário do destinatário e fica "presa".
 * O status da troca muda para 'countered'.
 *
 * @param tradeId - O UUID da troca sendo contraproposta.
 * @param counterCatId - O ID da carta oferecida em contrapartida.
 * @returns Objeto indicando sucesso ou o erro encontrado.
 */
public async counterTradeOffer(tradeId: string, counterCatId: number) {
  const supabase = await this.getClient();
  const user = await this.userController.getUserProfile();
  if (!user || !user.profile) return { error: "Não autenticado." };
  
  const receiverId = user.profile.id;

  // 1. Fetch trade
  const { data: trade } = await supabase
    .from('trades')
    .select('*, sender_cat:cats!sender_cat_id(rarity)')
    .eq('id', tradeId)
    .eq('receiver_id', receiverId)
    .eq('status', 'pending')
    .maybeSingle();

  if (!trade) return { error: "Troca não encontrada ou já respondida." };

  // 2. Verify counter card and rarity
  const { data: counterCat } = await supabase.from('cats').select('rarity').eq('id', counterCatId).maybeSingle();
  if (!counterCat) return { error: "Carta inválida." };

  // @ts-ignore
  if (trade.sender_cat.rarity !== counterCat.rarity) {
    return { error: "A carta oferecida deve ser da mesma raridade." };
  }

  // 3. Deduct receiver card
  const { data: receiverCard } = await supabase
    .from('profiles_cats')
    .select('quantity')
    .eq('profile_id', receiverId)
    .eq('cat_id', counterCatId)
    .maybeSingle();

  if (!receiverCard || receiverCard.quantity < 1) return { error: "Você não possui esta carta." };

  let deductError = null;
  let affectedRows = 0;
  if (receiverCard.quantity === 1) {
    const { data, error } = await supabase.from('profiles_cats').delete().eq('profile_id', receiverId).eq('cat_id', counterCatId).select();
    deductError = error;
    if (data) affectedRows = data.length;
  } else {
    const { data, error } = await supabase.from('profiles_cats').update({ quantity: receiverCard.quantity - 1 }).eq('profile_id', receiverId).eq('cat_id', counterCatId).select();
    deductError = error;
    if (data) affectedRows = data.length;
  }

  if (deductError) {
    console.error("Error deducting card in counter offer:", deductError);
    return { error: "Erro ao deduzir a carta para a contra-proposta: " + deductError.message };
  }
  if (affectedRows === 0) {
    console.error("0 rows updated during counter offer deduction. RLS or not found.");
    return { error: "Erro: Nenhuma carta foi deduzida (possível bloqueio de permissão)." };
  }

  // 4. Update trade
  const { error } = await supabase.from('trades').update({
    receiver_cat_id: counterCatId,
    status: 'countered',
    updated_at: new Date().toISOString()
  }).eq('id', tradeId);

  if (error) {
    await this.refundCard(receiverId, counterCatId);
    return { error: "Erro ao responder troca." };
  }

  revalidatePath("/home/album");
  revalidatePath("/home/friends");
  return { success: true };
}

/**
 * Aceita uma contraproposta ('countered').
 * Finaliza a troca trocando as cartas: a carta do remetente original vai para o destinatário e vice-versa.
 * O status da troca muda para 'completed' liberando ambos para novas trocas.
 *
 * @param tradeId - O UUID da troca a ser aceita.
 * @returns Objeto indicando o sucesso da transação.
 */
public async acceptTrade(tradeId: string) {
  const supabase = await this.getClient();
  const user = await this.userController.getUserProfile();
  if (!user || !user.profile) return { error: "Não autenticado." };

  // 1. Fetch trade
  const { data: trade } = await supabase
    .from('trades')
    .select('*')
    .eq('id', tradeId)
    .eq('sender_id', user.profile.id)
    .eq('status', 'countered')
    .maybeSingle();

  if (!trade) return { error: "Troca não encontrada." };

  // 2. Transfer cards permanently
  // sender gets receiver_cat_id
  await this.refundCard(trade.sender_id, trade.receiver_cat_id!);
  // receiver gets sender_cat_id
  await this.refundCard(trade.receiver_id, trade.sender_cat_id);

  // 3. Update status
  await supabase.from('trades').update({ status: 'accepted', updated_at: new Date().toISOString() }).eq('id', tradeId);

  revalidatePath("/home/album");
  revalidatePath("/home/friends");
  return { success: true };
}

/**
 * Rejeita uma contraproposta ou oferta pendente de outro usuário.
 * Devolve as cartas "presas" para os seus respectivos donos originais e marca a troca como 'rejected'.
 *
 * @param tradeId - O UUID da troca sendo rejeitada.
 * @returns Objeto indicando o sucesso.
 */
public async rejectTrade(tradeId: string) {
  const supabase = await this.getClient();
  const user = await this.userController.getUserProfile();
  if (!user || !user.profile) return { error: "Não autenticado." };

  // 1. Fetch trade
  const { data: trade } = await supabase
    .from('trades')
    .select('*')
    .eq('id', tradeId)
    .or(`sender_id.eq.${user.profile.id},receiver_id.eq.${user.profile.id}`)
    .in('status', ['pending', 'countered'])
    .maybeSingle();

  if (!trade) return { error: "Troca não encontrada." };

  // 2. Refund cards
  await this.refundCard(trade.sender_id, trade.sender_cat_id);
  if (trade.receiver_cat_id) {
    await this.refundCard(trade.receiver_id, trade.receiver_cat_id);
  }

  // 3. Update status
  await supabase.from('trades').update({ status: 'rejected', updated_at: new Date().toISOString() }).eq('id', tradeId);

  revalidatePath("/home/album");
  revalidatePath("/home/friends");
  return { success: true };
}

/**
 * Cancela uma oferta de troca iniciada pelo próprio usuário.
 * Devolve as cartas "presas" para os seus respectivos donos e marca a troca como 'cancelled'.
 *
 * @param tradeId - O UUID da troca a ser cancelada.
 * @returns Objeto indicando o sucesso.
 */
public async cancelTrade(tradeId: string) {
  const supabase = await this.getClient();
  const user = await this.userController.getUserProfile();
  if (!user || !user.profile) return { error: "Não autenticado." };

  // 1. Fetch trade
  const { data: trade } = await supabase
    .from('trades')
    .select('*')
    .eq('id', tradeId)
    .eq('sender_id', user.profile.id)
    .eq('status', 'pending')
    .maybeSingle();

  if (!trade) return { error: "Troca não encontrada ou já respondida." };

  // 2. Refund sender card
  await this.refundCard(trade.sender_id, trade.sender_cat_id);

  // 3. Update status
  await supabase.from('trades').update({ status: 'cancelled', updated_at: new Date().toISOString() }).eq('id', tradeId);

  revalidatePath("/home/album");
  revalidatePath("/home/friends");
  return { success: true };
}

/**
 * Busca o histórico de trocas e as trocas ativas associadas a um perfil.
 * 
 * @param profileId - O UUID do usuário.
 * @returns Objeto agrupando as trocas de chegada (`incoming`) e de saída (`outgoing`).
 */
public async getActiveTrades(profileId: string) {
  const supabase = await this.getClient();
  
  const { data: incoming } = await supabase
    .from('trades')
    .select('*, sender:profiles!sender_id(username), sender_cat:cats!sender_cat_id(*), receiver_cat:cats!receiver_cat_id(*)')
    .eq('receiver_id', profileId)
    .in('status', ['pending', 'countered'])
    .order('created_at', { ascending: false });

  const { data: outgoing } = await supabase
    .from('trades')
    .select('*, receiver:profiles!receiver_id(username), sender_cat:cats!sender_cat_id(*), receiver_cat:cats!receiver_cat_id(*)')
    .eq('sender_id', profileId)
    .in('status', ['pending', 'countered'])
    .order('created_at', { ascending: false });

  return { incoming: incoming || [], outgoing: outgoing || [] };
}

// Helper
private async refundCard(profileId: string, catId: number) {
  const supabase = await this.getClient();
  const { data } = await supabase.from('profiles_cats').select('quantity').eq('profile_id', profileId).eq('cat_id', catId).maybeSingle();
  if (data) {
    await supabase.from('profiles_cats').update({ quantity: data.quantity + 1 }).eq('profile_id', profileId).eq('cat_id', catId);
  } else {
    await supabase.from('profiles_cats').insert({ profile_id: profileId, cat_id: catId, quantity: 1 });
  }
}


}
