const User = require('../models/User');

class AdminService {
  // Get all admins (system and school)
  static async getAllAdmins(currentUser, filters = {}) {
    const query = { role: { $in: ['systemAdmin', 'schoolAdmin'] }, isActive: true };

    // systemAdmin: can view all admins (optionally filter by schoolId)
    // schoolAdmin: can view only admins from their own school
    if (currentUser.role === 'schoolAdmin') {
      query['adminInfo.schoolId'] = currentUser.adminInfo?.schoolId;
    } else if (currentUser.role === 'systemAdmin' && filters.schoolId) {
      query['adminInfo.schoolId'] = filters.schoolId;
    }

    if (filters.search) {
      query.$or = [
        { firstName: { $regex: filters.search, $options: 'i' } },
        { lastName: { $regex: filters.search, $options: 'i' } },
        { email: { $regex: filters.search, $options: 'i' } },
        { username: { $regex: filters.search, $options: 'i' } }
      ];
    }

    const admins = await User.find(query).select('-password');
    return admins;
  }

  // Get admin by ID
  static async getAdminById(adminId, currentUser) {
    const admin = await User.findOne({
      _id: adminId,
      role: { $in: ['systemAdmin', 'schoolAdmin'] },
      isActive: true
    }).select('-password');

    if (!admin) {
      throw new Error('Admin not found');
    }

    // schoolAdmin can only see admins in their school
    if (currentUser.role === 'schoolAdmin') {
      if (admin.adminInfo?.schoolId !== currentUser.adminInfo?.schoolId) {
        throw new Error('Access denied to this admin');
      }
    }

    return admin;
  }

  // Create new admin
  static async createAdmin(adminData, currentUser) {
    // Ensure role is set to admin
    adminData.role = adminData.role || 'schoolAdmin';

    // Validate admin role
    if (!['systemAdmin', 'schoolAdmin'].includes(adminData.role)) {
      throw new Error('Invalid admin role');
    }

    // Check permissions
    if (currentUser.role === 'schoolAdmin') {
      if (adminData.role === 'systemAdmin') {
        throw new Error('School admins cannot create system admins');
      }
      if (adminData.adminInfo?.schoolId !== currentUser.adminInfo?.schoolId) {
        throw new Error('School admins can only create admins for their own school');
      }
    }

    // Validate school admin requirements
    if (adminData.role === 'schoolAdmin') {
      if (!adminData.adminInfo?.schoolId || !adminData.adminInfo?.schoolName) {
        throw new Error('School admin must have school information');
      }
    }

    // Check system admin uniqueness
    if (adminData.role === 'systemAdmin') {
      const existingSystemAdmin = await User.findOne({ role: 'systemAdmin', isActive: true });
      if (existingSystemAdmin) {
        throw new Error('System admin already exists');
      }
    }

    const admin = new User(adminData);
    await admin.save();
    return admin.toPublicJSON();
  }

  // Update admin
  static async updateAdmin(adminId, updateData, currentUser) {
    const admin = await User.findOne({
      _id: adminId,
      role: { $in: ['systemAdmin', 'schoolAdmin'] },
      isActive: true
    });

    if (!admin) {
      throw new Error('Admin not found');
    }

    // Check permissions
    if (currentUser.role === 'schoolAdmin') {
      if (admin.adminInfo?.schoolId !== currentUser.adminInfo?.schoolId) {
        throw new Error('School admins can only update admins from their own school');
      }
      if (updateData.role === 'systemAdmin') {
        throw new Error('School admins cannot promote users to system admin');
      }
    }

    const updatedAdmin = await User.findOneAndUpdate(
      { _id: adminId },
      updateData,
      { new: true, runValidators: true }
    ).select('-password');

    return updatedAdmin;
  }

