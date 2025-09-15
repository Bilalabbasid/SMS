import { Link, useLocation } from 'react-router-dom';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import {
  X,
  Home,
  Users,
  BookOpen,
  Calendar,
  DollarSign,
  Settings,
  GraduationCap,
  UserCheck,
  ClipboardList,
  Bell,
  FileText,
  BarChart3,
  Library,
  Bus,
} from 'lucide-react';

interface SidebarProps {
  isOpen: boolean;
  onClose: () => void;
  userRole: string;
}

// Navigation items for each role
const navigationItems = {
  admin: [
    { name: 'Dashboard', href: '/admin', icon: Home },
    { name: 'Students', href: '/admin/students', icon: GraduationCap },
    { name: 'Teachers', href: '/admin/teachers', icon: Users },
    { name: 'Parents', href: '/admin/parents', icon: UserCheck },
    { name: 'Classes', href: '/admin/classes', icon: BookOpen },
    { name: 'Subjects', href: '/admin/subjects', icon: ClipboardList },
    { name: 'Admissions', href: '/admin/admissions', icon: FileText },
    { name: 'Fees', href: '/admin/fees', icon: DollarSign },
    { name: 'Exams', href: '/admin/exams', icon: Calendar },
    { name: 'Library', href: '/admin/library', icon: Library },
    { name: 'Transport', href: '/admin/transport', icon: Bus },
    { name: 'Reports', href: '/admin/reports', icon: BarChart3 },
    { name: 'Settings', href: '/admin/settings', icon: Settings },
  ],
  teacher: [
    { name: 'Dashboard', href: '/teacher', icon: Home },
    { name: 'My Classes', href: '/teacher/classes', icon: BookOpen },
    { name: 'Students', href: '/teacher/students', icon: GraduationCap },
    { name: 'Attendance', href: '/teacher/attendance', icon: UserCheck },
    { name: 'Assignments', href: '/teacher/assignments', icon: ClipboardList },
    { name: 'Exams', href: '/teacher/exams', icon: Calendar },
    { name: 'Gradebook', href: '/teacher/gradebook', icon: FileText },
    { name: 'Schedule', href: '/teacher/schedule', icon: Calendar },
    { name: 'Messages', href: '/teacher/messages', icon: Bell },
  ],
  student: [
    { name: 'Dashboard', href: '/student', icon: Home },
    { name: 'My Classes', href: '/student/classes', icon: BookOpen },
    { name: 'Assignments', href: '/student/assignments', icon: ClipboardList },
    { name: 'Exams', href: '/student/exams', icon: Calendar },
    { name: 'Grades', href: '/student/grades', icon: FileText },
    { name: 'Schedule', href: '/student/schedule', icon: Calendar },
    { name: 'Library', href: '/student/library', icon: Library },
    { name: 'Fees', href: '/student/fees', icon: DollarSign },
    { name: 'Messages', href: '/student/messages', icon: Bell },
  ],
  parent: [
    { name: 'Dashboard', href: '/parent', icon: Home },
    { name: 'My Children', href: '/parent/children', icon: GraduationCap },
    { name: 'Attendance', href: '/parent/attendance', icon: UserCheck },
    { name: 'Grades', href: '/parent/grades', icon: FileText },
    { name: 'Fees', href: '/parent/fees', icon: DollarSign },
    { name: 'Schedule', href: '/parent/schedule', icon: Calendar },
    { name: 'Teachers', href: '/parent/teachers', icon: Users },
    { name: 'Messages', href: '/parent/messages', icon: Bell },
  ],
  accountant: [
    { name: 'Dashboard', href: '/accountant', icon: Home },
    { name: 'Fee Collection', href: '/accountant/fees', icon: DollarSign },
    { name: 'Students', href: '/accountant/students', icon: GraduationCap },
    { name: 'Income', href: '/accountant/income', icon: BarChart3 },
    { name: 'Expenses', href: '/accountant/expenses', icon: FileText },
    { name: 'Reports', href: '/accountant/reports', icon: BarChart3 },
    { name: 'Settings', href: '/accountant/settings', icon: Settings },
  ],
  librarian: [
    { name: 'Dashboard', href: '/librarian', icon: Home },
    { name: 'Books', href: '/librarian/books', icon: BookOpen },
    { name: 'Issue Books', href: '/librarian/issue', icon: ClipboardList },
    { name: 'Return Books', href: '/librarian/return', icon: FileText },
    { name: 'Students', href: '/librarian/students', icon: GraduationCap },
    { name: 'Reports', href: '/librarian/reports', icon: BarChart3 },
    { name: 'Settings', href: '/librarian/settings', icon: Settings },
  ],
};

