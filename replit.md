# AmuseFit - Business Networking Platform

## Overview

AmuseFit is a comprehensive business networking platform specifically designed for fitness professionals. It combines social media features with business management tools, offering vertical video/image sharing, dynamic content creation, innovative link management, and interactive features to support business growth.

## System Architecture

### Frontend Architecture
- **Framework**: React.js with TypeScript
- **Styling**: Tailwind CSS with custom brown theme
- **UI Components**: Shadcn/ui components with Radix UI primitives
- **State Management**: TanStack Query for server state, React hooks for local state
- **Routing**: Wouter for lightweight client-side routing
- **Build Tool**: Vite for fast development and optimized builds
- **Animation**: Framer Motion for interactive animations

### Backend Architecture
- **Runtime**: Node.js with Express.js server
- **Language**: TypeScript for type safety
- **Session Management**: Express sessions with CSRF protection
- **File Upload**: Multer/Busboy for media handling
- **Static Files**: Express static file serving

### Mobile-First Design
- Progressive Web App (PWA) architecture
- Touch-optimized interfaces
- Responsive design with mobile-first approach
- Overscroll behavior controls for native app feel

## Key Components

### Authentication System
- **Local Authentication**: Username/password with bcrypt hashing and session management
- **OAuth Integration**: Kakao social login with CSRF protection
- **Password Recovery**: Real email/SMS verification with 6-digit codes and secure token system
- **Multi-Provider Support**: Twilio SMS, SendGrid/NodeMailer/Resend email services
- **User Management**: Profile management with fitness-specific fields

### Content Management
- **Link Management**: URL shortening with analytics tracking
- **Media Upload**: Image and video upload with cropping capabilities
- **Profile Customization**: Custom URLs, themes, and layouts
- **Content Types**: Support for links, images, videos, and mixed content

### Real-time Features
- **Analytics Tracking**: Page views, link clicks, user interactions
- **Live Updates**: Real-time visit notifications and statistics
- **WebSocket Integration**: For real-time updates and notifications

### Business Features
- **Public Profiles**: Custom URL-based public profiles
- **Visit Tracking**: Comprehensive analytics and visitor insights
- **Content Scheduling**: Media organization with display order
- **Professional Tools**: Fitness-specific fields (certifications, gym info, etc.)

## Data Flow

### User Authentication Flow
1. User initiates login (local or OAuth)
2. Server validates credentials/OAuth tokens
3. Session established with CSRF protection
4. Client receives authentication state
5. Protected routes accessible

### Content Creation Flow
1. User uploads media/creates links
2. Server processes and stores content
3. Real-time updates pushed to client
4. Analytics tracking initiated
5. Public profile updated

### Public Profile Access
1. Visitor accesses custom URL
2. Server resolves username/custom URL
3. Profile data and content fetched
4. Visit tracked for analytics
5. Public view rendered

## External Dependencies

### Third-party Services
- **Kakao Developers**: OAuth authentication
- **Neon Database**: PostgreSQL hosting
- **Replit**: Development and deployment platform

### NPM Packages
- **Core**: React, TypeScript, Express, Drizzle ORM
- **UI**: Radix UI, Tailwind CSS, Framer Motion
- **Utils**: Zod validation, TanStack Query, Wouter routing
- **Media**: React Image Crop, Multer, Busboy

### Environment Variables
- `KAKAO_CLIENT_ID`: Kakao OAuth application ID
- `KAKAO_CLIENT_SECRET`: Kakao OAuth secret key
- `DATABASE_URL`: PostgreSQL connection string
- `SESSION_SECRET`: Session encryption key

## Deployment Strategy

### Development Environment
- **Platform**: Replit with auto-reload
- **Database**: Built-in PostgreSQL
- **Port**: 5000 with proxy configuration
- **Hot Reload**: Vite HMR with error overlay

### Production Deployment
- **Build Process**: Vite build + ESBuild server bundling
- **Static Assets**: Served from dist/public
- **Database**: Neon PostgreSQL with connection pooling
- **Domain**: Replit auto-generated or custom domain
- **SSL**: Automatic HTTPS with Let's Encrypt

### Database Schema
- **Users**: Authentication and profile data
- **Links**: URL management with analytics
- **Media**: File uploads with metadata
- **Analytics**: Visit tracking and statistics

## Changelog

- June 24, 2025. Initial setup
- June 24, 2025. Implemented complete password/ID recovery system with real SMS/email verification
- June 24, 2025. Fixed routing conflicts between password recovery and public profiles
- June 24, 2025. Added multi-provider authentication services (Twilio, SendGrid, NodeMailer, Resend)

## User Preferences

Preferred communication style: Simple, everyday language.