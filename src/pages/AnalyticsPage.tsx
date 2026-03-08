import { useMemo, useEffect, useState } from "react";
import { TrendingUp, Users, BookOpen, Award, Filter } from "lucide-react";
import useAppStore from "@/store/appStore";

const standards = ["Nursery", "LKG", "UKG", "1", "2", "3", "4", "5", "6", "7", "8", "9", "10", "11", "12"];
const classes = ["A", "B", "C", "D", "E"];

const timeRanges = [
  { label: "Last 7 Days", value: "7d" },
  { label: "Last 1 Month", value: "1m" },
  { label: "Last 3 Months", value: "3m" },
  { label: "Last 6 Months", value: "6m" },
  { label: "Last 1 Year", value: "1y" },
  { label: "Overall", value: "all" },
];

const getStartDate = (range: string): Date | null => {
  const now = new Date();
  if (range === "7d") return new Date(now.setDate(now.getDate() - 7));
  if (range === "1m") return new Date(now.setMonth(now.getMonth() - 1));
  if (range === "3m") return new Date(now.setMonth(now.getMonth() - 3));
  if (range === "6m") return new Date(now.setMonth(now.getMonth() - 6));
  if (range === "1y") return new Date(now.setFullYear(now.getFullYear() - 1));
  return null; // 'all'
};

