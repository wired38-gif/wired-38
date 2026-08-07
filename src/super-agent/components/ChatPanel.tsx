import React, { useState, useEffect, useRef, useCallback } from "react";
import {
  Send, Bot, User, Copy, Check,
  RefreshCw, Sparkles, AlertCircle, Brain
} from "lucide-react";
import ReactMarkdown from "react-markdown";
import type { SAConversation, SAMessage, OptimizeResult } from "../types";
import { SmartRouter } from "./SmartRouter";

interface Props {
  conversationId: string | null;
  selectedModel: string;
  onConversationCreated: (id: string) => void;
  onConversationUpdated: () => void;
  onNewChat: () => void;
}

interface SmartState {
  loading: boolean;
  result: OptimizeResult | null;
}

function ModelBadge({ model }: { model: string }) {
  let label: string;
  if (model.startsWith("ollama/")) label = `🖥 ${model.replace("ollama/", "")}`;
  else if (model === "apple/foundation") label = " Apple Intelligence";
  else label = model.replace("gemini-", "✦ gemini-");
  return (
    <span className="text-[10px] text-slate-500 font-mono">{label}</span>
  );
}

function MessageBubble({ msg, isLast }: { msg: SAMessage; isLast: boolean }) {
  const [copied, setCopied] = useState(false);

  const copy = useCallback(async () => {
    await navigator.clipboard.writeText(msg.content);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }, [msg.content]);

  if (msg.role === "user") {
    return (
      <div className="flex justify-end">
        <div className="max-w-[80%] lg:max-w-[70%]">
          <div className="bg-violet-600/20 border border-violet-500/30 rounded-2xl rounded-br-sm px-4 py-3">
            <p className="text-sm text-slate-200 whitespace-pre-wrap leading-relaxed">{msg.content}</p>
          </div>
          <div className="flex items-center justify-end gap-2 mt-1">
            <span className="text-[10px] text-slate-600">
              {new Date(msg.timestamp).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
            </span>
            <User size={10} className="text-slate-600" />
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="flex gap-3">
      <div className="w-7 h-7 rounded-full bg-gradient-to-br from-violet-500 to-indigo-600 flex items-center justify-center flex-shrink-0 mt-1">
        <Bot size={13} className="text-white" />
      </div>
      <div className="flex-1 min-w-0">
        <div className="bg-slate-800/60 border border-slate-700/50 rounded-2xl rounded-tl-sm px-4 py-3">
          <div className="prose prose-invert prose-sm max-w-none
            prose-p:leading-relaxed prose-p:my-1
            prose-headings:text-violet-200 prose-headings:font-bold prose-headings:mt-3 prose-headings:mb-1
            prose-code:text-violet-300 prose-code:bg-slate-900 prose-code:px-1 prose-code:py-0.5 prose-code:rounded prose-code:text-xs
            prose-pre:bg-slate-900 prose-pre:border prose-pre:border-slate-700 prose-pre:rounded-lg
            prose-ul:my-1 prose-li:my-0.5
            prose-strong:text-white
            prose-a:text-violet-400 prose-a:underline
          ">
            <ReactMarkdown>{msg.content}</ReactMarkdown>
          </div>
        </div>
        <div className="flex items-center gap-3 mt-1 px-1">
          {msg.model && <ModelBadge model={msg.model} />}
          <span className="text-[10px] text-slate-600">
            {new Date(msg.timestamp).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
          </span>
          <button
            onClick={copy}
            className="ml-auto flex items-center gap-1 text-[10px] text-slate-600 hover:text-slate-300 transition-colors"
          >
            {copied ? <Check size={10} className="text-emerald-400" /> : <Copy size={10} />}
            {copied ? "copied" : "copy"}
          </button>
        </div>
      </div>
    </div>
  );
}

// SmartRouter component (imported above) replaces the old PromptOptimizerCard

export function ChatPanel({ conversationId, selectedModel, onConversationCreated, onConversationUpdated, onNewChat }: Props) {
  const [conversation, setConversation] = useState<SAConversation | null>(null);
  const [input, setInput] = useState("");
  const [sending, setSending] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [smart, setSmart] = useState<SmartState>({ loading: false, result: null });
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  const scrollToBottom = useCallback(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, []);

  const loadConversation = useCallback(async (id: string) => {
    try {
      const r = await fetch(`/api/sa/conversations/${id}`);
      if (!r.ok) return;
      const data = await r.json() as SAConversation;
      setConversation(data);
    } catch {
      // ignore
    }
  }, []);

  useEffect(() => {
    if (conversationId) {
      loadConversation(conversationId);
      setSmart({ loading: false, result: null });
    } else {
      setConversation(null);
    }
  }, [conversationId, loadConversation]);

  useEffect(() => {
    scrollToBottom();
  }, [conversation?.messages.length, scrollToBottom]);

  const sendMessage = useCallback(async (text: string) => {
    if (!text.trim() || sending) return;
    setError(null);
    setSending(true);
    setSmart({ loading: false, result: null });

    let targetId = conversationId;

    if (!targetId) {
      const r = await fetch("/api/sa/conversations", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ title: text.slice(0, 60) }),
      });
      const conv = await r.json() as { id: string };
      targetId = conv.id;
      onConversationCreated(targetId);
    }

    // Optimistically add user message
    const tempUserMsg: SAMessage = {
      id: `temp-${Date.now()}`,
      role: "user",
      content: text,
      timestamp: new Date().toISOString(),
    };
    setConversation(prev => prev
      ? { ...prev, messages: [...prev.messages, tempUserMsg] }
      : {
          id: targetId!,
          title: text.slice(0, 60),
          messages: [tempUserMsg],
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        }
    );

    try {
      const r = await fetch(`/api/sa/conversations/${targetId}/messages`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ message: text, model: selectedModel }),
      });

      if (!r.ok) {
        const data = await r.json() as { error: string };
        throw new Error(data.error || "Failed to get response");
      }

      const data = await r.json() as { message: SAMessage; conversation: { id: string; title: string } };

      // Reload the full conversation to get accurate state
      await loadConversation(targetId!);
      onConversationUpdated();
    } catch (err: any) {
      setError(err.message || "Failed to send message");
      // Remove optimistic user message
      setConversation(prev => prev
        ? { ...prev, messages: prev.messages.filter(m => m.id !== tempUserMsg.id) }
        : null
      );
    } finally {
      setSending(false);
    }
  }, [conversationId, sending, selectedModel, onConversationCreated, onConversationUpdated, loadConversation]);

  const handleKeyDown = useCallback((e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      sendMessage(input);
      setInput("");
    }
  }, [input, sendMessage]);

  const handleSubmit = useCallback(() => {
    sendMessage(input);
    setInput("");
  }, [input, sendMessage]);

  const analyzePrompt = useCallback(async () => {
    if (!input.trim()) return;
    setSmart({ loading: true, result: null });
    try {
      const r = await fetch("/api/sa/optimize-prompt", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ rawPrompt: input }),
      });
      const data = await r.json() as OptimizeResult;
      setSmart({ loading: false, result: data });
    } catch {
      setSmart({ loading: false, result: null });
    }
  }, [input]);

  const useVariant = useCallback((text: string, model: string) => {
    setInput(text);
    setSmart({ loading: false, result: null });
    textareaRef.current?.focus();
  }, []);

  const autoResize = useCallback((e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setInput(e.target.value);
    e.target.style.height = "auto";
    e.target.style.height = `${Math.min(e.target.scrollHeight, 200)}px`;
  }, []);

  const messages = conversation?.messages ?? [];

  return (
    <div className="h-full flex flex-col">
      {/* Messages */}
      <div className="flex-1 overflow-y-auto">
        {messages.length === 0 ? (
          <div className="h-full flex flex-col items-center justify-center px-6 text-center">
          <div className="relative mb-5">
            <div className="w-20 h-20 bg-gradient-to-br from-violet-500 to-indigo-600 rounded-2xl flex items-center justify-center mx-auto shadow-2xl shadow-violet-900/50">
              <Brain size={34} className="text-white" />
            </div>
            <div className="absolute -inset-1 bg-gradient-to-br from-violet-500 to-indigo-600 rounded-2xl blur opacity-20 animate-pulse" />
          </div>
          <h2 className="text-xl font-black text-white mb-1">MYK Super Agent</h2>
          <p className="text-xs text-violet-400 mb-3 font-mono">SA.Mykbrands.com · Designs by Myk LLC</p>
          <p className="text-sm text-slate-400 max-w-md leading-relaxed mb-6">
            Your unified AI with memory across all MYK projects. Type anything — hit <kbd className="px-1 py-0.5 bg-slate-800 border border-slate-700 rounded text-[10px] font-mono">Analyze</kbd> first for optimized prompts + best agent recommendations.
          </p>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 max-w-lg w-full">
            {[
              { text: "What are all MYK's current projects?", emoji: "🏗️" },
              { text: "Give me the best prompt for building a React component", emoji: "⚡" },
              { text: "Compare Gemini vs Claude vs Apple AI for my use case", emoji: "🤖" },
              { text: "Summarize everything in my knowledge base", emoji: "🧠" },
            ].map(s => (
              <button
                key={s.text}
                onClick={() => { setInput(s.text); textareaRef.current?.focus(); }}
                className="px-3 py-2.5 text-xs text-left text-slate-400 bg-slate-800/40 border border-slate-700/60 rounded-xl hover:bg-violet-500/10 hover:border-violet-500/40 hover:text-slate-200 transition-all group"
              >
                <span className="mr-2">{s.emoji}</span>
                <span className="group-hover:text-white transition-colors">{s.text}</span>
              </button>
            ))}
            </div>
          </div>
        ) : (
          <div className="px-4 py-4 space-y-6 max-w-4xl mx-auto">
            {messages.map((msg, i) => (
              <MessageBubble key={msg.id} msg={msg} isLast={i === messages.length - 1} />
            ))}
            {sending && (
              <div className="flex gap-3">
                <div className="w-7 h-7 rounded-full bg-gradient-to-br from-violet-500 to-indigo-600 flex items-center justify-center flex-shrink-0">
                  <Bot size={13} className="text-white" />
                </div>
                <div className="bg-slate-800/60 border border-slate-700/50 rounded-2xl rounded-tl-sm px-4 py-3">
                  <div className="flex gap-1">
                    {[0, 1, 2].map(i => (
                      <div
                        key={i}
                        className="w-1.5 h-1.5 bg-violet-400 rounded-full animate-bounce"
                        style={{ animationDelay: `${i * 0.15}s` }}
                      />
                    ))}
                  </div>
                </div>
              </div>
            )}
            <div ref={messagesEndRef} />
          </div>
        )}
      </div>

      {/* Error */}
      {error && (
        <div className="mx-4 mb-2 flex items-center gap-2 px-3 py-2 bg-red-500/10 border border-red-500/30 rounded-lg">
          <AlertCircle size={13} className="text-red-400 flex-shrink-0" />
          <p className="text-xs text-red-300">{error}</p>
          <button onClick={() => setError(null)} className="ml-auto text-red-500 hover:text-red-300">
            <RefreshCw size={11} />
          </button>
        </div>
      )}

      {/* Smart Analysis Results */}
      {smart.result && (
        <SmartRouter
          result={smart.result}
          rawPrompt={input}
          onUseVariant={useVariant}
          onSendDirect={() => { handleSubmit(); setSmart({ loading: false, result: null }); }}
          loading={sending}
        />
      )}

      {/* Input area */}
      <div className="flex-shrink-0 border-t border-slate-800 bg-slate-950">
        <div className="max-w-4xl mx-auto px-4 py-3">
          <div className="flex gap-3 items-end">
            <div className="flex-1 bg-slate-800 border border-slate-700 focus-within:border-violet-500 rounded-xl transition-colors">
              <textarea
                ref={textareaRef}
                value={input}
                onChange={autoResize}
                onKeyDown={handleKeyDown}
                placeholder="Ask anything… or hit Analyze for optimized prompts + best agent (Enter to send)"
                rows={1}
                className="w-full bg-transparent px-4 py-3 text-sm text-slate-200 placeholder-slate-600 resize-none focus:outline-none leading-relaxed"
                style={{ minHeight: "46px", maxHeight: "200px" }}
              />
              {/* Toolbar */}
              <div className="flex items-center gap-2 px-3 pb-2">
                <button
                  onClick={analyzePrompt}
                  disabled={!input.trim() || smart.loading}
                  title="Analyze + get optimized prompts with agent recommendations"
                  className="flex items-center gap-1.5 text-[11px] text-slate-500 hover:text-violet-400 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
                >
                  {smart.loading ? (
                    <RefreshCw size={12} className="animate-spin text-violet-400" />
                  ) : (
                    <Brain size={12} />
                  )}
                  Analyze
                </button>
                <span className="text-slate-700 text-[10px] ml-auto">
                  {input.length > 0 && `${input.length} chars`}
                </span>
              </div>
            </div>
            <button
              onClick={handleSubmit}
              disabled={!input.trim() || sending}
              className="flex-shrink-0 w-10 h-10 bg-gradient-to-br from-violet-600 to-indigo-600 hover:from-violet-500 hover:to-indigo-500 disabled:from-slate-700 disabled:to-slate-700 disabled:cursor-not-allowed rounded-xl flex items-center justify-center transition-all shadow-md shadow-violet-900/30"
            >
              <Send size={16} className="text-white" />
            </button>
          </div>
          <p className="text-[10px] text-slate-700 text-center mt-1">
            <span className="text-violet-800">↑ Analyze</span> for optimized prompts &amp; agent routing · Enter to send · MYK Super Agent
          </p>
        </div>
      </div>
    </div>
  );
}
