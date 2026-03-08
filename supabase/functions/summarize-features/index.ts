import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version',
};

const REPO = 'hypnotized1337/Anonymous-Chat';

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const serviceRoleKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, serviceRoleKey);

    // Fetch latest commit SHA from GitHub
    const ghRes = await fetch(`https://api.github.com/repos/${REPO}/commits?per_page=1`);
    if (!ghRes.ok) throw new Error(`GitHub API returned ${ghRes.status}`);
    const [latestCommit] = await ghRes.json();
    const latestSha = latestCommit.sha as string;

    // Check cache
    const { data: cached } = await supabase
      .from('feature_summaries')
      .select('summary')
      .eq('latest_sha', latestSha)
      .maybeSingle();

    if (cached) {
      return new Response(JSON.stringify({ summary: cached.summary, cached: true }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // Fetch recent commit messages for context
    const commitsRes = await fetch(`https://api.github.com/repos/${REPO}/commits?per_page=100`);
    if (!commitsRes.ok) throw new Error(`GitHub API returned ${commitsRes.status}`);
    const commits = await commitsRes.json();
    const commitMessages = commits.map((c: any) => c.commit.message.split('\n')[0]).join('\n');

    const LOVABLE_API_KEY = Deno.env.get('LOVABLE_API_KEY');
    if (!LOVABLE_API_KEY) {
      return new Response(JSON.stringify({ error: 'AI not configured' }), {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const aiRes = await fetch('https://ai.gateway.lovable.dev/v1/chat/completions', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${LOVABLE_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'google/gemini-2.5-flash',
        messages: [
          {
            role: 'system',
            content: `You are describing "v0id", an anonymous ephemeral chat application. Based on the commit history provided, identify and list the CORE and most important features of the app. Prioritize fundamental chat functionality first (messaging, rooms, anonymity, ephemeral messages), then list significant secondary features. Do NOT include minor tweaks, small UI changes, or internal refactors. Use - bullet points. Be specific (e.g. "GIF picker powered by Klipy API" not "media support"). Keep it under 15 bullets, ordered by importance. No intro paragraph, just the bullet list.`,
          },
          {
            role: 'user',
            content: `Here are the recent commits:\n\n${commitMessages}`,
          },
        ],
        stream: false,
      }),
    });

    if (!aiRes.ok) {
      if (aiRes.status === 429) {
        return new Response(JSON.stringify({ error: 'Rate limit exceeded, try again later.' }), {
          status: 429, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }
      if (aiRes.status === 402) {
        return new Response(JSON.stringify({ error: 'AI usage limit reached.' }), {
          status: 402, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }
      throw new Error('AI summarization failed');
    }

    const aiData = await aiRes.json();
    const summary = aiData.choices?.[0]?.message?.content || 'No summary generated.';

    // Delete old rows and insert new cached summary
    await supabase.from('feature_summaries').delete().neq('latest_sha', latestSha);
    await supabase.from('feature_summaries').insert({ latest_sha: latestSha, summary });

    return new Response(JSON.stringify({ summary, cached: false }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  } catch (err) {
    console.error('summarize-features error:', err);
    return new Response(JSON.stringify({ error: 'Failed to generate features summary' }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
