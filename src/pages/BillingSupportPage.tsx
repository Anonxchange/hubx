import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { ArrowLeft, CreditCard, DollarSign, Shield, Clock, AlertCircle, HelpCircle, CheckCircle, Phone, Mail } from 'lucide-react';
import Header from '@/components/Header';
import Footer from '@/components/Footer';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';

const BillingSupportPage = () => {
  const [activeTab, setActiveTab] = useState('common');

  const commonIssues = [
    {
      question: "Why was my card declined?",
      answer: "Card declines can happen for several reasons: insufficient funds, expired card, incorrect billing details, or your bank blocking the transaction. Try using a different payment method or contact your bank.",
      category: "payment"
    },
    {
      question: "How do I cancel my subscription?",
      answer: "Go to your Profile > Subscription Settings and click 'Cancel Subscription'. Your access will continue until the end of your billing period.",
      category: "subscription"
    },
    {
      question: "When will I be charged?",
      answer: "Subscriptions are billed monthly on the same date you first subscribed. You'll receive an email confirmation for each payment.",
      category: "billing"
    },
    {
      question: "How do I get a refund?",
      answer: "Refunds are available within 30 days for annual subscriptions or 7 days for monthly subscriptions. Contact support with your order details.",
      category: "refund"
    },
    {
      question: "Can I change my payment method?",
      answer: "Yes! Go to Profile > Payment Methods to add, remove, or update your payment information at any time.",
      category: "payment"
    }
  ];

  const paymentMethods = [
    {
      name: "Credit & Debit Cards",
      description: "Visa, Mastercard, American Express, Discover",
      icon: CreditCard,
      availability: "Worldwide",
      processing: "Instant"
    },
    {
      name: "PayPal",
      description: "Secure payments through your PayPal account",
      icon: Shield,
      availability: "200+ countries",
      processing: "Instant"
    },
    {
      name: "Cryptocurrency",
      description: "Bitcoin, Ethereum, and other major cryptocurrencies",
      icon: DollarSign,
      availability: "Worldwide",
      processing: "5-15 minutes"
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
          <h1 className="text-4xl md:text-5xl font-bold">Billing Support</h1>
          <p className="text-xl text-muted-foreground max-w-3xl mx-auto">
            Get help with payments, subscriptions, and billing questions
          </p>
        </div>

        {/* Quick Actions */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <Card className="border-blue-500/20 bg-gradient-to-br from-blue-50/5 to-blue-100/5 cursor-pointer hover:shadow-md transition-shadow">
            <CardContent className="p-6 text-center space-y-3">
              <div className="w-12 h-12 bg-blue-500 rounded-full flex items-center justify-center mx-auto">
                <CreditCard className="w-6 h-6 text-white" />
              </div>
              <h3 className="font-semibold">Payment Issues</h3>
              <p className="text-sm text-muted-foreground">Card declined, payment failed, or billing problems</p>
            </CardContent>
          </Card>

          <Card className="border-purple-500/20 bg-gradient-to-br from-purple-50/5 to-purple-100/5 cursor-pointer hover:shadow-md transition-shadow">
            <CardContent className="p-6 text-center space-y-3">
              <div className="w-12 h-12 bg-purple-500 rounded-full flex items-center justify-center mx-auto">
                <DollarSign className="w-6 h-6 text-white" />
              </div>
              <h3 className="font-semibold">Refund Request</h3>
              <p className="text-sm text-muted-foreground">Request a refund for your subscription or purchase</p>
            </CardContent>
          </Card>

          <Card className="border-green-500/20 bg-gradient-to-br from-green-50/5 to-green-100/5 cursor-pointer hover:shadow-md transition-shadow">
            <CardContent className="p-6 text-center space-y-3">
              <div className="w-12 h-12 bg-green-500 rounded-full flex items-center justify-center mx-auto">
                <Shield className="w-6 h-6 text-white" />
              </div>
              <h3 className="font-semibold">Account Security</h3>
              <p className="text-sm text-muted-foreground">Suspicious charges or unauthorized transactions</p>
            </CardContent>
          </Card>
        </div>

        {/* Main Content Tabs */}
        <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
          <TabsList className="grid w-full grid-cols-4">
            <TabsTrigger value="common">Common Issues</TabsTrigger>
            <TabsTrigger value="payments">Payment Methods</TabsTrigger>
            <TabsTrigger value="subscriptions">Subscriptions</TabsTrigger>
            <TabsTrigger value="contact">Contact Us</TabsTrigger>
          </TabsList>

          <TabsContent value="common" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center space-x-2">
                  <HelpCircle className="w-5 h-5 text-blue-400" />
                  <span>Frequently Asked Questions</span>
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {commonIssues.map((issue, index) => (
                  <div key={index} className="border-b border-gray-200 dark:border-gray-800 pb-4 last:border-b-0">
                    <h3 className="font-semibold mb-2 flex items-center space-x-2">
                      <Badge variant="outline" className="text-xs">
                        {issue.category}
                      </Badge>
                      <span>{issue.question}</span>
                    </h3>
                    <p className="text-muted-foreground text-sm">{issue.answer}</p>
                  </div>
                ))}
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="payments" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center space-x-2">
                  <CreditCard className="w-5 h-5 text-green-400" />
                  <span>Accepted Payment Methods</span>
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-6">
                {paymentMethods.map((method, index) => (
                  <div key={index} className="flex items-start space-x-4 p-4 border rounded-lg">
                    <div className="w-12 h-12 bg-gray-100 dark:bg-gray-800 rounded-full flex items-center justify-center">
                      <method.icon className="w-6 h-6 text-gray-600 dark:text-gray-400" />
                    </div>
                    <div className="flex-1">
                      <h3 className="font-semibold mb-1">{method.name}</h3>
                      <p className="text-sm text-muted-foreground mb-2">{method.description}</p>
                      <div className="flex items-center space-x-4 text-xs">
                        <span className="flex items-center space-x-1">
                          <CheckCircle className="w-3 h-3 text-green-500" />
                          <span>{method.availability}</span>
                        </span>
                        <span className="flex items-center space-x-1">
                          <Clock className="w-3 h-3 text-blue-500" />
                          <span>{method.processing}</span>
                        </span>
                      </div>
                    </div>
                  </div>
                ))}
                <div className="bg-yellow-50 dark:bg-yellow-950/20 p-4 rounded-lg">
                  <div className="flex items-start space-x-2">
                    <AlertCircle className="w-5 h-5 text-yellow-500 mt-0.5" />
                    <div>
                      <h4 className="font-semibold text-yellow-700 dark:text-yellow-300">Security Notice</h4>
                      <p className="text-sm text-yellow-600 dark:text-yellow-400">
                        All payments are processed through secure, encrypted channels. We never store your full payment information.
                      </p>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="subscriptions" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center space-x-2">
                  <DollarSign className="w-5 h-5 text-purple-400" />
                  <span>Subscription Management</span>
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-4">
                    <h3 className="font-semibold">Subscription Plans</h3>
                    <div className="space-y-3">
                      <div className="p-3 border rounded-lg">
                        <div className="flex justify-between items-center mb-2">
                          <span className="font-medium">Premium Monthly</span>
                          <Badge>$19.99/month</Badge>
                        </div>
                        <p className="text-sm text-muted-foreground">Full access to all premium content</p>
                      </div>
                      <div className="p-3 border rounded-lg">
                        <div className="flex justify-between items-center mb-2">
                          <span className="font-medium">Premium Annual</span>
                          <Badge>$199.99/year</Badge>
                        </div>
                        <p className="text-sm text-muted-foreground">Save 17% with annual billing</p>
                      </div>
                    </div>
                  </div>
                  <div className="space-y-4">
                    <h3 className="font-semibold">Billing Information</h3>
                    <ul className="space-y-2 text-sm text-muted-foreground">
                      <li>• Billing occurs on the same date each month</li>
                      <li>• Failed payments retry automatically for 3 days</li>
                      <li>• You'll receive email receipts for all payments</li>
                      <li>• Cancellation takes effect at period end</li>
                      <li>• No refunds for partial months</li>
                    </ul>
                  </div>
                </div>
                <div className="bg-blue-50 dark:bg-blue-950/20 p-4 rounded-lg">
                  <h4 className="font-semibold text-blue-700 dark:text-blue-300 mb-2">Need to Update Your Subscription?</h4>
                  <p className="text-sm text-blue-600 dark:text-blue-400 mb-3">
                    You can upgrade, downgrade, or cancel your subscription at any time from your profile settings.
                  </p>
                  <Link to="/profile">
                    <Button size="sm" className="bg-blue-600 hover:bg-blue-700 text-white">
                      Manage Subscription
                    </Button>
                  </Link>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="contact" className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center space-x-2">
                    <Mail className="w-5 h-5 text-blue-400" />
                    <span>Email Support</span>
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <p className="text-muted-foreground">
                    For billing issues, refund requests, or account problems, email our support team.
                  </p>
                  <div className="space-y-3">
                    <div>
                      <h4 className="font-semibold">General Billing</h4>
                      <p className="text-sm text-blue-600">billing@hubx.com</p>
                    </div>
                    <div>
                      <h4 className="font-semibold">Refund Requests</h4>
                      <p className="text-sm text-blue-600">refunds@hubx.com</p>
                    </div>
                    <div>
                      <h4 className="font-semibold">Account Security</h4>
                      <p className="text-sm text-blue-600">security@hubx.com</p>
                    </div>
                  </div>
                  <div className="flex items-center space-x-2 text-sm">
                    <Clock className="w-4 h-4 text-green-500" />
                    <span>Response time: 24-48 hours</span>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center space-x-2">
                    <Phone className="w-5 h-5 text-green-400" />
                    <span>Live Chat Support</span>
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <p className="text-muted-foreground">
                    Get instant help with urgent billing issues through our live chat support.
                  </p>
                  <div className="space-y-3">
                    <div>
                      <h4 className="font-semibold">Business Hours</h4>
                      <p className="text-sm text-muted-foreground">Monday - Friday: 9 AM - 6 PM PST</p>
                      <p className="text-sm text-muted-foreground">Saturday - Sunday: 10 AM - 4 PM PST</p>
                    </div>
                    <div>
                      <h4 className="font-semibold">Average Wait Time</h4>
                      <p className="text-sm text-green-600">Less than 5 minutes</p>
                    </div>
                  </div>
                  <Button className="w-full bg-green-600 hover:bg-green-700 text-white">
                    Start Live Chat
                  </Button>
                </CardContent>
              </Card>
            </div>

            <Card className="bg-red-50 dark:bg-red-950/20 border-red-200 dark:border-red-800">
              <CardContent className="p-6">
                <div className="flex items-start space-x-3">
                  <AlertCircle className="w-6 h-6 text-red-500 mt-1" />
                  <div>
                    <h3 className="font-semibold text-red-700 dark:text-red-300 mb-2">Suspicious Activity?</h3>
                    <p className="text-sm text-red-600 dark:text-red-400 mb-3">
                      If you notice unauthorized charges or suspicious activity on your account, contact us immediately.
                    </p>
                    <Button variant="destructive" size="sm">
                      Report Fraud
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </main>

      <Footer />
    </div>
  );
};

export default BillingSupportPage;