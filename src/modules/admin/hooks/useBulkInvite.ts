import { supabase } from "@/integrations/supabase/client";

interface BulkInviteEntry {
  id: string;
  email: string;
  role: "admin" | "editor" | "viewer";
  status: "valid" | "invalid" | "duplicate" | "existing" | "sent" | "error";
  error?: string;
}

export async function checkExistingInvitations(
  companyId: string,
  emails: string[]
): Promise<Set<string>> {
  const { data: existingInvitations } = await supabase
    .from("user_invitations")
    .select("email")
    .eq("company_id", companyId)
    .in("email", emails);

  return new Set(existingInvitations?.map((i) => i.email.toLowerCase()) || []);
}

export async function sendInvitation(
  entry: BulkInviteEntry,
  companyId: string,
  userId: string
): Promise<{ success: boolean }> {
  const token = crypto.randomUUID();
  const expiresAt = new Date();
  expiresAt.setDate(expiresAt.getDate() + 7);

  const { error } = await supabase.from("user_invitations").insert({
    email: entry.email,
    company_id: companyId,
    role: entry.role,
    invited_by: userId,
    token,
    expires_at: expiresAt.toISOString(),
  });

  if (error) throw error;
  return { success: true };
}
