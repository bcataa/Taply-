# Push Taply pe GitHub (ca să poți deploy pe Railway)

Repo-ul Git e deja inițializat și am făcut primul commit. Mai ai de făcut doar:

---

## 1. Creează un repository pe GitHub

1. Mergi pe [github.com](https://github.com) și loghează-te.
2. Click pe **+** (dreapta sus) → **New repository**.
3. **Repository name**: de ex. `taply` (sau orice nume vrei).
4. Lasă **Private** sau alege **Public**.
5. **Nu** bifa „Add a README” sau „Add .gitignore” – repo-ul trebuie gol.
6. Click **Create repository**.

---

## 2. Conectează proiectul și dă push

În Terminal, în folderul proiectului Taply, rulează (înlocuiește `TUSER` cu username-ul tău de GitHub):

```bash
cd "/Users/b.cata/Library/Mobile Documents/com~apple~CloudDocs/Cursor /Taply"

git remote add origin https://github.com/TUSER/taply.git
git push -u origin main
```

Dacă repo-ul tău are alt nume decât `taply`, schimbă în URL: `https://github.com/TUSER/NUMELE-REPO-ului.git`.

La `git push` te va întreba de username și parolă. Pentru parolă folosește un **Personal Access Token** (nu parola de la cont): GitHub → Settings → Developer settings → Personal access tokens → Generate new token (bifează `repo`).

---

## 3. După push

- Repo-ul tău pe GitHub va avea tot codul Taply.
- Poți conecta acest repo la **Railway** (vezi **DEPLOY.md**, secțiunea Railway) și deploy-ul se face automat la fiecare push.

Gata.
