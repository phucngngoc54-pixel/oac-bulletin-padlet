import { google } from 'googleapis';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Authenticate using the downloaded credentials file
const auth = new google.auth.GoogleAuth({
  keyFile: path.join(__dirname, '../drive-credentials.json'),
  scopes: [
    'https://www.googleapis.com/auth/drive',
    'https://www.googleapis.com/auth/spreadsheets'
  ],
});

const drive = google.drive({ version: 'v3', auth });

async function listFiles() {
  const folderId = '1e8I5RFRrZUcqtzuGKJ-m_lJaYr28y1nl';
  try {
    const res = await drive.files.list({
      q: `'${folderId}' in parents and trashed=false`,
      fields: 'files(id, name, mimeType)',
      spaces: 'drive',
    });
    
    console.log('Files in Drive folder:');
    if (res.data.files && res.data.files.length > 0) {
      res.data.files.forEach((file) => {
        console.log(`${file.name} (${file.id}) - ${file.mimeType}`);
      });
    } else {
      console.log('No files found.');
    }
  } catch (err: any) {
    console.error('Error listing files:', err.message);
  }
}

listFiles();
