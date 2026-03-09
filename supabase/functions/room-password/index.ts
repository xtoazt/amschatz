import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

async function hashPassword(password: string): Promise<string> {
  const encoder = new TextEncoder();
  const data = encoder.encode(password);
  const hash = await crypto.subtle.digest("SHA-256", data);
  return Array.from(new Uint8Array(hash)).map(b => b.toString(16).padStart(2, "0")).join("");
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { action, roomCode, password, username } = await req.json();

    if (!roomCode || typeof roomCode !== "string" || roomCode.length > 30) {
      return new Response(JSON.stringify({ error: "Invalid room code" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const serviceRoleKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, serviceRoleKey);

    if (action === "set") {
      // Set password for a room
      if (!password || typeof password !== "string" || password.length < 1 || password.length > 100) {
        return new Response(JSON.stringify({ error: "Invalid password" }), {
          status: 400,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }

      const hashed = await hashPassword(password);

      const { error } = await supabase
        .from("room_passwords")
        .upsert({ room_code: roomCode, password_hash: hashed, created_by: username || "unknown" }, { onConflict: "room_code" });

      if (error) throw error;

      return new Response(JSON.stringify({ success: true }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    if (action === "check") {
      // Check if room has a password
      const { data } = await supabase
        .from("room_passwords")
        .select("id")
        .eq("room_code", roomCode)
        .maybeSingle();

      return new Response(JSON.stringify({ hasPassword: !!data }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    if (action === "verify") {
      // Verify password for a room
      if (!password || typeof password !== "string") {
        return new Response(JSON.stringify({ valid: false }), {
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }

      const hashed = await hashPassword(password);

      const { data } = await supabase
        .from("room_passwords")
        .select("password_hash")
        .eq("room_code", roomCode)
        .maybeSingle();

      if (!data) {
        return new Response(JSON.stringify({ valid: true, noPassword: true }), {
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }

      return new Response(JSON.stringify({ valid: data.password_hash === hashed }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    if (action === "delete") {
      // Delete room password (called when room empties)
      await supabase
        .from("room_passwords")
        .delete()
        .eq("room_code", roomCode);

      return new Response(JSON.stringify({ success: true }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    return new Response(JSON.stringify({ error: "Unknown action" }), {
      status: 400,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (err) {
    return new Response(JSON.stringify({ error: "Internal error" }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
