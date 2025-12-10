# 视频管理系统完整架构规划 (v3 - 最终优化版)

## 一、技术栈选型

### 后端技术栈
- **框架**: NestJS (Node.js + TypeScript)
- **数据库**: PostgreSQL 15+
- **ORM**: TypeORM / Prisma
- **文件存储**: 对象存储 (AWS S3 / 阿里云OSS / 腾讯云COS)
- **冷存储**: AWS Glacier / 阿里云归档存储 (用于冷归档)
- **视频处理**: FFmpeg (用于生成预览图、提取元数据、横竖屏检测)
- **认证**: JWT + Passport
- **文件上传**: Multer + 分片上传支持
- **实时通信**: WebSocket (Socket.io) 用于案例包观看追踪
- **PDF生成**: pdfkit / puppeteer (批注导出)

### 前端技术栈 (现有)
- **框架**: React 18 + TypeScript
- **构建工具**: Vite
- **状态管理**: React Context + useReducer
- **HTTP客户端**: Axios / Fetch API
- **实时通信**: Socket.io-client (案例包观看追踪)

---

## 二、数据库设计 (最终版)

### 2.1 核心表结构

#### 用户表 (users)
```sql
- id: UUID (主键)
- email: VARCHAR(255) (唯一)
- name: VARCHAR(100)
- avatar_url: VARCHAR(500)
- role: ENUM('admin', 'member', 'viewer', 'sales') (新增sales角色)
- created_at: TIMESTAMP
- updated_at: TIMESTAMP
```

#### 项目表 (projects) - 新增字段
```sql
- id: UUID (主键)
- name: VARCHAR(255) (格式: YYMM_Name)
- client: VARCHAR(100)
- lead: VARCHAR(100) (项目负责人)
- post_lead: VARCHAR(100) (后期负责人)
- group: VARCHAR(100) (所属组别)
- status: ENUM('active', 'finalized', 'delivered', 'archived')
- created_date: DATE
- last_activity_at: TIMESTAMP (最后活跃时间, 用于工作台排序)
- last_opened_at: TIMESTAMP (最后打开时间, 用于浏览区默认显示)
- archived_at: TIMESTAMP (归档时间, 用于冷归档判断)
- created_at: TIMESTAMP
- updated_at: TIMESTAMP
- finalized_at: TIMESTAMP (定版时间)
- delivered_at: TIMESTAMP (交付时间)
```

#### 项目成员关联表 (project_members)
```sql
- id: UUID (主键)
- project_id: UUID (外键 -> projects.id)
- user_id: UUID (外键 -> users.id)
- role: ENUM('owner', 'member', 'viewer')
- created_at: TIMESTAMP
```

#### 视频文件表 (videos)
```sql
- id: UUID (主键)
- project_id: UUID (外键 -> projects.id)
- name: VARCHAR(255) (文件名, 包含版本号前缀 v1_, v2_等)
- original_filename: VARCHAR(255) (原始文件名)
- base_name: VARCHAR(255) (去除版本号的基础名称, 用于版本分组)
- version: INTEGER (版本号)
- type: ENUM('video', 'image', 'audio')
- storage_url: VARCHAR(500) (对象存储URL)
- storage_key: VARCHAR(500) (对象存储Key)
- storage_tier: ENUM('standard', 'cold') (存储层级: 标准/冷存储)
- thumbnail_url: VARCHAR(500) (预览图URL)
- size: BIGINT (文件大小, 字节)
- duration: INTEGER (时长, 秒)
- resolution: VARCHAR(20) (如: 1920x1080)
- aspect_ratio: ENUM('landscape', 'portrait') (横屏/竖屏, 用于UI布局)
- status: ENUM('initial', 'annotated', 'approved')
- change_log: TEXT (修改说明)
- is_case_file: BOOLEAN (是否标记为案例文件)
- is_main_delivery: BOOLEAN (是否主交付文件)
- is_reference: BOOLEAN (是否为引用文件, 案例模块使用)
- referenced_video_id: UUID (外键 -> videos.id, 如果is_reference=true)
- uploader_id: UUID (外键 -> users.id)
- upload_time: TIMESTAMP
- created_at: TIMESTAMP
- updated_at: TIMESTAMP
```

#### 交付文件夹结构表 (delivery_folders) - 新增
```sql
- id: UUID (主键)
- delivery_id: UUID (外键 -> deliveries.id)
- folder_type: ENUM('master', 'variants', 'clean_feed', 'docs')
- storage_path: VARCHAR(500) (对象存储路径)
- created_at: TIMESTAMP
```

