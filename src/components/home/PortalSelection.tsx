import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Users, Building2, ArrowRight, CheckCircle2 } from "lucide-react";

const PortalSelection = () => {
  const employeeFeatures = [
    "Free registration",
    "Build professional profile",
    "Get discovered by top retailers",
    "Earn rewards & certifications",
  ];

  const employerFeatures = [
    "Access verified candidates",
    "Advanced filter & search",
    "Conduct skill tests",
    "Hire with confidence",
  ];

  return (
    <section className="py-20 bg-background">
      <div className="container mx-auto px-4">
        <div className="text-center mb-12 animate-slide-up">
          <h2 className="font-display text-3xl md:text-4xl font-bold text-foreground mb-4">
            Choose Your Portal
          </h2>
          <p className="text-muted-foreground text-lg max-w-2xl mx-auto">
            Whether you're looking for your next opportunity or searching for the perfect candidate, we've got you covered.
          </p>
        </div>

        <div className="grid md:grid-cols-2 gap-8 max-w-5xl mx-auto">
          {/* Employee Portal Card */}
          <div className="group relative bg-card rounded-2xl border border-border p-8 hover:shadow-xl hover:shadow-primary/5 transition-all duration-300 hover:-translate-y-1 animate-slide-up-delay-1">
            <div className="absolute inset-0 rounded-2xl gradient-bg-primary opacity-0 group-hover:opacity-5 transition-opacity duration-300" />
            
            <div className="relative">
              <div className="w-16 h-16 rounded-2xl bg-primary/10 flex items-center justify-center mb-6 group-hover:scale-110 transition-transform duration-300">
                <Users className="w-8 h-8 text-primary" />
              </div>

              <h3 className="font-display text-2xl font-bold text-foreground mb-2">
                I'm Looking for a Job
              </h3>
              <p className="text-muted-foreground mb-6">
                Create your profile, showcase your skills, and get hired by top retail companies.
              </p>

              <ul className="space-y-3 mb-8">
                {employeeFeatures.map((feature, index) => (
                  <li key={index} className="flex items-center gap-2 text-sm text-foreground">
                    <CheckCircle2 className="w-5 h-5 text-success" />
                    {feature}
                  </li>
                ))}
              </ul>

              <Button variant="hero" size="lg" className="w-full group/btn" asChild>
                <Link to="/employee/register">
                  Register as Employee
                  <ArrowRight className="w-5 h-5 group-hover/btn:translate-x-1 transition-transform" />
                </Link>
              </Button>

              <p className="text-center text-sm text-muted-foreground mt-4">
                Already registered?{" "}
                <Link to="/employee/login" className="text-primary hover:underline font-medium">
                  Login here
                </Link>
              </p>
            </div>
          </div>

          {/* Employer Portal Card */}
          <div className="group relative bg-card rounded-2xl border border-border p-8 hover:shadow-xl hover:shadow-accent/5 transition-all duration-300 hover:-translate-y-1 animate-slide-up-delay-2">
            <div className="absolute inset-0 rounded-2xl bg-accent opacity-0 group-hover:opacity-5 transition-opacity duration-300" />
            
            <div className="relative">
              <div className="w-16 h-16 rounded-2xl bg-accent/10 flex items-center justify-center mb-6 group-hover:scale-110 transition-transform duration-300">
                <Building2 className="w-8 h-8 text-accent" />
              </div>

              <h3 className="font-display text-2xl font-bold text-foreground mb-2">
                I'm Hiring Candidates
              </h3>
              <p className="text-muted-foreground mb-6">
                Find verified, skilled candidates for your retail positions quickly and efficiently.
              </p>

              <ul className="space-y-3 mb-8">
                {employerFeatures.map((feature, index) => (
                  <li key={index} className="flex items-center gap-2 text-sm text-foreground">
                    <CheckCircle2 className="w-5 h-5 text-success" />
                    {feature}
                  </li>
                ))}
              </ul>

              <Button variant="accent" size="lg" className="w-full group/btn" asChild>
                <Link to="/employer/register">
                  Register as Employer
                  <ArrowRight className="w-5 h-5 group-hover/btn:translate-x-1 transition-transform" />
                </Link>
              </Button>

              <p className="text-center text-sm text-muted-foreground mt-4">
                Already registered?{" "}
                <Link to="/employer/login" className="text-accent hover:underline font-medium">
                  Login here
                </Link>
              </p>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};

export default PortalSelection;
