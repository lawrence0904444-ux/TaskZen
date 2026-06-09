// Netlify Function: 跨裝置同步後端
// GET  /api/sync?room=default → 回傳 { tasks, nextId, lastUpdated }
// POST /api/sync             → 儲存 { room, tasks, nextId, lastUpdated }
import { getStore } from '@netlify/blobs';

const headers = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'Content-Type',
  'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
  'Content-Type': 'application/json',
};

function sanitize(v) {
  return String(v || 'default').replace(/[^a-zA-Z0-9_-]/g, '');
}

export const handler = async (event) => {
  // CORS preflight
  if (event.httpMethod === 'OPTIONS') {
    return { statusCode: 204, headers, body: '' };
  }

  const store = getStore('taskzen-sync');
  const room = sanitize(event.queryStringParameters?.room);

  if (event.httpMethod === 'GET') {
    try {
      const data = await store.get(room, { type: 'json' });
      return {
        statusCode: 200,
        headers,
        body: JSON.stringify(data || { tasks: [], nextId: 1, lastUpdated: 0 }),
      };
    } catch (err) {
      return {
        statusCode: 200,
        headers,
        body: JSON.stringify({ tasks: [], nextId: 1, lastUpdated: 0 }),
      };
    }
  }

  if (event.httpMethod === 'POST') {
    try {
      const body = typeof event.body === 'string' ? JSON.parse(event.body) : event.body;
      const roomKey = sanitize(body.room);
      await store.setJSON(roomKey, {
        tasks: body.tasks || [],
        nextId: body.nextId || 1,
        lastUpdated: body.lastUpdated || Date.now(),
      });
      return { statusCode: 200, headers, body: JSON.stringify({ ok: true }) };
    } catch (err) {
      return {
        statusCode: 400,
        headers,
        body: JSON.stringify({ error: err.message }),
      };
    }
  }

  return {
    statusCode: 405,
    headers,
    body: JSON.stringify({ error: 'Method not allowed' }),
  };
};
