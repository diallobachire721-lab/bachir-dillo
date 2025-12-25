
import React, { useState } from 'react';
import { VideoAnalysisResult, GeneratedThumbnail, Language } from '../types';
import { generateAIThumbnail } from '../services/geminiService';
import { translations } from '../translations';
import { 
  Sparkles, 
  Type, 
  FileText, 
  Hash, 
  TrendingUp, 
  Image as ImageIcon,
  Copy,
  Check,
  Loader2,
  Download
} from 'lucide-react';

interface AnalysisViewProps {
  analysis: VideoAnalysisResult;
  language: Language;
}

const AnalysisView: React.FC<AnalysisViewProps> = ({ analysis, language }) => {
  const [copiedIndex, setCopiedIndex] = useState<string | null>(null);
  const [generatedThumbs, setGeneratedThumbs] = useState<GeneratedThumbnail[]>([]);
  const [isGenerating, setIsGenerating] = useState<number | null>(null);
  
  const t = translations[language].analysis;

  const copyToClipboard = (text: string, id: string) => {
    navigator.clipboard.writeText(text);
    setCopiedIndex(id);
    setTimeout(() => setCopiedIndex(null), 2000);
  };

  const handleGenerateThumbnail = async (prompt: string, index: number) => {
    try {
      setIsGenerating(index);
      const url = await generateAIThumbnail(prompt);
      setGeneratedThumbs(prev => [
        ...prev, 
        { id: Date.now().toString(), url, prompt }
      ]);
    } catch (error) {
      console.error("Error generating image", error);
      alert("Failed to generate AI thumbnail background.");
    } finally {
      setIsGenerating(null);
    }
  };

  const downloadImage = (url: string) => {
    const link = document.createElement('a');
    link.href = url;
    link.download = `vidio-studio-thumbnail-${Date.now()}.png`;
    link.click();
  };

  return (
    <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-700">
      {/* Header */}
      <div className="flex items-center gap-3 border-b border-slate-700 pb-4">
        <Sparkles className="text-indigo-400 w-8 h-8" />
        <h2 className="text-3xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-indigo-400 to-purple-400">
          {t.header}
        </h2>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Left Column: Metadata */}
        <div className="space-y-6">
          {/* Viral Titles */}
          <section className="bg-slate-800/50 rounded-2xl p-6 border border-slate-700 backdrop-blur-sm">
            <div className="flex items-center gap-2 mb-4">
              <Type className="text-indigo-400 w-5 h-5" />
              <h3 className="text-lg font-semibold">{t.titles}</h3>
            </div>
            <div className="space-y-3">
              {analysis.viralTitles.map((title, i) => (
                <div key={i} className="group relative flex items-center justify-between p-3 bg-slate-900/50 rounded-xl border border-slate-700 hover:border-indigo-500/50 transition-all">
                  <span className="text-slate-200 pr-10">{title}</span>
                  <button 
                    onClick={() => copyToClipboard(title, `title-${i}`)}
                    className="p-2 text-slate-400 hover:text-indigo-400 transition-colors"
                  >
                    {copiedIndex === `title-${i}` ? <Check className="w-4 h-4 text-green-500" /> : <Copy className="w-4 h-4" />}
                  </button>
                </div>
              ))}
            </div>
          </section>

          {/* Tags */}
          <section className="bg-slate-800/50 rounded-2xl p-6 border border-slate-700">
            <div className="flex items-center gap-2 mb-4">
              <Hash className="text-indigo-400 w-5 h-5" />
              <h3 className="text-lg font-semibold">{t.tags}</h3>
            </div>
            <div className="flex flex-wrap gap-2">
              {analysis.tags.map((tag, i) => (
                <span key={i} className="px-3 py-1 bg-indigo-500/10 text-indigo-300 rounded-full text-sm border border-indigo-500/20">
                  #{tag}
                </span>
              ))}
            </div>
          </section>

          {/* Strategy */}
          <section className="bg-slate-800/50 rounded-2xl p-6 border border-slate-700">
            <div className="flex items-center gap-2 mb-4">
              <TrendingUp className="text-indigo-400 w-5 h-5" />
              <h3 className="text-lg font-semibold">{t.strategy}</h3>
            </div>
            <p className="text-slate-300 leading-relaxed text-sm">
              {analysis.engagementStrategy}
            </p>
          </section>
        </div>

        {/* Right Column: Thumbnail & Description */}
        <div className="space-y-6">
          {/* AI Thumbnail Generator */}
          <section className="bg-slate-800/50 rounded-2xl p-6 border border-slate-700">
            <div className="flex items-center gap-2 mb-4">
              <ImageIcon className="text-indigo-400 w-5 h-5" />
              <h3 className="text-lg font-semibold">{t.concepts}</h3>
            </div>
            <div className="space-y-4">
              {analysis.thumbnailPrompts.map((prompt, i) => (
                <div key={i} className="p-4 bg-slate-900/50 rounded-xl border border-slate-700">
                  <p className="text-sm text-slate-400 mb-3 italic">"{prompt}"</p>
                  <button 
                    disabled={isGenerating !== null}
                    onClick={() => handleGenerateThumbnail(prompt, i)}
                    className="flex items-center gap-2 px-4 py-2 bg-indigo-600 hover:bg-indigo-500 disabled:bg-slate-700 disabled:cursor-not-allowed rounded-lg text-sm font-medium transition-colors w-full justify-center"
                  >
                    {isGenerating === i ? <Loader2 className="w-4 h-4 animate-spin" /> : <Sparkles className="w-4 h-4" />}
                    {isGenerating === i ? t.generating : t.generate}
                  </button>
                </div>
              ))}
            </div>

            {/* Generated Previews */}
            {generatedThumbs.length > 0 && (
              <div className="mt-8 pt-6 border-t border-slate-700">
                <h4 className="text-md font-medium mb-4 text-indigo-300">{t.backdrops}</h4>
                <div className="grid grid-cols-1 gap-4">
                  {generatedThumbs.map((thumb) => (
                    <div key={thumb.id} className="group relative rounded-xl overflow-hidden aspect-video border border-slate-700">
                      <img src={thumb.url} alt="Generated thumbnail" className="w-full h-full object-cover" />
                      <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                        <button 
                          onClick={() => downloadImage(thumb.url)}
                          className="p-3 bg-white text-slate-900 rounded-full hover:scale-110 transition-transform"
                        >
                          <Download className="w-6 h-6" />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </section>

          {/* Description */}
          <section className="bg-slate-800/50 rounded-2xl p-6 border border-slate-700">
            <div className="flex items-center gap-2 mb-4">
              <FileText className="text-indigo-400 w-5 h-5" />
              <h3 className="text-lg font-semibold">{t.description}</h3>
            </div>
            <div className="relative group">
              <textarea 
                readOnly
                className="w-full h-48 bg-slate-900/50 border border-slate-700 rounded-xl p-4 text-sm text-slate-300 resize-none focus:outline-none"
                value={analysis.description}
              />
              <button 
                onClick={() => copyToClipboard(analysis.description, 'desc')}
                className="absolute top-2 right-2 p-2 bg-slate-800 rounded-lg text-slate-400 hover:text-indigo-400 border border-slate-700 transition-colors"
              >
                {copiedIndex === 'desc' ? <Check className="w-4 h-4 text-green-500" /> : <Copy className="w-4 h-4" />}
              </button>
            </div>
          </section>
        </div>
      </div>
    </div>
  );
};

export default AnalysisView;
