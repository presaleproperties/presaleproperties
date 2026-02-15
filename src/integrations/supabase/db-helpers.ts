/**
 * Helper to cast supabase.from() calls for tables that exist in the database
 * but are not yet in the auto-generated types file.
 * 
 * Usage: fromTable(supabase, "listings").select("*")
 */
import { supabase } from "./client";

type SupabaseClient = typeof supabase;

export function fromTable(client: SupabaseClient, table: string) {
  return (client as any).from(table);
}
