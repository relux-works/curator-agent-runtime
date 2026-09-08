# Миграция, assurance и план проверки

Статус: proposed architecture. Это roadmap для будущих нормативных и implementation задач. Runtime tests в данной архитектурной задаче не выполнялись: реализации нет. [Карта требований](../../.research/260908_requirements-map.md) содержит полную исходную D01–D36 trace; решения ниже принадлежат этой архитектуре.

## Retain / change / reject

| Источник / invariant | Решение | Новая ответственность / migration |
|---|---|---|
| runtime §3.1–4: no FS/spawn/credentials/tools in core | Retain, усилить process separation с первого usable profile | Broker/model-host/OS policy; общий executable не общий principal |
| runtime §3.3, ADR0003: verified context | Retain | Remote context bundle pin; mutable workspace instructions остаются data до новой compile |
| runtime §3.5, §6: grant → call plan → observed receipt | Retain | Unknown shell использует task-local ceiling; receipt не доказывает точный полный effect trace |
| runtime §5.2, §7.1: absolute local workspace | Change | Versioned local/remote WorkspaceRef; executor владеет paths, worker без checkout |
| tool-interface §5 и ADR0002: canonical paths / broker never opens file | Change | Lexical intent отдельно от handle-relative backend resolution; broker не становится file-reading tool |
| runtime §4: stale result reject | Change | Refuse current authorization, сохранить historical execution evidence и reconciliation |
| runtime §7.5: at-most-once stored result | Change | Durable operation WAL/ownership, duplicate conflicts, explicit outcome_unknown; no exactly-once external claim |
| runtime §8 и ADR0005: immutable epoch | Retain | Drain/reconcile old processes/signature intents; install не hot activation |
| runtime §9: delegated tool literal subset | Change | Separate executable/delegable authority; old plan defaults equal, no privilege widening in migration |
| tool-interface §6: co-installed duplicate interface fails | Change | Explicit selected binding; ambiguous selection fails, alternatives may coexist |
| tool-interface §3: portable schema subset | Change, versioned | Canonical validation отдельно от model projection; nullable branch representation требует новой версии |
| runtime §11, tool-interface §6: reserved remote/component | Change/Defer | Process client wrapper + mediated Apiary execution protocol; native remote/component остаются unsupported до отдельного freeze/qualification |
| approval §5–8: human-created leases/JIT | Change только новой policy version | Human authorizes bounded autonomous class once; model/QC не human consent. Old never stays deny |
| Apiary I1/I8: current authorization/halt | Clarify | Strict-online serialized permits default; past permits/running effects bounded, global instant halt не обещается |
| Apiary I3: exact candidate и атомарная интеграция | Change/clarify | Qualified Git locator + SHA-256 recursive content manifest C(M/R/I); local sole-writer gateway, durable permission intent → Git CAS → receipt, без cross-store atomic claim; target advancement требует rebuild |
| Apiary I2: attenuation цепочки goal → capability → task → revision | Retain | Goal/contract revision отдельно; новая AC требует авторизованной версии, scope только сужается |
| Apiary I4: deterministic consensus | Retain | Model judgement только внешняя attestation, validators не вызывают LLM |
| Apiary I6: ключи у владельцев, проектные secrets изолированы | Retain, уточнить роли | Contributor identity/model/transport раздельны; runner использует сервис подписи candidate commit, raw main/ref write authority только у publication-gateway |
| Apiary I7: journal authority, session cache | Retain | Cold recovery по ledger + durable high-water; native session не выдаёт права |
| Apiary I5: role independence | Retain с честными assumptions | External owner enrollment, frozen eligibility, selection after I; distinct keys недостаточно |
| Apiary §7: claims/scope/slot | Retain | Scope до integration/cancel; slot lifecycle отдельно; transfer не сбрасывает ownership |
| Apiary I9: assurance | Retain | Per-capability execution assurance; full requirement refuses partial backend |
| Apiary I10: all worker interactions | Narrow claim | Honest runtime accounts own observations; arbitrary remote inference completeness не доказуема подписью |
| Paper «две bindings», локальная подпись как tool | Change | Один `central`; host-only SealRequest/SnapshotReceipt → node-built Submission → SubmitCandidate; no raw signer и no fourth op |
| Paper local-like persistent shell | Change | Persistent FS + explicit per-call cwd/env + supervised process handles; no shell-memory recovery |
| Book daemon binaries inside skill | Reject | Operator-owned host daemon отдельно от source-built client skill; curator-spec assurance ownership |
| Audit registry endorsements как task QC | Reject | Отдельные domain records/validator policy, reuse crypto/canonical encoding only |
| L2 как больше подписей L1 | Reject | Established consensus substrate и новая fault model, вне kernel |
| Task-board path-disjoint reparent acceptance | Reject для Apiary | New candidate, new review; legacy local behavior не protocol evidence |
| Same-process third-party extensions/MCP в kernel | Reject | Confined pinned providers и separate host extensions |
| Whole-agent bridge = ModelPort | Reject | Separate interface, state/account/assurance/usage; strict-worker parity не установлена |
| Любой OAuth adapter = subscription entitlement | Reject | Dated product/use-case policy и allowed owner identity; no raw token reuse |

