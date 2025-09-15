const express = require('express');
const Student = require('../models/Student');
const Teacher = require('../models/Teacher');
const Class = require('../models/Class');
const Subject = require('../models/Subject');
const User = require('../models/User');
const { authenticate, authorize } = require('../middleware/auth');
const PDFDocument = require('pdfkit');
const ExcelJS = require('exceljs');

const router = express.Router();

// @route   GET /api/reports/dashboard
// @desc    Get dashboard statistics
// @access  Private (Admin)
router.get('/dashboard',
  authenticate,
  authorize(['admin']),
  async (req, res) => {
    try {
      // Get current date ranges
      const now = new Date();
      const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
      const startOfYear = new Date(now.getFullYear(), 0, 1);

      // Total counts
      const totalStudents = await Student.countDocuments({ status: 'active' });
      const totalTeachers = await Teacher.countDocuments({ status: 'active' });
      const totalClasses = await Class.countDocuments();
      const totalSubjects = await Subject.countDocuments();

      // New admissions this month
      const newAdmissions = await Student.countDocuments({
        admissionDate: { $gte: startOfMonth },
        status: 'active'
      });

      // New staff this month
      const newStaff = await Teacher.countDocuments({
        joiningDate: { $gte: startOfMonth },
        status: 'active'
      });

      // Students by grade distribution
      const gradeDistribution = await Student.aggregate([
        { $match: { status: 'active' } },
        {
          $lookup: {
            from: 'classes',
            localField: 'class',
            foreignField: '_id',
            as: 'classInfo'
          }
        },
        { $unwind: '$classInfo' },
        {
          $group: {
            _id: '$classInfo.grade',
            count: { $sum: 1 }
          }
        },
        { $sort: { _id: 1 } }
      ]);

      // Teachers by department
      const departmentStats = await Teacher.aggregate([
        { $match: { status: 'active' } },
        {
          $group: {
            _id: '$department',
            count: { $sum: 1 }
          }
        },
        { $sort: { count: -1 } }
      ]);

      // Fee collection summary (placeholder - would integrate with fee system)
      const feeStats = {
        totalCollected: 0,
        totalPending: 0,
        collectionRate: 0
      };

      // Student gender distribution
      const genderStats = await User.aggregate([
        {
          $lookup: {
            from: 'students',
            localField: '_id',
            foreignField: 'user',
            as: 'studentInfo'
          }
        },
        { $match: { role: 'student', 'studentInfo.status': 'active' } },
        {
          $group: {
            _id: '$gender',
            count: { $sum: 1 }
          }
        }
      ]);

      // Monthly admission trends (last 6 months)
      const admissionTrends = await Student.aggregate([
        {
          $match: {
            admissionDate: {
              $gte: new Date(now.getFullYear(), now.getMonth() - 5, 1)
            }
          }
        },
        {
          $group: {
            _id: {
              year: { $year: '$admissionDate' },
              month: { $month: '$admissionDate' }
            },
            count: { $sum: 1 }
          }
        },
        { $sort: { '_id.year': 1, '_id.month': 1 } }
      ]);

      res.status(200).json({
        success: true,
        data: {
          overview: {
            totalStudents,
            totalTeachers,
            totalClasses,
            totalSubjects,
            newAdmissions,
            newStaff
          },
          distributions: {
            gradeDistribution,
            departmentStats,
            genderStats
          },
          trends: {
            admissionTrends
          },
          feeStats
        }
      });
    } catch (error) {
      console.error('Dashboard reports error:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to generate dashboard reports',
        error: process.env.NODE_ENV === 'development' ? error.message : 'Internal server error'
      });
    }
  }
);

