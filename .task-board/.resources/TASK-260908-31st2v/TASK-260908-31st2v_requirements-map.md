# Карта требований и решений: Apiary / Curator / runtime

Дата: 8 сентября 2026 года. TASK-260908-31st2v. Исследовательский материал для review. Все решения ниже — рекомендации, не изменения действующих протоколов.

## 1. Обозначения и область

`retain` — сохранить правило; `change` — изменить с versioned migration; `reject` — не использовать это правило/предположение в целевом Apiary profile. Reject локальной политики task-board не означает предложение удалить её из task-board: речь о неприменимости к публичной гарантии Apiary.

Источники закреплены на тех же ревизиях, что [основной отчёт](260908_apiary-curator-contracts.md):

| ID | Репозиторий | SHA |
|---|---|---|
| A | apiary-docs | `b1ad6d76d803cd3f8e46e2b9621d266d36f3a0c7` |
| C | curator | `2d0901444ecfe3c11c424c561c66c66b4bb5ddd1` |
| S | curator-spec | `87a0d0060bad64ab883d007dcdf35df7485368bf` |
| P | skill-project-management | `ebdf21a2dbe44892296c91a9401d87abc612f87f` |
| R | curator-agent-runtime | `da759b8f3d366f31e5bd42934f6b5ecd1d01ac3f` |

Все строки содержат прямой permalink на прочитанный источник. Пункты, названные «предложенной альтернативой» или «смешением», — аналитические выводы, а не найденные требования исходной спецификации. Для production limitations ссылкой служит реализация, а не предположение из README.

## 2. Решения и миграция

