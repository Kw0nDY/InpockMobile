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

  // User-specific methods
  incrementUserVisitCount(userId: number): Promise<void>;

  // Deals
  getDeals(): Promise<Deal[]>;
  getUserDeals(userId: number): Promise<Deal[]>;
  getDealsByCategory(category: string): Promise<Deal[]>;
  getDeal(id: number): Promise<Deal | undefined>;
  createDeal(deal: InsertDeal): Promise<Deal>;

  // Chats
  getChats(userId: number): Promise<Chat[]>;
  getChat(id: number): Promise<Chat | undefined>;
  createChat(chat: InsertChat): Promise<Chat>;

  // Messages
  getMessages(chatId: number): Promise<Message[]>;
  createMessage(message: InsertMessage): Promise<Message>;

  // Activities
  getUserActivities(userId: number): Promise<Activity[]>;
  createActivity(activity: InsertActivity): Promise<Activity>;

  // Settings
  getSettings(userId: number): Promise<UserSettings | undefined>;
  getUserSettings(userId: number): Promise<UserSettings | undefined>;
  createUserSettings(settings: InsertUserSettings): Promise<UserSettings>;
  updateUserSettings(userId: number, updates: Partial<UserSettings>): Promise<UserSettings>;

  // Subscriptions
  getUserSubscription(userId: number): Promise<Subscription | undefined>;
  createSubscription(subscription: InsertSubscription): Promise<Subscription>;
  updateSubscription(id: number, updates: Partial<Subscription>): Promise<Subscription | undefined>;

  // Password Reset
  createPasswordResetToken(token: InsertPasswordResetToken): Promise<PasswordResetToken>;
  getPasswordResetToken(token: string): Promise<PasswordResetToken | undefined>;
  markTokenAsUsed(token: string): Promise<void>;

  // Media Uploads
  getMediaByUserAndType(userId: number, type: string): Promise<MediaUpload[]>;
  createMedia(media: InsertMediaUpload): Promise<MediaUpload>;
  updateMedia(id: number, updates: Partial<MediaUpload>): Promise<MediaUpload | undefined>;
  createMediaUpload(media: InsertMediaUpload): Promise<MediaUpload>;
  getUserMediaUploads(userId: number): Promise<MediaUpload[]>;
  deleteMediaUpload(id: number): Promise<boolean>;

  // Additional methods
  getAllLinks(): Promise<Link[]>;
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
    // Start with empty state - no demo data
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

  async getUserByCustomUrl(customUrl: string): Promise<User | undefined> {
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

  async createUser(user: InsertUser): Promise<User> {
    const newUser: User = {
      ...user,
      id: this.currentUserId++,
      password: user.password || null,
      phone: user.phone || null,
      company: user.company || null,
      role: user.role || null,
      avatar: user.avatar || null,
      profileImageUrl: user.profileImageUrl || null,
      introVideoUrl: user.introVideoUrl || null,
      bio: user.bio || null,
      customUrl: user.customUrl || null,
      contentType: user.contentType || null,
      visitCount: user.visitCount || null,
      provider: user.provider || null,
      providerId: user.providerId || null,
      createdAt: new Date(),
    };
    this.users.set(newUser.id, newUser);
    return newUser;
  }

  async updateUser(id: number, updates: Partial<User>): Promise<User | undefined> {
    const user = this.users.get(id);
    if (!user) return undefined;
    
    const updatedUser = { ...user, ...updates };
    this.users.set(id, updatedUser);
    return updatedUser;
  }

  async incrementUserVisitCount(userId: number): Promise<void> {
    const user = this.users.get(userId);
    if (user) {
      user.visitCount = (user.visitCount || 0) + 1;
      this.users.set(userId, user);
    }
  }

  // Links methods
  async getLinks(userId: number): Promise<Link[]> {
    return Array.from(this.links.values()).filter(link => link.userId === userId);
  }

  async getAllLinks(): Promise<Link[]> {
    return Array.from(this.links.values());
  }

  async getLink(id: number): Promise<Link | undefined> {
    return this.links.get(id);
  }

  async getLinkByShortCode(shortCode: string): Promise<Link | undefined> {
    return Array.from(this.links.values()).find(link => link.shortCode === shortCode);
  }

  async createLink(link: InsertLink): Promise<Link> {
    const newLink: Link = {
      ...link,
      id: this.currentLinkId++,
      style: link.style || null,
      clicks: 0,
      isActive: true,
      imageUrl: link.imageUrl || null,
      customImageUrl: link.customImageUrl || null,
      cropData: link.cropData || null,
      description: link.description || null,
      createdAt: new Date(),
    };
    this.links.set(newLink.id, newLink);
    return newLink;
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
    if (link) {
      link.clicks = (link.clicks || 0) + 1;
      this.links.set(id, link);
    }
  }

  // Link visits methods
  async recordLinkVisit(visit: InsertLinkVisit): Promise<LinkVisit> {
    const newVisit: LinkVisit = {
      ...visit,
      id: this.currentLinkVisitId++,
      userAgent: visit.userAgent || null,
      referrer: visit.referrer || null,
      isOwner: visit.isOwner || null,
      visitedAt: new Date(),
    };
    this.linkVisits.set(newVisit.id, newVisit);
    return newVisit;
  }

  async getLinkVisits(linkId: number): Promise<LinkVisit[]> {
    return Array.from(this.linkVisits.values()).filter(visit => visit.linkId === linkId);
  }

  async getLinkVisitStats(linkId: number): Promise<{
    totalVisits: number;
    dailyVisits: number;
    monthlyVisits: number;
    ownerVisits: number;
    externalVisits: number;
  }> {
    const visits = await this.getLinkVisits(linkId);
    const now = new Date();
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const thisMonth = new Date(now.getFullYear(), now.getMonth(), 1);

    const dailyVisits = visits.filter(visit => visit.visitedAt && visit.visitedAt >= today).length;
    const monthlyVisits = visits.filter(visit => visit.visitedAt && visit.visitedAt >= thisMonth).length;
    const ownerVisits = visits.filter(visit => visit.isOwner).length;
    const externalVisits = visits.filter(visit => !visit.isOwner).length;

    return {
      totalVisits: visits.length,
      dailyVisits,
      monthlyVisits,
      ownerVisits,
      externalVisits,
    };
  }

  async getUserLinkStats(userId: number): Promise<{
    totalVisits: number;
    dailyVisits: number;
    monthlyVisits: number;
    ownerVisits: number;
    externalVisits: number;
  }> {
    const userLinks = await this.getLinks(userId);
    let totalVisits = 0;
    let dailyVisits = 0;
    let monthlyVisits = 0;
    let ownerVisits = 0;
    let externalVisits = 0;

    for (const link of userLinks) {
      const stats = await this.getLinkVisitStats(link.id);
      totalVisits += stats.totalVisits;
      dailyVisits += stats.dailyVisits;
      monthlyVisits += stats.monthlyVisits;
      ownerVisits += stats.ownerVisits;
      externalVisits += stats.externalVisits;
    }

    return {
      totalVisits,
      dailyVisits,
      monthlyVisits,
      ownerVisits,
      externalVisits,
    };
  }

  // Deals methods
  async getDeals(): Promise<Deal[]> {
    return Array.from(this.deals.values());
  }

  async getUserDeals(userId: number): Promise<Deal[]> {
    return Array.from(this.deals.values()).filter(deal => deal.userId === userId);
  }

  async getDealsByCategory(category: string): Promise<Deal[]> {
    return Array.from(this.deals.values()).filter(deal => deal.category === category);
  }

  async getDeal(id: number): Promise<Deal | undefined> {
    return this.deals.get(id);
  }

  async createDeal(deal: InsertDeal): Promise<Deal> {
    const newDeal: Deal = {
      ...deal,
      id: this.currentDealId++,
      status: deal.status || null,
      rating: deal.rating || null,
      reviews: deal.reviews || null,
      createdAt: new Date(),
    };
    this.deals.set(newDeal.id, newDeal);
    return newDeal;
  }

  // Chats methods
  async getChats(userId: number): Promise<Chat[]> {
    return Array.from(this.chats.values()).filter(chat => 
      chat.participantIds?.includes(userId)
    );
  }

  async getChat(id: number): Promise<Chat | undefined> {
    return this.chats.get(id);
  }

  async createChat(chat: InsertChat): Promise<Chat> {
    const newChat: Chat = {
      ...chat,
      id: this.currentChatId++,
      participantIds: chat.participantIds || null,
      lastMessageAt: chat.lastMessageAt || null,
      createdAt: new Date(),
    };
    this.chats.set(newChat.id, newChat);
    return newChat;
  }

  // Messages methods
  async getMessages(chatId: number): Promise<Message[]> {
    return Array.from(this.messages.values()).filter(message => message.chatId === chatId);
  }

  async createMessage(message: InsertMessage): Promise<Message> {
    const newMessage: Message = {
      ...message,
      id: this.currentMessageId++,
      type: message.type || null,
      mediaUrl: message.mediaUrl || null,
      isRead: message.isRead || null,
      sentAt: new Date(),
    };
    this.messages.set(newMessage.id, newMessage);
    return newMessage;
  }

  // User settings methods
  async getSettings(userId: number): Promise<UserSettings | undefined> {
    return Array.from(this.userSettings.values()).find(settings => settings.userId === userId);
  }

  async getUserSettings(userId: number): Promise<UserSettings | undefined> {
    return Array.from(this.userSettings.values()).find(settings => settings.userId === userId);
  }

  async createUserSettings(settings: InsertUserSettings): Promise<UserSettings> {
    const newSettings: UserSettings = {
      ...settings,
      id: this.currentUserSettingsId++,
      bio: settings.bio || null,
      customUrl: settings.customUrl || null,
      contentType: settings.contentType || null,
      notifications: settings.notifications || null,
      marketing: settings.marketing || null,
      darkMode: settings.darkMode || null,
      language: settings.language || null,
      timezone: settings.timezone || null,
      currency: settings.currency || null,
      twoFactorEnabled: settings.twoFactorEnabled || null,
      linkTitle: settings.linkTitle || null,
      linkDescription: settings.linkDescription || null,
      linkUrl: settings.linkUrl || null,
      shortUrlType: settings.shortUrlType || null,
      backgroundTheme: settings.backgroundTheme || null,
      showProfileImage: settings.showProfileImage || null,
      showBio: settings.showBio || null,
      showVisitCount: settings.showVisitCount || null,
      layoutStyle: settings.layoutStyle || null,
      instagramUrl: settings.instagramUrl || null,
      twitterUrl: settings.twitterUrl || null,
      youtubeUrl: settings.youtubeUrl || null,
      updatedAt: new Date(),
    };
    this.userSettings.set(newSettings.id, newSettings);
    return newSettings;
  }

  async updateUserSettings(userId: number, updates: Partial<UserSettings>): Promise<UserSettings> {
    const existingSettings = Array.from(this.userSettings.values()).find(s => s.userId === userId);
    
    if (existingSettings) {
      const updatedSettings = { ...existingSettings, ...updates, updatedAt: new Date() };
      this.userSettings.set(existingSettings.id, updatedSettings);
      return updatedSettings;
    } else {
      return this.createUserSettings({ ...updates, userId } as InsertUserSettings);
    }
  }

  // Activities methods
  async getUserActivities(userId: number): Promise<Activity[]> {
    return Array.from(this.activities.values()).filter(activity => activity.userId === userId);
  }

  async createActivity(activity: InsertActivity): Promise<Activity> {
    const newActivity: Activity = {
      ...activity,
      id: this.currentActivityId++,
      description: activity.description || null,
      timestamp: activity.timestamp || null,
    };
    this.activities.set(newActivity.id, newActivity);
    return newActivity;
  }

  // Subscriptions methods
  async getUserSubscription(userId: number): Promise<Subscription | undefined> {
    return Array.from(this.subscriptions.values()).find(sub => sub.userId === userId);
  }

  async createSubscription(subscription: InsertSubscription): Promise<Subscription> {
    const newSubscription: Subscription = {
      ...subscription,
      id: this.currentSubscriptionId++,
      plan: subscription.plan || 'free',
      status: subscription.status || 'active',
      pricePerMonth: subscription.pricePerMonth || null,
      currentPeriodStart: subscription.currentPeriodStart || null,
      currentPeriodEnd: subscription.currentPeriodEnd || null,
      cancelAtPeriodEnd: subscription.cancelAtPeriodEnd || null,
      createdAt: new Date(),
    };
    this.subscriptions.set(newSubscription.id, newSubscription);
    return newSubscription;
  }

  async updateSubscription(id: number, updates: Partial<Subscription>): Promise<Subscription | undefined> {
    const subscription = this.subscriptions.get(id);
    if (!subscription) return undefined;
    
    const updatedSubscription = { ...subscription, ...updates };
    this.subscriptions.set(id, updatedSubscription);
    return updatedSubscription;
  }

  // Password reset methods
  async createPasswordResetToken(token: InsertPasswordResetToken): Promise<PasswordResetToken> {
    const newToken: PasswordResetToken = {
      ...token,
      id: Math.floor(Math.random() * 1000000),
      used: token.used || false,
      createdAt: new Date(),
    };
    this.passwordResetTokens.set(token.token, newToken);
    return newToken;
  }

  async getPasswordResetToken(token: string): Promise<PasswordResetToken | undefined> {
    return this.passwordResetTokens.get(token);
  }

  async markTokenAsUsed(token: string): Promise<void> {
    const resetToken = this.passwordResetTokens.get(token);
    if (resetToken) {
      resetToken.used = true;
      this.passwordResetTokens.set(token, resetToken);
    }
  }

  // Media methods
  async getMediaByUserAndType(userId: number, type: string): Promise<MediaUpload[]> {
    return Array.from(this.mediaUploads.values())
      .filter(media => media.userId === userId && media.mediaType === type)
      .sort((a, b) => (a.displayOrder || 0) - (b.displayOrder || 0));
  }

  async createMedia(media: InsertMediaUpload): Promise<MediaUpload> {
    const newMedia: MediaUpload = {
      ...media,
      id: this.currentMediaUploadId++,
      title: media.title || null,
      isActive: media.isActive || null,
      description: media.description || null,
      fileName: media.fileName || null,
      originalName: media.originalName || null,
      fileSize: media.fileSize || null,
      mimeType: media.mimeType || null,
      thumbnailUrl: media.thumbnailUrl || null,
      createdAt: new Date(),
    };
    this.mediaUploads.set(newMedia.id, newMedia);
    return newMedia;
  }

  async updateMedia(id: number, updates: Partial<MediaUpload>): Promise<MediaUpload | undefined> {
    const media = this.mediaUploads.get(id);
    if (!media) return undefined;
    
    const updatedMedia = { ...media, ...updates };
    this.mediaUploads.set(id, updatedMedia);
    return updatedMedia;
  }

  async createMediaUpload(media: InsertMediaUpload): Promise<MediaUpload> {
    return this.createMedia(media);
  }

  async getUserMediaUploads(userId: number): Promise<MediaUpload[]> {
    return Array.from(this.mediaUploads.values()).filter(media => media.userId === userId);
  }

  async deleteMediaUpload(id: number): Promise<boolean> {
    return this.mediaUploads.delete(id);
  }

  async updateMediaOrder(userId: number, mediaId: number, newOrder: number): Promise<MediaUpload | undefined> {
    const media = this.mediaUploads.get(mediaId);
    if (!media || media.userId !== userId) return undefined;
    
    media.displayOrder = newOrder;
    this.mediaUploads.set(mediaId, media);
    return media;
  }

  async reorderUserMedia(userId: number, mediaType: string, orderedIds: number[]): Promise<MediaUpload[]> {
    const updates: MediaUpload[] = [];
    
    for (let i = 0; i < orderedIds.length; i++) {
      const mediaId = orderedIds[i];
      const media = this.mediaUploads.get(mediaId);
      
      if (media && media.userId === userId && media.mediaType === mediaType) {
        media.displayOrder = i;
        this.mediaUploads.set(mediaId, media);
        updates.push(media);
      }
    }
    
    return updates;
  }
}

