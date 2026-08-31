const { Engine } = require('../node_modules/.cache/engine.cjs')

let now = 1_700_000_000_000
const realNow = Date.now
Date.now = () => now

let passed = 0
const failures = []
function check(label, actual, expected) {
  const ok = JSON.stringify(actual) === JSON.stringify(expected)
  if (ok) passed++
  else failures.push(`${label}: bekleniyordu ${JSON.stringify(expected)}, gelen ${JSON.stringify(actual)}`)
}

function makeHarness(overrides = {}) {
  const settings = {
    lang: 'tr', theme: 'system',
    focusMinutes: 1, shortBreakMinutes: 1, longBreakMinutes: 2, cyclesBeforeLongBreak: 2,
    autoStartBreaks: true, autoStartFocus: true,
    microBreaksEnabled: true, microBreakIntervalMinutes: 10, microBreakSeconds: 30,
    microBreakOnlyDuringFocus: false,
    eyeReminderEnabled: false, eyeReminderIntervalMinutes: 20,
    strictness: 'normal', postponeMinutes: 2, preBreakWarningSeconds: 0, idlePauseMinutes: 5,
    soundEnabled: false, volume: 0, notificationsEnabled: false,
    launchAtLogin: false, startMinimized: false, showTrayCountdown: true, globalShortcut: '',
    ...overrides
  }
  const day = { date: 'x', pomodoros: 0, focusSeconds: 0, breaksTaken: 0, breaksSkipped: 0, stretches: 0 }
  const store = {
    getSettings: () => settings,
    today: () => day,
    bump: (field, amount = 1) => { day[field] += amount }
  }
  const events = []
  const engine = new Engine(store, {
    onState: () => {},
    onOverlayOpen: (p) => events.push(`open:${p.kind}`),
    onOverlayClose: () => events.push('close'),
    onNotify: (k) => events.push(`notify:${k}`),
    onSound: (e) => events.push(`sound:${e}`)
  })
  const advance = (ms, step = 500) => {
    for (let t = 0; t < ms; t += step) { now += step; engine.tick() }
  }
  return { engine, store, settings, day, events, advance }
}

// --- 1: odak -> kisa mola -> odak dongusu -----------------------------------
{
  const h = makeHarness()
  h.engine.start()
  check('1a faz odak', h.engine.getState().phase, 'focus')
  check('1b calisiyor', h.engine.getState().running, true)

  h.advance(61_000)
  check('1c pomodoro sayildi', h.day.pomodoros, 1)
  check('1d odak saniyesi ~60', Math.abs(h.day.focusSeconds - 60) <= 1, true)
  check('1e kisa mola overlayi acildi', h.events.includes('open:short'), true)
  check('1f faz kisa mola', h.engine.getState().phase, 'shortBreak')

  h.advance(61_000)
  check('1g mola kapandi', h.events.includes('close'), true)
  check('1h odaga donuldu', h.engine.getState().phase, 'focus')
  check('1i mola alindi sayildi', h.day.breaksTaken, 1)
}

// --- 2: 2 pomodoro sonrasi uzun mola ---------------------------------------
{
  const h = makeHarness()
  h.engine.start()
  h.advance(61_000)          // 1. pomodoro -> kisa mola
  h.advance(61_000)          // mola bitti -> odak
  h.advance(61_000)          // 2. pomodoro -> uzun mola
  check('2a uzun mola acildi', h.events.includes('open:long'), true)
  check('2b faz uzun mola', h.engine.getState().phase, 'longBreak')
  check('2c dongu sifirlandi', h.engine.getState().cyclePosition, 0)
  check('2d dongu bildirimi', h.events.includes('notify:cycleDone'), true)
}

// --- 3: mikro esneme molasi odagi askiya alir, sure kaybolmaz ---------------
{
  const h = makeHarness({ focusMinutes: 60, microBreakIntervalMinutes: 10, microBreakSeconds: 30 })
  h.engine.start()
  h.advance(10 * 60_000 + 1_000)
  check('3a mikro mola acildi', h.events.includes('open:micro'), true)
  check('3b faz micro', h.engine.getState().phase, 'micro')

  const remainingBefore = 60 * 60_000 - (10 * 60_000 + 1_000)
  h.advance(31_000)
  check('3c mikro bitti, odaga donuldu', h.engine.getState().phase, 'focus')
  check('3d esneme sayildi', h.day.stretches >= 1, true)
  // Esneme sirasinda odak saati durdugu icin kalan sure korunmali.
  const drift = Math.abs(h.engine.getState().remainingMs - remainingBefore)
  check('3e odak suresi korundu (<2sn sapma)', drift < 2_000, true)
}

// --- 4: molayi erteleme -> kisa odak -> mola geri gelir ---------------------
{
  const h = makeHarness({ postponeMinutes: 2 })
  h.engine.start()
  h.advance(61_000)
  check('4a mola acik', h.engine.getState().phase, 'shortBreak')
  h.engine.overlayAction({ type: 'postpone' })
  check('4b odaga donuldu', h.engine.getState().phase, 'focus')
  check('4c erteleme suresi 2dk', h.engine.getState().totalMs, 120_000)
  check('4d pomodoro tekrar sayilmadi', h.day.pomodoros, 1)
  h.advance(121_000)
  check('4e mola geri geldi', h.engine.getState().phase, 'shortBreak')
  check('4f hala 1 pomodoro', h.day.pomodoros, 1)
}

// --- 5: molayi atlama sayaca yansir ----------------------------------------
{
  const h = makeHarness({ strictness: 'relaxed' })
  h.engine.start()
  h.advance(61_000)
  h.engine.overlayAction({ type: 'skip' })
  check('5a atlanan mola sayildi', h.day.breaksSkipped, 1)
  check('5b odaga donuldu', h.engine.getState().phase, 'focus')
}

// --- 6: hareketsizlik odagi duraklatir, donunce sayaclar sifirlanir --------
{
  const h = makeHarness({ focusMinutes: 60, idlePauseMinutes: 5 })
  h.engine.start()
  h.advance(60_000)
  h.engine.setIdle(5 * 60)
  check('6a odak duraklatildi', h.engine.getState().running, false)
  check('6b idle bayragi', h.engine.getState().idle, true)
  check('6c bildirim gonderildi', h.events.includes('notify:idlePaused'), true)
  h.engine.setIdle(0)
  check('6d idle bitti', h.engine.getState().idle, false)
  check('6e esneme sayaci sifirlandi', h.engine.getState().nextMicroMs, 10 * 60_000)
}

// --- 7: mikro mola pomodoro molasina cok yakinsa tetiklenmez ---------------
{
  const h = makeHarness({ focusMinutes: 11, microBreakIntervalMinutes: 10 })
  h.engine.start()
  h.advance(10 * 60_000 + 1_000)
  check('7a mikro mola ertelendi', h.events.includes('open:micro'), false)
  h.advance(60_000)
  check('7b pomodoro molasi acildi', h.events.includes('open:short'), true)
}

// --- 8: "simdi esne" kapaliyken bile calisir --------------------------------
{
  const h = makeHarness({ microBreaksEnabled: false })
  h.engine.stretchNow()
  check('8a zorunlu esneme acildi', h.events.includes('open:micro'), true)
  h.advance(31_000)
  check('8b pomodoro yoksa bosa donuldu', h.engine.getState().phase, 'idle')
}

Date.now = realNow
console.log(`\n${passed} kontrol gecti, ${failures.length} basarisiz`)
for (const f of failures) console.log('  X ' + f)
process.exit(failures.length ? 1 : 0)
