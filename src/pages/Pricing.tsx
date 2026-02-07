import Header from "@/components/layout/Header";
import Footer from "@/components/layout/Footer";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Check, Users, Building2, GraduationCap, ClipboardCheck } from "lucide-react";
import { Link } from "react-router-dom";

const Pricing = () => {
  return (
    <div className="min-h-screen bg-background">
      <Header />
      
      <main className="pt-24 pb-12">
        <div className="container mx-auto px-4 py-12">
          <div className="text-center mb-12">
            <h1 className="font-display text-4xl font-bold mb-4">Simple, Transparent Pricing</h1>
            <p className="text-muted-foreground max-w-2xl mx-auto">
              Choose the plan that's right for you. No hidden fees, no surprises.
            </p>
          </div>

          {/* Main Plans */}
          <div className="grid md:grid-cols-2 gap-8 max-w-4xl mx-auto mb-16">
            {/* Employee Plan */}
            <Card className="relative border-2 border-primary/20">
              <CardHeader className="text-center pb-2">
                <div className="w-12 h-12 bg-primary/10 rounded-full flex items-center justify-center mx-auto mb-4">
                  <Users className="w-6 h-6 text-primary" />
                </div>
                <CardTitle className="text-2xl">For Job Seekers</CardTitle>
                <CardDescription>Perfect for retail professionals</CardDescription>
              </CardHeader>
              <CardContent className="pt-6">
                <div className="text-center mb-6">
                  <span className="text-4xl font-bold">FREE</span>
                  <p className="text-muted-foreground text-sm mt-1">Forever</p>
                </div>
                
                <ul className="space-y-3 mb-8">
                  <li className="flex items-center gap-2">
                    <Check className="w-5 h-5 text-green-500" />
                    <span>Create your professional profile</span>
                  </li>
                  <li className="flex items-center gap-2">
                    <Check className="w-5 h-5 text-green-500" />
                    <span>Get discovered by top employers</span>
                  </li>
                  <li className="flex items-center gap-2">
                    <Check className="w-5 h-5 text-green-500" />
                    <span>10 reward points on registration</span>
                  </li>
                  <li className="flex items-center gap-2">
                    <Check className="w-5 h-5 text-green-500" />
                    <span>15 points on successful employment</span>
                  </li>
                  <li className="flex items-center gap-2">
                    <Check className="w-5 h-5 text-green-500" />
                    <span>Take skill tests (₹50 per test)</span>
                  </li>
                  <li className="flex items-center gap-2">
                    <Check className="w-5 h-5 text-green-500" />
                    <span>Get certified (₹50 per course)</span>
                  </li>
                </ul>

                <Button asChild className="w-full" variant="hero">
                  <Link to="/employee/register">Register Now</Link>
                </Button>
              </CardContent>
            </Card>

            {/* Employer Plan */}
            <Card className="relative border-2 border-accent/50 bg-gradient-to-b from-accent/5 to-transparent">
              <div className="absolute -top-3 left-1/2 -translate-x-1/2 bg-accent text-accent-foreground px-4 py-1 rounded-full text-sm font-medium">
                Popular
              </div>
              <CardHeader className="text-center pb-2">
                <div className="w-12 h-12 bg-accent/10 rounded-full flex items-center justify-center mx-auto mb-4">
                  <Building2 className="w-6 h-6 text-accent" />
                </div>
                <CardTitle className="text-2xl">For Employers</CardTitle>
                <CardDescription>Best for retail businesses</CardDescription>
              </CardHeader>
              <CardContent className="pt-6">
                <div className="text-center mb-6">
                  <span className="text-4xl font-bold">₹5,000</span>
                  <span className="text-muted-foreground">/year</span>
                  <p className="text-muted-foreground text-sm mt-1">Per organization account</p>
                </div>
                
                <ul className="space-y-3 mb-8">
                  <li className="flex items-center gap-2">
                    <Check className="w-5 h-5 text-green-500" />
                    <span>Access verified candidate database</span>
                  </li>
                  <li className="flex items-center gap-2">
                    <Check className="w-5 h-5 text-green-500" />
                    <span>Advanced search & filters</span>
                  </li>
                  <li className="flex items-center gap-2">
                    <Check className="w-5 h-5 text-green-500" />
                    <span>Reserve candidates for 5 days</span>
                  </li>
                  <li className="flex items-center gap-2">
                    <Check className="w-5 h-5 text-green-500" />
                    <span>Create custom skill tests</span>
                  </li>
                  <li className="flex items-center gap-2">
                    <Check className="w-5 h-5 text-green-500" />
                    <span>Rate & manage hired employees</span>
                  </li>
                  <li className="flex items-center gap-2">
                    <Check className="w-5 h-5 text-green-500" />
                    <span>Dedicated support</span>
                  </li>
                </ul>

                <Button asChild className="w-full" variant="accent">
                  <Link to="/employer/register">Get Started</Link>
                </Button>
              </CardContent>
            </Card>
          </div>

          {/* Additional Fees */}
          <div className="max-w-4xl mx-auto">
            <h2 className="font-display text-2xl font-bold text-center mb-8">Additional Services</h2>
            
            <div className="grid md:grid-cols-2 gap-6">
              <Card>
                <CardHeader className="flex flex-row items-center gap-4 pb-2">
                  <div className="p-2 bg-primary/10 rounded-lg">
                    <Users className="w-5 h-5 text-primary" />
                  </div>
                  <div>
                    <CardTitle className="text-lg">Candidate Reservation</CardTitle>
                    <CardDescription>For Employers</CardDescription>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="flex justify-between items-center mb-4">
                    <span className="text-2xl font-bold">₹500</span>
                    <span className="text-muted-foreground">per candidate</span>
                  </div>
                  <ul className="space-y-2 text-sm text-muted-foreground">
                    <li>• View full candidate details</li>
                    <li>• Exclusive access for 5 days</li>
                    <li>• ₹200 refund if not hired</li>
                  </ul>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="flex flex-row items-center gap-4 pb-2">
                  <div className="p-2 bg-accent/10 rounded-lg">
                    <ClipboardCheck className="w-5 h-5 text-accent" />
                  </div>
                  <div>
                    <CardTitle className="text-lg">Skill Tests</CardTitle>
                    <CardDescription>For Both</CardDescription>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    <div className="flex justify-between items-center">
                      <span>Employee Entry Fee</span>
                      <span className="font-bold">₹50</span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span>Employer Fee (per completion)</span>
                      <span className="font-bold">₹30</span>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card className="md:col-span-2">
                <CardHeader className="flex flex-row items-center gap-4 pb-2">
                  <div className="p-2 bg-green-500/10 rounded-lg">
                    <GraduationCap className="w-5 h-5 text-green-500" />
                  </div>
                  <div>
                    <CardTitle className="text-lg">Certification Courses</CardTitle>
                    <CardDescription>For Employees</CardDescription>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="flex justify-between items-center mb-4">
                    <span className="text-2xl font-bold">₹50</span>
                    <span className="text-muted-foreground">per course</span>
                  </div>
                  <p className="text-sm text-muted-foreground">
                    Improve your profile with industry-recognized certifications. Completed certificates 
                    are displayed on your profile to attract more employers.
                  </p>
                </CardContent>
              </Card>
            </div>
          </div>

          {/* FAQ or CTA */}
          <div className="text-center mt-16">
            <h2 className="font-display text-2xl font-bold mb-4">Have Questions?</h2>
            <p className="text-muted-foreground mb-6">
              Our team is here to help you get started.
            </p>
            <Button asChild variant="outline">
              <Link to="/contact">Contact Us</Link>
            </Button>
          </div>
        </div>
      </main>

      <Footer />
    </div>
  );
};

export default Pricing;