// @route   GET /api/reports/students
// @desc    Generate student reports with filters
// @access  Private (Admin)
router.get('/students',
  authenticate,
  authorize(['admin']),
  async (req, res) => {
    try {
      const {
        format = 'json', // json, pdf, excel
        class: classFilter,
        grade,
        status = 'active',
        gender,
        startDate,
        endDate,
        includeParents = false,
        includeFees = false
      } = req.query;

      // Build filter
      const filter = { status };
      if (classFilter) filter.class = classFilter;
      if (gender) filter['user.gender'] = gender;
      if (startDate && endDate) {
        filter.admissionDate = {
          $gte: new Date(startDate),
          $lte: new Date(endDate)
        };
      }

      // Build aggregation pipeline
      const pipeline = [
        {
          $lookup: {
            from: 'users',
            localField: 'user',
            foreignField: '_id',
            as: 'userInfo'
          }
        },
        { $unwind: '$userInfo' },
        {
          $lookup: {
            from: 'classes',
            localField: 'class',
            foreignField: '_id',
            as: 'classInfo'
          }
        },
        { $unwind: '$classInfo' }
      ];

      if (includeParents) {
        pipeline.push({
          $lookup: {
            from: 'users',
            localField: 'parentGuardian.father.user',
            foreignField: '_id',
            as: 'fatherInfo'
          }
        });
        pipeline.push({
          $lookup: {
            from: 'users',
            localField: 'parentGuardian.mother.user',
            foreignField: '_id',
            as: 'motherInfo'
          }
        });
      }

      // Add match stage
      pipeline.push({ $match: filter });

      // Add projection
      const projection = {
        rollNumber: 1,
        admissionDate: 1,
        status: 1,
        user: {
          firstName: '$userInfo.firstName',
          lastName: '$userInfo.lastName',
          email: '$userInfo.email',
          phone: '$userInfo.phone',
          dateOfBirth: '$userInfo.dateOfBirth',
          gender: '$userInfo.gender',
          address: '$userInfo.address'
        },
        class: {
          name: '$classInfo.name',
          grade: '$classInfo.grade',
          level: '$classInfo.level'
        }
      };

      if (includeParents) {
        projection.parents = {
          father: { $arrayElemAt: ['$fatherInfo', 0] },
          mother: { $arrayElemAt: ['$motherInfo', 0] }
        };
      }

      pipeline.push({ $project: projection });
      pipeline.push({ $sort: { 'class.grade': 1, rollNumber: 1 } });

      const students = await Student.aggregate(pipeline);

      // Handle different output formats
      switch (format) {
        case 'pdf':
          return generateStudentPDF(students, res);
        case 'excel':
          return generateStudentExcel(students, res);
        default:
          res.status(200).json({
            success: true,
            data: students,
            total: students.length
          });
      }
    } catch (error) {
      console.error('Student reports error:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to generate student reports',
        error: process.env.NODE_ENV === 'development' ? error.message : 'Internal server error'
      });
    }
  }
);

// @route   GET /api/reports/teachers
// @desc    Generate teacher reports
// @access  Private (Admin)
router.get('/teachers',
  authenticate,
  authorize(['admin']),
  async (req, res) => {
    try {
      const {
        format = 'json',
        department,
        designation,
        employmentType,
        status = 'active'
      } = req.query;

      const filter = { status };
      if (department) filter.department = department;
      if (designation) filter.designation = designation;
      if (employmentType) filter.employmentType = employmentType;

      const pipeline = [
        { $match: filter },
        {
          $lookup: {
            from: 'users',
            localField: 'user',
            foreignField: '_id',
            as: 'userInfo'
          }
        },
        { $unwind: '$userInfo' },
        {
          $lookup: {
            from: 'subjects',
            localField: 'subjects.subject',
            foreignField: '_id',
            as: 'subjectInfo'
          }
        },
        {
          $project: {
            employeeId: 1,
            designation: 1,
            department: 1,
            joiningDate: 1,
            employmentType: 1,
            totalExperience: 1,
            'salary.netSalary': 1,
            user: {
              firstName: '$userInfo.firstName',
              lastName: '$userInfo.lastName',
              email: '$userInfo.email',
              phone: '$userInfo.phone',
              gender: '$userInfo.gender'
            },
            subjects: '$subjectInfo'
          }
        },
        { $sort: { department: 1, designation: 1 } }
      ];

      const teachers = await Teacher.aggregate(pipeline);

      switch (format) {
        case 'pdf':
          return generateTeacherPDF(teachers, res);
        case 'excel':
          return generateTeacherExcel(teachers, res);
        default:
          res.status(200).json({
            success: true,
            data: teachers,
            total: teachers.length
          });
      }
    } catch (error) {
      console.error('Teacher reports error:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to generate teacher reports',
        error: process.env.NODE_ENV === 'development' ? error.message : 'Internal server error'
      });
    }
  }
);

