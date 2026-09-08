# TASK-260908-1v88g1 — revision 2, ready for review

Исправлено только F1 и размещение диаграмм по инструкции родителя. В разделе 5 описаны точные условия раннего scalar return Pi, production prepare/execute и обе batch-ветки. Раздел 13 содержит предлагаемые отрицательные случаи для object-root admission, root replacement и constraint failure после coercion. Это статический анализ, не воспроизведённый exploit; provider admission неизвестен. Исходники upstream не исполнялись и не изменялись.

Четыре схемы перенесены без изменения SHA-256 из `.research/260908_codex-pi-diagrams/` в `diagrams/research/codex-pi/`. Ссылки и checker обновлены; архив сохраняет относительные пути отчёта и диаграмм.

Самостоятельные проверки: `verify_report.py` exit 0 (47/47 anchors, 2/2 pins, 2/2 clean snapshots, 2/2 XML и links); `rev2/check_delta.py` exit 0 (4/4 hashes, 7/7 F1 anchors, 2/2 links, 3/3 text whitespace); `git diff --check` exit 0 (не покрывает untracked). Оба Python checker повторены после записи раздела evidence, exit 0. Rendering/visual review приняты из revision 1 и не повторялись. Числа проверяют артефакты, не runtime coverage.

Source SHAs сохранены: Codex `8e694e955ae02ca737230a5468c55d5847074072`; Pi `b2602be77cb7b0de45dd616407fd210daa48aa75`. Новое web-исследование не проводилось. Review F1 перечитан вместе с source ranges validation.ts:62–120,194–355; agent-loop.ts:430–525,590–730; validation.test.ts:1–80.

Операционные ошибки: начальный `task(...)` query exit 1 исправлен на `get(...)` exit 0; inventory с отсутствующими skill dirs exit 2, дополнительный ls отсутствующего внешнего scratch exit 1. Это не отсутствие board evidence и не passing gates; внешний scratch создан отдельно. Task status mutation и readiness выполнены. Никаких commits/push/landing, изменений sibling repos, README, shared skills или нормативных документов.

Logbook: F1 показывает различие между фактом вызова validator и гарантией fail-closed dispatch; рекомендация Apiary — object-root admission плюс проверка любого результата normalization, без возврата невалидного original value. Остальные выводы сохранены. Передано на повторное review; принятие остаётся за reviewer.
