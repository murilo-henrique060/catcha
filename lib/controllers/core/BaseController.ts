import { createSupabaseServerClient } from "@/lib/services/supabase/server";

/**
 * Interface que define o contrato base para todos os controllers do sistema.
 * Demonstração do conceito de Interface (POO).
 */
export interface IController {
  getControllerName(): string;
  getVersion(): string;
}

/**
 * Classe Abstrata que serve como base para todos os controllers.
 * Demonstração de:
 * - Classes Abstratas
 * - Herança (outras classes estenderão esta)
 * - Encapsulamento (atributos private/protected)
 * - Construtores
 */
export abstract class BaseController implements IController {
  // Encapsulamento: Estes atributos só podem ser acessados internamente (private) ou pelas classes filhas (protected).
  private controllerName: string;
  protected readonly version: string = "1.0.0";

  /**
   * Construtor da classe base.
   * @param controllerName Nome identificador do controller.
   */
  constructor(controllerName: string) {
    this.controllerName = controllerName;
  }

  /**
   * Método público exigido pela interface.
   * Demonstra encapsulamento de leitura do atributo privado.
   */
  public getControllerName(): string {
    return this.controllerName;
  }

  /**
   * Método público exigido pela interface.
   */
  public getVersion(): string {
    return this.version;
  }

  /**
   * Método protegido: encapsula a instanciação do Supabase Client para que apenas
   * os filhos desta classe (outros controllers) possam acessar o banco de dados diretamente.
   */
  protected async getClient() {
    return await createSupabaseServerClient();
  }

  /**
   * Método Abstrato: Obriga as classes filhas a implementarem esse método de forma polimórfica.
   * Demonstração de Polimorfismo.
   */
  public abstract getModuleDescription(): string;
}
