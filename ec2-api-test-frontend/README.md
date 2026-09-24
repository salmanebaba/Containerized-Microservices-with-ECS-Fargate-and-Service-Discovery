# Microservices API Test Frontend

Static frontend only. No Node.js backend and no build step.

It tests these configurable external API prefixes by default:

- Auth: `/api/auth`
- Orders: `/api/order`
- Notifications: `/api/notification`

The UI can test health endpoints, login and JWT validation, create/list orders, and send/list notifications.

## Recommended EC2 deployment (Ubuntu + Nginx)

1. Launch a small Ubuntu EC2 instance and allow inbound HTTP port 80 in its security group.
2. Copy this folder to the instance.
3. Install Nginx:

```bash
sudo apt update
sudo apt install -y nginx
```

4. Copy the frontend files:

```bash
sudo rm -rf /var/www/html/*
sudo cp index.html styles.css app.js /var/www/html/
```

5. Install the included site configuration:

```bash
sudo cp nginx-site.conf /etc/nginx/sites-available/default
sudo nginx -t
sudo systemctl restart nginx
```

6. Open `http://EC2_PUBLIC_IP` in your browser.

The included Nginx config proxies `/api/*` to:

`http://microservices-alb-176688164.eu-west-3.elb.amazonaws.com`

This avoids browser CORS problems because the frontend calls the same EC2 origin and Nginx forwards API requests to the ALB.

## If your routes use plural prefixes

You do not need to edit the code. Change the values in the UI, for example:

- `/api/orders`
- `/api/notifications`

## Direct ALB mode

You can also enter the full ALB URL in the "API base URL" field. This only works from a browser if your API responses allow the frontend origin through CORS.
