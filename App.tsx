
import React, { useState, useCallback, useRef, useEffect } from 'react';
import { 
  Home, 
  Search, 
  PlusSquare, 
  Users, 
  User as UserIcon,
  Heart, 
  MessageCircle, 
  Share2, 
  Zap,
  Globe,
  DollarSign,
  Play,
  Settings,
  MoreVertical,
  Radio,
  Loader2,
  CheckCircle2,
  Video,
  Upload,
  ChevronRight,
  Camera,
  Image as ImageIcon,
  Trophy,
  ArrowLeft
} from 'lucide-react';
import VideoProcessor from './components/VideoProcessor';
import AnalysisView from './components/AnalysisView';
import LiveView from './components/LiveView';
import { analyzeVideoFrames } from './services/geminiService';
import { translations } from './translations';
import { AppState, FrameData, VideoAnalysisResult, Language, ViewMode, VideoPost, User } from './types';

const MOCK_VIDEOS: VideoPost[] = [
  {
    id: '1',
    userId: 'u1',
    username: 'NatureLover',
    userAvatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Felix',
    videoUrl: 'https://assets.mixkit.co/videos/preview/mixkit-tree-with-yellow-leaves-low-angle-shot-4725-large.mp4',
    caption: 'Autumn vibes are just different! 🍂 Exploring the golden forest during the peak of October. Nature always has a way of grounding us. #nature #calm #autumn #forest',
    likes: 1240,
    comments: 89,
    shares: 45,
    isLiked: false
  },
  {
    id: '2',
    userId: 'u2',
    username: 'CityExplorer',
    userAvatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Aneka',
    videoUrl: 'https://assets.mixkit.co/videos/preview/mixkit-set-of-plateaus-seen-from-the-height-of-a-bird-4432-large.mp4',
    caption: 'The scale of this landscape is insane. ⛰️ Took a bird eye view trip today and I am still speechless. The mountains look like painting. #explore #travel #mountains',
    likes: 8560,
    comments: 432,
    shares: 120,
    isLiked: true
  }
];

const DAILY_UPLOAD_GOAL = 50;

