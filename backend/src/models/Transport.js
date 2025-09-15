const mongoose = require('mongoose');

// Transport Route Schema
const transportRouteSchema = new mongoose.Schema({
  // Basic Information
  routeName: {
    type: String,
    required: [true, 'Route name is required'],
    trim: true,
    maxlength: [100, 'Route name cannot exceed 100 characters']
  },
  routeNumber: {
    type: String,
    required: [true, 'Route number is required'],
    unique: true,
    trim: true,
    maxlength: [20, 'Route number cannot exceed 20 characters']
  },
  description: {
    type: String,
    maxlength: [500, 'Description cannot exceed 500 characters']
  },
  
  // Route Details
  startingPoint: {
    name: {
      type: String,
      required: [true, 'Starting point name is required']
    },
    address: String,
    coordinates: {
      latitude: Number,
      longitude: Number
    }
  },
  endingPoint: {
    name: {
      type: String,
      required: [true, 'Ending point name is required']
    },
    address: String,
    coordinates: {
      latitude: Number,
      longitude: Number
    }
  },
  
  // Stops
  stops: [{
    stopName: {
      type: String,
      required: [true, 'Stop name is required']
    },
    address: String,
    coordinates: {
      latitude: Number,
      longitude: Number
    },
    sequence: {
      type: Number,
      required: [true, 'Stop sequence is required'],
      min: 1
    },
    arrivalTime: {
      type: String,
      required: [true, 'Arrival time is required'],
      match: [/^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/, 'Time must be in HH:MM format']
    },
    departureTime: {
      type: String,
      required: [true, 'Departure time is required'],
      match: [/^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/, 'Time must be in HH:MM format']
    },
    distance: Number, // Distance from previous stop in km
    landmarks: [String],
    isActive: {
      type: Boolean,
      default: true
    }
  }],
  
  // Route Specifications
  totalDistance: {
    type: Number,
    required: [true, 'Total distance is required'],
    min: 1
  }, // in km
  estimatedTime: {
    type: Number,
    required: [true, 'Estimated time is required'],
    min: 10
  }, // in minutes
  
  // Service Times
  serviceType: {
    type: String,
    enum: ['one-way', 'two-way'],
    default: 'two-way'
  },
  morningSchedule: {
    startTime: {
      type: String,
      required: [true, 'Morning start time is required'],
      match: [/^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/, 'Time must be in HH:MM format']
    },
    endTime: {
      type: String,
      required: [true, 'Morning end time is required'],
      match: [/^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/, 'Time must be in HH:MM format']
    },
    isActive: {
      type: Boolean,
      default: true
    }
  },
  eveningSchedule: {
    startTime: {
      type: String,
      match: [/^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/, 'Time must be in HH:MM format']
    },
    endTime: {
      type: String,
      match: [/^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/, 'Time must be in HH:MM format']
    },
    isActive: {
      type: Boolean,
      default: true
    }
  },
  
  // Days of Operation
  operatingDays: [{
    type: String,
    enum: ['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday']
  }],
  
  // Fee Structure
  feeStructure: [{
    stopRange: {
      from: {
        type: Number,
        required: [true, 'From stop is required']
      },
      to: {
        type: Number,
        required: [true, 'To stop is required']
      }
    },
    monthlyFee: {
      type: Number,
      required: [true, 'Monthly fee is required'],
      min: 0
    },
    quarterlyFee: {
      type: Number,
      min: 0
    },
    yearlyFee: {
      type: Number,
      min: 0
    }
  }],
  
  // Status
  isActive: {
    type: Boolean,
    default: true
  },
  
  // Statistics
  statistics: {
    totalStudents: {
      type: Number,
      default: 0
    },
    totalVehicles: {
      type: Number,
      default: 0
    },
    averageOccupancy: {
      type: Number,
      default: 0
    }
  },
  
  // Created and Updated by
  createdBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  },
  updatedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  }
}, {
  timestamps: true
});

