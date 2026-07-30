# רשימת הגדרה — לפי הסדר

iPhone 17 Pro, iOS 26.x, ממשק iOS באנגלית. בצע לפי הסדר; שלב 4 תלוי בשלב 3, ושלב 6 תלוי בשלב 5.

---

## 1. מקלדת עברית והכתבה

זה המסלול היחיד האמין להקלדה בדיבור בעברית במכשיר. הוא לא עובר דרך Siri ולא דרך Apple Intelligence.

1. `Settings > General > Keyboard > Keyboards > Add New Keyboard…` ← `Hebrew`.
2. `Settings > General > Keyboard > Enable Dictation` ← `On`.
3. אם מופיע `Settings > General > Keyboard > Dictation Languages` — הוסף `Hebrew`. אם אין סעיף כזה, שפת ההכתבה נגזרת מהמקלדת הפעילה. **UNVERIFIED** — לא ידוע לי בוודאות איזה משני המצבים קיים ב-iOS 26.
4. `Settings > General > Keyboard > Auto-Correction` ← `On`. תיקון אוטומטי בעברית משפר משמעותית את פלט ההכתבה.

**בדיקה:** פתח Notes, הקש על גלובוס 🌐 עד שהמקלדת עברית, הקש על אייקון המיקרופון במקלדת ודבר עברית. הטקסט אמור להופיע בעברית.
אם יוצאות מילים באנגלית — המקלדת הפעילה אנגלית. ההכתבה הולכת אחרי המקלדת, לא אחרי מה שאתה מדבר.

## 2. אפליקציית ChatGPT

1. התקן מ-App Store.
2. התחבר לחשבון. **חובה** — בלי חשבון, שלב 4 לא יעביר את ה-Custom Instructions.
3. אם קיים `ChatGPT app > Settings > Speech > Main Language` — הגדר `Hebrew` במקום `Auto-Detect`. **UNVERIFIED** — לא ידוע לי אם השדה קיים בגרסה הנוכחית. אם אינו קיים, דלג; זיהוי אוטומטי עובד.

## 3. Custom Instructions

1. `ChatGPT app` ← אווטאר/פרופיל ← `Settings > Personalization > Custom Instructions`.
2. הדבק את הבלוק הראשי מ-`custom-instructions.md` לשדה `Anything else ChatGPT should know about you?`.
3. הדבק את בלוק ה-Traits לשדה `What traits should ChatGPT have?`.
4. אם אתה רוצה גם את תוספת הדיבור — ראה `voice-mode-addendum.md`, שם יש טבלת סכומי תווים. עם התוספת, השתמש בגרסה המצומצמת של הבלוק הראשי.
5. ודא ש-`Enable for new chats` פעיל.
6. שמור.

**בדיקה:** פתח שיחה חדשה, כתוב `what time is it in Tokyo` באנגלית. התשובה אמורה לחזור בעברית.

## 4. הרחבת Siri ↔ ChatGPT

1. `Settings > Apple Intelligence & Siri > ChatGPT`.
2. הקש `Set Up` (או `Sign In` אם ההרחבה כבר פעילה אנונימית).
3. **התחבר לחשבון ChatGPT שלך.** זו הנקודה הקריטית בכל השלב הזה: ה-Custom Instructions מגיעות להרחבה **רק** כשמחוברים לחשבון. במצב אנונימי מקבלים מודל בסיסי בלי הוראות, והתשובות יחזרו באנגלית.
4. `Confirm ChatGPT Requests` ← `On`, לפחות בשבוע הראשון. זה מציג אישור לפני כל העברה ל-ChatGPT, וכך רואים מתי Siri מעביר ומתי הוא עונה בעצמו. אחר כך אפשר לכבות.
5. `Settings > Apple Intelligence & Siri > Siri > Language` — ודא `English`. עברית לא קיימת ברשימה ולא תופיע בה.

**מה מקבלים מזה בפועל:** אתה מדבר אנגלית ל-Siri, Siri מתמלל לאנגלית, ההרחבה מעבירה ל-ChatGPT, וה-Custom Instructions גורמות לתשובה לחזור בעברית — **בטקסט על כרטיס התשובה**. Siri לא יקריא אותה בקול. אין TTS בעברית.

