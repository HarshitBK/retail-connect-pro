import { Link } from "react-router-dom";
import { Briefcase, Mail, Phone, MapPin } from "lucide-react";

const Footer = () => {
  return (
    <footer className="bg-foreground text-primary-foreground">
      <div className="container mx-auto px-4 py-12">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
          {/* Brand */}
          <div className="space-y-4">
            <Link to="/" className="flex items-center gap-2">
              <div className="w-10 h-10 rounded-xl gradient-bg-hero flex items-center justify-center">
                <Briefcase className="w-5 h-5 text-primary-foreground" />
              </div>
              <span className="font-display font-bold text-xl">
                Retail<span className="text-accent">Hire</span>
              </span>
            </Link>
            <p className="text-primary-foreground/70 text-sm leading-relaxed">
              Connecting retail businesses with skilled professionals. Your trusted partner for blue-collar hiring.
            </p>
          </div>

          {/* Quick Links */}
          <div>
            <h4 className="font-display font-semibold text-lg mb-4">Quick Links</h4>
            <ul className="space-y-2">
              <li>
                <Link to="/employee/register" className="text-primary-foreground/70 hover:text-accent text-sm transition-colors">
                  Find Jobs
                </Link>
              </li>
              <li>
                <Link to="/employer/register" className="text-primary-foreground/70 hover:text-accent text-sm transition-colors">
                  Hire Candidates
                </Link>
              </li>
              <li>
                <Link to="/about" className="text-primary-foreground/70 hover:text-accent text-sm transition-colors">
                  About Us
                </Link>
              </li>
              <li>
                <Link to="/contact" className="text-primary-foreground/70 hover:text-accent text-sm transition-colors">
                  Contact
                </Link>
              </li>
            </ul>
          </div>

          {/* For Employers */}
          <div>
            <h4 className="font-display font-semibold text-lg mb-4">For Employers</h4>
            <ul className="space-y-2">
              <li>
                <Link to="/employer/register" className="text-primary-foreground/70 hover:text-accent text-sm transition-colors">
                  Register Company
                </Link>
              </li>
              <li>
                <Link to="/pricing" className="text-primary-foreground/70 hover:text-accent text-sm transition-colors">
                  Pricing
                </Link>
              </li>
              <li>
                <Link to="/employer/tests" className="text-primary-foreground/70 hover:text-accent text-sm transition-colors">
                  Create Tests
                </Link>
              </li>
            </ul>
          </div>

          {/* Contact */}
          <div>
            <h4 className="font-display font-semibold text-lg mb-4">Contact Us</h4>
            <ul className="space-y-3">
              <li className="flex items-center gap-2 text-primary-foreground/70 text-sm">
                <Mail className="w-4 h-4 text-accent" />
                support@retailhire.com
              </li>
              <li className="flex items-center gap-2 text-primary-foreground/70 text-sm">+91 98765 43210
                <Phone className="w-4 h-4 text-accent" />
                +91 98765 43210
              </li>
              <li className="flex items-start gap-2 text-primary-foreground/70 text-sm">
                <MapPin className="w-4 h-4 text-accent mt-0.5" />
                Mumbai, Maharashtra, India
              </li>
            </ul>
          </div>
        </div>

        <div className="border-t border-primary-foreground/10 mt-10 pt-6 flex flex-col md:flex-row justify-between items-center gap-4">
          <p className="text-primary-foreground/50 text-sm">
            © 2024 RetailHire. All rights reserved.
          </p>
          <div className="flex gap-6">
            <Link to="/privacy" className="text-primary-foreground/50 hover:text-accent text-sm transition-colors">
              Privacy Policy
            </Link>
            <Link to="/terms" className="text-primary-foreground/50 hover:text-accent text-sm transition-colors">
              Terms of Service
            </Link>
          </div>
        </div>
      </div>
    </footer>);

};

export default Footer;