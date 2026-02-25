import { useEffect, useState, useRef, useCallback } from 'react';
import Layout from '@/components/Layout';
import Spinner from '@/components/Spinner';
import { socialApi } from '@/api';
import { useAuthStore } from '@/stores/authStore';
import type { ChatThread, ChatMessage } from '@/types';
import { Send, MessageSquare, Plus } from 'lucide-react';
import { toast } from 'sonner';
import { createHubConnection } from '@/lib/signalr';
import type { HubConnection } from '@microsoft/signalr';

export default function Chat() {
  const { user } = useAuthStore();
  const [threads, setThreads] = useState<ChatThread[]>([]);
  const [activeThread, setActiveThread] = useState<string | null>(null);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const [newThreadName, setNewThreadName] = useState('');
  const [showNew, setShowNew] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const hubRef = useRef<HubConnection | null>(null);

  const loadThreads = useCallback(async () => {
    try {
      const t = await socialApi.getThreads();
      setThreads(t);
    } catch {} finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { loadThreads(); }, [loadThreads]);

  useEffect(() => {
    const hub = createHubConnection('/hubs/chat');
    hubRef.current = hub;

    hub.start().then(() => {
      hub.on('NewMessage', (msg: ChatMessage) => {
        setMessages((prev) => {
          if (prev.some((m) => m.id === msg.id)) return prev;
          return [...prev, msg];
        });
        setThreads((prev) =>
          prev.map((t) =>
            t.threadId === msg.threadId
              ? { ...t, lastMessage: msg.content, lastMessageAt: msg.sentAt, unreadCount: msg.senderUserName !== user?.userName ? t.unreadCount + 1 : t.unreadCount }
              : t
          )
        );
      });
    }).catch(() => {});

    return () => { hub.stop(); };
  }, [user?.userName]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const selectThread = async (threadId: string) => {
    setActiveThread(threadId);
    try {
      const msgs = await socialApi.getMessages(threadId);
      setMessages(msgs);
      setThreads((prev) => prev.map((t) => t.threadId === threadId ? { ...t, unreadCount: 0 } : t));
    } catch {
      toast.error('Failed to load messages');
    }
  };

  const handleSend = async () => {
    if (!input.trim() || !activeThread) return;
    setSending(true);
    try {
      const msg = await socialApi.sendMessage(activeThread, input.trim());
      setMessages((prev) => [...prev, msg]);
      setInput('');
    } catch {
      toast.error('Failed to send');
    } finally {
      setSending(false);
    }
  };

  const handleNewThread = async () => {
    if (!newThreadName.trim()) return;
    try {
      const thread = await socialApi.startThread(newThreadName.trim());
      setThreads((prev) => [thread, ...prev]);
      setActiveThread(thread.threadId);
      setMessages([]);
      setNewThreadName('');
      setShowNew(false);
    } catch {
      toast.error('Failed to start conversation');
    }
  };

  const activeInfo = threads.find((t) => t.threadId === activeThread);

  if (loading) return <Layout><div className="min-h-[60vh] flex items-center justify-center"><Spinner text="Loading chats..." /></div></Layout>;

  return (
    <Layout>
      <div className="flex gap-4 h-[calc(100vh-7rem)]">
        <div className="w-72 shrink-0 flex flex-col">
          <div className="flex items-center justify-between mb-3">
            <h2 className="text-sm font-semibold text-zinc-400">CONVERSATIONS</h2>
            <button onClick={() => setShowNew(!showNew)} className="p-1.5 text-zinc-500 hover:text-white rounded hover:bg-zinc-800 transition-all">
              <Plus className="w-4 h-4" />
            </button>
          </div>

          {showNew && (
            <div className="card p-3 mb-3">
              <div className="flex gap-2">
                <input
                  type="text"
                  value={newThreadName}
                  onChange={(e) => setNewThreadName(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && handleNewThread()}
                  className="input text-xs flex-1"
                  placeholder="Username..."
                />
                <button onClick={handleNewThread} className="btn-primary text-xs px-2">Go</button>
              </div>
            </div>
          )}

          <div className="flex-1 overflow-y-auto space-y-1">
            {threads.length === 0 ? (
              <div className="text-center py-10">
                <MessageSquare className="w-10 h-10 text-zinc-700 mx-auto mb-2" />
                <p className="text-zinc-600 text-xs">No conversations yet</p>
              </div>
            ) : threads.map((t) => (
              <button
                key={t.threadId}
                onClick={() => selectThread(t.threadId)}
                className={`w-full text-left p-3 rounded-lg transition-all cursor-pointer ${activeThread === t.threadId ? 'bg-sky-600/15 border border-sky-500/20' : 'hover:bg-zinc-800/60 border border-transparent'}`}
              >
                <div className="flex items-center justify-between mb-0.5">
                  <span className="text-white text-sm font-medium truncate">{t.withDisplayName || t.withUserName}</span>
                  {t.unreadCount > 0 && (
                    <span className="w-5 h-5 bg-sky-500 text-white text-[10px] font-bold rounded-full flex items-center justify-center shrink-0">{t.unreadCount}</span>
                  )}
                </div>
                {t.lastMessage && <p className="text-zinc-500 text-xs truncate">{t.lastMessage}</p>}
              </button>
            ))}
          </div>
        </div>

        <div className="flex-1 card flex flex-col overflow-hidden">
          {!activeThread ? (
            <div className="flex-1 flex items-center justify-center">
              <div className="text-center">
                <MessageSquare className="w-14 h-14 text-zinc-700 mx-auto mb-3" />
                <p className="text-zinc-500 text-sm">Select a conversation</p>
              </div>
            </div>
          ) : (
            <>
              <div className="px-4 py-3 border-b border-zinc-800/60 shrink-0">
                <p className="text-white font-semibold text-sm">{activeInfo?.withDisplayName || activeInfo?.withUserName}</p>
                <p className="text-zinc-600 text-xs">@{activeInfo?.withUserName}</p>
              </div>

              <div className="flex-1 overflow-y-auto p-4 space-y-3">
                {messages.length === 0 ? (
                  <p className="text-zinc-600 text-xs text-center py-10">No messages yet. Say hi!</p>
                ) : messages.map((m) => {
                  const isMe = m.senderUserName === user?.userName;
                  return (
                    <div key={m.id} className={`flex ${isMe ? 'justify-end' : 'justify-start'}`}>
                      <div className={`max-w-[70%] px-3.5 py-2 rounded-2xl text-sm ${isMe ? 'bg-sky-600 text-white rounded-br-md' : 'bg-zinc-800 text-zinc-200 rounded-bl-md'}`}>
                        <p>{m.content}</p>
                        <p className={`text-[10px] mt-1 ${isMe ? 'text-sky-200/60' : 'text-zinc-600'}`}>
                          {new Date(m.sentAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                        </p>
                      </div>
                    </div>
                  );
                })}
                <div ref={messagesEndRef} />
              </div>

              <div className="p-3 border-t border-zinc-800/60 shrink-0">
                <div className="flex gap-2">
                  <input
                    type="text"
                    value={input}
                    onChange={(e) => setInput(e.target.value)}
                    onKeyDown={(e) => e.key === 'Enter' && !e.shiftKey && handleSend()}
                    className="input flex-1"
                    placeholder="Type a message..."
                  />
                  <button onClick={handleSend} disabled={sending || !input.trim()} className="btn-primary px-3">
                    <Send className="w-4 h-4" />
                  </button>
                </div>
              </div>
            </>
          )}
        </div>
      </div>
    </Layout>
  );
}