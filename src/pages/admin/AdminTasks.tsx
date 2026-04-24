import { useState } from "react";
import { AdminLayout } from "@/components/admin/AdminLayout";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Progress } from "@/components/ui/progress";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import {
  CheckCircle2, Circle, Clock, AlertTriangle, Plus, Search,
  ListTodo, TrendingUp, Target, FileText, Wrench, Database,
  Calendar, Pencil, Trash2, ArrowUpCircle, ArrowRightCircle, ArrowDownCircle,
} from "lucide-react";

type Task = {
  id: string;
  title: string;
  description: string | null;
  category: string;
  priority: string;
  status: string;
  due_date: string | null;
  notes: string | null;
  created_at: string;
  completed_at: string | null;
};

const categoryConfig: Record<string, { label: string; icon: typeof Target; color: string }> = {
  seo: { label: "SEO / AEO", icon: TrendingUp, color: "text-info bg-info-soft border-info/30" },
  content: { label: "Content", icon: FileText, color: "text-danger bg-danger-soft border-danger/30" },
  technical: { label: "Technical", icon: Wrench, color: "text-primary bg-primary/10 border-primary/30" },
  data: { label: "Data / Ops", icon: Database, color: "text-success bg-success-soft border-success/30" },
  general: { label: "General", icon: Target, color: "text-foreground bg-muted border-border" },
};

const priorityConfig: Record<string, { label: string; icon: typeof ArrowUpCircle; color: string }> = {
  high: { label: "High", icon: ArrowUpCircle, color: "text-danger" },
  medium: { label: "Medium", icon: ArrowRightCircle, color: "text-warning" },
  low: { label: "Low", icon: ArrowDownCircle, color: "text-muted-foreground" },
};

const statusConfig: Record<string, { label: string; icon: typeof Circle; color: string }> = {
  todo: { label: "To Do", icon: Circle, color: "bg-muted text-foreground border-border" },
  in_progress: { label: "In Progress", icon: Clock, color: "bg-warning-soft text-warning-strong border-warning/30" },
  done: { label: "Done", icon: CheckCircle2, color: "bg-success-soft text-success-strong border-success/30" },
  blocked: { label: "Blocked", icon: AlertTriangle, color: "bg-danger-soft text-danger-strong border-danger/30" },
};

