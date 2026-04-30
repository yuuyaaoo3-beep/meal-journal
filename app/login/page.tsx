'use client'
import { useState } from 'react'
import { supabase } from '../../lib/supabase'

export default function Login() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const [message, setMessage] = useState('')
  const [isSignUp, setIsSignUp] = useState(false)

  const handleAuth = async () => {
    setLoading(true)
    setMessage('')
    if (isSignUp) {
      const { error } = await supabase.auth.signUp({ email, password })
      if (error) setMessage(error.message)
      else setMessage('確認メールを送信しました。メールをご確認ください。')
    } else {
      const { error } = await supabase.auth.signInWithPassword({ email, password })
      if (error) setMessage('メールアドレスまたはパスワードが違います')
      else window.location.href = '/'
    }
    setLoading(false)
  }

  return (
    <div className="min-h-screen bg-[#F8F4ED] flex items-center justify-center px-4">
      <div className="w-full max-w-sm">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-[#7A9471] mb-2">Meal Journal</h1>
          <p className="text-[#8A8377] text-sm">あなたの食事を、やさしく管理する</p>
        </div>
        <div className="bg-white rounded-2xl p-6 shadow-sm border border-[#DDD6C8]">
          <h2 className="text-lg font-semibold text-[#2C2A26] mb-6 text-center">
            {isSignUp ? 'アカウント作成' : 'ログイン'}
          </h2>
          <div className="mb-4">
            <label className="block text-sm text-[#5C574F] mb-1">メールアドレス</label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full px-4 py-3 rounded-xl border border-[#DDD6C8] bg-[#F8F4ED] text-[#2C2A26] focus:outline-none focus:border-[#7A9471]"
              placeholder="example@email.com"
            />
          </div>
          <div className="mb-6">
            <label className="block text-sm text-[#5C574F] mb-1">パスワード</label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full px-4 py-3 rounded-xl border border-[#DDD6C8] bg-[#F8F4ED] text-[#2C2A26] focus:outline-none focus:border-[#7A9471]"
              placeholder="6文字以上"
            />
          </div>
          {message && (
            <p className="text-sm text-[#E8835A] mb-4 text-center">{message}</p>
          )}
          <button
            onClick={handleAuth}
            disabled={loading}
            className="w-full py-3 bg-[#7A9471] text-white rounded-xl font-medium hover:bg-[#6A8462] transition-colors disabled:opacity-50"
          >
            {loading ? '処理中...' : isSignUp ? 'アカウントを作成' : 'ログイン'}
          </button>
          <button
            onClick={() => setIsSignUp(!isSignUp)}
            className="w-full mt-3 py-2 text-sm text-[#7A9471] hover:underline"
          >
            {isSignUp ? 'すでにアカウントをお持ちの方' : 'アカウントをお持ちでない方'}
          </button>
        </div>
      </div>
    </div>
  )
}