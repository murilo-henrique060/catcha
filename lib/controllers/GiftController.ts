'use server';

import { revalidatePath } from "next/cache";
import { GiftController } from "./core/GiftController";

const giftControllerInstance = new GiftController();

export async function sendGift(friendId: string, catId: number) { return giftControllerInstance.sendGift(friendId, catId); }
export async function receiveGift(giftId: string) { return giftControllerInstance.receiveGift(giftId); }
export async function getGiftsHistory(profileId: string) { return giftControllerInstance.getGiftsHistory(profileId); }
