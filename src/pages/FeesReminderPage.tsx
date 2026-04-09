import { useState, useMemo, useEffect, useRef } from "react";
import { Button } from "@/components/ui/button";
import { DollarSign, Trash2, AlertTriangle, Filter, Upload, QrCode, CheckCircle, X } from "lucide-react";
import jsQR from "jsqr";
import { useToast } from "@/hooks/use-toast";
import useAppStore from "@/store/appStore";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/context/AuthContext";
import { sendNotification } from "@/utils/sendNotification";

const standards = ["Nursery", "LKG", "UKG", "1", "2", "3", "4", "5", "6", "7", "8", "9", "10", "11", "12"];
const sections = ["A", "B", "C", "D", "E"];

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

const ConfirmDialog = ({
  open,
  title,
  message,
  confirmLabel = "Confirm",
  danger = false,
  onConfirm,
  onCancel,
}: {
  open: boolean;
  title: string;
  message: string;
  confirmLabel?: string;
  danger?: boolean;
  onConfirm: () => void;
  onCancel: () => void;
}) => {
  if (!open) return null;
  return (
    <div className="fixed inset-0 bg-black/70 z-50 flex items-center justify-center p-4" onClick={onCancel}>
      <div
        className="bg-black/90 backdrop-blur-2xl rounded-2xl p-6 w-full max-w-sm border border-primary/30"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center gap-3 mb-3">
          <AlertTriangle size={20} className={danger ? "text-destructive" : "text-primary"} />
          <h3 className="text-lg font-bold text-foreground">{title}</h3>
        </div>
        <p className="text-foreground/70 text-sm mb-6">{message}</p>
        <div className="flex gap-3">
          <Button
            onClick={onCancel}
            className="flex-1 bg-black/40 hover:bg-black/60 text-foreground border border-primary/20"
          >
            Cancel
          </Button>
          <Button
            onClick={onConfirm}
            className={`flex-1 font-bold ${danger ? "bg-destructive hover:bg-destructive/80 text-white" : "bg-primary hover:bg-primary/90 text-primary-foreground"}`}
          >
            {confirmLabel}
          </Button>
        </div>
      </div>
    </div>
  );
};

