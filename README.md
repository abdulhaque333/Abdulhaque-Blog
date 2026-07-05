# Mohammad Abdul Haque — ব্যক্তিগত জার্নাল

বাংলা · العربية (RTL) · English — তিন ভাষায় লেখার জন্য একটা পরিষ্কার, দ্রুত, রুচিশীল static ব্লগ।
কোনো framework নেই; শুধু HTML, CSS ও সামান্য JavaScript। RSS ও sitemap একটা ছোট Python স্ক্রিপ্ট দিয়ে অটো-জেনারেট হয়।

## ফোল্ডার কাঠামো

```
blog/
├── index.html          # হোমপেজ (লেখার তালিকা + ভাষা ফিল্টার)
├── about.html          # পরিচিতি
├── 404.html            # পেজ-নট-ফাউন্ড
├── posts.js            # ⭐ সব লেখার তালিকা — এখানে নতুন লেখা যোগ করবেন
├── generate.py         # posts.js থেকে sitemap.xml + feed.xml বানায়
├── feed.xml            # RSS (অটো-জেনারেটেড)
├── sitemap.xml         # (অটো-জেনারেটেড)
├── robots.txt
├── netlify.toml        # আলাদা Netlify সাইটের কনফিগ
├── assets/
│   ├── style.css       # ডিজাইন (paper/ink, light+dark, বাংলা+আরবি ফন্ট, RTL)
│   └── main.js         # থিম টগল + তালিকা রেন্ডার
└── posts/
    ├── welcome.html            # বাংলা নমুনা
    ├── arabic-reflections.html # আরবি নমুনা (RTL)
    └── on-writing-daily.html   # ইংরেজি নমুনা
```

## নতুন লেখা যোগ করবেন যেভাবে

১. `posts/` থেকে একই ভাষার একটা পোস্ট কপি করুন, নতুন নাম দিন (যেমন `posts/my-post.html`),
   ভেতরের শিরোনাম, তারিখ ও লেখা বদলে দিন।
   - **আরবি**: `<html lang="ar" dir="rtl">` এবং `<article class="article lang-ar" lang="ar" dir="rtl">`
   - **বাংলা**: `lang="bn"` / `class="article lang-bn"`
   - **ইংরেজি**: `lang="en"` / `class="article"`

২. `posts.js`-এর অ্যারের **শুরুতে** একটা এন্ট্রি যোগ করুন (নতুন আগে দেখাবে):

```js
{
  "slug": "my-post",
  "title": "আমার নতুন লেখা",
  "date": "2026-06-15",
  "lang": "bn",
  "excerpt": "ছোট্ট সারমর্ম।",
  "tags": ["ভাবনা"]
},
```

> খেয়াল রাখুন: অ্যারেটি বৈধ JSON — সব key ও string ডাবল-কোটে, শেষ এন্ট্রির পরে কমা নয়।

৩. ফিড ও সাইটম্যাপ আপডেট করুন:

```bash
cd blog && python3 generate.py
```

## লোকালি দেখা

```bash
cd blog
python3 -m http.server 8000
# ব্রাউজার: http://localhost:8000
```

## অনলাইনে প্রকাশ (Netlify) — একবারের সেটআপ

এই রিপোর HandyMate সাইট `docs/` থেকে চলে, তাই ব্লগের জন্য **আলাদা একটা Netlify সাইট** বানান:

1. Netlify → **Add new site → Import an existing project** → এই রিপো বাছুন।
2. **Base directory** = `blog`, **Publish directory** = `blog`, **Build command** = `python3 generate.py`
   (`blog/netlify.toml`-এ এগুলো দেওয়াই আছে, base দিলে নিজে থেকেই ধরবে)।
3. Deploy করুন। এরপর `generate.py`-র উপরে `SITE_URL` আপনার আসল ডোমেইনে বদলে আবার কমিট করুন
   (RSS/sitemap-এর লিংক সঠিক হওয়ার জন্য)।

## টুকিটাকি

- **থিম**: উপরের ☾/☀ বোতামে light/dark; পছন্দ মনে রাখে (এবং সিস্টেম সেটিং অনুসরণ করে)।
- **ফন্ট**: শিরোনাম = Fraunces, ইংরেজি বডি = Source Serif 4, বাংলা = Noto Serif Bengali, আরবি = Amiri।
  Google Fonts থেকে আসে; না এলে সিস্টেম ফন্টে নিরাপদে fallback হয়।
- **রঙ বদলাতে** `assets/style.css`-এর উপরের `:root` (light) ও `[data-theme="dark"]` ভেরিয়েবল এডিট করুন।
