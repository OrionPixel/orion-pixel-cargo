import React, { useState, useEffect, useRef } from "react";
import { Link, useLocation } from "wouter";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Package, Eye, EyeOff, ArrowLeft, CheckCircle, Loader2 } from "lucide-react";
import { useAuth } from "@/hooks/use-auth";
import { useToast } from "@/hooks/use-toast";
import { staticPlans } from "@/data/plans";
import companyLogo from "@/assets/new-company-logo.png";
import customIcon from "@assets/logo 2_1751792580183.png";

export default function Register() {
  const [, setLocation] = useLocation();
  const { user, registerMutation } = useAuth();
  const { toast } = useToast();
  
  // Scroll to top on page load
  useEffect(() => { window.scrollTo(0, 0); }, []);
  
  // Form refs for pure form handling
  const firstNameRef = useRef<HTMLInputElement>(null);
  const lastNameRef = useRef<HTMLInputElement>(null);
  const emailRef = useRef<HTMLInputElement>(null);
  const phoneRef = useRef<HTMLInputElement>(null);
  const passwordRef = useRef<HTMLInputElement>(null);
  const confirmPasswordRef = useRef<HTMLInputElement>(null);
  const officeNameRef = useRef<HTMLInputElement>(null);
  const termsRef = useRef<HTMLInputElement>(null);
  
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [selectedPlan, setSelectedPlan] = useState("professional");
  
  // Redirect if already authenticated
  if (user) {
    window.location.replace('/dashboard');
    return null;
  }
  
  // Get selected plan from localStorage if coming from pricing page
  useEffect(() => {
    const planFromStorage = localStorage.getItem('selected_plan');
    if (planFromStorage) {
      setSelectedPlan(planFromStorage);
    }
  }, []);
  
  const selectedPlanData = staticPlans.find(plan => plan.id.toString() === selectedPlan) || staticPlans[1];
  
  const onSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    const firstName = firstNameRef.current?.value || '';
    const lastName = lastNameRef.current?.value || '';
    const email = emailRef.current?.value || '';
    const phone = phoneRef.current?.value || '';
    const password = passwordRef.current?.value || '';
    const confirmPassword = confirmPasswordRef.current?.value || '';
    const officeName = officeNameRef.current?.value || '';
    const termsAccepted = termsRef.current?.checked || false;
    
    // Validation
    if (!firstName || !lastName || !email || !password) {
      toast({
        title: "Missing Fields",
        description: "Please fill in all required fields",
        variant: "destructive",
      });
      return;
    }
    
    if (password !== confirmPassword) {
      toast({
        title: "Password Mismatch",
        description: "Passwords do not match",
        variant: "destructive",
      });
      return;
    }
    
    if (password.length < 6) {
      toast({
        title: "Weak Password",
        description: "Password must be at least 6 characters long",
        variant: "destructive",
      });
      return;
    }
    
    if (!termsAccepted) {
      toast({
        title: "Terms & Conditions",
        description: "Please accept the terms and conditions",
        variant: "destructive",
      });
      return;
    }
    
    console.log("📋 Registration form submitted:", { firstName, lastName, email, phone, selectedPlan });
    
    registerMutation.mutate({
      firstName,
      lastName,
      email,
      phone,
      password,
      role: 'transporter',
      officeName: officeName || `${firstName} ${lastName} Transport`,
      subscriptionPlan: selectedPlan,
      trialDays: 14
    });
  };

  return (
    <div className="min-h-screen" style={{ background: `linear-gradient(135deg, hsl(var(--primary) / 0.05) 0%, hsl(var(--background)) 50%, hsl(var(--accent) / 0.05) 100%)` }}>
      {/* Navigation */}
      <nav className="bg-white shadow-sm border-b" style={{ borderColor: `hsl(var(--primary) / 0.2)` }}>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <Link href="/">
              <div className="flex items-center space-x-3 cursor-pointer">
                <img src={customIcon} alt="Logo Icon" className="h-8 w-8 object-contain" />
                <img src={companyLogo} alt="LogiGoFast" className="h-10 w-auto" />
              </div>
            </Link>
            <div className="flex items-center space-x-4">
              <span className="text-sm" style={{ color: `hsl(var(--muted-foreground))` }}>Already have an account?</span>
              <Link href="/sign-in">
                <Button variant="outline" size="sm">
                  Sign In
                </Button>
              </Link>
            </div>
          </div>
        </div>
      </nav>

      <div className="flex min-h-[calc(100vh-4rem)]">
        {/* Left Side - Registration Form */}
        <div className="flex-1 flex items-center justify-center p-8">
          <div className="w-full max-w-md">
            <div className="text-center mb-8">
              <div className="flex items-center justify-center space-x-2 mb-4">
                <ArrowLeft 
                  className="h-5 w-5 cursor-pointer hover:opacity-70 transition-opacity duration-200" 
                  style={{ color: `hsl(var(--primary))` }}
                  onClick={() => setLocation('/signup')}
                />
                <h1 className="text-3xl font-bold" style={{ color: `hsl(var(--foreground))` }}>Create Account</h1>
              </div>
              <p style={{ color: `hsl(var(--muted-foreground))` }}>Join thousands of logistics companies using LogiGoFast</p>
            </div>

            <Card className="shadow-lg border-0">
              <CardHeader className="pb-4">
                <CardTitle className="text-xl text-center" style={{ color: `hsl(var(--foreground))` }}>Sign Up for {selectedPlanData?.name} Plan</CardTitle>
              </CardHeader>
              <CardContent>
                <form onSubmit={onSubmit} className="space-y-4">
                  {/* Name Fields */}
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <Label htmlFor="firstName">First Name *</Label>
                      <Input
                        ref={firstNameRef}
                        id="firstName"
                        placeholder="Enter first name"
                        required
                      />
                    </div>
                    <div>
                      <Label htmlFor="lastName">Last Name *</Label>
                      <Input
                        ref={lastNameRef}
                        id="lastName"
                        placeholder="Enter last name"
                        required
                      />
                    </div>
                  </div>

                  {/* Email */}
                  <div>
                    <Label htmlFor="email">Email Address *</Label>
                    <Input
                      ref={emailRef}
                      id="email"
                      type="email"
                      placeholder="Enter email address"
                      required
                    />
                  </div>

                  {/* Phone */}
                  <div>
                    <Label htmlFor="phone">Phone Number</Label>
                    <Input
                      ref={phoneRef}
                      id="phone"
                      placeholder="Enter phone number"
                    />
                  </div>

                  {/* Company Name */}
                  <div>
                    <Label htmlFor="officeName">Company Name</Label>
                    <Input
                      ref={officeNameRef}
                      id="officeName"
                      placeholder="Enter company name (optional)"
                    />
                  </div>

                  {/* Password */}
                  <div>
                    <Label htmlFor="password">Password *</Label>
                    <div className="relative">
                      <Input
                        ref={passwordRef}
                        id="password"
                        type={showPassword ? "text" : "password"}
                        placeholder="Create a strong password"
                        required
                      />
                      <button
                        type="button"
                        className="absolute right-3 top-1/2 transform -translate-y-1/2"
                        onClick={() => setShowPassword(!showPassword)}
                      >
                        {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                      </button>
                    </div>
                  </div>

                  {/* Confirm Password */}
                  <div>
                    <Label htmlFor="confirmPassword">Confirm Password *</Label>
                    <div className="relative">
                      <Input
                        ref={confirmPasswordRef}
                        id="confirmPassword"
                        type={showConfirmPassword ? "text" : "password"}
                        placeholder="Confirm your password"
                        required
                      />
                      <button
                        type="button"
                        className="absolute right-3 top-1/2 transform -translate-y-1/2"
                        onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                      >
                        {showConfirmPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                      </button>
                    </div>
                  </div>

                  {/* Terms */}
                  <div className="flex items-start space-x-2">
                    <input 
                      ref={termsRef}
                      type="checkbox" 
                      id="terms" 
                      className="mt-1"
                      required
                    />
                    <label htmlFor="terms" className="text-sm" style={{ color: `hsl(var(--muted-foreground))` }}>
                      I agree to the{" "}
                      <Link href="/terms" className="hover:underline" style={{ color: `hsl(var(--primary))` }}>
                        Terms & Conditions
                      </Link>{" "}
                      and{" "}
                      <Link href="/privacy" className="hover:underline" style={{ color: `hsl(var(--primary))` }}>
                        Privacy Policy
                      </Link>
                    </label>
                  </div>

                  {/* Submit Button */}
                  <Button 
                    type="submit" 
                    className="w-full" 
                    disabled={registerMutation.isPending}
                    style={{ backgroundColor: 'hsl(var(--primary))' }}
                  >
                    {registerMutation.isPending ? (
                      <>
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        Creating Account...
                      </>
                    ) : (
                      <>
                        <CheckCircle className="mr-2 h-4 w-4" />
                        Start 14-Day Free Trial
                      </>
                    )}
                  </Button>
                </form>
              </CardContent>
            </Card>

            <div className="text-center mt-6">
              <p className="text-sm" style={{ color: `hsl(var(--muted-foreground))` }}>
                By signing up, you get immediate access to all features with a 14-day free trial.
              </p>
            </div>
          </div>
        </div>

        {/* Right Side - Plan Details */}
        <div className="w-96 p-8 text-white" style={{ background: `linear-gradient(135deg, hsl(var(--primary)) 0%, hsl(var(--secondary)) 100%)` }}>
          <div className="sticky top-8">
            <h2 className="text-2xl font-bold mb-6">Your Selected Plan</h2>
            
            <Card className="bg-white/10 backdrop-blur border-white/20 text-white">
              <CardContent className="p-6">
                <div className="text-center mb-4">
                  {selectedPlanData?.isPopular && (
                    <Badge className="bg-white text-blue-600 mb-2">
                      Most Popular
                    </Badge>
                  )}
                  <h3 className="text-xl font-bold">{selectedPlanData?.name}</h3>
                  <div className="text-3xl font-bold mt-2">
                    {selectedPlanData?.price}
                    {selectedPlanData?.price !== "Connect Team" && (
                      <span className="text-lg font-normal">/month</span>
                    )}
                  </div>
                </div>

                <div className="space-y-3">
                  {selectedPlanData?.features.slice(0, 6).map((feature, index) => (
                    <div key={index} className="flex items-center space-x-2">
                      <CheckCircle className="h-4 w-4" />
                      <span className="text-sm">{feature}</span>
                    </div>
                  ))}
                </div>

                <div className="mt-6 p-3 bg-white/10 rounded-lg">
                  <p className="text-sm text-center">
                    {selectedPlanData?.trialDays > 0 ? (
                      <>
                        <strong>{selectedPlanData?.trialDays}-day free trial</strong><br />
                        No credit card required
                      </>
                    ) : (
                      <>
                        <strong>Contact us</strong><br />
                        Custom pricing available
                      </>
                    )}
                  </p>
                </div>
              </CardContent>
            </Card>

            <div className="mt-6 text-center">
              <Button 
                className="bg-white text-black hover:bg-white/90 border-0 transition-all duration-200"
                onClick={() => setLocation('/signup')}
              >
                Change Plan
              </Button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}