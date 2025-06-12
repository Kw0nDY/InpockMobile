import { 
  users, links, deals, chats, messages, activities, userSettings, subscriptions, passwordResetTokens, mediaUploads, linkVisits,
  type User, type InsertUser,
  type Link, type InsertLink,
  type Deal, type InsertDeal,
  type Chat, type InsertChat,
  type Message, type InsertMessage,
  type Activity, type InsertActivity,
  type UserSettings, type InsertUserSettings,
  type Subscription, type InsertSubscription,
  type PasswordResetToken, type InsertPasswordResetToken,
  type MediaUpload, type InsertMediaUpload,
  type LinkVisit, type InsertLinkVisit
} from "@shared/schema";

export interface IStorage {
  // Users
  getUser(id: number): Promise<User | undefined>;
  getUserByEmail(email: string): Promise<User | undefined>;
  getUserByUsername(username: string): Promise<User | undefined>;
  getUserByCustomUrl(customUrl: string): Promise<User | undefined>;
  getUserByPhone(phone: string): Promise<User | undefined>;
  getAllUsers(): Promise<User[]>;
  createUser(user: InsertUser): Promise<User>;
  updateUser(id: number, updates: Partial<User>): Promise<User | undefined>;

  // Links
  getLinks(userId: number): Promise<Link[]>;
  getLink(id: number): Promise<Link | undefined>;
  getLinkByShortCode(shortCode: string): Promise<Link | undefined>;
  createLink(link: InsertLink): Promise<Link>;
  updateLink(id: number, updates: Partial<Link>): Promise<Link | undefined>;
  deleteLink(id: number): Promise<boolean>;
  incrementLinkClicks(id: number): Promise<void>;
  
  // Link Visits
  recordLinkVisit(visit: InsertLinkVisit): Promise<LinkVisit>;
  getLinkVisits(linkId: number): Promise<LinkVisit[]>;
  getLinkVisitStats(linkId: number): Promise<{
    totalVisits: number;
    dailyVisits: number;
    monthlyVisits: number;
    ownerVisits: number;
    externalVisits: number;
  }>;
  getUserLinkStats(userId: number): Promise<{
    totalVisits: number;
    dailyVisits: number;
    monthlyVisits: number;
    ownerVisits: number;
    externalVisits: number;
  }>;

  // Deals
  getDeals(): Promise<Deal[]>;
  getDealsByCategory(category: string): Promise<Deal[]>;
  getUserDeals(userId: number): Promise<Deal[]>;
  getDeal(id: number): Promise<Deal | undefined>;
  createDeal(deal: InsertDeal): Promise<Deal>;
  updateDeal(id: number, updates: Partial<Deal>): Promise<Deal | undefined>;
  deleteDeal(id: number): Promise<boolean>;

  // Chats
  getUserChats(userId: number): Promise<Chat[]>;
  getChat(id: number): Promise<Chat | undefined>;
  createChat(chat: InsertChat): Promise<Chat>;
  updateChat(id: number, updates: Partial<Chat>): Promise<Chat | undefined>;

  // Messages
  getChatMessages(chatId: number): Promise<Message[]>;
  createMessage(message: InsertMessage): Promise<Message>;

  // Activities
  getUserActivities(userId: number): Promise<Activity[]>;
  createActivity(activity: InsertActivity): Promise<Activity>;

  // User Settings
  getUserSettings(userId: number): Promise<UserSettings | undefined>;
  createUserSettings(settings: InsertUserSettings): Promise<UserSettings>;
  updateUserSettings(userId: number, updates: Partial<UserSettings>): Promise<UserSettings | undefined>;

  // Subscriptions
  getUserSubscription(userId: number): Promise<Subscription | undefined>;
  createSubscription(subscription: InsertSubscription): Promise<Subscription>;
  updateSubscription(userId: number, updates: Partial<Subscription>): Promise<Subscription | undefined>;

  // Password Reset Tokens
  createPasswordResetToken(token: InsertPasswordResetToken): Promise<PasswordResetToken>;
  getPasswordResetToken(token: string): Promise<PasswordResetToken | undefined>;
  markTokenAsUsed(token: string): Promise<boolean>;
  deleteExpiredTokens(): Promise<void>;

  // Media Uploads
  getUserMediaUploads(userId: number): Promise<MediaUpload[]>;
  getMediaUpload(id: number): Promise<MediaUpload | undefined>;
  createMediaUpload(upload: InsertMediaUpload): Promise<MediaUpload>;
  deleteMediaUpload(id: number): Promise<boolean>;
  getMediaByUserAndType(userId: number, mediaType: string): Promise<MediaUpload[]>;
  createMedia(upload: InsertMediaUpload): Promise<MediaUpload>;
  updateMedia(id: number, updates: Partial<MediaUpload>): Promise<MediaUpload | undefined>;
  incrementUserVisitCount(userId: number): Promise<void>;
}

export class MemStorage implements IStorage {
  private users: Map<number, User> = new Map();
  private links: Map<number, Link> = new Map();
  private deals: Map<number, Deal> = new Map();
  private chats: Map<number, Chat> = new Map();
  private messages: Map<number, Message> = new Map();
  private activities: Map<number, Activity> = new Map();
  private userSettings: Map<number, UserSettings> = new Map();
  private subscriptions: Map<number, Subscription> = new Map();
  private passwordResetTokens: Map<string, PasswordResetToken> = new Map();
  private mediaUploads: Map<number, MediaUpload> = new Map();
  private linkVisits: Map<number, LinkVisit> = new Map();
  
  private currentUserId = 1;
  private currentLinkId = 1;
  private currentDealId = 1;
  private currentChatId = 1;
  private currentMessageId = 1;
  private currentActivityId = 1;
  private currentUserSettingsId = 1;
  private currentSubscriptionId = 1;
  private currentMediaUploadId = 1;
  private currentLinkVisitId = 1;

  constructor() {
    // Initialize with some demo data
    this.initializeDemoData();
  }

