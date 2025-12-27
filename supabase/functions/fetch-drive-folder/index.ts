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
    
    // Extract file IDs and names from the page HTML
    // Look for file entries with their names to identify PDFs
    const fileIdPattern = /\["([a-zA-Z0-9_-]{25,45})","([^"]+)"/g;
    const fileEntries: { id: string; name: string }[] = [];
    let match;
    
    while ((match = fileIdPattern.exec(html)) !== null) {
      const id = match[1];
      const name = match[2];
      if (id.length >= 25 && id.length <= 45 && /^[a-zA-Z0-9_-]+$/.test(id)) {
        // Check if name looks like a file (has extension)
        if (name && (name.includes('.') || name.length < 100)) {
          fileEntries.push({ id, name });
        }
      }
    }

    // Also look for standalone IDs
    const standaloneIdPattern = /\["([a-zA-Z0-9_-]{25,45})"/g;
    const potentialIds = new Set<string>();
    
    while ((match = standaloneIdPattern.exec(html)) !== null) {
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
    
    // Look for PDF mentions in the HTML
    const pdfMentionPattern = /([a-zA-Z0-9_-]{25,45})[^"]*\.pdf/gi;
    const pdfIds = new Set<string>();
    while ((match = pdfMentionPattern.exec(html)) !== null) {
      pdfIds.add(match[1]);
    }

    console.log('Found file entries:', fileEntries.length, 'potential IDs:', potentialIds.size, 'PDF mentions:', pdfIds.size);

    if (potentialIds.size === 0 && fileEntries.length === 0) {
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
    const pdfFileIds: string[] = [];
    const processedIds = new Set<string>();
    
    // First, process file entries with names (more reliable)
    for (const entry of fileEntries) {
      if (entry.id === folderId) continue;
      processedIds.add(entry.id);
      
      const lowerName = entry.name.toLowerCase();
      
      if (lowerName.endsWith('.pdf') || pdfIds.has(entry.id)) {
        if (!pdfFileIds.includes(entry.id)) {
          pdfFileIds.push(entry.id);
          console.log('PDF found by name:', entry.name, entry.id);
        }
      } else if (
        lowerName.endsWith('.jpg') || 
        lowerName.endsWith('.jpeg') || 
        lowerName.endsWith('.png') || 
        lowerName.endsWith('.gif') || 
        lowerName.endsWith('.webp')
      ) {
        const directImageUrl = `https://lh3.googleusercontent.com/d/${entry.id}`;
        if (!imageUrls.includes(directImageUrl)) {
          imageUrls.push(directImageUrl);
          console.log('Image found by name:', entry.name, entry.id);
        }
      }
      
      if (pdfFileIds.length >= 10 && imageUrls.length >= 30) break;
    }
    
    // Collect all potential file IDs to check
    const allIdsToCheck = Array.from(potentialIds)
      .filter(id => id !== folderId)
      .filter(id => !processedIds.has(id))
      .filter(id => !pdfIds.has(id));
    
    console.log('IDs to check for images:', allIdsToCheck.length);
    
    // Check each ID by making a HEAD request
    for (const fileId of allIdsToCheck) {
      if (imageUrls.length >= 50) break;
      
      // Skip known PDFs
      if (pdfIds.has(fileId)) {
        if (!pdfFileIds.includes(fileId)) {
          pdfFileIds.push(fileId);
          console.log('PDF found by mention:', fileId);
        }
        continue;
      }
      
      const directImageUrl = `https://lh3.googleusercontent.com/d/${fileId}`;
      const downloadUrl = `https://drive.google.com/uc?export=download&id=${fileId}`;
      
      try {
        // Try to get content type from download URL
        const checkResponse = await fetch(downloadUrl, { 
          method: 'HEAD',
          redirect: 'manual'
        });
        
        const contentType = checkResponse.headers.get('content-type') || '';
        const contentDisposition = checkResponse.headers.get('content-disposition') || '';
        
        console.log('Checking file:', fileId, 'type:', contentType, 'disp:', contentDisposition);
        
        // Check if it's a PDF based on headers or content-disposition
        if (
          contentType.includes('pdf') || 
          contentDisposition.toLowerCase().includes('.pdf')
        ) {
          if (!pdfFileIds.includes(fileId)) {
            pdfFileIds.push(fileId);
            console.log('PDF found by header:', fileId);
          }
        } else if (contentType.includes('image')) {
          if (!imageUrls.includes(directImageUrl)) {
            imageUrls.push(directImageUrl);
            console.log('Image found by content-type:', fileId);
          }
        } else if (
          contentDisposition.toLowerCase().includes('.jpg') ||
          contentDisposition.toLowerCase().includes('.jpeg') ||
          contentDisposition.toLowerCase().includes('.png') ||
          contentDisposition.toLowerCase().includes('.gif') ||
          contentDisposition.toLowerCase().includes('.webp')
        ) {
          // Check filename in content-disposition
          if (!imageUrls.includes(directImageUrl)) {
            imageUrls.push(directImageUrl);
            console.log('Image found by filename:', fileId);
          }
        }
      } catch (e) {
        console.log('Error checking file:', fileId, e);
      }
    }
    
    // If still no images found, try treating all unknown IDs as potential images
    if (imageUrls.length === 0 && allIdsToCheck.length > 0) {
      console.log('No images found by header, trying remaining IDs as images');
      for (const fileId of allIdsToCheck.slice(0, 30)) {
        if (pdfIds.has(fileId) || pdfFileIds.includes(fileId)) continue;
        
        const directImageUrl = `https://lh3.googleusercontent.com/d/${fileId}`;
        imageUrls.push(directImageUrl);
        console.log('Adding potential image:', fileId);
      }
    }

    const totalFiles = imageUrls.length + pdfFileIds.length;
    
    if (totalFiles === 0) {
      return new Response(
        JSON.stringify({ 
          error: 'Could not load any files from this folder.',
          suggestion: 'Make sure the folder contains image or PDF files and is publicly shared.'
        }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    console.log(`Returning ${imageUrls.length} images and ${pdfFileIds.length} PDFs`);

    return new Response(
      JSON.stringify({ 
        success: true, 
        images: imageUrls,
        pdfFileIds,
        imageCount: imageUrls.length,
        pdfCount: pdfFileIds.length
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