| ID | Правило / предположение | Исходный контракт | Решение | Архитектурное следствие | Миграция / проверка | Источник |
|---|---|---|---|---|---|---|
| D01 | Runtime: никакого встроенного model tool | R §3.4, ADR0002 | retain | Все tools приходят из pinned skill; служебный protocol transport не model tool. | Compiler отвергает tool вне plan; отдельно инвентаризировать service channels. | [protocol/runtime.md:55](https://github.com/relux-works/curator-agent-runtime/blob/da759b8f3d366f31e5bd42934f6b5ecd1d01ac3f/protocol/runtime.md#L55) |
| D02 | Core без FS/process/provider credentials | R §3.1–2 | retain | Broker/model I/O и OS boundary отделены от model loop. Go interface сам не security boundary. | Два process roles или доказанное capability isolation; негативная попытка доступа к host/keys. | [protocol/runtime.md:46](https://github.com/relux-works/curator-agent-runtime/blob/da759b8f3d366f31e5bd42934f6b5ecd1d01ac3f/protocol/runtime.md#L46) |
| D03 | Managed context из verified store | R §3.3, ADR0003 | retain | Инструкции не загружаются из writable workspace; remote task content — data. | Freeze repository context по commit/digest; при изменении instruction bundle новая epoch. | [protocol/runtime.md:51](https://github.com/relux-works/curator-agent-runtime/blob/da759b8f3d366f31e5bd42934f6b5ecd1d01ac3f/protocol/runtime.md#L51) |
| D04 | Grant ceiling → call-plan profile → receipt observed | R §3.5/§6 | retain | Описание effects и реально применённый профиль связаны одним typed object. | Schema validation до extractor; обязательный subset check до execution; output не доверяет self-report provider. | [protocol/runtime.md:154](https://github.com/relux-works/curator-agent-runtime/blob/da759b8f3d366f31e5bd42934f6b5ecd1d01ac3f/protocol/runtime.md#L154) |
| D05 | Детерминированный effect extractor без filesystem | R tool-interface §5 | change | Extractor выдаёт lexical intent; physical path/symlink/TOCTOU решает trusted backend с handles. | Версионировать path semantics, bind sandbox root/generation; не считать canonical string доказательством inode. | [protocol/tool-interface.md:76](https://github.com/relux-works/curator-agent-runtime/blob/da759b8f3d366f31e5bd42934f6b5ecd1d01ac3f/protocol/tool-interface.md#L76) |
| D06 | Broker никогда не открывает workspace file | R ADR0002 consequence | change | Запретить произвольный content-reading tool в broker, разрешить confinement handle resolution backend. | Сузить фразу; добавить проверяемую no-follow/open-relative boundary. | [decisions/0002-tools-are-skills.md:27](https://github.com/relux-works/curator-agent-runtime/blob/da759b8f3d366f31e5bd42934f6b5ecd1d01ac3f/decisions/0002-tools-are-skills.md#L27) |
| D07 | Immutable execution epoch | R §4/§8 | retain | Hot-plug превращается в explicit compile/drain/approve/new-epoch. | Existing call IDs остаются в old epoch; новые bindings не применяются к in-flight calls. | [protocol/runtime.md:235](https://github.com/relux-works/curator-agent-runtime/blob/da759b8f3d366f31e5bd42934f6b5ecd1d01ac3f/protocol/runtime.md#L235) |
| D08 | Late result просто reject | R §4 | change | Отказать в использовании как current result, сохранить historical receipt/outcome. | Разделить authorization disposition и audit retention; не терять факт завершённого remote effect. | [protocol/runtime.md:81](https://github.com/relux-works/curator-agent-runtime/blob/da759b8f3d366f31e5bd42934f6b5ecd1d01ac3f/protocol/runtime.md#L81) |
| D09 | Delegated tools literal subset parent model list | R §9, ADR0005 | change | Subset относится к выданной delegable authority, отдельной от executable/model-visible set родителя. | Versioned plan field; v0.1 defaults только прежние права; worker central не вынуждает дать orchestrator shell. | [protocol/runtime.md:255](https://github.com/relux-works/curator-agent-runtime/blob/da759b8f3d366f31e5bd42934f6b5ecd1d01ac3f/protocol/runtime.md#L255) |
| D10 | At-most-once со stored result | R §7.5 | change | Durable invocation state + unknown + reconciliation вместо обещания результата после любого crash. | Уникальность call body и at-most-once admission сохраняются; внешний effect не повторяется при unknown. | [protocol/runtime.md:214](https://github.com/relux-works/curator-agent-runtime/blob/da759b8f3d366f31e5bd42934f6b5ecd1d01ac3f/protocol/runtime.md#L214) |
| D11 | Session-worker fixed grant, одна binding | R §5.5 | retain | Не делить один worker process между bindings разных полномочий. | Persistent transport может multiplex только при отдельном проверяемом per-operation permit; иначе process per binding. | [protocol/runtime.md:135](https://github.com/relux-works/curator-agent-runtime/blob/da759b8f3d366f31e5bd42934f6b5ecd1d01ac3f/protocol/runtime.md#L135) |
| D12 | Process/component/remote как готовые классы | R tool-interface §6 | change | До определённых enforcement semantics поддержать process; remote через confined wrapper; component fail-closed. | WASM/component вводить новой conformance capability, не Go plugin/dlopen в core. | [protocol/tool-interface.md:94](https://github.com/relux-works/curator-agent-runtime/blob/da759b8f3d366f31e5bd42934f6b5ecd1d01ac3f/protocol/tool-interface.md#L94) |
| D13 | Human JIT на любой external network/signing | R approval §5–8 | change | Для unattended swarm нужен отдельно авторизованный bounded policy contract; QC не human consent. | До изменения протокола применимы только реальные human-created leases; never всегда denial. | [protocol/approval.md:64](https://github.com/relux-works/curator-agent-runtime/blob/da759b8f3d366f31e5bd42934f6b5ecd1d01ac3f/protocol/approval.md#L64) |
| D14 | Полнота всего увиденного моделью | R §10 против Apiary I10 | change | Локальный honest runtime логирует свой transcript; network verifier удостоверяет только наблюдаемые protocol interactions. | Не переносить local accountability claim на произвольную недоверенную worker node. | [protocol/runtime.md:272](https://github.com/relux-works/curator-agent-runtime/blob/da759b8f3d366f31e5bd42934f6b5ecd1d01ac3f/protocol/runtime.md#L272) |
| D15 | Одна центральная логическая среда | Apiary §5 | retain | Реплики допустимы; main mutation authority одна; ownership sandbox у проекта. | Pin executor identity и assignment; pool scheduler не становится вторым main writer. | [paper/paper.tex:152](https://github.com/relux-works/apiary-docs/blob/b1ad6d76d803cd3f8e46e2b9621d266d36f3a0c7/paper/paper.tex#L152) |
| D16 | Один инструмент = узкие права | Упрощение топологии Apiary | reject | Количество tools не ограничивает union effects. Unknown shell ограничивается task ceiling. | Центральный typed dispatcher с operation allowlist, closed inputs, budgets, audience и sandbox generation. | [paper/paper.tex:118](https://github.com/relux-works/apiary-docs/blob/b1ad6d76d803cd3f8e46e2b9621d266d36f3a0c7/paper/paper.tex#L118) |
| D17 | Worker ровно две bindings | Apiary §12, книга ch08 | change | Один central tool; signing — service flow или optional narrowly typed second tool. | Подпись только допустимого revision envelope, не arbitrary bytes/ssh-agent passthrough. | [paper/paper.tex:273](https://github.com/relux-works/apiary-docs/blob/b1ad6d76d803cd3f8e46e2b9621d266d36f3a0c7/paper/paper.tex#L273) |
| D18 | Без отдельного worker communication transport | Предположение из one-tool UX | reject | Join/heartbeat/assignment/review/submit/stop нужны независимо от tools модели. | Версионированный node protocol с authenticated envelopes и bounded inbox; capabilities ограничивают sends. | [book/ch11.tex:55](https://github.com/relux-works/apiary-docs/blob/b1ad6d76d803cd3f8e46e2b9621d266d36f3a0c7/book/ch11.tex#L55) |
| D19 | Текущий task-board — protocol authority | Книга ch05/ch10 | reject | Task-board — локальная materialization/adapter; authority задают Apiary records и validators. | Импорт legacy задач без minted QC; стабильные protocol IDs отдельно от файловой иерархии. | [book/ch10.tex:59](https://github.com/relux-works/apiary-docs/blob/b1ad6d76d803cd3f8e46e2b9621d266d36f3a0c7/book/ch10.tex#L59) |
| D20 | Один digest для задачи и полномочий | Устаревшее смешение | reject | TaskContract и SessionPlan — разные identities; изменение критериев инвалидирует acceptance. | Раздельные поля и signed bindings; не выводить contract version из CR revision. | [paper/paper.tex:178](https://github.com/relux-works/apiary-docs/blob/b1ad6d76d803cd3f8e46e2b9621d266d36f3a0c7/paper/paper.tex#L178) |
| D21 | Review exact candidate и CAS M→I | Apiary I3 | retain | Ни patch-id, ни совпадение changed_paths не переносит approval. | Fresh candidate → fresh review/attestations; добавить negative vectors wrong I/base/contract/policy/env. | [paper/paper.tex:256](https://github.com/relux-works/apiary-docs/blob/b1ad6d76d803cd3f8e46e2b9621d266d36f3a0c7/paper/paper.tex#L256) |
| D22 | Task-board reparent сохраняет acceptance | P integration.Reparent | reject | В Apiary non-overlap только уменьшает merge conflicts; не доказывает semantic equivalence. | Adapter выдаёт new Candidate + ReviewRequired; P локальная политика может жить отдельно, без Apiary claim. | [tools/board-cli/internal/integration/reparent.go:37](https://github.com/relux-works/skill-project-management/blob/ebdf21a2dbe44892296c91a9401d87abc612f87f/tools/board-cli/internal/integration/reparent.go#L37) |
| D23 | Независимость трёх ролей и review selection | Apiary I5 | retain | Run IDs/role labels недостаточно для owner/model/toolchain independence. | Freeze eligible set до I; randomness после I; issuer evidence и policy revision в records. | [paper/paper.tex:281](https://github.com/relux-works/apiary-docs/blob/b1ad6d76d803cd3f8e46e2b9621d266d36f3a0c7/paper/paper.tex#L281) |
| D24 | QC из existing audit endorsements | Книга ch10 | change | CCJ/Ed25519/high-water переиспользуются; audit status не task authorization QC. | Новые record domains, quorum policy, validator identity, inclusion proofs, availability protocol. | [protocol/registry.md:91](https://github.com/relux-works/curator-spec/blob/87a0d0060bad64ab883d007dcdf35df7485368bf/protocol/registry.md#L91) |
| D25 | L2 добавляется сменой threshold | Упрощение книги ch02/ch12 | reject | L2 меняет ordering и fault model, не только quorum count. | L0 API предусмотреть consensus adapter; L1 не рекламировать fork safety. | [paper/paper.tex:99](https://github.com/relux-works/apiary-docs/blob/b1ad6d76d803cd3f8e46e2b9621d266d36f3a0c7/paper/paper.tex#L99) |
| D26 | Unavailable evidence = отсутствует/успех | Опасная совместимость | reject | Три исхода для проверок, liveness, resolver и external operations. | Unknown запрещает acceptance/reclaim/replay, пока другой источник не установит нужный факт. | [tools/board-cli/internal/worktree/lease.go:288](https://github.com/relux-works/skill-project-management/blob/ebdf21a2dbe44892296c91a9401d87abc612f87f/tools/board-cli/internal/worktree/lease.go#L288) |
| D27 | Scope held до integration/cancel | Apiary §7 | retain | Отдельная занятость scope и execution slot; slot release не снимает scope reservation. | Slot/claim/assignment IDs раздельны; cancellation journals scope release. | [paper/paper.tex:197](https://github.com/relux-works/apiary-docs/blob/b1ad6d76d803cd3f8e46e2b9621d266d36f3a0c7/paper/paper.tex#L197) |
| D28 | Portable/verified assurance disjoint | S assurance | retain | Не обещать full от portable или schema success. | Runtime task-execution assurance получает собственный contract, не alias build-only шести capabilities. | [protocol/assurance.md:6](https://github.com/relux-works/curator-spec/blob/87a0d0060bad64ab883d007dcdf35df7485368bf/protocol/assurance.md#L6) |
| D29 | script-worker-v1 уже запускается | Не подтверждено C | reject | В C имеется parser+unconditional refusal; обычный shim declared-only. | Будущая implementation задача должна заменить refusal настоящим worker и production negative evidence. | [internal/scriptpolicy/scriptpolicy.go:85](https://github.com/relux-works/curator/blob/2d0901444ecfe3c11c424c561c66c66b4bb5ddd1/internal/scriptpolicy/scriptpolicy.go#L85) |
| D30 | Verified daemon уже есть в C | Не подтверждено C | reject | Production provider resolver nil; Darwin lossless boundary unavailable. | Отдельная реализация и native qualification; no automatic fallback. | [cmd/curator/assurance.go:17](https://github.com/relux-works/curator/blob/2d0901444ecfe3c11c424c561c66c66b4bb5ddd1/cmd/curator/assurance.go#L17) |
| D31 | Демон как готовый бинарь в skill | Apiary ch10 против S assurance §6 | change | Trusted host provider устанавливает оператор; skill приносит client source/contract. | Бинарная distribution policy возможна отдельной версией, но не ослабляет operator ownership. | [protocol/assurance.md:149](https://github.com/relux-works/curator-spec/blob/87a0d0060bad64ab883d007dcdf35df7485368bf/protocol/assurance.md#L149) |
| D32 | MCP в ядре или динамический tools/list | Предложенная альтернатива | reject | MCP только вне процесса, wrapper обычный pinned typed tool provider. | Новый catalog/schema digest требует epoch; resources/prompts не повышают instruction tier. | [protocol/environments.md:412](https://github.com/relux-works/curator-spec/blob/87a0d0060bad64ab883d007dcdf35df7485368bf/protocol/environments.md#L412) |
| D33 | Profile fragment = runtime plan | Смешение объектов | reject | Fragment задаёт managed home/channels, но не effects/approval/attestations. | Compiler явно consumes fragment/lock и emits отдельный SessionPlan; разные domains digests. | [protocol/environments.md:2025](https://github.com/relux-works/curator-spec/blob/87a0d0060bad64ab883d007dcdf35df7485368bf/protocol/environments.md#L2025) |
| D34 | Goal CAS/revision/owner separation | P board-goal-v2 | retain | User intent versioned отдельно; applied не выводится из pending ack. | Adapter сохраняет parent/run distinction; goal mutation не меняет assignment authority. | [pkg/board/board_goal_v2.go:764](https://github.com/relux-works/skill-project-management/blob/ebdf21a2dbe44892296c91a9401d87abc612f87f/pkg/board/board_goal_v2.go#L764) |
| D35 | Один общий Go kernel, profiles сверху | Целевой дизайн | retain | Один loop и broker contract, разные compiled catalogs; domain policy вне generic kernel. | Начать одним runtime module; API types вынести только при доказанной потребности внешнего consumer. | [docs/architecture.md:38](https://github.com/relux-works/curator-agent-runtime/blob/da759b8f3d366f31e5bd42934f6b5ecd1d01ac3f/docs/architecture.md#L38) |
| D36 | Все P/C internal packages перенести в runtime | Предложенная альтернатива | reject | Не тащить CLI/UI/config/native host/provider SDK dependency graph в kernel. | Versioned artifacts или explicit public library API; MCP и task-board за process boundary. | [tools/board-cli/go.mod:1](https://github.com/relux-works/skill-project-management/blob/ebdf21a2dbe44892296c91a9401d87abc612f87f/tools/board-cli/go.mod#L1) |

## 3. Минимальные интерфейсные границы

Это проектная декомпозиция ответственности, применимая к любому model provider и sandbox backend; здесь нет зависимости от конкретного vendor API.

| Граница | Вход | Выход | Владелец authority |
|---|---|---|---|
| Curator → environment compiler | Exact closure/profile lock, audited source identities, built client artifacts | Immutable SessionPlan с interface/provider/schema/effect digests | Operator policy + заданная задача, не package bytes |
| Core → broker | Typed tool intent и model call correlation | Bounded result + receipt reference | Broker выводит effect plan и проверяет grant |
| Model adapter → model service | Serialized request по pinned adapter contract | Streamed typed model events | Local provider-auth broker; tool skill не владеет credentials |
| Worker → Apiary control | Join/heartbeat/revision proposal/review result | Assigned task contract + plan authorization | Журнал с QC и действующей арендой |
| Worker tool wrapper → environment | Operation + authenticated envelope + sandbox generation | Command status/output/receipt | Central daemon, проверяющий assignment и stop на boundary |
| Orchestrator skills → control | Предложения decomposition/assignment/integration | Accepted/rejected/unknown protocol result | Validators, а не LLM orchestrator |
| Environment → project runner | Named privileged operation и отдельная authorization | Signed outcome или unknown/reconcile | Project-owned runner и отдельные secrets |
| MCP wrapper → MCP server | Fixed translated operation | Validated bounded result | Wrapper grant и broker mediation; server tools/list не authority |

**Ключевой запрет:** не добавлять в центральный tool произвольное поле `service/method/payload`, принимающее любое сообщение внутреннего протокола. Такая форма скрывает универсальный RPC и нивелирует worker profile. Закрытый discriminator и branch-specific effect extractor должны быть частью hashed interface.

## 4. Рекомендуемые identity bindings

| Объект | Обязательная привязка в новом контракте | Что не должно его заменять |
|---|---|---|
| Assignment authorization | Project ID, task ID, contract revision/digest, node ID, role, plan digest, term/token, scope, limits, validity | Task title, local RUN env var, current directory |
| Tool invocation | Epoch, plan digest, call ID, input digest, operation/interface digest, sandbox ID+generation, authorization record | Arbitrary caller-supplied grant |
| Execution receipt | Invocation/permit digest, executor identity, environment digest, bounded output digests, actual assurance, outcome, prev receipt | Текст «тесты зелёные», exit code без subject |
| Revision | B, R, task/contract identity, receipt-chain head, node signature | Только patch-id |
| Review/attestation | I, contract revision, policy version, environment digest, checker identity, property, passed/failed/unknown | CR accepted без версии criteria |
| Integration | Expected M, exact I, valid evidence set, term, fresh authorization | Текущее дерево, вычисленное после review |
| Provider auth | Operator-owned adapter instance и разрешённый sink/account mode | Skill manifest с OAuth token |
| Revocation | Subject/key/plan/assignment identity, issuer, effective boundary, monotonic high-water | Недоступность resolver или удаление локального файла |

Часть полей уже есть в Apiary paper, часть конкретизирует wire layer, отсутствующий в runtime v0.1. Не представлять таблицу как существующую JSON Schema.

## 5. План перехода без ложной совместимости

1. **Заморозить исходные semantics.** Сохранить v0.1 session/call/receipt objects и существующие C/P markers как исторические. Добавить явные version/domain IDs новым объектам. Не переименовывать portable receipt в verified и CR revision в contract revision.
2. **Нормативный минимальный срез.** Описать typed operation descriptor, lexical/physical path split, worker service transport, authority binding, unknown invocation outcome и delegated authority. Уточнить approval для unattended policy. Рассмотреть на review прежде реализации.
3. **Один вертикальный worker path.** API-key или local model → core → broker → Curator-built client skill → project-owned sandbox daemon. Один task, pinned plan, no project secrets. Это новая реализация; разрешённость subscription не prerequisite.
4. **Control plane L0.** Versioned contracts, assignments, leases, stop/high-water, receipts, immutable candidate, independent review/attestation и CAS. L0 упрощает quorum, но не пропускает I1/I3/I6/I9/I10.
5. **Project-management adapter.** Read/materialize старые tasks и resources; новые authoritative writes идут через Apiary record submission. Migration старых goals сохраняет owner/revision, старые review records остаются provenance. Не синтезировать отсутствующую независимость подписантов.
6. **MCP wrappers и новые providers.** Добавлять только через normal resolve/build/audit/pin/new-epoch; unsupported native/provider modes отказывают. Vendor harness integration имеет отдельный профиль доверия до доказательства отсутствия лишних native effects.
7. **L1/L2 и pooling.** Отдельные consensus/availability/recovery qualification и provider entitlement review. Не обещать BFT или разрешённое использование подписок по результатам локального L0 smoke.

## 6. Evidence matrix для следующей реализации

В этом исследовании перечисленные gates **не запускались**. Таблица — будущие acceptance criteria, а не отчёт о прошедших тестах. Правило доказательства: отрицательный вектор должен проходить через реальный entrypoint и обнаруживать ослабление соответствующего gate, включая narrowing mutation.

| Gate | Production entrypoint | Обязательная отрицательная форма | Ожидаемый результат |
|---|---|---|---|
| Plan admission | Session.Open | Unknown schema, digest mismatch, missing retention policy, unsupported assurance | No model request, no tool start |
| Per-call authority | Tool.Invoke / environment exec | Forged node, wrong assignment/task, widened scope, wrong term/epoch/generation | Denial до effect |
| Effect precision | Broker profile derivation | Broad central shell с ложным exact extractor | Refusal либо unknown с явно ограниченным ceiling |
| Path confinement | Реальное открытие target backend | Symlink swap/escape, case collision, protected path | Нет записи вне scope; trace evidence |
| Retry safety | Durable invocation executor | Same ID/different input, crash после внешнего effect | Conflict / unknown; нет blind replay |
| Transition | Session transition + late result | In-flight mutation, старая epoch, revoked binding | Drain/cancel/reconcile; historical audit без new authority |
| Component/MCP isolation | Provider launch | In-process plugin, changed server catalog, undeclared prompt/resource | Refusal, никакой hidden tool activation |
| Signing | Local broker signer | Arbitrary bytes, чужой R/task, wrong audience | Подпись не выдана |
| Identity resolver | Confirmation pipeline | Network error, malformed evidence, removed fingerprint | Unknown отдельно от observed absence |
| Review independence | Review assignment/acceptance | Same owner, unfrozen pool, random seed до I | No acceptance; ожидание/отдельное изменение policy |
| Candidate binding | main.cas | Old I, new contract/policy/environment, moved M | No main advance; new candidate/review |
| Stop/high-water | Executor admission/recovery | Old valid snapshot, stale term, unknown persisted state | Fail closed; restart не сбрасывает stop |
| Provider entitlement | Adapter admission | Unproven subscription mode, forced paid fallback | Unsupported/explicit policy decision, не credential workaround |

Для каждого execution gate отчёт следующего этапа должен назвать `passed / required`, commit/plan/candidate subject, exit status, skipped/unknown и blind spots. Source-level inspection настоящей задачи не заменяет эти результаты.

## 7. Оставшиеся решения и границы уверенности

**Решения для архитектора, не блокеры исследования:** конкретный authority delegation object; trust root и key provisioning; wire canonicalization/domain separation; stop/revocation freshness; policy-approved unattended execution; первый OS backend; supported model-provider mode. Для каждого рекомендован вариант выше, поэтому исследование можно передать на review без реализации и без чтения аккаунтов.

**Непроверенное:** ax implementation и внешняя curator-run implementation, native enforcement всех платформ, реальная полнота receipts, conformance всех Curator drivers, subscription account entitlements, benchmark скорости/качества роя, независимость модельных ошибок. Эти свойства нельзя выводить из документов, Go interface, schema success или названий тестов.

Source limitations и обнаруженные противоречия F1–F8 подробно указаны в [основном отчёте](260908_apiary-curator-contracts.md). Приложенный task-scoped handoff включает logbook находок и фактические validation exits.
