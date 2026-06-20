'use client'
import { useState, useEffect } from 'react'
import { supabase } from '../lib/supabase'
import Link from 'next/link'
import HamburgerMenu from './components/HamburgerMenu'

export default function Home() {
  const [goal, setGoal] = useState<any>(null)
  const [todayRecords, setTodayRecords] = useState<any[]>([])
  const [todayWeight, setTodayWeight] = useState<number | null>(null)
  const [loading, setLoading] = useState(true)
  const [isPremium, setIsPremium] = useState(false)
  const [aiStatus, setAiStatus] = useState<'idle' | 'loading' | 'streaming' | 'complete' | 'error'>('idle')
  const [aiMealType, setAiMealType] = useState<'dinner' | 'next_day'>('dinner')
  const [aiText, setAiText] = useState('')
  const [aiError, setAiError] = useState<string | null>(null)
  const [eatStyle, setEatStyle] = useState<'jisui' | 'convenience' | 'gaishoku' | null>(null)
  const [selectedGrain, setSelectedGrain] = useState<string[]>([])
  const [selectedProtein, setSelectedProtein] = useState<string[]>([])
  const [selectedChain, setSelectedChain] = useState<string | null>(null)
  const [selectedGenre, setSelectedGenre] = useState<string | null>(null)
  const [streak, setStreak] = useState(0)
  const [pricingPlan, setPricingPlan] = useState<'monthly' | 'annual'>('monthly')
  const [portalLoading, setPortalLoading] = useState(false)

  useEffect(() => {
    const load = async () => {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) { window.location.href = '/login'; return }
      const today = new Date().toISOString().split('T')[0]
      const since60 = new Date(Date.now() - 60 * 24 * 60 * 60 * 1000).toISOString().split('T')[0]
      const [goalRes, recordsRes, weightRes, streakRes] = await Promise.all([
        supabase.from('user_goals').select('*').eq('user_id', user.id).single(),
        supabase.from('meal_records').select('*').eq('user_id', user.id).eq('recorded_at', today),
        supabase.from('weight_records').select('*').eq('user_id', user.id).eq('recorded_at', today).single(),
        supabase.from('meal_records').select('recorded_at').eq('user_id', user.id).gte('recorded_at', since60),
      ])
      if (goalRes.data) {
        setGoal(goalRes.data)
        setIsPremium(goalRes.data.is_premium || false)
      }
      if (recordsRes.data) setTodayRecords(recordsRes.data)
      if (weightRes.data) setTodayWeight(weightRes.data.weight)

      // ストリーク計算
      if (streakRes.data) {
        const dates = [...new Set(streakRes.data.map(r => r.recorded_at))].sort().reverse()
        let count = 0; let check = today
        for (const d of dates) {
          if (d === check) {
            count++
            const dt = new Date(check + 'T00:00:00'); dt.setDate(dt.getDate() - 1)
            check = dt.toISOString().split('T')[0]
          } else if (d < check) break
        }
        setStreak(count)
      }
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

  const fetchSuggestion = async () => {
    setAiStatus('loading')
    setAiText('')
    setAiError(null)
    try {
      const { data: { session } } = await supabase.auth.getSession()
      if (!session?.access_token) throw new Error('no session')

      const res = await fetch('/api/ai-meal-suggestion', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          accessToken: session.access_token,
          mealType: aiMealType,
          todayConsumed: total,
          dailyGoal: {
            calories: goal?.target_cal ?? 1750,
            protein: goal?.protein ?? 100,
            fat: goal?.fat ?? 50,
            carbs: goal?.carbs ?? 200,
          },
          filters: {
            eatStyle,
            selectedGrain,
            selectedProtein,
            selectedChain,
            selectedGenre,
          },
        }),
      })

      if (!res.ok) {
        const errData = await res.json()
        setAiError(errData.error ?? 'エラーが発生しました')
        setAiStatus('error')
        return
      }

      setAiStatus('streaming')
      const reader = res.body!.getReader()
      const decoder = new TextDecoder()
      while (true) {
        const { done, value } = await reader.read()
        if (done) break
        setAiText(prev => prev + decoder.decode(value, { stream: true }))
      }
      setAiStatus('complete')
    } catch {
      setAiError('提案の取得に失敗しました。しばらくしてからもう一度お試しください。')
      setAiStatus('error')
    }
  }

  const handleShare = async () => {
    const text = `今日の食事記録 ${dateStr}\n📊 ${total.calories}kcal (P:${Math.round(total.protein)}g / F:${Math.round(total.fat)}g / C:${Math.round(total.carbs)}g)\n#MealJournal #ダイエット #食事管理`
    if (navigator.share) {
      await navigator.share({ text }).catch(() => {})
    } else {
      await navigator.clipboard.writeText(text).catch(() => {})
    }
  }

  const handleCheckout = async (plan: 'monthly' | 'annual') => {
    const { data: { session } } = await supabase.auth.getSession()
    if (!session) return
    const res = await fetch('/api/create-checkout-session', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${session.access_token}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ plan }),
    })
    const { url } = await res.json()
    if (url) window.location.href = url
  }

  const handleCustomerPortal = async () => {
    setPortalLoading(true)
    const { data: { session } } = await supabase.auth.getSession()
    if (!session) { setPortalLoading(false); return }
    const res = await fetch('/api/customer-portal', {
      method: 'POST',
      headers: { Authorization: `Bearer ${session.access_token}` },
    })
    const data = await res.json()
    if (data.url) window.location.href = data.url
    setPortalLoading(false)
  }

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

        <div className="mb-5 flex items-start justify-between">
          <div>
            <p className="text-[#E8835A] font-medium text-sm mb-1">{dateStr}</p>
            <h1 className="text-2xl font-bold text-[#2C2A26]">こんにちは 👋</h1>
            <div className="flex items-center gap-2 mt-1">
              <p className="text-sm text-[#8A8377]">今日も小さな一歩を、楽しく。</p>
              {streak >= 2 && (
                <span className="inline-flex items-center gap-0.5 px-2 py-0.5 bg-[#FCEEE5] rounded-full border border-[#F5B89D] text-xs font-semibold text-[#E8835A]">
                  🔥 {streak}日連続
                </span>
              )}
            </div>
          </div>
          <HamburgerMenu isPremium={isPremium} onManageSubscription={handleCustomerPortal} />
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

        <div className="flex justify-end mb-2">
          <button onClick={handleShare}
            className="flex items-center gap-1.5 px-3 py-1.5 bg-white rounded-full border border-[#DDD6C8] text-xs text-[#8A8377] hover:border-[#7A9471] hover:text-[#7A9471] transition-colors">
            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
              <circle cx="18" cy="5" r="3"/><circle cx="6" cy="12" r="3"/><circle cx="18" cy="19" r="3"/>
              <line x1="8.59" y1="13.51" x2="15.42" y2="17.49"/><line x1="15.41" y1="6.51" x2="8.59" y2="10.49"/>
            </svg>
            今日の記録をシェア
          </button>
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
                <div key={meal.key} className="bg-white rounded-xl border border-[#DDD6C8] overflow-hidden">
                  <div className="flex items-center">
                    <Link href="/record"
                      className="flex items-center gap-3 p-3 hover:bg-[#F8F4ED] transition-all flex-1 min-w-0">
                      <div className="w-10 h-10 rounded-full bg-[#F8F4ED] flex items-center justify-center text-lg flex-shrink-0">
                        {meal.icon}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="text-xs text-[#8A8377] mb-0.5">{meal.label}</div>
                        {mealRecords.length === 0 && (
                          <div className="text-sm text-[#8A8377] italic">まだ記録されていません</div>
                        )}
                        {mealRecords.length > 0 && (
                          <div className="text-xs text-[#5C574F]">{mealRecords.length}品を記録済み</div>
                        )}
                      </div>
                      {mealCal > 0 && (
                        <div className="text-xs font-medium text-[#E8835A] flex-shrink-0">{mealCal}kcal</div>
                      )}
                    </Link>
                    {isPremium && mealRecords.length > 0 && (
                      <Link href={`/feedback/meal/${meal.key}`}
                        className="flex-shrink-0 mx-3 px-2 py-1 bg-[#E4ECDF] text-[#7A9471] rounded-lg text-xs font-medium hover:bg-[#D5E3D0] transition-colors">
                        🤖 評価
                      </Link>
                    )}
                  </div>
                  {mealRecords.length > 0 && (
                    <div className="border-t border-[#EFE8DA]">
                      {mealRecords.map((r) => (
                        <div key={r.id} className="flex items-center gap-2 px-3 py-2 border-b border-[#EFE8DA] last:border-0">
                          <span className="flex-1 text-sm text-[#2C2A26] truncate">{r.food_name}</span>
                          <span className="text-xs text-[#8A8377] flex-shrink-0">{r.calories}kcal</span>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )
            })}
          </div>
        </div>

        <div className="bg-white rounded-2xl p-4 border border-[#DDD6C8] mb-4">
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

        {!isPremium && (
          <div className="mt-4 bg-gradient-to-br from-[#FCEEE5] to-[#F8F4ED] rounded-2xl p-5 border border-[#F5B89D]">
            <p className="text-sm font-semibold text-[#2C2A26] mb-1">🌟 プレミアムにアップグレード</p>
            <p className="text-xs text-[#5C574F] mb-3">AI献立提案・食事レポートが使い放題になります</p>

            {/* 月払い / 年払い トグル */}
            <div className="flex gap-1 bg-[#F5D5C5] p-1 rounded-xl mb-3">
              {([['monthly', '月払い'], ['annual', '年払い']] as const).map(([v, label]) => (
                <button key={v} onClick={() => setPricingPlan(v)}
                  className={`flex-1 py-1.5 rounded-lg text-xs font-medium transition-all ${
                    pricingPlan === v ? 'bg-white text-[#E8835A] shadow-sm' : 'text-[#E8835A]'
                  }`}>
                  {label}
                  {v === 'annual' && <span className="ml-1 text-[10px] font-semibold text-[#7A9471]">2ヶ月お得</span>}
                </button>
              ))}
            </div>

            <button
              onClick={() => handleCheckout(pricingPlan)}
              className="w-full py-3 bg-[#E8835A] text-white rounded-xl font-medium hover:bg-[#D4724A] transition-colors">
              {pricingPlan === 'annual' ? '¥3,000 / 年（¥250/月）· 今すぐ始める' : '¥300 / 月 · 今すぐ始める'}
            </button>
          </div>
        )}

        {isPremium && (
          <div className="mt-4 bg-gradient-to-br from-[#E4ECDF] to-[#F8F4ED] rounded-2xl p-5 border border-[#DDD6C8]">
            <div className="flex items-center justify-between mb-1">
              <p className="text-sm font-semibold text-[#7A9471]">🌟 プレミアムプラン利用中</p>
              <button onClick={handleCustomerPortal} disabled={portalLoading}
                className="text-xs text-[#8A8377] hover:text-[#5C574F] hover:underline transition-colors disabled:opacity-50">
                {portalLoading ? '...' : 'プラン管理'}
              </button>
            </div>
            <p className="text-xs text-[#5C574F] mb-4">AI機能がすべて使い放題です</p>

            <Link href="/report"
              className="flex items-center justify-between bg-white rounded-xl p-4 border border-[#DDD6C8] mb-3 hover:border-[#7A9471] transition-all">
              <div>
                <p className="text-sm font-semibold text-[#2C2A26]">📋 週次レポート</p>
                <p className="text-xs text-[#8A8377] mt-0.5">1週間の振り返り・AIアドバイス</p>
              </div>
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#8A8377" strokeWidth="2" strokeLinecap="round">
                <polyline points="9 18 15 12 9 6"/>
              </svg>
            </Link>

            <div className="bg-white rounded-xl p-4 border border-[#DDD6C8]">
              <p className="text-sm font-semibold text-[#2C2A26] mb-3">🤖 AI献立提案</p>

              {(aiStatus === 'idle' || aiStatus === 'complete') && (
                <>
                  <div className="flex gap-2 mb-4">
                    {([['dinner', '🌙 夕食'], ['next_day', '📅 翌日の献立']] as const).map(([v, label]) => (
                      <button key={v} onClick={() => setAiMealType(v)}
                        className={`flex-1 py-2 rounded-xl text-sm font-medium border transition-all
                          ${aiMealType === v ? 'bg-[#7A9471] text-white border-[#7A9471]' : 'bg-[#F8F4ED] text-[#5C574F] border-[#DDD6C8]'}`}>
                        {label}
                      </button>
                    ))}
                  </div>

                  <p className="text-xs font-semibold text-[#8A8377] mb-2">食事スタイル</p>
                  <div className="flex gap-2 mb-3 flex-wrap">
                    {([['jisui', '🏠 自炊'], ['convenience', '🏪 コンビニ'], ['gaishoku', '🍽️ 外食']] as const).map(([v, label]) => (
                      <button key={v}
                        onClick={() => { setEatStyle(eatStyle === v ? null : v); setSelectedGrain([]); setSelectedProtein([]); setSelectedChain(null); setSelectedGenre(null) }}
                        className={`px-3 py-1.5 rounded-full text-xs font-medium border transition-all
                          ${eatStyle === v ? 'bg-[#E8835A] text-white border-[#E8835A]' : 'bg-[#F8F4ED] text-[#5C574F] border-[#DDD6C8]'}`}>
                        {label}
                      </button>
                    ))}
                  </div>

                  {eatStyle === 'jisui' && (
                    <>
                      <p className="text-xs font-semibold text-[#8A8377] mb-2">主食</p>
                      <div className="flex gap-2 mb-3 flex-wrap">
                        {([['rice', '🍚 米'], ['noodle', '🍜 麺'], ['bread', '🍞 パン']] as const).map(([v, label]) => (
                          <button key={v}
                            onClick={() => setSelectedGrain(g => g.includes(v) ? g.filter(x => x !== v) : [...g, v])}
                            className={`px-3 py-1.5 rounded-full text-xs font-medium border transition-all
                              ${selectedGrain.includes(v) ? 'bg-[#7A9471] text-white border-[#7A9471]' : 'bg-[#F8F4ED] text-[#5C574F] border-[#DDD6C8]'}`}>
                            {label}
                          </button>
                        ))}
                      </div>
                      <p className="text-xs font-semibold text-[#8A8377] mb-2">主菜</p>
                      <div className="flex gap-2 mb-3 flex-wrap">
                        {([['meat', '🥩 肉'], ['fish', '🐟 魚'], ['egg_tofu', '🥚 卵・豆腐']] as const).map(([v, label]) => (
                          <button key={v}
                            onClick={() => setSelectedProtein(p => p.includes(v) ? p.filter(x => x !== v) : [...p, v])}
                            className={`px-3 py-1.5 rounded-full text-xs font-medium border transition-all
                              ${selectedProtein.includes(v) ? 'bg-[#7A9471] text-white border-[#7A9471]' : 'bg-[#F8F4ED] text-[#5C574F] border-[#DDD6C8]'}`}>
                            {label}
                          </button>
                        ))}
                      </div>
                    </>
                  )}

                  {eatStyle === 'convenience' && (
                    <>
                      <p className="text-xs font-semibold text-[#8A8377] mb-2">チェーン</p>
                      <div className="flex gap-2 mb-3 flex-wrap">
                        {([['seven', '🟠 セブン'], ['famima', '🔵 ファミマ'], ['lawson', '⭕ ローソン'], ['any', '🏪 どこでも']] as const).map(([v, label]) => (
                          <button key={v}
                            onClick={() => setSelectedChain(selectedChain === v ? null : v)}
                            className={`px-3 py-1.5 rounded-full text-xs font-medium border transition-all
                              ${selectedChain === v ? 'bg-[#7A9471] text-white border-[#7A9471]' : 'bg-[#F8F4ED] text-[#5C574F] border-[#DDD6C8]'}`}>
                            {label}
                          </button>
                        ))}
                      </div>
                    </>
                  )}

                  {eatStyle === 'gaishoku' && (
                    <>
                      <p className="text-xs font-semibold text-[#8A8377] mb-2">ジャンル</p>
                      <div className="flex gap-2 mb-3 flex-wrap">
                        {([['washoku', '🍱 和食'], ['yoshoku', '🍝 洋食'], ['chuka', '🥟 中華'], ['fast', '🍔 ファスト']] as const).map(([v, label]) => (
                          <button key={v}
                            onClick={() => setSelectedGenre(selectedGenre === v ? null : v)}
                            className={`px-3 py-1.5 rounded-full text-xs font-medium border transition-all
                              ${selectedGenre === v ? 'bg-[#7A9471] text-white border-[#7A9471]' : 'bg-[#F8F4ED] text-[#5C574F] border-[#DDD6C8]'}`}>
                            {label}
                          </button>
                        ))}
                      </div>
                    </>
                  )}

                  {aiStatus === 'complete' && (
                    <div className="text-sm text-[#2C2A26] leading-relaxed whitespace-pre-wrap bg-[#F8F4ED] rounded-xl p-3 border border-[#DDD6C8] mb-3">
                      {aiText}
                    </div>
                  )}

                  <button onClick={fetchSuggestion}
                    className="w-full py-3 bg-[#7A9471] text-white rounded-xl font-medium hover:bg-[#6A8462] transition-colors text-sm">
                    {aiStatus === 'complete' ? '🔄 もう一度提案してもらう' : '✨ 献立を提案してもらう'}
                  </button>
                </>
              )}

              {(aiStatus === 'loading') && (
                <>
                  <div className="flex gap-2 mb-3 opacity-50 pointer-events-none">
                    <button
                      className={`flex-1 py-2 rounded-xl text-sm font-medium border transition-all
                        ${aiMealType === 'dinner'
                          ? 'bg-[#7A9471] text-white border-[#7A9471]'
                          : 'bg-[#F8F4ED] text-[#5C574F] border-[#DDD6C8]'}`}>
                      🌙 夕食
                    </button>
                    <button
                      className={`flex-1 py-2 rounded-xl text-sm font-medium border transition-all
                        ${aiMealType === 'next_day'
                          ? 'bg-[#7A9471] text-white border-[#7A9471]'
                          : 'bg-[#F8F4ED] text-[#5C574F] border-[#DDD6C8]'}`}>
                      📅 翌日の献立
                    </button>
                  </div>
                  <div className="space-y-2 mt-2">
                    <div className="h-3 bg-[#EFE8DA] rounded-full w-full animate-pulse" />
                    <div className="h-3 bg-[#EFE8DA] rounded-full w-4/5 animate-pulse" />
                    <div className="h-3 bg-[#EFE8DA] rounded-full w-3/5 animate-pulse" />
                  </div>
                  <p className="text-xs text-[#8A8377] mt-2 text-center">AIが考えています...</p>
                </>
              )}

              {(aiStatus === 'streaming') && (
                <>
                  <div className="flex gap-2 mb-3 opacity-50 pointer-events-none">
                    <button
                      className={`flex-1 py-2 rounded-xl text-sm font-medium border transition-all
                        ${aiMealType === 'dinner'
                          ? 'bg-[#7A9471] text-white border-[#7A9471]'
                          : 'bg-[#F8F4ED] text-[#5C574F] border-[#DDD6C8]'}`}>
                      🌙 夕食
                    </button>
                    <button
                      className={`flex-1 py-2 rounded-xl text-sm font-medium border transition-all
                        ${aiMealType === 'next_day'
                          ? 'bg-[#7A9471] text-white border-[#7A9471]'
                          : 'bg-[#F8F4ED] text-[#5C574F] border-[#DDD6C8]'}`}>
                      📅 翌日の献立
                    </button>
                  </div>
                  <div className="text-sm text-[#2C2A26] leading-relaxed whitespace-pre-wrap bg-[#F8F4ED] rounded-xl p-3 min-h-[80px] border border-[#DDD6C8]">
                    {aiText}
                    <span className="inline-block w-1 h-3 bg-[#7A9471] animate-pulse ml-0.5 align-middle" />
                  </div>
                </>
              )}


              {(aiStatus === 'error') && (
                <>
                  <div className="flex gap-2 mb-3">
                    <button
                      onClick={() => setAiMealType('dinner')}
                      className={`flex-1 py-2 rounded-xl text-sm font-medium border transition-all
                        ${aiMealType === 'dinner'
                          ? 'bg-[#7A9471] text-white border-[#7A9471]'
                          : 'bg-[#F8F4ED] text-[#5C574F] border-[#DDD6C8]'}`}>
                      🌙 夕食
                    </button>
                    <button
                      onClick={() => setAiMealType('next_day')}
                      className={`flex-1 py-2 rounded-xl text-sm font-medium border transition-all
                        ${aiMealType === 'next_day'
                          ? 'bg-[#7A9471] text-white border-[#7A9471]'
                          : 'bg-[#F8F4ED] text-[#5C574F] border-[#DDD6C8]'}`}>
                      📅 翌日の献立
                    </button>
                  </div>
                  <div className="bg-[#FCEEE5] border border-[#F5B89D] rounded-xl p-3 mb-3">
                    <p className="text-xs text-[#E8835A] font-medium">エラーが発生しました</p>
                    <p className="text-xs text-[#5C574F] mt-0.5">{aiError}</p>
                  </div>
                  <button
                    onClick={fetchSuggestion}
                    className="w-full py-2.5 bg-[#7A9471] text-white rounded-xl font-medium hover:bg-[#6A8462] transition-colors text-sm">
                    ✨ もう一度試す
                  </button>
                </>
              )}
            </div>
          </div>
        )}

      </div>
    </div>
  )
}