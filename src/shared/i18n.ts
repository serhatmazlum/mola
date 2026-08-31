import type { Lang } from './types'

const tr = {
  appName: 'Mola',
  tagline: 'Odaklan, sonra gerçekten mola ver.',

  phase: {
    idle: 'Hazır',
    focus: 'Odak',
    shortBreak: 'Kısa Mola',
    longBreak: 'Uzun Mola',
    micro: 'Esneme Molası'
  },

  nav: { focus: 'Odak', stats: 'İstatistik', settings: 'Ayarlar' },

  action: {
    start: 'Başlat',
    pause: 'Duraklat',
    resume: 'Devam Et',
    reset: 'Sıfırla',
    skip: 'Atla',
    stretchNow: 'Şimdi esne',
    quit: 'Çıkış',
    show: 'Pencereyi göster'
  },

  focusView: {
    sessionOf: '{done}/{total} pomodoro',
    nextStretch: 'Sonraki esneme',
    nextEye: 'Göz molası',
    stretchOff: 'Esneme kapalı',
    idleNotice: 'Bilgisayar başında değildin — odak duraklatıldı.',
    todayFocus: 'odak'
  },

  overlay: {
    micro: 'Esneme Molası',
    short: 'Kısa Mola',
    long: 'Uzun Mola',
    subtitleMicro: 'Ayağa kalk ve gövdeni hareket ettir.',
    subtitleShort: 'Ekrandan uzaklaş, birkaç dakika nefeslen.',
    subtitleLong: 'Uzun mola. Yürü, su iç, esne.',
    skip: 'Atla',
    postpone: '+{n} dk ertele',
    shuffle: 'Başka egzersiz',
    holdToSkip: 'Atlamak için basılı tut',
    releaseToCancel: 'Bırakınca iptal olur',
    backIn: 'Odağa dönüş',
    todayCount: 'Bugün {n} pomodoro'
  },

  notif: {
    breakSoonTitle: 'Mola yaklaşıyor',
    breakSoonBody: '{n} saniye sonra {phase}.',
    breakStartTitle: 'Mola zamanı',
    breakStartBody: 'Ayağa kalk ve esne.',
    focusStartTitle: 'Odak başladı',
    focusStartBody: '{n} dakikalık odak seansı.',
    idlePausedTitle: 'Odak duraklatıldı',
    idlePausedBody: '{n} dakikadır hareket yok.',
    cycleDoneTitle: 'Döngü tamamlandı',
    cycleDoneBody: 'Uzun mola hak ettin.'
  },

  stats: {
    title: 'İstatistik',
    today: 'Bugün',
    pomodoros: 'Pomodoro',
    focusTime: 'Odak süresi',
    stretches: 'Esneme',
    breaksTaken: 'Alınan mola',
    breaksSkipped: 'Atlanan mola',
    streak: 'Seri',
    streakDays: '{n} gün',
    last7: 'Son 7 gün',
    last14: 'Son 14 gün',
    empty: 'Henüz veri yok. İlk pomodoronu başlat.',
    weekTotal: 'Haftalık toplam'
  },

  settings: {
    title: 'Ayarlar',
    groupTimer: 'Zamanlayıcı',
    groupStretch: 'Esneme ve mola',
    groupBehaviour: 'Davranış',
    groupSystem: 'Sistem',

    focusMinutes: 'Odak süresi',
    shortBreakMinutes: 'Kısa mola',
    longBreakMinutes: 'Uzun mola',
    cyclesBeforeLongBreak: 'Uzun moladan önceki pomodoro',
    autoStartBreaks: 'Molaları otomatik başlat',
    autoStartFocus: 'Moladan sonra odağı otomatik başlat',

    microBreaksEnabled: 'Esneme molası hatırlatıcısı',
    microBreakIntervalMinutes: 'Esneme aralığı',
    microBreakSeconds: 'Esneme süresi',
    microBreakOnlyDuringFocus: 'Sadece odak sırasında hatırlat',
    microBreakHint: 'Kapalıysa pomodoro çalışmasa bile uzun oturmalarda uyarır.',

    eyeReminderEnabled: '20-20-20 göz kuralı',
    eyeReminderIntervalMinutes: 'Göz molası aralığı',
    eyeHint: 'Her {n} dakikada bir 20 saniye uzağa bakmanı hatırlatır.',

    strictness: 'Mola katılığı',
    strictnessRelaxed: 'Esnek — atla ve ertele açık',
    strictnessNormal: 'Normal — sadece erteleme',
    strictnessStrict: 'Katı — 3 sn basılı tutarak çık',
    strictnessShort: { relaxed: 'Esnek', normal: 'Normal', strict: 'Katı' },
    postponeMinutes: 'Erteleme süresi',
    preBreakWarningSeconds: 'Mola öncesi uyarı',
    idlePauseMinutes: 'Hareketsizlikte duraklat',
    idleHint: '0 yaparsan kapanır.',

    soundEnabled: 'Ses',
    volume: 'Ses seviyesi',
    notificationsEnabled: 'Bildirimler',
    launchAtLogin: 'Açılışta başlat',
    startMinimized: 'Simge durumunda başlat',
    showTrayCountdown: 'Menü çubuğunda geri sayım',
    globalShortcut: 'Kısayol (başlat/duraklat)',
    shortcutInvalid: 'Bu kısayol kaydedilemedi.',
    theme: 'Tema',
    themeSystem: 'Sistem',
    themeLight: 'Açık',
    themeDark: 'Koyu',
    lang: 'Dil',

    reset: 'Varsayılanlara dön',
    resetConfirm: 'Tüm ayarlar sıfırlansın mı?',
    openDataFolder: 'Veri klasörünü aç',
    version: 'Sürüm'
  },

  unit: {
    minutesShort: 'dk',
    secondsShort: 'sn',
    hoursShort: 'sa'
  }
}

