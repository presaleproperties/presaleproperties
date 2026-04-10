import { useState, useMemo, useCallback } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import {
  DndContext,
  DragOverlay,
  closestCorners,
  PointerSensor,
  useSensor,
  useSensors,
  type DragStartEvent,
  type DragEndEvent,
} from "@dnd-kit/core";
import {
  SortableContext,
  verticalListSortingStrategy,
  useSortable,
} from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { useDroppable } from "@dnd-kit/core";
import { Input } from "@/components/ui/input";
import { toast } from "sonner";
import { Phone, Mail, Search, GripVertical } from "lucide-react";
import { cn } from "@/lib/utils";
import { formatDistanceToNow, differenceInDays } from "date-fns";

type CrmLead = {
  id: string;
  created_at: string;
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
  last_contacted_at: string | null;
  next_followup_at: string | null;
};

const COLUMNS = [
  { id: "New Lead", label: "New Lead", color: "bg-blue-500" },
  { id: "Pre-Sale", label: "Pre-Sale 🔥", color: "bg-orange-500" },
  { id: "Re-Sale", label: "Re-Sale 🔥", color: "bg-red-500" },
  { id: "Commercial", label: "Commercial", color: "bg-purple-500" },
  { id: "Showing Booked", label: "Showing Booked", color: "bg-teal-500" },
  { id: "Offer Made", label: "Offer Made", color: "bg-[hsl(40,65%,55%)]" },
  { id: "Nurturing", label: "Nurturing", color: "bg-green-500" },
  { id: "Closed", label: "Closed", color: "bg-green-700" },
  { id: "Lost", label: "Lost / Cold", color: "bg-gray-400" },
];

const AGENTS = ["All Agents", "Uzair Muhammad", "Sarb Grewal"];
const TEMPS = ["All", "hot", "warm", "cold"];
const SOURCES_LIST = ["All", "TikTok", "Instagram", "Facebook", "Website Form", "presaleproperties.com", "Manual Entry", "Referral"];

function formatBudget(min: number | null, max: number | null) {
  const fmt = (v: number) => (v >= 1_000_000 ? `$${(v / 1_000_000).toFixed(1)}M` : `$${(v / 1_000).toFixed(0)}K`);
  if (min && max) return `${fmt(min)} – ${fmt(max)}`;
  if (max) return `Up to ${fmt(max)}`;
  if (min) return `From ${fmt(min)}`;
  return null;
}

// ─── Droppable Column ────────────────────────────────────────────
function KanbanColumn({
  col,
  leads,
}: {
  col: (typeof COLUMNS)[number];
  leads: CrmLead[];
}) {
  const { setNodeRef, isOver } = useDroppable({ id: col.id });

  return (
    <div className="flex flex-col w-[280px] min-w-[280px] shrink-0">
      {/* Header */}
      <div className={cn("rounded-t-lg px-3 py-2 flex items-center justify-between", col.color)}>
        <span className="text-xs font-bold text-white truncate">{col.label}</span>
        <span className="bg-white/25 text-white text-[10px] font-bold rounded-full px-1.5 py-0.5 min-w-[20px] text-center">
          {leads.length}
        </span>
      </div>

      {/* Card list */}
      <div
        ref={setNodeRef}
        className={cn(
          "flex-1 bg-muted/40 rounded-b-lg p-2 space-y-2 min-h-[200px] transition-colors overflow-y-auto max-h-[calc(100vh-220px)]",
          isOver && "bg-primary/5 ring-2 ring-primary/20"
        )}
      >
        <SortableContext items={leads.map((l) => l.id)} strategy={verticalListSortingStrategy}>
          {leads.map((lead) => (
            <SortableCard key={lead.id} lead={lead} />
          ))}
        </SortableContext>
        {leads.length === 0 && (
          <div className="text-center py-8 text-xs text-muted-foreground">No leads</div>
        )}
      </div>
    </div>
  );
}

// ─── Sortable Card ───────────────────────────────────────────────
function SortableCard({ lead }: { lead: CrmLead }) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({
    id: lead.id,
    data: { lead },
  });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
  };

  return (
    <div
      ref={setNodeRef}
      style={style}
      className={cn(
        "rounded-lg border bg-card p-3 shadow-sm cursor-grab active:cursor-grabbing transition-shadow",
        isDragging && "opacity-40 shadow-lg"
      )}
      {...attributes}
      {...listeners}
    >
      <LeadCardContent lead={lead} />
    </div>
  );
}

