# RideShare — Java 10 · Dy ekrane, një gjendje

## Çfarë ndërtova

Kërkesa e udhëtarit, përgjigjja e shoferit dhe vendet e lira tani ruhen në Neon. Te faqja e detajeve (`/udhetimi/[id]`) të dy ekranet i rilexojnë automatikisht çdo 5 sekonda, pa Refresh manual.

- **Ruajtja:** tabela e re `kerkesat` (udhëtimi, udhëtari, statusi `ne_pritje` / `pranuar`) me një kërkesë për çdo çift udhëtar–udhëtim. Migrimi: `aplikacioni/schema-java10.sql`.
- **Leximi:** `GET /api/udhetimet/[id]/gjendja`. Serveri e merr përdoruesin nga sesioni. Shoferi pronar sheh kërkesat e udhëtimit të vet, ndërsa udhëtari vetëm kërkesën e vet. Përgjigjja ka `Cache-Control: private, no-store`. Leximi nuk ndryshon asgjë.
- **Dërgimi:** `POST /api/udhetimet/[id]/kerkesa`. Telefoni dërgon vetëm ID-në e udhëtimit, dhe udhëtari vjen nga sesioni.
- **Pranimi:** `POST /api/kerkesat/[id]/prano` thërret funksionin `prano_kerkesen` në databazë. Ai e bllokon rreshtin e udhëtimit (`FOR UPDATE`) dhe ndryshon statusin dhe vendet në të njëjtin transaksion. Pranimi i përsëritur kthen `tashme_pranuar` pa e ulur numrin. Me 0 vende kthen `pa_vende`, dhe një `CHECK (vende >= 0)` e mbron edhe tabelën.
- **Përditësimi periodik:** `GjendjaUdhetimit.tsx` lexon çdo 5 sekonda. I radhësi planifikohet vetëm pasi mbaron leximi aktual, kurse një lexim i ri anulon të vjetrin dhe përgjigjet e vjetruara injorohen. Timer-i pastrohet kur largohesh nga faqja.
- **Ndërprerja:** nëse leximi dështon, mbahen vlerat e fundit, shfaqet “Po rilidhemi · të dhënat mund të jenë të vjetra” dhe butonat bllokohen. Me ngjarjen `online` leximi bëhet menjëherë. Paralajmërimi hiqet vetëm pas një përgjigjeje të suksesshme.

## Provat që bëra

### Rasti 1: Kërkesa mbërrin te shoferi pa Refresh.

Hapat: [PLOTËSO: ID e udhëtimit me 2 vende, dy llogaritë (dritare normale + private), çfarë pa secili ekran]

Pritshmëria: Pas leximit të radhës, shoferi sheh kërkesën “Në pritje” dhe udhëtari “Kërkesa u dërgua”. Vendet mbeten 2. Kontrollohet nga `src/lib/kerkesat.ts` (`dergoKerkesen`, `lexoGjendjen`).

Vëzhgimi: [PLOTËSO]

### Rasti 2: Pranimi përditëson të dy ekranet. Pranimi i përsëritur nuk numërohet dy herë.

Hapat: [PLOTËSO]

Pritshmëria: Të dy ekranet tregojnë “U pranua” dhe 1 vend. Ekzekutimi i `node --env-file=.env scripts/prova-pranimi.mjs` thërret `prano_kerkesen` dy herë me të njëjtën ID dhe pastaj me 0 vende. Pritet `tashme_pranuar`, `pa_vende` dhe asnjë numër negativ. Kontrollohet nga `schema-java10.sql` (`prano_kerkesen`).

Vëzhgimi: [PLOTËSO: rezultati i ekranit dhe dalja e skriptit]

### Rasti 3: Ndërprerja dhe rilidhja.

Hapat: [PLOTËSO: ID e udhëtimit të dytë me 2 vende. DevTools → Network → Offline vetëm te udhëtari. Shoferi pranon, pastaj No throttling.]

Pritshmëria: Udhëtari offline mban pamjen e vjetër (2 vende, “Në pritje”) me paralajmërim dhe nuk sheh zero. Pas rilidhjes, pa Refresh, sheh “U pranua” dhe 1 vend. Kontrollohet nga `src/components/GjendjaUdhetimit.tsx`.

Vëzhgimi: [PLOTËSO]

## Ku gjendet puna

- `aplikacioni/schema-java10.sql`: tabela `kerkesat`, kufizimi i vendeve dhe funksioni `prano_kerkesen`
- `aplikacioni/src/lib/kerkesat.ts`: leximi, dërgimi dhe pranimi në server
- `aplikacioni/src/app/api/udhetimet/[id]/gjendja/route.ts`, `.../kerkesa/route.ts`, `src/app/api/kerkesat/[id]/prano/route.ts`
- `aplikacioni/src/components/GjendjaUdhetimit.tsx`: përditësimi periodik dhe gjendja offline
- `aplikacioni/src/app/udhetimi/[id]/page.tsx`: përdor komponentin. `.../kerkesa/page.tsx` tani ridrejton te detajet.
- `aplikacioni/scripts/prova-pranimi.mjs`: prova e serverit për pranimin e përsëritur

## Pse një timer nuk mjafton

Timer-i vetëm rilexon të dhënat. Lejet (kush pranon), pranimi vetëm një herë dhe numri i vendeve mbrohen nga serveri dhe databaza: sesioni, `FOR UPDATE` në transaksion dhe `CHECK (vende >= 0)`.

## Kufizime

- Një udhëtar nuk mund ta anulojë kërkesën, dhe shoferi nuk mund ta refuzojë.
- Përditësimi bëhet me lexim periodik, jo në kohë reale (WebSocket), prandaj vonesa mund të jetë deri në 5 sekonda.

## Ndihma nga AI (Artificial Intelligence – inteligjencë artificiale)

U përdor AI për implementimin. U verifikua me `tsc --noEmit` dhe `npm run build`. Provat me dy dritare [PLOTËSO].
