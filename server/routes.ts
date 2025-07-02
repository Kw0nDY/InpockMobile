import type { Express } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { setupKakaoAuth } from "./kakao-auth";
import { handleProfileUploadDirect } from "./profile-upload";
import path from 'path';
import fs from 'fs';
import express from "express";
import {
  insertUserSchema,
  insertLinkSchema,
  insertUserSettingsSchema,
  insertSubscriptionSchema,
} from "@shared/schema";
import { z } from "zod";
import { randomBytes } from "crypto";
import { generateUniqueUsername, validateUsername, findUserByFlexibleUsername } from "./username-utils";
import { sendSmsCode, verifySmsCode } from "./sms-verification";
import { sendEmailCode, verifyEmailCode, getDevCode } from "./email-verification-simple";

const loginSchema = z.object({
  username: z.string().min(1),
  password: z.string().min(1),
});

export async function registerRoutes(app: Express): Promise<Server> {
  // Kakao OAuth 인증 설정
  setupKakaoAuth(app);

  // Create uploads directory if it doesn't exist
  const uploadsDir = path.join(process.cwd(), 'uploads');
  if (!fs.existsSync(uploadsDir)) {
    fs.mkdirSync(uploadsDir, { recursive: true });
  }

  // 디버깅용 OAuth 테스트 엔드포인트
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

  // 이메일 서비스 설정 확인 엔드포인트
  app.get("/test/email/config", (req, res) => {
    const emailStatus = { configured: true, services: ['Brevo'] };
    const config = {
      email: emailStatus,
      environment: process.env.NODE_ENV || 'development',
      timestamp: new Date().toISOString()
    };

    console.log("Email Service Configuration Check:", config);
    res.json(config);
  });

  // 데모 사용자 확인 및 재생성용 디버그 엔드포인트
  app.get("/api/debug/users", async (req, res) => {
    try {
      let demoUser = await storage.getUserByEmail("demo@amusefit.com");
      
      if (!demoUser) {
        // 데모 사용자가 존재하지 않으면 재생성
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

  // Username validation routes
  app.post("/api/auth/check-username", async (req, res) => {
    try {
      const { username, currentUserId } = z.object({ 
        username: z.string(),
        currentUserId: z.number().optional()
      }).parse(req.body);
      
      // Validate username format
      const validation = validateUsername(username);
      if (!validation.valid) {
        return res.json({ available: false, message: validation.message });
      }

      // Check if username exists (excluding current user)
      const existingUser = await storage.getUserByUsername(username);
      if (existingUser && existingUser.id !== currentUserId) {
        return res.json({ available: false, message: "이미 사용중인 닉네임입니다" });
      }

      res.json({ available: true, message: "사용 가능한 닉네임입니다" });
    } catch (error) {
      console.error("Username check error:", error);
      res.status(400).json({ available: false, message: "잘못된 요청입니다" });
    }
  });

  // Update username endpoint
  app.patch("/api/user/:userId/username", async (req, res) => {
    try {
      const { userId } = req.params;
      const { username } = z.object({ username: z.string() }).parse(req.body);
      
      // Validate username format
      const validation = validateUsername(username);
      if (!validation.valid) {
        return res.status(400).json({ message: validation.message });
      }

      // Check if username is taken by another user
      const existingUser = await storage.getUserByUsername(username);
      if (existingUser && existingUser.id !== parseInt(userId)) {
        return res.status(409).json({ message: "이미 사용중인 닉네임입니다" });
      }

      // Update the username
      const updatedUser = await storage.updateUser(parseInt(userId), { username });
      
      if (!updatedUser) {
        return res.status(404).json({ message: "사용자를 찾을 수 없습니다" });
      }
      
      res.json({ 
        message: "닉네임이 성공적으로 변경되었습니다",
        user: {
          id: updatedUser.id,
          username: updatedUser.username,
          email: updatedUser.email,
          name: updatedUser.name
        }
      });
    } catch (error) {
      console.error("Username update error:", error);
      res.status(500).json({ message: "닉네임 변경 중 오류가 발생했습니다" });
    }
  });

  // 인증 라우트
  app.post("/api/auth/login", async (req, res) => {
    try {
      console.log("Login attempt:", {
        body: req.body,
        hasUsername: !!req.body?.username,
        hasPassword: !!req.body?.password,
      });

      const { username, password } = loginSchema.parse(req.body);
      console.log("Schema validation passed for username:", username);

      let user = await findUserByFlexibleUsername(storage, username);
      console.log("User lookup result:", { found: !!user, username, foundUsername: user?.username });

      if (!user) {
        console.log("User not found for username:", username);
        return res.status(401).json({ message: "Invalid credentials" });
      }

      // bcrypt를 사용한 비밀번호 검증
      const bcrypt = await import("bcrypt");
      console.log("Comparing password:", password, "with hash:", user.password?.substring(0, 20) + "...");
      const isValidPassword = await bcrypt.compare(password, user.password);
      console.log("Password comparison result:", isValidPassword);
      
      if (!isValidPassword) {
        console.log("Password mismatch for user:", username);
        return res.status(401).json({ message: "Invalid credentials" });
      }

      console.log("Login successful for user:", username);

      // 세션 생성 (간소화)
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
      console.log("Registration request received");
      
      // Input validation
      if (!req.body || typeof req.body !== 'object') {
        return res.status(400).json({ message: "잘못된 요청 데이터입니다" });
      }
      
      // Required fields validation with detailed checks
      const requiredFields = ['username', 'email', 'password', 'name', 'phone', 'birthDate'];
      const missingFields = requiredFields.filter(field => {
        const value = req.body[field];
        return !value || typeof value !== 'string' || value.trim() === '';
      });
      
      if (missingFields.length > 0) {
        return res.status(400).json({ 
          message: `필수 항목이 누락되었습니다: ${missingFields.join(', ')}` 
        });
      }
      
      // Email format validation
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(req.body.email)) {
        return res.status(400).json({ message: "올바른 이메일 형식이 아닙니다" });
      }
      
      // Enhanced password security validation
      const password = req.body.password;
      if (password.length < 8) {
        return res.status(400).json({ message: "비밀번호는 8자 이상이어야 합니다" });
      }
      
      // Password complexity check (alphanumeric required)
      const passwordRegex = /^(?=.*[a-zA-Z])(?=.*\d)/;
      if (!passwordRegex.test(password)) {
        return res.status(400).json({ message: "비밀번호는 영문과 숫자를 포함해야 합니다" });
      }
      
      // Check for common weak passwords
      const weakPasswords = ['password', '12345678', 'qwerty123', 'admin123'];
      if (weakPasswords.includes(password.toLowerCase())) {
        return res.status(400).json({ message: "더 안전한 비밀번호를 사용해주세요" });
      }
      
      // Enhanced phone format validation (Korean phone numbers)
      const phoneRegex = /^(01[016789])-?(\d{3,4})-?(\d{4})$/;
      const normalizedPhone = req.body.phone.replace(/[-\s]/g, '');
      if (!phoneRegex.test(normalizedPhone)) {
        return res.status(400).json({ message: "올바른 전화번호 형식이 아닙니다 (예: 010-1234-5678)" });
      }

      // Validate username format
      const usernameValidation = validateUsername(req.body.username);
      if (!usernameValidation.valid) {
        return res.status(400).json({ message: usernameValidation.message });
      }

      // Check if user exists by email
      const existingUserByEmail = await storage.getUserByEmail(req.body.email);
      if (existingUserByEmail) {
        return res.status(409).json({ message: "이미 존재하는 이메일입니다" });
      }

      // Check if username is taken
      const existingUserByUsername = await storage.getUserByUsername(req.body.username);
      if (existingUserByUsername) {
        return res.status(409).json({ message: "이미 사용중인 닉네임입니다" });
      }

      // Create user with enhanced data sanitization
      const userData = {
        username: req.body.username.trim().toLowerCase(),
        email: req.body.email.trim().toLowerCase(),
        password: req.body.password, // Will be hashed in storage layer
        name: req.body.name.trim(),
        phone: normalizedPhone,
        birthDate: req.body.birthDate.trim(),
        currentGym: req.body.currentGym ? req.body.currentGym.trim() : null,
        gymPosition: req.body.gymPosition ? req.body.gymPosition.trim() : null,
        // Set defaults for optional fields
        company: req.body.currentGym ? req.body.currentGym.trim() : null, // Legacy field
        role: req.body.gymPosition ? req.body.gymPosition.trim() : "user", // Legacy field
      };

      const user = await storage.createUser(userData);

      if (!user || !user.id) {
        throw new Error("사용자 생성에 실패했습니다");
      }

      // Return safe user data (exclude sensitive information)
      res.status(201).json({
        user: {
          id: user.id,
          username: user.username,
          email: user.email,
          name: user.name,
          phone: user.phone,
          birthDate: user.birthDate,
          currentGym: user.currentGym,
          gymPosition: user.gymPosition,
        },
        message: "회원가입이 완료되었습니다"
      });
    } catch (error: any) {
      console.error("Registration error:", error);

      // Handle specific error types
      if (error.message?.includes('duplicate key') || error.message?.includes('already exists')) {
        if (error.message.includes('email')) {
          return res.status(409).json({ message: "이미 사용중인 이메일입니다" });
        }
        if (error.message.includes('username')) {
          return res.status(409).json({ message: "이미 사용중인 닉네임입니다" });
        }
        return res.status(409).json({ message: "이미 존재하는 계정 정보입니다" });
      }

      if (error.name === "ZodError") {
        return res.status(400).json({
          message: "입력 데이터 검증에 실패했습니다",
          details: error.errors?.map((e: any) => e.message).join(', ') || "알 수 없는 검증 오류"
        });
      }

      // Database connection errors
      if (error.message?.includes('connection') || error.message?.includes('timeout')) {
        return res.status(503).json({ message: "데이터베이스 연결 오류입니다. 잠시 후 다시 시도해주세요" });
      }

      // Generic error handling
      const statusCode = error.statusCode || 500;
      const message = error.message || "회원가입 처리 중 오류가 발생했습니다";
      
      res.status(statusCode).json({ 
        message,
        ...(process.env.NODE_ENV === 'development' && { debug: error.stack })
      });
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
    } catch (error: any) {
      console.error("Signup error:", error);
      console.error("Error stack:", error?.stack);
      console.error("Request body:", req.body);
      res.status(500).json({ 
        error: "Failed to create user",
        details: error?.message || "Unknown error"
      });
    }
  });

  // Check username availability (for signup)
  app.post("/api/auth/check-username", async (req, res) => {
    try {
      const { username } = req.body;
      
      if (!username) {
        return res.status(400).json({ message: "닉네임을 입력해주세요." });
      }

      const existingUser = await storage.getUserByUsername(username);
      res.json({ 
        available: !existingUser,
        message: existingUser ? "이미 사용중인 닉네임입니다" : "사용 가능한 닉네임입니다"
      });
    } catch (error) {
      console.error("Username check error:", error);
      res.status(500).json({ message: "서버 오류가 발생했습니다." });
    }
  });

  // Check if user needs to complete registration
  app.get("/api/auth/check-registration/:userId", async (req, res) => {
    try {
      const { userId } = req.params;
      const user = await storage.getUser(parseInt(userId));
      
      if (!user) {
        return res.status(404).json({ message: "사용자를 찾을 수 없습니다." });
      }

      const isComplete = !!(user.username && user.phone && user.name);
      const missingFields = [];
      
      if (!user.username) missingFields.push('username');
      if (!user.phone) missingFields.push('phone');
      if (!user.name) missingFields.push('name');

      res.json({
        isComplete,
        missingFields,
        user: {
          id: user.id,
          username: user.username,
          email: user.email,
          name: user.name,
          phone: user.phone
        }
      });
    } catch (error) {
      console.error("Registration check error:", error);
      res.status(500).json({ message: "서버 오류가 발생했습니다." });
    }
  });

  // 닉네임 중복 확인 엔드포인트 (완료 페이지용)
  app.post("/api/auth/check-nickname", async (req, res) => {
    try {
      const { nickname } = req.body;
      
      if (!nickname || nickname.length < 2) {
        return res.status(400).json({ 
          available: false, 
          message: "닉네임은 2자 이상이어야 합니다" 
        });
      }

      const existingUser = await storage.getUserByUsername(nickname);
      const available = !existingUser;
      
      res.json({ 
        available,
        message: available ? "사용 가능한 닉네임입니다" : "이미 사용 중인 닉네임입니다"
      });
    } catch (error) {
      console.error("Nickname check error:", error);
      res.status(500).json({ message: "Server error" });
    }
  });

  // 회원가입 완료 엔드포인트
  app.post("/api/auth/complete-registration", async (req, res) => {
    try {
      const { nickname, name, phone } = req.body;
      
      // 세션에서 사용자 ID 가져오기
      const userId = req.session.userId;
      if (!userId) {
        return res.status(401).json({ message: "로그인이 필요합니다" });
      }

      // 입력 데이터 검증
      if (!nickname || nickname.length < 2) {
        return res.status(400).json({ message: "닉네임은 2자 이상이어야 합니다" });
      }
      
      if (!name || name.trim().length < 2) {
        return res.status(400).json({ message: "이름은 2자 이상이어야 합니다" });
      }
      
      const phoneRegex = /^01[0-9]-?[0-9]{4}-?[0-9]{4}$/;
      if (!phone || !phoneRegex.test(phone.replace(/-/g, ""))) {
        return res.status(400).json({ message: "올바른 전화번호 형식이 아닙니다" });
      }

      // 닉네임 중복 확인 (현재 사용자의 닉네임이 아닌 경우만)
      const currentUser = await storage.getUser(userId);
      if (!currentUser) {
        return res.status(404).json({ message: "사용자를 찾을 수 없습니다" });
      }
      
      if (nickname !== currentUser.username) {
        const existingUser = await storage.getUserByUsername(nickname);
        if (existingUser) {
          return res.status(400).json({ message: "이미 사용 중인 닉네임입니다" });
        }
      }

      // 사용자 정보 업데이트
      const updatedUser = await storage.updateUser(userId, {
        username: nickname,
        name: name.trim(),
        phone: phone.replace(/-/g, "")
      });

      if (!updatedUser) {
        return res.status(500).json({ message: "사용자 정보 업데이트에 실패했습니다" });
      }

      res.json({ 
        message: "회원가입이 완료되었습니다",
        user: {
          id: updatedUser.id,
          username: updatedUser.username,
          email: updatedUser.email,
          name: updatedUser.name,
          phone: updatedUser.phone,
          role: updatedUser.role
        }
      });
    } catch (error) {
      console.error("Complete registration error:", error);
      res.status(500).json({ message: "회원가입 완료 중 오류가 발생했습니다" });
    }
  });

  // 현재 로그인된 사용자 정보 엔드포인트
  app.get("/api/auth/me", async (req, res) => {
    try {
      const userId = req.session.userId;
      if (!userId) {
        return res.status(401).json({ message: "로그인이 필요합니다" });
      }

      const user = await storage.getUser(userId);
      if (!user) {
        return res.status(404).json({ message: "사용자를 찾을 수 없습니다" });
      }

      res.json({
        id: user.id,
        username: user.username,
        email: user.email,
        name: user.name,
        phone: user.phone,
        role: user.role,
        profileImageUrl: user.profileImageUrl,
        company: user.company
      });
    } catch (error) {
      console.error("Get current user error:", error);
      res.status(500).json({ message: "Server error" });
    }
  });

  // SMS 인증번호 발송 API
  app.post("/api/auth/send-sms-code", async (req, res) => {
    try {
      let { phone, purpose } = req.body;
      
      if (!phone || !purpose) {
        return res.status(400).json({ message: "전화번호와 목적을 입력해주세요" });
      }

      if (!['find_id', 'reset_password'].includes(purpose)) {
        return res.status(400).json({ message: "올바르지 않은 목적입니다" });
      }

      // 전화번호 정규화 (하이픈, 공백 제거)
      const normalizedPhone = phone.replace(/[-\s]/g, '');
      
      // 전화번호 형식 검증 (010-1234-5678 → 01012345678)
      const phoneRegex = /^010\d{8}$/;
      if (!phoneRegex.test(normalizedPhone)) {
        return res.status(400).json({ message: "올바른 전화번호 형식이 아닙니다" });
      }

      // 사용자 존재 확인 - 정규화된 번호와 하이픈 포함된 번호 모두 확인
      let user = await storage.getUserByPhone(normalizedPhone);
      if (!user) {
        // 하이픈 포함된 형식으로도 검색 (데이터베이스에 하이픈 포함 저장된 경우)
        const phoneWithHyphen = normalizedPhone.replace(/^(\d{3})(\d{4})(\d{4})$/, '$1-$2-$3');
        user = await storage.getUserByPhone(phoneWithHyphen);
      }
      
      if (!user && purpose === 'find_id') {
        return res.status(404).json({ message: "등록된 전화번호를 찾을 수 없습니다" });
      }

      if (!user && purpose === 'reset_password') {
        return res.status(404).json({ message: "등록된 전화번호를 찾을 수 없습니다" });
      }

      // SMS 발송 시에는 정규화된 번호 사용
      phone = normalizedPhone;

      const result = await sendSmsCode(phone, purpose);
      if (result.success) {
        res.json({ message: result.message });
      } else {
        res.status(500).json({ message: result.message });
      }
    } catch (error) {
      console.error("SMS 발송 오류:", error);
      res.status(500).json({ message: "인증번호 발송 중 오류가 발생했습니다" });
    }
  });

  // SMS 인증번호 확인 API
  app.post("/api/auth/verify-sms-code", async (req, res) => {
    try {
      const { phone, code, purpose } = req.body;
      
      if (!phone || !code || !purpose) {
        return res.status(400).json({ message: "모든 필드를 입력해주세요" });
      }

      const result = await verifySmsCode(phone, code, purpose);
      
      if (result.verified) {
        // 아이디 찾기인 경우 사용자명 반환
        if (purpose === 'find_id') {
          const user = await storage.getUserByPhone(phone);
          if (user) {
            res.json({ 
              verified: true, 
              message: result.message,
              data: { userId: user.username }
            });
          } else {
            res.status(404).json({ verified: false, message: "사용자를 찾을 수 없습니다" });
          }
        } else {
          res.json({ verified: true, message: result.message });
        }
      } else {
        res.status(400).json({ verified: false, message: result.message });
      }
    } catch (error) {
      console.error("SMS 인증 확인 오류:", error);
      res.status(500).json({ message: "인증 확인 중 오류가 발생했습니다" });
    }
  });

  // 이메일 인증번호 발송 API
  app.post("/api/auth/send-email-code", async (req, res) => {
    try {
      const { email, purpose } = req.body;
      
      if (!email || !purpose) {
        return res.status(400).json({ message: "이메일과 목적을 입력해주세요" });
      }

      if (purpose !== 'reset_password') {
        return res.status(400).json({ message: "올바르지 않은 목적입니다" });
      }

      // 이메일 형식 검증
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(email)) {
        return res.status(400).json({ message: "올바른 이메일 형식이 아닙니다" });
      }

      // 사용자 존재 확인
      const user = await storage.getUserByEmail(email);
      if (!user) {
        return res.status(404).json({ message: "등록된 이메일을 찾을 수 없습니다" });
      }

      const result = await sendEmailCode(email, purpose);
      if (result.success) {
        res.json({ message: result.message });
      } else {
        res.status(500).json({ message: result.message });
      }
    } catch (error) {
      console.error("이메일 발송 오류:", error);
      res.status(500).json({ message: "인증번호 발송 중 오류가 발생했습니다" });
    }
  });

  // 이메일 인증번호 확인 API
  app.post("/api/auth/verify-email-code", async (req, res) => {
    try {
      const { email, code, purpose } = req.body;
      
      if (!email || !code || !purpose) {
        return res.status(400).json({ message: "모든 필드를 입력해주세요" });
      }

      const result = await verifyEmailCode(email, code, purpose);
      
      if (result.verified) {
        res.json({ verified: true, message: result.message });
      } else {
        res.status(400).json({ verified: false, message: result.message });
      }
    } catch (error) {
      console.error("이메일 인증 확인 오류:", error);
      res.status(500).json({ message: "인증 확인 중 오류가 발생했습니다" });
    }
  });

  // 개발 환경용 인증번호 확인 API (개발 모드에서만 사용)
  app.get("/api/auth/dev-get-code", async (req, res) => {
    if (process.env.NODE_ENV === 'production') {
      return res.status(403).json({ message: "Production에서는 사용할 수 없습니다" });
    }

    try {
      const { email, purpose } = req.query;
      
      if (!email || !purpose) {
        return res.status(400).json({ message: "이메일과 목적을 입력해주세요" });
      }

      const result = getDevCode(email as string, purpose as string);
      res.json(result);
    } catch (error) {
      console.error("개발 코드 조회 오류:", error);
      res.status(500).json({ message: "코드 조회 중 오류가 발생했습니다" });
    }
  });

  // 비밀번호 재설정 (새 비밀번호 설정)
  app.post("/api/auth/reset-password", async (req, res) => {
    try {
      const { email, newPassword } = req.body;
      
      if (!email || !newPassword) {
        return res.status(400).json({ message: '이메일과 새 비밀번호가 필요합니다' });
      }

      if (newPassword.length < 6) {
        return res.status(400).json({ message: '비밀번호는 6자리 이상이어야 합니다' });
      }
      
      // 사용자 확인
      const user = await storage.getUserByEmail(email);
      if (!user) {
        return res.status(404).json({ message: '사용자를 찾을 수 없습니다' });
      }
      
      // 비밀번호 해시화
      const bcrypt = await import("bcrypt");
      const hashedPassword = await bcrypt.hash(newPassword, 10);
      
      // 비밀번호 업데이트
      await storage.updateUser(user.id, { password: hashedPassword });
      
      console.log(`✅ 비밀번호 재설정 완료: ${email}`);
      res.json({ message: '비밀번호가 성공적으로 변경되었습니다' });
    } catch (error) {
      console.error('비밀번호 재설정 오류:', error);
      res.status(500).json({ message: '비밀번호 재설정에 실패했습니다' });
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

      // Password reset functionality removed for this version

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

      const stats = {
        connections: 127,
        deals: 0, // Deals functionality removed
        revenue: 892,
        totalClicks: links.reduce((sum, link) => sum + (link.clicks || 0), 0),
      };

      res.json({ stats, activities: [] }); // Activities functionality removed
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

  // Cache for statistics (expires after 30 seconds)
  const statsCache = new Map<string, { data: any; timestamp: number }>();
  const CACHE_DURATION = 30000; // 30 seconds

  // Individual link statistics with caching
  app.get("/api/links/:id/stats", async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const cacheKey = `link-stats-${id}`;
      const now = Date.now();
      
      // Check cache first
      const cached = statsCache.get(cacheKey);
      if (cached && (now - cached.timestamp) < CACHE_DURATION) {
        res.json(cached.data);
        return;
      }
      
      const stats = await storage.getLinkVisitStats(id);
      
      // Store in cache
      statsCache.set(cacheKey, { data: stats, timestamp: now });
      
      res.json(stats);
    } catch (error) {
      console.error("[LINK-STATS] Individual stats error:", error);
      res.status(500).json({ message: "Internal server error" });
    }
  });

  // User's overall link visit statistics with caching
  app.get("/api/user/:userId/link-stats", async (req, res) => {
    try {
      const userId = parseInt(req.params.userId);
      const cacheKey = `user-stats-${userId}`;
      const now = Date.now();
      
      // Check cache first
      const cached = statsCache.get(cacheKey);
      if (cached && (now - cached.timestamp) < CACHE_DURATION) {
        res.json(cached.data);
        return;
      }
      
      const stats = await storage.getUserLinkStats(userId);
      
      // Store in cache
      statsCache.set(cacheKey, { data: stats, timestamp: now });
      
      res.json(stats);
    } catch (error) {
      console.error("[LINK-STATS] Error:", error);
      res.status(500).json({ message: "Internal server error" });
    }
  });

  // Notifications API endpoints
  app.get("/api/notifications/:userId", async (req, res) => {
    try {
      const userId = parseInt(req.params.userId);
      const notifications = await storage.getUserNotifications(userId);
      res.json(notifications);
    } catch (error) {
      console.error("[NOTIFICATIONS] Error fetching notifications:", error);
      res.status(500).json({ message: "Internal server error" });
    }
  });

  app.get("/api/notifications/:userId/unread-count", async (req, res) => {
    try {
      const userId = parseInt(req.params.userId);
      const count = await storage.getUnreadNotificationCount(userId);
      res.json({ count });
    } catch (error) {
      console.error("[NOTIFICATIONS] Error fetching unread count:", error);
      res.status(500).json({ message: "Internal server error" });
    }
  });

  app.post("/api/notifications/:id/read", async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      await storage.markNotificationAsRead(id);
      res.json({ success: true });
    } catch (error) {
      console.error("[NOTIFICATIONS] Error marking notification as read:", error);
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

  // Business Dashboard API Routes
  app.get("/api/dashboard/stats/:userId", async (req, res) => {
    try {
      const userId = parseInt(req.params.userId);
      
      // Get real-time business stats
      const activeUsers = await storage.getActiveUsersCount();
      const userDeals = await storage.getUserDealsCount(userId);
      const profileVisits = await storage.getUserProfileVisitCount(userId);
      
      res.json({
        stats: {
          connections: activeUsers,
          deals: userDeals,
          visits: profileVisits
        },
        lastUpdated: new Date().toISOString()
      });
    } catch (error) {
      console.error("Dashboard stats error:", error);
      res.status(500).json({ message: "Failed to fetch dashboard stats" });
    }
  });

  // Notification API Routes
  app.get("/api/notifications/:userId", async (req, res) => {
    try {
      const userId = parseInt(req.params.userId);
      const notifications = await storage.getUserNotifications(userId);
      res.json(notifications);
    } catch (error) {
      console.error("Notifications fetch error:", error);
      res.status(500).json({ message: "Failed to fetch notifications" });
    }
  });

  app.get("/api/notifications/:userId/unread-count", async (req, res) => {
    try {
      const userId = parseInt(req.params.userId);
      const count = await storage.getUnreadNotificationCount(userId);
      res.json({ count });
    } catch (error) {
      console.error("Unread count error:", error);
      res.status(500).json({ message: "Failed to get unread count" });
    }
  });

  app.post("/api/notifications/:notificationId/read", async (req, res) => {
    try {
      const notificationId = parseInt(req.params.notificationId);
      await storage.markNotificationAsRead(notificationId);
      res.json({ message: "Notification marked as read" });
    } catch (error) {
      console.error("Mark notification read error:", error);
      res.status(500).json({ message: "Failed to mark notification as read" });
    }
  });

  // Deal routes
  app.get("/api/deals", async (req, res) => {
    try {
      const category = req.query.category as string;

      const deals: any[] = []; // Deals functionality removed

      res.json(deals);
    } catch (error) {
      res.status(500).json({ message: "Internal server error" });
    }
  });

  app.post("/api/deals", async (req, res) => {
    res.status(501).json({ message: "Deals functionality not implemented" });
  });

  app.get("/api/deals/:id", async (req, res) => {
    res.status(404).json({ message: "Deal not found" });
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

      // Media reordering functionality simplified
      const currentMedia = await storage.getMediaByUserAndType(userId, mediaType);
      const reorderedMedia = currentMedia;
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
  app.post("/api/upload/:userId", handleProfileUploadDirect);
  
  // Media upload endpoint using Busboy
  app.post("/api/media/upload", handleProfileUploadDirect);
  
  // Serve uploaded files
  app.use('/uploads', express.static(path.join(process.cwd(), 'uploads')));
  
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

      await storage.updateMediaOrder(userId, [mediaId]);
      const updatedMedia = await storage.getMediaById(mediaId);
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

      // Create notification for profile visit (only if not the owner)
      const userAgent = req.headers['user-agent'] || 'Unknown';
      const visitorIP = req.ip || req.connection.remoteAddress || 'Unknown';
      
      // Create visit notification
      try {
        console.log(`[NOTIFICATION] Creating visit notification for user ${user.id}`);
        const notification = await storage.createNotification({
          userId: user.id,
          type: 'profile_visit',
          title: '새로운 프로필 방문',
          message: `누군가 당신의 프로필을 방문했습니다.`,
          data: JSON.stringify({
            visitorIP,
            userAgent,
            visitedAt: new Date().toISOString(),
            profileType: 'public'
          })
        });
        console.log(`[NOTIFICATION] Successfully created notification:`, notification);
      } catch (notificationError) {
        console.error('[NOTIFICATION] Failed to create visit notification:', notificationError);
      }

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

  // 공개 프로필 페이지 (가장 마지막에 위치, httpServer 생성 전에)
  app.get("/:customUrl", async (req, res, next) => {
    try {
      const { customUrl } = req.params;
      
      console.log(`Public profile request for: ${customUrl}`);
      console.log(`Request IP: ${req.ip}`);
      console.log(`User Agent: ${req.get('User-Agent')}`);
      
      // 시스템 라우트들은 건너뛰기 - Vite 개발 서버 요청도 포함
      if (['api', 'assets', 'static', 'favicon.ico', '_next', 'webpack-hmr', 'src', 'node_modules'].includes(customUrl) || 
          customUrl.startsWith('@') || customUrl.includes('.') || customUrl.startsWith('__vite')) {
        return next();
      }

      const user = await storage.getUserByCustomUrl(customUrl);
      if (!user) {
        console.log(`User not found for customUrl: ${customUrl}`);
        return next(); // Let Vite handle non-profile routes
      }

      console.log(`Found user: ${user.username} (ID: ${user.id})`);

      // 방문 기록
      try {
        const visitorIp = req.ip || req.connection?.remoteAddress || req.socket?.remoteAddress || 'unknown';
        const userAgent = req.get('User-Agent') || '';
        const referer = req.get('Referer') || '';
        
        console.log(`Recording visit from IP: ${visitorIp}`);
        
        await storage.recordProfileVisit(user.id, visitorIp, userAgent, referer);
        console.log(`Profile visit recorded for user ${user.id}`);
        
        // 사용자의 방문 카운트 증가
        await storage.incrementUserVisitCount(user.id);
        console.log(`Visit count incremented for user ${user.id}`);
      } catch (visitError) {
        console.error("Failed to record profile visit:", visitError);
        // 방문 기록 실패해도 프로필은 보여줌
      }

      // 사용자 설정 가져오기
      const settings = await storage.getUserSettings(user.id);
      const links = await storage.getLinks(user.id);
      const mediaUploads = await storage.getUserMediaUploads(user.id);

      // HTML 응답
      res.send(`
        <!DOCTYPE html>
        <html lang="ko">
        <head>
          <meta charset="UTF-8">
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
          <title>${user.name || user.username} - AmuseFit</title>
          <meta name="description" content="${user.bio || `${user.name || user.username}의 프로필`}">
          <meta property="og:title" content="${user.name || user.username} - AmuseFit">
          <meta property="og:description" content="${user.bio || `${user.name || user.username}의 프로필`}">
          ${user.profileImage ? `<meta property="og:image" content="${user.profileImage}">` : ''}
          <meta property="og:type" content="profile">
          <link rel="stylesheet" href="/assets/index.css">
        </head>
        <body>
          <div id="root"></div>
          <script>
            window.__INITIAL_DATA__ = {
              user: ${JSON.stringify(user)},
              settings: ${JSON.stringify(settings)},
              links: ${JSON.stringify(links)},
              mediaUploads: ${JSON.stringify(mediaUploads)},
              isPublicView: true
            };
          </script>
          <script type="module" src="/assets/index.js"></script>
        </body>
        </html>
      `);
    } catch (error) {
      console.error("Error serving public profile:", error);
      res.status(500).send("Internal Server Error");
    }
  });

  const httpServer = createServer(app);
  return httpServer;
}
