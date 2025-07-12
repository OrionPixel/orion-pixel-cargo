import { Facebook, Twitter, Linkedin, Instagram, Package, Phone, Mail, MapPin } from "lucide-react";
import companyLogo from "@/assets/new-company-logo.png";
import customIcon from "@assets/logo 2_1751792580183.png";

export default function Footer() {
  const currentYear = new Date().getFullYear();

  return (
    <footer className="bg-gray-900 text-white border-t border-gray-800">
      <div className="max-w-7xl mx-auto px-4 py-12">
        <div className="grid md:grid-cols-4 gap-8">
          {/* Company Info */}
          <div className="space-y-4">
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
            <p className="text-gray-300 leading-relaxed">
              Your trusted partner for fast, reliable cargo solutions across India. 
              Streamline your logistics operations with our comprehensive platform.
            </p>
            <div className="flex space-x-4">
              <a href="#" className="text-white hover:text-primary transition-colors">
                <Facebook className="h-5 w-5" />
              </a>
              <a href="#" className="text-white hover:text-primary transition-colors">
                <Twitter className="h-5 w-5" />
              </a>
              <a href="#" className="text-white hover:text-primary transition-colors">
                <Linkedin className="h-5 w-5" />
              </a>
              <a href="#" className="text-white hover:text-primary transition-colors">
                <Instagram className="h-5 w-5" />
              </a>
            </div>
          </div>

          {/* Quick Links */}
          <div>
            <h3 className="text-lg font-semibold mb-4 text-white">Quick Links</h3>
            <ul className="space-y-2">
              <li><a href="/about" className="text-gray-300 hover:text-white transition-colors">About Us</a></li>
              <li><a href="/features" className="text-gray-300 hover:text-white transition-colors">Features</a></li>
              <li><a href="/pricing" className="text-gray-300 hover:text-white transition-colors">Pricing</a></li>
              <li><a href="/contact" className="text-gray-300 hover:text-white transition-colors">Contact</a></li>
              <li><a href="/sign-in" className="text-gray-300 hover:text-white transition-colors">Sign In</a></li>
            </ul>
          </div>

          {/* Services */}
          <div>
            <h3 className="text-lg font-semibold mb-4 text-white">Services</h3>
            <ul className="space-y-2">
              <li><span className="text-gray-300">Full Truck Load (FTL)</span></li>
              <li><span className="text-gray-300">Less Than Truck Load (LTL)</span></li>
              <li><span className="text-gray-300">Part Load</span></li>
              <li><span className="text-gray-300">GPS Tracking</span></li>
              <li><span className="text-gray-300">Warehouse Management</span></li>
            </ul>
          </div>

          {/* Contact Info */}
          <div>
            <h3 className="text-lg font-semibold mb-4 text-white">Contact Info</h3>
            <div className="space-y-3">
              <div className="flex items-center gap-3">
                <Phone className="h-5 w-5 text-primary flex-shrink-0" />
                <span className="text-white font-medium">+91 7000758030</span>
              </div>
              <div className="flex items-center gap-3">
                <Phone className="h-5 w-5 text-primary flex-shrink-0" />
                <span className="text-white font-medium">+91 9956937731</span>
              </div>
              <div className="flex items-center gap-3">
                <Mail className="h-5 w-5 text-primary flex-shrink-0" />
                <span className="text-white font-medium">support@logigofast.com</span>
              </div>
              <div className="flex items-start gap-3">
                <MapPin className="h-5 w-5 mt-1 text-primary flex-shrink-0" />
                <span className="text-white font-medium">
                  LIG, Indore 452011<br />
                  Madhya Pradesh, India
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Bottom Section */}
        <div className="border-t border-gray-800 mt-8 pt-8 text-center">
          <p className="text-gray-400">
            © {currentYear} LogiGoFast. All rights reserved. 
            Built with ❤️ for the logistics industry.
          </p>
        </div>
      </div>
    </footer>
  );
}