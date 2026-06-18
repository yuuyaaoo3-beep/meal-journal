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
  const [records, setRecords] = useState<any[]>([])
  const [saving, setSaving] = useState(false)
  const [todayTotal, setTodayTotal] = useState({ calories: 0, protein: 0, fat: 0, carbs: 0 })
  const [targetCal, setTargetCal] = useState(1750)
  const [selectedDate, setSelectedDate] = useState(new Date().toISOString().split('T')[0])
  const [myMeals, setMyMeals] = useState<any[]>([])
  const [myDishes, setMyDishes] = useState<any[]>([])
  const [showMyMeals, setShowMyMeals] = useState(false)
  const [myMealSearch, setMyMealSearch] = useState('')
  const [editingMeal, setEditingMeal] = useState<any>(null)
  const [inputMode, setInputMode] = useState<'none' | 'manual' | 'mymeal'>('none')
  const [selectedMyMealIds, setSelectedMyMealIds] = useState<string[]>([])
  const [pickerTab, setPickerTab] = useState<'mymeal' | 'mydish'>('mymeal')

  useEffect(() => {
    loadRecords()
    loadTarget()
    loadMyMeals()
  }, [selectedDate])

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

  const loadMyMeals = async () => {
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return
    const [{ data: meals }, { data: dishes }] = await Promise.all([
      supabase.from('my_meals').select('*').eq('user_id', user.id).order('created_at', { ascending: false }),
      supabase.from('my_dishes').select('*').eq('user_id', user.id).order('created_at', { ascending: false }),
    ])
    if (meals) setMyMeals(meals)
    if (dishes) setMyDishes(dishes)
  }

  const loadRecords = async () => {
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return
    const { data } = await supabase
      .from('meal_records')
      .select('*')
      .eq('user_id', user.id)
      .eq('recorded_at', selectedDate)
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

  const selectFood = (food: any) => {
    setFoodName(food.food_name || food.name)
    setCalories(String(food.calories))
    setProtein(String(food.protein))
    setFat(String(food.fat))
    setCarbs(String(food.carbs))
    setShowMyMeals(false)
    setSelectedMyMealIds([])
    setInputMode('mymeal')
  }

  const toggleMyMealSelection = (id: string) => {
    setSelectedMyMealIds(prev =>
      prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id]
    )
  }

  const confirmMyMealSelection = () => {
    const selected = myMeals.filter(m => selectedMyMealIds.includes(m.id))
    if (selected.length === 0) return
    setFoodName(selected.map(m => m.food_name).join('・'))
    setCalories(String(selected.reduce((s, m) => s + (m.calories || 0), 0)))
    setProtein(String(Math.round(selected.reduce((s, m) => s + (m.protein || 0), 0) * 10) / 10))
    setFat(String(Math.round(selected.reduce((s, m) => s + (m.fat || 0), 0) * 10) / 10))
    setCarbs(String(Math.round(selected.reduce((s, m) => s + (m.carbs || 0), 0) * 10) / 10))
    setShowMyMeals(false)
    setSelectedMyMealIds([])
    setInputMode('mymeal')
  }

  const saveRecord = async () => {
    if (!foodName) { alert('食べたものを入力してください'); return }
    setSaving(true)
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) { alert('ログインが必要です'); setSaving(false); return }
    const { error } = await supabase.from('meal_records').insert({
      user_id: user.id,
      meal_type: activeTab,
      food_name: foodName,
      calories: parseInt(calories) || 0,
      protein: parseFloat(protein) || 0,
      fat: parseFloat(fat) || 0,
      carbs: parseFloat(carbs) || 0,
      recorded_at: selectedDate,
    })
    if (error) {
      alert('保存に失敗しました')
    } else {
      setFoodName('')
      setCalories('')
      setProtein('')
      setFat('')
      setCarbs('')
      setInputMode('none')
      setShowMyMeals(false)
      setSelectedMyMealIds([])
      loadRecords()
    }
    setSaving(false)
  }

  const saveToMyMeals = async () => {
    if (!foodName) { alert('食べたものを入力してください'); return }
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return
    const { error } = await supabase.from('my_meals').insert({
      user_id: user.id,
      food_name: foodName,
      calories: parseInt(calories) || 0,
      protein: parseFloat(protein) || 0,
      fat: parseFloat(fat) || 0,
      carbs: parseFloat(carbs) || 0,
    })
    if (error) {
      alert('保存に失敗しました')
    } else {
      alert('マイミールに保存しました！')
      loadMyMeals()
    }
  }

  const deleteRecord = async (id: string) => {
    await supabase.from('meal_records').delete().eq('id', id)
    loadRecords()
  }

  const deleteMyMeal = async (id: string) => {
    if (!confirm('このマイミールを削除しますか？')) return
    await supabase.from('my_meals').delete().eq('id', id)
    loadMyMeals()
  }

  const startEditMyMeal = (meal: any) => {
    setEditingMeal(meal)
  }

  const updateMyMeal = async () => {
    if (!editingMeal) return
    await supabase.from('my_meals').update({
      food_name: editingMeal.food_name,
      calories: parseInt(editingMeal.calories) || 0,
      protein: parseFloat(editingMeal.protein) || 0,
      fat: parseFloat(editingMeal.fat) || 0,
      carbs: parseFloat(editingMeal.carbs) || 0,
    }).eq('id', editingMeal.id)
    setEditingMeal(null)
    loadMyMeals()
  }

  const progress = Math.min(100, Math.round((todayTotal.calories / targetCal) * 100))

  return (
    <div className="min-h-screen bg-[#F8F4ED] pb-24">
      <div className="max-w-md mx-auto px-4 pt-8">
        <div className="mb-6">
          <p className="text-xs font-semibold tracking-widest text-[#7A9471] uppercase mb-1">Record</p>
          <h1 className="text-2xl font-bold text-[#2C2A26]">食事を記録する</h1>
          <p className="text-sm text-[#8A8377] mt-1">今日食べたものを残しましょう</p>
        </div>

        {/* 日付選択 */}
        <div className="bg-white rounded-2xl p-4 border border-[#DDD6C8] mb-4">
          <label className="block text-xs text-[#5C574F] mb-1">記録する日付</label>
          <div className="flex">
            <input type="date" value={selectedDate} onChange={(e) => setSelectedDate(e.target.value)}
              max={new Date().toISOString().split('T')[0]}
              className="flex-1 min-w-0 px-3 py-2.5 rounded-xl border border-[#DDD6C8] bg-[#F8F4ED] text-[#2C2A26] focus:outline-none focus:border-[#7A9471]" />
          </div>
        </div>

        <div className="bg-white rounded-2xl p-5 border border-[#DDD6C8] mb-4">
          <div className="flex justify-between items-end mb-2">
            <div>
              <span className="text-2xl font-bold text-[#2C2A26]">{todayTotal.calories.toLocaleString()}</span>
              <span className="text-sm text-[#8A8377] ml-1">/ {targetCal.toLocaleString()} kcal</span>
            </div>
            <span className="text-sm font-medium text-[#7A9471]">{progress}%</span>
          </div>
          <div className="w-full h-2 bg-[#EFE8DA] rounded-full overflow-hidden mb-4">
            <div className="h-full bg-[#E8835A] rounded-full transition-all duration-500"
              style={{ width: `${progress}%` }} />
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

        <div className="bg-white rounded-2xl p-5 border border-[#DDD6C8] mb-4">
          {/* モード選択ボタン */}
          <div className="flex gap-2 mb-4">
            <button
              onClick={() => { setShowMyMeals(!showMyMeals); if (inputMode === 'manual') setInputMode('none') }}
              className={`flex-1 py-2.5 rounded-xl text-sm font-medium border transition-all ${
                showMyMeals ? 'bg-[#7A9471] text-white border-[#7A9471]' : 'bg-[#F8F4ED] text-[#5C574F] border-[#DDD6C8]'
              }`}>
              ⭐ マイミールから選択
            </button>
            <button
              onClick={() => { setInputMode('manual'); setShowMyMeals(false) }}
              className={`flex-1 py-2.5 rounded-xl text-sm font-medium border transition-all ${
                inputMode === 'manual' ? 'bg-[#E8835A] text-white border-[#E8835A]' : 'bg-[#F8F4ED] text-[#5C574F] border-[#DDD6C8]'
              }`}>
              ✏️ 手入力
            </button>
          </div>

          {/* ピッカー */}
          {showMyMeals && (
            <div className="mb-4">
              {/* タブ */}
              <div className="flex gap-1 mb-3 bg-[#F8F4ED] p-1 rounded-xl">
                <button onClick={() => setPickerTab('mymeal')}
                  className={`flex-1 py-2 rounded-lg text-xs font-medium transition-all ${
                    pickerTab === 'mymeal' ? 'bg-white text-[#2C2A26] shadow-sm' : 'text-[#8A8377]'
                  }`}>
                  ⭐ マイミール
                </button>
                <button onClick={() => setPickerTab('mydish')}
                  className={`flex-1 py-2 rounded-lg text-xs font-medium transition-all ${
                    pickerTab === 'mydish' ? 'bg-white text-[#2C2A26] shadow-sm' : 'text-[#8A8377]'
                  }`}>
                  🍽 マイディッシュ
                </button>
              </div>

              {pickerTab === 'mymeal' ? (
                <>
                  <input type="text" value={myMealSearch} onChange={(e) => setMyMealSearch(e.target.value)}
                    placeholder="マイミールを検索..."
                    className="w-full px-3 py-2.5 rounded-xl border border-[#DDD6C8] bg-[#F8F4ED] text-sm focus:outline-none focus:border-[#7A9471] mb-3" />
                  {myMeals.length === 0 ? (
                    <p className="text-xs text-[#8A8377] text-center py-4">まだマイミールがありません</p>
                  ) : myMeals.filter(m => m.food_name.includes(myMealSearch)).length === 0 ? (
                    <p className="text-xs text-[#8A8377] text-center py-4">見つかりませんでした</p>
                  ) : (
                    <div className="flex flex-col gap-2 max-h-52 overflow-y-auto mb-3">
                      {myMeals.filter(m => m.food_name.includes(myMealSearch)).map((meal) => {
                        const isSelected = selectedMyMealIds.includes(meal.id)
                        return (
                          <button key={meal.id} onClick={() => toggleMyMealSelection(meal.id)}
                            className={`rounded-xl p-3 border text-left transition-all flex items-center gap-3 ${
                              isSelected ? 'bg-[#E4ECDF] border-[#7A9471]' : 'bg-[#F8F4ED] border-[#DDD6C8] hover:border-[#7A9471]'
                            }`}>
                            <div className={`w-5 h-5 rounded-md border-2 flex items-center justify-center flex-shrink-0 transition-all ${
                              isSelected ? 'bg-[#7A9471] border-[#7A9471]' : 'border-[#DDD6C8] bg-white'
                            }`}>
                              {isSelected && (
                                <svg width="12" height="12" viewBox="0 0 12 12" fill="none">
                                  <path d="M2 6l3 3 5-5" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                                </svg>
                              )}
                            </div>
                            <div className="flex-1 min-w-0">
                              <div className="text-sm font-medium text-[#2C2A26] truncate">{meal.food_name}</div>
                              <div className="text-xs text-[#8A8377]">{meal.calories}kcal · P{meal.protein}g · F{meal.fat}g · C{meal.carbs}g</div>
                            </div>
                          </button>
                        )
                      })}
                    </div>
                  )}
                  {selectedMyMealIds.length > 0 && (
                    <button onClick={confirmMyMealSelection}
                      className="w-full py-2.5 bg-[#7A9471] text-white rounded-xl text-sm font-medium hover:bg-[#6A8462] transition-colors">
                      {selectedMyMealIds.length}品を選択して追加 →
                    </button>
                  )}
                </>
              ) : (
                <>
                  {myDishes.length === 0 ? (
                    <p className="text-xs text-[#8A8377] text-center py-4">まだマイディッシュがありません</p>
                  ) : (
                    <div className="flex flex-col gap-2 max-h-52 overflow-y-auto">
                      {myDishes.map((dish) => (
                        <button key={dish.id} onClick={() => selectFood({ food_name: dish.dish_name, calories: dish.calories, protein: dish.protein, fat: dish.fat, carbs: dish.carbs })}
                          className="bg-[#F8F4ED] rounded-xl p-3 border border-[#DDD6C8] text-left hover:border-[#7A9471] transition-all">
                          <div className="text-sm font-medium text-[#2C2A26]">{dish.dish_name}</div>
                          <div className="text-xs text-[#8A8377] truncate mb-0.5">{dish.meal_names}</div>
                          <div className="text-xs text-[#8A8377]">{dish.calories}kcal · P{dish.protein}g · F{dish.fat}g · C{dish.carbs}g</div>
                        </button>
                      ))}
                    </div>
                  )}
                </>
              )}
            </div>
          )}

          {/* 入力フォーム（手入力 or マイミール選択後） */}
          {(inputMode === 'manual' || inputMode === 'mymeal') && (
            <>
              <div className="mb-3">
                <label className="block text-sm text-[#5C574F] mb-1">食べたもの</label>
                <input type="text" value={foodName} onChange={(e) => setFoodName(e.target.value)}
                  placeholder="例：鮭の塩焼き、ごはん"
                  className="w-full px-4 py-3 rounded-xl border border-[#DDD6C8] bg-[#F8F4ED] text-[#2C2A26] focus:outline-none focus:border-[#7A9471]" />
              </div>
              <div className="grid grid-cols-2 gap-3 mb-3">
                {[
                  { label: 'カロリー (kcal)', val: calories, set: setCalories, placeholder: '300' },
                  { label: 'タンパク質 (g)', val: protein, set: setProtein, placeholder: '20' },
                  { label: '脂質 (g)', val: fat, set: setFat, placeholder: '10' },
                  { label: '炭水化物 (g)', val: carbs, set: setCarbs, placeholder: '40' },
                ].map((item) => (
                  <div key={item.label}>
                    <label className="block text-xs text-[#5C574F] mb-1">{item.label}</label>
                    <input type="number" value={item.val} onChange={(e) => item.set(e.target.value)}
                      placeholder={item.placeholder}
                      className="w-full px-3 py-2.5 rounded-xl border border-[#DDD6C8] bg-[#F8F4ED] text-[#2C2A26] text-sm focus:outline-none focus:border-[#7A9471]" />
                  </div>
                ))}
              </div>
              <div className="flex gap-2">
                <button onClick={saveRecord} disabled={saving}
                  className="flex-1 py-3 bg-[#7A9471] text-white rounded-xl font-medium hover:bg-[#6A8462] transition-colors disabled:opacity-50">
                  {saving ? '保存中...' : '記録する'}
                </button>
                {inputMode === 'manual' && (
                  <button onClick={saveToMyMeals}
                    className="px-4 py-3 bg-[#FCEEE5] text-[#E8835A] rounded-xl font-medium hover:bg-[#F5D5C5] transition-colors text-sm whitespace-nowrap">
                    ⭐ 保存
                  </button>
                )}
              </div>
            </>
          )}
        </div>

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