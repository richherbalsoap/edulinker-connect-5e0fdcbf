import { create } from "zustand";
import { supabase } from "@/integrations/supabase/client";

interface Student {
  id: string;
  secret_id: string;
  name: string;
  standard: string;
  section: string;
  roll_no: number | null;
  parent_name: string | null;
  parent_contact: string | null;
  avatar_url: string | null;
  created_by: string | null;
  created_at: string;
  school_id: string | null;
}

interface Homework {
  id: string;
  standard: string;
  section: string;
  subject: string;
  description: string;
  file_url: string | null;
  created_by: string | null;
  created_at: string;
  school_id: string | null;
}

interface Complaint {
  id: string;
  student_id: string;
  description: string;
  file_url: string | null;
  created_by: string | null;
  created_at: string;
  school_id: string | null;
  student?: Student;
}

interface Result {
  id: string;
  student_id: string;
  subject: string;
  marks_obtained: number;
  total_marks: number;
  percentage: number;
  exam_name: string | null;
  file_name: string | null;
  file_url: string | null;
  created_by: string | null;
  created_at: string;
  school_id: string | null;
  student?: Student;
}

interface Announcement {
  id: string;
  title: string | null;
  content: string | null;
  type: string | null;
  created_by: string | null;
  created_at: string;
  school_id: string | null;
}

interface AppStore {
  students: Student[];
  homework: Homework[];
  complaints: Complaint[];
  results: Result[];
  announcements: Announcement[];
  loading: boolean;
  fetchStudents: (schoolId?: string) => Promise<void>;
  fetchHomework: (schoolId?: string) => Promise<void>;
  fetchComplaints: (schoolId?: string) => Promise<void>;
  fetchResults: (schoolId?: string) => Promise<void>;
  fetchAnnouncements: (schoolId?: string) => Promise<void>;
  fetchAll: (schoolId?: string) => Promise<void>;
  addStudent: (
    student: {
      name: string;
      standard: string;
      section: string;
      roll_no?: number | null;
      parent_name?: string;
      parent_contact?: string;
      avatar_url?: string | null;
    },
    manualKey?: string | null,
    schoolId?: string | null,
  ) => Promise<Student | null>;
  updateStudent: (id: string, data: Partial<Student>) => Promise<void>;
  deleteStudent: (id: string) => Promise<void>;
  addHomework: (hw: {
    standard: string;
    section: string;
    subject: string;
    description: string;
    file_url?: string | null;
    school_id: string;
  }) => Promise<void>;
  addComplaint: (complaint: {
    student_id: string;
    description: string;
    file_url?: string | null;
    school_id: string;
  }) => Promise<void>;
  addResult: (result: {
    student_id: string;
    subject: string;
    marks_obtained: number;
    total_marks: number;
    file_name?: string | null;
    school_id: string;
  }) => Promise<void>;
  addAnnouncement: (announcement: {
    title?: string;
    content?: string;
    type?: string;
    school_id: string;
  }) => Promise<void>;
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

  fetchStudents: async (schoolId) => {
    try {
      let query = supabase.from("students").select("*").order("created_at", { ascending: false });
      if (schoolId) query = query.eq("school_id", schoolId);
      const { data } = await query;
      if (data) set({ students: data as unknown as Student[] });
    } catch (e) {
      console.warn("fetchStudents failed:", e);
    }
  },

  fetchHomework: async (schoolId) => {
    try {
      let query = supabase.from("homework").select("*").order("created_at", { ascending: false });
      if (schoolId) query = query.eq("school_id", schoolId);
      const { data } = await query;
      if (data) set({ homework: data as unknown as Homework[] });
    } catch (e) {
      console.warn("fetchHomework failed:", e);
    }
  },

  fetchComplaints: async (schoolId) => {
    try {
      let query = supabase
        .from("complaints")
        .select("*, student:students(*)")
        .order("created_at", { ascending: false });
      if (schoolId) query = query.eq("school_id", schoolId);
      const { data } = await query;
      if (data) set({ complaints: data as unknown as Complaint[] });
    } catch (e) {
      console.warn("fetchComplaints failed:", e);
    }
  },

  fetchResults: async (schoolId) => {
    try {
      let query = supabase.from("results").select("*, student:students(*)").order("created_at", { ascending: false });
      if (schoolId) query = query.eq("school_id", schoolId);
      const { data } = await query;
      if (data) set({ results: data as unknown as Result[] });
    } catch (e) {
      console.warn("fetchResults failed:", e);
    }
  },

