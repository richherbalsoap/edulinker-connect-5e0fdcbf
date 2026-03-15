import { useState, useMemo, useEffect, useCallback } from "react";
import { Button } from "@/components/ui/button";
import { CheckCircle, ArrowLeft, Trash2, Users, Edit2, AlertTriangle } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import useAppStore from "@/store/appStore";
import { useSchoolId } from "@/hooks/useSchoolId";

const standards = ["Nursery", "LKG", "UKG", "1", "2", "3", "4", "5", "6", "7", "8", "9", "10", "11", "12"];
const sections = ["A", "B", "C", "D", "E"];

const getSortableClassIndex = (classVal: string) => {
  const standard = classVal.replace("Class ", "");
  return standards.indexOf(standard) === -1 ? Infinity : standards.indexOf(standard);
};

const getNextStandard = (currentStandard: string) => {
  const currentIndex = standards.indexOf(currentStandard);
  if (currentIndex > -1 && currentIndex < standards.length - 1) return standards[currentIndex + 1];
  return null;
};

const getPreviousStandard = (currentStandard: string) => {
  const currentIndex = standards.indexOf(currentStandard);
  if (currentIndex > 0) return standards[currentIndex - 1];
  return null;
};

// Fix 1: Confirmation Dialog Component
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

const PromotionPanelPage = () => {
  const { toast } = useToast();
  const schoolId = useSchoolId();
  const students = useAppStore((state) => state.students);
  const updateStudent = useAppStore((state) => state.updateStudent);
  const deleteStudentFromStore = useAppStore((state) => state.deleteStudent);
  const fetchStudents = useAppStore((state) => state.fetchStudents); // Fix 2
  const logStudentHistory = useAppStore((state) => state.logStudentHistory);

  const [selectedClass, setSelectedClass] = useState("All Classes");
  const [selectedSection, setSelectedSection] = useState("All Sections");
  const [searchTerm, setSearchTerm] = useState("");
  const [bulkFromClass, setBulkFromClass] = useState("");
  const [bulkSection, setBulkSection] = useState("");
  const [isBulkPromoting, setIsBulkPromoting] = useState(false); // Fix 5: bulk lock
  const [isActing, setIsActing] = useState(false); // Fix 5: individual action lock

  const [changingSectionFor, setChangingSectionFor] = useState<string | null>(null);
  const [newSection, setNewSection] = useState("");
  const [changingRollFor, setChangingRollFor] = useState<string | null>(null);
  const [newRollNo, setNewRollNo] = useState("");

  // Fix 1: Confirmation dialog state
  const [confirm, setConfirm] = useState<{
    open: boolean;
    title: string;
    message: string;
    confirmLabel: string;
    danger: boolean;
    onConfirm: () => void;
  }>({ open: false, title: "", message: "", confirmLabel: "Confirm", danger: false, onConfirm: () => {} });

  // Fix 2: fetchStudents in dependency array
  useEffect(() => {
    if (schoolId) fetchStudents(schoolId);
  }, [schoolId, fetchStudents]);

  const handleAction = useCallback(
    async (id: string, action: string) => {
      const student = students.find((s) => s.id === id);
      if (!student) return;

      const nextClass = getNextStandard(student.standard);
      const prevClass = getPreviousStandard(student.standard);

      // Fix 1 & 3: Confirmation before destructive actions
      const doAction = async () => {
        setIsActing(true); // Fix 5
        let title = "",
          description = "";
        switch (action) {
          case "promote": {
            if (schoolId) await logStudentHistory(id, schoolId, student.standard, student.section);
            if (nextClass) {
              await updateStudent(id, { standard: nextClass });
              title = "Student Promoted!";
              description = `${student.name} promoted to Class ${nextClass}.`;
            } else {
              await deleteStudentFromStore(id);
              title = "Student Graduated!";
              description = `${student.name} has graduated and been removed.`;
            }
            break;
          }
          case "back": {
            if (prevClass) {
              if (schoolId) await logStudentHistory(id, schoolId, student.standard, student.section);
              await updateStudent(id, { standard: prevClass });
              title = "Student Demoted";
              description = `${student.name} moved back to Class ${prevClass}.`;
            } else {
              toast({
                title: "Cannot go back",
                description: `${student.name} is already in the lowest class.`,
                variant: "destructive",
              });
              setIsActing(false);
              return;
            }
            break;
          }
          case "delete":
            await deleteStudentFromStore(id);
            title = "Student Deleted";
            description = `${student.name} has been removed.`;
            break;
          default:
            setIsActing(false);
            return;
        }
        if (schoolId) await fetchStudents(schoolId);
        toast({ title, description, variant: action === "delete" ? "destructive" : "default" });
        setIsActing(false);
      };

      // Show confirmation for dangerous actions
      if (action === "delete") {
        setConfirm({
          open: true,
          title: "Delete Student",
          message: `Are you sure you want to permanently delete ${student.name}? This cannot be undone.`,
          confirmLabel: "Delete",
          danger: true,
          onConfirm: () => {
            setConfirm((c) => ({ ...c, open: false }));
            doAction();
          },
        });
      } else if (action === "promote" && !nextClass) {
        // Fix 3: Graduate = delete, needs confirmation
        setConfirm({
          open: true,
          title: "Graduate Student",
          message: `${student.name} is in Class 12. Graduating will remove them from the system. Continue?`,
          confirmLabel: "Graduate",
          danger: true,
          onConfirm: () => {
            setConfirm((c) => ({ ...c, open: false }));
            doAction();
          },
        });
      } else {
        doAction();
      }
    },
    [students, schoolId, fetchStudents, logStudentHistory, updateStudent, deleteStudentFromStore, toast],
  );

  const handleSectionChange = async (studentId: string) => {
    if (!newSection) return;
    const student = students.find((s) => s.id === studentId);
    if (!student) return;
    await updateStudent(studentId, { section: newSection });
    if (schoolId) await fetchStudents(schoolId);
    toast({ title: "Section Changed", description: `${student.name} moved to Section ${newSection}.` });
    setChangingSectionFor(null);
    setNewSection("");
  };

  const handleRollNoChange = async (studentId: string) => {
    const rollNum = parseInt(newRollNo, 10);
    if (!newRollNo || isNaN(rollNum) || rollNum <= 0) return;
    const student = students.find((s) => s.id === studentId);
    if (!student) return;
    await updateStudent(studentId, { roll_no: rollNum } as any);
    if (schoolId) await fetchStudents(schoolId);
    toast({ title: "Roll No. Updated", description: `${student.name}'s roll number changed to ${rollNum}.` });
    setChangingRollFor(null);
    setNewRollNo("");
  };

  const handleBulkPromote = async () => {
    if (!bulkFromClass) {
      toast({ title: "Select a class", description: "Choose a class to promote from.", variant: "destructive" });
      return;
    }
    const nextClass = getNextStandard(bulkFromClass);
    const targets = students.filter((s) => {
      if (s.standard !== bulkFromClass) return false;
      if (bulkSection && s.section !== bulkSection) return false;
      return true;
    });
    if (targets.length === 0) {
      toast({
        title: "No students found",
        description: "No students in the selected class/section.",
        variant: "destructive",
      });
      return;
    }

    // Fix 1: Bulk promote confirmation
    setConfirm({
      open: true,
      title: "Bulk Promotion",
      message: `Promote ${targets.length} student(s) from Class ${bulkFromClass}${bulkSection ? `-${bulkSection}` : ""} to ${nextClass ? `Class ${nextClass}` : "Graduate (will be deleted)"}?`,
      confirmLabel: "Promote All",
      danger: !nextClass,
      onConfirm: async () => {
        setConfirm((c) => ({ ...c, open: false }));
        setIsBulkPromoting(true);
        let promoted = 0,
          graduated = 0;
        for (const s of targets) {
          if (schoolId) await logStudentHistory(s.id, schoolId, s.standard, s.section);
          if (nextClass) {
            await updateStudent(s.id, { standard: nextClass });
            promoted++;
          } else {
            await deleteStudentFromStore(s.id);
            graduated++;
          }
        }
        if (schoolId) await fetchStudents(schoolId);
        toast({
          title: "Bulk Promotion Complete!",
          description: nextClass
            ? `${promoted} student(s) promoted to Class ${nextClass}.${bulkSection ? ` (Section ${bulkSection})` : ""}`
            : `${graduated} student(s) graduated.`,
        });
        setIsBulkPromoting(false);
        setBulkFromClass("");
        setBulkSection("");
      },
    });
  };

  const availableClasses = useMemo(
    () =>
      [...new Set(students.map((s) => `Class ${s.standard}`))].sort(
        (a, b) => getSortableClassIndex(a) - getSortableClassIndex(b),
      ),
    [students],
  );
  const availableSections = useMemo(() => [...new Set(students.map((s) => s.section))].sort(), [students]);

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

  const isLocked = isBulkPromoting || isActing; // Fix 5

  return (
    <div className="space-y-4 px-4 pb-10 relative z-10 py-6">
      {/* Fix 1: Confirmation Dialog */}
      <ConfirmDialog
        open={confirm.open}
        title={confirm.title}
        message={confirm.message}
        confirmLabel={confirm.confirmLabel}
        danger={confirm.danger}
        onConfirm={confirm.onConfirm}
        onCancel={() => setConfirm((c) => ({ ...c, open: false }))}
      />

      <div className="text-center pt-4">
        <h1 className="text-3xl font-bold text-foreground drop-shadow-[0_0_10px_hsl(51,100%,50%,0.3)]">
          Promotion Panel
        </h1>
        <p className="text-foreground/80">Manage student promotions for the new academic year</p>
      </div>

      {/* Bulk Promotion */}
      <div className="bg-black/20 backdrop-blur-md border border-primary/30 rounded-2xl p-4 sm:p-6 max-w-4xl mx-auto space-y-4 shadow-[0_0_30px_hsl(51,100%,50%,0.08)]">
        <div className="flex items-center gap-3 mb-2">
          <div className="w-10 h-10 rounded-lg bg-primary/30 flex items-center justify-center shadow-[0_0_12px_hsl(51,100%,50%,0.3)]">
            <Users size={20} className="text-primary" />
          </div>
          <h2 className="text-lg font-semibold text-foreground">Bulk Promotion</h2>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div>
            <label className="block text-xs font-bold tracking-wider text-primary/60 mb-2">FROM CLASS</label>
            <select
              value={bulkFromClass}
              onChange={(e) => setBulkFromClass(e.target.value)}
              disabled={isLocked}
              className="w-full px-4 py-3 bg-black/40 border-primary/20 border rounded-lg text-foreground focus:outline-none focus:ring-2 focus:ring-primary/40 disabled:opacity-50"
            >
              <option value="">Select class</option>
              {standards.map((s) => (
                <option key={s} value={s}>
                  Class {s}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-xs font-bold tracking-wider text-primary/60 mb-2">TO CLASS</label>
            <div className="w-full px-4 py-3 bg-black/20 border-primary/10 border rounded-lg text-foreground/60">
              {bulkFromClass
                ? getNextStandard(bulkFromClass)
                  ? `Class ${getNextStandard(bulkFromClass)}`
                  : "Graduate"
                : "—"}
            </div>
          </div>
          <div>
            <label className="block text-xs font-bold tracking-wider text-primary/60 mb-2">SECTION (Optional)</label>
            <select
              value={bulkSection}
              onChange={(e) => setBulkSection(e.target.value)}
              disabled={isLocked}
              className="w-full px-4 py-3 bg-black/40 border-primary/20 border rounded-lg text-foreground focus:outline-none focus:ring-2 focus:ring-primary/40 disabled:opacity-50"
            >
              <option value="">All Sections</option>
              {sections.map((s) => (
                <option key={s} value={s}>
                  {s}
                </option>
              ))}
            </select>
          </div>
        </div>
        <Button
          onClick={handleBulkPromote}
          disabled={isLocked || !bulkFromClass}
          className="w-full bg-black/60 hover:bg-black/80 text-foreground font-bold py-3 rounded-lg border border-primary/40 shadow-[0_0_12px_hsl(51,100%,50%,0.1)] disabled:opacity-50"
        >
          <CheckCircle size={18} className="mr-2" />
          {isBulkPromoting ? "Promoting..." : "Promote All"}
        </Button>
      </div>

      {/* Filters */}
      <div className="bg-black/20 backdrop-blur-md border border-primary/30 rounded-2xl p-4 sm:p-6 max-w-4xl mx-auto space-y-4 shadow-[0_0_30px_hsl(51,100%,50%,0.08)]">
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div>
            <label className="block text-xs font-bold tracking-wider text-primary/70 mb-2">CLASS</label>
            <select
              value={selectedClass}
              onChange={(e) => setSelectedClass(e.target.value)}
              className="w-full px-4 py-3 bg-black/40 border-primary/20 border rounded-lg text-foreground focus:outline-none focus:ring-2 focus:ring-primary/40"
            >
              <option value="All Classes">All Classes</option>
              {standards.map((s) => (
                <option key={s} value={`Class ${s}`}>
                  Class {s}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-xs font-bold tracking-wider text-primary/70 mb-2">SECTION</label>
            <select
              value={selectedSection}
              onChange={(e) => setSelectedSection(e.target.value)}
              className="w-full px-4 py-3 bg-black/40 border-primary/20 border rounded-lg text-foreground focus:outline-none focus:ring-2 focus:ring-primary/40"
            >
              <option value="All Sections">All Sections</option>
              {sections.map((s) => (
                <option key={s} value={s}>
                  {s}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-xs font-bold tracking-wider text-primary/60 mb-2">STUDENT NAME</label>
            <input
              type="text"
              placeholder="Search student..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full px-4 py-3 bg-black/40 border-primary/20 border rounded-lg text-foreground placeholder:text-foreground/50 focus:outline-none focus:ring-2 focus:ring-primary/40"
            />
          </div>
        </div>
      </div>

      {/* Student Cards */}
      <div className="space-y-8 max-w-4xl mx-auto">
        {Object.keys(groupedStudents).length > 0 ? (
          Object.keys(groupedStudents).map((classGroup) => (
            <div key={classGroup}>
              <h2 className="text-foreground text-xl font-bold mb-3 px-2 drop-shadow-[0_0_8px_hsl(51,100%,50%,0.25)]">
                {classGroup}
              </h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {groupedStudents[classGroup].map((student: any) => {
                  const nextClass = getNextStandard(student.standard);
                  const prevClass = getPreviousStandard(student.standard);
                  return (
                    <div
                      key={student.id}
                      className="bg-black/20 backdrop-blur-md border border-primary/25 rounded-2xl p-4 space-y-3 shadow-[0_0_15px_hsl(51,100%,50%,0.06)] hover:border-primary/50 hover:shadow-[0_0_25px_hsl(51,100%,50%,0.2)] transition-all duration-300"
                    >
                      <div className="flex justify-between items-start">
                        <div>
                          <h3 className="font-bold text-lg text-foreground drop-shadow-[0_0_6px_hsl(51,100%,50%,0.2)]">
                            {student.name}
                          </h3>
                          <p className="text-xs text-foreground/60">
                            Section {student.section} • Roll {student.roll_no || "—"}
                          </p>
                        </div>
                        {/* Fix 3: Class 12 warning badge */}
                        {!nextClass && (
                          <span className="text-[10px] font-bold bg-destructive/10 text-destructive border border-destructive/20 px-2 py-0.5 rounded-full">
                            Final Year
                          </span>
                        )}
                      </div>

                      {changingSectionFor === student.id ? (
                        <div className="flex items-center gap-2">
                          <select
                            value={newSection}
                            onChange={(e) => setNewSection(e.target.value)}
                            className="flex-1 px-3 py-2 bg-black/40 border-primary/20 border rounded-lg text-foreground text-sm focus:outline-none focus:ring-2 focus:ring-primary/40"
                          >
                            <option value="">Select Section</option>
                            {sections
                              .filter((s) => s !== student.section)
                              .map((s) => (
                                <option key={s} value={s}>
                                  {s}
                                </option>
                              ))}
                          </select>
                          <Button
                            onClick={() => handleSectionChange(student.id)}
                            disabled={!newSection}
                            className="bg-primary/20 hover:bg-primary/30 text-primary font-bold text-xs px-3 py-2 border border-primary/30"
                          >
                            Save
                          </Button>
                          <Button
                            onClick={() => {
                              setChangingSectionFor(null);
                              setNewSection("");
                            }}
                            className="bg-black/40 hover:bg-black/60 text-foreground/60 text-xs px-3 py-2 border border-primary/10"
                          >
                            Cancel
                          </Button>
                        </div>
                      ) : null}

                      {changingRollFor === student.id ? (
                        <div className="flex items-center gap-2">
                          <input
                            type="text"
                            inputMode="numeric"
                            pattern="[0-9]*"
                            placeholder={`Current: ${student.roll_no || "—"}`}
                            value={newRollNo}
                            onChange={(e) => setNewRollNo(e.target.value.replace(/\D/g, ""))}
                            className="flex-1 px-3 py-2 bg-black/40 border-primary/20 border rounded-lg text-foreground text-sm focus:outline-none focus:ring-2 focus:ring-primary/40 text-center font-mono"
                          />
                          <Button
                            onClick={() => handleRollNoChange(student.id)}
                            disabled={!newRollNo}
                            className="bg-primary/20 hover:bg-primary/30 text-primary font-bold text-xs px-3 py-2 border border-primary/30"
                          >
                            Save
                          </Button>
                          <Button
                            onClick={() => {
                              setChangingRollFor(null);
                              setNewRollNo("");
                            }}
                            className="bg-black/40 hover:bg-black/60 text-foreground/60 text-xs px-3 py-2 border border-primary/10"
                          >
                            Cancel
                          </Button>
                        </div>
                      ) : null}

                      <div className="space-y-2">
                        {/* Fix 5: disabled when any action is running */}
                        <Button
                          onClick={() => handleAction(student.id, "promote")}
                          disabled={isLocked}
                          className={`w-full font-bold py-2 rounded-lg border text-sm ${!nextClass ? "bg-destructive/10 hover:bg-destructive/20 border-destructive/30 text-destructive" : "bg-black/60 hover:bg-black/80 text-foreground border-primary/40 shadow-[0_0_10px_hsl(51,100%,50%,0.1)]"} disabled:opacity-50`}
                        >
                          <CheckCircle size={16} className="mr-2" />
                          {nextClass ? `Promote to Class ${nextClass}` : "Graduate (Remove)"}
                        </Button>
                        <div className="grid grid-cols-4 gap-2">
                          <Button
                            onClick={() => handleAction(student.id, "back")}
                            disabled={!prevClass || isLocked}
                            className="w-full bg-black/60 hover:bg-black/80 text-foreground font-bold py-2 rounded-lg border border-primary/40 text-sm disabled:opacity-40"
                          >
                            <ArrowLeft size={16} className="mr-1" /> Back
                          </Button>
                          <Button
                            onClick={() => {
                              setChangingSectionFor(student.id);
                              setNewSection("");
                              setChangingRollFor(null);
                            }}
                            disabled={isLocked}
                            className="w-full bg-black/60 hover:bg-black/80 text-foreground font-bold py-2 rounded-lg border border-primary/40 text-sm"
                          >
                            <Edit2 size={16} className="mr-1" /> Sec
                          </Button>
                          <Button
                            onClick={() => {
                              setChangingRollFor(student.id);
                              setNewRollNo("");
                              setChangingSectionFor(null);
                            }}
                            disabled={isLocked}
                            className="w-full bg-black/60 hover:bg-black/80 text-foreground font-bold py-2 rounded-lg border border-primary/40 text-sm"
                          >
                            <Edit2 size={16} className="mr-1" /> Roll
                          </Button>
                          <Button
                            onClick={() => handleAction(student.id, "delete")}
                            disabled={isLocked}
                            className="w-full bg-destructive hover:bg-destructive/80 text-destructive-foreground font-bold py-2 rounded-lg border border-red-500/50 text-sm disabled:opacity-50"
                          >
                            <Trash2 size={16} className="mr-1" /> Del
                          </Button>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          ))
        ) : (
          <div className="text-center py-16">
            <p className="text-foreground/50 text-lg">No students found.</p>
            <p className="text-foreground/40">Add students first from the Student Management page.</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default PromotionPanelPage;
