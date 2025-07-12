import { useState } from "react";
import { Link } from "wouter";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/hooks/use-toast";
import { Toaster } from "@/components/ui/toaster";
import Footer from "@/components/shared/Footer";
import { 
  Package, 
  Phone, 
  Mail, 
  MapPin, 
  Clock, 
  MessageCircle, 
  Send, 
  CheckCircle,
  Users,
  Headphones,
  FileText,
  Zap
} from "lucide-react";

export default function Contact() {
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    company: "",
    phone: "",
    subject: "",
    message: ""
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitSuccess, setSubmitSuccess] = useState(false);
  const { toast } = useToast();

  const contactInfo = [
    {
      icon: Phone,
      title: "Phone Support",
      description: "Speak with our support team",
      value: "+91 7000758030",
      availability: "Mon-Fri 9AM-6PM IST"
    },
    {
      icon: Mail,
      title: "Email Support", 
      description: "Send us an email anytime",
      value: "support@logigofast.com",
      availability: "24/7 Response"
    },
    {
      icon: MapPin,
      title: "Head Office",
      description: "Visit our main office",
      value: "LIG, Indore 452011",
      availability: "Mon-Fri 9AM-6PM"
    },
    {
      icon: MessageCircle,
      title: "Live Chat",
      description: "Chat with our team instantly",
      value: "Available on website",
      availability: "Mon-Fri 9AM-9PM IST"
    }
  ];

  const supportOptions = [
    {
      icon: Headphones,
      title: "Technical Support",
      description: "Get help with platform features and integrations",
      action: "Contact Tech Support"
    },
    {
      icon: Users,
      title: "Sales Inquiry",
      description: "Learn about pricing and custom solutions",
      action: "Talk to Sales"
    },
    {
      icon: FileText,
      title: "Documentation",
      description: "Browse our comprehensive help center",
      action: "View Docs"
    },
    {
      icon: Zap,
      title: "Feature Request",
      description: "Suggest new features or improvements",
      action: "Submit Request"
    }
  ];

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (isSubmitting) return;
    
    setIsSubmitting(true);
    
    try {
      const submissionData = {
        firstName: formData.name.split(' ')[0] || formData.name,
        lastName: formData.name.split(' ').slice(1).join(' ') || '',
        email: formData.email,
        phone: formData.phone || null,
        company: formData.company || null,
        message: `Subject: ${formData.subject}\n\n${formData.message}`
      };

      const response = await fetch('/api/contact', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(submissionData)
      });

      if (!response.ok) {
        throw new Error('Failed to submit contact form');
      }

      const result = await response.json();
      
      setSubmitSuccess(true);
      setFormData({
        name: "",
        email: "",
        company: "",
        phone: "",
        subject: "",
        message: ""
      });

      toast({
        title: "Message Sent Successfully!",
        description: "We'll get back to you within 24 hours.",
      });

    } catch (error) {
      console.error('Contact form submission error:', error);
      toast({
        title: "Submission Failed",
        description: "Please try again or contact us directly.",
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
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
                <Package className="h-8 w-8 text-primary-500" />
                <span className="text-2xl font-bold text-primary-500">LogiGoFast</span>
              </div>
            </Link>
            <div className="hidden md:flex items-center gap-8">
              <Link href="/" className="text-text-secondary hover:text-primary-500 transition-colors">Home</Link>
              <Link href="/about" className="text-text-secondary hover:text-primary-500 transition-colors">About</Link>
              <Link href="/features" className="text-text-secondary hover:text-primary-500 transition-colors">Features</Link>
              <Link href="/pricing" className="text-text-secondary hover:text-primary-500 transition-colors">Pricing</Link>
              <Link href="/contact" className="font-medium text-primary-500">Contact</Link>
              <Link href="/sign-in">
                <Button className="bg-primary-500 hover:bg-primary-600 text-white rounded-full px-6">Sign In</Button>
              </Link>
            </div>
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="pt-24 pb-16 bg-gradient-to-br from-background to-secondary-100">
        <div className="max-w-6xl mx-auto px-4 text-center">
          <Badge variant="outline" className="mb-6 border-primary-500 text-primary-500">
            <MessageCircle className="h-4 w-4 mr-1" />
            Get in Touch
          </Badge>
          <h1 className="text-5xl md:text-6xl font-bold mb-6 text-text-primary">
            We're Here to
            <br />
            <span className="text-primary-500">Help You</span>
          </h1>
          <p className="text-xl max-w-3xl mx-auto leading-relaxed text-text-secondary">
            Have questions about LogiGoFast? Need technical support? Want to explore enterprise solutions? 
            Our team is ready to assist you every step of the way.
          </p>
        </div>
      </section>

      {/* Contact Information */}
      <section className="py-20 bg-background">
        <div className="max-w-7xl mx-auto px-4">
          <div className="text-center mb-16">
            <h2 className="text-4xl md:text-5xl font-bold mb-6 text-text-primary">
              Multiple Ways to Reach Us
            </h2>
            <p className="text-xl max-w-4xl mx-auto leading-relaxed text-text-secondary">
              Choose the contact method that works best for you
            </p>
          </div>
          
          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-8">
            {contactInfo.map((info, index) => {
              // For 4 cards: primary, accent, primary, accent
              const isEven = index % 2 === 0;
              return (
                <Card 
                  key={index} 
                  className="text-center bg-surface border-2 transition-all duration-300 hover:shadow-lg"
                  style={{
                    borderColor: isEven ? `hsl(var(--primary) / 0.3)` : `hsl(var(--accent) / 0.3)`
                  }}
                >
                  <CardContent className="p-8">
                    <div 
                      className="w-16 h-16 rounded-xl flex items-center justify-center mx-auto mb-6"
                      style={{
                        backgroundColor: isEven ? `hsl(var(--primary))` : `hsl(var(--accent))`
                      }}
                    >
                      <info.icon className="h-8 w-8 text-white" />
                    </div>
                  <h3 className="text-xl font-semibold mb-2 text-text-primary">{info.title}</h3>
                  <p className="text-text-secondary mb-4">{info.description}</p>
                  <p 
                    className="font-semibold mb-2"
                    style={{
                      color: index % 2 === 0 ? `hsl(var(--primary))` : `hsl(var(--accent))`
                    }}
                  >
                    {info.value}
                  </p>
                  <p className="text-sm text-text-secondary">{info.availability}</p>
                </CardContent>
              </Card>
              );
            })}
          </div>
        </div>
      </section>

      {/* Contact Form */}
      <section className="py-20 bg-secondary-100">
        <div className="max-w-4xl mx-auto px-4">
          <div className="text-center mb-16">
            <h2 className="text-4xl md:text-5xl font-bold mb-6 text-text-primary">
              Send Us a Message
            </h2>
            <p className="text-xl leading-relaxed text-text-secondary">
              Fill out the form below and we'll get back to you within 24 hours
            </p>
          </div>
          
          <Card className="bg-surface border-2 border-primary-500/20">
            <CardContent className="p-8">
              <form onSubmit={handleSubmit} className="space-y-6">
                <div className="grid md:grid-cols-2 gap-6">
                  <div>
                    <label htmlFor="name" className="block text-sm font-medium text-text-primary mb-2">
                      Full Name *
                    </label>
                    <Input
                      id="name"
                      name="name"
                      type="text"
                      required
                      value={formData.name}
                      onChange={handleInputChange}
                      className="w-full"
                      placeholder="Enter your full name"
                    />
                  </div>
                  <div>
                    <label htmlFor="email" className="block text-sm font-medium text-text-primary mb-2">
                      Email Address *
                    </label>
                    <Input
                      id="email"
                      name="email"
                      type="email"
                      required
                      value={formData.email}
                      onChange={handleInputChange}
                      className="w-full"
                      placeholder="Enter your email"
                    />
                  </div>
                </div>
                
                <div className="grid md:grid-cols-2 gap-6">
                  <div>
                    <label htmlFor="company" className="block text-sm font-medium text-text-primary mb-2">
                      Company Name
                    </label>
                    <Input
                      id="company"
                      name="company"
                      type="text"
                      value={formData.company}
                      onChange={handleInputChange}
                      className="w-full"
                      placeholder="Enter company name"
                    />
                  </div>
                  <div>
                    <label htmlFor="phone" className="block text-sm font-medium text-text-primary mb-2">
                      Phone Number
                    </label>
                    <Input
                      id="phone"
                      name="phone"
                      type="tel"
                      value={formData.phone}
                      onChange={handleInputChange}
                      className="w-full"
                      placeholder="Enter phone number"
                    />
                  </div>
                </div>
                
                <div>
                  <label htmlFor="subject" className="block text-sm font-medium text-text-primary mb-2">
                    Subject *
                  </label>
                  <Input
                    id="subject"
                    name="subject"
                    type="text"
                    required
                    value={formData.subject}
                    onChange={handleInputChange}
                    className="w-full"
                    placeholder="What can we help you with?"
                  />
                </div>
                
                <div>
                  <label htmlFor="message" className="block text-sm font-medium text-text-primary mb-2">
                    Message *
                  </label>
                  <Textarea
                    id="message"
                    name="message"
                    required
                    value={formData.message}
                    onChange={handleInputChange}
                    className="w-full h-32"
                    placeholder="Tell us more about your inquiry..."
                  />
                </div>
                
                <Button 
                  type="submit" 
                  size="lg" 
                  disabled={isSubmitting}
                  className="w-full bg-primary-500 hover:bg-primary-600 disabled:bg-gray-400 text-white font-semibold py-3 rounded-full transition-colors"
                >
                  {isSubmitting ? (
                    <>
                      <div className="mr-2 h-5 w-5 animate-spin border-2 border-white border-t-transparent rounded-full" />
                      Sending...
                    </>
                  ) : submitSuccess ? (
                    <>
                      <CheckCircle className="mr-2 h-5 w-5" />
                      Sent Successfully!
                    </>
                  ) : (
                    <>
                      <Send className="mr-2 h-5 w-5" />
                      Send Message
                    </>
                  )}
                </Button>
              </form>
            </CardContent>
          </Card>
        </div>
      </section>

      {/* Support Options */}
      <section className="py-20 bg-background">
        <div className="max-w-7xl mx-auto px-4">
          <div className="text-center mb-16">
            <h2 className="text-4xl md:text-5xl font-bold mb-6 text-text-primary">
              More Ways We Can Help
            </h2>
            <p className="text-xl max-w-4xl mx-auto leading-relaxed text-text-secondary">
              Explore our support resources and get the help you need
            </p>
          </div>
          
          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-8">
            {supportOptions.map((option, index) => {
              // For 4 cards: primary, accent, primary, accent
              const isEven = index % 2 === 0;
              return (
                <Card 
                  key={index} 
                  className="text-center bg-surface border-2 transition-all duration-300 hover:shadow-lg hover:-translate-y-2"
                  style={{
                    borderColor: `hsl(var(--${isEven ? 'primary' : 'accent'}) / 0.5)`
                  }}
                >
                  <CardContent className="p-8">
                    <div 
                      className="w-16 h-16 rounded-xl flex items-center justify-center mx-auto mb-6"
                      style={{
                        backgroundColor: isEven ? `hsl(var(--primary))` : `hsl(var(--accent))`
                      }}
                    >
                      <option.icon className="h-8 w-8 text-white" />
                    </div>
                    <h3 className="text-xl font-semibold mb-3 text-text-primary">{option.title}</h3>
                    <p className="text-text-secondary mb-6 leading-relaxed">{option.description}</p>
                    <Button 
                      variant="outline" 
                      className="rounded-full px-6"
                      style={{
                        borderColor: isEven ? `hsl(var(--primary))` : `hsl(var(--accent))`,
                        color: isEven ? `hsl(var(--primary))` : `hsl(var(--accent))`
                      }}
                    >
                      {option.action}
                    </Button>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        </div>
      </section>

      {/* FAQ Quick Links */}
      <section className="py-20 bg-secondary-100">
        <div className="max-w-6xl mx-auto px-4">
          <div className="text-center mb-16">
            <h2 className="text-4xl md:text-5xl font-bold mb-6 text-text-primary">
              Quick Answers
            </h2>
            <p className="text-xl leading-relaxed text-text-secondary">
              Find answers to commonly asked questions
            </p>
          </div>
          
          <div className="grid md:grid-cols-2 gap-8">
            <Card className="bg-surface border-2 hover:border-primary-500 transition-all duration-300">
              <CardContent className="p-8">
                <h3 className="text-xl font-semibold mb-4 text-text-primary">How do I get started?</h3>
                <p className="text-text-secondary mb-4">
                  Simply sign up for a free account, verify your profile, and start creating your first shipment booking. 
                  Our onboarding process will guide you through each step.
                </p>
                <Link href="/sign-in">
                  <Button className="bg-primary-500 hover:bg-primary-600 text-white rounded-full px-6">
                    Sign Up Now
                  </Button>
                </Link>
              </CardContent>
            </Card>
            
            <Card className="bg-surface border-2 hover:border-primary-500 transition-all duration-300">
              <CardContent className="p-8">
                <h3 className="text-xl font-semibold mb-4 text-text-primary">What are your rates?</h3>
                <p className="text-text-secondary mb-4">
                  Our pricing is transparent and competitive. We offer multiple plans including a free starter option. 
                  Check our pricing page for detailed information.
                </p>
                <Link href="/pricing">
                  <Button variant="outline" className="border-primary-500 text-primary-500 hover:bg-primary-100 rounded-full px-6">
                    View Pricing
                  </Button>
                </Link>
              </CardContent>
            </Card>
            
            <Card className="bg-surface border-2 hover:border-primary-500 transition-all duration-300">
              <CardContent className="p-8">
                <h3 className="text-xl font-semibold mb-4 text-text-primary">Do you offer training?</h3>
                <p className="text-text-secondary mb-4">
                  Yes! We provide comprehensive training and onboarding for all our customers. 
                  Our team will help you get the most out of LogiGoFast.
                </p>
                <Button variant="outline" className="border-primary-500 text-primary-500 hover:bg-primary-100 rounded-full px-6">
                  Learn More
                </Button>
              </CardContent>
            </Card>
            
            <Card className="bg-surface border-2 hover:border-primary-500 transition-all duration-300">
              <CardContent className="p-8">
                <h3 className="text-xl font-semibold mb-4 text-text-primary">Is my data secure?</h3>
                <p className="text-text-secondary mb-4">
                  Absolutely. We use enterprise-grade security measures including end-to-end encryption, 
                  secure data centers, and regular security audits to protect your information.
                </p>
                <Button variant="outline" className="border-primary-500 text-primary-500 hover:bg-primary-100 rounded-full px-6">
                  Security Details
                </Button>
              </CardContent>
            </Card>
          </div>
        </div>
      </section>

      {/* Office Hours */}
      <section className="py-20 bg-primary-500">
        <div className="max-w-4xl mx-auto text-center px-4">
          <h2 className="text-4xl md:text-5xl font-bold mb-6 text-white">
            Our Support Hours
          </h2>
          <p className="text-xl mb-8 text-white/90 leading-relaxed">
            We're here when you need us most
          </p>
          
          <div className="grid md:grid-cols-3 gap-8 text-white">
            <div>
              <Clock className="h-12 w-12 mx-auto mb-4" />
              <h3 className="text-xl font-semibold mb-2">Phone Support</h3>
              <p>Monday - Friday</p>
              <p>9:00 AM - 6:00 PM IST</p>
            </div>
            <div>
              <MessageCircle className="h-12 w-12 mx-auto mb-4" />
              <h3 className="text-xl font-semibold mb-2">Live Chat</h3>
              <p>Monday - Friday</p>
              <p>9:00 AM - 9:00 PM IST</p>
            </div>
            <div>
              <Mail className="h-12 w-12 mx-auto mb-4" />
              <h3 className="text-xl font-semibold mb-2">Email Support</h3>
              <p>24/7 Availability</p>
              <p>Response within 24 hours</p>
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <Footer />
      <Toaster />
    </div>
  );
}