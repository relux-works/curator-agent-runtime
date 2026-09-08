# Codex и Pi: исходная архитектура и решения для Apiary

Задача: `TASK-260908-1v88g1`, история `STORY-260908-1l3m6n`. Дата получения: **08.09.2026, Asia/Tbilisi** (07.09.2026 около 22:20–22:40 UTC). Статус документа: исследование для review, не изменение нормативного протокола.

## 1. Главный результат

**Рекомендация:** Apiary нужен один небольшой Go-oriented kernel с явными состояниями turn, provider response и tool invocation. Из Pi следует взять отделение истории приложения от запроса модели, компактный цикл и ясные очереди steering/follow-up. Из Codex — привязку dispatch к снимку объявленных tools, разделение approval и sandbox, аккуратное завершение уже начатых effects при ошибках стрима. Из нового Pi harness — журналируемые намерения, восстановление с неизвестным исходом и запрет произвольного replay. Не следует переносить в kernel ни четыре встроенных coding-tools Pi, ни продуктовую поверхность Codex, ни same-process extension API с доступом к конфигурации провайдера.

Это не сравнение «маленький Pi против большого Codex» по README. На текущей ревизии Pi существуют **classic Agent/AgentSession и отдельный durable AgentHarness**. В classic SDK фабрика `createAgentSession()` создаёт `new Agent(...)`; наличие нового harness не доказывает, что classic CLI получил его гарантии [P2]. Новый harness содержит реальный автомат восстановления [P12–P16], но `Harness.watchSession()` ещё бросает `SliceNotImplemented` [P15].

Критическая развилка: валидный JSON аргументов ещё не означает завершённый ответ модели. Pi classic проверяет terminal stop reason до dispatch; Codex может запустить tool по завершению отдельного output item, до завершения всего ответа [P1, C2, C3]. Поэтому «повторить запрос после сетевой ошибки» не эквивалентно «повторить всё действие».

## 2. Метод и реестр снимков

Обозначения: **Наблюдение** — прочитанный production-код или первичный документ; **Вывод** — следствие с указанными границами; **Решение** — предлагаемое правило Apiary, не утверждение о существующей реализации. Исследование статическое: зависимости не устанавливались, исходный код, OAuth flows и тесты клонированных проектов не запускались. Из наличия теста не выводится его успешность.

| Источник | Запрошенный адрес и каноническая идентичность | Ревизия |
|---|---|---|
| Codex | `https://github.com/openai/codex`, GitHub repository id `965415649`, `main` | `8e694e955ae02ca737230a5468c55d5847074072` |
| Pi | запрос `https://github.com/badlogic/pi-mono`; GitHub API вернул `earendil-works/pi`, repository id `1035029907`, `main` | `b2602be77cb7b0de45dd616407fd210daa48aa75` |

Оба снимка получены свежим `git clone --depth 1`; последующий `git ls-remote origin refs/heads/main` совпал с локальным HEAD. Это актуальность в момент получения, не обещание о будущей вершине `main`. Каталоги `.temp/TASK-260908-1v88g1/codex` и `pi-mono` — изолированные read-only по использованию снимки. Метаданные identity, remote SHA, команды и результаты сохранены рядом. Полная история коммитов не загружалась; происхождение каждого отдельного решения по git blame не устанавливалось.

