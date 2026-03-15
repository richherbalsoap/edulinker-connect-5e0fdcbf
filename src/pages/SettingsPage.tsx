import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/context/AuthContext";
import { User, KeyRound, Loader2 } from "lucide-react";

const SettingsPage = () => {
  const { toast } = useToast();
  const { user } = useAuth();
  const navigate = useNavigate();
  const [newName, setNewName] = useState(localStorage.getItem("schoolName") || "My School");

  // Password change state
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [passwordLoading, setPasswordLoading] = useState(false);

  // Recovery mode state
  const [isRecoveryMode, setIsRecoveryMode] = useState(false);
  const [recoveryLoading, setRecoveryLoading] = useState(false);

  useEffect(() => {
    const hash = window.location.hash;
    if (hash) {
      const params = new URLSearchParams(hash.substring(1));
      const accessToken = params.get("access_token");
      const refreshToken = params.get("refresh_token");
      const type = params.get("type");

      if (type === "recovery" && accessToken && refreshToken) {
        setRecoveryLoading(true);
        supabase.auth.setSession({ access_token: accessToken, refresh_token: refreshToken }).then(({ error }) => {
          if (error) {
            toast({ title: "Error", description: "Invalid or expired recovery link.", variant: "destructive" });
          } else {
            setIsRecoveryMode(true);
            // Clean hash from URL
            window.history.replaceState(null, "", window.location.pathname);
          }
          setRecoveryLoading(false);
        });
      }
    }
  }, []);

  const handleNameSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newName.trim()) {
      toast({ title: "Name cannot be empty", variant: "destructive" });
      return;
    }
    localStorage.setItem("schoolName", newName.trim());
    // Header ko instantly update karne ke liye custom event dispatch karo
    window.dispatchEvent(new CustomEvent("schoolNameUpdated", { detail: newName.trim() }));
    toast({ title: "Name Updated Successfully!", description: `Display name changed to ${newName.trim()}.` });
  };

  const handlePasswordChange = async (e: React.FormEvent) => {
    e.preventDefault();

    if (isRecoveryMode) {
      // Recovery mode: no current password needed
      if (newPassword.length < 6) {
        toast({ title: "Error", description: "Password must be at least 6 characters.", variant: "destructive" });
        return;
      }
      if (newPassword !== confirmPassword) {
        toast({ title: "Error", description: "Passwords do not match.", variant: "destructive" });
        return;
      }
      setPasswordLoading(true);
      const { error } = await supabase.auth.updateUser({ password: newPassword });
      setPasswordLoading(false);
      if (error) {
        toast({ title: "Error", description: error.message, variant: "destructive" });
      } else {
        toast({ title: "Success", description: "Password updated successfully. Please log in again." });
        await supabase.auth.signOut();
        navigate("/login", { replace: true });
      }
      return;
    }

    // Direct password change — no re-auth needed
    if (newPassword.length < 6) {
      toast({ title: "Error", description: "New password must be at least 6 characters.", variant: "destructive" });
      return;
    }
    if (newPassword !== confirmPassword) {
      toast({ title: "Error", description: "Passwords do not match.", variant: "destructive" });
      return;
    }

    setPasswordLoading(true);
    const { error } = await supabase.auth.updateUser({ password: newPassword });
    setPasswordLoading(false);
    if (error) {
      toast({ title: "Error", description: error.message, variant: "destructive" });
    } else {
      toast({ title: "Success", description: "Password changed successfully." });
      setNewPassword("");
      setConfirmPassword("");
    }
  };

  const inputClass =
    "w-full px-4 py-3 bg-black/40 border border-primary/20 rounded-lg text-foreground placeholder:text-foreground/40 focus:outline-none focus:ring-2 focus:ring-primary/40 transition-all duration-300";
  const btnClass =
    "w-full bg-primary hover:bg-primary/90 text-primary-foreground font-bold py-3 rounded-lg shadow-[0_0_20px_hsl(51,100%,50%,0.3)] hover:shadow-[0_0_30px_hsl(51,100%,50%,0.5)]";

  if (recoveryLoading) {
    return (
      <div className="flex items-center justify-center py-20">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
        <span className="ml-3 text-muted-foreground">Verifying recovery link...</span>
      </div>
    );
  }

  return (
    <div className="space-y-6 relative z-10 px-4 py-6">
      <h1 className="text-3xl font-bold text-foreground text-center">Settings</h1>

      {/* Recovery mode banner */}
      {isRecoveryMode && (
        <div className="bg-primary/10 border border-primary/30 rounded-xl p-4 max-w-2xl mx-auto text-center">
          <p className="text-primary font-semibold">🔐 Password Recovery Mode</p>
          <p className="text-sm text-muted-foreground">Please set your new password below.</p>
        </div>
      )}

      {/* Change Display Name - hide in recovery mode */}
      {!isRecoveryMode && (
        <div className="bg-black/30 backdrop-blur-md border border-primary/20 rounded-xl p-6 max-w-2xl mx-auto">
          <div className="flex items-center gap-3 mb-6">
            <div className="w-10 h-10 rounded-lg bg-primary/20 flex items-center justify-center">
              <User size={20} className="text-primary" />
            </div>
            <h2 className="text-xl font-semibold text-foreground">Change Display Name</h2>
          </div>
          <form onSubmit={handleNameSubmit} className="space-y-6">
            <div>
              <label className="block text-sm font-medium text-foreground/80 mb-2">School Name</label>
              <input
                type="text"
                value={newName}
                onChange={(e) => setNewName(e.target.value)}
                required
                className={inputClass}
                placeholder="Enter your school name"
              />
            </div>
            <Button type="submit" className={btnClass}>
              Update Name
            </Button>
          </form>
        </div>
      )}

      {/* Change Password */}
      <div className="bg-black/30 backdrop-blur-md border border-primary/20 rounded-xl p-6 max-w-2xl mx-auto">
        <div className="flex items-center gap-3 mb-6">
          <div className="w-10 h-10 rounded-lg bg-primary/20 flex items-center justify-center">
            <KeyRound size={20} className="text-primary" />
          </div>
          <h2 className="text-xl font-semibold text-foreground">
            {isRecoveryMode ? "Set New Password" : "Change Password"}
          </h2>
        </div>
        <form onSubmit={handlePasswordChange} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-foreground/80 mb-2">New Password</label>
            <Input
              type="password"
              value={newPassword}
              onChange={(e) => setNewPassword(e.target.value)}
              required
              placeholder="Min 6 characters"
              className="bg-black/40 border-primary/20"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-foreground/80 mb-2">Confirm New Password</label>
            <Input
              type="password"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              required
              placeholder="Re-enter new password"
              className="bg-black/40 border-primary/20"
            />
          </div>
          <Button type="submit" disabled={passwordLoading} className={btnClass}>
            <KeyRound size={18} className="mr-2" />
            {passwordLoading ? "Updating..." : isRecoveryMode ? "Set New Password" : "Change Password"}
          </Button>
        </form>
      </div>
    </div>
  );
};

export default SettingsPage;
