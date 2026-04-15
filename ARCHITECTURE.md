# CallDesk System Architecture & Flow

## 📊 System Architecture Diagram

```
┌─────────────────────────────────────────────────────────────────┐
│                      Browser / Frontend                          │
├─────────────────────────────────────────────────────────────────┤
│                                                                   │
│  ┌──────────────────┐  ┌──────────────────┐  ┌──────────────┐   │
│  │   login.html     │  │ customer.html    │  │ queue.html   │   │
│  │                  │  │                  │  │              │   │
│  │ • Register       │  │ • Register       │  │ • View Queue │   │
│  │ • Login          │  │   Complaint      │  │ • Serve Next │   │
│  │ • Token Storage  │  │ • View Position  │  │ • Statistics │   │
│  │ • Validation     │  │ • Track Status   │  │ • History    │   │
│  └────────┬─────────┘  └─────────┬────────┘  └──────┬───────┘   │
│           │                      │                  │            │
│           └──────────────────────┼──────────────────┘            │
│                                  │                               │
│                         JWT Token in localStorage               │
│                         (Bearer: <token>)                        │
│                                                                   │
└────────────────────────────────────────────────────────────────┬─┘
                                                                  │
                                    HTTP/HTTPS Requests
                                    with Authorization Header
                                                                  │
┌─────────────────────────────────────────────────────────────────┴─┐
│                        Express.js Server                          │
├──────────────────────────────────────────────────────────────────┤
│                                                                    │
│  ┌──────────────────────────────────────────────────────────┐    │
│  │              API Routes / Endpoints                       │    │
│  ├──────────────────────────────────────────────────────────┤    │
│  │                                                            │    │
│  │  POST   /api/auth/register    ────┐                      │    │
│  │  POST   /api/auth/login       ────┤                      │    │
│  │  GET    /api/auth/verify      ────┤─ [verifyToken]       │    │
│  │                                    │   [verifyRole]       │    │
│  │  GET    /api/queue            ────┘                      │    │
│  │  POST   /api/queue            ──── [Protected}]          │    │
│  │  POST   /api/queue/serve      ──── [Protected]           │    │
│  │                                    [Dev Only]            │    │
│  └────────────────┬─────────────────────────────────────────┘    │
│                   │                                               │
│  ┌────────────────┴─────────────────────────────────────────┐    │
│  │          Middleware & Utilities                          │    │
│  ├──────────────────────────────────────────────────────────┤    │
│  │  • JWT Verification (middleware/auth.js)                 │    │
│  │  • Role Checking (developer/customer)                    │    │
│  │  • BCrypt Password Hashing                               │    │
│  │  • Error Handling                                        │    │
│  │  • CORS Configuration                                    │    │
│  └────────────────┬─────────────────────────────────────────┘    │
│                   │                                               │
│  ┌────────────────┴─────────────────────────────────────────┐    │
│  │          Database Models                                 │    │
│  ├──────────────────────────────────────────────────────────┤    │
│  │  • User Model (models/user.js)                           │    │
│  │    └── name, email, password, role, phone               │    │
│  │                                                            │    │
│  │  • Customer Model (models/customer.js)                   │    │
│  │    └── name, phone, issue, priority, dates              │    │
│  └────────────────┬─────────────────────────────────────────┘    │
│                   │                                               │
└───────────────────┼───────────────────────────────────────────────┘
                    │
                    │ Mongoose ORM
                    │
┌───────────────────┴───────────────────────────────────────────────┐
│                     MongoDB Database                              │
├────────────────────────────────────────────────────────────────────┤
│                                                                     │
│  ┌──────────────────┐         ┌──────────────────┐                │
│  │   users          │         │    customers     │                │
│  │  Collection      │         │   Collection     │                │
│  ├──────────────────┤         ├──────────────────┤                │
│  │ _id              │         │ _id              │                │
│  │ name             │         │ name             │                │
│  │ email (unique)   │         │ phone            │                │
│  │ password (hash)  │         │ issue            │                │
│  │ role             │         │ priority         │                │
│  │ phone            │         │ createdAt        │                │
│  │ createdAt        │         │ servedAt         │                │
│  └──────────────────┘         └──────────────────┘                │
│                                                                     │
└─────────────────────────────────────────────────────────────────────┘
```

---

## 🔄 Authentication Flow

