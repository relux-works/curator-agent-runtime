# Атлас диаграмм

Все версионированные исходники и визуальные представления находятся под корневым `diagrams/`. Это архитектурные схемы и исследовательские модели; они не являются traces работающего Apiary runtime.

## Предлагаемая архитектура Apiary

[Индекс девяти схем](apiary/README.md) содержит пары PlantUML/SVG и команды воспроизведения.

| Читать когда | Вид |
|---|---|
| Нужна общая картина | [Контекст](apiary/context.svg), [процессы и trust](apiary/process-trust.svg), [компоненты ядра](apiary/core-components.svg) |
| Разбираете один worker turn | [Worker turn](apiary/worker-turn.svg), [активация tool-skill](apiary/tool-skill-activation.svg) |
| Проверяете результат задачи | [Task/candidate/integration](apiary/task-integration.svg) |
| Анализируете сбои | [Operation recovery](apiary/operation-recovery.svg), [failover/fencing](apiary/failover-fencing.svg), [XMPP reconnect](apiary/xmpp-reconnect.svg) |

## Исследовательские модели Codex/Pi

Эти две схемы сопровождают [исследование Codex/Pi](../.research/260908_codex-pi.md). Их рекомендации сопоставлены с принятыми решениями в [каталоге паттернов](../docs/apiary/evidence.md); они не заменяют архитектуру Apiary.

| Вид | Исходник | Представление |
|---|---|---|
| Kernel и внешний мир | [kernel.puml](research/codex-pi/kernel.puml) | [kernel.svg](research/codex-pi/kernel.svg) |
| Recovery границ вызова | [recovery.puml](research/codex-pi/recovery.puml) | [recovery.svg](research/codex-pi/recovery.svg) |

Надпись «Опционально узкий signing» в исследовательской kernel-схеме — раннее предложение, отклонённое принятым дизайном: signing отсутствует в model catalog, Submission подписывает host-only node-signer, а candidate commit — отдельный сервис runner. Подробный действующий вариант предложения показан в [process trust](apiary/process-trust.svg) и [host Submission](../docs/apiary/execution.md#host-controlled-seal-и-submission-после-model-stop). Исходная исследовательская схема сохранена для provenance.

Общая команда воспроизведения из корня: `plantuml -tsvg -charset UTF-8 diagrams/apiary/*.puml diagrams/research/codex-pi/*.puml`. SVG появляются рядом с исходниками. Для проверки неизменённых принятых схем используйте копии в `.temp/<TASK-ID>/rendered/`; PNG и логи также остаются в `.temp/`. Версии и дополнительные команды — в [README](../README.md#инструменты-и-воспроизведение). XML parse и успешный renderer дополняют визуальное чтение; они сами по себе не доказывают читаемость.
