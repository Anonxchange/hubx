
import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { ArrowLeft, Building, Star, Users, DollarSign, TrendingUp, Shield, Clock } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { toast } from 'sonner';
import Header from '@/components/Header';
import Footer from '@/components/Footer';

const OpenStudioPage = () => {
  const [formData, setFormData] = useState({
    studioName: '',
    contactEmail: '',
    website: '',
    description: '',
    experience: '',
    contentTypes: [] as string[],
    estimatedCreators: ''
  });

  const benefits = [
    {
      title: "Revenue Sharing",
      value: "Up to 75%",
      description: "Higher revenue share for studio partners"
    },
    {
      title: "Volume Bonuses",
      value: "5-15%",
      description: "Additional bonuses based on monthly performance"
    },
    {
      title: "Marketing Support",
      value: "$10K+",
      description: "Free marketing and promotional campaigns"
    },
    {
      title: "Support Response",
      value: "< 2 hours",
      description: "Priority customer support for studios"
    }
  ];

  const features = [
    {
      icon: Users,
      title: "Creator Management",
      description: "Advanced tools to manage multiple creators and their content"
    },
    {
      icon: DollarSign,
      title: "Revenue Analytics",
      description: "Detailed financial reporting and revenue optimization tools"
    },
    {
      icon: TrendingUp,
      title: "Performance Tracking",
      description: "Monitor performance metrics and growth analytics"
    },
    {
      icon: Shield,
      title: "Content Protection",
      description: "Advanced security features to protect your content"
    }
  ];

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleContentTypeChange = (type: string) => {
    setFormData(prev => ({
      ...prev,
      contentTypes: prev.contentTypes.includes(type)
        ? prev.contentTypes.filter(t => t !== type)
        : [...prev.contentTypes, type]
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.studioName || !formData.contactEmail || !formData.description) {
      toast.error('Please fill in all required fields');
      return;
    }

    try {
      // In a real implementation, you would send this to your backend
      console.log('Studio application submitted:', formData);
      toast.success('Application submitted successfully! We will review your application and contact you within 2-3 business days.');
      
      // Reset form
      setFormData({
        studioName: '',
        contactEmail: '',
        website: '',
        description: '',
        experience: '',
        contentTypes: [],
        estimatedCreators: ''
      });
    } catch (error) {
      console.error('Error submitting application:', error);
      toast.error('Failed to submit application. Please try again.');
    }
  };

  return (
    <div className="min-h-screen bg-background">
      <Header />
      
      <main className="container mx-auto px-4 py-8 space-y-8">
        {/* Back Button */}
        <Link to="/" className="inline-flex items-center text-muted-foreground hover:text-foreground transition-colors">>
          <ArrowLeft className="w-4 h-4 mr-2" />
          Back to Home
        </Link>

        {/* Header */}
        <div className="text-center space-y-4">
          <div className="flex items-center justify-center space-x-2 mb-4">
            <Building className="w-12 h-12 text-purple-600" />
            <h1 className="text-4xl md:text-5xl font-bold">Open a Studio</h1>
          </div>
          <p className="text-xl text-muted-foreground max-w-3xl mx-auto">
            Partner with HubX to launch your adult content studio and manage multiple creators professionally
          </p>
          <Badge variant="secondary" className="text-lg px-4 py-2 bg-purple-600 text-white">
            <Star className="w-4 h-4 mr-1" />
            Professional Studio Partnership
          </Badge>
        </div>

        {/* Key Benefits */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {benefits.map((benefit, index) => (
            <Card key={index} className="text-center">
              <CardContent className="p-6">
                <div className="text-2xl font-bold text-purple-600 mb-2">{benefit.value}</div>
                <h3 className="font-semibold mb-1">{benefit.title}</h3>
                <p className="text-xs text-muted-foreground">{benefit.description}</p>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* Features */}
        <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
          {features.map((feature, index) => {
            const IconComponent = feature.icon;
            return (
              <Card key={index}>
                <CardContent className="p-6 text-center">
                  <IconComponent className="w-8 h-8 text-purple-600 mx-auto mb-3" />
                  <h3 className="font-semibold mb-2">{feature.title}</h3>
                  <p className="text-sm text-muted-foreground">{feature.description}</p>
                </CardContent>
              </Card>
            );
          })}
        </div>

        {/* Application Form */}
        <Card className="max-w-2xl mx-auto">
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <Building className="w-5 h-5" />
              <span>Studio Application</span>
            </CardTitle>
            <p className="text-sm text-muted-foreground">
              Fill out the form below to apply for a studio partnership. All fields marked with * are required.
            </p>
          </CardHeader>
          
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-6">
              <div className="grid md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="studioName">Studio Name *</Label>
                  <Input
                    id="studioName"
                    name="studioName"
                    value={formData.studioName}
                    onChange={handleInputChange}
                    placeholder="Enter your studio name"
                    required
                  />
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="contactEmail">Contact Email *</Label>
                  <Input
                    id="contactEmail"
                    name="contactEmail"
                    type="email"
                    value={formData.contactEmail}
                    onChange={handleInputChange}
                    placeholder="your@email.com"
                    required
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="website">Website (Optional)</Label>
                <Input
                  id="website"
                  name="website"
                  type="url"
                  value={formData.website}
                  onChange={handleInputChange}
                  placeholder="https://yourstudio.com"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="description">Studio Description *</Label>
                <Textarea
                  id="description"
                  name="description"
                  value={formData.description}
                  onChange={handleInputChange}
                  placeholder="Tell us about your studio, your vision, and what makes you unique..."
                  className="min-h-24"
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="experience">Industry Experience</Label>
                <Textarea
                  id="experience"
                  name="experience"
                  value={formData.experience}
                  onChange={handleInputChange}
                  placeholder="Describe your experience in the adult content industry..."
                  className="min-h-20"
                />
              </div>

              <div className="space-y-2">
                <Label>Content Types (Select all that apply)</Label>
                <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
                  {['Solo', 'Couples', 'VR', 'Live Streaming', 'Premium Content', 'Interactive'].map((type) => (
                    <div key={type} className="flex items-center space-x-2">
                      <input
                        type="checkbox"
                        id={type}
                        checked={formData.contentTypes.includes(type)}
                        onChange={() => handleContentTypeChange(type)}
                        className="rounded"
                      />
                      <Label htmlFor={type} className="text-sm">{type}</Label>
                    </div>
                  ))}
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="estimatedCreators">Estimated Number of Creators</Label>
                <Input
                  id="estimatedCreators"
                  name="estimatedCreators"
                  type="number"
                  value={formData.estimatedCreators}
                  onChange={handleInputChange}
                  placeholder="How many creators do you plan to work with?"
                />
              </div>

              <Button type="submit" className="w-full bg-purple-600 hover:bg-purple-700">
                Submit Application
              </Button>
            </form>
          </CardContent>
        </Card>

        {/* Process Timeline */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <Clock className="w-5 h-5" />
              <span>Application Process</span>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid md:grid-cols-4 gap-4">
              <div className="text-center">
                <div className="w-8 h-8 bg-purple-600 text-white rounded-full flex items-center justify-center mx-auto mb-2">1</div>
                <h4 className="font-semibold">Submit Application</h4>
                <p className="text-sm text-muted-foreground">Fill out and submit the form above</p>
              </div>
              <div className="text-center">
                <div className="w-8 h-8 bg-purple-600 text-white rounded-full flex items-center justify-center mx-auto mb-2">2</div>
                <h4 className="font-semibold">Review Process</h4>
                <p className="text-sm text-muted-foreground">Our team reviews your application (2-3 days)</p>
              </div>
              <div className="text-center">
                <div className="w-8 h-8 bg-purple-600 text-white rounded-full flex items-center justify-center mx-auto mb-2">3</div>
                <h4 className="font-semibold">Interview Call</h4>
                <p className="text-sm text-muted-foreground">Schedule a call to discuss partnership details</p>
              </div>
              <div className="text-center">
                <div className="w-8 h-8 bg-purple-600 text-white rounded-full flex items-center justify-center mx-auto mb-2">4</div>
                <h4 className="font-semibold">Launch Studio</h4>
                <p className="text-sm text-muted-foreground">Complete setup and start managing creators</p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* FAQ */}
        <Card>
          <CardHeader>
            <CardTitle>Frequently Asked Questions</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <h4 className="font-semibold mb-1">What are the requirements to become a studio partner?</h4>
              <p className="text-sm text-muted-foreground">
                You need to have experience in content creation or management, a business plan, and the ability to work with multiple creators professionally.
              </p>
            </div>
            <div>
              <h4 className="font-semibold mb-1">How much does it cost to start a studio?</h4>
              <p className="text-sm text-muted-foreground">
                There are no upfront costs to become a studio partner. You'll share revenue with HubX based on our partnership agreement.
              </p>
            </div>
            <div>
              <h4 className="font-semibold mb-1">What support do you provide to studio partners?</h4>
              <p className="text-sm text-muted-foreground">
                We provide marketing support, technical assistance, payment processing, content management tools, and dedicated account management.
              </p>
            </div>
          </CardContent>
        </Card>
      </main>

      <Footer />
    </div>
  );
};

export default OpenStudioPage;
