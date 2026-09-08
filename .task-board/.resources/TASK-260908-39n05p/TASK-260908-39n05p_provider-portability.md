# Переносимость провайдеров, подписок и учётных записей в Apiary

Дата проверки: **8 сентября 2026, Asia/Tbilisi** (получение исходников началось 7 сентября в 23:06 UTC). Задача: **TASK-260908-39n05p — provider-auth-portability**, STORY-260908-206cjt. Исследование и предложение архитектуры; реализация и проверка пользовательских аккаунтов не выполнялись.

## 1. Главный результат

**Базовый режим Apiary — собственный минимальный Go-цикл над официальными inference API. Подписка не является универсальным способом оплаты этого цикла.** Нужно различать API модели, право конкретного владельца пользоваться сервисом, способ оплаты и возможность делегировать задачу чужому агентному runtime.

Практические решения:

1. Ввести отдельные границы `ModelPort` для inference и `AgentBridge` для официального полного агента. Не реализовывать bridge как фиктивную completion-функцию.
2. Держать provider authentication на машине владельца учётной записи, вне model-visible tool-skills. Orchestrator получает только несекретные сведения о допуске и расходе; не получает ключи, OAuth tokens или домашний каталог провайдера.
3. Worker получает один центральный типизированный tool-skill, при необходимости отдельную узкую операцию подписи. Orchestrator использует тот же kernel с установленными Curator tool-skills управления проектом, связи и sandbox. MCP существует только в отдельных установленных Curator wrappers.
4. Поддержку объявлять для сочетания **провайдер × продукт × протокол × версия адаптера × область аккаунта × сценарий**, а не для логотипа или строки model ID.
5. При запрете или неизвестной допустимости подписки сохранять direct API как полноценный путь. Не извлекать чужие tokens, не подменять идентичность клиента, не переносить ограничения подписки на новые аккаунты.

Обозначения ниже: **Н** — наблюдение в прочитанной официальной документации или исходнике; **В** — вывод из наблюдений; **П** — предлагаемая конструкция Apiary, ещё не реализованная и не испытанная. Слова «поддерживаемый API» означают подтверждённую поверхность поставщика, **не наличие работающего адаптера Apiary**.

## 2. Матрица допуска

Статусы: **A — supported direct API**; **B — official supported integration**, только в описанных пределах; **C — conditional agreement**, требуется соответствие условиям/договору либо уточнение конкретного сценария; **D — unavailable** для заявленного режима. `unknown` — причина не включать маршрут, а не доказательство абсолютного запрета. Все строки датированы 2026-09-08; регион, организационные ограничения и действующее соглашение владельца проверяются отдельно.

