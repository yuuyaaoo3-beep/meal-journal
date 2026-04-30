'use client'
import { useState, useEffect } from 'react'
import { supabase } from '../../lib/supabase'

const MEAL_TYPES = [
  { key: 'breakfast', label: '朝食', icon: '🌅' },
  { key: 'lunch', label: '昼食', icon: '☀️' },
  { key: 'dinner', label: '夕食', icon: '🌙' },
  { key: 'snack', label: '間食', icon: '🍪' },
]

const COMMON_FOODS = [
  { name: 'ごはん(150g)', calories: 252, protein: 3.8, fat: 0.5, carbs: 55.7 },
  { name: 'ゆで卵', calories: 91, protein: 7.4, fat: 6.2, carbs: 0.2 },
  { name: '鶏胸肉(100g)', calories: 116, protein: 24.4, fat: 1.9, carbs: 0 },
  { name: 'バナナ', calories: 93, protein: 1.1, fat: 0.2, carbs: 22.5 },
  { name: 'オートミール(40g)', calories: 152, protein: 5.2, fat: 2.8, carbs: 26.4 },
  { name: '豆腐(150g)', calories: 108, protein: 9.9, fat: 6.2, carbs: 1.7 },
  { name: 'サラダチキン', calories: 114, protein: 24.5, fat: 1.3, carbs: 0.1 },
  { name: '食パン(6枚切り1枚)', calories: 158, protein: 5.6, fat: 2.5, carbs: 28.0 },
]

