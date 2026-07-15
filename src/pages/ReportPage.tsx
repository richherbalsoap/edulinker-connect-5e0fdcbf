import { useState, useEffect, useMemo, useCallback } from "react";
import { format, startOfDay, endOfDay } from "date-fns";
import {
  Download,
  Printer,
  FileSpreadsheet,
  Loader2,
  CalendarIcon,
  Users,
  BookOpen,
  MessageSquare,
  FileText,
  DollarSign,
  Bell,
} from "lucide-react";
import * as XLSX from "xlsx";
import { apiClient } from "@/lib/apiClient";
import { useSchoolId } from "@/hooks/useSchoolId";
import { Button } from "@/components/ui/button";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { cn } from "@/lib/utils";
import { normalizeDateRange } from "@/utils/reportFilters";
type DateRange = "last-week" | "last-month" | "last-3-months" | "last-6-months" | "last-year" | "all" | "custom";

const rangeOptions: { value: DateRange; label: string }[] = [
  { value: "last-week", label: "Last Week" },
  { value: "last-month", label: "Last Month" },
  { value: "last-3-months", label: "Last 3 Months" },
  { value: "last-6-months", label: "Last 6 Months" },
  { value: "last-year", label: "Last 1 Year" },
  { value: "all", label: "All Time" },
  { value: "custom", label: "Custom Range" },
];

interface ReportData {
  results: any[];
  homework: any[];
  announcements: any[];
  complaints: any[];
  fees: any[];
  students: any[];
}

// FIX #3: Escape HTML to prevent XSS in print window
const escapeHtml = (str: string) =>
  String(str ?? "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");

