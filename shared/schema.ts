import { pgTable, text, serial, integer, boolean, timestamp } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

export const users = pgTable("users", {
  id: serial("id").primaryKey(),
  username: text("username").notNull().unique(),
  email: text("email").notNull().unique(),
  password: text("password").notNull(),
  name: text("name").notNull(),
  company: text("company"),
  role: text("role").default("user"),
  avatar: text("avatar"),
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

export const insertUserSchema = createInsertSchema(users).omit({
  id: true,
  createdAt: true,
});

export const insertLinkSchema = createInsertSchema(links).omit({
  id: true,
  clicks: true,
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
