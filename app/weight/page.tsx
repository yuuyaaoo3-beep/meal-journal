'use client'
import { useState, useEffect } from 'react'
import { supabase } from '../../lib/supabase'

export default function Weight() {
  const today = new Date().toISOString().split('T')[0]
  const [selectedDate, setSelectedDate] = useState(today)
  const [todayWeight, setTodayWeight] = useState('')
  const [memo, setMemo] = useState('')
  const [records, setRecords] = useState<any[]>([])
  const [saving, setSaving] = useState(false)
  const [saved, setSaved] = useState(false)
  const [startWeight, setStartWeight] = useState<number | null>(null)
  const [goalWeight, setGoalWeight] = useState<number | null>(null)

  useEffect(() => {
    loadRecords()
    loadGoal()
  }, [])

  // 日付が変わったら既存の記録を読み込む
  useEffect(() => {
    const existing = records.find(r => r.recorded_at === selectedDate)
    if (existing) {
      setTodayWeight(String(existing.weight))
      setMemo(existing.memo || '')
    } else {
      setTodayWeight('')
      setMemo('')
    }
    setSaved(false)
  }, [selectedDate, records])

  const loadGoal = async () => {
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return
    const { data } = await supabase
      .from('user_goals')
      .select('weight, goal_weight')
      .eq('user_id', user.id)
      .single()
    if (data) {
      setStartWeight(data.weight)
      setGoalWeight(data.weight - data.goal_weight)
    }
  }

  const loadRecords = async () => {
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return
    const { data } = await supabase
      .from('weight_records')
      .select('*')
      .eq('user_id', user.id)
      .order('recorded_at', { ascending: true })
    if (data) setRecords(data)
  }

  const saveWeight = async () => {
    if (!todayWeight) { alert('体重を入力してください'); return }
    setSaving(true)
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) { alert('ログインが必要です'); setSaving(false); return }
    await supabase.from('weight_records').delete()
      .eq('user_id', user.id).eq('recorded_at', selectedDate)
    const { error } = await supabase.from('weight_records').insert({
      user_id: user.id,
      weight: parseFloat(todayWeight),
      memo: memo || null,
      recorded_at: selectedDate,
    })
    if (error) {
      alert('保存に失敗しました')
    } else {
      setSaved(true)
      loadRecords()
      setTimeout(() => setSaved(false), 3000)
    }
    setSaving(false)
  }

  const latestWeight = records.length > 0 ? records[records.length - 1].weight : null
  const firstWeight = records.length > 0 ? records[0].weight : startWeight
  const delta = latestWeight && firstWeight ? (latestWeight - firstWeight).toFixed(1) : null
  const remainingToGoal = latestWeight && goalWeight ? (latestWeight - goalWeight).toFixed(1) : null

  // グラフ描画用
  // グラフ描画用
  const [chartPeriod, setChartPeriod] = useState<'30' | '180' | 'all'>('all')
  const chartData = chartPeriod === '30' ? records.slice(-30)
    : chartPeriod === '180' ? records.slice(-180)
    : records
  const weights = chartData.map(r => parseFloat(r.weight))
  const minW = weights.length > 0 ? Math.floor(Math.min(...weights)) - 1 : 50
  const maxW = weights.length > 0 ? Math.ceil(Math.max(...weights)) + 1 : 70
  const range = maxW - minW

  const toY = (w: number) => Math.round(((maxW - w) / range) * 120)
  const toX = (i: number) => weights.length > 1 ? Math.round((i / (weights.length - 1)) * 280) + 20 : 160

  const pathD = weights.map((w, i) => `${i === 0 ? 'M' : 'L'} ${toX(i)} ${toY(w)}`).join(' ')

  return (
    <div className="min-h-screen bg-[#F8F4ED] pb-24">
      <div className="max-w-md mx-auto px-4 pt-8">

        {/* ヘッダー */}
        <div className="mb-6">
          <p className="text-xs font-semibold tracking-widest text-[#7A9471] uppercase mb-1">Weight</p>
          <h1 className="text-2xl font-bold text-[#2C2A26]">体重の記録</h1>
          <p className="text-sm text-[#8A8377] mt-1">毎日の小さな変化を丁寧に</p>
        </div>

        {/* 現在の体重カード */}
        {latestWeight && (
          <div className="bg-gradient-to-br from-white to-[#FCEEE5] rounded-2xl p-5 border border-[#F5B89D] mb-4">
            <div className="text-4xl font-bold text-[#2C2A26] mb-1">
              {latestWeight}<small className="text-base font-normal text-[#8A8377] ml-1">kg</small>
            </div>
            {delta !== null && (
              <div className="flex items-center gap-2 mb-2">
                <span className={`px-3 py-1 rounded-full text-sm font-medium ${
                  parseFloat(delta) < 0 ? 'bg-[#E4ECDF] text-[#7A9471]' : 'bg-[#FCEEE5] text-[#E8835A]'
                }`}>
                  {parseFloat(delta) < 0 ? '↓' : '↑'} {Math.abs(parseFloat(delta))}kg
                </span>
                <span className="text-sm text-[#8A8377]">記録開始から</span>
              </div>
            )}
            {remainingToGoal !== null && (
              <p className="text-sm text-[#E8835A]">
                目標まで あと {remainingToGoal}kg
              </p>
            )}
          </div>
        )}

        {/* 日付選択 + 体重入力 */}
        <div className="bg-white rounded-2xl p-5 border border-[#DDD6C8] mb-4">
          {/* 日付選択 */}
          <div className="mb-3">
            <label className="block text-sm text-[#5C574F] mb-1">記録する日付</label>
            <input
              type="date"
              value={selectedDate}
              max={today}
              onChange={(e) => setSelectedDate(e.target.value)}
              className="w-full px-4 py-3 rounded-xl border border-[#DDD6C8] bg-[#F8F4ED] text-[#2C2A26] focus:outline-none focus:border-[#7A9471]"
            />
          </div>

          {/* 既存記録バッジ */}
          {records.find(r => r.recorded_at === selectedDate) && (
            <div className="mb-3 px-3 py-2 bg-[#E4ECDF] rounded-lg text-xs text-[#7A9471] font-medium">
              ✓ この日の記録があります。上書き保存されます。
            </div>
          )}

          <div className="flex gap-3 mb-3">
            <div className="flex-1">
              <label className="block text-sm text-[#5C574F] mb-1">体重</label>
              <div className="relative">
                <input
                  type="number"
                  step="0.1"
                  value={todayWeight}
                  onChange={(e) => { setTodayWeight(e.target.value); setSaved(false) }}
                  placeholder="58.4"
                  className="w-full px-4 py-3 rounded-xl border border-[#DDD6C8] bg-[#F8F4ED] text-[#2C2A26] focus:outline-none focus:border-[#7A9471]"
                />
                <span className="absolute right-4 top-3.5 text-sm text-[#8A8377]">kg</span>
              </div>
            </div>
          </div>
          <div className="mb-3">
            <label className="block text-sm text-[#5C574F] mb-1">メモ（任意）</label>
            <input
              type="text"
              value={memo}
              onChange={(e) => setMemo(e.target.value)}
              placeholder="例：生理中、疲れ気味"
              className="w-full px-4 py-3 rounded-xl border border-[#DDD6C8] bg-[#F8F4ED] text-[#2C2A26] focus:outline-none focus:border-[#7A9471]"
            />
          </div>
          {saved ? (
            <div className="text-center text-sm text-[#7A9471] font-medium py-2">✓ 記録しました！</div>
          ) : (
            <button onClick={saveWeight} disabled={saving}
              className="w-full py-3 bg-[#7A9471] text-white rounded-xl font-medium hover:bg-[#6A8462] transition-colors disabled:opacity-50">
              {saving ? '保存中...' : '記録する'}
            </button>
          )}
        </div>

        {/* グラフ */}
        {records.length > 1 && (
          <div className="bg-white rounded-2xl p-5 border border-[#DDD6C8] mb-4">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-base font-semibold text-[#2C2A26]">推移グラフ</h2>
              <div className="flex gap-1">
                {(['30', '180', 'all'] as const).map((p) => (
                  <button key={p} onClick={() => setChartPeriod(p)}
                    className={`px-2.5 py-1 rounded-lg text-xs font-medium transition-colors ${
                      chartPeriod === p
                        ? 'bg-[#7A9471] text-white'
                        : 'bg-[#F8F4ED] text-[#8A8377] hover:bg-[#EFE8DA]'
                    }`}>
                    {p === '30' ? '1ヶ月' : p === '180' ? '半年' : '全期間'}
                  </button>
                ))}
              </div>
            </div>
            <svg viewBox="0 0 320 160" width="100%" className="block">
              {[0, 40, 80, 120].map(y => (
                <line key={y} x1="0" y1={y} x2="320" y2={y}
                  stroke="#DDD6C8" strokeWidth="0.5" strokeDasharray="4 4" />
              ))}
              {[0, 40, 80, 120].map((y, i) => (
                <text key={y} x="4" y={y + 4} fontSize="9" fill="#8A8377">
                  {(maxW - (i * range / 3)).toFixed(1)}
                </text>
              ))}
              <defs>
                <linearGradient id="wGrad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="#E8835A" stopOpacity="0.2" />
                  <stop offset="100%" stopColor="#E8835A" stopOpacity="0" />
                </linearGradient>
              </defs>
              {weights.length > 1 && (
                <path
                  d={`${pathD} L ${toX(weights.length - 1)} 140 L ${toX(0)} 140 Z`}
                  fill="url(#wGrad)"
                />
              )}
              {weights.length > 1 && (
                <path d={pathD} stroke="#E8835A" strokeWidth="2"
                  fill="none" strokeLinecap="round" strokeLinejoin="round" />
              )}
              {weights.length > 0 && (
                <>
                  <circle cx={toX(weights.length - 1)} cy={toY(weights[weights.length - 1])}
                    r="4" fill="#E8835A" />
                  <circle cx={toX(weights.length - 1)} cy={toY(weights[weights.length - 1])}
                    r="8" fill="#E8835A" fillOpacity="0.2" />
                </>
              )}
            </svg>
          </div>
        )}

        {/* 記録一覧（直近7件） */}
        {records.length > 0 && (
          <div className="bg-white rounded-2xl p-5 border border-[#DDD6C8]">
            <h2 className="text-base font-semibold text-[#2C2A26] mb-3">最近の記録</h2>
            <div className="flex flex-col gap-2">
              {records.slice(-7).reverse().map((r, i) => {
                const prev = records[records.length - 2 - i]
                const diff = prev ? (r.weight - prev.weight).toFixed(1) : null
                return (
                  <div key={r.id} className="flex items-center justify-between py-2 border-b border-[#EFE8DA] last:border-0">
                    <div>
                      <span className="text-sm text-[#5C574F]">{r.recorded_at}</span>
                      {r.memo && <span className="text-xs text-[#8A8377] ml-2">{r.memo}</span>}
                    </div>
                    <div className="flex items-center gap-2">
                      {diff !== null && (
                        <span className={`text-xs ${parseFloat(diff) < 0 ? 'text-[#7A9471]' : 'text-[#E8835A]'}`}>
                          {parseFloat(diff) < 0 ? '↓' : '↑'}{Math.abs(parseFloat(diff))}
                        </span>
                      )}
                      <span className="text-sm font-semibold text-[#2C2A26]">{r.weight}kg</span>
                    </div>
                  </div>
                )
              })}
            </div>
          </div>
        )}

      </div>
    </div>
  )
}