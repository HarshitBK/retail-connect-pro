import { useState, useEffect } from "react";
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
  User,
  Briefcase,
  FileText,
  CheckCircle2,
  ArrowRight,
  ArrowLeft,
  Upload,
  Loader2,
  Eye,
  EyeOff,
} from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { useToast } from "@/hooks/use-toast";
import { useIndianLocations } from "@/hooks/useIndianLocations";
import WorkLocationSelector, { SelectedCity } from "@/components/shared/WorkLocationSelector";
import RetailCategorySelector from "@/components/shared/RetailCategorySelector";
import DocumentUpload from "@/components/shared/DocumentUpload";
import {
  phoneSchema,
  emailSchema,
  panSchema,
  aadharSchema,
  ifscSchema,
  passwordSchema,
  usernameSchema,
  pincodeSchema,
} from "@/lib/validations";
import { SKILL_OPTIONS, EDUCATION_LEVELS, EXPERIENCE_LEVELS } from "@/lib/constants";
import { supabase } from "@/integrations/supabase/client";

type Step = "personal" | "professional" | "documents" | "account";

const EmployeeRegister = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const referralCode = searchParams.get("ref") || "";
  const { signUp } = useAuth();
  const { toast } = useToast();
  const { states, fetchCitiesByState } = useIndianLocations();

  const [currentStep, setCurrentStep] = useState<Step>("personal");
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});

  // Location states
  const [selectedStateId, setSelectedStateId] = useState("");
  const [availableCities, setAvailableCities] = useState<{ id: string; name: string }[]>([]);
  const [loadingCities, setLoadingCities] = useState(false);

  const [formData, setFormData] = useState({
    // Personal
    fullName: "",
    email: "",
    phone: "",
    dateOfBirth: "",
    gender: "",
    addressLine1: "",
    addressLine2: "",
    stateId: "",
    stateName: "",
    cityId: "",
    cityName: "",
    pincode: "",
    photo: null as File | null,
    // Education
    educationLevel: "",
    educationDetails: "",
    // Professional
    yearsOfExperience: "",
    currentOrganization: "",
    skills: [] as string[],
    retailCategories: [] as string[],
    preferredWorkCities: [] as SelectedCity[],
    resume: null as File | null,
    // Documents
    aadharNumber: "",
    aadharDocument: null as File | null,
    panNumber: "",
    panDocument: null as File | null,
    bankName: "",
    bankAccountNumber: "",
    bankIfsc: "",
    // Account
    username: "",
    password: "",
    confirmPassword: "",
    referralCode: referralCode,
    agreeTerms: false,
  });

  const steps: { id: Step; label: string; icon: React.ElementType }[] = [
    { id: "personal", label: "Personal Details", icon: User },
    { id: "professional", label: "Professional", icon: Briefcase },
    { id: "documents", label: "Documents", icon: FileText },
    { id: "account", label: "Create Account", icon: CheckCircle2 },
  ];

  const currentStepIndex = steps.findIndex((s) => s.id === currentStep);
  const progress = ((currentStepIndex + 1) / steps.length) * 100;

  const handleInputChange = (field: string, value: any) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
    // Clear error when user types
    if (errors[field]) {
      setErrors((prev) => ({ ...prev, [field]: "" }));
    }
  };

  const handleStateChange = async (stateId: string) => {
    const state = states.find((s) => s.id === stateId);
    if (!state) return;

    setSelectedStateId(stateId);
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

  const toggleSkill = (skill: string) => {
    setFormData((prev) => ({
      ...prev,
      skills: prev.skills.includes(skill)
        ? prev.skills.filter((s) => s !== skill)
        : [...prev.skills, skill],
    }));
  };

  const validateStep = (step: Step): boolean => {
    const newErrors: Record<string, string> = {};

    if (step === "personal") {
      if (!formData.fullName.trim()) newErrors.fullName = "Full name is required";
      
      const emailResult = emailSchema.safeParse(formData.email);
      if (!emailResult.success) newErrors.email = emailResult.error.errors[0]?.message || "Invalid email";
      
      const phoneResult = phoneSchema.safeParse(formData.phone);
      if (!phoneResult.success) newErrors.phone = phoneResult.error.errors[0]?.message || "Invalid phone";
      
      if (!formData.dateOfBirth) newErrors.dateOfBirth = "Date of birth is required";
      if (!formData.gender) newErrors.gender = "Gender is required";
      if (!formData.stateId) newErrors.stateId = "State is required";
      if (!formData.cityId) newErrors.cityId = "City is required";
      
      if (formData.pincode) {
        const pincodeResult = pincodeSchema.safeParse(formData.pincode);
        if (!pincodeResult.success) newErrors.pincode = pincodeResult.error.errors[0]?.message || "Invalid pincode";
      }
    }

    if (step === "professional") {
      if (!formData.educationLevel) newErrors.educationLevel = "Education level is required";
      if (formData.skills.length === 0) newErrors.skills = "Select at least one skill";
      if (formData.retailCategories.length === 0) newErrors.retailCategories = "Select at least one retail category";
      if (formData.preferredWorkCities.length === 0) newErrors.preferredWorkCities = "Select at least one preferred work city";
    }

    if (step === "documents") {
      // Aadhar validation (optional for dry run)
      if (formData.aadharNumber) {
        const aadharResult = aadharSchema.safeParse(formData.aadharNumber);
        if (!aadharResult.success) newErrors.aadharNumber = aadharResult.error.errors[0]?.message || "Invalid Aadhar";
      }
      
      // PAN validation (optional for dry run)
      if (formData.panNumber) {
        const panResult = panSchema.safeParse(formData.panNumber);
        if (!panResult.success) newErrors.panNumber = panResult.error.errors[0]?.message || "Invalid PAN";
      }

      // IFSC validation (optional)
      if (formData.bankIfsc) {
        const ifscResult = ifscSchema.safeParse(formData.bankIfsc);
        if (!ifscResult.success) newErrors.bankIfsc = ifscResult.error.errors[0]?.message || "Invalid IFSC";
      }
    }

    if (step === "account") {
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
    if (!validateStep("account")) return;

    setLoading(true);

    try {
      // 1. Create auth user - profile is auto-created via trigger
      const { error: signUpError, user } = await signUp(formData.email, formData.password, "employee");

      if (signUpError) {
        toast({
          title: "Registration Failed",
          description: signUpError.message,
          variant: "destructive",
        });
        setLoading(false);
        return;
      }

      if (user) {
        // Update profile with username and phone
        await supabase
          .from("profiles")
          .update({
            username: formData.username,
            phone: formData.phone,
            referred_by: formData.referralCode || null,
          })
          .eq("id", user.id);

        // Create employee profile immediately (auto-confirm is enabled)
        const { error: empError } = await supabase
          .from("employee_profiles")
          .insert([{
            user_id: user.id,
            full_name: formData.fullName,
            gender: formData.gender,
            date_of_birth: formData.dateOfBirth || null,
            address_line1: formData.addressLine1,
            address_line2: formData.addressLine2,
            state: formData.stateName,
            city: formData.cityName,
            pincode: formData.pincode,
            education_level: formData.educationLevel,
            education_details: formData.educationDetails,
            years_of_experience: parseInt(formData.yearsOfExperience) || 0,
            current_organization: formData.currentOrganization,
            skills: formData.skills,
            retail_categories: formData.retailCategories,
            preferred_work_cities: JSON.parse(JSON.stringify(formData.preferredWorkCities)),
            aadhar_number: formData.aadharNumber || null,
            pan_number: formData.panNumber || null,
            bank_name: formData.bankName,
            bank_account_number: formData.bankAccountNumber,
            bank_ifsc: formData.bankIfsc,
            employment_status: "available",
            profile_completion_percent: calculateProfileCompletion(),
          }]);

        if (empError) {
          console.error("Employee profile error:", empError);
        }

        // Handle referral reward
        if (formData.referralCode) {
          await handleReferralReward(user.id, formData.referralCode);
        }
      }

      toast({
        title: "Registration Successful! 🎉",
        description: "Your account has been created. You earned 10 bonus points!",
      });

      navigate("/employee/dashboard");
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

  const calculateProfileCompletion = (): number => {
    let score = 0;
    const fields = [
      formData.fullName,
      formData.phone,
      formData.dateOfBirth,
      formData.gender,
      formData.addressLine1,
      formData.stateName,
      formData.cityName,
      formData.educationLevel,
      formData.skills.length > 0,
      formData.retailCategories.length > 0,
      formData.preferredWorkCities.length > 0,
    ];
    fields.forEach(f => { if (f) score += 9; });
    return Math.min(score, 100);
  };

  const handleReferralReward = async (newUserId: string, referralCode: string) => {
    try {
      const { data: referrer } = await supabase
        .from("profiles")
        .select("id")
        .eq("referral_code", referralCode)
        .maybeSingle();

      if (referrer) {
        await supabase.from("referral_rewards").insert({
          referrer_user_id: referrer.id,
          referred_user_id: newUserId,
          points_awarded: 15,
        });

        const { data: rewards } = await supabase
          .from("reward_points")
          .select("id, points")
          .eq("user_id", referrer.id)
          .maybeSingle();

        if (rewards) {
          await supabase
            .from("reward_points")
            .update({ points: (rewards.points || 0) + 15 })
            .eq("id", rewards.id);
        }
      }
    } catch (err) {
      console.error("Referral error:", err);
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
              Create Your Profile
            </h1>
            <p className="text-muted-foreground">
              Register for free and get discovered by top employers
            </p>
            {referralCode && (
              <p className="text-sm text-primary mt-2">
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
              <CardTitle className="font-display">{steps[currentStepIndex].label}</CardTitle>
              <CardDescription>
                {currentStep === "personal" && "Tell us about yourself"}
                {currentStep === "professional" && "Share your work experience and skills"}
                {currentStep === "documents" && "Upload documents for verification (optional for now)"}
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
                        onChange={(e) => handleInputChange("fullName", e.target.value)}
                        className={errors.fullName ? "border-destructive" : ""}
                      />
                      {errors.fullName && <p className="text-sm text-destructive">{errors.fullName}</p>}
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="email">Email Address *</Label>
                      <Input
                        id="email"
                        type="email"
                        placeholder="your@email.com"
                        value={formData.email}
                        onChange={(e) => handleInputChange("email", e.target.value)}
                        className={errors.email ? "border-destructive" : ""}
                      />
                      {errors.email && <p className="text-sm text-destructive">{errors.email}</p>}
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="phone">Phone Number *</Label>
                      <Input
                        id="phone"
                        placeholder="+91 9876543210"
                        value={formData.phone}
                        onChange={(e) => handleInputChange("phone", e.target.value)}
                        className={errors.phone ? "border-destructive" : ""}
                      />
                      {errors.phone && <p className="text-sm text-destructive">{errors.phone}</p>}
                      <p className="text-xs text-muted-foreground">Format: +91 followed by 10 digits</p>
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="dob">Date of Birth *</Label>
                      <Input
                        id="dob"
                        type="date"
                        value={formData.dateOfBirth}
                        onChange={(e) => handleInputChange("dateOfBirth", e.target.value)}
                        className={errors.dateOfBirth ? "border-destructive" : ""}
                      />
                      {errors.dateOfBirth && <p className="text-sm text-destructive">{errors.dateOfBirth}</p>}
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="gender">Gender *</Label>
                      <Select value={formData.gender} onValueChange={(v) => handleInputChange("gender", v)}>
                        <SelectTrigger className={errors.gender ? "border-destructive" : ""}>
                          <SelectValue placeholder="Select gender" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="male">Male</SelectItem>
                          <SelectItem value="female">Female</SelectItem>
                          <SelectItem value="other">Other</SelectItem>
                        </SelectContent>
                      </Select>
                      {errors.gender && <p className="text-sm text-destructive">{errors.gender}</p>}
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="photo">Profile Photo</Label>
                      <Input
                        id="photo"
                        type="file"
                        accept="image/*"
                        onChange={(e) => handleInputChange("photo", e.target.files?.[0] || null)}
                      />
                    </div>
                  </div>

                  {/* Address Section */}
                  <div className="border-t pt-6">
                    <h4 className="font-semibold text-foreground mb-4">Current Address</h4>
                    <div className="space-y-4">
                      <div className="space-y-2">
                        <Label htmlFor="addressLine1">Address Line 1</Label>
                        <Input
                          id="addressLine1"
                          placeholder="House/Flat number, Building name"
                          value={formData.addressLine1}
                          onChange={(e) => handleInputChange("addressLine1", e.target.value)}
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="addressLine2">Address Line 2</Label>
                        <Input
                          id="addressLine2"
                          placeholder="Street, Locality"
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

                  {/* Education Section */}
                  <div className="border-t pt-6">
                    <h4 className="font-semibold text-foreground mb-4">Education Details</h4>
                    <div className="grid md:grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label>Highest Education *</Label>
                        <Select
                          value={formData.educationLevel}
                          onValueChange={(v) => handleInputChange("educationLevel", v)}
                        >
                          <SelectTrigger>
                            <SelectValue placeholder="Select education level" />
                          </SelectTrigger>
                          <SelectContent>
                            {EDUCATION_LEVELS.map((level) => (
                              <SelectItem key={level.value} value={level.value}>
                                {level.label}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="educationDetails">Institution/Details</Label>
                        <Input
                          id="educationDetails"
                          placeholder="School/College name"
                          value={formData.educationDetails}
                          onChange={(e) => handleInputChange("educationDetails", e.target.value)}
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
                      <Label>Total Experience</Label>
                      <Select
                        value={formData.yearsOfExperience}
                        onValueChange={(v) => handleInputChange("yearsOfExperience", v)}
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="Select experience" />
                        </SelectTrigger>
                        <SelectContent>
                          {EXPERIENCE_LEVELS.map((level) => (
                            <SelectItem key={level.value} value={level.value}>
                              {level.label}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="currentOrg">Current Organization</Label>
                      <Input
                        id="currentOrg"
                        placeholder="Company name (if employed)"
                        value={formData.currentOrganization}
                        onChange={(e) => handleInputChange("currentOrganization", e.target.value)}
                      />
                    </div>
                  </div>

                  {/* Skills */}
                  <div className="space-y-2">
                    <Label>Skills *</Label>
                    <p className="text-sm text-muted-foreground mb-2">Select all that apply</p>
                    <div className="flex flex-wrap gap-2">
                      {SKILL_OPTIONS.map((skill) => (
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
                    {errors.skills && <p className="text-sm text-destructive">{errors.skills}</p>}
                  </div>

                  {/* Retail Categories */}
                  <RetailCategorySelector
                    selectedCategories={formData.retailCategories}
                    onChange={(cats) => handleInputChange("retailCategories", cats)}
                    maxCategories={5}
                  />
                  {errors.retailCategories && (
                    <p className="text-sm text-destructive">{errors.retailCategories}</p>
                  )}

                  {/* Preferred Work Locations */}
                  <WorkLocationSelector
                    selectedCities={formData.preferredWorkCities}
                    onChange={(cities) => handleInputChange("preferredWorkCities", cities)}
                    maxCities={5}
                  />
                  {errors.preferredWorkCities && (
                    <p className="text-sm text-destructive">{errors.preferredWorkCities}</p>
                  )}

                  {/* Resume Upload */}
                  <DocumentUpload
                    label="Upload Resume/CV"
                    accept=".pdf,.doc,.docx"
                    value={formData.resume}
                    onChange={(file) => handleInputChange("resume", file)}
                    helpText="PDF or Word document (Max 5MB)"
                  />
                </div>
              )}

              {/* Documents Step */}
              {currentStep === "documents" && (
                <div className="space-y-6">
                  <div className="bg-primary/10 rounded-lg p-4 mb-6">
                    <p className="text-sm text-foreground">
                      📝 Documents are optional during registration. You can complete them later from your dashboard. 
                      For testing, you can skip document uploads.
                    </p>
                  </div>

                  <div className="grid md:grid-cols-2 gap-6">
                    {/* Aadhar */}
                    <div className="space-y-4">
                      <div className="space-y-2">
                        <Label htmlFor="aadhar">Aadhar Number</Label>
                        <Input
                          id="aadhar"
                          placeholder="1234 5678 9012"
                          value={formData.aadharNumber}
                          onChange={(e) => handleInputChange("aadharNumber", e.target.value)}
                          className={errors.aadharNumber ? "border-destructive" : ""}
                        />
                        {errors.aadharNumber && (
                          <p className="text-sm text-destructive">{errors.aadharNumber}</p>
                        )}
                        <p className="text-xs text-muted-foreground">12 digits only</p>
                      </div>
                      <DocumentUpload
                        label="Upload Aadhar Card"
                        value={formData.aadharDocument}
                        onChange={(file) => handleInputChange("aadharDocument", file)}
                        helpText="Front and back in one file"
                      />
                    </div>

                    {/* PAN */}
                    <div className="space-y-4">
                      <div className="space-y-2">
                        <Label htmlFor="pan">PAN Number</Label>
                        <Input
                          id="pan"
                          placeholder="ABCDE1234F"
                          value={formData.panNumber}
                          onChange={(e) => handleInputChange("panNumber", e.target.value.toUpperCase())}
                          className={errors.panNumber ? "border-destructive" : ""}
                        />
                        {errors.panNumber && (
                          <p className="text-sm text-destructive">{errors.panNumber}</p>
                        )}
                        <p className="text-xs text-muted-foreground">Format: 5 letters + 4 digits + 1 letter</p>
                      </div>
                      <DocumentUpload
                        label="Upload PAN Card"
                        value={formData.panDocument}
                        onChange={(file) => handleInputChange("panDocument", file)}
                      />
                    </div>
                  </div>

                  {/* Bank Details */}
                  <div className="border-t pt-6">
                    <h4 className="font-semibold text-foreground mb-4">Bank Details (Optional)</h4>
                    <div className="grid md:grid-cols-3 gap-4">
                      <div className="space-y-2">
                        <Label htmlFor="bankName">Bank Name</Label>
                        <Input
                          id="bankName"
                          placeholder="Bank name"
                          value={formData.bankName}
                          onChange={(e) => handleInputChange("bankName", e.target.value)}
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="accountNumber">Account Number</Label>
                        <Input
                          id="accountNumber"
                          placeholder="Account number"
                          value={formData.bankAccountNumber}
                          onChange={(e) => handleInputChange("bankAccountNumber", e.target.value)}
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="ifsc">IFSC Code</Label>
                        <Input
                          id="ifsc"
                          placeholder="SBIN0001234"
                          value={formData.bankIfsc}
                          onChange={(e) => handleInputChange("bankIfsc", e.target.value.toUpperCase())}
                          className={errors.bankIfsc ? "border-destructive" : ""}
                        />
                        {errors.bankIfsc && <p className="text-sm text-destructive">{errors.bankIfsc}</p>}
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* Account Step */}
              {currentStep === "account" && (
                <div className="space-y-6">
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
                      <p className="text-xs text-muted-foreground">
                        Min 8 characters with uppercase, lowercase, and number
                      </p>
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
                    <p className="text-xs text-muted-foreground">
                      Both you and your referrer will earn bonus points!
                    </p>
                  </div>

                  <div className="flex items-start space-x-2">
                    <Checkbox
                      id="terms"
                      checked={formData.agreeTerms}
                      onCheckedChange={(checked) => handleInputChange("agreeTerms", checked)}
                    />
                    <label htmlFor="terms" className="text-sm text-muted-foreground leading-tight">
                      I agree to the{" "}
                      <Link to="/terms" className="text-primary hover:underline">
                        Terms of Service
                      </Link>{" "}
                      and{" "}
                      <Link to="/privacy" className="text-primary hover:underline">
                        Privacy Policy
                      </Link>
                    </label>
                  </div>
                  {errors.agreeTerms && <p className="text-sm text-destructive">{errors.agreeTerms}</p>}

                  <div className="bg-success/10 border border-success/30 rounded-lg p-4">
                    <p className="text-sm text-foreground">
                      🎁 <strong>Registration Bonus:</strong> You'll receive 10 reward points upon successful registration!
                    </p>
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
                  <Button type="button" variant="hero" onClick={nextStep}>
                    Continue
                    <ArrowRight className="w-4 h-4 ml-2" />
                  </Button>
                ) : (
                  <Button type="button" variant="hero" onClick={handleSubmit} disabled={loading}>
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
                <Link to="/login" className="text-primary hover:underline font-medium">
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

export default EmployeeRegister;
