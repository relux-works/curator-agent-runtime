# Исследовательская передача TASK-260908-1ir76l

Статус передачи: **ready for review**. Дата: 2026-09-08. Parent владеет review, checkpoints, commit и публикацией.

## Материалы

- [Протоколы, grants/leases/fencing, неизвестные эффекты, XMPP и границы изоляции](TASK-260908-1ir76l_protocol-literature.md).
- [Go и дополнительные harnesses](TASK-260908-1ir76l_go-and-additional-harnesses.md).
- [Pinned evidence catalog](TASK-260908-1ir76l_source-catalog.json).
- [Журнал значимых наблюдений и ограничений](TASK-260908-1ir76l_logbook.md).
- [Результат проверки документов](TASK-260908-1ir76l_validation.json).

Repository deliverables: `.research/260908_protocol-literature.md`, `.research/260908_go-and-additional-harnesses.md`, `.research/260908_protocol-source-catalog.json`. Новые файлы оставлены uncommitted в назначенном story worktree. В resource-копиях изменены только относительные ссылки на соседние resource filenames с task prefix; основное содержание идентично.

## Основные результаты

Предложены bounded committed grant вместо quorum на каждый обычный tool call, строгий admission при неизвестной freshness, отдельно оговорённое lease-окно, executor-generation ownership и запрет слепого retry неизвестного effect, transport-neutral envelope и отдельная domain acceptance. L0/L1/L2 разделены без новой consensus implementation в agent kernel. MCP остаётся во внешних Curator-installed wrappers, provider credentials — вне tool-skills.

Прочитаны 11 pinned repository snapshots на разной явно указанной глубине (включая reference specifications и повторный source fetch mini-SWE/LangGraph), 36 использованных document entries. Это не exhaustive survey и не runtime security audit. Kimi CLI successor проверен только по README. Provider matrix оставлена отдельной задаче TASK-260908-39n05p согласно директиве parent.

## Проверки и реальные exit codes

- `python3 .temp/TASK-260908-1ir76l/validate.py`: **0**, 38 source permalink occurrences, catalog/hash/line bounds, relative links, завершающий newline и отсутствие trailing whitespace в Markdown. Повтор после добавления whitespace assertions также **0**.
- `git diff --check`: **0**; untracked research content проверен предыдущим validator, не этим git check.
- `command -v logbook`: **1**, CLI отсутствует; task-scoped журнал сохранён и прикреплён.
- Preliminary anchor probe нашёл четыре неверных верхних line bounds; они исправлены перед assertion validation. Probe не назван passing gate.
- Fetch helpers: process exit **0**, но индивидуальные HTTP errors/redirects сохранены как неуспешные или неиспользованные источники. Их нельзя трактовать как successful source read.

Скачанный код, тесты внешних проектов, account access, credential inspection, платные model calls, transport deploy и fault injection не выполнялись. Предлагаемые отрицательные сценарии будущей реализации перечислены в основном отчёте; их результат неизвестен.

## Указания reviewer

Проверить actual candidate diff и точные source anchors; особое внимание — семантика I1/I8 при partition, transfer/fencing граница внешнего sink, отсутствие exactly-once overclaim, XEP-0359 Experimental, A2A MAY idempotency и различение ACP. Статические findings не заменяют production proof. Нормативные siblings не изменены.
