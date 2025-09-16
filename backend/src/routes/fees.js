const express = require('express');
const Fee = require('../models/Fee');
const Student = require('../models/Student');
const Class = require('../models/Class');
const { authenticate, authorize } = require('../middleware/auth');

const router = express.Router();

// @route   GET /api/fees
// @desc    Get all fee records with filtering
// @access  Private (Admin, Accountant)
router.get('/', 
  authenticate,
  authorize(['admin', 'accountant']),
  async (req, res) => {
    try {
      const { 
        status, 
        type, 
        classId, 
        studentId, 
        academicYear,
        month,
        page = 1, 
        limit = 20 
      } = req.query;
      
      const skip = (page - 1) * limit;

      // Build filter
      let filter = {};
      if (status) filter.status = status;
      if (type) filter.type = type;
      if (classId) filter.class = classId;
      if (studentId) filter.student = studentId;
      if (academicYear) filter.academicYear = academicYear;
      if (month) filter.month = month;

      const fees = await Fee.find(filter)
        .populate('student', 'firstName lastName rollNumber')
        .populate('class', 'name level')
        .populate('recordedBy', 'firstName lastName')
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(parseInt(limit));

      const total = await Fee.countDocuments(filter);

      // Calculate summary statistics
      const stats = await Fee.aggregate([
        { $match: filter },
        {
          $group: {
            _id: null,
            totalAmount: { $sum: '$amount' },
            paidAmount: { 
              $sum: { 
                $cond: [{ $eq: ['$status', 'paid'] }, '$amount', 0] 
              }
            },
            pendingAmount: { 
              $sum: { 
                $cond: [{ $ne: ['$status', 'paid'] }, '$amount', 0] 
              }
            },
            overdueAmount: { 
              $sum: { 
                $cond: [{ $eq: ['$status', 'overdue'] }, '$amount', 0] 
              }
            }
          }
        }
      ]);

      res.status(200).json({
        success: true,
        data: {
          fees,
          pagination: {
            currentPage: parseInt(page),
            totalPages: Math.ceil(total / limit),
            totalRecords: total,
            hasNextPage: page < Math.ceil(total / limit),
            hasPrevPage: page > 1
          },
          statistics: stats[0] || {
            totalAmount: 0,
            paidAmount: 0,
            pendingAmount: 0,
            overdueAmount: 0
          }
        }
      });

    } catch (error) {
      console.error('Get fees error:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to fetch fees',
        error: process.env.NODE_ENV === 'development' ? error.message : 'Internal server error'
      });
    }
  }
);

// @route   GET /api/fees/student/:studentId
// @desc    Get fee records for a specific student
// @access  Private (All roles with proper authorization)
router.get('/student/:studentId',
  authenticate,
  async (req, res) => {
    try {
      const { studentId } = req.params;
      const { academicYear, status, type } = req.query;

      // Authorization check
      if (req.user.role === 'student') {
        if (req.user.studentProfile?._id.toString() !== studentId) {
          return res.status(403).json({
            success: false,
            message: 'Access denied'
          });
        }
      }

      if (req.user.role === 'parent') {
        const hasChild = req.user.children.some(child => 
          child._id.toString() === studentId
        );
        if (!hasChild) {
          return res.status(403).json({
            success: false,
            message: 'Access denied'
          });
        }
      }

      let filter = { student: studentId };
      if (academicYear) filter.academicYear = academicYear;
      if (status) filter.status = status;
      if (type) filter.type = type;

      const fees = await Fee.find(filter)
        .populate('class', 'name level')
        .populate('recordedBy', 'firstName lastName')
        .sort({ dueDate: -1 });

      // Calculate student fee summary
      const summary = await Fee.aggregate([
        { $match: filter },
        {
          $group: {
            _id: '$status',
            totalAmount: { $sum: '$amount' },
            count: { $sum: 1 }
          }
        }
      ]);

      const feeSummary = {
        total: 0,
        paid: 0,
        pending: 0,
        overdue: 0,
        partial: 0
      };

      summary.forEach(item => {
        feeSummary.total += item.totalAmount;
        feeSummary[item._id] = item.totalAmount;
      });

      res.status(200).json({
        success: true,
        data: {
          fees,
          summary: feeSummary
        }
      });

    } catch (error) {
      console.error('Get student fees error:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to fetch student fees',
        error: process.env.NODE_ENV === 'development' ? error.message : 'Internal server error'
      });
    }
  }
);

