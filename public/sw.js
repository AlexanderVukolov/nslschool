// Минимальный service worker задачника NSL: нужен для установки на телефон.
// Стратегия: сеть в приоритете, кэш — запасной вариант для офлайна.
const CACHE = 'nsl-tasks-v1'

self.addEventListener('install', (e) => {
  self.skipWaiting()
})

self.addEventListener('activate', (e) => {
  e.waitUntil(
    caches.keys().then((keys) => Promise.all(keys.filter((k) => k !== CACHE).map((k) => caches.delete(k)))),
  )
  self.clients.claim()
})

// Показ push-уведомления (приходит даже при закрытом приложении)
self.addEventListener('push', (e) => {
  let data = {}
  try {
    data = e.data.json()
  } catch {
    data = { body: e.data ? e.data.text() : '' }
  }
  e.waitUntil(
    self.registration.showNotification(data.title || 'Задачник NSL', {
      body: data.body || '',
      icon: 'icon.svg',
      badge: 'icon.svg',
      lang: 'ru',
      data: { url: data.url || self.registration.scope },
    }),
  )
})

// Клик по уведомлению — открыть задачник
self.addEventListener('notificationclick', (e) => {
  e.notification.close()
  const url = e.notification.data?.url || self.registration.scope
  e.waitUntil(
    clients.matchAll({ type: 'window', includeUncontrolled: true }).then((list) => {
      const open = list.find((c) => c.url.startsWith(self.registration.scope))
      return open ? open.focus() : clients.openWindow(url)
    }),
  )
})

self.addEventListener('fetch', (e) => {
  const { request } = e
  // Кэшируем только GET-запросы к своим файлам (не API Supabase)
  if (request.method !== 'GET' || !request.url.startsWith(self.location.origin)) return
  e.respondWith(
    fetch(request)
      .then((resp) => {
        const copy = resp.clone()
        caches.open(CACHE).then((c) => c.put(request, copy)).catch(() => {})
        return resp
      })
      .catch(() => caches.match(request)),
  )
})
