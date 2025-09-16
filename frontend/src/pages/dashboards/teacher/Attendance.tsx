import { useState, useEffect } from 'react';
import axios from 'axios';
import { useAuth } from '../../../contexts/AuthContext';
import { Calendar, Users, CheckCircle, XCircle, Clock, BarChart3, Download } from 'lucide-react';

interface Class {
  _id: string;
  name: string;
  level: string;
  students: Student[];
}

interface Student {
  _id: string;
  firstName: string;
  lastName: string;
  rollNumber: string;
}

interface AttendanceRecord {
  _id: string;
  student: Student;
  date: string;
  status: 'present' | 'absent' | 'late';
  remarks: string;
  markedBy: {
    firstName: string;
    lastName: string;
  };
}

interface AttendanceStats {
  present: number;
  absent: number;
  late: number;
  total: number;
  percentage: string;
}

const Attendance = () => {
  const { token } = useAuth();
  const [classes, setClasses] = useState<Class[]>([]);
  const [selectedClass, setSelectedClass] = useState<Class | null>(null);
  const [selectedDate, setSelectedDate] = useState(new Date().toISOString().split('T')[0]);
  const [attendanceRecords, setAttendanceRecords] = useState<AttendanceRecord[]>([]);
  const [bulkAttendance, setBulkAttendance] = useState<{[key: string]: {status: string, remarks: string}}>({});
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [stats, setStats] = useState<AttendanceStats | null>(null);
  const [viewMode, setViewMode] = useState<'mark' | 'view' | 'stats'>('mark');
  const [monthlyData, setMonthlyData] = useState<AttendanceRecord[]>([]);

  useEffect(() => {
    fetchTeacherClasses();
  }, []);

  useEffect(() => {
    if (selectedClass && selectedDate && viewMode === 'mark') {
      fetchClassAttendance();
    }
  }, [selectedClass, selectedDate, viewMode]);

  useEffect(() => {
    if (selectedClass && viewMode === 'stats') {
      fetchClassStats();
    }
  }, [selectedClass, viewMode]);

  const fetchTeacherClasses = async () => {
    try {
      setLoading(true);
      const response = await axios.get('/api/teachers/me/classes', {
        headers: { Authorization: `Bearer ${token}` }
      });
      setClasses(response.data.data);
      if (response.data.data.length > 0) {
        setSelectedClass(response.data.data[0]);
      }
    } catch (error) {
      console.error('Error fetching classes:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchClassAttendance = async () => {
    if (!selectedClass) return;

    try {
      setLoading(true);
      const response = await axios.get(`/api/attendance/class/${selectedClass._id}`, {
        params: { date: selectedDate },
        headers: { Authorization: `Bearer ${token}` }
      });
      
      const existingAttendance = response.data.data.attendance || [];
      setAttendanceRecords(existingAttendance);

      // Initialize bulk attendance state
      const initialBulkState: {[key: string]: {status: string, remarks: string}} = {};
      
      if (selectedClass.students) {
        selectedClass.students.forEach(student => {
          const existing = existingAttendance.find(
            (record: AttendanceRecord) => record.student._id === student._id
          );
          initialBulkState[student._id] = {
            status: existing?.status || 'present',
            remarks: existing?.remarks || ''
          };
        });
      }
      
      setBulkAttendance(initialBulkState);
    } catch (error) {
      console.error('Error fetching attendance:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchClassStats = async () => {
    if (!selectedClass) return;

    try {
      setLoading(true);
      const currentDate = new Date();
      
      const [attendanceResponse] = await Promise.all([
        axios.get(`/api/attendance/class/${selectedClass._id}`, {
          params: {
            month: currentDate.getMonth() + 1,
            year: currentDate.getFullYear()
          },
          headers: { Authorization: `Bearer ${token}` }
        })
      ]);

      setMonthlyData(attendanceResponse.data.data.attendance || []);
      
      // Calculate overall stats
      const allRecords = attendanceResponse.data.data.attendance || [];
      const statsData = {
        present: allRecords.filter((r: AttendanceRecord) => r.status === 'present').length,
        absent: allRecords.filter((r: AttendanceRecord) => r.status === 'absent').length,
        late: allRecords.filter((r: AttendanceRecord) => r.status === 'late').length,
        total: allRecords.length,
        percentage: '0'
      };
      
      if (statsData.total > 0) {
        statsData.percentage = ((statsData.present / statsData.total) * 100).toFixed(2);
      }
      
      setStats(statsData);
    } catch (error) {
      console.error('Error fetching stats:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleBulkAttendanceChange = (studentId: string, field: 'status' | 'remarks', value: string) => {
    setBulkAttendance(prev => ({
      ...prev,
      [studentId]: {
        ...prev[studentId],
        [field]: value
      }
    }));
  };

  const saveBulkAttendance = async () => {
    if (!selectedClass) return;

    try {
      setSaving(true);
      
      const attendanceList = Object.entries(bulkAttendance).map(([studentId, data]) => ({
        studentId,
        status: data.status,
        remarks: data.remarks
      }));

      await axios.post('/api/attendance/bulk', {
        classId: selectedClass._id,
        date: selectedDate,
        attendanceList
      }, {
        headers: { Authorization: `Bearer ${token}` }
      });

      // Refresh attendance data
      await fetchClassAttendance();
      
      alert('Attendance saved successfully!');
    } catch (error) {
      console.error('Error saving attendance:', error);
      alert('Error saving attendance. Please try again.');
    } finally {
      setSaving(false);
    }
  };

  const exportAttendance = async () => {
    if (!selectedClass) return;

    try {
      const currentDate = new Date();
      const response = await axios.get(`/api/attendance/class/${selectedClass._id}`, {
        params: {
          month: currentDate.getMonth() + 1,
          year: currentDate.getFullYear()
        },
        headers: { Authorization: `Bearer ${token}` }
      });

      // Simple CSV export
      const csvContent = [
        ['Student Name', 'Roll Number', 'Date', 'Status', 'Remarks'],
        ...response.data.data.attendance.map((record: AttendanceRecord) => [
          `${record.student.firstName} ${record.student.lastName}`,
          record.student.rollNumber,
          new Date(record.date).toLocaleDateString(),
          record.status,
          record.remarks || ''
        ])
      ].map(row => row.join(',')).join('\n');

      const blob = new Blob([csvContent], { type: 'text/csv' });
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `attendance_${selectedClass.name}_${currentDate.getMonth() + 1}_${currentDate.getFullYear()}.csv`;
      link.click();
      window.URL.revokeObjectURL(url);
    } catch (error) {
      console.error('Error exporting attendance:', error);
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'present':
        return <CheckCircle className="h-5 w-5 text-green-500" />;
      case 'absent':
        return <XCircle className="h-5 w-5 text-red-500" />;
      case 'late':
        return <Clock className="h-5 w-5 text-yellow-500" />;
      default:
        return null;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'present':
        return 'bg-green-100 text-green-800';
      case 'absent':
        return 'bg-red-100 text-red-800';
      case 'late':
        return 'bg-yellow-100 text-yellow-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  return (
    <div className="p-6 space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-3xl font-bold text-gray-900">Attendance Management</h1>
        <div className="flex space-x-3">
          <button
            onClick={exportAttendance}
            className="inline-flex items-center px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50"
            disabled={!selectedClass}
          >
            <Download className="h-4 w-4 mr-2" />
            Export CSV
          </button>
        </div>
      </div>

      {/* Controls */}
      <div className="bg-white rounded-lg shadow p-6">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Class</label>
            <select
              value={selectedClass?._id || ''}
              onChange={(e) => {
                const classId = e.target.value;
                const foundClass = classes.find(c => c._id === classId);
                setSelectedClass(foundClass || null);
              }}
              className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            >
              <option value="">Select a class</option>
              {classes.map(cls => (
                <option key={cls._id} value={cls._id}>
                  {cls.name} ({cls.level})
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Date</label>
            <input
              type="date"
              value={selectedDate}
              onChange={(e) => setSelectedDate(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>

          <div className="flex items-end">
            <div className="w-full">
              <label className="block text-sm font-medium text-gray-700 mb-2">View Mode</label>
              <div className="flex rounded-md shadow-sm">
                <button
                  onClick={() => setViewMode('mark')}
                  className={`px-4 py-2 text-sm font-medium rounded-l-md border ${
                    viewMode === 'mark'
                      ? 'bg-blue-600 text-white border-blue-600'
                      : 'bg-white text-gray-700 border-gray-300 hover:bg-gray-50'
                  }`}
                >
                  <Users className="h-4 w-4 inline mr-1" />
                  Mark
                </button>
                <button
                  onClick={() => setViewMode('view')}
                  className={`px-4 py-2 text-sm font-medium border-t border-b ${
                    viewMode === 'view'
                      ? 'bg-blue-600 text-white border-blue-600'
                      : 'bg-white text-gray-700 border-gray-300 hover:bg-gray-50'
                  }`}
                >
                  <Calendar className="h-4 w-4 inline mr-1" />
                  View
                </button>
                <button
                  onClick={() => setViewMode('stats')}
                  className={`px-4 py-2 text-sm font-medium rounded-r-md border ${
                    viewMode === 'stats'
                      ? 'bg-blue-600 text-white border-blue-600'
                      : 'bg-white text-gray-700 border-gray-300 hover:bg-gray-50'
                  }`}
                >
                  <BarChart3 className="h-4 w-4 inline mr-1" />
                  Stats
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>

      {loading && (
        <div className="text-center py-8">
          <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
          <p className="mt-2 text-gray-600">Loading...</p>
        </div>
      )}

      {/* Mark Attendance */}
      {viewMode === 'mark' && selectedClass && !loading && (
        <div className="bg-white rounded-lg shadow">
          <div className="px-6 py-4 border-b border-gray-200">
            <h3 className="text-lg font-medium text-gray-900">
              Mark Attendance - {selectedClass.name} ({new Date(selectedDate).toLocaleDateString()})
            </h3>
          </div>

          <div className="p-6">
            {selectedClass.students && selectedClass.students.length > 0 ? (
              <div className="space-y-4">
                {selectedClass.students.map(student => (
                  <div key={student._id} className="flex items-center justify-between p-4 border border-gray-200 rounded-lg">
                    <div className="flex items-center">
                      <div className="flex-1">
                        <h4 className="text-sm font-medium text-gray-900">
                          {student.firstName} {student.lastName}
                        </h4>
                        <p className="text-sm text-gray-500">Roll No: {student.rollNumber}</p>
                      </div>
                    </div>

                    <div className="flex items-center space-x-4">
                      <div className="flex space-x-2">
                        {['present', 'absent', 'late'].map(status => (
                          <label key={status} className="inline-flex items-center">
                            <input
                              type="radio"
                              name={`attendance-${student._id}`}
                              value={status}
                              checked={bulkAttendance[student._id]?.status === status}
                              onChange={(e) => handleBulkAttendanceChange(student._id, 'status', e.target.value)}
                              className="form-radio h-4 w-4 text-blue-600"
                            />
                            <span className={`ml-2 text-sm font-medium capitalize ${
                              status === 'present' ? 'text-green-700' :
                              status === 'absent' ? 'text-red-700' : 'text-yellow-700'
                            }`}>
                              {status}
                            </span>
                          </label>
                        ))}
                      </div>

                      <input
                        type="text"
                        placeholder="Remarks (optional)"
                        value={bulkAttendance[student._id]?.remarks || ''}
                        onChange={(e) => handleBulkAttendanceChange(student._id, 'remarks', e.target.value)}
                        className="w-40 px-3 py-1 text-sm border border-gray-300 rounded-md focus:outline-none focus:ring-1 focus:ring-blue-500"
                      />
                    </div>
                  </div>
                ))}

                <div className="flex justify-end pt-4 border-t">
                  <button
                    onClick={saveBulkAttendance}
                    disabled={saving}
                    className="px-6 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {saving ? 'Saving...' : 'Save Attendance'}
                  </button>
                </div>
              </div>
            ) : (
              <div className="text-center py-8 text-gray-500">
                No students found in this class.
              </div>
            )}
          </div>
        </div>
      )}

      {/* View Attendance */}
      {viewMode === 'view' && selectedClass && !loading && (
        <div className="bg-white rounded-lg shadow">
          <div className="px-6 py-4 border-b border-gray-200">
            <h3 className="text-lg font-medium text-gray-900">
              Attendance Records - {selectedClass.name} ({new Date(selectedDate).toLocaleDateString()})
            </h3>
          </div>

          <div className="p-6">
            {attendanceRecords.length > 0 ? (
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Student
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Status
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Remarks
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Marked By
                      </th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {attendanceRecords.map(record => (
                      <tr key={record._id}>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div>
                            <div className="text-sm font-medium text-gray-900">
                              {record.student.firstName} {record.student.lastName}
                            </div>
                            <div className="text-sm text-gray-500">
                              Roll No: {record.student.rollNumber}
                            </div>
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getStatusColor(record.status)}`}>
                            {getStatusIcon(record.status)}
                            <span className="ml-1 capitalize">{record.status}</span>
                          </span>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                          {record.remarks || '-'}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                          {record.markedBy.firstName} {record.markedBy.lastName}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            ) : (
              <div className="text-center py-8 text-gray-500">
                No attendance records found for this date.
              </div>
            )}
          </div>
        </div>
      )}

      {/* Stats View */}
      {viewMode === 'stats' && selectedClass && !loading && stats && (
        <div className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
            <div className="bg-white rounded-lg shadow p-6">
              <div className="flex items-center">
                <div className="flex-1">
                  <h3 className="text-lg font-medium text-gray-900">Present</h3>
                  <p className="text-3xl font-bold text-green-600">{stats.present}</p>
                </div>
                <CheckCircle className="h-8 w-8 text-green-500" />
              </div>
            </div>

            <div className="bg-white rounded-lg shadow p-6">
              <div className="flex items-center">
                <div className="flex-1">
                  <h3 className="text-lg font-medium text-gray-900">Absent</h3>
                  <p className="text-3xl font-bold text-red-600">{stats.absent}</p>
                </div>
                <XCircle className="h-8 w-8 text-red-500" />
              </div>
            </div>

            <div className="bg-white rounded-lg shadow p-6">
              <div className="flex items-center">
                <div className="flex-1">
                  <h3 className="text-lg font-medium text-gray-900">Late</h3>
                  <p className="text-3xl font-bold text-yellow-600">{stats.late}</p>
                </div>
                <Clock className="h-8 w-8 text-yellow-500" />
              </div>
            </div>

            <div className="bg-white rounded-lg shadow p-6">
              <div className="flex items-center">
                <div className="flex-1">
                  <h3 className="text-lg font-medium text-gray-900">Attendance Rate</h3>
                  <p className="text-3xl font-bold text-blue-600">{stats.percentage}%</p>
                </div>
                <BarChart3 className="h-8 w-8 text-blue-500" />
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg shadow">
            <div className="px-6 py-4 border-b border-gray-200">
              <h3 className="text-lg font-medium text-gray-900">Monthly Overview</h3>
            </div>
            <div className="p-6">
              {monthlyData.length > 0 ? (
                <div className="overflow-x-auto">
                  <table className="min-w-full divide-y divide-gray-200">
                    <thead className="bg-gray-50">
                      <tr>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Date</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Total Students</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Present</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Absent</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Late</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Attendance %</th>
                      </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                      {Object.entries(
                        monthlyData.reduce((acc, record) => {
                          const date = new Date(record.date).toLocaleDateString();
                          if (!acc[date]) {
                            acc[date] = { present: 0, absent: 0, late: 0, total: 0 };
                          }
                          acc[date][record.status as keyof typeof acc[string]]++;
                          acc[date].total++;
                          return acc;
                        }, {} as Record<string, {present: number, absent: number, late: number, total: number}>)
                      ).map(([date, data]) => (
                        <tr key={date}>
                          <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">{date}</td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{data.total}</td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-green-600">{data.present}</td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-red-600">{data.absent}</td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-yellow-600">{data.late}</td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                            {data.total > 0 ? ((data.present / data.total) * 100).toFixed(1) : 0}%
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              ) : (
                <div className="text-center py-8 text-gray-500">
                  No attendance data found for this month.
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {!selectedClass && !loading && (
        <div className="text-center py-12">
          <Users className="h-12 w-12 text-gray-400 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-gray-900 mb-2">Select a Class</h3>
          <p className="text-gray-600">Choose a class to start managing attendance.</p>
        </div>
      )}
    </div>
  );
};

export default Attendance;