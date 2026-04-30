'use client'
import { useState, useEffect } from 'react'
import { supabase } from '../lib/supabase'
import Link from 'next/link'

export default function Home() {
  const [goal, setGoal] = useState(null)
  const [todayRecords, setTodayRecords] = useState([])
  const [todayWeight, setTodayWeight] = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const load = async () => {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) { window.location.href = '/login'; return }
      const today = new Date().toISOString().split('T')[0]
      const [goalRes, recordsRes, weightRes] = await Promise.all([
        supabase.from('user_goals').select('*').eq('user_id', user.id).single(),
        supabase.from('meal_records').select('*').eq('user_id', user.id).eq('recorded_at', today),
        supabase.from('weight_records').select('*').eq('user_id', user.id).eq('recorded_at', today).single(),
      ])
      if (goalRes.data) setGoal(goalRes.data)
      if (recordsRes.data) setTodayRecords(recordsRes.data)
      if (weightRes.data) setTodayWeight(weightRes.data.weight)
      setLoading(false)
    }
    load()
  }, [])

  const MEAL_TYPES = [
    { key: 'breakfast', label: '朝食', icon: '🌅' },
    { key: 'lunch', label: '昼食', icon: '☀️' },
    { key: 'dinner', label: '夕食', icon: '🌙' },
    { key: 'snack', label: '間食', icon: '🍪' },
  ]

  const total = todayRecords.reduce((acc, r) => ({
    calories: acc.calories + (r.calories || 0),
    protein: acc.protein + (r.protein || 0),
    fat: acc.fat + (r.fat || 0),
    carbs: acc.carbs + (r.carbs || 0),
  }), { calories: 0, protein: 0, fat: 0, carbs: 0 })

  const targetCal = goal?.target_cal || 1750
  const progress = Math.min(100, Math.round((total.calories / targetCal) * 100))
  const circumference = 2 * Math.PI * 42
  const strokeDashoffset = circumference - (progress / 100) * circumference

  const today = new Date()
  const days = ['日', '月', '火', '水', '木', '金', '土']
  const dateStr = `${today.getMonth() + 1}月${today.getDate()}日（${days[today.getDay()]}）`

  if (loading) {
    return (
      <div className="min-h-screen bg-[#F8F4ED] flex items-center justify-center">
        <div className="text-[#8A8377]">読み込み中...</div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-[#F8F4ED] pb-24">
      <div className="max-w-md mx-auto px-4 pt-8">

        <div className="mb-5">
          <p className="text-[#E8835A] font-medium text-sm mb-1">{dateStr}</p>
          <h1 className="text-2xl font-bold text-[#2C2A26]">こんにちは 👋</h1>
          <p className="text-sm text-[#8A8377]">今日も小さな一歩を、楽しく。</p>
        </div>

        <div className="bg-gradient-to-br from-[#E4ECDF] to-[#F8F4ED] rounded-2xl p-5 mb-4 border border-[#DDD6C8]">
          <div className="flex items-center gap-5">
            <svg width="100" height="100" viewBox="0 0 100 100">
              <circle cx="50" cy="50" r="42" fill="none" stroke="#EFE8DA" strokeWidth="9"/>
              <circle cx="50" cy="50" r="42" fill="none" stroke="#E8835A" strokeWidth="9"
                strokeLinecap="round"
                strokeDasharray={circumference}
                strokeDashoffset={strokeDashoffset}
                transform="rotate(-90 50 50)"
                style={{ transition: 'stroke-dashoffset 0.6s ease' }}
              />
              <text x="50" y="54" textAnchor="middle"
                fontSize="20" fontWeight="600" fill="#2C2A26"
                fontFamily="system-ui">
                {progress}%
              </text>
            </svg>
            <div className="flex-1">
              <div className="text-2xl font-bold text-[#2C2A26]">
                {total.calories.toLocaleString()}
                <span className="text-sm font-normal text-[#8A8377] ml-1">
                  / {targetCal.toLocaleString()} kcal
                </span>
              </div>
              <div className="text-sm text-[#5C574F] mt-1">
                残り {Math.max(0, targetCal - total.calories).toLocaleString()} kcal
              </div>
              <div className="text-xs text-[#7A9471] mt-2 font-medium">
                {progress < 50 ? 'まだ余裕があります' : progress < 80 ? 'いいペースです 〜' : progress < 100 ? 'もう少しで目標です' : '今日の目標達成！'}
              </div>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-2xl p-4 border border-[#DDD6C8] mb-4">
          {[
            { label: 'P', val: total.protein, target: goal?.protein || 100, color: '#E8835A' },
            { label: 'F', val: total.fat, target: goal?.fat || 50, color: '#D4A340' },
            { label: 'C', val: total.carbs, target: goal?.carbs || 200, color: '#7A9471' },
          ].map((item) => (
            <div key={item.label} className="flex items-center gap-3 mb-3 last:mb-0">
              <div className="w-7 h-7 rounded-full flex items-center justify-center text-white text-xs font-bold flex-shrink-0"
                style={{ background: item.color }}>
                {item.label}
              </div>
              <div className="flex-1">
                <div className="w-full h-2 bg-[#EFE8DA] rounded-full overflow-hidden">
                  <div className="h-full rounded-full transition-all duration-500"
                    style={{ width: `${Math.min(100, (item.val / item.target) * 100)}%`, background: item.color }} />
                </div>
              </div>
              <div className="text-xs text-[#5C574F] min-w-[80px] text-right">
                <span className="font-semibold text-[#2C2A26]">{Math.round(item.val)}</span> / {item.target}g
              </div>
            </div>
          ))}
        </div>

        <div className="mb-4">
          <div className="flex items-center justify-between mb-3">
            <h2 className="text-base font-semibold text-[#2C2A26]">今日の食事</h2>
            <Link href="/record" className="text-xs text-[#7A9471] font-medium">すべて見る</Link>
          </div>
          <div className="flex flex-col gap-2">
            {MEAL_TYPES.map((meal) => {
              const mealRecords = todayRecords.filter(r => r.meal_type === meal.key)
              const mealCal = mealRecords.reduce((acc, r) => acc + (r.calories || 0), 0)
              return (
                <Link key={meal.key} href="/record"
                  className="bg-white rounded-xl p-3 border border-[#DDD6C8] flex items-center gap-3 hover:border-[#7A9471] transition-all">
                  <div className="w-10 h-10 rounded-full bg-[#F8F4ED] flex items-center justify-center text-lg flex-shrink-0">
                    {meal.icon}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="text-xs text-[#8A8377] mb-0.5">{meal.label}</div>
                    {mealRecords.length > 0 ? (
                      <div className="text-sm font-medium text-[#2C2A26] truncate">
                        {mealRecords.map(r => r.food_name).join('、')}
                      </div>
                    ) : (
                      <div className="text-sm text-[#8A8377] italic">まだ記録されていません</div>
                    )}
                  </div>
                  {mealCal > 0 && (
                    <div className="text-xs font-medium text-[#E8835A] flex-shrink-0">{mealCal}kcal</div>
                  )}
                </Link>
              )
            })}
          </div>
        </div>

        <div className="bg-white rounded-2xl p-4 border border-[#DDD6C8]">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs text-[#8A8377] mb-1">今日の体重</p>
              {todayWeight ? (
                <p className="text-xl font-bold text-[#2C2A26]">{todayWeight}kg</p>
              ) : (
                <p className="text-sm text-[#8A8377] italic">まだ記録されていません</p>
              )}
            </div>
            <Link href="/weight"
              className="px-4 py-2 bg-[#F8F4ED] border border-[#DDD6C8] rounded-xl text-sm text-[#5C574F] hover:border-[#7A9471] transition-all">
              {todayWeight ? '更新する' : '記録する'}
            </Link>
          </div>
        </div>

      </div>
    </div>
  )
}