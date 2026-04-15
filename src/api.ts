const API_BASE = '/api';

const getHeaders = () => {
  const token = localStorage.getItem('token');
  return {
    'Content-Type': 'application/json',
    'Authorization': token ? `Bearer ${token}` : '',
  };
};

export const api = {
  async login(credentials: any) {
    const res = await fetch(`${API_BASE}/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(credentials),
    });
    if (!res.ok) throw new Error('Login failed');
    return res.json();
  },

  // Admin
  async getCourses() {
    const res = await fetch(`${API_BASE}/admin/courses`, { headers: getHeaders() });
    return res.json();
  },
  async addCourse(data: any) {
    const res = await fetch(`${API_BASE}/admin/courses`, {
      method: 'POST',
      headers: getHeaders(),
      body: JSON.stringify(data),
    });
    return res.json();
  },
  async deleteCourse(id: number) {
    const res = await fetch(`${API_BASE}/admin/courses/${id}`, {
      method: 'DELETE',
      headers: getHeaders(),
    });
    return res.json();
  },
  async getFaculty() {
    const res = await fetch(`${API_BASE}/admin/faculty`, { headers: getHeaders() });
    return res.json();
  },
  async addFaculty(data: any) {
    const res = await fetch(`${API_BASE}/admin/faculty`, {
      method: 'POST',
      headers: getHeaders(),
      body: JSON.stringify(data),
    });
    return res.json();
  },
  async updateFaculty(id: number, data: any) {
    const res = await fetch(`${API_BASE}/admin/faculty/${id}`, {
      method: 'PUT',
      headers: getHeaders(),
      body: JSON.stringify(data),
    });
    return res.json();
  },
  async deleteFaculty(id: number) {
    const res = await fetch(`${API_BASE}/admin/faculty/${id}`, {
      method: 'DELETE',
      headers: getHeaders(),
    });
    return res.json();
  },
  async getStudents() {
    const res = await fetch(`${API_BASE}/admin/students`, { headers: getHeaders() });
    return res.json();
  },
  async addStudent(data: any) {
    const res = await fetch(`${API_BASE}/admin/students`, {
      method: 'POST',
      headers: getHeaders(),
      body: JSON.stringify(data),
    });
    return res.json();
  },
  async updateStudent(id: number, data: any) {
    const res = await fetch(`${API_BASE}/admin/students/${id}`, {
      method: 'PUT',
      headers: getHeaders(),
      body: JSON.stringify(data),
    });
    return res.json();
  },
  async deleteStudent(id: number) {
    const res = await fetch(`${API_BASE}/admin/students/${id}`, {
      method: 'DELETE',
      headers: getHeaders(),
    });
    return res.json();
  },
  async getSubjects() {
    const res = await fetch(`${API_BASE}/admin/subjects`, { headers: getHeaders() });
    return res.json();
  },
  async addSubject(data: any) {
    const res = await fetch(`${API_BASE}/admin/subjects`, {
      method: 'POST',
      headers: getHeaders(),
      body: JSON.stringify(data),
    });
    return res.json();
  },
  async updateSubject(id: number, data: any) {
    const res = await fetch(`${API_BASE}/admin/subjects/${id}`, {
      method: 'PUT',
      headers: getHeaders(),
      body: JSON.stringify(data),
    });
    return res.json();
  },
  async deleteSubject(id: number) {
    const res = await fetch(`${API_BASE}/admin/subjects/${id}`, {
      method: 'DELETE',
      headers: getHeaders(),
    });
    return res.json();
  },
  async getAnalytics() {
    const res = await fetch(`${API_BASE}/admin/analytics`, { headers: getHeaders() });
    return res.json();
  },

  // Teacher
  async getTeacherSubjects() {
    const res = await fetch(`${API_BASE}/teacher/subjects`, { headers: getHeaders() });
    return res.json();
  },
  async getSubjectStudents(subjectId: number) {
    const res = await fetch(`${API_BASE}/teacher/students/${subjectId}`, { headers: getHeaders() });
    return res.json();
  },
  async markAttendance(data: any) {
    const res = await fetch(`${API_BASE}/teacher/attendance`, {
      method: 'POST',
      headers: getHeaders(),
      body: JSON.stringify(data),
    });
    if (!res.ok) {
      const error = await res.json();
      throw new Error(error.message || 'Failed to mark attendance');
    }
    return res.json();
  },
  async exportAttendance(subjectId: number, subjectName: string) {
    const res = await fetch(`${API_BASE}/teacher/export/${subjectId}`, { headers: getHeaders() });
    const blob = await res.blob();
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `attendance_${subjectName}.xlsx`;
    document.body.appendChild(a);
    a.click();
    a.remove();
  },
  async getDetailedReport(params: any) {
    const query = new URLSearchParams(params).toString();
    const res = await fetch(`${API_BASE}/teacher/detailed-report?${query}`, { headers: getHeaders() });
    return res.json();
  },
  async exportDetailedReport(data: any, subjectName: string) {
    const res = await fetch(`${API_BASE}/teacher/export-detailed`, {
      method: 'POST',
      headers: getHeaders(),
      body: JSON.stringify({ data, subject_name: subjectName }),
    });
    const blob = await res.blob();
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `detailed_report_${subjectName}.xlsx`;
    document.body.appendChild(a);
    a.click();
    a.remove();
  },

  // Student
  async getStudentAttendance() {
    const res = await fetch(`${API_BASE}/student/attendance`, { headers: getHeaders() });
    return res.json();
  },
};
