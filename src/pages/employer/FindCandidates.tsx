import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import Header from "@/components/layout/Header";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import {
  Search,
  Filter,
  MapPin,
  Briefcase,
  GraduationCap,
  Clock,
  CheckCircle2,
  AlertCircle,
  Users,
  IndianRupee,
  Loader2,
  ArrowLeft,
  RefreshCw
} from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { RETAIL_CATEGORIES, SKILL_OPTIONS, EDUCATION_LEVELS, EXPERIENCE_LEVELS } from "@/lib/constants";
import { useIndianLocations } from "@/hooks/useIndianLocations";

interface Candidate {
  id: string;
  fullName: string;
  skills: string[];
  retailCategories: string[];
  experience: number;
  educationLevel: string;
  city: string;
  state: string;
  preferredWorkCities: any[];
  employmentStatus: string;
  gender: string;
  profileCompletion: number;
}

const FindCandidates = () => {
  const { employerProfile, wallet } = useAuth();
  const { toast } = useToast();
  const { states, fetchCitiesByState } = useIndianLocations();
  
  const [candidates, setCandidates] = useState<Candidate[]>([]);
  const [loading, setLoading] = useState(true);
  const [reserving, setReserving] = useState(false);
  const [selectedCandidates, setSelectedCandidates] = useState<string[]>([]);
  const [showConfirmDialog, setShowConfirmDialog] = useState(false);
  
  const [filters, setFilters] = useState({
    state: "",
    city: "",
    experience: "",
    education: "",
    gender: "",
    retailCategory: "",
    skills: [] as string[],
    status: "available",
  });
  
  const [availableCities, setAvailableCities] = useState<{ id: string; name: string }[]>([]);
  const [loadingCities, setLoadingCities] = useState(false);

  useEffect(() => {
    fetchCandidates();
  }, []);

  useEffect(() => {
    if (filters.state) {
      loadCities(filters.state);
    }
  }, [filters.state]);

  const loadCities = async (stateId: string) => {
    setLoadingCities(true);
    const cities = await fetchCitiesByState(stateId);
    setAvailableCities(cities);
    setLoadingCities(false);
  };

  const fetchCandidates = async () => {
    setLoading(true);
    try {
      let query = supabase
        .from("employee_profiles")
        .select("*")
        .eq("is_blacklisted", false)
        .eq("employment_status", "available");

      const { data, error } = await query;

      if (error) throw error;

      const formattedCandidates: Candidate[] = (data || []).map(emp => ({
        id: emp.id,
        fullName: emp.full_name,
        skills: (emp.skills as string[]) || [],
        retailCategories: (emp.retail_categories as string[]) || [],
        experience: emp.years_of_experience || 0,
        educationLevel: emp.education_level || "",
        city: emp.city || "",
        state: emp.state || "",
        preferredWorkCities: (emp.preferred_work_cities as any[]) || [],
        employmentStatus: emp.employment_status || "available",
        gender: emp.gender || "",
        profileCompletion: emp.profile_completion_percent || 0,
      }));

      setCandidates(formattedCandidates);
    } catch (error) {
      console.error("Error fetching candidates:", error);
      toast({
        title: "Error",
        description: "Failed to load candidates",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const applyFilters = () => {
    // Filter locally for now (could be done server-side with more complex queries)
    fetchCandidates();
  };

  const filteredCandidates = candidates.filter(candidate => {
    if (filters.state && !candidate.state.toLowerCase().includes(filters.state.toLowerCase())) {
      return false;
    }
    if (filters.city && !candidate.city.toLowerCase().includes(filters.city.toLowerCase())) {
      return false;
    }
    if (filters.education && candidate.educationLevel !== filters.education) {
      return false;
    }
    if (filters.gender && candidate.gender.toLowerCase() !== filters.gender.toLowerCase()) {
      return false;
    }
    if (filters.retailCategory && !candidate.retailCategories.includes(filters.retailCategory)) {
      return false;
    }
    if (filters.experience) {
      const expRange = filters.experience;
      if (expRange === "fresher" && candidate.experience > 0) return false;
      if (expRange === "0-1" && (candidate.experience < 0 || candidate.experience > 1)) return false;
      if (expRange === "1-2" && (candidate.experience < 1 || candidate.experience > 2)) return false;
      if (expRange === "2-5" && (candidate.experience < 2 || candidate.experience > 5)) return false;
      if (expRange === "5+" && candidate.experience < 5) return false;
    }
    if (filters.skills.length > 0) {
      const hasSkill = filters.skills.some(s => candidate.skills.includes(s));
      if (!hasSkill) return false;
    }
    return true;
  });

  const toggleCandidate = (id: string) => {
    setSelectedCandidates(prev =>
      prev.includes(id) ? prev.filter(c => c !== id) : [...prev, id]
    );
  };

  const totalCost = selectedCandidates.length * 500;

  const handleGetDetails = () => {
    if (selectedCandidates.length === 0) {
      toast({
        title: "No candidates selected",
        description: "Please select at least one candidate to reserve",
        variant: "destructive",
      });
      return;
    }
    setShowConfirmDialog(true);
  };

  const confirmReservation = async () => {
    if (!employerProfile?.id) {
      toast({
        title: "Error",
        description: "Employer profile not found",
        variant: "destructive",
      });
      return;
    }

    // Check wallet balance
    if ((wallet?.balance || 0) < totalCost) {
      toast({
        title: "Insufficient Balance",
        description: `You need ₹${totalCost} to reserve these candidates. Your balance: ₹${wallet?.balance || 0}`,
        variant: "destructive",
      });
      setShowConfirmDialog(false);
      return;
    }

    setReserving(true);

    try {
      // Create reservations for each selected candidate
      const reservations = selectedCandidates.map(empId => ({
        employer_id: employerProfile.id,
        employee_id: empId,
        reservation_fee: 500,
        status: "pending" as const,
        expires_at: new Date(Date.now() + 5 * 24 * 60 * 60 * 1000).toISOString(), // 5 days
      }));

      const { error: resError } = await supabase
        .from("candidate_reservations")
        .insert(reservations);

      if (resError) throw resError;

      // Update employee status to reserved
      for (const empId of selectedCandidates) {
        await supabase
          .from("employee_profiles")
          .update({ 
            employment_status: "reserved",
            reserved_by: employerProfile.id,
            reservation_expires_at: new Date(Date.now() + 5 * 24 * 60 * 60 * 1000).toISOString(),
          })
          .eq("id", empId);
      }

      toast({
        title: "Candidates Reserved! 🎉",
        description: `You have successfully reserved ${selectedCandidates.length} candidate(s). Check your dashboard for details.`,
      });

      setSelectedCandidates([]);
      setShowConfirmDialog(false);
      fetchCandidates(); // Refresh list
    } catch (error: any) {
      console.error("Reservation error:", error);
      toast({
        title: "Reservation Failed",
        description: error.message || "Something went wrong",
        variant: "destructive",
      });
    } finally {
      setReserving(false);
    }
  };

  const getExperienceLabel = (years: number) => {
    if (years === 0) return "Fresher";
    if (years <= 1) return "0-1 years";
    if (years <= 2) return "1-2 years";
    if (years <= 5) return "2-5 years";
    return "5+ years";
  };

  const clearFilters = () => {
    setFilters({
      state: "",
      city: "",
      experience: "",
      education: "",
      gender: "",
      retailCategory: "",
      skills: [],
      status: "available",
    });
  };

  return (
    <div className="min-h-screen bg-muted/30">
      <Header />
      
      <main className="pt-24 pb-12">
        <div className="container mx-auto px-4">
          {/* Header */}
          <div className="mb-8">
            <Button variant="ghost" asChild className="mb-4">
              <Link to="/employer/dashboard">
                <ArrowLeft className="w-4 h-4 mr-2" />
                Back to Dashboard
              </Link>
            </Button>
            <h1 className="font-display text-2xl md:text-3xl font-bold text-foreground mb-2">
              Find Candidates
            </h1>
            <p className="text-muted-foreground">
              Search and filter through verified retail professionals
            </p>
          </div>

          <div className="grid lg:grid-cols-4 gap-6">
            {/* Filters Sidebar */}
            <div className="lg:col-span-1">
              <Card className="sticky top-24">
                <CardHeader>
                  <CardTitle className="text-lg flex items-center gap-2">
                    <Filter className="w-5 h-5" />
                    Filters
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  {/* State Filter */}
                  <div className="space-y-2">
                    <Label>State</Label>
                    <Select value={filters.state} onValueChange={v => setFilters(prev => ({ ...prev, state: v, city: "" }))}>
                      <SelectTrigger>
                        <SelectValue placeholder="Select state" />
                      </SelectTrigger>
                      <SelectContent>
                        {states.map(state => (
                          <SelectItem key={state.id} value={state.name}>
                            {state.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  {/* City Filter */}
                  {filters.state && (
                    <div className="space-y-2">
                      <Label>City</Label>
                      <Select value={filters.city} onValueChange={v => setFilters(prev => ({ ...prev, city: v }))}>
                        <SelectTrigger>
                          <SelectValue placeholder={loadingCities ? "Loading..." : "Select city"} />
                        </SelectTrigger>
                        <SelectContent>
                          {availableCities.map(city => (
                            <SelectItem key={city.id} value={city.name}>
                              {city.name}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                  )}

                  {/* Retail Category Filter */}
                  <div className="space-y-2">
                    <Label>Retail Category</Label>
                    <Select value={filters.retailCategory} onValueChange={v => setFilters(prev => ({ ...prev, retailCategory: v }))}>
                      <SelectTrigger>
                        <SelectValue placeholder="Select category" />
                      </SelectTrigger>
                      <SelectContent>
                        {RETAIL_CATEGORIES.map(cat => (
                          <SelectItem key={cat.value} value={cat.value}>
                            {cat.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  {/* Experience Filter */}
                  <div className="space-y-2">
                    <Label>Experience</Label>
                    <Select value={filters.experience} onValueChange={v => setFilters(prev => ({ ...prev, experience: v }))}>
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

                  {/* Education Filter */}
                  <div className="space-y-2">
                    <Label>Education</Label>
                    <Select value={filters.education} onValueChange={v => setFilters(prev => ({ ...prev, education: v }))}>
                      <SelectTrigger>
                        <SelectValue placeholder="Select education" />
                      </SelectTrigger>
                      <SelectContent>
                        {EDUCATION_LEVELS.map(edu => (
                          <SelectItem key={edu.value} value={edu.value}>
                            {edu.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  {/* Gender Filter */}
                  <div className="space-y-2">
                    <Label>Gender</Label>
                    <Select value={filters.gender} onValueChange={v => setFilters(prev => ({ ...prev, gender: v }))}>
                      <SelectTrigger>
                        <SelectValue placeholder="Any gender" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="male">Male</SelectItem>
                        <SelectItem value="female">Female</SelectItem>
                        <SelectItem value="other">Other</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  {/* Skills Filter */}
                  <div className="space-y-2">
                    <Label>Skills</Label>
                    <div className="flex flex-wrap gap-2 max-h-32 overflow-y-auto">
                      {SKILL_OPTIONS.slice(0, 8).map(skill => (
                        <Badge
                          key={skill}
                          variant={filters.skills.includes(skill) ? "default" : "outline"}
                          className="cursor-pointer text-xs"
                          onClick={() => {
                            setFilters(prev => ({
                              ...prev,
                              skills: prev.skills.includes(skill)
                                ? prev.skills.filter(s => s !== skill)
                                : [...prev.skills, skill]
                            }));
                          }}
                        >
                          {skill}
                        </Badge>
                      ))}
                    </div>
                  </div>

                  <div className="flex gap-2 pt-4">
                    <Button variant="outline" className="flex-1" onClick={clearFilters}>
                      <RefreshCw className="w-4 h-4 mr-2" />
                      Clear
                    </Button>
                    <Button variant="gradient" className="flex-1" onClick={applyFilters}>
                      <Search className="w-4 h-4 mr-2" />
                      Apply
                    </Button>
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Candidates List */}
            <div className="lg:col-span-3 space-y-4">
              {/* Results Header */}
              <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-card p-4 rounded-lg border border-border">
                <div>
                  <p className="text-sm text-muted-foreground">
                    Showing <strong>{filteredCandidates.length}</strong> available candidates
                  </p>
                </div>
                {selectedCandidates.length > 0 && (
                  <div className="flex items-center gap-4">
                    <p className="text-sm">
                      <strong>{selectedCandidates.length}</strong> selected (₹{totalCost})
                    </p>
                    <Button variant="hero" onClick={handleGetDetails}>
                      Reserve & Get Details
                    </Button>
                  </div>
                )}
              </div>

              {/* Loading State */}
              {loading ? (
                <div className="flex items-center justify-center py-12">
                  <Loader2 className="w-8 h-8 animate-spin text-primary" />
                </div>
              ) : filteredCandidates.length === 0 ? (
                <Card>
                  <CardContent className="py-12 text-center">
                    <Users className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
                    <h3 className="text-lg font-semibold mb-2">No candidates found</h3>
                    <p className="text-muted-foreground mb-4">
                      Try adjusting your filters or check back later for new candidates.
                    </p>
                    <Button variant="outline" onClick={clearFilters}>
                      Clear Filters
                    </Button>
                  </CardContent>
                </Card>
              ) : (
                <div className="grid gap-4">
                  {filteredCandidates.map((candidate) => (
                    <Card
                      key={candidate.id}
                      className={`transition-all cursor-pointer ${
                        selectedCandidates.includes(candidate.id)
                          ? "border-primary shadow-md"
                          : "hover:border-primary/50"
                      }`}
                      onClick={() => toggleCandidate(candidate.id)}
                    >
                      <CardContent className="pt-6">
                        <div className="flex items-start gap-4">
                          <div className="flex-shrink-0">
                            <Checkbox
                              checked={selectedCandidates.includes(candidate.id)}
                              onCheckedChange={() => toggleCandidate(candidate.id)}
                              className="mt-1"
                            />
                          </div>

                          <div className="flex-1 min-w-0">
                            <div className="flex flex-col md:flex-row md:items-start md:justify-between gap-4">
                              <div className="space-y-3">
                                <div className="flex items-center gap-2">
                                  <span className="font-semibold text-foreground">
                                    {candidate.fullName || `Candidate #${candidate.id.slice(0, 8)}`}
                                  </span>
                                  <Badge variant="outline" className="text-success border-success">
                                    <CheckCircle2 className="w-3 h-3 mr-1" />
                                    Available
                                  </Badge>
                                  {candidate.profileCompletion >= 80 && (
                                    <Badge variant="secondary">Verified</Badge>
                                  )}
                                </div>

                                {/* Retail Categories */}
                                {candidate.retailCategories.length > 0 && (
                                  <div className="flex flex-wrap gap-1">
                                    {candidate.retailCategories.slice(0, 3).map((cat, index) => (
                                      <Badge key={index} variant="default" className="text-xs">
                                        {cat}
                                      </Badge>
                                    ))}
                                    {candidate.retailCategories.length > 3 && (
                                      <Badge variant="outline" className="text-xs">
                                        +{candidate.retailCategories.length - 3} more
                                      </Badge>
                                    )}
                                  </div>
                                )}

                                {/* Skills */}
                                <div className="flex flex-wrap gap-1">
                                  {candidate.skills.slice(0, 4).map((skill, index) => (
                                    <Badge key={index} variant="secondary" className="text-xs">
                                      {skill}
                                    </Badge>
                                  ))}
                                  {candidate.skills.length > 4 && (
                                    <Badge variant="outline" className="text-xs">
                                      +{candidate.skills.length - 4} more
                                    </Badge>
                                  )}
                                </div>

                                <div className="flex flex-wrap items-center gap-4 text-sm text-muted-foreground">
                                  <div className="flex items-center gap-1">
                                    <Briefcase className="w-4 h-4" />
                                    {getExperienceLabel(candidate.experience)}
                                  </div>
                                  <div className="flex items-center gap-1">
                                    <GraduationCap className="w-4 h-4" />
                                    {candidate.educationLevel || "Not specified"}
                                  </div>
                                  <div className="flex items-center gap-1">
                                    <MapPin className="w-4 h-4" />
                                    {candidate.city}, {candidate.state}
                                  </div>
                                </div>
                              </div>

                              <div className="text-right">
                                <p className="text-sm text-muted-foreground">Access fee</p>
                                <p className="text-lg font-semibold text-primary">₹500</p>
                                <p className="text-xs text-muted-foreground">5 days reservation</p>
                              </div>
                            </div>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      </main>

      {/* Confirmation Dialog */}
      <Dialog open={showConfirmDialog} onOpenChange={setShowConfirmDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle className="font-display">Confirm Reservation</DialogTitle>
            <DialogDescription>
              Review your selection before proceeding
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-4">
            <div className="flex items-center justify-between p-4 bg-muted rounded-lg">
              <div className="flex items-center gap-2">
                <Users className="w-5 h-5 text-primary" />
                <span>Selected Candidates</span>
              </div>
              <span className="font-semibold">{selectedCandidates.length}</span>
            </div>

            <div className="flex items-center justify-between p-4 bg-muted rounded-lg">
              <div className="flex items-center gap-2">
                <IndianRupee className="w-5 h-5 text-primary" />
                <span>Cost per Candidate</span>
              </div>
              <span className="font-semibold">₹500</span>
            </div>

            <div className="flex items-center justify-between p-4 bg-muted rounded-lg">
              <div className="flex items-center gap-2">
                <IndianRupee className="w-5 h-5 text-muted-foreground" />
                <span>Your Wallet Balance</span>
              </div>
              <span className="font-semibold">₹{wallet?.balance || 0}</span>
            </div>

            <div className="flex items-center justify-between p-4 bg-primary/10 rounded-lg border border-primary/20">
              <span className="font-semibold">Total Amount</span>
              <span className="text-xl font-bold text-primary">₹{totalCost}</span>
            </div>

            <div className="flex items-start gap-2 p-4 bg-warning/10 rounded-lg border border-warning/20">
              <AlertCircle className="w-5 h-5 text-warning mt-0.5" />
              <div className="text-sm">
                <p className="font-medium text-foreground">Reservation Terms</p>
                <ul className="text-muted-foreground mt-1 space-y-1">
                  <li>• Candidates will be reserved for <strong>5 days</strong></li>
                  <li>• You'll get full access to their contact details and documents</li>
                  <li>• ₹200 refund per candidate if not hired within 5 days</li>
                  <li>• Please update hiring status within the reservation period</li>
                </ul>
              </div>
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setShowConfirmDialog(false)} disabled={reserving}>
              Cancel
            </Button>
            <Button variant="hero" onClick={confirmReservation} disabled={reserving}>
              {reserving ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Processing...
                </>
              ) : (
                `Pay ₹${totalCost} & Reserve`
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default FindCandidates;
