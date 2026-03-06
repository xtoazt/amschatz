const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version',
};

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  if (req.method !== 'POST') {
    return new Response(JSON.stringify({ error: 'Method not allowed' }), {
      status: 405,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }

  try {
    const { q, limit } = await req.json();
    if (!q || typeof q !== 'string' || q.length > 200) {
      return new Response(JSON.stringify({ results: [] }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const apiKey = Deno.env.get('KLIPY_API_KEY');
    if (!apiKey) {
      console.error('KLIPY_API_KEY not configured');
      return new Response(JSON.stringify({ error: 'Not configured' }), {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const perPage = Math.min(Math.max(limit || 24, 8), 50);
    const url = `https://api.klipy.com/api/v1/${apiKey}/gifs/search?q=${encodeURIComponent(q)}&per_page=${perPage}&customer_id=v0id_anon&page=1`;

    const response = await fetch(url);

    if (!response.ok) {
      const text = await response.text();
      console.error('Klipy error:', response.status, text.substring(0, 300));
      return new Response(JSON.stringify({ error: 'API error', status: response.status }), {
        status: 502,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const json = await response.json();
    const items = json?.data?.data || [];

    const results = items.map((item: any) => ({
      id: String(item.id || item.slug || Math.random()),
      slug: item.slug || '',
      url: item.file?.hd?.gif?.url || item.file?.md?.gif?.url || item.file?.sm?.gif?.url || '',
      preview_url: item.file?.sm?.gif?.url || item.file?.sm?.webp?.url || item.file?.md?.gif?.url || '',
      width: item.file?.sm?.gif?.width || item.file?.md?.gif?.width || 200,
      height: item.file?.sm?.gif?.height || item.file?.md?.gif?.height || 200,
    })).filter((r: any) => r.url);

    return new Response(JSON.stringify({ results }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  } catch (err) {
    console.error('gif-search error:', err);
    return new Response(JSON.stringify({ error: 'Search failed' }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
