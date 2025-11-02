const path = require('path');
const sqlite3 = require('sqlite3').verbose();
const { DynamoDBClient } = require('@aws-sdk/client-dynamodb');
const { GetCommand, QueryCommand, DynamoDBDocumentClient } = require('@aws-sdk/lib-dynamodb');

const dbPath = path.join(__dirname, '../../timetable.db');
const sqliteDb = new sqlite3.Database(dbPath);

let ddbDocClient = null;
if (process.env.USE_LOCAL_STORAGE !== 'true') {
  const client = new DynamoDBClient({ region: process.env.AWS_REGION });
  ddbDocClient = DynamoDBDocumentClient.from(client);
}

const TABLE_NAME = process.env.AWS_DYNAMODB_TABLE_NAME || 'Timetables';

function getLatestTimetableFromSqlite() {
  return new Promise((resolve, reject) => {
    sqliteDb.get('SELECT * FROM timetables ORDER BY created_at DESC LIMIT 1', (err, row) => {
      if (err) return reject(err);
      if (!row) return resolve(null);
      try {
        const parsed = JSON.parse(row.timetable_json);
        return resolve({ upload_id: row.upload_id, timetable: parsed, created_at: row.created_at });
      } catch (e) {
        return reject(e);
      }
    });
  });
}

function getTimetableByUploadIdFromSqlite(uploadId) {
  return new Promise((resolve, reject) => {
    sqliteDb.get('SELECT * FROM timetables WHERE upload_id = ? LIMIT 1', [uploadId], (err, row) => {
      if (err) return reject(err);
      if (!row) return resolve(null);
      try {
        const parsed = JSON.parse(row.timetable_json);
        return resolve({ upload_id: row.upload_id, timetable: parsed, created_at: row.created_at });
      } catch (e) {
        return reject(e);
      }
    });
  });
}

async function getLatestTimetableFromDynamo() {
  if (!ddbDocClient) throw new Error('DynamoDB client not configured');
  // This assumes the table has a GSI or sort key by created_at; if not, fallback to scan (not efficient)
  // For simplicity, we'll do a Query on a partition key named 'PK'='TIMETABLE' if present, otherwise Scan.
  try {
    // Try query with PK
    const qCmd = new QueryCommand({
      TableName: TABLE_NAME,
      KeyConditionExpression: '#pk = :pk',
      ExpressionAttributeNames: { '#pk': 'PK' },
      ExpressionAttributeValues: { ':pk': 'TIMETABLE' },
      ScanIndexForward: false,
      Limit: 1,
    });
    const res = await ddbDocClient.send(qCmd);
    if (res.Items && res.Items.length) return res.Items[0];
  } catch (e) {
    // ignore and fallback to scan
  }

  // Fallback: scan and pick latest by created_at
  const scanRes = await ddbDocClient.send({
    TableName: TABLE_NAME,
  });
  if (scanRes.Items && scanRes.Items.length) {
    // pick latest by created_at field
    const sorted = scanRes.Items.sort((a, b) => new Date(b.created_at) - new Date(a.created_at));
    return sorted[0];
  }
  return null;
}

async function getTimetableByUploadIdFromDynamo(uploadId) {
  if (!ddbDocClient) throw new Error('DynamoDB client not configured');
  // Attempt Get by primary key naming convention: assuming PK = uploadId
  try {
    const cmd = new GetCommand({ TableName: TABLE_NAME, Key: { upload_id: uploadId } });
    const res = await ddbDocClient.send(cmd);
    return res.Item || null;
  } catch (e) {
    throw e;
  }
}

module.exports = {
  getLatestTimetableFromSqlite,
  getTimetableByUploadIdFromSqlite,
  getLatestTimetableFromDynamo,
  getTimetableByUploadIdFromDynamo,
};
