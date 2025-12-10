
import React, { useState } from 'react';
import { ArrowLeft, MessageSquare, Mic, SkipBack, Play, SkipForward, Settings2, Download, CheckCircle, Send, FileText, Loader2 } from 'lucide-react';
import { useStore } from '../../App';

interface ReviewOverlayProps {
  isOpen: boolean;
  onClose: () => void;
}

export const ReviewOverlay: React.FC<ReviewOverlayProps> = ({ isOpen, onClose }) => {
  const { state, dispatch } = useStore();
  const { selectedVideoId, videos } = state;
  const video = videos.find(v => v.id === selectedVideoId);

  // Local State
  const [commentInput, setCommentInput] = useState('');
  const [comments, setComments] = useState([
    { id: 1, user: "Sarah D.", time: "10:23 AM", text: "这里的红色饱和度能降低一点吗？", timestamp: "00:02:14", active: true },
    { id: 2, user: "Mike R.", time: "11:05 AM", text: "确认锁定。", timestamp: "00:04:00", active: false }
  ]);
  const [isExporting, setIsExporting] = useState(false);

  if (!isOpen) return null;

  const handleCompleteAnnotation = () => {
      if (video) {
          // 1. Update Video Status
          dispatch({ type: 'UPDATE_VIDEO_STATUS', payload: { videoId: video.id, status: 'annotated' } });
          
          // 2. Send Notification
          dispatch({
              type: 'ADD_NOTIFICATION',
              payload: {
                  id: Date.now().toString(),
                  type: 'success',
                  title: '审阅完成',
                  message: `客户已完成对视频 "${video.name}" 的批注。`,
                  time: '刚刚'
              }
          });
          
          onClose();
      }
  };

  const handleAddComment = () => {
      if (!commentInput.trim()) return;
      
      const newComment = {
          id: Date.now(),
          user: "Guest User",
          time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
          text: commentInput,
          timestamp: "00:00:15", // Mocked timestamp
          active: true
      };

      setComments([...comments, newComment]);
      setCommentInput('');
  };

  const handleExportPDF = () => {
      setIsExporting(true);
      // Simulate API call / Generation
      setTimeout(() => {
          setIsExporting(false);
          alert(`已生成批注报告: ${video?.name}_Feedback.pdf`);
      }, 1500);
  };

  return (
    <div className="fixed inset-0 top-14 z-50 bg-zinc-950 flex animate-in fade-in duration-200">
      
      {/* Left: Player Area */}
      <div className="flex-1 flex flex-col relative bg-black/50">
        
        {/* Header Toolbar */}
        <div className="absolute top-0 left-0 right-0 h-16 bg-gradient-to-b from-black/80 to-transparent z-10 flex items-center justify-between px-6">
            <button 
                onClick={onClose}
                className="flex items-center gap-2 text-zinc-300 hover:text-white bg-zinc-900/50 hover:bg-zinc-800/80 px-4 py-2 rounded-full backdrop-blur-md transition-all border border-white/5"
            >
                <ArrowLeft className="w-4 h-4" />
                <span className="text-sm font-medium">退出审阅</span>
            </button>
            <div className="text-sm font-mono text-zinc-400">{video?.name || '未选择视频'}</div>
        </div>

        {/* Video Placeholder */}
        <div className="flex-1 flex items-center justify-center p-8">
            <div className="aspect-video w-full max-w-5xl bg-zinc-900 rounded-lg shadow-2xl relative overflow-hidden ring-1 ring-zinc-800">
                <img 
                    src={`https://picsum.photos/seed/${video?.id || '404'}/1920/1080`} 
                    className="w-full h-full object-cover opacity-60" 
                    alt="Review Content"
                />
                 <div className="absolute inset-0 flex items-center justify-center">
                    <button className="w-20 h-20 bg-white/10 hover:bg-indigo-500/90 backdrop-blur-sm rounded-full flex items-center justify-center transition-all group">
                         <Play className="w-8 h-8 fill-white text-white pl-1 group-hover:scale-110 transition-transform" />
                    </button>
                </div>
            </div>
        </div>

        {/* Bottom Controls */}
        <div className="h-24 bg-zinc-950 border-t border-zinc-800 px-8 flex flex-col justify-center gap-4">
             <div className="w-full h-1.5 bg-zinc-800 rounded-full cursor-pointer group relative">
                 <div className="absolute top-0 left-0 h-full w-[35%] bg-indigo-500 rounded-full group-hover:bg-indigo-400"></div>
                 <div className="absolute top-1/2 -translate-y-1/2 left-[35%] w-3 h-3 bg-white rounded-full opacity-0 group-hover:opacity-100 transition-opacity shadow-lg"></div>
             </div>
             
             <div className="flex items-center justify-between">
                 <div className="flex items-center gap-6">
                     <div className="flex items-center gap-4 text-zinc-400">
                         <SkipBack className="w-5 h-5 hover:text-white cursor-pointer" />
                         <Play className="w-6 h-6 hover:text-white cursor-pointer fill-current" />
                         <SkipForward className="w-5 h-5 hover:text-white cursor-pointer" />
                     </div>
                     <span className="text-xs font-mono text-indigo-400">00:02:14:05 <span className="text-zinc-600">/ 00:05:00:00</span></span>
                 </div>
                 
                 <div className="flex items-center gap-4 text-zinc-400">
                     <button 
                        onClick={handleExportPDF} 
                        className="flex items-center gap-2 hover:text-white hover:bg-zinc-800 px-3 py-1.5 rounded transition-colors disabled:opacity-50"
                        disabled={isExporting}
                        title="导出审阅报告 (PDF)"
                     >
                         {isExporting ? <Loader2 className="w-5 h-5 animate-spin" /> : <FileText className="w-5 h-5" />}
                         <span className="text-xs">导出报告</span>
                     </button>
                     <div className="h-4 w-px bg-zinc-700"></div>
                     <Settings2 className="w-5 h-5 hover:text-white cursor-pointer" />
                     <Download className="w-5 h-5 hover:text-white cursor-pointer" />
                 </div>
             </div>
        </div>
      </div>

      {/* Right: Comments Sidebar */}
      <aside className="w-[360px] bg-zinc-900 border-l border-zinc-800 flex flex-col shrink-0 relative z-20">
         <div className="h-14 border-b border-zinc-800 flex items-center px-4 justify-between bg-zinc-900">
             <span className="font-semibold text-sm text-zinc-200">批注 ({comments.length})</span>
             {video?.status !== 'annotated' ? (
                 <button 
                    onClick={handleCompleteAnnotation}
                    className="flex items-center gap-2 bg-indigo-600 hover:bg-indigo-500 text-white text-xs px-3 py-1.5 rounded transition-colors shadow-lg shadow-indigo-900/20"
                 >
                     <CheckCircle className="w-3.5 h-3.5" />
                     完成审阅
                 </button>
             ) : (
                 <span className="flex items-center gap-1.5 bg-emerald-500/10 text-emerald-400 px-2 py-1 rounded text-xs border border-emerald-500/20">
                     <CheckCircle className="w-3.5 h-3.5" />
                     已完成
                 </span>
             )}
         </div>
         
         <div className="flex-1 overflow-y-auto p-4 space-y-6 custom-scrollbar">
             {comments.map(c => (
                 <Comment 
                    key={c.id} 
                    user={c.user} 
                    time={c.time} 
                    text={c.text} 
                    timestamp={c.timestamp} 
                    active={c.active} 
                />
             ))}
         </div>

         <div className="p-4 border-t border-zinc-800 bg-zinc-900">
             <div className="relative">
                 <input 
                    type="text" 
                    value={commentInput}
                    onChange={(e) => setCommentInput(e.target.value)}
                    onKeyDown={(e) => e.key === 'Enter' && handleAddComment()}
                    placeholder="在 00:02:14 添加批注..." 
                    className="w-full bg-zinc-950 border border-zinc-800 rounded-lg pl-4 pr-10 py-3 text-sm text-zinc-200 focus:ring-1 focus:ring-indigo-500 focus:border-indigo-500 focus:outline-none transition-all"
                 />
                 <button 
                    onClick={handleAddComment}
                    className="absolute right-2 top-2 p-1 text-zinc-500 hover:text-indigo-400 transition-colors"
                 >
                     {commentInput.trim() ? <Send className="w-4 h-4" /> : <Mic className="w-4 h-4" />}
                 </button>
             </div>
         </div>
      </aside>
    </div>
  );
};

