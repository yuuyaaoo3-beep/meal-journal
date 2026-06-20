'use client'
import { useState } from 'react'
import { useRouter } from 'next/navigation'

function Slide1() {
  return (
    <div className="p-5 flex flex-col min-h-[440px]">
      <div className="bg-gradient-to-br from-[#E4ECDF] to-[#F8F4ED] rounded-2xl p-5 text-center mb-4">
        <div className="text-4xl mb-2">🌱</div>
        <h2 className="text-lg font-bold text-[#2C2A26] mb-1">はじめに読んでほしいこと</h2>
        <p className="text-xs text-[#5C574F] leading-relaxed">
          ダイエットの「なぜ」を理解しながら<br />続けられる食事管理を始めましょう
        </p>
      </div>
      <div className="flex flex-col gap-2 flex-1">
        {[
          { icon: '📊', title: '記録する', sub: 'カロリー・PFCを記録して食習慣を可視化する' },
          { icon: '🧠', title: '理解する', sub: '太る・痩せる仕組みを正しく知る' },
          { icon: '💪', title: '続ける', sub: '無理のないペースで習慣を作る' },
          { icon: '✨', title: '変わる', sub: 'リバウンドしない体と食生活を手に入れる' },
        ].map((item) => (
          <div key={item.icon} className="flex items-center gap-3 rounded-xl p-3 border border-[#EFE8DA] bg-white">
            <div className="w-9 h-9 bg-[#E4ECDF] rounded-xl flex items-center justify-center text-lg flex-shrink-0">
              {item.icon}
            </div>
            <div>
              <div className="text-xs font-semibold text-[#7A9471]">{item.title}</div>
              <div className="text-xs text-[#5C574F]">{item.sub}</div>
            </div>
          </div>
        ))}
      </div>
      <div className="mt-3 px-4 py-2.5 bg-[#FCEEE5] rounded-xl border border-[#F5B89D] text-center">
        <p className="text-xs text-[#E8835A] font-medium">
          「何を食べるか」より「なぜそうするか」を理解することが<br />リバウンドしない近道です 🚀
        </p>
      </div>
    </div>
  )
}

function Slide2() {
  const pfcs = [
    { letter: 'P', name: 'タンパク質', pct: 25, color: '#E8835A', desc: '筋肉・肌・髪の材料。満腹感も長続き' },
    { letter: 'F', name: '脂質', pct: 20, color: '#D4A340', desc: 'ホルモンや細胞膜に不可欠。質を選んで' },
    { letter: 'C', name: '炭水化物', pct: 55, color: '#7A9471', desc: '体と脳の主なエネルギー源。適切に摂ろう' },
  ]
  return (
    <div className="p-5 flex flex-col min-h-[440px]">
      <div className="text-center mb-4">
        <div className="text-4xl mb-1.5">⚖️</div>
        <h2 className="text-lg font-bold text-[#2C2A26]">PFCバランスとは何か？</h2>
        <p className="text-xs text-[#8A8377] mt-1">3大栄養素のバランスが健康的なダイエットの鍵</p>
      </div>
      <div className="flex h-4 rounded-full overflow-hidden mb-4">
        {pfcs.map((p) => (
          <div key={p.letter} style={{ width: `${p.pct}%`, backgroundColor: p.color }} />
        ))}
      </div>
      <div className="flex flex-col gap-3 flex-1">
        {pfcs.map((p) => (
          <div key={p.letter} className="flex items-start gap-3">
            <div className="w-9 h-9 rounded-xl text-white text-sm font-bold flex items-center justify-center flex-shrink-0" style={{ backgroundColor: p.color }}>
              {p.letter}
            </div>
            <div className="flex-1">
              <div className="flex items-center justify-between mb-0.5">
                <span className="text-sm font-semibold text-[#2C2A26]">{p.name}</span>
                <span className="text-sm font-bold" style={{ color: p.color }}>{p.pct}%</span>
              </div>
              <div className="w-full h-2 bg-[#EFE8DA] rounded-full mb-1">
                <div className="h-full rounded-full" style={{ width: `${p.pct}%`, backgroundColor: p.color }} />
              </div>
              <p className="text-xs text-[#8A8377]">{p.desc}</p>
            </div>
          </div>
        ))}
      </div>
      <div className="mt-4 bg-[#E4ECDF] rounded-xl p-3 text-center">
        <p className="text-xs font-semibold text-[#5C574F]">理想の比率：P 25% ・ F 20% ・ C 55%</p>
        <p className="text-xs text-[#7A9471] mt-0.5">どれか一つを極端に減らすと体調を崩すことも</p>
      </div>
    </div>
  )
}

