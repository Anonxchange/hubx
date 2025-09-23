
import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { ArrowLeft, Mail, Phone, MessageCircle, Clock, MapPin, Send, User, FileText } from 'lucide-react';
import Header from '@/components/Header';
import Footer from '@/components/Footer';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';

const ContactUs = () => {
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    subject: '',
    category: '',
    message: ''
  });

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    });
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    console.log('Form submitted:', formData);
    // Handle form submission here
  };

  const contactMethods = [
    {
      icon: Mail,
      title: "Email Support",
      description: "Get help via email within 24 hours",
      contact: "support@hubx.com",
      action: "Send Email",
      color: "text-blue-400",
      bgColor: "bg-blue-600"
    },
    {
      icon: MessageCircle,
      title: "Live Chat",
      description: "Chat with our support team in real-time",
      contact: "Available 24/7",
      action: "Start Chat",
      color: "text-green-400",
      bgColor: "bg-green-600"
    },
    {
      icon: Phone,
      title: "Phone Support",
      description: "Call us for urgent issues (Premium only)",
      contact: "+1 (555) 123-4567",
      action: "Call Now",
      color: "text-purple-400",
      bgColor: "bg-purple-600"
    }
  ];

  const faqs = [
    {
      question: "How quickly do you respond?",
      answer: "We aim to respond within 24 hours during business days."
    },
    {
      question: "What information should I include?",
      answer: "Please provide as much detail as possible about your issue or question."
    },
    {
      question: "Do you offer phone support?",
      answer: "Phone support is available for premium members for urgent issues."
    },
    {
      question: "Can I track my support ticket?",
      answer: "Yes, you'll receive a ticket number via email to track your request."
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
              backgroundImage: 'linear-gradient(rgba(0,0,0,0.6), rgba(0,0,0,0.6)), url(/IMG_0113.jpeg)',
            }}
          />
          <div className="absolute inset-0 bg-gradient-to-br from-orange-900/30 to-black/50" />
          <div className="w-full max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center space-y-6 relative z-10">
            <Link to="/" className="inline-flex items-center text-gray-300 hover:text-white transition-colors mb-6">
              <ArrowLeft className="w-4 h-4 mr-2" />
              Back to Home
            </Link>
            
            <div className="space-y-4">
              <Badge className="bg-orange-600/20 text-orange-300 border-orange-600/30 px-4 py-1">
                Support Center
              </Badge>
              <h1 className="text-2xl sm:text-3xl md:text-4xl lg:text-5xl font-bold text-white leading-tight">
                Contact Us
              </h1>
              <p className="text-gray-300 text-sm sm:text-base md:text-lg max-w-2xl mx-auto">
                Need help? Our dedicated support team is here to assist you with any questions or concerns.
              </p>
            </div>
          </div>
        </section>

        {/* Contact Methods */}
        <section className="py-8 sm:py-12 border-b border-gray-800">
          <div className="w-full max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 sm:gap-6">
              {contactMethods.map((method, index) => (
                <Card key={index} className="bg-gray-900/50 border-gray-700 hover:border-orange-600/50 transition-colors">
                  <CardHeader className="text-center pb-3">
                    <div className={`w-12 h-12 ${method.bgColor} rounded-lg flex items-center justify-center mx-auto mb-3`}>
                      <method.icon className="w-6 h-6 text-white" />
                    </div>
                    <CardTitle className="text-lg text-white">{method.title}</CardTitle>
                  </CardHeader>
                  <CardContent className="text-center space-y-3">
                    <p className="text-sm text-gray-300">{method.description}</p>
                    <p className={`font-medium ${method.color}`}>{method.contact}</p>
                    <Button className={`w-full ${method.bgColor} hover:opacity-90`}>
                      {method.action}
                    </Button>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        </section>

        {/* Contact Form */}
        <section className="py-12 sm:py-16">
          <div className="w-full max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
              {/* Form */}
              <Card className="bg-gray-900/50 border-gray-700">
                <CardHeader>
                  <div className="flex items-center space-x-3 mb-4">
                    <div className="w-8 h-8 bg-orange-600 rounded-lg flex items-center justify-center">
                      <Send className="w-4 h-4 text-white" />
                    </div>
                    <CardTitle className="text-xl text-white">Send us a Message</CardTitle>
                  </div>
                  <p className="text-gray-300 text-sm">
                    Fill out the form below and we'll get back to you as soon as possible.
                  </p>
                </CardHeader>
                <CardContent>
                  <form onSubmit={handleSubmit} className="space-y-4">
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label htmlFor="name" className="text-white">Name</Label>
                        <Input
                          id="name"
                          name="name"
                          value={formData.name}
                          onChange={handleInputChange}
                          placeholder="Your full name"
                          className="bg-gray-800 border-gray-600 text-white placeholder-gray-400"
                          required
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="email" className="text-white">Email</Label>
                        <Input
                          id="email"
                          name="email"
                          type="email"
                          value={formData.email}
                          onChange={handleInputChange}
                          placeholder="your.email@example.com"
                          className="bg-gray-800 border-gray-600 text-white placeholder-gray-400"
                          required
                        />
                      </div>
                    </div>
                    
                    <div className="space-y-2">
                      <Label htmlFor="category" className="text-white">Category</Label>
                      <Select onValueChange={(value) => setFormData({...formData, category: value})}>
                        <SelectTrigger className="bg-gray-800 border-gray-600 text-white">
                          <SelectValue placeholder="Select a category" />
                        </SelectTrigger>
                        <SelectContent className="bg-gray-800 border-gray-600">
                          <SelectItem value="technical">Technical Support</SelectItem>
                          <SelectItem value="billing">Billing & Payments</SelectItem>
                          <SelectItem value="content">Content Issues</SelectItem>
                          <SelectItem value="account">Account Management</SelectItem>
                          <SelectItem value="general">General Inquiry</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="subject" className="text-white">Subject</Label>
                      <Input
                        id="subject"
                        name="subject"
                        value={formData.subject}
                        onChange={handleInputChange}
                        placeholder="Brief description of your issue"
                        className="bg-gray-800 border-gray-600 text-white placeholder-gray-400"
                        required
                      />
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="message" className="text-white">Message</Label>
                      <Textarea
                        id="message"
                        name="message"
                        value={formData.message}
                        onChange={handleInputChange}
                        placeholder="Please provide detailed information about your question or issue..."
                        rows={6}
                        className="bg-gray-800 border-gray-600 text-white placeholder-gray-400 resize-none"
                        required
                      />
                    </div>

                    <Button type="submit" className="w-full bg-orange-600 hover:bg-orange-700">
                      <Send className="w-4 h-4 mr-2" />
                      Send Message
                    </Button>
                  </form>
                </CardContent>
              </Card>

              {/* FAQ & Info */}
              <div className="space-y-6">
                {/* Business Hours */}
                <Card className="bg-gray-900/50 border-gray-700">
                  <CardHeader>
                    <div className="flex items-center space-x-3 mb-2">
                      <div className="w-8 h-8 bg-orange-600 rounded-lg flex items-center justify-center">
                        <Clock className="w-4 h-4 text-white" />
                      </div>
                      <CardTitle className="text-lg text-white">Business Hours</CardTitle>
                    </div>
                  </CardHeader>
                  <CardContent className="space-y-2 text-sm">
                    <div className="flex justify-between">
                      <span className="text-gray-300">Monday - Friday</span>
                      <span className="text-white">9:00 AM - 6:00 PM PST</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-300">Saturday</span>
                      <span className="text-white">10:00 AM - 4:00 PM PST</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-300">Sunday</span>
                      <span className="text-white">Closed</span>
                    </div>
                    <div className="pt-2 border-t border-gray-700">
                      <p className="text-xs text-gray-400">
                        Emergency support available 24/7 for premium members
                      </p>
                    </div>
                  </CardContent>
                </Card>

                {/* Quick FAQ */}
                <Card className="bg-gray-900/50 border-gray-700">
                  <CardHeader>
                    <div className="flex items-center space-x-3 mb-2">
                      <div className="w-8 h-8 bg-orange-600 rounded-lg flex items-center justify-center">
                        <FileText className="w-4 h-4 text-white" />
                      </div>
                      <CardTitle className="text-lg text-white">Quick Answers</CardTitle>
                    </div>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    {faqs.map((faq, index) => (
                      <div key={index} className="space-y-2">
                        <h3 className="font-medium text-white text-sm">{faq.question}</h3>
                        <p className="text-gray-300 text-xs leading-relaxed">{faq.answer}</p>
                        {index < faqs.length - 1 && <div className="border-b border-gray-700" />}
                      </div>
                    ))}
                    <div className="pt-2">
                      <Link 
                        to="/faq" 
                        className="text-orange-400 hover:text-orange-300 text-sm font-medium"
                      >
                        View all FAQs →
                      </Link>
                    </div>
                  </CardContent>
                </Card>
              </div>
            </div>
          </div>
        </section>

        {/* Response Time Info */}
        <section className="relative py-12 sm:py-16 overflow-hidden">
          <div 
            className="absolute inset-0 bg-cover bg-center"
            style={{
              backgroundImage: 'linear-gradient(rgba(0,0,0,0.7), rgba(0,0,0,0.7)), url(/IMG_0111.jpeg)',
            }}
          />
          <div className="absolute inset-0 bg-gradient-to-br from-orange-900/20 to-black/60" />
          <div className="w-full max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-6 text-center">
              <div className="space-y-2">
                <div className="text-2xl sm:text-3xl font-bold text-orange-400">&lt; 24hrs</div>
                <div className="text-gray-300 text-sm">Average Response Time</div>
              </div>
              <div className="space-y-2">
                <div className="text-2xl sm:text-3xl font-bold text-orange-400">98%</div>
                <div className="text-gray-300 text-sm">Customer Satisfaction</div>
              </div>
              <div className="space-y-2">
                <div className="text-2xl sm:text-3xl font-bold text-orange-400">24/7</div>
                <div className="text-gray-300 text-sm">Emergency Support</div>
              </div>
            </div>
          </div>
        </section>
      </main>

      <Footer />
    </div>
  );
};

export default ContactUs;
