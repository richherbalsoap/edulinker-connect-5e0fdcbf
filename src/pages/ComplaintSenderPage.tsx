import { useState, useMemo, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { useToast } from '@/hooks/use-toast';
import { AlertTriangle } from 'lucide-react';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import useAppStore from '@/store/appStore';

const standards = ['Nursery', 'LKG', 'UKG', '1', '2', '3', '4', '5', '6', '7', '8', '9', '10', '11', '12'];
const classes = ['A', 'B', 'C', 'D', 'E'];

const ComplaintSenderPage = () => {
  const { toast } = useToast();
  const allStudents = useAppStore(state => state.students);
  const addComplaint = useAppStore(state => state.addComplaint);
  const fetchStudents = useAppStore(state => state.fetchStudents);
  const [formData, setFormData] = useState({ studentId: '', standard: '', class: '', description: '' });

  useEffect(() => { fetchStudents(); }, []);

  const filteredStudents = useMemo(() => {
    return allStudents.filter(s => {
      if (formData.standard && formData.class) return s.standard === formData.standard && s.section === formData.class;
      if (formData.standard) return s.standard === formData.standard;
      return true;
    });
  }, [allStudents, formData.standard, formData.class]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.standard || !formData.class || !formData.studentId || !formData.description) {
      toast({ title: "Incomplete Form", description: "Please fill out all required fields.", variant: "destructive" });
      return;
    }
    const student = allStudents.find(s => s.id === formData.studentId);
    await addComplaint({ student_id: formData.studentId, description: formData.description });
    toast({ title: "Complaint Registered!", description: `Your complaint regarding ${student?.name || 'student'} has been submitted.` });
    setFormData({ studentId: '', standard: '', class: '', description: '' });
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
          <Button type="submit" className="w-full bg-primary hover:bg-primary/90 text-primary-foreground font-bold py-3 rounded-lg transition-all duration-300 shadow-[0_0_20px_hsl(51,100%,50%,0.3)]">
            <AlertTriangle size={20} className="mr-2" /> Send Complaint
          </Button>
        </form>
      </div>
    </div>
  );
};

export default ComplaintSenderPage;
