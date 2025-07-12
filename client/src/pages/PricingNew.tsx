import React, { useState, useEffect } from "react";
import { Link, useLocation } from "wouter";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import Footer from "@/components/shared/Footer";
import { useAuth } from "@/hooks/use-auth";
import { useToast } from "@/hooks/use-toast";
import { staticPlans, upcomingFeatures, allPlanFeatures, planFeatureMatrix } from "@/data/plans";
import companyLogo from "@/assets/new-company-logo.png";
import customIcon from "@assets/logo 2_1751792580183.png";
import { 
  Package, 
  CheckCircle, 
  X, 
  Star, 
  Zap, 
  Crown, 
  Building, 
  Users,
  Phone,
  ArrowRight,
  Clock,
  Loader2,
  Menu,
  ChevronDown,
  ChevronUp
} from "lucide-react";

export default function Pricing() {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [expandedCards, setExpandedCards] = useState<{[key: number]: boolean}>({});
  const [, setLocation] = useLocation();
  const { user } = useAuth();
  const isAuthenticated = !!user;
  const { toast } = useToast();

  // Scroll to top on page load
  useEffect(() => { window.scrollTo(0, 0); }, []);

  // Use static plans from data file for instant loading (no API calls)
  const plans = staticPlans;

  // Event-based subscription creation - only triggered by user action
  const createSubscription = async (planId: number) => {
    try {
      const response = await fetch("/api/create-subscription", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        credentials: "include",
        body: JSON.stringify({ planId }),
      });

      if (!response.ok) {
        throw new Error("Failed to create subscription");
      }

      const data = await response.json();
      
      toast({
        title: "Success",
        description: "Subscription created successfully!",
      });

      // Redirect to payment or dashboard
      setLocation("/sign-in");

    } catch (error) {
      console.error("Subscription creation error:", error);
      toast({
        title: "Error", 
        description: "Failed to create subscription. Please try again.",
        variant: "destructive",
      });
    }
  };

  const handleGetStarted = (planId: number, planName: string) => {
    if (isAuthenticated) {
      createSubscription(planId);
    } else {
      // Find complete plan data and redirect directly to register page
      const selectedPlan = plans.find(plan => plan.id === planId);
      if (selectedPlan) {
        localStorage.setItem('selectedPlan', JSON.stringify(selectedPlan));
        setLocation("/signup");
      } else {
        // Fallback to signup if plan not found
        setLocation("/signup");
      }
    }
  };

  const handleScheduleDemo = () => {
    toast({
      title: "Demo Scheduled",
      description: "We'll contact you within 24 hours to schedule your demo!",
    });
  };

  const toggleMobileMenu = () => {
    setIsMobileMenuOpen(!isMobileMenuOpen);
  };

  const toggleCardExpansion = (cardIndex: number) => {
    setExpandedCards(prev => ({
      ...prev,
      [cardIndex]: !prev[cardIndex]
    }));
  };

  return (
    <div className="min-h-screen bg-white">
      {/* Navigation */}
      <nav 
        className="fixed w-full backdrop-blur-md border-b z-40 top-0"
        style={{ 
          background: `linear-gradient(135deg, hsl(var(--background) / 0.95) 0%, hsl(var(--secondary) / 0.1) 100%)`,
          borderColor: `hsl(var(--border) / 0.5)`
        }}
      >
        <div className="max-w-7xl mx-auto px-4 py-3">
          <div className="flex items-center justify-between">
            <Link href="/">
              <div className="flex items-center gap-2">
                <img 
                  src={customIcon}
                  alt="Custom Icon"
                  className="h-8 w-8 object-contain" 
                />
                <img 
                  src={companyLogo}
                  alt="Company Logo"
                  className="h-10 w-auto object-contain" 
                />
              </div>
            </Link>

            {/* Desktop Navigation */}
            <div className="hidden md:flex items-center gap-8">
              <Link href="/" 
                className="font-medium transition-colors"
                style={{ color: `hsl(var(--primary))` }}
              >
                Home
              </Link>
              <Link href="/about" 
                className="transition-colors hover:opacity-80"
                style={{ color: `hsl(var(--muted-foreground))` }}
              >
                About
              </Link>
              <Link href="/features" 
                className="transition-colors hover:opacity-80"
                style={{ color: `hsl(var(--muted-foreground))` }}
              >
                Features
              </Link>
              <Link href="/pricing" 
                className="font-medium transition-colors"
                style={{ color: `hsl(var(--primary))` }}
              >
                Pricing
              </Link>
              <Link href="/contact" 
                className="transition-colors hover:opacity-80"
                style={{ color: `hsl(var(--muted-foreground))` }}
              >
                Contact
              </Link>

              
              {user ? (
                <Link href={user.role === 'admin' ? '/admin' : '/dashboard'}>
                  <button 
                    className="px-6 py-2 rounded-md transition-colors text-white font-medium"
                    style={{ background: `hsl(var(--primary))` }}
                  >
                    Dashboard
                  </button>
                </Link>
              ) : (
                <div className="flex items-center gap-4">
                  <Link href="/sign-in">
                    <Button 
                      className="text-white rounded-full px-6 hover:opacity-90 transition-all"
                      style={{ 
                        backgroundColor: `hsl(var(--accent))`
                      }}
                    >
                      Sign In
                    </Button>
                  </Link>
                </div>
              )}
            </div>

            {/* Mobile menu button */}
            <div className="md:hidden">
              <Button
                variant="ghost"
                size="sm"
                onClick={toggleMobileMenu}
                className="hover:bg-primary/10 border-2 border-primary/20 shadow-sm"
                style={{ color: `hsl(var(--primary))` }}
              >
                {isMobileMenuOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
              </Button>
            </div>
          </div>

          {/* Mobile Navigation Menu */}
          {isMobileMenuOpen && (
            <div className="md:hidden mt-4 pb-4 border-t" style={{ borderColor: `hsl(var(--border))` }}>
              <div className="flex flex-col space-y-4 pt-4">
                <Link 
                  href="/" 
                  className="font-medium px-2 py-1"
                  style={{ color: `hsl(var(--primary))` }}
                  onClick={() => setIsMobileMenuOpen(false)}
                >
                  Home
                </Link>
                <Link 
                  href="/about" 
                  className="transition-colors px-2 py-1 hover:opacity-80"
                  style={{ color: `hsl(var(--muted-foreground))` }}
                  onClick={() => setIsMobileMenuOpen(false)}
                >
                  About
                </Link>
                <Link 
                  href="/features" 
                  className="transition-colors px-2 py-1 hover:opacity-80"
                  style={{ color: `hsl(var(--muted-foreground))` }}
                  onClick={() => setIsMobileMenuOpen(false)}
                >
                  Features
                </Link>
                <Link 
                  href="/pricing" 
                  className="transition-colors px-2 py-1 hover:opacity-80"
                  style={{ color: `hsl(var(--muted-foreground))` }}
                  onClick={() => setIsMobileMenuOpen(false)}
                >
                  Pricing
                </Link>
                <Link 
                  href="/contact" 
                  className="transition-colors px-2 py-1 hover:opacity-80"
                  style={{ color: `hsl(var(--muted-foreground))` }}
                  onClick={() => setIsMobileMenuOpen(false)}
                >
                  Contact
                </Link>
                <div className="pt-4 border-t" style={{ borderColor: `hsl(var(--border))` }}>
                  {user ? (
                    <Link 
                      href={user.role === 'admin' ? '/admin' : '/dashboard'} 
                      onClick={() => setIsMobileMenuOpen(false)}
                    >
                      <Button 
                        className="w-full text-white rounded-full"
                        style={{ 
                          backgroundColor: `hsl(var(--primary))`
                        }}
                      >
                        Dashboard
                      </Button>
                    </Link>
                  ) : (
                    <Link href="/sign-in" onClick={() => setIsMobileMenuOpen(false)}>
                      <Button 
                        className="w-full text-white rounded-full"
                        style={{ 
                          backgroundColor: `hsl(var(--accent))`
                        }}
                      >
                        Sign In
                      </Button>
                    </Link>
                  )}
                </div>
              </div>
            </div>
          )}
        </div>
      </nav>

      {/* Hero Section */}
      <div className="py-20" style={{ background: 'linear-gradient(135deg, hsl(203 64% 95%) 0%, hsl(11 64% 95%) 100%)' }}>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <div className="flex items-center justify-center mb-6">
            <Package className="h-12 w-12 mr-4" style={{ color: '#3094d1' }} />
            <h1 className="text-4xl md:text-6xl font-bold text-gray-900">
              Simple, <span style={{ color: '#3094d1' }}>Transparent</span> Pricing
            </h1>
          </div>
          <p className="text-xl md:text-2xl mb-8 text-gray-600">
            Choose the plan that's right for your business
          </p>
          <Badge className="px-4 py-2 text-lg" style={{ 
            backgroundColor: 'hsl(203 64% 95%)', 
            color: '#3094d1', 
            borderColor: '#3094d1' 
          }}>
            <Clock className="h-5 w-5 mr-2" />
            14-Day Free Trial on All Plans
          </Badge>
        </div>
      </div>

      {/* Pricing Cards */}
      <div className="py-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid md:grid-cols-3 gap-8 max-w-5xl mx-auto items-stretch">
            {plans.map((plan, index) => {
              // Get plan features matrix for consistent display
              const planKey = plan.name.toLowerCase() as 'starter' | 'professional' | 'enterprise';
              const planFeatures = planFeatureMatrix[planKey];
              
              return (
                <Card key={plan.id} className={`relative overflow-hidden transition-all duration-300 hover:shadow-2xl flex flex-col h-full ${plan.isPopular ? 'border-2 scale-105' : 'border-gray-200 hover:border-gray-300'}`} 
                  style={{ borderColor: plan.isPopular ? '#3094d1' : undefined }}>
                  {plan.isPopular && (
                    <div className="absolute top-0 left-0 right-0 text-white text-center py-2 text-sm font-semibold"
                      style={{ background: 'linear-gradient(135deg, #3094d1 0%, #e7a293 100%)' }}>
                      <Star className="h-4 w-4 inline mr-1" />
                      Most Popular
                    </div>
                  )}
                  
                  <CardContent className={`p-8 flex flex-col h-full ${plan.isPopular ? 'pt-12' : ''}`}>
                    <div className="text-center mb-8">
                      <div className="mb-4">
                        {index === 0 && <Zap className="h-12 w-12 mx-auto" style={{ color: '#3094d1' }} />}
                        {index === 1 && <Crown className="h-12 w-12 mx-auto" style={{ color: '#3094d1' }} />}
                        {index === 2 && <Building className="h-12 w-12 mx-auto" style={{ color: '#3094d1' }} />}
                      </div>
                      
                      <h3 className="text-2xl font-bold text-gray-900 mb-2">{plan.name}</h3>
                      <p className="text-gray-600 mb-4">{plan.description}</p>
                      
                      <div className="mb-6">
                        {plan.name === "Enterprise" ? (
                          <div className="text-2xl font-bold text-gray-900">Custom Pricing</div>
                        ) : (
                          <div className="text-4xl font-bold text-gray-900">
                            {plan.price}
                            <span className="text-lg font-normal text-gray-600">/month</span>
                          </div>
                        )}
                      </div>
                    </div>

                    {/* Show features with collapsible design */}
                    <div className="space-y-3 mb-8 flex-grow">
                      {allPlanFeatures.map((feature, featureIndex) => {
                        const isIncluded = planFeatures?.includes(feature);
                        const isExpanded = expandedCards[index];
                        const shouldShow = featureIndex < 6 || isExpanded;
                        
                        // Add capacity details for comparison
                        let displayText = feature;
                        const planKey = plan.name.toLowerCase() as 'starter' | 'professional' | 'enterprise';
                        
                        if (feature === "Monthly bookings") {
                          displayText = planKey === 'starter' ? '100 bookings per month' : 
                                       planKey === 'professional' ? '500 bookings per month' : 
                                       'Unlimited bookings';
                        } else if (feature === "Vehicle management") {
                          displayText = planKey === 'starter' ? '1 vehicle' : 
                                       planKey === 'professional' ? 'Up to 25 vehicles' : 
                                       'Unlimited vehicles';
                        } else if (feature === "Agent accounts") {
                          displayText = planKey === 'starter' ? '0 agent accounts' : 
                                       planKey === 'professional' ? 'Up to 10 agent accounts' : 
                                       'Unlimited agent accounts';
                        }
                        
                        if (!shouldShow) return null;
                        
                        return (
                          <div key={featureIndex} className="flex items-start">
                            {isIncluded ? (
                              <>
                                <CheckCircle className="h-5 w-5 text-green-500 mr-3 mt-0.5 flex-shrink-0" />
                                <span className="text-gray-700">{displayText}</span>
                              </>
                            ) : (
                              <>
                                <X className="h-5 w-5 text-gray-300 mr-3 mt-0.5 flex-shrink-0" />
                                <span className="text-gray-400 line-through">{displayText}</span>
                              </>
                            )}
                          </div>
                        );
                      })}
                      
                      {/* Show/Hide More Features Button */}
                      {allPlanFeatures.length > 6 && (
                        <button
                          onClick={() => toggleCardExpansion(index)}
                          className="flex items-center justify-center w-full text-sm font-medium transition-colors py-2 rounded-md border border-gray-200 hover:border-gray-300 hover:bg-gray-50"
                          style={{ color: '#3094d1' }}
                        >
                          {expandedCards[index] ? (
                            <>
                              <ChevronUp className="h-4 w-4 mr-1" />
                              Show Less Features
                            </>
                          ) : (
                            <>
                              <ChevronDown className="h-4 w-4 mr-1" />
                              Show All Features ({allPlanFeatures.length - 6} more)
                            </>
                          )}
                        </button>
                      )}
                    </div>

                    <div className="space-y-3 mt-auto">
                      {plan.name === "Enterprise" ? (
                        <Button 
                          className="w-full text-white" 
                          size="lg"
                          onClick={handleScheduleDemo}
                          style={{ background: '#cbdc65', }}
                        >
                          Connect Team
                          <ArrowRight className="h-4 w-4 ml-2" />
                        </Button>
                      ) : (
                        <Button 
                          className="w-full text-white"
                          size="lg"
                          onClick={() => handleGetStarted(plan.id, plan.name)}
                          style={{ 
                            background: plan.isPopular ? '#3094d1' : '#e7a293'
                          }}
                        >
                          Start Free Trial
                          <ArrowRight className="h-4 w-4 ml-2" />
                        </Button>
                      )}
                      
                      <p className="text-center text-sm text-gray-600">
                        {plan.name === "Enterprise" ? (
                          "Custom features and pricing"
                        ) : (
                          `${plan.trialDays} days free, then ${plan.price}/month`
                        )}
                      </p>
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>

          {/* Trust Indicators */}
          <div className="mt-16 text-center">
            <p className="text-gray-600 mb-8">Trusted by 500+ logistics companies across India</p>
            <div className="flex justify-center items-center space-x-8 opacity-60">
              <Users className="h-8 w-8" />
              <Building className="h-8 w-8" />
              <Package className="h-8 w-8" />
              <Phone className="h-8 w-8" />
            </div>
          </div>
        </div>
      </div>

      {/* FAQ Section */}
      <div className="bg-white py-20">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <h2 className="text-3xl font-bold text-center text-gray-900 mb-12">
            Frequently Asked Questions
          </h2>
          
          <div className="space-y-8">
            <div>
              <h3 className="text-xl font-semibold text-gray-900 mb-2">
                What's included in the free trial?
              </h3>
              <p className="text-gray-600">
                Full access to all features of your selected plan for 14 days. No credit card required.
              </p>
            </div>
            
            <div>
              <h3 className="text-xl font-semibold text-gray-900 mb-2">
                Can I change plans anytime?
              </h3>
              <p className="text-gray-600">
                Yes, you can upgrade or downgrade your plan at any time. Changes take effect immediately.
              </p>
            </div>
            
            <div>
              <h3 className="text-xl font-semibold text-gray-900 mb-2">
                What payment methods do you accept?
              </h3>
              <p className="text-gray-600">
                We accept all major credit cards, debit cards, and bank transfers through our secure payment gateway.
              </p>
            </div>
            
            <div>
              <h3 className="text-xl font-semibold text-gray-900 mb-2">
                Is there a setup fee?
              </h3>
              <p className="text-gray-600">
                No setup fees. Pay only for your monthly subscription.
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Upcoming Features Section */}
      <div className="py-20" style={{ background: 'linear-gradient(135deg, hsl(203 64% 95%) 0%, hsl(11 64% 95%) 100%)' }}>
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold text-gray-900 mb-4">
              Coming Soon: Future Features
            </h2>
            <p className="text-xl text-gray-600 max-w-3xl mx-auto">
              We're constantly working to bring you more powerful features. Here's what's in development:
            </p>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {upcomingFeatures.map((feature, index) => (
              <div key={index} className="bg-white rounded-lg p-6 shadow-sm border border-gray-200 hover:shadow-md transition-shadow">
                <div className="flex items-start space-x-3">
                  <div className="rounded-full p-1 mt-1" style={{ background: 'linear-gradient(135deg, #3094d1 0%, #e7a293 100%)' }}>
                    <div className="bg-white rounded-full p-1">
                      <Clock className="h-4 w-4" style={{ color: '#3094d1' }} />
                    </div>
                  </div>
                  <div>
                    <h3 className="font-semibold text-gray-900 mb-2">{feature}</h3>
                    <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium" style={{ 
                      backgroundColor: 'hsl(69 63% 90%)', 
                      color: '#cbdc65' 
                    }}>
                      In Development
                    </span>
                  </div>
                </div>
              </div>
            ))}
          </div>
          
          <div className="text-center mt-12">
            <div className="bg-white rounded-lg p-8 shadow-sm border border-gray-200 max-w-2xl mx-auto">
              <Package className="h-12 w-12 mx-auto mb-4" style={{ color: '#3094d1' }} />
              <h3 className="text-xl font-semibold text-gray-900 mb-2">
                Want early access to new features?
              </h3>
              <p className="text-gray-600 mb-4">
                Subscribe to any plan and get priority access to all upcoming features as they're released.
              </p>
              <Link href="/signup">
                <button 
                  className="text-white px-8 py-3 rounded-lg font-medium transition-all"
                  style={{ 
                    background: 'linear-gradient(135deg, #3094d1 0%, #e7a293 100%)'
                  }}
                >
                  Start Your Free Trial
                </button>
              </Link>
            </div>
          </div>
        </div>
      </div>

      <Footer />
    </div>
  );
}