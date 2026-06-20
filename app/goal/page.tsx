'use client'
import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { supabase } from '../../lib/supabase'

type Result = {
  bmr: number
  tdee: number
  targetCal: number
  protein: number
  fat: number
  carbs: number
}

export default function Goal() {
  const router = useRouter()
  const [age, setAge] = useState('')
  const [height, setHeight] = useState('')
  const [weight, setWeight] = useState('')
  const [gender, setGender] = useState('female')
  const [activity, setActivity] = useState('1.375')
  const [goalWeight, setGoalWeight] = useState('')
  const [result, setResult] = useState<Result | null>(null)
  const [saving, setSaving] = useState(false)
  const [saved, setSaved] = useState(false)
  const [errorMsg, setErrorMsg] = useState<string | null>(null)

  const activityOptions = [
    { value: '1.2', label: 'ほぼ運動しない', sub: 'デスクワーク中心' },
    { value: '1.375', label: '軽め', sub: '週1〜2回の運動' },
    { value: '1.55', label: '適度', sub: '週3〜5回の運動' },
    { value: '1.725', label: '活発', sub: '毎日運動・立ち仕事' },
  ]

  useEffect(() => {
    const loadGoal = async () => {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) return
      const { data } = await supabase
        .from('user_goals')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false })
        .limit(1)
        .single()
      if (data) {
        setAge(String(data.age))
        setHeight(String(data.height))
        setWeight(String(data.weight))
        setGender(data.gender)
        setActivity(String(data.activity))
        setGoalWeight(String(data.goal_weight))
        setResult({
          bmr: data.bmr,
          tdee: data.tdee,
          targetCal: data.target_cal,
          protein: data.protein,
          fat: data.fat,
          carbs: data.carbs,
        })
      }
    }
    loadGoal()
  }, [])

  const calculate = () => {
    const a = parseFloat(age)
    const h = parseFloat(height)
    const w = parseFloat(weight)
    const g = parseFloat(goalWeight)
    const mult = parseFloat(activity)
    if (!a || !h || !w || !g) {
      setErrorMsg('すべての項目を入力してください')
      return
    }
    setErrorMsg(null)
    const bmr = gender === 'female'
      ? 447.6 + 9.2 * w + 3.1 * h - 4.3 * a
      : 88.4 + 13.4 * w + 4.8 * h - 5.7 * a
    const tdee = Math.round(bmr * mult)
    const deficit = Math.round((g * 7200) / 30)
    const targetCal = Math.max(1200, tdee - deficit)
    const protein = Math.round((targetCal * 0.25) / 4)
    const fat = Math.round((targetCal * 0.25) / 9)
    const carbs = Math.round((targetCal * 0.50) / 4)
    setResult({ bmr: Math.round(bmr), tdee, targetCal, protein, fat, carbs })
    setSaved(false)
  }

  const saveGoal = async () => {
    if (!result) return
    setSaving(true)
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) { setErrorMsg('ログインが必要です'); setSaving(false); return }
    const { error } = await supabase.from('user_goals').upsert({
      user_id: user.id,
      age: parseInt(age),
      height: parseFloat(height),
      weight: parseFloat(weight),
      gender,
      activity: parseFloat(activity),
      goal_weight: parseFloat(goalWeight),
      bmr: result.bmr,
      tdee: result.tdee,
      target_cal: result.targetCal,
      protein: result.protein,
      fat: result.fat,
      carbs: result.carbs,
    }, { onConflict: 'user_id' })
    if (error) { setErrorMsg('保存に失敗しました') } else {
      setSaved(true)
      setTimeout(() => router.push('/'), 1500)
    }
    setSaving(false)
  }

  return (
    <div className="min-h-screen bg-[#F8F4ED] pb-24">
      <div className="max-w-md mx-auto px-4 pt-8">
        <div className="mb-6">
          <p className="text-xs font-semibold tracking-widest text-[#7A9471] uppercase mb-1">Step 01</p>
          <h1 className="text-2xl font-bold text-[#2C2A26]">目標を設定する</h1>
          <a href="/learn" className="inline-flex items-center gap-1 text-xs text-[#7A9471] font-medium mt-2 hover:underline">
  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M2 3h6a4 4 0 0 1 4 4v14a3 3 0 0 0-3-3H2z"/>
    <path d="M22 3h-6a4 4 0 0 0-4 4v14a3 3 0 0 1 3-3h7z"/>
  </svg>
  なぜ痩せられるのか？解説を読む
</a>
        </div>
        <div className="bg-white rounded-2xl p-5 border border-[#DDD6C8] mb-4">
          <div className="mb-4">
            <label className="block text-sm text-[#5C574F] mb-2">性別</label>
            <div className="grid grid-cols-2 gap-2">
              {['female', 'male'].map((g) => (
                <button key={g} onClick={() => setGender(g)}
                  className={`py-2.5 rounded-xl text-sm font-medium border transition-all ${
                    gender === g ? 'bg-[#7A9471] text-white border-[#7A9471]' : 'bg-[#F8F4ED] text-[#5C574F] border-[#DDD6C8]'
                  }`}>
                  {g === 'female' ? '女性' : '男性'}
                </button>
              ))}
            </div>
          </div>
          <div className="grid grid-cols-3 gap-3 mb-4">
            {[
              { label: '年齢', placeholder: '32', unit: '歳', val: age, set: setAge },
              { label: '身長', placeholder: '162', unit: 'cm', val: height, set: setHeight },
              { label: '体重', placeholder: '58', unit: 'kg', val: weight, set: setWeight },
            ].map((item) => (
              <div key={item.label}>
                <label className="block text-xs text-[#5C574F] mb-1">{item.label}</label>
                <div className="relative">
                  <input type="number" value={item.val} onChange={(e) => item.set(e.target.value)}
                    placeholder={item.placeholder}
                    className="w-full px-3 py-2.5 rounded-xl border border-[#DDD6C8] bg-[#F8F4ED] text-[#2C2A26] text-sm focus:outline-none focus:border-[#7A9471]" />
                  <span className="absolute right-2 top-2.5 text-xs text-[#8A8377]">{item.unit}</span>
                </div>
              </div>
            ))}
          </div>
          <div className="mb-4">
            <label className="block text-sm text-[#5C574F] mb-2">1日の運動量</label>
            <div className="flex flex-col gap-2">
              {activityOptions.map((opt) => (
                <button key={opt.value} onClick={() => setActivity(opt.value)}
                  className={`flex items-center justify-between px-4 py-3 rounded-xl border text-left transition-all ${
                    activity === opt.value ? 'bg-[#E4ECDF] border-[#7A9471] text-[#7A9471]' : 'bg-[#F8F4ED] border-[#DDD6C8] text-[#5C574F]'
                  }`}>
                  <span className="text-sm font-medium">{opt.label}</span>
                  <span className="text-xs opacity-70">{opt.sub}</span>
                </button>
              ))}
            </div>
          </div>
          <div>
            <label className="block text-sm text-[#5C574F] mb-1">1か月の減量目標</label>
            <div className="relative">
              <input type="number" value={goalWeight} onChange={(e) => setGoalWeight(e.target.value)}
                placeholder="2" step="0.5" min="0" max="4"
                className="w-full px-4 py-3 rounded-xl border border-[#DDD6C8] bg-[#F8F4ED] text-[#2C2A26] focus:outline-none focus:border-[#7A9471]" />
              <span className="absolute right-4 top-3.5 text-sm text-[#8A8377]">kg / 月</span>
            </div>
          </div>
        </div>
        {errorMsg && !result && (
          <div className="mb-3 px-4 py-3 bg-[#FCEEE5] rounded-xl border border-[#F5B89D]">
            <p className="text-sm text-[#E8835A]">{errorMsg}</p>
          </div>
        )}
        <button onClick={calculate}
          className="w-full py-4 bg-[#7A9471] text-white rounded-2xl font-semibold text-base hover:bg-[#6A8462] transition-colors shadow-sm mb-3">
          私の数字を計算する →
        </button>
        {result && (
          <div className="bg-[#FCEEE5] rounded-2xl p-5 border border-[#F5B89D]">
            <p className="text-[#E8835A] font-medium text-sm mb-1">あなたの1日のプラン</p>
            <div className="text-3xl font-bold text-[#2C2A26] mb-1">
              {result.targetCal.toLocaleString()} <span className="text-base font-normal text-[#8A8377]">kcal</span>
            </div>
            <p className="text-xs text-[#8A8377] mb-4">
              基礎代謝 {result.bmr.toLocaleString()} kcal · 活動代謝 {result.tdee.toLocaleString()} kcal
            </p>
            <div className="grid grid-cols-3 gap-3 pt-4 border-t border-[#F5B89D] mb-4">
              {[
                { label: 'タンパク質', val: result.protein, color: '#E8835A' },
                { label: '脂質', val: result.fat, color: '#D4A340' },
                { label: '炭水化物', val: result.carbs, color: '#7A9471' },
              ].map((item) => (
                <div key={item.label} className="text-center">
                  <div className="text-xs text-[#8A8377] mb-1">{item.label}</div>
                  <div className="text-2xl font-bold" style={{ color: item.color }}>
                    {item.val}<span className="text-xs font-normal text-[#8A8377]">g</span>
                  </div>
                </div>
              ))}
            </div>
            {errorMsg && (
              <div className="mb-3 px-3 py-2 bg-white/50 rounded-xl border border-[#F5B89D]">
                <p className="text-xs text-[#E8835A]">{errorMsg}</p>
              </div>
            )}
            {saved ? (
              <div className="text-center text-sm text-[#7A9471] font-medium py-2">✓ 保存しました！</div>
            ) : (
              <button onClick={saveGoal} disabled={saving}
                className="w-full py-3 bg-[#E8835A] text-white rounded-xl font-medium hover:bg-[#D4724A] transition-colors disabled:opacity-50">
                {saving ? '保存中...' : 'この目標を保存する'}
              </button>
            )}
          </div>
        )}
      </div>
    </div>
  )
}