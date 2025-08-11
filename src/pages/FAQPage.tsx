
import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { ArrowLeft, HelpCircle, ChevronDown, ChevronUp } from 'lucide-react';
import Header from '@/components/Header';
import Footer from '@/components/Footer';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';

const FAQPage = () => {
  const [openItems, setOpenItems] = useState<number[]>([]);

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
          <div className="flex items-center justify-center space-x-2 mb-4">
            <HelpCircle className="w-8 h-8 text-blue-400" />
            <h1 className="text-3xl md:text-4xl font-bold">Frequently Asked Questions</h1>
          </div>
          <p className="text-muted-foreground max-w-2xl mx-auto">
            Find answers to common questions about HubX. Can't find what you're looking for? Contact our support team.
          </p>
        </div>

        {/* FAQ Sections */}
        <div className="max-w-4xl mx-auto space-y-6">
          {faqs.map((section, sectionIndex) => (
            <div key={sectionIndex} className="space-y-4">
              <h2 className="text-2xl font-bold text-orange-500 border-b border-border pb-2">
                {section.category}
              </h2>
              
              <div className="space-y-3">
                {section.questions.map((faq, questionIndex) => {
                  const itemIndex = sectionIndex * 100 + questionIndex;
                  const isOpen = openItems.includes(itemIndex);
                  
                  return (
                    <Card key={questionIndex} className="border-gray-800">
                      <CardContent className="p-0">
                        <Button
                          variant="ghost"
                          className="w-full p-4 justify-between text-left h-auto hover:bg-gray-800/50"
                          onClick={() => toggleItem(itemIndex)}
                        >
                          <span className="font-medium">{faq.q}</span>
                          {isOpen ? (
                            <ChevronUp className="w-5 h-5 text-gray-400" />
                          ) : (
                            <ChevronDown className="w-5 h-5 text-gray-400" />
                          )}
                        </Button>
                        
                        {isOpen && (
                          <div className="px-4 pb-4">
                            <p className="text-muted-foreground leading-relaxed">
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

        {/* Contact CTA */}
        <div className="text-center space-y-4 mt-12">
          <h3 className="text-xl font-semibold">Still have questions?</h3>
          <p className="text-muted-foreground">
            Our support team is here to help you with any questions or concerns.
          </p>
          <Link to="/contact">
            <Button className="bg-blue-600 hover:bg-blue-700">
              Contact Support
            </Button>
          </Link>
        </div>
      </main>

      <Footer />
    </div>
  );
};

export default FAQPage;
