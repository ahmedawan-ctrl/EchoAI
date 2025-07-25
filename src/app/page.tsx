
'use client';

import { useState, useRef, useCallback, ChangeEvent, FormEvent, useEffect } from 'react';
import Image from 'next/image';
import { useRouter } from 'next/navigation';
import {
  Bot,
  FileScan,
  Loader2,
  MessageSquare,
  Send,
  Upload,
  User,
  X,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/hooks/use-toast';
import { ScrollArea } from '@/components/ui/scroll-area';
import { answerQuestionsAboutUltrasound } from '@/ai/flows/answer-questions-about-ultrasound';
import { detectUltrasoundAnomalies } from '@/ai/flows/detect-ultrasound-anomalies';
import { generatePreliminaryReport } from '@/ai/flows/generate-preliminary-report';
import { EchoAIIcon } from '@/components/icons';
import { cn } from '@/lib/utils';
import { Skeleton } from '@/components/ui/skeleton';

type ChatMessage = {
  role: 'user' | 'ai' | 'loading';
  content: string;
};

export default function Home() {
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

  // Redirect to login if not "logged in" (i.e. no image uploaded yet)
  // In a real app, this would be a proper auth check.
  useEffect(() => {
    if (!originalImage) {
      router.push('/login');
    }
  }, [originalImage, router]);


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

  if (!originalImage) {
    // Show a loading/redirecting state while useEffect kicks in
    return (
      <div className="min-h-screen w-full bg-background flex items-center justify-center">
        <Loader2 className="h-16 w-16 animate-spin text-primary" />
      </div>
    );
  }

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
  );
}

    