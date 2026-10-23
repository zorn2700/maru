export const VERB_PERSONS = ["я", "ты м.", "ты ж.", "он", "она", "мы", "вы", "они"];

const futureTr = (tr) => {
  if (tr.startsWith("biy")) return `hay${tr.slice(3)}`;
  if (tr.startsWith("bit")) return `hat${tr.slice(3)}`;
  if (tr.startsWith("bin")) return `han${tr.slice(3)}`;
  if (tr.startsWith("ba")) return `ha${tr.slice(2)}`;
  return `h${tr}`;
};

const negativeAr = (ar) => (ar.endsWith("وا") ? `ما${ar.slice(0, -1)}ش` : `ما${ar}ش`);

const build = (pairs, people = VERB_PERSONS) => pairs.map(([ar, tr], index) => ({ person: people[index], ar, tr }));

const makeVerb = ({ id, ar, tr, ru, root, pattern, level = "A1", note = "", present, past, imperative, example }) => ({
  id,
  ar,
  tr,
  ru,
  root,
  pattern,
  level,
  note,
  example,
  forms: {
    present: build(present),
    past: build(past),
    future: present.map(([ar, tr], index) => ({ person: VERB_PERSONS[index], ar: `ه${ar.slice(1)}`, tr: futureTr(tr) })),
    negative: present.map(([ar, tr], index) => ({ person: VERB_PERSONS[index], ar: negativeAr(ar), tr: `ma-${tr}-sh` })),
    imperative: build(imperative, ["ты м.", "ты ж.", "вы"]),
  },
});

export const verbTenses = [
  { id: "present", title: "Настоящее", hint: "Обычное действие или привычка. Приставка b-." },
  { id: "past", title: "Прошедшее", hint: "Завершённое действие. Суффиксы -t, -it, -na, -u." },
  { id: "future", title: "Будущее", hint: "Планы и обещания. Приставка ha-." },
  { id: "negative", title: "Отрицание", hint: "Рамка ma-…-sh вокруг настоящего времени." },
  { id: "imperative", title: "Команда", hint: "Просьба или приказ: м. / ж. / вы." },
];

