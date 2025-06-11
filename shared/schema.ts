import { pgTable, text, serial, integer, boolean, timestamp } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { relations } from "drizzle-orm";
import { z } from "zod";

export const users = pgTable("users", {
  id: serial("id").primaryKey(),
  username: text("username").notNull().unique(),
  email: text("email").notNull().unique(),
  password: text("password"),
  name: text("name").notNull(),
  company: text("company"),
  role: text("role").default("user"),
  avatar: text("avatar"),
  profileImageUrl: text("profile_image_url"),
  introVideoUrl: text("intro_video_url"),
  bio: text("bio"),
  customUrl: text("custom_url"),
  contentType: text("content_type").default("links"),
  visitCount: integer("visit_count").default(0),
  provider: text("provider").default("local"),
  providerId: text("provider_id"),
  createdAt: timestamp("created_at").defaultNow(),
});

export const links = pgTable("links", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").notNull(),
  title: text("title").notNull(),
  originalUrl: text("original_url").notNull(),
  shortCode: text("short_code").notNull().unique(),
  clicks: integer("clicks").default(0),
  isActive: boolean("is_active").default(true),
  createdAt: timestamp("created_at").defaultNow(),
});

export const deals = pgTable("deals", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").notNull(),
  title: text("title").notNull(),
  description: text("description").notNull(),
  price: integer("price").notNull(),
  category: text("category").notNull(),
  status: text("status").default("active"),
  company: text("company").notNull(),
  rating: text("rating").default("4.9"),
  reviews: integer("reviews").default(0),
  createdAt: timestamp("created_at").defaultNow(),
});

export const chats = pgTable("chats", {
  id: serial("id").primaryKey(),
  participants: text("participants").array().notNull(),
  lastMessage: text("last_message"),
  lastMessageTime: timestamp("last_message_time").defaultNow(),
  isRead: boolean("is_read").default(false),
});

export const messages = pgTable("messages", {
  id: serial("id").primaryKey(),
  chatId: integer("chat_id").notNull(),
  senderId: integer("sender_id").notNull(),
  content: text("content").notNull(),
  timestamp: timestamp("timestamp").defaultNow(),
});

export const activities = pgTable("activities", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").notNull(),
  type: text("type").notNull(),
  title: text("title").notNull(),
  description: text("description"),
  timestamp: timestamp("timestamp").defaultNow(),
});

export const userSettings = pgTable("user_settings", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").notNull().unique(),
  notifications: boolean("notifications").default(true),
  marketing: boolean("marketing").default(false),
  darkMode: boolean("dark_mode").default(false),
  language: text("language").default("한국어"),
  timezone: text("timezone").default("Seoul (UTC+9)"),
  currency: text("currency").default("KRW (₩)"),
  twoFactorEnabled: boolean("two_factor_enabled").default(false),
  bio: text("bio"),
  customUrl: text("custom_url"),
  contentType: text("content_type").default("links"), // links, image, video
  linkTitle: text("link_title"),
  linkDescription: text("link_description"),
  linkUrl: text("link_url"),
  shortUrlType: text("short_url_type").default("default"), // default, custom, link
  updatedAt: timestamp("updated_at").defaultNow(),
});

export const subscriptions = pgTable("subscriptions", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").notNull(),
  plan: text("plan").notNull().default("free"), // free, pro, enterprise
  status: text("status").notNull().default("active"), // active, canceled, expired
  pricePerMonth: integer("price_per_month").default(0),
  currentPeriodStart: timestamp("current_period_start").defaultNow(),
  currentPeriodEnd: timestamp("current_period_end"),
  cancelAtPeriodEnd: boolean("cancel_at_period_end").default(false),
  createdAt: timestamp("created_at").defaultNow(),
});

export const passwordResetTokens = pgTable("password_reset_tokens", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").references(() => users.id).notNull(),
  token: text("token").notNull().unique(),
  expiresAt: timestamp("expires_at").notNull(),
  used: boolean("used").default(false).notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const mediaUploads = pgTable("media_uploads", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").references(() => users.id).notNull(),
  fileName: text("file_name"),
  originalName: text("original_name"),
  mimeType: text("mime_type"),
  fileSize: integer("file_size"),
  filePath: text("file_path"),
  mediaUrl: text("media_url"), // For URL-based media
  mediaType: text("media_type").notNull(), // 'image' or 'video'
  title: text("title"),
  description: text("description"),
  isActive: boolean("is_active").default(true),
  createdAt: timestamp("created_at").defaultNow(),
});

