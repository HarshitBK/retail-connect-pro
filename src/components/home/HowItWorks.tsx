import { UserPlus, Search, CheckCircle, Briefcase } from "lucide-react";

const HowItWorks = () => {
  const employeeSteps = [
    {
      icon: UserPlus,
      title: "Register Free",
      description: "Create your profile with personal, professional, and skill details",
    },
    {
      icon: Search,
      title: "Get Discovered",
      description: "Employers search and find candidates matching their requirements",
    },
    {
      icon: Briefcase,
      title: "Get Hired",
      description: "Receive interview calls and land your dream retail job",
    },
  ];

  const employerSteps = [
    {
      icon: UserPlus,
      title: "Register & Subscribe",
      description: "Create your company profile with ₹5,000 annual subscription",
    },
    {
      icon: Search,
      title: "Search Candidates",
      description: "Filter by skills, experience, location, and availability",
    },
    {
      icon: CheckCircle,
      title: "Reserve & Hire",
      description: "Reserve candidates, access details, and hire the best fit",
    },
  ];

  return (
    <section className="py-20 bg-muted/30">
      <div className="container mx-auto px-4">
        <div className="text-center mb-16">
          <h2 className="font-display text-3xl md:text-4xl font-bold text-foreground mb-4">
            How It Works
          </h2>
          <p className="text-muted-foreground text-lg max-w-2xl mx-auto">
            Simple, transparent, and efficient hiring process for everyone
          </p>
        </div>

        <div className="grid lg:grid-cols-2 gap-12 max-w-6xl mx-auto">
          {/* Employee Flow */}
          <div className="space-y-6">
            <div className="inline-flex items-center gap-2 px-4 py-2 bg-primary/10 rounded-full">
              <span className="text-primary font-semibold">For Job Seekers</span>
            </div>

            <div className="space-y-6">
              {employeeSteps.map((step, index) => (
                <div key={index} className="flex gap-4 items-start">
                  <div className="flex-shrink-0">
                    <div className="w-12 h-12 rounded-xl gradient-bg-primary flex items-center justify-center text-primary-foreground font-bold shadow-lg shadow-primary/20">
                      {index + 1}
                    </div>
                  </div>
                  <div className="bg-card rounded-xl p-5 flex-1 border border-border hover:shadow-md transition-shadow">
                    <div className="flex items-center gap-3 mb-2">
                      <step.icon className="w-5 h-5 text-primary" />
                      <h4 className="font-display font-semibold text-foreground">
                        {step.title}
                      </h4>
                    </div>
                    <p className="text-sm text-muted-foreground">
                      {step.description}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Employer Flow */}
          <div className="space-y-6">
            <div className="inline-flex items-center gap-2 px-4 py-2 bg-accent/10 rounded-full">
              <span className="text-accent font-semibold">For Employers</span>
            </div>

            <div className="space-y-6">
              {employerSteps.map((step, index) => (
                <div key={index} className="flex gap-4 items-start">
                  <div className="flex-shrink-0">
                    <div className="w-12 h-12 rounded-xl bg-accent flex items-center justify-center text-accent-foreground font-bold shadow-lg shadow-accent/20">
                      {index + 1}
                    </div>
                  </div>
                  <div className="bg-card rounded-xl p-5 flex-1 border border-border hover:shadow-md transition-shadow">
                    <div className="flex items-center gap-3 mb-2">
                      <step.icon className="w-5 h-5 text-accent" />
                      <h4 className="font-display font-semibold text-foreground">
                        {step.title}
                      </h4>
                    </div>
                    <p className="text-sm text-muted-foreground">
                      {step.description}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};

export default HowItWorks;