Канонический перенос Pi подтверждается не только redirect: Mario Zechner в [публикации от 08.04.2026](https://mariozechner.at/posts/2026-04-08-ive-sold-out/) прямо называет переход `badlogic/pi-mono` → `earendil-works/pi`. Названия npm-пакетов в анонсе нельзя автоматически считать актуальными: прочитанный код уже импортирует `@earendil-works/pi-ai`.

### Локальные read-only входы

| Репозиторий | origin | HEAD при осмотре | Рабочее дерево |
|---|---|---|---|
| curator-agent-runtime | `git@github.com:relux-works/curator-agent-runtime.git` | `da759b8f3d366f31e5bd42934f6b5ecd1d01ac3f` | основной checkout: untracked `.task-board/`; назначенный worktree исходно чист |
| apiary-docs | `git@github.com:relux-works/apiary-docs.git` | `b1ad6d76d803cd3f8e46e2b9621d266d36f3a0c7` | чист |
| curator | `https://github.com/relux-works/curator.git` | `a66eec88fa4dfb8f3ca098f594f6e48af57a6835` | многочисленные чужие изменения `.task-board/`, сохранены |
| curator-spec | `https://github.com/relux-works/curator-spec.git` | `87a0d0060bad64ab883d007dcdf35df7485368bf` | чист |
| skill-project-management | `git@github.com:relux-works/skill-project-management.git` | `14e2483be64c817a76a19ac8dd5608e717e56285` | чист |

Это ledger origin/HEAD/dirty state, а не заявление о глубоком аудите всех siblings. Архитектурные входы данной работы — задание и прочитанные `docs/architecture.md`, `decisions/0002-tools-are-skills.md`, `decisions/0005-epochs-and-attenuation.md` в назначенном worktree. Нормативные документы не редактировались. Решения ниже уточняют исследовательскую рекомендацию: существующее описание M0 с shell не переносится автоматически в требуемый worker-профиль с одним typed tool-skill.

## 3. Реальные end-to-end пути

### 3.1 Codex: от ввода до следующего sampling

**Наблюдение.** `session/handlers.rs::submission_loop` получает `Submission`, различает `Op::TurnInput`, `Interrupt`, `RecoverTurn`, `SuspendTurnAndShutdown`, shutdown и другие операции. TurnInput передаётся в `turn_input::handle`, а ответ о принятии возвращается через отдельный reply channel [C1]. Это control plane, а не текстовая команда внутри prompt.

`session/turn.rs::run_turn` обслуживает несколько запросов модели в одном пользовательском turn. Между запросами он извлекает pending input, вызывает hooks и записывает входы, получает `StepContext`. Снимок используется совместно для контекста, объявленных tool specs и dispatch. После compaction и в начале turn drain очереди намеренно откладывается, чтобы сохранить порядок продолжения [C2].

`build_prompt` собирает `input`, `base_instructions`, `tool_router.model_visible_specs()`, output schema. `run_sampling_request` создаёт `ToolCallRuntime` и `ModelClientSession`-связанный запрос. `try_run_sampling_request` читает stream events; `OutputItemAdded`/deltas обслуживают промежуточное представление, `OutputItemDone` обрабатывает завершённый item, `Completed` фиксирует terminal response и usage. Конец транспорта без `response.completed` — ошибка, а не успешный конец turn [C2, C6].

Для tool item `stream_events_utils::handle_output_item_done` строит `ToolCall`, записывает item и создаёт future dispatch. `ToolCallRuntime::handle_tool_call_with_source` запускает Tokio task, ждёт readiness и parallel gate, затем `ToolRouter` передаёт `ToolInvocation` в registry. `drain_in_flight` записывает результаты в историю; следующий sampling видит call/result [C3–C5].

**Вывод.** Здесь нужны минимум три идентичности: пользовательский turn, запрос модели и invocation. UI-item id не заменяет effect id. Событие «tool показан» не должно служить подтверждением исполнения.

**Решение Apiary.** Одна goroutine-владелец session state, явные команды `Start`, `Steer(expectedTurnID)`, `Cancel`, `Resume`. Сетевые и tool workers возвращают коррелированные события; никакие callbacks не изменяют authority напрямую. Вызов закрепляется за `epochID + planDigest + requestID + callID + toolBindingDigest`.

### 3.2 Pi classic: минимальный цикл с полноценными границами

**Наблюдение.** `createAgentSession()` связывает model runtime, resource loader, settings, session manager и `Agent`. Восстановленные сообщения помещаются в `agent.state.messages` [P2]. `Agent.prompt()` запрещает второй конкурентный prompt; предлагает `steer()`/`followUp()`. `runWithLifecycle` устанавливает AbortController и running state, вызывает `runAgentLoop`, обрабатывает исключения и только в `finally` очищает activeRun [P3].

`runAgentLoop` добавляет prompts и испускает `agent_start → turn_start → message_start/end`. Внутренний `runLoop` берёт steering; перед очередным запросом вызывает `prepareNextTurn`; `streamAssistantResponse` применяет `transformContext`, затем `convertToLlm`, разрешает auth для provider и передаёт `Context` в stream function. Полученный terminal message сохраняется в текущем контексте [P1].

После ответа: `error/aborted` прекращают цикл без tool dispatch; `length` превращает все tool calls в ошибки исполнения без запуска. Иначе `prepareToolCall`: поиск имени → prepareArguments → schema validation → beforeToolCall → проверка abort → execute → afterToolCall → tool result. После batch появляются `turn_end`, затем новый steering или follow-up. Follow-up извлекается во внешнем цикле, когда агент иначе остановился бы [P1].

**Существенная деталь.** В этой ревизии steering опрашивается между model/tool turns, а не после каждого отдельного sequential tool. Нельзя приписывать ему «немедленно остановить следующий tool» из старых обзоров. AbortSignal проверяется отдельно; отмена кооперативна для произвольного tool callback.

`Agent.processEvents` сначала меняет state, затем ждёт listeners. `agent_end` ещё не означает idle: awaited обработчики должны завершиться до `finishRun`. Но `AgentSession._handleAgentEvent` уведомляет extensions и listeners **до** `SessionManager.appendMessage`. Публичная нотификация поэтому не является квитанцией durable append [P3, P4].

**Решение Apiary.** Взять краткость и разделение observer/control, но ввести явные `observed`, `committed`, `settled` состояния. Подтверждение принятого steering выдавать после append inbox record; очереди сохранять с ID сообщений, а не только текстом.

### 3.3 Pi durable harness: отдельный путь, не гарантия classic CLI

**Наблюдение.** `Harness` управляет именованными lanes. `lane()` создаёт или восстанавливает lane через `session.mutate`; `Lane.prompt()` вызывает `driveRunRequest`, а установленный drive запускает `driveOperation`. Автомат различает `starting`, `checkpoint`, `assistant.ready`, `assistant.effect_pending`, `assistant.retry_wait`, `tools`, deferred и summary states. Отсутствие продвижения состояния — invariant error [P12, P15, P16].

`publishResponse` атомарно классифицирует terminal response, записывает assistant entry, usage и новый operation state. Ошибка не становится tool batch; retry ограничен policy; overflow имеет отдельное восстановление. `recoverAssistantGeneration` восстанавливает только committed prefix frames и явно сообщает, что более новый live output мог быть утрачен, а внешний исход неизвестен [P13].

`publishToolIntent` переводит call в `effect_pending` до effect; `publishToolOutcome` фиксирует исход. `recoverToolInvocation` повторяет действие только если **и сохранённый call, и текущий tool** помечены `replay: safe`, и нет отмены. Иначе создаёт interrupted result с неизвестным внешним исходом [P14]. Это не exactly-once: внешняя система может выполнить эффект до аварии и до записи результата.

`MutationLine` сериализует read-modify-write одной Session. `JsonlStorage.commit` сериализует append транзакций; сначала append, затем изменение materialized state. Чтение v4 отвергает повреждённую полную строку, незавершённый хвост обрабатывает отдельно [P17]. Это не доказательство межпроцессного fencing или fsync каждого эффекта. `watchSession()` не реализован [P15].

**Решение Apiary.** Adopt автомат intent/effect/outcome и honest unknown. Change `replay: safe`: метка должна принадлежать проверенному Curator binding, а не произвольному runtime extension. Для неидемпотентных операций нужны idempotency key или reconciliation endpoint; без них recovery останавливает повтор этого эффекта и сообщает unknown.

## 4. Сессии, steering, cancellation и concurrency

| Вопрос | Codex | Pi classic / durable | Последствие для Apiary |
|---|---|---|---|
| Конкурентный ввод | control channel и active-turn routing; steer проверяет ожидаемый turn [C1] | classic prompt отказывает при activeRun, отдельные очереди; durable inbox в lane [P3, P16] | `expectedTurnID`, durable acceptance ID, независимый control channel |
| Когда применяется конфигурация | request-scoped StepContext [C2, C4] | classic `prepareNextTurn` обновляет model/tools/system prompt; durable lane/config state [P4, P15] | immutable epoch и отдельный request snapshot |
| Параллельные tools | read-lock для разрешённых parallel; write-lock для остальных [C4] | classic один sequential tool делает batch sequential, иначе Promise.all; результаты возвращаются в исходном порядке [P1] | по умолчанию sequential; concurrency class задаёт trusted binding |
| Отмена | CancellationToken, child tasks, abort-on-drop, terminal-outcome race handling [C4] | AbortController; callback может игнорировать signal; durable cancellation marker и reconciliation [P3, P16] | deadline и остановка процесса принадлежат broker; cancel не равен rollback |
| Завершение | `Completed`, завершение turn и tool results — разные события [C2] | `agent_end` до idle, message notification до persistence [P3, P4] | отдельное durable settled событие |
| Возобновление | rollout history + специальный RecoverTurn/suspend [C1, C8, C9] | classic reconstruct tree; durable operation-state recovery [P5, P12] | restore разговора отдельно от возобновления незавершённых effects |

**Граница доказательства.** `RwLock` Codex — gate для данного ToolCallRuntime, не глобальная блокировка файлов разных sessions. `Promise.all` Pi сохраняет порядок массива результатов, но не порядок внешних effects. Эти механизмы не доказывают изоляцию двух агентов, редактирующих один workspace. В Apiary broker должен выдавать конфликтные leases или запрещать конкурентные mutations для одной capability scope; file locking и workspace policy остаются обязательными независимо от языка kernel.

## 5. Tools и schema: типы не дают полномочий

**Codex, наблюдение.** `ToolRouter` хранит finalized план с model-visible specs и executable registry. `ToolCall` различает payload kinds и сохраняет call id; registry отвергает неизвестное имя и несовместимый payload kind [C5]. Вызов идёт с исходным StepContext, даже когда исполняется позже [C4]. Это полезнее mutable map, которую можно заменить между объявлением schema и execute.

Registry не следует считать универсальным JSON Schema firewall: в прочитанном dispatch проверяются имя/kind и hooks; параметры конкретных tools разбираются своими handlers. Прочитанный `handlers/mod.rs::parse_arguments<T>` использует `serde_json::from_str`, что само по себе не означает выполнение всей объявленной JSON Schema [C16]. Provider-side schema generation и host-side validation — разные обязанности. Нельзя переносить в Apiary утверждение «раз модель получила schema, malformed arguments невозможны».

**Pi, наблюдение.** `prepareToolCall` действительно вызывает `validateToolArguments` перед execute. Валидатор клонирует arguments, нормализует optional null, выполняет преобразования и проверку TypeBox/JSON Schema [P1, P6]. Это runtime validation с coercion, а не строгая byte-for-byte интерпретация исходного JSON. Unknown tool и отказ beforeToolCall возвращаются как error result.

**Оговорка F1: вызов валидатора не гарантирует отказ.** В [`validateToolArguments`, строки 317–332](https://github.com/earendil-works/pi/blob/b2602be77cb7b0de45dd616407fd210daa48aa75/packages/ai/src/utils/validation.ts#L317) есть ранний `return validator.Check(coerced) ? coerced : args`. Точные предусловия этой ветки: предыдущие операции clone/normalization/`Value.Convert`/compile не бросили исключение; у schema нет собственного symbol `TypeBox.Kind`; `coerceWithJsonSchema` вернул значение, для которого `coerced !== args`; исходное и преобразованное значения не являются одновременно non-null objects. Если затем `validator.Check(coerced)` возвращает false, возвращается `args`, минуя общий `Check(args)` и общий throw. Для scalar это исходное клонированное значение. Ветка object→object вместо этого копирует свойства и продолжает общую проверку; нельзя переносить scalar-вывод на неё.

**Статический контрсценарий, не воспроизведение.** Plain root schema `{type:"number", minimum:10}`, вход `"7"`: [`coercePrimitiveByType` и `coerceWithJsonSchema`](https://github.com/earendil-works/pi/blob/b2602be77cb7b0de45dd616407fd210daa48aa75/packages/ai/src/utils/validation.ts#L62) допускают преобразование в 7, после чего при false от constraint check ранний выход возвращает `"7"`. Проверена структура control flow; поведение зависимостей в исполнении не проверялось. Допуск scalar-root schemas конкретными model providers **не установлен**; сетевой exploit не доказан. Custom/untyped SDK input или root replacement через `prepareArguments` — рассматриваемые host-side пути, а не доказанный штатный provider response.

**Связь с production.** [`prepareToolCallArguments` / `prepareToolCall`](https://github.com/earendil-works/pi/blob/b2602be77cb7b0de45dd616407fd210daa48aa75/packages/agent/src/agent-loop.ts#L593) допускают замену arguments callback-ом (TypeScript cast не проверяет root в runtime), вызывают валидатор и сохраняют его результат в `prepared.args` без повторной schema-проверки. При отсутствии блокировки `beforeToolCall`, отмены или другого исключения [`executePreparedToolCall`](https://github.com/earendil-works/pi/blob/b2602be77cb7b0de45dd616407fd210daa48aa75/packages/agent/src/agent-loop.ts#L677) передаёт это значение в `tool.execute`. Callers подготовки присутствуют в обеих ветках: [`executeToolCallsSequential`:450](https://github.com/earendil-works/pi/blob/b2602be77cb7b0de45dd616407fd210daa48aa75/packages/agent/src/agent-loop.ts#L450) и [`executeToolCallsParallel`:505](https://github.com/earendil-works/pi/blob/b2602be77cb7b0de45dd616407fd210daa48aa75/packages/agent/src/agent-loop.ts#L505). Прочитанный [`createToolCallWithPlainSchema`](https://github.com/earendil-works/pi/blob/b2602be77cb7b0de45dd616407fd210daa48aa75/packages/ai/test/validation.test.ts#L7) оборачивает проверяемое значение в object property; это не проверка раннего scalar return. Отсутствие аналогичного теста во всём репозитории не утверждается.

**Вывод.** Coercion удобен для tolerant coding-agent, но меняет предмет approval: человек может одобрить исходные аргументы, а tool получить другие. `afterToolCall` способен менять content, details и isError; это расширение представления, не независимая проверка факта исполнения [P1].

**Решение Apiary.** Versioned portable schema subset. В M0 installer допускает только object-root schemas из этого subset; execution boundary проверяет object root входа и результата любого prepare/normalization. Любое нормализованное значение проходит полную host-side schema-проверку до dispatch и вычисления digest/approval; невалидный результат даёт typed refusal, без fallback к исходным args. Если позже понадобятся scalar-root tools, допуск требует явного расширения контракта с той же fail-closed проверкой. Отклонены копирование раннего fallback Pi и использование provider admission либо TypeScript cast как доказательства host validation. Reject неизвестные поля/типы на authority boundary; нормализация — только явная, детерминированная и до вычисления digest/approval. Receipt связывает исходный call, canonical arguments digest и фактический binding. Model-visible error — отдельная проекция receipt, которую tool не может переписать как success. Не помещать секреты и полные raw arguments в diagnostic автоматически: Pi validation error включает полученные arguments [P6], Codex dispatch логирует payload preview [C3]. Это наблюдение о logging surface, не утверждение об утечке в данном запуске.

## 6. Контекст, compaction, cache и непрерывность reasoning

### 6.1 Журнал и prompt — разные представления

Pi classic хранит append-only дерево `id/parentId`; branch меняет leaf, а `buildSessionContext()` строит путь и преобразует entries. Compaction entry хранит summary и `firstKeptEntryId`, сохраняя исходные ветви в файле [P5]. Codex `History` отдельно формирует `for_prompt`, нормализует call/output pairs и заменяет compacted active history; rollout recorder отвечает за записи на диск [C7, C8].

**Решение:** append-only относится к каноническим событиям, а не к вечному неизменному prompt. В Apiary должны сосуществовать transcript/event log, execution receipts и provider projection. Summary не имеет права удалять receipt или выдавать его за новый authority grant. Ветка разговора не отменяет уже совершённые внешние эффекты.

### 6.2 Compaction

Pi classic `estimateContextTokens` опирается на последнюю usage и оценку хвоста; `shouldCompact` сравнивает её с `contextWindow - reserveTokens`. Это оценка, не фактический tokenizer count. `AgentSession._compactBeforeNextAssistantResponse` вызывается через next-turn refresh [P4, P10]. Manual compaction отдельно abort-ит текущую операцию; extension может вмешиваться в summary [P4].

Codex имеет local summary path и remote path. Local path удаляет старейший history item при context overflow во время compaction и устанавливает replacement history; порядок initial context зависит от pre-turn/mid-turn режима [C10]. Remote path устанавливает нормализованную provider history; в коде прямо указано, что legacy `/responses/compact` не сохраняет harness metadata исходных envelopes, в отличие от compaction-trigger/v2 [C11].

**Решение:** kernel хранит ссылки `sourceRange → summaryArtifact`, модель/adapter version и context generation. Authority instructions и pending invocation references восстанавливаются из trusted epoch state, а не из summary. Compaction должна быть отменяемой, иметь отдельный budget и не смешиваться с обычным ответом пользователя. Remote opaque compaction допустима как provider-specific artifact; универсальный текстовый summary нужен для осознанного перехода к другому provider, но не эквивалентен latent state.

### 6.3 Cache: исправление устаревшего первичного описания

Официальная статья Michael Bolin [Unrolling the Codex agent loop](https://openai.com/index/unrolling-the-codex-agent-loop/) объясняет важность стабильного prefix, порядка tools и append-only обновлений контекста. Однако её фраза о том, что Codex не использует `previous_response_id`, **не описывает исследованную ревизию**. `ModelClientSession::get_incremental_items` проверяет совпадение request properties и полного prefix; WebSocket path строит continuation с previous response [C6].

Codex `build_responses_request` задаёт `store:false`, `prompt_cache_key`, запрос encrypted reasoning и provider-специфические возможности [C6]. Pi Codex adapter тоже содержит cache/session identity, WebSocket reuse, fallback и специальные retry для потерянного continuation. После начала message stream транспортный fallback не является безусловным: ветка `websocketStarted` возвращает ошибку [P9].

**Решение:** cache — оптимизация adapter, не authority и не источник истины. Сначала корректный full replay; incremental replay только при точном совпадении adapter/model/account scope, конфигурации и prefix. Не обещать ZDR или отсутствие серверного состояния только по `store:false`: entitlement, retention и транспортные гарантии проверяются отдельно. Не переносить provider response id в универсальный session id.

### 6.4 Opaque reasoning нельзя свести к строке

| Provider representation | Прочитанный механизм Pi/Codex | Решение Apiary |
|---|---|---|
| OpenAI Responses reasoning | Pi сериализует reasoning item в `thinkingSignature`, восстанавливает его в request; backfill Azure encrypted content может происходить только из terminal response [P8]. Codex запрашивает `reasoning.encrypted_content` [C6] | хранить typed opaque block с происхождением и допустимой областью replay; не исполнять/пересказывать как инструкцию |
| Anthropic thinking/redacted thinking | сохраняются signature deltas и redacted payload; при отсутствии signature обычный thinking может стать plain text [P8] | редактирование signed block запрещено; отображаемый текст и replay representation раздельны |
| Google thought signature | signature привязана к block/part; same-provider/model проверка, не переносить/не сливать между parts [P8] | не flatten messages до `role + text`; сохранять порядок частей и привязку tool call |
| Cross-model/provider | `transformMessages` убирает несовместимые signatures/redacted thinking, обычный thinking переводит в text, нормализует call ids [P7] | переход явно lossy; adapter выдаёт migration report; не обещать бесшовную эквивалентность |

Pi также вставляет synthetic error results для orphan tool calls и исключает errored/aborted assistant messages из provider replay [P7]. Это исправление wire-формы, не доказательство «tool не выполнился». Apiary должен сохранять в журнале `unknown` и показывать provider допустимую проекцию без вымышленного результата.

## 7. Ошибки стрима после arguments: точный разбор

| Сценарий | Pi classic | Codex | Выбор Apiary |
|---|---|---|---|
| Пришли partial arguments, затем error | terminal error останавливает run до dispatch [P1] | незавершённый item не dispatch-ится через OutputItemDone; stream failure возвращается [C2] | partial preview не исполняется |
| Tool item завершён, весь ответ затем оборвался | classic ждёт terminal message, поэтому error запрещает все calls [P1] | item уже записан, dispatch мог начаться; `drain_in_flight` выполняется до возврата outcome [C2–C4] | в M0 ждать успешный terminal response; streaming dispatch отложить |
| JSON валиден, но ответ оборван лимитом | все calls при `length` получают error без execute [P1] | поведение зависит от завершённости item/Responses event; общего Pi-подобного запрета на весь batch в исследованном участке не установлено | reject truncated batch независимо от schema validity |
| Error после начала tool | tool error/cancellation отдельно от provider error | результаты начатых tools попадают в историю; retry строит prompt из текущей истории [C2] | журнал intent/outcome, reconcile, не повторять effect автоматически |
| Crash после внешнего effect, до receipt | classic JSONL не даёт exactly-once | rollout сам по себе не доказывает exactly-once | explicit unknown; retry только с проверяемой idempotency/reconciliation |

В Pi прочитан отрицательный тест `should not execute tool calls from a length-truncated assistant message`: аргумент `{value:"hel"}` валиден по schema, но assertion требует пустой список executed [P18]. Тест не запускался. Это хороший пример narrow negative: проверяется полнота сообщения, а не только наличие JSON parser.

В Codex прочитан `continue_after_stream_error`: новый turn принимается после ошибки первого [C12]. Он **не доказывает** отсутствие двойного effect после tool arguments: это другая проверка. Кроме того, комментарий говорит о retry=0, а fixture задаёт retries=1; в оценке приоритет отдан исполняемым значениям, не комментарию.

**Цена выбора M0:** ожидание terminal response может увеличить latency tool start. Измерений в этой работе нет. Выгода — меньший state space и отсутствие speculative effects из неуспешного response. Позднее streaming dispatch возможен только с отдельным proof gate для complete item и журналом, который корректно переживает late stream failure.

## 8. Providers, auth и реальные entitlement boundaries

**Наблюдение.** В Codex `ModelProvider` владеет capabilities и provider-specific auth recovery; `ResolvedProviderAuth` отделён от model-visible tools. AuthManager-backed provider проверяет account identity при обновлении credentials [C13]. В Pi `ModelRuntime` разрешает provider/model/auth и готовит вызов `provider.streamSimple`; `openaiCodexProvider()` использует отдельный protocol adapter и OAuth metadata. Anthropic provider отдельно описывает API-key и OAuth auth [P11].

**Решение:** в Go kernel контракт provider включает `Capabilities`, `Stream`, `ProjectHistory`, `ClassifyError`; credentials разрешает доверенный broker/provider host. Tool-skill получает только свою capability, а не subscription token. Provider catalog и tool registry — два разных installed inventories. Любое изменение billing lane, account или provider identity — событие control plane. Подмена model-visible tool списка для выбора provider запрещена.

### Что подтверждено и что неизвестно

1. [OpenAI Authentication](https://learn.chatgpt.com/docs/auth) различает ChatGPT subscription sign-in и API-key usage billing; workspace permissions и retention зависят от пути. Это не одна переносимая учётная запись с одинаковыми правами на все endpoints.
2. Pi docs утверждает Plus/Pro support для Codex и ссылается на [Codex for OSS](https://developers.openai.com/community/codex-for-oss). Открытая официальная страница действительно называет Pi среди предпочитаемых пользователями tools. Это подтверждает поддержку экосистемы, но не устанавливает универсальное право любого Apiary deployment пользоваться произвольным subscription backend или обходить лимиты.
3. Pi `docs/providers.md` прямо указывает: Claude Pro/Max third-party harness traffic использует metered extra usage [P19]. Это первичный документ Pi о его интеграции, но не контракт Anthropic для всех клиентов.
4. Официальная [Claude Agent SDK plan page](https://support.claude.com/en/articles/15036540-use-the-claude-agent-sdk-with-your-claude-plan) содержит обновление 15 июня о приостановке изменений и сохранении subscription limits для Agent SDK, `claude -p` и связанных third-party apps. Нельзя распространить это на прямой Pi Messages adapter: поверхности различаются. Точное покрытие прямого Apiary OAuth клиента этими условиями **не установлено**.

**Следствие:** M0 не должен обещать «все подписки работают как бесплатный API». Поддерживать официально доступный API-key путь; subscription adapter включать только при подтверждённых для него условиях, явной billing policy и штатном login. 401/403/entitlement/usage-limit — типизированные состояния; не маскировать под transport retry. Не копировать токены из чужих runtime homes, не имитировать identity другого продукта, не переключать account для обхода квот. В исследовании не было account-access операций.

## 9. Approvals, sandbox и extensions

**Codex.** `ToolOrchestrator::run` вычисляет approval requirement, различает Skip/Forbidden/NeedsApproval, затем выбирает sandbox и запускает попытку. Attachment-owned network policy нельзя обойти escalated sandbox permissions; retry/escalation зависит от policy, не просто от ошибки процесса [C14]. Это essential complexity: разрешение операции и техническое ограничение процесса решают разные задачи. Официальная [документация approvals](https://learn.chatgpt.com/docs/agent-approvals-security) отдельно описывает эти механизмы и OS-specific enforcement.

Но не вся сложность Codex нужна Apiary. В `app-server::thread_extensions` устанавливаются queue, history notes, goals, guardian, memories, MCP, web search, image generation и skills providers [C15]. В stream loop присутствуют plan-mode presentation, reasoning summaries, model warnings и telemetry [C2]. Это объяснимая продуктовая композиция; она не должна становиться обязательным ядром worker.

**Pi classic.** Extensions загружаются через `jiti.import` в процессе host; они регистрируют tools, переключают active tools/model/providers и получают hooks для контекста, provider request и headers [P2, P20]. `emitToolCall` умеет block, но тот же доверенный extension-код обладает обычными Node capabilities. Проверка tool_call не изолирует extension от файловой системы и сети.

Прочитанный sandbox example переопределяет bash через sandbox-runtime; конфигурация project имеет приоритет над global, есть выключатель sandbox [P21]. Это полезный пример композиции, но **не** доказательство confinement всего процесса Pi или каждого custom tool. In-process extension может не пользоваться переопределённым bash вообще.

**Решение Apiary.** Curator устанавливает подписанные/проверенные manifests и out-of-process providers; kernel не импортирует third-party код. Sandboxing — механизм broker/OS, а model-visible sandbox tool-skill orchestrator лишь запрашивает разрешённые операции. Наличие такого skill не должно позволять менять ограничения текущей эпохи. MCP существует только внутри отдельного установленного wrapper: translate schema/results, enforce call limits и expose фиксированный approved interface. Server `tools/list_changed` не расширяет authority автоматически.

## 10. Persistence/resume: честная граница

Classic Pi `_persist` откладывает создание нового session file до assistant entry; уже опубликованный user input в таком режиме ещё не durable. `parseSessionEntryLine` при невалидном JSON возвращает null, и reader пропускает строку [P5]. Удобство восстановления partial log нельзя выдавать за строгий audit ledger. Новый JsonlStorage v4 отличает torn tail от malformed complete transaction [P17].

Codex rollout имеет очередь pending items, persist/flush/shutdown, повторное открытие writer и повтор записи при ошибке [C8]. Прочитанное поведение поддерживает recovery writer, но само по себе не устанавливает физическую durability или транзакционность с внешним effect.

`suspend_turn_and_shutdown` сначала flush-ит историю, перепроверяет active turn, отменяет task и закрывает producers/writer до объявления thread stop. При этом код прямо очищает pending input и interactive waiters; проверка live descendants — snapshot, а не seal от конкурентного spawn [C9]. Это конкретная граница поддерживаемого suspend, не универсальный перенос работающей сессии.

**Решение:** Apiary resume содержит две фазы: восстановить канонический журнал и заново получить execution ownership с fencing generation. Затем reconcile `intent/effect_pending`; только после этого принимать новые mutations. Event acknowledgement требует определённого durable commit; corrupt middle log — отказ/quarantine, а не отсутствие записи. UI transcript export можно делать tolerant, authority ledger — нельзя. Межпроцессный writer fencing не заменяется одной Go mutex.

## 11. Pattern / anti-pattern: принять, изменить, отклонить

| Механизм | Решение | Причина и конкретное действие |
|---|---|---|
| Pi `AgentMessage → convertToLlm` [P1] | Принять | один boundary между каноническими событиями и provider payload |
| Pi steering/follow-up queues [P1, P3] | Изменить | durable inbox с message ID, expectedTurnID и подтверждением append |
| Codex StepContext [C2, C4] | Принять | specs и dispatch используют один immutable request snapshot |
| Pi prepareArguments/coercion [P6] | Изменить | разрешать только явную нормализацию до authority digest; иначе strict reject |
| Pi same-process extensions [P20] | Отклонить | функции hooks не являются security boundary; только out-of-process tool-skills |
| Tools и provider registration в одном API [P20] | Отклонить | credential/control plane отделить от model-visible capability plane |
| Codex approval → sandbox → attempt [C14] | Принять | policy decision перед OS execution, fail closed на отказе |
| Pi bash sandbox override [P21] | Изменить | enforcement обязателен для каждого effect provider, не только bash wrapper |
| Codex dispatch до response terminal [C2] | Отложить | M0 ждёт terminal; позднее только отдельная измеренная оптимизация |
| Pi `length` negative gate [P1, P18] | Принять | валидный усечённый аргумент всё равно не исполнять |
| Durable Pi effect_pending/replay [P14] | Изменить | replay-safe принадлежит pinned binding + receipt/reconciliation contract |
| Append-only tree и compacted projection [P5, C7] | Принять | история сохраняет provenance; projection может меняться |
| Silent malformed-line skip [P5] | Отклонить | corruption отличается от отсутствия, authority journal должен отказаться |
| Opaque signatures [P7, P8, C6] | Принять | сохранять origin/adapter scope, part order и sealed payload |
| Cross-provider flatten reasoning [P7] | Изменить | явный lossy transition, не обещание эквивалентного продолжения |
| WS cache/previous_response_id [C6, P9] | Отложить | корректный full replay сначала; prefix/account проверка потом |
| Codex UI, memories, guardian и hosted tools [C15] | Вынести | профили/Curator tool-skills или presentation, не обязательный kernel |
| Batch parallel default [P1] | Изменить | sequential default и binding-scoped concurrency с лимитом |
| Synthetic orphan result [P7] | Изменить | допустимая wire projection с явным unknown, никогда success receipt |

## 12. Один kernel, два профиля

**Worker:** один центральный typed tool-skill из Curator plan; опционально отдельная узкая операция signing. Центральный skill может иметь discriminated union операций, но не поле `command: arbitrary string` как скрытый универсальный shell. Signing принимает конкретный artifact digest и purpose, проверяет scope, возвращает ограниченную квитанцию; не отдаёт ключ и не подписывает произвольный authority grant.

**Orchestrator:** тот же kernel и тот же journal/provider abstraction; Curator устанавливает project-management, communication и sandbox tool-skills. Планирует и отправляет сообщения через эти интерфейсы. Специфика board, Slack, MCP, sandbox manager не появляется в turn reducer. Делегирование получает только подмножество parent grants и бюджета.

**Минимальные Go-пакеты, рекомендация, не код:** `session` (reducer, inbox, lifecycle), `history` (canonical entries и projections), `model` (adapter/capabilities/opaque artifacts), `invocation` (typed proposals и result correlation), `journal` (commit/recovery). Broker/installer остаются доверенным execution/control plane за отдельным интерфейсом. Не делать универсальную «plugin interface», которая одновременно получает модели, credentials, process spawn и tool registry.

Смена epoch: остановить admission новых invocations → дождаться/reconcile старые → скомпилировать/проверить новый plan → записать old/new digests и нужное approval → активировать. Разговор сохраняется; tool result старой эпохи не становится разрешением новой. Это согласуется с прочитанным Decision 0005, но конкретная реализация остаётся за последующей архитектурной задачей.

Универсальные схемы (предложения для Apiary): [границы kernel и профилей](../diagrams/research/codex-pi/kernel.svg), [допуск effect и recovery](../diagrams/research/codex-pi/recovery.svg). Исходники PlantUML расположены рядом; отдельная схема для каждой цели, без UI/provider branding.

## 13. Проверки будущей реализации и границы исследования

Следующие проверки **не запускались** и являются acceptance-предложениями для реализации:

| Вход/сбой | Проверяемое отрицательное свойство |
|---|---|
| Plain scalar schema `{type:"number", minimum:10}` на установке | M0 installer отказывает до регистрации tool |
| Object-root schema, scalar input или scalar root replacement через prepareArguments | отказ до dispatch в sequential и parallel batch |
| Разрешённая нормализация `{value:"7"}` → `{value:7}` при `minimum:10` | constraint refusal, effect count = 0; нет fallback к исходному значению |
| Если scalar-root когда-либо разрешён: `"7"` → 7 при `minimum:10`, напрямую и через prepareArguments | обе batch-ветки отказывают до execute; контроль `"12"` → 12 отделяет constraint failure от запрета любой coercion |
| Валидные arguments + terminal error/length | effect count = 0 |
| Tool binding заменён после model request | dispatch со старым plan не использует новый provider |
| Steering на старый turn | явный отказ, без скрытого нового turn |
| Crash после effect, до receipt | unknown/reconcile, не безусловный replay |
| Malformed complete JSONL row | отказ чтения, не восстановление как «пусто» |
| Torn tail | восстановление только валидного prefix с отмеченной потерей |
| Extension просит provider credential | нет такого model-visible capability |
| Cache prefix/account mismatch | full replay или typed refusal, не чужой continuation |
| Изменение opaque signature/part order | adapter reject либо явный lossy migration |
| Cancel одновременно с terminal tool result | один settled outcome, без fabricated rollback |
| Два процесса получают одну session | fencing отвергает устаревшего writer |
| MCP tools/list_changed | не расширяет epoch без plan transition |

Измеренное runtime test coverage: **не измерялось**. Выполнен статический cross-check 12/12 исследовательских тем: session/turn, events/steering, cancellation, tools/schema, context, compaction/cache, opaque state, providers/auth, approval/sandbox, extensions/config, persistence/resume, concurrency. Это coverage списка вопросов, не доля кода и не гарантия безопасности. Часть source paths прочитана выборочными диапазонами, а не целиком. Особенно не доказаны: все platform sandbox adapters, cross-process durability, account-specific entitlement, все providers, поведение каждого UI/SDK и отсутствие bypass во всём репозитории.

Внешние источники mutable; date+URL сохранены. OpenAI blog был прочитан через web tool, повторное получение через urllib вернуло HTTP 403 — локальной raw-копии этого blog нет. Это ошибка второго канала чтения, не отсутствие статьи. Устаревший `core/src/codex.rs` и старый shell handler path не найдены; чтение продолжено по реально существующим `session/*` и registry. Начальная board query `task()` отвергнута, исправлена на `get()`. Эти recovery не скрыты как успешные проверки.

## 14. Индекс прочитанных исходников

Все ссылки ниже закреплены на SHA из ledger. Идентификаторы в тексте обозначают конкретные файлы и symbols, а не README-обобщения.

| ID | Файл и permalink | Symbol / прочитанная область |
|---|---|---|
| C1 | [codex-rs/core/src/session/handlers.rs](https://github.com/openai/codex/blob/8e694e955ae02ca737230a5468c55d5847074072/codex-rs/core/src/session/handlers.rs#L529) | `submission_loop; turn_input.rs::steer (отдельная ссылка C1b)` |
| C1b | [codex-rs/core/src/session/turn_input.rs](https://github.com/openai/codex/blob/8e694e955ae02ca737230a5468c55d5847074072/codex-rs/core/src/session/turn_input.rs#L424) | `steer / steer_input` |
| C2 | [codex-rs/core/src/session/turn.rs](https://github.com/openai/codex/blob/8e694e955ae02ca737230a5468c55d5847074072/codex-rs/core/src/session/turn.rs#L163) | `run_turn; build_prompt:1393; run_sampling_request:1420; try_run_sampling_request:2280; drain_in_flight:2232` |
| C3 | [codex-rs/core/src/stream_events_utils.rs](https://github.com/openai/codex/blob/8e694e955ae02ca737230a5468c55d5847074072/codex-rs/core/src/stream_events_utils.rs#L290) | `handle_output_item_done` |
| C4 | [codex-rs/core/src/tools/parallel.rs](https://github.com/openai/codex/blob/8e694e955ae02ca737230a5468c55d5847074072/codex-rs/core/src/tools/parallel.rs#L116) | `ToolCallRuntime::handle_tool_call_with_source` |
| C5 | [codex-rs/core/src/tools/router.rs](https://github.com/openai/codex/blob/8e694e955ae02ca737230a5468c55d5847074072/codex-rs/core/src/tools/router.rs#L246) | `ToolRouter::build_tool_call / dispatch_tool_call_with_code_mode_result_inner` |
| C5b | [codex-rs/core/src/tools/registry.rs](https://github.com/openai/codex/blob/8e694e955ae02ca737230a5468c55d5847074072/codex-rs/core/src/tools/registry.rs#L495) | `ToolRegistry::dispatch_any_with_terminal_outcome` |
| C6 | [codex-rs/core/src/client.rs](https://github.com/openai/codex/blob/8e694e955ae02ca737230a5468c55d5847074072/codex-rs/core/src/client.rs#L891) | `build_responses_request; get_incremental_items:1335; stream_responses_websocket:1725` |
| C7 | [codex-rs/core/src/context_manager/history.rs](https://github.com/openai/codex/blob/8e694e955ae02ca737230a5468c55d5847074072/codex-rs/core/src/context_manager/history.rs#L327) | `History::record_items / for_prompt / replace_compacted / normalize_history` |
| C8 | [codex-rs/rollout/src/recorder.rs](https://github.com/openai/codex/blob/8e694e955ae02ca737230a5468c55d5847074072/codex-rs/rollout/src/recorder.rs#L970) | `RolloutRecorder::record_canonical_items / persist / flush / write_pending_with_recovery:1727` |
| C9 | [codex-rs/core/src/session/turn_suspension.rs](https://github.com/openai/codex/blob/8e694e955ae02ca737230a5468c55d5847074072/codex-rs/core/src/session/turn_suspension.rs#L13) | `suspend_turn_and_shutdown` |
| C10 | [codex-rs/core/src/compact.rs](https://github.com/openai/codex/blob/8e694e955ae02ca737230a5468c55d5847074072/codex-rs/core/src/compact.rs#L248) | `run_compact_task_inner_impl` |
| C11 | [codex-rs/core/src/compact_remote.rs](https://github.com/openai/codex/blob/8e694e955ae02ca737230a5468c55d5847074072/codex-rs/core/src/compact_remote.rs#L195) | `remote compaction install; process_compacted_history` |
| C12 | [codex-rs/core/tests/suite/stream_error_allows_next_turn.rs](https://github.com/openai/codex/blob/8e694e955ae02ca737230a5468c55d5847074072/codex-rs/core/tests/suite/stream_error_allows_next_turn.rs#L22) | `continue_after_stream_error (прочитан, не запущен)` |
| C13 | [codex-rs/model-provider/src/provider.rs](https://github.com/openai/codex/blob/8e694e955ae02ca737230a5468c55d5847074072/codex-rs/model-provider/src/provider.rs#L147) | `ModelProvider / ProviderCapabilities` |
| C13b | [codex-rs/model-provider/src/auth.rs](https://github.com/openai/codex/blob/8e694e955ae02ca737230a5468c55d5847074072/codex-rs/model-provider/src/auth.rs#L125) | `AuthManagerAuthProvider::is_expected_auth / current_auth` |
| C14 | [codex-rs/core/src/tools/orchestrator.rs](https://github.com/openai/codex/blob/8e694e955ae02ca737230a5468c55d5847074072/codex-rs/core/src/tools/orchestrator.rs#L121) | `ToolOrchestrator::run` |
| C16 | [codex-rs/core/src/tools/handlers/mod.rs](https://github.com/openai/codex/blob/8e694e955ae02ca737230a5468c55d5847074072/codex-rs/core/src/tools/handlers/mod.rs#L85) | `parse_arguments<T>` |
| C15 | [codex-rs/app-server/src/extensions.rs](https://github.com/openai/codex/blob/8e694e955ae02ca737230a5468c55d5847074072/codex-rs/app-server/src/extensions.rs#L57) | `thread_extensions` |
| P1 | [packages/agent/src/agent-loop.ts](https://github.com/earendil-works/pi/blob/b2602be77cb7b0de45dd616407fd210daa48aa75/packages/agent/src/agent-loop.ts#L159) | `runLoop; streamAssistantResponse; prepareToolCall; executeToolCallsSequential/Parallel; failToolCallsFromTruncatedMessage` |
| P2 | [packages/coding-agent/src/core/sdk.ts](https://github.com/earendil-works/pi/blob/b2602be77cb7b0de45dd616407fd210daa48aa75/packages/coding-agent/src/core/sdk.ts#L306) | `createAgentSession` |
| P3 | [packages/agent/src/agent.ts](https://github.com/earendil-works/pi/blob/b2602be77cb7b0de45dd616407fd210daa48aa75/packages/agent/src/agent.ts#L283) | `Agent::steer / followUp / prompt / runWithLifecycle:486 / processEvents:544` |
| P4 | [packages/coding-agent/src/core/agent-session.ts](https://github.com/earendil-works/pi/blob/b2602be77cb7b0de45dd616407fd210daa48aa75/packages/coding-agent/src/core/agent-session.ts#L542) | `_compactBeforeNextAssistantResponse / _installAgentNextTurnRefresh / _handleAgentEvent:643 / compact:1946` |
| P5 | [packages/coding-agent/src/core/session-manager.ts](https://github.com/earendil-works/pi/blob/b2602be77cb7b0de45dd616407fd210daa48aa75/packages/coding-agent/src/core/session-manager.ts#L461) | `buildSessionContext / parseSessionEntryLine:501 / _persist:1029 / branch:1374` |
| P6 | [packages/ai/src/utils/validation.ts](https://github.com/earendil-works/pi/blob/b2602be77cb7b0de45dd616407fd210daa48aa75/packages/ai/src/utils/validation.ts#L313) | `validateToolArguments` |
| P7 | [packages/ai/src/api/transform-messages.ts](https://github.com/earendil-works/pi/blob/b2602be77cb7b0de45dd616407fd210daa48aa75/packages/ai/src/api/transform-messages.ts#L70) | `transformMessages` |
| P8 | [packages/ai/src/api/openai-responses-shared.ts](https://github.com/earendil-works/pi/blob/b2602be77cb7b0de45dd616407fd210daa48aa75/packages/ai/src/api/openai-responses-shared.ts#L138) | `convertResponsesMessages; processResponsesStream / backfillReasoningSignatures:533` |
| P8b | [packages/ai/src/api/anthropic-messages.ts](https://github.com/earendil-works/pi/blob/b2602be77cb7b0de45dd616407fd210daa48aa75/packages/ai/src/api/anthropic-messages.ts#L1280) | `thinking/redacted_thinking replay; signature_delta:703` |
| P8c | [packages/ai/src/api/google-shared.ts](https://github.com/earendil-works/pi/blob/b2602be77cb7b0de45dd616407fd210daa48aa75/packages/ai/src/api/google-shared.ts#L56) | `thought-signature semantics / resolveThoughtSignature` |
| P9 | [packages/ai/src/api/openai-codex-responses.ts](https://github.com/earendil-works/pi/blob/b2602be77cb7b0de45dd616407fd210daa48aa75/packages/ai/src/api/openai-codex-responses.ts#L311) | `stream transport retry/fallback; build request:523; websocket session:1143` |
| P10 | [packages/coding-agent/src/core/compaction/compaction.ts](https://github.com/earendil-works/pi/blob/b2602be77cb7b0de45dd616407fd210daa48aa75/packages/coding-agent/src/core/compaction/compaction.ts#L202) | `estimateContextTokens / shouldCompact / findCutPoint / completeSummarization` |
| P11 | [packages/coding-agent/src/core/model-runtime.ts](https://github.com/earendil-works/pi/blob/b2602be77cb7b0de45dd616407fd210daa48aa75/packages/coding-agent/src/core/model-runtime.ts#L588) | `ModelRuntime provider resolution / streamSimple:636` |
| P11b | [packages/ai/src/providers/openai-codex.ts](https://github.com/earendil-works/pi/blob/b2602be77cb7b0de45dd616407fd210daa48aa75/packages/ai/src/providers/openai-codex.ts#L7) | `openaiCodexProvider` |
| P11c | [packages/ai/src/providers/anthropic.ts](https://github.com/earendil-works/pi/blob/b2602be77cb7b0de45dd616407fd210daa48aa75/packages/ai/src/providers/anthropic.ts#L49) | `anthropicProvider` |
| P12 | [packages/agent/src/harness/runtime/drive.ts](https://github.com/earendil-works/pi/blob/b2602be77cb7b0de45dd616407fd210daa48aa75/packages/agent/src/harness/runtime/drive.ts#L28) | `driveOperation` |
| P13 | [packages/agent/src/harness/runtime/drive/response.ts](https://github.com/earendil-works/pi/blob/b2602be77cb7b0de45dd616407fd210daa48aa75/packages/agent/src/harness/runtime/drive/response.ts#L177) | `publishResponse` |
| P13b | [packages/agent/src/harness/runtime/drive/recovery.ts](https://github.com/earendil-works/pi/blob/b2602be77cb7b0de45dd616407fd210daa48aa75/packages/agent/src/harness/runtime/drive/recovery.ts#L51) | `recoverAssistantGeneration` |
| P14 | [packages/agent/src/harness/runtime/drive/tools.ts](https://github.com/earendil-works/pi/blob/b2602be77cb7b0de45dd616407fd210daa48aa75/packages/agent/src/harness/runtime/drive/tools.ts#L187) | `publishToolIntent; prepareToolInvocation:436; recoverToolInvocation:515` |
| P15 | [packages/agent/src/harness/runtime/harness.ts](https://github.com/earendil-works/pi/blob/b2602be77cb7b0de45dd616407fd210daa48aa75/packages/agent/src/harness/runtime/harness.ts#L29) | `Harness / lane / watchSession:305` |
| P16 | [packages/agent/src/harness/runtime/lane.ts](https://github.com/earendil-works/pi/blob/b2602be77cb7b0de45dd616407fd210daa48aa75/packages/agent/src/harness/runtime/lane.ts#L1005) | `requestOperationAbort / requestAbort / prompt:1130; driveOperation call:976` |
| P17 | [packages/agent/src/harness/session/jsonl/storage.ts](https://github.com/earendil-works/pi/blob/b2602be77cb7b0de45dd616407fd210daa48aa75/packages/agent/src/harness/session/jsonl/storage.ts#L180) | `JsonlStorage open / commit / applyCommit` |
| P17b | [packages/agent/src/harness/session/mutation-line.ts](https://github.com/earendil-works/pi/blob/b2602be77cb7b0de45dd616407fd210daa48aa75/packages/agent/src/harness/session/mutation-line.ts#L2) | `MutationLine` |
| P18 | [packages/agent/test/agent-loop.test.ts](https://github.com/earendil-works/pi/blob/b2602be77cb7b0de45dd616407fd210daa48aa75/packages/agent/test/agent-loop.test.ts#L371) | `should not execute tool calls from a length-truncated assistant message` |
| P19 | [packages/coding-agent/docs/providers.md](https://github.com/earendil-works/pi/blob/b2602be77cb7b0de45dd616407fd210daa48aa75/packages/coding-agent/docs/providers.md#L15) | `Subscriptions / Claude Pro/Max / custom providers` |
| P20 | [packages/coding-agent/src/core/extensions/loader.ts](https://github.com/earendil-works/pi/blob/b2602be77cb7b0de45dd616407fd210daa48aa75/packages/coding-agent/src/core/extensions/loader.ts#L488) | `loadExtensionModule; registerTool:287 / registerProvider:430` |
| P20b | [packages/coding-agent/src/core/extensions/runner.ts](https://github.com/earendil-works/pi/blob/b2602be77cb7b0de45dd616407fd210daa48aa75/packages/coding-agent/src/core/extensions/runner.ts#L982) | `emitToolCall; bind runtime provider actions:394` |
| P21 | [packages/coding-agent/examples/extensions/sandbox/index.ts](https://github.com/earendil-works/pi/blob/b2602be77cb7b0de45dd616407fd210daa48aa75/packages/coding-agent/examples/extensions/sandbox/index.ts#L1) | `sandbox example / loadConfig` |

## 15. Logbook исследования

- 08.09.2026, revision 2: по F1 уточнён scalar early-return в Pi validation и обе production batch-ветки; предложен fail-closed object-root admission и отрицательные сценарии без исполнения upstream. Четыре файла схем перенесены побайтово в корневой `diagrams/research/codex-pi/`; остальные выводы и source snapshots сохранены.

- 08.09.2026: подтверждён canonical rename Pi, устранено предположение о неизменности старого repository name.
- 08.09.2026: разделены classic SDK и новый durable harness; `watchSession` ещё не реализован. Нельзя рекламировать весь Pi как единый durable kernel.
- 08.09.2026: зафиксирована несовместимость исторической статьи Codex с текущим WebSocket continuation path.
- 08.09.2026: late stream failure после tool item требует сохранения effects; выбрано более простое admission после terminal response для Apiary M0.
- 08.09.2026: выявлены silent JSONL skip в classic Pi и потеря process-local pending inputs при Codex suspend; отклонено их использование как модели строгого authority ledger.
- 08.09.2026: subscription authentication отделена от entitlement/billing; документы Pi и Anthropic Agent SDK относятся к разным интеграционным поверхностям. Автоматический перенос условий запрещён.

Отдельного доступного logbook CLI/MCP в сессии не обнаружено; этот раздел — task-scoped logbook, копия ключевых событий передаётся через board notes. Ни один нормативный документ и чужой файл не изменён.

## 16. Выполненная проверка артефактов

Следующая таблица сохраняет evidence revision 1; rendering в revision 2 не повторялся, поскольку содержимое четырёх diagram files не изменено. Старые пути в командах — исторические пути запуска, текущие артефакты находятся в `diagrams/research/codex-pi/`. Все validation-команды запущены отдельно, без pipe/tee. Исходники внешних проектов не исполнялись.

| Команда | Реальный exit code | Что проверено / ограничение |
|---|---:|---|
| `python3 .temp/TASK-260908-1v88g1/verify_report.py` | 0 | пути и line anchors, SHA pins, чистота snapshots, XML и относительные ссылки; не semantic proof |
| `plantuml -tsvg .research/260908_codex-pi-diagrams/kernel.puml .research/260908_codex-pi-diagrams/recovery.puml` | 0 | обе SVG схемы отрендерены |
| `plantuml -tpng ... -o ../../.temp/TASK-260908-1v88g1/diagram-preview` | 0 | PNG preview для визуальной проверки |
| `git diff --check` | 0 | tracked diff без whitespace errors; новые untracked документы этой командой не покрываются |

Обе схемы просмотрены визуально: русские подписи читаются, стрелки и условные блоки не обрезаны. Исходники и SVG — deliverables, PNG preview — scratch. Численная проверка source paths/anchors записана в `report-verification-02.log`; каждый проверенный путь ссылается на существующий файл, но авторитетность смыслового вывода остаётся предметом review. Snapshot ledger и логи входят в task-scoped evidence bundle, полные клоны остаются в `.temp`.

### Узкая перепроверка revision 2

Самостоятельно повторены `python3 .temp/TASK-260908-1v88g1/verify_report.py` (exit 0: 47/47 прежних anchors, 2/2 pinned HEAD и clean snapshots, 2/2 SVG XML и relocated links), `python3 .temp/TASK-260908-1v88g1/rev2/check_delta.py` (exit 0: 4/4 неизменных SHA-256 схем, отсутствие старого каталога, 7/7 новых F1 anchors, 3/3 текстовых deliverables без trailing whitespace) и `git diff --check` (exit 0, untracked файлы не покрывает). Это проверки целостности артефактов, не семантическое доказательство и не запуск отрицательных runtime-тестов. Rendering и визуальная проверка приняты из evidence revision 1; исходники схем и SVG побайтово сохранены. Логи revision 2 и обновлённый checker включены в evidence bundle. Новое web-исследование не проводилось; прежние source snapshots и ledger сохранены.
