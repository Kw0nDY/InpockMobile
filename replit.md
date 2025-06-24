# AmuseFit - Fitness Business Networking Platform

## Overview

AmuseFit is a comprehensive fitness business networking platform built with modern web technologies. It serves as a specialized platform for fitness professionals to showcase their expertise, manage client relationships, and grow their business through vertical video content, image sharing, and intelligent link management.

## System Architecture

### Frontend Architecture
- **React 18** with TypeScript for type safety and modern development
- **Vite** as the build tool and development server
- **Tailwind CSS** with custom brown theme for styling
- **Wouter** for lightweight client-side routing
- **TanStack Query** for server state management and caching
- **Shadcn/ui** components for consistent UI design

### Backend Architecture
- **Express.js** server with TypeScript
- **RESTful API** design with comprehensive error handling
- **Session-based authentication** with Kakao OAuth integration
- **File upload handling** with multiple strategies (Multer, Busboy, Formidable)
- **Real-time features** capability with WebSocket support

### Database Design
- **PostgreSQL** as the primary database
- **Drizzle ORM** for type-safe database operations
- **Schema-first approach** with comprehensive migrations
- **Optimized for fitness business data** with specialized fields

## Key Components

### Authentication System
- **Dual authentication** supporting both local accounts and Kakao OAuth
- **Registration completion flow** for OAuth users with missing information
- **Flexible username matching** system for user-friendly login
- **Session management** with secure token handling
- **Password reset** functionality via email/SMS

### Content Management
- **Multi-media support** for images, videos, and links
- **Dynamic link generation** with custom short codes
- **Content styling options** (thumbnail, simple, card, background)
- **Image cropping** and optimization features
- **Real-time content updates** with automatic refresh

### User Profile System
- **Public profile pages** with customizable URLs
- **Fitness-specific fields** (certifications, gym info, awards)
- **Visit tracking** and analytics
- **Theme customization** with brown color scheme
- **Content type switching** (links, images, videos)

### Analytics & Tracking
- **Google Analytics 4** integration with custom dimensions
- **Real-time visit tracking** with IP-based analytics
- **Custom URL parameter tracking** for campaign analysis
- **Performance metrics** for links and content
- **User behavior analysis** with detailed insights

## Data Flow

### User Registration Flow
1. User accesses landing page
2. Chooses between local signup or Kakao login
3. OAuth users complete additional registration if needed
4. Profile setup with fitness-specific information
5. Dashboard access with full feature set

### Content Creation Flow
1. User uploads media or creates links
2. Content processing and optimization
3. Database storage with metadata
4. Real-time updates to public profile
5. Analytics tracking begins

### Public View Flow
1. Visitor accesses user's public profile
2. Visit tracking and analytics capture
3. Content served based on user preferences
4. Interactive features (sharing, liking)
5. Real-time updates without page refresh

## External Dependencies

### Authentication Services
- **Kakao OAuth 2.0** for social login
- Custom session management for security

### Database Services
- **Neon Serverless PostgreSQL** for production
- **@neondatabase/serverless** for optimized connections

### File Storage
- **Local file system** for development
- **Replit storage** for deployment
- **Image processing** with React Image Crop

### Analytics Services
- **Google Analytics 4** for user behavior tracking
- **Custom analytics** for business metrics

## Deployment Strategy

### Development Environment
- **Replit** as the primary development platform
- **Hot module replacement** for rapid development
- **TypeScript compilation** with strict type checking
- **Automatic database migrations** with Drizzle

### Production Deployment
- **Replit Autoscale** for production hosting
- **PostgreSQL** database with connection pooling
- **Static asset optimization** with Vite build
- **Environment variable management** for security

### Monitoring & Performance
- **Real-time error tracking** with custom logging
- **Performance monitoring** with analytics integration
- **Database query optimization** with Drizzle insights
- **User experience tracking** with custom metrics

## Changelog

```
Changelog:
- June 24, 2025. Initial setup
```

## User Preferences

```
Preferred communication style: Simple, everyday language.
```