function Slide3() {
  return (
    <div className="p-5 flex flex-col min-h-[440px]">
      <div className="text-center mb-4">
        <div className="text-4xl mb-1.5">🔥</div>
        <h2 className="text-lg font-bold text-[#2C2A26]">なぜカロリーを減らすと痩せるの？</h2>
        <p className="text-xs text-[#8A8377] mt-1">エネルギーバランスの仕組みを理解しよう</p>
      </div>
      <div className="flex items-center justify-center gap-2 mb-4">
        <div className="flex flex-col items-center bg-[#FCEEE5] rounded-xl px-4 py-3 border border-[#F5B89D] flex-1">
          <span className="text-lg">🍚</span>
          <span className="text-xs text-[#8A8377]">摂取カロリー</span>
          <span className="text-sm font-bold text-[#E8835A]">IN</span>
        </div>
        <div className="text-2xl font-bold text-[#DDD6C8] flex-shrink-0">＜</div>
        <div className="flex flex-col items-center bg-[#E4ECDF] rounded-xl px-4 py-3 border border-[#B5D0AE] flex-1">
          <span className="text-lg">🏃</span>
          <span className="text-xs text-[#8A8377]">消費カロリー</span>
          <span className="text-sm font-bold text-[#7A9471]">OUT</span>
        </div>
        <div className="text-xl text-[#DDD6C8] flex-shrink-0">=</div>
        <div className="flex flex-col items-center bg-white rounded-xl px-3 py-3 border border-[#DDD6C8] flex-1">
          <span className="text-lg">📉</span>
          <span className="text-xs text-[#8A8377]">体脂肪</span>
          <span className="text-sm font-bold text-[#7A9471]">↓ 減</span>
        </div>
      </div>
      <div className="flex flex-col gap-2.5 flex-1">
        <div className="flex items-start gap-3 bg-[#F8F4ED] rounded-xl p-3.5 border border-[#DDD6C8]">
          <span className="text-xl flex-shrink-0">⚡</span>
          <div>
            <p className="text-sm font-semibold text-[#2C2A26]">体脂肪1kgを燃やすには</p>
            <p className="text-lg font-bold text-[#E8835A]">約7,200kcal</p>
            <p className="text-xs text-[#8A8377]">の累積赤字（消費 > 摂取）が必要</p>
          </div>
        </div>
        <div className="flex items-start gap-3 bg-[#F8F4ED] rounded-xl p-3.5 border border-[#DDD6C8]">
          <span className="text-xl flex-shrink-0">📅</span>
          <div>
            <p className="text-sm font-semibold text-[#2C2A26]">1日300kcal減らすと…</p>
            <p className="text-xs text-[#5C574F]">7,200 ÷ 300 = <span className="font-bold text-[#7A9471]">約24日で体脂肪1kg減</span></p>
            <p className="text-xs text-[#8A8377]">着実に続けることが大切</p>
          </div>
        </div>
      </div>
      <p className="text-xs text-[#8A8377] text-center mt-3">焦らず着実に。急激な制限は逆効果になることも 💭</p>
    </div>
  )
}

