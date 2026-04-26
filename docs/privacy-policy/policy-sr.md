# Politika privatnosti — DeCo aplikacija

**Verzija 1.0 — važi od 26. aprila 2026.**

DeCo je mobilna aplikacija namenjena klijentima kompanije **UrilSolutions** (u daljem tekstu „mi", „naša kompanija") za pregled stanja duga, dogovaranje obećanja uplate (PTP), generisanje QR koda za plaćanje i komunikaciju sa našim operaterima. Ova politika opisuje koje podatke prikupljamo, zašto, koliko ih čuvamo i koja prava imate.

## 1. Ko je rukovalac podataka

Rukovalac podataka u smislu Zakona o zaštiti podataka o ličnosti („Sl. glasnik RS", br. 87/2018) i GDPR-a (Uredba EU 2016/679) je:

**UrilSolutions**
Matice srpske 75, Beograd, Srbija
Matični broj: 63560073

Za sva pitanja o privatnosti i zaštiti podataka kontaktirajte:
**privacy@uril.rs**

## 2. Koje podatke prikupljamo i zašto

### 2.1 Podaci koje aktivno unosite

| Podatak | Svrha | Pravni osnov |
|---|---|---|
| Matični broj / ID klijenta | Identifikacija u našem sistemu naplate | Izvršenje ugovora |
| Broj telefona | Slanje OTP koda za prijavu, potvrda identiteta | Izvršenje ugovora |
| Sadržaj poruka prema operateru | Komunikacija u vezi vašeg duga | Izvršenje ugovora |
| Iznos i datum obećanja uplate (PTP) | Evidencija dogovora | Izvršenje ugovora |

### 2.2 Podaci koje prikupljamo automatski

| Podatak | Svrha | Pravni osnov |
|---|---|---|
| ID uređaja (anoniman UUID) | Vezivanje sesije za uređaj, sprečavanje neovlašćenog pristupa | Legitimni interes (sigurnost) |
| Push token (FCM) | Slanje notifikacija (npr. nova poruka operatera, podsetnik o dugu) | Pristanak (možete isključiti u podešavanjima sistema) |
| Verzija aplikacije, verzija OS-a | Tehnička podrška, usmeravanje na obavezne nadogradnje | Legitimni interes |
| Vreme prijave i odjave | Sigurnosna evidencija | Legitimni interes (sigurnost) |

### 2.3 Šta NE prikupljamo

Eksplicitno NE prikupljamo:
- Lokaciju uređaja (GPS)
- Listu kontakata
- Slike, video ili audio sa uređaja
- Pristup kameri ili mikrofonu
- ID dokumenta (lična karta, pasoš)
- Bilo koje podatke iz drugih aplikacija na uređaju

Aplikacija ne sadrži reklame, ne koristi analitičke alate trećih lica (Google Analytics, Facebook Pixel, itd.), ne deli podatke sa oglašivačima.

### 2.4 Biometrijski podaci

Aplikacija koristi otisak prsta ili Face ID **isključivo lokalno na vašem uređaju** za otključavanje aplikacije pri ponovnom otvaranju. Biometrijski podaci se nikada ne prenose na naš server niti gde drugde — operacija provere se obavlja u sigurnom enklavu vašeg telefona (Android Keystore / iOS Secure Enclave).

## 3. Sa kim delimo podatke

**Google LLC (Firebase Cloud Messaging)** — push token i sadržaj notifikacija prolaze kroz Google FCM infrastrukturu radi isporuke notifikacija. Google čuva ove podatke u skladu sa svojom politikom privatnosti.

**Bančin sistem CRM** — vaši finansijski podaci (dugovanja, krediti, uplate) se nalaze u sistemu banke ili davaoca kredita kome ste klijent. UrilSolutions pristupa tim podacima u svojstvu obrađivača (procesora) na osnovu ugovora sa odgovarajućom finansijskom institucijom.

Ne prodajemo podatke trećim licima. Ne delimo podatke u marketinške svrhe.

## 4. Koliko dugo čuvamo podatke

| Podatak | Period čuvanja |
|---|---|
| Aktivan nalog (broj telefona, ID uređaja, push token) | Dok je nalog aktivan |
| Posle brisanja naloga: poruke, PTP, evidencija duga | U skladu sa zakonskim obavezama (Zakon o zaštiti potrošača, Zakon o bankama, propisi NBS-a) — minimum 5 godina, do 10 godina za potrošačke kredite |
| Sadržaj sesija (refresh token, OTP) | Do isteka sesije ili 30 dana, šta god je kraće |
| Audit logovi (vreme prijave/odjave) | 1 godina |

## 5. Bezbednost podataka

- Sva komunikacija između aplikacije i naših servera je šifrovana TLS 1.2+ protokolom.
- Aplikacija primenjuje **certificate pinning** — odbija konekciju ako sertifikat servera ne odgovara unapred poznatom skupu otisaka.
- Refresh tokeni i pristupni tokeni čuvaju se u `Android Keystore` / `iOS Keychain` — šifrovano u hardverskom modulu telefona.
- Backup aplikacije na Google Drive / iCloud je onemogućen — podaci ostaju na uređaju.
- Aplikacija primenjuje obfuskaciju koda (R8 / ProGuard) i strip-uje resurse u release verziji.

## 6. Vaša prava (GDPR i ZZPL)

Imate sledeća prava:

- **Pravo na pristup** — možete tražiti kopiju svih podataka koje imamo o vama.
- **Pravo na ispravku** — netačne podatke ćemo ispraviti bez odlaganja.
- **Pravo na brisanje** („pravo da budem zaboravljen") — možete obrisati nalog direktno iz aplikacije: **Podešavanja → Obriši nalog**. Podaci se brišu u skladu sa odeljkom 7 ovog dokumenta.
- **Pravo na ograničenje obrade** — možete tražiti da privremeno zaustavimo obradu vaših podataka.
- **Pravo na prenosivost** — podatke možete dobiti u strukturiranom, mašinski čitljivom formatu (JSON ili CSV).
- **Pravo na prigovor** — možete uložiti prigovor na obradu zasnovanu na legitimnom interesu.

Kontakt za ostvarivanje prava: **privacy@uril.rs**. Odgovaramo u roku od 30 dana.

## 7. Brisanje naloga

Nalog možete obrisati iz aplikacije: **Podešavanja → Obriši nalog**. Posle potvrde:

- Vaš broj telefona se uklanja iz naše baze (zamena vrednošću `NULL`).
- Push token se briše iz Google FCM registra.
- Svi vaši uređaji se deregistruju i sesije gase.
- Ne možete se ponovo prijaviti istim nalogom — ako želite ponovo da koristite aplikaciju, ponovo se registrujete kao nov korisnik.

**Šta ostaje:** podaci o dugovanju, uplatama i istoriji poruka ostaju u sistemu naše kompanije i sistema banke u skladu sa zakonskim obavezama čuvanja (videti odeljak 4). Ovi podaci se anonimizuju u meri u kojoj je to moguće bez kršenja zakonskih obaveza.

## 8. Prijava nadzornom organu

Ako smatrate da je vaše pravo na zaštitu podataka prekršeno, imate pravo na prigovor kod:

**Poverenika za informacije od javnog značaja i zaštitu podataka o ličnosti**
Bulevar kralja Aleksandra 15, 11000 Beograd
office@poverenik.rs
www.poverenik.rs

## 9. Izmene ove politike

Ova politika se može menjati. Bitne izmene biće saopštene kroz aplikaciju ili e-mailom (ako ste ostavili kontakt). Datum poslednje izmene je naveden na vrhu dokumenta.

---

*Ova politika je verzija na srpskom jeziku. Verzija na engleskom jeziku dostupna je [ovde](policy-en.md).*