| Поставщик и продукт | Техническая поверхность и идентичность | Допуск и оплата | Последствие для Apiary |
|---|---|---|---|
| OpenAI API | Responses и function calling; API identity отдельно от ChatGPT login | **A**. Usage-based API account; подписочный login не заменяет API credential. [O1][O2] | Основной `ModelPort`; tools — только предоставленные функции, без включения hosted tools по умолчанию |
| Codex / ChatGPT login | Официальный app-server: threads, turns, события, управляемый Codex login; `dynamicTools` экспериментален | **B** для интеграции с Codex; это полный агент. **D/unknown** для произвольного raw inference посредством подписочного token: прочитанная документация app-server этого права не устанавливает. [O1][O3] | Отдельный `AgentBridge`; account ownership сохраняется у Codex. Не обещать строгую эквивалентность worker |
| Anthropic Messages API | API keys с identity/workspace scope; доступна WIF; legacy workspace keys отдельно | **A**, отдельный API billing и поддерживаемые cloud routes. [A1] | Отдельный Messages codec и credential binding к workspace; тип OAuth сам по себе не означает consumer subscription |
| Claude subscription + Claude Code / Agent SDK | SDK управляет Claude Code agent loop; собственный пользователь может входить в неизменённый бинарник | **B/C** для официального полного агента с условиями размещения; **D** для посредничества в consumer credentials и предложения своего claude.ai login без разрешения. [A2][A3][A4] | Не пересылать подписочные credentials в kernel. Hosted deployment требует проверки условий; direct Messages остаётся baseline |
| Gemini Developer API | Официальная API identity, Cloud project; новый auth key привязан к service account | **A**. Отдельные project billing/quota. Документ объявляет переход со standard keys в сентябре 2026, без точного дня. [G1] | Тип credential и состояние миграции входят в admission; не считать старый key работоспособным по формату |
| Vertex AI / актуальный Google Cloud model service | ADC/workload identity, project/location; Cloud documentation сейчас перенаправляет Vertex URL в Gemini Enterprise Agent Platform | **A** при IAM, включённом сервисе, доступной модели и биллинге проекта. [G2] | Отдельный account/project/region binding; не смешивать с Google AI Pro/Ultra |
| Gemini CLI Google login / Code Assist / AI Pro, Ultra | Официальный CLI имеет собственный Code Assist путь | **B** для предусмотренного использования CLI. **D** для прямого доступа стороннего ПО к backend CLI через CLI OAuth: официальный запрет явный. [G3][G4] | Не делать такой OAuth `ModelPort`. Полный CLI bridge возможен лишь в отдельно подтверждённом режиме; запрет прямого backend доступа не обходить wrapper-ом |
| AWS Bedrock | Converse/ConverseStream, model-specific invocation; IAM/SigV4 либо предусмотренные Bedrock API keys | **A**, AWS billing, regional/model eligibility, Marketplace и дополнительные условия отдельных моделей. [B1][B2][B3] | AWS identity не API key Anthropic; route включает region/model или inference profile. Не смешивать Converse, Mantle и AgentCore |
| Azure OpenAI / Microsoft Foundry | Deployed model, resource endpoint, API key или Entra ID; Responses v1 | **A** при deployment/RBAC/region. [Z1] | Deployment ID и API family обязательны; подписка Microsoft 365/Copilot не установлена как источник этого доступа — **unknown**, не предлагать |
| OpenRouter | API gateway с отдельным ключом, выбором upstream и параметров маршрутизации | **A**. Биллинг gateway/BYOK и upstream policy не равны consumer subscriptions. [R1][R2][R3] | Учитывать фактический upstream, разрешённые параметры и data policy. Gateway не снимает entitlement проверку |
| DeepSeek API | Официально документированы OpenAI- и Anthropic-compatible API, streaming и tools | **A** по API account. Consumer subscription для универсального inference не подтверждена — **unknown**. [D1][D2] | Отдельные codecs/профили совместимости; beta strict не делать универсальным обещанием |
| Qwen / DashScope PAYG | Model Studio API, региональный key; OpenAI-compatible interface | **A** после активации и регионального допуска. [Q1] | Связывать key с region/workspace endpoint. Совместимость формата не переносит семантику всех OpenAI функций |
| Alibaba Coding Plan | Специальный подписочный API продукт для coding tools | **B** для разрешённого интерактивного coding; **D** для automated scripts, backends и non-interactive batch по текущему FAQ. [Q2] | Не использовать как скрытое питание headless swarm. Не путать с Token Plan |
| Alibaba Token Plan | Отдельный продукт, OpenAI/Anthropic-compatible key, Personal/Team, Credits | **B** для документированной интеграции tools; **C/unknown** для автономного backend Apiary из-за расхождения официальных страниц. [Q3][Q4] | До уточнения сценария — PAYG. Не приписывать новому продукту старые квоты или запреты без проверки |
| Moonshot / Kimi Open Platform | API для интеграции в продукты, API account/key | **A**. Отдельный PAYG продукт. [K1][K2] | Основной Kimi `ModelPort`; endpoint/регион/договор фиксировать явно |
| Kimi Code membership | Официальный CLI OAuth; сторонние/self-built coding tools подключаются через специально выданный API key, OpenAI/Anthropic-compatible | **B** для заявленных coding-сценариев; **C** для перепродажи/общего backend за пределами этих сценариев. Сохранять реальную идентичность клиента. [K3][K4] | В отличие от Claude bridge, подписочный key здесь документирован как inference-интерфейс. Это не разрешение переиспользовать CLI OAuth |
| Ollama, локальные OpenAI-compatible endpoints | Локальный Ollama API без обязательного auth; удалённый/cloud путь отдельный | **A** для проверенного собственного endpoint и лицензированного deployment; не универсальное право на любые weights. [L1][L2] | Capability probing, loopback/egress policy, model digest; cloud model за localhost не считать локальным исполнением |

### 2.1. Изменчивые и конфликтующие документы

**Claude.** [A4] содержит актуальное уведомление от 15 июня: изменение Agent SDK billing приостановлено, расход пока остаётся в subscription limits; ниже сохранена **не вступившая в силу** таблица кредитов. Она не используется для расчётов. [A2] одновременно разрешает пользователю входить в неизменённый hosted Claude Code при соблюдении условий и запрещает стороннее посредничество в credentials. [A3] сохраняет формулировку о предварительном одобрении собственного claude.ai login. **В:** индивидуальная автоматизация через официальный harness и свой OAuth backend — разные случаи; API key baseline снимает зависимость от этой границы.

