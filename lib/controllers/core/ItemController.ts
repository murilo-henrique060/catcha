import { BaseController } from "./BaseController";

/**
 * Controller de Itens do jogo.
 * Demonstra Herança (extends BaseController).
 */

export class ItemController extends BaseController {
  
  constructor() {
    super("ItemController"); // Construtor chamando o construtor da classe pai
  }

  /**
   * Implementação do método abstrato (Polimorfismo).
   */
  public getModuleDescription(): string {
    return "Módulo responsável por buscar e gerenciar os itens do inventário dos jogadores.";
  }

  /**
   * Busca o inventário de itens de um usuário específico.
   *
   * @param profileId - O UUID do perfil do usuário para buscar os itens.
   * @returns Um array contendo os dados dos itens, ou um array vazio em caso de erro.
   */
  public async getUserItems(profileId: string) {
    const supabase = await this.getClient(); // Encapsulamento: método protegido da classe pai

    const { data, error } = await supabase
      .from('profiles_items')
      .select(`
        quantity,
        item:items (
          id,
          name,
          type,
          description,
          image_url,
          price
        )
      `)
      .eq('profile_id', profileId);

    if (error) {
      console.error("Error fetching user items:", error);
      return [];
    }

    return data;
  }
}

// Objeto instanciado
