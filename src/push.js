// Web Push: подписка браузера на уведомления задачника.
// Подписки хранятся в таблице push_subscriptions; рассылает их
// Edge Function в Supabase при появлении нового уведомления.

import { supabase } from './supabaseClient.js'
import { VAPID_PUBLIC_KEY } from './config.js'

function urlB64ToUint8Array(base64) {
  const padding = '='.repeat((4 - (base64.length % 4)) % 4)
  const raw = atob((base64 + padding).replace(/-/g, '+').replace(/_/g, '/'))
  return Uint8Array.from([...raw].map((c) => c.charCodeAt(0)))
}

// Поддерживает ли это устройство/браузер push
export function pushSupported() {
  return 'serviceWorker' in navigator && 'PushManager' in window && 'Notification' in window
}

// Текущее состояние: 'on' | 'off' | 'denied' | 'unsupported'
export async function pushStatus() {
  if (!pushSupported()) return 'unsupported'
  if (Notification.permission === 'denied') return 'denied'
  try {
    const reg = await navigator.serviceWorker.ready
    const sub = await reg.pushManager.getSubscription()
    return sub ? 'on' : 'off'
  } catch {
    return 'off'
  }
}

// Включить push-уведомления для текущего пользователя
export async function enablePush(userId) {
  if (!pushSupported()) {
    throw new Error(
      'Этот браузер не поддерживает push. На iPhone сначала установите задачник на главный экран.',
    )
  }
  const perm = await Notification.requestPermission()
  if (perm !== 'granted') {
    throw new Error('Уведомления запрещены. Разрешите их в настройках браузера для этого сайта.')
  }
  const reg = await navigator.serviceWorker.ready
  const sub = await reg.pushManager.subscribe({
    userVisibleOnly: true,
    applicationServerKey: urlB64ToUint8Array(VAPID_PUBLIC_KEY),
  })
  const j = sub.toJSON()
  const { error } = await supabase.from('push_subscriptions').upsert(
    {
      user_id: userId,
      endpoint: sub.endpoint,
      p256dh: j.keys.p256dh,
      auth: j.keys.auth,
    },
    { onConflict: 'endpoint' },
  )
  if (error) throw new Error('Не удалось сохранить подписку: ' + error.message)
}

// Выключить push на этом устройстве
export async function disablePush() {
  const reg = await navigator.serviceWorker.ready
  const sub = await reg.pushManager.getSubscription()
  if (sub) {
    await supabase.from('push_subscriptions').delete().eq('endpoint', sub.endpoint)
    await sub.unsubscribe()
  }
}
