import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import Header from "@/components/layout/Header";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import {
  Search, Filter, MapPin, Briefcase, GraduationCap,
  CheckCircle2, AlertCircle, Users, IndianRupee, Loader2,
  ArrowLeft, RefreshCw
} from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { RETAIL_CATEGORIES, SKILL_OPTIONS, EDUCATION_LEVELS } from "@/lib/constants";
import { useIndianLocations } from "@/hooks/useIndianLocations";

interface Candidate {
  id: string;
  index: number;
  skills: string[];
  retailCategories: string[];
  experience: number;
  educationLevel: string;
  city: string;
  state: string;
  employmentStatus: string;
  gender: string;
  profileCompletion: number;
}

const FindCandidates = () => {
  const { user, employerProfile, wallet, refreshProfile } = useAuth();
  const { toast } = useToast();
  const { states, fetchCitiesByState } = useIndianLocations();

  const [candidates, setCandidates] = useState<Candidate[]>([]);
  const [loading, setLoading] = useState(true);
  const [reserving, setReserving] = useState(false);
  const [selectedCandidates, setSelectedCandidates] = useState<string[]>([]);
  const [showConfirmDialog, setShowConfirmDialog] = useState(false);

  const [filters, setFilters] = useState({
    state: "", city: "", experience: "", education: "",
    gender: "", retailCategory: "", skills: [] as string[],
  });

  const [availableCities, setAvailableCities] = useState<{ id: string; name: string }[]>([]);
  const [loadingCities, setLoadingCities] = useState(false);

  useEffect(() => { fetchCandidates(); }, []);

  useEffect(() => {
    if (filters.state) {
      loadCities(filters.state);
    }
  }, [filters.state]);

  const loadCities = async (stateName: string) => {
    setLoadingCities(true);
    const state = states.find(s => s.name === stateName);
    if (state) {
      const cities = await fetchCitiesByState(state.id);
      setAvailableCities(cities);
    }
    setLoadingCities(false);
  };

  const fetchCandidates = async () => {
    setLoading(true);
    try {
      // Only show available candidates (not reserved, not employed, not blacklisted)
      const { data, error } = await supabase
        .from("employee_profiles")
        .select("id, skills, retail_categories, years_of_experience, education_level, city, state, employment_status, gender, profile_completion_percent")
        .eq("is_blacklisted", false)
        .eq("employment_status", "available");

      if (error) throw error;

      const formattedCandidates: Candidate[] = (data || []).map((emp, idx) => ({
        id: emp.id,
        index: idx + 1,
        skills: (emp.skills as string[]) || [],
        retailCategories: (emp.retail_categories as string[]) || [],
        experience: emp.years_of_experience || 0,
        educationLevel: emp.education_level || "",
        city: emp.city || "",
        state: emp.state || "",
        employmentStatus: emp.employment_status || "available",
        gender: emp.gender || "",
        profileCompletion: emp.profile_completion_percent || 0,
      }));

      setCandidates(formattedCandidates);
    } catch (error) {
      console.error("Error fetching candidates:", error);
      toast({ title: "Error", description: "Failed to load candidates", variant: "destructive" });
    } finally {
      setLoading(false);
    }
  };

  const filteredCandidates = candidates.filter(candidate => {
    if (filters.state && candidate.state.toLowerCase() !== filters.state.toLowerCase()) return false;
    if (filters.city && candidate.city.toLowerCase() !== filters.city.toLowerCase()) return false;
    if (filters.education && candidate.educationLevel !== filters.education) return false;
    if (filters.gender && candidate.gender.toLowerCase() !== filters.gender.toLowerCase()) return false;
    if (filters.retailCategory && !candidate.retailCategories.includes(filters.retailCategory)) return false;
    if (filters.experience) {
      const exp = filters.experience;
      if (exp === "fresher" && candidate.experience > 0) return false;
      if (exp === "0-1" && (candidate.experience < 0 || candidate.experience > 1)) return false;
      if (exp === "1-2" && (candidate.experience < 1 || candidate.experience > 2)) return false;
      if (exp === "2-5" && (candidate.experience < 2 || candidate.experience > 5)) return false;
      if (exp === "5+" && candidate.experience < 5) return false;
    }
    if (filters.skills.length > 0) {
      const hasSkill = filters.skills.some(s => candidate.skills.includes(s));
      if (!hasSkill) return false;
    }
    return true;
  });

  const toggleCandidate = (id: string) => {
    setSelectedCandidates(prev => prev.includes(id) ? prev.filter(c => c !== id) : [...prev, id]);
  };

  const totalCost = selectedCandidates.length * 500;

  const handleGetDetails = () => {
    if (selectedCandidates.length === 0) {
      toast({ title: "No candidates selected", description: "Please select at least one candidate", variant: "destructive" });
      return;
    }
    setShowConfirmDialog(true);
  };

  const confirmReservation = async () => {
    if (!employerProfile?.id || !user) {
      toast({ title: "Error", description: "Employer profile not found", variant: "destructive" });
      return;
    }
    if ((wallet?.balance || 0) < totalCost) {
      toast({ title: "Insufficient Balance", description: `You need ₹${totalCost}. Your balance: ₹${wallet?.balance || 0}.`, variant: "destructive" });
      setShowConfirmDialog(false);
      return;
    }

    setReserving(true);
    try {
      const expiresAt = new Date(Date.now() + 5 * 24 * 60 * 60 * 1000).toISOString();

      const reservations = selectedCandidates.map(empId => ({
        employer_id: employerProfile.id,
        employee_id: empId,
        reservation_fee: 500,
        status: "pending" as const,
        expires_at: expiresAt,
      }));

      const { error: resError } = await supabase.from("candidate_reservations").insert(reservations);
      if (resError) throw resError;

      // Update each employee status to reserved
      for (const empId of selectedCandidates) {
        await supabase.from("employee_profiles").update({
          employment_status: "reserved",
          reserved_by: employerProfile.id,
          reservation_expires_at: expiresAt,
        }).eq("id", empId);

        // Notify employee about reservation
        const { data: empData } = await supabase.from("employee_profiles").select("user_id").eq("id", empId).single();
        if (empData?.user_id) {
          await supabase.from("notifications").insert({
            user_id: empData.user_id,
            title: "🔔 You've been reserved!",
            message: `${employerProfile.organizationName} has reserved your profile. They'll review your details and make a hiring decision within 5 days.`,
            type: "reserved",
            reference_type: "reservation",
          });
        }
      }

      // Deduct wallet balance
      const newBalance = (wallet?.balance || 0) - totalCost;
      await supabase.from("wallets").update({ balance: newBalance }).eq("user_id", user.id);

      const { data: walletData } = await supabase.from("wallets").select("id").eq("user_id", user.id).single();
      if (walletData) {
        await supabase.from("wallet_transactions").insert(
          selectedCandidates.map(empId => ({
            wallet_id: walletData.id,
            amount: 500,
            transaction_type: "debit" as const,
            description: "Reservation fee for candidate",
            reference_id: empId,
            reference_type: "reservation",
          }))
        );
      }

      await refreshProfile();
      toast({ title: "Candidates Reserved! 🎉", description: `₹${totalCost} deducted. ${selectedCandidates.length} candidate(s) reserved for 5 days.` });
      setSelectedCandidates([]);
      setShowConfirmDialog(false);
      fetchCandidates(); // Refresh - reserved candidates will no longer show
    } catch (error: any) {
      console.error("Reservation error:", error);
      toast({ title: "Reservation Failed", description: error.message, variant: "destructive" });
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

  const getCategoryLabel = (val: string) => RETAIL_CATEGORIES.find(c => c.value === val)?.label || val;

  const clearFilters = () => {
    setFilters({ state: "", city: "", experience: "", education: "", gender: "", retailCategory: "", skills: [] });
  };

  return (
    <div className="min-h-screen bg-muted/30">
      <Header />
      <main className="pt-24 pb-12">
        <div className="container mx-auto px-4">
          <div className="mb-8">
            <Button variant="ghost" asChild className="mb-4">
              <Link to="/employer/dashboard"><ArrowLeft className="w-4 h-4 mr-2" />Back to Dashboard</Link>
            </Button>
            <h1 className="font-display text-2xl md:text-3xl font-bold text-foreground mb-2">Find Candidates</h1>
            <p className="text-muted-foreground">Search verified retail professionals. Only available candidates shown.</p>
          </div>

          <div className="grid lg:grid-cols-4 gap-6">
            <div className="lg:col-span-1">
              <Card className="sticky top-24">
                <CardContent className="pt-6 space-y-4">
                  <h3 className="text-lg font-semibold flex items-center gap-2"><Filter className="w-5 h-5" />Filters</h3>

                  <div className="space-y-2">
                    <Label>State</Label>
                    <Select value={filters.state} onValueChange={v => setFilters(prev => ({ ...prev, state: v, city: "" }))}>
                      <SelectTrigger><SelectValue placeholder="Select state" /></SelectTrigger>
                      <SelectContent>
                        {states.map(s => <SelectItem key={s.id} value={s.name}>{s.name}</SelectItem>)}
                      </SelectContent>
                    </Select>
                  </div>

                  {filters.state && (
                    <div className="space-y-2">
                      <Label>City</Label>
                      <Select value={filters.city} onValueChange={v => setFilters(prev => ({ ...prev, city: v }))}>
                        <SelectTrigger><SelectValue placeholder={loadingCities ? "Loading..." : "Select city"} /></SelectTrigger>
                        <SelectContent>
                          {availableCities.map(c => <SelectItem key={c.id} value={c.name}>{c.name}</SelectItem>)}
                        </SelectContent>
                      </Select>
                    </div>
                  )}

                  <div className="space-y-2">
                    <Label>Retail Category</Label>
                    <Select value={filters.retailCategory} onValueChange={v => setFilters(prev => ({ ...prev, retailCategory: v }))}>
                      <SelectTrigger><SelectValue placeholder="Select category" /></SelectTrigger>
                      <SelectContent>
                        {RETAIL_CATEGORIES.map(cat => <SelectItem key={cat.value} value={cat.value}>{cat.label}</SelectItem>)}
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-2">
                    <Label>Experience</Label>
                    <Select value={filters.experience} onValueChange={v => setFilters(prev => ({ ...prev, experience: v }))}>
                      <SelectTrigger><SelectValue placeholder="Select experience" /></SelectTrigger>
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
                    <Label>Education</Label>
                    <Select value={filters.education} onValueChange={v => setFilters(prev => ({ ...prev, education: v }))}>
                      <SelectTrigger><SelectValue placeholder="Select education" /></SelectTrigger>
                      <SelectContent>
                        {EDUCATION_LEVELS.map(edu => <SelectItem key={edu.value} value={edu.value}>{edu.label}</SelectItem>)}
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-2">
                    <Label>Gender</Label>
                    <Select value={filters.gender} onValueChange={v => setFilters(prev => ({ ...prev, gender: v }))}>
                      <SelectTrigger><SelectValue placeholder="Any gender" /></SelectTrigger>
                      <SelectContent>
                        <SelectItem value="male">Male</SelectItem>
                        <SelectItem value="female">Female</SelectItem>
                        <SelectItem value="other">Other</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-2">
                    <Label>Skills</Label>
                    <div className="flex flex-wrap gap-2 max-h-32 overflow-y-auto">
                      {SKILL_OPTIONS.slice(0, 8).map(skill => (
                        <Badge
                          key={skill}
                          variant={filters.skills.includes(skill) ? "default" : "outline"}
                          className="cursor-pointer text-xs"
                          onClick={() => setFilters(prev => ({
                            ...prev,
                            skills: prev.skills.includes(skill) ? prev.skills.filter(s => s !== skill) : [...prev.skills, skill]
                          }))}
                        >
                          {skill}
                        </Badge>
                      ))}
                    </div>
                  </div>

                  <div className="flex gap-2 pt-4">
                    <Button variant="outline" className="flex-1" onClick={clearFilters}><RefreshCw className="w-4 h-4 mr-2" />Clear</Button>
                    <Button variant="gradient" className="flex-1" onClick={fetchCandidates}><Search className="w-4 h-4 mr-2" />Apply</Button>
                  </div>
                </CardContent>
              </Card>
            </div>

            <div className="lg:col-span-3 space-y-4">
              <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-card p-4 rounded-lg border border-border">
                <p className="text-sm text-muted-foreground">Showing <strong>{filteredCandidates.length}</strong> available candidates</p>
                {selectedCandidates.length > 0 && (
                  <div className="flex items-center gap-4">
                    <p className="text-sm"><strong>{selectedCandidates.length}</strong> selected (₹{totalCost})</p>
                    <Button variant="hero" onClick={handleGetDetails}>Reserve & Get Details</Button>
                  </div>
                )}
              </div>

              {loading ? (
                <div className="flex items-center justify-center py-12"><Loader2 className="w-8 h-8 animate-spin text-primary" /></div>
              ) : filteredCandidates.length === 0 ? (
                <Card>
                  <CardContent className="py-12 text-center">
                    <Users className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
                    <h3 className="text-lg font-semibold mb-2">No candidates found</h3>
                    <p className="text-muted-foreground mb-4">Try adjusting your filters</p>
                    <Button variant="outline" onClick={clearFilters}>Clear Filters</Button>
                  </CardContent>
                </Card>
              ) : (
                <div className="grid gap-4">
                  {filteredCandidates.map(candidate => (
                    <Card
                      key={candidate.id}
                      className={`transition-all cursor-pointer ${selectedCandidates.includes(candidate.id) ? "border-primary shadow-md" : "hover:border-primary/50"}`}
                      onClick={() => toggleCandidate(candidate.id)}
                    >
                      <CardContent className="pt-6">
                        <div className="flex items-start gap-4">
                          <Checkbox checked={selectedCandidates.includes(candidate.id)} onCheckedChange={() => toggleCandidate(candidate.id)} className="mt-1" />
                          <div className="flex-1 min-w-0">
                            <div className="flex flex-col md:flex-row md:items-start md:justify-between gap-4">
                              <div className="space-y-3">
                                <div className="flex items-center gap-2">
                                  <span className="font-semibold text-foreground">Candidate #{String(candidate.index).padStart(4, "0")}</span>
                                  <Badge variant="outline" className="text-success border-success"><CheckCircle2 className="w-3 h-3 mr-1" />Available</Badge>
                                  {candidate.profileCompletion >= 80 && <Badge variant="secondary">Verified Profile</Badge>}
                                </div>

                                {candidate.retailCategories.length > 0 && (
                                  <div className="flex flex-wrap gap-1">
                                    {candidate.retailCategories.slice(0, 3).map((cat, i) => (
                                      <Badge key={i} variant="default" className="text-xs">{getCategoryLabel(cat)}</Badge>
                                    ))}
                                    {candidate.retailCategories.length > 3 && <Badge variant="outline" className="text-xs">+{candidate.retailCategories.length - 3} more</Badge>}
                                  </div>
                                )}

                                <div className="flex flex-wrap gap-1">
                                  {candidate.skills.slice(0, 4).map((skill, i) => (
                                    <Badge key={i} variant="secondary" className="text-xs">{skill}</Badge>
                                  ))}
                                  {candidate.skills.length > 4 && <Badge variant="outline" className="text-xs">+{candidate.skills.length - 4}</Badge>}
                                </div>

                                <div className="flex flex-wrap items-center gap-4 text-sm text-muted-foreground">
                                  <div className="flex items-center gap-1"><Briefcase className="w-4 h-4" />{getExperienceLabel(candidate.experience)}</div>
                                  <div className="flex items-center gap-1"><GraduationCap className="w-4 h-4" />{candidate.educationLevel || "N/A"}</div>
                                  <div className="flex items-center gap-1"><MapPin className="w-4 h-4" />{candidate.city}, {candidate.state}</div>
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

      <Dialog open={showConfirmDialog} onOpenChange={setShowConfirmDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle className="font-display">Confirm Reservation</DialogTitle>
            <DialogDescription>Review your selection before proceeding</DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="flex items-center justify-between p-4 bg-muted rounded-lg">
              <div className="flex items-center gap-2"><Users className="w-5 h-5 text-primary" /><span>Selected Candidates</span></div>
              <span className="font-semibold">{selectedCandidates.length}</span>
            </div>
            <div className="flex items-center justify-between p-4 bg-muted rounded-lg">
              <div className="flex items-center gap-2"><IndianRupee className="w-5 h-5 text-primary" /><span>Cost per Candidate</span></div>
              <span className="font-semibold">₹500</span>
            </div>
            <div className="flex items-center justify-between p-4 bg-muted rounded-lg">
              <div className="flex items-center gap-2"><IndianRupee className="w-5 h-5 text-muted-foreground" /><span>Your Wallet Balance</span></div>
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
                  <li>• Candidates reserved for <strong>5 days</strong></li>
                  <li>• Full access to contact details, resume, and documents</li>
                  <li>• ₹200 refund per candidate if marked "Not Hired"</li>
                  <li>• ₹{totalCost} will be deducted from your wallet</li>
                </ul>
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowConfirmDialog(false)} disabled={reserving}>Cancel</Button>
            <Button variant="hero" onClick={confirmReservation} disabled={reserving}>
              {reserving ? (<><Loader2 className="w-4 h-4 mr-2 animate-spin" />Processing...</>) : (`Pay ₹${totalCost} & Reserve`)}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default FindCandidates;
