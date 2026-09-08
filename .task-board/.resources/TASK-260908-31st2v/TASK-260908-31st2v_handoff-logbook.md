# TASK-260908-31st2v: передача исследования на review

Дата: 2026-09-08, Asia/Tbilisi (источники читались вечером 2026-09-07 UTC). Роль: researcher. Исходные GitHub repositories получены отдельными clones; чужие sibling changes сохранены. Реализация, нормативные протоколы, README, конфигурация и shared skills не изменялись. Ручных commits/push/landing не было.

## Результаты

Два русскоязычных документа оставлены без commit в назначенном Story worktree. Для resource CRUD их побайтовые копии созданы вне managed worktree. Основной отчёт содержит pinned code paths, current Apiary paper/book, источники C/S/P/R и их ограничения. Карта содержит 36 решений retain/change/reject, рекомендации migration, identity boundaries и будущие negative gates.

| Файл исследования | Outcome resource | SHA-256 |
|---|---|---|
| 260908_apiary-curator-contracts.md | TASK-260908-31st2v_apiary-curator-contracts.md | `59563bae31206892a38f8e4bd79da5287ccb8ca40347e5d3a2ddea9eb720e824` |
| 260908_requirements-map.md | TASK-260908-31st2v_requirements-map.md | `5608cb6f3b5d2fd25d89fc9f066a11381a361f45cb34d06d4b8049545f9c5b78` |

## Фактические проверки

| Команда / действие | Exit code | Результат и граница |
|---|---:|---|
| `task-board m 'set_status(TASK-260908-31st2v, status=analysis)'` | 0 | Начало researcher lifecycle |
| `git clone --depth 1 --no-tags https://github.com/relux-works/<repo>.git <snapshot>` для A/C/S/P/R | 0 для каждого | Получены пять изолированных snapshots; никакой cloned code не исполнялся |
| `python3 .temp/TASK-260908-31st2v/write_reports.py`, первая попытка | 1 | Ошибка exact-anchor lookup в собственном генераторе: ошибочно удвоенная фигурная скобка; исправлена; это не source gate failure |
| Тот же generator после исправления | 0 | Записан основной отчёт |
| `python3 .temp/TASK-260908-31st2v/write_requirements.py` | 0 | Записана карта 36 решений |
| `python3 .temp/TASK-260908-31st2v/validate_reports.py` | 0 | UTF-8, таблицы, 120 source permalink instances, line existence и SHA, 36/36 decision rows, unchanged snapshots; это не semantic proof каждого утверждения |
| `git diff --check` | 0 | Whitespace gate для tracked diff; новые файлы дополнительно проверены собственным document checker |
| Побайтовое сравнение research/outcome copies | 0 | Идентичны до attachment |

Никакие Go suites, native sandbox tests, сборки пакетов, benchmark и `integration-fragment-model.py` не запускались. 1090 состояний указаны исключительно как опубликованный результат авторов paper, не как результат этого run. Source-level проверки вызовов и ручное сопоставление первичных текстов отделены в документах от inference/design.

Scratch logs: `.temp/TASK-260908-31st2v/clone-*-01.log`, `reports-validation-01.log`, `diff-check-01.log`, `*-readiness-01.log`, `source-revisions.json`. В JSON время означает момент фиксации inventory после retrieval, а не точную секунду HTTP/Git получения. В exploratory search были обращения к отсутствующим предполагаемым путям (`pkg/query`, `pkg/board/query/schema.go`, `internal/skillcheck/check.go`, корневой `go.mod` P); они не трактовались как отсутствие функциональности — поиск продолжен по найденным source paths.

## Logbook значимых находок

Отдельный `logbook` CLI/connector в этом run не найден; находки сохранены здесь как task-scoped logbook outcome, а не в transaction-owned activity stream.

- **L1 / высокий приоритет.** C production `resolveCLIProvider` возвращает nil; Darwin `NewOSBoundary` отказывает без lossless provider. Verified contract существует, native capability в этом distribution не установлена. Источники и migration: основной отчёт §4.3, D28/D30.
- **L2 / высокий приоритет.** `scriptpolicy.Admit` безусловно отказывает для enforced script. Parser acceptance не execution capability; не выдавать это за работающую sandbox policy. §4.1, D29.
- **L3 / высокий приоритет.** Task-board Reparent сохраняет accepted CR при path-disjoint advance; Apiary exact-I review этого не допускает. Требуется новый candidate и review. §5, D21/D22.
- **L4 / высокий приоритет.** Apiary book предлагает daemon binaries внутри skill; S assurance §6 требует отдельно установленный operator-owned provider. Разделить client skill и host distribution. §4.3, D31.
- **L5 / высокий приоритет.** One central tool не ограничивает union authority. Нужны branch-specific contracts и task ceiling; service transport остаётся необходимым. §6.2, D16/D18.
- **L6 / высокий приоритет.** Literal parent-tool subset не подходит orchestrator→worker без выдачи orchestrator shell. Рекомендовано separate executable/delegable authority с versioned migration. §6.3, D09.
- **L7 / высокий приоритет.** Runtime at-most-once не определяет crash/unknown effects; deterministic extractor не может физически разрешать symlinks. Предложены durable invocation state/reconcile и trusted handle-based backend. §7, D05/D06/D10.
- **L8 / средний приоритет.** Book front ещё упоминает вторую редакцию; ch07 example ставит candidate перед freeze, в отличие от правила; random fencing token и monotonic fencing counter смешиваются. §10 F4–F6.
- **L9 / высокий приоритет.** Subscription entitlement не следует из владения token. Прочитаны официальные OpenAI auth/App Server и Anthropic legal pages; account access не выполнялся. §8.
- **L10 / средний приоритет.** Curator ADR0013 остаётся Proposed, а environments описывает launch fragment contract; внешняя реализация curator-run/ax этим исследованием не подтверждена. §4.2.
- **L11 / средний приоритет.** CCJ-1 не поддерживает float, portable tool schema допускает number: wire/hash encoding нуждается в явном решении; нельзя выдавать canonical JSON за однозначный формат без domain/числовых правил. §6.1.

## Проверка покрытия задания

Current paper/book и exact revisions mapped; существующее и proposed разделены; resolve/build/install/launch/capabilities/assurance traced по названным source functions; P task/ownership/lease/CR/review/integration/goal semantics сопоставлены; worker/provider credentials разделены; MCP вынесен из core; конфликты и rejected alternatives описаны; Go module границы предложены. Директива parent о crash semantics, paths, central authority, old-epoch results, components и разных epoch/identity учтена в §6–7 и карте.

Ограничения: не аудит всех репозиториев и платформ; ax/curator-run implementation не прочитана; native guarantees/реальные entitlement accounts не проверены. Нет объективного блокера для передачи исследования на review. Решения следующей спецификации перечислены, implementation не выполнялась.

Ready for review.
