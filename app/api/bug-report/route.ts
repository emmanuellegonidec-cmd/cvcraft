import { createClient as createSupabaseClient } from "@supabase/supabase-js";
import { createClient } from "@/lib/supabase/server";
import { NextRequest, NextResponse } from "next/server";

const createAuthedClient = () =>
  createSupabaseClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  );

async function getAuth(req: NextRequest) {
  const authHeader = req.headers.get("authorization");
  const token = authHeader?.replace("Bearer ", "").trim();

  if (token) {
    const admin = createAuthedClient();
    const { data: { user } } = await admin.auth.getUser(token);
    if (user) return user;
  }

  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  return user ?? null;
}

export async function POST(req: NextRequest) {
  try {
    const user = await getAuth(req);

    if (!user) {
      return NextResponse.json({ error: "Non autorisé" }, { status: 401 });
    }

    const body = await req.json();
    const { page, what_happened, expected } = body;

    const admin = createAuthedClient();
    const { error: dbError } = await admin.from("bug_reports").insert({
      user_id: user.id,
      user_email: user.email,
      page,
      what_happened,
      expected,
    });

    if (dbError) throw dbError;

    await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${process.env.RESEND_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        from: "Jean find my Job <hello@jeanfindmyjob.fr>",
        to: ["hello@jeanfindmyjob.fr"],
        subject: `🐛 Nouveau bug signalé par ${user.email}`,
        html: `
          <h2>Bug signalé via le chatbot</h2>
          <p><strong>Utilisateur :</strong> ${user.email}</p>
          <p><strong>Page :</strong> ${page}</p>
          <p><strong>Ce qui s'est passé :</strong> ${what_happened}</p>
          <p><strong>Ce qui était attendu :</strong> ${expected}</p>
          <p><em>Reçu le ${new Date().toLocaleString("fr-FR")}</em></p>
        `,
      }),
    });

    return NextResponse.json({ success: true });
  } catch (err) {
    console.error("Bug report error:", err);
    return NextResponse.json({ error: "Erreur serveur" }, { status: 500 });
  }
}