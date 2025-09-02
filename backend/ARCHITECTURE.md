# Backend Architecture Documentation

## Overview

This backend follows a clean, layered architecture pattern with clear separation of concerns and a unified user management system with four distinct roles:

```
Routes → Controllers → Services → Models
```

## Architecture Layers

### 1. Routes Layer (`/src/routes/`)
- **Purpose**: Define API endpoints and handle HTTP-specific concerns
- **Responsibilities**:
  - Route definition and HTTP method handling
  - Middleware application (authentication, authorization)
  - Delegating requests to appropriate controllers
- **Files**:
  - `auth.js` - Unified authentication endpoints for all user types
  - `students.js` - Student management endpoints
  - `admin.js` - Admin management endpoints
  - `tracking.js` - Student tracking endpoints

### 2. Controllers Layer (`/src/controllers/`)
- **Purpose**: Handle HTTP requests and responses
- **Responsibilities**:
  - Request/response handling
  - **Input validation using express-validator**
  - **Validation error processing**
  - Error handling and status code management
  - Delegating business logic to services
  - Formatting responses
- **Files**:
  - `authController.js` - Unified authentication logic for all user types
  - `studentController.js` - Student management logic
  - `adminController.js` - Admin management logic
  - `trackingController.js` - Tracking logic

### 3. Services Layer (`/src/services/`)
- **Purpose**: Handle business logic and data operations
- **Responsibilities**:
  - Business logic implementation
  - Database operations through models
  - Data validation and transformation
  - Error handling for business rules
  - Reusable business functions
- **Files**:
  - `authService.js` - Unified authentication business logic
  - `studentService.js` - Student management business logic
  - `adminService.js` - Admin management business logic
  - `trackingService.js` - Tracking business logic
  - `utilityService.js` - Common utility functions

### 4. Models Layer (`/src/models/`)
- **Purpose**: Define data structures and database schemas
- **Responsibilities**:
  - MongoDB schema definition
  - Data validation rules
  - Database operations (CRUD)
  - Business logic methods
- **Files**:
  - `User.js` - Unified user model with role-based access control

### 5. Application Layer (`/src/app.js`)
- **Purpose**: Configure Express application and middleware
- **Responsibilities**:
  - Express app configuration
  - Middleware setup (CORS, body parsing, logging)
  - Route registration
  - Error handling middleware
  - Health check endpoints
- **Benefits**:
  - Separation of app configuration from server startup
  - Easier testing (can import app without starting server)
  - Better modularity

### 6. Server Layer (`/src/server.js`)
- **Purpose**: Handle server startup and database connection
- **Responsibilities**:
  - MongoDB connection management
  - Server startup and port binding
  - Graceful shutdown handling
  - Process signal handling
- **Benefits**:
  - Focused on server lifecycle management
  - Clean separation from application logic
  - Easier deployment and process management

## Validation Strategy

### **Controller-Level Validation**
- **Location**: All input validation is now handled in controllers
- **Benefits**: 
  - Cleaner route definitions
  - Better separation of concerns
  - Validation logic is closer to where it's used
  - Easier to maintain and test validation rules
- **Implementation**: Using `express-validator` with `Promise.all()` for async validation

### **Validation Pattern**
```javascript
// In controllers
static async methodName(req, res) {
  try {
    // Validation rules
    const validationRules = [
      body('field').notEmpty().trim(),
      body('email').isEmail().normalizeEmail(),
      // ... more rules
    ];

    // Run validation
    await Promise.all(validationRules.map(validation => validation.run(req)));

    // Check validation errors
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        message: 'Validation error',
        errors: errors.array()
      });
    }

    // Proceed with business logic
    const result = await Service.methodName(req.body);
    // ... rest of the method
  } catch (error) {
    // Error handling
  }
}
```

### **Route Definitions**
- **Clean Routes**: Routes now only define endpoints and middleware
- **No Validation**: Routes are focused purely on routing concerns
- **Better Readability**: Easier to understand API structure at a glance

## Unified User Model Design

### Key Benefits of Unified Approach
1. **Single Source of Truth**: All user types (students, parents, admins) are managed in one model
2. **Role-Based Access Control**: Flexible role system with `systemAdmin`, `schoolAdmin`, `student`, `parent`
3. **Reduced Complexity**: No need to manage relationships between separate models
4. **Easier Maintenance**: Single model to update and maintain
5. **Better Performance**: Fewer database collections and joins

