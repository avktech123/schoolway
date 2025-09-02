const User = require('../models/User');

class TrackingService {
  // Update student location
  static async updateStudentLocation(studentId, locationData) {
    const { latitude, longitude, timestamp, status } = locationData;
    
    const student = await User.findOneAndUpdate(
      { _id: studentId, role: 'student', isActive: true },
      {
        'trackingInfo.location': {
          latitude,
          longitude,
          timestamp: timestamp || new Date()
        },
        'trackingInfo.status': status || 'tracking',
        'trackingInfo.lastUpdated': new Date()
      },
      { new: true, runValidators: true }
    );
    
    if (!student) {
      throw new Error('Student not found');
    }
    
    return student;
  }

  // Update student status
  static async updateStudentStatus(studentId, status, additionalInfo = {}) {
    const updateData = {
      'trackingInfo.status': status,
      'trackingInfo.lastUpdated': new Date()
    };
    
    // Add additional info if provided
    if (additionalInfo.location) {
      updateData['trackingInfo.location'] = additionalInfo.location;
    }
    
    if (additionalInfo.notes) {
      updateData['trackingInfo.notes'] = additionalInfo.notes;
    }
    
    const student = await User.findOneAndUpdate(
      { _id: studentId, role: 'student', isActive: true },
      updateData,
      { new: true, runValidators: true }
    );
    
    if (!student) {
      throw new Error('Student not found');
    }
    
    return student;
  }

  // Get students by status
  static async getStudentsByStatus(status) {
    const students = await User.find({
      role: 'student',
      'trackingInfo.status': status,
      isActive: true
    }).populate('studentInfo.parentId');
    
    return students;
  }

  // Get students by location (within radius)
  static async getStudentsByLocation(location, radiusKm = 5) {
    const { latitude, longitude } = location;
    
    // Convert radius to degrees (approximate)
    const radiusDegrees = radiusKm / 111;
    
    const students = await User.find({
      role: 'student',
      isActive: true,
      'trackingInfo.location.latitude': {
        $gte: latitude - radiusDegrees,
        $lte: latitude + radiusDegrees
      },
      'trackingInfo.location.longitude': {
        $gte: longitude - radiusDegrees,
        $lte: longitude + radiusDegrees
      }
    }).populate('studentInfo.parentId');
    
    return students;
  }

  // Get tracking history for a student
  static async getStudentTrackingHistory(studentId, limit = 100) {
    const student = await User.findOne({
      _id: studentId,
      role: 'student',
      isActive: true
    });
    
    if (!student) {
      throw new Error('Student not found');
    }
    
    // This would typically come from a separate tracking history collection
    // For now, returning current tracking info
    return {
      studentId,
      currentLocation: student.trackingInfo.location,
      currentStatus: student.trackingInfo.status,
      lastUpdated: student.trackingInfo.lastUpdated
    };
  }

  // Get real-time tracking data
  static async getRealTimeTrackingData(filters = {}) {
    let query = { role: 'student', isActive: true };
    
    if (filters.status) {
      query['trackingInfo.status'] = filters.status;
    }
    
    if (filters.busNumber) {
      query['busInfo.busNumber'] = filters.busNumber;
    }
    
    const students = await User.find(query)
      .select('trackingInfo busInfo firstName lastName studentInfo')
      .populate('studentInfo.parentId', 'firstName lastName phone');
    
    return students;
  }

  // Bulk status update
  static async bulkUpdateStatus(updates) {
    const operations = updates.map(update => ({
      updateOne: {
        filter: { _id: update.studentId, role: 'student', isActive: true },
        update: {
          'trackingInfo.status': update.status,
          'trackingInfo.lastUpdated': new Date()
        }
      }
    }));
    
    const result = await User.bulkWrite(operations);
    return result;
  }

  // Get tracking analytics
  static async getTrackingAnalytics() {
    // Get students by status
    const statusCounts = await User.aggregate([
      { $match: { role: 'student', isActive: true } },
      { $group: { _id: '$trackingInfo.status', count: { $sum: 1 } } }
    ]);
    
    // Get students by bus
    const busCounts = await User.aggregate([
      { $match: { role: 'student', isActive: true } },
      { $group: { _id: '$busInfo.busNumber', count: { $sum: 1 } } }
    ]);
    
    // Get recent updates
    const recentUpdates = await User.find({
      role: 'student',
      isActive: true,
      'trackingInfo.lastUpdated': {
        $gte: new Date(Date.now() - 24 * 60 * 60 * 1000) // Last 24 hours
      }
    }).select('trackingInfo firstName lastName studentInfo');
    
    return {
      statusCounts,
      busCounts,
      recentUpdates
    };
  }

  // Emergency alert system
  static async sendEmergencyAlert(studentId, alertData) {
    const { type, message, location } = alertData;
    
    const student = await User.findOneAndUpdate(
      { _id: studentId, role: 'student', isActive: true },
      {
        'trackingInfo.status': 'emergency',
        'trackingInfo.emergencyAlert': {
          type,
          message,
          location,
          timestamp: new Date()
        },
        'trackingInfo.lastUpdated': new Date()
      },
      { new: true, runValidators: true }
    );
    
    if (!student) {
      throw new Error('Student not found');
    }
    
    return student;
  }

  // Get bus tracking summary
  static async getBusTrackingSummary(busNumber) {
    const students = await User.find({
      role: 'student',
      'busInfo.busNumber': busNumber,
      isActive: true
    }).select('trackingInfo busInfo firstName lastName studentInfo');
    
    const summary = {
      busNumber,
      totalStudents: students.length,
      onBus: students.filter(s => s.trackingInfo.status === 'tracking').length,
      atSchool: students.filter(s => s.trackingInfo.status === 'active').length,
      emergency: students.filter(s => s.trackingInfo.status === 'emergency').length,
      students: students.map(s => ({
        name: `${s.firstName} ${s.lastName}`,
        status: s.trackingInfo.status,
        lastLocation: s.trackingInfo.location,
        lastUpdated: s.trackingInfo.lastUpdated,
        pickupLocation: s.busInfo.pickupLocation,
        dropLocation: s.busInfo.dropLocation
      }))
    };
    
    return summary;
  }

  // Get tracking statistics by grade
  static async getTrackingStatsByGrade() {
    const stats = await User.aggregate([
      { $match: { role: 'student', isActive: true } },
      {
        $group: {
          _id: '$studentInfo.grade',
          totalStudents: { $sum: 1 },
          activeStudents: {
            $sum: { $cond: [{ $eq: ['$trackingInfo.status', 'active'] }, 1, 0] }
          },
          trackingStudents: {
            $sum: { $cond: [{ $eq: ['$trackingInfo.status', 'tracking'] }, 1, 0] }
          },
          emergencyStudents: {
            $sum: { $cond: [{ $eq: ['$trackingInfo.status', 'emergency'] }, 1, 0] }
          }
        }
      },
      { $sort: { _id: 1 } }
    ]);
    
    return stats;
  }

  // Get students with no recent tracking data
  static async getStudentsWithNoRecentTracking(hours = 24) {
    const cutoffTime = new Date(Date.now() - hours * 60 * 60 * 1000);
    
    const students = await User.find({
      role: 'student',
      isActive: true,
      $or: [
        { 'trackingInfo.lastUpdated': { $lt: cutoffTime } },
        { 'trackingInfo.lastUpdated': { $exists: false } }
      ]
    }).select('firstName lastName studentInfo trackingInfo busInfo');
    
    return students;
  }
}

module.exports = TrackingService; 