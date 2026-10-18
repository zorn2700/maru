export const textbookMeta = {
  "title": "Учебник Masri RU",
  "subtitle": "Полный курс египетского арабского по частям, урокам, аудио и PDF",
  "arTitle": "المصري للناطقين بالروسية",
  "levels": "A0–B1",
  "studyWeeks": 16
};

export const textbookParts = [
  {
    "id": 1,
    "roman": "I",
    "title": "Часть I",
    "subtitle": "Звуки, знакомство и основы",
    "modules": [
      1,
      2,
      3
    ]
  },
  {
    "id": 2,
    "roman": "II",
    "title": "Часть II",
    "subtitle": "Повседневная речь и настоящее время",
    "modules": [
      4,
      5,
      6
    ]
  },
  {
    "id": 3,
    "roman": "III",
    "title": "Часть III",
    "subtitle": "Глаголы, город, еда и покупки",
    "modules": [
      7,
      8,
      9
    ]
  },
  {
    "id": 4,
    "roman": "IV",
    "title": "Часть IV",
    "subtitle": "Работа, здоровье и путешествия",
    "modules": [
      10,
      11,
      12
    ]
  }
];

export const textbookFrontMatter = [
  {
    "id": "intro",
    "title": "Введение и транскрипция",
    "subtitle": "О курсе и план обучения",
    "pdf": "assets/textbook/chapters/chapter-introduction.pdf",
    "free": true
  },
  {
    "id": "alphabet",
    "title": "Арабский алфавит",
    "subtitle": "28 букв и каирское произношение",
    "pdf": "assets/textbook/chapters/chapter-alphabet.pdf",
    "audio": "assets/textbook/audio/alphabet.mp3",
    "free": true
  },
  {
    "id": "phrases",
    "title": "Фразы первой необходимости",
    "subtitle": "Аудиораздел для путешествий",
    "audio": "assets/textbook/audio/survival.mp3",
    "free": false
  }
];

