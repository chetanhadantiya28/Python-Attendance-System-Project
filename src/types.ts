export type Role = 'admin' | 'teacher' | 'student';

export interface User {
  id: string;
  name: string;
  email: string;
  role: Role;
}

export interface Course {
  course_id: string;
  course_name: string;
}

export interface Faculty {
  faculty_id: string;
  name: string;
  email: string;
}

export interface Student {
  student_id: string;
  roll_number: string;
  name: string;
  email: string;
  course_id: string;
  semester: number;
  course_name?: string;
}

export interface Subject {
  subject_id: string;
  subject_name: string;
  course_id: string;
  semester: number;
  faculty_id: string;
  course_name?: string;
  faculty_name?: string;
}

export interface AttendanceReport {
  subject_id: string;
  subject_name: string;
  totalClasses: number;
  presentCount: number;
  percentage: string;
}
