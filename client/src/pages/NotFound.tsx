import { Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Home, ArrowLeft } from 'lucide-react';

const NotFound = () => {
  return (
    <div className="min-h-screen bg-gradient-to-br from-background to-muted flex items-center justify-center p-4">
      <Card className="max-w-md w-full shadow-strong bg-gradient-card">
        <CardContent className="p-8 text-center space-y-6">
          <div className="relative">
            <div className="text-8xl font-bold text-primary/20">404</div>
            <div className="absolute inset-0 flex items-center justify-center">
              <div className="w-16 h-16 bg-gradient-primary rounded-full flex items-center justify-center shadow-glow">
                <span className="text-primary-foreground font-bold text-xl">!</span>
              </div>
            </div>
          </div>

          <div className="space-y-4">
            <h1 className="text-2xl font-bold text-foreground">页面未找到</h1>
            <p className="text-muted-foreground">
              抱歉，您访问的页面不存在。可能已被移动、删除，或您输入了错误的网址。
            </p>
          </div>

          <div className="space-y-3">
            <Button 
              asChild 
              className="w-full bg-gradient-primary hover:shadow-glow transition-all duration-300"
              size="lg"
            >
              <Link to="/">
                <Home size={16} className="mr-2" />
                返回首页
              </Link>
            </Button>
            
            <Button 
              variant="outline" 
              onClick={() => window.history.back()}
              className="w-full"
            >
              <ArrowLeft size={16} className="mr-2" />
              返回上页
            </Button>
          </div>

          <div className="pt-4 border-t border-border">
            <p className="text-sm text-muted-foreground">
              需要帮助？请联系我们的支持团队或查看我们的{' '}
              <Link to="/" className="text-primary hover:underline">
                帮助文档
              </Link>
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default NotFound;
