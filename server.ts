import express from 'express';
import { createServer as createViteServer } from 'vite';
import path from 'path';
import cors from 'cors';
import jwt from 'jsonwebtoken';
import bcrypt from 'bcryptjs';
import db, { initDb } from './src/db';
import * as XLSX from 'xlsx';

try {
  initDb();
  console.log('Database initialized successfully');
} catch (err) {
  console.error('Database initialization failed:', err);
}
const app = express();
const PORT = 3000;
const JWT_SECRET = process.env.JWT_SECRET || 'attendance-secret-key';

app.use(cors());
app.use(express.json());

// Auth Middleware
const authenticateToken = (req: any, res: any, next: any) => {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];

  if (!token) return res.sendStatus(401);

  jwt.verify(token, JWT_SECRET, (err: any, user: any) => {
    if (err) return res.sendStatus(403);
    req.user = user;
    next();
  });
};

// --- AUTH ROUTES ---

app.post('/api/login', async (req, res) => {
  const { email, password, role } = req.body;

  let user: any;
  if (role === 'admin') {
    user = db.prepare('SELECT * FROM admins WHERE email = ?').get(email);
  } else if (role === 'teacher') {
    user = db.prepare('SELECT * FROM faculty WHERE email = ?').get(email);
  } else if (role === 'student') {
    user = db.prepare('SELECT * FROM students WHERE email = ?').get(email);
  }

  if (!user || !bcrypt.compareSync(password, user.password)) {
    return res.status(401).json({ message: 'Invalid credentials' });
  }

  const token = jwt.sign({ id: user.admin_id || user.faculty_id || user.student_id, email: user.email, role }, JWT_SECRET);
  res.json({ token, user: { id: user.admin_id || user.faculty_id || user.student_id, name: user.name, email: user.email, role } });
});

// --- ADMIN ROUTES ---

app.get('/api/admin/courses', authenticateToken, (req: any, res) => {
  if (req.user.role !== 'admin') return res.sendStatus(403);
  const courses = db.prepare('SELECT * FROM courses').all();
  res.json(courses);
});

app.post('/api/admin/courses', authenticateToken, (req: any, res) => {
  if (req.user.role !== 'admin') return res.sendStatus(403);
  const { course_name } = req.body;
  const result = db.prepare('INSERT INTO courses (course_name) VALUES (?)').run(course_name);
  res.json({ id: result.lastInsertRowid });
});

app.delete('/api/admin/courses/:id', authenticateToken, (req: any, res) => {
  if (req.user.role !== 'admin') return res.sendStatus(403);
  const courseId = req.params.id;
  
  try {
    db.transaction(() => {
      // Delete attendance related to subjects in this course
      db.prepare(`
        DELETE FROM attendance 
        WHERE subject_id IN (SELECT subject_id FROM subjects WHERE course_id = ?)
      `).run(courseId);
      
      // Delete class logs related to subjects in this course
      db.prepare(`
        DELETE FROM class_log 
        WHERE subject_id IN (SELECT subject_id FROM subjects WHERE course_id = ?)
      `).run(courseId);
      
      // Delete subjects in this course
      db.prepare('DELETE FROM subjects WHERE course_id = ?').run(courseId);
      
      // Update students to have null course_id
      db.prepare('UPDATE students SET course_id = NULL WHERE course_id = ?').run(courseId);
      
      // Finally delete the course
      db.prepare('DELETE FROM courses WHERE course_id = ?').run(courseId);
    })();
    
    res.json({ success: true });
  } catch (error: any) {
    console.error('Delete course error:', error);
    res.status(500).json({ message: error.message || 'Failed to delete course' });
  }
});

app.get('/api/admin/faculty', authenticateToken, (req: any, res) => {
  if (req.user.role !== 'admin') return res.sendStatus(403);
  const faculty = db.prepare('SELECT faculty_id, name, email FROM faculty').all();
  res.json(faculty);
});

