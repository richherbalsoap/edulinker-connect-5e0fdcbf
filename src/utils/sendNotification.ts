import { supabase } from "@/integrations/supabase/client";

const EDGE_FUNCTION_URL = "https://sdvxekymbfyrznhuvvtj.supabase.co/functions/v1/send-notification";

export const sendNotification = async (type: string, data: object) => {
  try {
    await fetch(EDGE_FUNCTION_URL, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ type, data }),
    });
  } catch (err) {
    console.error("Notification send failed:", err);
  }
};
