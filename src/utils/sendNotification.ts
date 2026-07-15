import { apiClient } from "@/lib/apiClient";

const EDGE_FUNCTION_URL = `${import.meta.env.VITE_WORKER_URL || "https://edulinker-worker.dominatorenterprise04.workers.dev"}/api/send-notification`;
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
