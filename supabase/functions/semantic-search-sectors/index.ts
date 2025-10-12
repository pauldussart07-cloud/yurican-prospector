import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { query } = await req.json();
    
    if (!query || query.trim() === "") {
      return new Response(
        JSON.stringify({ suggestions: [] }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) {
      throw new Error("LOVABLE_API_KEY is not configured");
    }

    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    // Récupérer tous les secteurs disponibles
    const { data: sectors, error: sectorsError } = await supabase
      .from("sectors")
      .select("name");

    if (sectorsError) {
      throw sectorsError;
    }

    const sectorNames = sectors?.map(s => s.name) || [];
    
    if (sectorNames.length === 0) {
      return new Response(
        JSON.stringify({ suggestions: [] }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Utiliser l'IA pour trouver les secteurs pertinents
    const aiResponse = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${LOVABLE_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "google/gemini-2.5-flash",
        messages: [
          {
            role: "system",
            content: `Tu es un assistant qui aide à trouver les secteurs d'activité correspondant à une description. 
Voici la liste complète des secteurs disponibles: ${sectorNames.join(", ")}.
Tu dois retourner uniquement les secteurs les plus pertinents (maximum 5) qui correspondent à la description de l'utilisateur.
Réponds UNIQUEMENT avec les noms des secteurs séparés par des virgules, sans autre texte.`
          },
          {
            role: "user",
            content: query
          }
        ],
      }),
    });

    if (!aiResponse.ok) {
      if (aiResponse.status === 429) {
        return new Response(
          JSON.stringify({ error: "Limite de requêtes atteinte, réessayez plus tard." }),
          { status: 429, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }
      if (aiResponse.status === 402) {
        return new Response(
          JSON.stringify({ error: "Crédits insuffisants." }),
          { status: 402, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }
      throw new Error("Erreur lors de l'appel à l'IA");
    }

    const aiData = await aiResponse.json();
    const aiSuggestions = aiData.choices?.[0]?.message?.content || "";
    
    // Parser les suggestions de l'IA et filtrer pour ne garder que les secteurs valides
    const suggestedSectors = aiSuggestions
      .split(",")
      .map((s: string) => s.trim())
      .filter((s: string) => sectorNames.includes(s))
      .slice(0, 5);

    return new Response(
      JSON.stringify({ suggestions: suggestedSectors }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (error) {
    console.error("Error:", error);
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : "Erreur inconnue" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
