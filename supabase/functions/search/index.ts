// Supabase Edge Function: Search files in your "hubx" storage bucket

import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

// This function runs whenever someone calls the endpoint
serve(async (req) => {
  try {
    // Read the JSON body from the request
    const { searchTerm } = await req.json();

    if (!searchTerm) {
      return new Response(JSON.stringify({ error: "searchTerm is required" }), {
        status: 400,
        headers: { "Content-Type": "application/json" },
      });
    }

    // Connect to Supabase with the Service Role key (secure key)
    const supabase = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
    );

    // List all files in your bucket
    const { data, error } = await supabase
      .storage
      .from("hubx") // <-- bucket name
      .list("", { limit: 1000 });

    if (error) throw error;

    // Filter files by search term (case-insensitive)
    const results = data.filter(file =>
      file.name.toLowerCase().includes(searchTerm.toLowerCase())
    );

    // Return matching files
    return new Response(JSON.stringify(results), {
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
