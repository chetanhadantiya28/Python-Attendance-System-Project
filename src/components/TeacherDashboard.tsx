import React from 'react';
import { api } from '../api';
import { Subject, Student } from '../types';
import { BookOpen, Users, Calendar, CheckCircle2, XCircle, Download, ChevronRight } from 'lucide-react';
import { format } from 'date-fns';

export default function TeacherDashboard() {
  const [subjects, setSubjects] = React.useState<Subject[]>([]);
  const [selectedSubject, setSelectedSubject] = React.useState<Subject | null>(null);
  const [students, setStudents] = React.useState<Student[]>([]);
  const [attendance, setAttendance] = React.useState<Record<number, boolean>>({});
  const [isClassHeld, setIsClassHeld] = React.useState(true);
  const [loading, setLoading] = React.useState(true);
  const [error, setError] = React.useState('');
  const [submitting, setSubmitting] = React.useState(false);
  const [message, setMessage] = React.useState({ type: '', text: '' });
  const [showReport, setShowReport] = React.useState(false);

  React.useEffect(() => {
    api.getTeacherSubjects()
      .then(data => {
        if (Array.isArray(data)) {
          setSubjects(data);
        } else {
          setError(data.message || 'Failed to load subjects');
        }
      })
      .catch(err => {
        console.error('Teacher subjects fetch error:', err);
        setError('An unexpected error occurred while fetching your subjects.');
      })
      .finally(() => {
        setLoading(false);
      });
  }, []);

  const handleSelectSubject = async (subject: Subject) => {
    setSelectedSubject(subject);
    const data = await api.getSubjectStudents(subject.subject_id);
    setStudents(data);
    // Initialize all students as present
    const initial: Record<number, boolean> = {};
    data.forEach((s: Student) => initial[s.student_id] = true);
    setAttendance(initial);
    setMessage({ type: '', text: '' });
  };

  const toggleAttendance = (studentId: number) => {
    setAttendance(prev => ({ ...prev, [studentId]: !prev[studentId] }));
  };

  const handleSubmit = async () => {
    if (!selectedSubject) return;
    setSubmitting(true);
    setMessage({ type: '', text: '' });

    const attendance_data = students.map(s => ({
      student_id: s.student_id,
      status: attendance[s.student_id] ? 'Present' : 'Absent'
    }));

    try {
      await api.markAttendance({
        subject_id: selectedSubject.subject_id,
        date: format(new Date(), 'yyyy-MM-dd'),
        attendance_data,
        is_class_held: isClassHeld
      });
      setMessage({ type: 'success', text: 'Attendance marked successfully!' });
      // Reset after success
      setTimeout(() => {
        setSelectedSubject(null);
        setStudents([]);
      }, 2000);
    } catch (err: any) {
      setMessage({ type: 'error', text: err.message });
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) return (
    <div className="flex flex-col items-center justify-center h-full space-y-4">
      <div className="w-12 h-12 border-4 border-blue-600 border-t-transparent rounded-full animate-spin"></div>
      <p className="text-slate-500 font-medium">Loading your subjects...</p>
    </div>
  );

  if (error) return (
    <div className="flex flex-col items-center justify-center h-full p-6 text-center">
      <div className="w-16 h-16 bg-red-50 text-red-600 rounded-2xl flex items-center justify-center mb-4">
        <BookOpen size={32} />
      </div>
      <h2 className="text-xl font-bold text-slate-900 mb-2">Teacher Dashboard Error</h2>
      <p className="text-slate-500 max-w-md mb-6">{error}</p>
      <button 
        onClick={() => window.location.reload()}
        className="px-6 py-2 bg-blue-600 text-white font-bold rounded-xl hover:bg-blue-700 transition-all"
      >
        Try Again
      </button>
    </div>
  );

  return (
    <div className="space-y-8 max-w-6xl mx-auto">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-slate-900 mb-2">Faculty Dashboard</h1>
          <p className="text-slate-500">Manage attendance and generate detailed reports</p>
        </div>
        <div className="flex gap-3">
          <button 
            onClick={() => { setSelectedSubject(null); setShowReport(false); }}
            className={`px-4 py-2 rounded-xl font-bold transition-all ${!selectedSubject && !showReport ? 'bg-blue-600 text-white shadow-lg shadow-blue-200' : 'bg-white text-slate-600 border border-slate-200 hover:bg-slate-50'}`}
          >
            Mark Attendance
          </button>
          <button 
            onClick={() => setShowReport(true)}
            className={`px-4 py-2 rounded-xl font-bold transition-all ${showReport ? 'bg-blue-600 text-white shadow-lg shadow-blue-200' : 'bg-white text-slate-600 border border-slate-200 hover:bg-slate-50'}`}
          >
            Detailed Reports
          </button>
        </div>
      </div>

      {showReport ? (
        <DetailedReport subjects={subjects} onClose={() => setShowReport(false)} />
      ) : !selectedSubject ? (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {subjects.map((sub) => (
            <button
              key={sub.subject_id}
              onClick={() => handleSelectSubject(sub)}
              className="bg-white p-8 rounded-3xl border border-slate-100 shadow-sm text-left flex items-center justify-between group"
            >
              <div className="flex items-center gap-6">
                <div className="w-16 h-16 bg-blue-50 text-blue-600 rounded-2xl flex items-center justify-center group-hover:bg-blue-600 group-hover:text-white transition-colors">
                  <BookOpen size={32} />
                </div>
                <div>
                  <h3 className="text-xl font-bold text-slate-900">{sub.subject_name}</h3>
                  <p className="text-slate-500 font-medium">{sub.course_name} • Semester {sub.semester}</p>
                </div>
              </div>
              <ChevronRight className="text-slate-300 group-hover:text-blue-600 transition-colors" size={24} />
            </button>
          ))}
          {subjects.length === 0 && (
            <div className="col-span-full bg-white p-12 rounded-3xl border border-dashed border-slate-200 text-center">
              <p className="text-slate-400 italic">No subjects assigned yet.</p>
            </div>
          )}
        </div>
      ) : (
        <div 
          className="bg-white rounded-3xl border border-slate-100 shadow-lg overflow-hidden"
        >
          <div className="p-8 border-b border-slate-100 bg-slate-50/50 flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div>
              <button 
                onClick={() => setSelectedSubject(null)}
                className="text-blue-600 font-semibold text-sm mb-2 hover:underline flex items-center gap-1"
              >
                ← Back to Subjects
              </button>
              <h2 className="text-2xl font-bold text-slate-900">{selectedSubject.subject_name}</h2>
              <p className="text-slate-500 font-medium flex items-center gap-2">
                <Calendar size={16} /> {format(new Date(), 'MMMM do, yyyy')}
              </p>
            </div>
            <div className="flex items-center gap-3">
              <button
                onClick={() => api.exportAttendance(selectedSubject.subject_id, selectedSubject.subject_name)}
                className="flex items-center gap-2 px-4 py-2.5 bg-white border border-slate-200 text-slate-700 font-bold rounded-xl hover:bg-slate-50 transition-all shadow-sm"
              >
                <Download size={18} /> Export Excel
              </button>
            </div>
          </div>

          <div className="p-8">
            <div className="flex items-center justify-between mb-8 p-4 bg-blue-50 rounded-2xl border border-blue-100">
              <div className="flex items-center gap-3">
                <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${isClassHeld ? 'bg-blue-600 text-white' : 'bg-slate-200 text-slate-500'}`}>
                  <Calendar size={20} />
                </div>
                <div>
                  <p className="font-bold text-slate-900">Class Status</p>
                  <p className="text-sm text-slate-500">{isClassHeld ? 'Class is being held today' : 'Marked as No Class Day'}</p>
                </div>
              </div>
              <button
                onClick={() => setIsClassHeld(!isClassHeld)}
                className={`px-6 py-2 rounded-xl font-bold transition-all ${
                  isClassHeld 
                  ? 'bg-white text-blue-600 border border-blue-200 shadow-sm hover:bg-blue-50' 
                  : 'bg-blue-600 text-white shadow-lg shadow-blue-200'
                }`}
              >
                {isClassHeld ? 'Mark No Class' : 'Mark Class Held'}
              </button>
            </div>

            {isClassHeld && (
              <div className="space-y-4 mb-8">
                <div className="flex items-center justify-between text-sm font-bold text-slate-400 uppercase tracking-wider px-4">
                  <span>Student Details</span>
                  <span>Attendance Status</span>
                </div>
                <div className="grid gap-3">
                  {students.map((student) => (
                    <div 
                      key={student.student_id}
                      onClick={() => toggleAttendance(student.student_id)}
                      className={`flex items-center justify-between p-4 rounded-2xl border transition-all cursor-pointer ${
                        attendance[student.student_id] 
                        ? 'bg-emerald-50 border-emerald-100' 
                        : 'bg-red-50 border-red-100'
                      }`}
                    >
                      <div className="flex items-center gap-4">
                        <div className={`min-w-[2.5rem] h-10 px-2 rounded-xl flex items-center justify-center font-bold ${
                          attendance[student.student_id] ? 'bg-emerald-200 text-emerald-700' : 'bg-red-200 text-red-700'
                        }`}>
                          {student.roll_number}
                        </div>
                        <div>
                          <p className="font-bold text-slate-900">{student.name}</p>
                          <p className="text-xs text-slate-500">{student.email}</p>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        {attendance[student.student_id] ? (
                          <div className="flex items-center gap-1.5 text-emerald-600 font-bold">
                            <CheckCircle2 size={20} />
                            <span>Present</span>
                          </div>
                        ) : (
                          <div className="flex items-center gap-1.5 text-red-600 font-bold">
                            <XCircle size={20} />
                            <span>Absent</span>
                          </div>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

              {message.text && (
                <div
                  className={`mb-6 p-4 rounded-xl text-center font-bold ${
                    message.type === 'success' ? 'bg-emerald-100 text-emerald-700' : 'bg-red-100 text-red-700'
                  }`}
                >
                  {message.text}
                </div>
              )}

            <button
              onClick={handleSubmit}
              disabled={submitting}
              className="w-full bg-slate-900 hover:bg-slate-800 text-white font-bold py-5 rounded-2xl shadow-xl transition-all active:scale-[0.99] disabled:opacity-50"
            >
              {submitting ? 'Submitting...' : 'Submit Attendance Report'}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

function DetailedReport({ subjects, onClose }: { subjects: Subject[], onClose: () => void }) {
  const [subjectId, setSubjectId] = React.useState('');
  const [fromDate, setFromDate] = React.useState(format(new Date(), 'yyyy-MM-01'));
  const [toDate, setToDate] = React.useState(format(new Date(), 'yyyy-MM-dd'));
  const [minPercentage, setMinPercentage] = React.useState('');
  const [report, setReport] = React.useState<any[]>([]);
  const [loading, setLoading] = React.useState(false);

  const fetchReport = async () => {
    if (!subjectId) return;
    setLoading(true);
    try {
      const data = await api.getDetailedReport({
        subject_id: subjectId,
        from_date: fromDate,
        to_date: toDate,
        min_percentage: minPercentage
      });
      setReport(data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleExport = () => {
    const sub = subjects.find(s => s.subject_id === Number(subjectId));
    api.exportDetailedReport(report, sub?.subject_name || 'Report');
  };

  return (
    <div className="space-y-6">
      <div className="bg-white p-6 rounded-3xl border border-slate-100 shadow-sm space-y-4">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div className="space-y-1">
            <label className="text-xs font-bold text-slate-500 uppercase">Subject</label>
            <select 
              value={subjectId} 
              onChange={e => setSubjectId(e.target.value)}
              className="w-full px-4 py-2 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500/20 outline-none"
            >
              <option value="">Select Subject</option>
              {subjects.map(s => <option key={s.subject_id} value={s.subject_id}>{s.subject_name}</option>)}
            </select>
          </div>
          <div className="space-y-1">
            <label className="text-xs font-bold text-slate-500 uppercase">From Date</label>
            <input 
              type="date" value={fromDate} onChange={e => setFromDate(e.target.value)}
              className="w-full px-4 py-2 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500/20 outline-none"
            />
          </div>
          <div className="space-y-1">
            <label className="text-xs font-bold text-slate-500 uppercase">To Date</label>
            <input 
              type="date" value={toDate} onChange={e => setToDate(e.target.value)}
              className="w-full px-4 py-2 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500/20 outline-none"
            />
          </div>
          <div className="space-y-1">
            <label className="text-xs font-bold text-slate-500 uppercase">Min % (Optional)</label>
            <input 
              type="number" placeholder="e.g. 75" value={minPercentage} onChange={e => setMinPercentage(e.target.value)}
              className="w-full px-4 py-2 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500/20 outline-none"
            />
          </div>
        </div>
        <div className="flex justify-end gap-3">
          <button 
            onClick={fetchReport}
            className="bg-blue-600 text-white px-6 py-2 rounded-xl font-bold hover:bg-blue-700 transition-all shadow-lg shadow-blue-200"
          >
            Generate Report
          </button>
          {report.length > 0 && (
            <button 
              onClick={handleExport}
              className="bg-emerald-600 text-white px-6 py-2 rounded-xl font-bold hover:bg-emerald-700 transition-all shadow-lg shadow-emerald-200 flex items-center gap-2"
            >
              <Download size={18} /> Export to Excel
            </button>
          )}
        </div>
      </div>

      {loading ? (
        <div className="flex justify-center py-12"><div className="w-8 h-8 border-4 border-blue-600 border-t-transparent rounded-full animate-spin"></div></div>
      ) : report.length > 0 ? (
        <div className="bg-white rounded-3xl border border-slate-100 shadow-sm overflow-hidden">
          <table className="w-full text-left">
            <thead>
              <tr className="bg-slate-50 text-slate-500 text-xs font-bold uppercase tracking-wider">
                <th className="px-6 py-4">Roll No</th>
                <th className="px-6 py-4">Name</th>
                <th className="px-6 py-4">Total Classes</th>
                <th className="px-6 py-4">Present</th>
                <th className="px-6 py-4">Percentage</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {report.map((r, i) => (
                <tr key={i} className="hover:bg-slate-50 transition-colors">
                  <td className="px-6 py-4 font-bold text-slate-900">{r.roll_number}</td>
                  <td className="px-6 py-4">
                    <p className="font-bold text-slate-900">{r.name}</p>
                    <p className="text-xs text-slate-500">{r.email}</p>
                  </td>
                  <td className="px-6 py-4 text-slate-600">{r.totalClasses}</td>
                  <td className="px-6 py-4 text-emerald-600 font-bold">{r.presentCount}</td>
                  <td className="px-6 py-4">
                    <span className={`font-bold ${parseFloat(r.percentage) < 75 ? 'text-red-600' : 'text-emerald-600'}`}>
                      {r.percentage}%
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ) : null}
    </div>
  );
}