// @route   GET /api/reports/attendance/:type
// @desc    Generate attendance reports
// @access  Private (Admin, Teacher)
router.get('/attendance/:type',
  authenticate,
  authorize(['admin', 'teacher']),
  async (req, res) => {
    try {
      const { type } = req.params; // student or teacher
      const {
        startDate,
        endDate,
        class: classFilter,
        format = 'json'
      } = req.query;

      if (!startDate || !endDate) {
        return res.status(400).json({
          success: false,
          message: 'Start date and end date are required'
        });
      }

      // Note: This is a placeholder for attendance system integration
      // In a real system, you would have Attendance model and related logic
      
      const attendanceData = {
        type,
        period: { startDate, endDate },
        summary: {
          totalDays: 0,
          presentDays: 0,
          absentDays: 0,
          attendanceRate: 0
        },
        details: []
      };

      res.status(200).json({
        success: true,
        message: 'Attendance reports functionality ready for integration',
        data: attendanceData
      });
    } catch (error) {
      console.error('Attendance reports error:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to generate attendance reports',
        error: process.env.NODE_ENV === 'development' ? error.message : 'Internal server error'
      });
    }
  }
);

// @route   GET /api/reports/performance
// @desc    Generate academic performance reports
// @access  Private (Admin, Teacher)
router.get('/performance',
  authenticate,
  authorize(['admin', 'teacher']),
  async (req, res) => {
    try {
      const {
        class: classFilter,
        subject,
        examType,
        academicYear,
        format = 'json'
      } = req.query;

      // Note: This is a placeholder for academic performance system
      // In a real system, you would have Exam, Grade models and related logic

      const performanceData = {
        filters: { classFilter, subject, examType, academicYear },
        summary: {
          averageScore: 0,
          passRate: 0,
          topPerformers: [],
          improvements: []
        },
        details: []
      };

      res.status(200).json({
        success: true,
        message: 'Performance reports functionality ready for integration',
        data: performanceData
      });
    } catch (error) {
      console.error('Performance reports error:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to generate performance reports',
        error: process.env.NODE_ENV === 'development' ? error.message : 'Internal server error'
      });
    }
  }
);

// @route   GET /api/reports/financial
// @desc    Generate financial reports
// @access  Private (Admin, Accountant)
router.get('/financial',
  authenticate,
  authorize(['admin', 'accountant']),
  async (req, res) => {
    try {
      const {
        type = 'fee_collection', // fee_collection, expenses, revenue
        startDate,
        endDate,
        class: classFilter,
        format = 'json'
      } = req.query;

      // Note: This is a placeholder for fee management system
      // In a real system, you would have Fee, Payment, Expense models

      const financialData = {
        type,
        period: { startDate, endDate },
        summary: {
          totalRevenue: 0,
          totalExpenses: 0,
          netIncome: 0,
          collectionRate: 0
        },
        breakdown: {
          byClass: [],
          byMonth: [],
          byCategory: []
        }
      };

      res.status(200).json({
        success: true,
        message: 'Financial reports functionality ready for integration',
        data: financialData
      });
    } catch (error) {
      console.error('Financial reports error:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to generate financial reports',
        error: process.env.NODE_ENV === 'development' ? error.message : 'Internal server error'
      });
    }
  }
);