#### 交付文件表 (delivery_files) - 更新
```sql
- id: UUID (主键)
- delivery_id: UUID (外键 -> deliveries.id)
- folder_id: UUID (外键 -> delivery_folders.id, 可为NULL)
- file_type: ENUM('master', 'variant', 'clean_feed', 'script', 'copyright_music', 'copyright_video', 'copyright_font')
- storage_url: VARCHAR(500)
- storage_key: VARCHAR(500)
- filename: VARCHAR(255)
- size: BIGINT
- uploaded_by: UUID (外键 -> users.id)
- created_at: TIMESTAMP
```

#### 标签表 (tags)
```sql
- id: UUID (主键)
- name: VARCHAR(50) (标签名称, 唯一, 如: 'AI生成', '三维制作')
- category: VARCHAR(50) (标签分类, 可选)
- usage_count: INTEGER (使用次数, 用于排序和展示)
- created_at: TIMESTAMP
- updated_at: TIMESTAMP
```

#### 视频标签关联表 (video_tags)
```sql
- id: UUID (主键)
- video_id: UUID (外键 -> videos.id)
- tag_id: UUID (外键 -> tags.id)
- created_at: TIMESTAMP
- UNIQUE(video_id, tag_id)
```

#### 批注表 (annotations)
```sql
- id: UUID (主键)
- video_id: UUID (外键 -> videos.id)
- user_id: UUID (外键 -> users.id, 批注者, 可为NULL用于匿名批注)
- timecode: VARCHAR(20) (时间码, 如: 00:01:30)
- content: TEXT (批注内容)
- screenshot_url: VARCHAR(500) (截图URL)
- is_completed: BOOLEAN (是否完成批注)
- completed_at: TIMESTAMP (完成批注时间)
- created_at: TIMESTAMP
- updated_at: TIMESTAMP
```

#### 分享链接表 (share_links)
```sql
- id: UUID (主键)
- video_id: UUID (外键 -> videos.id, 可为NULL)
- project_id: UUID (外键 -> projects.id, 可为NULL)
- delivery_package_id: UUID (外键 -> delivery_packages.id, 可为NULL)
- showcase_package_id: UUID (外键 -> showcase_packages.id, 可为NULL)
- type: ENUM('video_review', 'video_share', 'delivery_package', 'showcase_package')
- token: VARCHAR(100) (唯一, 用于访问)
- password_hash: VARCHAR(255) (可选, 密码保护)
- allow_download: BOOLEAN
- expires_at: TIMESTAMP (过期时间)
- download_count: INTEGER (下载次数)
- is_active: BOOLEAN
- justification: TEXT (分享历史版本的说明)
- created_by: UUID (外键 -> users.id)
- created_at: TIMESTAMP
- updated_at: TIMESTAMP
```

#### 交付数据表 (deliveries)
```sql
- id: UUID (主键)
- project_id: UUID (外键 -> projects.id, 唯一)
- has_clean_feed: BOOLEAN
- has_multi_resolution: BOOLEAN
- has_script: BOOLEAN
- has_copyright_files: BOOLEAN
- has_tech_review: BOOLEAN (技术审查通过)
- has_copyright_check: BOOLEAN (版权风险确认)
- has_metadata: BOOLEAN (元数据完整)
- delivery_note: TEXT (交付说明)
- completed_at: TIMESTAMP (完成交付时间)
- created_at: TIMESTAMP
- updated_at: TIMESTAMP
```

#### 交付包表 (delivery_packages)
```sql
- id: UUID (主键)
- delivery_id: UUID (外键 -> deliveries.id)
- title: VARCHAR(255) (交付标题)
- description: TEXT (交付说明)
- share_link_id: UUID (外键 -> share_links.id)
- created_by: UUID (外键 -> users.id)
- created_at: TIMESTAMP
- updated_at: TIMESTAMP
```

#### 交付包文件关联表 (delivery_package_files)
```sql
- id: UUID (主键)
- package_id: UUID (外键 -> delivery_packages.id)
- video_id: UUID (外键 -> videos.id, 可为NULL)
- file_id: UUID (外键 -> delivery_files.id, 可为NULL)
- created_at: TIMESTAMP
```

#### 案例包表 (showcase_packages) - 新增字段
```sql
- id: UUID (主键)
- name: VARCHAR(255)
- description: TEXT
- mode: ENUM('quick_player', 'pitch_page') (快速分享/提案微站)
- client_name: VARCHAR(100) (客户名称, pitch_page模式使用)
- share_link_id: UUID (外键 -> share_links.id)
- created_by: UUID (外键 -> users.id)
- sales_user_id: UUID (外键 -> users.id, 销售负责人, 用于接收观看通知)
- created_at: TIMESTAMP
- updated_at: TIMESTAMP
```

#### 案例包视频关联表 (showcase_package_videos)
```sql
- id: UUID (主键)
- package_id: UUID (外键 -> showcase_packages.id)
- video_id: UUID (外键 -> videos.id)
- order: INTEGER (排序顺序)
- description: TEXT (视频说明)
- group_name: VARCHAR(100) (分组名称, 可选)
- created_at: TIMESTAMP
```

