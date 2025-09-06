
import React from 'react';
import { Link } from 'react-router-dom';
import { ArrowLeft, Shield, Users, Eye } from 'lucide-react';
import Header from '@/components/Header';
import Footer from '@/components/Footer';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

const RTAPage = () => {
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
          <div className="flex justify-center mb-6">
            <div className="bg-primary/10 border border-primary/20 px-8 py-4 rounded-lg">
              <span className="text-primary font-bold text-2xl">RTA</span>
            </div>
          </div>
          <h1 className="text-3xl md:text-4xl font-bold">Restricted to Adults</h1>
          <p className="text-muted-foreground max-w-2xl mx-auto">
            RTA-5042-1996-1400-1577-RTA - This website is rated with RTA label for parental control and content filtering
          </p>
        </div>

        <div className="max-w-4xl mx-auto space-y-8">
          {/* Overview Cards */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <Card>
              <CardHeader className="text-center">
                <Shield className="w-8 h-8 mx-auto text-primary" />
                <CardTitle className="text-lg">Content Protection</CardTitle>
              </CardHeader>
              <CardContent className="text-center">
                <p className="text-sm text-muted-foreground">
                  RTA label helps protect minors from inappropriate content
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="text-center">
                <Users className="w-8 h-8 mx-auto text-primary" />
                <CardTitle className="text-lg">Parental Control</CardTitle>
              </CardHeader>
              <CardContent className="text-center">
                <p className="text-sm text-muted-foreground">
                  Parents can easily block access to RTA-labeled websites
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="text-center">
                <Eye className="w-8 h-8 mx-auto text-primary" />
                <CardTitle className="text-lg">Industry Standard</CardTitle>
              </CardHeader>
              <CardContent className="text-center">
                <p className="text-sm text-muted-foreground">
                  RTA is recognized by major filtering software providers
                </p>
              </CardContent>
            </Card>
          </div>

          {/* RTA Information */}
          <div className="space-y-8">
            <Card>
              <CardHeader>
                <CardTitle>What is RTA?</CardTitle>
              </CardHeader>
              <CardContent className="prose prose-sm max-w-none dark:prose-invert">
                <p>
                  The Restricted to Adults (RTA) website label was created by parents and industry to better protect children 
                  from age-inappropriate content online. The RTA label is a free, voluntary label that website owners can use 
                  to indicate that their site is intended for adults only.
                </p>
                <p>
                  All pages on HubX carry the RTA label. This means parents can easily block access to this site using 
                  parental control software. More information about the RTA label and compatible services can be found at 
                  <a href="https://www.rtalabel.org" target="_blank" rel="noopener noreferrer" className="text-primary hover:underline">
                    www.rtalabel.org
                  </a>.
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Age Verification</CardTitle>
              </CardHeader>
              <CardContent className="prose prose-sm max-w-none dark:prose-invert">
                <p>
                  By accessing HubX, you confirm that:
                </p>
                <ul className="list-disc pl-6 space-y-1">
                  <li>You are at least 18 years of age or the age of majority in your jurisdiction</li>
                  <li>You are accessing this website of your own free will</li>
                  <li>You will not distribute any material from this website to minors</li>
                  <li>You understand that this website contains adult content</li>
                </ul>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Content Warning</CardTitle>
              </CardHeader>
              <CardContent className="prose prose-sm max-w-none dark:prose-invert">
                <p>
                  This website contains age-restricted materials including:
                </p>
                <ul className="list-disc pl-6 space-y-1">
                  <li>Nudity and explicit sexual content</li>
                  <li>Adult-oriented discussions and themes</li>
                  <li>Material intended for mature audiences only</li>
                </ul>
                <p>
                  If you do not wish to view such materials, or if you are under 18 years of age, please leave this website immediately.
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Parental Control Information</CardTitle>
              </CardHeader>
              <CardContent className="prose prose-sm max-w-none dark:prose-invert">
                <p>
                  Parents can use various filtering software and services to block access to RTA-labeled websites:
                </p>
                <ul className="list-disc pl-6 space-y-1">
                  <li><strong>Net Nanny:</strong> Comprehensive parental control software</li>
                  <li><strong>CyberPatrol:</strong> Web filtering and monitoring solution</li>
                  <li><strong>Norton Family:</strong> Parental control features</li>
                  <li><strong>Qustodio:</strong> Digital wellbeing platform for families</li>
                  <li><strong>Circle Home Plus:</strong> Network-level filtering</li>
                </ul>
                <p>
                  For more information on how to set up parental controls, visit 
                  <a href="https://www.rtalabel.org/index.php?content=parents" target="_blank" rel="noopener noreferrer" className="text-primary hover:underline ml-1">
                    the RTA parent information page
                  </a>.
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Technical Implementation</CardTitle>
              </CardHeader>
              <CardContent className="prose prose-sm max-w-none dark:prose-invert">
                <p>
                  Our website implements RTA labeling through:
                </p>
                <ul className="list-disc pl-6 space-y-1">
                  <li>HTTP headers indicating adult content</li>
                  <li>Meta tags in HTML documents</li>
                  <li>Consistent labeling across all pages</li>
                  <li>Compliance with industry standards</li>
                </ul>
                <div className="bg-muted p-4 rounded-lg mt-4">
                  <code className="text-sm">
                    &lt;meta name="rating" content="RTA-5042-1996-1400-1577-RTA" /&gt;
                  </code>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Contact Information</CardTitle>
              </CardHeader>
              <CardContent className="prose prose-sm max-w-none dark:prose-invert">
                <p>
                  If you have questions about our RTA compliance or need assistance with parental controls, 
                  please contact our support team. We are committed to maintaining appropriate content labeling 
                  and supporting parental control efforts.
                </p>
                <p>
                  For technical issues with filtering software or RTA implementation, please consult the documentation 
                  provided by your filtering software vendor or visit 
                  <a href="https://www.rtalabel.org" target="_blank" rel="noopener noreferrer" className="text-primary hover:underline">
                    www.rtalabel.org
                  </a> for additional resources.
                </p>
              </CardContent>
            </Card>
          </div>

          {/* Legal Disclaimer */}
          <div className="bg-muted/50 border border-border rounded-lg p-6">
            <h3 className="font-semibold text-lg mb-3">Legal Disclaimer</h3>
            <p className="text-sm text-muted-foreground leading-relaxed">
              The RTA label does not imply any endorsement by the Association of Sites Advocating Child Protection (ASACP) 
              or any other organization. Website owners are solely responsible for the content on their sites and for 
              ensuring compliance with applicable laws and regulations. The RTA label is provided as a voluntary service 
              to help parents protect their children online.
            </p>
          </div>
        </div>
      </main>

      <Footer />
    </div>
  );
};

export default RTAPage;
