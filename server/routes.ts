import type { Express } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { insertUserSchema, insertLinkSchema, insertDealSchema, insertUserSettingsSchema, insertSubscriptionSchema } from "@shared/schema";
import { z } from "zod";

const loginSchema = z.object({
  email: z.string().email(),
  password: z.string().min(1),
});

export async function registerRoutes(app: Express): Promise<Server> {
  // Auth routes
  app.post("/api/auth/login", async (req, res) => {
    try {
      const { email, password } = loginSchema.parse(req.body);
      
      const user = await storage.getUserByEmail(email);
      if (!user || user.password !== password) {
        return res.status(401).json({ message: "Invalid credentials" });
      }

      // Create session (simplified)
      res.json({
        user: {
          id: user.id,
          username: user.username,
          email: user.email,
          name: user.name,
          company: user.company,
          role: user.role,
        }
      });
    } catch (error) {
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
        }
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
        return res.status(400).json({ error: "User already exists with this email" });
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
          role: newUser.role 
        } 
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

  const httpServer = createServer(app);
  return httpServer;
}
