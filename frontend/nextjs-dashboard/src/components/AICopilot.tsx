'use client';

import React, { useState, useRef, useEffect } from 'react';
import { Bot, X, Send, User, Sparkles, Loader2 } from 'lucide-react';

// Assuming the same Alert interface used in Dashboard
export interface Alert {
  cve_id: string;
  log?: string;
  severity?: number;
  threat_score?: number;
  soc_level?: string;
}

interface Message {
  id: string;
  role: 'user' | 'assistant';
  content: string;
}

interface AICopilotProps {
  alerts: Alert[];
}

export default function AICopilot({ alerts }: AICopilotProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState<Message[]>([
    {
      id: 'welcome',
      role: 'assistant',
      content: 'Bonjour ! Je suis votre Copilote SOC IA. Je surveille vos métriques en temps réel. Que voulez-vous analyser aujourd\'hui ?'
    }
  ]);
  const [inputValue, setInputValue] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Auto-scroll to bottom of chat
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, isTyping]);

  const generateMockResponse = (input: string, currentAlerts: Alert[]): string => {
    const text = input.toLowerCase();
    const total = currentAlerts.length;
    const criticals = currentAlerts.filter(a => a.cve_id !== 'ML-ANOMALY').length;
    const anomalies = currentAlerts.filter(a => a.cve_id === 'ML-ANOMALY').length;
    
    // Pattern Matcher (Simulated LLM)
    if (text.includes('résumé') || text.includes('resume') || text.includes('statut') || text.includes('combien')) {
      if (total === 0) return "Le système est complètement stable. Aucune alerte n'a été interceptée pour le moment.";
      return `À cet instant, j'analyse **${total} alertes** en cours de traitement. 
        \nParmi elles, nous avons identifié **${criticals} vulnérabilités CVE** et relevé **${anomalies} anomalies comportementales (ML)**. Le niveau de surveillance est élevé.`;
    }
    
    if (text.includes('pays') || text.includes('origine') || text.includes('source') || text.includes('géographique')) {
      if (total === 0) return "Il n'y a pas d'attaques en cours à retracer.";
      return "D'après les dernières trames réseau, les adresses IP offensives proviennent majoritairement de **Russie, des États-Unis et de Chine**. Je vous invite à consulter la **Carte Mondiale** sur le tableau de bord pour visualiser ces distributions en direct.";
    }

    if (text.includes('cve') || text.includes('critique') || text.includes('menace')) {
      if (criticals === 0) return "Bonne nouvelle, aucun exploit CVE critique n'est visible dans les journaux récents.";
      return `Attention, ${criticals} requêtes utilisent des failles connues (CVE). Je recommande vivement de limiter l'accès externe et d'appliquer les "patches" de sécurité sur les serveurs frontaux.`;
    }

    if (text.includes('bonjour') || text.includes('salut') || text.includes('hello')) {
      return "Bonjour ! Comment puis-je vous aider avec la posture de sécurité de votre SOC ?";
    }

    // Default fallback intelligence
    return `J'analyse actuellement *${total} enregistrements* avec notre moteur d'Intelligence Artificielle. Posez-moi des questions sur nos anomalies (ML), le suivi des IP, ou exigez un résumé des CVE critiques !`;
  };

  const handleSendMessage = (e?: React.FormEvent) => {
    e?.preventDefault();
    if (!inputValue.trim() || isTyping) return;

    const userMsg = inputValue.trim();
    setInputValue('');

    // 1. Add User Message
    const newUserMsg: Message = { id: Date.now().toString(), role: 'user', content: userMsg };
    setMessages(prev => [...prev, newUserMsg]);
    setIsTyping(true);

    // 2. Simulate AI "thinking" time (800ms to 1800ms)
    const delay = Math.floor(Math.random() * 1000) + 800;
    setTimeout(() => {
      const responseContent = generateMockResponse(userMsg, alerts);
      const newBotMsg: Message = { id: (Date.now() + 1).toString(), role: 'assistant', content: responseContent };
      setMessages(prev => [...prev, newBotMsg]);
      setIsTyping(false);
    }, delay);
  };

  // The Floating Chat Widget
  return (
    <div className="fixed bottom-6 right-6 z-50 flex flex-col items-end">
      
      {/* Expanded Chat Window */}
      {isOpen && (
        <div className="w-[350px] sm:w-[400px] max-h-[600px] h-[500px] mb-4 bg-white/95 dark:bg-slate-900/95 backdrop-blur-xl border border-slate-200 dark:border-slate-700 shadow-2xl rounded-2xl flex flex-col overflow-hidden animate-in zoom-in-95 slide-in-from-bottom-5 duration-200">
          
          {/* Header */}
          <div className="bg-gradient-to-r from-blue-600 to-indigo-600 p-4 flex items-center justify-between text-white shadow-md">
            <div className="flex items-center gap-3">
              <div className="bg-white/20 p-1.5 rounded-lg">
                <Sparkles className="w-5 h-5 text-amber-200 animate-pulse" />
              </div>
              <div>
                <h3 className="font-bold tracking-wide leading-none">SOC Copilot AI</h3>
                <span className="text-[10px] text-blue-100 flex items-center gap-1 mt-1">
                  <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse"></span>
                  Agent En Ligne
                </span>
              </div>
            </div>
            <button 
              onClick={() => setIsOpen(false)}
              className="p-1.5 rounded-lg hover:bg-white/20 transition-colors focus:outline-none"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Messages Area */}
          <div className="flex-1 overflow-y-auto p-4 space-y-4 bg-slate-50 dark:bg-slate-950/50">
            {messages.map((msg) => (
              <div key={msg.id} className={`flex w-full ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                <div className={`flex gap-3 max-w-[85%] ${msg.role === 'user' ? 'flex-row-reverse' : 'flex-row'}`}>
                  
                  {/* Avatar */}
                  <div className={`flex-shrink-0 w-8 h-8 rounded-full flex items-center justify-center ${
                    msg.role === 'user' 
                      ? 'bg-indigo-100 dark:bg-indigo-900/50 text-indigo-600 dark:text-indigo-300' 
                      : 'bg-blue-600 text-white shadow-sm shadow-blue-500/30'
                  }`}>
                    {msg.role === 'user' ? <User className="w-4 h-4" /> : <Bot className="w-4 h-4" />}
                  </div>

                  {/* Bubble */}
                  <div className={`px-4 py-2.5 rounded-2xl text-sm leading-relaxed shadow-sm ${
                    msg.role === 'user'
                      ? 'bg-indigo-600 text-white rounded-tr-none'
                      : 'bg-white dark:bg-slate-800 text-slate-800 dark:text-slate-200 border border-slate-100 dark:border-slate-700 rounded-tl-none'
                  }`}>
                    {/* Extremely basic markdown bold rendering for emphasis */}
                    <div dangerouslySetInnerHTML={{ 
                      __html: msg.content
                                .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
                                .replace(/\n/g, '<br/>')
                    }} />
                  </div>
                </div>
              </div>
            ))}
            
            {/* Typing Indicator */}
            {isTyping && (
              <div className="flex w-full justify-start">
                <div className="flex gap-3 max-w-[80%]">
                  <div className="flex-shrink-0 w-8 h-8 rounded-full flex items-center justify-center bg-blue-600 text-white shadow-sm shadow-blue-500/30">
                     <Bot className="w-4 h-4" />
                  </div>
                  <div className="px-5 py-3.5 rounded-2xl rounded-tl-none bg-white dark:bg-slate-800 border border-slate-100 dark:border-slate-700 shadow-sm flex items-center gap-1.5">
                    <span className="w-1.5 h-1.5 bg-blue-400 rounded-full animate-bounce [animation-delay:-0.3s]"></span>
                    <span className="w-1.5 h-1.5 bg-blue-400 rounded-full animate-bounce [animation-delay:-0.15s]"></span>
                    <span className="w-1.5 h-1.5 bg-blue-400 rounded-full animate-bounce"></span>
                  </div>
                </div>
              </div>
            )}
            <div ref={messagesEndRef} />
          </div>

          {/* Input Area */}
          <div className="p-3 bg-white dark:bg-slate-900 border-t border-slate-200 dark:border-slate-800">
            <form onSubmit={handleSendMessage} className="flex gap-2">
              <input
                type="text"
                value={inputValue}
                onChange={(e) => setInputValue(e.target.value)}
                placeholder="Examinez le réseau..."
                className="flex-1 bg-slate-100 dark:bg-slate-800 border-none text-slate-900 dark:text-slate-100 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/50 placeholder:text-slate-400 dark:placeholder:text-slate-500 transition-shadow"
              />
              <button
                type="submit"
                disabled={!inputValue.trim() || isTyping}
                className="p-3 bg-blue-600 text-white rounded-xl hover:bg-blue-700 transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500/50 disabled:opacity-50 disabled:cursor-not-allowed shadow-md shadow-blue-500/20"
              >
                {isTyping ? <Loader2 className="w-5 h-5 animate-spin" /> : <Send className="w-5 h-5" />}
              </button>
            </form>
          </div>

        </div>
      )}

      {/* Floating Button Toggle */}
      {!isOpen && (
        <button
          onClick={() => setIsOpen(true)}
          className="group relative flex items-center justify-center w-14 h-14 bg-gradient-to-r from-blue-600 to-indigo-600 text-white rounded-full shadow-2xl hover:shadow-blue-500/40 hover:scale-105 transition-all duration-300 focus:outline-none focus:ring-4 focus:ring-blue-500/30"
          aria-label="Ouvrir le Copilote IA"
        >
          <Sparkles className="absolute top-2 right-2 w-3 h-3 text-amber-300 animate-pulse hidden group-hover:block" />
          <Bot className="w-6 h-6" />
          
          {/* Notification red dot (optional pulse to draw attention initially) */}
          <span className="absolute flex h-3 w-3 top-0 right-0">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-rose-400 opacity-75"></span>
            <span className="relative inline-flex rounded-full h-3 w-3 bg-rose-500"></span>
          </span>
        </button>
      )}
    </div>
  );
}
