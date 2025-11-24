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
    const { sessionId, funnelId, buttonId, url } = body;

    // Validação
    if (!funnelId || !buttonId) {
      return new Response(JSON.stringify({
        error: "funnelId and buttonId are required"
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

    // Buscar user_id do funnel
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

    // Preparar dados do click
    const clickData: any = {
      funnel_id: funnelId,
      button_id: buttonId,
      url: url || null,
      session_id: sessionId || null
    };

    // Inserir registro em clicks
    const { data: click, error: clickError } = await supabase
      .from("clicks")
      .insert(clickData)
      .select("id")
      .single();

    if (clickError) {
      return new Response(JSON.stringify({
        error: "Failed to create click",
        details: clickError.message
      }), {
        status: 500,
        headers: {
          "Content-Type": "application/json"
        }
      });
    }

    // Se o buttonId for "telegram", buscar o canal e retornar o link
    let telegramLink = null;
    if (buttonId === "telegram" && sessionId) {
      // Buscar o canal do Telegram do usuário
      const { data: channel, error: channelError } = await supabase
        .from("telegram_channels")
        .select("channel_name")
        .eq("user_id", funnel.user_id)
        .limit(1)
        .single();

      if (!channelError && channel && channel.channel_name) {
        // Formatar link do Telegram com sessionId
        // Formato: https://t.me/{channel_name}?s={sessionId}
        telegramLink = `https://t.me/${channel.channel_name}?s=${sessionId}`;
      }
    }

    // Preparar resposta
    const response: any = {
      success: true,
      clickId: click.id
    };

    // Se for telegram, adicionar o link na resposta
    if (telegramLink) {
      response.telegramLink = telegramLink;
    }

    return new Response(JSON.stringify(response), {
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

