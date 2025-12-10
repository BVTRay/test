
export type ModuleType = 'library' | 'review' | 'delivery' | 'showcase' | 'settings' | 'dashboard';
export type ProjectStatus = 'active' | 'finalized' | 'delivered' | 'archived';
export type VideoStatus = 'initial' | 'annotated' | 'approved';
export type AspectRatio = 'landscape' | 'portrait';
export type StorageTier = 'standard' | 'cold';

export interface Tag {
  id: string;
  name: string; // 标签名称, 如: 'AI生成', '三维制作'
  category?: string; // 标签分类, 可选
  usageCount: number; // 使用次数, 用于排序和展示
}

export interface Video {
  id: string;
  projectId: string;
  name: string; // Filename, 包含版本号前缀 v1_, v2_等
  originalFilename?: string; // 原始文件名
  baseName?: string; // 去除版本号的基础名称, 用于版本分组
  type: 'video' | 'image' | 'audio';
  url: string; 
  storageUrl?: string; // 对象存储URL
  storageKey?: string; // 对象存储Key
  storageTier?: StorageTier; // 存储层级: 标准/冷存储
  thumbnailUrl?: string; // 预览图URL
  version: number;
  uploadTime: string;
  isCaseFile: boolean; // Marked for Showcase
  isMainDelivery: boolean; // Marked as main delivery file (H.264 for showcase)
  isReference?: boolean; // 是否为引用文件, 案例模块使用
  referencedVideoId?: string; // 如果is_reference=true, 指向原文件
  size: string;
  duration?: string;
  resolution?: string; // e.g., '1920x1080'
  aspectRatio?: AspectRatio; // 横屏/竖屏, 用于UI布局
  status: VideoStatus;
  changeLog?: string;
  tags?: string[]; // Tags like 'AI生成', '三维制作', '病毒广告', '剧情' etc. (保留兼容性)
  tagIds?: string[]; // 标签ID数组 (新字段, 关联Tag表)
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
  lastActivityAt?: string; // 最后活跃时间, 用于工作台排序
  lastOpenedAt?: string; // 最后打开时间, 用于浏览区默认显示
  archivedAt?: string; // 归档时间, 用于冷归档判断
  finalizedAt?: string; // 定版时间
  deliveredAt?: string; // 交付时间
  team: string[]; // Team members visible to this project
}

export interface DeliveryData {
  projectId: string;
  hasCleanFeed: boolean;
  hasMusicAuth: boolean;
  hasMetadata: boolean;
  hasTechReview: boolean; // 技术审查通过
  hasCopyrightCheck: boolean; // 字体/音乐/视频版权风险确认
  hasScript: boolean; // 视频文稿
  hasCopyrightFiles: boolean; // 版权文件
  hasMultiResolution: boolean; // 不同分辨率文件（可选）
  deliveryNote?: string; // 交付说明
  deliveryTitle?: string; // 交付标题（用于对外交付）
  deliveryDescription?: string; // 对外交付说明
  packageLink?: string;
  sentDate?: string;
  deliveryPackages?: DeliveryPackage[]; // 交付包记录
}

export interface DeliveryPackage {
  id: string;
  projectId: string;
  title: string;
  description: string;
  link: string;
  createdAt: string;
  downloadCount: number;
  isActive: boolean;
}

// Showcase (案例) 数据结构
export interface ShowcaseItem {
  videoId: string;
  order: number;
  group?: string;
  description?: string;
}

export interface ShowcasePackage {
  id: string;
  title: string;
  description: string;
  mode: 'quick_player' | 'pitch_page'; // 更新: 快速分享/提案微站
  clientName?: string; // pitch_page模式客户名称
  link: string;
  createdAt: string;
  viewCount: number;
  isActive: boolean;
  items: ShowcaseItem[];
  salesUserId?: string; // 销售负责人, 用于接收观看通知
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
  type: 'info' | 'success' | 'alert' | 'view_tracking'; // 新增view_tracking类型
  title: string;
  message: string;
  time: string;
  relatedType?: 'video' | 'project' | 'share_link' | 'showcase_package'; // 关联类型
  relatedId?: string; // 关联ID
}

export interface AppState {
  activeModule: ModuleType;
  projects: Project[];
  videos: Video[]; // Renamed from assets
  deliveries: DeliveryData[];
  tags: Tag[]; // 系统标签列表 (新增)
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
  deliveryViewMode: 'files' | 'packages'; // 交付模块浏览区视图：文件视图 / 交付包记录视图
  selectedDeliveryFiles: string[]; // 已交付项目中选中的文件ID列表（用于生成交付链接）

