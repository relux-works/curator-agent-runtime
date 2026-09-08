# Архитектурный review revision 1

- verdict: changes_requested
- repeat-of: none
- task: TASK-260908-2qhe31
- CR: CR-TASK-260908-2qhe31-1, revision 1
- base: ef98d6d4a79bc2ed09a3e82fb73a4019f0b81807
- candidate tree: 679a9e2f1a4d03233f175243fbb30f14543c5a03
- reviewer run: RUN-260908-4b2236
- routing: analysis (доработка архитектуры, не runtime implementation)
- repository_delta: present; 28 новых файлов документации/диаграмм. Reviewer deliverables не изменял.

## Вердикт

Нужны две ограниченные архитектурные доработки. Основной дизайн пригоден как база: общий reducer, отдельные authority/execution/credential domains, честный command-oriented central, remote WorkspaceRef, ModelPort/AgentBridge, unknown effects и XMPP acknowledgements описаны содержательно. Broad research повторять не требуется. Отсутствие frozen research на main не является finding.

### F1 — high: Git object identity не определяет сильную identity проверенных bytes

repeat-of: none

Shape: Forged or self-minted evidence; absent evidence treated as satisfied.

Локализация: docs/apiary/authority-wire.md:49–55; docs/apiary/execution.md:54–62, 69–79; docs/apiary/tool-skills.md:81–94.

Candidate/acceptance связываются с M/R/I/tree, а JSON использует голые 40-hex commit identifiers. Общая декларация SHA-256 для domain envelopes/artifacts не задаёт Git object format и не требует отдельного сильного digest содержимого Git-кандидата. SHA-256 подписанного envelope с SHA-1 OID внутри не усиливает SHA-1 transitive tree/blob identity. Подпись commit bytes также не меняет алгоритм embedded tree/blob references.

Контрсценарий design probe GIT-IDENTITY: два разных content sets имеют одинаковую legacy Git reference identity в атакуемой SHA-1 области. На review предъявлены bytes A, при materialization/tests/publication — bytes B. Сравнение перечисленного tuple и signature envelope не обязано различить их: независимый SHA-256 content commitment в обязательном tuple отсутствует. Это анализ контракта; collision exploit здесь не генерировался и runtime failure не заявляется.

Требуемая правка: явно различить Git locator `{object_format, oid}` и strong content identity. Выбрать baseline: требовать qualified SHA-256 Git repository с проверкой recursive objects либо поддержать legacy Git посредством однозначного SHA-256 manifest/closure проверяемых bytes (paths/modes/types/content и relevant commit metadata). Не хешировать только строку OID или корневой SHA-1 tree object. Назвать владельца построения и проверки, момент повторной проверки при materialization/test/landing, связать identity с Candidate/attestations/Acceptance/receipt. Обновить representative JSON и migration; unsupported/mismatched object format и отсутствующий content commitment должны иметь явный отказ. Добавить named future negative probe, сохраняющий Git locator при изменении strong content commitment.

### F2 — high: publication boundary не связывает journal authorization и Git CAS достаточно точно

repeat-of: none

Shape: Bypass path around the check; check present but uncalled from production (в данном случае отсутствующая привязка в предложенном publication flow).

Локализация: docs/apiary/execution.md:60–62, 98; docs/apiary/migration-conformance.md:23; diagrams/apiary/task-integration.puml:23–32 и SVG.

Текст честно признаёт unknown после push и запрещает угадывать успех по ancestor alone. Однако retained «атомарная интеграция» описана как current acceptance check → Git CAS M→I → durable receipt. Не определены durable publication intent/его владелец, сериализация acceptance/contract/stop с publication permission, sink enforcement этого permission и правила recovery между тремя хранилищными событиями. Общий WAL описан как executor-owned; runner — другой principal. Не задано, как именно publication runner использует этот WAL/permit и как Git sink отвергает старый publisher. Git CAS проверяет M, но не contract revision, stop generation или authority fence.

Контрсценарий PUB-STALE: runner проверил acceptance r2; затем authority committed r3 (либо revoke/stop), M не изменился; runner выполняет CAS M→I. Проверка старого acceptance не защищает Git mutation. Если предполагается, что ранее committed publication permit легализует поздний effect, нужен именно такой durable record и его точка линеаризации/срок/семантика; существующая диаграмма передаёт Acceptance непосредственно в CAS.

Контрсценарий PUB-CRASH: push применён, receipt не записан, runner перезапущен/сменил owner. Документ предлагает ref/reflog/server receipt как альтернативы, но не выбирает доступный authoritative evidence source и обязательный retention/sole-writer/no-rewind contract. Current ref=I сам по себе не связывает наблюдение с конкретным integration intent; дальнейшее продвижение или возврат ref создаёт дополнительную неопределённость. Запрет blind retry полезен, но не завершает implementable recovery contract.

Требуемая правка: выбрать небольшой механизм для L0 и назвать его assumptions. Например, fenced publication gateway с durable exact-tuple intent до dispatch, единственным разрешённым ref writer и authoritative результатом; либо иной явно обоснованный sink contract. Разделить local journal transaction, Git CAS и receipt completion — не называть их общей atomic transaction. Дать crash table: до intent / после intent до CAS / CAS ambiguous / CAS applied до receipt / receipt persisted; для каждого назвать owner, разрешённый retry/reconcile и основание established/unknown. Показать остановку/смену contract/term и delayed publisher. Синхронизировать prose, migration и task-integration diagram. Нельзя заменить этот пробел новым неподтверждённым exactly-once обещанием.

