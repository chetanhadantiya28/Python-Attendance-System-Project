export type Role = 'admin' | 'teacher' | 'student';

export interface User {
  id: number;
  name: string;
  email: string;
  role: Role;
}

export interface Course {
  course_id: number;
  course_name: string;
}

export interface Faculty {
  faculty_id: number;
  name: string;
  email: string;
}

export interface Student {
  student_id: number;
  roll_number: string;
  name: string;
  email: string;
  course_id: number;
  semester: number;
  course_name?: string;
}

export interface Subject {
  subject_id: number;
  subject_name: string;
  course_id: number;
  semester: number;
  faculty_id: number;
  course_name?: string;
  faculty_name?: string;
}

export interface AttendanceReport {
  subject_id: number;
  subject_name: string;
  totalClasses: number;
  presentCount: number;
  percentage: string;
}
