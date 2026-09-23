# Microservices App for ECS Fargate

This is a minimal three-service Node.js application designed for the AWS ECS Fargate + service discovery project.

## Services

- Auth Service: login and JWT validation
- Order Service: creates orders and validates user tokens
- Notification Service: receives order events and stores them in memory

## Local run

```bash
cd new-app
cp .env.example .env
docker compose up --build
```

Then test:

```bash
curl http://localhost:4001/health
curl -X POST http://localhost:4001/login -H "Content-Type: application/json" -d '{"username":"alice","password":"password123"}'
curl -X POST http://localhost:4002/orders -H "Content-Type: application/json" -H "Authorization: Bearer <TOKEN>" -d '{"item":"Flight Ticket","total":250}'
```

## AWS mapping

- Auth Service -> ECS task for authentication
- Order Service -> ECS task for orders and business logic
- Notification Service -> ECS task for event notifications
- ALB path routing -> /api/auth, /api/orders, /api/notifications
- Cloud Map -> service-to-service DNS names like auth.internal or order.internal
- Secrets Manager -> runtime environment variables
- ElastiCache Redis -> shared session cache for stateless containers

## Service URLs

- Auth: http://localhost:4001
- Order: http://localhost:4002
- Notification: http://localhost:4003
