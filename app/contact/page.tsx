'use client'
import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { supabase } from '../../lib/supabase'

const CATEGORIES = ['機能のご要望', 'バグ・不具合のご報告', 'ご質問', 'その他']

export default function ContactPage() {
  const router = useRouter()
  const [category, setCategory] = useState(CATEGORIES[0])
  const [message, setMessage] = useState('')
  const [userEmail, setUserEmail] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const [submitted, setSubmitted] = useState(false)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    supabase.auth.getUser().then(({ data: { user } }) => {
      if (!user) { router.push('/login'); return }
      setUserEmail(user.email || '')
    })
  }, [])

  const submit = async () => {
    if (!message.trim()) { setError('メッセージを入力してください'); return }
    setSubmitting(true)
    setError(null)
    const { data: { session } } = await supabase.auth.getSession()
    if (!session) { router.push('/login'); return }
    const res = await fetch('/api/contact', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ accessToken: session.access_token, category, message }),
    })
    if (res.ok) {
      setSubmitted(true)
    } else {
      setError('送信に失敗しました。しばらくしてから再度お試しください。')
    }
    setSubmitting(false)
  }

  if (submitted) {
    return (
      <div className="min-h-screen bg-[#F8F4ED] flex flex-col items-center justify-center px-4">
        <div className="bg-white rounded-2xl p-8 border border-[#DDD6C8] max-w-md w-full text-center">
          <div className="text-4xl mb-3">✅</div>
          <h2 className="text-lg font-bold text-[#2C2A26] mb-2">送信が完了しました</h2>
          <p className="text-sm text-[#5C574F] mb-1">お問い合わせありがとうございます。</p>
          <p className="text-sm text-[#5C574F] mb-6">
            返信は <span className="font-semibold">{userEmail}</span> 宛にお送りします。<br />
            「お問い合わせ履歴」でもご確認いただけます。
          </p>
          <div className="flex flex-col gap-2">
            <button onClick={() => router.push('/contact/history')}
              className="w-full py-3 bg-[#7A9471] text-white rounded-xl text-sm font-medium hover:bg-[#6A8462] transition-colors">
              お問い合わせ履歴を見る
            </button>
            <button onClick={() => router.push('/')}
              className="w-full py-3 bg-white border border-[#DDD6C8] text-[#5C574F] rounded-xl text-sm font-medium hover:border-[#7A9471] transition-colors">
              ホームへ戻る
            </button>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-[#F8F4ED] pb-24">
      <div className="max-w-md mx-auto px-4 pt-8">
        <div className="mb-6">
          <button onClick={() => router.back()} className="text-sm text-[#7A9471] hover:underline mb-3 block">← 戻る</button>
          <p className="text-xs font-semibold tracking-widest text-[#7A9471] uppercase mb-1">Contact</p>
          <h1 className="text-2xl font-bold text-[#2C2A26]">お問い合わせ</h1>
          <p className="text-sm text-[#8A8377] mt-1">ご意見・ご要望・バグ報告などお気軽にどうぞ</p>
        </div>

        <div className="bg-white rounded-2xl p-5 border border-[#DDD6C8] mb-4">
          {userEmail && (
            <div className="mb-4 px-3 py-2.5 bg-[#F8F4ED] rounded-xl border border-[#DDD6C8]">
              <p className="text-xs text-[#8A8377]">返信先メールアドレス（自動取得）</p>
              <p className="text-sm font-medium text-[#2C2A26]">{userEmail}</p>
            </div>
          )}

          <div className="mb-4">
            <label className="block text-sm text-[#5C574F] mb-1.5">カテゴリ</label>
            <div className="grid grid-cols-2 gap-2">
              {CATEGORIES.map((c) => (
                <button key={c} onClick={() => setCategory(c)}
                  className={`py-2.5 px-3 rounded-xl text-xs font-medium border transition-all text-left ${
                    category === c
                      ? 'bg-[#7A9471] text-white border-[#7A9471]'
                      : 'bg-[#F8F4ED] text-[#5C574F] border-[#DDD6C8] hover:border-[#7A9471]'
                  }`}>
                  {c}
                </button>
              ))}
            </div>
          </div>

          <div className="mb-4">
            <label className="block text-sm text-[#5C574F] mb-1.5">
              メッセージ <span className="text-[#E8835A]">*</span>
            </label>
            <textarea
              value={message}
              onChange={(e) => { setMessage(e.target.value); setError(null) }}
              placeholder="お気軽にお書きください..."
              rows={6}
              className="w-full px-4 py-3 rounded-xl border border-[#DDD6C8] bg-[#F8F4ED] text-[#2C2A26] text-sm focus:outline-none focus:border-[#7A9471] resize-none"
            />
            <div className="text-right text-xs text-[#8A8377] mt-1">{message.length} 文字</div>
          </div>

          {error && (
            <div className="mb-3 px-3 py-2 bg-[#FCEEE5] rounded-xl border border-[#F5B89D]">
              <p className="text-xs text-[#E8835A]">{error}</p>
            </div>
          )}

          <button onClick={submit} disabled={submitting || !message.trim()}
            className="w-full py-3 bg-[#7A9471] text-white rounded-xl font-medium hover:bg-[#6A8462] transition-colors disabled:opacity-50 text-sm">
            {submitting ? '送信中...' : '送信する'}
          </button>
        </div>

        <div className="text-center">
          <button onClick={() => router.push('/contact/history')}
            className="text-sm text-[#7A9471] hover:underline">
            過去のお問い合わせを確認する →
          </button>
        </div>
      </div>
    </div>
  )
}
