const express = require('express');
const axios = require('axios');

const app = express();
const port = process.env.PORT || 4002;
const authServiceUrl = process.env.AUTH_SERVICE_URL || 'http://localhost:4001';
const notificationServiceUrl = process.env.NOTIFICATION_SERVICE_URL || 'http://localhost:4003';

app.use(express.json());

const orders = [];

app.get('/api/order/health', (req, res) => {
  res.json({ status: 'ok', service: 'order-service' });
});

app.get('/api/order/orders', (req, res) => {
  res.json({ orders });
});

app.post('/api/order/orders', async (req, res) => {
  const { item, total, userToken } = req.body || {};
  const token = userToken || req.headers.authorization || '';

  if (!token) {
    return res.status(401).json({ error: 'Authorization token is required.' });
  }

  try {
    const validationResponse = await axios.get(`${authServiceUrl}/api/auth/validate`, {
      headers: {
        Authorization: token.startsWith('Bearer ') ? token : `Bearer ${token}`
      },
      timeout: 5000
    });

    const user = validationResponse.data.user;
    const order = {
      id: `ORD-${Date.now()}`,
      item: item || 'General booking',
      total: total || 0,
      userId: user.sub,
      username: user.username,
      status: 'created'
    };

    orders.push(order);

    const notificationResponse = await axios.post(
      `${notificationServiceUrl}/api/notification/notify`,
      {
        type: 'order_created',
        message: `Order ${order.id} created for ${order.username}`,
        order
      },
      {
        timeout: 5000
      }
    );

    return res.status(201).json({
      message: 'Order created successfully',
      order,
      notification: notificationResponse.data
    });
  } catch (error) {
    const message = error.response?.data?.error || 'Authentication failed or notification service is unavailable.';
    return res.status(401).json({ error: message });
  }
});

app.listen(port, '0.0.0.0', () => {
  console.log(`Service running on port ${port}`);
});