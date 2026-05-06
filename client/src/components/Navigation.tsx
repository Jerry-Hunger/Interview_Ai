import { useState, useEffect } from "react";
import { Link, useNavigate, useLocation } from "react-router-dom";
import { useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { useTheme } from "@/contexts/ThemeContext";
import {
  User,
  Building,
  Sun,
  Moon,
  Menu,
  X,
  LogOut,
  Home,
  FilePlus,
  Briefcase,
  ClipboardList,
  LogIn,
  UserPlus,
} from "lucide-react";

const Navigation = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [showLogoutConfirm, setShowLogoutConfirm] = useState(false);
  const { theme, setTheme } = useTheme();
  const navigate = useNavigate();
  const location = useLocation();
  const queryClient = useQueryClient();

  const [role, setRole] = useState<string | null>(() => localStorage.getItem("role"));
  const [token, setToken] = useState<string | null>(() => localStorage.getItem("token"));

  useEffect(() => {
    setRole(localStorage.getItem("role"));
    setToken(localStorage.getItem("token"));
  }, [location.pathname]);

  const toggleTheme = () => {
    setTheme(theme === "light" ? "dark" : "light");
  };

  const handleLogout = () => {
    setShowLogoutConfirm(false);
    localStorage.removeItem("token");
    localStorage.removeItem("role");
    queryClient.clear(); // 清除所有 React Query 缓存
    setRole(null);
    setToken(null);
    navigate("/login");
  };

  const publicNavItems = [
    { name: "首页", path: "/", icon: Home },
    { name: "登录", path: "/login", icon: LogIn },
    { name: "注册", path: "/register", icon: UserPlus },
  ];

  const studentNavItems = [
    { name: "仪表盘", path: "/student/dashboard", icon: Home },
    { name: "模拟面试", path: "/student/practice", icon: User },
    { name: "浏览职位", path: "/student/jobs", icon: Building },
    {
      name: "我的申请",
      path: "/student/applications",
      icon: ClipboardList,
    },
    { name: "个人资料", path: "/student/profile", icon: User },
  ];

  const companyNavItems = [
    { name: "仪表盘", path: "/company/dashboard", icon: Home },
    { name: "发布职位", path: "/company/job/new", icon: FilePlus },
    { name: "职位列表", path: "/company/jobs", icon: Briefcase },
    { name: "公司资料", path: "/company/profile", icon: Building },
  ];

  let navItems = publicNavItems;
  if (token && role === "student") navItems = studentNavItems;
  if (token && role === "company") navItems = companyNavItems;

  const isActivePath = (path: string) => location.pathname === path;

  return (
    <nav className="bg-white dark:bg-[#181A2A] border-b border-gray-200 dark:border-gray-700 shadow">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          {/* Logo */}
          <div
            className="flex items-center space-x-2 cursor-pointer"
            onClick={() => {
              if (token && role === "student") navigate("/student/dashboard");
              else if (token && role === "company") navigate("/company/dashboard");
              else navigate("/");
            }}
          >
            <div className="w-8 h-8 bg-gradient-to-r from-indigo-500 to-purple-500 dark:from-indigo-700 dark:to-purple-700 rounded-lg flex items-center justify-center">
              <span className="text-white font-bold text-sm">IP</span>
            </div>
            <span className="font-bold text-xl text-indigo-700 dark:text-indigo-400">
              IntelliHire
            </span>
          </div>

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
                      ? "bg-indigo-500 dark:bg-indigo-700 text-white shadow"
                      : "text-gray-700 dark:text-gray-300 hover:text-indigo-600 dark:hover:text-indigo-400 hover:bg-gray-100 dark:hover:bg-[#23263A]"
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
              {theme === "light" ? <Moon size={16} /> : <Sun size={16} />}
            </Button>

            {token && (
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setShowLogoutConfirm(true)}
                className="w-9 h-9 text-red-500 hover:text-white hover:bg-red-500"
              >
                <LogOut size={16} />
              </Button>
            )}
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
                      ? "bg-indigo-500 dark:bg-indigo-700 text-white"
                      : "text-gray-700 dark:text-gray-300 hover:text-indigo-600 dark:hover:text-indigo-400 hover:bg-gray-100 dark:hover:bg-[#23263A]"
                  }`}
                  onClick={() => setIsOpen(false)}
                >
                  <Icon size={18} />
                  <span>{item.name}</span>
                </Link>
              );
            })}

            {token && (
              <div className="px-3 py-2 border-t border-gray-200 dark:border-gray-700 mt-2 pt-4">
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setShowLogoutConfirm(true)}
                  className="w-full text-red-500 dark:text-red-400 hover:text-white hover:bg-red-500 cursor-pointer"
                  aria-label="退出登录"
                >
                  <LogOut size={16} className="mr-2" /> 退出登录
                </Button>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Logout Confirmation Modal */}
      {showLogoutConfirm && (
        <div
          className="fixed inset-0 z-[100] flex items-center justify-center bg-black/50 backdrop-blur-sm"
          onClick={() => setShowLogoutConfirm(false)}
        >
          <div
            className="relative bg-white dark:bg-[#1a1c29] rounded-xl shadow-2xl p-6 w-full max-w-sm mx-4"
            onClick={(e) => e.stopPropagation()}
          >
            <button
              onClick={() => setShowLogoutConfirm(false)}
              className="cursor-pointer absolute top-4 right-4 p-1 rounded-full hover:bg-gray-200 dark:hover:bg-gray-700 text-gray-500 dark:text-gray-400 transition focus:outline-none focus:ring-2 focus:ring-indigo-400"
              aria-label="关闭"
            >
              <X size={18} />
            </button>
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
              确定退出登录？
            </h3>
            <p className="text-sm text-gray-500 dark:text-gray-400 mb-6">
              退出后将返回登录页面
            </p>
            <div className="flex gap-3 justify-end">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setShowLogoutConfirm(false)}
              >
                取消
              </Button>
              <Button
                size="sm"
                onClick={handleLogout}
                className="bg-red-500 hover:bg-red-600 text-white"
              >
                确定退出
              </Button>
            </div>
          </div>
        </div>
      )}
    </nav>
  );
};

export default Navigation;
