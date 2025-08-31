import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { ArrowLeft, Smartphone, Monitor, Headphones, Settings, Play, Eye, Star, AlertCircle } from 'lucide-react';
import Header from '@/components/Header';
import Footer from '@/components/Footer';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';

const VRGuide = () => {
  const [activeDevice, setActiveDevice] = useState('mobile');

  const vrHeadsets = [
    {
      name: 'Meta Quest 3',
      price: '$499',
      compatibility: 'Excellent',
      image: 'https://images.unsplash.com/photo-1617802690992-15d93263d3a9?w=300&h=200&fit=crop',
      features: ['Standalone VR', '4K+ Resolution', 'Hand Tracking', 'Wireless']
    },
    {
      name: 'Apple Vision Pro',
      price: '$3,499',
      compatibility: 'Premium',
      image: 'https://images.unsplash.com/photo-1593508512255-86ab42a8e620?w=300&h=200&fit=crop',
      features: ['Ultra HD', 'Eye Tracking', 'Spatial Audio', 'Premium Build']
    },
    {
      name: 'PlayStation VR2',
      price: '$549',
      compatibility: 'Great',
      image: 'https://images.unsplash.com/photo-1606144042614-b2417e99c4e3?w=300&h=200&fit=crop',
      features: ['PS5 Required', 'OLED Display', 'Haptic Feedback', 'Eye Tracking']
    },
    {
      name: 'Smartphone VR',
      price: '$20-100',
      compatibility: 'Good',
      image: 'https://images.unsplash.com/photo-1512941937669-90a1b58e7e9c?w=300&h=200&fit=crop',
      features: ['Budget Friendly', 'Uses Your Phone', 'Portable', 'Easy Setup']
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
            <div className="w-12 h-12 bg-gradient-to-r from-purple-500 to-blue-500 rounded-full flex items-center justify-center">
              <span className="text-white text-2xl">🥽</span>
            </div>
            <h1 className="text-4xl md:text-5xl font-bold">How to Watch VR</h1>
          </div>
          <p className="text-xl text-muted-foreground max-w-3xl mx-auto">
            Experience adult content like never before in immersive virtual reality
          </p>
          <Badge variant="secondary" className="text-lg px-4 py-2 bg-purple-600 text-white">
            <Eye className="w-4 h-4 mr-1" />
            360° Immersive Experience
          </Badge>
        </div>

        {/* Quick Start Guide */}
        <Card className="bg-gradient-to-r from-purple-600/10 to-blue-600/10 border-purple-500/20">
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <Play className="w-5 h-5 text-purple-400" />
              <span>Quick Start Guide</span>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div className="text-center space-y-2">
                <div className="w-12 h-12 bg-purple-500 rounded-full flex items-center justify-center mx-auto">
                  <span className="text-white font-bold">1</span>
                </div>
                <h3 className="font-semibold">Choose Your Device</h3>
                <p className="text-sm text-muted-foreground">VR headset, smartphone, or computer</p>
              </div>
              <div className="text-center space-y-2">
                <div className="w-12 h-12 bg-blue-500 rounded-full flex items-center justify-center mx-auto">
                  <span className="text-white font-bold">2</span>
                </div>
                <h3 className="font-semibold">Find VR Content</h3>
                <p className="text-sm text-muted-foreground">Look for the VR badge on videos</p>
              </div>
              <div className="text-center space-y-2">
                <div className="w-12 h-12 bg-green-500 rounded-full flex items-center justify-center mx-auto">
                  <span className="text-white font-bold">3</span>
                </div>
                <h3 className="font-semibold">Start Watching</h3>
                <p className="text-sm text-muted-foreground">Click VR mode and enjoy</p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Device Tabs */}
        <Tabs value={activeDevice} onValueChange={setActiveDevice} className="space-y-6">
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="mobile" className="flex items-center space-x-2">
              <Smartphone className="w-4 h-4" />
              <span>Mobile VR</span>
            </TabsTrigger>
            <TabsTrigger value="headset" className="flex items-center space-x-2">
              <Eye className="w-4 h-4" />
              <span>VR Headsets</span>
            </TabsTrigger>
            <TabsTrigger value="desktop" className="flex items-center space-x-2">
              <Monitor className="w-4 h-4" />
              <span>Desktop VR</span>
            </TabsTrigger>
          </TabsList>

          <TabsContent value="mobile" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center space-x-2">
                  <Smartphone className="w-5 h-5 text-blue-400" />
                  <span>Mobile VR Setup</span>
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-4">
                    <h3 className="font-semibold">Requirements:</h3>
                    <ul className="space-y-2 text-muted-foreground">
                      <li>• Smartphone with gyroscope</li>
                      <li>• Screen size 4.7" - 6.5"</li>
                      <li>• Android 7.0+ or iOS 12+</li>
                      <li>• VR headset or cardboard viewer</li>
                    </ul>
                  </div>
                  <div className="space-y-4">
                    <h3 className="font-semibold">Step-by-Step:</h3>
                    <ol className="space-y-2 text-muted-foreground">
                      <li>1. Insert phone into VR headset</li>
                      <li>2. Open HubX and find VR content</li>
                      <li>3. Tap the VR icon on video player</li>
                      <li>4. Put on headset and enjoy!</li>
                    </ol>
                  </div>
                </div>
                <div className="bg-blue-50 dark:bg-blue-950/20 p-4 rounded-lg">
                  <div className="flex items-start space-x-2">
                    <AlertCircle className="w-5 h-5 text-blue-500 mt-0.5" />
                    <div>
                      <h4 className="font-semibold text-blue-700 dark:text-blue-300">Pro Tip</h4>
                      <p className="text-sm text-blue-600 dark:text-blue-400">
                        For the best experience, use headphones and ensure your phone is fully charged before starting.
                      </p>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="headset" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center space-x-2">
                  <Eye className="w-5 h-5 text-purple-400" />
                  <span>VR Headset Guide</span>
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {vrHeadsets.map((headset, index) => (
                    <Card key={index} className="overflow-hidden">
                      <div className="relative h-32 overflow-hidden">
                        <img 
                          src={headset.image} 
                          alt={headset.name}
                          className="w-full h-full object-cover"
                        />
                        <div className="absolute top-2 right-2">
                          <Badge variant="secondary" className="bg-black/80 text-white">
                            {headset.price}
                          </Badge>
                        </div>
                      </div>
                      <CardContent className="p-4">
                        <h3 className="font-semibold mb-2">{headset.name}</h3>
                        <div className="flex items-center space-x-2 mb-3">
                          <Badge variant="outline" className={
                            headset.compatibility === 'Excellent' ? 'border-green-500 text-green-600' :
                            headset.compatibility === 'Premium' ? 'border-purple-500 text-purple-600' :
                            'border-blue-500 text-blue-600'
                          }>
                            {headset.compatibility}
                          </Badge>
                        </div>
                        <div className="space-y-1">
                          {headset.features.map((feature, i) => (
                            <div key={i} className="text-xs text-muted-foreground">• {feature}</div>
                          ))}
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="desktop" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center space-x-2">
                  <Monitor className="w-5 h-5 text-green-400" />
                  <span>Desktop VR Experience</span>
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-4">
                    <h3 className="font-semibold">System Requirements:</h3>
                    <ul className="space-y-2 text-muted-foreground">
                      <li>• Windows 10/11 or macOS 10.15+</li>
                      <li>• Chrome 90+ or Firefox 88+</li>
                      <li>• 8GB RAM minimum</li>
                      <li>• Graphics card with WebGL support</li>
                      <li>• Stable internet connection</li>
                    </ul>
                  </div>
                  <div className="space-y-4">
                    <h3 className="font-semibold">How to Use:</h3>
                    <ol className="space-y-2 text-muted-foreground">
                      <li>1. Find a video with VR badge</li>
                      <li>2. Click the VR mode button</li>
                      <li>3. Use mouse to look around</li>
                      <li>4. Use WASD keys to move view</li>
                      <li>5. Press F for fullscreen</li>
                    </ol>
                  </div>
                </div>
                <div className="bg-green-50 dark:bg-green-950/20 p-4 rounded-lg">
                  <div className="flex items-start space-x-2">
                    <Settings className="w-5 h-5 text-green-500 mt-0.5" />
                    <div>
                      <h4 className="font-semibold text-green-700 dark:text-green-300">Desktop Controls</h4>
                      <p className="text-sm text-green-600 dark:text-green-400 mb-2">
                        Mouse: Look around • WASD: Move view • Space: Reset view • F: Fullscreen
                      </p>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>

        {/* Troubleshooting */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <Settings className="w-5 h-5 text-orange-400" />
              <span>Troubleshooting & Tips</span>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-4">
                <h3 className="font-semibold">Common Issues:</h3>
                <div className="space-y-3">
                  <div>
                    <h4 className="text-sm font-medium">Video not loading in VR mode</h4>
                    <p className="text-xs text-muted-foreground">Check your internet connection and try refreshing the page</p>
                  </div>
                  <div>
                    <h4 className="text-sm font-medium">Blurry or distorted image</h4>
                    <p className="text-xs text-muted-foreground">Adjust the lens distance and ensure your device screen is clean</p>
                  </div>
                  <div>
                    <h4 className="text-sm font-medium">Motion sickness</h4>
                    <p className="text-xs text-muted-foreground">Take breaks every 15-30 minutes and start with shorter sessions</p>
                  </div>
                </div>
              </div>
              <div className="space-y-4">
                <h3 className="font-semibold">Best Practices:</h3>
                <div className="space-y-3">
                  <div>
                    <h4 className="text-sm font-medium">Optimal Viewing Environment</h4>
                    <p className="text-xs text-muted-foreground">Use in a well-lit room and ensure you have enough space to move</p>
                  </div>
                  <div>
                    <h4 className="text-sm font-medium">Audio Setup</h4>
                    <p className="text-xs text-muted-foreground">Use quality headphones for the best immersive audio experience</p>
                  </div>
                  <div>
                    <h4 className="text-sm font-medium">Content Quality</h4>
                    <p className="text-xs text-muted-foreground">Look for 4K VR content for the highest quality experience</p>
                  </div>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* CTA */}
        <div className="text-center space-y-4">
          <h2 className="text-2xl font-bold">Ready to Experience VR?</h2>
          <p className="text-muted-foreground">
            Explore our premium VR content collection and dive into immersive experiences.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link to="/premium/vr">
              <Button size="lg" className="bg-purple-600 hover:bg-purple-700 text-white">
                <span className="mr-2">🥽</span>
                Browse VR Content
              </Button>
            </Link>
            <Link to="/contact">
              <Button size="lg" variant="outline">
                Need Help?
              </Button>
            </Link>
          </div>
        </div>
      </main>

      <Footer />
    </div>
  );
};

export default VRGuide;