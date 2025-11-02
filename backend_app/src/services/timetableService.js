const fs = require('fs');
const path = require('path');
const { OpenAI } = require('openai');
const sqlite3 = require('sqlite3').verbose();
const sharp = require('sharp');

const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

// Initialize SQLite DB
const dbPath = path.join(__dirname, '../../timetable.db');
const db = new sqlite3.Database(dbPath);

db.serialize(() => {
  db.run(`CREATE TABLE IF NOT EXISTS timetables (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    upload_id TEXT,
    timetable_json TEXT,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
  )`);
});

async function extractTimetableFromImage(imageBuffer, uploadId) {
  // Optionally preprocess image
  const processedImageBuffer = await sharp(imageBuffer)
    .resize(1000)
    .toFormat('png')
    .toBuffer();

  // Convert image buffer to base64 data URL
  const base64Image = processedImageBuffer.toString('base64');
  const imageDataUrl = `data:image/png;base64,${base64Image}`;

  // Prepare prompt with generic output format
  const prompt = `You are an expert at reading school timetables from images. Extract the timetable from the attached image and return it as a JSON object in the following generic format:\n\n{\n  \"class\": \"<class name>\",\n  \"term\": \"<term>\",\n  \"teacher\": \"<teacher name>\",\n  \"days\": {\n    \"Monday\": [\n      { \"time\": \"<start-end>\", \"subject\": \"<subject>\", \"notes\": \"<optional notes>\", \"marginLeftPercent\": <percentage> },\n      // ...more entries\n    ],\n    \"Tuesday\": [ /* ... */ ],\n    \"Wednesday\": [ /* ... */ ],\n    \"Thursday\": [ /* ... */ ],\n    \"Friday\": [ /* ... */ ]\n  }\n}\n\nFor each entry, calculate the \"marginLeftPercent\" field which represents the horizontal position of the subject block in the row based on its start time. Assume the timetable displays from 8:00 AM (0%) to 3:00 PM (100%). Calculate the percentage position using:\nmarginLeftPercent = ((start_time_in_minutes - 8*60) / (15*60 - 8*60)) * 100\n\nFor example:\n- 8:00 AM = 0%\n- 11:30 AM = 50% \n- 3:00 PM = 100%\n\nOnly return valid JSON, no extra text. Fill in the values based on the image contents. Use the keys as shown, and include any notes if present.`;

  // Call OpenAI GPT-5 API (new format)
  const response = await openai.responses.create({
    model: 'gpt-5',
    input: [
      {
        role: 'user',
        content: [
          {
            type: 'input_text',
            text: prompt,
          },
          {
            type: 'input_image',
            image_url: imageDataUrl,
          },
        ],
      },
    ],
  });

  // Parse JSON from response
  let timetableJson;
  try {
    timetableJson = JSON.parse(response.output_text);
  } catch (err) {
    throw new Error('Failed to parse timetable JSON from GPT-5 response');
  }

  // Store in SQLite
  db.run(
    'INSERT INTO timetables (upload_id, timetable_json) VALUES (?, ?)',
    [uploadId, JSON.stringify(timetableJson)],
    function (err) {
      if (err) console.error('SQLite insert error:', err);
    }
  );

  return timetableJson;
}

module.exports = { extractTimetableFromImage };
