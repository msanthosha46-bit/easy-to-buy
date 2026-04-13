import { createClient } from "@supabase/supabase-js";

const supabaseUrl = "https://yizpkfmvrsfupntlmyvx.supabase.co";
const supabaseAnonKey =
  "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InlpenBrZm12cnNmdXBudGxteXZ4Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzUwNDE1NDMsImV4cCI6MjA5MDYxNzU0M30._0gf4309c01NH846OZZj12b9W1sJNasksRWeuTHGl7I";

export const supabase = createClient(supabaseUrl, supabaseAnonKey);