# Reviewer verdict: TASK-260908-oqx20d / revision 1

**Вердикт: accepted.** Существенных замечаний не выявлено. Проверка 2026-09-08, run RUN-260907-ee3cf6.

Base: `da759b8f3d366f31e5bd42934f6b5ecd1d01ac3f`; candidate tree: `50679ca77a644bd615b7fb4a5f9dae9c27334872`. Delta — два новых исследовательских файла `.research/260908_runtime-landscape.md` и `.research/260908_source-catalog.json`; рабочие байты совпадают с candidate. Repository delta present, не пустая аннотация. Reviewer не менял candidate и не выполнял commit/push/integration.

## AC и именованные проверки

До содержательного чтения рассмотрены AC и producer handoff. Для documentation delta driving runtime tests неприменимы; используются проверки документов. Покрытие составных требований AC: **6/6**.

| Требование | Проверка | Результат |
|---|---|---|
| Русские source-backed файлы | DOC-1: чтение обоих документов и сравнение с tree | Оба присутствуют, наблюдения отделены от предложений |
| Широта и глубина | CAT-1: структура каталога, counts/axes | 28 pinned repos, 26 source-inspected; D2=14/D1=12/D0=2; 4 закрытые среды docs-only, 8 осей |
| Pinned evidence | SRC-1: независимая загрузка exact-SHA raw files, hashes/ranges/permalinks | **72/72** совпадают; не только producer cache |
| Неопределённость | CLAIM-1: завышенные гарантии, version ambiguity, unknown/absent | D3=0; нет benchmark/popularity чисел, archive и maintenance различены |
| Последствия для Apiary | ARCH-1: обе профильные колонки и pinned paper | Общий kernel, typed worker skill, optional signing, отдельные credentials, внешние MCP wrappers |
| Outcome и handoff | BOARD-1: scoped projection и чтение handoff | Research files, handoff и CR patch прикреплены |

## Содержательные spot checks

Повторно загружены source files по SHA из каталога; исполняемый код не запускался. Проверены:

- S01 Gemini scheduler 450–578: contiguous batching, validating до execution, edit tools sequential и default parallel.
- S07 mini-SWE default agent 86–137: finally/save, terminal exit и execute_actions(query()).
- S10 Cline executeToolCalls 1630–1685 и SessionRuntime 303–346: preparation до parallel/sequential dispatch, host message builder/registry. Полнота freshness не следует из подготовки, и отчёт её не обещает.
- S13 DeepSeek runGroup 122–245: bounded in-flight, model-order commit, prepare/dispatch/finalize и allSettled drain при сбое. [Официальная страница](https://www.deepseek.com/harness/en/) подтверждает canonical repository. Same-process trust — явно архитектурный вывод, не обещание автора.
- S14 LangGraph Checkpoint 91–134 и runner tick 176–225: channel versions, versions_seen, futures/retry/commit; атомарность внешних эффектов не установлена.
- S05 OpenHands EventLog 225–270: запись и индексы, без доказательства fsync. S16 MAF CheckpointStorage 127–170 — интерфейс, не доказательство graph-hash enforcement; ограничение сохранено.
- S24 Pi loop 210–285 и session loader 494–566: length-stop отказывает calls; malformed JSON пропускается, loader может дописать newline. Вывод для authority journal обоснован.
- S28 deepagents graph 900–973 и memory 279–313: final tool exclusion после custom middleware; file_not_found отличён от других ошибок. Полнота enforcement не заявлена.
- S25 OpenClaw architecture 1–61, S26 Letta README 1–41, S12 Continue README: текущие границы, переезд source и maintenance соответствуют тексту. Историческая lineage не выдумана.
- Apiary paper по SHA `b1ad6d76d803cd3f8e46e2b9621d266d36f3a0c7`, 259–277, прочитан через git show: unknown outcome и запрет слепого повтора подтверждены; optional signing явно отнесён к новой постановке задачи.

Повторно открыты первичные [OpenAI auth](https://learn.chatgpt.com/docs/auth), [Gemini auth](https://geminicli.com/docs/get-started/authentication/), [Goose ACP](https://goose-docs.ai/docs/guides/acp-providers/). Разделение subscription/API, Google modes и отсутствие ACP resume/fork подтверждены. Конкретные account entitlements не исследовались.

## Проверки ложноположительного evidence и ограничения

`Forged or self-minted evidence`: hashes сверены с independently fetched pinned source. `Absent evidence treated as satisfied`: 72/72 подтверждены явно; web cache miss двух raw URL не считался отсутствием source, все raw files затем получены urllib. `Capability claim that does not reproduce`: runtime performance, sandbox safety, exactly-once и Go parity остаются неизвестными. `Bypass path around the check`: обе колонки worker/orchestrator сохраняют общий authority contract.

Нового исполняемого gate нет. Mutants, runtime tests и security experiments не имитировались: role-conditional review-scope требует документационный review. Hash verification не доказывает истинность всех выводов; substantive inspection ограничена перечисленной выборкой. Остальные claims принимаются с заявленной D1/D2 границей, не как полный аудит. Закрытые среды не объявлены source-inspected. При чтении candidate не обнаружены secrets, proprietary prompts или source dumps; credential stores не открывались.

## Реальные проверки и evidence

- `python3 .temp/oqx20d-review/check.py` — exit 0: 72/72 remote hashes/ranges, candidate identity, counts/axes/anchors; check-01.log и remote-check.json.
- `python3 .temp/TASK-260908-oqx20d/validate.py` — reviewer rerun, exit 0; producer-validation-rerun.log.
- `git diff --check <base> <candidate-tree>` — exit 0; whitespace-01.log, покрывает новые файлы.
- `task-board spawn goal` — run не goal-bound; directives отсутствуют.
- Первая попытка записи verdict использовала relative path из project root и завершилась exit 1 до создания файла/attachment. Повторная запись выполнена в правильном worktree; это исправленная ошибка tooling, не успешный gate.

Scratch: `.temp/oqx20d-review/`. Remote-check JSON приложен отдельно без third-party source dumps. Producer handoff прочитан, его validation выполнена повторно; чужие runtime suite results не принимались.

## Маршрутизация

Принять exact revision 1 через accept_cr без commit_ack. Следующий статус integrating, не done. Интеграция принадлежит bound producer/parent lifecycle. Runtime tests/gate attacks не применимы к данному delta; условный пункт о неуспешном verdict неприменим. Этот документ — reviewer verdict, не researcher handoff.
