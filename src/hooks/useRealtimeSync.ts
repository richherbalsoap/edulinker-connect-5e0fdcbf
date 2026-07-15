import { useEffect, useRef } from "react";
import useAppStore from "@/store/appStore";

export function useRealtimeSync(schoolId: string | null | undefined) {
  const intervalRef = useRef<number | null>(null);

  useEffect(() => {
    if (!schoolId) return;

    const store = useAppStore.getState();

    // Polling interval (every 10 seconds)
    const interval = window.setInterval(() => {
      // Re-fetch everything
      store.fetchStudents(schoolId);
      store.fetchHomework(schoolId);
      store.fetchComplaints(schoolId);
      store.fetchResults(schoolId);
      store.fetchAnnouncements(schoolId);
    }, 10000);

    intervalRef.current = interval;

    return () => {
      if (intervalRef.current) {
        window.clearInterval(intervalRef.current);
        intervalRef.current = null;
      }
    };
  }, [schoolId]);
}
