import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
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

  const navigate = useNavigate();
  const { toast } = useToast();

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!role) {
      toast({
        title: "Role Required",
        description: "Please select whether you are a Student or Company",
        variant: "destructive",
      });
      return;
    }

    if (!email || !password) {
      toast({
        title: "Missing Fields",
        description: "Email and password are required",
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
        title: "Login Successful",
        description: `Welcome back! Redirecting to your ${res.data.role} dashboard...`,
      });

      // Save token in localStorage (optional)
      localStorage.setItem("token", res.data.token);
      localStorage.setItem("role", res.data.role);

      navigate(
        res.data.role === "student"
          ? "/student/dashboard"
          : "/company/dashboard"
      );
    } catch (err: any) {
      setLoading(false);

      toast({
        title: "Login Failed",
        description: err.response?.data?.message || "Invalid credentials",
        variant: "destructive",
      });
    }
  };

  const handleOAuthLogin = (provider: "google" | "linkedin") => {
    if (!role) {
      toast({
        title: "Role Required",
        description: "Please select your role before continuing with OAuth",
        variant: "destructive",
      });
      return;
    }

    toast({
      title: `${provider} Login`,
      description: "OAuth integration coming soon!",
    });
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-white dark:bg-gray-900 p-4">
      <div className="w-full max-w-md space-y-6">
        {/* Logo */}
        <div className="text-center">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-indigo-500 dark:bg-indigo-700 shadow-lg mb-4">
            <span className="text-white font-bold text-2xl">IP</span>
          </div>
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
            InterviewPro
          </h1>
          <p className="text-gray-500 dark:text-gray-400">
            Sign in to your account
          </p>
        </div>

        <Card className="shadow-xl border-0 bg-white dark:bg-gray-800 ring ring-gray-900/5 rounded-lg">
          <CardHeader className="space-y-1">
            <CardTitle className="text-2xl text-center text-gray-900 dark:text-white">
              Welcome back
            </CardTitle>
            <CardDescription className="text-center text-gray-500 dark:text-gray-400">
              Choose your role and enter your credentials
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            {/* Role Selection */}
            <div className="space-y-3">
              <Label className="text-base font-medium text-gray-900 dark:text-white">
                I am a:
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
                  <span>Student</span>
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
                  <span>Company</span>
                </Button>
              </div>
            </div>

            <Separator />

            {/* Login Form */}
            <form onSubmit={handleLogin} className="space-y-4">
              <div className="space-y-2">
                <Label
                  htmlFor="email"
                  className="text-gray-900 dark:text-white"
                >
                  Email
                </Label>
                <div className="relative">
                  <Mail
                    className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 dark:text-gray-500"
                    size={16}
                  />
                  <Input
                    id="email"
                    type="email"
                    placeholder="Enter your email"
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
                  Password
                </Label>
                <div className="relative">
                  <Lock
                    className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 dark:text-gray-500"
                    size={16}
                  />
                  <Input
                    id="password"
                    type={showPassword ? "text" : "password"}
                    placeholder="Enter your password"
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
                {loading ? "Signing in..." : "Sign In"}
              </Button>
            </form>

            <Separator />

            {/* OAuth Buttons */}
            <div className="space-y-3">
              <Button
                type="button"
                variant="outline"
                className="w-full text-gray-900 dark:text-white border border-gray-300 dark:border-gray-600 bg-gray-100 dark:bg-gray-700"
                onClick={() => handleOAuthLogin("google")}
                disabled={!role}
              >
                <svg className="w-4 h-4 mr-2" viewBox="0 0 24 24">
                  <path
                    fill="currentColor"
                    d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                  />
                  <path
                    fill="currentColor"
                    d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                  />
                  <path
                    fill="currentColor"
                    d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
                  />
                  <path
                    fill="currentColor"
                    d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
                  />
                </svg>
                Continue with Google
              </Button>

              <Button
                type="button"
                variant="outline"
                className="w-full text-gray-900 dark:text-white border border-gray-300 dark:border-gray-600 bg-gray-100 dark:bg-gray-700"
                onClick={() => handleOAuthLogin("linkedin")}
                disabled={!role}
              >
                <svg
                  className="w-4 h-4 mr-2"
                  fill="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433c-1.144 0-2.063-.926-2.063-2.065 0-1.138.92-2.063 2.063-2.063 1.14 0 2.064.925 2.064 2.063 0 1.139-.925 2.065-2.064 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z" />
                </svg>
                Continue with LinkedIn
              </Button>
            </div>

            {/* Register Link */}
            <div className="text-center">
              <p className="text-sm text-gray-500 dark:text-gray-400">
                Don't have an account?{" "}
                <Link
                  to="/register"
                  className="text-indigo-500 dark:text-indigo-400 hover:underline font-medium"
                >
                  Sign up here
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