const App: React.FC = () => {
  const [language, setLanguage] = useState<Language>(() => (localStorage.getItem('vidio_lang') as Language) || 'en');
  const [user, setUser] = useState<User | null>(() => {
    const saved = localStorage.getItem('vidio_user');
    return saved ? JSON.parse(saved) : null;
  });
  const [view, setView] = useState<ViewMode>(user ? 'feed' : 'auth');
  const [state, setState] = useState<AppState>(AppState.IDLE);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [progress, setProgress] = useState(0);
  const [analysis, setAnalysis] = useState<VideoAnalysisResult | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [authInput, setAuthInput] = useState('');
  const [selectedVideo, setSelectedVideo] = useState<VideoPost | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const cameraPreviewRef = useRef<HTMLVideoElement>(null);
  
  const t = translations[language];

  useEffect(() => {
    localStorage.setItem('vidio_lang', language);
  }, [language]);

  useEffect(() => {
    if (view === 'create') {
      const startCamera = async () => {
        try {
          const stream = await navigator.mediaDevices.getUserMedia({ video: true });
          if (cameraPreviewRef.current) {
            cameraPreviewRef.current.srcObject = stream;
          }
        } catch (err) {
          console.error("Camera access denied", err);
        }
      };
      startCamera();
      return () => {
        if (cameraPreviewRef.current?.srcObject) {
          const tracks = (cameraPreviewRef.current.srcObject as MediaStream).getTracks();
          tracks.forEach(track => track.stop());
        }
      };
    }
  }, [view]);

  const handleRegister = (e: React.FormEvent) => {
    e.preventDefault();
    if (!authInput.trim()) {
      setError(t.errors.auth_required);
      return;
    }
    const newUser: User = {
      id: Math.random().toString(36).substr(2, 9),
      username: authInput.split('@')[0].substr(0, 12) || 'User_' + Math.floor(Math.random() * 1000),
      avatar: `https://api.dicebear.com/7.x/avataaars/svg?seed=${authInput}`,
      subscribers: 0,
      isMonetized: false,
      earnings: 0,
      phoneOrEmail: authInput,
      videosUploadedToday: 0
    };
    setUser(newUser);
    localStorage.setItem('vidio_user', JSON.stringify(newUser));
    setView('feed');
    setError(null);
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file && file.type.startsWith('video/')) {
      setSelectedFile(file);
      setState(AppState.UPLOADING);
    } else {
      setError(t.errors.valid_video);
    }
  };

  const handleFramesExtracted = useCallback(async (frames: FrameData[]) => {
    setState(AppState.ANALYZING);
    try {
      const result = await analyzeVideoFrames(frames, language);
      setAnalysis(result);
      
      if (user) {
        const updatedUser = { ...user, videosUploadedToday: user.videosUploadedToday + 1 };
        setUser(updatedUser);
        localStorage.setItem('vidio_user', JSON.stringify(updatedUser));
      }
      
      setState(AppState.COMPLETED);
    } catch (err: any) {
      setError(err.message || t.errors.analysis_failed);
      setState(AppState.IDLE);
    }
  }, [language, user, t.errors.analysis_failed]);

  const reset = () => {
    setState(AppState.IDLE);
    setSelectedFile(null);
    setAnalysis(null);
    setProgress(0);
    setError(null);
    setSelectedVideo(null);
    setView('feed');
  };

  const navigateToDetail = (video: VideoPost) => {
    setSelectedVideo(video);
    setView('video_detail');
  };

  const renderAuth = () => (
    <div className="min-h-screen bg-slate-950 flex flex-col items-center justify-center p-8 animate-in fade-in duration-700">
      <div className="w-20 h-20 bg-indigo-600 rounded-3xl flex items-center justify-center mb-8 shadow-2xl shadow-indigo-600/20">
        <Video className="w-10 h-10 text-white" />
      </div>
      <div className="text-center mb-10 space-y-3">
        <h1 className="text-3xl font-extrabold tracking-tight">{t.auth.welcome}</h1>
        <p className="text-slate-400 max-w-xs mx-auto leading-relaxed">{t.auth.subtitle}</p>
      </div>

      <form onSubmit={handleRegister} className="w-full space-y-6">
        <div className="space-y-2">
          <label className="text-xs font-bold text-slate-500 uppercase tracking-widest px-1">{t.auth.label}</label>
          <input 
            type="text" 
            value={authInput}
            onChange={(e) => setAuthInput(e.target.value)}
            placeholder={t.auth.placeholder}
            className="w-full bg-slate-900 border border-slate-800 rounded-2xl py-4 px-6 outline-none focus:border-indigo-500 transition-all text-white"
          />
        </div>
        <button 
          type="submit"
          className="w-full py-4 bg-indigo-600 hover:bg-indigo-500 rounded-2xl font-bold text-lg transition-all shadow-xl shadow-indigo-600/20 flex items-center justify-center gap-3"
        >
          {t.auth.button}
        </button>
      </form>

      <div className="mt-8 text-center">
        <p className="text-xs text-slate-500 leading-relaxed mb-4">{t.auth.disclaimer}</p>
        <button className="text-sm font-semibold text-indigo-400 hover:text-indigo-300 transition-colors">
          {t.auth.switch}
        </button>
      </div>
    </div>
  );

  const renderFeed = () => (
    <div className="h-[calc(100vh-64px-72px)] overflow-y-scroll snap-y snap-mandatory hide-scrollbar bg-black">
      {MOCK_VIDEOS.map(video => (
        <div key={video.id} className="h-full w-full snap-start relative flex items-center justify-center">
          <video src={video.videoUrl} className="h-full w-full object-contain" loop muted playsInline autoPlay />
          <div className="absolute right-4 bottom-24 flex flex-col items-center gap-6">
            <div className="flex flex-col items-center group cursor-pointer">
              <div className={`p-3 rounded-full ${video.isLiked ? 'bg-red-500' : 'bg-white/10'} backdrop-blur-md transition-all active:scale-75`}>
                <Heart className={`w-6 h-6 ${video.isLiked ? 'fill-white' : 'text-white'}`} />
              </div>
              <span className="text-xs font-bold mt-1 text-white">{video.likes}</span>
            </div>
            <div className="flex flex-col items-center cursor-pointer">
              <div className="p-3 rounded-full bg-white/10 backdrop-blur-md">
                <MessageCircle className="w-6 h-6 text-white" />
              </div>
              <span className="text-xs font-bold mt-1 text-white">{video.comments}</span>
            </div>
            <div className="w-12 h-12 rounded-full border-2 border-white overflow-hidden animate-spin-slow cursor-pointer" onClick={() => navigateToDetail(video)}>
              <img src={video.userAvatar} alt="user" />
            </div>
          </div>
          <div 
            className="absolute left-4 bottom-24 max-w-[80%] cursor-pointer group" 
            onClick={() => navigateToDetail(video)}
          >
            <h3 className="font-bold text-lg mb-2 flex items-center gap-2 text-white group-hover:text-indigo-400 transition-colors">
              @{video.username} <CheckCircle2 className="w-4 h-4 text-blue-400" />
            </h3>
            <p className="text-sm text-slate-200 line-clamp-2 leading-snug group-hover:text-white transition-colors">
              {video.caption}
            </p>
          </div>
        </div>
      ))}
    </div>
  );

  const renderVideoDetail = (video: VideoPost) => (
    <div className="h-[calc(100vh-64px-72px)] overflow-y-auto bg-slate-950 p-6 animate-in slide-in-from-right-4 duration-300">
      <div className="flex items-center gap-4 mb-8">
        <button 
          onClick={() => setView('feed')} 
          className="p-2 bg-slate-900 border border-slate-800 rounded-full text-slate-400 hover:text-white transition-colors"
        >
          <ArrowLeft className="w-5 h-5" />
        </button>
        <h2 className="text-xl font-bold">{t.social.post_details}</h2>
      </div>

      <div className="aspect-video w-full bg-black rounded-3xl border border-slate-900 overflow-hidden mb-6 shadow-2xl">
        <video src={video.videoUrl} className="w-full h-full object-contain" controls autoPlay loop />
      </div>

      <div className="flex items-center justify-between mb-8">
        <div className="flex items-center gap-3">
          <div className="w-14 h-14 rounded-full border-2 border-indigo-600 p-0.5">
            <img src={video.userAvatar} className="rounded-full" alt="avatar" />
          </div>
          <div>
            <h3 className="font-bold text-lg flex items-center gap-1.5">
              @{video.username} <CheckCircle2 className="w-4 h-4 text-blue-400" />
            </h3>
            <p className="text-xs text-slate-500 uppercase font-bold tracking-widest">{t.social.follow}</p>
          </div>
        </div>
        <div className="flex gap-4">
          <div className="flex flex-col items-center">
            <Heart className={`w-6 h-6 ${video.isLiked ? 'text-red-500 fill-red-500' : 'text-slate-400'}`} />
            <span className="text-[10px] font-bold text-slate-500 mt-1">{video.likes}</span>
          </div>
          <div className="flex flex-col items-center">
            <MessageCircle className="w-6 h-6 text-slate-400" />
            <span className="text-[10px] font-bold text-slate-500 mt-1">{video.comments}</span>
          </div>
        </div>
      </div>

      <div className="bg-slate-900/50 border border-slate-900 rounded-2xl p-5 mb-8">
        <p className="text-slate-200 leading-relaxed text-sm whitespace-pre-wrap">
          {video.caption}
        </p>
      </div>

      <div className="space-y-4">
        <div className="flex items-center justify-between border-b border-slate-900 pb-2">
          <h4 className="text-sm font-bold uppercase tracking-wider text-slate-500">{t.social.comments}</h4>
        </div>
        <div className="py-8 text-center border-2 border-dashed border-slate-900 rounded-2xl text-slate-600 italic text-sm">
          {language === 'fr' ? 'Aucun commentaire pour le moment.' : 'No comments yet.'}
        </div>
      </div>
    </div>
  );

  const renderProfile = () => (
    <div className="p-6 space-y-8 animate-in fade-in duration-500 overflow-y-auto h-[calc(100vh-136px)]">
      <div className="flex flex-col items-center space-y-4">
        <div className="relative">
          <div className="w-24 h-24 rounded-full border-4 border-indigo-600 p-1">
            <img src={user?.avatar} className="rounded-full" alt="avatar" />
          </div>
          <div className="absolute bottom-0 right-0 bg-green-500 w-6 h-6 rounded-full border-4 border-slate-950"></div>
        </div>
        <div className="text-center">
          <h2 className="text-2xl font-bold">@{user?.username}</h2>
          <p className="text-slate-400 text-sm">{user?.phoneOrEmail}</p>
        </div>
      </div>

      <div className="bg-indigo-600/10 border border-indigo-500/20 rounded-2xl p-6">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <Trophy className="w-5 h-5 text-yellow-400" />
            <h3 className="font-bold text-sm uppercase tracking-wider">{t.social.daily_goal}</h3>
          </div>
          <span className="text-xs font-bold bg-indigo-600 px-2 py-1 rounded text-white">{user?.videosUploadedToday} / {DAILY_UPLOAD_GOAL}</span>
        </div>
        <div className="w-full bg-slate-900 h-2 rounded-full overflow-hidden mb-2">
          <div 
            className="h-full bg-gradient-to-r from-indigo-500 to-purple-500 transition-all duration-1000"
            style={{ width: `${Math.min((user?.videosUploadedToday || 0) / DAILY_UPLOAD_GOAL * 100, 100)}%` }}
          ></div>
        </div>
        <p className="text-[10px] text-slate-500 text-center uppercase font-bold tracking-tighter">
          {Math.max(DAILY_UPLOAD_GOAL - (user?.videosUploadedToday || 0), 0)} {t.social.videos_left}
        </p>
      </div>

      <div className="grid grid-cols-3 gap-4 border-y border-slate-800 py-6">
        <div className="text-center">
          <p className="font-bold text-xl">{user?.subscribers.toLocaleString()}</p>
          <p className="text-xs text-slate-500 uppercase tracking-tighter">{t.social.subscribers}</p>
        </div>
        <div className="text-center border-x border-slate-800">
          <p className="font-bold text-xl">0</p>
          <p className="text-xs text-slate-500 uppercase tracking-tighter">{t.social.likes}</p>
        </div>
        <div className="text-center">
          <p className="font-bold text-xl flex items-center justify-center text-green-400">
            <DollarSign className="w-4 h-4" />{user?.earnings}
          </p>
          <p className="text-xs text-slate-500 uppercase tracking-tighter">{t.social.monetization}</p>
        </div>
      </div>

      <button className="w-full py-3 bg-slate-900 border border-slate-800 rounded-xl font-medium flex items-center justify-center gap-2 hover:bg-slate-800 transition-colors">
        <Settings className="w-4 h-4" /> {language === 'fr' ? 'Paramètres' : 'Settings'}
      </button>
    </div>
  );

  const renderCreate = () => (
    <div className="p-6 h-full flex flex-col gap-6 animate-in slide-in-from-bottom-12 duration-500">
      <div className="relative aspect-[9/16] bg-black rounded-3xl border border-slate-800 overflow-hidden group">
        <video 
          ref={cameraPreviewRef} 
          autoPlay 
          muted 
          playsInline 
          className="w-full h-full object-cover scale-x-[-1]"
        />
        <div className="absolute inset-0 bg-gradient-to-b from-black/40 via-transparent to-black/60 pointer-events-none"></div>
        
        <div className="absolute top-6 right-6 space-y-4">
           <button className="p-3 bg-white/10 backdrop-blur-md rounded-full text-white"><Settings className="w-5 h-5" /></button>
           <button className="p-3 bg-white/10 backdrop-blur-md rounded-full text-white"><Zap className="w-5 h-5" /></button>
        </div>

        <div className="absolute bottom-10 inset-x-0 flex flex-col items-center gap-8">
           <div className="flex items-center gap-12">
              <button className="flex flex-col items-center gap-1">
                 <div className="w-12 h-12 bg-white/10 backdrop-blur-md rounded-xl flex items-center justify-center border border-white/20">
                    <ImageIcon className="w-6 h-6 text-white" />
                 </div>
                 <span className="text-[10px] text-white font-bold uppercase">{language === 'fr' ? 'Galerie' : 'Gallery'}</span>
              </button>
              
              <button className="w-20 h-20 rounded-full border-4 border-white p-1 group active:scale-95 transition-transform">
                 <div className="w-full h-full bg-red-600 rounded-full shadow-lg shadow-red-600/30"></div>
              </button>

              <button className="flex flex-col items-center gap-1">
                 <div className="w-12 h-12 bg-white/10 backdrop-blur-md rounded-xl flex items-center justify-center border border-white/20">
                    <Camera className="w-6 h-6 text-white" />
                 </div>
                 <span className="text-[10px] text-white font-bold uppercase">Photos</span>
              </button>
           </div>

           <div className="flex gap-4">
              <button className="px-6 py-2 bg-indigo-600/90 backdrop-blur-md rounded-full text-sm font-bold text-white shadow-lg">{t.social.go_live}</button>
              <button 
                onClick={() => fileInputRef.current?.click()}
                className="px-6 py-2 bg-white/90 backdrop-blur-md rounded-full text-sm font-bold text-black shadow-lg"
              >
                {t.social.share}
              </button>
           </div>
        </div>
      </div>
      <input ref={fileInputRef} type="file" accept="video/*" className="hidden" onChange={handleFileSelect} />
    </div>
  );

  if (view === 'auth') return renderAuth();

  return (
    <div className="min-h-screen bg-slate-950 text-slate-50 flex flex-col max-w-md mx-auto relative shadow-2xl overflow-hidden border-x border-slate-900">
      
      <header className="h-16 flex items-center justify-between px-6 border-b border-slate-900 bg-slate-950/80 backdrop-blur-md z-[60]">
        <div className="flex items-center gap-2" onClick={reset}>
          <div className="w-8 h-8 bg-indigo-600 rounded-lg flex items-center justify-center">
            <Video className="w-5 h-5 text-white" />
          </div>
          <span className="font-bold text-lg tracking-tight">Vidio<span className="text-indigo-500">Social</span></span>
        </div>
        <div className="flex items-center gap-4">
          <button onClick={() => setLanguage(l => l === 'en' ? 'fr' : 'en')} className="p-2 hover:bg-slate-900 rounded-full transition-colors">
            <Globe className="w-5 h-5 text-slate-400" />
          </button>
          <button className="p-2 hover:bg-slate-900 rounded-full transition-colors relative">
            <Radio className="w-5 h-5 text-red-500" />
            <span className="absolute top-1 right-1 w-2 h-2 bg-red-500 rounded-full animate-ping"></span>
          </button>
        </div>
      </header>

      <main className="flex-1 relative overflow-hidden">
        {state === AppState.IDLE ? (
          <>
            {view === 'feed' && renderFeed()}
            {view === 'profile' && renderProfile()}
            {view === 'create' && renderCreate()}
            {view === 'video_detail' && selectedVideo && renderVideoDetail(selectedVideo)}
            {view === 'live' && <LiveView language={language} onClose={() => setView('feed')} />}
          </>
        ) : (
          <div className="h-full flex flex-col items-center justify-center p-10 space-y-6 bg-slate-950">
             <div className="relative">
                <div className="w-24 h-24 rounded-3xl bg-indigo-900/30 flex items-center justify-center border border-indigo-500/30">
                  <Loader2 className="w-12 h-12 text-indigo-500 animate-spin" />
                </div>
                <Zap className="absolute -top-2 -right-2 w-8 h-8 text-yellow-400 fill-yellow-400 animate-pulse" />
             </div>
             <div className="text-center space-y-2">
                <h3 className="text-xl font-bold">{state === AppState.UPLOADING ? t.processing.extracting : t.processing.analyzing}</h3>
                <p className="text-slate-500 text-sm">AI Engine is processing...</p>
             </div>
             <div className="w-full bg-slate-900 h-2 rounded-full overflow-hidden">
                <div className="h-full bg-indigo-600 transition-all duration-300" style={{width: `${progress}%`}}></div>
             </div>
          </div>
        )}

        {state === AppState.COMPLETED && analysis && (
          <div className="absolute inset-0 bg-slate-950 z-[100] overflow-y-auto p-6 pb-24 animate-in slide-in-from-bottom-full duration-500">
            <button onClick={reset} className="mb-6 flex items-center gap-2 text-slate-400 hover:text-white">
              <ChevronRight className="w-4 h-4 rotate-180" /> {t.analysis.new_project}
            </button>
            <AnalysisView analysis={analysis} language={language} />
          </div>
        )}
      </main>

      <nav className="h-[72px] bg-slate-950 border-t border-slate-900 flex items-center justify-around px-2 z-[60]">
        <button onClick={() => setView('feed')} className={`flex flex-col items-center gap-1 transition-colors ${view === 'feed' || view === 'video_detail' ? 'text-indigo-500' : 'text-slate-500'}`}>
          <Home className="w-6 h-6" />
          <span className="text-[10px] font-medium uppercase tracking-tighter">{t.nav.feed}</span>
        </button>
        <button className="flex flex-col items-center gap-1 text-slate-500">
          <Search className="w-6 h-6" />
          <span className="text-[10px] font-medium uppercase tracking-tighter">{t.nav.discover}</span>
        </button>
        <button onClick={() => setView('create')} className="relative -top-3 w-14 h-14 bg-gradient-to-tr from-indigo-600 to-purple-600 rounded-2xl flex items-center justify-center shadow-lg shadow-indigo-600/40 active:scale-90 transition-transform">
          <PlusSquare className="w-7 h-7 text-white" />
        </button>
        <button className="flex flex-col items-center gap-1 text-slate-500">
          <Users className="w-6 h-6" />
          <span className="text-[10px] font-medium uppercase tracking-tighter">{t.nav.subs}</span>
        </button>
        <button onClick={() => setView('profile')} className={`flex flex-col items-center gap-1 transition-colors ${view === 'profile' ? 'text-indigo-500' : 'text-slate-500'}`}>
          <UserIcon className="w-6 h-6" />
          <span className="text-[10px] font-medium uppercase tracking-tighter">{t.nav.profile}</span>
        </button>
      </nav>

      {selectedFile && state === AppState.UPLOADING && (
        <VideoProcessor 
          file={selectedFile} 
          onFramesExtracted={handleFramesExtracted}
          onProgress={setProgress}
        />
      )}
      
      {error && (
        <div className="absolute top-20 left-4 right-4 bg-red-500/10 border border-red-500/20 p-3 rounded-lg text-red-400 text-xs flex items-center gap-2 animate-in slide-in-from-top-4 duration-300 z-[200]">
          <Zap className="w-4 h-4" /> {error}
        </div>
      )}

      <style>{`
        .hide-scrollbar::-webkit-scrollbar { display: none; }
        .hide-scrollbar { -ms-overflow-style: none; scrollbar-width: none; }
        @keyframes spin-slow {
          from { transform: rotate(0deg); }
          to { transform: rotate(360deg); }
        }
        .animate-spin-slow {
          animation: spin-slow 10s linear infinite;
        }
      `}</style>
    </div>
  );
};

export default App;
