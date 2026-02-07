import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import Header from "@/components/layout/Header";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { 
  Table, 
  TableBody, 
  TableCell, 
  TableHead, 
  TableHeader, 
  TableRow 
} from "@/components/ui/table";
import { 
  ArrowLeft, 
  Plus, 
  Eye, 
  Edit, 
  Trash2, 
  Users,
  Clock,
  BarChart3,
  Loader2
} from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { format } from "date-fns";

interface SkillTest {
  id: string;
  title: string;
  position: string;
  location: string;
  status: "draft" | "published" | "closed";
  durationMinutes: number;
  passingScore: number;
  attemptCount: number;
  createdAt: string;
}

const ViewTests = () => {
  const { employerProfile } = useAuth();
  const [tests, setTests] = useState<SkillTest[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (employerProfile?.id) {
      fetchTests();
    }
  }, [employerProfile?.id]);

  const fetchTests = async () => {
    try {
      const { data, error } = await supabase
        .from("skill_tests")
        .select(`
          id,
          title,
          position,
          location,
          status,
          duration_minutes,
          passing_score,
          created_at
        `)
        .eq("employer_id", employerProfile?.id)
        .order("created_at", { ascending: false });

      if (error) throw error;

      // Get attempt counts
      const testsWithCounts = await Promise.all(
        (data || []).map(async (test) => {
          const { count } = await supabase
            .from("skill_test_attempts")
            .select("*", { count: "exact", head: true })
            .eq("test_id", test.id);

          return {
            id: test.id,
            title: test.title,
            position: test.position || "",
            location: test.location || "",
            status: test.status as "draft" | "published" | "closed",
            durationMinutes: test.duration_minutes,
            passingScore: test.passing_score,
            attemptCount: count || 0,
            createdAt: test.created_at,
          };
        })
      );

      setTests(testsWithCounts);
    } catch (error) {
      console.error("Error fetching tests:", error);
    } finally {
      setLoading(false);
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "published":
        return <Badge className="bg-green-500">Published</Badge>;
      case "draft":
        return <Badge variant="secondary">Draft</Badge>;
      case "closed":
        return <Badge variant="outline">Closed</Badge>;
      default:
        return <Badge variant="outline">{status}</Badge>;
    }
  };

  return (
    <div className="min-h-screen bg-muted/30">
      <Header />
      
      <main className="pt-24 pb-12">
        <div className="container mx-auto px-4">
          <Button 
            variant="ghost" 
            asChild 
            className="mb-6"
          >
            <Link to="/employer/dashboard">
              <ArrowLeft className="w-4 h-4 mr-2" />
              Back to Dashboard
            </Link>
          </Button>

          <div className="flex items-center justify-between mb-8">
            <div>
              <h1 className="font-display text-3xl font-bold">Skill Tests</h1>
              <p className="text-muted-foreground">
                Manage your skill tests and view results
              </p>
            </div>
            <Button asChild>
              <Link to="/employer/tests/create">
                <Plus className="w-4 h-4 mr-2" />
                Create New Test
              </Link>
            </Button>
          </div>

          {/* Stats */}
          <div className="grid md:grid-cols-4 gap-4 mb-8">
            <Card>
              <CardContent className="pt-6">
                <div className="flex items-center gap-4">
                  <div className="p-2 bg-primary/10 rounded-lg">
                    <BarChart3 className="w-5 h-5 text-primary" />
                  </div>
                  <div>
                    <p className="text-2xl font-bold">{tests.length}</p>
                    <p className="text-sm text-muted-foreground">Total Tests</p>
                  </div>
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="pt-6">
                <div className="flex items-center gap-4">
                  <div className="p-2 bg-green-500/10 rounded-lg">
                    <Eye className="w-5 h-5 text-green-500" />
                  </div>
                  <div>
                    <p className="text-2xl font-bold">
                      {tests.filter(t => t.status === "published").length}
                    </p>
                    <p className="text-sm text-muted-foreground">Published</p>
                  </div>
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="pt-6">
                <div className="flex items-center gap-4">
                  <div className="p-2 bg-accent/10 rounded-lg">
                    <Users className="w-5 h-5 text-accent" />
                  </div>
                  <div>
                    <p className="text-2xl font-bold">
                      {tests.reduce((sum, t) => sum + t.attemptCount, 0)}
                    </p>
                    <p className="text-sm text-muted-foreground">Total Attempts</p>
                  </div>
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="pt-6">
                <div className="flex items-center gap-4">
                  <div className="p-2 bg-yellow-500/10 rounded-lg">
                    <Clock className="w-5 h-5 text-yellow-500" />
                  </div>
                  <div>
                    <p className="text-2xl font-bold">
                      {tests.filter(t => t.status === "draft").length}
                    </p>
                    <p className="text-sm text-muted-foreground">Drafts</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Tests Table */}
          <Card>
            <CardHeader>
              <CardTitle>All Tests</CardTitle>
              <CardDescription>View and manage your skill tests</CardDescription>
            </CardHeader>
            <CardContent>
              {loading ? (
                <div className="flex items-center justify-center py-12">
                  <Loader2 className="w-8 h-8 animate-spin text-primary" />
                </div>
              ) : tests.length === 0 ? (
                <div className="text-center py-12">
                  <BarChart3 className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
                  <h3 className="text-lg font-semibold mb-2">No tests yet</h3>
                  <p className="text-muted-foreground mb-4">
                    Create your first skill test to start evaluating candidates.
                  </p>
                  <Button asChild>
                    <Link to="/employer/tests/create">
                      <Plus className="w-4 h-4 mr-2" />
                      Create Test
                    </Link>
                  </Button>
                </div>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Title</TableHead>
                      <TableHead>Position</TableHead>
                      <TableHead>Location</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Duration</TableHead>
                      <TableHead>Attempts</TableHead>
                      <TableHead>Created</TableHead>
                      <TableHead className="text-right">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {tests.map((test) => (
                      <TableRow key={test.id}>
                        <TableCell className="font-medium">{test.title}</TableCell>
                        <TableCell>{test.position}</TableCell>
                        <TableCell>{test.location || "-"}</TableCell>
                        <TableCell>{getStatusBadge(test.status)}</TableCell>
                        <TableCell>{test.durationMinutes} min</TableCell>
                        <TableCell>{test.attemptCount}</TableCell>
                        <TableCell>
                          {format(new Date(test.createdAt), "MMM d, yyyy")}
                        </TableCell>
                        <TableCell className="text-right">
                          <div className="flex items-center justify-end gap-2">
                            <Button variant="ghost" size="sm" asChild>
                              <Link to={`/employer/tests/${test.id}/results`}>
                                <Eye className="w-4 h-4" />
                              </Link>
                            </Button>
                            <Button variant="ghost" size="sm" asChild>
                              <Link to={`/employer/tests/${test.id}/edit`}>
                                <Edit className="w-4 h-4" />
                              </Link>
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              )}
            </CardContent>
          </Card>
        </div>
      </main>
    </div>
  );
};

export default ViewTests;
