import { useState, useMemo, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { useToast } from '@/hooks/use-toast';
import { AlertTriangle, Upload, X } from 'lucide-react';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import useAppStore from '@/store/appStore';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/context/AuthContext';

const standards = ['Nursery', 'LKG', 'UKG', '1', '2', '3', '4', '5', '6', '7', '8', '9', '10', '11', '12'];
const classes = ['A', 'B', 'C', 'D', 'E'];

const ComplaintSenderPage = () => {
  const { toast } = useToast();
  const { schoolId } = useAuth();
  const allStudents = useAppStore(state => state.students);
  const addComplaint = useAppStore(state => state.addComplaint);
  const fetchStudents = useAppStore(state => state.fetchStudents);
  const [formData, setFormData] = useState({ studentId: '', standard: '', class: '', description: '' });
  const [file, setFile] = useState<File | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => { fetchStudents(); }, []);

  const filteredStudents = useMemo(() => {
    return allStudents.filter(s => {
      if (formData.standard && formData.class) return s.standard === formData.standard && s.section === formData.class;
      if (formData.standard) return s.standard === formData.standard;
      return true;
    });
  }, [allStudents, formData.standard, formData.class]);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = e.target.files?.[0];
    if (!selectedFile) return;
    const allowedTypes = ['application/pdf', 'image/jpeg', 'image/png', 'image/webp'];
    if (!allowedTypes.includes(selectedFile.type)) {
      toast({ title: 'File Error', description: 'Only PDF, JPEG, PNG, and WebP files are allowed.', variant: 'destructive' });
      return;
    }
    if (selectedFile.size > 7 * 1024 * 1024) {
      toast({ title: 'File Error', description: 'File is too large. Max size: 7MB.', variant: 'destructive' });
      return;
    }
    setFile(selectedFile);
  };

  const uploadFile = async (file: File): Promise<string | null> => {
    const ext = file.name.split('.').pop();
    const filePath = `complaints/${Date.now()}_${Math.random().toString(36).substring(7)}.${ext}`;
    const { error } = await supabase.storage.from('edulinker-files').upload(filePath, file);
    if (error) {
      toast({ title: 'Upload Failed', description: error.message, variant: 'destructive' });
      return null;
    }
    return filePath;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.standard || !formData.class || !formData.studentId || !formData.description) {
      toast({ title: "Incomplete Form", description: "Please fill out all required fields.", variant: "destructive" });
      return;
    }
    if (!schoolId) {
      toast({ title: "School identity missing", description: "Please logout and login again.", variant: "destructive" });
      return;
    }
    setIsSubmitting(true);
    let fileUrl: string | null = null;
    if (file) {
      fileUrl = await uploadFile(file);
    }
    const student = allStudents.find(s => s.id === formData.studentId);
    await addComplaint({ student_id: formData.studentId, description: formData.description, file_url: fileUrl, school_id: schoolId });
    toast({ title: "Complaint Registered!", description: `Your complaint regarding ${student?.name || 'student'} has been submitted.` });
    setFormData({ studentId: '', standard: '', class: '', description: '' });
    setFile(null);
    setIsSubmitting(false);
  };

  return (
    <div className="space-y-6 relative z-10 px-4 py-6">
      <h1 className="text-3xl font-bold text-foreground text-center">Log a Complaint</h1>
      <div className="bg-black/30 backdrop-blur-md border border-primary/20 rounded-xl p-6 max-w-2xl mx-auto">
        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className="block text-sm font-medium text-primary/60 mb-2">STANDARD *</label>
              <Select value={formData.standard} onValueChange={value => setFormData({ ...formData, standard: value, studentId: '' })}>
                <SelectTrigger className="w-full px-4 py-3 bg-black/40 border border-primary/20 rounded-lg text-foreground"><SelectValue placeholder="Select Standard" /></SelectTrigger>
                <SelectContent className="bg-black border border-primary/20 max-h-60 overflow-y-auto">
                  {standards.map(std => <SelectItem key={std} value={std} className="text-foreground focus:bg-primary/10 focus:text-primary">{std}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
            <div>
              <label className="block text-sm font-medium text-primary/60 mb-2">CLASS *</label>
              <Select value={formData.class} onValueChange={value => setFormData({ ...formData, class: value, studentId: '' })}>
                <SelectTrigger className="w-full px-4 py-3 bg-black/40 border border-primary/20 rounded-lg text-foreground"><SelectValue placeholder="Select Class" /></SelectTrigger>
                <SelectContent className="bg-black border border-primary/20 max-h-60 overflow-y-auto">
                  {classes.map(cls => <SelectItem key={cls} value={cls} className="text-foreground focus:bg-primary/10 focus:text-primary">{cls}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
          </div>
          <div>
            <label className="block text-sm font-medium text-primary/60 mb-2">STUDENT NAME *</label>
            {filteredStudents.length > 0 ? (
              <Select value={formData.studentId} onValueChange={value => setFormData({ ...formData, studentId: value })}>
                <SelectTrigger className="w-full px-4 py-3 bg-black/40 border border-primary/20 rounded-lg text-foreground"><SelectValue placeholder="Select a student" /></SelectTrigger>
                <SelectContent className="bg-black border border-primary/20 max-h-60 overflow-y-auto">
                  {filteredStudents.map(student => <SelectItem key={student.id} value={student.id} className="text-foreground focus:bg-primary/10 focus:text-primary">{student.name}</SelectItem>)}
                </SelectContent>
              </Select>
            ) : (
              <p className="text-foreground/40 text-sm py-3">No students found. Add students first from the Student Management page.</p>
            )}
          </div>
          <div>
            <label className="block text-sm font-medium text-primary/60 mb-2">COMPLAINT DETAILS *</label>
            <textarea value={formData.description} onChange={e => setFormData({ ...formData, description: e.target.value })} required rows={5}
              className="w-full px-4 py-3 bg-black/40 border border-primary/20 rounded-lg text-foreground placeholder:text-foreground/40 focus:outline-none focus:ring-2 focus:ring-primary/40 resize-none" placeholder="Describe the issue clearly..." />
          </div>

          {/* File Upload */}
          <div>
            <label className="block text-sm font-medium text-primary/60 mb-2">ATTACH FILE (OPTIONAL)</label>
            <div className="relative border-2 border-dashed border-primary/20 rounded-lg p-6 text-center cursor-pointer hover:border-primary/40 transition-colors">
              <input type="file" onChange={handleFileChange} className="absolute inset-0 w-full h-full opacity-0 cursor-pointer" accept=".pdf,.jpg,.jpeg,.png,.webp" />
              <div className="flex flex-col items-center justify-center space-y-2 text-foreground/60">
                <Upload size={32} />
                {file ? (
                  <div className="flex items-center gap-2">
                    <p className="text-foreground">{file.name}</p>
                    <button type="button" onClick={(e) => { e.stopPropagation(); setFile(null); }} className="text-destructive hover:text-destructive/80"><X size={16} /></button>
                  </div>
                ) : (
                  <p>Click to upload (PDF, PNG, JPG, WebP — Max 7MB)</p>
                )}
              </div>
            </div>
          </div>

          <Button type="submit" disabled={isSubmitting} className="w-full bg-primary hover:bg-primary/90 text-primary-foreground font-bold py-3 rounded-lg transition-all duration-300 shadow-[0_0_20px_hsl(51,100%,50%,0.3)]">
            {isSubmitting ? 'Submitting...' : <><AlertTriangle size={20} className="mr-2" /> Send Complaint</>}
          </Button>
        </form>
      </div>
    </div>
  );
};

export default ComplaintSenderPage;