const en: typeof tr = {
  appName: 'Mola',
  tagline: 'Focus hard, then actually rest.',

  phase: {
    idle: 'Ready',
    focus: 'Focus',
    shortBreak: 'Short Break',
    longBreak: 'Long Break',
    micro: 'Stretch Break'
  },

  nav: { focus: 'Focus', stats: 'Stats', settings: 'Settings' },

  action: {
    start: 'Start',
    pause: 'Pause',
    resume: 'Resume',
    reset: 'Reset',
    skip: 'Skip',
    stretchNow: 'Stretch now',
    quit: 'Quit',
    show: 'Show window'
  },

  focusView: {
    sessionOf: '{done}/{total} pomodoros',
    nextStretch: 'Next stretch',
    nextEye: 'Eye break',
    stretchOff: 'Stretching off',
    idleNotice: 'You were away — focus was paused.',
    todayFocus: 'focused'
  },

  overlay: {
    micro: 'Stretch Break',
    short: 'Short Break',
    long: 'Long Break',
    subtitleMicro: 'Stand up and move your body.',
    subtitleShort: 'Step away from the screen and breathe.',
    subtitleLong: 'Long break. Walk, drink water, stretch.',
    skip: 'Skip',
    postpone: 'Snooze {n} min',
    shuffle: 'Another exercise',
    holdToSkip: 'Hold to skip',
    releaseToCancel: 'Release to cancel',
    backIn: 'Back to focus in',
    todayCount: '{n} pomodoros today'
  },

  notif: {
    breakSoonTitle: 'Break coming up',
    breakSoonBody: '{phase} in {n} seconds.',
    breakStartTitle: 'Break time',
    breakStartBody: 'Stand up and stretch.',
    focusStartTitle: 'Focus started',
    focusStartBody: '{n} minute focus session.',
    idlePausedTitle: 'Focus paused',
    idlePausedBody: 'No activity for {n} minutes.',
    cycleDoneTitle: 'Cycle complete',
    cycleDoneBody: 'You earned a long break.'
  },

  stats: {
    title: 'Stats',
    today: 'Today',
    pomodoros: 'Pomodoros',
    focusTime: 'Focus time',
    stretches: 'Stretches',
    breaksTaken: 'Breaks taken',
    breaksSkipped: 'Breaks skipped',
    streak: 'Streak',
    streakDays: '{n} days',
    last7: 'Last 7 days',
    last14: 'Last 14 days',
    empty: 'No data yet. Start your first pomodoro.',
    weekTotal: 'Week total'
  },

  settings: {
    title: 'Settings',
    groupTimer: 'Timer',
    groupStretch: 'Stretch & breaks',
    groupBehaviour: 'Behaviour',
    groupSystem: 'System',

    focusMinutes: 'Focus length',
    shortBreakMinutes: 'Short break',
    longBreakMinutes: 'Long break',
    cyclesBeforeLongBreak: 'Pomodoros before long break',
    autoStartBreaks: 'Auto-start breaks',
    autoStartFocus: 'Auto-start focus after a break',

    microBreaksEnabled: 'Stretch break reminders',
    microBreakIntervalMinutes: 'Stretch interval',
    microBreakSeconds: 'Stretch length',
    microBreakOnlyDuringFocus: 'Only remind during focus',
    microBreakHint: 'When off, it also warns during long sitting without a pomodoro.',

    eyeReminderEnabled: '20-20-20 eye rule',
    eyeReminderIntervalMinutes: 'Eye break interval',
    eyeHint: 'Reminds you to look far away for 20 seconds every {n} minutes.',

    strictness: 'Break strictness',
    strictnessRelaxed: 'Relaxed — skip and snooze allowed',
    strictnessNormal: 'Normal — snooze only',
    strictnessStrict: 'Strict — hold 3s to escape',
    strictnessShort: { relaxed: 'Relaxed', normal: 'Normal', strict: 'Strict' },
    postponeMinutes: 'Snooze length',
    preBreakWarningSeconds: 'Pre-break warning',
    idlePauseMinutes: 'Pause when idle for',
    idleHint: 'Set to 0 to disable.',

    soundEnabled: 'Sound',
    volume: 'Volume',
    notificationsEnabled: 'Notifications',
    launchAtLogin: 'Launch at login',
    startMinimized: 'Start minimized',
    showTrayCountdown: 'Countdown in menu bar',
    globalShortcut: 'Shortcut (start/pause)',
    shortcutInvalid: 'That shortcut could not be registered.',
    theme: 'Theme',
    themeSystem: 'System',
    themeLight: 'Light',
    themeDark: 'Dark',
    lang: 'Language',

    reset: 'Restore defaults',
    resetConfirm: 'Reset all settings?',
    openDataFolder: 'Open data folder',
    version: 'Version'
  },

  unit: {
    minutesShort: 'min',
    secondsShort: 's',
    hoursShort: 'h'
  }
}

export type Strings = typeof tr

export const STRINGS: Record<Lang, Strings> = { tr, en }

export function t(lang: Lang): Strings {
  return STRINGS[lang] ?? STRINGS.tr
}

/** `{n}` gibi yer tutuculari doldurur. */
export function fmt(template: string, vars: Record<string, string | number>): string {
  return template.replace(/\{(\w+)\}/g, (match, key: string) =>
    key in vars ? String(vars[key]) : match
  )
}