  // Delete admin (soft delete)
  static async deleteAdmin(adminId, currentUser) {
    const admin = await User.findOne({
      _id: adminId,
      role: { $in: ['systemAdmin', 'schoolAdmin'] },
      isActive: true
    });

    if (!admin) {
      throw new Error('Admin not found');
    }

    // Check permissions
    if (currentUser.role === 'schoolAdmin') {
      if (admin.adminInfo?.schoolId !== currentUser.adminInfo?.schoolId) {
        throw new Error('School admins can only delete admins from their own school');
      }
      if (admin.role === 'systemAdmin') {
        throw new Error('School admins cannot delete system admins');
      }
    }

    // Prevent self-deletion
    if (adminId === currentUser._id.toString()) {
      throw new Error('Cannot delete your own account');
    }

    const deletedAdmin = await User.findOneAndUpdate(
      { _id: adminId },
      { isActive: false },
      { new: true }
    );

    return deletedAdmin;
  }

  // Get dashboard statistics
  static async getDashboardStats(currentUser) {
    let query = { isActive: true };

    // School admins can only see their school's data
    if (currentUser.role === 'schoolAdmin') {
      query['adminInfo.schoolId'] = currentUser.adminInfo.schoolId;
    }

    const totalStudents = await User.countDocuments({ ...query, role: 'student' });
    const totalParents = await User.countDocuments({ ...query, role: 'parent' });
    const totalAdmins = await User.countDocuments({
      ...query,
      role: { $in: ['systemAdmin', 'schoolAdmin'] }
    });

    // Get students by status
    const studentsByStatus = await User.aggregate([
      { $match: { ...query, role: 'student' } },
      { $group: { _id: '$trackingInfo.status', count: { $sum: 1 } } }
    ]);

    // Get students by grade
    const studentsByGrade = await User.aggregate([
      { $match: { ...query, role: 'student' } },
      { $group: { _id: '$studentInfo.grade', count: { $sum: 1 } } }
    ]);

    // Get admins by role
    const adminsByRole = await User.aggregate([
      { $match: { ...query, role: { $in: ['systemAdmin', 'schoolAdmin'] } } },
      { $group: { _id: '$role', count: { $sum: 1 } } }
    ]);

    return {
      totalStudents,
      totalParents,
      totalAdmins,
      studentsByStatus,
      studentsByGrade,
      adminsByRole
    };
  }

  // Get system overview
  static async getSystemOverview(currentUser) {
    let query = { isActive: true };

    // School admins can only see their school's data
    if (currentUser.role === 'schoolAdmin') {
      query['adminInfo.schoolId'] = currentUser.adminInfo.schoolId;
    }

    const recentStudents = await User.find({ ...query, role: 'student' })
      .sort({ createdAt: -1 })
      .limit(5)
      .populate('studentInfo.parentId');

    const recentParents = await User.find({ ...query, role: 'parent' })
      .sort({ createdAt: -1 })
      .limit(5);

    const recentAdmins = await User.find({
      ...query,
      role: { $in: ['systemAdmin', 'schoolAdmin'] }
    })
      .sort({ createdAt: -1 })
      .limit(5);

    return {
      recentStudents,
      recentParents,
      recentAdmins
    };
  }

  // Bulk operations
  static async bulkUpdateStudents(updates, currentUser) {
    let filter = { role: 'student', isActive: true };

    // School admins can only update students from their school
    if (currentUser.role === 'schoolAdmin') {
      filter['adminInfo.schoolId'] = currentUser.adminInfo.schoolId;
    }

    const operations = updates.map(update => ({
      updateOne: {
        filter: { ...filter, _id: update.studentId },
        update: update.data
      }
    }));

    const result = await User.bulkWrite(operations);
    return result;
  }

  // Export students data
  static async exportStudentsData(filters = {}, currentUser) {
    let query = { role: 'student', isActive: true };

    // School admins can only export their school's data
    if (currentUser.role === 'schoolAdmin') {
      query['adminInfo.schoolId'] = currentUser.adminInfo.schoolId;
    }

    if (filters.grade) {
      query['studentInfo.grade'] = filters.grade;
    }

    if (filters.busNumber) {
      query['busInfo.busNumber'] = filters.busNumber;
    }

    const students = await User.find(query)
      .populate('studentInfo.parentId')
      .select('-__v -createdAt -updatedAt -password');

    return students;
  }

