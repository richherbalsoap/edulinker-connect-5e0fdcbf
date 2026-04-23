import "https://deno.land/x/xhr@0.1.0/mod.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

interface WelcomePayload {
  email?: string;
  schoolName?: string;
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const RESEND_API_KEY = Deno.env.get("RESEND_API_KEY");
    if (!RESEND_API_KEY) {
      console.error("RESEND_API_KEY missing");
      return new Response(JSON.stringify({ error: "Email service not configured" }), {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const { email, schoolName }: WelcomePayload = await req.json().catch(() => ({}));
    if (!email) {
      return new Response(JSON.stringify({ error: "Missing email" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const displayName = schoolName?.trim() || "there";
    const html = `
      <div style="font-family: Arial, sans-serif; background:#ffffff; padding:24px; color:#0f172a;">
        <div style="max-width:520px; margin:0 auto; border:1px solid #f5d76e; border-radius:12px; padding:28px;">
          <h1 style="color:#b8860b; margin:0 0 12px; font-size:22px;">Welcome to EDULinker, ${displayName}! 🎉</h1>
          <p style="font-size:15px; line-height:1.55; margin:0 0 16px;">
            Your school management account has been created. Please verify your email to start managing students,
            homework, fees, results and announcements — all in one place.
          </p>
          <p style="font-size:14px; line-height:1.55; color:#475569; margin:0 0 20px;">
            After verifying, sign in and set up your secure 4-digit PIN to protect Principal Tools.
          </p>
          <p style="font-size:13px; color:#94a3b8; margin:24px 0 0;">— The EDULinker Team</p>
        </div>
      </div>
    `;

    const resp = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${RESEND_API_KEY}`,
      },
      body: JSON.stringify({
        from: "EDULinker <onboarding@resend.dev>",
        to: [email],
        subject: "Welcome to EDULinker 🎓",
        html,
      }),
    });

    const result = await resp.json();
    if (!resp.ok) {
      console.error("Resend send failed:", result);
      return new Response(JSON.stringify({ error: "Send failed", detail: result }), {
        status: 502,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    return new Response(JSON.stringify({ ok: true, id: result.id }), {
      status: 200,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (e) {
    console.error("send-welcome-email error:", e);
    return new Response(JSON.stringify({ error: "Internal error" }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
