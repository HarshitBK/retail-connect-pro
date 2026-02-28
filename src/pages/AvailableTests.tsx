import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import Header from "@/components/layout/Header";
import Footer from "@/components/layout/Footer";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  ClipboardCheck,
  Clock,
  MapPin,
  Loader2,
  Building2,
  Star,
  Calendar
} from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { format } from "date-fns";

interface SkillTest {
  id: string;
  title: string;
  description: string;
  position: string;
  location: string;
  fee: number;
  durationMinutes: number;
  totalMarks: number;
  employerName: string;
  startsAt: string | null;
  endsAt: string | null;
  attemptCount: number;
  hasAttempted: boolean;
}

const AvailableTests = () => {
  const { user, employeeProfile } = useAuth();
  const [tests, setTests] = useState<SkillTest[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchTests();
  }, [employeeProfile?.id]);

  const fetchTests = async () => {
    try {
      const { data: testsData, error: testsError } = await supabase
        .from("skill_tests")
        .select(`
          id,
          title,
          description,
          position,
          location,
          test_fee,
          duration_minutes,
          questions,
          starts_at,
          ends_at,
          employer_profiles!inner(organization_name)
        `)
        .eq("status", "published")
        .lte("starts_at", new Date().toISOString())
        .gte("ends_at", new Date().toISOString())
        .order("created_at", { ascending: false });

      if (testsError) throw testsError;

      let userAttempts: string[] = [];
      if (employeeProfile?.id) {
        const { data: attemptsData } = await supabase
          .from("skill_test_attempts")
          .select("test_id")
          .eq("employee_id", employeeProfile.id);
        userAttempts = (attemptsData || []).map(a => a.test_id);
      }

      const testsWithInfo = (testsData || []).map((test: any) => {
        const totalMarks = Array.isArray(test.questions)
          ? test.questions.reduce(
            (sum: number, q: any) => sum + (Number(q.marks) || 1),
            0
          )
          : 0;

        return {
          id: test.id,
          title: test.title,
          description: test.description || "",
          position: test.position || "",
          location: test.location || "",
          fee: Number(test.test_fee) || 50,
          durationMinutes: test.duration_minutes || 60,
          totalMarks,
          employerName: test.employer_profiles?.organization_name || "Unknown",
          startsAt: test.starts_at,
          endsAt: test.ends_at,
          attemptCount: 0,
          hasAttempted: userAttempts.includes(test.id),
        };
      });

      setTests(testsWithInfo);
    } catch (error) {
      console.error("Error fetching tests:", error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#F8F9FC]">
      <Header />

      <main className="pt-32 pb-20">
        <div className="container mx-auto px-4 max-w-7xl">
          {/* Hero Section */}
          <div className="text-center mb-16 space-y-4">
            <Badge variant="secondary" className="px-4 py-1.5 rounded-full text-xs font-black uppercase tracking-[0.2em] bg-primary/5 text-primary border-primary/10">
              Career Acceleration
            </Badge>
            <h1 className="font-display text-5xl md:text-6xl font-black text-foreground tracking-tight">
              Verified <span className="text-primary italic">Skill</span> Assessments
            </h1>
            <p className="text-muted-foreground max-w-2xl mx-auto text-lg font-medium leading-relaxed italic opacity-80">
              Validate your expertise with industry-grade challenges. Top employers use these tests to discover talent like you.
            </p>
          </div>

          {loading ? (
            <div className="flex flex-col items-center justify-center py-24 gap-4">
              <div className="w-12 h-12 rounded-2xl bg-primary/10 flex items-center justify-center relative">
                <Loader2 className="w-6 h-6 animate-spin text-primary" />
                <div className="absolute inset-0 rounded-2xl border-2 border-primary/20 animate-ping" />
              </div>
              <p className="text-xs font-black text-primary uppercase tracking-widest">Scanning Databases...</p>
            </div>
          ) : tests.length === 0 ? (
            <div className="text-center py-24 bg-white rounded-[3rem] border-2 border-dashed border-muted shadow-inner group">
              <ClipboardCheck className="w-20 h-20 text-muted mx-auto mb-6 transition-transform group-hover:scale-110 duration-500" />
              <h3 className="text-2xl font-black mb-2 tracking-tight">QUIET ON THE FRONT</h3>
              <p className="text-muted-foreground font-medium italic">
                No active assessments found. Check back tomorrow for new opportunities.
              </p>
            </div>
          ) : (
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
              {tests.map(test => (
                <Card key={test.id} className="group relative border-none bg-white rounded-[2.5rem] shadow-[0_20px_50px_rgba(0,0,0,0.05)] hover:shadow-[0_40px_80px_rgba(0,0,0,0.1)] transition-all duration-500 hover:-translate-y-2 overflow-hidden flex flex-col h-full">
                  <div className="absolute top-0 right-0 p-8 z-10">
                    {test.hasAttempted ? (
                      <Badge className="bg-success/90 backdrop-blur shadow-lg shadow-success/20 px-4 py-1.5 rounded-full border-none font-black text-[10px] uppercase">Attempted</Badge>
                    ) : (
                      <div className="w-12 h-12 rounded-2xl bg-primary text-white flex flex-col items-center justify-center shadow-xl shadow-primary/30 group-hover:scale-110 transition-transform">
                        <span className="text-[10px] font-black leading-none mb-0.5">₹</span>
                        <span className="text-lg font-black leading-none">{test.fee}</span>
                      </div>
                    )}
                  </div>

                  <CardHeader className="p-8 pt-10 space-y-4">
                    <Badge variant="outline" className="w-fit border-primary/20 text-primary font-black text-[10px] uppercase tracking-widest py-1 bg-primary/5">
                      {test.position || "Skill Test"}
                    </Badge>
                    <CardTitle className="text-2xl font-black text-foreground tracking-tight leading-tight group-hover:text-primary transition-colors">
                      {test.title}
                    </CardTitle>
                    <CardDescription className="line-clamp-2 text-sm font-medium leading-relaxed italic opacity-70">
                      {test.description}
                    </CardDescription>
                  </CardHeader>

                  <CardContent className="px-8 pb-4 flex-1 space-y-6">
                    <div className="space-y-4">
                      <div className="flex items-center gap-4 group/item">
                        <div className="w-10 h-10 rounded-xl bg-muted/30 flex items-center justify-center text-muted-foreground group-hover/item:text-primary transition-colors">
                          <Building2 className="w-5 h-5" />
                        </div>
                        <div className="flex flex-col">
                          <span className="text-[10px] font-black uppercase tracking-tighter opacity-40">Employer</span>
                          <span className="text-sm font-bold truncate max-w-[180px]">{test.employerName}</span>
                        </div>
                      </div>

                      <div className="flex items-center gap-4 group/item">
                        <div className="w-10 h-10 rounded-xl bg-primary/5 flex items-center justify-center text-primary">
                          <MapPin className="w-5 h-5" />
                        </div>
                        <div className="flex flex-col">
                          <span className="text-[10px] font-black uppercase tracking-tighter opacity-40">Location(s)</span>
                          <span className="text-sm font-black text-primary truncate max-w-[180px] capitalize">{test.location || "India"}</span>
                        </div>
                      </div>

                      <div className="grid grid-cols-2 gap-4">
                        <div className="flex items-center gap-3">
                          <div className="p-2 rounded-lg bg-orange-500/10 text-orange-600">
                            <Clock className="w-4 h-4" />
                          </div>
                          <span className="text-xs font-bold">{test.durationMinutes}m</span>
                        </div>
                        <div className="flex items-center gap-3">
                          <div className="p-2 rounded-lg bg-blue-500/10 text-blue-600">
                            <Star className="w-4 h-4" />
                          </div>
                          <span className="text-xs font-bold">{test.totalMarks} Marks</span>
                        </div>
                      </div>
                    </div>

                    <div className="pt-6 border-t border-muted/50 space-y-3">
                      {test.startsAt && (
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-2 text-[10px] font-black text-muted-foreground uppercase opacity-60">
                            <Calendar className="w-3.5 h-3.5" />
                            Published
                          </div>
                          <span className="text-[11px] font-bold text-foreground/80">{format(new Date(test.startsAt), "MMM d, h:mm a")}</span>
                        </div>
                      )}
                      {test.endsAt && (
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-2 text-[10px] font-black text-destructive uppercase opacity-60">
                            <Calendar className="w-3.5 h-3.5" />
                            Deadline
                          </div>
                          <span className="text-[11px] font-black text-destructive/80">{format(new Date(test.endsAt), "MMM d, h:mm a")}</span>
                        </div>
                      )}
                    </div>
                  </CardContent>

                  <CardFooter className="p-8 pt-4">
                    {!user ? (
                      <Button asChild className="w-full h-14 rounded-2xl font-black text-md shadow-xl hover:scale-[1.02] transition-all">
                        <Link to="/login">LOGIN TO PARTICIPATE</Link>
                      </Button>
                    ) : test.hasAttempted ? (
                      <Button variant="outline" className="w-full h-14 rounded-2xl border-2 font-black text-muted-foreground opacity-50 bg-muted/20" disabled>
                        COMPLETED
                      </Button>
                    ) : (
                      <Button className="w-full h-14 rounded-2xl font-black text-md shadow-xl shadow-primary/20 hover:scale-[1.02] active:scale-[0.98] transition-all" asChild>
                        <Link to={`/tests/${test.id}/take`}>UNLOCK TEST NOW</Link>
                      </Button>
                    )}
                  </CardFooter>

                  {/* Decorative background element */}
                  <div className="absolute -bottom-6 -right-6 w-24 h-24 bg-primary/5 rounded-full blur-2xl group-hover:bg-primary/10 transition-colors" />
                </Card>
              ))}
            </div>
          )}
        </div>
      </main>

      <Footer />
    </div>
  );
};

export default AvailableTests;