**Alibaba.** Справочник Token Plan обновлён 7 сентября 2026: описывает self-developed protocol-compatible tools, Personal/Team и независимость Coding Plan. Официальный августовский блог запрещает automated backend, а также описывает другие окна и правила подписок. **В:** свежая справка подтверждает совместимость, но умолчание о backend не отменяет явно опубликованное ограничение. Нужна проверка условий приобретённой редакции/письменное уточнение поставщика, если продукт хочет именно такой режим; исследование не блокируется, поскольку PAYG достаточен.

**Kimi.** Membership guide разрешает API key для self-built tools и general agent frameworks, но сравнение продуктов адресует собственные продукты и enterprise calls в Open Platform. **В:** developer coding worker соответствует гораздо более узкому сценарию, чем коммерческий inference broker; последнее разрешение не установлено. OAuth-ветка найденного open-source адаптера не расширяет опубликованный API-key путь.

## 3. Что действительно показали исходники

Это целевая выборка Pi и OpenCode как двух многопровайдерных runtime, официального Go SDK и двух официальных агентных интеграций. Популярность и исчерпывающее покрытие рынка не измерялись. Загруженный код **не исполнялся**. Точные SHA, пути, символы и hashes — в [реестре доказательств](TASK-260908-39n05p_provider-portability-evidence.md).

| Прочитанный участок | Наблюдение | Вывод для проекта; что не доказано |
|---|---|---|
| Pi `openaiProvider`, `kimiCodingProvider`, `ProviderRequestOptions`, `ProviderStreams` | Factory связывает product ID, auth, catalog и protocol implementation; разные продукты используют один wire family | Разделение product/codec полезно. Совместная структура не означает переносимость секретов или entitlement |
| Pi `transformMessages` | Сопоставляет provider/api/model; сохраняет same-model signatures, удаляет redacted blocks при переносе, меняет tool IDs; вставляет synthetic error results для orphan calls; пропускает error/aborted assistant turns | Нужны provenance и явный export boundary. Для Apiary synthetic error может быть только записью runtime о неизвестном результате, никогда execution receipt |
| Pi `openai-completions.ts::stream` | Собирает partial tool args и reasoning details; при ожидаемом, но отсутствующем finish reason выдаёт ошибку. Есть compatibility branch для провайдеров без finish reason | EOF нельзя универсально принимать за успех. Для строгого профиля такие exceptions требуют отдельной проверяемой terminal semantics |
| Pi `AssistantMessageEventStream` | Отдельные `done`/`error` и асинхронная очередь | Общая event-модель возможна; bounded memory/backpressure и crash durability из этого участка не доказаны |
| OpenCode `normalizeMessages`, `applyCaching`, `schema` | Provider-specific sanitation, cache options, преобразование схем; OpenAI lowering теряет часть JSON Schema constraints | Kernel должен сохранять каноническую схему и валидировать её до execution. Lossy wire schema не становится источником полномочий |
| OpenCode `session/llm.ts`, вызов `streamText` | Реальный integration call передаёт prepared tools, activeTools, provider options, transform middleware; `maxRetries` задаётся явно | Это используемый inference путь, не только мёртвый helper. Полнота всех provider branches и end-to-end behavior не проверены |
| OpenAI Go `ResponseService.NewStreaming`, `Stream.Next/Err`, `shouldRetry` | Typed request и stream union; stream error заканчивает чтение; HTTP retry зависит от replayable body и класса ответа | SDK подходит внутрь Go adapter, но не заменяет транзакционный журнал tool effects и не обеспечивает exactly-once |
| Gemini CLI `createContentGenerator` | `LOGIN_WITH_GOOGLE`/`COMPUTE_ADC` выбирают Code Assist generator, API/Vertex/Gateway — другой путь | Нельзя выводить сервис/оплату из одного слова OAuth или из наличия ADC. Официальный запрет стороннего прямого CLI backend доступа остаётся независимым |
| Claude Python SDK `ClaudeAgentOptions`, `SubprocessCLITransport` | `tools=[]` и `allowed_tools` имеют разные назначения; strict MCP есть; transport формирует CLI arguments, наследует process environment с исключением одной переменной | Это subprocess bridge, которому нужны отдельные boundaries. Environment по умолчанию не является безопасным контейнером для нескольких владельцев |
| Codex `build_tool_router`, `add_core_tool_sources` | Core tools добавляются отдельно; затем MCP, extensions, dynamic tools и hosted specs | `dynamicTools=[central]` — добавление, а не доказанное обнуление остальных источников. Внутренние special session branches не являются публичным режимом Apiary |

**Ограничение lineage:** комментарий OpenCode утверждает сходство schema lowering с Codex. Мы фиксируем только реально прочитанную функцию; происхождение, историю переноса и поведенческую эквивалентность не утверждаем.

## 4. Raw inference и полный агент: разные контракты

