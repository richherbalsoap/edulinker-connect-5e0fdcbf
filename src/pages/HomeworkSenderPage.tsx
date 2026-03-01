import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { Send, ChevronDown, Upload, X } from "lucide-react";
import useAppStore from "@/store/appStore";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/context/AuthContext";

const standards = ["Nursery", "LKG", "UKG", "1", "2", "3", "4", "5", "6", "7", "8", "9", "10", "11", "12"];
const sections = ["A", "B", "C", "D", "E"];
const initialSubjects = ["Mathematics", "Science", "English", "Hindi", "Social Studies", "Computer Science"];

const HomeworkSenderPage = () => {
  const { toast } = useToast();
  const { schoolId } = useAuth();
  const addHomework = useAppStore((state) => state.addHomework);
  const fetchHomework = useAppStore((state) => state.fetchHomework);
  const [subjects, setSubjects] = useState(initialSubjects);
  const [showCustomSubject, setShowCustomSubject] = useState(false);
  const [customSubject, setCustomSubject] = useState("");
  const [formData, setFormData] = useState({ standard: "", section: "", subject: "", homework: "" });
  const [file, setFile] = useState<File | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

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

  const uploadFile = async (file: File): Promise<string | null> => {
    const {
      data: { user: currentUser },
    } = await supabase.auth.getUser();
    if (!currentUser) return null;
    const ext = file.name.split(".").pop();
    const filePath = `${currentUser.id}/homework/${Date.now()}_${Math.random().toString(36).substring(7)}.${ext}`;
    const { error } = await supabase.storage.from("edulinker-files").upload(filePath, file);
    if (error) {
      toast({ title: "Upload Failed", description: error.message, variant: "destructive" });
      return null;
    }
    return filePath;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const finalSubject = showCustomSubject ? customSubject : formData.subject;
    if (!formData.standard || !formData.section || !finalSubject || !formData.homework) {
      toast({
        title: "Incomplete Information",
        description: "Please fill out all the fields before sending.",
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
    setIsSubmitting(true);
    let fileUrl: string | null = null;
    if (file) {
      fileUrl = await uploadFile(file);
    }
    await addHomework({
      standard: formData.standard,
      section: formData.section,
      subject: finalSubject,
      description: formData.homework,
      file_url: fileUrl,
      school_id: schoolId,
    });
    // Re-fetch homework list after insert
    await fetchHomework(schoolId);
    toast({
      title: "Homework Sent Successfully!",
      description: `Homework for ${formData.standard} - ${formData.section} (${finalSubject}) has been sent.`,
    });
    setFormData({ standard: "", section: "", subject: "", homework: "" });
    setShowCustomSubject(false);
    setCustomSubject("");
    setFile(null);
    setIsSubmitting(false);
  };

  const handleInputChange = (field: string, value: string) => {
    if (field === "subject" && value === "ADD_NEW") {
      setShowCustomSubject(true);
      setFormData((prev) => ({ ...prev, subject: "" }));
      return;
    }
    setFormData((prev) => ({ ...prev, [field]: value }));
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
          <div className="relative">
            <label className="block text-xs font-bold tracking-wider text-primary/60 mb-2">STANDARD</label>
            <select
              value={formData.standard}
              onChange={(e) => handleInputChange("standard", e.target.value)}
              className="w-full appearance-none p-3 bg-black border-primary/20 border rounded-lg text-foreground focus:outline-none focus:ring-2 focus:ring-primary/40"
            >
              <option value="" disabled className="bg-black text-white">
                Select Standard
              </option>
              {standards.map((s) => (
                <option key={s} value={s} className="bg-black text-white">
                  {s}
                </option>
              ))}
            </select>
            <ChevronDown className="absolute right-3 bottom-3 w-5 h-5 text-primary/50 pointer-events-none" />
          </div>
          <div className="relative">
            <label className="block text-xs font-bold tracking-wider text-primary/60 mb-2">CLASS SECTION</label>
            <select
              value={formData.section}
              onChange={(e) => handleInputChange("section", e.target.value)}
              className="w-full appearance-none p-3 bg-black border-primary/20 border rounded-lg text-foreground focus:outline-none focus:ring-2 focus:ring-primary/40"
            >
              <option value="" disabled className="bg-black text-white">
                Select Section
              </option>
              {sections.map((s) => (
                <option key={s} value={s} className="bg-black text-white">
                  {s}
                </option>
              ))}
            </select>
            <ChevronDown className="absolute right-3 bottom-3 w-5 h-5 text-primary/50 pointer-events-none" />
          </div>
        </div>
        <div className="relative">
          <label className="block text-xs font-bold tracking-wider text-primary/60 mb-2">SUBJECT</label>
          {!showCustomSubject ? (
            <div className="relative">
              <select
                value={formData.subject}
                onChange={(e) => handleInputChange("subject", e.target.value)}
                className="w-full appearance-none p-3 bg-black border-primary/20 border rounded-lg text-foreground focus:outline-none focus:ring-2 focus:ring-primary/40"
              >
                <option value="" disabled className="bg-black text-white">
                  Select Subject
                </option>
                {subjects.map((s) => (
                  <option key={s} value={s} className="bg-black text-white">
                    {s}
                  </option>
                ))}
                <option value="ADD_NEW" className="bg-black text-primary font-bold">
                  + Add Subject Name
                </option>
              </select>
              <ChevronDown className="absolute right-3 bottom-3 w-5 h-5 text-primary/50 pointer-events-none" />
            </div>
          ) : (
            <div className="flex gap-2">
              <input
                type="text"
                value={customSubject}
                onChange={(e) => setCustomSubject(e.target.value)}
                placeholder="Enter new subject name..."
                className="flex-1 p-3 bg-black/40 border-primary/20 border rounded-lg text-foreground focus:outline-none focus:ring-2 focus:ring-primary/40"
                autoFocus
              />
              <Button
                type="button"
                onClick={handleAddCustomSubject}
                className="bg-primary hover:bg-primary/90 text-primary-foreground font-bold"
              >
                Add
              </Button>
              <Button
                type="button"
                onClick={() => setShowCustomSubject(false)}
                variant="ghost"
                className="text-foreground/60"
              >
                Cancel
              </Button>
            </div>
          )}
        </div>
        <div>
          <label className="block text-xs font-bold tracking-wider text-primary/60 mb-2">HOMEWORK DETAILS</label>
          <textarea
            value={formData.homework}
            onChange={(e) => handleInputChange("homework", e.target.value)}
            placeholder="Enter homework description..."
            className="w-full p-3 h-32 bg-black/40 border-primary/20 border rounded-lg text-foreground focus:outline-none focus:ring-2 focus:ring-primary/40 resize-y"
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
                    onClick={(e) => {
                      e.stopPropagation();
                      setFile(null);
                    }}
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
          {isSubmitting ? (
            "Sending..."
          ) : (
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
