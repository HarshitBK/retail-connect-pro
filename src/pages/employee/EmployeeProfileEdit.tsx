import { useState, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import Header from "@/components/layout/Header";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { ScrollArea } from "@/components/ui/scroll-area";
import { ArrowLeft, Loader2, Save, User } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { useToast } from "@/hooks/use-toast";
import { useIndianLocations } from "@/hooks/useIndianLocations";
import WorkLocationSelector, { SelectedCity } from "@/components/shared/WorkLocationSelector";
import RetailCategorySelector from "@/components/shared/RetailCategorySelector";
import DocumentUpload from "@/components/shared/DocumentUpload";
import { supabase } from "@/integrations/supabase/client";
import { SKILL_OPTIONS, EDUCATION_LEVELS, EXPERIENCE_LEVELS } from "@/lib/constants";
import {
  phoneSchema,
  panSchema,
  aadharSchema,
  ifscSchema,
  pincodeSchema,
} from "@/lib/validations";

const EmployeeProfileEdit = () => {
  const navigate = useNavigate();
  const { user, profile, employeeProfile, refreshProfile } = useAuth();
  const { toast } = useToast();
  const { states, fetchCitiesByState } = useIndianLocations();

  const [loading, setLoading] = useState(false);
  const [loadingCities, setLoadingCities] = useState(false);
  const [availableCities, setAvailableCities] = useState<{ id: string; name: string }[]>([]);
  const [errors, setErrors] = useState<Record<string, string>>({});

  const [formData, setFormData] = useState({
    fullName: "",
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
    educationLevel: "",
    educationDetails: "",
    yearsOfExperience: "",
    currentOrganization: "",
    skills: [] as string[],
    retailCategories: [] as string[],
    preferredWorkCities: [] as SelectedCity[],
    aadharNumber: "",
    panNumber: "",
    bankName: "",
    bankAccountNumber: "",
    bankIfsc: "",
  });

  useEffect(() => {
    const fetchProfile = async () => {
      if (!user) return;
      
      const { data } = await supabase
        .from("employee_profiles")
        .select("*")
        .eq("user_id", user.id)
        .maybeSingle();
      
      if (data) {
        setFormData({
          fullName: data.full_name || "",
          phone: profile?.phone || "",
          dateOfBirth: data.date_of_birth || "",
          gender: data.gender || "",
          addressLine1: data.address_line1 || "",
          addressLine2: data.address_line2 || "",
          stateId: data.state || "",
          stateName: "",
          cityId: data.city || "",
          cityName: "",
          pincode: data.pincode || "",
          educationLevel: data.education_level || "",
          educationDetails: data.education_details || "",
          yearsOfExperience: String(data.years_of_experience || ""),
          currentOrganization: data.current_organization || "",
          skills: (data.skills as string[]) || [],
          retailCategories: (data.retail_categories as string[]) || [],
          preferredWorkCities: (data.preferred_work_cities as unknown as SelectedCity[]) || [],
          aadharNumber: data.aadhar_number || "",
          panNumber: data.pan_number || "",
          bankName: data.bank_name || "",
          bankAccountNumber: data.bank_account_number || "",
          bankIfsc: data.bank_ifsc || "",
        });
      }
    };
    
    fetchProfile();
  }, [user, profile]);

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

  const toggleSkill = (skill: string) => {
    setFormData((prev) => ({
      ...prev,
      skills: prev.skills.includes(skill)
        ? prev.skills.filter((s) => s !== skill)
        : [...prev.skills, skill],
    }));
  };

  const validateForm = (): boolean => {
    const newErrors: Record<string, string> = {};

    if (!formData.fullName.trim()) newErrors.fullName = "Full name is required";

    if (formData.phone) {
      const phoneResult = phoneSchema.safeParse(formData.phone);
      if (!phoneResult.success) newErrors.phone = phoneResult.error.errors[0]?.message || "Invalid phone";
    }

    if (formData.pincode) {
      const pincodeResult = pincodeSchema.safeParse(formData.pincode);
      if (!pincodeResult.success) newErrors.pincode = pincodeResult.error.errors[0]?.message || "Invalid pincode";
    }

    if (formData.aadharNumber) {
      const aadharResult = aadharSchema.safeParse(formData.aadharNumber);
      if (!aadharResult.success) newErrors.aadharNumber = aadharResult.error.errors[0]?.message || "Invalid Aadhar";
    }

    if (formData.panNumber) {
      const panResult = panSchema.safeParse(formData.panNumber);
      if (!panResult.success) newErrors.panNumber = panResult.error.errors[0]?.message || "Invalid PAN";
    }

    if (formData.bankIfsc) {
      const ifscResult = ifscSchema.safeParse(formData.bankIfsc);
      if (!ifscResult.success) newErrors.bankIfsc = ifscResult.error.errors[0]?.message || "Invalid IFSC";
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async () => {
    if (!validateForm()) return;
    if (!user || !employeeProfile) return;

    setLoading(true);

    try {
      // Update profile phone
      if (formData.phone !== profile?.phone) {
        await supabase.from("profiles").update({ phone: formData.phone }).eq("id", user.id);
      }

      // Update employee profile
      const { error } = await supabase
        .from("employee_profiles")
        .update({
          full_name: formData.fullName,
          date_of_birth: formData.dateOfBirth || null,
          gender: formData.gender || null,
          address_line1: formData.addressLine1 || null,
          address_line2: formData.addressLine2 || null,
          state: formData.stateId || null,
          city: formData.cityId || null,
          pincode: formData.pincode || null,
          education_level: formData.educationLevel || null,
          education_details: formData.educationDetails || null,
          years_of_experience: formData.yearsOfExperience ? parseInt(formData.yearsOfExperience) : 0,
          current_organization: formData.currentOrganization || null,
          skills: formData.skills,
          retail_categories: formData.retailCategories,
          preferred_work_cities: formData.preferredWorkCities as unknown as any,
          aadhar_number: formData.aadharNumber || null,
          pan_number: formData.panNumber || null,
          bank_name: formData.bankName || null,
          bank_account_number: formData.bankAccountNumber || null,
          bank_ifsc: formData.bankIfsc || null,
        })
        .eq("user_id", user.id);

      if (error) throw error;

      await refreshProfile();

      toast({
        title: "Profile Updated!",
        description: "Your profile has been saved successfully.",
      });

      navigate("/employee/dashboard");
    } catch (error: any) {
      toast({
        title: "Update Failed",
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
          <div className="flex items-center gap-4 mb-8">
            <Button variant="ghost" size="icon" onClick={() => navigate(-1)}>
              <ArrowLeft className="w-5 h-5" />
            </Button>
            <div>
              <h1 className="font-display text-2xl md:text-3xl font-bold text-foreground">
                Edit Profile
              </h1>
              <p className="text-muted-foreground">Update your personal and professional details</p>
            </div>
          </div>

          <div className="space-y-6">
            {/* Personal Details */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <User className="w-5 h-5" />
                  Personal Details
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
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
                    <Label htmlFor="phone">Phone Number</Label>
                    <Input
                      id="phone"
                      placeholder="+91 9876543210"
                      value={formData.phone}
                      onChange={(e) => handleInputChange("phone", e.target.value)}
                      className={errors.phone ? "border-destructive" : ""}
                    />
                    {errors.phone && <p className="text-sm text-destructive">{errors.phone}</p>}
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="dob">Date of Birth</Label>
                    <Input
                      id="dob"
                      type="date"
                      value={formData.dateOfBirth}
                      onChange={(e) => handleInputChange("dateOfBirth", e.target.value)}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Gender</Label>
                    <Select value={formData.gender} onValueChange={(v) => handleInputChange("gender", v)}>
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
                </div>

                {/* Address */}
                <div className="border-t pt-4">
                  <h4 className="font-medium mb-4">Address</h4>
                  <div className="space-y-4">
                    <div className="grid md:grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label htmlFor="addressLine1">Address Line 1</Label>
                        <Input
                          id="addressLine1"
                          placeholder="House/Flat number, Building"
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
                    </div>
                    <div className="grid md:grid-cols-3 gap-4">
                      <div className="space-y-2">
                        <Label>State</Label>
                        <Select value={formData.stateId} onValueChange={handleStateChange}>
                          <SelectTrigger>
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
                      </div>
                      <div className="space-y-2">
                        <Label>City</Label>
                        <Select
                          value={formData.cityId}
                          onValueChange={handleCityChange}
                          disabled={!formData.stateId || loadingCities}
                        >
                          <SelectTrigger>
                            <SelectValue
                              placeholder={loadingCities ? "Loading..." : "Select city"}
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
              </CardContent>
            </Card>

            {/* Professional Details */}
            <Card>
              <CardHeader>
                <CardTitle>Professional Details</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>Education Level</Label>
                    <Select
                      value={formData.educationLevel}
                      onValueChange={(v) => handleInputChange("educationLevel", v)}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Select education" />
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
                  <div className="space-y-2">
                    <Label>Experience</Label>
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
                      placeholder="Company name"
                      value={formData.currentOrganization}
                      onChange={(e) => handleInputChange("currentOrganization", e.target.value)}
                    />
                  </div>
                </div>

                {/* Skills */}
                <div className="space-y-2">
                  <Label>Skills</Label>
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
                </div>

                {/* Retail Categories */}
                <RetailCategorySelector
                  selectedCategories={formData.retailCategories}
                  onChange={(cats) => handleInputChange("retailCategories", cats)}
                  maxCategories={5}
                />

                {/* Preferred Work Locations */}
                <WorkLocationSelector
                  selectedCities={formData.preferredWorkCities}
                  onChange={(cities) => handleInputChange("preferredWorkCities", cities)}
                  maxCities={5}
                />
              </CardContent>
            </Card>

            {/* Documents & Bank Details */}
            <Card>
              <CardHeader>
                <CardTitle>Documents & Bank Details</CardTitle>
                <CardDescription>Optional but recommended for verification</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid md:grid-cols-2 gap-4">
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
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="pan">PAN Number</Label>
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
              </CardContent>
            </Card>

            {/* Save Button */}
            <div className="flex justify-end gap-4">
              <Button variant="outline" onClick={() => navigate(-1)}>
                Cancel
              </Button>
              <Button variant="hero" onClick={handleSubmit} disabled={loading}>
                {loading ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    Saving...
                  </>
                ) : (
                  <>
                    <Save className="w-4 h-4 mr-2" />
                    Save Changes
                  </>
                )}
              </Button>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
};

export default EmployeeProfileEdit;