const ReportPage = () => {
  const schoolId = useSchoolId();
  const [schoolName, setSchoolName] = useState<string>("MySchool");

  useEffect(() => {
    if (!schoolId) return;
    apiClient
      .from("schools")
      .select("school_name")
      .eq("id", schoolId)
      .single()
      .then(({ data }) => {
        if (data?.school_name) setSchoolName(data.school_name);
      });
  }, [schoolId]);
  const [range, setRange] = useState<DateRange>("last-month");
  const [customFrom, setCustomFrom] = useState<Date | undefined>();
  const [customTo, setCustomTo] = useState<Date | undefined>();
  const [loading, setLoading] = useState(false);
  const [data, setData] = useState<ReportData | null>(null);

  const { startDate, endDate } = useMemo(() => {
    let start: Date | null = null;
    let end: Date | null = endOfDay(new Date());
    const now = new Date();
    switch (range) {
      case "last-week": {
        // Last full week: Mon to Sun of previous week
        const day = now.getDay(); // 0=Sun, 1=Mon...
        const lastSun = new Date(now);
        lastSun.setDate(now.getDate() - day);
        const lastMon = new Date(lastSun);
        lastMon.setDate(lastSun.getDate() - 6);
        start = startOfDay(lastMon);
        end = endOfDay(lastSun);
        break;
      }
      case "last-month": {
        // Full previous calendar month: e.g. if now=Apr, then Mar 1 – Mar 31
        const firstOfThisMonth = new Date(now.getFullYear(), now.getMonth(), 1);
        const lastOfPrevMonth = new Date(firstOfThisMonth.getTime() - 1);
        start = startOfDay(new Date(lastOfPrevMonth.getFullYear(), lastOfPrevMonth.getMonth(), 1));
        end = endOfDay(lastOfPrevMonth);
        break;
      }
      case "last-3-months": {
        // 1st of (currentMonth - 3) to end of last month
        const firstOfThisMonth = new Date(now.getFullYear(), now.getMonth(), 1);
        const lastOfPrevMonth = new Date(firstOfThisMonth.getTime() - 1);
        start = startOfDay(new Date(now.getFullYear(), now.getMonth() - 3, 1));
        end = endOfDay(lastOfPrevMonth);
        break;
      }
      case "last-6-months": {
        // 1st of (currentMonth - 6) to end of last month
        const firstOfThisMonth = new Date(now.getFullYear(), now.getMonth(), 1);
        const lastOfPrevMonth = new Date(firstOfThisMonth.getTime() - 1);
        start = startOfDay(new Date(now.getFullYear(), now.getMonth() - 6, 1));
        end = endOfDay(lastOfPrevMonth);
        break;
      }
      case "last-year": {
        // Full previous calendar year: Jan 1 – Dec 31 of last year
        const lastYear = now.getFullYear() - 1;
        start = startOfDay(new Date(lastYear, 0, 1));
        end = endOfDay(new Date(lastYear, 11, 31));
        break;
      }
      case "all":
        start = null;
        end = null;
        break;
      case "custom":
        start = customFrom ? startOfDay(customFrom) : null;
        end = customTo ? endOfDay(customTo) : null;
        break;
    }
    return normalizeDateRange(start, end);
  }, [range, customFrom, customTo]);

  // FIX #4: Only fetch when custom range has both dates selected (or non-custom range)
  const isReadyToFetch = range !== "custom" || (!!customFrom && !!customTo);

  const fetchData = useCallback(async () => {
    if (!schoolId || !isReadyToFetch) {
      setData(null);
      return;
    }

    setLoading(true);
    setData(null);

    try {
      // FIX #1: Apply date filter only in apiClient query — no double filtering
      const applyDateFilter = (query: any) => {
        let q = query.eq("school_id", schoolId).eq("is_deleted", false);
        if (startDate) q = q.gte("created_at", startDate.toISOString());
        if (endDate) q = q.lte("created_at", endDate.toISOString());
        return q;
      };

      const applyDateFilterSimple = (query: any) => {
        let q = query.eq("school_id", schoolId);
        if (startDate) q = q.gte("created_at", startDate.toISOString());
        if (endDate) q = q.lte("created_at", endDate.toISOString());
        return q;
      };

      const responses = await Promise.all([
        applyDateFilter(apiClient.from("results").select("*, student:students(name, standard, section, roll_no)")).order(
          "created_at",
          { ascending: false },
        ),
        applyDateFilter(apiClient.from("homework").select("*")).order("created_at", { ascending: false }),
        applyDateFilter(apiClient.from("announcements").select("*")).order("created_at", { ascending: false }),
        applyDateFilter(apiClient.from("complaints").select("*, student:students(name, standard, section)")).order(
          "created_at",
          { ascending: false },
        ),
        applyDateFilterSimple(
          apiClient.from("fees_reminders").select("*, student:students(name, standard, section)"),
        ).order("created_at", { ascending: false }),
        // Students are permanent entities — never date-filtered, always fetch all for school
        apiClient.from("students").select("*").eq("school_id", schoolId).order("created_at", { ascending: false }),
      ]);

      const [resResults, resHomework, resAnnouncements, resComplaints, resFees, resStudents] = responses;
      const firstError = responses.find((response) => response.error)?.error;

      if (firstError) throw firstError;

      // FIX #1: Set data directly — apiClient already filtered, no redundant filterRowsByCreatedAt
      setData({
        results: resResults.data || [],
        homework: resHomework.data || [],
        announcements: resAnnouncements.data || [],
        complaints: resComplaints.data || [],
        fees: resFees.data || [],
        students: resStudents.data || [],
      });
    } catch (err) {
      console.error("Report fetch error:", err);
      setData(null);
    } finally {
      setLoading(false);
    }
  }, [schoolId, startDate, endDate, isReadyToFetch]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  // FIX #1: reportData is just data — no redundant re-filtering via useMemo
  const reportData = data;

  const dateLabel = useMemo(() => {
    if (range === "all") return "AllTime";
    if (range === "custom" && customFrom && customTo)
      return `${format(customFrom, "ddMMMyy")}-${format(customTo, "ddMMMyy")}`;
    const opt = rangeOptions.find((r) => r.value === range);
    return opt?.label.replace(/\s+/g, "") || "";
  }, [range, customFrom, customTo]);

  const downloadBlob = (blob: Blob, fileName: string) => {
    // Mobile-safe download path. WebViews (Android Studio app, some iOS browsers)
    // often block XLSX.writeFile's internal anchor click. Manually triggering
    // a click on a same-origin object URL works across mobile + desktop.
    try {
      const nav = navigator as Navigator & {
        msSaveOrOpenBlob?: (blob: Blob, name: string) => boolean;
      };
      if (typeof nav.msSaveOrOpenBlob === "function") {
        nav.msSaveOrOpenBlob(blob, fileName);
        return;
      }
    } catch {
      // ignore and fall through
    }

    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = fileName;
    a.rel = "noopener";
    a.style.display = "none";
    document.body.appendChild(a);
    a.click();
    setTimeout(() => {
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    }, 1500);
  };

  const handleDownload = () => {
    if (!reportData) return;
    const wb = XLSX.utils.book_new();

    // Results
    const resultsRows = reportData.results.map((r) => ({
      "Student Name": r.student?.name || "",
      Class: r.student?.standard || "",
      Section: r.student?.section || "",
      "Roll No": r.student?.roll_no || "",
      Subject: r.subject,
      "Exam Name": r.exam_name || "",
      "Marks Obtained": r.marks_obtained,
      "Total Marks": r.total_marks,
      Percentage: r.percentage,
      Date: format(new Date(r.created_at), "dd MMM yyyy"),
    }));
    const wsResults = XLSX.utils.json_to_sheet(resultsRows);
    autoWidth(wsResults, resultsRows);
    XLSX.utils.book_append_sheet(wb, wsResults, "Results");

    // Homework
    const hwRows = reportData.homework.map((h) => ({
      Class: h.standard,
      Section: h.section,
      Subject: h.subject,
      Description: h.description,
      "Date Assigned": format(new Date(h.created_at), "dd MMM yyyy"),
    }));
    const wsHw = XLSX.utils.json_to_sheet(hwRows);
    autoWidth(wsHw, hwRows);
    XLSX.utils.book_append_sheet(wb, wsHw, "Homework");

    // Announcements
    const annRows = reportData.announcements.map((a) => ({
      Title: a.title || "",
      Content: a.content || "",
      Type: a.type || "",
      Date: format(new Date(a.created_at), "dd MMM yyyy"),
    }));
    const wsAnn = XLSX.utils.json_to_sheet(annRows);
    autoWidth(wsAnn, annRows);
    XLSX.utils.book_append_sheet(wb, wsAnn, "Announcements");

    // Complaints
    const compRows = reportData.complaints.map((c) => ({
      "Student Name": c.student?.name || "",
      Class: c.student?.standard || "",
      Section: c.student?.section || "",
      Description: c.description,
      Date: format(new Date(c.created_at), "dd MMM yyyy"),
    }));
    const wsComp = XLSX.utils.json_to_sheet(compRows);
    autoWidth(wsComp, compRows);
    XLSX.utils.book_append_sheet(wb, wsComp, "Complaints");

    // Fees
    const feeRows = reportData.fees.map((f) => ({
      "Student Name": f.student?.name || "",
      Class: f.student?.standard || "",
      Section: f.student?.section || "",
      Title: f.title || "",
      "Amount (₹)": f.amount || 0,
      Date: format(new Date(f.created_at), "dd MMM yyyy"),
    }));
    const wsFee = XLSX.utils.json_to_sheet(feeRows);
    autoWidth(wsFee, feeRows);
    XLSX.utils.book_append_sheet(wb, wsFee, "Fees Reminders");

    // Students
    const stdRows = reportData.students.map((s) => ({
      Name: s.name,
      Class: s.standard,
      Section: s.section,
      "Roll No": s.roll_no || "",
      "Parent Name": s.parent_name || "",
      "Parent Contact": s.parent_contact || "",
      "Secret ID": s.secret_id,
      "Date Added": format(new Date(s.created_at), "dd MMM yyyy"),
    }));
    const wsStd = XLSX.utils.json_to_sheet(stdRows);
    autoWidth(wsStd, stdRows);
    XLSX.utils.book_append_sheet(wb, wsStd, "Students");

    // Bold headers for all sheets
    wb.SheetNames.forEach((name) => {
      const ws = wb.Sheets[name];
      const rangeRef = ws["!ref"];
      if (!rangeRef) return;
      const decoded = XLSX.utils.decode_range(rangeRef);
      for (let c = decoded.s.c; c <= decoded.e.c; c++) {
        const addr = XLSX.utils.encode_cell({ r: 0, c });
        if (ws[addr]) {
          ws[addr].s = { font: { bold: true } };
        }
      }
    });

    const fileName = `EDULinker_Report_${schoolName.replace(/\s+/g, "_")}_${dateLabel}.xlsx`;

    try {
      // Build the file as an array buffer so we control the download trigger.
      // XLSX.writeFile relies on internal anchor-click that fails in many
      // mobile WebViews (Android Studio wrapper, in-app browsers).
      const wbout = XLSX.write(wb, { bookType: "xlsx", type: "array" }) as ArrayBuffer;
      const blob = new Blob([wbout], {
        type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
      });
      downloadBlob(blob, fileName);
    } catch (err) {
      console.error("Excel download failed:", err);
      // Last-resort fallback to library writer
      try {
        XLSX.writeFile(wb, fileName);
      } catch (e) {
        console.error("Fallback writeFile also failed:", e);
      }
    }
  };

  const handlePrint = () => {
    if (!reportData) return;
    const printWindow = window.open("", "_blank");
    if (!printWindow) return;

    const tableStyle = `
      table { width: 100%; border-collapse: collapse; margin-bottom: 30px; font-size: 12px; }
      th, td { border: 1px solid #333; padding: 6px 10px; text-align: left; }
      th { background: #1a1a2e; color: #ffd700; font-weight: bold; }
      h1 { color: #ffd700; text-align: center; }
      h2 { color: #ffd700; margin-top: 30px; border-bottom: 2px solid #ffd700; padding-bottom: 4px; }
      body { font-family: Arial, sans-serif; background: #0f0f23; color: #e0e0e0; padding: 20px; }
      @media print { body { background: white; color: black; } th { background: #333; color: white; } }
    `;

    // FIX #3: All cell values escaped to prevent XSS in print window
    const makeTable = (headers: string[], rows: (string | number)[][]) => {
      const ths = headers.map((h) => `<th>${escapeHtml(String(h))}</th>`).join("");
      const trs = rows
        .map((r) => `<tr>${r.map((c) => `<td>${escapeHtml(String(c ?? ""))}</td>`).join("")}</tr>`)
        .join("");
      return `<table><thead><tr>${ths}</tr></thead><tbody>${trs}</tbody></table>`;
    };

    const html = `<!DOCTYPE html><html><head><title>EDULinker Report</title><style>${tableStyle}</style></head><body>
      <h1>📊 EDULinker Report — ${escapeHtml(schoolName)}</h1>
      <p style="text-align:center;color:#aaa;">Date Range: ${escapeHtml(dateLabel)} | Generated: ${format(new Date(), "dd MMM yyyy, hh:mm a")}</p>
      
      <h2>📝 Results (${reportData.results.length})</h2>
      ${makeTable(
        ["Student", "Class", "Section", "Roll No", "Subject", "Exam", "Marks", "Total", "%", "Date"],
        reportData.results.map((r) => [
          r.student?.name || "",
          r.student?.standard || "",
          r.student?.section || "",
          r.student?.roll_no || "",
          r.subject,
          r.exam_name || "",
          r.marks_obtained,
          r.total_marks,
          r.percentage,
          format(new Date(r.created_at), "dd MMM yyyy"),
        ]),
      )}
      
      <h2>📚 Homework (${reportData.homework.length})</h2>
      ${makeTable(
        ["Class", "Section", "Subject", "Description", "Date"],
        reportData.homework.map((h) => [
          h.standard,
          h.section,
          h.subject,
          h.description,
          format(new Date(h.created_at), "dd MMM yyyy"),
        ]),
      )}
      
      <h2>📢 Announcements (${reportData.announcements.length})</h2>
      ${makeTable(
        ["Title", "Content", "Type", "Date"],
        reportData.announcements.map((a) => [
          a.title || "",
          a.content || "",
          a.type || "",
          format(new Date(a.created_at), "dd MMM yyyy"),
        ]),
      )}
      
      <h2>⚠️ Complaints (${reportData.complaints.length})</h2>
      ${makeTable(
        ["Student", "Class", "Section", "Description", "Date"],
        reportData.complaints.map((c) => [
          c.student?.name || "",
          c.student?.standard || "",
          c.student?.section || "",
          c.description,
          format(new Date(c.created_at), "dd MMM yyyy"),
        ]),
      )}
      
      <h2>💰 Fees Reminders (${reportData.fees.length})</h2>
      ${makeTable(
        ["Student", "Class", "Section", "Title", "Amount (₹)", "Date"],
        reportData.fees.map((f) => [
          f.student?.name || "",
          f.student?.standard || "",
          f.student?.section || "",
          f.title || "",
          f.amount || 0,
          format(new Date(f.created_at), "dd MMM yyyy"),
        ]),
      )}
      
      <h2>👨‍🎓 Students (${reportData.students.length})</h2>
      ${makeTable(
        ["Name", "Class", "Section", "Roll No", "Parent", "Contact", "Secret ID", "Added"],
        reportData.students.map((s) => [
          s.name,
          s.standard,
          s.section,
          s.roll_no || "",
          s.parent_name || "",
          s.parent_contact || "",
          s.secret_id,
          format(new Date(s.created_at), "dd MMM yyyy"),
        ]),
      )}
    </body></html>`;

    printWindow.document.write(html);
    printWindow.document.close();
    printWindow.onload = () => printWindow.print();
  };

  const counts = useMemo(() => {
    if (!reportData) return null;
    return [
      { icon: FileText, label: "Results", count: reportData.results.length, color: "text-primary" },
      { icon: BookOpen, label: "Homework", count: reportData.homework.length, color: "text-primary" },
      { icon: Bell, label: "Announcements", count: reportData.announcements.length, color: "text-primary" },
      { icon: MessageSquare, label: "Complaints", count: reportData.complaints.length, color: "text-primary" },
      { icon: DollarSign, label: "Fees", count: reportData.fees.length, color: "text-primary" },
      { icon: Users, label: "Students", count: reportData.students.length, color: "text-primary" },
    ];
  }, [reportData]);

  return (
    <div className="space-y-6 relative z-10 w-full max-w-full overflow-hidden px-4 sm:px-6 lg:px-8 py-6">
      <div className="text-center">
        <h1 className="text-2xl sm:text-3xl font-bold text-foreground flex items-center justify-center gap-2">
          <FileSpreadsheet className="text-primary" size={28} /> Download Report
        </h1>
        <p className="text-foreground/50 text-sm mt-1">Export your school data as Excel or print-ready report</p>
      </div>

      {/* Date Range Selector */}
      <div className="bg-black/30 backdrop-blur-md border border-primary/20 rounded-xl p-4 sm:p-6">
        <h2 className="text-sm font-semibold text-primary/70 uppercase tracking-wider mb-3">Select Date Range</h2>
        <div className="flex flex-wrap gap-2">
          {rangeOptions.map((opt) => (
            <button
              key={opt.value}
              onClick={() => setRange(opt.value)}
              className={cn(
                "px-4 py-2 rounded-lg text-sm font-medium border transition-all duration-200",
                range === opt.value
                  ? "bg-primary/20 text-primary border-primary/40 shadow-[0_0_10px_hsl(51,100%,50%,0.2)]"
                  : "bg-black/20 text-foreground/60 border-primary/10 hover:border-primary/30 hover:text-foreground",
              )}
            >
              {opt.label}
            </button>
          ))}
        </div>

        {range === "custom" && (
          <div className="flex flex-wrap gap-4 mt-4">
            <Popover>
              <PopoverTrigger asChild>
                <Button
                  variant="outline"
                  className={cn(
                    "w-[180px] justify-start text-left font-normal border-primary/30",
                    !customFrom && "text-muted-foreground",
                  )}
                >
                  <CalendarIcon className="mr-2 h-4 w-4" />
                  {customFrom ? format(customFrom, "dd MMM yyyy") : "From Date"}
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-auto p-0" align="start">
                <Calendar
                  mode="single"
                  selected={customFrom}
                  onSelect={setCustomFrom}
                  initialFocus
                  className="p-3 pointer-events-auto"
                />
              </PopoverContent>
            </Popover>
            <Popover>
              <PopoverTrigger asChild>
                <Button
                  variant="outline"
                  className={cn(
                    "w-[180px] justify-start text-left font-normal border-primary/30",
                    !customTo && "text-muted-foreground",
                  )}
                >
                  <CalendarIcon className="mr-2 h-4 w-4" />
                  {customTo ? format(customTo, "dd MMM yyyy") : "To Date"}
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-auto p-0" align="start">
                <Calendar
                  mode="single"
                  selected={customTo}
                  onSelect={setCustomTo}
                  initialFocus
                  className="p-3 pointer-events-auto"
                />
              </PopoverContent>
            </Popover>
            {/* FIX #4: Warning when custom range is incomplete */}
            {(!customFrom || !customTo) && (
              <p className="w-full text-xs text-yellow-400/70 mt-1">
                ⚠️ Please select both From and To dates to load data.
              </p>
            )}
          </div>
        )}
      </div>

      {/* Record Counts */}
      {loading ? (
        <div className="flex items-center justify-center py-12">
          <Loader2 className="animate-spin text-primary" size={36} />
          <span className="ml-3 text-foreground/60">Fetching report data...</span>
        </div>
      ) : (
        counts && (
          <>
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
              {counts.map((c) => (
                <div
                  key={c.label}
                  className="bg-black/30 backdrop-blur-md border border-primary/20 rounded-xl p-4 text-center"
                >
                  <c.icon size={20} className="text-primary mx-auto mb-2" />
                  <p className="text-2xl font-bold text-primary">{c.count}</p>
                  <p className="text-xs text-foreground/50">{c.label}</p>
                </div>
              ))}
            </div>

            {/* Action Buttons */}
            <div className="flex flex-col sm:flex-row gap-3 justify-center">
              <Button
                onClick={handleDownload}
                className="bg-primary text-primary-foreground hover:bg-primary/90 shadow-[0_0_20px_hsl(51,100%,50%,0.3)] px-8 py-3 text-base"
                disabled={!reportData}
              >
                <Download className="mr-2" size={20} /> Download Excel Report
              </Button>
              <Button
                onClick={handlePrint}
                variant="outline"
                className="border-primary/40 text-primary hover:bg-primary/10 px-8 py-3 text-base"
                disabled={!reportData}
              >
                <Printer className="mr-2" size={20} /> Print Report
              </Button>
            </div>
          </>
        )
      )}
    </div>
  );
};

// FIX #6: autoWidth now handles empty rows gracefully — still sets column widths from header keys
function autoWidth(ws: XLSX.WorkSheet, rows: any[]) {
  const keys = rows.length > 0 ? Object.keys(rows[0]) : [];
  if (!keys.length) return;
  ws["!cols"] = keys.map((k) => {
    const maxLen = Math.max(k.length, ...rows.map((r) => String(r[k] ?? "").length));
    return { wch: Math.min(maxLen + 2, 40) };
  });
}

export default ReportPage;
