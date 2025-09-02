# SchoolWay Backend API

A comprehensive backend API for a school bus tracking system built with Node.js, Express, and MongoDB.

## 🚀 Features

- **Authentication System**: JWT-based authentication for admins and parents
- **Student Management**: Complete CRUD operations for student records
- **Real-time Tracking**: Location updates and status tracking for students
- **Role-based Access Control**: Super admin, admin, and moderator roles
- **Parent Portal**: Secure access to child tracking information
- **Bus Management**: Track students by bus numbers and routes
- **Data Validation**: Input validation and sanitization
- **Security**: Password hashing, JWT tokens, and middleware protection

## 🛠️ Tech Stack

- **Runtime**: Node.js
- **Framework**: Express.js
- **Database**: MongoDB with Mongoose ODM
- **Authentication**: JWT (JSON Web Tokens)
- **Password Hashing**: bcryptjs
- **Validation**: express-validator
- **CORS**: Cross-origin resource sharing

## 📋 Prerequisites

- Node.js (v14 or higher)
- MongoDB (v4.4 or higher)
- npm or yarn

## 🚀 Installation

1. **Clone the repository**
   ```bash
   cd backend
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Environment Setup**
   Create a `.env` file in the root directory:
   ```env
   PORT=3001
   NODE_ENV=development
   MONGODB_URI=mongodb://localhost:27017/schoolway
   JWT_SECRET=your-super-secret-jwt-key-here
   JWT_EXPIRES_IN=7d
   CORS_ORIGIN=http://localhost:3000
   ```

4. **Start MongoDB**
   Make sure MongoDB is running on your system:
   ```bash
   # On Ubuntu/Debian
   sudo systemctl start mongod
   
   # On macOS with Homebrew
   brew services start mongodb-community
   
   # On Windows
   net start MongoDB
   ```

5. **Seed the database** (Optional)
   ```bash
   npm run seed
   ```

6. **Start the server**
   ```bash
   # Development mode
   npm run dev
   
   # Production mode
   npm start
   ```

## 🔐 Default Super Admin

After running the seed script, you'll have a default super admin account:
- **Username**: `superadmin`
- **Password**: `admin123`
- **Email**: `admin@schoolway.com`

⚠️ **IMPORTANT**: Change these credentials immediately after first login!

## 📚 API Endpoints

### Authentication

#### Admin Authentication
- `POST /api/auth/admin/signup` - Create new admin account
- `POST /api/auth/admin/signin` - Admin login
- `GET /api/auth/profile` - Get current user profile
- `PUT /api/auth/change-password` - Change password

#### Parent Authentication
- `POST /api/auth/parent/signup` - Create new parent account
- `POST /api/auth/parent/signin` - Parent login

### Student Management

#### Admin Only
- `GET /api/students` - Get all students (with pagination and filters)
- `POST /api/students` - Create new student
- `PUT /api/students/:id` - Update student
- `DELETE /api/students/:id` - Delete student (soft delete)
- `PUT /api/students/bulk/status` - Bulk update student status

#### All Authenticated Users
- `GET /api/students/:id` - Get student by ID
- `GET /api/students/bus/:busNumber` - Get students by bus number
- `GET /api/students/grade/:grade/section/:section` - Get students by grade/section

### Tracking

#### Admin Only
- `GET /api/tracking/all` - Get real-time tracking for all students
- `POST /api/tracking/bulk-location` - Bulk location update
- `GET /api/tracking/stats/overview` - Get tracking statistics

#### All Authenticated Users
- `GET /api/tracking/student/:id` - Get student tracking info
- `GET /api/tracking/student/:id/history` - Get tracking history
- `GET /api/tracking/bus/:busNumber/summary` - Get bus tracking summary

#### Public (for tracking devices)
- `POST /api/tracking/location/:studentId` - Update student location

### Admin Management

#### Super Admin Only
- `GET /api/admin` - Get all admins
- `POST /api/admin` - Create new admin
- `PUT /api/admin/:id` - Update admin
- `DELETE /api/admin/:id` - Delete admin
- `PATCH /api/admin/:id/status` - Activate/deactivate admin
- `GET /api/admin/stats/overview` - Get admin statistics

#### All Admins
- `GET /api/admin/:id` - Get admin by ID
- `PUT /api/admin/:id/password` - Change admin password

## 🔒 Authentication & Authorization

### JWT Token
Include the JWT token in the Authorization header:
```
Authorization: Bearer <your-jwt-token>
```

### Role Hierarchy
1. **super_admin**: Full access to all features
2. **admin**: Can manage students and view tracking data
3. **moderator**: Limited access to student management
4. **parent**: Can only view their children's information

## 📊 Database Schema

### Admin
- Basic info (username, email, password, fullName)
- Role-based permissions
- Account status and last login

### Student
- Personal information (name, DOB, grade, section)
- Parent information
- Bus details (bus number, route, pickup/drop locations)
- Tracking information (location, status, last seen)
- Medical information

### Parent
- Account credentials
- Personal information
- Children references
- Emergency contacts
- Notification preferences

## 🚌 Tracking Status Values

- `at_home` - Student is at home
- `at_pickup` - Student is at pickup location
- `on_bus` - Student is on the bus
- `at_school` - Student is at school
- `at_drop` - Student is at drop location
- `unknown` - Status unknown

## 🧪 Testing the API

### Health Check
```bash
curl http://localhost:3001/api/health
```

### Create Super Admin
```bash
curl -X POST http://localhost:3001/api/auth/admin/signup \
  -H "Content-Type: application/json" \
  -d '{
    "username": "admin",
    "email": "admin@example.com",
    "password": "password123",
    "fullName": "Administrator"
  }'
