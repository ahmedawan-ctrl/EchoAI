'use client';

import { useState, useRef, useCallback, ChangeEvent, FormEvent, useEffect } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import {
  Heart,
  Shield,
  Play,
  Star,
  ChevronRight,
  Menu,
  X,
  Upload,
  Zap,
  Award,
  Monitor,
  Settings,
  Lock,
  Phone,
  Mail,
  MapPin,
  Bot,
  FileScan,
  Loader2,
  MessageSquare,
  Send,
  User,
  LogIn,
} from 'lucide-react';
import { EchoAIIcon } from '@/components/icons';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/hooks/use-toast';
import { ScrollArea } from '@/components/ui/scroll-area';
import { answerQuestionsAboutUltrasound } from '@/ai/flows/answer-questions-about-ultrasound';
import { detectUltrasoundAnomalies } from '@/ai/flows/detect-ultrasound-anomalies';
import { generatePreliminaryReport } from '@/ai/flows/generate-preliminary-report';
import { cn } from '@/lib/utils';
import { Skeleton } from '@/components/ui/skeleton';
import { useRouter } from 'next/navigation';

type ChatMessage = {
  role: 'user' | 'ai' | 'loading';
  content: string;
};

export default function EchoAILandingPage() {
  const [isScrolled, setIsScrolled] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  const [originalImage, setOriginalImage] = useState<string | null>(null);
  const [annotatedImage, setAnnotatedImage] = useState<string | null>(null);
  const [anomalies, setAnomalies] = useState<string[]>([]);
  const [report, setReport] = useState('');
  const [chatHistory, setChatHistory] = useState<ChatMessage[]>([]);
  const [question, setQuestion] = useState('');
  const [isLoading, setIsLoading] = useState({
    detection: false,
    report: false,
    chat: false,
  });
  const { toast } = useToast();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const router = useRouter();


  const resetState = () => {
    setOriginalImage(null);
    setAnnotatedImage(null);
    setAnomalies([]);
    setReport('');
    setChatHistory([]);
    setQuestion('');
    setIsLoading({ detection: false, report: false, chat: false });
  };

  const handleImageUpload = useCallback(async (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    resetState();

    const reader = new FileReader();
    reader.readAsDataURL(file);
    reader.onload = async () => {
      const photoDataUri = reader.result as string;
      setOriginalImage(photoDataUri);
      setIsLoading((prev) => ({ ...prev, detection: true, report: true }));

      try {
        const anomalyResult = await detectUltrasoundAnomalies({ photoDataUri });
        setAnomalies(anomalyResult.anomalies);
        setAnnotatedImage(anomalyResult.annotatedImage);
        setIsLoading((prev) => ({ ...prev, detection: false }));

        const reportResult = await generatePreliminaryReport({
          originalImageDataUri: photoDataUri,
          annotatedImageDataUri: anomalyResult.annotatedImage,
          detectedAnomalies: anomalyResult.anomalies,
        });
        setReport(reportResult.report);
      } catch (error) {
        console.error('AI Processing Error:', error);
        toast({
          variant: 'destructive',
          title: 'Analysis Failed',
          description: 'The AI could not process the image. Please try another one.',
        });
        resetState();
      } finally {
        setIsLoading((prev) => ({ ...prev, report: false }));
      }
    };
    reader.onerror = () => {
      toast({
        variant: 'destructive',
        title: 'File Error',
        description: 'Could not read the selected file.',
      });
      resetState();
    };
  }, [toast]);
  
  const handleAskQuestion = async (e: FormEvent) => {
    e.preventDefault();
    if (!question.trim() || !originalImage) return;

    const newHistory: ChatMessage[] = [
      ...chatHistory,
      { role: 'user', content: question },
      { role: 'loading', content: '' },
    ];
    setChatHistory(newHistory);
    setQuestion('');
    setIsLoading((prev) => ({ ...prev, chat: true }));

    try {
      const result = await answerQuestionsAboutUltrasound({
        photoDataUri: originalImage,
        question,
      });
      setChatHistory([
        ...newHistory.slice(0, -1),
        { role: 'ai', content: result.answer },
      ]);
    } catch (error) {
      console.error('Chat Error:', error);
      const errorMessage = 'Sorry, I could not answer that question.';
      setChatHistory([
        ...newHistory.slice(0, -1),
        { role: 'ai', content: errorMessage },
      ]);
      toast({
        variant: 'destructive',
        title: 'Chat Error',
        description: 'There was an issue communicating with the AI.',
      });
    } finally {
      setIsLoading((prev) => ({ ...prev, chat: false }));
    }
  };


  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 0);
    };
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const scrollToSection = (sectionId: string) => {
    const element = document.getElementById(sectionId);
    element?.scrollIntoView({ behavior: 'smooth' });
    setIsMobileMenuOpen(false);
  };

  const howItWorks = [
    {
      icon: Upload,
      title: 'Upload Study',
      desc: 'Securely upload DICOM or native ultrasound clips in under 30 seconds.',
    },
    {
      icon: Zap,
      title: 'AI Analysis',
      desc: 'Proprietary algorithms segment, measure, and classify findings in real time.',
    },
    {
      icon: Award,
      title: 'Review Report',
      desc: 'Receive a structured, guideline-aligned report ready for sign-off.',
    },
    {
      icon: Monitor,
      title: 'Integrate & Share',
      desc: 'Export to PACS, EMR, or share via a secure link with your team.',
    },
  ];

  const features = [
    {
      icon: Heart,
      title: 'Cardiac Suite',
      desc: 'EF, strain, wall-motion, diastolic function and valvular disease detection.',
    },
    {
      icon: Shield,
      title: 'Quality Assurance',
      desc: 'Real-time image-quality feedback ensures diagnostic confidence.',
    },
    {
      icon: Settings,
      title: 'Zero-Config Integration',
      desc: 'HL7/FHIR, DICOMweb, and REST APIs for seamless PACS/EMR connectivity.',
    },
    {
      icon: Lock,
      title: 'HIPAA & GDPR Compliant',
      desc: 'End-to-end encryption, audit logs, and regional hosting options.',
    },
  ];

  const useCases = [
    {
      title: 'Emergency Departments',
      body: 'Rapid triage of acute cardiac failure or abdominal pain.',
      icon: Zap,
    },
    {
      title: 'Rural & Mobile Clinics',
      body: 'Expert-level diagnostics without on-site cardiologists.',
      icon: MapPin,
    },
    {
      title: 'Clinical Trials',
      body: 'Standardized, quantitative imaging endpoints at scale.',
      icon: Award,
    },
  ];

  const testimonials = [
    {
      quote:
        'EchoAI cut our reporting time by 70% while increasing accuracy—game-changing for busy ER shifts.',
      author: 'Dr. Maya Thompson, MD',
      role: 'Emergency Physician, Boston General',
    },
    {
      quote:
        'The AI strain analysis rivals the precision of tertiary-care cardiologists. My patients get answers faster.',
      author: 'Dr. Luis Ortega, MD',
      role: 'Cardiologist, Madrid Centro Cardiovascular',
    },
    {
      quote:
        'Finally, our rural patients have access to world-class cardiac diagnostics without traveling hours.',
      author: 'Dr. Emily Watson',
      role: 'Rural Health Director',
    },
  ];

  const ImageViewer = ({
    title,
    imageSrc,
    isLoading,
    isOriginal = false,
  }: {
    title: string;
    imageSrc: string | null;
    isLoading: boolean;
    isOriginal?: boolean;
  }) => (
    <Card className="overflow-hidden">
      <CardHeader>
        <CardTitle className="font-headline text-lg">{title}</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="aspect-video w-full rounded-lg bg-muted flex items-center justify-center">
          {isLoading ? (
            <Loader2 className="h-10 w-10 animate-spin text-primary" />
          ) : imageSrc ? (
            <Image
              src={imageSrc}
              alt={title}
              width={600}
              height={400}
              className="object-contain w-full h-full"
            />
          ) : (
            <div className="text-muted-foreground flex flex-col items-center gap-2">
              <FileScan className="h-10 w-10" />
              <span>{isOriginal ? 'Upload an image' : 'AI analysis will appear here'}</span>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );

  if (originalImage) {
    return (
      <div className="min-h-screen w-full bg-background font-body">
      <header className="flex items-center justify-between p-4 border-b">
        <div className="flex items-center gap-3">
          <EchoAIIcon className="h-8 w-8 text-primary" />
          <h1 className="text-2xl font-bold font-headline text-primary">EchoAI</h1>
        </div>
        <div>
          <Button variant="outline" onClick={() => fileInputRef.current?.click()}>
            <Upload className="mr-2 h-4 w-4" /> New Scan
          </Button>
          <Input
            ref={fileInputRef}
            type="file"
            accept="image/*"
            className="hidden"
            onChange={handleImageUpload}
          />
           <Button variant="destructive" onClick={resetState} className="ml-2">
            <X className="mr-2 h-4 w-4" /> Reset
          </Button>
        </div>
      </header>

      <main className="p-4 md:p-8">
          <div className="grid grid-cols-1 lg:grid-cols-5 gap-8">
            <div className="lg:col-span-3 flex flex-col gap-8">
              <div className="grid md:grid-cols-2 gap-8">
                <ImageViewer title="Original Ultrasound" imageSrc={originalImage} isLoading={false} isOriginal />
                <ImageViewer title="AI-Annotated Image" imageSrc={annotatedImage} isLoading={isLoading.detection} />
              </div>
              <Card>
                <CardHeader>
                  <CardTitle className="font-headline text-lg">Preliminary Report</CardTitle>
                  <CardDescription>Review and edit the AI-generated report.</CardDescription>
                </CardHeader>
                <CardContent>
                  {isLoading.report ? (
                    <div className="space-y-2">
                      <Skeleton className="h-4 w-full" />
                      <Skeleton className="h-4 w-full" />
                      <Skeleton className="h-4 w-3/4" />
                    </div>
                  ) : (
                    <Textarea
                      value={report}
                      onChange={(e) => setReport(e.target.value)}
                      placeholder="AI-generated report will appear here..."
                      rows={10}
                      className="text-base"
                    />
                  )}
                </CardContent>
              </Card>
            </div>

            <div className="lg:col-span-2 flex flex-col gap-8">
              <Card>
                <CardHeader>
                  <CardTitle className="font-headline text-lg">Detected Anomalies</CardTitle>
                  <CardDescription>Potential anomalies identified by the AI.</CardDescription>
                </CardHeader>
                <CardContent>
                  {isLoading.detection ? (
                    <div className="space-y-2">
                      <Skeleton className="h-8 w-1/3 rounded-full" />
                      <Skeleton className="h-8 w-1/2 rounded-full" />
                    </div>
                  ) : (
                    <div className="flex flex-wrap gap-2">
                      {anomalies.length > 0 ? (
                        anomalies.map((anomaly, index) => (
                          <Badge key={index} variant="secondary" className="text-md py-1 px-3">
                            {anomaly}
                          </Badge>
                        ))
                      ) : (
                        <p className="text-muted-foreground">No anomalies detected.</p>
                      )}
                    </div>
                  )}
                </CardContent>
              </Card>

              <Card className="flex flex-col h-[60vh]">
                <CardHeader>
                  <CardTitle className="font-headline text-lg">VQA Chatbot</CardTitle>
                  <CardDescription>Ask questions about the ultrasound.</CardDescription>
                </CardHeader>
                <CardContent className="flex-grow flex flex-col gap-4 overflow-hidden">
                  <ScrollArea className="flex-grow pr-4 -mr-4">
                    <div className="space-y-4">
                      {chatHistory.length === 0 && (
                        <div className="text-center text-muted-foreground py-8">
                          <MessageSquare className="mx-auto h-8 w-8 mb-2" />
                          <p>Chat history will appear here.</p>
                        </div>
                      )}
                      {chatHistory.map((msg, index) => (
                        <div key={index} className={cn('flex items-start gap-3', msg.role === 'user' ? 'justify-end' : 'justify-start')}>
                           {msg.role !== 'user' && (
                            <div className="p-2 bg-primary/10 rounded-full text-primary">
                              {msg.role === 'ai' ? <Bot className="h-5 w-5" /> : <Loader2 className="h-5 w-5 animate-spin" />}
                            </div>
                          )}
                          {msg.role !== 'loading' && (
                            <div className={cn(
                                'rounded-xl p-3 max-w-[80%]',
                                msg.role === 'user' ? 'bg-primary text-primary-foreground' : 'bg-muted'
                              )}>
                              <p className="text-sm">{msg.content}</p>
                            </div>
                          )}
                          {msg.role === 'user' && (
                            <div className="p-2 bg-muted rounded-full text-muted-foreground">
                              <User className="h-5 w-5" />
                            </div>
                          )}
                        </div>
                      ))}
                    </div>
                  </ScrollArea>
                  <form onSubmit={handleAskQuestion} className="flex items-center gap-2 pt-2 border-t">
                    <Input
                      value={question}
                      onChange={(e) => setQuestion(e.target.value)}
                      placeholder="Ask about the image..."
                      className="flex-grow"
                      disabled={isLoading.chat || !originalImage}
                    />
                    <Button type="submit" size="icon" disabled={isLoading.chat || !question.trim()}>
                      <Send className="h-4 w-4" />
                    </Button>
                  </form>
                </CardContent>
              </Card>
            </div>
          </div>
      </main>
    </div>
    )
  }

  return (
    <div className="min-h-screen bg-background font-body text-foreground">
      <header
        className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 ${
          isScrolled ? 'bg-background/90 backdrop-blur shadow-lg' : 'bg-transparent'
        }`}
      >
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-20">
            <Link href="/" className="flex items-center gap-3">
              <EchoAIIcon className="h-8 w-8 text-primary" />
              <span className="text-2xl font-bold font-headline text-primary">EchoAI</span>
            </Link>

            <nav className="hidden md:flex items-center space-x-8">
              <button
                onClick={() => scrollToSection('features')}
                className="text-sm font-medium text-muted-foreground hover:text-primary transition-colors"
              >
                Features
              </button>
              <button
                onClick={() => scrollToSection('use-cases')}
                className="text-sm font-medium text-muted-foreground hover:text-primary transition-colors"
              >
                Use Cases
              </button>
              <button
                onClick={() => scrollToSection('testimonials')}
                className="text-sm font-medium text-muted-foreground hover:text-primary transition-colors"
              >
                Testimonials
              </button>
              <Button onClick={() => router.push('/')}>Dashboard</Button>
            </nav>

            <button className="md:hidden" onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}>
              {isMobileMenuOpen ? (
                <X className="w-6 h-6" />
              ) : (
                <Menu className="w-6 h-6" />
              )}
            </button>
          </div>

          {isMobileMenuOpen && (
            <div className="md:hidden pb-4 border-t">
              <nav className="flex flex-col space-y-4 pt-4">
                <button
                  onClick={() => scrollToSection('features')}
                  className="text-left text-muted-foreground hover:text-primary"
                >
                  Features
                </button>
                <button
                  onClick={() => scrollToSection('use-cases')}
                  className="text-left text-muted-foreground hover:text-primary"
                >
                  Use Cases
                </button>
                <button
                  onClick={() => scrollToSection('testimonials')}
                  className="text-left text-muted-foreground hover:text-primary"
                >
                  Testimonials
                </button>
                <Button className="w-full" onClick={() => router.push('/')}>Dashboard</Button>
              </nav>
            </div>
          )}
        </div>
      </header>

      <main>
        <section
          id="home"
          className="pt-20 pb-16 bg-gradient-to-br from-primary/10 via-background to-background"
        >
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 grid md:grid-cols-2 items-center gap-12">
            <div>
              <h1 className="text-4xl md:text-5xl font-extrabold text-foreground leading-tight font-headline">
                AI-Powered Ultrasound <span className="text-primary">Diagnostics</span>
              </h1>
              <p className="mt-6 text-lg text-muted-foreground">
                Rapid, accurate cardiac and abdominal ultrasound analysis for clinicians—anywhere,
                anytime.
              </p>
              <div className="mt-8 flex flex-col sm:flex-row gap-4 items-center">
                <Button size="lg">
                  <Play className="w-5 h-5 mr-2" />
                  Book Demo
                </Button>
                <button
                  onClick={() => scrollToSection('how-it-works')}
                  className="inline-flex items-center text-base font-medium text-primary hover:text-primary/80"
                >
                  See How It Works <ChevronRight className="ml-1 w-5 h-5" />
                </button>
              </div>
            </div>
            <div className="hidden md:block">
              <div className="bg-gradient-to-br from-primary/20 to-primary/30 rounded-2xl h-96 flex items-center justify-center p-8">
                 <Image
                    src="https://placehold.co/600x400.png"
                    alt="Ultrasound analysis dashboard"
                    width={600}
                    height={400}
                    className="rounded-lg shadow-2xl object-cover"
                    data-ai-hint="ultrasound analysis"
                  />
              </div>
            </div>
          </div>
        </section>
        
        <Input
            ref={fileInputRef}
            type="file"
            accept="image/*"
            className="hidden"
            onChange={handleImageUpload}
        />

        <section id="how-it-works" className="py-20 bg-muted/50">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="text-center mb-12">
              <h2 className="text-3xl font-bold text-foreground font-headline">How EchoAI Works</h2>
              <p className="mt-4 text-lg text-muted-foreground">
                Simple 4-step process for instant cardiac insights
              </p>
            </div>

            <div className="grid md:grid-cols-4 gap-8">
              {howItWorks.map((step, idx) => {
                const isUpload = step.title === 'Upload Study';
                const content = (
                  <div key={idx} className="flex flex-col items-center text-center group">
                    <div className="flex items-center justify-center w-20 h-20 rounded-full bg-primary/10 text-primary transition-colors group-hover:bg-primary group-hover:text-primary-foreground">
                      <step.icon className="w-10 h-10" />
                    </div>
                    <h3 className="mt-4 text-xl font-semibold text-foreground font-headline">
                      {step.title}
                    </h3>
                    <p className="mt-2 text-sm text-muted-foreground">{step.desc}</p>
                  </div>
                );
                
                if (isUpload) {
                  return (
                    <button onClick={() => fileInputRef.current?.click()} key={idx} className="focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 rounded-lg">
                      {content}
                    </button>
                  )
                }
                
                return content;
              })}
            </div>
          </div>
        </section>

        <section id="features" className="py-20 bg-background">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="text-center mb-12">
              <h2 className="text-3xl font-bold text-foreground font-headline">Features</h2>
              <p className="mt-4 text-lg text-muted-foreground">
                Everything you need for advanced cardiac diagnostics
              </p>
            </div>

            <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-8">
              {features.map((feature) => (
                <Card key={feature.title} className="text-center md:text-left hover:shadow-xl transition-shadow bg-card">
                  <CardHeader>
                    <div className="w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center mb-4 mx-auto md:mx-0">
                      <feature.icon className="w-8 h-8 text-primary" />
                    </div>
                    <CardTitle className="text-xl font-headline">{feature.title}</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <CardDescription>{feature.desc}</CardDescription>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        </section>

        <section id="use-cases" className="py-20 bg-muted/50">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="text-center mb-12">
              <h2 className="text-3xl font-bold text-foreground font-headline">Use Cases</h2>
              <p className="mt-4 text-lg text-muted-foreground">
                Powering diagnostics in diverse healthcare settings
              </p>
            </div>

            <div className="grid md:grid-cols-3 gap-8">
              {useCases.map((useCase) => (
                <Card key={useCase.title} className="hover:shadow-xl transition-shadow bg-card">
                  <CardHeader>
                    <div className="w-12 h-12 bg-primary/10 rounded-lg flex items-center justify-center mb-4">
                      <useCase.icon className="w-6 h-6 text-primary" />
                    </div>
                    <CardTitle className="text-xl font-headline">{useCase.title}</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <CardDescription>{useCase.body}</CardDescription>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        </section>

        <section id="testimonials" className="py-20 bg-background">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="text-center mb-12">
              <h2 className="text-3xl font-bold text-foreground font-headline">What Doctors Say</h2>
              <p className="mt-4 text-lg text-muted-foreground">
                Trusted by leading healthcare professionals
              </p>
            </div>

            <div className="grid md:grid-cols-3 gap-8">
              {testimonials.map((testimonial, index) => (
                <Card key={index} className="hover:shadow-xl transition-shadow bg-card flex flex-col">
                  <CardHeader className="flex-grow">
                    <div className="flex items-center mb-4 text-accent">
                      {[...Array(5)].map((_, i) => (
                        <Star key={i} className="w-5 h-5 fill-current" />
                      ))}
                    </div>
                    <CardDescription className="text-base italic">
                      "{testimonial.quote}"
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div>
                      <p className="font-semibold text-foreground">{testimonial.author}</p>
                      <p className="text-sm text-muted-foreground">{testimonial.role}</p>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        </section>

        <section id="contact" className="py-20 bg-primary">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
            <h2 className="text-3xl md:text-4xl font-bold text-primary-foreground mb-4 font-headline">
              Ready to Transform Your Practice?
            </h2>
            <p className="text-xl text-primary-foreground/80 mb-8 max-w-2xl mx-auto">
              Join thousands of healthcare professionals using EchoAI to deliver better patient
              outcomes.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Button size="lg" variant="secondary" className="text-lg px-8">
                Start Free Trial
              </Button>
              <Button size="lg" variant="outline" className="text-primary bg-primary-foreground hover:bg-primary-foreground/90 hover:text-primary text-lg px-8">
                Schedule Demo
              </Button>
            </div>
          </div>
        </section>
      </main>

      <footer className="bg-foreground text-background">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
          <div className="grid md:grid-cols-4 gap-8">
            <div>
              <div className="flex items-center gap-3 mb-4">
                <div className="w-8 h-8 bg-primary rounded-full flex items-center justify-center">
                  <EchoAIIcon className="w-5 h-5 text-primary-foreground" />
                </div>
                <span className="text-xl font-bold font-headline">EchoAI</span>
              </div>
              <p className="text-muted-foreground text-sm">
                AI-powered cardiac diagnostics for everyone.
              </p>
            </div>

            <div>
              <h4 className="font-semibold mb-4 font-headline">Product</h4>
              <ul className="space-y-2 text-sm text-muted-foreground">
                <li>
                  <button className="hover:text-background transition-colors">Features</button>
                </li>
                <li>
                  <button className="hover:text-background transition-colors">Pricing</button>
                </li>
                <li>
                  <button className="hover:text-background transition-colors">API</button>
                </li>
              </ul>
            </div>

            <div>
              <h4 className="font-semibold mb-4 font-headline">Support</h4>
              <ul className="space-y-2 text-sm text-muted-foreground">
                <li>
                  <button className="hover:text-background transition-colors">
                    Documentation
                  </button>
                </li>
                <li>
                  <button className="hover:text-background transition-colors">Contact</button>
                </li>
                <li>
                  <button className="hover:text-background transition-colors">Training</button>
                </li>
              </ul>
            </div>

            <div>
              <h4 className="font-semibold mb-4 font-headline">Contact</h4>
              <ul className="space-y-2 text-sm text-muted-foreground">
                <li className="flex items-center">
                  <Mail className="w-4 h-4 mr-2" />
                  hello@echoai.com
                </li>
                <li className="flex items-center">
                  <Phone className="w-4 h-4 mr-2" />
                  +1 (415) 555-0100
                </li>
              </ul>
            </div>
          </div>

          <div className="border-t border-border mt-8 pt-8 text-center text-sm text-muted-foreground">
            <p>&copy; 2024 EchoAI Inc. All rights reserved.</p>
          </div>
        </div>
      </footer>
    </div>
  );
}
