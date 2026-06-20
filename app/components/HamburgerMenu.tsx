'use client'
import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { supabase } from '../../lib/supabase'

type Props = {
  isPremium: boolean
  onManageSubscription?: () => void
}

export default function HamburgerMenu({ isPremium, onManageSubscription }: Props) {
  const [isOpen, setIsOpen] = useState(false)
  const [pushEnabled, setPushEnabled] = useState(false)
  const [pushLoading, setPushLoading] = useState(false)
  const router = useRouter()

  useEffect(() => {
    if ('Notification' in window) {
      setPushEnabled(Notification.permission === 'granted')
    }
  }, [])

  const handleLogout = async () => {
    await supabase.auth.signOut()
    window.location.href = '/login'
  }

  const handleNavigate = (path: string) => {
    setIsOpen(false)
    router.push(path)
  }

  const handlePushToggle = async () => {
    if (!('serviceWorker' in navigator) || !('PushManager' in window)) return
    setPushLoading(true)
    try {
      const { data: { session } } = await supabase.auth.getSession()
      if (!session) return

      if (pushEnabled) {
        await fetch('/api/push/subscribe', {
          method: 'DELETE',
          headers: { Authorization: `Bearer ${session.access_token}` },
        })
        setPushEnabled(false)
      } else {
        const permission = await Notification.requestPermission()
        if (permission !== 'granted') return

        const reg = await navigator.serviceWorker.ready
        const sub = await reg.pushManager.subscribe({
          userVisibleOnly: true,
          applicationServerKey: process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY,
        })
        await fetch('/api/push/subscribe', {
          method: 'POST',
          headers: {
            Authorization: `Bearer ${session.access_token}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ subscription: sub.toJSON() }),
        })
        setPushEnabled(true)
      }
    } finally {
      setPushLoading(false)
    }
  }

  return (
    <>
      {/* ハンバーガーボタン */}
      <button
        onClick={() => setIsOpen(true)}
        className="flex flex-col gap-1.5 p-2 rounded-lg hover:bg-[#EFE8DA] transition-colors">
        <span className="w-5 h-0.5 bg-[#5C574F] rounded-full"></span>
        <span className="w-5 h-0.5 bg-[#5C574F] rounded-full"></span>
        <span className="w-5 h-0.5 bg-[#5C574F] rounded-full"></span>
      </button>

      {/* オーバーレイ */}
      {isOpen && (
        <div
          className="fixed inset-0 z-40"
          style={{ background: 'rgba(44,42,38,0.3)' }}
          onClick={() => setIsOpen(false)}
        />
      )}

      {/* メニュードロワー */}
      <div className={`fixed top-0 left-0 h-full w-72 bg-[#FFFCF6] z-50 shadow-xl transform transition-transform duration-300 ${
        isOpen ? 'translate-x-0' : '-translate-x-full'
      }`}>

        {/* ヘッダー */}
        <div className="flex items-center justify-between px-6 pt-12 pb-6 border-b border-[#DDD6C8]">
          <div>
            <div className="font-bold text-lg text-[#2C2A26]" style={{ fontFamily: 'serif' }}>Meal Journal</div>
            {isPremium && (
              <span className="text-xs text-[#7A9471] font-medium">🌟 プレミアム</span>
            )}
          </div>
          <button onClick={() => setIsOpen(false)}
            className="text-[#8A8377] hover:text-[#2C2A26] transition-colors">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
              <line x1="18" y1="6" x2="6" y2="18"/>
              <line x1="6" y1="6" x2="18" y2="18"/>
            </svg>
          </button>
        </div>

        {/* メニュー項目 */}
        <div className="px-4 py-4 flex flex-col gap-1 overflow-y-auto" style={{ maxHeight: 'calc(100vh - 200px)' }}>
          <button onClick={() => handleNavigate('/goal')}
            className="flex items-center gap-3 px-4 py-3 rounded-xl hover:bg-[#F8F4ED] transition-colors text-left w-full">
            <span className="text-xl">👤</span>
            <div>
              <div className="text-sm font-medium text-[#2C2A26]">目標設定</div>
              <div className="text-xs text-[#8A8377]">PFC・カロリー目標を確認・変更</div>
            </div>
          </button>

          <button onClick={() => handleNavigate('/learn')}
            className="flex items-center gap-3 px-4 py-3 rounded-xl hover:bg-[#F8F4ED] transition-colors text-left w-full">
            <span className="text-xl">📖</span>
            <div>
              <div className="text-sm font-medium text-[#2C2A26]">解説を読む</div>
              <div className="text-xs text-[#8A8377]">PFC・代謝・停滞期について</div>
            </div>
          </button>

          <button onClick={() => handleNavigate('/my-meals')}
            className="flex items-center gap-3 px-4 py-3 rounded-xl hover:bg-[#F8F4ED] transition-colors text-left w-full">
            <span className="text-xl">⭐</span>
            <div>
              <div className="text-sm font-medium text-[#2C2A26]">マイミール管理</div>
              <div className="text-xs text-[#8A8377]">よく食べる料理を編集・削除</div>
            </div>
          </button>

          <button onClick={() => handleNavigate('/my-dishes')}
            className="flex items-center gap-3 px-4 py-3 rounded-xl hover:bg-[#F8F4ED] transition-colors text-left w-full">
            <span className="text-xl">🍽</span>
            <div>
              <div className="text-sm font-medium text-[#2C2A26]">マイディッシュ管理</div>
              <div className="text-xs text-[#8A8377]">よく食べる組み合わせを登録</div>
            </div>
          </button>

          {isPremium && (
            <button onClick={() => handleNavigate('/report')}
              className="flex items-center gap-3 px-4 py-3 rounded-xl hover:bg-[#E4ECDF] transition-colors text-left w-full bg-[#E4ECDF]">
              <span className="text-xl">📋</span>
              <div>
                <div className="text-sm font-medium text-[#7A9471]">週次レポート</div>
                <div className="text-xs text-[#7A9471] opacity-80">1週間の振り返り・AIアドバイス</div>
              </div>
            </button>
          )}

          {isPremium ? (
            <>
              <div className="flex items-center gap-3 px-4 py-3 rounded-xl bg-[#E4ECDF]">
                <span className="text-xl">🌟</span>
                <div className="flex-1">
                  <div className="text-sm font-medium text-[#7A9471]">プレミアム利用中</div>
                  <div className="text-xs text-[#7A9471] opacity-80">AI機能が使い放題です</div>
                </div>
              </div>
              {onManageSubscription && (
                <button onClick={() => { setIsOpen(false); onManageSubscription() }}
                  className="flex items-center gap-3 px-4 py-3 rounded-xl hover:bg-[#F8F4ED] transition-colors text-left w-full">
                  <span className="text-xl">⚙️</span>
                  <div>
                    <div className="text-sm font-medium text-[#2C2A26]">サブスクリプション管理</div>
                    <div className="text-xs text-[#8A8377]">プラン変更・解約はこちら</div>
                  </div>
                </button>
              )}
            </>
          ) : (
            <button onClick={() => handleNavigate('/')}
              className="flex items-center gap-3 px-4 py-3 rounded-xl bg-[#FCEEE5] hover:bg-[#F5D5C5] transition-colors text-left w-full">
              <span className="text-xl">🌟</span>
              <div>
                <div className="text-sm font-medium text-[#E8835A]">プレミアムにアップグレード</div>
                <div className="text-xs text-[#E8835A] opacity-80">¥300 / 月</div>
              </div>
            </button>
          )}

          {/* Push通知 */}
          {'Notification' in (typeof window !== 'undefined' ? window : {}) && (
            <button onClick={handlePushToggle} disabled={pushLoading}
              className="flex items-center gap-3 px-4 py-3 rounded-xl hover:bg-[#F8F4ED] transition-colors text-left w-full disabled:opacity-50">
              <span className="text-xl">{pushEnabled ? '🔔' : '🔕'}</span>
              <div>
                <div className="text-sm font-medium text-[#2C2A26]">
                  {pushEnabled ? 'リマインダーON' : 'リマインダーOFF'}
                </div>
                <div className="text-xs text-[#8A8377]">毎日20時に記録を促す通知</div>
              </div>
              <div className={`ml-auto w-9 h-5 rounded-full transition-colors flex items-center ${pushEnabled ? 'bg-[#7A9471]' : 'bg-[#DDD6C8]'}`}>
                <div className={`w-4 h-4 rounded-full bg-white shadow-sm mx-0.5 transition-transform ${pushEnabled ? 'translate-x-4' : 'translate-x-0'}`} />
              </div>
            </button>
          )}

          {/* お問い合わせ */}
          <div className="border-t border-[#EFE8DA] mt-1 pt-1">
            <button onClick={() => handleNavigate('/contact')}
              className="flex items-center gap-3 px-4 py-3 rounded-xl hover:bg-[#F8F4ED] transition-colors text-left w-full">
              <span className="text-xl">✉️</span>
              <div>
                <div className="text-sm font-medium text-[#2C2A26]">お問い合わせ</div>
                <div className="text-xs text-[#8A8377]">ご意見・要望・バグ報告はこちら</div>
              </div>
            </button>
            <button onClick={() => handleNavigate('/contact/history')}
              className="flex items-center gap-3 px-4 py-3 rounded-xl hover:bg-[#F8F4ED] transition-colors text-left w-full">
              <span className="text-xl">📬</span>
              <div>
                <div className="text-sm font-medium text-[#2C2A26]">お問い合わせ履歴</div>
                <div className="text-xs text-[#8A8377]">返信を確認する</div>
              </div>
            </button>
          </div>
        </div>

        {/* ログアウト・法的リンク - 下部固定 */}
        <div className="absolute bottom-24 left-0 right-0 px-4">
          <button onClick={handleLogout}
            className="flex items-center gap-3 px-4 py-3 rounded-xl hover:bg-[#F8F4ED] transition-colors text-left w-full">
            <span className="text-xl">🚪</span>
            <div className="text-sm font-medium text-[#8A8377]">ログアウト</div>
          </button>
          <div className="flex gap-4 px-4 mt-2">
            <button onClick={() => handleNavigate('/terms')}
              className="text-xs text-[#8A8377] hover:underline">利用規約</button>
            <button onClick={() => handleNavigate('/privacy')}
              className="text-xs text-[#8A8377] hover:underline">プライバシーポリシー</button>
          </div>
        </div>

      </div>
    </>
  )
}
