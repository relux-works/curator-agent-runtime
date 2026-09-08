# Реестр доказательств: provider portability

TASK-260908-39n05p. Дата: 2026-09-08, Asia/Tbilisi. [Основное исследование](260908_provider-portability.md).

## Метод и границы

Ниже перечислены только source-файлы, из которых прочитаны и использованы конкретные участки. Загрузка других файлов не означает их ревью. Сетевые чтения публичных GitHub API/raw URLs выполнялись без исполнения кода. Полные сторонние исходники не включены в deliverable. SHA относится к commit, SHA-256 — к полученным bytes конкретного файла. Символы найдены в сохранённом файле; ссылка на строку открывает исходник именно на этом commit.

## Исходники: pins и прочитанные участки

### badlogic/pi-mono

Commit: `b2602be77cb7b0de45dd616407fd210daa48aa75`. Commit time: `2026-09-07T20:26:47Z`. Retrieval UTC: `2026-09-07T23:06:16.927709+00:00`.

| Файл / символ | Неизменяемый anchor | SHA-256 файла |
|---|---|---|
| `packages/ai/src/providers/openai.ts` — `export function openaiProvider` | [L6](https://github.com/badlogic/pi-mono/blob/b2602be77cb7b0de45dd616407fd210daa48aa75/packages/ai/src/providers/openai.ts#L6) | `1904f9511221f47bbe890dc007571add9ac16ab28cd48c4090b58f13950cbfd0` |
| `packages/ai/src/providers/kimi-coding.ts` — `export function kimiCodingProvider` | [L7](https://github.com/badlogic/pi-mono/blob/b2602be77cb7b0de45dd616407fd210daa48aa75/packages/ai/src/providers/kimi-coding.ts#L7) | `ef864d572eef11900f24bb6a5dc620982bd9c39fac600970deec55466348f8b0` |
| `packages/ai/src/types.ts` — `export interface ProviderRequestOptions` | [L124](https://github.com/badlogic/pi-mono/blob/b2602be77cb7b0de45dd616407fd210daa48aa75/packages/ai/src/types.ts#L124) | `ae0427bfba137623df3a27c545ab405d4a3ad4163ec94c9fec5d4e10eb36759c` |
| `packages/ai/src/types.ts` — `export interface ProviderStreams` | [L272](https://github.com/badlogic/pi-mono/blob/b2602be77cb7b0de45dd616407fd210daa48aa75/packages/ai/src/types.ts#L272) | `ae0427bfba137623df3a27c545ab405d4a3ad4163ec94c9fec5d4e10eb36759c` |
| `packages/ai/src/api/transform-messages.ts` — `export function transformMessages` | [L64](https://github.com/badlogic/pi-mono/blob/b2602be77cb7b0de45dd616407fd210daa48aa75/packages/ai/src/api/transform-messages.ts#L64) | `cf309c00b943bc0a90ccaabb185730a3f27a3c92de6696ada3155b0185904161` |
| `packages/ai/src/api/openai-completions.ts` — `export const stream:` | [L311](https://github.com/badlogic/pi-mono/blob/b2602be77cb7b0de45dd616407fd210daa48aa75/packages/ai/src/api/openai-completions.ts#L311) | `7c1002a6a17cd081f36a44defea533ea03f65e07477e4ddec49b402760e97df8` |
| `packages/ai/src/utils/event-stream.ts` — `export class AssistantMessageEventStream` | [L91](https://github.com/badlogic/pi-mono/blob/b2602be77cb7b0de45dd616407fd210daa48aa75/packages/ai/src/utils/event-stream.ts#L91) | `147084657f76665ff7d6c8dcd6eb0745149e3aaee3e7b9c272b315a1b5679386` |

### anomalyco/opencode

Commit: `ecbc6ccac85b3e8087b6445e584318419b9e2b34`. Commit time: `2026-09-07T16:21:14Z`. Retrieval UTC: `2026-09-07T23:06:18.291014+00:00`.

| Файл / символ | Неизменяемый anchor | SHA-256 файла |
|---|---|---|
| `packages/opencode/src/provider/provider.ts` — `const BUNDLED_PROVIDERS` | [L113](https://github.com/anomalyco/opencode/blob/ecbc6ccac85b3e8087b6445e584318419b9e2b34/packages/opencode/src/provider/provider.ts#L113) | `3e0e5828ed163ccf8ef31c05a9ffd7f47655dcec30e087d6f4c57a17ba11b5bd` |
| `packages/opencode/src/provider/transform.ts` — `function normalizeMessages` | [L101](https://github.com/anomalyco/opencode/blob/ecbc6ccac85b3e8087b6445e584318419b9e2b34/packages/opencode/src/provider/transform.ts#L101) | `c07d49e48dd2478ad2813a10805781a72551db2fd847b7df994cc854bf654c16` |
| `packages/opencode/src/provider/transform.ts` — `function applyCaching` | [L358](https://github.com/anomalyco/opencode/blob/ecbc6ccac85b3e8087b6445e584318419b9e2b34/packages/opencode/src/provider/transform.ts#L358) | `c07d49e48dd2478ad2813a10805781a72551db2fd847b7df994cc854bf654c16` |
| `packages/opencode/src/provider/transform.ts` — `function sanitizeOpenAISchema` | [L1479](https://github.com/anomalyco/opencode/blob/ecbc6ccac85b3e8087b6445e584318419b9e2b34/packages/opencode/src/provider/transform.ts#L1479) | `c07d49e48dd2478ad2813a10805781a72551db2fd847b7df994cc854bf654c16` |
| `packages/opencode/src/provider/transform.ts` — `export function schema` | [L1562](https://github.com/anomalyco/opencode/blob/ecbc6ccac85b3e8087b6445e584318419b9e2b34/packages/opencode/src/provider/transform.ts#L1562) | `c07d49e48dd2478ad2813a10805781a72551db2fd847b7df994cc854bf654c16` |
| `packages/opencode/src/session/llm.ts` — `result: streamText(` | [L280](https://github.com/anomalyco/opencode/blob/ecbc6ccac85b3e8087b6445e584318419b9e2b34/packages/opencode/src/session/llm.ts#L280) | `5f1dcfb734853e39760e4dd05470f0c7d8752fc5dcc64e118c065149602e402d` |

### openai/openai-go

Commit: `52e95a974582ebd8d3b23f349e1bcdbbb899c0ac`. Commit time: `2026-09-05T16:07:50Z`. Retrieval UTC: `2026-09-07T23:06:02.091599+00:00`.

| Файл / символ | Неизменяемый anchor | SHA-256 файла |
|---|---|---|
| `responses/response.go` — `func (r *ResponseService) NewStreaming` | [L78](https://github.com/openai/openai-go/blob/52e95a974582ebd8d3b23f349e1bcdbbb899c0ac/responses/response.go#L78) | `2222dd5f21fd51d94aefac6162687658759e5e2e471ccebc6aaf113660a7b89e` |
| `packages/ssestream/ssestream.go` — `func (s *Stream[T]) Next()` | [L191](https://github.com/openai/openai-go/blob/52e95a974582ebd8d3b23f349e1bcdbbb899c0ac/packages/ssestream/ssestream.go#L191) | `b9323be5b128a72c298c6766175e32664a77a6120b6ae18a4411cf307a6e039c` |
| `packages/ssestream/ssestream.go` — `func (s *Stream[T]) Err()` | [L247](https://github.com/openai/openai-go/blob/52e95a974582ebd8d3b23f349e1bcdbbb899c0ac/packages/ssestream/ssestream.go#L247) | `b9323be5b128a72c298c6766175e32664a77a6120b6ae18a4411cf307a6e039c` |
| `internal/requestconfig/requestconfig.go` — `func shouldRetry` | [L385](https://github.com/openai/openai-go/blob/52e95a974582ebd8d3b23f349e1bcdbbb899c0ac/internal/requestconfig/requestconfig.go#L385) | `cc6a1622cf9c85331ee0b16c7ab80cfb579ac5c9202c8fecf29600cc80703111` |

### openai/codex

Commit: `8e694e955ae02ca737230a5468c55d5847074072`. Commit time: `2026-09-07T22:11:52Z`. Retrieval UTC: `2026-09-07T23:06:23.177070+00:00`.

| Файл / символ | Неизменяемый anchor | SHA-256 файла |
|---|---|---|
| `codex-rs/core/src/tools/spec_plan.rs` — `pub(crate) fn build_tool_router` | [L125](https://github.com/openai/codex/blob/8e694e955ae02ca737230a5468c55d5847074072/codex-rs/core/src/tools/spec_plan.rs#L125) | `451622e76c45dd1585318c200fdee9a00d7aaf785d4a540facca1010146307b7` |
| `codex-rs/core/src/tools/spec_plan.rs` — `fn add_core_tool_sources` | [L974](https://github.com/openai/codex/blob/8e694e955ae02ca737230a5468c55d5847074072/codex-rs/core/src/tools/spec_plan.rs#L974) | `451622e76c45dd1585318c200fdee9a00d7aaf785d4a540facca1010146307b7` |

### anthropics/claude-agent-sdk-python

Commit: `efd4d865ef1795daffee3cd24cce45307aed8a51`. Commit time: `2026-09-06T02:55:08Z`. Retrieval UTC: `2026-09-07T23:06:02.240559+00:00`.

| Файл / символ | Неизменяемый anchor | SHA-256 файла |
|---|---|---|
| `src/claude_agent_sdk/types.py` — `class ClaudeAgentOptions` | [L1941](https://github.com/anthropics/claude-agent-sdk-python/blob/efd4d865ef1795daffee3cd24cce45307aed8a51/src/claude_agent_sdk/types.py#L1941) | `49e6a4ca6155ad9b245133d138516d9269bbb3aad2eb21311d02d77d75bca86a` |
| `src/claude_agent_sdk/_internal/transport/subprocess_cli.py` — `class SubprocessCLITransport` | [L216](https://github.com/anthropics/claude-agent-sdk-python/blob/efd4d865ef1795daffee3cd24cce45307aed8a51/src/claude_agent_sdk/_internal/transport/subprocess_cli.py#L216) | `748227e42cb9802d7316fabc836428d69bd219b63ef1b2f9f8f7a86a72a03e45` |
| `src/claude_agent_sdk/_internal/transport/subprocess_cli.py` — `def _build_command` | [L562](https://github.com/anthropics/claude-agent-sdk-python/blob/efd4d865ef1795daffee3cd24cce45307aed8a51/src/claude_agent_sdk/_internal/transport/subprocess_cli.py#L562) | `748227e42cb9802d7316fabc836428d69bd219b63ef1b2f9f8f7a86a72a03e45` |

### google-gemini/gemini-cli

Commit: `85aca163f6c73ac6ce380b5447359146b8adcae4`. Commit time: `2026-09-04T18:05:05Z`. Retrieval UTC: `2026-09-07T23:06:19.478716+00:00`.

| Файл / символ | Неизменяемый anchor | SHA-256 файла |
|---|---|---|
| `packages/core/src/core/contentGenerator.ts` — `export async function createContentGenerator(` | [L210](https://github.com/google-gemini/gemini-cli/blob/85aca163f6c73ac6ce380b5447359146b8adcae4/packages/core/src/core/contentGenerator.ts#L210) | `7a652e3c778c372eac565def5d7b31761025d5c80d90c4efebcddc4d50bee8a7` |

## Официальные страницы: сохранённые bytes

Для страниц без явной версии авторитетен факт чтения на указанную дату, а не предположение о дате действия договора. Прочитаны релевантные разделы; примеры кода, навигация и остальные разделы не рассматриваются как самостоятельное доказательство. `.raw` — технический снимок под `.temp/provider-portability/docs/`; hashes позволяют обнаружить изменение, но не заверяют авторство поставщика.

| Снимок | Официальный URL после redirects | Retrieval UTC | SHA-256 |
|---|---|---|---|
| `openai-auth` | [openai-auth](https://learn.chatgpt.com/docs/auth.md) | `2026-09-07T23:07:47.394903+00:00` | `7e60e75b7efffc50de8ba9488029d8be235cd9a423520fb5f269215616d7914d` |
| `openai-app-server` | [openai-app-server](https://learn.chatgpt.com/docs/app-server.md) | `2026-09-07T23:07:47.395427+00:00` | `a72a5c88ab05ab9737ec28b432708f2776f696be48eae09ee39c02dd2f9480e0` |
| `claude-legal` | [claude-legal](https://code.claude.com/docs/en/legal-and-compliance.md) | `2026-09-07T23:07:47.395665+00:00` | `4a4cc1762fb1d992a66347dcf94c60a27d328391d8074c13e8ae9d5c4182413b` |
| `claude-overview` | [claude-overview](https://code.claude.com/docs/en/agent-sdk/overview.md) | `2026-09-07T23:07:47.395803+00:00` | `97ffb20562a473292629fbfb8b8e8611dc72f8afae55a3364baf95a30340d356` |
| `claude-plan` | [claude-plan](https://support.claude.com/en/articles/15036540-use-the-claude-agent-sdk-with-your-claude-plan) | `2026-09-07T23:07:47.395947+00:00` | `1810e4105b114fa03dd736fe3fa8ab2e7aa631ac06caa3ba8df6013a6b2086a2` |
| `gemini-terms` | [gemini-terms](https://geminicli.com/docs/resources/tos-privacy/) | `2026-09-07T23:07:47.396101+00:00` | `0780a50363fcd79c6886b05bb77efc4b63d7f66937249c5b694bb01d5f3e6817` |
| `gemini-keys` | [gemini-keys](https://ai.google.dev/gemini-api/docs/api-key) | `2026-09-07T23:07:47.396250+00:00` | `7113b8718e2583a94599bd4e8b1909b91f8dcdff469119c2fb7ce720d9f6df4c` |
| `vertex-auth` | [vertex-auth](https://docs.cloud.google.com/gemini-enterprise-agent-platform/models/start/gcp-auth) | `2026-09-07T23:07:47.396375+00:00` | `affccd6beef611168f9f12a7f897a2a1ec562512e3820443694935a1cede3766` |
| `bedrock-converse` | [bedrock-converse](https://docs.aws.amazon.com/bedrock/latest/userguide/conversation-inference.html) | `2026-09-07T23:07:47.750732+00:00` | `7777d2764f6022fa5e121666c958e8c2aa1565b28f54668e06744ec74b4c054b` |
| `bedrock-access` | [bedrock-access](https://docs.aws.amazon.com/bedrock/latest/userguide/model-access.html) | `2026-09-07T23:07:47.826090+00:00` | `0327eb691e475f243e75c37259725c868f543ab64008b4d94e137ebe423bc44c` |
| `bedrock-auth` | [bedrock-auth](https://docs.aws.amazon.com/bedrock/latest/userguide/api-keys-reference.html) | `2026-09-07T23:07:48.062259+00:00` | `208b961896653679078f24ccc1fb553b19a27a00d8c66fa791461bc90040a3be` |
| `azure-responses` | [azure-responses](https://learn.microsoft.com/en-us/azure/foundry/openai/how-to/responses) | `2026-09-07T23:07:48.212754+00:00` | `264531b67ee762650528131a6fd3deafd436f02c02b11178d21b40298bd4b1cf` |
| `openrouter-routing` | [openrouter-routing](https://openrouter.ai/docs/guides/routing/provider-selection) | `2026-09-07T23:07:48.234248+00:00` | `1640b2cf268ae9df4b21cdeacb7b4de0128b5b411b73f41de163e80fb745096e` |
| `deepseek-api` | [deepseek-api](https://api-docs.deepseek.com/quick_start/pricing) | `2026-09-07T23:07:48.489138+00:00` | `fc590e5b2cc856c798d46314828dd790320e177317121a1864ef5428991d12d7` |
| `deepseek-tools` | [deepseek-tools](https://api-docs.deepseek.com/guides/tool_calls/) | `2026-09-07T23:07:48.619342+00:00` | `41420d8609a15ff13afd5b82a66ea1b2a5440a59787718ade7f48230b660bcfa` |
| `dashscope-api` | [dashscope-api](https://www.alibabacloud.com/help/en/model-studio/compatibility-of-openai-with-dashscope) | `2026-09-07T23:07:48.710183+00:00` | `7cf5d4366b3f2487e4a2da693e44127766557f15b7b86e3d1fc485fcb6cc5357` |
| `dashscope-plan` | [dashscope-plan](https://www.alibabacloud.com/help/en/model-studio/token-plan-overview) | `2026-09-07T23:07:48.738402+00:00` | `f1157a3c61441cda69bdd3941a0ac0dce5735a5afb33f993af4039260b617ded` |
| `dashscope-faq` | [dashscope-faq](https://www.alibabacloud.com/help/en/model-studio/coding-plan-faq) | `2026-09-07T23:07:49.173583+00:00` | `c224710e057d7606ecbddc6fe70f9fc3681ef1df473eea5f93c5250fb31223d7` |
| `kimi-code` | [kimi-code](https://www.kimi.com/en/help/kimi-code/membership-guide) | `2026-09-07T23:07:49.286281+00:00` | `7bebc9da76cc37b5e14fa1b7ce81526c4904e75f509a549bd46b39984de6c490` |
| `kimi-api` | [kimi-api](https://www.kimi.com/en/help/kimi-api/api-overview) | `2026-09-07T23:07:49.366167+00:00` | `a7083b6384a7927b0c396e16eb0b01755f554c1dd673eb3c4ea5936fa1e4a7cd` |
| `kimi-terms` | [kimi-terms](https://platform.kimi.com/docs/agreement/modeluse) | `2026-09-07T23:07:49.651933+00:00` | `fe343a5672be5cf064ab5caf4aaa0eed125a16598338ce6d5a24d06dcc117205` |
| `ollama-compat` | [ollama-compat](https://docs.ollama.com/api/openai-compatibility) | `2026-09-07T23:07:49.841006+00:00` | `e25a70d0b8ee9b08488391fe75b4af40923e8e6c4c3e6db06943522a10689a7e` |
| `ollama-auth` | [ollama-auth](https://docs.ollama.com/api/authentication) | `2026-09-07T23:07:50.315741+00:00` | `474f1b3c00a59fb77d900d2921688e426a781d7b66b164eb8f3dd7fbf01128b9` |
| `google-signatures` | [google-signatures](https://ai.google.dev/gemini-api/docs/thought-signatures) | `2026-09-07T23:07:50.340469+00:00` | `4a1b95ff8a9526b0e7c36f16c2bb466ba075fbaada9a95c16fb82560d09a8f32` |
| `claude-stream` | [claude-stream](https://platform.claude.com/docs/en/build-with-claude/streaming) | `2026-09-07T23:07:50.557232+00:00` | `2651af7af22d05681cb4acff21454dd6661e3bf7c3b1bf3d0b607ff4d94ce9bf` |
| `claude-cache` | [claude-cache](https://platform.claude.com/docs/en/build-with-claude/prompt-caching) | `2026-09-07T23:07:50.820457+00:00` | `030392a6e53189007fd678c8f55b8b9724839f253ab98f2f1ae2fb5301467d65` |
| `openai-background` | [openai-background](https://developers.openai.com/api/docs/guides/background.md) | `2026-09-07T23:07:51.206332+00:00` | `930a8e678465b57e47440dc18ce4ea63bd7226b3b5f0396916f6ab1d41cd3747` |
| `openai-function` | [openai-function](https://developers.openai.com/api/docs/guides/function-calling.md) | `2026-09-07T23:07:51.495921+00:00` | `e564e8dddb67d4cdf2ea50720c7e933bc5ae74f81171ea3e7bf33f9cb12a0b78` |

Дополнительно фактически прочитаны через web tool (локальный byte hash не установлен):

- [Claude API authentication](https://platform.claude.com/docs/en/manage-claude/authentication): identity keys, workspace, WIF.
- [Gemini thinking](https://ai.google.dev/gemini-api/docs/thinking): signature и streaming delta types; старый thought-signatures URL теперь только перенаправляет читателя.
- [Alibaba Token Plan blog](https://modelstudio.alibabacloud.com/intl/blog/model-studio-token-plan-individual/): запрет automated backends, конфликт редакций со справочником.
- [Gemini CLI authentication](https://geminicli.com/docs/get-started/authentication/): способы аутентификации CLI.
- [OpenRouter API overview](https://openrouter.ai/docs/api_reference/overview) и [BYOK](https://openrouter.ai/docs/guides/overview/auth/byok): API/gateway, shared capacity fallback, отдельный учёт BYOK.
- [Kimi Hermes integration](https://www.kimi.com/code/docs/en/third-party-tools/hermes.html): официальный third-party API-key сценарий.

У этих web-чтений дата 2026-09-08 по локальному времени. Не утверждается сохранение полного HTML. Неудачный дополнительный urllib fetch Gemini thinking вернул HTTP 403 (процесс exit 1); независимое web-чтение страницы было успешным. Это ошибка одного канала получения, не отсутствие документа.

## Локальные входы

Origins и HEAD прочитаны до использования. Чужие working-tree изменения не читались как authoritative source и не изменялись. Remote freshness соседних репозиториев не проверялась; snapshots получены из указанных локальных commits.

| Репозиторий | Origin | Локальный commit | Working tree при проверке |
|---|---|---|---|
| curator-agent-runtime | `git@github.com:relux-works/curator-agent-runtime.git` | `da759b8f3d366f31e5bd42934f6b5ecd1d01ac3f` | нечистый: 1 строк status (чужие изменения сохранены) |
| apiary-docs | `git@github.com:relux-works/apiary-docs.git` | `e4249a6193c0f2730e7cffaea6b4907c0a7e80a9` | чистый |
| curator | `https://github.com/relux-works/curator.git` | `a66eec88fa4dfb8f3ca098f594f6e48af57a6835` | нечистый: 49 строк status (чужие изменения сохранены) |
| curator-spec | `https://github.com/relux-works/curator-spec.git` | `87a0d0060bad64ab883d007dcdf35df7485368bf` | чистый |
| skill-project-management | `git@github.com:relux-works/skill-project-management.git` | `faa6ff96b6885c6db309b927b047ab600b19f423` | нечистый: 10 строк status (чужие изменения сохранены) |

Содержательно использованы:

- `apiary-docs/paper/paper.tex`, аннотация, строка 58: разделение inference capacity и полномочий. [Pin](https://github.com/relux-works/apiary-docs/blob/e4249a6193c0f2730e7cffaea6b4907c0a7e80a9/paper/paper.tex#L58).
- `curator-spec/protocol/assurance.md`, разделы 2–3, строки 19–79: host execution provider и typed receipts. [Pin](https://github.com/relux-works/curator-spec/blob/87a0d0060bad64ab883d007dcdf35df7485368bf/protocol/assurance.md#L19).
- README `curator` использован только для ориентации в установленном tooling и различении runtime delivery / execution assurance. `skill-project-management` — role workflow по установленному SKILL.md; его runtime-код в этом исследовании не обследован.

## Диагностика получения и проверки

- `task-board m set_status(...)`: exit 0; CLI readiness `task-board --version` сохранён в `.temp/provider-portability/readiness-01.log`.
- `python3 fetch_sources.py`: exit 0 процесса, но initial manifest содержит **частичный отказ** Pi: HTTP 404 для отсутствующего `src/stream.ts`; это не объявляется полной успешной загрузкой. Используемые Pi provider/types файлы сохранились, реальные protocol paths обнаружены по pinned tree и отдельно получены в `extra-manifest.json`.
- `python3 fetch_docs.py`: exit 0; 28 из 28 указанных HTTP downloads вернули 200. Это проверка получения bytes, не 28 проверенных runtime возможностей.
- Первоначальный поиск по необязательным отсутствующим skill directories возвращал exit 2; последующий поиск существующего worktree без найденных SKILL/AGENTS — exit 1. Это диагностика поиска, не runtime gate; использованы явно назначенные global skills.
- `git show HEAD:path` для трёх локальных snapshots: каждый exit 0. Git origin/head/status subprocesses: каждый exit 0, подробности `.temp/provider-portability/local-repos.json`.
- Проверки документации и точных anchors выполняются отдельно скриптом `.temp/provider-portability/verify_report.py`; результат и действительные exit codes записываются в logbook. Runtime build/tests не применимы к этому delta.

## Повторное получение

Для каждого source anchor использовать GitHub raw URL с тем же полным SHA и путём; проверить SHA-256 из таблицы. Не запускать скачанное содержимое. Для web страниц сохранить текущие bytes отдельно и сравнить hash: расхождение означает новую редакцию/рендер, не автоматически ошибку прежнего вывода. Политические утверждения перепроверять по действующей официальной странице и договору.
