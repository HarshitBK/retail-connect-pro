import { useState } from "react";
import { Link, useNavigate, useSearchParams } from "react-router-dom";
import Header from "@/components/layout/Header";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
  Building2,
  Users,
  FileText,
  CreditCard,
  CheckCircle2,
  ArrowRight,
  ArrowLeft,
  Upload,
  Loader2,
  Eye,
  EyeOff,
  Shield,
} from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { useToast } from "@/hooks/use-toast";
import { useIndianLocations } from "@/hooks/useIndianLocations";
import RetailCategorySelector from "@/components/shared/RetailCategorySelector";
import DocumentUpload from "@/components/shared/DocumentUpload";
import {
  phoneSchema,
  emailSchema,
  panSchema,
  gstSchema,
  cinSchema,
  pincodeSchema,
  passwordSchema,
  usernameSchema,
} from "@/lib/validations";
import { COMPANY_TYPES, COMPANY_SIZES, INDUSTRY_TYPES } from "@/lib/constants";

type Step = "company" | "contact" | "documents" | "payment";

const EmployerRegister = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const referralCode = searchParams.get("ref") || "";
  const { signUp } = useAuth();
  const { toast } = useToast();
  const { states, fetchCitiesByState } = useIndianLocations();

  const [currentStep, setCurrentStep] = useState<Step>("company");
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});

  // Location states
  const [availableCities, setAvailableCities] = useState<{ id: string; name: string }[]>([]);
  const [loadingCities, setLoadingCities] = useState(false);

  const [formData, setFormData] = useState({
    // Company Details
    organizationName: "",
    organizationType: "",
    gstNumber: "",
    panNumber: "",
    cinNumber: "",
    industry: "",
    companySize: "",
    numberOfStores: "",
    website: "",
    addressLine1: "",
    addressLine2: "",
    stateId: "",
    stateName: "",
    cityId: "",
    cityName: "",
    pincode: "",
    companyLogo: null as File | null,
    retailCategories: [] as string[],
    // Contact Person
    contactPersonName: "",
    contactPersonDesignation: "",
    contactPersonEmail: "",
    contactPersonPhone: "",
    // Documents
    registrationCertificate: null as File | null,
    gstCertificate: null as File | null,
    // Account
    username: "",
    password: "",
    confirmPassword: "",
    referralCode: referralCode,
    agreeTerms: false,
    agreePayment: false,
  });

  const steps: { id: Step; label: string; icon: React.ElementType }[] = [
    { id: "company", label: "Company Details", icon: Building2 },
    { id: "contact", label: "Contact Person", icon: Users },
    { id: "documents", label: "Documents", icon: FileText },
    { id: "payment", label: "Account & Payment", icon: CreditCard },
  ];

  const currentStepIndex = steps.findIndex((s) => s.id === currentStep);
  const progress = ((currentStepIndex + 1) / steps.length) * 100;

  const handleInputChange = (field: string, value: any) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
    if (errors[field]) {
      setErrors((prev) => ({ ...prev, [field]: "" }));
    }
  };

  const handleStateChange = async (stateId: string) => {
    const state = states.find((s) => s.id === stateId);
    if (!state) return;

    setFormData((prev) => ({
      ...prev,
      stateId,
      stateName: state.name,
      cityId: "",
      cityName: "",
    }));

    setLoadingCities(true);
    const cities = await fetchCitiesByState(stateId);
    setAvailableCities(cities.map((c) => ({ id: c.id, name: c.name })));
    setLoadingCities(false);
  };

  const handleCityChange = (cityId: string) => {
    const city = availableCities.find((c) => c.id === cityId);
    if (!city) return;

    setFormData((prev) => ({
      ...prev,
      cityId,
      cityName: city.name,
    }));
  };

  const validateStep = (step: Step): boolean => {
    const newErrors: Record<string, string> = {};

    if (step === "company") {
      if (!formData.organizationName.trim()) newErrors.organizationName = "Company name is required";
      if (!formData.organizationType) newErrors.organizationType = "Company type is required";

      if (formData.gstNumber) {
        const gstResult = gstSchema.safeParse(formData.gstNumber);
        if (!gstResult.success) newErrors.gstNumber = gstResult.error.errors[0]?.message || "Invalid GST";
      }

      if (formData.panNumber) {
        const panResult = panSchema.safeParse(formData.panNumber);
        if (!panResult.success) newErrors.panNumber = panResult.error.errors[0]?.message || "Invalid PAN";
      }

      if (!formData.stateId) newErrors.stateId = "State is required";
      if (!formData.cityId) newErrors.cityId = "City is required";

      if (formData.pincode) {
        const pincodeResult = pincodeSchema.safeParse(formData.pincode);
        if (!pincodeResult.success) newErrors.pincode = pincodeResult.error.errors[0]?.message || "Invalid pincode";
      }
    }

    if (step === "contact") {
      if (!formData.contactPersonName.trim()) newErrors.contactPersonName = "Contact name is required";
      if (!formData.contactPersonDesignation.trim()) newErrors.contactPersonDesignation = "Designation is required";

      const emailResult = emailSchema.safeParse(formData.contactPersonEmail);
      if (!emailResult.success) newErrors.contactPersonEmail = emailResult.error.errors[0]?.message || "Invalid email";

      const phoneResult = phoneSchema.safeParse(formData.contactPersonPhone);
      if (!phoneResult.success) newErrors.contactPersonPhone = phoneResult.error.errors[0]?.message || "Invalid phone";
    }

    if (step === "payment") {
      const usernameResult = usernameSchema.safeParse(formData.username);
      if (!usernameResult.success) newErrors.username = usernameResult.error.errors[0]?.message || "Invalid username";

      const passwordResult = passwordSchema.safeParse(formData.password);
      if (!passwordResult.success) newErrors.password = passwordResult.error.errors[0]?.message || "Invalid password";

      if (formData.password !== formData.confirmPassword) {
        newErrors.confirmPassword = "Passwords do not match";
      }

      if (!formData.agreeTerms) newErrors.agreeTerms = "You must agree to the terms";
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const nextStep = () => {
    if (!validateStep(currentStep)) return;

    const nextIndex = currentStepIndex + 1;
    if (nextIndex < steps.length) {
      setCurrentStep(steps[nextIndex].id);
      window.scrollTo(0, 0);
    }
  };

  const prevStep = () => {
    const prevIndex = currentStepIndex - 1;
    if (prevIndex >= 0) {
      setCurrentStep(steps[prevIndex].id);
      window.scrollTo(0, 0);
    }
  };

  const handleSubmit = async () => {
    if (!validateStep("payment")) return;

    setLoading(true);

    try {
      const { error: signUpError } = await signUp(formData.contactPersonEmail, formData.password, "employer");

      if (signUpError) {
        toast({
          title: "Registration Failed",
          description: signUpError.message,
          variant: "destructive",
        });
        setLoading(false);
        return;
      }

      toast({
        title: "Registration Successful! 🎉",
        description: "Please check your email to verify your account.",
      });

      navigate("/login");
    } catch (error: any) {
      toast({
        title: "Registration Failed",
        description: error.message || "Something went wrong. Please try again.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
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
            {referralCode && (
              <p className="text-sm text-accent mt-2">
                🎁 Referred by code: <strong>{referralCode}</strong>
              </p>
            )}
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
              <CardTitle className="font-display">{steps[currentStepIndex].label}</CardTitle>
              <CardDescription>
                {currentStep === "company" && "Tell us about your organization"}
                {currentStep === "contact" && "Who should we contact for hiring matters?"}
                {currentStep === "documents" && "Upload documents for verification (optional for now)"}
                {currentStep === "payment" && "Set up your account"}
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
                        value={formData.organizationName}
                        onChange={(e) => handleInputChange("organizationName", e.target.value)}
                        className={errors.organizationName ? "border-destructive" : ""}
                      />
                      {errors.organizationName && (
                        <p className="text-sm text-destructive">{errors.organizationName}</p>
                      )}
                    </div>
                    <div className="space-y-2">
                      <Label>Company Type *</Label>
                      <Select
                        value={formData.organizationType}
                        onValueChange={(v) => handleInputChange("organizationType", v)}
                      >
                        <SelectTrigger className={errors.organizationType ? "border-destructive" : ""}>
                          <SelectValue placeholder="Select type" />
                        </SelectTrigger>
                        <SelectContent>
                          {COMPANY_TYPES.map((type) => (
                            <SelectItem key={type.value} value={type.value}>
                              {type.label}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      {errors.organizationType && (
                        <p className="text-sm text-destructive">{errors.organizationType}</p>
                      )}
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="gst">GST Number</Label>
                      <Input
                        id="gst"
                        placeholder="22AAAAA0000A1Z5"
                        value={formData.gstNumber}
                        onChange={(e) => handleInputChange("gstNumber", e.target.value.toUpperCase())}
                        className={errors.gstNumber ? "border-destructive" : ""}
                      />
                      {errors.gstNumber && <p className="text-sm text-destructive">{errors.gstNumber}</p>}
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="pan">Company PAN</Label>
                      <Input
                        id="pan"
                        placeholder="ABCDE1234F"
                        value={formData.panNumber}
                        onChange={(e) => handleInputChange("panNumber", e.target.value.toUpperCase())}
                        className={errors.panNumber ? "border-destructive" : ""}
                      />
                      {errors.panNumber && <p className="text-sm text-destructive">{errors.panNumber}</p>}
                    </div>
                    <div className="space-y-2">
                      <Label>Industry</Label>
                      <Select value={formData.industry} onValueChange={(v) => handleInputChange("industry", v)}>
                        <SelectTrigger>
                          <SelectValue placeholder="Select industry" />
                        </SelectTrigger>
                        <SelectContent>
                          {INDUSTRY_TYPES.map((type) => (
                            <SelectItem key={type.value} value={type.value}>
                              {type.label}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="space-y-2">
                      <Label>Company Size</Label>
                      <Select value={formData.companySize} onValueChange={(v) => handleInputChange("companySize", v)}>
                        <SelectTrigger>
                          <SelectValue placeholder="Select size" />
                        </SelectTrigger>
                        <SelectContent>
                          {COMPANY_SIZES.map((size) => (
                            <SelectItem key={size.value} value={size.value}>
                              {size.label}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="numberOfStores">Number of Stores *</Label>
                      <Input
                        id="numberOfStores"
                        type="number"
                        min="1"
                        placeholder="Enter number of stores"
                        value={formData.numberOfStores}
                        onChange={(e) => handleInputChange("numberOfStores", e.target.value)}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="website">Website (Optional)</Label>
                      <Input
                        id="website"
                        placeholder="https://www.company.com"
                        value={formData.website}
                        onChange={(e) => handleInputChange("website", e.target.value)}
                      />
                    </div>
                  </div>

                  {/* Retail Categories */}
                  <RetailCategorySelector
                    selectedCategories={formData.retailCategories}
                    onChange={(cats) => handleInputChange("retailCategories", cats)}
                    maxCategories={10}
                    label="Business Categories"
                  />

                  {/* Address */}
                  <div className="border-t pt-6">
                    <h4 className="font-semibold text-foreground mb-4">Registered Address</h4>
                    <div className="space-y-4">
                      <div className="space-y-2">
                        <Label htmlFor="addressLine1">Address Line 1 *</Label>
                        <Input
                          id="addressLine1"
                          placeholder="Building name, Floor"
                          value={formData.addressLine1}
                          onChange={(e) => handleInputChange("addressLine1", e.target.value)}
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="addressLine2">Address Line 2</Label>
                        <Input
                          id="addressLine2"
                          placeholder="Street, Area"
                          value={formData.addressLine2}
                          onChange={(e) => handleInputChange("addressLine2", e.target.value)}
                        />
                      </div>
                      <div className="grid md:grid-cols-3 gap-4">
                        <div className="space-y-2">
                          <Label>State *</Label>
                          <Select value={formData.stateId} onValueChange={handleStateChange}>
                            <SelectTrigger className={errors.stateId ? "border-destructive" : ""}>
                              <SelectValue placeholder="Select state" />
                            </SelectTrigger>
                            <SelectContent>
                              <ScrollArea className="h-60">
                                {states.map((state) => (
                                  <SelectItem key={state.id} value={state.id}>
                                    {state.name}
                                  </SelectItem>
                                ))}
                              </ScrollArea>
                            </SelectContent>
                          </Select>
                          {errors.stateId && <p className="text-sm text-destructive">{errors.stateId}</p>}
                        </div>
                        <div className="space-y-2">
                          <Label>City *</Label>
                          <Select
                            value={formData.cityId}
                            onValueChange={handleCityChange}
                            disabled={!formData.stateId || loadingCities}
                          >
                            <SelectTrigger className={errors.cityId ? "border-destructive" : ""}>
                              <SelectValue
                                placeholder={
                                  loadingCities
                                    ? "Loading..."
                                    : !formData.stateId
                                    ? "Select state first"
                                    : "Select city"
                                }
                              />
                            </SelectTrigger>
                            <SelectContent>
                              <ScrollArea className="h-60">
                                {availableCities.map((city) => (
                                  <SelectItem key={city.id} value={city.id}>
                                    {city.name}
                                  </SelectItem>
                                ))}
                              </ScrollArea>
                            </SelectContent>
                          </Select>
                          {errors.cityId && <p className="text-sm text-destructive">{errors.cityId}</p>}
                        </div>
                        <div className="space-y-2">
                          <Label htmlFor="pincode">Pincode</Label>
                          <Input
                            id="pincode"
                            placeholder="560001"
                            value={formData.pincode}
                            onChange={(e) => handleInputChange("pincode", e.target.value)}
                            className={errors.pincode ? "border-destructive" : ""}
                          />
                          {errors.pincode && <p className="text-sm text-destructive">{errors.pincode}</p>}
                        </div>
                      </div>
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
                        value={formData.contactPersonName}
                        onChange={(e) => handleInputChange("contactPersonName", e.target.value)}
                        className={errors.contactPersonName ? "border-destructive" : ""}
                      />
                      {errors.contactPersonName && (
                        <p className="text-sm text-destructive">{errors.contactPersonName}</p>
                      )}
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="designation">Designation *</Label>
                      <Input
                        id="designation"
                        placeholder="e.g., HR Manager"
                        value={formData.contactPersonDesignation}
                        onChange={(e) => handleInputChange("contactPersonDesignation", e.target.value)}
                        className={errors.contactPersonDesignation ? "border-destructive" : ""}
                      />
                      {errors.contactPersonDesignation && (
                        <p className="text-sm text-destructive">{errors.contactPersonDesignation}</p>
                      )}
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="contactEmail">Email Address *</Label>
                      <Input
                        id="contactEmail"
                        type="email"
                        placeholder="hr@company.com"
                        value={formData.contactPersonEmail}
                        onChange={(e) => handleInputChange("contactPersonEmail", e.target.value)}
                        className={errors.contactPersonEmail ? "border-destructive" : ""}
                      />
                      {errors.contactPersonEmail && (
                        <p className="text-sm text-destructive">{errors.contactPersonEmail}</p>
                      )}
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="contactPhone">Phone Number *</Label>
                      <Input
                        id="contactPhone"
                        placeholder="+91 9876543210"
                        value={formData.contactPersonPhone}
                        onChange={(e) => handleInputChange("contactPersonPhone", e.target.value)}
                        className={errors.contactPersonPhone ? "border-destructive" : ""}
                      />
                      {errors.contactPersonPhone && (
                        <p className="text-sm text-destructive">{errors.contactPersonPhone}</p>
                      )}
                      <p className="text-xs text-muted-foreground">Format: +91 followed by 10 digits</p>
                    </div>
                  </div>
                </div>
              )}

              {/* Documents Step */}
              {currentStep === "documents" && (
                <div className="space-y-6">
                  <div className="bg-accent/10 rounded-lg p-4 flex items-start gap-3">
                    <Shield className="w-5 h-5 text-accent mt-0.5" />
                    <div>
                      <p className="text-sm text-foreground">
                        Documents are optional during registration. You can complete them later.
                        For testing, you can skip document uploads.
                      </p>
                    </div>
                  </div>

                  <div className="grid md:grid-cols-2 gap-6">
                    <DocumentUpload
                      label="Company Registration Certificate"
                      value={formData.registrationCertificate}
                      onChange={(file) => handleInputChange("registrationCertificate", file)}
                      helpText="Certificate of Incorporation or Registration"
                    />

                    <DocumentUpload
                      label="GST Certificate"
                      value={formData.gstCertificate}
                      onChange={(file) => handleInputChange("gstCertificate", file)}
                      helpText="GST Registration Certificate"
                    />

                    <DocumentUpload
                      label="Company Logo"
                      accept="image/*"
                      value={formData.companyLogo}
                      onChange={(file) => handleInputChange("companyLogo", file)}
                      helpText="PNG or JPG (Recommended: 200x200px)"
                    />
                  </div>
                </div>
              )}

              {/* Payment Step */}
              {currentStep === "payment" && (
                <div className="space-y-6">
                  <div className="bg-accent/10 rounded-lg p-4 mb-6">
                    <p className="text-sm text-foreground">
                      📝 For testing purposes, payment is optional. You can complete registration without payment.
                    </p>
                  </div>

                  {/* Account Credentials */}
                  <div className="space-y-4">
                    <h4 className="font-semibold text-foreground">Account Credentials</h4>

                    <div className="space-y-2">
                      <Label htmlFor="username">Username *</Label>
                      <Input
                        id="username"
                        placeholder="Choose a unique username"
                        value={formData.username}
                        onChange={(e) => handleInputChange("username", e.target.value.toLowerCase())}
                        className={errors.username ? "border-destructive" : ""}
                      />
                      {errors.username && <p className="text-sm text-destructive">{errors.username}</p>}
                      <p className="text-xs text-muted-foreground">
                        3-20 characters, letters, numbers, underscores only
                      </p>
                    </div>

                    <div className="grid md:grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label htmlFor="password">Password *</Label>
                        <div className="relative">
                          <Input
                            id="password"
                            type={showPassword ? "text" : "password"}
                            placeholder="Create a strong password"
                            value={formData.password}
                            onChange={(e) => handleInputChange("password", e.target.value)}
                            className={errors.password ? "border-destructive" : ""}
                          />
                          <button
                            type="button"
                            className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                            onClick={() => setShowPassword(!showPassword)}
                          >
                            {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                          </button>
                        </div>
                        {errors.password && <p className="text-sm text-destructive">{errors.password}</p>}
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="confirmPassword">Confirm Password *</Label>
                        <Input
                          id="confirmPassword"
                          type="password"
                          placeholder="Confirm your password"
                          value={formData.confirmPassword}
                          onChange={(e) => handleInputChange("confirmPassword", e.target.value)}
                          className={errors.confirmPassword ? "border-destructive" : ""}
                        />
                        {errors.confirmPassword && (
                          <p className="text-sm text-destructive">{errors.confirmPassword}</p>
                        )}
                      </div>
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="referralCode">Referral Code (Optional)</Label>
                      <Input
                        id="referralCode"
                        placeholder="Enter referral code if you have one"
                        value={formData.referralCode}
                        onChange={(e) => handleInputChange("referralCode", e.target.value.toUpperCase())}
                      />
                    </div>
                  </div>

                  {/* Subscription Info */}
                  <div className="border rounded-lg p-4">
                    <h4 className="font-semibold text-foreground mb-2">Annual Subscription</h4>
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-2xl font-bold text-accent">₹5,000</p>
                        <p className="text-sm text-muted-foreground">per year (excl. GST)</p>
                      </div>
                      <div className="text-right text-sm text-muted-foreground">
                        <p>✓ Unlimited candidate searches</p>
                        <p>✓ Create skill tests</p>
                        <p>✓ Reserve candidates</p>
                      </div>
                    </div>
                    <p className="text-xs text-muted-foreground mt-2">
                      * Payment can be completed after registration
                    </p>
                  </div>

                  <div className="space-y-3">
                    <div className="flex items-start space-x-2">
                      <Checkbox
                        id="terms"
                        checked={formData.agreeTerms}
                        onCheckedChange={(checked) => handleInputChange("agreeTerms", checked)}
                      />
                      <label htmlFor="terms" className="text-sm text-muted-foreground leading-tight">
                        I agree to the{" "}
                        <Link to="/terms" className="text-accent hover:underline">
                          Terms of Service
                        </Link>{" "}
                        and{" "}
                        <Link to="/privacy" className="text-accent hover:underline">
                          Privacy Policy
                        </Link>
                      </label>
                    </div>
                    {errors.agreeTerms && <p className="text-sm text-destructive">{errors.agreeTerms}</p>}
                  </div>
                </div>
              )}

              {/* Navigation Buttons */}
              <div className="flex justify-between mt-8 pt-6 border-t">
                {currentStepIndex > 0 ? (
                  <Button type="button" variant="outline" onClick={prevStep}>
                    <ArrowLeft className="w-4 h-4 mr-2" />
                    Previous
                  </Button>
                ) : (
                  <div />
                )}

                {currentStepIndex < steps.length - 1 ? (
                  <Button type="button" variant="accent" onClick={nextStep}>
                    Continue
                    <ArrowRight className="w-4 h-4 ml-2" />
                  </Button>
                ) : (
                  <Button type="button" variant="accent" onClick={handleSubmit} disabled={loading}>
                    {loading ? (
                      <>
                        <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                        Creating Account...
                      </>
                    ) : (
                      <>
                        <CheckCircle2 className="w-4 h-4 mr-2" />
                        Create Account
                      </>
                    )}
                  </Button>
                )}
              </div>

              {/* Login Link */}
              <p className="text-center text-sm text-muted-foreground mt-6">
                Already have an account?{" "}
                <Link to="/login" className="text-accent hover:underline font-medium">
                  Login here
                </Link>
              </p>
            </CardContent>
          </Card>
        </div>
      </main>
    </div>
  );
};

export default EmployerRegister;
