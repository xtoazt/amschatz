import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version',
};

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const serviceRoleKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, serviceRoleKey);

    // Get latest SHA from cached commits
    const { data: meta } = await supabase
      .from('commits_cache_meta')
      .select('latest_sha')
      .limit(1)
      .maybeSingle();

    if (!meta) {
      return new Response(JSON.stringify({ error: 'No cached commits available. Visit the changelog first.' }), {
        status: 404,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const latestSha = meta.latest_sha;

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

    // Get commit messages from cache
    const { data: commits } = await supabase
      .from('cached_commits')
      .select('message')
      .order('author_date', { ascending: false })
      .limit(100);

    const commitMessages = (commits || []).map((c: any) => c.message.split('\n')[0]).join('\n');

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
            content: `You are listing the features of "v0id", an anonymous ephemeral chat app. Your job is to output a bullet list of features and nothing else. Do NOT add commentary, disclaimers, or say what you can't determine. Do NOT refuse. Infer features from commit messages — even if commits are about improvements, they imply the underlying feature exists. For example: "fix reaction picker" implies there IS a reaction system. "improve mobile header" implies there IS a mobile-responsive UI. Always include these core features that define the app: anonymous identity (no accounts), ephemeral/self-destructing messages, chat rooms users can create and join, real-time messaging, image and file sharing, GIF picker. Then add any additional features you can infer from the commits. Use - bullet points. Be specific. Max 15 bullets. No intro, no explanation, just the list.`,
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
