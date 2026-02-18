import { useState, useEffect, useMemo } from 'react';
import { Button } from '@/components/ui/button';
import { Send, Upload, Trash2, ChevronDown } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import useAppStore from '@/store/appStore';

const standards = ['Nursery', 'LKG', 'UKG', '1', '2', '3', '4', '5', '6', '7', '8', '9', '10', '11', '12'];

const ResultSenderPage = () => {
  const { toast } = useToast();
  const addResult = useAppStore(state => state.addResult);
  const allStudents = useAppStore(state => state.students);
  const fetchStudents = useAppStore(state => state.fetchStudents);

  const [studentId, setStudentId] = useState('');
  const [standard, setStandard] = useState('');
  const [section, setSection] = useState('');
  const [file, setFile] = useState<File | null>(null);
  const [subjects, setSubjects] = useState([{ name: '', marks_obtained: '', total_marks: '' }]);
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => { fetchStudents(); }, []);

  const filteredStudents = useMemo(() => {
    return allStudents.filter(s => {
      if (standard && section) return s.standard === standard && s.section === section;
      if (standard) return s.standard === standard;
      return true;
    });
  }, [allStudents, standard, section]);

  const handleSubjectChange = (index: number, field: string, value: string) => {
    const newSubjects = [...subjects];
    (newSubjects[index] as any)[field] = value;
    setSubjects(newSubjects);
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = e.target.files?.[0];
    if (selectedFile && selectedFile.size < 5 * 1024 * 1024) setFile(selectedFile);
    else toast({ title: 'File Error', description: 'File is too large or invalid. Max size: 5MB.', variant: 'destructive' });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const validSubjects = subjects.filter(s => s.name && s.marks_obtained && s.total_marks);
    if (!studentId || validSubjects.length === 0) {
      toast({ title: 'Missing Information', description: 'Please select a student and add at least one subject with marks.', variant: 'destructive' });
      return;
    }
    setIsSubmitting(true);
    for (const sub of validSubjects) {
      await addResult({
        student_id: studentId,
        subject: sub.name,
        marks_obtained: parseFloat(sub.marks_obtained),
        total_marks: parseFloat(sub.total_marks),
        file_name: file ? file.name : null,
      });
    }
    const student = allStudents.find(s => s.id === studentId);
    toast({ title: 'Result Sent Successfully!', description: `Marks for ${student?.name || 'student'} have been recorded.` });
    setStudentId(''); setStandard(''); setSection(''); setFile(null);
    setSubjects([{ name: '', marks_obtained: '', total_marks: '' }]);
    setIsSubmitting(false);
  };

  return (
    <div className="space-y-6 px-4 pb-10 relative z-10 py-6">
      <div className="text-center pt-4">
        <h1 className="text-3xl font-bold text-foreground">Result Sender</h1>
        <p className="text-foreground/70">Enter or upload student marks</p>
      </div>
      <form onSubmit={handleSubmit} className="bg-black/30 backdrop-blur-md border border-primary/20 rounded-2xl p-6 max-w-2xl mx-auto space-y-6">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div className="relative">
            <label className="block text-xs font-bold tracking-wider text-primary/60 mb-2">STANDARD</label>
            <select value={standard} onChange={e => setStandard(e.target.value)} className="w-full appearance-none p-3 bg-black border-primary/20 border rounded-lg text-foreground focus:outline-none focus:ring-2 focus:ring-primary/40">
              <option value="" disabled>Select Standard</option>
              {standards.map(s => <option key={s} value={s}>{s}</option>)}
            </select>
            <ChevronDown className="absolute right-3 bottom-3 w-5 h-5 text-primary/50 pointer-events-none" />
          </div>
          <div className="relative">
            <label className="block text-xs font-bold tracking-wider text-primary/60 mb-2">CLASS SECTION</label>
            <select value={section} onChange={e => setSection(e.target.value)} className="w-full appearance-none p-3 bg-black border-primary/20 border rounded-lg text-foreground focus:outline-none focus:ring-2 focus:ring-primary/40">
              <option value="" disabled>Select Section</option>
              {['A', 'B', 'C', 'D', 'E'].map(s => <option key={s} value={s}>{s}</option>)}
            </select>
            <ChevronDown className="absolute right-3 bottom-3 w-5 h-5 text-primary/50 pointer-events-none" />
          </div>
        </div>

        <div>
          <label className="block text-xs font-bold tracking-wider text-primary/60 mb-2">SELECT STUDENT</label>
          {filteredStudents.length > 0 ? (
            <Select value={studentId} onValueChange={setStudentId}>
              <SelectTrigger className="w-full p-3 bg-black/40 border border-primary/20 rounded-lg text-foreground"><SelectValue placeholder="Select a student" /></SelectTrigger>
              <SelectContent className="bg-black border border-primary/20 max-h-60 overflow-y-auto">
                {filteredStudents.map(s => <SelectItem key={s.id} value={s.id} className="text-foreground focus:bg-primary/10 focus:text-primary">{s.name} ({s.standard}-{s.section})</SelectItem>)}
              </SelectContent>
            </Select>
          ) : (
            <p className="text-foreground/40 text-sm py-3">No students found. Add students first.</p>
          )}
        </div>

        <div className="space-y-3">
          <label className="block text-xs font-bold tracking-wider text-primary/60">SUBJECTS & MARKS</label>
          {subjects.map((subject, index) => (
            <div key={index} className="flex items-center gap-2 flex-wrap sm:flex-nowrap">
              <input type="text" value={subject.name} onChange={e => handleSubjectChange(index, 'name', e.target.value)} placeholder="Subject" className="flex-1 min-w-0 p-3 bg-black/40 border-primary/20 border rounded-lg text-foreground focus:outline-none focus:ring-2 focus:ring-primary/40" />
              <input type="number" value={subject.marks_obtained} onChange={e => handleSubjectChange(index, 'marks_obtained', e.target.value)} placeholder="Obtained" className="w-24 p-3 bg-black/40 border-primary/20 border rounded-lg text-foreground focus:outline-none focus:ring-2 focus:ring-primary/40" />
              <input type="number" value={subject.total_marks} onChange={e => handleSubjectChange(index, 'total_marks', e.target.value)} placeholder="Total" className="w-24 p-3 bg-black/40 border-primary/20 border rounded-lg text-foreground focus:outline-none focus:ring-2 focus:ring-primary/40" />
              <Button type="button" onClick={() => setSubjects(subjects.filter((_, i) => i !== index))} variant="destructive" className="p-3 bg-destructive/20 hover:bg-destructive/30 text-destructive border border-destructive/30 flex-shrink-0"><Trash2 size={16} /></Button>
            </div>
          ))}
          <Button type="button" onClick={() => setSubjects([...subjects, { name: '', marks_obtained: '', total_marks: '' }])} className="text-primary/80 hover:text-primary bg-black/40 hover:bg-primary/10 w-full border border-primary/20">+ Add Another Subject</Button>
        </div>
        <div className="text-center text-foreground/50 my-4 text-sm">OR</div>
        <div>
          <label className="block text-xs font-bold tracking-wider text-primary/60 mb-2">UPLOAD RESULT FILE</label>
          <div className="relative border-2 border-dashed border-primary/20 rounded-lg p-6 text-center cursor-pointer hover:border-primary/40 transition-colors">
            <input type="file" onChange={handleFileChange} className="absolute inset-0 w-full h-full opacity-0" accept=".pdf,.jpg,.png" />
            <div className="flex flex-col items-center justify-center space-y-2 text-foreground/60">
              <Upload size={32} />
              {file ? <p>Selected file: {file.name}</p> : <p>Click to upload (PDF, PNG, JPG)</p>}
            </div>
          </div>
        </div>
        <Button type="submit" disabled={isSubmitting} className="w-full bg-primary hover:bg-primary/90 text-primary-foreground font-bold text-base py-3 rounded-lg shadow-[0_0_20px_hsl(51,100%,50%,0.3)]">
          {isSubmitting ? 'Submitting...' : <><Send size={20} className="mr-2" /> Send Result</>}
        </Button>
      </form>
    </div>
  );
};

export default ResultSenderPage;
