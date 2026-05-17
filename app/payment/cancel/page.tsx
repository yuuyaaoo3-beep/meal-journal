'use client'
import Link from 'next/link'

export default function PaymentCancel() {
  return (
    <div className="min-h-screen bg-[#F8F4ED] flex items-center justify-center px-4">
      <div className="max-w-sm w-full text-center">
        <div className="w-20 h-20 bg-[#FCEEE5] rounded-full flex items-center justify-center mx-auto mb-6">
          <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="#E8835A" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
            <line x1="18" y1="6" x2="6" y2="18"/>
            <line x1="6" y1="6" x2="18" y2="18"/>
          </svg>
        </div>
        <h1 className="text-2xl font-bold text-[#2C2A26] mb-3">決済がキャンセルされました</h1>
        <p className="text-sm text-[#5C574F] mb-8 leading-relaxed">
          決済が完了しませんでした。<br />
          もう一度お試しいただくか、無料プランのままご利用ください。
        </p>
        <Link href="/"
          className="block w-full py-4 bg-[#7A9471] text-white rounded-2xl font-semibold hover:bg-[#6A8462] transition-colors">
          ホームへ戻る
        </Link>
      </div>
    </div>
  )
}