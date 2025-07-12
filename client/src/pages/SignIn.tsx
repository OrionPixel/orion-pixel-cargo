import { useRef, useEffect } from "react";
import { Link } from "wouter";
import { Button } from "@/components/ui/button";
import { Package, CheckCircle, Eye, EyeOff, ArrowLeft } from "lucide-react";
import { useAuth } from "@/hooks/use-auth";

export default function SignInPure() {
  const { user, loginMutation } = useAuth();
  
  // Scroll to top on page load
  useEffect(() => { window.scrollTo(0, 0); }, []);
  
  // Pure refs - no state management
  const emailRef = useRef<HTMLInputElement>(null);
  const passwordRef = useRef<HTMLInputElement>(null);
  const rememberRef = useRef<HTMLInputElement>(null);
  const showPasswordRef = useRef<boolean>(false);

  // Redirect if already authenticated
  if (user) {
    window.location.replace('/dashboard');
    return null;
  }

  // Load saved credentials on mount
  try {
    const savedCredentials = localStorage.getItem('savedCredentials');
    if (savedCredentials) {
      const { email, password, rememberMe } = JSON.parse(savedCredentials);
      // Set values directly without state updates
      setTimeout(() => {
        if (emailRef.current) emailRef.current.value = email || '';
        if (passwordRef.current) passwordRef.current.value = password || '';
        if (rememberRef.current) rememberRef.current.checked = rememberMe || false;
      }, 0);
    }
  } catch (error) {
    localStorage.removeItem('savedCredentials');
  }

  const onSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    const email = emailRef.current?.value || '';
    const password = passwordRef.current?.value || '';
    const rememberMe = rememberRef.current?.checked || false;
    
    console.log("📋 Pure login form submitted:", { email, password });
    
    // Save credentials if Remember Me is checked
    if (rememberMe) {
      const credentialsToSave = { email, password, rememberMe: true };
      localStorage.setItem('savedCredentials', JSON.stringify(credentialsToSave));
    } else {
      localStorage.removeItem('savedCredentials');
    }
    
    loginMutation.mutate({ email, password });
  };

  const togglePassword = () => {
    if (passwordRef.current) {
      showPasswordRef.current = !showPasswordRef.current;
      passwordRef.current.type = showPasswordRef.current ? 'text' : 'password';
      
      // Update icon without re-render
      const icon = passwordRef.current.parentElement?.querySelector('button svg');
      if (icon && icon.parentElement) {
        icon.parentElement.innerHTML = showPasswordRef.current 
          ? '<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M9.88 9.88a3 3 0 1 0 4.24 4.24"/><path d="m10.73 5.08-1.06 1.06a8 8 0 0 1 8.18 8.18l-1.06 1.06"/><path d="M6.61 6.61A13.526 13.526 0 0 0 2 12s3 7 10 7a9.74 9.74 0 0 0 5.39-1.61"/></svg>'
          : '<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M2 12s3-7 10-7 10 7 10 7-3 7-10 7-10-7-10-7Z"/><circle cx="12" cy="12" r="3"/></svg>';
      }
    }
  };

  return (
    <div className="min-h-screen flex">
      {/* Mobile-responsive Login Form */}
      <div className="flex-1 flex flex-col justify-center px-4 sm:px-6 md:px-8 py-8 md:py-12">
        <div className="w-full max-w-md mx-auto">
          {/* Back Button */}
          <div className="mb-4 md:mb-6">
            <Link href="/">
              <Button variant="ghost" size="sm" className="p-0 h-auto hover:bg-transparent">
                <ArrowLeft className="w-4 h-4 mr-2" />
                <span className="text-sm">Back to Home</span>
              </Button>
            </Link>
          </div>

          <div className="text-center mb-6 md:mb-8">
            <h1 className="text-2xl md:text-3xl font-bold text-foreground mb-2">
              Welcome Back
            </h1>
            <p className="text-sm md:text-base text-muted-foreground">
              Sign in to your LogiGoFast account to access your dashboard.
            </p>
          </div>

          <form onSubmit={onSubmit} className="space-y-4 md:space-y-6">
            <div className="space-y-2">
              <label htmlFor="email" className="text-sm font-medium text-foreground">
                Email Address
              </label>
              <input 
                ref={emailRef}
                id="email"
                type="email" 
                placeholder="Enter your email address"
                className="flex h-12 w-full rounded-md border border-input bg-background px-3 py-2 text-base ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                required
                style={{ fontSize: '16px' }} // Prevent zoom on iOS
              />
            </div>

            <div className="space-y-2">
              <label htmlFor="password" className="text-sm font-medium text-foreground">
                Password
              </label>
              <div className="relative">
                <input 
                  ref={passwordRef}
                  id="password"
                  type="password"
                  placeholder="Enter your password"
                  className="flex h-12 w-full rounded-md border border-input bg-background px-3 py-2 pr-12 text-base ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                  required
                  style={{ fontSize: '16px' }} // Prevent zoom on iOS
                />
                <button
                  type="button"
                  onClick={togglePassword}
                  className="absolute right-2 top-1/2 -translate-y-1/2 h-10 w-10 p-0 inline-flex items-center justify-center rounded-md text-sm font-medium ring-offset-background transition-colors hover:bg-accent hover:text-accent-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 touch-manipulation"
                >
                  <Eye className="w-4 h-4" />
                </button>
              </div>
            </div>

            <div className="flex items-center space-x-2">
              <input 
                ref={rememberRef}
                id="remember"
                type="checkbox"
                className="h-4 w-4 rounded border border-primary text-primary shadow focus:ring-2 focus:ring-ring focus:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
              />
              <label htmlFor="remember" className="text-sm text-foreground">
                Remember me
              </label>
            </div>

            <Button 
              type="submit"
              className="w-full h-12 text-white font-medium rounded-lg"
              style={{ backgroundColor: `hsl(var(--primary))` }}
              disabled={loginMutation.isPending}
            >
              {loginMutation.isPending ? "Signing in..." : "Sign In"}
            </Button>
          </form>

          <div className="mt-8 text-center">
            <p className="text-muted-foreground">
              Don't have an account?{" "}
              <Link href="/signup">
                <Button variant="link" className="text-primary hover:underline p-0 h-auto">
                  Sign up here
                </Button>
              </Link>
            </p>
          </div>
        </div>
      </div>
      
      {/* Visual separator - Hidden on mobile */}
      <div className="hidden lg:block w-px bg-border"></div>
      
      {/* Right section - Company Welcome Message - Hidden on mobile */}
      <div className="hidden lg:flex flex-1 flex-col justify-center p-8 xl:p-12 text-center">
        <div className="mb-8">
          <Package className="w-16 xl:w-20 h-16 xl:h-20 mx-auto mb-6 text-primary" />
          <h2 className="text-3xl xl:text-4xl font-bold mb-4 text-foreground">
            LogiGoFast
          </h2>
          <p className="text-lg xl:text-xl text-muted-foreground max-w-md mx-auto">
            India's leading logistics platform for seamless cargo management and tracking
          </p>
        </div>
        
        <div className="space-y-4 text-left max-w-sm mx-auto">
          <div className="flex items-center gap-3">
            <CheckCircle className="w-5 h-5 text-green-500" />
            <span className="text-foreground">Real-time GPS tracking</span>
          </div>
          <div className="flex items-center gap-3">
            <CheckCircle className="w-5 h-5 text-green-500" />
            <span className="text-foreground">24/7 customer support</span>
          </div>
          <div className="flex items-center gap-3">
            <CheckCircle className="w-5 h-5 text-green-500" />
            <span className="text-foreground">Secure payment gateway</span>
          </div>
          <div className="flex items-center gap-3">
            <CheckCircle className="w-5 h-5 text-green-500" />
            <span className="text-foreground">Pan-India delivery network</span>
          </div>
        </div>
      </div>
    </div>
  );
}