const User = require('../models/User');

class StudentService {
  // Get all students with filters
  static async getStudents(filters, pagination, currentUser) {
    const { page = 1, limit = 10 } = pagination;
    const { search, grade, busNumber, status } = filters;
    
    let query = { role: 'student', isActive: true };

    // Scope by school for schoolAdmin
    if (currentUser?.role === 'schoolAdmin' && currentUser.adminInfo?.schoolId) {
      query['adminInfo.schoolId'] = currentUser.adminInfo.schoolId;
    }
    
    // Search functionality
    if (search) {
      query.$or = [
        { firstName: { $regex: search, $options: 'i' } },
        { lastName: { $regex: search, $options: 'i' } },
        { 'studentInfo.studentId': { $regex: search, $options: 'i' } }
      ];
    }
    
    // Filter by grade
    if (grade) {
      query['studentInfo.grade'] = grade;
    }
    
    // Filter by bus number
    if (busNumber) {
      query['busInfo.busNumber'] = busNumber;
    }
    
    // Filter by status
    if (status) {
      query['trackingInfo.status'] = status;
    }
    
    const students = await User.find(query)
      .populate('studentInfo.parentId')
      .limit(limit * 1)
      .skip((page - 1) * limit)
      .sort({ createdAt: -1 });
    
    const total = await User.countDocuments(query);
    
    return {
      students,
      totalPages: Math.ceil(total / limit),
      currentPage: page,
      total
    };
  }

  // Get student by ID
  static async getStudentById(studentId, currentUser) {
    const query = {
      _id: studentId,
      role: 'student',
      isActive: true
    };

    if (currentUser?.role === 'schoolAdmin' && currentUser.adminInfo?.schoolId) {
      query['adminInfo.schoolId'] = currentUser.adminInfo.schoolId;
    }

    const student = await User.findOne(query).populate('studentInfo.parentId');
    
    if (!student) {
      throw new Error('Student not found');
    }
    
    return student;
  }

  // Check if parent has access to student
  static async checkParentAccess(parentId, studentId) {
    const parent = await User.findOne({
      _id: parentId,
      role: 'parent',
      isActive: true
    });
    
    if (!parent) {
      throw new Error('Parent not found');
    }
    
    const hasAccess = parent.parentInfo.children.includes(studentId);
    if (!hasAccess) {
      throw new Error('Access denied to this student');
    }
    
    return true;
  }

  // Create new student
  static async createStudent(studentData, currentUser) {
    // Ensure role is set to student
    studentData.role = 'student';
    
    // Validate required student fields
    if (!studentData.studentInfo || !studentData.studentInfo.parentId) {
      throw new Error('Student must have parent information');
    }

    // Bind to school for schoolAdmin
    if (currentUser?.role === 'schoolAdmin' && currentUser.adminInfo?.schoolId) {
      studentData.adminInfo = studentData.adminInfo || {};
      studentData.adminInfo.schoolId = currentUser.adminInfo.schoolId;
      studentData.adminInfo.schoolName = currentUser.adminInfo.schoolName;
    }

    const student = new User(studentData);
    await student.save();
    
    // Populate parent info for response
    await student.populate('studentInfo.parentId');
    
    return student;
  }

  // Update student
  static async updateStudent(studentId, updateData, currentUser) {
    const query = { _id: studentId, role: 'student', isActive: true };
    if (currentUser?.role === 'schoolAdmin' && currentUser.adminInfo?.schoolId) {
      query['adminInfo.schoolId'] = currentUser.adminInfo.schoolId;
    }

    const student = await User.findOneAndUpdate(
      query,
      updateData,
      { new: true, runValidators: true }
    ).populate('studentInfo.parentId');
    
    if (!student) {
      throw new Error('Student not found');
    }
    
    return student;
  }

  // Delete student (soft delete)
  static async deleteStudent(studentId, currentUser) {
    const query = { _id: studentId, role: 'student', isActive: true };
    if (currentUser?.role === 'schoolAdmin' && currentUser.adminInfo?.schoolId) {
      query['adminInfo.schoolId'] = currentUser.adminInfo.schoolId;
    }

    const student = await User.findOneAndUpdate(
      query,
      { isActive: false },
      { new: true }
    );
    
    if (!student) {
      throw new Error('Student not found');
    }
    
    return student;
  }

  // Get students by parent
  static async getStudentsByParent(parentId) {
    const parent = await User.findOne({
      _id: parentId,
      role: 'parent',
      isActive: true
    }).populate('parentInfo.children');
    
    if (!parent) {
      throw new Error('Parent not found');
    }
    
    return parent.parentInfo.children;
  }

  // Update student tracking info
  static async updateTrackingInfo(studentId, trackingData, currentUser) {
    const query = { _id: studentId, role: 'student', isActive: true };
    if (currentUser?.role === 'schoolAdmin' && currentUser.adminInfo?.schoolId) {
      query['adminInfo.schoolId'] = currentUser.adminInfo.schoolId;
    }

    const student = await User.findOneAndUpdate(
      query,
      { trackingInfo: trackingData },
      { new: true, runValidators: true }
    );
    
    if (!student) {
      throw new Error('Student not found');
    }
    
    return student;
  }

