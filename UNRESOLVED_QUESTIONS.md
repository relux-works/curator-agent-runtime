# Открытые внешние входы и эксперименты

Это реестр будущей квалификации предлагаемой архитектуры, а не список блокеров сборки документации. Владельцы ниже — роли; конкретные люди и среды назначаются при запуске соответствующей работы. Решения по Go-ядру, `central`, direct ModelPort, внешнему MCP wrapper, XMPP binding, L0/strict-online, WorkspaceRef и sole-writer publication-gateway уже приняты. Их обоснования и порядок работ — в [архитектурной карте](.spec/apiary-runtime-design.md) и [миграции](docs/apiary/migration-conformance.md).

## Внешние входы

| ID | Что ещё требуется | Владелец | Свидетельство закрытия |
|---|---|---|---|
| Q1 | Разрешение конкретного provider route для account, tenant, региона, headless use case и billing; для локальной модели — лицензия weights | Account owner и adapter maintainer | Датированное entitlement decision с условиями, scope и сроком; поддерживаемый login/API probe. Успешный HTTP ответ не заменяет разрешение |
| Q2 | Enrollment операторов и независимых reviewer owners | Project operator | Утверждённая membership/reviewer policy, внешнее свидетельство владельцев, eligibility snapshot и отказ self-review/duplicate-owner. Разные ключи не доказывают независимость |
| Q3 | Доступная macOS/iOS/device среда и разрешённые named runner operations | Platform owner | Inventory реального host/device, toolchain pins, доступные capabilities и границы full/partial assurance. Состояние устройства и допустимые операции входят в contract |

Неподтверждённый route или platform profile остаётся выключенным. Пул потребительских подписок, анонимное членство и сторонний authoritative Git host не включены в baseline и не маскируются под незавершённую настройку.

## Проверяемые инженерные эксперименты

Ниже сгруппированы E1–E8 из [матрицы миграции](docs/apiary/migration-conformance.md#измеримые-эксперименты-и-вопросы). Runtime probes пока не выполнялись. До реализации требуется отдельный freeze версионированной grammar/schemas/vectors у владельцев контрактов R1–R3; это запланированная работа, а не повторный архитектурный выбор.

| ID | Неизвестное / опровержение | Владелец | Критерий закрытия |
|---|---|---|---|
| E1 | Достаточность `central` для реальных coding tasks | Runtime product owner | Закреплённый набор задач, completion ratio, потребность в shell/typed operations, tokens и latency. Необходимость forbidden authority означает недостаточность интерфейса |
| E2 | Цена разделения процессов и one-shot lifecycle | Runtime owner | Reproducible RSS/startup/turn baseline всех процессов при одинаковых workload и pins; последующее обоснование порогов и session-worker оптимизации |
| E3 | WAL, unknown effects и публикация при crash | Executor и authority owners | Fault injection каждой границы intent/effect/receipt/Git sync; V05–V08, V11, V15, V19–V21 через реальные entry points. Ноль повторных effects в заявленной idempotent области; неизвестность не выдаётся за отсутствие |
| E4 | Provider schemas, streams, compaction и bridge effects | Model adapter owner | V02/V12/V13 на разрешённых routes; causal pairs и constraints сохраняются, truncated output не запускает effects. Для AgentBridge — независимое наблюдение FS/network/process; strict parity до этого не установлена |
| E5 | XMPP interoperability, reconnect и недоверенный relay | Transport owner | Два server/client стека, duplicate/out-of-order/queue/artifact probes V14. Для confidential relay deployment — reviewed стандартный encryption profile и его vectors до admission |
| E6 | Реальная изоляция и durability выбранного backend | Platform owner | Capability-specific escape/egress/quota/path/race tests V03/V16, проверка lock/ref/fsync semantics publication-gateway. Недоказанное свойство остаётся unknown и не получает full assurance |
| E7 | Техническая пригодность разрешённого account route | Account owner и adapter maintainer | После Q1 — воспроизводимые auth/refresh/revoke/budget probes, pins продукта/адаптера, scope и реальные exit codes; без переноса credentials в tools |
| E8 | Квалификация дополнительных L1/L2 профилей | Apiary protocol owner | Для выбранного substrate — membership/fault model, fork/light-client/recovery/adversarial evidence. L1 не объявляется Byzantine-safe, L2 не включается только увеличением числа подписей |

Правильность допуска и точность candidate tuple — обязательные свойства, не параметры оптимизации. Числа 80%, 5 s, 30 s и размеры очередей в дизайне — начальные policy limits для проверки; измеренных performance targets пока нет.
