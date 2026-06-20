'use client'
import { useState, useEffect, useRef } from 'react'
import { supabase } from '../../../lib/supabase'
import { useRouter, useParams } from 'next/navigation'

const MEAL_ICONS: Record<string, string> = {
  breakfast: '🌅', lunch: '☀️', dinner: '🌙', snack: '🍪',
}
const MEAL_LABELS: Record<string, string> = {
  breakfast: '朝食', lunch: '昼食', dinner: '夕食', snack: '間食',
}

type Message = { role: 'user' | 'assistant'; content: string }

export default function FeedbackPage() {
  const params = useParams()
  const router = useRouter()
  const id = params?.id as string

  const [meal, setMeal] = useState<any>(null)
  const [goal, setGoal] = useState<any>(null)
  const [todayTotal, setTodayTotal] = useState({ calories: 0, protein: 0, fat: 0, carbs: 0 })
  const [loading, setLoading] = useState(true)
  const [score, setScore] = useState<number | null>(null)
  const [feedbackText, setFeedbackText] = useState('')
  const [feedbackStatus, setFeedbackStatus] = useState<'idle' | 'loading' | 'streaming' | 'done'>('idle')
  const [conversation, setConversation] = useState<Message[]>([])
  const [inputText, setInputText] = useState('')
  const [chatStreaming, setChatStreaming] = useState(false)
  const bottomRef = useRef<HTMLDivElement>(null)

  useEffect(() => { loadData() }, [])

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [feedbackText, conversation])

  const loadData = async () => {
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) { router.push('/login'); return }

    const today = new Date().toISOString().split('T')[0]
    const [mealRes, goalRes, totalRes] = await Promise.all([
      supabase.from('meal_records').select('*').eq('id', id).single(),
      supabase.from('user_goals').select('*').eq('user_id', user.id).single(),
      supabase.from('meal_records').select('calories,protein,fat,carbs').eq('user_id', user.id).eq('recorded_at', today),
    ])

    if (!mealRes.data || !goalRes.data) { router.push('/record'); return }
    if (!goalRes.data.is_premium) { router.push('/'); return }

    const total = (totalRes.data || []).reduce((acc: any, r: any) => ({
      calories: acc.calories + (r.calories || 0),
      protein: acc.protein + (r.protein || 0),
      fat: acc.fat + (r.fat || 0),
      carbs: acc.carbs + (r.carbs || 0),
    }), { calories: 0, protein: 0, fat: 0, carbs: 0 })

    setMeal(mealRes.data)
    setGoal(goalRes.data)
    setTodayTotal(total)
    setLoading(false)

    await fetchInitialFeedback(mealRes.data, goalRes.data, total)
  }

  const fetchInitialFeedback = async (mealData: any, goalData: any, totalData: any) => {
    setFeedbackStatus('loading')
    const { data: { session } } = await supabase.auth.getSession()
    if (!session) return

    try {
      const res = await fetch('/api/meal-feedback', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          accessToken: session.access_token,
          meal: mealData,
          goal: { target_cal: goalData.target_cal, protein: goalData.protein, fat: goalData.fat, carbs: goalData.carbs },
          todayTotal: totalData,
          messages: [],
        }),
      })

      if (!res.ok) { setFeedbackStatus('done'); return }

      setFeedbackStatus('streaming')
      const reader = res.body!.getReader()
      const decoder = new TextDecoder()
      let buffer = ''
      let scoreExtracted = false
      let feedback = ''

      while (true) {
        const { done, value } = await reader.read()
        if (done) break
        const chunk = decoder.decode(value, { stream: true })

        if (!scoreExtracted) {
          buffer += chunk
          const nlIdx = buffer.indexOf('\n')
          if (nlIdx !== -1) {
            const firstLine = buffer.slice(0, nlIdx)
            const m = firstLine.match(/^SCORE:(\d+)/)
            if (m) setScore(parseInt(m[1]))
            feedback = buffer.slice(nlIdx + 1)
            scoreExtracted = true
          }
        } else {
          feedback += chunk
        }
        setFeedbackText(feedback)
      }

      setConversation([{ role: 'assistant', content: feedback }])
      setFeedbackStatus('done')
    } catch {
      setFeedbackStatus('done')
    }
  }

  const sendMessage = async () => {
    if (!inputText.trim() || chatStreaming) return
    const userMsg = inputText.trim()
    setInputText('')

    const updatedConversation: Message[] = [...conversation, { role: 'user', content: userMsg }]
    setConversation(updatedConversation)
    setChatStreaming(true)

    const { data: { session } } = await supabase.auth.getSession()
    if (!session) { setChatStreaming(false); return }

    try {
      const res = await fetch('/api/meal-feedback', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          accessToken: session.access_token,
          meal,
          goal: { target_cal: goal.target_cal, protein: goal.protein, fat: goal.fat, carbs: goal.carbs },
          todayTotal,
          messages: updatedConversation,
        }),
      })

      if (!res.ok) { setChatStreaming(false); return }

      const reader = res.body!.getReader()
      const decoder = new TextDecoder()
      let assistantText = ''

      setConversation(prev => [...prev, { role: 'assistant', content: '' }])

      while (true) {
        const { done, value } = await reader.read()
        if (done) break
        assistantText += decoder.decode(value, { stream: true })
        setConversation(prev => [...prev.slice(0, -1), { role: 'assistant', content: assistantText }])
      }
    } finally {
      setChatStreaming(false)
    }
  }

  const scoreColor = score === null ? '#8A8377'
    : score >= 80 ? '#7A9471'
    : score >= 60 ? '#D4A340'
    : '#E8835A'

  const scoreLabel = score === null ? '採点中...'
    : score >= 80 ? '素晴らしい！'
    : score >= 60 ? 'まあまあです'
    : 'もう少し頑張りましょう'

  const circumference = 2 * Math.PI * 42

  if (loading) return (
    <div className="min-h-screen bg-[#F8F4ED] flex items-center justify-center">
      <div className="text-[#8A8377]">読み込み中...</div>
    </div>
  )

  return (
    <div className="min-h-screen bg-[#F8F4ED] pb-36">
      <div className="max-w-md mx-auto px-4 pt-8">

        {/* ヘッダー */}
        <div className="flex items-center gap-3 mb-6">
          <button onClick={() => router.back()}
            className="w-9 h-9 rounded-full bg-white border border-[#DDD6C8] flex items-center justify-center hover:border-[#7A9471] transition-colors flex-shrink-0">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#5C574F" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <polyline points="15 18 9 12 15 6"/>
            </svg>
          </button>
          <div>
            <p className="text-xs font-semibold tracking-widest text-[#7A9471] uppercase">AI Feedback</p>
            <h1 className="text-xl font-bold text-[#2C2A26]">食事AI評価</h1>
          </div>
        </div>

        {/* 食事情報カード */}
        <div className="bg-white rounded-2xl p-4 border border-[#DDD6C8] mb-4">
          <div className="flex items-center gap-3">
            <div className="w-11 h-11 rounded-full bg-[#F8F4ED] flex items-center justify-center text-xl flex-shrink-0">
              {MEAL_ICONS[meal.meal_type] || '🍽'}
            </div>
            <div className="flex-1 min-w-0">
              <div className="text-xs text-[#8A8377]">{MEAL_LABELS[meal.meal_type] || meal.meal_type} · {meal.recorded_at}</div>
              <div className="text-base font-semibold text-[#2C2A26] truncate">{meal.food_name}</div>
              <div className="text-xs text-[#8A8377] mt-0.5">
                {meal.calories}kcal · P{meal.protein}g · F{meal.fat}g · C{meal.carbs}g
              </div>
            </div>
          </div>
        </div>

        {/* スコアカード */}
        <div className="bg-white rounded-2xl p-5 border border-[#DDD6C8] mb-4 flex flex-col items-center">
          {feedbackStatus === 'loading' ? (
            <div className="py-4 text-center">
              <div className="w-24 h-24 rounded-full border-4 border-[#EFE8DA] animate-pulse mx-auto mb-3" />
              <p className="text-sm text-[#8A8377]">AIが採点中...</p>
            </div>
          ) : (
            <>
              <svg width="120" height="120" viewBox="0 0 100 100" className="mb-2">
                <circle cx="50" cy="50" r="42" fill="none" stroke="#EFE8DA" strokeWidth="8"/>
                <circle cx="50" cy="50" r="42" fill="none"
                  stroke={scoreColor} strokeWidth="8"
                  strokeLinecap="round"
                  strokeDasharray={circumference}
                  strokeDashoffset={circumference - ((score ?? 0) / 100) * circumference}
                  transform="rotate(-90 50 50)"
                  style={{ transition: 'stroke-dashoffset 1.2s ease' }}
                />
                <text x="50" y="46" textAnchor="middle" fontSize="26" fontWeight="700" fill="#2C2A26" fontFamily="system-ui">
                  {score ?? '--'}
                </text>
                <text x="50" y="63" textAnchor="middle" fontSize="11" fill="#8A8377" fontFamily="system-ui">/100</text>
              </svg>
              <p className="text-sm font-semibold" style={{ color: scoreColor }}>{scoreLabel}</p>
            </>
          )}
        </div>

        {/* フィードバック + チャット */}
        <div className="bg-white rounded-2xl p-5 border border-[#DDD6C8] mb-4">
          <p className="text-xs font-semibold text-[#8A8377] mb-3">🤖 AIからのフィードバック</p>

          {/* 初回フィードバックテキスト */}
          {feedbackText && (
            <div className="text-sm text-[#2C2A26] leading-relaxed whitespace-pre-wrap mb-2">
              {feedbackText}
              {feedbackStatus === 'streaming' && (
                <span className="inline-block w-1 h-3 bg-[#7A9471] animate-pulse ml-0.5 align-middle" />
              )}
            </div>
          )}

          {/* チャット（index 1以降） */}
          {conversation.length > 1 && (
            <div className="flex flex-col gap-3 pt-4 border-t border-[#EFE8DA] mt-4">
              {conversation.slice(1).map((msg, i) => {
                const isStreamingThis = chatStreaming && msg.role === 'assistant' && i === conversation.slice(1).length - 1
                return (
                  <div key={i} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                    <div className={`max-w-[85%] px-4 py-2.5 rounded-2xl text-sm leading-relaxed whitespace-pre-wrap ${
                      msg.role === 'user'
                        ? 'bg-[#7A9471] text-white rounded-br-sm'
                        : 'bg-[#F8F4ED] text-[#2C2A26] border border-[#DDD6C8] rounded-bl-sm'
                    }`}>
                      {msg.content || (isStreamingThis ? (
                        <span className="inline-block w-1 h-3 bg-[#7A9471] animate-pulse align-middle" />
                      ) : '...')}
                      {isStreamingThis && msg.content && (
                        <span className="inline-block w-1 h-3 bg-[#7A9471] animate-pulse ml-0.5 align-middle" />
                      )}
                    </div>
                  </div>
                )
              })}
            </div>
          )}

          <div ref={bottomRef} />
        </div>
      </div>

      {/* 入力エリア（固定） */}
      {feedbackStatus === 'done' && (
        <div className="fixed bottom-16 left-0 right-0 bg-[#F8F4ED] border-t border-[#DDD6C8] px-4 py-3">
          <div className="max-w-md mx-auto flex gap-2">
            <input
              type="text"
              value={inputText}
              onChange={(e) => setInputText(e.target.value)}
              onKeyDown={(e) => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); sendMessage() } }}
              placeholder="気になることを質問してみましょう..."
              className="flex-1 min-w-0 px-4 py-2.5 rounded-xl border border-[#DDD6C8] bg-white text-sm focus:outline-none focus:border-[#7A9471]"
            />
            <button
              onClick={sendMessage}
              disabled={!inputText.trim() || chatStreaming}
              className="px-4 py-2.5 bg-[#7A9471] text-white rounded-xl text-sm font-medium hover:bg-[#6A8462] transition-colors disabled:opacity-50 flex-shrink-0">
              送信
            </button>
          </div>
        </div>
      )}
    </div>
  )
}