## 5. Voice Mode

1. `ChatGPT app` ← אייקון הדיבור בפינת תיבת ההקלדה.
2. דבר עברית. עונה בעברית, בקול.

זה המסלול הקולי הדו-כיווני היחיד שעובד. לא Siri, לא Apple Intelligence.

## 6. קיצורים

בנה לפי `shortcuts/README.md`, ואז שייך:

1. `Settings > Accessibility > Touch > Back Tap > Double Tap` ← `ערוך הודעה`.
2. `Settings > Action Button` ← החלק ל-`Shortcut` ← `Choose a Shortcut` ← `שאל בעברית`.
3. `Settings > Notifications > Shortcuts > Allow Notifications` ← `On`.

## 7. מה לדלג עליו במכוון

- **Apple Writing Tools** — אין תמיכה בעברית ב-Apple Intelligence, ובנוסף Meta חוסמת אותם בתוך WhatsApp. אל תנסה להפעיל אותם שם.
- **Siri בעברית** — לא קיים כשפת קלט ולא כ-TTS. אין הגדרה, אין עקיפה, אין פרופיל אזורי שפותח את זה.
- **הקראת תשובות Siri בעברית** — נובע מאותה סיבה.

---

# פתרון תקלות

| תסמין | הסיבה הסבירה ביותר | תיקון |
|---|---|---|
| Siri עונה בעצמו במקום להעביר ל-ChatGPT | Siri זיהה את הבקשה כמשהו שהוא יודע לטפל בו בעצמו (שעון, מזג אוויר, טיימר, עובדה קצרה). **בדיקה: חפש את ה-badge של ChatGPT על כרטיס התשובה.** אין badge = התשובה מ-Siri, וה-Custom Instructions לא נגעו בה בכלל | פתח את הבקשה ב-"Ask ChatGPT…". הפעל `Confirm ChatGPT Requests` כדי לראות מתי ההעברה קורית. נסח מחדש כשאלה פתוחה — Siri מעביר בעיקר בקשות ידע וניסוח |
| התשובה חוזרת באנגלית דרך Siri | לא מחובר לחשבון ChatGPT ב-`Settings > Apple Intelligence & Siri > ChatGPT`. במצב אנונימי ה-Custom Instructions לא נטענות | התחבר לחשבון שם. אם כבר מחובר — ודא badge (השורה למעלה); סביר שהתשובה בכלל לא הגיעה מ-ChatGPT |
| התשובה חוזרת באנגלית באפליקציה עצמה | `Enable for new chats` כבוי, או ההוראות הודבקו לשדה הלא נכון | `Settings > Personalization > Custom Instructions` — ודא שהבלוק בשדה הארוך והמתג פעיל. פתח שיחה **חדשה**; שיחות ותיקות לא נטענות מחדש |
| התשובה מתחילה בעברית וגולשת לאנגלית באמצע | היגררות לשפת ההקשר. קורה בעיקר סביב קוד, ציטוטים ורשימות | זה מה שסעיף הבדיקה העצמית אמור לתפוס. אם חוזר — עבור לגרסה האנגלית של הבלוק ב-`custom-instructions.md` |
| ChatGPT שואל "did you mean…" על כל הודעה מתומללת | סעיף השחזור השקט לא נטען, או שההוראות נקטעו בהדבקה | הדבק מחדש. ודא שהטקסט לא נחתך במגבלת התווים של השדה |
| Siri לא מבין עברית מדוברת | התנהגות צפויה. אין ל-Siri עברית | השתמש בהכתבת מקלדת (שלב 1) או ב-Voice Mode של ChatGPT (שלב 5) |
| הכתבה מקלידה מילים באנגלית | המקלדת הפעילה אנגלית. ההכתבה הולכת אחרי המקלדת | הקש גלובוס 🌐 למקלדת עברית **לפני** שמקישים על המיקרופון |
| הקיצור מחזיר טקסט ריק | הלוח היה ריק, או שפעולת ChatGPT לא החזירה כלום | ה-`If` בשלב 3 אמור לתפוס לוח ריק. אחרת הוסף `Quick Look` על `[OUT]` וראה מה חוזר בפועל |
| הקיצור נפתח באפליקציית ChatGPT במקום להחזיר טקסט | לפעולה יש פרמטר פתיחה פעיל, או שהיא בכלל לא מחזירה טקסט | כבה `Open in App` / `Show When Run`. אם אין פרמטר כזה — עבור ל-Build 2 (API) |
| `401` מה-API | מפתח שגוי, פג, או `Bearer ` חסר לפני המשתנה | בדוק את ערך ה-header. חייב להיות המילה `Bearer`, רווח, ואז המפתח |
| `429` מה-API | חריגת קצב או אזלה מכסה | בדוק billing ב-`platform.openai.com`. אם זה קצב — המתן ונסה שוב |
| `404` על המודל מה-API | `MODEL_ID` לא קיים או לא זמין למפתח שלך | שלוף רשימה בפועל: `GET https://api.openai.com/v1/models` עם אותו header |
| ה-JSON נשבר על טקסט מסוים | גוף הבקשה הורכב כטקסט חופשי במקום דרך שדות ה-JSON של הפעולה | בנה מחדש דרך `Request Body: JSON` עם שדות. מרכאות וירידות שורה מהלוח שוברות JSON ידני |
| Back Tap לא מגיב | כיסוי עבה, או שהקיצור מחכה לביטול נעילה | בטל נעילה ונסה שוב. הסר כיסוי ובדוק. `Settings > Accessibility > Touch > Back Tap` — ודא שהשיוך קיים |
| הקיצור מבקש הרשאה בכל הרצה | הרשאת לוח או רשת לא אושרה לצמיתות | אשר `Always Allow` בפרומפט. `Settings > Apps > Shortcuts` — עבור על ההרשאות |
| ההתראה בסוף הקיצור לא מופיעה | התראות חסומות ל-Shortcuts, או Focus פעיל | `Settings > Notifications > Shortcuts > Allow Notifications` ← `On`. בדוק גם `Settings > Focus` |
| הקיצור לא מופיע בתפריט השיתוף | `Show in Share Sheet` כבוי, או שסוגי הקלט לא כוללים `Text` | `ⓘ` בעורך הקיצור ← `Show in Share Sheet: On` ← `Share Sheet Types` ← סמן `Text` |
| ב-WhatsApp אין אפשרות שיתוף על טקסט מסומן | WhatsApp מציעה `Copy` ולא תמיד `Share` | השתמש בזרימת ההעתקה: `Copy` ← Back Tap ← `Paste`. זו הסיבה שיש שתי גרסאות לקיצור |
| Writing Tools לא מופיעים ב-WhatsApp | Meta חוסמת אותם. אין לזה עקיפה | השתמש בקיצור. אל תחפש הגדרה שתפתור את זה — אין כזו |
| Voice Mode עונה באנגלית | המשפט הראשון נאמר באנגלית, או שזיהוי השפה החליק | אמור משפט פתיחה מלא בעברית. אם קיים `Settings > Speech > Main Language` באפליקציה — קבע `Hebrew` |
| Voice Mode עונה בעברית כתובה־גבוהה, ארוך מדי | תוספת הדיבור לא הודבקה, או נקטעה במגבלת התווים | ראה `voice-mode-addendum.md`, כולל טבלת סכומי התווים |

---

## מה לא אומת

לא בדקתי אף שלב כאן על מכשיר, ואין לי גישה למכשיר. מסלולי ה-`Settings` נכונים ל-iOS 26 לפי מיטב ידיעתי, אבל שמות תפריטים משתנים בין גרסאות משנה. הפריטים שסומנו במפורש **UNVERIFIED** — קיום `Dictation Languages`, קיום `Speech > Main Language` באפליקציה, ופעולות ה-ChatGPT ב-Shortcuts — הם אלה שהכי סביר שיהיו שונים אצלך.