export default function Record() {
  const [activeTab, setActiveTab] = useState('breakfast')
  const [foodName, setFoodName] = useState('')
  const [calories, setCalories] = useState('')
  const [protein, setProtein] = useState('')
  const [fat, setFat] = useState('')
  const [carbs, setCarbs] = useState('')
  const [records, setRecords] = useState([])
  const [saving, setSaving] = useState(false)
  const [todayTotal, setTodayTotal] = useState({ calories: 0, protein: 0, fat: 0, carbs: 0 })
  const [targetCal, setTargetCal] = useState(1750)

  useEffect(() => {
    loadRecords()
    loadTarget()
  }, [])

  const loadTarget = async () => {
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return
    const { data } = await supabase
      .from('user_goals')
      .select('target_cal')
      .eq('user_id', user.id)
      .single()
    if (data) setTargetCal(data.target_cal)
  }

  const loadRecords = async () => {
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return
    const today = new Date().toISOString().split('T')[0]
    const { data } = await supabase
      .from('meal_records')
      .select('*')
      .eq('user_id', user.id)
      .eq('recorded_at', today)
      .order('created_at', { ascending: true })
    if (data) {
      setRecords(data)
      const total = data.reduce((acc, r) => ({
        calories: acc.calories + (r.calories || 0),
        protein: acc.protein + (r.protein || 0),
        fat: acc.fat + (r.fat || 0),
        carbs: acc.carbs + (r.carbs || 0),
      }), { calories: 0, protein: 0, fat: 0, carbs: 0 })
      setTodayTotal(total)
    }
  }

  const selectFood = (food) => {
    setFoodName(food.name)
    setCalories(String(food.calories))
    setProtein(String(food.protein))
    setFat(String(food.fat))
    setCarbs(String(food.carbs))
  }

  const saveRecord = async () => {
    if (!foodName) { alert('食べたものを入力してください'); return }
    setSaving(true)
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) { alert('ログインが必要です'); setSaving(false); return }
    const today = new Date().toISOString().split('T')[0]
    const { error } = await supabase.from('meal_records').insert({
      user_id: user.id,
      meal_type: activeTab,
      food_name: foodName,
      calories: parseInt(calories) || 0,
      protein: parseFloat(protein) || 0,
      fat: parseFloat(fat) || 0,
      carbs: parseFloat(carbs) || 0,
      recorded_at: today,
    })
    if (error) {
      alert('保存に失敗しました')
    } else {
      setFoodName('')
      setCalories('')
      setProtein('')
      setFat('')
      setCarbs('')
      loadRecords()
    }
    setSaving(false)
  }

  const deleteRecord = async (id) => {
    await supabase.from('meal_records').delete().eq('id', id)
    loadRecords()
  }

  const progress = Math.min(100, Math.round((todayTotal.calories / targetCal) * 100))

  return (
    <div className="min-h-screen bg-[#F8F4ED] pb-24">
      <div className="max-w-md mx-auto px-4 pt-8">

        {/* ヘッダー */}
        <div className="mb-6">
          <p className="text-xs font-semibold tracking-widest text-[#7A9471] uppercase mb-1">Record</p>
          <h1 className="text-2xl font-bold text-[#2C2A26]">食事を記録する</h1>
          <p className="text-sm text-[#8A8377] mt-1">今日食べたものを残しましょう</p>
        </div>

        {/* カロリー進捗 */}
        <div className="bg-white rounded-2xl p-5 border border-[#DDD6C8] mb-4">
          <div className="flex justify-between items-end mb-2">
            <div>
              <span className="text-2xl font-bold text-[#2C2A26]">{todayTotal.calories.toLocaleString()}</span>
              <span className="text-sm text-[#8A8377] ml-1">/ {targetCal.toLocaleString()} kcal</span>
            </div>
            <span className="text-sm font-medium text-[#7A9471]">{progress}%</span>
          </div>
          <div className="w-full h-2 bg-[#EFE8DA] rounded-full overflow-hidden mb-4">
            <div
              className="h-full bg-[#E8835A] rounded-full transition-all duration-500"
              style={{ width: `${progress}%` }}
            />
          </div>
          <div className="grid grid-cols-3 gap-3">
            {[
              { label: 'P タンパク質', val: todayTotal.protein, color: '#E8835A' },
              { label: 'F 脂質', val: todayTotal.fat, color: '#D4A340' },
              { label: 'C 炭水化物', val: todayTotal.carbs, color: '#7A9471' },
            ].map((item) => (
              <div key={item.label} className="text-center">
                <div className="text-xs text-[#8A8377] mb-1">{item.label}</div>
                <div className="text-lg font-bold" style={{ color: item.color }}>
                  {Math.round(item.val)}<span className="text-xs font-normal text-[#8A8377]">g</span>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* タブ */}
        <div className="flex gap-2 mb-4 overflow-x-auto">
          {MEAL_TYPES.map((m) => (
            <button key={m.key} onClick={() => setActiveTab(m.key)}
              className={`flex-shrink-0 px-4 py-2 rounded-full text-sm font-medium border transition-all ${
                activeTab === m.key
                  ? 'bg-[#E8835A] text-white border-[#E8835A]'
                  : 'bg-white text-[#5C574F] border-[#DDD6C8]'
              }`}>
              {m.icon} {m.label}
            </button>
          ))}
        </div>

        {/* 記録済みリスト */}
        {records.filter(r => r.meal_type === activeTab).length > 0 && (
          <div className="mb-4">
            {records.filter(r => r.meal_type === activeTab).map((r) => (
              <div key={r.id} className="bg-white rounded-xl p-3 border border-[#DDD6C8] mb-2 flex justify-between items-center">
                <div>
                  <div className="text-sm font-medium text-[#2C2A26]">{r.food_name}</div>
                  <div className="text-xs text-[#8A8377]">
                    {r.calories}kcal · P{r.protein}g · F{r.fat}g · C{r.carbs}g
                  </div>
                </div>
                <button onClick={() => deleteRecord(r.id)}
                  className="text-[#DDD6C8] hover:text-[#E8835A] text-lg transition-colors ml-2">
                  ×
                </button>
              </div>
            ))}
          </div>
        )}

        {/* 入力フォーム */}
        <div className="bg-white rounded-2xl p-5 border border-[#DDD6C8] mb-4">
          <div className="mb-3">
            <label className="block text-sm text-[#5C574F] mb-1">食べたもの</label>
            <input type="text" value={foodName} onChange={(e) => setFoodName(e.target.value)}
              placeholder="例：鮭の塩焼き、ごはん"
              className="w-full px-4 py-3 rounded-xl border border-[#DDD6C8] bg-[#F8F4ED] text-[#2C2A26] focus:outline-none focus:border-[#7A9471]" />
          </div>
          <div className="grid grid-cols-2 gap-3 mb-3">
            <div>
              <label className="block text-xs text-[#5C574F] mb-1">カロリー (kcal)</label>
              <input type="number" value={calories} onChange={(e) => setCalories(e.target.value)}
                placeholder="300"
                className="w-full px-3 py-2.5 rounded-xl border border-[#DDD6C8] bg-[#F8F4ED] text-[#2C2A26] text-sm focus:outline-none focus:border-[#7A9471]" />
            </div>
            <div>
              <label className="block text-xs text-[#5C574F] mb-1">タンパク質 (g)</label>
              <input type="number" value={protein} onChange={(e) => setProtein(e.target.value)}
                placeholder="20"
                className="w-full px-3 py-2.5 rounded-xl border border-[#DDD6C8] bg-[#F8F4ED] text-[#2C2A26] text-sm focus:outline-none focus:border-[#7A9471]" />
            </div>
            <div>
              <label className="block text-xs text-[#5C574F] mb-1">脂質 (g)</label>
              <input type="number" value={fat} onChange={(e) => setFat(e.target.value)}
                placeholder="10"
                className="w-full px-3 py-2.5 rounded-xl border border-[#DDD6C8] bg-[#F8F4ED] text-[#2C2A26] text-sm focus:outline-none focus:border-[#7A9471]" />
            </div>
            <div>
              <label className="block text-xs text-[#5C574F] mb-1">炭水化物 (g)</label>
              <input type="number" value={carbs} onChange={(e) => setCarbs(e.target.value)}
                placeholder="40"
                className="w-full px-3 py-2.5 rounded-xl border border-[#DDD6C8] bg-[#F8F4ED] text-[#2C2A26] text-sm focus:outline-none focus:border-[#7A9471]" />
            </div>
          </div>
          <button onClick={saveRecord} disabled={saving}
            className="w-full py-3 bg-[#7A9471] text-white rounded-xl font-medium hover:bg-[#6A8462] transition-colors disabled:opacity-50">
            {saving ? '保存中...' : '記録する'}
          </button>
        </div>

        {/* よく食べるもの */}
        <div>
          <p className="text-sm font-medium text-[#5C574F] mb-2">よく食べるもの</p>
          <div className="grid grid-cols-2 gap-2">
            {COMMON_FOODS.map((food) => (
              <button key={food.name} onClick={() => selectFood(food)}
                className="bg-white rounded-xl p-3 border border-[#DDD6C8] text-left hover:border-[#7A9471] transition-all">
                <div className="text-xs font-medium text-[#2C2A26] mb-1">{food.name}</div>
                <div className="text-xs text-[#8A8377]">{food.calories}kcal</div>
              </button>
            ))}
          </div>
        </div>

      </div>
    </div>
  )
}