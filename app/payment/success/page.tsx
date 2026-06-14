'use client'
import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { supabase } from '../../../lib/supabase'

export default function PaymentSuccess() {
  const router = useRouter()
  const [checking, setChecking] = useState(true)
  const [activated, setActivated] = useState(false)

  useEffect(() => {
    let attempts = 0
    const maxAttempts = 10

    const poll = async () => {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) { router.push('/login'); return }

      const { data } = await supabase
        .from('user_goals')
        .select('is_premium')
        .eq('user_id', user.id)
        .single()

      if (data?.is_premium) {
        setActivated(true)
        setChecking(false)
        return
      }

      attempts++
      if (attempts < maxAttempts) {
        setTimeout(poll, 2000)
      } else {
        setChecking(false)
      }
    }

    poll()
  }, [router])

  return (
    <div className="min-h-screen bg-[#F8F4ED] flex items-center justify-center px-4">
      <div className="max-w-sm w-full text-center">

        {checking && !activated && (
          <>
            <div className="w-16 h-16 rounded-full bg-[#E4ECDF] flex items-center justify-center mx-auto mb-4">
              <div className="w-8 h-8 border-2 border-[#7A9471] border-t-transparent rounded-full animate-spin" />
            </div>
            <p className="text-sm font-semibold text-[#2C2A26] mb-1">プレミアムを有効化中...</p>
            <p className="text-xs text-[#8A8377]">少々お待ちください</p>
          </>
        )}

        {activated && (
          <>
            <div className="w-20 h-20 rounded-full bg-[#E4ECDF] flex items-center justify-center mx-auto mb-5">
              <span className="text-4xl">🌟</span>
            </div>
            <h1 className="text-xl font-bold text-[#2C2A26] mb-2">プレミアム有効化完了！</h1>
            <p className="text-sm text-[#5C574F] mb-1">ありがとうございます。</p>
            <p className="text-sm text-[#5C574F] mb-6">AI献立提案・週次レポートが使い放題になりました。</p>
            <button
              onClick={() => router.push('/')}
              className="w-full py-3 bg-[#7A9471] text-white rounded-xl font-medium hover:bg-[#6A8462] transition-colors">
              ホームへ戻る
            </button>
          </>
        )}

        {!checking && !activated && (
          <>
            <div className="w-20 h-20 rounded-full bg-[#E4ECDF] flex items-center justify-center mx-auto mb-5">
              <span className="text-4xl">✅</span>
            </div>
            <h1 className="text-xl font-bold text-[#2C2A26] mb-2">お支払いありがとうございます</h1>
            <p className="text-sm text-[#5C574F] mb-2">プレミアムの有効化に少し時間がかかっています。</p>
            <p className="text-sm text-[#5C574F] mb-6">数分後にホームをリロードしてお試しください。</p>
            <button
              onClick={() => router.push('/')}
              className="w-full py-3 bg-[#7A9471] text-white rounded-xl font-medium hover:bg-[#6A8462] transition-colors">
              ホームへ戻る
            </button>
          </>
        )}

      </div>
    </div>
  )
}
