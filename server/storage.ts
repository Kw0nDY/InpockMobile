import { 
  users, links, deals, chats, messages, activities, userSettings, subscriptions, passwordResetTokens, mediaUploads,
  type User, type InsertUser,
  type Link, type InsertLink,
  type Deal, type InsertDeal,
  type Chat, type InsertChat,
  type Message, type InsertMessage,
  type Activity, type InsertActivity,
  type UserSettings, type InsertUserSettings,
  type Subscription, type InsertSubscription,
  type PasswordResetToken, type InsertPasswordResetToken,
  type MediaUpload, type InsertMediaUpload
} from "@shared/schema";

export interface IStorage {
  // Users
  getUser(id: number): Promise<User | undefined>;
  getUserByEmail(email: string): Promise<User | undefined>;
  getUserByUsername(username: string): Promise<User | undefined>;
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
  
  private currentUserId = 1;
  private currentLinkId = 1;
  private currentDealId = 1;
  private currentChatId = 1;
  private currentMessageId = 1;
  private currentActivityId = 1;
  private currentUserSettingsId = 1;
  private currentSubscriptionId = 1;
  private currentMediaUploadId = 1;

  constructor() {
    // Initialize with some demo data
    this.initializeDemoData();
  }

  private initializeDemoData() {
    // Create demo user
    const demoUser: User = {
      id: 1,
      username: "demo_user",
      email: "demo@amusefit.com",
      password: "password123",
      name: "김철수",
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

    // Create demo links
    const demoLinks: Link[] = [
      {
        id: 1,
        userId: 1,
        title: "비즈니스 프로필",
        originalUrl: "https://inpock.com/profile/demo",
        shortCode: "abc123",
        clicks: 127,
        isActive: true,
        createdAt: new Date(),
      },
      {
        id: 2,
        userId: 1,
        title: "제품 카탈로그",
        originalUrl: "https://inpock.com/catalog/demo",
        shortCode: "def456",
        clicks: 89,
        isActive: true,
        createdAt: new Date(),
      },
    ];
    demoLinks.forEach(link => this.links.set(link.id, link));
    this.currentLinkId = 3;

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
    return Array.from(this.users.values()).find(user => user.username === username);
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

  async getLink(id: number): Promise<Link | undefined> {
    return this.links.get(id);
  }

  async getLinkByShortCode(shortCode: string): Promise<Link | undefined> {
    return Array.from(this.links.values()).find(link => link.shortCode === shortCode);
  }

  async createLink(insertLink: InsertLink): Promise<Link> {
    const id = this.currentLinkId++;
    const link: Link = {
      ...insertLink,
      id,
      clicks: 0,
      isActive: insertLink.isActive !== undefined ? insertLink.isActive : true,
      createdAt: new Date(),
    };
    this.links.set(id, link);
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
}

import { db } from "./db";
import { eq, and, sql } from "drizzle-orm";

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
    const result = await db.delete(links).where(eq(links.id, id));
    return (result.rowCount || 0) > 0;
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
}

export const storage = new DatabaseStorage();