### 4.1. Базовый `ModelPort` — предложение

Минимальные операции: `Describe(binding)`, `Generate(context, request) -> EventStream`, `Cancel(attempt)`; `Resume(cursor)` — только optional capability. Не добавлять agent planning, filesystem, shell, MCP discovery, account login или task acceptance в этот интерфейс.

`GenerateRequest` содержит model/deployment, adapter revision, typed messages, canonical tool definitions, output budget, выбранные возможности и несекретный `BindingRef`. Runtime не передаёт secrets через request, который может попасть в trace. HTTP transport получает credential через локальную приватную связь с credential service. Go SDK types не выходят из adapter package; SDK pin и wire version входят в manifest.

`AgentBridge` принимает **делегированную задачу**, отдельные upstream session handles, constraints и callbacks; возвращает события агента и артефакты. Он не обещает количество внутренних completions, идентичный prompt, отсутствие встроенных действий или тот же context compaction. Его расходы и журнал помечаются `delegated-agent`, а не `kernel-inference`.

### 4.2. Можно ли оставить bridge только центральный tool?

| Проверка | Codex app-server | Claude Agent SDK | Gemini CLI |
|---|---|---|---|
| Есть официальный full-agent interface | Да: threads/turns, approvals, auth [O3] | Да: SDK/CLI, session и tools [A3] | Официальная CLI authentication описана в [G4]; headless/IDE bridge contract здесь не обследован |
| Можно передать центральную функцию | `dynamicTools` + `item/tool/call`, экспериментально [O3] | Custom MCP tool; только во внешнем Curator wrapper [A3] | Возможный внешний tool bridge требует отдельной проверки; не утверждается как проверенный путь |
| Allowlist достаточно для исключения остальных tools | Нет: прочитанный router композитный | Нет: `allowed_tools` только auto-approval; `tools=[]` отдельно | Не установлено |
| Доказано отсутствие локальных/hosted effects | Нет. Sandbox и tool configuration уменьшают доступ, но app-server остаётся полноценным процессом | Нет. Возможность отключить builtins не отключает все служебные I/O, settings/plugins/hooks и provider-side effects | Нет |
| Рекомендуемый статус строгого worker | Не допускать как эквивалент `ModelPort` без отдельного conformance/изоляции | То же; legal deployment constraints проверяются отдельно | Direct API baseline; CLI backend OAuth не использовать |

**П:** допустимый compatibility mode запускает неизменённый официальный binary в отдельном пользовательском security domain. Обязательны отдельный state root, минимальное окружение, закрытые project/home imports, запрет неожиданных extensions/hooks/MCP и provider-hosted tools, независимый egress/filesystem/process контроль. Настройки устанавливаются только публичными поддерживаемыми средствами. Если binary не позволяет нужного ограничения, профиль не допускается — не подделываем special session identity и не патчим binary ради обхода.

В Claude официальные условия запрещают удалять/ограничивать встроенные способы аутентификации при размещении binary [A2]. Поэтому host не должен «решать» изоляцию модификацией login-поведения; подписочная сессия принадлежит конечному пользователю. Если архитектура требует, чтобы bridge не мог владеть даже собственным credential state, такой bridge не подходит. Собственный direct API credential service и официальный upstream-managed login — разные режимы хранения.

Receipt bridge фиксирует hash/config binary, task/session mapping, фактически подтверждённые ограничения и результат проверки артефакта. Это **не** аттестация всех внутренних действий upstream. Отсутствие события в stream не доказывает отсутствие эффекта.

## 5. Разделение обязанностей минимального kernel

Все пункты раздела — **П**, основанное на перечисленных несовместимостях.

| Слой | Ответственность | Что не должно в него попадать |
|---|---|---|
| Provider codec | Wire schema, сериализация, event decode, protocol/version compatibility | Выбор владельца аккаунта, login UI, tool execution |
| Credential service владельца | Разрешённый auth flow, secret store, refresh, audience/endpoint binding, revoke | Model transcript, inter-agent messages, доступ orchestrator к tokens |
| Entitlement policy | Product/use-case admission с URL, retrieval date, scope, expiry, decision reason | Вывод разрешения из успешного HTTP или OSS license |
| Billing/quota ledger | Reservations, расходы, provider usage reconciliation, quota windows | Ротация аккаунтов для обхода квот, неявный платный fallback |
| Capability registry | Подтверждённые возможности конкретного route, версия, evidence freshness | Непроверенные boolean defaults и market model names как proof |
| Transport | HTTP/SSE/WebSocket/AWS event stream, timeout, cancellation, ограниченный retry | Повтор tool side effects и переинтерпретация EOF как успеха |
| Kernel loop | Канонический transcript, validation, task-bound tool dispatch и recovery state | Credentials, provider-specific login, встроенный MCP host |
| Curator wrappers | Установленные отдельно tools, sandbox/communication/project management integration | Неограниченный универсальный shell внутри worker |

