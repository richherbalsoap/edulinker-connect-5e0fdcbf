import { supabase } from "@/integrations/supabase/client";

/**
 * Native Android bridge.
 *
 * Android (MainActivity.java) calls:
 *   webView.evaluateJavascript("window.onNativeTokenReceived('" + token + "')", null);
 *
 * We save the FCM token into the `fcm_tokens` table keyed by the logged-in
 * user's id (stored in the table's `student_id` text column — the column is
 * loosely typed and shared with the student app). The Supabase
 * `send-notification` edge function reads from this table to deliver pushes.
 */

let lastSavedToken: string | null = null;

const persistToken = async (token: string) => {
  if (!token || token === lastSavedToken) return;

  try {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      // Not logged in yet — retry once auth is ready.
      pendingToken = token;
      return;
    }

    const ownerKey = user.id;

    // Remove any previous rows for this owner so we don't accumulate stale tokens.
    await supabase.from("fcm_tokens").delete().eq("student_id", ownerKey);

    const { error } = await supabase
      .from("fcm_tokens")
      .insert({ student_id: ownerKey, token });

    if (error) {
      console.error("[nativeBridge] Failed to save FCM token:", error.message);
      return;
    }

    lastSavedToken = token;
    console.log("[nativeBridge] FCM token saved for user", ownerKey);
  } catch (e) {
    console.error("[nativeBridge] Unexpected error saving FCM token:", e);
  }
};

let pendingToken: string | null = null;

export const initNativeBridge = () => {
  if (typeof window === "undefined") return;

  // Exposed for native Android to call via evaluateJavascript().
  (window as unknown as { onNativeTokenReceived?: (token: string) => void })
    .onNativeTokenReceived = (token: string) => {
    void persistToken(token);
  };

  // If the token arrived before the user logged in, retry on auth changes.
  supabase.auth.onAuthStateChange((_event, session) => {
    if (session?.user && pendingToken) {
      const t = pendingToken;
      pendingToken = null;
      void persistToken(t);
    }
  });
};