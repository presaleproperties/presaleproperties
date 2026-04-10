import { useState, useCallback } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Table, TableHeader, TableBody, TableRow, TableHead, TableCell,
} from "@/components/ui/table";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import { Plus, Search, Phone, Mail, Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";
import { format } from "date-fns";

type CrmLead = {
  id: string;
  created_at: string;
  updated_at: string;
  name: string;
  email: string | null;
  phone: string | null;
  buyer_type: string | null;
  source: string | null;
  pipeline_status: string;
  temperature: string;
  tags: string[] | null;
  assigned_agent: string | null;
  budget_min: number | null;
  budget_max: number | null;
  project_interest: string[] | null;
  area_interest: string[] | null;
  notes: string | null;
  last_contacted_at: string | null;
  next_followup_at: string | null;
};

const PIPELINE_STATUSES = [
  "New Lead", "Contacted", "Showing Booked", "Offer Made", "Nurturing", "Closed", "Lost",
];

const TAB_FILTERS = [
  "All Leads", "New Lead", "Pre-Sale", "Re-Sale", "Commercial",
  "Showing Booked", "Offer Made", "Nurturing", "Closed", "Lost",
];

const BUYER_TYPES = ["First-Time Buyer", "Investor", "Realtor", "Past Client"];
const SOURCES = ["TikTok", "Instagram", "Facebook", "Website Form", "presaleproperties.com", "Manual Entry", "Referral"];
const TEMPERATURES = ["hot", "warm", "cold"];
const AGENTS = ["Uzair Muhammad"];

const statusColor: Record<string, string> = {
  "New Lead": "bg-blue-100 text-blue-800",
  "Contacted": "bg-yellow-100 text-yellow-800",
  "Showing Booked": "bg-purple-100 text-purple-800",
  "Offer Made": "bg-orange-100 text-orange-800",
  "Nurturing": "bg-cyan-100 text-cyan-800",
  "Closed": "bg-green-100 text-green-800",
  "Lost": "bg-red-100 text-red-800",
};

const tempColor: Record<string, string> = {
  hot: "🔥",
  warm: "🟡",
  cold: "🧊",
};

const PAGE_SIZE = 50;

export default function CrmLeads() {
  const queryClient = useQueryClient();
  const [search, setSearch] = useState("");
  const [activeTab, setActiveTab] = useState("All Leads");
  const [page, setPage] = useState(0);
  const [addOpen, setAddOpen] = useState(false);

  // Form state
  const [form, setForm] = useState({
    name: "", email: "", phone: "", buyer_type: "", source: "",
    pipeline_status: "New Lead", temperature: "warm", assigned_agent: "Uzair Muhammad",
    budget_min: "", budget_max: "", notes: "", tags: "",
    project_interest: "", area_interest: "",
  });

  const resetForm = () => setForm({
    name: "", email: "", phone: "", buyer_type: "", source: "",
    pipeline_status: "New Lead", temperature: "warm", assigned_agent: "Uzair Muhammad",
    budget_min: "", budget_max: "", notes: "", tags: "",
    project_interest: "", area_interest: "",
  });

  // Build query filter
  const buildFilter = useCallback(() => {
    let tabFilter: string | null = null;
    if (activeTab !== "All Leads") {
      if (["New Lead", "Showing Booked", "Offer Made", "Nurturing", "Closed", "Lost"].includes(activeTab)) {
        tabFilter = activeTab;
      }
      // Pre-Sale, Re-Sale, Commercial map to buyer_type-ish filtering via tags; simplified for now
    }
    return tabFilter;
  }, [activeTab]);

  const { data, isLoading } = useQuery({
    queryKey: ["crm-leads", search, activeTab, page],
    queryFn: async () => {
      let q = supabase
        .from("crm_leads")
        .select("*", { count: "exact" })
        .order("created_at", { ascending: false })
        .range(page * PAGE_SIZE, (page + 1) * PAGE_SIZE - 1);

      const tabFilter = buildFilter();
      if (tabFilter) {
        q = q.eq("pipeline_status", tabFilter);
      }

      if (search.trim()) {
        q = q.or(`name.ilike.%${search}%,email.ilike.%${search}%,phone.ilike.%${search}%`);
      }

      const { data, error, count } = await q;
      if (error) throw error;
      return { leads: (data as CrmLead[]) || [], total: count || 0 };
    },
  });

  const addMutation = useMutation({
    mutationFn: async () => {
      const payload: Record<string, unknown> = {
        name: form.name,
        email: form.email || null,
        phone: form.phone || null,
        buyer_type: form.buyer_type || null,
        source: form.source || null,
        pipeline_status: form.pipeline_status,
        temperature: form.temperature,
        assigned_agent: form.assigned_agent || null,
        budget_min: form.budget_min ? parseInt(form.budget_min) : null,
        budget_max: form.budget_max ? parseInt(form.budget_max) : null,
        notes: form.notes || null,
        tags: form.tags ? form.tags.split(",").map((t) => t.trim()).filter(Boolean) : null,
        project_interest: form.project_interest ? form.project_interest.split(",").map((t) => t.trim()).filter(Boolean) : null,
        area_interest: form.area_interest ? form.area_interest.split(",").map((t) => t.trim()).filter(Boolean) : null,
      };
      const { error } = await supabase.from("crm_leads").insert(payload as any);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["crm-leads"] });
      toast.success("Lead added");
      setAddOpen(false);
      resetForm();
    },
    onError: (e: Error) => toast.error(e.message),
  });

  const updateStatus = useMutation({
    mutationFn: async ({ id, status }: { id: string; status: string }) => {
      const { error } = await supabase.from("crm_leads").update({ pipeline_status: status } as any).eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["crm-leads"] }),
    onError: (e: Error) => toast.error(e.message),
  });

  const updateAgent = useMutation({
    mutationFn: async ({ id, agent }: { id: string; agent: string }) => {
      const { error } = await supabase.from("crm_leads").update({ assigned_agent: agent } as any).eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["crm-leads"] }),
    onError: (e: Error) => toast.error(e.message),
  });

  const leads = data?.leads || [];
  const total = data?.total || 0;
  const totalPages = Math.ceil(total / PAGE_SIZE);

  return (
    <div className="p-6 max-w-[1600px] mx-auto">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Leads &amp; Contacts</h1>
          <p className="text-sm text-muted-foreground">
            Manage your leads, contacts, and pipeline from one place
          </p>
        </div>
        <Button onClick={() => setAddOpen(true)}>
          <Plus className="h-4 w-4 mr-1" /> Add Lead
        </Button>
      </div>

      {/* Tabs */}
      <div className="flex gap-1 overflow-x-auto pb-2 mb-4">
        {TAB_FILTERS.map((tab) => (
          <button
            key={tab}
            onClick={() => { setActiveTab(tab); setPage(0); }}
            className={cn(
              "px-3 py-1.5 rounded-full text-xs font-medium whitespace-nowrap transition-colors",
              activeTab === tab
                ? "bg-primary text-primary-foreground"
                : "bg-muted text-muted-foreground hover:bg-muted/80"
            )}
          >
            {tab}
          </button>
        ))}
      </div>

      {/* Search */}
      <div className="relative mb-4 max-w-md">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <Input
          placeholder="Search by name, email, or phone..."
          value={search}
          onChange={(e) => { setSearch(e.target.value); setPage(0); }}
          className="pl-9"
        />
      </div>

      {/* Table */}
      <div className="border rounded-lg bg-card">
        {isLoading ? (
          <div className="flex items-center justify-center py-20">
            <Loader2 className="h-6 w-6 animate-spin text-primary" />
          </div>
        ) : leads.length === 0 ? (
          <div className="text-center py-20 text-muted-foreground">
            No leads found. Click "Add Lead" to get started.
          </div>
        ) : (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="w-10"><input type="checkbox" className="rounded" /></TableHead>
                <TableHead>Name</TableHead>
                <TableHead>Contact Info</TableHead>
                <TableHead>Registered</TableHead>
                <TableHead>Pipeline Status</TableHead>
                <TableHead>Tags</TableHead>
                <TableHead>Assigned Agent</TableHead>
                <TableHead>Last Touch</TableHead>
                <TableHead>Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {leads.map((lead) => (
                <TableRow key={lead.id}>
                  <TableCell><input type="checkbox" className="rounded" /></TableCell>
                  <TableCell>
                    <div>
                      <span className="font-medium text-foreground">{lead.name}</span>
                      {lead.buyer_type && (
                        <span className="block text-xs text-muted-foreground">{lead.buyer_type}</span>
                      )}
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="text-xs space-y-0.5">
                      {lead.email && <div className="text-muted-foreground">{lead.email}</div>}
                      {lead.phone && <div className="text-muted-foreground">{lead.phone}</div>}
                    </div>
                  </TableCell>
                  <TableCell className="text-xs text-muted-foreground">
                    {format(new Date(lead.created_at), "MMM d, yyyy")}
                  </TableCell>
                  <TableCell>
                    <select
                      value={lead.pipeline_status}
                      onChange={(e) => updateStatus.mutate({ id: lead.id, status: e.target.value })}
                      className={cn(
                        "text-xs font-medium px-2 py-1 rounded-full border-0 cursor-pointer",
                        statusColor[lead.pipeline_status] || "bg-muted"
                      )}
                    >
                      {PIPELINE_STATUSES.map((s) => (
                        <option key={s} value={s}>{s}</option>
                      ))}
                    </select>
                  </TableCell>
                  <TableCell>
                    <div className="flex gap-1 flex-wrap">
                      {lead.temperature && (
                        <span className="text-xs">{tempColor[lead.temperature] || ""}</span>
                      )}
                      {lead.tags?.map((tag) => (
                        <span key={tag} className="bg-muted text-muted-foreground px-1.5 py-0.5 rounded text-[10px]">
                          {tag}
                        </span>
                      ))}
                    </div>
                  </TableCell>
                  <TableCell>
                    <select
                      value={lead.assigned_agent || ""}
                      onChange={(e) => updateAgent.mutate({ id: lead.id, agent: e.target.value })}
                      className="text-xs bg-transparent border-0 cursor-pointer text-foreground"
                    >
                      {AGENTS.map((a) => (
                        <option key={a} value={a}>{a}</option>
                      ))}
                    </select>
                  </TableCell>
                  <TableCell className="text-xs text-muted-foreground">
                    {lead.last_contacted_at
                      ? format(new Date(lead.last_contacted_at), "MMM d")
                      : "—"}
                  </TableCell>
                  <TableCell>
                    <div className="flex gap-1">
                      {lead.phone && (
                        <a href={`tel:${lead.phone}`} className="p-1.5 rounded hover:bg-muted transition-colors">
                          <Phone className="h-3.5 w-3.5 text-muted-foreground" />
                        </a>
                      )}
                      {lead.email && (
                        <a href={`mailto:${lead.email}`} className="p-1.5 rounded hover:bg-muted transition-colors">
                          <Mail className="h-3.5 w-3.5 text-muted-foreground" />
                        </a>
                      )}
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        )}
      </div>

      {/* Pagination */}
      {total > 0 && (
        <div className="flex items-center justify-between mt-4 text-sm text-muted-foreground">
          <span>
            {page * PAGE_SIZE + 1}–{Math.min((page + 1) * PAGE_SIZE, total)} of {total}
          </span>
          <div className="flex gap-1">
            <Button variant="outline" size="sm" disabled={page === 0} onClick={() => setPage(page - 1)}>
              Previous
            </Button>
            <Button variant="outline" size="sm" disabled={page >= totalPages - 1} onClick={() => setPage(page + 1)}>
              Next
            </Button>
          </div>
        </div>
      )}

      {/* Add Lead Modal */}
      <Dialog open={addOpen} onOpenChange={setAddOpen}>
        <DialogContent className="max-w-lg max-h-[85vh] overflow-y-auto bg-card text-foreground">
          <DialogHeader>
            <DialogTitle>Add New Lead</DialogTitle>
          </DialogHeader>
          <form
            onSubmit={(e) => { e.preventDefault(); addMutation.mutate(); }}
            className="space-y-4"
          >
            <div>
              <Label>Name *</Label>
              <Input required value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label>Email</Label>
                <Input type="email" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} />
              </div>
              <div>
                <Label>Phone</Label>
                <Input value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label>Buyer Type</Label>
                <select className="w-full h-10 rounded-lg border border-input bg-background px-3 text-sm" value={form.buyer_type} onChange={(e) => setForm({ ...form, buyer_type: e.target.value })}>
                  <option value="">Select...</option>
                  {BUYER_TYPES.map((b) => <option key={b} value={b}>{b}</option>)}
                </select>
              </div>
              <div>
                <Label>Source</Label>
                <select className="w-full h-10 rounded-lg border border-input bg-background px-3 text-sm" value={form.source} onChange={(e) => setForm({ ...form, source: e.target.value })}>
                  <option value="">Select...</option>
                  {SOURCES.map((s) => <option key={s} value={s}>{s}</option>)}
                </select>
              </div>
            </div>
            <div className="grid grid-cols-3 gap-3">
              <div>
                <Label>Pipeline Status</Label>
                <select className="w-full h-10 rounded-lg border border-input bg-background px-3 text-sm" value={form.pipeline_status} onChange={(e) => setForm({ ...form, pipeline_status: e.target.value })}>
                  {PIPELINE_STATUSES.map((s) => <option key={s} value={s}>{s}</option>)}
                </select>
              </div>
              <div>
                <Label>Temperature</Label>
                <select className="w-full h-10 rounded-lg border border-input bg-background px-3 text-sm" value={form.temperature} onChange={(e) => setForm({ ...form, temperature: e.target.value })}>
                  {TEMPERATURES.map((t) => <option key={t} value={t}>{tempColor[t]} {t}</option>)}
                </select>
              </div>
              <div>
                <Label>Assigned Agent</Label>
                <select className="w-full h-10 rounded-lg border border-input bg-background px-3 text-sm" value={form.assigned_agent} onChange={(e) => setForm({ ...form, assigned_agent: e.target.value })}>
                  {AGENTS.map((a) => <option key={a} value={a}>{a}</option>)}
                </select>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label>Budget Min ($)</Label>
                <Input type="number" value={form.budget_min} onChange={(e) => setForm({ ...form, budget_min: e.target.value })} />
              </div>
              <div>
                <Label>Budget Max ($)</Label>
                <Input type="number" value={form.budget_max} onChange={(e) => setForm({ ...form, budget_max: e.target.value })} />
              </div>
            </div>
            <div>
              <Label>Tags (comma-separated)</Label>
              <Input value={form.tags} onChange={(e) => setForm({ ...form, tags: e.target.value })} placeholder="VIP, Pre-Sale, Surrey" />
            </div>
            <div>
              <Label>Project Interest (comma-separated)</Label>
              <Input value={form.project_interest} onChange={(e) => setForm({ ...form, project_interest: e.target.value })} />
            </div>
            <div>
              <Label>Area Interest (comma-separated)</Label>
              <Input value={form.area_interest} onChange={(e) => setForm({ ...form, area_interest: e.target.value })} />
            </div>
            <div>
              <Label>Notes</Label>
              <textarea
                className="w-full rounded-lg border border-input bg-background px-3 py-2 text-sm min-h-[80px]"
                value={form.notes}
                onChange={(e) => setForm({ ...form, notes: e.target.value })}
              />
            </div>
            <div className="flex justify-end gap-2 pt-2">
              <Button type="button" variant="outline" onClick={() => setAddOpen(false)}>Cancel</Button>
              <Button type="submit" disabled={addMutation.isPending}>
                {addMutation.isPending ? <Loader2 className="h-4 w-4 animate-spin mr-1" /> : null}
                Add Lead
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