#### 案例包观看追踪表 (showcase_view_tracking) - 新增
```sql
- id: UUID (主键)
- package_id: UUID (外键 -> showcase_packages.id)
- video_id: UUID (外键 -> videos.id)
- viewer_ip: VARCHAR(45) (观看者IP)
- viewer_user_agent: VARCHAR(500) (用户代理)
- progress: INTEGER (观看进度, 0-100)
- duration_watched: INTEGER (观看时长, 秒)
- last_updated_at: TIMESTAMP (最后更新时间)
- created_at: TIMESTAMP
```

#### 通知表 (notifications)
```sql
- id: UUID (主键)
- user_id: UUID (外键 -> users.id)
- type: ENUM('info', 'success', 'alert', 'view_tracking') (新增view_tracking类型)
- title: VARCHAR(255)
- message: TEXT
- related_type: VARCHAR(50) (关联类型: 'video', 'project', 'share_link', 'showcase_package')
- related_id: UUID (关联ID)
- is_read: BOOLEAN
- created_at: TIMESTAMP
```

#### 上传任务表 (upload_tasks)
```sql
- id: UUID (主键)
- user_id: UUID (外键 -> users.id)
- project_id: UUID (外键 -> projects.id)
- filename: VARCHAR(255)
- total_size: BIGINT
- uploaded_size: BIGINT
- status: ENUM('pending', 'uploading', 'processing', 'completed', 'failed')
- storage_key: VARCHAR(500)
- error_message: TEXT
- created_at: TIMESTAMP
- updated_at: TIMESTAMP
```

#### 归档任务表 (archiving_tasks) - 新增
```sql
- id: UUID (主键)
- project_id: UUID (外键 -> projects.id)
- status: ENUM('pending', 'processing', 'completed', 'failed')
- files_count: INTEGER (文件数量)
- total_size: BIGINT (总大小)
- cold_storage_path: VARCHAR(500) (冷存储路径)
- started_at: TIMESTAMP
- completed_at: TIMESTAMP
- created_at: TIMESTAMP
```

### 2.2 索引设计
- `projects`: 索引 `status`, `created_date`, `group`, `last_activity_at`, `last_opened_at`
- `videos`: 索引 `project_id`, `base_name`, `version`, `is_case_file`, `is_main_delivery`, `is_reference`, `referenced_video_id`, `aspect_ratio`
- `video_tags`: 索引 `video_id`, `tag_id`
- `tags`: 索引 `name` (唯一), `usage_count`
- `share_links`: 索引 `token`, `is_active`, `expires_at`
- `annotations`: 索引 `video_id`, `user_id`, `is_completed`
- `notifications`: 索引 `user_id`, `is_read`, `created_at`, `type`
- `delivery_packages`: 索引 `delivery_id`, `created_at`
- `showcase_view_tracking`: 索引 `package_id`, `video_id`, `last_updated_at`
- `archiving_tasks`: 索引 `project_id`, `status`

---

## 三、后端架构设计

### 3.1 目录结构
```
backend/
├── src/
│   ├── modules/
│   │   ├── auth/          # 认证模块
│   │   ├── users/         # 用户管理
│   │   ├── projects/      # 项目管理
│   │   ├── videos/        # 视频管理
│   │   ├── uploads/       # 文件上传
│   │   ├── annotations/   # 批注管理
│   │   ├── shares/        # 分享链接
│   │   ├── deliveries/    # 交付管理
│   │   ├── showcase/      # 案例包管理
│   │   ├── tags/          # 标签管理
│   │   ├── dashboard/     # 工作台模块
│   │   ├── archiving/     # 冷归档模块 (新增)
│   │   ├── tracking/      # 观看追踪模块 (新增)
│   │   └── notifications/ # 通知管理
│   ├── common/
│   │   ├── guards/        # 守卫 (JWT, 权限)
│   │   ├── interceptors/ # 拦截器
│   │   ├── filters/       # 异常过滤器
│   │   └── decorators/   # 装饰器
│   ├── config/           # 配置文件
│   ├── database/         # 数据库配置
│   ├── storage/          # 存储服务 (标准存储/冷存储)
│   └── utils/           # 工具函数
├── uploads/             # 临时上传目录
└── package.json
```

### 3.2 核心服务模块

#### 存储服务 (StorageService) - 更新
- 标准存储操作 (S3/OSS)
- 冷存储操作 (Glacier/归档存储)
- 文件迁移 (标准 -> 冷存储)
- 文件夹结构创建

#### 冷归档服务 (ArchivingService) - 新增
- 定时任务: 检查项目交付时间
- 自动归档: 项目结束3个月后触发
- 文件迁移: 无损母版和变体文件移至冷存储
- 保留策略: 仅保留H.264在线预览

