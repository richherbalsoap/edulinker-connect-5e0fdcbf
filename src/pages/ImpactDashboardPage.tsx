import { useState, useEffect, useMemo, useRef } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useSchoolId } from "@/hooks/useSchoolId";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from "@/components/ui/sheet";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { Separator } from "@/components/ui/separator";
import { toast } from "sonner";
import {
  TrendingUp,
  TrendingDown,
  Minus,
  ChevronDown,
  Plus,
  Trash2,
  Pencil,
  Printer,
  BarChart3,
  Calendar,
  School,
  Target,
  FileText,
  Award,
} from "lucide-react";

// ─── Types ───
interface Baseline {
  id: string;
  school_id: string;
  category: string;
  metric_name: string;
  baseline_value: number;
  baseline_label: string | null;
  current_value: number;
  current_label: string | null;
  unit: string;
}

interface Milestone {
  id: string;
  school_id: string;
  title: string;
  date: string;
  icon: string;
}

// ─── Sample data shown when no real data exists ───
const SAMPLE_BASELINES: Omit<Baseline, "id" | "school_id">[] = [
  {
    category: "Results",
    metric_name: "Average Pass %",
    baseline_value: 68,
    current_value: 79,
    unit: "%",
    baseline_label: "Before EDULinker",
    current_label: "After EDULinker",
  },
  {
    category: "Fees",
    metric_name: "Fee Collection Rate",
    baseline_value: 72,
    current_value: 91,
    unit: "%",
    baseline_label: "Before EDULinker",
    current_label: "After EDULinker",
  },
  {
    category: "Attendance",
    metric_name: "Monthly Attendance Rate",
    baseline_value: 81,
    current_value: 88,
    unit: "%",
    baseline_label: "Before EDULinker",
    current_label: "After EDULinker",
  },
  {
    category: "Communication",
    metric_name: "Parent Notices Sent (per month)",
    baseline_value: 4,
    current_value: 22,
    unit: "count",
    baseline_label: "Before EDULinker",
    current_label: "After EDULinker",
  },
];

const SAMPLE_MILESTONES: Omit<Milestone, "id" | "school_id">[] = [
  { title: "EDULinker adopted", date: "2024-06-01", icon: "🚀" },
  { title: "First digital result published", date: "2024-07-15", icon: "📊" },
  { title: "100% fee collection achieved", date: "2024-09-01", icon: "💰" },
  { title: "Parent engagement doubled", date: "2025-01-10", icon: "👨‍👩‍👧" },
];

const CATEGORIES = ["Results", "Fees", "Attendance", "Communication", "Other"];

// ─── Animated counter hook ───
function useAnimatedCounter(target: number, duration = 1500) {
  const [value, setValue] = useState(0);
  const ref = useRef<number>();

  useEffect(() => {
    const start = performance.now();
    const animate = (now: number) => {
      const elapsed = now - start;
      const progress = Math.min(elapsed / duration, 1);
      // ease-out quad
      const eased = 1 - (1 - progress) * (1 - progress);
      setValue(Math.round(eased * target));
      if (progress < 1) ref.current = requestAnimationFrame(animate);
    };
    ref.current = requestAnimationFrame(animate);
    return () => {
      if (ref.current) cancelAnimationFrame(ref.current);
    };
  }, [target, duration]);

  return value;
}

// ─── Stat Card ───
function StatCard({
  icon: Icon,
  label,
  value,
  suffix = "",
}: {
  icon: React.ElementType;
  label: string;
  value: number;
  suffix?: string;
}) {
  const animated = useAnimatedCounter(value);
  return (
    <Card className="bg-card border-primary/20">
      <CardContent className="p-5 flex items-center gap-4">
        <div className="p-3 rounded-xl bg-primary/10">
          <Icon className="w-6 h-6 text-primary" />
        </div>
        <div>
          <p className="text-2xl font-bold text-foreground">
            {animated}
            {suffix}
          </p>
          <p className="text-xs text-muted-foreground">{label}</p>
        </div>
      </CardContent>
    </Card>
  );
}

