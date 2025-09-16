import { useState, useEffect } from 'react';
import axios from 'axios';
import { useAuth } from '../../../contexts/AuthContext';
import { 
  Plus, Save, Edit, Trash2, Download, Filter, 
  BookOpen, Users, Calculator, TrendingUp, 
  BarChart3, Star, Award, AlertCircle, Eye
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

interface Student {
  _id: string;
  firstName: string;
  lastName: string;
  rollNumber: string;
}

interface GradeComponent {
  _id: string;
  name: string;
  type: 'assignment' | 'exam' | 'quiz' | 'project' | 'participation';
  maxMarks: number;
  weightage: number;
  description?: string;
  dueDate?: string;
}

interface Grade {
  _id: string;
  student: Student;
  subject: Subject;
  class: Class;
  component: GradeComponent;
  marksObtained: number;
  percentage: number;
  grade: string;
  remarks?: string;
  gradedBy: string;
  gradedAt: string;
}

interface GradeSummary {
  student: Student;
  totalWeightedMarks: number;
  totalPossibleMarks: number;
  overallPercentage: number;
  overallGrade: string;
  grades: Grade[];
}

const Gradebook = () => {
  const { token } = useAuth();
  const [classes, setClasses] = useState<Class[]>([]);
  const [subjects, setSubjects] = useState<Subject[]>([]);
  const [selectedClass, setSelectedClass] = useState<Class | null>(null);
  const [selectedSubject, setSelectedSubject] = useState<Subject | null>(null);
  const [students, setStudents] = useState<Student[]>([]);
  const [gradeComponents, setGradeComponents] = useState<GradeComponent[]>([]);
  const [grades, setGrades] = useState<Grade[]>([]);
  const [gradeSummaries, setGradeSummaries] = useState<GradeSummary[]>([]);
  
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [view, setView] = useState<'overview' | 'components' | 'grades' | 'summary'>('overview');
  
  // Component management
  const [showComponentModal, setShowComponentModal] = useState(false);
  const [editingComponent, setEditingComponent] = useState<GradeComponent | null>(null);
  const [componentForm, setComponentForm] = useState({
    name: '',
    type: 'assignment',
    maxMarks: '',
    weightage: '',
    description: '',
    dueDate: ''
  });

  // Grade entry
  const [gradeEntries, setGradeEntries] = useState<{[key: string]: {marksObtained: string, remarks: string}}>({});

  useEffect(() => {
    fetchClasses();
    fetchSubjects();
  }, []);

  useEffect(() => {
    if (selectedClass && selectedSubject) {
      fetchStudents();
      fetchGradeComponents();
      fetchGrades();
    }
  }, [selectedClass, selectedSubject]);

  useEffect(() => {
    if (grades.length > 0 && students.length > 0) {
      calculateGradeSummaries();
    }
  }, [grades, students, gradeComponents]);

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

  const fetchStudents = async () => {
    if (!selectedClass) return;
    
    try {
      const response = await axios.get(`/api/classes/${selectedClass._id}/students/compact`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setStudents(response.data.data);
    } catch (error) {
      console.error('Error fetching students:', error);
    }
  };

  const fetchGradeComponents = async () => {
    if (!selectedClass || !selectedSubject) return;

    try {
      // This would be a real API call to fetch grade components
      // For now using mock data
      const mockComponents: GradeComponent[] = [
        {
          _id: '1',
          name: 'Assignment 1',
          type: 'assignment',
          maxMarks: 100,
          weightage: 20,
          description: 'Math problems chapter 1-3'
        },
        {
          _id: '2', 
          name: 'Mid Term Exam',
          type: 'exam',
          maxMarks: 100,
          weightage: 30,
          description: 'Comprehensive mid-term examination'
        },
        {
          _id: '3',
          name: 'Quiz 1',
          type: 'quiz',
          maxMarks: 50,
          weightage: 10,
          description: 'Quick assessment on recent topics'
        },
        {
          _id: '4',
          name: 'Final Project',
          type: 'project',
          maxMarks: 100,
          weightage: 25,
          description: 'End of term project'
        },
        {
          _id: '5',
          name: 'Participation',
          type: 'participation',
          maxMarks: 100,
          weightage: 15,
          description: 'Class participation and engagement'
        }
      ];
      
      setGradeComponents(mockComponents);
    } catch (error) {
      console.error('Error fetching grade components:', error);
    }
  };

  const fetchGrades = async () => {
    if (!selectedClass || !selectedSubject) return;

    try {
      // This would be a real API call to fetch grades
      // For now using mock data
      const mockGrades: Grade[] = [];
      setGrades(mockGrades);
    } catch (error) {
      console.error('Error fetching grades:', error);
    }
  };

  const calculateGradeSummaries = () => {
    const summaries: GradeSummary[] = students.map(student => {
      const studentGrades = grades.filter(g => g.student._id === student._id);
      
      let totalWeightedMarks = 0;
      let totalPossibleMarks = 0;

      gradeComponents.forEach(component => {
        const grade = studentGrades.find(g => g.component._id === component._id);
        if (grade) {
          const weightedMarks = (grade.marksObtained / component.maxMarks) * component.weightage;
          totalWeightedMarks += weightedMarks;
        }
        totalPossibleMarks += component.weightage;
      });

      const overallPercentage = totalPossibleMarks > 0 ? (totalWeightedMarks / totalPossibleMarks) * 100 : 0;
      
      return {
        student,
        totalWeightedMarks,
        totalPossibleMarks,
        overallPercentage: Math.round(overallPercentage * 100) / 100,
        overallGrade: calculateLetterGrade(overallPercentage),
        grades: studentGrades
      };
    });

    setGradeSummaries(summaries.sort((a, b) => b.overallPercentage - a.overallPercentage));
  };

  const calculateLetterGrade = (percentage: number): string => {
    if (percentage >= 90) return 'A+';
    if (percentage >= 85) return 'A';
    if (percentage >= 80) return 'B+';
    if (percentage >= 75) return 'B';
    if (percentage >= 70) return 'C+';
    if (percentage >= 65) return 'C';
    if (percentage >= 60) return 'D+';
    if (percentage >= 55) return 'D';
    return 'F';
  };

  const getGradeColor = (grade: string) => {
    switch (grade) {
      case 'A+': case 'A': return 'text-green-600 bg-green-100';
      case 'B+': case 'B': return 'text-blue-600 bg-blue-100';
      case 'C+': case 'C': return 'text-yellow-600 bg-yellow-100';
      case 'D+': case 'D': return 'text-orange-600 bg-orange-100';
      default: return 'text-red-600 bg-red-100';
    }
  };

  const handleComponentSave = async () => {
    try {
      setSaving(true);
      
      // Validate form
      if (!componentForm.name || !componentForm.maxMarks || !componentForm.weightage) {
        alert('Please fill in all required fields');
        return;
      }

      const payload = {
        ...componentForm,
        maxMarks: parseInt(componentForm.maxMarks),
        weightage: parseFloat(componentForm.weightage),
        classId: selectedClass?._id,
        subjectId: selectedSubject?._id
      };

      // This would be a real API call
      console.log('Saving component:', payload);
      
      // Mock success
      const newComponent: GradeComponent = {
        _id: Date.now().toString(),
        name: componentForm.name,
        type: componentForm.type as any,
        maxMarks: parseInt(componentForm.maxMarks),
        weightage: parseFloat(componentForm.weightage),
        description: componentForm.description
      };

      if (editingComponent) {
        setGradeComponents(prev => prev.map(c => c._id === editingComponent._id ? {...newComponent, _id: editingComponent._id} : c));
      } else {
        setGradeComponents(prev => [...prev, newComponent]);
      }

      resetComponentForm();
      setShowComponentModal(false);
      alert('Component saved successfully!');
    } catch (error) {
      console.error('Error saving component:', error);
      alert('Error saving component');
    } finally {
      setSaving(false);
    }
  };

  const handleGradeSave = async (componentId: string) => {
    try {
      setSaving(true);
      
      const gradesToSave = Object.entries(gradeEntries)
        .filter(([_, data]) => data.marksObtained !== '')
        .map(([studentId, data]) => ({
          studentId,
          componentId,
          marksObtained: parseInt(data.marksObtained),
          remarks: data.remarks
        }));

      if (gradesToSave.length === 0) {
        alert('Please enter grades for at least one student');
        return;
      }

      // This would be a real API call
      console.log('Saving grades:', gradesToSave);
      
      alert('Grades saved successfully!');
      
      // Reset form
      setGradeEntries({});
    } catch (error) {
      console.error('Error saving grades:', error);
      alert('Error saving grades');
    } finally {
      setSaving(false);
    }
  };

  const resetComponentForm = () => {
    setComponentForm({
      name: '',
      type: 'assignment',
      maxMarks: '',
      weightage: '',
      description: '',
      dueDate: ''
    });
    setEditingComponent(null);
  };

  const exportGradebook = () => {
    const csvContent = [
      ['Student Name', 'Roll Number', ...gradeComponents.map(c => c.name), 'Overall %', 'Overall Grade'],
      ...gradeSummaries.map(summary => [
        `${summary.student.firstName} ${summary.student.lastName}`,
        summary.student.rollNumber,
        ...gradeComponents.map(component => {
          const grade = summary.grades.find(g => g.component._id === component._id);
          return grade ? `${grade.marksObtained}/${component.maxMarks}` : '-';
        }),
        summary.overallPercentage.toString(),
        summary.overallGrade
      ])
    ].map(row => row.join(',')).join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `gradebook_${selectedClass?.name}_${selectedSubject?.code}_${new Date().toISOString().split('T')[0]}.csv`;
    link.click();
    window.URL.revokeObjectURL(url);
  };

  const getClassAverage = () => {
    if (gradeSummaries.length === 0) return 0;
    const total = gradeSummaries.reduce((sum, s) => sum + s.overallPercentage, 0);
    return Math.round((total / gradeSummaries.length) * 100) / 100;
  };

  const getPassingRate = () => {
    if (gradeSummaries.length === 0) return 0;
    const passing = gradeSummaries.filter(s => s.overallPercentage >= 60).length;
    return Math.round((passing / gradeSummaries.length) * 100 * 100) / 100;
  };

  return (
    <div className="p-6 space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Gradebook</h1>
          <p className="text-gray-600 mt-1">Manage grades and track student performance</p>
        </div>
        <div className="flex space-x-3">
          {selectedClass && selectedSubject && (
            <button
              onClick={exportGradebook}
              className="inline-flex items-center px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50"
            >
              <Download className="h-4 w-4 mr-2" />
              Export
            </button>
          )}
        </div>
      </div>

      {/* Class and Subject Selection */}
      <div className="bg-white rounded-lg shadow p-6">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Select Class</label>
            <select
              value={selectedClass?._id || ''}
              onChange={(e) => {
                const classId = e.target.value;
                const foundClass = classes.find(c => c._id === classId);
                setSelectedClass(foundClass || null);
              }}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="">Choose a class</option>
              {classes.map(cls => (
                <option key={cls._id} value={cls._id}>{cls.name} ({cls.level})</option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Select Subject</label>
            <select
              value={selectedSubject?._id || ''}
              onChange={(e) => {
                const subjectId = e.target.value;
                const foundSubject = subjects.find(s => s._id === subjectId);
                setSelectedSubject(foundSubject || null);
              }}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="">Choose a subject</option>
              {subjects.map(subj => (
                <option key={subj._id} value={subj._id}>{subj.name} ({subj.code})</option>
              ))}
            </select>
          </div>
        </div>
      </div>

      {selectedClass && selectedSubject ? (
        <div className="space-y-6">
          {/* Navigation */}
          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex space-x-4">
              <button
                onClick={() => setView('overview')}
                className={`px-4 py-2 rounded-md text-sm font-medium ${
                  view === 'overview'
                    ? 'bg-blue-600 text-white'
                    : 'text-gray-700 hover:bg-gray-100'
                }`}
              >
                <BarChart3 className="h-4 w-4 inline mr-2" />
                Overview
              </button>
              <button
                onClick={() => setView('components')}
                className={`px-4 py-2 rounded-md text-sm font-medium ${
                  view === 'components'
                    ? 'bg-blue-600 text-white'
                    : 'text-gray-700 hover:bg-gray-100'
                }`}
              >
                <Calculator className="h-4 w-4 inline mr-2" />
                Components
              </button>
              <button
                onClick={() => setView('grades')}
                className={`px-4 py-2 rounded-md text-sm font-medium ${
                  view === 'grades'
                    ? 'bg-blue-600 text-white'
                    : 'text-gray-700 hover:bg-gray-100'
                }`}
              >
                <Edit className="h-4 w-4 inline mr-2" />
                Enter Grades
              </button>
              <button
                onClick={() => setView('summary')}
                className={`px-4 py-2 rounded-md text-sm font-medium ${
                  view === 'summary'
                    ? 'bg-blue-600 text-white'
                    : 'text-gray-700 hover:bg-gray-100'
                }`}
              >
                <Award className="h-4 w-4 inline mr-2" />
                Summary
              </button>
            </div>
          </div>

          {/* Overview */}
          {view === 'overview' && (
            <div className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
                <div className="bg-white rounded-lg shadow p-6">
                  <div className="flex items-center">
                    <div className="flex-1">
                      <h3 className="text-lg font-medium text-gray-900">Students</h3>
                      <p className="text-3xl font-bold text-blue-600">{students.length}</p>
                    </div>
                    <Users className="h-8 w-8 text-blue-500" />
                  </div>
                </div>

                <div className="bg-white rounded-lg shadow p-6">
                  <div className="flex items-center">
                    <div className="flex-1">
                      <h3 className="text-lg font-medium text-gray-900">Components</h3>
                      <p className="text-3xl font-bold text-green-600">{gradeComponents.length}</p>
                    </div>
                    <Calculator className="h-8 w-8 text-green-500" />
                  </div>
                </div>

                <div className="bg-white rounded-lg shadow p-6">
                  <div className="flex items-center">
                    <div className="flex-1">
                      <h3 className="text-lg font-medium text-gray-900">Class Average</h3>
                      <p className="text-3xl font-bold text-yellow-600">{getClassAverage()}%</p>
                    </div>
                    <TrendingUp className="h-8 w-8 text-yellow-500" />
                  </div>
                </div>

                <div className="bg-white rounded-lg shadow p-6">
                  <div className="flex items-center">
                    <div className="flex-1">
                      <h3 className="text-lg font-medium text-gray-900">Passing Rate</h3>
                      <p className="text-3xl font-bold text-purple-600">{getPassingRate()}%</p>
                    </div>
                    <Award className="h-8 w-8 text-purple-500" />
                  </div>
                </div>
              </div>

              {/* Quick Grade Distribution */}
              <div className="bg-white rounded-lg shadow p-6">
                <h3 className="text-lg font-medium text-gray-900 mb-4">Grade Distribution</h3>
                {gradeSummaries.length > 0 ? (
                  <div className="space-y-3">
                    {['A+', 'A', 'B+', 'B', 'C+', 'C', 'D+', 'D', 'F'].map(grade => {
                      const count = gradeSummaries.filter(s => s.overallGrade === grade).length;
                      const percentage = (count / gradeSummaries.length) * 100;
                      return (
                        <div key={grade} className="flex items-center">
                          <div className="w-8 text-sm font-medium">{grade}</div>
                          <div className="flex-1 mx-4">
                            <div className="w-full bg-gray-200 rounded-full h-2">
                              <div 
                                className={`h-2 rounded-full ${getGradeColor(grade).replace('text-', 'bg-').replace('bg-', 'bg-')}`}
                                style={{ width: `${percentage}%` }}
                              ></div>
                            </div>
                          </div>
                          <div className="w-12 text-sm text-gray-600">{count}</div>
                        </div>
                      );
                    })}
                  </div>
                ) : (
                  <p className="text-gray-500">No grades entered yet.</p>
                )}
              </div>
            </div>
          )}

          {/* Grade Components Management */}
          {view === 'components' && (
            <div className="space-y-6">
              <div className="bg-white rounded-lg shadow">
                <div className="px-6 py-4 border-b border-gray-200">
                  <div className="flex justify-between items-center">
                    <h3 className="text-lg font-medium text-gray-900">Grade Components</h3>
                    <button
                      onClick={() => {
                        resetComponentForm();
                        setShowComponentModal(true);
                      }}
                      className="inline-flex items-center px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
                    >
                      <Plus className="h-4 w-4 mr-2" />
                      Add Component
                    </button>
                  </div>
                </div>

                <div className="p-6">
                  {gradeComponents.length > 0 ? (
                    <div className="overflow-x-auto">
                      <table className="min-w-full divide-y divide-gray-200">
                        <thead className="bg-gray-50">
                          <tr>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Component</th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Type</th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Max Marks</th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Weightage</th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Actions</th>
                          </tr>
                        </thead>
                        <tbody className="bg-white divide-y divide-gray-200">
                          {gradeComponents.map(component => (
                            <tr key={component._id}>
                              <td className="px-6 py-4">
                                <div>
                                  <div className="text-sm font-medium text-gray-900">{component.name}</div>
                                  {component.description && (
                                    <div className="text-sm text-gray-500">{component.description}</div>
                                  )}
                                </div>
                              </td>
                              <td className="px-6 py-4 text-sm text-gray-900 capitalize">{component.type}</td>
                              <td className="px-6 py-4 text-sm text-gray-900">{component.maxMarks}</td>
                              <td className="px-6 py-4 text-sm text-gray-900">{component.weightage}%</td>
                              <td className="px-6 py-4 text-sm font-medium space-x-2">
                                <button
                                  onClick={() => {
                                    setEditingComponent(component);
                                    setComponentForm({
                                      name: component.name,
                                      type: component.type,
                                      maxMarks: component.maxMarks.toString(),
                                      weightage: component.weightage.toString(),
                                      description: component.description || '',
                                      dueDate: component.dueDate || ''
                                    });
                                    setShowComponentModal(true);
                                  }}
                                  className="text-blue-600 hover:text-blue-900"
                                >
                                  <Edit className="h-4 w-4" />
                                </button>
                                <button className="text-red-600 hover:text-red-900">
                                  <Trash2 className="h-4 w-4" />
                                </button>
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  ) : (
                    <div className="text-center py-8">
                      <Calculator className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                      <h3 className="text-lg font-medium text-gray-900 mb-2">No Components Yet</h3>
                      <p className="text-gray-600">Create grade components to start grading students.</p>
                    </div>
                  )}
                </div>
              </div>

              {/* Total Weightage Check */}
              {gradeComponents.length > 0 && (
                <div className="bg-white rounded-lg shadow p-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <h4 className="text-sm font-medium text-gray-900">Total Weightage</h4>
                      <p className="text-2xl font-bold text-blue-600">
                        {gradeComponents.reduce((sum, c) => sum + c.weightage, 0)}%
                      </p>
                    </div>
                    {gradeComponents.reduce((sum, c) => sum + c.weightage, 0) !== 100 && (
                      <div className="text-orange-600 text-sm">
                        <AlertCircle className="h-4 w-4 inline mr-1" />
                        Weightage should total 100%
                      </div>
                    )}
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Grade Entry */}
          {view === 'grades' && (
            <div className="space-y-6">
              {gradeComponents.length === 0 ? (
                <div className="text-center py-12 bg-white rounded-lg shadow">
                  <Calculator className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                  <h3 className="text-lg font-medium text-gray-900 mb-2">Create Components First</h3>
                  <p className="text-gray-600 mb-4">You need to create grade components before entering grades.</p>
                  <button
                    onClick={() => setView('components')}
                    className="inline-flex items-center px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
                  >
                    <Plus className="h-4 w-4 mr-2" />
                    Add Components
                  </button>
                </div>
              ) : (
                gradeComponents.map(component => (
                  <div key={component._id} className="bg-white rounded-lg shadow">
                    <div className="px-6 py-4 border-b border-gray-200">
                      <div className="flex justify-between items-center">
                        <div>
                          <h3 className="text-lg font-medium text-gray-900">{component.name}</h3>
                          <p className="text-sm text-gray-600">
                            Max: {component.maxMarks} marks | Weightage: {component.weightage}%
                          </p>
                        </div>
                        <button
                          onClick={() => handleGradeSave(component._id)}
                          disabled={saving}
                          className="inline-flex items-center px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 disabled:opacity-50"
                        >
                          <Save className="h-4 w-4 mr-2" />
                          {saving ? 'Saving...' : 'Save Grades'}
                        </button>
                      </div>
                    </div>

                    <div className="p-6">
                      <div className="space-y-4">
                        {students.map(student => (
                          <div key={student._id} className="flex items-center space-x-4 p-4 border border-gray-200 rounded-lg">
                            <div className="flex-1">
                              <h4 className="text-sm font-medium text-gray-900">
                                {student.firstName} {student.lastName}
                              </h4>
                              <p className="text-sm text-gray-500">Roll: {student.rollNumber}</p>
                            </div>

                            <div className="flex items-center space-x-4">
                              <div>
                                <label className="block text-xs text-gray-500 mb-1">Marks</label>
                                <input
                                  type="number"
                                  min="0"
                                  max={component.maxMarks}
                                  value={gradeEntries[student._id]?.marksObtained || ''}
                                  onChange={(e) => setGradeEntries(prev => ({
                                    ...prev,
                                    [student._id]: {
                                      ...prev[student._id],
                                      marksObtained: e.target.value
                                    }
                                  }))}
                                  className="w-20 px-2 py-1 text-sm border border-gray-300 rounded focus:outline-none focus:ring-1 focus:ring-blue-500"
                                  placeholder="0"
                                />
                              </div>

                              <div>
                                <label className="block text-xs text-gray-500 mb-1">Remarks</label>
                                <input
                                  type="text"
                                  value={gradeEntries[student._id]?.remarks || ''}
                                  onChange={(e) => setGradeEntries(prev => ({
                                    ...prev,
                                    [student._id]: {
                                      ...prev[student._id],
                                      remarks: e.target.value
                                    }
                                  }))}
                                  className="w-40 px-2 py-1 text-sm border border-gray-300 rounded focus:outline-none focus:ring-1 focus:ring-blue-500"
                                  placeholder="Optional"
                                />
                              </div>

                              <div className="text-sm text-gray-500">
                                {gradeEntries[student._id]?.marksObtained ? (
                                  <>
                                    {((parseFloat(gradeEntries[student._id].marksObtained) / component.maxMarks) * 100).toFixed(1)}%
                                  </>
                                ) : '-'}
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                ))
              )}
            </div>
          )}

          {/* Summary */}
          {view === 'summary' && (
            <div className="bg-white rounded-lg shadow">
              <div className="px-6 py-4 border-b border-gray-200">
                <h3 className="text-lg font-medium text-gray-900">Student Grade Summary</h3>
              </div>

              <div className="p-6">
                {gradeSummaries.length > 0 ? (
                  <div className="overflow-x-auto">
                    <table className="min-w-full divide-y divide-gray-200">
                      <thead className="bg-gray-50">
                        <tr>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Student</th>
                          {gradeComponents.map(component => (
                            <th key={component._id} className="px-3 py-3 text-center text-xs font-medium text-gray-500 uppercase">
                              {component.name}
                            </th>
                          ))}
                          <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase">Overall</th>
                          <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase">Grade</th>
                        </tr>
                      </thead>
                      <tbody className="bg-white divide-y divide-gray-200">
                        {gradeSummaries.map((summary, index) => (
                          <tr key={summary.student._id} className={index === 0 ? 'bg-yellow-50' : ''}>
                            <td className="px-6 py-4">
                              <div>
                                <div className="text-sm font-medium text-gray-900">
                                  {summary.student.firstName} {summary.student.lastName}
                                  {index === 0 && <span className="ml-2">👑</span>}
                                </div>
                                <div className="text-sm text-gray-500">Roll: {summary.student.rollNumber}</div>
                              </div>
                            </td>
                            {gradeComponents.map(component => {
                              const grade = summary.grades.find(g => g.component._id === component._id);
                              return (
                                <td key={component._id} className="px-3 py-4 text-center text-sm">
                                  {grade ? (
                                    <div>
                                      <div className="font-medium">{grade.marksObtained}/{component.maxMarks}</div>
                                      <div className="text-xs text-gray-500">{grade.percentage}%</div>
                                    </div>
                                  ) : (
                                    <span className="text-gray-400">-</span>
                                  )}
                                </td>
                              );
                            })}
                            <td className="px-6 py-4 text-center">
                              <div className="text-sm font-medium text-gray-900">{summary.overallPercentage}%</div>
                            </td>
                            <td className="px-6 py-4 text-center">
                              <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getGradeColor(summary.overallGrade)}`}>
                                {summary.overallGrade}
                              </span>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                ) : (
                  <div className="text-center py-8">
                    <Award className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                    <h3 className="text-lg font-medium text-gray-900 mb-2">No Grades to Summarize</h3>
                    <p className="text-gray-600">Enter grades for your students to see their summary here.</p>
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
      ) : (
        <div className="text-center py-12 bg-white rounded-lg shadow">
          <BookOpen className="h-12 w-12 text-gray-400 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-gray-900 mb-2">Select Class and Subject</h3>
          <p className="text-gray-600">Choose a class and subject to manage gradebook.</p>
        </div>
      )}

      {/* Component Modal */}
      {showComponentModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg w-full max-w-md mx-4">
            <div className="px-6 py-4 border-b border-gray-200">
              <h3 className="text-lg font-medium text-gray-900">
                {editingComponent ? 'Edit Component' : 'Add Grade Component'}
              </h3>
            </div>

            <div className="p-6 space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Component Name *</label>
                <input
                  type="text"
                  value={componentForm.name}
                  onChange={(e) => setComponentForm(prev => ({...prev, name: e.target.value}))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="e.g., Assignment 1, Mid Term Exam"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Type</label>
                <select
                  value={componentForm.type}
                  onChange={(e) => setComponentForm(prev => ({...prev, type: e.target.value}))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="assignment">Assignment</option>
                  <option value="exam">Exam</option>
                  <option value="quiz">Quiz</option>
                  <option value="project">Project</option>
                  <option value="participation">Participation</option>
                </select>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Max Marks *</label>
                  <input
                    type="number"
                    min="1"
                    value={componentForm.maxMarks}
                    onChange={(e) => setComponentForm(prev => ({...prev, maxMarks: e.target.value}))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="100"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Weightage (%) *</label>
                  <input
                    type="number"
                    min="1"
                    max="100"
                    step="0.1"
                    value={componentForm.weightage}
                    onChange={(e) => setComponentForm(prev => ({...prev, weightage: e.target.value}))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="20"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Description</label>
                <textarea
                  rows={2}
                  value={componentForm.description}
                  onChange={(e) => setComponentForm(prev => ({...prev, description: e.target.value}))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="Optional description"
                />
              </div>
            </div>

            <div className="px-6 py-4 border-t border-gray-200 flex justify-end space-x-3">
              <button
                onClick={() => {
                  setShowComponentModal(false);
                  resetComponentForm();
                }}
                className="px-4 py-2 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50"
              >
                Cancel
              </button>
              <button
                onClick={handleComponentSave}
                disabled={saving}
                className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50"
              >
                {saving ? 'Saving...' : editingComponent ? 'Update' : 'Create'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Gradebook;
