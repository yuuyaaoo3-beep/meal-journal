'use client'
import { useState, useEffect } from 'react'
import { supabase } from '../../lib/supabase'
import { useRouter } from 'next/navigation'

export default function WeeklyReport() {
  const [isPremium, setIsPremium] = useState(false)
  const [loading, setLoading] = useState(true)
  const [reportStatus, setReportStatus] = useState<'idle' | 'loading' | 'streaming' | 'complete' | 'error'>('idle')
  const [reportText, setReportText] = useState('')
  const [reportError, setReportError] = useState<string | null>(null)
  const router = useRouter()

  useEffect(() => {
    const load = async () => {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) { window.location.href = '/login'; return }
      const { data } = await supabase
        .from('user_goals')
        .select('is_premium')
        .eq('user_id', user.id)
        .single()
      setIsPremium(data?.is_premium ?? false)
      setLoading(false)
    }
    load()
  }, [])

  const today = new Date()
  const fromDate = new Date(today)
  fromDate.setDate(fromDate.getDate() - 6)
  const fmt = (d: Date) => `${d.getMonth() + 1}月${d.getDate()}日`
  const periodLabel = `${fmt(fromDate)} 〜 ${fmt(today)}`

  const generateReport = async () => {
    setReportStatus('loading')
    setReportText('')
    setReportError(null)
    try {
      const { data: { session } } = await supabase.auth.getSession()
      if (!session?.access_token) throw new Error('no session')

      const res = await fetch('/api/weekly-report', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ accessToken: session.access_token }),
      })

      if (!res.ok) {
        const errData = await res.json()
        setReportError(errData.error ?? 'エラーが発生しました')
        setReportStatus('error')
        return
      }

      setReportStatus('streaming')
      const reader = res.body!.getReader()
      const decoder = new TextDecoder()
      while (true) {
        const { done, value } = await reader.read()
        if (done) break
        setReportText(prev => prev + decoder.decode(value, { stream: true }))
      }
      setReportStatus('complete')
    } catch {
      setReportError('レポートの生成に失敗しました。しばらくしてからもう一度お試しください。')
      setReportStatus('error')
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-[#F8F4ED] flex items-center justify-center">
        <div className="text-[#8A8377]">読み込み中...</div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-[#F8F4ED] pb-24">
      <div className="max-w-md mx-auto px-4 pt-8">

        <div className="flex items-center gap-3 mb-6">
          <button onClick={() => router.back()}
            className="p-2 rounded-xl hover:bg-[#EFE8DA] transition-colors">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#5C574F" strokeWidth="2" strokeLinecap="round">
              <polyline points="15 18 9 12 15 6"/>
            </svg>
          </button>
          <div>
            <p className="text-xs font-semibold tracking-widest text-[#7A9471] uppercase mb-0.5">Weekly Report</p>
            <h1 className="text-2xl font-bold text-[#2C2A26]">週次レポート</h1>
          </div>
        </div>

        {!isPremium ? (
          <div className="bg-gradient-to-br from-[#FCEEE5] to-[#F8F4ED] rounded-2xl p-6 border border-[#F5B89D] text-center">
            <p className="text-2xl mb-3">🌟</p>
            <p className="text-sm font-semibold text-[#2C2A26] mb-2">プレミアム機能です</p>
            <p className="text-xs text-[#5C574F] mb-5">週次レポートはプレミアムプランでご利用いただけます</p>
            <button
              onClick={() => router.push('/')}
              className="px-6 py-3 bg-[#E8835A] text-white rounded-xl font-medium hover:bg-[#D4724A] transition-colors text-sm">
              ホームでアップグレード
            </button>
          </div>
        ) : (
          <>
            <div className="bg-white rounded-2xl p-4 border border-[#DDD6C8] mb-4 flex items-center justify-between">
              <div>
                <p className="text-xs text-[#8A8377] mb-0.5">対象期間</p>
                <p className="text-sm font-semibold text-[#2C2A26]">{periodLabel}</p>
              </div>
              <span className="text-xs px-3 py-1 bg-[#E4ECDF] text-[#7A9471] rounded-full font-medium">直近7日間</span>
            </div>

            {reportStatus === 'idle' && (
              <div className="bg-gradient-to-br from-[#E4ECDF] to-[#F8F4ED] rounded-2xl p-6 border border-[#DDD6C8] text-center">
                <p className="text-3xl mb-3">📋</p>
                <p className="text-sm font-semibold text-[#2C2A26] mb-1">AIが1週間を振り返ります</p>
                <p className="text-xs text-[#5C574F] mb-5">食事記録・体重データをもとに<br />傾向分析とアドバイスをお届けします</p>
                <button onClick={generateReport}
                  className="w-full py-3 bg-[#7A9471] text-white rounded-xl font-medium hover:bg-[#6A8462] transition-colors">
                  ✨ レポートを生成する
                </button>
              </div>
            )}

            {reportStatus === 'loading' && (
              <div className="bg-white rounded-2xl p-6 border border-[#DDD6C8]">
                <div className="space-y-3 mb-4">
                  <div className="h-3 bg-[#EFE8DA] rounded-full w-full animate-pulse" />
                  <div className="h-3 bg-[#EFE8DA] rounded-full w-4/5 animate-pulse" />
                  <div className="h-3 bg-[#EFE8DA] rounded-full w-3/5 animate-pulse" />
                  <div className="h-3 bg-[#EFE8DA] rounded-full w-full animate-pulse" />
                  <div className="h-3 bg-[#EFE8DA] rounded-full w-2/3 animate-pulse" />
                </div>
                <p className="text-xs text-[#8A8377] text-center">AIが1週間のデータを分析しています...</p>
              </div>
            )}

            {(reportStatus === 'streaming' || reportStatus === 'complete') && (
              <div className="bg-white rounded-2xl border border-[#DDD6C8] overflow-hidden">
                <div className="px-5 py-4 border-b border-[#EFE8DA] bg-gradient-to-r from-[#E4ECDF] to-white">
                  <p className="text-sm font-semibold text-[#7A9471]">🤖 AIコーチからのレポート</p>
                  <p className="text-xs text-[#8A8377] mt-0.5">{periodLabel}</p>
                </div>
                <div className="p-5">
                  <div className="text-sm text-[#2C2A26] leading-relaxed whitespace-pre-wrap">
                    {reportText}
                    {reportStatus === 'streaming' && (
                      <span className="inline-block w-1 h-3 bg-[#7A9471] animate-pulse ml-0.5 align-middle" />
                    )}
                  </div>
                </div>
                {reportStatus === 'complete' && (
                  <div className="px-5 pb-5">
                    <button onClick={generateReport}
                      className="w-full py-2.5 bg-[#F8F4ED] text-[#7A9471] rounded-xl font-medium border border-[#7A9471] hover:bg-[#E4ECDF] transition-colors text-sm">
                      🔄 再生成する
                    </button>
                  </div>
                )}
              </div>
            )}

            {reportStatus === 'error' && (
              <div className="space-y-3">
                <div className="bg-[#FCEEE5] border border-[#F5B89D] rounded-2xl p-4">
                  <p className="text-xs text-[#E8835A] font-medium mb-1">エラーが発生しました</p>
                  <p className="text-xs text-[#5C574F]">{reportError}</p>
                </div>
                <button onClick={generateReport}
                  className="w-full py-3 bg-[#7A9471] text-white rounded-xl font-medium hover:bg-[#6A8462] transition-colors">
                  ✨ もう一度試す
                </button>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  )
}