import { db } from "./db";
import { eq, desc, and, gte, sql } from "drizzle-orm";

export class DatabaseStorage implements IStorage {
  // Users
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
    const [setting] = await db.select().from(userSettings).where(eq(userSettings.customUrl, customUrl));
    if (!setting) return undefined;
    return this.getUser(setting.userId);
  }

  async getUserByPhone(phone: string): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.phone, phone));
    return user || undefined;
  }

  async getAllUsers(): Promise<User[]> {
    return db.select().from(users);
  }

  async createUser(user: InsertUser): Promise<User> {
    const [newUser] = await db.insert(users).values(user).returning();
    return newUser;
  }

  async updateUser(id: number, updates: Partial<User>): Promise<User | undefined> {
    const [updated] = await db.update(users).set(updates).where(eq(users.id, id)).returning();
    return updated || undefined;
  }

  // Links
  async getLinks(userId: number): Promise<Link[]> {
    return db.select().from(links).where(eq(links.userId, userId)).orderBy(desc(links.createdAt));
  }

  async getLink(id: number): Promise<Link | undefined> {
    const [link] = await db.select().from(links).where(eq(links.id, id));
    return link || undefined;
  }

  async getLinkByShortCode(shortCode: string): Promise<Link | undefined> {
    const [link] = await db.select().from(links).where(eq(links.shortCode, shortCode));
    return link || undefined;
  }

  async createLink(link: InsertLink): Promise<Link> {
    const [newLink] = await db.insert(links).values(link).returning();
    return newLink;
  }

  async updateLink(id: number, updates: Partial<Link>): Promise<Link | undefined> {
    const [updated] = await db.update(links).set(updates).where(eq(links.id, id)).returning();
    return updated || undefined;
  }

  async deleteLink(id: number): Promise<boolean> {
    const result = await db.delete(links).where(eq(links.id, id));
    return (result.rowCount || 0) > 0;
  }

  async incrementLinkClicks(id: number): Promise<void> {
    await db.update(links).set({ 
      clicks: sql`${links.clicks} + 1` 
    }).where(eq(links.id, id));
  }

  // Link Visits
  async recordLinkVisit(visit: InsertLinkVisit): Promise<LinkVisit> {
    const [newVisit] = await db.insert(linkVisits).values(visit).returning();
    return newVisit;
  }

  async getLinkVisits(linkId: number): Promise<LinkVisit[]> {
    return db.select().from(linkVisits).where(eq(linkVisits.linkId, linkId));
  }

  async getLinkVisitStats(linkId: number): Promise<{
    totalVisits: number;
    dailyVisits: number;
    monthlyVisits: number;
    ownerVisits: number;
    externalVisits: number;
  }> {
    const visits = await this.getLinkVisits(linkId);
    const now = new Date();
    const dayAgo = new Date(now.getTime() - 24 * 60 * 60 * 1000);
    const monthAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);

    return {
      totalVisits: visits.length,
      dailyVisits: visits.filter(v => v.visitedAt && v.visitedAt > dayAgo).length,
      monthlyVisits: visits.filter(v => v.visitedAt && v.visitedAt > monthAgo).length,
      ownerVisits: visits.filter(v => v.isOwnerVisit).length,
      externalVisits: visits.filter(v => !v.isOwnerVisit).length,
    };
  }

  async getUserLinkStats(userId: number): Promise<{
    totalVisits: number;
    dailyVisits: number;
    monthlyVisits: number;
    ownerVisits: number;
    externalVisits: number;
  }> {
    const userLinks = await this.getLinks(userId);
    let totalVisits = 0, dailyVisits = 0, monthlyVisits = 0, ownerVisits = 0, externalVisits = 0;

    for (const link of userLinks) {
      const stats = await this.getLinkVisitStats(link.id);
      totalVisits += stats.totalVisits;
      dailyVisits += stats.dailyVisits;
      monthlyVisits += stats.monthlyVisits;
      ownerVisits += stats.ownerVisits;
      externalVisits += stats.externalVisits;
    }

    return { totalVisits, dailyVisits, monthlyVisits, ownerVisits, externalVisits };
  }

  // Media Uploads
  async getMediaUploads(userId: number, mediaType?: string): Promise<MediaUpload[]> {
    if (mediaType) {
      return db.select().from(mediaUploads)
        .where(and(eq(mediaUploads.userId, userId), eq(mediaUploads.mediaType, mediaType)))
        .orderBy(mediaUploads.displayOrder, desc(mediaUploads.createdAt));
    }
    return db.select().from(mediaUploads)
      .where(eq(mediaUploads.userId, userId))
      .orderBy(mediaUploads.displayOrder, desc(mediaUploads.createdAt));
  }

  async getMediaUpload(id: number): Promise<MediaUpload | undefined> {
    const [media] = await db.select().from(mediaUploads).where(eq(mediaUploads.id, id));
    return media || undefined;
  }

  async createMediaUpload(media: InsertMediaUpload): Promise<MediaUpload> {
    const [newMedia] = await db.insert(mediaUploads).values(media).returning();
    return newMedia;
  }

  async updateMediaUpload(id: number, updates: Partial<MediaUpload>): Promise<MediaUpload | undefined> {
    const [updated] = await db.update(mediaUploads).set(updates).where(eq(mediaUploads.id, id)).returning();
    return updated || undefined;
  }

  async deleteMediaUpload(id: number): Promise<boolean> {
    const result = await db.delete(mediaUploads).where(eq(mediaUploads.id, id));
    return result.rowCount > 0;
  }

  async reorderMediaUploads(userId: number, mediaType: string, mediaIds: number[]): Promise<MediaUpload[]> {
    const updates: MediaUpload[] = [];
    
    for (let i = 0; i < mediaIds.length; i++) {
      const [updated] = await db.update(mediaUploads)
        .set({ displayOrder: i })
        .where(and(eq(mediaUploads.id, mediaIds[i]), eq(mediaUploads.userId, userId)))
        .returning();
      if (updated) {
        updates.push(updated);
      }
    }
    
    return updates;
  }

  // User Settings
  async getUserSettings(userId: number): Promise<UserSettings | undefined> {
    const [settings] = await db.select().from(userSettings).where(eq(userSettings.userId, userId));
    return settings || undefined;
  }

  async createUserSettings(settings: InsertUserSettings): Promise<UserSettings> {
    const [newSettings] = await db.insert(userSettings).values(settings).returning();
    return newSettings;
  }

  async updateUserSettings(userId: number, updates: Partial<UserSettings>): Promise<UserSettings | undefined> {
    const [updated] = await db.update(userSettings).set(updates).where(eq(userSettings.userId, userId)).returning();
    return updated || undefined;
  }

  // Other methods remain as stubs for now (deals, chats, messages, etc.)
  async getDeals(userId: number): Promise<Deal[]> { return []; }
  async getDeal(id: number): Promise<Deal | undefined> { return undefined; }
  async createDeal(deal: InsertDeal): Promise<Deal> { throw new Error("Not implemented"); }
  async updateDeal(id: number, updates: Partial<Deal>): Promise<Deal | undefined> { return undefined; }
  async deleteDeal(id: number): Promise<boolean> { return false; }

  async getPublicDeals(): Promise<Deal[]> { return []; }
  async searchDeals(query: string): Promise<Deal[]> { return []; }

  async getChats(userId: number): Promise<Chat[]> { return []; }
  async getChat(id: number): Promise<Chat | undefined> { return undefined; }
  async createChat(chat: InsertChat): Promise<Chat> { throw new Error("Not implemented"); }
  async updateChat(id: number, updates: Partial<Chat>): Promise<Chat | undefined> { return undefined; }

  async getMessages(chatId: number): Promise<Message[]> { return []; }
  async createMessage(message: InsertMessage): Promise<Message> { throw new Error("Not implemented"); }

  async getActivities(userId: number): Promise<Activity[]> { return []; }
  async createActivity(activity: InsertActivity): Promise<Activity> { throw new Error("Not implemented"); }

  async getSubscriptions(userId: number): Promise<Subscription[]> { return []; }
  async createSubscription(subscription: InsertSubscription): Promise<Subscription> { throw new Error("Not implemented"); }

  async createPasswordResetToken(token: InsertPasswordResetToken): Promise<PasswordResetToken> { throw new Error("Not implemented"); }
  async getPasswordResetToken(token: string): Promise<PasswordResetToken | undefined> { return undefined; }
  async deletePasswordResetToken(token: string): Promise<boolean> { return false; }

  async getUserByPublicIdentifier(identifier: string): Promise<User | undefined> {
    // First try by username
    let user = await this.getUserByUsername(identifier);
    if (user) return user;
    
    // Then try by custom URL
    return this.getUserByCustomUrl(identifier);
  }
}

export const storage = new DatabaseStorage();