function Slide4() {
  const items = [
    { label: '基礎代謝', pct: 60, color: '#E8835A', icon: '❤️', desc: '心臓・呼吸・体温維持など生命維持に使うエネルギー。寝ていても消費する' },
    { label: '活動代謝', pct: 30, color: '#7A9471', icon: '🏃', desc: '日常の動作・運動で消費するエネルギー。動くほど増える' },
    { label: '食事誘発', pct: 10, color: '#D4A340', icon: '🍽', desc: '食べ物を消化・吸収するときに使うエネルギー（TEF）' },
  ]
  return (
    <div className="p-5 flex flex-col min-h-[440px]">
      <div className="text-center mb-3">
        <div className="text-4xl mb-1.5">⚙️</div>
        <h2 className="text-lg font-bold text-[#2C2A26]">基礎代謝・活動代謝とは？</h2>
        <p className="text-xs text-[#8A8377] mt-1">1日に使うエネルギーの内訳</p>
      </div>
      <div className="flex h-4 rounded-full overflow-hidden mb-4">
        {items.map((item) => (
          <div key={item.label} style={{ width: `${item.pct}%`, backgroundColor: item.color }} />
        ))}
      </div>
      <div className="flex flex-col gap-2.5 flex-1">
        {items.map((item) => (
          <div key={item.label} className="flex items-start gap-3 bg-[#F8F4ED] rounded-xl p-3 border border-[#DDD6C8]">
            <div className="w-9 h-9 rounded-xl flex items-center justify-center text-lg flex-shrink-0" style={{ backgroundColor: item.color + '22' }}>
              {item.icon}
            </div>
            <div className="flex-1">
              <div className="flex items-center justify-between mb-0.5">
                <span className="text-sm font-semibold text-[#2C2A26]">{item.label}</span>
                <span className="text-sm font-bold" style={{ color: item.color }}>{item.pct}%</span>
              </div>
              <p className="text-xs text-[#8A8377]">{item.desc}</p>
            </div>
          </div>
        ))}
      </div>
      <div className="mt-3 bg-[#E4ECDF] rounded-xl p-3 text-center">
        <p className="text-xs font-semibold text-[#7A9471]">💡 基礎代謝を上げるには筋肉量が大切！</p>
        <p className="text-xs text-[#5C574F] mt-0.5">筋トレ＋タンパク質で代謝アップを狙おう</p>
      </div>
    </div>
  )
}

function Slide5() {
  return (
    <div className="p-5 flex flex-col min-h-[440px]">
      <div className="text-center mb-4">
        <div className="text-4xl mb-1.5">🎯</div>
        <h2 className="text-lg font-bold text-[#2C2A26]">アンダーカロリーの正しい作り方</h2>
        <p className="text-xs text-[#8A8377] mt-1">「カロリー赤字」を賢く、無理なく作るコツ</p>
      </div>
      <div className="bg-[#E4ECDF] rounded-2xl p-4 mb-3 text-center border border-[#B5D0AE]">
        <p className="text-xs text-[#5C574F] mb-1">理想的な赤字幅（1日あたり）</p>
        <p className="text-2xl font-bold text-[#7A9471]">300〜500kcal</p>
        <p className="text-xs text-[#8A8377] mt-0.5">TDEE（総消費カロリー）の15〜20%が目安</p>
      </div>
      <div className="flex flex-col gap-2.5 flex-1">
        <div className="flex items-start gap-3 bg-[#FCEEE5] rounded-xl p-3.5 border border-[#F5B89D]">
          <span className="text-base flex-shrink-0">⚠️</span>
          <div>
            <p className="text-xs font-semibold text-[#E8835A]">やりすぎ注意</p>
            <p className="text-xs text-[#5C574F] mt-0.5">800kcal以下などの極端な制限は筋肉も失い、代謝が落ちてかえって痩せにくくなります</p>
          </div>
        </div>
        <div className="flex items-start gap-3 bg-[#E4ECDF] rounded-xl p-3.5 border border-[#B5D0AE]">
          <span className="text-base flex-shrink-0">✅</span>
          <div>
            <p className="text-xs font-semibold text-[#7A9471]">ポイント</p>
            <p className="text-xs text-[#5C574F] mt-0.5">タンパク質をしっかり摂って筋肉を守りながら、<span className="font-semibold">週0.5〜1kgペース</span>の減量が理想的</p>
          </div>
        </div>
        <div className="flex items-center gap-3 bg-[#F8F4ED] rounded-xl p-3 border border-[#DDD6C8]">
          <span className="text-base">📱</span>
          <p className="text-xs text-[#5C574F]">
            <span className="font-semibold text-[#2C2A26]">TDEE = 基礎代謝 × 活動レベル係数</span><br />
            ゴール設定で自動計算されます
          </p>
        </div>
      </div>
    </div>
  )
}

