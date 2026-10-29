"use client";

import { useEffect, useMemo, useRef, useState } from 'react';
import { formatDate } from '@/lib/utils';

type User = {
  id: string;
  email: string;
  name: string | null;
};

type MessageItem = {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  language: string;
  createdAt: string;
};

type Conversation = {
  id: string;
  title: string;
  createdAt: string;
  updatedAt: string;
  messages: MessageItem[];
};

type Note = {
  id: string;
  title: string;
  content: string;
  createdAt: string;
  updatedAt: string;
};

type Memory = {
  id: string;
  content: string;
  createdAt: string;
};

const defaultAuth = { name: '', email: '', password: '' };

export default function HomePage() {
  const [authMode, setAuthMode] = useState<'login' | 'register'>('login');
  const [authForm, setAuthForm] = useState(defaultAuth);
  const [user, setUser] = useState<User | null>(null);
  const [loadingAuth, setLoadingAuth] = useState(true);
  const [message, setMessage] = useState('');
  const [language, setLanguage] = useState<'en' | 'hi'>('en');
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [selectedConversationId, setSelectedConversationId] = useState<string | null>(null);
  const [messages, setMessages] = useState<MessageItem[]>([]);
  const [notes, setNotes] = useState<Note[]>([]);
  const [noteTitle, setNoteTitle] = useState('My Note');
  const [noteContent, setNoteContent] = useState('');
  const [searchText, setSearchText] = useState('');
  const [memories, setMemories] = useState<Memory[]>([]);
  const [isSending, setIsSending] = useState(false);
  const [isListening, setIsListening] = useState(false);
  const recognitionRef = useRef<any>(null);

  const currentConversation = useMemo(
    () => conversations.find((item) => item.id === selectedConversationId) ?? null,
    [conversations, selectedConversationId]
  );

  useEffect(() => {
    loadUser();
  }, []);

  useEffect(() => {
    if (!user) return;
    loadHistory();
    loadNotes();
    loadMemories();
  }, [user, searchText]);

  useEffect(() => {
    const nextMessages = currentConversation?.messages ?? [];
    setMessages(nextMessages);
  }, [currentConversation]);

  async function loadUser() {
    try {
      const response = await fetch('/api/auth/me', { cache: 'no-store' });
      if (!response.ok) {
        setUser(null);
        setLoadingAuth(false);
        return;
      }

      const data = await response.json();
      setUser(data.user);
      setLoadingAuth(false);
    } catch (error) {
      setUser(null);
      setLoadingAuth(false);
    }
  }

  async function loadHistory() {
    if (!user) return;
    try {
      const response = await fetch(`/api/history?q=${encodeURIComponent(searchText)}`, { cache: 'no-store' });
      if (!response.ok) return;
      const data = await response.json();
      setConversations(data.conversations ?? []);

      if (!selectedConversationId && data.conversations.length > 0) {
        setSelectedConversationId(data.conversations[0].id);
      }
    } catch (error) {
      console.error(error);
    }
  }

  async function loadNotes() {
    if (!user) return;
    try {
      const response = await fetch(`/api/notes?q=${encodeURIComponent(searchText)}`, { cache: 'no-store' });
      if (!response.ok) return;
      const data = await response.json();
      setNotes(data.notes ?? []);
    } catch (error) {
      console.error(error);
    }
  }

  async function loadMemories() {
    if (!user) return;
    try {
      const response = await fetch('/api/memory', { cache: 'no-store' });
      if (!response.ok) return;
      const data = await response.json();
      setMemories(data.memories ?? []);
    } catch (error) {
      console.error(error);
    }
  }

  async function handleAuthSubmit(event: React.FormEvent) {
    event.preventDefault();

    const endpoint = authMode === 'login' ? '/api/auth/login' : '/api/auth/register';
    const payload = authMode === 'login' ? { email: authForm.email, password: authForm.password } : authForm;

    const response = await fetch(endpoint, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload)
    });

    const data = await response.json();
    if (!response.ok) {
      alert(data.error || 'Authentication failed.');
      return;
    }

    setAuthForm(defaultAuth);
    await loadUser();
  }

  async function handleLogout() {
    await fetch('/api/auth/logout', { method: 'POST' });
    setUser(null);
    setMessages([]);
    setConversations([]);
    setNotes([]);
    setMemories([]);
  }

  async function sendMessage() {
    if (!message.trim() || !user) return;

    setIsSending(true);

    try {
      const response = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          message,
          language,
          conversationId: selectedConversationId
        })
      });

      const data = await response.json();
      if (!response.ok) {
        throw new Error(data.error || 'Unable to send message.');
      }

      setSelectedConversationId(data.conversationId);
      setMessage('');
      await loadHistory();
      await loadMemories();
      if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
        const utterance = new SpeechSynthesisUtterance(data.reply);
        utterance.lang = language === 'hi' ? 'hi-IN' : 'en-US';
        window.speechSynthesis.cancel();
        window.speechSynthesis.speak(utterance);
      }
    } catch (error) {
      alert(error instanceof Error ? error.message : 'Chat error');
    } finally {
      setIsSending(false);
    }
  }

  async function saveNote() {
    if (!noteTitle.trim() || !noteContent.trim() || !user) return;

    try {
      const response = await fetch('/api/notes', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ title: noteTitle, content: noteContent })
      });

      if (!response.ok) {
        throw new Error('Unable to save note.');
      }

      setNoteTitle('My Note');
      setNoteContent('');
      await loadNotes();
    } catch (error) {
      alert(error instanceof Error ? error.message : 'Note error');
    }
  }

  async function deleteNote(noteId: string) {
    if (!user) return;
    const response = await fetch(`/api/notes/${noteId}`, { method: 'DELETE' });
    if (response.ok) {
      await loadNotes();
    }
  }

  function startListening() {
    const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;

    if (!SpeechRecognition) {
      alert('Speech recognition is not supported in this browser.');
      return;
    }

    const recognition = new SpeechRecognition();
    recognition.lang = language === 'hi' ? 'hi-IN' : 'en-US';
    recognition.interimResults = false;
    recognition.maxAlternatives = 1;

    recognition.onresult = (event: any) => {
      const transcript = event.results[0][0].transcript;
      setMessage((prev) => (prev ? `${prev} ${transcript}` : transcript));
    };

    recognition.onend = () => setIsListening(false);
    recognition.onerror = () => setIsListening(false);

    recognition.start();
    setIsListening(true);
    recognitionRef.current = recognition;
  }

  const authCard = (
    <div className="min-h-screen bg-aurora text-white flex items-center justify-center p-4">
      <div className="w-full max-w-md rounded-3xl border border-white/10 bg-slate-900/70 p-8 shadow-glow backdrop-blur-xl">
        <div className="mb-8 text-center">
          <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-cyan-500/20 text-3xl shadow-glow">🤖</div>
          <h1 className="text-3xl font-bold text-cyan-300">CHIRANJEEVI JARVIS AI</h1>
          <p className="mt-3 text-sm text-slate-300">Secure personal assistant with multilingual AI support</p>
        </div>

        <div className="mb-6 flex rounded-full border border-cyan-500/30 bg-slate-800/70 p-1">
          <button
            className={`flex-1 rounded-full px-4 py-2 text-sm font-semibold ${authMode === 'login' ? 'bg-cyan-500 text-slate-950' : 'text-slate-300'}`}
            onClick={() => setAuthMode('login')}
          >
            Login
          </button>
          <button
            className={`flex-1 rounded-full px-4 py-2 text-sm font-semibold ${authMode === 'register' ? 'bg-cyan-500 text-slate-950' : 'text-slate-300'}`}
            onClick={() => setAuthMode('register')}
          >
            Register
          </button>
        </div>

        <form onSubmit={handleAuthSubmit} className="space-y-4">
          {authMode === 'register' && (
            <div>
              <label className="mb-2 block text-sm text-slate-300">Your name</label>
              <input
                className="w-full rounded-xl border border-slate-700 bg-slate-950/60 px-4 py-3 text-white outline-none ring-0 placeholder:text-slate-500"
                value={authForm.name}
                onChange={(e) => setAuthForm({ ...authForm, name: e.target.value })}
                placeholder="Chiranjeevi"
              />
            </div>
          )}

          <div>
            <label className="mb-2 block text-sm text-slate-300">Email</label>
            <input
              type="email"
              className="w-full rounded-xl border border-slate-700 bg-slate-950/60 px-4 py-3 text-white outline-none placeholder:text-slate-500"
              value={authForm.email}
              onChange={(e) => setAuthForm({ ...authForm, email: e.target.value })}
              placeholder="you@example.com"
            />
          </div>

          <div>
            <label className="mb-2 block text-sm text-slate-300">Password</label>
            <input
              type="password"
              className="w-full rounded-xl border border-slate-700 bg-slate-950/60 px-4 py-3 text-white outline-none placeholder:text-slate-500"
              value={authForm.password}
              onChange={(e) => setAuthForm({ ...authForm, password: e.target.value })}
              placeholder="Minimum 8 characters"
            />
          </div>

          <button type="submit" className="w-full rounded-xl bg-cyan-400 px-4 py-3 font-bold text-slate-950 transition hover:bg-cyan-300">
            {authMode === 'login' ? 'Login' : 'Create Account'}
          </button>
        </form>
      </div>
    </div>
  );

  if (loadingAuth) {
    return <div className="min-h-screen bg-aurora text-white flex items-center justify-center">Loading...</div>;
  }

  if (!user) {
    return authCard;
  }

  return (
    <main className="min-h-screen bg-aurora p-3 text-white md:p-6">
      <div className="mx-auto grid max-w-7xl gap-4 lg:grid-cols-[280px_minmax(0,1fr)_320px]">
        <aside className="rounded-3xl border border-white/10 bg-slate-900/70 p-4 shadow-glow backdrop-blur-xl">
          <div className="mb-6 flex items-center justify-between">
            <div>
              <p className="text-xs uppercase tracking-[0.2em] text-cyan-300">Home</p>
              <h2 className="mt-2 text-xl font-bold">{user.name || 'JARVIS'}</h2>
            </div>
            <button onClick={handleLogout} className="rounded-full border border-white/10 bg-white/5 px-3 py-2 text-xs text-slate-200">Logout</button>
          </div>

          <div className="mb-6">
            <p className="mb-3 text-xs uppercase tracking-[0.2em] text-slate-400">Search</p>
            <input
              value={searchText}
              onChange={(e) => setSearchText(e.target.value)}
              className="w-full rounded-xl border border-slate-700 bg-slate-950/60 px-3 py-2 text-sm outline-none"
              placeholder="Search chat or notes"
            />
          </div>

          <div className="mb-6">
            <p className="mb-3 text-xs uppercase tracking-[0.2em] text-slate-400">Memory</p>
            <div className="space-y-2">
              {memories.length === 0 && <p className="text-sm text-slate-500">No saved memory yet.</p>}
              {memories.slice(0, 6).map((memory) => (
                <div key={memory.id} className="rounded-xl border border-cyan-500/20 bg-cyan-500/5 p-2 text-sm text-slate-200">
                  {memory.content}
                </div>
              ))}
            </div>
          </div>
        </aside>

        <section className="rounded-3xl border border-white/10 bg-slate-900/70 p-4 shadow-glow backdrop-blur-xl">
          <div className="mb-5 flex flex-col gap-4 border-b border-white/10 pb-4 md:flex-row md:items-center md:justify-between">
            <div>
              <p className="text-xs uppercase tracking-[0.2em] text-cyan-300">Conversation</p>
              <h1 className="mt-2 text-2xl font-bold">CHIRANJEEVI JARVIS AI</h1>
            </div>

            <div className="flex items-center gap-2">
              <button
                className={`rounded-full px-3 py-2 text-sm ${language === 'en' ? 'bg-cyan-500 text-slate-950' : 'bg-slate-800 text-slate-200'}`}
                onClick={() => setLanguage('en')}
              >
                EN
              </button>
              <button
                className={`rounded-full px-3 py-2 text-sm ${language === 'hi' ? 'bg-cyan-500 text-slate-950' : 'bg-slate-800 text-slate-200'}`}
                onClick={() => setLanguage('hi')}
              >
                HI
              </button>
            </div>
          </div>

          <div className="mb-4 flex flex-wrap gap-2">
            {conversations.length === 0 && <p className="text-sm text-slate-400">No conversations yet.</p>}
            {conversations.map((conversation) => (
              <button
                key={conversation.id}
                onClick={() => setSelectedConversationId(conversation.id)}
                className={`rounded-full px-3 py-2 text-xs ${conversation.id === selectedConversationId ? 'bg-cyan-500 text-slate-950' : 'bg-slate-800 text-slate-200'}`}
              >
                {conversation.title}
              </button>
            ))}
          </div>

          <div className="h-[440px] space-y-3 overflow-y-auto rounded-2xl border border-white/10 bg-slate-950/60 p-3">
            {messages.length === 0 && (
              <div className="flex h-full items-center justify-center text-center text-slate-400">
                Start a conversation with your AI assistant.
              </div>
            )}
            {messages.map((item) => (
              <div key={item.id} className={`max-w-[85%] rounded-2xl p-3 ${item.role === 'user' ? 'ml-auto bg-cyan-500 text-slate-950' : 'bg-slate-800 text-slate-100'}`}>
                <p className="mb-1 text-[10px] uppercase tracking-[0.2em] opacity-70">{item.role === 'user' ? 'You' : 'JARVIS'}</p>
                <p className="whitespace-pre-wrap text-sm leading-6">{item.content}</p>
                <p className="mt-2 text-[10px] opacity-60">{formatDate(item.createdAt)}</p>
              </div>
            ))}
          </div>

          <div className="mt-4 space-y-3">
            <textarea
              rows={3}
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              placeholder={language === 'hi' ? 'अपना संदेश लिखें...' : 'Type your message...'}
              className="w-full rounded-2xl border border-slate-700 bg-slate-950/70 p-3 text-sm text-white outline-none placeholder:text-slate-500"
            />
            <div className="flex flex-wrap gap-2">
              <button onClick={sendMessage} disabled={isSending} className="rounded-xl bg-cyan-400 px-4 py-2 font-semibold text-slate-950 disabled:opacity-60">
                {isSending ? 'Sending...' : 'Send'}
              </button>
              <button onClick={startListening} className="rounded-xl border border-cyan-500/30 bg-cyan-500/10 px-4 py-2 font-semibold text-cyan-200">
                {isListening ? 'Listening...' : 'Voice Input'}
              </button>
            </div>
          </div>
        </section>

        <aside className="rounded-3xl border border-white/10 bg-slate-900/70 p-4 shadow-glow backdrop-blur-xl">
          <div className="mb-6">
            <p className="mb-3 text-xs uppercase tracking-[0.2em] text-slate-400">Quick Notes</p>
            <div className="space-y-3">
              <input
                value={noteTitle}
                onChange={(e) => setNoteTitle(e.target.value)}
                className="w-full rounded-xl border border-slate-700 bg-slate-950/60 px-3 py-2 text-sm outline-none"
                placeholder="Note title"
              />
              <textarea
                rows={4}
                value={noteContent}
                onChange={(e) => setNoteContent(e.target.value)}
                className="w-full rounded-xl border border-slate-700 bg-slate-950/60 px-3 py-2 text-sm outline-none"
                placeholder="Write a task or reminder..."
              />
              <button onClick={saveNote} className="w-full rounded-xl bg-violet-500 px-4 py-2 font-semibold text-white">
                Save Note
              </button>
            </div>
          </div>

          <div>
            <p className="mb-3 text-xs uppercase tracking-[0.2em] text-slate-400">Saved Notes</p>
            <div className="space-y-3">
              {notes.length === 0 && <p className="text-sm text-slate-500">No notes saved.</p>}
              {notes.map((note) => (
                <div key={note.id} className="rounded-2xl border border-white/10 bg-slate-950/60 p-3">
                  <div className="mb-2 flex items-start justify-between gap-2">
                    <div>
                      <p className="font-semibold text-cyan-200">{note.title}</p>
                      <p className="text-[10px] text-slate-400">{formatDate(note.createdAt)}</p>
                    </div>
                    <button onClick={() => deleteNote(note.id)} className="text-xs text-rose-300">Delete</button>
                  </div>
                  <p className="whitespace-pre-wrap text-sm text-slate-200">{note.content}</p>
                </div>
              ))}
            </div>
          </div>
        </aside>
      </div>
    </main>
  );
}