  // Showcase State
  showcaseViewMode: 'files' | 'packages'; // 案例模块视图：文件视图 / 分享记录视图
  filteredShowcaseVideos: string[]; // 筛选后临时显示在浏览区的案例文件ID列表
  showcasePackages: ShowcasePackage[]; // 案例包记录
  
  // Retrieval Panel State
  searchTerm: string;
  activeTag: string;
  
  // 新增状态
  recentOpenedProjects: string[]; // 近期打开的项目ID列表
  showcaseSelection: string[]; // 案例遴选临时选择
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
  | { type: 'TOGGLE_MAIN_DELIVERY'; payload: string } // Toggle isMainDelivery on a Video
  | { type: 'UPDATE_VIDEO_TAGS'; payload: { videoId: string; tags: string[] } } // Update video tags
  | { type: 'UPDATE_DELIVERY_NOTE'; payload: { projectId: string; note: string } } // Update delivery note
  | { type: 'UPDATE_DELIVERY_TITLE'; payload: { projectId: string; title: string } } // Update delivery title
  | { type: 'UPDATE_DELIVERY_DESCRIPTION'; payload: { projectId: string; description: string } } // Update delivery description
  | { type: 'GENERATE_DELIVERY_LINK'; payload: { projectId: string; fileIds: string[] } } // Generate delivery package link with selected files
  | { type: 'TOGGLE_DELIVERY_PACKAGE'; payload: { packageId: string; isActive: boolean } } // Toggle delivery package active status
  | { type: 'TOGGLE_DELIVERY_FILE_SELECTION'; payload: string } // Toggle file selection in delivery module
  | { type: 'CLEAR_DELIVERY_FILE_SELECTION' } // Clear all selected delivery files
  | { type: 'ADD_CUSTOM_TAG'; payload: string } // Add custom tag to system
  // Showcase actions
  | { type: 'SET_SHOWCASE_VIEW_MODE'; payload: 'files' | 'packages' }
  | { type: 'SET_FILTERED_SHOWCASE_VIDEOS'; payload: string[] }
  | { type: 'ADD_TO_SHOWCASE_BROWSER'; payload: string }
  | { type: 'CLEAR_SHOWCASE_BROWSER' }
  | { type: 'GENERATE_SHOWCASE_PACKAGE'; payload: { title: string; description: string; mode: 'quick_player' | 'pitch_page'; clientName?: string } }
  | { type: 'TOGGLE_SHOWCASE_PACKAGE'; payload: { packageId: string; isActive: boolean } }
  // 新增Actions
  | { type: 'UPDATE_PROJECT_LAST_OPENED'; payload: string } // 更新项目最后打开时间
  | { type: 'SET_RECENT_OPENED_PROJECTS'; payload: string[] } // 设置近期打开项目
  | { type: 'ADD_TAG'; payload: Tag } // 添加标签
  | { type: 'UPDATE_VIDEO_ASPECT_RATIO'; payload: { videoId: string; aspectRatio: AspectRatio } } // 更新视频横竖屏
  | { type: 'TOGGLE_CART_ITEM'; payload: string } // Showcase Cart
  | { type: 'SET_SEARCH'; payload: string }
  | { type: 'SET_TAG'; payload: string }
  | { type: 'TOGGLE_DRAWER'; payload: 'none' | 'transfer' | 'messages' }
  | { type: 'TOGGLE_REVIEW_MODE'; payload: boolean }
  | { type: 'TOGGLE_WORKBENCH'; payload: boolean }
  | { type: 'UPDATE_VIDEO_STATUS'; payload: { videoId: string; status: VideoStatus } }
  | { type: 'SET_BROWSER_VIEW_MODE'; payload: 'grid' | 'list' }
  | { type: 'SET_BROWSER_CARD_SIZE'; payload: 'small' | 'medium' | 'large' }
  | { type: 'SET_DELIVERY_VIEW_MODE'; payload: 'files' | 'packages' }
  | { type: 'ADD_UPLOAD'; payload: UploadItem }
  | { type: 'UPDATE_UPLOAD_PROGRESS'; payload: { id: string; progress: number } }
  | { type: 'COMPLETE_UPLOAD'; payload: string }
  | { type: 'ADD_NOTIFICATION'; payload: Notification }
  | { type: 'CLEAR_NOTIFICATIONS' };
