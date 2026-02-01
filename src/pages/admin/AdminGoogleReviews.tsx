import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { AdminLayout } from "@/components/admin/AdminLayout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Plus, Pencil, Trash2, Star, GripVertical } from "lucide-react";
import { toast } from "sonner";

interface GoogleReview {
  id: string;
  reviewer_name: string;
  reviewer_location: string | null;
  rating: number;
  review_text: string;
  review_date: string | null;
  is_featured: boolean;
  is_active: boolean;
  sort_order: number;
}

const emptyReview: Omit<GoogleReview, "id"> = {
  reviewer_name: "",
  reviewer_location: "",
  rating: 5,
  review_text: "",
  review_date: null,
  is_featured: false,
  is_active: true,
  sort_order: 0,
};

export default function AdminGoogleReviews() {
  const queryClient = useQueryClient();
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingReview, setEditingReview] = useState<GoogleReview | null>(null);
  const [formData, setFormData] = useState<Omit<GoogleReview, "id">>(emptyReview);

  const { data: reviews, isLoading } = useQuery({
    queryKey: ["admin-google-reviews"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("google_reviews")
        .select("*")
        .order("sort_order", { ascending: true });
      if (error) throw error;
      return data as GoogleReview[];
    },
  });

  const saveMutation = useMutation({
    mutationFn: async (data: Omit<GoogleReview, "id"> & { id?: string }) => {
      if (data.id) {
        const { error } = await supabase
          .from("google_reviews")
          .update(data)
          .eq("id", data.id);
        if (error) throw error;
      } else {
        const { error } = await supabase
          .from("google_reviews")
          .insert(data);
        if (error) throw error;
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin-google-reviews"] });
      toast.success(editingReview ? "Review updated" : "Review added");
      handleCloseDialog();
    },
    onError: (error) => {
      toast.error("Failed to save review: " + error.message);
    },
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from("google_reviews")
        .delete()
        .eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin-google-reviews"] });
      toast.success("Review deleted");
    },
    onError: (error) => {
      toast.error("Failed to delete review: " + error.message);
    },
  });

  const handleOpenDialog = (review?: GoogleReview) => {
    if (review) {
      setEditingReview(review);
      setFormData({
        reviewer_name: review.reviewer_name,
        reviewer_location: review.reviewer_location || "",
        rating: review.rating,
        review_text: review.review_text,
        review_date: review.review_date,
        is_featured: review.is_featured,
        is_active: review.is_active,
        sort_order: review.sort_order,
      });
    } else {
      setEditingReview(null);
      setFormData({ ...emptyReview, sort_order: (reviews?.length || 0) + 1 });
    }
    setIsDialogOpen(true);
  };

  const handleCloseDialog = () => {
    setIsDialogOpen(false);
    setEditingReview(null);
    setFormData(emptyReview);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    saveMutation.mutate(
      editingReview ? { ...formData, id: editingReview.id } : formData
    );
  };

  return (
    <AdminLayout>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold">Google Reviews</h1>
            <p className="text-muted-foreground mt-1">
              Manage reviews displayed on your website. Copy reviews from your Google Business page.
            </p>
          </div>
          <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
            <DialogTrigger asChild>
              <Button onClick={() => handleOpenDialog()}>
                <Plus className="h-4 w-4 mr-2" />
                Add Review
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-lg">
              <DialogHeader>
                <DialogTitle>
                  {editingReview ? "Edit Review" : "Add New Review"}
                </DialogTitle>
              </DialogHeader>
              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="reviewer_name">Reviewer Name *</Label>
                    <Input
                      id="reviewer_name"
                      value={formData.reviewer_name}
                      onChange={(e) =>
                        setFormData({ ...formData, reviewer_name: e.target.value })
                      }
                      placeholder="John D."
                      required
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="reviewer_location">Location</Label>
                    <Input
                      id="reviewer_location"
                      value={formData.reviewer_location || ""}
                      onChange={(e) =>
                        setFormData({ ...formData, reviewer_location: e.target.value })
                      }
                      placeholder="Vancouver, BC"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="rating">Rating *</Label>
                    <Select
                      value={String(formData.rating)}
                      onValueChange={(value) =>
                        setFormData({ ...formData, rating: parseInt(value) })
                      }
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {[5, 4, 3, 2, 1].map((r) => (
                          <SelectItem key={r} value={String(r)}>
                            {r} Star{r !== 1 ? "s" : ""}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="review_date">Review Date</Label>
                    <Input
                      id="review_date"
                      type="date"
                      value={formData.review_date || ""}
                      onChange={(e) =>
                        setFormData({ ...formData, review_date: e.target.value || null })
                      }
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="review_text">Review Text *</Label>
                  <Textarea
                    id="review_text"
                    value={formData.review_text}
                    onChange={(e) =>
                      setFormData({ ...formData, review_text: e.target.value })
                    }
                    placeholder="Paste the review content here..."
                    rows={4}
                    required
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="sort_order">Display Order</Label>
                    <Input
                      id="sort_order"
                      type="number"
                      value={formData.sort_order}
                      onChange={(e) =>
                        setFormData({ ...formData, sort_order: parseInt(e.target.value) || 0 })
                      }
                    />
                  </div>
                </div>

                <div className="flex items-center justify-between pt-2">
                  <div className="flex items-center gap-6">
                    <div className="flex items-center gap-2">
                      <Switch
                        id="is_active"
                        checked={formData.is_active}
                        onCheckedChange={(checked) =>
                          setFormData({ ...formData, is_active: checked })
                        }
                      />
                      <Label htmlFor="is_active">Active</Label>
                    </div>
                    <div className="flex items-center gap-2">
                      <Switch
                        id="is_featured"
                        checked={formData.is_featured}
                        onCheckedChange={(checked) =>
                          setFormData({ ...formData, is_featured: checked })
                        }
                      />
                      <Label htmlFor="is_featured">Featured</Label>
                    </div>
                  </div>
                </div>

                <div className="flex justify-end gap-2 pt-4">
                  <Button type="button" variant="outline" onClick={handleCloseDialog}>
                    Cancel
                  </Button>
                  <Button type="submit" disabled={saveMutation.isPending}>
                    {saveMutation.isPending ? "Saving..." : "Save Review"}
                  </Button>
                </div>
              </form>
            </DialogContent>
          </Dialog>
        </div>

        {isLoading ? (
          <div className="text-center py-12 text-muted-foreground">Loading reviews...</div>
        ) : reviews?.length === 0 ? (
          <Card>
            <CardContent className="py-12 text-center">
              <p className="text-muted-foreground mb-4">No reviews yet. Add your first Google review!</p>
              <Button onClick={() => handleOpenDialog()}>
                <Plus className="h-4 w-4 mr-2" />
                Add Review
              </Button>
            </CardContent>
          </Card>
        ) : (
          <div className="grid gap-4">
            {reviews?.map((review) => (
              <Card key={review.id} className={!review.is_active ? "opacity-50" : ""}>
                <CardHeader className="pb-2">
                  <div className="flex items-start justify-between">
                    <div className="flex items-center gap-3">
                      <GripVertical className="h-5 w-5 text-muted-foreground" />
                      <div>
                        <CardTitle className="text-lg flex items-center gap-2">
                          {review.reviewer_name}
                          {review.is_featured && (
                            <span className="text-xs bg-primary/10 text-primary px-2 py-0.5 rounded">
                              Featured
                            </span>
                          )}
                          {!review.is_active && (
                            <span className="text-xs bg-muted text-muted-foreground px-2 py-0.5 rounded">
                              Hidden
                            </span>
                          )}
                        </CardTitle>
                        <div className="flex items-center gap-2 text-sm text-muted-foreground">
                          {review.reviewer_location && <span>{review.reviewer_location}</span>}
                          {review.review_date && (
                            <>
                              {review.reviewer_location && <span>•</span>}
                              <span>{new Date(review.review_date).toLocaleDateString()}</span>
                            </>
                          )}
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <div className="flex gap-0.5 mr-4">
                        {[...Array(5)].map((_, i) => (
                          <Star
                            key={i}
                            className={`h-4 w-4 ${
                              i < review.rating
                                ? "fill-primary text-primary"
                                : "fill-muted text-muted"
                            }`}
                          />
                        ))}
                      </div>
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => handleOpenDialog(review)}
                      >
                        <Pencil className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => {
                          if (confirm("Delete this review?")) {
                            deleteMutation.mutate(review.id);
                          }
                        }}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                </CardHeader>
                <CardContent>
                  <p className="text-muted-foreground line-clamp-3">"{review.review_text}"</p>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>
    </AdminLayout>
  );
}
