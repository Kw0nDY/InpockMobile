import multer from 'multer';
import path from 'path';
import fs from 'fs';
import { Request, Response } from 'express';
import { storage } from './storage';

// Create uploads directory if it doesn't exist
const uploadsDir = path.join(process.cwd(), 'uploads');
if (!fs.existsSync(uploadsDir)) {
  fs.mkdirSync(uploadsDir, { recursive: true });
}

// Configure multer for file uploads
const multerStorage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, uploadsDir);
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    const extension = path.extname(file.originalname);
    cb(null, `${file.fieldname}-${uniqueSuffix}${extension}`);
  }
});

// File filter for images and videos
const fileFilter = (req: any, file: Express.Multer.File, cb: multer.FileFilterCallback) => {
  const allowedMimes = [
    'image/jpeg',
    'image/jpg', 
    'image/png',
    'image/gif',
    'image/webp',
    'video/mp4',
    'video/webm',
    'video/quicktime',
    'video/x-msvideo'
  ];
  
  if (allowedMimes.includes(file.mimetype)) {
    cb(null, true);
  } else {
    cb(new Error('Invalid file type. Only images (JPEG, PNG, GIF, WebP) and videos (MP4, WebM, MOV, AVI) are allowed.'));
  }
};

export const upload = multer({
  storage: multerStorage,
  fileFilter,
  limits: {
    fileSize: 50 * 1024 * 1024, // 50MB limit
  }
});

// Create a very permissive multer instance for profile uploads
export const flexibleUpload = multer({
  storage: multerStorage,
  fileFilter: (req: any, file: Express.Multer.File, cb: multer.FileFilterCallback) => {
    console.log('Flexible upload - accepting file:', file.fieldname, file.originalname, file.mimetype);
    cb(null, true); // Accept all files
  },
  limits: {
    fileSize: 50 * 1024 * 1024, // 50MB limit
  }
});

// Separate multer instance for profile uploads - allow any field name
export const profileUpload = multer({
  storage: multerStorage,
  fileFilter: (req: any, file: Express.Multer.File, cb: multer.FileFilterCallback) => {
    console.log('Profile upload - Field name:', file.fieldname);
    console.log('Profile upload - File type:', file.mimetype);
    
    // Only allow images for profile uploads
    const allowedMimes = [
      'image/jpeg',
      'image/jpg', 
      'image/png',
      'image/gif',
      'image/webp'
    ];
    
    if (allowedMimes.includes(file.mimetype)) {
      cb(null, true);
    } else {
      cb(new Error('Invalid file type. Only images (JPEG, PNG, GIF, WebP) are allowed for profile pictures.'));
    }
  },
  limits: {
    fileSize: 10 * 1024 * 1024, // 10MB limit for profile images
  }
});

// Upload handler for content media (dashboard content)
export const handleMediaUpload = async (req: Request, res: Response) => {
  try {
    const userId = parseInt(req.params.userId);
    const file = req.file;
    
    if (!file) {
      return res.status(400).json({ error: 'No file uploaded' });
    }

    if (!userId || isNaN(userId)) {
      return res.status(400).json({ error: 'Invalid user ID' });
    }

    // Determine media type
    const mediaType = file.mimetype.startsWith('image/') ? 'image' : 'video';
    
    // Create media upload record
    const mediaUpload = await storage.createMediaUpload({
      userId,
      fileName: file.filename,
      originalName: file.originalname,
      mimeType: file.mimetype,
      fileSize: file.size,
      filePath: `/uploads/${file.filename}`,
      mediaType,
      isActive: true
    });

    // This is content media upload - don't automatically update profile
    res.json({
      success: true,
      mediaUpload,
      fileUrl: `/uploads/${file.filename}`,
      mediaType
    });
  } catch (error) {
    console.error('Upload error:', error);
    res.status(500).json({ error: 'Upload failed' });
  }
};

// Upload handler specifically for profile images
export const handleProfileImageUpload = async (req: Request, res: Response) => {
  try {
    console.log('Profile upload request received');
    console.log('Files:', req.files);
    console.log('File:', req.file);
    
    // Handle both single file and files array
    const file = req.file || (Array.isArray(req.files) ? req.files[0] : null);
    
    if (!file) {
      console.log('No file found in request');
      return res.status(400).json({ error: 'No file uploaded' });
    }

    console.log('Processing file:', file.filename, file.mimetype);

    // Only allow images for profile upload
    if (!file.mimetype.startsWith('image/')) {
      return res.status(400).json({ error: 'Only image files are allowed for profile pictures' });
    }

    res.json({
      success: true,
      url: `/uploads/${file.filename}`,
      filename: file.filename
    });
  } catch (error) {
    console.error('Profile upload error:', error);
    res.status(500).json({ error: 'Upload failed' });
  }
};

// Serve uploaded files
export const serveUploadedFile = (req: Request, res: Response) => {
  const filename = req.params.filename;
  const filePath = path.join(uploadsDir, filename);
  
  if (!fs.existsSync(filePath)) {
    return res.status(404).json({ error: 'File not found' });
  }
  
  res.sendFile(filePath);
};