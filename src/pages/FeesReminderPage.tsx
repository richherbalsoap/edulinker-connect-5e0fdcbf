import { useState, useMemo } from 'react';
import { Button } from '@/components/ui/button';
import { DollarSign } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import useAppStore from '@/store/appStore';

const standards = ['Nursery', 'LKG', 'UKG', '1', '2', '3', '4', '5', '6', '7', '8', '9', '10', '11', '12'];
const classes = ['A', 'B', 'C', 'D', 'E'];

const FeesReminderPage = () => {
  const { toast } = useToast();
  const allStudents = useAppStore(state => state.students);
  const [standard, setStandard] = useState('');
  const [selectedClass, setSelectedClass] = useState('');
  const [student, setStudent] = useState('');
  const [message, setMessage] = useState('');

  const filteredStudents = useMemo(() => {
    return allStudents.filter(s => {
      if (standard && selectedClass) return s.standard === standard && s.section === selectedClass;
      if (standard) return s.standard === standard;
      return true;
    });
  }, [allStudents, standard, selectedClass]);

  const quickTemplates = [
    `Fees due on ${new Date(new Date().setDate(new Date().getDate() + 10)).toLocaleDateString()}`,
    'Please submit fees for this month',
    'Fees pending. Please clear immediately.',
    'Fees received. Thank you!',
  ];

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!standard || !selectedClass || !student || !message) {
      toast({ title: "Incomplete Information", description: "Please select standard, class, student and enter a message.", variant: "destructive" });
      return;
    }
    toast({ title: "Fees Reminder Sent!", description: `Reminder has been sent to the parent of ${student}.` });
    setStandard(''); setSelectedClass(''); setStudent(''); setMessage('');
  };

  return (
    <div className="space-y-6 px-4 py-6 relative z-10">
      <h1 className="text-3xl font-bold text-foreground text-center">Fees Reminder</h1>
      <div className="bg-black/30 backdrop-blur-md border border-primary/20 rounded-xl p-6 max-w-2xl mx-auto">
        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className="block text-sm font-medium text-primary/60 mb-2">STANDARD *</label>
              <select value={standard} onChange={e => { setStandard(e.target.value); setStudent(''); }} required className="w-full px-4 py-3 bg-black border border-primary/20 rounded-lg text-foreground focus:outline-none focus:ring-2 focus:ring-primary/40">
                <option value="">Select Standard</option>
                {standards.map(std => <option key={std} value={std}>{std}</option>)}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-primary/60 mb-2">CLASS *</label>
              <select value={selectedClass} onChange={e => { setSelectedClass(e.target.value); setStudent(''); }} required className="w-full px-4 py-3 bg-black border border-primary/20 rounded-lg text-foreground focus:outline-none focus:ring-2 focus:ring-primary/40">
                <option value="">Select Class</option>
                {classes.map(cls => <option key={cls} value={cls}>{cls}</option>)}
              </select>
            </div>
          </div>
          <div>
            <label className="block text-sm font-medium text-primary/60 mb-2">SELECT STUDENT *</label>
            {filteredStudents.length > 0 ? (
              <select value={student} onChange={e => setStudent(e.target.value)} required className="w-full px-4 py-3 bg-black border border-primary/20 rounded-lg text-foreground focus:outline-none focus:ring-2 focus:ring-primary/40">
                <option value="">Choose student</option>
                {filteredStudents.map(s => <option key={s.id} value={s.name}>{s.name}</option>)}
              </select>
            ) : (
              <p className="text-foreground/40 text-sm py-3">No students found. Add students first.</p>
            )}
          </div>
          <div>
            <label className="block text-sm font-medium text-primary/60 mb-2">QUICK TEMPLATES</label>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-2">
              {quickTemplates.map(template => (
                <Button key={template} type="button" variant="outline" onClick={() => setMessage(template)} className="text-xs text-center bg-black/40 border-primary/20 hover:bg-primary/10 text-foreground/80 whitespace-normal h-auto py-2">{template}</Button>
              ))}
            </div>
          </div>
          <div>
            <label className="block text-sm font-medium text-primary/60 mb-2">MESSAGE *</label>
            <textarea value={message} onChange={e => setMessage(e.target.value)} required rows={5} className="w-full px-4 py-3 bg-black/40 border border-primary/20 rounded-lg text-foreground placeholder:text-foreground/40 focus:outline-none focus:ring-2 focus:ring-primary/40 resize-none" placeholder="Type your message..." />
          </div>
          <Button type="submit" className="w-full bg-primary hover:bg-primary/90 text-primary-foreground font-bold py-3 rounded-lg shadow-[0_0_20px_hsl(51,100%,50%,0.3)] flex items-center justify-center gap-2">
            <DollarSign size={20} /> Send Reminder
          </Button>
        </form>
      </div>
    </div>
  );
};

export default FeesReminderPage;
