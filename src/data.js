// Справочники и стартовые данные задачника Лиги нутрициологии (NSL)

// Отделы компании
export const DEPARTMENTS = [
  { id: 'bloggers', name: 'Отдел Блогеров', color: '#d946ef', icon: '🎬' },
  { id: 'curation', name: 'Отдел Курации', color: '#0284c7', icon: '🧑‍🏫' },
  { id: 'product', name: 'Отдел Продукта', color: '#1f8a4c', icon: '📦' },
  { id: 'sales', name: 'Отдел Продаж', color: '#ea580c', icon: '💼' },
  { id: 'smm', name: 'Отдел SMM', color: '#db2777', icon: '📣' },
  { id: 'finance', name: 'Отдел Финансов', color: '#475569', icon: '📊' },
  { id: 'tech', name: 'Отдел Технический', color: '#2563eb', icon: '🛠️' },
  { id: 'admin', name: 'Административный отдел', color: '#7c3aed', icon: '🏢' },
]

// Сотрудники
export const EMPLOYEES = [
  { id: 'u1', name: 'Анна Ковалёва', role: 'Руководитель отдела блогеров', dept: 'bloggers' },
  { id: 'u2', name: 'Дмитрий Орлов', role: 'Продакт-менеджер', dept: 'product' },
  { id: 'u3', name: 'Мария Соколова', role: 'Старший куратор', dept: 'curation' },
  { id: 'u4', name: 'Игорь Лебедев', role: 'Таргетолог', dept: 'smm' },
  { id: 'u5', name: 'Ольга Новикова', role: 'Менеджер по продажам', dept: 'sales' },
  { id: 'u6', name: 'Павел Морозов', role: 'SMM-специалист', dept: 'smm' },
  { id: 'u7', name: 'Екатерина Волкова', role: 'Администратор', dept: 'admin' },
  { id: 'u8', name: 'Сергей Зайцев', role: 'Разработчик', dept: 'tech' },
  { id: 'u9', name: 'Наталья Егорова', role: 'Офис-менеджер', dept: 'admin' },
  { id: 'u10', name: 'Виктор Белов', role: 'Финансовый менеджер', dept: 'finance' },
]

// Статусы (колонки Kanban)
export const STATUSES = [
  { id: 'backlog', name: 'Список задач', color: '#94a3b8' },
  { id: 'todo', name: 'К выполнению', color: '#64748b' },
  { id: 'in_progress', name: 'В работе', color: '#0284c7' },
  { id: 'review', name: 'На проверке', color: '#d97706' },
  { id: 'done', name: 'Готово', color: '#1f8a4c' },
]

// Приоритеты
export const PRIORITIES = [
  { id: 'low', name: 'Низкий', color: '#65a30d', weight: 1 },
  { id: 'medium', name: 'Средний', color: '#0284c7', weight: 2 },
  { id: 'high', name: 'Высокий', color: '#ea580c', weight: 3 },
  { id: 'urgent', name: 'Срочный', color: '#dc2626', weight: 4 },
]

// Хелперы для быстрого доступа
export const byId = (list, id) => list.find((x) => x.id === id)

const daysFromNow = (n) => {
  const d = new Date()
  d.setDate(d.getDate() + n)
  return d.toISOString().slice(0, 10)
}

