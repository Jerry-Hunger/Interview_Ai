import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Separator } from '@/components/ui/separator';
import { useToast } from '@/hooks/use-toast';
import { User, Building, Mail, Lock, Eye, EyeOff, GraduationCap, Briefcase } from 'lucide-react';

const Register = () => {
  const [role, setRole] = useState<'student' | 'company' | null>(null);
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    password: '',
    confirmPassword: '',
    education: '',
    skills: '',
    industry: '',
    roleOffered: '',
    companySize: '',
  });
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [loading, setLoading] = useState(false);

  const navigate = useNavigate();
  const { toast } = useToast();

  const handleInputChange = (key: string, value: string) => {
    setFormData(prev => ({ ...prev, [key]: value }));
  };

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!role) {
      toast({
        title: 'Role Required',
        description: 'Please select whether you are a Student or Company',
        variant: 'destructive',
      });
      return;
    }

    if (formData.password !== formData.confirmPassword) {
      toast({
        title: 'Password Mismatch',
        description: 'Please ensure both password fields match',
        variant: 'destructive',
      });
      return;
    }

    if (formData.password.length < 8) {
      toast({
        title: 'Password Too Short',
        description: 'Password must be at least 8 characters long',
        variant: 'destructive',
      });
      return;
    }

    setLoading(true);

    setTimeout(() => {
      setLoading(false);
      toast({
        title: 'Registration Successful',
        description: `Welcome to InterviewPro! Setting up your ${role} account...`,
      });

      navigate(role === 'student' ? '/student/dashboard' : '/company/dashboard');
    }, 2000);
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-gray-900 p-4">
      <div className="w-full max-w-2xl space-y-6">
        {/* Logo */}
        <div className="text-center">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-indigo-500 dark:bg-indigo-700 shadow-lg mb-4">
            <span className="text-white font-bold text-2xl">IP</span>
          </div>
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white">Join InterviewPro</h1>
          <p className="text-gray-500 dark:text-gray-400">Create your account and start your journey</p>
        </div>

        <Card className="shadow-xl border-0 bg-white dark:bg-gray-800 rounded-lg">
          <CardHeader className="space-y-1">
            <CardTitle className="text-2xl text-center text-gray-900 dark:text-white">Create Account</CardTitle>
            <CardDescription className="text-center text-gray-500 dark:text-gray-400">
              Choose your role to get personalized experience
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            {/* Role Selection */}
            <div className="space-y-3">
              <Label className="text-base font-medium text-gray-900 dark:text-white">I am a:</Label>
              <div className="grid grid-cols-2 gap-3">
                <Button
                  type="button"
                  variant={role === 'student' ? 'default' : 'outline'}
                  className={`h-20 flex-col space-y-2 ${
                    role === 'student'
                      ? 'bg-indigo-500 dark:bg-indigo-700 text-white shadow-lg'
                      : 'bg-gray-100 dark:bg-gray-700 text-gray-900 dark:text-white'
                  }`}
                  onClick={() => setRole('student')}
                >
                  <User size={24} />
                  <div className="text-center">
                    <span className="block font-medium">Student</span>
                    <span className="text-xs opacity-80">Looking for opportunities</span>
                  </div>
                </Button>
                <Button
                  type="button"
                  variant={role === 'company' ? 'default' : 'outline'}
                  className={`h-20 flex-col space-y-2 ${
                    role === 'company'
                      ? 'bg-purple-600 dark:bg-purple-700 text-white shadow-lg'
                      : 'bg-gray-100 dark:bg-gray-700 text-gray-900 dark:text-white'
                  }`}
                  onClick={() => setRole('company')}
                >
                  <Building size={24} />
                  <div className="text-center">
                    <span className="block font-medium">Company</span>
                    <span className="text-xs opacity-80">Hiring talent</span>
                  </div>
                </Button>
              </div>
            </div>

            <Separator />

            {/* Registration Form */}
            <form onSubmit={handleRegister} className="space-y-4">
              {/* Basic Information */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="name" className="text-gray-900 dark:text-white">{role === 'company' ? 'Company Name' : 'Full Name'}</Label>
                  <Input
                    id="name"
                    type="text"
                    placeholder={role === 'company' ? 'Enter company name' : 'Enter your full name'}
                    value={formData.name}
                    onChange={(e) => handleInputChange('name', e.target.value)}
                    className="bg-gray-100 dark:bg-gray-700 border border-gray-300 dark:border-gray-600 text-gray-900 dark:text-white"
                    required
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="email" className="text-gray-900 dark:text-white">Email Address</Label>
                  <div className="relative">
                    <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 dark:text-gray-500" size={16} />
                    <Input
                      id="email"
                      type="email"
                      placeholder="Enter your email"
                      value={formData.email}
                      onChange={(e) => handleInputChange('email', e.target.value)}
                      className="pl-10 bg-gray-100 dark:bg-gray-700 border border-gray-300 dark:border-gray-600 text-gray-900 dark:text-white"
                      required
                    />
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="password" className="text-gray-900 dark:text-white">Password</Label>
                  <div className="relative">
                    <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 dark:text-gray-500" size={16} />
                    <Input
                      id="password"
                      type={showPassword ? 'text' : 'password'}
                      placeholder="Create password"
                      value={formData.password}
                      onChange={(e) => handleInputChange('password', e.target.value)}
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
                  <Label htmlFor="confirmPassword" className="text-gray-900 dark:text-white">Confirm Password</Label>
                  <div className="relative">
                    <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 dark:text-gray-500" size={16} />
                    <Input
                      id="confirmPassword"
                      type={showConfirmPassword ? 'text' : 'password'}
                      placeholder="Confirm password"
                      value={formData.confirmPassword}
                      onChange={(e) => handleInputChange('confirmPassword', e.target.value)}
                      className="pl-10 pr-10 bg-gray-100 dark:bg-gray-700 border border-gray-300 dark:border-gray-600 text-gray-900 dark:text-white"
                      required
                    />
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      className="absolute right-2 top-1/2 transform -translate-y-1/2 w-6 h-6 p-0 text-gray-400 dark:text-gray-500"
                      onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                    >
                      {showConfirmPassword ? <EyeOff size={14} /> : <Eye size={14} />}
                    </Button>
                  </div>
                </div>
              </div>

              {/* Role-specific fields */}
              {role === 'student' && (
                <div className="space-y-4 p-4 bg-indigo-50 dark:bg-indigo-900 rounded-lg border border-indigo-200 dark:border-indigo-700">
                  <div className="flex items-center gap-2 text-indigo-700 dark:text-indigo-300 font-medium">
                    <GraduationCap size={16} />
                    Student Information
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="education" className="text-gray-900 dark:text-white">Education Background</Label>
                    <Input
                      id="education"
                      type="text"
                      placeholder="e.g., Computer Science, Stanford University"
                      value={formData.education}
                      onChange={(e) => handleInputChange('education', e.target.value)}
                      className="bg-gray-100 dark:bg-gray-700 border border-gray-300 dark:border-gray-600 text-gray-900 dark:text-white"
                      required
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="skills" className="text-gray-900 dark:text-white">Skills (Optional)</Label>
                    <Textarea
                      id="skills"
                      placeholder="e.g., React, Node.js, Python, Machine Learning..."
                      value={formData.skills}
                      onChange={(e) => handleInputChange('skills', e.target.value)}
                      rows={3}
                      className="bg-gray-100 dark:bg-gray-700 border border-gray-300 dark:border-gray-600 text-gray-900 dark:text-white"
                    />
                  </div>
                </div>
              )}

              {role === 'company' && (
                <div className="space-y-4 p-4 bg-purple-50 dark:bg-purple-900 rounded-lg border border-purple-200 dark:border-purple-700">
                  <div className="flex items-center gap-2 text-purple-700 dark:text-purple-300 font-medium">
                    <Briefcase size={16} />
                    Company Information
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="industry" className="text-gray-900 dark:text-white">Industry</Label>
                      <Select onValueChange={(value) => handleInputChange('industry', value)} required>
                        <SelectTrigger className="bg-gray-100 dark:bg-gray-700 border border-gray-300 dark:border-gray-600 text-gray-900 dark:text-white">
                          <SelectValue placeholder="Select industry" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="technology">Technology</SelectItem>
                          <SelectItem value="finance">Finance</SelectItem>
                          <SelectItem value="healthcare">Healthcare</SelectItem>
                          <SelectItem value="education">Education</SelectItem>
                          <SelectItem value="retail">Retail</SelectItem>
                          <SelectItem value="manufacturing">Manufacturing</SelectItem>
                          <SelectItem value="other">Other</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="companySize" className="text-gray-900 dark:text-white">Company Size</Label>
                      <Select onValueChange={(value) => handleInputChange('companySize', value)} required>
                        <SelectTrigger className="bg-gray-100 dark:bg-gray-700 border border-gray-300 dark:border-gray-600 text-gray-900 dark:text-white">
                          <SelectValue placeholder="Select size" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="1-10">1-10 employees</SelectItem>
                          <SelectItem value="11-50">11-50 employees</SelectItem>
                          <SelectItem value="51-200">51-200 employees</SelectItem>
                          <SelectItem value="201-1000">201-1000 employees</SelectItem>
                          <SelectItem value="1000+">1000+ employees</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="roleOffered" className="text-gray-900 dark:text-white">Primary Role You're Hiring For</Label>
                    <Input
                      id="roleOffered"
                      type="text"
                      placeholder="e.g., Software Engineer, Product Manager"
                      value={formData.roleOffered}
                      onChange={(e) => handleInputChange('roleOffered', e.target.value)}
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
                {loading ? 'Creating Account...' : 'Create Account'}
              </Button>
            </form>

            {/* Login Link */}
            <div className="text-center">
              <p className="text-sm text-gray-500 dark:text-gray-400">
                Already have an account?{' '}
                <Link to="/login" className="text-indigo-500 dark:text-indigo-400 hover:underline font-medium">
                  Sign in here
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