// Vehicle Schema
const vehicleSchema = new mongoose.Schema({
  // Basic Information
  vehicleNumber: {
    type: String,
    required: [true, 'Vehicle number is required'],
    unique: true,
    trim: true,
    uppercase: true
  },
  vehicleType: {
    type: String,
    required: [true, 'Vehicle type is required'],
    enum: ['bus', 'van', 'car', 'auto-rickshaw']
  },
  
  // Vehicle Details
  make: {
    type: String,
    required: [true, 'Vehicle make is required']
  },
  model: {
    type: String,
    required: [true, 'Vehicle model is required']
  },
  year: {
    type: Number,
    required: [true, 'Manufacturing year is required'],
    min: 1980,
    max: new Date().getFullYear() + 1
  },
  color: String,
  
  // Capacity
  seatingCapacity: {
    type: Number,
    required: [true, 'Seating capacity is required'],
    min: 4,
    max: 60
  },
  currentOccupancy: {
    type: Number,
    default: 0,
    min: 0
  },
  
  // Route Assignment
  assignedRoute: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'TransportRoute'
  },
  
  // Driver Information
  driver: {
    name: {
      type: String,
      required: [true, 'Driver name is required']
    },
    licenseNumber: {
      type: String,
      required: [true, 'License number is required'],
      unique: true
    },
    phone: {
      type: String,
      required: [true, 'Driver phone is required']
    },
    address: String,
    experience: Number, // in years
    dateOfJoining: Date,
    emergencyContact: {
      name: String,
      phone: String,
      relationship: String
    }
  },
  
  // Conductor Information (optional)
  conductor: {
    name: String,
    phone: String,
    address: String,
    dateOfJoining: Date
  },
  
  // Registration and Legal
  registrationNumber: {
    type: String,
    required: [true, 'Registration number is required'],
    unique: true
  },
  registrationDate: Date,
  registrationValidUntil: Date,
  
  // Insurance
  insurance: {
    provider: String,
    policyNumber: String,
    validFrom: Date,
    validUntil: Date,
    premium: Number
  },
  
  // Maintenance
  lastMaintenanceDate: Date,
  nextMaintenanceDate: Date,
  maintenanceRecords: [{
    date: {
      type: Date,
      required: [true, 'Maintenance date is required']
    },
    type: {
      type: String,
      enum: ['routine', 'repair', 'inspection', 'emergency'],
      required: [true, 'Maintenance type is required']
    },
    description: String,
    cost: {
      type: Number,
      min: 0
    },
    serviceProvider: String,
    nextServiceDate: Date,
    performedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    }
  }],
  
  // Fuel and Expenses
  fuelRecords: [{
    date: {
      type: Date,
      required: [true, 'Fuel date is required'],
      default: Date.now
    },
    quantity: {
      type: Number,
      required: [true, 'Fuel quantity is required'],
      min: 0
    },
    pricePerLiter: {
      type: Number,
      required: [true, 'Price per liter is required'],
      min: 0
    },
    totalCost: {
      type: Number,
      required: [true, 'Total cost is required'],
      min: 0
    },
    odometer: Number,
    fuelStation: String,
    recordedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    }
  }],
  
  // Safety and Compliance
  safetyFeatures: [{
    feature: {
      type: String,
      enum: [
        'first-aid-kit', 'fire-extinguisher', 'emergency-exits',
        'seat-belts', 'gps-tracking', 'cctv', 'speed-governor',
        'reflective-tape', 'warning-lights'
      ]
    },
    isAvailable: {
      type: Boolean,
      default: true
    },
    lastChecked: Date,
    condition: {
      type: String,
      enum: ['excellent', 'good', 'fair', 'needs-attention'],
      default: 'good'
    }
  }],
  
  // Documents
  documents: [{
    type: {
      type: String,
      enum: [
        'registration-certificate', 'insurance-policy', 'pollution-certificate',
        'fitness-certificate', 'permit', 'tax-receipt', 'driver-license'
      ],
      required: [true, 'Document type is required']
    },
    fileName: String,
    filePath: String,
    validFrom: Date,
    validUntil: Date,
    isVerified: {
      type: Boolean,
      default: false
    },
    verifiedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    },
    verifiedDate: Date
  }],
  
  // Status
  status: {
    type: String,
    enum: ['active', 'maintenance', 'out-of-service', 'retired'],
    default: 'active'
  },
  
  // Location Tracking
  currentLocation: {
    coordinates: {
      latitude: Number,
      longitude: Number
    },
    lastUpdated: Date,
    speed: Number, // km/h
    direction: Number // degrees
  },
  
  // Created and Updated by
  createdBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  },
  updatedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  }
}, {
  timestamps: true
});