#### 观看追踪服务 (ViewTrackingService) - 新增
- WebSocket连接管理
- 实时进度更新
- 观看时长统计
- 通知推送 (销售收到观看通知)

#### 交付文件夹服务 (DeliveryFolderService) - 新增
- 自动创建标准文件夹结构
- 文件分类和归档
- 文件夹路径管理

---

## 四、API接口设计 (最终版)

### 4.1 认证相关
```
POST   /api/auth/login          # 登录
POST   /api/auth/logout         # 登出
POST   /api/auth/refresh        # 刷新token
GET    /api/auth/me             # 获取当前用户信息
```

### 4.2 项目管理
```
GET    /api/projects            # 获取项目列表 (支持筛选: status, group, month)
POST   /api/projects            # 创建项目
GET    /api/projects/:id        # 获取项目详情
PATCH  /api/projects/:id        # 更新项目信息
POST   /api/projects/:id/finalize  # 项目定版
POST   /api/projects/:id/unlock    # 解锁项目 (需填写说明)
GET    /api/projects/:id/members   # 获取项目成员
POST   /api/projects/:id/members   # 添加项目成员
DELETE /api/projects/:id/members/:userId  # 移除成员
PATCH  /api/projects/:id/last-opened  # 更新最后打开时间 (新增)
```

### 4.3 视频管理
```
GET    /api/videos              # 获取视频列表 (支持筛选: projectId, isCaseFile, tags)
POST   /api/videos              # 创建视频记录 (上传后)
GET    /api/videos/:id          # 获取视频详情
PATCH  /api/videos/:id          # 更新视频信息
DELETE /api/videos/:id          # 删除视频
GET    /api/videos/:id/versions # 获取视频的所有版本
PATCH  /api/videos/:id/tags     # 更新视频标签 (传入tag_id数组)
PATCH  /api/videos/:id/case-file # 切换案例文件标记
PATCH  /api/videos/:id/main-delivery # 切换主交付文件标记
POST   /api/videos/:id/create-reference # 创建引用视频 (案例模块, 新增)
```

### 4.4 标签管理
```
GET    /api/tags                # 获取所有标签列表 (支持排序: usage_count)
POST   /api/tags                # 创建新标签
GET    /api/tags/popular        # 获取热门标签 (按使用次数)
GET    /api/tags/suggestions    # 标签自动补全建议
GET    /api/tags/:id            # 获取标签详情
PATCH  /api/tags/:id            # 更新标签
DELETE /api/tags/:id            # 删除标签 (需检查使用情况)
```

### 4.5 文件上传
```
POST   /api/upload/init          # 初始化分片上传
POST   /api/upload/chunk         # 上传分片
POST   /api/upload/complete      # 完成上传
GET    /api/upload/tasks         # 获取上传任务列表
GET    /api/upload/tasks/:id     # 获取上传任务详情
```

### 4.6 批注管理
```
GET    /api/annotations          # 获取批注列表 (支持筛选: videoId)
POST   /api/annotations          # 创建批注
GET    /api/annotations/:id      # 获取批注详情
PATCH  /api/annotations/:id      # 更新批注
DELETE /api/annotations/:id      # 删除批注
POST   /api/annotations/:id/complete # 完成批注 (更新is_completed)
GET    /api/annotations/export/:videoId # 导出批注PDF
```

### 4.7 分享链接
```
GET    /api/shares               # 获取分享链接列表
POST   /api/shares               # 创建分享链接
GET    /api/shares/:token       # 通过token获取分享内容 (公开接口)
PATCH  /api/shares/:id          # 更新分享设置
DELETE /api/shares/:id          # 删除分享链接
POST   /api/shares/:id/toggle   # 切换分享链接状态
```

### 4.8 交付管理
```
GET    /api/deliveries           # 获取交付列表
GET    /api/deliveries/:projectId # 获取项目交付信息
PATCH  /api/deliveries/:projectId # 更新交付信息
POST   /api/deliveries/:projectId/complete # 完成交付 (锁定状态, 自动创建文件夹结构)
POST   /api/deliveries/:projectId/packages # 创建交付包
GET    /api/deliveries/:projectId/packages # 获取交付包列表
GET    /api/deliveries/packages/:id # 获取交付包详情
PATCH  /api/deliveries/packages/:id # 更新交付包
DELETE /api/deliveries/packages/:id # 删除交付包
POST   /api/deliveries/packages/:id/generate-link # 生成交付包链接
GET    /api/deliveries/packages/:id/statistics # 获取交付包统计
GET    /api/deliveries/:projectId/folders # 获取交付文件夹结构 (新增)
```

