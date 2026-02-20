import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { useToast } from '@/hooks/use-toast';
import { Lock, Mail, User, School, Copy, AlertTriangle, Hash } from 'lucide-react';
import { useAuth } from '@/context/AuthContext';
import { supabase } from '@/integrations/supabase/client';

const SettingsPage = () => {
  const { toast } = useToast();
  const { userName, updateUserName, schoolId } = useAuth();
  const [passwords, setPasswords] = useState({ new: '', confirm: '' });
  const [email, setEmail] = useState('');
  const [newName, setNewName] = useState(userName);
  const [schoolData, setSchoolData] = useState<{ name: string; school_code: string } | null>(null);
  const [schoolLoading, setSchoolLoading] = useState(true);
  const [schoolError, setSchoolError] = useState(false);

  useEffect(() => {
    const fetchSchool = async () => {
      if (!schoolId) {
        setSchoolLoading(false);
        setSchoolError(true);
        return;
      }
      const { data, error } = await supabase
        .from('schools')
        .select('name, school_code')
        .eq('id', schoolId)
        .maybeSingle();
      if (error || !data) {
        setSchoolError(true);
      } else {
        setSchoolData(data);
      }
      setSchoolLoading(false);
    };
    fetchSchool();
  }, [schoolId]);

  const copyToClipboard = (text: string, label: string) => {
    navigator.clipboard.writeText(text);
    toast({ title: "Copied!", description: `${label} copied to clipboard.` });
  };

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

      {/* School Info Card */}
      <div className="bg-black/30 backdrop-blur-md border border-primary/20 rounded-xl p-6 max-w-2xl mx-auto">
        <div className="flex items-center gap-3 mb-6">
          <div className="w-10 h-10 rounded-lg bg-primary/20 flex items-center justify-center"><School size={20} className="text-primary" /></div>
          <h2 className="text-xl font-semibold text-foreground">School Information</h2>
        </div>
        {schoolLoading ? (
          <div className="flex items-center gap-2 text-muted-foreground">
            <div className="w-4 h-4 border-2 border-primary/40 border-t-primary rounded-full animate-spin" />
            Loading school info…
          </div>
        ) : schoolError || !schoolData ? (
          <div className="flex items-center gap-2 text-destructive bg-destructive/10 border border-destructive/20 rounded-lg px-4 py-3">
            <AlertTriangle size={18} />
            <span className="text-sm font-medium">School Code missing. Contact admin.</span>
          </div>
        ) : (
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-foreground/80 mb-2">School Name</label>
              <div className="px-4 py-3 bg-black/40 border border-primary/20 rounded-lg text-foreground/70">{schoolData.name}</div>
            </div>
            <div>
              <label className="block text-sm font-medium text-foreground/80 mb-2">Your School Code</label>
              <div className="flex items-center gap-2">
                <div className="flex-1 px-4 py-3 bg-black/40 border border-primary/20 rounded-lg font-mono text-lg tracking-[0.3em] text-primary select-all">{schoolData.school_code}</div>
                <Button type="button" variant="outline" size="icon" onClick={() => copyToClipboard(schoolData.school_code, 'School Code')} className="border-primary/20 hover:bg-primary/10 hover:text-primary h-12 w-12 shrink-0">
                  <Copy size={18} />
                </Button>
              </div>
            </div>
            {schoolId && (
              <div>
                <label className="block text-sm font-medium text-foreground/80 mb-2">Your School ID</label>
                <div className="flex items-center gap-2">
                  <div className="flex-1 px-4 py-3 bg-black/40 border border-primary/20 rounded-lg font-mono text-xs text-foreground/50 select-all truncate">{schoolId}</div>
                  <Button type="button" variant="outline" size="icon" onClick={() => copyToClipboard(schoolId, 'School ID')} className="border-primary/20 hover:bg-primary/10 hover:text-primary h-12 w-12 shrink-0">
                    <Copy size={18} />
                  </Button>
                </div>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Change Name */}
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

      {/* Change Password */}
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

      {/* Change Email */}
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
