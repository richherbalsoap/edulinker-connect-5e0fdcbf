import { useMemo, useEffect, useState, useCallback } from "react";
import {
  TrendingUp,
  TrendingDown,
  Users,
  BookOpen,
  Award,
  Filter,
  Trophy,
  Info,
  ArrowUp,
  ArrowDown,
  Minus,
  BarChart3,
  RefreshCw,
} from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useSchoolId } from "@/hooks/useSchoolId";
import {
  RadarChart,
  Radar,
  PolarGrid,
  PolarAngleAxis,
  PolarRadiusAxis,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Cell,
} from "recharts";

// ── Types ──────────────────────────────────────────────────────────────────
interface ResultRow {
  id: string;
  student_id: string;
  subject: string;
  marks_obtained: number;
  total_marks: number;
  exam_name: string | null;
  is_deleted: boolean;
  created_at: string;
  school_id: string;
  student: {
    name: string;
    standard: string;
    section: string;
  } | null;
}

interface StudentRow {
  id: string;
  name: string;
  standard: string;
  section: string;
}

// ── Grade scale ────────────────────────────────────────────────────────────
const GRADE_SCALE = [
  {
    min: 90,
    grade: "A+",
    label: "90–100%",
    desc: "Excellent",
    color: "#22c55e",
    bg: "bg-green-500/15",
    border: "border-green-500/30",
    text: "text-green-400",
  },
  {
    min: 75,
    grade: "A",
    label: "75–89%",
    desc: "Very Good",
    color: "#4ade80",
    bg: "bg-green-500/10",
    border: "border-green-400/25",
    text: "text-green-400",
  },
  {
    min: 60,
    grade: "B",
    label: "60–74%",
    desc: "Good",
    color: "#3b82f6",
    bg: "bg-blue-500/15",
    border: "border-blue-500/30",
    text: "text-blue-400",
  },
  {
    min: 50,
    grade: "C",
    label: "50–59%",
    desc: "Average",
    color: "#eab308",
    bg: "bg-yellow-500/15",
    border: "border-yellow-500/30",
    text: "text-yellow-400",
  },
  {
    min: 35,
    grade: "D",
    label: "35–49%",
    desc: "Below Avg",
    color: "#f97316",
    bg: "bg-orange-500/15",
    border: "border-orange-500/30",
    text: "text-orange-400",
  },
  {
    min: 0,
    grade: "F",
    label: "0–34%",
    desc: "Fail",
    color: "#ef4444",
    bg: "bg-red-500/15",
    border: "border-red-500/30",
    text: "text-red-400",
  },
];
const getGrade = (p: number) => GRADE_SCALE.find((g) => p >= g.min) ?? GRADE_SCALE[GRADE_SCALE.length - 1];
const pctColor = (p: number) => getGrade(p).color;

// ── Constants ──────────────────────────────────────────────────────────────
const EXAM_ORDER = ["Weekly Test", "Unit Test", "Mid Term", "Final Exam"];
const SUBJECT_COLORS = [
  "#3b82f6",
  "#22c55e",
  "#a855f7",
  "#eab308",
  "#ec4899",
  "#06b6d4",
  "#ef4444",
  "#6366f1",
  "#f97316",
  "#14b8a6",
];
const STANDARDS = ["Nursery", "LKG", "UKG", "1", "2", "3", "4", "5", "6", "7", "8", "9", "10", "11", "12"];
const SECTIONS = ["A", "B", "C", "D", "E"];
const TIME_RANGES = [
  { label: "Last 7 Days", value: "7d" },
  { label: "Last 1 Month", value: "1m" },
  { label: "Last 3 Months", value: "3m" },
  { label: "Last 6 Months", value: "6m" },
  { label: "Last 1 Year", value: "1y" },
  { label: "Overall", value: "all" },
];

