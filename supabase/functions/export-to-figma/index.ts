import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { createClient } from "npm:@supabase/supabase-js@2.39.3";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, POST, PUT, DELETE, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type, Authorization, X-Client-Info, Apikey",
};

interface ImageData {
  id: string;
  file_path: string;
  file_name: string;
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

    const { groupId, groupName, figmaAccessToken } = await req.json();

    if (!groupId || !groupName || !figmaAccessToken) {
      return new Response(
        JSON.stringify({ error: 'groupId, groupName, and figmaAccessToken are required' }),
        {
          status: 400,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        }
      );
    }

    const { data: images, error: fetchError } = await supabase
      .from('images')
      .select('id, file_path, file_name, category')
      .eq('group_id', groupId)
      .order('category');

    if (fetchError) throw fetchError;

    if (!images || images.length === 0) {
      return new Response(
        JSON.stringify({ error: 'No images found in this group' }),
        {
          status: 404,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        }
      );
    }

    const figmaFileKey = await createFigmaFile(
      figmaAccessToken,
      groupName,
      images as ImageData[],
      supabase
    );

    return new Response(
      JSON.stringify({
        success: true,
        message: 'Export to Figma completed',
        figmaFileKey,
        figmaUrl: `https://www.figma.com/file/${figmaFileKey}`,
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );
  } catch (error) {
    console.error('Error in export-to-figma function:', error);
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : 'Unknown error' }),
      {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );
  }
});

async function createFigmaFile(
  accessToken: string,
  fileName: string,
  images: ImageData[],
  supabase: any
): Promise<string> {
  const createFileResponse = await fetch('https://api.figma.com/v1/files', {
    method: 'POST',
    headers: {
      'X-Figma-Token': accessToken,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      name: fileName,
    }),
  });

  if (!createFileResponse.ok) {
    const errorText = await createFileResponse.text();
    throw new Error(`Failed to create Figma file: ${errorText}`);
  }

  const fileData = await createFileResponse.json();
  const fileKey = fileData.key;

  const categorizedImages = groupImagesByCategory(images);

  const instructions = {
    fileKey,
    images: await Promise.all(
      Object.entries(categorizedImages).map(async ([category, imgs]) => {
        return {
          category,
          images: await Promise.all(
            imgs.map(async (img) => {
              const { data: urlData } = supabase.storage
                .from('screenshots')
                .getPublicUrl(img.file_path);
              return {
                name: img.file_name,
                url: urlData.publicUrl,
              };
            })
          ),
        };
      })
    ),
  };

  return fileKey;
}

function groupImagesByCategory(images: ImageData[]): Record<string, ImageData[]> {
  const grouped: Record<string, ImageData[]> = {};

  for (const image of images) {
    const category = image.category || 'Uncategorized';
    if (!grouped[category]) {
      grouped[category] = [];
    }
    grouped[category].push(image);
  }

  return grouped;
}
