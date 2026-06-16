'use client'
import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { supabase } from '../../lib/supabase'

export default function MyDishes() {
  const router = useRouter()
  const [myMeals, setMyMeals] = useState<any[]>([])
  const [myDishes, setMyDishes] = useState<any[]>([])
  const [dishName, setDishName] = useState('')
  const [selectedIds, setSelectedIds] = useState<string[]>([])
  const [search, setSearch] = useState('')
  const [saving, setSaving] = useState(false)
  const [showForm, setShowForm] = useState(false)

  useEffect(() => {
    loadData()
  }, [])

  const loadData = async () => {
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) { router.push('/login'); return }
    const [{ data: meals }, { data: dishes }] = await Promise.all([
      supabase.from('my_meals').select('*').eq('user_id', user.id).order('created_at', { ascending: false }),
      supabase.from('my_dishes').select('*').eq('user_id', user.id).order('created_at', { ascending: false }),
    ])
    if (meals) setMyMeals(meals)
    if (dishes) setMyDishes(dishes)
  }

  const toggle = (id: string) => {
    setSelectedIds(prev => prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id])
  }

  const selectedMeals = myMeals.filter(m => selectedIds.includes(m.id))
  const preview = {
    calories: selectedMeals.reduce((s, m) => s + (m.calories || 0), 0),
    protein: Math.round(selectedMeals.reduce((s, m) => s + (m.protein || 0), 0) * 10) / 10,
    fat: Math.round(selectedMeals.reduce((s, m) => s + (m.fat || 0), 0) * 10) / 10,
    carbs: Math.round(selectedMeals.reduce((s, m) => s + (m.carbs || 0), 0) * 10) / 10,
  }

  const saveDish = async () => {
    if (!dishName.trim()) { alert('ディッシュ名を入力してください'); return }
    if (selectedIds.length === 0) { alert('マイミールを1つ以上選択してください'); return }
    setSaving(true)
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) { setSaving(false); return }
    const { error } = await supabase.from('my_dishes').insert({
      user_id: user.id,
      dish_name: dishName.trim(),
      meal_names: selectedMeals.map(m => m.food_name).join('・'),
      calories: preview.calories,
      protein: preview.protein,
      fat: preview.fat,
      carbs: preview.carbs,
    })
    if (error) {
      alert('保存に失敗しました')
    } else {
      setDishName('')
      setSelectedIds([])
      setSearch('')
      setShowForm(false)
      loadData()
    }
    setSaving(false)
  }

  const deleteDish = async (id: string) => {
    if (!confirm('このマイディッシュを削除しますか？')) return
    await supabase.from('my_dishes').delete().eq('id', id)
    loadData()
  }

  const filtered = myMeals.filter(m => m.food_name.includes(search))

  return (
    <div className="min-h-screen bg-[#F8F4ED] pb-24">
      <div className="max-w-md mx-auto px-4 pt-8">
        <div className="mb-6">
          <button onClick={() => router.back()} className="text-sm text-[#7A9471] hover:underline mb-3 block">← 戻る</button>
          <p className="text-xs font-semibold tracking-widest text-[#7A9471] uppercase mb-1">My Dishes</p>
          <h1 className="text-2xl font-bold text-[#2C2A26]">マイディッシュ</h1>
          <p className="text-sm text-[#8A8377] mt-1">よく食べる組み合わせをまとめて登録</p>
        </div>

        {/* 作成ボタン */}
        {!showForm && (
          <button onClick={() => setShowForm(true)}
            className="w-full py-3 bg-[#7A9471] text-white rounded-2xl font-medium hover:bg-[#6A8462] transition-colors mb-6">
            + 新しいマイディッシュを作成
          </button>
        )}

        {/* 作成フォーム */}
        {showForm && (
          <div className="bg-white rounded-2xl p-5 border border-[#DDD6C8] mb-6">
            <h2 className="text-base font-semibold text-[#2C2A26] mb-4">新しいマイディッシュ</h2>

            <div className="mb-4">
              <label className="block text-sm text-[#5C574F] mb-1">ディッシュ名</label>
              <input type="text" value={dishName} onChange={(e) => setDishName(e.target.value)}
                placeholder="例：たまごかけ納豆ご飯"
                className="w-full px-4 py-3 rounded-xl border border-[#DDD6C8] bg-[#F8F4ED] text-[#2C2A26] focus:outline-none focus:border-[#7A9471]" />
            </div>

            <div className="mb-4">
              <label className="block text-sm text-[#5C574F] mb-2">マイミールを選択</label>
              <input type="text" value={search} onChange={(e) => setSearch(e.target.value)}
                placeholder="検索..."
                className="w-full px-3 py-2.5 rounded-xl border border-[#DDD6C8] bg-[#F8F4ED] text-sm focus:outline-none focus:border-[#7A9471] mb-2" />
              {myMeals.length === 0 ? (
                <p className="text-xs text-[#8A8377] text-center py-4">マイミールがありません</p>
              ) : (
                <div className="flex flex-col gap-2 max-h-56 overflow-y-auto">
                  {filtered.map((meal) => {
                    const isSelected = selectedIds.includes(meal.id)
                    return (
                      <button key={meal.id} onClick={() => toggle(meal.id)}
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
            </div>

            {/* プレビュー */}
            {selectedIds.length > 0 && (
              <div className="bg-[#F8F4ED] rounded-xl p-4 mb-4 border border-[#DDD6C8]">
                <p className="text-xs text-[#8A8377] mb-1">合計栄養値プレビュー</p>
                <div className="text-sm font-bold text-[#2C2A26] mb-1">{preview.calories} kcal</div>
                <div className="text-xs text-[#8A8377]">P {preview.protein}g · F {preview.fat}g · C {preview.carbs}g</div>
                <div className="text-xs text-[#8A8377] mt-1 truncate">{selectedMeals.map(m => m.food_name).join('・')}</div>
              </div>
            )}

            <div className="flex gap-2">
              <button onClick={() => { setShowForm(false); setDishName(''); setSelectedIds([]); setSearch('') }}
                className="flex-1 py-3 bg-[#F8F4ED] text-[#5C574F] rounded-xl font-medium border border-[#DDD6C8]">
                キャンセル
              </button>
              <button onClick={saveDish} disabled={saving || selectedIds.length === 0 || !dishName.trim()}
                className="flex-1 py-3 bg-[#7A9471] text-white rounded-xl font-medium hover:bg-[#6A8462] transition-colors disabled:opacity-50">
                {saving ? '保存中...' : '作成する'}
              </button>
            </div>
          </div>
        )}

        {/* マイディッシュ一覧 */}
        {myDishes.length === 0 ? (
          <div className="text-center py-12 text-[#8A8377] text-sm">
            まだマイディッシュがありません
          </div>
        ) : (
          <div className="flex flex-col gap-3">
            {myDishes.map((dish) => (
              <div key={dish.id} className="bg-white rounded-2xl p-4 border border-[#DDD6C8]">
                <div className="flex items-start justify-between gap-2">
                  <div className="flex-1 min-w-0">
                    <div className="text-base font-semibold text-[#2C2A26] mb-1">{dish.dish_name}</div>
                    <div className="text-xs text-[#8A8377] mb-2 truncate">{dish.meal_names}</div>
                    <div className="text-sm font-bold text-[#E8835A]">{dish.calories} kcal</div>
                    <div className="text-xs text-[#8A8377]">P {dish.protein}g · F {dish.fat}g · C {dish.carbs}g</div>
                  </div>
                  <button onClick={() => deleteDish(dish.id)}
                    className="text-[#DDD6C8] hover:text-[#E8835A] transition-colors text-lg flex-shrink-0">
                    ×
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
