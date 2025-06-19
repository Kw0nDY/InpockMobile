import type { Express } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { setupKakaoAuth } from "./kakao-auth";
import { upload, handleMediaUpload, serveUploadedFile } from "./upload";
import { handleFormidableUpload } from "./formidable-upload";
import express from "express";
import {
  insertUserSchema,
  insertLinkSchema,
  insertDealSchema,
  insertUserSettingsSchema,
  insertSubscriptionSchema,
  insertPasswordResetTokenSchema,
} from "@shared/schema";
import { z } from "zod";
import { randomBytes } from "crypto";

const loginSchema = z.object({
  email: z.string().email(),
  password: z.string().min(1),
});

export async function registerRoutes(app: Express): Promise<Server> {
  // Setup Kakao OAuth authentication
  setupKakaoAuth(app);

  // OAuth test endpoint for debugging
  app.get("/test/oauth/config", (req, res) => {
    const config = {
      hasClientId: !!process.env.KAKAO_CLIENT_ID,
      hasClientSecret: !!process.env.KAKAO_CLIENT_SECRET,
      clientIdLength: process.env.KAKAO_CLIENT_ID?.length || 0,
      secretLength: process.env.KAKAO_CLIENT_SECRET?.length || 0,
    };

    console.log("OAuth Configuration Check:", config);
    res.json(config);
  });

  // Debug endpoint to check and recreate demo user if needed
  app.get("/api/debug/users", async (req, res) => {
    try {
      let demoUser = await storage.getUserByEmail("demo@amusefit.com");
      
      if (!demoUser) {
        // Recreate demo user if it doesn't exist
        console.log("Recreating demo user...");
        demoUser = await storage.createUser({
          username: "demo_user",
          email: "demo@amusefit.com",
          password: "password123",
          name: "김철수",
          company: "AmuseFit Korea",
          role: "user",
        });
        console.log("Demo user created:", demoUser.email);
      }
      
      res.json({
        userCount: 1,
        demoUser: {
          id: demoUser.id,
          email: demoUser.email,
          username: demoUser.username,
          name: demoUser.name,
          company: demoUser.company
        }
      });
    } catch (error) {
      console.error("Debug users error:", error);
      res.status(500).json({ error: "Failed to fetch users" });
    }
  });

  // Auth routes
  app.post("/api/auth/login", async (req, res) => {
    try {
      console.log("Login attempt:", {
        body: req.body,
        hasEmail: !!req.body?.email,
        hasPassword: !!req.body?.password,
      });

      const { email, password } = loginSchema.parse(req.body);
      console.log("Schema validation passed for email:", email);

      let user = await storage.getUserByEmail(email);
      console.log("User lookup result:", { found: !!user, email });

      if (!user) {
        console.log("User not found for email:", email);
        return res.status(401).json({ message: "Invalid credentials" });
      }

      if (user.password !== password) {
        console.log("Password mismatch for user:", email);
        return res.status(401).json({ message: "Invalid credentials" });
      }

      console.log("Login successful for user:", email);

      // Create session (simplified)
      res.json({
        user: {
          id: user.id,
          username: user.username,
          email: user.email,
          name: user.name,
          company: user.company,
          role: user.role,
        },
      });
    } catch (error: any) {
      console.error("Login error:", error);
      console.error("Request body:", req.body);

      if (error.name === "ZodError") {
        console.error("Validation errors:", error.errors);
        return res.status(400).json({
          message: "Invalid request format",
          details: error.errors,
        });
      }

      res.status(400).json({ message: "Invalid request data" });
    }
  });

  app.post("/api/auth/register", async (req, res) => {
    try {
      const userData = insertUserSchema.parse(req.body);

      // Check if user exists
      const existingUser = await storage.getUserByEmail(userData.email);
      if (existingUser) {
        return res.status(409).json({ message: "User already exists" });
      }

      const user = await storage.createUser(userData);

      res.status(201).json({
        user: {
          id: user.id,
          username: user.username,
          email: user.email,
          name: user.name,
          company: user.company,
          role: user.role,
        },
      });
    } catch (error) {
      res.status(400).json({ message: "Invalid request data" });
    }
  });

  app.post("/api/auth/signup", async (req, res) => {
    try {
      const { username, email, password, name, phone, company, role } = req.body;

      // Check if user already exists
      const existingUser = await storage.getUserByEmail(email);
      if (existingUser) {
        return res
          .status(400)
          .json({ error: "User already exists with this email" });
      }

      const existingUsername = await storage.getUserByUsername(username);
      if (existingUsername) {
        return res.status(400).json({ error: "Username already taken" });
      }

      // Create new user
      const newUser = await storage.createUser({
        username,
        email,
        password,
        name,
        phone: phone || null,
        company: company || "",
        role: role || "user",
      });

      // Create default user settings
      await storage.createUserSettings({
        userId: newUser.id,
        notifications: true,
        marketing: false,
        darkMode: false,
        language: "한국어",
        timezone: "Seoul (UTC+9)",
        currency: "KRW (₩)",
        twoFactorEnabled: false,
      });

      // Create default subscription
      await storage.createSubscription({
        userId: newUser.id,
        plan: "free",
        status: "active",
        pricePerMonth: 0,
        currentPeriodStart: new Date(),
        currentPeriodEnd: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
        cancelAtPeriodEnd: false,
      });

      res.status(201).json({
        message: "User created successfully",
        user: {
          id: newUser.id,
          username: newUser.username,
          email: newUser.email,
          name: newUser.name,
          company: newUser.company,
          role: newUser.role,
        },
      });
    } catch (error) {
      console.error("Signup error:", error);
      console.error("Error stack:", error.stack);
      console.error("Request body:", req.body);
      res.status(500).json({ 
        error: "Failed to create user",
        details: error.message || "Unknown error"
      });
    }
  });

  // Find ID by phone number
  app.post("/api/auth/find-id", async (req, res) => {
    try {
      const { phone } = req.body;
      
      if (!phone) {
        return res.status(400).json({ message: "전화번호를 입력해주세요." });
      }

      const user = await storage.getUserByPhone(phone);
      if (!user) {
        return res.status(404).json({ message: "등록된 전화번호를 찾을 수 없습니다." });
      }

      // In a real application, you would send SMS here
      // For demo purposes, we'll return the username directly
      res.json({ 
        message: "아이디를 찾았습니다.",
        userId: user.username
      });
    } catch (error) {
      console.error("Find ID error:", error);
      res.status(500).json({ message: "서버 오류가 발생했습니다." });
    }
  });

  // Forgot password with email or phone
  app.post("/api/auth/forgot-password", async (req, res) => {
    try {
      const { email, phone } = req.body;
      
      if (!email && !phone) {
        return res.status(400).json({ message: "이메일 또는 전화번호를 입력해주세요." });
      }

      let user;
      if (email) {
        user = await storage.getUserByEmail(email);
      } else if (phone) {
        user = await storage.getUserByPhone(phone);
      }

      if (!user) {
        return res.status(404).json({ 
          message: email ? "등록된 이메일을 찾을 수 없습니다." : "등록된 전화번호를 찾을 수 없습니다."
        });
      }

      // Generate password reset token
      const token = randomBytes(32).toString('hex');
      const expiresAt = new Date(Date.now() + 24 * 60 * 60 * 1000); // 24 hours

      await storage.createPasswordResetToken({
        userId: user.id,
        token,
        expiresAt,
        used: false
      });

      // In a real application, you would send email/SMS here
      // For demo purposes, we'll just confirm the request
      res.json({ 
        message: "비밀번호 재설정 링크를 전송했습니다.",
        // In development, you might want to return the token for testing
        ...(process.env.NODE_ENV === 'development' && { resetToken: token })
      });
    } catch (error) {
      console.error("Forgot password error:", error);
      res.status(500).json({ message: "서버 오류가 발생했습니다." });
    }
  });

  // User profile update route
  app.put("/api/user/:userId", async (req, res) => {
    try {
      const userId = parseInt(req.params.userId);
      const updates = req.body;

      const updatedUser = await storage.updateUser(userId, updates);
      
      if (!updatedUser) {
        return res.status(404).json({ message: "User not found" });
      }

      res.json({
        message: "User updated successfully",
        user: updatedUser,
      });
    } catch (error) {
      console.error("User update error:", error);
      res.status(500).json({ error: "Failed to update user" });
    }
  });

  // Dashboard routes
  app.get("/api/dashboard/stats/:userId", async (req, res) => {
    try {
      const userId = parseInt(req.params.userId);
      const user = await storage.getUser(userId);

      if (!user) {
        return res.status(404).json({ message: "User not found" });
      }

      const links = await storage.getLinks(userId);
      const deals = await storage.getUserDeals(userId);
      const activities = await storage.getUserActivities(userId);

      const stats = {
        connections: 127,
        deals: deals.length,
        revenue: 892,
        totalClicks: links.reduce((sum, link) => sum + (link.clicks || 0), 0),
      };

      res.json({ stats, activities: activities.slice(0, 5) });
    } catch (error) {
      res.status(500).json({ message: "Internal server error" });
    }
  });

  // Link routes
  app.get("/api/links/:userId", async (req, res) => {
    try {
      const userId = parseInt(req.params.userId);
      const links = await storage.getLinks(userId);
      
      // Add visit statistics to each link
      const linksWithStats = await Promise.all(
        links.map(async (link: any) => {
          const stats = await storage.getLinkVisitStats(link.id);
          return {
            ...link,
            ownerVisits: stats.ownerVisits,
            externalVisits: stats.externalVisits,
            totalVisits: stats.totalVisits,
            dailyVisits: stats.dailyVisits,
            monthlyVisits: stats.monthlyVisits
          };
        })
      );
      
      res.json(linksWithStats);
    } catch (error) {
      res.status(500).json({ message: "Internal server error" });
    }
  });

  app.post("/api/links", async (req, res) => {
    try {
      console.log("Link creation request body:", req.body);
      
      // Generate short code first
      const shortCode = Math.random().toString(36).substring(2, 8);
      
      // Add shortCode to request body before parsing
      const linkDataWithShortCode = {
        ...req.body,
        shortCode,
      };
      
      const linkData = insertLinkSchema.parse(linkDataWithShortCode);
      console.log("Parsed link data:", linkData);

      const link = await storage.createLink(linkData);

      res.status(201).json(link);
    } catch (error: any) {
      console.error("Link creation error details:", error);
      res.status(400).json({ message: "Invalid request data", error: error?.message || "Unknown error" });
    }
  });

  app.put("/api/links/:id", async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const updates = req.body;

      const link = await storage.updateLink(id, updates);
      if (!link) {
        return res.status(404).json({ message: "Link not found" });
      }

      res.json(link);
    } catch (error) {
      res.status(500).json({ message: "Internal server error" });
    }
  });

  app.delete("/api/links/:id", async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      console.log(`[DELETE-LINK] Attempting to delete link with ID: ${id}`);
      
      const deleted = await storage.deleteLink(id);
      console.log(`[DELETE-LINK] Delete result: ${deleted}`);

      if (!deleted) {
        console.log(`[DELETE-LINK] Link ${id} not found`);
        return res.status(404).json({ message: "Link not found" });
      }

      console.log(`[DELETE-LINK] Successfully deleted link ${id}`);
      res.status(204).send();
    } catch (error) {
      console.error("[DELETE-LINK] Error:", error);
      res.status(500).json({ message: "Internal server error" });
    }
  });

  app.post("/api/links/:id/click", async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      await storage.incrementLinkClicks(id);
      res.status(200).json({ message: "Click recorded" });
    } catch (error) {
      res.status(500).json({ message: "Internal server error" });
    }
  });

  // Link visit statistics
  app.get("/api/links/:id/stats", async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const stats = await storage.getLinkVisitStats(id);
      res.json(stats);
    } catch (error) {
      res.status(500).json({ message: "Internal server error" });
    }
  });

  app.get("/api/links/:id/visits", async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const visits = await storage.getLinkVisits(id);
      res.json(visits);
    } catch (error) {
      res.status(500).json({ message: "Internal server error" });
    }
  });

  // Individual link statistics
  app.get("/api/links/:id/stats", async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      console.log(`[LINK-STATS] Getting individual stats for link ${id}`);
      const stats = await storage.getLinkVisitStats(id);
      console.log(`[LINK-STATS] Individual stats result:`, stats);
      res.json(stats);
    } catch (error) {
      console.error("[LINK-STATS] Individual stats error:", error);
      res.status(500).json({ message: "Internal server error" });
    }
  });

  // User's overall link visit statistics
  app.get("/api/user/:userId/link-stats", async (req, res) => {
    try {
      const userId = parseInt(req.params.userId);
      console.log(`[LINK-STATS] Getting stats for user ${userId}`);
      const stats = await storage.getUserLinkStats(userId);
      console.log(`[LINK-STATS] Stats result:`, stats);
      res.json(stats);
    } catch (error) {
      console.error("[LINK-STATS] Error:", error);
      res.status(500).json({ message: "Internal server error" });
    }
  });

  // URL metadata fetching endpoint
  app.post("/api/url-metadata", async (req, res) => {
    try {
      const { url } = req.body;
      if (!url) {
        return res.status(400).json({ message: "URL is required" });
      }

      console.log(`[URL-METADATA] Fetching metadata for: ${url}`);
      
      const response = await fetch(url, {
        headers: {
          'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36'
        }
      });
      
      if (!response.ok) {
        throw new Error(`HTTP ${response.status}`);
      }
      
      const html = await response.text();
      
      // Extract metadata using regex patterns
      const titleMatch = html.match(/<title[^>]*>([^<]+)<\/title>/i);
      const descriptionMatch = html.match(/<meta[^>]*name="description"[^>]*content="([^"]+)"/i) ||
                              html.match(/<meta[^>]*property="og:description"[^>]*content="([^"]+)"/i);
      const imageMatch = html.match(/<meta[^>]*property="og:image"[^>]*content="([^"]+)"/i) ||
                        html.match(/<meta[^>]*name="twitter:image"[^>]*content="([^"]+)"/i);
      
      const metadata = {
        title: titleMatch ? titleMatch[1].trim() : null,
        description: descriptionMatch ? descriptionMatch[1].trim() : null,
        image: imageMatch ? imageMatch[1].trim() : null,
        url: url
      };
      
      console.log(`[URL-METADATA] Extracted metadata:`, metadata);
      res.json(metadata);
    } catch (error) {
      console.error("[URL-METADATA] Error:", error);
      res.status(500).json({ message: "Failed to fetch metadata" });
    }
  });

  // Short link redirect routes
  app.get("/link/:shortCode", async (req, res) => {
    try {
      const { shortCode } = req.params;
      
      // First check if it's a regular link with shortCode
      const link = await storage.getLinkByShortCode(shortCode);
      
      if (link) {
        // Increment click count
        await storage.incrementLinkClicks(link.id);
        // Redirect to original URL
        return res.redirect(302, link.originalUrl);
      }

      // If not found, check if it's a settings-based link (linkTitle slug)
      const allUsers = await storage.getAllUsers();
      for (const user of allUsers) {
        const settings = await storage.getUserSettings(user.id);
        if (settings?.linkTitle && settings?.linkUrl) {
          const slug = settings.linkTitle.toLowerCase().replace(/\s+/g, '-');
          if (slug === shortCode) {
            // Increment user visit count
            await storage.incrementUserVisitCount(user.id);
            return res.redirect(302, settings.linkUrl);
          }
        }
      }
      
      return res.status(404).json({ message: "Link not found" });
    } catch (error) {
      console.error("Link redirect error:", error);
      res.status(500).json({ message: "Internal server error" });
    }
  });

  // Deal routes
  app.get("/api/deals", async (req, res) => {
    try {
      const category = req.query.category as string;

      let deals;
      if (category && category !== "전체") {
        deals = await storage.getDealsByCategory(category);
      } else {
        deals = await storage.getDeals();
      }

      res.json(deals);
    } catch (error) {
      res.status(500).json({ message: "Internal server error" });
    }
  });

  app.post("/api/deals", async (req, res) => {
    try {
      const dealData = insertDealSchema.parse(req.body);
      const deal = await storage.createDeal(dealData);
      res.status(201).json(deal);
    } catch (error) {
      res.status(400).json({ message: "Invalid request data" });
    }
  });

  app.get("/api/deals/:id", async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const deal = await storage.getDeal(id);

      if (!deal) {
        return res.status(404).json({ message: "Deal not found" });
      }

      res.json(deal);
    } catch (error) {
      res.status(500).json({ message: "Internal server error" });
    }
  });

  // Chat routes
  app.get("/api/chats/:userId", async (req, res) => {
    try {
      const userId = parseInt(req.params.userId);

      // Return mock chat data for now
      const mockChats = [
        {
          id: 1,
          name: "마케팅랩 담당자",
          initials: "마케",
          lastMessage: "안녕하세요! 제안서 검토 완료되었습니다.",
          time: "오후 2:30",
          unread: true,
        },
        {
          id: 2,
          name: "디자인스튜디오",
          initials: "디자",
          lastMessage: "웹사이트 디자인 초안 전달드립니다.",
          time: "오후 1:15",
          unread: false,
        },
        {
          id: 3,
          name: "개발팀 리더",
          initials: "개발",
          lastMessage: "API 연동 작업이 완료되었습니다.",
          time: "오전 11:20",
          unread: false,
        },
      ];

      res.json(mockChats);
    } catch (error) {
      res.status(500).json({ message: "Internal server error" });
    }
  });

  // Settings routes
  app.get("/api/settings/:userId", async (req, res) => {
    try {
      const userId = parseInt(req.params.userId);
      let settings = await storage.getUserSettings(userId);

      // If no settings exist, create default settings
      if (!settings) {
        settings = await storage.createUserSettings({
          userId,
          notifications: true,
          marketing: false,
          darkMode: false,
          language: "한국어",
          timezone: "Seoul (UTC+9)",
          currency: "KRW (₩)",
          twoFactorEnabled: false,
        });
      }

      res.json(settings);
    } catch (error) {
      res.status(500).json({ message: "Internal server error" });
    }
  });

  app.put("/api/settings/:userId", async (req, res) => {
    try {
      const userId = parseInt(req.params.userId);
      const updates = req.body;

      let settings = await storage.updateUserSettings(userId, updates);
      
      // If no settings exist, create them with the updates
      if (!settings) {
        settings = await storage.createUserSettings({
          userId,
          notifications: true,
          marketing: false,
          darkMode: false,
          language: "한국어",
          timezone: "Seoul (UTC+9)",
          currency: "KRW (₩)",
          twoFactorEnabled: false,
          ...updates,
        });
      }

      res.json(settings);
    } catch (error) {
      res.status(500).json({ message: "Internal server error" });
    }
  });

  app.post("/api/settings/:userId", async (req, res) => {
    try {
      const userId = parseInt(req.params.userId);
      const updates = req.body;

      let settings = await storage.updateUserSettings(userId, updates);
      
      // If no settings exist, create them with the updates
      if (!settings) {
        settings = await storage.createUserSettings({
          userId,
          notifications: true,
          marketing: false,
          darkMode: false,
          language: "한국어",
          timezone: "Seoul (UTC+9)",
          currency: "KRW (₩)",
          twoFactorEnabled: false,
          ...updates,
        });
      }

      res.json(settings);
    } catch (error) {
      console.error('Settings update error:', error);
      res.status(500).json({ message: "Internal server error" });
    }
  });

  app.post("/api/settings", async (req, res) => {
    try {
      const settingsData = insertUserSettingsSchema.parse(req.body);
      const settings = await storage.createUserSettings(settingsData);
      res.status(201).json(settings);
    } catch (error) {
      res.status(400).json({ message: "Invalid request data" });
    }
  });

  // Media routes
  app.post("/api/media", async (req, res) => {
    try {
      const { userId, mediaUrl, mediaType, title, description } = req.body;
      
      if (!userId || !mediaUrl || !mediaType) {
        return res.status(400).json({ message: "Missing required fields" });
      }

      // Check if media entry already exists for this user and type
      const existingMedia = await storage.getMediaByUserAndType(userId, mediaType);
      
      if (existingMedia && existingMedia.length > 0) {
        // Update existing media
        const updatedMedia = await storage.updateMedia(existingMedia[0].id, {
          mediaUrl,
          title: title || null,
          description: description || null,
        });
        res.json(updatedMedia);
      } else {
        // Create new media entry
        const newMedia = await storage.createMedia({
          userId,
          mediaUrl,
          mediaType,
          title: title || null,
          description: description || null,
          fileName: null,
          originalName: null,
          mimeType: null,
          fileSize: null,
          filePath: null,
          isActive: true,
        });
        res.status(201).json(newMedia);
      }
    } catch (error) {
      console.error("Media creation error:", error);
      res.status(500).json({ message: "Internal server error" });
    }
  });

  // Media reordering endpoint
  app.put("/api/media/reorder", async (req, res) => {
    try {
      const { userId, mediaType, orderedIds } = req.body;
      
      if (!userId || !mediaType || !Array.isArray(orderedIds)) {
        return res.status(400).json({ message: "Missing required fields" });
      }

      const reorderedMedia = await storage.reorderUserMedia(userId, mediaType, orderedIds);
      res.json(reorderedMedia);
    } catch (error) {
      console.error("Media reordering error:", error);
      res.status(500).json({ message: "Internal server error" });
    }
  });

  // Get user media by type with proper ordering
  app.get("/api/media/:userId/:mediaType", async (req, res) => {
    try {
      const userId = parseInt(req.params.userId);
      const { mediaType } = req.params;
      
      const media = await storage.getMediaByUserAndType(userId, mediaType);
      res.json(media);
    } catch (error) {
      console.error("Media fetch error:", error);
      res.status(500).json({ message: "Internal server error" });
    }
  });

  // Delete media item
  app.delete("/api/media/:id", async (req, res) => {
    try {
      const mediaId = parseInt(req.params.id);
      const success = await storage.deleteMediaUpload(mediaId);
      
      if (!success) {
        return res.status(404).json({ message: "Media not found" });
      }
      
      res.json({ message: "Media deleted successfully" });
    } catch (error) {
      console.error("Media deletion error:", error);
      res.status(500).json({ message: "Internal server error" });
    }
  });

  // Subscription routes
  app.get("/api/subscription/:userId", async (req, res) => {
    try {
      const userId = parseInt(req.params.userId);
      const subscription = await storage.getUserSubscription(userId);

      if (!subscription) {
        return res.status(404).json({ message: "Subscription not found" });
      }

      res.json(subscription);
    } catch (error) {
      res.status(500).json({ message: "Internal server error" });
    }
  });

  app.put("/api/subscription/:userId", async (req, res) => {
    try {
      const userId = parseInt(req.params.userId);
      const updates = req.body;

      const subscription = await storage.updateSubscription(userId, updates);
      if (!subscription) {
        return res.status(404).json({ message: "Subscription not found" });
      }

      res.json(subscription);
    } catch (error) {
      res.status(500).json({ message: "Internal server error" });
    }
  });

  app.post("/api/subscription", async (req, res) => {
    try {
      const subscriptionData = insertSubscriptionSchema.parse(req.body);
      const subscription = await storage.createSubscription(subscriptionData);
      res.status(201).json(subscription);
    } catch (error) {
      res.status(400).json({ message: "Invalid request data" });
    }
  });

  // Profile routes - public access
  app.get("/api/profile/:username", async (req, res) => {
    try {
      const { username } = req.params;
      
      // Try to find user by custom URL first, then by username
      let user = await storage.getUserByCustomUrl(username);
      if (!user) {
        user = await storage.getUserByUsername(username);
      }
      
      if (!user) {
        return res.status(404).json({ message: "User not found" });
      }

      // Return public user data
      const publicUserData = {
        id: user.id,
        username: user.username,
        name: user.name,
        bio: user.bio,
        profileImageUrl: user.profileImageUrl,
        introVideoUrl: user.introVideoUrl,
        contentType: user.contentType,
        visitCount: user.visitCount,
        birthDate: user.birthDate,
        fitnessAwards: user.fitnessAwards,
        fitnessCertifications: user.fitnessCertifications,
        currentGym: user.currentGym,
        gymAddress: user.gymAddress,
        fitnessIntro: user.fitnessIntro
      };

      res.json(publicUserData);
    } catch (error) {
      console.error('Profile fetch error:', error);
      res.status(500).json({ message: "Internal server error" });
    }
  });

  // Public API routes (matching frontend expectations)
  app.get("/api/public/:identifier", async (req, res) => {
    try {
      const { identifier } = req.params;
      console.log(`[PUBLIC-API] Looking for identifier: ${identifier}`);
      
      // Get all users for debugging
      const allUsers = await storage.getAllUsers();
      console.log(`[PUBLIC-API] Total users in storage: ${allUsers.length}`);
      console.log(`[PUBLIC-API] Available usernames: ${allUsers.map(u => u.username).join(', ')}`);
      
      // Try to find user by custom URL first, then by username
      let user = await storage.getUserByCustomUrl(identifier);
      if (!user) {
        user = await storage.getUserByUsername(identifier);
      }
      
      if (!user) {
        console.log(`[PUBLIC-API] User not found for identifier: ${identifier}`);
        return res.status(404).json({ message: "User not found" });
      }

      console.log(`[PUBLIC-API] Found user: ${JSON.stringify({id: user.id, username: user.username, name: user.name})}`);

      // Return public user data including fitness information
      const publicUserData = {
        id: user.id,
        username: user.username,
        name: user.name,
        bio: user.bio,
        profileImageUrl: user.profileImageUrl,
        introVideoUrl: user.introVideoUrl,
        contentType: user.contentType,
        visitCount: user.visitCount,
        birthDate: user.birthDate,
        fitnessAwards: user.fitnessAwards,
        fitnessCertifications: user.fitnessCertifications,
        currentGym: user.currentGym,
        gymAddress: user.gymAddress,
        fitnessIntro: user.fitnessIntro
      };

      res.json(publicUserData);
    } catch (error) {
      console.error('Public profile fetch error:', error);
      res.status(500).json({ message: "Internal server error" });
    }
  });

  app.get("/api/public/:identifier/settings", async (req, res) => {
    try {
      const { identifier } = req.params;
      
      let user = await storage.getUserByCustomUrl(identifier);
      if (!user) {
        user = await storage.getUserByUsername(identifier);
      }
      
      if (!user) {
        return res.status(404).json({ message: "User not found" });
      }

      const settings = await storage.getUserSettings(user.id);
      
      // Return public settings data including display preferences
      const publicSettings = {
        contentType: settings?.contentType || 'links',
        customUrl: settings?.customUrl || user.username,
        showProfileImage: settings?.showProfileImage !== false,
        showBio: settings?.showBio !== false,
        showVisitCount: settings?.showVisitCount !== false,
        backgroundTheme: settings?.backgroundTheme || 'beige',
        layoutStyle: settings?.layoutStyle || 'centered'
      };

      res.json(publicSettings);
    } catch (error) {
      console.error('Public settings fetch error:', error);
      res.status(500).json({ message: "Internal server error" });
    }
  });

  app.get("/api/public/:identifier/links", async (req, res) => {
    try {
      const { identifier } = req.params;
      
      let user = await storage.getUserByCustomUrl(identifier);
      if (!user) {
        user = await storage.getUserByUsername(identifier);
      }
      
      if (!user) {
        return res.status(404).json({ message: "User not found" });
      }

      const links = await storage.getLinks(user.id);
      res.json(links);
    } catch (error) {
      console.error('Public links fetch error:', error);
      res.status(500).json({ message: "Internal server error" });
    }
  });

  app.get("/api/profile/:username/links", async (req, res) => {
    try {
      const { username } = req.params;
      
      let user = await storage.getUserByCustomUrl(username);
      if (!user) {
        user = await storage.getUserByUsername(username);
      }
      
      if (!user) {
        return res.status(404).json({ message: "User not found" });
      }

      const links = await storage.getLinks(user.id);
      res.json(links);
    } catch (error) {
      console.error('Profile links fetch error:', error);
      res.status(500).json({ message: "Internal server error" });
    }
  });

  app.get("/api/profile/:username/settings", async (req, res) => {
    try {
      const { username } = req.params;
      
      let user = await storage.getUserByCustomUrl(username);
      if (!user) {
        user = await storage.getUserByUsername(username);
      }
      
      if (!user) {
        return res.status(404).json({ message: "User not found" });
      }

      const settings = await storage.getUserSettings(user.id);
      
      // Return public settings data including display preferences
      const publicSettings = {
        contentType: settings?.contentType || 'links',
        customUrl: settings?.customUrl || user.username,
        showProfileImage: settings?.showProfileImage !== false,
        showBio: settings?.showBio !== false,
        showVisitCount: settings?.showVisitCount !== false,
        backgroundTheme: settings?.backgroundTheme || 'beige',
        layoutStyle: settings?.layoutStyle || 'centered'
      };

      res.json(publicSettings);
    } catch (error) {
      console.error('Profile settings fetch error:', error);
      res.status(500).json({ message: "Internal server error" });
    }
  });

  // Find ID route
  app.post("/api/auth/find-id", async (req, res) => {
    try {
      const { email } = z.object({ email: z.string().email() }).parse(req.body);
      
      const user = await storage.getUserByEmail(email);
      if (!user) {
        // Return success even if user doesn't exist for security
        return res.json({ message: "If an account with that email exists, ID information has been sent." });
      }

      // In a real application, you would send an email here
      // For demo purposes, we'll log the ID information and return it
      console.log(`ID found for ${email}: ${user.username}`);

      res.json({ 
        message: "ID information has been sent to your email.",
        userId: user.username
      });
    } catch (error) {
      console.error("Find ID error:", error);
      res.status(400).json({ message: "Invalid request" });
    }
  });

  // Forgot Password routes
  app.post("/api/auth/forgot-password", async (req, res) => {
    try {
      const { email } = z.object({ email: z.string().email() }).parse(req.body);
      
      const user = await storage.getUserByEmail(email);
      if (!user) {
        // Return success even if user doesn't exist for security
        return res.json({ message: "If an account with that email exists, a reset link has been sent." });
      }

      // Generate secure random token
      const token = randomBytes(32).toString('hex');
      const expiresAt = new Date(Date.now() + 30 * 60 * 1000); // 30 minutes

      // Store reset token
      await storage.createPasswordResetToken({
        userId: user.id,
        token,
        expiresAt,
        used: false,
      });

      // In a real application, you would send an email here
      // For demo purposes, we'll log the reset link
      console.log(`Password reset link: ${process.env.REPLIT_DEV_DOMAIN ? 
        `https://${process.env.REPLIT_DEV_DOMAIN}` : 
        'http://localhost:5000'}/reset-password/${token}`);

      res.json({ message: "If an account with that email exists, a reset link has been sent." });
    } catch (error) {
      console.error("Forgot password error:", error);
      res.status(400).json({ message: "Invalid request" });
    }
  });

  app.get("/api/auth/verify-reset-token/:token", async (req, res) => {
    try {
      const { token } = req.params;
      const resetToken = await storage.getPasswordResetToken(token);
      
      if (!resetToken) {
        return res.status(400).json({ message: "Invalid or expired token" });
      }

      res.json({ valid: true });
    } catch (error) {
      console.error("Token verification error:", error);
      res.status(500).json({ message: "Internal server error" });
    }
  });

  app.post("/api/auth/reset-password", async (req, res) => {
    try {
      const { password, token } = z.object({
        password: z.string().min(8),
        token: z.string()
      }).parse(req.body);

      const resetToken = await storage.getPasswordResetToken(token);
      if (!resetToken) {
        return res.status(400).json({ message: "Invalid or expired token" });
      }

      // Update user password
      await storage.updateUser(resetToken.userId, { password });
      
      // Mark token as used
      await storage.markTokenAsUsed(token);

      res.json({ message: "Password reset successful" });
    } catch (error) {
      console.error("Password reset error:", error);
      res.status(400).json({ message: "Invalid request" });
    }
  });

  // User routes
  app.get("/api/user/:id", async (req, res) => {
    try {
      const userId = parseInt(req.params.id);
      const user = await storage.getUser(userId);
      
      if (!user) {
        return res.status(404).json({ message: "User not found" });
      }
      
      res.json(user);
    } catch (error) {
      res.status(500).json({ message: "Internal server error" });
    }
  });

  app.put("/api/user/:id", async (req, res) => {
    try {
      const userId = parseInt(req.params.id);
      const updates = req.body;
      
      const user = await storage.updateUser(userId, updates);
      if (!user) {
        return res.status(404).json({ message: "User not found" });
      }
      
      res.json(user);
    } catch (error) {
      res.status(500).json({ message: "Internal server error" });
    }
  });

  // Media Upload routes
  app.post("/api/upload/:userId", upload.single('media'), handleMediaUpload);
  
  // New media upload endpoint for images page
  app.post("/api/media/upload", upload.single('file'), async (req, res) => {
    try {
      const file = req.file;
      const { userId, type, title, description } = req.body;
      
      console.log('Media upload request body:', req.body);
      console.log('File received:', file ? { name: file.filename, type: file.mimetype } : 'No file');
      
      if (!file) {
        return res.status(400).json({ error: 'No file uploaded' });
      }

      if (!userId || isNaN(parseInt(userId))) {
        console.log('Invalid userId received:', userId, 'Type:', typeof userId);
        return res.status(400).json({ error: 'Invalid user ID' });
      }

      const userIdInt = parseInt(userId);
      
      // Determine media type
      const mediaType = file.mimetype.startsWith('image/') ? 'image' : 'video';
      
      // Create media upload record
      const mediaUpload = await storage.createMediaUpload({
        userId: userIdInt,
        fileName: file.filename,
        originalName: file.originalname,
        mimeType: file.mimetype,
        fileSize: file.size,
        filePath: `/uploads/${file.filename}`,
        mediaType,
        title: title || null,
        description: description || null,
        isActive: true
      });

      res.json({
        success: true,
        mediaUpload,
        fileUrl: `/uploads/${file.filename}`,
        mediaType
      });
    } catch (error) {
      console.error('Media upload error:', error);
      res.status(500).json({ error: 'Upload failed' });
    }
  });
  
  app.get("/uploads/:filename", serveUploadedFile);
  
  app.get("/api/media/:userId", async (req, res) => {
    try {
      const userId = parseInt(req.params.userId);
      const mediaUploads = await storage.getUserMediaUploads(userId);
      res.json(mediaUploads);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch media uploads" });
    }
  });

  app.delete("/api/media/:id", async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const success = await storage.deleteMediaUpload(id);
      if (success) {
        res.json({ message: "Media deleted successfully" });
      } else {
        res.status(404).json({ message: "Media not found" });
      }
    } catch (error) {
      res.status(500).json({ message: "Failed to delete media" });
    }
  });

  // Media ordering routes
  app.put("/api/media/:mediaId/order", async (req, res) => {
    try {
      const mediaId = parseInt(req.params.mediaId);
      const { userId, newOrder } = req.body;

      const updatedMedia = await storage.updateMediaOrder(userId, mediaId, newOrder);
      if (!updatedMedia) {
        return res.status(404).json({ message: "Media not found or unauthorized" });
      }

      res.json(updatedMedia);
    } catch (error) {
      res.status(500).json({ message: "Internal server error" });
    }
  });

  app.put("/api/media/reorder", async (req, res) => {
    try {
      const { userId, mediaType, orderedIds } = req.body;

      const updatedMedia = await storage.reorderUserMedia(userId, mediaType, orderedIds);
      res.json(updatedMedia);
    } catch (error) {
      res.status(500).json({ message: "Internal server error" });
    }
  });

  // Get user media by type with proper ordering
  app.get("/api/media/:userId/:mediaType", async (req, res) => {
    try {
      const userId = parseInt(req.params.userId);
      const mediaType = req.params.mediaType;
      
      const media = await storage.getMediaByUserAndType(userId, mediaType);
      res.json(media);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch media" });
    }
  });

  // Link redirect with click tracking
  app.get("/l/:shortCode", async (req, res) => {
    try {
      const shortCode = req.params.shortCode;
      console.log(`[REDIRECT] Attempting to redirect shortCode: ${shortCode}`);
      
      const link = await storage.getLinkByShortCode(shortCode);
      
      if (!link) {
        console.log(`[REDIRECT] Link not found for shortCode: ${shortCode}`);
        return res.status(404).json({ message: "Link not found" });
      }

      if (!link.isActive) {
        console.log(`[REDIRECT] Link is inactive for shortCode: ${shortCode}`);
        return res.status(410).json({ message: "Link is inactive" });
      }

      console.log(`[REDIRECT] Found link: ${link.id} - ${link.title}, current clicks: ${link.clicks}`);

      // Get visitor information
      const visitorIp = req.ip || req.connection.remoteAddress || 'unknown';
      const userAgent = req.get('User-Agent') || '';
      const referrer = req.get('Referer') || '';
      
      // Check if visitor is the link owner (simple check by user session or IP)
      // For now, we'll assume it's not the owner unless specified
      const isOwner = req.query.owner === 'true';

      // Record visit
      try {
        await storage.recordLinkVisit({
          linkId: link.id,
          visitorIp,
          userAgent,
          referrer,
          isOwner
        });
        console.log(`[REDIRECT] Visit recorded for link ${link.id}`);
      } catch (visitError) {
        console.error(`[REDIRECT] Failed to record visit:`, visitError);
      }

      // Increment link clicks
      try {
        await storage.incrementLinkClicks(link.id);
        console.log(`[REDIRECT] Click count incremented for link ${link.id}`);
      } catch (clickError) {
        console.error(`[REDIRECT] Failed to increment clicks:`, clickError);
      }
      
      // Increment user visit count for link clicks
      try {
        await storage.incrementUserVisitCount(link.userId);
        console.log(`[REDIRECT] User visit count incremented for user ${link.userId}`);
      } catch (userError) {
        console.error(`[REDIRECT] Failed to increment user visits:`, userError);
      }

      // Redirect to the target URL
      console.log(`[REDIRECT] Redirecting to: ${link.originalUrl}`);
      res.redirect(302, link.originalUrl);
    } catch (error) {
      console.error("Link redirect error:", error);
      res.status(500).json({ message: "Internal server error" });
    }
  });

  // Visit count increment
  app.post("/api/visit/:userId", async (req, res) => {
    try {
      const userId = parseInt(req.params.userId);
      await storage.incrementUserVisitCount(userId);
      const user = await storage.getUser(userId);
      res.json({ visitCount: user?.visitCount || 0 });
    } catch (error) {
      res.status(500).json({ message: "Failed to increment visit count" });
    }
  });

  // Direct short URL redirect route - matches domain/{shortCode} pattern
  app.get("/:shortCode", async (req, res, next) => {
    try {
      const shortCode = req.params.shortCode;
      
      // Skip if it's a known route, file, or development artifact
      const knownRoutes = ['api', 'users', 'login', 'dashboard', 'links', 'images', 'videos', 'settings', 'uploads', 'oauth', 'link', 'l', 'test', 'demo_user'];
      const fileExtensions = ['.png', '.jpg', '.jpeg', '.gif', '.css', '.js', '.ico', '.svg'];
      const devArtifacts = ['@react-refresh', 'generated-icon'];
      
      if (knownRoutes.includes(shortCode) || 
          fileExtensions.some(ext => shortCode.includes(ext)) ||
          devArtifacts.some(artifact => shortCode.includes(artifact))) {
        return next(); // Let other routes handle it
      }
      
      console.log(`[SHORT-URL] Attempting to redirect shortCode: ${shortCode}`);
      
      const link = await storage.getLinkByShortCode(shortCode);
      
      if (!link) {
        console.log(`[SHORT-URL] Link not found for shortCode: ${shortCode}`);
        return next(); // Let other routes handle it (might be a username)
      }

      console.log(`[SHORT-URL] Found link: ${JSON.stringify(link)}`);

      // Record visit and increment click count for proper visit tracking
      try {
        // Record the visit with proper tracking data
        const clientIp = req.ip || req.connection?.remoteAddress || "127.0.0.1";
        const userAgent = req.headers['user-agent'] || null;
        const referrer = req.headers['referer'] || null;
        
        await storage.recordLinkVisit({
          linkId: link.id,
          visitorIp: clientIp,
          userAgent: userAgent,
          referrer: referrer,
          isOwner: false, // Assume external visit for short URL access
        });
        
        await storage.incrementLinkClicks(link.id);
        console.log(`[SHORT-URL] Visit recorded and click count incremented for link ${link.id}`);
      } catch (error) {
        console.error(`[SHORT-URL] Failed to record visit:`, error);
      }

      // Redirect to the target URL
      console.log(`[SHORT-URL] Redirecting to: ${link.originalUrl}`);
      res.redirect(302, link.originalUrl);
    } catch (error) {
      console.error("Short URL redirect error:", error);
      return next(); // Let other routes handle it
    }
  });

  // Note: Removed server-side /users/:identifier route to allow React routing

  // Public view API endpoints for custom URLs
  app.get("/api/public/:identifier", async (req, res) => {
    try {
      const { identifier } = req.params;
      
      // Debug storage state
      const allUsers = await storage.getAllUsers();
      console.log(`[PUBLIC-API] Total users in storage: ${allUsers.length}`);
      console.log(`[PUBLIC-API] Looking for identifier: ${identifier}`);
      console.log(`[PUBLIC-API] Available usernames: ${allUsers.map(u => u.username).join(', ')}`);
      
      // Try to find user by custom URL first, then by username
      let user = await storage.getUserByCustomUrl(identifier);
      if (!user) {
        user = await storage.getUserByUsername(identifier);
      }
      
      if (!user) {
        console.log(`[PUBLIC-API] User not found for identifier: ${identifier}`);
        return res.status(404).json({ message: "User not found" });
      }

      console.log(`[PUBLIC-API] Found user: ${JSON.stringify({ id: user.id, username: user.username, name: user.name })}`);

      // Return public user data
      const publicUser = {
        id: user.id,
        username: user.username,
        name: user.name,
        bio: user.bio,
        profileImageUrl: user.profileImageUrl,
        visitCount: user.visitCount,
        // Fitness-related fields
        birthDate: user.birthDate,
        fitnessAwards: user.fitnessAwards,
        fitnessCertifications: user.fitnessCertifications,
        currentGym: user.currentGym,
        gymAddress: user.gymAddress,
        fitnessIntro: user.fitnessIntro
      };

      // Increment visit count
      await storage.incrementUserVisitCount(user.id);

      res.json(publicUser);
    } catch (error) {
      console.error("Public view fetch error:", error);
      res.status(500).json({ message: "Internal server error" });
    }
  });

  app.get("/api/public/:identifier/links", async (req, res) => {
    try {
      const { identifier } = req.params;
      
      // Try to find user by custom URL first, then by username
      let user = await storage.getUserByCustomUrl(identifier);
      if (!user) {
        user = await storage.getUserByUsername(identifier);
      }
      
      if (!user) {
        return res.status(404).json({ message: "User not found" });
      }

      // Get user's active links
      const links = await storage.getLinks(user.id);
      const activeLinks = links.filter((link: any) => link.isActive);

      // Add visit statistics to each link
      const linksWithStats = await Promise.all(
        activeLinks.map(async (link: any) => {
          const stats = await storage.getLinkVisitStats(link.id);
          return {
            ...link,
            ownerVisits: stats.ownerVisits,
            externalVisits: stats.externalVisits,
            totalVisits: stats.totalVisits,
            dailyVisits: stats.dailyVisits,
            monthlyVisits: stats.monthlyVisits
          };
        })
      );

      res.json(linksWithStats);
    } catch (error) {
      console.error("Public links fetch error:", error);
      res.status(500).json({ message: "Internal server error" });
    }
  });

  app.get("/api/public/:identifier/settings", async (req, res) => {
    try {
      const { identifier } = req.params;
      
      // Try to find user by custom URL first, then by username
      let user = await storage.getUserByCustomUrl(identifier);
      if (!user) {
        user = await storage.getUserByUsername(identifier);
      }
      
      if (!user) {
        return res.status(404).json({ message: "User not found" });
      }

      // Get user's settings (only public information)
      const settings = await storage.getSettings(user.id);
      
      if (!settings) {
        return res.json({ contentType: 'links' });
      }

      // Return only public settings
      const publicSettings = {
        contentType: settings.contentType,
        customUrl: settings.customUrl
      };

      res.json(publicSettings);
    } catch (error) {
      console.error("Public settings fetch error:", error);
      res.status(500).json({ message: "Internal server error" });
    }
  });

  const httpServer = createServer(app);
  return httpServer;
}
