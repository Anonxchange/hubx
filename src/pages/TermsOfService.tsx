
import React from 'react';
import { Link } from 'react-router-dom';
import { ArrowLeft, Shield, Scale, Clock, FileText, Users, Lock } from 'lucide-react';
import Header from '@/components/Header';
import Footer from '@/components/Footer';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';

const TermsOfService = () => {
  const sections = [
    {
      title: "1. Acceptance of Terms",
      content: "By accessing and using HubX, you accept and agree to be bound by the terms and provision of this agreement. If you do not agree to these terms, please do not use our service."
    },
    {
      title: "2. Use License",
      content: "Permission is granted to temporarily access HubX for personal, non-commercial transitory viewing only. This is the grant of a license, not a transfer of title, and under this license you may not:",
      list: [
        "modify or copy the materials",
        "use the materials for any commercial purpose or for any public display",
        "attempt to reverse engineer any software contained on the website",
        "remove any copyright or other proprietary notations from the materials"
      ]
    },
    {
      title: "3. User Conduct",
      content: "You agree not to use the service to:",
      list: [
        "Upload, post or transmit any content that is illegal, harmful, or offensive",
        "Impersonate any person or entity or misrepresent your affiliation",
        "Violate any applicable laws or regulations",
        "Interfere with or disrupt the service or servers",
        "Attempt to gain unauthorized access to any part of the service"
      ]
    },
    {
      title: "4. Content and Copyright",
      content: "All content on HubX is protected by copyright and other intellectual property laws. Users are responsible for ensuring they have the right to view and share any content they access through our platform."
    },
    {
      title: "5. Privacy and Data Protection",
      content: "Your privacy is important to us. Our Privacy Policy explains how we collect, use, and protect your information when you use our service. By using HubX, you agree to the collection and use of information in accordance with our Privacy Policy."
    },
    {
      title: "6. Disclaimer",
      content: "The materials on HubX are provided on an 'as is' basis. HubX makes no warranties, expressed or implied, and hereby disclaims and negates all other warranties including without limitation, implied warranties or conditions of merchantability, fitness for a particular purpose, or non-infringement of intellectual property or other rights."
    },
    {
      title: "7. Limitations",
      content: "In no event shall HubX or its suppliers be liable for any damages (including, without limitation, damages for loss of data or profit, or due to business interruption) arising out of the use or inability to use the materials on HubX, even if HubX or an authorized representative has been notified orally or in writing of the possibility of such damage."
    },
    {
      title: "8. Account Termination",
      content: "We reserve the right to terminate or suspend your account immediately, without prior notice or liability, for any reason whatsoever, including without limitation if you breach the Terms."
    },
    {
      title: "9. Modifications to Terms",
      content: "We reserve the right, at our sole discretion, to modify or replace these Terms at any time. If a revision is material, we will try to provide at least 30 days notice prior to any new terms taking effect."
    },
    {
      title: "10. Contact Information",
      content: "If you have any questions about these Terms of Service, please contact us at support@hubx.com"
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
              backgroundImage: 'linear-gradient(rgba(0,0,0,0.6), rgba(0,0,0,0.6)), url(/IMG_0115.jpeg)',
            }}
          />
          <div className="absolute inset-0 bg-gradient-to-br from-purple-900/30 to-black/50" />
          <div className="w-full max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center space-y-6 relative z-10">
            <Link to="/" className="inline-flex items-center text-gray-300 hover:text-white transition-colors mb-6">
              <ArrowLeft className="w-4 h-4 mr-2" />
              Back to Home
            </Link>
            
            <div className="space-y-4">
              <Badge className="bg-blue-600/20 text-blue-300 border-blue-600/30 px-4 py-1">
                Legal Documents
              </Badge>
              <h1 className="text-2xl sm:text-3xl md:text-4xl lg:text-5xl font-bold text-white leading-tight">
                Terms of Service
              </h1>
              <p className="text-gray-300 text-sm sm:text-base md:text-lg max-w-2xl mx-auto">
                Please read these terms carefully before using HubX. Your use of our service constitutes acceptance of these terms.
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
              <Card className="bg-gray-900/50 border-gray-700 hover:border-blue-600/50 transition-colors">
                <CardHeader className="text-center pb-3">
                  <Shield className="w-8 h-8 mx-auto text-blue-400 mb-2" />
                  <CardTitle className="text-base lg:text-lg text-white">User Safety</CardTitle>
                </CardHeader>
                <CardContent className="text-center pt-0">
                  <p className="text-xs sm:text-sm text-gray-300">
                    Strict content guidelines for safe platform use
                  </p>
                </CardContent>
              </Card>

              <Card className="bg-gray-900/50 border-gray-700 hover:border-blue-600/50 transition-colors">
                <CardHeader className="text-center pb-3">
                  <Scale className="w-8 h-8 mx-auto text-blue-400 mb-2" />
                  <CardTitle className="text-base lg:text-lg text-white">Fair Use</CardTitle>
                </CardHeader>
                <CardContent className="text-center pt-0">
                  <p className="text-xs sm:text-sm text-gray-300">
                    Clear guidelines on acceptable platform usage
                  </p>
                </CardContent>
              </Card>

              <Card className="bg-gray-900/50 border-gray-700 hover:border-blue-600/50 transition-colors">
                <CardHeader className="text-center pb-3">
                  <Users className="w-8 h-8 mx-auto text-blue-400 mb-2" />
                  <CardTitle className="text-base lg:text-lg text-white">Community</CardTitle>
                </CardHeader>
                <CardContent className="text-center pt-0">
                  <p className="text-xs sm:text-sm text-gray-300">
                    Rules for respectful community interaction
                  </p>
                </CardContent>
              </Card>

              <Card className="bg-gray-900/50 border-gray-700 hover:border-blue-600/50 transition-colors">
                <CardHeader className="text-center pb-3">
                  <Clock className="w-8 h-8 mx-auto text-blue-400 mb-2" />
                  <CardTitle className="text-base lg:text-lg text-white">Regular Updates</CardTitle>
                </CardHeader>
                <CardContent className="text-center pt-0">
                  <p className="text-xs sm:text-sm text-gray-300">
                    Terms reviewed and updated as needed
                  </p>
                </CardContent>
              </Card>
            </div>
          </div>
        </section>

        {/* Terms Content */}
        <section className="py-12 sm:py-16">
          <div className="w-full max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="space-y-6">
              {sections.map((section, index) => (
                <Card key={index} className="bg-gray-900/50 border-gray-700 hover:border-blue-600/50 transition-colors">
                  <CardHeader className="pb-4">
                    <div className="flex items-start space-x-3">
                      <div className="w-6 h-6 sm:w-8 sm:h-8 bg-blue-600 rounded-lg flex items-center justify-center flex-shrink-0 mt-1">
                        <FileText className="w-3 h-3 sm:w-4 sm:h-4 text-white" />
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
              backgroundImage: 'linear-gradient(rgba(0,0,0,0.7), rgba(0,0,0,0.7)), url(/IMG_0110.jpeg)',
            }}
          />
          <div className="absolute inset-0 bg-gradient-to-br from-blue-900/20 to-black/60" />
          <div className="w-full max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10 text-center">
            <div className="space-y-6">
              <h2 className="text-xl sm:text-2xl md:text-3xl font-bold text-white">
                Questions about our Terms?
              </h2>
              <p className="text-gray-300 text-sm sm:text-base max-w-2xl mx-auto">
                Our legal team is available to help clarify any questions about our terms of service.
              </p>
              <div className="flex flex-col sm:flex-row gap-4 justify-center items-center">
                <Link
                  to="/contact"
                  className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-3 rounded-lg font-medium transition-colors"
                >
                  Contact Legal Team
                </Link>
                <Link
                  to="/faq"
                  className="border border-blue-600 text-blue-400 hover:bg-blue-600 hover:text-white px-6 py-3 rounded-lg font-medium transition-colors"
                >
                  View FAQ
                </Link>
              </div>
            </div>
          </div>
        </section>
      </main>

      <Footer />
    </div>
  );
};

export default TermsOfService;