// @route   POST /api/fees
// @desc    Create new fee record
// @access  Private (Admin, Accountant)
router.post('/',
  authenticate,
  authorize(['admin', 'accountant']),
  async (req, res) => {
    try {
      const {
        student: studentId,
        class: classId,
        type,
        amount,
        dueDate,
        description,
        academicYear,
        month,
        breakdown
      } = req.body;

      // Validate required fields
      if (!studentId || !type || !amount || !dueDate) {
        return res.status(400).json({
          success: false,
          message: 'Required fields: student, type, amount, dueDate'
        });
      }

      // Verify student exists
      const student = await Student.findById(studentId);
      if (!student) {
        return res.status(404).json({
          success: false,
          message: 'Student not found'
        });
      }

      // Use student's class if not provided
      const studentClassId = classId || student.class;

      const fee = new Fee({
        student: studentId,
        class: studentClassId,
        type,
        amount: parseFloat(amount),
        dueDate: new Date(dueDate),
        description: description || '',
        academicYear: academicYear || new Date().getFullYear(),
        month: month || null,
        breakdown: breakdown || [],
        status: 'pending',
        recordedBy: req.user._id
      });

      await fee.save();

      const populatedFee = await Fee.findById(fee._id)
        .populate('student', 'firstName lastName rollNumber')
        .populate('class', 'name level')
        .populate('recordedBy', 'firstName lastName');

      res.status(201).json({
        success: true,
        message: 'Fee record created successfully',
        data: populatedFee
      });

    } catch (error) {
      console.error('Create fee error:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to create fee record',
        error: process.env.NODE_ENV === 'development' ? error.message : 'Internal server error'
      });
    }
  }
);

// @route   POST /api/fees/bulk
// @desc    Create fee records for multiple students
// @access  Private (Admin, Accountant)
router.post('/bulk',
  authenticate,
  authorize(['admin', 'accountant']),
  async (req, res) => {
    try {
      const {
        classId,
        type,
        amount,
        dueDate,
        description,
        academicYear,
        month,
        breakdown,
        studentIds // optional, if not provided, applies to all students in class
      } = req.body;

      // Validate required fields
      if (!type || !amount || !dueDate) {
        return res.status(400).json({
          success: false,
          message: 'Required fields: type, amount, dueDate'
        });
      }

      let students;
      
      if (studentIds && studentIds.length > 0) {
        // Create fees for specific students
        students = await Student.find({ _id: { $in: studentIds } });
      } else if (classId) {
        // Create fees for all students in a class
        students = await Student.find({ class: classId });
      } else {
        return res.status(400).json({
          success: false,
          message: 'Either classId or studentIds must be provided'
        });
      }

      if (students.length === 0) {
        return res.status(404).json({
          success: false,
          message: 'No students found'
        });
      }

      // Create fee records for all students
      const feeRecords = students.map(student => ({
        student: student._id,
        class: student.class,
        type,
        amount: parseFloat(amount),
        dueDate: new Date(dueDate),
        description: description || '',
        academicYear: academicYear || new Date().getFullYear(),
        month: month || null,
        breakdown: breakdown || [],
        status: 'pending',
        recordedBy: req.user._id
      }));

      const createdFees = await Fee.insertMany(feeRecords);

      res.status(201).json({
        success: true,
        message: `Fee records created for ${createdFees.length} students`,
        data: {
          count: createdFees.length,
          studentIds: students.map(s => s._id)
        }
      });

    } catch (error) {
      console.error('Create bulk fees error:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to create bulk fee records',
        error: process.env.NODE_ENV === 'development' ? error.message : 'Internal server error'
      });
    }
  }
);

