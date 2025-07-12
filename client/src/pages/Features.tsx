import { useState } from "react";
import { Link } from "wouter";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import Footer from "@/components/shared/Footer";

import companyLogo from "@/assets/new-company-logo.png";
import customIcon from "@assets/logo 2_1751792580183.png";
import { 
  Package, 
  MapPin, 
  Shield, 
  BarChart3, 
  Truck, 
  Users, 
  Clock, 
  CreditCard, 
  Bell, 
  FileText, 
  Smartphone, 
  Cloud,
  Zap,
  Target,
  Globe,
  CheckCircle,
  Menu,
  X
} from "lucide-react";

export default function Features() {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  
  // Scroll to top on page load
  useState(() => {
    window.scrollTo(0, 0);
  });
  const mainFeatures = [
    {
      title: "Smart Booking System",
      description: "AI-powered booking with dynamic pricing, route optimization, and automated documentation",
      icon: Package,
      features: [
        "Real-time price calculation",
        "Automated quote generation", 
        "Multi-vehicle type support",
        "Bulk booking capabilities"
      ]
    },
    {
      title: "Real-time GPS Tracking",
      description: "Live location updates, delivery notifications, and route monitoring with ETA predictions",
      icon: MapPin,
      features: [
        "Live GPS tracking",
        "Route optimization",
        "ETA predictions",
        "Geofencing alerts"
      ]
    },
    {
      title: "Secure Payment Gateway",
      description: "End-to-end encrypted transactions with multiple payment options and automated billing",
      icon: Shield,
      features: [
        "Multiple payment methods",
        "Automated invoicing",
        "GST compliance",
        "Secure transactions"
      ]
    },
    {
      title: "Analytics Dashboard",
      description: "Comprehensive insights with performance metrics, cost analysis, and growth tracking",
      icon: BarChart3,
      features: [
        "Performance analytics",
        "Cost optimization insights",
        "Custom reports",
        "Revenue tracking"
      ]
    },
    {
      title: "Fleet Management",
      description: "Complete vehicle and driver management with maintenance alerts and fuel monitoring",
      icon: Truck,
      features: [
        "Vehicle tracking",
        "Driver management",
        "Maintenance scheduling",
        "Fuel monitoring"
      ]
    },
    {
      title: "Team Collaboration",
      description: "Multi-user access with role-based permissions and real-time communication tools",
      icon: Users,
      features: [
        "Role-based access",
        "Team messaging",
        "Task assignment",
        "Activity tracking"
      ]
    }
  ];

  const additionalFeatures = [
    { icon: Clock, title: "24/7 Support", description: "Round-the-clock customer support" },
    { icon: CreditCard, title: "Flexible Billing", description: "Multiple payment and billing options" },
    { icon: Bell, title: "Smart Notifications", description: "Real-time alerts and updates" },
    { icon: FileText, title: "Document Management", description: "Digital documentation and e-PODs" },
    { icon: Smartphone, title: "Mobile App", description: "Full-featured mobile applications" },
    { icon: Cloud, title: "Cloud-based", description: "Secure, scalable cloud infrastructure" },
    { icon: Zap, title: "API Integration", description: "Easy integration with existing systems" },
    { icon: Target, title: "Route Optimization", description: "AI-powered route planning" },
    { icon: Globe, title: "Pan-India Coverage", description: "500+ cities and towns covered" }
  ];

  const integrations = [
    "Tally ERP",
    "SAP Business One", 
    "QuickBooks",
    "Zoho Books",
    "GST Portal",
    "FASTag",
    "Digital Payments",
    "WhatsApp Business"
  ];

  return (
    <div className="website-scope min-h-screen bg-background">
      {/* Navigation */}
      <nav className="fixed top-0 w-full bg-surface/95 backdrop-blur-md border-b border-border z-50">
        <div className="max-w-7xl mx-auto px-4 py-4">
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
            <div className="hidden md:flex items-center gap-8">
              <Link href="/" className="text-text-secondary hover:text-primary-500 transition-colors">Home</Link>
              <Link href="/about" className="text-text-secondary hover:text-primary-500 transition-colors">About</Link>
              <Link href="/features" className="font-medium text-primary-500">Features</Link>
              <Link href="/pricing" className="text-text-secondary hover:text-primary-500 transition-colors">Pricing</Link>
              <Link href="/contact" className="text-text-secondary hover:text-primary-500 transition-colors">Contact</Link>
              <Link href="/sign-in">
                <Button className="bg-primary-500 hover:bg-primary-600 text-white rounded-full px-6">Sign In</Button>
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
        </div>

        {/* Mobile Navigation Menu */}
        {isMobileMenuOpen && (
          <div className="md:hidden mt-4 pb-4 border-t" style={{ borderColor: `hsl(var(--border))` }}>
            <div className="flex flex-col space-y-4 pt-4">
              <Link 
                href="/" 
                className="transition-colors px-2 py-1 hover:opacity-80"
                style={{ color: `hsl(var(--muted-foreground))` }}
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
                className="font-medium px-2 py-1"
                style={{ color: `hsl(var(--primary))` }}
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
      </nav>

      {/* Hero Section */}
      <section className="pt-24 pb-16 bg-gradient-to-br from-background to-secondary-100">
        <div className="max-w-6xl mx-auto px-4 text-center">
          <Badge variant="outline" className="mb-6 border-primary-500 text-primary-500">
            <Zap className="h-4 w-4 mr-1" />
            Powerful Features
          </Badge>
          <h1 className="text-5xl md:text-6xl font-bold mb-6 text-text-primary">
            Everything You Need for
            <br />
            <span className="text-primary-500">Modern Logistics</span>
          </h1>
          <p className="text-xl max-w-3xl mx-auto leading-relaxed text-text-secondary">
            Comprehensive logistics management platform with cutting-edge technology to 
            streamline your cargo operations and boost efficiency.
          </p>
        </div>
      </section>

      {/* Main Features Grid */}
      <section className="py-20 bg-background">
        <div className="max-w-7xl mx-auto px-4">
          <div className="text-center mb-16">
            <h2 className="text-4xl md:text-5xl font-bold mb-6 text-text-primary">
              Core Features
            </h2>
            <p className="text-xl max-w-4xl mx-auto leading-relaxed text-text-secondary">
              Powerful tools designed to revolutionize your logistics operations
            </p>
          </div>
          
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
            {mainFeatures.map((feature, index) => (
              <Card key={index} className="text-center hover:shadow-lg transition-all duration-300 bg-surface border-2 hover:border-primary-500 hover:-translate-y-2">
                <CardContent className="p-8">
                  <div className="w-16 h-16 bg-primary-500 rounded-xl flex items-center justify-center mx-auto mb-6 shadow-lg">
                    <feature.icon className="h-8 w-8 text-white" />
                  </div>
                  <h3 className="text-xl font-semibold mb-3 text-text-primary">{feature.title}</h3>
                  <p className="leading-relaxed text-text-secondary mb-6">{feature.description}</p>
                  <div className="space-y-2">
                    {feature.features.map((item, idx) => (
                      <div key={idx} className="flex items-center text-sm text-text-secondary">
                        <CheckCircle className="h-4 w-4 text-primary-500 mr-2 flex-shrink-0" />
                        {item}
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* Additional Features */}
      <section className="py-20 bg-secondary-100">
        <div className="max-w-7xl mx-auto px-4">
          <div className="text-center mb-16">
            <h2 className="text-4xl md:text-5xl font-bold mb-6 text-text-primary">
              Additional Capabilities
            </h2>
            <p className="text-xl max-w-4xl mx-auto leading-relaxed text-text-secondary">
              More features to enhance your logistics experience
            </p>
          </div>
          
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {additionalFeatures.map((feature, index) => (
              <Card 
                key={index} 
                className="bg-surface border-2 transition-all duration-300"
                style={{
                  borderColor: index % 2 === 0 ? `hsl(var(--primary) / 0.3)` : `hsl(var(--accent) / 0.3)`
                }}
              >
                <CardContent className="p-6">
                  <div className="flex items-center mb-4">
                    <div 
                      className="w-12 h-12 rounded-lg flex items-center justify-center mr-4"
                      style={{
                        backgroundColor: index % 2 === 0 ? `hsl(var(--primary))` : `hsl(var(--accent))`
                      }}
                    >
                      <feature.icon className="h-6 w-6 text-white" />
                    </div>
                    <div>
                      <h3 className="font-semibold text-text-primary">{feature.title}</h3>
                      <p className="text-sm text-text-secondary">{feature.description}</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* Feature Spotlight */}
      <section className="py-20 bg-primary-500">
        <div className="max-w-6xl mx-auto px-4">
          <div className="text-center mb-16">
            <h2 className="text-4xl md:text-5xl font-bold mb-6 text-white">
              Advanced Tracking Technology
            </h2>
            <p className="text-xl max-w-3xl mx-auto leading-relaxed text-white/90">
              Industry-leading GPS tracking and route optimization powered by AI
            </p>
          </div>
          
          <div className="grid md:grid-cols-2 gap-12 items-center">
            <div className="text-white">
              <h3 className="text-3xl font-bold mb-6">Real-time Visibility</h3>
              <div className="space-y-4">
                <div className="flex items-center">
                  <CheckCircle className="h-6 w-6 mr-3 flex-shrink-0" />
                  <span>Live GPS tracking with 30-second updates</span>
                </div>
                <div className="flex items-center">
                  <CheckCircle className="h-6 w-6 mr-3 flex-shrink-0" />
                  <span>Geofencing alerts for pickup and delivery</span>
                </div>
                <div className="flex items-center">
                  <CheckCircle className="h-6 w-6 mr-3 flex-shrink-0" />
                  <span>Route deviation notifications</span>
                </div>
                <div className="flex items-center">
                  <CheckCircle className="h-6 w-6 mr-3 flex-shrink-0" />
                  <span>Predictive ETA with 95% accuracy</span>
                </div>
                <div className="flex items-center">
                  <CheckCircle className="h-6 w-6 mr-3 flex-shrink-0" />
                  <span>Temperature and humidity monitoring</span>
                </div>
              </div>
            </div>
            <div className="bg-white/10 rounded-2xl p-8">
              <div className="bg-white rounded-xl p-6 mb-4 shadow-lg text-gray-900">
                <div className="flex items-center justify-between mb-4">
                  <span className="font-semibold text-gray-900">Shipment #CF123456</span>
                  <Badge className="bg-green-500 text-white">In Transit</Badge>
                </div>
                <div className="space-y-3">
                  <div className="flex justify-between text-gray-700">
                    <span>Current Location</span>
                    <span className="font-medium text-gray-900">Pune, MH</span>
                  </div>
                  <div className="flex justify-between text-gray-700">
                    <span>ETA</span>
                    <span className="font-medium text-gray-900">2h 45m</span>
                  </div>
                  <div className="flex justify-between text-gray-700">
                    <span>Distance Remaining</span>
                    <span className="font-medium text-gray-900">142 km</span>
                  </div>
                  <div className="w-full bg-gray-200 rounded-full h-2">
                    <div className="bg-blue-500 rounded-full h-2 w-3/4"></div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Integrations */}
      <section className="py-20 bg-background">
        <div className="max-w-6xl mx-auto px-4">
          <div className="text-center mb-16">
            <Badge 
              variant="outline" 
              className="mb-4"
              style={{
                borderColor: `hsl(var(--primary))`,
                color: `hsl(var(--primary))`
              }}
            >
              <Cloud className="h-4 w-4 mr-1" />
              Integrations
            </Badge>
            <h2 className="text-4xl md:text-5xl font-bold mb-6 text-text-primary">
              Seamless Integrations
            </h2>
            <p className="text-xl max-w-4xl mx-auto leading-relaxed text-text-secondary">
              Connect with your existing systems and tools for a unified workflow
            </p>
          </div>
          
          <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
            {integrations.map((integration, index) => {
              // For integration cards: primary, accent, primary, accent pattern
              const isEven = index % 2 === 0;
              return (
                <Card 
                  key={index} 
                  className="text-center bg-surface border-2 transition-all duration-300"
                  style={{
                    borderColor: `hsl(var(--${isEven ? 'primary' : 'accent'}) / 0.5)`
                  }}
                >
                  <CardContent className="p-6">
                    <div 
                      className="w-12 h-12 rounded-lg flex items-center justify-center mx-auto mb-4"
                      style={{
                        backgroundColor: isEven ? `hsl(var(--primary))` : `hsl(var(--accent))`
                      }}
                    >
                      <span className="text-white font-bold text-sm">{integration.slice(0, 2)}</span>
                    </div>
                    <h3 className="font-semibold text-text-primary text-sm">{integration}</h3>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20 bg-secondary-100">
        <div className="max-w-4xl mx-auto text-center px-4">
          <h2 className="text-4xl md:text-5xl font-bold mb-6 text-text-primary">
            Ready to Experience These Features?
          </h2>
          <p className="text-xl mb-8 text-text-secondary leading-relaxed">
            Join thousands of businesses already using LogiGoFast to streamline their logistics operations.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link href="/sign-in">
              <Button 
                size="lg" 
                className="text-white font-semibold px-8 py-3 rounded-full"
                style={{ 
                  backgroundColor: `hsl(var(--primary))`,
                  borderColor: `hsl(var(--primary))`
                }}
              >
                Start Free Trial
              </Button>
            </Link>
            <Link href="/contact">
              <Button variant="outline" size="lg" className="border-primary-500 text-primary-500 hover:bg-primary-100 font-semibold px-8 py-3 rounded-full">
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