В исходном Apiary paper разделены inference capacity и полномочия изменения проекта (локальный pin в реестре). Это сохраняется: API response подтверждает ответ сервиса, а не право worker изменить scope, принять результат или подписать интеграционный кандидат.

Curator `provider-capability-receipt-v1` из прочитанного `protocol/assurance.md` относится к **host execution** и конкретным шести свойствам изоляции. Его нельзя переиспользовать для «модель умеет tools». **П:** отдельные типы `ModelCapabilityObservation`, `CredentialBinding`, `EntitlementDecision`, `InferenceUsageRecord`; новые имена здесь иллюстративны, действующие normative protocols не меняются. Подпись worker удостоверяет авторство записи, но не делает self-reported model/billing данные доказательством со стороны поставщика.

### 5.1. Versioned adapters и negotiation

Ключ route: provider product, API family/version, endpoint class, region, account/workspace/deployment, model resolved ID, adapter hash/revision, SDK revision, transport. Manifest имеет compatibility tests revision и дату последней проверки официальных правил.

Необходимые возможности worker: текст, стабильная идентификация tool calls, ограничение output, однозначный конец turn, возможность передать центральную схему и отделить function calls от текста. Дополнительные: strict schema, parallel tool calls, image input, reasoning controls, opaque replay, token counting, cache, resumable streaming. Для каждого поля состояния **supported / unsupported / unknown** и источник: documentation, inspected implementation, live observation. Только первые два не доказывают конкретный account access.

Admission — пересечение требований профиля, разрешённых use cases, наблюдаемого account route и capabilities адаптера. Каталог моделей — подсказка, не доказательство. Небольшой runtime probe в будущем проверяет encoding/terminal/tool arguments без эффектов; live API calls в этой работе не выполнялись. Ответ `401/403/404` классифицируется с контекстом, а не как универсальное «нет такой модели»: в Anthropic недоступный workspace может выглядеть как 404 [A1], в Kimi HighSpeed 401 может означать отсутствие tier [K3].

При изменении model alias, endpoint, аккаунта, SDK, tool schema или plan инвалидировать observation; новое решение допусков — перед новым turn. Между tool proposal и execution всегда повторно проверять локальное task authorization. Для OpenRouter включать требование поддержки обязательных параметров и фиксировать допустимый upstream routing/data policy [R2]. Автоматическое переключение на другого поставщика не должно незаметно расширять передачу данных.

### 5.2. Tool schema и непрозрачные блоки

Канонический центральный tool — именованная операция с task/session IDs, operation enum, typed payload и ограничениями размеров. Не строка произвольного shell. Для optional signing — digest и назначение, а не «подпиши любые байты». Execution adapter проверяет исходную каноническую схему и task permit даже при provider strict mode.

Для каждого codec составляется таблица lowering: nullable/optional, enum, unions, `$ref`, required, additionalProperties, числа и Unicode. Отбрасывание constraint допустимо только при сохранении локальной проверки и явной записи потери wire enforcement; если потеря меняет смысл вызова — отклонить конфигурацию. OpenAI strict требует своих schema условий [O2]; DeepSeek strict отмечен beta с ограниченным набором типов [D2]. Не «чинить» неизвестное имя tool эвристикой регистра и не подменять его другим действием.

Provider block хранится как opaque bytes/JSON с namespace, issuer product, source model/session/account scope, API revision и digest. Encrypted thinking/signatures не превращаются в открытый текст и не пересылаются между владельцами. Текущий Gemini thinking guide описывает signature и отдельные stream deltas [G5]; Pi показывает необходимость сохранять same-model metadata. При смене route разрешён перенос только переносимой части transcript по явной политике; если полноценный replay требует старого блока, продолжать старый route либо начать новую сессию с явно обозначенным контекстным резюме. Резюме не является исходным reasoning или receipt.

## 6. Streaming, retries и восстановление

**Н:** Anthropic может вернуть error внутри HTTP-успешного SSE, usage deltas накопительные, tool JSON приходит частями [A5]. OpenAI Background позволяет продолжить определённый stream по response ID и cursor [O4]. Ollama Responses не поддерживает stateful `previous_response_id`/`conversation` [L2]. Следовательно, один универсальный reconnect неверен.

