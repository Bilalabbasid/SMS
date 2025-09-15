import { useState, useEffect } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Routes, Route, Link } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { 
  Users, 
  GraduationCap, 
  BookOpen, 
  DollarSign, 
  TrendingUp, 
  TrendingDown,
  Calendar,
  FileText,
  Bell,
  Settings,
  BarChart3,
  UserCheck,
  Clock,
  Award,
  MapPin,
  Bus,
  Library,
  Plus,
  Filter,
  Download,
  Search,
  MoreVertical,
  Eye,
  Edit,
  Trash2,
  UserPlus,
  BookPlus,
  CalendarPlus,
  DollarSignIcon,
  MessageSquare,
  Target,
  Activity,
  Zap,
  CheckCircle,
  AlertTriangle
} from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Input } from '@/components/ui/input';
import { 
  LineChart, 
  Line, 
  AreaChart, 
  Area, 
  BarChart, 
  Bar,
  PieChart,
  Pie,
  Cell,
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  Legend, 
  ResponsiveContainer 
} from 'recharts';

// Sample data - In production, this would come from APIs
const dashboardStats = {
  totalStudents: 2847,
  totalTeachers: 156,
  totalClasses: 42,
  totalRevenue: 2840000,
  monthlyGrowth: 8.2,
  attendanceRate: 94.3,
  examResults: 87.5,
  activeParents: 2156
};

const recentActivities = [
  { id: 1, type: 'admission', message: 'New student admission: John Doe', time: '2 min ago', status: 'success' },
  { id: 2, type: 'fee', message: 'Fee payment received: $5,000', time: '5 min ago', status: 'success' },
  { id: 3, type: 'exam', message: 'Mid-term exams scheduled', time: '10 min ago', status: 'info' },
  { id: 4, type: 'teacher', message: 'New teacher joined: Sarah Wilson', time: '15 min ago', status: 'success' },
  { id: 5, type: 'system', message: 'System backup completed', time: '1 hour ago', status: 'success' },
];

const chartData = [
  { month: 'Jan', students: 2400, revenue: 2400000, attendance: 89 },
  { month: 'Feb', students: 2600, revenue: 2600000, attendance: 91 },
  { month: 'Mar', students: 2700, revenue: 2700000, attendance: 88 },
  { month: 'Apr', students: 2750, revenue: 2750000, attendance: 93 },
  { month: 'May', students: 2820, revenue: 2820000, attendance: 95 },
  { month: 'Jun', students: 2847, revenue: 2840000, attendance: 94 },
];

const pieData = [
  { name: 'Science', value: 35, color: '#0088FE' },
  { name: 'Arts', value: 25, color: '#00C49F' },
  { name: 'Commerce', value: 20, color: '#FFBB28' },
  { name: 'Vocational', value: 20, color: '#FF8042' },
];

