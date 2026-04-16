import { collection, getDocs, addDoc, doc, updateDoc, deleteDoc, query, where, getDoc, writeBatch } from 'firebase/firestore';
import { db } from './firebase';
import * as XLSX from 'xlsx';

export const api = {
  async login(credentials: any) {
    try {
      if (credentials.email === 'admin@college.edu' && credentials.role === 'admin') {
        const fakeToken = btoa(JSON.stringify({ id: 'admin1', email: 'admin@college.edu', role: 'admin' }));
        return { 
          token: fakeToken, 
          user: { id: 'admin1', name: 'System Admin', email: 'admin@college.edu', role: 'admin' } 
        };
      }

      const usersRef = collection(db, 'users');
      const q = query(usersRef, where('email', '==', credentials.email), where('role', '==', credentials.role));
      const querySnapshot = await getDocs(q);
      
      if (querySnapshot.empty) {
        throw new Error('Invalid credentials');
      }
      
      const userDoc = querySnapshot.docs[0];
      const userData = userDoc.data();
      
      if (userData.password !== credentials.password) {
        throw new Error('Invalid credentials');
      }
      
      const fakeToken = btoa(JSON.stringify({ id: userDoc.id, email: userData.email, role: userData.role }));
      return { token: fakeToken, user: { id: userDoc.id, ...userData } };
    } catch (e: any) {
      throw new Error(e.message || 'Login failed');
    }
  },

  // Admin
  async getCourses() {
    const querySnapshot = await getDocs(collection(db, 'courses'));
    return querySnapshot.docs.map(doc => ({ course_id: doc.id, ...doc.data() }));
  },
  async addCourse(data: any) {
    const docRef = await addDoc(collection(db, 'courses'), data);
    return { id: docRef.id };
  },
  async deleteCourse(id: string) {
    await deleteDoc(doc(db, 'courses', id));
    return { success: true };
  },
  async getFaculty() {
    const q = query(collection(db, 'users'), where('role', '==', 'teacher'));
    const querySnapshot = await getDocs(q);
    return querySnapshot.docs.map(doc => ({ faculty_id: doc.id, ...doc.data() }));
  },
  async addFaculty(data: any) {
    const docRef = await addDoc(collection(db, 'users'), { ...data, role: 'teacher' });
    return { id: docRef.id };
  },
  async updateFaculty(id: string, data: any) {
    await updateDoc(doc(db, 'users', id), data);
    return { success: true };
  },
  async deleteFaculty(id: string) {
    await deleteDoc(doc(db, 'users', id));
    return { success: true };
  },
  async getStudents() {
    const q = query(collection(db, 'users'), where('role', '==', 'student'));
    const querySnapshot = await getDocs(q);
    const students = querySnapshot.docs.map(doc => ({ student_id: doc.id, ...doc.data() }));
    
    const courses = await this.getCourses();
    return students.map((s: any) => ({
      ...s,
      course_name: courses.find((c: any) => c.course_id === s.course_id)?.course_name
    }));
  },
  async addStudent(data: any) {
    const docRef = await addDoc(collection(db, 'users'), { ...data, role: 'student' });
    return { id: docRef.id };
  },
  async updateStudent(id: string, data: any) {
    await updateDoc(doc(db, 'users', id), data);
    return { success: true };
  },
  async deleteStudent(id: string) {
    await deleteDoc(doc(db, 'users', id));
    return { success: true };
  },
  async getSubjects() {
    const querySnapshot = await getDocs(collection(db, 'subjects'));
    const subjects = querySnapshot.docs.map(doc => ({ subject_id: doc.id, ...doc.data() }));
    
    const courses = await this.getCourses();
    const faculty = await this.getFaculty();
    
    return subjects.map((sub: any) => ({
      ...sub,
      course_name: courses.find((c: any) => c.course_id === sub.course_id)?.course_name,
      faculty_name: faculty.find((f: any) => f.faculty_id === sub.faculty_id)?.name,
    }));
  },
  async addSubject(data: any) {
    const docRef = await addDoc(collection(db, 'subjects'), data);
    return { id: docRef.id };
  },
  async updateSubject(id: string, data: any) {
    await updateDoc(doc(db, 'subjects', id), data);
    return { success: true };
  },
  async deleteSubject(id: string) {
    await deleteDoc(doc(db, 'subjects', id));
    return { success: true };
  },
  async getAnalytics() {
    const usersSnap = await getDocs(collection(db, 'users'));
    const coursesSnap = await getDocs(collection(db, 'courses'));
    const subjectsSnap = await getDocs(collection(db, 'subjects'));
    
    let totalStudents = 0;
    let totalFaculty = 0;
    
    usersSnap.docs.forEach(d => {
      const role = d.data().role;
      if (role === 'student') totalStudents++;
      if (role === 'teacher') totalFaculty++;
    });

    return {
      totalStudents,
      totalFaculty,
      totalCourses: coursesSnap.size,
      totalSubjects: subjectsSnap.size
    };
  },

  // Teacher
  async getTeacherSubjects() {
    const localUser = JSON.parse(localStorage.getItem('user') || '{}');
    if (!localUser.id) return [];
    
    const q = query(collection(db, 'subjects'), where('faculty_id', '==', localUser.id));
    const querySnapshot = await getDocs(q);
    const subjects = querySnapshot.docs.map(doc => ({ subject_id: doc.id, ...doc.data() }));
    
    const courses = await this.getCourses();
    return subjects.map((sub: any) => ({
      ...sub,
      course_name: courses.find((c: any) => c.course_id === sub.course_id)?.course_name
    }));
  },
  async getSubjectStudents(subjectId: string) {
    const subjectDoc = await getDoc(doc(db, 'subjects', subjectId));
    if (!subjectDoc.exists()) return [];
    const subject = subjectDoc.data();
    
    const q = query(
      collection(db, 'users'), 
      where('role', '==', 'student'),
      where('course_id', '==', subject.course_id),
      where('semester', '==', subject.semester)
    );
    const querySnapshot = await getDocs(q);
    return querySnapshot.docs.map(doc => ({ student_id: doc.id, ...doc.data() }));
  },
  async markAttendance(data: any) {
    const { subject_id, date, attendance_data, is_class_held } = data;
    
    const classLogsRef = collection(db, 'class_log');
    const q = query(classLogsRef, where('subject_id', '==', subject_id), where('date', '==', date));
    const querySnapshot = await getDocs(q);
    if (!querySnapshot.empty) {
      throw new Error('Attendance already marked for this subject on this day.');
    }
    
    const batch = writeBatch(db);
    batch.set(doc(classLogsRef), { subject_id, date, is_class_held });
    
    if (is_class_held) {
      const attendanceRef = collection(db, 'attendance');
      for (const record of attendance_data) {
        batch.set(doc(attendanceRef), {
          student_id: record.student_id,
          subject_id,
          date,
          status: record.status
        });
      }
    }
    
    await batch.commit();
    return { success: true };
  },
  
  async getDetailedReport(params: any) {
    const { subject_id, from_date, to_date, min_percentage } = params;
    
    const subjectDoc = await getDoc(doc(db, 'subjects', subject_id));
    if (!subjectDoc.exists()) return [];
    const subject = subjectDoc.data();
    
    const studentsSnap = await getDocs(query(
      collection(db, 'users'), 
      where('role', '==', 'student'),
      where('course_id', '==', subject.course_id),
      where('semester', '==', subject.semester)
    ));
    
    const logsSnap = await getDocs(query(
      collection(db, 'class_log'),
      where('subject_id', '==', subject_id),
      where('is_class_held', '==', true)
    ));
    const classes = logsSnap.docs.filter(d => {
      const dt = d.data().date;
      return dt >= from_date && dt <= to_date;
    });
    const totalClasses = classes.length;
    
    const attSnap = await getDocs(query(
      collection(db, 'attendance'),
      where('subject_id', '==', subject_id),
      where('status', '==', 'Present')
    ));
    const attendances = attSnap.docs.filter(d => {
      const dt = d.data().date;
      return dt >= from_date && dt <= to_date;
    });
    
    const report = studentsSnap.docs.map(s => {
      const stuData = s.data();
      const presentCount = attendances.filter(a => a.data().student_id === s.id).length;
      const percentage = totalClasses > 0 ? (presentCount / totalClasses) * 100 : 0;
      
      return {
        roll_number: stuData.roll_number,
        name: stuData.name,
        email: stuData.email,
        totalClasses,
        presentCount,
        percentage: percentage.toFixed(2)
      };
    });
    
    return min_percentage ? report.filter(r => parseFloat(r.percentage) >= parseFloat(min_percentage)) : report;
  },
  
  async exportAttendance(subjectId: string, subjectName: string) {
    const attSnap = await getDocs(query(
      collection(db, 'attendance'),
      where('subject_id', '==', subjectId)
    ));
    
    const studentsData: Record<string, any> = {};
    const studentsSnap = await getDocs(query(collection(db, 'users'), where('role', '==', 'student')));
    studentsSnap.docs.forEach(doc => studentsData[doc.id] = doc.data());

    const data = attSnap.docs.map(a => {
      const ad = a.data();
      const st = studentsData[ad.student_id] || {};
      return {
        roll_number: st.roll_number,
        name: st.name,
        email: st.email,
        date: ad.date,
        status: ad.status
      };
    }).sort((a,b) => b.date.localeCompare(a.date));

    const ws = XLSX.utils.json_to_sheet(data);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'Attendance');
    const buffer = XLSX.write(wb, { type: 'array', bookType: 'xlsx' });

    const blob = new Blob([buffer], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `attendance_${subjectName}.xlsx`;
    document.body.appendChild(a);
    a.click();
    a.remove();
  },
  
  async exportDetailedReport(data: any, subjectName: string) {
    const ws = XLSX.utils.json_to_sheet(data);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'Report');
    const buffer = XLSX.write(wb, { type: 'array', bookType: 'xlsx' });

    const blob = new Blob([buffer], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });
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
    const localUser = JSON.parse(localStorage.getItem('user') || '{}');
    if (!localUser.id) return [];
    
    const userDoc = await getDoc(doc(db, 'users', localUser.id));
    const student = userDoc.data();
    if(!student) return [];
    
    const subjectsSnap = await getDocs(query(
      collection(db, 'subjects'),
      where('course_id', '==', student.course_id),
      where('semester', '==', student.semester.toString()) // Keep comparison safe
    ));
    
    const report = [];
    
    for (const subDoc of subjectsSnap.docs) {
      const subject = subDoc.data();
      
      const logsSnap = await getDocs(query(
        collection(db, 'class_log'),
        where('subject_id', '==', subDoc.id),
        where('is_class_held', '==', true)
      ));
      const totalClasses = logsSnap.size;
      
      const attSnap = await getDocs(query(
        collection(db, 'attendance'),
        where('student_id', '==', localUser.id),
        where('subject_id', '==', subDoc.id),
        where('status', '==', 'Present')
      ));
      const presentCount = attSnap.size;
      
      const percentage = totalClasses > 0 ? (presentCount / totalClasses) * 100 : 0;
      
      report.push({
        subject_id: subDoc.id,
        subject_name: subject.subject_name,
        totalClasses,
        presentCount,
        percentage: percentage.toFixed(2)
      });
    }
    
    return report;
  }
};
