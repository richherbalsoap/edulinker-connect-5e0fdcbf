import { Menu } from 'lucide-react';

const Header = ({ toggleSidebar }: { toggleSidebar: () => void }) => {
  const displayName = localStorage.getItem('schoolName') || 'My School';

  return (
    <header className="sticky top-0 z-30 bg-background/90 backdrop-blur-md border-b border-primary/20">
      <div className="px-4 py-2.5 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <button
            onClick={toggleSidebar}
            className="p-2 rounded-lg border border-primary/20 bg-black/30 text-primary hover:bg-primary/10 hover:border-primary/40 active:bg-primary/20 transition-colors duration-200"
          >
            <Menu size={18} />
          </button>
          <h2 className="text-lg font-bold text-primary drop-shadow-[0_0_10px_hsl(51,100%,50%,0.3)]">
            EDULinker School System
          </h2>
        </div>

        <div className="flex items-center gap-2 px-3 py-1.5 bg-black/30 rounded-lg border border-primary/20">
          <span className="text-foreground/90 text-sm font-medium">{displayName}</span>
        </div>
      </div>
    </header>
  );
};

export default Header;
