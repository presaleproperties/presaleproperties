import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { AdminLayout } from "@/components/admin/AdminLayout";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { 
  Plus,
  Search,
  FileText,
  Calendar,
  Star,
  Eye,
  EyeOff,
  Loader2,
  Pencil,
  Copy,
  Trash2,
  Tag,
  Upload
} from "lucide-react";

type BlogPost = {
  id: string;
  title: string;
  slug: string;
  category: string | null;
  is_featured: boolean;
  is_published: boolean;
  publish_date: string | null;
  updated_at: string;
};

export default function AdminBlogs() {
  const navigate = useNavigate();
  const [posts, setPosts] = useState<BlogPost[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [categoryFilter, setCategoryFilter] = useState<string>("all");
  const [publishedFilter, setPublishedFilter] = useState<string>("all");
  const [deletePost, setDeletePost] = useState<BlogPost | null>(null);
  const [deleting, setDeleting] = useState(false);
  const { toast } = useToast();

  useEffect(() => {
    fetchPosts();
  }, []);

  const fetchPosts = async () => {
    try {
      const { data, error } = await supabase
        .from("blog_posts")
        .select("id, title, slug, category, is_featured, is_published, publish_date, updated_at")
        .order("updated_at", { ascending: false });

      if (error) throw error;
      setPosts(data || []);
    } catch (error) {
      console.error("Error fetching posts:", error);
      toast({
        title: "Error",
        description: "Failed to load blog posts",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async () => {
    if (!deletePost) return;
    setDeleting(true);
    try {
      const { error } = await supabase
        .from("blog_posts")
        .delete()
        .eq("id", deletePost.id);

      if (error) throw error;

      toast({
        title: "Post Deleted",
        description: `"${deletePost.title}" has been deleted`,
      });
      fetchPosts();
    } catch (error) {
      console.error("Error deleting post:", error);
      toast({
        title: "Error",
        description: "Failed to delete post",
        variant: "destructive",
      });
    } finally {
      setDeleting(false);
      setDeletePost(null);
    }
  };

  const handleDuplicate = async (post: BlogPost) => {
    try {
      const { data: original, error: fetchError } = await supabase
        .from("blog_posts")
        .select("*")
        .eq("id", post.id)
        .single();

      if (fetchError) throw fetchError;

      const { id, slug, created_at, updated_at, publish_date, ...rest } = original;
      const newSlug = `${slug}-copy-${Date.now()}`;
      
      const { error } = await supabase
        .from("blog_posts")
        .insert({
          ...rest,
          title: `${rest.title} (Copy)`,
          slug: newSlug,
          is_published: false,
          publish_date: null,
        });

      if (error) throw error;

      toast({
        title: "Post Duplicated",
        description: "A copy has been created as a draft",
      });
      fetchPosts();
    } catch (error) {
      console.error("Error duplicating post:", error);
      toast({
        title: "Error",
        description: "Failed to duplicate post",
        variant: "destructive",
      });
    }
  };

  const togglePublished = async (post: BlogPost) => {
    try {
      const updates: { is_published: boolean; publish_date?: string | null } = {
        is_published: !post.is_published,
      };
      
      if (!post.is_published) {
        updates.publish_date = new Date().toISOString();
      }

      const { error } = await supabase
        .from("blog_posts")
        .update(updates)
        .eq("id", post.id);

      if (error) throw error;

      toast({
        title: post.is_published ? "Post Unpublished" : "Post Published",
        description: `"${post.title}" is now ${post.is_published ? "hidden" : "live"}`,
      });
      fetchPosts();
    } catch (error) {
      console.error("Error updating post:", error);
      toast({
        title: "Error",
        description: "Failed to update post",
        variant: "destructive",
      });
    }
  };

  const categories = [...new Set(posts.map(p => p.category).filter(Boolean) as string[])].sort();

  const filteredPosts = posts.filter(post => {
    const matchesSearch = post.title.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesCategory = categoryFilter === "all" || post.category === categoryFilter;
    const matchesPublished = publishedFilter === "all" || 
      (publishedFilter === "published" ? post.is_published : !post.is_published);
    return matchesSearch && matchesCategory && matchesPublished;
  });

  return (
    <AdminLayout>
      <div className="space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold">Blog Posts</h1>
            <p className="text-muted-foreground">Manage blog content</p>
          </div>
          <div className="flex gap-2">
            <Button variant="outline" onClick={() => navigate("/admin/blogs/import")} className="gap-2">
              <Upload className="h-4 w-4" />
              Import CSV
            </Button>
            <Button onClick={() => navigate("/admin/blogs/new")} className="gap-2">
              <Plus className="h-4 w-4" />
              Create Post
            </Button>
          </div>
        </div>

        {/* Filters */}
        <div className="flex flex-col sm:flex-row gap-4">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search posts..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10"
            />
          </div>
          <Select value={categoryFilter} onValueChange={setCategoryFilter}>
            <SelectTrigger className="w-full sm:w-[180px]">
              <SelectValue placeholder="Category" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Categories</SelectItem>
              {categories.map(cat => (
                <SelectItem key={cat} value={cat}>{cat}</SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Select value={publishedFilter} onValueChange={setPublishedFilter}>
            <SelectTrigger className="w-full sm:w-[180px]">
              <SelectValue placeholder="Published" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All</SelectItem>
              <SelectItem value="published">Published</SelectItem>
              <SelectItem value="draft">Draft</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {/* Posts List */}
        {loading ? (
          <div className="flex items-center justify-center py-12">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
          </div>
        ) : filteredPosts.length === 0 ? (
          <Card>
            <CardContent className="py-12 text-center">
              <FileText className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
              <h3 className="text-lg font-medium mb-2">No posts found</h3>
              <p className="text-muted-foreground mb-4">
                {posts.length === 0 
                  ? "Get started by creating your first blog post" 
                  : "Try adjusting your filters"}
              </p>
              {posts.length === 0 && (
                <Button onClick={() => navigate("/admin/blogs/new")}>
                  <Plus className="h-4 w-4 mr-2" />
                  Create Post
                </Button>
              )}
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-3">
            {filteredPosts.map((post) => (
              <Card key={post.id} className="hover:shadow-md transition-shadow">
                <CardContent className="p-4">
                  <div className="flex flex-col lg:flex-row lg:items-center gap-4">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap mb-1">
                        <h3 className="font-semibold truncate">{post.title}</h3>
                        {post.is_featured && (
                          <Star className="h-4 w-4 text-yellow-500 fill-yellow-500" />
                        )}
                        <Badge variant={post.is_published ? "default" : "secondary"}>
                          {post.is_published ? "Published" : "Draft"}
                        </Badge>
                      </div>
                      <div className="flex items-center gap-4 text-sm text-muted-foreground">
                        {post.category && (
                          <span className="flex items-center gap-1">
                            <Tag className="h-3 w-3" />
                            {post.category}
                          </span>
                        )}
                        {post.publish_date && (
                          <span className="flex items-center gap-1">
                            <Calendar className="h-3 w-3" />
                            {new Date(post.publish_date).toLocaleDateString()}
                          </span>
                        )}
                        <span className="text-xs">
                          Updated {new Date(post.updated_at).toLocaleDateString()}
                        </span>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => togglePublished(post)}
                        title={post.is_published ? "Unpublish" : "Publish"}
                      >
                        {post.is_published ? (
                          <EyeOff className="h-4 w-4" />
                        ) : (
                          <Eye className="h-4 w-4" />
                        )}
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => navigate(`/admin/blogs/${post.id}/edit`)}
                      >
                        <Pencil className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleDuplicate(post)}
                      >
                        <Copy className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => setDeletePost(post)}
                        className="text-destructive hover:text-destructive"
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>

      {/* Delete Confirmation */}
      <AlertDialog open={!!deletePost} onOpenChange={() => setDeletePost(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Blog Post</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete "{deletePost?.title}"? This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDelete}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
              disabled={deleting}
            >
              {deleting && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </AdminLayout>
  );
}