export const textbookUnits = [
  {
    "module": 1,
    "level": "A0",
    "title": "Звуки и первые фразы",
    "ar": "الأصوات وأول كلام",
    "free": true,
    "chapter": "assets/textbook/chapters/chapter-unit-01.pdf",
    "lessons": [
      {
        "id": "m1l1",
        "order": 1,
        "title": "Главные звуки египетского арабского",
        "arTitle": "أهم أصوات المصري",
        "audio": "assets/textbook/audio/lesson-m1l1.mp3"
      },
      {
        "id": "m1l2",
        "order": 2,
        "title": "Приветствия и вежливость",
        "arTitle": "التحية والذوق",
        "audio": "assets/textbook/audio/lesson-m1l2.mp3"
      },
      {
        "id": "m1l3",
        "order": 3,
        "title": "Знакомство и страны",
        "arTitle": "التعارف والبلاد",
        "audio": "assets/textbook/audio/lesson-m1l3.mp3"
      }
    ]
  },
  {
    "module": 2,
    "level": "A0–A1",
    "title": "Люди и предметы",
    "ar": "الناس والحاجات",
    "free": false,
    "chapter": "assets/textbook/chapters/chapter-unit-02.pdf",
    "lessons": [
      {
        "id": "m2l1",
        "order": 4,
        "title": "Местоимения и предложения без есть",
        "arTitle": "الضمائر والجملة الاسمية",
        "audio": "assets/textbook/audio/lesson-m2l1.mp3"
      },
      {
        "id": "m2l2",
        "order": 5,
        "title": "Род прилагательные и определённость",
        "arTitle": "المذكر والمؤنث والصفة",
        "audio": "assets/textbook/audio/lesson-m2l2.mp3"
      },
      {
        "id": "m2l3",
        "order": 6,
        "title": "Семья и принадлежность",
        "arTitle": "العيلة والملكية",
        "audio": "assets/textbook/audio/lesson-m2l3.mp3"
      }
    ]
  },
  {
    "module": 3,
    "level": "A1",
    "title": "Вопросы числа и время",
    "ar": "الأسئلة والأرقام والوقت",
    "free": false,
    "chapter": "assets/textbook/chapters/chapter-unit-03.pdf",
    "lessons": [
      {
        "id": "m3l1",
        "order": 7,
        "title": "Вопросительные слова",
        "arTitle": "كلمات السؤال",
        "audio": "assets/textbook/audio/lesson-m3l1.mp3"
      },
      {
        "id": "m3l2",
        "order": 8,
        "title": "Числа возраст и телефон",
        "arTitle": "الأرقام والسن والتليفون",
        "audio": "assets/textbook/audio/lesson-m3l2.mp3"
      },
      {
        "id": "m3l3",
        "order": 9,
        "title": "Время дни и даты",
        "arTitle": "الوقت والأيام والتاريخ",
        "audio": "assets/textbook/audio/lesson-m3l3.mp3"
      }
    ]
  },
  {
    "module": 4,
    "level": "A1",
    "title": "Настоящее время",
    "ar": "المضارع والحياة اليومية",
    "free": false,
    "chapter": "assets/textbook/chapters/chapter-unit-04.pdf",
    "lessons": [
      {
        "id": "m4l1",
        "order": 10,
        "title": "Настоящее время и приставка b",
        "arTitle": "المضارع وحرف الباء",
        "audio": "assets/textbook/audio/lesson-m4l1.mp3"
      },
      {
        "id": "m4l2",
        "order": 11,
        "title": "Распорядок дня и частотность",
        "arTitle": "الروتين اليومي والتكرار",
        "audio": "assets/textbook/audio/lesson-m4l2.mp3"
      },
      {
        "id": "m4l3",
        "order": 12,
        "title": "Отрицание желания и возможность",
        "arTitle": "النفي والرغبة والإمكانية",
        "audio": "assets/textbook/audio/lesson-m4l3.mp3"
      }
    ]
  },
  {
    "module": 5,
    "level": "A1–A2",
    "title": "Прошлое будущее и просьбы",
    "ar": "الماضي والمستقبل والطلبات",
    "free": false,
    "chapter": "assets/textbook/chapters/chapter-unit-05.pdf",
    "lessons": [
      {
        "id": "m5l1",
        "order": 13,
        "title": "Прошедшее время",
        "arTitle": "الماضي",
        "audio": "assets/textbook/audio/lesson-m5l1.mp3"
      },
      {
        "id": "m5l2",
        "order": 14,
        "title": "Будущее и планы",
        "arTitle": "المستقبل والخطط",
        "audio": "assets/textbook/audio/lesson-m5l2.mp3"
      },
      {
        "id": "m5l3",
        "order": 15,
        "title": "Повелительное наклонение и вежливые просьбы",
        "arTitle": "الأمر والطلب بأدب",
        "audio": "assets/textbook/audio/lesson-m5l3.mp3"
      }
    ]
  },
  {
    "module": 6,
    "level": "A1–A2",
    "title": "Глаголы: формы и спряжение",
    "ar": "الأفعال: الصيغ والتصريف",
    "free": false,
    "chapter": "assets/textbook/chapters/chapter-unit-06.pdf",
    "lessons": [
      {
        "id": "m6l1",
        "order": 16,
        "title": "Система спряжения: основы глагола",
        "arTitle": "نظام التصريف: جذر الفعل",
        "audio": "assets/textbook/audio/lesson-m6l1.mp3"
      },
      {
        "id": "m6l2",
        "order": 17,
        "title": "Настоящее время: приставки и чередование гласных",
        "arTitle": "المضارع: البادئات وتبادل الحركات",
        "audio": "assets/textbook/audio/lesson-m6l2.mp3"
      },
      {
        "id": "m6l3",
        "order": 18,
        "title": "Разные породы: faʿʿala и faaʿala",
        "arTitle": "أوزان مختلفة: فيعلَ وفيعلَ",
        "audio": "assets/textbook/audio/lesson-m6l3.mp3"
      }
    ]
  },
  {
    "module": 7,
    "level": "A2",
    "title": "Глаголы: породы команды и движение",
    "ar": "الأفعال: الأوزان والأمر والحركة",
    "free": false,
    "chapter": "assets/textbook/chapters/chapter-unit-07.pdf",
    "lessons": [
      {
        "id": "m7l1",
        "order": 19,
        "title": "Приставка it-: возвратные и страдательные глаголы",
        "arTitle": "it-: الانعكاس والمبني للمجهول",
        "audio": "assets/textbook/audio/lesson-m7l1.mp3"
      },
      {
        "id": "m7l2",
        "order": 20,
        "title": "Команды, просьбы и формы для всех",
        "arTitle": "الأمر والطلبات لكل الأشخاص",
        "audio": "assets/textbook/audio/lesson-m7l2.mp3"
      },
      {
        "id": "m7l3",
        "order": 21,
        "title": "Глаголы движения и предлоги",
        "arTitle": "أفعال الحركة وحروف الجر",
        "audio": "assets/textbook/audio/lesson-m7l3.mp3"
      }
    ]
  },
  {
    "module": 8,
    "level": "A2",
    "title": "Дом и город",
    "ar": "البيت والمدينة",
    "free": false,
    "chapter": "assets/textbook/chapters/chapter-unit-08.pdf",
    "lessons": [
      {
        "id": "m8l1",
        "order": 22,
        "title": "Дом комнаты и местоположение",
        "arTitle": "البيت والمكان",
        "audio": "assets/textbook/audio/lesson-m8l1.mp3"
      },
      {
        "id": "m8l2",
        "order": 23,
        "title": "Дорога и ориентиры",
        "arTitle": "السؤال عن الطريق",
        "audio": "assets/textbook/audio/lesson-m8l2.mp3"
      },
      {
        "id": "m8l3",
        "order": 24,
        "title": "Транспорт и такси",
        "arTitle": "المواصلات والتاكسي",
        "audio": "assets/textbook/audio/lesson-m8l3.mp3"
      }
    ]
  },
  {
    "module": 9,
    "level": "A2",
    "title": "Еда и покупки",
    "ar": "الأكل والتسوق",
    "free": false,
    "chapter": "assets/textbook/chapters/chapter-unit-09.pdf",
    "lessons": [
      {
        "id": "m9l1",
        "order": 25,
        "title": "Еда и заказ в кафе",
        "arTitle": "الأكل والطلب في الكافيه",
        "audio": "assets/textbook/audio/lesson-m9l1.mp3"
      },
      {
        "id": "m9l2",
        "order": 26,
        "title": "Рынок цены и количества",
        "arTitle": "السوق والأسعار والكميات",
        "audio": "assets/textbook/audio/lesson-m9l2.mp3"
      },
      {
        "id": "m9l3",
        "order": 27,
        "title": "Одежда размер и цвет",
        "arTitle": "الهدوم والمقاس واللون",
        "audio": "assets/textbook/audio/lesson-m9l3.mp3"
      }
    ]
  },
  {
    "module": 10,
    "level": "A2",
    "title": "Работа и цифровая жизнь",
    "ar": "الشغل والحياة الرقمية",
    "free": false,
    "chapter": "assets/textbook/chapters/chapter-unit-10.pdf",
    "lessons": [
      {
        "id": "m10l1",
        "order": 28,
        "title": "Работа профессии и обязанности",
        "arTitle": "الشغل والمهن والمسؤوليات",
        "audio": "assets/textbook/audio/lesson-m10l1.mp3"
      },
      {
        "id": "m10l2",
        "order": 29,
        "title": "Офис звонки и договорённости",
        "arTitle": "المكتب والمكالمات والمواعيد",
        "audio": "assets/textbook/audio/lesson-m10l2.mp3"
      },
      {
        "id": "m10l3",
        "order": 30,
        "title": "Телефон интернет и техника",
        "arTitle": "الموبايل والإنترنت والتكنولوجيا",
        "audio": "assets/textbook/audio/lesson-m10l3.mp3"
      }
    ]
  },
  {
    "module": 11,
    "level": "A2–B1",
    "title": "Здоровье и услуги",
    "ar": "الصحة والخدمات",
    "free": false,
    "chapter": "assets/textbook/chapters/chapter-unit-11.pdf",
    "lessons": [
      {
        "id": "m11l1",
        "order": 31,
        "title": "Тело и симптомы",
        "arTitle": "الجسم والأعراض",
        "audio": "assets/textbook/audio/lesson-m11l1.mp3"
      },
      {
        "id": "m11l2",
        "order": 32,
        "title": "Аптека врач и экстренная помощь",
        "arTitle": "الصيدلية والدكتور والطوارئ",
        "audio": "assets/textbook/audio/lesson-m11l2.mp3"
      },
      {
        "id": "m11l3",
        "order": 33,
        "title": "Ремонт и бытовые услуги",
        "arTitle": "الصيانة والخدمات",
        "audio": "assets/textbook/audio/lesson-m11l3.mp3"
      }
    ]
  },
  {
    "module": 12,
    "level": "B1",
    "title": "Общение и путешествия",
    "ar": "التواصل والسفر",
    "free": false,
    "chapter": "assets/textbook/chapters/chapter-unit-12.pdf",
    "lessons": [
      {
        "id": "m12l1",
        "order": 34,
        "title": "Приглашения чувства и общение",
        "arTitle": "العزومات والمشاعر والتواصل",
        "audio": "assets/textbook/audio/lesson-m12l1.mp3"
      },
      {
        "id": "m12l2",
        "order": 35,
        "title": "Мнение сравнение и связная речь",
        "arTitle": "الرأي والمقارنة وربط الكلام",
        "audio": "assets/textbook/audio/lesson-m12l2.mp3"
      },
      {
        "id": "m12l3",
        "order": 36,
        "title": "Путешествие гостиница и итоговая практика",
        "arTitle": "السفر والفندق والمراجعة النهائية",
        "audio": "assets/textbook/audio/lesson-m12l3.mp3"
      }
    ]
  }
];