const FeesReminderPage = () => {
  const { toast } = useToast();
  const { schoolId } = useAuth();
  const allStudents = useAppStore((state) => state.students);

  const [standard, setStandard] = useState("");
  const [selectedSection, setSelectedSection] = useState("");
  const [studentName, setStudentName] = useState("");
  const [studentId, setStudentId] = useState("");
  const [title, setTitle] = useState("");
  const [amount, setAmount] = useState("");
  const [loading, setLoading] = useState(false);
  const [reminders, setReminders] = useState<FeeReminder[]>([]);
  const [filterStandard, setFilterStandard] = useState("");
  const [filterSection, setFilterSection] = useState("");
  const [filterName, setFilterName] = useState("");

  // QR states
  const [qrUrl, setQrUrl] = useState<string | null>(null);
  const [qrUploading, setQrUploading] = useState(false);
  const [schoolDbId, setSchoolDbId] = useState<string | null>(null);

  const [confirm, setConfirm] = useState<{
    open: boolean;
    title: string;
    message: string;
    confirmLabel: string;
    danger: boolean;
    onConfirm: () => void;
  }>({ open: false, title: "", message: "", confirmLabel: "Confirm", danger: false, onConfirm: () => {} });

  const filteredStudents = useMemo(() => {
    return allStudents.filter((s) => {
      if (standard && selectedSection) return s.standard === standard && s.section === selectedSection;
      if (standard) return s.standard === standard;
      return true;
    });
  }, [allStudents, standard, selectedSection]);

  const fetchReminders = async () => {
    if (!schoolId) return;
    const { data } = await supabase
      .from("fees_reminders")
      .select("*, student:students(id, name, standard, section)")
      .eq("school_id", schoolId)
      .order("created_at", { ascending: false });
    if (data) setReminders(data as unknown as FeeReminder[]);
  };

  const fetchSchoolQR = async () => {
    if (!schoolId) return;
    const { data } = await (supabase.from("schools") as any).select("id, payment_qr_url").eq("id", schoolId).single();
    if (data) {
      setSchoolDbId(data.id);
      setQrUrl(data.payment_qr_url || null);
    }
  };

  useEffect(() => {
    fetchReminders();
    fetchSchoolQR();
  }, [schoolId]);

  const filteredReminders = useMemo(() => {
    return reminders.filter((r) => {
      const std = r.student?.standard || "";
      const sec = r.student?.section || "";
      const name = r.student?.name?.toLowerCase() || "";
      if (filterStandard && std !== filterStandard) return false;
      if (filterSection && sec !== filterSection) return false;
      if (filterName && !name.includes(filterName.toLowerCase())) return false;
      return true;
    });
  }, [reminders, filterStandard, filterSection, filterName]);

  const handleQRUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !schoolId) return;

    if (!file.type.startsWith("image/")) {
      toast({ title: "Invalid file", description: "Please upload an image file.", variant: "destructive" });
      return;
    }

    setQrUploading(true);

    // School-specific path — purana QR overwrite ho jayega
    const ext = file.name.split(".").pop();
    const filePath = `payment-qr/${schoolId}/qr.${ext}`;

    const { error: uploadError } = await supabase.storage
      .from("edulinker-files")
      .upload(filePath, file, { upsert: true });

    if (uploadError) {
      toast({ title: "Upload failed", description: uploadError.message, variant: "destructive" });
      setQrUploading(false);
      return;
    }

    const { data: urlData } = supabase.storage.from("edulinker-files").getPublicUrl(filePath);

    const publicUrl = urlData.publicUrl;

    // schools table mein save karo
    const { error: updateError } = await (supabase.from("schools") as any)
      .update({ payment_qr_url: publicUrl })
      .eq("id", schoolId);

    if (updateError) {
      toast({ title: "Save failed", description: updateError.message, variant: "destructive" });
      setQrUploading(false);
      return;
    }

    setQrUrl(publicUrl);
    setQrUploading(false);
    toast({ title: "QR Saved! ✅", description: "Students fees page mein 'Pay Now' button dikhega." });
  };

  const handleRemoveQR = async () => {
    if (!schoolId) return;
    await (supabase.from("schools") as any).update({ payment_qr_url: null }).eq("id", schoolId);
    setQrUrl(null);
    toast({ title: "QR Removed", description: "Payment QR hata diya gaya." });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!standard || !selectedSection || !studentId || !title || !amount) {
      toast({
        title: "Incomplete Information",
        description: "Please fill all required fields.",
        variant: "destructive",
      });
      return;
    }
    setLoading(true);
    const { error } = await supabase.from("fees_reminders").insert({
      student_id: studentId,
      title,
      message: title,
      amount: parseFloat(amount),
      school_id: schoolId,
    });
    setLoading(false);
    if (error) {
      toast({ title: "Error", description: error.message, variant: "destructive" });
      return;
    }

    await sendNotification("fees", {
      student_id: studentId,
      title,
      message: `Please pay ₹${parseFloat(amount).toLocaleString()} for ${title}`,
    });

    toast({ title: "Fees Reminder Sent!", description: `Reminder sent for ${studentName}.` });
    setStandard("");
    setSelectedSection("");
    setStudentName("");
    setStudentId("");
    setTitle("");
    setAmount("");
    fetchReminders();
  };

  const handleDelete = (id: string, name: string) => {
    setConfirm({
      open: true,
      title: "Delete Reminder",
      message: `Delete this reminder for ${name}? This cannot be undone.`,
      confirmLabel: "Delete",
      danger: true,
      onConfirm: async () => {
        setConfirm((c) => ({ ...c, open: false }));
        await supabase.from("fees_reminders").delete().eq("id", id);
        setReminders((prev) => prev.filter((r) => r.id !== id));
        toast({ title: "Deleted", description: "Reminder deleted.", variant: "destructive" });
      },
    });
  };

  const handleDeleteAll = () => {
    const count = filteredReminders.length;
    if (count === 0) return;
    setConfirm({
      open: true,
      title: "Delete All Reminders",
      message: `Are you sure you want to delete ${count} reminder${count > 1 ? "s" : ""}? This cannot be undone.`,
      confirmLabel: `Delete All (${count})`,
      danger: true,
      onConfirm: async () => {
        setConfirm((c) => ({ ...c, open: false }));
        const ids = filteredReminders.map((r) => r.id);
        await supabase.from("fees_reminders").delete().in("id", ids);
        setReminders((prev) => prev.filter((r) => !ids.includes(r.id)));
        toast({
          title: "All Deleted",
          description: `${count} reminder${count > 1 ? "s" : ""} deleted.`,
          variant: "destructive",
        });
      },
    });
  };

  return (
    <div className="space-y-6 relative z-10 px-4 py-6">
      <ConfirmDialog {...confirm} onCancel={() => setConfirm((c) => ({ ...c, open: false }))} />

      <h1 className="text-3xl font-bold text-foreground text-center">Fees Reminder</h1>

      {/* ── Payment QR Section ── */}
      <div className="max-w-2xl mx-auto">
        <div className="bg-black/30 backdrop-blur-md border border-primary/20 rounded-xl p-5">
          <div className="flex items-center gap-2 mb-1">
            <QrCode size={20} className="text-primary" />
            <h2 className="text-lg font-bold text-foreground">Payment QR Code</h2>
            {qrUrl && <CheckCircle size={16} className="text-green-400" />}
          </div>
          <p className="text-foreground/40 text-xs mb-4">
            School ka GPay / PhonePe / Bank QR upload karo — students fees page mein scan karke directly pay kar sakte
            hain.
          </p>

          <div className="flex flex-col sm:flex-row gap-4 items-start">
            {/* QR Preview */}
            {qrUrl && (
              <div className="flex flex-col items-center gap-2">
                <div className="border-2 border-primary/30 rounded-xl p-2 bg-white">
                  <img src={qrUrl} alt="Payment QR" className="w-28 h-28 object-contain" />
                </div>
                <button
                  onClick={handleRemoveQR}
                  className="text-xs text-destructive/70 hover:text-destructive underline"
                >
                  Remove QR
                </button>
              </div>
            )}

            {/* Upload Button */}
            <div className="flex-1">
              <label className="cursor-pointer block">
                <div
                  className={`flex items-center gap-3 px-4 py-4 rounded-xl border-2 border-dashed transition-all
                    ${
                      qrUploading
                        ? "border-primary/30 bg-primary/5 cursor-not-allowed"
                        : "border-primary/40 hover:border-primary bg-black/20 hover:bg-primary/5 cursor-pointer"
                    }`}
                >
                  <Upload size={18} className="text-primary flex-shrink-0" />
                  <div>
                    <p className="text-foreground/80 text-sm font-medium">
                      {qrUploading ? "Uploading..." : qrUrl ? "Change QR Image" : "Upload QR Image"}
                    </p>
                    <p className="text-foreground/30 text-xs mt-0.5">PNG, JPG • GPay / PhonePe / Bank QR</p>
                  </div>
                </div>
                <input
                  type="file"
                  accept="image/*"
                  onChange={handleQRUpload}
                  disabled={qrUploading}
                  className="hidden"
                />
              </label>
            </div>
          </div>
        </div>
      </div>

      {/* ── Send Reminder Form ── */}
      <div className="max-w-2xl mx-auto bg-black/30 backdrop-blur-md border border-primary/20 rounded-xl p-6">
        <h2 className="text-xl font-bold text-foreground mb-6 flex items-center gap-2">
          <DollarSign size={20} className="text-primary" /> Send Fee Reminder
        </h2>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-primary/60 mb-2">STANDARD *</label>
              <select
                value={standard}
                onChange={(e) => {
                  setStandard(e.target.value);
                  setStudentName("");
                  setStudentId("");
                }}
                required
                className="w-full px-4 py-3 bg-black border border-primary/20 rounded-lg text-foreground focus:outline-none focus:ring-2 focus:ring-primary/40"
              >
                <option value="">Select Standard</option>
                {standards.map((s) => (
                  <option key={s} value={s}>
                    {s}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-primary/60 mb-2">SECTION *</label>
              <select
                value={selectedSection}
                onChange={(e) => {
                  setSelectedSection(e.target.value);
                  setStudentName("");
                  setStudentId("");
                }}
                required
                className="w-full px-4 py-3 bg-black border border-primary/20 rounded-lg text-foreground focus:outline-none focus:ring-2 focus:ring-primary/40"
              >
                <option value="">Select Section</option>
                {sections.map((s) => (
                  <option key={s} value={s}>
                    {s}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-primary/60 mb-2">SELECT STUDENT *</label>
            {filteredStudents.length > 0 ? (
              <select
                value={studentId}
                onChange={(e) => {
                  const s = filteredStudents.find((st) => st.id === e.target.value);
                  setStudentId(e.target.value);
                  setStudentName(s?.name || "");
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
              <p className="text-foreground/40 text-sm py-3">No students found. Select standard & section first.</p>
            )}
          </div>

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

      {/* ── Sent Reminders List ── */}
      {reminders.length > 0 && (
        <div className="max-w-2xl mx-auto space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-xl font-bold text-foreground">Sent Reminders ({filteredReminders.length})</h2>
            {filteredReminders.length > 0 && (
              <Button
                onClick={handleDeleteAll}
                variant="ghost"
                className="text-destructive hover:bg-destructive/10 border border-destructive/20 text-sm font-bold gap-2"
              >
                <Trash2 size={15} /> Delete All
              </Button>
            )}
          </div>

          <div className="bg-black/20 border border-primary/15 rounded-xl p-4 space-y-3">
            <div className="flex items-center gap-2 text-primary/60 text-xs font-bold">
              <Filter size={13} /> FILTER REMINDERS
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <select
                value={filterStandard}
                onChange={(e) => setFilterStandard(e.target.value)}
                className="w-full px-3 py-2 bg-black/40 border border-primary/20 rounded-lg text-foreground text-sm focus:outline-none focus:ring-2 focus:ring-primary/40"
              >
                <option value="">All Standards</option>
                {standards.map((s) => (
                  <option key={s} value={s}>
                    {s}
                  </option>
                ))}
              </select>
              <select
                value={filterSection}
                onChange={(e) => setFilterSection(e.target.value)}
                className="w-full px-3 py-2 bg-black/40 border border-primary/20 rounded-lg text-foreground text-sm focus:outline-none focus:ring-2 focus:ring-primary/40"
              >
                <option value="">All Sections</option>
                {sections.map((s) => (
                  <option key={s} value={s}>
                    {s}
                  </option>
                ))}
              </select>
              <input
                type="text"
                value={filterName}
                onChange={(e) => setFilterName(e.target.value)}
                placeholder="Search student name..."
                className="w-full px-3 py-2 bg-black/40 border border-primary/20 rounded-lg text-foreground placeholder:text-foreground/40 text-sm focus:outline-none focus:ring-2 focus:ring-primary/40"
              />
            </div>
            {(filterStandard || filterSection || filterName) && (
              <button
                onClick={() => {
                  setFilterStandard("");
                  setFilterSection("");
                  setFilterName("");
                }}
                className="text-xs text-primary/60 hover:text-primary underline"
              >
                Clear filters
              </button>
            )}
          </div>

          {filteredReminders.length === 0 ? (
            <p className="text-foreground/40 text-sm text-center py-6">No reminders match the selected filters.</p>
          ) : (
            <div className="space-y-3">
              {filteredReminders.map((r) => (
                <div
                  key={r.id}
                  className="bg-black/30 backdrop-blur-md border border-primary/20 rounded-xl p-4 flex items-start justify-between gap-4"
                >
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2 flex-wrap mb-1">
                      <span className="font-bold text-foreground">{r.student?.name || "Unknown"}</span>
                      {r.student && (
                        <span className="text-xs bg-primary/10 text-primary/80 px-2 py-0.5 rounded border border-primary/20">
                          Class {r.student.standard}-{r.student.section}
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
                    onClick={() => handleDelete(r.id, r.student?.name || "this student")}
                    className="text-destructive hover:bg-destructive/10 flex-shrink-0"
                  >
                    <Trash2 size={16} />
                  </Button>
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default FeesReminderPage;
