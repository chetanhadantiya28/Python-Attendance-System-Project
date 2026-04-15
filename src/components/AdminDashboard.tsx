import React from 'react';
import { Link } from 'react-router-dom';
import { api } from '../api';
import { BarChart3, Users, BookOpen, GraduationCap, AlertTriangle, ArrowRight, Settings } from 'lucide-react';

export default function AdminDashboard() {
  const [analytics, setAnalytics] = React.useState<any>(null);
  const [loading, setLoading] = React.useState(true);
  const [error, setError] = React.useState('');

  React.useEffect(() => {
    api.getAnalytics()
      .then(data => {
        if (data && typeof data.totalStudents !== 'undefined') {
          setAnalytics(data);
        } else {
          setError(data.message || 'Failed to load analytics');
        }
      })
      .catch(err => {
        console.error('Analytics fetch error:', err);
        setError('An unexpected error occurred while fetching analytics.');
      })
      .finally(() => {
        setLoading(false);
      });
  }, []);

  if (loading) return (
    <div className="flex flex-col items-center justify-center h-full space-y-4">
      <div className="w-12 h-12 border-4 border-blue-600 border-t-transparent rounded-full animate-spin"></div>
      <p className="text-slate-500 font-medium">Loading analytics...</p>
    </div>
  );

  const stats = [
    { name: 'Total Students', value: analytics?.totalStudents || 0, icon: Users, color: 'text-blue-600', bg: 'bg-blue-50', path: '/admin/students' },
    { name: 'Total Faculty', value: analytics?.totalFaculty || 0, icon: GraduationCap, color: 'text-emerald-600', bg: 'bg-emerald-50', path: '/admin/faculty' },
    { name: 'Total Courses', value: analytics?.totalCourses || 0, icon: BookOpen, color: 'text-purple-600', bg: 'bg-purple-50', path: '/admin/courses' },
    { name: 'Total Subjects', value: analytics?.totalSubjects || 0, icon: BarChart3, color: 'text-orange-600', bg: 'bg-orange-50', path: '/admin/subjects' },
  ];

  return (
    <div className="space-y-10">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-slate-900 mb-2">Admin Overview</h1>
          <p className="text-slate-500">System-wide analytics and management</p>
        </div>
        <div className="flex items-center gap-2 text-sm font-medium text-slate-400 bg-slate-50 px-4 py-2 rounded-xl border border-slate-100">
          <Settings size={16} />
          <span>Last updated: {new Date().toLocaleTimeString()}</span>
        </div>
      </div>

      {error && (
        <div className="bg-red-50 border border-red-100 p-4 rounded-2xl flex items-center gap-3 text-red-600">
          <AlertTriangle size={20} />
          <p className="font-medium">Note: {error}. Showing navigation only.</p>
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {stats.map((stat, index) => (
          <div
            key={stat.name}
            className="bg-white p-6 rounded-3xl border border-slate-100 shadow-sm hover:shadow-md transition-shadow"
          >
            <div className={`w-12 h-12 ${stat.bg} ${stat.color} rounded-2xl flex items-center justify-center mb-4`}>
              <stat.icon size={24} />
            </div>
            <p className="text-slate-500 text-sm font-medium">{stat.name}</p>
            <p className="text-3xl font-bold text-slate-900">{stat.value}</p>
          </div>
        ))}
      </div>

      <div>
        <h2 className="text-xl font-bold text-slate-900 mb-6 flex items-center gap-2">
          Quick Management Access
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {stats.map((stat, index) => (
            <Link 
              key={`nav-${stat.name}`}
              to={stat.path}
              className="group bg-white p-8 rounded-3xl border border-slate-100 shadow-sm hover:border-blue-200 hover:shadow-lg transition-all flex items-center justify-between"
            >
              <div className="flex items-center gap-6">
                <div className={`w-16 h-16 ${stat.bg} ${stat.color} rounded-2xl flex items-center justify-center group-hover:scale-110 transition-transform`}>
                  <stat.icon size={32} />
                </div>
                <div>
                  <h3 className="text-xl font-bold text-slate-900">Manage {stat.name.split(' ')[1]}</h3>
                  <p className="text-slate-500 font-medium">Add, edit or remove {stat.name.split(' ')[1].toLowerCase()}</p>
                </div>
              </div>
              <div className="w-10 h-10 rounded-full bg-slate-50 flex items-center justify-center group-hover:bg-blue-600 group-hover:text-white transition-colors">
                <ArrowRight size={20} />
              </div>
            </Link>
          ))}
        </div>
      </div>
    </div>
  );
}