## Coverage и контрсценарии

Проверена 1/1 сформулированная AC; полностью удовлетворены 0/1 из-за F1/F2. Десять producer acceptance groups имеют 10/10 artifact mappings, но это navigation coverage, не semantic conformance. Runtime driving tests: N/A для design-only leaf; выполнено 0, как и заявлено producer. Вместо выдуманного runtime прогона выполнены 18/18 перечисленных ниже design probes; 16 имеют достаточный архитектурный ответ, 2 выявили findings. Это конечная выборка, не exhaustive security audit.

| Probe | Counter-scenario | Результат / поверхность |
|---|---|---|
| P01 | Orchestrator model сам меняет permissions/ledger | Явно отказано; kernel authority/task-board sections |
| P02 | Один tool прячет arbitrary admin RPC/signing | central только exec/poll/cancel, sandbox ceiling; tool-skills |
| P03 | Worker без checkout получает fake local root | Remote WorkspaceRef и version refusal; tool-skills |
| P04 | Same binary означает общий credential domain | Отдельные processes/principals, полный TCB; kernel + process-trust |
| P05 | Co-install/plugin update меняет live catalog | Selected binding, immutable epoch/drain; tool-skills + activation |
| P06 | Valid partial JSON при terminal length исполняется | Запрещено до successful terminal; models-context + worker-turn |
| P07 | Lexical path check выдаёт symlink-safe guarantee | Lexical unknown отдельно от backend confinement; tool-skills/execution |
| P08 | Whole-agent subscription bridge выдаётся за ModelPort | Separate compatibility profile, no strict parity claim; models-context |
| P09 | Fallback меняет tenant/sink или missing usage=0 | Route admission/epoch и unknown reserve; models-context |
| P10 | Signer подписывает произвольный Grant/bytes | Typed claims, signer roles, no raw signing; authority-wire |
| P11 | Timeout/reconnect/new call ID повторяет unknown effect | Stable operation ownership, no blind retry; execution + recovery |
| P12 | Cancel успешен после реального success / restart оживляет handle | Actual terminal, generation/session_lost; execution |
| P13 | Partition/old term/heartbeat восстанавливает полномочия | Strict-online bounded permit, explicit resume, fencing; authority-wire/failover |
| P14 | SM ack заменяет admission; URL заменяет artifact integrity | Раздельные durable domain acks и digest validation; wire/XMPP |
| P15 | Path-disjoint rebase переносит review / distinct keys доказывают independence | Новый I требует новый evidence; enrollment assumptions; execution |
| P16 | Summary/cache/recovery повышает untrusted data или corrupt row=absence | Provenance, exact projection head, quarantine; models-context |
| GIT-IDENTITY | Locator заменяет strong candidate content identity | F1 |
| PUB-STALE/PUB-CRASH | Git CAS выполняется вне связанного authority/publication recovery contract | F2 |

Future conformance V01–V18 названы и включают narrowing cases; они честно не объявлены исполненными. Недостающие GIT-IDENTITY и publication crash/authority cases следует добавить к соответствующим строкам, а не переписывать весь каталог.

## Независимая проверка артефактов

- 16/16 frozen input hashes сверены с manifest. Использованы все inputs как evidence/index/reference surfaces; чтение исходных donor repositories заново не выполнялось. Сохранены outlines и targeted contract excerpts; это не заявление полного повторного аудита источников.
- 28/28 worktree authored files побайтово равны точному candidate tree через `git show`.
- Независимый scoped validator: 54 own links разрешены, 36 pending research references mapped, 6/6 JSON blocks parse, 9/9 SVG XML parse. Ссылки на pending research не объявлены существующими.
- `git diff --check BASE TREE`: exit 0.
- Все 9 candidate SVG непосредственно преобразованы установленным rsvg-convert с белым background и визуально проверены. Clipping/overlap, мешающих чтению, не обнаружены. PlantUML sources не перерендеривались и не изменялись. Quick Look дал квадратные обрезанные thumbnails; эти thumbnails не приняты как доказательство дефекта SVG, использован rsvg-convert.
- Producer runtime/model/benchmark claims не принимались: таких проверок producer не заявляет. Source rendering CLI success принимается из producer evidence; собственная visual QA выполнена над candidate SVG.
- Existing protocol/schemas/ADRs/root README и sibling repos не изменены. Navigation/combined-tree QA остаётся consolidation leaf.

## Logbook review

2026-09-08: запрос board с неизвестным полем resources отказал; исправлен на outcomeResources. Read failure не трактовался как отсутствие outcome. Run не goal-bound (`spawn goal`: none); directives отсутствовали. F1/F2 требуют архитектурной доработки владельцем solution-architect, не human decision и не stop-the-line. После outcome attachment задача маршрутизируется в analysis; accept_cr не вызывается. Чеклисты semantic acceptance не отмечаются выполненными.
