import Database from 'better-sqlite3';
import path from 'path';
import fs from 'fs';

const dbPath = path.resolve(process.cwd(), 'attendance.db');
const db = new Database(dbPath);

export const initDb = () => {
  db.exec('PRAGMA foreign_keys = ON');
  db.exec(`
    CREATE TABLE IF NOT EXISTS courses (
    course_id INTEGER PRIMARY KEY AUTOINCREMENT,
    course_name TEXT NOT NULL
  );

  CREATE TABLE IF NOT EXISTS faculty (
    faculty_id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT NOT NULL,
    email TEXT UNIQUE NOT NULL,
    password TEXT NOT NULL
  );

  CREATE TABLE IF NOT EXISTS students (
    student_id INTEGER PRIMARY KEY AUTOINCREMENT,
    roll_number TEXT UNIQUE NOT NULL,
    name TEXT NOT NULL,
    email TEXT UNIQUE NOT NULL,
    password TEXT NOT NULL,
    course_id INTEGER,
    semester INTEGER,
    FOREIGN KEY (course_id) REFERENCES courses(course_id) ON DELETE SET NULL
  );

  CREATE TABLE IF NOT EXISTS subjects (
    subject_id INTEGER PRIMARY KEY AUTOINCREMENT,
    subject_name TEXT NOT NULL,
    course_id INTEGER,
    semester INTEGER,
    faculty_id INTEGER,
    FOREIGN KEY (course_id) REFERENCES courses(course_id) ON DELETE CASCADE,
    FOREIGN KEY (faculty_id) REFERENCES faculty(faculty_id) ON DELETE CASCADE
  );

  CREATE TABLE IF NOT EXISTS attendance (
    attendance_id INTEGER PRIMARY KEY AUTOINCREMENT,
    student_id INTEGER,
    subject_id INTEGER,
    date TEXT NOT NULL,
    status TEXT CHECK(status IN ('Present', 'Absent')),
    UNIQUE(student_id, subject_id, date),
    FOREIGN KEY (student_id) REFERENCES students(student_id) ON DELETE CASCADE,
    FOREIGN KEY (subject_id) REFERENCES subjects(subject_id) ON DELETE CASCADE
  );

  CREATE TABLE IF NOT EXISTS class_log (
    log_id INTEGER PRIMARY KEY AUTOINCREMENT,
    subject_id INTEGER,
    date TEXT NOT NULL,
    is_class_held BOOLEAN,
    UNIQUE(subject_id, date),
    FOREIGN KEY (subject_id) REFERENCES subjects(subject_id) ON DELETE CASCADE
  );

  CREATE TABLE IF NOT EXISTS admins (
    admin_id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT NOT NULL,
    email TEXT UNIQUE NOT NULL,
    password TEXT NOT NULL
  );
  `);
};

export default db;
