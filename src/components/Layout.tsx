import React from 'react';
import { useNavigate } from 'react-router-dom';
import { LogOut, BookOpen, Users, GraduationCap, ClipboardCheck, BarChart3, Menu, X } from 'lucide-react';
import { cn } from '../lib/utils';
import { User } from '../types';

interface LayoutProps {
  children: React.ReactNode;
  user: User | null;
  onLogout: () => void;
}

export default function Layout({ children, user, onLogout }: LayoutProps) {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = React.useState(false);
  const navigate = useNavigate();

  if (!user) return <>{children}</>;

  const adminLinks = [
    { name: 'Dashboard', icon: BarChart3, path: '/admin' },
    { name: 'Courses', icon: BookOpen, path: '/admin/courses' },
    { name: 'Faculty', icon: Users, path: '/admin/faculty' },
    { name: 'Students', icon: GraduationCap, path: '/admin/students' },
    { name: 'Subjects', icon: ClipboardCheck, path: '/admin/subjects' },
  ];

  const teacherLinks = [
    { name: 'My Subjects', icon: BookOpen, path: '/teacher' },
  ];

  const studentLinks = [
    { name: 'My Attendance', icon: ClipboardCheck, path: '/student' },
  ];

  const links = user.role === 'admin' ? adminLinks : user.role === 'teacher' ? teacherLinks : studentLinks;

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col md:flex-row">
      {/* Sidebar */}
      <aside className={cn(
        "fixed inset-y-0 left-0 z-50 w-64 bg-slate-900 text-white transform transition-transform duration-300 ease-in-out md:relative md:translate-x-0",
        isMobileMenuOpen ? "translate-x-0" : "-translate-x-full"
      )}>
        <div className="h-full flex flex-col">
          <div className="p-6 flex items-center gap-3 border-b border-slate-800">
            <div className="w-10 h-10 bg-blue-600 rounded-lg flex items-center justify-center">
              <ClipboardCheck className="text-white" size={24} />
            </div>
            <span className="font-bold text-xl tracking-tight">Attendify</span>
          </div>

          <nav className="flex-1 p-4 space-y-2 overflow-y-auto">
            {links.map((link) => (
              <button
                key={link.path}
                onClick={() => {
                  navigate(link.path);
                  setIsMobileMenuOpen(false);
                }}
                className="w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-colors hover:bg-slate-800 text-slate-300 hover:text-white"
              >
                <link.icon size={20} />
                <span className="font-medium">{link.name}</span>
              </button>
            ))}
          </nav>

          <div className="p-4 border-t border-slate-800">
            <div className="flex items-center gap-3 px-4 py-3 mb-2">
              <div className="w-8 h-8 bg-slate-700 rounded-full flex items-center justify-center text-xs font-bold">
                {user.name.charAt(0)}
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium truncate">{user.name}</p>
                <p className="text-xs text-slate-400 truncate capitalize">{user.role}</p>
              </div>
            </div>
            <button
              onClick={onLogout}
              className="w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-colors hover:bg-red-500/10 text-red-400 hover:text-red-300"
            >
              <LogOut size={20} />
              <span className="font-medium">Logout</span>
            </button>
          </div>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 flex flex-col min-w-0 overflow-hidden">
        {/* Header */}
        <header className="h-16 bg-white border-b border-slate-200 flex items-center justify-between px-6 md:hidden">
          <div className="flex items-center gap-3">
            <ClipboardCheck className="text-blue-600" size={24} />
            <span className="font-bold text-lg">Attendify</span>
          </div>
          <button onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)} className="p-2 text-slate-600">
            {isMobileMenuOpen ? <X size={24} /> : <Menu size={24} />}
          </button>
        </header>

        <div className="flex-1 overflow-y-auto p-6 md:p-10">
          {children}
        </div>
      </main>

      {/* Mobile Overlay */}
      {isMobileMenuOpen && (
        <div 
          className="fixed inset-0 bg-black/50 z-40 md:hidden" 
          onClick={() => setIsMobileMenuOpen(false)}
        />
      )}
    </div>
  );
}