const AnalyticsPage = () => {
  const results = useAppStore((state) => state.results);
  const students = useAppStore((state) => state.students);
  const fetchAll = useAppStore((state) => state.fetchAll);

  const [filterStandard, setFilterStandard] = useState("");
  const [filterClass, setFilterClass] = useState("");
  const [filterStudentId, setFilterStudentId] = useState("");
  const [timeRange, setTimeRange] = useState("all");

  useEffect(() => {
    fetchAll();
  }, []);

  // Reset student when standard/class changes
  useEffect(() => {
    setFilterStudentId("");
  }, [filterStandard, filterClass]);

  // Students filtered by standard + class for dropdown
  const filteredStudentOptions = useMemo(() => {
    return students.filter((s) => {
      if (filterStandard && filterClass) return s.standard === filterStandard && s.section === filterClass;
      if (filterStandard) return s.standard === filterStandard;
      if (filterClass) return s.section === filterClass;
      return true;
    });
  }, [students, filterStandard, filterClass]);

  // Apply all filters to results
  const filteredResults = useMemo(() => {
    const startDate = getStartDate(timeRange);
    return results.filter((r) => {
      // Time filter
      if (startDate && new Date(r.created_at) < startDate) return false;
      // Student filter
      if (filterStudentId && r.student_id !== filterStudentId) return false;
      // Standard filter
      if (filterStandard && r.student?.standard !== filterStandard) return false;
      // Class filter
      if (filterClass && r.student?.section !== filterClass) return false;
      return true;
    });
  }, [results, filterStandard, filterClass, filterStudentId, timeRange]);

  const subjectPerformance = useMemo(() => {
    const subjectMap: Record<string, { total: number; count: number }> = {};
    filteredResults.forEach((result) => {
      const name = result.subject;
      const marks = result.percentage || 0;
      if (!subjectMap[name]) subjectMap[name] = { total: 0, count: 0 };
      subjectMap[name].total += marks;
      subjectMap[name].count += 1;
    });
    const colors = [
      "bg-blue-500",
      "bg-green-500",
      "bg-purple-500",
      "bg-yellow-500",
      "bg-pink-500",
      "bg-cyan-500",
      "bg-red-500",
      "bg-indigo-500",
    ];
    return Object.entries(subjectMap).map(([subject, data], index) => ({
      subject,
      avgScore: Math.round(data.total / data.count),
      color: colors[index % colors.length],
    }));
  }, [filteredResults]);

  const classPerformance = useMemo(() => {
    const classMap: Record<string, { totalPercentage: number; count: number; students: Set<string> }> = {};
    filteredResults.forEach((result) => {
      const student = result.student;
      if (!student) return;
      const key = `${student.standard}-${student.section}`;
      if (!classMap[key]) classMap[key] = { totalPercentage: 0, count: 0, students: new Set() };
      classMap[key].totalPercentage += result.percentage || 0;
      classMap[key].count += 1;
      classMap[key].students.add(student.name);
    });
    return Object.entries(classMap)
      .map(([cls, data]) => ({
        class: cls,
        avgScore: data.count > 0 ? Math.round(data.totalPercentage / data.count) : 0,
        students: data.students.size,
      }))
      .sort((a, b) => b.avgScore - a.avgScore);
  }, [filteredResults]);

  const overallAvg = useMemo(() => {
    if (filteredResults.length === 0) return 0;
    const total = filteredResults.reduce((sum, r) => sum + (r.percentage || 0), 0);
    return Math.round(total / filteredResults.length);
  }, [filteredResults]);

  const topClass = useMemo(
    () => (classPerformance.length === 0 ? "--" : classPerformance[0].class),
    [classPerformance],
  );
  const hasData = filteredResults.length > 0;

  // Unique student count in filtered results
  const uniqueStudentCount = useMemo(() => {
    return new Set(filteredResults.map((r) => r.student_id)).size;
  }, [filteredResults]);

  const statCards = [
    {
      icon: Users,
      label: "Students",
      value: filterStudentId ? 1 : filterStandard || filterClass ? uniqueStudentCount : students.length,
    },
    { icon: Award, label: "Overall Average", value: hasData ? `${overallAvg}%` : "--" },
    { icon: TrendingUp, label: "Top Class", value: topClass },
    { icon: BookOpen, label: "Results Recorded", value: filteredResults.length },
  ];

  const isFiltered = filterStandard || filterClass || filterStudentId || timeRange !== "all";

  return (
    <div className="space-y-6 relative z-10 px-4 py-6">
      <h1 className="text-3xl font-bold text-foreground text-center">Analytics Dashboard</h1>

      {/* ── FILTERS ── */}
      <div className="bg-black/30 backdrop-blur-md border border-primary/20 rounded-xl p-4 max-w-4xl mx-auto space-y-4">
        <div className="flex items-center gap-2 mb-1">
          <Filter size={16} className="text-primary" />
          <span className="text-primary text-sm font-semibold">FILTERS</span>
        </div>

        {/* Time Range */}
        <div className="flex flex-wrap gap-2">
          {timeRanges.map((tr) => (
            <button
              key={tr.value}
              onClick={() => setTimeRange(tr.value)}
              className={`px-3 py-1.5 rounded-lg text-xs font-medium border transition-all duration-200 ${
                timeRange === tr.value
                  ? "bg-primary text-primary-foreground border-primary shadow-[0_0_10px_hsl(51,100%,50%,0.3)]"
                  : "bg-black/40 text-foreground/70 border-primary/20 hover:bg-primary/10"
              }`}
            >
              {tr.label}
            </button>
          ))}
        </div>

        {/* Standard + Class + Student */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          <div>
            <label className="block text-xs font-medium text-primary/60 mb-1">STANDARD</label>
            <select
              value={filterStandard}
              onChange={(e) => setFilterStandard(e.target.value)}
              className="w-full px-3 py-2 bg-black border border-primary/20 rounded-lg text-foreground text-sm focus:outline-none focus:ring-2 focus:ring-primary/40"
            >
              <option value="">All Standards</option>
              {standards.map((std) => (
                <option key={std} value={std}>
                  {std}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-xs font-medium text-primary/60 mb-1">CLASS</label>
            <select
              value={filterClass}
              onChange={(e) => setFilterClass(e.target.value)}
              className="w-full px-3 py-2 bg-black border border-primary/20 rounded-lg text-foreground text-sm focus:outline-none focus:ring-2 focus:ring-primary/40"
            >
              <option value="">All Classes</option>
              {classes.map((cls) => (
                <option key={cls} value={cls}>
                  {cls}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-xs font-medium text-primary/60 mb-1">STUDENT (Optional)</label>
            <select
              value={filterStudentId}
              onChange={(e) => setFilterStudentId(e.target.value)}
              className="w-full px-3 py-2 bg-black border border-primary/20 rounded-lg text-foreground text-sm focus:outline-none focus:ring-2 focus:ring-primary/40"
            >
              <option value="">All Students</option>
              {filteredStudentOptions.map((s) => (
                <option key={s.id} value={s.id}>
                  {s.name}
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* Clear Filters */}
        {isFiltered && (
          <button
            onClick={() => {
              setFilterStandard("");
              setFilterClass("");
              setFilterStudentId("");
              setTimeRange("all");
            }}
            className="text-xs text-primary/60 hover:text-primary underline underline-offset-2 transition-colors"
          >
            Clear all filters
          </button>
        )}
      </div>

      {/* ── STAT CARDS ── */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        {statCards.map((stat) => (
          <div key={stat.label} className="bg-black/30 backdrop-blur-md border border-primary/20 rounded-xl p-6">
            <div className="flex items-center gap-3 mb-2">
              <stat.icon size={20} className="text-primary" />
              <p className="text-foreground/60 text-sm">{stat.label}</p>
            </div>
            <p className="text-4xl font-bold text-primary drop-shadow-[0_0_15px_hsl(51,100%,50%,0.5)]">{stat.value}</p>
          </div>
        ))}
      </div>

      {/* ── CHARTS ── */}
      {hasData ? (
        <>
          {subjectPerformance.length > 0 && (
            <div className="bg-black/30 backdrop-blur-md border border-primary/20 rounded-xl p-6">
              <h2 className="text-xl font-semibold text-primary mb-6">Subject-wise Performance</h2>
              <div className="space-y-4">
                {subjectPerformance.map((subject) => (
                  <div key={subject.subject}>
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-foreground font-medium">{subject.subject}</span>
                      <span className="text-primary font-semibold">{subject.avgScore}%</span>
                    </div>
                    <div className="w-full bg-primary/10 rounded-full h-3 overflow-hidden">
                      <div
                        style={{ width: `${Math.min(subject.avgScore, 100)}%` }}
                        className={`h-full ${subject.color} shadow-lg transition-all duration-500`}
                      />
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Hide class-wise if single student selected */}
          {classPerformance.length > 0 && !filterStudentId && (
            <div className="bg-black/30 backdrop-blur-md border border-primary/20 rounded-xl p-6">
              <h2 className="text-xl font-semibold text-primary mb-6">Class-wise Performance</h2>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {classPerformance.map((cls) => (
                  <div
                    key={cls.class}
                    className="bg-black/40 backdrop-blur-sm border border-primary/20 rounded-lg p-4 hover:border-primary/40 hover:shadow-[0_0_15px_hsl(51,100%,50%,0.15)] transition-all duration-300"
                  >
                    <h3 className="text-foreground font-semibold text-lg mb-2">Class {cls.class}</h3>
                    <p className="text-foreground/60 text-sm">Average Score</p>
                    <p className="text-2xl font-bold text-primary">{cls.avgScore}%</p>
                    <p className="text-foreground/50 text-xs">
                      {cls.students} student{cls.students !== 1 ? "s" : ""}
                    </p>
                  </div>
                ))}
              </div>
            </div>
          )}
        </>
      ) : (
        <div className="bg-black/30 backdrop-blur-md border border-primary/20 rounded-xl p-12 text-center">
          <BookOpen size={48} className="text-foreground/20 mx-auto mb-4" />
          <p className="text-foreground/50 text-lg">
            {isFiltered ? "No data found for selected filters." : "No analytics data yet."}
          </p>
          <p className="text-foreground/30 text-sm mt-2">
            {isFiltered
              ? "Try changing the filters above."
              : "Add student results from the Result Sender page to see performance analytics here."}
          </p>
        </div>
      )}
    </div>
  );
};

export default AnalyticsPage;
