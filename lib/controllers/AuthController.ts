'use server';

import { z } from "zod";

import { createSupabaseServerClient } from "@/lib/services/supabase/server";

export type RegisterRequest = {
  username: string;
  email: string;
  password: string;
  confirmPassword: string;
  terms: boolean;
};

export type LoginRequest = {
  email: string;
  password: string;
  rememberMe: boolean;
};

export async function register(request: RegisterRequest) {
  const supabase = await createSupabaseServerClient();

  const registerSchema = z.object({
    username: z.string("Nome de usuário é obrigatório.")
      .min(3, "Nome de usuário deve ter no mínimo 3 caracteres.")
      .max(20, "Nome de usuário deve ter no máximo 20 caracteres."),

    email: z.email("Email inválido"),

    password: z.string()
      .min(8, "Senha deve ter no mínimo 8 caracteres.")
      .max(100, "Senha deve ter no máximo 100 caracteres."),
    
    confirmPassword: z.string(),
    
    terms: z.boolean("Você deve concordar com os termos de serviço.")
      .refine((agreeToTerms) => agreeToTerms === true, {
        message: "Você deve concordar com os termos de serviço.",
      }),
  }).refine((data) => data.password === data.confirmPassword, {
    message: "As senhas não conferem",
    path: ["confirmPassword"],
  }).refine(async (data) => {
    const { data: profileData, error } = await supabase
      .from('profiles')
      .select('username')
      .eq('username', data.username.toLowerCase()) // assuming lowercase storage
      .maybeSingle();

    if (error) {
      console.error("Error checking username:", error);
      return false;
    }

    return !profileData;
  }, {
    message: "Nome de usuário já existe.",
    path: ["username"],
  });

  const validationResult = await registerSchema.safeParseAsync(request);
  
  if (!validationResult.success) {
    const errors = z.treeifyError(validationResult.error).properties;
    return { errors };
  }

  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000";

  const { data, error } = await supabase.auth.signUp({
    email: validationResult.data.email,
    password: validationResult.data.password,
    options: {
      emailRedirectTo: `${siteUrl}/auth/callback?next=/home`,
    },
  });

  if (data.user && data.user.identities && data.user.identities.length === 0) {
    return { errors: { email: { errors: "Email já está em uso." } } };
  }

  if (error) {
    return { errors: { general: { errors: "Erro ao registrar usuário." } } };
  }

  await supabase.from('profiles').insert({
    id: data.user?.id,
    username: validationResult.data.username.toLowerCase(),
  });

  return { errors: null };
}

async function login() {
  
}

export async function getCurrentUser() {
  const supabase = await createSupabaseServerClient();
  const { data, error } = await supabase.auth.getUser();

  if (error) {
    return null;
  }
  
  return data.user;
}

async function confirmEmail() {
  
}

async function logout() {

}