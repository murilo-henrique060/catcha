'use server';

import { revalidatePath } from "next/cache";
import { FriendController } from "../core/FriendController";

const friendControllerInstance = new FriendController();

export async function sendFriendRequest(receiverId: string) { return friendControllerInstance.sendFriendRequest(receiverId); }
export async function acceptFriendRequest(senderId: string) { return friendControllerInstance.acceptFriendRequest(senderId); }
export async function declineFriendRequest(senderId: string) { return friendControllerInstance.declineFriendRequest(senderId); }
export async function getFriendships() { return friendControllerInstance.getFriendships(); }
export async function getPublicPlayers() { return friendControllerInstance.getPublicPlayers(); }
