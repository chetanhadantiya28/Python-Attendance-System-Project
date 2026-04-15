import React from 'react';
import { api } from '../api';
import { Course, Faculty, Student, Subject } from '../types';
import { Plus, Trash2, UserPlus, BookOpen, GraduationCap, Users, Edit2, X, Check } from 'lucide-react';

export function ManageCourses() {
  const [courses, setCourses] = React.useState<Course[]>([]);
  const [name, setName] = React.useState('');

  const load = () => api.getCourses().then(setCourses);
  React.useEffect(() => { load(); }, []);

  const handleAdd = async (e: React.FormEvent) => {
    e.preventDefault();
    await api.addCourse({ course_name: name });
    setName('');
    load();
  };

  const handleDelete = async (id: number) => {
    if (window.confirm('Are you sure you want to delete this course? This will also delete all subjects and attendance records associated with it.')) {
      try {
        const res = await api.deleteCourse(id);
        if (res.message) throw new Error(res.message);
        load();
      } catch (error: any) {
        alert(error.message || 'Failed to delete course');
      }
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-slate-900">Manage Courses</h1>
      </div>

      <form onSubmit={handleAdd} className="bg-white p-6 rounded-2xl border border-slate-100 shadow-sm flex gap-4">
        <input
          type="text"
          required
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder="Enter Course Name (e.g. B.Tech CS)"
          className="flex-1 px-4 py-2 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500/20"
        />
        <button type="submit" className="bg-blue-600 text-white px-6 py-2 rounded-xl font-bold flex items-center gap-2 hover:bg-blue-700 transition-all">
          <Plus size={20} /> Add Course
        </button>
      </form>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {courses.map((course) => (
          <div key={course.course_id} className="bg-white p-6 rounded-2xl border border-slate-100 shadow-sm flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-blue-50 text-blue-600 rounded-lg flex items-center justify-center">
                <BookOpen size={20} />
              </div>
              <span className="font-bold text-slate-900">{course.course_name}</span>
            </div>
            <button 
              onClick={() => handleDelete(course.course_id)}
              className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors"
            >
              <Trash2 size={18} />
            </button>
          </div>
        ))}
      </div>
    </div>
  );
}

export function ManageFaculty() {
  const [faculty, setFaculty] = React.useState<Faculty[]>([]);
  const [form, setForm] = React.useState({ name: '', email: '', password: '' });
  const [editingId, setEditingId] = React.useState<number | null>(null);

  const load = () => api.getFaculty().then(setFaculty);
  React.useEffect(() => { load(); }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (editingId) {
      await api.updateFaculty(editingId, form);
      setEditingId(null);
    } else {
      await api.addFaculty(form);
    }
    setForm({ name: '', email: '', password: '' });
    load();
  };

  const handleEdit = (f: Faculty) => {
    setEditingId(f.faculty_id);
    setForm({ name: f.name, email: f.email, password: '' });
  };

  const handleDelete = async (id: number) => {
    if (window.confirm('Are you sure you want to delete this faculty member?')) {
      try {
        const res = await api.deleteFaculty(id);
        if (res.message) throw new Error(res.message);
        load();
      } catch (error: any) {
        alert(error.message || 'Failed to delete faculty');
      }
    }
  };

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold text-slate-900">Manage Faculty</h1>
      <form onSubmit={handleSubmit} className="bg-white p-6 rounded-2xl border border-slate-100 shadow-sm grid grid-cols-1 md:grid-cols-4 gap-4">
        <input
          type="text" required placeholder="Name" value={form.name}
          onChange={e => setForm({...form, name: e.target.value})}
          className="px-4 py-2 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500/20"
        />
        <input
          type="email" required placeholder="Email" value={form.email}
          onChange={e => setForm({...form, email: e.target.value})}
          className="px-4 py-2 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500/20"
        />
        <input
          type="password" placeholder={editingId ? "New Password (optional)" : "Password"} required={!editingId} value={form.password}
          onChange={e => setForm({...form, password: e.target.value})}
          className="px-4 py-2 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500/20"
        />
        <div className="flex gap-2">
          <button type="submit" className="flex-1 bg-blue-600 text-white px-4 py-2 rounded-xl font-bold flex items-center justify-center gap-2 hover:bg-blue-700 transition-all">
            {editingId ? <Check size={20} /> : <UserPlus size={20} />}
            {editingId ? 'Update' : 'Add Faculty'}
          </button>
          {editingId && (
            <button 
              type="button" 
              onClick={() => { setEditingId(null); setForm({ name: '', email: '', password: '' }); }}
              className="bg-slate-100 text-slate-600 px-4 py-2 rounded-xl font-bold hover:bg-slate-200 transition-all"
            >
              <X size={20} />
            </button>
          )}
        </div>
      </form>

      <div className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden">
        <table className="w-full text-left">
          <thead className="bg-slate-50 text-slate-500 text-xs font-bold uppercase tracking-wider">
            <tr>
              <th className="px-6 py-4">Name</th>
              <th className="px-6 py-4">Email</th>
              <th className="px-6 py-4 text-right">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {faculty.map((f) => (
              <tr key={f.faculty_id}>
                <td className="px-6 py-4 font-bold text-slate-900">{f.name}</td>
                <td className="px-6 py-4 text-slate-500">{f.email}</td>
                <td className="px-6 py-4 text-right">
                  <div className="flex justify-end gap-2">
                    <button onClick={() => handleEdit(f)} className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors">
                      <Edit2 size={18} />
                    </button>
                    <button onClick={() => handleDelete(f.faculty_id)} className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors">
                      <Trash2 size={18} />
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

export function ManageStudents() {
  const [students, setStudents] = React.useState<Student[]>([]);
  const [courses, setCourses] = React.useState<Course[]>([]);
  const [form, setForm] = React.useState({ roll_number: '', name: '', email: '', password: '', course_id: '', semester: '' });
  const [editingId, setEditingId] = React.useState<number | null>(null);

  const load = () => {
    api.getStudents().then(setStudents);
    api.getCourses().then(setCourses);
  };
  React.useEffect(() => { load(); }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (editingId) {
      await api.updateStudent(editingId, form);
      setEditingId(null);
    } else {
      await api.addStudent(form);
    }
    setForm({ roll_number: '', name: '', email: '', password: '', course_id: '', semester: '' });
    load();
  };

  const handleEdit = (s: Student) => {
    setEditingId(s.student_id);
    setForm({ 
      roll_number: s.roll_number, 
      name: s.name, 
      email: s.email, 
      password: '', 
      course_id: s.course_id.toString(), 
      semester: s.semester.toString() 
    });
  };

  const handleDelete = async (id: number) => {
    if (window.confirm('Are you sure you want to delete this student?')) {
      try {
        const res = await api.deleteStudent(id);
        if (res.message) throw new Error(res.message);
        load();
      } catch (error: any) {
        alert(error.message || 'Failed to delete student');
      }
    }
  };

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold text-slate-900">Manage Students</h1>
      <form onSubmit={handleSubmit} className="bg-white p-6 rounded-2xl border border-slate-100 shadow-sm grid grid-cols-1 md:grid-cols-3 lg:grid-cols-7 gap-4">
        <input
          type="text" required placeholder="Roll Number" value={form.roll_number}
          onChange={e => setForm({...form, roll_number: e.target.value})}
          className="px-4 py-2 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500/20"
        />
        <input
          type="text" required placeholder="Name" value={form.name}
          onChange={e => setForm({...form, name: e.target.value})}
          className="px-4 py-2 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500/20"
        />
        <input
          type="email" required placeholder="Email" value={form.email}
          onChange={e => setForm({...form, email: e.target.value})}
          className="px-4 py-2 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500/20"
        />
        <input
          type="password" placeholder={editingId ? "New Password (optional)" : "Password"} required={!editingId} value={form.password}
          onChange={e => setForm({...form, password: e.target.value})}
          className="px-4 py-2 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500/20"
        />
        <select
          required value={form.course_id}
          onChange={e => setForm({...form, course_id: e.target.value})}
          className="px-4 py-2 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500/20"
        >
          <option value="">Course</option>
          {courses.map(c => <option key={c.course_id} value={c.course_id}>{c.course_name}</option>)}
        </select>
        <select
          required value={form.semester}
          onChange={e => setForm({...form, semester: e.target.value})}
          className="px-4 py-2 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500/20"
        >
          <option value="">Semester</option>
          {[1,2,3,4,5,6,7,8].map(s => <option key={s} value={s}>{s}</option>)}
        </select>
        <div className="flex gap-2">
          <button type="submit" className="flex-1 bg-blue-600 text-white px-4 py-2 rounded-xl font-bold flex items-center justify-center gap-2 hover:bg-blue-700 transition-all">
            {editingId ? <Check size={20} /> : <Plus size={20} />}
            {editingId ? 'Update' : 'Add Student'}
          </button>
          {editingId && (
            <button 
              type="button" 
              onClick={() => { setEditingId(null); setForm({ roll_number: '', name: '', email: '', password: '', course_id: '', semester: '' }); }}
              className="bg-slate-100 text-slate-600 px-4 py-2 rounded-xl font-bold hover:bg-slate-200 transition-all"
            >
              <X size={20} />
            </button>
          )}
        </div>
      </form>

      <div className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden">
        <table className="w-full text-left">
          <thead className="bg-slate-50 text-slate-500 text-xs font-bold uppercase tracking-wider">
            <tr>
              <th className="px-6 py-4">Roll No</th>
              <th className="px-6 py-4">Name</th>
              <th className="px-6 py-4">Course</th>
              <th className="px-6 py-4">Semester</th>
              <th className="px-6 py-4 text-right">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {students.map((s) => (
              <tr key={s.student_id}>
                <td className="px-6 py-4 font-bold text-slate-900">{s.roll_number}</td>
                <td className="px-6 py-4">
                  <p className="font-bold text-slate-900">{s.name}</p>
                  <p className="text-xs text-slate-500">{s.email}</p>
                </td>
                <td className="px-6 py-4 text-slate-600">{s.course_name}</td>
                <td className="px-6 py-4 text-slate-600">{s.semester}</td>
                <td className="px-6 py-4 text-right">
                  <div className="flex justify-end gap-2">
                    <button onClick={() => handleEdit(s)} className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors">
                      <Edit2 size={18} />
                    </button>
                    <button onClick={() => handleDelete(s.student_id)} className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors">
                      <Trash2 size={18} />
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

export function ManageSubjects() {
  const [subjects, setSubjects] = React.useState<Subject[]>([]);
  const [courses, setCourses] = React.useState<Course[]>([]);
  const [faculty, setFaculty] = React.useState<Faculty[]>([]);
  const [form, setForm] = React.useState({ subject_name: '', course_id: '', semester: '', faculty_id: '' });
  const [editingId, setEditingId] = React.useState<number | null>(null);

  const load = () => {
    api.getSubjects().then(setSubjects);
    api.getCourses().then(setCourses);
    api.getFaculty().then(setFaculty);
  };
  React.useEffect(() => { load(); }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (editingId) {
      await api.updateSubject(editingId, form);
      setEditingId(null);
    } else {
      await api.addSubject(form);
    }
    setForm({ subject_name: '', course_id: '', semester: '', faculty_id: '' });
    load();
  };

  const handleEdit = (s: Subject) => {
    setEditingId(s.subject_id);
    setForm({ 
      subject_name: s.subject_name, 
      course_id: s.course_id.toString(), 
      semester: s.semester.toString(), 
      faculty_id: s.faculty_id.toString() 
    });
  };

  const handleDelete = async (id: number) => {
    if (window.confirm('Are you sure you want to delete this subject?')) {
      try {
        const res = await api.deleteSubject(id);
        if (res.message) throw new Error(res.message);
        load();
      } catch (error: any) {
        alert(error.message || 'Failed to delete subject');
      }
    }
  };

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold text-slate-900">Manage Subjects</h1>
      <form onSubmit={handleSubmit} className="bg-white p-6 rounded-2xl border border-slate-100 shadow-sm grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
        <input
          type="text" required placeholder="Subject Name" value={form.subject_name}
          onChange={e => setForm({...form, subject_name: e.target.value})}
          className="px-4 py-2 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500/20"
        />
        <select
          required value={form.course_id}
          onChange={e => setForm({...form, course_id: e.target.value})}
          className="px-4 py-2 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500/20"
        >
          <option value="">Course</option>
          {courses.map(c => <option key={c.course_id} value={c.course_id}>{c.course_name}</option>)}
        </select>
        <select
          required value={form.semester}
          onChange={e => setForm({...form, semester: e.target.value})}
          className="px-4 py-2 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500/20"
        >
          <option value="">Semester</option>
          {[1,2,3,4,5,6,7,8].map(s => <option key={s} value={s}>{s}</option>)}
        </select>
        <select
          required value={form.faculty_id}
          onChange={e => setForm({...form, faculty_id: e.target.value})}
          className="px-4 py-2 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500/20"
        >
          <option value="">Faculty</option>
          {faculty.map(f => <option key={f.faculty_id} value={f.faculty_id}>{f.name}</option>)}
        </select>
        <div className="flex gap-2">
          <button type="submit" className="flex-1 bg-blue-600 text-white px-4 py-2 rounded-xl font-bold flex items-center justify-center gap-2 hover:bg-blue-700 transition-all">
            {editingId ? <Check size={20} /> : <Plus size={20} />}
            {editingId ? 'Update' : 'Add Subject'}
          </button>
          {editingId && (
            <button 
              type="button" 
              onClick={() => { setEditingId(null); setForm({ subject_name: '', course_id: '', semester: '', faculty_id: '' }); }}
              className="bg-slate-100 text-slate-600 px-4 py-2 rounded-xl font-bold hover:bg-slate-200 transition-all"
            >
              <X size={20} />
            </button>
          )}
        </div>
      </form>

      <div className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden">
        <table className="w-full text-left">
          <thead className="bg-slate-50 text-slate-500 text-xs font-bold uppercase tracking-wider">
            <tr>
              <th className="px-6 py-4">Subject</th>
              <th className="px-6 py-4">Course & Sem</th>
              <th className="px-6 py-4">Faculty</th>
              <th className="px-6 py-4 text-right">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {subjects.map((s) => (
              <tr key={s.subject_id}>
                <td className="px-6 py-4 font-bold text-slate-900">{s.subject_name}</td>
                <td className="px-6 py-4 text-slate-600">{s.course_name} (Sem {s.semester})</td>
                <td className="px-6 py-4 text-slate-600">{s.faculty_name}</td>
                <td className="px-6 py-4 text-right">
                  <div className="flex justify-end gap-2">
                    <button onClick={() => handleEdit(s)} className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors">
                      <Edit2 size={18} />
                    </button>
                    <button onClick={() => handleDelete(s.subject_id)} className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors">
                      <Trash2 size={18} />
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
