# Review TASK-260908-1v88g1 — CR revision 1

Вердикт: **changes_requested**. Маршрут: **analysis**, доработка исследования без реализации. `repeat-of: none`.

Дата: 08.09.2026. Run: RUN-260907-ec8e58. `spawn goal` проверен перед вердиктом: run не goal-bound. Candidate tree `2d6f267af5ba2660886c4f035faee76f22d475e2`, base `da759b8f3d366f31e5bd42934f6b5ecd1d01ac3f`. Repository delta present: пять исследовательских файлов. Все пять локальных файлов побайтово совпадают с candidate blobs. Reviewer не менял код или deliverables.

## F1 — исключение из характеристики валидации Pi

Приоритет medium. Shape: **Bypass path around the check**. `repeat-of: none`.

Раздел 5 характеризует Pi validation как преобразование с последующей TypeBox/JSON Schema проверкой перед execute, но не отражает альтернативный ранний выход из того же прочитанного валидатора. Для исследования границ typed tools это существенное исключение: вызов validator не доказывает отказ на всех невалидных аргументах.

Прямые исходники Pi SHA `b2602be77cb7b0de45dd616407fd210daa48aa75`:

- [validation.ts:317, validateToolArguments](https://github.com/earendil-works/pi/blob/b2602be77cb7b0de45dd616407fd210daa48aa75/packages/ai/src/utils/validation.ts#L317): для plain schema, изменившегося значения и не-object ветки строка 332 возвращает `validator.Check(coerced) ? coerced : args`. False возвращает исходное значение, минуя общий throw. Это наблюдение кода, не результат исполнения.
- [validation.ts:194, coerceWithJsonSchema](https://github.com/earendil-works/pi/blob/b2602be77cb7b0de45dd616407fd210daa48aa75/packages/ai/src/utils/validation.ts#L194): primitive coercion отделена от проверки ограничений schema.
- [agent-loop.ts:593, prepareToolCallArguments / prepareToolCall](https://github.com/earendil-works/pi/blob/b2602be77cb7b0de45dd616407fd210daa48aa75/packages/agent/src/agent-loop.ts#L593): optional prepareArguments возвращает замену; validator result попадает в prepared.args без повторной проверки. Production callers найдены в sequential и parallel batch, строки 450 и 505.
- [agent-loop.ts:677, executePreparedToolCall](https://github.com/earendil-works/pi/blob/b2602be77cb7b0de45dd616407fd210daa48aa75/packages/agent/src/agent-loop.ts#L677): значение передаётся в tool.execute.
- [validation.test.ts:7, createToolCallWithPlainSchema](https://github.com/earendil-works/pi/blob/b2602be77cb7b0de45dd616407fd210daa48aa75/packages/ai/test/validation.test.ts#L7): имеющиеся plain-schema fixtures оборачивают значение в object property, поэтому это не проверка раннего scalar return.

Статический контрсценарий: plain root schema `{type:"number", minimum:10}`, scalar input `"7"`; после coercion — 7, constraint false, указанная ветка возвращает исходное значение. Root replacement возможен в custom/untyped SDK потоке или prepareArguments. **Это не воспроизведённый сетевой exploit**: upstream dependencies и программа не исполнялись; admission scalar-root schemas конкретными providers не установлен. Эта граница остаётся неизвестной. Даже если provider отвергает такую schema, ранний return host-валидатора требует оговорки вместо общего вывода о защите.

Требуемая доработка только документации:

1. Отразить ветку и точные предусловия в разделе 5; отделить факт вызова validator от гарантии отказа и обозначить статический характер вывода.
2. Добавить решение Apiary: либо допускать только object-root schemas при установке, либо проверять все возвращаемые normalized значения; invalid normalized result должен отказать до dispatch.
3. Добавить предложение отрицательной проверки: успешная coercion с последующим отказом constraint, включая root replacement/prepareArguments и обе batch-ветки. Не запускать/исправлять чужой код и не менять нормативные протоколы.

После узкой поправки — новый reviewer cycle; повтор всего исследования не требуется.

## Покрытие и проверки

Перед чтением кода рассмотрено покрытие: 12/12 тематических вопросов имеют разделы и named source checks. Runtime driving tests неприменимы к documentation-only delta и запрещённому исполнению внешнего кода. AC точности source-backed выводов не принят из-за F1; тематическое покрытие не означает полноту аудита.

Самостоятельно повторён прочитанный `verify_report.py`: exit 0, 47/47 file/line anchors, 2/2 pinned HEAD, 2/2 clean snapshots, 2/2 SVG XML, 2/2 relative links. Это existence checks, не semantic proof. Codex SHA `8e694e955ae02ca737230a5468c55d5847074072`; Pi SHA указан выше.

Содержательно перепроверены Codex OutputItemDone → dispatch → drain_in_flight до stream outcome; Pi error/aborted/length до execute; оба replay-safe predicates durable recovery; незавершённый watchSession; silent skip classic JSONL и отказ malformed complete v4 transaction; prefix comparison/previous response continuation Codex; cross-model signatures migration Pi. Эти наблюдения подтверждают отчёт.

Статические атаки на обобщения: helper-vs-production callers (F1); valid-but-truncated arguments против одной JSON-валидации; оба replay-safe predicates против одного proxy; malformed complete row против torn tail; историческое cache описание против текущего кода. Это контрпроверки утверждений, не runtime certification и не mutant run. Upstream length-truncation test прочитан, не запущен.

Сопоставлены docs/architecture.md и Decision 0005. Общий kernel, два профиля, отдельные provider credentials и out-of-process MCP wrappers соответствуют заданию; рекомендации отделены от реализации. Русский текст и обе схемы прочитаны. Producer rendering evidence принято как чужая проверка; обе PNG previews самостоятельно просмотрены, подписи читаются, обрезки нет. В пяти deliverables raw credentials или proprietary prompt dumps не обнаружены; весь workspace не сканировался. Report и evidence zip зарегистрированы в task outcomeResources.

Первичные страницы повторно открыты 08.09.2026:

- [Mario Zechner](https://mariozechner.at/posts/2026-04-08-ive-sold-out/): rename подтверждён без вывода о lineage механизмов.
- [OpenAI agent loop](https://openai.com/index/unrolling-the-codex-agent-loop/): историческое описание previous_response_id действительно отличается от pinned code; отчёт это отмечает.
- [Claude Agent SDK plan](https://support.claude.com/en/articles/15036540-use-the-claude-agent-sdk-with-your-claude-plan): update June 15 присутствует; отчёт не переносит его автоматически на прямой Pi adapter.

## Журнал

Scratch: `.temp/review-1v88g1/readiness.log`, `verification.log`, `candidate-check.log`. Две ошибочные board projections исправлены через scoped schema и outcomeResources; ошибки не приняты за отсутствие ресурсов. Git diff tree-vs-untracked не использован как доказательство изменения candidate: выполнено побайтовое сравнение blobs. Первая попытка записи verdict из внешнего cwd не нашла scratch directory; файл затем создан в worktree, attachment выполнен отдельно из project root.

Build, upstream tests, OAuth/account operations, commits, push и landing не выполнялись. Требуется исправить только F1 в исследовании.
