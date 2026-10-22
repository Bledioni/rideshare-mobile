Çfarë ndërtova
Në këtë javë kam implementuar sistemin e hyrjes (autentifikimit) dhe menaxhimin e lejeve (autorizimit) duke bërë dallimin e qartë mes identitetit, rolit dhe pronësisë:

Identiteti: Kush është përdoruesi i kyçur (p.sh. përmes GitHub OAuth, ku merren të dhënat unike të llogarisë).

Roli: Çfarë lejesh ka përdoruesi në nivel sistemi (p.sh. roli i shoferit kundrejt pasagjerit ose administratorit, që përcakton se cilat faqe apo funksione mund të qasë).

Pronësia: Kontrolli se kush zotëron një resurs të caktuar (p.sh. një shofer mund të modifikojë apo fshijë vetëm udhëtimet që i ka krijuar vetë, duke u siguruar që përdoruesit e tjerë të mos ndërhyjnë në të dhënat e huaja edhe pse mund të kenë të drejta shoferi).

Provat që bëra
Prova 1: Hyrja, rifreskimi dhe dalja
Para hyrjes: Kur provova të hyja direkt te /panel pa u kyçur, sistemi më refuzoi dhe më ridrejtoi te faqja e hyrjes (login), duke shfaqur butonin për kyçje me GitHub.

Pas rifreskimit: Pasi u kyça me sukses dhe rifreskova faqen (refresh), sesioni mbeti aktiv, paneli u shfaq normalisht dhe të dhënat e mia mbetën të ruajtura pa kërkuar rikyçje.

Pas daljes: Pasi klikova opsionin e daljes (logout), sesioni u mbyll dhe kur provova të rifreskoja ose të hyja përsëri te /panel, u dërgova te faqja publike, ndërsa paneli u bë i paarritshëm.

Prova 2: Shoferi ndryshon udhëtimin e vet
U kyça si shofer me ID 2 dhe ndryshova orën e nisjes së udhëtimit tim nga 08:15 në 08:25.

Në panel, listë dhe detaje: Ora u përditësua menjëherë në 08:25 dhe u reflektua saktë si në listën e përgjithshme ashtu edhe në pamjen e detajeve të udhëtimit.

Në SQL Editor: Kontrollova bazën e të dhënave dhe konfirmova se ndryshimi u ruajt në tabelë. Për siguri, më pas e riktheva orën përsëri në 08:15.

Prova 3: Veprimi pa leje refuzohet
Duke mbajtur të hapur formularin e redaktimit, ndryshova manualisht ID-në e udhëtimit në 1 (që i takon një shoferi tjetër) dhe provova të klikoj "Ruaj".

Mesazhi i refuzimit: Sistemi shfaqi gabim se veprimi nuk është i lejuar ose se resursi nuk i përket përdoruesit aktual.

Verifikimi në Neon: Kontrollova në Neon SQL Editor dhe konfirmova se udhëtimi me ID 1 mbeti i paprekur në orën e tij origjinale 08:00, duke dëshmuar se kontrolli i pronësisë dhe autorizimit funksionon siç duhet.

Ku gjendet puna
Repository: https://github.com/Bledioni/rideshare-mobile.git

Skedarët e rinj: Skedarët e shtuar për autentifikimin, middleware-ët e autorizimit dhe logjikën e paneleve ndodhen në strukturën e projektit jashtë dosjes aplikacioni/.


Çfarë mbetet për përmirësim
Kufizimi aktual: Kërkesa dhe rezervimi i vendeve për udhëtime është ende një simulim bazik (hardcoded ose pa logjikë të plotë transaksionale në kohë reale).

Çfarë do të shtoja më pas: Do të shtoja menaxhimin e plotë të vendeve të lira në kohë reale (që numri i vendeve të ulet automatikisht sapo një pasagjer të rezervojë), si dhe njoftimet për shoferin kur dikush rezervon udhëtimin e tij.

Ndihma nga AI (Artificial Intelligence – inteligjencë artificiale)
Përdora AI për të kuptuar më qartë strukturën e middleware-ve për kontrollin e roleve dhe për të shkruar logjikën e verifikimit të pronësisë në backend, ndërsa testimet, rregullimet e kodeve dhe provat në bazën e të dhënave i punova vetë.