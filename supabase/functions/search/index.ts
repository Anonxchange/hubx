// Supabase Edge Function: Search videos in your metadata table

import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

serve(async (req) => {
  try {
    const { searchTerm } = await req.json();

    if (!searchTerm) {
      return new Response(JSON.stringify({ error: "searchTerm is required" }), {
        status: 400,
        headers: { "Content-Type": "application/json" },
      });
    }

    const supabase = createClient(
      Deno.env.get("PROJECT_URL")!,
      Deno.env.get("SERVICE_ROLE_KEY")!
    );

    // Search by title or description
    const { data, error } = await supabase
      .from("videos") // <-- change if your table name is different
      .select("*")
      .or(
        `title.ilike.%${searchTerm}%,description.ilike.%${searchTerm}%`
      )
      .limit(50);

    if (error) throw error;

    return new Response(JSON.stringify(data), {
      status: 200,
      headers: { "Content-Type": "application/json" },
    });

  } catch (err) {
    return new Response(JSON.stringify({ error: err.message }), {
      status: 500,
      headers: { "Content-Type": "application/json" },
    });
  }
});