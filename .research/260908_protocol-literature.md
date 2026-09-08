# Распределённое исполнение агентов: границы гарантий и предложения для Apiary

Дата обращения ко всем внешним источникам: **2026-09-08**. Задача `TASK-260908-1ir76l`, история `STORY-260908-27xtpm`. Это исследование для review, не изменение нормативного протокола и не реализованная система.

## Главные архитектурные выводы

1. **Общее небольшое ядро подходит обоим профилям.** Цикл генерации, проекция контекста, проверка полностью собранного typed call, исполнение через внешний adapter, запись наблюдения, следующая генерация. Worker имеет один центральный tool-skill; orchestrator отличается установленными Curator tool-skills и выданными полномочиями. Универсальный graph engine, MCP runtime, consensus и credential storage не нужны внутри этого цикла.
2. **Горячий путь может обходиться без quorum на каждый вызов.** Quorum фиксирует ограниченный grant с digest плана; доверенный executor сверяет план и актуальность, атомарно резервирует лимит и ownership операции. Это совместимо с определением плана в текущем Apiary: bindings, grants и лимиты. Подпись grant не разрешает исполнять любой payload с тем же указанным digest: нужна детерминированная проверка параметров и фактическая изоляция.
3. **Доставка, durable receipt, admission, результат исполнения и принятие проекта — разные факты.** Ни XMPP ack, ни успешный RPC, ни `completed` агента не заменяют авторизацию, receipt исполнителя или проверку интеграционного кандидата.
4. **Partition создаёт выбор доступности.** Для строгой актуальности прекращать новый admission при недоступной authority. Freshness lease допускает ограниченное окно устаревшего разрешения и требует явно согласованной семантики I1/I8. Мгновенный глобальный halt при произвольной partition недостижим; остановка уже начавшихся эффектов — отдельный механизм.
5. **Replay не даёт exactly-once внешнему миру.** Сохранять intent, stable operation ID, executor generation, бюджет и outcome. При неопределённом исходе сначала reconciliation; смена worker/executor не должна превращать один эффект в новую «попытку с чистым бюджетом».
6. **L0 — разумная первая реализация; L1 и L2 — внешние профили authority.** L1 доверяет секвенсеру в вопросе единой истории. Для L2 использовать установленный BFT substrate, а не писать новый консенсус в агентском ядре. Несколько подписей не доказывают независимость владельцев или моделей.

Все шесть пунктов — **рекомендации этого исследования**. Основания и отвергнутые варианты ниже. Измерений latency/RSS/throughput и fault-injection в этом проходе нет.

## Метод, воспроизводимость и локальная база

Прочитаны первичные RFC/XEP, документы производителей, фрагменты статей и pinned source. Поиск использован для обнаружения; snippets и сторонние обзоры не служат доказательствами. Полные статьи не объявляются прочитанными: значимые разделы перечислены в каталоге. Программный код скачанных проектов, их installation scripts и тесты **не запускались**. Проверки здесь относятся к ссылкам, хешам и целостности исследовательских артефактов, не к безопасности runtime.

[Каталог доказательств](260908_protocol-source-catalog.json) содержит точные URL, SHA-256 снимков документации, repository SHA, file anchors, глубину и ограничения чтения. Scratch: `.temp/TASK-260908-1ir76l/`. Для изменяемых web-страниц дата и hash фиксируют наблюдённую версию; URL `latest` не равен immutable release. Перенаправления к общим landing pages не считались прочтением исходного раздела.

Локальные репозитории инспектировались read-only: origin, HEAD и `git status --short`. `apiary-docs` чист на `e4249a6193c0f2730e7cffaea6b4907c0a7e80a9`; `curator-spec` чист на `87a0d0060bad64ab883d007dcdf35df7485368bf`; `curator` на `a66eec88fa4dfb8f3ca098f594f6e48af57a6835` и `skill-project-management` на `faa6ff96b6885c6db309b927b047ab600b19f423` содержат чужие изменения. В них ничего не правилось; их dirty-контент не используется как pinned доказательство реализации. Основной checkout `curator-agent-runtime`: `da759b8f3d366f31e5bd42934f6b5ecd1d01ac3f`, untracked `.task-board/`; работа ведётся в выданном story worktree. Свежие публичные source snapshots изолированы в scratch, не в siblings.

