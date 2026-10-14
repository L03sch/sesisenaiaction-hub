import { createClient } from "npm:@supabase/supabase-js@2.58.0";

export async function personalPasswordReady(user: { app_metadata?: Record<string, unknown> }, authorization: string): Promise<boolean> {
  if (user.app_metadata?.must_change_password === true) return false;
  if (!user.app_metadata?.initial_password_changed_at) return true;
  const client = createClient(Deno.env.get("SUPABASE_URL")!, Deno.env.get("SUPABASE_ANON_KEY")!, {
    global: { headers: { Authorization: authorization } },
    auth: { autoRefreshToken: false, persistSession: false },
  });
  const { data, error } = await client.rpc("password_setup_complete");
  if (error) throw error;
  return data === true;
}
