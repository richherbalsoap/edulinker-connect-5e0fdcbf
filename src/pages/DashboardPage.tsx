import { useState, useEffect, useMemo } from 'react';
import { BookOpen, MessageSquare, FileText, Calendar, Users } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import useAppStore from '@/store/appStore';

const getAcademicYears = () => {
  const years: string[] = ['Overall'];
  for (let y = 2050; y >= 2023; y--) {
    years.push(`${y - 1}-${y}`);
  }
  return years;
};

const getAcademicYearRange = (yearStr: string) => {
  const [startYear] = yearStr.split('-').map(Number);
  return {
    start: new Date(startYear, 3, 1), // April 1
    end: new Date(startYear + 1, 2, 31, 23, 59, 59), // March 31
  };
};

const DashboardPage = () => {
  const navigate = useNavigate();
  const { homework, complaints, results, students, fetchAll } = useAppStore();
  const [selectedDate, setSelectedDate] = useState(new Date());
  const academicYears = useMemo(() => getAcademicYears(), []);
  const currentMonth = new Date().getMonth();
  const defaultYear = currentMonth >= 3
    ? `${new Date().getFullYear()}-${new Date().getFullYear() + 1}`
    : `${new Date().getFullYear() - 1}-${new Date().getFullYear()}`;
  const [selectedYear, setSelectedYear] = useState(defaultYear);

  useEffect(() => { fetchAll(); }, []);

  const yearRange = useMemo(() => selectedYear === 'Overall' ? null : getAcademicYearRange(selectedYear), [selectedYear]);

  const filteredHomework = useMemo(() => {
    if (!yearRange) return homework;
    return homework.filter(h => {
      const d = new Date(h.created_at);
      return d >= yearRange.start && d <= yearRange.end;
    });
  }, [homework, yearRange]);

  const filteredComplaints = useMemo(() => {
    if (!yearRange) return complaints;
    return complaints.filter(c => {
      const d = new Date(c.created_at);
      return d >= yearRange.start && d <= yearRange.end;
    });
  }, [complaints, yearRange]);

  const filteredResults = useMemo(() => {
    if (!yearRange) return results;
    return results.filter(r => {
      const d = new Date(r.created_at);
      return d >= yearRange.start && d <= yearRange.end;
    });
  }, [results, yearRange]);

  // Date-filtered items for the selected calendar date
  const selectedDateStr = selectedDate.toISOString().split('T')[0];
  const dateHomework = filteredHomework.filter(h => h.created_at.startsWith(selectedDateStr));
  const dateComplaints = filteredComplaints.filter(c => c.created_at.startsWith(selectedDateStr));
  const dateResults = filteredResults.filter(r => r.created_at.startsWith(selectedDateStr));
  const hasDateData = dateHomework.length > 0 || dateComplaints.length > 0 || dateResults.length > 0;

  const stats = [
    ...(selectedYear === 'Overall' ? [{ icon: Users, label: 'Total Students', value: students.length, color: 'from-primary to-secondary', path: '/students' }] : []),
    { icon: BookOpen, label: 'Homework Sent', value: filteredHomework.length, color: 'from-primary to-secondary', path: '/homework' },
    { icon: MessageSquare, label: 'Complaints Sent', value: filteredComplaints.length, color: 'from-primary to-[hsl(43,76%,50%)]', path: '/complaints' },
    { icon: FileText, label: 'Results Sent', value: filteredResults.length, color: 'from-[hsl(43,76%,50%)] to-primary', path: '/results' },
  ];

  const today = new Date();
  const calMonth = selectedDate.getMonth();
  const calYear = selectedDate.getFullYear();
  const daysInMonth = new Date(calYear, calMonth + 1, 0).getDate();
  const firstDay = new Date(calYear, calMonth, 1).getDay();
  const monthNames = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];

  const prevMonth = () => setSelectedDate(new Date(calYear, calMonth - 1, 1));
  const nextMonth = () => setSelectedDate(new Date(calYear, calMonth + 1, 1));

  return (
    <div className="space-y-6 relative z-10 w-full max-w-full overflow-hidden px-4 sm:px-6 lg:px-8 py-6">
      <div className="relative flex flex-col sm:flex-row sm:justify-center items-center w-full gap-4 sm:gap-0">
        <h1 className="text-2xl sm:text-3xl font-bold text-foreground text-center">Dashboard</h1>
        <div className="sm:absolute sm:right-0">
          <select
            value={selectedYear}
            onChange={e => setSelectedYear(e.target.value)}
            className="w-full sm:w-auto px-4 py-2 bg-black/40 backdrop-blur-md border border-primary/30 rounded-lg text-foreground focus:outline-none focus:ring-2 focus:ring-primary/50 transition-all duration-300 appearance-none cursor-pointer text-sm"
          >
            {academicYears.map(y => (
              <option key={y} value={y} className="bg-black text-white">Academic Year {y}</option>
            ))}
          </select>
        </div>
      </div>

      <div className={`grid grid-cols-1 ${selectedYear === 'Overall' ? 'sm:grid-cols-2 lg:grid-cols-4' : 'sm:grid-cols-3'} gap-4 sm:gap-6 max-w-5xl mx-auto`}>
        {stats.map((stat) => (
          <div key={stat.label} onClick={() => navigate(stat.path)} className="relative group cursor-pointer">
            <div className="bg-black/30 backdrop-blur-md border border-primary/20 rounded-xl p-4 sm:p-6 shadow-lg hover:shadow-[0_0_30px_hsl(51,100%,50%,0.15)] hover:border-primary/40 transition-all duration-300 text-center">
              <div className={`w-12 h-12 rounded-lg bg-gradient-to-br ${stat.color} flex items-center justify-center mb-4 group-hover:scale-110 transition-transform duration-300 mx-auto shadow-[0_0_15px_hsl(51,100%,50%,0.3)]`}>
                <stat.icon size={24} className="text-black" />
              </div>
              <p className="text-foreground/60 text-sm mb-2">{stat.label}</p>
              <p className="text-4xl font-bold text-primary drop-shadow-[0_0_15px_hsl(51,100%,50%,0.5)]">{stat.value}</p>
            </div>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 sm:gap-6">
        {/* Date Activity Panel */}
        <div className="bg-black/30 backdrop-blur-md border border-primary/20 rounded-xl p-4 sm:p-6">
          <h2 className="text-lg font-semibold text-foreground mb-3">
            Activity on {selectedDate.toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}
          </h2>
          {hasDateData ? (
            <div className="space-y-3 max-h-64 overflow-y-auto">
              {dateHomework.map(h => (
                <div key={h.id} className="bg-black/40 rounded-lg p-3 border border-primary/10">
                  <span className="text-xs text-primary/60 font-bold">HOMEWORK</span>
                  <p className="text-foreground text-sm">{h.subject} — {h.standard}-{h.section}</p>
                </div>
              ))}
              {dateComplaints.map(c => (
                <div key={c.id} className="bg-black/40 rounded-lg p-3 border border-primary/10">
                  <span className="text-xs text-primary/60 font-bold">COMPLAINT</span>
                  <p className="text-foreground text-sm truncate">{c.description}</p>
                </div>
              ))}
              {dateResults.map(r => (
                <div key={r.id} className="bg-black/40 rounded-lg p-3 border border-primary/10">
                  <span className="text-xs text-primary/60 font-bold">RESULT</span>
                  <p className="text-foreground text-sm">{r.subject} — {r.marks_obtained}/{r.total_marks} ({r.percentage}%)</p>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-foreground/40 text-sm">No activity recorded for this date.</p>
          )}
        </div>

        {/* Calendar */}
        <div className="bg-black/30 backdrop-blur-md border border-primary/20 rounded-xl p-4 sm:p-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-semibold text-foreground flex items-center gap-2">
              <Calendar size={20} className="text-primary" /> Calendar
            </h2>
            <div className="flex items-center gap-2">
              <button onClick={prevMonth} className="p-1 rounded hover:bg-primary/10 text-primary transition-colors">&lt;</button>
              <span className="text-foreground text-sm font-medium">{monthNames[calMonth]} {calYear}</span>
              <button onClick={nextMonth} className="p-1 rounded hover:bg-primary/10 text-primary transition-colors">&gt;</button>
            </div>
          </div>
          <div className="grid grid-cols-7 gap-1 text-center text-xs">
            {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map(d => (
              <div key={d} className="text-primary/60 font-semibold py-1">{d}</div>
            ))}
            {Array.from({ length: firstDay }).map((_, i) => <div key={`empty-${i}`} />)}
            {Array.from({ length: daysInMonth }).map((_, i) => {
              const day = i + 1;
              const isToday = day === today.getDate() && calMonth === today.getMonth() && calYear === today.getFullYear();
              const isSelected = day === selectedDate.getDate() && calMonth === selectedDate.getMonth() && calYear === selectedDate.getFullYear();
              return (
                <div
                  key={day}
                  onClick={() => setSelectedDate(new Date(calYear, calMonth, day))}
                  className={`py-1.5 rounded cursor-pointer transition-all duration-200 text-sm
                    ${isSelected ? 'bg-primary text-primary-foreground font-bold shadow-[0_0_10px_hsl(51,100%,50%,0.4)]'
                      : isToday ? 'bg-primary/20 text-primary font-bold border border-primary/30'
                      : 'text-foreground/70 hover:bg-primary/10 hover:text-foreground'}`}
                >
                  {day}
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
