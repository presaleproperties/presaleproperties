import { useState, useMemo } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Plus, ChevronLeft, ChevronRight, CalendarIcon, Phone, Mail, MessageSquare, Pencil, Trash2, Clock, MapPin, User, X } from "lucide-react";
import { toast } from "sonner";
import { format, addMonths, subMonths, startOfMonth, endOfMonth, eachDayOfInterval, getDay, isSameDay, isToday, startOfWeek, endOfWeek, addWeeks, subWeeks, addDays, subDays } from "date-fns";
import { cn } from "@/lib/utils";

type Showing = {
  id: string; lead_id: string | null; lead_name: string; lead_phone: string; lead_email: string;
  project_name: string; property_address: string; showing_date: string; showing_time: string;
  duration_minutes: number; status: string; assigned_agent: string; notes: string;
  created_at: string; updated_at: string;
};

const STATUSES = ["Scheduled", "Confirmed", "Completed", "Cancelled", "No-Show"];
const STATUS_COLORS: Record<string, string> = {
  Scheduled: "bg-blue-100 text-blue-700 border-blue-200",
  Confirmed: "bg-green-100 text-green-700 border-green-200",
  Completed: "bg-muted text-muted-foreground border-border",
  Cancelled: "bg-red-100 text-red-700 border-red-200",
  "No-Show": "bg-orange-100 text-orange-700 border-orange-200",
};
const STATUS_DOT: Record<string, string> = {
  Scheduled: "bg-blue-500", Confirmed: "bg-green-500", Completed: "bg-gray-400",
  Cancelled: "bg-red-500", "No-Show": "bg-orange-500",
};
const AGENTS = ["All Agents", "Uzair Muhammad", "Sarb Grewal"];
const TIMES = Array.from({ length: 25 }, (_, i) => {
  const h = Math.floor(i / 2) + 8;
  const m = i % 2 === 0 ? "00" : "30";
  return `${String(h).padStart(2, "0")}:${m}`;
}).filter((t) => t <= "20:00");
const DURATIONS = [15, 30, 45, 60];

const emptyDraft = { lead_id: "", lead_name: "", lead_phone: "", lead_email: "", project_name: "", property_address: "", showing_date: "", showing_time: "10:00", duration_minutes: 30, assigned_agent: "Uzair Muhammad", notes: "" };

