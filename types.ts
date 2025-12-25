
export type Language = 'en' | 'fr';
export type ViewMode = 'feed' | 'create' | 'profile' | 'live' | 'notifications' | 'auth' | 'video_detail';

export interface User {
  id: string;
  username: string;
  avatar: string;
  subscribers: number;
  isMonetized: boolean;
  earnings: number;
  phoneOrEmail?: string;
  videosUploadedToday: number;
}

export interface VideoPost {
  id: string;
  userId: string;
  username: string;
  userAvatar: string;
  videoUrl: string;
  caption: string;
  likes: number;
  comments: number;
  shares: number;
  isLiked: boolean;
}

export interface Poll {
  question: string;
  options: { text: string; votes: number }[];
  isActive: boolean;
}

export interface LiveQuestion {
  id: string;
  user: string;
  text: string;
  isAnswered: boolean;
  timestamp: number;
}

export interface FrameData {
  timestamp: number;
  dataUrl: string;
}

export interface GeneratedThumbnail {
  id: string;
  url: string;
  prompt: string;
}

export interface VideoAnalysisResult {
  viralTitles: string[];
  description: string;
  tags: string[];
  engagementStrategy: string;
  thumbnailPrompts: string[];
}

export enum AppState {
  IDLE = 'IDLE',
  UPLOADING = 'UPLOADING',
  ANALYZING = 'ANALYZING',
  COMPLETED = 'COMPLETED'
}

export interface ProjectHistory {
  id: string;
  videoName: string;
  date: string;
  result: VideoAnalysisResult;
  language: Language;
}