const getStartDate = (range: string): string | null => {
  const now = new Date();
  if (range === "7d") {
    now.setDate(now.getDate() - 7);
    return now.toISOString();
  }
  if (range === "1m") {
    now.setMonth(now.getMonth() - 1);
    return now.toISOString();
  }
  if (range === "3m") {
    now.setMonth(now.getMonth() - 3);
    return now.toISOString();
  }
  if (range === "6m") {
    now.setMonth(now.getMonth() - 6);
    return now.toISOString();
  }
  if (range === "1y") {
    now.setFullYear(now.getFullYear() - 1);
    return now.toISOString();
  }
  return null;
};

const weightedPct = (items: ResultRow[]) => {
  const ob = items.reduce((s, r) => s + Number(r.marks_obtained), 0);
  const tot = items.reduce((s, r) => s + Number(r.total_marks), 0);
  return tot > 0 ? Math.round((ob / tot) * 10000) / 100 : 0;
};

// ── Custom bar tooltip ─────────────────────────────────────────────────────
const BarTooltip = ({ active, payload, label }: any) => {
  if (!active || !payload?.length) return null;
  const p = payload[0].value as number;
  const g = getGrade(p);
  return (
    <div className="bg-[#0a0a0a] border border-white/10 rounded-lg px-3 py-2 text-sm shadow-xl">
      <p className="text-white/60 mb-1">{label}</p>
      <div className="flex items-center gap-2">
        <span className="text-white font-bold">{p}%</span>
        <span className={`text-xs px-1.5 py-0.5 rounded border font-bold ${g.bg} ${g.border} ${g.text}`}>
          {g.grade}
        </span>
      </div>
    </div>
  );
};

