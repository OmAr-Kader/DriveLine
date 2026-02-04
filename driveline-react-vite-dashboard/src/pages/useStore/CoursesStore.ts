// store/useUsersStore.ts
import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { apiClient } from '../../api/client';
import { ENDPOINTS } from '../../api/config';
import type { Course, GetCoursesResponse } from '../../dto/Course';

interface CoursesStore {
  courses: Course[];
  loading: boolean;
  // returns true if new items were loaded, false if none / end reached
  fetchCourses: (force?: boolean) => Promise<boolean>;
  fetchCourse: (id: string) => Promise<Course | null>;
  deleteCourse: (id: string) => Promise<void>;
  clearStore: () => void;
  setLoading: (loading: boolean) => void;
}

export const useCoursesStore = create<CoursesStore>()(
  persist( // This adds localStorage persistence automatically
    (set, get) => ({
      courses: [],
      loading: true,
      fetchCourses: async (force = false) => {
        if (get().loading) return false;
          const isInitialFetch = get().courses.length === 0;
          if (isInitialFetch || force) {
            set({ loading: true });
          }
          try {
            const skip = get().courses.length;
            const data = (await apiClient.get<GetCoursesResponse>(ENDPOINTS.courses.getAll(200, skip))).data;
            const coursesMerge = get().courses.concat(data);
            const courses = Array.from(
              new Map(coursesMerge.map(item => [item.id, item])).values()
            );
            set({ courses, loading: false });
            return true;
        } catch (error) {
            console.error('Failed to fetch courses:', error);
            set({ loading: false });
            return false;
        }
      },
      fetchCourse: async (id: string) => {
        set({ loading: true });
        try {
          const found = get().courses.find(c => c.id === id) ?? null;
          set({ loading: false });
          return found;
        } catch (error) {
          console.error('Failed to fetch course from cache:', error);
          set({ loading: false });
          return null;
        }
      },
      deleteCourse: async (id: string) => {
        set({ loading: true });
        try {
            await apiClient.delete(ENDPOINTS.courses.delete(id));
            const updatedCourses = get().courses.filter(course => course.id !== id);
            set({ courses: updatedCourses, loading: false });
        } catch (error) {
            console.error('Failed to delete course:', error);
            set({ loading: false });
        }
      },
      clearStore: () => {
        set({ courses: [], loading: false });
      },
      setLoading: (loading) => set({ loading }),
    }),
    {
      name: 'courses-storage', // localStorage key
    }
  )
);