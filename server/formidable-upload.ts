import { Request, Response } from 'express';
import formidable from 'formidable';
import fs from 'fs';
import path from 'path';

const uploadsDir = path.join(process.cwd(), 'uploads');
if (!fs.existsSync(uploadsDir)) {
  fs.mkdirSync(uploadsDir, { recursive: true });
}

export const handleFormidableUpload = (req: Request, res: Response) => {
  console.log('Formidable upload handler called');
  
  const form = formidable({
    uploadDir: uploadsDir,
    keepExtensions: true,
    maxFileSize: 10 * 1024 * 1024, // 10MB
    multiples: false,
    filter: ({ mimetype }) => {
      // Only allow images
      return mimetype && mimetype.startsWith('image/');
    }
  });

  form.parse(req, (err: any, fields: any, files: any) => {
    if (err) {
      console.error('Formidable parse error:', err);
      return res.status(500).json({ error: 'Upload failed' });
    }

    console.log('Parsed files:', files);
    console.log('Parsed fields:', fields);

    // Get the uploaded file (could be under any field name)
    const fileKeys = Object.keys(files);
    if (fileKeys.length === 0) {
      return res.status(400).json({ error: 'No file uploaded' });
    }

    const file = files[fileKeys[0]];
    if (!file) {
      return res.status(400).json({ error: 'No file uploaded' });
    }

    // Handle both single file and array
    const uploadedFile = Array.isArray(file) ? file[0] : file;
    
    if (!uploadedFile.mimetype?.startsWith('image/')) {
      // Clean up the uploaded file
      fs.unlinkSync(uploadedFile.filepath);
      return res.status(400).json({ error: 'Only image files are allowed' });
    }

    // Generate new filename
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    const extension = path.extname(uploadedFile.originalFilename || '');
    const newFilename = `profile-${uniqueSuffix}${extension}`;
    const newPath = path.join(uploadsDir, newFilename);

    // Move file to final location with new name
    fs.renameSync(uploadedFile.filepath, newPath);

    console.log('File successfully uploaded:', newFilename);

    res.json({
      success: true,
      url: `/uploads/${newFilename}`,
      filename: newFilename
    });
  });
};