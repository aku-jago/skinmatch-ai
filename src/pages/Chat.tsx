import { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { Navigation } from '@/components/Navigation';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Send, Bot, Sparkles } from 'lucide-react';
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
    <div className="min-h-screen bg-background flex flex-col">
      <Navigation />
      
      {/* Main Chat Container */}
      <div className="flex-1 flex flex-col pt-16 pb-20 lg:pb-4">
        {/* Chat Messages Area */}
        <div className="flex-1 overflow-y-auto">
          <div className="max-w-2xl mx-auto px-3 lg:px-4 py-4">
            {messages.length === 0 ? (
              <div className="flex flex-col items-center justify-center h-[60vh] text-center px-4">
                <div className="w-16 h-16 rounded-full bg-gradient-to-br from-primary/20 to-accent/20 flex items-center justify-center mb-4">
                  <Sparkles className="h-8 w-8 text-primary" />
                </div>
                <h2 className="text-lg font-semibold text-foreground mb-1">
                  AI Skincare Assistant
                </h2>
                <p className="text-sm text-muted-foreground max-w-xs">
                  Tanyakan apapun tentang skincare, jenis kulit, atau rekomendasi produk
                </p>
                <div className="flex flex-wrap gap-2 mt-6 justify-center">
                  {['Routine pagi', 'Kulit berminyak', 'Anti aging'].map((suggestion) => (
                    <button
                      key={suggestion}
                      onClick={() => setInput(suggestion)}
                      className="px-3 py-1.5 text-xs rounded-full bg-secondary/50 text-secondary-foreground hover:bg-secondary transition-colors"
                    >
                      {suggestion}
                    </button>
                  ))}
                </div>
              </div>
            ) : (
              <div className="space-y-3">
                {messages.map((message) => (
                  <div
                    key={message.id}
                    className={`flex ${message.role === 'user' ? 'justify-end' : 'justify-start'} animate-in fade-in-50 duration-200`}
                  >
                    {message.role === 'assistant' && (
                      <div className="w-7 h-7 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0 mr-2 mt-0.5">
                        <Bot className="h-4 w-4 text-primary" />
                      </div>
                    )}
                    <div
                      className={`rounded-2xl px-3.5 py-2.5 max-w-[85%] lg:max-w-[75%] ${
                        message.role === 'user'
                          ? 'bg-primary text-primary-foreground rounded-br-md'
                          : 'bg-muted/60 text-foreground rounded-bl-md'
                      }`}
                    >
                      <div className="text-[13px] lg:text-sm leading-relaxed whitespace-pre-wrap">
                        {message.content.split('\n').map((line, idx) => {
                          if (line.trim().startsWith('•') || line.trim().match(/^\d+\./)) {
                            return <div key={idx} className="my-0.5 pl-1">{line}</div>;
                          }
                          if (line.trim().startsWith('#')) {
                            return <div key={idx} className="font-medium mt-2 mb-0.5">{line.replace(/^#+\s*/, '')}</div>;
                          }
                          if (line.trim() === '') {
                            return <div key={idx} className="h-1.5" />;
                          }
                          return <span key={idx}>{line}</span>;
                        })}
                      </div>
                    </div>
                  </div>
                ))}
                {sending && (
                  <div className="flex justify-start animate-in fade-in-50">
                    <div className="w-7 h-7 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0 mr-2">
                      <Bot className="h-4 w-4 text-primary" />
                    </div>
                    <div className="bg-muted/60 rounded-2xl rounded-bl-md px-4 py-3">
                      <div className="flex gap-1">
                        <span className="w-2 h-2 bg-primary/40 rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
                        <span className="w-2 h-2 bg-primary/40 rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
                        <span className="w-2 h-2 bg-primary/40 rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
                      </div>
                    </div>
                  </div>
                )}
                <div ref={messagesEndRef} />
              </div>
            )}
          </div>
        </div>

        {/* Input Area - Fixed at bottom */}
        <div className="sticky bottom-16 lg:bottom-0 bg-background/95 backdrop-blur-sm border-t border-border/50">
          <div className="max-w-2xl mx-auto px-3 lg:px-4 py-3">
            <div className="flex gap-2 items-center">
              <Input
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyPress={(e) => e.key === 'Enter' && !sending && handleSend()}
                placeholder="Ketik pesan..."
                disabled={sending}
                className="flex-1 rounded-full bg-muted/50 border-0 focus-visible:ring-1 focus-visible:ring-primary/50 px-4 h-11"
              />
              <Button 
                onClick={handleSend} 
                disabled={sending || !input.trim()}
                size="icon"
                className="rounded-full h-11 w-11 flex-shrink-0"
              >
                <Send className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Chat;
