'use client'
import { useState } from 'react'
import { useRouter } from 'next/navigation'

const steps = [
  {
    emoji: '🌿',
    title: 'Meal Journalへようこそ',
    description: '食事と体重を記録して、\n理想の体型を目指しましょう。\nシンプルで続けやすいダイエット管理アプリです。',
    color: '#7A9471',
    bg: '#E4ECDF',
  },
  {
    emoji: '📊',
    title: '栄養バランスを可視化',
    description: '毎日の食事を記録するだけで\nカロリーとPFC（タンパク質・脂質・糖質）の\nバランスが一目でわかります。',
    color: '#E8835A',
    bg: '#FCEEE5',
  },
  {
    emoji: '🤖',
    title: 'AIがサポートしてくれる',
    description: 'プレミアムでは、AIが今日の献立を提案したり\n1週間の食事を振り返るレポートを\n自動で届けてくれます。',
    color: '#7A9471',
    bg: '#E4ECDF',
  },
  {
    emoji: '📱',
    title: 'ホーム画面に追加しよう',
    description: 'アプリのように使えます。\nSafariの場合：画面下の 共有ボタン（□↑）→\n「ホーム画面に追加」をタップしてください。',
    color: '#E8835A',
    bg: '#FCEEE5',
  },
]

export default function Onboarding() {
  const [current, setCurrent] = useState(0)
  const router = useRouter()
  const isLast = current === steps.length - 1
  const step = steps[current]

  return (
    <div className="min-h-screen bg-[#F8F4ED] flex flex-col items-center justify-between px-6 py-12">

      {/* スキップ */}
      <div className="w-full max-w-sm flex justify-end">
        {!isLast && (
          <button
            onClick={() => router.push('/goal')}
            className="text-sm text-[#8A8377] hover:text-[#5C574F] transition-colors">
            スキップ
          </button>
        )}
      </div>

      {/* メインコンテンツ */}
      <div className="w-full max-w-sm flex flex-col items-center text-center flex-1 justify-center">
        {/* アイコン */}
        <div
          className="w-32 h-32 rounded-3xl flex items-center justify-center mb-8 shadow-sm transition-all duration-300"
          style={{ backgroundColor: step.bg }}>
          <span className="text-6xl">{step.emoji}</span>
        </div>

        {/* テキスト */}
        <h1 className="text-2xl font-bold text-[#2C2A26] mb-4 leading-tight">
          {step.title}
        </h1>
        <p className="text-sm text-[#5C574F] leading-7 whitespace-pre-line">
          {step.description}
        </p>
      </div>

      {/* 下部 */}
      <div className="w-full max-w-sm flex flex-col items-center gap-6">
        {/* ドットインジケーター */}
        <div className="flex gap-2">
          {steps.map((_, i) => (
            <button
              key={i}
              onClick={() => setCurrent(i)}
              className="transition-all duration-300 rounded-full"
              style={{
                width: i === current ? 24 : 8,
                height: 8,
                backgroundColor: i === current ? '#7A9471' : '#DDD6C8',
              }}
            />
          ))}
        </div>

        {/* ボタン */}
        {isLast ? (
          <button
            onClick={() => router.push('/goal')}
            className="w-full py-4 bg-[#7A9471] text-white rounded-2xl font-semibold text-base hover:bg-[#6A8462] transition-colors shadow-sm">
            目標を設定して始める →
          </button>
        ) : (
          <button
            onClick={() => setCurrent(current + 1)}
            className="w-full py-4 bg-[#7A9471] text-white rounded-2xl font-semibold text-base hover:bg-[#6A8462] transition-colors shadow-sm">
            次へ
          </button>
        )}
      </div>
    </div>
  )
}
