'use server';

import { revalidatePath } from "next/cache";
import { TradeController } from "./core/TradeController";

const tradeControllerInstance = new TradeController();

export async function createTradeOffer(friendId: string, catId: number) { return tradeControllerInstance.createTradeOffer(friendId, catId); }
export async function counterTradeOffer(tradeId: string, counterCatId: number) { return tradeControllerInstance.counterTradeOffer(tradeId, counterCatId); }
export async function acceptTrade(tradeId: string) { return tradeControllerInstance.acceptTrade(tradeId); }
export async function rejectTrade(tradeId: string) { return tradeControllerInstance.rejectTrade(tradeId); }
export async function cancelTrade(tradeId: string) { return tradeControllerInstance.cancelTrade(tradeId); }
export async function getActiveTrades(profileId: string) { return tradeControllerInstance.getActiveTrades(profileId); }