```

### Admin Login
```bash
curl -X POST http://localhost:3001/api/auth/admin/signin \
  -H "Content-Type: application/json" \
  -d '{
    "username": "admin",
    "password": "password123"
  }'
```

## 📁 Project Structure

```
backend/
├── src/
│   ├── config/
│   │   └── config.js          # Configuration and environment variables
│   ├── middleware/
│   │   └── auth.js            # Authentication middleware
│   ├── models/
│   │   ├── Admin.js           # Admin schema
│   │   ├── Student.js         # Student schema
│   │   └── Parent.js          # Parent schema
│   ├── routes/
│   │   ├── auth.js            # Authentication routes
│   │   ├── students.js        # Student management routes
│   │   ├── tracking.js        # Tracking routes
│   │   └── admin.js           # Admin management routes
│   ├── scripts/
│   │   └── seed.js            # Database seeding script
│   └── server.js              # Main server file
├── package.json
└── README.md
```

## 🚨 Security Considerations

1. **Change default credentials** after first setup
2. **Use strong JWT secrets** in production
3. **Enable HTTPS** in production
4. **Implement rate limiting** for production use
5. **Regular security updates** for dependencies
6. **Input validation** and sanitization
7. **Role-based access control**

## 🔧 Development

### Available Scripts
- `npm start` - Start production server
- `npm run dev` - Start development server with nodemon
- `npm run seed` - Run database seeding

### Adding New Features
1. Create model schema in `models/` directory
2. Add routes in `routes/` directory
3. Update `server.js` to include new routes
4. Add validation and authentication as needed

## 📝 Environment Variables

| Variable | Description | Default |
|----------|-------------|---------|
| `PORT` | Server port | `3001` |
| `NODE_ENV` | Environment | `development` |
| `MONGODB_URI` | MongoDB connection string | `mongodb://localhost:27017/schoolway` |
| `JWT_SECRET` | JWT signing secret | `schoolway-default-secret-key-change-in-production` |
| `JWT_EXPIRES_IN` | JWT expiration time | `7d` |
| `CORS_ORIGIN` | Allowed CORS origin | `http://localhost:3000` |

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Add tests if applicable
5. Submit a pull request

## 📄 License

This project is licensed under the MIT License.

## 🆘 Support

For support and questions:
- Create an issue in the repository
- Contact the development team
- Check the API documentation

## 🔮 Future Enhancements

- [ ] Real-time notifications (WebSocket)
- [ ] GPS tracking integration
- [ ] Mobile app API endpoints
- [ ] Analytics and reporting
- [ ] Multi-school support
- [ ] Advanced search and filtering
- [ ] Export functionality
- [ ] Audit logging 