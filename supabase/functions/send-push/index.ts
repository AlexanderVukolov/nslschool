// Edge Function «send-push»: рассылает Web Push при новом уведомлении.
// Вызывается Database Webhook'ом на INSERT в таблицу notifications.
// Секреты: VAPID_PUBLIC_KEY, VAPID_PRIVATE_KEY (Edge Functions → Secrets).

import webpush from 'npm:web-push@3.6.7'
import { createClient } from 'npm:@supabase/supabase-js@2'

webpush.setVapidDetails(
  'mailto:admin@nsl.school',
  Deno.env.get('VAPID_PUBLIC_KEY')!,
  Deno.env.get('VAPID_PRIVATE_KEY')!,
)

Deno.serve(async (req) => {
  try {
    const payload = await req.json()
    // Webhook присылает { type: 'INSERT', record: {...} }
    const n = payload.record
    if (!n?.user_id) return new Response('no record', { status: 400 })

    const admin = createClient(
      Deno.env.get('SUPABASE_URL')!,
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!,
    )

    const { data: subs } = await admin
      .from('push_subscriptions')
      .select('*')
      .eq('user_id', n.user_id)

    if (!subs || subs.length === 0) return new Response('no subscriptions')

    const message = JSON.stringify({
      title: 'Задачник NSL',
      body: `✅ Задача «${n.task_title}» выполнена${n.by_name ? ' — ' + n.by_name : ''}`,
    })

    let sent = 0
    for (const s of subs) {
      try {
        await webpush.sendNotification(
          { endpoint: s.endpoint, keys: { p256dh: s.p256dh, auth: s.auth } },
          message,
        )
        sent++
      } catch (e) {
        // Подписка протухла (приложение удалено и т.п.) — подчищаем
        const code = (e as { statusCode?: number }).statusCode
        if (code === 404 || code === 410) {
          await admin.from('push_subscriptions').delete().eq('endpoint', s.endpoint)
        }
      }
    }
    return new Response(`sent ${sent}/${subs.length}`)
  } catch (e) {
    return new Response('error: ' + (e as Error).message, { status: 500 })
  }
})