### User Model Structure
```javascript
{
  // Basic user information
  username, email, password, firstName, lastName, phone,
  
  // Role-based system
  role: 'systemAdmin' | 'schoolAdmin' | 'student' | 'parent',
  
  // Role-specific fields (conditionally required)
  studentInfo: { studentId, grade, section, parentId, ... },
  parentInfo: { relationship, children, address, emergencyContacts, ... },
  adminInfo: { permissions, schoolId, schoolName, department, employeeId, accessLevel, ... },
  
  // Common fields
  busInfo, trackingInfo, profilePicture, lastLogin, ...
}
```

### Role Hierarchy and Permissions

#### 1. System Admin (`systemAdmin`)
- **Highest Level Access**: Can manage the entire system
- **Permissions**: All permissions including system management
- **Scope**: Global access to all schools and users
- **Unique**: Only one system admin can exist
- **Capabilities**:
  - Create/manage school admins
  - Access all school data
  - System-wide configuration
  - User role management

#### 2. School Admin (`schoolAdmin`)
- **School-Level Access**: Can manage their assigned school
- **Permissions**: School-specific permissions
- **Scope**: Limited to their assigned school
- **Requirements**: Must have `schoolId` and `schoolName`
- **Capabilities**:
  - Manage students and parents within their school
  - School-specific tracking and reporting
  - Bus management
  - Limited user management (cannot create system admins)

#### 3. Student (`student`)
- **Basic Access**: Can view their own information and tracking
- **Requirements**: Must have parent information
- **Scope**: Personal data and tracking information
- **Capabilities**:
  - View personal profile
  - Access tracking information
  - View bus details

#### 4. Parent (`parent`)
- **Family Access**: Can view their children's information
- **Requirements**: Must have relationship information
- **Scope**: Their children's data and tracking
- **Capabilities**:
  - View children's profiles
  - Access children's tracking
  - Emergency contact management

### Permission System
```javascript
// System Admin permissions
'manage_system', 'manage_schools', 'manage_all_users', 'view_all_data'

// School Admin permissions
'manage_school_users', 'manage_students', 'manage_tracking', 'view_reports',
'manage_buses', 'manage_schedules', 'manage_notifications'
```

### Access Control Features
- **Role-Based Permissions**: Each role has specific capabilities
- **School Isolation**: School admins can only access their school's data
- **Permission Checking**: Built-in methods to verify user permissions
- **School Access Control**: Methods to check if users can access specific schools

## Key Benefits

### 1. Separation of Concerns
- Each layer has a specific responsibility
- Business logic is separated from HTTP handling
- Data access is separated from business logic
- **Validation is separated from routing**
- **Application configuration is separated from server management**

### 2. Maintainability
- Easy to locate and modify specific functionality
- Clear dependencies between layers
- Reduced code duplication
- **Validation rules are centralized in controllers**
- **App configuration is centralized in app.js**

### 3. Testability
- Each layer can be tested independently
- Services can be unit tested without HTTP context
- Controllers can be tested with mocked services
- **Validation logic can be tested separately**
- **App can be tested without starting server**

### 4. Scalability
- Easy to add new features by extending existing layers
- Services can be reused across different controllers
- Clear structure for team development
- **Validation patterns are consistent across controllers**
- **Modular app structure for easier scaling**

### 5. Unified User Management
- Single authentication system for all user types
- Consistent user management across the application
- Easier to implement cross-role features

### 6. Multi-School Support
- Built-in school isolation for security
- Scalable architecture for multiple schools
- Role-based access control per school

## Data Flow

```
HTTP Request → Route → Controller → Validation → Service → User Model → Database
Database → User Model → Service → Controller → Route → HTTP Response
```

## Application Flow

```
server.js → app.js → routes → controllers → services → models → database
```

## Error Handling

### Controller Level
- HTTP status codes
- Response formatting
- **Input validation errors**
- **Validation error processing**

### Service Level
- Business logic errors
- Database operation errors
- Custom error messages

### Model Level
- Schema validation errors
- Database constraint errors

### App Level (`app.js`)
- Global error handling middleware
- 404 route handling
- Validation error formatting
- MongoDB error handling

## Validation

### **Controller Level (express-validator)**
- **Input sanitization**
- **Format validation**
- **Required field validation**
- **Role-specific validation rules**
- **Async validation execution**
- **Validation error formatting**

### Service Level
- Business rule validation
- Data integrity checks
- Custom validation logic

### Model Level
- Schema validation errors
- Database constraint errors

## Authentication & Authorization

### Middleware (`/src/middleware/`)
- JWT token validation
- Role-based access control
- User authentication checks

