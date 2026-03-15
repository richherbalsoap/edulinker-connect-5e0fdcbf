import React from 'react';
import { NavLink, useNavigate } from 'react-router-dom';
import {
  LayoutDashboard, Users, BookOpen, MessageSquare, FileText,
  DollarSign, Bell, BarChart3, Bot, TrendingUp, Settings, X,
  ChevronDown, LogOut, LockKeyhole
} from 'lucide-react';
import { useAuth } from '@/context/AuthContext';
import { usePin } from '@/context/PinContext';
import edulinkerLogo from '@/assets/edulinker-logo.png';

interface NavItemType {
  path: string;
  icon: React.ElementType;
  label: string;
}

const teacherTools: NavItemType[] = [
  { path: '/homework', icon: BookOpen, label: 'Homework Sender' },
  { path: '/complaints', icon: MessageSquare, label: 'Complaint Sender' },
  { path: '/results', icon: FileText, label: 'Result Sender' },
];

const principalTools: NavItemType[] = [
  { path: '/students', icon: Users, label: 'Student Management' },
  { path: '/announcements', icon: Bell, label: 'Announcements' },
  { path: '/analytics', icon: BarChart3, label: 'Analytics' },
  { path: '/ai-chatbot', icon: Bot, label: 'AI Insight Chatbot' },
  { path: '/promotion', icon: TrendingUp, label: 'Promotion Panel' },
  { path: '/fees', icon: DollarSign, label: 'Fees Reminder' },
];

const principalPaths = new Set(principalTools.map(t => t.path));

const NavItem = ({ item, onClick }: { item: NavItemType; onClick: () => void }) => (
  <li>
    <NavLink
      to={item.path}
      onClick={onClick}
      className={({ isActive }) => `
        flex items-center gap-3 px-4 py-3 rounded-lg
        transition-colors duration-200 group
        ${isActive
          ? 'bg-primary/15 text-primary border border-primary/30 shadow-[0_0_15px_hsl(51,100%,50%,0.15)]'
          : 'text-foreground/70 hover:bg-primary/5 hover:text-foreground border border-transparent'
        }
      `}
    >
      <item.icon size={20} />
      <span className="font-medium text-sm">{item.label}</span>
    </NavLink>
  </li>
);

// PIN-protected nav item — intercepts click, asks for PIN first
const ProtectedNavItem = ({ item, onClick, requestAccess }: { item: NavItemType; onClick: () => void; requestAccess: () => Promise<boolean> }) => {
  const navigate = useNavigate();

  const handleClick = async (e: React.MouseEvent) => {
    e.preventDefault();
    onClick(); // close sidebar
    const granted = await requestAccess();
    if (granted) {
      navigate(item.path);
    }
  };

  return (
    <li>
      <NavLink
        to={item.path}
        onClick={handleClick}
        className={({ isActive }) => `
          flex items-center gap-3 px-4 py-3 rounded-lg
          transition-colors duration-200 group
          ${isActive
            ? 'bg-primary/15 text-primary border border-primary/30 shadow-[0_0_15px_hsl(51,100%,50%,0.15)]'
            : 'text-foreground/70 hover:bg-primary/5 hover:text-foreground border border-transparent'
          }
        `}
      >
        <item.icon size={20} />
        <span className="font-medium text-sm">{item.label}</span>
      </NavLink>
    </li>
  );
};

const CollapsibleSection = ({ title, icon: Icon, items, onClick, protected: isProtected, requestAccess }: {
  title: string; icon: React.ElementType; items: NavItemType[]; onClick: () => void;
  protected?: boolean; requestAccess?: () => Promise<boolean>;
}) => {
  const [isOpen, setIsOpen] = React.useState(true);
  return (
    <div>
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="w-full flex items-center justify-between px-4 py-2 text-xs font-semibold text-primary/50 hover:text-primary/80 transition-colors duration-200 uppercase tracking-wider"
      >
        <span className="flex items-center gap-2"><Icon size={14} />{title}</span>
        <ChevronDown size={14} className={`transition-transform duration-200 ${isOpen ? 'rotate-180' : ''}`} />
      </button>
      {isOpen && (
        <ul className="space-y-1 pl-2 pt-1">
          {items.map((item) => (
            isProtected && requestAccess
              ? <ProtectedNavItem key={item.path} item={item} onClick={onClick} requestAccess={requestAccess} />
              : <NavItem key={item.path} item={item} onClick={onClick} />
          ))}
        </ul>
      )}
    </div>
  );
};

