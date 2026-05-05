import React from 'react';
import { NavLink, useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import {
  LayoutDashboard, Users, BookOpen, MessageSquare, FileText,
  DollarSign, Bell, BarChart3, Bot, TrendingUp, Settings, X,
  ChevronDown, LogOut, FileSpreadsheet
} from 'lucide-react';
import { useAuth } from '@/context/AuthContext';
import { usePin } from '@/context/PinContext';
import LanguageSelector from '@/components/LanguageSelector';
import edulinkerLogo from '@/assets/edulinker-logo.png';

interface NavItemType {
  path: string;
  icon: React.ElementType;
  label: string;
}

const teacherTools: NavItemType[] = [
  { path: '/homework', icon: BookOpen, label: 'nav.homework' },
  { path: '/complaints', icon: MessageSquare, label: 'nav.complaints' },
  { path: '/results', icon: FileText, label: 'nav.results' },
];

const principalTools: NavItemType[] = [
  { path: '/students', icon: Users, label: 'nav.students' },
  { path: '/announcements', icon: Bell, label: 'nav.announcements' },
  { path: '/analytics', icon: BarChart3, label: 'nav.analytics' },
  { path: '/ai-chatbot', icon: Bot, label: 'nav.ai_chatbot' },
  { path: '/promotion', icon: TrendingUp, label: 'nav.promotion' },
  { path: '/fees', icon: DollarSign, label: 'nav.fees' },
];

const principalPaths = new Set(principalTools.map(t => t.path));

const NavItem = ({ item, onClick }: { item: NavItemType; onClick: () => void }) => {
  const { t } = useTranslation();
  return (
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
      <span className="font-medium text-sm">{t(item.label)}</span>
    </NavLink>
  </li>
  );
};

const ProtectedNavItem = ({ item, onClick, requestAccess }: { item: NavItemType; onClick: () => void; requestAccess: () => Promise<boolean> }) => {
  const navigate = useNavigate();
  const { t } = useTranslation();

  const handleClick = async (e: React.MouseEvent) => {
    e.preventDefault();
    onClick();
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
        <span className="font-medium text-sm">{t(item.label)}</span>
      </NavLink>
    </li>
  );
};

const CollapsibleSection = ({ titleKey, icon: Icon, items, onClick, protected: isProtected, requestAccess }: {
  titleKey: string; icon: React.ElementType; items: NavItemType[]; onClick: () => void;
  protected?: boolean; requestAccess?: () => Promise<boolean>;
}) => {
  const [isOpen, setIsOpen] = React.useState(true);
  const { t } = useTranslation();
  return (
    <div>
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="w-full flex items-center justify-between px-4 py-2 text-xs font-semibold text-primary/50 hover:text-primary/80 transition-colors duration-200 uppercase tracking-wider"
      >
        <span className="flex items-center gap-2"><Icon size={14} />{t(titleKey)}</span>
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
  const { requestAccess } = usePin();
  const navigate = useNavigate();
  const { t } = useTranslation();

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
        fixed top-0 left-0 h-[100dvh] w-[280px] z-50
        bg-background/95 border-r border-primary/20
        flex flex-col transition-transform duration-200 ease-out
        ${isOpen ? 'translate-x-0' : '-translate-x-full'}
      `} style={{ paddingTop: 'calc(env(safe-area-inset-top) + 64px)', paddingBottom: 'env(safe-area-inset-bottom)' }}>
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
            <NavItem item={{ path: '/dashboard', icon: LayoutDashboard, label: 'nav.dashboard' }} onClick={toggleSidebar} />
            <NavItem item={{ path: '/report', icon: FileSpreadsheet, label: 'nav.report' }} onClick={toggleSidebar} />
          </ul>
          <CollapsibleSection titleKey="nav.teacher_tools" icon={BookOpen} items={teacherTools} onClick={toggleSidebar} />
          <CollapsibleSection titleKey="nav.principal_tools" icon={Users} items={principalTools} onClick={toggleSidebar} protected requestAccess={requestAccess} />
          <ul className="space-y-1 pt-3 border-t border-primary/10">
            <li>
              <a
                href="/settings"
                onClick={handleSettingsClick}
                className="flex items-center gap-3 px-4 py-3 rounded-lg text-foreground/70 hover:bg-primary/5 hover:text-foreground border border-transparent transition-colors duration-200"
              >
                <Settings size={20} />
                <span className="font-medium text-sm">{t('nav.settings')}</span>
              </a>
            </li>
          </ul>
          <button
            onClick={handleLogout}
            className="w-full flex items-center gap-3 px-4 py-3 rounded-lg text-destructive hover:bg-destructive/10 border border-transparent hover:border-destructive/20 transition-colors duration-200 mt-1"
          >
            <LogOut size={20} />
            <span className="font-medium text-sm">{t('nav.logout')}</span>
          </button>
          <div className="pt-3 mt-3 border-t border-primary/10 px-1">
            <p className="px-3 pb-2 text-xs font-semibold text-primary/50 uppercase tracking-wider">{t('common.language')}</p>
            <LanguageSelector variant="compact" className="px-1" />
          </div>
        </nav>
      </aside>
    </>
  );
};

export default Sidebar;