// ─── Improvement badge ───
function ImprovementBadge({ before, after, unit }: { before: number; after: number; unit: string }) {
  if (before === after)
    return (
      <Badge className="bg-amber-500/20 text-amber-400 border-amber-500/30">
        <Minus className="w-3 h-3 mr-1" />
        No change
      </Badge>
    );
  let diff: number;
  if (unit === "%") {
    // Point difference for percentage metrics (81% → 88% = +7 points, not +8.6%)
    diff = Math.round(after - before);
  } else {
    // Relative % change for count/days, capped at 100
    if (before === 0) diff = after > 0 ? 100 : 0;
    else diff = Math.min(Math.round(((after - before) / before) * 100), 100);
  }
  if (diff > 0)
    return (
      <Badge className="bg-emerald-500/20 text-emerald-400 border-emerald-500/30">
        <TrendingUp className="w-3 h-3 mr-1" />+{diff}
        {unit === "%" ? " pts" : "%"} improved
      </Badge>
    );
  if (diff < 0)
    return (
      <Badge className="bg-red-500/20 text-red-400 border-red-500/30">
        <TrendingDown className="w-3 h-3 mr-1" />
        {diff}
        {unit === "%" ? " pts" : "%"} declined
      </Badge>
    );
  return (
    <Badge className="bg-amber-500/20 text-amber-400 border-amber-500/30">
      <Minus className="w-3 h-3 mr-1" />
      No change
    </Badge>
  );
}

// ─── Metric row ───
function MetricRow({
  m,
  onEdit,
  onDelete,
}: {
  m: Baseline & { isSample?: boolean };
  onEdit?: () => void;
  onDelete?: () => void;
}) {
  // For % unit: bars go 0-100 directly. For others: scale relative to max value.
  const isPercent = m.unit === "%";
  const maxVal = isPercent ? 100 : Math.max(m.baseline_value, m.current_value, 1);
  const beforePct = Math.min((m.baseline_value / maxVal) * 100, 100);
  const afterPct = Math.min((m.current_value / maxVal) * 100, 100);

  return (
    <div className="p-4 rounded-xl bg-muted/30 border border-primary/10 space-y-3">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <h4 className="font-semibold text-foreground text-sm">{m.metric_name}</h4>
          {(m as any).isSample && (
            <Badge variant="outline" className="text-[10px] text-muted-foreground border-muted-foreground/30">
              Sample
            </Badge>
          )}
        </div>
        <div className="flex items-center gap-2">
          <ImprovementBadge before={m.baseline_value} after={m.current_value} unit={m.unit} />
          {onEdit && (
            <Button variant="ghost" size="icon" className="h-7 w-7" onClick={onEdit}>
              <Pencil className="w-3 h-3" />
            </Button>
          )}
          {onDelete && (
            <Button variant="ghost" size="icon" className="h-7 w-7 text-destructive" onClick={onDelete}>
              <Trash2 className="w-3 h-3" />
            </Button>
          )}
        </div>
      </div>
      <div className="grid grid-cols-2 gap-4">
        <div>
          <p className="text-[10px] text-muted-foreground mb-1">{m.baseline_label || "Before"}</p>
          <div className="h-3 bg-muted rounded-full overflow-hidden">
            <div
              className="h-full bg-red-400/60 rounded-full transition-all duration-700"
              style={{ width: `${beforePct}%` }}
            />
          </div>
          <p className="text-xs font-medium text-foreground mt-1">
            {m.baseline_value} {m.unit}
          </p>
        </div>
        <div>
          <p className="text-[10px] text-muted-foreground mb-1">{m.current_label || "After"}</p>
          <div className="h-3 bg-muted rounded-full overflow-hidden">
            <div
              className="h-full bg-emerald-400/70 rounded-full transition-all duration-700"
              style={{ width: `${afterPct}%` }}
            />
          </div>
          <p className="text-xs font-medium text-foreground mt-1">
            {m.current_value} {m.unit}
          </p>
        </div>
      </div>
    </div>
  );
}

