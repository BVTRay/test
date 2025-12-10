
import React, { useState } from 'react';
import { Play, MoreVertical, Plus, Check, Clock, LayoutGrid, List, SlidersHorizontal, FileVideo, Film, CheckCircle2, Share2, AlertTriangle, Lock, Download, Copy, X, ArrowRight } from 'lucide-react';
import { useStore } from '../../App';
import { Video } from '../../types';

export const MainBrowser: React.FC = () => {
  const { state, dispatch } = useStore();
  const { activeModule, showWorkbench, projects, selectedProjectId, videos, cart, searchTerm, browserViewMode, browserCardSize } = state;
  const project = projects.find(p => p.id === selectedProjectId);
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);

  // Share Modal State
  const [shareState, setShareState] = useState<{
      isOpen: boolean;
      video: Video | null;
      step: 'warning' | 'config' | 'success';
      isHistorical: boolean;
      justification: string;
      allowDownload: boolean;
      hasPassword: boolean;
      generatedLink: string;
  }>({
      isOpen: false,
      video: null,
      step: 'config',
      isHistorical: false,
      justification: '',
      allowDownload: false,
      hasPassword: false,
      generatedLink: ''
  });
  
  // Content Logic
  let displayVideos: Video[] = [];
  
  if (activeModule === 'showcase') {
      // Showcase: Show all marked 'Case Files', filtered by search
      displayVideos = videos.filter(v => v.isCaseFile);
      if (searchTerm) {
          displayVideos = displayVideos.filter(v => v.name.toLowerCase().includes(searchTerm.toLowerCase()));
      }
  } else if (selectedProjectId) {
      // Review/Delivery: Show videos for specific project
      displayVideos = videos.filter(v => v.projectId === selectedProjectId);
  }

  // Margin Calculation
  const marginClass = `ml-[384px] pt-14 pb-10 transition-all duration-300 ease-in-out ${showWorkbench ? 'mr-[390px]' : 'mr-4'}`;

  const renderHeader = () => {
    if (activeModule === 'showcase') {
        return (
            <div>
                <div className="text-xs text-zinc-500 mb-1">案例库</div>
                <h1 className="text-xl font-semibold text-zinc-100 tracking-tight">可用案例视频</h1>
            </div>
        );
    }
    if (!project) return <h1 className="text-xl font-semibold text-zinc-500">请选择一个项目以查看内容...</h1>;
    
    // Status Mapping
    const statusMap = {
        'active': '进行中',
        'finalized': '已定版',
        'delivered': '已交付',
        'archived': '已归档'
    };

    return (
        <div>
            <div className="flex items-center gap-2 text-xs text-zinc-500 mb-1">
                <span>{project.client}</span>
                <span>/</span>
                <span className={`uppercase px-1.5 py-0.5 rounded text-[9px] font-bold tracking-wider 
                    ${project.status === 'active' ? 'bg-emerald-500/10 text-emerald-400' : ''}
                    ${project.status === 'finalized' ? 'bg-orange-500/10 text-orange-400' : ''}
                    ${project.status === 'delivered' ? 'bg-indigo-500/10 text-indigo-400' : ''}
                `}>
                    {statusMap[project.status]}
                </span>
            </div>
            <h1 className="text-xl font-semibold text-zinc-100 tracking-tight">{project.name}</h1>
        </div>
    );
  };

  // Group videos by "Series" (base filename without vX_ prefix)
  const groupVideosBySeries = (videos: Video[]) => {
      const groups: Record<string, Video[]> = {};
      videos.forEach(video => {
          // Regex to strip v1_ v12_ etc from start
          const baseName = video.name.replace(/^v\d+_/, '');
          if (!groups[baseName]) {
              groups[baseName] = [];
          }
          groups[baseName].push(video);
      });
      
      // Sort versions within groups (Descending: v2 -> v1)
      // This ensures the LATEST version is at index 0 (Leftmost in Grid)
      Object.keys(groups).forEach(key => {
          groups[key].sort((a, b) => b.version - a.version);
      });
      
      return groups;
  };

  const handleShareClick = (video: Video, isLatest: boolean) => {
      setShareState({
          isOpen: true,
          video: video,
          step: isLatest ? 'config' : 'warning',
          isHistorical: !isLatest,
          justification: '',
          allowDownload: false,
          hasPassword: false,
          generatedLink: ''
      });
  };

  const handleGenerateLink = () => {
      // Mock Link Generation
      const link = `https://vioflow.io/share/${shareState.video?.id}/${Math.random().toString(36).substring(7)}`;
      setShareState(prev => ({ ...prev, step: 'success', generatedLink: link }));
  };

  const renderShareModal = () => {
      if (!shareState.isOpen || !shareState.video) return null;

      return (
          <div className="fixed inset-0 z-[100] bg-black/60 backdrop-blur-sm flex items-center justify-center p-4 animate-in fade-in duration-200">
              <div className="bg-zinc-900 border border-zinc-700 w-full max-w-md rounded-xl shadow-2xl flex flex-col overflow-hidden">
                  {/* Header */}
                  <div className="px-5 py-4 border-b border-zinc-800 flex items-center justify-between bg-zinc-950">
                      <h3 className="font-semibold text-zinc-100 flex items-center gap-2">
                          <Share2 className="w-4 h-4 text-indigo-500" />
                          创建对外分享
                      </h3>
                      <button onClick={() => setShareState(prev => ({ ...prev, isOpen: false }))}><X className="w-4 h-4 text-zinc-500 hover:text-zinc-200" /></button>
                  </div>

                  {/* Body Content based on Step */}
                  <div className="p-6">
                      
                      {/* STEP 1: WARNING (Historical) */}
                      {shareState.step === 'warning' && (
                          <div className="space-y-4">
                              <div className="flex gap-3 bg-orange-500/10 border border-orange-500/20 p-4 rounded-lg">
                                  <AlertTriangle className="w-5 h-5 text-orange-500 shrink-0" />
                                  <div className="text-sm text-orange-200">
                                      <p className="font-bold mb-1">您正在分享历史版本 (v{shareState.video.version})</p>
                                      <p className="opacity-80 text-xs">该视频不是最新版本。为了避免客户审阅错误的文件，强制分享需要填写说明。</p>
                                  </div>
                              </div>
                              <div>
                                  <label className="block text-xs font-bold text-zinc-500 uppercase mb-1.5">分享原因 / 说明</label>
                                  <textarea 
                                      className="w-full bg-zinc-950 border border-zinc-700 rounded-lg p-3 text-sm text-zinc-200 focus:border-indigo-500 outline-none resize-none h-24 placeholder-zinc-600"
                                      placeholder="请说明为什么需要分享旧版本..."
                                      value={shareState.justification}
                                      onChange={(e) => setShareState(prev => ({ ...prev, justification: e.target.value }))}
                                  />
                              </div>
                              <div className="flex justify-end pt-2">
                                  <button 
                                    disabled={!shareState.justification.trim()}
                                    onClick={() => setShareState(prev => ({ ...prev, step: 'config' }))}
                                    className="bg-zinc-100 hover:bg-white disabled:bg-zinc-800 disabled:text-zinc-600 text-zinc-900 px-4 py-2 rounded-lg text-sm font-medium transition-colors"
                                  >
                                      下一步
                                  </button>
                              </div>
                          </div>
                      )}

                      {/* STEP 2: CONFIG */}
                      {shareState.step === 'config' && (
                          <div className="space-y-6">
                              <div className="flex items-center gap-3 p-3 bg-zinc-950 rounded border border-zinc-800">
                                  <FileVideo className="w-8 h-8 text-indigo-500" />
                                  <div className="min-w-0">
                                      <div className="text-sm text-zinc-200 truncate">{shareState.video.name}</div>
                                      <div className="text-xs text-zinc-500">v{shareState.video.version} • {shareState.video.size}</div>
                                  </div>
                              </div>

                              <div className="space-y-4">
                                  <div className="flex items-center justify-between">
                                      <div className="flex items-center gap-2 text-zinc-300">
                                          <Download className="w-4 h-4 text-zinc-500" />
                                          <span className="text-sm">允许下载源文件</span>
                                      </div>
                                      <button 
                                        onClick={() => setShareState(prev => ({ ...prev, allowDownload: !prev.allowDownload }))}
                                        className={`w-10 h-5 rounded-full transition-colors relative ${shareState.allowDownload ? 'bg-indigo-600' : 'bg-zinc-700'}`}
                                      >
                                          <span className={`absolute top-1 w-3 h-3 bg-white rounded-full transition-transform ${shareState.allowDownload ? 'left-6' : 'left-1'}`} />
                                      </button>
                                  </div>
                                  
                                  <div className="flex items-center justify-between">
                                      <div className="flex items-center gap-2 text-zinc-300">
                                          <Lock className="w-4 h-4 text-zinc-500" />
                                          <span className="text-sm">密码保护</span>
                                      </div>
                                      <button 
                                        onClick={() => setShareState(prev => ({ ...prev, hasPassword: !prev.hasPassword }))}
                                        className={`w-10 h-5 rounded-full transition-colors relative ${shareState.hasPassword ? 'bg-indigo-600' : 'bg-zinc-700'}`}
                                      >
                                          <span className={`absolute top-1 w-3 h-3 bg-white rounded-full transition-transform ${shareState.hasPassword ? 'left-6' : 'left-1'}`} />
                                      </button>
                                  </div>
                              </div>

                              <div className="pt-2">
                                  <button 
                                    onClick={handleGenerateLink}
                                    className="w-full bg-indigo-600 hover:bg-indigo-500 text-white py-2.5 rounded-lg text-sm font-medium shadow-lg shadow-indigo-900/20 transition-all"
                                  >
                                      创建分享链接
                                  </button>
                              </div>
                          </div>
                      )}

                      {/* STEP 3: SUCCESS */}
                      {shareState.step === 'success' && (
                          <div className="space-y-6 text-center py-2">
                              <div className="w-12 h-12 bg-emerald-500/20 text-emerald-400 rounded-full flex items-center justify-center mx-auto mb-2">
                                  <CheckCircle2 className="w-6 h-6" />
                              </div>
                              <div>
                                  <h4 className="text-lg font-semibold text-zinc-100">链接已生成</h4>
                                  <p className="text-sm text-zinc-500 mt-1">此链接有效期为 7 天</p>
                              </div>

                              <div className="flex items-center gap-2">
                                  <input 
                                    type="text" 
                                    readOnly 
                                    value={shareState.generatedLink}
                                    className="flex-1 bg-zinc-950 border border-zinc-800 rounded-lg px-3 py-2 text-sm text-zinc-300 outline-none"
                                  />
                                  <button 
                                    onClick={() => navigator.clipboard.writeText(shareState.generatedLink)}
                                    className="p-2 bg-zinc-800 hover:bg-zinc-700 text-zinc-200 rounded-lg transition-colors"
                                    title="复制"
                                  >
                                      <Copy className="w-4 h-4" />
                                  </button>
                              </div>

                              <button 
                                onClick={() => setShareState(prev => ({ ...prev, isOpen: false }))}
                                className="text-sm text-zinc-500 hover:text-zinc-300"
                              >
                                  关闭窗口
                              </button>
                          </div>
                      )}
                  </div>
              </div>
          </div>
      );
  };

  const renderContent = () => {
      const groups = groupVideosBySeries(displayVideos);
      const seriesNames = Object.keys(groups).sort();

      if (seriesNames.length === 0) {
          return (
              <div className="flex flex-col items-center justify-center py-20 text-zinc-600">
                  <Film className="w-12 h-12 mb-4 opacity-20" />
                  <p>该项目暂无视频。</p>
              </div>
          );
      }

      if (browserViewMode === 'list') {
          // In list view, only show the latest version (First in the sorted array because we sorted descending)
          const latestVideos = seriesNames.map(name => {
              const versions = groups[name];
              return versions[0]; 
          });

          // List Gap
          const gapClass = browserCardSize === 'small' ? 'gap-0.5' : browserCardSize === 'medium' ? 'gap-2' : 'gap-4';

          return (
              <div className={`flex flex-col ${gapClass}`}>
                  {latestVideos.map((video) => (
                      <VideoCard 
                          key={video.id} 
                          video={video} 
                          viewMode='list'
                          cardSize={browserCardSize}
                          activeModule={activeModule}
                          isInCart={cart.includes(video.id)}
                          isLatest={true}
                          onThumbnailClick={() => dispatch({ type: 'TOGGLE_REVIEW_MODE', payload: true })}
                          onBodyClick={() => dispatch({ type: 'SELECT_VIDEO', payload: video.id })}
                          onToggleCart={() => dispatch({ type: 'TOGGLE_CART_ITEM', payload: video.id })}
                          onShare={() => handleShareClick(video, true)}
                      />
                  ))}
              </div>
          );
      }

      // Grid Mode
      const cardWidthClass = 
        browserCardSize === 'small' ? 'min-w-[180px] max-w-[180px]' : 
        browserCardSize === 'medium' ? 'min-w-[280px] max-w-[280px]' : 
        'min-w-[420px] max-w-[420px]';
      
      const rowGapClass = 
         browserCardSize === 'small' ? 'gap-6' : 
         browserCardSize === 'medium' ? 'gap-10' : 
         'gap-14';

      return (
          <div className={`flex flex-col ${rowGapClass}`}>
              {seriesNames.map(name => {
                  const versions = groups[name];
                  const latestVersionId = versions[0].id; // First is latest due to Descending sort

                  return (
                    <div key={name} className="animate-in fade-in duration-500 slide-in-from-bottom-2">
                        <div className="flex items-center gap-3 mb-3 border-b border-zinc-800/50 pb-2">
                            <FileVideo className="w-5 h-5 text-indigo-500" />
                            <h2 className="text-base font-medium text-zinc-200 tracking-tight">{name}</h2>
                            <span className="text-[10px] text-zinc-500 bg-zinc-900 px-2 py-0.5 rounded-full border border-zinc-800">
                                {versions.length} 个版本
                            </span>
                        </div>
                        
                        {/* Horizontal Version Scroll/Grid */}
                        <div className="flex gap-4 overflow-x-auto pb-4 custom-scrollbar">
                            {versions.map((video) => (
                                <div key={video.id} className={cardWidthClass}>
                                    <VideoCard 
                                        video={video} 
                                        viewMode='grid'
                                        cardSize={browserCardSize}
                                        activeModule={activeModule}
                                        isInCart={cart.includes(video.id)}
                                        isLatest={video.id === latestVersionId}
                                        onThumbnailClick={() => dispatch({ type: 'TOGGLE_REVIEW_MODE', payload: true })}
                                        onBodyClick={() => dispatch({ type: 'SELECT_VIDEO', payload: video.id })}
                                        onToggleCart={() => dispatch({ type: 'TOGGLE_CART_ITEM', payload: video.id })}
                                        onShare={() => handleShareClick(video, video.id === latestVersionId)}
                                    />
                                </div>
                            ))}
                        </div>
                    </div>
                  );
              })}
          </div>
      );
  };

  return (
    <main className={marginClass}>
      <div className="sticky top-14 z-20 bg-zinc-950/80 backdrop-blur-md border-b border-zinc-800 px-6 py-4 mb-6 flex items-center justify-between">
        {renderHeader()}
        
        <div className="flex items-center gap-4">
             {project && activeModule === 'review' && (
                <div className="text-xs text-zinc-500 mr-2">
                    <span className="text-zinc-300">{displayVideos.length}</span> 个视频文件
                </div>
            )}

            {/* View Toggles */}
            <div className="flex items-center gap-1 bg-zinc-900 rounded-lg p-0.5 border border-zinc-800">
                <button 
                    onClick={() => dispatch({ type: 'SET_BROWSER_VIEW_MODE', payload: 'grid' })}
                    className={`p-1.5 rounded transition-all ${browserViewMode === 'grid' ? 'bg-zinc-800 text-zinc-200 shadow-sm' : 'text-zinc-500 hover:text-zinc-300'}`}
                    title="分行视图 (版本流)"
                >
                    <LayoutGrid className="w-4 h-4" />
                </button>
                <button 
                    onClick={() => dispatch({ type: 'SET_BROWSER_VIEW_MODE', payload: 'list' })}
                    className={`p-1.5 rounded transition-all ${browserViewMode === 'list' ? 'bg-zinc-800 text-zinc-200 shadow-sm' : 'text-zinc-500 hover:text-zinc-300'}`}
                    title="列表视图 (仅最新版本)"
                >
                    <List className="w-4 h-4" />
                </button>
            </div>

            {/* Size Settings Dropdown */}
            <div className="relative">
                <button 
                    onClick={() => setIsSettingsOpen(!isSettingsOpen)}
                    className={`p-2 rounded-lg transition-colors border ${isSettingsOpen ? 'bg-zinc-900 border-zinc-700 text-zinc-200' : 'text-zinc-500 hover:text-zinc-300 border-transparent hover:border-zinc-800'}`}
                >
                    <SlidersHorizontal className="w-4 h-4" />
                </button>
                {isSettingsOpen && (
                    <>
                        <div className="fixed inset-0 z-40" onClick={() => setIsSettingsOpen(false)}></div>
                        <div className="absolute right-0 top-full mt-2 w-32 bg-zinc-900 border border-zinc-800 rounded-lg shadow-xl z-50 overflow-hidden animate-in fade-in zoom-in-95 duration-100">
                            <div className="text-[10px] font-bold text-zinc-500 px-3 py-2 uppercase bg-zinc-950 border-b border-zinc-800">视图尺寸</div>
                            <button 
                                onClick={() => { dispatch({type: 'SET_BROWSER_CARD_SIZE', payload: 'small'}); setIsSettingsOpen(false); }}
                                className={`block w-full text-left px-3 py-2 text-xs hover:bg-zinc-800 ${browserCardSize === 'small' ? 'text-indigo-400 font-medium' : 'text-zinc-400'}`}
                            >
                                紧凑 (Small)
                            </button>
                            <button 
                                onClick={() => { dispatch({type: 'SET_BROWSER_CARD_SIZE', payload: 'medium'}); setIsSettingsOpen(false); }}
                                className={`block w-full text-left px-3 py-2 text-xs hover:bg-zinc-800 ${browserCardSize === 'medium' ? 'text-indigo-400 font-medium' : 'text-zinc-400'}`}
                            >
                                标准 (Medium)
                            </button>
                            <button 
                                onClick={() => { dispatch({type: 'SET_BROWSER_CARD_SIZE', payload: 'large'}); setIsSettingsOpen(false); }}
                                className={`block w-full text-left px-3 py-2 text-xs hover:bg-zinc-800 ${browserCardSize === 'large' ? 'text-indigo-400 font-medium' : 'text-zinc-400'}`}
                            >
                                大图 (Large)
                            </button>
                        </div>
                    </>
                )}
            </div>
        </div>
      </div>

      <div className="px-6 pb-20">
         {renderContent()}
      </div>

      {/* RENDER SHARE MODAL */}
      {renderShareModal()}
    </main>
  );
};

