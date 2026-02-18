import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { useToast } from '@/hooks/use-toast';
import { Lock, Mail, User } from 'lucide-react';
import { useAuth } from '@/context/AuthContext';

const SettingsPage = () => {
  const { toast } = useToast();
  const { userName, updateUserName } = useAuth();
  const [passwords, setPasswords] = useState({ new: '', confirm: '' });
  const [email, setEmail] = useState('');
  const [newName, setNewName] = useState(userName);

  const handlePasswordSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (passwords.new !== passwords.confirm) { toast({ title: "Passwords Don't Match", variant: "destructive" }); return; }
    if (!passwords.new) { toast({ title: "Password cannot be empty", variant: "destructive" }); return; }
    toast({ title: "Password Changed Successfully!" });
    setPasswords({ new: '', confirm: '' });
  };

  const handleEmailSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!email) { toast({ title: "Email cannot be empty", variant: "destructive" }); return; }
    toast({ title: "Email Change Request Sent", description: `A confirmation link has been sent to ${email}.` });
    setEmail('');
  };

  const handleNameSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newName.trim()) { toast({ title: "Name cannot be empty", variant: "destructive" }); return; }
    updateUserName(newName);
    toast({ title: "Name Updated Successfully!", description: `Your name has been changed to ${newName}.` });
  };

  const inputClass = "w-full px-4 py-3 bg-black/40 border border-primary/20 rounded-lg text-foreground placeholder:text-foreground/40 focus:outline-none focus:ring-2 focus:ring-primary/40 transition-all duration-300";
  const btnClass = "w-full bg-primary hover:bg-primary/90 text-primary-foreground font-bold py-3 rounded-lg shadow-[0_0_20px_hsl(51,100%,50%,0.3)] hover:shadow-[0_0_30px_hsl(51,100%,50%,0.5)]";

  return (
    <div className="space-y-6 relative z-10 px-4 py-6">
      <h1 className="text-3xl font-bold text-foreground text-center">Settings</h1>

      <div className="bg-black/30 backdrop-blur-md border border-primary/20 rounded-xl p-6 max-w-2xl mx-auto">
        <div className="flex items-center gap-3 mb-6">
          <div className="w-10 h-10 rounded-lg bg-primary/20 flex items-center justify-center"><User size={20} className="text-primary" /></div>
          <h2 className="text-xl font-semibold text-foreground">Change Name</h2>
        </div>
        <form onSubmit={handleNameSubmit} className="space-y-6">
          <div><label className="block text-sm font-medium text-foreground/80 mb-2">New Name</label><input type="text" value={newName} onChange={e => setNewName(e.target.value)} required className={inputClass} placeholder="Enter your new name" /></div>
          <Button type="submit" className={btnClass}>Update Name</Button>
        </form>
      </div>

      <div className="bg-black/30 backdrop-blur-md border border-primary/20 rounded-xl p-6 max-w-2xl mx-auto">
        <div className="flex items-center gap-3 mb-6">
          <div className="w-10 h-10 rounded-lg bg-primary/20 flex items-center justify-center"><Lock size={20} className="text-primary" /></div>
          <h2 className="text-xl font-semibold text-foreground">Change Password</h2>
        </div>
        <form onSubmit={handlePasswordSubmit} className="space-y-6">
          <div><label className="block text-sm font-medium text-foreground/80 mb-2">New Password</label><input type="password" value={passwords.new} onChange={e => setPasswords({ ...passwords, new: e.target.value })} required className={inputClass} placeholder="Enter new password" /></div>
          <div><label className="block text-sm font-medium text-foreground/80 mb-2">Confirm New Password</label><input type="password" value={passwords.confirm} onChange={e => setPasswords({ ...passwords, confirm: e.target.value })} required className={inputClass} placeholder="Confirm new password" /></div>
          <Button type="submit" className={btnClass}>Update Password</Button>
        </form>
      </div>

      <div className="bg-black/30 backdrop-blur-md border border-primary/20 rounded-xl p-6 max-w-2xl mx-auto">
        <div className="flex items-center gap-3 mb-6">
          <div className="w-10 h-10 rounded-lg bg-primary/20 flex items-center justify-center"><Mail size={20} className="text-primary" /></div>
          <h2 className="text-xl font-semibold text-foreground">Change Email ID</h2>
        </div>
        <form onSubmit={handleEmailSubmit} className="space-y-6">
          <div><label className="block text-sm font-medium text-foreground/80 mb-2">New Email ID</label><input type="email" value={email} onChange={e => setEmail(e.target.value)} required className={inputClass} placeholder="Enter new email address" /></div>
          <Button type="submit" className={btnClass}>Update Email</Button>
        </form>
      </div>
    </div>
  );
};

export default SettingsPage;
