# Журнал исследования TASK-260908-2x6kuv

2026-09-08. Основной отчёт: `.research/260908_claude-lineage.md`.

- Подтверждён redirect instructkr/claw-code → ultraworkers/claw-code; актуальный README позиционирует проект как museum exhibit, а не production product.
- Для shawnchen732 snapshot GitHub API сообщает archived=false. Исходный lead исправлен; код snapshot не клонировался.
- Статически проверенные 4/4 C++ implementation bodies являются migration stubs. Полнота реализации всего repo не измерялась.
- Child policy Claw создаётся с DangerFullAccess; claux наследует policy. Отдельный transcript/thread не доказывает filesystem isolation.
- В claux ошибки permission-hook plugins логируются и исключаются из verdicts; обязательный gate должен иметь другой fail-closed контракт.
- OMA технически содержателен, но leak lineage не подтверждена project-authored свидетельством с проверенной принадлежностью автора.
- Пять HTTP-загрузок официальных markdown endpoints вернули 403; HTML прочитан через web tool. Обходов нет.

## Проверка

`python3 .temp/claude-lineage/verify_report.py`: exit 0; 37/37 code permalinks разрешены в локальных snapshots, 7 SHA совпадают, копия вне worktree совпадает. Проверка дополнена whitespace assertions для самого нового файла.

`git diff --check -- .research/260908_claude-lineage.md`: exit 0. Ограничение: новый файл untracked, поэтому основная содержательная проверка whitespace выполняется Python-скриптом, а не diff --check.

Все семь shallow clones: exit 0. Процесс metadata fetch: exit 0 с обработанными HTTP 403 (это не успешные markdown fetch). Начальный поиск отсутствующих skill directories: exit 2; skill прочитан по указанному абсолютному пути.

Никакие сторонние tests/builds/install scripts не выполнялись. Истинность prose проверена авторским self-review по прочитанным источникам; runtime/security/license гарантии не выдавались. Соседние репозитории не изменялись, commits/push/landing не выполнялись. Доставка принадлежит parent.
