import { createClient } from '@supabase/supabase-js'
import { NextRequest, NextResponse } from 'next/server'
import { getJSTDateString } from '../../../lib/date'

export async function GET(req: NextRequest) {
  // BOT_SECRETで認証（Threadsボットのみアクセス可）
  const authHeader = req.headers.get('authorization')
  if (authHeader !== `Bearer ${process.env.BOT_SECRET}`) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const userId = process.env.BOT_USER_ID
  if (!userId) {
    return NextResponse.json({ error: 'BOT_USER_ID not configured' }, { status: 500 })
  }

  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  )

  const today = getJSTDateString()
  const yesterday = getJSTDateString(new Date(Date.now() - 24 * 60 * 60 * 1000))

  const [weightResult, todayMealsResult, yesterdayMealsResult, goalResult] = await Promise.all([
    supabase
      .from('weight_records')
      .select('weight, recorded_at')
      .eq('user_id', userId)
      .order('recorded_at', { ascending: false })
      .limit(7),
    supabase
      .from('meal_records')
      .select('food_name, meal_type, calories, protein, fat, carbs')
      .eq('user_id', userId)
      .eq('recorded_at', today),
    supabase
      .from('meal_records')
      .select('food_name, meal_type, calories, protein, fat, carbs')
      .eq('user_id', userId)
      .eq('recorded_at', yesterday),
    supabase
      .from('user_goals')
      .select('protein, fat, carbs, target_cal, goal_weight')
      .eq('user_id', userId)
      .single(),
  ])

  const weights = weightResult.data || []
  const latestWeight = weights[0] || null
  const prevWeight = weights[1] || null
  const weightDiff = latestWeight && prevWeight
    ? Math.round((latestWeight.weight - prevWeight.weight) * 10) / 10
    : null

  const calcPFC = (meals: any[]) => ({
    calories: Math.round(meals.reduce((s, m) => s + (m.calories || 0), 0)),
    protein: Math.round(meals.reduce((s, m) => s + (m.protein || 0), 0) * 10) / 10,
    fat: Math.round(meals.reduce((s, m) => s + (m.fat || 0), 0) * 10) / 10,
    carbs: Math.round(meals.reduce((s, m) => s + (m.carbs || 0), 0) * 10) / 10,
  })

  const todayMeals = todayMealsResult.data || []
  const yesterdayMeals = yesterdayMealsResult.data || []

  return NextResponse.json({
    today,
    latest_weight: latestWeight ? {
      weight: latestWeight.weight,
      recorded_at: latestWeight.recorded_at,
      diff: weightDiff,
      prev_weight: prevWeight?.weight ?? null,
    } : null,
    weight_history: weights,
    today_meals: todayMeals,
    today_pfc: calcPFC(todayMeals),
    yesterday_meals: yesterdayMeals,
    yesterday_pfc: calcPFC(yesterdayMeals),
    goals: goalResult.data ?? null,
  })
}