### 4.9 案例包管理
```
GET    /api/showcase/packages    # 获取案例包列表
POST   /api/showcase/packages    # 创建案例包 (支持quick_player/pitch_page模式)
GET    /api/showcase/packages/:id # 获取案例包详情
PATCH  /api/showcase/packages/:id # 更新案例包 (支持分组、排序)
DELETE /api/showcase/packages/:id # 删除案例包
POST   /api/showcase/packages/:id/generate-link # 生成案例包链接
GET    /api/showcase/packages/:id/statistics # 获取案例包统计
GET    /api/showcase/packages/:id/tracking # 获取观看追踪数据 (新增)
```

### 4.10 观看追踪 - 新增
```
GET    /api/tracking/package/:packageId # 获取案例包观看统计
GET    /api/tracking/video/:videoId # 获取视频观看统计
POST   /api/tracking/update # 更新观看进度 (WebSocket或HTTP)
```

### 4.11 工作台模块
```
GET    /api/dashboard/active-projects # 获取近期活跃项目 (5-10个)
GET    /api/dashboard/quick-actions   # 获取快速操作列表
GET    /api/dashboard/recent-opened   # 获取近期打开的项目 (用于浏览区默认显示, 新增)
```

### 4.15 全局搜索 - 新增
```
GET    /api/search/global            # 全局搜索 (项目、视频、案例包等)
GET    /api/search/suggestions       # 搜索建议/自动补全
```

### 4.12 冷归档管理 - 新增
```
GET    /api/archiving/tasks      # 获取归档任务列表
GET    /api/archiving/tasks/:id  # 获取归档任务详情
POST   /api/archiving/projects/:id/archive # 手动触发归档
GET    /api/archiving/projects/:id/status # 获取项目归档状态
```

### 4.13 通知管理
```
GET    /api/notifications        # 获取通知列表
PATCH  /api/notifications/:id/read # 标记已读
DELETE /api/notifications/:id   # 删除通知
POST   /api/notifications/clear  # 清空通知
```

### 4.14 WebSocket事件 - 新增
```
连接: ws://api.example.com/socket
事件:
- 'view_progress' - 客户端发送观看进度
- 'view_notification' - 服务端推送观看通知给销售
- 'upload_progress' - 上传进度更新
- 'annotation_completed' - 批注完成通知
```

---

## 五、前端集成方案 (最终版)

### 5.1 组件结构更新

#### 新增组件
- `Dashboard.tsx` - 工作台模块 (不显示检索面板)
- `ReviewPlayer.tsx` - 审阅播放器 (支持竖屏布局)
- `PreviewPlayer.tsx` - 预览播放器 (支持隐藏操作台, 标签编辑)
- `TransferQueue.tsx` - 传输队列抽屉 (420px宽度)
- `NotificationCenter.tsx` - 消息中心抽屉 (420px宽度)
- `ShowcaseTracking.tsx` - 案例包观看追踪视图

#### 更新组件
- `Header.tsx` - 中间添加全局搜索入口 (新增)
- `RetrievalPanel.tsx` - 支持标签区域 (案例模块), 高度可调分区
- `Workbench.tsx` - 交付模块两个按钮, 案例模块分组功能
- `MainBrowser.tsx` - 默认显示近期打开项目, 支持清空按钮, 列表视图支持展开历史版本
- `DeliveryPackageView.tsx` - 交付包统计视图
- `VideoCard.tsx` - 列表视图添加"展开历史版本"按钮 (新增)

### 5.2 API客户端封装
在 `src/api/` 目录下:
- `client.ts` - Axios实例配置
- `projects.ts` - 项目相关API
- `videos.ts` - 视频相关API (新增createReference方法)
- `tags.ts` - 标签相关API
- `uploads.ts` - 上传相关API
- `shares.ts` - 分享相关API
- `deliveries.ts` - 交付相关API (新增folders相关方法)
- `showcase.ts` - 案例包相关API (新增tracking相关方法)
- `dashboard.ts` - 工作台相关API (新增recentOpened方法)
- `archiving.ts` - 冷归档相关API (新增)
- `tracking.ts` - 观看追踪相关API (新增)
- `notifications.ts` - 通知相关API
- `search.ts` - 全局搜索相关API (新增)
- `websocket.ts` - WebSocket客户端 (新增)

### 5.3 状态管理更新

#### 新增状态
```typescript
// types.ts 新增
interface AppState {
  // ... 现有状态
  recentOpenedProjects: string[]; // 近期打开的项目ID列表
  showcaseViewMode: 'selection' | 'packages'; // 案例模块浏览区视图
  deliveryViewMode: 'files' | 'packages'; // 交付模块浏览区视图
  selectedDeliveryFiles: string[]; // 选中的交付文件 (用于创建交付包)
  showcaseSelection: string[]; // 案例遴选临时选择
  expandedVideoSeries: string[]; // 列表视图中展开的视频系列ID (新增)
  globalSearchQuery: string; // 全局搜索关键词 (新增)
}
```

