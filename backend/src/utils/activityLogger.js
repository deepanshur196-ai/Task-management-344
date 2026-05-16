import fs from 'fs';
import path from 'path';

const logFile = path.join(process.cwd(), 'activity.log');

export const logActivity = (activity) => {
  const entry = `[${new Date().toISOString()}] ${activity}\n`;
  fs.appendFile(logFile, entry, (err) => {
    if (err) console.error('Activity log error:', err);
  });
};
