import { useState } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { useTheme } from '@/contexts/ThemeContext';
import { 
  User, 
  Building, 
  Sun, 
  Moon, 
  Menu, 
  X, 
  LogOut,
  Settings,
  Home
} from 'lucide-react';

const Navigation = () => {
  const [isOpen, setIsOpen] = useState(false);
  const { theme, setTheme } = useTheme();
  const navigate = useNavigate();
  const location = useLocation();

  // Mock user state - replace with actual auth context
  const [user] = useState({
    role: 'student', // or 'company'
    name: 'John Doe',
    email: 'john@example.com'
  });

  const toggleTheme = () => {
    setTheme(theme === 'light' ? 'dark' : 'light');
  };

  const handleLogout = () => {
    // Mock logout - implement actual logout logic
    navigate('/login');
  };

  const studentNavItems = [
    { name: 'Dashboard', path: '/student/dashboard', icon: Home },
    { name: 'Practice Interview', path: '/student/practice', icon: User },
    { name: 'Explore Companies', path: '/student/companies', icon: Building },
  ];

  const companyNavItems = [
    { name: 'Dashboard', path: '/company/dashboard', icon: Home },
    { name: 'Setup Interview', path: '/company/setup', icon: Settings },
    { name: 'Company Profile', path: '/company/profile', icon: Building },
  ];

  const navItems = user.role === 'student' ? studentNavItems : companyNavItems;

  const isActivePath = (path: string) => location.pathname === path;

  return (
    <nav className="bg-white dark:bg-[#181A2A] border-b border-gray-200 dark:border-gray-700 shadow">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          {/* Logo */}
          <Link to="/" className="flex items-center space-x-2">
            <div className="w-8 h-8 bg-gradient-to-r from-indigo-500 to-purple-500 dark:from-indigo-700 dark:to-purple-700 rounded-lg flex items-center justify-center">
              <span className="text-white font-bold text-sm">IP</span>
            </div>
            <span className="font-bold text-xl text-indigo-700 dark:text-indigo-300">InterviewPro</span>
          </Link>

          {/* Desktop Navigation */}
          <div className="hidden md:flex items-center space-x-8">
            {navItems.map((item) => {
              const Icon = item.icon;
              return (
                <Link
                  key={item.path}
                  to={item.path}
                  className={`flex items-center space-x-2 px-3 py-2 rounded-lg transition-all duration-200 ${
                    isActivePath(item.path)
                      ? 'bg-indigo-500 dark:bg-indigo-700 text-white shadow'
                      : 'text-gray-700 dark:text-gray-300 hover:text-indigo-600 dark:hover:text-indigo-400 hover:bg-gray-100 dark:hover:bg-[#23263A]'
                  }`}
                >
                  <Icon size={16} />
                  <span className="font-medium">{item.name}</span>
                </Link>
              );
            })}
          </div>

          {/* Desktop Actions */}
          <div className="hidden md:flex items-center space-x-4">
            <Button
              variant="ghost"
              size="sm"
              onClick={toggleTheme}
              className="w-9 h-9"
            >
              {theme === 'light' ? <Moon size={16} /> : <Sun size={16} />}
            </Button>
            
            <div className="flex items-center space-x-3">
              <div className="text-right">
                <p className="text-sm font-medium text-indigo-700 dark:text-indigo-300">{user.name}</p>
                <p className="text-xs text-gray-500 dark:text-gray-400 capitalize">{user.role}</p>
              </div>
              <Button
                variant="ghost"
                size="sm"
                onClick={handleLogout}
                className="w-9 h-9 text-red-500 hover:text-white hover:bg-red-500"
              >
                <LogOut size={16} />
              </Button>
            </div>
          </div>

          {/* Mobile menu button */}
          <div className="md:hidden">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setIsOpen(!isOpen)}
              className="w-9 h-9"
            >
              {isOpen ? <X size={20} /> : <Menu size={20} />}
            </Button>
          </div>
        </div>
      </div>

      {/* Mobile Navigation */}
      {isOpen && (
        <div className="md:hidden bg-white dark:bg-[#181A2A] border-t border-gray-200 dark:border-gray-700">
          <div className="px-2 pt-2 pb-3 space-y-1">
            {navItems.map((item) => {
              const Icon = item.icon;
              return (
                <Link
                  key={item.path}
                  to={item.path}
                  className={`flex items-center space-x-3 px-3 py-2 rounded-lg text-base font-medium transition-all duration-200 ${
                    isActivePath(item.path)
                      ? 'bg-indigo-500 dark:bg-indigo-700 text-white'
                      : 'text-gray-700 dark:text-gray-300 hover:text-indigo-600 dark:hover:text-indigo-400 hover:bg-gray-100 dark:hover:bg-[#23263A]'
                  }`}
                  onClick={() => setIsOpen(false)}
                >
                  <Icon size={18} />
                  <span>{item.name}</span>
                </Link>
              );
            })}
            
            <div className="px-3 py-2 border-t border-gray-200 dark:border-gray-700 mt-2 pt-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-indigo-700 dark:text-indigo-300">{user.name}</p>
                  <p className="text-xs text-gray-500 dark:text-gray-400 capitalize">{user.role}</p>
                </div>
                <div className="flex items-center space-x-2">
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={toggleTheme}
                    className="w-9 h-9"
                  >
                    {theme === 'light' ? <Moon size={16} /> : <Sun size={16} />}
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={handleLogout}
                    className="w-9 h-9 text-red-500 hover:text-white hover:bg-red-500"
                  >
                    <LogOut size={16} />
                  </Button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </nav>
  );
};

export default Navigation;