// ─── Main Page ───
const ImpactDashboardPage = () => {
  const schoolId = useSchoolId();
  const schoolName = localStorage.getItem("schoolName") || "My School";
  const [baselines, setBaselines] = useState<Baseline[]>([]);
  const [milestones, setMilestones] = useState<Milestone[]>([]);
  const [loading, setLoading] = useState(true);
  const [isSampleData, setIsSampleData] = useState(false);
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [reportOpen, setReportOpen] = useState(false);

  // Form state for add/edit metric
  const [editingMetric, setEditingMetric] = useState<Baseline | null>(null);
  const [formCat, setFormCat] = useState("Results");
  const [formName, setFormName] = useState("");
  const [formBefore, setFormBefore] = useState("");
  const [formAfter, setFormAfter] = useState("");
  const [formUnit, setFormUnit] = useState("%");
  const [formBeforeLabel, setFormBeforeLabel] = useState("");
  const [formAfterLabel, setFormAfterLabel] = useState("");

  // Milestone form
  const [msTitle, setMsTitle] = useState("");
  const [msDate, setMsDate] = useState("");
  const [msIcon, setMsIcon] = useState("🎯");

  // ─── Fetch data ───
  useEffect(() => {
    if (!schoolId) return;
    const load = async () => {
      setLoading(true);
      const [{ data: bl }, { data: ml }] = await Promise.all([
        supabase.from("impact_baselines").select("*").eq("school_id", schoolId).order("category"),
        supabase.from("impact_milestones").select("*").eq("school_id", schoolId).order("date"),
      ]);
      if (bl && bl.length > 0) {
        setBaselines(bl as unknown as Baseline[]);
        setIsSampleData(false);
      } else {
        setBaselines(SAMPLE_BASELINES.map((s, i) => ({ ...s, id: `sample-${i}`, school_id: schoolId })));
        setIsSampleData(true);
      }
      setMilestones(
        ml && ml.length > 0
          ? (ml as unknown as Milestone[])
          : SAMPLE_MILESTONES.map((s, i) => ({ ...s, id: `sample-ms-${i}`, school_id: schoolId })),
      );
      setLoading(false);
    };
    load();
  }, [schoolId]);

  // ─── Grouped metrics ───
  const grouped = useMemo(() => {
    const map: Record<string, (Baseline & { isSample?: boolean })[]> = {};
    baselines.forEach((b) => {
      if (!map[b.category]) map[b.category] = [];
      map[b.category].push({ ...b, isSample: isSampleData });
    });
    return map;
  }, [baselines, isSampleData]);

  // ─── Stats ───
  const overallImprovement = useMemo(() => {
    if (baselines.length === 0) return 0;
    const improvements = baselines.map((b) => {
      if (b.baseline_value === b.current_value) return 0;
      if (b.unit === "%") {
        // For percentage metrics: simple point difference, capped at 100
        const diff = b.current_value - b.baseline_value;
        return Math.min(Math.max(diff, -100), 100);
      } else {
        // For count/days/hours: % change but capped at 100 (we show improvement, not explosion)
        if (b.baseline_value === 0) return b.current_value > 0 ? 100 : 0;
        const pct = ((b.current_value - b.baseline_value) / b.baseline_value) * 100;
        return Math.min(Math.max(Math.round(pct), -100), 100);
      }
    });
    return Math.round(improvements.reduce((a, b) => a + b, 0) / improvements.length);
  }, [baselines]);

  const adoptionDate = useMemo(() => {
    if (milestones.length === 0) return null;
    const sorted = [...milestones].sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
    return sorted[0].date;
  }, [milestones]);

  const daysSinceAdoption = useMemo(() => {
    if (!adoptionDate) return 0;
    return Math.floor((Date.now() - new Date(adoptionDate).getTime()) / (1000 * 60 * 60 * 24));
  }, [adoptionDate]);

  // ─── CRUD operations ───
  const resetForm = () => {
    setEditingMetric(null);
    setFormCat("Results");
    setFormName("");
    setFormBefore("");
    setFormAfter("");
    setFormUnit("%");
    setFormBeforeLabel("");
    setFormAfterLabel("");
  };

  const openEditForm = (m: Baseline) => {
    setEditingMetric(m);
    setFormCat(m.category);
    setFormName(m.metric_name);
    setFormBefore(String(m.baseline_value));
    setFormAfter(String(m.current_value));
    setFormUnit(m.unit);
    setFormBeforeLabel(m.baseline_label || "");
    setFormAfterLabel(m.current_label || "");
    setDrawerOpen(true);
  };

  const saveMetric = async () => {
    if (!schoolId || !formName.trim()) {
      toast.error("Metric name is required");
      return;
    }
    const payload = {
      school_id: schoolId,
      category: formCat,
      metric_name: formName.trim(),
      baseline_value: Number(formBefore) || 0,
      current_value: Number(formAfter) || 0,
      unit: formUnit,
      baseline_label: formBeforeLabel || null,
      current_label: formAfterLabel || null,
      updated_at: new Date().toISOString(),
    };

    if (editingMetric && !editingMetric.id.startsWith("sample")) {
      const { error } = await supabase.from("impact_baselines").update(payload).eq("id", editingMetric.id);
      if (error) {
        toast.error("Failed to update");
        return;
      }
      toast.success("Metric updated");
    } else {
      const { error } = await supabase.from("impact_baselines").insert(payload);
      if (error) {
        toast.error("Failed to save");
        return;
      }
      toast.success("Metric added");
    }
    resetForm();
    setDrawerOpen(false);
    // Reload
    const { data } = await supabase.from("impact_baselines").select("*").eq("school_id", schoolId).order("category");
    if (data && data.length > 0) {
      setBaselines(data as unknown as Baseline[]);
      setIsSampleData(false);
    }
  };

  const deleteMetric = async (id: string) => {
    if (id.startsWith("sample")) {
      toast.info("Cannot delete sample data");
      return;
    }
    const { error } = await supabase.from("impact_baselines").delete().eq("id", id);
    if (error) {
      toast.error("Failed to delete");
      return;
    }
    toast.success("Metric deleted");
    setBaselines((prev) => prev.filter((b) => b.id !== id));
  };

  const addMilestone = async () => {
    if (!schoolId || !msTitle.trim() || !msDate) {
      toast.error("Title and date required");
      return;
    }
    const { error } = await supabase
      .from("impact_milestones")
      .insert({ school_id: schoolId, title: msTitle.trim(), date: msDate, icon: msIcon || "🎯" });
    if (error) {
      toast.error("Failed to add");
      return;
    }
    toast.success("Milestone added");
    setMsTitle("");
    setMsDate("");
    setMsIcon("🎯");
    const { data } = await supabase.from("impact_milestones").select("*").eq("school_id", schoolId).order("date");
    if (data) setMilestones(data as unknown as Milestone[]);
  };

  const deleteMilestone = async (id: string) => {
    if (id.startsWith("sample")) {
      toast.info("Cannot delete sample data");
      return;
    }
    const { error } = await supabase.from("impact_milestones").delete().eq("id", id);
    if (error) {
      toast.error("Failed to delete");
      return;
    }
    toast.success("Milestone deleted");
    setMilestones((prev) => prev.filter((m) => m.id !== id));
  };

  if (loading)
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin w-8 h-8 border-2 border-primary border-t-transparent rounded-full" />
      </div>
    );

  return (
    <div className="space-y-6 pb-10">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div>
          <h1 className="text-xl font-bold text-foreground flex items-center gap-2">
            <Award className="w-6 h-6 text-primary" /> School Impact Dashboard
          </h1>
          <p className="text-xs text-muted-foreground mt-1">Measurable improvements since adopting EDULinker</p>
          {isSampleData && (
            <Badge variant="outline" className="mt-2 text-amber-400 border-amber-400/30">
              Showing Sample Data — Add your own metrics
            </Badge>
          )}
        </div>
        <div className="flex gap-2">
          <Sheet open={drawerOpen} onOpenChange={setDrawerOpen}>
            <SheetTrigger asChild>
              <Button size="sm" onClick={resetForm}>
                <Plus className="w-4 h-4 mr-1" /> Update Metrics
              </Button>
            </SheetTrigger>
            <SheetContent className="overflow-y-auto">
              <SheetHeader>
                <SheetTitle>{editingMetric ? "Edit Metric" : "Add New Metric"}</SheetTitle>
              </SheetHeader>
              <div className="space-y-4 mt-6">
                <div>
                  <Label>Category</Label>
                  <Select value={formCat} onValueChange={setFormCat}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {CATEGORIES.map((c) => (
                        <SelectItem key={c} value={c}>
                          {c}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label>Metric Name</Label>
                  <Input
                    value={formName}
                    onChange={(e) => setFormName(e.target.value)}
                    placeholder="e.g. Average Pass %"
                  />
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <Label>Before Value</Label>
                    <Input type="number" value={formBefore} onChange={(e) => setFormBefore(e.target.value)} />
                  </div>
                  <div>
                    <Label>After Value</Label>
                    <Input type="number" value={formAfter} onChange={(e) => setFormAfter(e.target.value)} />
                  </div>
                </div>
                <div>
                  <Label>Unit</Label>
                  <Select value={formUnit} onValueChange={setFormUnit}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="%">%</SelectItem>
                      <SelectItem value="count">count</SelectItem>
                      <SelectItem value="days">days</SelectItem>
                      <SelectItem value="hours">hours</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label>Before Label (optional)</Label>
                  <Input
                    value={formBeforeLabel}
                    onChange={(e) => setFormBeforeLabel(e.target.value)}
                    placeholder="e.g. Before EDULinker (2023-24)"
                  />
                </div>
                <div>
                  <Label>After Label (optional)</Label>
                  <Input
                    value={formAfterLabel}
                    onChange={(e) => setFormAfterLabel(e.target.value)}
                    placeholder="e.g. After EDULinker (2024-25)"
                  />
                </div>
                <Button className="w-full" onClick={saveMetric}>
                  {editingMetric ? "Update Metric" : "Add Metric"}
                </Button>
              </div>
            </SheetContent>
          </Sheet>

          <Dialog open={reportOpen} onOpenChange={setReportOpen}>
            <DialogTrigger asChild>
              <Button size="sm" variant="outline">
                <FileText className="w-4 h-4 mr-1" /> Generate Report
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto print:shadow-none">
              <DialogHeader>
                <DialogTitle>Impact Report — {schoolName}</DialogTitle>
              </DialogHeader>
              <div id="impact-report" className="space-y-4 text-foreground">
                <p className="text-xs text-muted-foreground">Generated on {new Date().toLocaleDateString()}</p>
                <Separator />
                <div className="grid grid-cols-2 gap-3 text-sm">
                  <div>
                    <strong>Overall Improvement:</strong> {overallImprovement}%
                  </div>
                  <div>
                    <strong>Metrics Tracked:</strong> {baselines.length}
                  </div>
                  <div>
                    <strong>Days Since Adoption:</strong> {daysSinceAdoption}
                  </div>
                </div>
                <Separator />
                <h3 className="font-semibold text-sm">Metrics Detail</h3>
                <table className="w-full text-xs border">
                  <thead>
                    <tr className="border-b bg-muted/50">
                      <th className="p-2 text-left">Metric</th>
                      <th className="p-2 text-left">Category</th>
                      <th className="p-2 text-right">Before</th>
                      <th className="p-2 text-right">After</th>
                      <th className="p-2 text-right">Change</th>
                    </tr>
                  </thead>
                  <tbody>
                    {baselines.map((b) => {
                      let change: string;
                      if (b.unit === "%") {
                        const diff = Math.round(b.current_value - b.baseline_value);
                        change = (diff > 0 ? "+" : "") + diff + " pts";
                      } else {
                        if (b.baseline_value === 0) change = b.current_value > 0 ? "+100%" : "0%";
                        else {
                          const pct = Math.min(
                            Math.round(((b.current_value - b.baseline_value) / b.baseline_value) * 100),
                            100,
                          );
                          change = (pct > 0 ? "+" : "") + pct + "%";
                        }
                      }
                      return (
                        <tr key={b.id} className="border-b">
                          <td className="p-2">{b.metric_name}</td>
                          <td className="p-2">{b.category}</td>
                          <td className="p-2 text-right">
                            {b.baseline_value} {b.unit}
                          </td>
                          <td className="p-2 text-right">
                            {b.current_value} {b.unit}
                          </td>
                          <td className="p-2 text-right">{change}</td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
                <Separator />
                <h3 className="font-semibold text-sm">Milestones</h3>
                <ul className="text-xs space-y-1">
                  {milestones.map((m) => (
                    <li key={m.id}>
                      {m.icon} {m.date} — {m.title}
                    </li>
                  ))}
                </ul>
              </div>
              <Button className="mt-4" onClick={() => window.print()}>
                <Printer className="w-4 h-4 mr-1" /> Print Report
              </Button>
            </DialogContent>
          </Dialog>
        </div>
      </div>

      {/* Hero Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        <StatCard icon={TrendingUp} label="Overall Improvement" value={overallImprovement} suffix="%" />
        <StatCard icon={BarChart3} label="Metrics Tracked" value={baselines.length} />
        <StatCard icon={Calendar} label="Days Since Adoption" value={daysSinceAdoption} />
        <Card className="bg-card border-primary/20">
          <CardContent className="p-5 flex items-center gap-4">
            <div className="p-3 rounded-xl bg-primary/10">
              <School className="w-6 h-6 text-primary" />
            </div>
            <div>
              <p className="text-sm font-bold text-foreground truncate">{schoolName}</p>
              <p className="text-[10px] text-muted-foreground">
                {adoptionDate ? `Since ${new Date(adoptionDate).toLocaleDateString()}` : "No adoption date set"}
              </p>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Metrics by Category */}
      <div className="space-y-4">
        <h2 className="text-lg font-bold text-foreground flex items-center gap-2">
          <Target className="w-5 h-5 text-primary" /> Performance Metrics
        </h2>
        {Object.entries(grouped).map(([cat, items]) => (
          <Collapsible key={cat} defaultOpen>
            <CollapsibleTrigger className="w-full flex items-center justify-between p-3 rounded-lg bg-muted/30 border border-primary/10 hover:bg-muted/50 transition-colors">
              <span className="font-semibold text-sm text-foreground">
                {cat} <span className="text-muted-foreground font-normal">({items.length})</span>
              </span>
              <ChevronDown className="w-4 h-4 text-muted-foreground transition-transform duration-200" />
            </CollapsibleTrigger>
            <CollapsibleContent className="space-y-2 mt-2">
              {items.map((m) => (
                <MetricRow
                  key={m.id}
                  m={m}
                  onEdit={m.isSample ? undefined : () => openEditForm(m)}
                  onDelete={m.isSample ? undefined : () => deleteMetric(m.id)}
                />
              ))}
            </CollapsibleContent>
          </Collapsible>
        ))}
      </div>

      {/* Milestones Timeline */}
      <div className="space-y-4">
        <h2 className="text-lg font-bold text-foreground flex items-center gap-2">
          <Calendar className="w-5 h-5 text-primary" /> Milestones Timeline
        </h2>
        <div className="relative border-l-2 border-primary/20 ml-4 space-y-6 pl-6">
          {milestones.map((m) => (
            <div key={m.id} className="relative">
              <div className="absolute -left-[33px] top-0 w-5 h-5 rounded-full bg-primary/20 border-2 border-primary flex items-center justify-center text-[10px]">
                {m.icon}
              </div>
              <div className="flex items-start justify-between">
                <div>
                  <p className="text-sm font-medium text-foreground">{m.title}</p>
                  <p className="text-xs text-muted-foreground">{new Date(m.date).toLocaleDateString()}</p>
                </div>
                {!m.id.startsWith("sample") && (
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-7 w-7 text-destructive"
                    onClick={() => deleteMilestone(m.id)}
                  >
                    <Trash2 className="w-3 h-3" />
                  </Button>
                )}
              </div>
            </div>
          ))}
        </div>

        {/* Add milestone inline */}
        <Card className="bg-muted/20 border-primary/10">
          <CardContent className="p-4">
            <p className="text-xs font-semibold text-muted-foreground mb-3">ADD MILESTONE</p>
            <div className="flex flex-col sm:flex-row gap-2">
              <Input
                placeholder="Icon (emoji)"
                value={msIcon}
                onChange={(e) => setMsIcon(e.target.value)}
                className="w-16"
              />
              <Input
                placeholder="Milestone title"
                value={msTitle}
                onChange={(e) => setMsTitle(e.target.value)}
                className="flex-1"
              />
              <Input type="date" value={msDate} onChange={(e) => setMsDate(e.target.value)} className="w-40" />
              <Button size="sm" onClick={addMilestone}>
                <Plus className="w-4 h-4 mr-1" /> Add
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default ImpactDashboardPage;
