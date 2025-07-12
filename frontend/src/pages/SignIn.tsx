import { useState, useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Link } from "wouter";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Checkbox } from "@/components/ui/checkbox";
import { Eye, EyeOff, ArrowLeft } from "lucide-react";
import { useAuth } from "@/hooks/use-auth";

const loginSchema = z.object({
  email: z.string().email("Please enter a valid email address"),
  password: z.string().min(6, "Password must be at least 6 characters"),
});

const registerSchema = z.object({
  email: z.string().email("Please enter a valid email address"),
  password: z.string().min(6, "Password must be at least 6 characters"),
  confirmPassword: z.string().min(6, "Password must be at least 6 characters"),
  firstName: z.string().min(2, "First name must be at least 2 characters"),
  lastName: z.string().min(2, "Last name must be at least 2 characters"),
  phone: z.string().min(10, "Mobile number must be at least 10 digits").max(15, "Mobile number cannot exceed 15 digits").regex(/^[0-9+\-\s()]*$/, "Please enter a valid mobile number"),
}).refine((data) => data.password === data.confirmPassword, {
  message: "Passwords don't match",
  path: ["confirmPassword"],
});

type LoginForm = z.infer<typeof loginSchema>;
type RegisterForm = z.infer<typeof registerSchema>;

export default function SignIn() {
  const { user, loginMutation, registerMutation } = useAuth();
  
  const urlParams = new URLSearchParams(window.location.search);
  const mode = urlParams.get('mode') || 'login';
  const [activeTab, setActiveTab] = useState(mode === 'signup' ? 'register' : 'login');
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [rememberMe, setRememberMe] = useState(false);

  const loginForm = useForm<LoginForm>({
    resolver: zodResolver(loginSchema),
    defaultValues: {
      email: "",
      password: "",
    },
  });

  // Load saved credentials on component mount
  useEffect(() => {
    console.log('📋 Loading saved credentials...');
    const savedCredentials = localStorage.getItem('savedCredentials');
    console.log('📋 Found in localStorage:', savedCredentials);
    
    if (savedCredentials) {
      try {
        const { email, password, rememberMe: wasRemembered } = JSON.parse(savedCredentials);
        console.log('📋 Parsed credentials:', { email, password: '***', rememberMe: wasRemembered });
        
        if (wasRemembered && email && password) {
          console.log('📋 Auto-filling login form...');
          loginForm.setValue('email', email);
          loginForm.setValue('password', password);
          setRememberMe(true);
          console.log('📋 Credentials loaded successfully!');
        }
      } catch (error) {
        console.error('❌ Error loading saved credentials:', error);
        localStorage.removeItem('savedCredentials');
      }
    } else {
      console.log('📋 No saved credentials found');
    }
  }, [loginForm]);

  const registerForm = useForm<RegisterForm>({
    resolver: zodResolver(registerSchema),
    defaultValues: {
      email: "",
      password: "",
      firstName: "",
      lastName: "",
      confirmPassword: "",
      phone: "",
    },
  });

  // Redirect if already logged in
  if (user) {
    if (user.role === 'admin') {
      window.location.replace('/admin');
      return null;
    }
    window.location.replace('/dashboard');
    return null;
  }

  const onLogin = (data: LoginForm) => {
    console.log("📋 Login form submitted:", data);
    console.log("📋 Remember Me checkbox state:", rememberMe);
    
    // Save credentials if Remember Me is checked
    if (rememberMe) {
      const credentialsToSave = {
        email: data.email,
        password: data.password,
        rememberMe: true
      };
      console.log("📋 Saving credentials to localStorage:", credentialsToSave);
      localStorage.setItem('savedCredentials', JSON.stringify(credentialsToSave));
      console.log("📋 Credentials saved successfully!");
    } else {
      // Clear saved credentials if Remember Me is unchecked
      console.log("📋 Clearing saved credentials from localStorage");
      localStorage.removeItem('savedCredentials');
    }
    
    loginMutation.mutate(data);
  };

  const onRegister = (data: RegisterForm) => {
    const { confirmPassword, ...registerData } = data;
    registerMutation.mutate(registerData);
  };

  return (
    <div className="min-h-screen relative overflow-hidden flex items-center justify-center p-4" 
         style={{ 
           background: `linear-gradient(135deg, hsl(var(--background)) 0%, hsl(var(--secondary) / 0.1) 100%)`
         }}>
      
      {/* Background Transport Elements */}
      <div className="absolute inset-0 opacity-5">
        {/* Warehouse Interior Background */}
        <svg className="absolute inset-0 w-full h-full opacity-8" viewBox="0 0 800 600" preserveAspectRatio="xMidYMid slice">
          <defs>
            <linearGradient id="warehouseGradient" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" style={{ stopColor: 'hsl(var(--primary))', stopOpacity: 0.08 }} />
              <stop offset="50%" style={{ stopColor: 'hsl(var(--accent))', stopOpacity: 0.06 }} />
              <stop offset="100%" style={{ stopColor: 'hsl(var(--secondary))', stopOpacity: 0.07 }} />
            </linearGradient>
          </defs>
          
          {/* Warehouse Floor */}
          <rect x="0" y="400" width="800" height="200" fill="url(#warehouseGradient)" />
          
          {/* Storage Racks - Left Side */}
          <g opacity="0.08" fill="hsl(var(--primary))">
            <rect x="50" y="200" width="80" height="200" />
            <rect x="55" y="205" width="70" height="30" />
            <rect x="55" y="240" width="70" height="30" />
            <rect x="55" y="275" width="70" height="30" />
            <rect x="55" y="310" width="70" height="30" />
            <rect x="55" y="345" width="70" height="30" />
          </g>
          
          {/* Storage Racks - Right Side */}
          <g opacity="0.07" fill="hsl(var(--accent))">
            <rect x="670" y="200" width="80" height="200" />
            <rect x="675" y="205" width="70" height="30" />
            <rect x="675" y="240" width="70" height="30" />
            <rect x="675" y="275" width="70" height="30" />
            <rect x="675" y="310" width="70" height="30" />
            <rect x="675" y="345" width="70" height="30" />
          </g>
          
          {/* Center Storage Area */}
          <g opacity="0.06" fill="hsl(var(--secondary))">
            <rect x="200" y="300" width="120" height="100" />
            <rect x="480" y="300" width="120" height="100" />
            <rect x="205" y="305" width="25" height="25" />
            <rect x="235" y="305" width="25" height="25" />
            <rect x="265" y="305" width="25" height="25" />
            <rect x="295" y="305" width="25" height="25" />
            <rect x="485" y="305" width="25" height="25" />
            <rect x="515" y="305" width="25" height="25" />
            <rect x="545" y="305" width="25" height="25" />
            <rect x="575" y="305" width="25" height="25" />
          </g>
          
          {/* Forklift Paths */}
          <g opacity="0.05" stroke="hsl(var(--primary))" strokeWidth="2" fill="none">
            <path d="M150 450 L350 450" />
            <path d="M450 450 L650 450" />
            <path d="M400 200 L400 450" />
          </g>
          
          {/* Ceiling Lights */}
          <g opacity="0.09" fill="hsl(var(--accent))">
            <circle cx="200" cy="100" r="8" />
            <circle cx="400" cy="100" r="8" />
            <circle cx="600" cy="100" r="8" />
          </g>
          
          {/* Warehouse Pillars */}
          <g opacity="0.08" fill="hsl(var(--secondary))">
            <rect x="180" y="150" width="20" height="250" />
            <rect x="380" y="150" width="20" height="250" />
            <rect x="580" y="150" width="20" height="250" />
          </g>
        </svg>
      </div>

      <div className="w-full max-w-md relative z-10">
        {/* Back to Home */}
        <Link href="/">
          <Button variant="ghost" className="mb-6 transition-colors hover:bg-surface/80" 
                  style={{ color: 'hsl(var(--muted-foreground))' }}>
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back to Home
          </Button>
        </Link>

        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          <TabsList className="grid w-full grid-cols-2 mb-8 border-0 p-1 rounded-2xl h-auto" 
                    style={{ 
                      backgroundColor: 'hsl(var(--surface))', 
                      border: '1px solid hsl(var(--border))' 
                    }}>
            <TabsTrigger 
              value="login" 
              className="rounded-xl font-medium transition-all py-3 px-4 data-[state=active]:shadow-md h-auto"
              style={{ 
                color: activeTab === 'login' ? 'white' : 'hsl(var(--muted-foreground))',
                backgroundColor: activeTab === 'login' ? 'hsl(var(--primary))' : 'transparent'
              }}
            >
              Sign In
            </TabsTrigger>
            <TabsTrigger 
              value="register"
              className="rounded-xl font-medium transition-all py-3 px-4 data-[state=active]:shadow-md h-auto"
              style={{ 
                color: activeTab === 'register' ? 'white' : 'hsl(var(--muted-foreground))',
                backgroundColor: activeTab === 'register' ? 'hsl(var(--primary))' : 'transparent'
              }}
            >
              Sign Up
            </TabsTrigger>
          </TabsList>
          
          {/* Login Tab */}
          <TabsContent value="login">
            <Card className="shadow-2xl backdrop-blur-sm border-0 rounded-3xl overflow-hidden" 
                  style={{ 
                    backgroundColor: 'hsl(var(--surface))',
                    border: '1px solid hsl(var(--border) / 0.2)'
                  }}>
              <CardHeader className="text-center space-y-4 pb-8 pt-10 px-8">
                <CardTitle className="text-3xl font-bold" 
                          style={{ 
                            background: `linear-gradient(135deg, hsl(var(--primary)) 0%, hsl(var(--accent)) 100%)`,
                            backgroundClip: 'text',
                            WebkitBackgroundClip: 'text',
                            WebkitTextFillColor: 'transparent'
                          }}>
                  Welcome Back
                </CardTitle>
                <CardDescription className="text-lg" style={{ color: 'hsl(var(--muted-foreground))' }}>
                  Sign in to your LogiGoFast account
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6 px-10 pb-10">
                <Form {...loginForm}>
                  <form onSubmit={loginForm.handleSubmit(onLogin)} className="space-y-6">
                    <FormField
                      control={loginForm.control}
                      name="email"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel className="font-semibold text-sm" style={{ color: 'hsl(var(--foreground))' }}>
                            Email Address
                          </FormLabel>
                          <FormControl>
                            <Input
                              {...field}
                              type="email"
                              placeholder="Enter your email"
                              className="h-14 text-base rounded-xl border-2 transition-all duration-200 focus:scale-[1.02]"
                              style={{ 
                                backgroundColor: 'hsl(var(--background))',
                                borderColor: 'hsl(var(--border))',
                                color: 'hsl(var(--foreground))'
                              }}
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={loginForm.control}
                      name="password"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel className="font-semibold text-sm" style={{ color: 'hsl(var(--foreground))' }}>
                            Password
                          </FormLabel>
                          <FormControl>
                            <div className="relative">
                              <Input
                                {...field}
                                type={showPassword ? "text" : "password"}
                                placeholder="Enter your password"
                                className="h-14 text-base rounded-xl border-2 transition-all duration-200 focus:scale-[1.02] pr-14"
                                style={{ 
                                  backgroundColor: 'hsl(var(--background))',
                                  borderColor: 'hsl(var(--border))',
                                  color: 'hsl(var(--foreground))'
                                }}
                              />
                              <Button
                                type="button"
                                variant="ghost"
                                size="sm"
                                className="absolute right-0 top-0 h-14 px-4 hover:bg-transparent"
                                onClick={() => setShowPassword(!showPassword)}
                              >
                                {showPassword ? (
                                  <EyeOff className="h-5 w-5" style={{ color: 'hsl(var(--muted-foreground))' }} />
                                ) : (
                                  <Eye className="h-5 w-5" style={{ color: 'hsl(var(--muted-foreground))' }} />
                                )}
                              </Button>
                            </div>
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    
                    {/* Remember Me Checkbox */}
                    <div className="flex items-center space-x-3 py-2">
                      <Checkbox
                        id="remember-me"
                        checked={rememberMe}
                        onCheckedChange={(checked) => {
                          if (typeof checked === 'boolean') {
                            setRememberMe(checked);
                            console.log('📋 Remember Me checkbox changed:', checked);
                          }
                        }}
                        className="w-5 h-5 rounded border-2 transition-all duration-200"
                        style={{ 
                          borderColor: 'hsl(var(--border))',
                          backgroundColor: rememberMe ? 'hsl(var(--primary))' : 'transparent'
                        }}
                      />
                      <label 
                        htmlFor="remember-me" 
                        className="text-sm font-medium cursor-pointer select-none transition-colors duration-200"
                        style={{ color: 'hsl(var(--foreground))' }}
                      >
                        Remember my login details
                      </label>
                    </div>

                    <div className="pt-6">
                      <Button 
                        type="submit" 
                        className="w-full h-14 text-base font-bold rounded-xl transition-all duration-200 transform hover:scale-[1.02] active:scale-[0.98] hover:shadow-xl text-white"
                        style={{ 
                          background: `linear-gradient(135deg, hsl(var(--primary)) 0%, hsl(var(--accent)) 100%)`
                        }}
                        disabled={loginMutation.isPending}
                      >
                        {loginMutation.isPending ? (
                          <div className="flex items-center gap-3">
                            <div className="w-5 h-5 border-3 border-white border-t-transparent rounded-full animate-spin"></div>
                            Signing in...
                          </div>
                        ) : "Sign In"}
                      </Button>
                    </div>
                  </form>
                </Form>
              </CardContent>
            </Card>
          </TabsContent>
          
          {/* Register Tab */}
          <TabsContent value="register">
            <Card className="shadow-2xl backdrop-blur-sm border-0 rounded-2xl overflow-hidden" style={{ backgroundColor: 'var(--color-surface)' }}>
              <CardHeader className="text-center space-y-3 pb-8 pt-8 px-8">
                <CardTitle className="text-3xl font-bold bg-gradient-to-r from-primary-500 to-primary-600 bg-clip-text text-transparent">
                  Create Account
                </CardTitle>
                <CardDescription className="text-lg" style={{ color: 'var(--color-text-secondary)' }}>
                  Join LogiGoFast today
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6 px-8 pb-8">
                <Form {...registerForm}>
                  <form onSubmit={registerForm.handleSubmit(onRegister)} className="space-y-6">
                    <div className="grid grid-cols-2 gap-4">
                      <FormField
                        control={registerForm.control}
                        name="firstName"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel className="font-semibold text-sm" style={{ color: 'var(--color-text-primary)' }}>
                              First Name
                            </FormLabel>
                            <FormControl>
                              <Input
                                {...field}
                                placeholder="First name"
                                className="h-14 text-base rounded-xl border-2 transition-all duration-200 focus:scale-[1.02]"
                                style={{ 
                                  backgroundColor: 'var(--color-background)',
                                  borderColor: 'var(--color-border)',
                                  color: 'var(--color-text-primary)'
                                }}
                              />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      <FormField
                        control={registerForm.control}
                        name="lastName"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel className="font-semibold text-sm" style={{ color: 'var(--color-text-primary)' }}>
                              Last Name
                            </FormLabel>
                            <FormControl>
                              <Input
                                {...field}
                                placeholder="Last name"
                                className="h-14 text-base rounded-xl border-2 transition-all duration-200 focus:scale-[1.02]"
                                style={{ 
                                  backgroundColor: 'var(--color-background)',
                                  borderColor: 'var(--color-border)',
                                  color: 'var(--color-text-primary)'
                                }}
                              />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    </div>
                    <FormField
                      control={registerForm.control}
                      name="email"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel className="font-semibold text-sm" style={{ color: 'var(--color-text-primary)' }}>
                            Email Address
                          </FormLabel>
                          <FormControl>
                            <Input
                              {...field}
                              type="email"
                              placeholder="Enter your email"
                              className="h-14 text-base rounded-xl border-2 transition-all duration-200 focus:scale-[1.02]"
                              style={{ 
                                backgroundColor: 'var(--color-background)',
                                borderColor: 'var(--color-border)',
                                color: 'var(--color-text-primary)'
                              }}
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={registerForm.control}
                      name="phone"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel className="font-semibold text-sm" style={{ color: 'var(--color-text-primary)' }}>
                            Mobile Number
                          </FormLabel>
                          <FormControl>
                            <Input
                              {...field}
                              type="tel"
                              placeholder="Enter your mobile number"
                              className="h-14 text-base rounded-xl border-2 transition-all duration-200 focus:scale-[1.02]"
                              style={{ 
                                backgroundColor: 'var(--color-background)',
                                borderColor: 'var(--color-border)',
                                color: 'var(--color-text-primary)'
                              }}
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={registerForm.control}
                      name="password"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel className="font-semibold text-sm" style={{ color: 'var(--color-text-primary)' }}>
                            Password
                          </FormLabel>
                          <FormControl>
                            <div className="relative">
                              <Input
                                {...field}
                                type={showPassword ? "text" : "password"}
                                placeholder="Create a password"
                                className="h-14 text-base rounded-xl border-2 transition-all duration-200 focus:scale-[1.02] pr-14"
                                style={{ 
                                  backgroundColor: 'var(--color-background)',
                                  borderColor: 'var(--color-border)',
                                  color: 'var(--color-text-primary)'
                                }}
                              />
                              <Button
                                type="button"
                                variant="ghost"
                                size="sm"
                                className="absolute right-0 top-0 h-14 px-4 hover:bg-transparent"
                                onClick={() => setShowPassword(!showPassword)}
                              >
                                {showPassword ? (
                                  <EyeOff className="h-5 w-5" style={{ color: 'var(--color-text-secondary)' }} />
                                ) : (
                                  <Eye className="h-5 w-5" style={{ color: 'var(--color-text-secondary)' }} />
                                )}
                              </Button>
                            </div>
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={registerForm.control}
                      name="confirmPassword"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel className="font-semibold text-sm" style={{ color: 'var(--color-text-primary)' }}>
                            Confirm Password
                          </FormLabel>
                          <FormControl>
                            <div className="relative">
                              <Input
                                {...field}
                                type={showConfirmPassword ? "text" : "password"}
                                placeholder="Confirm your password"
                                className="h-14 text-base rounded-xl border-2 transition-all duration-200 focus:scale-[1.02] pr-14"
                                style={{ 
                                  backgroundColor: 'var(--color-background)',
                                  borderColor: 'var(--color-border)',
                                  color: 'var(--color-text-primary)'
                                }}
                              />
                              <Button
                                type="button"
                                variant="ghost"
                                size="sm"
                                className="absolute right-0 top-0 h-14 px-4 hover:bg-transparent"
                                onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                              >
                                {showConfirmPassword ? (
                                  <EyeOff className="h-5 w-5" style={{ color: 'var(--color-text-secondary)' }} />
                                ) : (
                                  <Eye className="h-5 w-5" style={{ color: 'var(--color-text-secondary)' }} />
                                )}
                              </Button>
                            </div>
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <div className="pt-4">
                      <Button 
                        type="submit" 
                        className="w-full h-14 text-base font-bold rounded-xl transition-all duration-200 transform hover:scale-[1.02] active:scale-[0.98] hover:shadow-xl"
                        style={{ 
                          backgroundColor: 'var(--color-primary-500)',
                          color: 'white'
                        }}
                        disabled={registerMutation.isPending}
                      >
                        {registerMutation.isPending ? (
                          <div className="flex items-center gap-3">
                            <div className="w-5 h-5 border-3 border-white border-t-transparent rounded-full animate-spin"></div>
                            Creating account...
                          </div>
                        ) : "Create Account"}
                      </Button>
                    </div>
                  </form>
                </Form>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}