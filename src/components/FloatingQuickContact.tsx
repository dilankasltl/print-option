'use client';

import React, { useState, useRef, useEffect } from 'react';
import {
  Phone,
  MessageCircle,
  X,
  Send,
  Bot,
  User,
  Sparkles,
  RefreshCw,
  Trash2,
  ExternalLink,
} from 'lucide-react';

interface ChatMsg {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  time: string;
}

export default function FloatingQuickContact() {
  const [isChatOpen, setIsChatOpen] = useState(false);
  const [messages, setMessages] = useState<ChatMsg[]>([
    {
      id: 'welcome',
      role: 'assistant',
      content:
        '👋 **ආයුබෝවන්! මම PRINT OPTION AI Assistant.**\n\nඔබට අවශ්‍ය ඕනෑම දෙයක් මෙතැනින් අසන්න:\n• භාණ්ඩ වල Live Stock සහ මිල ගණන්\n• බිලක් දමන ආකාරය (Stock OUT)\n• දෛනික Cash Balancing පියවර\n• Hotline: **+94 71 723 7290**',
      time: new Date().toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' }),
    },
  ]);
  const [inputText, setInputText] = useState('');
  const [isTyping, setIsTyping] = useState(false);

  const messagesEndRef = useRef<HTMLDivElement>(null);
  const phoneNumber = '+94 71 723 7290';
  const whatsappUrl = 'https://wa.me/94717237290?text=Hello%20PRINT%20OPTION';
  const callUrl = 'tel:+94717237290';

  const quickPrompts = [
    '📦 Stock OUT කරන්නේ කොහොමද?',
    '💰 Cash Balance පියවර මොනවාද?',
    '📞 Contact & WhatsApp Number',
    '📊 Excel File Upload කරන්නේ කොහොමද?',
  ];

  // Auto-scroll to bottom of messages
  useEffect(() => {
    if (isChatOpen) {
      messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }
  }, [messages, isTyping, isChatOpen]);

  const handleSendMessage = async (textToSend?: string) => {
    const text = textToSend || inputText;
    if (!text.trim() || isTyping) return;

    const userMsg: ChatMsg = {
      id: Date.now().toString(),
      role: 'user',
      content: text.trim(),
      time: new Date().toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' }),
    };

    setMessages((prev) => [...prev, userMsg]);
    setInputText('');
    setIsTyping(true);

    try {
      const res = await fetch('/api/assistant', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ message: text }),
      });

      const data = await res.json();
      const botReply: ChatMsg = {
        id: (Date.now() + 1).toString(),
        role: 'assistant',
        content: data.reply || 'සමාවන්න, පිළිතුර ලබාගැනීමට නොහැකි විය.',
        time: new Date().toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' }),
      };

      setMessages((prev) => [...prev, botReply]);
    } catch {
      setMessages((prev) => [
        ...prev,
        {
          id: (Date.now() + 1).toString(),
          role: 'assistant',
          content: 'කණගාටුයි, සම්බන්ධතාවයේ දෝෂයක් ඇත. කරුණාකර නැවත උත්සාහ කරන්න.',
          time: new Date().toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' }),
        },
      ]);
    } finally {
      setIsTyping(false);
    }
  };

  const handleClearChat = () => {
    setMessages([
      {
        id: 'welcome-new',
        role: 'assistant',
        content: 'චැට් ඉතිහාසය පිරිසිදු කළා. මගෙන් ඕනෑම දෙයක් අහන්න! 😊',
        time: new Date().toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' }),
      },
    ]);
  };

  return (
    <div className="fixed bottom-6 right-6 z-50 no-print flex flex-col items-end gap-3">
      {/* Mini ChatGPT Floating Window */}
      {isChatOpen && (
        <div className="w-[90vw] sm:w-[380px] h-[520px] max-h-[82vh] bg-slate-900/95 border border-slate-700/80 backdrop-blur-2xl rounded-3xl shadow-2xl shadow-black/80 flex flex-col overflow-hidden animate-in fade-in slide-in-from-bottom-5 duration-200">
          
          {/* Header */}
          <div className="p-3.5 sm:p-4 bg-gradient-to-r from-slate-900 via-slate-850 to-slate-900 border-b border-slate-800 flex items-center justify-between shrink-0">
            <div className="flex items-center gap-2.5">
              <div className="relative">
                <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-cyan-500 via-sky-500 to-indigo-600 flex items-center justify-center text-white shadow-md shadow-sky-500/30">
                  <Bot className="w-5 h-5 animate-pulse" />
                </div>
                <span className="absolute -bottom-0.5 -right-0.5 w-2.5 h-2.5 rounded-full bg-emerald-500 border-2 border-slate-900" />
              </div>
              <div>
                <div className="flex items-center gap-1.5">
                  <h4 className="font-bold text-xs sm:text-sm text-white">PRINT OPTION AI</h4>
                  <span className="text-[9px] font-bold px-1.5 py-0.2 rounded bg-sky-500/20 text-cyan-400 border border-sky-500/30 font-mono">
                    GPT Bot
                  </span>
                </div>
                <p className="text-[10px] text-emerald-400 flex items-center gap-1">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-ping" />
                  Online &bull; Instant Support
                </p>
              </div>
            </div>

            {/* Quick Actions in Header */}
            <div className="flex items-center gap-1.5">
              <a
                href={callUrl}
                className="p-1.5 rounded-lg bg-sky-600/20 hover:bg-sky-600/30 text-sky-400 hover:text-sky-300 transition"
                title={`Call ${phoneNumber}`}
              >
                <Phone className="w-3.5 h-3.5" />
              </a>
              <a
                href={whatsappUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="p-1.5 rounded-lg bg-emerald-600/20 hover:bg-emerald-600/30 text-emerald-400 hover:text-emerald-300 transition"
                title="WhatsApp Chat"
              >
                <MessageCircle className="w-3.5 h-3.5" />
              </a>
              <button
                onClick={handleClearChat}
                className="p-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-white transition"
                title="Clear Chat"
              >
                <Trash2 className="w-3.5 h-3.5" />
              </button>
              <button
                onClick={() => setIsChatOpen(false)}
                className="p-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-white transition"
                title="Close Chat"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          </div>

          {/* Messages Body */}
          <div className="flex-1 overflow-y-auto p-4 space-y-3.5 text-xs">
            {messages.map((m) => {
              const isUser = m.role === 'user';
              return (
                <div
                  key={m.id}
                  className={`flex gap-2.5 ${isUser ? 'justify-end' : 'justify-start'}`}
                >
                  {!isUser && (
                    <div className="w-7 h-7 rounded-lg bg-cyan-600/30 border border-cyan-500/40 text-cyan-300 flex items-center justify-center shrink-0 mt-0.5">
                      <Sparkles className="w-3.5 h-3.5" />
                    </div>
                  )}

                  <div
                    className={`max-w-[82%] rounded-2xl p-3 shadow-md ${
                      isUser
                        ? 'bg-gradient-to-r from-sky-600 to-cyan-600 text-white rounded-br-none'
                        : 'bg-slate-850 bg-slate-800/90 text-slate-200 border border-slate-700/70 rounded-bl-none'
                    }`}
                  >
                    <div className="whitespace-pre-wrap leading-relaxed text-[11px] sm:text-xs">
                      {m.content}
                    </div>
                    <span
                      className={`block text-[9px] mt-1.5 font-mono ${
                        isUser ? 'text-sky-200/80 text-right' : 'text-slate-500'
                      }`}
                    >
                      {m.time}
                    </span>
                  </div>

                  {isUser && (
                    <div className="w-7 h-7 rounded-lg bg-slate-800 border border-slate-700 text-slate-300 flex items-center justify-center shrink-0 mt-0.5">
                      <User className="w-3.5 h-3.5" />
                    </div>
                  )}
                </div>
              );
            })}

            {/* Typing Indicator */}
            {isTyping && (
              <div className="flex items-center gap-2 text-slate-400">
                <div className="w-7 h-7 rounded-lg bg-cyan-600/30 text-cyan-300 flex items-center justify-center">
                  <Bot className="w-3.5 h-3.5 animate-spin" />
                </div>
                <div className="bg-slate-800 border border-slate-700 px-3 py-2 rounded-2xl rounded-bl-none flex items-center gap-1">
                  <span className="w-1.5 h-1.5 rounded-full bg-cyan-400 animate-bounce" />
                  <span className="w-1.5 h-1.5 rounded-full bg-cyan-400 animate-bounce delay-100" />
                  <span className="w-1.5 h-1.5 rounded-full bg-cyan-400 animate-bounce delay-200" />
                </div>
              </div>
            )}

            <div ref={messagesEndRef} />
          </div>

          {/* Suggested Quick Question Chips */}
          <div className="px-3 py-2 bg-slate-950/60 border-t border-slate-800/80 flex items-center gap-1.5 overflow-x-auto scrollbar-none shrink-0">
            {quickPrompts.map((prompt, idx) => (
              <button
                key={idx}
                onClick={() => handleSendMessage(prompt)}
                disabled={isTyping}
                className="px-2.5 py-1 rounded-lg bg-slate-800/80 hover:bg-slate-700 text-slate-300 hover:text-white border border-slate-700/60 text-[10px] whitespace-nowrap transition disabled:opacity-40"
              >
                {prompt}
              </button>
            ))}
          </div>

          {/* Message Input Box */}
          <form
            onSubmit={(e) => {
              e.preventDefault();
              handleSendMessage();
            }}
            className="p-2.5 sm:p-3 bg-slate-900 border-t border-slate-800 flex items-center gap-2 shrink-0"
          >
            <input
              type="text"
              value={inputText}
              onChange={(e) => setInputText(e.target.value)}
              placeholder="Ask anything in Sinhala or English..."
              disabled={isTyping}
              className="flex-1 px-3.5 py-2 rounded-xl bg-slate-950 border border-slate-700/80 text-white placeholder-slate-500 text-xs focus:ring-1 focus:ring-sky-500 focus:outline-none"
            />
            <button
              type="submit"
              disabled={!inputText.trim() || isTyping}
              className="p-2.5 rounded-xl bg-gradient-to-r from-sky-600 to-cyan-600 hover:from-sky-500 hover:to-cyan-500 text-white disabled:opacity-40 shadow-md shadow-sky-600/30 transition-all shrink-0"
              title="Send Message"
            >
              <Send className="w-3.5 h-3.5" />
            </button>
          </form>
        </div>
      )}

      {/* Floating Pill Trigger on Screen Bottom Right */}
      <div className="flex items-center gap-2 bg-slate-900/90 border border-slate-700/80 backdrop-blur-md p-1.5 rounded-full shadow-2xl shadow-sky-500/10 hover:border-slate-600 transition">
        <a
          href={callUrl}
          className="w-10 h-10 rounded-full bg-sky-600 hover:bg-sky-500 text-white flex items-center justify-center shadow-lg shadow-sky-600/30 hover:scale-105 transition-transform"
          title={`Call ${phoneNumber}`}
        >
          <Phone className="w-4 h-4" />
        </a>

        <a
          href={whatsappUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="w-10 h-10 rounded-full bg-emerald-600 hover:bg-emerald-500 text-white flex items-center justify-center shadow-lg shadow-emerald-600/30 hover:scale-105 transition-transform"
          title="WhatsApp +94 71 723 7290"
        >
          <MessageCircle className="w-4 h-4" />
        </a>

        {/* AI ChatGPT Bot Button */}
        <button
          onClick={() => setIsChatOpen(!isChatOpen)}
          className={`px-3 py-2 text-xs font-bold rounded-full flex items-center gap-1.5 transition-all shadow-md ${
            isChatOpen
              ? 'bg-gradient-to-r from-cyan-500 to-indigo-600 text-white shadow-cyan-500/30'
              : 'bg-slate-800 text-cyan-300 hover:bg-slate-700 hover:text-white'
          }`}
          title="Open AI Chat Assistant"
        >
          <Sparkles className="w-3.5 h-3.5 text-cyan-400 animate-spin-slow" />
          <span>AI Help</span>
        </button>
      </div>
    </div>
  );
}
