# Источники, паттерны и решения

Статус: архитектурный синтез accepted research, 2026-09-08. Новое broad research не проводилось. [Карта чтения](../../.spec/apiary-runtime-design.md).

## Замороженные входы

Исходный архитектурный синтез проверил 16/16 артефактов принятого INDEX по SHA-256. При сборке 15/16 файлов совпали с исходными хешами; Claude lineage отличается только удалением одного завершающего LF, что проверено побайтово. Все 16/16 текущих файлов отражены в [сверке интегрированных материалов](current-inputs.json). Таблица ниже и [исходная карта](accepted-inputs.json) сохраняют исторические хеши, candidate tree, reviewer и revision; это происхождение входов, а не идентификаторы окончательной публикации. Все локальные ссылки доступны. Проверка хешей не является аудитом исходников или безопасности; глубина чтения относится к принятым исследованиям.

| Input | SHA-256 | Использование |
|---|---|---|
| [260908_claude-lineage.md](../../.research/260908_claude-lineage.md) | `34bbb61869c0b3cb90a1f2dc80ef2863c18985427603024a005157d3137f78bb` | Происхождение, policy inheritance, независимая реализация |
| [260908_codex-pi.md](../../.research/260908_codex-pi.md) | `638d35f980e2d4348136bfaefba1da843753592659e898c6109ceb77f48eeaff` | Loop, stream terminal, history, opaque state, diagram patterns |
| [kernel.puml](../../diagrams/research/codex-pi/kernel.puml) | `662b7bba88095d528496fda849637ab5891991332c56edafabe18779a96e675a` | Read-only reference diagram, не копируется в новый дизайн |
| [kernel.svg](../../diagrams/research/codex-pi/kernel.svg) | `504f41359f6304f03f8f54d1f80f3b0a3152ac1a592bf9134ba63a2c18c8feb5` | Read-only reference diagram, не копируется в новый дизайн |
| [recovery.puml](../../diagrams/research/codex-pi/recovery.puml) | `8d695ac2f73ba78b3d868e8ed532b5fcdb63676275f776a979e4cff5440ac9b1` | Read-only reference diagram, не копируется в новый дизайн |
| [recovery.svg](../../diagrams/research/codex-pi/recovery.svg) | `0b0b2b637a8821e0dcc589f3c9c46700e9644afc45754bbf811baca66479e44b` | Read-only reference diagram, не копируется в новый дизайн |
| [260908_go-and-additional-harnesses.md](../../.research/260908_go-and-additional-harnesses.md) | `52929a4cb2aa1f80b9ee5c87f3b993178c6df83e40544da705064594ca052203` | Go ports, cancellation, контекст |
| [260908_protocol-literature.md](../../.research/260908_protocol-literature.md) | `8e77c9c20ecfb67b05162a720fb638d0513c1ba19f1f6f8f9db6fb48661f0b2d` | WAL, XMPP, authority, leases, BFT, isolation |
| [260908_protocol-source-catalog.json](../../.research/260908_protocol-source-catalog.json) | `d12aab6a5410427be328bb19b2ad9f704d8946e4177f1fd626f8b0f527a71253` | Pins/RFC/XEP/evidence depth |
| [260908_runtime-landscape.md](../../.research/260908_runtime-landscape.md) | `9e194386bce5eb09a9c4d50cd610bd8fa2fb4c4df33a8bacd7bf5d35a8d6589d` | Ширина механизмов и исключённые frameworks |
| [260908_source-catalog.json](../../.research/260908_source-catalog.json) | `cb79c50f9cd1f9766dddcbb90ffe73eba85477def81cd2c4b675125018ea4514` | 28 donor pins и границы чтения |
| [260908_apiary-curator-contracts.md](../../.research/260908_apiary-curator-contracts.md) | `59563bae31206892a38f8e4bd79da5287ccb8ca40347e5d3a2ddea9eb720e824` | Normative ownership, implementation gaps |
| [260908_provider-portability-evidence.md](../../.research/260908_provider-portability-evidence.md) | `b37e3aba9010b1faf2cf18932d2de83a587a995760e4150e04e6288bdf5420ec` | Provider source anchors и dated docs |
| [260908_provider-portability-logbook.md](../../.research/260908_provider-portability-logbook.md) | `67c2e202f9ad8774c8484a806f879cbdb2e2258b40662aa9b520f12bd90ceaac` | Разрешения и конфликтующие страницы |
| [260908_provider-portability.md](../../.research/260908_provider-portability.md) | `743b52b191e45fb9279307e1e7a262476f509887f1198ddba303e46a82dedb64` | ModelPort/AgentBridge, route matrix |
| [260908_requirements-map.md](../../.research/260908_requirements-map.md) | `5608cb6f3b5d2fd25d89fc9f066a11381a361f45cb34d06d4b8049545f9c5b78` | D01–D36 migration trace |

## Решения, полученные из паттернов

