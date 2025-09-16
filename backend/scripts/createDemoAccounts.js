require('dotenv').config();
const mongoose = require('mongoose');
const User = require('../src/models/User');
const Student = require('../src/models/Student');
const Teacher = require('../src/models/Teacher');
const Class = require('../src/models/Class');
const Subject = require('../src/models/Subject');

async function createDemoAccounts() {
  try {
    console.log('🔗 Connecting to MongoDB...');
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('✅ Connected to MongoDB');

    // Demo accounts data
    const demoAccounts = [
      {
        role: 'admin',
        email: 'admin@school.com',
        firstName: 'Admin',
        lastName: 'User',
        password: 'Admin123',
        phone: '+1234567890',
        description: 'Complete school management access'
      },
      {
        role: 'teacher',
        email: 'teacher@school.com',
        firstName: 'Sarah',
        lastName: 'Johnson',
        password: 'Teacher123',
        phone: '+1234567891',
        description: 'Class management and student assessment'
      },
      {
        role: 'student',
        email: 'student@school.com',
        firstName: 'Alex',
        lastName: 'Smith',
        password: 'Student123',
        phone: '+1234567892',
        description: 'Learning portal and assignments'
      },
      {
        role: 'parent',
        email: 'parent@school.com',
        firstName: 'Michael',
        lastName: 'Brown',
        password: 'Parent123',
        phone: '+1234567893',
        description: 'Child progress monitoring'
      },
      {
        role: 'accountant',
        email: 'accountant@school.com',
        firstName: 'Emma',
        lastName: 'Wilson',
        password: 'Account123',
        phone: '+1234567894',
        description: 'Financial management and fee collection'
      },
      {
        role: 'librarian',
        email: 'librarian@school.com',
        firstName: 'David',
        lastName: 'Miller',
        password: 'Library123',
        phone: '+1234567895',
        description: 'Library management and book inventory'
      }
    ];

    console.log('🎭 Creating demo accounts...\n');

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
        dateOfBirth: new Date('1985-01-15'), // Default DOB
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
      console.log(`   📝 Access: ${account.description}`);
      console.log(`   🆔 ID: ${savedUser._id}\n`);

      // Create role-specific profiles
      if (account.role === 'teacher') {
        // Create sample class and subjects for teacher
        let sampleClass = await Class.findOne({ name: '10th Grade A' });
        if (!sampleClass) {
          sampleClass = new Class({
            name: '10th Grade A',
            level: '10th',
            grade: 10,
            section: 'A',
            academicYear: '2024-2025',
            capacity: 40,
            classTeacher: savedUser._id
          });
          await sampleClass.save();
          console.log(`   📚 Created sample class: ${sampleClass.name}`);
        }

        let mathSubject = await Subject.findOne({ code: 'MATH10' });
        if (!mathSubject) {
          mathSubject = new Subject({
            name: 'Mathematics',
            code: 'MATH10',
            category: 'Mathematics',
            type: 'core',
            credits: 5,
            totalMarks: 100,
            passingMarks: 35,
            academicYear: '2024-2025',
            classes: [sampleClass._id]
          });
          await mathSubject.save();
          console.log(`   📖 Created sample subject: ${mathSubject.name}`);
        }

        const teacher = new Teacher({
          user: savedUser._id,
          employeeId: 'EMP001',
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
        console.log(`   👩‍🏫 Created teacher profile with class and subject assignments\n`);

      } else if (account.role === 'student') {
        // Create student profile
        const sampleClass = await Class.findOne({ name: '10th Grade A' });
        
        const student = new Student({
          user: savedUser._id,
          studentId: 'STU001',
          rollNumber: '001',
          class: sampleClass ? sampleClass._id : null,
          section: 'A',
          academicYear: '2024-2025',
          admissionDate: new Date('2024-04-01'),
          admissionNumber: 'ADM2024001',
          parentContact: {
            father: {
              name: 'John Smith',
              phone: '+1234567896',
              email: 'john.smith@email.com',
              occupation: 'Engineer'
            },
            mother: {
              name: 'Jane Smith',
              phone: '+1234567897',
              email: 'jane.smith@email.com',
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
        console.log(`   👨‍🎓 Created student profile with class assignment\n`);
      }
    }

    console.log('🎉 All demo accounts created successfully!');
    console.log('\n📋 DEMO CREDENTIALS SUMMARY:');
    console.log('═══════════════════════════════════════');
    
    demoAccounts.forEach(account => {
      console.log(`${account.role.toUpperCase().padEnd(12)} | ${account.email.padEnd(25)} | ${account.password}`);
    });
    
    console.log('═══════════════════════════════════════');
    console.log('\n🚀 Ready to test role-based authentication!');
    console.log('Visit: http://localhost:3000/login');

  } catch (error) {
    console.error('❌ Error creating demo accounts:', error);
  } finally {
    await mongoose.disconnect();
    console.log('📤 Disconnected from MongoDB');
  }
}

createDemoAccounts();