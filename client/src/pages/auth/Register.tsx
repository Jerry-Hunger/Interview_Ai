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
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Separator } from "@/components/ui/separator";
import { useToast } from "@/hooks/use-toast";
import {
  User,
  Building,
  Mail,
  Lock,
  Eye,
  EyeOff,
  GraduationCap,
  Briefcase,
} from "lucide-react";
import axiosInstance from "@/utils/axiosInstance";

const Register = () => {
  const [role, setRole] = useState<"student" | "company" | null>(null);
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    password: "",
    confirmPassword: "",
    education: "",
    skills: "",
    industry: "",
    roleOffered: "",
    companySize: "",
  });
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [roleError, setRoleError] = useState(false);

  const navigate = useNavigate();
  const { toast } = useToast();

  const handleInputChange = (key: string, value: string) => {
    setFormData((prev) => ({ ...prev, [key]: value }));
  };

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!role) {
      setRoleError(true);
      toast({
        title: "请选择角色",
        description: "请选择您是学生还是企业用户",
        variant: "destructive",
      });
      return;
    }
    setRoleError(false);

    if (formData.password !== formData.confirmPassword) {
      toast({
        title: "密码不一致",
        description: "请确保两次输入的密码相同",
        variant: "destructive",
      });
      return;
    }

    if (formData.password.length < 8) {
      toast({
        title: "密码太短",
        description: "密码长度至少为 8 个字符",
        variant: "destructive",
      });
      return;
    }

    setLoading(true);

    try {
      const res = await axiosInstance.post("/auth/register", {
        ...formData,
        role,
      });
      const data = res.data;

      localStorage.setItem("token", data.token);
      localStorage.setItem("role", role);

      toast({
        title: "注册成功",
        description: `欢迎加入 InterviewPro！正在为您设置${role === "student" ? "学生" : "企业"}账户...`,
      });

      navigate(
        role === "student" ? "/student/dashboard" : "/company/dashboard"
      );
    } catch (error: unknown) {
      const axiosError = error as { response?: { data?: { message?: string } }; message?: string };
      toast({
        title: "注册失败",
        description:
          axiosError.response?.data?.message ||
          axiosError.message ||
          "出错了，请重试。",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-gray-900 p-4">
      <div className="w-full max-w-2xl space-y-6">
        <div className="text-center">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-indigo-500 dark:bg-indigo-700 shadow-lg mb-4">
            <span className="text-white font-bold text-2xl">IP</span>
          </div>
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
            加入 InterviewPro
          </h1>
          <p className="text-gray-500 dark:text-gray-400">
            创建您的账户，开始您的求职之旅
          </p>
        </div>

        <Card className="shadow-xl border-0 bg-white dark:bg-gray-800 rounded-lg">
          <CardHeader className="space-y-1">
            <CardTitle className="text-2xl text-center text-gray-900 dark:text-white">
              创建账户
            </CardTitle>
            <CardDescription className="text-center text-gray-500 dark:text-gray-400">
              选择您的角色以获得个性化体验
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className={`space-y-3 p-3 rounded-lg transition-all ${roleError ? "bg-red-50 dark:bg-red-950/30 border border-red-300 dark:border-red-700 animate-pulse" : ""}`}>
              <Label className="text-base font-medium text-gray-900 dark:text-white">
                我是：{roleError && <span className="text-red-500 text-sm ml-1">请选择角色</span>}
              </Label>
              <div className="grid grid-cols-2 gap-3">
                <Button
                  type="button"
                  variant={role === "student" ? "default" : "outline"}
                  className={`h-20 flex-col space-y-2 ${role === "student"
                      ? "bg-indigo-500 dark:bg-indigo-700 text-white shadow-lg"
                      : "bg-gray-100 dark:bg-gray-700 text-gray-900 dark:text-white"
                    }`}
                  onClick={() => { setRole("student"); setRoleError(false); }}
                >
                  <User size={24} />
                  <div className="text-center">
                    <span className="block font-medium">学生</span>
                    <span className="text-xs opacity-80">
                      寻找工作机会
                    </span>
                  </div>
                </Button>
                <Button
                  type="button"
                  variant={role === "company" ? "default" : "outline"}
                  className={`h-20 flex-col space-y-2 ${role === "company"
                      ? "bg-purple-600 dark:bg-purple-700 text-white shadow-lg"
                      : "bg-gray-100 dark:bg-gray-700 text-gray-900 dark:text-white"
                    }`}
                  onClick={() => { setRole("company"); setRoleError(false); }}
                >
                  <Building size={24} />
                  <div className="text-center">
                    <span className="block font-medium">企业</span>
                    <span className="text-xs opacity-80">招聘人才</span>
                  </div>
                </Button>
              </div>
            </div>

            <Separator />

            <form onSubmit={handleRegister} className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label
                    htmlFor="name"
                    className="text-gray-900 dark:text-white"
                  >
                    {role === "company" ? "公司名称" : "姓名"}
                  </Label>
                  <Input
                    id="name"
                    type="text"
                    placeholder={
                      role === "company"
                        ? "请输入公司名称"
                        : "请输入您的姓名"
                    }
                    value={formData.name}
                    onChange={(e) => handleInputChange("name", e.target.value)}
                    className="bg-gray-100 dark:bg-gray-700 border border-gray-300 dark:border-gray-600 text-gray-900 dark:text-white"
                    required
                  />
                </div>

                <div className="space-y-2">
                  <Label
                    htmlFor="email"
                    className="text-gray-900 dark:text-white"
                  >
                    电子邮箱
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
                      value={formData.email}
                      onChange={(e) =>
                        handleInputChange("email", e.target.value)
                      }
                      className="pl-10 bg-gray-100 dark:bg-gray-700 border border-gray-300 dark:border-gray-600 text-gray-900 dark:text-white"
                      required
                    />
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
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
                      placeholder="创建密码"
                      value={formData.password}
                      onChange={(e) =>
                        handleInputChange("password", e.target.value)
                      }
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

                <div className="space-y-2">
                  <Label
                    htmlFor="confirmPassword"
                    className="text-gray-900 dark:text-white"
                  >
                    确认密码
                  </Label>
                  <div className="relative">
                    <Lock
                      className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 dark:text-gray-500"
                      size={16}
                    />
                    <Input
                      id="confirmPassword"
                      type={showConfirmPassword ? "text" : "password"}
                      placeholder="确认密码"
                      value={formData.confirmPassword}
                      onChange={(e) =>
                        handleInputChange("confirmPassword", e.target.value)
                      }
                      className="pl-10 pr-10 bg-gray-100 dark:bg-gray-700 border border-gray-300 dark:border-gray-600 text-gray-900 dark:text-white"
                      required
                    />
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      className="absolute right-2 top-1/2 transform -translate-y-1/2 w-6 h-6 p-0 text-gray-400 dark:text-gray-500"
                      onClick={() =>
                        setShowConfirmPassword(!showConfirmPassword)
                      }
                    >
                      {showConfirmPassword ? (
                        <EyeOff size={14} />
                      ) : (
                        <Eye size={14} />
                      )}
                    </Button>
                  </div>
                </div>
              </div>

              {role === "student" && (
                <div className="space-y-4 p-4 bg-indigo-50 dark:bg-indigo-900 rounded-lg border border-indigo-200 dark:border-indigo-700">
                  <div className="flex items-center gap-2 text-indigo-700 dark:text-indigo-300 font-medium">
                    <GraduationCap size={16} />
                    学生信息
                  </div>

                  <div className="space-y-2">
                    <Label
                      htmlFor="education"
                      className="text-gray-900 dark:text-white"
                    >
                      教育背景
                    </Label>
                    <Input
                      id="education"
                      type="text"
                      placeholder="例如：计算机科学，清华大学"
                      value={formData.education}
                      onChange={(e) =>
                        handleInputChange("education", e.target.value)
                      }
                      className="bg-gray-100 dark:bg-gray-700 border border-gray-300 dark:border-gray-600 text-gray-900 dark:text-white"
                      required
                    />
                  </div>

                  <div className="space-y-2">
                    <Label
                      htmlFor="skills"
                      className="text-gray-900 dark:text-white"
                    >
                      技能（可选）
                    </Label>
                    <Textarea
                      id="skills"
                      placeholder="例如：React, Node.js, Python, 机器学习..."
                      value={formData.skills}
                      onChange={(e) =>
                        handleInputChange("skills", e.target.value)
                      }
                      rows={3}
                      className="bg-gray-100 dark:bg-gray-700 border border-gray-300 dark:border-gray-600 text-gray-900 dark:text-white"
                    />
                  </div>
                </div>
              )}

              {role === "company" && (
                <div className="space-y-4 p-4 bg-purple-50 dark:bg-purple-900 rounded-lg border border-purple-200 dark:border-purple-700">
                  <div className="flex items-center gap-2 text-purple-700 dark:text-purple-300 font-medium">
                    <Briefcase size={16} />
                    企业信息
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label
                        htmlFor="industry"
                        className="text-gray-900 dark:text-white"
                      >
                        行业
                      </Label>
                      <Select
                        onValueChange={(value) =>
                          handleInputChange("industry", value)
                        }
                        required
                      >
                        <SelectTrigger className="bg-gray-100 dark:bg-gray-700 border border-gray-300 dark:border-gray-600 text-gray-900 dark:text-white">
                          <SelectValue placeholder="选择行业" />
                        </SelectTrigger>
                        <SelectContent className="bg-white dark:bg-[#23263A] text-gray-900 dark:text-white">
                          <SelectItem value="科技" className="dark:focus:bg-purple-900 dark:focus:text-white">科技</SelectItem>
                          <SelectItem value="金融" className="dark:focus:bg-purple-900 dark:focus:text-white">金融</SelectItem>
                          <SelectItem value="医疗" className="dark:focus:bg-purple-900 dark:focus:text-white">医疗</SelectItem>
                          <SelectItem value="教育" className="dark:focus:bg-purple-900 dark:focus:text-white">教育</SelectItem>
                          <SelectItem value="零售" className="dark:focus:bg-purple-900 dark:focus:text-white">零售</SelectItem>
                          <SelectItem value="制造业" className="dark:focus:bg-purple-900 dark:focus:text-white">
                            制造业
                          </SelectItem>
                          <SelectItem value="其他" className="dark:focus:bg-purple-900 dark:focus:text-white">其他</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>

                    <div className="space-y-2">
                      <Label
                        htmlFor="companySize"
                        className="text-gray-900 dark:text-white"
                      >
                        公司规模
                      </Label>
                      <Select
                        onValueChange={(value) =>
                          handleInputChange("companySize", value)
                        }
                        required
                      >
                        <SelectTrigger className="bg-gray-100 dark:bg-gray-700 border border-gray-300 dark:border-gray-600 text-gray-900 dark:text-white">
                          <SelectValue placeholder="选择规模" />
                        </SelectTrigger>
                        <SelectContent className="bg-white dark:bg-[#23263A] text-gray-900 dark:text-white">
                          <SelectItem value="1-10" className="dark:focus:bg-purple-900 dark:focus:text-white">1-10 人</SelectItem>
                          <SelectItem value="11-50" className="dark:focus:bg-purple-900 dark:focus:text-white">11-50 人</SelectItem>
                          <SelectItem value="51-200" className="dark:focus:bg-purple-900 dark:focus:text-white">
                            51-200 人
                          </SelectItem>
                          <SelectItem value="201-500" className="dark:focus:bg-purple-900 dark:focus:text-white">
                            201-500 人
                          </SelectItem>
                          <SelectItem value="500+" className="dark:focus:bg-purple-900 dark:focus:text-white">500+ 人</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label
                      htmlFor="roleOffered"
                      className="text-gray-900 dark:text-white"
                    >
                      主要招聘职位
                    </Label>
                    <Input
                      id="roleOffered"
                      type="text"
                      placeholder="例如：软件工程师，产品经理"
                      value={formData.roleOffered}
                      onChange={(e) =>
                        handleInputChange("roleOffered", e.target.value)
                      }
                      className="bg-gray-100 dark:bg-gray-700 border border-gray-300 dark:border-gray-600 text-gray-900 dark:text-white"
                      required
                    />
                  </div>
                </div>
              )}

              <Button
                type="submit"
                className="w-full bg-indigo-500 dark:bg-indigo-700 text-white hover:shadow-lg transition-all duration-300"
                size="lg"
                disabled={loading || !role}
              >
                {loading ? "创建账户中..." : "创建账户"}
              </Button>
            </form>

            <div className="text-center">
              <p className="text-sm text-gray-500 dark:text-gray-400">
                已有账户？{" "}
                <Link
                  to="/login"
                  className="text-indigo-500 dark:text-indigo-400 hover:underline font-medium"
                >
                  立即登录
                </Link>
              </p>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default Register;
