import { BaseController } from "./BaseController";

/**
 * Controller responsável pelos Intercâmbios/Trocas Globais.
 * Demonstra Herança e uso de métodos encapsulados da classe pai.
 */

export class ExchangeController extends BaseController {
  
  constructor() {
    super("ExchangeController");
  }

  public getModuleDescription(): string {
    return "Módulo para lidar com trocas pendentes e eventos de intercâmbio global.";
  }

  /**
   * Busca a troca ativa atual do usuário (seja como remetente ou destinatário).
   * Verifica as trocas que estão com o status 'pending' ou 'countered'.
   * Útil para garantir a regra de negócio de apenas uma troca ativa por vez.
   *
   * @param profileId - O UUID do perfil do usuário a ser verificado.
   * @returns Os dados da troca se existir, ou null caso contrário.
   */
  public async getCurrentExchange(profileId: string) {
    const supabase = await this.getClient(); // Encapsulamento

    const { data, error } = await supabase
      .from('trades')
      .select('*')
      .or(`sender_id.eq.${profileId},receiver_id.eq.${profileId}`)
      .in('status', ['pending', 'countered'])
      .limit(1)
      .maybeSingle();

    if (error) {
      console.error("Error fetching current exchange:", error);
      return null;
    }

    return data;
  }
}

// Instância do objeto
