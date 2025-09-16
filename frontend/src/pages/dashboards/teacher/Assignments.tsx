import { useState, useEffect } from 'react';
import axios from 'axios';
import { useAuth } from '../../../contexts/AuthContext';
import { 
  Plus, BookOpen, Calendar, Users, CheckCircle, Clock, 
  Eye, Edit, Download, Upload, Star, AlertCircle, Filter,
  FileText, MessageSquare, User, GraduationCap
} from 'lucide-react';

interface Class {
  _id: string;
  name: string;
  level: string;
}

interface Subject {
  _id: string;
  name: string;
  code: string;
}

interface Assignment {
  _id: string;
  title: string;
  description: string;
  class: Class;
  subject: Subject;
  dueDate: string;
  maxMarks: number;
  priority: 'low' | 'medium' | 'high';
  status: 'active' | 'completed' | 'expired';
  instructions: string[];
  resources: string[];
  attachments: string[];
  submissions: Submission[];
  assignedBy: {
    firstName: string;
    lastName: string;
  };
  createdAt: string;
}

interface Submission {
  _id: string;
  student: {
    _id: string;
    firstName: string;
    lastName: string;
    rollNumber: string;
  };
  content: string;
  attachments: string[];
  submittedAt: string;
  status: 'submitted' | 'late' | 'graded';
  marksObtained?: number;
  feedback?: string;
  isLate: boolean;
}

