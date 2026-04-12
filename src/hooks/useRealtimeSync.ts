import { useEffect, useRef } from "react";
import { supabase } from "@/integrations/supabase/client";
import useAppStore from "@/store/appStore";

const TABLES = ["students", "homework", "complaints", "results", "announcements"] as const;

export function useRealtimeSync(schoolId: string | null | undefined) {
  const channelRef = useRef<ReturnType<typeof supabase.channel> | null>(null);

  useEffect(() => {
    if (!schoolId) return;

    const store = useAppStore.getState();

    // Clean up previous channel
    if (channelRef.current) {
      supabase.removeChannel(channelRef.current);
    }

    const channel = supabase.channel(`realtime-sync-${schoolId}`);

    TABLES.forEach((table) => {
      channel.on(
        "postgres_changes" as any,
        { event: "*", schema: "public", table, filter: `school_id=eq.${schoolId}` },
        () => {
          // Re-fetch the changed table
          switch (table) {
            case "students":
              store.fetchStudents(schoolId);
              break;
            case "homework":
              store.fetchHomework(schoolId);
              break;
            case "complaints":
              store.fetchComplaints(schoolId);
              break;
            case "results":
              store.fetchResults(schoolId);
              break;
            case "announcements":
              store.fetchAnnouncements(schoolId);
              break;
          }
        }
      );
    });

    channel.subscribe();
    channelRef.current = channel;

    return () => {
      if (channelRef.current) {
        supabase.removeChannel(channelRef.current);
        channelRef.current = null;
      }
    };
  }, [schoolId]);
}