function Slide6() {
  return (
    <div className="p-5 flex flex-col min-h-[440px]">
      <div className="text-center mb-4">
        <div className="text-4xl mb-1.5">📉</div>
        <h2 className="text-lg font-bold text-[#2C2A26]">停滞期について</h2>
        <p className="text-xs text-[#8A8377] mt-1">体重が止まっても、焦らないで</p>
      </div>
      <div className="flex items-start gap-3 bg-[#FCEEE5] rounded-xl p-3.5 mb-3 border border-[#F5B89D]">
        <span className="text-xl flex-shrink-0">🤔</span>
        <div>
          <p className="text-sm font-semibold text-[#2C2A26]">なぜ停滞するの？</p>
          <p className="text-xs text-[#5C574F] mt-0.5">体が「これが普通」と判断し省エネモードに入るため。開始から3〜4週間後に起きやすい<span className="font-semibold">「適応現象」</span>です</p>
        </div>
      </div>
      <div className="flex-1">
        <p className="text-xs font-semibold text-[#5C574F] mb-2">乗り越え方</p>
        <div className="flex flex-col gap-1.5">
          {[
            { icon: '⏳', text: '焦らず継続（2週間変わらなければ見直しのサイン）' },
            { icon: '🍽', text: '週に1回、少し多め食べる「チートデイ」を試す' },
            { icon: '🏋️', text: '運動の種類や強度を変えてみる' },
            { icon: '😴', text: '睡眠・ストレス管理を見直す' },
          ].map((item) => (
            <div key={item.icon} className="flex items-center gap-2.5 bg-[#F8F4ED] rounded-xl px-3 py-2.5 border border-[#DDD6C8]">
              <span className="text-base flex-shrink-0">{item.icon}</span>
              <span className="text-xs text-[#2C2A26]">{item.text}</span>
            </div>
          ))}
        </div>
      </div>
      <div className="mt-3 bg-[#E4ECDF] rounded-xl p-3 text-center">
        <p className="text-xs font-semibold text-[#7A9471]">停滞期は成長の証 🌱</p>
        <p className="text-xs text-[#5C574F] mt-0.5">体は必ず動き出します。諦めないで続けましょう！</p>
      </div>
    </div>
  )
}

const SLIDES = [
  { label: 'はじめに', component: <Slide1 /> },
  { label: 'PFCバランス', component: <Slide2 /> },
  { label: 'カロリーと体重', component: <Slide3 /> },
  { label: '代謝の仕組み', component: <Slide4 /> },
  { label: 'アンダーカロリー', component: <Slide5 /> },
  { label: '停滞期', component: <Slide6 /> },
]

export default function Learn() {
  const [current, setCurrent] = useState(0)
  const router = useRouter()
  const isLast = current === SLIDES.length - 1

  return (
    <div className="min-h-screen bg-[#F8F4ED] flex flex-col pb-32">
      <div className="max-w-md mx-auto w-full flex flex-col flex-1 pt-6 px-4">

        {/* ヘッダー */}
        <div className="mb-4">
          <p className="text-xs font-semibold tracking-widest text-[#7A9471] uppercase mb-1">Learn</p>
          <h1 className="text-xl font-bold text-[#2C2A26]">ダイエット基礎知識</h1>
        </div>

        {/* ページインジケーター */}
        <div className="flex justify-center gap-2 mb-4">
          {SLIDES.map((_, i) => (
            <button key={i} onClick={() => setCurrent(i)}
              className={`transition-all duration-300 rounded-full ${
                i === current ? 'w-6 h-2 bg-[#7A9471]' : 'w-2 h-2 bg-[#DDD6C8]'
              }`} />
          ))}
        </div>

        {/* スライドコンテンツ */}
        <div className="w-full bg-white rounded-2xl border border-[#DDD6C8] shadow-sm overflow-hidden">
          {SLIDES[current].component}
        </div>

        {/* ページ番号 & ラベル */}
        <div className="text-center text-xs text-[#8A8377] mt-3 mb-4">
          <span className="font-medium text-[#5C574F]">{SLIDES[current].label}</span>
          <span className="mx-1.5 text-[#DDD6C8]">·</span>
          {current + 1} / {SLIDES.length}
        </div>

        {/* ナビゲーション */}
        <div className="flex gap-3 mb-3">
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

        {!isLast && (
          <button onClick={() => router.push('/')}
            className="text-center text-xs text-[#8A8377] mb-4 hover:text-[#5C574F] transition-colors">
            スキップして始める
          </button>
        )}

      </div>
    </div>
  )
}
