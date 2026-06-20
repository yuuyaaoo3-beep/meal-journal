'use client'
import { useState } from 'react'
import { supabase } from '../../lib/supabase'

type View = 'welcome' | 'login' | 'signup'

export default function Login() {
  const [view, setView] = useState<View>('welcome')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const [message, setMessage] = useState('')

  const reset = (next: View) => {
    setEmail('')
    setPassword('')
    setMessage('')
    setView(next)
  }

  const handleAuth = async () => {
    setLoading(true)
    setMessage('')
    if (view === 'signup') {
      const { error } = await supabase.auth.signUp({ email, password })
      if (error) setMessage(error.message)
      else setMessage('確認メールを送信しました。メールをご確認ください。')
    } else {
      const { error } = await supabase.auth.signInWithPassword({ email, password })
      if (error) {
        setMessage('メールアドレスまたはパスワードが違います')
      } else {
        const { data: { user } } = await supabase.auth.getUser()
        if (user) {
          const { data } = await supabase.from('user_goals').select('id').eq('user_id', user.id).single()
          window.location.href = data ? '/' : '/onboarding'
        }
      }
    }
    setLoading(false)
  }

  const Legal = () => (
    <div className="mt-6 text-center text-xs text-[#8A8377] space-x-4">
      <a href="/terms" className="hover:underline">利用規約</a>
      <a href="/privacy" className="hover:underline">プライバシーポリシー</a>
    </div>
  )

  if (view === 'welcome') {
    return (
      <div className="min-h-screen bg-[#F8F4ED] flex flex-col items-center justify-center px-6">
        <div className="w-full max-w-sm flex flex-col items-center">
          <div className="w-20 h-20 rounded-2xl overflow-hidden mb-6 shadow-sm">
            <img src="/icons/icon-512.png" alt="Meal Journal" className="w-full h-full object-cover" />
          </div>
          <h1 className="text-3xl font-bold text-[#7A9471] mb-2">Meal Journal</h1>
          <p className="text-[#8A8377] text-sm mb-10">あなたの食事を、やさしく管理する</p>

          <div className="w-full flex flex-col gap-3">
            <button
              onClick={() => reset('signup')}
              className="w-full py-4 bg-[#E8835A] text-white rounded-2xl font-semibold text-base hover:bg-[#D4724A] transition-colors shadow-sm">
              無料アカウントを作成
            </button>
            <button
              onClick={() => reset('login')}
              className="w-full py-4 bg-white text-[#7A9471] rounded-2xl font-semibold text-base border border-[#DDD6C8] hover:border-[#7A9471] transition-colors">
              ログイン
            </button>
          </div>

          <Legal />
        </div>
      </div>
    )
  }

  const isSignup = view === 'signup'
  const accent = isSignup ? '#E8835A' : '#7A9471'
  const accentHover = isSignup ? '#D4724A' : '#6A8462'
  const accentBg = isSignup ? '#FCEEE5' : '#E4ECDF'
  const accentBorder = isSignup ? '#F5B89D' : '#C5D9BF'

  return (
    <div className="min-h-screen bg-[#F8F4ED] flex flex-col items-center justify-center px-4">
      <div className="w-full max-w-sm">
        <div className="text-center mb-6">
          <h1 className="text-2xl font-bold mb-1" style={{ color: accent }}>
            {isSignup ? 'アカウント作成' : 'ログイン'}
          </h1>
          <p className="text-[#8A8377] text-sm">
            {isSignup ? '無料ではじめましょう' : 'おかえりなさい'}
          </p>
        </div>

        <div className="bg-white rounded-2xl p-6 border shadow-sm" style={{ borderColor: accentBorder }}>
          <div className="mb-4">
            <label className="block text-sm text-[#5C574F] mb-1">メールアドレス</label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full px-4 py-3 rounded-xl border text-[#2C2A26] focus:outline-none transition-colors"
              style={{ background: accentBg, borderColor: accentBorder }}
              placeholder="example@email.com"
            />
          </div>
          <div className="mb-6">
            <label className="block text-sm text-[#5C574F] mb-1">パスワード</label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full px-4 py-3 rounded-xl border text-[#2C2A26] focus:outline-none transition-colors"
              style={{ background: accentBg, borderColor: accentBorder }}
              placeholder="6文字以上"
            />
          </div>

          {message && (
            <p className="text-sm mb-4 text-center" style={{ color: accent }}>{message}</p>
          )}

          <button
            onClick={handleAuth}
            disabled={loading}
            className="w-full py-3 text-white rounded-xl font-medium transition-colors disabled:opacity-50"
            style={{ background: accent }}>
            {loading ? '処理中...' : isSignup ? 'アカウントを作成' : 'ログイン'}
          </button>

          <div className="mt-4 pt-4 border-t border-[#EFE8DA] text-center">
            {isSignup ? (
              <button onClick={() => reset('login')} className="text-sm text-[#7A9471] hover:underline">
                すでにアカウントをお持ちの方
              </button>
            ) : (
              <button onClick={() => reset('signup')} className="text-sm text-[#E8835A] hover:underline">
                アカウントをお持ちでない方
              </button>
            )}
          </div>
        </div>

        {isSignup && (
          <p className="text-xs text-[#8A8377] text-center mt-4">
            アカウントを作成することで、
            <a href="/terms" className="underline hover:text-[#7A9471]">利用規約</a>
            および
            <a href="/privacy" className="underline hover:text-[#7A9471]">プライバシーポリシー</a>
            に同意したものとみなされます。
          </p>
        )}

        <button onClick={() => reset('welcome')} className="w-full mt-4 text-sm text-[#8A8377] hover:underline">
          ← 戻る
        </button>

        <Legal />
      </div>
    </div>
  )
}
