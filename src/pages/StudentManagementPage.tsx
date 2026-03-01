import { useState, useMemo, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { Plus, Edit, Trash2, X, Upload, User, Phone, Key } from "lucide-react";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import useAppStore from "@/store/appStore";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";

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
    if (!/^[A-Z0-9]+$/.test(key)) return "Only uppercase letters and numbers allowed.";
    return "";
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
      const { data: existing } = await supabase.from("students").select("id").eq("secret_id", manualKey).maybeSingle();
      if (existing) {
        setKeyError("This key is already in use. Choose a different one.");
        return;
      }
      const { data: archived } = await supabase
        .from("student_keys_archive")
        .select("id")
        .eq("secret_id", manualKey)
        .maybeSingle();
      if (archived) {
        setKeyError("This key was previously used and is permanently reserved.");
        return;
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
          <div className="grid grid-cols-2 gap-4">
            <input
              type="number"
              placeholder="Roll No."
              min="1"
              value={formData.roll_no}
              onChange={(e) => setFormData({ ...formData, roll_no: e.target.value })}
              className="w-full p-3 bg-black/40 rounded-lg text-foreground placeholder:text-foreground/40 border border-primary/20 focus:outline-none focus:ring-2 focus:ring-primary/40"
            />
          </div>
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
                  <input
                    type="text"
                    placeholder="Enter key (8-20 chars, A-Z, 0-9)"
                    value={manualKey}
                    onChange={(e) => {
                      setManualKey(e.target.value.toUpperCase().replace(/\s/g, ""));
                      setKeyError("");
                    }}
                    maxLength={20}
                    className="w-full p-3 bg-black/40 rounded-lg text-foreground placeholder:text-foreground/40 border border-primary/20 focus:outline-none focus:ring-2 focus:ring-primary/40 font-mono tracking-wider"
                  />
                  {keyError && <p className="text-xs text-destructive mt-1">{keyError}</p>}
                  <p className="text-xs text-foreground/40 mt-1">
                    Uppercase + numbers, no spaces. Students can re-use this key if they transfer schools.
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
  const fetchStudents = useAppStore((state) => state.fetchStudents);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingStudent, setEditingStudent] = useState<any>(null);
  const [selectedClass, setSelectedClass] = useState("All Classes");
  const [selectedSection, setSelectedSection] = useState("All Sections");
  const [searchTerm, setSearchTerm] = useState("");
  const { toast } = useToast();

  useEffect(() => {
    if (schoolId) fetchStudents(schoolId);
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
          <Button
            onClick={() => {
              setEditingStudent(null);
              setIsModalOpen(true);
            }}
            className="bg-primary text-primary-foreground hover:bg-primary/90 font-bold shadow-[0_0_20px_hsl(51,100%,50%,0.3)]"
          >
            <Plus size={20} className="mr-2" /> Add Student
          </Button>
        </div>

        <div className="bg-black/30 backdrop-blur-md border border-primary/20 rounded-2xl p-4 sm:p-6 w-full mx-auto space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label className="block text-xs font-bold tracking-wider text-primary/60 mb-2">CLASS</label>
              <Select value={selectedClass} onValueChange={setSelectedClass}>
                <SelectTrigger className="w-full px-4 py-3 bg-black/40 border-primary/20 border rounded-lg text-foreground">
                  <SelectValue placeholder="All Classes" />
                </SelectTrigger>
                <SelectContent className="bg-black border border-primary/20 max-h-60 overflow-y-auto">
                  <SelectItem value="All Classes" className="text-foreground focus:bg-primary/10 focus:text-primary">
                    All Classes
                  </SelectItem>
                  {allAvailableClasses.map((c) => (
                    <SelectItem key={c} value={c} className="text-foreground focus:bg-primary/10 focus:text-primary">
                      {c}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <label className="block text-xs font-bold tracking-wider text-primary/60 mb-2">SECTION</label>
              <Select value={selectedSection} onValueChange={setSelectedSection}>
                <SelectTrigger className="w-full px-4 py-3 bg-black/40 border-primary/20 border rounded-lg text-foreground">
                  <SelectValue placeholder="All Sections" />
                </SelectTrigger>
                <SelectContent className="bg-black border border-primary/20 max-h-60 overflow-y-auto">
                  <SelectItem value="All Sections" className="text-foreground focus:bg-primary/10 focus:text-primary">
                    All Sections
                  </SelectItem>
                  {allAvailableSections.map((s) => (
                    <SelectItem key={s} value={s} className="text-foreground focus:bg-primary/10 focus:text-primary">
                      {s}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <label className="block text-xs font-bold tracking-wider text-primary/60 mb-2">STUDENT NAME</label>
              <input
                type="text"
                placeholder="Search by name..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full px-4 py-3 bg-black/40 border-primary/20 border rounded-lg text-foreground placeholder:text-foreground/50 focus:outline-none focus:ring-2 focus:ring-primary/40"
              />
            </div>
          </div>
        </div>

        {filteredStudents.length > 0 ? (
          Object.keys(groupedStudents).map((classGroup) => (
            <div key={classGroup}>
              <h2 className="text-foreground text-2xl font-bold mb-4 px-2">{classGroup}</h2>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6">
                {groupedStudents[classGroup].map((student: any) => (
                  <div
                    key={student.id}
                    className="bg-black/30 backdrop-blur-md border border-primary/20 rounded-2xl p-4 sm:p-5 space-y-4 flex flex-col hover:border-primary/40 hover:shadow-[0_0_20px_hsl(51,100%,50%,0.15)] transition-all duration-300"
                  >
                    <div className="flex items-center gap-4 flex-grow">
                      <div className="w-14 h-14 sm:w-16 sm:h-16 rounded-full bg-black/40 flex items-center justify-center text-primary text-2xl font-bold overflow-hidden flex-shrink-0 border border-primary/20">
                        {student.avatar_url ? (
                          <img src={student.avatar_url} alt={student.name} className="w-full h-full object-cover" />
                        ) : (
                          student.name.charAt(0).toUpperCase()
                        )}
                      </div>
                      <div className="min-w-0">
                        <h3 className="text-lg sm:text-xl font-bold text-foreground truncate">{student.name}</h3>
                        <div className="flex gap-2 text-xs mt-1 flex-wrap">
                          <span className="bg-primary/10 text-primary/80 px-2 py-0.5 rounded border border-primary/20">
                            Section {student.section}
                          </span>
                          {(student as any).roll_no && (
                            <span className="bg-primary/10 text-primary/80 px-2 py-0.5 rounded border border-primary/20">
                              Roll No. {(student as any).roll_no}
                            </span>
                          )}
                        </div>
                      </div>
                    </div>
                    <div className="bg-black/40 p-3 sm:p-4 rounded-lg space-y-2 text-foreground/80 text-sm border border-primary/10">
                      <div className="flex items-center gap-3">
                        <Key size={16} className="text-primary/50 flex-shrink-0" />
                        <span className="font-mono text-primary text-xs truncate">{student.secret_id}</span>
                      </div>
                      <div className="flex items-center gap-3">
                        <User size={16} className="text-primary/50 flex-shrink-0" />
                        <span className="truncate">Parent: {student.parent_name || "--"}</span>
                      </div>
                      <div className="flex items-center gap-3">
                        <Phone size={16} className="text-primary/50 flex-shrink-0" />
                        <span className="truncate">{student.parent_contact || "--"}</span>
                      </div>
                    </div>
                    <div className="flex gap-3 mt-4">
                      <Button
                        onClick={() => {
                          setEditingStudent(student);
                          setIsModalOpen(true);
                        }}
                        variant="outline"
                        className="w-full bg-black/40 hover:bg-primary/10 border-primary/20 text-foreground"
                      >
                        <Edit size={16} className="mr-2" /> Edit
                      </Button>
                      <Button
                        onClick={async () => {
                          await deleteStudentFromStore(student.id);
                          toast({ title: "Success", description: "Student record deleted." });
                        }}
                        variant="destructive"
                        className="w-full bg-destructive/10 hover:bg-destructive/20 border border-destructive/20 text-destructive"
                      >
                        <Trash2 size={16} className="mr-2" /> Delete
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ))
        ) : (
          <div className="text-center py-16">
            <p className="text-foreground/50 text-lg">No students found.</p>
            <p className="text-foreground/40">Add students using the "Add Student" button above.</p>
          </div>
        )}
      </div>
      <StudentModal
        isOpen={isModalOpen}
        onClose={() => {
          setIsModalOpen(false);
          setEditingStudent(null);
        }}
        onSave={handleSaveStudent}
        student={editingStudent}
      />
    </>
  );
};

export default StudentManagementPage;