  private initializeDemoData() {
    // Create demo user
    const demoUser: User = {
      id: 1,
      username: "demo_user_old",
      email: "demo@amusefit.com",
      password: "password123",
      name: "김철수",
      phone: "010-1234-5678",
      company: "AmuseFit Korea",
      role: "user",
      avatar: null,
      profileImageUrl: null,
      introVideoUrl: null,
      bio: null,
      customUrl: null,
      contentType: "links",
      visitCount: 0,
      provider: null,
      providerId: null,
      createdAt: new Date(),
    };
    this.users.set(1, demoUser);
    this.currentUserId = 2;

    // Create demo user settings
    const demoSettings: UserSettings = {
      id: 1,
      userId: 1,
      notifications: true,
      marketing: false,
      darkMode: false,
      language: "한국어",
      timezone: "Seoul (UTC+9)",
      currency: "KRW (₩)",
      twoFactorEnabled: false,
      bio: null,
      customUrl: null,
      contentType: "links",
      linkTitle: null,
      linkDescription: null,
      linkUrl: null,
      shortUrlType: "default",
      backgroundTheme: "beige",
      showProfileImage: true,
      showBio: true,
      showVisitCount: true,
      layoutStyle: "centered",
      instagramUrl: null,
      twitterUrl: null,
      youtubeUrl: null,
      updatedAt: new Date(),
    };
    this.userSettings.set(1, demoSettings);
    this.currentUserSettingsId = 2;

    // Create demo subscription
    const demoSubscription: Subscription = {
      id: 1,
      userId: 1,
      plan: "pro",
      status: "active",
      pricePerMonth: 19000,
      currentPeriodStart: new Date(),
      currentPeriodEnd: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000), // 30 days from now
      cancelAtPeriodEnd: false,
      createdAt: new Date(),
    };
    this.subscriptions.set(1, demoSubscription);
    this.currentSubscriptionId = 2;

    // Create additional demo user (user 8 - current active user)
    const demoUser8: User = {
      id: 8,
      username: "demo_user",
      email: "demo8@amusefit.com", 
      password: "password123",
      name: "김철수",
      phone: "010-1234-5678",
      company: "AmuseFit Korea",
      role: "user",
      avatar: null,
      profileImageUrl: null,
      introVideoUrl: null,
      bio: null,
      customUrl: null,
      contentType: "links",
      visitCount: 0,
      provider: null,
      providerId: null,
      createdAt: new Date(),
    };
    this.users.set(8, demoUser8);
    this.currentUserId = 9;

    // Create demo links for user 1 
    const demoLinks: Link[] = [
      {
        id: 1,
        userId: 1,
        title: "비즈니스 프로필",
        originalUrl: "https://inpock.com/profile/demo",
        shortCode: "abc123",
        style: "thumbnail",
        clicks: 127,
        isActive: true,
        imageUrl: null,
        customImageUrl: null,
        cropData: null,
        description: null,
        createdAt: new Date(),
      },
      {
        id: 2,
        userId: 1,
        title: "제품 카탈로그", 
        originalUrl: "https://inpock.com/catalog/demo",
        shortCode: "def456",
        style: "card",
        clicks: 89,
        isActive: true,
        imageUrl: null,
        customImageUrl: null,
        cropData: null,
        description: null,
        createdAt: new Date(),
      },
    ];
    demoLinks.forEach(link => this.links.set(link.id, link));

    // Create demo links for user 8 (current active user)
    const demoLinksUser8: Link[] = [
      {
        id: 37,
        userId: 8,
        title: "[ENG] 🚨레전드 사건 발생! 서울 용산역 미니멀 라이프 스타일링 원데이클래스 수업 현장",
        originalUrl: "https://www.youtube.com/watch?v=example1",
        shortCode: "fit123",
        style: "thumbnail",
        clicks: 25,
        isActive: true,
        imageUrl: null,
        customImageUrl: null,
        cropData: null,
        description: "피트니스 라이프스타일 원데이클래스",
        createdAt: new Date(),
      },
      {
        id: 38,
        userId: 8,
        title: "홈트레이닝 가이드",
        originalUrl: "https://www.youtube.com/watch?v=example2",
        shortCode: "home456",
        style: "card",
        clicks: 18,
        isActive: true,
        imageUrl: null,
        customImageUrl: null,
        cropData: null,
        description: "집에서 할 수 있는 효과적인 운동법",
        createdAt: new Date(),
      },
      {
        id: 39,
        userId: 8,
        title: "영양 관리 팁",
        originalUrl: "https://blog.example.com/nutrition",
        shortCode: "nutr789",
        style: "simple",
        clicks: 12,
        isActive: true,
        imageUrl: null,
        customImageUrl: null,
        cropData: null,
        description: "건강한 식단 관리 방법",
        createdAt: new Date(),
      }
    ];
    demoLinksUser8.forEach(link => this.links.set(link.id, link));
    this.currentLinkId = 40;

    // Create demo link visits for user 8's links to demonstrate analytics
    const now = new Date();
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const thisMonth = new Date(now.getFullYear(), now.getMonth(), 1);
    