// ─── Card Content (shared between sortable + overlay) ────────────
function LeadCardContent({ lead }: { lead: CrmLead }) {
  const daysSince = lead.last_contacted_at
    ? differenceInDays(new Date(), new Date(lead.last_contacted_at))
    : null;
  const neverContacted = !lead.last_contacted_at;
  const stale = daysSince !== null && daysSince >= 4;
  const budget = formatBudget(lead.budget_min, lead.budget_max);

  const tempCfg: Record<string, { emoji: string; label: string; cls: string }> = {
    hot: { emoji: "🔥", label: "Hot", cls: "bg-red-50 text-red-700 border-red-200" },
    warm: { emoji: "☀️", label: "Warm", cls: "bg-amber-50 text-amber-700 border-amber-200" },
    cold: { emoji: "❄️", label: "Cold", cls: "bg-blue-50 text-blue-700 border-blue-200" },
  };
  const tc = tempCfg[lead.temperature] || tempCfg.warm;

  return (
    <>
      <div className="flex items-start justify-between gap-1">
        <span className="font-semibold text-sm text-foreground leading-tight truncate">{lead.name}</span>
        <GripVertical className="h-3.5 w-3.5 text-muted-foreground/40 shrink-0 mt-0.5" />
      </div>

      {/* Contact */}
      <div className="mt-1.5 space-y-0.5">
        {lead.phone && (
          <a
            href={`tel:${lead.phone}`}
            onClick={(e) => e.stopPropagation()}
            className="flex items-center gap-1 text-[11px] text-muted-foreground hover:text-primary transition-colors"
          >
            <Phone className="h-3 w-3" /> {lead.phone}
          </a>
        )}
        {lead.email && (
          <a
            href={`mailto:${lead.email}`}
            onClick={(e) => e.stopPropagation()}
            className="flex items-center gap-1 text-[11px] text-muted-foreground hover:text-primary transition-colors truncate"
          >
            <Mail className="h-3 w-3 shrink-0" /> {lead.email}
          </a>
        )}
      </div>

      {/* Badges */}
      <div className="flex flex-wrap gap-1 mt-2">
        <span className={cn("inline-flex items-center gap-0.5 text-[10px] font-semibold px-1.5 py-0.5 rounded-full border", tc.cls)}>
          {tc.emoji} {tc.label}
        </span>
        {lead.source && (
          <span className="text-[10px] font-medium px-1.5 py-0.5 rounded-full bg-muted text-muted-foreground">
            {lead.source}
          </span>
        )}
      </div>

      {/* Meta */}
      <div className="mt-2 space-y-0.5 text-[10px] text-muted-foreground">
        {lead.assigned_agent && <div>Agent: {lead.assigned_agent}</div>}
        {budget && <div>{budget}</div>}
        <div className={cn(stale && "text-destructive font-semibold", neverContacted && "text-destructive font-semibold")}>
          {neverContacted
            ? "Never contacted"
            : `Last contact: ${formatDistanceToNow(new Date(lead.last_contacted_at!), { addSuffix: true })}${stale ? " ⚠️" : ""}`}
        </div>
      </div>
    </>
  );
}

