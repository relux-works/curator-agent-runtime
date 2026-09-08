# Reviewer verdict: TASK-260908-39n05p

Дата: 2026-09-08. Роль: reviewer. CR-TASK-260908-39n05p-1, revision 1.

**Вердикт: accepted.** Блокирующих замечаний нет. Это принятие исследования и его доказательств, не аттестация runtime или пользовательского account access.

Проверенный base: `da759b8f3d366f31e5bd42934f6b5ecd1d01ac3f`; candidate tree: `6d424210d9d2059f4485b35aa6ec9929ce6f9443`. Delta present: пять Markdown-файлов. Три provider-portability файла побайтно сверены с candidate через `git show`. Два остальных файла — неизменённые документы TASK-260908-31st2v: `git diff --exit-code HEAD <candidate> -- <two paths>` вернул 0; HEAD `d7035a7`, соседняя задача имеет status integrating. Они рассматриваются как ранее checkpoint-нутый контекст, не новая работа этого producer и не новый повторный review соседнего исследования.

## Покрытие AC и границы проверки

Исходный AC — одна составная строка. Для документального review она разложена на восемь проверок: **8/8 проверены**. Исполняемых AC/gates в delta нет: runtime driving tests **не применимы (0 требуемых)**. Будущие отрицательные тесты раздела 8 не объявляются исполненными.

| Проверка | Именованная проверка и доказательство | Результат |
|---|---|---|
| Русский язык, наблюдения/выводы/предложения | DOC-LANGUAGE: чтение трёх документов, Н/В/П, ограничения §9 | pass |
| Матрица всех запрошенных групп, включая Kimi | DOC-MATRIX: §2, прямые API и subscription/bridge разделены | pass |
| Policy не выведена из работающего OAuth | POLICY-COUNTEREXAMPLES: официальные Gemini/Claude/Kimi страницы, см. ниже | pass |
| Credential/account/budget lifecycle | DESIGN-BOUNDARIES: §5–7, refresh CAS, audience, owner isolation, unknown usage | pass |
| Streaming/schema/Go boundary | SOURCE-SPOTCHECK: pinned SDK, Pi, OpenCode и upstream bridge source | pass |
| Pins, anchors, ссылки и uncertainty | DOC-INTEGRITY: повтор producer checker; независимый fetch девяти файлов | pass |
| Последствия для Apiary и rejected alternatives | ARCH-FIT: один kernel, два профиля, отдельные ModelPort/AgentBridge, MCP wrappers, §8 | pass |
| Outcome и handoff | BOARD-HANDOFF: producer board notes подтверждают четыре task-scoped outcome и ready-for-review; опубликованный CR передан этому reviewer | pass |

## Фактически повторённые проверки

- `python3 .temp/provider-portability/verify_report.py`: exit 0. 23/23 anchors и hashes; 28/28 document hashes; 3/3 документов с относительными ссылками и reference labels. Скрипт прочитан до исполнения; это локальная проверка документов, сторонний код не запускался. Лог `.temp/provider-review/checks-01.log`.
- `git diff --check <base> <candidate>`: exit 0; проверен именно candidate, включая новые документы.
- Независимый HTTP fetch с raw.githubusercontent.com: девять уникальных файлов, hashes совпали с реестром. Снимки находятся в `.temp/provider-review/`. Некоторые файлы запрошены повторно по разным anchors; число девять не считает эти повторы.
- Три рабочих provider-документа равны candidate blobs: 3/3, assert exit 0.
- CLI readiness и Git readiness: exit 0, `.temp/provider-review/readiness.log`.
- `task-board spawn goal` сообщил: run не goal-bound; directives отсутствуют.

Независимо прочитаны существенные участки повторно полученных исходников:

