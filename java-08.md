# RideShare — Java 8

## Çfarë ndërtova

Shtova zgjedhjen lokale të vendtakimit në detajet e udhëtimit. Përdoruesi mund të shkruajë dhe konfirmojë një vend, ose të kërkojë lejen e vendndodhjes pas klikimit. Faqja e provës përdor të njëjtin komponent dhe të dhëna fiktive, pa databazë.

## Provat që bëra

### Prova 1: Leja nuk kërkohet sapo hapet faqja.

Hapat: Rifreskova `/java-08-test`, vëzhgova gjendjen fillestare dhe pastaj klikova butonin e vendndodhjes me një rezultat të suksesshëm të simuluar.

Pritshmëria: Faqja të hapet pa nisur leximin; klikimi të nisë kërkesën dhe suksesi të shfaqë saktësinë.

Vëzhgimi: Gjendja fillestare ishte `idle` dhe nuk u thirr leximi para klikimit. Pas klikimit u shfaq suksesi dhe saktësia e simuluar `37 m`.

### Prova 2: Refuzimi i lejes nuk e bllokon përdoruesin.

Hapat: Simulova refuzimin dhe skadimin e kohës; pas secilit rezultat provova të konfirmoj `Parkingu` manualisht.

Pritshmëria: Pritja të përfundojë, të shfaqet mesazhi përkatës dhe vendtakimi manual të mbetet i përdorshëm.

Vëzhgimi: Gjendjet `denied` dhe `timeout` u shfaqën, butoni u bë përsëri i përdorshëm dhe `Parkingu` u konfirmua në të dy rastet. Këto ishin simulime në shfletues, jo prova me lejen fizike të telefonit.

### Prova 3: Dëshmitë në GitHub nuk tregojnë adresën time reale.

Hapat: Kontrollova faqen, komponentin dhe konfigurimin e testit që do të publikohen.

Pritshmëria: Të dhënat e provës të jenë fiktive; koordinatat të mos ruhen, shfaqen ose dërgohen.

Vëzhgimi: Faqja përdor vetëm të dhëna fiktive. Kodi shfaq saktësinë, por nuk ruan ose shfaq koordinatat; konfigurimi përmban vetëm versionin dhe shtegun e faqes.

## Ku gjendet puna

Komponenti: `src/components/VendtakimiLokale.tsx`. Përdoret te `src/app/udhetimi/[id]/page.tsx` dhe te faqja lokale `src/app/java-08-test/page.tsx`. Konfigurimi i testit është `mobile-week08.json`. Faqja e provës është lokale dhe nuk është publikuar.

## Çfarë mbetet për përmirësim

Zgjedhja ruhet vetëm në gjendjen e faqes dhe humbet pas rifreskimit. Leximi i vendndodhjes nuk e kthen koordinatën në emër vendi dhe vendtakimi nuk dërgohet te shoferi; këto mbeten hapa të ardhshëm. Duhet provuar edhe leja reale në pajisje dhe prova me koleg.

## Ndihma nga AI (Artificial Intelligence – inteligjencë artificiale)

U përdor AI për të analizuar udhëzimet dhe për të ndërtuar komponentin dhe faqen e provës. Ndryshimi u verifikua me `npm run build` dhe tetë prova lokale në shfletues me vendndodhje të simuluar; nuk pretendoj se kam testuar GPS real ose bashkëpunuar me koleg.

## Prova me një hyrje të re

- Hyrja që provova: Shkrova vetëm hapësira pasi vendtakimi `Biblioteka` ishte konfirmuar.
- Parashikimi im para klikimit: Duhet të shfaqet gabim dhe `Biblioteka` të mbetet vendtakimi i konfirmuar.
- Çfarë pashë realisht: U shfaq gabimi dhe vendtakimi i konfirmuar mbeti `Biblioteka`.
- Skedari dhe funksioni që e shpjegojnë: `src/components/VendtakimiLokale.tsx`, funksioni `konfirmoVendtakimin`.
- Çfarë kuptova ose korrigjova: `trim()` ndalon që teksti bosh ose me hapësira të zëvendësojë zgjedhjen e mëparshme.