export const verbLibrary = [
  makeVerb({
    id: "katab", ar: "كتب", tr: "katab", ru: "писать", root: "ك-ت-ب", pattern: "faʿal → yifʿil", level: "A1",
    note: "Базовая модель правильного глагола: запомните её как образец.",
    present: [["بكتب", "baktib"], ["بتكتب", "bitiktib"], ["بتكتبي", "bitiktibi"], ["بيكتب", "biyiktib"], ["بتكتب", "bitiktib"], ["بنكتب", "binktib"], ["بتكتبوا", "bitiktibu"], ["بيكتبوا", "biyiktibu"]],
    past: [["كتبت", "katabt"], ["كتبت", "katabt"], ["كتبتي", "katabti"], ["كتب", "katab"], ["كتبت", "katabit"], ["كتبنا", "katabna"], ["كتبتوا", "katabtu"], ["كتبوا", "katabu"]],
    imperative: [["اكتب", "iktib"], ["اكتبي", "iktibi"], ["اكتبوا", "iktibu"]],
    example: { ar: "بكتب إيميل كل يوم", tr: "baktib email koll yoom", ru: "Я пишу письмо каждый день" },
  }),
  makeVerb({
    id: "shirib", ar: "شرب", tr: "shirib", ru: "пить", root: "ش-ر-ب", pattern: "faʿil → yifʿal", level: "A1",
    present: [["بشرب", "bashrab"], ["بتشرب", "bitshrab"], ["بتشربي", "bitshrabi"], ["بيشرب", "biyishrab"], ["بتشرب", "bitshrab"], ["بنشرب", "binshrab"], ["بتشربوا", "bitshrabu"], ["بيشربوا", "biyishrabu"]],
    past: [["شربت", "shiribt"], ["شربت", "shiribt"], ["شربتي", "shiribti"], ["شرب", "shirib"], ["شربت", "shirbit"], ["شربنا", "shiribna"], ["شربتوا", "shiribtu"], ["شربوا", "shiribu"]],
    imperative: [["اشرب", "ishrab"], ["اشربي", "ishrabi"], ["اشربوا", "ishrabu"]],
    example: { ar: "بشرب قهوة الصبح", tr: "bashrab ʔahwa eṣ-ṣobḥ", ru: "Я пью кофе утром" },
  }),
  makeVerb({
    id: "akal", ar: "أكل", tr: "akal", ru: "есть, кушать", root: "أ-ك-ل", pattern: "faʿal → yaaʿul", level: "A1",
    note: "В настоящем времени появляется долгий aa: yaakul.",
    present: [["باكل", "baakul"], ["بتاكل", "bitaakul"], ["بتاكلي", "bitaakli"], ["بياكل", "biyaakul"], ["بتاكل", "bitaakul"], ["بناكل", "binaakul"], ["بتاكلوا", "bitaaklu"], ["بياكلوا", "biyaaklu"]],
    past: [["أكلت", "akalt"], ["أكلت", "akalt"], ["أكلتي", "akalti"], ["أكل", "akal"], ["أكلت", "akalit"], ["أكلنا", "akalna"], ["أكلتوا", "akaltu"], ["أكلوا", "akalu"]],
    imperative: [["كل", "kul"], ["كلي", "kuli"], ["كلوا", "kulu"]],
    example: { ar: "بناكل في مطعم", tr: "binaakul fi maṭʿam", ru: "Мы едим в ресторане" },
  }),
  makeVerb({
    id: "raah", ar: "راح", tr: "raaḥ", ru: "идти, ехать", root: "ر-و-ح", pattern: "hollow: raaḥ → yiruuḥ", level: "A1",
    note: "Очень частый неправильный глагол. В настоящем долгий uu.",
    present: [["بروح", "baruuh"], ["بتروح", "bitruuh"], ["بتروحي", "bitruuhi"], ["بيروح", "biyiruuh"], ["بتروح", "bitruuh"], ["بنروح", "binruuh"], ["بتروحوا", "bitruuhu"], ["بيروحوا", "biyiruuhu"]],
    past: [["رحت", "roht"], ["رحت", "roht"], ["رحتي", "rohti"], ["راح", "raah"], ["راحت", "raahit"], ["رحنا", "rohna"], ["رحتوا", "rohtu"], ["راحوا", "raahu"]],
    imperative: [["روح", "ruuh"], ["روحي", "ruuhi"], ["روحوا", "ruuhu"]],
    example: { ar: "بروح الشغل بالمترو", tr: "baruuh esh-shoghl bil-metro", ru: "Я езжу на работу на метро" },
  }),
  makeVerb({
    id: "ga", ar: "جه", tr: "ge", ru: "приходить", root: "ج-ي", pattern: "irregular: ga → yigi", level: "A1",
    note: "В Каире часто звучит ge / ga. Команда — تعالى taʿaala.",
    present: [["باجي", "baagi"], ["بتجي", "bitgi"], ["بتجي", "bitgi"], ["بييجي", "biyigi"], ["بتجي", "bitgi"], ["بنيجي", "bingi"], ["بتجوا", "bitgu"], ["بييجوا", "biyigu"]],
    past: [["جيت", "giit"], ["جيت", "giit"], ["جيتي", "giiti"], ["جه", "ge"], ["جت", "gat"], ["جينا", "giina"], ["جيتوا", "giitu"], ["جم", "gum"]],
    imperative: [["تعالى", "taʿaala"], ["تعالي", "taʿaali"], ["تعالوا", "taʿaalu"]],
    example: { ar: "بتيجي إمتى؟", tr: "bitgi emta?", ru: "Когда ты придёшь?" },
  }),
  makeVerb({
    id: "shaaf", ar: "شاف", tr: "shaaf", ru: "видеть, смотреть", root: "ش-و-ف", pattern: "hollow: shaaf → yishuuf", level: "A1",
    present: [["بشوف", "bashuuf"], ["بتشوف", "bitshuuf"], ["بتشوفي", "bitshuufi"], ["بيشوف", "biyishuuf"], ["بتشوف", "bitshuuf"], ["بنشوف", "binshuuf"], ["بتشوفوا", "bitshuufu"], ["بيشوفوا", "biyishuufu"]],
    past: [["شفت", "shoft"], ["شفت", "shoft"], ["شفتي", "shofti"], ["شاف", "shaaf"], ["شافت", "shaafit"], ["شفنا", "shofna"], ["شفتوا", "shoftu"], ["شافوا", "shaafu"]],
    imperative: [["شوف", "shuuf"], ["شوفي", "shuufi"], ["شوفوا", "shuufu"]],
    example: { ar: "شفت فيلم امبارح", tr: "shoft filim embaareḥ", ru: "Я вчера посмотрел фильм" },
  }),
  makeVerb({
    id: "hibb", ar: "حب", tr: "ḥabb", ru: "любить", root: "ح-ب-ب", pattern: "faʿʿal / geminate", level: "A1",
    note: "Двойная ب в корне. В настоящем форма упрощается: baḥibb.",
    present: [["بحب", "baḥibb"], ["بتحب", "bitḥibb"], ["بتحبي", "bitḥibbi"], ["بيحب", "biyiḥibb"], ["بتحب", "bitḥibb"], ["بنحب", "binḥibb"], ["بتحبوا", "bitḥibbu"], ["بيحبوا", "biyiḥibbu"]],
    past: [["حبيت", "ḥabbeet"], ["حبيت", "ḥabbeet"], ["حبيتي", "ḥabbeeti"], ["حب", "ḥabb"], ["حبت", "ḥabbit"], ["حبينا", "ḥabbina"], ["حبيتوا", "ḥabbeetu"], ["حبوا", "ḥabbu"]],
    imperative: [["حب", "ḥibb"], ["حبي", "ḥibbi"], ["حبوا", "ḥibbu"]],
    example: { ar: "بحب القهوة", tr: "baḥibb el-ʔahwa", ru: "Я люблю кофе" },
  }),
  makeVerb({
    id: "irif", ar: "عرف", tr: "ʿirif", ru: "знать, уметь", root: "ع-ر-ف", pattern: "faʿil → yifʿal", level: "A1",
    present: [["بعرف", "baʿraf"], ["بتعرف", "bitʿraf"], ["بتعرفي", "bitʿrafi"], ["بيعرف", "biyʿraf"], ["بتعرف", "bitʿraf"], ["بنعرف", "binʿraf"], ["بتعرفوا", "bitʿrafu"], ["بيعرفوا", "biyʿrafu"]],
    past: [["عرفت", "ʿereft"], ["عرفت", "ʿereft"], ["عرفتي", "ʿerefti"], ["عرف", "ʿirif"], ["عرفت", "ʿirfit"], ["عرفنا", "ʿerefna"], ["عرفتوا", "ʿereftu"], ["عرفوا", "ʿirfu"]],
    imperative: [["اعرف", "iʿraf"], ["اعرفي", "iʿrafi"], ["اعرفوا", "iʿrafu"]],
    example: { ar: "بعرف أتكلم شوية", tr: "baʿraf atkallim shwayya", ru: "Я умею немного говорить" },
  }),
  makeVerb({
    id: "fihim", ar: "فهم", tr: "fihim", ru: "понимать", root: "ف-ه-م", pattern: "faʿil → yifham", level: "A1",
    present: [["بفهم", "bafham"], ["بتفهم", "bitfham"], ["بتفهمي", "bitfhami"], ["بيفهم", "biyifham"], ["بتفهم", "bitfham"], ["بنفهم", "binfham"], ["بتفهموا", "bitfhamu"], ["بيفهموا", "biyifhamu"]],
    past: [["فهمت", "fhimt"], ["فهمت", "fhimt"], ["فهمتي", "fhimti"], ["فهم", "fihim"], ["فهمت", "fihmit"], ["فهمنا", "fhimna"], ["فهمتوا", "fhimtu"], ["فهموا", "fihmu"]],
    imperative: [["افهم", "ifham"], ["افهمي", "ifhami"], ["افهموا", "ifhamu"]],
    example: { ar: "فهمت الدرس", tr: "fhimt ed-dars", ru: "Я понял урок" },
  }),
  makeVerb({
    id: "sakan", ar: "سكن", tr: "sakan", ru: "жить, проживать", root: "س-ك-ن", pattern: "faʿal → yifʿol", level: "A1",
    present: [["بسكن", "baskon"], ["بتسكن", "bitskon"], ["بتسكني", "bitskoni"], ["بيسكن", "biyiskon"], ["بتسكن", "bitskon"], ["بنسكن", "binson"], ["بتسكنوا", "bitskonu"], ["بيسكنوا", "biyiskonu"]],
    past: [["سكنت", "sakant"], ["سكنت", "sakant"], ["سكنتي", "sakanti"], ["سكن", "sakan"], ["سكنت", "sakanit"], ["سكنا", "sakanna"], ["سكنتوا", "sakantu"], ["سكنوا", "sakano"]],
    imperative: [["اسكن", "iskon"], ["اسكني", "iskoni"], ["اسكنوا", "iskonu"]],
    example: { ar: "بسكن في القاهرة", tr: "baskon fil-Qaahira", ru: "Я живу в Каире" },
  }),
  makeVerb({
    id: "ishtaghal", ar: "اشتغل", tr: "ishtaghal", ru: "работать", root: "ش-غ-ل", pattern: "itfaʿal (VIII)", level: "A1",
    note: "Порода VIII с приставкой i-. Очень частый глагол.",
    present: [["بشتغل", "bashtaghal"], ["بتشتغل", "bitishtaghal"], ["بتشتغلي", "bitishtaghali"], ["بيشتغل", "biyishtaghal"], ["بتشتغل", "bitishtaghal"], ["بنشتغل", "binishtaghal"], ["بتشتغلوا", "bitishtaghalu"], ["بيشتغلوا", "biyishtaghalu"]],
    past: [["اشتغلت", "ishtaghalt"], ["اشتغلت", "ishtaghalt"], ["اشتغلتي", "ishtaghalti"], ["اشتغل", "ishtaghal"], ["اشتغلت", "ishtaghalit"], ["اشتغلنا", "ishtaghalna"], ["اشتغلتوا", "ishtaghaltu"], ["اشتغلوا", "ishtaghalu"]],
    imperative: [["اشتغل", "ishtaghal"], ["اشتغلي", "ishtaghali"], ["اشتغلوا", "ishtaghalu"]],
    example: { ar: "بشتغل في شركة", tr: "bashtaghal fi sharika", ru: "Я работаю в компании" },
  }),
  makeVerb({
    id: "daras", ar: "درس", tr: "daras", ru: "учиться, изучать", root: "د-ر-س", pattern: "faʿal → yifʿil", level: "A1",
    present: [["بدرس", "badris"], ["بتدرس", "bitidris"], ["بتدرسي", "bitidrisi"], ["بيدرس", "biyidris"], ["بتدرس", "bitidris"], ["بندرس", "bindris"], ["بتدرسوا", "bitidrisu"], ["بيدرسوا", "biyidrisu"]],
    past: [["درست", "darast"], ["درست", "darast"], ["درستي", "darasti"], ["درس", "daras"], ["درست", "darasit"], ["درسنا", "darasna"], ["درستوا", "darastu"], ["درسوا", "darasu"]],
    imperative: [["ادرس", "idris"], ["ادرسي", "idrisi"], ["ادرسوا", "idrisu"]],
    example: { ar: "بدرس عربي كل يوم", tr: "badris ʿarabi koll yoom", ru: "Я учу арабский каждый день" },
  }),
  makeVerb({
    id: "kallim", ar: "كلّم", tr: "kallim", ru: "звонить; говорить с кем-то", root: "ك-ل-م", pattern: "faʿʿal (II)", level: "A1",
    present: [["بكلّم", "bakallim"], ["بتكلّم", "bitkallim"], ["بتكلّمي", "bitkallimi"], ["بيكلّم", "biyikallim"], ["بتكلّم", "bitkallim"], ["بنكلّم", "binkallim"], ["بتكلّموا", "bitkallimu"], ["بيكلّموا", "biyikallimu"]],
    past: [["كلمت", "kallimt"], ["كلمت", "kallimt"], ["كلمتي", "kallimti"], ["كلم", "kallim"], ["كلمت", "kallimit"], ["كلمنا", "kallimna"], ["كلمتوا", "kallimtu"], ["كلموا", "kallimu"]],
    imperative: [["كلّم", "kallim"], ["كلّمي", "kallimi"], ["كلّموا", "kallimu"]],
    example: { ar: "بكلّمك كل يوم", tr: "bakallimak koll yoom", ru: "Я звоню тебе каждый день" },
  }),
  makeVerb({
    id: "itkallim", ar: "اتكلم", tr: "itkallim", ru: "разговаривать", root: "ك-ل-م", pattern: "itfaʿʿal (V)", level: "A1",
    note: "Возвратная пара к كلّم: говорить / разговаривать.",
    present: [["باتكلم", "batkallim"], ["بتتكلم", "bititkallim"], ["بتتكلمي", "bititkallimi"], ["بيتكلم", "biyitkallim"], ["بتتكلم", "bititkallim"], ["بنتكلم", "binitkallim"], ["بتتكلموا", "bititkallimu"], ["بيتكلموا", "biyitkallimu"]],
    past: [["اتكلمت", "itkallimt"], ["اتكلمت", "itkallimt"], ["اتكلمتي", "itkallimti"], ["اتكلم", "itkallim"], ["اتكلمت", "itkallimit"], ["اتكلمنا", "itkallimna"], ["اتكلمتوا", "itkallimtu"], ["اتكلموا", "itkallimu"]],
    imperative: [["اتكلم", "itkallim"], ["اتكلمي", "itkallimi"], ["اتكلموا", "itkallimu"]],
    example: { ar: "بتكلم مع أصحابي", tr: "batkallim maʿ aṣḥaabi", ru: "Я разговариваю с друзьями" },
  }),
  makeVerb({
    id: "saafar", ar: "سافر", tr: "saafar", ru: "путешествовать, уезжать", root: "س-ف-ر", pattern: "faaʿal (III)", level: "A1",
    present: [["بسافر", "basaafir"], ["بتسافر", "bitsaafir"], ["بتسافري", "bitsaafri"], ["بيسافر", "biyisaafir"], ["بتسافر", "bitsaafir"], ["بنسافر", "binsaafir"], ["بتسافروا", "bitsaafru"], ["بيسافروا", "biyisaafru"]],
    past: [["سافرت", "saafart"], ["سافرت", "saafart"], ["سافرتي", "saafarti"], ["سافر", "saafar"], ["سافرت", "saafarit"], ["سافرنا", "saafarna"], ["سافرتوا", "saafartu"], ["سافروا", "saafaru"]],
    imperative: [["سافر", "saafir"], ["سافري", "saafri"], ["سافروا", "saafru"]],
    example: { ar: "بسافر إسكندرية كل شهر", tr: "basaafir Eskendereyya koll shahr", ru: "Я езжу в Александрию каждый месяц" },
  }),
  makeVerb({
    id: "rigi", ar: "رجع", tr: "rigiʿ", ru: "возвращаться", root: "ر-ج-ع", pattern: "faʿil → yifʿal", level: "A1",
    present: [["برجع", "bargaʿ"], ["بترجع", "bitrigaʿ"], ["بترجعي", "bitrigʿi"], ["بيرجع", "biyirgaʿ"], ["بترجع", "bitrigaʿ"], ["بنرجع", "binrigaʿ"], ["بترجعوا", "bitrigʿu"], ["بيرجعوا", "biyirigʿu"]],
    past: [["رجعت", "rigiʿt"], ["رجعت", "rigiʿt"], ["رجعتي", "rigiʿti"], ["رجع", "rigiʿ"], ["رجعت", "rigʿit"], ["رجعنا", "rigiʿna"], ["رجعتوا", "rigiʿtu"], ["رجعوا", "rigʿu"]],
    imperative: [["ارجع", "irgaʿ"], ["ارجعي", "irgaʿi"], ["ارجعوا", "irgaʿu"]],
    example: { ar: "برجع البيت الساعة ستة", tr: "bargaʿ el-bēt es-saaʿa setta", ru: "Я возвращаюсь домой в шесть" },
  }),
  makeVerb({
    id: "khad", ar: "خد", tr: "khad", ru: "брать, взять", root: "خ-د", pattern: "hollow: khad → yaakhod", level: "A1",
    note: "Разговорная форма вместо أخذ. В настоящем долгий aa.",
    present: [["باخد", "baakhod"], ["بتاخد", "bitaakhod"], ["بتاخدي", "bitaakhdi"], ["بياخد", "biyaakhod"], ["بتاخد", "bitaakhod"], ["بناخد", "binaakhod"], ["بتاخدوا", "bitaakhdu"], ["بياخدوا", "biyaakhdu"]],
    past: [["خدت", "khadt"], ["خدت", "khadt"], ["خدتي", "khadti"], ["خد", "khad"], ["خدت", "khadit"], ["خدنا", "khadna"], ["خدتوا", "khadtu"], ["خدوا", "khadu"]],
    imperative: [["خد", "khod"], ["خدي", "khodi"], ["خدوا", "khodu"]],
    example: { ar: "باخد المترو", tr: "baakhod el-metro", ru: "Я езжу на метро" },
  }),
  makeVerb({
    id: "gaab", ar: "جاب", tr: "gaab", ru: "приносить", root: "ج-ي-ب", pattern: "hollow: gaab → yigiib", level: "A1",
    present: [["بجيب", "bagiib"], ["بتجيب", "bitgiib"], ["بتجيبي", "bitgiibi"], ["بيجيب", "biyigiib"], ["بتجيب", "bitgiib"], ["بنجيب", "bingiib"], ["بتجيبوا", "bitgiibu"], ["بيجيبوا", "biyigiibu"]],
    past: [["جبت", "giibt"], ["جبت", "giibt"], ["جبتي", "giibti"], ["جاب", "gaab"], ["جابت", "gaabit"], ["جبنا", "gibna"], ["جبتوا", "giibtu"], ["جابوا", "gaabu"]],
    imperative: [["جيب", "giib"], ["جيبي", "giibi"], ["جيبوا", "giibu"]],
    example: { ar: "بجيب الفطار", tr: "bagiib el-fiṭaar", ru: "Я приношу завтрак" },
  }),
  makeVerb({
    id: "amal", ar: "عمل", tr: "ʿamal", ru: "делать, готовить", root: "ع-م-ل", pattern: "faʿal → yifʿil", level: "A1",
    present: [["بعمل", "baʿmil"], ["بتعمل", "bitiʿmil"], ["بتعملي", "bitiʿmili"], ["بيعمل", "biyiʿmil"], ["بتعمل", "bitiʿmil"], ["بنعمل", "biniʿmil"], ["بتعملوا", "bitiʿmilu"], ["بيعملوا", "biyiʿmilu"]],
    past: [["عملت", "ʿamalt"], ["عملت", "ʿamalt"], ["عملتي", "ʿamalti"], ["عمل", "ʿamal"], ["عملت", "ʿamalit"], ["عملنا", "ʿamalna"], ["عملتوا", "ʿamaltu"], ["عملوا", "ʿamalu"]],
    imperative: [["اعمل", "iʿmil"], ["اعملي", "iʿmili"], ["اعملوا", "iʿmilu"]],
    example: { ar: "بعمل أكل مصري", tr: "baʿmil akl maṣri", ru: "Я готовлю египетскую еду" },
  }),
  makeVerb({
    id: "aal", ar: "قال", tr: "ʔaal", ru: "говорить, сказать", root: "ق-و-ل", pattern: "hollow: ʔaal → yʔuul", level: "A1",
    present: [["بقول", "baʔuul"], ["بتقول", "bitʔuul"], ["بتقولي", "bitʔuuli"], ["بيقول", "biyʔuul"], ["بتقول", "bitʔuul"], ["بنقول", "binʔuul"], ["بتقولوا", "bitʔuulu"], ["بيقولوا", "biyʔuulu"]],
    past: [["قلت", "ʔolt"], ["قلت", "ʔolt"], ["قلتي", "ʔolti"], ["قال", "ʔaal"], ["قالت", "ʔaalit"], ["قلنا", "ʔolna"], ["قلتوا", "ʔoltu"], ["قالوا", "ʔaalu"]],
    imperative: [["قول", "ʔuul"], ["قولي", "ʔuuli"], ["قولوا", "ʔuulu"]],
    example: { ar: "بقول الحقيقة", tr: "baʔuul el-ḥaʔiiʔa", ru: "Я говорю правду" },
  }),
  makeVerb({
    id: "fatah", ar: "فتح", tr: "fataḥ", ru: "открывать", root: "ف-ت-ح", pattern: "faʿal → yiftaḥ", level: "A1",
    present: [["بفتح", "baftaḥ"], ["بتفتح", "bitiftaḥ"], ["بتفتحي", "bitiftaḥi"], ["بيفتح", "biyiftaḥ"], ["بتفتح", "bitiftaḥ"], ["بنفتح", "biniftaḥ"], ["بتفتحوا", "bitiftaḥu"], ["بيفتحوا", "biyiftaḥu"]],
    past: [["فتحت", "fataḥt"], ["فتحت", "fataḥt"], ["فتحتي", "fataḥti"], ["فتح", "fataḥ"], ["فتحت", "fataḥit"], ["فتحنا", "fataḥna"], ["فتحتوا", "fataḥtu"], ["فتحوا", "fataḥu"]],
    imperative: [["افتح", "iftaḥ"], ["افتحي", "iftaḥi"], ["افتحوا", "iftaḥu"]],
    example: { ar: "بفتح الشباك", tr: "baftaḥ esh-shobbaak", ru: "Я открываю окно" },
  }),
  makeVerb({
    id: "afal", ar: "قفل", tr: "ʔafal", ru: "закрывать", root: "ق-ف-ل", pattern: "faʿal → yifʿil", level: "A1",
    present: [["بقفل", "baʔfil"], ["بتقفل", "bitiʔfil"], ["بتقفلي", "bitiʔfili"], ["بيقفل", "biyiʔfil"], ["بتقفل", "bitiʔfil"], ["بنقفل", "biniʔfil"], ["بتقفلوا", "bitiʔfilu"], ["بيقفلوا", "biyiʔfilu"]],
    past: [["قفلت", "ʔafalt"], ["قفلت", "ʔafalt"], ["قفلتي", "ʔafalti"], ["قفل", "ʔafal"], ["قفلت", "ʔafalit"], ["قفلنا", "ʔafalna"], ["قفلتوا", "ʔafaltu"], ["قفلوا", "ʔafalu"]],
    imperative: [["اقفل", "iʔfil"], ["اقفلي", "iʔfili"], ["اقفلوا", "iʔfilu"]],
    example: { ar: "بقفل الباب", tr: "baʔfil el-baab", ru: "Я закрываю дверь" },
  }),
  makeVerb({
    id: "aad", ar: "قعد", tr: "ʔaʿad", ru: "сидеть; садиться", root: "ق-ع-د", pattern: "faʿal → yifʿod", level: "A1",
    present: [["بقعد", "baʔʿod"], ["بتقعد", "bitiʔʿod"], ["بتقعدي", "bitiʔʿodi"], ["بيقعد", "biyiʔʿod"], ["بتقعد", "bitiʔʿod"], ["بنقعد", "biniʔʿod"], ["بتقعدوا", "bitiʔʿodu"], ["بيقعدوا", "biyiʔʿodu"]],
    past: [["قعدت", "ʔaʿadt"], ["قعدت", "ʔaʿadt"], ["قعدتي", "ʔaʿadti"], ["قعد", "ʔaʿad"], ["قعدت", "ʔaʿadit"], ["قعدنا", "ʔaʿadna"], ["قعدتوا", "ʔaʿadtu"], ["قعدوا", "ʔaʿadu"]],
    imperative: [["اقعد", "oʔʿod"], ["اقعدي", "oʔʿodi"], ["اقعدوا", "oʔʿodu"]],
    example: { ar: "بقعد هنا", tr: "baʔʿod hina", ru: "Я сижу здесь" },
  }),
  makeVerb({
    id: "naam", ar: "نام", tr: "naam", ru: "спать; ложиться спать", root: "ن-و-م", pattern: "hollow: naam → ynaam", level: "A1",
    present: [["بنام", "banaam"], ["بتنام", "bitnaam"], ["بتنامي", "bitnaami"], ["بينام", "biynaam"], ["بتنام", "bitnaam"], ["بننام", "binnaam"], ["بتناموا", "bitnaamu"], ["بيناموا", "biynaamu"]],
    past: [["نمت", "nimt"], ["نمت", "nimt"], ["نمتي", "nimti"], ["نام", "naam"], ["نامت", "naamat"], ["نمنا", "nimna"], ["نمتوا", "nimtu"], ["ناموا", "naamu"]],
    imperative: [["نام", "naam"], ["نامي", "naami"], ["ناموا", "naamu"]],
    example: { ar: "بنام بدري", tr: "banaam badri", ru: "Я ложусь спать рано" },
  }),
  makeVerb({
    id: "saha", ar: "صحى", tr: "ṣaḥa", ru: "просыпаться", root: "ص-ح-ي", pattern: "defective: ṣaḥa → yiṣḥa", level: "A1",
    present: [["بصحى", "baṣḥa"], ["بتصحى", "bitiṣḥa"], ["بتصحى", "bitiṣḥa"], ["بيصحى", "biyiṣḥa"], ["بتصحى", "bitiṣḥa"], ["بنصحى", "biniṣḥa"], ["بتصحوا", "bitiṣḥu"], ["بيصحوا", "biyiṣḥu"]],
    past: [["صحيت", "ṣaḥeet"], ["صحيت", "ṣaḥeet"], ["صحيتي", "ṣaḥeeti"], ["صحى", "ṣaḥa"], ["صحيت", "ṣaḥyit"], ["صحينا", "ṣaḥeena"], ["صحيتوا", "ṣaḥeetu"], ["صحوا", "ṣaḥu"]],
    imperative: [["اصحى", "iṣḥa"], ["اصحي", "iṣḥi"], ["اصحوا", "iṣḥu"]],
    example: { ar: "بصحى الساعة سبعة", tr: "baṣḥa es-saaʿa sabʿa", ru: "Я просыпаюсь в семь" },
  }),
  makeVerb({
    id: "libis", ar: "لبس", tr: "libis", ru: "носить, надевать", root: "ل-ب-س", pattern: "faʿil → yilbas", level: "A1",
    present: [["بلبس", "balbas"], ["بتلبس", "bitilbas"], ["بتلبسي", "bitilbasi"], ["بيلبس", "biyilbas"], ["بتلبس", "bitilbas"], ["بنلبس", "binilbas"], ["بتلبسوا", "bitilbasu"], ["بيلبسوا", "biyilbasu"]],
    past: [["لبست", "libist"], ["لبست", "libist"], ["لبستي", "libisti"], ["لبس", "libis"], ["لبست", "libsit"], ["لبسنا", "libisna"], ["لبستوا", "libistu"], ["لبسوا", "libsu"]],
    imperative: [["البس", "ilbis"], ["البسي", "ilbisi"], ["البسوا", "ilbisu"]],
    example: { ar: "بلبس قميص", tr: "balbas ʔamiiṣ", ru: "Я ношу рубашку" },
  }),
  makeVerb({
    id: "sama", ar: "سمع", tr: "simiʿ", ru: "слышать, слушать", root: "س-م-ع", pattern: "faʿil → yismaʿ", level: "A1",
    present: [["بسمع", "basmaʿ"], ["بتسمع", "bitsmaʿ"], ["بتسمعي", "bitsmaʿi"], ["بيسمع", "biyismaʿ"], ["بتسمع", "bitsmaʿ"], ["بنسمع", "binsmaʿ"], ["بتسمعوا", "bitsmaʿu"], ["بيسمعوا", "biyismaʿu"]],
    past: [["سمعت", "simiʿt"], ["سمعت", "simiʿt"], ["سمعتي", "simiʿti"], ["سمع", "simiʿ"], ["سمعت", "simʿit"], ["سمعنا", "simiʿna"], ["سمعتوا", "simiʿtu"], ["سمعوا", "simʿu"]],
    imperative: [["اسمع", "ismaʿ"], ["اسمعي", "ismaʿi"], ["اسمعوا", "ismaʿu"]],
    example: { ar: "بسمع أغاني", tr: "basmaʿ aghaani", ru: "Я слушаю песни" },
  }),
  makeVerb({
    id: "said", ar: "ساعد", tr: "saaʿid", ru: "помогать", root: "س-ع-د", pattern: "faaʿal (III)", level: "A2",
    present: [["بساعد", "basaʿid"], ["بتساعد", "bitsaʿid"], ["بتساعدي", "bitsaʿdi"], ["بيساعد", "biyisaʿid"], ["بتساعد", "bitsaʿid"], ["بنساعد", "binsaʿid"], ["بتساعدوا", "bitsaʿdu"], ["بيساعدوا", "biyisaʿdu"]],
    past: [["ساعدت", "saaʿadt"], ["ساعدت", "saaʿadt"], ["ساعدتي", "saaʿadti"], ["ساعد", "saaʿad"], ["ساعدت", "saaʿadit"], ["ساعدنا", "saaʿadna"], ["ساعدتوا", "saaʿadtu"], ["ساعدوا", "saaʿadu"]],
    imperative: [["ساعد", "saaʿid"], ["ساعدي", "saaʿdi"], ["ساعدوا", "saaʿdu"]],
    example: { ar: "بساعد أمي", tr: "basaʿid ommi", ru: "Я помогаю маме" },
  }),
  makeVerb({
    id: "istanna", ar: "استنى", tr: "istanna", ru: "ждать", root: "ا-س-ت-ن-ى", pattern: "istafʿal (X), defective", level: "A2",
    note: "В повседневной речи очень частый глагол. Женская команда: استني istanni.",
    present: [["بستنى", "bastanna"], ["بتستنى", "bitistanna"], ["بتستني", "bitistanni"], ["بيستنى", "biyistanna"], ["بتستنى", "bitistanna"], ["بنستنى", "binistanna"], ["بتستنوا", "bitistannu"], ["بيستنوا", "biyistannu"]],
    past: [["استنيت", "istaneet"], ["استنيت", "istaneet"], ["استنيتي", "istaneeti"], ["استنى", "istanna"], ["استنت", "istannit"], ["استنينا", "istaneena"], ["استنيتوا", "istaneetu"], ["استنوا", "istannu"]],
    imperative: [["استنى", "istanna"], ["استني", "istanni"], ["استنوا", "istannu"]],
    example: { ar: "بستنى الأتوبيس", tr: "bastanna el-otobiis", ru: "Я жду автобус" },
  }),
  makeVerb({
    id: "hawal", ar: "حاول", tr: "ḥaawal", ru: "пытаться", root: "ح-و-ل", pattern: "faaʿal (III)", level: "A2",
    present: [["بحاول", "baḥaawil"], ["بتحاول", "bitḥaawil"], ["بتحاولي", "bitḥaawli"], ["بيحاول", "biyḥaawil"], ["بتحاول", "bitḥaawil"], ["بنحاول", "binḥaawil"], ["بتحاولوا", "bitḥaawlu"], ["بيحاولوا", "biyḥaawlu"]],
    past: [["حاولت", "ḥaawalt"], ["حاولت", "ḥaawalt"], ["حاولتي", "ḥaawalti"], ["حاول", "ḥaawal"], ["حاولت", "ḥaawalit"], ["حاولنا", "ḥaawalna"], ["حاولتوا", "ḥaawaltu"], ["حاولوا", "ḥaawalu"]],
    imperative: [["حاول", "ḥaawil"], ["حاولي", "ḥaawli"], ["حاولوا", "ḥaawlu"]],
    example: { ar: "بحاول أفهم", tr: "baḥaawil afham", ru: "Я пытаюсь понять" },
  }),
  makeVerb({
    id: "dawwar", ar: "دوّر", tr: "dawwar", ru: "искать", root: "د-و-ر", pattern: "faʿʿal (II)", level: "A2",
    note: "Используется с предлогом ʿala: dawwar ʿala — искать что-то.",
    present: [["بدور", "badawwar"], ["بتدور", "bitdawwar"], ["بتدوري", "bitdawwari"], ["بيدور", "biydawwar"], ["بتدور", "bitdawwar"], ["بندور", "bindawwar"], ["بتدوروا", "bitdawwaru"], ["بيدوروا", "biydawwaru"]],
    past: [["دورت", "dawwart"], ["دورت", "dawwart"], ["دورتي", "dawwarti"], ["دور", "dawwar"], ["دورت", "dawwarit"], ["دورنا", "dawwarna"], ["دورتوا", "dawwartu"], ["دوروا", "dawwaru"]],
    imperative: [["دور", "dawwar"], ["دوري", "dawwari"], ["دوروا", "dawwaru"]],
    example: { ar: "بدور على مفتاح", tr: "badawwar ʿala miftaaḥ", ru: "Я ищу ключ" },
  }),
];
