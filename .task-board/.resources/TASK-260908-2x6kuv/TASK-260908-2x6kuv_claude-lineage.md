# Claude Code: происхождение открытых переработок и последствия для Apiary

Дата получения источников: **2026-09-08**, часовой пояс рабочего окружения Asia/Tbilisi. Задача: **TASK-260908-2x6kuv**, родитель STORY-260908-1l3m6n. Метод: первичная документация, метаданные GitHub и статическое чтение конкретных файлов закреплённых ревизий. Сторонний код, install scripts, builds и tests **не выполнялись**. Это исследование архитектуры, а не аттестация безопасности или юридическое заключение.

## Вывод для проектирования

Для Apiary целесообразно независимо реализовать небольшое Go-ядро: цикл модели, типизированные события и вызовы, проверка полномочий, budgets/cancellation, журнал и управляемое сокращение контекста. Worker и orchestrator должны отличаться установленными capabilities и политикой, а не двумя реализациями цикла. Источники ниже показывают полезные механизмы и конкретные ошибки границ; они не дают оснований переносить весь Claude-подобный runtime или считать публичную переработку разрешённым источником proprietary кода.

Особенно значимы три наблюдения: Python fork из исходного lead генерирует диагностический текст вместо настоящего model/tool loop; проверенные C++ модули — migration stubs; текущие Rust Claw и claux имеют исполняемую структуру цикла, но принципиально отличаются наследованием разрешений дочерних агентов. В Claw дочерняя policy создаётся с `DangerFullAccess`, в claux она передаётся от родителя. Наличие отдельной conversation само по себе не означает filesystem/process isolation. [P1] [X1] [X2] [C5] [C6] [L3]

## Границы доказательства и поиск

Интернет-поиск включал `github "claw-code" "instructkr"`, `github Claude Code leaked source rewrite clawc`, запросы о Rust rewrite и multi-agent framework. Проверены все три переданных lead; дополнительно найден авторский материал Jake Goldsborough с прямой ссылкой на `ducks/claux` и социальные заявления об Open Multi-Agent. Обследование целевое, **не исчерпывающее**: число stars, скорость их роста, поисковый ранг и чужие обзоры не используются как доказательства качества, происхождения или сопровождения.

Обозначения: **наблюдение** — прочитанный путь кода/метаданные; **заявление** — слова автора проекта; **вывод** — интерпретация наблюдения; **рекомендация** — самостоятельное решение для Apiary. Проверка `pushed_at` свидетельствует лишь об изменениях репозитория, не о работающем продукте. GitHub `archived` и «архив исходников» — разные понятия.

Для каждой скачанной working tree локальный `git rev-parse HEAD` совпал с зафиксированной ниже ревизией. Использованы свежие shallow clones под `.temp/claude-lineage/`; история до этих heads не аудировалась. Никаких аккаунтов, OAuth-хранилищ, credentials или закрытых источников не открывали. Raw `.md` endpoints официальных docs вернули HTTP 403; они не были обойдены. Чтение соответствующих публичных HTML-страниц через web tool удалось. Поэтому официальные docs — **живые страницы на дату получения**, не документальная версия, криптографически связанная с SDK SHA.

## Таблица provenance и доступности