Нормативные v0.1 файлы сохраняются без изменений. Следующая ревизия должна явно назвать заменяемые sections, добавить version negotiation и strict refusal при old/new mismatch. Old schema не должна начать принимать remote WorkspaceRef благодаря optional fields. Defaults при импорте только уменьшают полномочия или сохраняют прежний ceiling; миграция unknown old state не превращает его в accepted proof.

## Владельцы контрактов и последовательность работ

| Шаг / один deliverable | Нормативный владелец и requirement trace | Зависимость и проверяемый выход |
|---|---|---|
| R1. Freeze generic runtime revision | curator-agent-runtime; acceptance WorkspaceRef, epochs, typed invocation, schema projection | Machine-checkable grammar/vectors, proposal-reviewed; existing v1 untouched |
| R2. Freeze Apiary domain protocol | future apiary-spec; identity/signature/lease/WAL/task/candidate/XMPP requirements | R1 object link identities; closed content manifest fields/bounds/vectors, PublicationIntent/receipt/crash tables и negative wire vectors |
| R3. Tool descriptor/installation extension | curator-spec + Curator implementation; package/export/compiler/admission requirement | R1, explicit binding selection, source/artifact integrity и process lifecycle conformance |
| I1. Direct worker vertical slice L0 | runtime/executor implementation repos; shared kernel + useful coding task | R1–R3 frozen; one central, remote WorkspaceRef, WAL/sandbox, permitted API route |
| I2. Exact task-to-integration pipeline | Apiary authority/runner + task-board adapter repos; review/integration requirement | I1; strong-C(I) review/test, sole-writer local gateway и PUB-STALE/PUB-CRASH recovery; external mirror отдельно |
| I3. XMPP binding qualification | transport implementation; concrete XMPP/reconnect/artifact requirement | R2 + I1; duplicate/reconnect/overload/interoperability evidence |
| I4. Additional assurance/provider profiles | platform/provider implementation; deployment/portability requirement | I1–I2; per-platform live qualification и entitled route probes |
| I5. L1/L2 distributed authority | apiary-spec + selected substrate; future distributed trust requirement | R2, I2, operational fault model/keys/membership review; no new kernel consensus |

Это последовательность архитектурных deliverables, **не созданные implementation board tasks**: текущая задача явно запрещает runtime implementation и task-scoped handoff не означает freeze новой нормы. Не добавляем церемониальные documentation/research stories. Перед переводом будущего wire leaf в development владелец обязан приложить `references/file-formats.md`, exact field list/sizes, schema revision/digest и исполняемый conformance vector set; examples из этих глав не удовлетворяют freeze gate. Dependencies указаны здесь для следующего планирования. Отдельный consolidation leaf текущей Story отвечает за совместное дерево исследований, README и unresolved questions.

## Threat limits и assurance profiles

| Профиль | Что допускает | Что обязан отказать / чему доверяет |
|---|---|---|
| `local-development` | Один operator, direct model, confined sandbox, L0; experimental only | Targeted same-account attacker вне claim; partial labels явны, strict tasks denied |
| `managed-L0` (первый usable default) | Operator-owned authority/broker/executor, раздельные principals, direct model, strict-online permits | Unavailable authority, stale versions, absent platform evidence; trusted host/root/runner/provider confidentiality; sole local publication writer, OS lock/no rewind/qualified durable Git storage |
| `hostile-code-L0` | VM/microVM-isolated task execution, no host secrets, resource bounds | Unqualified kernel/device escape boundary; требует qualification, не alias обычного container |
| `platform-runner` | macOS/iOS/Android/physical device именованные jobs | Generic shell/keychain access; full assurance при partial capabilities; device reset без contract |
| `agent-bridge-compat` | Поддерживаемый whole-agent user-owned binary | Не заявляет same loop/complete transcript/strict one-tool parity; contractual admission отдельно |
| `federated-L1` | XMPP и threshold records с trusted sequencer | Не обещает Byzantine fork safety; relay confidentiality explicit |
| `distributed-L2` | External BFT substrate + explicit membership/fault threshold | Недоказанная Sybil independence, threshold compromise, unqualified light client |

