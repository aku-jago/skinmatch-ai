import { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { Navigation } from '@/components/Navigation';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Send, Bot, User as UserIcon } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';

interface Message {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  created_at: string;
}

const Chat = () => {
  const { user, loading } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState('');
  const [sending, setSending] = useState(false);
  const [profile, setProfile] = useState<any>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!loading && !user) {
      navigate('/login');
    }
  }, [user, loading, navigate]);

  useEffect(() => {
    if (user) {
      loadMessages();
      loadProfile();
    }
  }, [user]);

  const loadProfile = async () => {
    if (!user) return;
    
    const { data } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', user.id)
      .single();

    setProfile(data);
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  const loadMessages = async () => {
    if (!user) return;
    
    const { data, error } = await supabase
      .from('chat_messages')
      .select('*')
      .eq('user_id', user.id)
      .order('created_at', { ascending: true })
      .limit(50);

    if (error) {
      console.error('Error loading messages:', error);
      return;
    }

    const formattedMessages: Message[] = [];
    data?.forEach(msg => {
      formattedMessages.push({
        id: msg.id + '-user',
        role: 'user',
        content: msg.message,
        created_at: msg.created_at
      });
      if (msg.ai_response) {
        formattedMessages.push({
          id: msg.id + '-ai',
          role: 'assistant',
          content: msg.ai_response,
          created_at: msg.created_at
        });
      }
    });

    setMessages(formattedMessages);
  };

  const handleSend = async () => {
    if (!input.trim() || !user) return;

    const userMessage = input.trim();
    setInput('');
    setSending(true);

    const tempUserMsg: Message = {
      id: 'temp-' + Date.now(),
      role: 'user',
      content: userMessage,
      created_at: new Date().toISOString()
    };
    setMessages(prev => [...prev, tempUserMsg]);

    try {
      const { data, error: functionError } = await supabase.functions.invoke('ai-chat', {
        body: { 
          message: userMessage,
          userProfile: profile
        }
      });

      if (functionError) throw functionError;

      const aiResponse = data?.response || "Maaf, saya tidak dapat menghasilkan response. Silakan coba lagi.";

      const tempAiMsg: Message = {
        id: 'temp-ai-' + Date.now(),
        role: 'assistant',
        content: aiResponse,
        created_at: new Date().toISOString()
      };
      setMessages(prev => [...prev, tempAiMsg]);

      const { error: dbError } = await supabase.from('chat_messages').insert([
        {
          user_id: user.id,
          message: userMessage,
          ai_response: aiResponse
        }
      ]);

      if (dbError) {
        console.error('Error saving message:', dbError);
      }
    } catch (error) {
      console.error('Chat error:', error);
      toast({
        title: "Error",
        description: "Gagal mengirim pesan. Silakan coba lagi.",
        variant: "destructive"
      });
      setMessages(prev => prev.filter(msg => msg.id !== tempUserMsg.id));
    } finally {
      setSending(false);
    }
  };

  if (loading || !user) {
    return null;
  }

  return (
    <div className="min-h-screen bg-background">
      <Navigation />
      <div className="container mx-auto px-4 pt-24 pb-12">
        <div className="max-w-3xl mx-auto space-y-6">
          <div className="text-center space-y-2">
            <h1 className="text-4xl font-bold bg-gradient-to-r from-primary to-accent bg-clip-text text-transparent">
              AI Skincare Consultant
            </h1>
            <p className="text-muted-foreground">
              Tanyakan apapun tentang skincare dan dapatkan saran personal
            </p>
          </div>

          <Card className="shadow-soft h-[600px] flex flex-col">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Bot className="h-5 w-5 text-primary" />
                Chat Assistant
              </CardTitle>
            </CardHeader>
            <CardContent className="flex-1 flex flex-col overflow-hidden">
              <div className="flex-1 overflow-y-auto space-y-4 mb-4 pr-2">
                {messages.length === 0 ? (
                  <div className="text-center text-muted-foreground py-12">
                    <Bot className="h-12 w-12 mx-auto mb-4 text-primary/50" />
                    <p>Mulai percakapan dengan mengirim pesan!</p>
                    <p className="text-sm mt-2">Coba tanyakan tentang jenis kulit atau rekomendasi produk.</p>
                  </div>
                ) : (
                  messages.map((message) => (
                    <div
                      key={message.id}
                      className={`flex gap-3 ${message.role === 'user' ? 'justify-end' : 'justify-start'} animate-in fade-in-50 slide-in-from-bottom-2 duration-300`}
                    >
                      {message.role === 'assistant' && (
                        <div className="w-10 h-10 rounded-full bg-gradient-to-br from-primary to-accent flex items-center justify-center flex-shrink-0 shadow-soft">
                          <Bot className="h-5 w-5 text-primary-foreground" />
                        </div>
                      )}
                      <div
                        className={`rounded-2xl px-5 py-3 max-w-[80%] shadow-sm ${
                          message.role === 'user'
                            ? 'bg-gradient-to-br from-primary to-primary/90 text-primary-foreground'
                            : 'bg-gradient-card border border-primary/10'
                        }`}
                      >
                        <div className="text-sm leading-relaxed">
                          {message.content.split('\n').map((line, idx) => {
                            if (line.trim().startsWith('•') || line.trim().match(/^\d+\./)) {
                              return <div key={idx} className="my-1 pl-2">{line}</div>;
                            }
                            if (line.trim().startsWith('#')) {
                              return <div key={idx} className="font-semibold mt-3 mb-1">{line.replace(/^#+\s*/, '')}</div>;
                            }
                            if (line.trim() === '') {
                              return <div key={idx} className="h-2" />;
                            }
                            return <div key={idx}>{line}</div>;
                          })}
                        </div>
                      </div>
                      {message.role === 'user' && (
                        <div className="w-10 h-10 rounded-full bg-gradient-to-br from-secondary to-secondary/80 flex items-center justify-center flex-shrink-0 shadow-soft">
                          <UserIcon className="h-5 w-5 text-secondary-foreground" />
                        </div>
                      )}
                    </div>
                  ))
                )}
                <div ref={messagesEndRef} />
              </div>

              <div className="flex gap-2">
                <Input
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  onKeyPress={(e) => e.key === 'Enter' && !sending && handleSend()}
                  placeholder="Tanyakan tentang routine skincare Anda..."
                  disabled={sending}
                />
                <Button onClick={handleSend} disabled={sending || !input.trim()}>
                  <Send className="h-4 w-4" />
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
};

export default Chat;