const Sidebar = ({ isOpen, toggleSidebar }: { isOpen: boolean; toggleSidebar: () => void }) => {
  const schoolName = localStorage.getItem('schoolName') || 'My School';
  const { signOut } = useAuth();
  const { pinSet, lock, requestAccess } = usePin();
  const navigate = useNavigate();

  const handleLock = () => {
    toggleSidebar();
    lock();
  };

  const handleSettingsClick = async (e: React.MouseEvent) => {
    e.preventDefault();
    toggleSidebar();
    const granted = await requestAccess();
    if (granted) navigate('/settings');
  };

  const handleLogout = async () => {
    toggleSidebar();
    const granted = await requestAccess();
    if (!granted) return;
    localStorage.clear();
    await signOut();
    navigate('/login', { replace: true });
  };

  return (
    <>
      {isOpen && (
        <div onClick={toggleSidebar} className="fixed inset-0 bg-black/60 z-40 transition-opacity duration-200" />
      )}
      <aside className={`
        fixed top-0 left-0 h-screen w-[280px] z-50
        bg-background/95 border-r border-primary/20
        flex flex-col transition-transform duration-200 ease-out
        ${isOpen ? 'translate-x-0' : '-translate-x-full'}
      `}>
        <div className="p-5 border-b border-primary/20 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <img src={edulinkerLogo} alt="EDULinker" className="w-9 h-9 rounded-lg object-contain" />
            <div>
              <h1 className="text-lg font-bold text-primary">EDULinker</h1>
              <p className="text-xs text-foreground/40">{schoolName}</p>
            </div>
          </div>
          <button onClick={toggleSidebar} className="p-1.5 rounded-lg text-foreground/50 hover:text-primary hover:bg-primary/10 border border-transparent hover:border-primary/20 transition-colors duration-200">
            <X size={20} />
          </button>
        </div>

        <nav className="flex-1 overflow-y-auto py-4 px-3 space-y-3">
          <ul className="space-y-1">
            <NavItem item={{ path: '/dashboard', icon: LayoutDashboard, label: 'Dashboard' }} onClick={toggleSidebar} />
          </ul>
          <CollapsibleSection title="TEACHER TOOLS" icon={BookOpen} items={teacherTools} onClick={toggleSidebar} />
          <CollapsibleSection title="PRINCIPAL TOOLS" icon={Users} items={principalTools} onClick={toggleSidebar} protected requestAccess={requestAccess} />
          <ul className="space-y-1 pt-3 border-t border-primary/10">
            <li>
              <a
                href="/settings"
                onClick={handleSettingsClick}
                className="flex items-center gap-3 px-4 py-3 rounded-lg text-foreground/70 hover:bg-primary/5 hover:text-foreground border border-transparent transition-colors duration-200"
              >
                <Settings size={20} />
                <span className="font-medium text-sm">Settings</span>
              </a>
            </li>
          </ul>
          {pinSet && (
            <button
              onClick={handleLock}
              className="w-full flex items-center gap-3 px-4 py-3 rounded-lg text-primary/70 hover:bg-primary/10 border border-transparent hover:border-primary/20 transition-colors duration-200 mt-1"
            >
              <LockKeyhole size={20} />
              <span className="font-medium text-sm">Lock App</span>
            </button>
          )}
          <button
            onClick={handleLogout}
            className="w-full flex items-center gap-3 px-4 py-3 rounded-lg text-destructive hover:bg-destructive/10 border border-transparent hover:border-destructive/20 transition-colors duration-200 mt-1"
          >
            <LogOut size={20} />
            <span className="font-medium text-sm">Logout</span>
          </button>
        </nav>
      </aside>
    </>
  );
};

export default Sidebar;
