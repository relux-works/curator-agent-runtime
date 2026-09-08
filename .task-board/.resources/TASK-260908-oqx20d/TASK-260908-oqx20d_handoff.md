# Исследовательский handoff: TASK-260908-oqx20d

Материалы ready for review. В story worktree оставлены только два исследовательских документа, без commit/push. Нормативные протоколы, README и соседние репозитории не изменены.

## Результат

28 pinned репозиториев, 26 с фактическим выборочным чтением production-кода, 2 по README, 4 закрытых среды docs-only. Глубина: D2 — 14, D1 — 12, D0 — 2 pinned repositories. Все 8 осей сравнения присутствуют; 72 evidence files имеют SHA-256 и проверенные диапазоны. Это статическое исследование, не runtime/security audit.

Дополнительная директива учтена: OpenClaw (текущее собственное agent-core, legacy alias pi), Letta/Letta Code (переезд current source), deepagents (harness layering). DeepSeek Harness исследован по официальному источнику; scoped same-process composition явно отделена от authority separation Apiary.

Рекомендация: общий минимальный Go-oriented kernel, два Curator-defined профиля; model providers/credentials вне model-visible tools; MCP только во внешних wrappers; intent/result journal и unknown outcome reconciliation; ограниченный scheduler с упорядоченными receipts. Отвергнуты встроенный shell/Python хоста, импорт целого IDE/framework stack и ACP как прозрачный model API.

## Проверка и реальные коды выхода

- `python3 .temp/TASK-260908-oqx20d/validate.py` — exit 0; JSON, SHA, локальные source hashes, ranges, внутренние anchors, 8 matrix axes проверены. Лог validation-01.log.
- `git diff --check` — exit 0; сам по себе не покрывает новые untracked документы.
- `git diff --no-index --check /dev/null .research/260908_runtime-landscape.md` — exit 1, диагностик whitespace нет; новая file diff, не зелёный gate.
- `git diff --no-index --check /dev/null .research/260908_source-catalog.json` — exit 1, диагностик whitespace нет; новая file diff, не зелёный gate.
- Прямой Python assert отсутствия trailing whitespace в обоих документах — exit 0; validation-02.log.
- Source fetch scripts завершились exit 0; начальный GitHub API HTTP 403 записан как retrieval failure, восстановлен публичным Git transport. Успех скрипта не объявлен успехом каждого HTTP запроса.
- `task-board q 'schema(mutations=true)'` — exit 1 (неподдерживаемый schema scope); затем прочитан help. `task-board logbook --help` сообщил unknown command. Отдельный logbook CLI не найден. Записи logbook сохранены в отчёте и task-scoped scratch; board notes прикрепляют их.
- Никаких тестов сторонних runtime, build, benchmark или account-access экспериментов не выполнялось; D3 отсутствует.

## Входы и пределы

Исходный worktree commit da759b8f3d366f31e5bd42934f6b5ecd1d01ac3f. Origin/HEAD/dirty state apiary-docs, curator, curator-spec и skill-project-management записаны в каталоге; чужие board changes сохранены. Локальный paper читался из git show HEAD, не из чужого dirty состояния. Полнота архитектуры всех проектов, fsync, exactly-once effects и vendor entitlement для публичного роя не утверждаются.

Research paths: .research/260908_runtime-landscape.md; .research/260908_source-catalog.json. Snapshot/read logs: .temp/TASK-260908-oqx20d/. Все ссылки переносимы как pinned GitHub permalinks; private local input links требуют доступа к соответствующим repo.
