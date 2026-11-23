# RideShare — Java 10 · Dy ekrane, një gjendje

## Çfarë u ndërtua

Kërkesa e udhëtarit, përgjigjja e shoferit dhe vendet e lira tani ruhen në Neon. Te faqja e detajeve (`/udhetimi/[id]`), të dy ekranet i rilexojnë të dhënat automatikisht çdo 5 sekonda, pa Refresh manual.

- **Ruajtja:** tabela e re `kerkesat` (udhëtimi, udhëtari, statusi `ne_pritje` / `pranuar`) me një kërkesë për çdo çift udhëtar–udhëtim. Migrimi: `aplikacioni/schema-java10.sql`.
- **Leximi:** `GET /api/udhetimet/[id]/gjendja`. Serveri e merr përdoruesin nga sesioni. Shoferi pronar sheh kërkesat e udhëtimit të vet, ndërsa udhëtari vetëm kërkesën e vet. Përgjigjja ka `Cache-Control: private, no-store`. Leximi nuk ndryshon asnjë gjë.
- **Dërgimi:** `POST /api/udhetimet/[id]/kerkesa`. Telefoni dërgon vetëm ID-në e udhëtimit, dhe udhëtari vjen nga sesioni.
- **Pranimi:** `POST /api/kerkesat/[id]/prano` thërret funksionin `prano_kerkesen` në databazë. Ai bllokon rreshtin e udhëtimit (`FOR UPDATE`) dhe ndryshon statusin dhe vendet në të njëjtin transaksion. Pranimi i përsëritur kthen `tashme_pranuar` pa e ulur numrin. Me 0 vende kthen `pa_vende`, dhe `CHECK (vende >= 0)` e mbron edhe tabelën.
- **Përditësimi periodik:** `GjendjaUdhetimit.tsx` lexon çdo 5 sekonda. I radhësi planifikohet vetëm pasi mbaron leximi aktual, një lexim i ri anulon të vjetrin dhe përgjigjet e vjetruara injorohen. Timer-i pastrohet kur largohesh nga faqja.
- **Ndërprerja:** nëse leximi dështon, mbahen vlerat e fundit, shfaqet “Po rilidhemi · të dhënat mund të jenë të vjetra” dhe butonat bllokohen. Me ngjarjen `online` leximi bëhet menjëherë. Paralajmërimi hiqet vetëm pas një përgjigjeje të suksesshme.

## Provat me dy sesione

### Rasti 1: Kërkesa mbërrin te shoferi pa Refresh

- **Hapat:** hapet `/udhetimi/[id]` (me 2 vende) në dritare normale si shofer dhe në dritare private si udhëtar; udhëtari dërgon kërkesën.
- **Pritshmëria:** pas leximit të radhës, shoferi sheh kërkesën “Në pritje” dhe udhëtari “Kërkesa u dërgua”. Vendet mbeten 2. (`src/lib/kerkesat.ts` — `dergoKerkesen`, `lexoGjendjen`).
- **Vëzhgimi:** —

### Rasti 2: Pranimi përditëson të dy ekranet dhe nuk numërohet dy herë

- **Hapat:** shoferi pranon kërkesën nga ekrani i vet; ekzekutohet `node --env-file=.env scripts/prova-pranimi.mjs`.
- **Pritshmëria:** të dy ekranet tregojnë “U pranua” dhe 1 vend. Skripti thërret `prano_kerkesen` dy herë me të njëjtën ID dhe pastaj me 0 vende, duke kthyer `tashme_pranuar` dhe `pa_vende` pa numra negativë. (`schema-java10.sql` — `prano_kerkesen`).
- **Vëzhgimi:** —

### Rasti 3: Ndërprerja dhe rilidhja

- **Hapat:** hapet një udhëtim i dytë me 2 vende; te udhëtari vendoset DevTools → Network → Offline; shoferi pranon kërkesën; te udhëtari kthehet në No throttling.
- **Pritshmëria:** udhëtari offline mban pamjen e fundit (2 vende, “Në pritje”) me paralajmërim dhe pa shfaqur zero. Pas rilidhjes, pa Refresh, shfaqet “U pranua” dhe 1 vend. (`src/components/GjendjaUdhetimit.tsx`).
- **Vëzhgimi:** —

## Skedarët kryesorë

- `aplikacioni/schema-java10.sql`: tabela `kerkesat`, kufizimi i vendeve dhe funksioni `prano_kerkesen`
- `aplikacioni/src/lib/kerkesat.ts`: leximi, dërgimi dhe pranimi në server
- `aplikacioni/src/app/api/udhetimet/[id]/gjendja/route.ts`, `.../kerkesa/route.ts`, `src/app/api/kerkesat/[id]/prano/route.ts`
- `aplikacioni/src/components/GjendjaUdhetimit.tsx`: përditësimi periodik dhe gjendja offline
- `aplikacioni/src/app/udhetimi/[id]/page.tsx`: përdor komponentin; `.../kerkesa/page.tsx` ridrejton te detajet
- `aplikacioni/src/app/api/udhetimet/[id]/vendtakimi/route.ts` dhe `src/components/VendtakimiLokale.tsx`: shoferi pronar ndryshon vendtakimin; ruhet në Neon dhe udhëtari e sheh me leximin e radhës, me njoftimin “Shoferi e ndryshoi vendtakimin”
- `aplikacioni/scripts/prova-pranimi.mjs`: prova e serverit për pranimin e përsëritur

## Pse një timer nuk mjafton

Timer-i vetëm rilexon të dhënat. Lejet (kush pranon), pranimi vetëm një herë dhe numri i vendeve mbrohen nga serveri dhe databaza: sesioni, `FOR UPDATE` në transaksion dhe `CHECK (vende >= 0)`.

## Kufizime

- Udhëtari nuk mund ta anulojë kërkesën, dhe shoferi nuk mund ta refuzojë.
- Përditësimi bëhet me lexim periodik, jo me WebSocket, prandaj vonesa mund të jetë deri në 5 sekonda.

## Verifikimi

- Kontrolluar me `npx tsc --noEmit` dhe `npm run build`.
- Rastet 1–3 me dy dritare dhe databazën aktive plotësohen pas ekzekutimit të provave.