app.post('/api/admin/faculty', authenticateToken, (req: any, res) => {
  if (req.user.role !== 'admin') return res.sendStatus(403);
  const { name, email, password } = req.body;
  const hashedPassword = bcrypt.hashSync(password, 10);
  try {
    const result = db.prepare('INSERT INTO faculty (name, email, password) VALUES (?, ?, ?)').run(name, email, hashedPassword);
    res.json({ id: result.lastInsertRowid });
  } catch (e) {
    res.status(400).json({ message: 'Email already exists' });
  }
});

app.put('/api/admin/faculty/:id', authenticateToken, (req: any, res) => {
  if (req.user.role !== 'admin') return res.sendStatus(403);
  const { name, email, password } = req.body;
  try {
    if (password) {
      const hashedPassword = bcrypt.hashSync(password, 10);
      db.prepare('UPDATE faculty SET name = ?, email = ?, password = ? WHERE faculty_id = ?').run(name, email, hashedPassword, req.params.id);
    } else {
      db.prepare('UPDATE faculty SET name = ?, email = ? WHERE faculty_id = ?').run(name, email, req.params.id);
    }
    res.json({ success: true });
  } catch (e) {
    res.status(400).json({ message: 'Email already exists' });
  }
});

app.delete('/api/admin/faculty/:id', authenticateToken, (req: any, res) => {
  if (req.user.role !== 'admin') return res.sendStatus(403);
  const facultyId = req.params.id;
  
  try {
    db.transaction(() => {
      // Delete attendance related to subjects taught by this faculty
      db.prepare(`
        DELETE FROM attendance 
        WHERE subject_id IN (SELECT subject_id FROM subjects WHERE faculty_id = ?)
      `).run(facultyId);
      
      // Delete class logs related to subjects taught by this faculty
      db.prepare(`
        DELETE FROM class_log 
        WHERE subject_id IN (SELECT subject_id FROM subjects WHERE faculty_id = ?)
      `).run(facultyId);
      
      // Delete subjects taught by this faculty
      db.prepare('DELETE FROM subjects WHERE faculty_id = ?').run(facultyId);
      
      // Finally delete the faculty
      db.prepare('DELETE FROM faculty WHERE faculty_id = ?').run(facultyId);
    })();
    
    res.json({ success: true });
  } catch (error: any) {
    console.error('Delete faculty error:', error);
    res.status(500).json({ message: error.message || 'Failed to delete faculty' });
  }
});

app.get('/api/admin/students', authenticateToken, (req: any, res) => {
  if (req.user.role !== 'admin') return res.sendStatus(403);
  const students = db.prepare(`
    SELECT s.student_id, s.roll_number, s.name, s.email, s.course_id, s.semester, c.course_name 
    FROM students s 
    LEFT JOIN courses c ON s.course_id = c.course_id
  `).all();
  res.json(students);
});

app.post('/api/admin/students', authenticateToken, (req: any, res) => {
  if (req.user.role !== 'admin') return res.sendStatus(403);
  const { roll_number, name, email, password, course_id, semester } = req.body;
  const hashedPassword = bcrypt.hashSync(password, 10);
  try {
    const result = db.prepare('INSERT INTO students (roll_number, name, email, password, course_id, semester) VALUES (?, ?, ?, ?, ?, ?)').run(roll_number, name, email, hashedPassword, course_id, semester);
    res.json({ id: result.lastInsertRowid });
  } catch (e) {
    res.status(400).json({ message: 'Email or Roll Number already exists' });
  }
});

app.put('/api/admin/students/:id', authenticateToken, (req: any, res) => {
  if (req.user.role !== 'admin') return res.sendStatus(403);
  const { roll_number, name, email, password, course_id, semester } = req.body;
  try {
    if (password) {
      const hashedPassword = bcrypt.hashSync(password, 10);
      db.prepare('UPDATE students SET roll_number = ?, name = ?, email = ?, password = ?, course_id = ?, semester = ? WHERE student_id = ?').run(roll_number, name, email, hashedPassword, course_id, semester, req.params.id);
    } else {
      db.prepare('UPDATE students SET roll_number = ?, name = ?, email = ?, course_id = ?, semester = ? WHERE student_id = ?').run(roll_number, name, email, course_id, semester, req.params.id);
    }
    res.json({ success: true });
  } catch (e) {
    res.status(400).json({ message: 'Email or Roll Number already exists' });
  }
});

