'use server';

import { redirect } from "next/navigation";
import { z } from "zod";

import { createSupabaseServerClient } from "@/lib/services/supabase/server";

export type RegisterRequest = {
  username: string;
  email: string;
  password: string;
  confirmPassword: string;
  terms: boolean;
};

export type ConfirmEmailRequest = {
  code: string;
};

export type LoginRequest = {
  email: string;
  password: string;
  rememberMe: boolean;
};

export type ChangePasswordRequest = {
  password: string;
  confirmPassword: string;
};

export async function register(request: RegisterRequest) {
  const supabase = await createSupabaseServerClient();

  const registerSchema = z.object({
    username: z.string("Nome de usuário é obrigatório.")
      .min(3, "Nome de usuário deve ter no mínimo 3 caracteres.")
      .max(20, "Nome de usuário deve ter no máximo 20 caracteres.")
      .regex(/^[a-zA-Z0-9_]+$/, "O nome de usuário deve conter apenas letras, números e sublinhados (_)"),

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
    console.error("Supabase sign up error:", error);
    let msg = error.message;
    return { errors: { general: { errors: `Erro ao registrar usuário` } } };
  }

  const { error: profileError } = await supabase.from('profiles').insert({
    id: data.user?.id,
    username: validationResult.data.username.toLowerCase(),
  });

  if (profileError) {
    console.error("Profile database insertion error:", profileError);
    return {
      errors: {
        general: { errors: `Erro ao criar perfil do usuário: ${profileError.message}` },
      },
    };
  }

  return { errors: null };
}

export async function login(request: LoginRequest) {
  const supabase = await createSupabaseServerClient();

  const loginSchema = z.object({
    email: z.email("Email inválido"),
    password: z.string().min(1, "Senha é obrigatória"),
    rememberMe: z.boolean().optional(),
  });

  const validationResult = await loginSchema.safeParseAsync(request);

  if (!validationResult.success) {
    const errors = z.treeifyError(validationResult.error).properties;
    return { errors };
  }

  const { error } = await supabase.auth.signInWithPassword({
    email: validationResult.data.email,
    password: validationResult.data.password,
  });

  if (error) {
    console.error("Supabase login error:", error);
    const lowerMessage = (error.message || "").toLowerCase();
    if (lowerMessage.includes("email not confirmed")) {
      // Automatically resend verification email
      await supabase.auth.resend({
        type: 'signup',
        email: validationResult.data.email,
        options: {
          emailRedirectTo: `${process.env.NEXT_PUBLIC_SITE_URL ?? 'http://localhost:3000'}/auth/callback`,
        }
      });

      return {
        errors: {
          general: { errors: "Confirme seu e-mail para continuar." },
          emailNotConfirmed: true,
        },
      };
    }

    if (lowerMessage.includes("invalid login credentials")) {
      return {
        errors: {
          general: { errors: "E-mail ou senha inválidos." },
        },
      };
    }

    let msg = error.message;
    if (msg === "{}" || !msg) {
      msg = "Erro interno do servidor Supabase (500). Tente novamente mais tarde.";
    }

    return {
      errors: {
        general: { errors: msg },
      },
    };
  }

  return { errors: null };
}

export async function confirmEmail(request: ConfirmEmailRequest) {
  const supabase = await createSupabaseServerClient();

  const confirmEmailSchema = z.object({
    code: z.string().min(1, "Código é obrigatório"),
  });

  const validationResult = await confirmEmailSchema.safeParseAsync(request);

  if (!validationResult.success) {
    return { error: new Error("Código inválido") };
  }

  const { error } = await supabase.auth.exchangeCodeForSession(validationResult.data.code);

  return { error };
}

export async function changePassword(request: ChangePasswordRequest) {
  const supabase = await createSupabaseServerClient();

  const changePasswordSchema = z.object({
    password: z.string()
      .min(8, "Senha deve ter no mínimo 8 caracteres.")
      .max(100, "Senha deve ter no máximo 100 caracteres."),
    confirmPassword: z.string(),
  }).refine((data) => data.password === data.confirmPassword, {
    message: "As senhas não conferem",
    path: ["confirmPassword"],
  });

  const validationResult = await changePasswordSchema.safeParseAsync(request);

  if (!validationResult.success) {
    const errors = z.treeifyError(validationResult.error).properties;
    return { errors };
  }

  const { error } = await supabase.auth.updateUser({
    password: validationResult.data.password,
  });

  if (error) {
    return {
      errors: {
        general: { errors: "Erro ao alterar a senha. Tente novamente." },
      },
    };
  }

  return { errors: null };
}

export async function getCurrentUser() {
  const supabase = await createSupabaseServerClient();
  const { data, error } = await supabase.auth.getUser();

  if (error) {
    return null;
  }
  
  return data.user;
}

export async function logout() {
  const supabase = await createSupabaseServerClient();
  await supabase.auth.signOut();
  redirect("/auth/login");
}
export async function forgotPassword(request: { email: string }) {
  const supabase = await createSupabaseServerClient();
  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000";

  const { error } = await supabase.auth.resetPasswordForEmail(request.email, {
    redirectTo: `${siteUrl}/auth/change-password`,
  });

  if (error) {
    console.error("Error resetting password:", error);
    return {
      errors: {
        general: { errors: "Não foi possível enviar o e-mail de recuperação agora. Tente novamente em instantes." },
      },
    };
  }

  return { success: true };
}
