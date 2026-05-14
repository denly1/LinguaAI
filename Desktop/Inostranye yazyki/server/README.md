# Backend для LinguaAI

Бекенд отвечает за:
- отправку email-чеков при покупке курсов (Mail.ru SMTP);
- прокси к чат-сервису для раздела Тьютор.

## Установка

```bash
cd server
npm install
```

## Переменные окружения

Скопируйте `.env.example` в `.env` и заполните:

```
OPENROUTER_API_KEY=sk-or-v1-...
OPENROUTER_MODEL=openai/gpt-4o-mini
PORT=3001
APP_URL=http://localhost:3000
```

## Запуск

```bash
npm start
```

Сервер запустится на `http://localhost:3001`.

## API

| Метод | Путь                | Описание                                   |
|-------|---------------------|--------------------------------------------|
| GET   | `/api/health`       | Проверка доступности + текущая модель AI   |
| POST  | `/api/send-receipt` | Отправка email-чека о покупке курса        |
| POST  | `/api/ai-chat`      | Прокси к чат-сервису для раздела Тьютор    |

### `/api/ai-chat` — тело запроса

```json
{
  "messages": [
    { "role": "system",    "content": "..." },
    { "role": "user",      "content": "..." }
  ],
  "temperature": 0.7,
  "maxTokens": 1024,
  "model": "openai/gpt-4o-mini"
}
```

### SMTP (Mail.ru)

- Host: smtp.mail.ru
- Port: 465
- Email и пароль приложения настраиваются в `emailService.js`.

**ВАЖНО:** фронтенд должен быть запущен одновременно с бекендом (`npm start` в корне и в `server/`).
