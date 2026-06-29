"use server";

import { redirect } from "next/navigation";
import { createSupabaseServerClient } from "@/lib/services/supabase/server";

export async function forgotPasswordAction(formData: FormData) {
  const email = formData.get("email") as string;

  if (!email) {
    redirect("/auth/forgot-password?error=missing_email");
  }

  const supabase = await createSupabaseServerClient();
  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000";

  const { error } = await supabase.auth.resetPasswordForEmail(email, {
    redirectTo: `${siteUrl}/auth/change-password`,
  });

  if (error) {
    console.error("Error resetting password:", error);
    redirect("/auth/forgot-password?error=recovery_email_failed");
  }

  redirect("/auth/login?message=recovery_email_sent");
}
