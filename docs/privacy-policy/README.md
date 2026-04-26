# Privacy Policy

`index.html` is the published page; both languages (SR + EN) live on it with hash-based lang switching (`#sr`, `#en`).

`policy-sr.md` and `policy-en.md` are the markdown source. Edit them when text changes, then mirror into the HTML page.

## Hosting

Publish via GitHub Pages from this repo:

1. GitHub repo → **Settings → Pages**
2. Source: **Deploy from a branch**, branch: `master`, folder: `/docs`
3. Save → wait ~1 min → URL is `https://<owner>.github.io/<repo>/privacy-policy/`

That URL goes into:
- Play Console → App content → Privacy Policy URL
- Mobile: `SettingsScreen` link

## Editorial TODO before public release

- [x] UrilSolutions corporate details filled in (Matice srpske 75, Beograd; matični broj 63560073).
- [ ] Confirm `privacy@uril.rs` is monitored — at minimum a forwarder to a real inbox.
- [ ] Pravnik review (preporučeno) — naročito sekcija 4 (retencija) i sekcija 7 (brisanje), jer NBS i ZZP imaju specifične rokove čuvanja koje treba da pravnik potvrdi.
- [ ] Update version + effective date when first published; bump on every material change.