1. Pi `transformMessages`, commit `b2602be77cb7b0de45dd616407fd210daa48aa75`, [L64](https://github.com/badlogic/pi-mono/blob/b2602be77cb7b0de45dd616407fd210daa48aa75/packages/ai/src/api/transform-messages.ts#L64): same-model signatures, cross-model removal и synthetic orphan results. Они не превращены в execution receipts в предлагаемой архитектуре.
2. OpenCode `sanitizeOpenAISchema/schema` и `session/llm.ts::streamText`, commit `ecbc6ccac85b3e8087b6445e584318419b9e2b34`, [schema](https://github.com/anomalyco/opencode/blob/ecbc6ccac85b3e8087b6445e584318419b9e2b34/packages/opencode/src/provider/transform.ts#L1479), [production stream call](https://github.com/anomalyco/opencode/blob/ecbc6ccac85b3e8087b6445e584318419b9e2b34/packages/opencode/src/session/llm.ts#L280): loss of constraints, prepared tools и explicit retry. Полный call graph всех codecs не проверялся.
3. OpenAI Go commit `52e95a974582ebd8d3b23f349e1bcdbbb899c0ac`: [NewStreaming](https://github.com/openai/openai-go/blob/52e95a974582ebd8d3b23f349e1bcdbbb899c0ac/responses/response.go#L78), [Next/Err](https://github.com/openai/openai-go/blob/52e95a974582ebd8d3b23f349e1bcdbbb899c0ac/packages/ssestream/ssestream.go#L191), [shouldRetry](https://github.com/openai/openai-go/blob/52e95a974582ebd8d3b23f349e1bcdbbb899c0ac/internal/requestconfig/requestconfig.go#L385): транспортный retry не является tool-effect recovery.
4. Codex commit `8e694e955ae02ca737230a5468c55d5847074072`, [build_tool_router](https://github.com/openai/codex/blob/8e694e955ae02ca737230a5468c55d5847074072/codex-rs/core/src/tools/spec_plan.rs#L125): core tools добавляются отдельно от dynamic tools; специальная internal session ветка не представлена как публичный способ обойти ограничения.
5. Claude SDK commit `efd4d865ef1795daffee3cd24cce45307aed8a51`, [ClaudeAgentOptions](https://github.com/anthropics/claude-agent-sdk-python/blob/efd4d865ef1795daffee3cd24cce45307aed8a51/src/claude_agent_sdk/types.py#L1941), [command builder](https://github.com/anthropics/claude-agent-sdk-python/blob/efd4d865ef1795daffee3cd24cce45307aed8a51/src/claude_agent_sdk/_internal/transport/subprocess_cli.py#L562): tools и allowed_tools различаются; subprocess environment требует отдельного boundary.

## Атаки на доказательственные выводы

- **Capability claim that does not reproduce:** проверена попытка приравнять allowed_tools/dynamicTools к строгому single-tool worker. Документ сам отвергает такой вывод; source и app-server documentation подтверждают отдельную agent поверхность. Никакой runtime isolation guarantee не принимается.
- **Forged or self-minted evidence:** наличие OSS adapter не принято как entitlement; self-reported model receipts явно не приравнены к supplier attestation.
- **Absent evidence treated as satisfied:** unknown account access, partial fetch/403, EOF и missing usage не превращены в отсутствие запрета, success или нулевой расход. Ошибки получения явно описаны.
- **Bypass path around the check:** исследовательское предложение учитывает refresh/retry, account switch, bridge hosted effects, BYOK fallback и cross-account cache; это будущие требования, не якобы протестированные gates.

Повторно открыты официальные первичные страницы 2026-09-08:

- [Codex app-server](https://learn.chatgpt.com/docs/app-server): product embedding и experimental dynamic calls; не raw inference contract.
- [Claude legal](https://code.claude.com/docs/en/legal-and-compliance): unmodified hosted binary, собственная identity пользователя, запрет credential intermediation.
- [Claude plan](https://support.claude.com/en/articles/15036540-use-the-claude-agent-sdk-with-your-claude-plan): уведомление June 15 приостанавливает описанные ниже изменения; прежняя таблица не текущий billing.
- [Gemini CLI terms](https://geminicli.com/docs/resources/tos-privacy/): явное ограничение прямого third-party backend access.
- [Kimi membership](https://www.kimi.com/en/help/kimi-code/membership-guide): официальный API-key путь сторонних coding tools, отдельный OAuth official clients, реальная client identity.
- [Alibaba reference](https://www.alibabacloud.com/help/en/model-studio/token-plan-overview) и [blog](https://modelstudio.alibabacloud.com/intl/blog/model-studio-token-plan-individual/): несовпадающие продуктовые описания и явный запрет automated backends в FAQ блога. Conditional/unknown в отчёте оправдан.

### Неблокирующая аннотация N1

В §2.1 блог Alibaba назван августовским. При reviewer retrieval страница показывает **2026-07-19**. Существенные policy-текст и вывод о расхождении подтверждены. Дату следует нормализовать при следующем обновлении источника; это не основание для нового исследовательского цикла и не меняет acceptance данного CR.

## Ограничения и lifecycle

Нет live account calls, builds, runtime suites, sandbox penetration tests, проверки всех provider branches или exhaustive secret audit. Не запускался скачанный third-party code; credentials не читались. В deliverable нет dump стороннего source/proprietary prompts; ограниченный pattern scan и чтение не обнаружили secret material.

Ошибочные первоначальные board queries с неизвестными полями/операциями дали parse errors; они не использовались как доказательство отсутствия resources. Поиск отсутствующих необязательных skill directories и один shell glob также не трактуются как успешная проверка содержимого. Reviewer вывод опирается на фактически прочитанные файлы, CR и успешно полученные board сведения.

Acceptance относится к exact revision 1 и будет записан через accept_cr после прикрепления этого outcome. Commit, публикация и интеграция не выполнялись. Код и исследовательские файлы reviewer не изменял.
