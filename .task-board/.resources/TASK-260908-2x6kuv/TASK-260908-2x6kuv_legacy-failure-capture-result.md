# Захват ошибки legacy revalidation

Дата: 2026-09-08. Задача: TASK-260908-2x6kuv, claude-code-lineage.
Story: STORY-260908-1l3m6n. CR: CR-TASK-260908-2x6kuv-1, revision 1.
Назначение: один легитимный запуск integration без исправления принятого кандидата.

## Реальный результат

Из control root `/Users/iv/Developer/ReluxWorks/curator-agent-runtime` ровно один раз запущено:

```sh
task-board worktree integrate STORY-260908-1l3m6n --cr TASK-260908-2x6kuv --revision 1
```

Процесс завершился с **exit code 1**, typed refusal **revalidation_failed**.
Выполненная самим CLI проверка `git diff-tree --check HEAD` завершилась с **exit code 2**:
`.research/260908_claude-lineage.md:216: new blank line at EOF.`
Это ожидаемая проваленная проверка, не успешная validation. Повторного integration не было.
Полный вывод сохранён в приложенном `TASK-260908-2x6kuv_legacy-failure-capture.log`.

CLI назвал candidate tree `52d0c4a7f7fd335c2cdf737628e5b2daab9fbe15` и materialized commit в выводе gate `74322a1ac34aab1c8272e659425f83ebc0841eae`.
По сообщению CLI trunk и board status не изменены, integration phase не открыта.
Последующая команда `task-board worktree transaction show STORY-260908-1l3m6n` (exit 0) подтвердила отсутствие transaction.
`task-board q --format compact 'get(TASK-260908-2x6kuv) { status }'` (exit 0) показала `integrating`.
`task-board worktree status STORY-260908-1l3m6n --json` (exit 0) показала CR revision 1 в состоянии `accepted`, kind `story_final`, candidate tree, совпадающий с отказом выше, и Story tip `cf02d5974d7b2b37ae337be81d519cdc08f83119`.

## Граница доказательства сохранения Validation

Установленная версия проверена: `task-board --version` (exit 0) — `0.24.3-307-g8bb4ef7c`, commit `8bb4ef7c`, built `2026-09-08T01:44:10Z`.
Прочитанный установленный lifecycle contract указывает, что completed failed integration revalidation сохраняет Validation с tree, suite digest, exit status, timestamp, materialized commit и `revalidation_revision`.
Однако `worktree status --json` этих полей не раскрывает. Независимое чтение persisted Validation в этом run не получено: наличие сохранённых `revalidation_revision=1` и текущего suite digest **не проверено**. Нельзя выдавать вывод отказа за проверку содержимого записи. Совпадение текущего candidate tree с деревом фактически выполненной проверки подтверждено публичным CLI.

## Сохранность и последующий маршрут

Файлы исследования, index, конфигурация suite и записи board вручную не изменялись. Исходный `git status --short` (exit 0) показывал только untracked `.research/260908_claude-lineage.md`; содержимое не исправлялось. Новых коммитов, подписей, push и публикации нет. Generic handoff не вызывался, как требует integration assignment.

Прочитано ранее приложенное свидетельство sibling checkpoint revision 2: оно сообщает commit `cf02d5974d7b2b37ae337be81d519cdc08f83119` и успешную проверку подписи в предыдущем run; эта проверка здесь не повторялась. Research и source review также не повторялись.

Следующий шаг принадлежит parent/operator после завершения этого run: выполнить документированный `worktree invalidate-acceptance` с реальной operator identity. Его проверка matching Validation должна либо принять сохранённые данные, либо вернуть точный отказ. Этот run не запускал invalidation, не подменял identity и не расходовал дополнительные попытки. Затем parent маршрутизирует минимальную EOF-правку и новый review.

## Диагностика вспомогательных команд

Первая идемпотентная `set_status(..., status=integrating)` — exit 0; `git --version` — exit 0. Справки integration/worktree/resource и чтение skill — exit 0.
Попытки discovery `schema(operation=task)`, `task-board cr --help`, проекции `changeRequest` и `change-request` — exit 1 (неподдерживаемые имена). Они не gates и не доказательство отсутствия CR.
Поиск в предположенном `.task-board/.change-requests` — exit 2 (каталог отсутствует); ограниченные поиски metadata не дали искомой записи. Это не доказательство отсутствия Validation. Ни одна неуспешная диагностическая команда не представлена как проходящая проверка.
