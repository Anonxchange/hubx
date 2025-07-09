import React from 'react';
import { Link } from 'react-router-dom';
import { ArrowLeft, Eye, Lock, Database, Shield } from 'lucide-react';
import Header from '@/components/Header';
import Footer from '@/components/Footer';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

const PrivacyPolicy = () => {
  return (
    <div className="min-h-screen bg-background">
      <Header />
      
      <main className="container mx-auto px-4 py-8 space-y-8">
        {/* Back Button */}
        <Link to="/" className="inline-flex items-center text-muted-foreground hover:text-foreground transition-colors">
          <ArrowLeft className="w-4 h-4 mr-2" />
          Back to Home
        </Link>

        {/* Header */}
        <div className="text-center space-y-4">
          <h1 className="text-3xl md:text-4xl font-bold">Privacy Policy</h1>
          <p className="text-muted-foreground max-w-2xl mx-auto">
            Last updated: January 1, 2024
          </p>
        </div>

        <div className="max-w-4xl mx-auto space-y-8">
          {/* Overview Cards */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
            <Card>
              <CardHeader className="text-center">
                <Eye className="w-8 h-8 mx-auto text-primary" />
                <CardTitle className="text-lg">Transparency</CardTitle>
              </CardHeader>
              <CardContent className="text-center">
                <p className="text-sm text-muted-foreground">
                  Clear information about data collection
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="text-center">
                <Lock className="w-8 h-8 mx-auto text-primary" />
                <CardTitle className="text-lg">Security</CardTitle>
              </CardHeader>
              <CardContent className="text-center">
                <p className="text-sm text-muted-foreground">
                  Your data is protected with industry standards
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="text-center">
                <Database className="w-8 h-8 mx-auto text-primary" />
                <CardTitle className="text-lg">Data Control</CardTitle>
              </CardHeader>
              <CardContent className="text-center">
                <p className="text-sm text-muted-foreground">
                  You control your personal information
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="text-center">
                <Shield className="w-8 h-8 mx-auto text-primary" />
                <CardTitle className="text-lg">Compliance</CardTitle>
              </CardHeader>
              <CardContent className="text-center">
                <p className="text-sm text-muted-foreground">
                  GDPR and privacy law compliant
                </p>
              </CardContent>
            </Card>
          </div>

          {/* Privacy Content */}
          <div className="space-y-8">
            <Card>
              <CardHeader>
                <CardTitle>1. Information We Collect</CardTitle>
              </CardHeader>
              <CardContent className="prose prose-sm max-w-none dark:prose-invert">
                <p>We collect information you provide directly to us, such as when you:</p>
                <ul className="list-disc pl-6 space-y-1">
                  <li>Create an account or use our services</li>
                  <li>Contact us for support</li>
                  <li>Participate in surveys or feedback</li>
                  <li>Subscribe to our communications</li>
                </ul>
                <p>We also automatically collect certain information about your device and usage patterns when you access our service.</p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>2. How We Use Your Information</CardTitle>
              </CardHeader>
              <CardContent className="prose prose-sm max-w-none dark:prose-invert">
                <p>We use the information we collect to:</p>
                <ul className="list-disc pl-6 space-y-1">
                  <li>Provide, maintain, and improve our services</li>
                  <li>Process transactions and send related information</li>
                  <li>Send technical notices and support messages</li>
                  <li>Respond to comments, questions, and customer service requests</li>
                  <li>Communicate with you about products, services, and events</li>
                  <li>Monitor and analyze trends, usage, and activities</li>
                  <li>Detect, investigate, and prevent fraudulent or illegal activities</li>
                </ul>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>3. Information Sharing and Disclosure</CardTitle>
              </CardHeader>
              <CardContent className="prose prose-sm max-w-none dark:prose-invert">
                <p>We do not share, sell, rent, or trade your personal information with third parties except in the following circumstances:</p>
                <ul className="list-disc pl-6 space-y-1">
                  <li>With your consent</li>
                  <li>To comply with laws or respond to lawful requests</li>
                  <li>To protect rights, property, or safety</li>
                  <li>In connection with a merger, acquisition, or sale of assets</li>
                  <li>With service providers who assist us in operating our service</li>
                </ul>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>4. Data Security</CardTitle>
              </CardHeader>
              <CardContent className="prose prose-sm max-w-none dark:prose-invert">
                <p>
                  We take reasonable measures to help protect information about you from loss, theft, misuse, and unauthorized access, 
                  disclosure, alteration, and destruction. However, no internet or electronic storage system is 100% secure.
                </p>
                <p>
                  We use industry-standard encryption protocols and secure servers to protect your data during transmission and storage.
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>5. Cookies and Tracking Technologies</CardTitle>
              </CardHeader>
              <CardContent className="prose prose-sm max-w-none dark:prose-invert">
                <p>We use cookies and similar tracking technologies to:</p>
                <ul className="list-disc pl-6 space-y-1">
                  <li>Remember your preferences and settings</li>
                  <li>Understand how you use our service</li>
                  <li>Improve user experience</li>
                  <li>Analyze site traffic and usage patterns</li>
                </ul>
                <p>You can control cookies through your browser settings, but this may limit some functionality of our service.</p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>6. Your Rights and Choices</CardTitle>
              </CardHeader>
              <CardContent className="prose prose-sm max-w-none dark:prose-invert">
                <p>You have the right to:</p>
                <ul className="list-disc pl-6 space-y-1">
                  <li>Access and update your personal information</li>
                  <li>Delete your account and personal data</li>
                  <li>Object to processing of your information</li>
                  <li>Request data portability</li>
                  <li>Opt out of marketing communications</li>
                  <li>Lodge a complaint with supervisory authorities</li>
                </ul>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>7. Children's Privacy</CardTitle>
              </CardHeader>
              <CardContent className="prose prose-sm max-w-none dark:prose-invert">
                <p>
                  Our service is not intended for children under the age of 18. We do not knowingly collect personal information 
                  from children under 18. If you are a parent and believe your child has provided us with personal information, 
                  please contact us and we will delete such information.
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>8. International Data Transfers</CardTitle>
              </CardHeader>
              <CardContent className="prose prose-sm max-w-none dark:prose-invert">
                <p>
                  Your information may be transferred to and processed in countries other than your own. 
                  We ensure appropriate safeguards are in place to protect your information in accordance with this Privacy Policy.
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>9. Changes to This Policy</CardTitle>
              </CardHeader>
              <CardContent className="prose prose-sm max-w-none dark:prose-invert">
                <p>
                  We may update this Privacy Policy from time to time. We will notify you of any changes by posting the new Privacy Policy 
                  on this page and updating the "Last updated" date. We encourage you to review this Privacy Policy periodically.
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>10. Contact Us</CardTitle>
              </CardHeader>
              <CardContent className="prose prose-sm max-w-none dark:prose-invert">
                <p>
                  If you have any questions about this Privacy Policy, please contact us at:
                </p>
                <ul className="list-none space-y-1">
                  <li>Email: privacy@hubx.com</li>
                  <li>Address: HubX Privacy Team</li>
                </ul>
              </CardContent>
            </Card>
          </div>
        </div>
      </main>

      <Footer />
    </div>
  );
};

export default PrivacyPolicy;