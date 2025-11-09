import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Sparkles, Zap, Shield, Clock, TrendingUp, Users } from "lucide-react";
import { useState } from "react";
import { AuthForm } from "./AuthForm";

export const LandingPage = () => {
  const [showAuth, setShowAuth] = useState(false);

  if (showAuth) {
    return <AuthForm />;
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Hero Section */}
      <section className="container max-w-6xl mx-auto px-4 py-16 md:py-24">
        <div className="text-center space-y-8 animate-fade-in">
          <div className="flex items-center justify-center gap-3 mb-6">
            <div className="w-20 h-20 bg-gradient-to-br from-primary to-accent rounded-3xl flex items-center justify-center shadow-elegant">
              <Sparkles className="w-10 h-10 text-white" />
            </div>
          </div>
          <h1 className="text-4xl md:text-6xl font-bold text-foreground leading-tight">
            Generate Captivating Captions <br />
            <span className="bg-gradient-to-r from-primary to-accent bg-clip-text text-transparent">
              In Seconds with AI
            </span>
          </h1>
          <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
            Stop wasting hours crafting the perfect caption. Let AI create engaging, 
            scroll-stopping content for your social media posts instantly.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center items-center">
            <Button 
              onClick={() => setShowAuth(true)}
              size="lg"
              className="h-14 px-8 bg-gradient-to-r from-primary to-accent hover:opacity-90 transition-all text-lg font-semibold rounded-2xl shadow-elegant"
            >
              <Sparkles className="w-5 h-5 mr-2" />
              Start Creating Free
            </Button>
            <Button 
              variant="outline"
              size="lg"
              onClick={() => document.getElementById('features')?.scrollIntoView({ behavior: 'smooth' })}
              className="h-14 px-8 text-lg rounded-2xl"
            >
              See How It Works
            </Button>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section id="features" className="container max-w-6xl mx-auto px-4 py-16 bg-muted/30">
        <div className="text-center mb-12">
          <h2 className="text-3xl md:text-4xl font-bold text-foreground mb-4">
            Everything You Need to Stand Out
          </h2>
          <p className="text-muted-foreground text-lg">
            Powerful features to elevate your social media game
          </p>
        </div>
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
          {[
            {
              icon: Zap,
              title: "Lightning Fast",
              description: "Generate 15 unique caption variations in seconds. No more writer's block.",
              gradient: "from-yellow-500 to-orange-500"
            },
            {
              icon: TrendingUp,
              title: "AI-Powered",
              description: "Advanced AI understands your niche and creates captions that resonate with your audience.",
              gradient: "from-blue-500 to-cyan-500"
            },
            {
              icon: Clock,
              title: "Save Hours",
              description: "What used to take hours now takes seconds. Focus on creating content, not captions.",
              gradient: "from-green-500 to-teal-500"
            },
            {
              icon: Shield,
              title: "Multiple Moods",
              description: "Choose from 8 different tones - playful, professional, inspirational, and more.",
              gradient: "from-purple-500 to-pink-500"
            },
            {
              icon: Users,
              title: "Multi-Language",
              description: "Generate captions in 20+ languages including Hindi, Spanish, French, and more.",
              gradient: "from-pink-500 to-red-500"
            },
            {
              icon: Sparkles,
              title: "Hashtag Generator",
              description: "Get 8-12 trending, relevant hashtags with every caption to maximize reach.",
              gradient: "from-indigo-500 to-purple-500"
            }
          ].map((feature, index) => (
            <Card 
              key={index} 
              className="p-6 space-y-4 hover:shadow-lg transition-all duration-300 hover:-translate-y-1 bg-card border-0"
            >
              <div className={`w-12 h-12 bg-gradient-to-br ${feature.gradient} rounded-xl flex items-center justify-center`}>
                <feature.icon className="w-6 h-6 text-white" />
              </div>
              <h3 className="text-xl font-semibold text-foreground">{feature.title}</h3>
              <p className="text-muted-foreground">{feature.description}</p>
            </Card>
          ))}
        </div>
      </section>

      {/* Testimonials Section */}
      <section className="container max-w-6xl mx-auto px-4 py-16">
        <div className="text-center mb-12">
          <h2 className="text-3xl md:text-4xl font-bold text-foreground mb-4">
            Loved by Content Creators
          </h2>
          <p className="text-muted-foreground text-lg">
            Join thousands of creators saving time and growing their audience
          </p>
        </div>
        <div className="grid md:grid-cols-3 gap-6">
          {[
            {
              name: "Priya Sharma",
              role: "Fashion Influencer",
              content: "CaptionCraft has saved me hours every week. The AI understands my style perfectly!",
              rating: 5
            },
            {
              name: "Rahul Verma",
              role: "Fitness Coach",
              content: "The variety of captions is amazing. I can choose the perfect tone for each post.",
              rating: 5
            },
            {
              name: "Ananya Patel",
              role: "Food Blogger",
              content: "Game changer! My engagement has increased 40% since using CaptionCraft.",
              rating: 5
            }
          ].map((testimonial, index) => (
            <Card key={index} className="p-6 space-y-4 bg-card border-0 shadow-card">
              <div className="flex gap-1">
                {[...Array(testimonial.rating)].map((_, i) => (
                  <Sparkles key={i} className="w-4 h-4 text-yellow-500 fill-yellow-500" />
                ))}
              </div>
              <p className="text-foreground italic">"{testimonial.content}"</p>
              <div>
                <p className="font-semibold text-foreground">{testimonial.name}</p>
                <p className="text-sm text-muted-foreground">{testimonial.role}</p>
              </div>
            </Card>
          ))}
        </div>
      </section>

      {/* FAQ Section */}
      <section className="container max-w-4xl mx-auto px-4 py-16 bg-muted/30">
        <div className="text-center mb-12">
          <h2 className="text-3xl md:text-4xl font-bold text-foreground mb-4">
            Frequently Asked Questions
          </h2>
        </div>
        <div className="space-y-4">
          {[
            {
              q: "How does CaptionCraft work?",
              a: "Simply enter your niche, topic, and select your preferred mood. Our AI analyzes your input and generates multiple unique caption variations along with relevant hashtags in seconds."
            },
            {
              q: "Can I use it in different languages?",
              a: "Yes! CaptionCraft supports 20+ languages including Hindi, Bengali, Spanish, French, German, and many more."
            },
            {
              q: "How many captions can I generate?",
              a: "You can generate up to 15 caption variations at once (5 short, 5 medium, 5 long), giving you plenty of options to choose from."
            },
            {
              q: "Can I save my favorite captions?",
              a: "Absolutely! You can save captions to your collection and access them anytime. You can also export them to CSV for backup."
            },
            {
              q: "Do I need to provide images?",
              a: "No, images are optional. However, uploading an image helps the AI create more contextually relevant captions."
            }
          ].map((faq, index) => (
            <Card key={index} className="p-6 bg-card border-0">
              <h3 className="font-semibold text-foreground mb-2">{faq.q}</h3>
              <p className="text-muted-foreground">{faq.a}</p>
            </Card>
          ))}
        </div>
      </section>

      {/* CTA Section */}
      <section className="container max-w-6xl mx-auto px-4 py-16">
        <Card className="p-12 text-center bg-gradient-to-br from-primary/10 to-accent/10 border-0">
          <h2 className="text-3xl md:text-4xl font-bold text-foreground mb-4">
            Ready to Transform Your Social Media?
          </h2>
          <p className="text-lg text-muted-foreground mb-8 max-w-2xl mx-auto">
            Join thousands of creators who are saving time and growing their audience with AI-powered captions.
          </p>
          <Button 
            onClick={() => setShowAuth(true)}
            size="lg"
            className="h-14 px-8 bg-gradient-to-r from-primary to-accent hover:opacity-90 transition-all text-lg font-semibold rounded-2xl shadow-elegant"
          >
            <Sparkles className="w-5 h-5 mr-2" />
            Get Started Free
          </Button>
        </Card>
      </section>

      {/* Footer */}
      <footer className="border-t border-border py-8">
        <div className="container max-w-6xl mx-auto px-4 text-center text-muted-foreground">
          <p>© 2025 CaptionCraft. All rights reserved.</p>
        </div>
      </footer>
    </div>
  );
};
