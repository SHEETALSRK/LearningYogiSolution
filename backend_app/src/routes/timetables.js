const express = require('express');
const router = express.Router();
const dbService = require('../services/dbService');

// GET latest timetable
router.get('/latest', async (req, res) => {
  try {
    if (process.env.USE_LOCAL_STORAGE === 'true') {
      const data = await dbService.getLatestTimetableFromSqlite();
      if (!data) return res.status(404).json({ message: 'No timetables found' });
      return res.json(data);
    } else {
      const item = await dbService.getLatestTimetableFromDynamo();
      if (!item) return res.status(404).json({ message: 'No timetables found' });
      return res.json(item);
    }
  } catch (err) {
    console.error('Error fetching latest timetable:', err);
    res.status(500).json({ error: 'Error fetching latest timetable' });
  }
});

// GET by upload id
router.get('/:uploadId', async (req, res) => {
  const uploadId = req.params.uploadId;
  try {
    if (process.env.USE_LOCAL_STORAGE === 'true') {
      const data = await dbService.getTimetableByUploadIdFromSqlite(uploadId);
      if (!data) return res.status(404).json({ message: 'Timetable not found' });
      return res.json(data);
    } else {
      const item = await dbService.getTimetableByUploadIdFromDynamo(uploadId);
      if (!item) return res.status(404).json({ message: 'Timetable not found' });
      return res.json(item);
    }
  } catch (err) {
    console.error('Error fetching timetable by uploadId:', err);
    res.status(500).json({ error: 'Error fetching timetable' });
  }
});

module.exports = router;
