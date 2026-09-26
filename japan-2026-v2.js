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
  lang: "he",
  theme: "auto",
  lastView: "itinerary",
  favorites: {},
  completed: {},
  notes: {},
  tickets: {},
  checks: {},
  decisions: {},
  volume: 0.28,
  stamps: {},
  discoveries: {},
  retro: false,
  soundMode: "zen",
  me: null,
  approver: false,
  votes: {},
  verdicts: {},
  outbox: []
};

// The family. x/y/d place each face on assets/who-family.webp, in percent of its width and height.
const PEOPLE = [
  { id: "gilad", name: B("Gilad", "גלעד"), x: 49.6, y: 61.6, d: 26 },
  { id: "ayelet", name: B("Ayelet", "אילת"), x: 41.7, y: 31.8, d: 20 },
  { id: "geffen", name: B("Geffen", "גפן"), x: 68.5, y: 31.8, d: 20 },
  { id: "yaara", name: B("Yaara", "יערה"), x: 24.3, y: 53.7, d: 20 },
  { id: "erel", name: B("Erel", "אראל"), x: 81.3, y: 57.7, d: 20 }
];
const person = id => PEOPLE.find(item => item.id === id);
const avatar = id => `assets/who-${id}.webp`;
// Live family votes: a Firebase Realtime Database URL. Empty means votes stay on this device.
const SYNC_URL = "https://japan2026-653a1-default-rtdb.firebaseio.com";
const SYNC_ROOT = "trip2026";
// Gilad's approval code, hashed so it isn't readable at a glance. A screen, not security.
const APPROVER_HASH = "ha6626ef2254b8945";

let state;
try {
  state = { ...defaultState, ...JSON.parse(localStorage.getItem(STORE_KEY) || "{}") };
} catch {
  state = { ...defaultState };
}
for (const key of ['favorites','completed','notes','tickets','checks','decisions','stamps','discoveries','votes','verdicts']) {
  if (!state[key] || typeof state[key] !== 'object' || Array.isArray(state[key])) state[key] = {};
}
if (!Array.isArray(state.outbox)) state.outbox = [];
if (!person(state.me)) state.me = null;
state.approver = state.me === "gilad" && state.approver === true;
// Picks from 2.18/2.19 wait here until the person is known, then become their "want" votes.
if (state.picks && (typeof state.picks !== 'object' || Array.isArray(state.picks))) delete state.picks;
// The 2.18 "Add to plan" toggles become picks under the same idea ids.
if (state.addedExtras && typeof state.addedExtras === 'object') {
  state.picks ||= {};
  for (const [id, on] of Object.entries(state.addedExtras)) if (on) state.picks[`anytime-${id}`] = true;
  delete state.addedExtras;
}
delete state.choices;
delete state.soloHotel;
state.lang = state.lang === 'en' ? 'en' : 'he';
state.theme = ['light','dark'].includes(state.theme) ? state.theme : 'auto';
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
  soundModeZen: B("Zen koto", "קוטו זן"),
  soundModeTrap: B("Night trap", "טראפ לילי"),
  startSound: B("Start", "הפעלה"),
  stopSound: B("Stop", "עצירה"),
  volume: B("Volume", "עוצמה"),
  stationChime: B("Station chime", "צליל תחנה"),
  localOnly: B("Local-only · no trackers", "מקומי בלבד · ללא מעקב"),
  masterPlan: B("MASTER PLAN", "תכנית האב"),
  itinerary: B("Itinerary", "מסלול"),
  itineraryIntro: B("Booked items are the dark blocks; everything else is an option. Tap 👍 or 👎 and your face shows next to it. Gilad approves the final plan.", "מה שהוזמן מופיע בבלוקים הכהים; כל השאר הן אפשרויות. הקישו 👍 או 👎 והפרצוף שלכם יופיע לידו. גלעד מאשר את התכנית הסופית."),
  expandAll: B("Expand all", "פתיחת הכל"),
  collapseAll: B("Collapse all", "סגירת הכל"),
  jogasakiCaption: B("Jōgasaki: the coast day worth protecting.", "ג׳וגסאקי: יום החוף שכדאי לשמור עליו."),
  popHeroCaption: B("Japan, turned all the way up.", "יפן, בפול ווליום."),
  discoveryEyebrow: B("🇯🇵 OPTIONAL DETOURS · ZERO HOMEWORK", "🇯🇵 סטיות אופציונליות · אפס שיעורי בית"),
  discoveryTitle: B("Japan side quests", "משימות צד יפניות"),
  discoveryIntro: B("Ideas for any day: design, temples, tiny prizes, and one suspicious stationmaster. 👍 or 👎 each one.", "רעיונות לכל יום: עיצוב, מקדשים, פרסים זעירים ומנהל תחנה חשוד אחד. 👍 או 👎 על כל אחד."),
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
  staysIntro: B("Your solo hotel, the five family stays, cancellation dates, and door-to-door directions.", "מלון הסולו, חמש הלינות המשפחתיות, מועדי ביטול והגעה מדלת לדלת."),
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
  fujiHakone: B("Fuji & Hakone", "פוג׳י והקונה"),
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
  booked: B("Booked", "הוזמן"),
  sleeping: B("Sleeping", "לינה"),
  flightHome: B("Flight home", "טיסה הביתה"),
  like: B("Like", "אהבתי"),
  dislike: B("Don't like", "לא אהבתי"),
  likedBy: B("Liked by", "אהבו"),
  dislikedBy: B("Didn't like", "לא אהבו"),
  approve: B("Approve", "אישור"),
  reject: B("Not this time", "לא הפעם"),
  undoVerdict: B("Undo Gilad's decision", "ביטול ההחלטה של גלעד"),
  inPlan: B("In the plan", "בתכנית"),
  votesSection: B("Votes", "הצבעות"),
  pickOne: B("Pick one", "בוחרים אחד"),
  pickConflict: B("Two choices approved; keep one", "אושרו שתי בחירות; להשאיר אחת"),
  votedOn: B("voted on", "עם הצבעות"),
  notThisTime: B("Not this time", "לא הפעם"),
  giladDecides: B("Gilad's decision", "ההחלטה של גלעד"),
  whoAreYou: B("Who are you?", "מי אתם?"),
  switchPerson: B("Switch person", "החלפת משתמש"),
  syncLocal: B("Votes are saved on this device only until live sync is switched on.", "ההצבעות נשמרות רק במכשיר הזה עד שהסנכרון החי יופעל."),
  syncConnecting: B("Connecting to the family votes…", "מתחבר להצבעות של המשפחה…"),
  syncLive: B("Live: everyone sees votes right away.", "מחובר: כולם רואים את ההצבעות מיד."),
  syncOffline: B("Offline: your votes will send when you reconnect.", "אין חיבור: ההצבעות יישלחו כשהחיבור יחזור."),
  free: B("Free", "חינם"),
  priceUnknown: B("Price not checked", "מחיר לא נבדק"),
  crowd: B("Crowd", "עומס"),
  tipsLabel: B("Details and tips", "פרטים וטיפים"),
  fromWishlist: B("From the wishlist", "מרשימת המשאלות"),
  unverifiedTag: B("Check first", "לבדוק קודם"),
  bookInfo: B("Book or info", "הזמנה או מידע"),
  yourPlan: B("The family plan", "התכנית המשפחתית"),
  reviewPlan: B("Review", "לאשר"),
  planShort: B("Plan", "התכנית"),
  noPicks: B("No votes yet. 👍 or 👎 on anything.", "עוד אין הצבעות. 👍 או 👎 על כל דבר."),
  planEmpty: B("Nothing approved yet.", "עוד לא אושר כלום."),
  noVotes: B("No votes yet.", "עוד אין הצבעות."),
  copyPlan: B("Copy plan as text", "העתקת התכנית כטקסט"),
  sharePlan: B("Share", "שיתוף"),
  printPlan: B("Print", "הדפסה"),
  anytime: B("Anytime", "בכל זמן"),
  allCategories: B("All", "הכול"),
  filterOptions: B("Filter options", "סינון אפשרויות"),
  theme: B("Theme", "ערכת צבע"),
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
  { id: "tokyo", label: T.familyTokyo },
  { id: "fuji", label: T.fujiHakone },
  { id: "kyoto", label: T.kyoto },
  { id: "finale", label: T.finale }
];

// Edit these two numbers to change the currency conversion everywhere.
const RATE_USD = 156;
const RATE_ILS = 52;

const TAGS = {
  nature:B("Nature","טבע"), jdm:B("JDM & cars","JDM ומכוניות"), shop:B("Shopping","קניות"), food:B("Food","אוכל"),
  culture:B("Culture","תרבות"), fun:B("Fun & theme parks","כיף ופארקים"), aqua:B("Aquariums","אקווריומים"),
  rain:B("Rain-proof","מתאים לגשם"), night:B("Evening","ערב"), move:B("Getting around","תחבורה")
};
const CROWD = [null, B("quiet","שקט"), B("moderate","בינוני"), B("busy","עמוס"), B("packed","צפוף")];
const SL = {
  morning:B("Morning","בוקר"), afternoon:B("Afternoon","אחר הצהריים"), evening:B("Evening","ערב"),
  allDay:B("All day","כל היום"), midday:B("Midday","צהריים"), lunch:B("Lunch","ארוחת צהריים"), dinner:B("Dinner","ארוחת ערב"),
  early:B("Early","מוקדם"), sunset:B("Sunset","שקיעה"), dusk:B("Dusk","בין ערביים"), anyTime:B("Any time","בכל שעה"),
  lateMorning:B("Late morning","סוף הבוקר"), lateAfternoon:B("Late afternoon","סוף אחר הצהריים"),
  afterLanding:B("After landing","אחרי הנחיתה"), by10:B("By 10:00","עד 10:00"), by11:B("By 11:00","עד 11:00"),
  afterTeamlab:B("After teamLab","אחרי teamLab"), beforeDinner:B("Before dinner","לפני ארוחת הערב"), dayBefore:B("Day before","יום לפני")
};
const FIVE = B("5 people","5 אנשים");
const DISNEY_GROUP = B("3 adults, 1 junior, 1 child","3 מבוגרים, נער/ה, ילד");
const DISNEY_URL = "https://www.tokyodisneyresort.jp/en/ticket/index.html";
const DISNEY_TIPS = [
  B("Estimate for 9 Oct: adults ¥10,900 each, Yaara at the junior price and Erel at the child price (up to ¥9,000 and ¥5,600). The final price shows at checkout.", "הערכה ל-9 באוקטובר: 10,900¥ למבוגר, יערה במחיר נוער ואראל במחיר ילד (עד 9,000¥ ו-5,600¥). המחיר הסופי מופיע בקופה."),
  B("Tickets are dated and sold online; buy before the day. You can’t switch parks after buying, and there are no refunds for a change of plan.", "הכרטיסים מתוארכים ונמכרים אונליין; לקנות לפני היום עצמו. אי אפשר להחליף פארק אחרי הקנייה, ואין החזר כספי על שינוי תכניות.")
];
const DAIKOKU_URL = "https://www.headout.com/tokyos-car-culture-daikoku-pa/tokyo-jdm-car-night-tour-with-daikoku-car-meet-and-local-guide-e-52169/";
const RAILWAY_URL = "https://www.kyotorailwaymuseum.jp/en/";

