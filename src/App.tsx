/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import Layout from './components/Layout';
import Login from './components/Login';
import AdminDashboard from './components/AdminDashboard';
import TeacherDashboard from './components/TeacherDashboard';
import StudentDashboard from './components/StudentDashboard';
import { ManageCourses, ManageFaculty, ManageStudents, ManageSubjects } from './components/AdminManagement';
import { User } from './types';

export default function App() {
  const [user, setUser] = React.useState<User | null>(null);
  const [isReady, setIsReady] = React.useState(false);

  React.useEffect(() => {
    const savedUser = localStorage.getItem('user');
    if (savedUser) {
      setUser(JSON.parse(savedUser));
    }
    setIsReady(true);
  }, []);

  const handleLogin = (user: User, token: string) => {
    setUser(user);
    localStorage.setItem('user', JSON.stringify(user));
    localStorage.setItem('token', token);
  };

  const handleLogout = () => {
    setUser(null);
    localStorage.removeItem('user');
    localStorage.removeItem('token');
  };

  if (!isReady) return null;

  return (
    <BrowserRouter>
      <Layout user={user} onLogout={handleLogout}>
        <Routes>
          <Route path="/login" element={!user ? <Login onLogin={handleLogin} /> : <Navigate to={user.role === 'admin' ? '/admin' : user.role === 'teacher' ? '/teacher' : '/student'} />} />
          
          {/* Admin Routes */}
          <Route path="/admin" element={user?.role === 'admin' ? <AdminDashboard /> : <Navigate to="/login" />} />
          <Route path="/admin/courses" element={user?.role === 'admin' ? <ManageCourses /> : <Navigate to="/login" />} />
          <Route path="/admin/faculty" element={user?.role === 'admin' ? <ManageFaculty /> : <Navigate to="/login" />} />
          <Route path="/admin/students" element={user?.role === 'admin' ? <ManageStudents /> : <Navigate to="/login" />} />
          <Route path="/admin/subjects" element={user?.role === 'admin' ? <ManageSubjects /> : <Navigate to="/login" />} />

          {/* Teacher Routes */}
          <Route path="/teacher" element={user?.role === 'teacher' ? <TeacherDashboard /> : <Navigate to="/login" />} />

          {/* Student Routes */}
          <Route path="/student" element={user?.role === 'student' ? <StudentDashboard /> : <Navigate to="/login" />} />

          <Route path="/" element={<Navigate to="/login" />} />
        </Routes>
      </Layout>
    </BrowserRouter>
  );
}

