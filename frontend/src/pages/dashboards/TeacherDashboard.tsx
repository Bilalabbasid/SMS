import { useState, useEffect } from 'react';
import { Routes, Route } from 'react-router-dom';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import {
  BookOpen,
  Users,
  ClipboardList,
  Calendar,
  FileText,
  UserCheck,
  Bell,
} from 'lucide-react';

const TeacherOverview = () => {
  const [stats, setStats] = useState({
    myClasses: 0,
    totalStudents: 0,
    pendingAssignments: 0,
    todayClasses: 0,
    attendanceRate: 0,
    gradedExams: 0,
  });

  useEffect(() => {
    // Simulate API call to fetch teacher dashboard stats
    setStats({
      myClasses: 6,
      totalStudents: 180,
      pendingAssignments: 12,
      todayClasses: 4,
      attendanceRate: 88.5,
      gradedExams: 8,
    });
  }, []);

  const statCards = [
    {
      title: 'My Classes',
      value: stats.myClasses.toString(),
      icon: BookOpen,
      color: 'text-blue-600',
      bgColor: 'bg-blue-100',
    },
    {
      title: 'Total Students',
      value: stats.totalStudents.toString(),
      icon: Users,
      color: 'text-green-600',
      bgColor: 'bg-green-100',
    },
    {
      title: 'Pending Assignments',
      value: stats.pendingAssignments.toString(),
      icon: ClipboardList,
      color: 'text-orange-600',
      bgColor: 'bg-orange-100',
    },
    {
      title: "Today's Classes",
      value: stats.todayClasses.toString(),
      icon: Calendar,
      color: 'text-purple-600',
      bgColor: 'bg-purple-100',
    },
    {
      title: 'Attendance Rate',
      value: `${stats.attendanceRate}%`,
      icon: UserCheck,
      color: 'text-emerald-600',
      bgColor: 'bg-emerald-100',
    },
    {
      title: 'Graded Exams',
      value: stats.gradedExams.toString(),
      icon: FileText,
      color: 'text-red-600',
      bgColor: 'bg-red-100',
    }
  ];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold text-foreground">Teacher Dashboard</h1>
        <p className="text-muted-foreground mt-2">
          Manage your classes, students, and assignments
        </p>
      </div>

      {/* Stats Cards */}
      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
        {statCards.map((stat, index) => (
          <Card key={index} className="hover:shadow-lg transition-shadow">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                {stat.title}
              </CardTitle>
              <div className={`p-2 rounded-full ${stat.bgColor}`}>
                <stat.icon className={`h-4 w-4 ${stat.color}`} />
              </div>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-foreground">
                {stat.value}
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Today's Schedule */}
      <Card>
        <CardHeader>
          <CardTitle>Today's Schedule</CardTitle>
          <CardDescription>Your classes for today</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {[
              { subject: 'Mathematics', class: 'Grade 10-A', time: '9:00 AM - 10:00 AM', room: 'Room 101' },
              { subject: 'Physics', class: 'Grade 11-B', time: '10:30 AM - 11:30 AM', room: 'Room 203' },
              { subject: 'Mathematics', class: 'Grade 12-A', time: '1:00 PM - 2:00 PM', room: 'Room 101' },
              { subject: 'Physics Lab', class: 'Grade 11-A', time: '2:30 PM - 4:00 PM', room: 'Physics Lab' },
            ].map((classItem, index) => (
              <div key={index} className="flex items-center justify-between p-4 border rounded-lg">
                <div>
                  <h3 className="font-semibold text-foreground">{classItem.subject}</h3>
                  <p className="text-sm text-muted-foreground">{classItem.class} • {classItem.room}</p>
                </div>
                <div className="text-right">
                  <p className="text-sm font-medium text-foreground">{classItem.time}</p>
                  <Button variant="outline" size="sm" className="mt-2">
                    Take Attendance
                  </Button>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Quick Actions and Recent Activities */}
      <div className="grid gap-6 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Quick Actions</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid gap-3">
              <Button className="justify-start h-12">
                <UserCheck className="mr-2 h-4 w-4" />
                Take Attendance
              </Button>
              <Button variant="outline" className="justify-start h-12">
                <ClipboardList className="mr-2 h-4 w-4" />
                Create Assignment
              </Button>
              <Button variant="outline" className="justify-start h-12">
                <FileText className="mr-2 h-4 w-4" />
                Grade Exams
              </Button>
              <Button variant="outline" className="justify-start h-12">
                <Bell className="mr-2 h-4 w-4" />
                Send Notification
              </Button>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Pending Tasks</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {[
                { task: 'Grade Mathematics Quiz - Grade 10-A', priority: 'High', due: 'Today' },
                { task: 'Submit Lesson Plan - Physics Grade 11', priority: 'Medium', due: 'Tomorrow' },
                { task: 'Review Assignment Submissions', priority: 'Medium', due: '2 days' },
                { task: 'Prepare Monthly Report', priority: 'Low', due: '1 week' },
              ].map((item, index) => (
                <div key={index} className="flex items-center justify-between p-3 border rounded-lg">
                  <div className="min-w-0 flex-1">
                    <p className="font-medium text-foreground">{item.task}</p>
                    <p className="text-sm text-muted-foreground">Due: {item.due}</p>
                  </div>
                  <div className={`px-2 py-1 rounded text-xs ${
                    item.priority === 'High' ? 'bg-red-100 text-red-800' :
                    item.priority === 'Medium' ? 'bg-yellow-100 text-yellow-800' :
                    'bg-green-100 text-green-800'
                  }`}>
                    {item.priority}
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

const TeacherDashboard = () => {
  return (
    <Routes>
      <Route index element={<TeacherOverview />} />
      <Route path="classes" element={<div>My Classes (Coming Soon)</div>} />
      <Route path="students" element={<div>Students (Coming Soon)</div>} />
      <Route path="attendance" element={<div>Attendance (Coming Soon)</div>} />
      <Route path="assignments" element={<div>Assignments (Coming Soon)</div>} />
      <Route path="exams" element={<div>Exams (Coming Soon)</div>} />
      <Route path="gradebook" element={<div>Gradebook (Coming Soon)</div>} />
    </Routes>
  );
};

export default TeacherDashboard;