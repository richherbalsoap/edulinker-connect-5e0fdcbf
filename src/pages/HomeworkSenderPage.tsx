import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { useToast } from '@/hooks/use-toast';
import { Send, ChevronDown } from 'lucide-react';
import useAppStore from '@/store/appStore';

const standards = ['Nursery', 'LKG', 'UKG', '1', '2', '3', '4', '5', '6', '7', '8', '9', '10', '11', '12'];
const sections = ['A', 'B', 'C', 'D', 'E'];
const initialSubjects = ['Mathematics', 'Science', 'English', 'Hindi', 'Social Studies', 'Computer Science'];

const HomeworkSenderPage = () => {
  const { toast } = useToast();
  const addHomework = useAppStore((state) => state.addHomework);
  const [subjects, setSubjects] = useState(initialSubjects);
  const [showCustomSubject, setShowCustomSubject] = useState(false);
  const [customSubject, setCustomSubject] = useState('');
  const [formData, setFormData] = useState({ standard: '', section: '', subject: '', homework: '', dueDate: '' });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const finalSubject = showCustomSubject ? customSubject : formData.subject;
    if (!formData.standard || !formData.section || !finalSubject || !formData.homework) {
      toast({ title: "Incomplete Information", description: "Please fill out all the fields before sending.", variant: "destructive" });
      return;
    }
    addHomework({ standard: formData.standard, section: formData.section, subject: finalSubject, homework: formData.homework, dueDate: formData.dueDate });
    toast({ title: "Homework Sent Successfully!", description: `Homework for ${formData.standard} - ${formData.section} (${finalSubject}) has been sent.` });
    setFormData({ standard: '', section: '', subject: '', homework: '', dueDate: '' });
    setShowCustomSubject(false);setCustomSubject('');
  };

  const handleInputChange = (field: string, value: string) => {
    if (field === 'subject' && value === 'ADD_NEW') {setShowCustomSubject(true);setFormData((prev) => ({ ...prev, subject: '' }));return;}
    setFormData((prev) => ({ ...prev, [field]: value }));
  };

  const handleAddCustomSubject = () => {
    if (customSubject.trim()) {
      setSubjects((prev) => [...prev, customSubject.trim()]);
      setFormData((prev) => ({ ...prev, subject: customSubject.trim() }));
      setShowCustomSubject(false);setCustomSubject('');
      toast({ title: "Subject Added", description: `${customSubject} has been added.` });
    }
  };

  return (
    <div className="space-y-6 px-4 pb-10 relative z-10 py-6">
      <h1 className="text-3xl font-bold text-foreground text-center">Homework Sender</h1>
      <form onSubmit={handleSubmit} className="bg-black/30 backdrop-blur-md border border-primary/20 rounded-2xl p-6 max-w-2xl mx-auto space-y-6">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div className="relative">
            <label className="block text-xs font-bold tracking-wider text-primary/60 mb-2">STANDARD</label>
            <select value={formData.standard} onChange={(e) => handleInputChange('standard', e.target.value)} className="w-full appearance-none p-3 bg-black border-primary/20 border rounded-lg text-foreground focus:outline-none focus:ring-2 focus:ring-primary/40">
              <option value="" disabled className="bg-black text-white">Select Standard</option>
              {standards.map((s) => <option key={s} value={s} className="bg-black text-white">{s}</option>)}
            </select>
            <ChevronDown className="absolute right-3 bottom-3 w-5 h-5 text-primary/50 pointer-events-none" />
          </div>
          <div className="relative">
            <label className="block text-xs font-bold tracking-wider text-primary/60 mb-2">CLASS SECTION</label>
            <select value={formData.section} onChange={(e) => handleInputChange('section', e.target.value)} className="w-full appearance-none p-3 bg-black border-primary/20 border rounded-lg text-foreground focus:outline-none focus:ring-2 focus:ring-primary/40">
              <option value="" disabled className="bg-black text-white">Select Section</option>
              {sections.map((s) => <option key={s} value={s} className="bg-black text-white">{s}</option>)}
            </select>
            <ChevronDown className="absolute right-3 bottom-3 w-5 h-5 text-primary/50 pointer-events-none" />
          </div>
        </div>
        <div className="relative">
          <label className="block text-xs font-bold tracking-wider text-primary/60 mb-2">SUBJECT</label>
          {!showCustomSubject ?
          <div className="relative">
              <select value={formData.subject} onChange={(e) => handleInputChange('subject', e.target.value)} className="w-full appearance-none p-3 bg-black border-primary/20 border rounded-lg text-foreground focus:outline-none focus:ring-2 focus:ring-primary/40">
                <option value="" disabled className="bg-black text-white">Select Subject</option>
                {subjects.map((s) => <option key={s} value={s} className="bg-black text-white">{s}</option>)}
                <option value="ADD_NEW" className="bg-black text-primary font-bold">+ Add Subject Name</option>
              </select>
              <ChevronDown className="absolute right-3 bottom-3 w-5 h-5 text-primary/50 pointer-events-none" />
            </div> :

          <div className="flex gap-2">
              <input type="text" value={customSubject} onChange={(e) => setCustomSubject(e.target.value)} placeholder="Enter new subject name..." className="flex-1 p-3 bg-black/40 border-primary/20 border rounded-lg text-foreground focus:outline-none focus:ring-2 focus:ring-primary/40" autoFocus />
              <Button type="button" onClick={handleAddCustomSubject} className="bg-primary hover:bg-primary/90 text-primary-foreground font-bold">Add</Button>
              <Button type="button" onClick={() => setShowCustomSubject(false)} variant="ghost" className="text-foreground/60">Cancel</Button>
            </div>
          }
        </div>
        <div>
          <label className="block text-xs font-bold tracking-wider text-primary/60 mb-2">HOMEWORK DETAILS</label>
          <textarea value={formData.homework} onChange={(e) => handleInputChange('homework', e.target.value)} placeholder="Enter homework description..." className="w-full p-3 h-32 bg-black/40 border-primary/20 border rounded-lg text-foreground focus:outline-none focus:ring-2 focus:ring-primary/40 resize-y" />
        </div>
        <div className="relative">
          
          <input type="date" value={formData.dueDate} onChange={(e) => handleInputChange('dueDate', e.target.value)} className="w-full p-3 bg-black/40 border-primary/20 border rounded-lg text-foreground focus:outline-none focus:ring-2 focus:ring-primary/40" />
        </div>
        <Button type="submit" className="w-full bg-primary hover:bg-primary/90 text-primary-foreground font-bold text-base py-3 rounded-lg transition-all duration-300 shadow-[0_0_20px_hsl(51,100%,50%,0.3)]">
          <Send size={20} className="mr-2" /> Send Homework
        </Button>
      </form>
    </div>);

};

export default HomeworkSenderPage;