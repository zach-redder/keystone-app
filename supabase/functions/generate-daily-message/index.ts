// File: supabase/functions/generate_daily_reminders/index.ts
import { serve } from "https://deno.land/std@0.192.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
// Create Supabase client
const supabase = createClient(Deno.env.get("PUBLIC_SUPABASE_URL"), Deno.env.get("SERVICE_ROLE_KEY"));
const BACKEND_API_URL = Deno.env.get("DAILY_MSG_API_URL");
const API_SECRET = Deno.env.get("INTERNAL_API_SECRET");
serve(async ()=>{
  const now = new Date();
  const inactiveThreshold = new Date(now);
  inactiveThreshold.setDate(now.getDate() - 3);
  // ✅ Step 1: Use RPC to fetch user_id, last_sign_in_at, ai_persona
  const { data: users, error } = await supabase.rpc("get_active_users_with_persona");
  if (error || !users) {
    console.error("Error fetching users:", error);
    return new Response("Failed to fetch users", {
      status: 500
    });
  }
  for (const user of users){
    const userId = user.user_id;
    const lastSignIn = new Date(user.last_sign_in_at);
    if (lastSignIn < inactiveThreshold) continue;
    const ai_personality = user.ai_persona ?? "";
    // ✅ Step 2: Get user keys
    const { data: keys, error: keyError } = await supabase.from("user_keys").select("category, description").eq("user_id", userId);
    if (keyError || !keys) {
      console.warn(`No keys for user ${userId}`);
      continue;
    }
    // ✅ Step 3: Structure keys by category
    const identity = {
      core_values: [],
      identity_traits: [],
      future_self_vision: [],
      life_goals: [],
      avoidances: [],
      motivations: []
    };
    for (const { category, description } of keys){
      if (identity[category]) {
        identity[category].push(description);
      }
    }
    // ✅ Step 4: Get preferred reminder time
    const { data: preferences, error: prefError } = await supabase
      .from("user_preferences")
      .select("preferred_reminder_time")
      .eq("user_id", userId)
      .single();

    if (prefError || !preferences?.preferred_reminder_time) {
      console.warn(`Missing preferred reminder time for user ${userId}`);
      continue;
    }

    // Extract hour from preferred_reminder_time
    const reminderHour = new Date(`1970-01-01T${preferences.preferred_reminder_time}`).getHours();

    let time_of_day;
    if (reminderHour >= 5 && reminderHour < 11) time_of_day = "morning";
    else if (reminderHour >= 11 && reminderHour < 17) time_of_day = "afternoon";
    else if (reminderHour >= 17 && reminderHour < 21) time_of_day = "evening";
    else time_of_day = "night";
    // ✅ Step 5: Call backend to generate message
    console.log("Fetching...");
    const response = await fetch(BACKEND_API_URL, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-api-key": API_SECRET
      },
      body: JSON.stringify({
        user_id: userId,
        time_of_day,
        ai_personality,
        ...identity
      })
    });
    if (!response.ok) {
      console.error(`Failed to generate message for user ${userId}`);
      continue;
    }
    const result = await response.json();
    const message = result.message;
    if (message) {
      await supabase.from("user_daily_reminders").insert({
        user_id: userId,
        message
      });
    }
  }
  return new Response("Daily reminders processed", {
    status: 200
  });
});
