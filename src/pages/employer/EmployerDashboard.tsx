import { useState } from "react";
import { Link } from "react-router-dom";
import Header from "@/components/layout/Header";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Building2,
  Users,
  Search,
  FileText,
  Wallet,
  Edit,
  Plus,
  UserCheck,
  UserX,
  Clock,
  Star,
  MapPin,
  Phone,
  Mail,
  Calendar,
  ArrowRight,
  Eye
} from "lucide-react";

const EmployerDashboard = () => {
  // Mock company data
  const company = {
    name: "ABC Retail Pvt. Ltd.",
    logo: null,
    industry: "Supermarket",
    location: "Mumbai, Maharashtra",
    phone: "+91 98765 43210",
    email: "hr@abcretail.com",
    subscriptionExpiry: "Dec 31, 2024",
    wallet: 15000,
  };

  const stats = {
    reserved: 3,
    hired: 12,
    testsCreated: 2,
    activeTests: 1,
  };

  const reservedCandidates = [
    { 
      id: 1, 
      skills: ["Cashier", "POS Systems"], 
      experience: "2 years",
      location: "Mumbai",
      expiresIn: "3 days",
      status: "pending"
    },
    { 
      id: 2, 
      skills: ["Sales", "Customer Service"], 
      experience: "3 years",
      location: "Thane",
      expiresIn: "4 days",
      status: "pending"
    },
    { 
      id: 3, 
      skills: ["Inventory", "Stock Management"], 
      experience: "1 year",
      location: "Navi Mumbai",
      expiresIn: "2 days",
      status: "pending"
    },
  ];

  const hiredCandidates = [
    { 
      id: 1, 
      name: "Rahul Sharma",
      role: "Cashier",
      hiredOn: "Jan 15, 2024",
      rating: 4.5,
      status: "active"
    },
    { 
      id: 2, 
      name: "Priya Patel",
      role: "Sales Associate",
      hiredOn: "Dec 20, 2023",
      rating: 5,
      status: "active"
    },
  ];

  return (
    <div className="min-h-screen bg-background">
      <Header />
      
      <main className="pt-24 pb-12">
        <div className="container mx-auto px-4">
          {/* Welcome Section */}
          <div className="flex flex-col md:flex-row md:items-center md:justify-between mb-8 gap-4">
            <div>
              <h1 className="font-display text-2xl md:text-3xl font-bold text-foreground mb-2">
                Welcome back! 👋
              </h1>
              <p className="text-muted-foreground">
                Manage your hiring and find the perfect candidates
              </p>
            </div>
            <Button variant="hero" size="lg" asChild>
              <Link to="/employer/find-candidates">
                <Search className="w-5 h-5 mr-2" />
                Find Candidates
              </Link>
            </Button>
          </div>

          <div className="grid lg:grid-cols-3 gap-6">
            {/* Left Column - Company Profile */}
            <div className="lg:col-span-1 space-y-6">
              {/* Company Card */}
              <Card>
                <CardContent className="pt-6">
                  <div className="text-center">
                    <div className="w-20 h-20 rounded-xl bg-accent/10 flex items-center justify-center mx-auto mb-4">
                      <Building2 className="w-10 h-10 text-accent" />
                    </div>
                    <h2 className="font-display font-semibold text-xl text-foreground mb-1">
                      {company.name}
                    </h2>
                    <Badge variant="outline" className="mb-4">{company.industry}</Badge>
                    
                    <div className="space-y-2 text-sm text-left mb-4">
                      <div className="flex items-center gap-2 text-muted-foreground">
                        <MapPin className="w-4 h-4" />
                        {company.location}
                      </div>
                      <div className="flex items-center gap-2 text-muted-foreground">
                        <Phone className="w-4 h-4" />
                        {company.phone}
                      </div>
                      <div className="flex items-center gap-2 text-muted-foreground">
                        <Mail className="w-4 h-4" />
                        {company.email}
                      </div>
                      <div className="flex items-center gap-2 text-muted-foreground">
                        <Calendar className="w-4 h-4" />
                        Subscription: {company.subscriptionExpiry}
                      </div>
                    </div>

                    <Button variant="outline" className="w-full" asChild>
                      <Link to="/employer/profile/edit">
                        <Edit className="w-4 h-4 mr-2" />
                        Edit Profile
                      </Link>
                    </Button>
                  </div>
                </CardContent>
              </Card>

              {/* Wallet Card */}
              <Card className="bg-accent/5 border-accent/20">
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm font-medium flex items-center gap-2">
                    <Wallet className="w-4 h-4 text-accent" />
                    Wallet Balance
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-3xl font-bold text-accent mb-4">
                    ₹{company.wallet.toLocaleString()}
                  </div>
                  <Button variant="accent" className="w-full">
                    <Plus className="w-4 h-4 mr-2" />
                    Add Money
                  </Button>
                </CardContent>
              </Card>

              {/* Quick Actions */}
              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm font-medium">Quick Actions</CardTitle>
                </CardHeader>
                <CardContent className="space-y-2">
                  <Button variant="outline" className="w-full justify-start" asChild>
                    <Link to="/employer/create-test">
                      <FileText className="w-4 h-4 mr-2" />
                      Create Skill Test
                    </Link>
                  </Button>
                  <Button variant="outline" className="w-full justify-start" asChild>
                    <Link to="/employer/tests">
                      <Eye className="w-4 h-4 mr-2" />
                      View Test Results
                    </Link>
                  </Button>
                </CardContent>
              </Card>
            </div>

            {/* Right Column - Main Content */}
            <div className="lg:col-span-2 space-y-6">
              {/* Stats Grid */}
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <Card className="bg-warning/5 border-warning/20">
                  <CardContent className="pt-4 pb-4">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-lg bg-warning/10 flex items-center justify-center">
                        <Clock className="w-5 h-5 text-warning" />
                      </div>
                      <div>
                        <div className="text-2xl font-bold text-foreground">{stats.reserved}</div>
                        <p className="text-xs text-muted-foreground">Reserved</p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
                <Card className="bg-success/5 border-success/20">
                  <CardContent className="pt-4 pb-4">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-lg bg-success/10 flex items-center justify-center">
                        <UserCheck className="w-5 h-5 text-success" />
                      </div>
                      <div>
                        <div className="text-2xl font-bold text-foreground">{stats.hired}</div>
                        <p className="text-xs text-muted-foreground">Hired</p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
                <Card>
                  <CardContent className="pt-4 pb-4">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center">
                        <FileText className="w-5 h-5 text-primary" />
                      </div>
                      <div>
                        <div className="text-2xl font-bold text-foreground">{stats.testsCreated}</div>
                        <p className="text-xs text-muted-foreground">Tests</p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
                <Card>
                  <CardContent className="pt-4 pb-4">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-lg bg-accent/10 flex items-center justify-center">
                        <Users className="w-5 h-5 text-accent" />
                      </div>
                      <div>
                        <div className="text-2xl font-bold text-foreground">85</div>
                        <p className="text-xs text-muted-foreground">Candidates</p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </div>

              {/* Tabs */}
              <Tabs defaultValue="reserved" className="w-full">
                <TabsList className="grid w-full grid-cols-2">
                  <TabsTrigger value="reserved">
                    <Clock className="w-4 h-4 mr-2" />
                    Reserved ({stats.reserved})
                  </TabsTrigger>
                  <TabsTrigger value="hired">
                    <UserCheck className="w-4 h-4 mr-2" />
                    Hired ({stats.hired})
                  </TabsTrigger>
                </TabsList>

                <TabsContent value="reserved" className="mt-4">
                  <Card>
                    <CardHeader>
                      <CardTitle className="text-lg">Reserved Candidates</CardTitle>
                      <CardDescription>
                        Update hiring status within the reservation period
                      </CardDescription>
                    </CardHeader>
                    <CardContent>
                      {reservedCandidates.length > 0 ? (
                        <div className="space-y-4">
                          {reservedCandidates.map((candidate) => (
                            <div key={candidate.id} className="flex flex-col md:flex-row md:items-center justify-between p-4 border border-border rounded-lg gap-4">
                              <div className="flex-1">
                                <div className="flex items-center gap-2 mb-2">
                                  <span className="font-medium text-foreground">Candidate #{candidate.id}</span>
                                  <Badge variant="outline" className="text-warning border-warning">
                                    <Clock className="w-3 h-3 mr-1" />
                                    {candidate.expiresIn}
                                  </Badge>
                                </div>
                                <div className="flex flex-wrap gap-1 mb-2">
                                  {candidate.skills.map((skill, index) => (
                                    <Badge key={index} variant="secondary" className="text-xs">
                                      {skill}
                                    </Badge>
                                  ))}
                                </div>
                                <p className="text-sm text-muted-foreground">
                                  {candidate.experience} exp • {candidate.location}
                                </p>
                              </div>
                              <div className="flex gap-2">
                                <Button variant="success" size="sm">
                                  <UserCheck className="w-4 h-4 mr-1" />
                                  Hired
                                </Button>
                                <Button variant="outline" size="sm">
                                  <UserX className="w-4 h-4 mr-1" />
                                  Not Hired
                                </Button>
                              </div>
                            </div>
                          ))}
                        </div>
                      ) : (
                        <div className="text-center py-8">
                          <Users className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
                          <p className="text-muted-foreground mb-4">No reserved candidates</p>
                          <Button variant="gradient" asChild>
                            <Link to="/employer/find-candidates">
                              Find Candidates
                              <ArrowRight className="w-4 h-4 ml-2" />
                            </Link>
                          </Button>
                        </div>
                      )}
                    </CardContent>
                  </Card>
                </TabsContent>

                <TabsContent value="hired" className="mt-4">
                  <Card>
                    <CardHeader>
                      <CardTitle className="text-lg">Hired Candidates</CardTitle>
                      <CardDescription>
                        Manage your team and provide ratings
                      </CardDescription>
                    </CardHeader>
                    <CardContent>
                      {hiredCandidates.length > 0 ? (
                        <div className="space-y-4">
                          {hiredCandidates.map((candidate) => (
                            <div key={candidate.id} className="flex flex-col md:flex-row md:items-center justify-between p-4 border border-border rounded-lg gap-4">
                              <div className="flex items-center gap-4">
                                <div className="w-12 h-12 rounded-full bg-success/10 flex items-center justify-center">
                                  <UserCheck className="w-6 h-6 text-success" />
                                </div>
                                <div>
                                  <p className="font-medium text-foreground">{candidate.name}</p>
                                  <p className="text-sm text-muted-foreground">
                                    {candidate.role} • Hired on {candidate.hiredOn}
                                  </p>
                                  <div className="flex items-center gap-1 mt-1">
                                    {[...Array(5)].map((_, i) => (
                                      <Star
                                        key={i}
                                        className={`w-3 h-3 ${
                                          i < Math.floor(candidate.rating)
                                            ? "text-warning fill-warning"
                                            : "text-muted-foreground"
                                        }`}
                                      />
                                    ))}
                                    <span className="text-xs text-muted-foreground ml-1">
                                      ({candidate.rating})
                                    </span>
                                  </div>
                                </div>
                              </div>
                              <div className="flex gap-2">
                                <Button variant="outline" size="sm">
                                  Rate
                                </Button>
                                <Button variant="destructive" size="sm">
                                  Blacklist
                                </Button>
                              </div>
                            </div>
                          ))}
                        </div>
                      ) : (
                        <div className="text-center py-8">
                          <Users className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
                          <p className="text-muted-foreground">No hired candidates yet</p>
                        </div>
                      )}
                    </CardContent>
                  </Card>
                </TabsContent>
              </Tabs>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
};

export default EmployerDashboard;