```
┌───────────────────────────────────────────────────────────────┐
│              USER REGISTRATION FLOW                           │
└───────────────────────────────────────────────────────────────┘

Frontend                          Backend                Database
   │                                │                       │
   │─────────────────────────────────│                       │
   │   POST /api/auth/register       │                       │
   │   {name, email, password, role} │                       │
   │                                │                       │
   │                    ┌─ Validate Input                    │
   │                    ├─ Check Duplicate Email              │
   │                    ├─ Hash Password (bcryptjs)           │
   │                            └──────────────────────────────│
   │                                                  Save User│
   │                                │◄──────────────────────────
   │                    ┌─ Generate JWT                      │
   │                    └─ Create Token                      │
   │                                │                       │
   │◄───────────────────────────────│                       │
   │  {token, user, success: true}  │                       │
   │                                │                       │
   │  Store Token in localStorage     │                       │
   │  Store User Data                │                       │
   │  Redirect to Dashboard           │                       │
   │                                │                       │


┌───────────────────────────────────────────────────────────────┐
│              USER LOGIN FLOW                                 │
└───────────────────────────────────────────────────────────────┘

Frontend                          Backend                Database
   │                                │                       │
   │─────────────────────────────────│                       │
   │   POST /api/auth/login          │                       │
   │   {email, password}             │                       │
   │                                │                       │
   │                    ┌─ Find User by Email                │
   │                            └──────────────────────────────│
   │                                                 Query User│
   │                                │◄──────────────────────────
   │                                │    User Found
   │                    ├─ Compare Password Hash             │
   │                    │  (password matches?)                │
   │                    ├─ Generate JWT Token                │
   │                    └─ Create Authorization               │
   │                                │                       │
   │◄───────────────────────────────│                       │
   │  {token, user, success: true}  │                       │
   │                                │                       │
   │  Store Token in localStorage     │                       │
   │  Redirect to customer/queue.html │                       │
   │                                │                       │


┌───────────────────────────────────────────────────────────────┐
│              API REQUEST WITH AUTHENTICATION                  │
└───────────────────────────────────────────────────────────────┘

Frontend                          Backend                Database
   │                                │                       │
   │─────────────────────────────────│                       │
   │   POST /api/queue/serve         │                       │
   │   Headers: {                    │                       │
   │     Authorization: Bearer <JWT> │                       │
   │   }                             │                       │
   │                                │                       │
   │                    ┌─ Extract Token from Header        │
   │                    ├─ Verify JWT Signature             │
   │                    ├─ Check Token Expiry                │
   │                    ├─ Extract User Info                │
   │                    ├─ Verify Role (Developer?)         │
   │                    │                                   │
   │                    ├─ Find Next Customer in Queue      │
   │                            └──────────────────────────────│
   │                                              Query Customer│
   │                                │◄──────────────────────────
   │                    │  Update servedAt = now              │
   │                            └──────────────────────────────│
   │                                           Update Customer│
   │                                │◄──────────────────────────
   │                    └─ Emit updateQueue via Socket.IO    │
   │                                │                       │
   │◄───────────────────────────────│                       │
   │  {success: true, customer}     │                       │
   │                                │                       │
   │  Update UI                      │                       │
   │  Refresh Queue Display          │                       │
   │                                │                       │
```

---

## 🛡️ Security Architecture

```
┌─────────────────────────────────────────────────────┐
│           SECURITY LAYERS                           │
└─────────────────────────────────────────────────────┘

Layer 1: Input Validation
├── Email format validation
├── Password strength check (min 6 chars)
├── Required field validation
└── Data type validation

Layer 2: Authentication
├── Email/Password verification
├── Bcryptjs password hashing (10 salt rounds)
├── JWT token generation (7-day expiry)
└── Token signature verification

Layer 3: Authorization
├── Token presence check
├── Token validity check
├── Token expiry check
└── Role-based access control (RBAC)

Layer 4: Transport Security
├── HTTPS (in production)
├── Secure headers
├── CORS configuration
└── No sensitive data in logs

Layer 5: Database Security
├── No plain-text password storage
├── Unique email constraint
├── Mongoose schema validation
└── Connection pooling


┌─────────────────────────────────────────────────────┐
│           TOKEN LIFECYCLE                           │
└─────────────────────────────────────────────────────┘

1. Generation
   ├── User registers/logs in
   ├── Server creates JWT
   └── Token sent to client

2. Storage
   ├── Client stores in localStorage
   └── Token persists across sessions

3. Usage
   ├── Included in Authorization header
   ├── Server verifies on each request
   └── User authenticated until expiry/logout

4. Expiration
   ├── Token valid for 7 days
   ├── Auto-reject after expiry
   └── User must login again

5. Logout
   ├── Client removes from localStorage
   └── Token becomes invalid (server-side)
```

---

## 📱 Data Flow Diagram

