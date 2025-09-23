
import React from 'react';
import { Link } from 'react-router-dom';
import { ArrowLeft, Eye, Lock, Database, Shield, FileText, Users } from 'lucide-react';
import Header from '@/components/Header';
import Footer from '@/components/Footer';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';

const PrivacyPolicy = () => {
  const sections = [
    {
      title: "1. Information We Collect",
      content: "We collect information you provide directly to us, such as when you:",
      list: [
        "Create an account or use our services",
        "Contact us for support",
        "Participate in surveys or feedback",
        "Subscribe to our communications"
      ],
      additional: "We also automatically collect certain information about your device and usage patterns when you access our service."
    },
    {
      title: "2. How We Use Your Information",
      content: "We use the information we collect to:",
      list: [
        "Provide, maintain, and improve our services",
        "Process transactions and send related information",
        "Send technical notices and support messages",
        "Respond to comments, questions, and customer service requests",
        "Communicate with you about products, services, and events",
        "Monitor and analyze trends, usage, and activities",
        "Detect, investigate, and prevent fraudulent or illegal activities"
      ]
    },
    {
      title: "3. Information Sharing and Disclosure",
      content: "We do not share, sell, rent, or trade your personal information with third parties except in the following circumstances:",
      list: [
        "With your consent",
        "To comply with laws or respond to lawful requests",
        "To protect rights, property, or safety",
        "In connection with a merger, acquisition, or sale of assets",
        "With service providers who assist us in operating our service"
      ]
    },
    {
      title: "4. Data Security",
      content: "We take reasonable measures to help protect information about you from loss, theft, misuse, and unauthorized access, disclosure, alteration, and destruction. However, no internet or electronic storage system is 100% secure.",
      additional: "We use industry-standard encryption protocols and secure servers to protect your data during transmission and storage."
    },
    {
      title: "5. Cookies and Tracking Technologies",
      content: "We use cookies and similar tracking technologies to:",
      list: [
        "Remember your preferences and settings",
        "Understand how you use our service",
        "Improve user experience",
        "Analyze site traffic and usage patterns"
      ],
      additional: "You can control cookies through your browser settings, but this may limit some functionality of our service."
    },
    {
      title: "6. Your Rights and Choices",
      content: "You have the right to:",
      list: [
        "Access and update your personal information",
        "Delete your account and personal data",
        "Object to processing of your information",
        "Request data portability",
        "Opt out of marketing communications",
        "Lodge a complaint with supervisory authorities"
      ]
    },
    {
      title: "7. Data Retention",
      content: "We retain personal information for as long as necessary to provide our services, comply with legal obligations, resolve disputes, and enforce our agreements. When we no longer need personal information, we securely delete or anonymize it."
    },
    {
      title: "8. International Data Transfers",
      content: "Your information may be transferred to and processed in countries other than your own. We ensure appropriate safeguards are in place to protect your information in accordance with this Privacy Policy."
    },
    {
      title: "9. Changes to This Policy",
      content: "We may update this Privacy Policy from time to time. We will notify you of any changes by posting the new Privacy Policy on this page and updating the 'Last updated' date. We encourage you to review this Privacy Policy periodically."
    },
    {
      title: "10. Contact Us",
      content: "If you have any questions about this Privacy Policy, please contact us at privacy@hubx.com or through our contact page."
    }
  ];

  return (
    <div className="min-h-screen bg-black">
      <Header />
      
      <main className="relative">
        {/* Hero Section */}
        <section className="relative py-12 sm:py-16 lg:py-20 overflow-hidden">
          <div 
            className="absolute inset-0 bg-cover bg-center"
            style={{
              backgroundImage: 'linear-gradient(rgba(0,0,0,0.6), rgba(0,0,0,0.6)), url(/IMG_0112.jpeg)',
            }}
          />
          <div className="absolute inset-0 bg-gradient-to-br from-green-900/30 to-black/50" />
          <div className="w-full max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center space-y-6 relative z-10">
            <Link to="/" className="inline-flex items-center text-gray-300 hover:text-white transition-colors mb-6">
              <ArrowLeft className="w-4 h-4 mr-2" />
              Back to Home
            </Link>
            
            <div className="space-y-4">
              <Badge className="bg-green-600/20 text-green-300 border-green-600/30 px-4 py-1">
                Data Protection
              </Badge>
              <h1 className="text-2xl sm:text-3xl md:text-4xl lg:text-5xl font-bold text-white leading-tight">
                Privacy Policy
              </h1>
              <p className="text-gray-300 text-sm sm:text-base md:text-lg max-w-2xl mx-auto">
                We are committed to protecting your privacy and being transparent about how we collect, use, and protect your information.
              </p>
              <div className="text-gray-400 text-sm">
                Last updated: January 1, 2024
              </div>
            </div>
          </div>
        </section>

        {/* Overview Cards */}
        <section className="py-8 sm:py-12 border-b border-gray-800">
          <div className="w-full max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6">
              <Card className="bg-gray-900/50 border-gray-700 hover:border-green-600/50 transition-colors">
                <CardHeader className="text-center pb-3">
                  <Eye className="w-8 h-8 mx-auto text-green-400 mb-2" />
                  <CardTitle className="text-base lg:text-lg text-white">Transparency</CardTitle>
                </CardHeader>
                <CardContent className="text-center pt-0">
                  <p className="text-xs sm:text-sm text-gray-300">
                    Clear information about data collection
                  </p>
                </CardContent>
              </Card>

              <Card className="bg-gray-900/50 border-gray-700 hover:border-green-600/50 transition-colors">
                <CardHeader className="text-center pb-3">
                  <Lock className="w-8 h-8 mx-auto text-green-400 mb-2" />
                  <CardTitle className="text-base lg:text-lg text-white">Security</CardTitle>
                </CardHeader>
                <CardContent className="text-center pt-0">
                  <p className="text-xs sm:text-sm text-gray-300">
                    Industry-standard data protection
                  </p>
                </CardContent>
              </Card>

              <Card className="bg-gray-900/50 border-gray-700 hover:border-green-600/50 transition-colors">
                <CardHeader className="text-center pb-3">
                  <Database className="w-8 h-8 mx-auto text-green-400 mb-2" />
                  <CardTitle className="text-base lg:text-lg text-white">Data Control</CardTitle>
                </CardHeader>
                <CardContent className="text-center pt-0">
                  <p className="text-xs sm:text-sm text-gray-300">
                    You control your personal information
                  </p>
                </CardContent>
              </Card>

              <Card className="bg-gray-900/50 border-gray-700 hover:border-green-600/50 transition-colors">
                <CardHeader className="text-center pb-3">
                  <Shield className="w-8 h-8 mx-auto text-green-400 mb-2" />
                  <CardTitle className="text-base lg:text-lg text-white">Compliance</CardTitle>
                </CardHeader>
                <CardContent className="text-center pt-0">
                  <p className="text-xs sm:text-sm text-gray-300">
                    GDPR and privacy law compliant
                  </p>
                </CardContent>
              </Card>
            </div>
          </div>
        </section>

        {/* Privacy Content */}
        <section className="py-12 sm:py-16">
          <div className="w-full max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="space-y-6">
              {sections.map((section, index) => (
                <Card key={index} className="bg-gray-900/50 border-gray-700 hover:border-green-600/50 transition-colors">
                  <CardHeader className="pb-4">
                    <div className="flex items-start space-x-3">
                      <div className="w-6 h-6 sm:w-8 sm:h-8 bg-green-600 rounded-lg flex items-center justify-center flex-shrink-0 mt-1">
                        <Shield className="w-3 h-3 sm:w-4 sm:h-4 text-white" />
                      </div>
                      <CardTitle className="text-lg sm:text-xl text-white leading-tight">
                        {section.title}
                      </CardTitle>
                    </div>
                  </CardHeader>
                  <CardContent className="pt-0">
                    <div className="pl-9 sm:pl-11 space-y-3">
                      <p className="text-gray-300 text-sm sm:text-base leading-relaxed">
                        {section.content}
                      </p>
                      {section.list && (
                        <ul className="list-disc pl-6 space-y-2 text-gray-300 text-sm sm:text-base">
                          {section.list.map((item, itemIndex) => (
                            <li key={itemIndex} className="leading-relaxed">{item}</li>
                          ))}
                        </ul>
                      )}
                      {section.additional && (
                        <p className="text-gray-300 text-sm sm:text-base leading-relaxed">
                          {section.additional}
                        </p>
                      )}
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        </section>

        {/* Contact Support Section */}
        <section className="relative py-12 sm:py-16 overflow-hidden">
          <div 
            className="absolute inset-0 bg-cover bg-center"
            style={{
              backgroundImage: 'linear-gradient(rgba(0,0,0,0.7), rgba(0,0,0,0.7)), url(/IMG_0114.jpeg)',
            }}
          />
          <div className="absolute inset-0 bg-gradient-to-br from-green-900/20 to-black/60" />
          <div className="w-full max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10 text-center">
            <div className="space-y-6">
              <h2 className="text-xl sm:text-2xl md:text-3xl font-bold text-white">
                Privacy Questions?
              </h2>
              <p className="text-gray-300 text-sm sm:text-base max-w-2xl mx-auto">
                Contact our privacy team if you have questions about how we handle your data.
              </p>
              <div className="flex flex-col sm:flex-row gap-4 justify-center items-center">
                <Link
                  to="/contact"
                  className="bg-green-600 hover:bg-green-700 text-white px-6 py-3 rounded-lg font-medium transition-colors"
                >
                  Contact Privacy Team
                </Link>
                <a
                  href="mailto:privacy@hubx.com"
                  className="border border-green-600 text-green-400 hover:bg-green-600 hover:text-white px-6 py-3 rounded-lg font-medium transition-colors"
                >
                  Email Privacy Team
                </a>
              </div>
            </div>
          </div>
        </section>
      </main>

      <Footer />
    </div>
  );
};

export default PrivacyPolicy;
