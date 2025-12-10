
import React, { useState, useRef, useEffect } from 'react';
import { Search, Plus, Filter, Folder, MoreHorizontal, Check, Archive, Calendar, LayoutGrid, Clapperboard, X, ChevronDown, User, Users, PlayCircle, Settings, Trash2, Lock } from 'lucide-react';
import { useStore } from '../../App';
import { Project } from '../../types';

// Utility for highlighting text
const HighlightText = ({ text, highlight }: { text: string; highlight: string }) => {
    if (!highlight.trim()) return <>{text}</>;
    const parts = text.split(new RegExp(`(${highlight})`, 'gi'));
    return (
        <>
            {parts.map((part, i) =>
                part.toLowerCase() === highlight.toLowerCase() ? (
                    <span key={i} className="text-indigo-400 font-bold bg-indigo-500/10 rounded px-0.5">{part}</span>
                ) : (
                    part
                )
            )}
        </>
    );
};

export const RetrievalPanel: React.FC = () => {
  const { state, dispatch } = useStore();
  const { activeModule, projects, selectedProjectId, searchTerm, activeTag, videos } = state;

  // View Mode State
  const [viewMode, setViewMode] = useState<'month' | 'group'>('month');

  // Split View Resizing Logic
  const [splitRatio, setSplitRatio] = useState(66); // Percentage
  const containerRef = useRef<HTMLDivElement>(null);
  const isResizing = useRef(false);
  
  // Modal State (Combined Create & Edit)
  const [modalConfig, setModalConfig] = useState<{
      isOpen: boolean;
      mode: 'create' | 'edit';
      editingProjectId?: string;
  }>({ isOpen: false, mode: 'create' });

  // Unlock Modal State (For Finalized Projects)
  const [unlockModal, setUnlockModal] = useState<{
      isOpen: boolean;
      project?: Project;
      justification: string;
  }>({ isOpen: false, justification: '' });

  const [formData, setFormData] = useState({ 
      name: '', 
      client: '', 
      lead: '',
      postLead: '',
      group: '',
      isNewGroup: false,
      team: [] as string[],
      newMemberInput: ''
  });

  // Resizing Handlers
  const handleMouseDown = () => {
    isResizing.current = true;
    document.addEventListener('mousemove', handleMouseMove);
    document.addEventListener('mouseup', handleMouseUp);
    document.body.style.cursor = 'row-resize';
  };
  const handleMouseMove = (e: MouseEvent) => {
    if (!isResizing.current || !containerRef.current) return;
    const containerRect = containerRef.current.getBoundingClientRect();
    const relativeY = e.clientY - containerRect.top;
    const percentage = (relativeY / containerRect.height) * 100;
    setSplitRatio(Math.min(Math.max(percentage, 20), 80));
  };
  const handleMouseUp = () => {
    isResizing.current = false;
    document.removeEventListener('mousemove', handleMouseMove);
    document.removeEventListener('mouseup', handleMouseUp);
    document.body.style.cursor = 'default';
  };

  // Logic: Create / Edit Setup
  const handleOpenCreateModal = () => {
    const date = new Date();
    // YYMM Format: 2405 (May 2024)
    const prefix = `${date.getFullYear().toString().slice(-2)}${(date.getMonth() + 1).toString().padStart(2, '0')}_`;
    
    setFormData({ 
        name: prefix, 
        client: '', 
        lead: '',
        postLead: '',
        group: '广告片',
        isNewGroup: false,
        team: [],
        newMemberInput: ''
    });
    setModalConfig({ isOpen: true, mode: 'create' });
  };

  const handleEditClick = (e: React.MouseEvent, project: Project) => {
      e.stopPropagation();
      
      // Protection Logic: If Finalized, show Unlock Warning
      if (project.status === 'finalized' || project.status === 'delivered') {
          setUnlockModal({
              isOpen: true,
              project,
              justification: ''
          });
          return;
      }

      handleOpenEditModal(project);
  };

  const handleOpenEditModal = (project: Project) => {
      setFormData({
          name: project.name,
          client: project.client,
          lead: project.lead,
          postLead: project.postLead,
          group: project.group,
          isNewGroup: false,
          team: project.team || [],
          newMemberInput: ''
      });
      setModalConfig({ isOpen: true, mode: 'edit', editingProjectId: project.id });
  };

  const handleConfirmUnlock = () => {
      if (unlockModal.justification.trim() && unlockModal.project) {
          // Log logic could go here
          // Close Unlock Modal and Open Edit Modal
          const proj = unlockModal.project;
          setUnlockModal({ isOpen: false, justification: '', project: undefined });
          handleOpenEditModal(proj);
      }
  };

  const handleConfirmModal = () => {
    if (!formData.name) return;

    if (modalConfig.mode === 'create') {
        dispatch({
            type: 'ADD_PROJECT',
            payload: {
                id: `p${Date.now()}`,
                name: formData.name,
                client: formData.client || '客户',
                lead: formData.lead || '待定',
                postLead: formData.postLead || '待定',
                group: formData.group || '未分类',
                status: 'active',
                createdDate: new Date().toISOString(),
                team: formData.team
            }
        });
    } else if (modalConfig.mode === 'edit' && modalConfig.editingProjectId) {
        // Find existing to preserve ID and Status and CreatedDate
        const existing = projects.find(p => p.id === modalConfig.editingProjectId);
        if (existing) {
            dispatch({
                type: 'UPDATE_PROJECT',
                payload: {
                    ...existing,
                    name: formData.name,
                    client: formData.client,
                    lead: formData.lead,
                    postLead: formData.postLead,
                    group: formData.group,
                    team: formData.team
                }
            });
        }
    }
    setModalConfig({ ...modalConfig, isOpen: false });
  };

  const handleAddTeamMember = () => {
      if (formData.newMemberInput.trim()) {
          setFormData({
              ...formData,
              team: [...formData.team, formData.newMemberInput.trim()],
              newMemberInput: ''
          });
      }
  };

  const handleRemoveTeamMember = (member: string) => {
      setFormData({
          ...formData,
          team: formData.team.filter(m => m !== member)
      });
  };

  // Get unique existing groups for dropdown
  const existingGroups = Array.from(new Set(projects.map(p => p.group).filter(g => g && g !== '未分类')));

  // Filtering
  const filteredProjects = projects.filter(p => p.name.toLowerCase().includes(searchTerm.toLowerCase()));

  // Renderers
  const renderProjectItem = (project: Project, icon: React.ReactNode) => (
    <div 
        key={project.id}
        onClick={() => dispatch({ type: 'SELECT_PROJECT', payload: project.id })}
        className={`group flex items-center justify-between py-2 px-2.5 rounded-md cursor-pointer transition-all mb-0.5 relative
        ${selectedProjectId === project.id 
            ? 'bg-indigo-500/10 text-indigo-100 border border-indigo-500/20' 
            : 'text-zinc-400 hover:bg-zinc-900 hover:text-zinc-200 border border-transparent'}`}
    >
      <div className="flex items-center gap-2.5 min-w-0 flex-1">
        {/* Status Dot */}
        {activeModule === 'review' && (
            <div className={`w-1.5 h-1.5 rounded-full shrink-0 shadow-sm ${
                project.status === 'active' 
                    ? 'bg-emerald-500 shadow-[0_0_6px_rgba(16,185,129,0.5)]' 
                    : project.status === 'finalized' 
                        ? 'bg-orange-500' 
                        : 'bg-zinc-600'
            }`} title={project.status} />
        )}
        
        {/* Name with Highlight */}
        <span className="text-sm truncate font-medium leading-none pb-0.5" title={project.name}>
            <HighlightText text={project.name} highlight={searchTerm} />
        </span>
      </div>
      
      {/* Hover Actions */}
      <div className="flex items-center gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
         {activeModule === 'review' && (
             <button 
                onClick={(e) => handleEditClick(e, project)}
                className="p-1 hover:bg-zinc-800 rounded text-zinc-500 hover:text-indigo-400"
                title={project.status === 'finalized' ? "解锁并编辑" : "项目设置"}
             >
                {project.status === 'finalized' ? <Lock className="w-3.5 h-3.5" /> : <Settings className="w-3.5 h-3.5" />}
             </button>
         )}
      </div>
    </div>
  );

  // --- MODULE TREES ---

  // 1. REVIEW
  const renderReviewTree = () => {
    const active = filteredProjects.filter(p => p.status === 'active');
    const finalized = filteredProjects.filter(p => p.status === 'finalized');

    return (
        <div ref={containerRef} className="flex-1 flex flex-col min-h-0 relative">
            {/* Top: Active Projects */}
            <div style={{ height: `${splitRatio}%` }} className="overflow-y-auto p-3 custom-scrollbar">
                <div className="text-[10px] font-bold text-zinc-500 uppercase tracking-wider mb-2 flex items-center gap-2">
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-500"></span>
                    进行中项目
                </div>
                {active.map(p => renderProjectItem(p, null))}
            </div>

            {/* Resizer */}
            <div 
                onMouseDown={handleMouseDown}
                className="h-1 bg-zinc-900 border-y border-zinc-800 cursor-row-resize hover:bg-indigo-500/20 flex justify-center items-center group shrink-0 z-10"
            >
                <div className="w-8 h-1 bg-zinc-700 rounded-full opacity-0 group-hover:opacity-100 transition-opacity"></div>
            </div>

            {/* Bottom: Finalized Projects */}
            <div className="flex-1 overflow-y-auto p-3 bg-zinc-900/30 custom-scrollbar">
                 <div className="text-[10px] font-bold text-zinc-500 uppercase tracking-wider mb-2 flex items-center gap-2">
                    <span className="w-1.5 h-1.5 rounded-full bg-orange-500"></span>
                    已定版 / 锁定
                </div>
                {finalized.map(p => renderProjectItem(p, null))}
            </div>
        </div>
    );
  };

  const renderGroupTree = (sourceProjects: Project[]) => {
    // Group projects by category
    const groups = sourceProjects.reduce((acc, project) => {
        const g = project.group || '未分类';
        if (!acc[g]) acc[g] = [];
        acc[g].push(project);
        return acc;
    }, {} as Record<string, Project[]>);

    return (
        <div className="flex-1 overflow-y-auto p-3 custom-scrollbar">
            {Object.keys(groups).length === 0 && (
                <div className="text-xs text-zinc-600 italic px-2">未找到项目</div>
            )}
            {Object.entries(groups).map(([groupName, groupProjects]) => (
                <div key={groupName} className="mb-6">
                    <div className="flex items-center gap-2 text-[10px] font-bold text-zinc-500 uppercase tracking-wider mb-2 sticky top-0 bg-zinc-950 py-1 z-10">
                        <Folder className="w-3 h-3" />
                        {groupName}
                        <span className="ml-auto bg-zinc-800 text-zinc-400 px-1.5 rounded-full text-[9px]">{groupProjects.length}</span>
                    </div>
                    <div className="space-y-0.5">
                        {groupProjects.map(p => renderProjectItem(p, null))}
                    </div>
                </div>
            ))}
        </div>
    );
  };

  // 2. DELIVERY
  const renderDeliveryTree = () => {
    const pending = filteredProjects.filter(p => p.status === 'finalized');
    const delivered = filteredProjects.filter(p => p.status === 'delivered');

    return (
        <div ref={containerRef} className="flex-1 flex flex-col min-h-0 relative">
             <div style={{ height: `${splitRatio}%` }} className="overflow-y-auto p-3 custom-scrollbar">
                <div className="text-[10px] font-bold text-zinc-500 uppercase tracking-wider mb-2 flex items-center gap-2">
                    <span className="w-1.5 h-1.5 rounded-full bg-yellow-500 animate-pulse"></span>
                    待交付
                </div>
                {pending.length === 0 && <div className="text-xs text-zinc-600 italic px-2">无待办事项</div>}
                {pending.map(p => renderProjectItem(p, <Archive className="w-3.5 h-3.5" />))}
            </div>
            
            <div 
                onMouseDown={handleMouseDown}
                className="h-1 bg-zinc-900 border-y border-zinc-800 cursor-row-resize hover:bg-indigo-500/20 flex justify-center items-center group shrink-0 z-10"
            />

            <div className="flex-1 border-t border-zinc-800 bg-zinc-900/30 p-3 overflow-y-auto">
                <div className="text-[10px] font-bold text-zinc-500 uppercase tracking-wider mb-2 flex items-center gap-2">
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-500"></span>
                    已交付归档
                </div>
                {delivered.map(p => renderProjectItem(p, <Check className="w-3.5 h-3.5 text-emerald-500" />))}
            </div>
        </div>
    );
  };

  const renderDeliveryGroupTree = () => {
      const deliveryProjects = filteredProjects.filter(p => p.status === 'finalized' || p.status === 'delivered');
      return renderGroupTree(deliveryProjects);
  };

  // 3. SHOWCASE
  const renderShowcaseGroupTree = () => (
      <div className="flex-1 flex flex-col p-3">
          <div className="mb-4">
              <h3 className="text-[10px] font-bold text-zinc-500 uppercase tracking-wider mb-2">标签云</h3>
              <div className="flex flex-wrap gap-2 max-h-[128px] overflow-y-auto custom-scrollbar">
                  {['全部', '广告片', '纪录片', '社交媒体', '4K', '竖屏', '航拍'].map(tag => (
                      <button 
                        key={tag}
                        onClick={() => dispatch({ type: 'SET_TAG', payload: tag })}
                        className={`text-xs px-2.5 py-1 rounded-full border transition-all ${activeTag === tag ? 'bg-indigo-500/20 text-indigo-300 border-indigo-500/30' : 'bg-zinc-900 border-zinc-800 text-zinc-500 hover:border-zinc-700'}`}
                      >
                          {tag}
                      </button>
                  ))}
              </div>
          </div>
          <div className="flex-1 flex items-center justify-center border-t border-zinc-800">
               <div className="text-center text-zinc-600 text-xs">
                   <PlayCircle className="w-8 h-8 mx-auto mb-2 opacity-20" />
                   正在浏览 {activeTag === '全部' ? '完整案例库' : activeTag}
               </div>
          </div>
      </div>
  );

  const renderShowcaseMonthTree = () => {
      const caseVideos = videos.filter(v => v.isCaseFile);
      const months = {
          '2025年 1月': caseVideos.filter((_, i) => i % 2 === 0),
          '2024年 12月': caseVideos.filter((_, i) => i % 2 !== 0),
      };

      return (
          <div className="flex-1 overflow-y-auto p-3 custom-scrollbar">
              {Object.entries(months).map(([month, monthVideos]) => (
                  <div key={month} className="mb-6">
                      <div className="flex items-center gap-2 text-[10px] font-bold text-zinc-500 uppercase tracking-wider mb-2 sticky top-0 bg-zinc-950 py-1 z-10">
                          <Calendar className="w-3 h-3" />
                          {month}
                          <span className="ml-auto bg-zinc-800 text-zinc-400 px-1.5 rounded-full text-[9px]">{monthVideos.length}</span>
                      </div>
                      <div className="space-y-0.5">
                          {monthVideos.map(v => (
                              <div 
                                key={v.id} 
                                onClick={() => dispatch({ type: 'SELECT_VIDEO', payload: v.id })}
                                className="flex items-center gap-2 p-2 rounded hover:bg-zinc-900 cursor-pointer text-zinc-400 hover:text-zinc-200 transition-colors"
                              >
                                  <Clapperboard className="w-3.5 h-3.5" />
                                  <span className="text-sm truncate">{v.name}</span>
                              </div>
                          ))}
                      </div>
                  </div>
              ))}
              {caseVideos.length === 0 && <div className="text-xs text-zinc-500 italic p-2">未标记案例视频。</div>}
          </div>
      );
  };

  return (
    <>
        <aside className="fixed left-[64px] top-14 bottom-0 w-[320px] bg-zinc-900 border-r border-zinc-800 z-30 flex flex-col">
        
        {/* Header */}
        <div className="h-14 flex items-center justify-between px-4 border-b border-zinc-800 shrink-0">
            <span className="text-sm font-semibold text-zinc-200">
                {activeModule === 'review' && '快速检索'}
                {activeModule === 'delivery' && '交付中心'}
                {activeModule === 'showcase' && '案例遴选'}
            </span>
            <div className="flex items-center gap-1">
            <div className="flex items-center bg-zinc-950 rounded-lg p-0.5 mr-2 border border-zinc-800">
                <button 
                    onClick={() => setViewMode('month')}
                    className={`p-1 rounded transition-colors ${viewMode === 'month' ? 'bg-zinc-800 text-zinc-100 shadow-sm' : 'text-zinc-500 hover:text-zinc-300'}`}
                    title="月份视图"
                >
                    <Calendar className="w-3.5 h-3.5" />
                </button>
                <button 
                    onClick={() => setViewMode('group')}
                    className={`p-1 rounded transition-colors ${viewMode === 'group' ? 'bg-zinc-800 text-zinc-100 shadow-sm' : 'text-zinc-500 hover:text-zinc-300'}`}
                    title="分组视图"
                >
                    <LayoutGrid className="w-3.5 h-3.5" />
                </button>
            </div>

            <button className="p-1.5 hover:bg-zinc-900 rounded text-zinc-500 hover:text-zinc-300 transition-colors">
                <Filter className="w-4 h-4" />
            </button>
            
            {/* New Project Button - Prominent */}
            {activeModule === 'review' && (
                <button 
                    onClick={handleOpenCreateModal}
                    className="ml-1 p-1.5 bg-indigo-600 hover:bg-indigo-500 text-white rounded shadow-sm shadow-indigo-900/20 transition-all hover:scale-105"
                >
                    <Plus className="w-4 h-4" />
                </button>
            )}
            </div>
        </div>

        {/* Search Input */}
        <div className="p-3 border-b border-zinc-800 shrink-0">
            <div className="relative group">
            <Search className="absolute left-2.5 top-2.5 w-4 h-4 text-zinc-500 group-focus-within:text-zinc-300 transition-colors" />
            <input 
                type="text" 
                placeholder={activeModule === 'showcase' ? "搜索案例视频..." : "筛选项目..."}
                value={searchTerm}
                onChange={(e) => dispatch({ type: 'SET_SEARCH', payload: e.target.value })}
                className="w-full bg-zinc-900 border border-zinc-800 rounded-lg pl-9 pr-3 py-2 text-sm text-zinc-200 placeholder-zinc-600 focus:outline-none focus:ring-1 focus:ring-indigo-500/50 focus:border-indigo-500/50 transition-all"
            />
            </div>
        </div>

        {/* Content Switching Logic */}
        {activeModule === 'review' && (viewMode === 'month' ? renderReviewTree() : renderGroupTree(filteredProjects))}
        
        {activeModule === 'delivery' && (viewMode === 'month' ? renderDeliveryTree() : renderDeliveryGroupTree())}
        
        {activeModule === 'showcase' && (viewMode === 'group' ? renderShowcaseGroupTree() : renderShowcaseMonthTree())}

        </aside>

        {/* UNLOCK / JUSTIFICATION MODAL */}
        {unlockModal.isOpen && (
            <div className="fixed inset-0 z-[100] bg-black/70 backdrop-blur-sm flex items-center justify-center p-4">
                <div className="bg-zinc-900 border border-orange-500/30 w-full max-w-sm rounded-xl shadow-2xl flex flex-col animate-in fade-in zoom-in-95 duration-200">
                     <div className="px-5 py-4 bg-orange-500/10 border-b border-orange-500/20 rounded-t-xl flex items-center gap-3">
                         <div className="p-2 bg-orange-500/20 rounded-full text-orange-500">
                             <Lock className="w-5 h-5" />
                         </div>
                         <div>
                             <h3 className="font-semibold text-orange-200">项目已定版锁定</h3>
                             <p className="text-xs text-orange-300/70">该项目处于定版状态，编辑受限。</p>
                         </div>
                     </div>
                     <div className="p-6 space-y-4">
                         <p className="text-sm text-zinc-300">
                            为了保证交付内容的一致性，修改已定版项目的设置需要填写修改说明。
                         </p>
                         <div>
                             <label className="block text-xs font-bold text-zinc-500 uppercase mb-1.5">修改 / 解锁说明</label>
                             <textarea 
                                autoFocus
                                className="w-full bg-zinc-950 border border-zinc-700 rounded-lg p-3 text-sm text-zinc-200 focus:border-orange-500 outline-none resize-none h-24 placeholder-zinc-600"
                                placeholder="请说明为什么需要修改项目信息..."
                                value={unlockModal.justification}
                                onChange={(e) => setUnlockModal({...unlockModal, justification: e.target.value})}
                             />
                         </div>
                     </div>
                     <div className="p-4 border-t border-zinc-800 flex justify-end gap-3 bg-zinc-950 rounded-b-xl">
                        <button 
                            onClick={() => setUnlockModal({...unlockModal, isOpen: false})}
                            className="px-4 py-2 text-sm text-zinc-400 hover:text-zinc-200"
                        >
                            取消
                        </button>
                        <button 
                            disabled={!unlockModal.justification.trim()}
                            onClick={handleConfirmUnlock}
                            className="px-4 py-2 text-sm bg-orange-600 hover:bg-orange-500 disabled:bg-zinc-800 disabled:text-zinc-500 text-white font-medium rounded-lg transition-colors"
                        >
                            解锁并编辑
                        </button>
                     </div>
                </div>
            </div>
        )}

        {/* CREATE / EDIT MODAL */}
        {modalConfig.isOpen && (
            <div className="fixed inset-0 z-[100] bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
                <div className="bg-zinc-900 border border-zinc-700 w-full max-w-md rounded-xl shadow-2xl flex flex-col overflow-hidden animate-in fade-in zoom-in-95 duration-200">
                    <div className="px-6 py-4 border-b border-zinc-800 flex items-center justify-between bg-zinc-950">
                        <h2 className="text-lg font-semibold text-zinc-100">
                            {modalConfig.mode === 'create' ? '新建项目' : '编辑项目设置'}
                        </h2>
                        <button onClick={() => setModalConfig({...modalConfig, isOpen: false})} className="text-zinc-500 hover:text-white">
                            <X className="w-5 h-5" />
                        </button>
                    </div>
                    
                    <div className="p-6 space-y-4 max-h-[80vh] overflow-y-auto custom-scrollbar">
                        {/* Name */}
                        <div>
                            <label className="block text-xs font-medium text-zinc-400 mb-1.5 uppercase">项目名称 (YYMM_...)</label>
                            <input 
                                autoFocus
                                type="text" 
                                value={formData.name}
                                onChange={(e) => setFormData({...formData, name: e.target.value})}
                                className="w-full bg-zinc-950 border border-zinc-700 rounded-lg px-3 py-2.5 text-zinc-100 focus:ring-1 focus:ring-indigo-500 focus:border-indigo-500 outline-none"
                            />
                        </div>

                        {/* Leads Row */}
                        <div className="grid grid-cols-2 gap-4">
                            <div>
                                <label className="block text-xs font-medium text-zinc-400 mb-1.5 uppercase">项目负责人</label>
                                <div className="relative">
                                    <User className="absolute left-2.5 top-2.5 w-4 h-4 text-zinc-600" />
                                    <input 
                                        type="text" 
                                        placeholder="姓名"
                                        value={formData.lead}
                                        onChange={(e) => setFormData({...formData, lead: e.target.value})}
                                        className="w-full bg-zinc-950 border border-zinc-700 rounded-lg pl-9 pr-3 py-2 text-sm text-zinc-100 focus:border-indigo-500 outline-none"
                                    />
                                </div>
                            </div>
                            <div>
                                <label className="block text-xs font-medium text-zinc-400 mb-1.5 uppercase">后期负责人</label>
                                <div className="relative">
                                    <Users className="absolute left-2.5 top-2.5 w-4 h-4 text-zinc-600" />
                                    <input 
                                        type="text" 
                                        placeholder="姓名"
                                        value={formData.postLead}
                                        onChange={(e) => setFormData({...formData, postLead: e.target.value})}
                                        className="w-full bg-zinc-950 border border-zinc-700 rounded-lg pl-9 pr-3 py-2 text-sm text-zinc-100 focus:border-indigo-500 outline-none"
                                    />
                                </div>
                            </div>
                        </div>

                        {/* Client */}
                        <div>
                            <label className="block text-xs font-medium text-zinc-400 mb-1.5 uppercase">客户名称</label>
                            <input 
                                type="text" 
                                placeholder="例如：Nike、Apple..."
                                value={formData.client}
                                onChange={(e) => setFormData({...formData, client: e.target.value})}
                                className="w-full bg-zinc-950 border border-zinc-700 rounded-lg px-3 py-2 text-sm text-zinc-100 focus:border-indigo-500 outline-none"
                            />
                        </div>

                        {/* Group Selection */}
                        <div>
                            <label className="block text-xs font-medium text-zinc-400 mb-1.5 uppercase">所属组别 / 分类</label>
                            {formData.isNewGroup ? (
                                <div className="flex gap-2">
                                    <input 
                                        type="text" 
                                        placeholder="输入新组名..."
                                        value={formData.group}
                                        onChange={(e) => setFormData({...formData, group: e.target.value})}
                                        className="flex-1 bg-zinc-950 border border-indigo-500 rounded-lg px-3 py-2 text-sm text-zinc-100 outline-none"
                                    />
                                    <button 
                                        onClick={() => setFormData({...formData, isNewGroup: false, group: '广告片'})}
                                        className="px-3 py-2 bg-zinc-800 hover:bg-zinc-700 text-zinc-300 rounded-lg text-xs"
                                    >
                                        取消
                                    </button>
                                </div>
                            ) : (
                                <div className="relative">
                                    <select 
                                        value={formData.group}
                                        onChange={(e) => {
                                            if (e.target.value === '__NEW__') {
                                                setFormData({...formData, isNewGroup: true, group: ''});
                                            } else {
                                                setFormData({...formData, group: e.target.value});
                                            }
                                        }}
                                        className="w-full appearance-none bg-zinc-950 border border-zinc-700 rounded-lg px-3 py-2 text-sm text-zinc-100 focus:border-indigo-500 outline-none"
                                    >
                                        <option value="Uncategorized">无组别</option>
                                        {existingGroups.map(g => <option key={g} value={g}>{g}</option>)}
                                        <option disabled>──────────</option>
                                        <option value="__NEW__">+ 新建组别</option>
                                    </select>
                                    <ChevronDown className="absolute right-3 top-2.5 w-4 h-4 text-zinc-500 pointer-events-none" />
                                </div>
                            )}
                        </div>

                        {/* Team Members */}
                        <div>
                            <label className="block text-xs font-medium text-zinc-400 mb-1.5 uppercase">团队成员</label>
                            <div className="flex gap-2 mb-3">
                                <input 
                                    type="text" 
                                    placeholder="添加成员姓名..."
                                    value={formData.newMemberInput}
                                    onChange={(e) => setFormData({...formData, newMemberInput: e.target.value})}
                                    onKeyDown={(e) => e.key === 'Enter' && handleAddTeamMember()}
                                    className="flex-1 bg-zinc-950 border border-zinc-700 rounded-lg px-3 py-2 text-sm text-zinc-100 focus:border-indigo-500 outline-none"
                                />
                                <button 
                                    onClick={handleAddTeamMember}
                                    className="px-3 bg-zinc-800 hover:bg-zinc-700 text-zinc-300 rounded-lg text-xs"
                                >
                                    添加
                                </button>
                            </div>
                            <div className="flex flex-wrap gap-2">
                                {formData.team.map((member, idx) => (
                                    <span key={idx} className="bg-zinc-800 border border-zinc-700 text-zinc-200 text-xs px-2 py-1 rounded-full flex items-center gap-1">
                                        {member}
                                        <button onClick={() => handleRemoveTeamMember(member)} className="text-zinc-500 hover:text-red-400">
                                            <X className="w-3 h-3" />
                                        </button>
                                    </span>
                                ))}
                                {formData.team.length === 0 && <span className="text-xs text-zinc-600 italic">暂无成员</span>}
                            </div>
                        </div>
                    </div>

                    <div className="p-4 bg-zinc-950 border-t border-zinc-800 flex justify-end gap-3">
                        <button 
                            onClick={() => setModalConfig({...modalConfig, isOpen: false})}
                            className="px-4 py-2 text-sm text-zinc-400 hover:text-zinc-200 hover:bg-zinc-800 rounded-lg transition-colors"
                        >
                            取消
                        </button>
                        <button 
                            onClick={handleConfirmModal}
                            className="px-4 py-2 text-sm bg-indigo-600 hover:bg-indigo-500 text-white font-medium rounded-lg shadow-lg shadow-indigo-900/20 transition-all hover:scale-105 active:scale-95"
                        >
                            {modalConfig.mode === 'create' ? '创建项目' : '保存更改'}
                        </button>
                    </div>
                </div>
            </div>
        )}
    </>
  );
};