**П: нормализованные события:** `AttemptStarted`, `ContentStarted`, `TextDelta`, `OpaqueDelta`, `ToolCallStarted`, `ToolArgumentsDelta`, `ToolCallReady`, `UsageObserved`, `ProviderTransition`, `TurnEnded`, `AttemptFailed`. Envelope: local attempt ID, local monotonic sequence, upstream request/response ID при наличии, block/tool ID и provenance. Raw provider envelope хранить отдельно, с redaction и size bound. Неизвестные необязательные события сохранять/пропускать без эффектов; неизвестное событие, влияющее на completion/tool semantics, завершает attempt как unsupported.

| Точка сбоя | Восстановление | Что запрещено |
|---|---|---|
| До отправки request | Повтор в пределах reservation/deadline | Создавать новую расходную сессию без учёта попытки |
| Request ушёл, ответ не получен | Outcome unknown; provider-supported idempotency/retrieve либо новая явно учтённая попытка | Утверждать, что расход нулевой или первая генерация не началась |
| 429 / временный 5xx | Уважить Retry-After, bounded exponential backoff+jitter, cancellation; различать quota exhaustion и overload | Бесконечный retry, смена владельца ради обхода лимита |
| Частичный text/JSON | Записать partial attempt, не выполнять незавершённые calls. Resume только с подтверждённым cursor contract; иначе новая генерация от checkpoint | Склеивать новый ответ с хвостом старого как один response |
| Полный tool proposal, terminal ещё не подтверждён | Для baseline буферизовать до валидного terminal; latency optimisation требует отдельного протокола | Выполнять syntactically parseable partial JSON |
| Tool принят, execution outcome потерян | Запросить реестр operation по durable idempotency key; вернуть известный receipt либо `outcome_unknown` | Повторять необратимое действие из-за reconnect inference |
| Tool выполнен, результат не дошёл модели | Replay того же результата/receipt с тем же operation ID в разрешённой сессии | Выполнять tool заново |
| Истёк/отозван credential | Один coordinated refresh там, где он предусмотрен, затем `reauth_required` | Скрыто переключаться с подписки на PAYG |
| Cancel во время server-side generation | Закрыть transport и вызвать поддерживаемую cancel операцию; расход считать неизвестным до reconciliation | Обещать мгновенную остановку сервера и отсутствие charges |

Для side effects нужен отдельный автомат `proposed → validated → reserved → executing → succeeded/failed/outcome_unknown`, с durable записью **до dispatch**. Idempotency key включает task authority/version и логическую операцию, а не только provider tool ID; повтор с тем же key и другим payload запрещён. Exactly-once HTTP delivery не обещается. Effectively-once возможно только там, где executor поддерживает дедупликацию и возвращает прежний результат.

OpenAI Go `shouldRetry` и stream `Next/Err` подтверждают разные границы HTTP retry и чтения событий. **П:** один владелец retry policy: SDK automatic retries отключить либо включить в общий attempt/budget accounting, чтобы вложенные retry loops не умножали запросы. Состояние partial response никогда не теряется из usage ledger даже при исключении из переносимого transcript.

## 7. Аккаунты, refresh, бюджет и контекст

### 7.1. Credential lifecycle — предложение

`CredentialBinding` содержит opaque local reference, issuer/product, owner pseudonym, tenant/project/workspace/region, разрешённую audience/endpoint, auth kind, generation и expiry metadata. Секрет читается только credential process/transport; модель и центральный tool его не видят. Не использовать один process-global environment для нескольких владельцев. Для официального агентного bridge login и refresh остаются внутри его пользовательского security domain.

Состояния: `unconfigured → authenticating → active → refreshing → active`; отдельно `expired`, `revoked`, `reauth_required`, `disabled`. Межпроцессный refresh lock/lease по binding, compare-and-swap generation и atomic secret replacement. После `invalid_grant` не запускается storm повторных login; старое поколение не перезаписывает новое. Refresh нельзя дедуплицировать по имени провайдера между разными владельцами. WIF/ADC token renewal, static key rotation и subscription OAuth — разные стратегии.

Logout увеличивает generation, отменяет связанные новые dispatch, очищает локальную доступность и provider session по поддерживаемому API; незавершённые attempts остаются для reconciliation. Ротация key не означает новый budget owner. Смена account/workspace создаёт отдельную transcript/cache/session область. Общий team service account допустим только там, где владелец и договор разрешают, с явной отчётностью; personal subscriptions не собираются в общий credential pool.

Предотвращение утечки: allowlisted outbound auth injection; запрет переноса Authorization на redirect к другой audience; TLS и endpoint policy; redaction transport errors/headers/telemetry/crash reports; отсутствие raw credentials в argv, model messages, outcome artifacts и worker-to-orchestrator обмене. Local endpoint не получает настоящий cloud key «для совместимости». При неизвестном host protocol не делать authenticated capability probes.