const days = [
  {
    id: "sep29", date: "2026-09-29", segment: "solo", stay: "tokyu", icon: "🛬", pace: "gentle",
    title: B("Land, orient, sleep", "נחיתה, התמצאות ושינה"),
    subtitle: B("LY075 · Narita T1 · no heroics on night one", "LY075 · נריטה T1 · בלי גבורה בערב הראשון"),
    tags: [["verified","green"], ["gentle","blue"]],
    schedule: [
      ["16:20","✈️",B("LY075 lands at Narita Terminal 1", "LY075 נוחתת בנריטה טרמינל 1"),B("Immigration, bags, customs. Keep the first evening deliberately sparse.", "הגירה, מזוודות ומכס. הערב הראשון נשאר בכוונה כמעט ריק.")],
      ["17:45–18:30","🚆",B("Narita Express toward Shibuya / Shinjuku", "נריטה אקספרס לשיבויה / שינג׳וקו"),B("Reserved seat, ¥3,330 to Shibuya/Shinjuku. Buy after landing; do not buy the 14-day round trip.", "מושב שמור, 3,330¥ לשיבויה/שינג׳וקו. קנייה אחרי הנחיתה; הכרטיס הלוך־חזור ל-14 יום לא מתאים.")],
      ["19:30","🛏️",B("Check in: Tokyu Stay Aoyama Premier", "צ׳ק־אין: Tokyu Stay Aoyama Premier"),B("Your solo base until 5 Oct. N’EX to Shibuya, then a short taxi.", "הבסיס שלך לבד עד 5 באוקטובר. N’EX לשיבויה ואז מונית קצרה.")],
      ["20:15","🍜",B("A small nearby dinner", "ארוחת ערב קטנה בקרבת מקום"),B("Convenience-store breakfast supplies, shower, sleep.", "לקנות ארוחת בוקר, מקלחת ושינה.")]
    ],
    callout: ["info", B("PNR •••• · seat 22H. Use the official airport map if baggage or rail signs feel unclear.", "PNR •••• · מושב 22H. להשתמש במפת הטרמינל הרשמית אם אזור המזוודות או הרכבת אינו ברור.")],
    links: [[B("Narita Terminal 1", "נריטה טרמינל 1"),"https://www.narita-airport.jp/en/company/media-center/publications-pamphlets/kannaimap/"],[B("JR East N’EX", "JR East N’EX"),"https://www.jreast.co.jp/en/multi/nex/tickets/"],[B("Tokyu Stay Aoyama Premier", "Tokyu Stay Aoyama Premier"),MAP("Tokyu Stay Aoyama Premier")]]
  },
  {
    id: "sep30", date: "2026-09-30", segment: "solo", stay: "tokyu", icon: "🏮", pace: "gentle",
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
    id: "oct01", date: "2026-10-01", segment: "solo", stay: "tokyu", icon: "💧", pace: "moderate",
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
    id: "oct02", date: "2026-10-02", segment: "solo", stay: "tokyu", icon: "◼", pace: "moderate",
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
    id: "oct03", date: "2026-10-03", segment: "solo", stay: "tokyu", icon: "🎓", pace: "gentle",
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
    id: "oct04", date: "2026-10-04", segment: "solo", stay: "tokyu", icon: "🕺", pace: "gentle",
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
    id: "oct05", date: "2026-10-05", segment: "solo", icon: "🧭", stay: "nakano",
    title: B("Your last solo day", "היום האחרון שלך לבד"),
    subtitle: B("Move to the Nakano apartment · the family takes off tonight, Israel time", "מעבר לדירה בנקאנו · המשפחה ממריאה הלילה, שעון ישראל"),
    note: B("Monday: Shinjuku Gyoen and many museums are closed.", "יום שני: שינג׳וקו גיואן ומוזיאונים רבים סגורים."),
    booked: [
      { s:SL.morning, t:B("Check out: Tokyu Stay Aoyama Premier", "צ׳ק־אאוט: Tokyu Stay Aoyama Premier"), d:B("Check the exact checkout time in your booking.", "לבדוק בהזמנה את שעת הצ׳ק־אאוט המדויקת.") },
      { s:SL.afternoon, t:B("Check in: Nakano apartment", "צ׳ק־אין: הדירה בנקאנו"), d:B("Door-code entry; online check-in is already done.", "כניסה בקוד; הצ׳ק־אין המקוון כבר בוצע."), ref:"••••" }
    ],
    opts: [
      { id:"oct05-motoyoyogi", s:SL.morning, t:B("Moto-Yoyogi and Yoyogi-Hachiman walk", "הליכה במוטו־יויוגי וביויוגי־האצ׳ימן"), d:B("Your childhood streets around Royal Yoyogi Gardens, then the quiet Yoyogi-Hachiman shrine.", "רחובות הילדות שלך סביב Royal Yoyogi Gardens, ואחר כך מקדש יויוגי־האצ׳ימן השקט."), c:1, y:0, tags:["culture"], q:"Yoyogi Hachimangu Shrine" },
      { id:"oct05-koenji", s:SL.afternoon, t:B("Koenji vintage scouting", "סיור וינטג׳ בקואנג׳י"), d:B("One stop from Nakano; scout the best vintage shops before the girls arrive.", "תחנה אחת מנקאנו; לאתר את חנויות הווינטג׳ הטובות לפני שהבנות מגיעות."), c:2, y:0, tags:["shop"], q:"Koenji vintage shops" },
      { id:"oct05-stock", s:SL.afternoon, t:B("Stock the apartment", "למלא את הדירה"), d:B("Supermarket run near Nakano-shimbashi: breakfast, snacks and water for five.", "סיבוב בסופר ליד נקאנו־שימבאשי: ארוחות בוקר, חטיפים ומים לחמישה."), c:1, y:8000, w:B("groceries","קניות מזון"), tags:["food"], q:"supermarket near Nakano-shimbashi Station" },
      { id:"oct05-pitinn", s:SL.evening, t:B("Shinjuku Pit Inn", "שינג׳וקו פיט אין"), d:B("Check the evening set list; walk-in jazz in the basement club.", "לבדוק את ההופעה של הערב; ג׳אז בלי הזמנה במועדון המרתף."), c:2, y:4000, w:B("you","אתה"), tags:["night","culture","rain"], q:"Shinjuku Pit Inn" },
      { id:"oct05-omoide", s:SL.evening, t:B("Omoide Yokocho yakitori", "יאקיטורי באומוידה יוקוצ׳ו"), d:B("Tiny grill stalls by Shinjuku station; most do vegetable skewers too.", "דוכני גריל זעירים ליד תחנת שינג׳וקו; ברובם יש גם שיפודי ירקות."), c:3, y:3000, w:B("you","אתה"), tags:["food","night"], q:"Omoide Yokocho" }
    ]
  },
  {
    id: "oct06", date: "2026-10-06", segment: "tokyo", icon: "👋", stay: "nakano",
    title: B("The family lands", "המשפחה נוחתת"),
    subtitle: B("LY075 · Narita T1 · private taxi to Nakano", "LY075 · נריטה T1 · מונית פרטית לנקאנו"),
    note: B("Gilad: leave Nakano by about 13:30 (N’EX from Shinjuku) to be in the arrivals hall before 16:20.", "גלעד: לצאת מנקאנו עד 13:30 בערך (N’EX משינג׳וקו) כדי להיות באולם הנחיתות לפני 16:20."),
    booked: [
      { s:"16:20", t:B("LY075 arrives Narita Terminal 1", "LY075 נוחתת בנריטה טרמינל 1"), d:B("Ayelet, Erel, Geffen and Yaara.", "אילת, אראל, גפן ויערה."), ref:"••••", q:"Narita Airport Terminal 1 International Arrivals" },
      { id:"narita-taxi", s:SL.afterLanding, t:B("Private taxi from Narita to Nakano", "מונית פרטית מנריטה לנקאנו"), d:B("About 90 minutes in traffic. Meet in the public 1F International Arrivals lobby; if you miss each other, regroup at an Information counter and share live location.", "כ-90 דקות בתנועה. נפגשים באולם מקבלי הפנים הציבורי בקומה 1; אם מתפספסים, נפגשים בדלפק מידע ומשתפים מיקום חי."), ref:"••••" }
    ],
    opts: [
      { id:"oct06-sushi", s:SL.evening, t:B("Conveyor-belt sushi near Nakano", "סושי על מסוע ליד נקאנו"), d:B("Easy first dinner; pick fish plates and skip the shellfish ones.", "ארוחה ראשונה קלה; לבחור צלחות דגים ולדלג על פירות הים."), c:2, y:12000, w:FIVE, tags:["food"], q:"kaitenzushi Nakano" },
      { id:"oct06-broadway", s:SL.evening, t:B("Nakano Broadway stroll", "שיטוט בנקאנו ברודווי"), d:B("Anime, figures and retro collectibles; most shops close around 20:00.", "אנימה, פיגורות ופריטי אספנות רטרו; רוב החנויות נסגרות סביב 20:00."), c:2, y:0, tags:["shop","rain"], q:"Nakano Broadway" },
      { id:"oct06-konbini", s:SL.evening, t:B("Konbini supper and an early night", "ארוחת קונביני ולילה מוקדם"), d:B("Onigiri, sandos and a first taste of konbini culture after a long flight.", "אוניגירי, סנדוויצ׳ים וטעימה ראשונה מתרבות הקונביני אחרי טיסה ארוכה."), c:1, y:5000, w:FIVE, tags:["food"], q:"convenience store Nakano-shimbashi" }
    ]
  },
  {
    id: "oct07", date: "2026-10-07", segment: "tokyo", icon: "⛩", stay: "nakano",
    title: B("Harajuku, Meiji Jingu and your old neighbourhood", "הרג׳וקו, מייג׳י ג׳ינגו והשכונה הישנה שלך"),
    subtitle: B("Forest shrine · youth fashion · Shibuya at sunset", "מקדש ביער · אופנת נוער · שיבויה בשקיעה"),
    opts: [
      { id:"oct07-meiji", s:SL.morning, t:B("Meiji Jingu forest walk", "הליכה ביער של מייג׳י ג׳ינגו"), d:B("A planted forest of 100,000 trees in the middle of the city; go before 9:00.", "יער נטוע של 100,000 עצים באמצע העיר; להגיע לפני 9:00."), c:2, y:0, tags:["nature","culture"], q:"Meiji Jingu" },
      { id:"oct07-yoyogi", s:SL.morning, t:B("Yoyogi Park and Moto-Yoyogi with the family", "פארק יויוגי ומוטו־יויוגי עם המשפחה"), d:B("Show them the house and the streets you grew up in.", "להראות להם את הבית ואת הרחובות שבהם גדלת."), c:1, y:0, tags:["culture","nature"], q:"Yoyogi Park" },
      { id:"oct07-takeshita", s:SL.afternoon, t:B("Takeshita Street and Cat Street", "רחוב טקשיטה וקאט סטריט"), d:B("Crepes and youth fashion on Takeshita, calmer boutiques and vintage on Cat Street.", "קרפים ואופנת נוער בטקשיטה, בוטיקים ווינטג׳ רגועים יותר בקאט סטריט."), c:4, y:0, tags:["shop","food"], q:"Takeshita Street" },
      { id:"oct07-omotesando", s:SL.afternoon, t:B("Omotesando and Omotesando Hills", "אומוטסנדו ואומוטסנדו הילס"), d:B("Flagship architecture and design shops along the zelkova avenue.", "אדריכלות של חנויות דגל וחנויות עיצוב לאורך שדרת עצי הזלקובה."), c:3, y:0, tags:["shop"], q:"Omotesando Hills" },
      { id:"oct07-libertywalk", wish:true, s:SL.afternoon, t:B("Liberty Walk Harajuku (Gilad and Erel)", "ליברטי ווק הרג׳וקו (גלעד ואראל)"), d:B("From Erel’s wishlist: the widebody car brand’s shop, with models, streetwear and car-culture detail. It opens around 11:30; check hours on the day.", "מרשימת המשאלות של אראל: החנות של מותג הרכבים הרחבים, עם דגמים, אופנת רחוב ותרבות רכב. נפתחת בערך ב-11:30; לבדוק שעות ביום עצמו."), c:2, y:0, tags:["jdm","shop"], q:"Liberty Walk Tokyo", b:"https://libertywalk.co.jp/tokyo/" },
      { id:"oct07-cosme", wish:true, s:SL.afternoon, t:B("@cosme TOKYO, Harajuku (for Yaara)", "‏@cosme TOKYO בהרג׳וקו (ליערה)"), d:B("Dad’s guess from the wishlist, not Yaara’s ask yet: a big multi-brand cosmetics store right by Harajuku Station.", "ניחוש של אבא מרשימת המשאלות, עדיין לא בקשה של יערה: חנות קוסמטיקה גדולה של מותגים רבים, ממש ליד תחנת הרג׳וקו."), c:3, y:0, tags:["shop","rain"], q:"@cosme TOKYO Harajuku" },
      { id:"oct07-mipig", wish:true, s:SL.afternoon, t:B("Mipig Cafe (micro-pigs)", "Mipig Cafe (חזירוני מיני)"), d:B("From the wishlist: micro-pigs wander the room and climb into laps. Popular with teens, so book a slot online ahead.", "מרשימת המשאלות: חזירוני מיני מסתובבים בחדר ומטפסים על הברכיים. פופולרי אצל בני נוער, אז להזמין מקום אונליין מראש."), c:3, y:null, tags:["fun","food"], q:"Mipig Cafe Harajuku" },
      { id:"oct07-shibuyasky", s:SL.sunset, t:B("Shibuya Sky", "שיבויה סקיי"), d:B("Open-air roof deck over the Scramble; book the sunset slot online.", "גג פתוח מעל צומת הסקרמבל; להזמין אונליין את משבצת השקיעה."), c:3, y:13000, w:FIVE, tags:["culture"], q:"Shibuya Sky", b:"https://www.shibuya-scramble-square.com/sky/" },
      { id:"oct07-parco", s:SL.evening, t:B("Shibuya Crossing, Parco and 109", "צומת שיבויה, פארקו ו-109"), d:B("Nintendo and Pokémon stores in Parco; 109 for teen fashion.", "חנויות נינטנדו ופוקימון בפארקו; 109 לאופנת נוער."), c:4, y:0, tags:["shop","fun","night"], q:"Shibuya Parco" },
      { id:"oct07-ghibli", s:SL.allDay, t:B("Ghibli Museum, Mitaka", "מוזיאון ג׳יבלי, מיטאקה"), d:B("Timed tickets sell out weeks ahead; only if you can still get them. Closed Tuesdays.", "כרטיסים לשעה נגמרים שבועות מראש; רק אם עוד אפשר להשיג. סגור בימי שלישי."), c:2, y:4100, w:FIVE, tags:["fun","rain","culture"], q:"Ghibli Museum", b:"https://www.ghibli-museum.jp/en/" }
    ]
  },
  {
    id: "oct08", date: "2026-10-08", segment: "tokyo", icon: "🌊", stay: "nakano",
    title: B("Tokyo Bay: teamLab and cars", "מפרץ טוקיו: teamLab ומכוניות"),
    subtitle: B("teamLab at 14:30 · Toyosu, Ginza or Odaiba around it", "teamLab ב-14:30 · טויוסו, גינזה או אודאיבה מסביב"),
    booked: [
      { id:"teamlab", s:"14:30", t:B("teamLab Planets TOKYO", "teamLab Planets TOKYO"), d:B("Entry window 14:30 to 15:00. You wade through water, so wear trousers that roll up. The QR code appears in My Tickets from midnight. You can change the time up to three times, until two hours before entry; there are no refunds.", "חלון כניסה 14:30 עד 15:00. הולכים בתוך מים, אז ללבוש מכנסיים שאפשר לקפל. קוד ה-QR מופיע ב-My Tickets מחצות. אפשר לשנות שעה עד שלוש פעמים, עד שעתיים לפני הכניסה; אין החזר כספי."), paid:B("¥20,500 paid","שולם 20,500¥"), q:"teamLab Planets TOKYO", privateUrl:"••••", urlLabel:B("My Tickets","My Tickets") }
    ],
    opts: [
      { id:"oct08-tsukiji", s:SL.morning, t:B("Tsukiji Outer Market brunch", "בראנץ׳ בשוק החיצוני של צוקיג׳י"), d:B("Tamagoyaki, grilled fish and fresh tuna; skip the scallop and squid stalls.", "טמגויאקי, דג צלוי וטונה טרייה; לדלג על דוכני הסקאלופ והקלמארי."), c:3, y:12000, w:FIVE, tags:["food"], q:"Tsukiji Outer Market" },
      { id:"oct08-senkyaku", s:SL.midday, t:B("Toyosu Senkyaku Banrai", "טויוסו סנקיאקו באנראי"), d:B("Edo-style food hall with a rooftop footbath, next door to teamLab.", "אולם אוכל בסגנון אדו עם אמבט רגליים על הגג, ליד teamLab."), c:2, y:10000, w:FIVE, tags:["food"], q:"Toyosu Senkyaku Banrai" },
      { id:"oct08-apit", s:SL.afterTeamlab, t:B("A PIT Autobacs Shinonome (Gilad and Erel)", "A PIT Autobacs שינונומה (גלעד ואראל)"), d:B("Tokyo’s biggest car-parts and tuning store; 10 minutes by taxi from teamLab.", "חנות חלקי הרכב והטיונינג הגדולה בטוקיו; 10 דקות במונית מ-teamLab."), c:2, y:0, tags:["jdm","shop","rain"], q:"A PIT Autobacs Shinonome", b:"https://www.apit-autobacs.com/shinonome/shopinfo/" },
      { id:"oct08-gundam", s:SL.afterTeamlab, t:B("Odaiba: Unicorn Gundam and DiverCity", "אודאיבה: גאנדם יוניקורן ודייברסיטי"), d:B("Life-size Gundam statue plus a big mall for the rest of the family.", "פסל גאנדם בגודל טבעי וקניון גדול לשאר המשפחה."), c:3, y:0, tags:["fun","shop"], q:"Unicorn Gundam Statue Odaiba", tips:[B("Miraikan nearby is closed for renovation from 1 Oct 2026 to 22 Apr 2027.", "מיראיקן הסמוך סגור לשיפוץ מ-1 באוקטובר 2026 עד 22 באפריל 2027.")] },
      { id:"oct08-nissan", s:SL.afternoon, t:B("Nissan Crossing, Ginza", "ניסאן קרוסינג, גינזה"), d:B("Nissan’s concept-car showroom on the main Ginza crossing.", "אולם התצוגה של ניסאן למכוניות קונספט, בצומת הראשי של גינזה."), c:2, y:0, tags:["jdm","rain"], q:"Nissan Crossing Ginza", b:"https://www.nissan.co.jp/crossing/en/access" },
      { id:"oct08-ginza", s:SL.afternoon, t:B("Ginza flagships: Uniqlo, Muji, Itoya", "חנויות הדגל בגינזה: יוניקלו, מוג׳י, איטויה"), d:B("Twelve floors of Uniqlo, and Itoya for Japanese stationery.", "שתים־עשרה קומות של יוניקלו, ואיטויה לכלי כתיבה יפניים."), c:3, y:0, tags:["shop","rain"], q:"Itoya Ginza" },
      { id:"oct08-rainbow", s:SL.evening, t:B("Rainbow Bridge at night", "גשר הקשת בלילה"), d:B("Walk the Odaiba seaside boardwalk for the lit-up bridge and bay.", "טיילת החוף של אודאיבה, עם הגשר והמפרץ המוארים."), c:2, y:0, tags:["night"], q:"Odaiba Seaside Park" }
    ]
  },
  {
    id: "oct09", date: "2026-10-09", segment: "tokyo", icon: "🏰", stay: "nakano",
    title: B("Disney day: Disneyland, DisneySea, or something else", "יום דיסני: דיסנילנד, דיסני־סי או משהו אחר"),
    subtitle: B("The last calm weekday before the long weekend", "יום החול השקט האחרון לפני סוף השבוע הארוך"),
    note: B("One day, one choice: Disneyland, DisneySea, Kamakura or Mount Takao. Friday is the last weekday before the three-day Sports Day weekend, so it is calmer than Saturday.", "יום אחד, בחירה אחת: דיסנילנד, דיסני־סי, קמקורה או הר טאקאו. שישי הוא יום החול האחרון לפני סוף השבוע הארוך של יום הספורט, אז רגוע יותר מבשבת."),
    opts: [
      { id:"oct09-disneysea", group:"oct09-day", s:SL.allDay, t:B("Tokyo DisneySea", "טוקיו דיסני־סי"), d:B("Unique to Tokyo, with themed ports and bigger thrill rides; the favourite for teens and adults.", "קיים רק בטוקיו, עם נמלים מעוצבים ומתקנים מרגשים יותר; המועדף על בני נוער ומבוגרים."), c:3, y:47300, w:DISNEY_GROUP, tags:["fun"], q:"Tokyo DisneySea", b:DISNEY_URL, tips:DISNEY_TIPS },
      { id:"oct09-disneyland", group:"oct09-day", s:SL.allDay, t:B("Tokyo Disneyland", "טוקיו דיסנילנד"), d:B("The classic park and parades; a better fit if Erel’s rides lead.", "הפארק הקלאסי והמצעדים; מתאים יותר אם המתקנים של אראל מובילים."), c:3, y:47300, w:DISNEY_GROUP, tags:["fun"], q:"Tokyo Disneyland", b:DISNEY_URL, tips:DISNEY_TIPS },
      { id:"oct09-kamakura", group:"oct09-day", s:SL.allDay, t:B("Kamakura, Hokokuji bamboo and Enoshima", "קמקורה, במבוק הוקוקו־ג׳י ואנושימה"), d:B("A bamboo grove with matcha, the Great Buddha, then Enoshima island and its aquarium.", "חורשת במבוק עם מאצ׳ה, הבודהה הגדול, ואז האי אנושימה והאקווריום שלו."), c:3, y:25000, w:B("5 people incl. trains","5 אנשים כולל רכבות"), tags:["nature","culture","aqua"], q:"Hokokuji Temple Kamakura", b:"https://www.odakyu.jp/english/passes/enoshima_kamakura/", tips:[
        B("Odakyu via Fujisawa takes about 70–80 minutes; the Enoshima–Kamakura 1-Day Pass pays off if you ride the Enoden twice.", "אודקיו דרך פוג׳יסאווה לוקחת כ-70–80 דקות; הכרטיס היומי Enoshima–Kamakura משתלם אם נוסעים באנודן פעמיים."),
        B("Pick the island or the aquarium, not the full version of both. The aquarium (09:00–17:00, last entry 16:00) is the rain plan: adults ¥2,800, Yaara ¥1,800 with her student ID, Erel ¥1,300.", "לבחור את האי או את האקווריום, לא את הגרסה המלאה של שניהם. האקווריום (09:00–17:00, כניסה אחרונה 16:00) הוא תכנית הגשם: מבוגר 2,800¥, יערה 1,800¥ עם תעודת תלמיד, אראל 1,300¥."),
        B("Hōkoku-ji needs a bus or taxi across town and has an early last entry; drop it if the morning runs long.", "הוקוקו־ג׳י דורש אוטובוס או מונית לצד השני של העיר ויש לו כניסה אחרונה מוקדמת; לוותר אם הבוקר מתארך.")
      ] },
      { id:"oct09-takao", group:"oct09-day", s:SL.allDay, t:B("Mount Takao hike", "טיול בהר טאקאו"), d:B("Old cedar forest trail to the summit temple; weekdays are far calmer.", "שביל ביער ארזים עתיק עד מקדש הפסגה; באמצע השבוע הרבה יותר רגוע."), c:2, y:7000, w:B("5 people incl. trains","5 אנשים כולל רכבות"), tags:["nature"], q:"Mount Takao" },
      { id:"oct09-daikoku", s:SL.evening, t:B("Daikoku PA JDM night tour (Gilad and Erel)", "סיור לילה JDM בדאיקוקו (גלעד ואראל)"), d:B("Guided ride to Japan’s famous car meet; Friday nights are strongest. Police sometimes close the car park, and tours reroute.", "נסיעה מודרכת למפגש הרכבים המפורסם ביפן; לילות שישי הכי חזקים. המשטרה סוגרת לפעמים את החניון, והסיורים משנים מסלול."), c:2, y:36000, w:B("2 people","2 אנשים"), tags:["jdm","night"], q:"Daikoku Parking Area", b:DAIKOKU_URL, tips:[B("Daikoku is a highway parking area with no public-transit access, so go only with a licensed tour. No meet is guaranteed.", "דאיקוקו הוא חניון על כביש מהיר בלי גישה בתחבורה ציבורית, אז רק עם סיור מורשה. אין הבטחה שיהיה מפגש.")] }
    ]
  },
  {
    id: "oct10", date: "2026-10-10", segment: "tokyo", icon: "🎒", stay: "nakano",
    title: B("Long weekend starts: city day and packing", "סוף השבוע הארוך מתחיל: יום בעיר ואריזה"),
    subtitle: B("Stay local · pack light for Fuji, Hakone and Kyoto", "להישאר קרוב · לארוז קל לפוג׳י, הקונה וקיוטו"),
    note: B("Saturday of a three-day weekend: everywhere is busy. Keep it local and pack light for Fuji, Hakone and Kyoto.", "שבת של סוף שבוע ארוך: עמוס בכל מקום. להישאר קרוב ולארוז קל לפוג׳י, הקונה וקיוטו."),
    opts: [
      { id:"oct10-sensoji", s:SL.early, t:B("Senso-ji before 8:30", "סנסו־ג׳י לפני 8:30"), d:B("Tokyo’s oldest temple before the crowds, then Nakamise street snacks.", "המקדש העתיק בטוקיו לפני ההמונים, ואחר כך חטיפים ברחוב נאקאמיסה."), c:2, y:0, tags:["culture"], q:"Senso-ji" },
      { id:"oct10-sumida", s:SL.morning, t:B("Sumida Aquarium and Skytree", "אקווריום סומידה וסקייטרי"), d:B("Penguins and jellyfish at the foot of the Skytree; indoors all day.", "פינגווינים ומדוזות למרגלות הסקייטרי; הכול בפנים."), c:3, y:10500, w:FIVE, tags:["aqua","rain","fun"], q:"Sumida Aquarium" },
      { id:"oct10-akihabara", s:SL.afternoon, t:B("Akihabara", "אקיהברה"), d:B("Anime, retro games at Super Potato, gadgets and capsule toys.", "אנימה, משחקי רטרו ב-Super Potato, גאדג׳טים וצעצועי קפסולה."), c:3, y:0, tags:["shop","fun","rain"], q:"Super Potato Akihabara" },
      { id:"oct10-kichijoji", s:SL.afternoon, t:B("Koenji and Kichijoji", "קואנג׳י וקיצ׳יג׳וג׳י"), d:B("Vintage in Koenji, then Inokashira Park’s pond and woods in Kichijoji.", "וינטג׳ בקואנג׳י, ואז הבריכה והחורש של פארק אינוקשירה בקיצ׳יג׳וג׳י."), c:2, y:0, tags:["shop","nature"], q:"Inokashira Park" },
      { id:"oct10-shimokita", s:SL.afternoon, t:B("Shimokitazawa vintage", "וינטג׳ בשימוקיטאזאווה"), d:B("Tokyo’s densest cluster of second-hand clothes shops.", "הריכוז הצפוף ביותר בטוקיו של חנויות בגדים יד שנייה."), c:3, y:0, tags:["shop"], q:"Shimokitazawa" },
      { id:"oct10-sushiclass", wish:true, unverified:true, s:SL.afternoon, t:B("Sushi-making class (Cooking Sun)", "סדנת הכנת סושי (Cooking Sun)"), d:B("From the wishlist and the earlier plan: a three-hour English class in Shinanomachi, listed 13:30–16:30, with ages 6–12 on the child rate. Check the Saturday schedule, and book only after written confirmation of the no-meat, no-pork and no-shellfish needs.", "מרשימת המשאלות ומהתכנית הקודמת: סדנה של שלוש שעות באנגלית בשינאנומאצ׳י, מפורסמת 13:30–16:30, וגילאי 6–12 בתעריף ילד. לבדוק את הלוח של שבת, ולהזמין רק אחרי אישור כתוב לצרכים: בלי בשר, בלי חזיר ובלי פירות ים."), c:1, y:null, tags:["food","rain"], q:"Cooking Sun Tokyo", b:"https://www.cooking-sun.com/tokyo-cooking-class/" },
      { id:"oct10-luggage", s:SL.evening, t:B("Leave the big suitcases", "להשאיר את המזוודות הגדולות"), d:B("Ask the Nakano host to hold them until 18 Oct, or ship them to Crane Stay by Yamato. Confirm how far ahead a delivery date can be set.", "לבקש מהמארח בנקאנו לשמור אותן עד 18 באוקטובר, או לשלוח אותן ל-Crane Stay ב-Yamato. לברר כמה זמן מראש אפשר לקבוע תאריך מסירה."), c:1, y:6000, w:B("2 cases","2 מזוודות"), tags:["move"], q:"Yamato Transport Nakano", tips:[B("Ship only after Crane Stay confirms someone can receive it, with the exact address, guest name and delivery date on the slip.", "לשלוח רק אחרי ש-Crane Stay מאשרים שמישהו יקבל, עם כתובת מדויקת, שם אורח ותאריך מסירה על הטופס.")] },
      { id:"oct10-daikoku", s:SL.evening, t:B("Daikoku PA night tour (Saturday)", "סיור לילה בדאיקוקו (שבת)"), d:B("Backup to Friday. Busier meets, but a higher chance of police closure.", "גיבוי ליום שישי. מפגשים עמוסים יותר, אבל סיכוי גבוה יותר לסגירה משטרתית."), c:3, y:36000, w:B("2 people","2 אנשים"), tags:["jdm","night"], q:"Daikoku Parking Area", b:DAIKOKU_URL }
    ]
  },
  {
    id: "oct11", date: "2026-10-11", segment: "fuji", icon: "🗻", stay: "miuraya",
    title: B("Into the Fuji forest", "אל יער פוג׳י"),
    subtitle: B("Azusa 81 · car from Otsuki · Kawaguchiko", "אזוסה 81 · רכב מאוצוקי · קוואגוצ׳יקו"),
    note: B("Allow about 45 minutes from Nakano to the Azusa platform with bags. The driver needs the original Israeli licence, the passport and an IDP issued in Israel less than a year before driving.", "להקצות כ-45 דקות מנקאנו לרציף של אזוסה עם התיקים. הנהג צריך רישיון ישראלי מקורי, דרכון ורישיון בינלאומי שהונפק בישראל פחות משנה לפני הנהיגה."),
    booked: [
      { s:"09:02", q:"Otsuki Station", m:"transit", t:B("Azusa 81, Shinjuku to Otsuki (10:13)", "אזוסה 81, משינג׳וקו לאוצוקי (10:13)"), d:B("Car 8, seats 9A, 9B, 10A, 10B, 11A. Seat ticket only: everyone taps an IC card for the fare.", "קרון 8, מושבים ⁦9A, 9B, 10A, 10B, 11A⁩. כרטיס מושב בלבד: כל אחד מעביר כרטיס IC לתשלום הנסיעה."), ref:"••••" },
      { id:"toyota", s:"11:00", q:"Toyota Rent a Car Otsuki Station", m:"walking", t:B("Toyota Rent a Car, Otsuki Station shop", "טויוטה רנט א קאר, סניף תחנת אוצוקי"), d:B("Corolla Cross, full package. Return Wed 14 Oct at 11:00 at the Mishima Shinkansen Ext. shop. Bring the passport, Israeli licence and IDP.", "קורולה קרוס, חבילה מלאה. החזרה ביום רביעי 14 באוקטובר ב-11:00 בסניף Mishima Shinkansen Ext. להביא דרכון, רישיון ישראלי ורישיון בינלאומי."), ref:"••••", paid:B("¥67,870","67,870¥") },
      { s:B("15:00 to 21:00","15:00 עד 21:00"), t:B("Check in: Miuraya", "צ׳ק־אין: מיאוראיה"), d:B("45 Kawaguchi, Fujikawaguchiko. Check-out 10:00.", "45 Kawaguchi, פוג׳יקוואגוצ׳יקו. צ׳ק־אאוט 10:00."), ref:"••••", url:MAP("Classic Japan Living Miuraya 45 Kawaguchi"), urlLabel:B("Map","מפה") }
    ],
    opts: [
      { id:"oct11-hoto", s:SL.lunch, t:B("Hoto Fudo", "הוטו פודו"), d:B("Thick noodles in miso broth with pumpkin and vegetables, the local dish.", "אטריות עבות במרק מיסו עם דלעת וירקות, המנה המקומית."), c:3, y:9000, w:FIVE, tags:["food"], q:"Hoto Fudo Kawaguchiko", tips:[B("Ask whether the broth uses meat or fish stock before ordering.", "לשאול אם המרק מבושל עם ציר בשר או דגים לפני שמזמינים.")] },
      { id:"oct11-aokigahara", s:SL.afternoon, t:B("Aokigahara caves and trail", "המערות והשביל של אאוקיגהארה"), d:B("Lava-forest trail between Fugaku Wind Cave and Narusawa Ice Cave; stay on marked paths.", "שביל ביער לבה בין מערת הרוח פוגאקו למערת הקרח נארוסאווה; להישאר בשבילים המסומנים."), c:3, y:2500, w:FIVE, tags:["nature"], q:"Fugaku Wind Cave" },
      { id:"oct11-iyashi", s:SL.afternoon, t:B("Saiko Iyashi no Sato", "סאייקו איאשי נו סאטו"), d:B("Restored thatched-roof village with crafts and Fuji views.", "כפר משוחזר של בתי קש עם מלאכות יד ונוף לפוג׳י."), c:2, y:2000, w:FIVE, tags:["culture"], q:"Saiko Iyashi no Sato Nenba" },
      { id:"oct11-subaruland", wish:true, unverified:true, s:SL.afternoon, t:B("Fuji Subaru Land", "פוג׳י סובארו לנד"), d:B("From Dad’s wishlist: a forest play park at the foot of Fuji, a short drive from Kawaguchiko. It’s pitched mainly at kids aged 4–10, so check that the zip line and bike pump track you noted exist and suit Erel at 11.", "מרשימת המשאלות של אבא: פארק משחקים ביער למרגלות פוג׳י, נסיעה קצרה מקוואגוצ׳יקו. הוא מכוון בעיקר לילדים בני 4–10, אז כדאי לבדוק שהאומגה ומסלול האופניים שרשמת קיימים ומתאימים לאראל בן ה-11."), c:2, y:null, tags:["fun","nature"], q:"Fuji Subaru Land" },
      { id:"oct11-asama", s:SL.lateAfternoon, t:B("Kawaguchi Asama Shrine cedars", "הארזים של מקדש קוואגוצ׳י אסאמה"), d:B("Ancient cedars a short walk from Miuraya; quiet at dusk.", "ארזים עתיקים במרחק הליכה קצר ממיאוראיה; שקט בין ערביים."), c:1, y:0, tags:["nature","culture"], q:"Kawaguchi Asama Shrine" },
      { id:"oct11-chureito", s:SL.afternoon, t:B("Chureito Pagoda", "פגודת צ׳ורייטו"), d:B("The postcard pagoda-and-Fuji view; 400 steps and very busy on a holiday weekend.", "נוף הגלויה של הפגודה והר פוג׳י; 400 מדרגות ועמוס מאוד בסוף שבוע של חג."), c:4, y:0, tags:["culture"], q:"Chureito Pagoda" }
    ]
  },
  {
    id: "oct12", date: "2026-10-12", segment: "fuji", icon: "🌅", stay: "villa",
    title: B("Fuji at dawn, then Hakone (Sports Day)", "פוג׳י עם שחר, ואז הקונה (יום הספורט)"),
    subtitle: B("Check out by 10:00 · drive south · villa night", "צ׳ק־אאוט עד 10:00 · נסיעה דרומה · לילה בווילה"),
    note: B("National holiday: expect traffic and crowds from mid-morning.", "חג לאומי: לצפות לפקקים ולעומס מאמצע הבוקר."),
    booked: [
      { s:SL.by10, t:B("Check out of Miuraya", "צ׳ק־אאוט ממיאוראיה") },
      { s:SL.afternoon, t:B("Check in: Rakuten STAY VILLA, South Wing 102", "צ׳ק־אין: Rakuten STAY VILLA, אגף דרום 102"), d:B("Unmanned; the online check-in link arrives the day before. Car-navigation map code 57 300 098*30.", "ללא צוות; קישור הצ׳ק־אין המקוון מגיע יום לפני. קוד מפה לניווט ברכב ⁦57 300 098*30⁩."), ref:"••••" }
    ],
    opts: [
      { id:"oct12-oishi", s:B("Sunrise 5:45","זריחה 5:45"), t:B("Oishi Park", "פארק אואישי"), d:B("Fuji across the lake with red kochia bushes; only worth it if Fuji is visible.", "פוג׳י מעבר לאגם עם שיחי קוכיה אדומים; שווה רק אם רואים את ההר."), c:1, y:0, tags:["nature"], q:"Oishi Park Fujikawaguchiko" },
      { id:"oct12-yamanaka", s:SL.morning, t:B("Lake Yamanaka", "אגם יאמאנאקה"), d:B("A quieter lake on the way south, with another Fuji angle.", "אגם שקט יותר בדרך דרומה, עם זווית נוספת על פוג׳י."), c:2, y:0, tags:["nature"], q:"Lake Yamanaka" },
      { id:"oct12-motorsports", s:SL.lateMorning, t:B("Fuji Motorsports Museum (Gilad and Erel)", "מוזיאון הספורט המוטורי של פוג׳י (גלעד ואראל)"), d:B("Racing and road cars from Japanese makers, beside Fuji Speedway. Check hours.", "מכוניות מרוץ וכביש של יצרניות יפניות, ליד מסלול Fuji Speedway. לבדוק שעות."), c:2, y:2500, w:B("Gilad + Erel, holiday price online","גלעד + אראל, מחיר חג אונליין"), tags:["jdm","rain"], q:"Fuji Motorsports Museum", b:"https://fuji-motorsports-museum.jp/en/ticket/", tips:[B("12 Oct is a holiday: ¥1,800 adult and ¥700 for Erel online (¥2,000 and ¥800 at the counter). Open 10:00–17:00, last entry 16:30.", "12 באוקטובר הוא יום חג: 1,800¥ למבוגר ו-700¥ לאראל אונליין (2,000¥ ו-800¥ בקופה). פתוח 10:00–17:00, כניסה אחרונה 16:30.")] },
      { id:"oct12-gotemba", s:SL.midday, t:B("Gotemba Premium Outlets", "גוטמבה פרימיום אאוטלטס"), d:B("Big outlet mall with Fuji views on the route; heavy holiday crowds.", "קניון אאוטלט גדול עם נוף לפוג׳י על הדרך; עומס כבד בחג."), c:4, y:0, tags:["shop"], q:"Gotemba Premium Outlets", b:"https://www.premiumoutlets.co.jp/en/gotemba/" },
      { id:"oct12-otome", s:SL.afternoon, t:B("Otome Pass viewpoint", "תצפית מעבר אוטומה"), d:B("The last Fuji view before dropping into Sengokuhara.", "נוף אחרון לפוג׳י לפני הירידה לסנגוקוהארה."), c:1, y:0, tags:["nature"], q:"Otome Pass" },
      { id:"oct12-bbq", s:SL.evening, t:B("Groceries and a villa dinner", "קניות וארוחה בווילה"), d:B("Cook on the BBQ terrace and soak in the villa’s bath.", "לבשל על מרפסת הברביקיו ולהתפנק באמבט של הווילה."), c:1, y:12000, w:FIVE, tags:["food"], q:"supermarket Sengokuhara Hakone" }
    ]
  },
  {
    id: "oct13", date: "2026-10-13", segment: "fuji", icon: "🌋", stay: "villa",
    title: B("Volcano, old cedars and pampas grass", "הר געש, ארזים עתיקים ועשב פמפס"),
    subtitle: B("A full Hakone day from the villa", "יום הקונה מלא מהווילה"),
    opts: [
      { id:"oct13-owakudani", s:"9:00", t:B("Owakudani by ropeway", "אוואקודאני ברכבל"), d:B("Steaming volcanic valley and black eggs. The ropeway opens at 09:00 (February–November); check it’s running that morning. The sulphur gas bothers anyone with asthma.", "עמק געשי מעלה אדים וביצים שחורות. הרכבל נפתח ב-09:00 (פברואר–נובמבר); לבדוק באותו בוקר שהוא פועל. גז הגופרית מפריע למי שיש לו אסתמה."), c:2, y:11000, w:FIVE, tags:["nature"], q:"Owakudani", b:"https://www.hakonenavi.jp/international/en/transportation/hakone-ropeway" },
      { id:"oct13-ashi", s:SL.lateMorning, t:B("Lake Ashi sightseeing boat", "שייט באגם אשי"), d:B("Pirate-ship round trip from Togendai: park there, cruise together, and come back to the car. Nobody has to drive round.", "שייט הלוך־חזור בספינת פיראטים מטוגנדאי: חונים שם, שטים כולם יחד וחוזרים לרכב. אף אחד לא צריך לנסוע מסביב."), c:3, y:13300, w:B("4 adult fares + Erel, round trip","4 כרטיסי מבוגר + אראל, הלוך־חזור"), tags:["fun"], q:"Hakone Sightseeing Cruise Togendai", b:"https://www.hakonenavi.jp/international/en/transportation/hakone-kankosen", tips:[B("Round trip ¥3,000 per adult (Yaara pays the adult fare) and ¥1,300 for Erel. Crossings take about 25–40 minutes; check the last boat back before you board.", "הלוך־חזור 3,000¥ למבוגר (יערה משלמת מחיר מבוגר) ו-1,300¥ לאראל. כל חצייה לוקחת כ-25–40 דקות; לבדוק את השייט האחרון חזרה לפני שעולים.")] },
      { id:"oct13-shrine", s:SL.midday, t:B("Hakone Shrine cedar approach", "שביל הארזים של מקדש הקונה"), d:B("Walk the cedar-lined approach; skip the long queue for the lakeside torii photo.", "ללכת בשביל הגישה המוקף ארזים; לדלג על התור הארוך לתמונה בשער הטוריאי שעל האגם."), c:3, y:0, tags:["culture","nature"], q:"Hakone Shrine" },
      { id:"oct13-tokaido", s:SL.midday, t:B("Old Tokaido cedar avenue and stone road", "שדרת הארזים ודרך האבן של הטוקאידו הישנה"), d:B("400-year-old cedars and a mossy Edo-era paved path; slippery when wet.", "ארזים בני 400 ושביל אבן מכוסה טחב מתקופת אדו; חלקלק כשרטוב."), c:1, y:0, tags:["nature"], q:"Hakone Old Cedar Avenue" },
      { id:"oct13-susuki", s:"15:30", t:B("Sengokuhara pampas grass", "עשב הפמפס של סנגוקוהארה"), d:B("A hillside of golden susuki grass at its October best, lit low in the late afternoon.", "גבעה של עשב סוסוקי מוזהב, במיטבו באוקטובר, באור נמוך של סוף אחר הצהריים."), c:3, y:0, tags:["nature"], q:"Sengokuhara Susuki Grass Field" },
      { id:"oct13-openair", s:SL.afternoon, t:B("Hakone Open-Air Museum", "מוזיאון הפסלים באוויר הפתוח של הקונה"), d:B("Outdoor sculptures, a Picasso pavilion and a hot-spring footbath.", "פסלים בחוץ, ביתן פיקאסו ואמבט רגליים של מעיין חם."), c:2, y:8400, w:FIVE, tags:["culture","fun"], q:"Hakone Open-Air Museum" },
      { id:"oct13-pola", s:SL.anyTime, t:B("Pola Museum and beech forest trail", "מוזיאון פולה ושביל יער האשור"), d:B("Modern art in a glass building plus a woodland walk; a solid rain plan.", "אמנות מודרנית בבניין זכוכית והליכה ביער; תכנית גשם טובה."), c:1, y:8000, w:FIVE, tags:["culture","nature","rain"], q:"Pola Museum of Art" },
      { id:"oct13-glass", s:SL.anyTime, t:B("Hakone Glass Forest", "יער הזכוכית של הקונה"), d:B("Venetian glass museum and gardens in Sengokuhara, near the villa.", "מוזיאון זכוכית ונציאנית וגנים בסנגוקוהארה, ליד הווילה."), c:2, y:7500, w:FIVE, tags:["culture","rain"], q:"Hakone Glass Forest" },
      { id:"oct13-numazu", wish:true, unverified:true, s:SL.anyTime, t:B("Numazu Deep Sea Aquarium (rain plan)", "אקווריום המצולות של נומאזו (תכנית גשם)"), d:B("From Dad’s wishlist: Suruga Bay is Japan’s deepest bay, and this small aquarium shows its deep-sea life, including coelacanth specimens. It’s roughly an hour’s drive each way from the villa, so only as a rain plan; check the drive and hours first.", "מרשימת המשאלות של אבא: מפרץ סורוגה הוא המפרץ העמוק ביפן, והאקווריום הקטן הזה מציג את חיי המצולות שלו, כולל דגימות של דג קלקנת. בערך שעת נסיעה לכל כיוון מהווילה, אז רק כתכנית גשם; לבדוק קודם את הנסיעה והשעות."), c:2, y:null, tags:["aqua","rain"], q:"Numazu Deep Sea Aquarium" }
    ]
  },
  {
    id: "oct14", date: "2026-10-14", segment: "kyoto", icon: "🚅", stay: "besso",
    title: B("Mishima to Kyoto", "ממישימה לקיוטו"),
    subtitle: B("Car back by 11:00 · Hikari 709 · first Kyoto evening", "הרכב חוזר עד 11:00 · Hikari 709 · ערב ראשון בקיוטו"),
    note: B("Kyoto Railway Museum is closed on Wednesdays.", "מוזיאון הרכבות של קיוטו סגור בימי רביעי."),
    booked: [
      { s:SL.by11, q:"Toyota Rent a Car Mishima Shinkansen", m:"driving", t:B("Return the car, Mishima Shinkansen Ext. shop", "החזרת הרכב, סניף Mishima Shinkansen Ext."), d:B("Refuel first, and photograph the fuel gauge.", "לתדלק קודם ולצלם את מד הדלק.") },
      { s:"11:46", q:"Mishima Station", m:"walking", t:B("Hikari 709, Mishima to Kyoto (13:37)", "Hikari 709, ממישימה לקיוטו (13:37)"), d:B("Car 6, seats 1A, 1B, 1C, 2A, 2B. QR ticket, or pick up at the machine.", "קרון 6, מושבים ⁦1A, 1B, 1C, 2A, 2B⁩. כרטיס QR, או איסוף במכונה."), ref:"••••", paid:B("¥49,990","49,990¥") },
      { s:B("From 16:00","מ-16:00"), q:"The Besso Soso Kyoto", m:"transit", t:B("Check in: The Besso Soso Kyoto", "צ׳ק־אין: The Besso Soso Kyoto"), d:B("Wakamiya-cho 465, Shimogyo. Door code. The host confirmed the setup for five.", "Wakamiya-cho 465, שימוגיו. קוד בדלת. המארח אישר סידור לחמישה."), ref:"••••" }
    ],
    opts: [
      { id:"oct14-skywalk", s:"9:00", m:"driving", t:B("Mishima Skywalk", "מישימה סקייווק"), d:B("A long suspension footbridge with a Fuji view, on the road down to Mishima. About 35–40 minutes’ drive from the villa; allow 45 minutes there.", "גשר הולכי רגל תלוי וארוך עם נוף לפוג׳י, בדרך למטה למישימה. כ-35–40 דקות נסיעה מהווילה; לתכנן 45 דקות במקום."), c:1, y:4200, w:FIVE, tags:["nature"], q:"Mishima Skywalk", tips:[B("The car is due back in Mishima at 11:00, after refuelling. Skywalk and Kakitagawa together only work if you leave the villa by 08:15 and keep both visits short; on a slow morning, pick one.", "הרכב צריך לחזור למישימה ב-11:00, אחרי תדלוק. סקייווק וקאקיטגאווה יחד מסתדרים רק אם יוצאים מהווילה עד 08:15 ומקצרים בשניהם; בבוקר איטי, לבחור אחד.")] },
      { id:"oct14-kakitagawa", s:"10:15", m:"driving", t:B("Kakitagawa spring", "מעיין קאקיטגאווה"), d:B("A crystal-clear river fed by Fuji snowmelt that filtered through lava for decades. About 10–15 minutes from the Mishima car return; 20 minutes there is enough.", "נהר צלול כבדולח, מוזן ממי שלג של פוג׳י שהסתננו דרך לבה במשך עשרות שנים. כ-10–15 דקות מהחזרת הרכב במישימה; 20 דקות במקום מספיקות."), c:1, y:0, tags:["nature"], q:"Kakitagawa Spring Park", tips:[B("With Skywalk first, arrive by about 10:15 and leave by 10:35 to refuel and return the car by 11:00.", "אם סקייווק קודם, להגיע בערך ב-10:15 ולצאת עד 10:35 כדי לתדלק ולהחזיר את הרכב עד 11:00.")] },
      { id:"oct14-biovortex", s:SL.afternoon, t:B("teamLab Biovortex Kyoto", "teamLab Biovortex Kyoto"), d:B("teamLab’s new Kyoto museum, 7 minutes’ walk from Kyoto Station’s Hachijo East exit. It fills the gap between the 13:37 arrival and the 16:00 check-in.", "המוזיאון החדש של teamLab בקיוטו, 7 דקות הליכה מיציאת Hachijo East בתחנת קיוטו. ממלא את הזמן בין ההגעה ב-13:37 לצ׳ק־אין ב-16:00."), c:3, y:16000, w:B("5 people, price depends on date","5 אנשים, המחיר תלוי בתאריך"), tags:["fun","rain"], q:"teamLab Biovortex Kyoto", b:"https://www.teamlab.art/e/kyoto/", tips:[
        B("Adults from about ¥3,400 depending on the date, ages 13–17 ¥2,800 (Yaara), ages 4–12 ¥1,800 (Erel). Book a timed slot online; buying on site costs ¥200 more.", "מבוגר מכ-3,400¥ לפי התאריך, גיל 13–17 2,800¥ (יערה), גיל 4–12 1,800¥ (אראל). להזמין משבצת זמן אונליין; קנייה במקום עולה 200¥ יותר."),
        B("Open 09:00–21:00, last entry 19:30. Leave the suitcases in Kyoto Station lockers first.", "פתוח 09:00–21:00, כניסה אחרונה 19:30. להשאיר קודם את המזוודות בלוקרים בתחנת קיוטו."),
        B("teamLab Planets on 8 Oct is already booked, so this is the second-round option. Here you stay dry; Planets is the one where you wade through water.", "teamLab Planets ב-8 באוקטובר כבר הוזמן, אז זו האפשרות לסיבוב שני. כאן נשארים יבשים; ב-Planets הולכים בתוך מים.")
      ] },
      { id:"oct14-aquarium", s:SL.afternoon, t:B("Kyoto Aquarium", "אקווריום קיוטו"), d:B("Near Kyoto station; giant salamanders and a dolphin show.", "ליד תחנת קיוטו; סלמנדרות ענק ומופע דולפינים."), c:2, y:10200, w:FIVE, tags:["aqua","rain"], q:"Kyoto Aquarium", b:"https://www.kyoto-aquarium.com/en/" },
      { id:"oct14-fushimi", s:SL.dusk, t:B("Fushimi Inari at dusk", "פושימי אינארי בין ערביים"), d:B("Thousands of red gates up the mountain; far quieter late in the day.", "אלפי שערים אדומים במעלה ההר; הרבה יותר שקט בסוף היום."), c:2, y:0, tags:["culture","nature"], q:"Fushimi Inari Taisha", tips:[B("Walk to the Yotsutsuji junction for the city view and back, about 75–90 minutes; there’s no need to summit.", "ללכת עד צומת יוצוצוג׳י לנוף העיר ובחזרה, כ-75–90 דקות; אין צורך להגיע לפסגה.")] },
      { id:"oct14-nishiki", s:B("Before 18:00","לפני 18:00"), t:B("Nishiki Market", "שוק נישיקי"), d:B("Kyoto’s food street: pickles, tofu, matcha sweets.", "רחוב האוכל של קיוטו: חמוצים, טופו וממתקי מאצ׳ה."), c:4, y:6000, w:B("snacks","חטיפים"), tags:["food"], q:"Nishiki Market" },
      { id:"oct14-pontocho", s:SL.evening, t:B("Pontocho and Gion walk", "הליכה בפונטוצ׳ו ובגיון"), d:B("Lantern-lit alleys by the river; dinner in Pontocho.", "סמטאות מוארות בפנסים ליד הנהר; ארוחת ערב בפונטוצ׳ו."), c:3, y:25000, w:B("5 people, dinner","5 אנשים, ארוחת ערב"), tags:["night","food"], q:"Pontocho" }
    ]
  },
  {
    id: "oct15", date: "2026-10-15", segment: "kyoto", icon: "🎋", stay: "besso",
    title: B("Arashiyama and the golden temple", "אראשיאמה ומקדש הזהב"),
    subtitle: B("Bamboo at 7:30 · gardens · Kinkaku-ji after 15:30", "במבוק ב-7:30 · גנים · קינקאקו־ג׳י אחרי 15:30"),
    photo: { src: "assets/sagano-train.webp", alt: B("Sagano Romantic Train at Torokko Kameoka Station", "רכבת סאגאנו הרומנטית בתחנת Torokko Kameoka"), credit: "Streetdeck · CC BY-SA 4.0", url: "https://commons.wikimedia.org/wiki/File:Sagano_Romantic_Train.jpg" },
    opts: [
      { id:"oct15-bamboo", s:"7:30", t:B("Arashiyama bamboo grove", "חורשת הבמבוק של אראשיאמה"), d:B("Go early; by 10:00 it’s shoulder to shoulder.", "להגיע מוקדם; ב-10:00 כבר צפוף כתף אל כתף."), c:1, y:0, tags:["nature"], q:"Arashiyama Bamboo Grove", tips:[B("For quieter bamboo later in the day, walk Saga-Toriimoto and Adashino instead of the central grove.", "לבמבוק שקט יותר בהמשך היום, ללכת בסאגה־טוריימוטו ובאדאשינו במקום בחורשה המרכזית.")] },
      { id:"oct15-tenryuji", s:SL.morning, t:B("Tenryu-ji garden", "הגן של טנריו־ג׳י"), d:B("Zen garden with a pond and a borrowed mountain view, next to the bamboo.", "גן זן עם בריכה ונוף הרים ״שאול״, ליד הבמבוק."), c:3, y:2500, w:FIVE, tags:["culture","nature"], q:"Tenryu-ji" },
      { id:"oct15-okochi", s:SL.morning, t:B("Okochi Sanso villa garden", "גן הווילה אוקוצ׳י סנסו"), d:B("Hillside garden with tea and a sweet included; much calmer than the grove.", "גן על צלע גבעה, כולל תה וממתק; הרבה יותר רגוע מהחורשה."), c:2, y:5000, w:FIVE, tags:["nature","culture"], q:"Okochi Sanso" },
      { id:"oct15-monkeys", s:SL.midday, t:B("Iwatayama Monkey Park", "פארק הקופים איוואטאיאמה"), d:B("A short steep climb to free-roaming macaques and a city view.", "עלייה קצרה ותלולה אל מקוקים שמסתובבים חופשי ונוף לעיר."), c:2, y:2800, w:FIVE, tags:["nature","fun"], q:"Iwatayama Monkey Park" },
      { id:"oct15-sagano", s:SL.midday, t:B("Sagano train and Hozugawa river boat", "רכבת סאגאנו וסירת נהר הוזוגאווה"), d:B("Scenic train up the gorge, two hours by boat back down. Book the train ahead.", "רכבת נוף במעלה הערוץ, שעתיים בסירה בחזרה למטה. להזמין את הרכבת מראש."), c:3, y:35000, w:FIVE, tags:["nature","fun"], q:"Sagano Scenic Railway", b:"https://www.sagano-kanko.co.jp/en/ticket/", tips:[
        B("Train and boat are separate bookings. The official pattern: the trolley reaches Kameoka at :25, the connecting bus leaves at :35 (about 10 minutes), and the boat takes about two hours to central Arashiyama.", "הרכבת והסירה הן הזמנות נפרדות. הדפוס הרשמי: הרכבת מגיעה לקמאוקה ב-:25, האוטובוס המחבר יוצא ב-:35 (כ-10 דקות), והסירה שטה כשעתיים עד מרכז אראשיאמה."),
        B("Seats for 15 Oct went on sale on 15 Sep, so check what’s left now. The boarding QR only appears on the day; a printed voucher alone isn’t valid.", "המושבים ל-15 באוקטובר נפתחו למכירה ב-15 בספטמבר, אז לבדוק מה נשאר עכשיו. קוד העלייה מופיע רק ביום עצמו; שובר מודפס לבדו אינו תקף."),
        B("Car 5 (“Rich”) is open-sided: no umbrellas, and you may get wet. Both services can cancel in bad weather.", "קרון 5 (״Rich״) פתוח בצדדים: בלי מטריות, ואפשר להירטב. שני השירותים עלולים להתבטל במזג אוויר גרוע.")
      ] },
      { id:"oct15-kinkakuji", s:SL.afternoon, t:B("Kinkaku-ji", "קינקאקו־ג׳י"), d:B("The golden pavilion; busiest midday, calmer after 15:30.", "ביתן הזהב; הכי עמוס בצהריים, רגוע יותר אחרי 15:30."), c:4, y:2500, w:FIVE, tags:["culture"], q:"Kinkaku-ji" }
    ]
  },
  {
    id: "oct16", date: "2026-10-16", segment: "kyoto", icon: "🌲", stay: "besso",
    title: B("Forest day in the northern mountains", "יום יער בהרים הצפוניים"),
    subtitle: B("Kurama to Kibune, Uji, or the railway museum", "מקוראמה לקיבונה, אוג׳י או מוזיאון הרכבות"),
    opts: [
      { id:"oct16-kurama", s:SL.allDay, t:B("Kurama to Kibune hike", "טיול מקוראמה לקיבונה"), d:B("A cedar-root trail over the mountain between two shrines; about 2 hours of walking.", "שביל של שורשי ארזים מעל ההר בין שני מקדשים; כשעתיים הליכה."), c:2, y:7500, w:FIVE, tags:["nature","culture"], q:"Kurama-dera", b:"https://kyoto.travel/en/getting-around/comfortable-access-to-kurama-kibune/", tips:[
        B("Getting there: JR, then Keihan, then the Eizan line, about 55 minutes each way. Bus 33 takes you from Kibune back to Kibuneguchi station.", "הגעה: JR, אחר כך קייהאן ואז קו אייזאן, כ-55 דקות לכל כיוון. אוטובוס 33 מחזיר מקיבונה לתחנת קיבונגוצ׳י."),
        B("The trail is 3.9 km of stone steps and roots with steady climbs. In heavy rain, skip it and ride the Eizan line to Kibune instead.", "השביל הוא 3.9 ק״מ של מדרגות אבן ושורשים עם עליות מתמשכות. בגשם כבד לוותר ולנסוע בקו אייזאן ישר לקיבונה.")
      ] },
      { id:"oct16-railway", s:SL.afternoon, t:B("Kyoto Railway Museum", "מוזיאון הרכבות של קיוטו"), d:B("Steam locomotives, shinkansen cabs and a driving simulator.", "קטרי קיטור, תאי נהג של שינקנסן וסימולטור נהיגה."), c:2, y:6300, w:FIVE, tags:["fun","rain","jdm"], q:"Kyoto Railway Museum", b:RAILWAY_URL },
      { id:"oct16-uji", s:SL.allDay, t:B("Uji: Byodoin and matcha", "אוג׳י: ביודו־אין ומאצ׳ה"), d:B("The temple on the 10-yen coin, and Japan’s matcha town.", "המקדש שעל מטבע 10 הין, ועיר המאצ׳ה של יפן."), c:3, y:6000, w:FIVE, tags:["culture","food"], q:"Byodoin", tips:[B("The Nintendo Museum from the wishlist is in Uji too. Entry has gone by advance lottery, so check the current ticket method before counting on it.", "מוזיאון נינטנדו מרשימת המשאלות נמצא גם הוא באוג׳י. הכניסה הייתה בהגרלה מראש, אז לבדוק את שיטת הכרטיסים הנוכחית לפני שסומכים על זה.")] },
      { id:"oct16-canal", s:SL.afternoon, t:B("Nanzen-ji aqueduct and Lake Biwa Canal Museum", "אמת המים של נאנזן־ג׳י ומוזיאון תעלת אגם ביווה"), d:B("A 19th-century brick aqueduct and the canal that powered modern Kyoto.", "אמת מים מלבנים מהמאה ה-19 והתעלה שהניעה את קיוטו המודרנית."), c:2, y:0, tags:["culture","nature"], q:"Lake Biwa Canal Museum" },
      { id:"oct16-philosopher", s:SL.afternoon, t:B("Philosopher’s Path to Ginkaku-ji", "שביל הפילוסוף עד גינקאקו־ג׳י"), d:B("Canal-side walk to the silver pavilion and its moss garden.", "הליכה לאורך התעלה עד ביתן הכסף וגן הטחב שלו."), c:3, y:2500, w:FIVE, tags:["nature","culture"], q:"Philosopher's Path Kyoto" },
      { id:"oct16-ceatec", s:SL.allDay, t:B("CEATEC day trip (solo)", "טיול יום ל-CEATEC (לבד)"), d:B("Kyoto to Makuhari is about 3 hours each way. Only if the show matters more than a Kyoto day. Registration is free.", "מקיוטו למקוהרי כשלוש שעות לכל כיוון. רק אם התערוכה חשובה יותר מיום בקיוטו. ההרשמה חינם."), c:3, y:30000, w:B("you, trains","אתה, רכבות"), tags:["culture","rain"], q:"Makuhari Messe", b:"https://www.ceatec.com/en/" }
    ]
  },
  {
    id: "oct17", date: "2026-10-17", segment: "kyoto", icon: "🏯", stay: "besso",
    title: B("Old Kyoto and a last shop", "קיוטו העתיקה וקניות אחרונות"),
    subtitle: B("Kiyomizu at 6:00 · Higashiyama lanes · covered arcades", "קיומיזו ב-6:00 · סמטאות היגאשיאמה · מדרחובים מקורים"),
    note: B("Saturday crowds in Higashiyama. Start early.", "עומס של שבת בהיגאשיאמה. להתחיל מוקדם."),
    opts: [
      { id:"oct17-kiyomizu", s:B("6:00 to 8:00","6:00 עד 8:00"), t:B("Kiyomizu-dera at opening", "קיומיזו־דרה בפתיחה"), d:B("The wooden stage over the valley with nobody on it.", "במת העץ מעל העמק, בלי אף אחד עליה."), c:1, y:2500, w:FIVE, tags:["culture"], q:"Kiyomizu-dera" },
      { id:"oct17-sannenzaka", s:SL.morning, t:B("Sannenzaka, Ninenzaka and Yasaka", "סאננזאקה, נינזאקה ויאסאקה"), d:B("Stepped lanes of old shops down to Yasaka Shrine and Gion.", "סמטאות מדורגות של חנויות ישנות עד מקדש יאסאקה וגיון."), c:4, y:0, tags:["culture","shop"], q:"Sannenzaka" },
      { id:"oct17-tea", s:SL.midday, t:B("Tea ceremony or kimono experience", "טקס תה או חוויית קימונו"), d:B("A short guided tea ceremony, or kimono rental for the girls.", "טקס תה קצר עם הדרכה, או השכרת קימונו לבנות."), c:2, y:20000, w:FIVE, tags:["culture","rain"], q:"tea ceremony Gion Kyoto" },
      { id:"oct17-teramachi", s:SL.afternoon, t:B("Teramachi and Shinkyogoku", "טראמאצ׳י ושינקיוגוקו"), d:B("Covered arcades with clothes, stationery and souvenirs.", "מדרחובים מקורים עם בגדים, כלי כתיבה ומזכרות."), c:3, y:0, tags:["shop","rain"], q:"Teramachi Shopping Street" },
      { id:"oct17-railway", s:SL.afternoon, t:B("Kyoto Railway Museum", "מוזיאון הרכבות של קיוטו"), d:B("Open today if you missed it on Friday.", "פתוח היום אם פספסתם ביום שישי."), c:3, y:6300, w:FIVE, tags:["fun","rain","jdm"], q:"Kyoto Railway Museum", b:RAILWAY_URL },
      { id:"oct17-isetan", s:SL.evening, t:B("Kyoto Station and Isetan", "תחנת קיוטו ואיסטן"), d:B("Food floors and the station’s rooftop skyway.", "קומות האוכל ומסלול הגג של התחנה."), c:3, y:0, tags:["shop","food","rain"], q:"JR Kyoto Isetan" }
    ]
  },
  {
    id: "oct18", date: "2026-10-18", segment: "finale", icon: "🏮", stay: "crane",
    title: B("Back to Tokyo", "חזרה לטוקיו"),
    subtitle: B("Kyoto check-out · the Nozomi still to book · Kawagoe floats", "צ׳ק־אאוט בקיוטו · נוזומי עדיין לא הוזמנה · עגלות קוואגואה"),
    photo: { src: "assets/kawagoe-festival.webp", alt: B("Illuminated float at Kawagoe Festival", "עגלה מוארת בפסטיבל קוואגואה"), credit: "Saitou.h · CC BY-SA / GFDL", url: "https://commons.wikimedia.org/wiki/File:A_float_in_Kawagoe_Festival.JPG" },
    booked: [
      { s:SL.by11, t:B("Check out: The Besso Soso", "צ׳ק־אאוט: The Besso Soso") },
      { s:B("From 15:00","מ-15:00"), q:"Aobadai 4-2-4 Meguro Tokyo", m:"transit", t:B("Check in: Crane Stay Shibuya", "צ׳ק־אין: Crane Stay שיבויה"), d:B("Aobadai 4-2-4, a two-bedroom house. Door code.", "Aobadai 4-2-4, בית עם שני חדרי שינה. קוד בדלת."), ref:"••••" }
    ],
    opts: [
      { id:"oct18-nozomi", s:SL.midday, t:B("Nozomi Kyoto to Shinagawa (not booked)", "נוזומי מקיוטו לשינאגאווה (לא הוזמן)"), d:B("About 2h10. A taxi from Shinagawa to Aobadai takes about 20 minutes.", "כשעתיים ועשר דקות. מונית משינאגאווה לאובאדאי לוקחת כ-20 דקות."), c:3, y:63800, w:B("4 adults, 1 child","4 מבוגרים, ילד"), tags:["move"], q:"Shinagawa Station", b:"https://smart-ex.jp/en/", tips:[B("Book all five together. Any bag over 160 cm in total dimensions needs an oversized-baggage seat; over 250 cm can’t go on the train.", "להזמין את כל החמישה יחד. כל תיק מעל 160 ס״מ בסכום הממדים צריך מושב עם אזור למזוודה גדולה; מעל 250 ס״מ אסור להעלות לרכבת.")] },
      { id:"oct18-kawagoe", s:B("18:00 to 19:00","18:00 עד 19:00"), t:B("Kawagoe Matsuri lantern floats", "עגלות הפנסים של פסטיבל קוואגואה"), d:B("UNESCO-listed float festival, on its last night. Direct trains from Shibuya take about an hour; very crowded.", "פסטיבל עגלות ברשימת אונסק״ו, בלילה האחרון שלו. רכבות ישירות משיבויה לוקחות כשעה; צפוף מאוד."), c:4, y:8000, w:B("5 people, trains","5 אנשים, רכבות"), tags:["culture","night"], q:"Kawagoe Ichibangai", b:"https://kawagoematsuri.jp/download/", tips:[
        B("The 2026 festival is officially 17–18 October. Download the float routes and hikkawase times when the 2026 programme is posted.", "פסטיבל 2026 נקבע רשמית ל-17–18 באוקטובר. להוריד את מסלולי העגלות ואת זמני ה-hikkawase כשתכנית 2026 תתפרסם."),
        B("Drop the bags at Crane Stay first; never carry luggage into the festival crowd. Agree a meeting point in case you get separated.", "להוריד קודם את התיקים ב-Crane Stay; לעולם לא להיכנס עם מזוודות לעומס הפסטיבל. לקבוע נקודת מפגש למקרה שמתפספסים.")
      ] },
      { id:"oct18-ship", offRoute:true, s:B("By 18 Oct","עד 18 באוקטובר"), t:B("Ship the big cases to Narita T1 for the 20 Oct flight", "לשלוח את המזוודות הגדולות לנריטה T1 לטיסה ב-20 באוקטובר"), d:B("Yamato needs bags at least two days before the flight, so hand them over today at the latest, before the counter’s cutoff, and collect them at T1 on the 20th. From Kyoto that may mean 17 Oct.", "ימאטו צריכה את התיקים לפחות יומיים לפני הטיסה, אז למסור אותם היום לכל המאוחר, לפני שעת הסגירה של הדלפק, ולאסוף ב-T1 ב-20. מקיוטו זה אולי אומר 17 באוקטובר."), c:1, y:6000, w:B("2 cases","2 מזוודות"), tags:["move"], q:"Narita Airport Terminal 1 baggage delivery counter", b:"https://www.kuronekoyamato.co.jp/ytc/en/send/services/airport/", tips:[B("The sending deadline varies by counter: ask for the exact cutoff for a 20 Oct Terminal 1 pickup. Pack two nights without the big cases.", "מועד המשלוח משתנה בין דלפקים: לשאול מה המועד המדויק לאיסוף ב-20 באוקטובר בטרמינל 1. לארוז לשני לילות בלי המזוודות הגדולות.")] },
      { id:"oct18-nakameguro", s:SL.evening, t:B("Nakameguro and Daikanyama", "נאקאמגורו ודאיקניאמה"), d:B("Canal-side cafés and the Daikanyama T-Site bookshop, walking distance from Crane.", "בתי קפה לאורך התעלה וחנות הספרים Daikanyama T-Site, במרחק הליכה מ-Crane."), c:2, y:0, tags:["shop","night"], q:"Daikanyama T-Site" },
      { id:"oct18-ikejiri", s:SL.evening, t:B("Neighbourhood dinner in Ikejiri-Ohashi", "ארוחה שכונתית באיקג׳ירי־אוהאשי"), d:B("Low-key local spots around the stay after a travel day.", "מקומות מקומיים ושקטים ליד הלינה אחרי יום נסיעה."), c:1, y:20000, w:FIVE, tags:["food"], q:"restaurants Ikejiri-Ohashi" }
    ]
  },
  {
    id: "oct19", date: "2026-10-19", segment: "finale", icon: "🎂", stay: "crane",
    title: B("Your 50th", "יום ההולדת ה-50 שלך"),
    subtitle: B("Your streets, a view, and the birthday dinner", "הרחובות שלך, נוף וארוחת יום ההולדת"),
    note: B("Monday: many museums close, and so do some restaurants. Book dinner now and confirm it’s open.", "יום שני: מוזיאונים רבים סגורים, וגם חלק מהמסעדות. להזמין ארוחה עכשיו ולוודא שהמקום פתוח."),
    opts: [
      { id:"oct19-motoyoyogi", s:SL.morning, t:B("Moto-Yoyogi and Yoyogi-Hachiman with the family", "מוטו־יויוגי ויויוגי־האצ׳ימן עם המשפחה"), d:B("Your streets on your birthday, if you didn’t do it on the 7th.", "הרחובות שלך ביום ההולדת שלך, אם לא הספקתם ב-7."), c:1, y:0, tags:["culture"], q:"Yoyogi Hachimangu Shrine" },
      { id:"oct19-borderless", s:SL.afternoon, t:B("teamLab Borderless, Azabudai Hills", "teamLab Borderless, אזבודאי הילס"), d:B("teamLab’s big museum with no set route: rooms flow into each other and the art moves between them. It sits between Tokyo Tower and the Andaz, so it fits the birthday afternoon.", "המוזיאון הגדול של teamLab בלי מסלול קבוע: החדרים זורמים זה לזה והאמנות עוברת ביניהם. נמצא בין מגדל טוקיו ל-Andaz, אז מתאים לאחר הצהריים של יום ההולדת."), c:3, y:18000, w:B("5 people, price depends on date","5 אנשים, המחיר תלוי בתאריך"), tags:["fun","rain"], q:"teamLab Borderless Azabudai Hills", b:"https://www.teamlab.art/e/borderless-azabudai/", tips:[
        B("Adults from ¥3,600, higher on busy dates; ages 13–17 ¥2,800 (Yaara); ages 4–12 ¥1,500 (Erel). Book a timed slot online; buying on site costs ¥200 more.", "מבוגר מ-3,600¥, יותר בתאריכים עמוסים; גיל 13–17 2,800¥ (יערה); גיל 4–12 1,500¥ (אראל). להזמין משבצת זמן אונליין; קנייה במקום עולה 200¥ יותר."),
        B("About 2 minutes from Kamiyacho Station (Hibiya Line), exit 5. Allow 2–3 hours.", "כ-2 דקות מתחנת קאמיאצ׳ו (קו היביה), יציאה 5. לתכנן 2–3 שעות."),
        B("Different from Planets on 8 Oct: no water and no fixed route. Opening hours change by date, so check the official calendar for 19 Oct.", "שונה מ-Planets ב-8 באוקטובר: בלי מים ובלי מסלול קבוע. שעות הפתיחה משתנות לפי תאריך, אז לבדוק בלוח הרשמי את 19 באוקטובר.")
      ] },
      { id:"oct19-tower", s:SL.afternoon, t:B("Tokyo Tower and Shiba Park", "מגדל טוקיו ופארק שיבה"), d:B("The classic view with the tower above the old Zojo-ji temple.", "הנוף הקלאסי עם המגדל מעל מקדש זוג׳ו־ג׳י העתיק."), c:3, y:7000, w:FIVE, tags:["culture"], q:"Tokyo Tower" },
      { id:"oct19-andaz", s:SL.beforeDinner, t:B("Rooftop drinks, Andaz Tokyo (20+ only)", "משקה על הגג, Andaz Tokyo (מגיל 20 בלבד)"), d:B("52nd-floor bar at Toranomon Hills for a sunset toast. Guests must be 20 or older, so it’s Gilad, Ayelet and Geffen only; Yaara and Erel can’t come in.", "בר בקומה 52 בטורנומון הילס להרמת כוסית בשקיעה. הכניסה מגיל 20 בלבד, אז רק גלעד, אילת וגפן; יערה ואראל לא יכולים להיכנס."), c:2, y:9000, w:B("3 adults, 20+","3 מבוגרים, מגיל 20"), tags:["night"], q:"Andaz Tokyo Rooftop Bar" },
      { id:"oct19-kaiseki", s:SL.dinner, t:B("Kaiseki in a private room", "קאיסקי בחדר פרטי"), d:B("A multi-course seasonal dinner; ask for a fish-only, no-shellfish menu. Kikunoi Akasaka is one to check.", "ארוחה עונתית רבת מנות; לבקש תפריט דגים בלבד, בלי פירות ים. את קיקונוי אקסאקה כדאי לבדוק."), c:1, y:150000, w:B("5 people, est.","5 אנשים, הערכה"), tags:["food"], q:"Kikunoi Akasaka" },
      { id:"oct19-omakase", s:SL.dinner, t:B("Sushi omakase counter", "דלפק סושי אומקסה"), d:B("A private counter experience; fish only, with written notice of no shellfish, squid or octopus.", "חוויה בדלפק פרטי; דגים בלבד, עם הודעה כתובה: בלי פירות ים, קלמארי או תמנון."), c:1, y:125000, w:B("5 people, est.","5 אנשים, הערכה"), tags:["food"], q:"sushi omakase Ebisu" },
      { id:"oct19-teppanyaki", s:SL.dinner, t:B("Teppanyaki with a city view", "טפניאקי עם נוף לעיר"), d:B("A chef-at-the-table grill in a hotel; vegetable and fish courses available.", "גריל עם שף ליד השולחן במלון; יש מנות ירקות ודגים."), c:1, y:100000, w:B("5 people, est.","5 אנשים, הערכה"), tags:["food"], q:"teppanyaki hotel Tokyo view" },
      { id:"oct19-gonpachi", s:SL.dinner, t:B("Gonpachi Nishi-Azabu", "גונפאצ׳י נישי־אזאבו"), d:B("A big, lively wooden hall with a broad menu; fun rather than formal.", "אולם עץ גדול ותוסס עם תפריט רחב; כיף יותר מרשמי."), c:3, y:30000, w:FIVE, tags:["food","night"], q:"Gonpachi Nishi-Azabu" }
    ]
  },
  {
    id: "oct20", date: "2026-10-20", segment: "finale", icon: "✈️", stay: null,
    title: B("Last morning, then Narita", "בוקר אחרון, ואז נריטה"),
    subtitle: B("Check out by 11:00 · LY076 at 19:35", "צ׳ק־אאוט עד 11:00 · LY076 ב-19:35"),
    booked: [
      { s:SL.by11, t:B("Check out: Crane Stay", "צ׳ק־אאוט: Crane Stay"), d:B("Ask the host about keeping bags until you leave for the airport.", "לשאול את המארח אם אפשר להשאיר תיקים עד היציאה לשדה.") },
      { s:"19:35", t:B("LY076 Narita T1 to Tel Aviv", "LY076 מנריטה T1 לתל אביב"), d:B("Be at the airport by about 16:30.", "להיות בשדה עד 16:30 בערך."), ref:"••••" }
    ],
    opts: [
      { id:"oct20-donki", s:SL.morning, t:B("Last shop in Shibuya", "קניות אחרונות בשיבויה"), d:B("Don Quijote, Loft and Tokyu Hands; bring passports for tax-free.", "דון קיחוטה, Loft ו-Tokyu Hands; להביא דרכונים לפטור ממס."), c:3, y:0, tags:["shop","rain"], q:"MEGA Don Quijote Shibuya" },
      { id:"oct20-nex", s:"15:00", t:B("Narita Express from Shibuya", "נריטה אקספרס משיבויה"), d:B("About 80 minutes, reserved seats, luggage racks.", "כ-80 דקות, מושבים שמורים, מדפים למזוודות."), c:2, y:16000, w:FIVE, tags:["move"], q:"Shibuya Station Narita Express", b:"https://www.jreast.co.jp/multi/en/nex/" },
      { id:"oct20-limo", s:"15:00", t:B("Airport limousine bus from Shibuya", "אוטובוס לימוזין לשדה משיבויה"), d:B("A door-to-terminal coach from Shibuya; the driver loads the bags.", "אוטובוס משיבויה ישר לטרמינל; הנהג מעמיס את התיקים."), c:2, y:17000, w:FIVE, tags:["move"], q:"Shibuya Mark City Airport Limousine" },
      { id:"oct20-jumbo", s:"14:45", t:B("Private jumbo taxi from Crane Stay", "מונית ג׳מבו פרטית מ-Crane Stay"), d:B("Door to door with all the bags; easiest with luggage.", "מדלת לדלת עם כל התיקים; הכי קל עם מזוודות."), c:1, y:35000, w:FIVE, tags:["move"], q:"Aobadai 4-2-4 Meguro" }
    ]
  },
  {
    id: "oct21", date: "2026-10-21", segment: "finale", icon: "🏠", stay: null,
    title: B("Home", "הביתה"),
    subtitle: B("Ben Gurion at 02:20", "נתב״ג ב-02:20"),
    booked: [
      { s:"02:20", t:B("Arrive Tel Aviv, Ben Gurion T3", "נחיתה בתל אביב, נתב״ג טרמינל 3") }
    ],
    opts: []
  }
];

