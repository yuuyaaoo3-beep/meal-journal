'use client'
import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { supabase } from '../../../lib/supabase'

const STATUS_LABEL: Record<string, string> = { open: '返信待ち', replied: '返信済み' }
const STATUS_COLOR: Record<string, string> = {
  open: 'bg-[#FCEEE5] text-[#E8835A]',
  replied: 'bg-[#E4ECDF] text-[#7A9471]',
}

const fmtDate = (iso: string) => {
  const d = new Date(iso)
  return `${d.getFullYear()}/${d.getMonth() + 1}/${d.getDate()} ${d.getHours()}:${String(d.getMinutes()).padStart(2, '0')}`
}

export default function ContactHistory() {
  const router = useRouter()
  const [messages, setMessages] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [expandedId, setExpandedId] = useState<string | null>(null)

  useEffect(() => { loadMessages() }, [])

  const loadMessages = async () => {
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) { router.push('/login'); return }
    const { data } = await supabase
      .from('contact_messages')
      .select('*, contact_replies(*)')
      .eq('user_id', user.id)
      .order('created_at', { ascending: false })
    setMessages(data || [])
    setLoading(false)
  }

  return (
    <div className="min-h-screen bg-[#F8F4ED] pb-24">
      <div className="max-w-md mx-auto px-4 pt-8">
        <div className="mb-6">
          <button onClick={() => router.back()} className="text-sm text-[#7A9471] hover:underline mb-3 block">← 戻る</button>
          <p className="text-xs font-semibold tracking-widest text-[#7A9471] uppercase mb-1">Contact</p>
          <h1 className="text-2xl font-bold text-[#2C2A26]">お問い合わせ履歴</h1>
        </div>

        {loading ? (
          <div className="text-center py-12 text-[#8A8377]">読み込み中...</div>
        ) : messages.length === 0 ? (
          <div className="bg-white rounded-2xl p-8 border border-[#DDD6C8] text-center">
            <div className="text-3xl mb-2">📭</div>
            <p className="text-sm text-[#8A8377] mb-4">まだお問い合わせはありません</p>
            <button onClick={() => router.push('/contact')}
              className="px-6 py-2.5 bg-[#7A9471] text-white rounded-xl text-sm font-medium hover:bg-[#6A8462] transition-colors">
              お問い合わせする
            </button>
          </div>
        ) : (
          <div className="flex flex-col gap-3">
            {messages.map((m) => {
              const isExpanded = expandedId === m.id
              const replies: any[] = m.contact_replies || []
              return (
                <div key={m.id} className="bg-white rounded-2xl border border-[#DDD6C8] overflow-hidden">
                  <button onClick={() => setExpandedId(isExpanded ? null : m.id)}
                    className="w-full text-left p-4">
                    <div className="flex items-start justify-between gap-2">
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 flex-wrap mb-1">
                          <span className={`text-xs font-medium px-2 py-0.5 rounded-full ${STATUS_COLOR[m.status]}`}>
                            {STATUS_LABEL[m.status]}
                          </span>
                          <span className="text-xs text-[#8A8377] bg-[#F8F4ED] px-2 py-0.5 rounded-full">{m.category}</span>
                        </div>
                        <p className="text-sm text-[#2C2A26] line-clamp-2">{m.message}</p>
                        <p className="text-xs text-[#8A8377] mt-1">{fmtDate(m.created_at)}</p>
                      </div>
                      <span className="text-[#8A8377] text-xs flex-shrink-0 mt-1">{isExpanded ? '▲' : '▼'}</span>
                    </div>
                  </button>

                  {isExpanded && (
                    <div className="px-4 pb-4 border-t border-[#EFE8DA]">
                      <div className="mt-3">
                        <p className="text-xs font-semibold text-[#8A8377] mb-1.5">お問い合わせ内容</p>
                        <p className="text-sm text-[#2C2A26] whitespace-pre-wrap leading-relaxed bg-[#F8F4ED] rounded-xl p-3">
                          {m.message}
                        </p>
                      </div>
                      {replies.length > 0 ? (
                        <div className="mt-3">
                          {replies.map((r) => (
                            <div key={r.id} className="bg-[#E4ECDF] rounded-xl p-3.5">
                              <p className="text-xs font-semibold text-[#7A9471] mb-1.5">🌿 サポートからの返信</p>
                              <p className="text-sm text-[#2C2A26] whitespace-pre-wrap leading-relaxed">{r.reply_text}</p>
                              <p className="text-xs text-[#8A8377] mt-2">{fmtDate(r.created_at)}</p>
                            </div>
                          ))}
                        </div>
                      ) : (
                        <div className="mt-3 px-3 py-2.5 bg-[#FCEEE5] rounded-xl border border-[#F5B89D]">
                          <p className="text-xs text-[#E8835A]">現在確認中です。もうしばらくお待ちください。</p>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              )
            })}

            <div className="text-center pt-2">
              <button onClick={() => router.push('/contact')}
                className="px-6 py-2.5 bg-[#7A9471] text-white rounded-xl text-sm font-medium hover:bg-[#6A8462] transition-colors">
                新しくお問い合わせする
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