### 7.2. Billing/quota — предложение

Бюджет выделяется одновременно на владельца, проект, задачу, сессию и model route. До отправки атомарно резервируются worst-case input/output и provider-specific reasoning/cache/tool charges с запасом. Не смешивать USD, tokens, requests и subscription Credits. Цена и conversion rule версионированы; неизвестная цена либо запрещает автоматический spend, либо требует заранее ограниченного отдельного allowance.

После ответа: reconcile actual usage и reservation; накопительные deltas не суммировать как независимые. Missing usage означает `unknown`, не ноль. Partial attempt удерживает консервативную reservation до provider reconciliation/явного accounting решения. Cancellation и billing alerts не являются hard cap. Локальный enforcement ограничивает только запросы, прошедшие через него; параллельный расход тем же аккаунтом в других клиентах требует provider-side quota/limit и не может быть строго ограничен локальным ledger.

**Н:** OpenRouter BYOK может переходить на shared capacity, а BYOK spend по умолчанию не включается в некоторые budget counters [R3]. **П:** явно отключать недопустимый billing fallback и отдельно проверять включение BYOK в нужный budget. BYOK передаёт upstream key внешнему gateway и потому не соответствует профилю, где этот key обязан оставаться только у владельца; для такого профиля использовать собственный OpenRouter key или прямой upstream API. Это отдельный выбор владельца, не автоматическая часть подключения.

Subscription capacity — отдельное наблюдение с reset window, freshness и доступными моделями. Автоматический top-up, смена billing mode, покупка дополнительных credits или PAYG fallback требуют ранее заданной политики владельца. Ничего из этого не следует из общего разрешения выполнить coding task. Plan cancellation/expiry/seat removal инвалидируют entitlement; один уже выданный token не доказывает действующую подписку.

### 7.3. Context/cache — предложение

Хранить отдельно input context limit, output cap, reasoning budget, tokenizer/count endpoint, supported modalities и effective tool-schema size. Лимит модели не равен доступному остатку конкретного turn. Резервировать место под ожидаемые tool results; при превышении уменьшать контекст до запроса, сохраняя causal tool-call/result пары и task constraints. Compaction явно версионируется и не удаляет audit receipts из журнала.

Cache identity включает owner/workspace, provider product, model/version, adapter, schema, system context и режим data retention. Prompt cache поставщика, собственный response cache, upstream conversation ID и compiled artifact cache Curator — четыре разных объекта. Anthropic prompt caching имеет отдельные hit/write semantics [A6]; не обещать одинаковые TTL или переносимый cache hit. Cache не подтверждает актуальность entitlement или результата внешнего tool. Смена account, policy или model alias инвалидирует подходящую область cache.

## 8. Отклонённые варианты и план проверок

| Вариант | Почему отклонён | Чистая альтернатива |
|---|---|---|
| «Любая подписка через один OAuth adapter» | Отсутствует единый официальный raw inference grant; есть прямые запреты и условия | Direct APIs + отдельные разрешённые subscription products/agent bridges |
| «OAuth код в Pi/OpenCode означает разрешение» | License кода не договор доступа к сервису | Отдельная датированная entitlement policy |
| «Agent SDK/app-server = completion» | Чужой loop, встроенные tools, state и billing boundary | `AgentBridge` с отдельным assurance label |
| «Allowed tools доказывают no local effects» | Allowlist может быть auto-approval; process I/O и hosted effects остаются | Минимальный direct API worker; independent isolation для bridge |
| «Все провайдеры — OpenAI-compatible» | Различаются schemas, IDs, reasoning, transport, completion и state | Небольшое семейство versioned codecs, явные capability requirements |
| «Retry stream значит retry tool» | Возможен повтор необратимого эффекта | Durable operation ledger и reconciliation |
| «Credentials отправим orchestrator для удобства» | Нарушает владельческий boundary Apiary | Локальный credential service и несекретные observations |
| «Provider receipt доказывает модель и законность» | Наблюдение сервиса/worker не аттестует юридическое право, model provenance или host isolation | Раздельные типы evidence и явная степень доверия |

Будущие conformance проверки **не запускались в этой исследовательской задаче**. Нужны отрицательные случаи: недопустимый endpoint с реальным key; чужой owner/session; stale entitlement; неверный workspace; unknown capability; lossy schema, пропускающая запрещённые args; partial JSON; EOF без terminal; duplicate tool ID; смена payload под operation key; процесс упал после effect; refresh race двух процессов; quota исчерпана до отправки; 200 с SSE error; неожиданный hosted tool; новый provider block; cross-account cache hit. Проверять production dispatch, не только helpers. Для bridge — filesystem/network/process наблюдение при запрещённых действиях; настройка tools сама по себе тестом не считается.

