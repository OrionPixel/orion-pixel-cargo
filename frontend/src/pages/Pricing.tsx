import React from "react";
import { Link } from "wouter";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import Footer from "@/components/shared/Footer";
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
  ArrowRight
} from "lucide-react";

export default function Pricing() {
  const plans = [
    {
      name: "Professional",
      price: "₹2,999",
      period: "per month",
      description: "Perfect for growing businesses with comprehensive logistics management",
      icon: Zap,
      color: "text-primary-500",
      bgColor: "bg-primary-500",
      features: [
        "Unlimited bookings management",
        "Real-time GPS tracking",
        "Vehicle fleet management", 
        "Warehouse operations",
        "Advanced analytics & reports",
        "Payment tracking",
        "Barcode & QR code generation",
        "Agent management system",
        "Mobile app access",
        "Email support",
        "PDF export functionality",
        "Multi-user dashboard",
        "Commission tracking"
      ],
      limitations: [],
      cta: "Start 14-Day Trial",
      popular: true
    },
    {
      name: "Enterprise",
      price: "₹4,999",
      period: "per month",
      description: "For large enterprises with complex logistics and custom requirements",
      icon: Crown,
      color: "text-purple-500",
      bgColor: "bg-purple-500",
      features: [
        "Everything in Professional",
        "Unlimited agents & users",
        "White-label solutions",
        "Custom integrations",
        "Priority support (24/7)",
        "Advanced reporting suite",
        "Custom workflows",
        "API access",
        "Dedicated account manager",
        "SLA guarantees",
        "Custom theme branding",
        "Advanced security features",
        "On-premise deployment option"
      ],
      limitations: [],
      cta: "Start 14-Day Trial",
      popular: false
    }
  ];

  const features = [
    {
      category: "Booking Management",
      items: [
        { name: "Unlimited bookings", professional: true, enterprise: true },
        { name: "FTL, LTL, Part Load", professional: true, enterprise: true },
        { name: "Dynamic pricing calculation", professional: true, enterprise: true },
        { name: "Payment tracking", professional: true, enterprise: true },
        { name: "Barcode & QR generation", professional: true, enterprise: true },
        { name: "PDF export", professional: true, enterprise: true }
      ]
    },
    {
      category: "Fleet & Tracking",
      items: [
        { name: "Real-time GPS tracking", professional: "Advanced", enterprise: "Premium" },
        { name: "Vehicle management", professional: true, enterprise: true },
        { name: "Route monitoring", professional: true, enterprise: true },
        { name: "Live tracking map", professional: true, enterprise: true },
        { name: "ETA calculations", professional: true, enterprise: true },
        { name: "GPS device integration", professional: "Standard", enterprise: "Advanced" }
      ]
    },
    {
      category: "Operations",
      items: [
        { name: "Warehouse management", professional: true, enterprise: true },
        { name: "Agent management", professional: "Up to 10", enterprise: "Unlimited" },
        { name: "Commission tracking", professional: true, enterprise: true },
        { name: "Multi-user dashboard", professional: true, enterprise: true },
        { name: "Role-based access", professional: "Basic", enterprise: "Advanced" },
        { name: "Custom workflows", professional: false, enterprise: true }
      ]
    },
    {
      category: "Analytics & Reports",
      items: [
        { name: "Advanced analytics", professional: true, enterprise: true },
        { name: "Performance metrics", professional: true, enterprise: true },
        { name: "Revenue tracking", professional: true, enterprise: true },
        { name: "Custom reports", professional: "Standard", enterprise: "Advanced" },
        { name: "Data export", professional: "PDF, Excel", enterprise: "All formats" },
        { name: "Business intelligence", professional: false, enterprise: true }
      ]
    },
    {
      category: "Support & Customization",
      items: [
        { name: "Email support", professional: true, enterprise: true },
        { name: "Priority support", professional: "Business hours", enterprise: "24/7" },
        { name: "Custom theme branding", professional: false, enterprise: true },
        { name: "API access", professional: false, enterprise: true },
        { name: "White-label solution", professional: false, enterprise: true },
        { name: "Dedicated account manager", professional: false, enterprise: true }
      ]
    }
  ];

  const faqs = [
    {
      question: "Can I change my plan anytime?",
      answer: "Yes, you can upgrade or downgrade your plan at any time. Changes take effect immediately and you'll be charged prorated amounts."
    },
    {
      question: "What payment methods do you accept?",
      answer: "We accept all major credit cards, debit cards, net banking, UPI, and digital wallets. Enterprise customers can also pay via bank transfer."
    },
    {
      question: "Is there a free trial available?",
      answer: "Yes, Professional and Enterprise plans come with a 14-day free trial. No credit card required to start your trial."
    },
    {
      question: "Do you offer custom pricing for large volumes?",
      answer: "Yes, we offer custom pricing for enterprises with high-volume requirements. Contact our sales team for a personalized quote."
    },
    {
      question: "What happens if I exceed my plan limits?",
      answer: "We'll notify you when you're approaching your limits. You can upgrade your plan or purchase additional capacity as needed."
    },
    {
      question: "Is there a setup fee?",
      answer: "No setup fees for any plan. You only pay the monthly subscription fee. Enterprise customers may have custom setup requirements."
    }
  ];

  const renderFeatureValue = (value: boolean | string) => {
    if (value === true) {
      return <CheckCircle className="h-5 w-5 text-green-500" />;
    } else if (value === false) {
      return <X className="h-5 w-5 text-gray-400" />;
    } else {
      return <span className="text-sm text-text-secondary">{value}</span>;
    }
  };

  return (
    <div className="min-h-screen bg-background">
      {/* Navigation */}
      <nav className="fixed top-0 w-full bg-surface/95 backdrop-blur-md border-b border-border z-50">
        <div className="max-w-7xl mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <Link href="/">
              <div className="flex items-center gap-2">
                <Package className="h-8 w-8" style={{ color: `hsl(var(--primary))` }} />
                <span className="text-2xl font-bold" style={{ color: `hsl(var(--primary))` }}>LogiGoFast</span>
              </div>
            </Link>
            <div className="hidden md:flex items-center gap-8">
              <Link href="/" className="text-text-secondary transition-colors hover:text-primary-500">Home</Link>
              <Link href="/about" className="text-text-secondary transition-colors hover:text-primary-500">About</Link>
              <Link href="/features" className="text-text-secondary transition-colors hover:text-primary-500">Features</Link>
              <Link href="/pricing" className="font-medium" style={{ color: `hsl(var(--primary))` }}>Pricing</Link>
              <Link href="/contact" className="text-text-secondary transition-colors hover:text-primary-500">Contact</Link>
              <Link href="/sign-in">
                <Button 
                  className="text-white rounded-full px-6"
                  style={{ 
                    backgroundColor: `hsl(var(--primary))`,
                    borderColor: `hsl(var(--primary))`
                  }}
                >
                  Sign In
                </Button>
              </Link>
            </div>
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="pt-24 pb-16 bg-gradient-to-br from-background to-secondary-100">
        <div className="max-w-6xl mx-auto px-4 text-center">
          <Badge 
            variant="outline" 
            className="mb-6"
            style={{
              borderColor: `hsl(var(--primary))`,
              color: `hsl(var(--primary))`
            }}
          >
            <Star className="h-4 w-4 mr-1" />
            Simple Pricing
          </Badge>
          <h1 className="text-5xl md:text-6xl font-bold mb-6 text-text-primary">
            Choose Your
            <br />
            <span style={{ color: `hsl(var(--primary))` }}>Perfect Plan</span>
          </h1>
          <p className="text-xl max-w-3xl mx-auto leading-relaxed text-text-secondary">
            Transparent pricing with no hidden fees. Start free and scale as your business grows.
          </p>
        </div>
      </section>

      {/* Pricing Plans */}
      <section className="py-20 bg-background">
        <div className="max-w-7xl mx-auto px-4">
          <div className="grid md:grid-cols-2 gap-8 max-w-5xl mx-auto">
            {plans.map((plan, index) => (
              <Card key={index} className={`relative text-center bg-surface border-2 transition-all duration-300 hover:shadow-xl ${plan.popular ? 'border-primary-500 shadow-lg' : 'border-border hover:border-primary-500'}`}>
                {plan.popular && (
                  <div className="absolute -top-4 left-1/2 transform -translate-x-1/2">
                    <Badge className="bg-primary-500 text-white px-4 py-1">Most Popular</Badge>
                  </div>
                )}
                <CardContent className="p-8">
                  <div className={`w-16 h-16 ${plan.bgColor} rounded-xl flex items-center justify-center mx-auto mb-6`}>
                    <plan.icon className="h-8 w-8 text-white" />
                  </div>
                  <h3 className="text-2xl font-bold mb-2 text-text-primary">{plan.name}</h3>
                  <div className="mb-4">
                    <span className="text-4xl font-bold text-text-primary">{plan.price}</span>
                    {plan.period !== "Contact us" && <span className="text-text-secondary">/{plan.period}</span>}
                  </div>
                  <p className="text-text-secondary mb-8">{plan.description}</p>
                  
                  <div className="space-y-3 mb-8">
                    {plan.features.map((feature, idx) => (
                      <div key={idx} className="flex items-center text-sm">
                        <CheckCircle className="h-4 w-4 text-green-500 mr-3 flex-shrink-0" />
                        <span className="text-text-secondary">{feature}</span>
                      </div>
                    ))}
                    {plan.limitations.map((limitation, idx) => (
                      <div key={idx} className="flex items-center text-sm opacity-60">
                        <X className="h-4 w-4 text-gray-400 mr-3 flex-shrink-0" />
                        <span className="text-text-secondary">{limitation}</span>
                      </div>
                    ))}
                  </div>
                  
                  <Link href="/sign-in">
                    <Button 
                      className={`w-full py-3 rounded-full font-semibold ${
                        plan.popular 
                          ? 'bg-primary-500 hover:bg-primary-600 text-white' 
                          : 'border-primary-500 text-primary-500 hover:bg-primary-100'
                      }`}
                      variant={plan.popular ? "default" : "outline"}
                    >
                      {plan.cta}
                      <ArrowRight className="ml-2 h-4 w-4" />
                    </Button>
                  </Link>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* Feature Comparison */}
      <section className="py-20 bg-secondary-100">
        <div className="max-w-7xl mx-auto px-4">
          <div className="text-center mb-16">
            <h2 className="text-4xl md:text-5xl font-bold mb-6 text-text-primary">
              Detailed Comparison
            </h2>
            <p className="text-xl max-w-4xl mx-auto leading-relaxed text-text-secondary">
              Compare features across all plans to find the perfect fit for your business
            </p>
          </div>
          
          <div className="bg-surface rounded-2xl overflow-hidden border border-border">
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-primary-500 text-white">
                  <tr>
                    <th className="text-left p-6 font-semibold">Features</th>
                    <th className="text-center p-6 font-semibold">Professional</th>
                    <th className="text-center p-6 font-semibold">Enterprise</th>
                  </tr>
                </thead>
                <tbody>
                  {features.map((category, categoryIndex) => (
                    <React.Fragment key={categoryIndex}>
                      <tr className="bg-secondary-100">
                        <td colSpan={3} className="p-4 font-semibold text-text-primary">{category.category}</td>
                      </tr>
                      {category.items.map((item, itemIndex) => (
                        <tr key={itemIndex} className="border-b border-border">
                          <td className="p-4 text-text-primary">{item.name}</td>
                          <td className="p-4 text-center">{renderFeatureValue(item.professional)}</td>
                          <td className="p-4 text-center">{renderFeatureValue(item.enterprise)}</td>
                        </tr>
                      ))}
                    </React.Fragment>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </section>

      {/* FAQ Section */}
      <section className="py-20 bg-background">
        <div className="max-w-4xl mx-auto px-4">
          <div className="text-center mb-16">
            <h2 className="text-4xl md:text-5xl font-bold mb-6 text-text-primary">
              Frequently Asked Questions
            </h2>
            <p className="text-xl leading-relaxed text-text-secondary">
              Got questions? We've got answers.
            </p>
          </div>
          
          <div className="space-y-6">
            {faqs.map((faq, index) => (
              <Card 
                key={index} 
                className="bg-surface border-2 transition-all duration-300"
                style={{
                  borderColor: index % 2 === 0 ? `hsl(var(--primary) / 0.3)` : `hsl(var(--accent) / 0.3)`
                }}
              >
                <CardContent className="p-6">
                  <h3 className="text-lg font-semibold mb-3 text-text-primary">{faq.question}</h3>
                  <p className="text-text-secondary leading-relaxed">{faq.answer}</p>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* Enterprise CTA */}
      <section className="py-20 bg-primary-500">
        <div className="max-w-6xl mx-auto px-4">
          <div className="grid md:grid-cols-2 gap-12 items-center">
            <div className="text-white">
              <h2 className="text-4xl md:text-5xl font-bold mb-6">
                Need Something Custom?
              </h2>
              <p className="text-xl mb-8 text-white/90 leading-relaxed">
                Our Enterprise plan can be tailored to your specific requirements. 
                Talk to our sales team about custom features, integrations, and pricing.
              </p>
              <div className="flex flex-col sm:flex-row gap-4">
                <Link href="/contact">
                  <Button size="lg" className="bg-white text-primary-500 hover:bg-gray-100 font-semibold px-8 py-3 rounded-full">
                    <Phone className="mr-2 h-5 w-5" />
                    Contact Sales
                  </Button>
                </Link>
                <Link href="/sign-in">
                  <Button variant="outline" size="lg" className="border-white text-white hover:bg-white hover:text-primary-500 font-semibold px-8 py-3 rounded-full">
                    Start Free Trial
                  </Button>
                </Link>
              </div>
            </div>
            <div className="bg-white/10 rounded-2xl p-8">
              <h3 className="text-2xl font-bold text-white mb-6">Enterprise Features</h3>
              <div className="space-y-4 text-white">
                <div className="flex items-center">
                  <CheckCircle className="h-5 w-5 mr-3 flex-shrink-0" />
                  <span>Dedicated account manager</span>
                </div>
                <div className="flex items-center">
                  <CheckCircle className="h-5 w-5 mr-3 flex-shrink-0" />
                  <span>Custom integrations</span>
                </div>
                <div className="flex items-center">
                  <CheckCircle className="h-5 w-5 mr-3 flex-shrink-0" />
                  <span>White-label solutions</span>
                </div>
                <div className="flex items-center">
                  <CheckCircle className="h-5 w-5 mr-3 flex-shrink-0" />
                  <span>99.9% SLA guarantee</span>
                </div>
                <div className="flex items-center">
                  <CheckCircle className="h-5 w-5 mr-3 flex-shrink-0" />
                  <span>On-premise deployment</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Final CTA */}
      <section className="py-20 bg-secondary-100">
        <div className="max-w-4xl mx-auto text-center px-4">
          <h2 className="text-4xl md:text-5xl font-bold mb-6 text-text-primary">
            Ready to Get Started?
          </h2>
          <p className="text-xl mb-8 text-text-secondary leading-relaxed">
            Join thousands of businesses already using CargoFlow to streamline their logistics operations.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link href="/sign-in">
              <Button size="lg" className="bg-primary-500 hover:bg-primary-600 text-white font-semibold px-8 py-3 rounded-full">
                Start Free Today
              </Button>
            </Link>
            <Link href="/contact">
              <Button variant="outline" size="lg" className="border-primary-500 text-primary-500 hover:bg-primary-100 font-semibold px-8 py-3 rounded-full">
                Talk to Sales
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