export default function CrmCalendar() {
  const [view, setView] = useState<"month" | "week" | "day" | "list">("month");
  const [currentDate, setCurrentDate] = useState(new Date());
  const [agentFilter, setAgentFilter] = useState("All Agents");
  const [statusFilter, setStatusFilter] = useState("All");
  const [scheduleOpen, setScheduleOpen] = useState(false);
  const [detailOpen, setDetailOpen] = useState(false);
  const [selectedShowing, setSelectedShowing] = useState<Showing | null>(null);
  const [selectedDay, setSelectedDay] = useState<Date | null>(null);
  const [dayPanelOpen, setDayPanelOpen] = useState(false);
  const [draft, setDraft] = useState(emptyDraft);
  const [datePickerOpen, setDatePickerOpen] = useState(false);
  const qc = useQueryClient();

  const { data: showings = [] } = useQuery({
    queryKey: ["crm-showings"],
    queryFn: async () => {
      const { data, error } = await supabase.from("crm_showings").select("*").order("showing_date", { ascending: true });
      if (error) throw error;
      return data as Showing[];
    },
  });

  const { data: leads = [] } = useQuery({
    queryKey: ["crm-leads-for-showings"],
    queryFn: async () => {
      const { data } = await supabase.from("crm_leads").select("id, name, phone, email").order("name");
      return data || [];
    },
  });

  const filtered = useMemo(() => showings.filter((s) => {
    if (agentFilter !== "All Agents" && s.assigned_agent !== agentFilter) return false;
    if (statusFilter !== "All" && s.status !== statusFilter) return false;
    return true;
  }), [showings, agentFilter, statusFilter]);

  const save = useMutation({
    mutationFn: async () => {
      const payload = { ...draft, lead_id: draft.lead_id || null } as any;
      const { error } = await supabase.from("crm_showings").insert(payload);
      if (error) throw error;
    },
    onSuccess: () => { qc.invalidateQueries({ queryKey: ["crm-showings"] }); toast.success("Showing scheduled"); setScheduleOpen(false); setDraft(emptyDraft); },
  });

  const updateStatus = useMutation({
    mutationFn: async ({ id, status }: { id: string; status: string }) => {
      const { error } = await supabase.from("crm_showings").update({ status }).eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => { qc.invalidateQueries({ queryKey: ["crm-showings"] }); toast.success("Status updated"); },
  });

  const del = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("crm_showings").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => { qc.invalidateQueries({ queryKey: ["crm-showings"] }); toast.success("Deleted"); setDetailOpen(false); },
  });

  const selectLead = (leadId: string) => {
    const lead = leads.find((l) => l.id === leadId);
    if (lead) setDraft({ ...draft, lead_id: leadId, lead_name: lead.name, lead_phone: lead.phone || "", lead_email: lead.email || "" });
  };

  const openSchedule = (date?: Date) => {
    setDraft({ ...emptyDraft, showing_date: date ? format(date, "yyyy-MM-dd") : "" });
    setScheduleOpen(true);
  };

  const openDetail = (s: Showing) => { setSelectedShowing(s); setDetailOpen(true); };

  // Month view helpers
  const monthStart = startOfMonth(currentDate);
  const monthEnd = endOfMonth(currentDate);
  const calStart = startOfWeek(monthStart);
  const calEnd = endOfWeek(monthEnd);
  const calDays = eachDayOfInterval({ start: calStart, end: calEnd });

  const showingsOnDate = (date: Date) => filtered.filter((s) => isSameDay(new Date(s.showing_date + "T00:00:00"), date));

  // Week view
  const weekStart = startOfWeek(currentDate);
  const weekDays = eachDayOfInterval({ start: weekStart, end: endOfWeek(currentDate) });
  const hours = Array.from({ length: 13 }, (_, i) => i + 8); // 8-20

  const nav = (dir: number) => {
    if (view === "month") setCurrentDate(dir > 0 ? addMonths(currentDate, 1) : subMonths(currentDate, 1));
    else if (view === "week") setCurrentDate(dir > 0 ? addWeeks(currentDate, 1) : subWeeks(currentDate, 1));
    else setCurrentDate(dir > 0 ? addDays(currentDate, 1) : subDays(currentDate, 1));
  };

  // Day panel showings
  const dayShowings = selectedDay ? showingsOnDate(selectedDay) : [];

  return (
    <div className="space-y-4">
      {/* Top bar */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Showings Calendar</h1>
          <p className="text-muted-foreground text-sm">{filtered.length} showings total</p>
        </div>
        <Button onClick={() => openSchedule()} className="gap-2 bg-primary hover:bg-primary/90"><Plus className="h-4 w-4" />Schedule Showing</Button>
      </div>

      {/* Controls */}
      <div className="flex flex-wrap items-center gap-2">
        <div className="flex items-center border rounded-lg overflow-hidden">
          {(["month", "week", "day", "list"] as const).map((v) => (
            <button key={v} onClick={() => setView(v)} className={cn("px-3 py-1.5 text-xs font-medium capitalize transition-colors", view === v ? "bg-primary text-primary-foreground" : "bg-background text-muted-foreground hover:bg-muted")}>
              {v}
            </button>
          ))}
        </div>
        <div className="flex items-center gap-1">
          <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => nav(-1)}><ChevronLeft className="h-4 w-4" /></Button>
          <span className="text-sm font-medium min-w-[140px] text-center">
            {view === "month" ? format(currentDate, "MMMM yyyy") : view === "day" ? format(currentDate, "EEEE, MMM d") : `Week of ${format(weekStart, "MMM d")}`}
          </span>
          <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => nav(1)}><ChevronRight className="h-4 w-4" /></Button>
        </div>
        <Button variant="outline" size="sm" className="text-xs" onClick={() => setCurrentDate(new Date())}>Today</Button>
        <Select value={agentFilter} onValueChange={setAgentFilter}>
          <SelectTrigger className="w-[150px] h-8 text-xs"><SelectValue /></SelectTrigger>
          <SelectContent>{AGENTS.map((a) => <SelectItem key={a} value={a}>{a}</SelectItem>)}</SelectContent>
        </Select>
        <Select value={statusFilter} onValueChange={setStatusFilter}>
          <SelectTrigger className="w-[130px] h-8 text-xs"><SelectValue /></SelectTrigger>
          <SelectContent>
            <SelectItem value="All">All Status</SelectItem>
            {STATUSES.map((s) => <SelectItem key={s} value={s}>{s}</SelectItem>)}
          </SelectContent>
        </Select>
      </div>

      {/* Views */}
      <div className="flex gap-4">
        <div className="flex-1">
          {view === "month" && (
            <Card>
              <CardContent className="p-0">
                <div className="grid grid-cols-7">
                  {["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"].map((d) => (
                    <div key={d} className="p-2 text-xs font-medium text-muted-foreground text-center border-b">{d}</div>
                  ))}
                  {calDays.map((day) => {
                    const dayS = showingsOnDate(day);
                    const isCurrentMonth = day.getMonth() === currentDate.getMonth();
                    return (
                      <div
                        key={day.toISOString()}
                        className={cn("min-h-[90px] p-1 border-b border-r cursor-pointer hover:bg-muted/30 transition-colors",
                          !isCurrentMonth && "bg-muted/10 text-muted-foreground/50",
                          isToday(day) && "bg-primary/5"
                        )}
                        onClick={() => { setSelectedDay(day); setDayPanelOpen(true); }}
                      >
                        <div className={cn("text-xs font-medium mb-1 w-6 h-6 flex items-center justify-center rounded-full",
                          isToday(day) && "bg-primary text-primary-foreground"
                        )}>
                          {format(day, "d")}
                        </div>
                        <div className="space-y-0.5">
                          {dayS.slice(0, 3).map((s) => (
                            <button
                              key={s.id}
                              className={cn("w-full text-left text-[10px] px-1 py-0.5 rounded truncate border", STATUS_COLORS[s.status])}
                              onClick={(e) => { e.stopPropagation(); openDetail(s); }}
                            >
                              {s.showing_time.slice(0, 5)} {s.lead_name}
                            </button>
                          ))}
                          {dayS.length > 3 && <p className="text-[10px] text-muted-foreground pl-1">+{dayS.length - 3} more</p>}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </CardContent>
            </Card>
          )}

          {view === "week" && (
            <Card>
              <CardContent className="p-0 overflow-x-auto">
                <div className="grid grid-cols-8 min-w-[700px]">
                  <div className="border-b border-r p-2" />
                  {weekDays.map((d) => (
                    <div key={d.toISOString()} className={cn("border-b border-r p-2 text-center", isToday(d) && "bg-primary/5")}>
                      <div className="text-xs text-muted-foreground">{format(d, "EEE")}</div>
                      <div className={cn("text-sm font-medium w-7 h-7 mx-auto flex items-center justify-center rounded-full", isToday(d) && "bg-primary text-primary-foreground")}>{format(d, "d")}</div>
                    </div>
                  ))}
                  {hours.map((h) => (
                    <div key={h} className="contents">
                      <div className="border-r border-b p-1 text-[10px] text-muted-foreground text-right pr-2">{h}:00</div>
                      {weekDays.map((d) => {
                        const dayS = showingsOnDate(d).filter((s) => parseInt(s.showing_time) === h);
                        return (
                          <div key={d.toISOString() + h} className="border-r border-b min-h-[40px] p-0.5 relative">
                            {dayS.map((s) => (
                              <button key={s.id} onClick={() => openDetail(s)} className={cn("w-full text-left text-[10px] px-1 py-0.5 rounded border mb-0.5 truncate", STATUS_COLORS[s.status])}>
                                {s.showing_time.slice(0, 5)} {s.lead_name}
                              </button>
                            ))}
                          </div>
                        );
                      })}
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}

          {view === "day" && (
            <Card>
              <CardContent className="p-0">
                {hours.map((h) => {
                  const dayS = showingsOnDate(currentDate).filter((s) => parseInt(s.showing_time) === h);
                  return (
                    <div key={h} className="flex border-b min-h-[50px]">
                      <div className="w-16 shrink-0 p-2 text-xs text-muted-foreground text-right border-r">{h}:00</div>
                      <div className="flex-1 p-1 space-y-1">
                        {dayS.map((s) => (
                          <button key={s.id} onClick={() => openDetail(s)} className={cn("w-full text-left text-xs p-2 rounded border flex items-center gap-2", STATUS_COLORS[s.status])}>
                            <span className="font-medium">{s.showing_time.slice(0, 5)}</span>
                            <span>{s.lead_name}</span>
                            <span className="text-muted-foreground">— {s.project_name}</span>
                            <span className="ml-auto text-muted-foreground">{s.assigned_agent}</span>
                          </button>
                        ))}
                      </div>
                    </div>
                  );
                })}
              </CardContent>
            </Card>
          )}

          {view === "list" && (
            <Card>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Date</TableHead><TableHead>Time</TableHead><TableHead>Lead</TableHead>
                    <TableHead>Project</TableHead><TableHead>Address</TableHead><TableHead>Agent</TableHead>
                    <TableHead>Status</TableHead><TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filtered.length === 0 ? (
                    <TableRow><TableCell colSpan={8} className="text-center py-8 text-muted-foreground">No showings found</TableCell></TableRow>
                  ) : filtered.map((s) => (
                    <TableRow key={s.id} className="cursor-pointer hover:bg-muted/30" onClick={() => openDetail(s)}>
                      <TableCell className="text-sm">{format(new Date(s.showing_date + "T00:00:00"), "MMM d, yyyy")}</TableCell>
                      <TableCell className="text-sm">{s.showing_time.slice(0, 5)}</TableCell>
                      <TableCell className="font-medium text-sm">{s.lead_name}</TableCell>
                      <TableCell className="text-sm">{s.project_name}</TableCell>
                      <TableCell className="text-sm text-muted-foreground">{s.property_address}</TableCell>
                      <TableCell className="text-sm">{s.assigned_agent}</TableCell>
                      <TableCell><Badge className={cn("text-xs", STATUS_COLORS[s.status])}>{s.status}</Badge></TableCell>
                      <TableCell className="text-right">
                        <Button variant="ghost" size="icon" className="h-7 w-7" onClick={(e) => { e.stopPropagation(); del.mutate(s.id); }}><Trash2 className="h-3.5 w-3.5 text-destructive" /></Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </Card>
          )}
        </div>

        {/* Day side panel */}
        {dayPanelOpen && selectedDay && view === "month" && (
          <Card className="w-72 shrink-0">
            <CardHeader className="pb-2 flex flex-row items-center justify-between">
              <CardTitle className="text-sm">{format(selectedDay, "EEEE, MMM d")}</CardTitle>
              <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => setDayPanelOpen(false)}><X className="h-4 w-4" /></Button>
            </CardHeader>
            <CardContent className="space-y-2">
              {dayShowings.length === 0 ? (
                <p className="text-xs text-muted-foreground py-4 text-center">No showings</p>
              ) : dayShowings.map((s) => (
                <button key={s.id} onClick={() => openDetail(s)} className={cn("w-full text-left p-2 rounded border text-xs space-y-1", STATUS_COLORS[s.status])}>
                  <div className="font-medium">{s.showing_time.slice(0, 5)} — {s.lead_name}</div>
                  <div className="text-muted-foreground">{s.project_name}</div>
                </button>
              ))}
              <Button variant="outline" size="sm" className="w-full text-xs gap-1" onClick={() => openSchedule(selectedDay)}><Plus className="h-3 w-3" />Add Showing</Button>
            </CardContent>
          </Card>
        )}
      </div>

      {/* Schedule Modal */}
      <Dialog open={scheduleOpen} onOpenChange={setScheduleOpen}>
        <DialogContent className="max-w-lg max-h-[85vh] overflow-y-auto">
          <DialogHeader><DialogTitle>Schedule Showing</DialogTitle></DialogHeader>
          <div className="space-y-4">
            <div>
              <label className="text-sm font-medium mb-1.5 block">Lead</label>
              <Select value={draft.lead_id} onValueChange={selectLead}>
                <SelectTrigger><SelectValue placeholder="Select a lead" /></SelectTrigger>
                <SelectContent>
                  {leads.map((l) => <SelectItem key={l.id} value={l.id}>{l.name}{l.phone ? ` — ${l.phone}` : ""}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-sm font-medium mb-1.5 block">Project Name</label>
                <Input value={draft.project_name} onChange={(e) => setDraft({ ...draft, project_name: e.target.value })} placeholder="e.g. The Grand" />
              </div>
              <div>
                <label className="text-sm font-medium mb-1.5 block">Address</label>
                <Input value={draft.property_address} onChange={(e) => setDraft({ ...draft, property_address: e.target.value })} placeholder="123 Main St" />
              </div>
            </div>
            <div className="grid grid-cols-3 gap-3">
              <div>
                <label className="text-sm font-medium mb-1.5 block">Date</label>
                <Popover open={datePickerOpen} onOpenChange={setDatePickerOpen}>
                  <PopoverTrigger asChild>
                    <Button variant="outline" className={cn("w-full justify-start text-left text-xs font-normal", !draft.showing_date && "text-muted-foreground")}>
                      <CalendarIcon className="mr-1 h-3.5 w-3.5" />
                      {draft.showing_date ? format(new Date(draft.showing_date + "T00:00:00"), "MMM d, yyyy") : "Pick date"}
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0" align="start">
                    <Calendar
                      mode="single"
                      selected={draft.showing_date ? new Date(draft.showing_date + "T00:00:00") : undefined}
                      onSelect={(d) => { if (d) { setDraft({ ...draft, showing_date: format(d, "yyyy-MM-dd") }); setDatePickerOpen(false); } }}
                      className="p-3 pointer-events-auto"
                    />
                  </PopoverContent>
                </Popover>
              </div>
              <div>
                <label className="text-sm font-medium mb-1.5 block">Time</label>
                <Select value={draft.showing_time} onValueChange={(v) => setDraft({ ...draft, showing_time: v })}>
                  <SelectTrigger className="text-xs"><SelectValue /></SelectTrigger>
                  <SelectContent>{TIMES.map((t) => <SelectItem key={t} value={t}>{t}</SelectItem>)}</SelectContent>
                </Select>
              </div>
              <div>
                <label className="text-sm font-medium mb-1.5 block">Duration</label>
                <Select value={String(draft.duration_minutes)} onValueChange={(v) => setDraft({ ...draft, duration_minutes: parseInt(v) })}>
                  <SelectTrigger className="text-xs"><SelectValue /></SelectTrigger>
                  <SelectContent>{DURATIONS.map((d) => <SelectItem key={d} value={String(d)}>{d} min</SelectItem>)}</SelectContent>
                </Select>
              </div>
            </div>
            <div>
              <label className="text-sm font-medium mb-1.5 block">Assigned Agent</label>
              <Select value={draft.assigned_agent} onValueChange={(v) => setDraft({ ...draft, assigned_agent: v })}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>{AGENTS.filter((a) => a !== "All Agents").map((a) => <SelectItem key={a} value={a}>{a}</SelectItem>)}</SelectContent>
              </Select>
            </div>
            <div>
              <label className="text-sm font-medium mb-1.5 block">Notes</label>
              <Textarea value={draft.notes} onChange={(e) => setDraft({ ...draft, notes: e.target.value })} placeholder="Any special instructions..." className="min-h-[60px]" />
            </div>
            <div className="flex justify-end gap-2">
              <Button variant="outline" onClick={() => setScheduleOpen(false)}>Cancel</Button>
              <Button className="bg-primary hover:bg-primary/90" disabled={!draft.lead_name || !draft.showing_date} onClick={() => save.mutate()}>Schedule</Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Detail Modal */}
      <Dialog open={detailOpen} onOpenChange={setDetailOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader><DialogTitle>Showing Details</DialogTitle></DialogHeader>
          {selectedShowing && (
            <div className="space-y-4">
              <div className="space-y-2">
                <div className="flex items-center gap-2">
                  <User className="h-4 w-4 text-muted-foreground" />
                  <span className="font-medium">{selectedShowing.lead_name}</span>
                  <Badge className={cn("text-xs ml-auto", STATUS_COLORS[selectedShowing.status])}>{selectedShowing.status}</Badge>
                </div>
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <CalendarIcon className="h-4 w-4" />
                  {format(new Date(selectedShowing.showing_date + "T00:00:00"), "EEEE, MMM d, yyyy")} at {selectedShowing.showing_time.slice(0, 5)}
                </div>
                {selectedShowing.project_name && (
                  <div className="flex items-center gap-2 text-sm text-muted-foreground"><MapPin className="h-4 w-4" />{selectedShowing.project_name}{selectedShowing.property_address ? ` — ${selectedShowing.property_address}` : ""}</div>
                )}
                <div className="flex items-center gap-2 text-sm text-muted-foreground"><Clock className="h-4 w-4" />{selectedShowing.duration_minutes} minutes • {selectedShowing.assigned_agent}</div>
              </div>

              <div className="flex gap-2">
                {selectedShowing.lead_phone && <Button variant="outline" size="sm" className="gap-1 text-xs" asChild><a href={`tel:${selectedShowing.lead_phone}`}><Phone className="h-3.5 w-3.5" />Call</a></Button>}
                {selectedShowing.lead_email && <Button variant="outline" size="sm" className="gap-1 text-xs" asChild><a href={`mailto:${selectedShowing.lead_email}`}><Mail className="h-3.5 w-3.5" />Email</a></Button>}
                {selectedShowing.lead_phone && <Button variant="outline" size="sm" className="gap-1 text-xs" asChild><a href={`sms:${selectedShowing.lead_phone}`}><MessageSquare className="h-3.5 w-3.5" />Text</a></Button>}
              </div>

              <div>
                <label className="text-sm font-medium mb-1.5 block">Update Status</label>
                <Select value={selectedShowing.status} onValueChange={(v) => { updateStatus.mutate({ id: selectedShowing.id, status: v }); setSelectedShowing({ ...selectedShowing, status: v }); }}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>{STATUSES.map((s) => <SelectItem key={s} value={s}>{s}</SelectItem>)}</SelectContent>
                </Select>
              </div>

              {selectedShowing.notes && (
                <div>
                  <label className="text-sm font-medium mb-1 block">Notes</label>
                  <p className="text-sm text-muted-foreground bg-muted/30 p-2 rounded">{selectedShowing.notes}</p>
                </div>
              )}

              <div className="flex justify-end gap-2 pt-2">
                <Button variant="destructive" size="sm" onClick={() => del.mutate(selectedShowing.id)}>Delete</Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