// Map queries for each base; the routes below start and end at these.
const STAY_Q = {
  tokyu: "Tokyu Stay Aoyama Premier",
  nakano: "Nakano-shimbashi Station Tokyo",
  miuraya: "Classic Japan Living Miuraya 45 Kawaguchi Fujikawaguchiko",
  villa: "Rakuten STAY VILLA Hakone Sengokuhara",
  besso: "The Besso Soso Kyoto",
  crane: "Aobadai 4-2-4 Meguro Tokyo"
};

// Base route per day: [origin, destination, fixed stops, mode]. Picked options are added as stops.
const dayRoutes = {
  sep29: ["Narita Airport Terminal 1", STAY_Q.tokyu, ["Shibuya Station"], "transit"],
  sep30: ["39-1 Motoyoyogicho Tokyo", "Yoyogi-Uehara Station", ["Yoyogi Park Cycling Center"], "walking"],
  oct01: ["Tokyo Waterworks Historical Museum", "Inokashira Park", [], "transit"],
  oct02: ["Nezu Museum", "Cat Street Harajuku", [], "walking"],
  oct03: ["21_21 Design Sight", "Meiji Jingu Gaien", [], "walking"],
  oct04: ["Meiji Jingu", "Daikanyama T-Site", ["Yoyogi Park Harajuku Entrance"], "transit"],
  oct05: [STAY_Q.tokyu, STAY_Q.nakano, [], "transit"],
  oct06: [STAY_Q.nakano, STAY_Q.nakano, [], "transit"],
  oct07: [STAY_Q.nakano, STAY_Q.nakano, [], "transit"],
  oct08: [STAY_Q.nakano, STAY_Q.nakano, [], "transit"],
  oct09: [STAY_Q.nakano, STAY_Q.nakano, [], "transit"],
  oct10: [STAY_Q.nakano, STAY_Q.nakano, [], "transit"],
  oct11: [STAY_Q.nakano, STAY_Q.miuraya, [], "driving"],
  oct12: [STAY_Q.miuraya, STAY_Q.villa, [], "driving"],
  oct13: [STAY_Q.villa, STAY_Q.villa, [], "driving"],
  oct14: [STAY_Q.villa, STAY_Q.besso, [], "transit"],
  oct15: [STAY_Q.besso, STAY_Q.besso, [], "transit"],
  oct16: [STAY_Q.besso, STAY_Q.besso, [], "transit"],
  oct17: [STAY_Q.besso, STAY_Q.besso, [], "transit"],
  oct18: [STAY_Q.besso, STAY_Q.crane, ["Kyoto Station", "Shinagawa Station"], "transit"],
  oct19: [STAY_Q.crane, STAY_Q.crane, [], "transit"],
  oct20: [STAY_Q.crane, "Narita Airport Terminal 1", [], "transit"]
};

const photoQueries = {
  sep29:"Narita Airport Terminal 1 Japan", sep30:"Moto Yoyogi Yoyogi Park Tokyo", oct01:"Tokyo Waterworks Historical Museum Inokashira Park", oct02:"Aoyama Nezu Museum architecture Harajuku", oct03:"21_21 Design Sight Meiji Jingu Gaien", oct04:"Meiji Jingu Yoyogi Park Sunday",
  oct05:"Koenji vintage Nakano Tokyo", oct06:"Narita Airport Terminal 1 arrivals", oct07:"Meiji Jingu Takeshita Street Shibuya Sky", oct08:"teamLab Planets Tokyo Toyosu", oct09:"Tokyo DisneySea Kamakura Great Buddha", oct10:"Senso-ji Akihabara Shimokitazawa",
  oct11:"Kawaguchiko Mount Fuji Aokigahara", oct12:"Oishi Park Mount Fuji kochia Hakone", oct13:"Owakudani Lake Ashi Sengokuhara susuki", oct14:"Mishima Skywalk Fushimi Inari dusk", oct15:"Arashiyama bamboo Kinkaku-ji Sagano", oct16:"Kurama Kibune Uji Byodoin",
  oct17:"Kiyomizu-dera Sannenzaka Kyoto", oct18:"Kawagoe Festival floats night", oct19:"Tokyo Tower night kaiseki", oct20:"Narita Express Terminal 1", oct21:"Ben Gurion airport"
};

const regionMaps = [
  { icon:"日", title:B("Whole trip · Japan","כל הטיול · יפן"), text:B("Tokyo → Fuji → Hakone → Kyoto → Tokyo, with the airport legs visible.","טוקיו ← פוג׳י ← הקונה ← קיוטו ← טוקיו, כולל קטעי שדה התעופה."), route:["Narita Airport Terminal 1","Narita Airport Terminal 1",["Tokyo","Fujikawaguchiko","Hakone Sengokuhara","Kyoto"],"transit"] },
  { icon:"東", title:B("Tokyo master map","מפת האב של טוקיו"), text:B("Solo week, the Nakano base, Harajuku, the bay, and the final stay in Aobadai.","שבוע הסולו, הבסיס בנקאנו, הרג׳וקו, המפרץ והלינה האחרונה באובאדאי."), route:["Motoyoyogicho Tokyo","Odaiba Tokyo",[STAY_Q.nakano,"Meiji Jingu","teamLab Planets TOKYO",STAY_Q.crane],"transit"] },
  { icon:"富", title:B("Fuji & Hakone by car","פוג׳י והקונה ברכב"), text:B("Otsuki pickup, Kawaguchiko, the drive to Sengokuhara, and the Mishima return.","איסוף באוצוקי, קוואגוצ׳יקו, הנסיעה לסנגוקוהארה וההחזרה במישימה."), route:["Otsuki Station","Mishima Station",[STAY_Q.miuraya,"Oishi Park Fujikawaguchiko",STAY_Q.villa,"Owakudani"],"driving"] },
  { icon:"京", title:B("Kyoto master map","מפת האב של קיוטו"), text:B("The Besso base, Arashiyama, Kinkaku-ji, Kurama and Higashiyama.","הבסיס ב-Besso, אראשיאמה, קינקאקו־ג׳י, קוראמה והיגאשיאמה."), route:["Kyoto Station","Kiyomizu-dera",[STAY_Q.besso,"Arashiyama Bamboo Grove","Kinkaku-ji","Kurama-dera"],"transit"] }
];

const stays = [
  {
    id: "tokyu", icon: "🏙", status: B("Gilad solo · confirmed", "גלעד לבד · מאושר"),
    name: "Tokyu Stay Aoyama Premier", dates: B("29 Sep–5 Oct · 6 nights", "29 בספטמבר–5 באוקטובר · 6 לילות"),
    address: B("Minami-Aoyama, Minato-ku; the exact address is in your booking", "מינאמי־אאויאמה, מינאטו; הכתובת המדויקת בהזמנה"), station: B("Gaienmae or Omotesando; confirm from the booking", "גאיאנמאה או אומוטסנדו; לאשר לפי ההזמנה"),
    confirmation: "", phone: "",
    cancellation: B("The old record’s free-cancellation date (25 Sep) has passed.", "מועד הביטול החינמי ברישום הישן (25 בספטמבר) עבר."),
    route: B("From Narita: N’EX to Shibuya, then a short taxi.", "מנריטה: N’EX לשיבויה ואז מונית קצרה."),
    luggage: B("Ask whether you can leave bags after checkout on 5 Oct until the Nakano check-in.", "לשאול אם אפשר להשאיר תיקים אחרי הצ׳ק־אאוט ב-5 באוקטובר עד הצ׳ק־אין בנקאנו."),
    map: MAP("Tokyu Stay Aoyama Premier")
  },
  {
    id: "nakano", icon: "🏠", status: B("Family base · confirmed", "בסיס משפחתי · מאושר"),
    name: "Nakano apartment · PREMIER suite Shinjuku West", dates: B("5–11 Oct · 6 nights", "5–11 באוקטובר · 6 לילות"),
    address: B("Near Nakano-shimbashi; the exact address is in your booking", "ליד נקאנו־שימבאשי; הכתובת המדויקת בהזמנה"), station: B("Nakano-shimbashi (Marunouchi Line branch)", "נקאנו־שימבאשי (שלוחת קו מרונוצ׳י)"),
    confirmation: "••••", phone: "",
    cancellation: B("Check the live policy in Booking.com.", "לבדוק את המדיניות העדכנית ב-Booking.com."),
    route: B("From Narita: the private taxi on 6 Oct, about 90 minutes.", "מנריטה: המונית הפרטית ב-6 באוקטובר, כ-90 דקות."),
    luggage: B("Door-code entry; online check-in is done. Ask the host whether the big suitcases can stay here until 18 Oct.", "כניסה בקוד; הצ׳ק־אין המקוון בוצע. לשאול את המארח אם המזוודות הגדולות יכולות להישאר כאן עד 18 באוקטובר."),
    map: MAP("Nakano-shimbashi Station")
  },
  {
    id: "miuraya", icon: "🗻", status: B("Confirmed · one night", "מאושר · לילה אחד"),
    name: "Classic Japan Living Miuraya", dates: B("11–12 Oct · 1 night", "11–12 באוקטובר · לילה אחד"),
    address: "45 Kawaguchi, Fujikawaguchiko, Yamanashi", station: B("By car; Kawaguchi Asama Shrine is a short walk away", "ברכב; מקדש קוואגוצ׳י אסאמה במרחק הליכה קצר"),
    confirmation: "••••", phone: "",
    cancellation: B("Check the live policy in Booking.com.", "לבדוק את המדיניות העדכנית ב-Booking.com."),
    route: B("Drive from Otsuki after the 11:00 car pickup. Check-in 15:00–21:00.", "נסיעה מאוצוקי אחרי איסוף הרכב ב-11:00. צ׳ק־אין 15:00–21:00."),
    luggage: B("One-night stop: bring in only what you need. Check-out is at 10:00.", "עצירה ללילה אחד: להכניס רק מה שצריך. צ׳ק־אאוט ב-10:00."),
    map: MAP("Classic Japan Living Miuraya 45 Kawaguchi")
  },
  {
    id: "villa", icon: "♨️", status: B("Confirmed · unmanned villa", "מאושר · וילה ללא צוות"),
    name: "Rakuten STAY VILLA Hakone Sengokuhara · South Wing 102", dates: B("12–14 Oct · 2 nights", "12–14 באוקטובר · 2 לילות"),
    address: B("Sengokuhara, Hakone; the exact address is in your booking", "סנגוקוהארה, הקונה; הכתובת המדויקת בהזמנה"), station: B("By car · navigation map code 57 300 098*30", "ברכב · קוד מפה לניווט ⁦57 300 098*30⁩"),
    confirmation: "••••", phone: "",
    cancellation: B("Check the live policy in Booking.com.", "לבדוק את המדיניות העדכנית ב-Booking.com."),
    route: B("Drive from Kawaguchiko via Gotemba; expect Sports Day traffic on 12 Oct.", "נסיעה מקוואגוצ׳יקו דרך גוטמבה; לצפות לפקקי יום הספורט ב-12 באוקטובר."),
    luggage: B("The online check-in link arrives the day before. Reply through Booking.com with your email address so it reaches you.", "קישור הצ׳ק־אין המקוון מגיע יום לפני. לענות דרך Booking.com עם כתובת המייל שלך כדי שיגיע אליך."),
    parking: B("Confirm parking for the Corolla Cross in the check-in message.", "לאשר חניה לקורולה קרוס בהודעת הצ׳ק־אין."),
    map: MAP("Rakuten STAY VILLA Hakone Sengokuhara")
  },
  {
    id: "besso", icon: "⛩", status: B("Kyoto base · keeper", "בסיס קיוטו · נשאר"),
    name: "The Besso Soso Kyoto", dates: B("14–18 Oct · 4 nights", "14–18 באוקטובר · 4 לילות"),
    address: "Wakamiya-cho 465, Shimogyo-ku, Kyoto", station: B("Near Kyoto Station; confirm the walk in the booking", "ליד תחנת קיוטו; לאשר את ההליכה לפי ההזמנה"),
    confirmation: "••••", phone: "",
    cancellation: B("Free cancellation until 29 Sep; nothing to do unless plans change.", "ביטול חינם עד 29 בספטמבר; אין מה לעשות אלא אם התכניות משתנות."),
    route: B("From Kyoto Station after Hikari 709 (13:37). Check-in from 16:00; door code.", "מתחנת קיוטו אחרי Hikari 709 (13:37). צ׳ק־אין מ-16:00; קוד בדלת."),
    luggage: B("The host confirmed the setup for five.", "המארח אישר סידור לחמישה."),
    map: MAP("The Besso Soso Kyoto")
  },
  {
    id: "crane", icon: "🏡", status: B("Final Tokyo base · keeper", "בסיס אחרון בטוקיו · נשאר"),
    name: "Crane Stay Shibuya (Aobadai)", dates: B("18–20 Oct · 2 nights", "18–20 באוקטובר · 2 לילות"),
    address: "Aobadai 4-2-4, Meguro-ku, Tokyo", station: B("Ikejiri-Ohashi or Naka-Meguro; confirm in the booking", "איקג׳ירי־אוהאשי או נאקה־מגורו; לאשר לפי ההזמנה"),
    confirmation: "••••", phone: "",
    cancellation: B("Free cancellation until 3 Oct; nothing to do unless plans change.", "ביטול חינם עד 3 באוקטובר; אין מה לעשות אלא אם התכניות משתנות."),
    route: B("From Shinagawa after the Nozomi: taxi, about 20 minutes. Check-in from 15:00; door code.", "משינאגאווה אחרי הנוזומי: מונית, כ-20 דקות. צ׳ק־אין מ-15:00; קוד בדלת."),
    luggage: B("Two-bedroom house. Ask the host about keeping bags on 20 Oct until you leave for the airport.", "בית עם שני חדרי שינה. לשאול את המארח על השארת תיקים ב-20 באוקטובר עד היציאה לשדה."),
    map: MAP("Aobadai 4-2-4 Meguro Tokyo")
  }
];

// Booked but being cancelled; shown as a warning until it's marked done.
const cancelStay = {
  id: "kumihimo", name: "組紐の間 · Kumihimo no Ma", confirmation: "••••",
  deadline: "2026-10-03",
  text: B("Crane Stay replaces it for 18–20 Oct. The old record says free cancellation ends 3 Oct at 23:59; check the exact deadline in Booking.com.", "Crane Stay מחליף אותו ל-18–20 באוקטובר. לפי הרישום הישן הביטול החינמי מסתיים ב-3 באוקטובר ב-23:59; לבדוק את המועד המדויק ב-Booking.com.")
};

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
    times: "19:35 → 02:20+1", pnr: "••••", pnr2: "••••", seat: B("Check booking", "לבדוק בהזמנה"), terminal: B("Narita T1", "נריטה T1")
  }
];

