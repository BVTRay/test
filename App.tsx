
import React, { useReducer, createContext, useContext } from 'react';
import { Header } from './components/Layout/Header';
import { Sidebar } from './components/Layout/Sidebar';
import { RetrievalPanel } from './components/Layout/RetrievalPanel';
import { Workbench } from './components/Layout/Workbench';
import { MainBrowser } from './components/Layout/MainBrowser';
import { ReviewOverlay } from './components/Layout/ReviewOverlay';
import { Drawer } from './components/UI/Drawer';
import { AppState, Action, Project, Video, DeliveryData } from './types';
import { FileUp, CheckCircle, BellRing, Loader2 } from 'lucide-react';

// --- MOCK DATA ---
const INITIAL_PROJECTS: Project[] = [
  { id: 'p1', name: '2412_Nike_AirMax_Holiday', client: 'Nike', lead: 'Sarah D.', postLead: 'Mike', group: '广告片', status: 'active', createdDate: '2024-12-01', team: ['Sarah D.', 'Mike', 'Alex'] },
  { id: 'p2', name: '2501_Spotify_Wrapped_Asia', client: 'Spotify', lead: 'Alex', postLead: 'Jen', group: '社交媒体', status: 'active', createdDate: '2025-01-10', team: ['Alex', 'Jen'] },
  { id: 'p3', name: '2411_Netflix_Docu_S1', client: 'Netflix', lead: 'Jessica', postLead: 'Tom', group: '长视频', status: 'finalized', createdDate: '2024-11-05', team: ['Jessica', 'Tom', 'Sarah D.'] },
  { id: 'p4', name: '2410_Porsche_911_Launch', client: 'Porsche', lead: 'Tom', postLead: 'Sarah', group: '广告片', status: 'delivered', createdDate: '2024-10-20', team: ['Tom', 'Sarah'] },
];

const INITIAL_VIDEOS: Video[] = [
  { id: 'v1', projectId: 'p1', name: 'v4_Nike_AirMax.mp4', type: 'video', url: '', version: 4, uploadTime: '2小时前', isCaseFile: false, size: '2.4 GB', duration: '00:01:30', resolution: '3840x2160', status: 'initial', changeLog: '调整了结尾Logo的入场动画' },
  { id: 'v2', projectId: 'p1', name: 'v3_Nike_AirMax.mp4', type: 'video', url: '', version: 3, uploadTime: '昨天', isCaseFile: false, size: '2.4 GB', duration: '00:01:30', resolution: '3840x2160', status: 'annotated', changeLog: '根据客户意见修改了调色' },
  { id: 'v3', projectId: 'p4', name: 'v12_Porsche_Launch_Master.mov', type: 'video', url: '', version: 12, uploadTime: '2周前', isCaseFile: true, size: '42 GB', duration: '00:00:60', resolution: '4096x2160', status: 'approved', changeLog: '最终定版' },
  { id: 'v4', projectId: 'p3', name: 'v8_Netflix_Ep1_Lock.mp4', type: 'video', url: '', version: 8, uploadTime: '3天前', isCaseFile: false, size: '1.8 GB', duration: '00:45:00', resolution: '1920x1080', status: 'initial', changeLog: '粗剪定版' },
];

const INITIAL_DELIVERIES: DeliveryData[] = [
  { projectId: 'p3', hasCleanFeed: true, hasMusicAuth: false, hasMetadata: true }, // Pending
  { projectId: 'p4', hasCleanFeed: true, hasMusicAuth: true, hasMetadata: true, sentDate: '2024-10-25' }, // Delivered
];

const initialState: AppState = {
  activeModule: 'review',
  projects: INITIAL_PROJECTS,
  videos: INITIAL_VIDEOS,
  deliveries: INITIAL_DELIVERIES,
  cart: [],
  uploadQueue: [],
  notifications: [], // Initial Notifications
  selectedProjectId: 'p1',
  selectedVideoId: null,
  isReviewMode: false,
  showWorkbench: false, // Default to hidden
  activeDrawer: 'none',
  searchTerm: '',
  activeTag: '全部',
  browserViewMode: 'grid',
  browserCardSize: 'medium',
};