export default function AdminTasks() {
  const queryClient = useQueryClient();
  const [filterCategory, setFilterCategory] = useState<string>("all");
  const [filterStatus, setFilterStatus] = useState<string>("all");
  const [search, setSearch] = useState("");
  const [editTask, setEditTask] = useState<Task | null>(null);
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({ title: "", description: "", category: "general", priority: "medium", status: "todo", due_date: "", notes: "" });

  const { data: tasks = [], isLoading } = useQuery({
    queryKey: ["admin-tasks"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("admin_tasks")
        .select("*")
        .order("created_at", { ascending: false });
      if (error) throw error;
      return data as Task[];
    },
  });

  const upsertMutation = useMutation({
    mutationFn: async (task: Partial<Task> & { id?: string }) => {
      const payload = {
        title: task.title!,
        description: task.description || null,
        category: task.category || "general",
        priority: task.priority || "medium",
        status: task.status || "todo",
        due_date: task.due_date || null,
        notes: task.notes || null,
        completed_at: task.status === "done" ? new Date().toISOString() : null,
      };
      if (task.id) {
        const { error } = await supabase.from("admin_tasks").update(payload).eq("id", task.id);
        if (error) throw error;
      } else {
        const { error } = await supabase.from("admin_tasks").insert(payload);
        if (error) throw error;
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin-tasks"] });
      toast.success(editTask ? "Task updated" : "Task created");
      resetForm();
    },
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("admin_tasks").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin-tasks"] });
      toast.success("Task deleted");
    },
  });

  const statusToggle = useMutation({
    mutationFn: async ({ id, status }: { id: string; status: string }) => {
      const newStatus = status === "done" ? "todo" : "done";
      const { error } = await supabase.from("admin_tasks").update({
        status: newStatus,
        completed_at: newStatus === "done" ? new Date().toISOString() : null,
      }).eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["admin-tasks"] }),
  });

  const resetForm = () => {
    setForm({ title: "", description: "", category: "general", priority: "medium", status: "todo", due_date: "", notes: "" });
    setEditTask(null);
    setShowForm(false);
  };

  const openEdit = (task: Task) => {
    setEditTask(task);
    setForm({
      title: task.title,
      description: task.description || "",
      category: task.category,
      priority: task.priority,
      status: task.status,
      due_date: task.due_date || "",
      notes: task.notes || "",
    });
    setShowForm(true);
  };

  const filtered = tasks.filter((t) => {
    if (filterCategory !== "all" && t.category !== filterCategory) return false;
    if (filterStatus !== "all" && t.status !== filterStatus) return false;
    if (search && !t.title.toLowerCase().includes(search.toLowerCase())) return false;
    return true;
  });

  const total = tasks.length;
  const done = tasks.filter((t) => t.status === "done").length;
  const inProgress = tasks.filter((t) => t.status === "in_progress").length;
  const highPriority = tasks.filter((t) => t.priority === "high" && t.status !== "done").length;
  const overdue = tasks.filter((t) => t.due_date && new Date(t.due_date) < new Date() && t.status !== "done").length;
  const progress = total > 0 ? Math.round((done / total) * 100) : 0;

  const statsByCategory = Object.entries(categoryConfig).map(([key, cfg]) => {
    const catTasks = tasks.filter((t) => t.category === key);
    const catDone = catTasks.filter((t) => t.status === "done").length;
    return { key, ...cfg, total: catTasks.length, done: catDone };
  }).filter((c) => c.total > 0);

  return (
    <AdminLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold tracking-tight">Action Items</h1>
            <p className="text-sm text-muted-foreground">Tasks to fill gaps and improve the platform</p>
          </div>
          <Button onClick={() => { resetForm(); setShowForm(true); }} size="sm">
            <Plus className="h-4 w-4 mr-1.5" /> Add Task
          </Button>
        </div>

        {/* Stats Row */}
        <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
          <Card className="border-l-4 border-l-primary">
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs text-muted-foreground">Overall</p>
                  <p className="text-2xl font-bold">{progress}%</p>
                </div>
                <ListTodo className="h-5 w-5 text-primary" />
              </div>
              <Progress value={progress} className="h-1.5 mt-2" />
              <p className="text-[10px] text-muted-foreground mt-1">{done}/{total} done</p>
            </CardContent>
          </Card>
          {[
            { label: "To Do", value: total - done - inProgress, icon: Circle, color: "text-muted-foreground", border: "border-l-slate-300" },
            { label: "In Progress", value: inProgress, icon: Clock, color: "text-warning", border: "border-l-amber-400" },
            { label: "High Priority", value: highPriority, icon: ArrowUpCircle, color: "text-danger", border: "border-l-red-400" },
            { label: "Overdue", value: overdue, icon: AlertTriangle, color: "text-danger", border: "border-l-red-500" },
          ].map((s) => (
            <Card key={s.label} className={cn("border-l-4", s.border)}>
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-xs text-muted-foreground">{s.label}</p>
                    <p className="text-2xl font-bold">{s.value}</p>
                  </div>
                  <s.icon className={cn("h-5 w-5", s.color)} />
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* Category Progress */}
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-semibold">Progress by Category</CardTitle>
          </CardHeader>
          <CardContent className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {statsByCategory.map((c) => {
              const Icon = c.icon;
              const pct = c.total > 0 ? Math.round((c.done / c.total) * 100) : 0;
              return (
                <button
                  key={c.key}
                  onClick={() => setFilterCategory(filterCategory === c.key ? "all" : c.key)}
                  className={cn(
                    "p-3 rounded-lg border text-left transition-all",
                    filterCategory === c.key ? c.color + " ring-2 ring-offset-1" : "hover:bg-muted/50"
                  )}
                >
                  <div className="flex items-center gap-2 mb-2">
                    <Icon className="h-4 w-4" />
                    <span className="text-xs font-semibold">{c.label}</span>
                  </div>
                  <Progress value={pct} className="h-1 mb-1" />
                  <p className="text-[10px] text-muted-foreground">{c.done}/{c.total} complete</p>
                </button>
              );
            })}
          </CardContent>
        </Card>

        {/* Filters */}
        <div className="flex flex-wrap gap-2 items-center">
          <div className="relative flex-1 min-w-[200px] max-w-sm">
            <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
            <Input placeholder="Search tasks..." value={search} onChange={(e) => setSearch(e.target.value)} className="pl-8 h-9 text-sm" />
          </div>
          <Select value={filterStatus} onValueChange={setFilterStatus}>
            <SelectTrigger className="w-[140px] h-9 text-sm"><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Status</SelectItem>
              {Object.entries(statusConfig).map(([k, v]) => <SelectItem key={k} value={k}>{v.label}</SelectItem>)}
            </SelectContent>
          </Select>
          <Select value={filterCategory} onValueChange={setFilterCategory}>
            <SelectTrigger className="w-[140px] h-9 text-sm"><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Categories</SelectItem>
              {Object.entries(categoryConfig).map(([k, v]) => <SelectItem key={k} value={k}>{v.label}</SelectItem>)}
            </SelectContent>
          </Select>
        </div>

        {/* Task List */}
        <div className="space-y-2">
          {isLoading ? (
            <p className="text-sm text-muted-foreground py-8 text-center">Loading...</p>
          ) : filtered.length === 0 ? (
            <p className="text-sm text-muted-foreground py-8 text-center">No tasks match your filters.</p>
          ) : (
            filtered.map((task) => {
              const cat = categoryConfig[task.category] || categoryConfig.general;
              const pri = priorityConfig[task.priority] || priorityConfig.medium;
              const sta = statusConfig[task.status] || statusConfig.todo;
              const CatIcon = cat.icon;
              const PriIcon = pri.icon;
              const StaIcon = sta.icon;
              const isOverdue = task.due_date && new Date(task.due_date) < new Date() && task.status !== "done";

              return (
                <Card key={task.id} className={cn("transition-all hover:shadow-sm", task.status === "done" && "opacity-60")}>
                  <CardContent className="p-4 flex items-start gap-3">
                    <button
                      onClick={() => statusToggle.mutate({ id: task.id, status: task.status })}
                      className="mt-0.5 shrink-0"
                    >
                      <StaIcon className={cn("h-5 w-5", task.status === "done" ? "text-success" : "text-muted-foreground hover:text-primary")} />
                    </button>

                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className={cn("text-sm font-medium", task.status === "done" && "line-through")}>{task.title}</span>
                        <Badge variant="outline" className={cn("text-[10px] px-1.5 py-0 h-4", cat.color)}>
                          <CatIcon className="h-3 w-3 mr-1" />{cat.label}
                        </Badge>
                        <PriIcon className={cn("h-3.5 w-3.5", pri.color)} />
                      </div>
                      {task.description && (
                        <p className="text-xs text-muted-foreground mt-1 line-clamp-2">{task.description}</p>
                      )}
                      <div className="flex items-center gap-3 mt-2 text-[10px] text-muted-foreground">
                        {task.due_date && (
                          <span className={cn("flex items-center gap-1", isOverdue && "text-danger font-semibold")}>
                            <Calendar className="h-3 w-3" />
                            {isOverdue ? "Overdue: " : "Due: "}{new Date(task.due_date).toLocaleDateString()}
                          </span>
                        )}
                        <Badge variant="outline" className={cn("text-[10px] px-1.5 py-0 h-4", sta.color)}>{sta.label}</Badge>
                      </div>
                    </div>

                    <div className="flex gap-1 shrink-0">
                      <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => openEdit(task)}>
                        <Pencil className="h-3.5 w-3.5" />
                      </Button>
                      <Button variant="ghost" size="icon" className="h-7 w-7 text-destructive" onClick={() => deleteMutation.mutate(task.id)}>
                        <Trash2 className="h-3.5 w-3.5" />
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              );
            })
          )}
        </div>
      </div>

      {/* Add/Edit Dialog */}
      <Dialog open={showForm} onOpenChange={(open) => { if (!open) resetForm(); else setShowForm(true); }}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>{editTask ? "Edit Task" : "New Task"}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <Input placeholder="Task title" value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} />
            <Textarea placeholder="Description (optional)" value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} rows={3} />
            <div className="grid grid-cols-3 gap-3">
              <Select value={form.category} onValueChange={(v) => setForm({ ...form, category: v })}>
                <SelectTrigger className="text-sm"><SelectValue placeholder="Category" /></SelectTrigger>
                <SelectContent>
                  {Object.entries(categoryConfig).map(([k, v]) => <SelectItem key={k} value={k}>{v.label}</SelectItem>)}
                </SelectContent>
              </Select>
              <Select value={form.priority} onValueChange={(v) => setForm({ ...form, priority: v })}>
                <SelectTrigger className="text-sm"><SelectValue placeholder="Priority" /></SelectTrigger>
                <SelectContent>
                  {Object.entries(priorityConfig).map(([k, v]) => <SelectItem key={k} value={k}>{v.label}</SelectItem>)}
                </SelectContent>
              </Select>
              <Select value={form.status} onValueChange={(v) => setForm({ ...form, status: v })}>
                <SelectTrigger className="text-sm"><SelectValue placeholder="Status" /></SelectTrigger>
                <SelectContent>
                  {Object.entries(statusConfig).map(([k, v]) => <SelectItem key={k} value={k}>{v.label}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
            <Input type="date" value={form.due_date} onChange={(e) => setForm({ ...form, due_date: e.target.value })} />
            <Textarea placeholder="Notes (optional)" value={form.notes} onChange={(e) => setForm({ ...form, notes: e.target.value })} rows={2} />
            <Button
              className="w-full"
              disabled={!form.title.trim()}
              onClick={() => upsertMutation.mutate({ ...(editTask ? { id: editTask.id } : {}), ...form })}
            >
              {editTask ? "Update Task" : "Create Task"}
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </AdminLayout>
  );
}
