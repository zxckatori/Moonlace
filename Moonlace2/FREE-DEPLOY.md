# Moonlace — бесплатный деплой (открыть в браузере)

Итоговая ссылка: **`https://moonlace.vercel.app`** (или похожая — зависит от имени проекта в Vercel).

Ничего не ставите на ПК — только браузер и бесплатные аккаунты.

---

## Что понадобится (~30 минут, один раз)

| Сервис | Зачем | Ссылка |
|--------|-------|--------|
| GitHub | хранить код | https://github.com |
| Vercel | сайт (браузер) | https://vercel.com |
| Render | API (сервер) | https://render.com |
| Neon | база данных | https://neon.tech |
| Upstash | Redis (сессии) | https://upstash.com |

Все бесплатные тарифы.

---

## Шаг 1 — GitHub

1. Зайдите на https://github.com → **Sign up**
2. **New repository** → имя: `moonlace` → Public → Create
3. На странице репозитория скопируйте команды **push an existing repository**

На своём ПК в PowerShell (нужен только **Git**, не Node):

```powershell
cd C:\Users\zxckatori\Desktop\Moonlace2
git init
git add .
git commit -m "Moonlace"
git branch -M main
git remote add origin https://github.com/ВАШ_ЛОГИН/moonlace.git
git push -u origin main
```

> Git для Windows: https://git-scm.com/download/win

---

## Шаг 2 — База данных (Neon)

1. https://neon.tech → Sign up → **New Project** → имя `moonlace`
2. Скопируйте **Connection string** (PostgreSQL), например:
   ```
   postgresql://user:pass@ep-xxx.region.aws.neon.tech/neondb?sslmode=require
   ```
3. Сохраните — это `DATABASE_URL`

---

## Шаг 3 — Redis (Upstash)

1. https://upstash.com → Sign up → **Create Database** → Regional
2. Скопируйте **Redis URL** (начинается с `rediss://`)
3. Сохраните — это `REDIS_URL`

---

## Шаг 4 — API на Render

1. https://dashboard.render.com → Sign up (через GitHub)
2. **New +** → **Blueprint** → подключите репозиторий `moonlace`
3. Render найдёт `render.yaml` — **Apply**
4. Вручную заполните переменные (Environment):

| Переменная | Значение |
|------------|----------|
| `DATABASE_URL` | строка из Neon |
| `REDIS_URL` | строка из Upstash |
| `WEB_URL` | пока `https://moonlace.vercel.app` (обновите после шага 5) |

5. Дождитесь деплоя (5–10 мин). Скопируйте URL API, например:
   ```
   https://moonlace-api.onrender.com
   ```

Проверка: откройте `https://ВАШ-API.onrender.com/v1/health` — должно быть `{"ok":true}`

---

## Шаг 5 — Сайт на Vercel

1. https://vercel.com → Sign up (через GitHub)
2. **Add New → Project** → выберите репозиторий `moonlace`
3. Настройки:
   - **Project Name:** `moonlace` ← ссылка будет `moonlace.vercel.app`
   - **Root Directory:** `apps/web` (важно!)
   - **Framework Preset:** Next.js

4. **Environment Variables:**

| Имя | Значение |
|-----|----------|
| `API_URL` | `https://moonlace-api.onrender.com` (ваш URL из Render) |
| `NEXT_PUBLIC_API_URL` | то же самое |
| `NEXT_PUBLIC_WS_URL` | то же самое |

5. **Deploy**

6. Вернитесь в **Render** → Environment → обновите `WEB_URL` на ваш реальный URL Vercel (например `https://moonlace.vercel.app`)

---

## Шаг 6 — Откройте в браузере!

Перейдите по ссылке из Vercel:

### https://moonlace.vercel.app

**Вход:**
- Логин: `admin`
- Пароль: `moonlace123`

Или зарегистрируйтесь на `/register`.

---

## Позже — платный домен moonlace.com

Vercel → Project → **Settings → Domains** → добавьте `moonlace.com`.  
Старый адрес `moonlace.vercel.app` продолжит работать.

---

## Частые проблемы

| Проблема | Решение |
|----------|---------|
| Сайт открывается, но ошибки при входе | Проверьте `WEB_URL` в Render = точный URL Vercel |
| API не отвечает | Render free «засыпает» — подождите 30 сек после первого запроса |
| Загрузка аватаров не работает | Нужен S3 (Cloudflare R2) — опционально, см. DEPLOY.md |
| Нет Git на ПК | Установите https://git-scm.com/download/win |

---

## Чеклист

- [ ] Код на GitHub
- [ ] Neon: DATABASE_URL
- [ ] Upstash: REDIS_URL
- [ ] Render: API задеплоен, /v1/health OK
- [ ] Vercel: проект `moonlace`, переменные API
- [ ] WEB_URL в Render обновлён
- [ ] Сайт открывается в браузере