const Comment: React.FC<{ user: string, time: string, text: string, timestamp: string, active?: boolean }> = ({ user, time, text, timestamp, active }) => (
    <div className={`flex gap-3 group ${active ? 'opacity-100' : 'opacity-70 hover:opacity-100'}`}>
        <div className="w-8 h-8 rounded-full bg-indigo-900/50 border border-indigo-500/30 flex items-center justify-center shrink-0 text-xs font-bold text-indigo-300">
            {user.charAt(0)}
        </div>
        <div className="flex-1">
            <div className="flex items-baseline justify-between mb-1">
                <span className="text-sm font-semibold text-zinc-200">{user}</span>
                <span className="text-[10px] text-zinc-500">{time}</span>
            </div>
            <div className={`p-3 rounded-lg border text-sm leading-relaxed ${active ? 'bg-indigo-500/10 border-indigo-500/30 text-indigo-100' : 'bg-zinc-800/50 border-zinc-800 text-zinc-400'}`}>
                {text}
            </div>
            <div className="mt-1.5 flex items-center gap-2">
                <span className="text-[10px] font-mono text-indigo-400 bg-indigo-500/10 px-1.5 py-0.5 rounded cursor-pointer hover:bg-indigo-500/20">{timestamp}</span>
                <button className="text-[10px] text-zinc-500 hover:text-zinc-300">回复</button>
            </div>
        </div>
    </div>
)