Security claim не «prompt injection невозможен». Malicious repository/tool content может убедить модель сделать разрешённую плохую правку. Malicious worker может лгать о reasoning/model; malicious executor — о receipt. Validator ограничивает permissions и связывает evidence, независимый review уменьшает риск, но не доказывает корректность любого кода. Contributor OS root может прочитать его локальные ключи/контекст в профиле без защищённого key domain. Project root compromise разрушает L0 authority. Эти ограничения не исчезают от подписи или большего числа model agents.

## Negative conformance matrix

Каждая будущая строка проверяется через production entry point, с positive control, negative input и narrowing mutation. Отчёт обязан дать `observed / required`, unresolved/unknown и blind spots. Здесь **0 runtime probes выполнено**; ниже контракт будущей проверки, не результаты.

| ID / requirement | Adversary и entry point | Обязательный отказ / наблюдение | Как сузить gate для проверки |
|---|---|---|---|
| V01 tool admission | Model/plugin → Open/Invoke, новая epoch | Uninstalled tool, unknown field/op, ambiguous binding; effects=0 | Разрешить только один из двух запрещённых extra fields: оба должны независимо тестироваться |
| V02 terminal stream | Provider → Generate/dispatch | Valid args + length/error/EOF: effects=0 | Проверить error, length и truncated branch отдельно, не только удалить terminal gate |
| V03 paths | Malicious skill → exec/resume | `..`, absolute cwd, symlink/hardlink/mount escape refused by real backend | Оставить lexical check, сломать no-follow; race probe должен поймать обход |
| V04 identity tuple | Worker → admit/renew/retry | Wrong contract, epoch, term, generation, audience, signer | Поменять каждый bound field по одному; один совпавший digest не спасает остальные |
| V05 duplicates | Relay/worker → retry/reconnect | Same ID/body = stored result; changed body = conflict | Ослабить equality только для input digest, сохранить ID; conflict test ловит |
| V06 WAL crash | Executor crash → recovery | Crash after effect cannot blind-retry; unknown reserve retained | Оставить WAL, убрать dispatch marker sync: fault injection выявляет двойной effect |
| V07 cancel | Worker/timeout → cancel/late receipt | Exit/cancel race один real outcome; no rollback claim | Уменьшить охват child-process termination; descendant probe остаётся обязательным |
| V08 halt/fence | Stale orchestrator → renew/resume/failover | Stale term/token denied; partition no new strict permit | Проверить admission и delayed dispatch отдельно; не только initial Open |
| V09 budget | Concurrent workers → admission/model retry | Shared reservation never exceeds parent; unknown usage не zero | Сузить gate до per-worker counter; concurrent entrypoint должен обнаружить overspend |
| V10 signing/replay | Malicious node/relay → signed envelope | Wrong domain, duplicate keys, old cert, bad sig, wrong audience, downgrade | Убрать один domain field из preimage; вектор cross-domain подписи должен провалиться |
| V11 exact candidate / GIT-IDENTITY | Worker/store → seal/materialize/test/accept/publish | Wrong tuple; wrong-content-same-locator, missing C(I), unsupported format/unclosed LFS/submodule denied | Оставить locators и signature check; по одному убрать path/mode/blob/symlink/commit-metadata SHA-256 check; каждый variant обязан обнаружить подмену |
| V12 credentials | Tool/provider → route/refresh/fallback | Wrong owner/tenant/endpoint, leaked redirect key, stale generation denied | Оставить provider name check, сломать tenant check; cross-tenant vector ловит |
| V13 bridge | Whole agent → start/tool route/resume | Hidden local/hosted effect invalidates strict claim | Disable only visible tools; independent FS/network/process observation должен видеть bypass |
| V14 XMPP/artifacts | Relay → reconnect/upload/fetch | SM ack not admitted; bad digest/size/URL/XXE/overload refused | Зачесть SM ack как domain ack в mutant; outbox assertion должен поймать потерю |
| V15 storage | Corrupt disk → resume/reconcile | Malformed committed record/read error не absence | Только torn tail разрешён; middle corruption test не должен пройти tolerant reader |
| V16 assurance | Unqualified backend → Open/runner dispatch | Required full rejects partial/unknown | Сузить inventory check до OS name; capability-specific negative test ловит |
| V17 delegation | Orchestrator → child spawn/renew | Child scope/budget/time/depth вне delegable ceiling denied | Проверить отдельно each dimension и sibling total, не только tool subset |
| V18 reviewer eligibility | Colluding nodes → review selection/accept | Self-review, duplicate owner, selection before freeze proof denied | Оставить unique key check, убрать owner check; Sybil-shaped enrollment fixture ловит |
| V19 PUB-STALE | Stale runner → gateway Request/dispatch/recovery | r3/stop/term committed до intent: refusal; после intent: только уже допущенный historical effect, no new permission | Сохранить Git CAS M, убрать contract/stop/term из journal admission по одному; delayed request должен отказать при неизменном M |
| V20 PUB-CRASH | Process/storage failure → gateway startup/reconcile | Все пять crash windows: no blind CAS replay; M/C(M) not_applied, I/C(I) applied только при sole writer/barrier; other/read failure unknown | Оставить intent WAL, ослабить sole-writer/barrier/no-rewind по одному: entry-point tests обязаны ловить запрещённый update; recovery не обещает определить скрытый rewind после нарушения TCB. Отдельный тест fsync durability |
| V21 host submission | Malicious model/late client → terminal/Seal/SignSubmission/SubmitCandidate | Terminal text не acceptance; pending/unknown effects, late exec, foreign/stale assignment и changed duplicate отказаны | Сохранить signature check, убрать SnapshotReceipt/assignment binding или writer barrier по одному; нет Submission об иных bytes |

