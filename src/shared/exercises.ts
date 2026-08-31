import type { BreakKind, Exercise, Lang } from './types'

/**
 * Masa basinda yapilabilen, ekipman gerektirmeyen egzersizler.
 * `standing: true` olanlar dolasimi canlandirdigi icin uzun molalarda oncelik alir.
 */
export const EXERCISES: Exercise[] = [
  {
    id: 'chin-tuck',
    emoji: '🙆',
    category: 'neck',
    seconds: 30,
    standing: false,
    tr: {
      name: 'Çene İçeri Çekme',
      steps: [
        'Omuzlarını gevşet, bakışın karşıya sabit kalsın.',
        'Çeneni geriye doğru çek — kafanı öne uzatmadan, çift gıdık yapar gibi.',
        '5 saniye tut, bırak. 5 tekrar yap.'
      ]
    },
    en: {
      name: 'Chin Tuck',
      steps: [
        'Relax your shoulders and keep your gaze level.',
        'Draw your chin straight back, making a double chin — do not tilt down.',
        'Hold 5 seconds, release. Repeat 5 times.'
      ]
    }
  },
  {
    id: 'neck-side',
    emoji: '🧎',
    category: 'neck',
    seconds: 40,
    standing: false,
    tr: {
      name: 'Boyun Yan Esnetme',
      steps: [
        'Sağ elini başının üstünden sol kulağına götür.',
        'Başını nazikçe sağ omzuna doğru çek, sol omzunu aşağıda tut.',
        '20 saniye tut, sonra diğer tarafa geç.'
      ]
    },
    en: {
      name: 'Side Neck Stretch',
      steps: [
        'Reach your right hand over your head to your left ear.',
        'Gently pull your head toward your right shoulder; keep the left shoulder down.',
        'Hold 20 seconds, then switch sides.'
      ]
    }
  },
  {
    id: 'shoulder-roll',
    emoji: '🔄',
    category: 'shoulder',
    seconds: 30,
    standing: false,
    tr: {
      name: 'Omuz Çevirme',
      steps: [
        'Kollarını serbest bırak.',
        'Omuzlarını 10 kez geriye doğru büyük daireler çizerek çevir.',
        'Sonra 10 kez öne çevir. Nefesini tutma.'
      ]
    },
    en: {
      name: 'Shoulder Rolls',
      steps: [
        'Let your arms hang loose.',
        'Roll your shoulders backward in 10 big circles.',
        'Then 10 forward. Keep breathing.'
      ]
    }
  },
  {
    id: 'chest-opener',
    emoji: '🫸',
    category: 'posture',
    seconds: 40,
    standing: true,
    tr: {
      name: 'Göğüs Açma',
      steps: [
        'Ayağa kalk, ellerini belinin arkasında kenetle.',
        'Kollarını aşağı doğru uzatırken göğsünü yukarı ve öne aç.',
        '20 saniye tut. Klavye başında kapanan omuzları açar.'
      ]
    },
    en: {
      name: 'Chest Opener',
      steps: [
        'Stand up and clasp your hands behind your lower back.',
        'Straighten your arms down while lifting and opening your chest.',
        'Hold 20 seconds. Counters keyboard-hunched shoulders.'
      ]
    }
  },
  {
    id: 'thoracic-cat-cow',
    emoji: '🐈',
    category: 'back',
    seconds: 45,
    standing: false,
    tr: {
      name: 'Oturarak Kedi-İnek',
      steps: [
        'Ellerini dizlerine koy, ayakların yerde olsun.',
        'Nefes alırken göğsünü aç ve belini hafif çukurlaştır.',
        'Nefes verirken sırtını yukarı kamburlaştır. 8 tur tekrarla.'
      ]
    },
    en: {
      name: 'Seated Cat-Cow',
      steps: [
        'Hands on knees, feet flat on the floor.',
        'Inhale: open your chest and gently arch your lower back.',
        'Exhale: round your upper back. Repeat 8 cycles.'
      ]
    }
  },
  {
    id: 'spinal-twist',
    emoji: '🌀',
    category: 'back',
    seconds: 40,
    standing: false,
    tr: {
      name: 'Oturarak Omurga Dönüşü',
      steps: [
        'Dik otur, ayaklarını yere sabitle.',
        'Sağ elini sol dizine koy, gövdeni sola çevir; kalçalar sabit kalsın.',
        '20 saniye tut, sonra diğer yöne dön.'
      ]
    },
    en: {
      name: 'Seated Spinal Twist',
      steps: [
        'Sit tall with both feet planted.',
        'Right hand on left knee, rotate your torso left; keep hips square.',
        'Hold 20 seconds, then switch.'
      ]
    }
  },
  {
    id: 'side-bend',
    emoji: '🤸',
    category: 'back',
    seconds: 40,
    standing: true,
    tr: {
      name: 'Yan Eğilme',
      steps: [
        'Ayağa kalk, sağ kolunu başının üstünden sola uzat.',
        'Gövdeni sola eğ; sağ yanının uzadığını hisset.',
        '15 saniye tut, tarafı değiştir.'
      ]
    },
    en: {
      name: 'Standing Side Bend',
      steps: [
        'Stand up, reach your right arm overhead to the left.',
        'Lean your torso left and feel the right side lengthen.',
        'Hold 15 seconds, then switch.'
      ]
    }
  },
  {
    id: 'wrist-flexor',
    emoji: '🤲',
    category: 'wrist',
    seconds: 40,
    standing: false,
    tr: {
      name: 'Bilek Esnetme',
      steps: [
        'Sağ kolunu öne uzat, avuç içi yukarı baksın.',
        'Sol elinle parmaklarını nazikçe aşağı çek, 15 saniye tut.',
        'Avuç içini aşağı çevirip tekrarla, sonra diğer el.'
      ]
    },
    en: {
      name: 'Wrist Stretch',
      steps: [
        'Extend your right arm forward, palm up.',
        'With the other hand, gently pull the fingers down. Hold 15 seconds.',
        'Flip the palm down and repeat, then switch hands.'
      ]
    }
  },
  {
    id: 'finger-fan',
    emoji: '✋',
    category: 'wrist',
    seconds: 25,
    standing: false,
    tr: {
      name: 'Parmak Açma-Kapama',
      steps: [
        'Ellerini öne uzat, parmaklarını sonuna kadar aç.',
        '2 saniye gergin tut, sonra yumruk yap.',
        '15 tekrar. Yazarken kasılan el kaslarını rahatlatır.'
      ]
    },
    en: {
      name: 'Finger Fans',
      steps: [
        'Extend your hands, spread your fingers as wide as possible.',
        'Hold 2 seconds, then make a fist.',
        '15 reps. Releases typing tension in the hands.'
      ]
    }
  },
  {
    id: 'hip-flexor',
    emoji: '🦵',
    category: 'legs',
    seconds: 50,
    standing: true,
    tr: {
      name: 'Kalça Ön Germe',
      steps: [
        'Ayağa kalk, sağ ayağını bir adım geriye at.',
        'Kalçanı öne it, kuyruk sokumunu içeri al; sağ kalçanın önü gerilsin.',
        '20 saniye tut, bacak değiştir. Uzun oturmanın en iyi panzehiri.'
      ]
    },
    en: {
      name: 'Hip Flexor Stretch',
      steps: [
        'Stand and step your right foot back.',
        'Push your hips forward, tuck your tailbone; feel the front of the right hip.',
        'Hold 20 seconds, switch legs. The best antidote to long sitting.'
      ]
    }
  },
  {
    id: 'hamstring',
    emoji: '🦶',
    category: 'legs',
    seconds: 45,
    standing: true,
    tr: {
      name: 'Arka Bacak Germe',
      steps: [
        'Sağ topuğunu önüne koy, ayak ucunu yukarı kaldır.',
        'Sırtını düz tutarak kalçandan öne eğil.',
        '20 saniye tut, bacak değiştir.'
      ]
    },
    en: {
      name: 'Hamstring Stretch',
      steps: [
        'Place your right heel forward, toes pointing up.',
        'Hinge forward from the hips with a flat back.',
        'Hold 20 seconds, switch legs.'
      ]
    }
  },
  {
    id: 'calf-raise',
    emoji: '🧗',
    category: 'legs',
    seconds: 30,
    standing: true,
    tr: {
      name: 'Topuk Kaldırma',
      steps: [
        'Ayakta dur, gerekirse masaya hafifçe tutun.',
        'Parmak uçlarına yüksel, 1 saniye tut, yavaşça in.',
        '20 tekrar. Bacaklardaki kan dolaşımını hızlandırır.'
      ]
    },
    en: {
      name: 'Calf Raises',
      steps: [
        'Stand up, lightly hold the desk if needed.',
        'Rise onto your toes, hold 1 second, lower slowly.',
        '20 reps. Pumps blood back up from your legs.'
      ]
    }
  },
  {
    id: 'sit-to-stand',
    emoji: '🪑',
    category: 'legs',
    seconds: 40,
    standing: true,
    tr: {
      name: 'Otur-Kalk',
      steps: [
        'Sandalyenin önünde dur, kollarını öne uzat.',
        'Kalçanı geriye iterek otur, hemen kontrollü şekilde kalk.',
        '10 tekrar. Ellerini kullanmamaya çalış.'
      ]
    },
    en: {
      name: 'Sit-to-Stand',
      steps: [
        'Stand in front of your chair, arms reaching forward.',
        'Push your hips back to sit, then stand right back up under control.',
        '10 reps. Try not to use your hands.'
      ]
    }
  },
  {
    id: 'ankle-circles',
    emoji: '🌍',
    category: 'legs',
    seconds: 25,
    standing: false,
    tr: {
      name: 'Ayak Bileği Çevirme',
      steps: [
        'Bir ayağını yerden kaldır.',
        '10 kez saat yönünde, 10 kez tersine çevir.',
        'Diğer ayakla tekrarla.'
      ]
    },
    en: {
      name: 'Ankle Circles',
      steps: [
        'Lift one foot off the floor.',
        'Circle 10 times clockwise, 10 times counter-clockwise.',
        'Repeat with the other foot.'
      ]
    }
  },
  {
    id: 'eye-20-20-20',
    emoji: '👀',
    category: 'eyes',
    seconds: 20,
    standing: false,
    tr: {
      name: '20-20-20 Göz Molası',
      steps: [
        'Ekrandan bakışını ayır.',
        'En az 6 metre (20 adım) uzaktaki bir noktaya odaklan.',
        '20 saniye boyunca oraya bak ve normal şekilde gözünü kırp.'
      ]
    },
    en: {
      name: '20-20-20 Eye Break',
      steps: [
        'Look away from the screen.',
        'Focus on something at least 20 feet (6 m) away.',
        'Hold your gaze for 20 seconds and blink normally.'
      ]
    }
  },
  {
    id: 'eye-palming',
    emoji: '😌',
    category: 'eyes',
    seconds: 30,
    standing: false,
    tr: {
      name: 'Göz Avuçlama',
      steps: [
        'Avuçlarını birbirine sürterek ısıt.',
        'Bastırmadan gözlerinin üzerine kapat, tamamen karart.',
        '30 saniye derin nefes al.'
      ]
    },
    en: {
      name: 'Eye Palming',
      steps: [
        'Rub your palms together until warm.',
        'Cup them over your closed eyes without pressing — full darkness.',
        'Breathe deeply for 30 seconds.'
      ]
    }
  },
  {
    id: 'box-breathing',
    emoji: '🫁',
    category: 'breath',
    seconds: 60,
    standing: false,
    tr: {
      name: 'Kutu Nefesi',
      steps: [
        '4 saniye burnundan nefes al.',
        '4 saniye tut, 4 saniye ağzından ver, 4 saniye boş bekle.',
        '4 tur tekrarla. Zihni odak için sıfırlar.'
      ]
    },
    en: {
      name: 'Box Breathing',
      steps: [
        'Inhale through the nose for 4 seconds.',
        'Hold 4, exhale 4, hold empty 4.',
        'Repeat 4 rounds. Resets your focus.'
      ]
    }
  },
  {
    id: 'short-walk',
    emoji: '🚶',
    category: 'posture',
    seconds: 60,
    standing: true,
    tr: {
      name: 'Kısa Yürüyüş',
      steps: [
        'Ayağa kalk ve odadan çık.',
        'Bir bardak su doldur, dönerken ekrana bakma.',
        'Hedef: en az 60 saniye ayakta kal.'
      ]
    },
    en: {
      name: 'Short Walk',
      steps: [
        'Stand up and leave the room.',
        'Fill a glass of water; keep your eyes off screens on the way back.',
        'Goal: stay on your feet for at least 60 seconds.'
      ]
    }
  }
]

