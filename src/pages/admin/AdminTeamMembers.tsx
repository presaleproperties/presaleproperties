import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { AdminLayout } from "@/components/admin/AdminLayout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { toast } from "sonner";
import { Plus, Pencil, Trash2, GripVertical, Users, KeyRound, Copy, Check, RotateCw } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { TeamMemberPhotoUpload } from "@/components/admin/TeamMemberPhotoUpload";

interface TeamMember {
  id: string;
  full_name: string;
  title: string;
  email: string | null;
  phone: string | null;
  photo_url: string | null;
  bio: string | null;
  linkedin_url: string | null;
  instagram_url: string | null;
  specializations: string[];
  sort_order: number;
  is_active: boolean;
  user_id: string | null;
}
type TeamMemberForm = Omit<TeamMember, "id" | "user_id">;
const emptyMember: TeamMemberForm = {
  full_name: "",
  title: "",
  email: "",
  phone: "",
  photo_url: "",
  bio: "",
  linkedin_url: "",
  instagram_url: "",
  specializations: [],
  sort_order: 0,
  is_active: true,
};

export default function AdminTeamMembers() {
  const queryClient = useQueryClient();
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingMember, setEditingMember] = useState<TeamMember | null>(null);
  const [formData, setFormData] = useState<TeamMemberForm>(emptyMember);
  const [specializationInput, setSpecializationInput] = useState("");
  const [credentialsDialog, setCredentialsDialog] = useState<{ open: boolean; email: string; password: string; mode: "create" | "reset" }>({ open: false, email: "", password: "", mode: "create" });
  const [actingOn, setActingOn] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);

  const { data: teamMembers = [], isLoading } = useQuery({
    queryKey: ["admin-team-members"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("team_members")
        .select("*")
        .order("sort_order", { ascending: true });
      if (error) throw error;
      return data as TeamMember[];
    },
  });

  const saveMutation = useMutation({
    mutationFn: async (member: TeamMemberForm & { id?: string }) => {
      if (member.id) {
        const { id, ...updates } = member;
        const { error } = await supabase
          .from("team_members")
          .update(updates)
          .eq("id", id);
        if (error) throw error;
      } else {
        const { error } = await supabase.from("team_members").insert(member);
        if (error) throw error;
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin-team-members"] });
      toast.success(editingMember ? "Team member updated" : "Team member added");
      handleCloseDialog();
    },
    onError: (error) => {
      toast.error("Failed to save team member");
      console.error(error);
    },
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("team_members").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin-team-members"] });
      toast.success("Team member deleted");
    },
    onError: () => {
      toast.error("Failed to delete team member");
    },
  });

  const handleCloseDialog = () => {
    setIsDialogOpen(false);
    setEditingMember(null);
    setFormData(emptyMember);
    setSpecializationInput("");
  };

  const handleEdit = (member: TeamMember) => {
    setEditingMember(member);
    setFormData({
      full_name: member.full_name,
      title: member.title,
      email: member.email || "",
      phone: member.phone || "",
      photo_url: member.photo_url || "",
      bio: member.bio || "",
      linkedin_url: member.linkedin_url || "",
      instagram_url: member.instagram_url || "",
      specializations: member.specializations || [],
      sort_order: member.sort_order,
      is_active: member.is_active,
    });
    setIsDialogOpen(true);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    saveMutation.mutate(
      editingMember ? { ...formData, id: editingMember.id } : formData
    );
  };

  const addSpecialization = () => {
    if (specializationInput.trim() && !formData.specializations.includes(specializationInput.trim())) {
      setFormData({
        ...formData,
        specializations: [...formData.specializations, specializationInput.trim()],
      });
      setSpecializationInput("");
    }
  };

  const removeSpecialization = (spec: string) => {
    setFormData({
      ...formData,
      specializations: formData.specializations.filter((s) => s !== spec),
    });
  };

  const handleCreateOrResetLogin = async (member: TeamMember, mode: "create" | "reset") => {
    if (!member.email) {
      toast.error("Add an email to this team member first");
      return;
    }
    setActingOn(member.id);
    try {
      const { data, error } = await supabase.functions.invoke("admin-create-team-login", {
        body: {
          action: mode,
          team_member_id: member.id,
          email: member.email,
          full_name: member.full_name,
          phone: member.phone,
        },
      });
      if (error) throw error;
      if ((data as any)?.error) throw new Error((data as any).error);
      const password = (data as any).temp_password as string;
      setCredentialsDialog({ open: true, email: member.email, password, mode });
      queryClient.invalidateQueries({ queryKey: ["admin-team-members"] });
      toast.success(mode === "create" ? "Login created" : "Password reset");
    } catch (e: any) {
      toast.error(e.message || "Failed to set up login");
    } finally {
      setActingOn(null);
    }
  };

  const copyCredentials = async () => {
    const text = `Email: ${credentialsDialog.email}\nTemporary password: ${credentialsDialog.password}\n\nLogin at: ${window.location.origin}/login\n(You'll be asked to set a new password on first sign-in.)`;
    await navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <AdminLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold flex items-center gap-2">
              <Users className="h-6 w-6 text-primary" />
              Team Members
            </h1>
            <p className="text-muted-foreground mt-1">
              Manage your team displayed on the About page
            </p>
          </div>
          <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
            <DialogTrigger asChild>
              <Button onClick={() => setFormData(emptyMember)}>
                <Plus className="h-4 w-4 mr-2" />
                Add Member
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
              <DialogHeader>
                <DialogTitle>
                  {editingMember ? "Edit Team Member" : "Add Team Member"}
                </DialogTitle>
              </DialogHeader>
              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="full_name">Full Name *</Label>
                    <Input
                      id="full_name"
                      value={formData.full_name}
                      onChange={(e) =>
                        setFormData({ ...formData, full_name: e.target.value })
                      }
                      required
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="title">Title *</Label>
                    <Input
                      id="title"
                      value={formData.title}
                      onChange={(e) =>
                        setFormData({ ...formData, title: e.target.value })
                      }
                      required
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="email">Email</Label>
                    <Input
                      id="email"
                      type="email"
                      value={formData.email || ""}
                      onChange={(e) =>
                        setFormData({ ...formData, email: e.target.value })
                      }
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="phone">Phone</Label>
                    <Input
                      id="phone"
                      value={formData.phone || ""}
                      onChange={(e) =>
                        setFormData({ ...formData, phone: e.target.value })
                      }
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label>Photo</Label>
                  <TeamMemberPhotoUpload
                    currentPhotoUrl={formData.photo_url || null}
                    onPhotoChange={(url) =>
                      setFormData({ ...formData, photo_url: url || "" })
                    }
                    memberName={formData.full_name || "Team Member"}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="bio">Bio</Label>
                  <Textarea
                    id="bio"
                    value={formData.bio || ""}
                    onChange={(e) =>
                      setFormData({ ...formData, bio: e.target.value })
                    }
                    rows={3}
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="linkedin_url">LinkedIn URL</Label>
                    <Input
                      id="linkedin_url"
                      value={formData.linkedin_url || ""}
                      onChange={(e) =>
                        setFormData({ ...formData, linkedin_url: e.target.value })
                      }
                      placeholder="https://linkedin.com/in/..."
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="instagram_url">Instagram URL</Label>
                    <Input
                      id="instagram_url"
                      value={formData.instagram_url || ""}
                      onChange={(e) =>
                        setFormData({ ...formData, instagram_url: e.target.value })
                      }
                      placeholder="https://instagram.com/..."
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label>Specializations</Label>
                  <div className="flex gap-2">
                    <Input
                      value={specializationInput}
                      onChange={(e) => setSpecializationInput(e.target.value)}
                      placeholder="Add a specialization..."
                      onKeyDown={(e) => {
                        if (e.key === "Enter") {
                          e.preventDefault();
                          addSpecialization();
                        }
                      }}
                    />
                    <Button type="button" variant="outline" onClick={addSpecialization}>
                      Add
                    </Button>
                  </div>
                  <div className="flex flex-wrap gap-2 mt-2">
                    {formData.specializations.map((spec) => (
                      <Badge
                        key={spec}
                        variant="secondary"
                        className="cursor-pointer"
                        onClick={() => removeSpecialization(spec)}
                      >
                        {spec} ×
                      </Badge>
                    ))}
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="sort_order">Sort Order</Label>
                    <Input
                      id="sort_order"
                      type="number"
                      value={formData.sort_order}
                      onChange={(e) =>
                        setFormData({ ...formData, sort_order: parseInt(e.target.value) || 0 })
                      }
                    />
                  </div>
                  <div className="flex items-center gap-3 pt-6">
                    <Switch
                      id="is_active"
                      checked={formData.is_active}
                      onCheckedChange={(checked) =>
                        setFormData({ ...formData, is_active: checked })
                      }
                    />
                    <Label htmlFor="is_active">Active (visible on website)</Label>
                  </div>
                </div>

                <div className="flex justify-end gap-2 pt-4">
                  <Button type="button" variant="outline" onClick={handleCloseDialog}>
                    Cancel
                  </Button>
                  <Button type="submit" disabled={saveMutation.isPending}>
                    {saveMutation.isPending ? "Saving..." : "Save"}
                  </Button>
                </div>
              </form>
            </DialogContent>
          </Dialog>
        </div>

        {/* Table */}
        <div className="bg-card dark:bg-neutral-900 rounded-xl border shadow-sm">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="w-12"></TableHead>
                <TableHead>Name</TableHead>
                <TableHead>Title</TableHead>
                <TableHead>Specializations</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Portal Access</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {isLoading ? (
                <TableRow>
                  <TableCell colSpan={7} className="text-center py-8 text-muted-foreground">
                    Loading...
                  </TableCell>
                </TableRow>
              ) : teamMembers.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={7} className="text-center py-8 text-muted-foreground">
                    No team members yet. Add your first one!
                  </TableCell>
                </TableRow>
              ) : (
                teamMembers.map((member) => (
                  <TableRow key={member.id}>
                    <TableCell>
                      <GripVertical className="h-4 w-4 text-muted-foreground" />
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-3">
                        {member.photo_url ? (
                          <img
                            src={member.photo_url}
                            alt={member.full_name}
                            className="w-10 h-10 rounded-full object-cover"
                          />
                        ) : (
                          <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center">
                            <span className="text-sm font-medium text-primary">
                              {member.full_name.charAt(0)}
                            </span>
                          </div>
                        )}
                        <div>
                          <p className="font-medium">{member.full_name}</p>
                          {member.email && (
                            <p className="text-sm text-muted-foreground">{member.email}</p>
                          )}
                        </div>
                      </div>
                    </TableCell>
                    <TableCell>{member.title}</TableCell>
                    <TableCell>
                      <div className="flex flex-wrap gap-1">
                        {member.specializations?.slice(0, 2).map((spec) => (
                          <Badge key={spec} variant="outline" className="text-xs">
                            {spec}
                          </Badge>
                        ))}
                        {member.specializations?.length > 2 && (
                          <Badge variant="outline" className="text-xs">
                            +{member.specializations.length - 2}
                          </Badge>
                        )}
                      </div>
                    </TableCell>
                    <TableCell>
                      <Badge variant={member.is_active ? "default" : "secondary"}>
                        {member.is_active ? "Active" : "Hidden"}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      {member.user_id ? (
                        <div className="flex items-center gap-2">
                          <Badge variant="outline" className="gap-1">
                            <Check className="h-3 w-3" /> Linked
                          </Badge>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleCreateOrResetLogin(member, "reset")}
                            disabled={actingOn === member.id}
                            title="Reset password"
                          >
                            <RotateCw className="h-3.5 w-3.5 mr-1" /> Reset
                          </Button>
                        </div>
                      ) : (
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleCreateOrResetLogin(member, "create")}
                          disabled={actingOn === member.id || !member.email}
                        >
                          <KeyRound className="h-3.5 w-3.5 mr-1" />
                          {actingOn === member.id ? "Creating…" : "Create Login"}
                        </Button>
                      )}
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex justify-end gap-2">
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => handleEdit(member)}
                        >
                          <Pencil className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="text-destructive hover:text-destructive"
                          onClick={() => {
                            if (confirm("Delete this team member?")) {
                              deleteMutation.mutate(member.id);
                            }
                          }}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </div>
      </div>
    </AdminLayout>
  );
}