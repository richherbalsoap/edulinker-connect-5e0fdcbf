import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { Send, Upload, X } from "lucide-react";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import useAppStore from "@/store/appStore";
import { apiClient } from "@/lib/apiClient";
import { useAuth } from "@/context/AuthContext";
import { sendNotification } from "@/utils/sendNotification";

const standards = ["Nursery", "LKG", "UKG", "1", "2", "3", "4", "5", "6", "7", "8", "9", "10", "11", "12"];
const sections = ["A", "B", "C", "D", "E"];
const initialSubjects = ["Mathematics", "Science", "English", "Hindi", "Social Studies", "Computer Science"];

const HomeworkSenderPage = () => {
  const { toast } = useToast();
  const { schoolId } = useAuth();
  const addHomework = useAppStore((state) => state.addHomework);
  const fetchHomework = useAppStore((state) => state.fetchHomework);
  const subjectsStorageKey = schoolId ? `edulinker_subjects_${schoolId}` : "edulinker_subjects_global";
  const [subjects, setSubjects] = useState<string[]>(() => {
    try {
      const saved = localStorage.getItem(subjectsStorageKey);
      if (saved) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed) && parsed.length > 0) return parsed;
      }
    } catch {}
    return initialSubjects;
  });
  const [showCustomSubject, setShowCustomSubject] = useState(false);
  const [customSubject, setCustomSubject] = useState("");
  const [formData, setFormData] = useState({ standard: "", section: "", subject: "", homework: "" });
  const [file, setFile] = useState<File | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Reload subjects when schoolId changes (login switch)
  useEffect(() => {
    try {
      const saved = localStorage.getItem(subjectsStorageKey);
      if (saved) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed) && parsed.length > 0) {
          setSubjects(parsed);
          return;
        }
      }
      setSubjects(initialSubjects);
    } catch {
      setSubjects(initialSubjects);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [schoolId]);

  // Persist subjects whenever they change
  useEffect(() => {
    try {
      localStorage.setItem(subjectsStorageKey, JSON.stringify(subjects));
    } catch {}
  }, [subjects, subjectsStorageKey]);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = e.target.files?.[0];
    if (!selectedFile) return;
    const allowedTypes = ["application/pdf", "image/jpeg", "image/png", "image/webp"];
    if (!allowedTypes.includes(selectedFile.type)) {
      toast({ title: "File Error", description: "Only PDF, JPEG, PNG, and WebP files are allowed.", variant: "destructive" });
      return;
    }
    if (selectedFile.size > 7 * 1024 * 1024) {
      toast({ title: "File Error", description: "File is too large. Max size: 7MB.", variant: "destructive" });
      return;
    }
    setFile(selectedFile);
  };

  const uploadFile = async (file: File): Promise<string | null> => {
    const { data: { user: currentUser } } = await apiClient.auth.getUser();
    if (!currentUser) return null;
    const ext = file.name.split(".").pop();
    const filePath = `${currentUser.id}/homework/${Date.now()}_${Math.random().toString(36).substring(7)}.${ext}`;
    const { data, error } = await apiClient.storage.from("edulinker-files").upload(filePath, file);
    if (error) {
      toast({ title: "Upload Failed", description: error.message, variant: "destructive" });
      return null;
    }
    return data.publicUrl;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const finalSubject = showCustomSubject ? customSubject : formData.subject;
    if (!formData.standard || !formData.section || !finalSubject || !formData.homework) {
      toast({ title: "Incomplete Information", description: "Please fill out all the fields before sending.", variant: "destructive" });
      return;
    }
    if (!schoolId) {
      toast({ title: "School identity missing", description: "Please logout and login again.", variant: "destructive" });
      return;
    }
    setIsSubmitting(true);
    try {
      let fileUrl: string | null = null;
      if (file) fileUrl = await uploadFile(file);

      await addHomework({
        standard: formData.standard,
        section: formData.section,
        subject: finalSubject,
        description: formData.homework,
        file_url: fileUrl,
        school_id: schoolId,
      });
      await fetchHomework(schoolId);

      await sendNotification("homework", {
        school_id: schoolId,
        standard: formData.standard,
        section: formData.section,
        subject: finalSubject,
        description: formData.homework,
      });

      toast({
        title: "Homework Sent Successfully!",
        description: `Homework for ${formData.standard} - ${formData.section} (${finalSubject}) has been sent.`,
      });
      setFormData({ standard: "", section: "", subject: "", homework: "" });
      setShowCustomSubject(false);
      setCustomSubject("");
      setFile(null);
    } catch (error: any) {
      console.error("Homework send error:", error);
      toast({ title: "Homework Send Failed", description: error?.message || "Something went wrong. Please try again.", variant: "destructive" });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleSubjectChange = (value: string) => {
    if (value === "ADD_NEW") {
      setShowCustomSubject(true);
      setFormData((prev) => ({ ...prev, subject: "" }));
      return;
    }
    setFormData((prev) => ({ ...prev, subject: value }));
  };

  const handleAddCustomSubject = () => {
    if (customSubject.trim()) {
      setSubjects((prev) => [...prev, customSubject.trim()]);
      setFormData((prev) => ({ ...prev, subject: customSubject.trim() }));
      setShowCustomSubject(false);
      setCustomSubject("");
      toast({ title: "Subject Added", description: `${customSubject} has been added.` });
    }
  };

  return (
    <div className="space-y-6 px-4 pb-10 relative z-10 py-6">
      <h1 className="text-3xl font-bold text-foreground text-center">Homework Sender</h1>
      <form
        onSubmit={handleSubmit}
        className="bg-black/30 backdrop-blur-md border border-primary/20 rounded-2xl p-6 max-w-2xl mx-auto space-y-6"
      >
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className="block text-xs font-bold tracking-wider text-primary/60 mb-2">STANDARD</label>
            <Select value={formData.standard} onValueChange={(value) => setFormData((prev) => ({ ...prev, standard: value }))}>
              <SelectTrigger className="w-full px-4 py-3 bg-black/40 border border-primary/20 rounded-lg text-foreground text-base">
                <SelectValue placeholder="Select Standard" />
              </SelectTrigger>
              <SelectContent className="bg-black border border-primary/20 max-h-60 overflow-y-auto">
                {standards.map((s) => (
                  <SelectItem key={s} value={s} className="text-foreground focus:bg-primary/10 focus:text-primary text-base py-2">
                    {s}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div>
            <label className="block text-xs font-bold tracking-wider text-primary/60 mb-2">CLASS SECTION</label>
            <Select value={formData.section} onValueChange={(value) => setFormData((prev) => ({ ...prev, section: value }))}>
              <SelectTrigger className="w-full px-4 py-3 bg-black/40 border border-primary/20 rounded-lg text-foreground text-base">
                <SelectValue placeholder="Select Section" />
              </SelectTrigger>
              <SelectContent className="bg-black border border-primary/20 max-h-60 overflow-y-auto">
                {sections.map((s) => (
                  <SelectItem key={s} value={s} className="text-foreground focus:bg-primary/10 focus:text-primary text-base py-2">
                    {s}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>

        <div>
          <label className="block text-xs font-bold tracking-wider text-primary/60 mb-2">SUBJECT</label>
          {!showCustomSubject ? (
            <Select value={formData.subject} onValueChange={handleSubjectChange}>
              <SelectTrigger className="w-full px-4 py-3 bg-black/40 border border-primary/20 rounded-lg text-foreground text-base">
                <SelectValue placeholder="Select Subject" />
              </SelectTrigger>
              <SelectContent className="bg-black border border-primary/20 max-h-60 overflow-y-auto">
                {subjects.map((s) => (
                  <SelectItem key={s} value={s} className="text-foreground focus:bg-primary/10 focus:text-primary text-base py-2">
                    {s}
                  </SelectItem>
                ))}
                <SelectItem value="ADD_NEW" className="text-primary font-bold focus:bg-primary/10 focus:text-primary text-base py-2">
                  + Add Subject Name
                </SelectItem>
              </SelectContent>
            </Select>
          ) : (
            <div className="flex flex-col gap-2">
              <input
                type="text"
                value={customSubject}
                onChange={(e) => setCustomSubject(e.target.value)}
                placeholder="Enter new subject name..."
                className="w-full px-4 py-3 bg-black/40 border-primary/20 border rounded-lg text-foreground text-base focus:outline-none focus:ring-2 focus:ring-primary/40"
                autoFocus
              />
              <div className="flex gap-2">
                <Button type="button" onClick={handleAddCustomSubject} className="flex-1 bg-primary hover:bg-primary/90 text-primary-foreground font-bold">
                  Add
                </Button>
                <Button type="button" onClick={() => setShowCustomSubject(false)} variant="ghost" className="flex-1 text-foreground/60">
                  Cancel
                </Button>
              </div>
            </div>
          )}
        </div>

        <div>
          <label className="block text-xs font-bold tracking-wider text-primary/60 mb-2">HOMEWORK DETAILS</label>
          <textarea
            value={formData.homework}
            onChange={(e) => setFormData((prev) => ({ ...prev, homework: e.target.value }))}
            placeholder="Enter homework description..."
            className="w-full px-4 py-3 h-36 bg-black/40 border-primary/20 border rounded-lg text-foreground text-base focus:outline-none focus:ring-2 focus:ring-primary/40 resize-y"
          />
        </div>

        <div>
          <label className="block text-xs font-bold tracking-wider text-primary/60 mb-2">ATTACH FILE (OPTIONAL)</label>
          <div className="relative border-2 border-dashed border-primary/20 rounded-lg p-6 text-center cursor-pointer hover:border-primary/40 transition-colors">
            <input
              type="file"
              onChange={handleFileChange}
              className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
              accept=".pdf,.jpg,.jpeg,.png,.webp"
            />
            <div className="flex flex-col items-center justify-center space-y-2 text-foreground/60">
              <Upload size={32} />
              {file ? (
                <div className="flex items-center gap-2">
                  <p className="text-foreground">{file.name}</p>
                  <button
                    type="button"
                    onClick={(e) => { e.stopPropagation(); setFile(null); }}
                    className="text-destructive hover:text-destructive/80"
                  >
                    <X size={16} />
                  </button>
                </div>
              ) : (
                <p>Click to upload (PDF, PNG, JPG, WebP — Max 7MB)</p>
              )}
            </div>
          </div>
        </div>

        <Button
          type="submit"
          disabled={isSubmitting}
          className="w-full bg-primary hover:bg-primary/90 text-primary-foreground font-bold text-base py-3 rounded-lg transition-all duration-300 shadow-[0_0_20px_hsl(51,100%,50%,0.3)]"
        >
          {isSubmitting ? "Sending..." : (
            <>
              <Send size={20} className="mr-2" /> Send Homework
            </>
          )}
        </Button>
      </form>
    </div>
  );
};

export default HomeworkSenderPage;
