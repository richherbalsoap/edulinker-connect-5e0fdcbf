import { useState, useEffect, useMemo, useRef } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useSchoolId } from "@/hooks/useSchoolId";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
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
  Printer,
  BarChart3,
  Calendar,
  School,
  Target,
  FileText,
  RefreshCw,
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

interface AutoMetric {
  metric_category: string;
  metric_name: string;
  current_value: number;
  unit: string;
}

const CATEGORIES = ["Results", "Fees", "Attendance", "Communication", "Students", "Other"];

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
    // Point difference for percentage metrics
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
function MetricRow({ m, onDelete }: { m: Baseline; onDelete?: () => void }) {
  const isPercent = m.unit === "%";
  const maxVal = isPercent ? 100 : Math.max(m.baseline_value, m.current_value, 1);
  const beforePct = Math.min((m.baseline_value / maxVal) * 100, 100);
  const afterPct = Math.min((m.current_value / maxVal) * 100, 100);

  return (
    <div className="p-4 rounded-xl bg-muted/30 border border-primary/10 space-y-3">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <p className="text-sm font-semibold text-foreground">{m.metric_name}</p>
          <ImprovementBadge before={m.baseline_value} after={m.current_value} unit={m.unit} />
        </div>
        {onDelete && (
          <Button variant="ghost" size="icon" className="h-7 w-7 text-destructive" onClick={onDelete}>
            <Trash2 className="w-3 h-3" />
          </Button>
        )}
      </div>
      <div className="grid grid-cols-2 gap-4 text-xs">
        <div>
          <p className="text-muted-foreground mb-1">{m.baseline_label || "Before"}</p>
          <div className="flex items-center gap-2">
            <div className="flex-1 bg-muted rounded-full h-2 overflow-hidden">
              <div className="h-full bg-red-500/40 transition-all duration-700" style={{ width: `${beforePct}%` }} />
            </div>
            <span className="font-semibold text-foreground w-12 text-right">
              {m.baseline_value}
              {m.unit}
            </span>
          </div>
        </div>
        <div>
          <p className="text-muted-foreground mb-1">{m.current_label || "Current"}</p>
          <div className="flex items-center gap-2">
            <div className="flex-1 bg-muted rounded-full h-2 overflow-hidden">
              <div className="h-full bg-primary transition-all duration-700" style={{ width: `${afterPct}%` }} />
            </div>
            <span className="font-semibold text-foreground w-12 text-right">
              {m.current_value}
              {m.unit}
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}

// ─── Main Component ───
export const ImpactDashboardPage = () => {
  const schoolId = useSchoolId();
  const [baselines, setBaselines] = useState<Baseline[]>([]);
  const [milestones, setMilestones] = useState<Milestone[]>([]);
  const [schoolName, setSchoolName] = useState("");
  const [adoptionDate, setAdoptionDate] = useState<string | null>(null);
  const [reportOpen, setReportOpen] = useState(false);
  const [loading, setLoading] = useState(true);

  // Milestone form state
  const [msTitle, setMsTitle] = useState("");
  const [msDate, setMsDate] = useState(new Date().toISOString().split("T")[0]);
  const [msIcon, setMsIcon] = useState("🎯");

  // Fetch school info
  useEffect(() => {
    if (!schoolId) return;
    supabase
      .from("schools")
      .select("school_name, created_at")
      .eq("id", schoolId)
      .single()
      .then(({ data }) => {
        if (data) {
          setSchoolName(data.school_name || "Your School");
          setAdoptionDate(data.created_at || null);
        }
      });
  }, [schoolId]);

  // Fetch baselines and milestones
  const fetchData = async () => {
    if (!schoolId) return;
    setLoading(true);

    // Fetch existing baselines
    const { data: baselineData } = await supabase
      .from("impact_baselines")
      .select("*")
      .eq("school_id", schoolId)
      .order("created_at", { ascending: false });

    setBaselines(baselineData || []);

    // Fetch milestones
    const { data: milestoneData } = await supabase
      .from("impact_milestones")
      .select("*")
      .eq("school_id", schoolId)
      .order("date", { ascending: true });

    setMilestones(milestoneData || []);
    setLoading(false);
  };

  useEffect(() => {
    fetchData();
  }, [schoolId]);

  // Auto-refresh current values from real data
  const refreshCurrentMetrics = async () => {
    if (!schoolId) return;

    try {
      toast.loading("Refreshing metrics from real data...");

      // Call the calculate function
      const { data: autoMetrics, error } = (await supabase.rpc("calculate_impact_metrics", {
        p_school_id: schoolId,
      })) as { data: AutoMetric[] | null; error: any };

      if (error) throw error;

      if (!autoMetrics || autoMetrics.length === 0) {
        toast.error("No data available yet. Add some results, students, or announcements first!");
        return;
      }

      // Update existing baselines with current values OR create new ones if they don't exist
      for (const metric of autoMetrics) {
        // Find if this metric already exists
        const existing = baselines.find(
          (b) => b.metric_name === metric.metric_name && b.category === metric.metric_category,
        );

        if (existing) {
          // Update current value only
          const { error: updateError } = await supabase
            .from("impact_baselines")
            .update({
              current_value: metric.current_value,
              updated_at: new Date().toISOString(),
            })
            .eq("id", existing.id);

          if (updateError) throw updateError;
        } else {
          // Create new baseline with current value, baseline_value starts at 0
          const { error: insertError } = await supabase.from("impact_baselines").insert({
            school_id: schoolId,
            category: metric.metric_category,
            metric_name: metric.metric_name,
            baseline_value: 0,
            current_value: metric.current_value,
            unit: metric.unit,
            baseline_label: "Start",
            current_label: "Current",
          });

          if (insertError) throw insertError;
        }
      }

      await fetchData();
      toast.success("Metrics refreshed successfully!");
    } catch (err: any) {
      console.error("Error refreshing metrics:", err);
      toast.error(err.message || "Failed to refresh metrics");
    }
  };

  const deleteMetric = async (id: string) => {
    const { error } = await supabase.from("impact_baselines").delete().eq("id", id);
    if (error) {
      toast.error(error.message);
    } else {
      toast.success("Metric deleted");
      fetchData();
    }
  };

  const addMilestone = async () => {
    if (!schoolId || !msTitle.trim()) {
      toast.error("Title is required");
      return;
    }
    const { error } = await supabase.from("impact_milestones").insert({
      school_id: schoolId,
      title: msTitle.trim(),
      date: msDate,
      icon: msIcon || "🎯",
    });
    if (error) {
      toast.error(error.message);
    } else {
      toast.success("Milestone added!");
      setMsTitle("");
      setMsDate(new Date().toISOString().split("T")[0]);
      setMsIcon("🎯");
      fetchData();
    }
  };

  const deleteMilestone = async (id: string) => {
    const { error } = await supabase.from("impact_milestones").delete().eq("id", id);
    if (error) {
      toast.error(error.message);
    } else {
      toast.success("Milestone deleted");
      fetchData();
    }
  };

  // Group by category
  const grouped = useMemo(() => {
    const groups: Record<string, Baseline[]> = {};
    baselines.forEach((b) => {
      if (!groups[b.category]) groups[b.category] = [];
      groups[b.category].push(b);
    });
    return groups;
  }, [baselines]);

  // Overall improvement
  const overallImprovement = useMemo(() => {
    if (baselines.length === 0) return 0;
    let totalImprovement = 0;
    baselines.forEach((b) => {
      if (b.unit === "%") {
        totalImprovement += b.current_value - b.baseline_value;
      } else {
        if (b.baseline_value === 0) {
          totalImprovement += b.current_value > 0 ? 100 : 0;
        } else {
          totalImprovement += Math.min(((b.current_value - b.baseline_value) / b.baseline_value) * 100, 100);
        }
      }
    });
    return Math.round(totalImprovement / baselines.length);
  }, [baselines]);

  const daysSinceAdoption = useMemo(() => {
    if (!adoptionDate) return 0;
    const diff = Date.now() - new Date(adoptionDate).getTime();
    return Math.floor(diff / (1000 * 60 * 60 * 24));
  }, [adoptionDate]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <RefreshCw className="w-8 h-8 animate-spin mx-auto mb-2 text-primary" />
          <p className="text-sm text-muted-foreground">Loading impact data...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto p-4 space-y-6 max-w-6xl">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-foreground flex items-center gap-2">📊 Impact Dashboard</h1>
          <p className="text-sm text-muted-foreground mt-1">Track your school's transformation with EDULinker</p>
        </div>
        <div className="flex items-center gap-2">
          <Button size="sm" variant="outline" onClick={refreshCurrentMetrics}>
            <RefreshCw className="w-4 h-4 mr-1" /> Refresh Metrics
          </Button>
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

      {/* Empty state */}
      {baselines.length === 0 && (
        <Card className="border-dashed border-2 border-primary/20">
          <CardContent className="p-8 text-center">
            <BarChart3 className="w-12 h-12 mx-auto mb-4 text-muted-foreground" />
            <h3 className="text-lg font-semibold mb-2">No metrics yet</h3>
            <p className="text-sm text-muted-foreground mb-4">
              Click "Refresh Metrics" to automatically calculate your school's performance from real data
            </p>
            <Button onClick={refreshCurrentMetrics}>
              <RefreshCw className="w-4 h-4 mr-2" />
              Refresh Metrics Now
            </Button>
          </CardContent>
        </Card>
      )}

      {/* Metrics by Category */}
      {baselines.length > 0 && (
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
                  <MetricRow key={m.id} m={m} onDelete={() => deleteMetric(m.id)} />
                ))}
              </CollapsibleContent>
            </Collapsible>
          ))}
        </div>
      )}

      {/* Milestones Timeline */}
      <div className="space-y-4">
        <h2 className="text-lg font-bold text-foreground flex items-center gap-2">
          <Calendar className="w-5 h-5 text-primary" /> Milestones Timeline
        </h2>
        {milestones.length > 0 && (
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
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-7 w-7 text-destructive"
                    onClick={() => deleteMilestone(m.id)}
                  >
                    <Trash2 className="w-3 h-3" />
                  </Button>
                </div>
              </div>
            ))}
          </div>
        )}

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
