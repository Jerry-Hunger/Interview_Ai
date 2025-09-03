import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import Navigation from '@/components/Navigation';
import { 
  Users, 
  TrendingUp, 
  Clock, 
  CheckCircle, 
  XCircle, 
  AlertCircle,
  Filter,
  Download,
  Eye,
  Settings,
  Calendar,
  BarChart3
} from 'lucide-react';

const CompanyDashboard = () => {
  const [applicants] = useState([
    { id: 1, name: 'John Doe', role: 'Frontend Developer', resumeLink: '#', status: 'pending', appliedDate: '2024-01-15', score: null, experience: '3 years' },
    { id: 2, name: 'Sarah Johnson', role: 'Backend Engineer', resumeLink: '#', status: 'interview', appliedDate: '2024-01-14', score: 85, experience: '5 years' },
    { id: 3, name: 'Mike Chen', role: 'Full Stack Developer', resumeLink: '#', status: 'accepted', appliedDate: '2024-01-12', score: 92, experience: '4 years' },
    { id: 4, name: 'Emily Davis', role: 'React Developer', resumeLink: '#', status: 'rejected', appliedDate: '2024-01-10', score: 65, experience: '2 years' },
  ]);

  const stats = {
    totalApplications: applicants.length,
    pending: applicants.filter(a => a.status === 'pending').length,
    inInterview: applicants.filter(a => a.status === 'interview').length,
    accepted: applicants.filter(a => a.status === 'accepted').length,
    rejected: applicants.filter(a => a.status === 'rejected').length,
  };

  const conversionRate = Math.round((stats.accepted / stats.totalApplications) * 100);

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
        <div className="mb-8 text-center">
          <h1 className="text-4xl font-bold text-gray-900 dark:text-white mb-2">Company Dashboard</h1>
          <p className="text-lg text-gray-500 dark:text-gray-400">Manage your recruitment process and track applicant progress</p>
        </div>

        {/* Stats Overview */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <Card className="bg-white dark:bg-[#181A2A] shadow-lg border-0 rounded-xl">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-indigo-500 dark:text-indigo-400 text-sm">Total Applicants</p>
                  <p className="text-3xl font-bold text-gray-900 dark:text-white">{stats.totalApplications}</p>
                </div>
                <Users className="text-indigo-500 dark:text-indigo-400" size={28} />
              </div>
            </CardContent>
          </Card>

          <Card className="bg-white dark:bg-[#181A2A] shadow-lg border-0 rounded-xl">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-yellow-500 dark:text-yellow-400 text-sm">In Interview</p>
                  <p className="text-3xl font-bold text-gray-900 dark:text-white">{stats.inInterview}</p>
                </div>
                <AlertCircle className="text-yellow-500 dark:text-yellow-400" size={28} />
              </div>
            </CardContent>
          </Card>

          <Card className="bg-white dark:bg-[#181A2A] shadow-lg border-0 rounded-xl">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-green-500 dark:text-green-400 text-sm">Accepted</p>
                  <p className="text-3xl font-bold text-gray-900 dark:text-white">{stats.accepted}</p>
                </div>
                <CheckCircle className="text-green-500 dark:text-green-400" size={28} />
              </div>
            </CardContent>
          </Card>

          <Card className="bg-white dark:bg-[#181A2A] shadow-lg border-0 rounded-xl">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-purple-500 dark:text-purple-400 text-sm">Conversion Rate</p>
                  <p className="text-3xl font-bold text-gray-900 dark:text-white">{conversionRate}%</p>
                </div>
                <TrendingUp className="text-purple-500 dark:text-purple-400" size={28} />
              </div>
            </CardContent>
          </Card>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Conversion Funnel */}
          <Card className="shadow-lg bg-white dark:bg-[#181A2A] border-0 rounded-xl">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-indigo-500 dark:text-indigo-400">
                <BarChart3 size={22} />
                Recruitment Funnel
              </CardTitle>
              <CardDescription className="text-gray-500 dark:text-gray-400">
                Track your hiring process efficiency
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-3">
                <div className="flex justify-between items-center">
                  <span className="text-sm text-gray-500 dark:text-gray-400">Applications Received</span>
                  <span className="font-medium">{stats.totalApplications}</span>
                </div>
                <Progress value={100} className="w-full bg-indigo-200 dark:bg-indigo-900" />
              </div>

              <div className="space-y-3">
                <div className="flex justify-between items-center">
                  <span className="text-sm text-gray-500 dark:text-gray-400">In Interview Process</span>
                  <span className="font-medium">{stats.inInterview}</span>
                </div>
                <Progress value={(stats.inInterview / stats.totalApplications) * 100} className="w-full bg-purple-200 dark:bg-purple-900" />
              </div>

              <div className="space-y-3">
                <div className="flex justify-between items-center">
                  <span className="text-sm text-gray-500 dark:text-gray-400">Final Acceptance</span>
                  <span className="font-medium">{stats.accepted}</span>
                </div>
                <Progress value={conversionRate} className="w-full bg-green-200 dark:bg-green-900" />
              </div>

              <div className="pt-4 border-t border-gray-200 dark:border-gray-700">
                <div className="flex justify-between items-center">
                  <span className="text-sm font-medium">Overall Conversion</span>
                  <span className="text-lg font-bold text-green-500 dark:text-green-400">{conversionRate}%</span>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Recent Activity */}
          <Card className="shadow-lg bg-white dark:bg-[#181A2A] border-0 rounded-xl">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-purple-500 dark:text-purple-400">
                <Clock size={22} />
                Recent Activity
              </CardTitle>
              <CardDescription className="text-gray-500 dark:text-gray-400">
                Latest updates in your recruitment process
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="flex items-start gap-3 p-3 bg-indigo-50 dark:bg-[#23263A] rounded-lg">
                  <CheckCircle className="text-green-500 dark:text-green-400 mt-0.5" size={16} />
                  <div className="flex-1">
                    <p className="text-sm font-medium text-gray-900 dark:text-white">Mike Chen accepted offer</p>
                    <p className="text-xs text-gray-500 dark:text-gray-400">Full Stack Developer • 2 hours ago</p>
                  </div>
                </div>

                <div className="flex items-start gap-3 p-3 bg-yellow-50 dark:bg-[#23263A] rounded-lg">
                  <AlertCircle className="text-yellow-500 dark:text-yellow-400 mt-0.5" size={16} />
                  <div className="flex-1">
                    <p className="text-sm font-medium text-gray-900 dark:text-white">Sarah Johnson interview scheduled</p>
                    <p className="text-xs text-gray-500 dark:text-gray-400">Backend Engineer • 4 hours ago</p>
                  </div>
                </div>

                <div className="flex items-start gap-3 p-3 bg-indigo-50 dark:bg-[#23263A] rounded-lg">
                  <Users className="text-indigo-500 dark:text-indigo-400 mt-0.5" size={16} />
                  <div className="flex-1">
                    <p className="text-sm font-medium text-gray-900 dark:text-white">3 new applications received</p>
                    <p className="text-xs text-gray-500 dark:text-gray-400">Various positions • Yesterday</p>
                  </div>
                </div>

                <div className="flex items-start gap-3 p-3 bg-red-50 dark:bg-[#23263A] rounded-lg">
                  <XCircle className="text-red-500 dark:text-red-400 mt-0.5" size={16} />
                  <div className="flex-1">
                    <p className="text-sm font-medium text-gray-900 dark:text-white">Emily Davis application declined</p>
                    <p className="text-xs text-gray-500 dark:text-gray-400">React Developer • 2 days ago</p>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Quick Actions */}
          <Card className="shadow-lg bg-white dark:bg-[#181A2A] border-0 rounded-xl">
            <CardHeader>
              <CardTitle className="text-indigo-500 dark:text-indigo-400">Quick Actions</CardTitle>
              <CardDescription className="text-gray-500 dark:text-gray-400">
                Common tasks and shortcuts
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-3">
              <Button className="w-full justify-start bg-gradient-to-r from-indigo-500 to-purple-500 dark:from-indigo-700 dark:to-purple-700 text-white font-semibold hover:shadow-lg">
                <Settings size={16} className="mr-2" />
                Setup Interview Process
              </Button>
              
              <Button variant="outline" className="w-full justify-start text-white dark:text-white border border-gray-700 bg-[#23263A] dark:bg-[#23263A]">
                <Download size={16} className="mr-2" />
                Export Applicant Data
              </Button>
              
              <Button variant="outline" className="w-full justify-start text-white dark:text-white border border-gray-700 bg-[#23263A] dark:bg-[#23263A]">
                <Filter size={16} className="mr-2" />
                Advanced Filters
              </Button>
              
              <Button variant="outline" className="w-full justify-start text-white dark:text-white border border-gray-700 bg-[#23263A] dark:bg-[#23263A]">
                <BarChart3 size={16} className="mr-2" />
                View Analytics
              </Button>
            </CardContent>
          </Card>
        </div>

        {/* Applicants Table */}
        <Card className="mt-8 shadow-lg bg-white dark:bg-[#181A2A] border-0 rounded-xl">
          <CardHeader>
            <div className="flex justify-between items-center">
              <div>
                <CardTitle className="flex items-center gap-2 text-indigo-500 dark:text-indigo-400">
                  <Users size={20} />
                  Applicant Management
                </CardTitle>
                <CardDescription className="text-gray-500 dark:text-gray-400">
                  Review and manage all job applications
                </CardDescription>
              </div>
              <div className="flex gap-2">
                <Button variant="outline" size="sm" className="text-white dark:text-white border border-gray-700 bg-[#23263A] dark:bg-[#23263A]">
                  <Filter size={16} className="mr-2" />
                  Filter
                </Button>
                <Button variant="outline" size="sm" className="text-white dark:text-white border border-gray-700 bg-[#23263A] dark:bg-[#23263A]">
                  <Download size={16} className="mr-2" />
                  Export
                </Button>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {applicants.map((applicant) => (
                <div key={applicant.id} className="flex items-center justify-between p-4 bg-[#23263A] dark:bg-[#23263A] rounded-lg border border-gray-700">
                  <div className="flex-1 grid grid-cols-1 md:grid-cols-5 gap-4 items-center">
                    <div>
                      <p className="font-medium text-white">{applicant.name}</p>
                      <p className="text-sm text-gray-400">{applicant.role}</p>
                    </div>
                    
                    <div>
                      <p className="text-sm text-gray-400">Experience</p>
                      <p className="font-medium text-white">{applicant.experience}</p>
                    </div>
                    
                    <div>
                      <p className="text-sm text-gray-400">Applied</p>
                      <p className="text-sm font-medium flex items-center gap-1 text-white">
                        <Calendar size={12} />
                        {applicant.appliedDate}
                      </p>
                    </div>
                    
                    <div>
                      <p className="text-sm text-gray-400">Score</p>
                      <p className="font-medium text-white">
                        {applicant.score ? `${applicant.score}%` : 'Pending'}
                      </p>
                    </div>
                    
                    <div className="flex items-center gap-2">
                      <Badge variant={getStatusColor(applicant.status) as any} className="flex items-center gap-1">
                        {getStatusIcon(applicant.status)}
                        {applicant.status}
                      </Badge>
                    </div>
                  </div>
                  
                  <div className="flex items-center gap-2 ml-4">
                    <Button variant="outline" size="sm" className="text-white border border-gray-700 bg-[#23263A]">
                      <Eye size={14} className="mr-1" />
                      Resume
                    </Button>
                    <Button variant="outline" size="sm" className="text-white border border-gray-700 bg-[#23263A]">
                      Actions
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default CompanyDashboard;