import React, { useEffect, useState } from 'react';
import { useAuth } from '../../../contexts/AuthContext';

type ClassItem = {
  _id: string;
  name: string;
  grade?: number;
  level?: string;
  academicYear?: string;
};

type StudentCompact = {
  id: string;
  rollNumber?: number;
  studentId?: string;
  section?: string;
  name?: string | null;
};

const MyClasses: React.FC = () => {
  const [classes, setClasses] = useState<ClassItem[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [studentsMap, setStudentsMap] = useState<Record<string, StudentCompact[]>>({});

  const { token } = useAuth();

  useEffect(() => {
    const fetchClasses = async () => {
      setLoading(true);
      setError(null);
      try {
        if (!token) {
          setError('Not authenticated');
          setLoading(false);
          return;
        }

        const res = await fetch('/api/teachers/me/classes', {
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${token}`
          }
        });
        const data = await res.json();
        if (!res.ok) throw new Error(data.message || 'Failed to load classes');
        setClasses(data.data.classes || []);
      } catch (err: any) {
        setError(err.message || 'An error occurred');
      } finally {
        setLoading(false);
      }
    };

    fetchClasses();
  }, [token]);

  const loadStudents = async (classId: string) => {
    if (studentsMap[classId]) return; // already loaded
    try {
      const res = await fetch(`/api/classes/${classId}/students/compact`, {
        headers: {
          'Content-Type': 'application/json',
          Authorization: token ? `Bearer ${token}` : ''
        }
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.message || 'Failed to load students');
      setStudentsMap(prev => ({ ...prev, [classId]: data.data.students || [] }));
    } catch (err: any) {
      setError(err.message || 'Failed to fetch students');
    }
  };

  return (
    <div>
      <h1 className="text-2xl font-bold">My Classes</h1>
      {loading && <p>Loading classes...</p>}
      {error && <p className="text-red-600">{error}</p>}
      {!loading && classes.length === 0 && <p>No classes assigned.</p>}
      <div className="grid grid-cols-1 gap-4 mt-4">
        {classes.map((c) => (
          <div key={c._id} className="p-4 border rounded">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="font-semibold">{c.name}</h2>
                <div className="text-sm text-gray-600">{c.level} • Grade {c.grade} • {c.academicYear}</div>
              </div>
              <div>
                <button
                  onClick={() => loadStudents(c._id)}
                  className="px-3 py-1 bg-blue-600 text-white rounded"
                >
                  View Students
                </button>
              </div>
            </div>

            {studentsMap[c._id] && (
              <div className="mt-3">
                <h3 className="text-sm font-medium">Students</h3>
                <ul className="mt-2 space-y-1">
                  {studentsMap[c._id].map(s => (
                    <li key={s.id} className="flex justify-between">
                      <span>{s.name || 'Unknown'}</span>
                      <span className="text-sm text-gray-500">#{s.rollNumber} • {s.section}</span>
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
};

export default MyClasses;
