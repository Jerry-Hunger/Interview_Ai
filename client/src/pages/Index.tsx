import { Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { 
  ArrowRight, 
  Users, 
  Building, 
  Target, 
  CheckCircle, 
  Star, 
  TrendingUp,
  Zap,
  Shield,
  Globe
} from 'lucide-react';

const Index = () => {
  const features = [
    {
      icon: <Target className="text-indigo-500 dark:text-indigo-400" size={24} />,
      title: 'AI-Powered Practice',
      description: 'Get personalized interview questions and real-time feedback from our advanced AI system.',
    },
    {
      icon: <Users className="text-purple-500 dark:text-purple-400" size={24} />,
      title: 'Role-Specific Training',
      description: 'Practice with questions tailored to your specific role and industry requirements.',
    },
    {
      icon: <TrendingUp className="text-green-500 dark:text-green-400" size={24} />,
      title: 'Performance Analytics',
      description: 'Track your progress with detailed analytics and improvement suggestions.',
    },
    {
      icon: <Building className="text-yellow-500 dark:text-yellow-400" size={24} />,
      title: 'Company Integration',
      description: 'Connect with top companies and streamline your recruitment process.',
    },
    {
      icon: <Shield className="text-indigo-500 dark:text-indigo-400" size={24} />,
      title: 'Secure & Private',
      description: 'Your data is protected with enterprise-grade security and privacy measures.',
    },
    {
      icon: <Globe className="text-purple-500 dark:text-purple-400" size={24} />,
      title: 'Global Network',
      description: 'Access opportunities from companies worldwide in our growing network.',
    },
  ];

  const testimonials = [
    {
      name: 'Sarah Johnson',
      role: 'Software Engineer at TechCorp',
      content: 'InterviewPro helped me land my dream job! The AI feedback was incredibly accurate and helped me improve my technical communication.',
      rating: 5,
    },
    {
      name: 'Mike Chen',
      role: 'Product Manager at StartupX',
      content: 'The practice sessions felt so real. I went into my actual interviews feeling confident and prepared.',
      rating: 5,
    },
    {
      name: 'Emily Davis',
      role: 'HR Director at CloudTech',
      content: 'As a company, InterviewPro streamlined our hiring process and helped us find better candidates faster.',
      rating: 5,
    },
  ];

  return (
    <div className="min-h-screen bg-white dark:bg-[#101322]">
      {/* Navigation */}
      <nav className="bg-white dark:bg-[#181A2A] border-b border-gray-200 dark:border-gray-700 shadow">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center space-x-2">
              <div className="w-8 h-8 bg-gradient-to-r from-indigo-500 to-purple-500 dark:from-indigo-700 dark:to-purple-700 rounded-lg flex items-center justify-center">
                <span className="text-white font-bold text-sm">IP</span>
              </div>
              <span className="font-bold text-xl text-indigo-700 dark:text-indigo-300">InterviewPro</span>
            </div>
            <div className="flex items-center space-x-4">
              <Link to="/login">
                <Button variant="ghost" className="text-indigo-500 dark:text-indigo-400">Sign In</Button>
              </Link>
              <Link to="/register">
                <Button className="bg-gradient-to-r from-indigo-500 to-purple-500 dark:from-indigo-700 dark:to-purple-700 text-white hover:shadow-lg">Get Started</Button>
              </Link>
            </div>
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="relative overflow-hidden bg-gradient-to-br from-white to-indigo-50 dark:from-[#101322] dark:to-[#181A2A] py-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center space-y-8">
            <Badge variant="secondary" className="mb-4 bg-purple-100 dark:bg-purple-900 text-purple-700 dark:text-purple-300">
              <Zap size={14} className="mr-1" />
              AI-Powered Interview Platform
            </Badge>
            <h1 className="text-4xl sm:text-5xl lg:text-6xl font-bold text-gray-900 dark:text-white">
              Master Your Next
              <span className="bg-gradient-to-r from-indigo-500 to-purple-500 dark:from-indigo-700 dark:to-purple-700 bg-clip-text text-transparent"> Interview</span>
            </h1>
            <p className="text-xl text-gray-600 dark:text-gray-400 max-w-3xl mx-auto">
              Practice with AI, get real-time feedback, and land your dream job. 
              Join thousands of professionals who've improved their interview skills with InterviewPro.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center items-center">
              <Link to="/register">
                <Button size="lg" className="bg-gradient-to-r from-indigo-500 to-purple-500 dark:from-indigo-700 dark:to-purple-700 text-white hover:shadow-lg transition-all duration-300">
                  Start Practicing Now
                  <ArrowRight size={16} className="ml-2" />
                </Button>
              </Link>
              <Link to="/login">
                <Button variant="outline" size="lg" className="text-indigo-500 dark:text-indigo-400 border border-indigo-200 dark:border-indigo-700">
                  Sign In to Your Account
                </Button>
              </Link>
            </div>
            <div className="flex items-center justify-center space-x-6 text-sm text-gray-500 dark:text-gray-400">
              <div className="flex items-center">
                <CheckCircle size={16} className="text-green-500 dark:text-green-400 mr-2" />
                Free to start
              </div>
              <div className="flex items-center">
                <CheckCircle size={16} className="text-green-500 dark:text-green-400 mr-2" />
                No credit card required
              </div>
              <div className="flex items-center">
                <CheckCircle size={16} className="text-green-500 dark:text-green-400 mr-2" />
                Instant feedback
              </div>
            </div>
          </div>
        </div>
        {/* Background decorations */}
        <div className="absolute top-0 left-0 w-full h-full overflow-hidden pointer-events-none">
          <div className="absolute top-20 left-10 w-20 h-20 bg-indigo-500/10 dark:bg-indigo-700/20 rounded-full blur-xl"></div>
          <div className="absolute top-40 right-20 w-32 h-32 bg-purple-500/10 dark:bg-purple-700/20 rounded-full blur-xl"></div>
          <div className="absolute bottom-20 left-1/4 w-24 h-24 bg-green-500/10 dark:bg-green-700/20 rounded-full blur-xl"></div>
        </div>
      </section>

      {/* Features Section */}
      <section className="py-20 bg-white dark:bg-[#181A2A]">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-3xl lg:text-4xl font-bold text-gray-900 dark:text-white mb-4">
              Everything You Need to Succeed
            </h2>
            <p className="text-xl text-gray-600 dark:text-gray-400 max-w-2xl mx-auto">
              Our comprehensive platform provides all the tools and resources you need to ace your interviews
            </p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {features.map((feature, index) => (
              <Card key={index} className="shadow-lg hover:shadow-xl transition-all duration-300 bg-white dark:bg-[#23263A]">
                <CardHeader>
                  <div className="flex items-center gap-3">
                    <div className="p-2 bg-indigo-100 dark:bg-indigo-900 rounded-lg">
                      {feature.icon}
                    </div>
                    <CardTitle className="text-lg text-gray-900 dark:text-white">{feature.title}</CardTitle>
                  </div>
                </CardHeader>
                <CardContent>
                  <CardDescription className="text-base text-gray-600 dark:text-gray-400">
                    {feature.description}
                  </CardDescription>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* Testimonials */}
      <section className="py-20 bg-white dark:bg-[#101322]">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-3xl lg:text-4xl font-bold text-gray-900 dark:text-white mb-4">
              Trusted by Professionals Worldwide
            </h2>
            <p className="text-xl text-gray-600 dark:text-gray-400">
              See what our users have to say about their experience
            </p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {testimonials.map((testimonial, index) => (
              <Card key={index} className="shadow-lg bg-white dark:bg-[#23263A]">
                <CardContent className="p-6">
                  <div className="flex items-center mb-4">
                    {[...Array(testimonial.rating)].map((_, i) => (
                      <Star key={i} className="text-yellow-500 dark:text-yellow-400 fill-current" size={16} />
                    ))}
                  </div>
                  <p className="text-gray-600 dark:text-gray-400 mb-4">"{testimonial.content}"</p>
                  <div>
                    <p className="font-medium text-gray-900 dark:text-white">{testimonial.name}</p>
                    <p className="text-sm text-gray-500 dark:text-gray-400">{testimonial.role}</p>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20 bg-gradient-to-r from-indigo-500 to-purple-500 dark:from-indigo-700 dark:to-purple-700">
        <div className="max-w-4xl mx-auto text-center px-4 sm:px-6 lg:px-8">
          <h2 className="text-3xl lg:text-4xl font-bold text-white mb-6">
            Ready to Ace Your Next Interview?
          </h2>
          <p className="text-xl text-white/90 mb-8">
            Join thousands of professionals who have improved their interview skills and landed their dream jobs
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link to="/register">
              <Button 
                size="lg" 
                variant="secondary"
                className="bg-white text-indigo-600 dark:bg-[#23263A] dark:text-indigo-400 hover:bg-indigo-100 dark:hover:bg-indigo-900 shadow-lg"
              >
                Get Started for Free
                <ArrowRight size={16} className="ml-2" />
              </Button>
            </Link>
            <Link to="/login">
              <Button 
                size="lg" 
                variant="outline"
                className="border-white text-white hover:bg-white/10"
              >
                Already have an account?
              </Button>
            </Link>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-white dark:bg-[#181A2A] border-t border-gray-200 dark:border-gray-700 py-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center">
            <div className="flex items-center justify-center space-x-2 mb-4">
              <div className="w-8 h-8 bg-gradient-to-r from-indigo-500 to-purple-500 dark:from-indigo-700 dark:to-purple-700 rounded-lg flex items-center justify-center">
                <span className="text-white font-bold text-sm">IP</span>
              </div>
              <span className="font-bold text-xl text-indigo-700 dark:text-indigo-300">InterviewPro</span>
            </div>
            <p className="text-gray-600 dark:text-gray-400 mb-6">
              Empowering professionals to succeed in their career journey
            </p>
            <div className="flex justify-center space-x-6 text-sm text-gray-500 dark:text-gray-400">
              <a href="#" className="hover:text-indigo-700 dark:hover:text-indigo-400 transition-colors">Privacy Policy</a>
              <a href="#" className="hover:text-indigo-700 dark:hover:text-indigo-400 transition-colors">Terms of Service</a>
              <a href="#" className="hover:text-indigo-700 dark:hover:text-indigo-400 transition-colors">Contact</a>
              <a href="#" className="hover:text-indigo-700 dark:hover:text-indigo-400 transition-colors">Help</a>
            </div>
            <div className="mt-8 pt-8 border-t border-gray-200 dark:border-gray-700 text-xs text-gray-500 dark:text-gray-400">
              © 2024 InterviewPro. All rights reserved.
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default Index;