### 5.4 审阅播放器实现
- 横屏布局: 左侧视频+播放器, 下方批注输入, 右侧意见列表
- 竖屏布局: 左侧视频, 中间批注输入, 右侧意见列表
- 返回按钮: 覆盖模式时显示
- 批注完成: 触发通知

### 5.5 预览播放器实现
- 全屏模式: 隐藏操作台
- 横屏: 播放器下方标签编辑区域
- 竖屏: 播放器右侧标签编辑区域
- 标签编辑: 显示既有标签, 支持添加新标签

### 5.6 交付模块实现
- 完成交付: 自动创建文件夹结构 (Master/Variants/Clean Feed/Docs)
- 两个按钮: "完成交付" 和 "创建链接"
- 文件选择: 浏览区支持单选/多选
- 交付包视图: 切换按钮查看所有交付包

### 5.7 案例模块实现
- 引用机制: 创建案例文件时使用引用, 不复制文件
- 标签筛选: 点击标签后一键添加到浏览区
- 搜索筛选: 搜索结果一键添加到浏览区
- 清空按钮: 浏览区清空临时选择
- 案例包模式: Quick Player / Pitch Page (需要客户名称)
- 观看追踪: WebSocket实时更新, 通知销售

### 5.8 工作台实现
- 不显示检索面板
- 显示5-10个活跃项目卡片
- 快速操作: 上传视频、查看批注、确认定版、新建项目、打包案例
- 快速上传视频: 点击后弹出项目选择器, 选择项目后唤起审阅模块的上传弹窗, 执行与审阅模块完全相同的上传流程 (包括文件名检查、版本号分配、修改说明等)

### 5.9 WebSocket集成
```typescript
// websocket.ts
- 连接管理
- 观看进度发送 (案例包)
- 接收观看通知 (销售)
- 上传进度推送
- 批注完成通知
```

---

## 六、关键功能实现要点 (最终版)

### 6.1 交付文件夹结构自动创建
- 完成交付时自动创建4个标准文件夹:
  - Master (主文件): 高码率网络版、无损母版
  - Variants (变体): 4k版、竖屏版
  - Clean Feed (净版): 不带字幕的版本
  - Docs (文档): 视频文稿、各类授权文件
- 文件按类型自动分类到对应文件夹
- 文件夹路径存储在delivery_folders表

### 6.2 冷归档系统
- 定时任务: 每天检查项目交付时间
- 归档条件: delivered_at + 3个月
- 归档内容: 无损母版和变体文件
- 保留内容: H.264在线预览
- 归档记录: 存储在archiving_tasks表

### 6.3 案例文件引用机制
- 不复制文件, 只创建引用记录
- is_reference=true, referenced_video_id指向原文件
- 节省存储空间
- 引用文件共享原文件的存储URL

### 6.4 案例包观看追踪
- WebSocket实时连接
- 客户端定期发送观看进度 (每5秒)
- 服务端记录到showcase_view_tracking表
- 销售收到实时通知: "李总正在观看《奔驰TVC》, 进度 80%"
- 通知类型: view_tracking

### 6.5 案例包两种模式
- **Quick Player**: 纯净播放器, 无多余按钮, 适合微信快速分享
- **Pitch Page**: H5页面, 包含Logo、欢迎语("To: 李总")、视频列表、项目简介、联系方式, 适合正式商务邮件
- Pitch Page需要client_name字段

### 6.6 浏览区默认显示
- 基于projects.last_opened_at字段
- 默认显示最近打开的5-10个项目
- 点击项目时更新last_opened_at

### 6.7 视频横竖屏检测
- 上传时使用FFmpeg检测aspect_ratio
- 存储到videos.aspect_ratio字段
- UI根据aspect_ratio调整布局 (审阅播放器、预览播放器)

### 6.8 列表视图历史版本展开
- 列表视图默认只显示最新版本
- 每行视频卡片添加"展开历史版本"按钮
- 点击后展开显示该系列的所有历史版本 (按版本号倒序)
- 使用状态管理expandedVideoSeries记录展开状态

### 6.9 工作台快速上传
- 点击快速上传按钮
- 弹出项目选择器 (显示所有项目列表)
- 选择项目后, 唤起与审阅模块相同的上传弹窗
- 执行相同的上传流程: 文件名检查、版本号分配、修改说明等

### 6.10 全局搜索
- 顶部banner中间设置全局搜索入口
- 支持搜索: 项目名称、视频名称、案例包名称
- 实时搜索建议/自动补全
- 搜索结果高亮显示关键词

---

## 七、定时任务设计

### 7.1 冷归档任务
```typescript
// 每天凌晨2点执行
@Cron('0 2 * * *')
async checkAndArchiveProjects() {
  // 查找交付时间超过3个月的项目
  // 创建归档任务
  // 迁移文件到冷存储
  // 更新videos.storage_tier
}
```