app.delete('/api/admin/students/:id', authenticateToken, (req: any, res) => {
  if (req.user.role !== 'admin') return res.sendStatus(403);
  const studentId = req.params.id;
  
  try {
    db.transaction(() => {
      // Delete attendance records for this student
      db.prepare('DELETE FROM attendance WHERE student_id = ?').run(studentId);
      
      // Delete the student
      db.prepare('DELETE FROM students WHERE student_id = ?').run(studentId);
    })();
    
    res.json({ success: true });
  } catch (error: any) {
    console.error('Delete student error:', error);
    res.status(500).json({ message: error.message || 'Failed to delete student' });
  }
});

app.get('/api/admin/subjects', authenticateToken, (req: any, res) => {
  if (req.user.role !== 'admin') return res.sendStatus(403);
  const subjects = db.prepare(`
    SELECT s.*, c.course_name, f.name as faculty_name 
    FROM subjects s 
    LEFT JOIN courses c ON s.course_id = c.course_id
    LEFT JOIN faculty f ON s.faculty_id = f.faculty_id
  `).all();
  res.json(subjects);
});

app.post('/api/admin/subjects', authenticateToken, (req: any, res) => {
  if (req.user.role !== 'admin') return res.sendStatus(403);
  const { subject_name, course_id, semester, faculty_id } = req.body;
  const result = db.prepare('INSERT INTO subjects (subject_name, course_id, semester, faculty_id) VALUES (?, ?, ?, ?)').run(subject_name, course_id, semester, faculty_id);
  res.json({ id: result.lastInsertRowid });
});

app.put('/api/admin/subjects/:id', authenticateToken, (req: any, res) => {
  if (req.user.role !== 'admin') return res.sendStatus(403);
  const { subject_name, course_id, semester, faculty_id } = req.body;
  db.prepare('UPDATE subjects SET subject_name = ?, course_id = ?, semester = ?, faculty_id = ? WHERE subject_id = ?').run(subject_name, course_id, semester, faculty_id, req.params.id);
  res.json({ success: true });
});

app.delete('/api/admin/subjects/:id', authenticateToken, (req: any, res) => {
  if (req.user.role !== 'admin') return res.sendStatus(403);
  const subjectId = req.params.id;
  
  try {
    db.transaction(() => {
      // Delete attendance records for this subject
      db.prepare('DELETE FROM attendance WHERE subject_id = ?').run(subjectId);
      
      // Delete class logs for this subject
      db.prepare('DELETE FROM class_log WHERE subject_id = ?').run(subjectId);
      
      // Delete the subject
      db.prepare('DELETE FROM subjects WHERE subject_id = ?').run(subjectId);
    })();
    
    res.json({ success: true });
  } catch (error: any) {
    console.error('Delete subject error:', error);
    res.status(500).json({ message: error.message || 'Failed to delete subject' });
  }
});

// --- TEACHER ROUTES ---

app.get('/api/teacher/subjects', authenticateToken, (req: any, res) => {
  if (req.user.role !== 'teacher') return res.sendStatus(403);
  const subjects = db.prepare(`
    SELECT s.*, c.course_name 
    FROM subjects s 
    JOIN courses c ON s.course_id = c.course_id
    WHERE s.faculty_id = ?
  `).all(req.user.id);
  res.json(subjects);
});

app.get('/api/teacher/students/:subjectId', authenticateToken, (req: any, res) => {
  if (req.user.role !== 'teacher') return res.sendStatus(403);
  const subject = db.prepare('SELECT * FROM subjects WHERE subject_id = ? AND faculty_id = ?').get(req.params.subjectId, req.user.id) as any;
  if (!subject) return res.sendStatus(404);

  const students = db.prepare('SELECT student_id, roll_number, name, email FROM students WHERE course_id = ? AND semester = ?').all(subject.course_id, subject.semester);
  res.json(students);
});

