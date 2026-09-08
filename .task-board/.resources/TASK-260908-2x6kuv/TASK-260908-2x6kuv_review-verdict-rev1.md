# Вердикт TASK-260908-2x6kuv — ревизия 1

Вердикт: **accepted**. Проверено 2026-09-08. CR-TASK-260908-2x6kuv-1, revision 1, base `da759b8f3d366f31e5bd42934f6b5ecd1d01ac3f`, candidate tree `bb8971f8ac409ef826d4cf0f85e0cb84a661bce8`. Принимается исследование; runtime безопасность, build и юридическая чистота не аттестуются. Интеграция остаётся обязанностью связанного producer run.

## Объём и критерии

Перед содержательными source spot checks прочитаны отчёт и live checklist: producer отметил 8/8 своих пунктов; reviewer-пункты ещё открыты. Runtime driving tests неприменимы: delta документационный, выполнение стороннего кода запрещено. Вместо искусственного требования runtime tests использованы именованные проверки документов и доказательств. Покрыто 7/7 направлений ниже; это покрытие требований данного исследования, не всей вселенной descendants или security-путей upstream.

| Направление AC | Именованная проверка | Результат |
|---|---|---|
| Русский отчёт и pinned evidence | R1 candidate/board equality, 37 exact-object anchors | Пройдено |
| Provenance и доступность | R2 таблица, авторская статья claux, README/metadata evidence producer | Подтверждённые заявления отделены от независимой экспертизы происхождения |
| Конкретные механизмы | R3 Claw child policy, claux compaction/hooks/subagent, SDK callback, Python loop, C++ stubs, OMA executor | Существенные выборочные утверждения воспроизводятся чтением исходников |
| Неизвестность и отрицательные формы | R4 контрсценарии ниже | Ограничения отражены, неподтверждённая lineage не повышена до факта |
| Последствия для Apiary | R5 таблица решений и отвергнутых вариантов | Общий Go kernel, два профиля, Curator-installed tools, внешний MCP, host-side credentials соблюдены |
| Безопасный состав deliverable | R6 чтение нового отчёта | Нет source/prompt dumps, credential material или benchmark claims; права на reuse не объявлены установленными |
| Outcome и передача | R7 board outcomes и точный CR | Отчёт, manifest и logbook прикреплены; reviewer использует accept_cr |

В CR присутствуют шесть файлов. Пять Codex/Pi файлов побайтово равны ранее принятому candidate `baf78236218ee67a538e10fd1d8ba44a3a424497` задачи TASK-260908-1v88g1, revision 2, и текущему checkpoint `cf02d59`. Прочитан её TASK-260908-1v88g1_review-verdict-rev2.md. Повторное включение этих неизменённых файлов — аннотация состава snapshot, не новая работа; прежние source/diagram проверки приняты из того verdict, не заявляются повторёнными. Новый содержательный delta — только `.research/260908_claude-lineage.md`.

## Независимые spot checks и попытки опровергнуть выводы

Прочитанные локальные source bytes сравнены с Git blobs точных SHA из ссылок: 37/37 совпадают. Не доверяли одному факту существования строки или текущему working tree.

