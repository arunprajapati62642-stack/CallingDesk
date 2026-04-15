# CallDesk API Reference

## Base URL
```
http://localhost:3000
```

## Authentication Endpoints

### Register User
**POST** `/api/auth/register`

Creates a new user account.

**Request Body:**
```json
{
  "name": "John Doe",
  "email": "john@example.com",
  "password": "securePassword123",
  "phone": "+91 9876543210",
  "role": "customer"  // or "developer"
}
```

**Response (Success - 201):**
```json
{
  "success": true,
  "message": "User registered successfully",
  "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "user": {
    "name": "John Doe",
    "email": "john@example.com",
    "role": "customer"
  }
}
```

**Response (Error - 400):**
```json
{
  "success": false,
  "message": "Email already registered"
}
```

---

### Login User
**POST** `/api/auth/login`

Login with email and password.

**Request Body:**
```json
{
  "email": "john@example.com",
  "password": "securePassword123"
}
```

**Response (Success - 200):**
```json
{
  "success": true,
  "message": "Login successful",
  "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "user": {
    "name": "John Doe",
    "email": "john@example.com",
    "role": "customer"
  }
}
```

**Response (Error - 401):**
```json
{
  "success": false,
  "message": "Invalid credentials"
}
```

---

### Verify Token
**GET** `/api/auth/verify`

Verify if JWT token is valid.

**Headers:**
```
Authorization: Bearer <token>
```

**Response (Success - 200):**
```json
{
  "success": true,
  "user": {
    "_id": "65abc123def456...",
    "email": "john@example.com",
    "role": "customer",
    "name": "John Doe"
  }
}
```

**Response (Error - 401):**
```json
{
  "success": false,
  "message": "Invalid token"
}
```

---

## Queue Endpoints

### Get Queue
**GET** `/api/queue`

Retrieve current queue and served customers. **No authentication required** (public endpoint).

**Response (Success - 200):**
```json
{
  "success": true,
  "customers": [
    {
      "_id": "65abc123...",
      "name": "Rahul Sharma",
      "phone": "+91 9876543210",
      "issue": "Billing problem",
      "priority": "high",
      "createdAt": "2024-01-01T10:30:00Z",
      "servedAt": null
    }
  ],
  "served": [
    {
      "_id": "65abc456...",
      "name": "Priya Patel",
      "phone": "+91 9876543211",
      "issue": "Technical support",
      "priority": "normal",
      "createdAt": "2024-01-01T10:00:00Z",
      "servedAt": "2024-01-01T10:25:00Z"
    }
  ],
  "nextCustomer": {
    "_id": "65abc123...",
    "name": "Rahul Sharma",
    "phone": "+91 9876543210",
    "issue": "Billing problem",
    "priority": "high",
    "createdAt": "2024-01-01T10:30:00Z",
    "servedAt": null
  },
  "queueSize": 1
}
```

---

### Add Customer to Queue
**POST** `/api/queue`

Register a new complaint and add to queue. **Requires authentication**.

**Headers:**
```
Authorization: Bearer <token>
Content-Type: application/json
```

**Request Body:**
```json
{
  "name": "Rahul Sharma",
  "phone": "+91 9876543210",
  "issue": "Billing problem",
  "priority": "high"  // or "normal", "low"
}
```

**Response (Success - 201):**
```json
{
  "success": true,
  "message": "Customer added to queue",
  "customer": {
    "_id": "65abc789...",
    "name": "Rahul Sharma",
    "phone": "+91 9876543210",
    "issue": "Billing problem",
    "priority": "high",
    "createdAt": "2024-01-01T10:45:00Z",
    "servedAt": null
  }
}
```

**Response (Error - 401):**
```json
{
  "success": false,
  "message": "No token provided"
}
```

---

### Serve Next Customer
**POST** `/api/queue/serve`

Mark the next customer as served. **Requires authentication + "developer" role**.

**Headers:**
```
Authorization: Bearer <token>
Content-Type: application/json
```

