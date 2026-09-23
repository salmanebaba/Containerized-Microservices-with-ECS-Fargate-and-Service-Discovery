const express = require('express');

const app = express();
const port = process.env.PORT || 4003;
const notifications = [];

app.use(express.json());

app.get('/api/notification/health', (req, res) => {
  res.json({ status: 'ok', service: 'notification-service' });
});

app.get('/api/notification/notifications', (req, res) => {
  res.json({ notifications });
});

app.post('/api/notification/notify', (req, res) => {
  const payload = req.body || {};
  const notification = {
    id: `NOT-${Date.now()}`,
    type: payload.type || 'generic',
    message: payload.message || 'New event received',
    order: payload.order || null,
    receivedAt: new Date().toISOString()
  };

  notifications.push(notification);

  console.log('Notification received:', notification);

  return res.status(201).json({
    message: 'Notification stored successfully',
    notification
  });
});

app.listen(port, '0.0.0.0', () => {
  console.log(`Service running on port ${port}`);
});