app.post('/api/teacher/attendance', authenticateToken, (req: any, res) => {
  if (req.user.role !== 'teacher') return res.sendStatus(403);
  const { subject_id, date, attendance_data, is_class_held } = req.body;

  // Check if attendance already marked for this subject/day
  const existingLog = db.prepare('SELECT * FROM class_log WHERE subject_id = ? AND date = ?').get(subject_id, date);
  if (existingLog) {
    return res.status(400).json({ message: 'Attendance already marked for this subject on this day.' });
  }

  const transaction = db.transaction(() => {
    db.prepare('INSERT INTO class_log (subject_id, date, is_class_held) VALUES (?, ?, ?)').run(subject_id, date, is_class_held ? 1 : 0);
    
    if (is_class_held) {
      const insertAttendance = db.prepare('INSERT INTO attendance (student_id, subject_id, date, status) VALUES (?, ?, ?, ?)');
      for (const record of attendance_data) {
        insertAttendance.run(record.student_id, subject_id, date, record.status);
      }
    }
  });

  try {
    transaction();
    res.json({ message: 'Attendance marked successfully' });
  } catch (e) {
    res.status(500).json({ message: 'Error marking attendance' });
  }
});

app.get('/api/teacher/export/:subjectId', authenticateToken, (req: any, res) => {
  if (req.user.role !== 'teacher') return res.sendStatus(403);
  
  const subject = db.prepare('SELECT * FROM subjects WHERE subject_id = ? AND faculty_id = ?').get(req.params.subjectId, req.user.id) as any;
  if (!subject) return res.sendStatus(404);

  const attendanceData = db.prepare(`
    SELECT s.roll_number, s.name, s.email, a.date, a.status
    FROM attendance a
    JOIN students s ON a.student_id = s.student_id
    WHERE a.subject_id = ?
    ORDER BY a.date DESC, s.roll_number ASC
  `).all(req.params.subjectId);

  const ws = XLSX.utils.json_to_sheet(attendanceData);
  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, ws, 'Attendance');
  const buffer = XLSX.write(wb, { type: 'buffer', bookType: 'xlsx' });

  res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
  res.setHeader('Content-Disposition', `attachment; filename=attendance_${subject.subject_name}.xlsx`);
  res.send(buffer);
});

app.get('/api/teacher/detailed-report', authenticateToken, (req: any, res) => {
  if (req.user.role !== 'teacher') return res.sendStatus(403);
  
  const { subject_id, from_date, to_date, min_percentage } = req.query;
  
  if (!subject_id || !from_date || !to_date) {
    return res.status(400).json({ message: 'Missing required parameters' });
  }

  const subject = db.prepare('SELECT * FROM subjects WHERE subject_id = ? AND faculty_id = ?').get(subject_id, req.user.id) as any;
  if (!subject) return res.sendStatus(404);

  const students = db.prepare('SELECT student_id, roll_number, name, email FROM students WHERE course_id = ? AND semester = ?').all(subject.course_id, subject.semester);

  const report = students.map((s: any) => {
    const totalClassesResult = db.prepare(`
      SELECT COUNT(*) as count FROM class_log 
      WHERE subject_id = ? AND is_class_held = 1 
      AND date BETWEEN ? AND ?
    `).get(subject_id, from_date, to_date) as any;
    const totalClasses = totalClassesResult ? totalClassesResult.count : 0;

    const presentCountResult = db.prepare(`
      SELECT COUNT(*) as count FROM attendance 
      WHERE student_id = ? AND subject_id = ? AND status = 'Present'
      AND date BETWEEN ? AND ?
    `).get(s.student_id, subject_id, from_date, to_date) as any;
    const presentCount = presentCountResult ? presentCountResult.count : 0;

    const percentage = totalClasses > 0 ? (presentCount / totalClasses) * 100 : 0;

    return {
      roll_number: s.roll_number,
      name: s.name,
      email: s.email,
      totalClasses,
      presentCount,
      percentage: percentage.toFixed(2)
    };
  });

  const filteredReport = min_percentage 
    ? report.filter(r => parseFloat(r.percentage) >= parseFloat(min_percentage as string))
    : report;

  res.json(filteredReport);
});

