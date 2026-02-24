'use server'

import { createClient } from "@supabase/supabase-js"; // Note: standard client, not server helper
import { env } from "@/lib/env";
import { revalidatePath } from "next/cache";
import { getServerSession } from "next-auth";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";

// Create a private admin client that ignores RLS
const supabaseAdmin = createClient(
  env.NEXT_PUBLIC_SUPABASE_URL,
  env.SUPABASE_SERVICE_ROLE_KEY
);

export async function addAllowedUser(formData: FormData) {
  // 1. SECURITY: Manually check if the user is actually an admin in the code
  const session = await getServerSession(authOptions);
  if (session?.user?.role !== 'admin') {
    return { error: "You are not authorized to perform this action." };
  }

  const email = formData.get("email") as string;
  if (!email) return { error: "Email is required" };

  // 2. INSERT using the admin client (RLS is ignored)
  const { error } = await supabaseAdmin
    .from("allowed_users")
    .insert([{ email: email.toLowerCase().trim() }]);

  if (error) {
    console.error(error);
    return { error: "Could not add email. It might already exist." };
  }

  revalidatePath("/dashboard/admin");
}

export async function removeAllowedUser(id: string) {
  // 1. SECURITY: Manually check if the user is an admin
  const session = await getServerSession(authOptions);
  if (session?.user?.role !== 'admin') {
    return { error: "Unauthorized" };
  }

  // 2. DELETE using the admin client
  const { error } = await supabaseAdmin
    .from("allowed_users")
    .delete()
    .eq("id", id);

  if (error) return { error: "Failed to delete" };

  revalidatePath("/dashboard/admin");
}