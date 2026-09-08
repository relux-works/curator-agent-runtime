# TASK-260908-31st2v — reviewer verdict, CR revision 1

Дата: 2026-09-08. Роль: reviewer. Вердикт: **accepted**.

Проверен CR-TASK-260908-31st2v-1 revision 1: base `da759b8f3d366f31e5bd42934f6b5ecd1d01ac3f`, candidate tree `3b67d9c3844b5d2c145249664beddefc625018e4`. Repository delta present: ровно два назначенных файла `.research/260908_apiary-curator-contracts.md` и `.research/260908_requirements-map.md`, 365 добавленных строк. Оба файла побайтово совпадают с candidate tree. Код, нормативные документы и чужие файлы reviewer не изменял. Подзадачи не делегировались.

## Покрытие исследовательской приёмки

Составной AC разложен на пять документарных проверок: **5/5**. Это отношение проверенных требований исследования, не runtime test coverage.

| Проверка | Именованная проверка reviewer | Результат |
|---|---|---|
| Русские исследовательские файлы | DOC-RU: прочитаны оба документа целиком, включая таблицу D01–D36 | Пройдено |
| Pinned evidence и uncertainty | SOURCE-PINS: независимый Python checker читает git objects по SHA; SEMANTIC-SPOTS: прямое сопоставление текста и code paths ниже | 120/120 permalink occurrences указывают на существующие файлы и строки; ограничения явно указаны |
| Последствия для Apiary | ARCH-MAP: проверены 36/36 решений на наличие disposition, последствия, migration и source | Пройдено; profiles, central authority, transport, credentials, MCP, epochs и Go boundaries покрыты |
| Outcome attachment | RESOURCE-BINDING: task-specific board query и чтение handoff-logbook | Два отчёта и handoff/logbook прикреплены |
| Researcher handoff | HANDOFF: прочитан task-scoped handoff; CR ready содержит candidate | Пройдено; reviewer использует accept_cr, не producer handoff |

## Содержательные проверки и попытки опровергнуть выводы

Использованы pinned snapshots A `b1ad6d76d803cd3f8e46e2b9621d266d36f3a0c7`, C `2d0901444ecfe3c11c424c561c66c66b4bb5ddd1`, S `87a0d0060bad64ab883d007dcdf35df7485368bf`, P `ebdf21a2dbe44892296c91a9401d87abc612f87f`, R — base выше. Для A/C/S/P независимо проверены HEAD и чистое состояние. Для R source citations проверены напрямую через git objects base; producer clone найден как `runtime-current`, а не предполагаемое имя репозитория.

- **Check present but uncalled from production:** проверены не только `scriptpolicy.Admit` и `resolveCLIProvider`, но реальные callers `internal/skillcheck/skillcheck.go:62`, `internal/install/targets.go:278`, `cmd/curator/main.go:593,703,1247,1382`. Source подтверждает unconditional refusal enforced scripts и nil production provider. `boundary_darwin.go` отказывает конкретному lossless backend; отчёт не превращает это в общую невозможность Darwin confinement.
- **Bypass path around the check / candidate binding:** прочитаны P `integration/reparent.go`, `integrate.go:296–325`, `cr_updates.go:35`. Production вызывает Reparent, сохраняет accepted revision, меняет candidate/base и требует revalidation. Сопоставлено с A `paper/paper.tex:137–147` I3. Отчёт корректно различает revalidation и новое exact-I review; не приписывает task-board выполнение Apiary I3.
- **Absent evidence treated as satisfied:** проверены required arrays R session-plan и call-plan schemas. `provider_retention` и `interface_id` действительно optional. Отчёт не выдаёт schema success за semantic validation и относит исправления к будущей реализации.
- **Capability claim that does not reproduce:** 1090 состояний названы результатом авторов, не producer test run; native assurance, ax/curator-run implementation и account entitlement оставлены непроверенными. Никакой положительный тест вокруг fake не используется для acceptance этой работы.
- **Source contradiction:** A ch07 пример действительно ставит I перед freeze; S assurance §6 действительно отделяет operator-installed trusted provider от skill package. R delegation буквально требует subset parent tools. Предложенные изменения маркированы как изменения, а не действующий контракт.
- **Credential semantics:** заново открыты первичные страницы [OpenAI authentication](https://learn.chatgpt.com/docs/auth), [App Server](https://learn.chatgpt.com/docs/app-server), [Anthropic authentication and credential use](https://code.claude.com/docs/en/legal-and-compliance#authentication-and-credential-use). Они подтверждают различие subscription/API доступа, managed auth внутри Codex harness и ограничения стороннего Claude login при оговорённом допуске unmodified Claude Code. Account inspection не выполнялась. App Server также описывает experimental external-token mode для host-owned auth; это не опровергает узкий вывод отчёта об отсутствии установленного разрешения использовать произвольный model endpoint.

## Проверки, границы и журнал

Самостоятельно выполнены: exact candidate/worktree comparison; pinned file/line resolution 120/120; local Markdown link existence; счёт строк D01–D36; `git diff --check BASE TREE` (exit 0); ручная source-level проверка перечисленных утверждений. Python checker exit 0. Producer checker не исполнялся и его результат не подменяет reviewer checks. Source files читались как данные; downloaded code, Go suites и sandbox experiments не запускались.

Generic checklist «Tests green» здесь означает только перечисленные документарные проверки. Execution-gate tests и mutation harness — **не применимы к delta исследования** по task-specific review-scope; их прохождение не заявляется. Future evidence matrix честно помечена как будущая. Полный повтор чтения всей книги reviewer не выполнял: полный текст deliverables прочитан, ключевые первичные утверждения проверены выборочно. Существование anchor не равно semantic proof всех 120 citations.

В документах не обнаружено source/prompt dumps, credential values или неподкреплённых exhaustiveness/popularity/lineage claims. Архитектурные рекомендации конкретны, не изменяют нормы самостоятельно и не требуют human decision для приёмки исследования. Новых blocking findings нет; существенные исходные несовпадения сохранены producer в F1–F8 и logbook L1–L11.

Read recovery: первоначальный board query использовал неизвестное поле `resources`; заменён на документированные `outcomeResources`. Предполагаемый snapshot path `curator-agent-runtime` отсутствовал; фактический `runtime-current` найден в clone log. Ни одна неудача чтения не трактовалась как отсутствие функциональности. Tool readiness logs находятся в worktree `.temp/review-31st2v/`. `spawn goal` сообщает, что run не goal-bound; directives отсутствуют.

Acceptance относится только к указанной revision и tree. Следующий шаг — producer-owned integration; reviewer не выполняет commit, push, landing или commit_ack.