    const demoVisits: LinkVisit[] = [
      // Link 1 visits (abc123) for user 1
      { id: 1, linkId: 1, visitorIp: "127.0.0.1", userAgent: "Chrome", referrer: null, isOwner: true, visitedAt: new Date(today.getTime() + 1000) },
      { id: 2, linkId: 1, visitorIp: "127.0.0.1", userAgent: "Chrome", referrer: null, isOwner: true, visitedAt: new Date(today.getTime() + 2000) },
      { id: 3, linkId: 1, visitorIp: "192.168.1.10", userAgent: "Safari", referrer: "https://google.com", isOwner: false, visitedAt: new Date(today.getTime() + 3000) },
      { id: 4, linkId: 1, visitorIp: "192.168.1.11", userAgent: "Firefox", referrer: "https://youtube.com", isOwner: false, visitedAt: new Date(today.getTime() + 4000) },
      { id: 5, linkId: 1, visitorIp: "192.168.1.12", userAgent: "Chrome", referrer: "https://instagram.com", isOwner: false, visitedAt: new Date(today.getTime() + 5000) },
      
      // Link 2 visits (def456) for user 1
      { id: 6, linkId: 2, visitorIp: "127.0.0.1", userAgent: "Chrome", referrer: null, isOwner: true, visitedAt: new Date(today.getTime() + 6000) },
      { id: 7, linkId: 2, visitorIp: "192.168.1.20", userAgent: "Safari", referrer: "https://facebook.com", isOwner: false, visitedAt: new Date(today.getTime() + 7000) },
      { id: 8, linkId: 2, visitorIp: "192.168.1.21", userAgent: "Edge", referrer: "https://twitter.com", isOwner: false, visitedAt: new Date(today.getTime() + 8000) },
      
      // Link 37 visits (fit123) for user 8
      { id: 9, linkId: 37, visitorIp: "127.0.0.1", userAgent: "Chrome", referrer: null, isOwner: true, visitedAt: new Date(today.getTime() + 9000) },
      { id: 10, linkId: 37, visitorIp: "192.168.1.30", userAgent: "Chrome", referrer: "https://naver.com", isOwner: false, visitedAt: new Date(today.getTime() + 10000) },
      
      // Some older visits from previous days/months
      { id: 11, linkId: 1, visitorIp: "192.168.1.40", userAgent: "Safari", referrer: "https://kakao.com", isOwner: false, visitedAt: new Date(thisMonth.getTime() + 86400000) }, // 1 day into month
      { id: 12, linkId: 1, visitorIp: "192.168.1.41", userAgent: "Firefox", referrer: "https://daum.net", isOwner: false, visitedAt: new Date(thisMonth.getTime() + 172800000) }, // 2 days into month
      { id: 13, linkId: 2, visitorIp: "192.168.1.42", userAgent: "Chrome", referrer: "https://google.com", isOwner: false, visitedAt: new Date(thisMonth.getTime() + 259200000) }, // 3 days into month
      
      // Only keep visits for older demo links, not for newly created links
    ];
    
    demoVisits.forEach(visit => this.linkVisits.set(visit.id, visit));
    this.currentLinkVisitId = 14;

    // Create demo deals
    const demoDeals: Deal[] = [
      {
        id: 1,
        userId: 1,
        title: "마케팅 컨설팅",
        description: "전문 마케팅 컨설턴트가 제공하는 맞춤형 마케팅 전략 수립 서비스입니다.",
        price: 500000,
        category: "신규",
        status: "active",
        company: "마케팅랩",
        rating: "4.9",
        reviews: 127,
        createdAt: new Date(),
      },
      {
        id: 2,
        userId: 1,
        title: "웹사이트 제작",
        description: "반응형 웹사이트 제작 서비스를 제공합니다.",
        price: 1200000,
        category: "인기",
        status: "active",
        company: "디자인스튜디오",
        rating: "4.8",
        reviews: 89,
        createdAt: new Date(),
      },
    ];
    demoDeals.forEach(deal => this.deals.set(deal.id, deal));
    this.currentDealId = 3;

