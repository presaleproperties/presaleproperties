import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { AdminLayout } from "@/components/admin/AdminLayout";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { 
  Upload, 
  FileSpreadsheet, 
  CheckCircle2, 
  XCircle, 
  AlertCircle,
  ArrowLeft,
  Download,
  Loader2,
  Image as ImageIcon
} from "lucide-react";

interface CSVRow {
  [key: string]: string;
}

interface ImportResult {
  name: string;
  success: boolean;
  error?: string;
}

// Field mapping from Framer CSV to Supabase (only fields that exist in our database)
const FIELD_MAPPING: Record<string, string> = {
  'Slug': 'slug',
  'Blog Title': 'title',
  'Cover Image': 'featured_image',
  'Category': 'category',
  'Date': 'publish_date',
  'Content': 'content',
  // Skipped fields (not in our database):
  // - Cover Image:alt, Writer Name, Writer Image, Writer Image:alt
};

export default function AdminBlogImport() {
  const navigate = useNavigate();
  const { toast } = useToast();
  
  const [file, setFile] = useState<File | null>(null);
  const [parsedData, setParsedData] = useState<CSVRow[]>([]);
  const [selectedRows, setSelectedRows] = useState<Set<number>>(new Set());
  const [isImporting, setIsImporting] = useState(false);
  const [importProgress, setImportProgress] = useState(0);
  const [importResults, setImportResults] = useState<ImportResult[]>([]);
  const [step, setStep] = useState<'upload' | 'preview' | 'importing' | 'complete'>('upload');
  const [migrateImages, setMigrateImages] = useState(true);

  const parseCSV = (text: string): CSVRow[] => {
    // Handle multi-line quoted values by properly parsing CSV
    const parseCSVContent = (content: string): string[][] => {
      const rows: string[][] = [];
      let currentRow: string[] = [];
      let currentValue = '';
      let inQuotes = false;
      
      for (let i = 0; i < content.length; i++) {
        const char = content[i];
        const nextChar = content[i + 1];
        
        if (char === '"') {
          if (inQuotes && nextChar === '"') {
            // Escaped quote
            currentValue += '"';
            i++;
          } else {
            // Toggle quote mode
            inQuotes = !inQuotes;
          }
        } else if (char === ',' && !inQuotes) {
          currentRow.push(currentValue.trim());
          currentValue = '';
        } else if ((char === '\n' || (char === '\r' && nextChar === '\n')) && !inQuotes) {
          // End of row
          currentRow.push(currentValue.trim());
          if (currentRow.some(v => v)) { // Only add non-empty rows
            rows.push(currentRow);
          }
          currentRow = [];
          currentValue = '';
          if (char === '\r') i++; // Skip \n in \r\n
        } else if (char !== '\r') {
          currentValue += char;
        }
      }
      
      // Don't forget the last value/row
      if (currentValue || currentRow.length > 0) {
        currentRow.push(currentValue.trim());
        if (currentRow.some(v => v)) {
          rows.push(currentRow);
        }
      }
      
      return rows;
    };

    const allRows = parseCSVContent(text);
    if (allRows.length < 2) return [];

    const headers = allRows[0];
    const rows: CSVRow[] = [];

    for (let i = 1; i < allRows.length; i++) {
      const values = allRows[i];
      const row: CSVRow = {};
      
      headers.forEach((header, index) => {
        row[header] = values[index] || '';
      });
      
      // Only include rows that have a title
      if (row['Blog Title']) {
        rows.push(row);
      }
    }

    return rows;
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const uploadedFile = e.target.files?.[0];
    if (!uploadedFile) return;

    if (!uploadedFile.name.endsWith('.csv')) {
      toast({
        title: "Invalid file",
        description: "Please upload a CSV file",
        variant: "destructive",
      });
      return;
    }

    setFile(uploadedFile);
    
    const text = await uploadedFile.text();
    const data = parseCSV(text);
    
    if (data.length === 0) {
      toast({
        title: "Empty file",
        description: "No valid rows found in the CSV",
        variant: "destructive",
      });
      return;
    }

    setParsedData(data);
    // Select all rows by default
    setSelectedRows(new Set(data.map((_, i) => i)));
    setStep('preview');
    
    toast({
      title: "CSV parsed",
      description: `Found ${data.length} blog posts to import`,
    });
  };

  const downloadImage = async (url: string): Promise<string | null> => {
    if (!url || !url.startsWith('http')) return null;
    
    try {
      // Download the image
      const response = await fetch(url);
      if (!response.ok) return null;
      
      const blob = await response.blob();
      const fileName = `${Date.now()}-${Math.random().toString(36).substring(7)}.jpg`;
      
      // Upload to Supabase storage
      const { data, error } = await supabase.storage
        .from('listing-photos')
        .upload(`blogs/${fileName}`, blob, {
          contentType: blob.type || 'image/jpeg',
        });
      
      if (error) {
        console.error('Upload error:', error);
        return null;
      }
      
      // Get public URL
      const { data: urlData } = supabase.storage
        .from('listing-photos')
        .getPublicUrl(`blogs/${fileName}`);
      
      return urlData.publicUrl;
    } catch (err) {
      console.error('Image download error:', err);
      return null;
    }
  };

  const parseDate = (dateStr: string): string | null => {
    if (!dateStr) return null;
    try {
      const date = new Date(dateStr);
      if (isNaN(date.getTime())) return null;
      return date.toISOString();
    } catch {
      return null;
    }
  };

  const generateExcerpt = (content: string): string | null => {
    if (!content) return null;
    // Strip HTML tags and get first 160 characters
    const text = content.replace(/<[^>]*>/g, '').trim();
    if (text.length <= 160) return text;
    return text.substring(0, 157) + '...';
  };

  const importBlog = async (row: CSVRow): Promise<ImportResult> => {
    try {
      // Generate slug if not provided
      let slug = row['Slug'] || row['Blog Title'].toLowerCase()
        .replace(/[^a-z0-9]+/g, '-')
        .replace(/(^-|-$)/g, '');
      
      // Check if slug exists
      const { data: existing } = await supabase
        .from('blog_posts')
        .select('slug')
        .eq('slug', slug)
        .maybeSingle();
      
      if (existing) {
        slug = `${slug}-${Date.now()}`;
      }

      // Handle featured image
      let featuredImage = row['Cover Image'] || null;

      if (migrateImages && row['Cover Image']) {
        const newUrl = await downloadImage(row['Cover Image']);
        if (newUrl) featuredImage = newUrl;
      }

      // Determine if draft
      const isDraft = row[':draft'] === 'true' || row[':draft'] === '1';

      // Build blog data
      const blogData = {
        slug,
        title: row['Blog Title'],
        content: row['Content'] || null,
        excerpt: generateExcerpt(row['Content']),
        category: row['Category'] || null,
        featured_image: featuredImage,
        publish_date: parseDate(row['Date']),
        is_published: !isDraft,
        is_featured: false,
      };

      const { error } = await supabase
        .from('blog_posts')
        .insert(blogData);

      if (error) throw error;

      return { name: row['Blog Title'], success: true };
    } catch (err: any) {
      return { 
        name: row['Blog Title'], 
        success: false, 
        error: err.message || 'Unknown error' 
      };
    }
  };

  const startImport = async () => {
    const rowsToImport = parsedData.filter((_, i) => selectedRows.has(i));
    
    if (rowsToImport.length === 0) {
      toast({
        title: "No rows selected",
        description: "Please select at least one blog post to import",
        variant: "destructive",
      });
      return;
    }

    setStep('importing');
    setIsImporting(true);
    setImportProgress(0);
    setImportResults([]);

    const results: ImportResult[] = [];
    
    for (let i = 0; i < rowsToImport.length; i++) {
      const result = await importBlog(rowsToImport[i]);
      results.push(result);
      setImportResults([...results]);
      setImportProgress(((i + 1) / rowsToImport.length) * 100);
    }

    setIsImporting(false);
    setStep('complete');

    const successCount = results.filter(r => r.success).length;
    toast({
      title: "Import complete",
      description: `Successfully imported ${successCount} of ${results.length} blog posts`,
    });
  };

  const toggleRow = (index: number) => {
    const newSelected = new Set(selectedRows);
    if (newSelected.has(index)) {
      newSelected.delete(index);
    } else {
      newSelected.add(index);
    }
    setSelectedRows(newSelected);
  };

  const toggleAll = () => {
    if (selectedRows.size === parsedData.length) {
      setSelectedRows(new Set());
    } else {
      setSelectedRows(new Set(parsedData.map((_, i) => i)));
    }
  };

  return (
    <AdminLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="icon" onClick={() => navigate('/admin/blogs')}>
            <ArrowLeft className="h-4 w-4" />
          </Button>
          <div>
            <h1 className="text-2xl font-bold">Import Blog Posts from CSV</h1>
            <p className="text-muted-foreground">
              Bulk import blog posts from Framer CMS export
            </p>
          </div>
        </div>

        {/* Step: Upload */}
        {step === 'upload' && (
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <FileSpreadsheet className="h-5 w-5" />
                Upload CSV File
              </CardTitle>
              <CardDescription>
                Export your Framer blog CMS collection as CSV and upload it here
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="border-2 border-dashed border-border rounded-lg p-8 text-center">
                <Upload className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
                <Label htmlFor="csv-upload" className="cursor-pointer">
                  <span className="text-primary font-medium">Click to upload</span>
                  <span className="text-muted-foreground"> or drag and drop</span>
                  <Input
                    id="csv-upload"
                    type="file"
                    accept=".csv"
                    className="hidden"
                    onChange={handleFileUpload}
                  />
                </Label>
                <p className="text-sm text-muted-foreground mt-2">
                  CSV file exported from Framer CMS
                </p>
              </div>

              <div className="bg-muted/50 rounded-lg p-4">
                <h4 className="font-medium mb-2">Expected columns:</h4>
                <div className="flex flex-wrap gap-2">
                  {Object.keys(FIELD_MAPPING).map(field => (
                    <Badge key={field} variant="secondary">{field}</Badge>
                  ))}
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Step: Preview */}
        {step === 'preview' && (
          <div className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>Preview Import</CardTitle>
                <CardDescription>
                  {parsedData.length} blog posts found • {selectedRows.size} selected
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                {/* Options */}
                <div className="flex items-center gap-4 p-4 bg-muted/50 rounded-lg">
                  <div className="flex items-center gap-2">
                    <Checkbox
                      id="migrate-images"
                      checked={migrateImages}
                      onCheckedChange={(checked) => setMigrateImages(!!checked)}
                    />
                    <Label htmlFor="migrate-images" className="flex items-center gap-2">
                      <ImageIcon className="h-4 w-4" />
                      Download & re-host images
                    </Label>
                  </div>
                  <span className="text-sm text-muted-foreground">
                    (Recommended - copies images to your storage)
                  </span>
                </div>

                {/* Select All */}
                <div className="flex items-center gap-2 border-b pb-2">
                  <Checkbox
                    checked={selectedRows.size === parsedData.length}
                    onCheckedChange={toggleAll}
                  />
                  <span className="font-medium">Select All</span>
                </div>

                {/* Blog List */}
                <div className="max-h-[400px] overflow-y-auto space-y-2">
                  {parsedData.map((row, index) => (
                    <div
                      key={index}
                      className={`flex items-center gap-3 p-3 rounded-lg border ${
                        selectedRows.has(index) ? 'bg-primary/5 border-primary/20' : 'bg-background'
                      }`}
                    >
                      <Checkbox
                        checked={selectedRows.has(index)}
                        onCheckedChange={() => toggleRow(index)}
                      />
                      <div className="flex-1 min-w-0">
                        <p className="font-medium truncate">{row['Blog Title']}</p>
                        <p className="text-sm text-muted-foreground truncate">
                          {row['Category'] || 'No category'} • {row['Date'] || 'No date'}
                        </p>
                      </div>
                      {row['Cover Image'] && (
                        <img
                          src={row['Cover Image']}
                          alt=""
                          className="h-12 w-16 object-cover rounded"
                        />
                      )}
                      <Badge variant={row[':draft'] === 'true' ? 'secondary' : 'default'}>
                        {row[':draft'] === 'true' ? 'Draft' : 'Published'}
                      </Badge>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            <div className="flex gap-3">
              <Button variant="outline" onClick={() => setStep('upload')}>
                Back
              </Button>
              <Button onClick={startImport} disabled={selectedRows.size === 0}>
                <Download className="h-4 w-4 mr-2" />
                Import {selectedRows.size} Blog Posts
              </Button>
            </div>
          </div>
        )}

        {/* Step: Importing */}
        {step === 'importing' && (
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Loader2 className="h-5 w-5 animate-spin" />
                Importing Blog Posts...
              </CardTitle>
              <CardDescription>
                {migrateImages 
                  ? "Downloading images and creating posts. This may take a few minutes."
                  : "Creating blog posts..."}
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <Progress value={importProgress} />
              <p className="text-sm text-muted-foreground text-center">
                {importResults.length} of {selectedRows.size} posts processed
              </p>

              {/* Live results */}
              <div className="max-h-[300px] overflow-y-auto space-y-1">
                {importResults.map((result, i) => (
                  <div key={i} className="flex items-center gap-2 text-sm">
                    {result.success ? (
                      <CheckCircle2 className="h-4 w-4 text-green-500" />
                    ) : (
                      <XCircle className="h-4 w-4 text-red-500" />
                    )}
                    <span className={result.success ? '' : 'text-red-500'}>
                      {result.name}
                      {result.error && ` - ${result.error}`}
                    </span>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        )}

        {/* Step: Complete */}
        {step === 'complete' && (
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <CheckCircle2 className="h-5 w-5 text-green-500" />
                Import Complete
              </CardTitle>
              <CardDescription>
                {importResults.filter(r => r.success).length} of {importResults.length} blog posts imported successfully
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {/* Summary */}
              <div className="grid grid-cols-2 gap-4">
                <div className="p-4 bg-green-500/10 rounded-lg text-center">
                  <p className="text-2xl font-bold text-green-600">
                    {importResults.filter(r => r.success).length}
                  </p>
                  <p className="text-sm text-muted-foreground">Successful</p>
                </div>
                <div className="p-4 bg-red-500/10 rounded-lg text-center">
                  <p className="text-2xl font-bold text-red-600">
                    {importResults.filter(r => !r.success).length}
                  </p>
                  <p className="text-sm text-muted-foreground">Failed</p>
                </div>
              </div>

              {/* Failed items */}
              {importResults.some(r => !r.success) && (
                <div className="space-y-2">
                  <h4 className="font-medium flex items-center gap-2">
                    <AlertCircle className="h-4 w-4 text-red-500" />
                    Failed imports:
                  </h4>
                  <div className="bg-red-500/5 rounded-lg p-3 space-y-1">
                    {importResults.filter(r => !r.success).map((result, i) => (
                      <p key={i} className="text-sm">
                        <span className="font-medium">{result.name}:</span>{' '}
                        <span className="text-muted-foreground">{result.error}</span>
                      </p>
                    ))}
                  </div>
                </div>
              )}

              <div className="flex gap-3">
                <Button variant="outline" onClick={() => {
                  setStep('upload');
                  setFile(null);
                  setParsedData([]);
                  setSelectedRows(new Set());
                  setImportResults([]);
                }}>
                  Import More
                </Button>
                <Button onClick={() => navigate('/admin/blogs')}>
                  View All Blog Posts
                </Button>
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    </AdminLayout>
  );
}