export const insertUserSchema = createInsertSchema(users).omit({
  id: true,
  createdAt: true,
});

export const insertLinkSchema = createInsertSchema(links).omit({
  id: true,
  clicks: true,
  createdAt: true,
});

export const insertMediaSchema = createInsertSchema(mediaUploads).omit({
  id: true,
  createdAt: true,
});

export const insertDealSchema = createInsertSchema(deals).omit({
  id: true,
  status: true,
  rating: true,
  reviews: true,
  createdAt: true,
});

export const insertChatSchema = createInsertSchema(chats).omit({
  id: true,
  lastMessageTime: true,
});

export const insertMessageSchema = createInsertSchema(messages).omit({
  id: true,
  timestamp: true,
});

export const insertActivitySchema = createInsertSchema(activities).omit({
  id: true,
  timestamp: true,
});

export const insertUserSettingsSchema = createInsertSchema(userSettings).omit({
  id: true,
  updatedAt: true,
});

export const insertSubscriptionSchema = createInsertSchema(subscriptions).omit({
  id: true,
  createdAt: true,
});

export const insertPasswordResetTokenSchema = createInsertSchema(passwordResetTokens).omit({
  id: true,
  createdAt: true,
});

export const insertMediaUploadSchema = createInsertSchema(mediaUploads).omit({
  id: true,
  createdAt: true,
});

export type User = typeof users.$inferSelect;
export type InsertUser = z.infer<typeof insertUserSchema>;

export type Link = typeof links.$inferSelect;
export type InsertLink = z.infer<typeof insertLinkSchema>;

export type Deal = typeof deals.$inferSelect;
export type InsertDeal = z.infer<typeof insertDealSchema>;

export type Chat = typeof chats.$inferSelect;
export type InsertChat = z.infer<typeof insertChatSchema>;

export type Message = typeof messages.$inferSelect;
export type InsertMessage = z.infer<typeof insertMessageSchema>;

export type Activity = typeof activities.$inferSelect;
export type InsertActivity = z.infer<typeof insertActivitySchema>;

export type UserSettings = typeof userSettings.$inferSelect;
export type InsertUserSettings = z.infer<typeof insertUserSettingsSchema>;

export type Subscription = typeof subscriptions.$inferSelect;
export type InsertSubscription = z.infer<typeof insertSubscriptionSchema>;

export type PasswordResetToken = typeof passwordResetTokens.$inferSelect;
export type InsertPasswordResetToken = z.infer<typeof insertPasswordResetTokenSchema>;

export type MediaUpload = typeof mediaUploads.$inferSelect;
export type InsertMediaUpload = z.infer<typeof insertMediaUploadSchema>;

// Relations
export const usersRelations = relations(users, ({ many, one }) => ({
  links: many(links),
  deals: many(deals),
  sentMessages: many(messages),
  activities: many(activities),
  settings: one(userSettings),
  subscription: one(subscriptions),
  mediaUploads: many(mediaUploads),
}));

export const linksRelations = relations(links, ({ one }) => ({
  user: one(users, {
    fields: [links.userId],
    references: [users.id],
  }),
}));

export const dealsRelations = relations(deals, ({ one }) => ({
  user: one(users, {
    fields: [deals.userId],
    references: [users.id],
  }),
}));

export const chatsRelations = relations(chats, ({ many }) => ({
  messages: many(messages),
}));

export const messagesRelations = relations(messages, ({ one }) => ({
  chat: one(chats, {
    fields: [messages.chatId],
    references: [chats.id],
  }),
  sender: one(users, {
    fields: [messages.senderId],
    references: [users.id],
  }),
}));

export const activitiesRelations = relations(activities, ({ one }) => ({
  user: one(users, {
    fields: [activities.userId],
    references: [users.id],
  }),
}));

export const userSettingsRelations = relations(userSettings, ({ one }) => ({
  user: one(users, {
    fields: [userSettings.userId],
    references: [users.id],
  }),
}));

export const subscriptionsRelations = relations(subscriptions, ({ one }) => ({
  user: one(users, {
    fields: [subscriptions.userId],
    references: [users.id],
  }),
}));

export const mediaUploadsRelations = relations(mediaUploads, ({ one }) => ({
  user: one(users, {
    fields: [mediaUploads.userId],
    references: [users.id],
  }),
}));
