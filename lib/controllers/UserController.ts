'use server';

import { cache } from "react";
import { UserController } from "./core/UserController";

const userControllerInstance = new UserController();

export const getBasicProfile = cache(async (userId?: string) => { return userControllerInstance.getBasicProfile(userId); });
export const getUserProfile = cache(async (userId?: string) => { return userControllerInstance.getUserProfile(userId); });
export async function checkUsernameExists(username: string) { return userControllerInstance.checkUsernameExists(username); }
export async function updateUsername(newUsername: string) { return userControllerInstance.updateUsername(newUsername); }
export async function deleteAccount() { return userControllerInstance.deleteAccount(); }
export async function makeAdmin(targetUserId: string) { return userControllerInstance.makeAdmin(targetUserId); }
export async function removeAdmin(targetUserId: string) { return userControllerInstance.removeAdmin(targetUserId); }