// Dashboard Overview Component
const AdminOverview = () => {
  const [activeTab, setActiveTab] = useState('overview');
  const [dateRange, setDateRange] = useState('30d');
  
  // In production, these would be real API calls
  const { data: dashboardData, isLoading } = useQuery({
    queryKey: ['admin-dashboard', dateRange],
    queryFn: () => Promise.resolve(dashboardStats),
  });

  const { data: activities } = useQuery({
    queryKey: ['recent-activities'],
    queryFn: () => Promise.resolve(recentActivities),
  });

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header Section */}
      <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
            Admin Dashboard
          </h1>
          <p className="text-gray-600 dark:text-gray-400 mt-1">
            Welcome back! Here's what's happening at your school today.
          </p>
        </div>
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2">
            <Calendar className="h-4 w-4 text-gray-500" />
            <span className="text-sm text-gray-600 dark:text-gray-400">
              {new Date().toLocaleDateString('en-US', { 
                weekday: 'long', 
                year: 'numeric', 
                month: 'long', 
                day: 'numeric' 
              })}
            </span>
          </div>
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="outline" size="sm">
                <Filter className="h-4 w-4 mr-2" />
                Last 30 days
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent>
              <DropdownMenuItem onClick={() => setDateRange('7d')}>
                Last 7 days
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => setDateRange('30d')}>
                Last 30 days
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => setDateRange('90d')}>
                Last 90 days
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => setDateRange('1y')}>
                Last year
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
          <Button>
            <Download className="h-4 w-4 mr-2" />
            Export Report
          </Button>
        </div>
      </div>

      {/* Quick Actions */}
      <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-3">
        <Button variant="outline" className="flex flex-col h-20 gap-2 p-4">
          <UserPlus className="h-5 w-5" />
          <span className="text-xs">Add Student</span>
        </Button>
        <Button variant="outline" className="flex flex-col h-20 gap-2 p-4">
          <Users className="h-5 w-5" />
          <span className="text-xs">Add Teacher</span>
        </Button>
        <Button variant="outline" className="flex flex-col h-20 gap-2 p-4">
          <BookPlus className="h-5 w-5" />
          <span className="text-xs">New Class</span>
        </Button>
        <Button variant="outline" className="flex flex-col h-20 gap-2 p-4">
          <CalendarPlus className="h-5 w-5" />
          <span className="text-xs">Schedule Exam</span>
        </Button>
        <Button variant="outline" className="flex flex-col h-20 gap-2 p-4">
          <DollarSignIcon className="h-5 w-5" />
          <span className="text-xs">Fee Management</span>
        </Button>
        <Button variant="outline" className="flex flex-col h-20 gap-2 p-4">
          <MessageSquare className="h-5 w-5" />
          <span className="text-xs">Send Notice</span>
        </Button>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <Card className="bg-gradient-to-br from-blue-500 to-blue-600 text-white">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium opacity-90">
              Total Students
            </CardTitle>
            <GraduationCap className="h-4 w-4 opacity-90" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{dashboardData?.totalStudents.toLocaleString()}</div>
            <div className="flex items-center text-xs opacity-90 mt-1">
              <TrendingUp className="h-3 w-3 mr-1" />
              <span>+{dashboardData?.monthlyGrowth}% from last month</span>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-green-500 to-green-600 text-white">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium opacity-90">
              Total Teachers
            </CardTitle>
            <Users className="h-4 w-4 opacity-90" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{dashboardData?.totalTeachers}</div>
            <div className="flex items-center text-xs opacity-90 mt-1">
              <CheckCircle className="h-3 w-3 mr-1" />
              <span>98% attendance rate</span>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-purple-500 to-purple-600 text-white">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium opacity-90">
              Monthly Revenue
            </CardTitle>
            <DollarSign className="h-4 w-4 opacity-90" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              ${(dashboardData?.totalRevenue / 1000000).toFixed(1)}M
            </div>
            <div className="flex items-center text-xs opacity-90 mt-1">
              <Target className="h-3 w-3 mr-1" />
              <span>95% collection rate</span>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-orange-500 to-orange-600 text-white">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium opacity-90">
              Attendance Rate
            </CardTitle>
            <Activity className="h-4 w-4 opacity-90" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{dashboardData?.attendanceRate}%</div>
            <div className="flex items-center text-xs opacity-90 mt-1">
              <Zap className="h-3 w-3 mr-1" />
              <span>Above average</span>
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Charts Section */}
        <div className="lg:col-span-2 space-y-6">
          {/* Student Enrollment Trend */}
          <Card>
            <CardHeader>
              <CardTitle>Student Enrollment Trend</CardTitle>
              <CardDescription>
                Monthly student enrollment over the past 6 months
              </CardDescription>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={300}>
                <AreaChart data={chartData}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="month" />
                  <YAxis />
                  <Tooltip />
                  <Area 
                    type="monotone" 
                    dataKey="students" 
                    stroke="#3b82f6" 
                    fill="#3b82f6" 
                    fillOpacity={0.1}
                  />
                </AreaChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>

          {/* Revenue Chart */}
          <Card>
            <CardHeader>
              <CardTitle>Revenue Overview</CardTitle>
              <CardDescription>
                Monthly revenue collection and trends
              </CardDescription>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={300}>
                <BarChart data={chartData}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="month" />
                  <YAxis />
                  <Tooltip formatter={(value) => [`$${value.toLocaleString()}`, 'Revenue']} />
                  <Bar dataKey="revenue" fill="#10b981" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </div>

        {/* Right Side Panel */}
        <div className="space-y-6">
          {/* Stream Distribution */}
          <Card>
            <CardHeader>
              <CardTitle>Stream Distribution</CardTitle>
              <CardDescription>Student distribution by academic streams</CardDescription>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={200}>
                <PieChart>
                  <Pie
                    data={pieData}
                    cx="50%"
                    cy="50%"
                    innerRadius={40}
                    outerRadius={80}
                    paddingAngle={5}
                    dataKey="value"
                  >
                    {pieData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Pie>
                  <Tooltip />
                </PieChart>
              </ResponsiveContainer>
              <div className="grid grid-cols-2 gap-2 mt-4">
                {pieData.map((item) => (
                  <div key={item.name} className="flex items-center gap-2 text-sm">
                    <div 
                      className="w-3 h-3 rounded-full" 
                      style={{ backgroundColor: item.color }}
                    />
                    <span>{item.name}: {item.value}%</span>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* Recent Activities */}
          <Card>
            <CardHeader>
              <CardTitle>Recent Activities</CardTitle>
              <CardDescription>Latest updates and notifications</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {activities?.slice(0, 6).map((activity) => (
                  <div key={activity.id} className="flex items-start gap-3">
                    <div className={`w-2 h-2 rounded-full mt-2 ${
                      activity.status === 'success' ? 'bg-green-500' :
                      activity.status === 'info' ? 'bg-blue-500' : 'bg-orange-500'
                    }`} />
                    <div className="flex-1 min-w-0">
                      <p className="text-sm text-gray-900 dark:text-white">
                        {activity.message}
                      </p>
                      <p className="text-xs text-gray-500 mt-1">
                        {activity.time}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
              <Button variant="ghost" className="w-full mt-4" size="sm">
                View All Activities
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Performance Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card>
          <CardHeader>
            <CardTitle className="text-sm font-medium">Academic Performance</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center justify-between mb-2">
              <span className="text-2xl font-bold text-green-600">{dashboardData?.examResults}%</span>
              <Award className="h-5 w-5 text-green-600" />
            </div>
            <Progress value={dashboardData?.examResults} className="h-2" />
            <p className="text-xs text-gray-500 mt-2">Average exam score this term</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-sm font-medium">Parent Engagement</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center justify-between mb-2">
              <span className="text-2xl font-bold text-blue-600">{dashboardData?.activeParents}</span>
              <UserCheck className="h-5 w-5 text-blue-600" />
            </div>
            <Progress value={(dashboardData?.activeParents / dashboardData?.totalStudents) * 100} className="h-2" />
            <p className="text-xs text-gray-500 mt-2">Active parent accounts</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-sm font-medium">System Health</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center justify-between mb-2">
              <span className="text-2xl font-bold text-green-600">99.9%</span>
              <Zap className="h-5 w-5 text-green-600" />
            </div>
            <Progress value={99.9} className="h-2" />
            <p className="text-xs text-gray-500 mt-2">System uptime this month</p>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

// Main Admin Dashboard Component
const AdminDashboard = () => {
  return (
    <Routes>
      <Route index element={<AdminOverview />} />
      <Route path="students" element={<div className="text-center py-12">
        <GraduationCap className="h-12 w-12 text-gray-400 mx-auto mb-4" />
        <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">
          Advanced Student Management
        </h3>
        <p className="text-gray-500">
          Comprehensive student management interface with admission workflow, progress tracking, and communication tools.
        </p>
      </div>} />
      <Route path="teachers" element={<div className="text-center py-12">
        <Users className="h-12 w-12 text-gray-400 mx-auto mb-4" />
        <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">
          Teacher Management Platform
        </h3>
        <p className="text-gray-500">
          Advanced teacher dashboard with performance analytics, class management, and professional development tracking.
        </p>
      </div>} />
      <Route path="classes" element={<div className="text-center py-12">
        <BookOpen className="h-12 w-12 text-gray-400 mx-auto mb-4" />
        <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">
          Academic Management Suite
        </h3>
        <p className="text-gray-500">
          Complete class management with curriculum tracking, timetable management, and academic planning tools.
        </p>
      </div>} />
      <Route path="fees" element={<div className="text-center py-12">
        <DollarSign className="h-12 w-12 text-gray-400 mx-auto mb-4" />
        <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">
          Financial Management System
        </h3>
        <p className="text-gray-500">
          Advanced fee management with payment gateway integration, automated invoicing, and financial reporting.
        </p>
      </div>} />
      <Route path="exams" element={<div className="text-center py-12">
        <Calendar className="h-12 w-12 text-gray-400 mx-auto mb-4" />
        <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">
          Examination Management System
        </h3>
        <p className="text-gray-500">
          Complete exam management with scheduling, online assessments, automated grading, and result analytics.
        </p>
      </div>} />
      <Route path="reports" element={<div className="text-center py-12">
        <BarChart3 className="h-12 w-12 text-gray-400 mx-auto mb-4" />
        <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">
          Advanced Analytics & Reporting
        </h3>
        <p className="text-gray-500">
          Business intelligence dashboard with predictive analytics, performance metrics, and comprehensive reporting suite.
        </p>
      </div>} />
      <Route path="settings" element={<div className="text-center py-12">
        <Settings className="h-12 w-12 text-gray-400 mx-auto mb-4" />
        <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">
          System Configuration
        </h3>
        <p className="text-gray-500">
          Advanced system settings with role management, security configurations, and integration options.
        </p>
      </div>} />
    </Routes>
  );
};

export default AdminDashboard;