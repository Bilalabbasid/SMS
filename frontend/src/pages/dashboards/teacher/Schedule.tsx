import { useState, useEffect } from 'react';
import axios from 'axios';
import { useAuth } from '../../../contexts/AuthContext';
import { 
  Calendar, Clock, MapPin, Users, BookOpen, 
  ChevronLeft, ChevronRight, Plus, Edit, 
  Trash2, Bell, Download, Filter, MoreVertical,
  CalendarDays, Timer, Building, User, AlertCircle
} from 'lucide-react';

interface TimeSlot {
  _id: string;
  startTime: string;
  endTime: string;
  period: number;
}

interface Class {
  _id: string;
  name: string;
  level: string;
  section: string;
  room: string;
  studentCount: number;
}

interface Subject {
  _id: string;
  name: string;
  code: string;
  color: string;
}

interface ScheduleEntry {
  _id: string;
  day: string;
  timeSlot: TimeSlot;
  subject: Subject;
  class: Class;
  room: string;
  type: 'regular' | 'makeup' | 'extra' | 'exam';
  status: 'scheduled' | 'completed' | 'cancelled' | 'rescheduled';
  notes?: string;
  createdAt: string;
}

interface WeekSchedule {
  [key: string]: ScheduleEntry[];
}

const Schedule = () => {
  const { token } = useAuth();
  const [schedule, setSchedule] = useState<WeekSchedule>({});
  const [timeSlots, setTimeSlots] = useState<TimeSlot[]>([]);
  const [classes, setClasses] = useState<Class[]>([]);
  const [subjects, setSubjects] = useState<Subject[]>([]);
  
  const [loading, setLoading] = useState(true);
  const [view, setView] = useState<'week' | 'day' | 'month'>('week');
  const [currentWeek, setCurrentWeek] = useState(new Date());
  const [selectedDate, setSelectedDate] = useState(new Date());
  
  // Modal states
  const [showScheduleModal, setShowScheduleModal] = useState(false);
  const [editingEntry, setEditingEntry] = useState<ScheduleEntry | null>(null);
  const [scheduleForm, setScheduleForm] = useState({
    day: '',
    timeSlotId: '',
    subjectId: '',
    classId: '',
    room: '',
    type: 'regular',
    notes: ''
  });

  const weekDays = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday'];
  
  const dayColors = {
    Monday: 'bg-blue-50 border-blue-200',
    Tuesday: 'bg-green-50 border-green-200',
    Wednesday: 'bg-purple-50 border-purple-200',
    Thursday: 'bg-orange-50 border-orange-200',
    Friday: 'bg-pink-50 border-pink-200'
  };

  const typeColors = {
    regular: 'bg-blue-100 text-blue-800 border-blue-300',
    makeup: 'bg-orange-100 text-orange-800 border-orange-300',
    extra: 'bg-green-100 text-green-800 border-green-300',
    exam: 'bg-red-100 text-red-800 border-red-300'
  };

  const statusColors = {
    scheduled: 'bg-gray-100 text-gray-800',
    completed: 'bg-green-100 text-green-800',
    cancelled: 'bg-red-100 text-red-800',
    rescheduled: 'bg-yellow-100 text-yellow-800'
  };

  useEffect(() => {
    fetchInitialData();
  }, []);

  useEffect(() => {
    if (view === 'week') {
      fetchWeekSchedule();
    } else if (view === 'day') {
      fetchDaySchedule();
    }
  }, [currentWeek, selectedDate, view]);

  const fetchInitialData = async () => {
    try {
      setLoading(true);
      
      // Fetch time slots
      const timeSlotsResponse = await axios.get('/api/timeslots', {
        headers: { Authorization: `Bearer ${token}` }
      });
      
      // Mock time slots if API doesn't exist
      const mockTimeSlots: TimeSlot[] = [
        { _id: '1', startTime: '08:00', endTime: '08:45', period: 1 },
        { _id: '2', startTime: '08:45', endTime: '09:30', period: 2 },
        { _id: '3', startTime: '09:45', endTime: '10:30', period: 3 },
        { _id: '4', startTime: '10:30', endTime: '11:15', period: 4 },
        { _id: '5', startTime: '11:30', endTime: '12:15', period: 5 },
        { _id: '6', startTime: '12:15', endTime: '13:00', period: 6 },
        { _id: '7', startTime: '14:00', endTime: '14:45', period: 7 },
        { _id: '8', startTime: '14:45', endTime: '15:30', period: 8 }
      ];
      
      setTimeSlots(mockTimeSlots);
      
      // Fetch classes and subjects
      const [classesResponse, subjectsResponse] = await Promise.all([
        axios.get('/api/teachers/me/classes', { headers: { Authorization: `Bearer ${token}` }}),
        axios.get('/api/subjects', { headers: { Authorization: `Bearer ${token}` }})
      ]);
      
      setClasses(classesResponse.data.data || []);
      setSubjects(subjectsResponse.data.data || []);
      
    } catch (error) {
      console.error('Error fetching initial data:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchWeekSchedule = async () => {
    try {
      // Mock schedule data - in real app this would come from API
      const mockSchedule: WeekSchedule = {
        Monday: [
          {
            _id: '1',
            day: 'Monday',
            timeSlot: timeSlots[0],
            subject: { _id: '1', name: 'Mathematics', code: 'MATH101', color: '#3B82F6' },
            class: { _id: '1', name: 'Grade 10A', level: '10', section: 'A', room: 'Room 101', studentCount: 30 },
            room: 'Room 101',
            type: 'regular',
            status: 'scheduled',
            notes: 'Algebra chapter 5',
            createdAt: new Date().toISOString()
          },
          {
            _id: '2',
            day: 'Monday',
            timeSlot: timeSlots[2],
            subject: { _id: '2', name: 'Physics', code: 'PHY101', color: '#10B981' },
            class: { _id: '2', name: 'Grade 11B', level: '11', section: 'B', room: 'Lab 201', studentCount: 25 },
            room: 'Lab 201',
            type: 'regular',
            status: 'scheduled',
            createdAt: new Date().toISOString()
          }
        ],
        Tuesday: [
          {
            _id: '3',
            day: 'Tuesday',
            timeSlot: timeSlots[1],
            subject: { _id: '1', name: 'Mathematics', code: 'MATH101', color: '#3B82F6' },
            class: { _id: '3', name: 'Grade 10B', level: '10', section: 'B', room: 'Room 102', studentCount: 28 },
            room: 'Room 102',
            type: 'regular',
            status: 'scheduled',
            createdAt: new Date().toISOString()
          },
          {
            _id: '4',
            day: 'Tuesday',
            timeSlot: timeSlots[4],
            subject: { _id: '3', name: 'Chemistry', code: 'CHEM101', color: '#8B5CF6' },
            class: { _id: '4', name: 'Grade 12A', level: '12', section: 'A', room: 'Lab 301', studentCount: 22 },
            room: 'Lab 301',
            type: 'exam',
            status: 'scheduled',
            notes: 'Unit test on organic chemistry',
            createdAt: new Date().toISOString()
          }
        ],
        Wednesday: [
          {
            _id: '5',
            day: 'Wednesday',
            timeSlot: timeSlots[0],
            subject: { _id: '2', name: 'Physics', code: 'PHY101', color: '#10B981' },
            class: { _id: '2', name: 'Grade 11B', level: '11', section: 'B', room: 'Lab 201', studentCount: 25 },
            room: 'Lab 201',
            type: 'makeup',
            status: 'scheduled',
            notes: 'Makeup class for missed lesson',
            createdAt: new Date().toISOString()
          }
        ],
        Thursday: [
          {
            _id: '6',
            day: 'Thursday',
            timeSlot: timeSlots[2],
            subject: { _id: '1', name: 'Mathematics', code: 'MATH101', color: '#3B82F6' },
            class: { _id: '1', name: 'Grade 10A', level: '10', section: 'A', room: 'Room 101', studentCount: 30 },
            room: 'Room 101',
            type: 'regular',
            status: 'completed',
            createdAt: new Date().toISOString()
          }
        ],
        Friday: [
          {
            _id: '7',
            day: 'Friday',
            timeSlot: timeSlots[3],
            subject: { _id: '3', name: 'Chemistry', code: 'CHEM101', color: '#8B5CF6' },
            class: { _id: '4', name: 'Grade 12A', level: '12', section: 'A', room: 'Lab 301', studentCount: 22 },
            room: 'Lab 301',
            type: 'extra',
            status: 'scheduled',
            notes: 'Extra practice session',
            createdAt: new Date().toISOString()
          }
        ]
      };
      
      setSchedule(mockSchedule);
    } catch (error) {
      console.error('Error fetching schedule:', error);
    }
  };

  const fetchDaySchedule = async () => {
    const dayName = selectedDate.toLocaleDateString('en-US', { weekday: 'long' });
    if (weekDays.includes(dayName) && schedule[dayName]) {
      // Already have the data
      return;
    }
    // Fetch specific day data if needed
  };

  const getWeekDates = (date: Date) => {
    const week = [];
    const startDate = new Date(date);
    const day = startDate.getDay();
    const diff = startDate.getDate() - day + (day === 0 ? -6 : 1); // Adjust for Monday start
    startDate.setDate(diff);
    
    for (let i = 0; i < 5; i++) {
      const currentDate = new Date(startDate);
      currentDate.setDate(startDate.getDate() + i);
      week.push(currentDate);
    }
    
    return week;
  };

  const navigateWeek = (direction: 'prev' | 'next') => {
    const newDate = new Date(currentWeek);
    newDate.setDate(currentWeek.getDate() + (direction === 'next' ? 7 : -7));
    setCurrentWeek(newDate);
  };

  const getTotalHours = () => {
    let totalMinutes = 0;
    Object.values(schedule).flat().forEach(entry => {
      if (entry.status !== 'cancelled') {
        const start = new Date(`2000-01-01 ${entry.timeSlot.startTime}`);
        const end = new Date(`2000-01-01 ${entry.timeSlot.endTime}`);
        totalMinutes += (end.getTime() - start.getTime()) / (1000 * 60);
      }
    });
    return Math.round(totalMinutes / 60 * 10) / 10;
  };

  const getTodayClasses = () => {
    const today = new Date().toLocaleDateString('en-US', { weekday: 'long' });
    return schedule[today] || [];
  };

  const getUpcomingClass = () => {
    const todayClasses = getTodayClasses();
    const now = new Date();
    const currentTime = now.getHours() * 60 + now.getMinutes();
    
    for (const entry of todayClasses) {
      const [hours, minutes] = entry.timeSlot.startTime.split(':').map(Number);
      const classTime = hours * 60 + minutes;
      if (classTime > currentTime && entry.status === 'scheduled') {
        return entry;
      }
    }
    return null;
  };

  const handleScheduleSave = async () => {
    try {
      // Validate form
      if (!scheduleForm.day || !scheduleForm.timeSlotId || !scheduleForm.subjectId || !scheduleForm.classId) {
        alert('Please fill in all required fields');
        return;
      }

      // This would be a real API call
      console.log('Saving schedule entry:', scheduleForm);
      
      alert('Schedule entry saved successfully!');
      setShowScheduleModal(false);
      resetScheduleForm();
      
    } catch (error) {
      console.error('Error saving schedule:', error);
      alert('Error saving schedule entry');
    }
  };

  const resetScheduleForm = () => {
    setScheduleForm({
      day: '',
      timeSlotId: '',
      subjectId: '',
      classId: '',
      room: '',
      type: 'regular',
      notes: ''
    });
    setEditingEntry(null);
  };

  const exportSchedule = () => {
    const csvContent = [
      ['Day', 'Time', 'Subject', 'Class', 'Room', 'Type', 'Status', 'Notes'],
      ...Object.entries(schedule).flatMap(([day, entries]) =>
        entries.map(entry => [
          day,
          `${entry.timeSlot.startTime}-${entry.timeSlot.endTime}`,
          entry.subject.name,
          entry.class.name,
          entry.room,
          entry.type,
          entry.status,
          entry.notes || ''
        ])
      )
    ].map(row => row.join(',')).join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `schedule_${new Date().toISOString().split('T')[0]}.csv`;
    link.click();
    window.URL.revokeObjectURL(url);
  };

  const upcomingClass = getUpcomingClass();
  const weekDates = getWeekDates(currentWeek);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Schedule</h1>
          <p className="text-gray-600 mt-1">Manage your teaching timetable</p>
        </div>
        <div className="flex space-x-3">
          <button
            onClick={exportSchedule}
            className="inline-flex items-center px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50"
          >
            <Download className="h-4 w-4 mr-2" />
            Export
          </button>
          <button
            onClick={() => {
              resetScheduleForm();
              setShowScheduleModal(true);
            }}
            className="inline-flex items-center px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
          >
            <Plus className="h-4 w-4 mr-2" />
            Add Class
          </button>
        </div>
      </div>

      {/* Quick Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center">
            <div className="flex-1">
              <h3 className="text-lg font-medium text-gray-900">Total Hours</h3>
              <p className="text-3xl font-bold text-blue-600">{getTotalHours()}</p>
            </div>
            <Clock className="h-8 w-8 text-blue-500" />
          </div>
        </div>

        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center">
            <div className="flex-1">
              <h3 className="text-lg font-medium text-gray-900">Today's Classes</h3>
              <p className="text-3xl font-bold text-green-600">{getTodayClasses().length}</p>
            </div>
            <CalendarDays className="h-8 w-8 text-green-500" />
          </div>
        </div>

        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center">
            <div className="flex-1">
              <h3 className="text-lg font-medium text-gray-900">Classes This Week</h3>
              <p className="text-3xl font-bold text-purple-600">{Object.values(schedule).flat().length}</p>
            </div>
            <Calendar className="h-8 w-8 text-purple-500" />
          </div>
        </div>

        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center">
            <div className="flex-1">
              <h3 className="text-lg font-medium text-gray-900">Subjects</h3>
              <p className="text-3xl font-bold text-orange-600">{subjects.length}</p>
            </div>
            <BookOpen className="h-8 w-8 text-orange-500" />
          </div>
        </div>
      </div>

      {/* Next Class Alert */}
      {upcomingClass && (
        <div className="bg-blue-50 border-l-4 border-blue-400 p-4 rounded-md">
          <div className="flex items-center">
            <Bell className="h-5 w-5 text-blue-400 mr-3" />
            <div className="flex-1">
              <h3 className="text-sm font-medium text-blue-800">Next Class</h3>
              <p className="text-sm text-blue-700">
                {upcomingClass.subject.name} with {upcomingClass.class.name} at {upcomingClass.timeSlot.startTime} in {upcomingClass.room}
              </p>
            </div>
            <div className="text-sm text-blue-600">
              <Timer className="h-4 w-4 inline mr-1" />
              {upcomingClass.timeSlot.startTime}
            </div>
          </div>
        </div>
      )}

      {/* View Toggle */}
      <div className="bg-white rounded-lg shadow p-6">
        <div className="flex items-center justify-between">
          <div className="flex space-x-4">
            <button
              onClick={() => setView('week')}
              className={`px-4 py-2 rounded-md text-sm font-medium ${
                view === 'week'
                  ? 'bg-blue-600 text-white'
                  : 'text-gray-700 hover:bg-gray-100'
              }`}
            >
              Week View
            </button>
            <button
              onClick={() => setView('day')}
              className={`px-4 py-2 rounded-md text-sm font-medium ${
                view === 'day'
                  ? 'bg-blue-600 text-white'
                  : 'text-gray-700 hover:bg-gray-100'
              }`}
            >
              Day View
            </button>
          </div>

          {view === 'week' && (
            <div className="flex items-center space-x-4">
              <button
                onClick={() => navigateWeek('prev')}
                className="p-2 hover:bg-gray-100 rounded-md"
              >
                <ChevronLeft className="h-5 w-5" />
              </button>
              <span className="text-sm font-medium text-gray-900">
                {weekDates[0].toLocaleDateString()} - {weekDates[4].toLocaleDateString()}
              </span>
              <button
                onClick={() => navigateWeek('next')}
                className="p-2 hover:bg-gray-100 rounded-md"
              >
                <ChevronRight className="h-5 w-5" />
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Schedule Grid - Week View */}
      {view === 'week' && (
        <div className="bg-white rounded-lg shadow overflow-hidden">
          <div className="grid grid-cols-6 gap-0">
            {/* Time column */}
            <div className="bg-gray-50 p-4 border-r border-gray-200">
              <div className="text-sm font-medium text-gray-900 mb-4">Time</div>
              {timeSlots.map(slot => (
                <div key={slot._id} className="h-16 border-b border-gray-100 py-2">
                  <div className="text-xs text-gray-600">
                    {slot.startTime}
                  </div>
                  <div className="text-xs text-gray-500">
                    {slot.endTime}
                  </div>
                </div>
              ))}
            </div>

            {/* Day columns */}
            {weekDays.map((day, index) => (
              <div key={day} className={`p-4 border-r border-gray-200 ${dayColors[day as keyof typeof dayColors]}`}>
                <div className="text-sm font-medium text-gray-900 mb-2">
                  {day}
                </div>
                <div className="text-xs text-gray-600 mb-4">
                  {weekDates[index].toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                </div>
                
                {timeSlots.map(slot => {
                  const entry = schedule[day]?.find(e => e.timeSlot._id === slot._id);
                  return (
                    <div key={slot._id} className="h-16 border-b border-gray-100 py-1">
                      {entry ? (
                        <div 
                          className={`p-2 rounded text-xs h-full ${typeColors[entry.type as keyof typeof typeColors]} border cursor-pointer hover:shadow-md transition-shadow`}
                          onClick={() => {
                            setEditingEntry(entry);
                            setScheduleForm({
                              day: entry.day,
                              timeSlotId: entry.timeSlot._id,
                              subjectId: entry.subject._id,
                              classId: entry.class._id,
                              room: entry.room,
                              type: entry.type,
                              notes: entry.notes || ''
                            });
                            setShowScheduleModal(true);
                          }}
                        >
                          <div className="font-medium truncate">{entry.subject.code}</div>
                          <div className="truncate text-gray-600">{entry.class.name}</div>
                          <div className="flex items-center mt-1">
                            <MapPin className="h-3 w-3 mr-1" />
                            <span className="truncate">{entry.room}</span>
                          </div>
                          {entry.status !== 'scheduled' && (
                            <div className={`inline-flex items-center px-1 py-0.5 rounded text-xs font-medium mt-1 ${statusColors[entry.status as keyof typeof statusColors]}`}>
                              {entry.status}
                            </div>
                          )}
                        </div>
                      ) : (
                        <div 
                          className="h-full border-2 border-dashed border-gray-300 rounded flex items-center justify-center cursor-pointer hover:border-blue-400 hover:bg-blue-50 transition-colors"
                          onClick={() => {
                            setScheduleForm({
                              ...scheduleForm,
                              day,
                              timeSlotId: slot._id
                            });
                            setShowScheduleModal(true);
                          }}
                        >
                          <Plus className="h-4 w-4 text-gray-400" />
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Schedule List - Day View */}
      {view === 'day' && (
        <div className="bg-white rounded-lg shadow">
          <div className="px-6 py-4 border-b border-gray-200">
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-medium text-gray-900">
                {selectedDate.toLocaleDateString('en-US', { 
                  weekday: 'long', 
                  year: 'numeric', 
                  month: 'long', 
                  day: 'numeric' 
                })}
              </h3>
              <input
                type="date"
                value={selectedDate.toISOString().split('T')[0]}
                onChange={(e) => setSelectedDate(new Date(e.target.value))}
                className="px-3 py-1 border border-gray-300 rounded-md text-sm"
              />
            </div>
          </div>

          <div className="p-6">
            {(() => {
              const dayName = selectedDate.toLocaleDateString('en-US', { weekday: 'long' });
              const daySchedule = schedule[dayName] || [];
              
              if (daySchedule.length === 0) {
                return (
                  <div className="text-center py-8">
                    <Calendar className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                    <h3 className="text-lg font-medium text-gray-900 mb-2">No Classes Scheduled</h3>
                    <p className="text-gray-600 mb-4">You don't have any classes scheduled for this day.</p>
                    <button
                      onClick={() => {
                        setScheduleForm({
                          ...scheduleForm,
                          day: dayName
                        });
                        setShowScheduleModal(true);
                      }}
                      className="inline-flex items-center px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
                    >
                      <Plus className="h-4 w-4 mr-2" />
                      Add Class
                    </button>
                  </div>
                );
              }

              return (
                <div className="space-y-4">
                  {daySchedule
                    .sort((a, b) => a.timeSlot.period - b.timeSlot.period)
                    .map(entry => (
                    <div key={entry._id} className="border border-gray-200 rounded-lg p-4 hover:shadow-md transition-shadow">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center space-x-4">
                          <div className="text-center">
                            <div className="text-sm font-medium text-gray-900">
                              {entry.timeSlot.startTime}
                            </div>
                            <div className="text-sm text-gray-500">
                              {entry.timeSlot.endTime}
                            </div>
                          </div>

                          <div className="flex-1">
                            <div className="flex items-center space-x-2">
                              <h4 className="text-lg font-medium text-gray-900">{entry.subject.name}</h4>
                              <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${typeColors[entry.type as keyof typeof typeColors]}`}>
                                {entry.type}
                              </span>
                              {entry.status !== 'scheduled' && (
                                <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${statusColors[entry.status as keyof typeof statusColors]}`}>
                                  {entry.status}
                                </span>
                              )}
                            </div>
                            <div className="flex items-center text-sm text-gray-600 mt-1">
                              <Users className="h-4 w-4 mr-1" />
                              <span className="mr-4">{entry.class.name}</span>
                              <Building className="h-4 w-4 mr-1" />
                              <span>{entry.room}</span>
                            </div>
                            {entry.notes && (
                              <p className="text-sm text-gray-600 mt-2">{entry.notes}</p>
                            )}
                          </div>
                        </div>

                        <div className="flex items-center space-x-2">
                          <button
                            onClick={() => {
                              setEditingEntry(entry);
                              setScheduleForm({
                                day: entry.day,
                                timeSlotId: entry.timeSlot._id,
                                subjectId: entry.subject._id,
                                classId: entry.class._id,
                                room: entry.room,
                                type: entry.type,
                                notes: entry.notes || ''
                              });
                              setShowScheduleModal(true);
                            }}
                            className="p-2 text-gray-400 hover:text-blue-600"
                          >
                            <Edit className="h-4 w-4" />
                          </button>
                          <button className="p-2 text-gray-400 hover:text-red-600">
                            <Trash2 className="h-4 w-4" />
                          </button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              );
            })()}
          </div>
        </div>
      )}

      {/* Schedule Modal */}
      {showScheduleModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg w-full max-w-md mx-4">
            <div className="px-6 py-4 border-b border-gray-200">
              <h3 className="text-lg font-medium text-gray-900">
                {editingEntry ? 'Edit Class' : 'Schedule New Class'}
              </h3>
            </div>

            <div className="p-6 space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Day</label>
                  <select
                    value={scheduleForm.day}
                    onChange={(e) => setScheduleForm(prev => ({...prev, day: e.target.value}))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="">Select Day</option>
                    {weekDays.map(day => (
                      <option key={day} value={day}>{day}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Time Slot</label>
                  <select
                    value={scheduleForm.timeSlotId}
                    onChange={(e) => setScheduleForm(prev => ({...prev, timeSlotId: e.target.value}))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="">Select Time</option>
                    {timeSlots.map(slot => (
                      <option key={slot._id} value={slot._id}>
                        {slot.startTime} - {slot.endTime}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Subject</label>
                <select
                  value={scheduleForm.subjectId}
                  onChange={(e) => setScheduleForm(prev => ({...prev, subjectId: e.target.value}))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="">Select Subject</option>
                  {subjects.map(subject => (
                    <option key={subject._id} value={subject._id}>
                      {subject.name} ({subject.code})
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Class</label>
                <select
                  value={scheduleForm.classId}
                  onChange={(e) => setScheduleForm(prev => ({...prev, classId: e.target.value}))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="">Select Class</option>
                  {classes.map(cls => (
                    <option key={cls._id} value={cls._id}>
                      {cls.name} ({cls.level})
                    </option>
                  ))}
                </select>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Room</label>
                  <input
                    type="text"
                    value={scheduleForm.room}
                    onChange={(e) => setScheduleForm(prev => ({...prev, room: e.target.value}))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="Room number"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Type</label>
                  <select
                    value={scheduleForm.type}
                    onChange={(e) => setScheduleForm(prev => ({...prev, type: e.target.value}))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="regular">Regular</option>
                    <option value="makeup">Makeup</option>
                    <option value="extra">Extra</option>
                    <option value="exam">Exam</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Notes</label>
                <textarea
                  rows={2}
                  value={scheduleForm.notes}
                  onChange={(e) => setScheduleForm(prev => ({...prev, notes: e.target.value}))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="Optional notes"
                />
              </div>
            </div>

            <div className="px-6 py-4 border-t border-gray-200 flex justify-end space-x-3">
              <button
                onClick={() => {
                  setShowScheduleModal(false);
                  resetScheduleForm();
                }}
                className="px-4 py-2 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50"
              >
                Cancel
              </button>
              <button
                onClick={handleScheduleSave}
                className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
              >
                {editingEntry ? 'Update' : 'Schedule'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Schedule;
