import { useState, useMemo, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { Plus, Edit, Trash2, X, Upload, User, Phone, Key, FileUp, DollarSign, ShieldAlert } from "lucide-react";
import ImportStudentsModal from "@/components/ImportStudentsModal";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import useAppStore from "@/store/appStore";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/context/AuthContext";

const standards = ["Nursery", "LKG", "UKG", "1", "2", "3", "4", "5", "6", "7", "8", "9", "10", "11", "12"];
const sections = ["A", "B", "C", "D", "E"];

const getSortableClassIndex = (classVal: string) => {
  const standard = classVal.replace("Class ", "");
  const index = standards.indexOf(standard);
  return index === -1 ? Infinity : index;
};

const StudentModal = ({ isOpen, onClose, onSave, student }: any) => {
  const { toast } = useToast();
  const [formData, setFormData] = useState(
    student
      ? {
          name: student.name,
          standard: student.standard,
          section: student.section,
          roll_no: student.roll_no?.toString() || "",
          parent_name: student.parent_name || "",
          parent_contact: student.parent_contact || "",
          avatar_url: student.avatar_url || null,
        }
      : { name: "", standard: "", section: "", roll_no: "", parent_name: "", parent_contact: "", avatar_url: null },
  );
  const [fileName, setFileName] = useState("");
  const [keyMode, setKeyMode] = useState<"auto" | "manual">("auto");
  const [manualKey, setManualKey] = useState("");
  const [keyError, setKeyError] = useState("");
  const [keyFound, setKeyFound] = useState(false);

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files?.[0]) {
      const file = e.target.files[0];
      const allowedTypes = ["image/jpeg", "image/png", "image/webp"];
      if (!allowedTypes.includes(file.type)) {
        alert("Only JPEG, PNG, and WebP images are allowed.");
        return;
      }
      if (file.size > 7 * 1024 * 1024) {
        alert("File size must be under 7MB.");
        return;
      }
      const {
        data: { user: currentUser },
      } = await supabase.auth.getUser();
      if (!currentUser) {
        alert("Not authenticated");
        return;
      }
      const ext = file.name.split(".").pop() || "jpg";
      const filePath = `${currentUser.id}/avatars/${crypto.randomUUID()}.${ext}`;
      const { error } = await supabase.storage
        .from("edulinker-files")
        .upload(filePath, file, { contentType: file.type, upsert: false });
      if (error) {
        alert("Upload failed: " + error.message);
        return;
      }
      const { data: signedData } = await supabase.storage
        .from("edulinker-files")
        .createSignedUrl(filePath, 60 * 60 * 24 * 365);
      setFileName(file.name);
      setFormData((prev: any) => ({ ...prev, avatar_url: signedData?.signedUrl ?? null }));
    }
  };

  const validateManualKey = (key: string) => {
    if (key.length < 8 || key.length > 20) return "Key must be 8–20 characters.";
    if (/\s/.test(key)) return "Key must not contain spaces.";
    if (!/^[A-Z0-9\-]+$/.test(key)) return "Only uppercase letters, numbers, and dashes allowed.";
    return "";
  };

  const scanKey = async (key: string) => {
    if (!key || key.length < 5) {
      setKeyError("Key too short to scan.");
      return;
    }

    // Try multiple formats: as-is, with dashes added (EDU-XXXXX-XXXXX), and without dashes
    const keyNoDashes = key.replace(/-/g, "");
    const candidates = [key];
    
    // If key has no dashes and starts with EDU, try adding dashes in EDU-XXXXX-XXXXX format
    if (!key.includes("-") && keyNoDashes.startsWith("EDU") && keyNoDashes.length >= 13) {
      const formatted = `EDU-${keyNoDashes.slice(3, 8)}-${keyNoDashes.slice(8, 13)}`;
      candidates.push(formatted);
    }
    // If key has dashes, also try without
    if (key.includes("-")) {
      candidates.push(keyNoDashes);
    }

    let found = null;
    let matchedKey = key;

    for (const candidate of candidates) {
      const { data } = await supabase
        .from("students")
        .select("name, standard, section, roll_no, parent_name, parent_contact, avatar_url, secret_id")
        .eq("secret_id", candidate)
        .maybeSingle();
      if (data) {
        found = data;
        matchedKey = candidate;
        break;
      }
    }

    if (found) {
      setManualKey(found.secret_id || matchedKey);
      setFormData({
        name: found.name || "",
        standard: found.standard || "",
        section: found.section || "",
        roll_no: found.roll_no?.toString() || "",
        parent_name: found.parent_name || "",
        parent_contact: found.parent_contact || "",
        avatar_url: found.avatar_url || null,
      });
      setKeyFound(true);
      setKeyError("");
      toast({ title: "Student Found! ✅", description: `"${found.name}" — Class ${found.standard}-${found.section}. Details auto-filled.` });
    } else {
      setKeyFound(false);
      setKeyError("No student found with this key. You can add as a new student.");
    }
  };

  const handleSave = async () => {
    const rollNum = parseInt(formData.roll_no, 10);
    if (!rollNum || rollNum <= 0) {
      toast({ title: "Error", description: "Roll number must be a positive number.", variant: "destructive" });
      return;
    }
    if (keyMode === "manual" && !student) {
      const err = validateManualKey(manualKey);
      if (err) {
        setKeyError(err);
        return;
      }
      if (!keyFound) {
        // Only check duplicates within SAME school — other schools can reuse the key
        const { data: existing } = await supabase
          .from("students")
          .select("id, name, standard, section, school_id")
          .eq("secret_id", manualKey)
          .maybeSingle();
        if (existing && (existing as any).school_id === schoolId) {
          setKeyError(`This key is already assigned to "${existing.name}" in Class ${existing.standard}-${existing.section}. Use a different key.`);
          return;
        }
        // Archive check: only block if archived by THIS school
        const { data: archived } = await supabase
          .from("student_keys_archive")
          .select("id, school_id")
          .eq("secret_id", manualKey)
          .eq("school_id", schoolId)
          .maybeSingle();
        if (archived) {
          setKeyError("This key was previously used in your school and is permanently reserved.");
          return;
        }
      }
    }
    onSave({ ...formData, roll_no: rollNum }, keyMode === "manual" && !student ? manualKey : null);
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/70 z-50 flex justify-center items-center p-4" onClick={onClose}>
      <div
        className="bg-black/90 backdrop-blur-2xl rounded-2xl p-6 sm:p-8 w-full max-w-md border border-primary/30 relative max-h-[90vh] overflow-y-auto"
        onClick={(e) => e.stopPropagation()}
      >
        <h2 className="text-2xl font-bold text-primary mb-6">{student ? "Edit Student" : "Add Student"}</h2>
        <Button
          onClick={onClose}
          className="absolute top-4 right-4 bg-transparent hover:bg-primary/10 p-2 h-auto rounded-full"
        >
          <X className="text-foreground/70" size={20} />
        </Button>
        <div className="space-y-5">
          <div className="flex flex-col items-center space-y-3">
            <div className="w-28 h-28 rounded-full bg-black/40 border-2 border-dashed border-primary/30 flex items-center justify-center overflow-hidden">
              {formData.avatar_url ? (
                <img src={formData.avatar_url} alt="avatar" className="w-full h-full object-cover" />
              ) : (
                <User size={48} className="text-primary/40" />
              )}
            </div>
            <div className="relative">
              <Button
                asChild
                variant="outline"
                className="bg-black/40 border-primary/20 hover:bg-primary/10 text-foreground/80"
              >
                <div>
                  <Upload size={16} className="mr-2" /> Upload Photo
                </div>
              </Button>
              <input
                type="file"
                onChange={handleFileChange}
                className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
              />
            </div>
            {fileName && <p className="text-xs text-foreground/50">{fileName}</p>}
          </div>
          <input
            type="text"
            placeholder="Name"
            value={formData.name}
            onChange={(e) => setFormData({ ...formData, name: e.target.value })}
            className="w-full p-3 bg-black/40 rounded-lg text-foreground placeholder:text-foreground/40 border border-primary/20 focus:outline-none focus:ring-2 focus:ring-primary/40"
          />
          <div className="grid grid-cols-2 gap-4">
            <Select
              value={formData.standard}
              onValueChange={(value) => setFormData((prev: any) => ({ ...prev, standard: value }))}
            >
              <SelectTrigger className="w-full p-3 bg-black/40 rounded-lg text-foreground border border-primary/20">
                <SelectValue placeholder="Standard" />
              </SelectTrigger>
              <SelectContent className="bg-black border border-primary/20 max-h-60 overflow-y-auto">
                {standards.map((s) => (
                  <SelectItem key={s} value={s} className="text-foreground focus:bg-primary/10 focus:text-primary">
                    {s}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Select
              value={formData.section}
              onValueChange={(value) => setFormData((prev: any) => ({ ...prev, section: value }))}
            >
              <SelectTrigger className="w-full p-3 bg-black/40 rounded-lg text-foreground border border-primary/20">
                <SelectValue placeholder="Section" />
              </SelectTrigger>
              <SelectContent className="bg-black border border-primary/20 max-h-60 overflow-y-auto">
                {sections.map((s) => (
                  <SelectItem key={s} value={s} className="text-foreground focus:bg-primary/10 focus:text-primary">
                    {s}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <input
            type="number"
            placeholder="Roll No."
            min="1"
            value={formData.roll_no}
            onChange={(e) => setFormData({ ...formData, roll_no: e.target.value })}
            className="w-full p-3 bg-black/40 rounded-lg text-foreground placeholder:text-foreground/40 border border-primary/20 focus:outline-none focus:ring-2 focus:ring-primary/40"
          />
          <input
            type="text"
            placeholder="Parent's Name"
            value={formData.parent_name}
            onChange={(e) => setFormData({ ...formData, parent_name: e.target.value })}
            className="w-full p-3 bg-black/40 rounded-lg text-foreground placeholder:text-foreground/40 border border-primary/20 focus:outline-none focus:ring-2 focus:ring-primary/40"
          />
          <input
            type="text"
            placeholder="Parent's Contact"
            value={formData.parent_contact}
            onChange={(e) => setFormData({ ...formData, parent_contact: e.target.value })}
            className="w-full p-3 bg-black/40 rounded-lg text-foreground placeholder:text-foreground/40 border border-primary/20 focus:outline-none focus:ring-2 focus:ring-primary/40"
          />

          {!student && (
            <div className="space-y-3 border border-primary/20 rounded-lg p-4 bg-black/20">
              <label className="block text-xs font-bold tracking-wider text-primary/60">SECRET KEY</label>
              <div className="flex gap-2">
                <Button
                  type="button"
                  onClick={() => {
                    setKeyMode("auto");
                    setKeyError("");
                  }}
                  className={`flex-1 text-sm py-2 rounded-lg font-bold ${keyMode === "auto" ? "bg-primary text-primary-foreground" : "bg-black/40 text-foreground/60 border border-primary/20"}`}
                >
                  Auto-Generate
                </Button>
                <Button
                  type="button"
                  onClick={() => {
                    setKeyMode("manual");
                    setKeyError("");
                  }}
                  className={`flex-1 text-sm py-2 rounded-lg font-bold ${keyMode === "manual" ? "bg-primary text-primary-foreground" : "bg-black/40 text-foreground/60 border border-primary/20"}`}
                >
                  Manual Entry
                </Button>
              </div>
              {keyMode === "auto" && (
                <p className="text-xs text-foreground/50">A unique key will be auto-generated for this student.</p>
              )}
              {keyMode === "manual" && (
                <div>
                  <div className="flex gap-2">
                    <input
                      type="text"
                      placeholder="Enter key (e.g. EDU-XXXXX-XXXXX)"
                      value={manualKey}
                      onChange={(e) => {
                        const val = e.target.value.toUpperCase().replace(/\s/g, "");
                        setManualKey(val);
                        setKeyError("");
                        setKeyFound(false);
                      }}
                      maxLength={20}
                      className="flex-1 p-3 bg-black/40 rounded-lg text-foreground placeholder:text-foreground/40 border border-primary/20 focus:outline-none focus:ring-2 focus:ring-primary/40 font-mono tracking-wider"
                    />
                    <Button
                      type="button"
                      onClick={() => scanKey(manualKey)}
                      className="bg-primary text-primary-foreground hover:bg-primary/90 font-bold px-4"
                    >
                      Scan
                    </Button>
                  </div>
                  {keyFound && (
                    <p className="text-xs text-green-400 mt-1 font-semibold">✓ Student found! Details auto-filled below.</p>
                  )}
                  {keyError && <p className="text-xs text-destructive mt-1">{keyError}</p>}
                  <p className="text-xs text-foreground/40 mt-1">
                    Enter key with or without dashes. Press Scan to auto-fill if student exists.
                  </p>
                </div>
              )}
            </div>
          )}

          <Button
            onClick={handleSave}
            className="w-full bg-primary text-primary-foreground hover:bg-primary/90 font-bold py-3 shadow-[0_0_20px_hsl(51,100%,50%,0.3)]"
          >
            Save Changes
          </Button>
        </div>
      </div>
    </div>
  );
};

const StudentManagementPage = () => {
  const { schoolId } = useAuth();
  const students = useAppStore((state) => state.students);
  const addStudent = useAppStore((state) => state.addStudent);
  const updateStudent = useAppStore((state) => state.updateStudent);
  const deleteStudentFromStore = useAppStore((state) => state.deleteStudent);
  const resetFailedAttempts = useAppStore((state) => state.resetFailedAttempts);
  const fetchStudents = useAppStore((state) => state.fetchStudents);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isImportModalOpen, setIsImportModalOpen] = useState(false);
  const [editingStudent, setEditingStudent] = useState<any>(null);
  const [selectedClass, setSelectedClass] = useState("All Classes");
  const [selectedSection, setSelectedSection] = useState("All Sections");
  const [searchTerm, setSearchTerm] = useState("");
  const { toast } = useToast();

  const [feeReminders, setFeeReminders] = useState<Record<string, { message: string; created_at: string }[]>>({});

  useEffect(() => {
    if (schoolId) {
      fetchStudents(schoolId);
      // Fetch fee reminders for all students
      supabase
        .from("fees_reminders")
        .select("student_id, message, created_at")
        .eq("school_id", schoolId)
        .order("created_at", { ascending: false })
        .then(({ data }) => {
          if (data) {
            const grouped: Record<string, { message: string; created_at: string }[]> = {};
            (data as any[]).forEach((r) => {
              if (!grouped[r.student_id]) grouped[r.student_id] = [];
              grouped[r.student_id].push({ message: r.message, created_at: r.created_at });
            });
            setFeeReminders(grouped);
          }
        });
    }
  }, [schoolId]);

  const handleSaveStudent = async (studentData: any, manualKey: string | null) => {
    // Validate roll_no uniqueness within same school + class + section
    const rollNo = studentData.roll_no;
    const duplicate = students.find(
      (s) =>
        s.school_id === schoolId &&
        s.standard === studentData.standard &&
        s.section === studentData.section &&
        (s as any).roll_no === rollNo &&
        (!editingStudent || s.id !== editingStudent.id),
    );
    if (duplicate) {
      toast({
        title: "Duplicate Roll Number",
        description: `Roll no. ${rollNo} already exists in Class ${studentData.standard} Section ${studentData.section}.`,
        variant: "destructive",
      });
      return;
    }

    if (editingStudent) {
      await updateStudent(editingStudent.id, { ...studentData, roll_no: rollNo } as any);
      toast({ title: "Success", description: "Student details updated." });
    } else {
      const newStudent = await addStudent(studentData, manualKey, schoolId);
      if (newStudent) {
        toast({ title: "Student Added!", description: `Secret ID: ${newStudent.secret_id}` });
      }
    }
    setIsModalOpen(false);
    setEditingStudent(null);
  };

  const allAvailableClasses = useMemo(
    () => standards.map((s) => `Class ${s}`).sort((a, b) => getSortableClassIndex(a) - getSortableClassIndex(b)),
    [],
  );
  const allAvailableSections = useMemo(() => [...sections].sort(), []);

  const filteredStudents = useMemo(() => {
    return students
      .filter((s) => selectedClass === "All Classes" || `Class ${s.standard}` === selectedClass)
      .filter((s) => selectedSection === "All Sections" || s.section === selectedSection)
      .filter((s) => s.name.toLowerCase().includes(searchTerm.toLowerCase()));
  }, [students, selectedClass, selectedSection, searchTerm]);

  const groupedStudents = useMemo(() => {
    const groups = filteredStudents.reduce((acc: any, student) => {
      const classKey = `Class ${student.standard}`;
      if (!acc[classKey]) acc[classKey] = [];
      acc[classKey].push(student);
      return acc;
    }, {});
    return Object.keys(groups)
      .sort((a, b) => getSortableClassIndex(a) - getSortableClassIndex(b))
      .reduce((acc: any, key) => {
        acc[key] = groups[key];
        return acc;
      }, {});
  }, [filteredStudents]);

  return (
    <>
      <div className="space-y-6 relative z-10 px-4 sm:px-6 lg:px-8 py-6">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <h1 className="text-3xl font-bold text-foreground">Manage Student Records</h1>
          <div className="flex gap-2 sm:gap-3 flex-wrap">
            <Button
              onClick={() => setIsImportModalOpen(true)}
              variant="outline"
              className="bg-primary text-primary-foreground ho