# Исследовательский logbook: provider portability

TASK-260908-39n05p — provider-auth-portability. 2026-09-08, Asia/Tbilisi.

## Существенные находки и решения

- **Граница полномочий:** raw inference и официальный полный агент — разные режимы. Codex dynamic tools добавляются к router, а Claude `allowed_tools` управляет auto-approval. Решение: direct `ModelPort` baseline; отдельный `AgentBridge`, без неподтверждённого strict-worker assurance.
- **Gemini CLI:** в актуальной официальной странице есть прямой запрет стороннего доступа к CLI backend через OAuth. Работающий OSS adapter не переопределяет этот запрет.
- **Claude:** июньские изменения Agent SDK credits приостановлены; сохранённую на странице старую таблицу нельзя использовать как текущий billing. Условия размещения неизменённого Claude Code не разрешают собственный посреднический consumer OAuth backend.
- **Alibaba:** Coding Plan и Token Plan независимы. Справочник Token Plan от 7 сентября и официальный блог расходятся по редакции продукта/квотам; допустимость autonomous backend не считать установленной из факта совместимости API. PAYG снимает зависимость исследования от уточнения.
- **Kimi:** официальный subscription API-key путь для coding tools подтверждён; CLI OAuth отдельно. Реальная client identity обязательна. Перенос разрешения на коммерческий pooled inference broker не установлен.
- **OpenRouter:** BYOK означает передачу provider key gateway; это не соответствует профилю строго локального хранения такого key. Shared-capacity fallback и BYOK budget accounting проверяются независимо.
- **Curator:** существующий provider capability receipt удостоверяет свойства host execution, а не inference capability/entitlement. Нормативные документы не менялись; предлагается отдельная типизация наблюдений.

## Ограничения источников и аномалии

- Pin — конкретный commit, а не плавающий `main`. Целевая выборка 6 внешних репозиториев; использованы 16 source-файлов и 23 точных symbol anchors. Это не исчерпывающий аудит runtime.
- Первый source downloader завершился exit 0, но обнаружил HTTP 404 внутри Pi retrieval: путь `packages/ai/src/stream.ts` отсутствует в текущем tree. Реальные файлы в `src/api/` найдены по pinned tree и получены отдельно. Частичный отказ сохранён, не выдан за успешный полный fetch.
- Web retrieval успешно прочитал актуальный Gemini thinking guide, но дополнительный локальный urllib fetch вернул HTTP 403, exit 1. Hash для этой страницы не заявлен. Устаревший thought-signatures URL содержит только сообщение о переносе.
- Исходники/примеры не запускались; секреты и пользовательские account stores не читались. Цена, latency, grants аккаунтов и аппаратная изоляция не измерялись.
- Изменены только три task-scoped документа `.research/260908_provider-portability*`; scratch находится в `.temp/provider-portability/`. Чужие files и sibling repos сохранены. Commit/push/land принадлежат parent.

## Проверка документации

Результаты записываются после прямого запуска соответствующих команд; runtime tests отсутствуют, поскольку implementation delta отсутствует.

- Первый `python3 .temp/provider-portability/verify_report.py`: **exit 1**. Проверка ошибочно сочла inline labels `L562` и аналогичные reference citations. Исправлен только regex task-scoped проверяющего скрипта, чтобы отличать inline-ссылку от reference citation; source hashes и anchors до этого шага уже проверялись успешно. Это не runtime failure.
- Второй `verify_report.py`: **exit 1**. Проверяющий regex принял иллюстративную Markdown-ссылку внутри logbook за реальный local link. Пример заменён обычным текстом; содержательные citations не изменены.
- Третий `python3 .temp/provider-portability/verify_report.py`: **exit 0**; 23/23 source anchors и hashes, 28/28 hashes полученных страниц, 3/3 документов с разрешимыми относительными ссылками/reference labels; проверены trailing whitespace и ограниченный key-pattern scan. Лог: `.temp/provider-portability/report-check-03.log`.
- `git diff --check`: **exit 0**, `.temp/provider-portability/diff-check-01.log`. Ограничение: новые документы ещё untracked, поэтому их whitespace проверялся также `verify_report.py`, а не приписан покрытию git diff.
- Self-review: исследование разделяет Н/В/П, не утверждает выполнение runtime/build/security gates. Изменения scoped к трём файлам исследования. Итоговый повтор проверки после добавления этой записи сохранён в `report-check-04.log`.
