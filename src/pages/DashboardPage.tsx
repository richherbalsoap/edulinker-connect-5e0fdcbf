import { useState, useEffect, useMemo } from "react";
import { BookOpen, MessageSquare, FileText, Calendar, Users } from "lucide-react";
import { useNavigate } from "react-router-dom";
import useAppStore from "@/store/appStore";
import { useSchoolId } from "@/hooks/useSchoolId";

const getYears = () => {
  const years: string[] = ["Overall"];
  for (let y = 2050; y >= 2023; y--) {
    years.push(`${y}`);
  }
  return years;
};

const getYearRange = (yearStr: string) => {
  const year = Number(yearStr);
  return {
    start: new Date(year, 0, 1), // January 1
    end: new Date(year, 11, 31, 23, 59, 59), // December 31
  };
};

const DashboardPage = () => {
  const navigate = useNavigate();
  const schoolId = useSchoolId();
  const { homework, complaints, results, students, fetchAll } = useAppStore();
  const [selectedDate, setSelectedDate] = useState(new Date());
  const academicYears = useMemo(() => getYears(), []);
  const defaultYear = `${new Date().getFullYear()}`;
  const [selectedYear, setSelectedYear] = useState(defaultYear);

  useEffect(() => {
    if (schoolId) fetchAll(schoolId);
  }, [schoolId]);

  const yearRange = useMemo(() => (selectedYear === "Overall" ? null : getYearRange(selectedYear)), [selectedYear]);

  const filteredHomework = useMemo(() => {
    if (!yearRange) return homework;
    return homework.filter((h) => {
      const d = new Date(h.created_at);
      return d >= yearRange.start && d <= yearRange.end;
    });
  }, [homework, yearRange]);

  const filteredComplaints = useMemo(() => {
    if (!yearRange) return complaints;
    return complaints.filter((c) => {
      const d = new Date(c.created_at);
      return d >= yearRange.start && d <= yearRange.end;
    });
  }, [complaints, yearRange]);

  const filteredResults = useMemo(() => {
    if (!yearRange) return results;
    return results.filter((r) => {
      const d = new Date(r.created_at);
      return d >= yearRange.start && d <= yearRange.end;
    });
  }, [results, yearRange]);

  const matchesDate = (createdAt: string, targetDate: Date) => {
    const d = new Date(createdAt);
    return (
      d.getDate() === targetDate.getDate() &&
      d.getMonth() === targetDate.getMonth() &&
      d.getFullYear() === targetDate.getFullYear()
    );
  };
  const dateHomework = filteredHomework.filter((h) => matchesDate(h.created_at, selectedDate));
  const dateComplaints = filteredComplaints.filter((c) => matchesDate(c.created_at, selectedDate));
  const dateResults = filteredResults.filter((r) => matchesDate(r.created_at, selectedDate));
  const hasDateData = dateHomework.length > 0 || dateComplaints.length > 0 || dateResults.length > 0;

  const datesWithActivity = useMemo(() => {
    const activitySet = new Set<string>();
    filteredHomework.forEach((h) => {
      const d = new Date(h.created_at);
      activitySet.add(`${d.getFullYear()}-${d.getMonth()}-${d.getDate()}`);
    });
    filteredComplaints.forEach((c) => {
      const d = new Date(c.created_at);
      activitySet.add(`${d.getFullYear()}-${d.getMonth()}-${d.getDate()}`);
    });
    filteredResults.forEach((r) => {
      const d = new Date(r.created_at);
      activitySet.add(`${d.getFullYear()}-${d.getMonth()}-${d.getDate()}`);
    });
    return activitySet;
  }, [filteredHomework, filteredComplaints, filteredResults]);

  const stats = [
    ...(selectedYear === "Overall"
      ? [
          {
            icon: Users,
            label: "Total Students",
            value: students.length,
            color: "from-primary to-secondary",
            path: "/students",
          },
        ]
      : []),
    {
      icon: BookOpen,
      label: "Homework Sent",
      value: filteredHomework.length,
      color: "from-primary to-secondary",
      path: "/homework",
    },
    {
      icon: MessageSquare,
      label: "Complaints Sent",
      value: filteredComplaints.length,
      color: "from-primary to-[hsl(43,76%,50%)]",
      path: "/complaints",
    },
    {
      icon: FileText,
      label: "Results Sent",
      value: filteredResults.length,
      color: "from-[hsl(43,76%,50%)] to-primary",
      path: "/results",
    },
  ];

  const today = new Date();
  const calMonth = selectedDate.getMonth();
  const calYear = selectedDate.getFullYear();
  const daysInMonth = new Date(calYear, calMonth + 1, 0).getDate();
  const firstDay = new Date(calYear, calMonth, 1).getDay();
  const monthNames = [
    "January",
    "February",
    "March",
    "April",
    "May",
    "June",
    "July",
    "August",
    "September",
    "October",
    "November",
    "December",
  ];

  const prevMonth = () => setSelectedDate(new Date(calYear, calMonth - 1, 1));
  const nextMonth = () => setSelectedDate(new Date(calYear, calMonth + 1, 1));

  return (
    <div className="space-y-6 relative z-10 w-full max-w-full overflow-hidden px-4 sm:px-6 lg:px-8 py-6">
      <div className="relative flex flex-col sm:flex-row sm:justify-center items-center w-full gap-4 sm:gap-0">
        <h1 className="text-2xl sm:text-3xl font-bold text-foreground text-center">Dashboard</h1>
        <div className="sm:absolute sm:right-0 flex items-center gap-2">
          <button
            onClick={handleRefresh}
            disabled={refreshing}
            aria-label="Refresh data"
            className="p-2 bg-black/40 backdrop-blur-md border border-primary/30 rounded-lg text-primary hover:bg-primary/10 hover:border-primary/50 transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <RefreshCw size={18} className={refreshing ? "animate-spin" : ""} />
          </button>
          <select
            value={selectedYear}
            onChange={(e) => setSelectedYear(e.target.value)}
            className="w-full sm:w-auto px-4 py-2 bg-black/40 backdrop-blur-md border border-primary/30 rounded-lg text-foreground focus:outline-none focus:ring-2 focus:ring-primary/50 transition-all duration-300 appearance-none cursor-pointer text-sm"
          >
            {academicYears.map((y) => (
              <option key={y} value={y} className="bg-black text-white">
                Year {y}
              </option>
            ))}
          </select>
        </div>
      </div>

      <div
        className={`grid grid-cols-1 ${selectedYear === "Overall" ? "sm:grid-cols-2 lg:grid-cols-4" : "sm:grid-cols-3"} gap-4 sm:gap-6 max-w-5xl mx-auto`}
      >
        {stats.map((stat) => (
          <div key={stat.label} onClick={() => navigate(stat.path)} className="relative group cursor-pointer">
            <div className="bg-black/30 backdrop-blur-md border border-primary/20 rounded-xl p-4 sm:p-6 shadow-lg hover:shadow-[0_0_30px_hsl(51,100%,50%,0.15)] hover:border-primary/40 transition-all duration-300 text-center">
              <div
                className={`w-12 h-12 rounded-lg bg-gradient-to-br ${stat.color} flex items-center justify-center mb-4 group-hover:scale-110 transition-transform duration-300 mx-auto shadow-[0_0_15px_hsl(51,100%,50%,0.3)]`}
              >
                <stat.icon size={24} className="text-black" />
              </div>
              <p className="text-foreground/60 text-sm mb-2">{stat.label}</p>
              <p className="text-4xl font-bold text-primary drop-shadow-[0_0_15px_hsl(51,100%,50%,0.5)]">
                {stat.value}
              </p>
            </div>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 sm:gap-6">
        <div className="bg-black/30 backdrop-blur-md border border-primary/20 rounded-xl p-4 sm:p-6">
          <h2 className="text-lg font-semibold text-foreground mb-3">
            Activity on {selectedDate.toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" })}
          </h2>
          {hasDateData ? (
            <div className="space-y-3 max-h-64 overflow-y-auto">
              {dateHomework.map((h) => (
                <div key={h.id} className="bg-black/40 rounded-lg p-3 border border-primary/10">
                  <span className="text-xs text-primary/60 font-bold">HOMEWORK</span>
                  <p className="text-foreground text-sm">
                    {h.subject} — {h.standard}-{h.section}
                  </p>
                </div>
              ))}
              {dateComplaints.map((c) => (
                <div key={c.id} className="bg-black/40 rounded-lg p-3 border border-primary/10">
                  <span className="text-xs text-primary/60 font-bold">COMPLAINT</span>
                  <p className="text-foreground text-sm truncate">{c.description}</p>
                </div>
              ))}
              {dateResults.map((r) => (
                <div key={r.id} className="bg-black/40 rounded-lg p-3 border border-primary/10">
                  <span className="text-xs text-primary/60 font-bold">RESULT</span>
                  <p className="text-foreground text-sm">
                    {r.subject} — {r.marks_obtained}/{r.total_marks} ({r.percentage}%)
                  </p>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-foreground/40 text-sm">No activity recorded for this date.</p>
          )}
        </div>

        <div className="bg-black/30 backdrop-blur-md border border-primary/20 rounded-xl p-4 sm:p-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-semibold text-foreground flex items-center gap-2">
              <Calendar size={20} className="text-primary" /> Calendar
            </h2>
            <div className="flex items-center gap-2">
              <button onClick={prevMonth} className="p-1 rounded hover:bg-primary/10 text-primary transition-colors">
                &lt;
              </button>
              <span className="text-foreground text-sm font-medium">
                {monthNames[calMonth]} {calYear}
              </span>
              <button onClick={nextMonth} className="p-1 rounded hover:bg-primary/10 text-primary transition-colors">
                &gt;
              </button>
            </div>
          </div>
          <div className="grid grid-cols-7 gap-1 text-center text-xs">
            {["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"].map((d) => (
              <div key={d} className="text-primary/60 font-semibold py-1">
                {d}
              </div>
            ))}
            {Array.from({ length: firstDay }).map((_, i) => (
              <div key={`empty-${i}`} />
            ))}
            {Array.from({ length: daysInMonth }).map((_, i) => {
              const day = i + 1;
              const isToday =
                day === today.getDate() && calMonth === today.getMonth() && calYear === today.getFullYear();
              const isSelected =
                day === selectedDate.getDate() &&
                calMonth === selectedDate.getMonth() &&
                calYear === selectedDate.getFullYear();
              const hasActivity = datesWithActivity.has(`${calYear}-${calMonth}-${day}`);
              return (
                <div
                  key={day}
                  onClick={() => setSelectedDate(new Date(calYear, calMonth, day))}
                  className={`py-1.5 rounded cursor-pointer transition-all duration-200 text-sm relative
                    ${
                      isSelected
                        ? "bg-primary text-primary-foreground font-bold shadow-[0_0_10px_hsl(51,100%,50%,0.4)]"
                        : isToday
                          ? "bg-primary/20 text-primary font-bold border border-primary/30"
                          : "text-foreground/70 hover:bg-primary/10 hover:text-foreground"
                    }`}
                >
                  {day}
                  {hasActivity && (
                    <span
                      className={`absolute bottom-0.5 left-1/2 -translate-x-1/2 w-1.5 h-1.5 rounded-full ${
                        isSelected ? "bg-primary-foreground" : "bg-primary shadow-[0_0_6px_hsl(51,100%,50%,0.8)]"
                      }`}
                    />
                  )}
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
};

export default DashboardPage;
