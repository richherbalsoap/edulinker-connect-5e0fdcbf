import { useState, useRef, useEffect } from "react";
import { Bot, Send, User, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import useAppStore from "@/store/appStore";
import { useAuth } from "@/context/AuthContext";

const AIChatbotPage = () => {
  const { schoolId } = useAuth(); // Fix 1: schoolId se fetch karo
  const results = useAppStore((state) => state.results);
  const students = useAppStore((state) => state.students);
  const fetchAll = useAppStore((state) => state.fetchAll);
  const [dataLoading, setDataLoading] = useState(true); // Fix 4: loading state

  // Fix 1 & 3: schoolId dependency add kiya, bina schoolId ke fetch nahi hoga
  useEffect(() => {
    if (!schoolId) return;
    setDataLoading(true);
    fetchAll(schoolId).finally(() => setDataLoading(false));
  }, [schoolId]);

  const [messages, setMessages] = useState([
    {
      id: 1,
      text: "Hello! I'm your AI assistant. Ask me about any student's marks, class performance, or school data.\n\nTry:\n• Student name — e.g. 'Rahul'\n• 'all students'\n• 'all results'\n• 'class 10A results'\n• 'top students'\n• 'failed students'\n• 'Math results'\n• 'average marks'",
      sender: "bot",
      timestamp: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
    },
  ]);
  const [inputValue, setInputValue] = useState("");
  const [botTyping, setBotTyping] = useState(false);
  const chatContainerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (chatContainerRef.current) chatContainerRef.current.scrollTop = chatContainerRef.current.scrollHeight;
  }, [messages, botTyping]);

  // Fix 5: Smart query handler with more capabilities
  const findStudentResults = (query: string): string => {
    const q = query.toLowerCase().trim();

    // All students
    if (q === "all students" || q === "list students") {
      if (students.length === 0) return "No students have been added yet.";
      let res = `${students.length} students registered:\n\n`;
      students.forEach((s) => {
        res += `• ${s.name} — Class ${s.standard}-${s.section}\n`;
      });
      return res;
    }

    // All results summary
    if (q === "all results" || q === "results summary") {
      if (results.length === 0) return "No results have been recorded yet.";
      let res = `${results.length} result records:\n\n`;
      results.forEach((r) => {
        const name = r.student?.name || "Unknown";
        res += `• ${name}: ${r.subject} — ${r.marks_obtained}/${r.total_marks} (${r.percentage}%)\n`;
      });
      return res;
    }

    // Class-wise results — e.g. "class 10a" or "10 a" or "10-a"
    const classMatch = q.match(/class\s*(\w+)[\s-]*([a-e])?/i) || q.match(/^(\d+|nursery|lkg|ukg)[\s-]*([a-e])?$/i);
    if (classMatch) {
      const std = classMatch[1];
      const sec = classMatch[2]?.toUpperCase();
      const filtered = results.filter((r) => {
        const s = r.student;
        if (!s) return false;
        const stdMatch = s.standard?.toLowerCase() === std.toLowerCase();
        const secMatch = sec ? s.section?.toUpperCase() === sec : true;
        return stdMatch && secMatch;
      });
      if (filtered.length === 0) return `No results found for Class ${std}${sec ? "-" + sec : ""}.`;
      let res = `Results for Class ${std}${sec ? "-" + sec : ""}:\n\n`;
      filtered.forEach((r) => {
        res += `• ${r.student?.name}: ${r.subject} — ${r.marks_obtained}/${r.total_marks} (${r.percentage}%)\n`;
      });
      return res;
    }

    // Top students — highest average percentage
    if (q.includes("top") || q.includes("best") || q.includes("topper")) {
      if (results.length === 0) return "No results available yet.";
      const avgMap: Record<string, { name: string; total: number; count: number }> = {};
      results.forEach((r) => {
        const id = r.student_id;
        const name = r.student?.name || "Unknown";
        if (!avgMap[id]) avgMap[id] = { name, total: 0, count: 0 };
        avgMap[id].total += r.percentage || 0;
        avgMap[id].count += 1;
      });
      const sorted = Object.values(avgMap)
        .map((x) => ({ name: x.name, avg: Math.round(x.total / x.count) }))
        .sort((a, b) => b.avg - a.avg)
        .slice(0, 5);
      let res = `Top 5 Students by Average:\n\n`;
      sorted.forEach((s, i) => {
        res += `${i + 1}. ${s.name} — ${s.avg}%\n`;
      });
      return res;
    }

    // Failed students — below 35%
    if (q.includes("fail") || q.includes("below")) {
      const failed = results.filter((r) => (r.percentage || 0) < 35);
      if (failed.length === 0) return "No students have failed any subject. 🎉";
      let res = `Students below 35%:\n\n`;
      failed.forEach((r) => {
        res += `• ${r.student?.name || "Unknown"}: ${r.subject} — ${r.percentage}%\n`;
      });
      return res;
    }

    // Subject-wise results — e.g. "math results" or "science"
    const subjects = [...new Set(results.map((r) => r.subject?.toLowerCase()))];
    const matchedSubject = subjects.find((s) => s && q.includes(s));
    if (matchedSubject) {
      const subResults = results.filter((r) => r.subject?.toLowerCase() === matchedSubject);
      const avg = Math.round(subResults.reduce((s, r) => s + (r.percentage || 0), 0) / subResults.length);
      let res = `${matchedSubject.charAt(0).toUpperCase() + matchedSubject.slice(1)} Results (${subResults.length} records, avg: ${avg}%):\n\n`;
      subResults.forEach((r) => {
        res += `• ${r.student?.name || "Unknown"}: ${r.marks_obtained}/${r.total_marks} (${r.percentage}%)\n`;
      });
      return res;
    }

    // Average marks overall
    if (q.includes("average") || q.includes("avg")) {
      if (results.length === 0) return "No results available yet.";
      const avg = Math.round(results.reduce((s, r) => s + (r.percentage || 0), 0) / results.length);
      return `Overall school average: ${avg}% across ${results.length} result records.`;
    }

    // Fix 2: Student name search — r.student check properly
    const matchingResults = results.filter((r) => r.student?.name?.toLowerCase().includes(q));
    if (matchingResults.length > 0) {
      const grouped: Record<string, typeof matchingResults> = {};
      matchingResults.forEach((r) => {
        const name = r.student?.name || "Unknown";
        if (!grouped[name]) grouped[name] = [];
        grouped[name].push(r);
      });
      let res = "";
      Object.entries(grouped).forEach(([name, recs]) => {
        const student = recs[0].student;
        const avg = Math.round(recs.reduce((s, r) => s + (r.percentage || 0), 0) / recs.length);
        res += `📊 ${name} (Class ${student?.standard}-${student?.section}) — Avg: ${avg}%\n`;
        recs.forEach((r) => {
          res += `  • ${r.subject}: ${r.marks_obtained}/${r.total_marks} (${r.percentage}%)\n`;
        });
        res += "\n";
      });
      return res.trim();
    }

    // Student exists but no results
    const matchingStudent = students.find((s) => s.name?.toLowerCase().includes(q));
    if (matchingStudent) {
      return `Found: ${matchingStudent.name} (Class ${matchingStudent.standard}-${matchingStudent.section})\n\nNo result records found for this student yet.`;
    }

    return `Sorry, couldn't find anything for "${query}".\n\nTry:\n• Student name\n• 'all students'\n• 'all results'\n• 'class 10A'\n• 'top students'\n• 'failed students'\n• Subject name like 'Math'\n• 'average marks'`;
  };

  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!inputValue.trim() || botTyping) return;

    const userMessage = {
      id: messages.length + 1,
      text: inputValue,
      sender: "user",
      timestamp: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
    };
    setMessages((prev) => [...prev, userMessage]);
    const query = inputValue;
    setInputValue("");
    setBotTyping(true);

    await new Promise((resolve) => setTimeout(resolve, 500));

    const botResponse = findStudentResults(query);
    setMessages((prev) => [
      ...prev,
      {
        id: prev.length + 1,
        text: botResponse,
        sender: "bot",
        timestamp: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
      },
    ]);
    setBotTyping(false);
  };

  return (
    <div className="space-y-6 relative z-10 px-4 py-6">
      <h1 className="text-3xl font-bold text-foreground text-center">AI Insight Chatbot</h1>

      {dataLoading && (
        <div className="flex items-center justify-center gap-2 text-primary/60 text-sm">
          <Loader2 size={16} className="animate-spin" />
          Loading school data...
        </div>
      )}

      <div
        className="bg-black/30 backdrop-blur-md border border-primary/20 rounded-xl overflow-hidden flex flex-col max-w-4xl mx-auto"
        style={{ height: "calc(100vh - 250px)", minHeight: "500px" }}
      >
        <div ref={chatContainerRef} className="flex-1 overflow-y-auto p-6 space-y-4">
          {messages.map((message) => (
            <div key={message.id} className={`flex ${message.sender === "user" ? "justify-end" : "justify-start"}`}>
              <div className={`flex gap-3 max-w-[80%] ${message.sender === "user" ? "flex-row-reverse" : "flex-row"}`}>
                <div
                  className={`flex-shrink-0 w-8 h-8 rounded-full flex items-center justify-center ${message.sender === "bot" ? "bg-primary/20 border border-primary/30" : "bg-foreground/10 border border-foreground/20"}`}
                >
                  {message.sender === "bot" ? (
                    <Bot size={18} className="text-primary" />
                  ) : (
                    <User size={18} className="text-foreground" />
                  )}
                </div>
                <div>
                  <div
                    className={`rounded-2xl px-4 py-3 ${message.sender === "bot" ? "bg-black/40 border border-primary/10" : "bg-primary/15 border border-primary/25"}`}
                  >
                    <p className="text-foreground text-sm leading-relaxed" style={{ whiteSpace: "pre-wrap" }}>
                      {message.text}
                    </p>
                  </div>
                  <p className="text-foreground/40 text-xs mt-1 px-2">{message.timestamp}</p>
                </div>
              </div>
            </div>
          ))}

          {/* Fix 4: Bot typing indicator */}
          {botTyping && (
            <div className="flex justify-start">
              <div className="flex gap-3 max-w-[80%]">
                <div className="flex-shrink-0 w-8 h-8 rounded-full flex items-center justify-center bg-primary/20 border border-primary/30">
                  <Bot size={18} className="text-primary" />
                </div>
                <div className="bg-black/40 border border-primary/10 rounded-2xl px-4 py-3">
                  <div className="flex gap-1 items-center h-4">
                    <span
                      className="w-2 h-2 bg-primary/50 rounded-full animate-bounce"
                      style={{ animationDelay: "0s" }}
                    />
                    <span
                      className="w-2 h-2 bg-primary/50 rounded-full animate-bounce"
                      style={{ animationDelay: "0.15s" }}
                    />
                    <span
                      className="w-2 h-2 bg-primary/50 rounded-full animate-bounce"
                      style={{ animationDelay: "0.3s" }}
                    />
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>

        <div className="border-t border-primary/20 p-4">
          <form onSubmit={handleSendMessage} className="flex gap-3">
            <input
              type="text"
              value={inputValue}
              onChange={(e) => setInputValue(e.target.value)}
              placeholder="Student name, 'top students', 'class 10A', subject name..."
              disabled={dataLoading}
              className="flex-1 px-4 py-3 bg-black/40 border border-primary/20 rounded-lg text-foreground placeholder:text-foreground/40 focus:outline-none focus:ring-2 focus:ring-primary/40 disabled:opacity-50"
            />
            <Button
              type="submit"
              disabled={!inputValue.trim() || botTyping || dataLoading}
              className="bg-primary hover:bg-primary/90 text-primary-foreground font-bold px-6 rounded-lg shadow-[0_0_20px_hsl(51,100%,50%,0.3)]"
            >
              <Send size={20} />
            </Button>
          </form>
        </div>
      </div>
    </div>
  );
};

export default AIChatbotPage;
