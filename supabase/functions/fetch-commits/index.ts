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

    // Check if we have cached data
    const { data: meta } = await supabase
      .from('commits_cache_meta')
      .select('latest_sha, updated_at')
      .limit(1)
      .maybeSingle();

    // Try to check latest SHA from GitHub (single lightweight request)
    let needsRefresh = !meta;
    let latestSha: string | null = null;

    try {
      const headRes = await fetch(`https://api.github.com/repos/${REPO}/commits?per_page=1`);
      if (headRes.ok) {
        const [latest] = await headRes.json();
        latestSha = latest?.sha;
        if (meta && meta.latest_sha === latestSha) {
          needsRefresh = false;
        } else {
          needsRefresh = true;
        }
      } else if (headRes.status === 403) {
        // Rate limited — use cache if available
        if (meta) {
          needsRefresh = false;
        } else {
          return new Response(JSON.stringify({ error: 'GitHub API rate limited and no cache available' }), {
            status: 503,
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          });
        }
      }
    } catch {
      // Network error — use cache if available
      if (!meta) {
        return new Response(JSON.stringify({ error: 'Cannot reach GitHub and no cache available' }), {
          status: 503,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }
      needsRefresh = false;
    }

    if (needsRefresh) {
      // Fetch all commits from GitHub
      let allCommits: any[] = [];
      let page = 1;
      let hasMore = true;

      while (hasMore) {
        const res = await fetch(`https://api.github.com/repos/${REPO}/commits?per_page=100&page=${page}`);
        if (!res.ok) break;
        const data = await res.json();
        allCommits = [...allCommits, ...data];
        hasMore = data.length === 100;
        page++;
      }

      if (allCommits.length > 0) {
        // Clear old cache and insert new
        await supabase.from('cached_commits').delete().neq('sha', '');
        
        // Insert in batches of 50
        for (let i = 0; i < allCommits.length; i += 50) {
          const batch = allCommits.slice(i, i + 50).map((c: any) => ({
            sha: c.sha,
            message: c.commit.message,
            author_name: c.commit.author.name,
            author_date: c.commit.author.date,
            html_url: c.html_url,
          }));
          await supabase.from('cached_commits').upsert(batch, { onConflict: 'sha' });
        }

        // Update meta
        await supabase.from('commits_cache_meta').delete().neq('latest_sha', '');
        await supabase.from('commits_cache_meta').insert({
          latest_sha: allCommits[0].sha,
          total_commits: allCommits.length,
        });
      }
    }

    // Return cached commits
    const { data: commits } = await supabase
      .from('cached_commits')
      .select('sha, message, author_name, author_date, html_url')
      .order('author_date', { ascending: false });

    return new Response(JSON.stringify({ commits: commits || [], cached: !needsRefresh }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  } catch (err) {
    console.error('fetch-commits error:', err);
    return new Response(JSON.stringify({ error: 'Failed to fetch commits' }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