// ── Trend Table ────────────────────────────────────────────────────────────
const TrendTable = ({ results }: { results: ResultRow[] }) => {
  const subjects = useMemo(() => [...new Set(results.map((r) => r.subject))], [results]);

  const exams = useMemo(() => {
    const present = [...new Set(results.map((r) => r.exam_name ?? "Others"))] as string[];
    return present.sort((a, b) => {
      const ai = EXAM_ORDER.indexOf(a),
        bi = EXAM_ORDER.indexOf(b);
      if (ai === -1 && bi === -1) return a.localeCompare(b);
      if (ai === -1) return 1;
      if (bi === -1) return -1;
      return ai - bi;
    });
  }, [results]);

  const scoreMap = useMemo(() => {
    const m: Record<string, Record<string, { ob: number; tot: number }>> = {};
    results.forEach((r) => {
      const ex = r.exam_name ?? "Others";
      if (!m[r.subject]) m[r.subject] = {};
      if (!m[r.subject][ex]) m[r.subject][ex] = { ob: 0, tot: 0 };
      m[r.subject][ex].ob += Number(r.marks_obtained);
      m[r.subject][ex].tot += Number(r.total_marks);
    });
    return m;
  }, [results]);

  if (exams.length < 2) return null;

  return (
    <div className="bg-black/30 backdrop-blur-md border border-primary/20 rounded-xl p-4 sm:p-6">
      <h2 className="text-base font-semibold text-primary mb-1">Performance Trend</h2>
      <p className="text-foreground/35 text-xs mb-4">
        Subject score per exam. <span className="text-green-400 font-semibold">Trend</span> = first → last exam change.
      </p>
      <div className="overflow-x-auto">
        <table className="w-full min-w-[360px]">
          <thead>
            <tr className="border-b border-white/10">
              <th className="text-left text-foreground/40 text-xs font-semibold pb-3 pr-4">Subject</th>
              {exams.map((ex) => (
                <th key={ex} className="text-center text-foreground/40 text-xs font-semibold pb-3 px-2 min-w-[75px]">
                  {ex}
                </th>
              ))}
              <th className="text-center text-foreground/40 text-xs font-semibold pb-3 px-2">Trend</th>
            </tr>
          </thead>
          <tbody>
            {subjects.map((subj, si) => {
              const scores = exams.map((ex) => {
                const d = scoreMap[subj]?.[ex];
                return d && d.tot > 0 ? Math.round((d.ob / d.tot) * 10000) / 100 : null;
              });
              const nonNull = scores.filter((s): s is number => s !== null);
              const diff =
                nonNull.length >= 2 ? Math.round((nonNull[nonNull.length - 1] - nonNull[0]) * 10) / 10 : null;

              return (
                <tr key={subj} className="border-b border-white/5 last:border-0">
                  <td className="py-3 pr-4">
                    <div className="flex items-center gap-2">
                      <span
                        className="w-2 h-2 rounded-full shrink-0"
                        style={{ background: SUBJECT_COLORS[si % SUBJECT_COLORS.length] }}
                      />
                      <span className="text-foreground/75 text-xs sm:text-sm font-medium">{subj}</span>
                    </div>
                  </td>
                  {scores.map((score, ei) =>
                    score === null ? (
                      <td key={ei} className="py-3 px-2 text-center">
                        <span className="text-foreground/20 text-xs">—</span>
                      </td>
                    ) : (
                      <td key={ei} className="py-3 px-2 text-center">
                        <div className="inline-flex flex-col items-center gap-0.5">
                          <span className={`text-sm font-bold ${getGrade(score).text}`}>{score}%</span>
                          <span
                            className={`text-[10px] px-1 rounded border font-bold ${getGrade(score).bg} ${getGrade(score).border} ${getGrade(score).text}`}
                          >
                            {getGrade(score).grade}
                          </span>
                        </div>
                      </td>
                    ),
                  )}
                  <td className="py-3 px-2 text-center">
                    {diff === null ? (
                      <span className="text-foreground/20 text-xs">—</span>
                    ) : diff > 0 ? (
                      <div className="inline-flex flex-col items-center gap-0.5">
                        <ArrowUp size={13} className="text-green-400" />
                        <span className="text-green-400 text-[10px] font-bold">+{diff}%</span>
                      </div>
                    ) : diff < 0 ? (
                      <div className="inline-flex flex-col items-center gap-0.5">
                        <ArrowDown size={13} className="text-red-400" />
                        <span className="text-red-400 text-[10px] font-bold">{diff}%</span>
                      </div>
                    ) : (
                      <div className="inline-flex flex-col items-center gap-0.5">
                        <Minus size={13} className="text-foreground/30" />
                        <span className="text-foreground/30 text-[10px]">Same</span>
                      </div>
                    )}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
};

// ── Main Page ──────────────────────────────────────────────────────────────
const AnalyticsPage = () => {
  const schoolId = useSchoolId();

  const [allResults, setAllResults] = useState<ResultRow[]>([]);
  const [allStudents, setAllStudents] = useState<StudentRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [filterStandard, setFilterStandard] = useState("");
  const [filterSection, setFilterSection] = useState("");
  const [filterStudentId, setFilterStudentId] = useState("");
  const [filterExamName, setFilterExamName] = useState("");
  const [timeRange, setTimeRange] = useState("all");
  const [showGradeInfo, setShowGradeInfo] = useState(false);

  // ── Fetch with student join ────────────────────────────────────────────
  const fetchData = useCallback(async () => {
    if (!schoolId) return;
    setLoading(true);
    setError(null);
    try {
      const { data: resultsData, error: resultsErr } = await supabase
        .from("results")
        .select(
          `
          id,
          student_id,
          subject,
          marks_obtained,
          total_marks,
          exam_name,
          is_deleted,
          created_at,
          school_id,
          student:students (
            name,
            standard,
            section
          )
        `,
        )
        .eq("school_id", schoolId)
        .eq("is_deleted", false)
        .order("created_at", { ascending: true });

      if (resultsErr) throw resultsErr;

      const { data: studentsData, error: studentsErr } = await supabase
        .from("students")
        .select("id, name, standard, section")
        .eq("school_id", schoolId)
        .order("name", { ascending: true });

      if (studentsErr) throw studentsErr;

      setAllResults((resultsData as unknown as ResultRow[]) ?? []);
      setAllStudents((studentsData as StudentRow[]) ?? []);
    } catch (err: any) {
      console.error("AnalyticsPage fetch error:", err);
      setError("Failed to load data. Please try again.");
    } finally {
      setLoading(false);
    }
  }, [schoolId]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);
  useEffect(() => {
    setFilterStudentId("");
  }, [filterStandard, filterSection]);

  // ── Student dropdown (scoped to standard/section filter) ──────────────
  const studentOptions = useMemo(
    () =>
      allStudents.filter((s) => {
        if (filterStandard && s.standard !== filterStandard) return false;
        if (filterSection && s.section !== filterSection) return false;
        return true;
      }),
    [allStudents, filterStandard, filterSection],
  );

  // ── Exam types from actual DB data ────────────────────────────────────
  const availableExamTypes = useMemo(() => {
    const names = [...new Set(allResults.map((r) => r.exam_name).filter((n): n is string => !!n))].sort((a, b) => {
      const ai = EXAM_ORDER.indexOf(a),
        bi = EXAM_ORDER.indexOf(b);
      if (ai === -1 && bi === -1) return a.localeCompare(b);
      if (ai === -1) return 1;
      if (bi === -1) return -1;
      return ai - bi;
    });
    return names;
  }, [allResults]);

  // ── Client-side filter ────────────────────────────────────────────────
  const filteredResults = useMemo(() => {
    const startDate = getStartDate(timeRange);
    return allResults.filter((r) => {
      if (startDate && r.created_at < startDate) return false;
      if (filterStudentId && r.student_id !== filterStudentId) return false;
      if (filterStandard && r.student?.standard !== filterStandard) return false;
      if (filterSection && r.student?.section !== filterSection) return false;
      if (filterExamName && r.exam_name !== filterExamName) return false;
      return true;
    });
  }, [allResults, filterStandard, filterSection, filterStudentId, filterExamName, timeRange]);

  // ── Derived metrics ────────────────────────────────────────────────────
  const subjectPerformance = useMemo(() => {
    const map: Record<string, { ob: number; tot: number; count: number }> = {};
    filteredResults.forEach((r) => {
      if (!map[r.subject]) map[r.subject] = { ob: 0, tot: 0, count: 0 };
      map[r.subject].ob += Number(r.marks_obtained);
      map[r.subject].tot += Number(r.total_marks);
      map[r.subject].count += 1;
    });
    return Object.entries(map)
      .map(([subject, d], i) => ({
        subject,
        shortSubject: subject.length > 9 ? subject.slice(0, 8) + "…" : subject,
        ob: d.ob,
        tot: d.tot,
        count: d.count,
        pct: d.tot > 0 ? Math.round((d.ob / d.tot) * 10000) / 100 : 0,
        color: SUBJECT_COLORS[i % SUBJECT_COLORS.length],
      }))
      .sort((a, b) => b.pct - a.pct);
  }, [filteredResults]);

  const classPerformance = useMemo(() => {
    const map: Record<string, { ob: number; tot: number; students: Set<string> }> = {};
    filteredResults.forEach((r) => {
      if (!r.student) return;
      const key = `${r.student.standard}-${r.student.section}`;
      if (!map[key]) map[key] = { ob: 0, tot: 0, students: new Set() };
      map[key].ob += Number(r.marks_obtained);
      map[key].tot += Number(r.total_marks);
      map[key].students.add(r.student_id);
    });
    return Object.entries(map)
      .map(([cls, d]) => ({
        class: cls,
        avgScore: d.tot > 0 ? Math.round((d.ob / d.tot) * 10000) / 100 : 0,
        students: d.students.size,
      }))
      .sort((a, b) => b.avgScore - a.avgScore);
  }, [filteredResults]);

  const overallPct = useMemo(() => weightedPct(filteredResults), [filteredResults]);
  const overallGrade = getGrade(overallPct);
  const bestSubject = subjectPerformance[0];
  const weakSubject = subjectPerformance.length > 1 ? subjectPerformance[subjectPerformance.length - 1] : null;
  const topClass = classPerformance[0]?.class ?? "--";
  const hasData = filteredResults.length > 0;
  const radarData = subjectPerformance.map((s) => ({ subject: s.shortSubject, pct: s.pct }));
  const uniqueStudentCount = useMemo(() => new Set(filteredResults.map((r) => r.student_id)).size, [filteredResults]);
  const isFiltered = !!(filterStandard || filterSection || filterStudentId || filterExamName || timeRange !== "all");

  const statCards = [
    {
      icon: Users,
      label: "Students",
      value: filterStudentId ? 1 : filterStandard || filterSection ? uniqueStudentCount : allStudents.length,
      sub: "",
    },
    {
      icon: Award,
      label: "Overall Average",
      value: hasData ? `${overallPct}%` : "--",
      sub: hasData ? `Grade ${overallGrade.grade}` : "",
    },
    {
      icon: TrendingUp,
      label: "Best Subject",
      value: bestSubject?.subject ?? "--",
      sub: bestSubject ? `${bestSubject.pct}%` : "",
    },
    {
      icon: TrendingDown,
      label: "Needs Work",
      value: weakSubject?.subject ?? "--",
      sub: weakSubject ? `${weakSubject.pct}%` : "",
    },
    { icon: BarChart3, label: "Top Class", value: topClass, sub: "" },
    { icon: BookOpen, label: "Results Recorded", value: filteredResults.length, sub: "" },
  ];

  return (
    <div className="space-y-5 relative z-10 px-3 sm:px-4 py-4 sm:py-6">
      {/* Title + Refresh */}
      <div className="flex items-center justify-center gap-3">
        <h1 className="text-2xl sm:text-3xl font-bold text-foreground text-center">Analytics Dashboard</h1>
        <button
          onClick={fetchData}
          disabled={loading}
          className="p-1.5 rounded-lg border border-primary/20 text-primary/50 hover:text-primary hover:border-primary/40 transition-all disabled:opacity-30"
          title="Refresh"
        >
          <RefreshCw size={14} className={loading ? "animate-spin" : ""} />
        </button>
      </div>

      {error && (
        <div className="bg-red-500/10 border border-red-500/30 rounded-xl px-4 py-3 text-red-400 text-sm text-center">
          {error}
        </div>
      )}

      {/* ── Grade Scale Info ─────────────────────────────────────────── */}
      <div className="bg-black/30 backdrop-blur-md border border-primary/20 rounded-xl overflow-hidden">
        <button
          onClick={() => setShowGradeInfo((v) => !v)}
          className="w-full flex items-center justify-between px-4 py-3 hover:bg-white/5 transition-colors"
        >
          <div className="flex items-center gap-2">
            <Info size={14} className="text-primary" />
            <span className="text-foreground/60 text-xs font-semibold uppercase tracking-wider">Grade Scale</span>
            <span className="text-foreground/30 text-xs">— tap to {showGradeInfo ? "hide" : "see"} criteria</span>
          </div>
          <span className={`text-xs font-bold ${showGradeInfo ? "text-primary" : "text-foreground/30"}`}>
            {showGradeInfo ? "▲" : "▼"}
          </span>
        </button>
        {showGradeInfo && (
          <div className="px-4 pb-4">
            <div className="grid grid-cols-3 sm:grid-cols-6 gap-2">
              {GRADE_SCALE.map((g) => (
                <div key={g.grade} className={`rounded-lg border p-2.5 text-center ${g.bg} ${g.border}`}>
                  <p className={`text-2xl font-black ${g.text}`}>{g.grade}</p>
                  <p className={`text-xs font-bold mt-0.5 ${g.text}`}>{g.label}</p>
                  <p className="text-foreground/40 text-[10px] mt-0.5">{g.desc}</p>
                </div>
              ))}
            </div>
            <p className="text-foreground/25 text-[10px] mt-3">Weighted %: marks obtained ÷ total marks × 100</p>
          </div>
        )}
      </div>

      {/* ── Filters ──────────────────────────────────────────────────── */}
      <div className="bg-black/30 backdrop-blur-md border border-primary/20 rounded-xl p-4 space-y-4">
        <div className="flex items-center gap-2">
          <Filter size={15} className="text-primary" />
          <span className="text-primary text-xs font-semibold uppercase tracking-wider">Filters</span>
        </div>

        <div className="flex flex-wrap gap-2">
          {TIME_RANGES.map((tr) => (
            <button
              key={tr.value}
              onClick={() => setTimeRange(tr.value)}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold border transition-all ${
                timeRange === tr.value
                  ? "bg-primary text-primary-foreground border-primary shadow-[0_0_10px_hsl(51,100%,50%,0.3)]"
                  : "bg-black/40 text-foreground/60 border-primary/20 hover:border-primary/40 hover:text-foreground/80"
              }`}
            >
              {tr.label}
            </button>
          ))}
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
          <div>
            <label className="block text-xs font-medium text-primary/60 mb-1">STANDARD</label>
            <select
              value={filterStandard}
              onChange={(e) => setFilterStandard(e.target.value)}
              className="w-full px-3 py-2 bg-black border border-primary/20 rounded-lg text-foreground text-sm focus:outline-none focus:ring-2 focus:ring-primary/40"
            >
              <option value="">All Standards</option>
              {STANDARDS.map((s) => (
                <option key={s} value={s}>
                  {s}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-xs font-medium text-primary/60 mb-1">SECTION</label>
            <select
              value={filterSection}
              onChange={(e) => setFilterSection(e.target.value)}
              className="w-full px-3 py-2 bg-black border border-primary/20 rounded-lg text-foreground text-sm focus:outline-none focus:ring-2 focus:ring-primary/40"
            >
              <option value="">All Sections</option>
              {SECTIONS.map((s) => (
                <option key={s} value={s}>
                  {s}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-xs font-medium text-primary/60 mb-1">STUDENT</label>
            <select
              value={filterStudentId}
              onChange={(e) => setFilterStudentId(e.target.value)}
              className="w-full px-3 py-2 bg-black border border-primary/20 rounded-lg text-foreground text-sm focus:outline-none focus:ring-2 focus:ring-primary/40"
            >
              <option value="">All Students</option>
              {studentOptions.map((s) => (
                <option key={s.id} value={s.id}>
                  {s.name} ({s.standard}-{s.section})
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-xs font-medium text-primary/60 mb-1">EXAM TYPE</label>
            <select
              value={filterExamName}
              onChange={(e) => setFilterExamName(e.target.value)}
              className="w-full px-3 py-2 bg-black border border-primary/20 rounded-lg text-foreground text-sm focus:outline-none focus:ring-2 focus:ring-primary/40"
            >
              <option value="">All Exams</option>
              {availableExamTypes.map((e) => (
                <option key={e} value={e}>
                  {e}
                </option>
              ))}
            </select>
          </div>
        </div>

        {isFiltered && (
          <button
            onClick={() => {
              setFilterStandard("");
              setFilterSection("");
              setFilterStudentId("");
              setFilterExamName("");
              setTimeRange("all");
            }}
            className="text-xs text-primary/60 hover:text-primary underline underline-offset-2 transition-colors"
          >
            Clear all filters
          </button>
        )}
      </div>

      {/* ── Stat Cards ───────────────────────────────────────────────── */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
        {statCards.map((card) => (
          <div key={card.label} className="bg-black/30 backdrop-blur-md border border-primary/20 rounded-xl p-4">
            <div className="flex items-center gap-2 mb-2">
              <card.icon size={15} className="text-primary shrink-0" />
              <p className="text-foreground/50 text-xs truncate">{card.label}</p>
            </div>
            <p className="text-xl sm:text-2xl font-bold text-primary truncate">{card.value}</p>
            {card.sub && <p className="text-foreground/40 text-xs mt-0.5">{card.sub}</p>}
          </div>
        ))}
      </div>

      {/* ── Loading / Empty ───────────────────────────────────────────── */}
      {loading ? (
        <div className="flex justify-center py-16">
          <div className="w-8 h-8 border-2 border-primary border-t-transparent rounded-full animate-spin" />
        </div>
      ) : !hasData ? (
        <div className="bg-black/30 backdrop-blur-md border border-primary/20 rounded-xl p-12 text-center">
          <BookOpen size={48} className="text-foreground/20 mx-auto mb-4" />
          <p className="text-foreground/50 text-lg">
            {isFiltered ? "No data for selected filters." : "No analytics data yet."}
          </p>
          <p className="text-foreground/30 text-sm mt-2">
            {isFiltered ? "Try adjusting filters above." : "Add results from Result Sender to see analytics."}
          </p>
        </div>
      ) : (
        <>
          {/* ── Overall Grade Banner ─────────────────────────────────── */}
          <div
            className={`rounded-xl border px-5 py-4 flex items-center justify-between ${overallGrade.bg} ${overallGrade.border}`}
          >
            <div>
              <p className={`text-xs font-semibold uppercase tracking-wider opacity-60 ${overallGrade.text}`}>
                {filterExamName || "Overall Performance"}
                {filterStandard && ` · Std ${filterStandard}${filterSection ? `-${filterSection}` : ""}`}
              </p>
              <p className={`text-2xl font-bold mt-0.5 ${overallGrade.text}`}>
                {overallPct}% &nbsp;·&nbsp; Grade {overallGrade.grade}
              </p>
              <p className={`text-xs opacity-50 mt-0.5 ${overallGrade.text}`}>
                {subjectPerformance.length} subject{subjectPerformance.length !== 1 ? "s" : ""} ·{" "}
                {filteredResults.length} result{filteredResults.length !== 1 ? "s" : ""} · {uniqueStudentCount} student
                {uniqueStudentCount !== 1 ? "s" : ""}
              </p>
            </div>
            <Trophy size={40} className={`opacity-25 shrink-0 ${overallGrade.text}`} />
          </div>

          {/* ── Bar Chart + Detailed Breakdown ───────────────────────── */}
          {subjectPerformance.length > 0 && (
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
              <div className="bg-black/30 backdrop-blur-md border border-primary/20 rounded-xl p-4 sm:p-6">
                <h2 className="text-base font-semibold text-primary mb-4">
                  Subject Scores
                  {filterExamName && <span className="text-xs text-foreground/40 ml-2">({filterExamName})</span>}
                </h2>
                <div className="h-[220px]">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart
                      data={subjectPerformance}
                      barSize={26}
                      margin={{ top: 4, right: 4, left: -20, bottom: 4 }}
                    >
                      <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" vertical={false} />
                      <XAxis
                        dataKey="shortSubject"
                        stroke="rgba(255,255,255,0.3)"
                        fontSize={11}
                        tick={{ fill: "rgba(255,255,255,0.45)" }}
                      />
                      <YAxis
                        stroke="rgba(255,255,255,0.3)"
                        fontSize={11}
                        domain={[0, 100]}
                        tick={{ fill: "rgba(255,255,255,0.35)" }}
                        tickFormatter={(v) => `${v}%`}
                      />
                      <Tooltip content={<BarTooltip />} cursor={{ fill: "rgba(255,255,255,0.04)" }} />
                      <Bar dataKey="pct" radius={[5, 5, 0, 0]}>
                        {subjectPerformance.map((s) => (
                          <Cell key={s.subject} fill={pctColor(s.pct)} />
                        ))}
                      </Bar>
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </div>

              <div className="bg-black/30 backdrop-blur-md border border-primary/20 rounded-xl p-4 sm:p-6">
                <h2 className="text-base font-semibold text-primary mb-4">Detailed Breakdown</h2>
                <div className="space-y-3">
                  {subjectPerformance.map((s) => {
                    const g = getGrade(s.pct);
                    return (
                      <div key={s.subject}>
                        <div className="flex items-center justify-between mb-1">
                          <div className="flex items-center gap-2">
                            <span className="text-foreground/75 text-xs sm:text-sm font-medium">{s.subject}</span>
                            {s.count > 1 && <span className="text-foreground/30 text-xs">({s.count}×)</span>}
                          </div>
                          <div className="flex items-center gap-2">
                            <span
                              className={`text-[11px] px-1.5 py-0.5 rounded border font-black ${g.bg} ${g.border} ${g.text}`}
                            >
                              {g.grade}
                            </span>
                            <span className={`text-sm font-bold ${g.text}`}>{s.pct}%</span>
                          </div>
                        </div>
                        <div className="w-full bg-white/5 rounded-full h-2 overflow-hidden">
                          <div
                            style={{ width: `${Math.min(s.pct, 100)}%`, background: g.color }}
                            className="h-full rounded-full transition-all duration-700"
                          />
                        </div>
                        <p className="text-foreground/25 text-[10px] mt-0.5 text-right">
                          {s.ob}/{s.tot} marks
                        </p>
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>
          )}

          {/* ── Radar Chart ───────────────────────────────────────────── */}
          {subjectPerformance.length >= 3 && (
            <div className="bg-black/30 backdrop-blur-md border border-primary/20 rounded-xl p-4 sm:p-6">
              <h2 className="text-base font-semibold text-primary mb-1">Performance Radar</h2>
              <p className="text-foreground/35 text-xs mb-4">Visual shape of strengths — wider = stronger overall</p>
              <div className="h-[250px]">
                <ResponsiveContainer width="100%" height="100%">
                  <RadarChart data={radarData} margin={{ top: 10, right: 30, left: 30, bottom: 10 }}>
                    <PolarGrid stroke="rgba(255,255,255,0.08)" />
                    <PolarAngleAxis dataKey="subject" tick={{ fill: "rgba(255,255,255,0.5)", fontSize: 11 }} />
                    <PolarRadiusAxis
                      angle={90}
                      domain={[0, 100]}
                      tick={{ fill: "rgba(255,255,255,0.25)", fontSize: 9 }}
                      tickCount={4}
                    />
                    <Radar
                      name="Score"
                      dataKey="pct"
                      stroke="#3b82f6"
                      fill="#3b82f6"
                      fillOpacity={0.22}
                      dot={{ r: 3, fill: "#3b82f6" }}
                    />
                  </RadarChart>
                </ResponsiveContainer>
              </div>
            </div>
          )}

          {/* ── Trend Table ───────────────────────────────────────────── */}
          {!filterExamName && <TrendTable results={filteredResults} />}

          {/* ── Class-wise Performance ────────────────────────────────── */}
          {classPerformance.length > 0 && !filterStudentId && (
            <div className="bg-black/30 backdrop-blur-md border border-primary/20 rounded-xl p-4 sm:p-6">
              <h2 className="text-base font-semibold text-primary mb-4">Class-wise Performance</h2>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                {classPerformance.map((cls) => {
                  const g = getGrade(cls.avgScore);
                  return (
                    <div
                      key={cls.class}
                      className={`rounded-lg border p-4 transition-all duration-300 hover:shadow-[0_0_15px_hsl(51,100%,50%,0.12)] ${g.bg} ${g.border}`}
                    >
                      <div className="flex items-center justify-between mb-2">
                        <h3 className="text-foreground/80 font-semibold text-sm">Class {cls.class}</h3>
                        <span
                          className={`text-xs px-1.5 py-0.5 rounded border font-black ${g.bg} ${g.border} ${g.text}`}
                        >
                          {g.grade}
                        </span>
                      </div>
                      <p className={`text-2xl font-bold ${g.text}`}>{cls.avgScore}%</p>
                      <p className="text-foreground/40 text-xs mt-1">
                        {cls.students} student{cls.students !== 1 ? "s" : ""}
                      </p>
                      <div className="w-full bg-white/5 rounded-full h-1.5 mt-2 overflow-hidden">
                        <div
                          style={{ width: `${Math.min(cls.avgScore, 100)}%`, background: g.color }}
                          className="h-full rounded-full transition-all duration-700"
                        />
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );
};

export default AnalyticsPage;