const Sidebar = ({ isOpen, onClose, userRole }: SidebarProps) => {
  const location = useLocation();
  const items = navigationItems[userRole as keyof typeof navigationItems] || [];

  return (
    <>
      {/* Desktop Sidebar */}
      <div className="hidden lg:flex lg:w-64 lg:flex-col lg:fixed lg:inset-y-0">
        <div className="flex-1 flex flex-col min-h-0 bg-card border-r border-border">
          <div className="flex-1 flex flex-col pt-5 pb-4 overflow-y-auto">
            <div className="flex items-center flex-shrink-0 px-4">
              <GraduationCap className="h-8 w-8 text-primary" />
              <span className="ml-2 text-xl font-bold text-foreground">
                SMS
              </span>
            </div>
            <nav className="mt-8 flex-1 px-2 space-y-1">
              {items.map((item) => {
                const isActive = location.pathname === item.href;
                return (
                  <Link
                    key={item.name}
                    to={item.href}
                    className={cn(
                      'group flex items-center px-2 py-2 text-sm font-medium rounded-md transition-colors',
                      isActive
                        ? 'bg-primary text-primary-foreground'
                        : 'text-muted-foreground hover:bg-accent hover:text-accent-foreground'
                    )}
                  >
                    <item.icon
                      className={cn(
                        'mr-3 h-5 w-5 flex-shrink-0',
                        isActive
                          ? 'text-primary-foreground'
                          : 'text-muted-foreground group-hover:text-accent-foreground'
                      )}
                    />
                    {item.name}
                  </Link>
                );
              })}
            </nav>
          </div>
        </div>
      </div>

      {/* Mobile Sidebar */}
      <div
        className={cn(
          'fixed inset-0 z-50 lg:hidden',
          isOpen ? 'block' : 'hidden'
        )}
      >
        <div className="fixed inset-0 bg-background/80 backdrop-blur-sm" />
        <div className="fixed inset-y-0 left-0 w-64 bg-card border-r border-border">
          <div className="flex items-center justify-between p-4 border-b border-border">
            <div className="flex items-center">
              <GraduationCap className="h-8 w-8 text-primary" />
              <span className="ml-2 text-xl font-bold text-foreground">
                SMS
              </span>
            </div>
            <Button variant="ghost" size="icon" onClick={onClose}>
              <X className="h-5 w-5" />
            </Button>
          </div>
          <nav className="mt-4 px-2 space-y-1">
            {items.map((item) => {
              const isActive = location.pathname === item.href;
              return (
                <Link
                  key={item.name}
                  to={item.href}
                  onClick={onClose}
                  className={cn(
                    'group flex items-center px-2 py-2 text-sm font-medium rounded-md transition-colors',
                    isActive
                      ? 'bg-primary text-primary-foreground'
                      : 'text-muted-foreground hover:bg-accent hover:text-accent-foreground'
                  )}
                >
                  <item.icon
                    className={cn(
                      'mr-3 h-5 w-5 flex-shrink-0',
                      isActive
                        ? 'text-primary-foreground'
                        : 'text-muted-foreground group-hover:text-accent-foreground'
                    )}
                  />
                  {item.name}
                </Link>
              );
            })}
          </nav>
        </div>
      </div>
    </>
  );
};

export default Sidebar;