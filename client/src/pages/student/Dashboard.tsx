import { useState } from 'react';
import { Link } from 'react-router-dom';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import Navigation from '@/components/Navigation';
import { 
  Upload, 
  Target, 
  Building, 
  TrendingUp, 
  Clock, 
  CheckCircle, 
  XCircle, 
  AlertCircle,
  Play,
  Eye,
  Calendar
} from 'lucide-react';

const StudentDashboard = () => {
  const [resumeUploaded] = useState(true);

  const mockApplications = [
    { id: 1, company: 'TechCorp', role: 'Frontend Developer', status: 'pending', appliedDate: '2024-01-15' },
    { id: 2, company: 'DataSys', role: 'Full Stack Engineer', status: 'interview', appliedDate: '2024-01-12' },
    { id: 3, company: 'CloudTech', role: 'React Developer', status: 'rejected', appliedDate: '2024-01-10' },
    { id: 4, company: 'StartupX', role: 'Software Engineer', status: 'accepted', appliedDate: '2024-01-08' },
  ];

  const mockPracticeResults = [
    { id: 1, role: 'Frontend Developer', score: 85, date: '2024-01-14', feedback: 'Great technical answers, improve communication' },
    { id: 2, role: 'Backend Engineer', score: 78, date: '2024-01-12', feedback: 'Strong problem solving, work on system design' },
    { id: 3, role: 'Full Stack Developer', score: 92, date: '2024-01-10', feedback: 'Excellent performance across all areas' },
  ];

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'accepted': return 'success';
      case 'rejected': return 'destructive';
      case 'interview': return 'warning';
      default: return 'secondary';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'accepted': return <CheckCircle size={16} />;
      case 'rejected': return <XCircle size={16} />;
      case 'interview': return <AlertCircle size={16} />;
      default: return <Clock size={16} />;
    }
  };

  return (
    <div className="min-h-screen bg-white dark:bg-[#101322]">
      <Navigation />
      
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">Student Dashboard</h1>
          <p className="text-gray-500 dark:text-gray-400">Track your progress and manage your interview journey</p>
        </div>

        {/* Quick Stats */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          <Card className="bg-white dark:bg-[#181A2A] shadow-lg border-0 rounded-xl">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-indigo-500 dark:text-indigo-400 text-sm">Total Applications</p>
                  <p className="text-2xl font-bold text-gray-900 dark:text-white">{mockApplications.length}</p>
                </div>
                <Building className="text-indigo-500 dark:text-indigo-400" size={24} />
              </div>
            </CardContent>
          </Card>

          <Card className="bg-white dark:bg-[#181A2A] shadow-lg border-0 rounded-xl">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-purple-500 dark:text-purple-400 text-sm">Practice Sessions</p>
                  <p className="text-2xl font-bold text-gray-900 dark:text-white">{mockPracticeResults.length}</p>
                </div>
                <Target className="text-purple-500 dark:text-purple-400" size={24} />
              </div>
            </CardContent>
          </Card>

          <Card className="bg-white dark:bg-[#181A2A] shadow-lg border-0 rounded-xl">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-green-500 dark:text-green-400 text-sm">Average Score</p>
                  <p className="text-2xl font-bold text-gray-900 dark:text-white">
                    {Math.round(mockPracticeResults.reduce((acc, result) => acc + result.score, 0) / mockPracticeResults.length)}%
                  </p>
                </div>
                <TrendingUp className="text-green-500 dark:text-green-400" size={24} />
              </div>
            </CardContent>
          </Card>

          <Card className="bg-white dark:bg-[#181A2A] shadow-lg border-0 rounded-xl">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-yellow-500 dark:text-yellow-400 text-sm">Interview Ready</p>
                  <p className="text-2xl font-bold text-green-500 dark:text-green-400">{resumeUploaded ? 'Yes' : 'No'}</p>
                </div>
                <CheckCircle className="text-green-500 dark:text-green-400" size={24} />
              </div>
            </CardContent>
          </Card>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Resume Status */}
          <Card className="shadow-lg bg-white dark:bg-[#181A2A] border-0 rounded-xl">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-indigo-500 dark:text-indigo-400">
                <Upload size={20} />
                Resume Status
              </CardTitle>
              <CardDescription className="text-gray-500 dark:text-gray-400">
                Upload and manage your resume for applications
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {resumeUploaded ? (
                <div className="flex items-center justify-between p-4 bg-green-50 dark:bg-green-900 rounded-lg border border-green-200 dark:border-green-700">
                  <div className="flex items-center gap-3">
                    <CheckCircle className="text-green-500 dark:text-green-400" size={20} />
                    <div>
                      <p className="font-medium text-green-500 dark:text-green-400">Resume Uploaded</p>
                      <p className="text-sm text-gray-500 dark:text-gray-400">john_doe_resume.pdf</p>
                    </div>
                  </div>
                  <Button variant="outline" size="sm" className="text-indigo-500 dark:text-indigo-400 border border-indigo-200 dark:border-indigo-700">
                    <Eye size={16} className="mr-2" />
                    View
                  </Button>
                </div>
              ) : (
                <div className="border-2 border-dashed border-gray-300 dark:border-gray-700 rounded-lg p-6 text-center">
                  <Upload className="mx-auto text-gray-400 dark:text-gray-500 mb-2" size={32} />
                  <p className="text-gray-500 dark:text-gray-400 mb-4">No resume uploaded</p>
                  <Button className="bg-gradient-to-r from-indigo-500 to-purple-500 dark:from-indigo-700 dark:to-purple-700 text-white">Upload Resume</Button>
                </div>
              )}
              
              <div className="space-y-2">
                <p className="text-sm font-medium text-gray-900 dark:text-white">Profile Completion</p>
                <Progress value={85} className="w-full bg-indigo-200 dark:bg-indigo-900" />
                <p className="text-xs text-gray-500 dark:text-gray-400">85% complete - Add skills to reach 100%</p>
              </div>
            </CardContent>
          </Card>

          {/* Practice Interview Results */}
          <Card className="shadow-lg bg-white dark:bg-[#181A2A] border-0 rounded-xl">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-purple-500 dark:text-purple-400">
                <Target size={20} />
                Practice Results
              </CardTitle>
              <CardDescription className="text-gray-500 dark:text-gray-400">
                Your recent interview practice sessions
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {mockPracticeResults.slice(0, 3).map((result) => (
                  <div key={result.id} className="flex items-center justify-between p-3 bg-indigo-50 dark:bg-[#23263A] rounded-lg">
                    <div className="flex-1">
                      <p className="font-medium text-sm text-gray-900 dark:text-white">{result.role}</p>
                      <p className="text-xs text-gray-500 dark:text-gray-400">{result.date}</p>
                      <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">{result.feedback}</p>
                    </div>
                    <div className="text-right">
                      <span className={`text-lg font-bold ${
                        result.score >= 90 ? 'text-green-500 dark:text-green-400' : 
                        result.score >= 70 ? 'text-yellow-500 dark:text-yellow-400' : 'text-red-500 dark:text-red-400'
                      }`}>
                        {result.score}%
                      </span>
                    </div>
                  </div>
                ))}
                
                <Link to="/student/practice">
                  <Button variant="outline" className="w-full mt-4 text-indigo-500 dark:text-indigo-400 border border-indigo-200 dark:border-indigo-700">
                    <Play size={16} className="mr-2" />
                    Start New Practice
                  </Button>
                </Link>
              </div>
            </CardContent>
          </Card>

          {/* Company Applications */}
          <Card className="shadow-lg bg-white dark:bg-[#181A2A] border-0 rounded-xl">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-indigo-500 dark:text-indigo-400">
                <Building size={20} />
                Applications
              </CardTitle>
              <CardDescription className="text-gray-500 dark:text-gray-400">
                Track your job applications and their status
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {mockApplications.slice(0, 4).map((app) => (
                  <div key={app.id} className="flex items-center justify-between p-3 bg-indigo-50 dark:bg-[#23263A] rounded-lg">
                    <div className="flex-1">
                      <p className="font-medium text-sm text-gray-900 dark:text-white">{app.company}</p>
                      <p className="text-xs text-gray-500 dark:text-gray-400">{app.role}</p>
                      <p className="text-xs text-gray-500 dark:text-gray-400 flex items-center gap-1 mt-1">
                        <Calendar size={12} />
                        {app.appliedDate}
                      </p>
                    </div>
                    <Badge variant={getStatusColor(app.status) as any} className="flex items-center gap-1">
                      {getStatusIcon(app.status)}
                      {app.status}
                    </Badge>
                  </div>
                ))}
                
                <Link to="/student/companies">
                  <Button variant="outline" className="w-full mt-4 text-indigo-500 dark:text-indigo-400 border border-indigo-200 dark:border-indigo-700">
                    Explore More Companies
                  </Button>
                </Link>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Quick Actions */}
        <div className="mt-8">
          <Card className="shadow-lg bg-white dark:bg-[#181A2A] border-0 rounded-xl">
            <CardHeader>
              <CardTitle className="text-indigo-500 dark:text-indigo-400">Quick Actions</CardTitle>
              <CardDescription className="text-gray-500 dark:text-gray-400">Jump into your most common tasks</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <Link to="/student/practice">
                  <Button className="w-full h-16 bg-gradient-to-r from-indigo-500 to-purple-500 dark:from-indigo-700 dark:to-purple-700 text-white font-semibold hover:shadow-lg transition-all duration-300">
                    <div className="text-center">
                      <Play className="mx-auto mb-1" size={20} />
                      <span className="block">Start Practice Interview</span>
                    </div>
                  </Button>
                </Link>
                
                <Link to="/student/companies">
                  <Button variant="outline" className="w-full h-16 text-indigo-500 dark:text-indigo-400 border border-indigo-200 dark:border-indigo-700">
                    <div className="text-center">
                      <Building className="mx-auto mb-1" size={20} />
                      <span className="block">Browse Companies</span>
                    </div>
                  </Button>
                </Link>
                
                <Button variant="outline" className="w-full h-16 text-purple-500 dark:text-purple-400 border border-purple-200 dark:border-purple-700">
                  <div className="text-center">
                    <Upload className="mx-auto mb-1" size={20} />
                    <span className="block">Update Resume</span>
                  </div>
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
};

export default StudentDashboard;