- **Bypass path around the check:** в [Claw tools/lib.rs](https://github.com/ultraworkers/claw-code/blob/08106b0c3771ef5b4a5aa176acccd460e88b7325/rust/crates/tools/src/lib.rs#L4210) `build_agent_runtime` действительно вызывает `agent_permission_policy`, передаёт её executor и runtime; policy создаётся с DangerFullAccess в строке 4338. Это подключённый child путь, не неиспользуемый helper. Отчёт правильно не заявляет воспроизведённый exploit.
- **Absent evidence treated as satisfied:** в [claux plugin.rs](https://github.com/ducks/claux/blob/4bdeb40532c9267e2a9d27e3caac81e21ef63e39/src/plugin.rs#L181) ошибка plugin не становится deny, а пропускается; [decide_permission](https://github.com/ducks/claux/blob/4bdeb40532c9267e2a9d27e3caac81e21ef63e39/src/query.rs#L1900) сохраняет базовое решение и предупреждает о malformed verdict. Контрсценарий «базовый Allow + plugin error» согласуется с осторожным выводом отчёта о непригодности такого hook в качестве обязательного gate. Это статический разбор, не исполненный тест.
- [claux AgentTool](https://github.com/ducks/claux/blob/4bdeb40532c9267e2a9d27e3caac81e21ef63e39/src/tools/agent.rs#L125) передаёт parent policy checker, sandbox objects и cancellation в отдельный Engine; registry исключает Agent. Утверждение об отдельном контексте не выдано за доказательство ОС containment.
- **Capability claim that does not reproduce:** [Python submit_message](https://github.com/mzpatrick0529-mzyh/claw-code/blob/01bf54ad15a894957f1dfb9fbb0d10f92684c856/src/query_engine.py#L61) строит диагностический текст и usage, а не делает model/tool loop. Четыре названных C++ файла содержат migration bodies и reference comments. Отчёт ограничивает результат 4/4 прочитанными файлами, не всем repo.
- **Absent evidence treated as satisfied / compaction:** [claux summarize_conversation](https://github.com/ducks/claux/blob/4bdeb40532c9267e2a9d27e3caac81e21ef63e39/src/query.rs#L849) отказывает при stream без Done, cancellation, пустом summary или отсутствии сокращения до commit_compacted_messages. Отчёт не обещает семантической сохранности или полного cursor recovery для всех отказов.
- **Forged or self-minted evidence:** [OMA executor](https://github.com/open-multi-agent/open-multi-agent/blob/e678bfb3e7c9313be78303c2c32294417bb58dbb/packages/core/src/tool/executor.ts#L198) сравнивает hash validated invocation, но сам этот факт не устанавливает доверие к reviewer identity. Отчёт явно оставляет authority backend вне аудита. Отсутствие optional gate само по себе не отказ; документ не утверждает обратного. [Runner](https://github.com/open-multi-agent/open-multi-agent/blob/e678bfb3e7c9313be78303c2c32294417bb58dbb/packages/core/src/agent/runner.ts#L1816) действительно проверяет grantedToolNames перед executor.
- [SDK Query._handle_control_request](https://github.com/anthropics/claude-agent-sdk-python/blob/efd4d865ef1795daffee3cd24cce45307aed8a51/src/claude_agent_sdk/_internal/query.py#L469) содержит can_use_tool/hook dispatch и signal=None TODO; это transport/control wrapper, не открытый внутренний loop.

## Проверка первичных веб-источников

Заново открыты 2026-09-08:

- [Авторская статья Jake Goldsborough](https://jakegoldsborough.com/blog/2026/rewriting-claude-code-in-rust-with-claude/): прямо связывает заявленную переработку с прочитанным leak и содержит ссылку на ducks/claux. Подтверждает заявление автора, не юридическую оригинальность.
- [Agent SDK overview](https://code.claude.com/docs/en/agent-sdk/overview): подтверждает Python/TypeScript, CLI subprocess для других языков и ограничение стороннего claude.ai login.
- [Legal and compliance](https://code.claude.com/docs/en/legal-and-compliance): различает размещение неизменённого Claude Code и собственные продукты с API authentication. Вывод отчёта о недопустимости считать подписку универсальным API entitlement соответствует этой странице.

Остальные metadata/README/официальные страницы приняты из producer evidence с обозначенными в отчёте ограничениями; все веб-утверждения заново не перепроверялись. Текущие документы не приписаны SDK SHA. Неуспешный `.md` fetch в отчёте назван ошибкой HTTP, а не отсутствием документации.

## Результаты инструментальных проверок и замечание N1

- Прочитанный producer `verify_report.py`: exit 0, 37/37 anchors и семь SHAs, report/outside-worktree equality. Сам upstream код не исполнялся.
- Независимая проверка reviewer: 37/37 source bytes соответствуют exact Git objects; candidate report равен файлу и board outcome; 5/5 прежних файлов равны принятой rev2. Лог `.temp/claude-review/checks-01.json`.
- `git diff --check BASE CANDIDATE`: **exit 2**, единственное сообщение — `.research/260908_claude-lineage.md:216: new blank line at EOF`.

**N1, неблокирующее:** лишняя пустая строка в конце Markdown. Прежний `git diff --check -- path` для untracked файла ничего не проверял; producer отмечал это ограничение и отдельно проверял whitespace Python. Его структурный checker не ловит двойной newline в конце. Поэтому «все проверки зелёные» здесь не заявляется. Это не влияет на содержание, источники, рендеринг или требования AC и не оправдывает новый цикл исследования. Runtime/build tests — N/A; обязательных исполняемых repository gates для документационного delta не установлено. Reviewer не редактирует candidate даже ради этого косметического замечания.

Ошибочные compact query `task(...)` и поле resources исправлены на `get(...)`/outcomeResources; ошибки не интерпретированы как отсутствие evidence. Tool readiness и проверки сохранены в `.temp/claude-review/`. Spawn goal прочитан: run не goal-bound. Ни code changes, ни commits/push/landing reviewer не выполнял. Условный checklist-пункт о непринятии неприменим; acceptance записывается только named mutation `accept_cr`.
