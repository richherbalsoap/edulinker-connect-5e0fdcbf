import { useState, useEffect, useMemo } from "react";
import { Button } from "@/components/ui/button";
import { Send, Upload, Trash2 } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import useAppStore from "@/store/appStore";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/context/AuthContext";
import { sendNotification } from "@/utils/sendNotification";

const standards = ["Nursery", "LKG", "UKG", "1", "2", "3", "4", "5", "6", "7", "8", "9", "10", "11", "12"];
const initialSubjects = ["Mathematics", "Science", "English", "Hindi", "Social Studies", "Computer Science"];

const ResultSenderPage = () => {
  const { toast } = useToast();
  const { schoolId } = useAuth();
  const addResult = useAppStore((state) => state.addResult);
  const fetchResults = useAppStore((state) => state.fetchResults);
  const allStudents = useAppStore((state) => state.students);
  const fetchStudents = useAppStore((state) => state.fetchStudents);

  const [studentId, setStudentId] = useState("");
  const [standard, setStandard] = useState("");
  const [section, setSection] = useState("");
  const [examName, setExamName] = useState("");
  const [file, setFile] = useState<File | null>(null);
  const [subjects, setSubjects] = useState([{ name: "", marks_obtained: "", total_marks: "" }]);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [availableSubjects, setAvailableSubjects] = useState(initialSubjects);
  const [showCustomSubject, setShowCustomSubject] = useState<number | null>(null);
  const [customSubject, setCustomSubject] = useState("");

  useEffect(() => {
    if (schoolId) fetchStudents(schoolId);
  }, [schoolId]);

  const filteredStudents = useMemo(() => {
    return allStudents.filter((s) => {
      if (standard && section) return s.standard === standard && s.section === section;
      if (standard) return s.standard === standard;
      return true;
    });
  }, [allStudents, standard, section]);

  const handleSubjectSelect = (index: number, value: string) => {
    if (value === "ADD_NEW") {
      setShowCustomSubject(index);
      setCustomSubject("");
      return;
    }
    const newSubjects = [...subjects];
    newSubjects[index] = { ...newSubjects[index], name: value };
    setSubjects(newSubjects);
  };

  const handleAddCustomSubject = (index: number) => {
    if (customSubject.trim()) {
      setAvailableSubjects((prev) => [...prev, customSubject.trim()]);
      const newSubjects = [...subjects];
      newSubjects[index] = { ...newSubjects[index], name: customSubject.trim() };
      setSubjects(newSubjects);
      setShowCustomSubject(null);
      setCustomSubject("");
      toast({ title: "Subject Added", description: `${customSubject.trim()} has been added.` });
    }
  };

  const handleMarksChange = (index: number, field: string, value: string) => {
    const newSubjects = [...subjects];
    (newSubjects[index] as any)[field] = value;
    setSubjects(newSubjects);
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = e.target.files?.[0];
    if (!selectedFile) return;
    const allowedTypes = ["application/pdf", "image/jpeg", "image/png", "image/webp"];
    if (!allowedTypes.includes(selectedFile.type)) {
      toast({
        title: "File Error",
        description: "Only PDF, JPEG, PNG, and WebP files are allowed.",
        variant: "destructive",
      });
      return;
    }
    if (selectedFile.size > 7 * 1024 * 1024) {
      toast({ title: "File Error", description: "File is too large. Max size: 7MB.", variant: "destructive" });
      return;
    }
    setFile(selectedFile);
  };

  const uploadFile = async (studentUuid: string, file: File): Promise<string | null> => {
    const ext = file.name.split(".").pop() || "bin";
    const storagePath = `results/${studentUuid}/${Date.now()}.${ext}`;
    const { error } = await supabase.storage
      .from("edulinker-files")
      .upload(storagePath, file, { contentType: file.type, upsert: false });
    if (error) {
      toast({ title: "Upload Failed", description: error.message, variant: "destructive" });
      return null;
    }
    return storagePath;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!studentId) {
      toast({
        title: "Missing Student",
        description: "Please select a student before uploading.",
        variant: "destructive",
      });
      return;
    }
    if (!schoolId) {
      toast({
        title: "School identity missing",
        description: "Please logout and login again.",
        variant: "destructive",
      });
      return;
    }

    const validSubjects = subjects.filter((s) => s.name && s.marks_obtained && s.total_marks);
    if (validSubjects.length === 0) {
      toast({ title: "Missing Marks", description: "Add at least one subject with marks.", variant: "destructive" });
      return;
    }

    for (const sub of validSubjects) {
      if (parseFloat(sub.marks_obtained) > parseFloat(sub.total_marks)) {
        toast({
          title: "Invalid Marks",
          description: `Marks obtained cannot be greater than total marks (${sub.name}).`,
          variant: "destructive",
        });
        return;
      }
    }

    setIsSubmitting(true);
    let storagePath: string | null = null;
    if (file) {
      storagePath = await uploadFile(studentId, file);
      if (!storagePath) {
        setIsSubmitting(false);
        return;
      }
    }

    for (const sub of validSubjects) {
      await addResult({
        student_id: studentId,
        subject: sub.name,
        exam_name: examName || null,
        marks_obtained: parseFloat(sub.marks_obtained),
        total_marks: parseFloat(sub.total_marks),
        file_url: storagePath,
        school_id: schoolId,
      });
    }

    await fetchResults(schoolId);

    // Notification bhejo — pehle subject ki summary
    const firstSub = validSubjects[0];
    const totalObtained = validSubjects.reduce((sum, s) => sum + parseFloat(s.marks_obtained), 0);
    const totalMax = validSubjects.reduce((sum, s) => sum + parseFloat(s.total_marks), 0);
    const percentage = Math.round((totalObtained / totalMax) * 100);

    await sendNotification("result", {
      student_id: studentId,
      exam_name: examName || "Exam",
      subject: validSubjects.length === 1 ? firstSub.name : `${validSubjects.length} Subjects`,
      marks_obtained: totalObtained,
      total_marks: totalMax,
      percentage,
    });

    const student = allStudents.find((s) => s.id === studentId);
    toast({
      title: "Result Sent Successfully!",
      description: `Marks for ${student?.name || "student"} have been recorded.`,
    });
    setStudentId("");
    setStandard("");
    setSection("");
    setExamName("");
    setFile(null);
    setSubjects([{ name: "", marks_obtained: "", total_marks: "" }]);
    setIsSubmitting(false);
  };

  return (
    <div className="space-y-6 px-4 pb-10 relative z-10 py-6">
      <div className="text-center pt-4">
        <h1 className="text-3xl font-bold text-foreground">Result Sender</h1>
        <p className="text-foreground/70">Enter or upload student marks</p>
      </div>
      <form
        onSubmit={handleSubmit}
        className="bg-black/30 backdrop-blur-md border border-primary/20 rounded-2xl p-6 max-w-2xl mx-auto space-y-6"
      >
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className="block text-xs font-bold tracking-wider text-primary/60 mb-2">STANDARD</label>
            <Select value={standard} onValueChange={setStandard}>
              <SelectTrigger className="w-full p-3 bg-black/40 border border-primary/20 rounded-lg text-foreground">
                <SelectValue placeholder="Select Standard" />
              </SelectTrigger>
              <SelectContent className="bg-black border border-primary/20 max-h-60 overflow-y-auto">
                {standards.map((s) => (
                  <SelectItem key={s} value={s} className="text-foreground focus:bg-primary/10 focus:text-primary">
                    {s}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div>
            <label className="block text-xs font-bold tracking-wider text-primary/60 mb-2">CLASS SECTION</label>
            <Select value={section} onValueChange={setSection}>
              <SelectTrigger className="w-full p-3 bg-black/40 border border-primary/20 rounded-lg text-foreground">
                <SelectValue placeholder="Select Section" />
              </SelectTrigger>
              <SelectContent className="bg-black border border-primary/20 max-h-60 overflow-y-auto">
                {["A", "B", "C", "D", "E"].map((s) => (
                  <SelectItem key={s} value={s} className="text-foreground focus:bg-primary/10 focus:text-primary">
                    {s}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>
        <div>
          <label className="block text-xs font-bold tracking-wider text-primary/60 mb-2">EXAM TYPE</label>
          <Select value={examName} onValueChange={setExamName}>
            <SelectTrigger className="w-full p-3 bg-black/40 border border-primary/20 rounded-lg text-foreground">
              <SelectValue placeholder="Select Exam (Optional)" />
            </SelectTrigger>
            <SelectContent className="bg-black border border-primary/20">
              <SelectItem value="Unit Test" className="text-foreground focus:bg-primary/10 focus:text-primary">
                Unit Test
              </SelectItem>
              <SelectItem value="Mid Term" className="text-foreground focus:bg-primary/10 focus:text-primary">
                Mid Term
              </SelectItem>
              <SelectItem value="Final Exam" className="text-foreground focus:bg-primary/10 focus:text-primary">
                Final Exam
              </SelectItem>
              <SelectItem value="Weekly Test" className="text-foreground focus:bg-primary/10 focus:text-primary">
                Weekly Test
              </SelectItem>
            </SelectContent>
          </Select>
        </div>
        <div>
          <label className="block text-xs font-bold tracking-wider text-primary/60 mb-2">SELECT STUDENT</label>
          {filteredStudents.length > 0 ? (
            <Select value={studentId} onValueChange={setStudentId}>
              <SelectTrigger className="w-full p-3 bg-black/40 border border-primary/20 rounded-lg text-foreground">
                <SelectValue placeholder="Select a student" />
              </SelectTrigger>
              <SelectContent className="bg-black border border-primary/20 max-h-60 overflow-y-auto">
                {filteredStudents.map((s) => (
                  <SelectItem
                    key={s.id}
                    value={s.id}
                    className="text-foreground focus:bg-primary/10 focus:text-primary"
                  >
                    {s.name} ({s.standard}-{s.section})
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          ) : (
            <p className="text-foreground/40 text-sm py-3">No students found. Select standard & section first.</p>
          )}
        </div>
        <div className="space-y-3">
          <label className="block text-xs font-bold tracking-wider text-primary/60">SUBJECTS & MARKS</label>
          {subjects.map((subject, index) => (
            <div key={index} className="space-y-2">
              <div className="flex items-center gap-2 flex-wrap">
                {showCustomSubject === index ? (
                  <div className="flex-1 flex gap-2 min-w-0">
                    <input
                      type="text"
                      value={customSubject}
                      onChange={(e) => setCustomSubject(e.target.value)}
                      placeholder="Enter subject name..."
                      className="flex-1 p-3 bg-black/40 border-primary/20 border rounded-lg text-foreground focus:outline-none focus:ring-2 focus:ring-primary/40"
                      autoFocus
                    />
                    <Button
                      type="button"
                      onClick={() => handleAddCustomSubject(index)}
                      className="bg-primary hover:bg-primary/90 text-primary-foreground font-bold"
                    >
                      Add
                    </Button>
                    <Button
                      type="button"
                      onClick={() => setShowCustomSubject(null)}
                      variant="ghost"
                      className="text-foreground/60"
                    >
                      Cancel
                    </Button>
                  </div>
                ) : (
                  <div className="flex-1 min-w-0">
                    <Select value={subject.name} onValueChange={(value) => handleSubjectSelect(index, value)}>
                      <SelectTrigger className="w-full p-3 bg-black/40 border border-primary/20 rounded-lg text-foreground">
                        <SelectValue placeholder="Select Subject" />
                      </SelectTrigger>
                      <SelectContent className="bg-black border border-primary/20 max-h-60 overflow-y-auto">
                        {availableSubjects.map((s) => (
                          <SelectItem
                            key={s}
                            value={s}
                            className="text-foreground focus:bg-primary/10 focus:text-primary"
                          >
                            {s}
                          </SelectItem>
                        ))}
                        <SelectItem
                          value="ADD_NEW"
                          className="text-primary font-bold focus:bg-primary/10 focus:text-primary"
                        >
                          + Add Subject Name
                        </SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                )}
                <input
                  type="number"
                  value={subject.marks_obtained}
                  onChange={(e) => handleMarksChange(index, "marks_obtained", e.target.value)}
                  title="Marks obtained"
                  className="w-20 sm:w-24 p-3 bg-black/40 border-primary/20 border rounded-lg text-foreground focus:outline-none focus:ring-2 focus:ring-primary/40 text-sm"
                  placeholder="Marks"
                />
                <input
                  type="number"
                  value={subject.total_marks}
                  onChange={(e) => handleMarksChange(index, "total_marks", e.target.value)}
                  title="Total marks"
                  className="w-20 sm:w-24 p-3 bg-black/40 border-primary/20 border rounded-lg text-foreground focus:outline-none focus:ring-2 focus:ring-primary/40 text-sm"
                  placeholder="Total"
                />
                <Button
                  type="button"
                  onClick={() => setSubjects(subjects.filter((_, i) => i !== index))}
                  variant="destructive"
                  className="p-3 bg-destructive/20 hover:bg-destructive/30 text-destructive border border-destructive/30 flex-shrink-0"
                >
                  <Trash2 size={16} />
                </Button>
              </div>
              {showCustomSubject !== index && (
                <div className="flex gap-4 text-xs text-foreground/40 pl-1">
                  <span>Marks (e.g. 78)</span>
                  <span>Total (e.g. 100)</span>
                </div>
              )}
            </div>
          ))}
          <Button
            type="button"
            onClick={() => setSubjects([...subjects, { name: "", marks_obtained: "", total_marks: "" }])}
            className="text-primary/80 hover:text-primary bg-black/40 hover:bg-primary/10 w-full border border-primary/20"
          >
            + Add Another Subject
          </Button>
        </div>
        <div>
          <label className="block text-xs font-bold tracking-wider text-primary/60 mb-2">
            UPLOAD RESULT FILE (Optional)
          </label>
          <div className="relative border-2 border-dashed border-primary/20 rounded-lg p-6 text-center cursor-pointer hover:border-primary/40 transition-colors">
            <input
              type="file"
              onChange={handleFileChange}
              className="absolute inset-0 w-full h-full opacity-0"
              accept=".pdf,.jpg,.jpeg,.png,.webp"
            />
            <div className="flex flex-col items-center justify-center space-y-2 text-foreground/60">
              <Upload size={32} />
              {file ? <p>Selected: {file.name}</p> : <p>Click to upload (PDF, PNG, JPG, WebP — max 7MB)</p>}
            </div>
          </div>
        </div>
        <Button
          type="submit"
          disabled={isSubmitting}
          className="w-full bg-primary hover:bg-primary/90 text-primary-foreground font-bold text-base py-3 rounded-lg shadow-[0_0_20px_hsl(51,100%,50%,0.3)]"
        >
          {isSubmitting ? (
            "Submitting..."
          ) : (
            <>
              <Send size={20} className="mr-2" /> Send Result
            </>
          )}
        </Button>
      </form>
    </div>
  );
};

export default ResultSenderPage;
