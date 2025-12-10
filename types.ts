
export type ModuleType = 'library' | 'review' | 'delivery' | 'showcase' | 'settings';
export type ProjectStatus = 'active' | 'finalized' | 'delivered' | 'archived';
export type VideoStatus = 'initial' | 'annotated' | 'approved';

export interface Video {
  id: string;
  projectId: string;
  name: string; // Filename
  type: 'video' | 'image' | 'audio';
  url: string; 
  version: number;
  uploadTime: string;
  isCaseFile: boolean; // Marked for Showcase
  size: string;
  duration?: string;
  resolution?: string; // e.g., '1920x1080'
  status: VideoStatus;
  changeLog?: string;
}

export interface Project {
  id: string;
  name: string; // Format: YYMM_Name
  client: string;
  lead: string;
  postLead: string;
  group: string; 
  status: ProjectStatus;
  createdDate: string;
  team: string[]; // Team members visible to this project
}

export interface DeliveryData {
  projectId: string;
  hasCleanFeed: boolean;
  hasMusicAuth: boolean;
  hasMetadata: boolean;
  packageLink?: string;
  sentDate?: string;
}

export interface UploadItem {
  id: string;
  filename: string;
  progress: number;
  status: 'uploading' | 'completed' | 'error';
  targetProjectName: string;
}

export interface Notification {
  id: string;
  type: 'info' | 'success' | 'alert';
  title: string;
  message: string;
  time: string;
}

export interface AppState {
  activeModule: ModuleType;
  projects: Project[];
  videos: Video[]; // Renamed from assets
  deliveries: DeliveryData[];
  cart: string[]; // List of Video IDs for Showcase
  uploadQueue: UploadItem[]; // Global upload queue
  notifications: Notification[]; // Global notifications
  
  // UI State
  selectedProjectId: string | null;
  selectedVideoId: string | null;
  isReviewMode: boolean;
  showWorkbench: boolean;
  activeDrawer: 'none' | 'transfer' | 'messages';
  browserViewMode: 'grid' | 'list';
  browserCardSize: 'small' | 'medium' | 'large'; // NEW: Card Size State
  
  // Retrieval Panel State
  searchTerm: string;
  activeTag: string;
}

export type Action =
  | { type: 'SET_MODULE'; payload: ModuleType }
  | { type: 'SELECT_PROJECT'; payload: string }
  | { type: 'SELECT_VIDEO'; payload: string | null }
  | { type: 'ADD_PROJECT'; payload: Project }
  | { type: 'UPDATE_PROJECT'; payload: Project }
  | { type: 'ADD_VIDEO'; payload: Video }
  | { type: 'FINALIZE_PROJECT'; payload: string } // Review -> Delivery
  | { type: 'COMPLETE_DELIVERY'; payload: string } // Delivery -> Archive/Showcase Source
  | { type: 'UPDATE_DELIVERY_CHECKLIST'; payload: { projectId: string; field: keyof DeliveryData; value: boolean } }
  | { type: 'TOGGLE_CASE_FILE'; payload: string } // Toggle isCaseFile on a Video
  | { type: 'TOGGLE_CART_ITEM'; payload: string } // Showcase Cart
  | { type: 'SET_SEARCH'; payload: string }
  | { type: 'SET_TAG'; payload: string }
  | { type: 'TOGGLE_DRAWER'; payload: 'none' | 'transfer' | 'messages' }
  | { type: 'TOGGLE_REVIEW_MODE'; payload: boolean }
  | { type: 'TOGGLE_WORKBENCH'; payload: boolean }
  | { type: 'UPDATE_VIDEO_STATUS'; payload: { videoId: string; status: VideoStatus } }
  | { type: 'SET_BROWSER_VIEW_MODE'; payload: 'grid' | 'list' }
  | { type: 'SET_BROWSER_CARD_SIZE'; payload: 'small' | 'medium' | 'large' }
  | { type: 'ADD_UPLOAD'; payload: UploadItem }
  | { type: 'UPDATE_UPLOAD_PROGRESS'; payload: { id: string; progress: number } }
  | { type: 'COMPLETE_UPLOAD'; payload: string }
  | { type: 'ADD_NOTIFICATION'; payload: Notification }
  | { type: 'CLEAR_NOTIFICATIONS' };