// --- REDUCER ---
function appReducer(state: AppState, action: Action): AppState {
  switch (action.type) {
    case 'SET_MODULE':
      return { 
        ...state, 
        activeModule: action.payload,
        selectedProjectId: null, 
        selectedVideoId: null,
        searchTerm: '',
        showWorkbench: false // Auto close when switching modules
      };
    case 'SELECT_PROJECT':
      return { 
        ...state, 
        selectedProjectId: action.payload, 
        selectedVideoId: null,
        showWorkbench: true // Auto open when project selected
      };
    case 'SELECT_VIDEO':
      return { 
        ...state, 
        selectedVideoId: action.payload, 
        showWorkbench: true // Auto open when video selected
      };
    case 'ADD_PROJECT':
      return { 
        ...state, 
        projects: [action.payload, ...state.projects], 
        selectedProjectId: action.payload.id,
        showWorkbench: true // Auto open for new project
      };
    case 'UPDATE_PROJECT':
      return {
        ...state,
        projects: state.projects.map(p => p.id === action.payload.id ? action.payload : p),
      };
    case 'ADD_VIDEO':
      return { ...state, videos: [action.payload, ...state.videos] };
    case 'FINALIZE_PROJECT': {
      const updatedProjects = state.projects.map(p => 
        p.id === action.payload ? { ...p, status: 'finalized' as const } : p
      );
      const deliveryExists = state.deliveries.find(d => d.projectId === action.payload);
      const newDeliveries = deliveryExists 
        ? state.deliveries 
        : [...state.deliveries, { projectId: action.payload, hasCleanFeed: false, hasMusicAuth: false, hasMetadata: false }];
      
      return { ...state, projects: updatedProjects, deliveries: newDeliveries, selectedProjectId: null };
    }
    case 'COMPLETE_DELIVERY': {
      const updatedProjects = state.projects.map(p => 
        p.id === action.payload ? { ...p, status: 'delivered' as const } : p
      );
      return { ...state, projects: updatedProjects, selectedProjectId: null };
    }
    case 'UPDATE_DELIVERY_CHECKLIST': {
      return {
        ...state,
        deliveries: state.deliveries.map(d => 
          d.projectId === action.payload.projectId ? { ...d, [action.payload.field]: action.payload.value } : d
        )
      };
    }
    case 'TOGGLE_CASE_FILE':
      return {
        ...state,
        videos: state.videos.map(v => v.id === action.payload ? { ...v, isCaseFile: !v.isCaseFile } : v)
      };
    case 'UPDATE_VIDEO_STATUS':
      return {
        ...state,
        videos: state.videos.map(v => v.id === action.payload.videoId ? { ...v, status: action.payload.status } : v)
      };
    case 'TOGGLE_CART_ITEM':
      const exists = state.cart.includes(action.payload);
      return {
        ...state,
        cart: exists ? state.cart.filter(id => id !== action.payload) : [...state.cart, action.payload]
      };
    case 'SET_SEARCH':
      return { ...state, searchTerm: action.payload };
    case 'SET_TAG':
      return { ...state, activeTag: action.payload };
    case 'TOGGLE_DRAWER':
      return { ...state, activeDrawer: action.payload };
    case 'TOGGLE_REVIEW_MODE':
      return { ...state, isReviewMode: action.payload };
    case 'TOGGLE_WORKBENCH':
      return { ...state, showWorkbench: action.payload };
    case 'SET_BROWSER_VIEW_MODE':
      return { ...state, browserViewMode: action.payload };
    case 'SET_BROWSER_CARD_SIZE':
      return { ...state, browserCardSize: action.payload };
    case 'ADD_UPLOAD':
      return { ...state, uploadQueue: [action.payload, ...state.uploadQueue] };
    case 'UPDATE_UPLOAD_PROGRESS':
      return {
        ...state,
        uploadQueue: state.uploadQueue.map(item => 
          item.id === action.payload.id ? { ...item, progress: action.payload.progress } : item
        )
      };
    case 'COMPLETE_UPLOAD':
      return {
        ...state,
        uploadQueue: state.uploadQueue.filter(item => item.id !== action.payload)
      };
    case 'ADD_NOTIFICATION':
      return { ...state, notifications: [action.payload, ...state.notifications] };
    case 'CLEAR_NOTIFICATIONS':
      return { ...state, notifications: [] };
    default:
      return state;
  }
}

// --- CONTEXT ---
export const StoreContext = createContext<{ state: AppState; dispatch: React.Dispatch<Action> } | null>(null);

export const useStore = () => {
  const context = useContext(StoreContext);
  if (!context) throw new Error("useStore must be used within a StoreProvider");
  return context;
};

