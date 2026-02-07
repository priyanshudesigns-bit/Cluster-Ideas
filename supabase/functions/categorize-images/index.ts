import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { createClient } from "npm:@supabase/supabase-js@2.39.3";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, POST, PUT, DELETE, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type, Authorization, X-Client-Info, Apikey",
};

const DESIGN_CATEGORIES = [
  'Typography',
  'UI Design',
  'App Design',
  'Visual Design',
  'Illustration',
  'Graphic Design',
  'Motion Design',
  'Branding',
  'Icon Design',
  'Web Design',
  'Mobile Design',
  'Dashboard Design',
  'Landing Page',
  'Color Palette',
  'Layout',
  'Photography',
  'Other'
];

interface ImageRecord {
  id: string;
  file_path: string;
  category: string | null;
}

Deno.serve(async (req: Request) => {
  if (req.method === "OPTIONS") {
    return new Response(null, {
      status: 200,
      headers: corsHeaders,
    });
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL');
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');

    if (!supabaseUrl || !supabaseServiceKey) {
      throw new Error('Missing Supabase environment variables');
    }

    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    const { groupId } = await req.json();

    if (!groupId) {
      return new Response(
        JSON.stringify({ error: 'groupId is required' }),
        {
          status: 400,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        }
      );
    }

    const { data: images, error: fetchError } = await supabase
      .from('images')
      .select('id, file_path, category')
      .eq('group_id', groupId)
      .is('category', null);

    if (fetchError) throw fetchError;

    if (!images || images.length === 0) {
      return new Response(
        JSON.stringify({ message: 'No uncategorized images found' }),
        {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        }
      );
    }

    const categorizedCount = { success: 0, failed: 0 };

    for (const image of images as ImageRecord[]) {
      try {
        const { data: urlData } = supabase.storage
          .from('screenshots')
          .getPublicUrl(image.file_path);

        const imageUrl = urlData.publicUrl;

        const category = await categorizeImage(imageUrl);

        const { error: updateError } = await supabase
          .from('images')
          .update({ category })
          .eq('id', image.id);

        if (updateError) {
          console.error(`Failed to update image ${image.id}:`, updateError);
          categorizedCount.failed++;
        } else {
          categorizedCount.success++;
        }
      } catch (error) {
        console.error(`Error processing image ${image.id}:`, error);
        categorizedCount.failed++;
      }
    }

    return new Response(
      JSON.stringify({
        message: 'Categorization complete',
        results: categorizedCount,
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );
  } catch (error) {
    console.error('Error in categorize-images function:', error);
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : 'Unknown error' }),
      {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );
  }
});

async function categorizeImage(imageUrl: string): Promise<string> {
  try {
    const prompt = `Analyze this design screenshot and categorize it into ONE of these categories: ${DESIGN_CATEGORIES.join(', ')}.

Guidelines:
- Typography: Focus on text styling, fonts, type specimens
- UI Design: User interface elements, buttons, forms, components
- App Design: Complete mobile or desktop app screens
- Visual Design: General visual compositions, posters, banners
- Illustration: Hand-drawn or digital illustrations, artwork
- Graphic Design: Logos, print materials, marketing graphics
- Motion Design: Animation frames, transitions, motion graphics
- Branding: Brand identities, style guides, brand assets
- Icon Design: Icon sets, individual icons
- Web Design: Website designs, landing pages
- Mobile Design: Mobile app interfaces, responsive designs
- Dashboard Design: Admin panels, data dashboards, analytics UIs
- Landing Page: Marketing landing pages, hero sections
- Color Palette: Color scheme references, palette collections
- Layout: Grid systems, layout structures, wireframes
- Photography: Photos, photo compositions
- Other: If none of the above categories fit

Respond with ONLY the category name, nothing else.`;

    const openaiApiKey = Deno.env.get('OPENAI_API_KEY');

    if (!openaiApiKey) {
      console.warn('OpenAI API key not found, using fallback categorization');
      return categorizeFallback(imageUrl);
    }

    const response = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${openaiApiKey}`,
      },
      body: JSON.stringify({
        model: 'gpt-4o-mini',
        messages: [
          {
            role: 'user',
            content: [
              { type: 'text', text: prompt },
              { type: 'image_url', image_url: { url: imageUrl } },
            ],
          },
        ],
        max_tokens: 50,
      }),
    });

    if (!response.ok) {
      console.error('OpenAI API error:', await response.text());
      return categorizeFallback(imageUrl);
    }

    const result = await response.json();
    const category = result.choices[0]?.message?.content?.trim();

    if (category && DESIGN_CATEGORIES.includes(category)) {
      return category;
    }

    return 'Other';
  } catch (error) {
    console.error('Error in categorizeImage:', error);
    return categorizeFallback(imageUrl);
  }
}

function categorizeFallback(imageUrl: string): string {
  const url = imageUrl.toLowerCase();

  if (url.includes('ui') || url.includes('button') || url.includes('form')) {
    return 'UI Design';
  } else if (url.includes('app') || url.includes('mobile')) {
    return 'App Design';
  } else if (url.includes('web') || url.includes('landing')) {
    return 'Web Design';
  } else if (url.includes('logo') || url.includes('brand')) {
    return 'Branding';
  } else if (url.includes('icon')) {
    return 'Icon Design';
  } else if (url.includes('dashboard') || url.includes('admin')) {
    return 'Dashboard Design';
  }

  return 'Other';
}
