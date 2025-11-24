import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { createClient } from "jsr:@supabase/supabase-js@2";

// Função para enviar evento para Meta (adaptada para Edge Function)
async function sendMetaEvent({
  pixelId,
  accessToken,
  eventName,
  sessionId,
}: {
  pixelId: string;
  accessToken: string;
  eventName: string;
  sessionId?: string;
}) {
  const url = `https://graph.facebook.com/v21.0/${pixelId}/events`;

  const body = {
    data: [
      {
        event_name: eventName,
        event_time: Math.floor(Date.now() / 1000),
        event_source_url: "telegram",
        action_source: "system_generated" as const,
        user_data: {
          client_user_agent: "telegram_bot",
          ...(sessionId && { external_id: [sessionId] }),
        },
      },
    ],
    access_token: accessToken,
  };

  try {
    const response = await fetch(url, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(body),
    });

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(
        `Meta Conversion API error: ${JSON.stringify(errorData)}`
      );
    }

    const data = await response.json();
    return data;
  } catch (error) {
    console.error("Error sending Meta event:", error);
    throw error;
  }
}

// Função para executar postbacks (simplificada para Edge Function)
async function executePostbacks(
  eventType: string,
  eventData: any,
  userId: string
) {
  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL");
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    const { data: postbacks } = await supabase
      .from("postbacks")
      .select("*")
      .eq("event", eventType)
      .eq("is_active", true)
      .eq("user_id", userId);

    if (!postbacks || postbacks.length === 0) {
      return;
    }

    for (const postback of postbacks) {
      try {
        const payload = {
          event: eventType,
          timestamp: new Date().toISOString(),
          ...eventData,
        };

        const options: RequestInit = {
          method: postback.method || "POST",
          headers: {
            "Content-Type": "application/json",
          },
        };

        if (postback.method === "POST" || postback.method === "PUT") {
          options.body = JSON.stringify(payload);
        }

        await fetch(postback.destination_url, {
          ...options,
          signal: AbortSignal.timeout(5000),
        }).catch(() => {});
      } catch (error) {
        console.error(`Error executing postback ${postback.name}:`, error);
      }
    }
  } catch (error) {
    console.error("Error in executePostbacks:", error);
  }
}

