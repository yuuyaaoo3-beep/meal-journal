'use client'
import { useState, useEffect } from 'react'
import { supabase } from '../../lib/supabase'
import { useRouter } from 'next/navigation'

export default function MyMeals() {
  const [meals, setMeals] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [editingId, setEditingId] = useState<string | null>(null)
  const [editForm, setEditForm] = useState({
    food_name: '',
    calories: '',
    protein: '',
    fat: '',
    carbs: '',
  })
  const [saving, setSaving] = useState(false)
  const [saved, setSaved] = useState(false)
  const router = useRouter()

  useEffect(() => {
    loadMeals()
  }, [])

  const loadMeals = async () => {
    setLoading(true)
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return
    const { data } = await supabase
      .from('my_meals')
      .select('*')
      .eq('user_id', user.id)
      .order('created_at', { ascending: false })
    if (data) setMeals(data)
    setLoading(false)
  }

  const startEdit = (meal: any) => {
    setEditingId(meal.id)
    setEditForm({
      food_name: meal.food_name,
      calories: String(meal.calories ?? ''),
      protein: String(meal.protein ?? ''),
      fat: String(meal.fat ?? ''),
      carbs: String(meal.carbs ?? ''),
    })
    setSaved(false)
  }

  const cancelEdit = () => {
    setEditingId(null)
    setSaved(false)
  }

  const saveEdit = async () => {
    if (!editForm.food_name) { alert('料理名を入力してください'); return }
    setSaving(true)
    const { error } = await supabase
      .from('my_meals')
      .update({
        food_name: editForm.food_name,
        calories: editForm.calories ? parseInt(editForm.calories) : null,
        protein: editForm.protein ? parseFloat(editForm.protein) : null,
        fat: editForm.fat ? parseFloat(editForm.fat) : null,
        carbs: editForm.carbs ? parseFloat(editForm.carbs) : null,
      })
      .eq('id', editingId)
    if (error) {
      alert('保存に失敗しました')
    } else {
      setSaved(true)
      setEditingId(null)
      loadMeals()
      setTimeout(() => setSaved(false), 3000)
    }
    setSaving(false)
  }

  const deleteMeal = async (id: string) => {
    if (!confirm('このマイミールを削除しますか？')) return
    await supabase.from('my_meals').delete().eq('id', id)
    loadMeals()
  }

  return (
    <div className="min-h-screen bg-[#F8F4ED] pb-24">
      <div className="max-w-md mx-auto px-4 pt-8">

        {/* ヘッダー */}
        <div className="flex items-center gap-3 mb-6">
          <button onClick={() => router.back()}
            className="p-2 rounded-xl hover:bg-[#EFE8DA] transition-colors">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#5C574F" strokeWidth="2" strokeLinecap="round">
              <polyline points="15 18 9 12 15 6"/>
            </svg>
          </button>
          <div>
            <p className="text-xs font-semibold tracking-widest text-[#7A9471] uppercase mb-0.5">My Meals</p>
            <h1 className="text-2xl font-bold text-[#2C2A26]">マイミール管理</h1>
          </div>
        </div>

        {/* 件数 */}
        {!loading && (
          <p className="text-sm text-[#8A8377] mb-4">⭐ {meals.length}件登録されています</p>
        )}

        {/* ローディング */}
        {loading && (
          <div className="text-center py-12 text-[#8A8377] text-sm">読み込み中...</div>
        )}

        {/* マイミール一覧 */}
        {!loading && meals.length === 0 && (
          <div className="bg-white rounded-2xl p-8 border border-[#DDD6C8] text-center">
            <p className="text-[#8A8377] text-sm mb-2">まだマイミールがありません</p>
            <p className="text-xs text-[#8A8377]">記録画面から「マイミール保存」で追加できます</p>
          </div>
        )}

        <div className="flex flex-col gap-3">
          {meals.map((meal) => (
            <div key={meal.id} className="bg-white rounded-2xl border border-[#DDD6C8] overflow-hidden">

              {/* 編集モード */}
              {editingId === meal.id ? (
                <div className="p-5">
                  <p className="text-xs font-semibold text-[#7A9471] mb-3">編集中</p>
                  <div className="flex flex-col gap-3">
                    <div>
                      <label className="block text-xs text-[#5C574F] mb-1">料理名</label>
                      <input
                        type="text"
                        value={editForm.food_name}
                        onChange={(e) => setEditForm({ ...editForm, food_name: e.target.value })}
                        className="w-full px-3 py-2 rounded-xl border border-[#DDD6C8] bg-[#F8F4ED] text-sm text-[#2C2A26] focus:outline-none focus:border-[#7A9471]"
                      />
                    </div>
                    <div className="grid grid-cols-2 gap-2">
                      <div>
                        <label className="block text-xs text-[#5C574F] mb-1">カロリー (kcal)</label>
                        <input
                          type="number"
                          value={editForm.calories}
                          onChange={(e) => setEditForm({ ...editForm, calories: e.target.value })}
                          className="w-full px-3 py-2 rounded-xl border border-[#DDD6C8] bg-[#F8F4ED] text-sm text-[#2C2A26] focus:outline-none focus:border-[#7A9471]"
                        />
                      </div>
                      <div>
                        <label className="block text-xs text-[#5C574F] mb-1">タンパク質 (g)</label>
                        <input
                          type="number"
                          value={editForm.protein}
                          onChange={(e) => setEditForm({ ...editForm, protein: e.target.value })}
                          className="w-full px-3 py-2 rounded-xl border border-[#DDD6C8] bg-[#F8F4ED] text-sm text-[#2C2A26] focus:outline-none focus:border-[#7A9471]"
                        />
                      </div>
                      <div>
                        <label className="block text-xs text-[#5C574F] mb-1">脂質 (g)</label>
                        <input
                          type="number"
                          value={editForm.fat}
                          onChange={(e) => setEditForm({ ...editForm, fat: e.target.value })}
                          className="w-full px-3 py-2 rounded-xl border border-[#DDD6C8] bg-[#F8F4ED] text-sm text-[#2C2A26] focus:outline-none focus:border-[#7A9471]"
                        />
                      </div>
                      <div>
                        <label className="block text-xs text-[#5C574F] mb-1">炭水化物 (g)</label>
                        <input
                          type="number"
                          value={editForm.carbs}
                          onChange={(e) => setEditForm({ ...editForm, carbs: e.target.value })}
                          className="w-full px-3 py-2 rounded-xl border border-[#DDD6C8] bg-[#F8F4ED] text-sm text-[#2C2A26] focus:outline-none focus:border-[#7A9471]"
                        />
                      </div>
                    </div>
                    <div className="flex gap-2 mt-1">
                      <button onClick={cancelEdit}
                        className="flex-1 py-2 rounded-xl border border-[#DDD6C8] text-sm text-[#8A8377] hover:bg-[#F8F4ED] transition-colors">
                        キャンセル
                      </button>
                      <button onClick={saveEdit} disabled={saving}
                        className="flex-1 py-2 rounded-xl bg-[#7A9471] text-white text-sm font-medium hover:bg-[#6A8462] transition-colors disabled:opacity-50">
                        {saving ? '保存中...' : '保存する'}
                      </button>
                    </div>
                  </div>
                </div>
              ) : (
                /* 通常表示モード */
                <div className="flex items-center justify-between p-4">
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-semibold text-[#2C2A26] truncate">{meal.food_name}</p>
                    <p className="text-xs text-[#8A8377] mt-0.5">
                      {meal.calories ?? '-'}kcal · P{meal.protein ?? '-'}g · F{meal.fat ?? '-'}g · C{meal.carbs ?? '-'}g
                    </p>
                  </div>
                  <div className="flex gap-2 ml-3 shrink-0">
                    <button onClick={() => startEdit(meal)}
                      className="px-3 py-1.5 rounded-lg text-xs text-[#7A9471] border border-[#7A9471] hover:bg-[#E4ECDF] transition-colors">
                      編集
                    </button>
                    <button onClick={() => deleteMeal(meal.id)}
                      className="px-3 py-1.5 rounded-lg text-xs text-[#E8835A] border border-[#E8835A] hover:bg-[#FCEEE5] transition-colors">
                      削除
                    </button>
                  </div>
                </div>
              )}
            </div>
          ))}
        </div>

        {/* 保存完了メッセージ */}
        {saved && (
          <div className="fixed bottom-28 left-1/2 -translate-x-1/2 bg-[#7A9471] text-white text-sm px-5 py-2.5 rounded-full shadow-lg">
            ✓ 保存しました！
          </div>
        )}

      </div>
    </div>
  )
}