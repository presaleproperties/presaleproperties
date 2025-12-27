import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface FileInfo {
  id: string;
  url: string;
  type: 'image' | 'pdf' | 'unknown';
  contentType?: string;
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { folderUrl, includeAll } = await req.json();
    
    if (!folderUrl) {
      return new Response(
        JSON.stringify({ error: 'No folder URL provided' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    console.log('Fetching Drive folder:', folderUrl, 'includeAll:', includeAll);

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
    const fileIdPattern = /\["([a-zA-Z0-9_-]{25,})"/g;
    const potentialIds = new Set<string>();
    let match;
    
    while ((match = fileIdPattern.exec(html)) !== null) {
      const id = match[1];
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
          error: 'No files found in folder. Make sure folder contains files and is publicly shared.',
          suggestion: 'Try sharing individual file links instead.'
        }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Categorize files by type
    const imageUrls: string[] = [];
    const pdfUrls: string[] = [];
    const ids = Array.from(potentialIds).slice(0, 50);
    
    for (const fileId of ids) {
      if (fileId === folderId) continue;
      
      const fileUrl = `https://drive.google.com/uc?export=view&id=${fileId}`;
      
      try {
        const checkResponse = await fetch(fileUrl, { 
          method: 'HEAD',
          redirect: 'follow'
        });
        
        const contentType = checkResponse.headers.get('content-type') || '';
        
        if (contentType.includes('image')) {
          imageUrls.push(fileUrl);
          console.log('Valid image found:', fileId);
        } else if (contentType.includes('pdf') || contentType.includes('application/pdf')) {
          // For PDFs, use the download URL format
          const pdfUrl = `https://drive.google.com/uc?export=download&id=${fileId}`;
          pdfUrls.push(pdfUrl);
          console.log('Valid PDF found:', fileId);
        } else if (includeAll && checkResponse.ok) {
          // If includeAll, try to determine type by testing
          imageUrls.push(fileUrl);
        }
      } catch (e) {
        console.log('Skipping file:', fileId);
      }
      
      // Limit counts
      if (imageUrls.length >= 30) break;
      if (pdfUrls.length >= 10) break;
    }

    const totalFiles = imageUrls.length + pdfUrls.length;
    
    if (totalFiles === 0) {
      return new Response(
        JSON.stringify({ 
          error: 'Could not load any files from this folder.',
          suggestion: 'Make sure the folder contains image or PDF files and is publicly shared.'
        }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    console.log(`Returning ${imageUrls.length} images and ${pdfUrls.length} PDFs`);

    return new Response(
      JSON.stringify({ 
        success: true, 
        images: imageUrls,
        pdfs: pdfUrls,
        imageCount: imageUrls.length,
        pdfCount: pdfUrls.length
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
