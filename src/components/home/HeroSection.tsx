import { Button } from "@/components/ui/button";
import { Link } from "react-router-dom";
import { ArrowRight, Users, Building2, Award, TrendingUp } from "lucide-react";

const HeroSection = () => {
  const stats = [
  { icon: Users, value: "50,000+", label: "Registered Candidates" },
  { icon: Building2, value: "2,500+", label: "Partner Companies" },
  { icon: Award, value: "10,000+", label: "Successful Placements" },
  { icon: TrendingUp, value: "95%", label: "Satisfaction Rate" }];


  return (
    <section className="relative min-h-screen flex items-center justify-center overflow-hidden pt-16">
      {/* Background */}
      <div className="absolute inset-0 bg-gradient-to-br from-primary/5 via-background to-accent/5" />
      <div className="absolute top-20 right-10 w-72 h-72 bg-primary/10 rounded-full blur-3xl animate-pulse-slow" />
      <div className="absolute bottom-20 left-10 w-96 h-96 bg-accent/10 rounded-full blur-3xl animate-pulse-slow" />

      <div className="container mx-auto px-4 py-20 relative z-10">
        <div className="max-w-4xl mx-auto text-center">
          <div className="inline-flex items-center gap-2 px-4 py-2 bg-primary/10 rounded-full text-primary text-sm font-medium mb-6 animate-slide-up">Trusted by 2,500+ retail companies
            <span className="w-2 h-2 bg-success rounded-full animate-pulse" />
            Trusted by 2,500+ retail companies
          </div>

          <h1 className="font-display text-4xl md:text-5xl lg:text-6xl font-bold text-foreground leading-tight mb-6 animate-slide-up-delay-1">
            India's #1 Platform for{" "}
            <span className="gradient-text">Retail Hiring</span>
          </h1>

          <p className="text-lg md:text-xl text-muted-foreground max-w-2xl mx-auto mb-10 animate-slide-up-delay-2">
            Connect with verified candidates for cashiers, salesmen, inventory managers, security, and more. Hire smarter, faster, and with confidence.
          </p>

          <div className="flex flex-col sm:flex-row gap-4 justify-center mb-16 animate-slide-up-delay-3">
            <Button variant="hero" size="xl" asChild>
              <Link to="/employee/register">
                Find a Job
                <ArrowRight className="w-5 h-5" />
              </Link>
            </Button>
            <Button variant="outline" size="xl" asChild>
              <Link to="/employer/register">
                Hire Candidates
              </Link>
            </Button>
          </div>

          {/* Stats */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
            {stats.map((stat, index) =>
            <div
              key={index}
              className="glass-card rounded-xl p-6 animate-scale-in"
              style={{ animationDelay: `${0.4 + index * 0.1}s` }}>

                <stat.icon className="w-8 h-8 text-primary mx-auto mb-3" />
                <div className="font-display text-2xl md:text-3xl font-bold text-foreground">
                  {stat.value}
                </div>
                <div className="text-sm text-muted-foreground">{stat.label}</div>
              </div>
            )}
          </div>
        </div>
      </div>
    </section>);

};

export default HeroSection;