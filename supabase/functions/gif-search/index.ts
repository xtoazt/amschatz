const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
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
      return new Response(JSON.stringify({ error: 'Not configured' }), {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const perPage = Math.min(Math.max(limit || 20, 8), 50);
    const url = `https://api.klipy.com/api/v1/${apiKey}/gifs/search?q=${encodeURIComponent(q)}&per_page=${perPage}&customer_id=anon&content_filter=high`;

    const response = await fetch(url);
    const data = await response.json();

    if (!data.result || !data.data?.items) {
      return new Response(JSON.stringify({ results: [] }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const results = data.data.items.map((item: any) => ({
      id: item.id || item.slug,
      url: item.formats?.md?.gif?.url || item.formats?.sm?.gif?.url || '',
      preview_url: item.formats?.xs?.gif?.url || item.formats?.sm?.gif?.url || '',
      width: item.formats?.sm?.gif?.width || 200,
      height: item.formats?.sm?.gif?.height || 200,
    })).filter((r: any) => r.url);

    return new Response(JSON.stringify({ results }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  } catch (err) {
    return new Response(JSON.stringify({ error: 'Search failed' }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
