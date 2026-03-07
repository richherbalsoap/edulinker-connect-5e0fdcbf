import { useState, useMemo, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { DollarSign, Trash2 } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import useAppStore from '@/store/appStore';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/context/AuthContext';

const standards = ['Nursery', 'LKG', 'UKG', '1', '2', '3', '4', '5', '6', '7', '8', '9', '10', '11', '12'];
const classes = ['A', 'B', 'C', 'D', 'E'];

interface FeeReminder {
  id: string;
  student_id: string;
  message: string;
  school_id: string | null;
  created_by: string | null;
  created_at: string;
  student?: { id: string; name: string; standard: string; section: string };
}

const FeesReminderPage = () => {
  const { toast } = useToast();
  const { schoolId } = useAuth();
  const allStudents = useAppStore(state => state.students);
  const [standard, setStandard] = useState('');
  const [selectedClass, setSelectedClass] = useState('');
  const [student, setStudent] = useState('');
  const [studentId, setStudentId] = useState('');
  const [message, setMessage] = useState('');
  const [reminders, setReminders] = useState<FeeReminder[]>([]);
  const [loading, setLoading] = useState(false);

  const filteredStudents = useMemo(() => {
    return allStudents.filter(s => {
      if (standard && selectedClass) return s.standard === standard && s.section === selectedClass;
      if (standard) return s.standard === standard;
      return true;
    });
  }, [allStudents, standard, selectedClass]);

  const fetchReminders = async () => {
    if (!schoolId) return;
    const { data } = await supabase
      .from('fees_reminders')
      .select('*, student:students(id, name, standard, section)')
      .eq('school_id', schoolId)
      .order('created_at', { ascending: false });
    if (data) setReminders(data as unknown as FeeReminder[]);
  };

  useEffect(() => {
    fetchReminders();
  }, [schoolId]);

  const quickTemplates = [
    `Fees due on ${new Date(new Date().setDate(new Date().getDate() + 10)).toLocaleDateString()}`,
    'Please submit fees for this month',
    'Fees pending. Please clear immediately.',
    'Fees received. Thank you!',
  ];

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!standard || !selectedClass || !studentId || !message) {
      toast({ title: "Incomplete Information", description: "Please select standard, class, student and enter a message.", variant: "destructive" });
      return;
    }
    setLoading(true);
    const { error } = await supabase.from('fees_reminders').insert({
      student_id: studentId,
      message,
      school_id: schoolId,
    });
    setLoading(false);
    if (error) {
      toast({ title: "Error", description: error.message, variant: "destructive" });
      return;
    }
    toast({ title: "Fees Reminder Sent!", description: `Reminder has been sent to the parent of ${student}.` });
    setStandard(''); setSelectedClass(''); setStudent(''); setStudentId(''); setMessage('');
    fetchReminders();
  };

  const handleDelete = async (id: string) => {
    await supabase.from('fees_reminders').delete().eq('id', id);
    setReminders(prev => prev.filter(r => r.id !== id));
    toast({ title: "Deleted", description: "Reminder deleted." });
  };

  return (
    <div className="space-y-6 px-4 py-6 relative z-10">
      <h1 className="text-3xl font-bold text-foreground text-center">Fees Reminder</h1>
      <div className="bg-black/30 backdrop-blur-md border border-primary/20 rounded-xl p-6 max-w-2xl mx-auto">
        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className="block text-sm font-medium text-primary/60 mb-2">STANDARD *</label>
              <select value={standard} onChange={e => { setStandard(e.target.value); setStudent(''); setStudentId(''); }} required className="w-full px-4 py-3 bg-black border border-primary/20 rounded-lg text-foreground focus:outline-none focus:ring-2 focus:ring-primary/40">
                <option value="">Select Standard</option>
                {standards.map(std => <option key={std} value={std}>{std}</option>)}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-primary/60 mb-2">CLASS *</label>
              <select value={selectedClass} onChange={e => { setSelectedClass(e.target.value); setStudent(''); setStudentId(''); }} required className="w-full px-4 py-3 bg-black border border-primary/20 rounded-lg text-foreground focus:outline-none focus:ring-2 focus:ring-primary/40">
                <option value="">Select Class</option>
                {classes.map(cls => <option key={cls} value={cls}>{cls}</option>)}
              </select>
            </div>
          </div>
          <div>
            <label className="block text-sm font-medium text-primary/60 mb-2">SELECT STUDENT *</label>
            {filteredStudents.length > 0 ? (
              <select value={studentId} onChange={e => {
                const s = filteredStudents.find(st => st.id === e.target.value);
                setStudentId(e.target.value);
                setStudent(s?.name || '');
              }} required className="w-full px-4 py-3 bg-black border border-primary/20 rounded-lg text-foreground focus:outline-none focus:ring-2 focus:ring-primary/40">
                <option value="">Choose student</option>
                {filteredStudents.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
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
          <Button type="submit" disabled={loading} className="w-full bg-primary hover:bg-primary/90 text-primary-foreground font-bold py-3 rounded-lg shadow-[0_0_20px_hsl(51,100%,50%,0.3)] flex items-center justify-center gap-2">
            <DollarSign size={20} /> {loading ? 'Sending...' : 'Send Reminder'}
          </Button>
        </form>
      </div>

      {/* Sent Reminders History */}
      {reminders.length > 0 && (
        <div className="max-w-2xl mx-auto space-y-4">
          <h2 className="text-xl font-bold text-foreground">Sent Reminders</h2>
          <div className="space-y-3">
            {reminders.map(r => (
              <div key={r.id} className="bg-black/30 backdrop-blur-md border border-primary/20 rounded-xl p-4 flex items-start justify-between gap-4">
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2 flex-wrap mb-1">
                    <span className="font-bold text-foreground">{r.student?.name || 'Unknown'}</span>
                    {r.student && (
                      <span className="text-xs bg-primary/10 text-primary/80 px-2 py-0.5 rounded border border-primary/20">
                        Class {r.student.standard} - {r.student.section}
                      </span>
                    )}
                  </div>
                  <p className="text-foreground/70 text-sm">{r.message}</p>
                  <p className="text-foreground/40 text-xs mt-1">{new Date(r.created_at).toLocaleString()}</p>
                </div>
                <Button variant="ghost" size="sm" onClick={() => handleDelete(r.id)} className="text-destructive hover:bg-destructive/10 flex-shrink-0">
                  <Trash2 size={16} />
                </Button>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

export default FeesReminderPage;