  // Get admin activity log
  static async getAdminActivityLog(adminId, currentUser) {
    const admin = await User.findOne({
      _id: adminId,
      role: { $in: ['systemAdmin', 'schoolAdmin'] },
      isActive: true
    }).select('-password');

    if (!admin) {
      throw new Error('Admin not found');
    }

    // Check access permissions
    if (currentUser.role === 'schoolAdmin') {
      if (admin.adminInfo?.schoolId !== currentUser.adminInfo?.schoolId) {
        throw new Error('Access denied to this admin');
      }
    }

    return {
      admin,
      lastLogin: admin.lastLogin,
      createdAt: admin.createdAt
    };
  }

  // Get all users with pagination and filters
  static async getAllUsers(filters = {}, pagination = {}, currentUser) {
    const { page = 1, limit = 10 } = pagination;
    const { role, search, isActive, schoolId } = filters;

    let query = {};

    if (role) {
      query.role = role;
    }

    if (typeof isActive === 'boolean') {
      query.isActive = isActive;
    }

    // School admins can only see users from their school
    if (currentUser.role === 'schoolAdmin') {
      query['adminInfo.schoolId'] = currentUser.adminInfo.schoolId;
    } else if (schoolId && currentUser.role === 'systemAdmin') {
      query['adminInfo.schoolId'] = schoolId;
    }

    if (search) {
      query.$or = [
        { firstName: { $regex: search, $options: 'i' } },
        { lastName: { $regex: search, $options: 'i' } },
        { email: { $regex: search, $options: 'i' } },
        { username: { $regex: search, $options: 'i' } }
      ];
    }

    const users = await User.find(query)
      .select('-password')
      .limit(limit * 1)
      .skip((page - 1) * limit)
      .sort({ createdAt: -1 });

    const total = await User.countDocuments(query);

    return {
      users,
      totalPages: Math.ceil(total / limit),
      currentPage: page,
      total
    };
  }

  // Update user role
  static async updateUserRole(userId, newRole, currentUser) {
    const user = await User.findById(userId);
    if (!user) {
      throw new Error('User not found');
    }

    // Check permissions
    if (currentUser.role === 'schoolAdmin') {
      if (newRole === 'systemAdmin') {
        throw new Error('School admins cannot promote users to system admin');
      }
      if (user.adminInfo?.schoolId !== currentUser.adminInfo?.schoolId) {
        throw new Error('School admins can only manage users within their school');
      }
    }

    // Validate role transition
    if (user.role === 'systemAdmin' && newRole !== 'systemAdmin') {
      throw new Error('Cannot downgrade system admin role');
    }

    user.role = newRole;
    await user.save();

    return user.toPublicJSON();
  }

  // Toggle user account status
  static async toggleUserStatus(userId, isActive, currentUser) {
    const user = await User.findById(userId);
    if (!user) {
      throw new Error('User not found');
    }

    // Check permissions
    if (currentUser.role === 'schoolAdmin') {
      if (user.adminInfo?.schoolId !== currentUser.adminInfo?.schoolId) {
        throw new Error('School admins can only manage users within their school');
      }
    }

    const updatedUser = await User.findByIdAndUpdate(
      userId,
      { isActive },
      { new: true, runValidators: true }
    ).select('-password');

    return updatedUser;
  }

  // Get user statistics by role
  static async getUserStatsByRole(currentUser) {
    let match = {};

    // School admins can only see their school's stats
    if (currentUser.role === 'schoolAdmin') {
      match['adminInfo.schoolId'] = currentUser.adminInfo.schoolId;
    }

    const stats = await User.aggregate([
      { $match: match },
      { $group: { _id: '$role', count: { $sum: 1 } } },
      { $sort: { count: -1 } }
    ]);

    return stats;
  }

  // Get school admins by school
  static async getSchoolAdminsBySchool(schoolId, currentUser) {
    // Check access permissions
    if (currentUser.role === 'schoolAdmin') {
      if (schoolId !== currentUser.adminInfo?.schoolId) {
        throw new Error('Access denied to this school');
      }
    }

    const admins = await User.find({
      role: 'schoolAdmin',
      'adminInfo.schoolId': schoolId,
      isActive: true
    }).select('-password');

    return admins;
  }
}

module.exports = AdminService; 