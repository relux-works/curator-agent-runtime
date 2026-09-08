# Архив плана и трассировка требований

[Первоначальный снимок](260908_022239_epic-260908-230hv2.md) восстановлен побайтово из сохранённого `task-board plan` от 2026-09-08 02:22:39 +04:00. Он отражает начальные три research Story, а не сегодняшнюю структуру или завершение всего epic. [Обновлённый снимок](260908_065026_epic-260908-230hv2.md) получен командой `task-board plan EPIC-260908-230hv2 --save` при сборке документации; фазы вручную не переопределялись.

## Фактические результаты на момент сборки

| Область | Задача / состояние | Документальный результат |
|---|---|---|
| Основные harnesses | TASK-260908-2x6kuv, done | [Claude lineage](../.research/260908_claude-lineage.md), [Codex/Pi](../.research/260908_codex-pi.md) и две исследовательские схемы |
| Ландшафт и протоколы | TASK-260908-1ir76l, done | [Ландшафт](../.research/260908_runtime-landscape.md), [Go](../.research/260908_go-and-additional-harnesses.md), [протоколы](../.research/260908_protocol-literature.md), два JSON-каталога |
| Контракты и providers | TASK-260908-39n05p, done | [Контракты](../.research/260908_apiary-curator-contracts.md), [providers](../.research/260908_provider-portability.md), evidence/logbook и D01–D36 |
| Архитектура | TASK-260908-2qhe31 rev2; принята RUN-260908-4c245d, integrating | [Карта](../.spec/apiary-runtime-design.md), семь глав, девять схем; checkpoint `7da174638fa1061e05774c151166d5f7356713c1` |
| Сборка документации | TASK-260908-q8pkiz; независимый review и интеграция ещё требуются | [README](../README.md), [открытые вопросы](../UNRESOLVED_QUESTIONS.md), [сверка provenance](../docs/apiary/current-inputs.json), combined-tree QA evidence на board |

Combined-tree исходная точка этой сборки — `14a01125574f1f4de0e5fe575b65e71a747df2d0`. Архитектурный checkpoint и candidate trees исследований обозначают разные стадии происхождения; они не являются новым опубликованным release. Этот leaf и весь epic здесь не объявлены поставленными.

## Краткая requirement-to-document trace

Сопоставление следует полному acceptance brief EPIC-260908-230hv2. Подробная исходная трассировка — [D01–D36](../.research/260908_requirements-map.md); архитектурные retain/change/reject решения имеют приоритет над исследовательскими предложениями.

| Требование brief | Где раскрыто |
|---|---|
| Reading guide, vision, статус v0.1 / proposal | [README](../README.md), [executive map](../.spec/apiary-runtime-design.md) |
| Source landscape, pins, depth, evidence → invariant → decision | [Evidence](../docs/apiary/evidence.md), research catalogs из README |
| Общий Go core, worker/orchestrator, порты, процессы, TCB | [Kernel](../docs/apiary/kernel.md), context/process/core diagrams |
| Package/tool-skill contract, admission, installation, epoch, один central | [Tool-skills](../docs/apiary/tool-skills.md), activation diagram |
| Provider adapters отдельно от tools; credentials, subscription, context | [Models/context](../docs/apiary/models-context.md), [provider research](../.research/260908_provider-portability.md) |
| Transport-neutral identity/signature, XMPP, replay/fence/acks/artifacts | [Authority/wire](../docs/apiary/authority-wire.md), reconnect/failover diagrams |
| Executor, sandbox, runner, board adapter, exact review/test/integration | [Execution](../docs/apiary/execution.md), [task-board adapter](../docs/apiary/kernel.md#task-board-adapter), task integration diagram |
| WAL uncertainty, operation/call/message/process IDs, cwd/env/cancel/restart | [Execution](../docs/apiary/execution.md), [identity table](../docs/apiary/authority-wire.md#идентичности-не-взаимозаменяемы), recovery diagram |
| Security/assurance, независимость, подпись не truth; lexical vs real FS | [Kernel TCB](../docs/apiary/kernel.md#полный-tcb), [migration](../docs/apiary/migration-conformance.md), [tool-skills](../docs/apiary/tool-skills.md) |
| Remote WorkspaceRef без фиктивного checkout; normative ownership | [Tool-skills](../docs/apiary/tool-skills.md#workspaceref-без-локального-checkout), [roadmap](../docs/apiary/migration-conformance.md#владельцы-контрактов-и-последовательность-работ) |
| F1 strong content identity, F2 publication authority/recovery | [Execution](../docs/apiary/execution.md), V11/V19/V20; candidate signing не publication permission |
| Future conformance/evaluation, риски и реальные открытые входы | [V01–V21 и E1–E8](../docs/apiary/migration-conformance.md), [владельцы и evidence закрытия](../UNRESOLVED_QUESTIONS.md) |
| Focused source/rendered diagrams | [Полный атлас](../diagrams/README.md) |

## Журнал согласования

2026-09-08, TASK-260908-q8pkiz: сохранены содержательные решения accepted rev2. Исправлены устаревшие missing-research placeholders и направление ссылки на Seal/Submission; V19–V21 присоединены к одной таблице. В models/context, kernel и migration уточнено: candidate commit signing — отдельный сервис runner, main/ref write authority — только publication-gateway; contributor signing и mirror credentials имеют отдельные scopes. Исходные research hashes не переписаны: удаление одного LF в Claude lineage отражено отдельной записью текущего происхождения. Нормативные v0.1, research bodies и байты diagram pairs сохранены. Это редакционные уточнения принятого дизайна, не новые архитектурные решения.
