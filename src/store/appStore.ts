import { create } from 'zustand';
import { persist } from 'zustand/middleware';

interface Student {
  id: string;
  name: string;
  standard: string;
  section: string;
  parentName: string;
  parentContact: string;
  avatar?: string | null;
}

interface Homework {
  id: string;
  standard: string;
  section: string;
  subject: string;
  homework: string;
  dueDate: string;
  createdAt: string;
}

interface Complaint {
  id: string;
  studentName: string;
  standard: string;
  section: string;
  description: string;
  createdAt: string;
}

interface Result {
  id: string;
  studentName: string;
  standard: string;
  section: string;
  subjects: { name: string; marks: string }[];
  fileName?: string | null;
  createdAt: string;
}

interface Announcement {
  id: string;
  createdAt: string;
  [key: string]: any;
}

interface AppStore {
  students: Student[];
  homework: Homework[];
  complaints: Complaint[];
  results: Result[];
  announcements: Announcement[];
  addStudent: (student: Omit<Student, 'id'> & { id?: string }) => void;
  updateStudent: (id: string, data: Partial<Student>) => void;
  deleteStudent: (id: string) => void;
  addHomework: (hw: Omit<Homework, 'id' | 'createdAt'>) => void;
  addComplaint: (complaint: Omit<Complaint, 'id' | 'createdAt'>) => void;
  addResult: (result: Omit<Result, 'id' | 'createdAt'>) => void;
  addAnnouncement: (announcement: any) => void;
  getStudentsByClass: (standard?: string, section?: string) => Student[];
  getResultsByStudent: (studentName: string) => Result[];
}

const useAppStore = create<AppStore>()(
  persist(
    (set, get) => ({
      students: [],
      homework: [],
      complaints: [],
      results: [],
      announcements: [],

      addStudent: (student) => set((state) => ({
        students: [...state.students, { ...student, id: student.id || Date.now().toString() } as Student]
      })),

      updateStudent: (id, updatedData) => set((state) => ({
        students: state.students.map(s => s.id === id ? { ...s, ...updatedData } : s)
      })),

      deleteStudent: (id) => set((state) => ({
        students: state.students.filter(s => s.id !== id)
      })),

      addHomework: (hw) => set((state) => ({
        homework: [...state.homework, { ...hw, id: Date.now().toString(), createdAt: new Date().toISOString() }]
      })),

      addComplaint: (complaint) => set((state) => ({
        complaints: [...state.complaints, { ...complaint, id: Date.now().toString(), createdAt: new Date().toISOString() }]
      })),

      addResult: (result) => set((state) => ({
        results: [...state.results, { ...result, id: Date.now().toString(), createdAt: new Date().toISOString() }]
      })),

      addAnnouncement: (announcement) => set((state) => ({
        announcements: [...state.announcements, { ...announcement, id: Date.now().toString(), createdAt: new Date().toISOString() }]
      })),

      getStudentsByClass: (standard, section) => {
        const state = get();
        return state.students.filter(s => {
          if (standard && section) return s.standard === standard && s.section === section;
          if (standard) return s.standard === standard;
          return true;
        });
      },

      getResultsByStudent: (studentName) => {
        const state = get();
        return state.results.filter(r => r.studentName?.toLowerCase() === studentName?.toLowerCase());
      },
    }),
    { name: 'edulinker-storage' }
  )
);

export default useAppStore;
