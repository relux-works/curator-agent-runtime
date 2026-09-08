# Apiary: архитектура общего runtime и двух профилей

**Предлагаемая информативная ревизия `apiary-design-2026-09-08`, TASK-260908-2qhe31.** Это архитектурное решение для дальнейшего проектирования контрактов, а не работающий runtime и не нормативная редакция v0.1. Действующие `protocol/`, `schemas/v1/`, ADR и прежние architecture/threat-model не изменены. Кодовые и JSON-фрагменты ниже — proposed contracts, не совместимые обещания API.

Apiary превращает распределённую inference-ёмкость в работу над одним проектом, не передавая каждому участнику ключи проекта или право менять main. Участник предоставляет модельное решение; проект предоставляет ограниченную среду исполнения; отдельная authority фиксирует допустимые переходы. Ценность системы — возможность поручить реальную задачу автономному worker, увидеть точный кандидат, воспроизвести его проверки и принять именно проверенные bytes. Число агентов само по себе не повышает доверие.

Общее Go-ядро выполняет один цикл: собрать контекст → запросить модель → дождаться успешного terminal response → проверить вызовы → запросить исполнение у broker → сохранить наблюдение → продолжить. Worker и orchestrator используют этот цикл с разными установленными Curator tool-skills. Ядро не содержит shell, tools, MCP, consensus, task-board, billing SDK или provider credentials. Малая библиотека не делает всю систему маленькой: compiler, broker, credentials, authority, executor, runner, storage и ОС входят в соответствующие доверенные границы.

## Порядок чтения и решения по умолчанию

| Глава | Что определяет |
|---|---|
| [Источники и паттерны](../docs/apiary/evidence.md) | Frozen input digests, глубина исследования, pinned первичные материалы, evidence → decision |
| [Ядро и границы](../docs/apiary/kernel.md) | Процессы, TCB, Go packages/ports, worker и orchestrator, ownership |
| [Tool-skills](../docs/apiary/tool-skills.md) | Descriptor, compiler, admission, lifecycle, единственный `central`, WorkspaceRef |
| [Модели и контекст](../docs/apiary/models-context.md) | ModelPort / AgentBridge, entitlement, credentials, stream, compaction, budgets |
| [Authority и wire](../docs/apiary/authority-wire.md) | Объекты, signatures, идентичности, leases, fencing, XMPP |
| [Исполнение и интеграция](../docs/apiary/execution.md) | WAL, cwd/env/processes, sandbox, unknown-effect, candidate, runner, walkthrough |
| [Миграция и проверка](../docs/apiary/migration-conformance.md) | Retain/change/reject, assurance, roadmap, refusal vectors, эксперименты |
| [Диаграммы](../diagrams/apiary/README.md) | Контекст, trust, components и последовательности с SVG |

Выбраны: SHA-256 recursive content manifest отдельно от Git locator; sole-writer локальный publication gateway с durable intent/CAS/receipt и отдельным remote mirror; direct inference; L0 с одной логической authority; online admission, сериализованный со stop state; worker без checkout с RemoteWorkspaceRef; один `central` с `exec/poll/cancel`, shell только внутри выданного sandbox; один writer на sandbox; явные per-call cwd/env; без восстановления shell memory; отдельные host extensions; никаких сырых signing tools. Нормальный coding grant выдаётся заранее и ограничивается задачей, временем, средой, счётчиками и sinks. Неожиданное расширение отклоняется и становится запросом изменения policy, а не бесконечной серией подтверждений.

Первый целевой executor — Linux с реальным confinement. macOS/iOS и физические устройства обслуживаются именованными runner operations с отдельной assurance, когда задача требует этих платформ. Worktree не считается sandbox. Совместимость whole-agent subscription bridge, XMPP federation, L1 и L2 — явно включаемые профили; они не подменяют выбранные defaults. Предположение о честности executor, о внешнем установлении владельцев reviewers и об ограниченной защите от компрометации host root остаётся видимым.

## Авторитет источников и граница поставки

Архитектура опирается на 16 принятых исследовательских артефактов. Все относительные ссылки на `.research/` разрешаются в объединённом дереве. [Исходная карта](../docs/apiary/accepted-inputs.json) сохраняет исторические SHA-256, candidate trees и reviewer runs; [сверка интегрированных материалов](../docs/apiary/current-inputs.json) фиксирует текущие байты. У Claude lineage удалён ровно один завершающий LF; остальные 15 артефактов совпадают с исходными хешами. Исторический candidate tree не обозначает опубликованный commit.

Владение нормами: curator-spec — packages/closure/build/install; curator-agent-runtime — generic plans/invocations/context/receipt; будущий apiary-spec — distributed authority/task/execution/acceptance; implementation repositories — код и platform qualification. Предложенные контракты должны пройти отдельный freeze схем и vectors до development. Эта задача не добавляет runtime implementation и не создаёт преждевременно implementation backlog. [README](../README.md) объединяет навигацию; [открытые вопросы](../UNRESOLVED_QUESTIONS.md) содержат только внешние входы и будущие эксперименты. [Архив и трассировка](../.planning/README.md) фиксируют ход работы без преждевременного объявления поставки.