Нормативная опора: [Apiary, `paper/paper.tex`, уровни и I1–I10](https://github.com/relux-works/apiary-docs/blob/e4249a6193c0f2730e7cffaea6b4907c0a7e80a9/paper/paper.tex#L99-L150), [определение digest плана и светлого клиента](https://github.com/relux-works/apiary-docs/blob/e4249a6193c0f2730e7cffaea6b4907c0a7e80a9/paper/paper.tex#L159-L185). Здесь digest плана соответствует разрешениям, а digest команды входит в execution receipt. Это разные хешируемые объекты.

## Литература об агентском цикле и контексте

| Первичное наблюдение | Последствие для Apiary | Что отвергается |
|---|---|---|
| ReAct чередует reasoning, действия и внешние наблюдения; рассмотрены abstract и §§1–2, arXiv v3 | Event log хранит решения, вызовы и наблюдения; model session восстанавливается как проекция. Внутреннее рассуждение не требуется для доказательства полномочий | «Модель объяснила действие, значит оно разрешено»; перенос benchmark выигрышей на распределённую безопасность |
| CodeAct использует исполняемый Python как action space, в том числе control/data flow и повторное использование промежуточных данных; abstract и §§1–2 | Code-action может быть payload центрального инструмента в ограниченном sandbox; каждый выход к защищённому сервису проходит тот же gate | Исполнение с ambient credentials ядра; безлимитный fan-out внутри одной оплаченной операции |
| mini-SWE-agent `DefaultAgent.run/step` вызывает `execute_actions(query())`, сохраняет trajectory в `finally`; `LocalEnvironment.execute` передаёт окружение процесса | Перенять минимальность loop и отдельный environment adapter, заменить локальную среду typed remote binding | Приравнивать сохранённую trajectory к транзакции внешнего эффекта; копировать ambient environment |
| Anthropic Tool Search отложенно раскрывает схемы; programmatic calling и code execution уменьшают попадание промежуточных данных в context | Для одного worker tool поиск лишний; orchestrator может искать только в установленном и разрешённом каталоге. Кодовая композиция остаётся внутри quota и effect gate | Search result как установка, authority или обновление разрешений; рекламные показатели как собственный benchmark |
| OPENDEV v1 описывает один параметризуемый MainAgent, четыре слоя системы, context compaction и lazy MCP discovery | Поддерживает два профиля одного ядра и отдельные context/persistence interfaces. Сохранять ссылки на полные результаты вне context | Утверждение статьи о независимости пяти safety layers не переносится как security proof: prompt, schema, hooks и runtime одного процесса могут иметь общий обход |

Источники: [ReAct v3](https://arxiv.org/html/2210.03629v3), [CodeAct v4](https://arxiv.org/html/2402.01030v4), [mini-SWE `run/step`](https://github.com/SWE-agent/mini-swe-agent/blob/04d809ceab9df28f9adaed044884180159172930/src/minisweagent/agents/default.py#L88-L137), [его `LocalEnvironment`](https://github.com/SWE-agent/mini-swe-agent/blob/04d809ceab9df28f9adaed044884180159172930/src/minisweagent/environments/local.py#L19-L59), [Anthropic advanced tool use](https://www.anthropic.com/engineering/advanced-tool-use), [code execution with MCP](https://www.anthropic.com/engineering/code-execution-with-mcp), [OPENDEV v1, §§2.1–2.2.1, 2.3.6, 5](https://arxiv.org/html/2603.05344v1). Mini-SWE файлы повторно получены по SHA и сверены с каталогом предыдущего обзора; это не только пересказ соседнего документа.

OPENDEV — engineering report авторов системы, а не независимая проверка её защит. Его числа эффективности не воспроизводились и не используются в выборе. Приложения с prompt templates не переносились в deliverable. Текущий source OPENDEV здесь не инспектировался; соответствие статьи современной ветке неизвестно.

[Go-дополнение](260908_go-and-additional-harnesses.md) рассматривает actual loop/tool/provider/context interfaces Crush, ADK-Go, Eino, Kimi CLI и Hermes. Наличие Go-кода не доказывает нужные нам распределённые гарантии и не обязывает включать framework в dependency tree ядра.

## Durable execution: что именно воспроизводится

**Наблюдение.** Temporal описывает потерю Activity Task и retry по timeout; отмена Activity доставляется через heartbeat. Go `SideEffect` сохраняет значение в истории, при replay функция не вызывается; документация предупреждает о недетерминизме при изменении workflow state внутри callback. Это механизм фиксации недетерминированного значения, не транзакция произвольного I/O. [Activity execution](https://docs.temporal.io/activity-execution), [Go Side Effects](https://docs.temporal.io/develop/go/workflows/side-effects).

**Наблюдение.** LangGraph `PregelLoop.put_writes` отдельно обрабатывает pending writes и исключает `UntrackedValue`; `CheckpointMetadata` содержит происхождение, step и namespace родителей. Документация различает RAM checkpointer и durable backend. [Pinned `put_writes`](https://github.com/langchain-ai/langgraph/blob/81bf17b23123e4ef8b9d5f49fa09a0122fc2edd1/libs/langgraph/langgraph/pregel/_loop.py#L415-L456), [metadata](https://github.com/langchain-ai/langgraph/blob/81bf17b23123e4ef8b9d5f49fa09a0122fc2edd1/libs/checkpoint/langgraph/checkpoint/base/__init__.py#L39-L80), [persistence](https://docs.langchain.com/oss/python/langgraph/persistence). Реализация storage transactions здесь не проверялась.

**Вывод.** Durable history позволяет повторить управление по уже записанным результатам. Внешний сервер не участвует автоматически в той же транзакции. Если effect произошёл, а запись результата потеряна, повтор действия может дать второй effect. Сериализация сообщений в JSON и restore checkpoint эту неопределённость не устраняют.

**Предложение.** Разделить журналы логически: authority ledger определяет grants/epochs/acceptance; executor journal — intent, резерв бюджета и outcome; conversation/event history — наблюдения и model projection. Их causation links обязательны, но не нужно писать каждый streamed token в consensus. Для read-only генерации допустим повтор с новым attempt; для effect сохраняется прежний operation ID. Сохранённое событие model output восстанавливается без повторного inference, а новый inference после сбоя явно получает новую generation/attempt и не выдаётся за воспроизведение старого ответа.

| Сбой | Известно | Действие предлагаемого runtime |
|---|---|---|
| До durable admission | Не доказан запуск | Повторить тот же ID; запросить состояние у владельца операции |
| После admission, до dispatch | Бюджет/ownership заняты, effect ещё не подтверждён | Recovery executor сверяет журнал; не освобождать резерв по клиентскому timeout |
| После dispatch, до receipt | Исход неопределён | `outcome_unknown`; запрос sink по idempotency key или его transaction ID; не слепой retry |
| Receipt сохранён, ответ потерян | Есть terminal outcome | Вернуть тот же receipt на повтор; не исполнить снова |
| Stream оборван посередине tool arguments | Не получен корректный полный call | Не исполнять partial JSON; сохранить interrupted attempt |
| Cancel пересёк завершение | Возможны и запрос отмены, и успешный effect | Отразить причинный порядок: `cancel_requested`, затем реальный terminal outcome; не переписать успешный effect как «не было» |

Exactly-once можно обещать **только в явно ограниченной области**: например, атомарная транзакция business mutation + dedup record в одном sink с достаточным retention; либо внешняя API с подтверждённым idempotency contract. При произвольном shell/HTTP/publish такого общего обещания нет. Даже exactly-once принятие команды executor не равно exactly-once всем её сетевым эффектам.

## XMPP: транспортная семантика и минимальный профиль

**RFC 6120** задаёт XML streams, TLS/SASL, resource binding, stanza routing и in-order processing на одном входном stream (§10.1). Это не глобальный порядок между независимыми отправителями и reconnect. XML restrictions §11.1 запрещают DTD и внешние entity references. **RFC 6121** добавляет IM/presence/roster; presence полезен для discovery/liveness hint, но не является lease, доказательством права или реального состояния executor. [RFC 6120](https://www.rfc-editor.org/rfc/rfc6120.txt), [RFC 6121](https://www.rfc-editor.org/rfc/rfc6121.txt).

| Механизм | Что он подтверждает / предоставляет | Применение и граница в Apiary |
|---|---|---|
| [XEP-0198, §4–5](https://xmpp.org/extensions/xep-0198.html#acks), наблюдённая 1.6.3, Stable | Peer принял ответственность за stanza; counters, resumption и повтор неподтверждённых stanza | Надёжнее reconnect, но ack relay не есть durable receipt executor, authorization или domain acceptance. После reconnect dedup остаётся у Apiary |
| [XEP-0184, §2–3](https://xmpp.org/extensions/xep-0184.html#intro) | Delivery receipt от клиента; прямо не доказывает обработку/понимание сообщения | Не использовать вместо `received_durable` или `execution_finished`; отсутствие ack не доказывает отсутствие доставки |
| [XEP-0359](https://xmpp.org/extensions/xep-0359.html), 0.7.0, Experimental | Origin/stanza IDs; stanza ID уникален в области `by`; origin ID допускает подделку | Только транспортные correlators. Собственный подписанный operation ID и его owner обязательны; не выдавать XEP статус Stable |
| [XEP-0030](https://xmpp.org/extensions/xep-0030.html) | Discovery identities/features/items | Обнаружить поддержку выбранных namespaces, размера и вариантов; объявление capability не даёт authority и не доказывает sandbox |
| [XEP-0060](https://xmpp.org/extensions/xep-0060.html) | Pubsub, access models, configurable persistence/items | Fan-out статусов. Проверять configuration сервиса; pubsub node не является consensus log или вечным replay store |
| [XEP-0313](https://xmpp.org/extensions/xep-0313.html) | Запрос серверного архива, retention/deletion | Опциональное восстановление уведомлений; authoritative reconciliation по ledger cursor остаётся отдельным |
| [XEP-0363, §§3–4, 9](https://xmpp.org/extensions/xep-0363.html) | Slot для HTTP PUT и GET URL; размер upload проверяется; HTTP 201 означает готовность отдавать файл | Опциональный artifact transport. URL не является digest, подписью или сертификатом доступности; содержимое проверяется отдельно |

**Предлагаемый обязательный XMPP профиль:** RFC 6120 + ограниченная используемая часть RFC 6121, negotiated XEP-0198/0030, фиксированный namespace Apiary envelope и лимит stanza. XEP-0359 можно использовать для диагностики, не включать его ID в корень доверия. 0060/0313/0363 — отдельно согласуемые extensions. Не делать IM receipts, MUC или Jingle обязательной зависимостью agent kernel.

Один клиент может иметь несколько resources: маршрутизация на bare JID не должна случайно назначать effect двум executor. Authority назначает точный executor identity/generation; adapter проверяет адресата. При пересылке через relay подпись покрывает неизменяемое доменное тело, а не XML wrapper, который сервер вправе дополнять. Hop TLS не заменяет end-to-end authentication; confidentiality payload при недоверенном relay требует отдельного шифрования. Relay всё равно видит размеры, направления и время, может задерживать и удалять сообщения.

## Реалистичный выбор транспорта

Это сравнение конкретных сценариев, не перечень всех функций продуктов. Одинаковый доменный envelope и state machine нужны во всех строках.

| Сценарий | Предпочтение | Реальная цена / отвергнутый вариант |
|---|---|---|
| L0, одна authority environment, небольшой парк workers | Прямой HTTPS/gRPC endpoint; при существующей SSH-схеме Apiary — framed protocol по forced-command stdio | Меньше инфраструктуры; durable inbox/outbox, backpressure и reconnect реализует host adapter. TCP delivery и RPC status не дают результата эффекта |
| Федерация административных доменов, существующие XMPP серверы, offline workers | XMPP adapter с фиксированным профилем выше | Готовые addressing/routing/resumption, но interoperability и server storage policy надо проверять. Не превращать XML stanza IDs в ledger identity |
| Один управляемый backend, множество executor, важен контролируемый pull | NATS JetStream adapter | Bounded batch/bytes/expiry и shared `MaxAckPending` помогают регулировать нагрузку. Ack после durable handoff; повтор доставки не новый operation. Broker membership/ACL остаются отдельной эксплуатацией |
| Внешний агент другого производителя | A2A gateway, если нужно task/artifact interoperability | Переводить `completed` в сообщение о результате, не в Apiary acceptance. Не навязывать полный A2A всем внутренним вызовам |

Основания: [gRPC retry](https://grpc.io/docs/guides/retry/) сохраняет историю RPC для retry, поддерживает backoff/throttling; «committed» после response headers означает границу retry библиотеки, а не business commit. [JetStream pull consumers](https://docs.nats.io/learn/jetstream/pull-consumers) описывает ограничения batch, bytes, expiry и общий предел неподтверждённых сообщений. Старый URL JetStream model deep dive перенаправился на общий `/learn/`; его рекламная формулировка exactly-once не используется как доказательство. Ни один из вариантов здесь не разворачивался и не benchmarked.

Рекомендация: сначала один direct adapter для проверки доменной семантики; XMPP — полноценный альтернативный binding там, где нужна федерация. Не запускать одновременно три брокера ради абстрактной переносимости. Сам интерфейс транспорта должен оставаться небольшим: send immutable envelope, receive, ack transport, resume cursor, close; authority и execution policy находятся выше него.

## A2A, два ACP и MCP

**A2A.** Прочитанная `/latest/specification/` содержит абстрактные операции и JSON-RPC, gRPC, HTTP+JSON bindings, tasks, messages, artifacts, cancel и subscriptions. §3.3.1 говорит, что Send Message **может**, а не обязан, быть идемпотентным; cancel — идемпотентный запрос, но §3.1.5 не обещает успешную отмену. На странице одновременно присутствуют материалы перехода к 1.0 и примеры `A2A-Version: 0.3`: для implementation потребуется явный pin версии и conformance, а не ссылка на `latest`. [Спецификация A2A](https://a2a-protocol.org/latest/specification/).

**Agent Client Protocol (ACP)** связывает client/editor с агентом, обычно subprocess: initialize/authenticate, session/new/load, session/prompt/update/cancel, file/permission requests. Это подходящая граница для внешнего coding harness, но не протокол реплицированной authority. [ACP v1 overview](https://agentclientprotocol.com/protocol/v1/overview).

**Agent Communication Protocol (другой ACP)** на собственной welcome page сообщает присоединение к A2A. В документах и identifiers всегда разворачивать аббревиатуру: это не тот же протокол, что editor-agent ACP. Не проектировать новую обязательную зависимость от обоих. [Официальное уведомление](https://agentcommunicationprotocol.dev/introduction/welcome).

**MCP**, выбранный dated snapshot 2025-11-25: host управляет clients и политикой, каждый client связывается с server. HTTP authorization требует tokens для нужного resource и запрещает принимать/передавать чужие tokens. Это не Apiary grant и не делегирование права интегрировать проект. [Architecture](https://modelcontextprotocol.io/specification/2025-11-25/architecture), [Authorization, token audience binding](https://modelcontextprotocol.io/specification/2025-11-25/basic/authorization).

**Предлагаемая граница:** Curator устанавливает wrapper с immutable manifest/digest; wrapper снаружи ядра реализует MCP, ACP или A2A. Ядро видит лишь typed binding. Plugin может объявить потребности, но решение выдаёт policy authority. Tool search может выбрать из уже разрешённых bindings, но не добавить permissions. Каждый wrapper ограничен по filesystem, IPC, network, resources и credential audience независимо от названия протокола.

## Capability security, идентичность и доверие

**Наблюдение.** Capability Myths Demolished показывает revocation через пару forwarding/revoking facets: ресурс достигается только через посредника, который может прекратить forwarding. Это аргумент о структуре доступа, не обещание мгновенной доставки revoke в распределённой сети. [Статья Miller/Yee/Shapiro, раздел Revocable Access](https://papers.agoric.com/assets/pdf/papers/capability-myths-demolished.pdf).

**Наблюдение.** Chubby §2.4 разбирает задержанный запрос бывшего lock owner и предлагает sequencer, содержащий lock generation; принимающий ресурс должен проверить его. Один факт когда-то полученного lock недостаточен. [Chubby, OSDI 2006](https://static.googleusercontent.com/media/research.google.com/en//archive/chubby-osdi06.pdf). Это основание для enforcement fencing на effect sink, не только в scheduler.

**Предлагаемая цепочка доверия:** project trust root → утверждённая membership/policy epoch → ключ владельца → сертифицированный ключ node → ephemeral transport key и отдельный signing identity. Binding включает project ID, node ID, owner ID, key purpose, срок и policy epoch. Account/JID/DNS proof подтверждает контроль обозначенного ресурса в момент проверки; независимость организаций и моделей определяется отдельной политикой и доказательствами. Один владелец может контролировать много ключей. Model name, temperature, разные prompts и несколько signatures независимость не доказывают.

Grant — подписанное authority обязательство, привязанное к получателю, task/contract revision, plan digest, sandbox/executor generation, разрешённым bindings и аргументам, scope, egress policy, лимитам, expiry/freshness и допустимой delegation depth. Передача bearer bytes другому worker не должна передавать право использования: проверяется holder key/transport binding. Как стандартный пример proof-of-possession, [RFC 8705 §3](https://www.rfc-editor.org/rfc/rfc8705.txt) связывает access token с клиентским сертификатом; это пример механизма, не требование внедрить OAuth во внутреннее ядро.

Signer не принимает произвольный hash от модели. Узкий signing call строит canonical typed statement из проверенных task/candidate/receipt references, отображает или проверяет policy и подписывает только этот domain-separated объект. Worker не получает private key, произвольную подпись пакета, новую membership или право approve самого себя.

## Admission с ограниченным grant и сохранением I1

Следующее — **проектное предложение**, статически выведенное из Apiary и материалов выше; доказательства реализации нет.

1. Authority совершает `GrantCommitted`: immutable plan digest, scope, budget ceiling, time/freshness bounds, executor identity/generation, task/contract revision, authority checkpoint/QC. Один grant покрывает много команд внутри sandbox; расширение плана, privileged runner operation и integration требуют отдельной авторизации.
2. Executor получает committed grant и проверяемый актуальный authority state. Для каждого call сначала ограничивает bytes/depth/count, проверяет signature/recipient/schema, plan equality и действительное соответствие parameters плану, sandbox class, epoch, stop flag и expiry. Не доверяет effect class или `readOnly` от модели/plugin.
3. В локальной durable транзакции доверенного executor создаёт `(project, grant, operation_id) → {request_digest, executor_generation, budget_reservation, admitted}`. Повтор с другим digest — conflict, с тем же — возвращает известный статус. Конкурирующие вызовы делят один атомарный budget counter; не каждый собственную копию лимита.
4. Под той же authority-generation дисциплиной получает execution slot и проверяет актуальность **при dispatch**, после ожидания в очереди. Время admission не продлевает lease. Slot ограничивает concurrency, grant — право и суммарный бюджет; они не взаимозаменяемы.
5. До необратимого effect downstream sink проверяет fencing token/idempotency ownership. Для sandbox local effect граница — доверенный runner, которому принадлежит generation. Для внешнего сервиса нужен собственный idempotency/fencing API либо сериализующий gateway, который держит state у sink; один клиентский lock не защищает от задержанного запроса.
6. Runner фиксирует started/outcome/receipt, фактический usage и оставшийся резерв; authority может получать батчи receipts с цепочкой хешей. Сбой до записи outcome оставляет `unknown`, не автоматически `failed` и не возвращает бюджет для повторной траты.

Так quorum оплачивается при grant/epoch/privileged operation, а не каждом обычном tool call. Масштабирование — независимые disjoint grants и partitioned executor journals. Деление глобального бюджета допустимо только на заранее committed непересекающиеся подлимиты; сумма резервов не превышает бюджет родителя. Общий изменяемый grant нельзя кэшировать как независимый счётчик на каждом executor.

**Ownership и смена generation.** Worker identity (кто предлагает) отлична от executor identity (кто действует). Idempotency key сохраняется при смене worker. Grant содержит executor generation; перенос незавершённой операции требует authoritative transfer record, fencing старого исполнителя у всех достижимых sinks, состояния расхода и dedup. Если старый executor или внешний sink недоступен и нет доказательства outcome/остановки, новый не исполняет ту же операцию. Стратегия «lease истекла — попробуем на другой машине с новым ID» отвергается.

**Срок хранения dedup.** Он покрывает весь разрешённый replay horizon grant плюс время доставки/восстановления по политике. После удаления результата tombstone/closed-grant остаётся достаточным для отказа старому ID; нельзя забыть dedup, оставив grant действующим. TTL transport messages не задаёт TTL business idempotency.

## Halt, revoke, partition и границы lease

Orchestrator lease определяет, кто может предложить очередной management transition. Consensus leader определяет порядок механических записей. Смена одного не требует назначения другого. Ни владелец orchestrator lease, ни модель не mint полномочия.

| Режим | Обещание | Цена и точная граница |
|---|---|---|
| Строгая актуальность | Перед новым dispatch решение сериализуется с текущим authority/stop state в доверенной execution boundary | При потере authority связи новый effect не допускается. Уже начавшаяся команда может продолжаться до контролируемой остановки; никакой удалённый packet не отменяет прошлый effect |
| Ограниченная freshness lease | Executor действует по authority checkpoint не дольше заранее указанного интервала Δ | Halt/revoke, не дошедший из-за partition, может оставаться неизвестным до остатка Δ + допустимая погрешность часов ε. Это ослабление мгновенной актуальности должно быть явно отражено в нормативной семантике |
| Неограниченный offline grant | Нельзя ограничить момент прекращения новых эффектов | Отклонить для Apiary I1/I8 |

При запуске таймера нужна доверенная монотонная шкала executor, привязка к boot/generation и консервативная проверка времени. После restart нельзя считать старый таймер свежим; сначала resync. Если действие может длиться D после допуска, окно завершения уже допущенных действий дополнительно включает D либо меньшую доказанную границу forced stop. Heartbeat — наблюдение, отсутствие heartbeat — подозрение, а не доказательство смерти.

Сочетание «каждый узел может немедленно halt всей системы» и доступного execution в отделённом сегменте не поддерживается выбранной моделью сети. Даже online check в момент admission не может отозвать уже начатый внешний запрос. Рекомендация для первой реализации: строгий запрет новых admission при неизвестной authority freshness, локальный priority stop и раздельные `halt_requested`, `halt_observed`, `dispatch_disabled`, `processes_stopped`. Внешние эффекты с неизвестным исходом остаются в reconciliation. Это уточнение для дальнейшего архитектурного решения, не молчаливая правка существующего I8.

## L0, L1, L2 без нового консенсуса в ядре

| Профиль | Область доверия | Последствие |
|---|---|---|
| L0 | Один authority signer и доверенная environment | Меньше компонентов; компрометация authority/root остаётся вне защиты. Подходит для проверки envelope, journals, fencing и receipt semantics |
| L1 | Доверенный sequencer, threshold signatures по локальному определению Apiary | Threshold препятствует одиночной неразрешённой записи при соответствующей модели compromised keys, но единство истории зависит от sequencer. Async signatures не означают разрешение до QC |
| L2 | Внешний established BFT substrate с явной voting membership и проверяемыми committed roots | Agent kernel принимает certificate adapter; нужны pin/review реализации substrate, recovery, membership changes, key rotation и light-client rules. Не делать ad hoc majority signatures эквивалентом BFT |

В Apiary уже приведён контрпример L1: при трёх участниках и пороге два злонамеренный участник подписывает обе развилки, а два честных — по одной. Пересечение quorum не гарантирует честного участника без нужных ограничений. [Локальный pinned текст, L1/L2](https://github.com/relux-works/apiary-docs/blob/e4249a6193c0f2730e7cffaea6b4907c0a7e80a9/paper/paper.tex#L99-L115).

Raft ориентирован на non-Byzantine failures и majority availability; поэтому полезен для доверенного replicated control plane, но не замена L2 при malicious validators. [Raft extended paper, §§2, 5](https://raft.github.io/raft.pdf). CometBFT описывает propose/prevote/precommit, locks и порог voting power: пример уже существующего внешнего substrate, не выбранная здесь implementation dependency. [Pinned specification](https://github.com/cometbft/cometbft/blob/3bd679a20b154bcba63aae7edb13faa673103e38/spec/consensus/consensus.md#L1-L63) и [Safety/Liveness](https://github.com/cometbft/cometbft/blob/3bd679a20b154bcba63aae7edb13faa673103e38/spec/consensus/consensus.md#L211-L230); прочитана спецификация, не consensus implementation, security audit не заявлен.

Логи моделей и суждения reviewers не проходят консенсус как «истина». Ledger проверяет подписи, membership, scope, версии, quorum, hashes и transition predicates; оценка правильности кода остаётся внешним attestation с явно ограниченным trust claim.

## Минимальный transport-neutral envelope

**Предлагаемый формат, не существующий API.** Версионированный typed union с небольшим обязательным заголовком; тяжёлые доказательства и тела адресуются digest. Никакого произвольного `execute(any)` от relay.

| Поле / группа | Назначение и правило |
|---|---|
| `protocol_version`, `kind`, `project_id` | Domain separation и маршрутизация; неизвестная обязательная версия/тип — отказ |
| `message_id`, `operation_id`, `causation_id` | Message меняется при новом событии, operation стабилен для одного intended effect; повтор не создаёт новую операцию |
| `sender`, `recipient`, `key_id` | Проверяемые node identity и назначенный получатель, а не display name |
| `task_id`, `contract_revision`, `plan_digest` | Связь вызова с разрешениями и критериями; optional лишь для типов, которым задача не нужна |
| `grant_id`, `executor_id`, `executor_generation`, `authority_epoch` | Отказ старой/чужой authority; отдельный `orchestrator_lease_id` только в management-командах |
| `issued_at`, `expires_at`, `sequence` | Replay horizon и порядок внутри producer generation; часы и sequence сами по себе не authority freshness |
| `payload_digest`, `payload_size`, `media_type`, `payload` либо `artifact_ref` | Hash неизменяемого тела, bounded inline размер; artifact locator отделён от identity |
| `auth_proof_ref`, `signature` | Certificate/grant chain с локальным cache по digest; domain-separated подпись canonical header + body digest, исключая саму подпись и mutable transport metadata |

Для JSON можно выбрать [RFC 8785 JCS](https://www.rfc-editor.org/rfc/rfc8785.txt), с явными ограничениями чисел и I-JSON; bytes/digest считаются по выбранной canonical encoding. Не подписывать произвольно сериализованный Go map или XML wrapper. Критические counters, размеры и версии должны иметь однозначный диапазон/представление; decoder отвергает duplicate keys, oversized/deep payload и неизвестные critical extensions.

Минимальные kind: `command`, `receipt`, `event`, `query`, `query_result`, `cancel`. Concrete payload schema различает `Execute`, `GetOperation`, `Reconcile`, `CancelOperation`, `GrantCommitted`, `Halt`, `ExecutionOutcome`, `CandidateSubmitted`, `CandidateAccepted`. Не все типы доступны каждому binding или sender. `receipt.stage` — `received_durable`, `admitted`, `started`, `terminal`; отказ несёт code и ссылку на operation. `CandidateAccepted` приходит только от authority и привязан к candidate/contract/policy/environment digests. Transport ack вообще не stage доменного receipt.

**Порядок и reconciliation.** Per-producer sequence помогает обнаружить gap/duplicate; порядок authority — checkpoint/ledger position. Независимые операции не требуют глобального total order. Повтор с тем же ID и другим hash — protocol conflict. Gap возвращает bounded missing interval либо signed snapshot+cursor; восстановление не требует бесконечного replay всего чата. Snapshot проверяет trust root/QC, monotonic epoch и membership transition; старый валидно подписанный snapshot не принимается как свежий только из-за корректной подписи.

## Очереди, cancellation и overload

Предложение: отдельные квоты по проекту, grant и sender; limits в **байтах и количестве**, максимальная длина arguments, outstanding operations, размер chunks и дедлайн. Producer получает credits от bounded receiver, а не unlimited `send` в память. На переполнение — явный retriable `resource_exhausted` с retry-after; получатель не выдаёт durable receipt, если не сохранил сообщение. Retry budget, jitter/backoff и максимальный возраст предотвращают replay storm.

Control lane для halt/cancel отделяется от больших artifacts и stdout и резервирует ресурсы, но тоже ограничивается и аутентифицируется. Прогресс допустимо coalesce/drop с явным gap marker; command, terminal receipt и authority transitions не теряются молча. Медленный subscriber не удерживает весь stream: bounded window и возобновление по durable cursor.

Cancel — самостоятельная идемпотентная операция с actor authority, target operation и generation. Состояния: `requested` → `observed` → `cancelled_before_start` либо `stopping` → `stopped`/`outcome_unknown`/`already_terminal`. Отказ или timeout cancel не сообщает, что effect прекратился. Process-group termination, deadline и egress fencing нужны отдельно от `context.CancelFunc`; compensation — новая авторизованная операция с собственным outcome, не «rollback был автоматически».

## Content-addressed packages и передача артефактов

**Наблюдение.** OCI descriptor содержит media type, digest и размер; ссылки на location опциональны, размер и digest проверяются получателем. TUF разделяет root/targets/snapshot/timestamp metadata, thresholds и freshness, рассматривает rollback/freeze attacks. [OCI descriptor](https://github.com/opencontainers/image-spec/blob/af26a05fba5ee648512f4ea3c9fda1fcc1b6d6dc/descriptor.md#L1-L55), [TUF specification](https://theupdateframework.github.io/specification/latest/).

**Предложение:** immutable package manifest описывает platform/ABI, executable digest, tool schemas, dependency closure, requested permissions и provenance. Curator разрешает установку по trusted signer/policy; digest доказывает идентичность bytes, не безвредность, поддержку ABI или одобрение владельца. Dependency lock и receipt привязываются к фактически запущенному artifact, не только к имени package/tag.

Артефакт публикуется в staging, проверяется по declared size и digest, затем атомарно становится visible по content ID. Для больших объектов — bounded chunks с offsets/hashes и общим final digest; resume сохраняет идентичность объекта. Упаковка не допускает path traversal, symlink escape, decompression bomb, исполнения hooks при просмотре и executable defaults. Download locator и HTTP upload slot имеют краткий срок; bearer URLs и headers не пишутся в model context/долговечные receipts. Private artifacts шифруются/авторизуются отдельно от адресации.

Receipt `artifact_stored` у одной реплики не заменяет policy availability certificate. Hash без bytes не пригоден для проверки кандидата. До acceptance нужны обещания хранения с определённым retention, восстановление missing replicas и pin от GC; цепочка digest не доказывает доступность в будущем. Artifact store и sandbox не должны иметь общую namespace authority: файл, названный `approved`, не становится approved state.

## Isolation: что действительно защищает environment

| Механизм | Прочитанное основание | Предлагаемое применение / ограничение |
|---|---|---|
| Process/container + namespaces, seccomp, cgroups | Firecracker paper и gVisor architecture объясняют общий host-kernel boundary обычных containers | Для доверенных внутренних задач при достаточной policy; worktree/chroot сами по себе не sandbox. Host credentials/socket/device mounts могут разрушить границу |
| gVisor | Userspace Sentry реализует Linux ABI; Gofer даёт ограниченный доступ к host resources; syscall compatibility неполна | Возможный Linux backend для недоверенных tool wrappers. Проверить реальный toolchain, I/O и resource limits; не считать memory-safe язык доказательством отсутствия escape |
| Firecracker microVM | KVM, отдельный guest kernel, сокращённые devices и дополнительный jailer | Кандидат для более жёсткой изоляции произвольного Linux-кода; требует Linux/KVM инфраструктуры и lifecycle image/kernel updates. Не нативный универсальный macOS sandbox |
| WASI/Wasmtime | Capability-based filesystem access; host APIs определяют доступные возможности | Хорошо для узких portable plugins. Не drop-in среда arbitrary shell/compiler/device workloads. Host import с чрезмерными полномочиями обходит желаемую policy |

Источники: [Firecracker NSDI 2020, §§2–3](https://www.usenix.org/system/files/nsdi20-paper-agache.pdf), [gVisor architecture/security introduction](https://gvisor.dev/docs/architecture_guide/intro/), [Wasmtime security, Filesystem Access](https://docs.wasmtime.dev/security.html). Производительские security claims — свойства описанной архитектуры при допущениях, не наша аттестация развёртывания. Не переносим исторические численные overhead/startup показатели на современный Go runtime.

Environment должна публиковать проверяемый inventory enforcement: filesystem read/write, protected paths, process visibility/signals, network egress, CPU/RAM/PIDs/disk, devices, platform и tooling. Task требует класс; при несовпадении — отказ согласно I9. Kernel выбирает внешний sandbox binding по inventory, но не изобретает единый фиктивный sandbox на всех ОС. Секреты проекта и authority signer остаются в отдельном runner вне worker sandbox. Model/provider credentials остаются на contributor host, вне filesystem и environment tool wrapper.

## Угрозы и остаточный риск

| Злоумышленник / сбой | Предлагаемая защита | Что она не доказывает |
|---|---|---|
| Worker/model: forged call, prompt injection из tool output, replay | Детерминированный external gate, typed schema, bound grant, повторная проверка plan и epoch | Корректность решения модели внутри разрешённой области |
| Orchestrator: расширение scope, self-acceptance, подбор зависимых reviewers | Committed contracts, attenuation, role/membership checks, candidate-bound attestations | Независимость экономических владельцев без внешних свидетельств |
| Plugin: malicious tool body/hook, schema substitution, confused deputy | Curator package pin, least-authority process, authenticated IPC, per-call enforcement и schema digest | Подпись автора не доказывает добросовестность package |
| Relay/broker: drop, reorder, duplicate, forged addressing, rollback | Signed envelope, durable inbox/dedup, generation fencing, reconciliation, freshness | Доступность и сокрытие метаданных трафика |
| Executor: ложный receipt | Доверенный executor в L0/L1 либо независимая проверка candidate в выделенной среде, narrowly scoped attestation | Подпись только устанавливает происхождение заявления; malicious executor может лгать |
| Authority/validator compromise | Объявленная L0/L1/L2 модель, thresholds, deterministic rules, key rotation и monotonic state | Безопасность вне допущенного порога/при скомпрометированном trust root |
| Supply chain: tag replacement, dependency poisoning, rollback/freeze | Digest lock, trusted update metadata/freshness, pinned dependencies и isolated build | Отсутствие вредоносности в одобренном source или compiler |
| Resource exhaustion | Byte/count/time budgets, slots, bounded logs, fair scheduling, control lane | Неограниченную доступность при нарушителе сети/хоста |

## Provider credentials и реальные entitlement boundaries

Полная provider/API/subscription матрица принадлежит отдельной задаче `TASK-260908-39n05p`; здесь только ограничения, влияющие на границу kernel/tool-skill. Её ещё не полученный результат не используется как доказательство.

**Наблюдение на дату исследования.** Official OpenAI documentation различает Codex subscription login и API-key usage; API-key usage тарифицируется через Platform, для программных CLI workflows рекомендован API key. Отдельно описаны enterprise Codex access tokens для trusted automation; для общих API calls остаются Platform keys. App Server имеет официальные auth modes, включая managed ChatGPT flow. Это описание конкретных продуктовых путей, не разрешение извлекать токены и использовать их в произвольном HTTP adapter. [OpenAI authentication](https://learn.chatgpt.com/docs/auth), [App Server authentication modes](https://learn.chatgpt.com/docs/app-server#authentication-modes).

**Наблюдение.** Anthropic различает OAuth для штатных приложений и API authentication для сторонних продуктов/Agent SDK; запрещает сторонним приложениям предлагать Claude.ai login и посредничать с такими credentials. Страница отдельно допускает описанный там сценарий размещения **неизменённого** Claude Code с входом самого пользователя. [Claude Code legal/compliance, Authentication and credential use](https://code.claude.com/docs/en/legal-and-compliance). Это текущая документация поставщика, не юридическая оценка всех возможных договоров.

**Рекомендация:** provider service выбирается host policy, хранит credential reference вне model-visible skill и возвращает нормализованный поток model events/usage/errors. `unsupported_auth_route`, `entitlement_denied`, `quota_exhausted`, `authentication_required` различаются. Tool plugin не выбирает billing identity и не получает access token модели. Если разрешённый продуктовый путь использует полноценный внешний harness через официальный interface, считать это отдельным execution profile; не выдавать его за чистый model provider с гарантированно одним tool. Возможность отключить ambient tools и соблюсти Apiary boundary должна быть отдельно проверена.

Не установлены индивидуальные права аккаунтов, quotas, разрешённость перепродажи inference и parity всех provider backends. Account access, credential extraction, авторизация в браузере и платные вызовы не выполнялись. Нельзя автоматически переводить отказ подписки в обходной endpoint или другой billing principal.

## Решения, которые следуют из исследования

**Принять для следующего design draft:** общее ядро двух профилей; immutable per-run bindings; credential broker отдельно; MCP только в Curator wrappers; strict online freshness по умолчанию; committed bounded grant; durable executor ownership; transport-neutral receipts и cancel; outcome_unknown/reconciliation; artifact descriptors и separate acceptance; один первый transport adapter; L0 first и внешний L2 adapter.

**Отклонить:** quorum на каждый обычный sandbox command; self-minted plugin grants; schema-only sandbox; автоматически пересоздаваемый operation ID при retry; миграцию executor без fencing; exactly-once для произвольного shell; global ordering из XMPP; A2A completed как принятие проекта; multisigner как доказательство независимости; новую BFT implementation внутри kernel; универсальное использование subscription OAuth как provider API.

**Оставить открытым для архитектурной фиксации:** точный допустимый Δ/ε/D или полный отказ offline execution; доверенный sink для каждого класса внешних effects; политика owner independence; поддерживаемые sandbox classes на целевых ОС; immutable версии wire bindings; retirement/GC dedup records; entitlement route каждого разрешённого provider. Для исследования это установленные границы, а не блокер handoff. Нормативные документы siblings не изменены.

## Предлагаемые опровергающие проверки для будущей реализации

Здесь они **не выполнялись**: crash после эффекта до receipt; повтор одного ID на двух executor generations; истёкший grant после очереди; partition во время halt; rollback clock/restart; replay после GC; forged origin/stanza ID; contract/schema digest mismatch; chunk truncation/hash mismatch; malicious plugin, который обходит model schema; cancel после совершённого effect; stale candidate acceptance; quota race двух параллельных calls. Каждая проверка должна вызвать реальный entry point и зафиксировать отказ/unknown либо единственный подтверждённый effect у sink. Наличие теста без наблюдаемого sink и fault point не доказывает свойство.
