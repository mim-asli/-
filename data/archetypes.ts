export const archetypesJson = `[
    {
        "id": "technomancer", "name": "تکنومانسر", "genre": "scifi",
        "description": "یک هکر عارف که با جریان اتر صحبت می‌کند و کدهای باستانی را می‌خواند.",
        "inventory": [
            { "name": "دیتاپد شخصی", "description": "یک دستگاه قابل حمل برای دسترسی به شبکه‌ها و ذخیره اطلاعات." },
            { "name": "مبدل اتر", "description": "ابزاری که انرژی اتر خام را به نیروی قابل استفاده تبدیل می‌کند." }
        ],
        "skills": [
            { "id": "hacking_1", "name": "هک کردن", "description": "توانایی نفوذ به سیستم‌های کامپیوتری و دستکاری داده‌ها.", "tier": 1, "category": "Knowledge" },
            { "id": "ether_weaving_1", "name": "اترریسی", "description": "درک و دستکاری پایه‌ای جریان‌های اتر برای ایجاد افکت‌های کوچک.", "tier": 1, "category": "Special" }
        ],
        "iconId": "technomancer",
        "healthMod": -10, "sanityMod": 0, "satietyMod": 0, "thirstMod": 0, "resourceMod": 15,
        "perkId": "perk_eagle_eyed", "flawId": "flaw_fragile"
    },
    {
        "id": "void_runner", "name": "دونده پوچی", "genre": "scifi",
        "description": "یک کاوشگر بی‌باک که در مسیرهای فراموش‌شده ستاره‌ها سفر می‌کند.",
        "inventory": [
            { "name": "تراشه ناوبری", "description": "حاوی داده‌های ناقص از مسیرهای فضایی ناشناخته." },
            { "name": "باتوم بیهوش‌کننده", "description": "یک سلاح غیرکشنده برای موقعیت‌های نزدیک." }
        ],
        "skills": [
            { "id": "zero_g_nav_1", "name": "ناوبری در گرانش صفر", "description": "مهارت در حرکت و مانور دادن در محیط‌های بدون جاذبه.", "tier": 1, "category": "Knowledge" },
            { "id": "xeno_biology_1", "name": "زیست‌شناسی بیگانه", "description": "دانش پایه در مورد موجودات و گیاهان غیرزمینی.", "tier": 1, "category": "Knowledge" }
        ],
        "iconId": "void_runner",
        "healthMod": 0, "sanityMod": 0, "satietyMod": 10, "thirstMod": 0, "resourceMod": 0,
        "perkId": "perk_lucky", "flawId": "flaw_bad_reputation"
    },
    {
        "id": "ghost", "name": "شبح", "genre": "scifi",
        "description": "یک نفوذگر سایبری که در سایه‌های دیجیتال زندگی می‌کند.",
        "inventory": [
            { "name": "دستگاه استتار (معیوب)", "description": "یک دستگاه که برای مدت کوتاهی شما را نامرئی می‌کند، اما گاهی اوقات دچار مشکل می‌شود." },
            { "name": "کیت قفل‌شکن دیجیتال", "description": "مجموعه‌ای از ابزارها برای دور زدن قفل‌های الکترونیکی." }
        ],
        "skills": [
            { "id": "infiltration_1", "name": "نفوذ", "description": "هنر عبور از مناطق محافظت‌شده بدون دیده شدن.", "tier": 1, "category": "Stealth" },
            { "id": "system_bypass_1", "name": "دور زدن سیستم", "description": "مهارت در فریب دادن سیستم‌های امنیتی ساده.", "tier": 1, "category": "Knowledge" }
        ],
        "iconId": "ghost",
        "healthMod": 0, "sanityMod": 0, "satietyMod": 0, "thirstMod": 0, "resourceMod": 5,
        "perkId": "perk_resourceful", "flawId": "flaw_paranoid"
    },
    {
        "id": "ronin", "name": "رونین", "genre": "scifi",
        "description": "یک جنگجوی مزدور با کاتانای پلاسما و یک کد افتخار شخصی.",
        "inventory": [
            { "name": "کاتانای پلاسما (قدرت کم)", "description": "یک شمشیر انرژی که به شارژ نیاز دارد." },
            { "name": "ژاکت زرهی", "description": "یک ژاکت شیک که لایه‌های محافظتی در آن تعبیه شده." }
        ],
        "skills": [
            { "id": "blade_combat_1", "name": "مبارزه با سلاح تیغه‌ای", "description": "مهارت پایه در استفاده از شمشیرها و چاقوهای پلاسما.", "tier": 1, "category": "Combat" }
        ],
        "iconId": "ronin",
        "healthMod": 15, "sanityMod": -10, "satietyMod": 0, "thirstMod": 0, "resourceMod": -10,
        "perkId": "perk_tough", "flawId": "flaw_greedy"
    },
    {
        "id": "biotech", "name": "بایوتک", "genre": "scifi",
        "description": "یک پزشک و مهندس ژنتیک که می‌تواند هم شفا دهد و هم تغییر ایجاد کند.",
        "inventory": [
            { "name": "کیت کمک‌های اولیه", "description": "شامل اسپری‌های درمانی و بانداژهای پیشرفته." },
            { "name": "سرنگ نمونه‌برداری", "description": "برای جمع‌آوری نمونه‌های بیولوژیکی از موجودات و محیط." }
        ],
        "skills": [
            { "id": "medicine_1", "name": "پزشکی", "description": "توانایی تشخیص و درمان زخم‌های اولیه.", "tier": 1, "category": "Knowledge" },
            { "id": "bio_analysis_1", "name": "تحلیل بیولوژیکی", "description": "توانایی تحلیل نمونه‌های بیولوژیکی برای یافتن اطلاعات مفید.", "tier": 1, "category": "Knowledge" }
        ],
        "iconId": "biotech",
        "healthMod": 5, "sanityMod": 5, "satietyMod": 0, "thirstMod": 0, "resourceMod": 5,
        "perkId": "perk_resourceful", "flawId": "flaw_fragile"
    },
    {
        "id": "psion", "name": "سایان", "genre": "scifi",
        "description": "یک ذهن‌خوان که می‌تواند افکار دیگران را بشنود و بر آن‌ها تأثیر بگذارد.",
        "inventory": [
            { "name": "مسدود کننده ذهنی", "description": "یک دستگاه کوچک که از خوانده شدن ذهن شما جلوگیری می‌کند." },
            { "name": "کریستال تمرکز", "description": "به متمرکز کردن قدرت‌های ذهنی کمک می‌کند." }
        ],
        "skills": [
            { "id": "telepathy_1", "name": "تله‌پاتی", "description": "توانایی شنیدن افکار سطحی دیگران.", "tier": 1, "category": "Special" },
            { "id": "persuasion_1", "name": "اقناع ذهنی", "description": "کاشت یک پیشنهاد ساده در ذهن یک فرد.", "tier": 1, "category": "Social" }
        ],
        "iconId": "psion",
        "healthMod": -15, "sanityMod": 20, "satietyMod": 0, "thirstMod": 0, "resourceMod": 10,
        "perkId": "perk_silver_tongue", "flawId": "flaw_paranoid"
    },
    {
        "id": "stalker", "name": "کاوشگر منطقه ممنوعه", "genre": "scifi",
        "description": "یک بازمانده‌ی سرسخت که در مناطق آلوده و فراموش‌شده به دنبال تکنولوژی‌های گمشده می‌گردد.",
        "inventory": [
            { "name": "شمارشگر گایگر", "description": "میزان تشعشعات محیط را اندازه‌گیری می‌کند." },
            { "name": "ماسک فیلتردار", "description": "محافظت محدودی در برابر هوای سمی فراهم می‌کند." }
        ],
        "skills": [
            { "id": "scavenging_1", "name": "جستجوگری", "description": "شانس پیدا کردن آیتم‌های مفید در خرابه‌ها را افزایش می‌دهد.", "tier": 1, "category": "Knowledge" }
        ],
        "iconId": "stalker",
        "healthMod": 10, "sanityMod": -5, "satietyMod": -10, "thirstMod": 0, "resourceMod": 0,
        "perkId": "perk_resourceful", "flawId": "flaw_paranoid"
    },
    {
        "id": "diplomat", "name": "دیپلمات کهکشانی", "genre": "scifi",
        "description": "یک میانجی‌گر ماهر که با کلمات، جنگ‌ها را متوقف کرده و اتحادها را شکل می‌دهد.",
        "inventory": [
            { "name": "کدکس پروتکل‌ها", "description": "حاوی اطلاعاتی در مورد آداب و رسوم نژادهای مختلف." },
            { "name": "مترجم جهانی (نسخه بتا)", "description": "زبان‌های مختلف را ترجمه می‌کند، اما گاهی دچار اشتباه می‌شود." }
        ],
        "skills": [
            { "id": "negotiation_1", "name": "مذاکره", "description": "توانایی رسیدن به توافق‌های بهتر در گفتگوها.", "tier": 1, "category": "Social" }
        ],
        "iconId": "diplomat",
        "healthMod": -10, "sanityMod": 15, "satietyMod": 0, "thirstMod": 0, "resourceMod": 10,
        "perkId": "perk_silver_tongue", "flawId": "flaw_gullible"
    },
    {
        "id": "knight", "name": "شوالیه", "genre": "fantasy",
        "description": "یک جنگجوی قسم‌خورده با زرهی درخشان و قلبی وفادار.",
        "inventory": [
            { "name": "شمشیر بلند", "description": "یک شمشیر قابل اعتماد، هرچند کمی کند شده." },
            { "name": "سپر چوبی", "description": "یک سپر محکم که آثار نبردهای گذشته را بر خود دارد." }
        ],
        "skills": [
            { "id": "sword_combat_1", "name": "مبارزه با شمشیر", "description": "مهارت در استفاده از شمشیر برای حمله و دفاع.", "tier": 1, "category": "Combat" },
            { "id": "defense_1", "name": "دفاع", "description": "توانایی استفاده از سپر برای جلوگیری از حملات.", "tier": 1, "category": "Combat" }
        ],
        "iconId": "knight",
        "healthMod": 20, "sanityMod": 0, "satietyMod": 0, "thirstMod": 0, "resourceMod": -15,
        "perkId": "perk_iron_will", "flawId": "flaw_cursed"
    },
    {
        "id": "mage", "name": "جادوگر", "genre": "fantasy",
        "description": "یک محقق هنرهای مخفی که می‌تواند انرژی جادویی را کنترل کند.",
        "inventory": [
            { "name": "عصای چوبی", "description": "یک عصای ساده که برای هدایت مانا استفاده می‌شود." },
            { "name": "کتاب جادو (نیمه‌سوخته)", "description": "حاوی چند ورد ساده که هنوز قابل خواندن هستند." }
        ],
        "skills": [
            { "id": "spellcasting_1", "name": "وردخوانی", "description": "توانایی خواندن و اجرای وردهای ساده جادویی.", "tier": 1, "category": "Special" },
            { "id": "alchemy_1", "name": "کیمیاگری مقدماتی", "description": "دانش ساخت معجون‌های ساده از مواد اولیه.", "tier": 1, "category": "Crafting" }
        ],
        "iconId": "mage",
        "healthMod": -10, "sanityMod": 10, "satietyMod": 0, "thirstMod": 0, "resourceMod": 20,
        "perkId": "perk_eagle_eyed", "flawId": "flaw_fragile"
    },
    {
        "id": "ranger", "name": "تیرانداز اِلف", "genre": "fantasy",
        "description": "یک شکارچی تیزبین از جنگل‌های باستانی که با طبیعت یکی است.",
        "inventory": [
            { "name": "کمان بلند", "description": "یک کمان خوش‌ساخت از چوب درخت زبان گنجشک." },
            { "name": "ترکش تیر", "description": "یک دسته تیر با سر سنگی." }
        ],
        "skills": [
            { "id": "archery_1", "name": "تیراندازی با کمان", "description": "مهارت در هدف‌گیری و شلیک با کمان.", "tier": 1, "category": "Combat" },
            { "id": "tracking_1", "name": "ردیابی", "description": "توانایی دنبال کردن ردپاها و نشانه‌های موجودات در طبیعت.", "tier": 1, "category": "Knowledge" }
        ],
        "iconId": "ranger",
        "healthMod": 0, "sanityMod": 0, "satietyMod": 10, "thirstMod": 0, "resourceMod": 0,
        "perkId": "perk_eagle_eyed", "flawId": "flaw_bad_reputation"
    },
    {
        "id": "rogue", "name": "دزد", "genre": "fantasy",
        "description": "یک استاد سایه‌ها، ماهر در مخفی‌کاری، قفل‌شکنی و حملات غافلگیرانه.",
        "inventory": [
            { "name": "خنجر", "description": "یک تیغه کوچک و تیز برای کارهای بی‌سروصدا." },
            { "name": "ابزار قفل‌شکن", "description": "مجموعه‌ای از سنجاق‌ها و ابزارهای ظریف برای باز کردن قفل‌ها." }
        ],
        "skills": [
            { "id": "stealth_1", "name": "مخفی‌کاری", "description": "توانایی حرکت بی‌صدا و پنهان شدن در سایه‌ها.", "tier": 1, "category": "Stealth" },
            { "id": "lockpicking_1", "name": "قفل‌شکنی", "description": "مهارت باز کردن قفل‌های ساده.", "tier": 1, "category": "Stealth" }
        ],
        "iconId": "rogue",
        "healthMod": 0, "sanityMod": 5, "satietyMod": -5, "thirstMod": 0, "resourceMod": 5,
        "perkId": "perk_silver_tongue", "flawId": "flaw_greedy"
    },
    {
        "id": "cleric", "name": "روحانی", "genre": "fantasy",
        "description": "خدمتگزار یک خدای قدرتمند که می‌تواند زخم‌ها را شفا دهد و ارواح خبیث را دور کند.",
        "inventory": [
            { "name": "گرز", "description": "یک گرز ساده که هم برای مبارزه و هم به عنوان نماد ایمان به کار می‌رود." },
            { "name": "نماد مقدس", "description": "یک شیء مقدس که ایمان شما را متمرکز می‌کند." }
        ],
        "skills": [
            { "id": "healing_1", "name": "شفابخشی", "description": "توانایی بستن زخم‌های سطحی و کاهش درد.", "tier": 1, "category": "Special" },
            { "id": "turn_undead_1", "name": "دفع ارواح", "description": "توانایی ترساندن و دور کردن ارواح ضعیف.", "tier": 1, "category": "Special" }
        ],
        "iconId": "cleric",
        "healthMod": 10, "sanityMod": 10, "satietyMod": 0, "thirstMod": 0, "resourceMod": 0,
        "perkId": "perk_iron_will", "flawId": "flaw_bad_reputation"
    },
    {
        "id": "dwarf_defender", "name": "مدافع دورف", "genre": "fantasy",
        "description": "یک جنگجوی سرسخت و مقاوم از سالن‌های کوهستانی.",
        "inventory": [
            { "name": "تبر جنگی دورفی", "description": "یک تبر سنگین و قابل اعتماد که برای شکافتن دشمنان عالی است." },
            { "name": "زره صفحه‌ای", "description": "زرهی سنگین که محافظت فوق‌العاده‌ای فراهم می‌کند." }
        ],
        "skills": [
            { "id": "axe_combat_1", "name": "مبارزه با تبر", "description": "مهارت در استفاده از تبرهای جنگی سنگین.", "tier": 1, "category": "Combat" },
            { "id": "toughness_1", "name": "مقاومت بالا", "description": "بدن شما به طور طبیعی در برابر آسیب مقاوم‌تر است.", "tier": 1, "category": "Combat" }
        ],
        "iconId": "dwarf_defender",
        "healthMod": 25, "sanityMod": 0, "satietyMod": 10, "thirstMod": 0, "resourceMod": -20,
        "perkId": "perk_tough", "flawId": "flaw_clumsy"
    },
    {
        "id": "barbarian", "name": "بربر خشمگین", "genre": "fantasy",
        "description": "یک جنگجوی وحشی از سرزمین‌های شمالی که با خشم نبرد می‌کند.",
        "inventory": [
            { "name": "تبر بزرگ دو-دستی", "description": "سلاحی سنگین و ویرانگر." },
            { "name": "پوست حیوانات", "description": "یک زره سبک که از پوست حیوانات شکار شده ساخته شده." }
        ],
        "skills": [
            { "id": "rage_1", "name": "خشم", "description": "در مبارزه، قدرت حملات خود را به قیمت از دست دادن کنترل افزایش می‌دهد.", "tier": 1, "category": "Combat" }
        ],
        "iconId": "barbarian",
        "healthMod": 25, "sanityMod": -15, "satietyMod": 10, "thirstMod": 0, "resourceMod": -10,
        "perkId": "perk_tough", "flawId": "flaw_slow"
    },
    {
        "id": "bard", "name": "نوازنده دوره‌گرد", "genre": "fantasy",
        "description": "یک موسیقی‌دان که با داستان‌ها و آهنگ‌هایش، قلب‌ها را تسخیر و ذهن‌ها را مسحور می‌کند.",
        "inventory": [
            { "name": "عود", "description": "یک ساز زهی خوش‌صدا برای نواختن آهنگ‌های جادویی." },
            { "name": "کتابچه شعر", "description": "مجموعه‌ای از اشعار و داستان‌های الهام‌بخش." }
        ],
        "skills": [
            { "id": "charm_1", "name": "افسون", "description": "استفاده از موسیقی برای آرام کردن یا تحت تأثیر قرار دادن دیگران.", "tier": 1, "category": "Social" }
        ],
        "iconId": "bard",
        "healthMod": -5, "sanityMod": 15, "satietyMod": 0, "thirstMod": 0, "resourceMod": 10,
        "perkId": "perk_silver_tongue", "flawId": "flaw_gullible"
    },
    {
        "id": "investigator", "name": "کارآگاه خصوصی", "genre": "classic",
        "description": "با یک بارانی، کلاه لبه‌دار و چشمی تیزبین برای یافتن سرنخ‌ها.",
        "inventory": [
            { "name": "دفترچه یادداشت", "description": "برای ثبت سرنخ‌ها و مشاهدات." },
            { "name": "ذره‌بین", "description": "برای بررسی دقیق جزئیات صحنه جرم." }
        ],
        "skills": [
            { "id": "interrogation_1", "name": "بازجویی", "description": "هنر بیرون کشیدن اطلاعات از افراد، چه با مهربانی و چه با فشار.", "tier": 1, "category": "Social" },
            { "id": "investigation_1", "name": "جستجوی سرنخ", "description": "مهارت در یافتن جزئیات پنهان در یک صحنه.", "tier": 1, "category": "Knowledge" }
        ],
        "iconId": "investigator",
        "healthMod": 0, "sanityMod": 15, "satietyMod": 0, "thirstMod": 0, "resourceMod": 5,
        "perkId": "perk_eagle_eyed", "flawId": "flaw_paranoid"
    },
    {
        "id": "explorer", "name": "ماجراجوی بی‌باک", "genre": "classic",
        "description": "یک کاشف دنیا که به دنبال معابد گمشده و آثار باستانی است.",
        "inventory": [
            { "name": "شلاق چرمی", "description": "ابزاری چندمنظوره برای عبور از موانع و دفاع." },
            { "name": "نقشه قدیمی", "description": "یک نقشه ناقص که به مکانی ناشناخته اشاره دارد." }
        ],
        "skills": [
            { "id": "archaeology_1", "name": "باستان‌شناسی", "description": "دانش در مورد تمدن‌های باستانی و آثار آنها.", "tier": 1, "category": "Knowledge" },
            { "id": "trap_disarm_1", "name": "فرار از تله", "description": "توانایی شناسایی و خنثی کردن تله‌های ساده.", "tier": 1, "category": "Stealth" }
        ],
        "iconId": "explorer",
        "healthMod": 10, "sanityMod": -10, "satietyMod": 10, "thirstMod": 0, "resourceMod": 5,
        "perkId": "perk_lucky", "flawId": "flaw_greedy"
    },
    {
        "id": "spy", "name": "جاسوس اغواگر", "genre": "classic",
        "description": "یک عامل مخفی که از جذابیت و فریب برای به دست آوردن اسرار استفاده می‌کند.",
        "inventory": [
            { "name": "سیگار مینیاتوری", "description": "یک وسیله جاسوسی هوشمندانه که می‌تواند گاز خواب‌آور پخش کند." },
            { "name": "تپانچه کوچک", "description": "یک سلاح مخفی برای مواقع اضطراری." }
        ],
        "skills": [
            { "id": "seduction_1", "name": "اغواگری", "description": "استفاده از جذابیت برای به دست آوردن اعتماد و اطلاعات.", "tier": 1, "category": "Social" },
            { "id": "deception_1", "name": "فریبکاری", "description": "مهارت در دروغ گفتن و ساختن داستان‌های باورپذیر.", "tier": 1, "category": "Social" }
        ],
        "iconId": "spy",
        "healthMod": -5, "sanityMod": 5, "satietyMod": 0, "thirstMod": 0, "resourceMod": 15,
        "perkId": "perk_silver_tongue", "flawId": "flaw_paranoid"
    },
    {
        "id": "journalist", "name": "روزنامه‌نگار جسور", "genre": "classic",
        "description": "یک خبرنگار سرسخت که برای کشف حقیقت، خود را به آب و آتش می‌زند.",
        "inventory": [
            { "name": "دوربین عکاسی", "description": "برای ثبت مدارک و صحنه‌ها." },
            { "name": "کارت خبرنگاری", "description": "مجوزی برای ورود به مکان‌های مختلف." }
        ],
        "skills": [
            { "id": "research_1", "name": "تحقیق", "description": "مهارت در جمع‌آوری اطلاعات از طریق منابع مختلف.", "tier": 1, "category": "Knowledge" },
            { "id": "streetwise_1", "name": "ارتباطات", "description": "توانایی برقراری ارتباط با افراد مختلف برای کسب اطلاعات.", "tier": 1, "category": "Social" }
        ],
        "iconId": "journalist",
        "healthMod": 0, "sanityMod": 10, "satietyMod": 0, "thirstMod": 0, "resourceMod": 5,
        "perkId": "perk_resourceful", "flawId": "flaw_bad_reputation"
    },
    {
        "id": "mechanic", "name": "مکانیک نابغه", "genre": "classic",
        "description": "یک مخترع با دستانی روغنی که می‌تواند هر ماشینی را تعمیر یا از هم باز کند.",
        "inventory": [
            { "name": "جعبه ابزار سنگین", "description": "مجموعه‌ای کامل از آچارها و پیچ‌گوشتی‌ها." },
            { "name": "عینک محافظ", "description": "از چشمان در برابر جرقه‌ها و خرده‌ریزها محافظت می‌کند." }
        ],
        "skills": [
            { "id": "repair_1", "name": "تعمیرات", "description": "توانایی تعمیر دستگاه‌های مکانیکی ساده.", "tier": 1, "category": "Crafting" }
        ],
        "iconId": "mechanic",
        "healthMod": 5, "sanityMod": 0, "satietyMod": 0, "thirstMod": 0, "resourceMod": 5,
        "perkId": "perk_mechanic", "flawId": "flaw_technophobe"
    },
    {
        "id": "shadow", "name": "سایه", "genre": "classic",
        "description": "شخصیتی مرموز که در دنیای زیرزمینی جنایت و فریب حرکت می‌کند و از جذابیت یا ارعاب برای رسیدن به اهدافش استفاده می‌کند.",
        "inventory": [
            { "name": "فلاسک نوشیدنی", "description": "برای آرام کردن اعصاب در دنیایی بی‌رحم." },
            { "name": "چاقوی ضامن‌دار", "description": "یک سلاح مخفی و سریع." }
        ],
        "skills": [
            { "id": "intimidation_1", "name": "ارعاب", "description": "استفاده از تهدید برای گرفتن اطلاعات.", "tier": 1, "category": "Social" }
        ],
        "iconId": "shadow",
        "healthMod": 0, "sanityMod": -10, "satietyMod": 0, "thirstMod": -10, "resourceMod": 15,
        "perkId": "perk_iron_will", "flawId": "flaw_bad_reputation"
    }
]`;