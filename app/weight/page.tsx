'use client'
import { useState, useEffect } from 'react'
import { supabase } from '../../lib/supabase'
import { getJSTDateString } from '../../lib/date'

export default function Weight() {
  const today = getJSTDateString()
  const [selectedDate, setSelectedDate] = useState(today)
  const [todayWeight, setTodayWeight] = useState('')
  const [records, setRecords] = useState<any[]>([])
  const [saving, setSaving] = useState(false)
  const [saved, setSaved] = useState(false)
  const [startWeight, setStartWeight] = useState<number | null>(null)
  const [goalWeight, setGoalWeight] = useState<number | null>(null)
  const [showAllRecords, setShowAllRecords] = useState(false)
  const [chartPeriod, setChartPeriod] = useState<'30' | '180' | 'all'>('all')
  const [clickedIdx, setClickedIdx] = useState<number | null>(null)
  const [formError, setFormError] = useState<string | null>(null)

  useEffect(() => { loadRecords(); loadGoal() }, [])

  useEffect(() => {
    const existing = records.find(r => r.recorded_at === selectedDate)
    setTodayWeight(existing ? String(existing.weight) : '')
    setSaved(false)
  }, [selectedDate, records])

  useEffect(() => { setClickedIdx(null) }, [chartPeriod])

  const loadGoal = async () => {
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return
    const { data } = await supabase
      .from('user_goals').select('weight, goal_weight').eq('user_id', user.id).single()
    if (data) {
      setStartWeight(data.weight)
      setGoalWeight(data.weight - data.goal_weight)
    }
  }

  const loadRecords = async () => {
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return
    const { data } = await supabase
      .from('weight_records').select('*').eq('user_id', user.id)
      .order('recorded_at', { ascending: true })
    if (data) setRecords(data)
  }

  const saveWeight = async () => {
    if (!todayWeight) { setFormError('体重を入力してください'); return }
    setFormError(null)
    setSaving(true)
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) { setFormError('ログインが必要です'); setSaving(false); return }
    const existing = records.find(r => r.recorded_at === selectedDate)
    let error
    if (existing) {
      ;({ error } = await supabase.from('weight_records')
        .update({ weight: parseFloat(todayWeight) })
        .eq('id', existing.id))
    } else {
      ;({ error } = await supabase.from('weight_records').insert({
        user_id: user.id,
        weight: parseFloat(todayWeight),
        recorded_at: selectedDate,
      }))
    }
    if (error) {
      setFormError('保存に失敗しました')
    } else {
      setSaved(true)
      loadRecords()
      setTimeout(() => setSaved(false), 3000)
    }
    setSaving(false)
  }

  const deleteWeight = async (date: string) => {
    if (!confirm('この記録を削除しますか？')) return
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return
    await supabase.from('weight_records').delete().eq('user_id', user.id).eq('recorded_at', date)
    if (selectedDate === date) setTodayWeight('')
    loadRecords()
  }

  const latestWeight = records.length > 0 ? records[records.length - 1].weight : null
  const firstWeight = records.length > 0 ? records[0].weight : startWeight
  const delta = latestWeight && firstWeight ? (latestWeight - firstWeight).toFixed(1) : null
  const remainingToGoal = latestWeight && goalWeight ? (latestWeight - goalWeight).toFixed(1) : null

  // --- グラフ ---
  const chartData = chartPeriod === '30' ? records.slice(-30)
    : chartPeriod === '180' ? records.slice(-180) : records
  const weights = chartData.map(r => parseFloat(r.weight))
  const minW = weights.length > 0 ? Math.floor(Math.min(...weights)) - 1 : 50
  const maxW = weights.length > 0 ? Math.ceil(Math.max(...weights)) + 1 : 70
  const range = maxW - minW

  const toY = (w: number) => Math.round(((maxW - w) / range) * 120)
  const toX = (i: number) => weights.length > 1 ? Math.round((i / (weights.length - 1)) * 280) + 20 : 160

  const pathD = weights.map((w, i) => `${i === 0 ? 'M' : 'L'} ${toX(i)} ${toY(w)}`).join(' ')

  const fmtDate = (str: string) => {
    const d = new Date(str + 'T00:00:00')
    return `${d.getMonth() + 1}/${d.getDate()}`
  }

  const labelIndices: number[] = (() => {
    const n = chartData.length
    if (n === 0) return []
    if (n <= 5) return Array.from({ length: n }, (_, i) => i)
    return [...new Set([0, Math.round(n * 0.25), Math.round(n * 0.5), Math.round(n * 0.75), n - 1])]
  })()

  const handleChartClick = (e: React.MouseEvent<SVGSVGElement>) => {
    if (weights.length === 0) return
    const rect = e.currentTarget.getBoundingClientRect()
    const svgX = ((e.clientX - rect.left) / rect.width) * 320
    let nearest = 0
    let minDist = Infinity
    weights.forEach((_, i) => {
      const dist = Math.abs(toX(i) - svgX)
      if (dist < minDist) { minDist = dist; nearest = i }
    })
    setClickedIdx(prev => (prev === nearest || minDist > 30) ? null : nearest)
  }

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
              <p className="text-sm text-[#E8835A]">目標まで あと {remainingToGoal}kg</p>
            )}
          </div>
        )}

        {/* 体重入力 */}
        <div className="bg-white rounded-2xl p-5 border border-[#DDD6C8] mb-4">
          <div className="mb-3">
            <label className="block text-sm text-[#5C574F] mb-1">記録する日付</label>
            <div className="flex">
              <input type="date" value={selectedDate} max={today}
                onChange={(e) => setSelectedDate(e.target.value)}
                className="flex-1 min-w-0 px-3 py-3 rounded-xl border border-[#DDD6C8] bg-[#F8F4ED] text-[#2C2A26] focus:outline-none focus:border-[#7A9471]" />
            </div>
          </div>

          {records.find(r => r.recorded_at === selectedDate) && (
            <div className="mb-3 px-3 py-2 bg-[#E4ECDF] rounded-lg text-xs text-[#7A9471] font-medium">
              ✓ この日の記録があります。上書き保存されます。
            </div>
          )}

          <div className="mb-3">
            <label className="block text-sm text-[#5C574F] mb-1">体重</label>
            <div className="relative">
              <input type="number" step="0.1" value={todayWeight}
                onChange={(e) => { setTodayWeight(e.target.value); setSaved(false) }}
                placeholder="58.4"
                className="w-full px-4 py-3 rounded-xl border border-[#DDD6C8] bg-[#F8F4ED] text-[#2C2A26] focus:outline-none focus:border-[#7A9471]" />
              <span className="absolute right-4 top-3.5 text-sm text-[#8A8377]">kg</span>
            </div>
          </div>

          {formError && (
            <div className="mb-3 px-3 py-2 bg-[#FCEEE5] rounded-xl border border-[#F5B89D]">
              <p className="text-xs text-[#E8835A]">{formError}</p>
            </div>
          )}
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
                      chartPeriod === p ? 'bg-[#7A9471] text-white' : 'bg-[#F8F4ED] text-[#8A8377] hover:bg-[#EFE8DA]'
                    }`}>
                    {p === '30' ? '1ヶ月' : p === '180' ? '半年' : '全期間'}
                  </button>
                ))}
              </div>
            </div>
            <svg viewBox="0 0 320 185" width="100%" className="block cursor-pointer select-none"
              onClick={handleChartClick}>
              {/* グリッド線 */}
              {[0, 40, 80, 120].map(y => (
                <line key={y} x1="0" y1={y} x2="320" y2={y}
                  stroke="#DDD6C8" strokeWidth="0.5" strokeDasharray="4 4" />
              ))}
              {/* Y軸ラベル */}
              {[0, 40, 80, 120].map((y, i) => (
                <text key={y} x="4" y={y + 4} fontSize="9" fill="#8A8377">
                  {(maxW - (i * range / 3)).toFixed(1)}
                </text>
              ))}
              {/* X軸ベースライン */}
              <line x1="20" y1="130" x2="300" y2="130" stroke="#EFE8DA" strokeWidth="0.5" />
              <defs>
                <linearGradient id="wGrad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="#E8835A" stopOpacity="0.2" />
                  <stop offset="100%" stopColor="#E8835A" stopOpacity="0" />
                </linearGradient>
              </defs>
              {/* グラデーション塗り */}
              {weights.length > 1 && (
                <path d={`${pathD} L ${toX(weights.length - 1)} 130 L ${toX(0)} 130 Z`} fill="url(#wGrad)" />
              )}
              {/* 折れ線 */}
              {weights.length > 1 && (
                <path d={pathD} stroke="#E8835A" strokeWidth="2"
                  fill="none" strokeLinecap="round" strokeLinejoin="round" />
              )}
              {/* 最新ポイント（クリックされていない場合） */}
              {weights.length > 0 && clickedIdx === null && (
                <>
                  <circle cx={toX(weights.length - 1)} cy={toY(weights[weights.length - 1])} r="4" fill="#E8835A" />
                  <circle cx={toX(weights.length - 1)} cy={toY(weights[weights.length - 1])} r="8" fill="#E8835A" fillOpacity="0.2" />
                </>
              )}
              {/* X軸日付ラベル */}
              {labelIndices.map(i => (
                <text key={i} x={toX(i)} y={148} textAnchor="middle" fontSize="8" fill="#8A8377" fontFamily="system-ui">
                  {fmtDate(chartData[i].recorded_at)}
                </text>
              ))}
              {/* クリック時ツールチップ */}
              {clickedIdx !== null && (() => {
                const cx = toX(clickedIdx)
                const cy = toY(weights[clickedIdx])
                const tx = Math.min(Math.max(cx, 46), 274)
                const ty = Math.max(cy - 48, 4)
                return (
                  <g>
                    <line x1={cx} y1={0} x2={cx} y2={130} stroke="#DDD6C8" strokeWidth="1" strokeDasharray="4 3" />
                    <rect x={tx - 46} y={ty} width="92" height="36" rx="7" fill="white" stroke="#DDD6C8" strokeWidth="1" />
                    <text x={tx} y={ty + 15} textAnchor="middle" fontSize="13" fontWeight="700" fill="#2C2A26" fontFamily="system-ui">
                      {weights[clickedIdx]}kg
                    </text>
                    <text x={tx} y={ty + 28} textAnchor="middle" fontSize="10" fill="#8A8377" fontFamily="system-ui">
                      {fmtDate(chartData[clickedIdx].recorded_at)}
                    </text>
                    <circle cx={cx} cy={cy} r="5" fill="white" stroke="#E8835A" strokeWidth="2.5" />
                  </g>
                )
              })()}
            </svg>
            <p className="text-xs text-[#8A8377] text-center mt-1">タップで詳細を表示</p>
          </div>
        )}

        {/* 記録一覧 */}
        {records.length > 0 && (
          <div className="bg-white rounded-2xl p-5 border border-[#DDD6C8]">
            <h2 className="text-base font-semibold text-[#2C2A26] mb-3">最近の記録</h2>
            <div className="flex flex-col">
              {(showAllRecords ? [...records].reverse() : records.slice(-7).reverse()).map((r) => {
                const idx = records.findIndex(rec => rec.id === r.id)
                const prev = idx > 0 ? records[idx - 1] : null
                const diff = prev ? (r.weight - prev.weight).toFixed(1) : null
                const isSelected = selectedDate === r.recorded_at
                return (
                  <div key={r.id}
                    onClick={() => { setSelectedDate(r.recorded_at); window.scrollTo({ top: 0, behavior: 'smooth' }) }}
                    className={`flex items-center justify-between py-2.5 border-b border-[#EFE8DA] last:border-0 cursor-pointer rounded-lg px-2 -mx-2 transition-colors ${
                      isSelected ? 'bg-[#E4ECDF]' : 'hover:bg-[#F8F4ED]'
                    }`}>
                    <span className="text-sm text-[#5C574F]">{r.recorded_at}</span>
                    <div className="flex items-center gap-2">
                      {diff !== null && (
                        <span className={`text-xs ${parseFloat(diff) < 0 ? 'text-[#7A9471]' : 'text-[#E8835A]'}`}>
                          {parseFloat(diff) < 0 ? '↓' : '↑'}{Math.abs(parseFloat(diff))}
                        </span>
                      )}
                      <span className="text-sm font-semibold text-[#2C2A26]">{r.weight}kg</span>
                      <button onClick={(e) => { e.stopPropagation(); deleteWeight(r.recorded_at) }}
                        className="text-[#8A8377] hover:text-red-400 transition-colors text-lg leading-none ml-1">
                        ×
                      </button>
                    </div>
                  </div>
                )
              })}
            </div>
            {records.length > 7 && (
              <button onClick={() => setShowAllRecords(!showAllRecords)}
                className="mt-3 w-full py-2 text-sm text-[#7A9471] hover:text-[#6A8462] font-medium transition-colors">
                {showAllRecords ? '折りたたむ ▲' : `全て表示する（${records.length}件） ▼`}
              </button>
            )}
          </div>
        )}

      </div>
    </div>
  )
}
