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
import { ArrowLeft, Building2, Loader2, Save } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { useToast } from "@/hooks/use-toast";
import { useIndianLocations } from "@/hooks/useIndianLocations";
import RetailCategorySelector from "@/components/shared/RetailCategorySelector";
import { supabase } from "@/integrations/supabase/client";
import { COMPANY_TYPES, COMPANY_SIZES, INDUSTRY_TYPES } from "@/lib/constants";
import {
  phoneSchema,
  emailSchema,
  panSchema,
  gstSchema,
  pincodeSchema,
} from "@/lib/validations";

const EmployerProfileEdit = () => {
  const navigate = useNavigate();
  const { user, profile, employerProfile, refreshProfile } = useAuth();
  const { toast } = useToast();
  const { states, fetchCitiesByState } = useIndianLocations();

  const [loading, setLoading] = useState(false);
  const [loadingCities, setLoadingCities] = useState(false);
  const [availableCities, setAvailableCities] = useState<{ id: string; name: string }[]>([]);
  const [errors, setErrors] = useState<Record<string, string>>({});

  const [formData, setFormData] = useState({
    organizationName: "",
    organizationType: "",
    gstNumber: "",
    panNumber: "",
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
    retailCategories: [] as string[],
    contactPersonName: "",
    contactPersonDesignation: "",
    contactPersonEmail: "",
    contactPersonPhone: "",
  });

  useEffect(() => {
    const fetchProfile = async () => {
      if (!user) return;

      const { data } = await supabase
        .from("employer_profiles")
        .select("*")
        .eq("user_id", user.id)
        .maybeSingle();

      if (data) {
        setFormData((prev) => ({
          ...prev,
          organizationName: data.organization_name || "",
          organizationType: data.organization_type || "",
          gstNumber: data.gst_number || "",
          panNumber: data.pan_number || "",
          industry: "",
          companySize: "",
          numberOfStores: String(data.number_of_stores || ""),
          website: data.website || "",
          addressLine1: data.address_line1 || "",
          addressLine2: data.address_line2 || "",
          // store state and city as names so existing data shows up
          stateId: data.state || "",
          stateName: data.state || "",
          cityId: data.city || "",
          cityName: data.city || "",
          pincode: data.pincode || "",
          retailCategories: (data.retail_categories as string[]) || [],
          contactPersonName: data.contact_person_name || "",
          contactPersonDesignation: data.contact_person_designation || "",
          contactPersonEmail: data.contact_person_email || "",
          contactPersonPhone: data.contact_person_phone || "",
        }));
      }
    };

    fetchProfile();
  }, [user]);

  const handleInputChange = (field: string, value: any) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
    if (errors[field]) {
      setErrors((prev) => ({ ...prev, [field]: "" }));
    }
  };

  const handleStateChange = async (stateValue: string) => {
    const state = states.find((s) => s.id === stateValue || s.name === stateValue);
    if (!state) return;

    setFormData((prev) => ({
      ...prev,
      stateId: state.name,
      stateName: state.name,
      cityId: "",
      cityName: "",
    }));

    setLoadingCities(true);
    const cities = await fetchCitiesByState(state.id);
    setAvailableCities(cities.map((c) => ({ id: c.id, name: c.name })));
    setLoadingCities(false);
  };

  const handleCityChange = (cityValue: string) => {
    const city = availableCities.find((c) => c.id === cityValue || c.name === cityValue);
    if (!city) return;

    setFormData((prev) => ({
      ...prev,
      cityId: city.name,
      cityName: city.name,
    }));
  };

  const validateForm = (): boolean => {
    const newErrors: Record<string, string> = {};

    if (!formData.organizationName.trim()) newErrors.organizationName = "Company name is required";

    if (formData.gstNumber) {
      const gstResult = gstSchema.safeParse(formData.gstNumber);
      if (!gstResult.success) newErrors.gstNumber = gstResult.error.errors[0]?.message || "Invalid GST";
    }

    if (formData.panNumber) {
      const panResult = panSchema.safeParse(formData.panNumber);
      if (!panResult.success) newErrors.panNumber = panResult.error.errors[0]?.message || "Invalid PAN";
    }

    if (formData.pincode) {
      const pincodeResult = pincodeSchema.safeParse(formData.pincode);
      if (!pincodeResult.success) newErrors.pincode = pincodeResult.error.errors[0]?.message || "Invalid pincode";
    }

    if (formData.contactPersonEmail) {
      const emailResult = emailSchema.safeParse(formData.contactPersonEmail);
      if (!emailResult.success) newErrors.contactPersonEmail = emailResult.error.errors[0]?.message || "Invalid email";
    }

    if (formData.contactPersonPhone) {
      const phoneResult = phoneSchema.safeParse(formData.contactPersonPhone);
      if (!phoneResult.success) newErrors.contactPersonPhone = phoneResult.error.errors[0]?.message || "Invalid phone";
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async () => {
    if (!validateForm()) return;
    if (!user || !employerProfile) return;

    setLoading(true);

    try {
      const { error } = await supabase
        .from("employer_profiles")
        .update({
          organization_name: formData.organizationName,
          organization_type: formData.organizationType || null,
          gst_number: formData.gstNumber || null,
          pan_number: formData.panNumber || null,
          website: formData.website || null,
          address_line1: formData.addressLine1 || null,
          address_line2: formData.addressLine2 || null,
          state: formData.stateId || null,
          city: formData.cityId || null,
          pincode: formData.pincode || null,
          number_of_stores: formData.numberOfStores ? parseInt(formData.numberOfStores) : 1,
          retail_categories: formData.retailCategories,
          contact_person_name: formData.contactPersonName || null,
          contact_person_designation: formData.contactPersonDesignation || null,
          contact_person_email: formData.contactPersonEmail || null,
          contact_person_phone: formData.contactPersonPhone || null,
        })
        .eq("user_id", user.id);

      if (error) throw error;

      await refreshProfile();

      toast({
        title: "Profile Updated!",
        description: "Your company profile has been saved successfully.",
      });

      navigate("/employer/dashboard");
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
                Edit Company Profile
              </h1>
              <p className="text-muted-foreground">Update your company details</p>
            </div>
          </div>

          <div className="space-y-6">
            {/* Company Details */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Building2 className="w-5 h-5" />
                  Company Details
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
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
                    <Label>Company Type</Label>
                    <Select
                      value={formData.organizationType}
                      onValueChange={(v) => handleInputChange("organizationType", v)}
                    >
                      <SelectTrigger>
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
                    <Label htmlFor="numberOfStores">Number of Stores</Label>
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
                    <Label htmlFor="website">Website</Label>
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
                <div className="border-t pt-4">
                  <h4 className="font-medium mb-4">Address</h4>
                  <div className="space-y-4">
                    <div className="grid md:grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label htmlFor="addressLine1">Address Line 1</Label>
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
                                <SelectItem key={state.id} value={state.name}>
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
                                <SelectItem key={city.id} value={city.name}>
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

            {/* Contact Person */}
            <Card>
              <CardHeader>
                <CardTitle>Contact Person</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="contactName">Name</Label>
                    <Input
                      id="contactName"
                      placeholder="Full name"
                      value={formData.contactPersonName}
                      onChange={(e) => handleInputChange("contactPersonName", e.target.value)}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="designation">Designation</Label>
                    <Input
                      id="designation"
                      placeholder="e.g., HR Manager"
                      value={formData.contactPersonDesignation}
                      onChange={(e) => handleInputChange("contactPersonDesignation", e.target.value)}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="contactEmail">Email</Label>
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
                    <Label htmlFor="contactPhone">Phone</Label>
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
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Save Button */}
            <div className="flex justify-end gap-4">
              <Button variant="outline" onClick={() => navigate(-1)}>
                Cancel
              </Button>
              <Button variant="accent" onClick={handleSubmit} disabled={loading}>
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

export default EmployerProfileEdit;
