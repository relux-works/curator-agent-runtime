# Диаграммы Apiary

Предлагаемая архитектура `apiary-design-2026-09-08`. Все `.puml` — исходники, `.svg` — их визуальные представления. Каждая схема отвечает на один вопрос; схема процессов дополняется полным TCB в [главе о ядре](../../docs/apiary/kernel.md). [Общий атлас](../README.md) также включает исследовательские схемы.

| Вид | Исходник | SVG |
|---|---|---|
| Контекст Apiary: inference отдельно от проекта | [context.puml](context.puml) | [context.svg](context.svg) |
| Процессы и trust: один binary не один principal | [process-trust.puml](process-trust.puml) | [process-trust.svg](process-trust.svg) |
| Общий runtime: порты вместо встроенных tools | [core-components.puml](core-components.puml) | [core-components.svg](core-components.svg) |
| Worker turn: terminal response до эффектов | [worker-turn.puml](worker-turn.puml) | [worker-turn.svg](worker-turn.svg) |
| Установка не меняет live epoch | [tool-skill-activation.puml](tool-skill-activation.puml) | [tool-skill-activation.svg](tool-skill-activation.svg) |
| От TaskContract до exact-head integration | [task-integration.puml](task-integration.puml) | [task-integration.svg](task-integration.svg) |
| Неопределённый effect и гонка cancel | [operation-recovery.puml](operation-recovery.puml) | [operation-recovery.svg](operation-recovery.svg) |
| Failover: term, permit и живой процесс различны | [failover-fencing.puml](failover-fencing.puml) | [failover-fencing.svg](failover-fencing.svg) |
| XMPP reconnect: domain ack и artifact digest | [xmpp-reconnect.puml](xmpp-reconnect.puml) | [xmpp-reconnect.svg](xmpp-reconnect.svg) |

## Инструменты и воспроизведение

Использованы уже установленные PlantUML 1.2026.6, Graphviz 14.0.4, Java 64-Bit OpenJDK. Новый rendering stack не требуется.

```sh
plantuml -tsvg -charset UTF-8 diagrams/apiary/*.puml
plantuml -tpng -charset UTF-8 -o ../../.temp/architecture/rendered diagrams/apiary/*.puml
```

SVG сохраняются рядом с sources; PNG для visual QA — `.temp/architecture/rendered/`. Проверка XML parse/размеров/ошибок renderer дополняется визуальной инспекцией всех девяти PNG. Runtime diagrams — proposed contracts, не execution traces работающей системы. Task-scoped outcome содержит фактические результаты проверки.

Для focused revision 2 повторно проверяются только изменённые views:

```sh
plantuml -tsvg -charset UTF-8 diagrams/apiary/task-integration.puml diagrams/apiary/process-trust.puml
rsvg-convert -b white -o .temp/rework-rev2/task-integration.png diagrams/apiary/task-integration.svg
rsvg-convert -b white -o .temp/rework-rev2/process-trust.png diagrams/apiary/process-trust.svg
```

Остальные семь views сохраняют evidence revision 1; XML/link checks не выдаются за повторный visual audit.
