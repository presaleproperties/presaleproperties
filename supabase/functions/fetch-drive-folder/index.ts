import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { folderUrl } = await req.json();
    
    if (!folderUrl) {
      return new Response(
        JSON.stringify({ error: 'No folder URL provided' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    console.log('Fetching Drive folder:', folderUrl);

    // Extract folder ID from various Google Drive URL formats
    const folderIdMatch = folderUrl.match(/\/folders\/([a-zA-Z0-9_-]+)/);
    if (!folderIdMatch) {
      return new Response(
        JSON.stringify({ error: 'Invalid Google Drive folder URL. Please use a folder share link.' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const folderId = folderIdMatch[1];
    console.log('Folder ID:', folderId);

    // Try to fetch the folder's HTML page to extract file IDs
    // This works for publicly shared folders
    const folderPageUrl = `https://drive.google.com/drive/folders/${folderId}`;
    
    const response = await fetch(folderPageUrl, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
      }
    });

    if (!response.ok) {
      console.error('Failed to fetch folder page:', response.status);
      return new Response(
        JSON.stringify({ 
          error: 'Could not access folder. Make sure it is shared as "Anyone with the link".' 
        }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const html = await response.text();
    
    // Extract file IDs from the page HTML
    // Google Drive embeds file data in a specific format
    const fileIdPattern = /\["([a-zA-Z0-9_-]{25,})"/g;
    const potentialIds = new Set<string>();
    let match;
    
    while ((match = fileIdPattern.exec(html)) !== null) {
      const id = match[1];
      // Filter to likely file IDs (25-45 chars, alphanumeric with dash/underscore)
      if (id.length >= 25 && id.length <= 45 && /^[a-zA-Z0-9_-]+$/.test(id)) {
        potentialIds.add(id);
      }
    }

    // Also try to find IDs in data-id attributes
    const dataIdPattern = /data-id="([a-zA-Z0-9_-]{25,45})"/g;
    while ((match = dataIdPattern.exec(html)) !== null) {
      potentialIds.add(match[1]);
    }

    console.log('Found potential file IDs:', potentialIds.size);

    if (potentialIds.size === 0) {
      return new Response(
        JSON.stringify({ 
          error: 'No files found in folder. Make sure folder contains images and is publicly shared.',
          suggestion: 'Try sharing individual image links instead.'
        }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Convert to image URLs and validate them
    const imageUrls: string[] = [];
    const ids = Array.from(potentialIds).slice(0, 50); // Limit to 50 files
    
    for (const fileId of ids) {
      // Skip the folder ID itself
      if (fileId === folderId) continue;
      
      const imageUrl = `https://drive.google.com/uc?export=view&id=${fileId}`;
      
      // Quick HEAD request to validate it's accessible
      try {
        const checkResponse = await fetch(imageUrl, { 
          method: 'HEAD',
          redirect: 'follow'
        });
        
        const contentType = checkResponse.headers.get('content-type') || '';
        if (contentType.includes('image') || checkResponse.ok) {
          imageUrls.push(imageUrl);
          console.log('Valid image found:', fileId);
        }
      } catch (e) {
        // Skip inaccessible files
        console.log('Skipping file:', fileId);
      }
      
      // Limit to 20 valid images
      if (imageUrls.length >= 20) break;
    }

    if (imageUrls.length === 0) {
      return new Response(
        JSON.stringify({ 
          error: 'Could not load any images from this folder.',
          suggestion: 'Make sure the folder contains image files and is publicly shared.'
        }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    console.log(`Returning ${imageUrls.length} image URLs`);

    return new Response(
      JSON.stringify({ 
        success: true, 
        images: imageUrls,
        count: imageUrls.length
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error: unknown) {
    console.error('Error in fetch-drive-folder:', error);
    const message = error instanceof Error ? error.message : 'Failed to fetch folder';
    return new Response(
      JSON.stringify({ error: message }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