Deno.serve(async (req) => {
  try {
    // CORS headers
    if (req.method === "OPTIONS") {
      return new Response(null, {
        status: 204,
        headers: {
          "Access-Control-Allow-Origin": "*",
          "Access-Control-Allow-Methods": "POST, OPTIONS",
          "Access-Control-Allow-Headers": "Content-Type",
        },
      });
    }

    if (req.method !== "POST") {
      return new Response(
        JSON.stringify({
          error: "Method not allowed",
        }),
        {
          status: 405,
          headers: {
            "Content-Type": "application/json",
          },
        }
      );
    }

    const body = await req.json();

    // Criar cliente Supabase
    const supabaseUrl = Deno.env.get("SUPABASE_URL");
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    const message = body.message;
    if (!message) {
      return new Response(
        JSON.stringify({
          success: true,
          message: "No message to process",
        }),
        {
          status: 200,
          headers: {
            "Content-Type": "application/json",
          },
        }
      );
    }

    // Detectar ENTER (new_chat_members)
    if (
      message.new_chat_members &&
      Array.isArray(message.new_chat_members) &&
      message.new_chat_members.length > 0
    ) {
      const member = message.new_chat_members[0];

      // Ignorar bots
      if (member.is_bot) {
        return new Response(
          JSON.stringify({
            success: true,
            message: "Bot event ignored",
          }),
          {
            status: 200,
            headers: {
              "Content-Type": "application/json",
            },
          }
        );
      }

      const tgUserId = member.id;

      // Buscar click mais recente com session_id
      const { data: click } = await supabase
        .from("clicks")
        .select("*")
        .not("session_id", "is", null)
        .order("created_at", { ascending: false })
        .limit(1)
        .single();

      if (click) {
        // Buscar funil
        const { data: funnel } = await supabase
          .from("funnels")
          .select("*")
          .eq("id", click.funnel_id)
          .single();

        if (funnel) {
          // Buscar pixel
          let pixel = null;
          if (funnel.pixel_id) {
            const { data: pixelData } = await supabase
              .from("pixels")
              .select("*")
              .eq("id", funnel.pixel_id)
              .single();

            if (pixelData) {
              pixel = pixelData;
            }
          }

          // Criar evento ENTER
          const { data: entry } = await supabase
            .from("telegram_events")
            .insert({
              funnel_id: funnel.id,
              session_id: click.session_id,
              event_type: "ENTER",
              telegram_user_id: tgUserId.toString(),
            })
            .select()
            .single();

          // Enviar CAPI (em background)
          if (pixel && pixel.pixel_id && pixel.token) {
            sendMetaEvent({
              pixelId: pixel.pixel_id,
              accessToken: pixel.token,
              eventName: "enter_channel",
              sessionId: click.session_id || undefined,
            }).catch(() => {});
          }

          // Executar postbacks (em background)
          if (entry) {
            executePostbacks(
              "Entrada no Canal",
              {
                funnel_id: funnel.id,
                session_id: click.session_id,
                telegram_user_id: tgUserId.toString(),
                event_id: entry.id,
              },
              funnel.user_id
            ).catch(() => {});
          }
        }
      }

      return new Response(JSON.stringify({ success: true }), {
        status: 200,
        headers: { "Content-Type": "application/json" },
      });
    }

    // Detectar EXIT (left_chat_member)
    if (message.left_chat_member) {
      const member = message.left_chat_member;

      // Ignorar bots
      if (member.is_bot) {
        return new Response(
          JSON.stringify({
            success: true,
            message: "Bot event ignored",
          }),
          {
            status: 200,
            headers: {
              "Content-Type": "application/json",
            },
          }
        );
      }

      const tgUserId = member.id;

      // Buscar evento ENTER mais recente deste usuário
      const { data: enterEvent } = await supabase
        .from("telegram_events")
        .select("*, funnels:funnel_id (*)")
        .eq("telegram_user_id", tgUserId.toString())
        .eq("event_type", "ENTER")
        .order("created_at", { ascending: false })
        .limit(1)
        .single();

      if (enterEvent && enterEvent.funnels) {
        const funnel = enterEvent.funnels;

        // Criar evento EXIT
        const { data: exitEvent } = await supabase
          .from("telegram_events")
          .insert({
            funnel_id: funnel.id,
            session_id: enterEvent.session_id,
            event_type: "EXIT",
            telegram_user_id: tgUserId.toString(),
          })
          .select()
          .single();

        // Buscar pixel
        if (funnel.pixel_id) {
          const { data: pixel } = await supabase
            .from("pixels")
            .select("*")
            .eq("id", funnel.pixel_id)
            .single();

          // Enviar CAPI (em background)
          if (pixel && pixel.pixel_id && pixel.token) {
            sendMetaEvent({
              pixelId: pixel.pixel_id,
              accessToken: pixel.token,
              eventName: "exit_channel",
              sessionId: enterEvent.session_id || undefined,
            }).catch(() => {});
          }
        }

        // Executar postbacks (em background)
        if (exitEvent) {
          executePostbacks(
            "Saída do Canal",
            {
              funnel_id: funnel.id,
              session_id: enterEvent.session_id,
              telegram_user_id: tgUserId.toString(),
              event_id: exitEvent.id,
            },
            funnel.user_id
          ).catch(() => {});
        }
      }

      return new Response(JSON.stringify({ success: true }), {
        status: 200,
        headers: { "Content-Type": "application/json" },
      });
    }

    // Se não for nem ENTER nem EXIT
    return new Response(
      JSON.stringify({
        success: true,
        message: "No relevant event",
      }),
      {
        status: 200,
        headers: {
          "Content-Type": "application/json",
        },
      }
    );
  } catch (error: any) {
    return new Response(
      JSON.stringify({
        error: "Internal server error",
        details: error.message,
      }),
      {
        status: 500,
        headers: {
          "Content-Type": "application/json",
        },
      }
    );
  }
});