// @route   POST /api/fees/:id/payment
// @desc    Record fee payment
// @access  Private (Admin, Accountant)
router.post('/:id/payment',
  authenticate,
  authorize(['admin', 'accountant']),
  async (req, res) => {
    try {
      const feeId = req.params.id;
      const {
        amountPaid,
        paymentMethod,
        transactionId,
        paymentDate,
        remarks
      } = req.body;

      if (!amountPaid || !paymentMethod) {
        return res.status(400).json({
          success: false,
          message: 'Amount paid and payment method are required'
        });
      }

      const fee = await Fee.findById(feeId);
      if (!fee) {
        return res.status(404).json({
          success: false,
          message: 'Fee record not found'
        });
      }

      const paidAmount = parseFloat(amountPaid);
      const currentPaid = fee.amountPaid || 0;
      const newTotalPaid = currentPaid + paidAmount;

      // Create payment record
      const payment = {
        amount: paidAmount,
        method: paymentMethod,
        transactionId: transactionId || '',
        date: paymentDate ? new Date(paymentDate) : new Date(),
        recordedBy: req.user._id,
        remarks: remarks || ''
      };

      // Update fee record
      fee.payments.push(payment);
      fee.amountPaid = newTotalPaid;

      // Determine new status
      if (newTotalPaid >= fee.amount) {
        fee.status = 'paid';
        fee.paidDate = payment.date;
      } else if (newTotalPaid > 0) {
        fee.status = 'partial';
      }

      await fee.save();

      const updatedFee = await Fee.findById(feeId)
        .populate('student', 'firstName lastName rollNumber')
        .populate('class', 'name level')
        .populate('payments.recordedBy', 'firstName lastName');

      res.status(200).json({
        success: true,
        message: 'Payment recorded successfully',
        data: updatedFee
      });

    } catch (error) {
      console.error('Record payment error:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to record payment',
        error: process.env.NODE_ENV === 'development' ? error.message : 'Internal server error'
      });
    }
  }
);

// @route   PUT /api/fees/:id
// @desc    Update fee record
// @access  Private (Admin, Accountant)
router.put('/:id',
  authenticate,
  authorize(['admin', 'accountant']),
  async (req, res) => {
    try {
      const feeId = req.params.id;
      const updates = req.body;

      const fee = await Fee.findById(feeId);
      if (!fee) {
        return res.status(404).json({
          success: false,
          message: 'Fee record not found'
        });
      }

      const allowedUpdates = [
        'type', 'amount', 'dueDate', 'description', 'month',
        'breakdown', 'status', 'discount', 'lateFee'
      ];

      const filteredUpdates = {};
      Object.keys(updates).forEach(key => {
        if (allowedUpdates.includes(key)) {
          filteredUpdates[key] = updates[key];
        }
      });

      // Check if overdue status should be updated
      if (filteredUpdates.dueDate && new Date(filteredUpdates.dueDate) < new Date()) {
        if (fee.status === 'pending') {
          filteredUpdates.status = 'overdue';
        }
      }

      const updatedFee = await Fee.findByIdAndUpdate(
        feeId,
        filteredUpdates,
        { new: true, runValidators: true }
      )
      .populate('student', 'firstName lastName rollNumber')
      .populate('class', 'name level')
      .populate('recordedBy', 'firstName lastName');

      res.status(200).json({
        success: true,
        message: 'Fee record updated successfully',
        data: updatedFee
      });

    } catch (error) {
      console.error('Update fee error:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to update fee record',
        error: process.env.NODE_ENV === 'development' ? error.message : 'Internal server error'
      });
    }
  }
);

