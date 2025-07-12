import { useState, useEffect } from "react";
import { Link } from "wouter";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";

import Footer from "@/components/shared/Footer";
import companyLogo from "@/assets/new-company-logo.png";
import customIcon from "@assets/logo 2_1751792580183.png";

import { 
  Package, 
  Truck, 
  MapPin, 
  Shield, 
  Star, 
  Clock, 
  TrendingUp, 
  Users, 
  Globe,
  CheckCircle,
  ArrowRight,
  Menu,
  X,
  Zap,
  BarChart3,
  FileText,
  Smartphone
} from "lucide-react";

export default function Landing() {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [fastCounter, setFastCounter] = useState(0);
  
  // Scroll to top on page load
  useEffect(() => { window.scrollTo(0, 0); }, []);

  // Counter animation for "Fast" text
  useEffect(() => {
    const targetText = "Fast";
    let currentIndex = 0;
    
    const interval = setInterval(() => {
      if (currentIndex <= targetText.length) {
        setFastCounter(currentIndex);
        currentIndex++;
      } else {
        clearInterval(interval);
      }
    }, 150); // Speed of typing animation

    return () => clearInterval(interval);
  }, []);

  const stats = [
    { icon: Package, number: "50K+", label: "Shipments Delivered" },
    { icon: Users, number: "1,200+", label: "Happy Customers" },
    { icon: Globe, number: "500+", label: "Cities Covered" },
    { icon: Star, number: "4.9", label: "Customer Rating" }
  ];

  const features = [
    { 
      title: "Smart Booking System", 
      description: "AI-powered booking with dynamic pricing, route optimization, and automated documentation", 
      icon: Package 
    },
    { 
      title: "Real-time GPS Tracking", 
      description: "Live location updates, delivery notifications, and route monitoring with ETA predictions", 
      icon: MapPin 
    },
    { 
      title: "Secure Payments", 
      description: "End-to-end encrypted transactions with multiple payment options and automated billing", 
      icon: Shield 
    },
    { 
      title: "Analytics Dashboard", 
      description: "Comprehensive insights with performance metrics, cost analysis, and growth tracking", 
      icon: BarChart3 
    },
    { 
      title: "Fleet Management", 
      description: "Complete vehicle and driver management with maintenance alerts and fuel monitoring", 
      icon: Truck 
    },
    { 
      title: "Team Collaboration", 
      description: "Multi-user access with role-based permissions and real-time communication tools", 
      icon: Users 
    }
  ];

  const testimonials = [
    {
      name: "Rajesh Kumar",
      company: "Mumbai Logistics Ltd.",
      role: "CEO",
      content: "LogiGoFast revolutionized our operations. We've reduced delivery times by 40% and our customers love the real-time tracking.",
      rating: 5
    },
    {
      name: "Priya Sharma", 
      company: "Delhi Transport Co.",
      role: "Operations Manager",
      content: "The best logistics platform we've used. Automated billing and route optimization saved us ₹2 lakhs monthly.",
      rating: 5
    },
    {
      name: "Amit Singh",
      company: "Bangalore Freight Services", 
      role: "Founder",
      content: "Outstanding customer support and powerful features. Our business grew 60% after implementing LogiGoFast.",
      rating: 5
    }
  ];

  return (
    <div className="website-scope min-h-screen bg-background font-sans">

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
                className="transition-colors hover:opacity-80"
                style={{ color: `hsl(var(--muted-foreground))` }}
              >
                Pricing
              </Link>
              <Link href="/contact" 
                className="transition-colors hover:opacity-80"
                style={{ color: `hsl(var(--muted-foreground))` }}
              >
                Contact
              </Link>
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

            {/* Mobile menu button */}
            <div className="md:hidden">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
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
                  <Link href="/sign-in">
                    <Button 
                      className="w-full text-white rounded-full"
                      style={{ backgroundColor: `hsl(var(--accent))` }}
                      onClick={() => setIsMobileMenuOpen(false)}
                    >
                      Sign In
                    </Button>
                  </Link>
                </div>
              </div>
            </div>
          )}
        </div>
      </nav>

      {/* Hero Section */}
      <section 
        className="pb-16 pt-20"
        style={{ 
          background: `linear-gradient(135deg, hsl(var(--background)) 0%, hsl(var(--secondary) / 0.1) 100%)`
        }}
      >
        <div className="max-w-7xl mx-auto px-4">
          <div className="grid lg:grid-cols-2 gap-12 items-center">
            {/* Left Content */}
            <div className="text-center lg:text-left">
              <Badge 
                variant="outline" 
                className="mb-6"
                style={{ 
                  borderColor: `hsl(var(--primary))`,
                  color: `hsl(var(--primary))`
                }}
              >
                <Truck className="h-4 w-4 mr-1" />
                India's Leading Cargo Platform
              </Badge>
              <h1 
                className="text-5xl md:text-7xl font-bold mb-8"
                style={{ 
                  color: `hsl(var(--foreground))`, 
                  lineHeight: '1.2', 
                  letterSpacing: '-0.02em'
                }}
              >
                <div className="space-y-2">
                  <div>
                    <span className="inline-block">
                      {"Fast".substring(0, fastCounter)}
                      {fastCounter < 4 && <span className="animate-pulse">|</span>}
                    </span>,{" "}
                    <span className="inline-block animate-pulse" style={{ animationDelay: "0.5s" }}>Reliable</span>
                  </div>
                  <div 
                    className="inline-block animate-pulse bg-gradient-to-r from-primary-500 to-accent-500 bg-clip-text text-transparent"
                    style={{ 
                      animationDelay: "1s",
                      paddingTop: "0.5rem",
                      paddingBottom: "0.5rem"
                    }}
                  >
                    Cargo Solutions
                  </div>
                </div>
              </h1>
              <p 
                className="text-xl max-w-3xl mx-auto lg:mx-0 mb-8 leading-relaxed"
                style={{ color: `hsl(var(--muted-foreground))` }}
              >
                Connect transporters and distributors across India. Track shipments in real-time, 
                manage your fleet efficiently, and grow your logistics business with our comprehensive platform.
              </p>
              <div className="flex flex-col sm:flex-row items-center justify-center lg:justify-start gap-4 max-w-md mx-auto lg:mx-0">
                <Link href="/signup" className="w-full">
                  <Button 
                    size="lg" 
                    className="w-full text-lg py-6 text-white rounded-full hover:opacity-90 transition-all"
                    style={{ 
                      backgroundColor: `hsl(var(--primary))`
                    }}
                  >
                    <img 
                      src={companyLogo}
                      alt="Company Logo"
                      className="h-5 w-5 mr-2 object-contain" 
                    />
                    Start Shipping Today
                  </Button>
                </Link>
                <Link href="/contact" className="w-full">
                  <Button 
                    variant="outline" 
                    size="lg" 
                    className="w-full text-lg py-6 rounded-full hover:opacity-80 transition-all border-2"
                    style={{ 
                      borderColor: `hsl(var(--accent))`,
                      color: `hsl(var(--accent))`,
                      backgroundColor: 'transparent'
                    }}
                    onMouseEnter={(e) => {
                      e.currentTarget.style.backgroundColor = `hsl(var(--accent) / 0.1)`;
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.backgroundColor = 'transparent';
                    }}
                  >
                    Schedule Demo
                  </Button>
                </Link>
              </div>
            </div>

            {/* Right Side - Clean Visual */}
            <div className="relative h-96 lg:h-[500px] flex items-center justify-center">
              <div className="text-center">
                <div className="mb-8">
                  <Package 
                    className="w-32 h-32 mx-auto animate-pulse" 
                    style={{ color: `hsl(var(--primary))` }}
                  />
                </div>
                <h3 
                  className="text-2xl font-bold mb-4"
                  style={{ color: `hsl(var(--primary))` }}
                >
                  Trusted by 10,000+ Businesses
                </h3>
                <p 
                  className="text-lg"
                  style={{ color: `hsl(var(--muted-foreground))` }}
                >
                  Join the logistics revolution today
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Stats Section */}
      <section 
        className="py-16"
        style={{ 
          backgroundColor: `hsl(var(--primary))` 
        }}
      >
        <div className="max-w-7xl mx-auto px-4">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8 text-center text-white">
            {stats.map((stat, index) => (
              <div key={index} className="flex flex-col items-center">
                <div 
                  className="w-16 h-16 rounded-full flex items-center justify-center mb-4 backdrop-blur-md border border-white/20"
                  style={{ 
                    backgroundColor: index % 2 === 0 
                      ? `rgba(255, 255, 255, 0.15)` 
                      : `rgba(255, 255, 255, 0.1)`,
                    boxShadow: '0 4px 15px 0 rgba(255, 255, 255, 0.1)'
                  }}
                >
                  <stat.icon className="h-8 w-8" />
                </div>
                <div className="text-3xl md:text-4xl font-bold mb-2">
                  {stat.number}
                </div>
                <div className="font-medium opacity-90">{stat.label}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="py-20 bg-background">
        <div className="max-w-7xl mx-auto px-4">
          <div className="text-center mb-16">
            <Badge variant="outline" className="mb-4 border-primary-500 text-primary-500">
              <Star className="h-4 w-4 mr-1" />
              Powerful Features
            </Badge>
            <h2 className="text-4xl md:text-5xl font-bold mb-6 text-text-primary">
              Everything You Need for Modern Logistics
            </h2>
            <p className="text-xl max-w-4xl mx-auto leading-relaxed text-text-secondary">
              Comprehensive logistics management platform with cutting-edge technology to streamline your cargo operations and boost efficiency.
            </p>
          </div>
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
            {features.map((feature, index) => (
              <Card 
                key={index} 
                className="text-center hover:shadow-lg transition-all duration-300 bg-surface border-2 hover:-translate-y-2"
                style={{
                  borderColor: index % 2 === 0 ? `hsl(var(--primary) / 0.3)` : `hsl(var(--accent) / 0.3)`
                }}
              >
                <CardContent className="p-8">
                  <div 
                    className="w-16 h-16 rounded-xl flex items-center justify-center mx-auto mb-6 shadow-lg"
                    style={{
                      backgroundColor: index % 2 === 0 ? `hsl(var(--primary))` : `hsl(var(--accent))`
                    }}
                  >
                    <feature.icon className="h-8 w-8 text-white" />
                  </div>
                  <h3 className="text-xl font-semibold mb-3 text-text-primary">{feature.title}</h3>
                  <p className="leading-relaxed text-text-secondary">{feature.description}</p>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* How It Works Section */}
      <section className="py-20 bg-secondary-100">
        <div className="max-w-7xl mx-auto px-4">
          <div className="text-center mb-16">
            <Badge variant="outline" className="mb-4 border-primary-500 text-primary-500">
              <BarChart3 className="h-4 w-4 mr-1" />
              Simple Process
            </Badge>
            <h2 className="text-4xl md:text-5xl font-bold mb-6 text-text-primary">
              How LogiGoFast Works
            </h2>
            <p className="text-xl max-w-4xl mx-auto leading-relaxed text-text-secondary">
              Get started with our streamlined process in just a few simple steps
            </p>
          </div>
          
          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-8">
            <div className="text-center">
              <div className="w-16 h-16 bg-primary-500 rounded-full flex items-center justify-center mx-auto mb-6">
                <span className="text-white font-bold text-xl">1</span>
              </div>
              <h3 className="text-xl font-semibold mb-3 text-text-primary">Register & Verify</h3>
              <p className="text-text-secondary">Sign up and complete your profile verification to get started with LogiGoFast.</p>
            </div>
            
            <div className="text-center">
              <div className="w-16 h-16 bg-primary-500 rounded-full flex items-center justify-center mx-auto mb-6">
                <span className="text-white font-bold text-xl">2</span>
              </div>
              <h3 className="text-xl font-semibold mb-3 text-text-primary">Create Booking</h3>
              <p className="text-text-secondary">Enter shipment details, select vehicle type, and get instant pricing quotes.</p>
            </div>
            
            <div className="text-center">
              <div className="w-16 h-16 bg-primary-500 rounded-full flex items-center justify-center mx-auto mb-6">
                <span className="text-white font-bold text-xl">3</span>
              </div>
              <h3 className="text-xl font-semibold mb-3 text-text-primary">Track & Monitor</h3>
              <p className="text-text-secondary">Real-time GPS tracking with live updates and delivery notifications.</p>
            </div>
            
            <div className="text-center">
              <div className="w-16 h-16 bg-primary-500 rounded-full flex items-center justify-center mx-auto mb-6">
                <span className="text-white font-bold text-xl">4</span>
              </div>
              <h3 className="text-xl font-semibold mb-3 text-text-primary">Complete & Pay</h3>
              <p className="text-text-secondary">Automated delivery confirmation and secure payment processing.</p>
            </div>
          </div>
        </div>
      </section>

      {/* Testimonials Section */}
      <section className="py-20 bg-background">
        <div className="max-w-7xl mx-auto px-4">
          <div className="text-center mb-16">
            <Badge variant="outline" className="mb-4 border-primary-500 text-primary-500">
              <Users className="h-4 w-4 mr-1" />
              Customer Stories
            </Badge>
            <h2 className="text-4xl md:text-5xl font-bold mb-6 text-text-primary">
              What Our Customers Say
            </h2>
            <p className="text-xl max-w-4xl mx-auto leading-relaxed text-text-secondary">
              Join thousands of satisfied customers who trust LogiGoFast for their logistics needs
            </p>
          </div>
          
          <div className="grid md:grid-cols-3 gap-8">
            {testimonials.map((testimonial, index) => (
              <Card key={index} className="bg-surface border-2 hover:border-primary-500 transition-all duration-300">
                <CardContent className="p-8">
                  <div className="flex mb-4">
                    {[...Array(testimonial.rating)].map((_, i) => (
                      <Star key={i} className="w-5 h-5 text-primary-500 fill-current" />
                    ))}
                  </div>
                  <p className="text-text-secondary italic mb-6 leading-relaxed">"{testimonial.content}"</p>
                  <div className="flex items-center">
                    <div className="w-12 h-12 bg-primary-500 rounded-full flex items-center justify-center mr-4">
                      <span className="text-white font-bold">{testimonial.name.charAt(0)}</span>
                    </div>
                    <div>
                      <h4 className="font-semibold text-text-primary">{testimonial.name}</h4>
                      <p className="text-text-secondary text-sm">{testimonial.role}, {testimonial.company}</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section 
        className="py-20"
        style={{ 
          backgroundColor: `hsl(var(--primary))` 
        }}
      >
        <div className="max-w-4xl mx-auto text-center px-4">
          <h2 className="text-4xl md:text-5xl font-bold mb-6 text-white">
            Ready to Transform Your Logistics?
          </h2>
          <p className="text-xl mb-8 text-white/90 leading-relaxed">
            Join thousands of transporters and distributors who trust LogiGoFast for their cargo management needs.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link href="/sign-in">
              <Button 
                size="lg" 
                className="text-white font-semibold px-8 py-3 rounded-full hover:opacity-90"
                style={{ 
                  backgroundColor: `hsl(var(--accent))`,
                  border: `2px solid hsl(var(--accent))`
                }}
              >
                Get Started Free
                <ArrowRight className="ml-2 h-5 w-5" />
              </Button>
            </Link>
            <Link href="/contact">
              <Button 
                variant="outline" 
                size="lg" 
                className="text-white font-semibold px-8 py-3 rounded-full border-2 transition-all duration-300"
                style={{ 
                  borderColor: `hsl(var(--accent))`,
                  backgroundColor: `hsl(var(--accent) / 0.1)`,
                  color: 'white'
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.backgroundColor = `hsl(var(--accent))`;
                  e.currentTarget.style.color = 'white';
                  e.currentTarget.style.transform = 'translateY(-2px)';
                  e.currentTarget.style.boxShadow = `0 8px 25px hsl(var(--accent) / 0.3)`;
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.backgroundColor = `hsl(var(--accent) / 0.1)`;
                  e.currentTarget.style.color = 'white';
                  e.currentTarget.style.transform = 'translateY(0px)';
                  e.currentTarget.style.boxShadow = 'none';
                }}
              >
                Schedule Demo
              </Button>
            </Link>
          </div>
        </div>
      </section>

      {/* Footer */}
      <Footer />
    </div>
  );
}