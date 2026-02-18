import { create } from 'zustand';
import { supabase } from '@/integrations/supabase/client';

interface Student {
  id: string;
  secret_id: string;
  name: string;
  standard: string;
  section: string;
  parent_name: string | null;
  parent_contact: string | null;
  avatar_url: string | null;
  created_at: string;
}

interface Homework {
  id: string;
  standard: string;
  section: string;
  subject: string;
  description: string;
  created_at: string;
}

interface Complaint {
  id: string;
  student_id: string;
  description: string;
  created_at: string;
  student?: Student;
}

interface Result {
  id: string;
  student_id: string;
  subject: string;
  marks_obtained: number;
  total_marks: number;
  percentage: number;
  file_name: string | null;
  created_at: string;
  student?: Student;
}

interface Announcement {
  id: string;
  title: string | null;
  content: string | null;
  type: string | null;
  created_at: string;
}

interface AppStore {
  students: Student[];
  homework: Homework[];
  complaints: Complaint[];
  results: Result[];
  announcements: Announcement[];
  loading: boolean;

  fetchStudents: () => Promise<void>;
  fetchHomework: () => Promise<void>;
  fetchComplaints: () => Promise<void>;
  fetchResults: () => Promise<void>;
  fetchAnnouncements: () => Promise<void>;
  fetchAll: () => Promise<void>;

  addStudent: (student: { name: string; standard: string; section: string; parent_name?: string; parent_contact?: string; avatar_url?: string | null }) => Promise<Student | null>;
  updateStudent: (id: string, data: Partial<Student>) => Promise<void>;
  deleteStudent: (id: string) => Promise<void>;

  addHomework: (hw: { standard: string; section: string; subject: string; description: string }) => Promise<void>;
  addComplaint: (complaint: { student_id: string; description: string }) => Promise<void>;
  addResult: (result: { student_id: string; subject: string; marks_obtained: number; total_marks: number; file_name?: string | null }) => Promise<void>;
  addAnnouncement: (announcement: { title?: string; content?: string; type?: string }) => Promise<void>;

  getStudentsByClass: (standard?: string, section?: string) => Student[];
  getResultsByStudent: (studentId: string) => Result[];
}

const useAppStore = create<AppStore>()((set, get) => ({
  students: [],
  homework: [],
  complaints: [],
  results: [],
  announcements: [],
  loading: false,

  fetchStudents: async () => {
    const { data } = await supabase.from('students').select('*').order('created_at', { ascending: false });
    if (data) set({ students: data as Student[] });
  },

  fetchHomework: async () => {
    const { data } = await supabase.from('homework').select('*').order('created_at', { ascending: false });
    if (data) set({ homework: data as Homework[] });
  },

  fetchComplaints: async () => {
    const { data } = await supabase.from('complaints').select('*, student:students(*)').order('created_at', { ascending: false });
    if (data) set({ complaints: data as unknown as Complaint[] });
  },

  fetchResults: async () => {
    const { data } = await supabase.from('results').select('*, student:students(*)').order('created_at', { ascending: false });
    if (data) set({ results: data as unknown as Result[] });
  },

  fetchAnnouncements: async () => {
    const { data } = await supabase.from('announcements').select('*').order('created_at', { ascending: false });
    if (data) set({ announcements: data as Announcement[] });
  },

  fetchAll: async () => {
    set({ loading: true });
    const store = get();
    await Promise.all([
      store.fetchStudents(),
      store.fetchHomework(),
      store.fetchComplaints(),
      store.fetchResults(),
      store.fetchAnnouncements(),
    ]);
    set({ loading: false });
  },

  addStudent: async (student) => {
    const { data, error } = await supabase.from('students').insert([{
      name: student.name,
      standard: student.standard,
      section: student.section,
      parent_name: student.parent_name || null,
      parent_contact: student.parent_contact || null,
      avatar_url: student.avatar_url || null,
      secret_id: 'TEMP', // Will be overwritten by DB trigger
    }]).select().single();
    if (data && !error) {
      set((state) => ({ students: [data as Student, ...state.students] }));
      return data as Student;
    }
    return null;
  },

  updateStudent: async (id, updatedData) => {
    const { error } = await supabase.from('students').update(updatedData).eq('id', id);
    if (!error) {
      set((state) => ({
        students: state.students.map(s => s.id === id ? { ...s, ...updatedData } : s)
      }));
    }
  },

  deleteStudent: async (id) => {
    const { error } = await supabase.from('students').delete().eq('id', id);
    if (!error) {
      set((state) => ({ students: state.students.filter(s => s.id !== id) }));
    }
  },

  addHomework: async (hw) => {
    const { data, error } = await supabase.from('homework').insert(hw).select().single();
    if (data && !error) {
      set((state) => ({ homework: [data as Homework, ...state.homework] }));
    }
  },

  addComplaint: async (complaint) => {
    const { data, error } = await supabase.from('complaints').insert(complaint).select('*, student:students(*)').single();
    if (data && !error) {
      set((state) => ({ complaints: [data as unknown as Complaint, ...state.complaints] }));
    }
  },

  addResult: async (result) => {
    const { data, error } = await supabase.from('results').insert(result).select('*, student:students(*)').single();
    if (data && !error) {
      set((state) => ({ results: [data as unknown as Result, ...state.results] }));
    }
  },

  addAnnouncement: async (announcement) => {
    const { data, error } = await supabase.from('announcements').insert(announcement).select().single();
    if (data && !error) {
      set((state) => ({ announcements: [data as Announcement, ...state.announcements] }));
    }
  },

  getStudentsByClass: (standard, section) => {
    const state = get();
    return state.students.filter(s => {
      if (standard && section) return s.standard === standard && s.section === section;
      if (standard) return s.standard === standard;
      return true;
    });
  },

  getResultsByStudent: (studentId) => {
    const state = get();
    return state.results.filter(r => r.student_id === studentId);
  },
}));

export default useAppStore;