| Объект | Доступность и закрепление | Что подтверждено | Что не установлено / ограничения повторного использования |
|---|---|---|---|
| Официальные [Agent SDK docs](https://code.claude.com/docs/en/agent-sdk/overview) | HTML доступен 2026-09-08; прежний platform URL перенаправляет на code.claude.com | Публичный контракт SDK, loop, permissions, hooks, subagents | Docs могут описывать более новый binary, чем отдельная библиотека; это не открытый исходник внутреннего Claude Code loop |
| `anthropics/claude-agent-sdk-python` | Доступный исходник; SHA **efd4d865ef1795daffee3cd24cce45307aed8a51** | Python transport/control protocol; LICENSE MIT [S1] [S2] [S3] | MIT у wrapper не переоформляет права на bundled Claude Code binary; условия сервиса отдельно |
| `anthropics/claude-code` | Публичный repo; SHA **ab9b2cf7bb9e4f98ff264c07a22e46d83c29c558** | `LICENSE.md`: права сохранены Anthropic, использование по Commercial Terms [S4] | Публичность репозитория не равна open-source лицензии runtime; внутренний proprietary loop здесь не реконструировался |
| `instructkr/claw-code` → `ultraworkers/claw-code` | Redirect проверен; SHA **08106b0c3771ef5b4a5aa176acccd460e88b7325**; `archived=false`, `pushed_at=2026-08-16` | Текущий Rust runtime прочитан; README называет проект agent-managed museum exhibit; корневой LICENSE MIT [C0] [C8] | Историческое clean-room заявление видно в Python fork; независимого аудита цепочки прав нет. Смена имени владельца и GitHub redirect не доказывают каждую стадию истории |
| `mzpatrick0529-mzyh/claw-code` | Доступен; SHA **01bf54ad15a894957f1dfb9fbb0d10f92684c856**; `pushed_at=2026-03-31` | README прямо заявляет fork от instructkr и Python rewrite после изучения exposed harness [P0]; прочитан QueryEngine [P1] | Заявление clean-room не подтверждено процессными доказательствами. Корневого LICENSE в tracked files нет; GitHub license=null. Не полноценный эквивалент runtime |
| `c2b247007/clawc` | Доступен; SHA **ea4c2616c5b5a3171b5f64841946b26870abcb88**; `pushed_at=2026-04-01` | Автор заявляет C++ rewrite, вдохновлённый leak, и предупреждает о stubs [X0]; проверенные implementation bodies — stubs [X1]–[X4] | Не доказана работоспособность C++ loop, permission enforcement, hooks или compaction. Корневого LICENSE нет; GitHub license=null |
| `ducks/claux` | Доступный Rust source; SHA **4bdeb40532c9267e2a9d27e3caac81e21ef63e39**; `pushed_at=2026-09-07` | [Авторский рассказ](https://jakegoldsborough.com/blog/2026/rewriting-claude-code-in-rust-with-claude/) прямо описывает чтение исходника из leak и генерацию Rust; реализация рассмотрена ниже | Это подтверждение **заявленного происхождения**, не экспертиза оригинальности. Cargo.toml указывает MIT [L7], но корневого LICENSE нет, GitHub license=null; недостаточно для беспроблемного заимствования |
| `open-multi-agent/open-multi-agent` (OMA) | Доступный TypeScript source; SHA **e678bfb3e7c9313be78303c2c32294417bb58dbb**; `pushed_at=2026-09-07`; LICENSE MIT [O6] | Реальные runner, executor, context strategy и task prompt прочитаны [O1]–[O5] | [Социальный пост](https://www.reddit.com/r/LocalLLaMA/comments/1s8xj2e/claude_codes_source_just_leaked_i_extracted_its/) заявляет извлечение архитектуры; связь автора аккаунта с владельцем repo не подтверждена. Прочитанный текущий README не заявляет leak lineage. **Не классифицируем как доказанный descendant** |
| `shawnchen732/claw-cli-claude-code-source-code-v2.1.88` | [Repo на закреплённой ревизии](https://github.com/shawnchen732/claw-cli-claude-code-source-code-v2.1.88/tree/6f3ce157cbedd71261cbfe7147417b1187033f6b) и API доступны; SHA **6f3ce157cbedd71261cbfe7147417b1187033f6b** | README/description позиционируют snapshot v2.1.88 и попытку Bun build. API: `archived=false`, `pushed_at=2026-03-31`, license=null | Переданный lead «archived» не подтверждается флагом GitHub. Это заявленный архив proprietary snapshot, не доказательство независимой поддерживаемой переработки. Source tree намеренно не клонировалась и не использовалась для технических выводов; не утверждаем её недоступность |

Удалённых/недоступных canonical repositories среди проверенных lead не установлено. Недоступными оказались именно `.md` представления официальных страниц. Отсутствие лицензии, отказ чтения и отсутствие реализации фиксируются раздельно. LazyCodex/Gajae-Code упомянуты текущим Claw README как рекомендуемые автором проекты; эта ссылка сама по себе не подтверждает происхождение от leak, поэтому в таблицу доказанных descendants они не добавлены. OpenClaw, Pi и OpenCode также не объявляются descendants по сходству интерфейсов.

## Официальная поверхность: что действительно можно использовать

**Наблюдение по исходнику.** `SubprocessCLITransport.connect` проверяет CLI, собирает команду и запускает процесс через `anyio.open_process` со stdin/stdout pipes и cwd. `Query._handle_control_request` разбирает `can_use_tool`, вызывает пользовательский callback и сериализует allow/deny; другая ветка dispatch вызывает hook callback. Это проверяемый открытый transport/control слой, а не Python-реализация model loop. В прочитанном callback context `signal=None` с TODO: нельзя обещать полную семантику cancellation из одного общего описания SDK. [S1] [S2]

**Документированный контракт.** [Agent loop](https://code.claude.com/docs/en/agent-sdk/agent-loop) описывает повторение model response → tool execution → tool results; отсутствие tool calls завершает цикл. Есть budgets/max turns и разные result subtypes. Автоматическая compaction заменяет старую историю summary и выдаёт `compact_boundary`; ранние инструкции могут потеряться. Для Go официальный overview предлагает CLI subprocess, тогда как библиотеки представлены Python/TypeScript. Это вариант использовать чужой готовый harness, а не заменить model adapter собственного Go-loop.

[Permissions](https://code.claude.com/docs/en/agent-sdk/permissions) описывает порядок hooks, deny, ask и последующих разрешений: hook allow не отменяет deny/ask. Следствие для Apiary — решение о запуске нельзя свести к названию режима или model-visible списку tools. [Subagents](https://code.claude.com/docs/en/agent-sdk/subagents) документирует отдельный контекст, ограничение tools и возврат результата родителю; это контракт контекста, не универсальная гарантия ОС-изоляции. [Hooks](https://code.claude.com/docs/en/agent-sdk/hooks) различает lifecycle events, в том числе PreCompact, и неодинаковые последствия ошибок/timeout. Для собственного ядра нужен явный тип hook: обязательный policy gate либо необязательный observer.

Эти страницы живые: например, permissions содержит уточнение для Claude Code v2.1.212, а hooks — изменение поведения v2.1.208. Нельзя приписывать эти детали snapshot v2.1.88 или всем версиям SDK.

## Реальные механизмы в inspectable переработках

### Rust Claw: полный путь, но небезопасно переносить defaults

**Наблюдение.** `ConversationRuntime::run_turn` добавляет пользовательское сообщение, считает iterations, вызывает `api_client.stream`, собирает assistant message и ToolUse blocks. Для каждого tool выполняется pre-hook; изменённый input передаётся в `authorize_with_context`; отказ становится tool_result; разрешение ведёт к `tool_executor.execute`; далее вызываются post-success/post-failure hooks. В этом пути tools выполняются последовательно. Post-hook может пометить результат ошибкой, но уже совершённое действие не откатывает. [C1]

**Hooks.** `RuntimeHookRunner::run_command` запускает shell command с JSON stdin и данными события; exit 0 разбирается на allow/deny, exit 2 означает deny, прочие коды — failure. В `run_turn` failure/cancel pre-hook также приводят к отказу. Это реально подключённый gate, а не только перечень поддерживаемых событий. Процесс shell hook сам по себе требует ограниченного окружения и контроля полномочий; проверенный код не доказывает общей sandbox-гарантии. [C4] [C1]

**Compaction.** `compact_session` сохраняет хвост, корректирует границу рядом с tool-result и вставляет summary. `summarize_messages` строит его детерминированно из счётчиков, имён tools, последних запросов, извлечённых путей и сокращённой временной линии; вызова модели в этой функции нет. Это эвристическая компрессия, а не доказанная семантическая сохранность задачи. `run_turn` вызывает auto-compaction до следующего API-вызова, в том числе в последней итерации. Наличие boundary logic не доказывает корректность всех многоблочных provider последовательностей: тесты здесь не запускались. [C2] [C3] [C1]

**Subagents/tasks.** `spawn_agent_job` создаёт Rust thread, ловит panic и сохраняет terminal state. `run_agent_job` строит новый ConversationRuntime/Session и вызывает `run_turn(..., None)`; `allowed_tools_for_subagent` задаёт ограниченный набор по типу. Но `agent_permission_policy` создаёт `DangerFullAccess`, а не получает parent policy. Это конкретный пример потенциального расширения полномочий на delegation boundary; реальную exploitability и все внешние gate-пути мы не проверяли. Thread и новый Session не создают отдельную ОС-среду. `TaskRegistry` хранит task status/heartbeat/output; это другой механизм, чем изолированное исполнение дочернего агента. [C5] [C6] [C9]

**Дополнительная граница.** `PermissionEnforcer::check` в Prompt возвращает Allowed, делегируя решение внешнему interactive flow; другие методы обрабатывают Prompt иначе. Поэтому результат отдельного helper нельзя использовать как доказательство защищённости entrypoint. Лексическая workspace-проверка и классификация shell commands также не заменяют filesystem sandbox. [C7]

**Последствие для Apiary.** Не переносить enum-иерархию permissiveness и child default full access. Подписываемое/версионируемое разрешение дочернего запуска должно быть подмножеством родительского; model transcript не является источником полномочий. Orchestrator tool-skill создаёт дочерний run через Curator sandbox boundary; Go-loop получает уже ограниченный executor.

### claux: единый цикл, transactional compaction и наследование policy

**Наблюдение.** `Engine` использует общий `run_turn` для submit и streaming entrypoints. Dispatch проверяет permission для каждого вызова; смежные read-only + Allow вызовы группируются, mutating/Ask/Deny прерывают такую группу. Cancellation и steering проверяются перед выполнением; непроизошедшим вызовам возвращаются error results. В non-interactive режиме Ask превращается в отказ. Это статически прочитанное поведение, а не измерение throughput. [L1]

**Compaction.** `compact_with_cancel` вызывает `summarize_conversation` через provider с пустым tool list. До замены истории проверяется: stream завершён, нет cancellation, summary непустой, оценка нового контекста меньше прежней. Ошибка сохраняет историю; provider cursor сбрасывается на соответствующих отказах. Сохраняется исходный запрос; continuation зависит от того, будет ли новый пользовательский ввод. Порог сам по себе не гарантирует качество summary, но замена перестаёт быть необратимым усечением по любому ответу модели. [L2]

**Subagent.** `AgentTool::execute` создаёт provider и отдельный Engine, использует `ToolRegistry::without_agent`, получает `permission_policy.checker()`, передаёт trust/sandbox objects и cancellation. Вложенный Agent отсутствует. Отдельный контекст сочетается с общей рабочей директорией; это не отдельный контейнер. Переносимый паттерн — наследование policy и сужение tool registry, а не копирование prompt. [L3]

**Hooks: важное различие.** `fire_hook` исполняет side effects и логирует ошибку; `decide_permission` сначала получает обычное решение, затем интерпретирует `OnPermissionCheck` outputs. `PluginRegistry::execute_decisions` логирует ошибки plugins и не включает их в возвращённые решения; malformed verdict также лишь предупреждает в `decide_permission`. Следовательно, такой hook нельзя без изменения контракта назначить обязательным compliance gate: отказ инфраструктуры может оставить исходное разрешение действующим. Это вывод о прочитанном пути; не утверждение, что любой hook всегда bypasses policy. [L4] [L5] [L8]

**Provider boundary.** `Provider` принимает messages/system/tools и возвращает ProviderStream; `Drop` потока отменяет reader, а `reset_session` отделяет provider continuation cursor от новой conversation. Для Go полезны owner-controlled cancellation и явный сброс provider session после переписывания контекста. Это не повод переносить credential lookup в tools. [L6]

### Python fork и C++ clawc: пределы заявленного паритета

В Python `QueryEngine.submit_message` форматирует prompt, matched commands/tools и число отказов в output, вычисляет usage, записывает prompt и обрезает history; `stream_submit_message` оборачивает это в события. В прочитанном методе нет сетевого model call и рекурсивного выполнения новых tools по model output. `compact_messages_if_needed` оставляет последние N записей, без semantic summary. `ToolPermissionContext.blocks` сопоставляет lower-case names/prefixes. Это полезный scaffolding, но не основание объявлять восстановленную production architecture. Hooks и изоляция исполняемых subagents в этих прочитанных путях не установлены; перечни mirrored modules не считаются реализацией. [P1] [P2]

В `clawc` проверены `src/query.cpp`, `src/permissions.cpp`, `cpp/crates/runtime/src/compact.cpp`, `cpp/crates/runtime/src/hooks.cpp`: исполняемые тела `migration_note_`/`migration_note` возвращают строку о незавершённом переносе; Python/Rust тела вложены в комментарии как reference. Таким образом, для этих **4 из 4 проверенных файлов** продемонстрированы заглушки, а не действующий C++ механизм. Это не измерение доли заглушек во всём repo. Комментарии нельзя засчитать за работающий loop, permissions или hooks; никаких runtime результатов этому проекту не приписываем. [X1] [X2] [X3] [X4]

### OMA: содержательный comparator с неподтверждённой lineage

**Наблюдение.** `AgentRunner.run` получает `toolDefs = resolveTools()` и сохраняет grantedToolNames. `executeToolCall` повторно проверяет имя перед ToolExecutor: даже зарегистрированный, но не выданный агенту tool возвращает ошибку. В executor после schema parse проверяются abort и gate; исключение или malformed gate decision означает error result. Durable approval сравнивается с hash текущего validated invocation; suspend возвращает pending approval вместо исполнения. Это разделение model visibility, runtime admission и human approval полезно независимо от происхождения OMA. Проверка hash не является доказательством доверия к личности reviewer: полный authority backend здесь не аудирован. [O1] [O2] [O3]

**Контекст и задачи.** `compactMessages` оставляет первый user message и последние turn pairs, сокращая старые большие блоки; это rule-based strategy без LLM-вызова в этой функции, наряду с отдельно существующей summarize strategy. `executeQueue` вызывает `buildTaskPrompt`; последний по умолчанию добавляет только результаты explicit dependencies, а полную shared memory — при `memoryScope=all`. Это ограничение информационной видимости, не ОС sandbox. Сам scheduler — отдельный orchestration слой, который Apiary не обязан встраивать в kernel. [O4] [O5]

Никакое из этих наблюдений не доказывает копирование Claude Code. OMA оставлен в отчёте как реально исследованный сравнительный framework, а не как установленный потомок leak. [O0]

## Лицензии, происхождение и entitlement

**Проверенные лицензии.** Корневые MIT LICENSE прочитаны у Claw, OMA и Python Agent SDK. У claux прочитано только `license = "MIT"` в Cargo.toml; отсутствие корневого LICENSE и GitHub license=null сохранены как расхождение сигналов. У Python fork и clawc корневого LICENSE нет. У официального Claude Code LICENSE.md прямо сохраняет права Anthropic. README «clean-room», смена языка, открытый GitHub и MIT файл у третьего лица не доказывают права этого лица на весь исходный материал. Для code reuse потребуются отдельная проверка цепочки прав/зависимостей и выполнение действительных лицензий; этот отчёт не выдаёт такого разрешения. [C8] [O6] [S3] [S4] [L7]

**Независимое проектирование.** Рекомендации ниже сформулированы заново из наблюдаемых границ и публичных контрактов. В deliverable не перенесены исходники leak, proprietary prompts, credentials или большие выдержки из лицензий. Перед разработкой следует использовать этот prose-контракт и собственные тесты, а не port snapshot; это способ ограничить заимствование выражения, не юридическая гарантия отсутствия спора.

**Подписка не равна API entitlement.** [Официальный overview SDK](https://code.claude.com/docs/en/agent-sdk/overview) требует API-key methods для сторонних продуктов, если нет отдельного разрешения на claude.ai login/rate limits. [Legal and compliance](https://code.claude.com/docs/en/legal-and-compliance) отдельно допускает пользовательский вход в неизменённый Claude Code, в том числе размещённый платформой, при соблюдении условий: binary не модифицируется, встроенные способы входа не ограничиваются, использование оплачивает сам пользователь, платформа не посредничает в его credentials/usage. Для собственного Go harness это **не** разрешение применять subscription token в самодельном HTTP adapter. API key или поддерживаемый cloud-provider credential — другой разрешённый канал. Конкретные тарифы, лимиты и доступность моделей в аккаунте здесь не проверялись.

## Предлагаемые границы Apiary и отвергнутые варианты

Все строки ниже — **рекомендации**, не описание уже существующего Apiary runtime.

| Решение | Конкретный контракт | Основание / отвергнутая альтернатива |
|---|---|---|
| Один Go kernel для двух профилей | Run/session IDs, model event stream, bounded loop, typed tool call/result, policy decision, cancellation и durable journal | Не создавать два цикла с различающейся headless semantics; claux показывает смысл общего dispatch [L1] |
| Worker: один центральный typed tool-skill | Операция с закрытой схемой и установленным Curator executor; capability на run/операцию/ресурс. При необходимости signing — отдельный узкий вызов, привязанный к digest и разрешённому действию | Не прятать произвольный shell/eval внутри «одного инструмента»: малое число имён не означает малые полномочия [O1] [C7] |
| Orchestrator: тот же kernel | Curator устанавливает project-management, communication и sandbox tool-skills; task DAG и routing принадлежат этим расширениям | Не помещать scheduler/team registry/MCP clients во внутреннюю модель ядра только ради Claude-паритета [C9] [O5] |
| Admission перед каждым side effect | Parse → scope/policy → required gate → execute → journal result; скрытие tool schema дополняется проверкой перед execute | Не считать tool list достаточной защитой; OMA проверяет granted set повторно [O2] |
| Дочерний запуск | Child policy ≤ parent policy; отдельные run IDs, transcript, budgets и capability envelope; sandbox задаётся Curator | Не переносить Claw default DangerFullAccess и не считать thread/new Session sandbox [C5] [C6] [L3] |
| Обязательные gates и observers разделены | Gate timeout/error/malformed output = отказ; observer failure = отдельное диагностическое событие | Не назначать best-effort hook охранным барьером [L4] [L5] |
| Compaction как транзакция | Сохранить исходный журнал; проверить завершение summary, непустоту, уменьшение context estimate и целостность tool-call/result; только затем заменить view | Не обрезать историю просто по N turns; не повышать summary до источника policy/доказательств [P1] [L2] [C2] |
| Providers вне tool-skills | Provider adapter принимает normalized request и закрытую host-side credential reference; model-visible tool не читает и не выбирает credentials | Не превращать API/OAuth bootstrap в вызов модели. Provider cursor и cancellation принадлежат runtime/adapter [L6] |
| MCP только out-of-process | Curator-installed wrapper владеет MCP session/transport; kernel видит типизированный capability interface и ограниченный result | Не встраивать MCP registry/protocol и provider login в минимальный kernel. SDK показывает практичность процессной границы [S1], но не диктует MCP форму Apiary |
| Официальный Claude Code — отдельная интеграция | При необходимости запуск неизменённого binary как внешнего harness с явно обозначенными terms | Не называть binary subprocess «model provider» своего loop и не выдавать subscription за универсальный API доступ |

**Предлагаемые проверки при реализации** (здесь не выполнялись): неизвестный/невыданный tool; изменённый input после approval; gate timeout/exception; child запрос capability шире parent; отмена во время tool и provider stream; crash до/после записи result; summary stream без completion; summary без сокращения; orphan tool_result; повторное исполнение irreversible tool после resume. Обязательные изменения runtime должны сопровождаться отрицательными tests через реальный entrypoint. Этот research не содержит runtime delta и не подменяет такие tests.

## Журнал исследования, локальный контекст и открытые вопросы

- 2026-09-08: подтверждён redirect instructkr → ultraworkers; текущая museum-позиция расходится со старыми описаниями Python-first. Не смешивать эти состояния.
- 2026-09-08: исправлено предположение lead об archived snapshot: API сообщает archived=false. Содержательно это всё равно заявленный source snapshot, не доказанная независимая переработка.
- 2026-09-08: подтверждены stubs в четырёх C++ файлах; benchmark/build claims из README не использовались как результаты проверки.
- 2026-09-08: выявлены различия child permissions Claw/claux и best-effort permission-hook ошибок claux; записаны как архитектурные риски с ограничением статической проверки.
- 2026-09-08: официальные `.md` fetch получили 403; публичный HTML прочитан, обходов не предпринималось. Не выдаём непрочитанный markdown snapshot за закреплённую документацию.

Локальные siblings читались только для origin/HEAD/dirty inventory, не изменялись. Эти HEAD не заявляются текущим remote main; свежие remote snapshots siblings не требовались, поскольку их содержимое не служит доказательством внешней lineage или нормативных требований. Целевые ограничения Apiary взяты из задания, не приписаны этим репозиториям.

| Repo | Origin | HEAD | Working tree |
|---|---|---|---|
| apiary-docs | git@github.com:relux-works/apiary-docs.git | `e4249a6193c0f2730e7cffaea6b4907c0a7e80a9` | clean |
| curator | https://github.com/relux-works/curator.git | `a66eec88fa4dfb8f3ca098f594f6e48af57a6835` | dirty; сохранён без изменений |
| curator-spec | https://github.com/relux-works/curator-spec.git | `87a0d0060bad64ab883d007dcdf35df7485368bf` | clean |
| skill-project-management | git@github.com:relux-works/skill-project-management.git | `074c249df6c316958184dca5da3049a378adfb5a` | clean |

Открыто для отдельной проверки перед code reuse: права на отдельные файлы переработок и их источники; лицензирование claux при отсутствии LICENSE; документально подтверждённая lineage OMA; семантическая сохранность compaction; реальная containment/credential isolation каждого runtime. Эти вопросы **не блокируют независимую реализацию предложенного минимального контракта**, но блокируют вывод «можно без проверки скопировать runtime».

## Проверка deliverable и воспроизводимость

Все clone-команды завершились exit 0; их logs и `repositories.json`, `snapshot-pins.json`, `local-inputs.json` находятся в `.temp/claude-lineage/`. Изначальный поиск отсутствующих skill directories через `rg` завершился exit 2 (часть каталогов отсутствует); это не отсутствие всех skills: указанный role skill прочитан по абсолютному пути. Процесс получения metadata/markdown завершился exit 0, но **все пять markdown HTTP fetch отказали с 403** — это обработанные ошибки, а не успешная загрузка.

Отдельная проверка документа `python3 .temp/claude-lineage/verify_report.py` проверяет разрешение ссылок на закреплённые локально исходники, существование line anchors и SHA; это структурная проверка, не автоматическая оценка истинности текста. `git diff --check -- .research/260908_claude-lineage.md` проверяет формат diff. Результаты этих команд и ограничения переданы в task-scoped handoff resource. Чужие тесты не запускались; benchmark, security guarantee и юридическая чистота не заявлены.

## Закреплённые ссылки на прочитанный код

Ниже каждый идентификатор ведёт на exact commit и начальную строку соответствующего прочитанного блока. Полные пути и symbol names описаны в тексте; локальные clones — вспомогательная воспроизводимость, GitHub permalinks — переносимая evidence surface.

[C0]: https://github.com/ultraworkers/claw-code/blob/08106b0c3771ef5b4a5aa176acccd460e88b7325/README.md#L69

[C1]: https://github.com/ultraworkers/claw-code/blob/08106b0c3771ef5b4a5aa176acccd460e88b7325/rust/crates/runtime/src/conversation.rs#L325

[C2]: https://github.com/ultraworkers/claw-code/blob/08106b0c3771ef5b4a5aa176acccd460e88b7325/rust/crates/runtime/src/compact.rs#L96

[C3]: https://github.com/ultraworkers/claw-code/blob/08106b0c3771ef5b4a5aa176acccd460e88b7325/rust/crates/runtime/src/compact.rs#L203

[C4]: https://github.com/ultraworkers/claw-code/blob/08106b0c3771ef5b4a5aa176acccd460e88b7325/rust/crates/runtime/src/hooks.rs#L421

[C5]: https://github.com/ultraworkers/claw-code/blob/08106b0c3771ef5b4a5aa176acccd460e88b7325/rust/crates/tools/src/lib.rs#L4175

[C6]: https://github.com/ultraworkers/claw-code/blob/08106b0c3771ef5b4a5aa176acccd460e88b7325/rust/crates/tools/src/lib.rs#L4338

[C7]: https://github.com/ultraworkers/claw-code/blob/08106b0c3771ef5b4a5aa176acccd460e88b7325/rust/crates/runtime/src/permission_enforcer.rs#L27

[C8]: https://github.com/ultraworkers/claw-code/blob/08106b0c3771ef5b4a5aa176acccd460e88b7325/LICENSE#L1

[C9]: https://github.com/ultraworkers/claw-code/blob/08106b0c3771ef5b4a5aa176acccd460e88b7325/rust/crates/runtime/src/task_registry.rs#L125

[P0]: https://github.com/mzpatrick0529-mzyh/claw-code/blob/01bf54ad15a894957f1dfb9fbb0d10f92684c856/README.md#L16

[P1]: https://github.com/mzpatrick0529-mzyh/claw-code/blob/01bf54ad15a894957f1dfb9fbb0d10f92684c856/src/query_engine.py#L61

[P2]: https://github.com/mzpatrick0529-mzyh/claw-code/blob/01bf54ad15a894957f1dfb9fbb0d10f92684c856/src/permissions.py#L7

[X0]: https://github.com/c2b247007/clawc/blob/ea4c2616c5b5a3171b5f64841946b26870abcb88/README.md#L9

[X1]: https://github.com/c2b247007/clawc/blob/ea4c2616c5b5a3171b5f64841946b26870abcb88/src/query.cpp#L1

[X2]: https://github.com/c2b247007/clawc/blob/ea4c2616c5b5a3171b5f64841946b26870abcb88/src/permissions.cpp#L1

[X3]: https://github.com/c2b247007/clawc/blob/ea4c2616c5b5a3171b5f64841946b26870abcb88/cpp/crates/runtime/src/compact.cpp#L1

[X4]: https://github.com/c2b247007/clawc/blob/ea4c2616c5b5a3171b5f64841946b26870abcb88/cpp/crates/runtime/src/hooks.cpp#L1

[L1]: https://github.com/ducks/claux/blob/4bdeb40532c9267e2a9d27e3caac81e21ef63e39/src/query.rs#L1730

[L2]: https://github.com/ducks/claux/blob/4bdeb40532c9267e2a9d27e3caac81e21ef63e39/src/query.rs#L849

[L3]: https://github.com/ducks/claux/blob/4bdeb40532c9267e2a9d27e3caac81e21ef63e39/src/tools/agent.rs#L125

[L4]: https://github.com/ducks/claux/blob/4bdeb40532c9267e2a9d27e3caac81e21ef63e39/src/query.rs#L1900

[L5]: https://github.com/ducks/claux/blob/4bdeb40532c9267e2a9d27e3caac81e21ef63e39/src/plugin.rs#L181

[L6]: https://github.com/ducks/claux/blob/4bdeb40532c9267e2a9d27e3caac81e21ef63e39/src/api/provider.rs#L9

[L7]: https://github.com/ducks/claux/blob/4bdeb40532c9267e2a9d27e3caac81e21ef63e39/Cargo.toml#L1

[L8]: https://github.com/ducks/claux/blob/4bdeb40532c9267e2a9d27e3caac81e21ef63e39/src/query.rs#L405

[O0]: https://github.com/open-multi-agent/open-multi-agent/blob/e678bfb3e7c9313be78303c2c32294417bb58dbb/README.md#L40

[O1]: https://github.com/open-multi-agent/open-multi-agent/blob/e678bfb3e7c9313be78303c2c32294417bb58dbb/packages/core/src/agent/runner.ts#L1113

[O2]: https://github.com/open-multi-agent/open-multi-agent/blob/e678bfb3e7c9313be78303c2c32294417bb58dbb/packages/core/src/agent/runner.ts#L1816

[O3]: https://github.com/open-multi-agent/open-multi-agent/blob/e678bfb3e7c9313be78303c2c32294417bb58dbb/packages/core/src/tool/executor.ts#L198

[O4]: https://github.com/open-multi-agent/open-multi-agent/blob/e678bfb3e7c9313be78303c2c32294417bb58dbb/packages/core/src/agent/runner.ts#L2037

[O5]: https://github.com/open-multi-agent/open-multi-agent/blob/e678bfb3e7c9313be78303c2c32294417bb58dbb/packages/core/src/orchestrator/task-execution.ts#L1789

[O6]: https://github.com/open-multi-agent/open-multi-agent/blob/e678bfb3e7c9313be78303c2c32294417bb58dbb/LICENSE#L1

[S1]: https://github.com/anthropics/claude-agent-sdk-python/blob/efd4d865ef1795daffee3cd24cce45307aed8a51/src/claude_agent_sdk/_internal/transport/subprocess_cli.py#L787

[S2]: https://github.com/anthropics/claude-agent-sdk-python/blob/efd4d865ef1795daffee3cd24cce45307aed8a51/src/claude_agent_sdk/_internal/query.py#L469

[S3]: https://github.com/anthropics/claude-agent-sdk-python/blob/efd4d865ef1795daffee3cd24cce45307aed8a51/LICENSE#L1

[S4]: https://github.com/anthropics/claude-code/blob/ab9b2cf7bb9e4f98ff264c07a22e46d83c29c558/LICENSE.md#L1
