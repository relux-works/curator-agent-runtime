# Журнал исследования TASK-260908-1ir76l

Дата: 2026-09-08. Изменения только в назначенных `.research/` и `.temp/`; siblings сохранены. Нормативные протоколы, README, конфигурация board и shared skills не изменялись.

- Установлено по Apiary `e4249a6193c0f2730e7cffaea6b4907c0a7e80a9`, `paper/paper.tex`: plan digest — bindings/grants/limits, отдельно от command digest. Предложен committed bounded grant с локальной durable budget reservation, а не quorum на каждую sandbox-команду.
- По XEP-0198/0184 отделены transport acknowledgement, delivery receipt, durable domain receipt, execution admission и candidate acceptance. XEP-0359 наблюдался как Experimental 0.7.0; origin-id не источник authority.
- Отзыв при partition требует отказа в новом admission либо заранее объявленного окна Δ + ε. Для уже допущенного действия отдельно учитывается D/forced stop. Мгновенный global halt не заявлен. Ownership операции и бюджет привязаны к executor generation; unknown effect не переносится автоматически на нового executor.
- Go-проход: Crush — per-session admission/cancel и best-effort hook seam; ADK-Go — typed iterators, partial/final boundary, provider-shaped genai types; Eino — immutable WithTools, stream ownership. Это статические наблюдения, не security audit.
- Kimi CLI README сообщает переход к Kimi Code CLI, несмотря на archived=false. Преемник проверен по canonical API/README на отдельном SHA; source parity не приписывается. Hermes loop прослежен через facade к phases; lease internals не исследованы.
- Директива parent прочитана: полная provider entitlement матрица принадлежит TASK-260908-39n05p. В этом отчёте оставлена узкая credential-boundary оговорка, без дополнительной матрицы.
- Прочитан OPENDEV v1: принята идея параметризованного общего агента и управления context; safety rhetoric статьи не считается доказательством независимых enforcement layers. Числа benchmarks не переносились на Apiary.
- Web/RFC tool timeout для RFC 6120 устранён прямым чтением официального `.txt`. Старые URL LangGraph, NATS и CometBFT перенаправлялись: реальный destination записан; нерелевантный landing не считается источником исходной гарантии. Для CometBFT/OCI взяты pinned repository documents.
- Capability paper: USENIX legacy URL — 404, erights — network unreachable/timeout. Статья получена из Agoric paper archive; PDF hash записан. Неиспользованные ошибки сохранены в каталоге, отсутствие не выводилось из неуспешного чтения.
- Preliminary anchor probe обнаружил четыре превышения диапазона строк; они исправлены до assertion validation. Probe был диагностикой, не успешным gate.
- `command -v logbook` вернул **exit 1**: отдельный CLI не найден. Поэтому журнал сохранён task-scoped файлом и прикрепляется как outcome; routine activity files board не редактировались.
- `python3 .temp/TASK-260908-1ir76l/validate.py` — **exit 0**, проверены hashes, anchor bounds и соответствие каталогу, существование локальных document links. Результат `.temp/TASK-260908-1ir76l/validation-01.json`.
- `git diff --check` — **exit 0**. Новые untracked документы дополнительно проверяются validator, поскольку обычный git diff не проверяет их содержимое.

Команды fetch/read helpers завершились exit 0; отдельные HTTP failures внутри batch отражены как errors в index/catalog и не считаются успешным retrieval. Тесты скачанных проектов, transport deployment, fault injection, accounts, credentials и paid inference не запускались. В отчётах нет скопированных source files или prompt dumps; исходные snapshots находятся только в scratch.
