import { pgTable, text, serial, integer, boolean, timestamp } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { relations } from "drizzle-orm";
import { z } from "zod";

export const users = pgTable("users", {
  id: serial("id").primaryKey(),
  username: text("username").notNull().unique(),
  email: text("email").notNull().unique(),
  password: text("password"),
  // Required fields from signup
  name: text("name").notNull(),
  phone: text("phone").notNull(), // 필수로 변경
  birthDate: text("birth_date").notNull(), // 필수로 변경
  // Optional fitness fields from signup
  currentGym: text("current_gym"), // 소속 헬스장명
  gymPosition: text("gym_position"), // 직급
  // Profile and system fields
  avatar: text("avatar"),
  profileImageUrl: text("profile_image_url"),
  introVideoUrl: text("intro_video_url"),
  bio: text("bio"),
  customUrl: text("custom_url"),
  contentType: text("content_type").default("links"),
  visitCount: integer("visit_count").default(0),
  profileVisitCount: integer("profile_visit_count").default(0),
  provider: text("provider").default("local"),
  providerId: text("provider_id"),
  // Additional fitness fields (for profile settings)
  fitnessAwards: text("fitness_awards"),
  fitnessCertifications: text("fitness_certifications"),
  gymAddress: text("gym_address"),
  fitnessIntro: text("fitness_intro"),
  // Legacy fields (deprecated)
  company: text("company"), // 회사명 -> 소속 헬스장명으로 대체됨
  role: text("role").default("user"), // 역할 -> 직급으로 대체됨
  createdAt: timestamp("created_at").defaultNow(),
});

export const links = pgTable("links", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").notNull(),
  title: text("title").notNull(),
  originalUrl: text("original_url").notNull(),
  shortCode: text("short_code").notNull().unique(),
  style: text("style", { enum: ['thumbnail', 'simple', 'card', 'background'] }).default("thumbnail"),
  clicks: integer("clicks").default(0),
  isActive: boolean("is_active").default(true),
  imageUrl: text("image_url"),
  customImageUrl: text("custom_image_url"),
  cropData: text("crop_data"), // JSON string for crop coordinates
  description: text("description"),
  createdAt: timestamp("created_at").defaultNow(),
});

// Removed deals and activities tables as they are not used in the current app

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
  linkTitle: text("link_title"),
  linkDescription: text("link_description"),
  linkUrl: text("link_url"),
  shortUrlType: text("short_url_type").default("default"), // default, custom, link
  // Content and URL settings
  contentType: text("content_type").default("links"),
  customUrl: text("custom_url"),
  // View screen settings
  backgroundTheme: text("background_theme").default("beige"), // beige, white, dark, gradient
  showProfileImage: boolean("show_profile_image").default(true),
  showBio: boolean("show_bio").default(true),
  showVisitCount: boolean("show_visit_count").default(true),
  layoutStyle: text("layout_style").default("centered"), // centered, fullwidth
  instagramUrl: text("instagram_url"),
  twitterUrl: text("twitter_url"),
  youtubeUrl: text("youtube_url"),
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
  displayOrder: integer("display_order").default(0),
  isActive: boolean("is_active").default(true),
  createdAt: timestamp("created_at").defaultNow(),
});

export const linkVisits = pgTable("link_visits", {
  id: serial("id").primaryKey(),
  linkId: integer("link_id").references(() => links.id).notNull(),
  visitorIp: text("visitor_ip").notNull(),
  userAgent: text("user_agent"),
  referrer: text("referrer"),
  isOwner: boolean("is_owner").default(false),
  visitedAt: timestamp("visited_at").defaultNow(),
});

export const passwordResetTokens = pgTable("password_reset_tokens", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").references(() => users.id).notNull(),
  token: text("token").notNull().unique(),
  expiresAt: timestamp("expires_at").notNull(),
  used: boolean("used").default(false),
  createdAt: timestamp("created_at").defaultNow(),
});

// Schema for user creation (updated for new signup flow)
export const insertUserSchema = createInsertSchema(users).omit({
  id: true,
  createdAt: true,
  visitCount: true,
  provider: true,
  providerId: true,
});

// Schema for link creation
export const insertLinkSchema = createInsertSchema(links).omit({
  id: true,
  clicks: true,
  createdAt: true,
});

// Schema for media uploads
export const insertMediaUploadSchema = createInsertSchema(mediaUploads).omit({
  id: true,
  createdAt: true,
});

// Schema for link visits tracking
export const insertLinkVisitSchema = createInsertSchema(linkVisits).omit({
  id: true,
  visitedAt: true,
});

// Schema for password reset tokens
export const insertPasswordResetTokenSchema = createInsertSchema(passwordResetTokens).omit({
  id: true,
  createdAt: true,
});

// Schema for user settings
export const insertUserSettingsSchema = createInsertSchema(userSettings).omit({
  id: true,
  updatedAt: true,
});

// Schema for subscriptions
export const insertSubscriptionSchema = createInsertSchema(subscriptions).omit({
  id: true,
  createdAt: true,
});



// Type exports for all entities
export type User = typeof users.$inferSelect;
export type InsertUser = z.infer<typeof insertUserSchema>;

export type Link = typeof links.$inferSelect;
export type InsertLink = z.infer<typeof insertLinkSchema>;

export type UserSettings = typeof userSettings.$inferSelect;
export type InsertUserSettings = z.infer<typeof insertUserSettingsSchema>;

export type Subscription = typeof subscriptions.$inferSelect;
export type InsertSubscription = z.infer<typeof insertSubscriptionSchema>;

export type MediaUpload = typeof mediaUploads.$inferSelect;
export type InsertMediaUpload = z.infer<typeof insertMediaUploadSchema>;

export type LinkVisit = typeof linkVisits.$inferSelect;
export type InsertLinkVisit = z.infer<typeof insertLinkVisitSchema>;

export type ProfileVisit = typeof profileVisits.$inferSelect;
export type InsertProfileVisit = typeof profileVisits.$inferInsert;

export type ActiveSession = typeof activeSessions.$inferSelect;
export type InsertActiveSession = typeof activeSessions.$inferInsert;

export type Deal = typeof deals.$inferSelect;
export type InsertDeal = typeof deals.$inferInsert;

export type LinkStyle = 'thumbnail' | 'simple' | 'card' | 'background';
export const LINK_STYLES = ['thumbnail', 'simple', 'card', 'background'] as const;

// Relations
export const usersRelations = relations(users, ({ many, one }) => ({
  links: many(links),
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

// Notifications table for real-time alerts
export const notifications = pgTable("notifications", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").notNull().references(() => users.id, { onDelete: "cascade" }),
  type: text("type").notNull(), // 'profile_visit', 'link_click', 'new_connection'
  title: text("title").notNull(),
  message: text("message").notNull(),
  data: text("data"), // JSON string for additional data like visitor IP, link clicked, etc.
  isRead: boolean("is_read").default(false).notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const notificationsRelations = relations(notifications, ({ one }) => ({
  user: one(users, {
    fields: [notifications.userId],
    references: [users.id],
  }),
}));

export type Notification = typeof notifications.$inferSelect;
export type InsertNotification = typeof notifications.$inferInsert;
export type PasswordResetToken = typeof passwordResetTokens.$inferSelect;
export type InsertPasswordResetToken = typeof passwordResetTokens.$inferInsert;