Каждая leaf с gate обязана перенести соответствующие negative rows в AC. Leaf только навигации может записать `refusal_rows: none — no authorization or effect semantics`; здесь архитектурный документ описывает refusal semantics, поэтому none не применяется ко всему дизайну. Runtime conformance не доказана статическим prose/JSON parse. Для настоящих external provider/platform probes нужны admitted account, расход и доступный host; mocks только fault injection, не capability proof.

## Измеримые эксперименты и вопросы

Решения уже приняты: Go loop самостоятельно; command-oriented central; direct baseline; L0 default; strict-online; typed signing; explicit WorkspaceRef; no arbitrary shell state recovery; no acceptance carry-over; SHA-256 manifest для legacy Git; local authoritative publication gateway с отдельным remote mirror. Они не требуют нового human vote для drafting.

| Experiment | Измерение / falsifier | Кто закрывает |
|---|---|---|
| E1. Полезность central | Фиксированный набор coding tasks, completion ratio, shell dependency, typed replacement opportunity, model/tool tokens, p50/p95 latency; если task не выражается без forbidden authority — пересмотр interface | Runtime product/implementation owner |
| E2. Process overhead | RSS/startup/turn latency всех core/broker/model-host/tool/executor процессов, не только tiny kernel; сравнить one-shot/session-worker при одном workload | Runtime owner |
| E3. Recovery | Fault injection до/после каждого WAL/effect/receipt boundary, включая publication permission/Git sync/receipt и restart при committed stop; duplicate effect count должен быть 0 для заявленной idempotent области, unknown честно видим | Executor owner |
| E4. Stream/context | Model-specific schemas, opaque blocks, terminal failures; compaction сохраняет constraints/causal pairs; task quality vs context size | Model adapter owner |
| E5. XMPP | Две реализации сервера/client, SM resume loss, duplicate/out-of-order, bounded queues/artifact interrupted transfer | Transport owner |
| E6. Platform isolation | Linux escape/egress/process quota probes; macOS/device inventory с full/partial по каждому capability | Platform owner |
| E7. Provider permissions | Account-specific use case/tenant/region/billing и supported login; bridge one-tool parity отдельно | Account owner + adapter maintainer |
| E8. Distributed trust | L1 fork scenarios, L2 substrate pins/membership/light-client recovery и adversarial tests | Apiary protocol owner |

Performance thresholds пока не изобретаем: сначала reproducible baseline с размером repo, commit/image/model/adapter pins и resource policy, затем product target. Correctness gates (no unauthorized effects, no duplicate execution в заявленной области, exact tuple) абсолютны и не смягчаются ради latency. Названные startup limits 80%, 5 s, 30 s и queue sizes — proposed policy defaults для измерения, не benchmark выводы.

Открытые **внешние** inputs: entitlement выбранного account/deployment; лицензии weights; operator enrollment и критерии независимости владельцев; конкретный доступный macOS/device runner. Открытые **engineering** вопросы: qualified sandbox backend, exact canonical grammar freeze, standard encryption profile для недоверенного relay, BFT substrate, quality/overhead thresholds по baseline. Это не повод блокировать архитектуру или direct L0 MVP. Публичный сервис с pooled subscriptions, анонимной membership или обещанием instant global halt потребует отдельного product/permission решения; текущий дизайн таких обещаний не делает.

Реестр оставшихся внешних входов и критериев закрытия экспериментов: [UNRESOLVED_QUESTIONS.md](../../UNRESOLVED_QUESTIONS.md).