Первый implementation milestone: direct OpenAI Responses + Anthropic Messages с локальным mock transport только для fault injection, затем живые разрешённые API probes с владельцем/расходом. Следом Gemini/Vertex и cloud/vendor codecs. Live tests не заменяют policy review; успешная авторизация не легализует запрещённый use case. Подписочные compatibility modes не должны задерживать полезность direct API Apiary.

## 9. Ограничения, доказательства и воспроизводимость

Не проверялись реальные аккаунты, оплата, refresh tokens, доступность моделей по странам, производительность, binary sandbox escape, полная матрица всех моделей и wire APIs. Нет утверждений об exhaustiveness, рейтинге популярности или сертификации. Политики — официальные опубликованные границы, не заключение о конкретном договоре пользователя. Новые SDK/API surfaces могут появляться быстрее адаптеров.

Исходники получены как отдельные файлы по immutable commit SHA, без checkout и без исполнения. Соседние репозитории обследованы read-only; для документов использован `git show HEAD:path`, а не изменённый working tree. Свежий remote HEAD соседних repos не запрашивался: их pins обозначают локальные входы, не «последнюю upstream версию». Снимки `.temp` не входят в delivery diff; durable реестр сохраняет hashes, URL, SHA и символы для повторного получения.

Документация получена через официальный web retrieval и публичный HTTP fetch. Search snippets и сторонние обсуждения не использованы как доказательство. Несколько URL переместились; в реестре разделены исходный и resolved URL. SHA-256 страницы фиксирует полученные bytes, не её юридическую дату действия. Для страниц, доступных только web tool, hash не выдуман. Найденные расхождения отражены в [исследовательском logbook](TASK-260908-39n05p_provider-portability-logbook.md).

### Официальные источники

Все прочитаны 2026-09-08 по локальной дате. Ниже краткие обозначения для ссылок в тексте; версия web-страницы — retrieved snapshot, если явная дата не указана.

[O1]: https://learn.chatgpt.com/docs/auth
[O2]: https://developers.openai.com/api/docs/guides/function-calling
[O3]: https://learn.chatgpt.com/docs/app-server
[O4]: https://developers.openai.com/api/docs/guides/background
[A1]: https://platform.claude.com/docs/en/manage-claude/authentication
[A2]: https://code.claude.com/docs/en/legal-and-compliance
[A3]: https://code.claude.com/docs/en/agent-sdk/overview
[A4]: https://support.claude.com/en/articles/15036540-use-the-claude-agent-sdk-with-your-claude-plan
[A5]: https://platform.claude.com/docs/en/build-with-claude/streaming
[A6]: https://platform.claude.com/docs/en/build-with-claude/prompt-caching
[G1]: https://ai.google.dev/gemini-api/docs/api-key
[G2]: https://docs.cloud.google.com/gemini-enterprise-agent-platform/models/start/gcp-auth
[G3]: https://geminicli.com/docs/resources/tos-privacy/
[G4]: https://geminicli.com/docs/get-started/authentication/
[G5]: https://ai.google.dev/gemini-api/docs/thinking
[B1]: https://docs.aws.amazon.com/bedrock/latest/userguide/conversation-inference.html
[B2]: https://docs.aws.amazon.com/bedrock/latest/userguide/model-access.html
[B3]: https://docs.aws.amazon.com/bedrock/latest/userguide/api-keys-reference.html
[Z1]: https://learn.microsoft.com/en-us/azure/foundry/openai/how-to/responses
[R1]: https://openrouter.ai/docs/api_reference/overview
[R2]: https://openrouter.ai/docs/guides/routing/provider-selection
[R3]: https://openrouter.ai/docs/guides/overview/auth/byok
[D1]: https://api-docs.deepseek.com/quick_start/pricing
[D2]: https://api-docs.deepseek.com/guides/tool_calls/
[Q1]: https://www.alibabacloud.com/help/en/model-studio/compatibility-of-openai-with-dashscope
[Q2]: https://www.alibabacloud.com/help/en/model-studio/coding-plan-faq
[Q3]: https://www.alibabacloud.com/help/en/model-studio/token-plan-overview
[Q4]: https://modelstudio.alibabacloud.com/intl/blog/model-studio-token-plan-individual/
[K1]: https://www.kimi.com/en/help/kimi-api/api-overview
[K2]: https://platform.kimi.com/docs/agreement/modeluse
[K3]: https://www.kimi.com/en/help/kimi-code/membership-guide
[K4]: https://www.kimi.com/code/docs/en/third-party-tools/hermes.html
[L1]: https://docs.ollama.com/api/authentication
[L2]: https://docs.ollama.com/api/openai-compatibility
