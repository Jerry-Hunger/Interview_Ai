import { Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import {
  ArrowRight,
  Building,
  Target,
  CheckCircle,
  Star,
  TrendingUp,
  Zap,
  FileText
} from 'lucide-react';

const features = [
  {
    icon: <Target className="text-indigo-500 dark:text-indigo-400" size={28} />,
    title: 'AI 模拟面试',
    description: '基于深度学习的智能面试官，模拟真实面试场景，提供个性化问题与即时评估反馈。',
  },
  {
    icon: <Building className="text-purple-500 dark:text-purple-400" size={28} />,
    title: '企业招聘',
    description: '企业可发布职位、管理候选人申请流程，AI 辅助筛选提升招聘效率。',
  },
  {
    icon: <TrendingUp className="text-green-500 dark:text-green-400" size={28} />,
    title: '实时反馈',
    description: '面试过程中 AI 实时分析回答质量，提供针对性建议和改进方向。',
  },
  {
    icon: <FileText className="text-amber-500 dark:text-amber-400" size={28} />,
    title: '简历分析',
    description: '智能解析简历内容，生成匹配职位要求的面试问题，精准评估候选人能力。',
  },
];

const testimonials = [
  {
    name: '张同学',
    role: '软件工程师 @ 科技公司',
    content: '使用 InterviewPro 后我成功拿到了梦想的 offer！AI 的反馈非常准确，帮助我改进了技术表达。',
    rating: 5,
  },
  {
    name: '李同学',
    role: '产品经理 @ 创业公司',
    content: '练习过程非常真实，正式面试时我充满信心和准备。',
    rating: 5,
  },
  {
    name: '王经理',
    role: 'HR总监 @ 云端科技',
    content: '作为企业方，InterviewPro 简化了我们的招聘流程，帮助我们更快找到优秀人才。',
    rating: 5,
  },
];

const Index = () => {

  return (
    <div className="min-h-screen bg-white dark:bg-[#101322]">
      <section className="relative overflow-hidden bg-gradient-to-br from-white to-indigo-50 dark:from-[#101322] dark:to-[#181A2A] py-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center space-y-8">
            <Badge variant="secondary" className="mb-4 bg-purple-100 dark:bg-purple-900 text-purple-700 dark:text-purple-300">
              <Zap size={14} className="mr-1" />
              AI 驱动的面试平台
            </Badge>
            <h1 className="text-4xl sm:text-5xl lg:text-6xl font-bold text-gray-900 dark:text-white">
              掌握您的下一次
              <span className="bg-gradient-to-r from-indigo-500 to-purple-500 dark:from-indigo-700 dark:to-purple-700 bg-clip-text text-transparent"> 面试</span>
            </h1>
            <p className="text-xl text-gray-600 dark:text-gray-400 max-w-3xl mx-auto">
              与 AI 一起练习，获取实时反馈，迈向您梦想的工作。加入成千上万通过 InterviewPro 提升面试技能的专业人士。
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center items-center">
              <Link to="/register">
                <Button size="lg" className="bg-gradient-to-r from-indigo-500 to-purple-500 dark:from-indigo-700 dark:to-purple-700 text-white hover:shadow-lg transition-all duration-300">
                  立即开始练习
                  <ArrowRight size={16} className="ml-2" />
                </Button>
              </Link>
              <Link to="/login">
                <Button variant="outline" size="lg" className="text-indigo-500 dark:text-indigo-400 border border-indigo-200 dark:border-indigo-700">
                  登录账户
                </Button>
              </Link>
            </div>
            <div className="flex items-center justify-center space-x-6 text-sm text-gray-500 dark:text-gray-400">
              <div className="flex items-center">
                <CheckCircle size={16} className="text-green-500 dark:text-green-400 mr-2" />
                免费使用
              </div>
              <div className="flex items-center">
                <CheckCircle size={16} className="text-green-500 dark:text-green-400 mr-2" />
                无需信用卡
              </div>
              <div className="flex items-center">
                <CheckCircle size={16} className="text-green-500 dark:text-green-400 mr-2" />
                实时反馈
              </div>
            </div>
          </div>
        </div>
        <div className="absolute top-0 left-0 w-full h-full overflow-hidden pointer-events-none">
          <div className="absolute top-20 left-10 w-20 h-20 bg-indigo-500/10 dark:bg-indigo-700/20 rounded-full blur-xl"></div>
          <div className="absolute top-40 right-20 w-32 h-32 bg-purple-500/10 dark:bg-purple-700/20 rounded-full blur-xl"></div>
          <div className="absolute bottom-20 left-1/4 w-24 h-24 bg-green-500/10 dark:bg-green-700/20 rounded-full blur-xl"></div>
        </div>
      </section>

      {/* 统计区域 */}
      <section className="py-16 bg-white dark:bg-[#101322]">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
            {[
              { value: '10,000+', label: '模拟面试次数' },
              { value: '500+', label: '合作企业' },
              { value: '95%', label: '用户满意度' },
              { value: '3x', label: '面试通过率提升' },
            ].map((stat, index) => (
              <div key={index} className="text-center">
                <div className="text-3xl lg:text-4xl font-bold bg-gradient-to-r from-indigo-500 to-purple-500 dark:from-indigo-400 dark:to-purple-400 bg-clip-text text-transparent">
                  {stat.value}
                </div>
                <div className="mt-2 text-sm text-gray-600 dark:text-gray-400">
                  {stat.label}
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="py-20 bg-gray-50 dark:bg-[#181A2A]">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-3xl lg:text-4xl font-bold text-gray-900 dark:text-white mb-4">
              迈向成功所需的一切
            </h2>
            <p className="text-xl text-gray-600 dark:text-gray-400 max-w-2xl mx-auto">
              我们提供所有工具和资源，帮助您在面试中脱颖而出
            </p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
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

      <section className="py-20 bg-white dark:bg-[#101322]">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-3xl lg:text-4xl font-bold text-gray-900 dark:text-white mb-4">
              全球专业人士的信赖之选
            </h2>
            <p className="text-xl text-gray-600 dark:text-gray-400">
              听听用户的使用体验
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

      <section className="py-20 bg-gradient-to-r from-indigo-500 to-purple-500 dark:from-indigo-700 dark:to-purple-700">
        <div className="max-w-4xl mx-auto text-center px-4 sm:px-6 lg:px-8">
          <h2 className="text-3xl lg:text-4xl font-bold text-white mb-6">
            准备好迎接下一次面试了吗？
          </h2>
          <p className="text-xl text-white/90 mb-8">
            加入成千上万通过 InterviewPro 提升面试技能、实现职业梦想的专业人士
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link to="/register">
              <Button
                size="lg"
                variant="secondary"
                className="bg-white text-indigo-600 hover:bg-indigo-100 shadow-lg font-semibold"
              >
                免费开始
                <ArrowRight size={16} className="ml-2" />
              </Button>
            </Link>
            <Link to="/login">
              <Button
                size="lg"
                className="bg-white/10 border-2 border-white/50 text-white hover:bg-white/20 hover:border-white font-semibold backdrop-blur-sm"
              >
                已有账户？登录
              </Button>
            </Link>
          </div>
        </div>
      </section>

      <footer className="bg-gray-50 dark:bg-[#181A2A] border-t border-gray-200 dark:border-gray-700 py-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center">
            <div className="flex items-center justify-center space-x-2 mb-4">
              <div className="w-8 h-8 bg-gradient-to-r from-indigo-500 to-purple-500 dark:from-indigo-700 dark:to-purple-700 rounded-lg flex items-center justify-center">
                <span className="text-white font-bold text-sm">IP</span>
              </div>
              <span className="font-bold text-xl text-indigo-700 dark:text-indigo-400">IntelliHire</span>
            </div>
            <p className="text-gray-600 dark:text-gray-400 mb-6">
              帮助专业人士在职业旅程中取得成功
            </p>
            <div className="flex justify-center space-x-6 text-sm text-gray-500 dark:text-gray-400">
              <a href="#" className="hover:text-indigo-600 dark:hover:text-indigo-400 transition-colors">隐私政策</a>
              <a href="#" className="hover:text-indigo-600 dark:hover:text-indigo-400 transition-colors">服务条款</a>
              <a href="#" className="hover:text-indigo-600 dark:hover:text-indigo-400 transition-colors">联系我们</a>
              <a href="#" className="hover:text-indigo-600 dark:hover:text-indigo-400 transition-colors">帮助中心</a>
            </div>
            <div className="mt-8 pt-8 border-t border-gray-200 dark:border-gray-700 text-xs text-gray-500 dark:text-gray-400">
              © {new Date().getFullYear()} IntelliHire. 保留所有权利。
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default Index;
