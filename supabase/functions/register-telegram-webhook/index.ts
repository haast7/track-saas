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
          "Access-Control-Allow-Headers": "Content-Type, Authorization"
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
    const { botToken, webhookUrl } = body;

    // Validação
    if (!botToken || !webhookUrl) {
      return new Response(JSON.stringify({
        error: "botToken and webhookUrl are required"
      }), {
        status: 400,
        headers: {
          "Content-Type": "application/json"
        }
      });
    }

    // Registrar webhook no Telegram
    const telegramUrl = `https://api.telegram.org/bot${botToken}/setWebhook`;
    
    const telegramResponse = await fetch(telegramUrl, {
      method: "POST",
      headers: {
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        url: webhookUrl
      })
    });

    if (!telegramResponse.ok) {
      const errorData = await telegramResponse.json();
      return new Response(JSON.stringify({
        error: "Failed to register webhook",
        details: errorData.description || errorData.message
      }), {
        status: telegramResponse.status,
        headers: {
          "Content-Type": "application/json"
        }
      });
    }

    const telegramData = await telegramResponse.json();

    return new Response(JSON.stringify({
      success: true,
      result: telegramData
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




