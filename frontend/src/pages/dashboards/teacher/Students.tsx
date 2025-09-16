import { useState, useEffect } from 'react';
import axios from 'axios';
import { useAuth } from '../../../contexts/AuthContext';
import { 
  Search, Filter, Users, Eye, Mail, Phone, Calendar, 
  BookOpen, GraduationCap, User, MapPin, Star, 
  TrendingUp, BarChart3, Download, AlertCircle, CheckCircle
} from 'lucide-react';

interface Class {
  _id: string;
  name: string;
  level: string;
}

interface Student {
  _id: string;
  firstName: string;
  lastName: string;
  email: string;
  phone?: string;
  rollNumber: string;
  dateOfBirth: string;
  gender: string;
  address: string;
  guardianName: string;
  guardianPhone: string;
  emergencyContact: string;
  admissionDate: string;
  class: Class;
  profilePicture?: string;
  status: 'active' | 'inactive' | 'transferred';
}

interface StudentStats {
  totalStudents: number;
  activeStudents: number;
  inactiveStudents: number;
  attendanceAverage: number;
  gradeAverage: number;
}

const Students = () => {
  const { token } = useAuth();
  const [students, setStudents] = useState<Student[]>([]);
  const [classes, setClasses] = useState<Class[]>([]);
  const [selectedStudent, setSelectedStudent] = useState<Student | null>(null);
  const [loading, setLoading] = useState(false);
  const [view, setView] = useState<'list' | 'detail' | 'stats'>('list');
  
  // Filter and search states
  const [searchTerm, setSearchTerm] = useState('');
  const [filters, setFilters] = useState({
    classId: '',
    status: '',
    gender: ''
  });
  
  // Stats state
  const [stats, setStats] = useState<StudentStats | null>(null);
  
  // Pagination
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage] = useState(12);

  useEffect(() => {
    fetchClasses();
    fetchStudents();
    fetchStats();
  }, []);

  useEffect(() => {
    fetchStudents();
  }, [filters, searchTerm]);

  const fetchClasses = async () => {
    try {
      const response = await axios.get('/api/teachers/me/classes', {
        headers: { Authorization: `Bearer ${token}` }
      });
      setClasses(response.data.data);
    } catch (error) {
      console.error('Error fetching classes:', error);
    }
  };

  const fetchStudents = async () => {
    try {
      setLoading(true);
      
      // Get all students from teacher's classes
      const promises = classes.map(async (cls) => {
        try {
          const response = await axios.get(`/api/classes/${cls._id}/students/compact`, {
            headers: { Authorization: `Bearer ${token}` }
          });
          return response.data.data.map((student: any) => ({
            ...student,
            class: cls
          }));
        } catch (error) {
          console.error(`Error fetching students for class ${cls.name}:`, error);
          return [];
        }
      });

      const allStudentsArrays = await Promise.all(promises);
      let allStudents = allStudentsArrays.flat();

      // Apply filters
      if (filters.classId) {
        allStudents = allStudents.filter(s => s.class._id === filters.classId);
      }
      if (filters.status) {
        allStudents = allStudents.filter(s => s.status === filters.status);
      }
      if (filters.gender) {
        allStudents = allStudents.filter(s => s.gender === filters.gender);
      }

      // Apply search
      if (searchTerm) {
        const lowercaseSearch = searchTerm.toLowerCase();
        allStudents = allStudents.filter(s => 
          s.firstName.toLowerCase().includes(lowercaseSearch) ||
          s.lastName.toLowerCase().includes(lowercaseSearch) ||
          s.rollNumber.toLowerCase().includes(lowercaseSearch) ||
          s.email.toLowerCase().includes(lowercaseSearch)
        );
      }

      setStudents(allStudents);
    } catch (error) {
      console.error('Error fetching students:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchStats = async () => {
    try {
      // This would be a real API call to get aggregated stats
      // For now, using mock data
      const mockStats: StudentStats = {
        totalStudents: 0,
        activeStudents: 0,
        inactiveStudents: 0,
        attendanceAverage: 85.5,
        gradeAverage: 78.3
      };
      setStats(mockStats);
    } catch (error) {
      console.error('Error fetching stats:', error);
    }
  };

  const fetchStudentDetail = async (studentId: string) => {
    try {
      setLoading(true);
      const response = await axios.get(`/api/students/${studentId}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setSelectedStudent(response.data.data);
    } catch (error) {
      console.error('Error fetching student detail:', error);
    } finally {
      setLoading(false);
    }
  };

  // Update stats when students change
  useEffect(() => {
    if (students.length > 0 && stats) {
      const updatedStats = {
        ...stats,
        totalStudents: students.length,
        activeStudents: students.filter(s => s.status === 'active').length,
        inactiveStudents: students.filter(s => s.status !== 'active').length
      };
      setStats(updatedStats);
    }
  }, [students]);

  const exportStudents = () => {
    const csvContent = [
      ['Name', 'Roll Number', 'Class', 'Email', 'Phone', 'Guardian', 'Status'],
      ...students.map(student => [
        `${student.firstName} ${student.lastName}`,
        student.rollNumber,
        `${student.class.name} (${student.class.level})`,
        student.email,
        student.phone || '',
        student.guardianName,
        student.status
      ])
    ].map(row => row.join(',')).join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `students_export_${new Date().toISOString().split('T')[0]}.csv`;
    link.click();
    window.URL.revokeObjectURL(url);
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active': return 'bg-green-100 text-green-800';
      case 'inactive': return 'bg-yellow-100 text-yellow-800';
      case 'transferred': return 'bg-red-100 text-red-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'active': return <CheckCircle className="h-4 w-4" />;
      case 'inactive': return <AlertCircle className="h-4 w-4" />;
      case 'transferred': return <AlertCircle className="h-4 w-4" />;
      default: return <User className="h-4 w-4" />;
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString();
  };

  const calculateAge = (dateOfBirth: string) => {
    const today = new Date();
    const birthDate = new Date(dateOfBirth);
    const age = today.getFullYear() - birthDate.getFullYear();
    const monthDiff = today.getMonth() - birthDate.getMonth();
    
    if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birthDate.getDate())) {
      return age - 1;
    }
    return age;
  };

  // Pagination calculations
  const indexOfLastItem = currentPage * itemsPerPage;
  const indexOfFirstItem = indexOfLastItem - itemsPerPage;
  const currentStudents = students.slice(indexOfFirstItem, indexOfLastItem);
  const totalPages = Math.ceil(students.length / itemsPerPage);

  return (
    <div className="p-6 space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Student Management</h1>
          <p className="text-gray-600 mt-1">Manage students in your classes</p>
        </div>
        <div className="flex space-x-3">
          <button
            onClick={exportStudents}
            className="inline-flex items-center px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50"
            disabled={students.length === 0}
          >
            <Download className="h-4 w-4 mr-2" />
            Export CSV
          </button>
          {view !== 'list' && (
            <button
              onClick={() => setView('list')}
              className="inline-flex items-center px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50"
            >
              Back to List
            </button>
          )}
        </div>
      </div>

      {/* Stats Cards */}
      {stats && view === 'list' && (
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center">
              <div className="flex-1">
                <h3 className="text-lg font-medium text-gray-900">Total Students</h3>
                <p className="text-3xl font-bold text-blue-600">{stats.totalStudents}</p>
              </div>
              <Users className="h-8 w-8 text-blue-500" />
            </div>
          </div>

          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center">
              <div className="flex-1">
                <h3 className="text-lg font-medium text-gray-900">Active</h3>
                <p className="text-3xl font-bold text-green-600">{stats.activeStudents}</p>
              </div>
              <CheckCircle className="h-8 w-8 text-green-500" />
            </div>
          </div>

          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center">
              <div className="flex-1">
                <h3 className="text-lg font-medium text-gray-900">Avg Attendance</h3>
                <p className="text-3xl font-bold text-yellow-600">{stats.attendanceAverage}%</p>
              </div>
              <BarChart3 className="h-8 w-8 text-yellow-500" />
            </div>
          </div>

          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center">
              <div className="flex-1">
                <h3 className="text-lg font-medium text-gray-900">Avg Grade</h3>
                <p className="text-3xl font-bold text-purple-600">{stats.gradeAverage}%</p>
              </div>
              <TrendingUp className="h-8 w-8 text-purple-500" />
            </div>
          </div>
        </div>
      )}

      {/* Students List View */}
      {view === 'list' && (
        <div className="space-y-6">
          {/* Search and Filters */}
          <div className="bg-white rounded-lg shadow p-6">
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <div className="md:col-span-2">
                <label className="block text-sm font-medium text-gray-700 mb-2">Search Students</label>
                <div className="relative">
                  <Search className="h-5 w-5 absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
                  <input
                    type="text"
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="w-full pl-10 px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="Search by name, roll number, or email..."
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Class</label>
                <select
                  value={filters.classId}
                  onChange={(e) => setFilters(prev => ({...prev, classId: e.target.value}))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="">All Classes</option>
                  {classes.map(cls => (
                    <option key={cls._id} value={cls._id}>{cls.name} ({cls.level})</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Status</label>
                <select
                  value={filters.status}
                  onChange={(e) => setFilters(prev => ({...prev, status: e.target.value}))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="">All Status</option>
                  <option value="active">Active</option>
                  <option value="inactive">Inactive</option>
                  <option value="transferred">Transferred</option>
                </select>
              </div>
            </div>
          </div>

          {/* Students Grid */}
          {loading ? (
            <div className="text-center py-8">
              <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
              <p className="mt-2 text-gray-600">Loading students...</p>
            </div>
          ) : currentStudents.length === 0 ? (
            <div className="text-center py-12 bg-white rounded-lg shadow">
              <Users className="h-12 w-12 text-gray-400 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">No Students Found</h3>
              <p className="text-gray-600">
                {searchTerm || filters.classId || filters.status
                  ? 'Try adjusting your search or filters.'
                  : 'No students are assigned to your classes yet.'
                }
              </p>
            </div>
          ) : (
            <>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                {currentStudents.map(student => (
                  <div key={student._id} className="bg-white rounded-lg shadow hover:shadow-md transition-shadow">
                    <div className="p-6">
                      {/* Profile Header */}
                      <div className="flex items-center space-x-3 mb-4">
                        <div className="w-12 h-12 bg-gray-200 rounded-full flex items-center justify-center">
                          {student.profilePicture ? (
                            <img
                              src={student.profilePicture}
                              alt={`${student.firstName} ${student.lastName}`}
                              className="w-12 h-12 rounded-full object-cover"
                            />
                          ) : (
                            <User className="h-6 w-6 text-gray-500" />
                          )}
                        </div>
                        <div className="flex-1 min-w-0">
                          <h3 className="text-sm font-medium text-gray-900 truncate">
                            {student.firstName} {student.lastName}
                          </h3>
                          <p className="text-xs text-gray-500">Roll: {student.rollNumber}</p>
                        </div>
                        <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(student.status)}`}>
                          {getStatusIcon(student.status)}
                          <span className="ml-1 capitalize">{student.status}</span>
                        </span>
                      </div>

                      {/* Student Info */}
                      <div className="space-y-2 mb-4">
                        <div className="flex items-center text-sm text-gray-600">
                          <GraduationCap className="h-4 w-4 mr-2" />
                          {student.class.name} ({student.class.level})
                        </div>
                        <div className="flex items-center text-sm text-gray-600">
                          <Mail className="h-4 w-4 mr-2" />
                          <span className="truncate">{student.email}</span>
                        </div>
                        {student.phone && (
                          <div className="flex items-center text-sm text-gray-600">
                            <Phone className="h-4 w-4 mr-2" />
                            {student.phone}
                          </div>
                        )}
                        <div className="flex items-center text-sm text-gray-600">
                          <Calendar className="h-4 w-4 mr-2" />
                          Age: {calculateAge(student.dateOfBirth)}
                        </div>
                      </div>

                      {/* Action Button */}
                      <button
                        onClick={() => {
                          setView('detail');
                          fetchStudentDetail(student._id);
                        }}
                        className="w-full inline-flex items-center justify-center px-3 py-2 border border-transparent text-sm font-medium rounded-md text-blue-600 bg-blue-50 hover:bg-blue-100"
                      >
                        <Eye className="h-4 w-4 mr-1" />
                        View Profile
                      </button>
                    </div>
                  </div>
                ))}
              </div>

              {/* Pagination */}
              {totalPages > 1 && (
                <div className="flex items-center justify-between px-4 py-3 bg-white border-t border-gray-200 rounded-lg shadow">
                  <div className="flex-1 flex justify-between items-center">
                    <div>
                      <p className="text-sm text-gray-700">
                        Showing{' '}
                        <span className="font-medium">{indexOfFirstItem + 1}</span>
                        {' '}to{' '}
                        <span className="font-medium">
                          {Math.min(indexOfLastItem, students.length)}
                        </span>
                        {' '}of{' '}
                        <span className="font-medium">{students.length}</span>
                        {' '}results
                      </p>
                    </div>
                    <div className="flex space-x-2">
                      <button
                        onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
                        disabled={currentPage === 1}
                        className="px-3 py-1 text-sm border border-gray-300 rounded-md hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                      >
                        Previous
                      </button>
                      {Array.from({ length: Math.min(totalPages, 5) }, (_, i) => {
                        const page = i + 1;
                        return (
                          <button
                            key={page}
                            onClick={() => setCurrentPage(page)}
                            className={`px-3 py-1 text-sm border rounded-md ${
                              currentPage === page
                                ? 'bg-blue-600 text-white border-blue-600'
                                : 'border-gray-300 hover:bg-gray-50'
                            }`}
                          >
                            {page}
                          </button>
                        );
                      })}
                      <button
                        onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))}
                        disabled={currentPage === totalPages}
                        className="px-3 py-1 text-sm border border-gray-300 rounded-md hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                      >
                        Next
                      </button>
                    </div>
                  </div>
                </div>
              )}
            </>
          )}
        </div>
      )}

      {/* Student Detail View */}
      {view === 'detail' && selectedStudent && (
        <div className="bg-white rounded-lg shadow">
          <div className="px-6 py-4 border-b border-gray-200">
            <div className="flex items-center space-x-4">
              <div className="w-16 h-16 bg-gray-200 rounded-full flex items-center justify-center">
                {selectedStudent.profilePicture ? (
                  <img
                    src={selectedStudent.profilePicture}
                    alt={`${selectedStudent.firstName} ${selectedStudent.lastName}`}
                    className="w-16 h-16 rounded-full object-cover"
                  />
                ) : (
                  <User className="h-8 w-8 text-gray-500" />
                )}
              </div>
              <div className="flex-1">
                <h3 className="text-xl font-semibold text-gray-900">
                  {selectedStudent.firstName} {selectedStudent.lastName}
                </h3>
                <p className="text-gray-600">Roll Number: {selectedStudent.rollNumber}</p>
                <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium mt-2 ${getStatusColor(selectedStudent.status)}`}>
                  {getStatusIcon(selectedStudent.status)}
                  <span className="ml-1 capitalize">{selectedStudent.status}</span>
                </span>
              </div>
            </div>
          </div>

          <div className="p-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              {/* Personal Information */}
              <div>
                <h4 className="text-lg font-medium text-gray-900 mb-4">Personal Information</h4>
                <div className="space-y-3">
                  <div className="flex items-center">
                    <Mail className="h-5 w-5 text-gray-400 mr-3" />
                    <div>
                      <p className="text-sm font-medium text-gray-900">Email</p>
                      <p className="text-sm text-gray-600">{selectedStudent.email}</p>
                    </div>
                  </div>
                  
                  {selectedStudent.phone && (
                    <div className="flex items-center">
                      <Phone className="h-5 w-5 text-gray-400 mr-3" />
                      <div>
                        <p className="text-sm font-medium text-gray-900">Phone</p>
                        <p className="text-sm text-gray-600">{selectedStudent.phone}</p>
                      </div>
                    </div>
                  )}
                  
                  <div className="flex items-center">
                    <Calendar className="h-5 w-5 text-gray-400 mr-3" />
                    <div>
                      <p className="text-sm font-medium text-gray-900">Date of Birth</p>
                      <p className="text-sm text-gray-600">
                        {formatDate(selectedStudent.dateOfBirth)} (Age: {calculateAge(selectedStudent.dateOfBirth)})
                      </p>
                    </div>
                  </div>
                  
                  <div className="flex items-center">
                    <User className="h-5 w-5 text-gray-400 mr-3" />
                    <div>
                      <p className="text-sm font-medium text-gray-900">Gender</p>
                      <p className="text-sm text-gray-600 capitalize">{selectedStudent.gender}</p>
                    </div>
                  </div>
                  
                  <div className="flex items-start">
                    <MapPin className="h-5 w-5 text-gray-400 mr-3 mt-1" />
                    <div>
                      <p className="text-sm font-medium text-gray-900">Address</p>
                      <p className="text-sm text-gray-600">{selectedStudent.address}</p>
                    </div>
                  </div>
                </div>
              </div>

              {/* Academic Information */}
              <div>
                <h4 className="text-lg font-medium text-gray-900 mb-4">Academic Information</h4>
                <div className="space-y-3">
                  <div className="flex items-center">
                    <GraduationCap className="h-5 w-5 text-gray-400 mr-3" />
                    <div>
                      <p className="text-sm font-medium text-gray-900">Class</p>
                      <p className="text-sm text-gray-600">{selectedStudent.class.name} ({selectedStudent.class.level})</p>
                    </div>
                  </div>
                  
                  <div className="flex items-center">
                    <Calendar className="h-5 w-5 text-gray-400 mr-3" />
                    <div>
                      <p className="text-sm font-medium text-gray-900">Admission Date</p>
                      <p className="text-sm text-gray-600">{formatDate(selectedStudent.admissionDate)}</p>
                    </div>
                  </div>
                </div>

                <h4 className="text-lg font-medium text-gray-900 mb-4 mt-8">Guardian Information</h4>
                <div className="space-y-3">
                  <div className="flex items-center">
                    <User className="h-5 w-5 text-gray-400 mr-3" />
                    <div>
                      <p className="text-sm font-medium text-gray-900">Guardian Name</p>
                      <p className="text-sm text-gray-600">{selectedStudent.guardianName}</p>
                    </div>
                  </div>
                  
                  <div className="flex items-center">
                    <Phone className="h-5 w-5 text-gray-400 mr-3" />
                    <div>
                      <p className="text-sm font-medium text-gray-900">Guardian Phone</p>
                      <p className="text-sm text-gray-600">{selectedStudent.guardianPhone}</p>
                    </div>
                  </div>
                  
                  <div className="flex items-center">
                    <Phone className="h-5 w-5 text-gray-400 mr-3" />
                    <div>
                      <p className="text-sm font-medium text-gray-900">Emergency Contact</p>
                      <p className="text-sm text-gray-600">{selectedStudent.emergencyContact}</p>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Quick Actions */}
            <div className="mt-8 pt-8 border-t border-gray-200">
              <h4 className="text-lg font-medium text-gray-900 mb-4">Quick Actions</h4>
              <div className="flex flex-wrap gap-3">
                <button className="inline-flex items-center px-4 py-2 border border-gray-300 rounded-md text-sm font-medium text-gray-700 bg-white hover:bg-gray-50">
                  <Calendar className="h-4 w-4 mr-2" />
                  View Attendance
                </button>
                <button className="inline-flex items-center px-4 py-2 border border-gray-300 rounded-md text-sm font-medium text-gray-700 bg-white hover:bg-gray-50">
                  <BookOpen className="h-4 w-4 mr-2" />
                  View Grades
                </button>
                <button className="inline-flex items-center px-4 py-2 border border-gray-300 rounded-md text-sm font-medium text-gray-700 bg-white hover:bg-gray-50">
                  <Star className="h-4 w-4 mr-2" />
                  View Assignments
                </button>
                <button className="inline-flex items-center px-4 py-2 border border-gray-300 rounded-md text-sm font-medium text-gray-700 bg-white hover:bg-gray-50">
                  <Mail className="h-4 w-4 mr-2" />
                  Send Message
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Students;