// Helper function to generate PDF for students
function generateStudentPDF(students, res) {
  const doc = new PDFDocument();
  
  res.setHeader('Content-Type', 'application/pdf');
  res.setHeader('Content-Disposition', 'attachment; filename=students-report.pdf');
  
  doc.pipe(res);
  
  // Add title
  doc.fontSize(20).text('Student Report', 50, 50);
  doc.moveDown();
  
  // Add student data
  students.forEach((student, index) => {
    if (index > 0) doc.addPage();
    
    doc.fontSize(14).text(`Name: ${student.user.firstName} ${student.user.lastName}`, 50, 100);
    doc.text(`Roll Number: ${student.rollNumber}`, 50, 120);
    doc.text(`Class: ${student.class.name}`, 50, 140);
    doc.text(`Email: ${student.user.email}`, 50, 160);
    doc.text(`Phone: ${student.user.phone}`, 50, 180);
  });
  
  doc.end();
}

// Helper function to generate Excel for students
async function generateStudentExcel(students, res) {
  const workbook = new ExcelJS.Workbook();
  const worksheet = workbook.addWorksheet('Students');
  
  // Add headers
  worksheet.columns = [
    { header: 'Roll Number', key: 'rollNumber', width: 15 },
    { header: 'First Name', key: 'firstName', width: 20 },
    { header: 'Last Name', key: 'lastName', width: 20 },
    { header: 'Email', key: 'email', width: 25 },
    { header: 'Phone', key: 'phone', width: 15 },
    { header: 'Class', key: 'className', width: 15 },
    { header: 'Grade', key: 'grade', width: 10 },
    { header: 'Gender', key: 'gender', width: 10 }
  ];
  
  // Add data
  students.forEach(student => {
    worksheet.addRow({
      rollNumber: student.rollNumber,
      firstName: student.user.firstName,
      lastName: student.user.lastName,
      email: student.user.email,
      phone: student.user.phone,
      className: student.class.name,
      grade: student.class.grade,
      gender: student.user.gender
    });
  });
  
  res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
  res.setHeader('Content-Disposition', 'attachment; filename=students-report.xlsx');
  
  await workbook.xlsx.write(res);
  res.end();
}

// Helper function to generate PDF for teachers
function generateTeacherPDF(teachers, res) {
  const doc = new PDFDocument();
  
  res.setHeader('Content-Type', 'application/pdf');
  res.setHeader('Content-Disposition', 'attachment; filename=teachers-report.pdf');
  
  doc.pipe(res);
  
  doc.fontSize(20).text('Teacher Report', 50, 50);
  doc.moveDown();
  
  teachers.forEach((teacher, index) => {
    if (index > 0) doc.addPage();
    
    doc.fontSize(14).text(`Name: ${teacher.user.firstName} ${teacher.user.lastName}`, 50, 100);
    doc.text(`Employee ID: ${teacher.employeeId}`, 50, 120);
    doc.text(`Department: ${teacher.department}`, 50, 140);
    doc.text(`Designation: ${teacher.designation}`, 50, 160);
    doc.text(`Email: ${teacher.user.email}`, 50, 180);
  });
  
  doc.end();
}

// Helper function to generate Excel for teachers
async function generateTeacherExcel(teachers, res) {
  const workbook = new ExcelJS.Workbook();
  const worksheet = workbook.addWorksheet('Teachers');
  
  worksheet.columns = [
    { header: 'Employee ID', key: 'employeeId', width: 15 },
    { header: 'First Name', key: 'firstName', width: 20 },
    { header: 'Last Name', key: 'lastName', width: 20 },
    { header: 'Email', key: 'email', width: 25 },
    { header: 'Phone', key: 'phone', width: 15 },
    { header: 'Department', key: 'department', width: 20 },
    { header: 'Designation', key: 'designation', width: 20 },
    { header: 'Employment Type', key: 'employmentType', width: 15 }
  ];
  
  teachers.forEach(teacher => {
    worksheet.addRow({
      employeeId: teacher.employeeId,
      firstName: teacher.user.firstName,
      lastName: teacher.user.lastName,
      email: teacher.user.email,
      phone: teacher.user.phone,
      department: teacher.department,
      designation: teacher.designation,
      employmentType: teacher.employmentType
    });
  });
  
  res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
  res.setHeader('Content-Disposition', 'attachment; filename=teachers-report.xlsx');
  
  await workbook.xlsx.write(res);
  res.end();
}

module.exports = router;