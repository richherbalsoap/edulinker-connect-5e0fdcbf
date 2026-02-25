import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { useToast } from '@/hooks/use-toast';
import { User } from 'lucide-react';

const SettingsPage = () => {
  const { toast } = useToast();
  const [newName, setNewName] = useState(localStorage.getItem('schoolName') || 'My School');

  const handleNameSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newName.trim()) { toast({ title: "Name cannot be empty", variant: "destructive" }); return; }
    localStorage.setItem('schoolName', newName);
    toast({ title: "Name Updated Successfully!", description: `Your display name has been changed to ${newName}.` });
  };

  const inputClass = "w-full px-4 py-3 bg-black/40 border border-primary/20 rounded-lg text-foreground placeholder:text-foreground/40 focus:outline-none focus:ring-2 focus:ring-primary/40 transition-all duration-300";
  const btnClass = "w-full bg-primary hover:bg-primary/90 text-primary-foreground font-bold py-3 rounded-lg shadow-[0_0_20px_hsl(51,100%,50%,0.3)] hover:shadow-[0_0_30px_hsl(51,100%,50%,0.5)]";

  return (
    <div className="space-y-6 relative z-10 px-4 py-6">
      <h1 className="text-3xl font-bold text-foreground text-center">Settings</h1>

      <div className="bg-black/30 backdrop-blur-md border border-primary/20 rounded-xl p-6 max-w-2xl mx-auto">
        <div className="flex items-center gap-3 mb-6">
          <div className="w-10 h-10 rounded-lg bg-primary/20 flex items-center justify-center"><User size={20} className="text-primary" /></div>
          <h2 className="text-xl font-semibold text-foreground">Change Display Name</h2>
        </div>
        <form onSubmit={handleNameSubmit} className="space-y-6">
          <div><label className="block text-sm font-medium text-foreground/80 mb-2">School Name</label><input type="text" value={newName} onChange={e => setNewName(e.target.value)} required className={inputClass} placeholder="Enter your school name" /></div>
          <Button type="submit" className={btnClass}>Update Name</Button>
        </form>
      </div>
    </div>
  );
};

export default SettingsPage;
