# Revision 2: ready for review

TASK-260908-2qhe31; role solution-architect; focused rework of revision 1 findings F1/F2 and host submission trace. No runtime implementation or normative v0.1 changes. Work remains uncommitted for managed handoff.

## Изменения и trace

- F1 → execution.md «Сильная идентичность candidate bytes»: concrete closed recursive SHA-256 manifest, raw commit metadata, qualified Git locator, M/R/I commitments, builder/verifier/materializer/publication ownership, content refusal vocabulary. Legacy SHA-1 Git supported only as locator. Submodules/LFS expansion deferred with explicit refusal. Wire/evidence JSON, WorkspaceRef, TCB и migration согласованы.
- F2 → execution.md «L0 publication gateway и recovery»: local authoritative repo за sole fenced writer, kernel-held lock/no TTL takeover, no surviving detached writer, durable exact-tuple intent в authority sequencer, три отдельных durable шага, no-rewind/no-next-writer barrier и конкретная crash table. Remote mirror — отдельный effect с unknown limitations. Post-permit stop не отменяет in-flight syscall; новый contract не становится integrated историческим receipt.
- Workflow trace → execution.md «Host-controlled seal»: host lifecycle закрывает mutations, executor создаёт R/C(R)/SnapshotReceipt, node-signer сам строит Submission, host outbox вызывает SubmitCandidate; terminal text не acceptance. Central остаётся exec/poll/cancel; core без новых tools.
- task-integration и process-trust source/SVG отражают нового единственного publication writer. Остальные семь diagram pairs побайтово сохранены; unrelated chapters сохранены. Diagram README содержит команды узкого rerender; root README/UNRESOLVED_QUESTIONS не изменены.

## Узкий adversarial self-review

Ниже 14/14 перечисленных design scenarios имеют явный ответ в предложенном контракте. Это разбор контрсценариев по тексту и последовательностям, **не** исполняемые runtime tests и не независимый accept verdict. Runtime probes выполнено 0. Будущие V11/V19/V20/V21 обязаны проверить реальные entry points.

| Контрсценарий | Ответ revision 2 |
|---|---|
| Same Git locator, different blob bytes | C(X) включает SHA-256 фактических bytes; materializer и gateway пересчитывают closure |
| Same locator, changed path/type/mode/symlink | Полное sorted raw-byte path enumeration и closed entry fields; verifier не ограничивается diff |
| Same locator, changed commit metadata/signature | Full raw commit bytes SHA-256 включён; подпись после freeze создаёт иной candidate |
| Missing content digest / unsupported object format | Закрытые distinct refusals; no OID fallback |
| Unclosed submodule/LFS / checkout filter | Baseline refusal; network/filter expansion запрещена |
| r3/stop/term before permit, M unchanged | Journal admission сериализован с transition; stale request отказывает независимо от Git CAS |
| Stop after permit, delayed dispatch | Только ранее admitted historical intent; bound dispatch admission, no instant completion claim; drain observation отдельно |
| Crash before intent / after permitted before marker | Successful journal absence допускает fresh request; reserved no-dispatch successor завершает not_applied/expired, не наследует старый permit |
| Crash after marker, unknown CAS result | Barrier + sole writer + exact ref/strong bytes: M not_applied, I applied; no blind CAS retry |
| Applied before receipt / durable receipt reply lost | Durable Git verification затем journal receipt; retry выдаёт тот же receipt |
| Other ref/read failure/unproven fence | outcome_unknown и retained barrier; no ancestry guessing; OS lock не заменяется heartbeat |
| Remote mirror timeout | Отдельная uncertainty; generic remote Git не выдаётся за protocol-fenced authoritative sink |
| Model says complete while effects pending / late exec | Host Seal barrier, pending unknown refuses; terminal text не принимает задачу |
| Foreign/stale seal receipt, signer retry after disconnect | Receipt/assignment/contract binding, signer-owned envelope, stable seal/submission/request IDs; no new candidate on retry |

Допущения специально ограничены L0: trusted host/root/storage, единственный writer, no rewind, qualified ref durability, immutable candidate store, SHA-256 collision resistance. Нарушение этих допущений не объявляется обнаружимым всегда: скрытый admin rewind может разрушить reconciliation proof. Для hostile/distributed sink нужен отдельный qualification contract.

## Проверка артефактов

Самостоятельно повторены только затронутые проверки:

- `python3 .temp/architecture/validate.py`: exit 0; 16/16 frozen input hashes, 58 own links, 36 pending research mappings, 6/6 JSON blocks, 9/9 SVG XML. Research files проверены через immutable manifest, не объявлены существующими в combined tree. Source survey не повторялся.
- `python3 .temp/rework-rev2/verify-delta.py`: exit 0; 12 changed / 28 authored files, 16 unchanged; 4/4 own anchor links; qualified Git locator format checks. Архитектурные изменения локальны F1/F2/trace и их navigation/logbook.
- PlantUML render изменённых двух sources: exit 0. `rsvg-convert` PNG: exit 0. Оба PNG непосредственно просмотрены. Первый task sequence был чрезмерно узко перенесён; maxMessageSize исправлен, повторный SVG/PNG просмотрен: подписи читаемы, нет clipping/overlap. Process view показывает main write только у gateway.
- Остальные семь unchanged diagram views и общий исходный research synthesis принимаются из attached producer/reviewer revision 1 evidence; повторного visual/source audit не заявляю.
- `git diff --check`: exit 0; scoped validator отдельно проверяет whitespace новых untracked docs. Runtime/crypto/benchmarks не запускались, implementation отсутствует.
- Нормативные protocol/schemas/ADRs, root README, sibling repos и research inputs не изменены; ни commit/push/land, ни tool installation/config mutation не выполнялись.

Inventory SHA-256 и evidence ZIP относятся к authored bytes до handoff; exact candidate tree назначит managed handoff. Revision 1 verdict остаётся отдельным immutable review input. Новый пакет не перезаписывает старые evidence.

## Logbook

- Query `resources(...)` отказал как unknown operation; восстановлен documented `get(...) { outcomeResources }`. Ничего не трактовалось как отсутствие данных. Повторного broad source survey не было.
- Directives checkpoint: no directives, run not goal-bound. Explicit role forbids child agents; работа выполнена inline.
- Решения F1/F2 приняты в предоставленной архитектурной автономии. Незакрытых human decisions для этой доработки нет. Future grammar/vector freeze и runtime qualification остаются будущими работами, не объявлены выполненными.
- Checklist «Implementation matches AC» читается здесь как соответствие design deliverable AC; «Tests green» относится только к применимым artifact checks, не к отсутствующему runtime. Независимый reviewer должен принять exact revision 2 или вернуть bounded findings.
