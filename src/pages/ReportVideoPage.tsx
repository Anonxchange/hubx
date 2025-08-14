
import React, { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ArrowLeft, Flag } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { toast } from 'sonner';
import Header from '@/components/Header';
import Footer from '@/components/Footer';

const ReportVideoPage = () => {
  const { videoId } = useParams();
  const navigate = useNavigate();
  const [selectedReason, setSelectedReason] = useState('');
  const [additionalDetails, setAdditionalDetails] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const reportReasons = [
    {
      value: 'legal',
      label: 'Infringes My Rights or Other Legal Concern',
      description: 'Content that violates intellectual property or other legal rights'
    },
    {
      value: 'copyright',
      label: 'Copyright Concern',
      description: 'Content that uses copyrighted material without permission'
    },
    {
      value: 'minor',
      label: 'Potentially Features a Minor',
      description: 'Content that may feature underage individuals'
    },
    {
      value: 'violence',
      label: 'Violent or Harmful Acts',
      description: 'Content showing violence or harmful behavior'
    },
    {
      value: 'hate',
      label: 'Hateful or Inflammatory',
      description: 'Content that promotes hate speech or inflammatory content'
    },
    {
      value: 'spam',
      label: 'Spam or Misleading Content',
      description: 'Content that is spam or contains misleading information'
    },
    {
      value: 'inappropriate',
      label: 'Otherwise Inappropriate or Objectionable',
      description: 'Content that is inappropriate for other reasons'
    }
  ];

  const handleSubmit = async () => {
    if (!selectedReason) {
      toast.error('Please select a reason for reporting');
      return;
    }

    setIsSubmitting(true);

    try {
      const reportData = {
        videoId: videoId || '',
        reason: reportReasons.find(r => r.value === selectedReason)?.label || '',
        details: additionalDetails,
        timestamp: new Date().toISOString(),
        userAgent: navigator.userAgent,
        url: window.location.origin + `/video/${videoId}`
      };

      // Import and use the report service
      const { submitReport } = await import('@/services/reportService');
      await submitReport(reportData);
      
      toast.success('Report submitted successfully. Thank you for helping keep our platform safe.');
      navigate(-1); // Go back to previous page
    } catch (error) {
      console.error('Report submission error:', error);
      toast.error('Failed to submit report. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-background">
      <Header />
      
      <main className="container mx-auto px-4 py-8 max-w-2xl">
        {/* Back Button */}
        <Button
          variant="ghost"
          onClick={() => navigate(-1)}
          className="mb-6"
        >
          <ArrowLeft className="w-4 h-4 mr-2" />
          Back
        </Button>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <Flag className="w-5 h-5" />
              <span>Report this video</span>
            </CardTitle>
            <p className="text-sm text-muted-foreground">
              By reporting content that you think is inappropriate, you are helping to protect the 
              HubX community as well as the integrity of our platform. Thank you! Reporting content is 
              anonymous, so users cannot tell who made the report. Tell us why you would like to report this content:
            </p>
          </CardHeader>
          
          <CardContent className="space-y-6">
            <RadioGroup value={selectedReason} onValueChange={setSelectedReason}>
              {reportReasons.map((reason) => (
                <div key={reason.value} className="flex items-start space-x-2">
                  <RadioGroupItem value={reason.value} id={reason.value} className="mt-1" />
                  <div className="space-y-1">
                    <Label htmlFor={reason.value} className="text-sm font-medium cursor-pointer">
                      {reason.label}
                    </Label>
                    <p className="text-xs text-muted-foreground">
                      {reason.description}
                    </p>
                  </div>
                </div>
              ))}
            </RadioGroup>

            <div className="space-y-2">
              <Label htmlFor="details">Additional Details (Optional)</Label>
              <Textarea
                id="details"
                value={additionalDetails}
                onChange={(e) => setAdditionalDetails(e.target.value)}
                placeholder="Provide any additional information that might help us understand your report..."
                className="min-h-24"
              />
            </div>

            <div className="flex space-x-3">
              <Button
                variant="outline"
                onClick={() => navigate(-1)}
                className="flex-1"
              >
                Cancel
              </Button>
              <Button
                onClick={handleSubmit}
                disabled={isSubmitting || !selectedReason}
                className="flex-1"
              >
                {isSubmitting ? 'Submitting...' : 'Submit Report'}
              </Button>
            </div>

            <p className="text-xs text-muted-foreground mt-4">
              HubX is a user-driven platform, whose objective is to provide a safe space for content creation and consumption.
            </p>
          </CardContent>
        </Card>
      </main>

      <Footer />
    </div>
  );
};

export default ReportVideoPage;