  // Get students by bus number
  static async getStudentsByBus(busNumber, currentUser) {
    const query = {
      role: 'student',
      'busInfo.busNumber': busNumber,
      isActive: true
    };
    if (currentUser?.role === 'schoolAdmin' && currentUser.adminInfo?.schoolId) {
      query['adminInfo.schoolId'] = currentUser.adminInfo.schoolId;
    }
    
    const students = await User.find(query).populate('studentInfo.parentId');
    
    return students;
  }

  // Get students by grade
  static async getStudentsByGrade(grade, currentUser) {
    const query = {
      role: 'student',
      'studentInfo.grade': grade,
      isActive: true
    };
    if (currentUser?.role === 'schoolAdmin' && currentUser.adminInfo?.schoolId) {
      query['adminInfo.schoolId'] = currentUser.adminInfo.schoolId;
    }
    
    const students = await User.find(query).populate('studentInfo.parentId');
    
    return students;
  }

  // Get students by section
  static async getStudentsBySection(grade, section, currentUser) {
    const query = {
      role: 'student',
      'studentInfo.grade': grade,
      'studentInfo.section': section,
      isActive: true
    };
    if (currentUser?.role === 'schoolAdmin' && currentUser.adminInfo?.schoolId) {
      query['adminInfo.schoolId'] = currentUser.adminInfo.schoolId;
    }
    
    const students = await User.find(query).populate('studentInfo.parentId');
    
    return students;
  }

  // Assign student to parent
  static async assignStudentToParent(studentId, parentId, currentUser) {
    // Verify both users exist and have correct roles
    const studentQuery = { _id: studentId, role: 'student', isActive: true };
    if (currentUser?.role === 'schoolAdmin' && currentUser.adminInfo?.schoolId) {
      studentQuery['adminInfo.schoolId'] = currentUser.adminInfo.schoolId;
    }

    const student = await User.findOne(studentQuery);
    
    const parent = await User.findOne({ _id: parentId, role: 'parent', isActive: true });
    
    if (!student) {
      throw new Error('Student not found');
    }
    
    if (!parent) {
      throw new Error('Parent not found');
    }
    
    // Update student's parent
    student.studentInfo.parentId = parentId;
    await student.save();
    
    // Add student to parent's children list
    if (!parent.parentInfo.children.includes(studentId)) {
      parent.parentInfo.children.push(studentId);
      await parent.save();
    }
    
    return {
      student: student.toPublicJSON(),
      parent: parent.toPublicJSON()
    };
  }

  // Remove student from parent
  static async removeStudentFromParent(studentId, parentId, currentUser) {
    const studentQuery = { _id: studentId, role: 'student', isActive: true };
    if (currentUser?.role === 'schoolAdmin' && currentUser.adminInfo?.schoolId) {
      studentQuery['adminInfo.schoolId'] = currentUser.adminInfo.schoolId;
    }

    const student = await User.findOne(studentQuery);
    
    const parent = await User.findOne({ _id: parentId, role: 'parent', isActive: true });
    
    if (!student) {
      throw new Error('Student not found');
    }
    
    if (!parent) {
      throw new Error('Parent not found');
    }
    
    // Remove parent from student
    student.studentInfo.parentId = undefined;
    await student.save();
    
    // Remove student from parent's children list
    parent.parentInfo.children = parent.parentInfo.children.filter(
      childId => childId.toString() !== studentId.toString()
    );
    await parent.save();
    
    return {
      student: student.toPublicJSON(),
      parent: parent.toPublicJSON()
    };
  }

  // Get student statistics
  static async getStudentStats(currentUser) {
    const match = { role: 'student', isActive: true };
    if (currentUser?.role === 'schoolAdmin' && currentUser.adminInfo?.schoolId) {
      match['adminInfo.schoolId'] = currentUser.adminInfo.schoolId;
    }
    
    const totalStudents = await User.countDocuments(match);
    
    const studentsByGrade = await User.aggregate([
      { $match: match },
      { $group: { _id: '$studentInfo.grade', count: { $sum: 1 } } },
      { $sort: { _id: 1 } }
    ]);
    
    const studentsByStatus = await User.aggregate([
      { $match: match },
      { $group: { _id: '$trackingInfo.status', count: { $sum: 1 } } }
    ]);
    
    const studentsByBus = await User.aggregate([
      { $match: { ...match, 'busInfo.busNumber': { $exists: true } } },
      { $group: { _id: '$busInfo.busNumber', count: { $sum: 1 } } }
    ]);
    
    return {
      totalStudents,
      studentsByGrade,
      studentsByStatus,
      studentsByBus
    };
  }
}

module.exports = StudentService; 