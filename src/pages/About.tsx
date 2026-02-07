import Header from "@/components/layout/Header";
import Footer from "@/components/layout/Footer";
import { Building2, Users, Target, Award, Shield, Heart } from "lucide-react";

const About = () => {
  return (
    <div className="min-h-screen bg-background">
      <Header />
      
      <main className="pt-24 pb-12">
        {/* Hero Section */}
        <section className="container mx-auto px-4 py-16 text-center">
          <h1 className="font-display text-4xl md:text-5xl font-bold mb-6">
            About <span className="text-primary">RetailJobs</span>
          </h1>
          <p className="text-xl text-muted-foreground max-w-3xl mx-auto">
            Connecting skilled retail professionals with leading organizations across India. 
            We're building the future of blue-collar recruitment.
          </p>
        </section>

        {/* Mission Section */}
        <section className="bg-muted/50 py-16">
          <div className="container mx-auto px-4">
            <div className="grid md:grid-cols-2 gap-12 items-center">
              <div>
                <h2 className="font-display text-3xl font-bold mb-6">Our Mission</h2>
                <p className="text-muted-foreground mb-4">
                  We believe every skilled worker deserves access to quality job opportunities, 
                  and every retailer deserves access to verified, qualified candidates.
                </p>
                <p className="text-muted-foreground">
                  Our platform bridges this gap by providing a transparent, efficient, and 
                  secure hiring ecosystem specifically designed for the retail industry.
                </p>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="bg-background rounded-xl p-6 shadow-sm">
                  <Users className="w-10 h-10 text-primary mb-4" />
                  <h3 className="font-semibold text-2xl mb-1">50,000+</h3>
                  <p className="text-muted-foreground text-sm">Registered Employees</p>
                </div>
                <div className="bg-background rounded-xl p-6 shadow-sm">
                  <Building2 className="w-10 h-10 text-accent mb-4" />
                  <h3 className="font-semibold text-2xl mb-1">2,000+</h3>
                  <p className="text-muted-foreground text-sm">Partner Companies</p>
                </div>
                <div className="bg-background rounded-xl p-6 shadow-sm">
                  <Target className="w-10 h-10 text-green-500 mb-4" />
                  <h3 className="font-semibold text-2xl mb-1">25,000+</h3>
                  <p className="text-muted-foreground text-sm">Successful Placements</p>
                </div>
                <div className="bg-background rounded-xl p-6 shadow-sm">
                  <Award className="w-10 h-10 text-yellow-500 mb-4" />
                  <h3 className="font-semibold text-2xl mb-1">100+</h3>
                  <p className="text-muted-foreground text-sm">Cities Covered</p>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Values Section */}
        <section className="container mx-auto px-4 py-16">
          <h2 className="font-display text-3xl font-bold text-center mb-12">Our Values</h2>
          <div className="grid md:grid-cols-3 gap-8">
            <div className="text-center">
              <div className="w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center mx-auto mb-4">
                <Shield className="w-8 h-8 text-primary" />
              </div>
              <h3 className="font-semibold text-xl mb-2">Trust & Security</h3>
              <p className="text-muted-foreground">
                All profiles are verified. We ensure data privacy and secure transactions 
                for both employers and employees.
              </p>
            </div>
            <div className="text-center">
              <div className="w-16 h-16 bg-accent/10 rounded-full flex items-center justify-center mx-auto mb-4">
                <Target className="w-8 h-8 text-accent" />
              </div>
              <h3 className="font-semibold text-xl mb-2">Transparency</h3>
              <p className="text-muted-foreground">
                Clear pricing, honest reviews, and straightforward processes. 
                No hidden fees or surprises.
              </p>
            </div>
            <div className="text-center">
              <div className="w-16 h-16 bg-green-500/10 rounded-full flex items-center justify-center mx-auto mb-4">
                <Heart className="w-8 h-8 text-green-500" />
              </div>
              <h3 className="font-semibold text-xl mb-2">Empowerment</h3>
              <p className="text-muted-foreground">
                We help workers build their careers through skill certifications, 
                training programs, and reward systems.
              </p>
            </div>
          </div>
        </section>

        {/* How It Works */}
        <section className="bg-gradient-hero py-16">
          <div className="container mx-auto px-4 text-center">
            <h2 className="font-display text-3xl font-bold mb-8 text-primary-foreground">
              Ready to Get Started?
            </h2>
            <p className="text-primary-foreground/80 mb-8 max-w-2xl mx-auto">
              Join thousands of job seekers and employers who trust RetailJobs 
              for their recruitment needs.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <a
                href="/employee/register"
                className="bg-background text-primary px-8 py-3 rounded-lg font-semibold hover:bg-background/90 transition-colors"
              >
                I'm Looking for a Job
              </a>
              <a
                href="/employer/register"
                className="bg-accent text-accent-foreground px-8 py-3 rounded-lg font-semibold hover:bg-accent/90 transition-colors"
              >
                I'm Hiring
              </a>
            </div>
          </div>
        </section>
      </main>

      <Footer />
    </div>
  );
};

export default About;
