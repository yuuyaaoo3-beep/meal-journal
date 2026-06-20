import Link from 'next/link'

export default function PrivacyPolicy() {
  return (
    <div className="min-h-screen bg-[#F8F4ED] px-4 py-10">
      <div className="max-w-2xl mx-auto">
        <div className="mb-8">
          <Link href="/" className="text-sm text-[#7A9471] hover:underline">← ホームへ戻る</Link>
        </div>

        <h1 className="text-2xl font-bold text-[#2C2A26] mb-2">プライバシーポリシー</h1>
        <p className="text-sm text-[#8A8377] mb-8">最終更新日：2026年6月14日</p>

        <div className="bg-white rounded-2xl p-6 shadow-sm border border-[#DDD6C8] space-y-8 text-sm text-[#2C2A26] leading-relaxed">

          <section>
            <h2 className="font-semibold text-base mb-3">1. 事業者情報</h2>
            <p>本サービス「Meal Journal」は、Meal Journal 運営者が運営します。お問い合わせはアプリ内のハンバーガーメニューよりお願いします。</p>
          </section>

          <section>
            <h2 className="font-semibold text-base mb-3">2. 収集する個人情報</h2>
            <p>本サービスでは、以下の情報を収集します。</p>
            <ul className="mt-2 space-y-1 list-disc list-inside text-[#5C574F]">
              <li>メールアドレス（アカウント登録・認証のため）</li>
              <li>食事記録（食品名・カロリー・PFCバランス）</li>
              <li>体重記録</li>
              <li>目標設定情報（カロリー・PFC目標値）</li>
              <li>お支払い情報（Stripe社を経由して処理され、当社では保持しません）</li>
            </ul>
          </section>

          <section>
            <h2 className="font-semibold text-base mb-3">3. 利用目的</h2>
            <p>収集した情報は以下の目的で利用します。</p>
            <ul className="mt-2 space-y-1 list-disc list-inside text-[#5C574F]">
              <li>サービスの提供・運営</li>
              <li>AI献立提案・週次レポートの生成</li>
              <li>決済処理・プレミアム機能の管理</li>
              <li>サービス改善・不正利用の防止</li>
              <li>お問い合わせへの対応</li>
            </ul>
          </section>

          <section>
            <h2 className="font-semibold text-base mb-3">4. 第三者への提供</h2>
            <p>当社は、以下のサービスを利用してデータを処理します。これらは適切なプライバシー保護措置を講じています。</p>
            <ul className="mt-2 space-y-1 list-disc list-inside text-[#5C574F]">
              <li>Supabase, Inc.（認証・データベース管理）</li>
              <li>Stripe, Inc.（決済処理）</li>
              <li>Anthropic, PBC（AI機能の提供）</li>
              <li>Vercel, Inc.（ホスティング）</li>
            </ul>
            <p className="mt-2">法令に基づく場合を除き、ご本人の同意なく第三者に個人情報を提供しません。</p>
          </section>

          <section>
            <h2 className="font-semibold text-base mb-3">5. データの保管・管理</h2>
            <p>お客様のデータはSupabaseのサーバー（日本国外を含む可能性があります）に安全に保管されます。パスワードは暗号化されて保存されます。</p>
          </section>

          <section>
            <h2 className="font-semibold text-base mb-3">6. お客様の権利</h2>
            <p>お客様は以下の権利を有します。</p>
            <ul className="mt-2 space-y-1 list-disc list-inside text-[#5C574F]">
              <li>保有する個人情報の開示請求</li>
              <li>情報の訂正・削除の請求</li>
              <li>アカウントの削除（メールにてご連絡ください）</li>
            </ul>
          </section>

          <section>
            <h2 className="font-semibold text-base mb-3">7. Cookie・分析ツール</h2>
            <p>本サービスでは、認証維持のためにセッションCookieを使用します。現時点でアクセス解析ツールは使用していません。</p>
          </section>

          <section>
            <h2 className="font-semibold text-base mb-3">8. プライバシーポリシーの変更</h2>
            <p>本ポリシーは必要に応じて変更することがあります。重要な変更がある場合は、アプリ内または登録メールアドレスにてお知らせします。</p>
          </section>

          <section>
            <h2 className="font-semibold text-base mb-3">9. お問い合わせ</h2>
            <p>プライバシーに関するご質問・ご要望は、アプリ内のハンバーガーメニューよりお問い合わせください。</p>
          </section>

        </div>

        <div className="mt-6 text-center">
          <Link href="/terms" className="text-sm text-[#7A9471] hover:underline">利用規約を確認する →</Link>
        </div>
      </div>
    </div>
  )
}