const Assignments = () => {
  const { token } = useAuth();
  const [assignments, setAssignments] = useState<Assignment[]>([]);
  const [classes, setClasses] = useState<Class[]>([]);
  const [subjects, setSubjects] = useState<Subject[]>([]);
  const [loading, setLoading] = useState(false);
  const [view, setView] = useState<'list' | 'create' | 'detail' | 'grade'>('list');
  const [selectedAssignment, setSelectedAssignment] = useState<Assignment | null>(null);
  const [filters, setFilters] = useState({
    status: '',
    classId: '',
    subjectId: '',
    priority: ''
  });

  // Form states
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    class: '',
    subject: '',
    dueDate: '',
    maxMarks: '',
    priority: 'medium',
    instructions: [''],
    resources: ['']
  });
  const [formErrors, setFormErrors] = useState<{[key: string]: string}>({});
  const [saving, setSaving] = useState(false);

  // Grading states
  const [gradingData, setGradingData] = useState<{[key: string]: {marksObtained: string, feedback: string}}>({});
  const [grading, setGrading] = useState(false);

  useEffect(() => {
    fetchAssignments();
    fetchClasses();
    fetchSubjects();
  }, [filters]);

  const fetchAssignments = async () => {
    try {
      setLoading(true);
      const params = new URLSearchParams();
      if (filters.status) params.append('status', filters.status);
      if (filters.classId) params.append('classId', filters.classId);
      if (filters.subjectId) params.append('subjectId', filters.subjectId);
      if (filters.priority) params.append('priority', filters.priority);

      const response = await axios.get('/api/assignments?' + params.toString(), {
        headers: { Authorization: `Bearer ${token}` }
      });
      setAssignments(response.data.data.assignments);
    } catch (error) {
      console.error('Error fetching assignments:', error);
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

  const fetchAssignmentDetail = async (assignmentId: string) => {
    try {
      setLoading(true);
      const response = await axios.get(`/api/assignments/${assignmentId}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setSelectedAssignment(response.data.data);
      
      // Initialize grading data
      const initGrading: {[key: string]: {marksObtained: string, feedback: string}} = {};
      response.data.data.submissions.forEach((sub: Submission) => {
        initGrading[sub.student._id] = {
          marksObtained: sub.marksObtained?.toString() || '',
          feedback: sub.feedback || ''
        };
      });
      setGradingData(initGrading);
    } catch (error) {
      console.error('Error fetching assignment:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleCreateAssignment = async () => {
    try {
      setSaving(true);
      setFormErrors({});

      // Validate form
      const errors: {[key: string]: string} = {};
      if (!formData.title) errors.title = 'Title is required';
      if (!formData.description) errors.description = 'Description is required';
      if (!formData.class) errors.class = 'Class is required';
      if (!formData.subject) errors.subject = 'Subject is required';
      if (!formData.dueDate) errors.dueDate = 'Due date is required';
      if (!formData.maxMarks || parseInt(formData.maxMarks) <= 0) {
        errors.maxMarks = 'Max marks must be greater than 0';
      }

      if (Object.keys(errors).length > 0) {
        setFormErrors(errors);
        return;
      }

      const payload = {
        ...formData,
        maxMarks: parseInt(formData.maxMarks),
        instructions: formData.instructions.filter(inst => inst.trim() !== ''),
        resources: formData.resources.filter(res => res.trim() !== '')
      };

      await axios.post('/api/assignments', payload, {
        headers: { Authorization: `Bearer ${token}` }
      });

      alert('Assignment created successfully!');
      resetForm();
      setView('list');
      fetchAssignments();
    } catch (error: any) {
      console.error('Error creating assignment:', error);
      alert(error.response?.data?.message || 'Error creating assignment');
    } finally {
      setSaving(false);
    }
  };

  const handleGradeSubmissions = async () => {
    if (!selectedAssignment) return;

    try {
      setGrading(true);

      const grades = Object.entries(gradingData)
        .filter(([_, data]) => data.marksObtained !== '')
        .map(([studentId, data]) => ({
          studentId,
          marksObtained: parseInt(data.marksObtained),
          feedback: data.feedback
        }));

      if (grades.length === 0) {
        alert('Please enter marks for at least one submission');
        return;
      }

      await axios.post(`/api/assignments/${selectedAssignment._id}/grade`, {
        grades
      }, {
        headers: { Authorization: `Bearer ${token}` }
      });

      alert('Grades updated successfully!');
      fetchAssignmentDetail(selectedAssignment._id);
    } catch (error: any) {
      console.error('Error grading submissions:', error);
      alert(error.response?.data?.message || 'Error grading submissions');
    } finally {
      setGrading(false);
    }
  };

  const resetForm = () => {
    setFormData({
      title: '',
      description: '',
      class: '',
      subject: '',
      dueDate: '',
      maxMarks: '',
      priority: 'medium',
      instructions: [''],
      resources: ['']
    });
    setFormErrors({});
  };

  const handleArrayFieldChange = (field: 'instructions' | 'resources', index: number, value: string) => {
    setFormData(prev => ({
      ...prev,
      [field]: prev[field].map((item, i) => i === index ? value : item)
    }));
  };

  const addArrayField = (field: 'instructions' | 'resources') => {
    setFormData(prev => ({
      ...prev,
      [field]: [...prev[field], '']
    }));
  };

  const removeArrayField = (field: 'instructions' | 'resources', index: number) => {
    setFormData(prev => ({
      ...prev,
      [field]: prev[field].filter((_, i) => i !== index)
    }));
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'high': return 'bg-red-100 text-red-800';
      case 'medium': return 'bg-yellow-100 text-yellow-800';
      case 'low': return 'bg-green-100 text-green-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active': return 'bg-blue-100 text-blue-800';
      case 'completed': return 'bg-green-100 text-green-800';
      case 'expired': return 'bg-red-100 text-red-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString();
  };

  const isOverdue = (dueDate: string) => {
    return new Date(dueDate) < new Date();
  };

  return (
    <div className="p-6 space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Assignment Management</h1>
          <p className="text-gray-600 mt-1">Create, manage and grade assignments</p>
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
              Create Assignment
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

      {/* Assignments List */}
      {view === 'list' && (
        <div className="space-y-6">
          {/* Filters */}
          <div className="bg-white rounded-lg shadow p-6">
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Status</label>
                <select
                  value={filters.status}
                  onChange={(e) => setFilters(prev => ({...prev, status: e.target.value}))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="">All Status</option>
                  <option value="active">Active</option>
                  <option value="completed">Completed</option>
                  <option value="expired">Expired</option>
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

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Priority</label>
                <select
                  value={filters.priority}
                  onChange={(e) => setFilters(prev => ({...prev, priority: e.target.value}))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="">All Priorities</option>
                  <option value="high">High</option>
                  <option value="medium">Medium</option>
                  <option value="low">Low</option>
                </select>
              </div>
            </div>
          </div>

          {/* Assignment Cards */}
          {loading ? (
            <div className="text-center py-8">
              <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
              <p className="mt-2 text-gray-600">Loading assignments...</p>
            </div>
          ) : assignments.length === 0 ? (
            <div className="text-center py-12 bg-white rounded-lg shadow">
              <BookOpen className="h-12 w-12 text-gray-400 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">No Assignments Found</h3>
              <p className="text-gray-600 mb-4">Create your first assignment to get started.</p>
              <button
                onClick={() => setView('create')}
                className="inline-flex items-center px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
              >
                <Plus className="h-4 w-4 mr-2" />
                Create Assignment
              </button>
            </div>
          ) : (
            <div className="grid gap-6">
              {assignments.map(assignment => (
                <div key={assignment._id} className="bg-white rounded-lg shadow hover:shadow-md transition-shadow">
                  <div className="p-6">
                    <div className="flex justify-between items-start mb-4">
                      <div className="flex-1">
                        <div className="flex items-center space-x-3 mb-2">
                          <h3 className="text-lg font-semibold text-gray-900">{assignment.title}</h3>
                          <span className={`px-2 py-1 rounded-full text-xs font-medium ${getPriorityColor(assignment.priority)}`}>
                            {assignment.priority.toUpperCase()}
                          </span>
                          <span className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(assignment.status)}`}>
                            {assignment.status.toUpperCase()}
                          </span>
                          {isOverdue(assignment.dueDate) && assignment.status === 'active' && (
                            <span className="px-2 py-1 bg-red-100 text-red-800 rounded-full text-xs font-medium">
                              OVERDUE
                            </span>
                          )}
                        </div>
                        <p className="text-gray-600 mb-3 line-clamp-2">{assignment.description}</p>
                        
                        <div className="flex items-center space-x-6 text-sm text-gray-500">
                          <div className="flex items-center">
                            <GraduationCap className="h-4 w-4 mr-1" />
                            {assignment.class.name} ({assignment.class.level})
                          </div>
                          <div className="flex items-center">
                            <BookOpen className="h-4 w-4 mr-1" />
                            {assignment.subject.name}
                          </div>
                          <div className="flex items-center">
                            <Calendar className="h-4 w-4 mr-1" />
                            Due: {formatDate(assignment.dueDate)}
                          </div>
                          <div className="flex items-center">
                            <Star className="h-4 w-4 mr-1" />
                            Max: {assignment.maxMarks} marks
                          </div>
                          <div className="flex items-center">
                            <Users className="h-4 w-4 mr-1" />
                            {assignment.submissions.length} submissions
                          </div>
                        </div>
                      </div>
                      
                      <div className="flex space-x-2">
                        <button
                          onClick={() => {
                            setView('detail');
                            fetchAssignmentDetail(assignment._id);
                          }}
                          className="p-2 text-gray-400 hover:text-gray-600 rounded-full hover:bg-gray-100"
                          title="View Details"
                        >
                          <Eye className="h-4 w-4" />
                        </button>
                        <button
                          onClick={() => {
                            setView('grade');
                            fetchAssignmentDetail(assignment._id);
                          }}
                          className="p-2 text-blue-400 hover:text-blue-600 rounded-full hover:bg-blue-50"
                          title="Grade Submissions"
                        >
                          <Edit className="h-4 w-4" />
                        </button>
                      </div>
                    </div>

                    {/* Submission Progress */}
                    {assignment.submissions.length > 0 && (
                      <div className="border-t pt-4">
                        <div className="flex items-center justify-between text-sm">
                          <span className="text-gray-600">Submissions Progress</span>
                          <span className="text-gray-900 font-medium">
                            {assignment.submissions.filter(s => s.status === 'graded').length} / {assignment.submissions.length} graded
                          </span>
                        </div>
                        <div className="mt-2 bg-gray-200 rounded-full h-2">
                          <div 
                            className="bg-blue-600 h-2 rounded-full" 
                            style={{ 
                              width: `${(assignment.submissions.filter(s => s.status === 'graded').length / assignment.submissions.length) * 100}%` 
                            }}
                          ></div>
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Create Assignment */}
      {view === 'create' && (
        <div className="bg-white rounded-lg shadow">
          <div className="px-6 py-4 border-b border-gray-200">
            <h3 className="text-lg font-medium text-gray-900">Create New Assignment</h3>
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
                  placeholder="Enter assignment title"
                />
                {formErrors.title && <p className="mt-1 text-sm text-red-600">{formErrors.title}</p>}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Priority</label>
                <select
                  value={formData.priority}
                  onChange={(e) => setFormData(prev => ({...prev, priority: e.target.value}))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="low">Low</option>
                  <option value="medium">Medium</option>
                  <option value="high">High</option>
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
                <label className="block text-sm font-medium text-gray-700 mb-2">Due Date *</label>
                <input
                  type="datetime-local"
                  value={formData.dueDate}
                  onChange={(e) => setFormData(prev => ({...prev, dueDate: e.target.value}))}
                  className={`w-full px-3 py-2 border ${formErrors.dueDate ? 'border-red-500' : 'border-gray-300'} rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500`}
                />
                {formErrors.dueDate && <p className="mt-1 text-sm text-red-600">{formErrors.dueDate}</p>}
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
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Description *</label>
              <textarea
                rows={4}
                value={formData.description}
                onChange={(e) => setFormData(prev => ({...prev, description: e.target.value}))}
                className={`w-full px-3 py-2 border ${formErrors.description ? 'border-red-500' : 'border-gray-300'} rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500`}
                placeholder="Enter assignment description"
              />
              {formErrors.description && <p className="mt-1 text-sm text-red-600">{formErrors.description}</p>}
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

            {/* Resources */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Resources/References</label>
              {formData.resources.map((resource, index) => (
                <div key={index} className="flex items-center space-x-2 mb-2">
                  <input
                    type="text"
                    value={resource}
                    onChange={(e) => handleArrayFieldChange('resources', index, e.target.value)}
                    className="flex-1 px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="Enter resource URL or reference"
                  />
                  {formData.resources.length > 1 && (
                    <button
                      type="button"
                      onClick={() => removeArrayField('resources', index)}
                      className="p-2 text-red-600 hover:text-red-800"
                    >
                      ×
                    </button>
                  )}
                </div>
              ))}
              <button
                type="button"
                onClick={() => addArrayField('resources')}
                className="text-blue-600 hover:text-blue-800 text-sm"
              >
                + Add Resource
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
                onClick={handleCreateAssignment}
                disabled={saving}
                className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {saving ? 'Creating...' : 'Create Assignment'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Assignment Detail */}
      {view === 'detail' && selectedAssignment && (
        <div className="bg-white rounded-lg shadow">
          <div className="px-6 py-4 border-b border-gray-200">
            <div className="flex justify-between items-center">
              <h3 className="text-lg font-medium text-gray-900">{selectedAssignment.title}</h3>
              <div className="flex space-x-2">
                <span className={`px-2 py-1 rounded-full text-xs font-medium ${getPriorityColor(selectedAssignment.priority)}`}>
                  {selectedAssignment.priority.toUpperCase()}
                </span>
                <span className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(selectedAssignment.status)}`}>
                  {selectedAssignment.status.toUpperCase()}
                </span>
              </div>
            </div>
          </div>

          <div className="p-6 space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <h4 className="text-sm font-medium text-gray-900 mb-2">Assignment Details</h4>
                <div className="space-y-2 text-sm">
                  <div><span className="font-medium">Class:</span> {selectedAssignment.class.name} ({selectedAssignment.class.level})</div>
                  <div><span className="font-medium">Subject:</span> {selectedAssignment.subject.name}</div>
                  <div><span className="font-medium">Due Date:</span> {formatDate(selectedAssignment.dueDate)}</div>
                  <div><span className="font-medium">Maximum Marks:</span> {selectedAssignment.maxMarks}</div>
                  <div><span className="font-medium">Created:</span> {formatDate(selectedAssignment.createdAt)}</div>
                </div>
              </div>

              <div>
                <h4 className="text-sm font-medium text-gray-900 mb-2">Submission Stats</h4>
                <div className="space-y-2 text-sm">
                  <div><span className="font-medium">Total Submissions:</span> {selectedAssignment.submissions.length}</div>
                  <div><span className="font-medium">Graded:</span> {selectedAssignment.submissions.filter(s => s.status === 'graded').length}</div>
                  <div><span className="font-medium">On Time:</span> {selectedAssignment.submissions.filter(s => !s.isLate).length}</div>
                  <div><span className="font-medium">Late:</span> {selectedAssignment.submissions.filter(s => s.isLate).length}</div>
                </div>
              </div>
            </div>

            <div>
              <h4 className="text-sm font-medium text-gray-900 mb-2">Description</h4>
              <p className="text-gray-600">{selectedAssignment.description}</p>
            </div>

            {selectedAssignment.instructions.length > 0 && (
              <div>
                <h4 className="text-sm font-medium text-gray-900 mb-2">Instructions</h4>
                <ul className="space-y-1">
                  {selectedAssignment.instructions.map((instruction, index) => (
                    <li key={index} className="text-sm text-gray-600 flex items-start">
                      <span className="inline-block w-2 h-2 bg-blue-600 rounded-full mt-1.5 mr-3 flex-shrink-0"></span>
                      {instruction}
                    </li>
                  ))}
                </ul>
              </div>
            )}

            {selectedAssignment.resources.length > 0 && (
              <div>
                <h4 className="text-sm font-medium text-gray-900 mb-2">Resources</h4>
                <ul className="space-y-1">
                  {selectedAssignment.resources.map((resource, index) => (
                    <li key={index} className="text-sm">
                      <a href={resource} target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:underline">
                        {resource}
                      </a>
                    </li>
                  ))}
                </ul>
              </div>
            )}

            {/* Submissions List */}
            <div>
              <h4 className="text-sm font-medium text-gray-900 mb-4">Submissions ({selectedAssignment.submissions.length})</h4>
              {selectedAssignment.submissions.length > 0 ? (
                <div className="overflow-x-auto">
                  <table className="min-w-full divide-y divide-gray-200">
                    <thead className="bg-gray-50">
                      <tr>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Student</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Submitted</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Status</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Marks</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Actions</th>
                      </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                      {selectedAssignment.submissions.map(submission => (
                        <tr key={submission._id}>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <div>
                              <div className="text-sm font-medium text-gray-900">
                                {submission.student.firstName} {submission.student.lastName}
                              </div>
                              <div className="text-sm text-gray-500">Roll: {submission.student.rollNumber}</div>
                            </div>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                            {formatDate(submission.submittedAt)}
                            {submission.isLate && (
                              <span className="ml-2 inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-red-100 text-red-800">
                                Late
                              </span>
                            )}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                              submission.status === 'graded' ? 'bg-green-100 text-green-800' :
                              submission.status === 'late' ? 'bg-red-100 text-red-800' : 
                              'bg-yellow-100 text-yellow-800'
                            }`}>
                              {submission.status === 'graded' && <CheckCircle className="h-3 w-3 mr-1" />}
                              {submission.status === 'late' && <Clock className="h-3 w-3 mr-1" />}
                              {submission.status === 'submitted' && <AlertCircle className="h-3 w-3 mr-1" />}
                              {submission.status}
                            </span>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                            {submission.marksObtained !== undefined 
                              ? `${submission.marksObtained}/${selectedAssignment.maxMarks}` 
                              : '-'
                            }
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                            <button
                              onClick={() => {
                                setView('grade');
                              }}
                              className="text-blue-600 hover:text-blue-900"
                            >
                              {submission.status === 'graded' ? 'Re-grade' : 'Grade'}
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              ) : (
                <div className="text-center py-8 text-gray-500">
                  No submissions yet.
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Grading Interface */}
      {view === 'grade' && selectedAssignment && (
        <div className="bg-white rounded-lg shadow">
          <div className="px-6 py-4 border-b border-gray-200">
            <h3 className="text-lg font-medium text-gray-900">Grade Submissions - {selectedAssignment.title}</h3>
          </div>

          <div className="p-6">
            {selectedAssignment.submissions.length > 0 ? (
              <div className="space-y-6">
                {selectedAssignment.submissions.map(submission => (
                  <div key={submission._id} className="border border-gray-200 rounded-lg p-6">
                    <div className="flex justify-between items-start mb-4">
                      <div>
                        <h4 className="text-lg font-medium text-gray-900">
                          {submission.student.firstName} {submission.student.lastName}
                        </h4>
                        <p className="text-sm text-gray-500">Roll No: {submission.student.rollNumber}</p>
                        <p className="text-sm text-gray-500">
                          Submitted: {formatDate(submission.submittedAt)}
                          {submission.isLate && <span className="ml-2 text-red-600">(Late)</span>}
                        </p>
                      </div>
                      <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                        submission.status === 'graded' ? 'bg-green-100 text-green-800' : 'bg-yellow-100 text-yellow-800'
                      }`}>
                        {submission.status}
                      </span>
                    </div>

                    <div className="mb-4">
                      <h5 className="text-sm font-medium text-gray-900 mb-2">Submission Content</h5>
                      <div className="bg-gray-50 p-4 rounded-md">
                        <p className="text-sm text-gray-700 whitespace-pre-wrap">{submission.content}</p>
                      </div>
                    </div>

                    {submission.attachments.length > 0 && (
                      <div className="mb-4">
                        <h5 className="text-sm font-medium text-gray-900 mb-2">Attachments</h5>
                        <div className="space-y-1">
                          {submission.attachments.map((attachment, index) => (
                            <div key={index} className="flex items-center text-sm text-blue-600 hover:text-blue-800">
                              <FileText className="h-4 w-4 mr-1" />
                              <a href={attachment} target="_blank" rel="noopener noreferrer">{attachment}</a>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          Marks (out of {selectedAssignment.maxMarks})
                        </label>
                        <input
                          type="number"
                          min="0"
                          max={selectedAssignment.maxMarks}
                          value={gradingData[submission.student._id]?.marksObtained || ''}
                          onChange={(e) => setGradingData(prev => ({
                            ...prev,
                            [submission.student._id]: {
                              ...prev[submission.student._id],
                              marksObtained: e.target.value
                            }
                          }))}
                          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                          placeholder="Enter marks"
                        />
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">Feedback</label>
                        <textarea
                          rows={3}
                          value={gradingData[submission.student._id]?.feedback || ''}
                          onChange={(e) => setGradingData(prev => ({
                            ...prev,
                            [submission.student._id]: {
                              ...prev[submission.student._id],
                              feedback: e.target.value
                            }
                          }))}
                          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                          placeholder="Enter feedback for the student"
                        />
                      </div>
                    </div>

                    {submission.feedback && (
                      <div className="mt-4 p-4 bg-blue-50 rounded-md">
                        <h5 className="text-sm font-medium text-blue-900 mb-1">Previous Feedback</h5>
                        <p className="text-sm text-blue-700">{submission.feedback}</p>
                      </div>
                    )}
                  </div>
                ))}

                <div className="flex justify-end pt-6 border-t">
                  <button
                    onClick={handleGradeSubmissions}
                    disabled={grading}
                    className="px-6 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {grading ? 'Saving Grades...' : 'Save Grades'}
                  </button>
                </div>
              </div>
            ) : (
              <div className="text-center py-8 text-gray-500">
                No submissions to grade yet.
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default Assignments;