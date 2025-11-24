import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { createClient } from "jsr:@supabase/supabase-js@2";

Deno.serve(async (req) => {
  try {
    // CORS headers
    if (req.method === "OPTIONS") {
      return new Response(null, {
        status: 204,
        headers: {
          "Access-Control-Allow-Origin": "*",
          "Access-Control-Allow-Methods": "POST, OPTIONS",
          "Access-Control-Allow-Headers": "Content-Type"
        }
      });
    }

    if (req.method !== "POST") {
      return new Response(JSON.stringify({
        error: "Method not allowed"
      }), {
        status: 405,
        headers: {
          "Content-Type": "application/json"
        }
      });
    }

    const body = await req.json();
    const { sessionId, funnelId, url, userAgent } = body;

    // Validação
    if (!funnelId || !url) {
      return new Response(JSON.stringify({
        error: "funnelId and url are required"
      }), {
        status: 400,
        headers: {
          "Content-Type": "application/json"
        }
      });
    }

    // Criar cliente Supabase
    const supabaseUrl = Deno.env.get("SUPABASE_URL");
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // Validar se o funnel existe e obter user_id
    const { data: funnel, error: funnelError } = await supabase
      .from("funnels")
      .select("id, user_id")
      .eq("id", funnelId)
      .single();

    if (funnelError || !funnel) {
      return new Response(JSON.stringify({
        error: "Funnel not found or inactive"
      }), {
        status: 404,
        headers: {
          "Content-Type": "application/json"
        }
      });
    }

    // Validar se sessionId não existe -> criar registro em tracking_sessions
    if (sessionId) {
      const { data: existingSession, error: checkError } = await supabase
        .from("tracking_sessions")
        .select("id")
        .eq("session_id", sessionId)
        .single();

      // Se não existe, criar novo registro
      if (!existingSession && checkError?.code === "PGRST116") {
        const { error: insertError } = await supabase
          .from("tracking_sessions")
          .insert({
            session_id: sessionId,
            funnel_id: funnelId,
            user_agent: userAgent || null,
            ip_address: null // IP será obtido pelo backend se necessário
          });

        if (insertError) {
          console.error("Error creating tracking session:", insertError);
          // Não falha a requisição se não conseguir criar a sessão
        }
      }
    }

    // Inserir registro em pageviews
    const { data: pageview, error: pageviewError } = await supabase
      .from("pageviews")
      .insert({
        funnel_id: funnelId,
        session_id: sessionId || null,
        url: url
      })
      .select("id")
      .single();

    if (pageviewError) {
      return new Response(JSON.stringify({
        error: "Failed to create pageview",
        details: pageviewError.message
      }), {
        status: 500,
        headers: {
          "Content-Type": "application/json"
        }
      });
    }

    return new Response(JSON.stringify({
      success: true
    }), {
      status: 200,
      headers: {
        "Content-Type": "application/json",
        "Access-Control-Allow-Origin": "*"
      }
    });
  } catch (error) {
    return new Response(JSON.stringify({
      error: "Internal server error",
      details: error.message
    }), {
      status: 500,
      headers: {
        "Content-Type": "application/json"
      }
    });
  }
});


