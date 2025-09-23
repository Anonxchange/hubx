
import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { ArrowLeft, Search, MessageCircle, Phone, Mail, ChevronDown, ChevronUp, Star } from 'lucide-react';
import Header from '@/components/Header';
import Footer from '@/components/Footer';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';

const FAQPage = () => {
  const [openItems, setOpenItems] = useState<number[]>([]);
  const [searchTerm, setSearchTerm] = useState('');

  const toggleItem = (index: number) => {
    setOpenItems(prev => 
      prev.includes(index) 
        ? prev.filter(i => i !== index)
        : [...prev, index]
    );
  };

  const faqs = [
    {
      category: "General",
      questions: [
        {
          q: "What is HubX?",
          a: "HubX is a premium adult content platform where creators can share content and earn revenue while viewers can enjoy high-quality videos and interact with their favorite creators."
        },
        {
          q: "Is HubX free to use?",
          a: "Yes, HubX is free to browse and watch most content. However, some premium content requires a subscription or individual purchase."
        },
        {
          q: "How do I create an account?",
          a: "Click the 'Sign Up' button in the top right corner, choose between User or Creator account, and follow the registration process."
        }
      ]
    },
    {
      category: "Content Creation",
      questions: [
        {
          q: "How do I become a creator?",
          a: "When signing up, select 'Creator' as your account type. You'll need to verify your age and identity before you can start uploading content."
        },
        {
          q: "What content can I upload?",
          a: "You can upload videos, photos, and GIFs. All content must comply with our community guidelines and feature only consenting adults 18+."
        },
        {
          q: "How much can I earn as a creator?",
          a: "Creators earn up to 70% of revenue from their content views, tips, and subscriptions. Earnings vary based on content quality and audience engagement."
        }
      ]
    },
    {
      category: "Payment & Billing",
      questions: [
        {
          q: "What payment methods do you accept?",
          a: "We accept major credit cards, PayPal, and cryptocurrency. All payments are processed securely through encrypted channels."
        },
        {
          q: "How often are creators paid?",
          a: "Creators are paid weekly, provided they meet the minimum payout threshold of $50. Payments are processed every Friday."
        },
        {
          q: "Can I cancel my subscription anytime?",
          a: "Yes, you can cancel your subscription at any time from your account settings. You'll continue to have access until the end of your billing period."
        }
      ]
    },
    {
      category: "Safety & Privacy",
      questions: [
        {
          q: "How do you verify age?",
          a: "All users must be 18+ and creators must provide government-issued photo ID for age verification before uploading content."
        },
        {
          q: "Is my personal information secure?",
          a: "Yes, we use industry-standard encryption and security measures to protect your personal information and payment details."
        },
        {
          q: "How do you handle copyright issues?",
          a: "We have a strict DMCA policy and respond quickly to legitimate copyright claims. Users found uploading copyrighted content will have their accounts suspended."
        }
      ]
    }
  ];

  const filteredFaqs = faqs.map(section => ({
    ...section,
    questions: section.questions.filter(q => 
      q.q.toLowerCase().includes(searchTerm.toLowerCase()) ||
      q.a.toLowerCase().includes(searchTerm.toLowerCase())
    )
  })).filter(section => section.questions.length > 0);

  return (
    <div className="min-h-screen bg-black">
      <Header />
      
      <main className="relative">
        {/* Hero Section */}
        <section className="relative py-12 sm:py-16 lg:py-20 overflow-hidden">
          <div 
            className="absolute inset-0 bg-cover bg-center"
            style={{
              backgroundImage: 'linear-gradient(rgba(0,0,0,0.6), rgba(0,0,0,0.6)), url(/IMG_0110.jpeg)',
            }}
          />
          <div className="absolute inset-0 bg-gradient-to-br from-purple-900/30 to-black/50" />
          <div className="w-full max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center space-y-6 relative z-10">
            <Link to="/" className="inline-flex items-center text-gray-300 hover:text-white transition-colors mb-6" data-testid="link-home">
              <ArrowLeft className="w-4 h-4 mr-2" />
              Back to Home
            </Link>
            
            <div className="space-y-4">
              <Badge className="bg-purple-600/20 text-purple-300 border-purple-600/30 px-4 py-1">
                Help Center
              </Badge>
              <h1 className="text-2xl sm:text-3xl md:text-4xl lg:text-5xl font-bold text-white leading-tight">
                Frequently Asked Questions
              </h1>
              <p className="text-gray-300 text-sm sm:text-base md:text-lg max-w-2xl mx-auto">
                Find answers to common questions about HubX. Our comprehensive FAQ covers everything from getting started to advanced features.
              </p>
            </div>

            {/* Search Bar */}
            <div className="relative max-w-md mx-auto mt-8">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4 sm:w-5 sm:h-5" />
              <Input
                type="text"
                placeholder="Search questions..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-8 sm:pl-10 bg-gray-800/50 border-gray-700 text-white placeholder-gray-400 w-full text-sm sm:text-base"
                data-testid="input-search"
              />
            </div>
          </div>
        </section>

        {/* Stats Section */}
        <section className="py-8 sm:py-12 border-b border-gray-800">
          <div className="w-full max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-6 md:gap-8 text-center">
              <div className="space-y-2">
                <div className="text-2xl sm:text-3xl font-bold text-purple-400">50+</div>
                <div className="text-gray-300 text-sm sm:text-base">Common Questions</div>
              </div>
              <div className="space-y-2">
                <div className="text-2xl sm:text-3xl font-bold text-purple-400">24/7</div>
                <div className="text-gray-300 text-sm sm:text-base">Support Available</div>
              </div>
              <div className="space-y-2">
                <div className="text-2xl sm:text-3xl font-bold text-purple-400">95%</div>
                <div className="text-gray-300 text-sm sm:text-base">Questions Resolved</div>
              </div>
            </div>
          </div>
        </section>

        {/* FAQ Content */}
        <section className="py-12 sm:py-16">
          <div className="w-full max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
            {filteredFaqs.length === 0 ? (
              <div className="text-center py-12">
                <div className="text-gray-400 text-base sm:text-lg">No questions found matching your search.</div>
                <Button 
                  onClick={() => setSearchTerm('')}
                  variant="ghost" 
                  className="mt-4 text-purple-400 hover:text-purple-300"
                  data-testid="button-clear-search"
                >
                  Clear search
                </Button>
              </div>
            ) : (
              <div className="space-y-6 sm:space-y-8">
                {filteredFaqs.map((section, sectionIndex) => (
                  <div key={sectionIndex} className="space-y-4">
                    <div className="flex flex-col sm:flex-row sm:items-center space-y-2 sm:space-y-0 sm:space-x-3 mb-4 sm:mb-6">
                      <div className="flex items-center space-x-3">
                        <div className="w-6 h-6 sm:w-8 sm:h-8 bg-purple-600 rounded-lg flex items-center justify-center flex-shrink-0">
                          <Star className="w-3 h-3 sm:w-4 sm:h-4 text-white" />
                        </div>
                        <h2 className="text-lg sm:text-xl lg:text-2xl font-bold text-white">
                          {section.category}
                        </h2>
                      </div>
                      <Badge variant="secondary" className="bg-gray-800 text-gray-300 w-fit text-xs sm:text-sm">
                        {section.questions.length} questions
                      </Badge>
                    </div>
                    
                    <div className="space-y-3">
                      {section.questions.map((faq, questionIndex) => {
                        const itemIndex = sectionIndex * 100 + questionIndex;
                        const isOpen = openItems.includes(itemIndex);
                        
                        return (
                          <Card key={questionIndex} className="bg-gray-900/50 border-gray-700 hover:border-purple-600/50 transition-colors w-full">
                            <CardContent className="p-0">
                              <Button
                                variant="ghost"
                                className="w-full p-3 sm:p-4 lg:p-6 justify-between text-left h-auto hover:bg-gray-800/50 rounded-lg"
                                onClick={() => toggleItem(itemIndex)}
                                data-testid={`faq-question-${sectionIndex}-${questionIndex}`}
                              >
                                <span className="font-medium text-white text-sm sm:text-base lg:text-lg pr-2 sm:pr-4 leading-relaxed break-words min-w-0 flex-1">{faq.q}</span>
                                <div className="flex-shrink-0 ml-2">
                                  {isOpen ? (
                                    <ChevronUp className="w-4 h-4 sm:w-5 sm:h-5 text-purple-400" />
                                  ) : (
                                    <ChevronDown className="w-4 h-4 sm:w-5 sm:h-5 text-purple-400" />
                                  )}
                                </div>
                              </Button>
                              
                              {isOpen && (
                                <div className="px-3 sm:px-4 lg:px-6 pb-3 sm:pb-4 lg:pb-6 border-t border-gray-700 mt-3 sm:mt-4 pt-3 sm:pt-4">
                                  <p className="text-gray-300 leading-relaxed text-sm sm:text-base lg:text-lg break-words">
                                    {faq.a}
                                  </p>
                                </div>
                              )}
                            </CardContent>
                          </Card>
                        );
                      })}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </section>

        {/* Contact Support Section */}
        <section className="relative py-12 sm:py-16 overflow-hidden">
          <div 
            className="absolute inset-0 bg-cover bg-center"
            style={{
              backgroundImage: 'linear-gradient(rgba(0,0,0,0.7), rgba(0,0,0,0.7)), url(/IMG_0115.jpeg)',
            }}
          />
          <div className="absolute inset-0 bg-gradient-to-br from-purple-900/20 to-black/60" />
          <div className="w-full max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
            <div className="text-center mb-8 sm:mb-12">
              <h2 className="text-xl sm:text-2xl md:text-3xl lg:text-4xl font-bold text-white mb-4">
                Still need help?
              </h2>
              <p className="text-gray-300 text-sm sm:text-base md:text-lg max-w-2xl mx-auto">
                Our support team is available 24/7 to help you with any questions or concerns.
              </p>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6">
              <Card className="bg-gray-900/50 border-gray-700 hover:border-purple-600/50 transition-colors">
                <CardHeader className="text-center">
                  <div className="w-12 h-12 bg-purple-600 rounded-lg flex items-center justify-center mx-auto mb-4">
                    <MessageCircle className="w-6 h-6 text-white" />
                  </div>
                  <CardTitle className="text-white">Live Chat</CardTitle>
                </CardHeader>
                <CardContent className="text-center">
                  <p className="text-gray-300 mb-4">Chat with our support team in real-time</p>
                  <Button className="bg-purple-600 hover:bg-purple-700 w-full" data-testid="button-live-chat">
                    Start Chat
                  </Button>
                </CardContent>
              </Card>

              <Card className="bg-gray-900/50 border-gray-700 hover:border-purple-600/50 transition-colors">
                <CardHeader className="text-center">
                  <div className="w-12 h-12 bg-purple-600 rounded-lg flex items-center justify-center mx-auto mb-4">
                    <Mail className="w-6 h-6 text-white" />
                  </div>
                  <CardTitle className="text-white">Email Support</CardTitle>
                </CardHeader>
                <CardContent className="text-center">
                  <p className="text-gray-300 mb-4">Send us an email and we'll respond within 24 hours</p>
                  <Link to="/contact">
                    <Button variant="outline" className="border-purple-600 text-purple-400 hover:bg-purple-600 hover:text-white w-full" data-testid="button-email-support">
                      Send Email
                    </Button>
                  </Link>
                </CardContent>
              </Card>

              <Card className="bg-gray-900/50 border-gray-700 hover:border-purple-600/50 transition-colors">
                <CardHeader className="text-center">
                  <div className="w-12 h-12 bg-purple-600 rounded-lg flex items-center justify-center mx-auto mb-4">
                    <Phone className="w-6 h-6 text-white" />
                  </div>
                  <CardTitle className="text-white">Phone Support</CardTitle>
                </CardHeader>
                <CardContent className="text-center">
                  <p className="text-gray-300 mb-4">Call us for urgent issues (Premium members only)</p>
                  <Button variant="outline" className="border-purple-600 text-purple-400 hover:bg-purple-600 hover:text-white w-full" data-testid="button-phone-support">
                    Call Now
                  </Button>
                </CardContent>
              </Card>
            </div>
          </div>
        </section>
      </main>

      <Footer />
    </div>
  );
};

export default FAQPage;
