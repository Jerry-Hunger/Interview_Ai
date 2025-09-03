import { Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Home, ArrowLeft } from 'lucide-react';

const NotFound = () => {
  return (
    <div className="min-h-screen bg-gradient-to-br from-background to-muted flex items-center justify-center p-4">
      <Card className="max-w-md w-full shadow-strong bg-gradient-card">
        <CardContent className="p-8 text-center space-y-6">
          {/* 404 Illustration */}
          <div className="relative">
            <div className="text-8xl font-bold text-primary/20">404</div>
            <div className="absolute inset-0 flex items-center justify-center">
              <div className="w-16 h-16 bg-gradient-primary rounded-full flex items-center justify-center shadow-glow">
                <span className="text-primary-foreground font-bold text-xl">!</span>
              </div>
            </div>
          </div>

          {/* Content */}
          <div className="space-y-4">
            <h1 className="text-2xl font-bold text-foreground">Page Not Found</h1>
            <p className="text-muted-foreground">
              Oops! The page you're looking for doesn't exist. It might have been moved, deleted, or you entered the wrong URL.
            </p>
          </div>

          {/* Actions */}
          <div className="space-y-3">
            <Button 
              asChild 
              className="w-full bg-gradient-primary hover:shadow-glow transition-all duration-300"
              size="lg"
            >
              <Link to="/">
                <Home size={16} className="mr-2" />
                Go to Home
              </Link>
            </Button>
            
            <Button 
              variant="outline" 
              onClick={() => window.history.back()}
              className="w-full"
            >
              <ArrowLeft size={16} className="mr-2" />
              Go Back
            </Button>
          </div>

          {/* Help */}
          <div className="pt-4 border-t border-border">
            <p className="text-sm text-muted-foreground">
              Need help? Contact our support team or check our{' '}
              <Link to="/" className="text-primary hover:underline">
                documentation
              </Link>
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default NotFound;