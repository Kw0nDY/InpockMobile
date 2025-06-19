import { 
  users, links, userSettings, subscriptions, mediaUploads, linkVisits, notifications, passwordResetTokens,
  type User, type InsertUser,
  type Link, type InsertLink,
  type UserSettings, type InsertUserSettings,
  type Subscription, type InsertSubscription,
  type MediaUpload, type InsertMediaUpload,
  type LinkVisit, type InsertLinkVisit,
  type Notification, type InsertNotification,
  type PasswordResetToken, type InsertPasswordResetToken
} from "@shared/schema";
import { db } from "./db";
import { eq, desc, and, gte, sql, inArray } from "drizzle-orm";

// Interface for storage operations
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

  // Settings
  getSettings(userId: number): Promise<UserSettings | undefined>;
  getUserSettings(userId: number): Promise<UserSettings | undefined>;
  createUserSettings(settings: InsertUserSettings): Promise<UserSettings>;
  updateUserSettings(userId: number, updates: Partial<UserSettings>): Promise<UserSettings>;

  // Subscriptions
  getUserSubscription(userId: number): Promise<Subscription | undefined>;
  createSubscription(subscription: InsertSubscription): Promise<Subscription>;
  updateSubscription(id: number, updates: Partial<Subscription>): Promise<Subscription | undefined>;

  // Media Uploads
  getMediaByUserAndType(userId: number, type: string): Promise<MediaUpload[]>;
  createMedia(media: InsertMediaUpload): Promise<MediaUpload>;
  updateMedia(id: number, updates: Partial<MediaUpload>): Promise<MediaUpload | undefined>;
  createMediaUpload(media: InsertMediaUpload): Promise<MediaUpload>;
  getUserMediaUploads(userId: number): Promise<MediaUpload[]>;
  deleteMediaUpload(id: number): Promise<boolean>;

  // Additional methods
  getAllLinks(): Promise<Link[]>;
  
  // Notifications
  createNotification(notification: InsertNotification): Promise<Notification>;
  getUserNotifications(userId: number): Promise<Notification[]>;
  markNotificationAsRead(id: number): Promise<void>;
  getUnreadNotificationCount(userId: number): Promise<number>;

  // Password Reset Tokens
  createPasswordResetToken(token: InsertPasswordResetToken): Promise<PasswordResetToken>;
  getPasswordResetToken(token: string): Promise<PasswordResetToken | undefined>;
  markTokenAsUsed(token: string): Promise<void>;

  // Media Order Management
  updateMediaOrder(userId: number, mediaIds: number[]): Promise<void>;
  reorderUserMedia(userId: number, fromIndex: number, toIndex: number): Promise<MediaUpload[]>;
}

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
    const [user] = await db.select().from(users).where(eq(users.customUrl, customUrl));
    return user || undefined;
  }

  async getUserByPhone(phone: string): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.phone, phone));
    return user || undefined;
  }

  async getAllUsers(): Promise<User[]> {
    return await db.select().from(users);
  }

  async createUser(user: InsertUser): Promise<User> {
    const [newUser] = await db.insert(users).values(user).returning();
    return newUser;
  }

  async updateUser(id: number, updates: Partial<User>): Promise<User | undefined> {
    const [updatedUser] = await db
      .update(users)
      .set(updates)
      .where(eq(users.id, id))
      .returning();
    return updatedUser || undefined;
  }

  async getLinks(userId: number): Promise<Link[]> {
    return await db.select().from(links).where(eq(links.userId, userId)).orderBy(desc(links.createdAt));
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
    const [updatedLink] = await db
      .update(links)
      .set(updates)
      .where(eq(links.id, id))
      .returning();
    return updatedLink || undefined;
  }

  async deleteLink(id: number): Promise<boolean> {
    const result = await db.delete(links).where(eq(links.id, id));
    return (result.rowCount ?? 0) > 0;
  }

  async incrementLinkClicks(id: number): Promise<void> {
    await db
      .update(links)
      .set({ clicks: sql`${links.clicks} + 1` })
      .where(eq(links.id, id));
  }

  async recordLinkVisit(visit: InsertLinkVisit): Promise<LinkVisit> {
    const [newVisit] = await db.insert(linkVisits).values(visit).returning();
    return newVisit;
  }

  async getLinkVisits(linkId: number): Promise<LinkVisit[]> {
    return await db.select().from(linkVisits).where(eq(linkVisits.linkId, linkId)).orderBy(desc(linkVisits.visitedAt));
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

    // Single optimized query to get all statistics at once
    const [stats] = await db
      .select({
        totalVisits: sql<number>`count(*)`,
        dailyVisits: sql<number>`count(*) filter (where visited_at >= ${todayStart})`,
        monthlyVisits: sql<number>`count(*) filter (where visited_at >= ${monthStart})`,
        ownerVisits: sql<number>`count(*) filter (where is_owner = true)`,
        externalVisits: sql<number>`count(*) filter (where is_owner = false)`
      })
      .from(linkVisits)
      .where(eq(linkVisits.linkId, linkId));

    return {
      totalVisits: Number(stats.totalVisits),
      dailyVisits: Number(stats.dailyVisits),
      monthlyVisits: Number(stats.monthlyVisits),
      ownerVisits: Number(stats.ownerVisits),
      externalVisits: Number(stats.externalVisits),
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
    const linkIds = userLinks.map(link => link.id);

    if (linkIds.length === 0) {
      return { totalVisits: 0, dailyVisits: 0, monthlyVisits: 0, ownerVisits: 0, externalVisits: 0 };
    }

    const now = new Date();
    const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);

    // Single optimized query to get all statistics at once
    const [stats] = await db
      .select({
        totalVisits: sql<number>`count(*)`,
        dailyVisits: sql<number>`count(*) filter (where visited_at >= ${todayStart})`,
        monthlyVisits: sql<number>`count(*) filter (where visited_at >= ${monthStart})`,
        ownerVisits: sql<number>`count(*) filter (where is_owner = true)`,
        externalVisits: sql<number>`count(*) filter (where is_owner = false)`
      })
      .from(linkVisits)
      .where(inArray(linkVisits.linkId, linkIds));

    return {
      totalVisits: Number(stats.totalVisits),
      dailyVisits: Number(stats.dailyVisits),
      monthlyVisits: Number(stats.monthlyVisits),
      ownerVisits: Number(stats.ownerVisits),
      externalVisits: Number(stats.externalVisits),
    };
  }

  async incrementUserVisitCount(userId: number): Promise<void> {
    await db
      .update(users)
      .set({ visitCount: sql`${users.visitCount} + 1` })
      .where(eq(users.id, userId));
  }

  async getMediaByUserAndType(userId: number, mediaType: string): Promise<MediaUpload[]> {
    return await db
      .select()
      .from(mediaUploads)
      .where(and(eq(mediaUploads.userId, userId), eq(mediaUploads.mediaType, mediaType)))
      .orderBy(desc(mediaUploads.displayOrder), desc(mediaUploads.createdAt));
  }

  async createMedia(media: InsertMediaUpload): Promise<MediaUpload> {
    const [newMedia] = await db.insert(mediaUploads).values(media).returning();
    return newMedia;
  }

  async updateMedia(id: number, updates: Partial<MediaUpload>): Promise<MediaUpload | undefined> {
    const [updatedMedia] = await db
      .update(mediaUploads)
      .set(updates)
      .where(eq(mediaUploads.id, id))
      .returning();
    return updatedMedia || undefined;
  }

  async createMediaUpload(media: InsertMediaUpload): Promise<MediaUpload> {
    return this.createMedia(media);
  }

  async getUserMediaUploads(userId: number): Promise<MediaUpload[]> {
    return await db
      .select()
      .from(mediaUploads)
      .where(eq(mediaUploads.userId, userId))
      .orderBy(desc(mediaUploads.displayOrder), desc(mediaUploads.createdAt));
  }

  async deleteMediaUpload(id: number): Promise<boolean> {
    const result = await db.delete(mediaUploads).where(eq(mediaUploads.id, id));
    return (result.rowCount ?? 0) > 0;
  }

  async getUserSettings(userId: number): Promise<UserSettings | undefined> {
    const [settings] = await db.select().from(userSettings).where(eq(userSettings.userId, userId));
    return settings || undefined;
  }

  async createUserSettings(settings: InsertUserSettings): Promise<UserSettings> {
    const [newSettings] = await db.insert(userSettings).values(settings).returning();
    return newSettings;
  }

  async updateUserSettings(userId: number, updates: Partial<UserSettings>): Promise<UserSettings> {
    const [updatedSettings] = await db
      .update(userSettings)
      .set(updates)
      .where(eq(userSettings.userId, userId))
      .returning();
    return updatedSettings;
  }

  async getSettings(userId: number): Promise<UserSettings | undefined> {
    return this.getUserSettings(userId);
  }

  async getUserSubscription(userId: number): Promise<Subscription | undefined> {
    const [subscription] = await db.select().from(subscriptions).where(eq(subscriptions.userId, userId));
    return subscription || undefined;
  }

  async createSubscription(subscription: InsertSubscription): Promise<Subscription> {
    const [newSubscription] = await db.insert(subscriptions).values(subscription).returning();
    return newSubscription;
  }

  async updateSubscription(id: number, updates: Partial<Subscription>): Promise<Subscription | undefined> {
    const [updatedSubscription] = await db
      .update(subscriptions)
      .set(updates)
      .where(eq(subscriptions.id, id))
      .returning();
    return updatedSubscription || undefined;
  }

  async getAllLinks(): Promise<Link[]> {
    return await db.select().from(links).orderBy(desc(links.createdAt));
  }

  // Notifications
  async createNotification(notification: InsertNotification): Promise<Notification> {
    const [newNotification] = await db
      .insert(notifications)
      .values(notification)
      .returning();
    return newNotification;
  }

  async getUserNotifications(userId: number): Promise<Notification[]> {
    return await db
      .select()
      .from(notifications)
      .where(eq(notifications.userId, userId))
      .orderBy(desc(notifications.createdAt))
      .limit(50); // Limit to last 50 notifications
  }

  async markNotificationAsRead(id: number): Promise<void> {
    await db
      .update(notifications)
      .set({ isRead: true })
      .where(eq(notifications.id, id));
  }

  async getUnreadNotificationCount(userId: number): Promise<number> {
    const [result] = await db
      .select({ count: sql<number>`count(*)` })
      .from(notifications)
      .where(and(eq(notifications.userId, userId), eq(notifications.isRead, false)));
    return result.count;
  }

  // Password Reset Tokens
  async createPasswordResetToken(token: InsertPasswordResetToken): Promise<PasswordResetToken> {
    const [newToken] = await db
      .insert(passwordResetTokens)
      .values(token)
      .returning();
    return newToken;
  }

  async getPasswordResetToken(token: string): Promise<PasswordResetToken | undefined> {
    const [resetToken] = await db
      .select()
      .from(passwordResetTokens)
      .where(eq(passwordResetTokens.token, token));
    return resetToken || undefined;
  }

  async markTokenAsUsed(token: string): Promise<void> {
    await db
      .update(passwordResetTokens)
      .set({ used: true })
      .where(eq(passwordResetTokens.token, token));
  }

  // Media Order Management
  async updateMediaOrder(userId: number, mediaIds: number[]): Promise<void> {
    // Update display order for each media item
    for (let i = 0; i < mediaIds.length; i++) {
      await db
        .update(mediaUploads)
        .set({ displayOrder: i })
        .where(and(eq(mediaUploads.id, mediaIds[i]), eq(mediaUploads.userId, userId)));
    }
  }

  async reorderUserMedia(userId: number, fromIndex: number, toIndex: number): Promise<MediaUpload[]> {
    const userMedia = await this.getUserMediaUploads(userId);
    
    // Reorder the array
    const [movedItem] = userMedia.splice(fromIndex, 1);
    userMedia.splice(toIndex, 0, movedItem);
    
    // Update display orders
    const mediaIds = userMedia.map(media => media.id);
    await this.updateMediaOrder(userId, mediaIds);
    
    return userMedia;
  }
}

export const storage = new DatabaseStorage();