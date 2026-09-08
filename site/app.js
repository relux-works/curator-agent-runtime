(function () {
  'use strict';
  const routes = ['overview','profiles','skills','models','protocol','scenarios','assurance','roadmap','diagrams','library'];
  function normalizeRoute(value) { return routes.includes(value) ? value : 'overview'; }
  function boundedStep(index, count) { return Math.max(0, Math.min(Math.max(0, count - 1), Number.isFinite(index) ? Math.trunc(index) : 0)); }
  function findResources(resources, query, category) {
    const terms = String(query || '').toLocaleLowerCase('ru').trim().split(/\s+/).filter(Boolean);
    return resources.filter(function (doc) {
      if (category && category !== 'all' && doc.category !== category) return false;
      const haystack = (doc.title + ' ' + doc.path + ' ' + (doc.text || '')).toLocaleLowerCase('ru');
      return terms.every(function (term) { return haystack.includes(term); });
    });
  }
  function escapeHTML(value) { return String(value == null ? '' : value).replace(/[&<>"']/g, function (c) { return {'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]; }); }
  if (typeof module !== 'undefined' && module.exports) module.exports = { normalizeRoute, boundedStep, findResources, escapeHTML, routes };
  if (typeof document === 'undefined') return;

  const D = JSON.parse(document.getElementById('guide-data').textContent);
  const state = { route:normalizeRoute(location.hash.slice(1)), profile:'worker', node:'core', lifecycle:0, operation:'exec', scenario:0, step:0, libraryMode:'documents', query:'', category:'all' };
  const main = document.getElementById('main');
  const reader = document.getElementById('reader');
  const body = document.getElementById('reader-body');
  let lastFocus = null;
  let queryTimer = 0;
  let readerTrail = [];
  let readerGeneration = 0;
  const E = escapeHTML;
  function code(text) { return '<code>' + E(text) + '</code>'; }
  function formatted(text) {
    return String(text).split(String.fromCharCode(96)).map(function (part, index) { return index % 2 ? code(part) : E(part); }).join('');
  }
  function source(path, label, anchor) {
    return '<button class="source-link" data-doc="' + E(path) + '"' + (anchor ? ' data-anchor="' + E(anchor) + '"' : '') + '>' + E(label || 'Читать источник') + ' <span aria-hidden="true">↗</span></button>';
  }
  function heading(kicker, title, text, stat) {
    return '<section class="page-heading"><div><span class="eyebrow">' + E(kicker) + '</span><h1>' + E(title) + '</h1><p>' + E(text) + '</p></div>' + (stat ? '<div class="heading-stat"><strong>' + E(stat[0]) + '</strong>' + E(stat[1]) + '</div>' : '') + '</section>';
  }
  function segmented(items, kind, selected) {
    return '<div class="segmented" role="group" aria-label="' + E(kind === 'profile' ? 'Профиль ноды' : kind === 'library' ? 'Вид библиотеки' : 'Операция tool') + '">' + items.map(function (pair) {
      return '<button data-' + kind + '="' + E(pair[0]) + '" aria-pressed="' + (selected === pair[0]) + '">' + E(pair[1]) + '</button>';
    }).join('') + '</div>';
  }
  function sectionTitle(title, note) { return '<div class="section-heading"><h2>' + E(title) + '</h2>' + (note ? '<p>' + E(note) + '</p>' : '') + '</div>'; }
  function badge(label, type) { return '<span class="badge ' + E(type || '') + '">' + E(label) + '</span>'; }
  function mapHTML() {
    const nodes = D.overview.nodes.map(function (node) {
      const title = node.id === 'tool' && state.profile === 'orchestrator' ? 'Tool-skills' : node.title;
      const label = node.id === 'tool' && state.profile === 'orchestrator' ? 'tasks · communications · sandboxes' : node.label;
      return '<button class="node' + (node.id === state.node ? ' active' : '') + '" data-node="' + E(node.id) + '" data-kind="' + E(node.kind) + '" aria-pressed="' + (node.id === state.node) + '" style="left:' + (node.x / 12) + '%;top:' + (node.y / 4.5) + '%"><span class="node-name">' + E(title) + '</span><span class="node-label">' + E(label) + '</span></button>';
    }).join('');
    const edges = D.overview.edges.map(function (edge) {
      return '<path class="edge ' + E(edge[3] === 'authority' ? 'authority' : '') + '" data-edge-a="' + E(edge[0]) + '" data-edge-b="' + E(edge[1]) + '" d="' + E(edge[2]) + '" marker-end="url(#arrow)"/>';
    }).join('');
    return '<div class="topology-scroll"><div class="topology" role="group" aria-label="Интерактивная карта компонентов Apiary">' +
      '<div class="domain local"><span class="domain-label" id="local-domain-label">' + (state.profile === 'worker' ? 'ХОСТ УЧАСТНИКА' : 'ХОСТ ОРКЕСТРАТОРА') + '</span></div><div class="domain bridge"><span class="domain-label">USER SPACE</span></div><div class="domain project"><span class="domain-label">ПРОЕКТ</span></div>' +
      '<svg class="connections" viewBox="0 0 1200 450" preserveAspectRatio="none" aria-hidden="true"><defs><marker id="arrow" viewBox="0 0 10 10" refX="8" refY="5" markerWidth="5" markerHeight="5" orient="auto-start-reverse"><path d="M 0 0 L 10 5 L 0 10 z" fill="#99afbf"/></marker></defs>' + edges + '</svg>' + nodes + '</div></div>';
  }
  function renderInspector() {
    const node = D.overview.nodes.find(function (n) { return n.id === state.node; }) || D.overview.nodes[0];
    const slot = document.getElementById('module-inspector');
    if (!slot) return;
    slot.innerHTML = '<div><span class="eyebrow">Выбранный компонент</span><h3>' + E(node.title) + '</h3>' + badge(node.owner, node.kind === 'authority' ? 'blue' : '') + '</div><div><p>' + E(node.summary) + '</p>' + source(node.source,'Подробнее о компоненте') + '<div class="inspector-details"><div><div class="meta-label">Состояние</div><p>' + E(node.state) + '</p></div><div><div class="meta-label">Граница полномочий</div><p>' + E(node.boundary) + '</p></div></div><span class="mono section-note">' + E(node.ports) + '</span></div>';
    main.querySelectorAll('[data-node]').forEach(function (button) { const active = button.dataset.node === state.node; button.classList.toggle('active', active); button.setAttribute('aria-pressed', String(active)); });
    main.querySelectorAll('path.edge').forEach(function (path) { path.classList.toggle('active', path.dataset.edgeA === state.node || path.dataset.edgeB === state.node); });
  }
  function renderOverview() {
    return heading('01 / Устройство системы','Как устроен улей','Один минимальный цикл модели. Два профиля нод. Отдельный контур, который допускает, исполняет и проверяет работу.', ['01','общее ядро']) +
      '<section class="panel"><div class="panel-head"><div><h2>Карта компонентов</h2><small>Выберите узел, чтобы увидеть его ответственность и полномочия</small></div>' + segmented([['worker','Worker'],['orchestrator','Orchestrator']], 'profile', state.profile) + '</div>' + mapHTML() +
      '<div class="map-legend"><span><i class="legend-mark amber"></i>Выбранные связи</span><span><i class="legend-mark blue"></i>Допуск authority</span><span><i class="legend-mark"></i>Данные и вызовы</span><span>Упрощённая функциональная карта</span></div><div class="module-inspector" id="module-inspector" aria-live="polite"></div></section>' +
      sectionTitle('Три опоры архитектуры','Модель предлагает; разрешение и результат проверяются отдельно') +
      '<div class="grid-3"><article class="card"><span class="eyebrow">Минимальность</span><h3>В ядре — только общий цикл</h3><p>Tools, provider codecs, XMPP и execution backend подключаются через явные порты. Малое ядро не скрывает размер полного TCB.</p>' + source('docs/apiary/kernel.md','Ядро и процессы') + '</article><article class="card"><span class="eyebrow">Полномочия</span><h3>Один tool, ограниченный scope</h3><p>Worker получает central. Доступ сужен задачей, sandbox, сроком, бюджетом и sinks, а не только именем функции.</p>' + source('docs/apiary/tool-skills.md','Контракт tool-skills') + '</article><article class="card"><span class="eyebrow">Результат</span><h3>Приняты именно проверенные bytes</h3><p>Review, тесты и публикация связаны с одним candidate tuple. Смена target требует пересборки и новой приёмки.</p>' + source('docs/apiary/execution.md','Исполнение и интеграция') + '</article></div>' +
      '<div class="quote-note">Это информативный проект архитектуры. Работающий runtime, provider qualification и performance benchmarks в этих материалах не заявлены.</div>';
  }
  function renderProfiles() {
    const rows = [['exports','Модель видит'],['authority','Получает полномочия'],['completion','Завершение работы'],['local','Локальная среда']];
    return heading('02 / Профили исполнения','Две ноды. Один движок.','Профиль определяет установленные bindings и доступную authority. Reducer, history и model ports остаются общими.') +
      '<div class="grid-2">' + ['worker','orchestrator'].map(function (key) { const p = D.profiles[key]; return '<article class="card"><span class="eyebrow">' + E(p.tag) + '</span><h2>' + E(p.name) + '</h2><p>' + E(p.lead) + '</p>' + source(p.source,'Описание профиля') + '</article>'; }).join('') + '</div>' +
      sectionTitle('Что меняется между профилями') + '<div class="table-wrap"><table class="data-table"><thead><tr><th>Граница</th><th>Worker</th><th>Orchestrator</th></tr></thead><tbody>' + rows.map(function (row) { return '<tr><td>' + E(row[1]) + '</td><td>' + E(D.profiles.worker[row[0]]) + '</td><td>' + E(D.profiles.orchestrator[row[0]]) + '</td></tr>'; }).join('') + '</tbody></table></div>' +
      sectionTitle('Общая последовательность') + '<div class="stack-list">' +
      [['Контекст','Построить проекцию из проверенного неизменяемого store.'],['Модель','Получить события через ModelPort; дождаться успешного terminal response.'],['Допуск','Проверить canonical input, binding, plan, scope и бюджет.'],['Исполнение','Передать запрос broker и получить bounded observation или operation ref.'],['Продолжение','Сохранить наблюдение и продолжить turn; завершение модели не равно acceptance задачи.']].map(function (r,i) { return '<div class="stack-row"><span class="step-number">0' + (i+1) + '</span><h3>' + E(r[0]) + '</h3><p>' + E(r[1]) + '</p></div>'; }).join('') + '</div>' +
      '<div class="quote-note">Delegable authority и executable authority различаются. Orchestrator может делегировать ограниченный central worker, не получая собственный свободный shell.</div>' + source('docs/apiary/kernel.md','Порты Go и task-board adapter');
  }
  function renderSkills() {
    return heading('03 / Расширяемость','Tools живут в user space','Curator поставляет пакеты. Compiler превращает выбранную closure в неизменяемый SessionPlan, а broker проверяет его исполнение.') +
      '<section class="panel"><div class="panel-head"><h2>Путь tool-skill</h2>' + badge('Нажмите на этап','amber') + '</div><div class="lifecycle">' + D.lifecycle.map(function (item,i) { return '<button data-lifecycle="' + i + '" aria-pressed="' + (state.lifecycle === i) + '"><span>0' + (i+1) + '</span>' + E(item[0]) + '</button>'; }).join('') + '</div><div class="lifecycle-detail" id="lifecycle-detail" aria-live="polite"></div></section>' +
      sectionTitle('Единственный tool worker','Узкое имя не маскирует широкий task-local grant') +
      '<section class="panel"><div class="panel-head"><h2>central</h2>' + segmented([['exec','exec'],['poll','poll'],['cancel','cancel']], 'operation', state.operation) + '</div><div class="lifecycle-detail" id="operation-detail" aria-live="polite"></div></section>' +
      sectionTitle('Разные виды расширений') + '<div class="grid-3"><article class="card"><h3>Model-facing tool-skills</h3><p>Установленные exports с явной schema, effect contract, binding и capability envelope. Их выбор закрепляется в plan.</p></article><article class="card"><h3>Host extensions</h3><p>Provider/auth adapters, XMPP, sandbox drivers и signer policy. Privileges отдельно; проектный Skillfile не выбирает credential holder.</p></article><article class="card"><h3>MCP wrappers</h3><p>MCP остаётся во внешней confined обёртке с фиксированным catalog/schema digest. Динамический каталог не меняет активную epoch.</p></article></div>' +
      '<div class="quote-note">Package integrity, build identity, audit status, grant и фактическое enforcement — разные доказательства. Одно не заменяет другое.</div>' +
      source('docs/apiary/tool-skills.md','Descriptor, WorkspaceRef и process protocol') + ' · ' + source('diagrams/apiary/tool-skill-activation.svg','Полная схема активации');
  }
  function renderSkillDetails() {
    const row = D.lifecycle[state.lifecycle];
    document.getElementById('lifecycle-detail').innerHTML = '<span class="eyebrow">' + E(row[0]) + '</span><h3>' + E(row[1]) + '</h3><p>' + E(row[2]) + '</p>' + source('docs/apiary/tool-skills.md','Lifecycle и epochs');
    const op = D.tool_ops[state.operation];
    document.getElementById('operation-detail').innerHTML = '<p>' + E(op.description) + '</p><pre><code>' + E(JSON.stringify(op.json,null,2)) + '</code></pre><p class="section-note">Структурная иллюстрация. Пример exec основан на проекте контракта; поля poll/cancel показывают смысл взаимодействия и не заменяют будущий freeze полной wire schema.</p>';
  }
  function renderModels() {
    return heading('04 / Inference и состояние','Модель заменяема. Границы — явны.','ModelPort не исполняет tools. Credentials, provider codecs, маршруты и их условия находятся в отдельном host domain.') +
      '<div class="grid-2"><article class="card"><span class="eyebrow">Базовый профиль</span><h2>ModelPort</h2><p>Прямой inference API или действительно локальная модель. На входе — conversation projection, tool definitions и bounds. На выходе — typed model events.</p>' + code('Describe → Generate → Cancel') + '</article><article class="card"><span class="eyebrow">Отдельная совместимость</span><h2>AgentBridge</h2><p>Запускает поддерживаемый целый агент со своим loop, tools, compaction и auth. Его нельзя объявить тем же Go-циклом или автоматически допустить в strict-worker.</p>' + code('Start → Observe → Cancel') + '</article></div>' +
      sectionTitle('Матрица маршрутов','Условия и технические наблюдения на дату исследования') + '<div class="table-wrap"><table class="data-table"><thead><tr><th>Провайдер / продукт</th><th>Интерфейс</th><th>Граница подключения</th></tr></thead><tbody>' + D.providers.map(function (r) { return '<tr><td>' + E(r[0]) + '</td><td>' + badge(r[1],r[3] === 'direct' ? 'blue' : r[3] === 'limited' ? 'red' : 'amber') + '</td><td>' + E(r[2]) + '</td></tr>'; }).join('') + '</tbody></table></div>' +
      '<p class="section-note">Wire compatibility не означает entitlement. Допуск проверяется для конкретного owner, account, tenant, endpoint, use case и data classes. Подписки не объединяются в пул credentials.</p>' + source('.research/260908_provider-portability.md','Полная provider matrix и первичные источники') +
      sectionTitle('Четыре разных состояния') + '<div class="grid-2">' +
      [['История','Canonical events с provenance и causal call/result pairs. Это основа восстановления контекста.'],['Prompt projection','Управляемая проекция под ограничения модели. Summary — derived data и не повышает найденный текст до policy.'],['Provider cache','Оптимизация внутри owner/tenant/product/model/adapter scope. Session ID не создаёт полномочия.'],['Executor state','Sandbox, process handles и незавершённые operations. Потеря model session не равна потере sandbox.']].map(function (r) { return '<article class="card"><h3>' + E(r[0]) + '</h3><p>' + E(r[1]) + '</p></article>'; }).join('') + '</div>' +
      '<div class="quote-note">До dispatch нужен полный успешный terminal response. Length, error, truncated stream или EOF без terminal не разрешают эффект, даже если partial JSON выглядит корректно.</div>' +
      source('docs/apiary/models-context.md','Streams, budgets, credentials и compaction');
  }
  function renderProtocol() {
    return heading('05 / Полномочия и сообщения','Доставка не равна исполнению','Domain protocol не зависит от транспорта. Подписанный envelope связывает issuer, audience, версию, payload и artifacts; XMPP переносит эти bytes.') +
      '<div class="grid-3"><article class="card"><span class="eyebrow">L0 · выбранный старт</span><h3>Одна логическая authority</h3><p>Validator, sequencer и ledger могут быть модулями одного сервиса. Admission сериализуется со stop state.</p></article><article class="card"><span class="eyebrow">Подписи</span><h3>Происхождение заявления</h3><p>CCJ profile, SHA-256 и Ed25519 после отдельного freeze. Keys, certificate policy, audience и replay checks обязательны.</p></article><article class="card"><span class="eyebrow">XMPP</span><h3>Подключаемая доставка</h3><p>Durable inbox/outbox и application acks поверх TLS/SASL и stream management. Relay confidentiality — отдельное допущение.</p></article></div>' +
      sectionTitle('Каждая identity отвечает на свой вопрос') + '<div class="table-wrap"><table class="data-table"><thead><tr><th>Поле</th><th>Что идентифицирует</th><th>Правило</th></tr></thead><tbody>' + D.identities.map(function (r) { return '<tr><td>' + code(r[0]) + '</td><td>' + E(r[1]) + '</td><td>' + E(r[2]) + '</td></tr>'; }).join('') + '</tbody></table></div>' +
      sectionTitle('Лестница подтверждений','Нельзя повышать смысл полученного ack') + '<div class="stack-list">' + D.acks.map(function (r,i) { return '<div class="stack-row"><span class="step-number">0' + (i+1) + '</span><div><h3>' + E(r[0]) + '</h3><p>' + E(r[1]) + '</p></div><p>' + E(r[2]) + '</p></div>'; }).join('') + '</div>' +
      '<div class="quote-note">Смена term, epoch, contract revision, sandbox generation и provider session — разные события. Один счётчик не заменяет эти привязки.</div>' +
      source('docs/apiary/authority-wire.md','Envelopes, certificates, replay и XMPP') + ' · ' + source('.research/260908_protocol-literature.md','Литература и первичные стандарты');
  }
  function renderScenarios() {
    const s = D.scenarios[state.scenario];
    state.step = boundedStep(state.step,s.steps.length);
    return heading('06 / Поведение протокола','Проследить работу по шагам','Сценарии объясняют модель протокола. Они не запускают команды и не являются результатами runtime-тестов.') +
      '<div class="inline-controls"><label for="scenario-select">Сценарий</label><select class="field" id="scenario-select">' + D.scenarios.map(function (x,i) { return '<option value="' + i + '"' + (i === state.scenario ? ' selected' : '') + '>' + E(x.name) + '</option>'; }).join('') + '</select>' + source(s.diagram,'Открыть схему') + '</div><p class="section-note">' + E(s.intro) + '</p>' +
      '<section class="panel"><div class="scenario-progress"><span style="width:' + ((state.step+1)/s.steps.length*100) + '%"></span></div><div class="scenario-layout"><nav class="scenario-steps" aria-label="Шаги сценария">' + s.steps.map(function (r,i) { return '<button class="scenario-step" data-step="' + i + '"' + (state.step === i ? ' aria-current="step"' : '') + '><span>' + (i+1) + '</span><span>' + E(r[0]) + '</span></button>'; }).join('') + '</nav><div class="scenario-content" id="scenario-content" aria-live="polite"></div></div><div class="scenario-bottom"><button class="button" data-step="' + (state.step-1) + '"' + (state.step === 0 ? ' disabled' : '') + '>← Назад</button><span class="section-note">Шаг ' + (state.step+1) + ' из ' + s.steps.length + '</span><button class="button primary" data-step="' + (state.step+1) + '"' + (state.step === s.steps.length-1 ? ' disabled' : '') + '>Далее →</button></div></section>' +
      '<p class="section-note">' + source(s.source,'Контракт и границы сценария') + '</p>';
  }
  function renderScenarioDetail() {
    const s = D.scenarios[state.scenario], row = s.steps[state.step];
    document.getElementById('scenario-content').innerHTML = '<span class="eyebrow">' + E(s.name) + ' / ' + String(state.step+1).padStart(2,'0') + '</span><h2>' + E(row[0]) + '</h2><div class="scenario-actor">' + badge(row[1],'blue') + '</div><p>' + E(row[3]) + '</p><div class="scenario-record"><div class="meta-label">Объект или переход</div>' + code(row[2]) + '</div><div class="consequence"><strong>Почему это важно</strong><p>' + E(row[4]) + '</p></div>';
  }
  function renderAssurance() {
    return heading('07 / Доказательства и ограничения','Гарантии требуют реальных границ','Модель может ошибиться, tool может солгать, host root может быть скомпрометирован. Архитектура называет доверенные компоненты и предел каждого профиля.') +
      '<div class="grid-3"><article class="card"><span class="eyebrow">Целостность</span><h3>Authority и acceptance</h3><p>Enrollment, canonicalizer, validators, ledger, key store, candidate builder и sole-writer gateway входят в соответствующий TCB.</p></article><article class="card"><span class="eyebrow">Исполнение</span><h3>Реальное confinement</h3><p>Compiler, broker, IPC, executor WAL, sandbox backend и ОС проверяются как enforcement boundary. Worktree сам по себе не изолирует код.</p></article><article class="card"><span class="eyebrow">Конфиденциальность</span><h3>Явные получатели данных</h3><p>Model-host, выбранный provider и storage administrators остаются частью допущений. Подпись не шифрует payload для relay.</p></article></div>' +
      '<div class="quote-note">Signature — provenance, не доказательство честного inference. Distinct keys — не доказательство независимых владельцев. L1 threshold signatures — не Byzantine consensus.</div>' +
      sectionTitle('21 сценарий, который система должна отклонить','Это будущая conformance matrix, а не выполненные тесты') +
      '<div class="accordion">' + D.vectors.map(function (r) { return '<details><summary><span>' + E(r.id) + ' · ' + E(r.title) + '</span></summary><div class="detail-body"><div class="meta-label">Вход и противник</div><p>' + formatted(r.entry) + '</p><div class="meta-label">Требуемое поведение</div><p>' + formatted(r.required) + '</p><div class="meta-label">Как проверить, что gate защищает границу</div><p>' + formatted(r.mutation) + '</p>' + source('docs/apiary/migration-conformance.md','Полная матрица и assumptions') + '</div></details>'; }).join('') + '</div>' +
      sectionTitle('Квалификация профилей') + '<div class="table-wrap"><table class="data-table"><thead><tr><th>Профиль</th><th>Граница</th></tr></thead><tbody>' +
      [['managed-L0','Выбранный рабочий baseline: доверенный host, отдельные principals, direct model, online permits и durable local storage.'],['hostile-code-L0','VM/microVM isolation для hostile code. Не является просто новым названием контейнера.'],['platform-runner','macOS/iOS/Android и устройства через именованные операции; full/partial assurance по capability.'],['agent-bridge-compat','Поддерживаемый целый агент, отдельные loop/account/assurance и квалификация effects.'],['federated-L1','Trusted sequencer и threshold records. Byzantine fork safety не обещается.'],['distributed-L2','Отдельный проверенный consensus substrate с явными membership и fault model.']].map(function (r) { return '<tr><td>' + E(r[0]) + '</td><td>' + E(r[1]) + '</td></tr>'; }).join('') + '</tbody></table></div>' +
      '<p class="section-note">' + source('docs/apiary/kernel.md','Полный TCB') + ' · ' + source('docs/apiary/migration-conformance.md','Assurance profiles и threat limits') + '</p>';
  }
  function renderRoadmap() {
    return heading('08 / Последовательность реализации','Сначала полезный L0. Затем расширение.','Зафиксировать контракты, собрать сквозную coding task и проверить реальные границы. Дополнительные transports, providers и distributed trust не усложняют reducer.') +
      '<div class="panel" style="padding:27px 25px 2px">' + D.roadmap.map(function (r) { return '<article class="roadmap-row"><div class="phase">' + E(r[0]) + '</div><div><h3>' + E(r[1]) + '</h3><p><strong>' + E(r[2]) + '</strong> · ' + E(r[3]) + '</p><span class="section-note">' + E(r[4]) + '</span></div></article>'; }).join('') + '</div>' +
      '<p class="section-note">Это архитектурная последовательность deliverables. Она не обозначает уже реализованные features или автоматически созданный implementation backlog.</p>' +
      sectionTitle('Что должно быть измерено') + '<div class="grid-2">' + D.experiments.map(function (r) { return '<article class="card"><span class="eyebrow">' + E(r[0]) + '</span><h3>' + E(r[1]) + '</h3><p>' + E(r[2]) + '</p></article>'; }).join('') + '</div>' +
      sectionTitle('Оставшиеся внешние входы') + '<div class="grid-3"><article class="card"><h3>Аккаунты и разрешения</h3><p>Конкретные provider routes, tenancy, billing, условия headless use case и лицензии weights.</p></article><article class="card"><h3>Владельцы и reviewers</h3><p>Enrollment и внешнее основание независимости owners, eligibility и review policy.</p></article><article class="card"><h3>Реальные runners</h3><p>Доступные hosts/devices, toolchain pins и разрешённые именованные операции.</p></article></div><p class="section-note">' + source('UNRESOLVED_QUESTIONS.md','Владельцы и критерии закрытия') + ' · ' + source('docs/apiary/migration-conformance.md','Retain / change / reject и roadmap') + '</p>';
  }
  function renderDiagrams() {
    return heading('09 / Универсальный язык схем','Атлас архитектуры','Откройте схему для увеличения. Исходные PlantUML и SVG включены в библиотеку; девять схем относятся к принятому дизайну, две — к исследованию Codex/Pi.', ['11','схем с исходниками']) +
      '<div class="diagram-grid">' + D.diagrams.map(function (diagram,i) { return '<button class="diagram-card" data-doc="' + E(diagram.path) + '"><div class="diagram-preview"><img src="' + diagram.data_uri + '" alt="' + E(diagram.title) + '" loading="lazy"></div><div class="diagram-caption"><span class="eyebrow">' + (diagram.research ? 'Исследование' : 'Схема ' + String(i+1).padStart(2,'0')) + '</span><h3>' + E(diagram.title) + '</h3><p>' + E(diagram.description) + '</p></div></button>'; }).join('') + '</div>' +
      '<div class="quote-note">Опциональный signing в ранней исследовательской схеме — историческое предложение. В принятой архитектуре signing отсутствует в model catalog и выполняется host-only компонентами.</div>' + source('diagrams/README.md','Назначение схем и provenance');
  }
  function renderLibrary() {
    return heading('10 / Доказательная база','От решения — к первоисточнику','Краткие объяснения опираются на полный корпус документов. Материалы встроены в этот HTML; внешние публикации доступны по сохранённым ссылкам.', [String(Object.values(D.documents).filter(function(d){return d.kind !== 'dir';}).length),'исходных материалов']) +
      segmented([['documents','Документы'],['repositories','Репозитории']], 'library',state.libraryMode) +
      (state.libraryMode === 'documents' ?
        '<div class="library-toolbar"><input class="field" id="library-query" type="search" placeholder="Найти понятие, модуль или документ" aria-label="Поиск по материалам" value="' + E(state.query) + '"><select class="field" id="library-category" aria-label="Группа документов"><option value="all">Все группы</option>' + D.categories.map(function (category) { return '<option' + (state.category === category ? ' selected' : '') + '>' + E(category) + '</option>'; }).join('') + '</select></div><p class="section-note" id="library-result-count" role="status"></p><div id="library-results"></div>' :
        '<div class="quote-note">Целевая выборка, не исчерпывающий аудит: 28 pinned repositories, 26 с чтением исходников, четыре закрытые среды по документации. Runtime execution: 0.</div><div class="grid-2">' +
        [['Codex и Pi','.research/260908_codex-pi.md'],['Claude Code lineage','.research/260908_claude-lineage.md'],['Go и дополнительные harnesses','.research/260908_go-and-additional-harnesses.md'],['Протоколы и литература','.research/260908_protocol-literature.md']].map(function (r) { return '<article class="card"><h3>' + E(r[0]) + '</h3>' + source(r[1],'Открыть отдельное исследование') + '</article>'; }).join('') + '</div>' +
        sectionTitle('28 репозиториев и извлечённые механизмы','D2 — связанные фрагменты; D1 — выборочное чтение; D0 — документация') +
        '<div class="research-cards">' + D.systems.map(function (system) { return '<article class="research-card"><h3><span>' + E(system.name) + '</span>' + badge(system.depth,system.depth === 'D2' ? 'blue' : '') + '</h3><p>' + E(system.adoption_recommendation) + '</p><details><summary>Наблюдение и предел доказательства</summary><p>' + E(system.matrix.core_loop) + '</p><p>' + E(system.limitations) + '</p><div class="pin mono">' + E(system.repository.sha) + '</div></details><p style="margin-top:14px">' + source('.research/260908_runtime-landscape.md',system.id + ' · исследование',system.id.toLowerCase()) + '</p></article>'; }).join('') + '</div>' +
        sectionTitle('Закрытые среды: документация, не source audit') + '<div class="grid-2">' + D.closed_environments.map(function (item) { return '<article class="card"><h3>' + E(item.name) + '</h3><p>' + E(item.architecture_consequence) + '</p>' + badge('D0 · docs-only') + '</article>'; }).join('') + '</div>') +
      '<p class="section-note">Исходный снимок: ' + code(D.source_ref.slice(0,12)) + '. Хеши и различие исходных / интегрированных inputs сохранены. ' + source('docs/apiary/current-inputs.json','Сверка provenance') + '</p>';
  }
  function updateLibrary() {
    const slot = document.getElementById('library-results');
    if (!slot) return;
    const matches = findResources(Object.values(D.documents).filter(function(d){return d.kind !== 'dir';}),state.query,state.category);
    document.getElementById('library-result-count').textContent = matches.length + ' материалов' + (state.query ? ' по запросу «' + state.query + '»' : '');
    if (!matches.length) { slot.innerHTML = '<div class="empty-state">Материалы не найдены. Попробуйте другое понятие или выберите все группы.</div>'; return; }
    slot.innerHTML = D.categories.map(function (category) {
      const group = matches.filter(function (d) { return d.category === category; });
      if (!group.length) return '';
      return '<section class="resource-group"><h2>' + E(category) + ' <span>' + group.length + '</span></h2><div class="resource-list">' + group.map(function (doc) { return '<button class="resource-row" data-doc="' + E(doc.path) + '"><span><strong>' + E(doc.title) + '</strong><small>' + E(doc.path) + '</small></span><span class="resource-ext">' + E(doc.kind.toUpperCase()) + ' ↗</span></button>'; }).join('') + '</div></section>';
    }).join('');
  }
  function render() {
    state.route = normalizeRoute(state.route);
    document.getElementById('navigation').innerHTML = D.nav.map(function (r,i) { return '<button class="nav-item" data-route="' + E(r[0]) + '"' + (state.route === r[0] ? ' aria-current="page"' : '') + '><span class="nav-index">' + String(i+1).padStart(2,'0') + '</span><span>' + E(r[1]) + '</span></button>'; }).join('');
    document.getElementById('breadcrumb-title').textContent = D.nav.find(function (r) { return r[0] === state.route; })[1];
    const views = { overview:renderOverview, profiles:renderProfiles, skills:renderSkills, models:renderModels, protocol:renderProtocol, scenarios:renderScenarios, assurance:renderAssurance, roadmap:renderRoadmap, diagrams:renderDiagrams, library:renderLibrary };
    main.innerHTML = views[state.route]();
    if (state.route === 'overview') renderInspector();
    if (state.route === 'skills') renderSkillDetails();
    if (state.route === 'scenarios') renderScenarioDetail();
    if (state.route === 'library') updateLibrary();
  }
  function navigate(route) {
    const next = normalizeRoute(route);
    if (location.hash !== '#' + next) location.hash = next;
    else { state.route = next; render(); }
    closeMenu();
  }
  function closeMenu() { const wasOpen = document.querySelector('.sidebar').classList.contains('open'); document.querySelector('.sidebar').classList.remove('open'); document.getElementById('menu-toggle').setAttribute('aria-expanded','false'); document.getElementById('menu-shade').hidden = true; if (wasOpen) document.getElementById('menu-toggle').focus({preventScroll:true}); }
  function scrollToAnchor(anchor) {
    if (!anchor) { body.scrollTop = 0; return; }
    const target = Array.from(body.querySelectorAll('[id]')).find(function (el) { return el.id === anchor; });
    if (target) body.scrollTop = target.offsetTop - body.offsetTop - 18;
  }
  function openDocument(path, anchor, restoring) {
    if (!Object.prototype.hasOwnProperty.call(D.documents,path)) return;
    const doc = D.documents[path];
    if (!doc) return;
    if (!reader.open) { lastFocus = document.activeElement; readerTrail = []; }
    if (!restoring) {
      if (readerTrail.length) readerTrail[readerTrail.length-1].scroll = body.scrollTop;
      readerTrail.push({path:path,anchor:anchor || '',scroll:null});
      if (readerTrail.length > 64) readerTrail.shift();
    }
    const generation = ++readerGeneration;
    const priorScroll = restoring && readerTrail.length ? readerTrail[readerTrail.length-1].scroll : null;
    document.getElementById('reader-back').disabled = readerTrail.length < 2;
    document.getElementById('reader-title').textContent = doc.title;
    document.getElementById('reader-category').textContent = doc.category;
    document.getElementById('reader-path').textContent = doc.path;
    document.getElementById('reader-original').href = doc.url;
    const isDiagram = doc.kind === 'svg';
    reader.classList.toggle('diagram-mode',isDiagram);
    document.getElementById('diagram-controls').hidden = !isDiagram;
    if (isDiagram) {
      body.innerHTML = '<img class="diagram-large" id="diagram-large" src="' + doc.data_uri + '" alt="' + E(doc.title) + '" style="width:100%">';
      document.getElementById('reader-toc').innerHTML = '';
      document.getElementById('diagram-zoom').value = '100';
      document.getElementById('zoom-value').value = '100%';
    } else {
      body.innerHTML = doc.html;
      const headings = Array.from(body.querySelectorAll('h2[id],h3[id]'));
      document.getElementById('reader-toc').innerHTML = '<span class="eyebrow" style="padding:0 8px 12px">В документе</span>' + headings.map(function (h) { return '<button data-scroll="' + E(h.id) + '" class="' + (h.tagName === 'H3' ? 'indent' : '') + '">' + E(h.textContent) + '</button>'; }).join('');
    }
    if (!reader.open) reader.showModal();
    requestAnimationFrame(function () {
      function position() {
        if (generation !== readerGeneration || !reader.open) return;
        if (priorScroll != null) body.scrollTop = priorScroll;
        else scrollToAnchor(anchor || '');
      }
      position();
      if (anchor || restoring) {
        Promise.allSettled(Array.from(body.querySelectorAll('img')).map(function (image) { return image.decode ? image.decode() : Promise.resolve(); })).then(position);
      }
    });
  }
  function closeReader() { reader.close(); if (lastFocus && lastFocus.isConnected) lastFocus.focus({preventScroll:true}); }
  document.addEventListener('click',function (event) {
    const target = event.target && typeof event.target.closest === 'function' ? event.target.closest('[data-doc],button,a') : null;
    if (!target) return;
    if (target.classList.contains('skip-link')) { event.preventDefault(); main.focus({preventScroll:true}); main.scrollIntoView({block:'start'}); return; }
    if (target.dataset.doc) { event.preventDefault(); openDocument(target.dataset.doc,target.dataset.anchor || ''); return; }
    if (target.dataset.scroll) { event.preventDefault(); scrollToAnchor(target.dataset.scroll); return; }
    if (target.dataset.route) { event.preventDefault(); navigate(target.dataset.route); return; }
    if (target.dataset.node) { state.node = target.dataset.node; renderInspector(); return; }
    if (target.dataset.profile) {
      state.profile = target.dataset.profile; render();
      const selected = main.querySelector('[data-profile="' + state.profile + '"]'); if (selected) selected.focus({preventScroll:true}); return;
    }
    if (target.dataset.lifecycle != null) {
      state.lifecycle = boundedStep(Number(target.dataset.lifecycle),D.lifecycle.length);
      main.querySelectorAll('[data-lifecycle]').forEach(function (b) { b.setAttribute('aria-pressed',String(Number(b.dataset.lifecycle) === state.lifecycle)); }); renderSkillDetails(); return;
    }
    if (target.dataset.operation) {
      state.operation = target.dataset.operation;
      main.querySelectorAll('[data-operation]').forEach(function (b) { b.setAttribute('aria-pressed',String(b.dataset.operation === state.operation)); }); renderSkillDetails(); return;
    }
    if (target.dataset.step != null && !target.disabled) {
      const action = target.closest('.scenario-bottom') ? (target.classList.contains('primary') ? 'next' : 'previous') : 'step';
      state.step = boundedStep(Number(target.dataset.step),D.scenarios[state.scenario].steps.length); render();
      let current = action === 'next' ? main.querySelector('.scenario-bottom .primary:not(:disabled)') : action === 'previous' ? main.querySelector('.scenario-bottom .button:not(.primary):not(:disabled)') : null;
      if (!current) current = main.querySelector('[data-step="' + state.step + '"]');
      if (current) current.focus({preventScroll:true}); return;
    }
    if (target.dataset.library) { state.libraryMode = target.dataset.library; render(); main.querySelector('[data-library="' + state.libraryMode + '"]').focus({preventScroll:true}); return; }
  });
  document.addEventListener('change',function (event) {
    if (event.target.id === 'scenario-select') { state.scenario = boundedStep(Number(event.target.value),D.scenarios.length); state.step = 0; render(); document.getElementById('scenario-select').focus({preventScroll:true}); }
    if (event.target.id === 'library-category') { state.category = event.target.value; updateLibrary(); }
  });
  document.addEventListener('input',function (event) {
    if (event.target.id === 'library-query') { state.query = event.target.value; clearTimeout(queryTimer); queryTimer = setTimeout(updateLibrary,120); }
    if (event.target.id === 'diagram-zoom') {
      const zoom = Number(event.target.value); const image = document.getElementById('diagram-large');
      if (image) image.style.width = zoom + '%'; document.getElementById('zoom-value').value = zoom + '%';
    }
  });
  document.getElementById('reader-close').addEventListener('click',closeReader);
  document.getElementById('reader-back').addEventListener('click',function () {
    if (readerTrail.length < 2) return;
    readerTrail.pop();
    const previous = readerTrail[readerTrail.length-1];
    openDocument(previous.path,previous.anchor,true);
  });
  reader.addEventListener('click',function (event) { if (event.target === reader) { const box = reader.getBoundingClientRect(); if (event.clientX < box.left || event.clientX > box.right || event.clientY < box.top || event.clientY > box.bottom) closeReader(); } });
  reader.addEventListener('close',function () { readerGeneration += 1; readerTrail = []; if (lastFocus && lastFocus.isConnected) lastFocus.focus({preventScroll:true}); });
  document.getElementById('menu-toggle').addEventListener('click',function () { const open = document.querySelector('.sidebar').classList.toggle('open'); this.setAttribute('aria-expanded',String(open)); document.getElementById('menu-shade').hidden = !open; if (open) document.querySelector('.nav-item[aria-current="page"]').focus({preventScroll:true}); });
  document.getElementById('menu-shade').addEventListener('click',closeMenu);
  document.addEventListener('keydown',function (event) { if (event.key === 'Escape') closeMenu(); });
  window.addEventListener('hashchange',function () { state.route = normalizeRoute(location.hash.slice(1)); render(); closeMenu(); main.focus({preventScroll:true}); window.scrollTo({top:0,behavior:'instant'}); });
  render();
})();
