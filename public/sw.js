const CACHE_NAME = 'meal-journal-v1'

self.addEventListener('install', () => {
  self.skipWaiting()
})

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((keys) =>
      Promise.all(keys.filter((k) => k !== CACHE_NAME).map((k) => caches.delete(k)))
    )
  )
  self.clients.claim()
})

self.addEventListener('fetch', (event) => {
  const url = new URL(event.request.url)

  // API・Supabase・Stripe はネットワークのみ（キャッシュしない）
  if (
    url.pathname.startsWith('/api/') ||
    url.hostname.includes('supabase') ||
    url.hostname.includes('stripe')
  ) {
    return
  }

  // ページナビゲーション：ネットワーク優先、失敗時はキャッシュ
  if (event.request.mode === 'navigate') {
    event.respondWith(
      fetch(event.request).catch(() => caches.match('/') ?? fetch(event.request))
    )
    return
  }

  // 静的アセット：キャッシュ優先
  event.respondWith(
    caches.match(event.request).then((cached) => cached ?? fetch(event.request))
  )
})
