import { useState, useRef } from "react";
import { Button } from "@/components/ui/button";
import { X, Camera, Mic, Upload, CheckCircle2, Loader2, Sparkles } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import useAppStore from "@/store/appStore";
import { parseMarksheetImage, parseVoiceToMarks } from "@/utils/aiHelpers";
import { sendNotification } from "@/utils/sendNotification";

interface AiResultEntryModalProps {
  isOpen: boolean;
  onClose: () => void;
  schoolId: string;
  students: any[];
  standard: string;
  section: string;
  subject: string;
  totalMarks: number;
  examName: string;
}

const AiResultEntryModal = ({
  isOpen,
  onClose,
  schoolId,
  students,
  standard,
  section,
  subject,
  totalMarks,
  examName
}: AiResultEntryModalProps) => {
  const { toast } = useToast();
  const addResult = useAppStore(state => state.addResult);
  
  const [activeTab, setActiveTab] = useState<"camera" | "voice">("camera");
  const [isProcessing, setIsProcessing] = useState(false);
  const [parsedMarks, setParsedMarks] = useState<Record<string, number>>({});
  const [isListening, setIsListening] = useState(false);
  
  const fileInputRef = useRef<HTMLInputElement>(null);

  const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
  const recognition = SpeechRecognition ? new SpeechRecognition() : null;

  if (recognition) {
    recognition.continuous = false;
    recognition.interimResults = false;
    recognition.lang = 'en-IN';
  }

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setIsProcessing(true);
    try {
      const reader = new FileReader();
      reader.onloadend = async () => {
        const base64data = reader.result as string;
        const marksList = await parseMarksheetImage(base64data, file.type);
        
        const marksMap: Record<string, number> = {};
        marksList.forEach(m => {
          const student = students.find(s => s.roll_no === m.roll_no);
          if (student && typeof m.marks === "number") {
            marksMap[student.id] = m.marks;
          }
        });
        
        setParsedMarks(marksMap);
        toast({ title: "Image Parsed", description: `Found marks for ${Object.keys(marksMap).length} students.` });
      };
      reader.readAsDataURL(file);
    } catch (err: any) {
      toast({ title: "Error", description: err.message, variant: "destructive" });
    } finally {
      setIsProcessing(false);
    }
  };

  const handleMicStart = () => {
    if (!recognition) {
      toast({ title: "Not Supported", description: "Voice recognition is not supported in this browser.", variant: "destructive" });
      return;
    }

    recognition.onstart = () => setIsListening(true);
    recognition.onresult = async (event: any) => {
      const transcript = event.results[0][0].transcript;
      setIsProcessing(true);
      try {
        const marksList = await parseVoiceToMarks(transcript);
        const marksMap = { ...parsedMarks };
        marksList.forEach(m => {
          const student = students.find(s => s.roll_no === m.roll_no);
          if (student && typeof m.marks === "number") {
            marksMap[student.id] = m.marks;
          }
        });
        setParsedMarks(marksMap);
        toast({ title: "Voice Parsed", description: `Added marks for ${marksList.length} students.` });
      } catch (err: any) {
        toast({ title: "Error", description: err.message, variant: "destructive" });
      } finally {
        setIsProcessing(false);
      }
    };
    recognition.onerror = () => setIsListening(false);
    recognition.onend = () => setIsListening(false);
    
    recognition.start();
  };

  const saveResults = async () => {
    const studentIds = Object.keys(parsedMarks);
    if (studentIds.length === 0) return;

    setIsProcessing(true);
    try {
      for (const sId of studentIds) {
        const marks = parsedMarks[sId];
        await addResult({
          student_id: sId,
          subject: subject,
          exam_name: examName,
          marks_obtained: marks,
          total_marks: totalMarks,
          file_url: null,
          school_id: schoolId
        });
        
        await sendNotification("result", {
          student_id: sId,
          exam_name: examName || "Exam",
          subject: subject,
          marks_obtained: marks,
          total_marks: totalMarks,
          percentage: Math.round((marks / totalMarks) * 100),
        });
      }
      toast({ title: "Success", description: "All marks saved successfully!" });
      onClose();
    } catch (err: any) {
      toast({ title: "Error saving", description: err.message, variant: "destructive" });
    } finally {
      setIsProcessing(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/70 z-[100] flex justify-center items-center p-4">
      <div className="bg-black/90 backdrop-blur-2xl rounded-2xl p-6 w-full max-w-lg border border-primary/30 relative">
        <Button onClick={onClose} className="absolute top-4 right-4 bg-transparent hover:bg-primary/10 p-2 h-auto rounded-full">
          <X className="text-foreground/70" size={20} />
        </Button>
        
        <h2 className="text-2xl font-bold text-primary mb-2 flex items-center gap-2">
          <Sparkles className="text-primary" /> AI Smart Entry
        </h2>
        <p className="text-sm text-foreground/60 mb-6">Class {standard}-{section} | {subject} (Max: {totalMarks})</p>

        <div className="flex gap-4 mb-6 border-b border-primary/20 pb-4">
          <Button 
            variant={activeTab === "camera" ? "default" : "outline"}
            onClick={() => setActiveTab("camera")}
            className={activeTab === "camera" ? "bg-primary text-black" : "border-primary/20"}
          >
            <Camera className="mr-2" size={16} /> AI Scanner
          </Button>
          <Button 
            variant={activeTab === "voice" ? "default" : "outline"}
            onClick={() => setActiveTab("voice")}
            className={activeTab === "voice" ? "bg-primary text-black" : "border-primary/20"}
          >
            <Mic className="mr-2" size={16} /> Voice Dictation
          </Button>
        </div>

        {activeTab === "camera" && (
          <div className="flex flex-col items-center justify-center p-8 border-2 border-dashed border-primary/30 rounded-xl bg-black/40 mb-6">
            <input type="file" accept="image/*" className="hidden" ref={fileInputRef} onChange={handleImageUpload} />
            <Button onClick={() => fileInputRef.current?.click()} variant="outline" className="border-primary/40 text-primary hover:bg-primary/10">
              <Upload className="mr-2" /> Upload Marksheet Photo
            </Button>
            <p className="text-xs text-foreground/50 mt-4 text-center">Take a photo of your handwritten marks register.<br/>AI will automatically extract Roll No and Marks.</p>
          </div>
        )}

        {activeTab === "voice" && (
          <div className="flex flex-col items-center justify-center p-8 border-2 border-dashed border-primary/30 rounded-xl bg-black/40 mb-6">
            <Button 
              onClick={handleMicStart} 
              variant="outline" 
              className={`rounded-full w-20 h-20 flex items-center justify-center ${isListening ? 'bg-red-500/20 border-red-500 text-red-500 animate-pulse' : 'border-primary/40 text-primary hover:bg-primary/10'}`}
            >
              <Mic size={32} />
            </Button>
            <p className="text-xs text-foreground/50 mt-4 text-center">
              {isListening ? "Listening... Speak now!" : "Click to start dictating."}<br/>
              E.g. "Roll number 1 got 45, Roll number 2 got 38."
            </p>
          </div>
        )}

        <div className="bg-primary/5 rounded-lg p-4 max-h-40 overflow-y-auto mb-6">
          <h3 className="text-sm font-semibold mb-2">Parsed Marks ({Object.keys(parsedMarks).length})</h3>
          {Object.keys(parsedMarks).length === 0 ? (
            <p className="text-xs text-foreground/40 italic">No marks parsed yet.</p>
          ) : (
            <div className="grid grid-cols-2 gap-2">
              {Object.entries(parsedMarks).map(([studentId, marks]) => {
                const s = students.find(x => x.id === studentId);
                return (
                  <div key={studentId} className="text-xs bg-black/40 p-2 rounded border border-primary/10 flex justify-between">
                    <span className="truncate pr-2">{s?.name} (Roll: {s?.roll_no})</span>
                    <span className="font-bold text-primary">{marks}</span>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        <Button 
          className="w-full bg-primary text-black hover:bg-primary/90 font-bold py-6 text-lg" 
          onClick={saveResults}
          disabled={isProcessing || Object.keys(parsedMarks).length === 0}
        >
          {isProcessing ? <Loader2 className="animate-spin mr-2" /> : <CheckCircle2 className="mr-2" />}
          Save {Object.keys(parsedMarks).length} Results
        </Button>
      </div>
    </div>
  );
};

export default AiResultEntryModal;
