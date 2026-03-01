import { Menu, LogOut } from 'lucide-react';
import { useAuth } from '@/context/AuthContext';
import { useNavigate } from 'react-router-dom';

const Header = ({ toggleSidebar }: { toggleSidebar: () => void }) => {
  const displayName = localStorage.getItem('schoolName') || 'My School';
  const { signOut } = useAuth();
  const navigate = useNavigate();

  const handleLogout = async () => {
    localStorage.clear();
    await signOut();
    window.location.href = '/login';
  };

  return (
    <header className="sticky top-0 z-30 bg-background/90 backdrop-blur-md border-b border-primary/20">
      <div className="px-4 py-2.5 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <button
            onClick={toggleSidebar}
            className="p-2 rounded-lg border border-primary/20 bg-card/30 text-primary hover:bg-primary/10 hover:border-primary/40 active:bg-primary/20 transition-colors duration-200"
          >
            <Menu size={18} />
          </button>
          <h2 className="text-lg font-bold text-primary drop-shadow-[0_0_10px_hsl(51,100%,50%,0.3)]">
            EDULinker School System
          </h2>
        </div>

        <div className="flex items-center gap-3">
          <div className="px-3 py-1.5 bg-card/30 rounded-lg border border-primary/20">
            <span className="text-foreground/90 text-sm font-medium">{displayName}</span>
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
