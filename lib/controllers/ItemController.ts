'use server';


/**
 * Controller de Itens do jogo.
 */
import { ItemController } from "./core/ItemController";

const itemControllerInstance = new ItemController();

// Wrapper functions para manter compatibilidade com Server Actions
export async function getUserItems(profileId: string) {
  return itemControllerInstance.getUserItems(profileId);
}
