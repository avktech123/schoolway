class UtilityService {
  // Generate pagination info
  static getPaginationInfo(page, limit, total) {
    const currentPage = parseInt(page) || 1;
    const itemsPerPage = parseInt(limit) || 10;
    const totalPages = Math.ceil(total / itemsPerPage);
    const skip = (currentPage - 1) * itemsPerPage;

    return {
      currentPage,
      itemsPerPage,
      totalPages,
      skip,
      hasNextPage: currentPage < totalPages,
      hasPrevPage: currentPage > 1
    };
  }

  // Build search query
  static buildSearchQuery(searchTerm, searchFields) {
    if (!searchTerm) return {};

    const searchRegex = { $regex: searchTerm, $options: 'i' };
    const searchConditions = searchFields.map(field => ({
      [field]: searchRegex
    }));

    return { $or: searchConditions };
  }

  // Build filter query
  static buildFilterQuery(filters) {
    const query = {};

    Object.keys(filters).forEach(key => {
      if (filters[key] !== undefined && filters[key] !== null && filters[key] !== '') {
        query[key] = filters[key];
      }
    });

    return query;
  }

  // Validate MongoDB ObjectId
  static isValidObjectId(id) {
    const objectIdPattern = /^[0-9a-fA-F]{24}$/;
    return objectIdPattern.test(id);
  }

  // Sanitize input data
  static sanitizeInput(data) {
    if (typeof data === 'string') {
      return data.trim().replace(/[<>]/g, '');
    }
    if (typeof data === 'object' && data !== null) {
      const sanitized = {};
      Object.keys(data).forEach(key => {
        sanitized[key] = this.sanitizeInput(data[key]);
      });
      return sanitized;
    }
    return data;
  }

  // Format date for display
  static formatDate(date, format = 'YYYY-MM-DD HH:mm:ss') {
    if (!date) return null;
    
    const d = new Date(date);
    if (isNaN(d.getTime())) return null;

    const year = d.getFullYear();
    const month = String(d.getMonth() + 1).padStart(2, '0');
    const day = String(d.getDate()).padStart(2, '0');
    const hours = String(d.getHours()).padStart(2, '0');
    const minutes = String(d.getMinutes()).padStart(2, '0');
    const seconds = String(d.getSeconds()).padStart(2, '0');

    return format
      .replace('YYYY', year)
      .replace('MM', month)
      .replace('DD', day)
      .replace('HH', hours)
      .replace('mm', minutes)
      .replace('ss', seconds);
  }

  // Calculate distance between two coordinates (Haversine formula)
  static calculateDistance(lat1, lon1, lat2, lon2) {
    const R = 6371; // Earth's radius in kilometers
    const dLat = this.deg2rad(lat2 - lat1);
    const dLon = this.deg2rad(lon2 - lon1);
    
    const a = Math.sin(dLat / 2) * Math.sin(dLat / 2) +
              Math.cos(this.deg2rad(lat1)) * Math.cos(this.deg2rad(lat2)) *
              Math.sin(dLon / 2) * Math.sin(dLon / 2);
    
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    const distance = R * c; // Distance in kilometers
    
    return distance;
  }

  // Convert degrees to radians
  static deg2rad(deg) {
    return deg * (Math.PI / 180);
  }

  // Generate random string
  static generateRandomString(length = 8) {
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
    let result = '';
    for (let i = 0; i < length; i++) {
      result += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    return result;
  }

  // Validate email format
  static isValidEmail(email) {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  }

  // Validate phone number format
  static isValidPhone(phone) {
    const phoneRegex = /^[\+]?[1-9][\d]{0,15}$/;
    return phoneRegex.test(phone.replace(/[\s\-\(\)]/g, ''));
  }

  // Deep clone object
  static deepClone(obj) {
    if (obj === null || typeof obj !== 'object') return obj;
    if (obj instanceof Date) return new Date(obj.getTime());
    if (obj instanceof Array) return obj.map(item => this.deepClone(item));
    if (typeof obj === 'object') {
      const cloned = {};
      Object.keys(obj).forEach(key => {
        cloned[key] = this.deepClone(obj[key]);
      });
      return cloned;
    }
  }

  // Merge objects deeply
  static deepMerge(target, source) {
    const result = this.deepClone(target);
    
    Object.keys(source).forEach(key => {
      if (source[key] && typeof source[key] === 'object' && !Array.isArray(source[key])) {
        result[key] = this.deepMerge(result[key] || {}, source[key]);
      } else {
        result[key] = source[key];
      }
    });
    
    return result;
  }
}

module.exports = UtilityService; 