| Evidence | Invariant / tradeoff | Решение и элемент архитектуры |
|---|---|---|
| Codex immutable StepContext; Pi canonical history → provider projection | Specs и dispatch обязаны видеть один snapshot | Adopt: immutable plan + canonical history в [kernel](kernel.md) и [context](models-context.md) |
| Pi truncated terminal и Codex early tool dispatch | Latency против числа recovery состояний | Change: ждать успешного terminal response перед effects; streaming dispatch отложен |
| Pi durable effect_pending, Temporal Activity и LangGraph checkpoint | Replay управления не транзакция внешнего мира | Adopt WAL intent; reject blind retry: [execution](execution.md) |
| Claw child DangerFullAccess против claux inherited policy | Новый контекст не confinement | Reject расширение на delegation; separate executable/delegable authority |
| DeepSeek prepare/dispatch/finalize и ordered commit | Lifecycle полезен, same-process plugin не TCB boundary | Adopt lifecycle, reject in-process untrusted extension в [tool-skills](tool-skills.md) |
| mini-SWE / CodeAct, существующий runtime shell instrument | Выразительность одного sandbox interface, но широкий ceiling | Change: explicit remote exec/poll/cancel; no universal admin RPC |
| Crush serialized admission/cancel; ADK-Go event iterator | Go ports удобны, provider-shaped types протекают | Adopt event port, reject SDK types в kernel |
| Eino per-run streaming copy; Hermes transcript/request split; Kimi cancellation/snapshot | Mutable bindings и persisted state должны быть раздельны | Adopt request snapshot и transactional compaction; dynamic catalog только новая epoch |
| Aider repo map; Letta MemFS; deepagents memory errors | Memory полезна как derived context, не authority | Optional host context projection; error != absent; no auto trusted memory |
| Apiary exact I + task-board reparent acceptance | Non-overlap не semantic equivalence | Retain exact candidate, reject acceptance перенос в [execution](execution.md) |
| Curator closure/build/install + missing runtime providers | Package integrity не runtime readiness | Versioned descriptor/compiler/assurance; no claim готового daemon |
| XMPP SM/receipts, RFC routing | Доставка не admission/consensus | Application inbox/outbox/acks и artifacts в [wire](authority-wire.md) |
| Capability security/leases/consensus literature | Delegation bounded; freshness имеет availability цену | L0 strict-online default, L1/L2 внешние profiles, no instant global halt |
| Provider docs + Pi/OpenCode codecs | Совместимость wire не entitlement | Direct ModelPort baseline, AgentBridge отдельно, no shared consumer OAuth pool |

Источники строк — соответствующие frozen reports выше; далее указаны original primary pins. Это самостоятельные решения с указанными tradeoffs, а не перенос runtime кода.

## Широкий ландшафт: зачем рассмотрен каждый donor

D0 — только первичная документация; D1 — выборочные production-фрагменты; D2 — статически прослеженные связанные фрагменты loop и другой границы; D3 — исполненная проверка. D3 здесь отсутствует. 28 pinned repositories, 26 source-inspected в принятом ландшафте; это целевая выборка, не рейтинг и не exhaustive coverage. Для каждого donor принимаем только описанный механизм в собственном контракте, не его claims о полном sandbox/recovery.

### S01. Gemini CLI — D2

