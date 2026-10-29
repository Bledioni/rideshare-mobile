# RideShare · Java 7

## Rasti im
GitHub: bledioni
Kodi: P7-018
Skenari i zgjedhur (numri dhe titulli, nga Rastet 1–5): Rasti 2 · Pa vende
ID i udhëtimit në projektin tim: 3 (Lipjan → AAB, 07:45, 0 vende)
Të dhënat fiktive të rastit: Prizren → AAB, 08:00, 1 vende. Ora për provën e re: 08:05.

## Parashikimi
Në listë pres të shoh udhëtimin ID 3 (Lipjan → AAB, 07:45) dhe të kuptoj menjëherë se nuk ka vende. Te detajet e ID 3 pres mesazhin "Nuk ka vende të lira" dhe asnjë buton që premton vend. Te kërkesa demonstrative për ID 3 pres që të mos tregohet "Simulim: Në pritje", por mesazh pa vende dhe një mënyrë për t'u kthyer te lista për të zgjedhur udhëtim tjetër.

## Dy probleme
1. Në listë, udhëtimi ID 3 (Lipjan → AAB) shfaqej si "Vende të lira: 0" me të njëjtin buton blu "Shiko detajet" si udhëtimet me vende. Hapat: hap faqen kryesore `/` dhe krahaso kartën e ID 3 me ID 1 dhe ID 2. Përdoruesi kupton se udhëtimi është plot vetëm pasi hap detajet.
2. Te kërkesa demonstrative `/udhetimi/3/kerkesa` shfaqet vetëm "Nuk ka vende të lira." dhe lidhja "← Kthehu te detajet". Nuk ka lidhje te lista ose sugjerim për të zgjedhur udhëtim tjetër. Hapat: hap `/udhetimi/3/kerkesa` direkt në shfletues.

## Korrigjimi
Skedari: aplikacioni/src/components/KartaUdhetimi.tsx
Ky komponent vizaton kartën e një udhëtimi në listën e faqes kryesore (nisja, destinacioni, ora, vendet dhe lidhja te detajet). Shtova një kusht: kur `udhetim.vende > 0` shfaqet "Vende të lira: N", ndërsa kur vendet janë 0 shfaqet "Nuk ka vende të lira". Kështu lista nuk lë përshtypjen se ka vend të lirë, dhe teksti përputhet me atë që shfaqet te detajet. Lidhja "Shiko detajet" mbetet, sepse detajet janë ende të dobishme. Nuk ndryshova të dhënat në Neon dhe as kontrollet në server.

## Versionet
Para: https://github.com/Bledioni/rideshare-mobile/commit/f0aba03854f47ef7b7d6b9f6706aa25ede180b6e
Pas: https://github.com/Bledioni/rideshare-mobile/commit/69e77326b919074f8fa1c2ef03f353e7b548c3f2

## Provat që bëra
### Prova 1
Hapat: Hap `/`, kliko "Shiko detajet" te Fushë Kosovë → AAB (ID 2), pastaj "Kërko vend" (`/udhetimi/2/kerkesa`).
Pritshmëria: Lista, detajet dhe kërkesa tregojnë të njëjtin udhëtim: ID 2, ora 08:25, 1 vend. Kërkesa thotë qartë që është simulim.
Vëzhgimi: Kaloi. Lista: "Ora: 08:25 · Vende të lira: 1". Detajet: Fushë Kosovë – AAB, 08:25, Te stacioni kryesor, 1 vend, butoni "Kërko vend". Kërkesa: "Simulim: Në pritje" dhe "Kërkesa për Fushë Kosovë nuk është dërguar te shoferi." Nuk pretendohet rezervim real.

### Prova 2
Hapat: Pas korrigjimit rifresko `/` dhe shiko kartën Lipjan → AAB (ID 3, 0 vende). Pastaj hap `/udhetimi/3`.
Pritshmëria: Karta e ID 3 tregon "Nuk ka vende të lira"; kartat me vende tregojnë ende numrin. Detajet kanë butonin joaktiv "Nuk ka vende të lira".
Vëzhgimi: Kaloi. Karta e ID 3: "Ora: 07:45 · Nuk ka vende të lira". ID 1, 2 dhe 4 tregojnë ende "Vende të lira: 2 / 1 / 3". Te `/udhetimi/3` butoni është joaktiv dhe nuk ka lidhje te kërkesa. `tsc` dhe `eslint` kaluan pa gabime.

### Prova 3
Hapat: Hyrje tjetër: hap direkt `/udhetimi/3/kerkesa` (ID me 0 vende, pa kaluar nga detajet). Pastaj hap `/udhetimi/999` (ID që nuk ekziston).
Pritshmëria: Për ID 3: mesazh pa vende dhe lidhje për t'u kthyer te lista që të zgjedh udhëtim tjetër. Për ID 999: faqja "Udhëtimi nuk u gjet" me lidhje te lista.
Vëzhgimi: Dështoi pjesërisht. Për ID 3 shfaqet "Nuk ka vende të lira.", pra nuk premtohet vend, por ka vetëm "← Kthehu te detajet" dhe asnjë lidhje te lista. Ky është problemi 2, që nuk e korrigjova sot. Për ID 999 kaloi: statusi 404 me "Udhëtimi nuk u gjet" dhe butonin "Kthehu te lista".

## Ndryshimi i ri
Nuk e kam demonstruar ende para kolegut. Hyrja që do të provoj: ndryshoj vendet e ID 2 nga 1 në 0 vetëm në rreshtin tim të testimit. Parashikimi: karta e ID 2 kalon nga "Vende të lira: 1" në "Nuk ka vende të lira", sepse kushti `udhetim.vende > 0` nuk plotësohet më. Pas provës e kthej vlerën në 1. Do ta shpjegoj në takimin e radhës.

## Ndihma nga AI
Përdora Claude Code (AI) për të lexuar udhëzimet, për të gjetur dy problemet, për të shkruar korrigjimin në KartaUdhetimi.tsx dhe për të hartuar këtë raport. Faqet u provuan me kërkesa reale te serveri lokal (`npm run dev`, localhost:3000), dhe kodi u kontrollua me `tsc` dhe `eslint`. Edhe parashikimi u hartua me ndihmën e AI. Do t'i përsëris vetë provat në shfletues dhe do ta shpjegoj ndryshimin para kolegut.