// @route   GET /api/fees/reports/summary
// @desc    Get fee collection summary
// @access  Private (Admin, Accountant)
router.get('/reports/summary',
  authenticate,
  authorize(['admin', 'accountant']),
  async (req, res) => {
    try {
      const { academicYear, classId, month, startDate, endDate } = req.query;

      let filter = {};
      if (academicYear) filter.academicYear = parseInt(academicYear);
      if (classId) filter.class = classId;
      if (month) filter.month = month;
      
      if (startDate || endDate) {
        filter.dueDate = {};
        if (startDate) filter.dueDate.$gte = new Date(startDate);
        if (endDate) filter.dueDate.$lte = new Date(endDate);
      }

      const summary = await Fee.aggregate([
        { $match: filter },
        {
          $group: {
            _id: null,
            totalRecords: { $sum: 1 },
            totalAmount: { $sum: '$amount' },
            totalCollected: { $sum: '$amountPaid' },
            totalPending: { 
              $sum: { 
                $subtract: ['$amount', { $ifNull: ['$amountPaid', 0] }] 
              }
            },
            paidCount: {
              $sum: { $cond: [{ $eq: ['$status', 'paid'] }, 1, 0] }
            },
            pendingCount: {
              $sum: { $cond: [{ $eq: ['$status', 'pending'] }, 1, 0] }
            },
            overdueCount: {
              $sum: { $cond: [{ $eq: ['$status', 'overdue'] }, 1, 0] }
            },
            partialCount: {
              $sum: { $cond: [{ $eq: ['$status', 'partial'] }, 1, 0] }
            }
          }
        }
      ]);

      // Monthly collection trend
      const monthlyTrend = await Fee.aggregate([
        { $match: { ...filter, status: 'paid' } },
        {
          $group: {
            _id: {
              year: { $year: '$paidDate' },
              month: { $month: '$paidDate' }
            },
            totalCollected: { $sum: '$amountPaid' },
            count: { $sum: 1 }
          }
        },
        { $sort: { '_id.year': 1, '_id.month': 1 } }
      ]);

      // Fee type breakdown
      const typeBreakdown = await Fee.aggregate([
        { $match: filter },
        {
          $group: {
            _id: '$type',
            totalAmount: { $sum: '$amount' },
            collectedAmount: { $sum: '$amountPaid' },
            count: { $sum: 1 }
          }
        }
      ]);

      res.status(200).json({
        success: true,
        data: {
          summary: summary[0] || {
            totalRecords: 0,
            totalAmount: 0,
            totalCollected: 0,
            totalPending: 0,
            paidCount: 0,
            pendingCount: 0,
            overdueCount: 0,
            partialCount: 0
          },
          monthlyTrend,
          typeBreakdown
        }
      });

    } catch (error) {
      console.error('Get fee summary error:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to fetch fee summary',
        error: process.env.NODE_ENV === 'development' ? error.message : 'Internal server error'
      });
    }
  }
);

// @route   DELETE /api/fees/:id
// @desc    Delete fee record
// @access  Private (Admin only)
router.delete('/:id',
  authenticate,
  authorize(['admin']),
  async (req, res) => {
    try {
      const fee = await Fee.findById(req.params.id);
      if (!fee) {
        return res.status(404).json({
          success: false,
          message: 'Fee record not found'
        });
      }

      // Don't allow deletion if payment has been made
      if (fee.amountPaid > 0) {
        return res.status(400).json({
          success: false,
          message: 'Cannot delete fee record with payments'
        });
      }

      await Fee.findByIdAndDelete(req.params.id);

      res.status(200).json({
        success: true,
        message: 'Fee record deleted successfully'
      });

    } catch (error) {
      console.error('Delete fee error:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to delete fee record',
        error: process.env.NODE_ENV === 'development' ? error.message : 'Internal server error'
      });
    }
  }
);

module.exports = router;