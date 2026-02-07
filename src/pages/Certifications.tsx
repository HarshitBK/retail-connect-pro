import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import Header from "@/components/layout/Header";
import Footer from "@/components/layout/Footer";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { 
  GraduationCap, 
  Clock, 
  Award, 
  IndianRupee,
  Loader2,
  Play,
  CheckCircle
} from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";

interface Course {
  id: string;
  title: string;
  description: string;
  category: string;
  fee: number;
  durationHours: number;
  isEnrolled: boolean;
  progress: number;
  isCompleted: boolean;
}

const Certifications = () => {
  const { user, employeeProfile } = useAuth();
  const [courses, setCourses] = useState<Course[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchCourses();
  }, [employeeProfile?.id]);

  const fetchCourses = async () => {
    try {
      // Fetch all active courses
      const { data: coursesData, error: coursesError } = await supabase
        .from("certification_courses")
        .select("*")
        .eq("is_active", true)
        .order("created_at", { ascending: false });

      if (coursesError) throw coursesError;

      // Fetch user enrollments if logged in
      let enrollments: any[] = [];
      if (employeeProfile?.id) {
        const { data: enrollmentData } = await supabase
          .from("course_enrollments")
          .select("*")
          .eq("employee_id", employeeProfile.id);
        enrollments = enrollmentData || [];
      }

      const coursesWithStatus = (coursesData || []).map(course => {
        const enrollment = enrollments.find(e => e.course_id === course.id);
        return {
          id: course.id,
          title: course.title,
          description: course.description || "",
          category: course.category || "General",
          fee: Number(course.fee) || 50,
          durationHours: course.duration_hours || 2,
          isEnrolled: !!enrollment,
          progress: enrollment?.progress || 0,
          isCompleted: enrollment?.status === "completed",
        };
      });

      setCourses(coursesWithStatus);
    } catch (error) {
      console.error("Error fetching courses:", error);
    } finally {
      setLoading(false);
    }
  };

  const categories = [...new Set(courses.map(c => c.category))];

  return (
    <div className="min-h-screen bg-background">
      <Header />
      
      <main className="pt-24 pb-12">
        <div className="container mx-auto px-4">
          {/* Hero Section */}
          <div className="text-center mb-12">
            <h1 className="font-display text-4xl font-bold mb-4">
              Certification Courses
            </h1>
            <p className="text-muted-foreground max-w-2xl mx-auto">
              Boost your profile with industry-recognized certifications. Each course costs just ₹50 
              and adds value to your resume.
            </p>
          </div>

          {/* Stats */}
          <div className="grid md:grid-cols-3 gap-6 mb-12 max-w-3xl mx-auto">
            <Card>
              <CardContent className="pt-6 text-center">
                <GraduationCap className="w-10 h-10 text-primary mx-auto mb-2" />
                <p className="text-2xl font-bold">{courses.length}</p>
                <p className="text-sm text-muted-foreground">Courses Available</p>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="pt-6 text-center">
                <IndianRupee className="w-10 h-10 text-accent mx-auto mb-2" />
                <p className="text-2xl font-bold">₹50</p>
                <p className="text-sm text-muted-foreground">Per Course</p>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="pt-6 text-center">
                <Award className="w-10 h-10 text-yellow-500 mx-auto mb-2" />
                <p className="text-2xl font-bold">+Points</p>
                <p className="text-sm text-muted-foreground">On Completion</p>
              </CardContent>
            </Card>
          </div>

          {loading ? (
            <div className="flex items-center justify-center py-12">
              <Loader2 className="w-8 h-8 animate-spin text-primary" />
            </div>
          ) : courses.length === 0 ? (
            <div className="text-center py-12">
              <GraduationCap className="w-16 h-16 text-muted-foreground mx-auto mb-4" />
              <h3 className="text-xl font-semibold mb-2">No courses available yet</h3>
              <p className="text-muted-foreground">
                Check back soon for new certification courses.
              </p>
            </div>
          ) : (
            <>
              {categories.map(category => (
                <div key={category} className="mb-12">
                  <h2 className="font-display text-2xl font-bold mb-6">{category}</h2>
                  <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {courses
                      .filter(c => c.category === category)
                      .map(course => (
                        <Card key={course.id} className="relative overflow-hidden">
                          {course.isCompleted && (
                            <div className="absolute top-4 right-4">
                              <Badge className="bg-green-500">
                                <CheckCircle className="w-3 h-3 mr-1" />
                                Completed
                              </Badge>
                            </div>
                          )}
                          <CardHeader>
                            <CardTitle className="text-lg">{course.title}</CardTitle>
                            <CardDescription className="line-clamp-2">
                              {course.description}
                            </CardDescription>
                          </CardHeader>
                          <CardContent>
                            <div className="flex items-center gap-4 text-sm text-muted-foreground mb-4">
                              <div className="flex items-center gap-1">
                                <Clock className="w-4 h-4" />
                                {course.durationHours}h
                              </div>
                              <div className="flex items-center gap-1">
                                <IndianRupee className="w-4 h-4" />
                                {course.fee}
                              </div>
                            </div>

                            {course.isEnrolled && !course.isCompleted && (
                              <div className="mb-4">
                                <div className="flex justify-between text-sm mb-1">
                                  <span>Progress</span>
                                  <span>{course.progress}%</span>
                                </div>
                                <Progress value={course.progress} />
                              </div>
                            )}

                            {!user ? (
                              <Button asChild className="w-full">
                                <Link to="/login">Login to Enroll</Link>
                              </Button>
                            ) : course.isCompleted ? (
                              <Button variant="outline" className="w-full" disabled>
                                <Award className="w-4 h-4 mr-2" />
                                View Certificate
                              </Button>
                            ) : course.isEnrolled ? (
                              <Button className="w-full">
                                <Play className="w-4 h-4 mr-2" />
                                Continue Learning
                              </Button>
                            ) : (
                              <Button className="w-full">
                                Enroll for ₹{course.fee}
                              </Button>
                            )}
                          </CardContent>
                        </Card>
                      ))}
                  </div>
                </div>
              ))}
            </>
          )}
        </div>
      </main>

      <Footer />
    </div>
  );
};

export default Certifications;
