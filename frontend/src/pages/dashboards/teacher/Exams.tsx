import { useState, useEffect } from 'react';
import axios from 'axios';
import { useAuth } from '../../../contexts/AuthContext';
import { 
  Plus, BookOpen, Calendar, Users, CheckCircle, Clock, 
  Eye, Edit, FileText, Star, AlertCircle, TrendingUp,
  BarChart3, PieChart, Download, Filter, GraduationCap
} from 'lucide-react';

interface Class {
  _id: string;
  name: string;
  level: string;
  students: Student[];
}

interface Subject {
  _id: string;
  name: string;
  code: string;
}

interface Student {
  _id: string;
  firstName: string;
  lastName: string;
  rollNumber: string;
}

interface ExamResult {
  student: Student;
  marksObtained: number;
  percentage: number;
  grade: string;
  status: 'pass' | 'fail';
  remarks: string;
  gradedAt: string;
}

interface Exam {
  _id: string;
  title: string;
  description: string;
  type: 'unit_test' | 'mid_term' | 'final' | 'quiz' | 'practical';
  class: Class;
  subject: Subject;
  examDate: string;
  startTime: string;
  duration: number;
  maxMarks: number;
  passingMarks: number;
  instructions: string[];
  syllabus: string[];
  status: 'scheduled' | 'ongoing' | 'completed' | 'cancelled';
  results: ExamResult[];
  createdBy: {
    firstName: string;
    lastName: string;
  };
  createdAt: string;
}