Pin `85aca163f6c73ac6ce380b5447359146b8adcae4`; [primary source](https://github.com/google-gemini/gemini-cli/blob/85aca163f6c73ac6ce380b5447359146b8adcae4/packages/core/src/core/client.ts#L91-L134). Выбор: Интерактивный CLI и scheduler.

Наблюдение: GeminiClient → Turn; отдельный Scheduler. renderHistory, отдельные display/API представления, compression и masking.

Решение для Apiary: Разделить render context, проверку вызова и исполнение; явно моделировать awaiting approval. Отклонение: Не переносить default-parallel по аргументу модели: разрешение параллелизма выводить из доверенного effect plan. Граница доказательства: Внутренние реализации policy и storage не аудированы; наличие guard не доказывает его полноту.

### S02. Qwen Code — D2

Pin `f1ed3bc31a2b618072dbd3c8d9ee3e04f48416d1`; [primary source](https://github.com/QwenLM/qwen-code/blob/f1ed3bc31a2b618072dbd3c8d9ee3e04f48416d1/packages/core/src/core/client.ts#L393-L456). Выбор: Интерактивный CLI и scheduler.

Наблюдение: LlmClient; типы интеракций UserQuery, Retry, Goal, Teammate. История LlmChat и prompt override; compaction call path прочитан частично.

Решение для Apiary: Явная provider factory, происхождение конфигурации и отказ при неполной identity. Отклонение: Не копировать OAuth cache в tool-skills и не принимать ветку OAuth за право любого клиента использовать подписку. Граница доказательства: Фактические квоты и entitlement конкретного аккаунта не проверялись; auth code не является условиями обслуживания.

### S03. OpenCode — D1

Pin `ecbc6ccac85b3e8087b6445e584318419b9e2b34`; [primary source](https://github.com/anomalyco/opencode/blob/ecbc6ccac85b3e8087b6445e584318419b9e2b34/packages/core/src/session/prompt.ts#L1-L1). Выбор: Интерактивный CLI и scheduler.

Наблюдение: Effect Layer SessionProcessor, внедрение service зависимостей. Summary и needsCompaction присутствуют в состоянии.

Решение для Apiary: Фиксировать исходное состояние до передачи управления SDK, который может сам запускать tools. Отклонение: Не считать streaming event start-step надёжной границей авторизации; не переносить широкий frontend/backend stack в worker. Граница доказательства: packages/core/src/session/prompt.ts оказался только re-export; это не чтение реализации prompt loop.

### S04. OpenHands Agent Canvas — D0

Pin `f7fb0c4b21f5ed726edbba8a6309634ef434b004`; [primary source](https://github.com/OpenHands/OpenHands/blob/f7fb0c4b21f5ed726edbba8a6309634ef434b004/README.md#L33-L46). Выбор: Продуктовая оболочка.

Наблюдение: Документация: control center над agent backends. Не установлено.

Решение для Apiary: Отделять control plane от исполняющего runtime. Отклонение: Не ссылаться на старый монолит OpenHands как на текущую реализацию agent loop. Граница доказательства: Только README этого репозитория; исходники runtime исследованы отдельно в software-agent-sdk.

### S05. OpenHands Software Agent SDK — D2

Pin `df2ea8fa5542d5d2a543e108bc8b2d4fbbab34b1`; [primary source](https://github.com/OpenHands/software-agent-sdk/blob/df2ea8fa5542d5d2a543e108bc8b2d4fbbab34b1/openhands-sdk/openhands/sdk/agent/agent.py#L635-L678). Выбор: События и удалённая среда.

Наблюдение: Agent.step: unmatched actions, затем condensation и model completion. Condenser создаёт отдельное событие до новой генерации.

Решение для Apiary: Отдельные события context condensation и строгая идентичность/parent у журналируемых записей. Отклонение: Не приравнивать unmatched action к безопасному повтору: нужен receipt или reconciliation внешнего эффекта. Граница доказательства: Реализация fs.write, fsync и failure injection не проверены; persisted log не доказательство exactly-once.

### S06. SWE-agent — D2

Pin `3ea751c087f32b16e039a2233dd6eefecef325d5`; [primary source](https://github.com/SWE-agent/SWE-agent/blob/3ea751c087f32b16e039a2233dd6eefecef325d5/sweagent/agent/agents.py#L235-L280). Выбор: Последовательный action-observation.

Наблюдение: run → step → forward_with_handling; сохраняет trajectory после шага. messages и trajectory раздельны.

Решение для Apiary: Явные StepOutput и отдельная запись observation/trajectory. Отклонение: Blocklist shell-команд не принимать за capability enforcement; не распространять provider env в sandbox. Граница доказательства: ToolConfig сам предупреждает о debug-логировании propagate_env_variables; реальных секретов не читали.

### S07. mini-SWE-agent v2 — D2

Pin `04d809ceab9df28f9adaed044884180159172930`; [primary source](https://github.com/SWE-agent/mini-swe-agent/blob/04d809ceab9df28f9adaed044884180159172930/src/minisweagent/agents/default.py#L86-L137). Выбор: Последовательный action-observation.

Наблюдение: run → step → execute_actions(query()); terminal message role exit. Линейный список messages.

Решение для Apiary: Минимальность цикла и отдельный environment adapter — ближайший структурный образец worker. Отклонение: Заменить произвольный локальный shell центральным typed tool-skill; не наследовать весь env процесса. Граница доказательства: Текущий README явно v2; нельзя переносить рассказы о v1 или рекламные числа на этот SHA.

### S08. Aider — D2

Pin `5dc9490bb35f9729ef2c95d00a19ccd30c26339c`; [primary source](https://github.com/Aider-AI/aider/blob/5dc9490bb35f9729ef2c95d00a19ccd30c26339c/aider/coders/base_coder.py#L857-L917). Выбор: Контекст кода и редактирование.

Наблюдение: Coder.run/run_one в интерактивном цикле. RepoMap строит weighted MultiDiGraph и PageRank по symbols/references.

Решение для Apiary: Repo-map как ограниченный, кэшируемый context artifact отдельного skill. Отклонение: Не помещать индексатор репозитория и git-операции в общий worker kernel. Граница доказательства: Польза PageRank для задач Apiary не измерялась; это кандидат для эксперимента, не доказанный выигрыш.

### S09. Goose (AAIF) — D1

Pin `5e90925962f05acf8e255032de44d16c4a7768a2`; [primary source](https://github.com/aaif-goose/goose/blob/5e90925962f05acf8e255032de44d16c4a7768a2/crates/goose/src/agents/agent.rs#L1744-L1787). Выбор: Нативный runtime и расширения.

Наблюдение: reply → reply_impl; отдельный state-machine entry. Сообщение добавляется session_manager до ответа.

Решение для Apiary: Нативный runtime может иметь отдельный provider layer и session lifecycle. Отклонение: Не встраивать MCP в kernel и не считать ACP provider чистым inference adapter: он запускает другой агент. Граница доказательства: Канонический repo получен redirect GitHub API: aaif-goose/goose; ACP ограничения docs могут меняться.

### S10. Cline SDK и клиенты — D2

Pin `c21b17255b228e88a1518c18a73a473ee5876362`; [primary source](https://github.com/cline/cline/blob/c21b17255b228e88a1518c18a73a473ee5876362/sdk/packages/agents/src/agent-runtime.ts#L534-L577). Выбор: Разделяемое ядро продукта.

Наблюдение: Общий AgentRuntime, host SessionRuntime и разные клиенты. Overflow recovery; host messageBuilder и ConversationStore.

Решение для Apiary: Один core с host-owned context и разными профилями; отдельно учитывать provider-side tools. Отклонение: Не включать provider-executed tool activity как обычный повторяемый локальный call; parallel без effect conflicts недостаточен. Граница доказательства: prepareToolExecution прочитан лишь начальный участок; полнота permission paths не утверждается.

### S11. Roo Code (архив) — D1

Pin `b867ec9145750d0ae1ff7f02d35406e9bf2a0b16`; [primary source](https://github.com/RooCodeInc/Roo-Code/blob/b867ec9145750d0ae1ff7f02d35406e9bf2a0b16/src/core/task/Task.ts#L2434-L2477). Выбор: IDE-центричный цикл.

Наблюдение: Task цикл вызывает recursivelyMakeClineRequests с явным stack. nextUserContent и file details на первом запросе.

Решение для Apiary: Изучать UX обратимого редактирования как отдельную функцию оболочки. Отклонение: Не выбирать архивный Task монолит базой нового Go kernel. Граница доказательства: README сообщает закрытие 15 мая и указывает ZooCode community fork; качество/актуальность fork не проверены.

### S12. Continue (не поддерживается) — D1

Pin `5522c6f44ca0ac3528b37244818fbfa39b5af470`; [primary source](https://github.com/continuedev/continue/blob/5522c6f44ca0ac3528b37244818fbfa39b5af470/core/tools/callTool.ts#L50-L97). Выбор: IDE tool routing.

Наблюдение: Agent loop не прочитан; исследован tool dispatch. Tool возвращает ContextItem[].

Решение для Apiary: Сохранять нормализованный результат tool независимо от транспорта. Отклонение: Не смешивать mcp:// и встроенные tools в доверенном kernel; протокол принадлежит wrapper. Граница доказательства: GitHub archived=false не означает active maintenance: README говорит противоположное о поддержке.

### S13. DeepSeek Harness — D2

Pin `c389f96bf3a9b6807cb71ed6bdad5849be0df6d8`; [primary source](https://github.com/deepseek-ai/deepseek-harness/blob/c389f96bf3a9b6807cb71ed6bdad5849be0df6d8/packages/core/agent-loop/src/agent.ts#L272-L315). Выбор: Plugin composition и event loop.

Наблюдение: Loop сам plugin; turn/start, step/start, assistant/message, tool calls. systemPrompt.assemble и deriveMessages; next-step/next-turn inbox.

Решение для Apiary: Событийная фазовая модель, lifecycle contributions, bounded dispatch с ordered commit. Отклонение: Не переносить равноправную заменяемость security/loop plugin в недоверенную среду: authority root должен оставаться вне tools. Граница доказательства: Официальность проверена ссылкой с deepseek.com. Scoped lifetime — управление жизнью, не криптографическая авторизация.

### S14. LangGraph — D2

Pin `81bf17b23123e4ef8b9d5f49fa09a0122fc2edd1`; [primary source](https://github.com/langchain-ai/langgraph/blob/81bf17b23123e4ef8b9d5f49fa09a0122fc2edd1/libs/langgraph/langgraph/pregel/_loop.py#L413-L456). Выбор: Durable graph execution.

Наблюдение: Pregel tasks, tick, channels и versions_seen. Channel values в checkpoint и отдельные pending writes.

Решение для Apiary: Версионированный checkpoint и учёт pending writes как образец восстановления оркестрации. Отклонение: Не делать общий graph engine обязательной зависимостью worker; effect idempotency не делегировать checkpoint библиотеке. Граница доказательства: Persistence backend и fsync/DB transaction не проверены; это чтение control flow и контрактов.

### S15. AutoGen (maintenance) — D1

Pin `027ecf0a379bcc1d09956d46d12d44a3ad9cee14`; [primary source](https://github.com/microsoft/autogen/blob/027ecf0a379bcc1d09956d46d12d44a3ad9cee14/python/packages/autogen-core/src/autogen_core/_single_threaded_agent_runtime.py#L103-L147). Выбор: Actor/message runtime.

Наблюдение: Очередь сообщений, _process_next и stop_when_idle. Agent-owned state; полноценный context путь неизвестен.

Решение для Apiary: Явное drain/idle для кооперативной остановки. Отклонение: Не вводить actor bus в минимальный worker и не выбирать maintenance ветку для нового framework dependency. Граница доказательства: README рекомендует Microsoft Agent Framework; это преемник продукта, не доказательство совместимости кода/API.

### S16. Microsoft Agent Framework — D2

Pin `fdf7e80ad6c8f6dbdd9b779d5d6923c74d8b583e`; [primary source](https://github.com/microsoft/agent-framework/blob/fdf7e80ad6c8f6dbdd9b779d5d6923c74d8b583e/python/packages/core/agent_framework/_workflows/_runner.py#L104-L147). Выбор: Durable graph execution.

Наблюдение: Supersteps до convergence; максимальное число итераций. Committed workflow state, pending request-info events.

Решение для Apiary: Различать checkpoint lineage и iteration_count; один номер шага не уникален после HITL. Отклонение: Не переносить feature-complete workflow stack в worker. Go SDK требует самостоятельного source pass до выбора зависимости. Граница доказательства: Проверка graph_signature_hash при restore не прослежена; наличие поля не доказательство enforcement.

### S17. PydanticAI — D1

Pin `377f4c2315d225ead8f58c6e4abb8277b7be9bce`; [primary source](https://github.com/pydantic/pydantic-ai/blob/377f4c2315d225ead8f58c6e4abb8277b7be9bce/pydantic_ai_slim/pydantic_ai/_agent_graph.py#L541-L584). Выбор: Typed agent graph и durable adapter.

Наблюдение: ModelRequestNode/CallToolsNode, message history cleanup. Repair dangling calls различает interrupted и complete.

Решение для Apiary: Типизированные deferred результаты и backend-specific lifecycle ограничения. Отклонение: Не обещать единый cancel/replay контракт без адаптации backend; не выдавать synthesized return за receipt. Граница доказательства: Прочитаны узлы и wrapper entry, а не весь Temporal activity implementation.

### S18. smolagents — D2

Pin `30bb1161095dbae2271e6bc3cc4c219cc3897a57`; [primary source](https://github.com/huggingface/smolagents/blob/30bb1161095dbae2271e6bc3cc4c219cc3897a57/src/smolagents/agents.py#L434-L477). Выбор: Code-as-action.

Наблюдение: MultiStepAgent, CodeAgent извлекает code blob и вызывает executor. Agent memory и state доступны коду.

Решение для Apiary: Code-as-action можно вынести в отдельно разрешённый sandbox skill оркестратора. Отклонение: Не давать worker произвольный локальный Python; restricted imports не заменяют OS isolation. Граница доказательства: Interpreter файл прочитан поверхностно; устойчивость к escape и состояние remote runtimes не проверены.

### S19. OpenAI Agents SDK (Python) — D2

Pin `a6115967489063447f2cb10de010a3e055254d14`; [primary source](https://github.com/openai/openai-agents-python/blob/a6115967489063447f2cb10de010a3e055254d14/src/agents/run_internal/run_loop.py#L442-L485). Выбор: Run loop и tool lifecycle.

Наблюдение: Run loop с guardrails, turn state и resume. Session protocol get/add/pop/clear для истории.

Решение для Apiary: Различать tool availability, approval, execution и output validation; не терять исходы завершившихся guardrails. Отклонение: Не считать session history универсальным crash recovery. Provider-side tools запрещены по умолчанию в строгом профиле. Граница доказательства: Не все run paths, session backend и SDK sandbox реализации исследованы; entitlement SDK не равен подписке Codex.

### S20. Google ADK (Python) — D2

Pin `b0180620f4c2f4f4467a89c37a30f75bf849700b`; [primary source](https://github.com/google/adk-python/blob/b0180620f4c2f4f4467a89c37a30f75bf849700b/src/google/adk/flows/llm_flows/base_llm_flow.py#L339-L418). Выбор: Event/session и композиция агентов.

Наблюдение: LlmFlow generator, callbacks и events. InvocationContext и session state delta.

Решение для Apiary: Отдельные partial/durable events и persisted completion детей при resume. Отклонение: Не считать recoverable callback ответ эквивалентом успешного запроса; ошибка provider должна сохранять provenance. Граница доказательства: Полная транзакция append_event и remote effects не проверены; live mode ParallelAgent явно не реализован.

### S21. CrewAI — D1

Pin `1b855b4ff97d3fc8bf6dc0981fed5f0999a7cd81`; [primary source](https://github.com/crewAIInc/crewAI/blob/1b855b4ff97d3fc8bf6dc0981fed5f0999a7cd81/lib/crewai/src/crewai/agents/crew_agent_executor.py#L228-L271). Выбор: Ролевая task/flow оркестрация.

Наблюдение: invoke → _invoke_loop; max iterations и RPM guard. messages, memory save и human feedback.

Решение для Apiary: Task-level human feedback и memory как функции orchestrator tool-skill. Отклонение: Не встраивать crew/role организационную модель в worker. Граница доказательства: flow.py — тонкий wrapper, не реализация durable flow; каталогу запрещено повышать глубину по имени файла.

### S22. Strands Agents — D1

Pin `e3f3ee49d4f5e1f94bc489df6f8603ce26442c31`; [primary source](https://github.com/strands-agents/sdk-python/blob/e3f3ee49d4f5e1f94bc489df6f8603ce26442c31/strands-py/src/strands/event_loop/event_loop.py#L187-L230). Выбор: Event loop и swarm.

Наблюдение: event_loop_cycle плюс model retry hooks. Messages и invocation_state.

Решение для Apiary: Структурированные stop reasons и ограничения handoff циклов. Отклонение: Не принимать наличие timeout/hook за доказанный interrupt запущенного child; нужен отдельный протокол cancellation. Граница доказательства: TODO — свидетельство открытого вопроса в прочитанном участке, не доказанный баг всех сценариев.

### S23. Mastra — D1

Pin `9b7b80bdc3a54f0f51ea38c493c49a43a414831e`; [primary source](https://github.com/mastra-ai/mastra/blob/9b7b80bdc3a54f0f51ea38c493c49a43a414831e/packages/core/src/agent/durable/create-durable-agent.ts#L116-L157). Выбор: Workflow и durable agent facade.

Наблюдение: Фабрика DurableAgent и workflow execution engine. Не установлено.

Решение для Apiary: Не затирать persisted suspended state поздним running update. Отклонение: Не принимать название DurableAgent за доказательство exactly-once или отсутствия инфраструктурных зависимостей. Граница доказательства: Фабрика не раскрывает фактический durable loop; сознательно D1, не глубокий аудит Mastra.

### S24. Pi — D2

Pin `b2602be77cb7b0de45dd616407fd210daa48aa75`; [primary source](https://github.com/badlogic/pi-mono/blob/b2602be77cb7b0de45dd616407fd210daa48aa75/packages/agent/src/agent-loop.ts#L154-L212). Выбор: Минимальный переиспользуемый loop.

Наблюдение: Общий runLoop для начального и продолжаемого запуска; follow-up/steering boundaries. prepareNextTurn заменяет context/model; отдельный LLM projection.

Решение для Apiary: Безопасная граница steering и запрет исполнения усечённых tool arguments. Отклонение: Не переносить tolerant skip malformed journal в authority log Apiary; corrupted и absent должны различаться. Граница доказательства: JSONL loader может дописать newline при чтении; source не запускался и пользовательские сессии не открывались.

### S25. OpenClaw — D1

Pin `f11fb86b8e8befeec175e8d9474238e07b4d57e5`; [primary source](https://github.com/openclaw/openclaw/blob/f11fb86b8e8befeec175e8d9474238e07b4d57e5/docs/agent-runtime-architecture.md#L1-L61). Выбор: Gateway, каналы и встроенный runtime.

Наблюдение: Gateway handler → preflight → startTurn; отдельный agent-core runLoop. Steering, turn taint и compaction helpers.

Решение для Apiary: Отделять channel ingress, principal capture, admission и loop. Отдельно публиковать цельное provider runtime generation. Отклонение: Не называть текущий runtime внешним Pi-based core: docs прямо говорят internalized @openclaw/agent-core и legacy alias pi. Не связывать с Claw Code leak descendants. Граница доказательства: Историческая code lineage не исследована; сходство символов не доказательство происхождения. Session/channel internals рассмотрены по docs, не полностью по коду.

### S26. Letta / MemGPT landing repository — D0

Pin `4511fa0bc91f68fbab32b91f694617271ea9012b`; [primary source](https://github.com/letta-ai/letta/blob/4511fa0bc91f68fbab32b91f694617271ea9012b/README.md#L1-L41). Выбор: Идентичность проекта и преемник.

Наблюдение: Текущий README направляет к letta-code. Stateful memory заявлена.

Решение для Apiary: Сохранять различие идеи MemGPT и актуальной реализации Letta. Отклонение: Не оценивать retired Python V1 server как current Letta. Граница доказательства: Archive branch не инспектировалась; это current-source discovery, не аудит исторического MemGPT.

### S27. Letta Code / актуальный Letta harness — D1

Pin `2f0fb7c12c6973be7d52d9c7d3bf0bf4d9120cb8`; [primary source](https://github.com/letta-ai/letta-code/blob/2f0fb7c12c6973be7d52d9c7d3bf0bf4d9120cb8/src/agent/memory-runtime.ts#L1-L28). Выбор: Долгоживущая память.

Наблюдение: Цикл не инспектировался; исследована MemFS граница. Agent-scoped memory directory; local/cloud backend различены.

Решение для Apiary: Память сделать отдельным версионированным артефактом с ownership, а не полагаться только на transcript. Отклонение: Не трактовать долговечную память как авторитетные инструкции; не включать cloud memory sync в минимальный kernel. Граница доказательства: Функции материализации прочитаны; криптографические и conflict-resolution гарантии memory-git не проверены.

### S28. LangChain deepagents — D1

Pin `18106be837bcdd9005b2dd73280d871a0621bf99`; [primary source](https://github.com/langchain-ai/deepagents/blob/18106be837bcdd9005b2dd73280d871a0621bf99/libs/deepagents/deepagents/graph.py#L900-L973). Выбор: Harness layering над framework.

Наблюдение: create_deep_agent собирает middleware и вызывает LangChain create_agent. Memory backend.download_files; missing отличён от ошибки чтения.

Решение для Apiary: Явный порядок middleware и различение отсутствия/ошибки чтения; harness policy как профиль над общим циклом. Отклонение: Не делать filesystem, memory и subagents встроенной обязательной поверхностью worker; не допускать custom layer после security enforcement. Граница доказательства: Проверены assembly и memory loading; полнота exclusion/HITL и LangGraph integration не испытаны.

## Глубокие source passes и lineage

[Codex/Pi](../../.research/260908_codex-pi.md) прослеживает loop, schemas, steering, stream failures, context/cache, cancellation и durable harness отдельно от classic CLI. Классический Pi и durable harness нельзя объединять в одну guarantee. Codex router pin `8e694e955ae02ca737230a5468c55d5847074072`; Pi provider pass pin `b2602be77cb7b0de45dd616407fd210daa48aa75`. [Codex router](https://github.com/openai/codex/blob/8e694e955ae02ca737230a5468c55d5847074072/codex-rs/core/src/tools/spec_plan.rs#L125), [Pi stream](https://github.com/badlogic/pi-mono/blob/b2602be77cb7b0de45dd616407fd210daa48aa75/packages/ai/src/api/openai-completions.ts#L311). Эти snapshots не обещают актуальность плавающего main.

[Claude lineage](../../.research/260908_claude-lineage.md): официальный SDK wrapper доступен, внутренний proprietary loop не выведен из него. Rust Claw `08106b0c3771ef5b4a5aa176acccd460e88b7325` имеет executable loop и unsafe child policy default; claux `4bdeb40532c9267e2a9d27e3caac81e21ef63e39` показывает общий loop/transactional compaction, но provenance/rights не квалифицированы для переноса кода. Python fork `01bf54ad15a894957f1dfb9fbb0d10f92684c856` выдаёт diagnostic output вместо полноценного loop; C++ clawc `ea4c2616c5b5a3171b5f64841946b26870abcb88` содержит migration stubs. OMA `e678bfb3e7c9313be78303c2c32294417bb58dbb` полезен как comparator, lineage не подтверждена. Заявленный proprietary snapshot доступен как lead, но source tree намеренно не использовался; это не «недоступный код». Решение: независимая Go-реализация по публичным контрактам/описанным паттернам, без заимствования dubious lineage bodies. [Claw pin](https://github.com/ultraworkers/claw-code/tree/08106b0c3771ef5b4a5aa176acccd460e88b7325), [claux pin](https://github.com/ducks/claux/tree/4bdeb40532c9267e2a9d27e3caac81e21ef63e39).

## Go и дополнительные harnesses

- `charmbracelet/crush` — `7f9a8e4ca8c0365ac981d082470999900a5d10ce`, [source](https://github.com/charmbracelet/crush/blob/7f9a8e4ca8c0365ac981d082470999900a5d10ce/internal/agent/agent.go); выборочное статическое чтение interfaces/loop.
- `google/adk-go` — `53a0bc0ceb2e4437a075631f33a76f039445745f`, [source](https://github.com/google/adk-go/blob/53a0bc0ceb2e4437a075631f33a76f039445745f/agent/agent.go); выборочное статическое чтение interfaces/loop.
- `cloudwego/eino` — `9d983b36a5112a1c233056b1a099825298fafb8f`, [source](https://github.com/cloudwego/eino/blob/9d983b36a5112a1c233056b1a099825298fafb8f/flow/agent/react/react.go); выборочное статическое чтение interfaces/loop.
- `MoonshotAI/kimi-cli` — `86f136422a0aae6b217ea49e7ea1d2e8a1defcd2`, [source](https://github.com/MoonshotAI/kimi-cli/blob/86f136422a0aae6b217ea49e7ea1d2e8a1defcd2/README.md); выборочное статическое чтение interfaces/loop.
- `NousResearch/hermes-agent` — `2237be355906fbe6065ce1815711eee52b2d646e`, [source](https://github.com/NousResearch/hermes-agent/blob/2237be355906fbe6065ce1815711eee52b2d646e/run_agent.py); выборочное статическое чтение interfaces/loop.
- `MoonshotAI/kimi-code` — `fa87d040c3086cdceb3bee24762451cf47af0336`, [source](https://github.com/MoonshotAI/kimi-code/blob/fa87d040c3086cdceb3bee24762451cf47af0336/README.md); выборочное статическое чтение interfaces/loop.
- `cometbft/cometbft` — `3bd679a20b154bcba63aae7edb13faa673103e38`, [source](https://github.com/cometbft/cometbft/blob/3bd679a20b154bcba63aae7edb13faa673103e38/spec/consensus/consensus.md); выборочное статическое чтение interfaces/loop.
- `opencontainers/image-spec` — `af26a05fba5ee648512f4ea3c9fda1fcc1b6d6dc`, [source](https://github.com/opencontainers/image-spec/blob/af26a05fba5ee648512f4ea3c9fda1fcc1b6d6dc/descriptor.md); выборочное статическое чтение interfaces/loop.
- `SWE-agent/mini-swe-agent` — `04d809ceab9df28f9adaed044884180159172930`, [source](https://github.com/SWE-agent/mini-swe-agent/blob/04d809ceab9df28f9adaed044884180159172930/src/minisweagent/agents/default.py); выборочное статическое чтение interfaces/loop.
- `langchain-ai/langgraph` — `81bf17b23123e4ef8b9d5f49fa09a0122fc2edd1`, [source](https://github.com/langchain-ai/langgraph/blob/81bf17b23123e4ef8b9d5f49fa09a0122fc2edd1/libs/langgraph/langgraph/pregel/_loop.py); выборочное статическое чтение interfaces/loop.
- `relux-works/apiary-docs` — `e4249a6193c0f2730e7cffaea6b4907c0a7e80a9`, [source](https://github.com/relux-works/apiary-docs/blob/e4249a6193c0f2730e7cffaea6b4907c0a7e80a9/paper/paper.tex); выборочное статическое чтение interfaces/loop.

Crush даёт образец serialized session admission; ADK-Go — event iterator, но genai-shaped model types; Eino — streaming copy и риск mutable tool maps; Kimi CLI — inspected predecessor, Kimi Code README-only successor; Hermes — transcript/request separation. Ни один framework не включён как обязательное ядро. [Подробный evidence pass](../../.research/260908_go-and-additional-harnesses.md).

## Локальные нормы и источники протокола

| Источник | Pin / область |
|---|---|
| [Apiary paper](https://github.com/relux-works/apiary-docs/blob/b1ad6d76d803cd3f8e46e2b9621d266d36f3a0c7/paper/paper.tex) | `b1ad6d76d803cd3f8e46e2b9621d266d36f3a0c7`, I1–I10 и central execution |
| [Curator implementation](https://github.com/relux-works/curator/tree/2d0901444ecfe3c11c424c561c66c66b4bb5ddd1) | `2d0901444ecfe3c11c424c561c66c66b4bb5ddd1`, accepted contract pass; не mutable sibling |
| [Curator spec](https://github.com/relux-works/curator-spec/tree/87a0d0060bad64ab883d007dcdf35df7485368bf) | `87a0d0060bad64ab883d007dcdf35df7485368bf`, packages/closure/assurance |
| [Task-board integration](https://github.com/relux-works/skill-project-management/blob/ebdf21a2dbe44892296c91a9401d87abc612f87f/tools/board-cli/internal/integration/reparent.go#L37) | `ebdf21a2dbe44892296c91a9401d87abc612f87f`, reparent/acceptance limitation |
| [Runtime v0.1](https://github.com/relux-works/curator-agent-runtime/blob/da759b8f3d366f31e5bd42934f6b5ecd1d01ac3f/protocol/runtime.md) | `da759b8f3d366f31e5bd42934f6b5ecd1d01ac3f`, существующий normative draft |

Другие accepted reports читали более ранние локальные pins Apiary/Curator/task-board: они остаются историческими observation points, не смешиваются в «последнюю версию». При конфликте текущих project norms используем contract-focused accepted pass и явно описанную migration. Никакие sibling working-tree changes не использованы как source authority.

Протокольные паттерны опираются на [ReAct v3](https://arxiv.org/html/2210.03629v3), [CodeAct v4](https://arxiv.org/html/2402.01030v4), [OPENDEV v1](https://arxiv.org/html/2603.05344v1), [Temporal activities](https://docs.temporal.io/activity-execution), [RFC 6120](https://www.rfc-editor.org/rfc/rfc6120), XEP-0198/0030/0184/0359/0060/0313/0363, [Raft](https://raft.github.io/raft.pdf) и pinned CometBFT spec из [wire главы](authority-wire.md). Это source-backed architectural inference, а не собственное доказательство consensus/isolation. A2A и два разных ACP полезны как integration protocols, но не заменяют capability authority и operation WAL; MCP tools/resources/prompts не устанавливают task contract. Default сохраняет собственные узкие domain messages, внешний protocol adapter явно отображает только поддержанное подмножество.

Закрытые Cursor, Amp, Devin и GitHub Copilot — D0 documentation-only из [ландшафта](../../.research/260908_runtime-landscape.md). Их внутренние loops и crash guarantees не установлены. «Закрытый» не означает, что ни одного открытого компонента не существует. Roo/Continue/AutoGen maintenance labels и OpenHands/Letta successor names зафиксированы на дату accepted evidence, не пожизненные характеристики.

## Logbook синтеза

- 2026-09-08: проверены 16 frozen digests; research integration intentionally pending. Source bodies не копируются в candidate.
- Приняты meaningful migrations WorkspaceRef, delegation authority, stale receipt retention, explicit unknown-effect и выбранный binding при co-install alternatives; v0.1 не изменён.
- Решение по shell отличается от более узкой рекомендации Codex/Pi: command sandbox необходим для полезного baseline; authority/admin/signing исключены из этого interface, ограничения enforced executor.
- L0 online permits определяют момент admission; delayed pre-halt permit и running effects названы явно. Instant halt claim отвергнут.
- Provider policy берётся из dated accepted snapshots; account-specific capability/entitlement и whole-agent equivalence не проверялись.
- Board `task(...)` query не поддержана, исправлена на `get(...)`; диагностический отказ не считается отсутствием задачи. Артефактные checks и actual exit codes записываются в task-scoped outcome.
- Visual QA: первый PlantUML pass обнаружил literal newlines внутри quoted labels (4 views); escaping исправлен, все 9 SVG/PNG затем отрендерены. Process/trust view перекомпонован после обнаружения пересечений и обрезанной длинной подписи; повторно просмотрен без clipping. Остальные 8 views просмотрены, подписи читаемы.
- Artifact validation: 16/16 frozen hashes, 9/9 SVG XML, 6/6 JSON examples parsed; 54 own relative links resolved, 36 research-link occurrences mapped to accepted digests. Эти счётчики относятся к артефактам; cryptographic/runtime conformance не выполнялась. Root README и final unresolved navigation оставлены consolidation owner.
- Revision 2, 2026-09-08: F1 выбирает recursive SHA-256 content manifest отдельно от qualified Git locator; F2 выбирает local sole-writer publication gateway и три durable шага вместо cross-store atomicity. Источник изменения — конкретные GIT-IDENTITY/PUB-STALE/PUB-CRASH counter-scenarios accepted review revision 1; широкое исследование не повторялось. Host Seal/Submission уточнён без расширения central.
- Revision 2 logbook: неверный read `resources(...)` отказан, исправлен на `get(...) { outcomeResources }`; ошибка не трактовалась как отсутствие evidence. Изменённые task-integration/process-trust SVG перерендерены и визуально проверены; остальные семь diagram pairs сохранены побайтово. Результаты узких checks и inventory вынесены в новый task-scoped revision 2 outcome.

## Уточнение ссылок при сборке

В [историческом protocol source catalog](../../.research/260908_protocol-source-catalog.json) документ Firecracker `docs/design.md` записан как ссылка на ветку `main`. Это датированная документальная ссылка с плавающей версией, а не immutable source pin. Запись уже помечена `used_as_evidence: false` и сохранена для происхождения исследования; она не поддерживает архитектурные утверждения. Исследование изоляции ссылается отдельно на Firecracker NSDI 2020. Остальные GitHub blob URLs в двух JSON-каталогах имеют commit locators; проверка формы ссылки не доказывает доступность или полноту чтения upstream. Новый сетевой аудит источников при сборке не проводился.
