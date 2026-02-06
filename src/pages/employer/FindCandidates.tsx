import { useState } from "react";
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
  IndianRupee
} from "lucide-react";

const FindCandidates = () => {
  const [filters, setFilters] = useState({
    location: "",
    experience: "",
    education: "",
    gender: "",
    skills: [] as string[],
    status: "available",
  });

  const [selectedCandidates, setSelectedCandidates] = useState<number[]>([]);
  const [showConfirmDialog, setShowConfirmDialog] = useState(false);

  // Mock candidates data (would come from API)
  const candidates = [
    {
      id: 1,
      skills: ["Cash Handling", "POS Systems", "Customer Service"],
      experience: "2-5 years",
      education: "12th Pass",
      location: "Mumbai",
      certifications: ["Basic Retail Skills"],
      status: "available",
      gender: "Male",
    },
    {
      id: 2,
      skills: ["Sales", "Visual Merchandising", "Communication"],
      experience: "1-2 years",
      education: "Graduate",
      location: "Thane",
      certifications: ["Customer Service Excellence", "Sales Fundamentals"],
      status: "available",
      gender: "Female",
    },
    {
      id: 3,
      skills: ["Inventory Management", "Stock Management", "Computer Skills"],
      experience: "2-5 years",
      education: "Graduate",
      location: "Navi Mumbai",
      certifications: [],
      status: "available",
      gender: "Male",
    },
    {
      id: 4,
      skills: ["Security", "Crowd Management", "First Aid"],
      experience: "5+ years",
      education: "10th Pass",
      location: "Mumbai",
      certifications: ["Security Training"],
      status: "available",
      gender: "Male",
    },
    {
      id: 5,
      skills: ["Floor Management", "Team Leadership", "Sales"],
      experience: "5+ years",
      education: "Graduate",
      location: "Pune",
      certifications: ["Retail Management", "Team Leadership"],
      status: "available",
      gender: "Female",
    },
  ];

  const skillOptions = [
    "Cash Handling", "Customer Service", "Inventory Management", "POS Systems",
    "Sales", "Visual Merchandising", "Stock Management", "Team Leadership",
    "Security", "Delivery", "Warehouse", "Communication"
  ];

  const toggleCandidate = (id: number) => {
    setSelectedCandidates(prev =>
      prev.includes(id) ? prev.filter(c => c !== id) : [...prev, id]
    );
  };

  const totalCost = selectedCandidates.length * 500;

  const handleGetDetails = () => {
    setShowConfirmDialog(true);
  };

  const confirmReservation = () => {
    console.log("Reserving candidates:", selectedCandidates);
    setShowConfirmDialog(false);
    // Handle payment and reservation
  };

  return (
    <div className="min-h-screen bg-background">
      <Header />
      
      <main className="pt-24 pb-12">
        <div className="container mx-auto px-4">
          {/* Header */}
          <div className="mb-8">
            <h1 className="font-display text-2xl md:text-3xl font-bold text-foreground mb-2">
              Find Candidates
            </h1>
            <p className="text-muted-foreground">
              Search and filter through verified candidates
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
                <CardContent className="space-y-6">
                  <div className="space-y-2">
                    <Label>Location</Label>
                    <Select value={filters.location} onValueChange={v => setFilters(prev => ({ ...prev, location: v }))}>
                      <SelectTrigger>
                        <SelectValue placeholder="Select location" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="mumbai">Mumbai</SelectItem>
                        <SelectItem value="thane">Thane</SelectItem>
                        <SelectItem value="navi-mumbai">Navi Mumbai</SelectItem>
                        <SelectItem value="pune">Pune</SelectItem>
                        <SelectItem value="delhi">Delhi</SelectItem>
                        <SelectItem value="bangalore">Bangalore</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

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

                  <div className="space-y-2">
                    <Label>Education</Label>
                    <Select value={filters.education} onValueChange={v => setFilters(prev => ({ ...prev, education: v }))}>
                      <SelectTrigger>
                        <SelectValue placeholder="Select education" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="10th">10th Pass</SelectItem>
                        <SelectItem value="12th">12th Pass</SelectItem>
                        <SelectItem value="graduate">Graduate</SelectItem>
                        <SelectItem value="postgraduate">Post Graduate</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-2">
                    <Label>Gender</Label>
                    <Select value={filters.gender} onValueChange={v => setFilters(prev => ({ ...prev, gender: v }))}>
                      <SelectTrigger>
                        <SelectValue placeholder="Any gender" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="male">Male</SelectItem>
                        <SelectItem value="female">Female</SelectItem>
                        <SelectItem value="any">Any</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-2">
                    <Label>Skills</Label>
                    <div className="flex flex-wrap gap-2">
                      {skillOptions.slice(0, 6).map(skill => (
                        <Badge
                          key={skill}
                          variant={filters.skills.includes(skill) ? "default" : "outline"}
                          className="cursor-pointer"
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

                  <Button variant="gradient" className="w-full">
                    <Search className="w-4 h-4 mr-2" />
                    Apply Filters
                  </Button>
                </CardContent>
              </Card>
            </div>

            {/* Candidates List */}
            <div className="lg:col-span-3 space-y-4">
              {/* Results Header */}
              <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-card p-4 rounded-lg border border-border">
                <div>
                  <p className="text-sm text-muted-foreground">
                    Showing <strong>{candidates.length}</strong> candidates
                  </p>
                </div>
                {selectedCandidates.length > 0 && (
                  <div className="flex items-center gap-4">
                    <p className="text-sm">
                      <strong>{selectedCandidates.length}</strong> selected (₹{totalCost})
                    </p>
                    <Button variant="hero" onClick={handleGetDetails}>
                      Get All Details
                    </Button>
                  </div>
                )}
              </div>

              {/* Candidates Grid */}
              <div className="grid gap-4">
                {candidates.map((candidate) => (
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
                                  Candidate #{candidate.id}
                                </span>
                                <Badge variant="outline" className="text-success border-success">
                                  <CheckCircle2 className="w-3 h-3 mr-1" />
                                  Available
                                </Badge>
                              </div>

                              <div className="flex flex-wrap gap-2">
                                {candidate.skills.map((skill, index) => (
                                  <Badge key={index} variant="secondary">
                                    {skill}
                                  </Badge>
                                ))}
                              </div>

                              <div className="flex flex-wrap items-center gap-4 text-sm text-muted-foreground">
                                <div className="flex items-center gap-1">
                                  <Briefcase className="w-4 h-4" />
                                  {candidate.experience}
                                </div>
                                <div className="flex items-center gap-1">
                                  <GraduationCap className="w-4 h-4" />
                                  {candidate.education}
                                </div>
                                <div className="flex items-center gap-1">
                                  <MapPin className="w-4 h-4" />
                                  {candidate.location}
                                </div>
                              </div>

                              {candidate.certifications.length > 0 && (
                                <div className="flex items-center gap-2">
                                  <span className="text-xs text-muted-foreground">Certifications:</span>
                                  {candidate.certifications.map((cert, index) => (
                                    <Badge key={index} variant="outline" className="text-xs">
                                      {cert}
                                    </Badge>
                                  ))}
                                </div>
                              )}
                            </div>

                            <div className="text-right">
                              <p className="text-sm text-muted-foreground">Access fee</p>
                              <p className="text-lg font-semibold text-primary">₹500</p>
                            </div>
                          </div>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
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
                  <li>• Reserved candidates won't appear in other searches</li>
                  <li>• ₹200 refund per candidate if not hired within 5 days</li>
                  <li>• Please update hiring status within the reservation period</li>
                </ul>
              </div>
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setShowConfirmDialog(false)}>
              Cancel
            </Button>
            <Button variant="hero" onClick={confirmReservation}>
              Pay ₹{totalCost} & Reserve
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default FindCandidates;
