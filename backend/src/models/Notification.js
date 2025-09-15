const mongoose = require('mongoose');

// Notification Schema
const notificationSchema = new mongoose.Schema({
  // Basic Information
  title: {
    type: String,
    required: [true, 'Notification title is required'],
    trim: true,
    maxlength: [200, 'Title cannot exceed 200 characters']
  },
  message: {
    type: String,
    required: [true, 'Notification message is required'],
    maxlength: [1000, 'Message cannot exceed 1000 characters']
  },
  
  // Notification Type
  type: {
    type: String,
    required: [true, 'Notification type is required'],
    enum: [
      'announcement', 'homework', 'exam', 'result', 'fee-due', 'fee-paid',
      'attendance', 'library', 'transport', 'event', 'holiday', 'meeting',
      'system', 'reminder', 'alert', 'warning', 'emergency'
    ]
  },
  
  // Priority and Urgency
  priority: {
    type: String,
    required: [true, 'Priority is required'],
    enum: ['low', 'normal', 'high', 'urgent'],
    default: 'normal'
  },
  
  // Sender Information
  sender: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: [true, 'Sender is required']
  },
  senderRole: {
    type: String,
    enum: ['admin', 'teacher', 'system'],
    required: [true, 'Sender role is required']
  },
  
  // Recipients
  recipients: {
    // Target Groups
    roles: [{
      type: String,
      enum: ['admin', 'teacher', 'student', 'parent', 'accountant', 'librarian']
    }],
    
    // Specific Classes
    classes: [{
      class: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Class'
      },
      sections: [String] // Empty array means all sections
    }],
    
    // Individual Users
    specificUsers: [{
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    }],
    
    // Filter Criteria
    filters: {
      studentFilters: {
        feeStatus: {
          type: String,
          enum: ['all', 'paid', 'pending', 'overdue']
        },
        attendanceBelow: Number, // percentage
        transportUsers: Boolean
      },
      teacherFilters: {
        departments: [String],
        subjects: [{
          type: mongoose.Schema.Types.ObjectId,
          ref: 'Subject'
        }]
      }
    }
  },
  
  // Content and Attachments
  content: {
    body: String, // HTML content
    attachments: [{
      fileName: String,
      filePath: String,
      fileType: String,
      fileSize: Number
    }],
    links: [{
      title: String,
      url: String,
      description: String
    }],
    actionButtons: [{
      label: String,
      action: String, // URL or action type
      style: {
        type: String,
        enum: ['primary', 'secondary', 'success', 'warning', 'danger'],
        default: 'primary'
      }
    }]
  },
  
  // Delivery Configuration
  deliveryConfig: {
    channels: [{
      type: String,
      enum: ['in-app', 'email', 'sms', 'push'],
      isEnabled: {
        type: Boolean,
        default: true
      }
    }],
    immediateDelivery: {
      type: Boolean,
      default: true
    },
    scheduledTime: Date,
    expiryTime: Date,
    
    // Email specific settings
    emailConfig: {
      subject: String,
      template: String,
      replyTo: String
    },
    
    // SMS specific settings
    smsConfig: {
      template: String,
      senderId: String
    }
  },
  
  // Delivery Status
  deliveryStatus: {
    totalRecipients: {
      type: Number,
      default: 0
    },
    delivered: {
      type: Number,
      default: 0
    },
    failed: {
      type: Number,
      default: 0
    },
    pending: {
      type: Number,
      default: 0
    },
    
    // Channel-wise delivery
    channelStats: [{
      channel: String,
      delivered: {
        type: Number,
        default: 0
      },
      failed: {
        type: Number,
        default: 0
      },
      pending: {
        type: Number,
        default: 0
      }
    }]
  },
  
  // Individual Delivery Records
  deliveries: [{
    recipient: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: [true, 'Recipient is required']
    },
    
    // Delivery attempts per channel
    attempts: [{
      channel: {
        type: String,
        enum: ['in-app', 'email', 'sms', 'push'],
        required: [true, 'Channel is required']
      },
      status: {
        type: String,
        enum: ['pending', 'delivered', 'failed', 'bounced'],
        default: 'pending'
      },
      attemptedAt: {
        type: Date,
        default: Date.now
      },
      deliveredAt: Date,
      errorMessage: String,
      metadata: mongoose.Schema.Types.Mixed // Channel-specific data
    }],
    
    // Read Status
    isRead: {
      type: Boolean,
      default: false
    },
    readAt: Date,
    
    // Action Status
    hasActioned: {
      type: Boolean,
      default: false
    },
    actionedAt: Date,
    action: String, // What action was taken
    
    // Device/Platform info
    deviceInfo: {
      platform: String,
      deviceType: String,
      appVersion: String,
      osVersion: String
    }
  }],
  
  // Interaction Analytics
  analytics: {
    totalViews: {
      type: Number,
      default: 0
    },
    uniqueViews: {
      type: Number,
      default: 0
    },
    clickThroughs: {
      type: Number,
      default: 0
    },
    actions: [{
      action: String,
      count: {
        type: Number,
        default: 0
      }
    }],
    
    // Time-based analytics
    viewsByHour: [{
      hour: Number, // 0-23
      count: {
        type: Number,
        default: 0
      }
    }],
    
    // Platform analytics
    platformStats: [{
      platform: String,
      views: {
        type: Number,
        default: 0
      },
      actions: {
        type: Number,
        default: 0
      }
    }]
  },
  
  // Related Information
  relatedEntity: {
    entityType: {
      type: String,
      enum: ['homework', 'exam', 'fee', 'student', 'class', 'event', 'library', 'transport']
    },
    entityId: mongoose.Schema.Types.ObjectId,
    entityData: mongoose.Schema.Types.Mixed // Additional context data
  },
  
  // Approval Workflow
  approvalStatus: {
    isRequired: {
      type: Boolean,
      default: false
    },
    status: {
      type: String,
      enum: ['draft', 'pending-approval', 'approved', 'rejected'],
      default: 'draft'
    },
    approver: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    },
    approvedAt: Date,
    rejectedAt: Date,
    comments: String
  },
  
  // Status and Lifecycle
  status: {
    type: String,
    enum: ['draft', 'scheduled', 'sending', 'sent', 'failed', 'cancelled', 'expired'],
    default: 'draft'
  },
  
  // Timestamps
  scheduledAt: Date,
  sentAt: Date,
  expiresAt: Date,
  
  // System Information
  version: {
    type: Number,
    default: 1
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

// Notification Template Schema
const notificationTemplateSchema = new mongoose.Schema({
  // Basic Information
  name: {
    type: String,
    required: [true, 'Template name is required'],
    unique: true,
    trim: true
  },
  description: {
    type: String,
    maxlength: [500, 'Description cannot exceed 500 characters']
  },
  
  // Template Configuration
  type: {
    type: String,
    required: [true, 'Template type is required'],
    enum: [
      'homework-assigned', 'homework-due', 'exam-schedule', 'result-published',
      'fee-due', 'fee-overdue', 'attendance-low', 'library-due', 'transport-update',
      'event-announcement', 'holiday-notice', 'meeting-reminder', 'emergency-alert'
    ]
  },
  category: {
    type: String,
    enum: ['academic', 'administrative', 'financial', 'emergency', 'general'],
    required: [true, 'Category is required']
  },
  
  // Content Templates
  templates: {
    // In-app notification
    inApp: {
      title: {
        type: String,
        required: [true, 'In-app title template is required']
      },
      message: {
        type: String,
        required: [true, 'In-app message template is required']
      }
    },
    
    // Email template
    email: {
      subject: {
        type: String,
        required: [true, 'Email subject template is required']
      },
      body: {
        type: String,
        required: [true, 'Email body template is required']
      },
      footer: String
    },
    
    // SMS template
    sms: {
      message: {
        type: String,
        required: [true, 'SMS message template is required'],
        maxlength: [160, 'SMS template cannot exceed 160 characters']
      }
    },
    
    // Push notification
    push: {
      title: String,
      body: String,
      icon: String,
      badge: String
    }
  },
  
  // Variables/Placeholders
  variables: [{
    name: {
      type: String,
      required: [true, 'Variable name is required']
    },
    description: String,
    type: {
      type: String,
      enum: ['text', 'number', 'date', 'boolean'],
      default: 'text'
    },
    isRequired: {
      type: Boolean,
      default: false
    },
    defaultValue: String
  }],
  
  // Default Recipients
  defaultRecipients: {
    roles: [String],
    includeParents: {
      type: Boolean,
      default: false
    }
  },
  
  // Settings
  settings: {
    priority: {
      type: String,
      enum: ['low', 'normal', 'high', 'urgent'],
      default: 'normal'
    },
    channels: [{
      type: String,
      enum: ['in-app', 'email', 'sms', 'push']
    }],
    expiryHours: {
      type: Number,
      default: 72, // 3 days
      min: 1
    },
    requireApproval: {
      type: Boolean,
      default: false
    }
  },
  
  // Usage Statistics
  usage: {
    totalUsed: {
      type: Number,
      default: 0
    },
    lastUsed: Date,
    successRate: {
      type: Number,
      default: 0,
      min: 0,
      max: 100
    }
  },
  
  // Status
  isActive: {
    type: Boolean,
    default: true
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

// Indexes
notificationSchema.index({ type: 1, priority: 1 });
notificationSchema.index({ sender: 1 });
notificationSchema.index({ status: 1 });
notificationSchema.index({ scheduledAt: 1 });
notificationSchema.index({ 'deliveries.recipient': 1 });
notificationSchema.index({ 'recipients.specificUsers': 1 });
notificationSchema.index({ createdAt: -1 });

notificationTemplateSchema.index({ type: 1 });
notificationTemplateSchema.index({ category: 1 });
notificationTemplateSchema.index({ isActive: 1 });

// Notification Methods
notificationSchema.methods.addDeliveryRecord = function(recipientId, channelAttempts = []) {
  const existingDelivery = this.deliveries.find(d => 
    d.recipient.toString() === recipientId.toString()
  );
  
  if (existingDelivery) {
    // Update existing delivery record
    channelAttempts.forEach(attempt => {
      existingDelivery.attempts.push(attempt);
    });
  } else {
    // Create new delivery record
    this.deliveries.push({
      recipient: recipientId,
      attempts: channelAttempts
    });
  }
  
  this.updateDeliveryStats();
  return this;
};

notificationSchema.methods.markAsRead = function(recipientId) {
  const delivery = this.deliveries.find(d => 
    d.recipient.toString() === recipientId.toString()
  );
  
  if (delivery && !delivery.isRead) {
    delivery.isRead = true;
    delivery.readAt = new Date();
    this.analytics.totalViews++;
    
    // Check if this is a unique view
    const uniqueReads = this.deliveries.filter(d => d.isRead).length;
    this.analytics.uniqueViews = uniqueReads;
  }
  
  return delivery;
};

notificationSchema.methods.updateDeliveryStats = function() {
  const total = this.deliveries.length;
  let delivered = 0;
  let failed = 0;
  let pending = 0;
  
  this.deliveries.forEach(delivery => {
    const hasSuccessfulDelivery = delivery.attempts.some(attempt => 
      attempt.status === 'delivered'
    );
    
    if (hasSuccessfulDelivery) {
      delivered++;
    } else if (delivery.attempts.some(attempt => attempt.status === 'failed')) {
      failed++;
    } else {
      pending++;
    }
  });
  
  this.deliveryStatus.totalRecipients = total;
  this.deliveryStatus.delivered = delivered;
  this.deliveryStatus.failed = failed;
  this.deliveryStatus.pending = pending;
  
  return this.deliveryStatus;
};

// Template Methods
notificationTemplateSchema.methods.generateNotification = function(variables = {}, customRecipients = null) {
  const notification = {
    type: this.type,
    priority: this.settings.priority,
    title: this.replaceVariables(this.templates.inApp.title, variables),
    message: this.replaceVariables(this.templates.inApp.message, variables),
    deliveryConfig: {
      channels: this.settings.channels.map(channel => ({
        type: channel,
        isEnabled: true
      })),
      expiryTime: new Date(Date.now() + this.settings.expiryHours * 60 * 60 * 1000)
    },
    recipients: customRecipients || this.defaultRecipients,
    approvalStatus: {
      isRequired: this.settings.requireApproval,
      status: this.settings.requireApproval ? 'pending-approval' : 'approved'
    }
  };
  
  // Add channel-specific content
  if (this.templates.email) {
    notification.content = notification.content || {};
    notification.content.emailSubject = this.replaceVariables(this.templates.email.subject, variables);
    notification.content.emailBody = this.replaceVariables(this.templates.email.body, variables);
  }
  
  if (this.templates.sms) {
    notification.content = notification.content || {};
    notification.content.smsMessage = this.replaceVariables(this.templates.sms.message, variables);
  }
  
  return notification;
};

notificationTemplateSchema.methods.replaceVariables = function(template, variables) {
  let result = template;
  
  // Replace variables in format {{variableName}}
  Object.keys(variables).forEach(key => {
    const regex = new RegExp(`{{${key}}}`, 'g');
    result = result.replace(regex, variables[key]);
  });
  
  // Replace any remaining variables with default values
  this.variables.forEach(variable => {
    if (variables[variable.name] === undefined && variable.defaultValue) {
      const regex = new RegExp(`{{${variable.name}}}`, 'g');
      result = result.replace(regex, variable.defaultValue);
    }
  });
  
  return result;
};

// Pre-save middlewares
notificationSchema.pre('save', function(next) {
  if (this.isModified('deliveries')) {
    this.updateDeliveryStats();
  }
  next();
});

notificationTemplateSchema.pre('save', function(next) {
  // Update usage statistics
  if (this.isModified('usage.totalUsed')) {
    this.usage.lastUsed = new Date();
  }
  next();
});

// Models
const Notification = mongoose.model('Notification', notificationSchema);
const NotificationTemplate = mongoose.model('NotificationTemplate', notificationTemplateSchema);

module.exports = {
  Notification,
  NotificationTemplate
};