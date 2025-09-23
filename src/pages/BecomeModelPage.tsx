
import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { ArrowLeft, DollarSign, TrendingUp, Users, Headphones, Shield, Check, ChevronDown, ChevronUp, Gift, Play } from 'lucide-react';
import Header from '@/components/Header';
import Footer from '@/components/Footer';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';

const BecomeModelPage = () => {
  const [openFaq, setOpenFaq] = useState<string | null>(null);

  const faqItems = [
    {
      id: 'money',
      question: 'How much money will I make with tips?',
      answer: 'Tip earnings depend on your audience engagement and content quality. Top performers earn $5,000-$20,000+ monthly in tips alone, with an average of $1,500-$3,000 for active creators.'
    },
    {
      id: 'earnings',
      question: 'How are tip earnings calculated?',
      answer: 'You receive 85% of all tips received. Premium subscription earnings are split 70% to you, 30% platform fee. All earnings are calculated in real-time and visible in your dashboard.'
    },
    {
      id: 'payment',
      question: 'How often do we get paid?',
      answer: 'Tips and premium earnings are paid weekly every Friday. Minimum payout threshold is $50. Express daily payouts available for premium members.'
    },
    {
      id: 'verification',
      question: 'How do I set up premium subscriptions?',
      answer: 'After verification, you can create subscription tiers ($9.99-$49.99/month) with exclusive content. Set up custom rewards and perks for each tier through your creator dashboard.'
    },
    {
      id: 'earnings-tab',
      question: 'How do I track my tip and premium earnings?',
      answer: 'Your earnings dashboard shows real-time tip income, subscription revenue, top tippers, and detailed analytics. Export reports for tax purposes anytime.'
    }
  ];

  return (
    <div className="min-h-screen bg-black">
      <Header />
      
      <main className="relative overflow-hidden">
        {/* Back Button */}
        <div className="container mx-auto px-4 pt-4">
          <Link to="/" className="inline-flex items-center text-gray-300 hover:text-white transition-colors" data-testid="link-home">
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back to Home
          </Link>
        </div>

        {/* Hero Section */}
        <section className="relative py-16 px-4">
          <div 
            className="absolute inset-0 bg-cover bg-center"
            style={{
              backgroundImage: 'linear-gradient(rgba(0,0,0,0.4), rgba(0,0,0,0.4)), url(/IMG_0088.jpeg)',
            }}
          />
          
          <div className="relative z-10 container mx-auto text-center">
            <h1 className="text-4xl md:text-6xl font-bold text-white leading-tight mb-6">
              MAXIMIZE<br />
              YOUR TIPS &<br />
              PREMIUM EARNINGS
            </h1>
            
            <p className="text-gray-300 text-lg mb-8 max-w-2xl mx-auto">
              Unlock the full earning potential with our premium features and tipping system. Build deeper connections with your audience and earn more through exclusive content.
            </p>
            
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Button 
                variant="secondary" 
                size="lg" 
                className="bg-gray-600 hover:bg-gray-700 text-white px-8 py-3"
                data-testid="button-learn-more"
              >
                Learn More
              </Button>
              <Link to="/auth">
                <Button 
                  size="lg" 
                  className="bg-purple-600 hover:bg-purple-700 text-white px-8 py-3 font-semibold"
                  data-testid="button-start-earning"
                >
                  Start Earning
                </Button>
              </Link>
            </div>
          </div>
        </section>

        {/* Premium Earning Features */}
        <section className="py-16 px-4">
          <div className="container mx-auto text-center">
            <h2 className="text-3xl md:text-4xl font-bold text-white mb-4">Premium Earning</h2>
            <h3 className="text-3xl md:text-4xl font-bold text-white mb-12">Features</h3>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-12 max-w-4xl mx-auto">
              <div className="text-center space-y-4">
                <div className="w-20 h-20 mx-auto bg-purple-600 rounded-full flex items-center justify-center">
                  <DollarSign className="w-10 h-10 text-white" />
                </div>
                <h4 className="text-xl font-bold text-white">Live Tips</h4>
                <p className="text-gray-300">
                  Receive real-time tips from viewers during live streams and interactions
                </p>
              </div>
              
              <div className="text-center space-y-4">
                <div className="w-20 h-20 mx-auto bg-purple-600 rounded-full flex items-center justify-center">
                  <Gift className="w-10 h-10 text-white" />
                </div>
                <h4 className="text-xl font-bold text-white">Premium Subscriptions</h4>
                <p className="text-gray-300">
                  Monetize exclusive content through monthly subscription tiers
                </p>
              </div>
            </div>
          </div>
        </section>

        {/* Premium Tools */}
        <section className="py-16 px-4">
          <div 
            className="relative bg-cover bg-center"
            style={{
              backgroundImage: 'linear-gradient(rgba(0,0,0,0.5), rgba(0,0,0,0.5)), url(/IMG_0095.jpeg)',
            }}
          >
            <div className="container mx-auto text-center py-16">
              <h2 className="text-3xl md:text-4xl font-bold text-white mb-4">Premium Tools To</h2>
              <h3 className="text-3xl md:text-4xl font-bold text-white mb-12">
                Maximize Your <span className="border-b-4 border-purple-600">Earnings</span>
              </h3>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-12 max-w-4xl mx-auto">
                <div className="text-center space-y-4">
                  <div className="w-20 h-20 mx-auto bg-purple-600 rounded-full flex items-center justify-center">
                    <TrendingUp className="w-10 h-10 text-white" />
                  </div>
                  <h4 className="text-xl font-bold text-white">Smart Tip Goals</h4>
                  <p className="text-gray-300">
                    Set up interactive tip goals and rewards to encourage higher contributions from your audience
                  </p>
                </div>
                
                <div className="text-center space-y-4">
                  <div className="w-20 h-20 mx-auto bg-purple-600 rounded-full flex items-center justify-center">
                    <Play className="w-10 h-10 text-white" />
                  </div>
                  <h4 className="text-xl font-bold text-white">Exclusive Content Hub</h4>
                  <p className="text-gray-300">
                    Create premium content tiers with different subscription levels and exclusive access
                  </p>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Premium Support */}
        <section className="py-16 px-4">
          <div className="container mx-auto text-center">
            <h2 className="text-3xl md:text-4xl font-bold text-white mb-4">Premium Earning</h2>
            <h3 className="text-3xl md:text-4xl font-bold text-white mb-12">
              <span className="border-b-4 border-purple-600">Support</span>
            </h3>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-12 max-w-4xl mx-auto">
              <div className="text-center space-y-4">
                <div className="w-20 h-20 mx-auto bg-purple-600 rounded-full flex items-center justify-center">
                  <Headphones className="w-10 h-10 text-white" />
                </div>
                <h4 className="text-xl font-bold text-white">24/7 Payment Support</h4>
                <p className="text-gray-300">
                  Get instant help with tips, subscriptions, and payment processing
                </p>
              </div>
              
              <div className="text-center space-y-4">
                <div className="w-20 h-20 mx-auto bg-purple-600 rounded-full flex items-center justify-center">
                  <Shield className="w-10 h-10 text-white" />
                </div>
                <h4 className="text-xl font-bold text-white">Secure Transactions</h4>
                <p className="text-gray-300">
                  Bank-level security for all your premium earnings and tip transactions
                </p>
              </div>
            </div>
          </div>
        </section>

        {/* Testimonial */}
        <section className="py-16 px-4">
          <div className="container mx-auto text-center">
            <h2 className="text-3xl md:text-4xl font-bold text-white mb-12">
              Don't just take our word for it:
            </h2>
            
            <Card className="max-w-2xl mx-auto bg-gray-800 border-gray-700">
              <CardContent className="p-8">
                <p className="text-gray-300 mb-6 leading-relaxed">
                  "The premium features and tipping system transformed my earnings! The tip goals and exclusive content subscriptions helped me triple my monthly income. The platform makes it so easy to connect with my audience and monetize my content effectively. Thank you HubX for creating such amazing earning opportunities!"
                </p>
                
                <div className="flex items-center justify-center space-x-4">
                  <div className="w-16 h-16 rounded-full overflow-hidden border-2 border-purple-600">
                    <img 
                      src="/IMG_0096.jpeg" 
                      alt="Sara Premium" 
                      className="w-full h-full object-cover"
                    />
                  </div>
                  <div className="text-left">
                    <h4 className="text-white font-bold text-lg">SARA PREMIUM</h4>
                    <p className="text-gray-400">$15K monthly tips | 50K premium subscribers</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </section>

        {/* FAQ Section */}
        <section className="py-16 px-4">
          <div className="container mx-auto max-w-4xl">
            <h2 className="text-3xl md:text-4xl font-bold text-white text-center mb-12">
              Got Questions?
            </h2>
            
            <div className="space-y-4">
              {faqItems.map((item) => (
                <Collapsible 
                  key={item.id} 
                  open={openFaq === item.id} 
                  onOpenChange={() => setOpenFaq(openFaq === item.id ? null : item.id)}
                >
                  <CollapsibleTrigger 
                    className="w-full flex items-center justify-between py-4 text-left text-white hover:text-purple-400 transition-colors border-b border-gray-700"
                    data-testid={`faq-trigger-${item.id}`}
                  >
                    <span className="text-lg font-medium">{item.question}</span>
                    {openFaq === item.id ? (
                      <ChevronUp className="w-5 h-5" />
                    ) : (
                      <ChevronDown className="w-5 h-5" />
                    )}
                  </CollapsibleTrigger>
                  <CollapsibleContent 
                    className="py-4 text-gray-300 leading-relaxed"
                    data-testid={`faq-content-${item.id}`}
                  >
                    {item.answer}
                  </CollapsibleContent>
                </Collapsible>
              ))}
            </div>
            
            <div className="text-center mt-8">
              <Link 
                to="/faq" 
                className="text-purple-400 hover:text-purple-300 font-semibold"
                data-testid="link-browse-faqs"
              >
                Browse our FAQs
              </Link>
            </div>
          </div>
        </section>

        {/* Simple Steps */}
        <section className="py-16 px-4">
          <div className="container mx-auto text-center max-w-4xl">
            <h2 className="text-3xl md:text-4xl font-bold text-white mb-4">
              Start earning premium tips today
            </h2>
            <p className="text-gray-400 text-lg mb-12">Just 3 Simple Steps</p>
            
            <div className="space-y-8">
              <div className="flex items-center space-x-6 text-left">
                <div className="flex-shrink-0 w-12 h-12 bg-purple-600 rounded-full flex items-center justify-center">
                  <span className="text-white font-bold text-xl">1</span>
                </div>
                <div className="flex items-center space-x-4">
                  <Check className="w-6 h-6 text-green-500" />
                  <span className="text-white text-xl">Create a free HubX account</span>
                </div>
              </div>
              
              <div className="flex items-center space-x-6 text-left">
                <div className="flex-shrink-0 w-12 h-12 bg-purple-600 rounded-full flex items-center justify-center">
                  <span className="text-white font-bold text-xl">2</span>
                </div>
                <div className="flex items-center space-x-4">
                  <Check className="w-6 h-6 text-green-500" />
                  <span className="text-white text-xl">Enable premium features</span>
                </div>
              </div>
              
              <div className="flex items-center space-x-6 text-left">
                <div className="flex-shrink-0 w-12 h-12 bg-purple-600 rounded-full flex items-center justify-center">
                  <span className="text-white font-bold text-xl">3</span>
                </div>
                <div className="flex items-center space-x-4">
                  <span className="text-white text-xl">Start receiving tips</span>
                </div>
              </div>
            </div>
            
            <div className="mt-12">
              <Link to="/auth">
                <Button 
                  size="lg" 
                  className="bg-purple-600 hover:bg-purple-700 text-white px-12 py-4 text-lg font-semibold"
                  data-testid="button-start-earning"
                >
                  Start Earning
                </Button>
              </Link>
            </div>
          </div>
        </section>
      </main>

      <Footer />
    </div>
  );
};

export default BecomeModelPage;