const VideoCard: React.FC<{ 
    video: Video; 
    viewMode: 'grid' | 'list';
    cardSize: 'small' | 'medium' | 'large';
    activeModule: string;
    isInCart: boolean;
    isLatest: boolean;
    onThumbnailClick: () => void;
    onBodyClick: () => void;
    onToggleCart: () => void;
    onShare: () => void;
}> = ({ video, viewMode, cardSize, activeModule, isInCart, isLatest, onThumbnailClick, onBodyClick, onToggleCart, onShare }) => {
  
  if (viewMode === 'list') {
      // LIST VIEW
      const containerClass = 
        cardSize === 'small' ? 'py-1 px-2 gap-3 h-[60px]' : 
        cardSize === 'medium' ? 'p-2 gap-4 h-[90px]' : 
        'p-4 gap-6 h-[180px]';
      
      const thumbClass = 
        cardSize === 'small' ? 'w-24 h-full' : 
        cardSize === 'medium' ? 'w-32 h-full' : 
        'aspect-video h-full'; 
      
      const fontSize = cardSize === 'small' ? 'text-xs' : cardSize === 'medium' ? 'text-sm' : 'text-base';
      const metaFontSize = cardSize === 'small' ? 'text-[10px]' : 'text-xs';

      return (
        <div 
          onClick={onBodyClick}
          className={`group flex items-center bg-zinc-900/50 border rounded overflow-hidden transition-all cursor-pointer hover:bg-zinc-900
            ${isInCart ? 'border-indigo-500/50 bg-indigo-500/5' : 'border-zinc-800/50 hover:border-zinc-700'}
            ${containerClass}
          `}
        >
             {/* Thumbnail */}
            <div className={`relative ${thumbClass} bg-zinc-800 rounded-sm overflow-hidden shrink-0`}>
                <img 
                    src={`https://picsum.photos/seed/${video.id}/200/112`} 
                    alt="Thumbnail" 
                    className="w-full h-full object-cover opacity-80"
                />
                 <div onClick={(e) => { e.stopPropagation(); onThumbnailClick(); }} className="absolute inset-0 bg-black/0 hover:bg-black/30 flex items-center justify-center group/play transition-colors">
                     <Play className={`${cardSize === 'small' ? 'w-4 h-4' : 'w-8 h-8'} text-white opacity-0 group-hover/play:opacity-100 drop-shadow-lg`} />
                 </div>
            </div>

            {/* Info */}
            <div className="flex-1 min-w-0 flex items-center justify-between gap-4 h-full">
                <div className="flex flex-col justify-center min-w-0 h-full">
                    <h3 className={`${fontSize} font-medium text-zinc-200 truncate`} title={video.name}>{video.name}</h3>
                    <div className="flex items-center gap-2 mt-0.5">
                        <span className={`${metaFontSize} text-zinc-500`}>v{video.version}</span>
                        {video.status === 'annotated' && <span className="bg-indigo-500/20 text-indigo-300 text-[9px] px-1.5 rounded">已批注</span>}
                        {video.status === 'approved' && <span className="bg-emerald-500/20 text-emerald-300 text-[9px] px-1.5 rounded">已通过</span>}
                        
                        {cardSize !== 'small' && video.changeLog && (
                             <span className={`${metaFontSize} text-zinc-500 truncate max-w-[300px] border-l border-zinc-700 pl-2 ml-1 opacity-70`}>{video.changeLog}</span>
                        )}
                    </div>
                </div>

                <div className={`flex items-center gap-6 ${metaFontSize} text-zinc-500 shrink-0 ${cardSize === 'small' ? 'opacity-0 group-hover:opacity-100 transition-opacity' : ''}`}>
                    {cardSize !== 'small' && <span className="w-16 text-right hidden sm:block">{video.resolution}</span>}
                    <span className="w-16 text-right">{video.size}</span>
                    <span className="w-16 text-right font-mono">{video.duration}</span>
                    <span className="w-24 text-right">{video.uploadTime}</span>
                </div>
            </div>

            {/* Action */}
             <div className="px-2 flex items-center gap-2">
                {activeModule !== 'showcase' && (
                    <button 
                        onClick={(e) => { e.stopPropagation(); onShare(); }}
                        className={`p-1.5 rounded transition-colors ${isLatest ? 'text-indigo-400 hover:text-indigo-300 hover:bg-indigo-500/10' : 'text-zinc-600 hover:text-zinc-400 hover:bg-zinc-800'}`}
                        title={isLatest ? "对外分享" : "分享历史版本"}
                    >
                        <Share2 className="w-4 h-4" />
                    </button>
                )}

                {activeModule === 'showcase' ? (
                    <button 
                        onClick={(e) => { e.stopPropagation(); onToggleCart(); }}
                        className={`p-1.5 rounded transition-colors ${isInCart ? 'bg-indigo-500 text-white' : 'bg-zinc-800 text-zinc-400 hover:text-white'}`}
                    >
                        {isInCart ? <Check className="w-3.5 h-3.5" /> : <Plus className="w-3.5 h-3.5" />}
                    </button>
                ) : (
                    <button className="text-zinc-600 hover:text-zinc-300">
                        <MoreVertical className="w-4 h-4" />
                    </button>
                )}
             </div>
        </div>
      );
  }

  // GRID VIEW
  const thumbHeight = 
    cardSize === 'small' ? 'h-24' : 
    cardSize === 'medium' ? 'h-36' : 
    'h-52'; 
  
  const fontSize = cardSize === 'small' ? 'text-xs' : 'text-sm';

  return (
    <div 
      onClick={onBodyClick}
      className={`group relative bg-zinc-900 border rounded-lg overflow-hidden transition-all cursor-pointer shadow-sm hover:shadow-xl hover:shadow-black/50 flex flex-col h-full
        ${isInCart ? 'border-indigo-500 ring-1 ring-indigo-500/50' : 'border-zinc-800 hover:border-zinc-600'}
      `}
    >
      {/* Thumbnail */}
      <div className={`relative ${thumbHeight} bg-zinc-800 w-full overflow-hidden shrink-0`}>
        <div onClick={(e) => { e.stopPropagation(); onThumbnailClick(); }} className="w-full h-full relative group/thumb">
             <img 
                src={`https://picsum.photos/seed/${video.id}/400/225`} 
                alt="Thumbnail" 
                className="w-full h-full object-cover opacity-80 group-hover/thumb:opacity-100 transition-opacity"
            />
            <div className="absolute inset-0 bg-black/20 group-hover/thumb:bg-black/40 transition-colors flex items-center justify-center">
                <div className={`rounded-full bg-white/10 backdrop-blur-sm flex items-center justify-center opacity-0 group-hover/thumb:opacity-100 scale-75 group-hover/thumb:scale-100 transition-all duration-200 hover:bg-indigo-500 hover:text-white ${cardSize === 'small' ? 'w-8 h-8' : 'w-10 h-10'}`}>
                    <Play className={`${cardSize === 'small' ? 'w-3 h-3' : 'w-4 h-4'} fill-current pl-0.5`} />
                </div>
            </div>
        </div>

        {/* Badges */}
        <div className="absolute top-2 left-2 flex gap-1">
            <span className="bg-black/70 backdrop-blur-md text-[10px] font-bold px-1.5 py-0.5 rounded text-zinc-200 border border-white/10">v{video.version}</span>
            {video.status === 'annotated' && <span className="bg-indigo-500 text-[10px] font-bold px-1.5 py-0.5 rounded text-white">已批注</span>}
            {video.status === 'approved' && <span className="bg-emerald-500 text-[10px] font-bold px-1.5 py-0.5 rounded text-white">已通过</span>}
        </div>
        <div className="absolute bottom-2 right-2 bg-black/70 backdrop-blur-md text-[10px] font-mono px-1.5 py-0.5 rounded text-zinc-200">
            {video.duration}
        </div>
      </div>

      {/* Info Body */}
      <div className={`flex-1 flex flex-col ${cardSize === 'small' ? 'p-2' : 'p-3'}`}>
        <div className="flex items-start justify-between mb-1">
            <h3 className={`font-medium text-zinc-200 truncate pr-2 group-hover:text-indigo-400 transition-colors ${fontSize}`} title={video.name}>{video.name}</h3>
            
            <div className="flex items-center gap-1">
                {activeModule !== 'showcase' && (
                    <button 
                        onClick={(e) => { e.stopPropagation(); onShare(); }}
                        className={`p-1 rounded transition-colors ${isLatest ? 'text-indigo-400 hover:text-white hover:bg-indigo-500' : 'text-zinc-600 hover:text-zinc-400 hover:bg-zinc-800'}`}
                        title={isLatest ? "对外分享" : "分享历史版本"}
                    >
                        <Share2 className="w-3.5 h-3.5" />
                    </button>
                )}

                {activeModule === 'showcase' ? (
                    <button 
                        onClick={(e) => { e.stopPropagation(); onToggleCart(); }}
                        className={`p-1 rounded transition-colors ${isInCart ? 'bg-indigo-500 text-white' : 'bg-zinc-800 text-zinc-400 hover:text-white'}`}
                    >
                        {isInCart ? <Check className="w-3 h-3" /> : <Plus className="w-3 h-3" />}
                    </button>
                ) : (
                    <button className="text-zinc-600 hover:text-zinc-300 opacity-0 group-hover:opacity-100 transition-opacity">
                        <MoreVertical className="w-4 h-4" />
                    </button>
                )}
            </div>
        </div>
        
        {/* Change Log Preview */}
        {cardSize !== 'small' && (
            video.changeLog ? (
                <p className="text-[10px] text-zinc-500 line-clamp-3 bg-zinc-950/50 p-1.5 rounded mb-2 border border-zinc-800/50 min-h-[40px]">
                    {video.changeLog}
                </p>
            ) : (
                <p className="text-[10px] text-zinc-700 italic mb-2 min-h-[40px] flex items-center">无修改记录</p>
            )
        )}

        <div className="mt-auto flex items-center justify-between text-[11px] text-zinc-500 pt-2 border-t border-zinc-800/50">
            <span className="flex items-center gap-1"><Clock className="w-3 h-3" /> {video.uploadTime}</span>
            <span className="font-mono">{video.resolution || 'HD'}</span>
        </div>
      </div>
    </div>
  );
}
