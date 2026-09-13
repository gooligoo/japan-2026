"use strict";

const B = (en, he) => ({ en, he });
const MAP = query => `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(query)}`;
const DIR = destination => `https://www.google.com/maps/dir/?api=1&destination=${encodeURIComponent(destination)}`;
const PHOTOS = query => `https://www.google.com/search?tbm=isch&q=${encodeURIComponent(query)}`;
const ROUTE = route => {
  const origin = encodeURIComponent(route[0]);
  const destination = encodeURIComponent(route[1]);
  const waypoints = route[2]?.length ? `&waypoints=${encodeURIComponent(route[2].join("|"))}` : "";
  const mode = route[3] ? `&travelmode=${route[3]}` : "";
  return `https://www.google.com/maps/dir/?api=1&origin=${origin}&destination=${destination}${waypoints}${mode}`;
};
const STORE_KEY = "japan2026.control.v2";
const defaultState = {
  lang: "en",
  lastView: "itinerary",
  favorites: {},
  completed: {},
  notes: {},
  choices: { oct09: "coast", oct10: "maker-day", oct12: "rental", oct13: "slow-izu", oct16: "wagashi", oct19: "gcans" },
  tickets: {},
  soloHotel: "undecided",
  checks: {},
  decisions: {},
  volume: 0.28,
  stamps: {},
  discoveries: {},
  retro: false
};

let state;
try {
  state = { ...defaultState, ...JSON.parse(localStorage.getItem(STORE_KEY) || "{}") };
} catch {
  state = { ...defaultState };
}
state.favorites ||= {};
state.completed ||= {};
state.notes ||= {};
state.choices = { ...defaultState.choices, ...(state.choices || {}) };
state.tickets ||= {};
state.checks ||= {};
state.decisions ||= {};
state.stamps ||= {};
state.discoveries ||= {};
for (const key of ['favorites','completed','notes','tickets','checks','decisions','stamps','discoveries']) {
  if (!state[key] || typeof state[key] !== 'object' || Array.isArray(state[key])) state[key] = {};
}
state.lang = state.lang === 'he' ? 'he' : 'en';
state.volume = Number.isFinite(state.volume) ? Math.max(0,Math.min(1,state.volume)) : .28;

const T = {
  skip: B("Skip to trip content", "דילוג לתוכן הטיול"),
  primary: B("Primary navigation", "ניווט ראשי"),
  tripOverview: B("Trip overview", "סקירת הטיול"),
  tripSegments: B("Trip segments", "מקטעי הטיול"),
  openSound: B("Open soundscape controls", "פתיחת בקרי הפסקול"),
  close: B("Close", "סגירה"),
  countdown: B("COUNTDOWN", "ספירה לאחור"),
  privateControl: B("PRIVATE TRIP CONTROL", "מרכז שליטה פרטי"),
  appTitle: B("Japan 2026", "יפן 2026"),
  appSubtitle: B("Gilad solo · then the Horn family of five", "גלעד לבד · ואז משפחת הורן בהרכב של חמישה"),
  language: B("עברית", "English"),
  secrets: B("Secrets", "סודות"),
  sound: B("Soundscape", "פסקול"),
  soundEyebrow: B("QUIET BY DEFAULT", "שקט כברירת מחדל"),
  soundHeading: B("Koto fragments · bamboo breath · Tokyo rain", "רסיסי קוטו · נשימת במבוק · גשם טוקיו"),
  soundNote: B("Starts only when you choose. Volume is remembered on this device.", "מתחיל רק בלחיצה שלך. עוצמת הקול נשמרת במכשיר הזה."),
  startSound: B("Start", "הפעלה"),
  stopSound: B("Stop", "עצירה"),
  volume: B("Volume", "עוצמה"),
  stationChime: B("Station chime", "צליל תחנה"),
  localOnly: B("Local-only · no trackers", "מקומי בלבד · ללא מעקב"),
  masterPlan: B("MASTER PLAN", "תכנית האב"),
  itinerary: B("Itinerary", "מסלול"),
  itineraryIntro: B("A realistic day-by-day plan with buffers, fallbacks, maps, notes, and booking actions.", "תכנית יומית מציאותית עם מרווחים, חלופות, מפות, הערות ופעולות הזמנה."),
  expandAll: B("Expand all", "פתיחת הכל"),
  collapseAll: B("Collapse all", "סגירת הכל"),
  jogasakiCaption: B("Jōgasaki: the coast day worth protecting.", "ג׳וגסאקי: יום החוף שכדאי לשמור עליו."),
  popHeroCaption: B("Japan, turned all the way up.", "יפן, בפול ווליום."),
  discoveryEyebrow: B("🇯🇵 OPTIONAL DETOURS · ZERO HOMEWORK", "🇯🇵 סטיות אופציונליות · אפס שיעורי בית"),
  discoveryTitle: B("Japan side quests", "משימות צד יפניות"),
  discoveryIntro: B("Design, temples, tiny prizes, and one suspicious stationmaster. Add only what fits the day.", "עיצוב, מקדשים, פרסים זעירים ומנהל תחנה חשוד אחד. מוסיפים רק מה שמתאים ליום."),
  openSecrets: B("Open 7 obvious secrets", "פתיחת 7 סודות ברורים"),
  secretsEyebrow: B("秘密基地 · SECRET BASE", "秘密基地 · בסיס סודי"),
  secretsTitle: B("The very obvious Easter eggs", "ביצי הפסחא המאוד ברורות"),
  secretsIntro: B("Nothing is hidden behind impossible clues. Tap every experiment; discoveries stay checked on this device.", "שום דבר לא מוסתר מאחורי חידות בלתי אפשריות. נסו כל ניסוי; הגילויים נשמרים במכשיר הזה."),
  found: B("found", "נמצאו"),
  tanukiDesk: B("TANUKI STATIONMASTER’S DESK", "הדלפק של מנהל התחנה טאנוקי"),
  secretResultDefault: B("Your fortune is waiting. The tanuki claims the train is on time.", "המזל שלכם מחכה. הטאנוקי טוען שהרכבת בזמן."),
  secretClue: B("Still want something hidden? Tap the 日 seal five times. Keyboard adventurers may remember an old ↑ ↑ ↓ ↓ ritual.", "עדיין רוצים משהו מוסתר? לחצו חמש פעמים על חותמת 日. הרפתקני מקלדת אולי זוכרים טקס עתיק של ↑ ↑ ↓ ↓."),
  samuraiMission: B("SAMURAI FOCUS · Protect the itinerary. Defeat one checklist item.", "מיקוד סמוראי · מגינים על המסלול. מביסים משימה אחת ברשימה."),
  sleepPlan: B("SLEEP PLAN", "תכנית לינה"),
  stays: B("Stays", "לינה"),
  staysIntro: B("Confirmed lodging, the solo-hotel decision, cancellation cliffs, and door-to-door directions.", "לינות מאושרות, החלטת מלון הסולו, מועדי ביטול והגעה מדלת לדלת."),
  movementDesk: B("MOVEMENT DESK", "מרכז תנועה"),
  transit: B("Transit", "תחבורה"),
  transitIntro: B("Every consequential transfer in one scannable place: fare, booking rule, seat, luggage, backup, and platform logic.", "כל מעבר חשוב במקום אחד: מחיר, כללי הזמנה, מושב, מזוודות, חלופה ורציפים."),
  flights: B("Flights", "טיסות"),
  railAndRoad: B("Rail & road", "רכבות וכביש"),
  mapRoom: B("MAP ROOM", "חדר מפות"),
  maps: B("Maps", "מפות"),
  mapsIntro: B("Deliberately link-first: fast on a phone, no slow embed wall, and no private itinerary sent to a map provider until you tap.", "בכוונה מבוסס קישורים: מהיר בטלפון, בלי קיר הטמעות ובלי שליחת מידע פרטי לספק מפות לפני שלוחצים."),
  regionMaps: B("Regional map desk", "מרכז מפות אזורי"),
  categoryMaps: B("Themes & split routes", "נושאים ומסלולים מפוצלים"),
  dailyMaps: B("Every day", "כל יום"),
  curatedCulture: B("CURATED CULTURE", "תרבות אוצרת"),
  museums: B("Museums", "מוזיאונים"),
  museumsIntro: B("A short, opinionated list matched to water systems, trains, design, nostalgia, and the whole family.", "רשימה קצרה ומדויקת שמתאימה למים, רכבות, עיצוב, נוסטלגיה ולמשפחה כולה."),
  tableReady: B("TABLE-READY JAPANESE", "יפנית מוכנה לשולחן"),
  food: B("Food Cards", "כרטיסי אוכל"),
  foodIntro: B("Tap a card to show it full-screen. These describe dietary restrictions accurately; they do not claim an allergy.", "לחצו להצגה במסך מלא. הכרטיסים מתארים מגבלות תזונה במדויק ואינם מציגים אותן כאלרגיה."),
  actionDesk: B("ACTION DESK", "מרכז פעולות"),
  planner: B("Action checklist", "רשימת פעולות"),
  plannerIntro: B("Every purchase, confirmation, document, and day-of task—with names, timing, instructions, and official links. Progress stays on this device.", "כל רכישה, אישור, מסמך ומשימה ליום הנסיעה — עם שמות, תזמון, הוראות וקישורים רשמיים. ההתקדמות נשמרת במכשיר הזה."),
  decisions: B("Decisions & open questions", "החלטות ושאלות פתוחות"),
  checklists: B("Complete action checklist", "רשימת פעולות מלאה"),
  smallDelights: B("Small delights", "תענוגות קטנים"),
  copyJapanese: B("Copy Japanese", "העתקת היפנית"),
  largeText: B("Large text", "טקסט גדול"),
  all: B("All days", "כל הימים"),
  solo: B("Solo Tokyo", "טוקיו סולו"),
  familyTokyo: B("Family Tokyo", "טוקיו משפחתי"),
  izu: B("Izu", "איזו"),
  kyoto: B("Kyoto", "קיוטו"),
  finale: B("Festival & 50th", "פסטיבל ויום הולדת 50"),
  favorite: B("Favorite", "מועדף"),
  complete: B("Mark complete", "סימון כהושלם"),
  notes: B("Private notes", "הערות פרטיות"),
  notePlaceholder: B("Add a timing, reservation, memory, or family note…", "הוסיפו שעה, הזמנה, זיכרון או הערה משפחתית…"),
  map: B("Open map", "פתיחת מפה"),
  official: B("Official info", "מידע רשמי"),
  photos: B("View photos", "תמונות"),
  book: B("Book / check", "הזמנה / בדיקה"),
  recommended: B("Recommended", "מומלץ"),
  selected: B("Selected", "נבחר"),
  copied: B("Copied", "הועתק"),
  saved: B("Saved on this device", "נשמר במכשיר הזה"),
  purchase: B("Purchased", "נרכש"),
  notPurchased: B("Not marked", "לא סומן"),
  duration: B("Duration", "משך"),
  fare: B("Fare", "מחיר"),
  transfers: B("Transfers", "החלפות"),
  reserve: B("Reservation", "הזמנה"),
  seat: B("Seat", "מושב"),
  luggage: B("Luggage", "מזוודות"),
  backup: B("Backup", "חלופה"),
  window: B("Window", "חלון זמן"),
  sourceStatus: B("Status", "סטטוס"),
  confirmation: B("Confirmation", "אישור"),
  address: B("Address", "כתובת"),
  dates: B("Dates", "תאריכים"),
  station: B("Nearest station", "תחנה קרובה"),
  cancellation: B("Cancellation", "ביטול"),
  copiedNumber: B("Number copied", "המספר הועתק"),
  chooseHotel: B("Choose the solo base", "בחירת בסיס הסולו"),
  undecided: B("Keep undecided", "להשאיר פתוח"),
  copiedJapanese: B("Japanese card copied", "הכרטיס ביפנית הועתק"),
  daysUntil: B("days until Japan", "ימים עד יפן"),
  tripLive: B("trip day", "יום בטיול"),
  memoryMode: B("Memory mode", "מצב זיכרונות"),
  nextAction: B("NEXT ACTION", "הפעולה הבאה"),
  noUrgentAction: B("The critical prep is done", "ההכנות הקריטיות הושלמו"),
  tripProgress: B("Trip progress", "התקדמות הטיול"),
  verified: B("Verified", "מאומת"),
  unverified: B("Unverified lead", "כיוון לא מאומת"),
  weatherPlan: B("Weather-dependent", "תלוי מזג אוויר"),
  reservationNeeded: B("Reservation needed", "נדרשת הזמנה"),
  landmark: B("Landmark day", "יום שיא"),
  gentle: B("Gentle", "קל"),
  moderate: B("Moderate", "בינוני"),
  demanding: B("Demanding", "מאתגר"),
  today: B("Today", "היום"),
  museumAll: B("All", "הכול"),
  museumSolo: B("Gilad solo", "גלעד לבד"),
  museumFamily: B("Family", "משפחה"),
  museumWater: B("Water & systems", "מים ומערכות"),
  museumDesign: B("Design", "עיצוב"),
  museumTrain: B("Rail", "רכבות"),
  fit: B("Trip fit", "התאמה לטיול"),
  price: B("Price", "מחיר"),
  closed: B("Closed", "סגור"),
  audience: B("Best for", "הכי מתאים"),
  combinedDiet: B("One card for the whole table", "כרטיס אחד לכל השולחן"),
  dietaryNotAllergy: B("Dietary restriction — not an allergy", "מגבלת תזונה — לא אלרגיה"),
  soundOn: B("Soundscape on", "הפסקול פועל"),
  soundOff: B("Soundscape off", "הפסקול כבוי"),
  stampAdded: B("Travel stamp added", "חותמת מסע נוספה"),
  photoCredit: B("Photo credit", "קרדיט צילום")
};

const navItems = [
  { id: "itinerary", icon: "旅", label: T.itinerary, short: B("Trip","מסלול") },
  { id: "stays", icon: "泊", label: T.stays, short: B("Stays","לינה") },
  { id: "transit", icon: "乗", label: T.transit, short: B("Move","תנועה") },
  { id: "maps", icon: "図", label: T.maps, short: T.maps },
  { id: "museums", icon: "館", label: T.museums, short: B("Museums","מוזיאונים") },
  { id: "food", icon: "食", label: T.food, short: B("Food","אוכל") },
  { id: "planner", icon: "済", label: T.planner, short: B("To do","לבצע") }
];

const segments = [
  { id: "all", label: T.all },
  { id: "solo", label: T.solo },
  { id: "family", label: T.familyTokyo },
  { id: "izu", label: T.izu },
  { id: "kyoto", label: T.kyoto },
  { id: "finale", label: T.finale }
];

const days = [
  {
    id: "sep29", date: "2026-09-29", segment: "solo", icon: "🛬", pace: "gentle",
    title: B("Land, orient, sleep", "נחיתה, התמצאות ושינה"),
    subtitle: B("LY075 · Narita T1 · no heroics on night one", "LY075 · נריטה T1 · בלי גבורה בערב הראשון"),
    tags: [["verified","green"], ["gentle","blue"]],
    schedule: [
      ["16:20","✈️",B("LY075 lands at Narita Terminal 1", "LY075 נוחתת בנריטה טרמינל 1"),B("Immigration, bags, customs. Keep the first evening deliberately sparse.", "הגירה, מזוודות ומכס. הערב הראשון נשאר בכוונה כמעט ריק.")],
      ["17:45–18:30","🚆",B("Narita Express toward Shibuya / Shinjuku", "נריטה אקספרס לשיבויה / שינג׳וקו"),B("Reserved seat, ¥3,330 to Shibuya/Shinjuku. Buy after landing; do not buy the 14-day round trip.", "מושב שמור, 3,330¥ לשיבויה/שינג׳וקו. קנייה אחרי הנחיתה; הכרטיס הלוך־חזור ל-14 יום לא מתאים.")],
      ["19:30","🛏️",B("Check in at whichever solo hotel is actually kept", "צ׳ק־אין במלון הסולו שנשמר בפועל"),B("Both Tokyu Stay Aoyama Premier and FUKU House remain options until Gilad decides.", "Tokyu Stay Aoyama Premier ו-FUKU House עדיין חלופות עד החלטת גלעד.")],
      ["20:15","🍜",B("A small nearby dinner", "ארוחת ערב קטנה בקרבת מקום"),B("Convenience-store breakfast supplies, shower, sleep.", "לקנות ארוחת בוקר, מקלחת ושינה.")]
    ],
    callout: ["info", B("PNR •••• · seat 22H. Use the official airport map if baggage or rail signs feel unclear.", "PNR •••• · מושב 22H. להשתמש במפת הטרמינל הרשמית אם אזור המזוודות או הרכבת אינו ברור.")],
    links: [[B("Narita Terminal 1", "נריטה טרמינל 1"),"https://www.narita-airport.jp/en/company/media-center/publications-pamphlets/kannaimap/"],[B("JR East N’EX", "JR East N’EX"),"https://www.jreast.co.jp/en/multi/nex/tickets/"],[B("Tokyo hotel options", "חלופות מלון בטוקיו"),MAP("Tokyu Stay Aoyama Premier")]]
  },
  {
    id: "sep30", date: "2026-09-30", segment: "solo", icon: "🏮", pace: "gentle",
    title: B("Moto-Yoyogi homecoming", "חזרה למוטו־יויוגי"),
    subtitle: B("Childhood streets, Yoyogi Park, first quiet Tokyo day", "רחובות הילדות, פארק יויוגי ויום טוקיו שקט"),
    tags: [["gentle","green"]],
    schedule: [
      ["09:30","🏡",B("Moto-Yoyogi memory walk", "הליכת זיכרונות במוטו־יויוגי"),B("Start around 39-1 Moto-Yoyogi-cho and the Vietnamese Embassy. Treat the precise childhood address as private.", "להתחיל סביב 39-1 מוטו־יויוגי ושגרירות וייטנאם. הכתובת המדויקת נשארת פרטית.")],
      ["11:00","🚲",B("Yoyogi Park cycling center", "מרכז האופניים בפארק יויוגי"),B("Rent only if open and weather is kind; a slow park loop is enough on jet lag.", "לשכור רק אם פתוח ומזג האוויר נוח; סיבוב רגוע מספיק ביום של ג׳ט לג.")],
      ["13:00","🍱",B("Lunch around Yoyogi-Uehara", "ארוחת צהריים ביויוגי־אוהארה"),B("Use the food card before ordering broths or shared dishes.", "להציג את כרטיס האוכל לפני מרקים או מנות משותפות.")],
      ["15:00","☕",B("Flexible professional / water-tech window", "חלון גמיש לפגישה מקצועית / טכנולוגיות מים"),B("Keep this appointment-shaped, not appointment-assumed.", "להשאיר חלון לפגישה — לא להציג אותה כקבועה.")]
    ],
    links: [[B("Moto-Yoyogi", "מוטו־יויוגי"),MAP("Motoyoyogicho Shibuya Tokyo")],[B("Yoyogi cycling center", "מרכז האופניים יויוגי"),MAP("Yoyogi Park Cycling Center")]]
  },
  {
    id: "oct01", date: "2026-10-01", segment: "solo", icon: "💧", pace: "moderate",
    title: B("Water systems + west Tokyo memories", "מערכות מים וזיכרונות מערב טוקיו"),
    subtitle: B("A grounded professional day; no invented ASIJ event", "יום מקצועי מבוסס; בלי אירוע ASIJ מומצא"),
    tags: [["unverified","red"], ["moderate","amber"]],
    schedule: [
      ["09:30","💧",B("Tokyo Waterworks Historical Museum", "המוזיאון ההיסטורי של מערכת המים בטוקיו"),B("An unusually good fit for Gilad: Edo-era supply, modern purification, and urban infrastructure.", "התאמה חזקה לגלעד: אספקת מים מתקופת אדו, טיהור מודרני ותשתיות עירוניות.")],
      ["12:30","🚃",B("Kichijoji and Inokashira Park", "קיצ׳יג׳וג׳י ופארק אינוקשירה"),B("A calm westward loop with lunch and memory-space before any Chofu contact.", "לולאה רגועה מערבה עם ארוחה ומרחב לזיכרונות לפני כל קשר לצ׳ופו.")],
      ["15:00","🎓",B("ASIJ only if invited / confirmed", "ASIJ רק אם יש הזמנה / אישור"),B("There is no public confirmation for a reunion or campus event on this date. Contact alumni staff first.", "אין אישור ציבורי למפגש בוגרים או לאירוע בקמפוס בתאריך הזה. קודם לפנות לצוות הבוגרים.")]
    ],
    callout: ["warning",B("Do not arrive at the ASIJ campus speculatively. Public sources confirm the alumni program, not a 2026 event time or visitor access.", "לא להגיע לקמפוס ASIJ ללא תיאום. המקורות הציבוריים מאשרים פעילות בוגרים, אך לא שעה לאירוע ב-2026 או כניסת מבקרים.")],
    links: [[B("Waterworks museum", "מוזיאון המים"),MAP("Tokyo Waterworks Historical Museum")],[B("ASIJ alumni", "בוגרי ASIJ"),"https://www.asij.ac.jp/alumni/our-alumni"],[B("Inokashira Park", "פארק אינוקשירה"),MAP("Inokashira Park")]]
  },
  {
    id: "oct02", date: "2026-10-02", segment: "solo", icon: "◼", pace: "moderate",
    title: B("Tokyo design, detail, and street texture", "עיצוב, פרטים ומרקם רחוב בטוקיו"),
    subtitle: B("Aoyama architecture · ukiyo-e · Ura-Harajuku", "אדריכלות אאויאמה · אוקיו־אה · אורה־הרג׳וקו"),
    tags: [["moderate","green"]],
    schedule: [
      ["10:30","館",B("Nezu Museum architecture and garden", "האדריכלות והגן של מוזיאון נזו"),B("The Ceramic Travelogue exhibition runs through 12 October. Book 2 October timed entry through Nezu; allow 90–120 minutes including the garden. If sold out, keep the Omotesando architecture walk.", "התערוכה Ceramic Travelogue מתקיימת עד 12 באוקטובר. להזמין כניסה ל-2 באוקטובר דרך נזו; להקצות 90–120 דקות כולל הגן. אם אזל, לשמור על הליכת האדריכלות באומוטסנדו.")],
      ["13:30","版",B("Harajuku lunch and a slower Cat Street start", "ארוחה בהרג׳וקו ותחילת קאט סטריט בנחת"),B("Ōta is closed between exhibitions on 2 October; its next exhibition opens 6 October. Keep Nezu today and use this slot for lunch/rest. If wanted, check Ōta on 8 October as a replacement for another stop.", "אוטה סגור בין תערוכות ב-2 באוקטובר; התערוכה הבאה נפתחת ב-6 באוקטובר. לשמור על נזו היום ולנצל זמן זה לארוחה/מנוחה. אם רוצים, לבדוק את אוטה ב-8 באוקטובר במקום עצירה אחרת.")],
      ["15:00","👟",B("Ura-Harajuku and Cat Street", "אורה־הרג׳וקו וקאט סטריט"),B("Explore the side lanes; skip any venue that only repeats global luxury retail.", "לשוטט בסמטאות ולדלג על מקומות שהם רק חזרה על קמעונאות יוקרה גלובלית.")],
      ["18:00","🍽",B("Free evening", "ערב חופשי"),B("Keep the evening open for rest, a friend, or a neighborhood dinner.", "להשאיר את הערב פתוח למנוחה, חבר או ארוחה שכונתית.")]
    ],
    links: [[B("Nezu Museum", "מוזיאון נזו"),"https://www.nezu-muse.or.jp/en/"],[B("Ota Memorial", "מוזיאון אוטה"),"http://www.ukiyoe-ota-muse.jp/eng"],[B("Cat Street", "קאט סטריט"),MAP("Cat Street Harajuku")]]
  },
  {
    id: "oct03", date: "2026-10-03", segment: "solo", icon: "🎓", pace: "gentle",
    title: B("ASIJ lead or a dignified fallback", "כיוון ASIJ או חלופה מכובדת"),
    subtitle: B("A decision gate, not a fictional reception", "שער החלטה, לא קבלת פנים בדיונית"),
    tags: [["unverified","red"], ["gentle","blue"]],
    schedule: [
      ["10:00","✉",B("Check Mustangs Online / alumni office", "בדיקת Mustangs Online / משרד הבוגרים"),B("If a personal invitation contains time and venue, follow that invitation. Otherwise choose the fallback day.", "אם יש הזמנה אישית עם שעה ומקום — לפעול לפיה. אחרת לבחור ביום החלופי.")],
      ["11:30","◻",B("Fallback: 21_21 Design Sight", "חלופה: 21_21 Design Sight"),B("One focused design exhibition in Midtown, followed by a slower Akasaka/Aoyama walk.", "תערוכת עיצוב ממוקדת אחת במידטאון ואז הליכה רגועה באקסאקה/אאויאמה.")],
      ["16:00","🌿",B("Meiji Jingu Gaien outer grounds", "האזור החיצוני של מייג׳י גאיין"),B("The main Meiji Kinenkan building is under restoration through October 2026; do not assume event access.", "הבניין הראשי של מייג׳י קיננקאן בשיפוץ עד סוף אוקטובר 2026; אין להניח שיש גישה לאירוע.")]
    ],
    callout: ["warning",B("Status: unverified. The old app’s 18:30–20:30 Meiji Kinenkan reception had no public supporting source and has been removed.", "סטטוס: לא מאומת. קבלת הפנים במייג׳י קיננקאן 18:30–20:30 שהופיעה באפליקציה הישנה הוסרה כי לא נמצא מקור ציבורי תומך.")],
    links: [[B("ASIJ alumni community", "קהילת בוגרי ASIJ"),"https://www.asij.ac.jp/alumni/alumni-community"],[B("21_21 Design Sight", "21_21 Design Sight"),"https://www.2121designsight.jp/en/"]]
  },
  {
    id: "oct04", date: "2026-10-04", segment: "solo", icon: "🕺", pace: "gentle",
    title: B("Yoyogi Sunday, without promises", "יום ראשון ביויוגי, בלי הבטחות"),
    subtitle: B("Home ground · subculture if it appears · recovery", "אזור הבית · תת־תרבות אם מופיעה · התאוששות"),
    tags: [["weatherPlan","amber"], ["gentle","green"]],
    schedule: [
      ["09:00","⛩",B("Meiji Jingu early", "מייג׳י ג׳ינגו מוקדם"),B("Enter before the main crowds, then walk toward the Harajuku gate.", "להיכנס לפני העומס ואז ללכת לכיוון שער הרג׳וקו.")],
      ["12:30","🕺",B("Yoyogi Park subculture watch", "תצפית תת־תרבות בפארק יויוגי"),B("Rockabilly dancers are informal and never guaranteed. Enjoy if present; do not build the day around them.", "רקדני הרוקבילי הם מפגש לא רשמי ואינם מובטחים. ליהנות אם הם שם, לא לבנות סביבם את היום.")],
      ["15:00","☕",B("Daikanyama or local reset", "דאיקניאמה או איפוס מקומי"),B("A café, bookstore, laundry, and a quiet dinner are valid itinerary achievements.", "בית קפה, חנות ספרים, כביסה וארוחה שקטה הם הישגים תקפים במסלול.")]
    ],
    callout: ["info",B("The old app’s unverified regional excursion has been removed; this day now protects the personal Tokyo thread.", "הטיול האזורי הלא־מאומת מהאפליקציה הישנה הוסר; היום הזה שומר כעת על החיבור האישי לטוקיו.")],
    links: [[B("Meiji Jingu", "מייג׳י ג׳ינגו"),MAP("Meiji Jingu")],[B("Daikanyama", "דאיקניאמה"),MAP("Daikanyama T-Site")]]
  },
  {
    id: "oct05", date: "2026-10-05", segment: "solo", icon: "🧭", pace: "gentle",
    title: B("Soft landing before the family lands", "יום רך לפני נחיתת המשפחה"),
    subtitle: B("One museum · transfer check · laundry · early night", "מוזיאון אחד · בדיקת הסעה · כביסה · לילה מוקדם"),
    tags: [["gentle","green"]],
    schedule: [
      ["10:00","館",B("Optional 21_21 DESIGN SIGHT or a local walk", "21_21 DESIGN SIGHT אופציונלי או הליכה מקומית"),B("Nezu and Ōta are both closed today. 21_21 is the Monday design alternative (verify any exceptional closure); skip it if already visited on 3 October and enjoy Yoyogi-Uehara instead.", "נזו ואוטה סגורים היום. 21_21 הוא חלופת העיצוב ליום שני (לבדוק סגירה חריגה); אם כבר ביקרתם ב-3 באוקטובר, ליהנות מיויוגי־אוהארה במקום.")],
      ["14:00","📱",B("Reconfirm the airport transfer voucher", "אישור מחדש של שובר ההסעה"),B("Check flight, terminal, lead-passenger name, driver contact method, and the exact meeting instruction in Booking.com.", "לבדוק טיסה, טרמינל, שם נוסע ראשי, אופן יצירת קשר עם הנהג והוראת המפגש המדויקת בבוקינג.")],
      ["17:00","🎒",B("Prepare the family apartment handoff", "הכנת המעבר לדירת המשפחה"),B("Confirm whether Shibuya Urban Retreat can accept Gilad’s bags before check-in; otherwise keep them at the solo hotel.", "לאשר האם Shibuya Urban Retreat יכול לקבל את מזוודות גלעד לפני הצ׳ק־אין; אחרת להשאיר במלון הסולו.")]
    ],
    callout: ["warning",B("Check Booking.com transfer voucher for exact driver meeting point.", "יש לבדוק בשובר ההסעה של Booking.com את נקודת המפגש המדויקת עם הנהג.")],
    links: [[B("Booking.com trips", "הנסיעות שלי ב-Booking.com"),"https://secure.booking.com/myreservations.html"],[B("Narita passenger pickup", "איסוף נוסעים בנריטה"),"https://www.narita-airport.jp/en/airportguide/seeingoff-meeting/"]]
  },
  {
    id: "oct06", date: "2026-10-06", segment: "family", icon: "👋", pace: "gentle",
    title: B("The family arrives", "המשפחה מגיעה"),
    subtitle: B("Narita reunion · private transfer · zero-pressure dinner", "מפגש בנריטה · הסעה פרטית · ארוחה בלי לחץ"),
    tags: [["verified","green"], ["gentle","blue"]],
    schedule: [
      ["09:30","🧳",B("Move Gilad’s base to Nishihara", "העברת הבסיס של גלעד לנישיהארה"),B("Only leave luggage if the host has confirmed access or receipt.", "להשאיר מזוודות רק אם המארח אישר גישה או קבלה.")],
      ["13:30","🚆",B("Gilad heads to Narita T1", "גלעד יוצא לנריטה T1"),B("Aim to be in the public International Arrivals lobby before the scheduled 16:20 landing.", "להגיע לאולם מקבלי הפנים הציבורי לפני הנחיתה המתוכננת ב-16:20.")],
      ["16:20","✈️",B("Ayelet, Yaara, Geffen, and Erel land on LY075", "איילת, יערה, גפן ואראל נוחתים ב-LY075"),B("They pass immigration, baggage, and customs before entering the public arrivals hall.", "הם עוברים הגירה, מזוודות ומכס לפני היציאה לאולם הציבורי.")],
      ["18:00–18:45","🚐",B("Private transfer to Yoyogi-Uehara", "הסעה פרטית ליויוגי־אוהארה"),B("Booking.com reference ••••. Let the voucher—not guesswork—define the driver meeting point.", "מספר •••• ב-Booking.com. השובר, לא ניחוש, קובע את נקודת המפגש.")],
      ["20:15","🍜",B("Easy local dinner", "ארוחה קלה ליד הבית"),B("Udon, soba, rice, or convenience-store choices. No sightseeing target tonight.", "אודון, סובה, אורז או קנייה בקונביני. אין יעד תיירותי הערב.")]
    ],
    callout: ["info",B("Meet in the public 1F International Arrivals lobby after confirming the live flight and arrival wing. If separated, regroup at an Information counter and share live location.", "להיפגש באולם מקבלי הפנים הבינלאומי הציבורי בקומה 1 לאחר בדיקת הטיסה ואגף הנחיתה. אם מתפספסים, נפגשים בדלפק מידע ומשתפים מיקום חי.")],
    links: [[B("Narita T1 map", "מפת נריטה T1"),"https://www.narita-airport.jp/en/company/media-center/publications-pamphlets/kannaimap/"],[B("Home in Nishihara", "הבית בנישיהארה"),MAP("Nishihara 3-20-5 Shibuya Tokyo")]]
  },
  {
    id: "oct07", date: "2026-10-07", segment: "family", icon: "🔥", pace: "moderate",
    title: B("Old Tokyo, then fire and water", "טוקיו הישנה, אש ואז מים"),
    subtitle: B("Nezu → Yanaka → Fukagawa → Kiyosumi", "נזו ← יאנאקה ← פוקאגאווה ← קיוסומי"),
    tags: [["verified","green"], ["moderate","amber"]],
    schedule: [
      ["09:15","⛩",B("Nezu Shrine", "מקדש נזו"),B("Direct Chiyoda Line from Yoyogi-Uehara. Take the quieter torii slope before Yanaka.", "קו צ׳יודה ישיר מיויוגי־אוהארה. להתחיל בשביל הטוריאי השקט לפני יאנאקה.")],
      ["10:45","🐈",B("Yanaka lanes and early lunch", "הסמטאות של יאנאקה וארוחה מוקדמת"),B("Walk slowly, snack lightly, and sit down for a proper lunch before crossing east.", "ללכת לאט, לנשנש קלות ולשבת לארוחה לפני המעבר מזרחה.")],
      ["13:00 or 15:00","🔥",B("Fukagawa Fudō-dō Goma ritual", "טקס גומה בפוקאגאווה פודו־דו"),B("The ritual runs daily at 09:00, 11:00, 13:00, 15:00, and 17:00 and lasts about 30 minutes. No photos during worship.", "הטקס מתקיים מדי יום ב-09:00, 11:00, 13:00, 15:00 ו-17:00 ונמשך כחצי שעה. אין לצלם בזמן הפולחן.")],
      ["15:45","🌊",B("Kiyosumi Garden if energy remains", "גן קיוסומי אם נשאר כוח"),B("This is the first jet-lag cut. The route still makes sense without it.", "זה הדבר הראשון שמוותרים עליו בגלל ג׳ט לג. המסלול עדיין עובד בלעדיו.")]
    ],
    callout: ["info",B("Route audit: west-to-east with no serious backtracking. If the family wakes late, keep Nezu + Fukagawa and drop Kiyosumi.", "בדיקת מסלול: ממערב למזרח בלי חזרה משמעותית. אם קמים מאוחר, לשמור על נזו + פוקאגאווה ולוותר על קיוסומי.")],
    links: [[B("Nezu Shrine", "מקדש נזו"),MAP("Nezu Shrine")],[B("Fukagawa Fudō", "פוקאגאווה פודו"),"https://fukagawafudou.gr.jp/"],[B("Kiyosumi Garden", "גן קיוסומי"),MAP("Kiyosumi Gardens")]]
  },
  {
    id: "oct08", date: "2026-10-08", segment: "family", icon: "🏎", pace: "moderate",
    title: B("Split Tokyo: JDM + shopping", "טוקיו מתפצלת: JDM וקניות"),
    subtitle: B("Two distinct days, one satisfying reunion", "שני ימים שונים, מפגש מספק אחד"),
    tags: [["verified","green"], ["moderate","amber"]],
    schedule: [
      ["09:30","🏎",B("Gilad + Erel: A PIT Autobacs Shinonome", "גלעד + אראל: A PIT Autobacs Shinonome"),B("Large, legitimate JDM retail and displays; no street-racing mythology required.", "חנות ותצוגות JDM גדולות ולגיטימיות; בלי מיתולוגיית מרוצי רחוב.")],
      ["10:30","🛍",B("Ayelet + Yaara + Geffen: Omotesando to Shibuya", "איילת + יערה + גפן: מאומוטסנדו לשיבויה"),B("Architecture, Cat Street, Laforet, PARCO, and Daikanyama are a modular route—choose three, not all five.", "אדריכלות, קאט סטריט, לפורט, PARCO ודאיקניאמה הם מסלול מודולרי — לבחור שלושה, לא את כל החמישה.")],
      ["12:45","🚗",B("JDM pair: Nissan Crossing Ginza", "צמד JDM: ניסאן קרוסינג בגינזה"),B("Compact showroom stop and lunch in Ginza before heading west.", "עצירת שואורום קצרה וארוחה בגינזה לפני הנסיעה מערבה.")],
      ["15:30","🧢",B("JDM pair: Liberty Walk Harajuku", "צמד JDM: Liberty Walk Harajuku"),B("Streetwear, models, and car-culture detail. Current shop hours begin at 11:30.", "אופנת רחוב, דגמים ופרטי תרבות רכב. שעות הפתיחה הנוכחיות מתחילות ב-11:30.")],
      ["16:45","👨‍👩‍👧‍👦",B("Reunite around Harajuku / Omotesando", "מפגש מחודש סביב הרג׳וקו / אומוטסנדו"),B("Share café pin in the family chat by 15:30; move together to dinner in Shibuya.", "לשתף נקודת בית קפה בקבוצה עד 15:30; להמשיך יחד לארוחה בשיבויה.")]
    ],
    callout: ["warning",B("Daikoku PA is not a public-transit attraction. Include it only through a vetted, legal licensed tour or a lawful rental-car plan; no visit is promised here.", "Daikoku PA אינו אתר נגיש בתחבורה ציבורית. לכלול רק בסיור מורשה וחוקי או בתכנית השכרת רכב חוקית; אין כאן הבטחה לביקור.")],
    links: [[B("A PIT Shinonome", "A PIT שינונומה"),"https://www.apit-autobacs.com/shinonome/shopinfo/"],[B("Nissan Crossing", "ניסאן קרוסינג"),"https://www.nissan.co.jp/crossing/en/access"],[B("Liberty Walk Tokyo", "ליברטי ווק טוקיו"),"https://libertywalk.co.jp/tokyo/"]]
  },
  {
    id: "oct09", date: "2026-10-09", segment: "family", icon: "🌊", pace: "demanding",
    title: B("Enoshima aquarium or island + Kamakura", "האקווריום או האי אנושימה + קמקורה"),
    subtitle: B("One coastal experience · Great Buddha locked · no overstuffing", "חוויה חופית אחת · הבודהה הגדול נעול · בלי דחיסה"),
    tags: [["demanding","amber"], ["weatherPlan","blue"]],
    schedule: [
      ["07:30","🚆",B("Odakyu from Yoyogi-Uehara via Fujisawa", "אודקיו מיויוגי־אוהארה דרך פוג׳יסאווה"),B("Allow 70–80 minutes with a likely connection. Buy the Enoshima-Kamakura 1-Day Pass if using the Enoden twice.", "להקצות 70–80 דקות עם החלפה סבירה. לקנות כרטיס Enoshima-Kamakura ליום אם נוסעים פעמיים באנודן.")],
      ["09:00–11:45","🐠",B("Choose one: island or New Enoshima Aquarium", "לבחור אחד: האי או אקווריום אנושימה החדש"),B("Use the aquarium for rain, wind, heat, or lower energy. On a clear day, keep the shrine-and-viewpoint island route. Never do the full versions of both.", "לבחור באקווריום בגשם, רוח, חום או אנרגיה נמוכה. ביום בהיר לשמור על מסלול המקדשים והתצפיות באי. לא לעשות את הגרסאות המלאות של שניהם.")],
      ["12:15","🍱",B("Lunch near Enoshima or Hase", "ארוחה ליד אנושימה או האסה"),B("Avoid spending the day in food lines. Use the dietary card before shared broth or seafood platters.", "לא לבזבז את היום בתורים לאוכל. להציג את כרטיס התזונה לפני מרק משותף או מגשי ים.")],
      ["13:30","🗿",B("Enoden to Hase + Great Buddha", "אנודן להאסה + הבודהה הגדול"),B("This is the family anchor after the coast and should not be traded away for a third distant stop.", "זהו עוגן המשפחה אחרי החוף ואין להחליף אותו ביעד שלישי מרוחק.")],
      ["15:15","🎋",B("Decision gate: Hōkoku-ji or slow Kamakura", "שער החלטה: הוקוקו־ג׳י או קמקורה רגועה"),B("Hōkoku-ji requires a bus/taxi across town and an early last-entry check. Skip it if Enoshima ran long.", "הוקוקו־ג׳י דורש אוטובוס/מונית לצד השני של העיר ובדיקת שעת כניסה אחרונה. לוותר אם אנושימה התארכה.")]
    ],
    choice: {
      key: "oct09",
      options: [
        { id: "coast", title: B("Good weather: Enoshima island", "מזג אוויר טוב: האי אנושימה"), desc: B("Shrines, sea views, and optional Iwaya caves only if the sea is calm and everyone is moving well. This is the more distinctively Japanese outdoor day.", "מקדשים, נופי ים ומערות Iwaya אופציונליות רק אם הים רגוע וכולם מתקדמים היטב. זהו היום היפני והחיצוני המובהק יותר."), meta: B("¥–¥¥ · 2.5–3h · weather-dependent", "¥–¥¥ · 2.5–3 שעות · תלוי מזג אוויר"), facts:[B("Outdoor","בחוץ"),B("More walking","יותר הליכה"),B("Best views","הנופים הטובים ביותר"),B("No booking","ללא הזמנה")], rec: true },
        { id: "aquarium", title: B("Wet/windy day: New Enoshima Aquarium", "יום רטוב/סוער: אקווריום אנושימה החדש"), desc: B("Jellyfish and Sagami Bay habitats beside the beach. The current March–November pattern is 09:00–17:00, last entry 16:00; recheck 9 October exceptions. Allow about 2.5 hours, then Enoden to Hase. This replaces the island visit.", "מדוזות ובתי גידול של מפרץ סגאמי ליד החוף. הדפוס הנוכחי למרץ–נובמבר הוא 09:00–17:00, כניסה אחרונה 16:00; לבדוק חריגים ל-9 באוקטובר. להקצות כ-2.5 שעות ואז אנודן להאסה. זה מחליף את הביקור באי."), meta: B("Adult ¥2,800 · high school ¥1,800 · child ¥1,300", "מבוגר 2,800¥ · תיכון 1,800¥ · ילד 1,300¥"), facts:[B("Mostly indoor","בעיקר בפנים"),B("All-age fit","מתאים לכל הגילים"),B("Student ID required","נדרשת תעודת תלמיד"),B("Buy at gate/official partner","לקנות בכניסה/שותף רשמי")] }
      ]
    },
    callout: ["warning",B("Aquarium means replacing the island circuit—not adding it. Protect the Great Buddha; Hōkoku-ji remains a stretch only if the morning ends on time.", "האקווריום מחליף את סיבוב האי — הוא לא תוספת. לשמור על הבודהה הגדול; Hōkoku-ji נשאר בונוס רק אם הבוקר מסתיים בזמן.")],
    links: [[B("Aquarium official hours + tickets", "שעות וכרטיסים רשמיים לאקווריום"),"https://www.enosui.com/basicinfo.php"],[B("Aquarium English guide", "מדריך האקווריום באנגלית"),"https://www.enosui.com/en/"],[B("Odakyu pass", "כרטיס אודקיו"),"https://www.odakyu.jp/english/passes/enoshima_kamakura/"],[B("Enoshima", "אנושימה"),MAP("Enoshima Island")],[B("Great Buddha", "הבודהה הגדול"),MAP("Kotoku-in Kamakura")]]
  },
  {
    id: "oct10", date: "2026-10-10", segment: "family", icon: "🎛", pace: "moderate",
    title: B("Family choice day", "יום בחירה משפחתי"),
    subtitle: B("Six genuinely different options; the new favorite is hands-on", "שש חלופות שונות באמת; המועדפת החדשה היא יום מעשי"),
    tags: [["reservationNeeded","red"], ["moderate","amber"]],
    schedule: [
      ["08:30","☕",B("Slow breakfast + family vote", "ארוחת בוקר רגועה + הצבעה משפחתית"),B("Use the comparison below. Do not combine two full options just because they fit on a screen.", "להשתמש בהשוואה למטה. לא לשלב שתי חלופות מלאות רק כי הן נכנסות למסך.")],
      ["10:00–11:00","🥁",B("New favorite: play taiko together", "המועדפת החדשה: לנגן יחד בטאיקו"),B("Request a one-hour English family slot from Taiko Center and confirm the actual venue, minimum age and all five places before paying. Allow a generous transfer/lunch break before Shinanomachi; if the slot fails, use just the cooking class or the Odaiba alternative.", "לבקש מ-Taiko Center שעה משפחתית באנגלית ולאשר כתובת, גיל מינימלי וחמישה מקומות לפני תשלום. להשאיר מרווח נדיב לנסיעה וארוחה לפני שיננומאצ׳י; אם אין מקום, להסתפק בסדנת הבישול או בחלופת אודאיבה.")],
      ["13:30–16:30","🍣",B("Make the family meal at Cooking Sun", "להכין את הארוחה המשפחתית ב-Cooking Sun"),B("Cooking Sun lists 13:30–16:30, with ages 6–12 charged as children and 13+ as adults. Book four adults and Erel as a child, after written confirmation of the family’s no-meat, no-pork and no-shellfish preparations. Allow 7–8 minutes from Shinanomachi Station.", "Cooking Sun מפרסם 13:30–16:30, גילי 6–12 בתעריף ילד ו-13 ומעלה כמבוגרים. להזמין ארבעה מבוגרים ואת אראל כילד, אחרי אישור כתוב להכנה ללא בשר, ללא חזיר וללא פירות ים לפי צורכי המשפחה. להקצות 7–8 דקות מתחנת שיננומאצ׳י.")],
      ["17:00 onward","🌆",B("Easy finish, not another attraction", "סיום קל, לא עוד אטרקציה"),B("Walk, browse, or eat only if anyone is still hungry. The drumming and cooking are the complete day.", "לטייל, לשוטט או לאכול רק אם מישהו עדיין רעב. התיפוף והבישול הם יום שלם.")]
    ],
    callout: ["info",B("Miraikan is closed for major renovation from 1 October 2026 to 22 April 2027, so it is not a usable option on this trip.", "מוזיאון מיראיקן סגור לשיפוץ גדול מ-1 באוקטובר 2026 עד 22 באפריל 2027 ולכן אינו אפשרות בטיול הזה.")],
    choice: {
      key: "oct10",
      options: [
        { id: "maker-day", title: B("Taiko + sushi studio", "טאיקו + סטודיו סושי"), desc: B("One hour of official English taiko in Aoyama, then a three-hour English sushi class in Shinanomachi. Two bookings, one excellent shared memory; reserve the cooking class only after written dietary confirmation.", "שעה של טאיקו רשמי באנגלית באויאמה ואז סדנת סושי באנגלית של שלוש שעות בשיננומאצ׳י. שתי הזמנות, זיכרון משפחתי מצוין אחד; להזמין את הבישול רק אחרי אישור כתוב למגבלות המזון."), meta: B("¥¥¥ · 5–6h · all five", "¥¥¥ · 5–6 שעות · כל החמישה"), facts:[B("Fun 5/5","כיף 5/5"),B("Crowd low","עומס נמוך"),B("Booking: 2 suppliers","הזמנה: 2 ספקים"),B("Indoor","בפנים"),B("Effort easy–moderate","מאמץ קל–בינוני"),B("Age fit 5/5","התאמת גיל 5/5")], rec: true },
        { id: "odaiba-lab", title: B("Odaiba Play Lab", "מעבדת המשחק של אודאיבה"), desc: B("Rainbow Sewerage Museum + Sona disaster park + Small Worlds; mostly indoor, modular, strong value, and the best fallback if the food accommodations fail.", "מוזיאון הביוב ריינבו + פארק החירום Sona + Small Worlds; בעיקר בפנים, מודולרי ותמורה חזקה, והחלופה הטובה ביותר אם התאמות המזון לא מסתדרות."), meta: B("¥–¥¥ · 5–7h · all five", "¥–¥¥ · 5–7 שעות · כולם"), facts:[B("Fun 4/5","כיף 4/5"),B("Crowd low–moderate","עומס נמוך–בינוני"),B("Booking easy","הזמנה קלה"),B("Mostly indoor","בעיקר בפנים"),B("Effort moderate","מאמץ בינוני"),B("Age fit 5/5","התאמת גיל 5/5")] },
        { id: "warner", title: B("Warner Bros Studio Tour", "סיור אולפני וורנר"), desc: B("Highly produced Harry Potter world; weatherproof but long and pre-booked.", "עולם הארי פוטר מושקע; חסין גשם אך ארוך ודורש הזמנה."), meta: B("from ¥6,600 adult · 4–5h", "מ-6,600¥ למבוגר · 4–5 שעות"), facts:[B("Fun 5/5 for fans","כיף 5/5 למעריצים"),B("Crowd timed","עומס מנוהל"),B("Booking hard","הזמנה קשה"),B("Indoor","בפנים"),B("Effort easy","מאמץ קל"),B("Downside: niche","חיסרון: נישתי")] },
        { id: "joypolis", title: B("Joypolis + Tokyo Bay", "ג׳ויפוליס + מפרץ טוקיו"), desc: B("Indoor rides and games, then sunset outside; best if the teens want high energy.", "מתקנים ומשחקים בפנים ואז שקיעה בחוץ; הכי מתאים אם בני הנוער רוצים אנרגיה גבוהה."), meta: B("adult passport ¥6,000 · 4–6h", "כרטיס מבוגר 6,000¥ · 4–6 שעות"), facts:[B("Fun 5/5 teens","כיף 5/5 לנוער"),B("Crowd moderate–high","עומס בינוני–גבוה"),B("Booking easy","הזמנה קלה"),B("Indoor","בפנים"),B("Effort easy","מאמץ קל"),B("Downside: noisy","חיסרון: רועש")] },
        { id: "waterbus", title: B("Asakusa water bus + Small Worlds", "אוטובוס מים מאסקוסה + Small Worlds"), desc: B("A city-through-water day with a detailed miniature finish; weather adds or subtracts value.", "יום עירוני דרך המים עם סיום בעולם מיניאטורי מפורט; מזג האוויר משפיע מאוד."), meta: B("about ¥5,200 adult combined · 5h", "כ-5,200¥ למבוגר יחד · 5 שעות"), facts:[B("Fun 4/5","כיף 4/5"),B("Crowd low–moderate","עומס נמוך–בינוני"),B("Booking easy","הזמנה קלה"),B("Weather-sensitive","תלוי מזג אוויר"),B("Effort moderate","מאמץ בינוני"),B("Age fit 4/5","התאמת גיל 4/5")] },
        { id: "planets", title: B("teamLab Planets", "teamLab Planets"), desc: B("Spectacular and tactile, but overlaps with the newer Kyoto Biovortex experience.", "מרהיב וחושי, אבל חופף לחוויית Biovortex החדשה בקיוטו."), meta: B("timed ticket · 2–3h", "כרטיס לשעה קבועה · 2–3 שעות"), facts:[B("Fun 4/5","כיף 4/5"),B("Crowd timed/high","עומס מתוזמן/גבוה"),B("Booking medium","הזמנה בינונית"),B("Indoor/water","בפנים/מים"),B("Effort easy","מאמץ קל"),B("Downside: duplicate","חיסרון: חפיפה")] }
      ]
    },
    links: [[B("Official English taiko", "טאיקו רשמי באנגלית"),"https://www.taiko-reserve.com/en/"],[B("Klook Okubo fallback", "חלופת Klook באוקובו"),"https://www.klook.com/en-US/activity/8758-taiko-japanese-drum-experience-tokyo/"],[B("Cooking Sun Tokyo", "Cooking Sun טוקיו"),"https://www.cooking-sun.com/tokyo-cooking-class/"],[B("Rainbow Sewerage Museum", "מוזיאון הביוב ריינבו"),"https://www.nijinogesuidoukan.jp/en/"],[B("Warner Bros tickets", "כרטיסים לוורנר"),"https://www.wbstudiotour.jp/en/tickets/"],[B("Small Worlds", "Small Worlds"),"https://smallworlds.jp/en/"]]
  },
  {
    id: "oct11", date: "2026-10-11", segment: "izu", icon: "🚆", pace: "moderate",
    title: B("Meiji morning → Saphir to Ito", "בוקר מייג׳י ← ספיר לאיטו"),
    subtitle: B("Five online seats now · private room only after arrival", "חמישה מושבים אונליין עכשיו · תא פרטי רק אחרי הנחיתה"),
    tags: [["reservationNeeded","red"], ["verified","green"]],
    schedule: [
      ["08:00","⛩",B("Meiji Jingu + a short home-ground walk", "מייג׳י ג׳ינגו + הליכה קצרה באזור הבית"),B("Keep it close to Nishihara and return for the three-night bags.", "להישאר קרוב לנישיהארה ולחזור לתיקי שלושת הלילות.")],
      ["10:30","🧳",B("Leave only with compact Izu bags", "לצאת רק עם תיקים קטנים לאיזו"),B("Large bags should already be accepted for Kyoto delivery—or stay with you if Besso acceptance was not confirmed.", "המזוודות הגדולות אמורות כבר להיות במסירה לקיוטו — או להישאר אתכם אם Besso לא אישרו קבלה.")],
      ["11:50","🚉",B("At Shibuya before boarding", "בשיבויה לפני העלייה"),B("Reach the platform with at least 25 minutes in hand; buy lunch beforehand.", "להגיע לרציף עם לפחות 25 דקות רזרבה; לקנות ארוחה לפני כן.")],
      ["12:30–14:16","💎",B("Saphir Odoriko 5: Shibuya → Ito", "ספיר אודוריקו 5: שיבויה ← איטו"),B("Scheduled Saturdays, Sundays, and holidays in the 14 March 2026 timetable. Recheck final operation before departure.", "מתוכננת לשבתות, ימי ראשון וחגים בלוח מ-14 במרץ 2026. לבדוק שוב את ההפעלה הסופית לפני הנסיעה.")],
      ["15:00","♨️",B("Laforet Ito check-in + private bath", "צ׳ק־אין ב-Laforet Ito + אמבט פרטי"),B("Walk about 8 minutes from Ito Station, then stop moving for the day.", "כ-8 דקות הליכה מתחנת איטו ואז מפסיקים לנוע להיום.")]
    ],
    callout: ["warning",B("If the private room does not appear online, the site is behaving correctly: cars 2–3 are counter/machine-only. Safest move now: secure five Green Car seats online, then ask about a six-person room after landing. Official Tokyo→Ito fare references are ¥38,200 for that room used by five and ¥7,080 per Green seat; the actual Shibuya fare appears at purchase.", "אם התא הפרטי אינו מופיע אונליין, האתר פועל כרגיל: קרונות 2–3 נמכרים רק בדלפק/מכונה. המהלך הבטוח עכשיו: להבטיח חמישה מושבי גרין אונליין ואז לשאול על תא לשישה אחרי הנחיתה. מחירי הייחוס הרשמיים מטוקיו לאיטו הם 38,200¥ לתא בשימוש חמישה ו-7,080¥ למושב גרין; המחיר בפועל משיבויה יוצג ברכישה.")],
    links: [[B("Saphir timetable", "לוח ספיר"),"https://www.jreast.co.jp/saphir/en/cars/station/"],[B("Saphir tickets", "כרטיסי ספיר"),"https://www.jreast.co.jp/saphir/en/cars/ticket/"],[B("JR East booking", "הזמנות JR East"),"https://www.eki-net.com/jreast-train-reservation/Top/Index"]]
  },
  {
    id: "oct12", date: "2026-10-12", segment: "izu", icon: "🌋", pace: "demanding",
    title: B("Volcanic coast + Mt Ōmuro", "חוף וולקני + הר אומורו"),
    subtitle: B("One-day rental recommended · train-and-bus backup", "מומלצת השכרה ליום אחד · חלופת רכבת ואוטובוס"),
    tags: [["weatherPlan","amber"], ["demanding","red"]],
    schedule: [
      ["08:00–08:30","🚗",B("Start from Ito by the chosen mode", "לצאת מאיטו באמצעי שנבחר"),B("Recommended: collect a compact car at Nippon Rent-A-Car beside Ito Station at 08:00. Transit backup: Izu Kyūkō + Tokai Bus after checking the holiday timetable the night before.", "מומלץ: לאסוף רכב קומפקטי ב-08:00 מ-Nippon Rent-A-Car ליד תחנת איטו. חלופת תחבורה: Izu Kyūkō + Tokai Bus אחרי בדיקת לוח החג בערב הקודם.")],
      ["09:15","🌊",B("Kadowaki Bridge short loop", "לולאה קצרה בגשר קדוואקי"),B("The bridge is 48 m long and 23 m above the sea. Protect 60–90 minutes for the lava coast; do not attempt the full 9 km network.", "אורך הגשר 48 מ׳ וגובהו 23 מ׳ מעל הים. לשמור 60–90 דקות לחוף הלבה; לא לנסות את כל רשת 9 הק״מ.")],
      ["12:00","🍱",B("Lunch around Izu-Kōgen", "ארוחה באזור איזו־קוגן"),B("This is also the go/no-go point for the chairlift.", "זוהי גם נקודת ההחלטה לגבי הרכבל.")],
      ["13:30","🌋",B("Mt Ōmuro rim if the lift runs", "שפת הר אומורו אם הרכבל פועל"),B("October lift hours are 09:00–16:00, last descent 16:15. The 1 km rim takes about 20–30 minutes plus queues. Check wind operation at lunch; skip the lift if arrival/queues threaten the last descent or car-return buffer.", "באוקטובר הרכבל פועל 09:00–16:00, ירידה אחרונה 16:15. היקף הלוע, קילומטר, אורך כ-20–30 דקות בתוספת תורים. לבדוק רוח בארוחה; לוותר אם ההגעה/התורים מסכנים את הירידה האחרונה או מרווח החזרת הרכב.")],
      ["16:30–18:30","♨️",B("Return to Ito with margin", "לחזור לאיטו עם מרווח"),B("Aim to refuel and return by 17:30–18:00, leaving at least one hour before Nippon/Toyota’s current 19:00 closing. Check the actual holiday reservation terms. If using transit, photograph the return buses and drop the mountain if connections slip.", "לכוון לתדלוק והחזרה עד 17:30–18:00, עם לפחות שעה לפני סגירת Nippon/Toyota הנוכחית ב-19:00. לבדוק את תנאי ההזמנה בחג. בתחבורה ציבורית לצלם את אוטובוסי החזרה ולוותר על ההר אם ההחלפות מתעכבות.")]
    ],
    choice: {
      key: "oct12",
      options: [
        { id: "rental", title: B("Recommended: one-day compact car", "מומלץ: רכב קומפקטי ליום אחד"), desc: B("Pick up and return at Ito Station on 12 October only. It makes the two-stop coast + mountain day much cleaner, while avoiding an unused car on the slow 13 October ryokan day. Kadowaki parking: 123 cars, ¥500 after 15 minutes; Mt Ōmuro: about 500 spaces.", "לאסוף ולהחזיר בתחנת איטו רק ב-12 באוקטובר. זה הופך את יום החוף + ההר לנקי בהרבה, בלי רכב מיותר ביום הריוקאן הרגוע ב-13 באוקטובר. חניית קדוואקי: 123 רכבים, 500¥ אחרי 15 דקות; הר אומורו: כ-500 מקומות."), meta: B("08:00–18:00 target · five legal seats · original IDP", "יעד 08:00–18:00 · חמישה מושבים חוקיים · רישיון בינלאומי מקורי"), facts:[B("Fastest between sights","הכי מהיר בין האתרים"),B("Holiday flexibility","גמישות בחג"),B("Narrow roads","כבישים צרים"),B("Reserve now","להזמין עכשיו")], rec: true },
        { id: "transit", title: B("No-driving backup: rail + Tokai Bus", "חלופה ללא נהיגה: רכבת + Tokai Bus"), desc: B("No paperwork or driving stress, but the rural transfers dictate the day. Photograph every return timetable and be willing to drop Mt Ōmuro if connections slip.", "בלי ניירת או לחץ נהיגה, אך ההחלפות הכפריות מכתיבות את היום. לצלם כל לוח חזרה ולהיות מוכנים לוותר על הר אומורו אם החיבורים מחליקים."), meta: B("Izu Kyūkō + bus · cheaper · more waiting", "Izu Kyūkō + אוטובוס · זול יותר · יותר המתנה"), facts:[B("No reservation","ללא הזמנה"),B("No IDP","ללא רישיון בינלאומי"),B("Weather exposed","חשוף למזג אוויר"),B("Keep schedule loose","לשמור לו״ז גמיש")] }
      ]
    },
    callout: ["info",B("Laforet confirms free guest parking for about 50 cars, but a same-day Ito Station rental is still the better shape. If wet or windy, cancel within the rental terms and use Tōkai-kan + hotel onsen instead.", "Laforet מאשר חניה חינם לאורחים לכ-50 רכבים, אך השכרה באותו יום מתחנת איטו עדיין בנויה טוב יותר. אם רטוב או סוער, לבטל לפי תנאי ההשכרה ולעבור ל-Tōkai-kan + אונסן במלון.")],
    links: [[B("Nippon Ito rental", "השכרת Nippon באיטו"),"https://store.nipponrentacar.co.jp/en/b/nrs/info/470337/"],[B("Toyota Ito rental", "השכרת Toyota באיטו"),"https://rent.toyota.co.jp/eng/reservation/index01.aspx?eShop=031&rShop=63601&shopMode=0"],[B("Israel Embassy: Japan IDP", "שגרירות ישראל: רישיון בינלאומי ליפן"),"https://embassies.gov.il/japan/he/announcements/international-driving-permit"],[B("Jōgasaki official guide", "מדריך רשמי לג׳וגסאקי"),"https://itospa.com/spot/detail_54002.html"],[B("Mt Ōmuro", "הר אומורו"),"https://omuroyama.com/"],[B("Kadowaki Bridge", "גשר קדוואקי"),MAP("Kadowaki Suspension Bridge")]],
    photo: { src: "assets/jogasaki-coast.webp", alt: B("Kadowaki suspension bridge at Jōgasaki Coast", "גשר קדוואקי בחוף ג׳וגסאקי"), credit: "Batholith · CC BY-SA 3.0", url: "https://commons.wikimedia.org/wiki/File:Jogasaki_Coast_20111016_b.jpg" }
  },
  {
    id: "oct13", date: "2026-10-13", segment: "izu", icon: "♨️", pace: "gentle",
    title: B("Choose the Izu tempo", "בחירת הקצב של איזו"),
    subtitle: B("The rebuild recommends a real ryokan day", "הגרסה החדשה ממליצה על יום ריוקאן אמיתי"),
    tags: [["gentle","green"]],
    schedule: [
      ["08:30","🥢",B("Unhurried ryokan breakfast", "ארוחת בוקר רגועה בריוקאן"),B("Do not leave before deciding whether the family actually wants another excursion.", "לא לצאת לפני שמחליטים אם המשפחה באמת רוצה עוד טיול.")],
      ["10:30–16:30","⚖",B("Run one selected option", "לבצע חלופה אחת שנבחרה"),B("The slow option best balances the entire trip and keeps the half-board stay meaningful.", "החלופה הרגועה מאזנת בצורה הטובה ביותר את הטיול ונותנת משמעות לשהות חצי הפנסיון.")],
      ["17:00","♨️",B("Bath + pack for Kyoto", "אמבט + אריזה לקיוטו"),B("Confirm tomorrow’s Hikari, SmartEX QR setup, and Ito→Atami local departure.", "לאשר את Hikari למחר, את הגדרת QR ב-SmartEX ואת היציאה המקומית מאיטו לאטאמי.")]
    ],
    choice: {
      key: "oct13",
      options: [
        { id: "slow-izu", title: B("Slow Ito + ryokan", "איטו רגועה + ריוקאן"), desc: B("Tōkai-kan, Matsukawa river, private onsen, and an early dinner. Best trip balance.", "Tōkai-kan, נהר מצוקאווה, אונסן פרטי וארוחת ערב מוקדמת. האיזון הטוב בטיול."), meta: B("¥ · gentle · recommended", "¥ · קל · מומלץ"), rec: true },
        { id: "kawazu", title: B("Kawazu Seven Falls", "שבעת מפלי קוואזו"), desc: B("Bus from Kawazu Station about 25 minutes; allow 90–120 minutes for a stair-heavy gorge walk. Skip Shimoda.", "אוטובוס של כ-25 דקות מתחנת קוואזו; להקצות 90–120 דקות למסלול ערוץ עם מדרגות רבות. לוותר על שימודה."), meta: B("¥¥ · moderate/damp surfaces", "¥¥ · בינוני/משטחים רטובים") },
        { id: "zoo", title: B("Capybaras + Mt Ōmuro area", "קפיברות + אזור הר אומורו"), desc: B("Izu Shaboten Zoo is family-friendly but less aligned with the trip’s strongest themes.", "גן החיות Izu Shaboten מתאים למשפחה אך מחובר פחות לנושאים החזקים של הטיול."), meta: B("¥¥ · 4–5h", "¥¥ · 4–5 שעות") }
      ]
    },
    callout: ["warning",B("Do not combine Kawazu Falls and Shimoda unless the family explicitly chooses a long, early day and accepts losing ryokan time.", "לא לשלב את מפלי קוואזו ושימודה אלא אם המשפחה בוחרת במפורש ביום ארוך ומוקדם ומוכנה לוותר על זמן ריוקאן.")],
    links: [[B("Kawazu Falls", "מפלי קוואזו"),MAP("Kawazu Nanadaru")],[B("Tōkai-kan", "Tōkai-kan"),MAP("Tokaikan Ito")]]
  },
  {
    id: "oct14", date: "2026-10-14", segment: "kyoto", icon: "🚅", pace: "moderate",
    title: B("Ito → Atami → Kyoto", "איטו ← אטאמי ← קיוטו"),
    subtitle: B("A clean transfer day with a new Kyoto evening option", "יום מעבר נקי עם אפשרות ערב חדשה בקיוטו"),
    tags: [["reservationNeeded","red"], ["moderate","amber"]],
    schedule: [
      ["09:30","🧳",B("Check out after breakfast", "צ׳ק־אאוט אחרי ארוחת בוקר"),B("Keep train QR/tickets, one snack, and water accessible.", "להחזיק QR/כרטיסים, חטיף ומים בהישג יד.")],
      ["10:30–11:00","🚃",B("Ito Line to Atami", "קו איטו לאטאמי"),B("About 25 minutes. The local fare/IC is separate from the SmartEX Shinkansen ticket. Buy plain rice/onigiri or a verified fish-only ekiben before the transfer; broths and garnishes can hide meat or shellfish.", "כ-25 דקות. התשלום המקומי/IC נפרד מכרטיס ה-SmartEX לשינקנסן. לקנות אורז/אוניגירי פשוט או אקיבן דגים שנבדק לפני המעבר; צירים ותוספות עלולים להסתיר בשר או פירות ים.")],
      ["11:30–12:15","🚅",B("Target a direct Hikari to Kyoto", "לכוון ל-Hikari ישירה לקיוטו"),B("Nozomi does not stop at Atami. Allow 35–45 minutes between the local arrival and Shinkansen departure; follow the Shinkansen transfer signs.", "Nozomi לא עוצרת באטאמי. להשאיר 35–45 דקות בין הרכבת המקומית לשינקנסן ולעקוב אחרי שלטי המעבר.")],
      ["15:00–16:00","🏠",B("The Besso Soso check-in", "צ׳ק־אין ב-The Besso Soso"),B("Confirm luggage receipt before assuming shipped bags are waiting.", "לאשר קבלת מזוודות לפני שמניחים שהן ממתינות.")],
      ["18:00–20:30","✨",B("Optional: teamLab Biovortex Kyoto", "אופציונלי: teamLab Biovortex Kyoto"),B("Permanent venue, 7 minutes from Kyoto Station’s Hachijo East Gate, open to 21:00 with last entry 19:30. This is why Tokyo Planets can be skipped.", "אתר קבוע, 7 דקות משער Hachijo East של תחנת קיוטו, פתוח עד 21:00 וכניסה אחרונה 19:30. זו הסיבה שאפשר לוותר על Planets בטוקיו.")]
    ],
    callout: ["info",B("Ask for the E-side seats on the westbound Shinkansen for the Mt Fuji side. Exact October timetable and platform are a recheck item—not something to guess today.", "לבקש מושבים בצד E בשינקנסן מערבה עבור צד הר פוג׳י. לוח אוקטובר והרציף המדויק הם פריט לבדיקה מחדש — לא לניחוש עכשיו.")],
    links: [[B("SmartEX", "SmartEX"),"https://global.jr-central.co.jp/en/onlinebooking/"],[B("teamLab Biovortex", "teamLab Biovortex"),"https://art.team-lab.cn/en/e/kyoto/"],[B("Besso Soso", "Besso Soso"),MAP("The Besso Soso Kyoto")]]
  },
  {
    id: "oct15", date: "2026-10-15", segment: "kyoto", icon: "🚞", pace: "demanding",
    title: B("Arashiyama done backwards", "אראשיאמה מהסוף להתחלה"),
    subtitle: B("Gorge train up · river boat down · quiet Saga walk", "רכבת במעלה הערוץ · סירה במורד · הליכת סאגה שקטה"),
    tags: [["reservationNeeded","red"], ["weatherPlan","amber"], ["demanding","red"]],
    schedule: [
      ["07:45","🚃",B("Kyoto → Saga-Arashiyama", "קיוטו ← סאגה־אראשיאמה"),B("Arrive early enough to find Torokko Saga without rushing.", "להגיע מוקדם מספיק כדי למצוא את Torokko Saga בלי לחץ.")],
      ["09:02–09:25","🚞",B("Sagano Romantic Train to Kameoka", "רכבת סאגאנו הרומנטית לקמאוקה"),B("Reserve Car 5 ‘Rich’ only if the family accepts open sides and no umbrella use in rain.", "להזמין קרון 5 ‘Rich’ רק אם המשפחה מוכנה לצדדים פתוחים ולאיסור מטריות בגשם.")],
      ["09:35","🚌",B("Connection to the Hozugawa boat dock", "חיבור לרציף סירת הוזוגאווה"),B("Official pattern: trolley arrives :25, connecting bus leaves :35, about 10 minutes, ¥500 adult. Taxi should be pre-arranged, not expected at Kameoka.", "הדפוס הרשמי: הרכבת מגיעה ב-:25, אוטובוס יוצא ב-:35, כ-10 דקות, 500¥ למבוגר. מונית יש להזמין מראש, לא לצפות שתמתין בקמאוקה.")],
      ["10:00–12:00","🛶",B("Hozugawa River Boat downstream", "שיט הוזוגאווה במורד"),B("About two hours, water/weather dependent, finishing in central Arashiyama near Togetsukyo. Adult ¥6,000; age 12 is adult unless still classed as elementary school by the operator.", "כשעתיים, תלוי מים ומזג אוויר, עם סיום במרכז אראשיאמה ליד Togetsukyo. מבוגר 6,000¥; גיל 12 נחשב מבוגר אלא אם המפעיל מסווג עדיין כבית ספר יסודי.")],
      ["13:15","🚕",B("Taxi north to Otagi Nenbutsu-ji", "מונית צפונה ל-Otagi Nenbutsu-ji"),B("For five passengers, use two ordinary taxis or confirm a large vehicle; skip this optional temple if tired. Then walk downhill through Saga-Toriimoto and Adashino’s quieter bamboo; skip the central bamboo crush.", "לחמישה נוסעים להשתמש בשתי מוניות רגילות או לאשר רכב גדול; לדלג על המקדש האופציונלי אם עייפים. משם ללכת בירידה דרך Saga-Toriimoto והבמבוק השקט של אדאשינו; לדלג על עומס חורשת הבמבוק המרכזית.")]
    ],
    callout: ["warning",B("Book at midnight JST on 15 September. Reserve the boat about one hour after the trolley departure; the official example pairs 09:02 with the 10:00 boat. Both services can change or cancel in bad weather.", "להזמין בחצות שעון יפן ב-15 בספטמבר. להזמין את הסירה כשעה אחרי יציאת הרכבת; הדוגמה הרשמית מחברת 09:02 עם סירה ב-10:00. שני השירותים עלולים להשתנות או להתבטל במזג אוויר גרוע.")],
    links: [[B("Sagano tickets", "כרטיסי סאגאנו"),"https://www.sagano-kanko.co.jp/en/ticket/"],[B("Hozugawa reservations", "הזמנת הוזוגאווה"),"https://www.hozugawakudari.jp/tickets/reservation"],[B("Otagi Nenbutsu-ji", "Otagi Nenbutsu-ji"),MAP("Otagi Nenbutsuji")]],
    photo: { src: "assets/sagano-train.webp", alt: B("Sagano Romantic Train at Torokko Kameoka Station", "רכבת סאגאנו הרומנטית בתחנת Torokko Kameoka"), credit: "Streetdeck · CC BY-SA 4.0", url: "https://commons.wikimedia.org/wiki/File:Sagano_Romantic_Train.jpg" }
  },
  {
    id: "oct16", date: "2026-10-16", segment: "kyoto", icon: "⛩", pace: "moderate",
    title: B("Fushimi: torii, wagashi, and water", "פושימי: טוריאי, ואגאשי ומים"),
    subtitle: B("Dawn gates · make Japanese sweets · canal district", "שערים עם שחר · הכנת ממתקים יפניים · רובע התעלות"),
    tags: [["reservationNeeded","red"], ["moderate","amber"]],
    schedule: [
      ["06:45","⛩",B("Fushimi Inari to Yotsutsuji", "פושימי אינארי עד Yotsutsuji"),B("Walk to the city-view junction and back in about 75–90 minutes. There is no need to summit.", "ללכת עד צומת התצפית ולחזור בכ-75–90 דקות. אין צורך להגיע לפסגה.")],
      ["08:45","🍙",B("Breakfast after the descent", "ארוחת בוקר אחרי הירידה"),B("Stay near Fushimi Inari instead of riding away; the recommended studio is in Fukakusa and works naturally after the shrine.", "להישאר ליד פושימי אינארי במקום לנסוע; הסטודיו המומלץ נמצא בפוקאקוסה ומשתלב טבעית אחרי המקדש.")],
      ["10:00–12:00","🍡",B("Recommended: Fushimi-Inari wagashi class", "מומלץ: סדנת ואגאשי ליד פושימי אינארי"),B("Provisional two-hour planning block, subject to iroHa confirming the actual 16 October slot, English instruction, all five participants and ingredients. Age 6+ is published; do not treat capacity, recipe count or dietary adaptations as confirmed.", "חלון תכנון זמני של שעתיים, בכפוף לאישור iroHa לשעה ב-16 באוקטובר, הדרכה באנגלית, כל החמישה ומרכיבים. גיל 6 ומעלה מפורסם; אין לראות בקיבולת, מספר המתכונים או התאמות המזון פרטים מאושרים.")],
      ["12:30–14:30","💧",B("Canals, Teradaya exterior, and Gekkeikan", "תעלות, חזית Teradaya ו-Gekkeikan"),B("Continue south toward Fushimi-Momoyama / Chushojima. Frame the district through spring water and river logistics—not as an alcohol day.", "להמשיך דרומה לכיוון פושימי־מומויאמה / צ׳ושוג׳ימה. להציג את הרובע דרך מי המעיין ולוגיסטיקת הנהר — לא כיום אלכוהול.")],
      ["14:30","🍱",B("Late lunch + covered shopping street", "ארוחה מאוחרת + רחוב קניות מקורה"),B("Keep this flexible after the sweets. If no wagashi slot is available, use the original relaxed canal morning and eat earlier.", "להשאיר גמיש אחרי הממתקים. אם אין מקום בסדנת ואגאשי, לבצע את בוקר התעלות הרגוע המקורי ולאכול מוקדם יותר.")]
    ],
    choice: {
      key: "oct16",
      options: [
        { id:"wagashi", title:B("Full wagashi workshop", "סדנת ואגאשי מלאה"), desc:B("iroHa states age 6+. Request all five places, English instruction, exact duration and ingredient adaptations directly. Budget about two hours only as an estimate until the host confirms the slot; a short tea visit or canal walk is the fallback.", "iroHa מציין גיל 6 ומעלה. לבקש ישירות חמישה מקומות, הדרכה באנגלית, משך מדויק והתאמות מרכיבים. להקצות כשעתיים כהערכה בלבד עד לאישור השעה; ביקור תה קצר או הליכה בתעלות הם החלופה."), meta:B("2h · timed · all five", "שעתיים · שעה קבועה · כל החמישה"), facts:[B("Hands-on 5/5","מעשי 5/5"),B("Route fit 5/5","התאמת מסלול 5/5"),B("Crowd very low","עומס נמוך מאוד"),B("Rain-proof","חסין גשם")], rec:true },
        { id:"tea", title:B("Short matcha ceremony", "טקס מאצ׳ה קצר"), desc:B("A 20–30 minute English session one minute from Keihan Fushimi-Inari. The safe fallback if the two-hour class is full or the family wants more canal time.", "מפגש באנגלית של 20–30 דקות, דקה מתחנת Keihan Fushimi-Inari. החלופה הבטוחה אם הסדנה המלאה או אם המשפחה רוצה יותר זמן בתעלות."), meta:B("20–30m · easy fallback", "20–30 דקות · חלופה קלה"), facts:[B("Hands-on 2/5","מעשי 2/5"),B("Route fit 5/5","התאמת מסלול 5/5"),B("Effort gentle","מאמץ קל"),B("Age fit 5/5","התאמת גיל 5/5")] },
        { id:"canals", title:B("Original slow Fushimi day", "יום פושימי הרגוע המקורי"), desc:B("Keep breakfast, canals, Gekkeikan, and the shopping street without a paid class. Best if energy or budget says no.", "לשמור על ארוחת הבוקר, התעלות, Gekkeikan ורחוב הקניות בלי סדנה בתשלום. הכי טוב אם האנרגיה או התקציב אומרים לא."), meta:B("No timed booking · gentle", "ללא הזמנה לשעה · קל"), facts:[B("Hands-on 1/5","מעשי 1/5"),B("Flexibility 5/5","גמישות 5/5"),B("Cost low","עלות נמוכה"),B("Weather mixed","מזג אוויר מעורב")] }
      ]
    },
    callout: ["warning",B("Do not book from the headline alone. First confirm a five-person 16 October slot, the cancellation terms, and that the actual sweets contain no shellfish-derived ingredients or other restricted items. Jukkokubune remains event-only unless an official public sailing appears.", "לא להזמין לפי הכותרת בלבד. קודם לאשר מקום לחמישה ב-16 באוקטובר, תנאי ביטול, ושהממתקים בפועל אינם מכילים מרכיבים שמקורם בפירות ים או מרכיבים מוגבלים אחרים. Jukkokubune נשארת פעילות אירוע בלבד אלא אם תפורסם הפלגה ציבורית רשמית.")],
    links: [[B("Klook wagashi class", "סדנת ואגאשי ב-Klook"),"https://www.klook.com/en-AU/activity/111279-fushimiinari-wagashi-japanese-sweets-cooking-class-in-kyoto/"],[B("Studio information", "מידע מהסטודיו"),"https://iroha-cooking-kyoto.my.canva.site/"],[B("Short tea fallback", "חלופת טקס תה קצר"),"https://matcha-tia.com/shop/fushimiinari"],[B("Fushimi hidden gems", "פניני פושימי"),"https://kyoto.travel/en/hidden-gems/hidden-gems-of-kyoto-fushimi/"],[B("2026 boat operation", "הפעלת הסירה ב-2026"),"https://kyoto-fushimi.or.jp/fune/unkou/"],[B("Gekkeikan Museum", "מוזיאון Gekkeikan"),"https://www.gekkeikan.com/museum/"]]
  },
  {
    id: "oct17", date: "2026-10-17", segment: "kyoto", icon: "🥾", pace: "demanding",
    title: B("Kurama to Kibune ridge", "רכס מקוראמה לקיבונה"),
    subtitle: B("Ancient cedar roots with an honest fitness gate", "שורשי ארז עתיקים עם שער כושר אמיתי"),
    tags: [["demanding","red"], ["weatherPlan","amber"]],
    schedule: [
      ["07:45","🚃",B("Kyoto → Tofukuji → Demachiyanagi → Kurama", "קיוטו ← טופוקוג׳י ← דמאצ׳יאנאגי ← קוראמה"),B("The efficient chain is JR, Keihan, then Eizan. The last scenic leg is about 30 minutes.", "הרצף היעיל הוא JR, קייהאן ואז אייזאן. הקטע הנופי האחרון כ-30 דקות.")],
      ["09:30","⛩",B("Kurama-dera ascent", "עלייה לקוראמה־דרה"),B("Use the short cable segment if knees or energy demand it; verify the small fare on site.", "להשתמש במקטע הרכבל הקצר אם הברכיים או האנרגיה דורשות; לבדוק את המחיר הקטן במקום.")],
      ["10:30–13:00","🥾",B("Forest ridge to Kibune", "רכס היער לקיבונה"),B("The route is 3.9 km and commonly takes 2–3 hours. Expect stone steps, roots, handrails, and sustained up/down movement; the high point is roughly 570 m, with about 300 m of climbing from Kurama village as a planning estimate.", "המסלול 3.9 ק״מ ולרוב נמשך 2–3 שעות. לצפות למדרגות אבן, שורשים, מעקות ועליות/ירידות מתמשכות; הנקודה הגבוהה סביב 570 מ׳, עם כ-300 מ׳ טיפוס מכפר קוראמה כהערכת תכנון.")],
      ["13:15","⛩",B("Kifune Shrine + indoor lunch", "מקדש קיפונה + ארוחה בפנים"),B("October is beyond typical kawadoko season; reserve an indoor meal only if the menu handles the family restrictions.", "אוקטובר אחרי עונת הקוואדוקו הרגילה; להזמין ארוחה בפנים רק אם התפריט מתאים למגבלות המשפחה.")],
      ["15:30","🚌",B("Bus 33 to Kibuneguchi, Eizan back", "אוטובוס 33 לקיבונגוצ׳י, אייזאן חזרה"),B("Do not hike the ridge in heavy rain. Wet roots change the risk, not just the mood.", "לא לטייל ברכס בגשם כבד. שורשים רטובים משנים את הסיכון, לא רק את האווירה.")]
    ],
    callout: ["warning",B("Family gate: appropriate only if all five are comfortable with 2–3 hours of steep rooted/stone trail. Wet-weather fallback: Eizan to Kibune by transit, shrine and river walk, then return the same way.", "שער משפחתי: מתאים רק אם כל החמישה נוחים עם 2–3 שעות בשביל תלול עם שורשים ואבנים. חלופת גשם: אייזאן ותחבורה לקיבונה, מקדש והליכה בנהר, וחזרה באותה דרך.")],
    links: [[B("Kurama area guide", "מדריך אזור קוראמה"),"https://www.japan.travel/en/destinations/kansai/kyoto/kurama-area/"],[B("Comfortable access", "גישה נוחה"),"https://kyoto.travel/en/getting-around/comfortable-access-to-kurama-kibune/"],[B("Kurama trail start", "תחילת שביל קוראמה"),MAP("Kurama Station Kyoto")]]
  },
  {
    id: "oct18", date: "2026-10-18", segment: "finale", icon: "🏮", pace: "demanding",
    title: B("Kyoto → Tokyo → Kawagoe Festival", "קיוטו ← טוקיו ← פסטיבל קוואגואה"),
    subtitle: B("Confirmed festival date; demanding choreography", "תאריך פסטיבל מאומת; כוריאוגרפיה מאתגרת"),
    tags: [["verified","green"], ["demanding","red"]],
    schedule: [
      ["08:30","🚅",B("Nozomi Kyoto → Tokyo / Shinagawa", "Nozomi מקיוטו לטוקיו / שינאגאווה"),B("Nozomi is the faster, more frequent choice for this leg. Reserve E-side seats for the Mt Fuji side and oversized-baggage seats if needed.", "Nozomi מהירה ותכופה יותר במקטע הזה. להזמין מושבי E לצד הר פוג׳י ומושבי מזוודה גדולה אם צריך.")],
      ["11:15–12:30","🧳",B("Drop bags before the festival", "הורדת מזוודות לפני הפסטיבל"),B("Do not leave luggage at Kumihimo no Ma unless the host explicitly confirms access/receipt. Station lockers are a fallback, not a guaranteed five-bag solution.", "לא להשאיר מזוודות ב-Kumihimo no Ma אלא אם המארח אישר גישה/קבלה. לוקרים בתחנה הם חלופה, לא פתרון מובטח לחמש מזוודות.")],
      ["13:30","🚃",B("Shinjuku area → Kawagoe", "אזור שינג׳וקו ← קוואגואה"),B("Aim to reach the warehouse district around 15:00–15:30 before the strongest evening crowd.", "לכוון להגיע לרובע המחסנים סביב 15:00–15:30 לפני עומס הערב החזק.")],
      ["15:30–20:00","🏮",B("Kawagoe Festival, second day", "פסטיבל קוואגואה, היום השני"),B("The 2026 festival is officially dated 17–18 October. Exact float routes and hikkawase timetable should be downloaded when the 2026 program is posted.", "פסטיבל 2026 נקבע רשמית ל-17–18 באוקטובר. את מסלולי העגלות ולוח hikkawase יש להוריד כשהתכנית ל-2026 תתפרסם.")],
      ["20:00","🚃",B("Return before total exhaustion", "חזרה לפני תשישות מוחלטת"),B("Pick one evening clash zone and leave. Tomorrow is the birthday.", "לבחור אזור התמודדות ערב אחד ולעזוב. מחר יום ההולדת.")]
    ],
    callout: ["warning",B("This is feasible but aggressive. If the Kyoto departure slips, protect the bag drop and arrive Kawagoe later; never carry luggage through the festival crowd.", "זה אפשרי אך תובעני. אם היציאה מקיוטו מתאחרת, לשמור על הורדת המזוודות ולהגיע לקוואגואה מאוחר יותר; לעולם לא לשאת מזוודות בתוך עומס הפסטיבל.")],
    links: [[B("Kawagoe 2026 dates", "תאריכי קוואגואה 2026"),"https://www.koedo.or.jp/en/event/"],[B("Festival program", "תכנית הפסטיבל"),"https://kawagoematsuri.jp/download/"],[B("Kawagoe old town", "העיר העתיקה קוואגואה"),MAP("Kawagoe Ichibangai")]],
    photo: { src: "assets/kawagoe-festival.webp", alt: B("Illuminated float at Kawagoe Festival", "עגלה מוארת בפסטיבל קוואגואה"), credit: "Saitou.h · CC BY-SA / GFDL", url: "https://commons.wikimedia.org/wiki/File:A_float_in_Kawagoe_Festival.JPG" }
  },
  {
    id: "oct19", date: "2026-10-19", segment: "finale", icon: "🎂", pace: "moderate",
    title: B("Gilad turns 50: choose the story", "גלעד בן 50: בוחרים את הסיפור"),
    subtitle: B("Six family experiences, one strong recommendation", "שש חוויות משפחתיות, המלצה חזקה אחת"),
    tags: [["reservationNeeded","red"], ["landmark","blue"]],
    schedule: [
      ["09:00","🎂",B("Slow birthday breakfast", "ארוחת בוקר רגועה של יום הולדת"),B("Read the family notes and reveal the chosen plan. Avoid a dawn departure after Kawagoe.", "לקרוא את ברכות המשפחה ולחשוף את התכנית שנבחרה. להימנע מיציאה עם שחר אחרי קוואגואה.")],
      ["10:30–17:00","🌟",B("Run one headline experience", "לבצע חוויית כותרת אחת"),B("The strongest match is the G-Cans underground flood-control tour—if an October 19 slot and workable language support are confirmed.", "ההתאמה החזקה ביותר היא סיור G-Cans במערכת בקרת השיטפונות התת־קרקעית — אם מאושר מקום ב-19 באוקטובר ותמיכת שפה מתאימה.")],
      ["19:00","🎤",B("Family championship + celebratory dinner", "אליפות משפחתית + ארוחת חגיגה"),B("Private karaoke, arcade, or a small competition creates a shared ending. Book a restaurant only after confirming the food restrictions.", "קריוקי פרטי, ארקייד או תחרות קטנה יוצרים סיום משותף. להזמין מסעדה רק אחרי אישור מגבלות המזון.")]
    ],
    choice: {
      key: "oct19",
      options: [
        { id: "gcans", title: B("G-Cans underground temple + family final", "מקדש G-Cans התת־קרקעי + גמר משפחתי"), desc: B("Rare, enormous water infrastructure with a cinematic scale—most personal to Gilad’s interests. Reservation, safety rules, weather operation, and language support must be confirmed.", "תשתית מים נדירה ועצומה בקנה מידה קולנועי — הכי אישי לתחומי העניין של גלעד. חובה לאשר הזמנה, כללי בטיחות, הפעלה לפי מזג אוויר ותמיכת שפה."), meta: B("Strongest fit · 5–7h incl. travel", "ההתאמה החזקה ביותר · 5–7 שעות כולל נסיעה"), facts:[B("Wow 5/5","וואו 5/5"),B("Cost: tour + rail","עלות: סיור + רכבת"),B("Book required","חובה להזמין"),B("Weather/operations","מזג אוויר/תפעול"),B("Age fit 4/5","התאמת גיל 4/5"),B("Downside: conditional","חיסרון: מותנה")], rec: true },
        { id: "joypolis-bday", title: B("Joypolis birthday + bay night", "יום הולדת בג׳ויפוליס + לילה במפרץ"), desc: B("Immediate family fun, indoor reliability, and an official birthday-ticket pathway.", "כיף משפחתי מיידי, אמינות של פעילות מקורה ומסלול כרטיס יום הולדת רשמי."), meta: B("adult passport ¥6,000 · 4–6h", "כרטיס מבוגר 6,000¥ · 4–6 שעות"), facts:[B("Wow 4/5","וואו 4/5"),B("Booking easy","הזמנה קלה"),B("Indoor","בפנים"),B("Age fit 5/5","התאמת גיל 5/5"),B("Effort easy","מאמץ קל"),B("Downside: noisy","חיסרון: רועש")] },
        { id: "warner-bday", title: B("Warner Bros Studio Tour", "סיור אולפני וורנר"), desc: B("A polished, memory-rich shared world if the family loves Harry Potter.", "עולם משותף, מלוטש ועשיר בזיכרונות אם המשפחה אוהבת הארי פוטר."), meta: B("from ¥6,600 adult · 4–5h", "מ-6,600¥ למבוגר · 4–5 שעות"), facts:[B("Wow 5/5 for fans","וואו 5/5 למעריצים"),B("Book required","חובה להזמין"),B("Indoor","בפנים"),B("Age fit 4/5","התאמת גיל 4/5"),B("Effort easy","מאמץ קל"),B("Downside: fandom","חיסרון: תלוי אהדה")] },
        { id: "water-miniatures", title: B("Tokyo water arc + Small Worlds", "קשת המים של טוקיו + Small Worlds"), desc: B("Asakusa water bus, bay views, miniature engineering, then a celebratory meal.", "אוטובוס מים מאסקוסה, נופי מפרץ, הנדסה מיניאטורית ואז ארוחת חגיגה."), meta: B("about ¥5,200 adult · 5–6h", "כ-5,200¥ למבוגר · 5–6 שעות"), facts:[B("Wow 4/5","וואו 4/5"),B("Booking easy","הזמנה קלה"),B("Weather-sensitive","תלוי מזג אוויר"),B("Age fit 4/5","התאמת גיל 4/5"),B("Effort moderate","מאמץ בינוני"),B("Downside: less singular","חיסרון: פחות ייחודי")] },
        { id: "mystery-circus", title: B("Tokyo Mystery Circus team escape", "בריחה קבוצתית ב-Tokyo Mystery Circus"), desc: B("Choose a currently listed English-supported game in Shinjuku and solve it as a family; reserve a private/group ticket if you want only the five of you.", "לבחור משחק עדכני עם תמיכה באנגלית בשינג׳וקו ולפתור אותו כמשפחה; להזמין כרטיס פרטי/קבוצתי אם רוצים רק את החמישה."), meta: B("from about ¥3,700 pp · 1–2h", "מכ-3,700¥ לאדם · 1–2 שעות"), facts:[B("Wow 4/5","וואו 4/5"),B("Book group ticket","להזמין כרטיס קבוצה"),B("Indoor","בפנים"),B("Age fit 5/5","התאמת גיל 5/5"),B("Effort mental","מאמץ מחשבתי"),B("Downside: language","חיסרון: שפה")] },
        { id: "taiko", title: B("Private taiko / craft workshop + karaoke", "סדנת טאיקו / אומנות פרטית + קריוקי"), desc: B("Participatory and personal, but requires a quote and a provider vetted for English-family instruction.", "משתף ואישי, אך דורש הצעת מחיר ומפעיל שנבדק להדרכה משפחתית באנגלית."), meta: B("quote required · 4–6h", "נדרשת הצעה · 4–6 שעות"), facts:[B("Wow 4/5","וואו 4/5"),B("Cost: quote","עלות: הצעה"),B("Private booking","הזמנה פרטית"),B("Indoor","בפנים"),B("Age fit 5/5","התאמת גיל 5/5"),B("Downside: sourcing","חיסרון: מציאת ספק")] }
      ]
    },
    callout: ["warning",B("Recommendation is conditional, not fake certainty: G-Cans tours may be suspended for flood-control operations and some courses involve stairs, helmets, and Japanese safety instructions. If those checks fail, choose Joypolis + bay night.", "ההמלצה מותנית ולא ודאות מדומה: סיורי G-Cans עלולים להתבטל לצורך בקרת שיטפונות וחלקם כוללים מדרגות, קסדות והנחיות בטיחות ביפנית. אם הבדיקות נכשלות, לבחור ג׳ויפוליס + ערב במפרץ.")],
    links: [[B("G-Cans official tours", "סיורי G-Cans רשמיים"),"https://gaikaku.jp/"],[B("Joypolis", "ג׳ויפוליס"),"https://tokyo-joypolis.com/language/english/"],[B("Tokyo Mystery Circus", "Tokyo Mystery Circus"),"https://mysterycircus.jp/en"]]
  },
  {
    id: "oct20", date: "2026-10-20", segment: "finale", icon: "✈️", pace: "gentle",
    title: B("One last Tokyo morning, then home", "בוקר אחרון בטוקיו ואז הביתה"),
    subtitle: B("LY076 · Narita T1 · arrive early and calm", "LY076 · נריטה T1 · להגיע מוקדם וברוגע"),
    tags: [["verified","green"], ["gentle","blue"]],
    schedule: [
      ["10:00","🧳",B("Check out and place luggage safely", "צ׳ק־אאוט ואחסון בטוח של המזוודות"),B("Use host storage only if explicitly confirmed. Otherwise locate or reserve staffed left-luggage near Shinjuku; do not expect five large station lockers to be free.", "להשתמש באחסון אצל המארח רק אם אושר במפורש. אחרת לאתר או להזמין שמירת חפצים מאוישת ליד שינג׳וקו; לא לצפות לחמישה לוקרים גדולים פנויים.")],
      ["10:30–11:30","👣",B("One last local Tokyo loop", "סיבוב טוקיו מקומי אחרון"),B("Choose Yoyogi, a stationery stop, or a short Shinjuku walk. Keep it within one direct ride of the bags.", "לבחור ביויוגי, חנות כלי כתיבה או הליכת שינג׳וקו קצרה. להישאר במרחק נסיעה ישירה אחת מהמזוודות.")],
      ["11:45","🍱",B("Early final lunch", "ארוחת צהריים אחרונה מוקדמת"),B("Use a known, easy menu rather than a destination restaurant; leave buffer for retrieving bags.", "לבחור תפריט מוכר ופשוט במקום מסעדת יעד; להשאיר מרווח לאיסוף המזוודות.")],
      ["12:30","🧳",B("Retrieve bags + transfer to Shinjuku", "איסוף מזוודות + מעבר לשינג׳וקו"),B("Allow 45–60 minutes to collect bags and reach the platform. Five travelers plus luggage usually need two ordinary taxis or a prebooked large vehicle; confirm capacity. Pick the exact N’EX only after the storage address is settled.", "להקצות 45–60 דקות לאיסוף תיקים והגעה לרציף. חמישה נוסעים עם מזוודות זקוקים בדרך כלל לשתי מוניות רגילות או לרכב גדול מוזמן; לאשר קיבולת. לבחור N’EX מדויקת רק אחרי קביעת כתובת האחסון.")],
      ["13:30–14:00","🚆",B("Reserved N’EX to Narita T1", "N’EX שמורה לנריטה T1"),B("Target Narita T1 by 15:35, about four hours before the supplied LY076 19:35. This is a planning window, not a verified train departure. Follow current EL AL/ticket instructions if earlier; allow more time if collecting forwarded bags.", "יעד נריטה T1 עד 15:35, כארבע שעות לפני LY076 שנמסרה ל-19:35. זהו חלון תכנון, לא יציאת רכבת מאומתת. לפעול לפי הנחיות אל על/הכרטיס אם מוקדמות יותר; להוסיף זמן לאיסוף מזוודות שנשלחו.")],
      ["19:35","✈️",B("LY076 departs NRT T1", "LY076 ממריאה מנריטה T1"),B("Scheduled arrival in Tel Aviv: 02:20 on 21 October.", "נחיתה מתוכננת בתל אביב: 02:20 ב-21 באוקטובר.")]
    ],
    callout: ["info",B("N’EX is cleaner than Skyliner from this west-Tokyo base. Airport luggage delivery works only if arranged by the provider cutoff—often two or more days ahead—with a confirmed airport collection counter. Otherwise carry the bags. Use EL AL’s official check-in with the applicable PNR; never put booking codes in shared URLs.", "N’EX נקייה יותר מ-Skyliner מהבסיס במערב טוקיו. משלוח מזוודות לשדה מתאים רק אם מסודר עד מועד הספק — לעיתים יומיים או יותר מראש — ועם דלפק איסוף מאושר בשדה. אחרת לקחת את המזוודות. להשתמש בצ׳ק־אין הרשמי של אל על עם ה-PNR המתאים ולעולם לא לשים קודי הזמנה בקישורים משותפים.")],
    links: [[B("EL AL check-in", "צ׳ק־אין אל על"),"https://www.elal.com/Checkin/Home/new_Identification/b?language=Eng"],[B("Narita rail access", "רכבת לנריטה"),"https://www.narita-airport.jp/en/access/train/"],[B("N’EX tickets", "כרטיסי N’EX"),"https://www.jreast.co.jp/en/multi/nex/tickets/"]]
  }
];

const dayRoutes = {
  sep29: ["Narita Airport Terminal 1", "Shibuya Station", [], "transit"],
  sep30: ["39-1 Motoyoyogicho Tokyo", "Yoyogi-Uehara Station", ["Yoyogi Park Cycling Center"], "walking"],
  oct01: ["Tokyo Waterworks Historical Museum", "Inokashira Park", [], "transit"],
  oct02: ["Nezu Museum", "Cat Street Harajuku", [], "walking"],
  oct03: ["21_21 Design Sight", "Meiji Jingu Gaien", [], "walking"],
  oct04: ["Meiji Jingu", "Daikanyama T-Site", ["Yoyogi Park Harajuku Entrance"], "transit"],
  oct05: ["Yoyogi-Uehara Station", "21_21 DESIGN SIGHT", [], "transit"],
  oct06: ["Yoyogi-Uehara Station", "Narita Airport Terminal 1 International Arrivals", [], "transit"],
  oct07: ["Yoyogi-Uehara Station", "Kiyosumi Gardens", ["Nezu Shrine","Yanaka Ginza","Fukagawa Fudodo"], "transit"],
  oct08: ["A PIT Autobacs Shinonome", "Liberty Walk Tokyo", ["Nissan Crossing"], "transit"],
  oct09: ["Yoyogi-Uehara Station", "Kamakura Station", ["Katase-Enoshima Station","Kotoku-in Great Buddha"], "transit"],
  oct10: ["Yoyogi-Uehara Station", "Cooking Sun Tokyo", ["TAIKO-LAB Aoyama","Shinanomachi Station"], "transit"],
  oct11: ["Yoyogi-Uehara Station", "Laforet Ito Onsen Yunoniwa", ["Meiji Jingu","Shibuya Station","Ito Station"], "transit"],
  oct12: ["Ito Station", "Ito Station", ["Kadowaki Suspension Bridge","Mount Omuro"], "driving"],
  oct13: ["Laforet Ito Onsen Yunoniwa", "Laforet Ito Onsen Yunoniwa", ["Tokaikan Ito"], "walking"],
  oct14: ["Ito Station", "The Besso Soso Kyoto", ["Atami Station","Kyoto Station","teamLab Biovortex Kyoto"], "transit"],
  oct15: ["The Besso Soso Kyoto", "The Besso Soso Kyoto", ["Torokko Saga Station","Hozugawa River Boat Ride","Otagi Nenbutsuji"], "transit"],
  oct16: ["The Besso Soso Kyoto", "The Besso Soso Kyoto", ["Fushimi Inari Taisha","38-4 Fukakusa Watamoricho","Gekkeikan Okura Sake Museum","Teradaya"], "transit"],
  oct17: ["The Besso Soso Kyoto", "The Besso Soso Kyoto", ["Kurama Station","Kurama-dera","Kifune Shrine","Kibuneguchi Station"], "transit"],
  oct18: ["Kyoto Station", "Kawagoe Ichibangai", ["Tokyo Station","Honmachi Shibuya Tokyo"], "transit"],
  oct19: ["Honmachi Shibuya Tokyo", "Shinjuku Station", ["Metropolitan Area Outer Underground Discharge Channel Ryukyukan"], "transit"],
  oct20: ["Honmachi Shibuya Tokyo", "Narita Airport Terminal 1", ["Shinjuku Station"], "transit"]
};

const photoQueries = {
  sep29:"Narita Airport Terminal 1 Japan", sep30:"Moto Yoyogi Yoyogi Park Tokyo", oct01:"Tokyo Waterworks Historical Museum Inokashira Park", oct02:"Aoyama Nezu Museum architecture Harajuku", oct03:"21_21 Design Sight Meiji Jingu Gaien", oct04:"Meiji Jingu Yoyogi Park Sunday", oct05:"Yoyogi Uehara Tokyo neighborhood", oct06:"Narita Airport Terminal 1 arrivals", oct07:"Nezu Shrine Yanaka Fukagawa Fudodo Kiyosumi", oct08:"A PIT Autobacs Shinonome Nissan Crossing Liberty Walk Tokyo", oct09:"New Enoshima Aquarium jellyfish Kamakura Great Buddha", oct10:"Tokyo taiko drumming sushi cooking class family", oct11:"Saphir Odoriko Ito", oct12:"Jogasaki Coast Mount Omuro road trip", oct13:"Ito Tokaikan onsen", oct14:"Atami Shinkansen Kyoto teamLab Biovortex", oct15:"Sagano Romantic Train Hozugawa Otagi Nenbutsuji", oct16:"Fushimi Inari wagashi cooking class canals Kyoto", oct17:"Kurama Kibune trail Kyoto", oct18:"Kawagoe Festival floats night", oct19:"G-Cans underground discharge channel Japan", oct20:"Narita Express Terminal 1"
};

const regionMaps = [
  { icon:"日", title:B("Whole trip · Japan","כל הטיול · יפן"), text:B("Tokyo → Ito/Izu → Kyoto → Tokyo, with the airport legs visible.","טוקיו ← איטו/איזו ← קיוטו ← טוקיו, כולל קטעי שדה התעופה."), route:["Narita Airport Terminal 1","Narita Airport Terminal 1",["Tokyo","Ito Shizuoka","Kyoto"],"transit"] },
  { icon:"東", title:B("Tokyo master map","מפת האב של טוקיו"), text:B("Nostalgia, family base, old Tokyo, JDM, shopping, bay, and final stay.","נוסטלגיה, בסיס משפחתי, טוקיו הישנה, JDM, קניות, מפרץ ולינה אחרונה."), route:["Motoyoyogicho Tokyo","Odaiba Tokyo",["Nezu Shrine","Fukagawa Fudodo","A PIT Autobacs Shinonome","Shibuya"],"transit"] },
  { icon:"伊", title:B("Izu master map","מפת האב של איזו"), text:B("Ito base, the recommended one-day drive to Jōgasaki + Mt Ōmuro, and optional Kawazu.","בסיס איטו, הנסיעה המומלצת ליום אחד לג׳וגסאקי + הר אומורו, וקוואזו האופציונלית."), route:["Ito Station","Ito Station",["Kadowaki Suspension Bridge","Mount Omuro"],"driving"] },
  { icon:"京", title:B("Kyoto master map","מפת האב של קיוטו"), text:B("Besso base, Arashiyama, Fushimi, Kurama/Kibune, and Kyoto Station.","בסיס Besso, אראשיאמה, פושימי, קוראמה/קיבונה ותחנת קיוטו."), route:["Kyoto Station","Kifune Shrine",["The Besso Soso Kyoto","Otagi Nenbutsuji","Fushimi Inari Taisha","Kurama Station"],"transit"] }
];

const stays = [
  {
    id: "urban-retreat", icon: "🏠", status: B("Confirmed family base", "בסיס משפחתי מאושר"),
    name: "Shibuya Urban Retreat", dates: B("6–11 Oct · 5 nights", "6–11 באוקטובר · 5 לילות"),
    address: "Nishihara 3-20-5, Shibuya-ku, Tokyo", station: B("Yoyogi-Uehara · about 1 minute", "יויוגי־אוהארה · כדקה"),
    confirmation: "••••", phone: "+81 3-3431-6286",
    cancellation: B("Prototype record: free cancellation to 21 Sep, 23:59 local. Recheck in Booking.com before relying on it.", "לפי הרישום באפליקציה הישנה: ביטול חינם עד 21 בספטמבר 23:59 מקומי. לבדוק שוב ב-Booking.com לפני הסתמכות."),
    route: B("From Narita: pre-booked private transfer. By rail: N’EX to Shinjuku/Shibuya, then taxi or Odakyu/Chiyoda connection.", "מנריטה: הסעה פרטית מוזמנת. ברכבת: N’EX לשינג׳וקו/שיבויה, ואז מונית או חיבור אודקיו/צ׳יודה."),
    luggage: B("Ask the host whether Gilad may leave bags before check-in on 6 Oct and whether a courier pickup can be received on 10 Oct.", "לשאול את המארח האם גלעד יכול להשאיר מזוודות לפני הצ׳ק־אין ב-6 באוקטובר והאם ניתן לקבל איסוף שליח ב-10 באוקטובר."),
    map: MAP("Nishihara 3-20-5 Shibuya Tokyo")
  },
  {
    id: "laforet", icon: "♨️", status: B("Confirmed · private-bath room", "מאושר · חדר עם אמבט פרטי"),
    name: "Laforet Ito Onsen Yunoniwa", dates: B("11–14 Oct · 3 nights", "11–14 באוקטובר · 3 לילות"),
    address: "2-3-1 Shishido, Ito, Shizuoka", station: B("JR Ito · about 8 minutes on foot", "JR איטו · כ-8 דקות הליכה"),
    confirmation: "••••", phone: "+81 557-37-3133",
    cancellation: B("Open Booking.com for the live policy and charge schedule; the prototype did not preserve a trustworthy deadline.", "לפתוח את Booking.com למדיניות ולוח החיובים העדכניים; באפליקציה הישנה לא נשמר מועד אמין."),
    route: B("Saphir Odoriko 5 from Shibuya to Ito is preferred; taxi is optional with five compact bags.", "העדיפות היא Saphir Odoriko 5 משיבויה לאיטו; מונית היא אפשרות עם חמישה תיקים קטנים."),
    luggage: B("Travel with one three-night bag per person. Email the combined Japanese food card before arrival; ask what can be accommodated at half-board meals.", "לנסוע עם תיק לשלושה לילות לכל אדם. לשלוח מראש את כרטיס האוכל המשולב ביפנית ולשאול מה ניתן להתאים בארוחות חצי הפנסיון."),
    parking: B("Free for hotel guests, about 50 spaces. Before check-in or after checkout only when space is available—ask the hotel. No valet.", "חינם לאורחי המלון, כ-50 מקומות. לפני צ׳ק־אין או אחרי צ׳ק־אאוט רק אם יש מקום — לשאול את המלון. אין שירות חניה."),
    map: MAP("Laforet Ito Onsen Yunoniwa"), official: "https://www.laforet.co.jp/ito/"
  },
  {
    id: "besso", icon: "⛩", status: B("Confirmed Kyoto base", "בסיס קיוטו מאושר"),
    name: "The Besso Soso Kyoto", dates: B("14–18 Oct · 4 nights", "14–18 באוקטובר · 4 לילות"),
    address: B("Use the exact address in the Booking.com voucher", "להשתמש בכתובת המדויקת בשובר Booking.com"), station: B("Confirm from the live property page", "לאשר מעמוד הנכס העדכני"),
    confirmation: "••••", phone: "—",
    cancellation: B("Check the current Booking.com policy; do not reuse an old assumed deadline.", "לבדוק את המדיניות העדכנית ב-Booking.com; לא להשתמש במועד ישן משוער."),
    route: B("From Kyoto Station: use the live property directions, then taxi if five people have luggage.", "מתחנת קיוטו: להשתמש בהוראות הנכס העדכניות ואז מונית אם לחמישה יש מזוודות."),
    luggage: B("Before sending anything from Tokyo, confirm staffed receipt, exact name/address/phone, guest name, and check-in date 14 Oct.", "לפני משלוח מטוקיו, לאשר קבלה מאוישת, שם/כתובת/טלפון מדויקים, שם אורח ותאריך צ׳ק־אין 14 באוקטובר."),
    map: MAP("The Besso Soso Kyoto")
  },
  {
    id: "kumihimo", icon: "🪢", status: B("Confirmed final Tokyo base", "בסיס טוקיו האחרון מאושר"),
    name: "組紐の間 · Kumihimo no Ma", dates: B("18–20 Oct · 2 nights", "18–20 באוקטובר · 2 לילות"),
    address: "Honmachi 2-33-2-415, Shibuya-ku, Tokyo", station: B("Confirm nearest exit with host; Hatagaya/Hatsudai area", "לאשר יציאה קרובה עם המארח; אזור האטאגאיה/האטסודאי"),
    confirmation: "••••", phone: "+81 50-1721-4419",
    cancellation: B("Prototype record: free cancellation to 3 Oct, 23:59. Verify in Booking.com.", "לפי הרישום באפליקציה הישנה: ביטול חינם עד 3 באוקטובר 23:59. לבדוק ב-Booking.com."),
    route: B("From Tokyo/Shinagawa after the Shinkansen: taxi is the cleanest five-person luggage move.", "מטוקיו/שינאגאווה אחרי השינקנסן: מונית היא מעבר המזוודות הנקי ביותר לחמישה."),
    luggage: B("Assume no Yamato reception unless the host confirms staffed acceptance. Prefer carrying luggage on reserved oversized-baggage Shinkansen seats.", "להניח שאין קבלת Yamato אלא אם המארח מאשר קבלה מאוישת. עדיף לשאת ברכבת עם מושבים שמורים למזוודה גדולה."),
    map: MAP("Honmachi 2-33-2 Shibuya Tokyo")
  }
];

const flights = [
  {
    id: "solo-out", tag: B("Gilad outbound", "גלעד הלוך"), flight: "LY075", from: "TLV", to: "NRT", date: B("28 → 29 Sep", "28 ← 29 בספטמבר"),
    times: "22:45 → 16:20+1", pnr: "••••", seat: "22H", terminal: B("Narita T1", "נריטה T1")
  },
  {
    id: "family-out", tag: B("Family outbound", "המשפחה הלוך"), flight: "LY075", from: "TLV", to: "NRT", date: B("5 → 6 Oct", "5 ← 6 באוקטובר"),
    times: "22:45 → 16:20+1", pnr: "••••", seat: B("Check booking", "לבדוק בהזמנה"), terminal: B("Narita T1", "נריטה T1")
  },
  {
    id: "return", tag: B("All return", "כולם חזור"), flight: "LY076", from: "NRT", to: "TLV", date: B("20 → 21 Oct", "20 ← 21 באוקטובר"),
    times: "19:35 → 02:20+1", pnr: "••••", seat: B("Check booking", "לבדוק בהזמנה"), terminal: B("Narita T1", "נריטה T1")
  }
];

const bookingChannels = [
  {
    icon:"💳", title:B("Local trains, metro & buses", "רכבות מקומיות, מטרו ואוטובוסים"),
    tool:B("Suica / Welcome Suica", "Suica / Welcome Suica"),
    use:B("Tap each person’s own card for ordinary JR, metro, Enoden, and most city buses. This pays the basic fare; it does not reserve a seat.", "להעביר כרטיס נפרד של כל נוסע ברכבות JR רגילות, מטרו, אנודן וברוב האוטובוסים העירוניים. זה משלם את מחיר הנסיעה הבסיסי; זה לא שומר מושב."),
    notFor:B("Not for Saphir rooms or Shinkansen seat booking", "לא לתאי ספיר או להזמנת מושב שינקנסן"),
    links:[[B("Welcome Suica", "Welcome Suica"),"https://www.jreast.co.jp/en/multi/welcomesuica/welcomesuica.html"]]
  },
  {
    icon:"東", title:B("JR East reserved trains", "רכבות שמורות של JR East"),
    tool:B("JR-EAST Train Reservation", "JR-EAST Train Reservation"),
    use:B("Use Purchase tickets—not the pass-only seat-reservation path—for N’EX, regular Odoriko, and Saphir Premium/ordinary Green seats.", "להשתמש ב-Purchase tickets — לא במסלול שמירת מושב לבעלי פאס — עבור N’EX, אודוריקו רגילה ומושבי Premium/Green רגילים בספיר."),
    notFor:B("Saphir private rooms: JR office or reserved-seat machine only", "תאים פרטיים בספיר: רק משרד JR או מכונת מושבים שמורים"),
    links:[[B("Open JR East", "פתיחת JR East"),"https://www.eki-net.com/en/jreast-train-reservation/Top/Index"],[B("Pickup guide", "מדריך איסוף"),"https://www.jreast.co.jp/en/multi/ticket/guide.html"]]
  },
  {
    icon:"🚅", title:B("Tokaido Shinkansen", "שינקנסן טוקאידו"),
    tool:B("SmartEX", "SmartEX"),
    use:B("Book Atami → Kyoto and Kyoto → Tokyo here. Reserve all five together and choose oversized-baggage seats for any bag over 160 cm total dimensions.", "להזמין כאן אטאמי ← קיוטו וקיוטו ← טוקיו. להזמין את כל החמישה יחד ולבחור מושבי מזוודה גדולה לכל תיק שמעל 160 ס״מ בסכום הממדים."),
    notFor:B("Do not look for Saphir in SmartEX", "לא לחפש ספיר ב-SmartEX"),
    links:[[B("Open SmartEX", "פתיחת SmartEX"),"https://smart-ex.jp/en/index.php"]]
  },
  {
    icon:"🚞", title:B("Special sightseeing rides", "נסיעות תיירות מיוחדות"),
    tool:B("Use each operator’s own site", "להשתמש באתר של כל מפעיל"),
    use:B("Sagano Romantic Train and Hozugawa River Boat are separate reservations. Buying one never reserves the other.", "רכבת סאגאנו וסירת נהר הוזוגאווה הן הזמנות נפרדות. קנייה של אחת לעולם אינה מזמינה את השנייה."),
    notFor:B("Keep both confirmations offline", "לשמור את שני האישורים אופליין"),
    links:[[B("Sagano", "סאגאנו"),"https://www.sagano-kanko.co.jp/en/"],[B("Hozugawa boat", "סירת הוזוגאווה"),"https://www.hozugawakudari.jp/en"]]
  },
  {
    icon:"🧭", title:B("Route planning only", "תכנון מסלול בלבד"),
    tool:B("Google Maps + Japan Travel by NAVITIME", "Google Maps + Japan Travel by NAVITIME"),
    use:B("Use these to compare live departures, platforms, walking, and rural connections. Treat the named railway or attraction site as the place that actually sells the reservation.", "להשתמש בהם להשוואת יציאות חיות, רציפים, הליכה וחיבורים כפריים. להתייחס לאתר חברת הרכבת או האטרקציה כמקום שמוכר בפועל את ההזמנה."),
    notFor:B("A route result is not a ticket", "תוצאת מסלול אינה כרטיס"),
    links:[[B("NAVITIME Japan Travel", "NAVITIME Japan Travel"),"https://japantravel.navitime.com/en/"]]
  }
];

const transits = [
  {
    id: "nex-solo", icon: "🚆", date: B("29 Sep", "29 בספטמבר"), route: B("Narita T1 → solo hotel", "נריטה T1 ← מלון הסולו"), window: "17:45–18:30",
    duration: B("75–105 min door-to-door", "75–105 דקות מדלת לדלת"), transfers: B("N’EX + short taxi", "N’EX + מונית קצרה"), fare: B("¥3,330 pp to Shibuya/Shinjuku + taxi", "3,330¥ לאדם לשיבויה/שינג׳וקו + מונית"),
    reservation: B("Reserved seat; buy after landing", "מושב שמור; לקנות אחרי הנחיתה"), sale: B("Same day is fine", "אפשר באותו יום"), seat: B("Aisle for easier luggage exit", "מעבר ליציאה נוחה עם מזוודה"),
    luggage: B("Use end-of-car racks; keep valuables at seat", "מתקני קצה קרון; חפצי ערך ליד המושב"), backup: B("Keisei Skyliner to Nippori, then taxi—only if N’EX disruption makes it better", "Skyliner לניפורי ואז מונית — רק אם שיבוש ב-N’EX הופך זאת לעדיף"),
    station: B("NRT T1 rail station is B1", "תחנת הרכבת של NRT T1 בקומה B1"), buy: "https://www.jreast.co.jp/en/multi/nex/tickets/", map: MAP("Narita Airport Terminal 1 Station")
  },
  {
    id: "narita-reunion", icon: "🚐", date: B("6 Oct", "6 באוקטובר"), route: B("Yoyogi-Uehara → Narita → Nishihara", "יויוגי־אוהארה ← נריטה ← נישיהארה"), window: B("Gilad depart ~13:30 · family lands 16:20", "גלעד יוצא ~13:30 · המשפחה נוחתת 16:20"),
    duration: B("~75–90 min rail out · transfer ~90 min in", "~75–90 דקות ברכבת החוצה · ~90 דקות בהסעה פנימה"), transfers: B("N’EX out; private van home", "N’EX החוצה; ואן פרטי הביתה"), fare: B("Van prepaid/booking record; verify voucher", "ואן לפי ההזמנה; לבדוק שובר"),
    reservation: B("Private transfer ref ••••", "הסעה פרטית ••••"), sale: B("Already booked", "כבר הוזמן"), seat: B("Confirm child/seat needs with provider", "לאשר צרכי מושב עם הספק"),
    luggage: B("Five travellers + flight bags; verify vehicle capacity", "חמישה נוסעים + מזוודות טיסה; לאשר קיבולת רכב"), backup: B("N’EX to Shibuya/Shinjuku + two taxis", "N’EX לשיבויה/שינג׳וקו + שתי מוניות"),
    station: B("Public T1 arrivals lobby; exact driver point from voucher", "אולם נחיתות ציבורי T1; נקודת נהג מדויקת מהשובר"), buy: "https://secure.booking.com/myreservations.html", map: MAP("Narita Airport Terminal 1 International Arrivals")
  },
  {
    id: "enoshima", icon: "🌊", date: B("9 Oct", "9 באוקטובר"), route: B("Yoyogi-Uehara → Enoshima → Kamakura", "יויוגי־אוהארה ← אנושימה ← קמקורה"), window: "07:30–18:30",
    duration: B("70–80 min to Katase-Enoshima", "70–80 דקות ל-Katase-Enoshima"), transfers: B("Usually change at Fujisawa; Enoden onward", "לרוב החלפה בפוג׳יסאווה; המשך באנודן"), fare: B("1-Day Pass price varies by origin; Shinjuku reference ¥1,640 adult", "מחיר כרטיס יומי משתנה לפי מוצא; משינג׳וקו 1,640¥ למבוגר"),
    reservation: B("No train reservation", "אין הזמנת רכבת"), sale: B("Buy at station / EMot", "קנייה בתחנה / EMot"), seat: B("Right/left views vary; sit where available", "הנוף משתנה; לשבת היכן שפנוי"),
    luggage: B("Daypacks only", "תיקי יום בלבד"), backup: B("Skip the caves and start at Hase if late or seas are rough", "לוותר על המערות ולהתחיל בהאסה אם מאוחר או הים סוער"),
    station: B("Katase-Enoshima; Hase; Kamakura", "Katase-Enoshima; האסה; קמקורה"), buy: "https://www.odakyu.jp/english/passes/enoshima_kamakura/", map: MAP("Katase-Enoshima Station")
  },
  {
    id: "saphir", icon: "💎", date: B("11 Oct", "11 באוקטובר"), route: B("Shibuya → Ito · Saphir Odoriko 5", "שיבויה ← איטו · Saphir Odoriko 5"), window: "12:30–14:16",
    duration: "1h 46m", transfers: B("Direct", "ישיר"), fare: B("Tokyo→Ito official reference: private room ¥38,200 for five; Green seat ¥7,080 pp. Check Shibuya quote.", "מחיר ייחוס רשמי מטוקיו לאיטו: תא פרטי 38,200¥ לחמישה; מושב גרין 7,080¥ לאדם. לבדוק מחיר משיבויה."),
    reservation: B("Mandatory; private cabin at JR office/machine only", "חובה; תא פרטי רק במשרד/מכונת JR"), sale: B("On sale since 11 Sep, 10:00 JST", "במכירה מאז 11 בספטמבר 10:00 JST"), seat: B("Private cabin preferred; otherwise left side after Atami for sea", "עדיף תא פרטי; אחרת צד שמאל אחרי אטאמי לים"),
    luggage: B("Three-night bags only; cabin floor space still limited", "רק תיקים לשלושה לילות; גם בתא המקום מוגבל"), backup: B("First check Saphir 1 Tokyo 11:00 → Ito 12:36; then a reserved regular Odoriko", "תחילה לבדוק Saphir 1 מטוקיו 11:00 ← איטו 12:36; ואז Odoriko רגילה שמורה"),
    station: B("Shibuya JR platform; verify live signs", "רציף JR שיבויה; לבדוק שילוט חי"), buy: "https://www.eki-net.com/jreast-train-reservation/Top/Index", map: MAP("Shibuya Station JR")
  },
  {
    id: "izu-local", icon: "🚌", date: B("12–13 Oct", "12–13 באוקטובר"), route: B("Ito ↔ Jōgasaki / Mt Ōmuro / Kawazu", "איטו ↔ ג׳וגסאקי / הר אומורו / קוואזו"), window: B("Morning starts; last return checked nightly", "יציאות בוקר; לבדוק חזרה אחרונה כל ערב"),
    duration: B("Ito→Izu-Kōgen ~25 min; Kawazu Station→falls ~25 min bus", "איטו←איזו־קוגן ~25 דקות; תחנת קוואזו←מפלים ~25 דקות באוטובוס"), transfers: B("Izu Kyūkō + Tokai Bus", "Izu Kyūkō + Tokai Bus"), fare: B("IC/individual fares; compare Izu pass on the day", "IC/מחירים בודדים; להשוות כרטיס איזו ביום הנסיעה"),
    reservation: B("Local trains/buses unreserved", "רכבות/אוטובוסים מקומיים ללא הזמנה"), sale: B("Day of travel", "ביום הנסיעה"), seat: B("Any; stand near exit for short transfers", "כל מושב; להתקרב ליציאה בהחלפות קצרות"),
    luggage: B("Daypacks and rain layers", "תיקי יום ושכבות גשם"), backup: B("Tōkai-kan + hotel onsen", "Tōkai-kan + אונסן במלון"),
    station: B("Photograph the return timetable at each rural stop", "לצלם את לוח החזרה בכל תחנה כפרית"), buy: "https://www.izukyu.co.jp/global_site/en/", map: MAP("Izu-Kogen Station")
  },
  {
    id: "ito-atami", icon: "🚃", date: B("14 Oct", "14 באוקטובר"), route: B("Ito → Atami", "איטו ← אטאמי"), window: B("Target arrival 35–45 min before Hikari", "לכוון להגעה 35–45 דקות לפני Hikari"),
    duration: B("~25 min", "~25 דקות"), transfers: B("One transfer at Atami to Shinkansen", "החלפה אחת באטאמי לשינקנסן"), fare: B("Local JR fare / IC, separate from SmartEX", "תשלום JR מקומי / IC, בנפרד מ-SmartEX"),
    reservation: B("Local unreserved; Hikari reserved separately", "המקומית ללא הזמנה; Hikari מוזמנת בנפרד"), sale: B("Local same day", "מקומית באותו יום"), seat: B("Sit near a door if possible", "לשבת קרוב לדלת אם אפשר"),
    luggage: B("Compact Izu bags; large bags only if Yamato plan failed", "תיקי איזו קטנים; מזוודות גדולות רק אם תכנית Yamato נכשלה"), backup: B("Earlier local train; never use a sub-15-minute connection", "רכבת מקומית מוקדמת יותר; לא להשתמש בחיבור של פחות מ-15 דקות"),
    station: B("Follow Shinkansen transfer gates at Atami", "לעקוב אחרי שערי מעבר לשינקנסן באטאמי"), buy: "https://global.jr-central.co.jp/en/onlinebooking/", map: MAP("Atami Station Shinkansen transfer")
  },
  {
    id: "atami-kyoto", icon: "🚅", date: B("14 Oct", "14 באוקטובר"), route: B("Atami → Kyoto · direct Hikari", "אטאמי ← קיוטו · Hikari ישירה"), window: B("Target 11:30–12:15 departure range", "טווח יציאה יעד 11:30–12:15"),
    duration: B("About 2h 05–2h 20; confirm exact train", "כ-2:05–2:20 שעות; לאשר רכבת מדויקת"), transfers: B("Direct Hikari; Nozomi does not stop Atami", "Hikari ישירה; Nozomi לא עוצרת באטאמי"), fare: B("Dynamic by train/seat; confirm in SmartEX", "משתנה לפי רכבת/מושב; לאשר ב-SmartEX"),
    reservation: B("Reserve all five together", "להזמין את כל החמישה יחד"), sale: B("Regular seats from 10:00 JST one month before; SmartEX may show earlier advance products", "מושבים רגילים מ-10:00 JST חודש מראש; SmartEX עשוי להציג מוצרים מוקדמים יותר"), seat: B("E side for Mt Fuji; choose adjacent seats", "צד E להר פוג׳י; מושבים סמוכים"),
    luggage: B("Any bag over 160 cm total dimensions needs an oversized-baggage seat", "כל תיק מעל 160 ס״מ בסכום הממדים דורש מושב למזוודה גדולה"), backup: B("Kodama/Hikari combination with one extra transfer", "שילוב Kodama/Hikari עם החלפה נוספת"),
    station: B("Atami Shinkansen concourse; platform only from live signs", "אולם שינקנסן אטאמי; רציף רק מהשילוט החי"), buy: "https://global.jr-central.co.jp/en/onlinebooking/", map: MAP("Atami Station")
  },
  {
    id: "arashiyama", icon: "🚞", date: B("15 Oct", "15 באוקטובר"), route: B("Kyoto → Saga → Kameoka → Arashiyama", "קיוטו ← סאגה ← קמאוקה ← אראשיאמה"), window: "07:45–16:30",
    duration: B("Trolley 23 min; bus 10 min; boat about 2h", "רכבת 23 דקות; אוטובוס 10 דקות; סירה כשעתיים"), transfers: B("JR + walk + trolley + bus + boat", "JR + הליכה + רכבת תיירים + אוטובוס + סירה"), fare: B("Trolley fare in booking; bus ¥500 adult; boat ¥6,000 adult", "מחיר רכבת בהזמנה; אוטובוס 500¥ למבוגר; סירה 6,000¥ למבוגר"),
    reservation: B("Trolley and boat both reserved", "הרכבת והסירה שתיהן בהזמנה"), sale: B("Trolley opens 00:00 JST one month before: 15 Sep", "הרכבת נפתחת ב-00:00 JST חודש מראש: 15 בספטמבר"), seat: B("Car 5 Rich only if open-air conditions suit", "קרון 5 Rich רק אם תנאי אוויר פתוח מתאימים"),
    luggage: B("Small daypacks; waterproof valuables", "תיקי יום קטנים; חפצי ערך אטומים למים"), backup: B("JR to Saga + Otagi/Saga-Toriimoto walking day; skip boat", "JR לסאגה + יום הליכה Otagi/Saga-Toriimoto; בלי סירה"),
    station: B("Torokko Kameoka :25 → official bus :35 pattern", "Torokko Kameoka :25 ← אוטובוס רשמי :35"), buy: "https://www.sagano-kanko.co.jp/en/ticket/", map: MAP("Torokko Saga Station")
  },
  {
    id: "kurama", icon: "🌲", date: B("17 Oct", "17 באוקטובר"), route: B("Kyoto → Kurama · Kibune → Kyoto", "קיוטו ← קוראמה · קיבונה ← קיוטו"), window: "07:45–17:00",
    duration: B("~55 min rail each way + 2–3h hike", "~55 דקות רכבת לכל כיוון + 2–3 שעות הליכה"), transfers: B("JR → Keihan → Eizan; bus 33 on return", "JR ← קייהאן ← אייזאן; אוטובוס 33 בחזרה"), fare: B("Pay local fares/IC; small Kurama cable contribution extra", "תשלומים מקומיים/IC; תוספת קטנה לרכבל קוראמה"),
    reservation: B("Trains unreserved; lunch reservation optional", "רכבות ללא הזמנה; ארוחה אופציונלית להזמנה"), sale: B("Day of travel", "ביום הנסיעה"), seat: B("Panorama car if timing aligns—do not wait for it", "קרון פנורמי אם התזמון מתאים — לא לחכות במיוחד"),
    luggage: B("Trail shoes, water, rain shell, light pack", "נעלי שביל, מים, מעיל גשם ותיק קל"), backup: B("Transit to Kibune only; no wet ridge hike", "תחבורה לקיבונה בלבד; ללא רכס רטוב"),
    station: B("Kibune bus 33 → Kibuneguchi → Eizan", "אוטובוס 33 מקיבונה ← קיבונגוצ׳י ← אייזאן"), buy: "https://kyoto.travel/en/getting-around/comfortable-access-to-kurama-kibune/", map: MAP("Kurama Station Kyoto")
  },
  {
    id: "kyoto-tokyo", icon: "🚅", date: B("18 Oct", "18 באוקטובר"), route: B("Kyoto → Tokyo / Shinagawa · Nozomi", "קיוטו ← טוקיו / שינאגאווה · Nozomi"), window: B("Target 08:30 departure", "יציאת יעד 08:30"),
    duration: B("~2h 10m to Tokyo", "~2:10 שעות לטוקיו"), transfers: B("Direct; then taxi to luggage drop", "ישיר; ואז מונית להורדת מזוודות"), fare: B("Confirm current SmartEX fare", "לאשר מחיר עדכני ב-SmartEX"),
    reservation: B("Reserve all five together", "להזמין את כל החמישה יחד"), sale: B("Regular inventory from 10:00 JST on 18 Sep", "מלאי רגיל מ-10:00 JST ב-18 בספטמבר"), seat: B("E side for Mt Fuji", "צד E להר פוג׳י"),
    luggage: B("Reserve oversized-baggage seats for bags over 160 cm total", "להזמין מושבי מזוודה גדולה לתיקים מעל 160 ס״מ בסכום הממדים"), backup: B("Later Nozomi; shorten Kawagoe, not bag safety", "Nozomi מאוחרת יותר; לקצר קוואגואה, לא את בטיחות המזוודות"),
    station: B("Use live departure board for platform", "להשתמש בלוח החי לרציף"), buy: "https://global.jr-central.co.jp/en/onlinebooking/", map: MAP("Kyoto Station Shinkansen")
  },
  {
    id: "nex-return", icon: "✈️", date: B("20 Oct", "20 באוקטובר"), route: B("Kumihimo no Ma → Shinjuku → Narita T1", "Kumihimo no Ma ← שינג׳וקו ← נריטה T1"), window: B("Collect bags ~12:30; target N’EX ~13:30–14:00; choose a train arriving by 15:35", "איסוף תיקים סביב 12:30; יעד N’EX סביב 13:30–14:00; לבחור רכבת שמגיעה עד 15:35"),
    duration: B("~2h door-to-terminal", "~שעתיים מדלת לטרמינל"), transfers: B("Taxi + direct N’EX", "מונית + N’EX ישירה"), fare: B("¥3,330 pp from Shinjuku + taxi", "3,330¥ לאדם משינג׳וקו + מונית"),
    reservation: B("Reserved N’EX; buy/collect ahead", "N’EX שמורה; לקנות/לאסוף מראש"), sale: B("One month ahead or while in Japan", "חודש מראש או במהלך השהות ביפן"), seat: B("Five together if available", "חמישה יחד אם זמין"),
    luggage: B("Use racks; board early enough to load calmly", "להשתמש במתקנים; לעלות מוקדם מספיק לטעינה רגועה"), backup: B("Airport limousine bus only if a nearby stop and luggage capacity are confirmed", "אוטובוס לימוזין לשדה רק אם תחנה קרובה וקיבולת מזוודות מאושרות"),
    station: B("NRT T1 by about 15:35 for supplied LY076 19:35; confirm airline instructions", "NRT T1 עד בערך 15:35 ל-LY076 שנמסרה לשעה 19:35; לאשר הנחיות חברת התעופה"), buy: "https://www.jreast.co.jp/en/multi/nex/tickets/", map: MAP("Shinjuku Station New South Gate Narita Express")
  }
];

const museums = [
  { id:"waterworks", icon:"💧", tags:["solo","water"], name:B("Tokyo Waterworks Historical Museum","המוזיאון ההיסטורי של מערכת המים בטוקיו"), area:B("Hongo · Tokyo","הונגו · טוקיו"), duration:"1.5–2h", price:B("Free","חינם"), closed:B("Fourth Monday (next day if a holiday); year-end closure. Recheck exceptions.", "יום שני הרביעי בחודש (למחרת אם חג); סגירת סוף שנה. לבדוק חריגים."), audience:B("Gilad · systems + urban history","גלעד · מערכות + היסטוריה עירונית"), fit:5, note:B("The single best museum match for the trip’s water-infrastructure thread.","ההתאמה המוזיאלית הטובה ביותר לנושא תשתיות המים בטיול."), official:"https://www.suidorekishi.jp/", map:MAP("Tokyo Waterworks Historical Museum") },
  { id:"rainbow", icon:"🌈", tags:["family","water"], name:B("Tokyo Sewerage Museum ‘Rainbow’","מוזיאון הביוב של טוקיו ‘ריינבו’"), area:B("Ariake · Odaiba","אריאקה · אודאיבה"), duration:"1–1.5h", price:B("Free","חינם"), closed:B("Monday; open 09:30–16:30","יום שני; פתוח 09:30–16:30"), audience:B("Whole family · hands-on infrastructure","כל המשפחה · תשתיות אינטראקטיביות"), fit:5, note:B("Interactive, English tablet support, and easy to pair with Sona Area or Small Worlds.","אינטראקטיבי, תמיכה בטאבלט באנגלית וקל לשלב עם Sona Area או Small Worlds."), official:"https://www.nijinogesuidoukan.jp/en/", map:MAP("Tokyo Sewerage Museum Rainbow") },
  { id:"nezu", icon:"🎋", tags:["solo","design"], name:B("Nezu Museum","מוזיאון נזו"), area:B("Minami-Aoyama · Tokyo","מינאמי־אאויאמה · טוקיו"), duration:"1.5–2.5h", price:B("Varies by exhibition; see official ticket page","משתנה לפי תערוכה; לראות באתר הרשמי"), closed:B("Monday; check exhibition changeovers","יום שני; לבדוק חילופי תערוכות"), audience:B("Gilad solo · architecture + garden","גלעד לבד · אדריכלות + גן"), fit:5, note:B("Kengo Kuma’s approach and the garden make it worthwhile even before the exhibition is considered.","הגישה של קנגו קומה והגן מצדיקים ביקור עוד לפני בחירת התערוכה."), official:"https://www.nezu-muse.or.jp/en/", map:MAP("Nezu Museum") },
  { id:"ota", icon:"版", tags:["solo","design"], name:B("Ota Memorial Museum of Art", "מוזיאון אוטה לאמנות"), area:B("Harajuku · Tokyo","הרג׳וקו · טוקיו"), duration:"1–1.5h", price:B("Varies by exhibition","משתנה לפי תערוכה"), closed:B("Closed 28 Sep–5 Oct; next exhibition opens 6 Oct. Check later closures.","סגור 28 בספטמבר–5 באוקטובר; תערוכה חדשה מ-6 באוקטובר. לבדוק סגירות מאוחרות יותר."), audience:B("Gilad solo · ukiyo-e in compact scale","גלעד לבד · אוקיו־אה בקנה מידה קטן"), fit:4, note:B("Pairs naturally with Ura-Harajuku; never cross town solely for it without checking the show.","משתלב טבעית עם אורה־הרג׳וקו; לא לחצות עיר בלי לבדוק את התערוכה."), official:"http://www.ukiyoe-ota-muse.jp/eng", map:MAP("Ota Memorial Museum of Art") },
  { id:"2121", icon:"◼", tags:["solo","design"], name:B("21_21 Design Sight","21_21 Design Sight"), area:B("Tokyo Midtown · Roppongi","טוקיו מידטאון · רופונגי"), duration:"1.5–2h", price:B("Depends on program","תלוי בתכנית"), closed:B("Tuesday; verify exhibition dates","יום שלישי; לבדוק תאריכי תערוכה"), audience:B("Gilad solo · product + systems design","גלעד לבד · עיצוב מוצר ומערכות"), fit:4, note:B("A credible fallback for the unverified ASIJ day; the exhibition theme should decide.","חלופה אמינה ליום ASIJ הלא־מאומת; נושא התערוכה צריך להכריע."), official:"https://www.2121designsight.jp/en/", map:MAP("21_21 Design Sight") },
  { id:"tnm", icon:"🏺", tags:["family"], name:B("Tokyo National Museum","המוזיאון הלאומי של טוקיו"), area:B("Ueno · Tokyo","אואנו · טוקיו"), duration:"2–3h", price:B("Regular collection adult ¥1,000; specials extra","אוסף רגיל למבוגר 1,000¥; מיוחדות בתוספת"), closed:B("Monday; verify holiday substitutions","יום שני; לבדוק תחליפי חג"), audience:B("Family · one strong Japanese-history overview","משפחה · סקירה אחת חזקה של ההיסטוריה היפנית"), fit:3, note:B("Choose one building and a garden break. Its scale punishes completionism.","לבחור בניין אחד והפסקת גן. הגודל מעניש ניסיון לראות הכול."), official:"https://www.tnm.jp/?lang=en", map:MAP("Tokyo National Museum") },
  { id:"smallworlds", icon:"🏙", tags:["family","design"], name:B("Small Worlds","Small Worlds"), area:B("Ariake · Tokyo","אריאקה · טוקיו"), duration:"2–3h", price:B("Adult ¥3,200 · age 12–17 ¥2,100","מבוגר 3,200¥ · גיל 12–17 2,100¥"), closed:B("Check the dated calendar","לבדוק לוח לפי תאריך"), audience:B("Family · miniatures + engineering detail","משפחה · מיניאטורות + פרטי הנדסה"), fit:4, note:B("A reliable weatherproof component of either October 10 or the birthday.","רכיב אמין וחסין מזג אוויר ל-10 באוקטובר או יום ההולדת."), official:"https://smallworlds.jp/en/", map:MAP("Small Worlds Miniature Museum Tokyo") },
  { id:"planets", icon:"✨", tags:["family","design"], name:B("teamLab Planets","teamLab Planets"), area:B("Toyosu · Tokyo","טויוסו · טוקיו"), duration:"2–3h", price:B("Dynamic timed-ticket pricing; check official date","מחיר דינמי לכרטיס לפי שעה; לבדוק תאריך"), closed:B("Timed entry; maintenance varies","כניסה בשעה קבועה; תחזוקה משתנה"), audience:B("Family · immersive digital art","משפחה · אמנות דיגיטלית סוחפת"), fit:3, note:B("Excellent, but less essential because Kyoto Biovortex is newer and already on the route.","מצוין אך פחות חיוני כי Biovortex בקיוטו חדש יותר וכבר במסלול."), official:"https://www.teamlab.art/e/planets/", map:MAP("teamLab Planets Tokyo") },
  { id:"railway", icon:"🚂", tags:["family","train"], name:B("The Railway Museum","מוזיאון הרכבת"), area:B("Ōmiya · Saitama","אומיה · סאיטאמה"), duration:"3–4h", price:B("See official e-ticket page","לראות בעמוד הכרטיסים הרשמי"), closed:B("Tuesday; verify calendar","יום שלישי; לבדוק לוח"), audience:B("Erel + family · full-scale rail history","אראל + משפחה · היסטוריית רכבות בקנה מידה מלא"), fit:4, note:B("Strongest rail museum, but it needs a half-day and competes with Tokyo time.","מוזיאון הרכבת החזק ביותר, אך דורש חצי יום ומתחרה בזמן טוקיו."), official:"https://www.railway-museum.jp/e/", map:MAP("The Railway Museum Saitama") },
  { id:"biovortex", icon:"✦", tags:["family","design"], name:B("teamLab Biovortex Kyoto","teamLab Biovortex Kyoto"), area:B("Kyoto Station east/south","מזרח/דרום תחנת קיוטו"), duration:"2–3h", price:B("Current list: adult ¥3,800 · 13–17 ¥2,800 · 4–12 ¥1,800; may vary by date","רשימה נוכחית: מבוגר 3,800¥ · גיל 13–17 2,800¥ · גיל 4–12 1,800¥; עשוי להשתנות לפי תאריך"), closed:B("Open 09:00–21:00; last entry 19:30; check maintenance","פתוח 09:00–21:00; כניסה אחרונה 19:30; לבדוק תחזוקה"), audience:B("Whole family · immersive and physical","כל המשפחה · סוחף ופיזי"), fit:5, note:B("Permanent since October 2025 and only seven minutes from Kyoto Station—ideal on arrival evening.","קבוע מאוקטובר 2025 ורק שבע דקות מתחנת קיוטו — אידאלי לערב ההגעה."), official:"https://art.team-lab.cn/en/e/kyoto/", map:MAP("teamLab Biovortex Kyoto") },
  { id:"kyotorail", icon:"🚄", tags:["family","train"], name:B("Kyoto Railway Museum","מוזיאון הרכבת קיוטו"), area:B("Umekoji · Kyoto","אומקוג׳י · קיוטו"), duration:"2.5–4h", price:B("See current official admission","לראות מחיר כניסה רשמי עדכני"), closed:B("Wednesday; verify special openings","יום רביעי; לבדוק פתיחות מיוחדות"), audience:B("Erel + family · locomotives + operations","אראל + משפחה · קטרים + תפעול"), fit:4, note:B("An excellent rain substitute for Fushimi or a cancelled boat, not an extra full day.","חלופת גשם מצוינת לפושימי או לסירה מבוטלת, לא יום נוסף."), official:"https://www.kyotorailwaymuseum.jp/en/", map:MAP("Kyoto Railway Museum") },
  { id:"manga", icon:"漫", tags:["family","design"], name:B("Kyoto International Manga Museum","המוזיאון הבינלאומי למנגה בקיוטו"), area:B("Karasuma-Oike · Kyoto","קראסומה־אואיקה · קיוטו"), duration:"1.5–2.5h", price:B("See current official admission","לראות מחיר כניסה רשמי עדכני"), closed:B("Wednesday; check event calendar","יום רביעי; לבדוק לוח אירועים"), audience:B("Teens + family · visual culture","בני נוער + משפחה · תרבות חזותית"), fit:3, note:B("A weatherproof, teen-friendly substitute; the reading wall is less useful without Japanese, exhibitions matter.","חלופה סגורה שמתאימה לבני נוער; קיר הקריאה שימושי פחות בלי יפנית ולכן התערוכות חשובות."), official:"https://kyotomm.jp/en/", map:MAP("Kyoto International Manga Museum") },
  { id:"mot", icon:"▦", tags:["solo","family","design"], name:B("Museum of Contemporary Art Tokyo","המוזיאון לאמנות עכשווית טוקיו"), area:B("Kiyosumi-Shirakawa · Tokyo","קיוסומי־שיראקאווה · טוקיו"), duration:"2–3h", price:B("Varies by exhibition","משתנה לפי תערוכה"), closed:B("Monday; check installation closures","יום שני; לבדוק סגירות הקמה"), audience:B("Gilad or family · art + architecture","גלעד או משפחה · אמנות + אדריכלות"), fit:3, note:B("A credible substitute near Kiyosumi only when the exhibition is compelling and energy remains.","חלופה אמינה ליד קיוסומי רק כשהתערוכה חזקה ונשאר כוח."), official:"https://www.mot-art-museum.jp/eng/", map:MAP("Museum of Contemporary Art Tokyo") }
];

const mapCards = [
  { icon:"🏠", title:B("All stays","כל הלינות"), text:B("The four confirmed family stays plus both solo options.","ארבע הלינות המשפחתיות המאושרות ושתי חלופות הסולו."), query:"Shibuya Urban Retreat Nishihara Tokyo|Laforet Ito Onsen Yunoniwa|The Besso Soso Kyoto|Kumihimo no Ma Tokyo" },
  { icon:"👣", title:B("Moto-Yoyogi memories","זיכרונות מוטו־יויוגי"), text:B("Childhood lanes, embassy edge, Yoyogi Park and Meiji Jingu.","סמטאות הילדות, אזור השגרירות, פארק יויוגי ומייג׳י ג׳ינגו."), query:"Motoyoyogicho Tokyo" },
  { icon:"🔥", title:B("Nezu → Fukagawa","נזו ← פוקאגאווה"), text:B("October 7’s west-to-east old Tokyo route.","מסלול טוקיו הישנה ממערב למזרח ב-7 באוקטובר."), query:"Nezu Shrine to Fukagawa Fudodo" },
  { icon:"🏎", title:B("JDM route","מסלול JDM"), text:B("A PIT Shinonome, Nissan Crossing, Liberty Walk Harajuku.","A PIT Shinonome, Nissan Crossing, Liberty Walk Harajuku."), query:"A PIT Autobacs Shinonome to Nissan Crossing to Liberty Walk Tokyo" },
  { icon:"🛍", title:B("Shopping route","מסלול קניות"), text:B("Omotesando, Cat Street, Laforet, PARCO, Daikanyama—choose three.","אומוטסנדו, קאט סטריט, לפורט, PARCO, דאיקניאמה — לבחור שלושה."), query:"Omotesando to Cat Street to Shibuya PARCO" },
  { icon:"🌊", title:B("Enoshima + Kamakura","אנושימה + קמקורה"), text:B("Island, Hase, Great Buddha, and optional Hōkoku-ji.","האי, האסה, הבודהה הגדול ו-Hōkoku-ji אופציונלי."), query:"Katase-Enoshima Station to Kotoku-in Kamakura" },
  { icon:"🐠", title:B("New Enoshima Aquarium swap","החלפת אקווריום אנושימה החדש"), text:B("Weatherproof morning beside the beach; it replaces the island circuit before Hase.","בוקר חסין מזג אוויר ליד החוף; הוא מחליף את סיבוב האי לפני האסה."), query:"New Enoshima Aquarium to Kotoku-in Kamakura" },
  { icon:"🌋", title:B("Izu coast","חוף איזו"), text:B("Ito, Jōgasaki Kadowaki Bridge and Mt Ōmuro.","איטו, גשר קדוואקי בג׳וגסאקי והר אומורו."), query:"Ito Station to Kadowaki Suspension Bridge to Mount Omuro" },
  { icon:"💧", title:B("Kawazu falls","מפלי קוואזו"), text:B("Station, bus approach, and the seven-falls gorge.","תחנה, גישת אוטובוס וערוץ שבעת המפלים."), query:"Kawazu Station to Kawazu Nanadaru" },
  { icon:"🚞", title:B("Arashiyama backwards","אראשיאמה מהסוף להתחלה"), text:B("Torokko Saga, Kameoka boat dock, Otagi and Saga-Toriimoto.","Torokko Saga, רציף קמאוקה, Otagi ו-Saga-Toriimoto."), query:"Torokko Saga Station to Hozugawa River Boat Ride to Otagi Nenbutsuji" },
  { icon:"⛩", title:B("Fushimi water district","רובע המים של פושימי"), text:B("Fushimi Inari, Chushojima canals, Gekkeikan, Teradaya.","פושימי אינארי, תעלות צ׳ושוג׳ימה, Gekkeikan ו-Teradaya."), query:"Fushimi Inari to Gekkeikan Okura Sake Museum" },
  { icon:"🌲", title:B("Kurama → Kibune","קוראמה ← קיבונה"), text:B("Trailhead, ridge, shrine, bus and Eizan return.","תחילת שביל, רכס, מקדש, אוטובוס וחזרה באייזאן."), query:"Kurama Station to Kifune Shrine walking" },
  { icon:"🏮", title:B("Kawagoe Festival","פסטיבל קוואגואה"), text:B("Warehouse district, float zones and station escape route.","רובע המחסנים, אזורי העגלות ודרך היציאה לתחנה."), query:"Kawagoe Station to Ichibangai Shopping Street" },
  { icon:"💦", title:B("G-Cans","G-Cans"), text:B("Underground Discharge Channel meeting point—only after a tour is confirmed.","נקודת המפגש של תעלת הניקוז התת־קרקעית — רק לאחר אישור סיור."), query:"Metropolitan Area Outer Underground Discharge Channel Ryukyukan" },
  { icon:"✈️", title:B("Final airport run","הנסיעה האחרונה לשדה"), text:B("Kumihimo no Ma → Shinjuku N’EX → Narita T1.","Kumihimo no Ma ← N’EX משינג׳וקו ← נריטה T1."), query:"Honmachi Shibuya to Shinjuku Station" }
];

const foodCards = [
  {
    id:"combined", icon:"👨‍👩‍👧‍👦", title:T.combinedDiet,
    jp:"5人家族です。2人は肉を食べず、魚、卵、乳製品、野菜は食べられます。1人は豚肉と豚由来の食材を食べません。全員、魚は食べられますが、貝類、エビ、カニ、イカ、タコは食べません。別々に対応できる料理を教えてください。アレルギーではなく、食事制限です。",
    translation:B("We are a family of five. Two people do not eat meat; fish, eggs, dairy, and vegetables are okay. One person does not eat pork or pork-derived ingredients. Everyone can eat fish, but nobody eats shellfish, shrimp/prawns, crab, squid, or octopus. Please tell us which dishes can be prepared separately. These are dietary restrictions, not allergies.","אנחנו משפחה של חמישה. שניים לא אוכלים בשר; דגים, ביצים, חלב וירקות בסדר. אדם אחד אינו אוכל חזיר או מרכיבים שמקורם בחזיר. כולם אוכלים דגים, אך אף אחד אינו אוכל צדפות, שרימפס, סרטנים, קלמארי או תמנון. אנא אמרו אילו מנות ניתן להכין בנפרד. אלה מגבלות תזונה ולא אלרגיות.")
  },
  {
    id:"no-meat", icon:"🥬", title:B("No meat; fish is okay","ללא בשר; דגים בסדר"),
    jp:"肉類（牛肉、豚肉、鶏肉）は食べません。魚、卵、乳製品、野菜は食べられます。肉や肉の出汁を使わない料理をお願いします。アレルギーではなく、食事制限です。",
    translation:B("I do not eat meat (beef, pork, or chicken). Fish, eggs, dairy, and vegetables are okay. Please prepare food without meat or meat stock. This is a dietary restriction, not an allergy.","אינני אוכל/ת בשר (בקר, חזיר או עוף). דגים, ביצים, מוצרי חלב וירקות בסדר. אנא הכינו מנה ללא בשר או ציר בשר. זו מגבלת תזונה ולא אלרגיה.")
  },
  {
    id:"no-pork", icon:"🚫", title:B("No pork or pork-derived ingredients","ללא חזיר או מרכיבים מחזיר"),
    jp:"豚肉と豚由来の食材（ラード、豚骨スープを含む）は食べません。魚、鶏肉、牛肉、野菜は食べられます。アレルギーではなく、食事制限です。",
    translation:B("I do not eat pork or pork-derived ingredients, including lard and tonkotsu broth. Fish, chicken, beef, and vegetables are okay. This is a dietary restriction, not an allergy.","אינני אוכל/ת חזיר או מרכיבים שמקורם בחזיר, כולל שומן חזיר ומרק טונקוצו. דגים, עוף, בקר וירקות בסדר. זו מגבלת תזונה ולא אלרגיה.")
  },
  {
    id:"no-shellfish", icon:"🐟", title:B("Fish okay; no shellfish, squid, or octopus","דגים בסדר; ללא פירות ים, קלמארי או תמנון"),
    jp:"魚は食べられますが、貝類、エビ、カニなどの甲殻類、イカ、タコは食べません。これらや、その出汁を使わない料理をお願いします。アレルギーではなく、食事制限です。",
    translation:B("Fish is okay, but I do not eat shellfish, shrimp/prawns, crab or other crustaceans, squid, or octopus. Please prepare food without these ingredients or stock made from them. This is a dietary restriction, not an allergy.","דגים בסדר, אך אינני אוכל/ת צדפות, שרימפס, סרטנים או בעלי שריון אחרים, קלמארי או תמנון. אנא הכינו מנה ללא מרכיבים אלה או ציר מהם. זו מגבלת תזונה ולא אלרגיה.")
  }
];

const decisions = [
  { id:"saphir", icon:"💎", title:B("Saphir booking path","מסלול הזמנת ספיר"), text:B("Safest now: buy five ordinary Green seats online. A six-person private room will never appear there; ask at a JR office/machine after landing.","המהלך הבטוח עכשיו: לקנות אונליין חמישה מושבי גרין רגילים. תא פרטי לשישה לעולם לא יופיע שם; לבקש במשרד/מכונה של JR אחרי הנחיתה."), default:"action" },
  { id:"aquarium", icon:"🐠", title:B("October 9 coast choice","בחירת החוף ל-9 באוקטובר"), text:B("Keep Enoshima island for clear weather; replace it with New Enoshima Aquarium when wet, windy, hot, or low-energy. Do not stack both.","לשמור את האי אנושימה למזג אוויר בהיר; להחליף באקווריום אנושימה החדש כשגשום, סוער, חם או כשאין כוח. לא לדחוס את שניהם."), default:"decide" },
  { id:"izu-car", icon:"🚗", title:B("Izu transport on 12 October","תחבורה באיזו ב-12 באוקטובר"), text:B("Recommended: one compact car from Ito Station for this day only. Choose transit instead if the driver lacks the required physical IDP or does not want left-side/narrow-road driving.","מומלץ: רכב קומפקטי אחד מתחנת איטו ליום הזה בלבד. לבחור בתחבורה ציבורית אם לנהג אין רישיון בינלאומי פיזי נדרש או שהוא לא רוצה נהיגה בצד שמאל ובכבישים צרים."), default:"action" },
  { id:"sagano", icon:"🚞", title:B("Sagano + Hozugawa pair","צמד סאגאנו + הוזוגאווה"), text:B("Book at/after 00:00 JST on 15 Sep. Pair a 09:02 trolley with a 10:00 boat if available.","להזמין החל מ-00:00 JST ב-15 בספטמבר. לחבר רכבת 09:02 עם סירה 10:00 אם זמין."), default:"action" },
  { id:"solo-hotel", icon:"🏨", title:B("Solo Tokyo hotel","מלון סולו בטוקיו"), text:B("Tokyu Stay Aoyama Premier vs FUKU House Shinjuku. Neither is described as booked.","Tokyu Stay Aoyama Premier מול FUKU House Shinjuku. אף אחד אינו מוצג כמוזמן."), default:"open" },
  { id:"yamato", icon:"🧳", title:B("Tokyo → Kyoto luggage acceptance","קבלת מזוודות מטוקיו לקיוטו"), text:B("Confirm Tokyo pickup and Besso’s staffed receipt, exact address/phone, guest name, and 14 Oct delivery date.","לאשר איסוף בטוקיו וקבלה מאוישת ב-Besso, כתובת/טלפון מדויקים, שם אורח ותאריך מסירה 14 באוקטובר."), default:"action" },
  { id:"oct10", icon:"🎛", title:B("October 10 family choice","בחירת המשפחה ל-10 באוקטובר"), text:B("New recommendation: taiko + Cooking Sun, if both slots and the dietary plan are confirmed. Odaiba Play Lab is the reliable fallback.","המלצה חדשה: טאיקו + Cooking Sun, אם שני המקומות ותכנית המזון מאושרים. Odaiba Play Lab היא החלופה האמינה."), default:"open" },
  { id:"oct16", icon:"🍡", title:B("October 16 Fushimi workshop","סדנת פושימי ל-16 באוקטובר"), text:B("Preferred: the two-hour wagashi class for all five. Confirm the live slot and ingredients; use the short matcha ceremony or original canal day if it does not fit.","מועדף: סדנת ואגאשי של שעתיים לכל החמישה. לאשר שעה חיה ומרכיבים; להשתמש בטקס מאצ׳ה קצר או ביום התעלות המקורי אם זה לא מסתדר."), default:"action" },
  { id:"oct13", icon:"♨️", title:B("October 13 Izu tempo","קצב איזו ל-13 באוקטובר"), text:B("Default recommendation: slow Ito + ryokan. Kawazu is the active option; do not stack Shimoda.","המלצת ברירת מחדל: איטו רגועה + ריוקאן. קוואזו היא החלופה הפעילה; לא להוסיף שימודה."), default:"open" },
  { id:"oct19", icon:"🎂", title:B("50th birthday booking","הזמנת יום הולדת 50"), text:B("First attempt: G-Cans with confirmed English/safety support. Fallback: Joypolis + bay night.","ניסיון ראשון: G-Cans עם תמיכת אנגלית/בטיחות מאושרת. חלופה: ג׳ויפוליס + ערב במפרץ."), default:"action" },
  { id:"asij", icon:"🎓", title:B("ASIJ contact","קשר ASIJ"), text:B("No public event was verified. Only restore an event to the plan from a personal invitation or alumni-office confirmation.","לא אומת אירוע ציבורי. להחזיר אירוע למסלול רק לפי הזמנה אישית או אישור ממשרד הבוגרים."), default:"unverified" },
  { id:"jukkokubune", icon:"🛶", title:B("Fushimi Jukkokubune","סירת Jukkokubune בפושימי"), text:B("2026 operation is event-only. Watch for a public 16 Oct event slot; the canal walk stands without it.","ב-2026 ההפעלה רק באירועים. לחפש הפלגה ציבורית ב-16 באוקטובר; הליכת התעלות עומדת גם בלעדיה."), default:"unverified" },
  { id:"booking-policies", icon:"⏱", title:B("Live cancellation policies","מדיניות ביטול חיה"), text:B("Recheck every Booking.com stay. Prototype deadlines are preserved only as reminders, not treated as live truth.","לבדוק מחדש כל לינה ב-Booking.com. מועדי האפליקציה הישנה נשמרים כתזכורת בלבד, לא כאמת עדכנית."), default:"action" }
];

const actionChecklist = [
  {
    id:"saphir", phase:"now", icon:"💎", kind:B("TRAIN","רכבת"),
    title:B("Secure Saphir Odoriko for all five","להבטיח ספיר אודוריקו לכל החמישה"), due:B("Act now · travel 11 Oct","לפעול עכשיו · נסיעה 11 באוקטובר"), people:B("Gilad, Ayelet, Yaara, Geffen, Erel","גלעד, איילת, יערה, גפן, אראל"),
    summary:B("The missing private-room option is expected, not an error. Secure five Green seats online now; ask for the room after landing.","היעדר אפשרות לתא פרטי צפוי ואינו תקלה. להבטיח חמישה מושבי גרין אונליין עכשיו; לבקש תא אחרי הנחיתה."),
    steps:[B("Open JR-EAST Train Reservation and choose Purchase tickets (not the pass-only seat-reservation route). Search Sunday 11 October from Shibuya around 12:30 to Ito, then choose Saphir Odoriko 5 and five seats in Green Cars 5–8.","לפתוח JR-EAST Train Reservation ולבחור Purchase tickets (לא מסלול שמירת מושב לבעלי פאס). לחפש יום ראשון 11 באוקטובר משיבויה סביב 12:30 לאיטו, ואז לבחור Saphir Odoriko 5 וחמישה מושבים בקרונות גרין 5–8."),B("If the train appears but no private room does, nothing is broken: cars 2–3 are sold only at a JR reserved-seat machine or Midori-no-madoguchi. If payment fails, JR says some foreign cards may be restricted—try another card or buy at a station.","אם הרכבת מופיעה אך אין תא פרטי, דבר אינו מקולקל: קרונות 2–3 נמכרים רק במכונת מושבים שמורים או במשרד Midori-no-madoguchi. אם התשלום נכשל, JR מציין שחלק מהכרטיסים הזרים עשויים להיות מוגבלים — לנסות כרטיס אחר או לקנות בתחנה."),B("On 29 September, ask for one six-person Green private compartment for five on Saphir Odoriko 5, Shibuya 12:30 → Ito. Before buying a second product, ask JR staff what can be changed/refunded and what fee applies to the five-seat backup.","ב-29 בספטמבר לבקש תא גרין פרטי אחד לשישה עבור חמישה נוסעים בספיר אודוריקו 5, שיבויה 12:30 ← איטו. לפני קנייה שנייה, לשאול את צוות JR מה ניתן לשנות/להחזיר ואיזו עמלה חלה על גיבוי חמשת המושבים."),B("If Saphir 5 is sold out, check Saphir 1 from Tokyo at 11:00; final fallback is a reserved regular Odoriko. Save every confirmation offline.","אם ספיר 5 אזלה, לבדוק ספיר 1 מטוקיו ב-11:00; החלופה הסופית היא אודוריקו רגילה עם מושב שמור. לשמור כל אישור אופליין.")],
    links:[[B("Buy five Green seats now","לקנות עכשיו חמישה מושבי גרין"),"https://www.eki-net.com/en/jreast-train-reservation/Top/Index"],[B("Why private rooms do not appear","למה תאים פרטיים לא מופיעים"),"https://www.jreast.co.jp/saphir/en/cars/ticket/"],[B("Live timetable","לוח זמנים חי"),"https://www.jreast.co.jp/saphir/en/cars/station/"]]
  },
  {
    id:"izu-car", phase:"now", icon:"🚗", kind:B("IZU TRANSPORT","תחבורה באיזו"),
    title:B("Reserve the 12 Oct Ito car—or commit to transit","להזמין רכב באיטו ל-12 באוקטובר — או להתחייב לתחבורה ציבורית"), due:B("Decide now · drive 12 Oct only","להחליט עכשיו · נהיגה רק ב-12 באוקטובר"), people:B("One named driver · all five ride","נהג/ת רשום אחד · כל החמישה נוסעים"),
    summary:B("A one-day compact car is the recommended way to combine Jōgasaki and Mt Ōmuro; do not rent for the full Izu stay.","רכב קומפקטי ליום אחד הוא הדרך המומלצת לשלב את ג׳וגסאקי והר אומורו; לא לשכור לכל השהות באיזו."),
    steps:[B("Every driver: carry the original Israeli plastic licence, passport and physical IDP issued in Israel less than one year before driving. Japan accepts the Israeli dual Geneva/Vienna format within that one-year limit even if its printed validity is longer. Register every driver; if documents are missing, choose rail/bus.", "כל נהג: לשאת רישיון ישראלי פלסטי מקורי, דרכון ורישיון בינלאומי פיזי שהונפק בישראל פחות משנה לפני הנהיגה. יפן מקבלת את הפורמט הישראלי המשולב ז׳נבה/וינה בגבול שנה זו גם אם תוקף מודפס ארוך יותר. לרשום כל נהג; אם חסרים מסמכים, לבחור רכבת/אוטובוס."),B("Reserve Nippon Ito for 12 October, pickup 08:00, return target 17:30–18:00. Toyota opens 09:00; both currently close 19:00. Require five legal seats and enough space for all passengers/day bags; never a four-seat kei car. Compare an automatic MPV if a compact is cramped. Confirm holiday hours, fuel and coverage terms.", "להזמין Nippon איטו ל-12 באוקטובר, איסוף 08:00 ויעד החזרה 17:30–18:00. Toyota נפתח 09:00; שניהם נסגרים כעת 19:00. לדרוש חמישה מושבים חוקיים ומקום לנוסעים/תיקי יום; לא רכב kei עם ארבעה מושבים. להשוות מיניוואן אוטומטי אם קומפקטי צפוף. לאשר שעות חג, דלק וכיסויים."),B("Drive on the left and expect narrow roads. Use Ito → Kadowaki municipal parking → Mt Ōmuro → Ito. Do not drink before driving. Photograph the car and fuel gauge at pickup and return.","לנהוג בצד שמאל ולצפות לכבישים צרים. המסלול: איטו ← חניון קדוואקי העירוני ← הר אומורו ← איטו. לא לשתות לפני נהיגה. לצלם את הרכב ומד הדלק באיסוף ובהחזרה."),B("If the documents, confidence, weather, or cancellation terms do not work, choose transit in the itinerary and mark this task complete after saving the Tokai Bus/Izu Kyūkō plan. Laforet has free guest parking for about 50 cars if needed, but the same-day return avoids using it.","אם המסמכים, הביטחון, מזג האוויר או תנאי הביטול אינם מתאימים, לבחור בתחבורה ציבורית במסלול ולסמן את המשימה כהושלמה אחרי שמירת תכנית Tokai Bus/Izu Kyūkō. ב-Laforet יש חניה חינם לכ-50 רכבים אם צריך, אך החזרה באותו יום מייתרת אותה.")],
    links:[[B("Book Nippon Ito 08:00","הזמנת Nippon Ito ב-08:00"),"https://store.nipponrentacar.co.jp/en/b/nrs/info/470337/"],[B("Compare Toyota Ito","השוואת Toyota Ito"),"https://rent.toyota.co.jp/eng/reservation/index01.aspx?eShop=031&rShop=63601&shopMode=0"],[B("Japan IDP warning for Israelis","אזהרת רישיון ליפן לישראלים"),"https://embassies.gov.il/japan/he/announcements/international-driving-permit"],[B("Laforet parking FAQ","שאלות חניה ב-Laforet"),"https://www.laforet.co.jp/ito/faq/access/"]]
  },
  {
    id:"enoshima-aquarium", phase:"before", icon:"🐠", kind:B("WEATHER CHOICE","בחירת מזג אוויר"),
    title:B("Choose island or New Enoshima Aquarium","לבחור אי או אקווריום אנושימה החדש"), due:B("Evening of 8 Oct · visit 9 Oct","בערב 8 באוקטובר · ביקור 9 באוקטובר"), people:B("All five","כל החמישה"),
    summary:B("Use the aquarium as a replacement for the island circuit when weather or energy is poor—not as an extra stop.","להשתמש באקווריום במקום סיבוב האי כשמזג האוויר או האנרגיה חלשים — לא כתחנה נוספת."),
    steps:[B("Check the 9 October forecast and everyone’s energy. Clear/calm: choose Enoshima island. Wet, windy, hot, or tired: choose the aquarium in the itinerary.","לבדוק תחזית ל-9 באוקטובר ואת האנרגיה של כולם. בהיר/רגוע: לבחור באי אנושימה. רטוב, סוער, חם או עייפים: לבחור באקווריום במסלול."),B("The current March–November pattern is 09:00–17:00, last entry 16:00; recheck 9 October exceptions. Current admission is adult ¥2,800, high-school student ¥1,800, and elementary/junior-high ¥1,300; bring Geffen’s student ID and let the ticket desk confirm each category.","השעות העונתיות הנוכחיות הן 09:00–17:00 עם כניסה אחרונה ב-16:00. המחיר הנוכחי הוא 2,800¥ למבוגר, 1,800¥ לתלמיד תיכון ו-1,300¥ ליסודי/חטיבה; להביא תעודת תלמיד של גפן ולתת לקופה לאשר כל קטגוריה."),B("No 9 October timed-entry requirement is currently posted. Buy at the ticket desk or an official listed partner, then leave after about 2.5 hours for Hase and the Great Buddha. Check the live show schedule only on the visit day.","כרגע לא פורסמה דרישת כניסה מתוזמנת ל-9 באוקטובר. לקנות בקופה או דרך שותף רשמי שמופיע באתר, ואז לצאת אחרי כ-2.5 שעות להאסה ולבודהה הגדול. לבדוק לוח מופעים חי רק ביום הביקור.")],
    links:[[B("Official hours, fares & tickets","שעות, מחירים וכרטיסים רשמיים"),"https://www.enosui.com/basicinfo.php"],[B("English aquarium guide","מדריך האקווריום באנגלית"),"https://www.enosui.com/en/"],[B("Aquarium map","מפת האקווריום"),MAP("New Enoshima Aquarium")]]
  },
  {
    id:"atami-kyoto", phase:"now", icon:"🚄", kind:B("TRAIN","רכבת"),
    title:B("Buy Atami → Kyoto Shinkansen seats","לקנות מושבי שינקנסן מאטאמי לקיוטו"), due:B("From 14 Sep, 10:00 JST · travel 14 Oct","מ-14 בספטמבר 10:00 JST · נסיעה 14 באוקטובר"), people:B("All five","כל החמישה"),
    summary:B("Reserve one direct Hikari for five; the Ito → Atami local fare is separate.","להזמין Hikari ישירה אחת לחמישה; הנסיעה המקומית איטו ← אטאמי נפרדת."),
    steps:[B("Create or sign in to SmartEX and search Atami → Kyoto for 14 October.","ליצור חשבון או להיכנס ל-SmartEX ולחפש אטאמי ← קיוטו ל-14 באוקטובר."),B("Choose a direct Hikari with a comfortable transfer buffer after the Ito train. Avoid a connection that requires another Shinkansen change.","לבחור Hikari ישירה עם מרווח נוח אחרי הרכבת מאיטו. להימנע מחיבור שדורש החלפת שינקנסן נוספת."),B("Reserve five together; choose E-side seats where practical for the Fuji side. Buy Ito → Atami locally with IC cards on the day.","להזמין חמישה יחד; לבחור מושבי צד E כשמעשי לנוף פוג׳י. לשלם על איטו ← אטאמי בנפרד בכרטיסי IC ביום הנסיעה.")],
    links:[[B("SmartEX / JR Central booking","הזמנת SmartEX / JR Central"),"https://global.jr-central.co.jp/en/onlinebooking/"],[B("Atami station map","מפת תחנת אטאמי"),MAP("Atami Station Shinkansen transfer")]]
  },
  {
    id:"sagano", phase:"now", icon:"🚞", kind:B("TRAIN","רכבת"),
    title:B("Buy Sagano Romantic Train tickets","לקנות כרטיסי רכבת סאגאנו"), due:B("15 Sep, 00:00 JST · travel 15 Oct","15 בספטמבר 00:00 JST · נסיעה 15 באוקטובר"), people:B("All five","כל החמישה"),
    summary:B("Book Torokko Saga → Torokko Kameoka, ideally the 09:02 departure, for five people.","להזמין Torokko Saga ← Torokko Kameoka, עדיף יציאת 09:02, לחמישה."),
    steps:[B("Open the official reservation site at midnight Japan time one month before travel.","לפתוח את אתר ההזמנות הרשמי בחצות שעון יפן, חודש לפני הנסיעה."),B("Select 15 October, Saga/Arashiyama → Kameoka, five passengers, then choose five nearby seats.","לבחור 15 באוקטובר, Saga/Arashiyama ← Kameoka, חמישה נוסעים ואז חמישה מושבים קרובים."),B("Car 5 “Rich” is open-sided and may get wet. Save the confirmation now, but the boarding QR is available only on 15 October; a printed voucher alone is not valid. Keep the booking phone charged with data, open the actual ticket that morning and ask station staff if it fails. If sold out, use JR to Arashiyama and keep only a boat reservation that can still be reached.", "קרון 5 Rich פתוח בצדדים ועלול להירטב. לשמור אישור עכשיו, אך QR לעלייה זמין רק ב-15 באוקטובר; שובר מודפס לבדו אינו תקף. לשמור טלפון טעון עם נתונים, לפתוח את הכרטיס בבוקר ולפנות לצוות התחנה אם נכשל. אם אזל, להגיע לאראשיאמה ב-JR ולשמור הזמנת סירה רק אם עדיין ניתן להגיע אליה.")],
    links:[[B("Official tickets","כרטיסים רשמיים"),"https://www.sagano-kanko.co.jp/en/ticket/"],[B("2026 timetable","לוח 2026"),"https://www.sagano-kanko.co.jp/en/train-info/"],[B("Seat guide","מדריך מושבים"),"https://www.sagano-kanko.co.jp/en/seat/"]]
  },
  {
    id:"hozugawa", phase:"now", icon:"🛶", kind:B("BOAT","סירה"),
    title:B("Reserve the matching Hozugawa boat","להזמין סירת הוזוגאווה תואמת"), due:B("Book together with Sagano · 15 Oct","להזמין יחד עם סאגאנו · 15 באוקטובר"), people:B("All five","כל החמישה"),
    summary:B("Pair the trolley with a boat departure that leaves enough time for the official Kameoka transfer.","לחבר את הרכבת להפלגה שמשאירה די זמן למעבר הרשמי בקמאוקה."),
    steps:[B("First secure the Sagano train, then select the next workable Hozugawa departure—target 10:00 only if the published connection supports it.","קודם להבטיח את רכבת סאגאנו, ואז לבחור את הפלגת הוזוגאווה המעשית הבאה — לכוון ל-10:00 רק אם החיבור המפורסם תומך בכך."),B("Reserve five on the official river-boat site and check the cancellation/weather rules before payment.","להזמין חמישה באתר הרשמי של השיט ולבדוק כללי ביטול ומזג אוויר לפני תשלום."),B("Save both confirmations together. Recheck operation the evening before because river conditions can cancel service.","לשמור את שני האישורים יחד. לבדוק הפעלה בערב הקודם כי תנאי הנהר עלולים לבטל שירות.")],
    links:[[B("Official boat reservations","הזמנות סירה רשמיות"),"https://www.hozugawakudari.jp/tickets/reservation"],[B("Torokko Kameoka map","מפת Torokko Kameoka"),MAP("Torokko Kameoka Station")]]
  },
  {
    id:"kyoto-tokyo", phase:"now", icon:"🚅", kind:B("TRAIN","רכבת"),
    title:B("Buy Kyoto → Tokyo Nozomi seats","לקנות מושבי Nozomi מקיוטו לטוקיו"), due:B("From 18 Sep, 10:00 JST · travel 18 Oct","מ-18 בספטמבר 10:00 JST · נסיעה 18 באוקטובר"), people:B("All five","כל החמישה"),
    summary:B("Reserve five together and attach the correct luggage option to every suitcase over 160 cm total dimensions.","להזמין חמישה יחד ולשייך אפשרות מזוודה נכונה לכל מזוודה מעל 160 ס״מ בסכום הממדים."),
    steps:[B("Measure the suitcases before booking: height + width + depth.","למדוד מזוודות לפני ההזמנה: גובה + רוחב + עומק."),B("In SmartEX search Kyoto → Tokyo on 18 October and choose a Nozomi that still leaves time for Kawagoe in the afternoon/evening.","ב-SmartEX לחפש קיוטו ← טוקיו ב-18 באוקטובר ולבחור Nozomi שמשאירה זמן לקוואגואה אחר הצהריים/ערב."),B("Select ‘seat with oversized baggage area’ for each bag measuring 161–250 cm. Choose E-side seats where practical for Fuji.","לבחור ‘מושב עם אזור למזוודה גדולה’ לכל תיק בגודל 161–250 ס״מ. לבחור צד E כשמעשי לנוף פוג׳י.")],
    links:[[B("SmartEX / JR Central booking","הזמנת SmartEX / JR Central"),"https://global.jr-central.co.jp/en/onlinebooking/"],[B("Official oversized-bag rules","כללי מזוודה גדולה רשמיים"),"https://global.jr-central.co.jp/en/info/oversized-baggage/"]]
  },
  {
    id:"teamlab-kyoto", phase:"now", icon:"✦", kind:B("TIMED ENTRY","כניסה בשעה"),
    title:B("Buy teamLab Biovortex Kyoto tickets","לקנות כרטיסי teamLab Biovortex Kyoto"), due:B("After the 14 Oct train is fixed","אחרי שרכבת 14 באוקטובר נקבעת"), people:B("All five","כל החמישה"),
    summary:B("This is the preferred teamLab visit; book a timed slot with a generous post-train buffer.","זהו ביקור teamLab המועדף; להזמין שעה עם מרווח נדיב אחרי הרכבת."),
    steps:[B("Fix the Atami → Kyoto train first, then choose a 14 October entry time that allows for delays, hotel check-in, and the seven-minute walk from Kyoto Station.","קודם לקבוע את רכבת אטאמי ← קיוטו, ואז לבחור שעת כניסה ב-14 באוקטובר שמאפשרת עיכובים, צ׳ק־אין והליכה של שבע דקות מתחנת קיוטו."),B("For the supplied ages: three adult tickets (Gilad, Ayelet, Yaara 20), one age 13–17 (Geffen 17), and one age 4–12 (Erel 12). Recheck birthdays and ages on the visit date.", "לגילים שנמסרו: שלושה כרטיסי מבוגר (גלעד, איילת, יערה 20), אחד לגיל 13–17 (גפן 17) ואחד לגיל 4–12 (אראל 12). לבדוק ימי הולדת וגיל ביום הביקור."),B("Use the official seller. Tickets may sell out; official tickets generally cannot be canceled, although limited date/time changes are supported under the posted rules.","להשתמש במוכר הרשמי. הכרטיסים עלולים להיגמר; בדרך כלל אי אפשר לבטל כרטיסים רשמיים, אך שינויי תאריך/שעה מוגבלים נתמכים לפי הכללים המפורסמים.")],
    links:[[B("Buy official tickets","קניית כרטיסים רשמיים"),"https://kyoto.tickets.teamlab.art/"],[B("Visit information","מידע לביקור"),"https://art.team-lab.cn/en/e/kyoto/"]]
  },
  {
    id:"kyoto-wagashi", phase:"now", icon:"🍡", kind:B("FAMILY WORKSHOP","סדנה משפחתית"),
    title:B("Choose and book the Fushimi wagashi workshop","לבחור ולהזמין את סדנת הוואגאשי בפושימי"), due:B("Check now · visit 16 Oct","לבדוק עכשיו · ביקור 16 באוקטובר"), people:B("All five · confirm capacity with host","כל החמישה · לאשר קיבולת עם המארחת"),
    summary:B("The two-hour English class near Fushimi Inari is the cleanest new activity fit; use the short matcha ceremony if the full workshop has no suitable slot.","הסדנה באנגלית של שעתיים ליד פושימי אינארי היא הפעילות החדשה שמשתלבת הכי טוב; להשתמש בטקס המאצ׳ה הקצר אם אין שעה מתאימה בסדנה המלאה."),
    steps:[B("Open the live Klook calendar for 16 October and look for one slot that accepts five guests without forcing a rushed shrine departure or late canal finish.","לפתוח את לוח Klook החי ל-16 באוקטובר ולחפש שעה אחת שמקבלת חמישה אורחים בלי לאלץ יציאה לחוצה מהמקדש או סיום מאוחר בתעלות."),B("Before payment, message the host: confirm English instruction, the actual start/end time (budget two hours provisionally), cancellation terms, and that all five can participate individually.","לפני התשלום, לפנות למארחת: לאשר הדרכה באנגלית, שעת התחלה/סיום בפועל (לתקצב שעתיים זמנית), תנאי ביטול, ושכל החמישה יכולים להשתתף באופן אישי."),B("Send the family food card and confirm the exact sweets contain no shellfish-derived ingredients or other restricted items. Select vegetarian/vegan preparation where offered, then save the voucher and address offline.","לשלוח את כרטיס המזון המשפחתי ולאשר שהממתקים המדויקים אינם מכילים מרכיבים שמקורם בפירות ים או מרכיבים מוגבלים אחרים. לבחור הכנה צמחונית/טבעונית כשמוצעת, ואז לשמור את השובר והכתובת אופליין.")],
    links:[[B("Check Klook availability","בדיקת זמינות ב-Klook"),"https://www.klook.com/en-AU/activity/111279-fushimiinari-wagashi-japanese-sweets-cooking-class-in-kyoto/"],[B("Studio information","מידע מהסטודיו"),"https://iroha-cooking-kyoto.my.canva.site/"],[B("Short matcha fallback","חלופת מאצ׳ה קצרה"),"https://matcha-tia.com/shop/fushimiinari"]]
  },
  {
    id:"oct10-choice", phase:"now", icon:"🎛", kind:B("DECISION","החלטה"),
    title:B("Choose and book the 10 October family day","לבחור ולהזמין את יום המשפחה ב-10 באוקטובר"), due:B("Decide by 20 Sep","להחליט עד 20 בספטמבר"), people:B("Family vote · all five","הצבעה משפחתית · כל החמישה"),
    summary:B("First try the taiko + sushi studio combination; it beats another passive attraction if the two suppliers and the dietary plan line up.","לנסות קודם את השילוב טאיקו + סטודיו סושי; הוא עדיף על עוד אטרקציה פסיבית אם שני הספקים ותכנית המזון מסתדרים."),
    steps:[B("Ask Taiko Center for an English one-hour Aoyama slot for five on the morning of 10 October, then check Cooking Sun Tokyo for the 13:30–16:30 sushi class in Shinanomachi.","לבקש מ-Taiko Center שעת טאיקו באנגלית לחמישה באויאמה בבוקר 10 באוקטובר, ואז לבדוק ב-Cooking Sun Tokyo את סדנת הסושי 13:30–16:30 בשיננומאצ׳י."),B("Before buying Cooking Sun, obtain written confirmation for two fish-eating/no-meat participants, no shellfish/shrimp/crab/squid/octopus for anyone, and no pork or pork-derived ingredients for one person. Confirm how age 12 is priced.","לפני קניית Cooking Sun, לקבל אישור כתוב לשני משתתפים שאוכלים דגים אך לא בשר, ללא צדפות/שרימפס/סרטן/קלמארי/תמנון לכולם, וללא חזיר או מרכיבים מחזיר לאדם אחד. לאשר כיצד מתמחרים גיל 12."),B("Prefer the official English taiko booking. Use the cheaper Klook Okubo listing only if its exact slot, cancellation policy, and English instruction are confirmed in writing. Book Cooking Sun direct. If either piece fails, switch the day back to Odaiba Play Lab and reserve only Small Worlds.","להעדיף הזמנה רשמית של טאיקו באנגלית. להשתמש ברישום Klook הזול יותר באוקובו רק אם השעה, מדיניות הביטול וההדרכה באנגלית מאושרות בכתב. להזמין Cooking Sun ישירות. אם אחד המרכיבים נכשל, לחזור ל-Odaiba Play Lab ולהזמין רק Small Worlds.")],
    links:[[B("Official English taiko","טאיקו רשמי באנגלית"),"https://www.taiko-reserve.com/en/"],[B("Klook Okubo fallback","חלופת Klook באוקובו"),"https://www.klook.com/en-US/activity/8758-taiko-japanese-drum-experience-tokyo/"],[B("Cooking Sun Tokyo","Cooking Sun טוקיו"),"https://www.cooking-sun.com/tokyo-cooking-class/"],[B("Small Worlds fallback","חלופת Small Worlds"),"https://smallworlds.jp/en/"],[B("Warner Bros tickets","כרטיסי Warner Bros"),"https://www.wbstudiotour.jp/en/tickets/"],[B("Joypolis","Joypolis"),"https://tokyo-joypolis.com/language/english/"],[B("teamLab Planets","teamLab Planets"),"https://www.teamlab.art/e/planets/"]]
  },
  {
    id:"birthday", phase:"now", icon:"🎂", kind:B("RESERVATION","הזמנה"),
    title:B("Lock the 19 October birthday experience","לנעול את חוויית יום ההולדת ב-19 באוקטובר"), due:B("G-Cans opens 19 Sep, 00:00 JST","G-Cans נפתח 19 בספטמבר, 00:00 ביפן"), people:B("Gilad’s 50th · all five","יום הולדת 50 של גלעד · כל החמישה"),
    summary:B("Try G-Cans only with a confirmed slot, age fit, safety access, and workable language support; keep Joypolis as the reliable fallback.","לנסות G-Cans רק עם מקום מאושר, התאמת גיל, נגישות בטיחותית ותמיכת שפה מעשית; להשאיר Joypolis כחלופה אמינה."),
    steps:[B("Check the official G-Cans calendar for 19 October and confirm that the selected course accepts Erel, that all five can manage the stairs, and how non-Japanese speakers receive safety instructions.","לבדוק בלוח הרשמי של G-Cans את 19 באוקטובר ולאשר שהמסלול מקבל את אראל, שכל החמישה מסוגלים להתמודד עם המדרגות ואיך דוברי שפות אחרות מקבלים הוראות בטיחות."),B("If any condition fails, book Joypolis + Tokyo Bay or an English-supported Tokyo Mystery Circus team ticket instead.","אם תנאי כלשהו נכשל, להזמין Joypolis + מפרץ טוקיו או כרטיס קבוצתי עם תמיכה באנגלית ב-Tokyo Mystery Circus."),B("After the headline activity is fixed, reserve a celebratory dinner that explicitly accepts the family’s food restrictions.","אחרי שחוויית הכותרת נקבעת, להזמין ארוחת חגיגה שמקבלת במפורש את מגבלות האוכל של המשפחה.")],
    links:[[B("G-Cans official tours","סיורי G-Cans רשמיים"),"https://gaikaku.jp/"],[B("Joypolis","Joypolis"),"https://tokyo-joypolis.com/language/english/"],[B("Tokyo Mystery Circus","Tokyo Mystery Circus"),"https://mysterycircus.jp/en"]]
  },
  {
    id:"solo-hotel", phase:"now", icon:"🏨", kind:B("STAY","לינה"),
    title:B("Choose the solo Tokyo hotel","לבחור את מלון הסולו בטוקיו"), due:B("Before the earliest live cancellation deadline","לפני מועד הביטול החי המוקדם ביותר"), people:B("Gilad · 29 Sep–6 Oct","גלעד · 29 בספטמבר–6 באוקטובר"),
    summary:B("Compare Tokyu Stay Aoyama Premier with FUKU House Shinjuku and mark only the real booking as selected.","להשוות Tokyu Stay Aoyama Premier מול FUKU House Shinjuku ולסמן כנבחר רק את מה שבאמת מוזמן."),
    steps:[B("Open Booking.com Trips and compare live price, cancellation terms, room type, laundry, and route to the nostalgia days.","לפתוח את Booking.com Trips ולהשוות מחיר חי, תנאי ביטול, סוג חדר, כביסה והגעה לימי הנוסטלגיה."),B("Select the winner in the Stays view. Cancel the other only from the authenticated booking record after checking the fee shown immediately before confirmation.","לבחור את המנצח בתצוגת הלינה. לבטל את השני רק מתוך ההזמנה המאומתת אחרי בדיקת העמלה שמוצגת מיד לפני האישור."),B("Save the final address and check-in instructions offline.","לשמור אופליין את הכתובת והוראות הצ׳ק־אין הסופיות.")],
    links:[[B("Open Booking.com Trips","פתיחת Booking.com Trips"),"https://secure.booking.com/myreservations.html"]]
  },
  {
    id:"booking-policies", phase:"now", icon:"⏱", kind:B("STAYS","לינה"),
    title:B("Recheck every live cancellation policy","לבדוק מחדש כל מדיניות ביטול חיה"), due:B("Now, then once more before each deadline","עכשיו ואז שוב לפני כל מועד"), people:B("All five stays / options","כל הלינות / החלופות"),
    summary:B("The prototype’s old dates are reminders only; use the authenticated booking page as the source of truth.","התאריכים הישנים באב־הטיפוס הם תזכורות בלבד; להשתמש בעמוד ההזמנה המאומת כמקור האמת."),
    steps:[B("Open each Booking.com reservation and record the exact free-cancellation deadline, local timezone, charge schedule, and room status.","לפתוח כל הזמנת Booking.com ולרשום מועד ביטול חינם מדויק, אזור זמן מקומי, לוח חיובים וסטטוס חדר."),B("Check Shibuya Urban Retreat, Laforet Ito, Besso Soso, Kumihimo no Ma, and both solo-hotel candidates.","לבדוק Shibuya Urban Retreat, Laforet Ito, Besso Soso, Kumihimo no Ma ואת שתי חלופות מלון הסולו."),B("Do not cancel from a reminder alone; read the final charge shown by Booking.com before submitting.","לא לבטל על סמך תזכורת בלבד; לקרוא את החיוב הסופי ש-Booking.com מציג לפני שליחה.")],
    links:[[B("Booking.com Trips","Booking.com Trips"),"https://secure.booking.com/myreservations.html"]]
  },
  {
    id:"besso-receipt", phase:"now", icon:"🧳", kind:B("LUGGAGE","מזוודות"),
    title:B("Get Besso’s written luggage acceptance","לקבל אישור כתוב מ-Besso לקבלת מזוודות"), due:B("Before 10 Oct shipping","לפני השילוח ב-10 באוקטובר"), people:B("Large family suitcases","המזוודות הגדולות של המשפחה"),
    summary:B("Confirm a staffed receiver, exact shipping address, phone, guest name, and 14 October delivery date.","לאשר מקבל מאויש, כתובת שילוח מדויקת, טלפון, שם אורח ותאריך מסירה 14 באוקטובר."),
    steps:[B("Message Besso through the authenticated booking channel and ask whether they accept Yamato luggage before check-in.","לשלוח הודעה ל-Besso דרך ערוץ ההזמנה המאומת ולשאול אם הם מקבלים מזוודות Yamato לפני צ׳ק־אין."),B("Ask them to provide the exact Japanese address, telephone number, guest-name format, and acceptable delivery date/time window.","לבקש מהם כתובת יפנית מדויקת, מספר טלפון, צורת כתיבת שם האורח וחלון תאריך/שעת מסירה מקובל."),B("Do not ship until the answer is positive and saved offline.","לא לשלוח עד שמתקבלת תשובה חיובית ונשמרת אופליין.")],
    links:[[B("Booking.com messages","הודעות Booking.com"),"https://secure.booking.com/myreservations.html"],[B("Yamato travel guide","מדריך Yamato למטיילים"),"https://www.global-yamato.com/en/hands-free-travel/"]]
  },
  {
    id:"kumihimo-receipt", phase:"now", icon:"🏠", kind:B("LUGGAGE","מזוודות"),
    title:B("Confirm the final Tokyo luggage plan","לאשר את תכנית המזוודות לטוקיו הסופית"), due:B("Before booking luggage seats for 18 Oct","לפני הזמנת מושבי מזוודה ל-18 באוקטובר"), people:B("All five","כל החמישה"),
    summary:B("Treat Kumihimo no Ma as an unstaffed apartment unless the host explicitly confirms courier receipt.","להתייחס ל-Kumihimo no Ma כדירה ללא צוות אלא אם המארח מאשר במפורש קבלת שליח."),
    steps:[B("Ask the host whether a person can receive Yamato on 18 October and request exact delivery instructions.","לשאול את המארח אם אדם יכול לקבל Yamato ב-18 באוקטובר ולבקש הוראות מסירה מדויקות."),B("If not, carry the suitcases on the Shinkansen and reserve oversized-baggage seats where required.","אם לא, לקחת את המזוודות בשינקנסן ולהזמין מושבי מזוודה גדולה כשנדרש."),B("A Yamato counter pickup is a fallback only after confirming the counter, opening hours, holding rules, and address format.","איסוף מדלפק Yamato הוא חלופה רק אחרי אישור הדלפק, שעות פתיחה, כללי שמירה וצורת כתובת.")],
    links:[[B("Booking.com messages","הודעות Booking.com"),"https://secure.booking.com/myreservations.html"],[B("Yamato private-lodging warning","אזהרת Yamato ללינה פרטית"),"https://www.global-yamato.com/en/hands-free-travel/pdf/PAL_precautions.pdf"]]
  },
  {
    id:"flights", phase:"before", icon:"✈️", kind:B("FLIGHTS","טיסות"),
    title:B("Recheck flights, seats, and meals","לבדוק מחדש טיסות, מושבים וארוחות"), due:B("7 days before each departure","7 ימים לפני כל יציאה"), people:B("Gilad outbound; family outbound; all five home","גלעד הלוך; המשפחה הלוך; כולם חזור"),
    summary:B("Verify LY flight status, Terminal 1, seats together, and meal requests directly with EL AL.","לאמת סטטוס טיסת LY, טרמינל 1, מושבים יחד ובקשות ארוחה ישירות מול אל על."),
    steps:[B("Open the EL AL booking with the relevant PNR and confirm names exactly match passports.","לפתוח את הזמנת אל על עם ה-PNR המתאים ולאשר שהשמות תואמים בדיוק לדרכונים."),B("Recheck seat assignments and meal requests for every traveler; photograph or save the final itinerary offline.","לבדוק שוב הקצאות מושבים ובקשות ארוחה לכל נוסע; לצלם או לשמור אופליין את המסלול הסופי."),B("Repeat the status and terminal check 24 hours before departure and complete online check-in when available.","לחזור על בדיקת סטטוס וטרמינל 24 שעות לפני היציאה ולהשלים צ׳ק־אין אונליין כשזמין.")],
    links:[[B("EL AL check-in","צ׳ק־אין אל על"),"https://www.elal.com/Checkin/Home/new_Identification/b?language=Eng"]]
  },
  {
    id:"vjw-gilad", phase:"before", icon:"🛂", kind:B("ENTRY","כניסה"),
    title:B("Complete Visit Japan Web for Gilad","להשלים Visit Japan Web לגלעד"), due:B("Before 29 Sep arrival","לפני הנחיתה ב-29 בספטמבר"), people:B("Gilad","גלעד"),
    summary:B("Create the solo arrival record, complete immigration/customs details, and save the current QR screen offline.","ליצור רישום לנחיתת הסולו, להשלים פרטי הגירה/מכס ולשמור אופליין את מסך ה-QR העדכני."),
    steps:[B("Enter passport details, the 29 September flight, and the first-night Tokyo address on the official service.","להזין פרטי דרכון, טיסת 29 בספטמבר וכתובת הלילה הראשון בטוקיו בשירות הרשמי."),B("Complete the available arrival procedures and confirm the record shows as registered.","להשלים את הליכי ההגעה הזמינים ולאשר שהרישום מוצג כמושלם."),B("Save an offline screenshot after the final pre-flight check; the live service remains authoritative if the QR format changes.","לשמור צילום מסך אופליין אחרי הבדיקה הסופית לפני הטיסה; השירות החי נשאר הסמכות אם פורמט ה-QR משתנה.")],
    links:[[B("Official Visit Japan Web guide","מדריך Visit Japan Web רשמי"),"https://www.digital.go.jp/en/policies/visit_japan_web"],[B("Open Visit Japan Web","פתיחת Visit Japan Web"),"https://www.vjw.digital.go.jp/main/#/vjwplo001"]]
  },
  {
    id:"vjw-family", phase:"before", icon:"🛂", kind:B("ENTRY","כניסה"),
    title:B("Complete Visit Japan Web for the arriving family","להשלים Visit Japan Web למשפחה הנוחתת"), due:B("Before 6 Oct arrival","לפני הנחיתה ב-6 באוקטובר"), people:B("Ayelet, Yaara, Geffen, Erel","איילת, יערה, גפן, אראל"),
    summary:B("Create the 6 October arrival and make sure every traveler is covered by the records shown in the official service.","ליצור רישום לנחיתה ב-6 באוקטובר ולוודא שכל נוסע מכוסה ברישומים שמציג השירות הרשמי."),
    steps:[B("Use the official family/accompanying-person workflow where permitted; otherwise create the required individual records.","להשתמש בתהליך המשפחה/מלווים הרשמי כשמותר; אחרת ליצור את הרישומים האישיים הנדרשים."),B("Enter flight LY075, Narita Terminal 1, and the Yoyogi-Uehara accommodation address exactly as booked.","להזין טיסת LY075, נריטה טרמינל 1 וכתובת הלינה ביויוגי־אוהארה בדיוק כפי שהוזמנה."),B("Check the service again shortly before travel and keep accessible offline copies for each person.","לבדוק שוב את השירות סמוך לנסיעה ולשמור עותקים נגישים אופליין לכל אדם.")],
    links:[[B("Official Visit Japan Web guide","מדריך Visit Japan Web רשמי"),"https://www.digital.go.jp/en/policies/visit_japan_web"],[B("Open Visit Japan Web","פתיחת Visit Japan Web"),"https://www.vjw.digital.go.jp/main/#/vjwplo001"]]
  },
  {
    id:"suica-gilad", phase:"before", icon:"💳", kind:B("IC CARD","כרטיס IC"),
    title:B("Set up Gilad’s Suica","להגדיר Suica לגלעד"), due:B("Before departure or at NRT on 29 Sep","לפני היציאה או בנריטה ב-29 בספטמבר"), people:B("Gilad","גלעד"),
    summary:B("Use Welcome Suica Mobile on a compatible iPhone/Apple Watch; otherwise buy one physical card at Narita T1.","להשתמש ב-Welcome Suica Mobile באייפון/Apple Watch תואם; אחרת לקנות כרטיס פיזי בנריטה T1."),
    steps:[B("If using a compatible Apple device, install Welcome Suica Mobile, register, add it to Wallet, turn on Express Card, and test a small top-up.","אם משתמשים במכשיר Apple תואם, להתקין Welcome Suica Mobile, להירשם, להוסיף ל-Wallet, להפעיל Express Card ולבדוק טעינה קטנה."),B("If issuance/top-up is restricted before arrival, retry after entering Japan with location services enabled.","אם הנפקה/טעינה מוגבלות לפני הנחיתה, לנסות שוב אחרי הכניסה ליפן עם שירותי מיקום פעילים."),B("Physical fallback: buy one Welcome Suica at the Narita Airport Terminal 1 station machine or JR East Travel Service Center.","חלופה פיזית: לקנות Welcome Suica אחד במכונה או במרכז השירות של JR East בתחנת נריטה טרמינל 1.")],
    links:[[B("Welcome Suica Mobile","Welcome Suica Mobile"),"https://www.jreast.co.jp/en/multi/welcomesuicamobile/"],[B("Physical purchase locations","נקודות רכישה פיזיות"),"https://www.jreast.co.jp/en/multi/welcomesuica/purchase.html"]]
  },
  {
    id:"suica-ayelet", phase:"before", icon:"💳", kind:B("IC CARD","כרטיס IC"),
    title:B("Set up Ayelet’s Suica","להגדיר Suica לאיילת"), due:B("Before departure or at NRT on 6 Oct","לפני היציאה או בנריטה ב-6 באוקטובר"), people:B("Ayelet","איילת"),
    summary:B("Each traveler needs a separate IC card or device; one card cannot be tapped for several people.","כל נוסע צריך כרטיס IC או מכשיר נפרד; אי אפשר להעביר כרטיס אחד עבור כמה אנשים."),
    steps:[B("On a compatible iPhone/Apple Watch, install and issue Welcome Suica Mobile with Ayelet’s own eligible Apple Pay card.","באייפון/Apple Watch תואם, להתקין ולהנפיק Welcome Suica Mobile עם כרטיס Apple Pay זכאי על שם איילת."),B("Enable Express Card and add a modest starting balance; do not overfund because Welcome Suica balances are non-refundable.","להפעיל Express Card ולהוסיף יתרה התחלתית מתונה; לא לטעון יותר מדי כי יתרות Welcome Suica אינן מוחזרות."),B("If mobile is not workable, buy one physical Welcome Suica at Narita T1 or later at a listed JR East center.","אם המובייל אינו מעשי, לקנות Welcome Suica פיזי אחד בנריטה T1 או אחר כך במרכז JR East שמופיע ברשימה.")],
    links:[[B("Mobile setup","הגדרה במובייל"),"https://www.jreast.co.jp/en/multi/welcomesuicamobile/install.html"],[B("Physical purchase locations","נקודות רכישה פיזיות"),"https://www.jreast.co.jp/en/multi/welcomesuica/purchase.html"]]
  },
  {
    id:"suica-yaara", phase:"before", icon:"💳", kind:B("IC CARD","כרטיס IC"),
    title:B("Set up Yaara’s Suica","להגדיר Suica ליערה"), due:B("Before departure or at NRT on 6 Oct","לפני היציאה או בנריטה ב-6 באוקטובר"), people:B("Yaara · age 20","יערה · בת 20"),
    summary:B("Give Yaara her own mobile or physical IC card and make sure she can top it up herself.","לתת ליערה כרטיס IC נפרד במובייל או פיזי ולוודא שהיא יכולה לטעון אותו בעצמה."),
    steps:[B("Use Welcome Suica Mobile if her Apple device and own Apple Pay payment card are eligible.","להשתמש ב-Welcome Suica Mobile אם מכשיר Apple וכרטיס Apple Pay על שמה זכאים."),B("Turn on Express Card and test the setup before leaving; retry issuance in Japan if regional restrictions apply.","להפעיל Express Card ולבדוק לפני היציאה; לנסות הנפקה שוב ביפן אם חלות מגבלות אזוריות."),B("Otherwise buy one physical adult Welcome Suica and keep its reference paper.","אחרת לקנות Welcome Suica פיזי למבוגר ולשמור את דף האסמכתה.")],
    links:[[B("Welcome Suica Mobile","Welcome Suica Mobile"),"https://www.jreast.co.jp/en/multi/welcomesuicamobile/"],[B("Physical Welcome Suica","Welcome Suica פיזי"),"https://www.jreast.co.jp/en/multi/welcomesuica/purchase.html"]]
  },
  {
    id:"suica-geffen", phase:"before", icon:"💳", kind:B("IC CARD","כרטיס IC"),
    title:B("Set up Geffen’s Suica","להגדיר Suica לגפן"), due:B("Before departure or at NRT on 6 Oct","לפני היציאה או בנריטה ב-6 באוקטובר"), people:B("Geffen · age 17","גפן · בת 17"),
    summary:B("Mobile is possible only with a compatible Apple device and an eligible payment setup; physical is the simple fallback.","מובייל אפשרי רק עם מכשיר Apple תואם והגדרת תשלום זכאית; כרטיס פיזי הוא החלופה הפשוטה."),
    steps:[B("Check the official compatible-device and Apple Pay requirements before relying on mobile.","לבדוק דרישות מכשיר תואם ו-Apple Pay הרשמיות לפני שמסתמכים על מובייל."),B("If eligible, issue her own Welcome Suica Mobile, enable Express Card, and add a small balance.","אם זכאית, להנפיק לה Welcome Suica Mobile נפרד, להפעיל Express Card ולהוסיף יתרה קטנה."),B("Otherwise buy one physical adult Welcome Suica and keep its reference paper.","אחרת לקנות Welcome Suica פיזי למבוגר ולשמור את דף האסמכתה.")],
    links:[[B("Mobile requirements","דרישות מובייל"),"https://www.jreast.co.jp/en/multi/welcomesuicamobile/install.html"],[B("Physical Welcome Suica","Welcome Suica פיזי"),"https://www.jreast.co.jp/en/multi/welcomesuica/purchase.html"]]
  },
  {
    id:"suica-erel", phase:"before", icon:"🎫", kind:B("IC CARD","כרטיס IC"),
    title:B("Buy Erel’s physical Welcome Suica","לקנות Welcome Suica פיזי לאראל"), due:B("At NRT T1 on 6 Oct, or Gilad buys with Erel’s passport","בנריטה T1 ב-6 באוקטובר, או שגלעד קונה עם הדרכון של אראל"), people:B("Erel · age 12","אראל · בן 12"),
    summary:B("Welcome Suica Mobile requires age 13+, so use a physical card and let JR determine child-card eligibility from his birthday.","Welcome Suica Mobile דורש גיל 13+, לכן להשתמש בכרטיס פיזי ולתת ל-JR לקבוע זכאות לכרטיס ילד לפי תאריך הלידה."),
    steps:[B("Bring Erel’s passport. A family member may purchase the card for him, but ID is required for a child card.","להביא את הדרכון של אראל. בן משפחה יכול לקנות עבורו, אך נדרשת תעודה לכרטיס ילד."),B("Ask JR staff or enter the exact birth date at the Narita T1 Welcome Suica machine. A child card is valid only through the first 31 March after the 12th birthday.","לבקש מאיש JR או להזין תאריך לידה מדויק במכונת Welcome Suica בנריטה T1. כרטיס ילד תקף רק עד 31 במרץ הראשון אחרי יום ההולדת ה-12."),B("If he is no longer eligible, buy an adult card. Keep the reference paper with the physical card.","אם הוא כבר לא זכאי, לקנות כרטיס מבוגר. לשמור את דף האסמכתה יחד עם הכרטיס הפיזי.")],
    links:[[B("Official child-card rules","כללי כרטיס ילד רשמיים"),"https://www.jreast.co.jp/en/multi/welcomesuica/purchase.html"]]
  },
  {
    id:"insurance", phase:"before", icon:"🛡", kind:B("DOCUMENTS","מסמכים"),
    title:B("Finalize travel insurance","להשלים ביטוח נסיעות"), due:B("Before the first non-refundable purchase / departure","לפני רכישה לא ניתנת להחזר / היציאה"), people:B("Every traveler","כל נוסע"),
    summary:B("Confirm Japan coverage, medical limits, cancellation/interruption, hiking, and pre-existing-condition rules.","לאשר כיסוי ליפן, גבולות רפואיים, ביטול/קיצור נסיעה, הליכה ותנאים רפואיים קיימים."),
    steps:[B("Check that all five names and exact trip dates are on the policy; Gilad’s solo period must also be covered.","לבדוק שכל חמשת השמות ותאריכי הטיול המדויקים בפוליסה; גם תקופת הסולו של גלעד חייבת להיות מכוסה."),B("Review medical evacuation, trip cancellation, luggage, electronics, and trail/activity exclusions.","לבדוק פינוי רפואי, ביטול נסיעה, מזוודות, אלקטרוניקה והחרגות למסלולים/פעילויות."),B("Save the policy, emergency phone number, and claim instructions offline on at least two phones.","לשמור אופליין את הפוליסה, מספר החירום והוראות התביעה בשני טלפונים לפחות.")], links:[]
  },
  {
    id:"passports", phase:"before", icon:"🛂", kind:B("DOCUMENTS","מסמכים"),
    title:B("Validate passports and make offline copies","לאמת דרכונים ולהכין עותקים אופליין"), due:B("This week","השבוע"), people:B("All five","כל החמישה"),
    summary:B("Check validity, exact ticket-name matches, and secure offline copies.","לבדוק תוקף, התאמה מדויקת לשמות בכרטיסים ועותקים מאובטחים אופליין."),
    steps:[B("Compare every passport name and number against the airline and Visit Japan Web records.","להשוות כל שם ומספר דרכון להזמנת הטיסה ולרישומי Visit Japan Web."),B("Store encrypted scans offline and leave a separate copy with a trusted person.","לשמור סריקות מוצפנות אופליין ולהשאיר עותק נפרד אצל אדם מהימן."),B("Keep passports in hand luggage, never checked luggage.","לשמור דרכונים בתיק יד, לעולם לא במזוודה לבטן המטוס.")], links:[]
  },
  {
    id:"cards-cash", phase:"before", icon:"¥", kind:B("MONEY","כסף"),
    title:B("Prepare cards and a cash plan","להכין כרטיסים ותכנית מזומן"), due:B("Before departure","לפני היציאה"), people:B("Gilad + one backup cardholder","גלעד + בעל כרטיס גיבוי אחד"),
    summary:B("Carry two cards on different networks, test PINs, and plan the first yen withdrawal.","לשאת שני כרטיסים ברשתות שונות, לבדוק קודי PIN ולתכנן משיכת ין ראשונה."),
    steps:[B("Confirm foreign transactions and ATM withdrawals are enabled and note fees.","לאשר שעסקאות בחו״ל ומשיכות כספומט מופעלות ולרשום עמלות."),B("Keep the backup card physically separate from the primary card.","לשמור את כרטיס הגיבוי בנפרד פיזית מהכרטיס הראשי."),B("Arrive with modest yen or withdraw at a supported airport/convenience-store ATM; retain cash for small temples, buses, and rural counters.","להגיע עם סכום ין מתון או למשוך בכספומט נתמך בשדה/חנות נוחות; לשמור מזומן למקדשים קטנים, אוטובוסים ודלפקים כפריים.")], links:[]
  },
  {
    id:"connectivity", phase:"before", icon:"▥", kind:B("PHONE","טלפון"),
    title:B("Install and test connectivity","להתקין ולבדוק תקשורת"), due:B("Before each departure","לפני כל יציאה"), people:B("At least three independent phones","לפחות שלושה טלפונים עצמאיים"),
    summary:B("Use eSIM/roaming that activates in Japan and make sure the family can still coordinate if one phone fails.","להשתמש ב-eSIM/נדידה שמופעלים ביפן ולוודא שהמשפחה יכולה לתאם גם אם טלפון אחד נכשל."),
    steps:[B("Install the plan without activating it too early; save provider activation and APN instructions offline.","להתקין את החבילה בלי להפעיל מוקדם מדי; לשמור אופליין הוראות הפעלה ו-APN של הספק."),B("Enable data roaming only as instructed and test calls/messages after landing.","להפעיל נדידת נתונים רק לפי ההוראות ולבדוק שיחות/הודעות אחרי הנחיתה."),B("Write down Gilad’s Japanese-reachable number or messaging contact for the Narita reunion fallback.","לרשום מספר של גלעד שניתן להשיג ביפן או איש קשר בהודעות כחלופה למפגש בנריטה.")], links:[]
  },
  {
    id:"transfer-voucher", phase:"before", icon:"🚐", kind:B("TRANSFER","הסעה"),
    title:B("Download the family’s Narita transfer voucher","להוריד את שובר ההסעה המשפחתית מנריטה"), due:B("Before 6 Oct flight","לפני טיסת 6 באוקטובר"), people:B("Ayelet + Gilad","איילת + גלעד"),
    summary:B("The exact driver meeting point exists only in the authenticated voucher; keep it on both phones.","נקודת המפגש המדויקת עם הנהג קיימת רק בשובר המאומת; לשמור אותו בשני הטלפונים."),
    steps:[B("Open transfer reference •••• in Booking.com Trips and download or screenshot the full voucher.","לפתוח את ההסעה •••• ב-Booking.com Trips ולהוריד או לצלם את השובר המלא."),B("Record driver/provider phone, pickup instructions, flight-delay procedure, passenger count, and luggage allowance.","לרשום טלפון נהג/ספק, הוראות איסוף, נוהל עיכוב טיסה, מספר נוסעים והקצבת מזוודות."),B("Share the same offline copy with Gilad and Ayelet. Do not rely on an invented numbered pillar or desk.","לשתף את אותו עותק אופליין עם גלעד ואיילת. לא להסתמך על עמוד או דלפק ממוספר מומצא.")],
    links:[[B("Open Booking.com Trips","פתיחת Booking.com Trips"),"https://secure.booking.com/myreservations.html"],[B("Narita T1 map","מפת נריטה T1"),"https://www.narita-airport.jp/en/company/media-center/publications-pamphlets/kannaimap/"]]
  },
  {
    id:"shared-pack", phase:"before", icon:"↓", kind:B("OFFLINE","אופליין"),
    title:B("Build the shared offline travel pack","לבנות חבילת נסיעה משותפת אופליין"), due:B("48 hours before departure","48 שעות לפני היציאה"), people:B("Gilad + Ayelet; read access for everyone","גלעד + איילת; גישת קריאה לכולם"),
    summary:B("Keep critical confirmations usable without mobile data or a Booking.com login.","לשמור אישורים קריטיים שמישים בלי נתונים סלולריים או כניסה ל-Booking.com."),
    steps:[B("Save flights, stays, transfer voucher, rail/timed tickets, insurance, and Visit Japan Web screens into one offline folder.","לשמור טיסות, לינות, שובר הסעה, כרטיסי רכבת/שעה, ביטוח ומסכי Visit Japan Web בתיקייה אופליין אחת."),B("Include Japanese addresses, hotel phone numbers, food cards, and the family meeting fallback.","לכלול כתובות ביפנית, טלפוני לינה, כרטיסי אוכל וחלופת המפגש המשפחתית."),B("Test airplane mode on two phones and print the one-page emergency backup.","לבדוק מצב טיסה בשני טלפונים ולהדפיס גיבוי חירום של עמוד אחד.")], links:[]
  },
  {
    id:"medication", phase:"before", icon:"＋", kind:B("HEALTH","בריאות"),
    title:B("Pack medication and medical documents","לארוז תרופות ומסמכים רפואיים"), due:B("Before departure","לפני היציאה"), people:B("Anyone carrying medication","כל מי שנושא תרופות"),
    summary:B("Carry enough medication in original packaging and check Japan’s import rules for controlled or high-volume items.","לשאת מספיק תרופות באריזה מקורית ולבדוק כללי יבוא ליפן עבור חומרים מבוקרים או כמות גדולה."),
    steps:[B("Pack prescriptions and a clinician letter using generic medication names where relevant.","לארוז מרשמים ומכתב רופא עם שמות גנריים של התרופות כשמתאים."),B("Keep essential medication in hand luggage with a delay buffer.","לשמור תרופות חיוניות בתיק היד עם רזרבה לעיכוב."),B("If any medication may be controlled in Japan, verify the official import procedure before travel.","אם תרופה כלשהי עשויה להיות מבוקרת ביפן, לאמת את הליך היבוא הרשמי לפני הנסיעה.")],
    links:[[B("Japan health ministry import guidance","הנחיות יבוא של משרד הבריאות ביפן"),"https://www.mhlw.go.jp/stf/seisakunitsuite/bunya/kenkou_iryou/iyakuhin/kojinyunyu/topics/tp010401-1_00001.html"]]
  },
  {
    id:"packing", phase:"before", icon:"背", kind:B("PACKING","אריזה"),
    title:B("Finish the five-person packing check","להשלים בדיקת אריזה לחמישה"), due:B("2 days before departure","יומיים לפני היציאה"), people:B("All five","כל החמישה"),
    summary:B("Prioritize walking, rain, bathing, charging, and a light three-night Izu setup.","לתעדף הליכה, גשם, רחצה, טעינה וערכת איזו קלה לשלושה לילות."),
    steps:[B("Each person: broken-in walking shoes, rain shell or compact umbrella, layers, small towel, refillable bottle, and personal toiletries.","לכל אדם: נעלי הליכה שכבר נוסו, מעיל גשם או מטרייה קומפקטית, שכבות, מגבת קטנה, בקבוק למילוי וכלי רחצה אישיים."),B("Shared: power adapters, charging hub, two power banks, cables, laundry bag, and compact first-aid kit.","משותף: מתאמים, מרכז טעינה, שתי סוללות ניידות, כבלים, שק כביסה וערכת עזרה ראשונה קומפקטית."),B("Keep one three-night Izu bag per person separable from the large suitcases.","לשמור תיק איזו לשלושה לילות לכל אדם שניתן להפריד מהמזוודות הגדולות.")], links:[]
  },
  {
    id:"bag-measure", phase:"before", icon:"↔", kind:B("LUGGAGE","מזוודות"),
    title:B("Measure and label every suitcase","למדוד ולתייג כל מזוודה"), due:B("Before 14/18 Oct rail booking is final","לפני שהזמנת רכבות 14/18 באוקטובר סופית"), people:B("Every checked suitcase","כל מזוודה שנשלחת לבטן המטוס"),
    summary:B("Record H + W + D, weight, owner, and whether it needs Shinkansen oversized-baggage space.","לרשום גובה + רוחב + עומק, משקל, בעלים והאם נדרש מקום למזוודה גדולה בשינקנסן."),
    steps:[B("Measure the outermost points including wheels and handles.","למדוד את הנקודות החיצוניות ביותר כולל גלגלים וידיות."),B("Label bags inside and outside with a reachable contact that does not expose the full home address.","לתייג תיקים מבפנים ומבחוץ עם איש קשר זמין בלי לחשוף כתובת בית מלאה."),B("Any bag totaling 161–250 cm requires an oversized-baggage seat reservation on the Tokaido Shinkansen.","כל תיק שסכום ממדיו 161–250 ס״מ דורש הזמנת מושב עם אזור למזוודה גדולה בשינקנסן טוקאידו.")],
    links:[[B("Official Shinkansen baggage rules","כללי מזוודות רשמיים בשינקנסן"),"https://global.jr-central.co.jp/en/info/oversized-baggage/"]]
  },
  {
    id:"nex-arrival", phase:"japan", icon:"🚆", kind:B("TRAIN","רכבת"),
    title:B("Buy Gilad’s Narita Express arrival ticket","לקנות כרטיס Narita Express לנחיתה של גלעד"), due:B("After landing 29 Sep","אחרי הנחיתה ב-29 בספטמבר"), people:B("Gilad","גלעד"),
    summary:B("Buy a reserved N’EX seat after immigration so a flight delay does not strand a fixed train booking.","לקנות מושב שמור ב-N’EX אחרי ההגירה כדי שעיכוב טיסה לא יפיל הזמנת רכבת קשיחה."),
    steps:[B("After customs, go to Narita Airport Terminal 1 Station on B1.","אחרי המכס לרדת לתחנת Narita Airport Terminal 1 בקומה B1."),B("Buy the next comfortable reserved N’EX to the best Tokyo interchange for the final solo hotel.","לקנות את ה-N’EX השמור הנוח הבא למחלף הטוב ביותר למלון הסולו הסופי."),B("Keep enough transfer time and do not board a different reserved service without changing the ticket.","להשאיר מספיק זמן להחלפה ולא לעלות לשירות שמור אחר בלי לשנות את הכרטיס.")],
    links:[[B("Official N’EX tickets","כרטיסי N’EX רשמיים"),"https://www.jreast.co.jp/en/multi/nex/tickets/"],[B("Narita rail access","גישה לרכבת בנריטה"),"https://www.narita-airport.jp/en/access/train/"]]
  },
  {
    id:"family-ic-fallback", phase:"japan", icon:"💳", kind:B("IC CARD","כרטיס IC"),
    title:B("Finish any missing family IC cards","להשלים כרטיסי IC חסרים למשפחה"), due:B("NRT T1 on 6 Oct or a listed JR East center","נריטה T1 ב-6 באוקטובר או מרכז JR East מהרשימה"), people:B("Anyone without a working mobile card","כל מי שאין לו כרטיס מובייל עובד"),
    summary:B("Use physical Welcome Suica cards as the fallback; do not delay the pre-booked driver without checking the voucher window.","להשתמש בכרטיסי Welcome Suica פיזיים כחלופה; לא לעכב את הנהג שהוזמן בלי לבדוק את חלון הזמן בשובר."),
    steps:[B("If the transfer pickup window is tight, Gilad can buy eligible cards earlier at Shibuya/Shinjuku/Tokyo JR East centers; in principle each person gets one card.","אם חלון האיסוף של ההסעה צפוף, גלעד יכול לקנות כרטיסים מתאימים מוקדם יותר במרכזי JR East בשיבויה/שינג׳וקו/טוקיו; עקרונית כל אדם מקבל כרטיס אחד."),B("Otherwise use the Narita T1 Welcome Suica machines after customs and before meeting the driver only if time permits.","אחרת להשתמש במכונות Welcome Suica בנריטה T1 אחרי המכס ולפני המפגש עם הנהג רק אם הזמן מאפשר."),B("Give each person their own card and reference paper; start with a modest balance and add cash later.","לתת לכל אדם כרטיס ודף אסמכתה משלו; להתחיל ביתרה מתונה ולהוסיף מזומן אחר כך.")],
    links:[[B("Official purchase locations","נקודות רכישה רשמיות"),"https://www.jreast.co.jp/en/multi/welcomesuica/purchase.html"]]
  },
  {
    id:"enoshima-pass", phase:"japan", icon:"🚃", kind:B("DAY PASS","כרטיס יומי"),
    title:B("Buy the Enoshima–Kamakura Pass","לקנות Enoshima–Kamakura Pass"), due:B("Morning of 9 Oct","בבוקר 9 באוקטובר"), people:B("All five","כל החמישה"),
    summary:B("Buy on the travel day; it covers the Odakyu round trip from the selected start plus unlimited Enoden rides under the posted rules.","לקנות ביום הנסיעה; הכרטיס מכסה הלוך־חזור באודקיו מנקודת ההתחלה שנבחרה ונסיעות Enoden ללא הגבלה לפי הכללים המפורסמים."),
    steps:[B("Compare the pass against the exact Yoyogi-Uehara start and buy through EMot or an Odakyu counter/machine.","להשוות את הכרטיס לנקודת ההתחלה המדויקת ביויוגי־אוהארה ולקנות דרך EMot או דלפק/מכונת Odakyu."),B("Buy one for each traveler and confirm the validity area before entering the gate.","לקנות אחד לכל נוסע ולאשר את אזור התוקף לפני הכניסה לשער."),B("Keep separate payment ready for buses/taxis to Hōkoku-ji if that optional stop survives the timing gate.","להכין תשלום נפרד לאוטובוס/מונית להוקוקו־ג׳י אם התחנה האופציונלית שורדת את שער הזמן.")],
    links:[[B("Official pass details","פרטי הכרטיס הרשמיים"),"https://www.odakyu.jp/english/passes/enoshima_kamakura/"]]
  },
  {
    id:"yamato-send", phase:"japan", icon:"🧳", kind:B("LUGGAGE","מזוודות"),
    title:B("Send the large bags Tokyo → Kyoto","לשלוח את המזוודות הגדולות מטוקיו לקיוטו"), due:B("10 Oct only after Besso confirms","10 באוקטובר רק אחרי אישור Besso"), people:B("Large family suitcases","המזוודות הגדולות של המשפחה"),
    summary:B("Ship for 14 October delivery and keep only three-night Izu bags.","לשלוח למסירה ב-14 באוקטובר ולהשאיר רק תיקי איזו לשלושה לילות."),
    steps:[B("Use the confirmed staffed pickup/drop-off point and show the saved Besso address and phone to the Yamato clerk.","להשתמש בנקודת איסוף/מסירה מאוישת שאושרה ולהציג לפקיד Yamato את כתובת וטלפון Besso השמורים."),B("Write guest name exactly as Besso requested and desired delivery date 14 October; confirm the clerk accepts that timing.","לכתוב את שם האורח בדיוק כפי ש-Besso ביקשו ואת תאריך המסירה המבוקש 14 באוקטובר; לאשר שהפקיד מקבל את התזמון."),B("Photograph every waybill and keep the tracking receipts until all bags are physically received.","לצלם כל שטר מטען ולשמור את קבלות המעקב עד שכל המזוודות מתקבלות פיזית.")],
    links:[[B("Yamato how-to","איך משתמשים ב-Yamato"),"https://www.global-yamato.com/en/hands-free-travel/?scroll=anc-howto"],[B("Yamato help","עזרת Yamato"),"https://www.global-yamato.com/en/hands-free-travel/helpandsupport/"]]
  },
  {
    id:"day-before-checks", phase:"japan", icon:"☁", kind:B("DAILY","יומי"),
    title:B("Run the evening-before check","לבצע בדיקת ערב לפני"), due:B("Every evening in Japan","כל ערב ביפן"), people:B("Gilad + one rotating family checker","גלעד + בודק משפחתי מתחלף"),
    summary:B("Check weather, opening hours, transport disruption, tickets, meeting points, and the one thing to cut.","לבדוק מזג אוויר, שעות פתיחה, שיבושי תחבורה, כרטיסים, נקודות מפגש והדבר האחד שאפשר לחתוך."),
    steps:[B("Open the next day’s itinerary card and all time-sensitive official links.","לפתוח את כרטיס המסלול של מחר ואת כל הקישורים הרשמיים התלויים בזמן."),B("Confirm first departure, final return, weather gate, ticket QR codes, and whether everyone has enough IC balance.","לאשר יציאה ראשונה, חזרה אחרונה, שער מזג אוויר, קודי QR ויתרת IC מספקת לכולם."),B("Name the optional stop to remove if the family starts late or energy drops.","לציין את התחנה האופציונלית שתוסר אם המשפחה מתחילה מאוחר או האנרגיה יורדת.")], links:[]
  },
  {
    id:"nex-home", phase:"japan", icon:"🚆", kind:B("TRAIN","רכבת"),
    title:B("Reserve the family’s Narita Express home","להזמין Narita Express משפחתי לחזרה"), due:B("Once in Japan; no later than 19 Oct","לאחר ההגעה ליפן; לא יאוחר מ-19 באוקטובר"), people:B("All five · flight LY076","כל החמישה · טיסה LY076"),
    summary:B("Reserve five seats with arrival at Narita T1 by about 15:35, four hours before the supplied 19:35 flight. Confirm current EL AL instructions and the dated train before purchase.", "להזמין חמישה מושבים עם הגעה לנריטה T1 עד בערך 15:35, ארבע שעות לפני טיסת 19:35 שנמסרה. לאשר הנחיות אל על עדכניות ואת הרכבת לתאריך לפני הרכישה."),
    steps:[B("Choose the departure station only after final luggage storage is settled; Shinjuku is the working plan.","לבחור תחנת יציאה רק אחרי שתכנית אחסון המזוודות הסופית נסגרת; שינג׳וקו היא תכנית העבודה."),B("Reserve five together on a train with enough delay buffer and save/collect the tickets as instructed.","להזמין חמישה יחד ברכבת עם רזרבת עיכוב מספקת ולשמור/לאסוף כרטיסים לפי ההוראות."),B("On 20 October retrieve bags first, then reach the N’EX platform early; use live boards for the platform.","ב-20 באוקטובר לאסוף קודם את המזוודות, ואז להגיע מוקדם לרציף N’EX; להשתמש בלוחות החיים לרציף.")],
    links:[[B("Official N’EX tickets","כרטיסי N’EX רשמיים"),"https://www.jreast.co.jp/en/multi/nex/tickets/"]]
  },
  {
    id:"asij", phase:"conditional", icon:"🎓", kind:B("VERIFY","אימות"),
    title:B("Ask ASIJ directly—do not buy around the old lead","לפנות ישירות ל-ASIJ — לא לקנות סביב הכיוון הישן"), due:B("Only if Gilad wants to pursue it","רק אם גלעד רוצה להמשיך"), people:B("Gilad","גלעד"),
    summary:B("No public 3/4 October alumni event was verified; restore it only from a personal invitation or alumni-office confirmation.","לא אומת אירוע בוגרים ציבורי ב-3/4 באוקטובר; להחזיר אותו רק לפי הזמנה אישית או אישור משרד הבוגרים."),
    steps:[B("Contact the alumni office with Gilad’s graduation/attendance details and ask about private or invitation-only events on 3–4 October.","לפנות למשרד הבוגרים עם פרטי הלימודים של גלעד ולשאול על אירועים פרטיים או בהזמנה בלבד ב-3–4 באוקטובר."),B("Require exact date, time, venue, eligibility, registration link, and cost before changing the itinerary.","לדרוש תאריך, שעה, מקום, זכאות, קישור הרשמה ועלות מדויקים לפני שינוי המסלול.")],
    links:[[B("ASIJ alumni community","קהילת בוגרי ASIJ"),"https://www.asij.ac.jp/alumni/alumni-community"]]
  },
  {
    id:"jukkokubune", phase:"conditional", icon:"🛶", kind:B("VERIFY","אימות"),
    title:B("Watch for a 16 October Jukkokubune event sailing","לעקוב אחר הפלגת Jukkokubune ב-16 באוקטובר"), due:B("Check weekly; do not plan around it","לבדוק מדי שבוע; לא לבנות עליה"), people:B("All five","כל החמישה"),
    summary:B("2026 operation is event-based rather than a dependable daily service; the Fushimi canal walk works without it.","ההפעלה ב-2026 מבוססת אירועים ולא שירות יומי אמין; הליכת תעלות פושימי עובדת גם בלעדיה."),
    steps:[B("Check the official 2026 operation page for a public 16 October sailing and any reservation method.","לבדוק בעמוד ההפעלה הרשמי ל-2026 הפלגה ציבורית ב-16 באוקטובר ושיטת הזמנה."),B("Book only a clearly listed official slot; otherwise leave the itinerary unchanged.","להזמין רק מקום רשמי שמופיע בבירור; אחרת להשאיר את המסלול ללא שינוי.")],
    links:[[B("Official 2026 operation page","עמוד הפעלה רשמי ל-2026"),"https://kyoto-fushimi.or.jp/fune/unkou/"]]
  },
  {
    id:"teamlab-planets", phase:"conditional", icon:"✨", kind:B("IF CHOSEN","אם נבחר"),
    title:B("Buy teamLab Planets only if 10 October wins","לקנות teamLab Planets רק אם הוא נבחר ל-10 באוקטובר"), due:B("Immediately after the family vote","מיד אחרי ההצבעה המשפחתית"), people:B("All five","כל החמישה"),
    summary:B("Do not buy both Tokyo and Kyoto by default; Kyoto Biovortex is the stronger itinerary fit.","לא לקנות גם טוקיו וגם קיוטו כברירת מחדל; Kyoto Biovortex מתאים יותר למסלול."),
    steps:[B("If Planets wins the 10 October vote, select an official timed entry for five and check the clothing/water guidance.","אם Planets מנצח בהצבעת 10 באוקטובר, לבחור כניסה רשמית לשעה עבור חמישה ולבדוק הנחיות לבוש/מים."),B("If Kyoto Biovortex is already booked and the family does not want two overlapping experiences, mark this not needed.","אם Kyoto Biovortex כבר הוזמן והמשפחה לא רוצה שתי חוויות חופפות, לסמן כלא נדרש.")],
    links:[[B("Official Planets tickets/info","כרטיסים/מידע רשמי Planets"),"https://www.teamlab.art/e/planets/"]]
  },
  {
    id:"mt-omuro", phase:"conditional", icon:"🌋", kind:B("DAY OF","ביום עצמו"),
    title:B("Check Mt Ōmuro chairlift operation","לבדוק את הפעלת רכבל הר אומורו"), due:B("Morning of 12 Oct","בבוקר 12 באוקטובר"), people:B("All five","כל החמישה"),
    summary:B("The lift can close for wind; buy only after operation is confirmed.","הרכבל עלול להיסגר ברוח; לקנות רק אחרי שההפעלה מאושרת."),
    steps:[B("Check the official operation notice and local weather after the Jōgasaki segment.","לבדוק הודעת הפעלה רשמית ומזג אוויר מקומי אחרי מקטע ג׳וגסאקי."),B("Buy on site only if the lift is running and visibility/energy justify the one-kilometre rim walk.","לקנות במקום רק אם הרכבל פועל והראות/האנרגיה מצדיקות הליכת שפת לוע של קילומטר.")],
    links:[[B("Mt Ōmuro official site","אתר רשמי הר אומורו"),"https://omuroyama.com/"]]
  },
  {
    id:"final-storage", phase:"conditional", icon:"▣", kind:B("VERIFY","אימות"),
    title:B("Confirm 20 October luggage storage","לאשר אחסון מזוודות ב-20 באוקטובר"), due:B("By 18 Oct","עד 18 באוקטובר"), people:B("All five bags","כל המזוודות"),
    summary:B("Do not assume the apartment will hold bags after checkout or that five large lockers will be free.","לא להניח שהדירה תשמור מזוודות אחרי צ׳ק־אאוט או שחמישה לוקרים גדולים יהיו פנויים."),
    steps:[B("Ask the Kumihimo host for written post-checkout storage approval and the latest pickup time.","לבקש ממארח Kumihimo אישור כתוב לאחסון אחרי צ׳ק־אאוט ושעת איסוף מאוחרת ביותר."),B("If unavailable, reserve or identify a staffed left-luggage counter near the chosen N’EX departure station.","אם לא זמין, להזמין או לאתר דלפק שמירת חפצים מאויש ליד תחנת יציאת N’EX שנבחרה."),B("Make sure the counter can hold the number and size of bags and stays open beyond the planned pickup time.","לוודא שהדלפק יכול לשמור את מספר וגודל התיקים ופתוח מעבר לשעת האיסוף המתוכננת.")],
    links:[[B("Open Booking.com Trips","פתיחת Booking.com Trips"),"https://secure.booking.com/myreservations.html"],[B("Shinjuku luggage search","חיפוש שמירת חפצים בשינג׳וקו"),MAP("staffed luggage storage Shinjuku Station")]]
  }
];

const delights = [
  { id:"retro", icon:"📼", title:B("1980s Tokyo mode","מצב טוקיו של שנות ה-80"), text:B("A warmer paper palette and small nostalgic touches—use it for the homecoming days.","פלטת נייר חמה יותר ונגיעות נוסטלגיות קטנות — לימים של החזרה הביתה."), action:B("Toggle mode","הפעלת מצב") },
  { id:"stamp", icon:"朱", title:B("Trip stamp book","ספר חותמות מסע"), text:B("Collect one local stamp for each trip segment on this device.","לאסוף חותמת מקומית אחת לכל מקטע בטיול במכשיר הזה."), action:B("Add next stamp","הוספת החותמת הבאה") },
  { id:"print", icon:"紙", title:B("Clean paper backup","גיבוי נייר נקי"), text:B("Print the itinerary view as a low-ink emergency backup.","להדפיס את תצוגת המסלול כגיבוי חירום חסכוני בדיו."), action:B("Print itinerary","הדפסת המסלול") }
];

const sideQuests = [
  {
    id:"pagoda", icon:"塔", kicker:B("TEMPLE QUEST","משימת מקדש"), title:B("Pagoda + Shinsengumi history","פגודה + היסטוריית שינסנגומי"),
    text:B("Takahata-Fudō gives you a five-story pagoda, temple grounds, and a genuine samurai-era connection. Keep it optional: the core itinerary already has plenty of temples.","טקהאטה־פודו מציע פגודה בת חמש קומות, מתחם מקדש וקשר אמיתי לתקופת הסמוראים. להשאיר כאופציה: במסלול הראשי כבר יש הרבה מקדשים."),
    links:[[B("Official Tokyo guide","המדריך הרשמי של טוקיו"),"https://www.gotokyo.org/en/story/walks-and-tours/edo_hino/index.html"],[B("Open map","פתיחת מפה"),MAP("Takahata Fudoson Tokyo")]]
  },
  {
    id:"muji", icon:"無", kicker:B("DESIGN RESCUE","חילוץ עיצובי"), title:B("MUJI Ginza mission","משימת MUJI גינזה"),
    text:B("Global flagship, stationery temptation, and free ATELIER MUJI exhibitions. A good rain-day or shopping-group add-on—not a compulsory pilgrimage.","חנות הדגל העולמית, פיתויי כלי כתיבה ותערוכות חינם ב־ATELIER MUJI. תוספת טובה לגשם או לקבוצת הקניות — לא עלייה לרגל חובה."),
    links:[[B("MUJI Ginza official","MUJI גינזה הרשמי"),"https://shop.muji.com/jp/ginza/en/"],[B("Open map","פתיחת מפה"),MAP("MUJI Ginza")]]
  },
  {
    id:"uniqlo", icon:"服", kicker:B("PACKING RESCUE","חילוץ אריזה"), title:B("UNIQLO Ginza emergency","מצב חירום UNIQLO גינזה"),
    text:B("Twelve floors, family sizes, alterations, repair, and coffee. Deploy only for a forgotten layer, a weather pivot, or committed LifeWear curiosity.","שתים־עשרה קומות, מידות למשפחה, תיקונים, התאמות וקפה. להפעיל רק לשכבה שנשכחה, שינוי מזג אוויר או סקרנות LifeWear רצינית."),
    links:[[B("Official store page","עמוד החנות הרשמי"),"https://map.uniqlo.com/jp/ja/detail/102383"],[B("Open map","פתיחת מפה"),MAP("UNIQLO Ginza 6-9-5")]]
  },
  {
    id:"konbini", icon:"🍙", kicker:B("¥1,000 CHAOS","כאוס ב־¥1,000"), title:B("Konbini snack roulette","רולטת חטיפי קונביני"),
    text:B("Give one person ¥1,000 and five minutes. They must return with one familiar thing, one mystery thing, and one item selected purely by package design.","נותנים לאדם אחד 1,000 ין וחמש דקות. עליו לחזור עם דבר מוכר, דבר מסתורי ופריט אחד שנבחר רק לפי עיצוב האריזה."),
    secret:"konbini", action:B("Spin the roulette","סיבוב הרולטה")
  },
  {
    id:"stamp", icon:"駅", kicker:B("FREE SOUVENIR","מזכרת חינם"), title:B("Eki-stamp field book","פנקס חותמות תחנה"),
    text:B("Carry a small blank notebook. Look for 駅スタンプ at major stations and tourist desks; stamp only when the queue is short and the ink pad is friendly.","קחו מחברת קטנה וריקה. חפשו 駅スタンプ בתחנות גדולות ובלשכות תיירות; מחתימים רק כשהתור קצר וכרית הדיו ידידותית."),
    planner:true, action:B("Open the stamp book","פתיחת ספר החותמות")
  },
  {
    id:"gacha", icon:"玩", kicker:B("TINY TREASURE","אוצר זעיר"), title:B("Gachapon family draft","דראפט גאצ׳פון משפחתי"),
    text:B("Each person gets one capsule. No swapping until everyone opens theirs; the funniest pull becomes the trip mascot for 24 hours.","כל אחד מקבל קפסולה אחת. אין החלפות עד שכולם פותחים; השליפה המצחיקה ביותר הופכת לקמע הטיול ל־24 שעות."),
    links:[[B("Find Gashapon in Tokyo","מציאת גאצ׳פון בטוקיו"),MAP("Gashapon Department Store Tokyo")]]
  }
];

const secretExperiments = [
  { id:"fortune", icon:"狸", title:B("Tanuki omikuji","אומיקוג׳י טאנוקי"), text:B("Draw a completely unofficial family-travel fortune.","שולפים תחזית משפחתית בלתי רשמית לחלוטין."), action:B("Draw fortune","שליפת מזל") },
  { id:"train", icon:"新", title:B("Shinkansen dash","ספרינט שינקנסן"), text:B("Release a three-car express across the screen.","משחררים אקספרס בן שלושה קרונות לאורך המסך."), action:B("Dispatch train","שיגור רכבת") },
  { id:"kaiju", icon:"怪", title:B("Kaiju warning","אזהרת קאיג׳ו"), text:B("A giant ゴ has breached the bottom navigation.","ゴ ענקי פרץ את הניווט התחתון."), action:B("Sound alarm","הפעלת אזעקה") },
  { id:"samurai", icon:"侍", title:B("Samurai focus","מיקוד סמוראי"), text:B("Nine seconds of discipline for the action checklist.","תשע שניות של משמעת לרשימת הפעולות."), action:B("Enter focus","כניסה למיקוד") },
  { id:"konbini", icon:"🍙", title:B("Konbini roulette","רולטת קונביני"), text:B("Let the tanuki assign a snack mission.","נותנים לטאנוקי להקצות משימת חטיפים."), action:B("Spin","סיבוב") },
  { id:"retro", icon:"📼", title:B("Tokyo 1988","טוקיו 1988"), text:B("Warm the paper and switch on the nostalgia.","מחממים את הנייר ומפעילים נוסטלגיה."), action:B("Toggle era","החלפת תקופה") },
  { id:"chime", icon:"♫", title:B("Secret platform chime","צליל רציף סודי"), text:B("A tiny station farewell—sound starts only after this tap.","פרידת תחנה קטנה — הצליל מתחיל רק אחרי הלחיצה."), action:B("Play chime","נגינת צליל") }
];

const fortunes = [
  B("大吉 · Great luck: the best train is the one with five seats together.","大吉 · מזל גדול: הרכבת הטובה ביותר היא זו עם חמישה מושבים יחד."),
  B("吉 · Good luck: today’s detour contains an excellent vending machine.","吉 · מזל טוב: הסטייה של היום מכילה מכונת משקאות מצוינת."),
  B("中吉 · Medium luck: buy the tiny thing; photograph the enormous thing.","中吉 · מזל בינוני: קנו את הדבר הזעיר; צלמו את הדבר הענקי."),
  B("小吉 · Small luck: the quiet temple bench is part of the itinerary.","小吉 · מזל קטן: ספסל המקדש השקט הוא חלק מהמסלול."),
  B("末吉 · Future luck: platform snacks improve after luggage is forwarded.","末吉 · מזל עתידי: חטיפי רציף משתפרים אחרי ששולחים את המזוודות.")
];

const konbiniChallenges = [
  B("Mission: one onigiri shape nobody can identify, one seasonal drink, and one dessert to split five ways.","משימה: אוניגירי אחד שאיש לא מזהה, משקה עונתי וקינוח אחד לחלוקה לחמישה."),
  B("Mission: choose only by mascot. The package with the strangest face wins.","משימה: בוחרים רק לפי קמע. האריזה עם הפנים המוזרות ביותר מנצחת."),
  B("Mission: find a hot snack, a cold tea, and something that makes everyone ask ‘what is that?’","משימה: מצאו חטיף חם, תה קר ומשהו שגורם לכולם לשאול ׳מה זה?׳"),
  B("Mission: each person selects one item under ¥200; conduct a solemn platform taste test.","משימה: כל אחד בוחר פריט אחד מתחת ל־200 ין; עורכים מבחן טעימה חגיגי ברציף.")
];

const actions = [
  { date:"2026-09-13", title:B("Saphir is on sale now","ספיר במכירה עכשיו"), text:B("Try a JR ticket office/machine for the six-person private Green compartment; use five online Green seats as backup.","לנסות משרד/מכונת JR לתא גרין פרטי לשישה; להשתמש בחמישה מושבי גרין אונליין כחלופה.") },
  { date:"2026-09-15", title:B("Book Sagano + Hozugawa","להזמין סאגאנו + הוזוגאווה"), text:B("Trolley sales open at 00:00 JST for 15 October. Pair train and boat before inventory separates.","מכירת הרכבת נפתחת ב-00:00 JST ל-15 באוקטובר. לחבר רכבת וסירה לפני שהמלאי נפרד.") },
  { date:"2026-09-18", title:B("Book Kyoto → Tokyo Nozomi","להזמין Nozomi מקיוטו לטוקיו"), text:B("Reserve five together and add oversized-baggage seats for any suitcase over 160 cm total dimensions.","להזמין חמישה יחד ולהוסיף מושבי מזוודה גדולה לכל תיק מעל 160 ס״מ בסכום הממדים.") },
  { date:"2026-09-20", title:B("Lock October 10 and birthday","לנעול את 10 באוקטובר ואת יום ההולדת"), text:B("Choose timed experiences before the remaining useful inventory disappears.","לבחור חוויות לשעה לפני שהמלאי השימושי נעלם.") },
  { date:"2026-09-21", title:B("Shibuya Urban Retreat cancellation check","בדיקת ביטול Shibuya Urban Retreat"), text:B("Prototype deadline is 23:59 local today. Verify the live Booking.com policy before acting.","המועד לפי האפליקציה הישנה הוא היום ב-23:59 מקומי. לבדוק מדיניות חיה ב-Booking.com לפני פעולה.") },
  { date:"2026-09-23", title:B("FUKU House cancellation decision","החלטת ביטול FUKU House"), text:B("Prototype deadline only: confirm live terms and the solo-hotel choice.","מועד מהאפליקציה הישנה בלבד: לאשר תנאים חיים ואת בחירת מלון הסולו.") },
  { date:"2026-09-25", title:B("Tokyu Stay decision check","בדיקת החלטת Tokyu Stay"), text:B("Prototype indicates a 25 Sep cancellation point; verify with the live booking.","האפליקציה הישנה מצביעה על נקודת ביטול ב-25 בספטמבר; לבדוק בהזמנה החיה.") },
  { date:"2026-10-03", title:B("Kumihimo cancellation check","בדיקת ביטול Kumihimo"), text:B("Prototype says 23:59 today. Verify in Booking.com.","האפליקציה הישנה אומרת היום 23:59. לבדוק ב-Booking.com.") }
];

// Verified 13 September 2026; dated bookings and live operation still require confirmation.
const optionStops = {
  oct09:{coast:['Enoshima Island','Kotoku-in Great Buddha'],aquarium:['New Enoshima Aquarium','Kotoku-in Great Buddha']},
  oct10:{'maker-day':['TAIKO-LAB Aoyama','Cooking Sun Tokyo'],'odaiba-lab':['Rainbow Sewerage Museum','Tokyo Rinkai Disaster Prevention Park','Small Worlds Tokyo'],warner:['Warner Bros Studio Tour Tokyo'],joypolis:['Tokyo Joypolis'],waterbus:['Tokyo Cruise Asakusa Pier','Small Worlds Tokyo'],planets:['teamLab Planets Tokyo']},
  oct12:{rental:['Kadowaki Suspension Bridge Parking','Mount Omuro'],transit:['Jogasaki Kaigan Station','Kadowaki Suspension Bridge','Jogasaki Kaigan Station','Izu Kogen Station','Izu Shaboten Zoo Bus Stop']},
  oct13:{'slow-izu':['Tokaikan Ito'],kawazu:['Kawazu Station','Kawazu Seven Waterfalls'],zoo:['Izu Shaboten Zoo']},
  oct16:{wagashi:['Fushimi Inari Taisha','38-4 Fukakusa Watamoricho','Gekkeikan Okura Sake Museum'],tea:['Fushimi Inari Taisha','Matcha Tia Fushimi Inari','Gekkeikan Okura Sake Museum'],canals:['Fushimi Inari Taisha','Gekkeikan Okura Sake Museum','Teradaya']},
  oct19:{gcans:['Metropolitan Area Outer Underground Discharge Channel Ryukyukan'],'joypolis-bday':['Tokyo Joypolis'],'warner-bday':['Warner Bros Studio Tour Tokyo'],'water-miniatures':['Tokyo Cruise Asakusa Pier','Small Worlds Tokyo'],'mystery-circus':['Tokyo Mystery Circus'],taiko:['TAIKO-LAB Aoyama']}
};
function selectedRoute(id) {
  let r = [...dayRoutes[id]]; r[2] = [...r[2]];
  if(id==='sep29' && state.soloHotel==='fuku') r[1]='Shinjuku Station';
  if(id==='oct02') r[2]=[];
  if(id==='oct05') r[1]='21_21 DESIGN SIGHT';
  const stops = optionStops[id]?.[state.choices[id]];
  if(stops) {
    r[2]=stops;
    if(id==='oct10') r[1]='Yoyogi-Uehara Station';
    if(id==='oct12') r[3]=state.choices.oct12==='rental'?'driving':'transit';
    if(id==='oct13') r[3]=state.choices.oct13==='slow-izu'?'walking':'transit';
  }
  return r;
}
function routeLinks(route) {
  const stops=[route[0],...(route[2]||[]),route[1]].filter((p,i,a)=>i===0||p!==a[i-1]);
  const legs=stops.slice(1).map((end,i)=> {
    let mode=route[3]||'transit';
    if([stops[i],end].includes('Kadowaki Suspension Bridge') && mode==='transit') mode='walking';
    return external(ROUTE([stops[i],end,[],mode]),`${i+1}. ${esc(stops[i])} → ${esc(end)}`,'compact');
  }).join('');
  return `<details class="route-legs"><summary>⌖ ${state.lang==='he'?'מפה: קטעי המסלול שנבחר':'Map: selected route legs'}</summary><p>${state.lang==='he'?'כל קישור פותח קטע אחד. לבדוק תאריך, אמצעי תחבורה והחלפות; רכבת התיירים והסירות מוזמנות בנפרד.':'Each link opens one leg. Check date, mode and connections; scenic trains and boats require their own tickets.'}</p><div class="card-actions" dir="ltr">${legs}</div></details>`;
}
function selectedSchedule(day) {
  const rows=day.schedule.map(row=>[...row]);
  const option=day.choice?.options.find(o=>o.id===state.choices[day.id]);
  if(!option) return rows;
  if(day.id==='oct09') {rows[1][2]=option.title;rows[1][3]=option.desc;}
  if(day.id==='oct10' && option.id!=='maker-day') {
    const plans={
      'odaiba-lab':[
        ['09:30','💧',B('Rainbow Sewerage Museum','מוזיאון הביוב ריינבו'),B('Allow 60–90 minutes. Saturday fits the usual calendar; check exceptional closure.','להקצות 60–90 דקות. שבת מתאימה ללוח הרגיל; לבדוק סגירה חריגה.')],
        ['11:30','🛟',B('Sona disaster-preparation park, then lunch','פארק ההיערכות לאסונות Sona ואז ארוחה'),B('Allow about one hour plus lunch and local travel; skip this stop if the group is tired.','להקצות כשעה בתוספת ארוחה ונסיעה מקומית; לדלג אם הקבוצה עייפה.')],
        ['14:00','🔬',B('Small Worlds','Small Worlds'),B('Allow 2–3 hours; check current tickets and closing time.','להקצות 2–3 שעות; לבדוק כרטיסים ושעת סגירה עדכניים.')]
      ],
      waterbus:[['10:00','🛥',B('Asakusa cruise at the reserved departure','שיט מאסקוסה בשעה שהוזמנה'),B('Example start only. Confirm the actual pier, destination and sailing; use rail to Ariake if cancelled.','שעת התחלה לדוגמה בלבד. לאשר רציף, יעד והפלגה; להשתמש ברכבת לאריאקה אם בוטל.')],['13:00','🔬',B('Lunch + Small Worlds','ארוחה + Small Worlds'),B('Allow 2–3 hours after the transfer; keep the afternoon flexible.','להקצות 2–3 שעות אחרי המעבר; לשמור אחר צהריים גמיש.')]]
    };
    const middle=plans[option.id]||[['10:00–16:00','🎟',option.title,B(`${option.desc.en} Use the actual booked entry time, allow the duration shown below plus 60–90 minutes each way, and keep lunch/rest flexible.`,`${option.desc.he} להשתמש בשעת הכניסה שהוזמנה, להקצות את המשך המוצג למטה ובנוסף 60–90 דקות לכל כיוון, ולשמור ארוחה ומנוחה גמישות.`)]];
    return [rows[0],...middle,['17:00','🌆',B('Easy return and dinner','חזרה רגועה וארוחת ערב'),B('The selected experience is the day’s main plan.','החוויה שנבחרה היא התכנית המרכזית של היום.')]];
  }
  if(day.id==='oct12') {
    rows[0][2]=option.title;
    rows[0][3]=option.id==='rental'?B('Collect the confirmed five-seat automatic or MPV at Nippon Ito at 08:00 (Toyota starts 09:00). Allow 30 minutes for paperwork; carry every original driver document.','לאסוף את הרכב האוטומטי בעל חמישה מושבים או המיניוואן שאושר ב-Nippon איטו ב-08:00 (Toyota מתחיל 09:00). להקצות 30 דקות לניירת ולשאת כל מסמך נהיגה מקורי.'):B('Check the holiday Izu Kyūkō and Tokai Bus timetable the night before. Allow roughly 30 minutes by rail to Jōgasaki-kaigan, then about 35 minutes walking each way to the bridge, or use a confirmed bus. All times below are estimates; drop Omuro if a transfer is missed.','לבדוק ערב קודם את לוח החג של Izu Kyūkō ו-Tokai Bus. להקצות כ-30 דקות ברכבת לג׳וגסאקי־קאיגן ואז כ-35 דקות הליכה לכל כיוון לגשר, או אוטובוס שאושר. השעות להלן הן הערכות; לוותר על אומורו אם הוחמצה החלפה.');
    rows[4][0]='16:30–18:00';
  }
  if(day.id==='oct13'||day.id==='oct19') {rows[1][2]=option.title;rows[1][3]=B(`${option.desc.en} ${option.meta.en}. Use confirmed provider times; return early enough for dinner.`,`${option.desc.he} ${option.meta.he}. להשתמש בשעות שאושרו ולחזור בזמן לארוחת ערב.`);}
  if(day.id==='oct16') {
    rows[2][2]=option.title;rows[2][3]=option.desc;
    if(option.id==='tea') rows[2][0]='10:00–10:30';
    if(option.id!=='wagashi' && option.id!=='tea') {rows[2][0]='10:00';rows[2][2]=B('Travel south to the canal district','מעבר דרומה לרובע התעלות');rows[2][3]=option.desc;rows[3][0]='10:30–12:30';rows[4][0]='12:30';}
  }
  return rows;
}

actionChecklist.push(
  {id:'saphir-room',phase:'japan',icon:'💎',kind:B('OPTIONAL UPGRADE','שדרוג אופציונלי'),title:B('Attempt the six-person Saphir compartment','לנסות להשיג תא ספיר לשישה'),due:B('29 Sep after landing; keep backup until confirmed','29 בספטמבר אחרי הנחיתה; לשמור גיבוי עד אישור'),people:B('Gilad at JR; room for all five','גלעד ב-JR; תא לכל החמישה'),summary:B('A separate task from securing five Green seats.','משימה נפרדת מהבטחת חמישה מושבי גרין.'),steps:[B('At a JR Ticket Office or supported reserved-seat machine, request Saphir 5 on 11 October, Shibuya 12:30 → Ito, one six-person compartment for five. These rooms are not sold online.','במשרד כרטיסים של JR או מכונת מושבים שמורים תומכת, לבקש ספיר 5 ב-11 באוקטובר, שיבויה 12:30 לאיטו, תא לשישה עבור חמישה. תאים אלה אינם נמכרים אונליין.'),B('Have staff confirm availability, total fare and refund/change fees before replacing the five Green tickets. If unavailable, keep those seats; record the unsuccessful attempt as reviewed.','לבקש מהצוות לאשר זמינות, מחיר כולל ועמלות שינוי/החזר לפני החלפת חמשת כרטיסי הגרין. אם אין מקום, לשמור אותם ולסמן שהניסיון נבדק.')],links:[[B('JR room rules','כללי התאים של JR'),'https://www.jreast.co.jp/saphir/en/cars/ticket/']]},
  {id:'nezu',phase:'now',icon:'館',kind:B('TIMED MUSEUM','מוזיאון מתוזמן'),title:B('Reserve Nezu for 2 October','להזמין נזו ל-2 באוקטובר'),due:B('Now, when the 2 Oct calendar is available','עכשיו, כשנפתח לוח 2 באוקטובר'),people:B('Gilad','גלעד'),summary:B('Keep Nezu; Ōta is closed that day.','לשמור על נזו; אוטה סגור ביום זה.'),steps:[B('Use Nezu’s exhibition/online ticket link for an entry around 10:30. Check the current price and cancellation policy.','להשתמש בקישור התערוכה/כרטיסים של נזו לכניסה סביב 10:30. לבדוק מחיר ותנאי ביטול.'),B('If unavailable, retain the Omotesando architecture walk and Cat Street; do not substitute a closed Ōta visit.','אם אין מקום, לשמור על הליכת האדריכלות באומוטסנדו וקאט סטריט; לא להחליף בביקור באוטה הסגור.')],links:[[B('Nezu official exhibition and tickets','נזו: תערוכה וכרטיסים רשמיים'),'https://www.nezu-muse.or.jp/en/exhibitions/current/']]},
  {id:'gekkeikan',phase:'conditional',icon:'💧',kind:B('MUSEUM','מוזיאון'),title:B('Reserve Gekkeikan if the canal visit includes it','להזמין Gekkeikan אם נכלל בביקור בתעלות'),due:B('After the 16 Oct workshop time is fixed','אחרי קביעת שעת הסדנה ב-16 באוקטובר'),people:B('All five; alcohol tasting only age 20+','כל החמישה; טעימת אלכוהול רק מגיל 20'),summary:B('Advance reservations have priority; walk-ins may be refused when full.','להזמנות מראש יש עדיפות; כניסה במקום עלולה להידחות כשמלא.'),steps:[B('Follow the museum’s reservation link for 16 October after the workshop/transfer. Current hours 09:30–16:30, last entry 16:00. Cashless payment; confirm all five age categories.','להיכנס לקישור ההזמנה במוזיאון ל-16 באוקטובר אחרי הסדנה/המעבר. שעות נוכחיות 09:30–16:30, כניסה אחרונה 16:00. תשלום ללא מזומן; לאשר קטגוריות גיל לכל החמישה.'),B('Geffen and Erel cannot taste alcohol. If sold out or not selected, use the canal walk and Teradaya exterior; mark this task reviewed.','גפן ואראל אינם רשאים לטעום אלכוהול. אם אזל או לא נבחר, לטייל בתעלות ובחזית Teradaya ולסמן שהמשימה נבדקה.')],links:[[B('Gekkeikan museum reservations','הזמנות למוזיאון Gekkeikan'),'https://www.gekkeikan.com/museum/']]},
  {id:'emergency',phase:'before',icon:'☎',kind:B('EMERGENCY PLAN','תכנית חירום'),title:B('Save emergency contacts and a family meeting plan','לשמור אנשי קשר ותכנית מפגש לחירום'),due:B('Before each departure; review together on 6 Oct','לפני כל יציאה; לעבור יחד ב-6 באוקטובר'),people:B('All five, with both adults holding copies','כל החמישה, עותקים אצל שני המבוגרים'),summary:B('110 police; 119 ambulance/fire; JNTO 050-3816-2787.','110 משטרה; 119 אמבולנס/כיבוי; JNTO 050-3816-2787.'),steps:[B('Save the 24-hour JNTO visitor hotline, insurer assistance, hotel address in Japanese, passport copies and a trusted home contact offline on both adult phones.','לשמור בשני טלפוני המבוגרים אופליין את מוקד JNTO ל-24 שעות, סיוע הביטוח, כתובת המלון ביפנית, עותקי דרכון ואיש קשר בבית.'),B('Agree a meeting point if separated, especially at Kawagoe; give each traveler the lodging/contact card. If a phone fails, use the paper copy and ask station staff or police for help.','לקבוע מקום מפגש אם נפרדים, במיוחד בקוואגואה; לתת לכל נוסע כרטיס לינה/קשר. אם טלפון נכשל, להשתמש בעותק הנייר ולבקש עזרה מצוות תחנה או משטרה.')],links:[[B('JNTO emergency help','עזרה בחירום של JNTO'),'https://www.japan.travel/en/plan/hotline/']]}
);
const addTaskStep=(id,en,he,url,label)=>{
  const task=actionChecklist.find(t=>t.id===id);task.steps.push(B(en,he));
  if(url)task.links.push([B(label,label),url]);
};
addTaskStep('mt-omuro','October hours: 09:00–16:00, last down 16:15. Leave queue and return-driving margin. If wind closes it, choose Tōkai-kan/onsen and record the task reviewed.','שעות אוקטובר: 09:00–16:00, ירידה אחרונה 16:15. להשאיר מרווח לתור ולנסיעה בחזרה. אם נסגר ברוח, לבחור Tōkai-kan/אונסן ולסמן שהמשימה נבדקה.','https://omuroyama.com/hours_fare/','Ōmuro hours');
addTaskStep('bag-measure','On the Tokaido Shinkansen, total dimensions over 160 cm and up to 250 cm require a baggage-area seat; over 250 cm cannot be carried. If seats are unavailable, choose another departure, forward the bag or repack smaller.','בשינקנסן טוקאידו, סכום מידות מעל 160 ועד 250 ס״מ מחייב מושב עם אזור מזוודות; מעל 250 ס״מ אסור להעלות. אם אין מושבים, לבחור רכבת אחרת, לשלוח או לארוז קטן יותר.','https://global.jr-central.co.jp/en/info/oversized-baggage/','JR Central baggage');
for(const [id,date] of [['atami-kyoto','14 Sep'],['kyoto-tokyo','18 Sep']]) addTaskStep(id,`Specific seats and oversized-baggage seats open one month before: ${date}, 10:00 JST. Early SmartEX reservations are provisional. Book five during daytime Japan hours: 23:30–05:30 limits a booking to three and has no seat map. If five nearby seats are unavailable, try another departure before accepting a split.`,`מושבים מדויקים ומושבי מזוודות נפתחים חודש לפני: ${date}, בשעה 10:00 ביפן. הזמנה מוקדמת ב-SmartEX זמנית. להזמין חמישה בשעות היום ביפן: 23:30–05:30 מוגבל לשלושה ללא מפת מושבים. אם אין חמישה קרובים, לבדוק רכבת אחרת לפני פיצול.`,'https://smart-ex.jp/en/reservation/useful/accept_time/','SmartEX booking windows');
addTaskStep('enoshima-aquarium','At current rates, three adults (including Yaara 20), Geffen’s high-school ticket with student ID, and Erel’s school-age ticket total ¥11,500. Recheck categories/prices at purchase; without Geffen’s qualifying ID, budget the adult rate.','במחירים הנוכחיים, שלושה מבוגרים (כולל יערה 20), כרטיס תיכון לגפן עם תעודת תלמיד וכרטיס גיל בית ספר לאראל עולים יחד 11,500¥. לבדוק קטגוריות/מחירים ברכישה; ללא תעודה מתאימה לגפן, לתקצב תעריף מבוגר.');



addTaskStep('birthday','G-Cans individual booking opens 19 September at 00:00 JST (18 September 18:00 Israel). Choose the basic course only after confirming age/stairs and a person who understands Japanese safety guidance; the operator does not provide an interpreter. Arrive 30 minutes before, finish check-in at least 10 minutes before. Cancellation becomes 100% from two days before. If language support fails, use Joypolis.','הזמנה אישית ל-G-Cans נפתחת ב-19 בספטמבר 00:00 ביפן (18 בספטמבר 18:00 בישראל). לבחור קורס בסיסי רק אחרי אישור גיל/מדרגות ואדם שמבין הנחיות בטיחות ביפנית; המפעיל אינו מספק מתורגמן. להגיע 30 דקות לפני ולסיים רישום לפחות 10 דקות לפני. דמי ביטול 100% מיומיים לפני. ללא תמיכת שפה, לבחור ג׳ויפוליס.','https://gaikaku.jp/apply/','G-Cans terms');


const taskFallbacks = {
  "hozugawa": [
    "If cancelled, use JR to Arashiyama for a relaxed walking day; review the operator refund notice.",
    "אם בוטל, להגיע ב-JR לאראשיאמה ליום הליכה רגוע ולבדוק הודעת החזר."
  ],
  "teamlab-kyoto": [
    "If no suitable slot, choose another permitted date/time before paying or keep a relaxed Kyoto station evening.",
    "אם אין שעה מתאימה, לבחור תאריך/שעה מותרים לפני תשלום או ערב רגוע ליד תחנת קיוטו."
  ],
  "kyoto-wagashi": [
    "If the host cannot confirm the five places or ingredients, choose the short tea option or canal walk; record this task as reviewed.",
    "אם המארחת אינה מאשרת חמישה מקומות או מרכיבים, לבחור תה קצר או הליכה בתעלות ולסמן שהמשימה נבדקה."
  ],
  "solo-hotel": [
    "If terms are unclear, keep the existing confirmed room and contact the property through your booking; do not cancel both options.",
    "אם התנאים אינם ברורים, לשמור על החדר המאושר ולפנות לנכס דרך ההזמנה; לא לבטל את שתי האפשרויות."
  ],
  "booking-policies": [
    "If the record is inaccessible or unclear, contact the property through its authenticated booking channel before the earliest possible deadline; do not cancel based on prototype text.",
    "אם הרשומה אינה נגישה או ברורה, לפנות לנכס בערוץ ההזמנה המאומת לפני המועד המוקדם האפשרי; לא לבטל לפי טקסט האפליקציה."
  ],
  "besso-receipt": [
    "Without written acceptance, carry bags and reserve any required oversized-baggage seats.",
    "ללא אישור כתוב, לשאת מזוודות ולהזמין מושבי מזוודות גדולות אם נדרש."
  ],
  "flights": [
    "If online check-in or meal changes fail, contact EL AL using the number in the actual booking and arrive at the airport earlier; bring a suitable permitted snack.",
    "אם צ׳ק־אין או שינוי ארוחה נכשלו, לפנות לאל על במספר שבהזמנה בפועל ולהגיע מוקדם יותר; להביא חטיף מתאים ומותר."
  ],
  "vjw-gilad": [
    "If the service fails, ask arrival staff for the applicable paper arrival/customs procedure and carry the lodging details.",
    "אם השירות נכשל, לבקש מצוות ההגעה את הליך הכניסה/מכס בנייר ולהחזיק פרטי לינה."
  ],
  "vjw-family": [
    "If mobile records fail, ask arrival staff for the applicable paper procedure; keep each passport and lodging details ready.",
    "אם הרשומות בנייד נכשלות, לבקש מהצוות הליך נייר מתאים ולהכין כל דרכון ופרטי לינה."
  ],
  "insurance": [
    "If coverage or an exclusion is unresolved, contact your own insurer before departure and avoid an excluded optional activity until covered. Use the insurer link/phone printed on your policy.",
    "אם כיסוי או החרגה אינם ברורים, לפנות למבטח שלכם לפני היציאה ולהימנע מפעילות אופציונלית מוחרגת עד לכיסוי. להשתמש בקישור/טלפון בפוליסה."
  ],
  "passports": [
    "If a document is invalid or inconsistent, contact the issuing authority and airline before departure; an app entry is not a replacement for a valid passport.",
    "אם מסמך אינו תקף או עקבי, לפנות לרשות המנפיקה ולחברת התעופה לפני היציאה; הרשומה באפליקציה אינה תחליף לדרכון תקף."
  ],
  "cards-cash": [
    "If a card fails, use the separately stored backup and modest cash; contact your bank through its official app or number printed on the card.",
    "אם כרטיס נכשל, להשתמש בגיבוי שנשמר בנפרד ובמזומן מתון; לפנות לבנק באפליקציה הרשמית או במספר שעל הכרטיס."
  ],
  "connectivity": [
    "If activation fails, use airport Wi-Fi to contact your provider through the purchased plan, then buy a local SIM/pocket Wi-Fi if necessary. Keep a paper meeting plan.",
    "אם ההפעלה נכשלת, להשתמש ב-Wi-Fi בשדה לפנייה לספק לפי התכנית שנרכשה ואז SIM מקומי/נתב אם נחוץ. לשמור תכנית מפגש בנייר."
  ],
  "transfer-voucher": [
    "If the driver cannot be reached, use the voucher’s support process; then arrange a correctly sized airport taxi/van or reserved rail after confirming all five travelers and bags.",
    "אם לא משיגים נהג, להשתמש בתמיכה שבשובר; לאחר מכן להסדיר מונית/ואן בגודל מתאים או רכבת שמורה אחרי בדיקת כל החמישה והמזוודות."
  ],
  "shared-pack": [
    "If a phone is lost or offline files fail, use the second adult phone and printed contact/address sheet. App offline mode does not make third-party tickets or maps work offline.",
    "אם טלפון אבד או הקבצים נכשלו, להשתמש בטלפון המבוגר השני ובדף כתובות/קשר מודפס. מצב אופליין של האפליקציה אינו מפעיל כרטיסים או מפות חיצוניים אופליין."
  ],
  "medication": [
    "If legality/quantity is unclear, contact the ministry and prescribing clinician before travel; resolve required permits early and do not stop essential medication without medical advice.",
    "אם החוקיות/כמות אינן ברורות, לפנות למשרד ולרופא המרשם לפני הנסיעה; להסדיר היתרים מראש ולא להפסיק תרופה חיונית ללא ייעוץ רפואי."
  ],
  "packing": [
    "Replace a missing essential before departure; nonessential items can be bought locally. Check the actual airline battery/liquid rules via the booking.",
    "להשלים פריט חיוני לפני היציאה; פריטים לא חיוניים אפשר לקנות מקומית. לבדוק כללי סוללות/נוזלים של חברת התעופה דרך ההזמנה."
  ],
  "nex-arrival": [
    "If the preferred train is missed/full, buy the next reserved departure or use the official airport transport desk to select another route.",
    "אם הרכבת הוחמצה/מלאה, לקנות יציאה שמורה הבאה או לבחור מסלול אחר בדלפק התחבורה הרשמי בשדה."
  ],
  "family-ic-fallback": [
    "Until a card is available, buy individual paper tickets; do not share one IC card through a gate.",
    "עד שיש כרטיס, לקנות כרטיסי נייר אישיים; לא להעביר כרטיס IC אחד בין נוסעים בשער."
  ],
  "enoshima-pass": [
    "If the pass is unavailable or not economical, pay each leg with each traveler’s IC card or paper ticket.",
    "אם הפאס אינו זמין או משתלם, לשלם כל קטע בכרטיס IC אישי או בנייר."
  ],
  "yamato-send": [
    "If the clerk cannot accept the delivery date or recipient, keep the bags and use the reserved rail luggage plan.",
    "אם הפקיד אינו מאשר תאריך מסירה או נמען, לשמור את המזוודות ולהשתמש בתכנית המטען ברכבת."
  ],
  "day-before-checks": [
    "If a closure or weather alert appears, choose the day’s stated indoor/rest alternative and handle any cancellation through the actual booking.",
    "אם מופיעה סגירה או התראת מזג אוויר, לבחור חלופת פנים/מנוחה של היום ולטפל בביטול דרך ההזמנה בפועל."
  ],
  "nex-home": [
    "If the booked train is disrupted, immediately consult JR/airport staff for an earlier alternative; a prebooked large taxi or suitable bus needs traffic and luggage capacity checks. Do not spend the airport buffer sightseeing.",
    "אם הרכבת משתבשת, להתייעץ מיד עם צוות JR/השדה על חלופה מוקדמת; מונית גדולה מוזמנת או אוטובוס מתאים מחייבים בדיקת תנועה וקיבולת. לא לבזבז את מרווח השדה בטיול."
  ],
  "asij": [
    "Without a personal invitation, keep the existing public itinerary and mark this optional task reviewed.",
    "ללא הזמנה אישית, לשמור על המסלול הציבורי ולסמן שהמשימה האופציונלית נבדקה."
  ],
  "final-storage": [
    "If no safe storage can be confirmed, take the bags to the airport earlier and drop the final sightseeing loop.",
    "אם אין אחסון בטוח מאושר, לקחת מזוודות לשדה מוקדם יותר ולוותר על סיבוב הטיול האחרון."
  ]
};
for(const [id,pair] of Object.entries(taskFallbacks)) addTaskStep(id,pair[0],pair[1]);
actionChecklist.find(t=>t.id==='passports').links.push([B('Japan visa eligibility','זכאות כניסה ליפן'),'https://www.mofa.go.jp/j_info/visit/visa/short/novisa.html']);
actionChecklist.find(t=>t.id==='medication').links.push([B('Controlled medicines','תרופות מבוקרות'),'https://www.ncd.mhlw.go.jp/shinsei6.html']);

let currentSegment = "all";
let museumFilter = "all";
let checklistFilter = "all";
let toastTimer;

let audioEngine = null;
let audioSuspendTimer;
let monogramClicks = 0;
let konamiIndex = 0;
const konami = ["ArrowUp","ArrowUp","ArrowDown","ArrowDown","ArrowLeft","ArrowRight","ArrowLeft","ArrowRight","b","a"];

const $ = selector => document.querySelector(selector);
const $$ = selector => [...document.querySelectorAll(selector)];
const L = value => {
 const text = typeof value === 'string' ? value : (value?.[state.lang] ?? value?.en ?? '');
 return state.lang === 'he' ? text.replace(/(?:[¥~]?\d+(?::\d+)?(?:[,.]\d+)*(?:[–−/→]\d+(?::\d+)?(?:[,.]\d+)*)*(?:[%¥])?)/g, token => '\u2066'+token+'\u2069') : text;
};
const esc = value => String(value).replace(/[&<>"']/g, char => ({ "&":"&amp;", "<":"&lt;", ">":"&gt;", '"':"&quot;", "'":"&#39;" })[char]);
let storageAvailable = true;
const persist = () => {
  try { localStorage.setItem(STORE_KEY, JSON.stringify(state)); storageAvailable = true; }
  catch { storageAvailable = false; }
  let notice = document.querySelector('#storageNotice');
  if (!storageAvailable && !notice) {
    notice = document.createElement('p'); notice.id = 'storageNotice'; notice.setAttribute('role', 'alert');
    document.querySelector('main').prepend(notice);
  }
  if (notice) {
    notice.hidden = storageAvailable;
    notice.textContent = state.lang === 'he' ? 'השמירה במכשיר חסומה או מלאה. השינויים זמניים; העתיקו הערות לפני סגירה.' : 'Device storage is unavailable or full. Changes are temporary; copy your notes before closing.';
  }
  return storageAvailable;
};
const motionBehavior = () => matchMedia('(prefers-reduced-motion: reduce)').matches ? 'auto' : 'smooth';
// Preserve keyboard position and disclosure state when a component is refreshed.
function preserveUI(render) {
  const active = document.activeElement;
  const attrs = ['id','data-segment','data-checklist-filter','data-museum-filter','data-check','data-ticket','data-choice-key','data-secret','data-delight'];
  const attr = attrs.find(a => active?.hasAttribute(a));
  let selector = attr ? '['+attr+'="'+CSS.escape(active.getAttribute(attr))+'"]' : null;
  if (attr === 'data-choice-key') selector += '[value="'+CSS.escape(active.value)+'"]';
  const open = new Map([...document.querySelectorAll('details[data-panel]')].map(el => [el.dataset.panel,el.open]));
  render();
  document.querySelectorAll('details[data-panel]').forEach(el => { if(open.has(el.dataset.panel)) el.open=open.get(el.dataset.panel); });
  if(selector && !active.isConnected) document.querySelector(selector)?.focus({preventScroll:true});
}
const external = (url, label, extra = "") => `<a class="link-button ${extra}" href="${url}" target="_blank" rel="noreferrer">${label}<span aria-hidden="true">↗</span></a>`;

function showToast(message) {
  const toast = $("#toast");
  toast.textContent = message;
  toast.classList.add("show");
  clearTimeout(toastTimer);
  toastTimer = setTimeout(() => toast.classList.remove("show"), 1900);
}

function openSecrets() {
  const dialog = $("#secretsDialog");
  if (!dialog.open) dialog.showModal();
}

function runTrain() {
  const train = $("#trainEasterEgg");
  train.classList.remove("run");
  void train.offsetWidth;
  train.classList.add("run");
}

function runKaiju() {
  const kaiju = $("#kaiju");
  kaiju.classList.add("show");
  setTimeout(() => kaiju.classList.remove("show"), 3600);
}

function runSamuraiFocus() {
  document.body.classList.add("samurai-mode");
  $("#samuraiMission").classList.add("show");
  $("#samuraiMission").setAttribute("aria-hidden", "false");
  setTimeout(() => {
    document.body.classList.remove("samurai-mode");
    $("#samuraiMission").classList.remove("show");
    $("#samuraiMission").setAttribute("aria-hidden", "true");
  }, 9000);
}

async function playStationChime() {
  audioEngine ||= createAudioEngine();
  if (!audioEngine) return;
  clearTimeout(audioSuspendTimer);
  await audioEngine.ctx.resume();
  const wasPlaying = audioEngine.playing;
  if (!wasPlaying) audioEngine.master.gain.setValueAtTime(state.volume, audioEngine.ctx.currentTime);
  audioEngine.chime(true);
  if (!wasPlaying) {
    audioEngine.master.gain.linearRampToValueAtTime(0, audioEngine.ctx.currentTime + 3.1);
    audioSuspendTimer = setTimeout(() => { if (!audioEngine.playing) audioEngine.ctx.suspend(); }, 3300);
  }
}

function markSecret(id) {
  state.discoveries[id] = true;
  persist();
  preserveUI(renderSecrets);
}

async function triggerSecret(id, revealPanel = false) {
  if (revealPanel) openSecrets();
  markSecret(id);
  let result = "";
  if (["train","kaiju","samurai"].includes(id) && $("#secretsDialog").open) $("#secretsDialog").close();
  if (id === "fortune") result = L(fortunes[Math.floor(Math.random() * fortunes.length)]);
  if (id === "train") { runTrain(); result = state.lang === "he" ? "השינקנסן שוגר. בבקשה לעמוד מאחורי הקו הצהוב." : "Shinkansen dispatched. Please stand behind the yellow line."; }
  if (id === "kaiju") { runKaiju(); result = state.lang === "he" ? "התראת קאיג׳ו: ゴ נצפה ליד הניווט התחתון." : "Kaiju alert: ゴ sighted near the bottom navigation."; }
  if (id === "samurai") { runSamuraiFocus(); result = state.lang === "he" ? "מצב מיקוד פעיל לתשע שניות. משימת הכנה אחת — עכשיו." : "Focus mode is active for nine seconds. One prep task—now."; }
  if (id === "konbini") result = L(konbiniChallenges[Math.floor(Math.random() * konbiniChallenges.length)]);
  if (id === "retro") {
    state.retro = !state.retro;
    persist();
    renderStaticText();
    result = state.lang === "he" ? `טוקיו 1988 ${state.retro ? "פועל" : "כבוי"}. הקלטת הוחזרה למקומה.` : `Tokyo 1988 is ${state.retro ? "on" : "off"}. The cassette has been returned safely.`;
  }
  if (id === "chime") { await playStationChime(); result = state.lang === "he" ? "צליל התחנה נוגן. אין הכרזה על עיכוב." : "Station chime played. No delay has been announced."; }
  if (result) $("#secretResult").textContent = result;
  showToast(state.lang === "he" ? "סוד התגלה ונשמר" : "Secret discovered and saved");
}

function renderSideQuests() {
  $("#sideQuestGrid").innerHTML = sideQuests.map(item => {
    const actions = item.links?.map(link => external(link[1], L(link[0]), "compact")).join("") ||
      (item.secret ? `<button class="ghost-button compact" type="button" data-secret="${item.secret}" data-reveal-panel="true">${L(item.action)} <span aria-hidden="true">→</span></button>` :
      `<button class="ghost-button compact" type="button" data-go-planner="true">${L(item.action)} <span aria-hidden="true">→</span></button>`);
    return `<article class="side-quest-card"><span class="side-quest-icon" aria-hidden="true">${item.icon}</span><div><p class="eyebrow">${L(item.kicker)}</p><h4>${L(item.title)}</h4><p>${L(item.text)}</p><div class="card-actions">${actions}</div></div></article>`;
  }).join("");
}

function renderSecrets() {
  const found = secretExperiments.filter(item => state.discoveries[item.id]).length;
  $("#secretBadge").textContent = `${found}/${secretExperiments.length}`;
  $("#secretBadge").classList.toggle("is-complete", found === secretExperiments.length);
  $("#secretsCount").textContent = `${found}/${secretExperiments.length}`;
  $("#secretGrid").innerHTML = secretExperiments.map(item => {
    const discovered = Boolean(state.discoveries[item.id]);
    return `<article class="secret-card ${discovered ? "is-found" : ""}"><span class="secret-icon" aria-hidden="true">${item.icon}</span><div><span class="found-label">${discovered ? (state.lang === "he" ? "✓ התגלה" : "✓ Found") : (state.lang === "he" ? "לא נוסה" : "Untested")}</span><h3>${L(item.title)}</h3><p>${L(item.text)}</p><button class="ghost-button compact" type="button" data-secret="${item.id}">${L(item.action)}</button></div></article>`;
  }).join("");
}

function renderStaticText() {
  document.documentElement.lang = state.lang;
  document.documentElement.dir = state.lang === "he" ? "rtl" : "ltr";
  document.title = state.lang === "he" ? "יפן 2026 · מרכז הטיול של משפחת הורן" : "Japan 2026 · Horn Family Trip Control Center";
  $$('[data-i18n]').forEach(node => {
    const item = T[node.dataset.i18n];
    if (item) node.textContent = L(item);
  });
  $(".skip-link").textContent = L(T.skip);
  $(".desktop-rail").setAttribute("aria-label", L(T.primary));
  $("#mobileNav").setAttribute("aria-label", L(T.primary));
  $("#segmentTabs").setAttribute("aria-label", L(T.tripSegments));
  $(".hero-grid").setAttribute("aria-label", L(T.tripOverview));
  $("#soundToggle").setAttribute("aria-label", L(T.openSound));
  $("#monogram").setAttribute("aria-label", state.lang === "he" ? "חותם יפן: חמש לחיצות לרכבת הסודית" : "Japan seal: tap five times for the secret train");
  $("#foodDialog .dialog-close").setAttribute("aria-label", L(T.close));
  $("#secretsDialog .dialog-close").setAttribute("aria-label", L(T.close));
  $("#secretsToggle").setAttribute("aria-label", L(T.openSecrets));
  $("#languageToggle").setAttribute("aria-label", state.lang === "en" ? "Switch to Hebrew" : "מעבר לאנגלית");
  document.body.classList.toggle("retro-mode", Boolean(state.retro));
}

function renderNav() {
  const markup = navItems.map(item => `
    <button class="nav-button" type="button" data-view-target="${item.id}" ${state.lastView === item.id ? 'aria-current="page"' : ""}>
      <span class="nav-icon" aria-hidden="true">${item.icon}</span><span>${L(item.label)}</span>
    </button>`).join("");
  const mobileMarkup = navItems.map(item => `
    <button class="nav-button" type="button" data-view-target="${item.id}" ${state.lastView === item.id ? 'aria-current="page"' : ""}>
      <span class="nav-icon" aria-hidden="true">${item.icon}</span><span>${L(item.short)}</span>
    </button>`).join("");
  $("#desktopNav").innerHTML = markup;
  $("#mobileNav").innerHTML = mobileMarkup;
}

function showView(id, focus = false) {
  if (!navItems.some(item => item.id === id)) id = "itinerary";
  state.lastView = id;
  persist();
  $$(".view").forEach(view => view.classList.toggle("is-active", view.dataset.view === id));
  $$('[data-view-target]').forEach(button => {
    if (button.dataset.viewTarget === id) button.setAttribute("aria-current", "page");
    else button.removeAttribute("aria-current");
  });
  if (focus) {
    const view = $(`#view-${id}`);
    window.scrollTo({ top: 0, behavior: motionBehavior() });
    setTimeout(() => view?.focus({ preventScroll: true }), 250);
  }
}

function dateParts(iso) {
  const date = new Date(`${iso}T12:00:00`);
  const locale = state.lang === "he" ? "he-IL" : "en-GB";
  return {
    day: new Intl.DateTimeFormat(locale, { day: "2-digit" }).format(date),
    month: new Intl.DateTimeFormat(locale, { month: "short" }).format(date).replace("׳", "").toUpperCase(),
    full: new Intl.DateTimeFormat(locale, { weekday: "short", day: "numeric", month: "short" }).format(date)
  };
}

function todayISO() {
  const now = new Date();
  const y = now.getFullYear();
  const m = String(now.getMonth() + 1).padStart(2, "0");
  const d = String(now.getDate()).padStart(2, "0");
  return `${y}-${m}-${d}`;
}

function renderStatus() {
  const today = new Date();
  today.setHours(0,0,0,0);
  const start = new Date("2026-09-29T00:00:00");
  const end = new Date("2026-10-20T23:59:59");
  let label;
  let progress = 0;
  if (today < start) {
    const diff = Math.ceil((start - today) / 86400000);
    label = `<strong>${diff}</strong> ${L(T.daysUntil)} · ${state.lang === "he" ? "29 בספטמבר–20 באוקטובר 2026" : "29 Sep–20 Oct 2026"} · 22 ${state.lang === "he" ? "ימים" : "days"}`;
  } else if (today <= end) {
    const day = Math.floor((today - start) / 86400000) + 1;
    progress = Math.min(100, Math.max(0, day / 22 * 100));
    label = `<strong>${L(T.tripLive)} ${day}/22</strong> · ${L(T.today)}: ${dateParts(todayISO()).full}`;
  } else {
    progress = 100;
    label = `<strong>${L(T.memoryMode)}</strong> · 22 ${state.lang === "he" ? "ימי מסע" : "trip days"}`;
  }
  $("#statusStrip").innerHTML = `<span>${label}</span><span class="progress-track" role="progressbar" aria-valuemin="0" aria-valuemax="100" aria-valuenow="${Math.round(progress)}" aria-label="${L(T.tripProgress)}"><span class="progress-fill" style="width:${progress}%"></span></span>`;
}

function renderHero() {
  const now = new Date(); now.setHours(0,0,0,0);
  const start = new Date("2026-09-29T00:00:00");
  const end = new Date("2026-10-20T23:59:59");
  let number, label, micro;
  if (now < start) {
    number = Math.ceil((start - now) / 86400000);
    label = L(T.daysUntil);
    micro = state.lang === "he" ? "טוקיו · איזו · קיוטו · טוקיו" : "Tokyo · Izu · Kyoto · Tokyo";
  } else if (now <= end) {
    number = Math.floor((now - start) / 86400000) + 1;
    label = `${L(T.tripLive)} / 22`;
    micro = state.lang === "he" ? "היום במסלול שלכם" : "Today in your itinerary";
  } else {
    number = "22";
    label = L(T.memoryMode);
    micro = state.lang === "he" ? "הערות וחותמות נשמרו במכשיר הזה" : "Notes and stamps remain on this device";
  }
  $("#countdownCard").innerHTML = `<p class="eyebrow">${L(T.countdown)}</p><div><span class="count-number">${number}</span><span class="count-label">${label}</span></div><div class="micro-row">${micro}</div>`;

  const iso = todayISO();
  const next = actions.find(action => action.date >= iso);
  $("#nextActionCard").innerHTML = next ? `
    <div><p class="eyebrow">${L(T.nextAction)} · ${dateParts(next.date).full}</p><h3>${L(next.title)}</h3><p>${L(next.text)}</p></div>
    <button class="primary-button compact" type="button" data-view-target="planner">${state.lang === "he" ? "פתיחת מרכז הפעולות" : "Open action desk"}</button>` : `
    <div><p class="eyebrow">${L(T.nextAction)}</p><h3>${L(T.noUrgentAction)}</h3><p>${state.lang === "he" ? "בדקו את הכרטיסים וההערות שנשמרו." : "Review saved tickets and notes."}</p></div>`;
}

function renderSegments() {
  $("#segmentTabs").innerHTML = segments.map(segment => `<button class="segment-tab" type="button" data-segment="${segment.id}" aria-pressed="${currentSegment === segment.id}">${L(segment.label)}</button>`).join("");
  $("#legendRow").innerHTML = [
    ["#3f6657", T.verified], ["#b58b2e", T.weatherPlan], ["#b9453b", T.reservationNeeded], ["#2e718c", T.gentle]
  ].map(([color,label]) => `<span class="legend-item"><span class="legend-swatch" style="background:${color}"></span>${L(label)}</span>`).join("");
}

function renderChoice(choice) {
  const selected = state.choices[choice.key] || choice.options[0].id;
  return `<fieldset class="choice-grid"><legend>${state.lang === "he" ? "בחרו אפשרות אחת" : "Choose one option"}</legend>${choice.options.map(option => `
    <label class="choice-card ${selected === option.id ? "is-selected" : ""}">
      <input type="radio" name="choice-${choice.key}" value="${option.id}" data-choice-key="${choice.key}" ${selected === option.id ? "checked" : ""}>
      <span class="choice-copy"><strong>${L(option.title)} ${option.rec ? `<em>${L(T.recommended)}</em>` : ""}</strong><small>${L(option.meta)}</small><span class="choice-description">${L(option.desc)}</span>${option.facts ? `<span class="choice-facts">${option.facts.map(fact => `<i>${L(fact)}</i>`).join("")}</span>` : ""}</span>
    </label>`).join("")}</fieldset>`;
}

function renderDay(day, index, forceOpen = "") {
  const date = dateParts(day.date);
  const todayClass = todayISO() === day.date ? "is-today" : "";
  const completeClass = state.completed[day.id] ? "is-complete" : "";
  const isOpen = todayISO() === day.date || (todayISO() < "2026-09-29" && day.id === "sep29") || currentSegment !== "all" || forceOpen === day.id;
  const photo = day.photo ? `<figure class="day-photo"><img loading="lazy" src="${day.photo.src}" alt="${L(day.photo.alt)}"><figcaption>${L(T.photoCredit)}: <a href="${day.photo.url}" target="_blank" rel="noreferrer">${day.photo.credit}</a></figcaption></figure>` : "";
  return `<article class="day-card ${todayClass} ${completeClass}" data-day-card="${day.id}">
    <div class="date-marker"><strong>${date.day}</strong><span>${date.month}</span></div>
    <details data-panel="day-${day.id}" class="day-panel" ${isOpen ? "open" : ""}>
      <summary class="day-summary">
        <div><p class="eyebrow">${date.full} · ${L(segments.find(segment => segment.id === day.segment).label)}</p><h3>${day.icon} ${L(day.title)}</h3><p>${L(day.subtitle)}</p></div>
        <span class="chevron" aria-hidden="true">⌄</span>
      </summary>
      <div class="day-body">
        <div class="day-strap">${day.tags.map(([key,color]) => `<span class="tag ${color}">${L(T[key] || B(key,key))}</span>`).join("")}</div>
        ${photo}
        <div class="schedule-list">${selectedSchedule(day).map(row => `<div class="schedule-row"><div class="schedule-time">${row[0]}</div><div class="schedule-icon" aria-hidden="true">${row[1]}</div><div class="schedule-copy"><h4>${L(row[2])}</h4><p>${L(row[3])}</p></div></div>`).join("")}</div>
        ${day.choice ? renderChoice(day.choice) : ""}
        ${day.callout ? `<div class="callout ${day.callout[0]}">${L(day.callout[1])}</div>` : ""}
        <div class="day-links">${routeLinks(selectedRoute(day.id))}${day.links.map(link => external(link[1], `↗ ${L(link[0])}`)).join("")}${external(PHOTOS(photoQueries[day.id]), `▧ ${L(T.photos)}`)}${external(`https://www.google.com/search?q=${encodeURIComponent(`${day.segment === "izu" ? "Ito Shizuoka" : day.segment === "kyoto" ? "Kyoto" : day.segment === "finale" && day.id === "oct18" ? "Kawagoe" : "Tokyo"} weather`)}`, `☁ ${state.lang === "he" ? "מזג אוויר" : "Weather"}`)}</div>
        <div class="note-area"><label for="note-${day.id}">${L(T.notes)}</label><textarea id="note-${day.id}" data-note="${day.id}" placeholder="${L(T.notePlaceholder)}">${esc(state.notes[day.id] || "")}</textarea></div>
      </div>
    </details>
    <div class="summary-actions day-controls">
      <button class="round-button ${state.favorites[day.id] ? 'is-active' : ''}" type="button" data-favorite="${day.id}" aria-pressed="${Boolean(state.favorites[day.id])}" aria-label="${L(T.favorite)}: ${esc(L(day.title))}">★</button>
      <button class="round-button ${state.completed[day.id] ? 'is-active' : ''}" type="button" data-complete="${day.id}" aria-pressed="${Boolean(state.completed[day.id])}" aria-label="${L(T.complete)}: ${esc(L(day.title))}">✓</button>
    </div>
  </article>`;
}

function renderTimeline(forceOpen = "") {
  const filtered = currentSegment === "all" ? days : days.filter(day => day.segment === currentSegment);
  $("#timeline").innerHTML = filtered.map((day,index) => renderDay(day,index,forceOpen)).join("");
}

function copyControl(value) {
  if(value === '••••') return '<span>' + (state.lang === 'he' ? 'לצפייה בקוד: לפתוח את אישור ההזמנה' : 'See your booking confirmation for the code') + '</span>';
  return `<span class="copy-line"><bdi>${value}</bdi><button class="copy-mini" type="button" data-copy="${value}" aria-label="${L(T.copiedNumber)}">⧉</button></span>`;
}

function renderStays() {
  const soloOptions = [
    { id:"undecided", title:L(T.undecided), sub: state.lang === "he" ? "הניסוח הנכון עד החלטה" : "The honest state until a decision is made" },
    { id:"tokyu", title:"Tokyu Stay Aoyama Premier", sub: state.lang === "he" ? "האפליקציה הישנה: כ-$1,641, ביטול 25 בספטמבר — לבדוק חי" : "Prototype: about $1,641, cancel 25 Sep—verify live" },
    { id:"fuku", title:"FUKU House Shinjuku", sub: state.lang === "he" ? "האפליקציה הישנה: 242,690¥, ביטול 23 בספטמבר, אישור ••••" : "Prototype: ¥242,690, cancel 23 Sep, conf ••••" }
  ];
  $("#stayDecision").innerHTML = `<section class="decision-box"><p class="eyebrow">${state.lang === "he" ? "החלטה פתוחה" : "OPEN DECISION"}</p><h3>${L(T.chooseHotel)}</h3><p>${state.lang === "he" ? "שתי אפשרויות מהמסמך המקורי. האפליקציה לעולם אינה מסמנת אחת כמוזמנת בלי החלטה שלך." : "Two options from the original record. The app never calls either booked without your decision."}</p><div class="option-switch">${soloOptions.map(option => `<label><input type="radio" name="solo-hotel" value="${option.id}" ${state.soloHotel === option.id ? "checked" : ""}><span><strong>${option.title}</strong><small>${option.sub}</small></span></label>`).join("")}</div></section>`;

  $("#staysGrid").innerHTML = stays.map(stay => `<article class="data-card stay-card">
    <div class="card-topline"><div><span class="card-kicker">${L(stay.status)}</span><h3><bdi>${stay.name}</bdi></h3><p>${L(stay.dates)}</p></div><span class="icon-chip" aria-hidden="true">${stay.icon}</span></div>
    <dl class="detail-list"><dt>${L(T.address)}</dt><dd>${L(stay.address)}</dd><dt>${L(T.station)}</dt><dd>${L(stay.station)}</dd><dt>${L(T.confirmation)}</dt><dd>${copyControl(stay.confirmation)}</dd><dt>${state.lang === "he" ? "טלפון" : "Phone"}</dt><dd><bdi>${stay.phone}</bdi></dd></dl>
    <p class="lead"><strong>${state.lang === "he" ? "הגעה: " : "Arrival: "}</strong>${L(stay.route)}</p>
    <p><strong>${L(T.luggage)}:</strong> ${L(stay.luggage)}</p>
    ${stay.parking ? `<p><strong>${state.lang === "he" ? "חניה" : "Parking"}:</strong> ${L(stay.parking)}</p>` : ""}
    <div class="card-actions">${external(stay.map, `⌖ ${L(T.map)}`, "primary")}${external(DIR(typeof stay.address === "string" ? stay.address : stay.name), state.lang === "he" ? "מסלול הגעה" : "Directions")}${external(PHOTOS(stay.name), L(T.photos))}${stay.official ? external(stay.official, L(T.official)) : ""}${external("https://secure.booking.com/myreservations.html", "Booking.com")}</div>
    <div class="deadline-strip">${L(T.cancellation)} · ${L(stay.cancellation)}</div>
  </article>`).join("");
}

function renderFlights() {
  $("#flightsGrid").innerHTML = flights.map(flight => `<article class="data-card flight-card">
    <span class="card-kicker">${L(flight.tag)} · ${L(flight.date)}</span><h3>${flight.flight}</h3>
    <div class="flight-route"><span class="airport">${flight.from}</span><span class="route-line"></span><span class="airport">${flight.to}</span></div>
    <div class="flight-time"><strong>${flight.times.split("→")[0]}</strong><strong>${flight.times.split("→")[1]}</strong></div>
    <dl class="detail-list"><dt>PNR</dt><dd>${copyControl(flight.pnr)}</dd><dt>${L(T.seat)}</dt><dd>${L(flight.seat)}</dd><dt>${state.lang === "he" ? "טרמינל" : "Terminal"}</dt><dd>${L(flight.terminal)}</dd></dl>
    <div class="card-actions">${external("https://www.elal.com/Checkin/Home/new_Identification/b?language=eng", state.lang === "he" ? "צ׳ק־אין אל על" : "EL AL check-in", "primary")}${external("https://www.narita-airport.jp/en/company/media-center/publications-pamphlets/kannaimap/", state.lang === "he" ? "מפת T1" : "T1 map")}</div>
  </article>`).join("");
  $("#airportReunion").innerHTML = `<article class="airport-reunion data-card">
    <div class="card-topline"><div><span class="card-kicker">6 OCT · NARITA TERMINAL 1</span><h3>${state.lang === "he" ? "כרטיס מפגש בשדה התעופה" : "Airport reunion card"}</h3><p class="lead">${state.lang === "he" ? "גלעד ממתין באולם מקבלי הפנים הציבורי בקומה 1 אחרי בדיקת הטיסה החיה ואגף הנחיתה." : "Gilad waits in the public 1F International Arrivals lobby after checking the live flight and arrival wing."}</p></div><span class="icon-chip" aria-hidden="true">👋</span></div>
    <div class="reunion-steps">
      <div><strong>1 · ${state.lang === "he" ? "המשפחה" : "Family"}</strong><span>${state.lang === "he" ? "הגירה ← מזוודות ← מכס ← אולם ציבורי. אם גלעד לא נראה, לא עוזבים את הטרמינל: נפגשים בדלפק מידע ומשתפים מיקום חי." : "Immigration → baggage → customs → public hall. If Gilad is not visible, stay in the terminal: regroup at an Information counter and share live location."}</span></div>
      <div><strong>2 · ${state.lang === "he" ? "הנהג" : "Driver"}</strong><span>${state.lang === "he" ? "נהגים פרטיים משתמשים לרוב בשלט שם או בקשר טלפוני, אך רק השובר קובע. לבדוק את נקודת המפגש המדויקת בשובר Booking.com." : "Private drivers commonly use a lead-passenger name sign or mobile contact, but only the voucher controls. Check Booking.com transfer voucher for exact driver meeting point."}</span></div>
      <div><strong>3 · ${state.lang === "he" ? "עיכוב" : "Delay"}</strong><span>${state.lang === "he" ? "אם הטיסה מתעכבת, גלעד מעדכן את הנהג/Booking.com לפי פרטי השובר ושומר צילום מסך של סטטוס הטיסה. אחרי 20 דקות מהנחיתה בפועל ללא קשר — מתקשרים לספק." : "If the flight is delayed, Gilad updates the driver/Booking.com using the voucher contact and saves the live-flight screen. If there is no contact 20 minutes after actual landing, call the provider."}</span></div>
    </div>
    <div class="card-actions">${external("https://www.narita-airport.jp/en/company/media-center/publications-pamphlets/kannaimap/", state.lang === "he" ? "מפת טרמינל 1" : "Terminal 1 map", "primary")}${external("https://secure.booking.com/myreservations.html", state.lang === "he" ? "פתיחת Booking.com Trips" : "Open Booking.com Trips")}${copyControl("••••")}</div>
  </article>`;
}

function renderRailBookingDesk() {
  const ask = "10月11日、サフィール踊り子5号、渋谷12時30分発、伊東まで、5人で使える6人用グリーン個室はありますか。";
  $("#railBookingDesk").innerHTML = `
    <div class="section-label"><span>${L(B("Which app buys what", "איזו אפליקציה קונה מה"))}</span></div>
    <section class="rail-help-hero" aria-labelledby="rail-help-title">
      <div class="rail-help-heading"><span class="rail-signal" aria-hidden="true">乗</span><div><p class="eyebrow">${L(B("THERE IS NO ONE JAPAN TICKET APP", "אין אפליקציה יפנית אחת להכול"))}</p><h3 id="rail-help-title">${L(B("Plan in one place. Buy in the right one.", "מתכננים במקום אחד. קונים במקום הנכון."))}</h3><p>${L(B("Japan’s tickets split by operator and service type. These cards say exactly where to pay—and what that tool cannot sell.", "הכרטיסים מתחלקים לפי מפעיל וסוג שירות. הכרטיסים שלמטה אומרים בדיוק היכן לשלם — ומה אותו כלי לא יכול למכור."))}</p></div></div>
      <div class="booking-channel-grid">${bookingChannels.map(channel => `<article class="booking-channel"><span class="booking-channel-icon" aria-hidden="true">${channel.icon}</span><p class="card-kicker">${L(channel.title)}</p><h4>${L(channel.tool)}</h4><p>${L(channel.use)}</p><strong class="not-for">${L(channel.notFor)}</strong><div class="card-actions">${channel.links.map(link => external(link[1], L(link[0]), "compact")).join("")}</div></article>`).join("")}</div>
    </section>
    <section class="saphir-rescue" aria-labelledby="saphir-rescue-title">
      <header><span class="saphir-gem" aria-hidden="true">◆</span><div><p class="eyebrow">${L(B("OCTOBER 11 SAPHIR RESCUE", "פתרון ספיר ל-11 באוקטובר"))}</p><h3 id="saphir-rescue-title">${L(B("If the room is missing online, that is not a bug", "אם התא לא מופיע אונליין — זו לא תקלה"))}</h3><p>${L(B("JR East sells Premium Green and ordinary Green seats online. Private rooms in cars 2–3 are sold only at a reserved-seat machine or JR Ticket Office.", "JR East מוכרת אונליין מושבי Premium Green ו-Green רגילים. תאים פרטיים בקרונות 2–3 נמכרים רק במכונת מושבים שמורים או במשרד JR."))}</p></div></header>
      <div class="rescue-lanes">
        <article><span class="lane-number">1</span><h4>${L(B("Protect the trip now", "להגן על הנסיעה עכשיו"))}</h4><ol><li>${L(B("Open JR-EAST Train Reservation and choose Purchase tickets.", "לפתוח JR-EAST Train Reservation ולבחור Purchase tickets."))}</li><li>${L(B("Search 11 October, Shibuya around 12:30 → Ito, five passengers.", "לחפש 11 באוקטובר, שיבויה סביב 12:30 ← איטו, חמישה נוסעים."))}</li><li>${L(B("Choose Saphir Odoriko 5 and five seats in Green cars 5–8.", "לבחור Saphir Odoriko 5 וחמישה מושבים בקרונות Green 5–8."))}</li></ol>${external("https://www.eki-net.com/en/jreast-train-reservation/Top/Index", L(B("Buy Green seats", "קניית מושבי גרין")), "primary")}</article>
        <article><span class="lane-number">2</span><h4>${L(B("Try for the room after landing", "לנסות לשדרג לתא אחרי הנחיתה"))}</h4><p>${L(B("On 29 September, show this at a JR office or reserved-seat machine. Before buying twice, ask about changing/refunding the backup and the fee.", "ב-29 בספטמבר, להציג במשרד JR או במכונת מושבים שמורים את הבקשה הזו. לפני קנייה שנייה, לשאול על שינוי/החזר של הגיבוי והעמלה."))}</p><div class="japanese-request">${copyControl(ask)}</div>${external("https://www.jreast.co.jp/saphir/en/cars/ticket/", L(B("Official sale rules", "כללי המכירה הרשמיים")))}</article>
      </div>
      <footer><strong>${L(B("If sold out:", "אם אין מקום:"))}</strong> ${L(B("Check Saphir 1 from Tokyo at 11:00; then use a reserved regular Odoriko. Sales opened 11 September at 10:00 JST.", "לבדוק Saphir 1 מטוקיו ב-11:00; אחר כך Odoriko רגילה שמורה. המכירה נפתחה ב-11 בספטמבר ב-10:00 JST."))}</footer>
    </section>`;
}

function renderIzuTransportDecision() {
  const driving = state.choices.oct12 === "rental";
  $("#izuTransportDecision").innerHTML = `
    <div class="section-label"><span>${L(B("Izu car decision", "החלטת רכב באיזו"))}</span></div>
    <section class="izu-drive-card ${driving ? "is-driving" : "is-transit"}" aria-labelledby="izu-drive-title">
      <div class="izu-drive-copy"><p class="eyebrow">${L(B("VERDICT: ONE DAY ONLY", "פסק דין: יום אחד בלבד"))}</p><h3 id="izu-drive-title">${state.lang === "he" ? (state.choices.oct12 === "transit" ? "נבחר: רכבת ואוטובוס ב-12 באוקטובר" : "נבחר: רכב ליום אחד ב-12 באוקטובר") : (state.choices.oct12 === "transit" ? "Selected: rail and bus on 12 October" : "Selected: one-day car on 12 October")}</h3><p>${L(B("The car materially helps only on the Jōgasaki + Mt Ōmuro day. The recommended 13 October plan is slow Ito and the ryokan, so an extra rental day adds cost without enough value.", "הרכב באמת חוסך זמן רק ביום ג׳וגסאקי + הר אומורו. ב-13 באוקטובר התכנית המומלצת היא איטו והריוקאן, ולכן אין טעם לשלם ולחנות רכב נוסף."))}</p><div class="drive-facts"><span>🚗 <bdi dir="ltr">Nippon: 08:00–19:00</bdi></span><span>🅿 ${L(B("Laforet: free, ~50", "Laforet: חינם, כ-50"))}</span><span>🛣 ${L(B("Left side + narrow roads", "שמאל + כבישים צרים"))}</span></div></div>
      <fieldset class="izu-mode-switch"><legend>${L(B("Saved choice", "הבחירה השמורה"))}</legend><label class="${driving ? "is-selected" : ""}"><input type="radio" name="izu-mode" value="rental" data-choice-key="oct12" ${driving ? "checked" : ""}><span><strong>${L(B("One-day car", "רכב ליום אחד"))}</strong><small>${L(B("Recommended if documents and driving feel comfortable", "מומלץ אם המסמכים והנהיגה נוחים"))}</small></span></label><label class="${!driving ? "is-selected" : ""}"><input type="radio" name="izu-mode" value="transit" data-choice-key="oct12" ${!driving ? "checked" : ""}><span><strong>${L(B("Rail + bus", "רכבת + אוטובוס"))}</strong><small>${L(B("Less stress, more waiting; drop a sight if delayed", "פחות לחץ, יותר המתנה; לוותר על אתר אם מאחרים"))}</small></span></label></fieldset>
      <div class="izu-drive-actions">${external("https://store.nipponrentacar.co.jp/en/b/nrs/info/470337/", L(B("Nippon Ito · 08:00", "Nippon Ito · 08:00")), "primary")}${external("https://rent.toyota.co.jp/eng/reservation/index01.aspx?eShop=031&rShop=63601&shopMode=0", L(B("Toyota Ito · 09:00", "Toyota Ito · 09:00")))}${external("https://embassies.gov.il/japan/he/announcements/international-driving-permit", L(B("Israeli IDP requirements", "דרישות רישיון לישראלים")))}${external("https://www.laforet.co.jp/ito/faq/access/", L(B("Hotel parking", "חניית המלון")))}</div>
    </section>`;
}

function renderTransit() {
  $("#transitList").innerHTML = transits.map(item => `<article class="transit-card">
    <div class="transit-route"><span class="card-kicker">${item.icon} ${L(item.date)}</span><h3>${L(item.route)}</h3><p>${L(item.window)}</p><div class="card-actions">${external(item.buy, L(T.book), "compact")}${external(item.map, L(T.map), "compact")}</div></div>
    <div class="transit-core">
      <div class="mini-detail"><span>${L(T.duration)}</span><strong>${L(item.duration)}</strong></div>
      <div class="mini-detail"><span>${L(T.transfers)}</span><strong>${L(item.transfers)}</strong></div>
      <div class="mini-detail"><span>${L(T.fare)}</span><strong>${L(item.fare)}</strong></div>
      <div class="mini-detail"><span>${L(T.reserve)}</span><strong>${L(item.reservation)}</strong></div>
      <div class="mini-detail"><span>${state.lang === "he" ? "פתיחת מכירה" : "Sale timing"}</span><strong>${L(item.sale)}</strong></div>
      <div class="mini-detail"><span>${L(T.seat)}</span><strong>${L(item.seat)}</strong></div>
      <div class="mini-detail"><span>${L(T.luggage)}</span><strong>${L(item.luggage)}</strong></div>
      <div class="mini-detail"><span>${L(T.backup)}</span><strong>${L(item.backup)}</strong></div>
      <div class="mini-detail"><span>${L(T.station)}</span><strong>${L(item.station)}</strong></div>
    </div>
    <div class="ticket-toggle"><p class="ticket-note">${state.lang === "he" ? "רישום רכישה אישי; משימות ההכנה ברשימה נבדקות בנפרד." : "Your purchase record; preparation tasks are reviewed separately in the checklist."}</p><label class="switch"><input type="checkbox" id="ticket-${item.id}" aria-label="${esc(L(item.route))}: ${L(T.purchase)}" data-ticket="${item.id}" ${state.tickets[item.id] ? "checked" : ""}><span class="slider"></span></label><label for="ticket-${item.id}">${state.tickets[item.id] ? L(T.purchase) : L(T.notPurchased)}</label></div>
  </article>`).join("");
}

function renderMaps() {
  $("#mapHero").innerHTML = `<div class="map-hero-copy"><p class="eyebrow">TOKYO → IZU → KYOTO → TOKYO</p><h3>${state.lang === "he" ? "מפה אחת למסע. קישורים לכל החלטה." : "One journey map. A link for every decision."}</h3><p>${state.lang === "he" ? "הכרטיסים פותחים חיפוש או מסלול ב-Google Maps רק בלחיצה. שום מזהה הזמנה אינו נכנס לכתובת URL." : "Cards open a search or route in Google Maps only when tapped. No booking reference is ever placed in a URL."}</p>${external(MAP("Tokyo Izu Kyoto"), state.lang === "he" ? "פתיחת מבט המסע" : "Open journey overview", "")}</div><div class="map-art" aria-hidden="true"><span class="route-path"></span><span class="route-stop tokyo"></span><span class="route-stop izu"></span><span class="route-stop kyoto"></span><span class="route-label tokyo">東京</span><span class="route-label izu">伊豆</span><span class="route-label kyoto">京都</span></div>`;
  $("#regionMapGrid").innerHTML = regionMaps.map(card => `<article class="map-card"><span class="card-kicker">${card.icon} ${state.lang === "he" ? "מפת אזור" : "REGION"}</span><h3>${L(card.title)}</h3><p>${L(card.text)}</p>${routeLinks(card.route)}</article>`).join("");
  $("#mapGrid").innerHTML = mapCards.map(card => `<article class="map-card"><span class="card-kicker">${card.icon} ${state.lang === "he" ? "נקודת מפה" : "MAP PIN"}</span><h3>${L(card.title)}</h3><p>${L(card.text)}</p>${external(MAP(card.query), L(T.map), "compact")}</article>`).join("");
  $("#dayMapList").innerHTML = days.map(day => `<article class="day-map-row"><time>${dateParts(day.date).day} ${dateParts(day.date).month}</time><div><h3>${day.icon} ${L(day.title)}</h3><p>${L(day.subtitle)}</p></div>${routeLinks(selectedRoute(day.id))}</article>`).join("");
}

function renderMuseumFilters() {
  const filters = [["all",T.museumAll],["solo",T.museumSolo],["family",T.museumFamily],["water",T.museumWater],["design",T.museumDesign],["train",T.museumTrain]];
  $("#museumFilters").innerHTML = filters.map(([id,label]) => `<button class="filter-button ${museumFilter === id ? "is-active" : ""}" type="button" data-museum-filter="${id}" aria-pressed="${museumFilter === id}">${L(label)}</button>`).join("");
}

function renderMuseums() {
  renderMuseumFilters();
  const filtered = museumFilter === "all" ? museums : museums.filter(museum => museum.tags.includes(museumFilter));
  $("#museumGrid").innerHTML = filtered.map(museum => `<article class="data-card museum-card">
    <button class="round-button favorite-corner ${state.favorites[`museum-${museum.id}`] ? "is-active" : ""}" type="button" data-favorite="museum-${museum.id}" aria-pressed="${Boolean(state.favorites[`museum-${museum.id}`])}" aria-label="${L(T.favorite)}">★</button>
    <div class="card-topline"><div><span class="card-kicker">${museum.icon} ${L(museum.area)}</span><h3>${L(museum.name)}</h3></div></div>
    <p class="lead">${L(museum.note)}</p>
    <div class="fit-meter" role="img" aria-label="${L(T.fit)} ${museum.fit}/5">${[1,2,3,4,5].map(value => `<span class="${value <= museum.fit ? "on" : ""}"></span>`).join("")}</div>
    <dl class="detail-list"><dt>${L(T.duration)}</dt><dd>${museum.duration}</dd><dt>${L(T.price)}</dt><dd>${L(museum.price)}</dd><dt>${L(T.closed)}</dt><dd>${L(museum.closed)}</dd><dt>${L(T.audience)}</dt><dd>${L(museum.audience)}</dd></dl>
    <div class="card-actions">${external(museum.official, L(T.official), "primary")}${external(museum.map, L(T.map))}</div>
  </article>`).join("");
}

function renderFood() {
  const summary = [
    ["🐟", B("Fish is okay", "דגים בסדר")], ["🥬", B("2: no meat", "2: ללא בשר")], ["🥩", B("Avoid red meat", "ללא בשר אדום")], ["🐖", B("1: no pork", "1: ללא חזיר")], ["🦐", B("No shrimp / prawns", "ללא שרימפס")], ["🦀", B("No crab", "ללא סרטן")], ["🦑", B("No squid", "ללא קלמארי")], ["🐙", B("No octopus", "ללא תמנון")], ["🦪", B("No shellfish / clams", "ללא צדפות")]
  ];
  $("#foodSummary").innerHTML = summary.map(item => `<div class="food-summary-item"><strong>${item[0]}</strong><span>${L(item[1])}</span></div>`).join("");
  $("#foodGrid").innerHTML = foodCards.map(card => `<button class="data-card food-card" type="button" data-food-id="${card.id}">
    <div class="card-topline"><div><span class="card-kicker">${L(T.dietaryNotAllergy)}</span><h3>${L(card.title)}</h3></div><span class="food-icon" aria-hidden="true">${card.icon}</span></div>
    <p class="food-japanese-preview" lang="ja">${card.jp}</p><p>${L(card.translation)}</p><span class="card-actions"><span class="primary-button">${state.lang === "he" ? "הצגה במסך מלא" : "Show full screen"}</span></span>
  </button>`).join("");
}

function decisionStatusLabel(value) {
  const labels = {
    decide:B("❓ Decide","❓ להחליט"), likely:B("🟡 Likely","🟡 סביר"), booking:B("🟠 Needs booking","🟠 דורש הזמנה"), action:B("⚠ Action required","⚠ נדרשת פעולה"), locked:B("✅ Locked","✅ נעול"), unverified:B("◌ Unverified","◌ לא מאומת")
  };
  return L(labels[value] || labels.decide);
}

function renderActionChecklist() {
  const phases = [
    { id:"all", label:B("All","הכול") },
    { id:"now", label:B("Do now","לבצע עכשיו"), title:B("Book and confirm now","להזמין ולאשר עכשיו"), note:B("Inventory, deadlines, or another decision depends on these.","מלאי, מועדים או החלטה אחרת תלויים באלה.") },
    { id:"before", label:B("Before departure","לפני היציאה"), title:B("Before leaving home","לפני שיוצאים מהבית"), note:B("Documents, money, connectivity, individual IC cards, and packing.","מסמכים, כסף, תקשורת, כרטיסי IC אישיים ואריזה.") },
    { id:"japan", label:B("In Japan","ביפן"), title:B("Complete in Japan","לבצע ביפן"), note:B("Day-of purchases and operational checks that should stay flexible.","רכישות ביום עצמו ובדיקות תפעול שכדאי להשאיר גמישות.") },
    { id:"conditional", label:B("If chosen","אם נבחר"), title:B("Conditional and verification tasks","משימות מותנות ואימותים"), note:B("Do these only if the option survives the family decision or live check.","לבצע רק אם האפשרות שורדת את החלטת המשפחה או הבדיקה החיה.") }
  ];
  const done = actionChecklist.filter(task => state.checks[`action-${task.id}`]).length;
  const percent = Math.round((done / actionChecklist.length) * 100);
  const urgentRemaining = actionChecklist.filter(task => task.phase === "now" && !state.checks[`action-${task.id}`]).length;
  $("#checklistOverview").innerHTML = `<section class="checklist-overview" aria-label="${state.lang === "he" ? "התקדמות רשימת הפעולות" : "Action checklist progress"}">
    <div class="checklist-score"><span>${done}</span><small>/${actionChecklist.length}</small></div>
    <div class="checklist-progress-copy"><p class="eyebrow">${state.lang === "he" ? "התקדמות הכנות" : "PREPARATION PROGRESS"}</p><h3>${done === actionChecklist.length ? (state.lang === "he" ? "כל משימות ההכנה נבדקו" : "All preparation tasks reviewed") : (state.lang === "he" ? `${urgentRemaining} פעולות דחופות נשארו` : `${urgentRemaining} do-now actions remain`)}</h3><p>${state.lang === "he" ? "לחיצה על כל שורה פותחת הוראות וקישורים. כל נוסע מקבל משימה נפרדת כשצריך." : "Open any row for instructions and official links. Individual travelers get separate tasks where it matters."}</p><div class="checklist-progress-track" role="progressbar" aria-label="${L(T.tripProgress)}" aria-valuemin="0" aria-valuemax="100" aria-valuenow="${percent}"><span style="width:${percent}%"></span></div></div>
    <div class="checklist-legend"><strong>${percent}%</strong><span>${state.lang === "he" ? "נשמר במכשיר הזה" : "saved on this device"}</span></div>
  </section>`;

  $("#checklistFilters").innerHTML = phases.map(phase => {
    const count = phase.id === "all" ? actionChecklist.length : actionChecklist.filter(task => task.phase === phase.id).length;
    return `<button class="filter-button ${checklistFilter === phase.id ? "is-active" : ""}" type="button" data-checklist-filter="${phase.id}" aria-pressed="${checklistFilter === phase.id}">${L(phase.label)} <span>${count}</span></button>`;
  }).join("");

  const visiblePhases = phases.filter(phase => phase.id !== "all" && (checklistFilter === "all" || checklistFilter === phase.id));
  $("#checklists").innerHTML = visiblePhases.map(phase => {
    const tasks = actionChecklist.filter(task => task.phase === phase.id);
    const phaseDone = tasks.filter(task => state.checks[`action-${task.id}`]).length;
    return `<section class="action-group" data-action-phase="${phase.id}">
      <header class="action-group-heading"><div><p class="eyebrow">${L(phase.label)}</p><h3>${L(phase.title)}</h3><p>${L(phase.note)}</p></div><span>${phaseDone}/${tasks.length}</span></header>
      <div class="action-task-list">${tasks.map(task => {
        const key = `action-${task.id}`;
        const checked = !!state.checks[key];
        return `<article class="action-task ${checked ? "is-done" : ""}">
          <label class="action-checkbox" title="${checked ? (state.lang === "he" ? "סומן כהושלם" : "Marked complete") : (state.lang === "he" ? "סימון כהושלם" : "Mark complete")}"><input type="checkbox" data-check="${key}" ${checked ? "checked" : ""} aria-label="${state.lang === "he" ? "סימון כהושלם: " : "Mark complete: "}${L(task.title)}"><span aria-hidden="true">✓</span></label>
          <details data-panel="${key}">
            <summary><span class="action-task-icon" aria-hidden="true">${task.icon}</span><span class="action-task-title"><small>${L(task.kind)}</small><strong>${L(task.title)}</strong><span>${L(task.summary)}</span></span><span class="action-task-meta"><b>${L(task.due)}</b><small>${L(task.people)}</small></span><span class="action-chevron" aria-hidden="true">⌄</span></summary>
            <div class="action-task-body"><h4>${state.lang === "he" ? "איך לבצע" : "How to do it"}</h4><ol>${task.steps.map(step => `<li>${L(step)}</li>`).join("")}</ol>${task.links.length ? `<div class="card-actions">${task.links.map(link => external(link[1], L(link[0]), "compact")).join("")}</div>` : ""}</div>
          </details>
        </article>`;
      }).join("")}</div>
    </section>`;
  }).join("");
}

function renderPlanner() {
  renderActionChecklist();
  $("#decisionsList").innerHTML = `<div class="decision-list">${decisions.map(item => {
    const value = state.decisions[item.id] || item.default;
    const normalized = value === "open" ? "decide" : value === "verified" ? "locked" : value;
    return `<article class="decision-card"><header><span class="icon-chip" aria-hidden="true">${item.icon}</span><h3>${L(item.title)}</h3><select class="status-select" data-decision="${item.id}" aria-label="${L(T.sourceStatus)}: ${esc(L(item.title))}">${["locked","likely","booking","decide","action","unverified"].map(status => `<option value="${status}" ${normalized === status ? "selected" : ""}>${decisionStatusLabel(status)}</option>`).join("")}</select></header><p>${L(item.text)}</p></article>`;
  }).join("")}</div>`;

  const stampCount = Object.values(state.stamps).filter(Boolean).length;
  $("#delights").innerHTML = `<div class="delight-grid">${delights.map(item => `<article class="delight-card"><span class="card-kicker">${item.icon}</span><h3>${L(item.title)}</h3><p>${L(item.text)}</p><button class="ghost-button compact" type="button" data-delight="${item.id}">${L(item.action)}${item.id === "stamp" ? ` · ${stampCount}/5` : ""}</button></article>`).join("")}</div>`;
}

function renderAll() {
  renderStaticText();
  renderNav();
  renderStatus();
  renderHero();
  renderSideQuests();
  renderSecrets();
  renderSegments();
  renderTimeline();
  renderStays();
  renderFlights();
  renderRailBookingDesk();
  renderIzuTransportDecision();
  renderTransit();
  renderMaps();
  renderMuseums();
  renderFood();
  renderPlanner();
  showView(state.lastView || "itinerary");
  $("#volume").value = state.volume;
  if (audioEngine?.playing) {
    $("#audioPlay").querySelector("[data-i18n]").textContent = L(T.stopSound);
  }
}

function openFoodDialog(id) {
  const card = foodCards.find(item => item.id === id);
  if (!card) return;
  const dialog = $("#foodDialog");
  dialog.dataset.foodId = id;
  $("#foodDialogLabel").textContent = L(card.title);
  $("#foodDialogJapanese").textContent = card.jp;
  $("#foodDialogTranslation").textContent = L(card.translation);
  dialog.showModal();
}

async function copyText(value, message = L(T.copied)) {
  try {
    await navigator.clipboard.writeText(value);
  } catch {
    const area = document.createElement("textarea");
    area.value = value; area.style.position = "fixed"; area.style.opacity = "0";
    document.body.appendChild(area); area.select(); document.execCommand("copy"); area.remove();
  }
  showToast(message);
}

function createAudioEngine() {
  const AudioContextClass = window.AudioContext || window.webkitAudioContext;
  if (!AudioContextClass) return null;
  const ctx = new AudioContextClass();
  const master = ctx.createGain();
  master.gain.value = 0;
  master.connect(ctx.destination);

  const musicBus = ctx.createGain();
  musicBus.gain.value = 0.82;
  musicBus.connect(master);

  const delay = ctx.createDelay(1.2);
  const feedback = ctx.createGain();
  const delayTone = ctx.createBiquadFilter();
  delay.delayTime.value = 0.42;
  feedback.gain.value = 0.2;
  delayTone.type = "lowpass";
  delayTone.frequency.value = 1700;
  musicBus.connect(delay);
  delay.connect(delayTone);
  delayTone.connect(feedback);
  feedback.connect(delay);
  delayTone.connect(master);

  const reverb = ctx.createConvolver();
  const impulse = ctx.createBuffer(2, ctx.sampleRate * 2.8, ctx.sampleRate);
  for (let channelIndex = 0; channelIndex < 2; channelIndex++) {
    const impulseData = impulse.getChannelData(channelIndex);
    for (let i = 0; i < impulseData.length; i++) impulseData[i] = (Math.random() * 2 - 1) * Math.pow(1 - i / impulseData.length, 3.4);
  }
  reverb.buffer = impulse;
  const reverbGain = ctx.createGain();
  reverbGain.gain.value = 0.16;
  musicBus.connect(reverb);
  reverb.connect(reverbGain);
  reverbGain.connect(master);

  const rainGain = ctx.createGain();
  rainGain.gain.value = 0.1;
  const filter = ctx.createBiquadFilter();
  filter.type = "lowpass";
  filter.frequency.value = 820;
  const buffer = ctx.createBuffer(1, ctx.sampleRate * 3, ctx.sampleRate);
  const channel = buffer.getChannelData(0);
  for (let i = 0; i < channel.length; i++) channel[i] = (Math.random() * 2 - 1) * (0.25 + Math.random() * 0.25);
  const rain = ctx.createBufferSource();
  rain.buffer = buffer; rain.loop = true; rain.connect(filter); filter.connect(rainGain); rainGain.connect(master); rain.start();

  const droneFilter = ctx.createBiquadFilter();
  const droneGain = ctx.createGain();
  droneFilter.type = "lowpass";
  droneFilter.frequency.value = 260;
  droneGain.gain.value = 0.011;
  droneFilter.connect(droneGain);
  droneGain.connect(master);
  [110,164.81].forEach((frequency,index) => {
    const drone = ctx.createOscillator();
    drone.type = index ? "sine" : "triangle";
    drone.frequency.value = frequency;
    drone.detune.value = index ? 4 : -3;
    drone.connect(droneFilter);
    drone.start();
  });

  const engine = { ctx, master, musicBus, playing:false, timer:null };
  engine.pluck = (frequency, when, panValue = 0) => {
    const osc = ctx.createOscillator();
    const harmonic = ctx.createOscillator();
    const tone = ctx.createBiquadFilter();
    const gain = ctx.createGain();
    const pan = ctx.createStereoPanner ? ctx.createStereoPanner() : null;
    osc.type = "triangle";
    harmonic.type = "sine";
    osc.frequency.value = frequency;
    harmonic.frequency.value = frequency * 2.01;
    tone.type = "lowpass";
    tone.frequency.setValueAtTime(2400, when);
    tone.frequency.exponentialRampToValueAtTime(650, when + 1.8);
    gain.gain.setValueAtTime(0.0001, when);
    gain.gain.exponentialRampToValueAtTime(0.038, when + .008);
    gain.gain.exponentialRampToValueAtTime(0.0001, when + 2.2);
    osc.connect(tone); harmonic.connect(tone); tone.connect(gain);
    if (pan) { pan.pan.value = panValue; gain.connect(pan); pan.connect(musicBus); }
    else gain.connect(musicBus);
    osc.start(when); harmonic.start(when); osc.stop(when + 2.3); harmonic.stop(when + 2.3);
  };
  engine.breath = (frequency, when) => {
    const osc = ctx.createOscillator();
    const tone = ctx.createBiquadFilter();
    const gain = ctx.createGain();
    const pan = ctx.createStereoPanner ? ctx.createStereoPanner() : null;
    osc.type = "sine";
    osc.frequency.setValueAtTime(frequency, when);
    osc.frequency.linearRampToValueAtTime(frequency * 1.015, when + 2.6);
    tone.type = "bandpass"; tone.frequency.value = frequency * 2; tone.Q.value = .8;
    gain.gain.setValueAtTime(0.0001, when);
    gain.gain.exponentialRampToValueAtTime(0.019, when + .7);
    gain.gain.setValueAtTime(0.019, when + 1.7);
    gain.gain.exponentialRampToValueAtTime(0.0001, when + 3.2);
    osc.connect(tone); tone.connect(gain);
    if (pan) { pan.pan.value = -0.3 + Math.random() * .6; gain.connect(pan); pan.connect(musicBus); }
    else gain.connect(musicBus);
    osc.start(when); osc.stop(when + 3.3);
  };
  engine.chime = (manual = false) => {
    if (!engine.playing && !manual) return;
    const now = ctx.currentTime;
    const notes = manual ? [659.25, 783.99, 987.77] : [523.25, 659.25, 783.99, 987.77];
    const startIndex = Math.floor(Math.random() * notes.length);
    [0,1,2].forEach((step,index) => {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      const pan = ctx.createStereoPanner ? ctx.createStereoPanner() : null;
      osc.type = index === 0 ? "sine" : "triangle";
      osc.frequency.value = notes[(startIndex + step) % notes.length] * (index === 2 ? .5 : 1);
      gain.gain.setValueAtTime(0.0001, now + index * .36);
      gain.gain.exponentialRampToValueAtTime(manual ? .06 : .028, now + index * .36 + .05);
      gain.gain.exponentialRampToValueAtTime(0.0001, now + index * .36 + 2.6);
      if (pan) { pan.pan.value = -0.5 + Math.random(); osc.connect(gain); gain.connect(pan); pan.connect(musicBus); }
      else { osc.connect(gain); gain.connect(musicBus); }
      osc.start(now + index * .36); osc.stop(now + index * .36 + 2.8);
    });
  };
  engine.schedule = () => {
    clearTimeout(engine.timer);
    if (!engine.playing) return;
    engine.timer = setTimeout(() => {
      const now = ctx.currentTime + .06;
      const scale = [220,246.94,293.66,329.63,392,440,493.88];
      const root = Math.floor(Math.random() * 4);
      const patternLength = 2 + Math.floor(Math.random() * 4);
      for (let index = 0; index < patternLength; index++) {
        const note = scale[(root + [0,2,1,4,3][index]) % scale.length];
        engine.pluck(note, now + index * (.48 + Math.random() * .28), -0.65 + Math.random() * 1.3);
      }
      if (Math.random() > .52) engine.breath(scale[root] / 2, now + 1.1);
      if (Math.random() > .7) engine.chime();
      engine.schedule();
    }, 11000 + Math.random() * 17000);
  };
  return engine;
}

async function toggleAudio() {
  audioEngine ||= createAudioEngine();
  if (!audioEngine) return showToast(state.lang === "he" ? "אודיו אינו נתמך בדפדפן הזה" : "Audio is not supported in this browser");
  clearTimeout(audioSuspendTimer);
  await audioEngine.ctx.resume();
  audioEngine.playing = !audioEngine.playing;
  const now = audioEngine.ctx.currentTime;
  audioEngine.master.gain.cancelScheduledValues(now);
  audioEngine.master.gain.setValueAtTime(audioEngine.master.gain.value, now);
  audioEngine.master.gain.linearRampToValueAtTime(audioEngine.playing ? state.volume : 0, now + .8);
  if (audioEngine.playing) { audioEngine.chime(); audioEngine.schedule(); }
  else {
    clearTimeout(audioEngine.timer);
    audioSuspendTimer = setTimeout(() => { if (!audioEngine.playing) audioEngine.ctx.suspend(); }, 900);
  }
  $("#audioPlay").querySelector("[data-i18n]").textContent = L(audioEngine.playing ? T.stopSound : T.startSound);
  showToast(L(audioEngine.playing ? T.soundOn : T.soundOff));
}

document.addEventListener("click", event => {
  const viewButton = event.target.closest("[data-view-target]");
  if (viewButton) { showView(viewButton.dataset.viewTarget, true); return; }

  const secretButton = event.target.closest("[data-secret]");
  if (secretButton) { triggerSecret(secretButton.dataset.secret, secretButton.dataset.revealPanel === "true"); return; }

  const plannerButton = event.target.closest("[data-go-planner]");
  if (plannerButton) {
    showView("planner", true);
    setTimeout(() => $("#delights")?.scrollIntoView({ behavior:motionBehavior(), block:"center" }), 120);
    return;
  }

  const segmentButton = event.target.closest("[data-segment]");
  if (segmentButton) { currentSegment = segmentButton.dataset.segment; preserveUI(() => { renderSegments(); renderTimeline(); }); return; }

  const favoriteButton = event.target.closest("[data-favorite]");
  if (favoriteButton) {
    event.preventDefault(); event.stopPropagation();
    const id = favoriteButton.dataset.favorite;
    state.favorites[id] = !state.favorites[id]; persist();
    favoriteButton.classList.toggle("is-active", state.favorites[id]);
    favoriteButton.setAttribute("aria-pressed", String(state.favorites[id]));
    return;
  }

  const completeButton = event.target.closest("[data-complete]");
  if (completeButton) {
    event.preventDefault(); event.stopPropagation();
    const id = completeButton.dataset.complete;
    state.completed[id] = !state.completed[id]; persist();
    completeButton.classList.toggle("is-active", state.completed[id]);
    completeButton.setAttribute("aria-pressed", String(state.completed[id]));
    completeButton.closest(".day-card")?.classList.toggle("is-complete", state.completed[id]);
    return;
  }

  const copyButton = event.target.closest("[data-copy]");
  if (copyButton) { event.preventDefault(); copyText(copyButton.dataset.copy, L(T.copiedNumber)); return; }

  const foodButton = event.target.closest("button[data-food-id]");
  if (foodButton) { openFoodDialog(foodButton.dataset.foodId); return; }

  const museumButton = event.target.closest("[data-museum-filter]");
  if (museumButton) { museumFilter = museumButton.dataset.museumFilter; preserveUI(renderMuseums); return; }

  const checklistButton = event.target.closest("[data-checklist-filter]");
  if (checklistButton) { checklistFilter = checklistButton.dataset.checklistFilter; preserveUI(renderActionChecklist); return; }

  const delight = event.target.closest("[data-delight]");
  if (delight) {
    if (delight.dataset.delight === "retro") { state.retro = !state.retro; persist(); renderStaticText(); showToast(state.lang === "he" ? "מצב שנות ה-80 הוחלף" : "1980s Tokyo mode toggled"); }
    if (delight.dataset.delight === "print") window.print();
    if (delight.dataset.delight === "stamp") {
      const next = ["solo","family","izu","kyoto","finale"].find(id => !state.stamps[id]);
      if (next) state.stamps[next] = true; else state.stamps = {};
      persist(); preserveUI(renderPlanner); showToast(L(T.stampAdded));
    }
  }
});

document.addEventListener("change", event => {
  if (event.target.matches("[data-choice-key]")) {
    const openDay = event.target.closest("[data-day-card]")?.dataset.dayCard || "";
    state.choices[event.target.dataset.choiceKey] = event.target.value; persist(); preserveUI(() => renderTimeline(openDay)); renderMaps();
    if (event.target.dataset.choiceKey === "oct12") renderIzuTransportDecision();
    showToast(L(T.saved));
  }
  if (event.target.matches("[data-ticket]")) {
    state.tickets[event.target.dataset.ticket] = event.target.checked; persist(); preserveUI(renderTransit);
  }
  if (event.target.matches("[data-check]")) {
    state.checks[event.target.dataset.check] = event.target.checked; persist(); preserveUI(renderActionChecklist);
  }
  if (event.target.matches("[data-decision]")) {
    state.decisions[event.target.dataset.decision] = event.target.value; persist();
  }
  if (event.target.matches('input[name="solo-hotel"]')) {
    state.soloHotel = event.target.value; persist(); renderMaps(); preserveUI(renderTimeline); showToast(L(T.saved));
  }
});

document.addEventListener("input", event => {
  if (event.target.matches("[data-note]")) {
    state.notes[event.target.dataset.note] = event.target.value;
    persist();
  }
});

$("#languageToggle").addEventListener("click", () => {
  state.lang = state.lang === "en" ? "he" : "en";
  persist(); preserveUI(renderAll);
});

$("#secretsToggle").addEventListener("click", openSecrets);
$("#secretsHeroButton").addEventListener("click", openSecrets);
$("#secretsDialog").addEventListener("click", event => {
  if (event.target === event.currentTarget) event.currentTarget.close();
});

$("#soundToggle").addEventListener("click", () => {
  const panel = $("#soundPanel");
  panel.hidden = !panel.hidden;
  $("#soundToggle").setAttribute("aria-expanded", String(!panel.hidden));
});
$("#audioPlay").addEventListener("click", toggleAudio);
$("#stationChime").addEventListener("click", () => triggerSecret("chime"));
$("#volume").addEventListener("input", event => {
  state.volume = Number(event.target.value); persist();
  if (audioEngine?.playing) audioEngine.master.gain.setTargetAtTime(state.volume, audioEngine.ctx.currentTime, .08);
});

$("#expandAll").addEventListener("click", () => $$("#timeline .day-panel").forEach(detail => detail.open = true));
$("#collapseAll").addEventListener("click", () => $$("#timeline .day-panel").forEach(detail => detail.open = false));
$("#copyFoodCard").addEventListener("click", () => {
  const card = foodCards.find(item => item.id === $("#foodDialog").dataset.foodId);
  if (card) copyText(card.jp, L(T.copiedJapanese));
});
$("#largeFoodCard").addEventListener("click", () => $("#foodDialog").classList.toggle("large-text"));

$("#monogram").addEventListener("click", () => {
  monogramClicks += 1;
  if (monogramClicks >= 5) {
    monogramClicks = 0;
    markSecret("train");
    runTrain();
    showToast(state.lang === "he" ? "מצאתם את הרכבת הסודית" : "You found the secret train");
  }
});

document.addEventListener("keydown", event => {
  if (event.target.matches("input,textarea,select,[contenteditable=true]")) return;
  const key = event.key.length === 1 ? event.key.toLowerCase() : event.key;
  if (key === konami[konamiIndex]) konamiIndex += 1;
  else konamiIndex = 0;
  if (konamiIndex === konami.length) {
    konamiIndex = 0;
    markSecret("kaiju");
    runKaiju();
    showToast(state.lang === "he" ? "קוד קאיג׳ו הופעל" : "Kaiju code activated");
  }
});

new ResizeObserver(() => {
 const height = document.querySelector('.app-header').getBoundingClientRect().height;
 document.documentElement.style.setProperty('--header-height', height+'px');
}).observe(document.querySelector('.app-header'));
let printRestore;
window.addEventListener('beforeprint', () => {
  printRestore = {segment:currentSegment, html:$('#timeline').innerHTML};
  currentSegment='all'; renderTimeline(); $$('#timeline details').forEach(el=>el.open=true);
});
window.addEventListener('afterprint', () => {
  if(printRestore) {currentSegment=printRestore.segment; $('#timeline').innerHTML=printRestore.html; printRestore=null;}
});
renderAll();

if ("serviceWorker" in navigator && location.protocol.startsWith("http")) {
  const setupOffline = async () => {
    try { const registration = await navigator.serviceWorker.register('service-worker.js', {updateViaCache:'none'}); await registration.update(); }
    catch { showToast(state.lang === 'he' ? 'שמירה לא מקוונת אינה זמינה כרגע; נסו שוב בחיבור תקין.' : 'Offline setup is unavailable right now; retry with a working connection.'); }
  };
  if (document.readyState === 'complete') setupOffline();
  else window.addEventListener('load', setupOffline, {once:true});
}
