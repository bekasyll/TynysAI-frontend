# TynysAI Frontend

Веб-интерфейс для медицинской диагностической системы **TynysAI**: пациенты загружают рентген-снимки и получают AI-диагностику, врачи валидируют результаты и формируют отчёты, администраторы управляют пользователями и одобряют врачей.

Бэкенд: 5 микросервисов на Spring Boot за Spring Cloud Gateway, Keycloak для авторизации, Python/FastAPI ai-service для инференса.

## Технологии

- **React 18** + **TypeScript** + **Vite**
- **Tailwind CSS**
- **React Query v5** - серверное состояние / кэш
- **Zustand** - клиентский стор (auth)
- **React Hook Form** - формы и валидация
- **Axios** + interceptors (Bearer-токен, refresh, глобальный 4xx/5xx тост)
- **keycloak-js** + ручной ROPG-flow в `src/lib/keycloak.ts`
- **i18next** - RU / KK / EN, плоский namespace
- **lucide-react**, **date-fns**, **react-image-crop**

## Структура

```
src/
├── api/                # axios-клиенты по сервисам (admin, users, doctors, patients,
│                       #   xrays, appointments, medical-records, notifications, auth)
├── assets/             # статика (логотип)
├── components/
│   ├── auth/           # PatientFields, DoctorFields, cleanPatient/cleanDoctor
│   ├── layout/         # MainLayout, Sidebar
│   ├── profile/        # AccountTab, PasswordTab (общие для пациента и врача)
│   └── ui/             # Button, Card, Modal, Pagination, EmptyState, Toast,
│                       #   AvatarUpload, Badge, Spinner, FileUploadZone, ConfidenceBar
├── hooks/
│   ├── useApiMutation.ts        # обёртка useMutation с дефолтным error-toast
│   ├── usePagedQuery.ts         # useState page + useQuery + Pagination в одном
│   ├── useXrayAutoRefresh.ts    # refetchInterval=3000 пока есть PENDING/PROCESSING
│   └── useDateLocale.ts
├── lib/                # api-error helper, keycloak ROPG/refresh клиент
├── locales/            # ru.json / kk.json / en.json
├── pages/
│   ├── admin/
│   │   ├── UsersPage.tsx        # оркестратор
│   │   └── users/               # UsersTable, UsersFilters, UserActionMenu,
│   │                            #   ResetPasswordDialog, CreateUserDialog
│   ├── auth/           # LoginPage, RegisterPage
│   ├── common/         # NotificationsPage
│   ├── doctor/         # дашборд, пациенты, ai-анализ, отчёты, приёмы, профиль
│   └── patient/        # дашборд, снимки, отчёты, лаб-результаты, врачи, приёмы, профиль
├── store/              # auth.store (Zustand): user, tokens, avatar blob URL
├── types/              # shared TS types (PageResponse, UserResponse, enums и т.д.)
├── App.tsx             # роуты + RoleRoute
└── main.tsx            # точка входа, ToastProvider, QueryClient, i18n init
```

## Требования

- Node.js 20+
- Запущенный TynysAI-бэкенд. Vite-dev проксирует `/api` на gateway - порт `8072`.

## Запуск

```bash
npm install
npm run dev          # http://localhost:3000, hot-reload
npm run build        # tsc + vite build → dist/
npm run preview      # отдать собранный dist на :4173
```

`vite.config.ts` уже содержит `proxy: { '/api': 'http://localhost:8072' }` - менять не нужно, если бэк локальный. Для другого хоста переопредели через `VITE_API_BASE_URL` (см. `src/api/client.ts`).

## Авторизация

Логин идёт **не** через keycloak hosted UI, а кастомным флоу: форма в `LoginPage` → POST `/realms/tynysai/protocol/openid-connect/token` (Direct Access Grants) → токены сохраняются в localStorage (`tynysai.kc.tokens`) → `axios` интерсептор автоматически рефрешит истёкший access-token до запроса.

Роли (`PATIENT` / `DOCTOR` / `ADMIN`) читаются из claim'а `realm_access.roles` через `KeycloakJwtAuthenticationConverter` на бэке и отражаются на UI через `RoleRoute` в `App.tsx`.

## Возможности по ролям

**Пациент.** Загрузка рентген-снимков → автоматический AI-анализ (poll 3s до завершения) → просмотр диагнозов и conf-уровня. Запись на приём (календарь + таймслоты). Лаб-результаты от врача. Отчёты от врача. Профиль с медицинской картой + сменой пароля.

**Врач.** Назначенные снимки (бейдж непрочитанных, авто-обновление до COMPLETED). Валидация: согласие/правка AI-диагноза + комментарий → отправка пациенту. Создание отчёта по приёму со ссылками на анализ + лаб-результат. Добавление лаб-результатов пациентам. Список «своих» пациентов (по факту - все пациенты, у которых был приём). Профессиональный профиль (специализация, лицензия и т.д.).

**Админ.** Дашборд статистики. Список пользователей с поиском + фильтром по роли. Per-row меню: блок/разблок, сброс пароля (с опцией «временный»), отправка письма-подтверждения email, завершение всех сессий, удаление. Создание пациента / врача (admin-only флоу: email уже подтверждён, врач сразу одобрен). Очередь заявок врачей на одобрение. Просмотр всех снимков и всех отчётов.

## Сборка production

`npm run build` запускает `tsc --noEmit` (типчек) → `vite build`. Артефакт - `dist/index.html` + один JS-чанк (~670 kB / ~190 kB gzip) + CSS.

Серверная отдача - `Dockerfile` в корне (multi-stage: Node + nginx). Для деплоя:

```bash
docker build -t tynysai-frontend .
docker run -p 80:80 tynysai-frontend
```

## i18n

Три словаря в `src/locales/`. Ключи плоские с точечной нотацией: `admin.users_empty`, `disease.BACTERIAL_PNEUMONIA`. Бэкенд может прислать enum-код в notification params - фронт сам подменяет на локализованную строку через `localizeParams` в `NotificationsPage.tsx`.

Inline-fallback'ов вида `t('key', 'fallback')` нет - все ключи должны быть в `ru.json` (эталон). При добавлении новой строки сначала вписывай ключ во все три локали, потом используй `t()`.

## Convenience hooks

- `usePagedQuery(['key'], (p) => api.list(p).then(r => r.data.data!))` - заменяет `useState page + useQuery + ручной Pagination`.
- `useApiMutation(fn, { successMessage, errorMessage })` - заменяет `useMutation + onError: error(getApiError(e) ?? t('common.error'))`.
- `useXrayAutoRefresh.xrayDetailRefetch / xrayPagedRefetch` - `refetchInterval` для x-ray пока статус `PENDING|PROCESSING`.
