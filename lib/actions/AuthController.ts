'use server';

import { redirect } from "next/navigation";
import { z } from "zod";




/**
 * Registra um novo usuário no sistema utilizando Supabase Auth.
 * Se o cadastro for bem-sucedido, o Supabase enviará um e-mail de verificação automaticamente.
 * Também cria o registro base na tabela `profiles`.
 *
 * @param request - Dados do registro (email, senha, confirmação de senha, username).
 * @returns Objeto com erros de validação/execução ou nulo em caso de sucesso.
 */
import { AuthController, RegisterRequest, LoginRequest, ConfirmEmailRequest, ChangePasswordRequest } from "../core/AuthController";


const authControllerInstance = new AuthController();

export async function register(request: RegisterRequest) { return authControllerInstance.register(request); }
export async function login(request: LoginRequest) { return authControllerInstance.login(request); }
export async function confirmEmail(request: ConfirmEmailRequest) { return authControllerInstance.confirmEmail(request); }
export async function changePassword(request: ChangePasswordRequest) { return authControllerInstance.changePassword(request); }
export async function getCurrentUser() { return authControllerInstance.getCurrentUser(); }
export async function logout() { return authControllerInstance.logout(); }
export async function forgotPassword(request: { email: string }) { return authControllerInstance.forgotPassword(request); }
