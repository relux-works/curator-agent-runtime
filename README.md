# Curator Agent Runtime

Спецификация runtime, который исполняет AI coding agent через заранее скомпилированное Curator-окружение. Контекст поступает из проверенного неизменяемого хранилища, а все доступные модели действия — из установленных tool-skills. Runtime связывает каждое действие с планом, полномочиями и результатом исполнения.

**Два уровня документации:** существующий нормативный draft **v0.1.0** от 2026-08-23 и предлагаемая информативная архитектура **Apiary `apiary-design-2026-09-08`**. В репозитории нет реализации runtime. Новые главы и примеры не заменяют `protocol/` и `schemas/v1/`, не обещают совместимость API и не доказывают runtime conformance. Автор: Ivan Oparin; лицензия: [Apache-2.0](LICENSE).

## Интерактивный атлас

[Открыть интерактивный гид](https://apiary-architecture.oparin-ig.chatgpt.site) · [Скачать самодостаточный HTML](docs/interactive/apiary.html)

Карта компонентов с переключением Worker/Orchestrator, lifecycle tool-skills, матрица провайдеров, шесть пошаговых сценариев, 11 увеличиваемых диаграмм и встроенный reader. В HTML включены 70 исходных файлов принятого снимка: 37 Markdown-документов, девять JSON-документов, 11 пар PlantUML/SVG, LICENSE и NOTICE. Поиск работает по полному тексту; внутренние ссылки открывают документы и нужные разделы внутри гида.

Снимок источников закреплён в `site/content.json` на commit `642f6cd6d96bac5a83c4dc53014f4f300f29d966`. Исходные исследования и нормативные файлы не изменяются при сборке. Гид работает без внешних библиотек, шрифтов и API; внешние публикации открываются только по ссылкам читателя. Сценарии объясняют предложенный протокол и не исполняют команды.

## Видение и порядок чтения

Apiary использует распределённые модели для работы над одним проектом. Worker предлагает изменения через ограниченный удалённый sandbox; authority фиксирует допустимые переходы, executor исполняет команды, runner строит и проверяет точный кандидат. Единственный publication-gateway получает право менять локальный authoritative main. Подпись участника подтверждает происхождение заявления, но не истинность вывода или корректность кода.

Начните с [архитектурной карты и принятых решений](.spec/apiary-runtime-design.md), затем прочитайте главы по порядку. Основной профиль: общее Go-ядро, прямой ModelPort, worker без локального checkout, один `central` с `exec/poll/cancel`, одна логическая authority L0 и strict-online admission. Общий executable не означает общий процесс или доверенный principal. MCP остаётся внешним confined wrapper; whole-agent AgentBridge имеет отдельный профиль совместимости.

| Шаг | Глава | Главный вопрос |
|---|---|---|
| 1 | [Источники и паттерны](docs/apiary/evidence.md) | Какие механизмы исследованы, с какой глубиной и почему приняты или отклонены? |
| 2 | [Ядро и доверенные процессы](docs/apiary/kernel.md) | Кто владеет состоянием, полномочиями и каждым элементом TCB? |
| 3 | [Tool-skills и workspace](docs/apiary/tool-skills.md) | Как пакет становится допустимым инструментом, а worker работает без checkout? |
| 4 | [Модели и контекст](docs/apiary/models-context.md) | Как отделены inference, credentials, история, бюджеты и AgentBridge? |
| 5 | [Authority и wire](docs/apiary/authority-wire.md) | Как связаны подписи, grants, идентичности, XMPP, replay и fencing? |
| 6 | [Исполнение и интеграция](docs/apiary/execution.md) | Как работают WAL, процессы, recovery, seal, candidate и публикация? Здесь же сквозной coding walkthrough. |
| 7 | [Миграция и будущая проверка](docs/apiary/migration-conformance.md) | Что меняется относительно v0.1, какие профили требуют qualification и как проверять отказы? |

[Атлас диаграмм](diagrams/README.md) ведёт ко всем 11 схемам с исходниками и SVG: девять видов Apiary и две исследовательские схемы Codex/Pi. Для краткого первого прохода достаточно контекста, границ процессов и task integration; остальные раскрывают отдельные сценарии.

## Drafts after the accepted snapshot

Proposals written after `apiary-design-2026-09-08`. They change nothing in the accepted chapters above or in the interactive guide until a reviewed adoption moves them in.

| Draft | Purpose |
|---|---|
| [Minimal roadmap](docs/drafts/apiary/minimal-roadmap.md) ([RU](docs/drafts/apiary/minimal-roadmap.ru.md)) | Staged plan (stages 0–6) from an AgentHost adapter over the task-board spawn path to a trusted pool of local and remote agent loops |
| [Track](docs/drafts/apiary/track.md) ([RU](docs/drafts/apiary/track.ru.md)) | Where Apiary sits in the ecosystem roadmap and what each stage needs |
| [Authority-wire amendment](docs/drafts/apiary/authority-wire-amendment.md) ([RU](docs/drafts/apiary/authority-wire-amendment.ru.md)) | Proposal to carry authority records in waggle SSHSIG envelopes with role-bound multi-signatures, a committed signer roster and key-assurance levels |

## Исследовательская база

Это целевая выборка, а не полный аудит всех agent frameworks. Широкий каталог фиксирует 28 репозиториев: 26 с выборочным чтением исходников, два на уровне документации; исполненных runtime-проверок D3 нет. [Карта глубины и evidence → decision](docs/apiary/evidence.md) объясняет границы каждого вывода.

| Тема | Материалы |
|---|---|
| Основные agent loops | [Claude lineage](.research/260908_claude-lineage.md), [Codex и Pi](.research/260908_codex-pi.md), [Go и дополнительные harnesses](.research/260908_go-and-additional-harnesses.md) |
| Ландшафт и протоколы | [Runtime landscape](.research/260908_runtime-landscape.md), [каталог source pins и глубины](.research/260908_source-catalog.json), [protocol literature](.research/260908_protocol-literature.md), [каталог протокольных источников](.research/260908_protocol-source-catalog.json) |
| Apiary и Curator | [Контракты и реальные implementation gaps](.research/260908_apiary-curator-contracts.md), [исходная карта D01–D36](.research/260908_requirements-map.md) |
| Провайдеры | [Переносимость и маршруты](.research/260908_provider-portability.md), [первичные свидетельства](.research/260908_provider-portability-evidence.md), [журнал аномалий](.research/260908_provider-portability-logbook.md) |

[Исходные принятые хеши](docs/apiary/accepted-inputs.json) сохранены отдельно от [сверки интегрированных файлов](docs/apiary/current-inputs.json). Единственное изменение research bytes — удаление одного завершающего LF в Claude lineage. Исторические candidate trees не выдаются за опубликованные commits.

[Архив планирования и краткая трассировка требований](.planning/README.md) связывают epic с документами. Состояние сборки документации и свидетельства независимого review фиксируются в lifecycle задачи `TASK-260908-q8pkiz`; команда проверки статуса приведена в разделе «Инструменты и воспроизведение». [Открытые вопросы](UNRESOLVED_QUESTIONS.md) ограничены внешними разрешениями и проверяемыми экспериментами. Выбранные Go/kernel/central/MCP/XMPP/L0 решения повторного выбора не требуют.

## Нормативный draft v0.1

[Curator Protocol](https://github.com/relux-works/curator-spec) определяет package identity, manifests, closure, audit и installation. Этот runtime потребляет pinned closure и определяет её исполнение: SessionPlan, CallPlan, invocation, approval и receipt. Content identity делает binding воспроизводимым; capability envelope становится enforced grant. Язык реализации и топология свободны при соблюдении нормативных инвариантов.

| Часть | Статус и назначение |
|---|---|
| [Runtime protocol](protocol/runtime.md) | Нормативные session/call plans, invocation, epochs, delegation и receipts |
| [Tool interface](protocol/tool-interface.md) | Нормативные identity, portable schemas, effect extraction и bindings |
| [Approval](protocol/approval.md) | Нормативный trusted path, outcomes и leases |
| [Архитектура v0.1](docs/architecture.md), [threat model v0.1](docs/threat-model.md) | Исходные информативные пояснения |
| [ADR](decisions/) | Принятые решения v0.1 |
| [JSON Schema v1](schemas/v1/) | SessionPlan, CallPlan, ExecutionReceipt, ApprovalLease |
| [CHANGELOG](CHANGELOG.md), [SECURITY](SECURITY.md) | История draft и сообщения о безопасности |

v0.1 пока резервирует wire framing, provider identity verification, network mediation, signing capabilities и protected authority root. Conformance class ещё не определён; нужны interface vectors. Apiary предлагает отдельные версии контрактов для этих областей. Нельзя подавать новый RemoteWorkspaceRef в старую схему и считать его поддержанным.

## Инструменты и воспроизведение

Команды выполняются из корня checkout. Уже установленных инструментов достаточно; установка нового toolchain для чтения не нужна. Логи и одноразовые QA-скрипты находятся в `.temp/<TASK-ID>/`; они не часть runtime. В managed worktree `TASK_BOARD_DIR` указывает на authoritative board, а checkout-копия `.task-board/` не используется.

| Инструмент | Точная точка входа | Результат |
|---|---|---|
| task-board | `task-board q --format compact 'get(TASK-260908-q8pkiz) { status checklist }'` | Статус и checklist в stdout |
| task-board plan | `task-board plan EPIC-260908-230hv2 --save` | Снимок канонического плана в `.planning/` |
| task-board resources | `task-board resource add TASK-260908-q8pkiz .temp/TASK-260908-q8pkiz/TASK-260908-q8pkiz_evidence.zip --type outcome --name TASK-260908-q8pkiz_evidence.zip` | Evidence в authoritative board; handoff через `task-board handoff TASK-260908-q8pkiz --role doc-writer` |
| Git | `git diff-tree --check HEAD` и `git diff --check HEAD` | Два whitespace gate; ошибки и exit code в stdout/stderr |
| Python3, HTML build | `python3 .scripts/build-architecture-guide.py` | `dist/index.html`, `dist/apiary.html`, `docs/interactive/apiary.html`; input/output hashes в `.temp/interactive-guide/build-manifest.json` |
| Node.js, guide logic | `node --check site/app.js` и `node .scripts/test-architecture-guide.cjs` | Синтаксис, navigation/step/search logic, source identities, diagrams и CSP hash; stdout |
| Python3, guide boundary | `python3 .scripts/test-architecture-guide.py` | Проверки встроенного HTML, безопасного document markup, ссылок и неизменности принятых источников; `.temp/interactive-guide/static-checks.json` |
| Python3 | `python3 -m json.tool docs/apiary/current-inputs.json` | Синтаксическая проверка JSON; печатает документ |
| Python3, combined QA | `python3 .temp/TASK-260908-q8pkiz/validate.py` | Одноразовый checker из task evidence: локальные ссылки/anchors, JSON files/examples, provenance, SVG; команда доступна после извлечения evidence |
| Pandoc | `pandoc -f gfm -t html README.md -o .temp/TASK-260908-q8pkiz/README.html` | GFM rendering для проверки навигации и таблиц; AST/link check: `python3 .temp/TASK-260908-q8pkiz/pandoc-check.py` из task evidence |
| PlantUML + Java | `plantuml -tsvg -charset UTF-8 diagrams/apiary/*.puml diagrams/research/codex-pi/*.puml` | SVG рядом с `.puml`; для проверки без изменения принятых байтов используйте копии в `.temp/<TASK-ID>/rendered/` |
| Graphviz | `dot -V` | Версия layout engine, используемого PlantUML для component views |
| rsvg-convert | `rsvg-convert -b white -o .temp/TASK-260908-q8pkiz/context.png diagrams/apiary/context.svg` | PNG для непосредственной визуальной проверки; каталог `.temp/<TASK-ID>/` создаётся заранее |
| ripgrep | `rg --files --hidden .spec .research docs diagrams` | Инвентаризация документов и исходников схем |

Третий обязательный whitespace gate — точная Python3-команда из `spawn.worktree_isolation.validation.commands[2]` в [task-board.config.json](task-board.config.json): она вызывает `git diff --no-index --check` для каждого untracked файла вне `.task-board/`. Все три настроенных команды исполняются при managed handoff; отдельные exit codes и QA evidence приложены к задаче. Проверка Markdown/JSON/SVG не заменяет будущие production-entry conformance probes V01–V21: выполнено **0 runtime probes**.