### 7.2 项目活跃度更新
```typescript
// 每次批注/上传操作后触发
async updateProjectActivity(projectId: string) {
  // 更新projects.last_activity_at
}
```

---

## 八、WebSocket事件设计

### 8.1 客户端 -> 服务端
```typescript
// 观看进度更新
socket.emit('view_progress', {
  packageId: string,
  videoId: string,
  progress: number, // 0-100
  durationWatched: number // 秒
});
```

### 8.2 服务端 -> 客户端
```typescript
// 观看通知 (发送给销售)
socket.to(salesUserId).emit('view_notification', {
  packageId: string,
  packageName: string,
  videoName: string,
  viewerInfo: string, // "李总"
  progress: number
});
```

---

## 九、开发优先级 (最终版)

### Phase 1: 基础架构
1. 数据库设计和迁移 (包含所有新表)
2. 认证系统
3. 基础API框架
4. 存储服务 (标准存储)

### Phase 2: 核心功能
1. 项目管理API
2. 视频上传和管理
3. 文件存储集成
4. 标签系统
5. 浏览区默认显示逻辑

### Phase 3: 业务功能
1. 批注系统
2. 分享链接
3. 交付流程 (包含文件夹结构)
4. 审阅播放器 (支持竖屏)
5. 预览播放器 (支持标签编辑)

### Phase 4: 高级功能
1. 案例包管理 (引用机制, 两种模式)
2. 工作台模块
3. 观看追踪系统 (WebSocket)
4. 通知系统
5. 冷归档系统

### Phase 5: 前端集成
1. API客户端封装
2. 状态管理改造
3. 交付模块UI更新
4. 案例模块UI更新
5. 工作台模块开发
6. WebSocket集成
7. 传输队列和消息中心抽屉

---

## 十、数据迁移注意事项

### 10.1 标签数据迁移
- 将现有video_tags.tag字符串迁移到tags表
- 建立关联关系
- 统计使用次数

### 10.2 项目活跃度初始化
- 基于最近上传时间和批注时间初始化last_activity_at
- 初始化last_opened_at (基于创建时间)

### 10.3 视频横竖屏检测
- 对现有视频使用FFmpeg批量检测
- 更新aspect_ratio字段

### 10.4 案例文件引用迁移
- 如果已有案例文件, 需要创建引用记录
- 设置is_reference=true

---

## 十一、技术难点和解决方案

1. **大文件上传**: 分片上传 + 断点续传
2. **视频处理**: FFmpeg异步处理队列
3. **并发控制**: 数据库事务 + 乐观锁
4. **性能优化**: 数据库索引 + 缓存策略
5. **存储成本**: 视频压缩 + 生命周期管理 + 冷归档
6. **标签系统**: 标签去重和统计优化
7. **活跃度计算**: 实时更新策略, 避免频繁写库
8. **WebSocket连接管理**: 连接池、心跳检测、断线重连
9. **冷存储迁移**: 异步任务队列, 大文件分块传输
10. **视频横竖屏检测**: FFmpeg元数据提取, 批量处理优化

---

## 十二、UI/UX细节实现

### 12.1 顶部Banner
- 左侧: Logo、名称
- 中间: 全局搜索入口 (新增)
- 右侧: 传输状态按钮、通知按钮
- 长期显示, 不被任何窗口遮挡和覆盖
- z-index最高优先级

### 12.2 检索面板
- 分区高度可拖拽调整 (20%-80%范围)
- 标签区域固定128px高度 (案例模块)
- 搜索关键词高亮显示
- 组与项目间距区分 (组间距 > 项目间距)

### 12.3 操作台
- 圆角矩形, 距离右侧15px
- 宽度360px固定
- 底部按钮区域固定
- 交付模块: 两个按钮 ("完成交付" 和 "创建链接")

### 12.4 浏览区
- 默认显示近期打开项目 (5-10个)
- 清空按钮 (案例模块)
- 视图切换: 网格/列表
- 尺寸调整: 三档 (small/medium/large)
- 列表视图: 15行(小) / 5行(大), 只显示最新版本, 每行有"展开历史版本"按钮
- 网格视图: 10行(小) / 6行(大)
- 列表视图展开: 点击按钮后展开显示该系列的所有历史版本 (内嵌显示, 不跳转)

### 12.5 播放器
- 审阅播放器: 覆盖模式, 返回按钮, 竖屏时批注框在视频和意见框中间
- 预览播放器: 全屏模式, 标签编辑区域 (横屏下方/竖屏右侧)
- 竖屏布局自适应

### 12.6 抽屉组件
- 传输队列: 420px宽度, 覆盖操作台, 背景模糊
- 消息中心: 420px宽度, 覆盖操作台, 背景模糊