  fetchAnnouncements: async (schoolId) => {
    try {
      let query = supabase.from("announcements").select("*").order("created_at", { ascending: false });
      if (schoolId) query = query.eq("school_id", schoolId);
      const { data } = await query;
      if (data) set({ announcements: data as unknown as Announcement[] });
    } catch (e) {
      console.warn("fetchAnnouncements failed:", e);
    }
  },

  fetchAll: async (schoolId) => {
    set({ loading: true });
    const store = get();
    try {
      await Promise.all([
        store.fetchStudents(schoolId),
        store.fetchHomework(schoolId),
        store.fetchComplaints(schoolId),
        store.fetchResults(schoolId),
        store.fetchAnnouncements(schoolId),
      ]);
    } catch (e) {
      console.warn("fetchAll failed:", e);
    }
    set({ loading: false });
  },

  addStudent: async (student, manualKey, schoolId) => {
    const {
      data: { user },
    } = await supabase.auth.getUser();
    const { data, error } = await supabase
      .from("students")
      .insert([
        {
          name: student.name,
          standard: student.standard,
          section: student.section,
          roll_no: student.roll_no || null,
          parent_name: student.parent_name || null,
          parent_contact: student.parent_contact || null,
          avatar_url: student.avatar_url || null,
          secret_id: manualKey || "TEMP",
          school_id: schoolId || null,
          created_by: user?.id || null,
        } as any,
      ])
      .select()
      .single();
    if (data && !error) {
      set((state) => ({ students: [data as unknown as Student, ...state.students] }));
      return data as unknown as Student;
    }
    return null;
  },

  updateStudent: async (id, updatedData) => {
    const { error } = await supabase
      .from("students")
      .update(updatedData as any)
      .eq("id", id);
    if (!error) {
      set((state) => ({
        students: state.students.map((s) => (s.id === id ? { ...s, ...updatedData } : s)),
      }));
    }
  },

  deleteStudent: async (id) => {
    const { error } = await supabase.from("students").delete().eq("id", id);
    if (!error) {
      set((state) => ({ students: state.students.filter((s) => s.id !== id) }));
    }
  },

  addHomework: async (hw) => {
    const {
      data: { user },
    } = await supabase.auth.getUser();
    const { data, error } = await supabase
      .from("homework")
      .insert({
        standard: hw.standard,
        section: hw.section,
        subject: hw.subject,
        description: hw.description,
        file_url: hw.file_url || null,
        school_id: hw.school_id,
        created_by: user?.id || null,
      })
      .select()
      .single();
    if (error) {
      console.error("addHomework error:", error);
      throw error;
    }
    if (data) {
      set((state) => ({ homework: [data as unknown as Homework, ...state.homework] }));
    }
  },

  addComplaint: async (complaint) => {
    const {
      data: { user },
    } = await supabase.auth.getUser();
    const { data, error } = await supabase
      .from("complaints")
      .insert({
        student_id: complaint.student_id,
        description: complaint.description,
        file_url: complaint.file_url || null,
        school_id: complaint.school_id,
        created_by: user?.id || null,
      })
      .select("*, student:students(*)")
      .single();
    if (data && !error) {
      set((state) => ({ complaints: [data as unknown as Complaint, ...state.complaints] }));
    }
  },

  addResult: async (result) => {
    const {
      data: { user },
    } = await supabase.auth.getUser();
    const { data, error } = await supabase
      .from("results")
      .insert({
        student_id: result.student_id,
        subject: result.subject,
        marks_obtained: result.marks_obtained,
        total_marks: result.total_marks,
        percentage: result.total_marks > 0 ? Math.round((result.marks_obtained / result.total_marks) * 100) : 0,
        file_name: result.file_name || null,
        school_id: result.school_id,
        created_by: user?.id || null,
      })
      .select("*, student:students(*)")
      .single();
    if (data && !error) {
      set((state) => ({ results: [data as unknown as Result, ...state.results] }));
    }
  },

  addAnnouncement: async (announcement) => {
    const {
      data: { user },
    } = await supabase.auth.getUser();
    const { data, error } = await supabase
      .from("announcements")
      .insert({
        title: announcement.title || null,
        content: announcement.content || null,
        type: announcement.type || null,
        school_id: announcement.school_id,
        created_by: user?.id || null,
      })
      .select()
      .single();
    if (data && !error) {
      set((state) => ({ announcements: [data as unknown as Announcement, ...state.announcements] }));
    }
  },

  getStudentsByClass: (standard, section) => {
    const state = get();
    return state.students.filter((s) => {
      if (standard && section) return s.standard === standard && s.section === section;
      if (standard) return s.standard === standard;
      return true;
    });
  },

  getResultsByStudent: (studentId) => {
    const state = get();
    return state.results.filter((r) => r.student_id === studentId);
  },
}));

export default useAppStore;
