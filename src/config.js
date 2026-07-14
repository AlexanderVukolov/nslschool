// Конфигурация подключения к Supabase.
// Пока SUPABASE_ANON_KEY пуст — приложение работает в локальном демо-режиме
// (данные в браузере). Как только ключ заполнен, задачник переключается
// на общую базу: единые задачи, аккаунты и уведомления для всей команды.

export const SUPABASE_URL = 'https://wmnymdmjiczbmjyztcze.supabase.co'
export const SUPABASE_ANON_KEY = 'sb_publishable_Uqq-PpfJkZVkPYbd6CsYlQ_zKlTJPG4'

// Публичный VAPID-ключ для Web Push уведомлений (парный приватный —
// в секретах Supabase Edge Functions)
export const VAPID_PUBLIC_KEY =
  'BEfgzfx1Red5KeX1Sg1sY36VGOtxST5FNxOcxJs7P3SoYckS1LKfQTy1qPns3HxinPoZ-iIU5ttWpBgQ9v1B5uk'

// Флаг window.NSL_LOCAL_DEMO принудительно включает локальный демо-режим
// (используется в автономной демо-версии, где внешняя сеть недоступна).
export const isRemoteMode = () =>
  Boolean(SUPABASE_URL && SUPABASE_ANON_KEY) && !globalThis.NSL_LOCAL_DEMO
