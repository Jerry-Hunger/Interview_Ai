import { useState, useEffect } from "react";
import { Link, useNavigate, useSearchParams } from "react-router-dom";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import { useToast } from "@/hooks/use-toast";
import { User, Building, Mail, Lock, Eye, EyeOff } from "lucide-react";
import axiosInstance from "@/utils/axiosInstance";

const Login = () => {
  const [role, setRole] = useState<"student" | "company" | null>(null);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [githubLoading, setGithubLoading] = useState(false);

  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { toast } = useToast();

  useEffect(() => {
    const token = searchParams.get("token");
    const userRole = searchParams.get("role");
    if (token) {
      setGithubLoading(false);
      localStorage.setItem("token", token);
      localStorage.setItem("role", userRole || "student");
      navigate(userRole === "company" ? "/company/dashboard" : "/student/dashboard");
    }
  }, [searchParams, navigate]);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!role) {
      toast({
        title: "请选择角色",
        description: "请选择您是学生还是企业用户",
        variant: "destructive",
      });
      return;
    }

    if (!email || !password) {
      toast({
        title: "信息不完整",
        description: "请填写邮箱和密码",
        variant: "destructive",
      });
      return;
    }

    try {
      setLoading(true);

      const res = await axiosInstance.post("/auth/login", {
        email,
        password,
        role,
      });

      setLoading(false);

      toast({
        title: "登录成功",
        description: `欢迎回来！正在跳转到您的${res.data.role === "student" ? "学生" : "企业"}控制台...`,
      });

      localStorage.setItem("token", res.data.token);
      localStorage.setItem("role", res.data.role);

      navigate(
        res.data.role === "student"
          ? "/student/dashboard"
          : "/company/dashboard"
      );
    } catch (err: unknown) {
      setLoading(false);

      const axiosError = err as { response?: { data?: { message?: string } } };
      toast({
        title: "登录失败",
        description: axiosError.response?.data?.message || "邮箱或密码错误",
        variant: "destructive",
      });
    }
  };

  const handleGithubLogin = async () => {
    if (!role) {
      toast({
        title: "请选择角色",
        description: "请先选择您的角色再继续",
        variant: "destructive",
      });
      return;
    }

    try {
      setGithubLoading(true);
      window.location.href = `${import.meta.env.VITE_API_URL}/auth/github`;
    } catch (err) {
      console.error("OAuth error:", err);
      toast({
        title: "登录失败",
        description: "OAuth 授权失败",
        variant: "destructive",
      });
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-white dark:bg-gray-900 p-4">
      <div className="w-full max-w-md space-y-6">
        <div className="text-center">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-indigo-500 dark:bg-indigo-700 shadow-lg mb-4">
            <span className="text-white font-bold text-2xl">IP</span>
          </div>
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
            InterviewPro
          </h1>
          <p className="text-gray-500 dark:text-gray-400">
            登录您的账户
          </p>
        </div>

        <Card className="shadow-xl border-0 bg-white dark:bg-gray-800 ring ring-gray-900/5 rounded-lg">
          <CardHeader className="space-y-1">
            <CardTitle className="text-2xl text-center text-gray-900 dark:text-white">
              欢迎回来
            </CardTitle>
            <CardDescription className="text-center text-gray-500 dark:text-gray-400">
              选择您的角色并输入登录信息
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="space-y-3">
              <Label className="text-base font-medium text-gray-900 dark:text-white">
                我是：
              </Label>
              <div className="grid grid-cols-2 gap-3">
                <Button
                  type="button"
                  variant={role === "student" ? "default" : "outline"}
                  className={`h-16 flex-col space-y-2 ${
                    role === "student"
                      ? "bg-indigo-500 dark:bg-indigo-700 text-white shadow-lg"
                      : "bg-gray-100 dark:bg-gray-700 text-gray-900 dark:text-white"
                  }`}
                  onClick={() => setRole("student")}
                >
                  <User size={20} />
                  <span>学生</span>
                </Button>
                <Button
                  type="button"
                  variant={role === "company" ? "default" : "outline"}
                  className={`h-16 flex-col space-y-2 ${
                    role === "company"
                      ? "bg-purple-600 dark:bg-purple-700 text-white shadow-lg"
                      : "bg-gray-100 dark:bg-gray-700 text-gray-900 dark:text-white"
                  }`}
                  onClick={() => setRole("company")}
                >
                  <Building size={20} />
                  <span>企业</span>
                </Button>
              </div>
            </div>

            <Separator />

            <form onSubmit={handleLogin} className="space-y-4">
              <div className="space-y-2">
                <Label
                  htmlFor="email"
                  className="text-gray-900 dark:text-white"
                >
                  邮箱
                </Label>
                <div className="relative">
                  <Mail
                    className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 dark:text-gray-500"
                    size={16}
                  />
                  <Input
                    id="email"
                    type="email"
                    placeholder="请输入邮箱"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="pl-10 bg-gray-100 dark:bg-gray-700 border border-gray-300 dark:border-gray-600 text-gray-900 dark:text-white"
                    required
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label
                  htmlFor="password"
                  className="text-gray-900 dark:text-white"
                >
                  密码
                </Label>
                <div className="relative">
                  <Lock
                    className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 dark:text-gray-500"
                    size={16}
                  />
                  <Input
                    id="password"
                    type={showPassword ? "text" : "password"}
                    placeholder="请输入密码"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="pl-10 pr-10 bg-gray-100 dark:bg-gray-700 border border-gray-300 dark:border-gray-600 text-gray-900 dark:text-white"
                    required
                  />
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    className="absolute right-2 top-1/2 transform -translate-y-1/2 w-6 h-6 p-0 text-gray-400 dark:text-gray-500"
                    onClick={() => setShowPassword(!showPassword)}
                  >
                    {showPassword ? <EyeOff size={14} /> : <Eye size={14} />}
                  </Button>
                </div>
              </div>

              <Button
                type="submit"
                className="w-full bg-indigo-500 dark:bg-indigo-700 text-white hover:shadow-lg transition-all duration-300"
                size="lg"
                disabled={loading}
              >
                {loading ? "登录中..." : "登录"}
              </Button>
            </form>

            <Separator />

            <div className="space-y-3">
              <Button
                type="button"
                variant="outline"
                className="w-full text-gray-900 dark:text-white border border-gray-300 dark:border-gray-600 bg-gray-100 dark:bg-gray-700"
                onClick={handleGithubLogin}
                disabled={!role || githubLoading}
              >
                {githubLoading ? (
                  <span className="flex items-center">
                    <svg className="animate-spin -ml-1 mr-2 h-4 w-4" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                    </svg>
                    登录中...
                  </span>
                ) : (
                  <>
                    <svg
                      className="w-4 h-4 mr-2"
                      fill="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path d="M12 0c-6.626 0-12 5.373-12 12 0 5.302 3.438 9.8 8.207 11.387.599.111.793-.261.793-.577v-2.234c-3.338.726-4.033-1.416-4.033-1.416-.546-1.387-1.333-1.756-1.333-1.756-1.089-.745.083-.729.083-.729 1.205.084 1.839 1.237 1.839 1.237 1.07 1.834 2.807 1.304 3.492.997.107-.775.418-1.305.762-1.604-2.665-.305-5.467-1.334-5.467-5.931 0-1.311.469-2.381 1.236-3.221-.124-.303-.535-1.524.117-3.176 0 0 1.008-.322 3.301 1.23.957-.266 1.983-.399 3.003-.404 1.02.005 2.047.138 3.006.404 2.291-1.552 3.297-1.23 3.297-1.23.653 1.653.242 2.874.118 3.176.77.84 1.235 1.911 1.235 3.221 0 4.609-2.807 5.624-5.479 5.921.43.372.823 1.102.823 2.222v3.293c0 .319.192.694.801.576 4.765-1.589 8.199-6.286 8.199-11.386 0-6.627-5.373-12-12-12z" />
                    </svg>
                    使用 GitHub 继续
                  </>
                )}
              </Button>
            </div>

            <div className="text-center">
              <p className="text-sm text-gray-500 dark:text-gray-400">
                还没有账户？{" "}
                <Link
                  to="/register"
                  className="text-indigo-500 dark:text-indigo-400 hover:underline font-medium"
                >
                  立即注册
                </Link>
              </p>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default Login;