// Student Transport Assignment Schema
const studentTransportSchema = new mongoose.Schema({
  student: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Student',
    required: [true, 'Student is required']
  },
  
  // Transport Details
  route: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'TransportRoute',
    required: [true, 'Route is required']
  },
  vehicle: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Vehicle'
  },
  pickupStop: {
    type: String,
    required: [true, 'Pickup stop is required']
  },
  dropoffStop: {
    type: String,
    required: [true, 'Dropoff stop is required']
  },
  
  // Schedule
  boardingPoint: {
    name: String,
    address: String,
    coordinates: {
      latitude: Number,
      longitude: Number
    }
  },
  pickupTime: {
    type: String,
    required: [true, 'Pickup time is required'],
    match: [/^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/, 'Time must be in HH:MM format']
  },
  dropoffTime: {
    type: String,
    required: [true, 'Dropoff time is required'],
    match: [/^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/, 'Time must be in HH:MM format']
  },
  
  // Service Type
  serviceType: {
    type: String,
    enum: ['pickup-only', 'drop-only', 'both-ways'],
    default: 'both-ways'
  },
  
  // Fee Information
  monthlyFee: {
    type: Number,
    required: [true, 'Monthly fee is required'],
    min: 0
  },
  
  // Academic Year
  academicYear: {
    type: String,
    required: [true, 'Academic year is required'],
    match: [/^\d{4}-\d{4}$/, 'Academic year must be in format YYYY-YYYY']
  },
  
  // Validity Period
  validFrom: {
    type: Date,
    required: [true, 'Valid from date is required'],
    default: Date.now
  },
  validUntil: {
    type: Date,
    required: [true, 'Valid until date is required']
  },
  
  // Emergency Contacts
  emergencyContacts: [{
    name: {
      type: String,
      required: [true, 'Emergency contact name is required']
    },
    relationship: String,
    phone: {
      type: String,
      required: [true, 'Emergency contact phone is required']
    },
    isPrimary: {
      type: Boolean,
      default: false
    }
  }],
  
  // Special Instructions
  specialInstructions: String,
  medicalConditions: [String],
  
  // Status
  status: {
    type: String,
    enum: ['active', 'suspended', 'cancelled', 'graduated'],
    default: 'active'
  },
  
  // Attendance Tracking
  attendanceRecords: [{
    date: {
      type: Date,
      required: [true, 'Date is required']
    },
    morningBoarding: {
      status: {
        type: String,
        enum: ['boarded', 'absent', 'late', 'cancelled']
      },
      time: String,
      location: String
    },
    eveningBoarding: {
      status: {
        type: String,
        enum: ['boarded', 'absent', 'early', 'cancelled']
      },
      time: String,
      location: String
    },
    remarks: String
  }],
  
  // Created and Updated by
  createdBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  },
  updatedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  }
}, {
  timestamps: true
});

// Indexes
transportRouteSchema.index({ routeNumber: 1 });
transportRouteSchema.index({ isActive: 1 });

vehicleSchema.index({ vehicleNumber: 1 });
vehicleSchema.index({ assignedRoute: 1 });
vehicleSchema.index({ status: 1 });
vehicleSchema.index({ 'driver.licenseNumber': 1 });

studentTransportSchema.index({ student: 1, academicYear: 1 }, { unique: true });
studentTransportSchema.index({ route: 1 });
studentTransportSchema.index({ vehicle: 1 });
studentTransportSchema.index({ status: 1 });

// Route Methods
transportRouteSchema.methods.calculateFee = function(fromStop, toStop) {
  const feeStructure = this.feeStructure.find(fee => 
    fromStop >= fee.stopRange.from && toStop <= fee.stopRange.to
  );
  return feeStructure ? feeStructure.monthlyFee : 0;
};

transportRouteSchema.methods.getStopByName = function(stopName) {
  return this.stops.find(stop => stop.stopName.toLowerCase() === stopName.toLowerCase());
};

// Vehicle Methods
vehicleSchema.methods.addFuelRecord = function(fuelData) {
  this.fuelRecords.push({
    ...fuelData,
    totalCost: fuelData.quantity * fuelData.pricePerLiter
  });
  return this.fuelRecords[this.fuelRecords.length - 1];
};

vehicleSchema.methods.scheduleMaintenace = function(maintenanceData) {
  this.maintenanceRecords.push(maintenanceData);
  this.lastMaintenanceDate = maintenanceData.date;
  this.nextMaintenanceDate = maintenanceData.nextServiceDate;
  return this;
};

// Student Transport Methods
studentTransportSchema.methods.calculateMonthlyAttendance = function(month, year) {
  const monthRecords = this.attendanceRecords.filter(record => {
    const recordDate = new Date(record.date);
    return recordDate.getMonth() === month && recordDate.getFullYear() === year;
  });
  
  const totalDays = monthRecords.length;
  const presentDays = monthRecords.filter(record => 
    record.morningBoarding.status === 'boarded' || 
    record.eveningBoarding.status === 'boarded'
  ).length;
  
  return {
    totalDays,
    presentDays,
    attendancePercentage: totalDays > 0 ? Math.round((presentDays / totalDays) * 100) : 0
  };
};

// Pre-save middlewares
transportRouteSchema.pre('save', function(next) {
  // Sort stops by sequence
  this.stops.sort((a, b) => a.sequence - b.sequence);
  next();
});

vehicleSchema.pre('save', function(next) {
  // Update occupancy
  // This would be calculated from student assignments in real implementation
  next();
});

studentTransportSchema.pre('save', function(next) {
  // Ensure only one primary emergency contact
  const primaryContacts = this.emergencyContacts.filter(contact => contact.isPrimary);
  if (primaryContacts.length > 1) {
    this.emergencyContacts.forEach((contact, index) => {
      if (index > 0) contact.isPrimary = false;
    });
  }
  next();
});

// Models
const TransportRoute = mongoose.model('TransportRoute', transportRouteSchema);
const Vehicle = mongoose.model('Vehicle', vehicleSchema);
const StudentTransport = mongoose.model('StudentTransport', studentTransportSchema);

module.exports = {
  TransportRoute,
  Vehicle,
  StudentTransport
};