const bookingChannels = [
  {
    icon:"💳", title:B("Local trains, metro & buses", "רכבות מקומיות, מטרו ואוטובוסים"),
    tool:B("Suica / Welcome Suica", "Suica / Welcome Suica"),
    use:B("Tap each person’s own card for ordinary JR, metro, the Enoden and most city buses. It also pays the Azusa 81 fare on 11 Oct, since you only booked seat tickets. It never reserves a seat.", "להעביר כרטיס נפרד של כל נוסע ברכבות JR רגילות, מטרו, אנודן וברוב האוטובוסים העירוניים. הוא גם משלם את הנסיעה באזוסה 81 ב-11 באוקטובר, כי הזמנתם רק כרטיסי מושב. הוא אף פעם לא שומר מושב."),
    notFor:B("Not for Shinkansen seat booking", "לא להזמנת מושב בשינקנסן"),
    links:[[B("Welcome Suica", "Welcome Suica"),"https://www.jreast.co.jp/en/multi/welcomesuica/welcomesuica.html"]]
  },
  {
    icon:"東", title:B("JR East reserved trains", "רכבות שמורות של JR East"),
    tool:B("JR-EAST Train Reservation", "JR-EAST Train Reservation"),
    use:B("Where the Azusa 81 seats are booked (Eki-net), and where to buy N’EX tickets. Use Purchase tickets, not the pass-only seat-reservation path.", "המקום שבו הוזמנו המושבים באזוסה 81 (Eki-net), ושבו קונים כרטיסי N’EX. להשתמש ב-Purchase tickets, לא במסלול שמירת מושב לבעלי פאס."),
    notFor:B("Not for the Tokaido Shinkansen: that’s SmartEX", "לא לשינקנסן טוקאידו: זה SmartEX"),
    links:[[B("Open JR East", "פתיחת JR East"),"https://www.eki-net.com/en/jreast-train-reservation/Top/Index"],[B("Pickup guide", "מדריך איסוף"),"https://www.jreast.co.jp/en/multi/ticket/guide.html"]]
  },
  {
    icon:"🚅", title:B("Tokaido Shinkansen", "שינקנסן טוקאידו"),
    tool:B("SmartEX", "SmartEX"),
    use:B("Hikari 709 Mishima → Kyoto (14 Oct) is booked here; book Kyoto → Shinagawa (18 Oct) here too. Reserve all five together and choose oversized-baggage seats for any bag over 160 cm in total.", "ה-Hikari 709 ממישימה לקיוטו (14 באוקטובר) הוזמנה כאן; גם קיוטו ← שינאגאווה (18 באוקטובר) מזמינים כאן. להזמין את כל החמישה יחד ולבחור מושבי מזוודה גדולה לכל תיק שמעל 160 ס״מ בסכום הממדים."),
    notFor:B("Not for the Azusa or N’EX: those are JR East", "לא לאזוסה או ל-N’EX: אלה JR East"),
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
    id: "nex-solo", icon: "🚆", date: B("29 Sep", "29 בספטמבר"), route: B("Narita T1 → Tokyu Stay Aoyama", "נריטה T1 ← Tokyu Stay Aoyama"), window: "17:45–18:30",
    duration: B("75–105 min door-to-door", "75–105 דקות מדלת לדלת"), transfers: B("N’EX to Shibuya + short taxi", "N’EX לשיבויה + מונית קצרה"), fare: B("¥3,330 to Shibuya + taxi", "3,330¥ לשיבויה + מונית"),
    reservation: B("Reserved seat; buy after landing", "מושב שמור; לקנות אחרי הנחיתה"), sale: B("Same day is fine", "אפשר באותו יום"), seat: B("Aisle, for an easier luggage exit", "מעבר, ליציאה נוחה עם מזוודה"),
    luggage: B("Use the end-of-car racks; keep valuables at your seat", "מתקני קצה הקרון; חפצי ערך ליד המושב"), backup: B("Keisei Skyliner to Nippori, then taxi, only if N’EX is disrupted", "Skyliner לניפורי ואז מונית, רק אם יש שיבוש ב-N’EX"),
    station: B("The NRT T1 rail station is on B1", "תחנת הרכבת של NRT T1 בקומה B1"), buy: "https://www.jreast.co.jp/en/multi/nex/tickets/", map: MAP("Narita Airport Terminal 1 Station")
  },
  {
    id: "narita-taxi", icon: "🚐", date: B("6 Oct", "6 באוקטובר"), route: B("Narita T1 → Nakano · private taxi", "נריטה T1 ← נקאנו · מונית פרטית"), window: B("Family lands 16:20; Gilad leaves Nakano ~13:30", "המשפחה נוחתת ב-16:20; גלעד יוצא מנקאנו ~13:30"),
    duration: B("About 90 minutes in traffic", "כ-90 דקות בתנועה"), transfers: B("Gilad: N’EX out · everyone: taxi home", "גלעד: N’EX לשדה · כולם: מונית הביתה"), fare: B("Prepaid in the booking", "שולם בהזמנה"),
    reservation: B("Booked; add the LY075 flight details", "הוזמן; להוסיף את פרטי טיסת LY075"), sale: B("Already booked", "כבר הוזמן"), seat: B("Confirm the vehicle fits five and all bags", "לוודא שהרכב מתאים לחמישה ולכל התיקים"),
    luggage: B("Five travellers plus flight bags", "חמישה נוסעים ומזוודות טיסה"), backup: B("N’EX to Shinjuku, then two taxis", "N’EX לשינג׳וקו ואז שתי מוניות"),
    station: B("Public 1F arrivals lobby; the exact driver point is in the voucher", "אולם הנחיתות הציבורי בקומה 1; נקודת הנהג המדויקת בשובר"), buy: "https://secure.booking.com/myreservations.html", map: MAP("Narita Airport Terminal 1 International Arrivals")
  },
  {
    id: "azusa", icon: "🚄", date: B("11 Oct", "11 באוקטובר"), route: B("Shinjuku → Otsuki · Azusa 81", "שינג׳וקו ← אוצוקי · אזוסה 81"), window: "09:02–10:13",
    duration: "1h 11m", transfers: B("Direct", "ישיר"), fare: B("Seat ticket booked; the fare is paid by IC card", "כרטיס מושב הוזמן; הנסיעה משולמת בכרטיס IC"),
    reservation: B("Booked · Car 8, seats 9A, 9B, 10A, 10B, 11A", "הוזמן · קרון 8, מושבים ⁦9A, 9B, 10A, 10B, 11A⁩"), sale: B("Already booked", "כבר הוזמן"), seat: B("Five seats together", "חמישה מושבים יחד"),
    luggage: B("Small bags only; the big suitcases stay in Tokyo", "תיקים קטנים בלבד; המזוודות הגדולות נשארות בטוקיו"), backup: B("A later Azusa or Kaiji to Otsuki; tell Toyota if you’ll be late", "אזוסה או קאיג׳י מאוחרת יותר לאוצוקי; לעדכן את טויוטה אם מאחרים"),
    station: B("Allow about 45 minutes from Nakano to the platform with bags", "להקצות כ-45 דקות מנקאנו לרציף עם התיקים"), buy: "https://www.eki-net.com/en/jreast-train-reservation/Top/Index", map: MAP("Shinjuku Station JR")
  },
  {
    id: "toyota", icon: "🚗", date: B("11–14 Oct", "11–14 באוקטובר"), route: B("Otsuki → Kawaguchiko → Hakone → Mishima · Toyota", "אוצוקי ← קוואגוצ׳יקו ← הקונה ← מישימה · טויוטה"), window: B("Pick up 11 Oct 11:00 · return 14 Oct 11:00", "איסוף 11 באוקטובר 11:00 · החזרה 14 באוקטובר 11:00"),
    duration: B("Three driving days", "שלושה ימי נהיגה"), transfers: B("One-way: Otsuki shop → Mishima Shinkansen Ext. shop", "חד־כיווני: סניף אוצוקי ← סניף Mishima Shinkansen Ext."), fare: B("¥67,870, full package", "67,870¥, חבילה מלאה"),
    reservation: B("Booked · Corolla Cross", "הוזמן · קורולה קרוס"), sale: B("Already booked", "כבר הוזמן"), seat: B("Five seats; check the boot fits your small bags", "חמישה מושבים; לבדוק שתא המטען מכיל את התיקים הקטנים"),
    luggage: B("Travel light; photograph the car and fuel gauge at pickup and return", "לנסוע קל; לצלם את הרכב ואת מד הדלק באיסוף ובהחזרה"), backup: B("If the documents fail at the counter, trains and buses via Otsuki and Gotemba", "אם המסמכים לא מתקבלים בדלפק, רכבות ואוטובוסים דרך אוצוקי וגוטמבה"),
    station: B("Drive on the left; bring the passport, original Israeli licence and IDP", "נהיגה בצד שמאל; להביא דרכון, רישיון ישראלי מקורי ורישיון בינלאומי"), buy: "https://rent.toyota.co.jp/eng/", map: MAP("Toyota Rent a Car Otsuki Station")
  },
  {
    id: "hikari", icon: "🚅", date: B("14 Oct", "14 באוקטובר"), route: B("Mishima → Kyoto · Hikari 709", "מישימה ← קיוטו · Hikari 709"), window: "11:46–13:37",
    duration: "1h 51m", transfers: B("Direct", "ישיר"), fare: B("¥49,990 for five", "49,990¥ לחמישה"),
    reservation: B("Booked · Car 6, seats 1A, 1B, 1C, 2A, 2B", "הוזמן · קרון 6, מושבים ⁦1A, 1B, 1C, 2A, 2B⁩"), sale: B("Already booked", "כבר הוזמן"), seat: B("Five seats together", "חמישה מושבים יחד"),
    luggage: B("Bags over 160 cm in total dimensions need a baggage-area seat", "תיקים מעל 160 ס״מ בסכום הממדים צריכים מושב עם אזור מזוודות"), backup: B("The next Hikari or Kodama; staff can rebook at the ticket office", "ה-Hikari או ה-Kodama הבאה; הצוות יכול להחליף במשרד הכרטיסים"),
    station: B("QR ticket in SmartEX, or pick up at a machine", "כרטיס QR ב-SmartEX, או איסוף במכונה"), buy: "https://smart-ex.jp/en/", map: MAP("Mishima Station Shinkansen")
  },
  {
    id: "kyoto-tokyo", icon: "🚅", date: B("18 Oct", "18 באוקטובר"), route: B("Kyoto → Shinagawa · Nozomi (not booked)", "קיוטו ← שינאגאווה · נוזומי (לא הוזמן)"), window: B("Pick a train that leaves time for Kawagoe", "לבחור רכבת שמשאירה זמן לקוואגואה"),
    duration: B("About 2h10, then a 20-minute taxi to Aobadai", "כשעתיים ועשר דקות, ואז 20 דקות במונית לאובאדאי"), transfers: B("Direct; taxi to Crane Stay", "ישיר; מונית ל-Crane Stay"), fare: B("About ¥63,800 for 4 adults and 1 child", "כ-63,800¥ ל-4 מבוגרים וילד"),
    reservation: B("Not booked yet; reserve all five together", "עדיין לא הוזמן; להזמין את כל החמישה יחד"), sale: B("On sale now in SmartEX", "במכירה עכשיו ב-SmartEX"), seat: B("E side for the Fuji view", "צד E לנוף פוג׳י"),
    luggage: B("Oversized-baggage seats for bags over 160 cm in total", "מושבים למזוודה גדולה לתיקים מעל 160 ס״מ בסכום הממדים"), backup: B("A later Nozomi; shorten Kawagoe rather than rush the bags", "נוזומי מאוחרת יותר; לקצר את קוואגואה במקום למהר עם התיקים"),
    station: B("Use the live departure board for the platform", "להשתמש בלוח היציאות החי לרציף"), buy: "https://smart-ex.jp/en/", map: MAP("Kyoto Station Shinkansen")
  },
  {
    id: "narita-home", icon: "✈️", date: B("20 Oct", "20 באוקטובר"), route: B("Crane Stay → Narita T1 (not booked)", "Crane Stay ← נריטה T1 (לא הוזמן)"), window: B("Be at the airport by about 16:30 for LY076 at 19:35", "להיות בשדה עד 16:30 בערך ל-LY076 ב-19:35"),
    duration: B("About 80–100 minutes", "כ-80–100 דקות"), transfers: B("N’EX from Shibuya, limousine bus, or a jumbo taxi from the door", "N’EX משיבויה, אוטובוס לימוזין, או מונית ג׳מבו מהדלת"), fare: B("≈ ¥16,000 N’EX · ¥17,000 bus · ¥35,000 taxi, for five", "≈ 16,000¥ ‏N’EX · ‏17,000¥ אוטובוס · ‏35,000¥ מונית, לחמישה"),
    reservation: B("Not booked; pick one on the 20 Oct day card", "לא הוזמן; לבחור אחת בכרטיס היום של 20 באוקטובר"), sale: B("Book a few days ahead", "להזמין כמה ימים מראש"), seat: B("Five together", "חמישה יחד"),
    luggage: B("The taxi is easiest with all the bags", "המונית הכי נוחה עם כל התיקים"), backup: B("If a train is disrupted, ask JR or airport staff for the next option at once", "אם יש שיבוש ברכבת, לבקש מיד מצוות JR או השדה את האפשרות הבאה"),
    station: B("NRT Terminal 1 for EL AL", "טרמינל 1 בנריטה לאל על"), buy: "https://www.jreast.co.jp/multi/en/nex/", map: MAP("Narita Airport Terminal 1")
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
  { id:"planets", icon:"✨", tags:["family","design"], name:B("teamLab Planets","teamLab Planets"), area:B("Toyosu · Tokyo","טויוסו · טוקיו"), duration:"2–3h", price:B("Dynamic timed-ticket pricing; check official date","מחיר דינמי לכרטיס לפי שעה; לבדוק תאריך"), closed:B("Timed entry; maintenance varies","כניסה בשעה קבועה; תחזוקה משתנה"), audience:B("Family · immersive digital art","משפחה · אמנות דיגיטלית סוחפת"), fit:5, note:B("Booked for 8 Oct at 14:30 (¥20,500 paid). You wade through water, so wear trousers that roll up.","הוזמן ל-8 באוקטובר ב-14:30 (שולם 20,500¥). הולכים בתוך מים, אז ללבוש מכנסיים שאפשר לקפל."), official:"https://www.teamlab.art/e/planets/", map:MAP("teamLab Planets Tokyo") },
  { id:"railway", icon:"🚂", tags:["family","train"], name:B("The Railway Museum","מוזיאון הרכבת"), area:B("Ōmiya · Saitama","אומיה · סאיטאמה"), duration:"3–4h", price:B("See official e-ticket page","לראות בעמוד הכרטיסים הרשמי"), closed:B("Tuesday; verify calendar","יום שלישי; לבדוק לוח"), audience:B("Erel + family · full-scale rail history","אראל + משפחה · היסטוריית רכבות בקנה מידה מלא"), fit:4, note:B("Strongest rail museum, but it needs a half-day and competes with Tokyo time.","מוזיאון הרכבת החזק ביותר, אך דורש חצי יום ומתחרה בזמן טוקיו."), official:"https://www.railway-museum.jp/e/", map:MAP("The Railway Museum Saitama") },
  { id:"biovortex", icon:"✦", tags:["family","design"], name:B("teamLab Biovortex Kyoto","teamLab Biovortex Kyoto"), area:B("Kyoto Station east/south","מזרח/דרום תחנת קיוטו"), duration:"2–3h", price:B("Current list: adult ¥3,800 · 13–17 ¥2,800 · 4–12 ¥1,800; may vary by date","רשימה נוכחית: מבוגר 3,800¥ · גיל 13–17 2,800¥ · גיל 4–12 1,800¥; עשוי להשתנות לפי תאריך"), closed:B("Open 09:00–21:00; last entry 19:30; check maintenance","פתוח 09:00–21:00; כניסה אחרונה 19:30; לבדוק תחזוקה"), audience:B("Whole family · immersive and physical","כל המשפחה · סוחף ופיזי"), fit:3, note:B("Seven minutes from Kyoto Station, but you already have teamLab Planets booked in Tokyo, so it’s only worth it if the family wants a second round.","שבע דקות מתחנת קיוטו, אבל teamLab Planets כבר הוזמן בטוקיו, אז שווה רק אם המשפחה רוצה סיבוב שני."), official:"https://www.teamlab.art/e/kyoto/", map:MAP("teamLab Biovortex Kyoto") },
  { id:"kyotorail", icon:"🚄", tags:["family","train"], name:B("Kyoto Railway Museum","מוזיאון הרכבת קיוטו"), area:B("Umekoji · Kyoto","אומקוג׳י · קיוטו"), duration:"2.5–4h", price:B("See current official admission","לראות מחיר כניסה רשמי עדכני"), closed:B("Wednesday; verify special openings","יום רביעי; לבדוק פתיחות מיוחדות"), audience:B("Erel + family · locomotives + operations","אראל + משפחה · קטרים + תפעול"), fit:4, note:B("An excellent rain substitute for Fushimi or a cancelled boat, not an extra full day.","חלופת גשם מצוינת לפושימי או לסירה מבוטלת, לא יום נוסף."), official:"https://www.kyotorailwaymuseum.jp/en/", map:MAP("Kyoto Railway Museum") },
  { id:"manga", icon:"漫", tags:["family","design"], name:B("Kyoto International Manga Museum","המוזיאון הבינלאומי למנגה בקיוטו"), area:B("Karasuma-Oike · Kyoto","קראסומה־אואיקה · קיוטו"), duration:"1.5–2.5h", price:B("See current official admission","לראות מחיר כניסה רשמי עדכני"), closed:B("Wednesday; check event calendar","יום רביעי; לבדוק לוח אירועים"), audience:B("Teens + family · visual culture","בני נוער + משפחה · תרבות חזותית"), fit:3, note:B("A weatherproof, teen-friendly substitute; the reading wall is less useful without Japanese, exhibitions matter.","חלופה סגורה שמתאימה לבני נוער; קיר הקריאה שימושי פחות בלי יפנית ולכן התערוכות חשובות."), official:"https://kyotomm.jp/en/", map:MAP("Kyoto International Manga Museum") },
  { id:"mot", icon:"▦", tags:["solo","family","design"], name:B("Museum of Contemporary Art Tokyo","המוזיאון לאמנות עכשווית טוקיו"), area:B("Kiyosumi-Shirakawa · Tokyo","קיוסומי־שיראקאווה · טוקיו"), duration:"2–3h", price:B("Varies by exhibition","משתנה לפי תערוכה"), closed:B("Monday; check installation closures","יום שני; לבדוק סגירות הקמה"), audience:B("Gilad or family · art + architecture","גלעד או משפחה · אמנות + אדריכלות"), fit:3, note:B("A credible substitute near Kiyosumi only when the exhibition is compelling and energy remains.","חלופה אמינה ליד קיוסומי רק כשהתערוכה חזקה ונשאר כוח."), official:"https://www.mot-art-museum.jp/eng/", map:MAP("Museum of Contemporary Art Tokyo") }
];

const mapCards = [
  { icon:"🏠", title:B("All stays","כל הלינות"), text:B("Your solo hotel and the five family stays, in order.","מלון הסולו שלך וחמש הלינות המשפחתיות, לפי הסדר."), query:"Tokyu Stay Aoyama Premier|Nakano-shimbashi Station|Classic Japan Living Miuraya Fujikawaguchiko|Rakuten STAY VILLA Hakone Sengokuhara|The Besso Soso Kyoto|Aobadai 4-2-4 Meguro Tokyo" },
  { icon:"👣", title:B("Moto-Yoyogi memories","זיכרונות מוטו־יויוגי"), text:B("Childhood lanes, Yoyogi-Hachiman, Yoyogi Park and Meiji Jingu.","סמטאות הילדות, יויוגי־האצ׳ימן, פארק יויוגי ומייג׳י ג׳ינגו."), query:"Motoyoyogicho Tokyo" },
  { icon:"🛍", title:B("Harajuku to Shibuya","מהרג׳וקו לשיבויה"), text:B("Takeshita, Cat Street, Omotesando, Parco and Shibuya Sky on 7 Oct.","טקשיטה, קאט סטריט, אומוטסנדו, פארקו ושיבויה סקיי ב-7 באוקטובר."), query:"Takeshita Street to Shibuya Sky" },
  { icon:"🏎", title:B("JDM route","מסלול JDM"), text:B("Liberty Walk Harajuku, A PIT Shinonome, Nissan Crossing and Daikoku PA.","ליברטי ווק הרג׳וקו, A PIT שינונומה, ניסאן קרוסינג ודאיקוקו."), query:"A PIT Autobacs Shinonome to Nissan Crossing Ginza" },
  { icon:"🌊", title:B("Tokyo Bay","מפרץ טוקיו"), text:B("teamLab Planets, Toyosu, Tsukiji and Odaiba on 8 Oct.","teamLab Planets, טויוסו, צוקיג׳י ואודאיבה ב-8 באוקטובר."), query:"teamLab Planets TOKYO to Odaiba Seaside Park" },
  { icon:"🏰", title:B("Tokyo Disney Resort","טוקיו דיסני ריזורט"), text:B("DisneySea and Disneyland share Maihama station.","דיסני־סי ודיסנילנד חולקים את תחנת מאיהאמה."), query:"Maihama Station" },
  { icon:"🗿", title:B("Kamakura + Enoshima","קמקורה + אנושימה"), text:B("Hokokuji bamboo, the Great Buddha and the island.","במבוק הוקוקו־ג׳י, הבודהה הגדול והאי."), query:"Hokokuji Temple Kamakura to Enoshima Island" },
  { icon:"🗻", title:B("Fuji Five Lakes","חמשת האגמים של פוג׳י"), text:B("Kawaguchiko, Aokigahara caves, Chureito and Oishi Park.","קוואגוצ׳יקו, מערות אאוקיגהארה, צ׳ורייטו ופארק אואישי."), query:"Lake Kawaguchi Fujikawaguchiko" },
  { icon:"🌋", title:B("Hakone loop","לולאת הקונה"), text:B("Owakudani ropeway, Lake Ashi, Hakone Shrine and the Sengokuhara grass.","הרכבל לאוואקודאני, אגם אשי, מקדש הקונה ועשב סנגוקוהארה."), query:"Owakudani to Hakone Shrine" },
  { icon:"🎋", title:B("Arashiyama","אראשיאמה"), text:B("Bamboo grove, Tenryu-ji, the monkeys and the Sagano train.","חורשת הבמבוק, טנריו־ג׳י, הקופים ורכבת סאגאנו."), query:"Arashiyama Bamboo Grove to Tenryu-ji" },
  { icon:"🌲", title:B("Kurama → Kibune","קוראמה ← קיבונה"), text:B("Trailhead, ridge, shrine, bus and the Eizan line back.","תחילת השביל, הרכס, המקדש, האוטובוס וקו אייזאן בחזרה."), query:"Kurama Station to Kifune Shrine walking" },
  { icon:"🏯", title:B("Higashiyama","היגאשיאמה"), text:B("Kiyomizu-dera, Sannenzaka, Yasaka and Gion.","קיומיזו־דרה, סאננזאקה, יאסאקה וגיון."), query:"Kiyomizu-dera to Yasaka Shrine" },
  { icon:"🏮", title:B("Kawagoe Festival","פסטיבל קוואגואה"), text:B("The warehouse district, float zones and the way back to the station.","רובע המחסנים, אזורי העגלות והדרך חזרה לתחנה."), query:"Kawagoe Station to Ichibangai Shopping Street" },
  { icon:"✈️", title:B("Final airport run","הנסיעה האחרונה לשדה"), text:B("Crane Stay → Shibuya → Narita T1.","Crane Stay ← שיבויה ← נריטה T1."), query:"Aobadai 4-2-4 Meguro to Narita Airport Terminal 1" }
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
  { id:"kumihimo", icon:"🪢", title:B("Cancel Kumihimo no Ma","לבטל את Kumihimo no Ma"), text:B("Crane Stay replaces it for 18–20 Oct. Free cancellation ends 3 Oct at 23:59; check the exact deadline in Booking.com.","Crane Stay מחליף אותו ל-18–20 באוקטובר. הביטול החינמי מסתיים ב-3 באוקטובר ב-23:59; לבדוק את המועד המדויק ב-Booking.com."), default:"action" },
  { id:"disney", icon:"🏰", title:B("Disney: go, and which day?","דיסני: הולכים, ובאיזה יום?"), text:B("Friday 9 Oct is the one Disney day, the calmest before the long weekend: vote Disneyland, DisneySea, or skip Disney for Kamakura or Mount Takao. DisneySea for the teens, Disneyland if Erel’s rides lead. Tickets are dated.","שישי 9 באוקטובר הוא יום הדיסני היחיד, הכי רגוע לפני סוף השבוע הארוך: מצביעים דיסנילנד, דיסני־סי, או מוותרים על דיסני לטובת קמקורה או הר טאקאו. דיסני־סי לבני הנוער, דיסנילנד אם המתקנים של אראל מובילים. הכרטיסים מתוארכים."), default:"decide" },
  { id:"luggage", icon:"🧳", title:B("The big suitcases while you tour","המזוודות הגדולות בזמן הטיול"), text:B("The car and Kyoto legs work best with small bags. Either the Nakano host holds the big cases until 18 Oct, or Yamato ships them to Crane Stay.","מקטעי הרכב וקיוטו עובדים הכי טוב עם תיקים קטנים. או שהמארח בנקאנו שומר את המזוודות הגדולות עד 18 באוקטובר, או ש-Yamato שולחת אותן ל-Crane Stay."), default:"decide" },
  { id:"daikoku", icon:"🏎", title:B("Daikoku night tour: Friday or Saturday","סיור דאיקוקו: שישי או שבת"), text:B("Friday meets are strongest, with less police risk; Saturday is the backup. Book a licensed tour either way.","המפגשים בשישי הכי חזקים, עם פחות סיכון למשטרה; שבת היא הגיבוי. בכל מקרה להזמין סיור מורשה."), default:"decide" },
  { id:"kyoto-tokyo", icon:"🚅", title:B("Kyoto → Tokyo on 18 Oct","קיוטו ← טוקיו ב-18 באוקטובר"), text:B("Not booked yet. Pick a Nozomi that leaves time for Kawagoe if you want the floats.","עדיין לא הוזמן. לבחור נוזומי שמשאירה זמן לקוואגואה אם רוצים את העגלות."), default:"booking" },
  { id:"narita-home", icon:"✈️", title:B("Getting to Narita on 20 Oct","הדרך לנריטה ב-20 באוקטובר"), text:B("Not booked. N’EX from Shibuya, the limousine bus, or a jumbo taxi from the door; be at the airport by about 16:30.","לא הוזמן. N’EX משיבויה, אוטובוס הלימוזין, או מונית ג׳מבו מהדלת; להיות בשדה עד 16:30 בערך."), default:"booking" },
  { id:"birthday", icon:"🎂", title:B("Birthday dinner on 19 Oct","ארוחת יום ההולדת ב-19 באוקטובר"), text:B("Book as soon as you choose. It’s a Monday, so confirm the restaurant is open, and put the no-shellfish, squid and octopus note in the booking.","להזמין ברגע שבוחרים. זה יום שני, אז לוודא שהמסעדה פתוחה, ולכתוב בהזמנה בלי פירות ים, קלמארי ותמנון."), default:"action" },
  { id:"sagano", icon:"🚞", title:B("Sagano train + Hozugawa boat (15 Oct)","רכבת סאגאנו + סירת הוזוגאווה (15 באוקטובר)"), text:B("Optional now. Sales opened on 15 Sep, so check what’s left before planning around it.","אופציונלי עכשיו. המכירה נפתחה ב-15 בספטמבר, אז לבדוק מה נשאר לפני שמתכננים סביבו."), default:"decide" },
  { id:"ceatec", icon:"📡", title:B("CEATEC solo day (16 Oct)","יום CEATEC לבד (16 באוקטובר)"), text:B("About 3 hours each way from Kyoto. Only if the show matters more than a Kyoto day; registration is free.","כשלוש שעות לכל כיוון מקיוטו. רק אם התערוכה חשובה יותר מיום בקיוטו; ההרשמה חינם."), default:"decide" },
  { id:"asij", icon:"🎓", title:B("ASIJ contact","קשר ASIJ"), text:B("No public event was verified. Only put an event back in the plan from a personal invitation or alumni-office confirmation.","לא אומת אירוע ציבורי. להחזיר אירוע לתכנית רק לפי הזמנה אישית או אישור ממשרד הבוגרים."), default:"unverified" },
  { id:"booking-policies", icon:"⏱", title:B("Live cancellation policies","מדיניות ביטול חיה"), text:B("Recheck each Booking.com stay: Nakano, Miuraya, the Hakone villa, Besso (free until 29 Sep) and Crane Stay (free until 3 Oct).","לבדוק כל לינה ב-Booking.com: נקאנו, מיאוראיה, הווילה בהקונה, Besso (חינם עד 29 בספטמבר) ו-Crane Stay (חינם עד 3 באוקטובר)."), default:"action" }
];

const actionChecklist = [
  {id:"flights",phase:"before",icon:"✈️",kind:B("FLIGHTS","טיסות"),title:B("Recheck flights, seats, and meals","לבדוק מחדש טיסות, מושבים וארוחות"),due:B("7 days before each departure","7 ימים לפני כל יציאה"),people:B("Gilad outbound; family outbound; all five home","גלעד הלוך; המשפחה הלוך; כולם חזור"),summary:B("Verify LY flight status, Terminal 1, seats together, and meal requests directly with EL AL.","לאמת סטטוס טיסת LY, טרמינל 1, מושבים יחד ובקשות ארוחה ישירות מול אל על."),steps:[B("Open the EL AL booking with the relevant PNR and confirm names exactly match passports.","לפתוח את הזמנת אל על עם ה-PNR המתאים ולאשר שהשמות תואמים בדיוק לדרכונים."),B("Recheck seat assignments and meal requests for every traveler; photograph or save the final itinerary offline.","לבדוק שוב הקצאות מושבים ובקשות ארוחה לכל נוסע; לצלם או לשמור אופליין את המסלול הסופי."),B("Repeat the status and terminal check 24 hours before departure and complete online check-in when available.","לחזור על בדיקת סטטוס וטרמינל 24 שעות לפני היציאה ולהשלים צ׳ק־אין אונליין כשזמין."),B("If online check-in or meal changes fail, contact EL AL using the number in the actual booking and arrive at the airport earlier; bring a suitable permitted snack.","אם צ׳ק־אין או שינוי ארוחה נכשלו, לפנות לאל על במספר שבהזמנה בפועל ולהגיע מוקדם יותר; להביא חטיף מתאים ומותר.")],links:[[B("EL AL check-in","צ׳ק־אין אל על"),"https://www.elal.com/Checkin/Home/new_Identification/b?language=Eng"]]},
  {id:"vjw-gilad",phase:"before",icon:"🛂",kind:B("ENTRY","כניסה"),title:B("Complete Visit Japan Web for Gilad","להשלים Visit Japan Web לגלעד"),due:B("Before 29 Sep arrival","לפני הנחיתה ב-29 בספטמבר"),people:B("Gilad","גלעד"),summary:B("Create the solo arrival record, complete immigration/customs details, and save the current QR screen offline.","ליצור רישום לנחיתת הסולו, להשלים פרטי הגירה/מכס ולשמור אופליין את מסך ה-QR העדכני."),steps:[B("Enter passport details, the 29 September flight, and the first-night Tokyo address on the official service.","להזין פרטי דרכון, טיסת 29 בספטמבר וכתובת הלילה הראשון בטוקיו בשירות הרשמי."),B("Complete the available arrival procedures and confirm the record shows as registered.","להשלים את הליכי ההגעה הזמינים ולאשר שהרישום מוצג כמושלם."),B("Save an offline screenshot after the final pre-flight check; the live service remains authoritative if the QR format changes.","לשמור צילום מסך אופליין אחרי הבדיקה הסופית לפני הטיסה; השירות החי נשאר הסמכות אם פורמט ה-QR משתנה."),B("If the service fails, ask arrival staff for the applicable paper arrival/customs procedure and carry the lodging details.","אם השירות נכשל, לבקש מצוות ההגעה את הליך הכניסה/מכס בנייר ולהחזיק פרטי לינה.")],links:[[B("Official Visit Japan Web guide","מדריך Visit Japan Web רשמי"),"https://www.digital.go.jp/en/policies/visit_japan_web"],[B("Open Visit Japan Web","פתיחת Visit Japan Web"),"https://www.vjw.digital.go.jp/main/#/vjwplo001"]]},
  {id:"vjw-family",phase:"before",icon:"🛂",kind:B("ENTRY","כניסה"),title:B("Complete Visit Japan Web for the arriving family","להשלים Visit Japan Web למשפחה הנוחתת"),due:B("Before 6 Oct arrival","לפני הנחיתה ב-6 באוקטובר"),people:B("Ayelet, Yaara, Geffen, Erel","אילת, יערה, גפן, אראל"),summary:B("Create the 6 October arrival and make sure every traveler is covered by the records shown in the official service.","ליצור רישום לנחיתה ב-6 באוקטובר ולוודא שכל נוסע מכוסה ברישומים שמציג השירות הרשמי."),steps:[B("Use the official family/accompanying-person workflow where permitted; otherwise create the required individual records.","להשתמש בתהליך המשפחה/מלווים הרשמי כשמותר; אחרת ליצור את הרישומים האישיים הנדרשים."),B("Enter flight LY075, Narita Terminal 1, and the Nakano apartment address exactly as booked.","להזין טיסה LY075, נריטה טרמינל 1, ואת כתובת הדירה בנקאנו בדיוק כפי שהוזמנה."),B("Check the service again shortly before travel and keep accessible offline copies for each person.","לבדוק שוב את השירות סמוך לנסיעה ולשמור עותקים נגישים אופליין לכל אדם."),B("If mobile records fail, ask arrival staff for the applicable paper procedure; keep each passport and lodging details ready.","אם הרשומות בנייד נכשלות, לבקש מהצוות הליך נייר מתאים ולהכין כל דרכון ופרטי לינה.")],links:[[B("Official Visit Japan Web guide","מדריך Visit Japan Web רשמי"),"https://www.digital.go.jp/en/policies/visit_japan_web"],[B("Open Visit Japan Web","פתיחת Visit Japan Web"),"https://www.vjw.digital.go.jp/main/#/vjwplo001"]]},
  {id:"suica-gilad",phase:"before",icon:"💳",kind:B("IC CARD","כרטיס IC"),title:B("Set up Gilad’s Suica","להגדיר Suica לגלעד"),due:B("Before departure or at NRT on 29 Sep","לפני היציאה או בנריטה ב-29 בספטמבר"),people:B("Gilad","גלעד"),summary:B("Use Welcome Suica Mobile on a compatible iPhone/Apple Watch; otherwise buy one physical card at Narita T1.","להשתמש ב-Welcome Suica Mobile באייפון/Apple Watch תואם; אחרת לקנות כרטיס פיזי בנריטה T1."),steps:[B("If using a compatible Apple device, install Welcome Suica Mobile, register, add it to Wallet, turn on Express Card, and test a small top-up.","אם משתמשים במכשיר Apple תואם, להתקין Welcome Suica Mobile, להירשם, להוסיף ל-Wallet, להפעיל Express Card ולבדוק טעינה קטנה."),B("If issuance/top-up is restricted before arrival, retry after entering Japan with location services enabled.","אם הנפקה/טעינה מוגבלות לפני הנחיתה, לנסות שוב אחרי הכניסה ליפן עם שירותי מיקום פעילים."),B("Physical fallback: buy one Welcome Suica at the Narita Airport Terminal 1 station machine or JR East Travel Service Center.","חלופה פיזית: לקנות Welcome Suica אחד במכונה או במרכז השירות של JR East בתחנת נריטה טרמינל 1.")],links:[[B("Welcome Suica Mobile","Welcome Suica Mobile"),"https://www.jreast.co.jp/en/multi/welcomesuicamobile/"],[B("Physical purchase locations","נקודות רכישה פיזיות"),"https://www.jreast.co.jp/en/multi/welcomesuica/purchase.html"]]},
  {id:"suica-ayelet",phase:"before",icon:"💳",kind:B("IC CARD","כרטיס IC"),title:B("Set up Ayelet’s Suica","להגדיר Suica לאילת"),due:B("Before departure or at NRT on 6 Oct","לפני היציאה או בנריטה ב-6 באוקטובר"),people:B("Ayelet","אילת"),summary:B("Each traveler needs a separate IC card or device; one card cannot be tapped for several people.","כל נוסע צריך כרטיס IC או מכשיר נפרד; אי אפשר להעביר כרטיס אחד עבור כמה אנשים."),steps:[B("On a compatible iPhone/Apple Watch, install and issue Welcome Suica Mobile with Ayelet’s own eligible Apple Pay card.","באייפון/Apple Watch תואם, להתקין ולהנפיק Welcome Suica Mobile עם כרטיס Apple Pay זכאי על שם אילת."),B("Enable Express Card and add a modest starting balance; do not overfund because Welcome Suica balances are non-refundable.","להפעיל Express Card ולהוסיף יתרה התחלתית מתונה; לא לטעון יותר מדי כי יתרות Welcome Suica אינן מוחזרות."),B("If mobile is not workable, buy one physical Welcome Suica at Narita T1 or later at a listed JR East center.","אם המובייל אינו מעשי, לקנות Welcome Suica פיזי אחד בנריטה T1 או אחר כך במרכז JR East שמופיע ברשימה.")],links:[[B("Mobile setup","הגדרה במובייל"),"https://www.jreast.co.jp/en/multi/welcomesuicamobile/install.html"],[B("Physical purchase locations","נקודות רכישה פיזיות"),"https://www.jreast.co.jp/en/multi/welcomesuica/purchase.html"]]},
  {id:"suica-yaara",phase:"before",icon:"💳",kind:B("IC CARD","כרטיס IC"),title:B("Set up Yaara’s Suica","להגדיר Suica ליערה"),due:B("Before departure or at NRT on 6 Oct","לפני היציאה או בנריטה ב-6 באוקטובר"),people:B("Yaara · age 17","יערה · בת 17"),summary:B("Give Yaara her own mobile or physical IC card and make sure she can top it up herself.","לתת ליערה כרטיס IC נפרד במובייל או פיזי ולוודא שהיא יכולה לטעון אותו בעצמה."),steps:[B("Use Welcome Suica Mobile if her Apple device and own Apple Pay payment card are eligible.","להשתמש ב-Welcome Suica Mobile אם מכשיר Apple וכרטיס Apple Pay על שמה זכאים."),B("Turn on Express Card and test the setup before leaving; retry issuance in Japan if regional restrictions apply.","להפעיל Express Card ולבדוק לפני היציאה; לנסות הנפקה שוב ביפן אם חלות מגבלות אזוריות."),B("Otherwise buy one physical adult Welcome Suica and keep its reference paper.","אחרת לקנות Welcome Suica פיזי למבוגר ולשמור את דף האסמכתה.")],links:[[B("Welcome Suica Mobile","Welcome Suica Mobile"),"https://www.jreast.co.jp/en/multi/welcomesuicamobile/"],[B("Physical Welcome Suica","Welcome Suica פיזי"),"https://www.jreast.co.jp/en/multi/welcomesuica/purchase.html"]]},
  {id:"suica-geffen",phase:"before",icon:"💳",kind:B("IC CARD","כרטיס IC"),title:B("Set up Geffen’s Suica","להגדיר Suica לגפן"),due:B("Before departure or at NRT on 6 Oct","לפני היציאה או בנריטה ב-6 באוקטובר"),people:B("Geffen · age 20","גפן · בת 20"),summary:B("Mobile is possible only with a compatible Apple device and an eligible payment setup; physical is the simple fallback.","מובייל אפשרי רק עם מכשיר Apple תואם והגדרת תשלום זכאית; כרטיס פיזי הוא החלופה הפשוטה."),steps:[B("Check the official compatible-device and Apple Pay requirements before relying on mobile.","לבדוק דרישות מכשיר תואם ו-Apple Pay הרשמיות לפני שמסתמכים על מובייל."),B("If eligible, issue her own Welcome Suica Mobile, enable Express Card, and add a small balance.","אם זכאית, להנפיק לה Welcome Suica Mobile נפרד, להפעיל Express Card ולהוסיף יתרה קטנה."),B("Otherwise buy one physical adult Welcome Suica and keep its reference paper.","אחרת לקנות Welcome Suica פיזי למבוגר ולשמור את דף האסמכתה.")],links:[[B("Mobile requirements","דרישות מובייל"),"https://www.jreast.co.jp/en/multi/welcomesuicamobile/install.html"],[B("Physical Welcome Suica","Welcome Suica פיזי"),"https://www.jreast.co.jp/en/multi/welcomesuica/purchase.html"]]},
  {id:"insurance",phase:"before",icon:"🛡",kind:B("DOCUMENTS","מסמכים"),title:B("Finalize travel insurance","להשלים ביטוח נסיעות"),due:B("Before the first non-refundable purchase / departure","לפני רכישה לא ניתנת להחזר / היציאה"),people:B("Every traveler","כל נוסע"),summary:B("Confirm Japan coverage, medical limits, cancellation/interruption, hiking, and pre-existing-condition rules.","לאשר כיסוי ליפן, גבולות רפואיים, ביטול/קיצור נסיעה, הליכה ותנאים רפואיים קיימים."),steps:[B("Check that all five names and exact trip dates are on the policy; Gilad’s solo period must also be covered.","לבדוק שכל חמשת השמות ותאריכי הטיול המדויקים בפוליסה; גם תקופת הסולו של גלעד חייבת להיות מכוסה."),B("Review medical evacuation, trip cancellation, luggage, electronics, and trail/activity exclusions.","לבדוק פינוי רפואי, ביטול נסיעה, מזוודות, אלקטרוניקה והחרגות למסלולים/פעילויות."),B("Save the policy, emergency phone number, and claim instructions offline on at least two phones.","לשמור אופליין את הפוליסה, מספר החירום והוראות התביעה בשני טלפונים לפחות."),B("If coverage or an exclusion is unresolved, contact your own insurer before departure and avoid an excluded optional activity until covered. Use the insurer link/phone printed on your policy.","אם כיסוי או החרגה אינם ברורים, לפנות למבטח שלכם לפני היציאה ולהימנע מפעילות אופציונלית מוחרגת עד לכיסוי. להשתמש בקישור/טלפון בפוליסה.")],links:[]},
  {id:"passports",phase:"before",icon:"🛂",kind:B("DOCUMENTS","מסמכים"),title:B("Validate passports and make offline copies","לאמת דרכונים ולהכין עותקים אופליין"),due:B("This week","השבוע"),people:B("All five","כל החמישה"),summary:B("Check validity, exact ticket-name matches, and secure offline copies.","לבדוק תוקף, התאמה מדויקת לשמות בכרטיסים ועותקים מאובטחים אופליין."),steps:[B("Compare every passport name and number against the airline and Visit Japan Web records.","להשוות כל שם ומספר דרכון להזמנת הטיסה ולרישומי Visit Japan Web."),B("Store encrypted scans offline and leave a separate copy with a trusted person.","לשמור סריקות מוצפנות אופליין ולהשאיר עותק נפרד אצל אדם מהימן."),B("Keep passports in hand luggage, never checked luggage.","לשמור דרכונים בתיק יד, לעולם לא במזוודה לבטן המטוס."),B("If a document is invalid or inconsistent, contact the issuing authority and airline before departure; an app entry is not a replacement for a valid passport.","אם מסמך אינו תקף או עקבי, לפנות לרשות המנפיקה ולחברת התעופה לפני היציאה; הרשומה באפליקציה אינה תחליף לדרכון תקף.")],links:[[B("Japan visa eligibility","זכאות כניסה ליפן"),"https://www.mofa.go.jp/j_info/visit/visa/short/novisa.html"]]},
  {id:"cards-cash",phase:"before",icon:"¥",kind:B("MONEY","כסף"),title:B("Prepare cards and a cash plan","להכין כרטיסים ותכנית מזומן"),due:B("Before departure","לפני היציאה"),people:B("Gilad + one backup cardholder","גלעד + בעל כרטיס גיבוי אחד"),summary:B("Carry two cards on different networks, test PINs, and plan the first yen withdrawal.","לשאת שני כרטיסים ברשתות שונות, לבדוק קודי PIN ולתכנן משיכת ין ראשונה."),steps:[B("Confirm foreign transactions and ATM withdrawals are enabled and note fees.","לאשר שעסקאות בחו״ל ומשיכות כספומט מופעלות ולרשום עמלות."),B("Keep the backup card physically separate from the primary card.","לשמור את כרטיס הגיבוי בנפרד פיזית מהכרטיס הראשי."),B("Arrive with modest yen or withdraw at a supported airport/convenience-store ATM; retain cash for small temples, buses, and rural counters.","להגיע עם סכום ין מתון או למשוך בכספומט נתמך בשדה/חנות נוחות; לשמור מזומן למקדשים קטנים, אוטובוסים ודלפקים כפריים."),B("If a card fails, use the separately stored backup and modest cash; contact your bank through its official app or number printed on the card.","אם כרטיס נכשל, להשתמש בגיבוי שנשמר בנפרד ובמזומן מתון; לפנות לבנק באפליקציה הרשמית או במספר שעל הכרטיס.")],links:[]},
  {id:"connectivity",phase:"before",icon:"▥",kind:B("PHONE","טלפון"),title:B("Install and test connectivity","להתקין ולבדוק תקשורת"),due:B("Before each departure","לפני כל יציאה"),people:B("At least three independent phones","לפחות שלושה טלפונים עצמאיים"),summary:B("Use eSIM/roaming that activates in Japan and make sure the family can still coordinate if one phone fails.","להשתמש ב-eSIM/נדידה שמופעלים ביפן ולוודא שהמשפחה יכולה לתאם גם אם טלפון אחד נכשל."),steps:[B("Install the plan without activating it too early; save provider activation and APN instructions offline.","להתקין את החבילה בלי להפעיל מוקדם מדי; לשמור אופליין הוראות הפעלה ו-APN של הספק."),B("Enable data roaming only as instructed and test calls/messages after landing.","להפעיל נדידת נתונים רק לפי ההוראות ולבדוק שיחות/הודעות אחרי הנחיתה."),B("Write down Gilad’s Japanese-reachable number or messaging contact for the Narita reunion fallback.","לרשום מספר של גלעד שניתן להשיג ביפן או איש קשר בהודעות כחלופה למפגש בנריטה."),B("If activation fails, use airport Wi-Fi to contact your provider through the purchased plan, then buy a local SIM/pocket Wi-Fi if necessary. Keep a paper meeting plan.","אם ההפעלה נכשלת, להשתמש ב-Wi-Fi בשדה לפנייה לספק לפי התכנית שנרכשה ואז SIM מקומי/נתב אם נחוץ. לשמור תכנית מפגש בנייר.")],links:[]},
  {id:"shared-pack",phase:"before",icon:"↓",kind:B("OFFLINE","אופליין"),title:B("Build the shared offline travel pack","לבנות חבילת נסיעה משותפת אופליין"),due:B("48 hours before departure","48 שעות לפני היציאה"),people:B("Gilad + Ayelet; read access for everyone","גלעד + אילת; גישת קריאה לכולם"),summary:B("Keep critical confirmations usable without mobile data or a Booking.com login.","לשמור אישורים קריטיים שמישים בלי נתונים סלולריים או כניסה ל-Booking.com."),steps:[B("Save flights, stays, transfer voucher, rail/timed tickets, insurance, and Visit Japan Web screens into one offline folder.","לשמור טיסות, לינות, שובר הסעה, כרטיסי רכבת/שעה, ביטוח ומסכי Visit Japan Web בתיקייה אופליין אחת."),B("Include Japanese addresses, hotel phone numbers, food cards, and the family meeting fallback.","לכלול כתובות ביפנית, טלפוני לינה, כרטיסי אוכל וחלופת המפגש המשפחתית."),B("Test airplane mode on two phones and print the one-page emergency backup.","לבדוק מצב טיסה בשני טלפונים ולהדפיס גיבוי חירום של עמוד אחד."),B("If a phone is lost or offline files fail, use the second adult phone and printed contact/address sheet. App offline mode does not make third-party tickets or maps work offline.","אם טלפון אבד או הקבצים נכשלו, להשתמש בטלפון המבוגר השני ובדף כתובות/קשר מודפס. מצב אופליין של האפליקציה אינו מפעיל כרטיסים או מפות חיצוניים אופליין.")],links:[]},
  {id:"medication",phase:"before",icon:"＋",kind:B("HEALTH","בריאות"),title:B("Pack medication and medical documents","לארוז תרופות ומסמכים רפואיים"),due:B("Before departure","לפני היציאה"),people:B("Anyone carrying medication","כל מי שנושא תרופות"),summary:B("Carry enough medication in original packaging and check Japan’s import rules for controlled or high-volume items.","לשאת מספיק תרופות באריזה מקורית ולבדוק כללי יבוא ליפן עבור חומרים מבוקרים או כמות גדולה."),steps:[B("Pack prescriptions and a clinician letter using generic medication names where relevant.","לארוז מרשמים ומכתב רופא עם שמות גנריים של התרופות כשמתאים."),B("Keep essential medication in hand luggage with a delay buffer.","לשמור תרופות חיוניות בתיק היד עם רזרבה לעיכוב."),B("If any medication may be controlled in Japan, verify the official import procedure before travel.","אם תרופה כלשהי עשויה להיות מבוקרת ביפן, לאמת את הליך היבוא הרשמי לפני הנסיעה."),B("If legality/quantity is unclear, contact the ministry and prescribing clinician before travel; resolve required permits early and do not stop essential medication without medical advice.","אם החוקיות/כמות אינן ברורות, לפנות למשרד ולרופא המרשם לפני הנסיעה; להסדיר היתרים מראש ולא להפסיק תרופה חיונית ללא ייעוץ רפואי.")],links:[[B("Japan health ministry import guidance","הנחיות יבוא של משרד הבריאות ביפן"),"https://www.mhlw.go.jp/stf/seisakunitsuite/bunya/kenkou_iryou/iyakuhin/kojinyunyu/topics/tp010401-1_00001.html"],[B("Controlled medicines","תרופות מבוקרות"),"https://www.ncd.mhlw.go.jp/shinsei6.html"]]},
  {id:"packing",phase:"before",icon:"背",kind:B("PACKING","אריזה"),title:B("Finish the five-person packing check","להשלים בדיקת אריזה לחמישה"),due:B("2 days before departure","יומיים לפני היציאה"),people:B("All five","כל החמישה"),summary:B("Prioritize walking, rain, bathing, charging, and a light small-bag setup for the car days and Kyoto.","לתעדף הליכה, גשם, רחצה, טעינה, וסידור קל של תיק קטן לימי הרכב ולקיוטו."),steps:[B("Each person: broken-in walking shoes, rain shell or compact umbrella, layers, small towel, refillable bottle, and personal toiletries.","לכל אדם: נעלי הליכה שכבר נוסו, מעיל גשם או מטרייה קומפקטית, שכבות, מגבת קטנה, בקבוק למילוי וכלי רחצה אישיים."),B("Shared: power adapters, charging hub, two power banks, cables, laundry bag, and compact first-aid kit.","משותף: מתאמים, מרכז טעינה, שתי סוללות ניידות, כבלים, שק כביסה וערכת עזרה ראשונה קומפקטית."),B("Keep one small bag per person for Fuji, Hakone and Kyoto, separate from the large suitcases.","לשמור תיק קטן אחד לכל אחד לפוג׳י, הקונה וקיוטו, בנפרד מהמזוודות הגדולות."),B("Replace a missing essential before departure; nonessential items can be bought locally. Check the actual airline battery/liquid rules via the booking.","להשלים פריט חיוני לפני היציאה; פריטים לא חיוניים אפשר לקנות מקומית. לבדוק כללי סוללות/נוזלים של חברת התעופה דרך ההזמנה.")],links:[]},
  {id:"nex-arrival",phase:"japan",icon:"🚆",kind:B("TRAIN","רכבת"),title:B("Buy Gilad’s Narita Express arrival ticket","לקנות כרטיס Narita Express לנחיתה של גלעד"),due:B("After landing 29 Sep","אחרי הנחיתה ב-29 בספטמבר"),people:B("Gilad","גלעד"),summary:B("Buy a reserved N’EX seat after immigration so a flight delay does not strand a fixed train booking.","לקנות מושב שמור ב-N’EX אחרי ההגירה כדי שעיכוב טיסה לא יפיל הזמנת רכבת קשיחה."),steps:[B("After customs, go to Narita Airport Terminal 1 Station on B1.","אחרי המכס לרדת לתחנת Narita Airport Terminal 1 בקומה B1."),B("Buy the next comfortable reserved N’EX to Shibuya, then take a short taxi to Tokyu Stay Aoyama.","לקנות את ה-N’EX השמורה הנוחה הבאה לשיבויה, ואז מונית קצרה ל-Tokyu Stay Aoyama."),B("Keep enough transfer time and do not board a different reserved service without changing the ticket.","להשאיר מספיק זמן להחלפה ולא לעלות לשירות שמור אחר בלי לשנות את הכרטיס."),B("If the preferred train is missed/full, buy the next reserved departure or use the official airport transport desk to select another route.","אם הרכבת הוחמצה/מלאה, לקנות יציאה שמורה הבאה או לבחור מסלול אחר בדלפק התחבורה הרשמי בשדה.")],links:[[B("Official N’EX tickets","כרטיסי N’EX רשמיים"),"https://www.jreast.co.jp/en/multi/nex/tickets/"],[B("Narita rail access","גישה לרכבת בנריטה"),"https://www.narita-airport.jp/en/access/train/"]]},
  {id:"family-ic-fallback",phase:"japan",icon:"💳",kind:B("IC CARD","כרטיס IC"),title:B("Finish any missing family IC cards","להשלים כרטיסי IC חסרים למשפחה"),due:B("NRT T1 on 6 Oct or a listed JR East center","נריטה T1 ב-6 באוקטובר או מרכז JR East מהרשימה"),people:B("Anyone without a working mobile card","כל מי שאין לו כרטיס מובייל עובד"),summary:B("Use physical Welcome Suica cards as the fallback; do not delay the pre-booked driver without checking the voucher window.","להשתמש בכרטיסי Welcome Suica פיזיים כחלופה; לא לעכב את הנהג שהוזמן בלי לבדוק את חלון הזמן בשובר."),steps:[B("If the transfer pickup window is tight, Gilad can buy eligible cards earlier at Shibuya/Shinjuku/Tokyo JR East centers; in principle each person gets one card.","אם חלון האיסוף של ההסעה צפוף, גלעד יכול לקנות כרטיסים מתאימים מוקדם יותר במרכזי JR East בשיבויה/שינג׳וקו/טוקיו; עקרונית כל אדם מקבל כרטיס אחד."),B("Otherwise use the Narita T1 Welcome Suica machines after customs and before meeting the driver only if time permits.","אחרת להשתמש במכונות Welcome Suica בנריטה T1 אחרי המכס ולפני המפגש עם הנהג רק אם הזמן מאפשר."),B("Give each person their own card and reference paper; start with a modest balance and add cash later.","לתת לכל אדם כרטיס ודף אסמכתה משלו; להתחיל ביתרה מתונה ולהוסיף מזומן אחר כך."),B("Until a card is available, buy individual paper tickets; do not share one IC card through a gate.","עד שיש כרטיס, לקנות כרטיסי נייר אישיים; לא להעביר כרטיס IC אחד בין נוסעים בשער.")],links:[[B("Official purchase locations","נקודות רכישה רשמיות"),"https://www.jreast.co.jp/en/multi/welcomesuica/purchase.html"]]},
  {id:"day-before-checks",phase:"japan",icon:"☁",kind:B("DAILY","יומי"),title:B("Run the evening-before check","לבצע בדיקת ערב לפני"),due:B("Every evening in Japan","כל ערב ביפן"),people:B("Gilad + one rotating family checker","גלעד + בודק משפחתי מתחלף"),summary:B("Check weather, opening hours, transport disruption, tickets, meeting points, and the one thing to cut.","לבדוק מזג אוויר, שעות פתיחה, שיבושי תחבורה, כרטיסים, נקודות מפגש והדבר האחד שאפשר לחתוך."),steps:[B("Open the next day’s itinerary card and all time-sensitive official links.","לפתוח את כרטיס המסלול של מחר ואת כל הקישורים הרשמיים התלויים בזמן."),B("Confirm first departure, final return, weather gate, ticket QR codes, and whether everyone has enough IC balance.","לאשר יציאה ראשונה, חזרה אחרונה, שער מזג אוויר, קודי QR ויתרת IC מספקת לכולם."),B("Name the optional stop to remove if the family starts late or energy drops.","לציין את התחנה האופציונלית שתוסר אם המשפחה מתחילה מאוחר או האנרגיה יורדת."),B("If a closure or weather alert appears, choose the day’s stated indoor/rest alternative and handle any cancellation through the actual booking.","אם מופיעה סגירה או התראת מזג אוויר, לבחור חלופת פנים/מנוחה של היום ולטפל בביטול דרך ההזמנה בפועל.")],links:[]},
  {id:"asij",phase:"conditional",icon:"🎓",kind:B("VERIFY","אימות"),title:B("Ask ASIJ directly—do not buy around the old lead","לפנות ישירות ל-ASIJ — לא לקנות סביב הכיוון הישן"),due:B("Only if Gilad wants to pursue it","רק אם גלעד רוצה להמשיך"),people:B("Gilad","גלעד"),summary:B("No public 3/4 October alumni event was verified; restore it only from a personal invitation or alumni-office confirmation.","לא אומת אירוע בוגרים ציבורי ב-3/4 באוקטובר; להחזיר אותו רק לפי הזמנה אישית או אישור משרד הבוגרים."),steps:[B("Contact the alumni office with Gilad’s graduation/attendance details and ask about private or invitation-only events on 3–4 October.","לפנות למשרד הבוגרים עם פרטי הלימודים של גלעד ולשאול על אירועים פרטיים או בהזמנה בלבד ב-3–4 באוקטובר."),B("Require exact date, time, venue, eligibility, registration link, and cost before changing the itinerary.","לדרוש תאריך, שעה, מקום, זכאות, קישור הרשמה ועלות מדויקים לפני שינוי המסלול."),B("Without a personal invitation, keep the existing public itinerary and mark this optional task reviewed.","ללא הזמנה אישית, לשמור על המסלול הציבורי ולסמן שהמשימה האופציונלית נבדקה.")],links:[[B("ASIJ alumni community","קהילת בוגרי ASIJ"),"https://www.asij.ac.jp/alumni/alumni-community"]]},
  {id:"nezu",phase:"now",icon:"館",kind:B("TIMED MUSEUM","מוזיאון מתוזמן"),title:B("Reserve Nezu for 2 October","להזמין נזו ל-2 באוקטובר"),due:B("Now, when the 2 Oct calendar is available","עכשיו, כשנפתח לוח 2 באוקטובר"),people:B("Gilad","גלעד"),summary:B("Keep Nezu; Ōta is closed that day.","לשמור על נזו; אוטה סגור ביום זה."),steps:[B("Use Nezu’s exhibition/online ticket link for an entry around 10:30. Check the current price and cancellation policy.","להשתמש בקישור התערוכה/כרטיסים של נזו לכניסה סביב 10:30. לבדוק מחיר ותנאי ביטול."),B("If unavailable, retain the Omotesando architecture walk and Cat Street; do not substitute a closed Ōta visit.","אם אין מקום, לשמור על הליכת האדריכלות באומוטסנדו וקאט סטריט; לא להחליף בביקור באוטה הסגור.")],links:[[B("Nezu official exhibition and tickets","נזו: תערוכה וכרטיסים רשמיים"),"https://www.nezu-muse.or.jp/en/exhibitions/current/"]]},
  {id:"emergency",phase:"before",icon:"☎",kind:B("EMERGENCY PLAN","תכנית חירום"),title:B("Save emergency contacts and a family meeting plan","לשמור אנשי קשר ותכנית מפגש לחירום"),due:B("Before each departure; review together on 6 Oct","לפני כל יציאה; לעבור יחד ב-6 באוקטובר"),people:B("All five, with both adults holding copies","כל החמישה, עותקים אצל שני המבוגרים"),summary:B("110 police; 119 ambulance/fire; JNTO 050-3816-2787.","110 משטרה; 119 אמבולנס/כיבוי; JNTO 050-3816-2787."),steps:[B("Save the 24-hour JNTO visitor hotline, insurer assistance, hotel address in Japanese, passport copies and a trusted home contact offline on both adult phones.","לשמור בשני טלפוני המבוגרים אופליין את מוקד JNTO ל-24 שעות, סיוע הביטוח, כתובת המלון ביפנית, עותקי דרכון ואיש קשר בבית."),B("Agree a meeting point if separated, especially at Kawagoe; give each traveler the lodging/contact card. If a phone fails, use the paper copy and ask station staff or police for help.","לקבוע מקום מפגש אם נפרדים, במיוחד בקוואגואה; לתת לכל נוסע כרטיס לינה/קשר. אם טלפון נכשל, להשתמש בעותק הנייר ולבקש עזרה מצוות תחנה או משטרה.")],links:[[B("JNTO emergency help","עזרה בחירום של JNTO"),"https://www.japan.travel/en/plan/hotline/"]]},
  {
    id:"cancel-kumihimo", phase:"now", icon:"🪢", kind:B("CANCEL A STAY","ביטול לינה"),
    title:B("Cancel Kumihimo no Ma","לבטל את Kumihimo no Ma"), due:B("By 3 Oct, 23:59 (verify)","עד 3 באוקטובר, 23:59 (לבדוק)"), people:B("Gilad","גלעד"),
    summary:B("Crane Stay replaces it for 18–20 Oct; don’t pay for both.","Crane Stay מחליף אותו ל-18–20 באוקטובר; לא לשלם על שניהם."), ref:"••••",
    steps:[B("Open the booking in Booking.com and read the live cancellation terms before acting. The old record says free cancellation ends 3 Oct at 23:59.","לפתוח את ההזמנה ב-Booking.com ולקרוא את תנאי הביטול העדכניים לפני שפועלים. לפי הרישום הישן הביטול החינמי מסתיים ב-3 באוקטובר ב-23:59."),B("Cancel, save the cancellation email offline, and tick this task.","לבטל, לשמור את מייל הביטול אופליין ולסמן את המשימה.")],
    links:[[B("Booking.com trips","הנסיעות שלי ב-Booking.com"),"https://secure.booking.com/myreservations.html"]]
  },
  {
    id:"driving-docs", phase:"now", icon:"🪪", kind:B("CAR · 11–14 OCT","רכב · 11–14 באוקטובר"),
    title:B("Driving documents for the Toyota","מסמכי נהיגה לטויוטה"), due:B("Before Gilad flies on 28 Sep","לפני שגלעד טס ב-28 בספטמבר"), people:B("Every driver","כל נהג"),
    summary:B("No valid IDP, no car: the Otsuki counter will refuse the rental.","בלי רישיון בינלאומי תקף אין רכב: הדלפק באוצוקי יסרב להשכרה."),
    steps:[B("Every driver carries the original Israeli plastic licence, the passport, and a physical IDP issued in Israel less than one year before driving. Japan accepts the Israeli dual Geneva/Vienna format within that one-year limit, even if its printed validity is longer.","כל נהג נושא רישיון ישראלי פלסטי מקורי, דרכון ורישיון בינלאומי פיזי שהונפק בישראל פחות משנה לפני הנהיגה. יפן מקבלת את הפורמט הישראלי המשולב ז׳נבה/וינה בגבול השנה הזה, גם אם התוקף המודפס ארוך יותר."),B("Register every driver at the counter. If a document is missing, switch to trains and buses via Otsuki and Gotemba.","לרשום כל נהג בדלפק. אם חסר מסמך, לעבור לרכבות ואוטובוסים דרך אוצוקי וגוטמבה."),B("Drive on the left and expect narrow roads. Photograph the car and fuel gauge at pickup and return.","נהיגה בצד שמאל ולצפות לכבישים צרים. לצלם את הרכב ואת מד הדלק באיסוף ובהחזרה.")],
    links:[[B("Japan IDP rules for Israelis","כללי רישיון בינלאומי ליפן לישראלים"),"https://embassies.gov.il/japan/he/announcements/international-driving-permit"],[B("Toyota Rent a Car","טויוטה רנט א קאר"),"https://rent.toyota.co.jp/eng/"]]
  },
  {
    id:"narita-taxi", phase:"now", icon:"🚐", kind:B("AIRPORT TAXI","מונית משדה התעופה"),
    title:B("Add LY075 to the Narita taxi booking","להוסיף את LY075 להזמנת המונית מנריטה"), due:B("Before 5 Oct","לפני 5 באוקטובר"), people:B("Gilad","גלעד"),
    summary:B("Booking.com asked for the flight details, so the driver can track a delay.","Booking.com ביקשו את פרטי הטיסה, כדי שהנהג יוכל לעקוב אחרי עיכוב."), ref:"••••",
    steps:[B("Open the taxi booking and add flight LY075, landing 16:20 on 6 Oct at Narita Terminal 1.","לפתוח את הזמנת המונית ולהוסיף את טיסה LY075, נחיתה ב-16:20 ב-6 באוקטובר בנריטה טרמינל 1."),B("Download the voucher and read the exact driver meeting point and contact method. Share it with Ayelet.","להוריד את השובר ולקרוא את נקודת המפגש המדויקת עם הנהג ואת דרך יצירת הקשר. לשתף עם אילת."),B("If there’s no driver contact 20 minutes after the actual landing, call the provider on the voucher.","אם אין קשר עם הנהג 20 דקות אחרי הנחיתה בפועל, להתקשר לספק לפי השובר.")],
    links:[[B("Booking.com trips","הנסיעות שלי ב-Booking.com"),"https://secure.booking.com/myreservations.html"]]
  },
  {
    id:"hakone-checkin", phase:"now", icon:"♨️", kind:B("VILLA CHECK-IN","צ׳ק־אין בווילה"),
    title:B("Get the Hakone villa check-in link","לקבל את קישור הצ׳ק־אין לווילה בהקונה"), due:B("Before 11 Oct","לפני 11 באוקטובר"), people:B("Gilad","גלעד"),
    summary:B("The villa is unmanned; without the link you can’t get in.","הווילה ללא צוות; בלי הקישור אי אפשר להיכנס."), ref:"••••",
    steps:[B("Reply to the property’s message through Booking.com with your email address, so the online check-in link reaches you.","לענות להודעת הנכס דרך Booking.com עם כתובת המייל שלך, כדי שקישור הצ׳ק־אין המקוון יגיע אליך."),B("Ask about parking for the Corolla Cross. The link arrives the day before; save it offline.","לשאול על חניה לקורולה קרוס. הקישור מגיע יום לפני; לשמור אותו אופליין.")],
    links:[[B("Booking.com trips","הנסיעות שלי ב-Booking.com"),"https://secure.booking.com/myreservations.html"]]
  },
  {
    id:"kyoto-tokyo", phase:"now", icon:"🚅", kind:B("TRAIN · NOT BOOKED","רכבת · לא הוזמנה"),
    title:B("Book Kyoto → Shinagawa for 18 Oct","להזמין קיוטו ← שינאגאווה ל-18 באוקטובר"), due:B("Now; seats are on sale","עכשיו; המושבים במכירה"), people:B("All five · 4 adults, 1 child","כל החמישה · 4 מבוגרים, ילד"),
    summary:B("The only long train leg still unbooked.","מקטע הרכבת הארוך היחיד שעדיין לא הוזמן."),
    steps:[B("In SmartEX, search Kyoto → Shinagawa on 18 Oct and pick a Nozomi after the 11:00 Besso checkout that still leaves time for Kawagoe, if you want the floats.","ב-SmartEX לחפש קיוטו ← שינאגאווה ב-18 באוקטובר ולבחור נוזומי אחרי הצ׳ק־אאוט מ-Besso ב-11:00, שעדיין משאירה זמן לקוואגואה אם רוצים את העגלות."),B("Book all five together: four adults and Erel as a child. Any bag over 160 cm in total dimensions needs an oversized-baggage seat.","להזמין את כל החמישה יחד: ארבעה מבוגרים ואראל כילד. כל תיק מעל 160 ס״מ בסכום הממדים צריך מושב עם אזור למזוודה גדולה."),B("Book during daytime Japan hours; between 23:30 and 05:30 SmartEX limits a booking to three people.","להזמין בשעות היום ביפן; בין 23:30 ל-05:30 SmartEX מגביל הזמנה לשלושה אנשים.")],
    links:[[B("SmartEX","SmartEX"),"https://smart-ex.jp/en/"],[B("Oversized baggage rules","כללי מזוודה גדולה"),"https://global.jr-central.co.jp/en/info/oversized-baggage/"]]
  },
  {
    id:"birthday-dinner", phase:"now", icon:"🎂", kind:B("RESERVATION","הזמנה"),
    title:B("Book the 19 Oct birthday dinner","להזמין את ארוחת יום ההולדת ב-19 באוקטובר"), due:B("As soon as you choose","ברגע שבוחרים"), people:B("All five","כל החמישה"),
    summary:B("It’s a Monday, and good rooms for five go early.","זה יום שני, וחדרים טובים לחמישה נגמרים מוקדם."),
    steps:[B("Pick one of the dinner options on the 19 Oct day card and confirm it’s open on Monday.","לבחור אחת מאפשרויות הארוחה בכרטיס היום של 19 באוקטובר ולוודא שהמקום פתוח ביום שני."),B("In the booking, write: fish is fine; no shellfish, shrimp, crab, squid or octopus; two diners eat no meat and one eats no pork. Attach the Japanese food card.","לכתוב בהזמנה: דגים בסדר; בלי פירות ים, שרימפס, סרטנים, קלמארי או תמנון; שניים לא אוכלים בשר ואחד לא אוכל חזיר. לצרף את כרטיס האוכל ביפנית.")],
    links:[]
  },
  {
    id:"narita-home", phase:"now", icon:"✈️", kind:B("AIRPORT · NOT BOOKED","שדה תעופה · לא הוזמן"),
    title:B("Book the 20 Oct ride to Narita","להזמין את הנסיעה לנריטה ב-20 באוקטובר"), due:B("A few days ahead; by 17 Oct","כמה ימים מראש; עד 17 באוקטובר"), people:B("All five","כל החמישה"),
    summary:B("LY076 leaves at 19:35; aim to be at the airport by about 16:30.","LY076 ממריאה ב-19:35; לכוון להגעה לשדה עד 16:30 בערך."),
    steps:[B("Choose on the 20 Oct day card: N’EX from Shibuya (about 80 minutes), the limousine bus from Shibuya Mark City, or a jumbo taxi from the door.","לבחור בכרטיס היום של 20 באוקטובר: N’EX משיבויה (כ-80 דקות), אוטובוס הלימוזין משיבויה מארק סיטי, או מונית ג׳מבו מהדלת."),B("With all the bags, the jumbo taxi is the simplest; book it for about 14:45.","עם כל התיקים, מונית הג׳מבו הכי פשוטה; להזמין לבערך 14:45."),B("If a train is disrupted on the day, ask JR or airport staff for the next option at once; don’t spend the airport buffer.","אם יש שיבוש ברכבת ביום עצמו, לבקש מיד מצוות JR או השדה את האפשרות הבאה; לא לבזבז את מרווח הזמן לשדה.")],
    links:[[B("N’EX tickets","כרטיסי N’EX"),"https://www.jreast.co.jp/multi/en/nex/"]]
  },
  {
    id:"booking-policies", phase:"now", icon:"⏱", kind:B("CANCELLATION CLIFFS","מועדי ביטול"),
    title:B("Recheck each live cancellation policy","לבדוק מחדש כל מדיניות ביטול חיה"), due:B("Now, then once more before each deadline","עכשיו, ושוב לפני כל מועד"), people:B("Gilad","גלעד"),
    summary:B("Besso is free to cancel until 29 Sep, Crane Stay until 3 Oct; the rest need checking.","ב-Besso ביטול חינם עד 29 בספטמבר, ב-Crane Stay עד 3 באוקטובר; את השאר צריך לבדוק."),
    steps:[B("Open each stay in Booking.com: Nakano, Miuraya, the Hakone villa, Besso and Crane Stay. Note any deadline in the day notes.","לפתוח כל לינה ב-Booking.com: נקאנו, מיאוראיה, הווילה בהקונה, Besso ו-Crane Stay. לרשום כל מועד בהערות היום."),B("If a record is unclear, contact the property through Booking.com before the earliest possible deadline; don’t cancel based on the app’s text.","אם רשומה לא ברורה, לפנות לנכס דרך Booking.com לפני המועד המוקדם האפשרי; לא לבטל לפי הטקסט באפליקציה.")],
    links:[[B("Booking.com trips","הנסיעות שלי ב-Booking.com"),"https://secure.booking.com/myreservations.html"]]
  },
  {
    id:"luggage-plan", phase:"before", icon:"🧳", kind:B("LUGGAGE","מזוודות"),
    title:B("Decide where the big suitcases go on 11–18 Oct","להחליט לאן הולכות המזוודות הגדולות ב-11–18 באוקטובר"), due:B("Before 10 Oct","לפני 10 באוקטובר"), people:B("Gilad and Ayelet","גלעד ואילת"),
    summary:B("The Azusa, the car and Kyoto all work best with one small bag each.","האזוסה, הרכב וקיוטו עובדים הכי טוב עם תיק קטן אחד לכל אחד."),
    steps:[B("Ask the Nakano host whether the big cases can stay until 18 Oct, and how you’d collect them.","לשאול את המארח בנקאנו אם המזוודות הגדולות יכולות להישאר עד 18 באוקטובר, ואיך אוספים אותן."),B("Otherwise ship them to Crane Stay by Yamato on 10 Oct, only after Crane Stay confirms someone can receive them. Put the exact address, guest name and delivery date on the slip.","אחרת לשלוח אותן ל-Crane Stay ב-Yamato ב-10 באוקטובר, רק אחרי ש-Crane Stay מאשרים שמישהו יקבל אותן. לרשום על הטופס כתובת מדויקת, שם אורח ותאריך מסירה."),B("Pack one small bag per person for Fuji, Hakone and Kyoto.","לארוז תיק קטן אחד לכל אחד לפוג׳י, הקונה וקיוטו.")],
    links:[[B("Search: Yamato luggage delivery","חיפוש: משלוח מזוודות Yamato"),"https://www.google.com/search?q=Yamato+Transport+luggage+delivery+English"]]
  },
  {
    id:"bag-measure", phase:"before", icon:"📏", kind:B("LUGGAGE","מזוודות"),
    title:B("Measure every bag you’ll take on the train","למדוד כל תיק שעולה לרכבת"), due:B("Before booking 18 Oct","לפני ההזמנה ל-18 באוקטובר"), people:B("Everyone","כולם"),
    summary:B("On the Tokaido Shinkansen, bags over 160 cm in total need a special seat.","בשינקנסן טוקאידו, תיקים מעל 160 ס״מ בסכום הממדים צריכים מושב מיוחד."),
    steps:[B("Measure height + width + depth. From 161 to 250 cm needs a seat with an oversized-baggage area; over 250 cm can’t be carried.","למדוד גובה + רוחב + עומק. מ-161 עד 250 ס״מ צריך מושב עם אזור למזוודה גדולה; מעל 250 ס״מ אסור להעלות."),B("Hikari 709 on 14 Oct is already booked, so keep the car-and-Kyoto bags small. Add oversized-baggage seats when you book the 18 Oct Nozomi if needed.","ה-Hikari 709 ב-14 באוקטובר כבר הוזמנה, אז לשמור על תיקי הרכב וקיוטו קטנים. להוסיף מושבים למזוודה גדולה בהזמנת הנוזומי ל-18 באוקטובר אם צריך.")],
    links:[[B("JR Central baggage rules","כללי המטען של JR Central"),"https://global.jr-central.co.jp/en/info/oversized-baggage/"]]
  },
  {
    id:"suica-erel", phase:"before", icon:"🎫", kind:B("IC CARD","כרטיס IC"),
    title:B("Buy Erel’s physical Welcome Suica","לקנות Welcome Suica פיזי לאראל"), due:B("At NRT T1 on 6 Oct, or Gilad buys with Erel’s passport","בנריטה T1 ב-6 באוקטובר, או שגלעד קונה עם הדרכון של אראל"), people:B("Erel · age 11","אראל · בן 11"),
    summary:B("Welcome Suica Mobile needs age 13+, so Erel gets a physical child card.","Welcome Suica Mobile דורש גיל 13+, לכן אראל מקבל כרטיס ילד פיזי."),
    steps:[B("Bring Erel’s passport. A family member may buy the card for him, but ID is required for a child card.","להביא את הדרכון של אראל. בן משפחה יכול לקנות עבורו, אך נדרשת תעודה לכרטיס ילד."),B("At 11 he pays child fares on JR and the metro, and the child card charges them automatically. Keep the reference paper with the card.","בגיל 11 הוא משלם תעריף ילד ב-JR ובמטרו, וכרטיס הילד מחייב אותו אוטומטית. לשמור את דף האסמכתה עם הכרטיס."),B("He needs it on 11 Oct: the Azusa fare is paid by tapping each card.","הוא צריך אותו ב-11 באוקטובר: הנסיעה באזוסה משולמת בהעברת כרטיס של כל אחד.")],
    links:[[B("Physical Welcome Suica","Welcome Suica פיזי"),"https://www.jreast.co.jp/en/multi/welcomesuica/purchase.html"]]
  },
  {
    id:"teamlab-day", phase:"japan", icon:"✨", kind:B("BOOKED · 8 OCT","הוזמן · 8 באוקטובר"),
    title:B("teamLab Planets at 14:30","teamLab Planets ב-14:30"), due:B("8 Oct; QR from midnight","8 באוקטובר; QR מחצות"), people:B("All five","כל החמישה"),
    summary:B("Already paid; the QR codes appear in My Tickets from midnight.","כבר שולם; קודי ה-QR מופיעים ב-My Tickets מחצות."),
    steps:[B("Open My Tickets after midnight on 8 Oct and check all five QR codes load. The link is in your teamLab confirmation email.","לפתוח את My Tickets אחרי חצות ב-8 באוקטובר ולבדוק שכל חמשת קודי ה-QR נטענים. הקישור נמצא במייל האישור של teamLab."),B("Arrive inside the 14:30–15:00 entry window. You wade through water, so wear trousers that roll up.","להגיע בתוך חלון הכניסה 14:30–15:00. הולכים בתוך מים, אז ללבוש מכנסיים שאפשר לקפל.")],
    links:[[B("teamLab Planets","teamLab Planets"),"https://www.teamlab.art/e/planets/"]]
  },
  {
    id:"azusa-day", phase:"japan", icon:"🚄", kind:B("BOOKED · 11 OCT","הוזמן · 11 באוקטובר"),
    title:B("Azusa 81 from Shinjuku at 09:02","אזוסה 81 משינג׳וקו ב-09:02"), due:B("11 Oct","11 באוקטובר"), people:B("All five","כל החמישה"),
    summary:B("Seat tickets only: the fare is paid by each person’s IC card.","כרטיסי מושב בלבד: הנסיעה משולמת בכרטיס IC של כל אחד."), ref:"••••",
    steps:[B("The night before, top up every IC card with enough for Shinjuku → Otsuki.","בערב הקודם לטעון כל כרטיס IC בסכום שמספיק לשינג׳וקו ← אוצוקי."),B("Leave Nakano by about 08:15 with the bags; Car 8, seats 9A, 9B, 10A, 10B, 11A.","לצאת מנקאנו עד 08:15 בערך עם התיקים; קרון 8, מושבים ⁦9A, 9B, 10A, 10B, 11A⁩."),B("You reach Otsuki at 10:13; the Toyota counter opens your rental at 11:00.","מגיעים לאוצוקי ב-10:13; הדלפק של טויוטה פותח את ההשכרה ב-11:00.")],
    links:[[B("JR East reservations","הזמנות JR East"),"https://www.eki-net.com/en/jreast-train-reservation/Top/Index"]]
  },
  {
    id:"toyota-return", phase:"japan", icon:"⛽", kind:B("CAR · 14 OCT","רכב · 14 באוקטובר"),
    title:B("Return the Toyota at Mishima by 11:00","להחזיר את הטויוטה במישימה עד 11:00"), due:B("14 Oct, 11:00","14 באוקטובר, 11:00"), people:B("The driver","הנהג"),
    summary:B("Hikari 709 leaves at 11:46, so the return can’t slip.","ה-Hikari 709 יוצאת ב-11:46, אז אי אפשר לאחר בהחזרה."), ref:"••••",
    steps:[B("Refuel near Mishima, then photograph the car and the fuel gauge at the Mishima Shinkansen Ext. shop.","לתדלק ליד מישימה, ואז לצלם את הרכב ואת מד הדלק בסניף Mishima Shinkansen Ext."),B("If you’re running late, call the shop and drop the morning stops, not the train.","אם מאחרים, להתקשר לסניף ולוותר על עצירות הבוקר, לא על הרכבת.")],
    links:[[B("Toyota Rent a Car","טויוטה רנט א קאר"),"https://rent.toyota.co.jp/eng/"]]
  },
  {
    id:"hikari-day", phase:"japan", icon:"🚅", kind:B("BOOKED · 14 OCT","הוזמן · 14 באוקטובר"),
    title:B("Hikari 709, Mishima 11:46 → Kyoto 13:37","Hikari 709, מישימה 11:46 ← קיוטו 13:37"), due:B("14 Oct","14 באוקטובר"), people:B("All five","כל החמישה"),
    summary:B("Car 6, seats 1A, 1B, 1C, 2A, 2B.","קרון 6, מושבים ⁦1A, 1B, 1C, 2A, 2B⁩."), ref:"••••",
    steps:[B("Have the SmartEX QR ready, or pick up paper tickets at a machine before the gates.","להכין את ה-QR של SmartEX, או לאסוף כרטיסי נייר במכונה לפני השערים."),B("If you miss it, staff at the ticket office can move you to the next Hikari or Kodama.","אם מפספסים, הצוות במשרד הכרטיסים יכול להעביר אתכם ל-Hikari או ל-Kodama הבאה.")],
    links:[[B("SmartEX","SmartEX"),"https://smart-ex.jp/en/"]]
  },
  {
    id:"final-storage", phase:"japan", icon:"🧳", kind:B("LAST DAY","יום אחרון"),
    title:B("Sort the bags for 20 Oct","לסדר את התיקים ל-20 באוקטובר"), due:B("By 18 Oct","עד 18 באוקטובר"), people:B("Gilad","גלעד"),
    summary:B("Checkout is 11:00 and you leave for Narita around 14:45.","הצ׳ק־אאוט ב-11:00 והיציאה לנריטה בערך ב-14:45."),
    steps:[B("Ask the Crane Stay host whether the bags can stay after the 11:00 checkout.","לשאול את המארח ב-Crane Stay אם התיקים יכולים להישאר אחרי הצ׳ק־אאוט ב-11:00."),B("If not, keep the last morning within one direct ride of the bags, or book the jumbo taxi from the door.","אם לא, להישאר בבוקר האחרון במרחק נסיעה ישירה אחת מהתיקים, או להזמין את מונית הג׳מבו מהדלת.")],
    links:[]
  },
  {
    id:"disney-tickets", phase:"conditional", icon:"🏰", kind:B("IF CHOSEN","אם נבחר"),
    title:B("Buy dated Disney tickets","לקנות כרטיסי דיסני מתוארכים"), due:B("As soon as Gilad approves a park for Fri 9 Oct","ברגע שגלעד מאשר פארק לשישי 9 באוקטובר"), people:B("3 adults, Yaara (junior), Erel (child)","3 מבוגרים, יערה (נוער), אראל (ילד)"),
    summary:B("Only if Gilad approves Disneyland or DisneySea for Fri 9 Oct, the one Disney day.","רק אם גלעד מאשר דיסנילנד או דיסני־סי לשישי 9 באוקטובר, יום הדיסני היחיד."),
    steps:[B("Buy on the official site: three adults (Gilad, Ayelet, Geffen), one junior (Yaara, 17) and one child (Erel, 11). Prices vary by date.","לקנות באתר הרשמי: שלושה מבוגרים (גלעד, אילת, גפן), נער/ה אחד/ת (יערה, 17) וילד אחד (אראל, 11). המחיר משתנה לפי תאריך."),B("Double-check the park before paying: you can’t switch parks later, and there are no refunds for a change of plan.","לבדוק שוב את הפארק לפני התשלום: אי אפשר להחליף פארק אחר כך, ואין החזר כספי על שינוי תכניות."),B("Save the tickets in the official app on every phone before the day.","לשמור את הכרטיסים באפליקציה הרשמית בכל הטלפונים לפני היום.")],
    links:[[B("Official tickets","כרטיסים רשמיים"),"https://www.tokyodisneyresort.jp/en/ticket/index.html"]]
  },
  {
    id:"ghibli-tickets", phase:"conditional", icon:"🎞", kind:B("IF CHOSEN","אם נבחר"),
    title:B("Try for Ghibli Museum tickets (7 Oct)","לנסות להשיג כרטיסים למוזיאון ג׳יבלי (7 באוקטובר)"), due:B("Now; they sell out weeks ahead","עכשיו; נגמרים שבועות מראש"), people:B("All five","כל החמישה"),
    summary:B("Timed entry only, and October may already be gone.","כניסה לפי שעה בלבד, ואוקטובר אולי כבר נגמר."),
    steps:[B("Check the official ticket page for 7 Oct. If it’s sold out, drop the option and tick this task.","לבדוק בעמוד הכרטיסים הרשמי את 7 באוקטובר. אם אזל, לוותר על האפשרות ולסמן את המשימה.")],
    links:[[B("Ghibli Museum","מוזיאון ג׳יבלי"),"https://www.ghibli-museum.jp/en/"]]
  },
  {
    id:"shibuya-sky", phase:"conditional", icon:"🌇", kind:B("IF CHOSEN","אם נבחר"),
    title:B("Book the Shibuya Sky sunset slot (7 Oct)","להזמין את משבצת השקיעה בשיבויה סקיי (7 באוקטובר)"), due:B("A few days ahead","כמה ימים מראש"), people:B("All five","כל החמישה"),
    summary:B("Sunset slots sell first.","משבצות השקיעה נגמרות ראשונות."),
    steps:[B("Book online for five and note the time on the 7 Oct day card.","להזמין אונליין לחמישה ולרשום את השעה בכרטיס היום של 7 באוקטובר.")],
    links:[[B("Shibuya Sky","שיבויה סקיי"),"https://www.shibuya-scramble-square.com/sky/"]]
  },
  {
    id:"daikoku-tour", phase:"conditional", icon:"🏎", kind:B("IF CHOSEN","אם נבחר"),
    title:B("Book the Daikoku night tour (Gilad and Erel)","להזמין את סיור הלילה בדאיקוקו (גלעד ואראל)"), due:B("Before 9 Oct","לפני 9 באוקטובר"), people:B("Gilad and Erel","גלעד ואראל"),
    summary:B("Friday is best; Saturday is the backup.","שישי הכי טוב; שבת היא הגיבוי."),
    steps:[B("Book a licensed tour for two, and check its policy if police close the car park.","להזמין סיור מורשה לשניים, ולבדוק את המדיניות שלו אם המשטרה סוגרת את החניון."),B("Check Erel’s age fits the tour’s rules.","לבדוק שהגיל של אראל מתאים לכללי הסיור.")],
    links:[[B("The tour in the picker","הסיור בבורר"),"https://www.headout.com/tokyos-car-culture-daikoku-pa/tokyo-jdm-car-night-tour-with-daikoku-car-meet-and-local-guide-e-52169/"]]
  },
  {
    id:"sagano", phase:"conditional", icon:"🚞", kind:B("IF CHOSEN","אם נבחר"),
    title:B("Book the Sagano train and Hozugawa boat (15 Oct)","להזמין את רכבת סאגאנו וסירת הוזוגאווה (15 באוקטובר)"), due:B("Now, if you want it","עכשיו, אם רוצים"), people:B("All five","כל החמישה"),
    summary:B("Two separate bookings; sales opened on 15 Sep.","שתי הזמנות נפרדות; המכירה נפתחה ב-15 בספטמבר."),
    steps:[B("Book the trolley first, Torokko Saga → Kameoka, then a boat about an hour later; the official pairing is the 09:02 train with the 10:00 boat.","להזמין קודם את הרכבת, Torokko Saga ← Kameoka, ואז סירה כשעה אחריה; הצימוד הרשמי הוא רכבת 09:02 עם סירה ב-10:00."),B("The boarding QR only appears on 15 Oct; a printed voucher alone isn’t valid. Recheck operation the evening before, because river conditions can cancel the boat.","קוד העלייה מופיע רק ב-15 באוקטובר; שובר מודפס לבדו אינו תקף. לבדוק שוב בערב שלפני, כי תנאי הנהר יכולים לבטל את הסירה.")],
    links:[[B("Sagano tickets","כרטיסי סאגאנו"),"https://www.sagano-kanko.co.jp/en/ticket/"],[B("Hozugawa reservations","הזמנות הוזוגאווה"),"https://www.hozugawakudari.jp/tickets/reservation"]]
  },
  {
    id:"enoshima", phase:"conditional", icon:"🗿", kind:B("IF CHOSEN","אם נבחר"),
    title:B("Kamakura and Enoshima day (9 Oct)","יום קמקורה ואנושימה (9 באוקטובר)"), due:B("Morning of 9 Oct","בוקר 9 באוקטובר"), people:B("All five","כל החמישה"),
    summary:B("Buy the 1-Day Pass if you’ll ride the Enoden twice; bring Yaara’s student ID.","לקנות את הכרטיס היומי אם נוסעים באנודן פעמיים; להביא את תעודת התלמיד של יערה."),
    steps:[B("Buy the Enoshima–Kamakura 1-Day Pass at the station, or pay each leg by IC card.","לקנות בתחנה את הכרטיס היומי Enoshima–Kamakura, או לשלם כל קטע בכרטיס IC."),B("At the aquarium, Yaara’s high-school ticket needs her student ID; Erel pays the elementary rate.","באקווריום, כרטיס התיכון של יערה דורש תעודת תלמיד; אראל משלם תעריף יסודי.")],
    links:[[B("Odakyu pass","כרטיס אודקיו"),"https://www.odakyu.jp/english/passes/enoshima_kamakura/"],[B("Aquarium hours and fares","שעות ומחירים באקווריום"),"https://www.enosui.com/basicinfo.php"]]
  },
  {
    id:"ceatec", phase:"conditional", icon:"📡", kind:B("IF CHOSEN","אם נבחר"),
    title:B("Register for CEATEC (solo day, 16 Oct)","להירשם ל-CEATEC (יום לבד, 16 באוקטובר)"), due:B("Before 13 Oct","לפני 13 באוקטובר"), people:B("Gilad","גלעד"),
    summary:B("CEATEC and the Japan Mobility Show Bizweek run 13–16 Oct at Makuhari; registration is free.","CEATEC ו-Japan Mobility Show Bizweek מתקיימים ב-13–16 באוקטובר במקוהרי; ההרשמה חינם."),
    steps:[B("Register online and keep the entry QR. From Kyoto it’s about 3 hours each way, so leave early and plan the return train.","להירשם אונליין ולשמור את קוד הכניסה. מקיוטו זה כשלוש שעות לכל כיוון, אז לצאת מוקדם ולתכנן את רכבת החזרה.")],
    links:[[B("CEATEC","CEATEC"),"https://www.ceatec.com/en/"]]
  },
  {
    id:"airport-shipping", phase:"conditional", icon:"📦", kind:B("IF CHOSEN","אם נבחר"),
    title:B("Ship the big cases to Narita (20 Oct flight)","לשלוח את המזוודות הגדולות לנריטה (לטיסה ב-20 באוקטובר)"), due:B("By 18 Oct, before the counter’s cutoff","עד 18 באוקטובר, לפני שעת הסגירה של הדלפק"), people:B("Gilad","גלעד"),
    summary:B("Yamato needs bags at least two days before the flight (three from some areas), so 19 Oct is too late.","ימאטו צריכה את התיקים לפחות יומיים לפני הטיסה (שלושה מאזורים מסוימים), אז 19 באוקטובר מאוחר מדי."),
    steps:[B("Decide first: ship from Kyoto on 17 Oct, hand them over in Tokyo on 18 Oct before that counter’s cutoff, or skip shipping and take them in the taxi on the 20th.","להחליט קודם: לשלוח מקיוטו ב-17 באוקטובר, למסור בטוקיו ב-18 באוקטובר לפני שעת הסגירה של הדלפק, או לוותר על המשלוח ולקחת אותן במונית ב-20."),B("Ask the drop-off counter for its exact sending deadline for a 20 Oct Terminal 1 pickup; it varies by counter.","לשאול בדלפק המסירה מה המועד המדויק לאיסוף ב-20 באוקטובר בטרמינל 1; זה משתנה בין דלפקים."),B("Pack for two nights without the big cases, and keep the receipt with the passports.","לארוז לשני לילות בלי המזוודות הגדולות, ולשמור את הקבלה יחד עם הדרכונים.")],
    links:[[B("Yamato airport delivery","משלוח לשדה של ימאטו"),"https://www.kuronekoyamato.co.jp/ytc/en/send/services/airport/"],[B("Narita Airport","שדה התעופה נריטה"),"https://www.narita-airport.jp/en/"]]
  }
];

const delights = [
  { id:"retro", icon:"📼", title:B("1980s Tokyo mode","מצב טוקיו של שנות ה-80"), text:B("A warmer paper palette and small nostalgic touches—use it for the homecoming days.","פלטת נייר חמה יותר ונגיעות נוסטלגיות קטנות — לימים של החזרה הביתה."), action:B("Toggle mode","הפעלת מצב") },
  { id:"stamp", icon:"朱", title:B("Trip stamp book","ספר חותמות מסע"), text:B("Collect one local stamp for each trip segment on this device.","לאסוף חותמת מקומית אחת לכל מקטע בטיול במכשיר הזה."), action:B("Add next stamp","הוספת החותמת הבאה") },
  { id:"print", icon:"紙", title:B("Clean paper backup","גיבוי נייר נקי"), text:B("Print the itinerary view as a low-ink emergency backup.","להדפיס את תצוגת המסלול כגיבוי חירום חסכוני בדיו."), action:B("Print itinerary","הדפסת המסלול") }
];

const sideQuests = [
  {id:"pagoda",icon:"塔",kicker:B("TEMPLE QUEST","משימת מקדש"),title:B("Pagoda + Shinsengumi history","פגודה + היסטוריית שינסנגומי"),text:B("Takahata-Fudō gives you a five-story pagoda, temple grounds, and a genuine samurai-era connection. Keep it optional: the core itinerary already has plenty of temples.","טקהאטה־פודו מציע פגודה בת חמש קומות, מתחם מקדש וקשר אמיתי לתקופת הסמוראים. להשאיר כאופציה: במסלול הראשי כבר יש הרבה מקדשים."),links:[[B("Official Tokyo guide","המדריך הרשמי של טוקיו"),"https://www.gotokyo.org/en/story/walks-and-tours/edo_hino/index.html"],[B("Open map","פתיחת מפה"),"https://www.google.com/maps/search/?api=1&query=Takahata%20Fudoson%20Tokyo"]]},
  {id:"konbini",icon:"🍙",kicker:B("¥1,000 CHAOS","כאוס ב־¥1,000"),title:B("Konbini snack roulette","רולטת חטיפי קונביני"),text:B("Give one person ¥1,000 and five minutes. They must return with one familiar thing, one mystery thing, and one item selected purely by package design.","נותנים לאדם אחד 1,000 ין וחמש דקות. עליו לחזור עם דבר מוכר, דבר מסתורי ופריט אחד שנבחר רק לפי עיצוב האריזה."),secret:"konbini",action:B("Spin the roulette","סיבוב הרולטה")},
  {id:"stamp",icon:"駅",kicker:B("FREE SOUVENIR","מזכרת חינם"),title:B("Eki-stamp field book","פנקס חותמות תחנה"),text:B("Carry a small blank notebook. Look for 駅スタンプ at major stations and tourist desks; stamp only when the queue is short and the ink pad is friendly.","קחו מחברת קטנה וריקה. חפשו 駅スタンプ בתחנות גדולות ובלשכות תיירות; מחתימים רק כשהתור קצר וכרית הדיו ידידותית."),planner:true,action:B("Open the stamp book","פתיחת ספר החותמות")},
  {id:"gacha",icon:"玩",kicker:B("TINY TREASURE","אוצר זעיר"),title:B("Gachapon family draft","דראפט גאצ׳פון משפחתי"),text:B("Each person gets one capsule. No swapping until everyone opens theirs; the funniest pull becomes the trip mascot for 24 hours.","כל אחד מקבל קפסולה אחת. אין החלפות עד שכולם פותחים; השליפה המצחיקה ביותר הופכת לקמע הטיול ל־24 שעות."),links:[[B("Find Gashapon in Tokyo","מציאת גאצ׳פון בטוקיו"),"https://www.google.com/maps/search/?api=1&query=Gashapon%20Department%20Store%20Tokyo"]]},
  {id:"nintendo-museum",icon:"🎮",kicker:B("KYOTO DETOUR · SAME TOWN AS UJI","סטייה בקיוטו · אותה עיר כמו אוג׳י"),title:B("Nintendo Museum, Uji","מוזיאון נינטנדו, אוג׳י"),text:B("Opened 2024 in a former Nintendo plant in Uji—decades of consoles and controllers, hands-on exhibits. Entry is timed and has sold through a lottery/advance system rather than walk-up; check the current booking method well before 14–18 October if this is a must.","נפתח ב-2024 במפעל נינטנדו לשעבר באוג׳י — עשרות שנות קונסולות ובקרים, תערוכות חווייתיות. הכניסה בשעה קבועה ונמכרת בעבר דרך הגרלה/הזמנה מראש ולא ספונטנית; לבדוק את שיטת ההזמנה הנוכחית הרבה לפני 14–18 באוקטובר אם זה חובה."),links:[[B("Open map","פתיחת מפה"),"https://www.google.com/maps/search/?api=1&query=Nintendo%20Museum%20Uji"]]},
  {id:"omihachiman",icon:"⛵",kicker:B("KYOTO DETOUR · ~40 MIN FROM KYOTO","סטייה בקיוטו · ~40 דק׳ מקיוטו"),title:B("Ōmihachiman canal town","עיר התעלות אומיהאצ׳ימאן"),text:B("A preserved Lake Biwa merchant town with a willow-lined canal you can ride in a low wooden boat, plus old warehouse streets with almost no tour-bus crowds. A genuinely different texture from central Kyoto if the Kyoto days feel temple-heavy.","עיר סוחרים משומרת על אגם ביווה עם תעלה מוצלת בערבות שאפשר לשוט בה בסירת עץ נמוכה, לצד רחובות מחסנים עתיקים כמעט בלי אוטובוסי תיירים. מרקם שונה לגמרי ממרכז קיוטו אם הימים בקיוטו מרגישים עתירי מקדשים."),links:[[B("Open map","פתיחת מפה"),"https://www.google.com/maps/search/?api=1&query=Omihachiman%20Canal"]]},
  {id:"unko-museum",icon:"💩",kicker:B("TOKYO DETOUR · CONFIRM IT'S OPEN","סטייה בטוקיו · לאשר שפתוח"),title:B("Unko (Poo) Museum","מוזיאון האנקו (הקקי)"),text:B("Yes, really—a pastel, extremely photogenic pop-up built entirely around a cartoon poop mascot. Kid-appeal is enormous. It's a rotating pop-up rather than a fixed address, so confirm it's currently running in a Tokyo location before planning around it; it would pair naturally with Odaiba after teamLab on 8 Oct.","כן, באמת — פופ־אפ פסטלי וצילומי מאוד, בנוי כולו סביב קמע קקי מצויר. אטרקטיביות ילדים עצומה. זהו פופ־אפ נודד ולא כתובת קבועה, אז לאשר שהוא פעיל כרגע במיקום בטוקיו לפני שמתכננים סביבו; הוא ישתלב טבעי עם אודאיבה אחרי teamLab ב-8 באוקטובר."),links:[[B("Search current location","חיפוש מיקום נוכחי"),"https://www.google.com/search?tbm=isch&q=%E3%81%86%E3%82%93%E3%81%93%E3%83%9F%E3%83%A5%E3%83%BC%E3%82%B8%E3%82%A2%E3%83%A0%20Tokyo"]]},
  {id:"geffen-galleries",icon:"🎨",kicker:B("TOKYO IDEA · FOR GEFFEN — UNCONFIRMED","רעיון בטוקיו · לגפן — לא מאושר"),title:B("Gallery-hopping for Geffen","סיור גלריות לגפן"),text:B("Geffen's own wishlist is still blank, and \"art galleries\" so far is Dad's guess, not her request. Roppongi (Mori Art Museum, National Art Center) and the small commercial galleries around Ginza are the obvious clusters—but ask her what kind of art first before booking anything.","הרשימה של גפן עדיין ריקה, ו\"גלריות אמנות\" עד כה זה ניחוש של אבא, לא בקשה שלה. רופונגי (מוזיאון מורי, המרכז הלאומי לאמנות) והגלריות המסחריות הקטנות סביב גינזה הן האשכולות הברורים — אבל לשאול אותה איזו אמנות מעניינת אותה לפני שמזמינים משהו."),links:[[B("Open map","פתיחת מפה"),"https://www.google.com/maps/search/?api=1&query=Roppongi%20Art%20Triangle%20Tokyo"]]}
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
  { date:"2026-09-26", title:B("Driving documents for 11 Oct","מסמכי נהיגה ל-11 באוקטובר"), text:B("The driver needs the original Israeli licence, the passport and an IDP issued in Israel less than a year before driving. Sort it before you fly.","הנהג צריך רישיון ישראלי מקורי, דרכון ורישיון בינלאומי שהונפק בישראל פחות משנה לפני הנהיגה. לסדר לפני הטיסה.") },
  { date:"2026-09-27", title:B("Visit Japan Web for Gilad","Visit Japan Web לגלעד"), text:B("Register before you land on 29 Sep and save the QR codes offline.","להירשם לפני הנחיתה ב-29 בספטמבר ולשמור את קודי ה-QR אופליין.") },
  { date:"2026-09-28", title:B("You fly tonight: LY075 at 22:45","אתה טס הלילה: LY075 ב-22:45"), text:B("You land at Narita T1 at 16:20 on 29 Sep, then N’EX to Shibuya and Tokyu Stay Aoyama.","נוחתים בנריטה T1 ב-16:20 ב-29 בספטמבר, ומשם N’EX לשיבויה ו-Tokyu Stay Aoyama.") },
  { date:"2026-10-03", title:B("Cancel Kumihimo no Ma by 23:59","לבטל את Kumihimo no Ma עד 23:59"), text:B("Crane Stay replaces it. Check the free-cancellation deadline in Booking.com first.","Crane Stay מחליף אותו. לבדוק קודם ב-Booking.com את מועד הביטול החינמי.") },
  { date:"2026-10-05", title:B("Move to Nakano · family flies tonight","מעבר לנקאנו · המשפחה טסה הלילה"), text:B("Check in to the Nakano apartment, and make sure the Narita taxi has the LY075 flight details.","צ׳ק־אין בדירה בנקאנו, ולוודא שלמונית מנריטה יש את פרטי טיסת LY075.") },
  { date:"2026-10-06", title:B("Family lands at 16:20","המשפחה נוחתת ב-16:20"), text:B("Meet in the public 1F arrivals lobby, then take the private taxi to Nakano.","נפגשים באולם הנחיתות הציבורי בקומה 1, ואז המונית הפרטית לנקאנו.") },
  { date:"2026-10-08", title:B("teamLab Planets at 14:30","teamLab Planets ב-14:30"), text:B("Entry window 14:30–15:00; the QR appears in My Tickets from midnight. Wear trousers that roll up.","חלון כניסה 14:30–15:00; קוד ה-QR מופיע ב-My Tickets מחצות. ללבוש מכנסיים שאפשר לקפל.") },
  { date:"2026-10-11", title:B("Azusa 81 at 09:02 from Shinjuku","אזוסה 81 ב-09:02 משינג׳וקו"), text:B("Then the Toyota at Otsuki at 11:00. Everyone taps an IC card for the fare.","ואז הטויוטה באוצוקי ב-11:00. כל אחד מעביר כרטיס IC לתשלום הנסיעה.") },
  { date:"2026-10-14", title:B("Car back by 11:00 · Hikari 709 at 11:46","הרכב חוזר עד 11:00 · Hikari 709 ב-11:46"), text:B("Refuel before the Mishima return, then Car 6 to Kyoto.","לתדלק לפני ההחזרה במישימה, ואז קרון 6 לקיוטו.") },
  { date:"2026-10-18", title:B("Back to Tokyo","חזרה לטוקיו"), text:B("Check out of Besso by 11:00; Crane Stay from 15:00. Book the Nozomi if you haven’t.","צ׳ק־אאוט מ-Besso עד 11:00; Crane Stay מ-15:00. להזמין נוזומי אם עוד לא.") },
  { date:"2026-10-19", title:B("Your 50th","יום ההולדת ה-50 שלך"), text:B("It’s a Monday: confirm the dinner booking and that the place is open.","זה יום שני: לוודא את הזמנת הארוחה ושהמקום פתוח.") },
  { date:"2026-10-20", title:B("LY076 at 19:35","LY076 ב-19:35"), text:B("Be at Narita T1 by about 16:30.","להיות בנריטה T1 עד 16:30 בערך.") }
];

// Rough minutes after midnight for a slot label, so a day's stops can be put in time order.
const SLOT_MINUTES = [["sunrise",345],["early",480],["late morning",660],["morning",570],["midday",750],["lunch",750],["after teamlab",930],["late afternoon",1020],["afternoon",900],["sunset",1050],["dusk",1050],["before dinner",1080],["dinner",1170],["evening",1140],["all day",600],["any time",720],["after landing",1000]];
function slotMinutes(slot) {
  const text = (typeof slot === "string" ? slot : slot?.en || "").toLowerCase();
  const time = text.match(/(\d{1,2}):(\d{2})/);
  if (time) return Number(time[1]) * 60 + Number(time[2]);
  return SLOT_MINUTES.find(([word]) => text.includes(word))?.[1] ?? 720;
}

// A day's route: base origin and destination, with booked stops, approved options and your own wants in time order.
function selectedRoute(id) {
  const base = dayRoutes[id];
  if (!base) return null;
  const day = days.find(item => item.id === id);
  const timed = [
    ...(day?.booked || []).filter(item => item.q),
    ...(day?.opts || []).filter(option => onMyRoute(option.id) && option.q && !option.offRoute)
  ].sort((a, b) => slotMinutes(a.s) - slotMinutes(b.s)).map(item => item.m ? { q: item.q, m: item.m } : item.q);
  return [base[0], base[1], [...base[2], ...timed], base[3]];
}
// A stop is a map query, or { q, m } where m is how you travel to it (driving, transit, walking); the day's mode is the default.
const LEG_ICON = { driving: "🚗", transit: "🚆", walking: "🚶" };
function routeLinks(route, panel = "") {
  const stop = item => typeof item === "string" ? { q: item } : item;
  const stops=[stop(route[0]),...(route[2]||[]).map(stop),stop(route[1])].filter((p,i,a)=>i===0||p.q!==a[i-1].q);
  const legs=stops.slice(1).map((end,i)=> {
    let mode=end.m||route[3]||'transit';
    if([stops[i].q,end.q].includes('Kadowaki Suspension Bridge') && mode==='transit') mode='walking';
    return external(ROUTE([stops[i].q,end.q,[],mode]),`${LEG_ICON[mode] || ""} ${i+1}. ${esc(stops[i].q)} → ${esc(end.q)}`,'compact');
  }).join('');
  return `<details class="route-legs"${panel ? ` data-panel="route-${panel}"` : ''}><summary>⌖ ${state.lang==='he'?'מפה: המסלול דרך התכנית וההצבעות שלכם':'Map: the route through the plan and your votes'}</summary><p>${state.lang==='he'?'כל קישור פותח קטע אחד, לפי הסדר בכרטיס היום. לבדוק תאריך ואמצעי תחבורה, ולשנות סדר ב-Google Maps אם היום שלכם בנוי אחרת.':'Each link opens one leg, in day-card order. Check the date and mode, and reorder in Google Maps if your day runs differently.'}</p><div class="card-actions" dir="ltr">${legs}</div></details>`;
}

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
  const attrs = ['id','data-segment','data-tag-filter','data-checklist-filter','data-museum-filter','data-check','data-ticket','data-vote','data-verdict','data-secret','data-delight'];
  const attr = attrs.find(a => active?.hasAttribute(a));
  const selector = attr ? '['+attr+'="'+CSS.escape(active.getAttribute(attr))+'"]' : null;
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

let secretFlashTimer;
function flashSecretReveal(glyph) {
  const flashEl = $("#secretFlash");
  if (!flashEl) return;
  const glyphEl = $("#secretFlashGlyph");
  if (glyphEl) glyphEl.textContent = glyph || "秘";
  flashEl.classList.remove("is-active");
  void flashEl.offsetWidth;
  flashEl.classList.add("is-active");
  const reduced = matchMedia('(prefers-reduced-motion: reduce)').matches;
  clearTimeout(secretFlashTimer);
  secretFlashTimer = setTimeout(() => flashEl.classList.remove("is-active"), reduced ? 300 : 900);
  if (audioEngine) {
    const now = audioEngine.ctx.currentTime;
    audioEngine.hat(now, true);
    audioEngine.pluck(880, now, 0, true);
    audioEngine.pluck(1108.73, now + .09, .3);
  }
}

async function triggerSecret(id, revealPanel = false) {
  if (revealPanel) openSecrets();
  markSecret(id);
  flashSecretReveal(secretExperiments.find(item => item.id === id)?.icon);
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
  const ids = sideQuests.map(item => `anytime-${item.id}`);
  const approved = ids.filter(id => state.verdicts[id] === "yes").length;
  const voted = ids.filter(isOpenVote).length;
  const counter = $("#extrasCounter");
  if (counter) counter.textContent = approved || voted
    ? [approved ? `✓ ${approved} ${L(T.inPlan)}` : "", voted ? `${voted} ${L(T.votedOn)}` : ""].filter(Boolean).join(" · ")
    : (he() ? "👍 או 👎 על כל רעיון" : "👍 or 👎 on any idea");
  $("#sideQuestGrid").innerHTML = sideQuests.map(item => {
    const id = `anytime-${item.id}`;
    const verdict = state.verdicts[id];
    const actions = item.links?.map(link => external(link[1], L(link[0]), "compact")).join("") ||
      (item.secret ? `<button class="ghost-button compact" type="button" data-secret="${item.secret}" data-reveal-panel="true">${L(item.action)} <span aria-hidden="true">→</span></button>` :
      `<button class="ghost-button compact" type="button" data-go-planner="true">${L(item.action)} <span aria-hidden="true">→</span></button>`);
    return `<article class="side-quest-card ${verdict === "yes" ? "is-added" : verdict === "no" ? "is-rejected" : ""}"><span class="quest-mark" aria-hidden="true">${verdict === "yes" ? "選" : item.icon}</span><div><p class="eyebrow">${L(item.kicker)}</p><h4>${L(item.title)}</h4><p>${L(item.text)}</p>${voteBar(id)}<div class="card-actions">${actions}</div></div></article>`;
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
  $$("#soundModeSwitch [data-sound-mode]").forEach(btn => btn.setAttribute("aria-pressed", String(btn.dataset.soundMode === state.soundMode)));
  applyTheme();
  renderMe();
}

// The header button shows who this device belongs to; tapping it reopens the chooser.
function renderMe() {
  const me = person(state.me);
  const button = $("#meButton");
  if (!button) return;
  const face = $("#meFace");
  face.hidden = !me;
  if (me) face.src = avatar(me.id);
  $("#meMark").hidden = Boolean(me);
  $("#meName").textContent = me ? L(me.name) : L(T.whoAreYou);
  button.setAttribute("aria-label", me ? `${L(me.name)} · ${L(T.switchPerson)}` : L(T.whoAreYou));
}

function applyTheme() {
  if (state.theme === "auto") delete document.documentElement.dataset.theme;
  else document.documentElement.dataset.theme = state.theme;
  const dark = state.theme === "dark" || (state.theme === "auto" && matchMedia("(prefers-color-scheme: dark)").matches);
  document.querySelector('meta[name="theme-color"]')?.setAttribute("content", dark ? "#12171e" : "#1d2740");
  const button = $("#themeToggle");
  if (button) {
    button.querySelector(".button-label").textContent = L(T.theme);
    button.setAttribute("aria-label", he() ? (dark ? "מעבר לערכה בהירה" : "מעבר לערכה כהה") : (dark ? "Switch to light theme" : "Switch to dark theme"));
  }
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

const TRIP_START = days[0].date;
const TRIP_END = days.at(-1).date;
const TRIP_DAYS = days.length;
let tagFilter = "all";
const he = () => state.lang === "he";
const stripIsolates = text => String(text).replace(/[⁦⁩]/g, "");

function renderStatus() {
  const today = new Date(); today.setHours(0,0,0,0);
  const start = new Date(`${TRIP_START}T00:00:00`);
  const end = new Date(`${TRIP_END}T23:59:59`);
  const range = he() ? "29 בספטמבר–21 באוקטובר 2026" : "29 Sep–21 Oct 2026";
  let label;
  let progress = 0;
  if (today < start) {
    const diff = Math.ceil((start - today) / 86400000);
    label = `<strong>${diff}</strong> ${L(T.daysUntil)} · ${range} · ${TRIP_DAYS} ${he() ? "ימים" : "days"}`;
  } else if (today <= end) {
    const day = Math.floor((today - start) / 86400000) + 1;
    progress = Math.min(100, Math.max(0, day / TRIP_DAYS * 100));
    label = `<strong>${L(T.tripLive)} ${day}/${TRIP_DAYS}</strong> · ${L(T.today)}: ${dateParts(todayISO()).full}`;
  } else {
    progress = 100;
    label = `<strong>${L(T.memoryMode)}</strong> · ${TRIP_DAYS} ${he() ? "ימי מסע" : "trip days"}`;
  }
  $("#statusStrip").innerHTML = `<span>${label}</span><span class="progress-track" role="progressbar" aria-valuemin="0" aria-valuemax="100" aria-valuenow="${Math.round(progress)}" aria-label="${L(T.tripProgress)}"><span class="progress-fill" style="width:${progress}%"></span></span>`;
}

function renderHero() {
  const now = new Date(); now.setHours(0,0,0,0);
  const start = new Date(`${TRIP_START}T00:00:00`);
  const end = new Date(`${TRIP_END}T23:59:59`);
  let number, label, micro;
  if (now < start) {
    number = Math.ceil((start - now) / 86400000);
    label = L(T.daysUntil);
    micro = he() ? "טוקיו · פוג׳י · הקונה · קיוטו · טוקיו" : "Tokyo · Fuji · Hakone · Kyoto · Tokyo";
  } else if (now <= end) {
    number = Math.floor((now - start) / 86400000) + 1;
    label = `${L(T.tripLive)} / ${TRIP_DAYS}`;
    micro = he() ? "היום במסלול שלכם" : "Today in your itinerary";
  } else {
    number = TRIP_DAYS;
    label = L(T.memoryMode);
    micro = he() ? "הערות וחותמות נשמרו במכשיר הזה" : "Notes and stamps remain on this device";
  }
  $("#countdownCard").innerHTML = `<p class="eyebrow">${L(T.countdown)}</p><div><span class="count-number">${number}</span><span class="count-label">${label}</span></div><div class="micro-row">${micro}</div>`;

  const iso = todayISO();
  const next = actions.find(action => action.date >= iso);
  $("#nextActionCard").innerHTML = next ? `
    <div><p class="eyebrow">${L(T.nextAction)} · ${dateParts(next.date).full}</p><h3>${L(next.title)}</h3><p>${L(next.text)}</p></div>
    <button class="primary-button compact" type="button" data-view-target="planner">${he() ? "פתיחת מרכז הפעולות" : "Open action desk"}</button>` : `
    <div><p class="eyebrow">${L(T.nextAction)}</p><h3>${L(T.noUrgentAction)}</h3><p>${he() ? "בדקו את הכרטיסים וההערות שנשמרו." : "Review saved tickets and notes."}</p></div>`;
}

const crowdBars = level => `<span class="meter c${level}" aria-hidden="true"><s></s><s></s><s></s><s></s></span>`;

function renderSegments() {
  $("#segmentTabs").innerHTML = segments.map(segment => `<button class="segment-tab" type="button" data-segment="${segment.id}" aria-pressed="${currentSegment === segment.id}">${L(segment.label)}</button>`).join("");
  $("#legendRow").innerHTML = `<span class="legend-item"><span class="legend-booked" aria-hidden="true"></span>${L(T.booked)}</span><span class="legend-item"><span class="legend-stamp" aria-hidden="true">選</span>${he() ? "בתכנית (גלעד אישר)" : "In the plan (Gilad approved)"}</span><span class="legend-item"><span class="face-legend" aria-hidden="true">👍 👎</span>${he() ? "הפרצופים = מי אהב ומי לא" : "Faces = who liked it and who didn't"}</span><span class="legend-item">${crowdBars(1)}<span aria-hidden="true">→</span>${crowdBars(4)}${L(T.crowd)}</span>`;
}

function renderTagFilters() {
  const chips = [["all", T.allCategories], ...Object.entries(TAGS)];
  $("#tagFilters").setAttribute("aria-label", L(T.filterOptions));
  $("#tagFilters").innerHTML = chips.map(([id, label]) => `<button class="chip" type="button" data-tag-filter="${id}" aria-pressed="${tagFilter === id}">${L(label)}</button>`).join("");
}

function fmtYen(yen) {
  if (yen === null || yen === undefined) return L(T.priceUnknown);
  if (!yen) return L(T.free);
  const n = value => Math.round(value).toLocaleString("en-US");
  return `≈ ¥${n(yen)} · $${n(yen / RATE_USD)} · ₪${n(yen / RATE_ILS)}`;
}
const priceHTML = yen => yen ? `<span class="price" dir="ltr">${fmtYen(yen)}</span>` : `<span class="price">${fmtYen(yen)}</span>`;
const crowdHTML = level => level ? `<span class="crowd" title="${L(T.crowd)} ${level}/4">${crowdBars(level)}${L(CROWD[level])}</span>` : "";
const optLink = (url, label) => `<a class="opt-link" href="${esc(url)}" target="_blank" rel="noreferrer">${label}<span aria-hidden="true"> ↗</span></a>`;

function renderBooked(item) {
  const privateLink = item.privateUrl && !item.privateUrl.includes("••••") ? item.privateUrl : "";
  const link = privateLink || item.url;
  const linkHTML = link ? optLink(link, L(item.urlLabel || T.map)) : item.privateUrl ? `<span>${he() ? "הקישור במייל האישור" : "Link in your confirmation email"}</span>` : "";
  const meta = [item.ref ? copyControl(item.ref) : "", item.paid ? `<span>${L(item.paid)}</span>` : "", linkHTML].filter(Boolean).join('<span class="sep" aria-hidden="true">·</span>');
  return `<li><div class="slot">${L(item.s)}</div><div><h4>${L(item.t)}</h4>${item.d ? `<p>${L(item.d)}</p>` : ""}${meta ? `<p class="ref">${meta}</p>` : ""}</div></li>`;
}

function renderOption(option) {
  const verdict = state.verdicts[option.id];
  const hidden = tagFilter !== "all" && !option.tags.includes(tagFilter);
  const flags = `${option.group ? `<span class="flag pick">${L(T.pickOne)}</span>` : ""}${groupHasConflict(option.group) && verdict === "yes" ? `<span class="flag check">⚠ ${L(T.pickConflict)}</span>` : ""}${option.wish ? `<span class="flag wish">${L(T.fromWishlist)}</span>` : ""}${option.unverified ? `<span class="flag check">${L(T.unverifiedTag)}</span>` : ""}`;
  const tips = option.tips?.length ? `<details class="opt-tips" data-panel="tips-${option.id}"><summary>${L(T.tipsLabel)}</summary><ul>${option.tips.map(tip => `<li>${L(tip)}</li>`).join("")}</ul></details>` : "";
  return `<li class="opt ${verdict === "yes" ? "on" : verdict === "no" ? "no" : ""}" data-opt="${option.id}" ${hidden ? "hidden" : ""}>
    <div class="opt-body">
      <div class="l1">${approvedSeal(option.id)}<span class="slotlab">${L(option.s)}</span><h4>${L(option.t)}</h4>${flags}</div>
      <p>${L(option.d)}</p>
      <div class="facts">${crowdHTML(option.c)}${priceHTML(option.y)}${option.y && option.w ? `<span class="who">${L(option.w)}</span>` : ""}${optLink(MAP(option.q), L(T.map))}${option.b ? optLink(option.b, L(T.bookInfo)) : ""}<span class="tags">${option.tags.map(tag => L(TAGS[tag])).join(", ")}</span></div>
      ${voteBar(option.id)}
      ${tips}
    </div>
  </li>`;
}

const weatherPlace = day => ({ fuji: day.id === "oct11" ? "Fujikawaguchiko" : "Hakone", kyoto: "Kyoto" })[day.segment] || (day.id === "oct21" ? "Tel Aviv" : "Tokyo");

function renderDay(day, index, forceOpen = "") {
  const date = dateParts(day.date);
  const today = todayISO();
  const isOpen = today === day.date || (today < TRIP_START && index === 0) || currentSegment !== "all" || tagFilter !== "all" || forceOpen === day.id;
  const segment = segments.find(item => item.id === day.segment);
  const stay = stays.find(item => item.id === day.stay);
  const stayName = stay ? stay.name : day.id === "oct20" ? L(T.flightHome) : "";
  const photo = day.photo ? `<figure class="day-photo"><img loading="lazy" src="${day.photo.src}" alt="${L(day.photo.alt)}"><figcaption>${L(T.photoCredit)}: <a href="${day.photo.url}" target="_blank" rel="noreferrer">${day.photo.credit}</a></figcaption></figure>` : "";
  const route = selectedRoute(day.id);
  const links = `${route ? `<div class="route-wrap" data-route-for="${day.id}">${routeLinks(route, day.id)}</div>` : ""}${(day.links || []).map(link => external(link[1], `↗ ${L(link[0])}`)).join("")}${external(PHOTOS(photoQueries[day.id] || L(day.title)), `▧ ${L(T.photos)}`)}${external(`https://www.google.com/search?q=${encodeURIComponent(`${weatherPlace(day)} weather`)}`, `☁ ${he() ? "מזג אוויר" : "Weather"}`)}`;
  return `<article class="day-card ${today === day.date ? "is-today" : ""} ${state.completed[day.id] ? "is-complete" : ""} ${day.segment === "solo" ? "is-solo" : ""}" data-day-card="${day.id}">
    <div class="date-marker"><strong>${date.day}</strong><span>${date.month}</span></div>
    <details data-panel="day-${day.id}" class="day-panel" ${isOpen ? "open" : ""}>
      <summary class="day-summary">
        <div><p class="eyebrow">${date.full} · ${L(segment.label)}<span data-day-count="${day.id}">${dayCountHTML(day)}</span></p><h3>${day.icon} ${L(day.title)}</h3><p>${L(day.subtitle)}</p></div>
        <span class="chevron" aria-hidden="true">⌄</span>
      </summary>
      <div class="day-body">
        ${stayName ? `<p class="stay-line">${L(T.sleeping)}: <strong><bdi>${esc(stayName)}</bdi></strong></p>` : ""}
        ${day.note ? `<p class="day-note">${L(day.note)}</p>` : ""}
        ${day.tags?.length ? `<div class="day-strap">${day.tags.map(([key,color]) => `<span class="tag ${color}">${L(T[key] || B(key,key))}</span>`).join("")}</div>` : ""}
        ${photo}
        ${day.booked?.length ? `<ul class="booked-list" aria-label="${L(T.booked)}">${day.booked.map(renderBooked).join("")}</ul>` : ""}
        ${day.schedule?.length ? `<div class="schedule-list">${day.schedule.map(row => `<div class="schedule-row"><div class="schedule-time">${row[0]}</div><div class="schedule-icon" aria-hidden="true">${row[1]}</div><div class="schedule-copy"><h4>${L(row[2])}</h4><p>${L(row[3])}</p></div></div>`).join("")}</div>` : ""}
        ${day.callout ? `<div class="callout ${day.callout[0]}">${L(day.callout[1])}</div>` : ""}
        ${day.opts?.length ? `<ul class="opts">${day.opts.map(renderOption).join("")}</ul>` : ""}
        <div class="day-links">${links}</div>
        <div class="note-area"><label for="note-${day.id}">${L(T.notes)}</label><textarea id="note-${day.id}" data-note="${day.id}" placeholder="${L(T.notePlaceholder)}">${esc(state.notes[day.id] || "")}</textarea></div>
      </div>
    </details>
    <div class="summary-actions day-controls">
      <button class="round-button ${state.favorites[day.id] ? 'is-active' : ''}" type="button" data-favorite="${day.id}" aria-pressed="${Boolean(state.favorites[day.id])}" aria-label="${L(T.favorite)}: ${esc(stripIsolates(L(day.title)))}">★</button>
      <button class="round-button ${state.completed[day.id] ? 'is-active' : ''}" type="button" data-complete="${day.id}" aria-pressed="${Boolean(state.completed[day.id])}" aria-label="${L(T.complete)}: ${esc(stripIsolates(L(day.title)))}">✓</button>
    </div>
  </article>`;
}

function renderTimeline(forceOpen = "") {
  let visible = currentSegment === "all" ? days : days.filter(day => day.segment === currentSegment);
  if (tagFilter !== "all") visible = visible.filter(day => (day.opts || []).some(option => option.tags.includes(tagFilter)));
  $("#timeline").innerHTML = visible.length
    ? visible.map((day, index) => renderDay(day, index, forceOpen)).join("")
    : `<p class="empty-note">${he() ? "אין אפשרויות בקטגוריה הזו במקטע שנבחר." : "No options in this category for the selected segment."}</p>`;
}

// ---------- Family votes ----------
// Every option and side quest by id, for titles and prices wherever a vote shows up.
const OPTION_INDEX = new Map([
  ...days.flatMap(day => (day.opts || []).map(option => [option.id, { day, option, title: option.t, y: option.y }])),
  ...sideQuests.map(quest => [`anytime-${quest.id}`, { day: null, option: null, title: quest.title, y: null }])
]);
// Only known people and values count, whatever arrives from the shared database.
function votesFor(id) {
  const raw = state.votes[id], votes = {};
  if (raw && typeof raw === "object") for (const item of PEOPLE) if (raw[item.id] === "up" || raw[item.id] === "down") votes[item.id] = raw[item.id];
  return votes;
}
const verdictOf = id => state.verdicts[id] === "yes" || state.verdicts[id] === "no" ? state.verdicts[id] : null;
const myVote = id => state.me ? votesFor(id)[state.me] || null : null;
// Voted on, and Gilad hasn't decided yet.
const isOpenVote = id => !verdictOf(id) && Object.keys(votesFor(id)).length > 0;
const onMyRoute = id => verdictOf(id) === "yes" || (!verdictOf(id) && myVote(id) === "up");
const voteTitle = id => stripIsolates(L(OPTION_INDEX.get(id)?.title || ""));
const THUMB = { up: "👍", down: "👎" };

// The faces of everyone who voted one way.
function faces(id, dir) {
  const votes = votesFor(id);
  const voters = PEOPLE.filter(item => votes[item.id] === dir);
  if (!voters.length) return "";
  const label = `${L(dir === "up" ? T.likedBy : T.dislikedBy)}: ${voters.map(item => L(item.name)).join(", ")}`;
  return `<span class="facepile ${dir}" role="img" aria-label="${esc(label)}">${voters.map(item => `<span class="face" title="${esc(L(item.name))}"><img src="${avatar(item.id)}" alt="" width="30" height="30" loading="lazy"></span>`).join("")}</span>`;
}

// 👍 or 👎 with the faces of who pressed it right beside the button.
function thumb(id, dir) {
  const label = `${L(dir === "up" ? T.like : T.dislike)}: ${voteTitle(id)}`;
  return `<span class="thumb-group ${dir}"><button class="thumb-btn ${dir}" type="button" data-vote="${dir}:${id}" aria-pressed="${myVote(id) === dir}" aria-label="${esc(label)}">${THUMB[dir]}</button>${faces(id, dir)}</span>`;
}

// Read-only likes and dislikes, for the plan sheet.
function voteSummary(id) {
  const up = faces(id, "up"), down = faces(id, "down");
  return `${up ? `<span class="thumb-group up"><span class="thumb-mark" aria-hidden="true">👍</span>${up}</span>` : ""}${down ? `<span class="thumb-group down"><span class="thumb-mark" aria-hidden="true">👎</span>${down}</span>` : ""}`;
}

// Two phones approving different "pick one" choices while offline can leave both approved; flag it instead of guessing which wins.
const groupHasConflict = group => group && [...OPTION_INDEX.values()].filter(entry => entry.option?.group === group && verdictOf(entry.option.id) === "yes").length > 1;

// The red 選 seal marks what Gilad approved.
const approvedSeal = id => verdictOf(id) === "yes" ? `<span class="seal" role="img" aria-label="${esc(L(T.inPlan))}" title="${esc(L(T.inPlan))}">選</span>` : "";

// Gilad's approve and reject buttons. `where` keeps focus targets unique between the card and the plan sheet.
function judgeButtons(id, where = "card") {
  if (state.me !== "gilad") return "";
  const verdict = verdictOf(id), title = voteTitle(id);
  return `<span class="judge" role="group" aria-label="${esc(L(T.giladDecides))}"><button class="judge-btn yes" type="button" data-verdict="yes:${id}:${where}" aria-pressed="${verdict === "yes"}" aria-label="${esc(`${L(T.approve)}: ${title}`)}">✓</button><button class="judge-btn no" type="button" data-verdict="no:${id}:${where}" aria-pressed="${verdict === "no"}" aria-label="${esc(`${L(T.reject)}: ${title}`)}">✗</button></span>`;
}

function voteBar(id) {
  return `<div class="vote-bar">${thumb(id, "up")}${thumb(id, "down")}${judgeButtons(id)}</div>`;
}

function dayCountHTML(day) {
  const approved = (day.opts || []).filter(option => verdictOf(option.id) === "yes").length;
  return approved ? ` · <span class="pick-count">${approved} 選</span>` : "";
}

// Set or clear one value under votes/ or verdicts/ in this device's copy.
function writePath(segments, value) {
  if (segments.some(key => key === "__proto__" || key === "constructor" || key === "prototype")) return;
  const [top, ...rest] = segments;
  if (!top) {
    const data = value && typeof value === "object" ? value : {};
    state.votes = data.votes && typeof data.votes === "object" ? data.votes : {};
    state.verdicts = data.verdicts && typeof data.verdicts === "object" ? data.verdicts : {};
    return;
  }
  if (top !== "votes" && top !== "verdicts") return;
  if (!rest.length) { state[top] = value && typeof value === "object" ? value : {}; return; }
  let node = state[top];
  for (const key of rest.slice(0, -1)) {
    if (!node[key] || typeof node[key] !== "object") node[key] = {};
    node = node[key];
  }
  const last = rest[rest.length - 1];
  if (value === null || value === undefined) delete node[last]; else node[last] = value;
  if (top === "votes" && rest.length > 1 && state.votes[rest[0]] && !Object.keys(state.votes[rest[0]]).length) delete state.votes[rest[0]];
}

let syncStatus = SYNC_URL ? "connecting" : "local";
let syncSource = null, syncRetry, refreshTimer, flushing = false, flushRetry, flushDelay = 5000;
function syncLabel() {
  const label = L({ local: T.syncLocal, connecting: T.syncConnecting, live: T.syncLive, offline: T.syncOffline }[syncStatus]);
  const pending = SYNC_URL && syncStatus !== "live" ? state.outbox.length : 0;
  if (!pending) return label;
  return `${label} ${he() ? (pending === 1 ? "שינוי אחד ממתין לשליחה." : `${pending} שינויים ממתינים לשליחה.`) : `${pending} ${pending === 1 ? "change is" : "changes are"} waiting to send.`}`;
}
function setSyncStatus(next) {
  if (syncStatus === next) return;
  syncStatus = next;
  renderPlanDock();
  if ($("#planDialog").open) renderPlanDialog();
}

// Queue a change for the shared database; the newest change to a path replaces an older unsent one.
// Without SYNC_URL the queue waits, so votes cast before sync is switched on still reach everyone.
function queueWrite(path, value) {
  state.outbox = state.outbox.filter(item => item.path !== path);
  state.outbox.push({ path, value });
  persist();
  flushOutbox();
}

async function flushOutbox() {
  if (!SYNC_URL || flushing || !state.outbox.length || navigator.onLine === false) return;
  flushing = true;
  try {
    while (state.outbox.length) {
      const item = state.outbox[0];
      const url = `${SYNC_URL}/${SYNC_ROOT}/${item.path.split("/").map(encodeURIComponent).join("/")}.json`;
      const response = await fetch(url, item.value === null ? { method: "DELETE" } : { method: "PUT", body: JSON.stringify(item.value) });
      if (response.status >= 500) throw new Error(String(response.status));
      if (!response.ok) showToast(he() ? "השרת לא קיבל את ההצבעה" : "The server didn't accept that vote");
      state.outbox = state.outbox.filter(entry => entry !== item);
      persist();
    }
    flushDelay = 5000;
    renderPlanDock();
  } catch {
    // Server hiccup or dropped connection: try again on our own, backing off to two minutes.
    setSyncStatus("offline");
    renderPlanDock();
    clearTimeout(flushRetry);
    flushRetry = setTimeout(flushOutbox, flushDelay);
    flushDelay = Math.min(flushDelay * 2, 120000);
  } finally {
    flushing = false;
  }
}

// Stream the shared votes. Firebase sends the whole tree first (a "put" at "/"), then each change.
function startSync() {
  if (!SYNC_URL || typeof EventSource !== "function") return;
  clearTimeout(syncRetry);
  syncSource?.close();
  setSyncStatus("connecting");
  const source = syncSource = new EventSource(`${SYNC_URL}/${SYNC_ROOT}.json`);
  const onData = event => {
    let message;
    try { message = JSON.parse(event.data); } catch { return; }
    if (message && typeof message.path === "string") applyRemote(message.path, message.data, event.type === "patch");
  };
  source.addEventListener("put", onData);
  source.addEventListener("patch", onData);
  source.addEventListener("open", () => { setSyncStatus("live"); flushOutbox(); });
  source.addEventListener("cancel", () => { source.close(); setSyncStatus("offline"); });
  source.addEventListener("error", () => {
    if (source.readyState === 2) { setSyncStatus("offline"); syncRetry = setTimeout(startSync, 15000); }
    else setSyncStatus(navigator.onLine === false ? "offline" : "connecting");
  });
}

function applyRemote(path, data, isPatch) {
  const segments = path.split("/").filter(Boolean);
  const changes = isPatch && data && typeof data === "object"
    ? Object.entries(data).map(([key, value]) => [[...segments, ...key.split("/").filter(Boolean)], value])
    : [[segments, data]];
  for (const [parts, value] of changes) { announce(parts, value); writePath(parts, value); }
  // Unsent changes from this device stay on top until the server has them.
  for (const item of state.outbox) writePath(item.path.split("/"), item.value);
  setSyncStatus("live");
  persist();
  clearTimeout(refreshTimer);
  refreshTimer = setTimeout(refreshVotes, 120);
}

// A short toast when someone else votes or Gilad approves. The first full load stays quiet.
function announce(parts, value) {
  if (parts.length === 3 && parts[0] === "votes" && THUMB[value] && parts[2] !== state.me && state.votes[parts[1]]?.[parts[2]] !== value) {
    const who = person(parts[2]), entry = OPTION_INDEX.get(parts[1]);
    if (who && entry) showToast(`${THUMB[value]} ${L(who.name)}: ${stripIsolates(L(entry.title))}`);
  }
  if (parts.length === 2 && parts[0] === "verdicts" && value === "yes" && state.me !== "gilad" && state.verdicts[parts[1]] !== "yes") {
    const entry = OPTION_INDEX.get(parts[1]);
    if (entry) showToast(`${he() ? "אושר ע״י גלעד" : "Gilad approved"}: ${stripIsolates(L(entry.title))}`);
  }
}

// Redraw everything that shows votes without rebuilding the page, so a note being typed stays put.
function refreshVotes() {
  preserveUI(() => {
    $$("#timeline .opt[data-opt]").forEach(item => {
      const option = OPTION_INDEX.get(item.dataset.opt)?.option;
      if (option) item.outerHTML = renderOption(option);
    });
    renderSideQuests();
    for (const day of days) {
      const count = document.querySelector(`[data-day-count="${day.id}"]`);
      if (count) count.innerHTML = dayCountHTML(day);
      const wrap = document.querySelector(`[data-route-for="${day.id}"]`);
      const route = wrap && selectedRoute(day.id);
      if (route) wrap.innerHTML = routeLinks(route, day.id);
    }
    renderPlanDock();
    if ($("#planDialog").open) renderPlanDialog();
  });
  renderMaps();
}

function castVote(id, dir) {
  if (!state.me) { openWho(); return; }
  const next = myVote(id) === dir ? null : dir;
  const path = `votes/${id}/${state.me}`;
  writePath(path.split("/"), next);
  queueWrite(path, next);
  refreshVotes();
  if (next && !matchMedia("(prefers-reduced-motion: reduce)").matches) $$(`.thumb-btn[data-vote="${next}:${id}"]`).forEach(button => button.classList.add("pop"));
}

function setVerdict(id, value) {
  if (state.me !== "gilad") return;
  if (!state.approver) { openCode(() => setVerdict(id, value)); return; }
  const next = verdictOf(id) === value ? null : value;
  writePath(["verdicts", id], next);
  queueWrite(`verdicts/${id}`, next);
  // A "pick one" day keeps a single approved choice.
  const group = OPTION_INDEX.get(id)?.option?.group;
  if (next === "yes" && group) for (const [otherId, entry] of OPTION_INDEX) {
    if (otherId === id || entry.option?.group !== group || verdictOf(otherId) !== "yes") continue;
    writePath(["verdicts", otherId], null);
    queueWrite(`verdicts/${otherId}`, null);
  }
  refreshVotes();
  if (next === "yes") { flashSecretReveal("選"); showToast(he() ? "אושר לתכנית" : "Approved into the plan"); }
}

// Picks saved before people had faces become this person's "want" votes, once.
function adoptPicks() {
  if (!state.me || !state.picks) return;
  for (const id of Object.keys(state.picks)) {
    if (!state.picks[id] || !OPTION_INDEX.has(id) || myVote(id)) continue;
    writePath(["votes", id, state.me], "up");
    queueWrite(`votes/${id}/${state.me}`, "up");
  }
  delete state.picks;
  persist();
}

const planEntries = keep => [...OPTION_INDEX].filter(([id]) => keep(id)).map(([id, entry]) => ({ id, ...entry }));
const planTotal = entries => entries.reduce((sum, entry) => sum + (entry.y || 0), 0);
const voteScore = id => Object.values(votesFor(id)).reduce((sum, value) => sum + (value === "up" ? 1 : -1), 0);

function renderPlanDock() {
  const me = person(state.me);
  const approved = planEntries(id => verdictOf(id) === "yes");
  const waiting = planEntries(isOpenVote);
  const counts = [approved.length ? `<b>✓ ${approved.length} ${L(T.inPlan)}</b>` : "", waiting.length ? `${waiting.length} ${L(T.votedOn)}` : ""].filter(Boolean).join(" · ");
  const summary = counts ? `${counts}${approved.length ? `<br><span dir="ltr">${fmtYen(planTotal(approved))}</span>` : ""}` : L(T.noPicks);
  const meButton = `<button class="dock-me sync-${syncStatus}" type="button" data-who-open="true" aria-label="${esc(`${me ? L(me.name) : L(T.whoAreYou)} · ${syncLabel()}`)}" title="${esc(syncLabel())}">${me ? `<img src="${avatar(me.id)}" alt="" width="40" height="40">` : `<span aria-hidden="true">誰</span>`}</button>`;
  const label = state.me === "gilad" && waiting.length ? `${L(T.reviewPlan)} · ${waiting.length}` : L(T.planShort);
  $("#planDock").innerHTML = `<div class="dock-in">${meButton}<div class="sum" aria-live="polite">${summary}</div><button type="button" class="dock-button" data-open-plan="true">${label}</button></div>`;
}

function planRow(entry, controls, showDay) {
  const when = showDay ? `<span class="plan-when">${entry.day ? dateParts(entry.day.date).full : L(T.anytime)}</span> ` : "";
  const slot = entry.option ? `<span class="slotlab">${L(entry.option.s)}</span> ` : "";
  return `<li><span class="plan-item">${when}${slot}${L(entry.title)}${entry.y ? ` <span class="price" dir="ltr">${fmtYen(entry.y)}</span>` : ""}${voteSummary(entry.id)}</span>${controls}</li>`;
}

function renderPlanDialog() {
  const gilad = state.me === "gilad";
  const approved = planEntries(id => verdictOf(id) === "yes");
  const waiting = planEntries(isOpenVote).sort((a, b) => voteScore(b.id) - voteScore(a.id));
  const rejected = planEntries(id => verdictOf(id) === "no");
  const unknown = approved.some(entry => entry.option && entry.y === null);
  $("#planTitle").textContent = L(T.yourPlan);
  const conflicts = [...new Set(approved.map(entry => entry.option?.group).filter(groupHasConflict))];
  const conflictNote = conflicts.length ? `<span class="plan-conflict">⚠ ${conflicts.map(group => { const day = days.find(item => (item.opts || []).some(option => option.group === group)); return day ? `${dateParts(day.date).full}: ${L(T.pickConflict)}` : L(T.pickConflict); }).join(" · ")}</span>` : "";
  $("#planSummary").innerHTML = `${conflictNote}${approved.length ? `✓ ${approved.length} ${L(T.inPlan)} · <span dir="ltr">${fmtYen(planTotal(approved))}</span> ${he() ? "מעבר למה שכבר הוזמן" : "on top of what’s booked"}${unknown ? ` · ${he() ? "חלק מהמחירים לא נבדקו" : "some prices not checked"}` : ""}` : L(T.planEmpty)}<span class="sync-line sync-${syncStatus}">${syncLabel()}</span>`;
  const undo = (entry, value) => gilad ? `<button class="plan-remove" type="button" data-verdict="${value}:${entry.id}:plan" aria-label="${esc(`${L(T.undoVerdict)}: ${voteTitle(entry.id)}`)}">↺</button>` : "";
  const groups = [...days, null].map(day => ({ day, items: approved.filter(entry => entry.day === day) })).filter(group => group.items.length);
  const approvedHTML = groups.length
    ? groups.map(group => `<h4>${group.day ? `${dateParts(group.day.date).full} · ${L(group.day.title)}` : L(T.anytime)}</h4><ul>${group.items.map(entry => planRow(entry, undo(entry, "yes"), false)).join("")}</ul>`).join("")
    : `<p class="empty-note">${L(T.planEmpty)}</p>`;
  const waitingHTML = waiting.length ? `<ul>${waiting.map(entry => planRow(entry, judgeButtons(entry.id, "plan"), true)).join("")}</ul>` : `<p class="empty-note">${L(T.noVotes)}</p>`;
  const rejectedHTML = rejected.length ? `<details class="plan-rejected" data-panel="plan-rejected"><summary>${L(T.notThisTime)} · ${rejected.length}</summary><ul>${rejected.map(entry => planRow(entry, undo(entry, "no"), true)).join("")}</ul></details>` : "";
  const waitingSection = `<h3 class="plan-sec">👍 👎 ${L(T.votesSection)} · ${waiting.length}</h3>${waitingHTML}`;
  const approvedSection = `<h3 class="plan-sec">✓ ${L(T.inPlan)} · ${approved.length}</h3>${approvedHTML}`;
  // Gilad sees his queue first; everyone else sees the agreed plan first.
  $("#planBody").innerHTML = (gilad ? waitingSection + approvedSection : approvedSection + waitingSection) + rejectedHTML;
  $("#planCopy").textContent = L(T.copyPlan);
  $("#planShare").textContent = L(T.sharePlan);
  $("#planPrint").textContent = L(T.printPlan);
  $("#planWho").textContent = L(T.switchPerson);
  $("#planClose").setAttribute("aria-label", L(T.close));
}

function planText() {
  const approved = planEntries(id => verdictOf(id) === "yes");
  const lines = [he() ? "התכנית ליפן, 29 בספטמבר–21 באוקטובר" : "Japan plan, 29 Sep–21 Oct"];
  for (const day of days) {
    const chosen = approved.filter(entry => entry.day === day);
    const booked = day.booked || [];
    if (!chosen.length && !booked.length) continue;
    lines.push("", `${dateParts(day.date).full}: ${L(day.title)}`);
    booked.forEach(item => lines.push(`  [${L(T.booked)}] ${L(item.s)} ${L(item.t)}`));
    chosen.forEach(entry => lines.push(`  ${L(entry.option.s)} ${L(entry.title)}${entry.y ? ` (${fmtYen(entry.y)})` : ""}`));
  }
  const anytime = approved.filter(entry => !entry.day);
  if (anytime.length) { lines.push("", L(T.anytime)); anytime.forEach(entry => lines.push(`  ${L(entry.title)}`)); }
  lines.push("", `${he() ? "סך האפשרויות" : "Options total"}: ${fmtYen(planTotal(approved))}`);
  return stripIsolates(lines.join("\n"));
}

async function sharePlan() {
  const text = planText();
  if (navigator.share) {
    try { await navigator.share({ title: L(T.yourPlan), text }); return; }
    catch (error) { if (error?.name === "AbortError") return; }
  }
  copyText(text, he() ? "התכנית הועתקה" : "Plan copied");
}

function printPlan() {
  const box = $("#planPrintArea");
  box.innerHTML = `<h1>${L(T.yourPlan)}</h1><p>${$("#planSummary").innerHTML}</p>${$("#planBody").innerHTML}`;
  document.body.classList.add("printing-plan");
  window.addEventListener("afterprint", () => document.body.classList.remove("printing-plan"), { once: true });
  window.print();
}

// ---------- Who are you? ----------
let whoCloseTimer;
function renderWho() {
  $("#whoSpots").innerHTML = PEOPLE.map((item, index) => `<button class="who-spot${state.me === item.id ? " is-me" : ""}" type="button" data-who="${item.id}" style="left:${item.x}%;top:${item.y}%;width:${item.d}%;animation-delay:${(index * .35).toFixed(2)}s" aria-label="${esc(`${item.name.he} · ${item.name.en}`)}"><span class="who-name"><bdi>${esc(L(item.name))}</bdi></span></button>`).join("")
    + `<button class="who-duck" type="button" data-duck="true" aria-label="${he() ? "ברווז הגומי" : "The rubber duck"}"></button>`;
  $("#whoClose").hidden = !state.me;
  $("#whoHello").textContent = "";
  $("#whoPhoto").classList.remove("has-pick");
}

function openWho() {
  clearTimeout(whoCloseTimer);
  renderWho();
  if (!$("#whoDialog").open) $("#whoDialog").showModal();
}

function choosePerson(id) {
  const chosen = person(id);
  if (!chosen) return;
  const changed = state.me !== id;
  state.me = id;
  if (id !== "gilad") state.approver = false;
  persist();
  adoptPicks();
  $("#whoPhoto").classList.add("has-pick");
  $$("#whoSpots .who-spot").forEach(spot => spot.classList.toggle("picked", spot.dataset.who === id));
  const hello = id === "gilad"
    ? (he() ? "היי גלעד! ההחלטה הסופית שלך 👑" : "Hi Gilad! The final say is yours 👑")
    : (he() ? `היי ${L(chosen.name)}! 👋` : `Hi ${L(chosen.name)}! 👋`);
  $("#whoHello").innerHTML = `<img src="${avatar(id)}" alt="" width="44" height="44"> <span>${esc(hello)}</span>`;
  clearTimeout(whoCloseTimer);
  whoCloseTimer = setTimeout(() => { if ($("#whoDialog").open) $("#whoDialog").close(); }, matchMedia("(prefers-reduced-motion: reduce)").matches ? 500 : 1400);
  renderMe();
  if (changed) refreshVotes();
}

function quack(button) {
  button.classList.remove("wobble");
  void button.offsetWidth;
  button.classList.add("wobble");
  $("#whoHello").textContent = he() ? "גא־גא! 🦆 לברווז אין זכות הצבעה." : "Quack! 🦆 The duck doesn't get a vote.";
}

// ---------- Gilad's approval code ----------
let codeThen = null;
// Hex constants on purpose: the release build masks long decimal numbers as possible booking codes.
function codeHash(text) {
  let h1 = 0xdeadbeef, h2 = 0x41c6ce57;
  for (const char of `horn-2026:${text}`) {
    const code = char.charCodeAt(0);
    h1 = Math.imul(h1 ^ code, 0x9e3779b1);
    h2 = Math.imul(h2 ^ code, 0x5f356495);
  }
  h1 = Math.imul(h1 ^ (h1 >>> 16), 0x85ebca6b) ^ Math.imul(h2 ^ (h2 >>> 13), 0xc2b2ae35);
  h2 = Math.imul(h2 ^ (h2 >>> 16), 0x85ebca6b) ^ Math.imul(h1 ^ (h1 >>> 13), 0xc2b2ae35);
  return `h${(h2 >>> 0).toString(16).padStart(8, "0")}${(h1 >>> 0).toString(16).padStart(8, "0")}`;
}

function openCode(then) {
  codeThen = then;
  $("#codeTitle").textContent = he() ? "הקוד של גלעד" : "Gilad’s code";
  $("#codeIntro").textContent = he() ? "אישור ודחייה דורשים את הקוד בן 4 הספרות של גלעד, פעם אחת במכשיר הזה." : "Approving and rejecting needs Gilad’s 4-digit code, once on this device.";
  $("#codeSubmit").textContent = he() ? "פתיחה" : "Unlock";
  $("#codeCancel").textContent = he() ? "ביטול" : "Cancel";
  $("#codeInput").setAttribute("aria-label", he() ? "קוד בן 4 ספרות" : "4-digit code");
  $("#codeInput").value = "";
  $("#codeInput").removeAttribute("aria-invalid");
  $("#codeError").textContent = "";
  $("#codeDialog").showModal();
  $("#codeInput").focus();
}

// The trip script loads while the app is still hidden behind the password; wait until it shows.
function whenAppVisible(run) {
  const app = $("#tripApplication");
  if (!app?.hidden || typeof MutationObserver !== "function") { run(); return; }
  const observer = new MutationObserver(() => { if (!app.hidden && !app.inert) { observer.disconnect(); run(); } });
  observer.observe(app, { attributes: true, attributeFilter: ["hidden", "inert"] });
}

function copyControl(value) {
  if(String(value).includes('••••')) return '<span>' + (state.lang === 'he' ? 'הקוד באישור ההזמנה' : 'Code in your booking confirmation') + '</span>';
  return `<span class="copy-line"><bdi>${value}</bdi><button class="copy-mini" type="button" data-copy="${value}" aria-label="${L(T.copiedNumber)}">⧉</button></span>`;
}

function renderStays() {
  const cancelled = Boolean(state.checks["action-cancel-kumihimo"]);
  $("#stayDecision").innerHTML = `<section class="decision-box cancel-box ${cancelled ? "is-done" : ""}">
    <p class="eyebrow">${cancelled ? (he() ? "בוטל" : "CANCELLED") : (he() ? `לבטל עד ${dateParts(cancelStay.deadline).full}` : `CANCEL BY ${dateParts(cancelStay.deadline).full}`)}</p>
    <h3><bdi>${cancelStay.name}</bdi></h3><p>${L(cancelStay.text)}</p>
    <div class="card-actions">${copyControl(cancelStay.confirmation)}${external("https://secure.booking.com/myreservations.html", "Booking.com", "compact")}<label class="cancel-check"><input type="checkbox" data-check="action-cancel-kumihimo" ${cancelled ? "checked" : ""}> ${he() ? "סימנתי שבוטל" : "Marked cancelled"}</label></div>
  </section>`;
  const inBooking = `<span>${he() ? "בהזמנה שלך" : "In your booking"}</span>`;
  $("#staysGrid").innerHTML = stays.map(stay => `<article class="data-card stay-card">
    <div class="card-topline"><div><span class="card-kicker">${L(stay.status)}</span><h3><bdi>${stay.name}</bdi></h3><p>${L(stay.dates)}</p></div><span class="icon-chip" aria-hidden="true">${stay.icon}</span></div>
    <dl class="detail-list"><dt>${L(T.address)}</dt><dd>${L(stay.address)}</dd><dt>${L(T.station)}</dt><dd>${L(stay.station)}</dd><dt>${L(T.confirmation)}</dt><dd>${stay.confirmation ? copyControl(stay.confirmation) : inBooking}</dd>${stay.phone ? `<dt>${he() ? "טלפון" : "Phone"}</dt><dd><bdi>${stay.phone}</bdi></dd>` : ""}</dl>
    <p class="lead"><strong>${he() ? "הגעה: " : "Arrival: "}</strong>${L(stay.route)}</p>
    <p><strong>${L(T.luggage)}:</strong> ${L(stay.luggage)}</p>
    ${stay.parking ? `<p><strong>${he() ? "חניה" : "Parking"}:</strong> ${L(stay.parking)}</p>` : ""}
    <div class="card-actions">${external(stay.map, `⌖ ${L(T.map)}`, "primary")}${external(DIR(typeof stay.address === "string" ? stay.address : stay.name), he() ? "מסלול הגעה" : "Directions")}${external(PHOTOS(stay.name), L(T.photos))}${external("https://secure.booking.com/myreservations.html", "Booking.com")}</div>
    <div class="deadline-strip">${L(T.cancellation)} · ${L(stay.cancellation)}</div>
  </article>`).join("");
}

function renderFlights() {
  $("#flightsGrid").innerHTML = flights.map(flight => `<article class="data-card flight-card">
    <span class="card-kicker">${L(flight.tag)} · ${L(flight.date)}</span><h3>${flight.flight}</h3>
    <div class="flight-route"><span class="airport">${flight.from}</span><span class="route-line"></span><span class="airport">${flight.to}</span></div>
    <div class="flight-time"><strong>${flight.times.split("→")[0]}</strong><strong>${flight.times.split("→")[1]}</strong></div>
    <dl class="detail-list"><dt>PNR</dt><dd>${copyControl(flight.pnr)}${flight.pnr2 ? ` ${copyControl(flight.pnr2)}` : ""}</dd><dt>${L(T.seat)}</dt><dd>${L(flight.seat)}</dd><dt>${he() ? "טרמינל" : "Terminal"}</dt><dd>${L(flight.terminal)}</dd></dl>
    <div class="card-actions">${external("https://www.elal.com/Checkin/Home/new_Identification/b?language=eng", he() ? "צ׳ק־אין אל על" : "EL AL check-in", "primary")}${external("https://www.narita-airport.jp/en/company/media-center/publications-pamphlets/kannaimap/", he() ? "מפת T1" : "T1 map")}</div>
  </article>`).join("");
  const taxi = days.find(day => day.id === "oct06").booked.find(item => item.id === "narita-taxi");
  $("#airportReunion").innerHTML = `<article class="airport-reunion data-card">
    <div class="card-topline"><div><span class="card-kicker">6 OCT · NARITA TERMINAL 1</span><h3>${he() ? "כרטיס מפגש בשדה התעופה" : "Airport reunion card"}</h3><p class="lead">${he() ? "גלעד יוצא מנקאנו בערך ב-13:30 וממתין באולם מקבלי הפנים הציבורי בקומה 1, אחרי בדיקת הטיסה החיה ואגף הנחיתה." : "Gilad leaves Nakano around 13:30 and waits in the public 1F International Arrivals lobby, after checking the live flight and arrival wing."}</p></div><span class="icon-chip" aria-hidden="true">👋</span></div>
    <div class="reunion-steps">
      <div><strong>1 · ${he() ? "המשפחה" : "Family"}</strong><span>${he() ? "הגירה ← מזוודות ← מכס ← אולם ציבורי. אם גלעד לא נראה, לא עוזבים את הטרמינל: נפגשים בדלפק מידע ומשתפים מיקום חי." : "Immigration → baggage → customs → public hall. If Gilad isn’t visible, stay in the terminal: regroup at an Information counter and share live location."}</span></div>
      <div><strong>2 · ${he() ? "הנהג" : "Driver"}</strong><span>${he() ? "המונית הפרטית לנקאנו, כ-90 דקות. נקודת המפגש המדויקת ודרך יצירת הקשר עם הנהג נמצאות בשובר של Booking.com." : "The private taxi to Nakano, about 90 minutes. The exact meeting point and driver contact are in the Booking.com voucher."}</span></div>
      <div><strong>3 · ${he() ? "עיכוב" : "Delay"}</strong><span>${he() ? "אם הטיסה מתעכבת, גלעד מעדכן את הנהג לפי פרטי השובר. אחרי 20 דקות מהנחיתה בפועל ללא קשר, מתקשרים לספק." : "If the flight is delayed, Gilad updates the driver using the voucher contact. If there’s no contact 20 minutes after the actual landing, call the provider."}</span></div>
    </div>
    <div class="card-actions">${external("https://www.narita-airport.jp/en/company/media-center/publications-pamphlets/kannaimap/", he() ? "מפת טרמינל 1" : "Terminal 1 map", "primary")}${external("https://secure.booking.com/myreservations.html", he() ? "פתיחת Booking.com Trips" : "Open Booking.com Trips")}${copyControl(taxi.ref)}</div>
  </article>`;
}

function renderRailBookingDesk() {
  $("#railBookingDesk").innerHTML = `
    <div class="section-label"><span>${L(B("Which app buys what", "איזו אפליקציה קונה מה"))}</span></div>
    <section class="rail-help-hero" aria-labelledby="rail-help-title">
      <div class="rail-help-heading"><span class="rail-signal" aria-hidden="true">乗</span><div><p class="eyebrow">${L(B("THERE IS NO ONE JAPAN TICKET APP", "אין אפליקציה יפנית אחת להכול"))}</p><h3 id="rail-help-title">${L(B("Plan in one place. Buy in the right one.", "מתכננים במקום אחד. קונים במקום הנכון."))}</h3><p>${L(B("Japan’s tickets split by operator and service type. These cards say exactly where to pay, and what each tool can’t sell.", "הכרטיסים ביפן מתחלקים לפי מפעיל וסוג שירות. הכרטיסים שלמטה אומרים בדיוק היכן לשלם, ומה כל כלי לא יכול למכור."))}</p></div></div>
      <div class="booking-channel-grid">${bookingChannels.map(channel => `<article class="booking-channel"><span class="booking-channel-icon" aria-hidden="true">${channel.icon}</span><p class="card-kicker">${L(channel.title)}</p><h4>${L(channel.tool)}</h4><p>${L(channel.use)}</p><strong class="not-for">${L(channel.notFor)}</strong><div class="card-actions">${channel.links.map(link => external(link[1], L(link[0]), "compact")).join("")}</div></article>`).join("")}</div>
    </section>`;
}

function renderCarDays() {
  const car = transits.find(item => item.id === "toyota");
  const legs = [["Otsuki Station", STAY_Q.miuraya], [STAY_Q.miuraya, STAY_Q.villa], [STAY_Q.villa, "Toyota Rent a Car Mishima Shinkansen"]];
  const legNames = he() ? ["אוצוקי ← מיאוראיה", "מיאוראיה ← הווילה בהקונה", "הווילה ← מישימה"] : ["Otsuki → Miuraya", "Miuraya → Hakone villa", "Villa → Mishima"];
  $("#carDays").innerHTML = `
    <div class="section-label"><span>${L(B("Car days · 11–14 Oct", "ימי הרכב · 11–14 באוקטובר"))}</span></div>
    <section class="car-card" aria-labelledby="car-title">
      <div class="car-copy"><p class="eyebrow">${L(car.reservation)}</p><h3 id="car-title">${L(car.route)}</h3><p>${L(car.window)} · ${L(car.fare)}</p>
        <ul class="car-rules"><li>${L(B("Every driver: the original Israeli licence, the passport, and an IDP issued in Israel less than a year before driving.", "כל נהג: רישיון ישראלי מקורי, דרכון ורישיון בינלאומי שהונפק בישראל פחות משנה לפני הנהיגה."))}</li><li>${L(B("Drive on the left; expect narrow roads and Sports Day traffic on 12 Oct.", "נהיגה בצד שמאל; לצפות לכבישים צרים ולפקקי יום הספורט ב-12 באוקטובר."))}</li><li>${L(B("Refuel and photograph the fuel gauge before the 11:00 return at Mishima; Hikari 709 leaves at 11:46.", "לתדלק ולצלם את מד הדלק לפני ההחזרה ב-11:00 במישימה; Hikari 709 יוצאת ב-11:46."))}</li></ul>
      </div>
      <div class="car-legs">${legs.map((leg, index) => external(ROUTE([leg[0], leg[1], [], "driving"]), `${index + 1}. ${legNames[index]}`, "compact")).join("")}</div>
      <div class="card-actions">${external(car.buy, "Toyota Rent a Car", "primary")}${external("https://embassies.gov.il/japan/he/announcements/international-driving-permit", he() ? "דרישות רישיון לישראלים" : "Israeli IDP requirements")}</div>
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
  $("#mapHero").innerHTML = `<div class="map-hero-copy"><p class="eyebrow">TOKYO → FUJI → HAKONE → KYOTO → TOKYO</p><h3>${he() ? "מפה אחת למסע. קישור לכל החלטה." : "One journey map. A link for every decision."}</h3><p>${he() ? "הכרטיסים פותחים חיפוש או מסלול ב-Google Maps רק בלחיצה. מסלולי הימים עוברים דרך מה שבחרתם." : "Cards open a search or route in Google Maps only when tapped. Each day’s route runs through what you’ve picked."}</p>${external(MAP("Tokyo Fuji Hakone Kyoto"), he() ? "פתיחת מבט המסע" : "Open journey overview", "")}</div><div class="map-art" aria-hidden="true"><span class="route-path"></span><span class="route-stop tokyo"></span><span class="route-stop izu"></span><span class="route-stop kyoto"></span><span class="route-label tokyo">東京</span><span class="route-label izu">富士・箱根</span><span class="route-label kyoto">京都</span></div>`;
  $("#regionMapGrid").innerHTML = regionMaps.map(card => `<article class="map-card"><span class="card-kicker">${card.icon} ${he() ? "מפת אזור" : "REGION"}</span><h3>${L(card.title)}</h3><p>${L(card.text)}</p>${routeLinks(card.route)}</article>`).join("");
  $("#mapGrid").innerHTML = mapCards.map(card => `<article class="map-card"><span class="card-kicker">${card.icon} ${he() ? "נקודת מפה" : "MAP PIN"}</span><h3>${L(card.title)}</h3><p>${L(card.text)}</p>${external(MAP(card.query), L(T.map), "compact")}</article>`).join("");
  $("#dayMapList").innerHTML = days.map(day => {
    const route = selectedRoute(day.id);
    return `<article class="day-map-row"><time>${dateParts(day.date).day} ${dateParts(day.date).month}</time><div><h3>${day.icon} ${L(day.title)}</h3><p>${L(day.subtitle)}</p></div>${route ? routeLinks(route) : ""}</article>`;
  }).join("");
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

// The last day to act, for tasks that have a hard deadline. Gilad flies 28 Sep, the family 5 Oct.
// A task with several departures uses the earliest one, since it has a single checkbox.
const TASK_DEADLINES = {
  "flights": "2026-09-21", "vjw-gilad": "2026-09-28", "vjw-family": "2026-10-05", "insurance": "2026-09-27",
  "passports": "2026-09-27", "cards-cash": "2026-09-27", "connectivity": "2026-09-27", "shared-pack": "2026-09-26",
  "medication": "2026-09-27", "packing": "2026-09-26", "emergency": "2026-09-27", "driving-docs": "2026-09-27",
  "cancel-kumihimo": "2026-10-03", "narita-taxi": "2026-10-04", "hakone-checkin": "2026-10-10", "narita-home": "2026-10-17",
  "luggage-plan": "2026-10-09", "teamlab-day": "2026-10-08", "azusa-day": "2026-10-11", "toyota-return": "2026-10-14",
  "hikari-day": "2026-10-14", "final-storage": "2026-10-18", "disney-tickets": "2026-10-08", "daikoku-tour": "2026-10-08",
  "enoshima": "2026-10-09", "ceatec": "2026-10-12", "airport-shipping": "2026-10-18"
};
const daysUntil = iso => Math.round((new Date(`${iso}T00:00:00`) - new Date(`${todayISO()}T00:00:00`)) / 86400000);
const isOverdue = task => TASK_DEADLINES[task.id] && !state.checks[`action-${task.id}`] && daysUntil(TASK_DEADLINES[task.id]) < 0;
function dueBadge(task) {
  const by = TASK_DEADLINES[task.id];
  if (!by || state.checks[`action-${task.id}`]) return "";
  const left = daysUntil(by);
  if (left < 0) return `<em class="due-badge late">${he() ? (left === -1 ? "באיחור של יום" : `באיחור של ${-left} ימים`) : `${-left} ${left === -1 ? "day" : "days"} overdue`}</em>`;
  if (left === 0) return `<em class="due-badge today">${he() ? "היום" : "Today"}</em>`;
  if (left <= 14) return `<em class="due-badge soon">${he() ? (left === 1 ? "מחר" : `עוד ${left} ימים`) : (left === 1 ? "Tomorrow" : `${left} days left`)}</em>`;
  return "";
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
  const overdue = actionChecklist.filter(isOverdue).length;
  const overdueText = overdue ? (state.lang === "he" ? `${overdue} באיחור · ` : `${overdue} overdue · `) : "";
  $("#checklistOverview").innerHTML = `<section class="checklist-overview" aria-label="${state.lang === "he" ? "התקדמות רשימת הפעולות" : "Action checklist progress"}">
    <div class="checklist-score"><span>${done}</span><small>/${actionChecklist.length}</small></div>
    <div class="checklist-progress-copy"><p class="eyebrow">${state.lang === "he" ? "התקדמות הכנות" : "PREPARATION PROGRESS"}</p><h3>${done === actionChecklist.length ? (state.lang === "he" ? "כל משימות ההכנה נבדקו" : "All preparation tasks reviewed") : `${overdueText}${state.lang === "he" ? `${urgentRemaining} פעולות דחופות נשארו` : `${urgentRemaining} do-now actions remain`}`}</h3><p>${state.lang === "he" ? "לחיצה על כל שורה פותחת הוראות וקישורים. כל נוסע מקבל משימה נפרדת כשצריך." : "Open any row for instructions and official links. Individual travelers get separate tasks where it matters."}</p><div class="checklist-progress-track" role="progressbar" aria-label="${L(T.tripProgress)}" aria-valuemin="0" aria-valuemax="100" aria-valuenow="${percent}"><span style="width:${percent}%"></span></div></div>
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
            <summary><span class="action-task-icon" aria-hidden="true">${task.icon}</span><span class="action-task-title"><small>${L(task.kind)}</small><strong>${L(task.title)}</strong><span>${L(task.summary)}</span></span><span class="action-task-meta">${dueBadge(task)}<b>${L(task.due)}</b><small>${L(task.people)}</small></span><span class="action-chevron" aria-hidden="true">⌄</span></summary>
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
  renderTagFilters();
  renderTimeline();
  renderPlanDock();
  renderStays();
  renderFlights();
  renderRailBookingDesk();
  renderCarDays();
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

  const noiseBuffer = ctx.createBuffer(1, ctx.sampleRate * 2, ctx.sampleRate);
  const noiseData = noiseBuffer.getChannelData(0);
  for (let i = 0; i < noiseData.length; i++) noiseData[i] = Math.random() * 2 - 1;

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

  const engine = { ctx, master, musicBus, reverbGain, rainGain, playing:false, timer:null };
  const ZEN_SCALE = [220, 233.08, 293.66, 329.63, 349.23, 440, 466.16];
  const TRAP_SCALE = [220, 246.94, 293.66, 329.63, 369.99, 440];
  engine.pluck = (frequency, when, panValue = 0, bend = false) => {
    const osc = ctx.createOscillator();
    const harmonic = ctx.createOscillator();
    const tone = ctx.createBiquadFilter();
    const gain = ctx.createGain();
    const pan = ctx.createStereoPanner ? ctx.createStereoPanner() : null;
    osc.type = "triangle";
    harmonic.type = "sine";
    if (bend) {
      osc.frequency.setValueAtTime(frequency * 0.944, when);
      osc.frequency.exponentialRampToValueAtTime(frequency, when + .1);
      harmonic.frequency.setValueAtTime(frequency * 2.01 * 0.944, when);
      harmonic.frequency.exponentialRampToValueAtTime(frequency * 2.01, when + .1);
    } else {
      osc.frequency.value = frequency;
      harmonic.frequency.value = frequency * 2.01;
    }
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
  engine.kick = (when) => {
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.type = "sine";
    osc.frequency.setValueAtTime(150, when);
    osc.frequency.exponentialRampToValueAtTime(42, when + .13);
    gain.gain.setValueAtTime(0.0001, when);
    gain.gain.exponentialRampToValueAtTime(0.5, when + .006);
    gain.gain.exponentialRampToValueAtTime(0.0001, when + .32);
    osc.connect(gain); gain.connect(musicBus);
    osc.start(when); osc.stop(when + .34);
  };
  engine.hat = (when, open = false) => {
    const src = ctx.createBufferSource();
    src.buffer = noiseBuffer;
    const hp = ctx.createBiquadFilter();
    hp.type = "highpass"; hp.frequency.value = 7000;
    const gain = ctx.createGain();
    gain.gain.setValueAtTime(0.0001, when);
    gain.gain.exponentialRampToValueAtTime(open ? 0.05 : 0.032, when + .003);
    gain.gain.exponentialRampToValueAtTime(0.0001, when + (open ? .22 : .045));
    src.connect(hp); hp.connect(gain); gain.connect(musicBus);
    src.start(when); src.stop(when + (open ? .24 : .06));
  };
  engine.clap = (when) => {
    [0, .012, .024].forEach(offset => {
      const src = ctx.createBufferSource();
      src.buffer = noiseBuffer;
      const bp = ctx.createBiquadFilter();
      bp.type = "bandpass"; bp.frequency.value = 1500; bp.Q.value = 1.1;
      const gain = ctx.createGain();
      gain.gain.setValueAtTime(0.0001, when + offset);
      gain.gain.exponentialRampToValueAtTime(0.06, when + offset + .004);
      gain.gain.exponentialRampToValueAtTime(0.0001, when + offset + .12);
      src.connect(bp); bp.connect(gain); gain.connect(musicBus);
      src.start(when + offset); src.stop(when + offset + .14);
    });
  };
  engine.vinyl = (when, duration) => {
    const src = ctx.createBufferSource();
    src.buffer = noiseBuffer; src.loop = true;
    const bp = ctx.createBiquadFilter();
    bp.type = "bandpass"; bp.frequency.value = 3200; bp.Q.value = .6;
    const gain = ctx.createGain();
    gain.gain.value = 0.006;
    src.connect(bp); bp.connect(gain); gain.connect(master);
    src.start(when); src.stop(when + duration);
  };
  engine.playZenPhrase = () => {
    engine.timer = setTimeout(() => {
      const now = ctx.currentTime + .06;
      const root = Math.floor(Math.random() * 3);
      const patternLength = 2 + Math.floor(Math.random() * 4);
      for (let index = 0; index < patternLength; index++) {
        const note = ZEN_SCALE[(root + [0,3,1,4,2][index % 5]) % ZEN_SCALE.length];
        engine.pluck(note, now + index * (.5 + Math.random() * .3), -0.65 + Math.random() * 1.3, Math.random() > .55);
      }
      if (Math.random() > .52) engine.breath(ZEN_SCALE[root] / 2, now + 1.1);
      if (Math.random() > .7) engine.chime();
      engine.schedule();
    }, 11000 + Math.random() * 17000);
  };
  engine.playTrapBar = () => {
    const now = ctx.currentTime + .05;
    const step = 0.15;
    for (let i = 0; i < 16; i++) {
      const t = now + i * step;
      if (i >= 13 && Math.random() > .45) { engine.hat(t, false); engine.hat(t + step / 2, false); }
      else if (Math.random() > .12) engine.hat(t, i === 7 && Math.random() > .65);
    }
    engine.kick(now);
    if (Math.random() > .4) engine.kick(now + step * 10);
    engine.clap(now + step * 4);
    engine.clap(now + step * 12);
    const rootIndex = Math.random() > .5 ? 0 : 1;
    const sub = ctx.createOscillator();
    const subGain = ctx.createGain();
    sub.type = "sine"; sub.frequency.value = TRAP_SCALE[rootIndex] / 4;
    subGain.gain.setValueAtTime(0.0001, now);
    subGain.gain.exponentialRampToValueAtTime(0.24, now + .02);
    subGain.gain.exponentialRampToValueAtTime(0.0001, now + step * 7);
    sub.connect(subGain); subGain.connect(musicBus);
    sub.start(now); sub.stop(now + step * 7 + .05);
    [0,3,6,9,11,14].forEach((i, idx) => {
      if (Math.random() > .3) engine.pluck(TRAP_SCALE[(idx + rootIndex + 2) % TRAP_SCALE.length], now + i * step, -0.5 + Math.random(), idx % 2 === 0);
    });
    engine.vinyl(now, step * 16);
    engine.timer = setTimeout(() => engine.schedule(), step * 16 * 1000);
  };
  engine.schedule = () => {
    clearTimeout(engine.timer);
    if (!engine.playing) return;
    if (state.soundMode === "trap") engine.playTrapBar();
    else engine.playZenPhrase();
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

function setSoundMode(mode) {
  if (state.soundMode === mode) return;
  state.soundMode = mode;
  persist();
  $$("#soundModeSwitch [data-sound-mode]").forEach(btn => btn.setAttribute("aria-pressed", String(btn.dataset.soundMode === mode)));
  if (audioEngine) {
    const now = audioEngine.ctx.currentTime;
    audioEngine.reverbGain.gain.linearRampToValueAtTime(mode === "trap" ? 0.07 : 0.16, now + 1.2);
    audioEngine.rainGain.gain.linearRampToValueAtTime(mode === "trap" ? 0.03 : 0.1, now + 1.2);
    if (audioEngine.playing) { clearTimeout(audioEngine.timer); audioEngine.schedule(); }
  }
  showToast(state.lang === "he"
    ? (mode === "trap" ? "מצב סאונד: טראפ לילי" : "מצב סאונד: קוטו זן")
    : (mode === "trap" ? "Sound mode: Night trap" : "Sound mode: Zen koto"));
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

  const voteButton = event.target.closest("[data-vote]");
  if (voteButton) { event.preventDefault(); event.stopPropagation(); const [dir, id] = voteButton.dataset.vote.split(":"); castVote(id, dir); return; }

  const verdictButton = event.target.closest("[data-verdict]");
  if (verdictButton) { event.preventDefault(); event.stopPropagation(); const [value, id] = verdictButton.dataset.verdict.split(":"); setVerdict(id, value); return; }

  if (event.target.closest("[data-who-open]")) { openWho(); return; }
  const whoButton = event.target.closest("[data-who]");
  if (whoButton) { choosePerson(whoButton.dataset.who); return; }
  const duck = event.target.closest("[data-duck]");
  if (duck) { quack(duck); return; }

  const tagButton = event.target.closest("[data-tag-filter]");
  if (tagButton) { tagFilter = tagButton.dataset.tagFilter; preserveUI(() => { renderTagFilters(); renderTimeline(); }); return; }

  if (event.target.closest("[data-open-plan]")) { renderPlanDialog(); $("#planDialog").showModal(); return; }

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
      const next = ["solo","tokyo","fuji","kyoto","finale"].find(id => !state.stamps[id]);
      if (next) state.stamps[next] = true; else state.stamps = {};
      persist(); preserveUI(renderPlanner); showToast(L(T.stampAdded));
    }
  }
});

document.addEventListener("change", event => {
  if (event.target.matches("[data-ticket]")) {
    state.tickets[event.target.dataset.ticket] = event.target.checked; persist(); preserveUI(renderTransit);
  }
  if (event.target.matches("[data-check]")) {
    state.checks[event.target.dataset.check] = event.target.checked; persist(); preserveUI(() => { renderActionChecklist(); renderStays(); });
  }
  if (event.target.matches("[data-decision]")) {
    state.decisions[event.target.dataset.decision] = event.target.value; persist();
  }
});

$("#themeToggle").addEventListener("click", () => {
  const dark = state.theme === "dark" || (state.theme === "auto" && matchMedia("(prefers-color-scheme: dark)").matches);
  state.theme = dark ? "light" : "dark";
  persist(); applyTheme();
});
matchMedia("(prefers-color-scheme: dark)").addEventListener?.("change", applyTheme);

$("#planClose").addEventListener("click", () => $("#planDialog").close());
$("#planDialog").addEventListener("click", event => { if (event.target === event.currentTarget) event.currentTarget.close(); });
$("#planCopy").addEventListener("click", () => copyText(planText(), he() ? "התכנית הועתקה" : "Plan copied"));
$("#planShare").addEventListener("click", sharePlan);
$("#planPrint").addEventListener("click", printPlan);
$("#planWho").addEventListener("click", () => { $("#planDialog").close(); openWho(); });

$("#whoClose").addEventListener("click", () => $("#whoDialog").close());
// Nobody skips the chooser on first visit; later it closes like any dialog.
$("#whoDialog").addEventListener("cancel", event => { if (!state.me) event.preventDefault(); });
$("#codeForm").addEventListener("submit", event => {
  event.preventDefault();
  const input = $("#codeInput");
  if (codeHash(input.value.trim()) !== APPROVER_HASH) {
    $("#codeError").textContent = he() ? "קוד שגוי. נסו שוב." : "Wrong code. Try again.";
    input.setAttribute("aria-invalid", "true");
    input.select();
    return;
  }
  state.approver = true;
  persist();
  $("#codeDialog").close();
  const then = codeThen;
  codeThen = null;
  then?.();
});
$("#codeCancel").addEventListener("click", () => { codeThen = null; $("#codeDialog").close(); });

window.addEventListener("online", () => { flushOutbox(); if (SYNC_URL && (!syncSource || syncSource.readyState === 2)) startSync(); });
window.addEventListener("offline", () => { if (SYNC_URL) setSyncStatus("offline"); });
document.addEventListener("visibilitychange", () => {
  if (document.visibilityState === "visible" && SYNC_URL && (!syncSource || syncSource.readyState === 2)) startSync();
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
$$("#soundModeSwitch [data-sound-mode]").forEach(btn => btn.addEventListener("click", () => setSoundMode(btn.dataset.soundMode)));
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
    flashSecretReveal("新");
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
    flashSecretReveal("怪");
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
startSync();
flushOutbox();
whenAppVisible(() => { if (!state.me) openWho(); });

if ("serviceWorker" in navigator && location.protocol.startsWith("http")) {
  const setupOffline = async () => {
    try { const registration = await navigator.serviceWorker.register('service-worker.js', {updateViaCache:'none'}); await registration.update(); }
    catch { showToast(state.lang === 'he' ? 'שמירה לא מקוונת אינה זמינה כרגע; נסו שוב בחיבור תקין.' : 'Offline setup is unavailable right now; retry with a working connection.'); }
  };
  if (document.readyState === 'complete') setupOffline();
  else window.addEventListener('load', setupOffline, {once:true});
}
