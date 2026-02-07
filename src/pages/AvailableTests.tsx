import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import Header from "@/components/layout/Header";
import Footer from "@/components/layout/Footer";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { 
  ClipboardCheck, 
  Clock, 
  MapPin, 
  IndianRupee,
  Loader2,
  Building2,
  Users
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
          starts_at,
          ends_at,
          employer_profiles!inner(organization_name)
        `)
        .eq("status", "published")
        .order("created_at", { ascending: false });

      if (testsError) throw testsError;

      // Check user's attempts if logged in
      let userAttempts: string[] = [];
      if (employeeProfile?.id) {
        const { data: attemptsData } = await supabase
          .from("skill_test_attempts")
          .select("test_id")
          .eq("employee_id", employeeProfile.id);
        userAttempts = (attemptsData || []).map(a => a.test_id);
      }

      // Get attempt counts for each test
      const testsWithInfo = await Promise.all(
        (testsData || []).map(async (test: any) => {
          const { count } = await supabase
            .from("skill_test_attempts")
            .select("*", { count: "exact", head: true })
            .eq("test_id", test.id);

          return {
            id: test.id,
            title: test.title,
            description: test.description || "",
            position: test.position || "",
            location: test.location || "",
            fee: Number(test.test_fee) || 50,
            durationMinutes: test.duration_minutes || 60,
            employerName: test.employer_profiles?.organization_name || "Unknown",
            startsAt: test.starts_at,
            endsAt: test.ends_at,
            attemptCount: count || 0,
            hasAttempted: userAttempts.includes(test.id),
          };
        })
      );

      setTests(testsWithInfo);
    } catch (error) {
      console.error("Error fetching tests:", error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-background">
      <Header />
      
      <main className="pt-24 pb-12">
        <div className="container mx-auto px-4">
          {/* Hero Section */}
          <div className="text-center mb-12">
            <h1 className="font-display text-4xl font-bold mb-4">
              Skill Tests
            </h1>
            <p className="text-muted-foreground max-w-2xl mx-auto">
              Take skill tests created by top employers. Showcase your abilities and get noticed 
              for relevant job opportunities. Entry fee: ₹50 per test.
            </p>
          </div>

          {loading ? (
            <div className="flex items-center justify-center py-12">
              <Loader2 className="w-8 h-8 animate-spin text-primary" />
            </div>
          ) : tests.length === 0 ? (
            <div className="text-center py-12">
              <ClipboardCheck className="w-16 h-16 text-muted-foreground mx-auto mb-4" />
              <h3 className="text-xl font-semibold mb-2">No tests available</h3>
              <p className="text-muted-foreground">
                Check back soon for new skill tests from employers.
              </p>
            </div>
          ) : (
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
              {tests.map(test => (
                <Card key={test.id} className="flex flex-col">
                  <CardHeader>
                    <div className="flex items-start justify-between">
                      <Badge variant="outline" className="mb-2">
                        {test.position}
                      </Badge>
                      {test.hasAttempted && (
                        <Badge className="bg-green-500">Attempted</Badge>
                      )}
                    </div>
                    <CardTitle className="text-lg">{test.title}</CardTitle>
                    <CardDescription className="line-clamp-2">
                      {test.description}
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="flex-1 flex flex-col">
                    <div className="space-y-2 mb-4 flex-1">
                      <div className="flex items-center gap-2 text-sm text-muted-foreground">
                        <Building2 className="w-4 h-4" />
                        <span>{test.employerName}</span>
                      </div>
                      {test.location && (
                        <div className="flex items-center gap-2 text-sm text-muted-foreground">
                          <MapPin className="w-4 h-4" />
                          <span>{test.location}</span>
                        </div>
                      )}
                      <div className="flex items-center gap-2 text-sm text-muted-foreground">
                        <Clock className="w-4 h-4" />
                        <span>{test.durationMinutes} minutes</span>
                      </div>
                      <div className="flex items-center gap-2 text-sm text-muted-foreground">
                        <Users className="w-4 h-4" />
                        <span>{test.attemptCount} candidates attempted</span>
                      </div>
                    </div>

                    <div className="flex items-center justify-between mb-4">
                      <span className="text-lg font-bold flex items-center">
                        <IndianRupee className="w-4 h-4" />
                        {test.fee}
                      </span>
                      <span className="text-sm text-muted-foreground">Entry Fee</span>
                    </div>

                    {!user ? (
                      <Button asChild className="w-full">
                        <Link to="/login">Login to Take Test</Link>
                      </Button>
                    ) : test.hasAttempted ? (
                      <Button variant="outline" className="w-full" disabled>
                        Already Attempted
                      </Button>
                    ) : (
                      <Button className="w-full">
                        Take Test (₹{test.fee})
                      </Button>
                    )}
                  </CardContent>
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