// Стартовые задачи (пример наполнения)
export const SEED_TASKS = [
  {
    id: 't1',
    title: 'Согласовать интеграции с блогерами на сентябрь',
    description: 'Отобрать 5 блогеров-нутрициологов, согласовать ТЗ и даты выходов.',
    measure: '5 блогеров: ТЗ и даты выходов согласованы',
    relevance: 'Охват и заявки на осенний поток',
    dept: 'bloggers',
    assignee: 'u1',
    status: 'in_progress',
    priority: 'high',
    due: daysFromNow(5),
    createdAt: daysFromNow(-3),
    tags: ['интеграции', 'запуск'],
  },
  {
    id: 't2',
    title: 'Обновить программу курса «Нутрициолог PRO»',
    description: 'Актуализировать модули по микронутриентам согласно новым исследованиям.',
    measure: 'Все модули обновлены и утверждены методологом',
    relevance: 'Актуальность и качество продукта',
    dept: 'product',
    assignee: 'u2',
    status: 'review',
    priority: 'medium',
    due: daysFromNow(2),
    createdAt: daysFromNow(-10),
    tags: ['курс', 'методология'],
  },
  {
    id: 't3',
    title: 'Разобрать очередь обращений студентов',
    description: 'Закрыть более 40 открытых вопросов студентов за неделю.',
    measure: '40+ обращений закрыто, очередь = 0',
    relevance: 'Удержание и лояльность студентов',
    dept: 'curation',
    assignee: 'u3',
    status: 'todo',
    priority: 'urgent',
    due: daysFromNow(-1),
    createdAt: daysFromNow(-2),
    tags: ['студенты', 'обратная связь'],
  },
  {
    id: 't4',
    title: 'Настроить таргет к запуску осеннего потока',
    description: 'Подготовить креативы и запустить кампании во ВКонтакте и Telegram Ads.',
    measure: 'Кампании запущены, CPL ≤ 350 ₽',
    relevance: 'Заявки на осенний поток',
    dept: 'smm',
    assignee: 'u4',
    status: 'in_progress',
    priority: 'high',
    due: daysFromNow(7),
    createdAt: daysFromNow(-5),
    tags: ['реклама', 'таргет'],
  },
  {
    id: 't5',
    title: 'Серия постов «Мифы о питании»',
    description: '5 постов для Instagram и Telegram с разбором популярных заблуждений.',
    measure: '5 постов опубликовано по контент-плану',
    relevance: 'Прогрев аудитории к запуску',
    dept: 'smm',
    assignee: 'u6',
    status: 'todo',
    priority: 'medium',
    due: daysFromNow(4),
    createdAt: daysFromNow(-1),
    tags: ['контент', 'smm'],
  },
  {
    id: 't6',
    title: 'Обзвонить тёплую базу по осеннему потоку',
    description: 'Связаться с оставившими заявку и закрыть на консультацию.',
    measure: '100% базы обзвонено, 20+ консультаций назначено',
    relevance: 'Продажи осеннего потока',
    dept: 'sales',
    assignee: 'u5',
    status: 'in_progress',
    priority: 'high',
    due: daysFromNow(1),
    createdAt: daysFromNow(-2),
    tags: ['продажи'],
  },
  {
    id: 't7',
    title: 'Интеграция личного кабинета с оплатой',
    description: 'Подключить эквайринг и автоматическую выдачу доступа к курсу.',
    measure: 'Оплата работает, доступ выдаётся автоматически',
    relevance: 'Снижение ручной нагрузки и потерь оплат',
    dept: 'tech',
    assignee: 'u8',
    status: 'backlog',
    priority: 'medium',
    due: daysFromNow(14),
    createdAt: daysFromNow(-6),
    tags: ['платформа', 'оплата'],
  },
  {
    id: 't8',
    title: 'Нанять двух кураторов на новый поток',
    description: 'Провести собеседования и оформить оффер до старта обучения.',
    measure: '2 куратора приняли оффер',
    relevance: 'Обеспечить качество курации нового потока',
    dept: 'admin',
    assignee: 'u9',
    status: 'todo',
    priority: 'medium',
    due: daysFromNow(9),
    createdAt: daysFromNow(-4),
    tags: ['найм'],
  },
  {
    id: 't9',
    title: 'Свести финансовый отчёт за квартал',
    description: 'Подготовить P&L и отчёт по выручке потоков.',
    measure: 'P&L и отчёт по выручке переданы руководству',
    relevance: 'Прозрачность финансов для планирования',
    dept: 'finance',
    assignee: 'u10',
    status: 'done',
    priority: 'high',
    due: daysFromNow(-2),
    createdAt: daysFromNow(-15),
    tags: ['отчёт'],
  },
  {
    id: 't10',
    title: 'Проверить домашние задания 3-го модуля',
    description: 'Проверить и дать обратную связь по ДЗ группы А-12.',
    measure: '100% ДЗ группы А-12 проверено с обратной связью',
    relevance: 'Доходимость студентов до конца курса',
    dept: 'curation',
    assignee: 'u3',
    status: 'in_progress',
    priority: 'medium',
    due: daysFromNow(3),
    createdAt: daysFromNow(-1),
    tags: ['проверка дз'],
  },
]
