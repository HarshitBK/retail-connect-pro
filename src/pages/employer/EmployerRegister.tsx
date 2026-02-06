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
  Building2, 
  CreditCard, 
  CheckCircle2, 
  ArrowRight, 
  ArrowLeft,
  Upload,
  Info,
  Shield,
  Users,
  FileText
} from "lucide-react";

type Step = "company" | "contact" | "documents" | "payment";

const EmployerRegister = () => {
  const [currentStep, setCurrentStep] = useState<Step>("company");
  const [formData, setFormData] = useState({
    // Company Details
    companyName: "",
    companyType: "",
    gstNumber: "",
    panNumber: "",
    industry: "",
    companySize: "",
    website: "",
    address: "",
    city: "",
    state: "",
    pincode: "",
    companyLogo: null as File | null,
    // Contact Person
    contactName: "",
    contactDesignation: "",
    contactEmail: "",
    contactPhone: "",
    alternatePhone: "",
    // Documents
    registrationCertificate: null as File | null,
    addressProof: null as File | null,
    // Account
    username: "",
    password: "",
    confirmPassword: "",
    agreeTerms: false,
    agreePayment: false,
  });

  const steps: { id: Step; label: string; icon: React.ElementType }[] = [
    { id: "company", label: "Company Details", icon: Building2 },
    { id: "contact", label: "Contact Person", icon: Users },
    { id: "documents", label: "Documents", icon: FileText },
    { id: "payment", label: "Payment", icon: CreditCard },
  ];

  const currentStepIndex = steps.findIndex(s => s.id === currentStep);
  const progress = ((currentStepIndex + 1) / steps.length) * 100;

  const handleInputChange = (field: string, value: any) => {
    setFormData(prev => ({ ...prev, [field]: value }));
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
    // Handle registration and payment
  };

  return (
    <div className="min-h-screen bg-background">
      <Header />
      
      <main className="pt-24 pb-12">
        <div className="container mx-auto px-4 max-w-4xl">
          {/* Header */}
          <div className="text-center mb-8">
            <h1 className="font-display text-3xl md:text-4xl font-bold text-foreground mb-2">
              Register Your Company
            </h1>
            <p className="text-muted-foreground">
              Join 2,500+ retail companies hiring through RetailHire
            </p>
          </div>

          {/* Progress Stepper */}
          <div className="mb-8">
            <div className="flex justify-between items-center mb-4">
              {steps.map((step, index) => (
                <div
                  key={step.id}
                  className={`flex items-center gap-2 ${
                    index <= currentStepIndex ? "text-accent" : "text-muted-foreground"
                  }`}
                >
                  <div
                    className={`w-10 h-10 rounded-full flex items-center justify-center text-sm font-semibold transition-all ${
                      index < currentStepIndex
                        ? "bg-success text-success-foreground"
                        : index === currentStepIndex
                        ? "bg-accent text-accent-foreground shadow-glow-accent"
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
                {currentStep === "company" && "Tell us about your organization"}
                {currentStep === "contact" && "Who should we contact for hiring matters?"}
                {currentStep === "documents" && "Required for verification purposes"}
                {currentStep === "payment" && "Complete your ₹5,000 annual subscription"}
              </CardDescription>
            </CardHeader>
            <CardContent>
              {/* Company Details Step */}
              {currentStep === "company" && (
                <div className="space-y-6">
                  <div className="grid md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="companyName">Company Name *</Label>
                      <Input
                        id="companyName"
                        placeholder="Enter company name"
                        value={formData.companyName}
                        onChange={e => handleInputChange("companyName", e.target.value)}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="companyType">Company Type *</Label>
                      <Select value={formData.companyType} onValueChange={v => handleInputChange("companyType", v)}>
                        <SelectTrigger>
                          <SelectValue placeholder="Select type" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="pvt">Private Limited</SelectItem>
                          <SelectItem value="llp">LLP</SelectItem>
                          <SelectItem value="partnership">Partnership</SelectItem>
                          <SelectItem value="proprietorship">Proprietorship</SelectItem>
                          <SelectItem value="public">Public Limited</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="gst">GST Number *</Label>
                      <Input
                        id="gst"
                        placeholder="22AAAAA0000A1Z5"
                        value={formData.gstNumber}
                        onChange={e => handleInputChange("gstNumber", e.target.value)}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="pan">Company PAN *</Label>
                      <Input
                        id="pan"
                        placeholder="ABCDE1234F"
                        value={formData.panNumber}
                        onChange={e => handleInputChange("panNumber", e.target.value)}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="industry">Industry *</Label>
                      <Select value={formData.industry} onValueChange={v => handleInputChange("industry", v)}>
                        <SelectTrigger>
                          <SelectValue placeholder="Select industry" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="retail">Retail Store</SelectItem>
                          <SelectItem value="supermarket">Supermarket/Hypermarket</SelectItem>
                          <SelectItem value="mall">Shopping Mall</SelectItem>
                          <SelectItem value="ecommerce">E-commerce</SelectItem>
                          <SelectItem value="warehouse">Warehouse/Logistics</SelectItem>
                          <SelectItem value="hospitality">Hospitality</SelectItem>
                          <SelectItem value="other">Other</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="size">Company Size *</Label>
                      <Select value={formData.companySize} onValueChange={v => handleInputChange("companySize", v)}>
                        <SelectTrigger>
                          <SelectValue placeholder="Select size" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="1-10">1-10 employees</SelectItem>
                          <SelectItem value="11-50">11-50 employees</SelectItem>
                          <SelectItem value="51-200">51-200 employees</SelectItem>
                          <SelectItem value="201-500">201-500 employees</SelectItem>
                          <SelectItem value="500+">500+ employees</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="website">Website (Optional)</Label>
                      <Input
                        id="website"
                        placeholder="https://www.company.com"
                        value={formData.website}
                        onChange={e => handleInputChange("website", e.target.value)}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="logo">Company Logo</Label>
                      <div className="flex items-center gap-2">
                        <Input
                          id="logo"
                          type="file"
                          accept="image/*"
                          className="hidden"
                          onChange={e => handleInputChange("companyLogo", e.target.files?.[0] || null)}
                        />
                        <Button variant="outline" className="w-full" onClick={() => document.getElementById("logo")?.click()}>
                          <Upload className="w-4 h-4 mr-2" />
                          Upload Logo
                        </Button>
                      </div>
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="address">Registered Address *</Label>
                    <Textarea
                      id="address"
                      placeholder="Enter complete registered address"
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
                </div>
              )}

              {/* Contact Person Step */}
              {currentStep === "contact" && (
                <div className="space-y-6">
                  <div className="grid md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="contactName">Contact Person Name *</Label>
                      <Input
                        id="contactName"
                        placeholder="Full name"
                        value={formData.contactName}
                        onChange={e => handleInputChange("contactName", e.target.value)}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="designation">Designation *</Label>
                      <Input
                        id="designation"
                        placeholder="e.g., HR Manager"
                        value={formData.contactDesignation}
                        onChange={e => handleInputChange("contactDesignation", e.target.value)}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="contactEmail">Email Address *</Label>
                      <Input
                        id="contactEmail"
                        type="email"
                        placeholder="hr@company.com"
                        value={formData.contactEmail}
                        onChange={e => handleInputChange("contactEmail", e.target.value)}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="contactPhone">Phone Number *</Label>
                      <Input
                        id="contactPhone"
                        placeholder="+91 98765 43210"
                        value={formData.contactPhone}
                        onChange={e => handleInputChange("contactPhone", e.target.value)}
                      />
                    </div>
                    <div className="space-y-2 md:col-span-2">
                      <Label htmlFor="alternatePhone">Alternate Phone (Optional)</Label>
                      <Input
                        id="alternatePhone"
                        placeholder="+91 98765 43210"
                        value={formData.alternatePhone}
                        onChange={e => handleInputChange("alternatePhone", e.target.value)}
                      />
                    </div>
                  </div>

                  <div className="border-t border-border pt-6">
                    <h4 className="font-semibold text-foreground mb-4">Account Credentials</h4>
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
                  </div>
                </div>
              )}

              {/* Documents Step */}
              {currentStep === "documents" && (
                <div className="space-y-6">
                  <div className="bg-accent/10 rounded-lg p-4 flex items-start gap-3">
                    <Shield className="w-5 h-5 text-accent mt-0.5" />
                    <p className="text-sm text-foreground">
                      These documents help us verify your company and ensure a safe hiring environment for both employers and candidates.
                    </p>
                  </div>

                  <div className="space-y-4">
                    <div className="space-y-2">
                      <Label>Company Registration Certificate *</Label>
                      <div className="border-2 border-dashed border-border rounded-lg p-8 text-center hover:border-accent transition-colors">
                        <Input
                          id="regCert"
                          type="file"
                          accept=".pdf,.jpg,.jpeg,.png"
                          className="hidden"
                          onChange={e => handleInputChange("registrationCertificate", e.target.files?.[0] || null)}
                        />
                        <Upload className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
                        <p className="text-sm text-muted-foreground mb-2">
                          Drop your file here or click to browse
                        </p>
                        <Button variant="outline" onClick={() => document.getElementById("regCert")?.click()}>
                          Choose File
                        </Button>
                        <p className="text-xs text-muted-foreground mt-2">
                          Accepted formats: PDF, JPG, PNG (Max 5MB)
                        </p>
                      </div>
                    </div>

                    <div className="space-y-2">
                      <Label>Address Proof (Optional)</Label>
                      <div className="border-2 border-dashed border-border rounded-lg p-8 text-center hover:border-accent transition-colors">
                        <Input
                          id="addressProof"
                          type="file"
                          accept=".pdf,.jpg,.jpeg,.png"
                          className="hidden"
                          onChange={e => handleInputChange("addressProof", e.target.files?.[0] || null)}
                        />
                        <Upload className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
                        <p className="text-sm text-muted-foreground mb-2">
                          Utility bill, rent agreement, or similar
                        </p>
                        <Button variant="outline" onClick={() => document.getElementById("addressProof")?.click()}>
                          Choose File
                        </Button>
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* Payment Step */}
              {currentStep === "payment" && (
                <div className="space-y-6">
                  <div className="bg-card border border-border rounded-xl p-6">
                    <div className="flex items-center justify-between mb-4">
                      <h3 className="font-display font-semibold text-lg text-foreground">
                        Annual Subscription
                      </h3>
                      <div className="text-right">
                        <p className="font-display text-3xl font-bold text-foreground">₹5,000</p>
                        <p className="text-sm text-muted-foreground">per year</p>
                      </div>
                    </div>
                    
                    <div className="space-y-3 mb-6">
                      <div className="flex items-center gap-2 text-sm text-foreground">
                        <CheckCircle2 className="w-4 h-4 text-success" />
                        Unlimited candidate searches
                      </div>
                      <div className="flex items-center gap-2 text-sm text-foreground">
                        <CheckCircle2 className="w-4 h-4 text-success" />
                        Create and conduct skill tests
                      </div>
                      <div className="flex items-center gap-2 text-sm text-foreground">
                        <CheckCircle2 className="w-4 h-4 text-success" />
                        Verified candidate profiles
                      </div>
                      <div className="flex items-center gap-2 text-sm text-foreground">
                        <CheckCircle2 className="w-4 h-4 text-success" />
                        Priority customer support
                      </div>
                    </div>

                    <div className="bg-muted rounded-lg p-4 mb-4">
                      <p className="text-sm text-muted-foreground">
                        <strong>Note:</strong> Candidate access fees (₹500 per candidate) are charged separately and can be managed through your wallet.
                      </p>
                    </div>
                  </div>

                  <div className="space-y-4">
                    <div className="flex items-start gap-3">
                      <Checkbox
                        id="agreePayment"
                        checked={formData.agreePayment}
                        onCheckedChange={checked => handleInputChange("agreePayment", checked)}
                      />
                      <Label htmlFor="agreePayment" className="text-sm text-muted-foreground leading-relaxed cursor-pointer">
                        I understand that ₹5,000 will be charged annually for the subscription, and candidate access fees apply separately.
                      </Label>
                    </div>

                    <div className="flex items-start gap-3">
                      <Checkbox
                        id="terms"
                        checked={formData.agreeTerms}
                        onCheckedChange={checked => handleInputChange("agreeTerms", checked)}
                      />
                      <Label htmlFor="terms" className="text-sm text-muted-foreground leading-relaxed cursor-pointer">
                        I agree to the{" "}
                        <Link to="/terms" className="text-accent hover:underline">
                          Terms of Service
                        </Link>{" "}
                        and{" "}
                        <Link to="/privacy" className="text-accent hover:underline">
                          Privacy Policy
                        </Link>
                      </Label>
                    </div>
                  </div>

                  <div className="bg-accent/10 rounded-lg p-4 flex items-start gap-3">
                    <Info className="w-5 h-5 text-accent mt-0.5" />
                    <p className="text-sm text-foreground">
                      You'll be redirected to our secure payment gateway. After successful payment, your account will be activated immediately.
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
                  <Button variant="accent" onClick={nextStep}>
                    Next Step
                    <ArrowRight className="w-4 h-4 ml-2" />
                  </Button>
                ) : (
                  <Button 
                    variant="accent" 
                    size="lg"
                    onClick={handleSubmit} 
                    disabled={!formData.agreeTerms || !formData.agreePayment}
                  >
                    Pay ₹5,000 & Register
                    <CreditCard className="w-4 h-4 ml-2" />
                  </Button>
                )}
              </div>
            </CardContent>
          </Card>

          <p className="text-center text-sm text-muted-foreground mt-6">
            Already have an account?{" "}
            <Link to="/employer/login" className="text-accent hover:underline font-medium">
              Login here
            </Link>
          </p>
        </div>
      </main>
    </div>
  );
};

export default EmployerRegister;
