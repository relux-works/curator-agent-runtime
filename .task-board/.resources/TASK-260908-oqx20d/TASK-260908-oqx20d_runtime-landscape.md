# Ландшафт coding-agent runtime и SDK: последствия для Apiary

Дата получения источников: **8 сентября 2026**. Задача: `TASK-260908-oqx20d`, история: `STORY-260908-27xtpm`. Статус документа: исследовательский материал для review; нормативные протоколы не изменены.

## Вывод для проектирования

**Рекомендация:** одно небольшое Go-ориентированное ядро для worker и orchestrator, без встроенных model-visible tools. Заимствовать механизмы, а не целиком один framework: компактный цикл mini-SWE/Pi, фазовые события и упорядоченную фиксацию DeepSeek Harness, разделение ядра/host в Cline, явные checkpoint identities из LangGraph/MAF. Конкретные ссылки и границы доказательств приведены ниже; это проектная рекомендация, а не измеренный результат реализации Apiary.

Worker получает один центральный typed tool-skill, при необходимости отдельную узкую signing-привязку. Orchestrator получает установленные Curator project-management, communication и sandbox tool-skills. Model provider и credential broker — отдельный host-side путь. MCP живёт только во внешних Curator-installed wrappers. Ни имя tool, ни JSON Schema, ни Cordis scope сами по себе не дают полномочий.

## Метод и проверяемая граница

Обзор охватывает 28 pinned репозиториев: 26 с чтением production-кода и два репозитория только по README; дополнительно четыре закрытых среды по первичной документации. Отбор намеренно охватывает разные механизмы: последовательный action/observation, interactive scheduler, код как действие, event log, plugin composition, actor/message runtime, durable graph, typed SDK и control-plane shell. Список не является переписью всех агентов или рейтингом популярности.

SHA фиксирует default-branch snapshot, **не обещает стабильный релиз**. GitHub API использован для canonical repository, archive flag, commit и дерева; после анонимного HTTP 403 оставшиеся восемь snapshot (и четыре дополнительных репозитория) получены через `git clone --depth=1 --filter=blob:none --no-checkout`. Для них archive flag оставлен `null`, а не выдуман. Читались raw-файлы по SHA и сохранённые фрагменты с номерами строк. Ни install scripts, ни тесты, ни код исследованных проектов не запускались.

Машиночитаемый [каталог](260908_source-catalog.json) хранит полные SHA, даты commit/retrieval, file hashes, реально рассмотренные диапазоны, permalinks, матрицу, рекомендации и неизвестное. **D0** — только документы; **D1** — выборочные фрагменты реализации; **D2** — частично прослежены связанные участки цикла и tools/context/state; **D3** — исполненная проверка, в этом исследовании её нет. D2 не означает полного чтения файлов, security audit, conformance или доказательства crash safety. Скачанный, но не прочитанный файл не повышает глубину.

В таблицах: утверждения о конкретных вызовах — статические наблюдения; слова «документация» обозначают заявление первичного источника; adoption/rejection — наши рекомендации. «Не установлено» означает пробел чтения, а не отсутствие функции. Независимые гарантии внешних эффектов не установлены ни для одного из 26 source-inspected runtime: **0/26 проверенных через crash/fault-injection эксперименты**, а не «26 систем небезопасны».

## Актуальные имена и преемники