**Response (Success - 200):**
```json
{
  "success": true,
  "message": "Customer served",
  "customer": {
    "_id": "65abc123...",
    "name": "Rahul Sharma",
    "phone": "+91 9876543210",
    "issue": "Billing problem",
    "priority": "high",
    "createdAt": "2024-01-01T10:30:00Z",
    "servedAt": "2024-01-01T10:50:00Z"
  }
}
```

**Response (Error - 403 - Not a developer):**
```json
{
  "success": false,
  "message": "Access denied"
}
```

**Response (Error - 404 - No customers):**
```json
{
  "success": false,
  "message": "No customers in queue"
}
```

---

## Error Codes

| Code | Meaning | Common Cause |
|------|---------|-------------|
| 200 | OK | Request successful |
| 201 | Created | New resource created |
| 400 | Bad Request | Invalid input data |
| 401 | Unauthorized | Missing or invalid token |
| 403 | Forbidden | User lacks required role |
| 404 | Not Found | Resource doesn't exist |
| 500 | Server Error | Server-side issue |

---

## Authentication

### JWT Token Structure
```
Header.Payload.Signature
```

**Payload contains:**
- `_id` - MongoDB user ID
- `email` - User email
- `role` - "customer" or "developer"
- `name` - User's full name
- `exp` - Expiration timestamp (7 days)

### How to Use Token

1. **Store after login:**
   ```javascript
   localStorage.setItem('token', response.token);
   ```

2. **Include in API requests:**
   ```javascript
   fetch('/api/queue/serve', {
     method: 'POST',
     headers: {
       'Authorization': `Bearer ${token}`,
       'Content-Type': 'application/json'
     }
   });
   ```

3. **Token auto-expires after 7 days**

---

## Rate Limiting

Currently no rate limiting. For production, consider adding:
- 100 requests per 15 minutes per IP
- 50 requests per minute per token

---

## CORS

CORS is enabled for all origins:
```javascript
cors: { origin: "*" }
```

For production, restrict to specific domain:
```javascript
cors: { origin: "https://yourdomain.com" }
```

---

## Example Usage

### Using cURL

**Register:**
```bash
curl -X POST http://localhost:3000/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "name": "John Doe",
    "email": "john@example.com",
    "password": "password123",
    "role": "customer"
  }'
```

**Login:**
```bash
curl -X POST http://localhost:3000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "john@example.com",
    "password": "password123"
  }'
```

**Get Queue:**
```bash
curl -X GET http://localhost:3000/api/queue
```

**Add Customer (with token):**
```bash
curl -X POST http://localhost:3000/api/queue \
  -H "Authorization: Bearer <token>" \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Rahul",
    "phone": "+91 9876543210",
    "issue": "Billing problem",
    "priority": "high"
  }'
```

**Serve Customer (with token):**
```bash
curl -X POST http://localhost:3000/api/queue/serve \
  -H "Authorization: Bearer <token>" \
  -H "Content-Type: application/json"
```

---

## Socket.IO Events

Real-time updates via WebSocket:

### Client Events:
- `getQueue` - Request current queue data
- `addCustomer` - Add customer to queue
- `serveNext` - Serve next customer

### Server Events:
- `queueData` - Receive queue data
- `updateQueue` - Queue has been updated (refresh)

---

## Data Models

### User Model
```javascript
{
  _id: ObjectId,
  name: String,
  email: String (unique),
  password: String (hashed),
  role: "customer" | "developer",
  phone: String,
  createdAt: Date
}
```

### Customer Model
```javascript
{
  _id: ObjectId,
  name: String,
  phone: String,
  issue: String,
  priority: "high" | "normal" | "low",
  createdAt: Date,
  servedAt: Date | null
}
```

---

## Status Codes by Endpoint

### Auth Endpoints
- **Register**: 201 Created, 400 Bad Request, 500 Server Error
- **Login**: 200 OK, 400 Bad Request, 401 Unauthorized, 500 Server Error
- **Verify**: 200 OK, 401 Unauthorized

### Queue Endpoints
- **Get Queue**: 200 OK, 500 Server Error
- **Add Customer**: 201 Created, 401 Unauthorized, 500 Server Error
- **Serve Customer**: 200 OK, 401 Unauthorized, 403 Forbidden, 404 Not Found, 500 Server Error

---

For more details, refer to README.md and SETUP_GUIDE.md
