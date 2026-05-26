import { Menu, LogOut } from 'lucide-react';
import { useAuth } from '@/context/AuthContext';
import { useNavigate } from 'react-router-dom';
import { useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';

const Header = ({ toggleSidebar }: { toggleSidebar: () => void }) => {
  const { signOut, schoolId } = useAuth();
  const navigate = useNavigate();
  const [displayName, setDisplayName] = useState<string>(
    () => localStorage.getItem('schoolName') || 'My School'
  );

  // Fetch live school name from DB whenever schoolId becomes available
  useEffect(() => {
    if (!schoolId) return;
    let cancelled = false;
    (async () => {
      const { data, error } = await supabase
        .from('schools')
        .select('school_name')
        .eq('id', schoolId)
        .maybeSingle();
      if (cancelled) return;
      if (!error && data?.school_name) {
        setDisplayName(data.school_name);
        localStorage.setItem('schoolName', data.school_name);
      }
    })();
    return () => { cancelled = true; };
  }, [schoolId]);

  // Live update when Settings page saves a new name
  useEffect(() => {
    const handler = (e: Event) => {
      const detail = (e as CustomEvent<string>).detail;
      if (typeof detail === 'string' && detail.trim()) {
        setDisplayName(detail.trim());
      }
    };
    window.addEventListener('schoolNameUpdated', handler);
    return () => window.removeEventListener('schoolNameUpdated', handler);
  }, []);

  const handleLogout = async () => {
    localStorage.clear();
    await signOut();
    navigate('/login', { replace: true });
  };

  return (
    <header className="sticky top-0 z-30 w-full max-w-full bg-background/90 backdrop-blur-md border-b border-primary/20" style={{ paddingTop: 'env(safe-area-inset-top)' }}>
      <div className="px-3 sm:px-4 py-2.5 flex items-center justify-between gap-2 min-w-0">
        <div className="flex items-center gap-2 sm:gap-3 min-w-0 flex-1">
          <button
            onClick={toggleSidebar}
            className="p-2 rounded-lg border border-primary/20 bg-card/30 text-primary hover:bg-primary/10 hover:border-primary/40 active:bg-primary/20 transition-colors duration-200 flex-shrink-0"
          >
            <Menu size={18} />
          </button>
          <h2 className="text-sm sm:text-lg font-bold text-primary drop-shadow-[0_0_10px_hsl(51,100%,50%,0.3)] truncate">
            EDULinker
          </h2>
        </div>

        <div className="flex items-center gap-2 sm:gap-3 min-w-0 flex-shrink-0">
          <div className="px-2 sm:px-3 py-1.5 bg-card/30 rounded-lg border border-primary/20 max-w-[35vw] sm:max-w-none min-w-0">
            <span className="text-foreground/90 text-xs sm:text-sm font-medium truncate block">{displayName}</span>
          </div>
          <button
            onClick={handleLogout}
            className="p-2 rounded-lg border border-primary/20 bg-card/30 text-destructive hover:bg-destructive/10 hover:border-destructive/40 transition-colors duration-200"
            title="Logout"
          >
            <LogOut size={18} />
          </button>
        </div>
      </div>
    </header>
  );
};

export default Header;