const Exams = () => {
  const { token } = useAuth();
  const [exams, setExams] = useState<Exam[]>([]);
  const [classes, setClasses] = useState<Class[]>([]);
  const [subjects, setSubjects] = useState<Subject[]>([]);
  const [loading, setLoading] = useState(false);
  const [view, setView] = useState<'list' | 'create' | 'detail' | 'results' | 'stats'>('list');
  const [selectedExam, setSelectedExam] = useState<Exam | null>(null);
  const [filters, setFilters] = useState({
    type: '',
    status: '',
    classId: '',
    subjectId: ''
  });

  // Form states
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    type: 'unit_test',
    class: '',
    subject: '',
    examDate: '',
    startTime: '',
    duration: '60',
    maxMarks: '',
    passingMarks: '',
    instructions: [''],
    syllabus: ['']
  });
  const [formErrors, setFormErrors] = useState<{[key: string]: string}>({});
  const [saving, setSaving] = useState(false);

  // Results states
  const [resultsData, setResultsData] = useState<{[key: string]: {marksObtained: string, remarks: string}}>({});
  const [grading, setGrading] = useState(false);

  useEffect(() => {
    fetchExams();
    fetchClasses();
    fetchSubjects();
  }, [filters]);

  const fetchExams = async () => {
    try {
      setLoading(true);
      const params = new URLSearchParams();
      if (filters.type) params.append('type', filters.type);
      if (filters.status) params.append('status', filters.status);
      if (filters.classId) params.append('classId', filters.classId);
      if (filters.subjectId) params.append('subjectId', filters.subjectId);

      const response = await axios.get('/api/exams?' + params.toString(), {
        headers: { Authorization: `Bearer ${token}` }
      });
      setExams(response.data.data.exams);
    } catch (error) {
      console.error('Error fetching exams:', error);
    } finally {
      setLoading(false);
    }
  };

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

  const fetchSubjects = async () => {
    try {
      const response = await axios.get('/api/subjects', {
        headers: { Authorization: `Bearer ${token}` }
      });
      setSubjects(response.data.data);
    } catch (error) {
      console.error('Error fetching subjects:', error);
    }
  };

  const fetchExamDetail = async (examId: string) => {
    try {
      setLoading(true);
      const response = await axios.get(`/api/exams/${examId}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setSelectedExam(response.data.data);
      
      // Initialize results data
      if (response.data.data.class.students) {
        const initResults: {[key: string]: {marksObtained: string, remarks: string}} = {};
        response.data.data.class.students.forEach((student: Student) => {
          const existingResult = response.data.data.results.find((r: ExamResult) => r.student._id === student._id);
          initResults[student._id] = {
            marksObtained: existingResult?.marksObtained?.toString() || '',
            remarks: existingResult?.remarks || ''
          };
        });
        setResultsData(initResults);
      }
    } catch (error) {
      console.error('Error fetching exam:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleCreateExam = async () => {
    try {
      setSaving(true);
      setFormErrors({});

      // Validate form
      const errors: {[key: string]: string} = {};
      if (!formData.title) errors.title = 'Title is required';
      if (!formData.class) errors.class = 'Class is required';
      if (!formData.subject) errors.subject = 'Subject is required';
      if (!formData.examDate) errors.examDate = 'Exam date is required';
      if (!formData.maxMarks || parseInt(formData.maxMarks) <= 0) {
        errors.maxMarks = 'Max marks must be greater than 0';
      }

      if (Object.keys(errors).length > 0) {
        setFormErrors(errors);
        return;
      }

      const payload = {
        ...formData,
        duration: parseInt(formData.duration),
        maxMarks: parseInt(formData.maxMarks),
        passingMarks: formData.passingMarks ? parseInt(formData.passingMarks) : Math.ceil(parseInt(formData.maxMarks) * 0.4),
        instructions: formData.instructions.filter(inst => inst.trim() !== ''),
        syllabus: formData.syllabus.filter(syl => syl.trim() !== '')
      };

      await axios.post('/api/exams', payload, {
        headers: { Authorization: `Bearer ${token}` }
      });

      alert('Exam created successfully!');
      resetForm();
      setView('list');
      fetchExams();
    } catch (error: any) {
      console.error('Error creating exam:', error);
      alert(error.response?.data?.message || 'Error creating exam');
    } finally {
      setSaving(false);
    }
  };

  const handleAddResults = async () => {
    if (!selectedExam) return;

    try {
      setGrading(true);

      const results = Object.entries(resultsData)
        .filter(([_, data]) => data.marksObtained !== '')
        .map(([studentId, data]) => ({
          studentId,
          marksObtained: parseInt(data.marksObtained),
          remarks: data.remarks
        }));

      if (results.length === 0) {
        alert('Please enter marks for at least one student');
        return;
      }

      await axios.post(`/api/exams/${selectedExam._id}/results`, {
        results
      }, {
        headers: { Authorization: `Bearer ${token}` }
      });

      alert('Results added successfully!');
      fetchExamDetail(selectedExam._id);
    } catch (error: any) {
      console.error('Error adding results:', error);
      alert(error.response?.data?.message || 'Error adding results');
    } finally {
      setGrading(false);
    }
  };

  const resetForm = () => {
    setFormData({
      title: '',
      description: '',
      type: 'unit_test',
      class: '',
      subject: '',
      examDate: '',
      startTime: '',
      duration: '60',
      maxMarks: '',
      passingMarks: '',
      instructions: [''],
      syllabus: ['']
    });
    setFormErrors({});
  };

  const handleArrayFieldChange = (field: 'instructions' | 'syllabus', index: number, value: string) => {
    setFormData(prev => ({
      ...prev,
      [field]: prev[field].map((item, i) => i === index ? value : item)
    }));
  };

  const addArrayField = (field: 'instructions' | 'syllabus') => {
    setFormData(prev => ({
      ...prev,
      [field]: [...prev[field], '']
    }));
  };

  const removeArrayField = (field: 'instructions' | 'syllabus', index: number) => {
    setFormData(prev => ({
      ...prev,
      [field]: prev[field].filter((_, i) => i !== index)
    }));
  };

  const getTypeColor = (type: string) => {
    switch (type) {
      case 'final': return 'bg-red-100 text-red-800';
      case 'mid_term': return 'bg-orange-100 text-orange-800';
      case 'unit_test': return 'bg-blue-100 text-blue-800';
      case 'quiz': return 'bg-green-100 text-green-800';
      case 'practical': return 'bg-purple-100 text-purple-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'scheduled': return 'bg-blue-100 text-blue-800';
      case 'ongoing': return 'bg-yellow-100 text-yellow-800';
      case 'completed': return 'bg-green-100 text-green-800';
      case 'cancelled': return 'bg-red-100 text-red-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString();
  };

  const formatDateTime = (dateString: string) => {
    return new Date(dateString).toLocaleString();
  };

  const calculateGrade = (percentage: number) => {
    if (percentage >= 90) return 'A+';
    if (percentage >= 80) return 'A';
    if (percentage >= 70) return 'B+';
    if (percentage >= 60) return 'B';
    if (percentage >= 50) return 'C+';
    if (percentage >= 40) return 'C';
    return 'F';
  };

  const getExamStats = (exam: Exam) => {
    if (!exam.results || exam.results.length === 0) return null;

    const totalStudents = exam.results.length;
    const passedStudents = exam.results.filter(r => r.status === 'pass').length;
    const averageMarks = exam.results.reduce((sum, r) => sum + r.marksObtained, 0) / totalStudents;
    const highestMarks = Math.max(...exam.results.map(r => r.marksObtained));
    const lowestMarks = Math.min(...exam.results.map(r => r.marksObtained));

    return {
      totalStudents,
      passedStudents,
      failedStudents: totalStudents - passedStudents,
      passPercentage: ((passedStudents / totalStudents) * 100).toFixed(1),
      averageMarks: averageMarks.toFixed(1),
      averagePercentage: ((averageMarks / exam.maxMarks) * 100).toFixed(1),
      highestMarks,
      lowestMarks
    };
  };

  return (
    <div className="p-6 space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Exam Management</h1>
          <p className="text-gray-600 mt-1">Create, manage and evaluate exams</p>
        </div>
        <div className="flex space-x-3">
          {view !== 'create' && (
            <button
              onClick={() => {
                resetForm();
                setView('create');
              }}
              className="inline-flex items-center px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
            >
              <Plus className="h-4 w-4 mr-2" />
              Create Exam
            </button>
          )}
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

      {/* Exams List */}
      {view === 'list' && (
        <div className="space-y-6">
          {/* Filters */}
          <div className="bg-white rounded-lg shadow p-6">
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Type</label>
                <select
                  value={filters.type}
                  onChange={(e) => setFilters(prev => ({...prev, type: e.target.value}))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="">All Types</option>
                  <option value="quiz">Quiz</option>
                  <option value="unit_test">Unit Test</option>
                  <option value="mid_term">Mid Term</option>
                  <option value="final">Final Exam</option>
                  <option value="practical">Practical</option>
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
                  <option value="scheduled">Scheduled</option>
                  <option value="ongoing">Ongoing</option>
                  <option value="completed">Completed</option>
                  <option value="cancelled">Cancelled</option>
                </select>
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
                <label className="block text-sm font-medium text-gray-700 mb-2">Subject</label>
                <select
                  value={filters.subjectId}
                  onChange={(e) => setFilters(prev => ({...prev, subjectId: e.target.value}))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="">All Subjects</option>
                  {subjects.map(subj => (
                    <option key={subj._id} value={subj._id}>{subj.name} ({subj.code})</option>
                  ))}
                </select>
              </div>
            </div>
          </div>

          {/* Exam Cards */}
          {loading ? (
            <div className="text-center py-8">
              <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
              <p className="mt-2 text-gray-600">Loading exams...</p>
            </div>
          ) : exams.length === 0 ? (
            <div className="text-center py-12 bg-white rounded-lg shadow">
              <GraduationCap className="h-12 w-12 text-gray-400 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">No Exams Found</h3>
              <p className="text-gray-600 mb-4">Create your first exam to get started.</p>
              <button
                onClick={() => setView('create')}
                className="inline-flex items-center px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
              >
                <Plus className="h-4 w-4 mr-2" />
                Create Exam
              </button>
            </div>
          ) : (
            <div className="grid gap-6">
              {exams.map(exam => {
                const stats = getExamStats(exam);
                return (
                  <div key={exam._id} className="bg-white rounded-lg shadow hover:shadow-md transition-shadow">
                    <div className="p-6">
                      <div className="flex justify-between items-start mb-4">
                        <div className="flex-1">
                          <div className="flex items-center space-x-3 mb-2">
                            <h3 className="text-lg font-semibold text-gray-900">{exam.title}</h3>
                            <span className={`px-2 py-1 rounded-full text-xs font-medium ${getTypeColor(exam.type)}`}>
                              {exam.type.replace('_', ' ').toUpperCase()}
                            </span>
                            <span className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(exam.status)}`}>
                              {exam.status.toUpperCase()}
                            </span>
                          </div>
                          {exam.description && (
                            <p className="text-gray-600 mb-3 line-clamp-2">{exam.description}</p>
                          )}
                          
                          <div className="flex items-center space-x-6 text-sm text-gray-500">
                            <div className="flex items-center">
                              <GraduationCap className="h-4 w-4 mr-1" />
                              {exam.class.name} ({exam.class.level})
                            </div>
                            <div className="flex items-center">
                              <BookOpen className="h-4 w-4 mr-1" />
                              {exam.subject.name}
                            </div>
                            <div className="flex items-center">
                              <Calendar className="h-4 w-4 mr-1" />
                              {formatDate(exam.examDate)}
                            </div>
                            <div className="flex items-center">
                              <Clock className="h-4 w-4 mr-1" />
                              {exam.duration} mins
                            </div>
                            <div className="flex items-center">
                              <Star className="h-4 w-4 mr-1" />
                              Max: {exam.maxMarks}
                            </div>
                          </div>
                        </div>
                        
                        <div className="flex space-x-2">
                          <button
                            onClick={() => {
                              setView('detail');
                              fetchExamDetail(exam._id);
                            }}
                            className="p-2 text-gray-400 hover:text-gray-600 rounded-full hover:bg-gray-100"
                            title="View Details"
                          >
                            <Eye className="h-4 w-4" />
                          </button>
                          <button
                            onClick={() => {
                              setView('results');
                              fetchExamDetail(exam._id);
                            }}
                            className="p-2 text-blue-400 hover:text-blue-600 rounded-full hover:bg-blue-50"
                            title="Manage Results"
                          >
                            <Edit className="h-4 w-4" />
                          </button>
                          {stats && (
                            <button
                              onClick={() => {
                                setView('stats');
                                fetchExamDetail(exam._id);
                              }}
                              className="p-2 text-green-400 hover:text-green-600 rounded-full hover:bg-green-50"
                              title="View Statistics"
                            >
                              <BarChart3 className="h-4 w-4" />
                            </button>
                          )}
                        </div>
                      </div>

                      {/* Quick Stats */}
                      {stats && (
                        <div className="border-t pt-4">
                          <div className="grid grid-cols-4 gap-4 text-center text-sm">
                            <div>
                              <div className="text-gray-500">Students</div>
                              <div className="font-semibold text-gray-900">{stats.totalStudents}</div>
                            </div>
                            <div>
                              <div className="text-gray-500">Pass Rate</div>
                              <div className="font-semibold text-green-600">{stats.passPercentage}%</div>
                            </div>
                            <div>
                              <div className="text-gray-500">Average</div>
                              <div className="font-semibold text-blue-600">{stats.averagePercentage}%</div>
                            </div>
                            <div>
                              <div className="text-gray-500">Highest</div>
                              <div className="font-semibold text-purple-600">{stats.highestMarks}/{exam.maxMarks}</div>
                            </div>
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* Create Exam */}
      {view === 'create' && (
        <div className="bg-white rounded-lg shadow">
          <div className="px-6 py-4 border-b border-gray-200">
            <h3 className="text-lg font-medium text-gray-900">Create New Exam</h3>
          </div>

          <div className="p-6 space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Title *</label>
                <input
                  type="text"
                  value={formData.title}
                  onChange={(e) => setFormData(prev => ({...prev, title: e.target.value}))}
                  className={`w-full px-3 py-2 border ${formErrors.title ? 'border-red-500' : 'border-gray-300'} rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500`}
                  placeholder="Enter exam title"
                />
                {formErrors.title && <p className="mt-1 text-sm text-red-600">{formErrors.title}</p>}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Type</label>
                <select
                  value={formData.type}
                  onChange={(e) => setFormData(prev => ({...prev, type: e.target.value}))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="quiz">Quiz</option>
                  <option value="unit_test">Unit Test</option>
                  <option value="mid_term">Mid Term</option>
                  <option value="final">Final Exam</option>
                  <option value="practical">Practical</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Class *</label>
                <select
                  value={formData.class}
                  onChange={(e) => setFormData(prev => ({...prev, class: e.target.value}))}
                  className={`w-full px-3 py-2 border ${formErrors.class ? 'border-red-500' : 'border-gray-300'} rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500`}
                >
                  <option value="">Select a class</option>
                  {classes.map(cls => (
                    <option key={cls._id} value={cls._id}>{cls.name} ({cls.level})</option>
                  ))}
                </select>
                {formErrors.class && <p className="mt-1 text-sm text-red-600">{formErrors.class}</p>}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Subject *</label>
                <select
                  value={formData.subject}
                  onChange={(e) => setFormData(prev => ({...prev, subject: e.target.value}))}
                  className={`w-full px-3 py-2 border ${formErrors.subject ? 'border-red-500' : 'border-gray-300'} rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500`}
                >
                  <option value="">Select a subject</option>
                  {subjects.map(subj => (
                    <option key={subj._id} value={subj._id}>{subj.name} ({subj.code})</option>
                  ))}
                </select>
                {formErrors.subject && <p className="mt-1 text-sm text-red-600">{formErrors.subject}</p>}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Exam Date *</label>
                <input
                  type="date"
                  value={formData.examDate}
                  onChange={(e) => setFormData(prev => ({...prev, examDate: e.target.value}))}
                  className={`w-full px-3 py-2 border ${formErrors.examDate ? 'border-red-500' : 'border-gray-300'} rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500`}
                />
                {formErrors.examDate && <p className="mt-1 text-sm text-red-600">{formErrors.examDate}</p>}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Start Time</label>
                <input
                  type="time"
                  value={formData.startTime}
                  onChange={(e) => setFormData(prev => ({...prev, startTime: e.target.value}))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Duration (minutes)</label>
                <input
                  type="number"
                  min="15"
                  max="300"
                  value={formData.duration}
                  onChange={(e) => setFormData(prev => ({...prev, duration: e.target.value}))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="Enter duration in minutes"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Maximum Marks *</label>
                <input
                  type="number"
                  min="1"
                  value={formData.maxMarks}
                  onChange={(e) => setFormData(prev => ({...prev, maxMarks: e.target.value}))}
                  className={`w-full px-3 py-2 border ${formErrors.maxMarks ? 'border-red-500' : 'border-gray-300'} rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500`}
                  placeholder="Enter maximum marks"
                />
                {formErrors.maxMarks && <p className="mt-1 text-sm text-red-600">{formErrors.maxMarks}</p>}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Passing Marks</label>
                <input
                  type="number"
                  min="1"
                  value={formData.passingMarks}
                  onChange={(e) => setFormData(prev => ({...prev, passingMarks: e.target.value}))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="Leave empty for auto (40%)"
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Description</label>
              <textarea
                rows={3}
                value={formData.description}
                onChange={(e) => setFormData(prev => ({...prev, description: e.target.value}))}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="Enter exam description"
              />
            </div>

            {/* Instructions */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Instructions</label>
              {formData.instructions.map((instruction, index) => (
                <div key={index} className="flex items-center space-x-2 mb-2">
                  <input
                    type="text"
                    value={instruction}
                    onChange={(e) => handleArrayFieldChange('instructions', index, e.target.value)}
                    className="flex-1 px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="Enter instruction"
                  />
                  {formData.instructions.length > 1 && (
                    <button
                      type="button"
                      onClick={() => removeArrayField('instructions', index)}
                      className="p-2 text-red-600 hover:text-red-800"
                    >
                      ×
                    </button>
                  )}
                </div>
              ))}
              <button
                type="button"
                onClick={() => addArrayField('instructions')}
                className="text-blue-600 hover:text-blue-800 text-sm"
              >
                + Add Instruction
              </button>
            </div>

            {/* Syllabus */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Syllabus Topics</label>
              {formData.syllabus.map((topic, index) => (
                <div key={index} className="flex items-center space-x-2 mb-2">
                  <input
                    type="text"
                    value={topic}
                    onChange={(e) => handleArrayFieldChange('syllabus', index, e.target.value)}
                    className="flex-1 px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="Enter syllabus topic"
                  />
                  {formData.syllabus.length > 1 && (
                    <button
                      type="button"
                      onClick={() => removeArrayField('syllabus', index)}
                      className="p-2 text-red-600 hover:text-red-800"
                    >
                      ×
                    </button>
                  )}
                </div>
              ))}
              <button
                type="button"
                onClick={() => addArrayField('syllabus')}
                className="text-blue-600 hover:text-blue-800 text-sm"
              >
                + Add Topic
              </button>
            </div>

            <div className="flex justify-end space-x-3 pt-6 border-t">
              <button
                onClick={() => setView('list')}
                className="px-4 py-2 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50"
              >
                Cancel
              </button>
              <button
                onClick={handleCreateExam}
                disabled={saving}
                className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {saving ? 'Creating...' : 'Create Exam'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Exam Detail */}
      {view === 'detail' && selectedExam && (
        <div className="bg-white rounded-lg shadow">
          <div className="px-6 py-4 border-b border-gray-200">
            <div className="flex justify-between items-center">
              <h3 className="text-lg font-medium text-gray-900">{selectedExam.title}</h3>
              <div className="flex space-x-2">
                <span className={`px-2 py-1 rounded-full text-xs font-medium ${getTypeColor(selectedExam.type)}`}>
                  {selectedExam.type.replace('_', ' ').toUpperCase()}
                </span>
                <span className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(selectedExam.status)}`}>
                  {selectedExam.status.toUpperCase()}
                </span>
              </div>
            </div>
          </div>

          <div className="p-6 space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <h4 className="text-sm font-medium text-gray-900 mb-2">Exam Details</h4>
                <div className="space-y-2 text-sm">
                  <div><span className="font-medium">Class:</span> {selectedExam.class.name} ({selectedExam.class.level})</div>
                  <div><span className="font-medium">Subject:</span> {selectedExam.subject.name}</div>
                  <div><span className="font-medium">Date:</span> {formatDate(selectedExam.examDate)}</div>
                  {selectedExam.startTime && (
                    <div><span className="font-medium">Time:</span> {selectedExam.startTime}</div>
                  )}
                  <div><span className="font-medium">Duration:</span> {selectedExam.duration} minutes</div>
                  <div><span className="font-medium">Maximum Marks:</span> {selectedExam.maxMarks}</div>
                  <div><span className="font-medium">Passing Marks:</span> {selectedExam.passingMarks}</div>
                </div>
              </div>

              <div>
                <h4 className="text-sm font-medium text-gray-900 mb-2">Results Summary</h4>
                <div className="space-y-2 text-sm">
                  <div><span className="font-medium">Total Students:</span> {selectedExam.results.length}</div>
                  <div><span className="font-medium">Appeared:</span> {selectedExam.results.filter(r => r.marksObtained !== undefined).length}</div>
                  <div><span className="font-medium">Passed:</span> {selectedExam.results.filter(r => r.status === 'pass').length}</div>
                  <div><span className="font-medium">Failed:</span> {selectedExam.results.filter(r => r.status === 'fail').length}</div>
                  {selectedExam.results.length > 0 && (
                    <>
                      <div><span className="font-medium">Average:</span> {
                        (selectedExam.results.reduce((sum, r) => sum + (r.marksObtained || 0), 0) / selectedExam.results.length).toFixed(1)
                      } marks</div>
                      <div><span className="font-medium">Pass Rate:</span> {
                        ((selectedExam.results.filter(r => r.status === 'pass').length / selectedExam.results.length) * 100).toFixed(1)
                      }%</div>
                    </>
                  )}
                </div>
              </div>
            </div>

            {selectedExam.description && (
              <div>
                <h4 className="text-sm font-medium text-gray-900 mb-2">Description</h4>
                <p className="text-gray-600">{selectedExam.description}</p>
              </div>
            )}

            {selectedExam.instructions.length > 0 && (
              <div>
                <h4 className="text-sm font-medium text-gray-900 mb-2">Instructions</h4>
                <ul className="space-y-1">
                  {selectedExam.instructions.map((instruction, index) => (
                    <li key={index} className="text-sm text-gray-600 flex items-start">
                      <span className="inline-block w-2 h-2 bg-blue-600 rounded-full mt-1.5 mr-3 flex-shrink-0"></span>
                      {instruction}
                    </li>
                  ))}
                </ul>
              </div>
            )}

            {selectedExam.syllabus.length > 0 && (
              <div>
                <h4 className="text-sm font-medium text-gray-900 mb-2">Syllabus</h4>
                <ul className="space-y-1">
                  {selectedExam.syllabus.map((topic, index) => (
                    <li key={index} className="text-sm text-gray-600 flex items-start">
                      <span className="inline-block w-2 h-2 bg-green-600 rounded-full mt-1.5 mr-3 flex-shrink-0"></span>
                      {topic}
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Results Management */}
      {view === 'results' && selectedExam && (
        <div className="bg-white rounded-lg shadow">
          <div className="px-6 py-4 border-b border-gray-200">
            <h3 className="text-lg font-medium text-gray-900">Manage Results - {selectedExam.title}</h3>
          </div>

          <div className="p-6">
            {selectedExam.class.students && selectedExam.class.students.length > 0 ? (
              <div className="space-y-6">
                {selectedExam.class.students.map(student => {
                  const existingResult = selectedExam.results.find(r => r.student._id === student._id);
                  return (
                    <div key={student._id} className="border border-gray-200 rounded-lg p-6">
                      <div className="flex justify-between items-start mb-4">
                        <div>
                          <h4 className="text-lg font-medium text-gray-900">
                            {student.firstName} {student.lastName}
                          </h4>
                          <p className="text-sm text-gray-500">Roll No: {student.rollNumber}</p>
                        </div>
                        {existingResult && (
                          <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                            existingResult.status === 'pass' ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
                          }`}>
                            {existingResult.status === 'pass' ? 'PASS' : 'FAIL'} - {calculateGrade(existingResult.percentage)}
                          </span>
                        )}
                      </div>

                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-2">
                            Marks Obtained (out of {selectedExam.maxMarks})
                          </label>
                          <input
                            type="number"
                            min="0"
                            max={selectedExam.maxMarks}
                            value={resultsData[student._id]?.marksObtained || ''}
                            onChange={(e) => setResultsData(prev => ({
                              ...prev,
                              [student._id]: {
                                ...prev[student._id],
                                marksObtained: e.target.value
                              }
                            }))}
                            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                            placeholder="Enter marks"
                          />
                        </div>

                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-2">Remarks</label>
                          <textarea
                            rows={2}
                            value={resultsData[student._id]?.remarks || ''}
                            onChange={(e) => setResultsData(prev => ({
                              ...prev,
                              [student._id]: {
                                ...prev[student._id],
                                remarks: e.target.value
                              }
                            }))}
                            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                            placeholder="Enter remarks (optional)"
                          />
                        </div>
                      </div>

                      {existingResult && (
                        <div className="mt-4 p-4 bg-blue-50 rounded-md">
                          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                            <div>
                              <span className="font-medium text-blue-900">Current Marks:</span>
                              <p className="text-blue-700">{existingResult.marksObtained}</p>
                            </div>
                            <div>
                              <span className="font-medium text-blue-900">Percentage:</span>
                              <p className="text-blue-700">{existingResult.percentage}%</p>
                            </div>
                            <div>
                              <span className="font-medium text-blue-900">Grade:</span>
                              <p className="text-blue-700">{existingResult.grade}</p>
                            </div>
                            <div>
                              <span className="font-medium text-blue-900">Status:</span>
                              <p className={existingResult.status === 'pass' ? 'text-green-700' : 'text-red-700'}>
                                {existingResult.status.toUpperCase()}
                              </p>
                            </div>
                          </div>
                          {existingResult.remarks && (
                            <div className="mt-2">
                              <span className="font-medium text-blue-900">Previous Remarks:</span>
                              <p className="text-blue-700 mt-1">{existingResult.remarks}</p>
                            </div>
                          )}
                        </div>
                      )}
                    </div>
                  );
                })}

                <div className="flex justify-end pt-6 border-t">
                  <button
                    onClick={handleAddResults}
                    disabled={grading}
                    className="px-6 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {grading ? 'Saving Results...' : 'Save Results'}
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

      {/* Statistics View */}
      {view === 'stats' && selectedExam && (
        <div className="space-y-6">
          {(() => {
            const stats = getExamStats(selectedExam);
            if (!stats) return (
              <div className="text-center py-12 bg-white rounded-lg shadow">
                <BarChart3 className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                <h3 className="text-lg font-medium text-gray-900 mb-2">No Results Available</h3>
                <p className="text-gray-600">Results need to be added to view statistics.</p>
              </div>
            );

            return (
              <>
                <div className="bg-white rounded-lg shadow p-6">
                  <h3 className="text-lg font-medium text-gray-900 mb-4">Exam Statistics - {selectedExam.title}</h3>
                  <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
                    <div className="text-center">
                      <div className="text-3xl font-bold text-blue-600 mb-2">{stats.totalStudents}</div>
                      <div className="text-sm text-gray-600">Total Students</div>
                    </div>
                    <div className="text-center">
                      <div className="text-3xl font-bold text-green-600 mb-2">{stats.passPercentage}%</div>
                      <div className="text-sm text-gray-600">Pass Rate</div>
                    </div>
                    <div className="text-center">
                      <div className="text-3xl font-bold text-purple-600 mb-2">{stats.averagePercentage}%</div>
                      <div className="text-sm text-gray-600">Class Average</div>
                    </div>
                    <div className="text-center">
                      <div className="text-3xl font-bold text-orange-600 mb-2">{stats.highestMarks}</div>
                      <div className="text-sm text-gray-600">Highest Score</div>
                    </div>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="bg-white rounded-lg shadow p-6">
                    <h4 className="text-lg font-medium text-gray-900 mb-4">Pass/Fail Distribution</h4>
                    <div className="space-y-4">
                      <div className="flex items-center justify-between">
                        <span className="flex items-center">
                          <div className="w-4 h-4 bg-green-500 rounded mr-2"></div>
                          Passed
                        </span>
                        <span className="font-medium">{stats.passedStudents} ({stats.passPercentage}%)</span>
                      </div>
                      <div className="w-full bg-gray-200 rounded-full h-2">
                        <div className="bg-green-500 h-2 rounded-full" style={{width: `${stats.passPercentage}%`}}></div>
                      </div>
                      
                      <div className="flex items-center justify-between">
                        <span className="flex items-center">
                          <div className="w-4 h-4 bg-red-500 rounded mr-2"></div>
                          Failed
                        </span>
                        <span className="font-medium">{stats.failedStudents} ({(100 - parseFloat(stats.passPercentage)).toFixed(1)}%)</span>
                      </div>
                      <div className="w-full bg-gray-200 rounded-full h-2">
                        <div className="bg-red-500 h-2 rounded-full" style={{width: `${100 - parseFloat(stats.passPercentage)}%`}}></div>
                      </div>
                    </div>
                  </div>

                  <div className="bg-white rounded-lg shadow p-6">
                    <h4 className="text-lg font-medium text-gray-900 mb-4">Score Distribution</h4>
                    <div className="space-y-3">
                      <div className="flex justify-between text-sm">
                        <span>Highest Score</span>
                        <span className="font-medium">{stats.highestMarks}/{selectedExam.maxMarks}</span>
                      </div>
                      <div className="flex justify-between text-sm">
                        <span>Lowest Score</span>
                        <span className="font-medium">{stats.lowestMarks}/{selectedExam.maxMarks}</span>
                      </div>
                      <div className="flex justify-between text-sm">
                        <span>Average Score</span>
                        <span className="font-medium">{stats.averageMarks}/{selectedExam.maxMarks}</span>
                      </div>
                      <div className="flex justify-between text-sm">
                        <span>Passing Score</span>
                        <span className="font-medium">{selectedExam.passingMarks}/{selectedExam.maxMarks}</span>
                      </div>
                    </div>
                  </div>
                </div>

                <div className="bg-white rounded-lg shadow">
                  <div className="px-6 py-4 border-b border-gray-200">
                    <h4 className="text-lg font-medium text-gray-900">Detailed Results</h4>
                  </div>
                  <div className="p-6">
                    <div className="overflow-x-auto">
                      <table className="min-w-full divide-y divide-gray-200">
                        <thead className="bg-gray-50">
                          <tr>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Student</th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Marks</th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Percentage</th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Grade</th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Remarks</th>
                          </tr>
                        </thead>
                        <tbody className="bg-white divide-y divide-gray-200">
                          {selectedExam.results
                            .sort((a, b) => b.marksObtained - a.marksObtained)
                            .map((result, index) => (
                            <tr key={result.student._id} className={index === 0 ? 'bg-yellow-50' : ''}>
                              <td className="px-6 py-4 whitespace-nowrap">
                                <div>
                                  <div className="text-sm font-medium text-gray-900">
                                    {result.student.firstName} {result.student.lastName}
                                    {index === 0 && <span className="ml-2 text-yellow-600">👑</span>}
                                  </div>
                                  <div className="text-sm text-gray-500">Roll: {result.student.rollNumber}</div>
                                </div>
                              </td>
                              <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                                {result.marksObtained}/{selectedExam.maxMarks}
                              </td>
                              <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                                {result.percentage}%
                              </td>
                              <td className="px-6 py-4 whitespace-nowrap">
                                <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                                  result.grade === 'A+' ? 'bg-green-100 text-green-800' :
                                  result.grade === 'A' ? 'bg-blue-100 text-blue-800' :
                                  result.grade.startsWith('B') ? 'bg-yellow-100 text-yellow-800' :
                                  result.grade.startsWith('C') ? 'bg-orange-100 text-orange-800' :
                                  'bg-red-100 text-red-800'
                                }`}>
                                  {result.grade}
                                </span>
                              </td>
                              <td className="px-6 py-4 whitespace-nowrap">
                                <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                                  result.status === 'pass' ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
                                }`}>
                                  {result.status === 'pass' ? <CheckCircle className="h-3 w-3 mr-1" /> : <AlertCircle className="h-3 w-3 mr-1" />}
                                  {result.status.toUpperCase()}
                                </span>
                              </td>
                              <td className="px-6 py-4 text-sm text-gray-900 max-w-xs truncate">
                                {result.remarks || '-'}
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </div>
                </div>
              </>
            );
          })()}
        </div>
      )}
    </div>
  );
};

export default Exams;