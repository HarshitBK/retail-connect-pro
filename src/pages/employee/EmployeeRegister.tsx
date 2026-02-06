import { useState } from "react";
import { Link } from "react-router-dom";
import Header from "@/components/layout/Header";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { 
  User, 
  Briefcase, 
  FileText, 
  CheckCircle2, 
  ArrowRight, 
  ArrowLeft,
  Upload,
  Info
} from "lucide-react";

type Step = "personal" | "professional" | "government" | "account";

const EmployeeRegister = () => {
  const [currentStep, setCurrentStep] = useState<Step>("personal");
  const [formData, setFormData] = useState({
    // Personal
    fullName: "",
    email: "",
    phone: "",
    dateOfBirth: "",
    gender: "",
    address: "",
    city: "",
    state: "",
    pincode: "",
    photo: null as File | null,
    // Education
    highestEducation: "",
    institution: "",
    yearOfPassing: "",
    // Professional
    totalExperience: "",
    currentStatus: "",
    skills: [] as string[],
    expectedSalary: "",
    preferredLocations: "",
    resume: null as File | null,
    // Experience entries
    experiences: [{ company: "", role: "", duration: "", description: "" }],
    certifications: "",
    // Government
    aadharNumber: "",
    panNumber: "",
    bankName: "",
    accountNumber: "",
    ifscCode: "",
    // Account
    username: "",
    password: "",
    confirmPassword: "",
    agreeTerms: false,
  });

  const steps: { id: Step; label: string; icon: React.ElementType }[] = [
    { id: "personal", label: "Personal Details", icon: User },
    { id: "professional", label: "Professional", icon: Briefcase },
    { id: "government", label: "Documents", icon: FileText },
    { id: "account", label: "Create Account", icon: CheckCircle2 },
  ];

  const currentStepIndex = steps.findIndex(s => s.id === currentStep);
  const progress = ((currentStepIndex + 1) / steps.length) * 100;

  const skillOptions = [
    "Cash Handling", "Customer Service", "Inventory Management", "POS Systems",
    "Sales", "Visual Merchandising", "Stock Management", "Team Leadership",
    "Communication", "Problem Solving", "Time Management", "Computer Skills"
  ];

  const handleInputChange = (field: string, value: any) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const toggleSkill = (skill: string) => {
    setFormData(prev => ({
      ...prev,
      skills: prev.skills.includes(skill)
        ? prev.skills.filter(s => s !== skill)
        : [...prev.skills, skill]
    }));
  };

  const nextStep = () => {
    const nextIndex = currentStepIndex + 1;
    if (nextIndex < steps.length) {
      setCurrentStep(steps[nextIndex].id);
    }
  };

  const prevStep = () => {
    const prevIndex = currentStepIndex - 1;
    if (prevIndex >= 0) {
      setCurrentStep(steps[prevIndex].id);
    }
  };

  const handleSubmit = () => {
    console.log("Form submitted:", formData);
    // Handle registration
  };

  return (
    <div className="min-h-screen bg-background">
      <Header />
      
      <main className="pt-24 pb-12">
        <div className="container mx-auto px-4 max-w-4xl">
          {/* Header */}
          <div className="text-center mb-8">
            <h1 className="font-display text-3xl md:text-4xl font-bold text-foreground mb-2">
              Create Your Profile
            </h1>
            <p className="text-muted-foreground">
              Register for free and get discovered by top employers
            </p>
          </div>

          {/* Progress Stepper */}
          <div className="mb-8">
            <div className="flex justify-between items-center mb-4">
              {steps.map((step, index) => (
                <div
                  key={step.id}
                  className={`flex items-center gap-2 ${
                    index <= currentStepIndex ? "text-primary" : "text-muted-foreground"
                  }`}
                >
                  <div
                    className={`w-10 h-10 rounded-full flex items-center justify-center text-sm font-semibold transition-all ${
                      index < currentStepIndex
                        ? "bg-success text-success-foreground"
                        : index === currentStepIndex
                        ? "gradient-bg-primary text-primary-foreground shadow-glow"
                        : "bg-muted text-muted-foreground"
                    }`}
                  >
                    {index < currentStepIndex ? (
                      <CheckCircle2 className="w-5 h-5" />
                    ) : (
                      <step.icon className="w-5 h-5" />
                    )}
                  </div>
                  <span className="hidden md:block text-sm font-medium">{step.label}</span>
                </div>
              ))}
            </div>
            <Progress value={progress} className="h-2" />
          </div>

          {/* Form Card */}
          <Card className="shadow-lg">
            <CardHeader>
              <CardTitle className="font-display">
                {steps[currentStepIndex].label}
              </CardTitle>
              <CardDescription>
                {currentStep === "personal" && "Tell us about yourself - this helps employers know you better"}
                {currentStep === "professional" && "Share your work experience and skills"}
                {currentStep === "government" && "Required for verification (optional fields marked)"}
                {currentStep === "account" && "Set up your login credentials"}
              </CardDescription>
            </CardHeader>
            <CardContent>
              {/* Personal Details Step */}
              {currentStep === "personal" && (
                <div className="space-y-6">
                  <div className="grid md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="fullName">Full Name *</Label>
                      <Input
                        id="fullName"
                        placeholder="Enter your full name"
                        value={formData.fullName}
                        onChange={e => handleInputChange("fullName", e.target.value)}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="email">Email Address *</Label>
                      <Input
                        id="email"
                        type="email"
                        placeholder="your@email.com"
                        value={formData.email}
                        onChange={e => handleInputChange("email", e.target.value)}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="phone">Phone Number *</Label>
                      <Input
                        id="phone"
                        placeholder="+91 98765 43210"
                        value={formData.phone}
                        onChange={e => handleInputChange("phone", e.target.value)}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="dob">Date of Birth *</Label>
                      <Input
                        id="dob"
                        type="date"
                        value={formData.dateOfBirth}
                        onChange={e => handleInputChange("dateOfBirth", e.target.value)}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="gender">Gender *</Label>
                      <Select value={formData.gender} onValueChange={v => handleInputChange("gender", v)}>
                        <SelectTrigger>
                          <SelectValue placeholder="Select gender" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="male">Male</SelectItem>
                          <SelectItem value="female">Female</SelectItem>
                          <SelectItem value="other">Other</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="photo">Profile Photo</Label>
                      <div className="flex items-center gap-2">
                        <Input
                          id="photo"
                          type="file"
                          accept="image/*"
                          className="hidden"
                          onChange={e => handleInputChange("photo", e.target.files?.[0] || null)}
                        />
                        <Button variant="outline" className="w-full" onClick={() => document.getElementById("photo")?.click()}>
                          <Upload className="w-4 h-4 mr-2" />
                          Upload Photo
                        </Button>
                      </div>
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="address">Address *</Label>
                    <Textarea
                      id="address"
                      placeholder="Enter your full address"
                      value={formData.address}
                      onChange={e => handleInputChange("address", e.target.value)}
                    />
                  </div>

                  <div className="grid md:grid-cols-3 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="city">City *</Label>
                      <Input
                        id="city"
                        placeholder="City"
                        value={formData.city}
                        onChange={e => handleInputChange("city", e.target.value)}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="state">State *</Label>
                      <Input
                        id="state"
                        placeholder="State"
                        value={formData.state}
                        onChange={e => handleInputChange("state", e.target.value)}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="pincode">Pincode *</Label>
                      <Input
                        id="pincode"
                        placeholder="Pincode"
                        value={formData.pincode}
                        onChange={e => handleInputChange("pincode", e.target.value)}
                      />
                    </div>
                  </div>

                  <div className="border-t border-border pt-6">
                    <h4 className="font-semibold text-foreground mb-4">Education Details</h4>
                    <div className="grid md:grid-cols-3 gap-4">
                      <div className="space-y-2">
                        <Label htmlFor="education">Highest Education *</Label>
                        <Select value={formData.highestEducation} onValueChange={v => handleInputChange("highestEducation", v)}>
                          <SelectTrigger>
                            <SelectValue placeholder="Select" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="10th">10th Pass</SelectItem>
                            <SelectItem value="12th">12th Pass</SelectItem>
                            <SelectItem value="graduate">Graduate</SelectItem>
                            <SelectItem value="postgraduate">Post Graduate</SelectItem>
                            <SelectItem value="diploma">Diploma</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="institution">Institution Name</Label>
                        <Input
                          id="institution"
                          placeholder="School/College name"
                          value={formData.institution}
                          onChange={e => handleInputChange("institution", e.target.value)}
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="yearOfPassing">Year of Passing</Label>
                        <Input
                          id="yearOfPassing"
                          placeholder="2020"
                          value={formData.yearOfPassing}
                          onChange={e => handleInputChange("yearOfPassing", e.target.value)}
                        />
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* Professional Step */}
              {currentStep === "professional" && (
                <div className="space-y-6">
                  <div className="grid md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="experience">Total Experience *</Label>
                      <Select value={formData.totalExperience} onValueChange={v => handleInputChange("totalExperience", v)}>
                        <SelectTrigger>
                          <SelectValue placeholder="Select experience" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="fresher">Fresher</SelectItem>
                          <SelectItem value="0-1">0-1 Years</SelectItem>
                          <SelectItem value="1-2">1-2 Years</SelectItem>
                          <SelectItem value="2-5">2-5 Years</SelectItem>
                          <SelectItem value="5+">5+ Years</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="status">Current Status *</Label>
                      <Select value={formData.currentStatus} onValueChange={v => handleInputChange("currentStatus", v)}>
                        <SelectTrigger>
                          <SelectValue placeholder="Select status" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="available">Available for Work</SelectItem>
                          <SelectItem value="employed">Currently Employed</SelectItem>
                          <SelectItem value="notice">In Notice Period</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="salary">Expected Salary (Monthly)</Label>
                      <Input
                        id="salary"
                        placeholder="₹ 15,000"
                        value={formData.expectedSalary}
                        onChange={e => handleInputChange("expectedSalary", e.target.value)}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="locations">Preferred Locations</Label>
                      <Input
                        id="locations"
                        placeholder="Mumbai, Pune, Delhi"
                        value={formData.preferredLocations}
                        onChange={e => handleInputChange("preferredLocations", e.target.value)}
                      />
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label>Skills *</Label>
                    <p className="text-sm text-muted-foreground mb-2">Select all that apply</p>
                    <div className="flex flex-wrap gap-2">
                      {skillOptions.map(skill => (
                        <button
                          key={skill}
                          type="button"
                          onClick={() => toggleSkill(skill)}
                          className={`px-3 py-1.5 rounded-full text-sm font-medium transition-all ${
                            formData.skills.includes(skill)
                              ? "bg-primary text-primary-foreground"
                              : "bg-muted text-muted-foreground hover:bg-muted/80"
                          }`}
                        >
                          {skill}
                        </button>
                      ))}
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="resume">Upload Resume/CV</Label>
                    <div className="flex items-center gap-2">
                      <Input
                        id="resume"
                        type="file"
                        accept=".pdf,.doc,.docx"
                        className="hidden"
                        onChange={e => handleInputChange("resume", e.target.files?.[0] || null)}
                      />
                      <Button variant="outline" className="w-full" onClick={() => document.getElementById("resume")?.click()}>
                        <Upload className="w-4 h-4 mr-2" />
                        Upload Resume (PDF, DOC)
                      </Button>
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="certifications">Certifications (Optional)</Label>
                    <Textarea
                      id="certifications"
                      placeholder="List any relevant certifications..."
                      value={formData.certifications}
                      onChange={e => handleInputChange("certifications", e.target.value)}
                    />
                  </div>

                  <div className="bg-accent/10 rounded-lg p-4 flex items-start gap-3">
                    <Info className="w-5 h-5 text-accent mt-0.5" />
                    <p className="text-sm text-foreground">
                      <strong>Tip:</strong> The more details you provide, the better your chances of getting noticed by employers. Complete profiles get 3x more views!
                    </p>
                  </div>
                </div>
              )}

              {/* Government Documents Step */}
              {currentStep === "government" && (
                <div className="space-y-6">
                  <div className="bg-warning/10 rounded-lg p-4 flex items-start gap-3 mb-6">
                    <Info className="w-5 h-5 text-warning mt-0.5" />
                    <p className="text-sm text-foreground">
                      These documents help verify your identity and are required for employment. They are stored securely and only shared with employers after hiring.
                    </p>
                  </div>

                  <div className="grid md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="aadhar">Aadhar Number</Label>
                      <Input
                        id="aadhar"
                        placeholder="XXXX XXXX XXXX"
                        value={formData.aadharNumber}
                        onChange={e => handleInputChange("aadharNumber", e.target.value)}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="pan">PAN Number</Label>
                      <Input
                        id="pan"
                        placeholder="ABCDE1234F"
                        value={formData.panNumber}
                        onChange={e => handleInputChange("panNumber", e.target.value)}
                      />
                    </div>
                  </div>

                  <div className="border-t border-border pt-6">
                    <h4 className="font-semibold text-foreground mb-4">Bank Details (Optional)</h4>
                    <div className="grid md:grid-cols-3 gap-4">
                      <div className="space-y-2">
                        <Label htmlFor="bankName">Bank Name</Label>
                        <Input
                          id="bankName"
                          placeholder="Bank name"
                          value={formData.bankName}
                          onChange={e => handleInputChange("bankName", e.target.value)}
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="accountNumber">Account Number</Label>
                        <Input
                          id="accountNumber"
                          placeholder="Account number"
                          value={formData.accountNumber}
                          onChange={e => handleInputChange("accountNumber", e.target.value)}
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="ifsc">IFSC Code</Label>
                        <Input
                          id="ifsc"
                          placeholder="IFSC code"
                          value={formData.ifscCode}
                          onChange={e => handleInputChange("ifscCode", e.target.value)}
                        />
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* Account Creation Step */}
              {currentStep === "account" && (
                <div className="space-y-6">
                  <div className="grid md:grid-cols-2 gap-4">
                    <div className="space-y-2 md:col-span-2">
                      <Label htmlFor="username">Username *</Label>
                      <Input
                        id="username"
                        placeholder="Choose a username"
                        value={formData.username}
                        onChange={e => handleInputChange("username", e.target.value)}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="password">Password *</Label>
                      <Input
                        id="password"
                        type="password"
                        placeholder="Create a strong password"
                        value={formData.password}
                        onChange={e => handleInputChange("password", e.target.value)}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="confirmPassword">Confirm Password *</Label>
                      <Input
                        id="confirmPassword"
                        type="password"
                        placeholder="Confirm your password"
                        value={formData.confirmPassword}
                        onChange={e => handleInputChange("confirmPassword", e.target.value)}
                      />
                    </div>
                  </div>

                  <div className="flex items-start gap-3">
                    <Checkbox
                      id="terms"
                      checked={formData.agreeTerms}
                      onCheckedChange={checked => handleInputChange("agreeTerms", checked)}
                    />
                    <Label htmlFor="terms" className="text-sm text-muted-foreground leading-relaxed cursor-pointer">
                      I agree to the{" "}
                      <Link to="/terms" className="text-primary hover:underline">
                        Terms of Service
                      </Link>{" "}
                      and{" "}
                      <Link to="/privacy" className="text-primary hover:underline">
                        Privacy Policy
                      </Link>
                    </Label>
                  </div>

                  <div className="bg-success/10 rounded-lg p-4">
                    <h4 className="font-semibold text-foreground mb-2">🎉 Almost there!</h4>
                    <p className="text-sm text-muted-foreground">
                      You'll receive <strong>10 bonus points</strong> upon registration. Earn more points by completing tests and certifications!
                    </p>
                  </div>
                </div>
              )}

              {/* Navigation Buttons */}
              <div className="flex justify-between mt-8 pt-6 border-t border-border">
                <Button
                  variant="outline"
                  onClick={prevStep}
                  disabled={currentStepIndex === 0}
                >
                  <ArrowLeft className="w-4 h-4 mr-2" />
                  Previous
                </Button>

                {currentStepIndex < steps.length - 1 ? (
                  <Button variant="gradient" onClick={nextStep}>
                    Next Step
                    <ArrowRight className="w-4 h-4 ml-2" />
                  </Button>
                ) : (
                  <Button variant="hero" onClick={handleSubmit} disabled={!formData.agreeTerms}>
                    Create Account
                    <CheckCircle2 className="w-4 h-4 ml-2" />
                  </Button>
                )}
              </div>
            </CardContent>
          </Card>

          <p className="text-center text-sm text-muted-foreground mt-6">
            Already have an account?{" "}
            <Link to="/employee/login" className="text-primary hover:underline font-medium">
              Login here
            </Link>
          </p>
        </div>
      </main>
    </div>
  );
};

export default EmployeeRegister;
