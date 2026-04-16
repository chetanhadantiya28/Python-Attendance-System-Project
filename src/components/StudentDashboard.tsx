import React from 'react';
import { api } from '../api';
import { AttendanceReport } from '../types';
import { ClipboardCheck, BookOpen, AlertCircle, CheckCircle2 } from 'lucide-react';

export default function StudentDashboard() {
  const [reports, setReports] = React.useState<AttendanceReport[]>([]);
  const [loading, setLoading] = React.useState(true);
  const [error, setError] = React.useState('');

  React.useEffect(() => {
    api.getStudentAttendance()
      .then(data => {
        if (Array.isArray(data)) {
          setReports(data);
        } else {
          setError('Failed to load attendance data');
        }
      })
      .catch(err => {
        console.error('Attendance fetch error:', err);
        setError('An unexpected error occurred while fetching attendance.');
      })
      .finally(() => {
        setLoading(false);
      });
  }, []);

  if (loading) return (
    <div className="flex flex-col items-center justify-center h-full space-y-4">
      <div className="w-12 h-12 border-4 border-blue-600 border-t-transparent rounded-full animate-spin"></div>
      <p className="text-slate-500 font-medium">Loading your attendance...</p>
    </div>
  );

  if (error) return (
    <div className="flex flex-col items-center justify-center h-full p-6 text-center">
      <div className="w-16 h-16 bg-red-50 text-red-600 rounded-2xl flex items-center justify-center mb-4">
        <AlertCircle size={32} />
      </div>
      <h2 className="text-xl font-bold text-slate-900 mb-2">Oops! Something went wrong</h2>
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
    <div className="space-y-8 max-w-4xl mx-auto">
      <div>
        <h1 className="text-3xl font-bold text-slate-900 mb-2">My Attendance</h1>
        <p className="text-slate-500">Track your subject-wise attendance performance</p>
      </div>

      <div className="grid grid-cols-1 gap-6">
        {reports.map((report, i) => {
          const percentage = parseFloat(report.percentage);
          const isLow = percentage < 75;

          return (
            <div
              key={report.subject_id}
              className="bg-white p-8 rounded-3xl border border-slate-100 shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-6"
            >
              <div className="flex items-center gap-6">
                <div className={`w-16 h-16 rounded-2xl flex items-center justify-center ${isLow ? 'bg-red-50 text-red-600' : 'bg-emerald-50 text-emerald-600'}`}>
                  <BookOpen size={32} />
                </div>
                <div>
                  <h3 className="text-xl font-bold text-slate-900">{report.subject_name}</h3>
                  <div className="flex items-center gap-4 mt-1">
                    <p className="text-slate-500 text-sm font-medium">
                      Classes: <span className="text-slate-900">{report.presentCount} / {report.totalClasses}</span>
                    </p>
                    {isLow ? (
                      <div className="flex items-center gap-1 text-red-600 text-xs font-bold uppercase tracking-wider">
                        <AlertCircle size={14} /> Low Attendance
                      </div>
                    ) : (
                      <div className="flex items-center gap-1 text-emerald-600 text-xs font-bold uppercase tracking-wider">
                        <CheckCircle2 size={14} /> Good Standing
                      </div>
                    )}
                  </div>
                </div>
              </div>

              <div className="flex flex-col items-end">
                <div className="relative w-32 h-2 bg-slate-100 rounded-full overflow-hidden mb-2">
                  <div 
                    style={{ width: `${percentage}%` }}
                    className={`h-full rounded-full ${isLow ? 'bg-red-500' : 'bg-emerald-500'}`}
                  />
                </div>
                <p className={`text-3xl font-black ${isLow ? 'text-red-600' : 'text-emerald-600'}`}>
                  {report.percentage}%
                </p>
              </div>
            </div>
          );
        })}
        {reports.length === 0 && (
          <div className="bg-white p-12 rounded-3xl border border-dashed border-slate-200 text-center">
            <p className="text-slate-400 italic">No attendance records found yet.</p>
          </div>
        )}
      </div>
    </div>
  );
}
