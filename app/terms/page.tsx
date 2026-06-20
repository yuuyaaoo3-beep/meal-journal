import Link from 'next/link'

export default function Terms() {
  return (
    <div className="min-h-screen bg-[#F8F4ED] px-4 py-10">
      <div className="max-w-2xl mx-auto">
        <div className="mb-8">
          <Link href="/" className="text-sm text-[#7A9471] hover:underline">← ホームへ戻る</Link>
        </div>

        <h1 className="text-2xl font-bold text-[#2C2A26] mb-2">利用規約</h1>
        <p className="text-sm text-[#8A8377] mb-8">最終更新日：2026年6月14日</p>

        <div className="bg-white rounded-2xl p-6 shadow-sm border border-[#DDD6C8] space-y-8 text-sm text-[#2C2A26] leading-relaxed">

          <section>
            <h2 className="font-semibold text-base mb-3">1. はじめに</h2>
            <p>本利用規約（以下「本規約」）は、Meal Journal 運営者（以下「当社」）が提供するサービス「Meal Journal」（以下「本サービス」）の利用条件を定めるものです。ユーザーの皆様には本規約に同意いただいた上でご利用いただきます。</p>
          </section>

          <section>
            <h2 className="font-semibold text-base mb-3">2. サービス内容</h2>
            <p>本サービスは、食事記録・体重管理・AI献立提案・週次レポートなどの機能を提供するダイエット支援アプリです。</p>
            <ul className="mt-2 space-y-1 list-disc list-inside text-[#5C574F]">
              <li>無料プラン：食事記録・体重記録・基本機能</li>
              <li>プレミアムプラン（¥980/月）：AI献立提案・週次AIレポート</li>
            </ul>
          </section>

          <section>
            <h2 className="font-semibold text-base mb-3">3. アカウント登録</h2>
            <p>本サービスの利用にはアカウント登録が必要です。登録にあたり、正確な情報をご提供ください。アカウントの管理はユーザー自身の責任で行ってください。</p>
          </section>

          <section>
            <h2 className="font-semibold text-base mb-3">4. 料金・お支払い</h2>
            <p>プレミアムプランの料金は以下の通りです。</p>
            <ul className="mt-2 space-y-1 list-disc list-inside text-[#5C574F]">
              <li>月額：¥980（税込）</li>
              <li>支払方法：クレジットカード（Stripe社を通じて処理）</li>
              <li>請求サイクル：毎月自動更新</li>
              <li>返金：原則として返金は行いませんが、ご事情によってはご相談ください</li>
            </ul>
          </section>

          <section>
            <h2 className="font-semibold text-base mb-3">5. 解約・キャンセル</h2>
            <p>プレミアムプランはいつでも解約できます。解約後は次回請求日以降、プレミアム機能が停止します。解約のお申し出は下記お問い合わせ窓口までご連絡ください。</p>
          </section>

          <section>
            <h2 className="font-semibold text-base mb-3">6. 禁止事項</h2>
            <p>以下の行為を禁止します。</p>
            <ul className="mt-2 space-y-1 list-disc list-inside text-[#5C574F]">
              <li>法令または公序良俗に違反する行為</li>
              <li>本サービスの運営を妨害する行為</li>
              <li>他のユーザーへの迷惑行為</li>
              <li>不正アクセスまたはリバースエンジニアリング</li>
              <li>商業目的での無断利用</li>
            </ul>
          </section>

          <section>
            <h2 className="font-semibold text-base mb-3">7. 免責事項</h2>
            <p>本サービスが提供する情報（AI献立提案・週次レポート等）は参考情報であり、医療・栄養に関する専門的なアドバイスではありません。健康上の問題については、医師や管理栄養士にご相談ください。</p>
            <p className="mt-2">当社は、サービスの停止・変更・終了によって生じた損害について、法令の定める範囲を超えた責任を負いません。</p>
          </section>

          <section>
            <h2 className="font-semibold text-base mb-3">8. サービスの変更・終了</h2>
            <p>当社は、ユーザーへの事前通知の上、本サービスの内容を変更または終了することがあります。</p>
          </section>

          <section>
            <h2 className="font-semibold text-base mb-3">9. 準拠法・管轄裁判所</h2>
            <p>本規約は日本法に準拠します。本サービスに関する紛争は、東京地方裁判所を第一審の専属的合意管轄裁判所とします。</p>
          </section>

          <section>
            <h2 className="font-semibold text-base mb-3">10. お問い合わせ</h2>
            <p>本規約に関するご質問は、アプリ内のハンバーガーメニューよりお問い合わせください。</p>
          </section>

        </div>

        <div className="mt-6 text-center">
          <Link href="/privacy" className="text-sm text-[#7A9471] hover:underline">プライバシーポリシーを確認する →</Link>
        </div>
      </div>
    </div>
  )
}
