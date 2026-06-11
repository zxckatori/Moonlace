# Moonlace

Форум + лента активности в эстетике Synthwave / Darkwave.

## Стек

- **Frontend:** Next.js 15 (App Router)
- **API:** Fastify + Socket.io
- **DB:** PostgreSQL + Prisma
- **Cache:** Redis
- **Media:** MinIO (S3-compatible)

## Открыть в браузере по ссылке (бесплатно)

**Пошаговая инструкция:** **[FREE-DEPLOY.md](./FREE-DEPLOY.md)**

Итог: `https://moonlace.vercel.app` — без установки Node/Docker на ПК.

Платный домен `moonlace.com` можно подключить позже (см. [DEPLOY.md](./DEPLOY.md)).

---

## Быстрый старт (локально на ПК)

### 1. Инфраструктура

```bash
docker compose up -d
cp .env.example .env
```

### 2. Установка

```bash
npm install
npm run db:push
npm run db:seed
```

### 3. Запуск

```bash
npm run dev
```

- Web: http://localhost:3000
- API: http://localhost:4000
- MinIO Console: http://localhost:9001 (moonlace / moonlace123)

### Тестовый аккаунт (после seed)

- Логин: `admin`
- Пароль: `moonlace123`

## Категории форума

| Slug | Название |
|------|----------|
| synthwave | Synthwave |
| darkwave | Darkwave |
| anime | Anime |
| music | Music |
| tech | Tech |
| offtopic | Offtopic |

## Структура

```
apps/web     — Next.js frontend
apps/api     — Fastify API + WebSocket
packages/db  — Prisma schema + seed
packages/shared — Zod validators
```

## Production

1. Замените секреты в `.env`
2. Используйте managed PostgreSQL, Redis, S3/R2
3. `npm run build && npm start` в каждом app
4. Настройте reverse proxy (nginx) для web + api
