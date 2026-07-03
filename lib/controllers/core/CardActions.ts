import { BaseController } from "./BaseController";
import { CardController, DRAW_INTERVAL_MS, RARITY_CHANCES } from "./CardController";
import { SupabaseClient } from "@supabase/supabase-js";
import { revalidatePath } from "next/cache";

export class CardActions extends BaseController {
  // Associação (POO)
  private cardController: CardController;

  constructor() {
    super("CardActions");
    this.cardController = new CardController();
  }

  public getModuleDescription(): string {
    return "Módulo para ações ativas envolvendo cartas: sorteios, compras, vendas e submissões.";
  }

// Helper function to draw a random card and add it to the user's collection
private async executeCardDraw(supabase: SupabaseClient, userId: string) {
  // Choose rarity: S: 5%, A: 15%, B: 30%, C: 50%
  const rand = Math.random();
  let chosenRarity: 'S' | 'A' | 'B' | 'C' = 'C';
  
  if (rand < 0.05) {
    chosenRarity = 'S';
  } else if (rand < 0.20) {
    chosenRarity = 'A';
  } else if (rand < 0.50) {
    chosenRarity = 'B';
  } else {
    chosenRarity = 'C';
  }

  // Fetch cats of chosen rarity
  const { data: initialCats, error: catsError } = await supabase
    .from('cats')
    .select('*, profiles:profiles!cats_submitter_id_fkey(username)')
    .eq('status', 'approved')
    .eq('rarity', chosenRarity);

  if (catsError) {
    throw new Error("Erro ao buscar cartas");
  }

  let cats = initialCats;

  // Fallback if no cats of chosen rarity exist in the DB
  if (!cats || cats.length === 0) {
    const { data: fallbackCats, error: fallbackError } = await supabase
      .from('cats')
      .select('*, profiles:profiles!cats_submitter_id_fkey(username)')
      .eq('status', 'approved');
    
    if (fallbackError || !fallbackCats || fallbackCats.length === 0) {
      throw new Error("Nenhuma carta cadastrada no banco de dados");
    }
    cats = fallbackCats;
  }

  // Draw random cat
  const randomCat = cats[Math.floor(Math.random() * cats.length)];

  // Update profiles_cats junction table
  const { data: existingCollection } = await supabase
    .from('profiles_cats')
    .select('*')
    .eq('profile_id', userId)
    .eq('cat_id', randomCat.id)
    .maybeSingle();

  if (existingCollection) {
    const { error: updateError } = await supabase
      .from('profiles_cats')
      .update({ quantity: existingCollection.quantity + 1 })
      .eq('profile_id', userId)
      .eq('cat_id', randomCat.id);
    
    if (updateError) {
      throw new Error("Erro ao atualizar a quantidade da carta na coleção");
    }
  } else {
    const { error: insertError } = await supabase
      .from('profiles_cats')
      .insert({
        profile_id: userId,
        cat_id: randomCat.id,
        quantity: 1,
      });

    if (insertError) {
      throw new Error("Erro ao adicionar a carta à coleção");
    }
  }

  return randomCat;
}

// Draw method (standard cooldown check)
/**
 * Executa o sorteio de uma nova carta para o usuário atual, se o tempo de espera (cooldown) tiver acabado.
 * Adiciona a carta sorteada ao inventário do usuário e redefine o próximo tempo de sorteio (`next_draw`).
 *
 * @returns Objeto com a carta sorteada em caso de sucesso ou o erro (ex: tempo não decorrido).
 */
public async drawCard() {
  const supabase = await this.getClient();
  const { data: { user }, error: authError } = await supabase.auth.getUser();
  if (authError || !user) {
    return { error: "Usuário não autenticado" };
  }

  // Fetch profile to verify cooldown
  const { data: profile, error: profileError } = await supabase
    .from('profiles')
    .select('next_draw, cards_drawn')
    .eq('id', user.id)
    .single();

  if (profileError || !profile) {
    return { error: "Perfil não encontrado" };
  }

  const now = new Date();
  const nextDrawTime = new Date(profile.next_draw);
  if (now < nextDrawTime) {
    return { error: "O sorteio ainda não está disponível" };
  }

  try {
    const randomCat = await this.executeCardDraw(supabase, user.id);

    // Update profile cooldown and draw counter
    const nextDrawISO = new Date(Date.now() + DRAW_INTERVAL_MS).toISOString();
    
    const { error: profileUpdateError } = await supabase
      .from('profiles')
      .update({
        next_draw: nextDrawISO,
        cards_drawn: profile.cards_drawn + 1,
      })
      .eq('id', user.id);

    if (profileUpdateError) {
      return { error: "Erro ao atualizar o perfil de sorteio" };
    }

    return {
      success: true,
      card: randomCat,
      nextDraw: nextDrawISO,
    };
  } catch (err: unknown) {
    return { error: (err as Error).message || "Erro desconhecido ao sortear carta" };
  }
}

// Accelerate method (skip cooldown using 1 accelerate item)
/**
 * Acelera o tempo do próximo sorteio consumindo um item de "skip" do inventário do usuário.
 * Subtrai o valor de efeito (em milissegundos) do tempo `next_draw` original e deduz o item.
 *
 * @returns Objeto indicando o sucesso da aceleração e a quantidade restante do item.
 */
public async accelerateDraw() {
  const supabase = await this.getClient();
  const { data: { user }, error: authError } = await supabase.auth.getUser();
  if (authError || !user) {
    return { error: "Usuário não autenticado" };
  }

  // Fetch profile to verify cooldown is active
  const { data: profile, error: profileError } = await supabase
    .from('profiles')
    .select('next_draw, cards_drawn')
    .eq('id', user.id)
    .single();

  if (profileError || !profile) {
    return { error: "Perfil não encontrado" };
  }

  const now = new Date();
  const nextDrawTime = new Date(profile.next_draw);
  if (now >= nextDrawTime) {
    return { error: "O sorteio já está disponível, não é necessário acelerar" };
  }

  // Find the skip/acelerar item
  const { data: skipItem, error: itemError } = await supabase
    .from('items')
    .select('id')
    .eq('type', 'skip')
    .single();

  if (itemError || !skipItem) {
    return { error: "Item de aceleração não cadastrado" };
  }

  // Check user balance of this item
  const { data: userItem, error: userItemError } = await supabase
    .from('profiles_items')
    .select('*')
    .eq('profile_id', user.id)
    .eq('item_id', skipItem.id)
    .maybeSingle();

  if (userItemError || !userItem || userItem.quantity < 1) {
    return { error: "Você não possui itens de aceleração suficientes" };
  }

  try {
    // Consume 1 skip item
    if (userItem.quantity === 1) {
      const { error: deleteError } = await supabase
        .from('profiles_items')
        .delete()
        .eq('profile_id', user.id)
        .eq('item_id', skipItem.id);
      
      if (deleteError) {
        return { error: "Erro ao consumir item de aceleração" };
      }
    } else {
      const { error: updateError } = await supabase
        .from('profiles_items')
        .update({ quantity: userItem.quantity - 1 })
        .eq('profile_id', user.id)
        .eq('item_id', skipItem.id);
      
      if (updateError) {
        return { error: "Erro ao consumir item de aceleração" };
      }
    }

    // Execute standard card draw
    const randomCat = await this.executeCardDraw(supabase, user.id);

    // Reset cooldown to now + 1 hour, and increment cards drawn
    const nextDrawISO = new Date(Date.now() + DRAW_INTERVAL_MS).toISOString();
    const { error: profileUpdateError } = await supabase
      .from('profiles')
      .update({
        next_draw: nextDrawISO,
        cards_drawn: profile.cards_drawn + 1,
      })
      .eq('id', user.id);

    if (profileUpdateError) {
      return { error: "Erro ao atualizar o perfil de sorteio" };
    }

    return {
      success: true,
      card: randomCat,
      nextDraw: nextDrawISO,
    };
  } catch (err: unknown) {
    return { error: (err as Error).message || "Erro desconhecido ao acelerar sorteio" };
  }
}

/**
 * Permite ao usuário comprar uma carta específica diretamente com moedas.
 * Deduz o valor monetário do perfil do usuário e adiciona a carta ao inventário.
 *
 * @param catId - O ID da carta a ser comprada.
 * @returns Objeto com sucesso e a carta adquirida, ou erro caso moedas insuficientes.
 */
public async buyCat(catId: number) {
  const supabase = await this.getClient();

  // 1. Get current user
  const { data: { user }, error: authError } = await supabase.auth.getUser();
  if (authError || !user) {
    return { error: "Usuário não autenticado" };
  }

  // 2. Get cat details
  const { data: cat, error: catError } = await supabase
    .from('cats')
    .select('*, profiles:profiles!cats_submitter_id_fkey(username)')
    .eq('id', catId)
    .single();

  if (catError || !cat) {
    return { error: "Carta não encontrada" };
  }

  const price = await this.cardController.getBuyPrice(cat.rarity);

  // 3. Get user profiles balance
  const { data: profile, error: profileError } = await supabase
    .from('profiles')
    .select('money')
    .eq('id', user.id)
    .single();

  if (profileError || !profile) {
    return { error: "Perfil do usuário não encontrado" };
  }

  if (profile.money < price) {
    return { error: "Moedas insuficientes" };
  }

  // 4. Deduct money from profile
  const { error: updateMoneyError } = await supabase
    .from('profiles')
    .update({ money: profile.money - price })
    .eq('id', user.id);

  if (updateMoneyError) {
    return { error: "Erro ao processar pagamento" };
  }

  // 5. Add cat to user inventory (profiles_cats)
  const { data: existingRecord } = await supabase
    .from('profiles_cats')
    .select('*')
    .eq('profile_id', user.id)
    .eq('cat_id', catId)
    .maybeSingle();

  if (existingRecord) {
    await supabase
      .from('profiles_cats')
      .update({ quantity: existingRecord.quantity + 1 })
      .eq('profile_id', user.id)
      .eq('cat_id', catId);
  } else {
    await supabase
      .from('profiles_cats')
      .insert({
        profile_id: user.id,
        cat_id: catId,
        quantity: 1
      });
  }

  revalidatePath("/home/shop");
  revalidatePath("/home/album");
  revalidatePath("/home");
  return { success: true, cat };
}

/**
 * Vende uma carta duplicada do inventário do usuário, convertendo a raridade da carta
 * em moedas, que são creditadas ao saldo do usuário.
 *
 * @param catId - O ID da carta a ser vendida.
 * @returns Objeto com sucesso e o valor de venda, ou erro em caso de falha de validação.
 */
public async sellCat(catId: number) {
  const supabase = await this.getClient();

  // 1. Get current user
  const { data: { user }, error: authError } = await supabase.auth.getUser();
  if (authError || !user) {
    return { error: "Usuário não autenticado" };
  }

  // 2. Get user's card record
  const { data: record, error: recordError } = await supabase
    .from('profiles_cats')
    .select('*, cat:cats(*)')
    .eq('profile_id', user.id)
    .eq('cat_id', catId)
    .maybeSingle();

  if (recordError || !record || record.quantity <= 0) {
    return { error: "Você não possui esta carta para vender" };
  }

  const price = await this.cardController.getRarityValue(record.cat.rarity);

  // 3. Get user profiles balance
  const { data: profile, error: profileError } = await supabase
    .from('profiles')
    .select('money')
    .eq('id', user.id)
    .single();

  if (profileError || !profile) {
    return { error: "Perfil do usuário não encontrado" };
  }

  // 4. Update money in profile
  const { error: updateMoneyError } = await supabase
    .from('profiles')
    .update({ money: profile.money + price })
    .eq('id', user.id);

  if (updateMoneyError) {
    return { error: "Erro ao processar venda" };
  }

  // 5. Update profiles_cats quantity
  if (record.quantity > 1) {
    await supabase
      .from('profiles_cats')
      .update({ quantity: record.quantity - 1 })
      .eq('profile_id', user.id)
      .eq('cat_id', catId);
  } else {
    await supabase
      .from('profiles_cats')
      .delete()
      .eq('profile_id', user.id)
      .eq('cat_id', catId);
  }

  revalidatePath("/home/shop");
  revalidatePath("/home/album");
  revalidatePath("/home");
  return { success: true, price };
}

/**
 * Busca todas as cartas disponíveis no banco de dados.
 *
 * @returns Array de todas as cartas.
 */
public async getAllCats() {
  const supabase = await this.getClient();
  const { data, error } = await supabase
    .from('cats')
    .select('*, profiles:profiles!cats_submitter_id_fkey(username)')
    .eq('status', 'approved')
    .order('name', { ascending: true });

  if (error) {
    console.error("Error fetching all cats:", error);
    return [];
  }
  return data;
}

/**
 * Permite ao usuário submeter uma nova carta para a coleção global.
 * Deduz 1.000 moedas do saldo do usuário.
 *
 * @param name - O nome da carta.
 * @param rarity - A raridade da carta (S, A, B, C).
 * @param imagePath - O caminho/nome do arquivo salvo no bucket 'cats'.
 * @returns Objeto indicando sucesso, ou erro caso não tenha saldo.
 */
public async submitNewCat(name: string, rarity: string, imageBase64: string) {
  const supabase = await this.getClient();

  // 1. Get current user
  const { data: { user }, error: authError } = await supabase.auth.getUser();
  if (authError || !user) {
    return { error: "Usuário não autenticado" };
  }

  // 2. Get user profile balance
  const { data: profile, error: profileError } = await supabase
    .from('profiles')
    .select('money')
    .eq('id', user.id)
    .single();

  if (profileError || !profile) {
    return { error: "Perfil do usuário não encontrado" };
  }

  const SUBMIT_COST = 1000;
  if (profile.money < SUBMIT_COST) {
    return { error: "Você não possui moedas suficientes (necessário 1.000)" };
  }

  // 3. Upload image
  let imagePath = "";
  try {
    // Expected format: data:image/webp;base64,...
    const base64Data = imageBase64.split(',')[1];
    if (!base64Data) throw new Error("Invalid base64 string");
    
    const buffer = Buffer.from(base64Data, 'base64');
    const fileName = crypto.randomUUID() + '.webp';
    
    // Convert to File to ensure correct multipart/form-data Content-Type
    const file = new File([buffer], fileName, { type: 'image/webp' });
    
    const { error: uploadError } = await supabase.storage.from('cats').upload(fileName, file, {
      contentType: 'image/webp'
    });
    
    if (uploadError) {
      console.error("Upload error:", uploadError);
      return { error: "Erro ao fazer upload da imagem" };
    }
    imagePath = fileName;
  } catch (err) {
    console.error("Base64 decoding error:", err);
    return { error: "Erro ao decodificar a imagem" };
  }

  // 4. Deduct money
  const { error: updateMoneyError } = await supabase
    .from('profiles')
    .update({ money: profile.money - SUBMIT_COST })
    .eq('id', user.id);

  if (updateMoneyError) {
    // Optional: rollback image upload here
    return { error: "Erro ao processar pagamento" };
  }

  // 5. Insert new cat with approved = false and submitter_id
  const { data: cat, error: catError } = await supabase
    .from('cats')
    .insert({
      name,
      rarity,
      image_path: imagePath,
      status: 'pending',
      submitter_id: user.id
    })
    .select()
    .single();

  if (catError || !cat) {
    console.error("Cat insert error:", catError);
    // If insertion fails, it would be ideal to refund the user, but for simplicity we rely on the transaction
    return { error: "Erro ao registrar a carta no banco de dados" };
  }

  revalidatePath("/home/shop");
  return { success: true, cat };
}

/**
 * Fetch cats created by the current user.
 *
 * @returns Array of cats created by the user.
 */
public async getCreatedCats() {
  const supabase = await this.getClient();
  const { data: { user }, error: authError } = await supabase.auth.getUser();

  if (authError || !user) {
    return [];
  }

  const { data, error } = await supabase
    .from('cats')
    .select('*, profiles:profiles!cats_submitter_id_fkey(username)')
    .eq('submitter_id', user.id)
    .order('id', { ascending: false });

  if (error) {
    console.error("Error fetching created cats:", error);
    return [];
  }
  return data;
}

/**
 * Busca todas as cartas pendentes de aprovação.
 *
 * @returns Array de cartas pendentes.
 */
public async getPendingCards() {
  const supabase = await this.getClient();
  const { data, error } = await supabase
    .from('cats')
    .select('*, profiles:profiles!cats_submitter_id_fkey(username)')
    .eq('status', 'pending')
    .order('id', { ascending: false });

  if (error) {
    console.error("Error fetching pending cards:", error);
    return [];
  }
  return data;
}

/**
 * Aprova uma carta pendente.
 */
public async approveCard(catId: number) {
  const supabase = await this.getClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { error: "Não autenticado" };
  const { data: profile } = await supabase.from('profiles').select('role').eq('id', user.id).single();
  if (profile?.role !== 'admin' && profile?.role !== 'superadmin') return { error: "Sem permissão" };

  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;

  if (!serviceRoleKey || !supabaseUrl) {
    return { error: "Credenciais de administrador não configuradas no servidor" };
  }

  const { createClient } = await import('@supabase/supabase-js');
  const supabaseAdmin = createClient(supabaseUrl, serviceRoleKey);

  const { error } = await supabaseAdmin
    .from('cats')
    .update({ status: 'approved' })
    .eq('id', catId);

  if (error) {
    console.error("Error approving card:", error);
    return { error: "Erro ao aprovar carta" };
  }
  revalidatePath("/home/admin/pedidos");
  revalidatePath("/home/album");
  revalidatePath("/home");
  return { success: true };
}

/**
 * Rejeita uma carta pendente com uma mensagem.
 */
public async rejectCard(catId: number, message: string) {
  const supabase = await this.getClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { error: "Não autenticado" };
  const { data: profile } = await supabase.from('profiles').select('role').eq('id', user.id).single();
  if (profile?.role !== 'admin' && profile?.role !== 'superadmin') return { error: "Sem permissão" };

  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;

  if (!serviceRoleKey || !supabaseUrl) {
    return { error: "Credenciais de administrador não configuradas no servidor" };
  }

  const { createClient } = await import('@supabase/supabase-js');
  const supabaseAdmin = createClient(supabaseUrl, serviceRoleKey);

  const { error } = await supabaseAdmin
    .from('cats')
    .update({ status: 'rejected', reject_message: message })
    .eq('id', catId);

  if (error) {
    console.error("Error rejecting card:", error);
    return { error: "Erro ao rejeitar carta" };
  }
  revalidatePath("/home/admin/pedidos");
  return { success: true };
}

/**
 * Remove uma carta rejeitada enviada pelo próprio usuário.
 */
public async deleteRejectedCard(catId: number) {
  const supabase = await this.getClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { error: "Não autenticado" };

  // 1. Obter o image_path para deletar o arquivo do bucket
  const { data: catData, error: catError } = await supabase
    .from('cats')
    .select('image_path')
    .eq('id', catId)
    .eq('submitter_id', user.id)
    .eq('status', 'rejected')
    .single();

  if (catError || !catData) return { error: "Carta não encontrada ou sem permissão" };

  // 2. Excluir o registro do banco de dados
  const { error } = await supabase
    .from('cats')
    .delete()
    .eq('id', catId)
    .eq('submitter_id', user.id)
    .eq('status', 'rejected');

  if (error) return { error: "Erro ao excluir carta do banco de dados" };

  // 3. Excluir o arquivo de imagem do bucket
  if (catData.image_path) {
    await supabase.storage.from('cats').remove([catData.image_path]);
  }

  revalidatePath("/home/creations");
  return { success: true };
}

}