- OpenCode: canonical repository `anomalyco/opencode`, default branch `dev`; прежнее имя `sst/opencode` нельзя закреплять как текущий источник. [S03](#s03).
- Goose: запрос `block/goose` разрешился в `aaif-goose/goose`; README указывает AAIF. [S09](#s09).
- OpenHands/OpenHands сейчас представляет Agent Canvas; agent implementation исследована отдельно в `OpenHands/software-agent-sdk`. Не смешивать UI/control plane и SDK. [S04](#s04), [S05](#s05).
- Roo Code: API `archived=true`; README сообщает закрытие extension 15 мая и предлагает Cline и community fork ZooCode. Continue: API `archived=false`, но README явно сообщает read-only и прекращение active maintenance. Эти два сигнала хранятся раздельно. [S11](#s11), [S12](#s12).
- AutoGen находится в maintenance mode, README направляет новых пользователей к Microsoft Agent Framework. У MAF уже есть отдельный Go SDK по ссылке README; его source parity здесь не установлена. [S15](#s15), [S16](#s16).
- Gemini CLI и Qwen Code прочитаны по текущим SHA. Утверждение локального workflow skill о замене Gemini CLI на Antigravity не подтверждено рассмотренными первичными материалами и не использовано как факт о продукте.
- mini-SWE-agent — текущая v2 по README. Исторические заявления о v1 не перенесены на исследованный snapshot. [S07](#s07).
- DeepSeek Harness найден через [официальную страницу DeepSeek](https://www.deepseek.com/harness/en/), которая указывает canonical repository. Сторонние сайты со сходным названием не использовались. [S13](#s13).

## Матрица: цикл, provider, tools и context

Ссылки Sxx ведут к pinned evidence и индивидуальному решению. Наличие интерфейса provider не доказывает одинаковую семантику всех backend.

| Система / глубина | Цикл | Provider portability | Tool/plugin boundary | Context |
|---|---|---|---|---|
| [Gemini CLI](#s01) / D2 | GeminiClient → Turn; отдельный Scheduler | Gemini-ориентированный ContentGenerator; иные адаптеры здесь не проверены | Реестр tools, policy/confirmation и executor | renderHistory, отдельные display/API представления, compression и masking |
| [Qwen Code](#s02) / D2 | LlmClient; типы интеракций UserQuery, Retry, Goal, Teammate | Фабрика отдельно выбирает OpenAI, Qwen OAuth, Anthropic, Gemini/Vertex | Конфигурация generator отделена от model-visible tools; полный registry не прочитан | История LlmChat и prompt override; compaction call path прочитан частично |
| [OpenCode](#s03) / D1 | Effect Layer SessionProcessor, внедрение service зависимостей | LLM.Service; provider реализации не аудированы | Permission.Service и Plugin.Service в processor | Summary и needsCompaction присутствуют в состоянии |
| [OpenHands Agent Canvas](#s04) / D0 | Документация: control center над agent backends | Документация: ACP и разные agents | Внутренние source boundaries не исследованы | Не установлено |
| [OpenHands Software Agent SDK](#s05) / D2 | Agent.step: unmatched actions, затем condensation и model completion | LLM объект плюс per-conversation call_context | tools_map передаётся make_llm_completion; обработка malformed calls | Condenser создаёт отдельное событие до новой генерации |
| [SWE-agent](#s06) / D2 | run → step → forward_with_handling; сохраняет trajectory после шага | model объект; конкретные backend в этом проходе не читались | ToolConfig bundles, parser и bash | messages и trajectory раздельны |
| [mini-SWE-agent v2](#s07) / D2 | run → step → execute_actions(query()); terminal message role exit | model.format_message и query: интерфейс сменяемый | Один shell-oriented environment adapter | Линейный список messages |
| [Aider](#s08) / D2 | Coder.run/run_one в интерактивном цикле | main_model; provider implementation не исследован | Coder и команды приложения, не универсальная tool-skill граница | RepoMap строит weighted MultiDiGraph и PageRank по symbols/references |
| [Goose (AAIF)](#s09) / D1 | reply → reply_impl; отдельный state-machine entry | Provider под async lock; docs описывают API и ACP providers | Docs: MCP extensions; внутренний extension manager не прочитан | Сообщение добавляется session_manager до ответа |
| [Cline SDK и клиенты](#s10) / D2 | Общий AgentRuntime, host SessionRuntime и разные клиенты | Генерация через model adapter; provider-owned activity отдельно от tool calls | ContributionRegistry расширений; prepareToolExecution перед dispatch | Overflow recovery; host messageBuilder и ConversationStore |
| [Roo Code (архив)](#s11) / D1 | Task цикл вызывает recursivelyMakeClineRequests с явным stack | Anthropic-shaped content; полный список provider не проверен | Task и встроенные tools; registry здесь не прочитан | nextUserContent и file details на первом запросе |
| [Continue (не поддерживается)](#s12) / D1 | Agent loop не прочитан; исследован tool dispatch | Не установлено в source pass | URI router: HTTP/HTTPS/MCP; отдельные built-ins | Tool возвращает ContextItem[] |
| [DeepSeek Harness](#s13) / D2 | Loop сам plugin; turn/start, step/start, assistant/message, tool calls | llm.stream/ preparedCall.stream отдельно от tools; docs: model adapters plugins | Cordis Service, scoped tool layers и prepare/dispatch/finalize | systemPrompt.assemble и deriveMessages; next-step/next-turn inbox |
| [LangGraph](#s14) / D2 | Pregel tasks, tick, channels и versions_seen | Graph не равен provider API; adapters не прочитаны | Node callable; tool adapters здесь не проверены | Channel values в checkpoint и отдельные pending writes |
| [AutoGen (maintenance)](#s15) / D1 | Очередь сообщений, _process_next и stop_when_idle | Model implementation за пределами прочитанного runtime | Agent messages/intervention; tool boundary не исследован | Agent-owned state; полноценный context путь неизвестен |
| [Microsoft Agent Framework](#s16) / D2 | Supersteps до convergence; максимальное число итераций | README: несколько provider; реализации не прочитаны | Executor edges; tools отдельного агента не исследованы | Committed workflow state, pending request-info events |
| [PydanticAI](#s17) / D1 | ModelRequestNode/CallToolsNode, message history cleanup | model.request и отдельный temporal model override | Toolsets и DeferredToolResults в run API | Repair dangling calls различает interrupted и complete |
| [smolagents](#s18) / D2 | MultiStepAgent, CodeAgent извлекает code blob и вызывает executor | Model abstraction; adapters не аудированы | Python code action; tools передаются executor | Agent memory и state доступны коду |
| [OpenAI Agents SDK (Python)](#s19) / D2 | Run loop с guardrails, turn state и resume | Provider lifecycle вынесен в модуль; адаптеры не аудированы | FunctionTool с enabled-set проверкой, approval и tool context | Session protocol get/add/pop/clear для истории |
| [Google ADK (Python)](#s20) / D2 | LlmFlow generator, callbacks и events | LlmRequest/LlmResponse; перечень adapters не проверен | Plugin callbacks могут вернуть response при model error | InvocationContext и session state delta |
| [CrewAI](#s21) / D1 | invoke → _invoke_loop; max iterations и RPM guard | BaseLLM в loop | Native tool calls передаются _handle_native_tool_calls | messages, memory save и human feedback |
| [Strands Agents](#s22) / D1 | event_loop_cycle плюс model retry hooks | agent.model; реальные adapters не прочитаны | Tool execution есть в контракте цикла; dispatcher не прослежен | Messages и invocation_state |
| [Mastra](#s23) / D1 | Фабрика DurableAgent и workflow execution engine | Agent объект в wrapper; provider не прочитан | TTools generic; execution implementation не прочитана | Не установлено |
| [Pi](#s24) / D2 | Общий runLoop для начального и продолжаемого запуска; follow-up/steering boundaries | StreamFn и model config отделены от context | Tool calls исполняются после завершённого assistant response | prepareNextTurn заменяет context/model; отдельный LLM projection |
| [OpenClaw](#s25) / D1 | Gateway handler → preflight → startTurn; отдельный agent-core runLoop | Docs: src/llm и plugin SDK transport; source adapters не проверены | Plugin SDK facade; tools принадлежат OpenClaw, а не внешнему Pi package | Steering, turn taint и compaction helpers |
| [Letta / MemGPT landing repository](#s26) / D0 | Текущий README направляет к letta-code | Не установлено | Не установлено | Stateful memory заявлена |
| [Letta Code / актуальный Letta harness](#s27) / D1 | Цикл не инспектировался; исследована MemFS граница | Не установлено | Memory helpers и backend capability; tool execution не инспектировался | Agent-scoped memory directory; local/cloud backend различены |
| [LangChain deepagents](#s28) / D1 | create_deep_agent собирает middleware и вызывает LangChain create_agent | model передаётся underlying agent | Profile/custom middleware, HITL, tool exclusion применяется последним | Memory backend.download_files; missing отличён от ошибки чтения |

## Матрица: восстановление, параллелизм и цена границы

Overhead ниже — качественная архитектурная оценка, без benchmark. Нативный язык не доказывает низкий RSS; Python/Node не доказывают неприемлемую задержку.

| Система | Durable recovery | Concurrency | Security boundary | Переносимость и overhead |
|---|---|---|---|---|
| [Gemini CLI](#s01) | resumeChat есть; атомарность внешних эффектов не установлена | Группировка соседних parallel calls; edit tools последовательны | Policy до исполнения; отсутствие wait_for_previous по умолчанию разрешает parallel | TypeScript; перенос логики потребует Go-реализации, latency не измерялась |
| [Qwen Code](#s02) | Session swap/telemetry state виден; crash recovery эффектов неизвестен | Teammate/Goal типы не являются доказательством независимого scheduler | validateModelConfig до создания; отсутствие authType отклоняется | Lazy imports provider реализации; величина выигрыша старта неизвестна |
| [OpenCode](#s03) | Snapshot до stream; Database.Service; гарантия replay неизвестна | AI SDK может исполнять tools до start-step event | Положение snapshot учитывает ранние эффекты; полный permission путь не прочитан | TypeScript/Effect; для Go полезны границы сервисов, не прямая зависимость |
| [OpenHands Agent Canvas](#s04) | Always-on заявлен документацией; storage не проверен | Командная автоматизация заявлена, scheduler не прочитан | README предупреждает о полном доступе при запуске без sandbox | UI/server продукт; не минимальное ядро |
| [OpenHands Software Agent SDK](#s05) | Event log с lock, проверкой duplicate ID/parent и индексом | Lock на append; параллельность внешних действий не установлена | Невалидные ID/parent отклоняются; policy полнота не проверена | Python SDK; agent server позволяет отделить среду, его стоимость не измерена |
| [SWE-agent](#s06) | save_trajectory после действия; crash gap остаётся неисследованным | Основной run последователен | Blocklist предназначен для неподдерживаемых команд; не sandbox | Python и SWEEnv; полезен как экспериментальный harness, не готовая Go библиотека |
| [mini-SWE-agent v2](#s07) | save в finally каждого шага; транзакция эффекта не установлена | Показанный run синхронный последовательный | LocalEnvironment запускает команду с os.environ; это не изоляция | Небольшая композиция Python; dependency closure и скорость не измерены |
| [Aider](#s08) | commit_before_message виден; внешняя effect durability неизвестна | Основной run последовательный; фоновые механизмы не проверены | Контроль редактирования не равен OS sandbox; security не оценена | Python, tree-sitter/graph processing; repo-map имеет вычислительную цену без измерения |
| [Goose (AAIF)](#s09) | Session manager сохраняет message; ACP docs отдельно запрещают resume/fork | try_start_turn и tokio task для имени сессии; tool scheduler неизвестен | Turn coordination есть; sandbox enforcement не аудирован | Rust; нативность не устраняет цену внешних MCP/ACP процессов |
| [Cline SDK и клиенты](#s10) | restore принимает сообщения; persistence service в host, гарантия effects неизвестна | Режим parallel использует Promise.all; также sequential | Повторный run при running отклоняется; prepare всех вызовов не доказывает freshness на dispatch | TypeScript SDK; текущий Cline нельзя описывать только как VS Code extension |
| [Roo Code (архив)](#s11) | Shadow git checkpoints — снимки workspace | Основной цикл последовательный; остальное неизвестно | Защита home/Desktop/Documents/Downloads в checkpoint ctor | TypeScript и IDE integration; архивный donor требует самостоятельного сопровождения |
| [Continue (не поддерживается)](#s12) | Не установлено | Не установлено | Отсутствующее MCP connection вызывает ошибку; общая изоляция неизвестна | TypeScript/IDE stack; README объявляет read-only и отсутствие active maintenance |
| [DeepSeek Harness](#s13) | Session append boundaries; filesystem durability и reconciliation не доказаны | Bounded rolling pool, exclusive barriers, model-order commit, drain при сбое | Same-process context и plugin callbacks не самостоятельная граница полномочий | Node/TypeScript+Cordis; sdk-minimal отдельный профиль; overhead не измерен |
| [LangGraph](#s14) | Checkpoint namespace/ID, channel versions, pending writes | FuturesDict, task commit и retry | Replay не атомарен с произвольным внешним эффектом; sandbox не исследован | Python graph runtime; больше state model, чем нужно одному worker loop |
| [AutoGen (maintenance)](#s15) | Join/drain не доказывает durable queue | Asyncio очередь; shutdown/join управляют остановкой | Intervention warning при None; авторизация сообщений не аудирована | Python; actor abstraction добавляет маршрутизацию и lifecycle |
| [Microsoft Agent Framework](#s16) | Checkpoint chain и graph_signature_hash в контракте | Параллельные edges; порядок сообщений внутри edge сохраняется | Cancellation дочерней iteration task; topology hash не доказательство trust | Python/.NET; README отдельно ссылается на Go SDK, он здесь docs-only |
| [PydanticAI](#s17) | Temporal wrapper отдельно; generic cancellation_token отвергается | Параллелизм tools в этом проходе не прочитан | Синтетическое закрытие dangling calls не attestation эффекта | Python typing/graph; Temporal — дополнительный backend, не бесплатная durability |
| [smolagents](#s18) | Восстановление внешних effects не установлено | Managed agents с remote executor отклоняются данным кодом | LocalPythonExecutor — отдельный режим от Docker/E2B/Modal/Blaxel; security proof нет | Python execution увеличивает выразительность и доверенную поверхность |
| [OpenAI Agents SDK (Python)](#s19) | Session — история; durable execution эффектов не следует из этого API | Task slots, drain, cancellation и sibling failure | Disabled configured tool отклоняется; sequential input guardrails до sandbox preparation | Python; hosted provider tools требуют отдельной политики, Go binding не исследован |
| [Google ADK (Python)](#s20) | DB append с session lock/row lock; partial events не сохраняются | ParallelAgent объединяет generators и пропускает уже завершённых детей | Missing session отклоняется; callback policy не доказывает sandbox | Python async+SQLAlchemy DB layer; Go ADK не исследован |
| [CrewAI](#s21) | _resuming сохраняет in-memory путь; durable Flow backend не прочитан | Не установлено; роль/crew не доказательство parallel scheduler | ask_for_human_input — interaction, не capability grant | Python; Flow re-export поверх RuntimeFlow, не маленькое ядро |
| [Strands Agents](#s22) | Checkpoint в stop payload; storage/replay не проверены | Swarm проверяет handoff/iteration/timeout bounds | BeforeModelCall может cancel; Swarm TODO о cancellation требует внимания | Python async; swarm control plane отдельно от одиночного loop |
| [Mastra](#s23) | Engine различает persisted suspended/paused/running; backend не проверен | Не установлено | Process-local lastPersistedStatus не является durable authority | TypeScript с cache/pubsub в durable factory; эксплуатационная цена не измерена |
| [Pi](#s24) | JSONL session loader; malformed lines пропускаются | Steering между turns; scheduler tools не исследован | При stopReason length tool calls не исполняются | TypeScript; хороший образец decomposition, не готовая Go dependency |
| [OpenClaw](#s25) | Aborted outcome фиксируется в loop; session storage не проверен | Gateway admission guard передаётся startTurn; scheduling глубже не читался | Проверка params и capture principal видны; полнота authority неизвестна | TypeScript gateway+channels; большой host surface полезен orchestrator, избыточен worker |
| [Letta / MemGPT landing repository](#s26) | Старый V1 server оставлен в archive branch | Не установлено | README запрещает production use неподдерживаемой archive версии | Landing page не runnable runtime |
| [Letta Code / актуальный Letta harness](#s27) | MemFS использует локальный git repository либо clone/pull remote | Memory concurrent write semantics не установлена | Получение memory directory не доказательство изоляции файлов или trust | TypeScript и git-backed memory; синхронизация — дополнительный lifecycle |
| [LangChain deepagents](#s28) | checkpointer и store передаются дальше; собственный effects recovery не доказан | Subagent middleware существует; scheduler не прослежен | Memory read errors кроме file_not_found вызывают ValueError; tool exclusion order виден | Python, слои LangChain/LangGraph; готовые features увеличивают dependency closure |

## Индивидуальные решения и pinned evidence

Permalinks указывают прочитанный фрагмент; весь диапазон чтения и SHA-256 файлов — в JSON. Символы указаны как navigation anchors, не как заявление полного аудита их тела.

<a id="s01"></a>
### S01. Gemini CLI — D2

**Наблюдение:** GeminiClient → Turn; отдельный Scheduler; Реестр tools, policy/confirmation и executor.

**Принять:** Разделить render context, проверку вызова и исполнение; явно моделировать awaiting approval. **Отклонить:** Не переносить default-parallel по аргументу модели: разрешение параллелизма выводить из доверенного effect plan.

**Граница:** Внутренние реализации policy и storage не аудированы; наличие guard не доказывает его полноту.

**Рассмотренные символы:** `GeminiClient.processTurn`, `Scheduler._processNextItem`.

- [packages/core/src/core/client.ts](https://github.com/google-gemini/gemini-cli/blob/85aca163f6c73ac6ce380b5447359146b8adcae4/packages/core/src/core/client.ts#L614-L702).
- [packages/core/src/scheduler/scheduler.ts](https://github.com/google-gemini/gemini-cli/blob/85aca163f6c73ac6ce380b5447359146b8adcae4/packages/core/src/scheduler/scheduler.ts#L450-L578).
- [README.md](https://github.com/google-gemini/gemini-cli/blob/85aca163f6c73ac6ce380b5447359146b8adcae4/README.md#L1-L41).

Pinned commit: `85aca163f6c73ac6ce380b5447359146b8adcae4`; commit date: 2026-09-04T18:05:05Z.

<a id="s02"></a>
### S02. Qwen Code — D2

**Наблюдение:** LlmClient; типы интеракций UserQuery, Retry, Goal, Teammate; Конфигурация generator отделена от model-visible tools; полный registry не прочитан.

**Принять:** Явная provider factory, происхождение конфигурации и отказ при неполной identity. **Отклонить:** Не копировать OAuth cache в tool-skills и не принимать ветку OAuth за право любого клиента использовать подписку.

**Граница:** Фактические квоты и entitlement конкретного аккаунта не проверялись; auth code не является условиями обслуживания.

**Рассмотренные символы:** `LlmClient.sendMessageStream`, `createContentGenerator`.

- [packages/core/src/core/client.ts](https://github.com/QwenLM/qwen-code/blob/f1ed3bc31a2b618072dbd3c8d9ee3e04f48416d1/packages/core/src/core/client.ts#L2826-L2880).
- [packages/core/src/core/contentGenerator.ts](https://github.com/QwenLM/qwen-code/blob/f1ed3bc31a2b618072dbd3c8d9ee3e04f48416d1/packages/core/src/core/contentGenerator.ts#L502-L595).
- [README.md](https://github.com/QwenLM/qwen-code/blob/f1ed3bc31a2b618072dbd3c8d9ee3e04f48416d1/README.md#L24-L64).

Pinned commit: `f1ed3bc31a2b618072dbd3c8d9ee3e04f48416d1`; commit date: 2026-09-07T16:33:50Z.

<a id="s03"></a>
### S03. OpenCode — D1

**Наблюдение:** Effect Layer SessionProcessor, внедрение service зависимостей; Permission.Service и Plugin.Service в processor.

**Принять:** Фиксировать исходное состояние до передачи управления SDK, который может сам запускать tools. **Отклонить:** Не считать streaming event start-step надёжной границей авторизации; не переносить широкий frontend/backend stack в worker.

**Граница:** packages/core/src/session/prompt.ts оказался только re-export; это не чтение реализации prompt loop.

**Рассмотренные символы:** `SessionProcessor.create`.

- [packages/core/src/session/prompt.ts](https://github.com/anomalyco/opencode/blob/ecbc6ccac85b3e8087b6445e584318419b9e2b34/packages/core/src/session/prompt.ts#L1-L1).
- [packages/opencode/src/session/processor.ts](https://github.com/anomalyco/opencode/blob/ecbc6ccac85b3e8087b6445e584318419b9e2b34/packages/opencode/src/session/processor.ts#L77-L120).
- [README.md](https://github.com/anomalyco/opencode/blob/ecbc6ccac85b3e8087b6445e584318419b9e2b34/README.md#L1-L41).

Pinned commit: `ecbc6ccac85b3e8087b6445e584318419b9e2b34`; commit date: 2026-09-07T16:21:14Z.

<a id="s04"></a>
### S04. OpenHands Agent Canvas — D0

**Наблюдение:** Документация: control center над agent backends; Внутренние source boundaries не исследованы.

**Принять:** Отделять control plane от исполняющего runtime. **Отклонить:** Не ссылаться на старый монолит OpenHands как на текущую реализацию agent loop.

**Граница:** Только README этого репозитория; исходники runtime исследованы отдельно в software-agent-sdk.

**Рассмотренные символы:** `README: Agent Canvas`.

- [README.md](https://github.com/OpenHands/OpenHands/blob/f7fb0c4b21f5ed726edbba8a6309634ef434b004/README.md#L33-L46).

Pinned commit: `f7fb0c4b21f5ed726edbba8a6309634ef434b004`; commit date: 2026-09-05T21:28:27Z.

<a id="s05"></a>
### S05. OpenHands Software Agent SDK — D2

**Наблюдение:** Agent.step: unmatched actions, затем condensation и model completion; tools_map передаётся make_llm_completion; обработка malformed calls.

**Принять:** Отдельные события context condensation и строгая идентичность/parent у журналируемых записей. **Отклонить:** Не приравнивать unmatched action к безопасному повтору: нужен receipt или reconciliation внешнего эффекта.

**Граница:** Реализация fs.write, fsync и failure injection не проверены; persisted log не доказательство exactly-once.

**Рассмотренные символы:** `Agent.step`, `EventLog.append`.

- [openhands-sdk/openhands/sdk/agent/agent.py](https://github.com/OpenHands/software-agent-sdk/blob/df2ea8fa5542d5d2a543e108bc8b2d4fbbab34b1/openhands-sdk/openhands/sdk/agent/agent.py#L678-L750).
- [openhands-sdk/openhands/sdk/conversation/event_store.py](https://github.com/OpenHands/software-agent-sdk/blob/df2ea8fa5542d5d2a543e108bc8b2d4fbbab34b1/openhands-sdk/openhands/sdk/conversation/event_store.py#L225-L270).
- [README.md](https://github.com/OpenHands/software-agent-sdk/blob/df2ea8fa5542d5d2a543e108bc8b2d4fbbab34b1/README.md#L3-L43).

Pinned commit: `df2ea8fa5542d5d2a543e108bc8b2d4fbbab34b1`; commit date: 2026-09-07T12:37:57Z.

<a id="s06"></a>
### S06. SWE-agent — D2

**Наблюдение:** run → step → forward_with_handling; сохраняет trajectory после шага; ToolConfig bundles, parser и bash.

**Принять:** Явные StepOutput и отдельная запись observation/trajectory. **Отклонить:** Blocklist shell-команд не принимать за capability enforcement; не распространять provider env в sandbox.

**Граница:** ToolConfig сам предупреждает о debug-логировании propagate_env_variables; реальных секретов не читали.

**Рассмотренные символы:** `DefaultAgent.step`, `DefaultAgent.run`, `ToolConfig`.

- [sweagent/agent/agents.py](https://github.com/SWE-agent/SWE-agent/blob/3ea751c087f32b16e039a2233dd6eefecef325d5/sweagent/agent/agents.py#L1235-L1294).
- [sweagent/tools/tools.py](https://github.com/SWE-agent/SWE-agent/blob/3ea751c087f32b16e039a2233dd6eefecef325d5/sweagent/tools/tools.py#L73-L116).
- [README.md](https://github.com/SWE-agent/SWE-agent/blob/3ea751c087f32b16e039a2233dd6eefecef325d5/README.md#L123-L145).

Pinned commit: `3ea751c087f32b16e039a2233dd6eefecef325d5`; commit date: 2026-07-16T15:21:18Z.

<a id="s07"></a>
### S07. mini-SWE-agent v2 — D2

**Наблюдение:** run → step → execute_actions(query()); terminal message role exit; Один shell-oriented environment adapter.

**Принять:** Минимальность цикла и отдельный environment adapter — ближайший структурный образец worker. **Отклонить:** Заменить произвольный локальный shell центральным typed tool-skill; не наследовать весь env процесса.

**Граница:** Текущий README явно v2; нельзя переносить рассказы о v1 или рекламные числа на этот SHA.

**Рассмотренные символы:** `DefaultAgent.run`, `DefaultAgent.step`, `LocalEnvironment.execute`.

- [src/minisweagent/agents/default.py](https://github.com/SWE-agent/mini-swe-agent/blob/04d809ceab9df28f9adaed044884180159172930/src/minisweagent/agents/default.py#L86-L137).
- [src/minisweagent/environments/local.py](https://github.com/SWE-agent/mini-swe-agent/blob/04d809ceab9df28f9adaed044884180159172930/src/minisweagent/environments/local.py#L11-L60).
- [README.md](https://github.com/SWE-agent/mini-swe-agent/blob/04d809ceab9df28f9adaed044884180159172930/README.md#L15-L55).

Pinned commit: `04d809ceab9df28f9adaed044884180159172930`; commit date: 2026-09-03T05:05:59Z.

<a id="s08"></a>
### S08. Aider — D2

**Наблюдение:** Coder.run/run_one в интерактивном цикле; Coder и команды приложения, не универсальная tool-skill граница.

**Принять:** Repo-map как ограниченный, кэшируемый context artifact отдельного skill. **Отклонить:** Не помещать индексатор репозитория и git-операции в общий worker kernel.

**Граница:** Польза PageRank для задач Apiary не измерялась; это кандидат для эксперимента, не доказанный выигрыш.

**Рассмотренные символы:** `Coder.run`, `RepoMap.get_ranked_tags`.

- [aider/coders/base_coder.py](https://github.com/Aider-AI/aider/blob/5dc9490bb35f9729ef2c95d00a19ccd30c26339c/aider/coders/base_coder.py#L857-L917).
- [aider/repomap.py](https://github.com/Aider-AI/aider/blob/5dc9490bb35f9729ef2c95d00a19ccd30c26339c/aider/repomap.py#L470-L530).

Pinned commit: `5dc9490bb35f9729ef2c95d00a19ccd30c26339c`; commit date: 2026-05-22T14:02:20Z.

<a id="s09"></a>
### S09. Goose (AAIF) — D1

**Наблюдение:** reply → reply_impl; отдельный state-machine entry; Docs: MCP extensions; внутренний extension manager не прочитан.

**Принять:** Нативный runtime может иметь отдельный provider layer и session lifecycle. **Отклонить:** Не встраивать MCP в kernel и не считать ACP provider чистым inference adapter: он запускает другой агент.

**Граница:** Канонический repo получен redirect GitHub API: aaif-goose/goose; ACP ограничения docs могут меняться.

**Рассмотренные символы:** `Agent.reply`, `Agent.reply_with_state_machine`.

- [crates/goose/src/agents/agent.rs](https://github.com/aaif-goose/goose/blob/5e90925962f05acf8e255032de44d16c4a7768a2/crates/goose/src/agents/agent.rs#L2018-L2061).
- [README.md](https://github.com/aaif-goose/goose/blob/5e90925962f05acf8e255032de44d16c4a7768a2/README.md#L25-L63).

Pinned commit: `5e90925962f05acf8e255032de44d16c4a7768a2`; commit date: 2026-09-05T02:25:17Z.

<a id="s10"></a>
### S10. Cline SDK и клиенты — D2

**Наблюдение:** Общий AgentRuntime, host SessionRuntime и разные клиенты; ContributionRegistry расширений; prepareToolExecution перед dispatch.

**Принять:** Один core с host-owned context и разными профилями; отдельно учитывать provider-side tools. **Отклонить:** Не включать provider-executed tool activity как обычный повторяемый локальный call; parallel без effect conflicts недостаточен.

**Граница:** prepareToolExecution прочитан лишь начальный участок; полнота permission paths не утверждается.

**Рассмотренные символы:** `AgentRuntime.execute`, `AgentRuntime.executeToolCalls`, `SessionRuntime`.

- [sdk/packages/agents/src/agent-runtime.ts](https://github.com/cline/cline/blob/c21b17255b228e88a1518c18a73a473ee5876362/sdk/packages/agents/src/agent-runtime.ts#L1630-L1685).
- [sdk/packages/core/src/runtime/orchestration/session-runtime-orchestrator.ts](https://github.com/cline/cline/blob/c21b17255b228e88a1518c18a73a473ee5876362/sdk/packages/core/src/runtime/orchestration/session-runtime-orchestrator.ts#L303-L346).
- [README.md](https://github.com/cline/cline/blob/c21b17255b228e88a1518c18a73a473ee5876362/README.md#L107-L147).

Pinned commit: `c21b17255b228e88a1518c18a73a473ee5876362`; commit date: 2026-09-07T01:36:42Z.

<a id="s11"></a>
### S11. Roo Code (архив) — D1

**Наблюдение:** Task цикл вызывает recursivelyMakeClineRequests с явным stack; Task и встроенные tools; registry здесь не прочитан.

**Принять:** Изучать UX обратимого редактирования как отдельную функцию оболочки. **Отклонить:** Не выбирать архивный Task монолит базой нового Go kernel.

**Граница:** README сообщает закрытие 15 мая и указывает ZooCode community fork; качество/актуальность fork не проверены.

**Рассмотренные символы:** `Task.recursivelyMakeClineRequests`, `ShadowCheckpointService`.

- [src/core/task/Task.ts](https://github.com/RooCodeInc/Roo-Code/blob/b867ec9145750d0ae1ff7f02d35406e9bf2a0b16/src/core/task/Task.ts#L2760-L2803).
- [src/services/checkpoints/ShadowCheckpointService.ts](https://github.com/RooCodeInc/Roo-Code/blob/b867ec9145750d0ae1ff7f02d35406e9bf2a0b16/src/services/checkpoints/ShadowCheckpointService.ts#L77-L120).
- [README.md](https://github.com/RooCodeInc/Roo-Code/blob/b867ec9145750d0ae1ff7f02d35406e9bf2a0b16/README.md#L48-L77).

Pinned commit: `b867ec9145750d0ae1ff7f02d35406e9bf2a0b16`; commit date: 2026-05-15T18:04:45Z.

<a id="s12"></a>
### S12. Continue (не поддерживается) — D1

**Наблюдение:** Agent loop не прочитан; исследован tool dispatch; URI router: HTTP/HTTPS/MCP; отдельные built-ins.

**Принять:** Сохранять нормализованный результат tool независимо от транспорта. **Отклонить:** Не смешивать mcp:// и встроенные tools в доверенном kernel; протокол принадлежит wrapper.

**Граница:** GitHub archived=false не означает active maintenance: README говорит противоположное о поддержке.

**Рассмотренные символы:** `callToolFromUri`, `BuiltInToolNames`.

- [core/tools/callTool.ts](https://github.com/continuedev/continue/blob/5522c6f44ca0ac3528b37244818fbfa39b5af470/core/tools/callTool.ts#L50-L97).
- [core/tools/builtIn.ts](https://github.com/continuedev/continue/blob/5522c6f44ca0ac3528b37244818fbfa39b5af470/core/tools/builtIn.ts#L1-L32).
- [README.md](https://github.com/continuedev/continue/blob/5522c6f44ca0ac3528b37244818fbfa39b5af470/README.md#L1-L41).

Pinned commit: `5522c6f44ca0ac3528b37244818fbfa39b5af470`; commit date: 2026-07-21T04:00:09Z.

<a id="s13"></a>
### S13. DeepSeek Harness — D2

**Наблюдение:** Loop сам plugin; turn/start, step/start, assistant/message, tool calls; Cordis Service, scoped tool layers и prepare/dispatch/finalize.

**Принять:** Событийная фазовая модель, lifecycle contributions, bounded dispatch с ordered commit. **Отклонить:** Не переносить равноправную заменяемость security/loop plugin в недоверенную среду: authority root должен оставаться вне tools.

**Граница:** Официальность проверена ссылкой с deepseek.com. Scoped lifetime — управление жизнью, не криптографическая авторизация.

**Рассмотренные символы:** `ReactLoopAgent.turn`, `ReactLoopAgent.step`, `executeToolCalls/runGroup`, `ToolRuntime`.

- [packages/core/agent-loop/src/agent.ts](https://github.com/deepseek-ai/deepseek-harness/blob/c389f96bf3a9b6807cb71ed6bdad5849be0df6d8/packages/core/agent-loop/src/agent.ts#L455-L477).
- [packages/core/agent-loop/src/tool-calls.ts](https://github.com/deepseek-ai/deepseek-harness/blob/c389f96bf3a9b6807cb71ed6bdad5849be0df6d8/packages/core/agent-loop/src/tool-calls.ts#L122-L240).
- [packages/core/tools/src/index.ts](https://github.com/deepseek-ai/deepseek-harness/blob/c389f96bf3a9b6807cb71ed6bdad5849be0df6d8/packages/core/tools/src/index.ts#L930-L965).
- [docs/architecture.md](https://github.com/deepseek-ai/deepseek-harness/blob/c389f96bf3a9b6807cb71ed6bdad5849be0df6d8/docs/architecture.md#L9-L29).
- [docs/subsystems/core.md](https://github.com/deepseek-ai/deepseek-harness/blob/c389f96bf3a9b6807cb71ed6bdad5849be0df6d8/docs/subsystems/core.md#L25-L55).

Pinned commit: `c389f96bf3a9b6807cb71ed6bdad5849be0df6d8`; commit date: 2026-09-07T16:46:19Z.

<a id="s14"></a>
### S14. LangGraph — D2

**Наблюдение:** Pregel tasks, tick, channels и versions_seen; Node callable; tool adapters здесь не проверены.

**Принять:** Версионированный checkpoint и учёт pending writes как образец восстановления оркестрации. **Отклонить:** Не делать общий graph engine обязательной зависимостью worker; effect idempotency не делегировать checkpoint библиотеке.

**Граница:** Persistence backend и fsync/DB transaction не проверены; это чтение control flow и контрактов.

**Рассмотренные символы:** `PregelLoop.put_writes`, `PregelRunner.tick`, `Checkpoint`.

- [libs/langgraph/langgraph/pregel/_loop.py](https://github.com/langchain-ai/langgraph/blob/81bf17b23123e4ef8b9d5f49fa09a0122fc2edd1/libs/langgraph/langgraph/pregel/_loop.py#L1607-L1650).
- [libs/langgraph/langgraph/pregel/_runner.py](https://github.com/langchain-ai/langgraph/blob/81bf17b23123e4ef8b9d5f49fa09a0122fc2edd1/libs/langgraph/langgraph/pregel/_runner.py#L176-L225).
- [libs/checkpoint/langgraph/checkpoint/base/__init__.py](https://github.com/langchain-ai/langgraph/blob/81bf17b23123e4ef8b9d5f49fa09a0122fc2edd1/libs/checkpoint/langgraph/checkpoint/base/__init__.py#L91-L134).

Pinned commit: `81bf17b23123e4ef8b9d5f49fa09a0122fc2edd1`; commit date: 2026-09-03T15:23:25Z.

<a id="s15"></a>
### S15. AutoGen (maintenance) — D1

**Наблюдение:** Очередь сообщений, _process_next и stop_when_idle; Agent messages/intervention; tool boundary не исследован.

**Принять:** Явное drain/idle для кооперативной остановки. **Отклонить:** Не вводить actor bus в минимальный worker и не выбирать maintenance ветку для нового framework dependency.

**Граница:** README рекомендует Microsoft Agent Framework; это преемник продукта, не доказательство совместимости кода/API.

**Рассмотренные символы:** `RunContext._run`, `SingleThreadedAgentRuntime`.

- [python/packages/autogen-core/src/autogen_core/_single_threaded_agent_runtime.py](https://github.com/microsoft/autogen/blob/027ecf0a379bcc1d09956d46d12d44a3ad9cee14/python/packages/autogen-core/src/autogen_core/_single_threaded_agent_runtime.py#L103-L147).
- [README.md](https://github.com/microsoft/autogen/blob/027ecf0a379bcc1d09956d46d12d44a3ad9cee14/README.md#L14-L25).

Pinned commit: `027ecf0a379bcc1d09956d46d12d44a3ad9cee14`; commit date: 2026-04-06T22:35:32Z.

<a id="s16"></a>
### S16. Microsoft Agent Framework — D2

**Наблюдение:** Supersteps до convergence; максимальное число итераций; Executor edges; tools отдельного агента не исследованы.

**Принять:** Различать checkpoint lineage и iteration_count; один номер шага не уникален после HITL. **Отклонить:** Не переносить feature-complete workflow stack в worker. Go SDK требует самостоятельного source pass до выбора зависимости.

**Граница:** Проверка graph_signature_hash при restore не прослежена; наличие поля не доказательство enforcement.

**Рассмотренные символы:** `RunnerImpl.run_until_convergence`, `WorkflowCheckpoint`, `CheckpointStorage`.

- [python/packages/core/agent_framework/_workflows/_runner.py](https://github.com/microsoft/agent-framework/blob/fdf7e80ad6c8f6dbdd9b779d5d6923c74d8b583e/python/packages/core/agent_framework/_workflows/_runner.py#L177-L220).
- [python/packages/core/agent_framework/_workflows/_checkpoint.py](https://github.com/microsoft/agent-framework/blob/fdf7e80ad6c8f6dbdd9b779d5d6923c74d8b583e/python/packages/core/agent_framework/_workflows/_checkpoint.py#L127-L170).
- [README.md](https://github.com/microsoft/agent-framework/blob/fdf7e80ad6c8f6dbdd9b779d5d6923c74d8b583e/README.md#L12-L17).

Pinned commit: `fdf7e80ad6c8f6dbdd9b779d5d6923c74d8b583e`; commit date: 2026-09-07T17:08:02Z.

<a id="s17"></a>
### S17. PydanticAI — D1

**Наблюдение:** ModelRequestNode/CallToolsNode, message history cleanup; Toolsets и DeferredToolResults в run API.

**Принять:** Типизированные deferred результаты и backend-specific lifecycle ограничения. **Отклонить:** Не обещать единый cancel/replay контракт без адаптации backend; не выдавать synthesized return за receipt.

**Граница:** Прочитаны узлы и wrapper entry, а не весь Temporal activity implementation.

**Рассмотренные символы:** `UserPromptNode.run`, `TemporalAgent.run`.

- [pydantic_ai_slim/pydantic_ai/_agent_graph.py](https://github.com/pydantic/pydantic-ai/blob/377f4c2315d225ead8f58c6e4abb8277b7be9bce/pydantic_ai_slim/pydantic_ai/_agent_graph.py#L994-L1037).
- [pydantic_ai_slim/pydantic_ai/durable_exec/temporal/_agent.py](https://github.com/pydantic/pydantic-ai/blob/377f4c2315d225ead8f58c6e4abb8277b7be9bce/pydantic_ai_slim/pydantic_ai/durable_exec/temporal/_agent.py#L489-L515).

Pinned commit: `377f4c2315d225ead8f58c6e4abb8277b7be9bce`; commit date: 2026-09-07T16:52:15-05:00.

<a id="s18"></a>
### S18. smolagents — D2

**Наблюдение:** MultiStepAgent, CodeAgent извлекает code blob и вызывает executor; Python code action; tools передаются executor.

**Принять:** Code-as-action можно вынести в отдельно разрешённый sandbox skill оркестратора. **Отклонить:** Не давать worker произвольный локальный Python; restricted imports не заменяют OS isolation.

**Граница:** Interpreter файл прочитан поверхностно; устойчивость к escape и состояние remote runtimes не проверены.

**Рассмотренные символы:** `MultiStepAgent.run`, `CodeAgent.create_python_executor`, `CodeAgent._step_stream`.

- [src/smolagents/agents.py](https://github.com/huggingface/smolagents/blob/30bb1161095dbae2271e6bc3cc4c219cc3897a57/src/smolagents/agents.py#L1700-L1745).
- [src/smolagents/local_python_executor.py](https://github.com/huggingface/smolagents/blob/30bb1161095dbae2271e6bc3cc4c219cc3897a57/src/smolagents/local_python_executor.py#L1-L35).

Pinned commit: `30bb1161095dbae2271e6bc3cc4c219cc3897a57`; commit date: 2026-08-22T14:10:32+02:00.

<a id="s19"></a>
### S19. OpenAI Agents SDK (Python) — D2

**Наблюдение:** Run loop с guardrails, turn state и resume; FunctionTool с enabled-set проверкой, approval и tool context.

**Принять:** Различать tool availability, approval, execution и output validation; не терять исходы завершившихся guardrails. **Отклонить:** Не считать session history универсальным crash recovery. Provider-side tools запрещены по умолчанию в строгом профиле.

**Граница:** Не все run paths, session backend и SDK sandbox реализации исследованы; entitlement SDK не равен подписке Codex.

**Рассмотренные символы:** `run_loop`, `_FunctionToolBatchExecutor.execute`, `Session`.

- [src/agents/run_internal/run_loop.py](https://github.com/openai/openai-agents-python/blob/a6115967489063447f2cb10de010a3e055254d14/src/agents/run_internal/run_loop.py#L1200-L1243).
- [src/agents/run_internal/tool_execution.py](https://github.com/openai/openai-agents-python/blob/a6115967489063447f2cb10de010a3e055254d14/src/agents/run_internal/tool_execution.py#L1783-L1826).
- [src/agents/memory/session.py](https://github.com/openai/openai-agents-python/blob/a6115967489063447f2cb10de010a3e055254d14/src/agents/memory/session.py#L41-L127).

Pinned commit: `a6115967489063447f2cb10de010a3e055254d14`; commit date: 2026-09-07T22:17:31Z.

<a id="s20"></a>
### S20. Google ADK (Python) — D2

**Наблюдение:** LlmFlow generator, callbacks и events; Plugin callbacks могут вернуть response при model error.

**Принять:** Отдельные partial/durable events и persisted completion детей при resume. **Отклонить:** Не считать recoverable callback ответ эквивалентом успешного запроса; ошибка provider должна сохранять provenance.

**Граница:** Полная транзакция append_event и remote effects не проверены; live mode ParallelAgent явно не реализован.

**Рассмотренные символы:** `BaseLlmFlow`, `ParallelAgent._run_async_impl`, `DatabaseSessionService.append_event`.

- [src/google/adk/flows/llm_flows/base_llm_flow.py](https://github.com/google/adk-python/blob/b0180620f4c2f4f4467a89c37a30f75bf849700b/src/google/adk/flows/llm_flows/base_llm_flow.py#L339-L418).
- [src/google/adk/agents/parallel_agent.py](https://github.com/google/adk-python/blob/b0180620f4c2f4f4467a89c37a30f75bf849700b/src/google/adk/agents/parallel_agent.py#L315-L321).
- [src/google/adk/sessions/database_session_service.py](https://github.com/google/adk-python/blob/b0180620f4c2f4f4467a89c37a30f75bf849700b/src/google/adk/sessions/database_session_service.py#L864-L907).

Pinned commit: `b0180620f4c2f4f4467a89c37a30f75bf849700b`; commit date: 2026-09-06T11:49:55-07:00.

<a id="s21"></a>
### S21. CrewAI — D1

**Наблюдение:** invoke → _invoke_loop; max iterations и RPM guard; Native tool calls передаются _handle_native_tool_calls.

**Принять:** Task-level human feedback и memory как функции orchestrator tool-skill. **Отклонить:** Не встраивать crew/role организационную модель в worker.

**Граница:** flow.py — тонкий wrapper, не реализация durable flow; каталогу запрещено повышать глубину по имени файла.

**Рассмотренные символы:** `CrewAgentExecutor.invoke`, `Flow`.

- [lib/crewai/src/crewai/agents/crew_agent_executor.py](https://github.com/crewAIInc/crewAI/blob/1b855b4ff97d3fc8bf6dc0981fed5f0999a7cd81/lib/crewai/src/crewai/agents/crew_agent_executor.py#L521-L564).
- [lib/crewai/src/crewai/flow/flow.py](https://github.com/crewAIInc/crewAI/blob/1b855b4ff97d3fc8bf6dc0981fed5f0999a7cd81/lib/crewai/src/crewai/flow/flow.py#L31-L47).

Pinned commit: `1b855b4ff97d3fc8bf6dc0981fed5f0999a7cd81`; commit date: 2026-09-07T19:10:44+05:30.

<a id="s22"></a>
### S22. Strands Agents — D1

**Наблюдение:** event_loop_cycle плюс model retry hooks; Tool execution есть в контракте цикла; dispatcher не прослежен.

**Принять:** Структурированные stop reasons и ограничения handoff циклов. **Отклонить:** Не принимать наличие timeout/hook за доказанный interrupt запущенного child; нужен отдельный протокол cancellation.

**Граница:** TODO — свидетельство открытого вопроса в прочитанном участке, не доказанный баг всех сценариев.

**Рассмотренные символы:** `event_loop_cycle`, `Swarm.stream_async`.

- [strands-py/src/strands/event_loop/event_loop.py](https://github.com/strands-agents/sdk-python/blob/e3f3ee49d4f5e1f94bc489df6f8603ce26442c31/strands-py/src/strands/event_loop/event_loop.py#L487-L530).
- [strands-py/src/strands/multiagent/swarm.py](https://github.com/strands-agents/sdk-python/blob/e3f3ee49d4f5e1f94bc489df6f8603ce26442c31/strands-py/src/strands/multiagent/swarm.py#L785-L828).

Pinned commit: `e3f3ee49d4f5e1f94bc489df6f8603ce26442c31`; commit date: 2026-09-04T16:36:56-04:00.

<a id="s23"></a>
### S23. Mastra — D1

**Наблюдение:** Фабрика DurableAgent и workflow execution engine; TTools generic; execution implementation не прочитана.

**Принять:** Не затирать persisted suspended state поздним running update. **Отклонить:** Не принимать название DurableAgent за доказательство exactly-once или отсутствия инфраструктурных зависимостей.

**Граница:** Фабрика не раскрывает фактический durable loop; сознательно D1, не глубокий аудит Mastra.

**Рассмотренные символы:** `createDurableAgent`, `DefaultExecutionEngine`.

- [packages/core/src/agent/durable/create-durable-agent.ts](https://github.com/mastra-ai/mastra/blob/9b7b80bdc3a54f0f51ea38c493c49a43a414831e/packages/core/src/agent/durable/create-durable-agent.ts#L116-L157).
- [packages/core/src/workflows/default.ts](https://github.com/mastra-ai/mastra/blob/9b7b80bdc3a54f0f51ea38c493c49a43a414831e/packages/core/src/workflows/default.ts#L70-L113).

Pinned commit: `9b7b80bdc3a54f0f51ea38c493c49a43a414831e`; commit date: 2026-09-07T15:18:41-07:00.

<a id="s24"></a>
### S24. Pi — D2

**Наблюдение:** Общий runLoop для начального и продолжаемого запуска; follow-up/steering boundaries; Tool calls исполняются после завершённого assistant response.

**Принять:** Безопасная граница steering и запрет исполнения усечённых tool arguments. **Отклонить:** Не переносить tolerant skip malformed journal в authority log Apiary; corrupted и absent должны различаться.

**Граница:** JSONL loader может дописать newline при чтении; source не запускался и пользовательские сессии не открывались.

**Рассмотренные символы:** `runLoop`, `loadEntriesFromFile`.

- [packages/agent/src/agent-loop.ts](https://github.com/badlogic/pi-mono/blob/b2602be77cb7b0de45dd616407fd210daa48aa75/packages/agent/src/agent-loop.ts#L210-L285).
- [packages/coding-agent/src/core/session-manager.ts](https://github.com/badlogic/pi-mono/blob/b2602be77cb7b0de45dd616407fd210daa48aa75/packages/coding-agent/src/core/session-manager.ts#L494-L566).

Pinned commit: `b2602be77cb7b0de45dd616407fd210daa48aa75`; commit date: 2026-09-07T22:26:47+02:00.

<a id="s25"></a>
### S25. OpenClaw — D1

**Наблюдение:** Gateway handler → preflight → startTurn; отдельный agent-core runLoop; Plugin SDK facade; tools принадлежат OpenClaw, а не внешнему Pi package.

**Принять:** Отделять channel ingress, principal capture, admission и loop. Отдельно публиковать цельное provider runtime generation. **Отклонить:** Не называть текущий runtime внешним Pi-based core: docs прямо говорят internalized @openclaw/agent-core и legacy alias pi. Не связывать с Claw Code leak descendants.

**Граница:** Историческая code lineage не исследована; сходство символов не доказательство происхождения. Session/channel internals рассмотрены по docs, не полностью по коду.

**Рассмотренные символы:** `runLoop`, `agentRunHandler`.

- [docs/agent-runtime-architecture.md](https://github.com/openclaw/openclaw/blob/f11fb86b8e8befeec175e8d9474238e07b4d57e5/docs/agent-runtime-architecture.md#L1-L61).
- [packages/agent-core/src/agent-loop.ts](https://github.com/openclaw/openclaw/blob/f11fb86b8e8befeec175e8d9474238e07b4d57e5/packages/agent-core/src/agent-loop.ts#L235-L285).
- [src/agents/runtime/index.ts](https://github.com/openclaw/openclaw/blob/f11fb86b8e8befeec175e8d9474238e07b4d57e5/src/agents/runtime/index.ts#L1-L56).
- [src/gateway/server-methods/agent-run-handler.ts](https://github.com/openclaw/openclaw/blob/f11fb86b8e8befeec175e8d9474238e07b4d57e5/src/gateway/server-methods/agent-run-handler.ts#L1-L44).

Pinned commit: `f11fb86b8e8befeec175e8d9474238e07b4d57e5`; commit date: 2026-09-07T15:44:36-07:00.

<a id="s26"></a>
### S26. Letta / MemGPT landing repository — D0

**Наблюдение:** Текущий README направляет к letta-code; Не установлено.

**Принять:** Сохранять различие идеи MemGPT и актуальной реализации Letta. **Отклонить:** Не оценивать retired Python V1 server как current Letta.

**Граница:** Archive branch не инспектировалась; это current-source discovery, не аудит исторического MemGPT.

**Рассмотренные символы:** `README: Historical source`.

- [README.md](https://github.com/letta-ai/letta/blob/4511fa0bc91f68fbab32b91f694617271ea9012b/README.md#L1-L41).

Pinned commit: `4511fa0bc91f68fbab32b91f694617271ea9012b`; commit date: 2026-08-23T12:00:36-07:00.

<a id="s27"></a>
### S27. Letta Code / актуальный Letta harness — D1

**Наблюдение:** Цикл не инспектировался; исследована MemFS граница; Memory helpers и backend capability; tool execution не инспектировался.

**Принять:** Память сделать отдельным версионированным артефактом с ownership, а не полагаться только на transcript. **Отклонить:** Не трактовать долговечную память как авторитетные инструкции; не включать cloud memory sync в минимальный kernel.

**Граница:** Функции материализации прочитаны; криптографические и conflict-resolution гарантии memory-git не проверены.

**Рассмотренные символы:** `getScopedMemoryFilesystemRoot`, `ensureLocalMemfsCheckout`, `isActiveMemfsEnabled`.

- [src/agent/memory-runtime.ts](https://github.com/letta-ai/letta-code/blob/2f0fb7c12c6973be7d52d9c7d3bf0bf4d9120cb8/src/agent/memory-runtime.ts#L1-L28).
- [src/agent/memory-filesystem.ts](https://github.com/letta-ai/letta-code/blob/2f0fb7c12c6973be7d52d9c7d3bf0bf4d9120cb8/src/agent/memory-filesystem.ts#L239-L275).

Pinned commit: `2f0fb7c12c6973be7d52d9c7d3bf0bf4d9120cb8`; commit date: 2026-09-07T13:51:38-06:00.

<a id="s28"></a>
### S28. LangChain deepagents — D1

**Наблюдение:** create_deep_agent собирает middleware и вызывает LangChain create_agent; Profile/custom middleware, HITL, tool exclusion применяется последним.

**Принять:** Явный порядок middleware и различение отсутствия/ошибки чтения; harness policy как профиль над общим циклом. **Отклонить:** Не делать filesystem, memory и subagents встроенной обязательной поверхностью worker; не допускать custom layer после security enforcement.

**Граница:** Проверены assembly и memory loading; полнота exclusion/HITL и LangGraph integration не испытаны.

**Рассмотренные символы:** `create_deep_agent`, `MemoryMiddleware.before_agent`.

- [libs/deepagents/deepagents/graph.py](https://github.com/langchain-ai/deepagents/blob/18106be837bcdd9005b2dd73280d871a0621bf99/libs/deepagents/deepagents/graph.py#L900-L973).
- [libs/deepagents/deepagents/middleware/memory.py](https://github.com/langchain-ai/deepagents/blob/18106be837bcdd9005b2dd73280d871a0621bf99/libs/deepagents/deepagents/middleware/memory.py#L279-L313).

Pinned commit: `18106be837bcdd9005b2dd73280d871a0621bf99`; commit date: 2026-09-07T17:23:07-04:00.

## Что именно переносить в Apiary

### Граница ядра и двух профилей

Следующая таблица — проектное предложение, а не описание уже реализованного протокола.

| Компонент | Общий kernel | Worker | Orchestrator | Основание |
|---|---|---|---|---|
| Цикл | Получить context snapshot → запросить модель → собрать законченный ответ → проверить calls → исполнить допущенное → записать результат | Тот же цикл | Тот же цикл | mini-SWE, Pi, Cline: S07/S24/S10 |
| Tool surface | Только compiled bindings установленной Curator closure; нет встроенных shell/read/write | Один центральный typed tool-skill | Project-management, communication, sandbox skills | Требование задачи; SDK registry — механизм, не authority |
| Подпись | Host-owned узкий брокер; ключ недоступен workspace и модели | Опциональная отдельная typed signing-привязка | Только явно разрешённые signing операции | Apiary paper, раздел «Рабочие ноды», ссылка ниже |
| Provider | Host-side adapter и capability descriptor, отдельная credential identity | API/local inference; subscription лишь через поддерживаемую интеграцию | Та же граница | Qwen factory, OpenAI auth: S02 и primary docs |
| Context | Snapshot с источником, версией и provenance; renderer формирует model projection | Пакет задачи и разрешённые результаты центрального инструмента | Установленный набор инструкций и проектные артефакты | Gemini/OpenHands/Pi: S01/S05/S24 |
| Scheduler | Bounded queue, deadlines, cancellation, упорядоченные receipts | По умолчанию последовательный | Параллелизм только для непересекающихся разрешённых effects | DeepSeek runGroup, Gemini scheduler: S13/S01 |
| Сеть и MCP | MCP отсутствует в ядре | Вызов явно привязанного внешнего wrapper при необходимости | Curator-installed out-of-process MCP wrappers | Требование задачи; Continue/Goose — контрпримеры размещения transport |
| Память | Ссылки на версионированные артефакты, не неограниченная mutable память | Минимальная task continuity | Отдельный memory/context skill при необходимости | Letta MemFS и deepagents memory: S27/S28 |

Центральный tool-skill нельзя реализовывать как бесконтрольный туннель `exec(string)` с полномочиями хоста. Одна запись в model tool catalog сокращает поверхность, только если typed operations, identity среды, scope, deadline и допустимые эффекты проверяются на доверенной стороне. Необходимый shell среды остаётся внутри управляемого sandbox/backend. Ключ подписи и model credentials не передаются этому backend. При подписании брокер должен проверять тип операции, ожидаемую revision identity и связанное разрешение, а не подписывать произвольные байты по просьбе модели.

Orchestrator не получает иной механизм доверия: меняется pinned environment profile, а не режим «всем можно всё». Communication skill также остаётся внешним эффектом с получателем, payload hash и проверкой разрешения; его наличие не разрешает модели отправлять произвольные сообщения. Prompt instructions не должны иметь возможности изменять executable bindings или расширять grants.

### DeepSeek Harness: близкая декомпозиция, другая граница доверия

**Наблюдение.** В [S13](#s13) `ReactLoopAgent` использует `systemPrompt.assemble`, `session.append`, `llm.stream` и отдельный `executeToolCalls`. `ToolRuntime` является Cordis Service, scoped contributions имеют disposer, а scheduler разделяет prepare/dispatch/finalize. `runGroup` ограничивает число in-flight вызовов, запускает тела параллельно, но фиксирует результаты по исходному порядку модели. При внутреннем сбое он дожидается начатых dispatch, затем пробрасывает ошибку. Это содержательное source evidence, а не пересказ лозунга «всё plugin».

**Документированная граница.** Architecture описывает заменяемые plugins, включая loop, model adapter и registry, и композицию профиля ordered patch layers. Core docs описывают `setup` на scoped context до публикации agent/session identity; same-process initiator даёт causal attribution, но сам по себе не authorization. Связанные фрагменты: [architecture](https://github.com/deepseek-ai/deepseek-harness/blob/c389f96bf3a9b6807cb71ed6bdad5849be0df6d8/docs/architecture.md#L9-L29), [создание и setup](https://github.com/deepseek-ai/deepseek-harness/blob/c389f96bf3a9b6807cb71ed6bdad5849be0df6d8/docs/subsystems/core.md#L25-L55), [same-process initiator](https://github.com/deepseek-ai/deepseek-harness/blob/c389f96bf3a9b6807cb71ed6bdad5849be0df6d8/docs/subsystems/core.md#L732-L745).

**Вывод.** Такая композиция предполагает доверие к выполняемому в процессе plugin-коду. Она хорошо организует lifecycle, но не изолирует злонамеренный plugin от соседнего security service. Не утверждаем, что DeepSeek обещает такую изоляцию: это несоответствие именно модели угроз публичного worker Apiary. В нашем kernel разрешено заменять provider adapter через доверенную конфигурацию, но model-visible skill не должен заменять policy engine, signer, journal или сам loop. Нужны внешние process/sandbox boundaries и независимые authority checks. Переносить стоит фазовую модель и упорядоченное завершение, а не право любого plugin переписать доверенную композицию.

### Восстановление: четыре независимых вида состояния

| Состояние | Для чего | Чего не доказывает | Требование к Apiary |
|---|---|---|---|
| Transcript/model history | Продолжить разговор; Session SDK, Pi | Что tool действительно завершился | Связать message с call/result identity; не фабриковать подтверждение эффекта |
| Workspace snapshot | Вернуть файлы; Roo/OpenCode/Cursor | Отмену отправки сообщения, публикации или подписи | Отдельный артефакт с явно ограниченным write scope |
| Workflow checkpoint | Возобновить node/superstep; LangGraph/MAF | Атомарность произвольного внешнего I/O | Версии схемы, lineage, source closure и pending operations |
| Effect journal и receipt | Зафиксировать авторизацию и установленный исход | Exactly-once без поддержки получателя | Stable operation ID, idempotency key, reconciliation при неизвестном исходе |

**Рекомендация.** До dispatch записывать intent с operation ID, schema/binding identity, argument digest, lease/epoch и разрешённым effect plan. После вызова записывать установленный исход. Если процесс упал после эффекта, но до receipt, состояние — «исход не установлен». Возобновление сверяет получателя или требует предусмотренного внешнего решения; оно не повторяет вызов автоматически. Эта рекомендация согласована с pinned Apiary paper, а не выведена из отсутствия тестов конкурентов. Точную схему, durability backend, fsync/transaction boundaries и retry contract должен установить последующий архитектурный документ.

Синтетические сообщения об interrupted/dangling calls полезны для валидности model transcript (PydanticAI, DeepSeek, Pi). Они не должны становиться квитанциями о реально выполненных эффектах. Аналогично tolerant parsing session JSONL в Pi допустим для некоторых UX-сценариев, но authority journal должен различать отсутствующую запись, повреждение и ошибку чтения.

### Provider portability и subscription entitlement

Для части про OpenAI использована **official OpenAI documentation**; skill `openai-docs` применён только к этой границе, а task-specific требование source inspection разрешает pinned GitHub исходники SDK.

| Путь | Что установлено первичным источником | Последствие |
|---|---|---|
| OpenAI | Codex различает ChatGPT subscription access и API-key usage; general OpenAI API использует Platform keys. Enterprise access tokens предназначены для доверенных Codex workflows, не для произвольных general API вызовов. [Authentication](https://learn.chatgpt.com/docs/auth) | Нельзя обещать оплату собственного Go model adapter подпиской только из-за совместимости wire API. Для worker базовый путь — отдельный разрешённый API/local adapter |
| Google | Gemini CLI поддерживает Google sign-in, Gemini API key и Vertex AI; для части organizational/Code Assist аккаунтов требуется Cloud project. [Authentication](https://geminicli.com/docs/get-started/authentication/) | Credential mode — явная host configuration; произвольный fallback способен сменить principal. Quota/entitlement проверяются отдельно от schema capabilities |
| Qwen | Source factory содержит отдельную ветку Qwen OAuth и другие provider constructors. [S02](#s02) | Это доказательство реализации ветки, не лицензия на перенос credentials или quota в сторонний сервис; условия конкретного маршрута здесь неизвестны |
| Goose ACP | Docs описывают передачу extensions как MCP и использование подписочного CLI через ACP; отдельно отмечают отсутствие session resume/fork в этой интеграции. [ACP providers](https://goose-docs.ai/docs/guides/acp-providers/) | Это вложенный агентный runtime со своими tools и lifecycle, а не прозрачный provider. Не использовать его как доказательство строгого worker-профиля или универсального entitlement |

Никакие аккаунты, токены, cookies, auth caches или keychains не исследовались. Доступность конкретной модели/подписки у пользователя неизвестна. Изученные страницы не устанавливают универсальное право перепродавать или передавать inference-ёмкость другим участникам публичного роя. Это **не запрет, выдуманный из осторожности**, а неустановленное требование, которое необходимо подтвердить для выбранного integration path до его обещания пользователям.

API adapter должен описывать реальные возможности отдельно: streaming, typed calls, parallel calls, cancellation, continuation IDs, reasoning/tool-result encoding и limits. Совместимость с OpenAI-style JSON не означает одинаковые stop reasons или поведение при усечённых arguments. Контроль над provider-side hosted tools тоже нужен: если модель выполняет действие у провайдера, локальный tool receipt не покрывает этот эффект. Строгий worker profile должен отключать такие capabilities либо явно включать их в независимый effect contract.

## Закрытые среды: только первичная документация

| Среда | Прочитанный первичный источник | Полезный ориентир | Неизвестное |
|---|---|---|---|
| Cursor | [Agent overview](https://cursor.com/docs/agent/overview) | Instructions/tools/model, file checkpoints и steering | Внутренний loop, authority implementation, crash semantics |
| Amp | [Docs](https://ampcode.com/docs), redirect с manual | Внешний integration contract | Реализация внутреннего runtime не установлена |
| Devin | [When to use Devin](https://docs.devin.ai/essential-guidelines/when-to-use-devin) | Продуктовая делегация задач | Provider/tool границы и journal не исследованы |
| GitHub Copilot | [Cloud agent](https://docs.github.com/en/copilot/concepts/agents/cloud-agent/about-cloud-agent), redirect с coding-agent | Асинхронный продуктовый агент | Публичный SDK не равен source облачного loop |

Дата чтения всех страниц — 2026-09-08. Им не присваивается source-inspected статус. «Internal source не установлен» не является исчерпывающим доказательством, что в интернете не существует ни одного открытого компонента продукта.

## Дополнительные семейства и исправление исторических предположений

OpenClaw включён как важный counterpoint gateway/session/channel architecture. Текущая [architecture на pinned SHA](https://github.com/openclaw/openclaw/blob/f11fb86b8e8befeec175e8d9474238e07b4d57e5/docs/agent-runtime-architecture.md#L6-L58) сообщает о собственном `@openclaw/agent-core`, legacy alias `pi` и отдельном plugin SDK/provider transport. [S25](#s25) проверяет реальные `runLoop` и `agentRunHandler`: вход валидируется, principal захватывается отдельно, admission guard передаётся service. Не переносим это в заявление о полноте authorization. Не смешиваем OpenClaw с Claw Code или потомками утечек; такие материалы не использовались. История internalization и точное происхождение кода требуют отдельного git-history исследования.

Letta/MemGPT добавляет механизм долговременной памяти. [S26](#s26) устанавливает, что старый repo стал landing page и отправляет на Letta Code; [S27](#s27) читает agent-scoped MemFS и git checkout lifecycle нового кода. Поэтому для Apiary полезно разделить persistent memory и transcript, но mutable memory нельзя автоматически повышать до trusted instructions. Cloud-sync, конфликтующие writers и provenance памяти остаются обязательным отдельным проектированием.

LangChain deepagents добавляет не новый low-level runtime, а слои harness над `create_agent`: memory, profile/custom middleware, HITL, tools exclusion и передаваемый checkpointer/store. [S28](#s28) показывает место сборки и различение `file_not_found` от read error. Этот порядок полезен для компиляции профиля; импорт всего набора built-in features в worker противоречит его минимальности.

## Проверенные локальные исходные условия

Соседние репозитории не изменялись. Origin, HEAD и dirty state прочитаны; нужные локальные входы материализованы через `git show HEAD:path` в task-scoped `.temp`, поэтому чужое рабочее состояние Curator не принято за источник истины. Remote freshness этих локальных HEAD не утверждается.

| Репозиторий | Origin | Прочитанный HEAD | Рабочее состояние |
|---|---|---|---|
| curator-agent-runtime | github.com/relux-works/curator-agent-runtime | `da759b8f3d366f31e5bd42934f6b5ecd1d01ac3f` | В основном checkout untracked board; работа ведётся в назначенном story worktree |
| apiary-docs | github.com/relux-works/apiary-docs | `b1ad6d76d803cd3f8e46e2b9621d266d36f3a0c7` | Clean |
| curator | github.com/relux-works/curator | `a66eec88fa4dfb8f3ca098f594f6e48af57a6835` | Dirty board metadata; сохранено |
| curator-spec | github.com/relux-works/curator-spec | `87a0d0060bad64ab883d007dcdf35df7485368bf` | Clean |
| skill-project-management | github.com/relux-works/skill-project-management | `14e2483be64c817a76a19ac8dd5608e717e56285` | Clean |

Pinned [Apiary paper: внешние эффекты и рабочие ноды](https://github.com/relux-works/apiary-docs/blob/b1ad6d76d803cd3f8e46e2b9621d266d36f3a0c7/paper/paper.tex#L259-L277) уже различает выполненный/отклонённый/неустановленный эффект и две формы клиента. Paper говорит о двух bindings публичной ноды — remote shell и подписи. Более свежая постановка этой задачи уточняет целевой вариант: один центральный typed tool-skill и **опциональная** узкая signing-привязка. Это изменение scope для последующего проектирования, а не молчаливое изменение paper. Нормативные protocols и README не редактировались.

## Отвергнутые альтернативы и условия пересмотра

| Альтернатива | Почему не рекомендована для общего kernel | Когда вернуться |
|---|---|---|
| Форк полноценного IDE/CLI runtime | Встроенные tools, UI-state, собственные prompt loaders и provider lifecycle требуют отделения | Если продукт сознательно принимает UX и trust model донора |
| LangGraph/MAF/AutoGen как обязательное worker ядро | Graph/actor semantics шире линейного профиля; Go parity не доказана | Для отдельного orchestrator service с реальной потребностью в durable graph |
| DeepSeek «всё plugin» без независимого authority | Same-process заменяемость security-кода не изоляция недоверенных skills | Для полностью доверенной локальной композиции |
| ACP/CLI как универсальный model provider | Вложенный agent владеет своим loop/tools/auth и может иметь иные resume ограничения | Как явно другой, организационно управляемый native-harness профиль |
| Shell/Python как единственный инструмент локального хоста | Малое число tool names не ограничивает фактические полномочия | Только внутри явного sandbox tool-skill с grant и ресурсными пределами |
| Transcript или git snapshot как effect journal | Не отражает атомарность внешнего I/O | Как дополнительный UX/context artifact поверх effect ledger |
| Неограниченная memory в system prompt | Увеличивает prompt и повышает недоверенные данные до инструкций | Версионированная context projection с budget/provenance |

## Что нужно проверить перед реализацией

Это список будущих проверок, **они здесь не выполнены**:

1. Один и тот же kernel запускает оба профиля; пустая closure не создаёт скрытых built-ins; worker не принимает undeclared operation.
2. Усечённые/невалидные arguments и чужая binding identity отклоняются до dispatch. Narrowing grant действительно запрещает ранее допустимый эффект.
3. Crash между intent/dispatch/result даёт «не установлен»; restart не запускает effect второй раз без reconciliation/idempotency.
4. Cancellation прекращает admission новых вызовов, дожидается или корректно завершает уже начатые, не фабрикует успешные receipts.
5. Parallel execution не пересекает conflicting scopes; число in-flight ограничено независимо от текста модели.
6. Ошибка чтения policy, context или journal не трактуется как отсутствие конфигурации; corrupted replay отказывается продолжать авторитетную цепочку.
7. Provider credentials не наследуются tool process; model/tool error и telemetry paths не раскрывают их. Подписочные integration paths подтверждены первичной документацией и разрешённым entitlement.
8. Измерить startup/RSS/CPU и per-call latency на одинаковых задачах/платформе отдельно для kernel, provider adapter, wrapper и sandbox. До этого не обещать Go speedup и не цитировать чужие benchmark.

## Logbook и проверка артефактов

- 2026-09-08: зафиксированы canonical moves и maintenance divergences (OpenCode, Goose, Roo, Continue, AutoGen, OpenHands). Решение: хранить metadata и source-read depth раздельно.
- 2026-09-08: GitHub API HTTP 403 компенсирован публичным git transport. Скачивание кода не считалось его инспекцией; чужие программы не запускались.
- 2026-09-08: DeepSeek core исследован по официальным pinned исходникам; принято lifecycle/ordered commit, отклонена same-process composition как замена authority separation.
- 2026-09-08: дополнительная директива закрыта source-anchor entries OpenClaw, Letta/Letta Code и deepagents. Устаревшие предположения Pi dependency и старого Letta server исправлены.
- 2026-09-08: `task-board logbook --help` вернул ошибку «unknown command»; отдельный `logbook` CLI не обнаружен. Записи сохранены здесь, в task-scoped `.temp/logbook.md` и board notes. `schema(mutations=true)` также вернул exit 1; это ошибка исследовательского tooling query, не успешный gate.

Фактически выполненная проверка документов и её exit codes указаны в прикреплённом task-scoped handoff. Проверка JSON/anchors подтверждает согласованность артефактов, а не поведение стороннего runtime. Детальные snapshots, source excerpts, metadata и retrieval logs находятся в `.temp/TASK-260908-oqx20d/`; переносимые permalinks и file hashes находятся в JSON. Документы оставлены без commit для parent-owned delivery.