    // Create demo activities
    const demoActivities: Activity[] = [
      {
        id: 1,
        userId: 1,
        type: "connection",
        title: "새로운 비즈니스 연결",
        description: "마케팅랩과 연결되었습니다",
        timestamp: new Date(Date.now() - 2 * 60 * 60 * 1000), // 2 hours ago
      },
      {
        id: 2,
        userId: 1,
        type: "deal",
        title: "딜 성사",
        description: "웹사이트 제작 딜이 성사되었습니다",
        timestamp: new Date(Date.now() - 5 * 60 * 60 * 1000), // 5 hours ago
      },
    ];
    demoActivities.forEach(activity => this.activities.set(activity.id, activity));
    this.currentActivityId = 3;
  }

  // User methods
  async getUser(id: number): Promise<User | undefined> {
    return this.users.get(id);
  }

  async getUserByEmail(email: string): Promise<User | undefined> {
    return Array.from(this.users.values()).find(user => user.email === email);
  }

  async getUserByUsername(username: string): Promise<User | undefined> {
    // Prioritize user ID 8 for demo_user to show the correct links
    const users = Array.from(this.users.values());
    if (username === "demo_user") {
      const user8 = users.find(user => user.id === 8 && user.username === username);
      if (user8) return user8;
    }
    return users.find(user => user.username === username);
  }

  async getUserByCustomUrl(customUrl: string): Promise<User | undefined> {
    // First check if any user has this custom URL in their settings
    const settings = Array.from(this.userSettings.values()).find(s => s.customUrl === customUrl);
    if (settings) {
      return this.users.get(settings.userId);
    }
    return undefined;
  }

  async getUserByPhone(phone: string): Promise<User | undefined> {
    return Array.from(this.users.values()).find(user => user.phone === phone);
  }

  async getAllUsers(): Promise<User[]> {
    return Array.from(this.users.values());
  }

  async createUser(insertUser: InsertUser): Promise<User> {
    const id = this.currentUserId++;
    const user: User = {
      id,
      username: insertUser.username,
      email: insertUser.email,
      password: insertUser.password || null,
      name: insertUser.name,
      phone: insertUser.phone || null,
      company: insertUser.company || null,
      role: insertUser.role || null,
      avatar: insertUser.avatar || null,
      profileImageUrl: insertUser.profileImageUrl || null,
      introVideoUrl: insertUser.introVideoUrl || null,
      bio: insertUser.bio || null,
      customUrl: insertUser.customUrl || null,
      contentType: insertUser.contentType || "links",
      visitCount: insertUser.visitCount || 0,
      provider: insertUser.provider || null,
      providerId: insertUser.providerId || null,
      createdAt: new Date(),
    };
    this.users.set(id, user);
    return user;
  }

  async updateUser(id: number, updates: Partial<User>): Promise<User | undefined> {
    const user = this.users.get(id);
    if (!user) return undefined;
    
    const updatedUser = { ...user, ...updates };
    this.users.set(id, updatedUser);
    return updatedUser;
  }

  // Link methods
  async getLinks(userId: number): Promise<Link[]> {
    return Array.from(this.links.values()).filter(link => link.userId === userId);
  }

  async getAllLinks(userId: number): Promise<Link[]> {
    return this.getLinks(userId);
  }

  async getLink(id: number): Promise<Link | undefined> {
    return this.links.get(id);
  }

  async getLinkByShortCode(shortCode: string): Promise<Link | undefined> {
    return Array.from(this.links.values()).find(link => link.shortCode === shortCode);
  }

  async createLink(insertLink: InsertLink): Promise<Link> {
    const id = this.currentLinkId++;
    const link: Link = {
      id,
      userId: insertLink.userId,
      title: insertLink.title,
      originalUrl: insertLink.originalUrl,
      shortCode: insertLink.shortCode,
      style: insertLink.style || "thumbnail",
      clicks: 0,
      isActive: insertLink.isActive !== undefined ? insertLink.isActive : true,
      imageUrl: insertLink.imageUrl || null,
      customImageUrl: insertLink.customImageUrl || null,
      cropData: insertLink.cropData || null,
      description: insertLink.description || null,
      createdAt: new Date(),
    };
    this.links.set(id, link);
    
    console.log(`[NEW-LINK] Created link ${id} starting with 0 visits`);
    return link;
  }

  async updateLink(id: number, updates: Partial<Link>): Promise<Link | undefined> {
    const link = this.links.get(id);
    if (!link) return undefined;
    
    const updatedLink = { ...link, ...updates };
    this.links.set(id, updatedLink);
    return updatedLink;
  }

  async deleteLink(id: number): Promise<boolean> {
    return this.links.delete(id);
  }

  async incrementLinkClicks(id: number): Promise<void> {
    const link = this.links.get(id);
    if (link && link.clicks !== null) {
      link.clicks++;
      this.links.set(id, link);
    }
  }

  // Deal methods
  async getDeals(): Promise<Deal[]> {
    return Array.from(this.deals.values()).filter(deal => deal.status === "active");
  }

  async getDealsByCategory(category: string): Promise<Deal[]> {
    return Array.from(this.deals.values()).filter(
      deal => deal.category === category && deal.status === "active"
    );
  }

  async getUserDeals(userId: number): Promise<Deal[]> {
    return Array.from(this.deals.values()).filter(deal => deal.userId === userId);
  }

  async getDeal(id: number): Promise<Deal | undefined> {
    return this.deals.get(id);
  }

  async createDeal(insertDeal: InsertDeal): Promise<Deal> {
    const id = this.currentDealId++;
    const deal: Deal = {
      ...insertDeal,
      id,
      status: "active",
      rating: "4.9",
      reviews: 0,
      createdAt: new Date(),
    };
    this.deals.set(id, deal);
    return deal;
  }

  async updateDeal(id: number, updates: Partial<Deal>): Promise<Deal | undefined> {
    const deal = this.deals.get(id);
    if (!deal) return undefined;
    
    const updatedDeal = { ...deal, ...updates };
    this.deals.set(id, updatedDeal);
    return updatedDeal;
  }

  async deleteDeal(id: number): Promise<boolean> {
    return this.deals.delete(id);
  }

  // Chat methods
  async getUserChats(userId: number): Promise<Chat[]> {
    return Array.from(this.chats.values()).filter(
      chat => chat.participants.includes(userId.toString())
    );
  }

  async getChat(id: number): Promise<Chat | undefined> {
    return this.chats.get(id);
  }

  async createChat(insertChat: InsertChat): Promise<Chat> {
    const id = this.currentChatId++;
    const chat: Chat = {
      ...insertChat,
      id,
      lastMessage: insertChat.lastMessage || null,
      isRead: insertChat.isRead !== undefined ? insertChat.isRead : false,
      lastMessageTime: new Date(),
    };
    this.chats.set(id, chat);
    return chat;
  }

  async updateChat(id: number, updates: Partial<Chat>): Promise<Chat | undefined> {
    const chat = this.chats.get(id);
    if (!chat) return undefined;
    
    const updatedChat = { ...chat, ...updates };
    this.chats.set(id, updatedChat);
    return updatedChat;
  }

  // Message methods
  async getChatMessages(chatId: number): Promise<Message[]> {
    return Array.from(this.messages.values()).filter(
      message => message.chatId === chatId
    );
  }

  async createMessage(insertMessage: InsertMessage): Promise<Message> {
    const id = this.currentMessageId++;
    const message: Message = {
      ...insertMessage,
      id,
      timestamp: new Date(),
    };
    this.messages.set(id, message);
    return message;
  }

  // Activity methods
  async getUserActivities(userId: number): Promise<Activity[]> {
    return Array.from(this.activities.values())
      .filter(activity => activity.userId === userId)
      .sort((a, b) => b.timestamp!.getTime() - a.timestamp!.getTime());
  }

  async createActivity(insertActivity: InsertActivity): Promise<Activity> {
    const id = this.currentActivityId++;
    const activity: Activity = {
      ...insertActivity,
      id,
      description: insertActivity.description || null,
      timestamp: new Date(),
    };
    this.activities.set(id, activity);
    return activity;
  }

  // User Settings methods
  async getUserSettings(userId: number): Promise<UserSettings | undefined> {
    return Array.from(this.userSettings.values()).find(settings => settings.userId === userId);
  }

  async createUserSettings(insertSettings: InsertUserSettings): Promise<UserSettings> {
    const id = this.currentUserSettingsId++;
    const settings: UserSettings = {
      id,
      userId: insertSettings.userId,
      notifications: insertSettings.notifications ?? true,
      marketing: insertSettings.marketing ?? false,
      darkMode: insertSettings.darkMode ?? false,
      language: insertSettings.language ?? "한국어",
      timezone: insertSettings.timezone ?? "Seoul (UTC+9)",
      currency: insertSettings.currency ?? "KRW (₩)",
      bio: insertSettings.bio ?? null,
      customUrl: insertSettings.customUrl ?? null,
      contentType: insertSettings.contentType ?? "links",
      linkTitle: insertSettings.linkTitle ?? null,
      linkDescription: insertSettings.linkDescription ?? null,
      linkUrl: insertSettings.linkUrl ?? null,
      shortUrlType: insertSettings.shortUrlType ?? "default",
      backgroundTheme: insertSettings.backgroundTheme ?? "beige",
      showProfileImage: insertSettings.showProfileImage ?? true,
      showBio: insertSettings.showBio ?? true,
      showVisitCount: insertSettings.showVisitCount ?? true,
      layoutStyle: insertSettings.layoutStyle ?? "centered",
      instagramUrl: insertSettings.instagramUrl ?? null,
      twitterUrl: insertSettings.twitterUrl ?? null,
      youtubeUrl: insertSettings.youtubeUrl ?? null,
      twoFactorEnabled: insertSettings.twoFactorEnabled ?? false,
      updatedAt: new Date(),
    };
    this.userSettings.set(id, settings);
    return settings;
  }

  async updateUserSettings(userId: number, updates: Partial<UserSettings>): Promise<UserSettings | undefined> {
    const settings = await this.getUserSettings(userId);
    if (!settings) return undefined;
    
    const updatedSettings = { ...settings, ...updates, updatedAt: new Date() };
    this.userSettings.set(settings.id, updatedSettings);
    return updatedSettings;
  }

  async getSettings(userId: number): Promise<UserSettings | undefined> {
    return this.getUserSettings(userId);
  }

  // Subscription methods
  async getUserSubscription(userId: number): Promise<Subscription | undefined> {
    return Array.from(this.subscriptions.values()).find(sub => sub.userId === userId);
  }

  async createSubscription(insertSubscription: InsertSubscription): Promise<Subscription> {
    const id = this.currentSubscriptionId++;
    const subscription: Subscription = {
      ...insertSubscription,
      id,
      plan: insertSubscription.plan || "free",
      status: insertSubscription.status || "active",
      pricePerMonth: insertSubscription.pricePerMonth || null,
      currentPeriodStart: insertSubscription.currentPeriodStart || null,
      currentPeriodEnd: insertSubscription.currentPeriodEnd || null,
      cancelAtPeriodEnd: insertSubscription.cancelAtPeriodEnd !== undefined ? insertSubscription.cancelAtPeriodEnd : false,
      createdAt: new Date(),
    };
    this.subscriptions.set(id, subscription);
    return subscription;
  }

  async updateSubscription(userId: number, updates: Partial<Subscription>): Promise<Subscription | undefined> {
    const subscription = await this.getUserSubscription(userId);
    if (!subscription) return undefined;
    
    const updatedSubscription = { ...subscription, ...updates };
    this.subscriptions.set(subscription.id, updatedSubscription);
    return updatedSubscription;
  }

  async createPasswordResetToken(insertToken: InsertPasswordResetToken): Promise<PasswordResetToken> {
    const id = this.currentUserSettingsId++;
    const token: PasswordResetToken = {
      id,
      ...insertToken,
      used: insertToken.used || false,
      createdAt: new Date(),
    };
    this.passwordResetTokens.set(insertToken.token, token);
    return token;
  }

  async getPasswordResetToken(token: string): Promise<PasswordResetToken | undefined> {
    const resetToken = this.passwordResetTokens.get(token);
    if (!resetToken) return undefined;
    
    // Check if token is expired
    if (resetToken.expiresAt < new Date() || resetToken.used) {
      return undefined;
    }
    
    return resetToken;
  }

  async markTokenAsUsed(token: string): Promise<boolean> {
    const resetToken = this.passwordResetTokens.get(token);
    if (!resetToken) return false;
    
    const updatedToken = { ...resetToken, used: true };
    this.passwordResetTokens.set(token, updatedToken);
    return true;
  }

  async deleteExpiredTokens(): Promise<void> {
    const now = new Date();
    const tokensToDelete: string[] = [];
    
    this.passwordResetTokens.forEach((token, tokenValue) => {
      if (token.expiresAt < now || token.used) {
        tokensToDelete.push(tokenValue);
      }
    });
    
    tokensToDelete.forEach(tokenValue => {
      this.passwordResetTokens.delete(tokenValue);
    });
  }

  // Media Upload methods
  async getUserMediaUploads(userId: number): Promise<MediaUpload[]> {
    return Array.from(this.mediaUploads.values()).filter(upload => upload.userId === userId);
  }

  async getMediaUpload(id: number): Promise<MediaUpload | undefined> {
    return this.mediaUploads.get(id);
  }

  async createMediaUpload(insertUpload: InsertMediaUpload): Promise<MediaUpload> {
    const id = this.currentMediaUploadId++;
    const upload: MediaUpload = {
      id,
      userId: insertUpload.userId,
      fileName: insertUpload.fileName || null,
      originalName: insertUpload.originalName || null,
      mimeType: insertUpload.mimeType || null,
      fileSize: insertUpload.fileSize || null,
      filePath: insertUpload.filePath || null,
      mediaUrl: insertUpload.mediaUrl || null,
      mediaType: insertUpload.mediaType,
      title: insertUpload.title || null,
      description: insertUpload.description || null,
      isActive: insertUpload.isActive ?? true,
      createdAt: new Date(),
    };
    this.mediaUploads.set(id, upload);
    return upload;
  }

  async getMediaByUserAndType(userId: number, mediaType: string): Promise<MediaUpload[]> {
    return Array.from(this.mediaUploads.values()).filter(upload => 
      upload.userId === userId && 
      upload.mediaType === mediaType && 
      upload.isActive
    );
  }

  async createMedia(insertUpload: InsertMediaUpload): Promise<MediaUpload> {
    return this.createMediaUpload(insertUpload);
  }

  async updateMedia(id: number, updates: Partial<MediaUpload>): Promise<MediaUpload | undefined> {
    const upload = this.mediaUploads.get(id);
    if (!upload) return undefined;
    
    const updatedUpload = { ...upload, ...updates };
    this.mediaUploads.set(id, updatedUpload);
    return updatedUpload;
  }

  async deleteMediaUpload(id: number): Promise<boolean> {
    return this.mediaUploads.delete(id);
  }

  async incrementUserVisitCount(userId: number): Promise<void> {
    const user = this.users.get(userId);
    if (user) {
      const updatedUser = { ...user, visitCount: (user.visitCount || 0) + 1 };
      this.users.set(userId, updatedUser);
    }
  }

  // Link Visit Tracking - Proper implementations for MemStorage
  async recordLinkVisit(visit: InsertLinkVisit): Promise<LinkVisit> {
    const id = this.currentLinkVisitId++;
    const linkVisit: LinkVisit = {
      id,
      linkId: visit.linkId,
      visitorIp: visit.visitorIp,
      userAgent: visit.userAgent || null,
      referrer: visit.referrer || null,
      isOwner: visit.isOwner || false,
      visitedAt: new Date(),
    };
    this.linkVisits.set(id, linkVisit);
    return linkVisit;
  }

  async getLinkVisits(linkId: number): Promise<LinkVisit[]> {
    return []; // Simple stub - returns empty array
  }

  async getLinkVisitStats(linkId: number): Promise<{
    totalVisits: number;
    dailyVisits: number;
    monthlyVisits: number;
    ownerVisits: number;
    externalVisits: number;
  }> {
    const visits = Array.from(this.linkVisits.values()).filter(visit => visit.linkId === linkId);
    
    if (visits.length === 0) {
      return {
        totalVisits: 0,
        dailyVisits: 0,
        monthlyVisits: 0,
        ownerVisits: 0,
        externalVisits: 0
      };
    }

    const now = new Date();
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const thisMonth = new Date(now.getFullYear(), now.getMonth(), 1);
    
    let totalVisits = visits.length;
    let dailyVisits = 0;
    let monthlyVisits = 0;
    let ownerVisits = 0;
    let externalVisits = 0;
    
    visits.forEach(visit => {
      const visitDate = new Date(visit.visitedAt || new Date());
      
      if (visitDate >= today) {
        dailyVisits++;
      }
      
      if (visitDate >= thisMonth) {
        monthlyVisits++;
      }
      
      if (visit.isOwner) {
        ownerVisits++;
      } else {
        externalVisits++;
      }
    });

    return {
      totalVisits,
      dailyVisits,
      monthlyVisits,
      ownerVisits,
      externalVisits
    };
  }

  async getUserLinkStats(userId: number): Promise<{
    totalVisits: number;
    dailyVisits: number;
    monthlyVisits: number;
    ownerVisits: number;
    externalVisits: number;
  }> {
    // Get all links for the user
    const userLinks = this.getLinks(userId);
    const links = await userLinks;
    
    // Calculate totals by summing individual link stats
    let totalVisits = 0;
    let dailyVisits = 0;
    let monthlyVisits = 0;
    let ownerVisits = 0;
    let externalVisits = 0;
    
    for (const link of links) {
      const linkStats = await this.getLinkVisitStats(link.id);
      totalVisits += linkStats.totalVisits;
      dailyVisits += linkStats.dailyVisits;
      monthlyVisits += linkStats.monthlyVisits;
      ownerVisits += linkStats.ownerVisits;
      externalVisits += linkStats.externalVisits;
    }
    
    return {
      totalVisits,
      dailyVisits,
      monthlyVisits,
      ownerVisits,
      externalVisits
    };
  }
}