export const EXERCISES_BY_ID = new Map(EXERCISES.map((e) => [e.id, e]))

export function exerciseText(exercise: Exercise, lang: Lang): ExerciseTextResolved {
  const text = lang === 'en' ? exercise.en : exercise.tr
  return { name: text.name, steps: text.steps }
}

export interface ExerciseTextResolved {
  name: string
  steps: string[]
}

/**
 * Ayni egzersizin ust uste gelmemesi icin havuzu tuketerek dolasir.
 * Uzun molalarda ayakta yapilanlar, kisa molalarda oturarak yapilanlar tercih edilir.
 */
export class ExerciseRotation {
  private pool: string[] = []
  private lastId: string | null = null

  next(kind: BreakKind): Exercise {
    const preferStanding = kind === 'long'
    const candidates = this.refillIfNeeded(preferStanding)
    const index = Math.floor(Math.random() * candidates.length)
    const id = candidates[index]!
    this.pool = this.pool.filter((p) => p !== id)
    this.lastId = id
    return EXERCISES_BY_ID.get(id)!
  }

  private refillIfNeeded(preferStanding: boolean): string[] {
    if (this.pool.length === 0) {
      this.pool = EXERCISES.map((e) => e.id)
      if (this.lastId && this.pool.length > 1) {
        this.pool = this.pool.filter((id) => id !== this.lastId)
      }
    }
    const preferred = this.pool.filter((id) => {
      const ex = EXERCISES_BY_ID.get(id)
      return ex ? ex.standing === preferStanding : false
    })
    return preferred.length > 0 ? preferred : this.pool
  }
}
