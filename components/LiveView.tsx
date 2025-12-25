
import React, { useState, useEffect, useRef } from 'react';
import { 
  X, 
  Users, 
  Send, 
  BarChart2, 
  HelpCircle, 
  MessageCircle,
  CheckCircle,
  MoreHorizontal
} from 'lucide-react';
import { Language, Poll, LiveQuestion } from '../types';
import { translations } from '../translations';

interface LiveViewProps {
  onClose: () => void;
  language: Language;
}

const LiveView: React.FC<LiveViewProps> = ({ onClose, language }) => {
  const t = translations[language].live;
  const videoRef = useRef<HTMLVideoElement>(null);
  const [viewers, setViewers] = useState(124);
  const [activeTab, setActiveTab] = useState<'chat' | 'poll' | 'qa'>('chat');
  const [poll, setPoll] = useState<Poll | null>({
    question: "Should I build an AI next?",
    options: [
      { text: "Yes, definitely!", votes: 85 },
      { text: "Maybe later", votes: 12 },
      { text: "Surprise me", votes: 27 }
    ],
    isActive: true
  });
  const [questions, setQuestions] = useState<LiveQuestion[]>([
    { id: '1', user: 'TechFan', text: 'How does the Gemini API handle latency?', isAnswered: false, timestamp: Date.now() - 50000 },
    { id: '2', user: 'DevGuru', text: 'Can we use multimodal inputs?', isAnswered: true, timestamp: Date.now() - 120000 }
  ]);
  const [chat, setChat] = useState<{user: string, text: string}[]>([
    { user: 'Sam', text: 'Love the stream! 🔥' },
    { user: 'Alex', text: 'Hello from Paris!' },
    { user: 'Jamie', text: 'This UI looks clean.' }
  ]);
  const [newQuestion, setNewQuestion] = useState('');

  useEffect(() => {
    // Start Camera
    const startCam = async () => {
      try {
        const stream = await navigator.mediaDevices.getUserMedia({ video: true, audio: true });
        if (videoRef.current) videoRef.current.srcObject = stream;
      } catch (err) {
        console.error("Camera error:", err);
      }
    };
    startCam();

    // Mock engagement
    const interval = setInterval(() => {
      setViewers(prev => prev + Math.floor(Math.random() * 5) - 2);
    }, 5000);

    return () => {
      clearInterval(interval);
      if (videoRef.current?.srcObject) {
        const tracks = (videoRef.current.srcObject as MediaStream).getTracks();
        tracks.forEach(track => track.stop());
      }
    };
  }, []);

  const handleVote = (index: number) => {
    if (!poll) return;
    const newOptions = [...poll.options];
    newOptions[index].votes += 1;
    setPoll({ ...poll, options: newOptions });
  };

  const handleAsk = () => {
    if (!newQuestion.trim()) return;
    const q: LiveQuestion = {
      id: Date.now().toString(),
      user: 'Me',
      text: newQuestion,
      isAnswered: false,
      timestamp: Date.now()
    };
    setQuestions([q, ...questions]);
    setNewQuestion('');
  };

  return (
    <div className="fixed inset-0 bg-black z-[1000] flex flex-col md:max-w-md md:mx-auto border-x border-slate-900 overflow-hidden">
      {/* Camera Feed */}
      <div className="relative flex-1 bg-slate-900">
        <video 
          ref={videoRef} 
          autoPlay 
          muted 
          playsInline 
          className="h-full w-full object-cover scale-x-[-1]"
        />
        
        {/* Overlays */}
        <div className="absolute top-6 left-6 right-6 flex justify-between items-start pointer-events-none">
          <div className="flex items-center gap-3">
            <div className="bg-red-600 text-white text-[10px] font-bold px-2 py-0.5 rounded uppercase tracking-wider animate-pulse">Live</div>
            <div className="bg-black/40 backdrop-blur-md px-3 py-1 rounded-full flex items-center gap-2 text-xs font-medium">
              <Users className="w-3 h-3" /> {viewers}
            </div>
          </div>
          <button 
            onClick={onClose} 
            className="pointer-events-auto p-2 bg-black/40 backdrop-blur-md rounded-full text-white hover:bg-black/60 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Bottom Fade Gradient for Chat Readability */}
        <div className="absolute inset-x-0 bottom-0 h-48 bg-gradient-to-t from-black/80 to-transparent pointer-events-none"></div>

        {/* Floating Chat (Mobile Style) */}
        {activeTab === 'chat' && (
          <div className="absolute bottom-4 left-4 right-4 max-h-48 overflow-y-auto hide-scrollbar space-y-2">
            {chat.map((m, i) => (
              <div key={i} className="flex gap-2 items-start animate-in slide-in-from-left-2 fade-in duration-300">
                <span className="font-bold text-xs text-slate-300">@{m.user}:</span>
                <span className="text-xs text-white bg-black/20 px-2 py-1 rounded-lg backdrop-blur-[2px]">{m.text}</span>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Interactive Interaction Area */}
      <div className="bg-slate-950 border-t border-slate-900 flex flex-col h-72">
        <div className="flex border-b border-slate-900">
          <button 
            onClick={() => setActiveTab('chat')}
            className={`flex-1 py-3 text-xs font-bold uppercase tracking-widest flex items-center justify-center gap-2 transition-colors ${activeTab === 'chat' ? 'text-indigo-500 border-b-2 border-indigo-500' : 'text-slate-500'}`}
          >
            <MessageCircle className="w-4 h-4" /> Chat
          </button>
          <button 
            onClick={() => setActiveTab('poll')}
            className={`flex-1 py-3 text-xs font-bold uppercase tracking-widest flex items-center justify-center gap-2 transition-colors ${activeTab === 'poll' ? 'text-indigo-500 border-b-2 border-indigo-500' : 'text-slate-500'}`}
          >
            <BarChart2 className="w-4 h-4" /> {t.poll_title.split(' ')[0]}
          </button>
          <button 
            onClick={() => setActiveTab('qa')}
            className={`flex-1 py-3 text-xs font-bold uppercase tracking-widest flex items-center justify-center gap-2 transition-colors ${activeTab === 'qa' ? 'text-indigo-500 border-b-2 border-indigo-500' : 'text-slate-500'}`}
          >
            <HelpCircle className="w-4 h-4" /> Q&A
          </button>
        </div>

        <div className="flex-1 overflow-y-auto p-4 hide-scrollbar">
          {activeTab === 'chat' && (
            <div className="h-full flex flex-col justify-end">
               <div className="flex items-center gap-3 bg-slate-900/50 p-2 rounded-2xl border border-slate-800">
                  <input 
                    type="text" 
                    placeholder="Type a message..." 
                    className="flex-1 bg-transparent border-none outline-none text-sm px-2"
                  />
                  <button className="p-2 bg-indigo-600 rounded-xl">
                    <Send className="w-4 h-4" />
                  </button>
               </div>
            </div>
          )}

          {activeTab === 'poll' && poll && (
            <div className="space-y-4 animate-in fade-in zoom-in-95">
              <h4 className="font-bold text-sm text-slate-300">{poll.question}</h4>
              <div className="space-y-2">
                {poll.options.map((opt, i) => {
                  const total = poll.options.reduce((acc, curr) => acc + curr.votes, 0);
                  const perc = total > 0 ? Math.round((opt.votes / total) * 100) : 0;
                  return (
                    <button 
                      key={i} 
                      onClick={() => handleVote(i)}
                      className="w-full relative h-12 rounded-xl border border-slate-800 bg-slate-900/50 overflow-hidden group hover:border-indigo-500/50 transition-all"
                    >
                      <div className="absolute inset-y-0 left-0 bg-indigo-500/10 transition-all duration-700" style={{ width: `${perc}%` }}></div>
                      <div className="absolute inset-0 px-4 flex items-center justify-between text-xs font-semibold">
                        <span>{opt.text}</span>
                        <span className="text-indigo-400">{perc}%</span>
                      </div>
                    </button>
                  );
                })}
              </div>
            </div>
          )}

          {activeTab === 'qa' && (
            <div className="space-y-4 animate-in fade-in slide-in-from-right-4">
              <div className="flex gap-2">
                <input 
                  value={newQuestion}
                  onChange={(e) => setNewQuestion(e.target.value)}
                  type="text" 
                  placeholder={t.ask_placeholder}
                  className="flex-1 bg-slate-900 border border-slate-800 rounded-xl px-3 py-2 text-sm outline-none focus:border-indigo-500"
                />
                <button onClick={handleAsk} className="p-2 bg-indigo-600 rounded-xl hover:bg-indigo-500 transition-colors">
                  <Send className="w-4 h-4" />
                </button>
              </div>
              <div className="space-y-3">
                {questions.map(q => (
                  <div key={q.id} className="p-3 rounded-xl bg-slate-900 border border-slate-800 flex flex-col gap-1">
                    <div className="flex items-center justify-between">
                      <span className="text-[10px] font-bold text-indigo-400">@{q.user}</span>
                      {q.isAnswered && <span className="flex items-center gap-1 text-[10px] text-green-500"><CheckCircle className="w-3 h-3" /> {t.answered}</span>}
                    </div>
                    <p className="text-xs text-slate-200">{q.text}</p>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default LiveView;