import { db } from "./db";
import { eq, and, desc, sql, inArray } from "drizzle-orm";

export class DatabaseStorage implements IStorage {
  async getUser(id: number): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.id, id));
    return user || undefined;
  }

  async getUserByEmail(email: string): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.email, email));
    return user || undefined;
  }

  async getUserByUsername(username: string): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.username, username));
    return user || undefined;
  }

  async getUserByCustomUrl(customUrl: string): Promise<User | undefined> {
    // First get settings with the custom URL
    const [settings] = await db.select().from(userSettings).where(eq(userSettings.customUrl, customUrl));
    if (!settings) return undefined;
    
    // Then get the user
    const [user] = await db.select().from(users).where(eq(users.id, settings.userId));
    return user || undefined;
  }

  async getUserByPhone(phone: string): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.phone, phone));
    return user || undefined;
  }

  async getAllUsers(): Promise<User[]> {
    return await db.select().from(users);
  }

  async createUser(insertUser: InsertUser): Promise<User> {
    const [user] = await db
      .insert(users)
      .values(insertUser)
      .returning();
    return user;
  }

  async updateUser(id: number, updates: Partial<User>): Promise<User | undefined> {
    // If email is being updated, check if it's different from current email
    if (updates.email) {
      const currentUser = await this.getUser(id);
      if (currentUser && currentUser.email === updates.email) {
        // Email is the same, remove it from updates to avoid constraint error
        delete updates.email;
      } else if (currentUser && currentUser.email !== updates.email) {
        // Email is different, check if new email already exists
        const existingUser = await this.getUserByEmail(updates.email);
        if (existingUser && existingUser.id !== id) {
          throw new Error('Email already exists');
        }
      }
    }

    const [user] = await db
      .update(users)
      .set(updates)
      .where(eq(users.id, id))
      .returning();
    return user || undefined;
  }

  async getLinks(userId: number): Promise<Link[]> {
    return await db.select().from(links).where(eq(links.userId, userId));
  }

  async getAllLinks(userId: number): Promise<Link[]> {
    return this.getLinks(userId);
  }

  async getLink(id: number): Promise<Link | undefined> {
    const [link] = await db.select().from(links).where(eq(links.id, id));
    return link || undefined;
  }

  async getLinkByShortCode(shortCode: string): Promise<Link | undefined> {
    const [link] = await db.select().from(links).where(eq(links.shortCode, shortCode));
    return link || undefined;
  }

  async createLink(insertLink: InsertLink): Promise<Link> {
    const [link] = await db
      .insert(links)
      .values(insertLink)
      .returning();
    return link;
  }

  async updateLink(id: number, updates: Partial<Link>): Promise<Link | undefined> {
    const [link] = await db
      .update(links)
      .set(updates)
      .where(eq(links.id, id))
      .returning();
    return link || undefined;
  }

  async deleteLink(id: number): Promise<boolean> {
    try {
      console.log(`[DELETE-LINK] Checking if link ${id} exists...`);
      // First check if the link exists
      const existingLink = await db.select().from(links).where(eq(links.id, id));
      console.log(`[DELETE-LINK] Found ${existingLink.length} links with ID ${id}`);
      
      if (existingLink.length === 0) {
        console.log(`[DELETE-LINK] Link ${id} does not exist`);
        return false;
      }

      console.log(`[DELETE-LINK] Deleting link ${id}...`);
      // Delete related link_visits first to avoid foreign key constraint issues
      await db.delete(linkVisits).where(eq(linkVisits.linkId, id));
      console.log(`[DELETE-LINK] Deleted related visits for link ${id}`);
      
      // Delete the link
      await db.delete(links).where(eq(links.id, id));
      console.log(`[DELETE-LINK] Successfully deleted link ${id}`);
      return true;
    } catch (error) {
      console.error("[DELETE-LINK] Database error:", error);
      throw error;
    }
  }

  async incrementLinkClicks(id: number): Promise<void> {
    const [link] = await db.select({ clicks: links.clicks }).from(links).where(eq(links.id, id));
    if (link) {
      await db
        .update(links)
        .set({ clicks: (link.clicks || 0) + 1 })
        .where(eq(links.id, id));
    }
  }

  async getDeals(): Promise<Deal[]> {
    return await db.select().from(deals);
  }

  async getDealsByCategory(category: string): Promise<Deal[]> {
    return await db.select().from(deals).where(eq(deals.category, category));
  }

  async getUserDeals(userId: number): Promise<Deal[]> {
    return await db.select().from(deals).where(eq(deals.userId, userId));
  }

  async getDeal(id: number): Promise<Deal | undefined> {
    const [deal] = await db.select().from(deals).where(eq(deals.id, id));
    return deal || undefined;
  }

  async createDeal(insertDeal: InsertDeal): Promise<Deal> {
    const [deal] = await db
      .insert(deals)
      .values(insertDeal)
      .returning();
    return deal;
  }

  async updateDeal(id: number, updates: Partial<Deal>): Promise<Deal | undefined> {
    const [deal] = await db
      .update(deals)
      .set(updates)
      .where(eq(deals.id, id))
      .returning();
    return deal || undefined;
  }

  async deleteDeal(id: number): Promise<boolean> {
    const result = await db.delete(deals).where(eq(deals.id, id));
    return (result.rowCount || 0) > 0;
  }

  async getUserChats(userId: number): Promise<Chat[]> {
    return await db.select().from(chats);
  }

  async getChat(id: number): Promise<Chat | undefined> {
    const [chat] = await db.select().from(chats).where(eq(chats.id, id));
    return chat || undefined;
  }

  async createChat(insertChat: InsertChat): Promise<Chat> {
    const [chat] = await db
      .insert(chats)
      .values(insertChat)
      .returning();
    return chat;
  }

  async updateChat(id: number, updates: Partial<Chat>): Promise<Chat | undefined> {
    const [chat] = await db
      .update(chats)
      .set(updates)
      .where(eq(chats.id, id))
      .returning();
    return chat || undefined;
  }

  async getChatMessages(chatId: number): Promise<Message[]> {
    return await db.select().from(messages).where(eq(messages.chatId, chatId));
  }

  async createMessage(insertMessage: InsertMessage): Promise<Message> {
    const [message] = await db
      .insert(messages)
      .values(insertMessage)
      .returning();
    return message;
  }

  async getUserActivities(userId: number): Promise<Activity[]> {
    return await db.select().from(activities).where(eq(activities.userId, userId));
  }

  async createActivity(insertActivity: InsertActivity): Promise<Activity> {
    const [activity] = await db
      .insert(activities)
      .values(insertActivity)
      .returning();
    return activity;
  }

  async getUserSettings(userId: number): Promise<UserSettings | undefined> {
    const [settings] = await db.select().from(userSettings).where(eq(userSettings.userId, userId));
    return settings || undefined;
  }

  async getSettings(userId: number): Promise<UserSettings | undefined> {
    return this.getUserSettings(userId);
  }

  async createUserSettings(insertSettings: InsertUserSettings): Promise<UserSettings> {
    const [settings] = await db
      .insert(userSettings)
      .values(insertSettings)
      .returning();
    return settings;
  }

  async updateUserSettings(userId: number, updates: Partial<UserSettings>): Promise<UserSettings | undefined> {
    const [settings] = await db
      .update(userSettings)
      .set(updates)
      .where(eq(userSettings.userId, userId))
      .returning();
    return settings || undefined;
  }

  async getUserSubscription(userId: number): Promise<Subscription | undefined> {
    const [subscription] = await db.select().from(subscriptions).where(eq(subscriptions.userId, userId));
    return subscription || undefined;
  }

  async createSubscription(insertSubscription: InsertSubscription): Promise<Subscription> {
    const [subscription] = await db
      .insert(subscriptions)
      .values(insertSubscription)
      .returning();
    return subscription;
  }

  async updateSubscription(userId: number, updates: Partial<Subscription>): Promise<Subscription | undefined> {
    const [subscription] = await db
      .update(subscriptions)
      .set(updates)
      .where(eq(subscriptions.userId, userId))
      .returning();
    return subscription || undefined;
  }

  async createPasswordResetToken(insertToken: InsertPasswordResetToken): Promise<PasswordResetToken> {
    const [token] = await db
      .insert(passwordResetTokens)
      .values(insertToken)
      .returning();
    return token;
  }

  async getPasswordResetToken(token: string): Promise<PasswordResetToken | undefined> {
    const [resetToken] = await db
      .select()
      .from(passwordResetTokens)
      .where(
        and(
          eq(passwordResetTokens.token, token),
          eq(passwordResetTokens.used, false)
        )
      );
    
    if (!resetToken) return undefined;
    
    // Check if token is expired
    if (resetToken.expiresAt < new Date()) {
      return undefined;
    }
    
    return resetToken;
  }

  async markTokenAsUsed(token: string): Promise<boolean> {
    const [updatedToken] = await db
      .update(passwordResetTokens)
      .set({ used: true })
      .where(eq(passwordResetTokens.token, token))
      .returning();
    
    return !!updatedToken;
  }

  async deleteExpiredTokens(): Promise<void> {
    const now = new Date();
    await db
      .delete(passwordResetTokens)
      .where(
        and(
          eq(passwordResetTokens.expiresAt, now),
          eq(passwordResetTokens.used, true)
        )
      );
  }

  // Media Upload methods
  async getUserMediaUploads(userId: number): Promise<MediaUpload[]> {
    return await db.select().from(mediaUploads).where(eq(mediaUploads.userId, userId));
  }

  async getMediaUpload(id: number): Promise<MediaUpload | undefined> {
    const [upload] = await db.select().from(mediaUploads).where(eq(mediaUploads.id, id));
    return upload || undefined;
  }

  async createMediaUpload(insertUpload: InsertMediaUpload): Promise<MediaUpload> {
    const [upload] = await db
      .insert(mediaUploads)
      .values(insertUpload)
      .returning();
    return upload;
  }

  async deleteMediaUpload(id: number): Promise<boolean> {
    const [deletedUpload] = await db
      .delete(mediaUploads)
      .where(eq(mediaUploads.id, id))
      .returning();
    return !!deletedUpload;
  }

  async getMediaByUserAndType(userId: number, mediaType: string): Promise<MediaUpload[]> {
    return await db.select().from(mediaUploads).where(
      and(
        eq(mediaUploads.userId, userId),
        eq(mediaUploads.mediaType, mediaType),
        eq(mediaUploads.isActive, true)
      )
    );
  }

  async createMedia(insertUpload: InsertMediaUpload): Promise<MediaUpload> {
    const [upload] = await db
      .insert(mediaUploads)
      .values(insertUpload)
      .returning();
    return upload;
  }

  async updateMedia(id: number, updates: Partial<MediaUpload>): Promise<MediaUpload | undefined> {
    const [upload] = await db
      .update(mediaUploads)
      .set(updates)
      .where(eq(mediaUploads.id, id))
      .returning();
    return upload || undefined;
  }

  async incrementUserVisitCount(userId: number): Promise<void> {
    await db
      .update(users)
      .set({ visitCount: sql`${users.visitCount} + 1` })
      .where(eq(users.id, userId));
  }

  // Link Visit Tracking
  async recordLinkVisit(visit: InsertLinkVisit): Promise<LinkVisit> {
    const [linkVisit] = await db
      .insert(linkVisits)
      .values(visit)
      .returning();
    return linkVisit;
  }

  async getLinkVisits(linkId: number): Promise<LinkVisit[]> {
    return await db
      .select()
      .from(linkVisits)
      .where(eq(linkVisits.linkId, linkId))
      .orderBy(desc(linkVisits.visitedAt));
  }

  async getLinkVisitStats(linkId: number): Promise<{
    totalVisits: number;
    dailyVisits: number;
    monthlyVisits: number;
    ownerVisits: number;
    externalVisits: number;
  }> {
    const now = new Date();
    const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);

    // Get all visits for this link
    const allVisits = await db
      .select()
      .from(linkVisits)
      .where(eq(linkVisits.linkId, linkId));

    const totalVisits = allVisits.length;
    const dailyVisits = allVisits.filter(visit => 
      visit.visitedAt && visit.visitedAt >= todayStart
    ).length;
    const monthlyVisits = allVisits.filter(visit => 
      visit.visitedAt && visit.visitedAt >= monthStart
    ).length;
    const ownerVisits = allVisits.filter(visit => visit.isOwner).length;
    const externalVisits = allVisits.filter(visit => !visit.isOwner).length;

    return {
      totalVisits,
      dailyVisits,
      monthlyVisits,
      ownerVisits,
      externalVisits
    };
  }

  async getUserLinkStats(userId: number): Promise<{
    totalVisits: number;
    dailyVisits: number;
    monthlyVisits: number;
    ownerVisits: number;
    externalVisits: number;
  }> {
    const now = new Date();
    const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);

    // Get user's links
    const userLinks = await db
      .select()
      .from(links)
      .where(eq(links.userId, userId));

    if (userLinks.length === 0) {
      return {
        totalVisits: 0,
        dailyVisits: 0,
        monthlyVisits: 0,
        ownerVisits: 0,
        externalVisits: 0
      };
    }

    const linkIds = userLinks.map(link => link.id);

    // Get all visits for user's links using inArray
    let allVisits: any[] = [];
    
    if (linkIds.length > 0) {
      allVisits = await db
        .select()
        .from(linkVisits)
        .where(inArray(linkVisits.linkId, linkIds));
    }

    const totalVisits = allVisits.length;
    const dailyVisits = allVisits.filter(visit => 
      visit.visitedAt && visit.visitedAt >= todayStart
    ).length;
    const monthlyVisits = allVisits.filter(visit => 
      visit.visitedAt && visit.visitedAt >= monthStart
    ).length;
    const ownerVisits = allVisits.filter(visit => visit.isOwner).length;
    const externalVisits = allVisits.filter(visit => !visit.isOwner).length;

    return {
      totalVisits,
      dailyVisits,
      monthlyVisits,
      ownerVisits,
      externalVisits
    };
  }
}

export const storage = new MemStorage();