### 12.7 列表视图历史版本展开
- 视频卡片右侧添加"展开历史版本"按钮 (图标: ChevronDown/History)
- 点击后展开: 在该视频下方内嵌显示该系列的所有历史版本
- 历史版本按版本号倒序排列 (最新在上)
- 再次点击收起
- 展开状态保存在expandedVideoSeries状态中

---

## 十三、安全考虑

1. **认证授权**: JWT token, 角色权限控制 (新增sales角色)
2. **文件上传**: 文件类型验证, 大小限制, 病毒扫描
3. **分享链接**: Token加密, 密码保护, 过期机制
4. **数据加密**: 敏感数据加密存储
5. **API限流**: 防止恶意请求
6. **CORS配置**: 限制跨域访问
7. **WebSocket安全**: Token验证, 连接限制
8. **冷存储访问**: 权限控制, 访问日志

---

## 十四、交付文件夹结构详细说明

### 14.1 文件夹类型
1. **Master (主文件)**
   - 高码率网络版 (H.264, 适合在线观看)
   - 无损母版 (可选, 用于后续制作)

2. **Variants (变体/不同规格)**
   - 4K版本
   - 竖屏版本
   - 其他规格变体

3. **Clean Feed (净版)**
   - 不带字幕的版本
   - 用于国际化或二次剪辑

4. **Docs (文档)**
   - 视频文稿
   - 音乐授权文件
   - 视频素材授权文件
   - 字体授权文件

### 14.2 文件分类规则
- 主交付视频 → Master文件夹
- 变体视频 → Variants文件夹
- 净版视频 → Clean Feed文件夹
- 所有文档 → Docs文件夹

---

## 十五、案例包模式详细说明

### 15.1 Quick Player (快速分享)
- **场景**: 微信里发给客户看一眼
- **形态**: 纯净播放器页面, 无多余按钮, 只有视频流
- **特点**: 加载快, 交互简单

### 15.2 Pitch Page (提案微站)
- **场景**: 正式商务邮件, 提案展示
- **形态**: 响应式H5页面, 自动适配不同设备 (桌面/平板/手机), 包含:
  - 页眉: 公司Logo
  - 欢迎语: "To: 李总" (个性化, 基于client_name)
  - 视频列表: 3-5个视频 (响应式布局)
  - 项目简介文本
  - 联系方式
- **特点**: 专业、正式、信息完整、响应式设计
- **技术**: 使用CSS媒体查询和Flexbox/Grid实现响应式布局

---

## 十六、观看追踪详细说明

### 16.1 追踪数据
- 观看进度 (0-100%)
- 观看时长 (秒)
- 观看者IP
- 用户代理
- 最后更新时间

### 16.2 通知机制
- 实时推送: 通过WebSocket
- 通知内容: "李总正在观看《奔驰TVC》, 进度 80%"
- 接收者: 销售负责人 (sales_user_id)
- 通知类型: view_tracking

### 16.3 数据统计
- 案例包总观看次数
- 视频观看完成率
- 观看时长分布
- 观看者地域分布 (基于IP)

---

## 十七、最新调整说明 (v3.1)

### 17.1 列表视图历史版本展开
- 列表视图默认只显示最新版本
- 每行视频卡片添加"展开历史版本"按钮
- 点击后在该视频下方内嵌展开显示该系列的所有历史版本
- 历史版本按版本号倒序排列
- 展开状态由expandedVideoSeries状态管理

### 17.2 微站响应式布局
- Pitch Page模式采用响应式设计
- 使用CSS媒体查询和Flexbox/Grid
- 自动适配桌面/平板/手机等不同设备
- 需要输入client_name用于页面个性化显示

### 17.3 工作台快速上传
- 点击快速上传按钮
- 弹出项目选择器
- 选择项目后唤起审阅模块的上传弹窗
- 执行与审阅模块完全相同的上传流程

### 17.4 全局搜索
- 顶部banner中间设置全局搜索入口
- 支持搜索项目、视频、案例包等
- 实时搜索建议/自动补全
- 搜索结果高亮显示关键词

---

## 十八、总结

本规划涵盖了所有功能细节, 包括:
- 完整的数据库设计 (包含所有新表和字段)
- 详细的API接口设计
- 前端组件和状态管理方案
- UI/UX细节实现
- 关键技术难点和解决方案
- 开发优先级和阶段划分

所有新增功能都已考虑:
- 交付文件夹结构自动创建
- 冷归档系统
- 案例文件引用机制
- 案例包观看追踪
- 两种案例包模式 (Quick Player / 响应式Pitch Page)
- 浏览区默认显示
- 视频横竖屏检测
- 审阅播放器竖屏布局
- 预览播放器标签编辑
- 工作台模块 (含快速上传)
- 传输队列和消息中心抽屉
- 列表视图历史版本展开
- 全局搜索功能

规划已就绪, 可以开始实施开发。

