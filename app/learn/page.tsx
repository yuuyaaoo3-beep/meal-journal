'use client'
import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Image from 'next/image'

const pages = [
  { id: 1, src: '/learn-01.png', alt: 'はじめに読んでほしいこと' },
  { id: 2, src: '/learn-02.png', alt: 'PFCバランスとは何か？' },
  { id: 3, src: '/learn-03.png', alt: 'なぜカロリーを減らすと痩せるの？' },
  { id: 4, src: '/learn-04.png', alt: '基礎代謝・活動代謝とは？' },
  { id: 5, src: '/learn-05.png', alt: 'アンダーカロリーの正しい作り方' },
  { id: 6, src: '/learn-06.png', alt: '停滞期について' },
]

export default function Learn() {
  const [current, setCurrent] = useState(0)
  const router = useRouter()
  const isLast = current === pages.length - 1

  return (
    <div className="min-h-screen bg-[#F8F4ED] flex flex-col">
      <div className="max-w-md mx-auto w-full flex flex-col flex-1 pt-6 pb-6 px-4">

        {/* ページインジケーター */}
        <div className="flex justify-center gap-2 mb-4">
          {pages.map((_, i) => (
            <button key={i} onClick={() => setCurrent(i)}
              className={`transition-all duration-300 rounded-full ${
                i === current ? 'w-6 h-2 bg-[#7A9471]' : 'w-2 h-2 bg-[#DDD6C8]'
              }`} />
          ))}
        </div>

        {/* 画像 */}
        <div className="flex-1 flex items-center justify-center">
          <div className="w-full rounded-2xl overflow-hidden shadow-sm border border-[#DDD6C8]">
            <Image
              src={pages[current].src}
              alt={pages[current].alt}
              width={800}
              height={500}
              className="w-full h-auto"
              priority
            />
          </div>
        </div>

        {/* ページ番号 */}
        <div className="text-center text-xs text-[#8A8377] mt-3 mb-3">
          {current + 1} / {pages.length}
        </div>

        {/* ナビゲーションボタン */}
        <div className="flex gap-3">
          {current > 0 ? (
            <button onClick={() => setCurrent(current - 1)}
              className="flex-1 py-3 bg-white border border-[#DDD6C8] rounded-2xl text-sm font-medium text-[#5C574F] hover:border-[#7A9471] transition-all">
              ← 前へ
            </button>
          ) : (
            <div className="flex-1" />
          )}
          {isLast ? (
            <button onClick={() => router.push('/')}
              className="flex-1 py-3 bg-[#7A9471] text-white rounded-2xl text-sm font-semibold hover:bg-[#6A8462] transition-all shadow-sm">
              はじめる →
            </button>
          ) : (
            <button onClick={() => setCurrent(current + 1)}
              className="flex-1 py-3 bg-[#7A9471] text-white rounded-2xl text-sm font-semibold hover:bg-[#6A8462] transition-all shadow-sm">
              次へ →
            </button>
          )}
        </div>

        {/* スキップ */}
        {!isLast && (
          <button onClick={() => router.push('/')}
            className="text-center text-xs text-[#8A8377] mt-3 hover:text-[#5C574F] transition-colors">
            スキップして始める
          </button>
        )}

      </div>
    </div>
  )
}