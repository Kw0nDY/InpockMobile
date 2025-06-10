import { Request, Response } from 'express';
import busboy from 'busboy';
import fs from 'fs';
import path from 'path';

const uploadsDir = path.join(process.cwd(), 'uploads');
if (!fs.existsSync(uploadsDir)) {
  fs.mkdirSync(uploadsDir, { recursive: true });
}

export const handleProfileUploadDirect = (req: Request, res: Response) => {
  console.log('Profile upload with busboy - Content-Type:', req.headers['content-type']);
  
  const bb = busboy({ headers: req.headers });
  let uploadedFile: any = null;
  
  bb.on('file', (fieldname, file, info) => {
    console.log('File detected:', { fieldname, filename: info.filename, mimetype: info.mimeType });
    
    // Check if it's an image
    if (!info.mimeType.startsWith('image/')) {
      file.resume(); // Consume the file stream
      return res.status(400).json({ error: 'Only image files are allowed' });
    }
    
    // Generate unique filename
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    const extension = path.extname(info.filename);
    const filename = `profile-${uniqueSuffix}${extension}`;
    const filepath = path.join(uploadsDir, filename);
    
    // Create write stream
    const writeStream = fs.createWriteStream(filepath);
    
    file.pipe(writeStream);
    
    writeStream.on('close', () => {
      uploadedFile = {
        fieldname,
        originalname: info.filename,
        filename,
        mimetype: info.mimeType,
        path: filepath,
        size: writeStream.bytesWritten
      };
      console.log('File saved:', uploadedFile);
    });
    
    writeStream.on('error', (err) => {
      console.error('Write stream error:', err);
      res.status(500).json({ error: 'Failed to save file' });
    });
  });
  
  bb.on('close', () => {
    if (!uploadedFile) {
      return res.status(400).json({ error: 'No file uploaded' });
    }
    
    res.json({
      success: true,
      url: `/uploads/${uploadedFile.filename}`,
      filename: uploadedFile.filename
    });
  });
  
  bb.on('error', (err) => {
    console.error('Busboy error:', err);
    res.status(500).json({ error: 'Upload failed' });
  });
  
  req.pipe(bb);
};