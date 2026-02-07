import Header from "@/components/layout/Header";
import Footer from "@/components/layout/Footer";

const PrivacyPolicy = () => {
  return (
    <div className="min-h-screen bg-background">
      <Header />
      
      <main className="pt-24 pb-12">
        <div className="container mx-auto px-4 py-12 max-w-4xl">
          <h1 className="font-display text-4xl font-bold mb-8">Privacy Policy</h1>
          <p className="text-muted-foreground mb-8">Last updated: February 2025</p>

          <div className="prose prose-slate dark:prose-invert max-w-none space-y-8">
            <section>
              <h2 className="text-2xl font-semibold mb-4">1. Information We Collect</h2>
              
              <h3 className="text-xl font-medium mb-2">1.1 Personal Information</h3>
              <ul className="list-disc pl-6 text-muted-foreground space-y-2">
                <li>Name, email address, phone number</li>
                <li>Date of birth, gender, address</li>
                <li>Educational qualifications and work experience</li>
                <li>Government IDs (Aadhar, PAN) for verification</li>
                <li>Bank details for payment processing</li>
              </ul>

              <h3 className="text-xl font-medium mb-2 mt-4">1.2 Organization Information (Employers)</h3>
              <ul className="list-disc pl-6 text-muted-foreground space-y-2">
                <li>Company name, address, and contact details</li>
                <li>GST number, PAN, CIN for verification</li>
                <li>Authorized contact person details</li>
              </ul>

              <h3 className="text-xl font-medium mb-2 mt-4">1.3 Usage Data</h3>
              <ul className="list-disc pl-6 text-muted-foreground space-y-2">
                <li>Login history and activity logs</li>
                <li>Search queries and filter preferences</li>
                <li>Test attempts and scores</li>
                <li>Transaction history</li>
              </ul>
            </section>

            <section>
              <h2 className="text-2xl font-semibold mb-4">2. How We Use Your Information</h2>
              <ul className="list-disc pl-6 text-muted-foreground space-y-2">
                <li>To create and manage your account</li>
                <li>To facilitate job matching between employees and employers</li>
                <li>To process payments and maintain wallet balances</li>
                <li>To send notifications about job opportunities and platform updates</li>
                <li>To improve our services and user experience</li>
                <li>To prevent fraud and ensure platform security</li>
              </ul>
            </section>

            <section>
              <h2 className="text-2xl font-semibold mb-4">3. Information Sharing</h2>
              <p className="text-muted-foreground mb-4">
                We share information in the following ways:
              </p>
              <ul className="list-disc pl-6 text-muted-foreground space-y-2">
                <li><strong>With Employers:</strong> When you're reserved, employers can view your full profile including contact details.</li>
                <li><strong>Profile Visibility:</strong> Your qualifications are visible to employers, but personal details are hidden until reservation.</li>
                <li><strong>Legal Requirements:</strong> We may disclose information when required by law.</li>
                <li><strong>Service Providers:</strong> We use third-party services for payments and SMS verification.</li>
              </ul>
            </section>

            <section>
              <h2 className="text-2xl font-semibold mb-4">4. Data Security</h2>
              <p className="text-muted-foreground">
                We implement industry-standard security measures to protect your data:
              </p>
              <ul className="list-disc pl-6 text-muted-foreground space-y-2 mt-4">
                <li>Encrypted data transmission (SSL/TLS)</li>
                <li>Secure password storage with hashing</li>
                <li>Regular security audits</li>
                <li>Access controls and monitoring</li>
              </ul>
            </section>

            <section>
              <h2 className="text-2xl font-semibold mb-4">5. Your Rights</h2>
              <p className="text-muted-foreground">You have the right to:</p>
              <ul className="list-disc pl-6 text-muted-foreground space-y-2 mt-4">
                <li>Access and download your personal data</li>
                <li>Correct inaccurate information</li>
                <li>Delete your account and associated data</li>
                <li>Opt-out of marketing communications</li>
                <li>Request data portability</li>
              </ul>
            </section>

            <section>
              <h2 className="text-2xl font-semibold mb-4">6. Data Retention</h2>
              <p className="text-muted-foreground">
                We retain your data for as long as your account is active. After account deletion, 
                we may retain certain information for legal and audit purposes for up to 7 years.
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-semibold mb-4">7. Cookies</h2>
              <p className="text-muted-foreground">
                We use cookies and similar technologies to enhance your experience, analyze usage, 
                and personalize content. You can manage cookie preferences through your browser settings.
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-semibold mb-4">8. Contact Us</h2>
              <p className="text-muted-foreground">
                For privacy-related inquiries or to exercise your rights, contact our Data Protection Officer at:
              </p>
              <p className="text-muted-foreground mt-2">
                Email: privacy@retailjobs.in<br />
                Phone: +91 80 1234 5678
              </p>
            </section>
          </div>
        </div>
      </main>

      <Footer />
    </div>
  );
};

export default PrivacyPolicy;
