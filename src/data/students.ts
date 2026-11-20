export type Student = {
  id: number;
  uid: string;
  full_name: string;
  student_number: string | null;
  course_section: string;
  technologies: string;
  created_at: string;
};

export const studentSchema = `
  PRAGMA journal_mode = WAL;
  CREATE TABLE IF NOT EXISTS students (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    uid TEXT NOT NULL UNIQUE CHECK(length(uid) > 0),
    full_name TEXT NOT NULL CHECK(length(trim(full_name)) > 0),
    student_number TEXT COLLATE NOCASE UNIQUE,
    course_section TEXT NOT NULL DEFAULT '',
    technologies TEXT NOT NULL DEFAULT '',
    created_at TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ', 'now'))
  );
`;

export function normalizeUid(value: string | undefined): string {
  const uid = (value ?? '').replace(/[\s:-]/g, '').toUpperCase();
  if (!/^(?:[0-9A-F]{2})+$/.test(uid) || uid.length > 64) {
    throw new Error('This card did not provide a usable NFC ID. Remove it and try again.');
  }
  return uid;
}

export function registrationValues(uid: string, name: string, number: string, course: string, technologies: string[]) {
  const fullName = name.trim().replace(/\s+/g, ' ');
  const studentNumber = number.trim();
  const courseSection = course.trim();
  if (!fullName) throw new Error('Enter the student’s full name.');
  if (fullName.length > 120 || studentNumber.length > 50 || courseSection.length > 100) {
    throw new Error('Keep the name under 120 characters, student number under 50, and course/section under 100.');
  }
  return [normalizeUid(uid), fullName, studentNumber || null, courseSection, technologies.join(', ')] as const;
}

export const insertStudentSql = `
  INSERT INTO students (uid, full_name, student_number, course_section, technologies)
  VALUES (?, ?, ?, ?, ?)
`;
