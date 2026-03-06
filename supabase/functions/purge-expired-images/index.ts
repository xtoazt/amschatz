import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
};

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  const supabase = createClient(
    Deno.env.get("SUPABASE_URL")!,
    Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
  );

  // 10-minute burn window
  const tenMinutesAgo = new Date(Date.now() - 10 * 60 * 1000).toISOString();

  const { data: files, error: listError } = await supabase.storage
    .from("chat-images")
    .list("", { limit: 1000 });

  if (listError) {
    return new Response(JSON.stringify({ error: listError.message }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }

  const expired = (files || []).filter(
    (f) => f.created_at && new Date(f.created_at) < new Date(tenMinutesAgo)
  );

  if (expired.length > 0) {
    const paths = expired.map((f) => f.name);
    await supabase.storage.from("chat-images").remove(paths);
  }

  return new Response(
    JSON.stringify({ purged: expired.length, window: "10min" }),
    { headers: { ...corsHeaders, "Content-Type": "application/json" } }
  );
});
