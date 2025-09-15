require('dotenv').config();
const mongoose = require('mongoose');
const User = require('../src/models/User');
const Student = require('../src/models/Student');
const Teacher = require('../src/models/Teacher');
const Class = require('../src/models/Class');
const Subject = require('../src/models/Subject');

async function createAllDemoAccounts() {
  try {
    console.log('🔗 Connecting to MongoDB...');
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('✅ Connected to MongoDB\n');

    // Demo accounts with exact UI credentials
    const demoAccounts = [
      {
        role: 'admin',
        email: 'admin@school.com',
        firstName: 'Admin',
        lastName: 'User',
        password: 'Admin123',
        phone: '+1234567890',
        description: 'Complete school management',
        features: ['User Management', 'System Configuration', 'Reports & Analytics', 'Role Management']
      },
      {
        role: 'teacher', 
        email: 'teacher@school.com',
        firstName: 'Sarah',
        lastName: 'Johnson',
        password: 'Teacher123',
        phone: '+1234567891',
        description: 'Class management and student assessment',
        features: ['Class Management', 'Student Assessment', 'Attendance', 'Grade Management']
      },
      {
        role: 'student',
        email: 'student@school.com', 
        firstName: 'Alex',
        lastName: 'Smith',
        password: 'Student123',
        phone: '+1234567892',
        description: 'Learning portal and assignments',
        features: ['View Assignments', 'Submit Homework', 'Check Grades', 'Class Schedule']
      },
      {
        role: 'parent',
        email: 'parent@school.com',
        firstName: 'Michael', 
        lastName: 'Brown',
        password: 'Parent123',
        phone: '+1234567893',
        description: 'Child progress monitoring',
        features: ['Child Progress', 'Attendance Monitoring', 'Fee Payment', 'Communication']
      },
      {
        role: 'accountant',
        email: 'accountant@school.com',
        firstName: 'Emma',
        lastName: 'Wilson', 
        password: 'Account123',
        phone: '+1234567894',
        description: 'Financial management',
        features: ['Fee Collection', 'Financial Reports', 'Payment Tracking', 'Budget Management']
      },
      {
        role: 'librarian',
        email: 'librarian@school.com',
        firstName: 'David',
        lastName: 'Miller',
        password: 'Library123', 
        phone: '+1234567895',
        description: 'Library management',
        features: ['Book Inventory', 'Issue/Return Books', 'Member Management', 'Library Reports']
      }
    ];

    console.log('🎭 Creating demo accounts...\n');

    // Create sample class and subjects first
    let sampleClass = await Class.findOne({ name: '10th Grade A' });
    if (!sampleClass) {
      sampleClass = new Class({
        name: '10th Grade A',
        level: '10th', 
        grade: 10,
        section: 'A',
        academicYear: '2024-2025',
        capacity: 40,
        description: 'Demo class for testing'
      });
      await sampleClass.save();
      console.log('📚 Created sample class: 10th Grade A');
    }

    let mathSubject = await Subject.findOne({ code: 'MATH10' });
    if (!mathSubject) {
      mathSubject = new Subject({
        name: 'Mathematics',
        code: 'MATH10', 
        category: 'Mathematics',
        department: 'Mathematics',
        type: 'core',
        credits: 5,
        totalMarks: 100,
        passingMarks: 35,
        academicYear: '2024-2025',
        applicableClasses: [{
          class: sampleClass._id,
          isCompulsory: true,
          periodsPerWeek: 6
        }]
      });
      await mathSubject.save();
      console.log('📖 Created sample subject: Mathematics\n');
    }

    // Create each demo account
    for (const account of demoAccounts) {
      // Check if user already exists
      const existingUser = await User.findOne({ email: account.email });
      
      if (existingUser) {
        console.log(`⚠️  ${account.role.toUpperCase()} account already exists: ${account.email}`);
        continue;
      }

      // Create user account
      const user = new User({
        firstName: account.firstName,
        lastName: account.lastName,
        email: account.email,
        password: account.password,
        role: account.role,
        phone: account.phone,
        dateOfBirth: new Date('1985-05-15'),
        gender: 'other',
        address: {
          street: '123 Demo Street',
          city: 'Demo City',
          state: 'Demo State', 
          postalCode: '12345',
          country: 'Demo Country'
        },
        isActive: true
      });

      const savedUser = await user.save();
      console.log(`✅ ${account.role.toUpperCase()} account created:`);
      console.log(`   📧 Email: ${account.email}`);
      console.log(`   🔐 Password: ${account.password}`);
      console.log(`   👤 Name: ${account.firstName} ${account.lastName}`);
      console.log(`   📝 Features: ${account.features.join(', ')}`);
      console.log(`   🆔 ID: ${savedUser._id}`);

      // Create role-specific profiles
      if (account.role === 'teacher') {
        const teacher = new Teacher({
          user: savedUser._id,
          employeeId: 'TEACH001',
          designation: 'Senior Teacher',
          department: 'Mathematics',
          joiningDate: new Date('2020-06-15'),
          employmentType: 'permanent',
          subjects: [mathSubject._id],
          classes: [{
            class: sampleClass._id,
            subjects: [mathSubject._id],
            isClassTeacher: true
          }],
          salary: {
            basicSalary: 50000,
            allowances: {
              hra: 15000,
              da: 5000,
              transport: 3000
            }
          },
          qualifications: [{
            degree: 'M.Sc Mathematics',
            institution: 'Demo University',
            year: 2018
          }]
        });
        await teacher.save();
        console.log(`   👩‍🏫 Teacher profile created with class assignment`);

        // Update class with teacher
        await Class.findByIdAndUpdate(sampleClass._id, { 
          classTeacher: savedUser._id 
        });

      } else if (account.role === 'student') {
        const student = new Student({
          user: savedUser._id,
          studentId: 'STU001',
          rollNumber: '001',
          class: sampleClass._id,
          section: 'A',
          academicYear: '2024-2025',
          admissionDate: new Date('2024-04-01'),
          admissionNumber: 'ADM2024001',
          subjects: [mathSubject._id],
          parentContact: {
            father: {
              name: 'John Smith',
              phone: '+1234567896',
              email: 'john.smith@demo.com',
              occupation: 'Engineer'
            },
            mother: {
              name: 'Jane Smith', 
              phone: '+1234567897',
              email: 'jane.smith@demo.com',
              occupation: 'Doctor'
            }
          },
          emergencyContact: {
            name: 'John Smith',
            relationship: 'Father',
            phone: '+1234567896'
          }
        });
        await student.save();
        console.log(`   👨‍🎓 Student profile created with class assignment`);
      }

      console.log(''); // Empty line for readability
    }

    console.log('🎉 All demo accounts created successfully!\n');
    console.log('📋 DEMO CREDENTIALS SUMMARY:');
    console.log('═══════════════════════════════════════════════════');
    console.log('ROLE          | EMAIL                      | PASSWORD');
    console.log('═══════════════════════════════════════════════════');
    
    demoAccounts.forEach(account => {
      const role = account.role.toUpperCase().padEnd(12);
      const email = account.email.padEnd(26);
      console.log(`${role} | ${email} | ${account.password}`);
    });
    
    console.log('═══════════════════════════════════════════════════');
    console.log('\n🚀 Ready to test role-based authentication!');
    console.log('🌐 Visit: http://localhost:3000/login');
    console.log('🎭 Click any role button to auto-fill credentials');

  } catch (error) {
    console.error('❌ Error creating demo accounts:', error);
  } finally {
    await mongoose.disconnect();
    console.log('\n📤 Disconnected from MongoDB');
  }
}

createAllDemoAccounts();