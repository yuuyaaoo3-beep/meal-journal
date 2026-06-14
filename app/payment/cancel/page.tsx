'use client'
import { useRouter } from 'next/navigation'

export default function PaymentCancel() {
  const router = useRouter()

  return (
    <div className="min-h-screen bg-[#F8F4ED] flex items-center justify-center px-4">
      <div className="max-w-sm w-full text-center">
        <div className="w-20 h-20 rounded-full bg-[#FCEEE5] flex items-center justify-center mx-auto mb-5">
          <span className="text-4xl">💭</span>
        </div>
        <h1 className="text-xl font-bold text-[#2C2A26] mb-2">お支払いはキャンセルされました</h1>
        <p className="text-sm text-[#5C574F] mb-1">いつでもプレミアムにアップグレードできます。</p>
        <p className="text-sm text-[#5C574F] mb-8">気が向いたときにぜひどうぞ。</p>
        <button
          onClick={() => router.push('/')}
          className="w-full py-3 bg-[#7A9471] text-white rounded-xl font-medium hover:bg-[#6A8462] transition-colors mb-3">
          ホームへ戻る
        </button>
        <button
          onClick={async () => {
            const { createClient } = await import('@supabase/supabase-js')
            const sb = createClient(
              process.env.NEXT_PUBLIC_SUPABASE_URL!,
              process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
            )
            const { data: { user } } = await sb.auth.getUser()
            if (!user) return
            const res = await fetch('/api/create-checkout-session', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({ userId: user.id, email: user.email }),
            })
            const { url } = await res.json()
            if (url) window.location.href = url
          }}
          className="w-full py-3 bg-[#F8F4ED] text-[#E8835A] rounded-xl font-medium border border-[#E8835A] hover:bg-[#FCEEE5] transition-colors text-sm">
          やっぱりアップグレードする
        </button>
      </div>
    </div>
  )
}
