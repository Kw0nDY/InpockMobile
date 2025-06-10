import type { Express } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { setupKakaoAuth } from "./kakao-auth";
import { upload, handleMediaUpload, serveUploadedFile } from "./upload";
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

      // Create demo user if it doesn't exist
      if (!user && email === "demo@amusefit.com") {
        console.log("Creating demo user for AmuseFit...");
        user = await storage.createUser({
          username: "demo_user",
          email: "demo@amusefit.com",
          password: "password123",
          name: "김철수",
          company: "AmuseFit Korea",
          role: "user",
        });
        console.log("Demo user created successfully");
      }

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
      const { username, email, password, name, company, role } = req.body;

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
      res.status(500).json({ error: "Failed to create user" });
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
      res.json(links);
    } catch (error) {
      res.status(500).json({ message: "Internal server error" });
    }
  });

  app.post("/api/links", async (req, res) => {
    try {
      const linkData = insertLinkSchema.parse(req.body);

      // Generate short code
      const shortCode = Math.random().toString(36).substring(2, 8);

      const link = await storage.createLink({
        ...linkData,
        shortCode,
      });

      res.status(201).json(link);
    } catch (error) {
      res.status(400).json({ message: "Invalid request data" });
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
      const deleted = await storage.deleteLink(id);

      if (!deleted) {
        return res.status(404).json({ message: "Link not found" });
      }

      res.status(204).send();
    } catch (error) {
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
      const settings = await storage.getUserSettings(userId);

      if (!settings) {
        return res.status(404).json({ message: "Settings not found" });
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

      const settings = await storage.updateUserSettings(userId, updates);
      if (!settings) {
        return res.status(404).json({ message: "Settings not found" });
      }

      res.json(settings);
    } catch (error) {
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

  const httpServer = createServer(app);
  return httpServer;
}
