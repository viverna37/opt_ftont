# opt_catalog_app — фронт «ОптКаталога»

Telegram Mini App каталога для оптовиков. Бэкенд — `~/PycharmProjects/opt_catalog_db_service`
(его `CLAUDE.md` — бизнес-правила, `opt_promt.md` — ТЗ). Структура и подход повторяют
`raxi_app` (такси): React 19 + Vite + react-router 7 + framer-motion, CSS на экран,
без стейт-менеджеров и query-библиотек.

## Устройство

- Мини-апп открывается ботом оптовика по `/t/{slug}`. `app/TenantRoot` → `SessionProvider`
  (API-клиент с `X-Tenant` + `/v1/me`) → гейт по `me.access`: `age_required` (экран 18+,
  одна кнопка) / `pending` (ожидайте подтверждения) / `blocked` / `ok`.
- Сотрудник (`me.is_staff`) по умолчанию попадает в `/admin`, переключатель «Открыть
  витрину» ↔ «Админка» запоминается в localStorage (`shared/local/storage.ts`).
- Пути `/t/{slug}/cart`, `/orders`, `/admin/orders/{id}` — те же, что бэкенд кладёт в
  кнопки «Открыть» под уведомлениями бота. Не переименовывать без правки бэкенда.
- **Деньги фронт не считает.** Цены, уровни, итоги корзины — из ответа API
  (`services/pricing.py` на бэкенде). Фронт только подсвечивает текущий уровень на карточке.
- Корзина — `shared/cart/CartProvider.tsx`: оптимистичный степпер, PUT с итоговым
  количеством после debounce 450 мс (ручка идемпотентная).
- Главное действие экрана — `MainAction`: в Telegram нативная MainButton, в браузере —
  такая же панель на странице.
- Ошибки API несут `code` (`ApiError.code`) — по нему решаем, что показать.
- Формулировки: «заявка», «отправить менеджеру». Никаких «купить/оплатить/оформить заказ».

## Дизайн

Тёмная тема из макетов (Design-артефакт «Вейп-опт: каталог мини-апп»), токены —
`shared/styles/tokens.css`. Акцент перекрашивается цветом тенанта (`format/branding.ts`).
Шрифты Unbounded / Manrope / JetBrains Mono. Иконки — stroke SVG в `shared/ui/icons`.
Макеты старше ТЗ: анкета при входе, «Избранное» и таб «Менеджер» из них сознательно не
сделаны — по ТЗ вход без форм, таб-бары Каталог/Корзина/Заявки и Заявки/Товары/Клиенты/Настройки.

## Запуск

```bash
npm install
npm run dev          # .env: VITE_API_URL, VITE_DEV_TG_USER_ID (бэкенд с DEV_AUTH=true)
```

В браузере: `http://localhost:5173/t/demo` (или `VITE_DEV_TENANT=demo` и просто `/`).
Смотреть другим пользователем — `?dev_user=42` (только dev-сборка). Для теста в Telegram —
туннель (cloudflared/ngrok) на 5173 и этот адрес в `WEBAPP_BASE_URL` бэкенда / кнопке бота.

`npm run lint`, `npm run build` — обязательно перед коммитом.
