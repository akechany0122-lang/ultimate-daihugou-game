import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from "https://esm.sh/@supabase/supabase-js@2"

serve(async (req) => {
  const corsHeaders = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  }
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_ANON_KEY') ?? '',
      { global: { headers: { Authorization: req.headers.get('Authorization')! } } }
    )

    const { room_id } = await req.json()

    // 1. 部屋の取得
    const { data: room, error: roomError } = await supabaseClient
      .from('rooms')
      .select('*')
      .eq('id', room_id)
      .single()
    if (roomError || !room) throw new Error('Room not found')

    // 2. 状態の更新 (ターン進行とパスカウント増加)
    const nextTurn = (room.current_turn_index + 1) % 4
    let passCount = room.pass_count + 1
    let fieldCards = room.field_cards

    // 全員(自分以外の3人)がパスした場合、場を流す
    if (passCount >= 3) {
      passCount = 0
      fieldCards = []
    }

    await supabaseClient
      .from('rooms')
      .update({
        field_cards: fieldCards,
        pass_count: passCount,
        current_turn_index: nextTurn
      })
      .eq('id', room_id)
    
    return new Response(
      JSON.stringify({ success: true, nextTurn, passCount, fieldCleared: passCount === 0 }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )

  } catch (error) {
    return new Response(
      JSON.stringify({ error: error.message }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 400 }
    )
  }
})
