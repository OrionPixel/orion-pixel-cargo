import { Link } from "wouter";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import Footer from "@/components/shared/Footer";
import { 
  Package, 
  Users, 
  Target, 
  Heart, 
  MapPin, 
  TrendingUp, 
  Shield, 
  Globe,
  Award,
  Zap
} from "lucide-react";

export default function About() {
  const values = [
    {
      title: "Innovation",
      description: "Continuously pushing the boundaries of logistics technology to deliver cutting-edge solutions",
      icon: Zap
    },
    {
      title: "Reliability", 
      description: "Building trust through consistent, dependable service that our customers can count on",
      icon: Shield
    },
    {
      title: "Growth",
      description: "Empowering businesses to scale and expand their operations with our comprehensive platform",
      icon: TrendingUp
    },
    {
      title: "Excellence",
      description: "Committed to delivering the highest quality service and exceeding customer expectations",
      icon: Award
    }
  ];

  const team = [
    {
      name: "Adarsh Yadav",
      role: "CEO & Co-Founder",
      bio: "Former logistics executive with 15+ years experience. Led digital transformation at major freight companies.",
      image: "AY"
    },
    {
      name: "Vaibhav Singh Sengar",
      role: "CTO & Co-Founder", 
      bio: "Tech veteran with expertise in AI/ML and real-time systems. Previously built scalable platforms at unicorn startups.",
      image: "VS"
    },
    {
      name: "Tanmay Singh",
      role: "VP of Operations",
      bio: "Operations specialist who optimized supply chains for Fortune 500 companies. Expert in process automation.",
      image: "TS"
    },
    {
      name: "Rachna Yadav",
      role: "Head of Product",
      bio: "Product leader focused on user experience. Built award-winning mobile apps used by millions of users.",
      image: "RY"
    }
  ];

  const stats = [
    { number: "2019", label: "Founded" },
    { number: "50K+", label: "Shipments Monthly" },
    { number: "1,200+", label: "Active Customers" },
    { number: "₹500Cr+", label: "Cargo Value Processed" }
  ];

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
              <Link href="/about" className="font-medium text-primary-500">About</Link>
              <Link href="/features" className="text-text-secondary hover:text-primary-500 transition-colors">Features</Link>
              <Link href="/pricing" className="text-text-secondary hover:text-primary-500 transition-colors">Pricing</Link>
              <Link href="/contact" className="text-text-secondary hover:text-primary-500 transition-colors">Contact</Link>
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
            <Heart className="h-4 w-4 mr-1" />
            Our Story
          </Badge>
          <h1 className="text-5xl md:text-6xl font-bold mb-6 text-text-primary">
            Transforming
            <br />
            <span className="text-primary-500">India's Logistics</span>
          </h1>
          <p className="text-xl max-w-3xl mx-auto leading-relaxed text-text-secondary">
            Founded in 2019, CargoFlow was born from a simple idea: make logistics accessible, 
            transparent, and efficient for every business in India. Today, we're the leading 
            platform connecting transporters and distributors nationwide.
          </p>
        </div>
      </section>

      {/* Stats Section */}
      <section className="py-16 bg-primary-500">
        <div className="max-w-6xl mx-auto px-4">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8 text-center text-white">
            {stats.map((stat, index) => (
              <div key={index}>
                <div className="text-4xl md:text-5xl font-bold mb-2">{stat.number}</div>
                <div className="font-medium opacity-90">{stat.label}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Mission & Vision */}
      <section className="py-20 bg-background">
        <div className="max-w-6xl mx-auto px-4">
          <div className="grid md:grid-cols-2 gap-12">
            <Card 
              className="bg-surface border-2"
              style={{
                borderColor: `hsl(var(--primary) / 0.2)`
              }}
            >
              <CardContent className="p-8">
                <div 
                  className="w-16 h-16 rounded-xl flex items-center justify-center mb-6"
                  style={{
                    backgroundColor: `hsl(var(--primary))`
                  }}
                >
                  <Target className="h-8 w-8 text-white" />
                </div>
                <h2 className="text-3xl font-bold mb-4 text-text-primary">Our Mission</h2>
                <p className="text-lg leading-relaxed text-text-secondary">
                  To democratize logistics by providing technology-driven solutions that connect 
                  businesses of all sizes, enabling efficient and cost-effective cargo transportation 
                  across India while supporting the growth of our partners.
                </p>
              </CardContent>
            </Card>
            
            <Card 
              className="bg-surface border-2"
              style={{
                borderColor: `hsl(var(--accent) / 0.2)`
              }}
            >
              <CardContent className="p-8">
                <div 
                  className="w-16 h-16 rounded-xl flex items-center justify-center mb-6"
                  style={{
                    backgroundColor: `hsl(var(--accent))`
                  }}
                >
                  <Globe className="h-8 w-8 text-white" />
                </div>
                <h2 className="text-3xl font-bold mb-4 text-text-primary">Our Vision</h2>
                <p className="text-lg leading-relaxed text-text-secondary">
                  To become India's most trusted logistics ecosystem, where every shipment is 
                  tracked, every delivery is on time, and every business has access to world-class 
                  transportation solutions regardless of their size or location.
                </p>
              </CardContent>
            </Card>
          </div>
        </div>
      </section>

      {/* Values Section */}
      <section className="py-20 bg-secondary-100">
        <div className="max-w-6xl mx-auto px-4">
          <div className="text-center mb-16">
            <Badge variant="outline" className="mb-4 border-primary-500 text-primary-500">
              <Heart className="h-4 w-4 mr-1" />
              Our Values
            </Badge>
            <h2 className="text-4xl md:text-5xl font-bold mb-6 text-text-primary">
              What Drives Us Forward
            </h2>
            <p className="text-xl max-w-4xl mx-auto leading-relaxed text-text-secondary">
              Our core values guide every decision we make and every solution we build
            </p>
          </div>
          
          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-8">
            {values.map((value, index) => (
              <Card 
                key={index} 
                className="text-center bg-surface border-2 transition-all duration-300"
                style={{
                  borderColor: index % 2 === 0 ? `hsl(var(--primary) / 0.3)` : `hsl(var(--accent) / 0.3)`
                }}
              >
                <CardContent className="p-8">
                  <div 
                    className="w-16 h-16 rounded-xl flex items-center justify-center mx-auto mb-6"
                    style={{
                      backgroundColor: index % 2 === 0 ? `hsl(var(--primary))` : `hsl(var(--accent))`
                    }}
                  >
                    <value.icon className="h-8 w-8 text-white" />
                  </div>
                  <h3 className="text-xl font-semibold mb-3 text-text-primary">{value.title}</h3>
                  <p className="leading-relaxed text-text-secondary">{value.description}</p>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* Team Section */}
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
              <Users className="h-4 w-4 mr-1" />
              Leadership Team
            </Badge>
            <h2 className="text-4xl md:text-5xl font-bold mb-6 text-text-primary">
              Meet Our Leaders
            </h2>
            <p className="text-xl max-w-4xl mx-auto leading-relaxed text-text-secondary">
              Experienced professionals passionate about revolutionizing India's logistics industry
            </p>
          </div>
          
          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-8">
            {team.map((member, index) => (
              <Card 
                key={index} 
                className="text-center bg-surface border-2 transition-all duration-300"
                style={{
                  borderColor: index % 2 === 0 ? `hsl(var(--primary) / 0.3)` : `hsl(var(--accent) / 0.3)`
                }}
              >
                <CardContent className="p-8">
                  <div 
                    className="w-20 h-20 rounded-full flex items-center justify-center mx-auto mb-6"
                    style={{
                      backgroundColor: index % 2 === 0 ? `hsl(var(--primary))` : `hsl(var(--accent))`
                    }}
                  >
                    <span className="text-white font-bold text-xl">{member.image}</span>
                  </div>
                  <h3 className="text-xl font-semibold mb-1 text-text-primary">{member.name}</h3>
                  <p 
                    className="font-medium mb-4"
                    style={{
                      color: index % 2 === 0 ? `hsl(var(--primary))` : `hsl(var(--accent))`
                    }}
                  >
                    {member.role}
                  </p>
                  <p className="text-sm leading-relaxed text-text-secondary">{member.bio}</p>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* Our Journey */}
      <section className="py-20 bg-secondary-100">
        <div className="max-w-6xl mx-auto px-4">
          <div className="text-center mb-16">
            <Badge variant="outline" className="mb-4 border-primary-500 text-primary-500">
              <MapPin className="h-4 w-4 mr-1" />
              Our Journey
            </Badge>
            <h2 className="text-4xl md:text-5xl font-bold mb-6 text-text-primary">
              Milestones That Matter
            </h2>
          </div>
          
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
            <Card className="bg-surface border-2 border-primary-500/20">
              <CardContent className="p-8">
                <div className="text-3xl font-bold text-primary-500 mb-4">2019</div>
                <h3 className="text-xl font-semibold mb-3 text-text-primary">Company Founded</h3>
                <p className="text-text-secondary">Started with a vision to digitize India's logistics industry</p>
              </CardContent>
            </Card>
            
            <Card className="bg-surface border-2 border-primary-500/20">
              <CardContent className="p-8">
                <div className="text-3xl font-bold text-primary-500 mb-4">2020</div>
                <h3 className="text-xl font-semibold mb-3 text-text-primary">First 1000 Shipments</h3>
                <p className="text-text-secondary">Reached our first major milestone during challenging times</p>
              </CardContent>
            </Card>
            
            <Card className="bg-surface border-2 border-primary-500/20">
              <CardContent className="p-8">
                <div className="text-3xl font-bold text-primary-500 mb-4">2021</div>
                <h3 className="text-xl font-semibold mb-3 text-text-primary">Pan-India Expansion</h3>
                <p className="text-text-secondary">Extended operations to cover 500+ cities across India</p>
              </CardContent>
            </Card>
            
            <Card className="bg-surface border-2 border-primary-500/20">
              <CardContent className="p-8">
                <div className="text-3xl font-bold text-primary-500 mb-4">2022</div>
                <h3 className="text-xl font-semibold mb-3 text-text-primary">AI Integration</h3>
                <p className="text-text-secondary">Launched AI-powered route optimization and demand forecasting</p>
              </CardContent>
            </Card>
            
            <Card className="bg-surface border-2 border-primary-500/20">
              <CardContent className="p-8">
                <div className="text-3xl font-bold text-primary-500 mb-4">2023</div>
                <h3 className="text-xl font-semibold mb-3 text-text-primary">50K Monthly Shipments</h3>
                <p className="text-text-secondary">Crossed major volume milestone with 1000+ active customers</p>
              </CardContent>
            </Card>
            
            <Card className="bg-surface border-2 border-primary-500/20">
              <CardContent className="p-8">
                <div className="text-3xl font-bold text-primary-500 mb-4">2025</div>
                <h3 className="text-xl font-semibold mb-3 text-text-primary">Market Leadership</h3>
                <p className="text-text-secondary">Became India's leading digital logistics platform</p>
              </CardContent>
            </Card>
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
            Ready to Join Our Journey?
          </h2>
          <p className="text-xl mb-8 text-white/90 leading-relaxed">
            Be part of India's logistics transformation. Start shipping with LogiGoFast today.
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
                Get Started Now
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