// --- APP COMPONENT ---
const App: React.FC = () => {
  const [state, dispatch] = useReducer(appReducer, initialState);

  const renderTransferContent = () => (
    <div className="space-y-4">
        {state.uploadQueue.length === 0 ? (
            <div className="text-zinc-500 text-sm text-center py-10">当前没有正在进行的传输任务</div>
        ) : (
            state.uploadQueue.map(item => (
                <div key={item.id} className="p-4 bg-zinc-900 rounded-lg border border-zinc-800">
                    <div className="flex items-start gap-4">
                        <div className="w-10 h-10 rounded-full bg-indigo-500/10 flex items-center justify-center shrink-0">
                            <Loader2 className="w-5 h-5 text-indigo-400 animate-spin" />
                        </div>
                        <div className="flex-1 min-w-0">
                            <h4 className="text-sm font-medium text-zinc-200 truncate">{item.filename}</h4>
                            <p className="text-xs text-zinc-500 mt-1 truncate">上传至: {item.targetProjectName}</p>
                            <div className="w-full bg-zinc-800 h-1.5 rounded-full mt-3 overflow-hidden">
                                <div 
                                    className="bg-indigo-500 h-full rounded-full transition-all duration-300" 
                                    style={{ width: `${item.progress}%` }}
                                ></div>
                            </div>
                            <div className="flex justify-between text-[10px] text-zinc-500 mt-1">
                                <span>{item.progress}%</span>
                                <span>{item.progress < 100 ? '正在上传...' : '处理中...'}</span>
                            </div>
                        </div>
                    </div>
                </div>
            ))
        )}
    </div>
  );

  const renderNotificationsContent = () => (
    state.notifications.length === 0 ? (
      <div className="flex flex-col items-center justify-center h-40 text-zinc-500">
          <BellRing className="w-8 h-8 mb-2 opacity-20" />
          <p className="text-xs">暂无新通知</p>
      </div>
    ) : (
      <div className="space-y-3">
          {state.notifications.map(n => (
              <div key={n.id} className="p-3 bg-zinc-900 border border-zinc-800 rounded-lg flex gap-3 animate-in slide-in-from-right-2 duration-300">
                  <div className={`mt-1 w-2 h-2 rounded-full shrink-0 ${n.type === 'success' ? 'bg-emerald-500' : n.type === 'alert' ? 'bg-orange-500' : 'bg-indigo-500'}`} />
                  <div>
                      <h4 className="text-sm text-zinc-200 font-medium">{n.title}</h4>
                      <p className="text-xs text-zinc-500 mt-1 leading-relaxed">{n.message}</p>
                      <span className="text-[10px] text-zinc-600 mt-2 block">{n.time}</span>
                  </div>
              </div>
          ))}
          <button 
            onClick={() => dispatch({type: 'CLEAR_NOTIFICATIONS'})} 
            className="w-full py-2 text-xs text-zinc-500 hover:text-zinc-300 hover:bg-zinc-900 rounded transition-colors"
          >
            清空通知
          </button>
      </div>
    )
  );

  return (
    <StoreContext.Provider value={{ state, dispatch }}>
      <div className="bg-zinc-950 min-h-screen text-zinc-200 font-sans selection:bg-indigo-500/30">
        
        <Header 
          onToggleDrawer={(d) => dispatch({ type: 'TOGGLE_DRAWER', payload: d })} 
          activeDrawer={state.activeDrawer} 
        />

        <Sidebar 
          activeModule={state.activeModule} 
          onChangeModule={(mod) => dispatch({ type: 'SET_MODULE', payload: mod })} 
        />

        <RetrievalPanel />

        <Workbench visible={state.showWorkbench} />

        <MainBrowser />

        <ReviewOverlay 
          isOpen={state.isReviewMode} 
          onClose={() => dispatch({ type: 'TOGGLE_REVIEW_MODE', payload: false })} 
        />

        <Drawer 
          isOpen={state.activeDrawer === 'transfer'} 
          onClose={() => dispatch({ type: 'TOGGLE_DRAWER', payload: 'none' })} 
          title={`传输队列 (${state.uploadQueue.length})`}
        >
            {renderTransferContent()}
        </Drawer>

        <Drawer 
          isOpen={state.activeDrawer === 'messages'} 
          onClose={() => dispatch({ type: 'TOGGLE_DRAWER', payload: 'none' })} 
          title={`通知消息 (${state.notifications.length})`}
        >
            {renderNotificationsContent()}
        </Drawer>

      </div>
    </StoreContext.Provider>
  );
};

export default App;
