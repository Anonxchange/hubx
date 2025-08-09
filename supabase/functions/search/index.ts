// Supabase Edge Function: Search files in your "hubx" storage bucket (recursive search)

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
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
    );

    // Helper function to recursively list all files
    async function listAllFiles(path = ""): Promise<any[]> {
      const { data, error } = await supabase.storage.from("hubx").list(path, { limit: 1000 });
      if (error) throw error;

      let files: any[] = [];
      for (const item of data) {
        if (item.name.endsWith("/")) {
          // If it's a folder, search inside
          const subFiles = await listAllFiles(`${path}${item.name}`);
          files = files.concat(subFiles);
        } else {
          files.push({ ...item, fullPath: `${path}${item.name}` });
        }
      }
      return files;
    }

    const allFiles = await listAllFiles();

    const results = allFiles.filter(file =>
      file.name.toLowerCase().includes(searchTerm.toLowerCase())
    );

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