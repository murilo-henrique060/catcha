'use server';

import { revalidatePath } from "next/cache";

/**
 * Controller da Loja (Shop) do jogo.
 * Demonstra Herança e Polimorfismo.
 */
import { ShopController } from "./core/ShopController";

const shopControllerInstance = new ShopController();

// Wrapper function para manter compatibilidade com Server Actions
export async function buyAccelerationItem(quantity: number = 1) {
  return shopControllerInstance.buyAccelerationItem(quantity);
}