### Service Integration
- Services receive authenticated user context
- Authorization checks in service methods
- Secure data access patterns

## File Structure

```
src/
├── app.js           # Express app configuration, middleware, and routes
├── server.js        # Server startup and database connection
├── routes/          # API endpoint definitions (no validation)
├── controllers/     # HTTP request/response handling + validation
├── services/        # Business logic implementation
├── models/          # Unified user model
├── middleware/      # Authentication and validation
├── config/          # Configuration files
└── index.js         # Application entry point (optional)
```

## Best Practices

### 1. Naming Conventions
- Controllers: `*Controller.js`
- Services: `*Service.js`
- Models: PascalCase (e.g., `User.js`)
- Routes: lowercase with hyphens (e.g., `auth.js`)
- App files: `app.js` for Express app, `server.js` for server management

### 2. Error Handling
- Use try-catch blocks in controllers and services
- Return meaningful error messages
- Log errors for debugging
- **Handle validation errors consistently**
- **Global error handling in app.js**

### 3. Input Validation
- **Validate at controller level with express-validator**
- **Use async validation with Promise.all()**
- Sanitize inputs in services
- Use role-specific validation rules
- **Format validation errors consistently**

### 4. Database Operations
- Handle database errors gracefully
- Use transactions for complex operations
- Implement proper indexing strategies

### 5. Security
- Validate and sanitize all inputs
- Use parameterized queries
- Implement proper authentication checks
- Role-based access control
- School data isolation

### 6. Application Structure
- **Separate app configuration from server startup**
- **Centralize middleware in app.js**
- **Keep server.js focused on lifecycle management**
- **Modular route organization**

## Example Usage

### Adding a New User Type

1. **Update User Model** (`/src/models/User.js`)
   - Add new role to enum
   - Add role-specific fields
   - Update validation rules

2. **Update Auth Service** (`/src/services/authService.js`)
   - Add role-specific validation
   - Handle new role requirements

3. **Update Auth Controller** (`/src/controllers/authController.js`)
   - Add validation rules for new role
   - Handle new role requirements

4. **Update Routes** (`/src/routes/auth.js`)
   - Add new endpoint (no validation needed)

5. **Routes are automatically registered in app.js**

### Adding a New Feature

1. **Create/Update Service** (`/src/services/`)
   - Implement business logic
   - Handle data operations

2. **Create/Update Controller** (`/src/controllers/`)
   - Handle HTTP requests/responses
   - **Add validation rules**
   - Call appropriate service methods

3. **Create/Update Routes** (`/src/routes/`)
   - Define API endpoints
   - Apply middleware and authentication
   - **No validation needed**

4. **Routes are automatically registered in app.js**

## Testing Strategy

### Unit Tests
- Test services independently
- Mock database operations
- Test business logic thoroughly
- **Test validation logic in controllers**
- **Test app.js configuration separately**

### Integration Tests
- Test controller-service interactions
- Test route-controller flow
- Test database operations
- **Test validation error handling**
- **Test app middleware stack**

### API Tests
- Test complete API endpoints
- Validate response formats
- Test error scenarios
- Test role-based access
- Test school isolation
- **Test validation error responses**
- **Test app-level error handling**

## Performance Considerations

### Database
- Use proper indexing on role and frequently queried fields
- Implement pagination for large datasets
- Optimize database queries
- School-specific indexing for better performance

### Caching
- Cache frequently accessed data
- Implement Redis for session storage
- Use in-memory caching for static data

### Async Operations
- Use async/await consistently
- Handle concurrent requests properly
- Implement proper error handling for async operations
- **Use Promise.all() for validation rules**

### Application Structure
- **Modular app configuration for better performance**
- **Efficient middleware stack**
- **Optimized route registration**

## Migration from Separate Models

### Benefits of Migration
1. **Simplified Architecture**: Single user model instead of three separate ones
2. **Better Relationships**: Easier to manage parent-child relationships
3. **Unified Authentication**: Single signup/signin system
4. **Consistent API**: Same endpoints for all user types
5. **Easier Maintenance**: One model to update instead of three
6. **Multi-School Support**: Built-in school isolation and management
7. **Better Validation**: Centralized validation in controllers
8. **Better Structure**: Separated app configuration from server management

### Migration Steps
1. Create unified User model with role-based fields
2. Update services to use new model
3. Update controllers to handle unified approach
4. **Move validation from routes to controllers**
5. Update routes to use unified endpoints
6. **Separate app configuration into app.js**
7. **Update server.js to focus on server management**
8. Remove old separate models
9. Update documentation and tests
10. Implement school-based access control 