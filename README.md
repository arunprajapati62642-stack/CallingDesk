# CallDesk - Customer Service Queue System with Auth

## Overview
CallDesk is a complete customer service queue management application with:
- **Two-Stack Queue Algorithm**: Implements FIFO queue using two stacks
- **Authentication System**: Secure login for customers and developers
- **Real-time Updates**: Socket.IO for live queue updates
- **Role-Based Access**: Separate portals for customers and developers

## Features

### 🔐 Authentication
- **Login & Register System**: Secure user registration with password hashing
- **JWT Tokens**: Token-based authentication for API routes
- **Role-Based Access Control**: 
  - **Customers**: Can register complaints and track queue position
  - **Developers**: Can manage queue and serve customers

### 👤 Customer Portal (`/customer.html`)
- Register new complaints with priority levels
- View real-time queue position
- Track complaint status
- Auto-refresh queue updates

### 👨‍💼 Developer Portal (`/queue.html`)
- View complete waiting queue
- Serve next customer from queue
- View recently served customers
- Display queue statistics
- Visual stack representation

### 🔄 Real-time Queue System
- Socket.IO integration for live updates
- Two-stack implementation for FIFO ordering
- Priority levels: High, Normal, Low

## Project Structure

```
micro project 2/
├── server.js                  # Backend server with Express & Socket.IO
├── package.json              # Dependencies
├── .env                       # Environment variables
├── models/
│   ├── customer.js           # Customer schema (legacy)
│   ├── user.js               # User authentication model
│   └── public/
│       ├── index.html        # Redirect to login/dashboard
│       ├── login.html        # Login & Register page
│       ├── customer.html     # Customer complaint portal
│       ├── queue.html        # Developer queue manager
│       ├── style.css         # Styling
│       └── script.js         # Frontend logic
└── middleware/
    └── auth.js               # JWT verification & role checking
```

## Setup Instructions

### 1. Install Dependencies
```bash
npm install
```

### 2. MongoDB Setup
Ensure MongoDB is running on `localhost:27017`:
```bash
# Windows
mongod

# macOS/Linux
mongod --config /usr/local/etc/mongod.conf
```

### 3. Environment Variables
The `.env` file is pre-configured:
```
PORT=3000
MONGODB_URI=mongodb://127.0.0.1:27017/calldesk
JWT_SECRET=your-secret-key-change-this-in-production
NODE_ENV=development
```

### 4. Start the Server
```bash
npm start
# OR for development with auto-reload:
npm run dev
```

Server will run on `http://localhost:3000`

## Usage

### First Time Setup

1. **Open Login Page**: Go to `http://localhost:3000/login.html`

2. **Create Account**:
   - Click "Register" tab
   - Choose account type:
     - **👤 Customer** - To register complaints
     - **👨‍💼 Developer** - To manage queue
   - Fill in details and register

3. **Login**: Use registered email and password

### As a Customer

1. Login with customer credentials
2. View "Register Your Complaint" form
3. Fill:
   - Your Phone Number
   - Issue Description
   - Priority Level
4. Click "Register to Queue"
5. Track your position in real-time
6. Queue refreshes automatically every 5 seconds

### As a Developer

1. Login with developer credentials
2. View complete waiting queue on left
3. See next customer details on right
4. Click "Serve Next Customer" to process
5. Customer is marked as served and moved to history
6. Queue updates automatically every 3 seconds

## API Endpoints

### Authentication
```
POST   /api/auth/register    - Register new user
POST   /api/auth/login       - Login user
GET    /api/auth/verify      - Verify JWT token
```

### Queue Management
```
GET    /api/queue            - Get current queue & served customers
POST   /api/queue            - Add customer to queue (requires auth)
POST   /api/queue/serve      - Serve next customer (developers only)
```

## Authentication Flow

1. User registers with email & password
2. Password is hashed with bcryptjs
3. Server issues JWT token (valid for 7 days)
4. Token stored in localStorage
5. Token sent in Authorization header for protected routes
6. Server verifies token and role before allowing access

## Database Schema

### User Model
```javascript
{
  name: String,              // User's full name
  email: String (unique),    // Email address
  password: String,          // Hashed password
  role: String,              // "customer" or "developer"
  phone: String,             // Phone number
  createdAt: Date            // Account creation date
}
```

### Customer Model
```javascript
{
  name: String,              // Customer name
  phone: String,             // Contact number
  issue: String,             // Issue description
  priority: String,          // high/normal/low
  createdAt: Date,           // Registration time
  servedAt: Date             // Time when served (null if pending)
}
```

## Security Features

✅ Password hashing with bcryptjs (10 salt rounds)
✅ JWT token-based authentication
✅ Role-based access control (RBAC)
✅ Protected API endpoints
✅ Secure session management
✅ CORS enabled for cross-origin requests

## Test Accounts

You can create test accounts, but here are example credentials:

**Customer Account:**
- Email: `customer@example.com`
- Password: `password123`

**Developer Account:**
- Email: `developer@example.com`
- Password: `password123`

(Create these through the Register page first!)

## Troubleshooting

### Server won't start
- Check MongoDB is running: `mongod`
- Verify port 3000 is not in use
- Check .env file is present

### Login page not loading
- Ensure server is running on `http://localhost:3000`
- Clear browser cache and localStorage
- Check browser console for errors

### Queue not updating
- Verify customer/developer is logged in
- Check network tab for API calls
- Ensure MongoDB has users and customers data

### Password incorrect after registration
- Passwords are case-sensitive
- Ensure no extra spaces in email

## Future Enhancements

- Email notifications for customers
- Dashboard analytics for developers
- SMS updates for queue position
- Ticket system integration
- Admin panel for user management
- Call/chat system integration
- Database backup & recovery
- Rate limiting for API endpoints

## Technologies Used

- **Backend**: Node.js, Express.js, Socket.IO
- **Database**: MongoDB, Mongoose
- **Authentication**: JWT, bcryptjs
- **Frontend**: HTML5, CSS3, Vanilla JavaScript
- **Security**: CORS, rate limiting, password hashing

## License
MIT License

## Contact
For issues or support, contact the development team.
