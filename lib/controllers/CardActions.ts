'use server';


import { CardActions } from "./core/CardActions";

const cardActionsInstance = new CardActions();

export async function drawCard() { return cardActionsInstance.drawCard(); }
export async function accelerateDraw() { return cardActionsInstance.accelerateDraw(); }
export async function buyCat(catId: number) { return cardActionsInstance.buyCat(catId); }
export async function sellCat(catId: number) { return cardActionsInstance.sellCat(catId); }
export async function getAllCats() { return cardActionsInstance.getAllCats(); }
export async function submitNewCat(name: string, rarity: string, imageBase64: string) { return cardActionsInstance.submitNewCat(name, rarity, imageBase64); }
export async function getCreatedCats() { return cardActionsInstance.getCreatedCats(); }
export async function getPendingCards() { return cardActionsInstance.getPendingCards(); }
export async function approveCard(catId: number) { return cardActionsInstance.approveCard(catId); }
export async function rejectCard(catId: number, message: string) { return cardActionsInstance.rejectCard(catId, message); }
export async function deleteRejectedCard(catId: number) { return cardActionsInstance.deleteRejectedCard(catId); }