app.post('/api/teacher/export-detailed', authenticateToken, (req: any, res) => {
  if (req.user.role !== 'teacher') return res.sendStatus(403);
  const { data, subject_name } = req.body;

  const ws = XLSX.utils.json_to_sheet(data);
  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, ws, 'Report');
  const buffer = XLSX.write(wb, { type: 'buffer', bookType: 'xlsx' });

  res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
  res.setHeader('Content-Disposition', `attachment; filename=detailed_report_${subject_name}.xlsx`);
  res.send(buffer);
});

// --- STUDENT ROUTES ---

app.get('/api/student/attendance', authenticateToken, (req: any, res) => {
  if (req.user.role !== 'student') return res.sendStatus(403);
  
  try {
    const student = db.prepare('SELECT * FROM students WHERE student_id = ?').get(req.user.id) as any;
    if (!student) return res.status(404).json({ message: 'Student not found' });

    const subjects = db.prepare('SELECT * FROM subjects WHERE course_id = ? AND semester = ?').all(student.course_id, student.semester);

    const report = subjects.map((sub: any) => {
      const totalClassesResult = db.prepare('SELECT COUNT(*) as count FROM class_log WHERE subject_id = ? AND is_class_held = 1').get(sub.subject_id) as any;
      const totalClasses = totalClassesResult ? totalClassesResult.count : 0;

      const presentCountResult = db.prepare("SELECT COUNT(*) as count FROM attendance WHERE student_id = ? AND subject_id = ? AND status = 'Present'").get(req.user.id, sub.subject_id) as any;
      const presentCount = presentCountResult ? presentCountResult.count : 0;

      const percentage = totalClasses > 0 ? (presentCount / totalClasses) * 100 : 0;

      return {
        subject_id: sub.subject_id,
        subject_name: sub.subject_name,
        totalClasses,
        presentCount,
        percentage: percentage.toFixed(2)
      };
    });

    res.json(report);
  } catch (error) {
    console.error('Error fetching student attendance:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
});

// --- ANALYTICS (ADMIN) ---
app.get('/api/admin/analytics', authenticateToken, (req: any, res) => {
  if (req.user.role !== 'admin') return res.sendStatus(403);
  
  const totalStudents = (db.prepare('SELECT COUNT(*) as count FROM students').get() as any).count;
  const totalFaculty = (db.prepare('SELECT COUNT(*) as count FROM faculty').get() as any).count;
  const totalCourses = (db.prepare('SELECT COUNT(*) as count FROM courses').get() as any).count;
  const totalSubjects = (db.prepare('SELECT COUNT(*) as count FROM subjects').get() as any).count;

  res.json({ totalStudents, totalFaculty, totalCourses, totalSubjects });
});

// --- BOOTSTRAP ADMIN ---
const bootstrapAdmin = () => {
  const adminCount = (db.prepare('SELECT COUNT(*) as count FROM admins').get() as any).count;
  if (adminCount === 0) {
    const hashedPassword = bcrypt.hashSync('admin123', 10);
    db.prepare('INSERT INTO admins (name, email, password) VALUES (?, ?, ?)').run('System Admin', 'admin@college.edu', hashedPassword);
    console.log('Default admin created: admin@college.edu / admin123');
  }
};

try {
  bootstrapAdmin();
} catch (err) {
  console.error('Admin bootstrap failed:', err);
}

async function startServer() {
  if (process.env.NODE_ENV !== 'production') {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`Server running on http://localhost:${PORT}`);
  });
}

startServer();
