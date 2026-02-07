import Header from "@/components/layout/Header";
import Footer from "@/components/layout/Footer";

const TermsOfService = () => {
  return (
    <div className="min-h-screen bg-background">
      <Header />
      
      <main className="pt-24 pb-12">
        <div className="container mx-auto px-4 py-12 max-w-4xl">
          <h1 className="font-display text-4xl font-bold mb-8">Terms of Service</h1>
          <p className="text-muted-foreground mb-8">Last updated: February 2025</p>

          <div className="prose prose-slate dark:prose-invert max-w-none space-y-8">
            <section>
              <h2 className="text-2xl font-semibold mb-4">1. Acceptance of Terms</h2>
              <p className="text-muted-foreground">
                By accessing and using RetailJobs ("the Platform"), you accept and agree to be bound by these 
                Terms of Service and our Privacy Policy. If you do not agree to these terms, please do not use our services.
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-semibold mb-4">2. User Accounts</h2>
              <p className="text-muted-foreground mb-4">
                There are two types of accounts on our platform:
              </p>
              <ul className="list-disc pl-6 text-muted-foreground space-y-2">
                <li><strong>Employee Accounts:</strong> Free registration for job seekers in the retail industry.</li>
                <li><strong>Employer Accounts:</strong> Paid accounts (₹5,000 annually) for organizations looking to hire.</li>
              </ul>
              <p className="text-muted-foreground mt-4">
                You are responsible for maintaining the confidentiality of your account credentials and for all activities under your account.
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-semibold mb-4">3. Services and Fees</h2>
              <h3 className="text-xl font-medium mb-2">3.1 Candidate Reservation</h3>
              <ul className="list-disc pl-6 text-muted-foreground space-y-2">
                <li>Employers pay ₹500 per candidate to view full details and reserve them for 5 days.</li>
                <li>Reserved candidates are hidden from other employers' searches during this period.</li>
                <li>If hired, update the status within 5 days. If not hired, receive ₹200 refund per candidate.</li>
                <li>If no update is provided within 5 days, candidate reverts to available status.</li>
              </ul>

              <h3 className="text-xl font-medium mb-2 mt-4">3.2 Skill Tests</h3>
              <ul className="list-disc pl-6 text-muted-foreground space-y-2">
                <li>Employees pay ₹50 entry fee to take employer-created tests.</li>
                <li>Employers are charged ₹30 per employee who completes the test.</li>
              </ul>

              <h3 className="text-xl font-medium mb-2 mt-4">3.3 Certification Courses</h3>
              <ul className="list-disc pl-6 text-muted-foreground space-y-2">
                <li>Employees can enroll in certification courses for ₹50 each.</li>
                <li>Completed certifications are displayed on employee profiles.</li>
              </ul>
            </section>

            <section>
              <h2 className="text-2xl font-semibold mb-4">4. Wallet and Payments</h2>
              <p className="text-muted-foreground">
                All transactions are processed through our secure wallet system. Users can add money to their 
                wallet for automatic deductions. Refunds are credited back to the wallet and can be withdrawn 
                as per our refund policy.
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-semibold mb-4">5. User Conduct</h2>
              <p className="text-muted-foreground mb-4">Users agree not to:</p>
              <ul className="list-disc pl-6 text-muted-foreground space-y-2">
                <li>Provide false or misleading information</li>
                <li>Use the platform for any unlawful purpose</li>
                <li>Attempt to access other users' accounts</li>
                <li>Harass or discriminate against other users</li>
                <li>Manipulate the rating or review system</li>
              </ul>
            </section>

            <section>
              <h2 className="text-2xl font-semibold mb-4">6. Termination</h2>
              <p className="text-muted-foreground">
                We reserve the right to suspend or terminate accounts that violate these terms. 
                Employers who receive multiple complaints or blacklist employees without valid 
                reasons may face account suspension.
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-semibold mb-4">7. Limitation of Liability</h2>
              <p className="text-muted-foreground">
                RetailJobs acts as a platform connecting employers and employees. We are not responsible 
                for the accuracy of profile information, employment decisions, or disputes between parties.
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-semibold mb-4">8. Contact</h2>
              <p className="text-muted-foreground">
                For questions about these terms, contact us at legal@retailjobs.in
              </p>
            </section>
          </div>
        </div>
      </main>

      <Footer />
    </div>
  );
};

export default TermsOfService;
