# Как открыть Moonlace в браузере по ссылке

Сейчас сайт только на вашем ПК. Чтобы заходить **просто по ссылке** (как на обычный сайт), его нужно **выложить в интернет** и при желании купить домен.

---

## Какая ссылка будет?

| Вариант | Ссылка | Цена |
|---------|--------|------|
| **Бесплатно** | `https://moonlace.vercel.app` | 0 ₽ |
| **Как название сайта** | `https://moonlace.com` или `https://moonlace.ru` | ~800–1500 ₽/год |

Имя **Moonlace** в URL = нужен домен `moonlace.com` / `moonlace.ru` (покупка на [Cloudflare](https://www.cloudflare.com/products/registrar/), [Reg.ru](https://www.reg.ru), [Namecheap](https://www.namecheap.com)).

---

## Быстрый бесплатный вариант (без домена)

Подойдёт, если нужна просто ссылка в браузере, без установки Node/Docker.

### Что понадобится (один раз, бесплатно)

1. Аккаунт **GitHub** — https://github.com  
2. Аккаунт **Vercel** — https://vercel.com (вход через GitHub)  
3. Аккаунт **Render** — https://render.com (для API)  
4. База **Neon** — https://neon.tech (PostgreSQL, бесплатно)  
5. **Upstash** — https://upstash.com (Redis, бесплатно)

### Шаг 1 — код на GitHub

```powershell
cd C:\Users\zxckatori\Desktop\Moonlace2
git init
git add .
git commit -m "Moonlace initial"
```

Создайте репозиторий на GitHub и выполните `git push`.

### Шаг 2 — база данных (Neon)

1. Создайте проект на neon.tech  
2. Скопируйте **Connection string** → это `DATABASE_URL`

На своём ПК (нужен Node.js один раз для seed):

```powershell
npm install
$env:DATABASE_URL="ваша_строка_из_neon"
npm run db:push
npm run db:seed
```

### Шаг 3 — API на Render

1. New → **Web Service** → подключите GitHub-репозиторий  
2. **Root Directory:** оставьте корень  
3. **Build Command:** `npm install && npm run db:generate && npm run build -w @moonlace/api`  
4. **Start Command:** `npm run start -w @moonlace/api`  
5. **Environment variables:**

| Переменная | Значение |
|------------|----------|
| `DATABASE_URL` | из Neon |
| `REDIS_URL` | из Upstash |
| `JWT_SECRET` | длинная случайная строка |
| `JWT_REFRESH_SECRET` | другая длинная строка |
| `WEB_URL` | `https://moonlace.vercel.app` (обновите после шага 4) |
| `S3_ENDPOINT` | можно позже / MinIO на Render |

6. После деплоя скопируйте URL API, например: `https://moonlace-api.onrender.com`

### Шаг 4 — сайт на Vercel

1. https://vercel.com → Add Project → ваш репозиторий  
2. **Root Directory:** `apps/web`  
3. **Environment variables:**

| Переменная | Значение |
|------------|----------|
| `API_URL` | `https://moonlace-api.onrender.com` |
| `NEXT_PUBLIC_API_URL` | `https://moonlace-api.onrender.com` |
| `NEXT_PUBLIC_WS_URL` | `https://moonlace-api.onrender.com` |

4. Deploy → ссылка будет вида `https://moonlace-xxx.vercel.app`

5. В Render обновите `WEB_URL` на финальный URL Vercel.

### Шаг 5 — открыть в браузере

Перейдите по ссылке из Vercel. Вход: `admin` / `moonlace123` (если делали seed).

---

## Домен moonlace.com (ссылка = название сайта)

1. Купите домен **moonlace.com** или **moonlace.ru**  
2. В **Vercel** → Project → Settings → Domains → добавьте `moonlace.com`  
3. У регистратора домена укажите DNS из Vercel (инструкция покажется в Vercel)  
4. Для API: поддомен `api.moonlace.com` → Render (CNAME)  
5. Обновите переменные:
   - `WEB_URL` = `https://moonlace.com`
   - `NEXT_PUBLIC_API_URL` = `https://api.moonlace.com`

Итог: сайт — **https://moonlace.com**, API — **https://api.moonlace.com**

---

## Без скачивания на ПК — итог

| Действие | Нужно скачивать? |
|----------|------------------|
| Заходить по ссылке после деплоя | **Нет** — только браузер |
| Один раз выложить сайт | Да — аккаунты + (для seed) Node один раз |
| Домен moonlace.com | Покупка домена (~800+ ₽/год) |

---

## Помощь

Если хотите, чтобы я настроил деплой под ваш GitHub — напишите, есть ли уже аккаунты Vercel/GitHub, и какой домен хотите: бесплатный `*.vercel.app` или `moonlace.com`.