```
┌──────────────────────────────────────────────────────────────┐
│              CUSTOMER COMPLAINT FLOW                          │
└──────────────────────────────────────────────────────────────┘

Customer                        Queue System              Database
   │                              │                         │
   │  1. Registers Account         │                         │
   │─────────────────────────────>│ Store User              │
   │                              │────────────────────────>│
   │  2. Login                     │                         │
   │─────────────────────────────>│ Verify Credentials      │
   │<─────────────────────────────│ Return JWT              │
   │                              │                         │
   │  3. Fills Complaint Form      │                         │
   │     (name, phone, issue,      │                         │
   │      priority)                │                         │
   │─────────────────────────────>│ Save to Queue           │
   │                              │────────────────────────>│
   │  4. Gets Position #           │                         │
   │<─────────────────────────────│ Query Server for        │
   │                              │ customers ahead         │
   │  5. Waits in Queue            │                         │
   │     (auto-refresh every 5s)   │                         │
   │<─────────────────────────────│ Position Updates        │
   │                              │                         │
   │  6. Developer Serves          │                         │
   │     Complaint                 │ Move to Served list     │
   │                              │────────────────────────>│
   │<─────────────────────────────│ Notify Customer         │
   │                              │                         │
   │  7. Sees "Served" Status      │                         │
   │                              │                         │


┌──────────────────────────────────────────────────────────────┐
│              DEVELOPER SERVING FLOW                           │
└──────────────────────────────────────────────────────────────┘

Developer                       Queue System              Database
   │                              │                         │
   │  1. Registers as Developer    │                         │
   │─────────────────────────────>│ Store User              │
   │                              │────────────────────────>│
   │  2. Login with Dev Account    │                         │
   │─────────────────────────────>│ Verify Credentials      │
   │<─────────────────────────────│ Return JWT              │
   │                              │                         │
   │  3. Dashboard Loads           │                         │
   │────────────────────────────->│ Fetch Queue             │
   │                              │────────────────────────>│
   │  4. Sees Next Customer        │<────────────────────────│
   │────────────────────────────>│                         │
   │                              │                         │
   │  5. Clicks "Serve Next"       │                         │
   │─────────────────────────────>│ Update servedAt time    │
   │                              │────────────────────────>│
   │<─────────────────────────────│ Confirmation            │
   │                              │                         │
   │  6. Next Customer Available   │ Auto-fetch next        │
   │<─────────────────────────────│────────────────────────>│
   │                              │                         │
   │  7. Queue Auto-Refreshes      │                         │
   │     (every 3s)               │                         │
   │<─────────────────────────────│ Updated List            │
   │                              │                         │
```

---

## 🔗 Component Interaction

```
┌─────────────────────────────────────────────────────┐
│          COMPONENT RELATIONSHIPS                     │
└─────────────────────────────────────────────────────┘

login.html
    │
    ├─> Calls /api/auth/register
    │       └─> Validates input
    │       └─> Creates User in DB
    │       └─> Issues JWT
    │
    └─> Calls /api/auth/login
            └─> Verifies credentials
            └─> Issues JWT
            └─> Stores in localStorage
            └─> Redirects to:
                ├─ /customer.html (if customer)
                └─ /queue.html (if developer)


customer.html
    │
    ├─> Uses stored JWT token
    │
    ├─> Calls GET /api/queue
    │       └─> Fetches all customers
    │       └─> Displays current queue
    │
    ├─> Calls POST /api/queue
    │       └─> Adds complaint
    │       └─> Includes JWT in header
    │
    └─> Auto-refreshes (every 5 seconds)
            └─> Keeps position updated


queue.html
    │
    ├─> Uses stored JWT token
    │       └─> Verified as Developer role
    │
    ├─> Calls GET /api/queue
    │       └─> Fetches pending customers
    │       └─> Fetches served customers
    │
    ├─> Calls POST /api/queue/serve
    │       └─> Serves next customer
    │       └─> Requires JWT + Developer role
    │
    └─> Auto-refreshes (every 3 seconds)
            └─> Updates queue display


middleware/auth.js
    │
    ├─> verifyToken()
    │       └─> Checks JWT in header
    │       └─> Validates signature
    │       └─> Checks expiry
    │
    └─> verifyRole([roles])
            └─> Checks user role
            └─> Grants/denies access


models/user.js
    │
    ├─> Schema definition
    │       └─> name, email, password, role, phone
    │
    ├─> Password hashing (pre-save hook)
    │       └─> Runs on user.save()
    │       └─> Hashes password with bcryptjs
    │
    └─> Password comparison method
            └─> Compare input with hash
            └─> Returns true/false


models/customer.js
    │
    └─> Schema definition
            └─> name, phone, issue, priority
            └─> createdAt, servedAt
```

---

## 🚀 Deployment Flow

```
Local Development
    │
    ├─ npm install
    ├─ mongod (start MongoDB)
    ├─ npm start
    └─ http://localhost:3000

Staging/Production
    │
    ├─ Set up MongoDB Atlas or remote DB
    ├─ Update .env with production values
    ├─ Set NODE_ENV=production
    ├─ npm install --production
    ├─ npm start or use process manager (PM2)
    └─ Enable SSL/HTTPS
    └─ Set up domain/reverse proxy
    └─ Enable rate limiting
    └─ Set up monitoring
```

---

This architecture ensures:
✅ Secure authentication
✅ Proper authorization
✅ Real-time updates
✅ Data persistence
✅ Scalability
✅ User separation
✅ Role-based access
