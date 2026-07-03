'use server';



import { CardController } from "../core/CardController";

const cardControllerInstance = new CardController();

// Wrappers
export async function getRarityValue(rarity: string): Promise<number> {
  return cardControllerInstance.getRarityValue(rarity);
}

export async function getBuyPrice(rarity: string): Promise<number> {
  return cardControllerInstance.getBuyPrice(rarity);
}

export async function getCardsCountPerRarity() {
  return cardControllerInstance.getCardsCountPerRarity();
}

export async function getUserCards(profileId: string) {
  return cardControllerInstance.getUserCards(profileId);
}