// ─── Main Page ───────────────────────────────────────────────────
export default function CrmPipeline() {
  const queryClient = useQueryClient();
  const [search, setSearch] = useState("");
  const [agentFilter, setAgentFilter] = useState("All Agents");
  const [tempFilter, setTempFilter] = useState("All");
  const [sourceFilter, setSourceFilter] = useState("All");
  const [activeId, setActiveId] = useState<string | null>(null);

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 5 } })
  );

  const { data: leads = [] } = useQuery({
    queryKey: ["crm-pipeline-leads"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("crm_leads")
        .select("*")
        .order("created_at", { ascending: false });
      if (error) throw error;
      return (data as CrmLead[]) || [];
    },
  });

  // Realtime subscription
  useRealtimeLeads();

  const updateStatus = useMutation({
    mutationFn: async ({ id, status }: { id: string; status: string }) => {
      const { error } = await supabase
        .from("crm_leads")
        .update({ pipeline_status: status } as any)
        .eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["crm-pipeline-leads"] });
      queryClient.invalidateQueries({ queryKey: ["crm-leads"] });
      queryClient.invalidateQueries({ queryKey: ["crm-dashboard-leads"] });
    },
    onError: (e: Error) => toast.error(e.message),
  });

  // Filter leads
  const filtered = useMemo(() => {
    return leads.filter((l) => {
      if (agentFilter !== "All Agents" && l.assigned_agent !== agentFilter) return false;
      if (tempFilter !== "All" && l.temperature !== tempFilter) return false;
      if (sourceFilter !== "All" && l.source !== sourceFilter) return false;
      if (search.trim()) {
        const q = search.toLowerCase();
        if (
          !l.name.toLowerCase().includes(q) &&
          !(l.email || "").toLowerCase().includes(q) &&
          !(l.phone || "").toLowerCase().includes(q)
        )
          return false;
      }
      return true;
    });
  }, [leads, agentFilter, tempFilter, sourceFilter, search]);

  // Group by column — map statuses to known columns, fallback to "New Lead"
  const grouped = useMemo(() => {
    const map: Record<string, CrmLead[]> = {};
    COLUMNS.forEach((c) => (map[c.id] = []));

    filtered.forEach((l) => {
      // Map pipeline_status → column id
      let colId = l.pipeline_status;
      // Handle "Contacted" → "New Lead", or any unknown → "New Lead"
      if (!map[colId]) {
        if (colId === "Contacted") colId = "New Lead";
        else colId = "New Lead";
      }
      map[colId].push(l);
    });
    return map;
  }, [filtered]);

  const activeLead = activeId ? leads.find((l) => l.id === activeId) : null;

  const handleDragStart = useCallback((event: DragStartEvent) => {
    setActiveId(event.active.id as string);
  }, []);

  const handleDragEnd = useCallback(
    (event: DragEndEvent) => {
      setActiveId(null);
      const { active, over } = event;
      if (!over) return;

      const leadId = active.id as string;
      // Determine target column: over.id could be a column id or another card id
      let targetColumn: string | null = null;

      // Check if dropped on a column directly
      if (COLUMNS.some((c) => c.id === over.id)) {
        targetColumn = over.id as string;
      } else {
        // Dropped on a card — find which column that card belongs to
        for (const [colId, colLeads] of Object.entries(grouped)) {
          if (colLeads.some((l) => l.id === over.id)) {
            targetColumn = colId;
            break;
          }
        }
      }

      if (!targetColumn) return;

      const lead = leads.find((l) => l.id === leadId);
      if (!lead) return;

      // Find current column
      let currentColumn = lead.pipeline_status;
      if (!COLUMNS.some((c) => c.id === currentColumn)) {
        currentColumn = "New Lead";
      }

      if (currentColumn === targetColumn) return;

      // Optimistic update
      queryClient.setQueryData(["crm-pipeline-leads"], (old: CrmLead[] | undefined) =>
        (old || []).map((l) => (l.id === leadId ? { ...l, pipeline_status: targetColumn! } : l))
      );

      updateStatus.mutate({ id: leadId, status: targetColumn });
      toast.success(`Moved to ${targetColumn}`);
    },
    [leads, grouped, queryClient, updateStatus]
  );

  return (
    <div className="flex flex-col h-full">
      {/* Top Bar */}
      <div className="p-4 pb-3 border-b bg-card space-y-3">
        <h1 className="text-xl font-bold text-foreground">Pipeline</h1>
        <div className="flex flex-wrap items-center gap-2">
          <select
            value={agentFilter}
            onChange={(e) => setAgentFilter(e.target.value)}
            className="h-9 rounded-lg border border-input bg-background px-3 text-xs"
          >
            {AGENTS.map((a) => <option key={a} value={a}>{a}</option>)}
          </select>
          <select
            value={tempFilter}
            onChange={(e) => setTempFilter(e.target.value)}
            className="h-9 rounded-lg border border-input bg-background px-3 text-xs"
          >
            {TEMPS.map((t) => <option key={t} value={t}>{t === "All" ? "All Temps" : `${t.charAt(0).toUpperCase() + t.slice(1)}`}</option>)}
          </select>
          <select
            value={sourceFilter}
            onChange={(e) => setSourceFilter(e.target.value)}
            className="h-9 rounded-lg border border-input bg-background px-3 text-xs"
          >
            {SOURCES_LIST.map((s) => <option key={s} value={s}>{s === "All" ? "All Sources" : s}</option>)}
          </select>
          <div className="relative flex-1 min-w-[180px] max-w-xs">
            <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground" />
            <Input
              placeholder="Search name, email, phone..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="h-9 pl-8 text-xs"
            />
          </div>
        </div>
      </div>

      {/* Kanban Board */}
      <div className="flex-1 overflow-x-auto p-4">
        <DndContext
          sensors={sensors}
          collisionDetection={closestCorners}
          onDragStart={handleDragStart}
          onDragEnd={handleDragEnd}
        >
          <div className="flex gap-3 h-full">
            {COLUMNS.map((col) => (
              <KanbanColumn key={col.id} col={col} leads={grouped[col.id] || []} />
            ))}
          </div>

          <DragOverlay>
            {activeLead ? (
              <div className="w-[270px] rounded-lg border bg-card p-3 shadow-xl rotate-2 opacity-90">
                <LeadCardContent lead={activeLead} />
              </div>
            ) : null}
          </DragOverlay>
        </DndContext>
      </div>
    </div>
  );
}

// ─── Realtime Hook ───────────────────────────────────────────────
function useRealtimeLeads() {
  const queryClient = useQueryClient();

  useState(() => {
    const channel = supabase
      .channel("crm-leads-realtime")
      .on("postgres_changes", { event: "*", schema: "public", table: "crm_leads" }, () => {
        queryClient.invalidateQueries({ queryKey: ["crm-pipeline-leads"] });
      })
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  });
}
