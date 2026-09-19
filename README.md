# BF3122 — Applied Concept Quiz

A self-quizzing tool for **BF3122 Carbon Markets & Pricing Fundamentals**, covering Weeks 1–4 (Quiz 1 scope).

**77 multiple-choice questions.** Every one tests applied or conceptual understanding — choosing an
instrument for a stated objective, predicting what a policy change does, diagnosing which quality
criterion a described project fails. None asks you to recall a statistic, date or figure. Where numbers
appear they are scenario inputs to reason with.

## Using it

Pick topics (or a week), choose **Instant** feedback for learning or **Exam** mode to simulate the real
thing, and go. You can navigate backwards, as in the actual quiz. At the end you get a per-topic
breakdown and a full review with a rationale for *every* option — including why the near-miss
distractors are only partly true.

Keyboard: <kbd>1</kbd>–<kbd>4</kbd> to answer, <kbd>←</kbd> <kbd>→</kbd> to move.

## Topics

Mapped 1:1 to the eight headings in the lecturer's revision guide:

| # | Topic | Week | Qs |
|---|---|---|---|
| 1 | Externalities & the case for a carbon price | 1 | 7 |
| 2 | Pricing instruments & firm response (MACC) | 1 | 10 |
| 3 | Carbon allowances vs carbon credits | 1 | 9 |
| 4 | Internal Carbon Pricing | 2 | 11 |
| 5 | International agreements (Kyoto ↔ Paris) | 3 | 10 |
| 6 | Article 6 in practice & Singapore's carbon tax | 3–4 | 12 |
| 7 | VCM ecosystem & actors | 4 | 8 |
| 8 | Credit quality & market boundaries | 4 | 10 |

Content is drawn from the lecture slides and their annotations, weighted towards material flagged as
important, plus the topics listed in the revision spreadsheet.

## Files

```
index.html       markup + styles
app.js           quiz logic (vanilla JS, no dependencies)
questions.json   all content
```

To edit or add a question, edit `questions.json` only. Each entry:

```jsonc
{
  "id": "q001",
  "topic": "t1",            // matches topics[].id
  "week": 1,
  "difficulty": 2,          // 1 core · 2 standard · 3 hard
  "skill": "apply",         // apply | compare | predict | diagnose
  "stem": "…",
  "options": ["…","…","…","…"],
  "answer": 1,              // 0-based index into options
  "rationales": ["…","…","…","…"],   // one per option, same order
  "takeaway": "One-line principle.",
  "source": "W1 p17; XL row 17"      // slide / spreadsheet provenance
}
```

The app reads the file at load, so a committed edit is live on the next refresh.

Run locally with any static server (opening `index.html` from disk will fail, because browsers block
`fetch` on `file://`):

```bash
python -m http.server 8000
```
