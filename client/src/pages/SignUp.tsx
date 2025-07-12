import React, { useState, useEffect } from "react";
import { Link, useLocation } from "wouter";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { staticPlans, planFeatureMatrix } from "@/data/plans";
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
  ChevronDown,
  ChevronUp
} from "lucide-react";

export default function SignUp() {
  const [, setLocation] = useLocation();
  const [selectedPlan, setSelectedPlan] = useState("");
  const [expandedCards, setExpandedCards] = useState<{[key: number]: boolean}>({});

  // Scroll to top on page load
  useEffect(() => { window.scrollTo(0, 0); }, []);

  const handleGetStarted = (planId: string) => {
    if (!selectedPlan) {
      alert("कृपया पहले कोई प्लान चुनें (Please select a plan first)");
      return;
    }
    
    // Store selected plan in localStorage
    localStorage.setItem('selected_plan', selectedPlan);
    
    // Navigate to register page
    setLocation("/register");
  };

  const toggleCardExpansion = (planIndex: number) => {
    setExpandedCards(prev => ({
      ...prev,
      [planIndex]: !prev[planIndex]
    }));
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
              <span className="text-sm text-gray-600">Already have an account?</span>
              <Link href="/sign-in">
                <Button variant="outline" size="sm">
                  Sign In
                </Button>
              </Link>
            </div>
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <div className="text-center py-16 px-4">
        <h1 className="text-4xl md:text-5xl font-bold mb-6" style={{ color: `hsl(var(--foreground))` }}>
          Choose Your <span style={{ color: `hsl(var(--primary))` }}>Perfect Plan</span>
        </h1>
        <p className="text-xl mb-8 max-w-3xl mx-auto" style={{ color: `hsl(var(--muted-foreground))` }}>
          Start your logistics management journey with our powerful platform. 
          Select the plan that fits your business needs.
        </p>
        <div className="flex justify-center items-center space-x-2 text-sm" style={{ color: `hsl(var(--muted-foreground))` }}>
          <CheckCircle className="h-4 w-4" style={{ color: `hsl(var(--accent))` }} />
          <span>14-day free trial</span>
          <span>•</span>
          <CheckCircle className="h-4 w-4" style={{ color: `hsl(var(--accent))` }} />
          <span>No credit card required</span>
          <span>•</span>
          <CheckCircle className="h-4 w-4" style={{ color: `hsl(var(--accent))` }} />
          <span>Cancel anytime</span>
        </div>
      </div>

      {/* Pricing Plans */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pb-16">
        <div className="grid md:grid-cols-3 gap-8">
          {staticPlans.map((plan, index) => (
            <Card 
              key={plan.id} 
              className={`relative transition-all duration-300 hover:shadow-xl ${
                plan.badge === "Most Popular" ? "ring-2 ring-blue-500 scale-105" : ""
              } ${selectedPlan === plan.id ? "ring-2 ring-blue-600" : ""}`}
            >
              {plan.badge && (
                <div className="absolute -top-4 left-1/2 transform -translate-x-1/2">
                  <Badge className="bg-gradient-to-r from-blue-500 to-purple-600 text-white px-6 py-1">
                    {plan.badge}
                  </Badge>
                </div>
              )}

              <CardHeader className="text-center pb-4">
                <div className="flex justify-center mb-4">
                  {plan.id === 1 && (
                    <div className="p-3 rounded-full" style={{ backgroundColor: `hsl(var(--primary) / 0.1)` }}>
                      <Package className="h-8 w-8" style={{ color: `hsl(var(--primary))` }} />
                    </div>
                  )}
                  {plan.id === 2 && (
                    <div className="p-3 rounded-full" style={{ backgroundColor: `hsl(var(--secondary) / 0.3)` }}>
                      <Zap className="h-8 w-8" style={{ color: `hsl(var(--secondary))` }} />
                    </div>
                  )}
                  {plan.id === 3 && (
                    <div className="p-3 rounded-full" style={{ backgroundColor: `hsl(var(--accent) / 0.3)` }}>
                      <Crown className="h-8 w-8" style={{ color: `hsl(var(--accent))` }} />
                    </div>
                  )}
                </div>

                <CardTitle className="text-2xl font-bold" style={{ color: `hsl(var(--foreground))` }}>{plan.name}</CardTitle>
                <div className="mt-4">
                  {plan.price === "Connect Team" ? (
                    <div className="text-3xl font-bold" style={{ color: `hsl(var(--foreground))` }}>Contact Team</div>
                  ) : (
                    <>
                      <div className="text-4xl font-bold" style={{ color: `hsl(var(--foreground))` }}>
                        {plan.price}
                        <span className="text-lg font-normal" style={{ color: `hsl(var(--muted-foreground))` }}>/month</span>
                      </div>
                      <p className="text-sm mt-1" style={{ color: `hsl(var(--muted-foreground))` }}>Billed monthly</p>
                    </>
                  )}
                </div>
              </CardHeader>

              <CardContent className="space-y-4">
                {/* Key Features - Real Data */}
                <div className="space-y-3">
                  {plan.features.slice(0, 3).map((feature, featureIndex) => (
                    <div key={featureIndex} className="flex items-center space-x-3">
                      <CheckCircle className="h-4 w-4 flex-shrink-0" style={{ color: `hsl(var(--accent))` }} />
                      <span className="text-sm font-medium" style={{ color: `hsl(var(--foreground))` }}>{feature}</span>
                    </div>
                  ))}
                </div>

                {/* Show More Features Button */}
                <div className="pt-2">
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => toggleCardExpansion(index)}
                    className="w-full hover:opacity-80"
                    style={{ color: `hsl(var(--primary))` }}
                  >
                    {expandedCards[index] ? (
                      <>
                        Show Less <ChevronUp className="ml-1 h-4 w-4" />
                      </>
                    ) : (
                      <>
                        Show All Features <ChevronDown className="ml-1 h-4 w-4" />
                      </>
                    )}
                  </Button>
                </div>

                {/* Expanded Features - Real Data */}
                {expandedCards[index] && (
                  <div className="space-y-2 border-t pt-4" style={{ borderColor: `hsl(var(--border))` }}>
                    {plan.features.slice(3).map((feature, featureIndex) => (
                      <div key={featureIndex} className="flex items-center space-x-2">
                        <CheckCircle className="h-4 w-4 flex-shrink-0" style={{ color: `hsl(var(--accent))` }} />
                        <span className="text-sm" style={{ color: `hsl(var(--foreground))` }}>{feature}</span>
                      </div>
                    ))}
                  </div>
                )}

                {/* CTA Button */}
                <div className="pt-6">
                  {plan.price === "Connect Team" ? (
                    <Button 
                      className="w-full text-white hover:opacity-90"
                      style={{ backgroundColor: `hsl(var(--accent))` }}
                      onClick={() => setLocation("/contact")}
                    >
                      <Phone className="mr-2 h-4 w-4" />
                      Contact Sales
                    </Button>
                  ) : (
                    <Button 
                      className="w-full text-white hover:opacity-90"
                      style={{ 
                        backgroundColor: plan.isPopular 
                          ? `hsl(var(--primary))` 
                          : plan.id === 1 
                            ? `hsl(var(--primary))` 
                            : `hsl(var(--secondary))`
                      }}
                      onClick={() => handleGetStarted(plan.id.toString())}
                    >
                      Start Free Trial
                      <ArrowRight className="ml-2 h-4 w-4" />
                    </Button>
                  )}
                </div>

                {/* Plan Selection Radio */}
                <div className="pt-2 flex justify-center">
                  <input
                    type="radio"
                    id={`plan-${plan.id}`}
                    name="selectedPlan"
                    value={plan.id.toString()}
                    checked={selectedPlan === plan.id.toString()}
                    onChange={(e) => setSelectedPlan(e.target.value)}
                    className="mr-2"
                  />
                  <label htmlFor={`plan-${plan.id}`} className="text-sm cursor-pointer" style={{ color: `hsl(var(--muted-foreground))` }}>
                    Select this plan
                  </label>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* Continue with Selected Plan */}
        <div className="text-center mt-12">
          <div className="bg-white rounded-lg shadow-lg p-8 max-w-md mx-auto">
            <h3 className="text-xl font-bold mb-4" style={{ color: `hsl(var(--foreground))` }}>Ready to get started?</h3>
            <p className="mb-6" style={{ color: `hsl(var(--muted-foreground))` }}>
              {selectedPlan ? (
                <>Selected: <strong style={{ color: `hsl(var(--primary))` }}>{staticPlans.find(p => p.id.toString() === selectedPlan)?.name}</strong></>
              ) : (
                <span style={{ color: `hsl(var(--destructive))` }}>कृपया पहले कोई प्लान चुनें</span>
              )}
            </p>
            <Button 
              className="w-full text-white hover:opacity-90"
              style={{ backgroundColor: `hsl(var(--primary))` }}
              onClick={() => handleGetStarted(selectedPlan)}
              disabled={!selectedPlan}
            >
              Continue to Registration
              <ArrowRight className="ml-2 h-4 w-4" />
            </Button>
            <p className="text-xs text-gray-500 mt-3">
              You can change your plan anytime after registration
            </p>
          </div>
        </div>
      </div>

      {/* Footer */}
      <div className="bg-gray-50 border-t py-8">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <p style={{ color: `hsl(var(--muted-foreground))` }}>
            Questions about our plans? 
            <Link href="/contact" className="hover:underline ml-1" style={{ color: `hsl(var(--primary))` }}>
              Contact our sales team
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}