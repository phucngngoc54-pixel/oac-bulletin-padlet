// Vercel Serverless Function: /api/upload
// Handles file uploads to Google Drive

import { google } from 'googleapis';
import { Readable } from 'stream';
import path from 'path';
import { fileURLToPath } from 'url';

// Vercel doesn't support multer directly, so we parse multipart manually
// using the raw body. We use formidable for that.
import formidable from 'formidable';
import fs from 'fs';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// You can also load credentials from environment variables in production
// This reads from the file that exists in the repo
const CREDENTIALS_PATH = path.join(__dirname, '../drive-credentials.json');
const FOLDER_ID = '1e8I5RFRrZUcqtzuGKJ-m_lJaYr28y1nl';

export const config = {
  api: {
    bodyParser: false,
  },
};

export default async function handler(req, res) {
  // CORS headers
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Origin, X-Requested-With, Content-Type, Accept');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    // Parse the multipart form
    const form = formidable({
      keepExtensions: true,
      maxFileSize: 50 * 1024 * 1024, // 50MB
    });

    const [, files] = await form.parse(req);
    const fileField = files['file'];
    const uploadedFile = Array.isArray(fileField) ? fileField[0] : fileField;

    if (!uploadedFile) {
      return res.status(400).json({ error: 'No file uploaded' });
    }

    // Load credentials
    let credentials;
    try {
      credentials = JSON.parse(fs.readFileSync(CREDENTIALS_PATH, 'utf8'));
    } catch (e) {
      // Fall back to env variable if file is not accessible
      if (process.env.GOOGLE_CREDENTIALS_JSON) {
        credentials = JSON.parse(process.env.GOOGLE_CREDENTIALS_JSON);
      } else {
        throw new Error('No Google credentials found');
      }
    }

    const auth = new google.auth.GoogleAuth({
      credentials,
      scopes: ['https://www.googleapis.com/auth/drive'],
    });
    const drive = google.drive({ version: 'v3', auth });

    const fileMetadata = {
      name: uploadedFile.originalFilename || uploadedFile.newFilename,
      parents: [FOLDER_ID],
    };

    // Read the temp file and create a stream
    const fileContent = fs.readFileSync(uploadedFile.filepath);
    const stream = new Readable();
    stream.push(fileContent);
    stream.push(null);

    const media = {
      mimeType: uploadedFile.mimetype,
      body: stream,
    };

    const driveFile = await drive.files.create({
      requestBody: fileMetadata,
      media: media,
      fields: 'id, webViewLink, webContentLink',
    });

    // Make the file publicly readable
    await drive.permissions.create({
      fileId: driveFile.data.id,
      requestBody: {
        role: 'reader',
        type: 'anyone',
      },
    });

    // Clean up temp file
    fs.unlinkSync(uploadedFile.filepath);

    return res.status(200).json({
      success: true,
      fileId: driveFile.data.id,
      webViewLink: driveFile.data.webViewLink,
      webContentLink: driveFile.data.webContentLink,
    });
  } catch (error) {
    console.error('Upload Error:', error);
    return res.status(500).json({ error: error.message || 'Upload failed' });
  }
}
