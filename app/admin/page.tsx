'use client'
import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { supabase } from '../../lib/supabase'

const STATUS_LABEL: Record<string, string> = { open: '返信待ち', replied: '返信済み' }
const STATUS_COLOR: Record<string, string> = {
  open: 'bg-[#FCEEE5] text-[#E8835A]',
  replied: 'bg-[#E4ECDF] text-[#7A9471]',
}

const fmtDate = (iso: string) => {
  const d = new Date(iso)
  return `${d.getFullYear()}/${d.getMonth() + 1}/${d.getDate()} ${d.getHours()}:${String(d.getMinutes()).padStart(2, '0')}`
}

type FilterType = 'all' | 'open' | 'replied'

export default function AdminPage() {
  const router = useRouter()
  const [messages, setMessages] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [selectedId, setSelectedId] = useState<string | null>(null)
  const [replyText, setReplyText] = useState('')
  const [sending, setSending] = useState(false)
  const [filter, setFilter] = useState<FilterType>('all')

  useEffect(() => { loadMessages() }, [])

  const loadMessages = async () => {
    const { data: { session } } = await supabase.auth.getSession()
    if (!session) { router.push('/login'); return }
    const res = await fetch('/api/admin/messages', {
      headers: { Authorization: `Bearer ${session.access_token}` },
    })
    if (res.status === 403) { router.push('/'); return }
    const json = await res.json()
    setMessages(json.messages || [])
    setLoading(false)
  }

  const sendReply = async (messageId: string) => {
    if (!replyText.trim()) return
    setSending(true)
    const { data: { session } } = await supabase.auth.getSession()
    if (!session) return
    const res = await fetch('/api/admin/reply', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ accessToken: session.access_token, messageId, replyText }),
    })
    if (res.ok) {
      setReplyText('')
      setSelectedId(null)
      await loadMessages()
    }
    setSending(false)
  }

  const openCount = messages.filter(m => m.status === 'open').length
  const filtered = filter === 'all' ? messages
    : messages.filter(m => m.status === filter)

  return (
    <div className="min-h-screen bg-[#F8F4ED] pb-24">
      <div className="max-w-2xl mx-auto px-4 pt-8">

        <div className="mb-6">
          <p className="text-xs font-semibold tracking-widest text-[#E8835A] uppercase mb-1">Admin</p>
          <div className="flex items-center justify-between">
            <h1 className="text-2xl font-bold text-[#2C2A26]">お問い合わせ管理</h1>
            {openCount > 0 && (
              <span className="bg-[#E8835A] text-white text-xs font-bold px-2.5 py-1 rounded-full">
                未返信 {openCount}件
              </span>
            )}
          </div>
        </div>

        {/* フィルター */}
        <div className="flex gap-2 mb-4">
          {(['all', 'open', 'replied'] as FilterType[]).map((s) => {
            const count = s === 'all' ? messages.length
              : messages.filter(m => m.status === s).length
            const label = s === 'all' ? 'すべて' : s === 'open' ? '返信待ち' : '返信済み'
            return (
              <button key={s} onClick={() => setFilter(s)}
                className={`px-3 py-1.5 rounded-full text-xs font-medium transition-all ${
                  filter === s ? 'bg-[#7A9471] text-white' : 'bg-white text-[#8A8377] border border-[#DDD6C8] hover:border-[#7A9471]'
                }`}>
                {label}（{count}）
              </button>
            )
          })}
        </div>

        {loading ? (
          <div className="text-center py-12 text-[#8A8377]">読み込み中...</div>
        ) : filtered.length === 0 ? (
          <div className="bg-white rounded-2xl p-8 border border-[#DDD6C8] text-center">
            <p className="text-sm text-[#8A8377]">お問い合わせはありません</p>
          </div>
        ) : (
          <div className="flex flex-col gap-3">
            {filtered.map((m) => {
              const replies: any[] = m.contact_replies || []
              const isSelected = selectedId === m.id
              return (
                <div key={m.id} className="bg-white rounded-2xl border border-[#DDD6C8] overflow-hidden">
                  <button onClick={() => { setSelectedId(isSelected ? null : m.id); setReplyText('') }}
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
                        <div className="flex items-center gap-2 mt-1">
                          <p className="text-xs text-[#7A9471] font-medium">{m.user_email}</p>
                          <span className="text-[#DDD6C8]">·</span>
                          <p className="text-xs text-[#8A8377]">{fmtDate(m.created_at)}</p>
                        </div>
                      </div>
                      <span className="text-[#8A8377] text-xs flex-shrink-0 mt-1">{isSelected ? '▲' : '▼'}</span>
                    </div>
                  </button>

                  {isSelected && (
                    <div className="px-4 pb-4 border-t border-[#EFE8DA]">
                      <div className="mt-3 mb-3">
                        <p className="text-xs font-semibold text-[#8A8377] mb-1.5">メッセージ全文</p>
                        <p className="text-sm text-[#2C2A26] whitespace-pre-wrap leading-relaxed bg-[#F8F4ED] rounded-xl p-3">
                          {m.message}
                        </p>
                      </div>

                      {replies.length > 0 && (
                        <div className="mb-3">
                          {replies.map((r) => (
                            <div key={r.id} className="bg-[#E4ECDF] rounded-xl p-3">
                              <p className="text-xs font-semibold text-[#7A9471] mb-1">送信済みの返信</p>
                              <p className="text-sm text-[#2C2A26] whitespace-pre-wrap">{r.reply_text}</p>
                              <p className="text-xs text-[#8A8377] mt-1">{fmtDate(r.created_at)}</p>
                            </div>
                          ))}
                        </div>
                      )}

                      {m.status === 'open' && (
                        <div>
                          <label className="block text-xs font-semibold text-[#5C574F] mb-1.5">返信内容</label>
                          <textarea
                            value={replyText}
                            onChange={(e) => setReplyText(e.target.value)}
                            placeholder="返信内容を入力..."
                            rows={5}
                            className="w-full px-4 py-3 rounded-xl border border-[#DDD6C8] bg-[#F8F4ED] text-sm text-[#2C2A26] focus:outline-none focus:border-[#7A9471] resize-none mb-2"
                          />
                          <button onClick={() => sendReply(m.id)}
                            disabled={sending || !replyText.trim()}
                            className="w-full py-2.5 bg-[#E8835A] text-white rounded-xl text-sm font-medium hover:bg-[#D4724A] transition-colors disabled:opacity-50">
                            {sending ? '送信中...' : '返信する（メール通知も送信）'}
                          </button>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              )
            })}
          </div>
        )}
      </div>
    </div>
  )
}
