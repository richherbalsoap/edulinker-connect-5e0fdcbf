import { useState, useMemo, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { DollarSign, Trash2 } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import useAppStore from "@/store/appStore";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/context/AuthContext";

const standards = ["Nursery", "LKG", "UKG", "1", "2", "3", "4", "5", "6", "7", "8", "9", "10", "11", "12"];
const classes = ["A", "B", "C", "D", "E"];

interface FeeReminder {
  id: string;
  student_id: string;
  title: string | null;
  amount: number | null;
  school_id: string | null;
  created_by: string | null;
  created_at: string;
  student?: { id: string; name: string; standard: string; section: string };
}

const quickAmounts = [500, 1000, 2000, 5000];

const FeesReminderPage = () => {
  const { toast } = useToast();
  const { schoolId } = useAuth();
  const allStudents = useAppStore((state) => state.students);
  const [standard, setStandard] = useState("");
  const [selectedClass, setSelectedClass] = useState("");
  const [student, setStudent] = useState("");
  const [studentId, setStudentId] = useState("");
  const [title, setTitle] = useState("");
  const [amount, setAmount] = useState("");
  const [reminders, setReminders] = useState<FeeReminder[]>([]);
  const [loading, setLoading] = useState(false);

  const filteredStudents = useMemo(() => {
    return allStudents.filter((s) => {
      if (standard && selectedClass) return s.standard === standard && s.section === selectedClass;
      if (standard) return s.standard === standard;
      return true;
    });
  }, [allStudents, standard, selectedClass]);

  const fetchReminders = async () => {
    if (!schoolId) return;
    const { data } = await supabase
      .from("fees_reminders")
      .select("*, student:students(id, name, standard, section)")
      .eq("school_id", schoolId)
      .order("created_at", { ascending: false });
    if (data) setReminders(data as unknown as FeeReminder[]);
  };

  useEffect(() => {
    fetchReminders();
  }, [schoolId]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!standard || !selectedClass || !studentId || !title || !amount) {
      toast({
        title: "Incomplete Information",
        description: "Please select standard, class, student, enter a title and amount.",
        variant: "destructive",
      });
      return;
    }
    setLoading(true);
    const { error } = await supabase.from("fees_reminders").insert({
      student_id: studentId,
      title,
      message: title, // message column bhi same fill karo (DB requirement)
      amount: parseFloat(amount),
      school_id: schoolId,
    });
    setLoading(false);
    if (error) {
      toast({ title: "Error", description: error.message, variant: "destructive" });
      return;
    }
    toast({ title: "Fees Reminder Sent!", description: `Reminder sent to parent of ${student}.` });
    setStandard("");
    setSelectedClass("");
    setStudent("");
    setStudentId("");
    setTitle("");
    setAmount("");
    fetchReminders();
  };

  const handleDelete = async (id: string) => {
    await supabase.from("fees_reminders").delete().eq("id", id);
    setReminders((prev) => prev.filter((r) => r.id !== id));
    toast({ title: "Deleted", description: "Reminder deleted." });
  };

  return (
    <div className="space-y-6 px-4 py-6 relative z-10">
      <h1 className="text-3xl font-bold text-foreground text-center">Fees Reminder</h1>
      <div className="bg-black/30 backdrop-blur-md border border-primary/20 rounded-xl p-6 max-w-2xl mx-auto">
        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Standard + Class */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className="block text-sm font-medium text-primary/60 mb-2">STANDARD *</label>
              <select
                value={standard}
                onChange={(e) => {
                  setStandard(e.target.value);
                  setStudent("");
                  setStudentId("");
                }}
                required
                className="w-full px-4 py-3 bg-black border border-primary/20 rounded-lg text-foreground focus:outline-none focus:ring-2 focus:ring-primary/40"
              >
                <option value="">Select Standard</option>
                {standards.map((std) => (
                  <option key={std} value={std}>
                    {std}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-primary/60 mb-2">CLASS *</label>
              <select
                value={selectedClass}
                onChange={(e) => {
                  setSelectedClass(e.target.value);
                  setStudent("");
                  setStudentId("");
                }}
                required
                className="w-full px-4 py-3 bg-black border border-primary/20 rounded-lg text-foreground focus:outline-none focus:ring-2 focus:ring-primary/40"
              >
                <option value="">Select Class</option>
                {classes.map((cls) => (
                  <option key={cls} value={cls}>
                    {cls}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Student */}
          <div>
            <label className="block text-sm font-medium text-primary/60 mb-2">SELECT STUDENT *</label>
            {filteredStudents.length > 0 ? (
              <select
                value={studentId}
                onChange={(e) => {
                  const s = filteredStudents.find((st) => st.id === e.target.value);
                  setStudentId(e.target.value);
                  setStudent(s?.name || "");
                }}
                required
                className="w-full px-4 py-3 bg-black border border-primary/20 rounded-lg text-foreground focus:outline-none focus:ring-2 focus:ring-primary/40"
              >
                <option value="">Choose student</option>
                {filteredStudents.map((s) => (
                  <option key={s.id} value={s.id}>
                    {s.name}
                  </option>
                ))}
              </select>
            ) : (
              <p className="text-foreground/40 text-sm py-3">No students found. Add students first.</p>
            )}
          </div>

          {/* Title */}
          <div>
            <label className="block text-sm font-medium text-primary/60 mb-2">TITLE *</label>
            <input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              required
              placeholder="e.g. Monthly Fees"
              className="w-full px-4 py-3 bg-black/40 border border-primary/20 rounded-lg text-foreground placeholder:text-foreground/40 focus:outline-none focus:ring-2 focus:ring-primary/40"
            />
          </div>

          {/* Amount + Quick Amount Buttons */}
          <div>
            <label className="block text-sm font-medium text-primary/60 mb-2">AMOUNT (₹) *</label>
            <input
              type="number"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              required
              min="1"
              placeholder="Enter amount or pick below..."
              className="w-full px-4 py-3 bg-black/40 border border-primary/20 rounded-lg text-foreground placeholder:text-foreground/40 focus:outline-none focus:ring-2 focus:ring-primary/40 mb-3"
            />
            {/* Quick Amount Shortcuts */}
            <div className="flex flex-wrap gap-2">
              {quickAmounts.map((amt) => (
                <Button
                  key={amt}
                  type="button"
                  variant="outline"
                  onClick={() => setAmount(String(amt))}
                  className={`text-sm border-primary/20 hover:bg-primary/10 text-foreground/80 px-4 py-2 ${amount === String(amt) ? "bg-primary/20 border-primary" : "bg-black/40"}`}
                >
                  ₹{amt.toLocaleString()}
                </Button>
              ))}
            </div>
          </div>

          <Button
            type="submit"
            disabled={loading}
            className="w-full bg-primary hover:bg-primary/90 text-primary-foreground font-bold py-3 rounded-lg shadow-[0_0_20px_hsl(51,100%,50%,0.3)] flex items-center justify-center gap-2"
          >
            <DollarSign size={20} /> {loading ? "Sending..." : "Send Reminder"}
          </Button>
        </form>
      </div>

      {/* Sent Reminders History */}
      {reminders.length > 0 && (
        <div className="max-w-2xl mx-auto space-y-4">
          <h2 className="text-xl font-bold text-foreground">Sent Reminders</h2>
          <div className="space-y-3">
            {reminders.map((r) => (
              <div
                key={r.id}
                className="bg-black/30 backdrop-blur-md border border-primary/20 rounded-xl p-4 flex items-start justify-between gap-4"
              >
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2 flex-wrap mb-1">
                    <span className="font-bold text-foreground">{r.student?.name || "Unknown"}</span>
                    {r.student && (
                      <span className="text-xs bg-primary/10 text-primary/80 px-2 py-0.5 rounded border border-primary/20">
                        Class {r.student.standard} - {r.student.section}
                      </span>
                    )}
                  </div>
                  <p className="text-foreground font-semibold text-sm">{r.title || "—"}</p>
                  {r.amount && r.amount > 0 && (
                    <p className="text-green-400 font-bold text-base mt-1">₹{r.amount.toLocaleString()}</p>
                  )}
                  <p className="text-foreground/40 text-xs mt-1">{new Date(r.created_at).toLocaleString()}</p>
                </div>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => handleDelete(r.id)}
                  className="text-destructive hover:bg-destructive/10 flex-shrink-0"
                >
                  <Trash2 size={16} />
                </Button>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

export default FeesReminderPage;
