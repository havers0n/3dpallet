Папки
src/
  app/
    providers/
    routes/
  domain/
    packing/
      types.ts
      presets.ts
      placement.ts
      carton-layout.ts
      guards.ts
  features/
    packing-station/
      model/
        packing-store.ts
        packing-selectors.ts
        packing-actions.ts
        demo-session.ts
      ui/
        packing-station-page.tsx
        right-panel.tsx
        preset-list.tsx
        buffer-list.tsx
        selected-carton-panel.tsx
      scene/
        packing-scene.tsx
        pallet-mesh.tsx
        carton-mesh.tsx
        item-blocks.tsx
        scene-lights.tsx

        Граница ответственности
domain/packing

Только pure logic:

типы
layout helpers
placement helpers
fit checks
preset data
features/packing-station/model

Runtime state:

selected carton
selected item
current session
actions
features/packing-station/ui

Панели и экран

features/packing-station/scene

3D rendering

Invariants
модель данных строго: pallet -> cartons -> items
товары лежат только внутри коробок, не напрямую на палете
коробки создаются из пресетов
новая коробка ставится на палету детерминированно, а не через свободный drag
товары внутри коробки раскладываются простым grid layout
3D — это визуализация состояния, а не основная сложность UX
UI упаковщика должен быть простым и понятным на планшете
все business/layout helpers — pure functions
store actions — явные, без скрытой магии
Prohibitions
не делать physics engine
не делать collision solver
не делать free-form 3D editor
не делать backend
не делать auth
не делать real SKU meshes
не делать auto-optimization packing
не делать over-engineering архитектуры
не тащить DnD в 3D в первой версии
не делать generic reusable engine “на будущее”

PR-план
PR1 — Project bootstrap + domain skeleton

Сделать:

создать Vite app
подключить Tailwind
подключить Zustand
подключить three / react-three-fiber / drei
сделать route/page PackingStationPage
завести доменные типы
завести demo fixtures
завести базовый zustand store
split layout: center scene / right panel

Acceptance:

страница открывается
есть demo pallet
есть список пресетов
есть список buffer items
store работает
PR2 — 3D scene foundation

Сделать:

Canvas
camera
lights
pallet mesh
floor/grid helper
render cartons from state
selection by click

Acceptance:

видно палету
видно коробки
клик по коробке меняет selection
right panel знает выбранную коробку
PR3 — Create carton from preset

Сделать:

список пресетов справа
action createCartonFromPreset
deterministic pallet slot allocation
delete carton
selected carton summary

Acceptance:

можно создать несколько коробок
коробки появляются на палете стабильно
удаление не ломает layout
PR4 — Buffer → selected carton flow

Сделать:

выбор товара из буфера
action packSelectedItemIntoSelectedCarton
action unpackItemFromCarton
right panel для содержимого коробки

Acceptance:

товар уходит из буфера в коробку
товар можно вернуть
нельзя упаковать без выбранной коробки
PR5 — Items in 3D

Сделать:

item-block rendering inside carton
layoutItemsInCarton pure helper
simple fit check
overflow/invalid state blocked at action level

Acceptance:

товары видны внутри коробки
укладка стабильна
неподходящий товар не кладётся
PR6 — Tablet UX + demo polish

Сделать:

крупные кнопки
понятные подписи
reset session
localStorage persistence
demo order seed
basic empty/error states

Acceptance:

прототип можно открыть и показать без объяснений на 10 минут
после reload сессия сохраняется
сценарий упаковки проходит быстро