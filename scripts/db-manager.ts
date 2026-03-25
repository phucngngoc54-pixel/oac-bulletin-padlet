import { google } from 'googleapis';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Authenticate using the downloaded credentials file
const auth = new google.auth.GoogleAuth({
  keyFile: path.join(__dirname, '../drive-credentials.json'),
  scopes: ['https://www.googleapis.com/auth/spreadsheets'],
});

const sheets = google.sheets({ version: 'v4', auth });
export const SPREADSHEET_ID = '1n-JJyUcG2BKoD3EqWZQoJJ7WuLWaS4QehoDb2RUqjDk';

/**
 * Fetch all rows from a specific sheet range
 * Example: getSheetData('Users!A1:Z')
 */
export async function getSheetData(range: string) {
  try {
    const res = await sheets.spreadsheets.values.get({
      spreadsheetId: SPREADSHEET_ID,
      range,
    });
    return res.data.values || [];
  } catch (error: any) {
    console.error(`Error fetching data for range ${range}:`, error.message);
    throw error;
  }
}

/**
 * Append a row to a sheet
 * Example: appendRow('Users!A:Z', ['User1', 'Email', 'Role'])
 */
export async function appendRow(range: string, values: any[]) {
  try {
    const res = await sheets.spreadsheets.values.append({
      spreadsheetId: SPREADSHEET_ID,
      range,
      valueInputOption: 'USER_ENTERED',
      requestBody: {
        values: [values],
      },
    });
    return res.data;
  } catch (error: any) {
    console.error(`Error appending row to range ${range}:`, error.message);
    throw error;
  }
}

/**
 * Update a specific range
 * Example: updateRange('Users!A2:C2', ['User1_Updated', 'Email', 'Role'])
 */
export async function updateRange(range: string, values: any[][]) {
  try {
    const res = await sheets.spreadsheets.values.update({
      spreadsheetId: SPREADSHEET_ID,
      range,
      valueInputOption: 'USER_ENTERED',
      requestBody: {
        values,
      },
    });
    return res.data;
  } catch (error: any) {
    console.error(`Error updating range ${range}:`, error.message);
    throw error;
  }
}

// Simple CLI wrapper for quick queries
async function main() {
  const args = process.argv.slice(2);
  const command = args[0];

  if (!command) {
    console.log('Usage: npx tsx db-manager.ts <command> [args]');
    console.log('Commands:');
    console.log('  get <range>          => e.g. get "Users!A1:Z"');
    console.log('  append <range> <val> => e.g. append "Users!A:Z" \'["Test", "test@test.com"]\'');
    return;
  }

  if (command === 'get') {
    const range = args[1] || 'Users!A1:Z';
    const data = await getSheetData(range);
    console.table(data);
  } else if (command === 'append') {
    const range = args[1];
    const valString = args[2];
    if (!range || !valString) return console.error('Missing args');
    await appendRow(range, JSON.parse(valString));
    console.log('Appended row successfully.');
  }
}

if (process.argv[1].endsWith('db-manager.ts')) {
    main();
}
