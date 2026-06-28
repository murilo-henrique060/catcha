"use server";

import { redirect } from "next/navigation";

import { createSupabaseServerClient } from "@/lib/services/supabase/server";

export async function registerAction(formData: FormData) {
  const username = String(formData.get("username") ?? "").trim();
  const email = String(formData.get("email") ?? "").trim();
  const password = String(formData.get("password") ?? "");
  const confirmPassword = String(formData.get("confirmPassword") ?? "");
  const termsAccepted = formData.get("terms") === "on";

  if (!username || !email || !password || !confirmPassword) {
    redirect("/auth/register?error=missing_required_fields");
  }

  if (password !== confirmPassword) {
    redirect("/auth/register?error=passwords_do_not_match");
  }

  if (!termsAccepted) {
    redirect("/auth/register?error=terms_not_accepted");
  }

  const supabase = await createSupabaseServerClient();
  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000";

  const { error } = await supabase.auth.signUp({
    email,
    password,
    options: {
      emailRedirectTo: `${siteUrl}/auth/callback?next=/home`,
      data: {
        username,
      },
    },
  });

  if (error) {
    if (error.message.toLowerCase().includes("already registered")) {
      redirect("/auth/register?error=email_already_registered");
    }

    redirect("/auth/register?error=register_failed");
  }

  redirect(`/auth/verify-email?reason=signup&email=${encodeURIComponent(email)}`);
}

export async function loginAction(formData: FormData) {
  const email = String(formData.get("email") ?? "").trim();
  const password = String(formData.get("password") ?? "");

  if (!email || !password) {
    redirect("/auth/login?error=preencha-os-campos-obrigatorios");
  }

  const supabase = await createSupabaseServerClient();
  const { error } = await supabase.auth.signInWithPassword({
    email,
    password,
  });

  if (error) {
    if (error.message.toLowerCase().includes("email not confirmed")) {
      redirect(`/auth/verify-email?reason=login&email=${encodeURIComponent(email)}`);
    }

    redirect(`/auth/login?error=${encodeURIComponent(error.message)}`);
  }

  redirect("/home");
}

export async function forgotPasswordAction(formData: FormData) {
  const email = String(formData.get("email") ?? "").trim();

  if (!email) {
    redirect("/auth/forgot-password?error=missing_email");
  }

  const supabase = await createSupabaseServerClient();
  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000";
  const { error } = await supabase.auth.resetPasswordForEmail(email, {
    redirectTo: `${siteUrl}/auth/callback?next=/auth/change-password`,
  });

  if (error) {
    redirect("/auth/forgot-password?error=recovery_email_failed");
  }

  redirect(`/auth/verify-email?reason=recovery&email=${encodeURIComponent(email)}`);
}

export async function changePasswordAction(formData: FormData) {
  const password = String(formData.get("password") ?? "");
  const confirmPassword = String(formData.get("confirmPassword") ?? "");

  if (!password || !confirmPassword) {
    redirect("/auth/change-password?error=missing_required_fields");
  }

  if (password !== confirmPassword) {
    redirect("/auth/change-password?error=passwords_do_not_match");
  }

  if (password.length < 6) {
    redirect("/auth/change-password?error=password_too_short");
  }

  const supabase = await createSupabaseServerClient();
  const { error } = await supabase.auth.updateUser({ password });

  if (error) {
    redirect("/auth/change-password?error=change_password_failed");
  }

  redirect("/auth/login?password_reset=1");
}

export async function logoutAction() {
  const supabase = await createSupabaseServerClient();
  await supabase.auth.signOut();

  redirect("/auth/login");
}