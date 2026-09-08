# Go и дополнительные harnesses: механизмы для общего ядра Apiary

Задача `TASK-260908-1ir76l`. Все источники получены **2026-09-08**. Дополнение к [протокольному исследованию](260908_protocol-literature.md), а не рейтинг популярности и не исчерпывающий обзор. Дальнейшие subagents не запускались.

## Граница чтения

Canonical repositories проверены через публичный GitHub repository API: `full_name`, default branch, `archived`, `pushed_at`; затем изолированный shallow clone фиксирует конкретный HEAD. У всех шести harness repositories ниже API вернул `archived=false`, default branch `main`. Это не доказательство поддержки или стабильного release. README Kimi CLI отдельно сообщает постепенное прекращение развития, несмотря на `archived=false`.

Исходники извлечены через `git show SHA:path`; запускались только исследовательские утилиты, не код/тесты/install scripts изучаемых проектов. Читались **выборочные фрагменты** по указанным ссылкам. Полнота security policy, storage durability, provider parity и реальные performance показатели не установлены. JSON [каталог](260908_protocol-source-catalog.json) отделяет downloaded-only файлы от прочитанных anchors.

| Репозиторий | Точный SHA | Глубина |
|---|---|---|
| [charmbracelet/crush](https://github.com/charmbracelet/crush) | `7f9a8e4ca8c0365ac981d082470999900a5d10ce` | Выборочно прослеженные source interfaces и loop |
| [google/adk-go](https://github.com/google/adk-go) | `53a0bc0ceb2e4437a075631f33a76f039445745f` | Выборочно прослеженные source interfaces и loop |
| [cloudwego/eino](https://github.com/cloudwego/eino) | `9d983b36a5112a1c233056b1a099825298fafb8f` | Выборочно прослеженные source interfaces и loop |
| [MoonshotAI/kimi-cli](https://github.com/MoonshotAI/kimi-cli) | `86f136422a0aae6b217ea49e7ea1d2e8a1defcd2` | Выборочно прослеженные source interfaces и loop |
| [NousResearch/hermes-agent](https://github.com/NousResearch/hermes-agent) | `2237be355906fbe6065ce1815711eee52b2d646e` | Выборочно прослеженные source interfaces и loop |
| [MoonshotAI/kimi-code](https://github.com/MoonshotAI/kimi-code) | `fa87d040c3086cdceb3bee24762451cf47af0336` | Только README: актуальный преемник |

## Crush: полезная дисциплина допуска, но не готовая authority boundary

**Наблюдения из кода.** `sessionAgent.Run` синхронизирует решение cancel-on-entry/queued/active через per-session mutex. Accepted handles имеют sequence; отмена распространяется на уже принятый диапазон, а более поздние prompts сохраняются. Затем создаётся `fantasy.NewAgent` с model/system prompt/tools и вызывается `agent.Stream`. В `PrepareStep` обновляются tools и обрабатываются queued follow-ups. Это явная session state machine, не просто `for tool_calls`.

[Run: admission/cancel](https://github.com/charmbracelet/crush/blob/7f9a8e4ca8c0365ac981d082470999900a5d10ce/internal/agent/agent.go#L566-L612), [создание agent и session history](https://github.com/charmbracelet/crush/blob/7f9a8e4ca8c0365ac981d082470999900a5d10ce/internal/agent/agent.go#L677-L716), [Stream/PrepareStep](https://github.com/charmbracelet/crush/blob/7f9a8e4ca8c0365ac981d082470999900a5d10ce/internal/agent/agent.go#L796-L845).

**Tool/provider/context.** Coordinator отдельно строит provider и tools; `buildTools` фильтрует built-ins по AllowedTools, добавляет MCP tools и оборачивает hooks. `hookedTool.Run` при ошибке hook логирует предупреждение и продолжает; явный allow помечает approval в context, updated input меняет аргументы перед `inner.Run`. Это наблюдение о hook seam, а не утверждение, что все permissions Crush обходятся при ошибке: полный permission service не аудирован.

[buildTools: фильтрация и wrappers](https://github.com/charmbracelet/crush/blob/7f9a8e4ca8c0365ac981d082470999900a5d10ce/internal/agent/coordinator.go#L789-L830), [buildProvider](https://github.com/charmbracelet/crush/blob/7f9a8e4ca8c0365ac981d082470999900a5d10ce/internal/agent/coordinator.go#L1151-L1215), [hookedTool.Run](https://github.com/charmbracelet/crush/blob/7f9a8e4ca8c0365ac981d082470999900a5d10ce/internal/agent/hooked_tool.go#L54-L101).

**Для Apiary:** перенять сериализованный admission/cancel и привязку terminal outcome к RunID. Generation должен переживать процесс и проверяться executor, поэтому in-process cancel sequence — только локальный образец. Snapshot bindings фиксируется на run/grant: динамическая замена tool implementation допустима только при новой авторизации. Policy gate не оформлять как пользовательский best-effort hook; после изменения arguments проверять разрешения и digest заново. Fantasy implementation здесь не читалась: фактическая внутренняя scheduling/retry семантика неизвестна. Не включать весь интерактивный harness и его MCP registry в worker kernel.

## Google ADK-Go: событийный Go interface с provider-shaped данными

**Наблюдения.** `agent.Agent.Run` возвращает `iter.Seq2[*session.Event, error]`; закрытый `internal()` метод связывает конструирование с SDK. `model.LLM.GenerateContent` также возвращает iterator, но `LLMRequest/Response` используют `genai.Content` и другие Google types. Поэтому сменяемый model interface не означает provider-neutral wire representation.

[Agent и constructor](https://github.com/google/adk-go/blob/53a0bc0ceb2e4437a075631f33a76f039445745f/agent/agent.go#L33-L71), [LLM/request/response](https://github.com/google/adk-go/blob/53a0bc0ceb2e4437a075631f33a76f039445745f/model/llm.go#L25-L68).

`llmAgent.run` собирает `llminternal.Flow` с model/request/response/tool callbacks. `Flow.Run` повторяет шаги до final response, ограничивает последовательные thought-only ответы и останавливается на оборванном partial. `runOneStep` выполняет preprocess → model → postprocess → yield model event; function calls обрабатываются после проверки `resp.Partial`. В `tool.Tool` базовая metadata отделена от внутреннего runnable interface; `Toolset.Tools(ctx)` допускает динамический набор. `WithConfirmation` оборачивает лишь runnable tools; confirmation check предшествует `ft.Run` в wrapper.

[llmAgent.run](https://github.com/google/adk-go/blob/53a0bc0ceb2e4437a075631f33a76f039445745f/agent/llmagent/llmagent.go#L450-L474), [Flow.Run](https://github.com/google/adk-go/blob/53a0bc0ceb2e4437a075631f33a76f039445745f/internal/llminternal/base_flow.go#L122-L168), [runOneStep](https://github.com/google/adk-go/blob/53a0bc0ceb2e4437a075631f33a76f039445745f/internal/llminternal/base_flow.go#L612-L690), [Tool/Toolset](https://github.com/google/adk-go/blob/53a0bc0ceb2e4437a075631f33a76f039445745f/tool/tool.go#L44-L64), [confirmation wrapper](https://github.com/google/adk-go/blob/53a0bc0ceb2e4437a075631f33a76f039445745f/tool/tool.go#L125-L237).

**Для Apiary:** маленький `iter.Seq2`-подобный event interface — естественный вариант Go-ядра; явно различать partial/final/interrupted. Provider adapters переводят в собственную нормализованную модель, не экспортируют `genai` в durable envelope. Tool metadata не authority; все effectful entry points проверяются одинаково, включая tools, которые SDK wrapper не оборачивает. Не копировать весь ADK agent tree, memory/artifact services или конструкторную закрытость ради одного worker loop. Callback observation не заменяет executor journal. Полный путь storage append и underlying provider implementations здесь не проверялся.

## Eino: полезный streaming pattern и осторожность с mutable bindings

**Наблюдения.** `BaseModel` разделяет `Generate` и `Stream`; `ToolCallingChatModel.WithTools` возвращает новый model instance. Комментарий к deprecated `ChatModel.BindTools` объясняет гонку при in-place изменении набора tools между goroutines. `BaseTool.Info` отделён от `InvokableRun/StreamableRun`; enhanced варианты возвращают typed multimodal results.

[BaseModel/WithTools](https://github.com/cloudwego/eino/blob/9d983b36a5112a1c233056b1a099825298fafb8f/components/model/interface.go#L35-L109), [Tool interfaces](https://github.com/cloudwego/eino/blob/9d983b36a5112a1c233056b1a099825298fafb8f/components/tool/interface.go#L25-L79).

ReAct agent собирает graph с model и ToolsNode. `StreamToolCallChecker` допускает provider-specific detector; source предупреждает, что default checker, ориентированный на ранний chunk, может не подойти модели с поздними tool calls. `StreamReader.Copy(n)` отдаёт независимые readers и передаёт владение исходным stream; копии должны закрываться. Middleware копирует stream для observer и последующего graph node. Полный алгоритм buffering `copyStreamReaders` не читался, поэтому bounded memory для медленного observer не доказана.

[tool stream middleware](https://github.com/cloudwego/eino/blob/9d983b36a5112a1c233056b1a099825298fafb8f/flow/agent/react/react.go#L65-L93), [NewAgent](https://github.com/cloudwego/eino/blob/9d983b36a5112a1c233056b1a099825298fafb8f/flow/agent/react/react.go#L278-L325), [StreamReader.Copy](https://github.com/cloudwego/eino/blob/9d983b36a5112a1c233056b1a099825298fafb8f/schema/stream.go#L246-L275).

**Для Apiary:** immutable per-run bindings и явное владение stream полезнее заимствования graph engine. Authoritative tool dispatch — только после полного валидированного call, даже если UI узнал о tool intent раньше. Observer stream получает bounded queue или durable cursor; не предполагать, что generic Copy ограничивает память. Fan-out требует cancellation/close для каждого consumer и общего resource budget. Eino включён именно ради этого отличающегося Go stream pattern; benchmark и доказательство отсутствия goroutine leaks не проводились.

## Kimi CLI: inspected predecessor и подтверждённый актуальный successor

README `MoonshotAI/kimi-cli` сообщает переход к `MoonshotAI/kimi-code`, постепенное сворачивание прежнего проекта и миграцию configuration/sessions при установке нового. Свежий clone successor README подтверждает Kimi Code CLI как terminal coding agent с возможностью compatible providers. Здесь **не проверялась source parity** старого `KimiSoul` и нового Kimi Code; старые anchors не приписываются новому продукту.

[уведомление о переходе](https://github.com/MoonshotAI/kimi-cli/blob/86f136422a0aae6b217ea49e7ea1d2e8a1defcd2/README.md#L1-L16), [successor README](https://github.com/MoonshotAI/kimi-code/blob/fa87d040c3086cdceb3bee24762451cf47af0336/README.md#L1-L11).

В прочитанном predecessor `KimiSoul._step` передаёт request provider, prompt, toolset и effective history в `kosong.step`; step обёрнут ограниченным retry с exponential jitter и connection recovery. Compaction завершает отдельный checkpoint и добавляет новые messages. При этом фактический executor внутри Kosong не инспектировался: нельзя из одного call site заключить, что retry никогда не дублирует tool effect.

[_step: provider/tool/history и retry](https://github.com/MoonshotAI/kimi-cli/blob/86f136422a0aae6b217ea49e7ea1d2e8a1defcd2/src/kimi_cli/soul/kimisoul.py#L1199-L1245), [compaction checkpoint](https://github.com/MoonshotAI/kimi-cli/blob/86f136422a0aae6b217ea49e7ea1d2e8a1defcd2/src/kimi_cli/soul/kimisoul.py#L1573-L1604).

**Для Apiary:** request-scoped provider view, bounded recovery и compaction как явное событие. Не переносить retry всего step как гарантию exactly-once. Новый successor включён на document-only глубине: механизм predecessor достаточен для рассматриваемого вывода, расширение обзора successor loop не заявлено. Значимость здесь означает релевантность актуальной официальной линии продукта, не доказанный market share.

## Hermes: разделение transcript и request context, lifecycle через facade

Canonical `NousResearch/hermes-agent` проверен API и собственным README, который ссылается на официальный сайт Nous. В `run_agent.py` AIAgent собирается из mixins; фактический `run_conversation` проходит `TurnFacadeMixin` к `agent.conversation_loop.run_conversation`. Facade импортирует `admit_durable_turn_lease`, но сама lease implementation не читалась, поэтому fencing/durable correctness этого механизма не утверждается.

[AIAgent composition](https://github.com/NousResearch/hermes-agent/blob/2237be355906fbe6065ce1815711eee52b2d646e/run_agent.py#L211-L216), [run_conversation facade](https://github.com/NousResearch/hermes-agent/blob/2237be355906fbe6065ce1815711eee52b2d646e/agent/turn_facade.py#L20-L74).

Loop разделён на phases: begin/prepare/assemble/preflight, API retry, normalization, tool round или text response, finalization; условие учитывает iteration budget и отдельный grace call. ProviderProfile даёт hooks для messages и API kwargs. ContextEngine.select_context предназначен для request-only замены контекста; helper клонирует вложенные сообщения transcript, а при исключении/некорректном result сохраняет исходный request. Это сознательный fail-open для optional context optimization, не authority policy.

[run_conversation: phases/budget](https://github.com/NousResearch/hermes-agent/blob/2237be355906fbe6065ce1815711eee52b2d646e/agent/conversation_loop.py#L1455-L1541), [_apply_context_engine_selection](https://github.com/NousResearch/hermes-agent/blob/2237be355906fbe6065ce1815711eee52b2d646e/agent/conversation_loop.py#L1153-L1198), [ContextEngine contract](https://github.com/NousResearch/hermes-agent/blob/2237be355906fbe6065ce1815711eee52b2d646e/agent/context_engine.py#L120-L153), [ProviderProfile methods](https://github.com/NousResearch/hermes-agent/blob/2237be355906fbe6065ce1815711eee52b2d646e/providers/base.py#L144-L180).

**Для Apiary:** хранить полный authoritative event history отдельно от model projection; context selection не должно менять audit transcript. Grace/retry budgets задавать host policy, не self-request модели. Fail-open допустим для необязательной оптимизации, но запрещён при grant/authority read failure. Упоминание provider-specific subscription adapter в коде не доказывает entitlement. Не переносить monolithic mixin/facade structure, broad tools и общие ambient credentials как минимальный kernel.

## Рекомендуемые Go interfaces и отвергнутые shortcuts

Это предложения, а не существующие API:

| Граница | Минимальное содержание | Что остаётся снаружи |
|---|---|---|
| ModelProvider | Generate/Stream(request, context) → typed deltas, final call/message, usage, error | Credential resolution, subscription product flow и provider SDK types |
| ContextProjector | journal cursor + budget → immutable model messages + provenance ссылки | Authority state, acceptance criteria и signing decisions |
| ToolBinding | schema digest + typed request/result + cancellation handle | MCP/ACP/A2A реализации и произвольные plugin imports |
| ExecutionClient | stable operation ID, grant/plan/generation, query/reconcile/cancel | Durable admission, quotas, filesystem/egress enforcement в доверенной environment |
| Journal | append/read по cursor, явные unknown/error, idempotent operation references | BFT и transport-specific ack counters |

Worker и orchestrator используют эти же интерфейсы; различаются manifest bindings и host-issued grants. Один tool-skill не означает один неограниченный `any`: его union операций и параметры должны оставаться typed и проверяемыми. У worker нет встроенного local host shell. Orchestrator получает только Curator-installed project-management/communication/sandbox skills, не прямую возможность менять kernel policy.

Ни один из рассмотренных runtime не проверялся здесь через crash, partition, adversarial plugin или sink-side dedup. Поэтому из статического чтения не следует, что он обеспечивает либо не обеспечивает Apiary I1–I10. Приёмка будущей реализации требует отрицательных тестов на фактической execution boundary, перечисленных в основном отчёте.
