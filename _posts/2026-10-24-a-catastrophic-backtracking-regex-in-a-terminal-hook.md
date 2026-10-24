---
title: A catastrophic-backtracking regex in a terminal hook
description: A secret-masking rule in codigest's shell capture could be split 2^(n-1) ways on a run of n letters, so one ingest ran for minutes at full CPU; how it showed up, why Python's re and Rust's regex differ, and the one-line fix.
tags: [security, regex, codigest]
---

## Context

[codigest](https://github.com/NaNIsaac/codigest) can hook a shell (`cdg term install`) so that the
output of every command is kept for later. Before anything is stored, the output goes through a
redaction pass that masks things that look like secrets: `password=...`, private key blocks, and,
since a change on a feature branch, keys written in camelCase or PascalCase such as `SessionToken`
or `AccountKey`. That last rule is the subject here. It never reached a release: the installed
Python build (0.12.2) and the Rust build did not contain it. It was caught on the branch and fixed
before the branch was merged ([codigest#26](https://github.com/NaNIsaac/codigest/issues/26)).

## What I found

### Symptom

A benchmark of the hook's overhead sat on one `cdg term ingest` for 10 minutes at 100 % of a core.
The ingest itself is normally a fraction of a second. On the feature branch, an ingest whose
captured output was a short run of letters returned in 0.45 s at 20 letters and was still running
after 60 s at 200. The released Python build returned in 0.3 s and the Rust build in 0.02 s at
every length.

### Cause

The rule looked for a key name preceded by any number of words, so that `awsSecretAccessKey` or
`AWSSessionToken` is caught by its last word. The leading part was

```text
(?:[A-Za-z][a-z0-9]*)*?
```

a lazily repeated group, each repetition one letter followed by any number of lowercase letters or
digits. On a run of $$n$$ lowercase letters, every letter can either start a new repetition or
continue the current one, so the run can be split into words in $$2^{n-1}$$ ways. When no key name
follows, the match fails, and a backtracking engine has to try every split before it gives up.
Timing that pattern alone: 0 ms at 14 letters, 2 ms at 16, 7 ms at 18, 26 ms at 20, about four
times longer for every two more letters. That is the signature of exponential backtracking, and
the redaction pass hands it every line of output.

The Rust port of the same rule was not affected. Rust's `regex` crate does not backtrack: it
guarantees matching time linear in the input, and gives up features like backreferences for it.
Python's `re` is a backtracking engine, so the same pattern text has different worst-case behaviour
in the two builds.

### Fix

Make the split unambiguous. An optional first word in lowercase, then words that each start with a
capital letter:

```text
(?:[a-z][a-z0-9]*)?(?:[A-Z][a-z0-9]*)*?
```

A run of lowercase letters can now only be the first word, and every later word boundary is fixed
by a capital letter, so the number of splits left to try grows with the length of the run instead
of doubling with every letter. This matches what a camelCase or
PascalCase name is anyway; the old group accepted splits no identifier would use.

The fix ([df09426](https://github.com/NaNIsaac/codigest/commit/df09426)) came with tests written
before it: a timing test that runs the redaction on a long run of letters in a subprocess and fails
if it takes a second or more, and ten camelCase cases, seven that must be masked and three
look-alikes that must not (`maxtokens`, `passkey`, `myTokenizer`), whose expected results were
pinned from the rule's behaviour before the change. With the patched pattern, every input up to
20,000 characters in the families tried returned in under a second, and the full suite passed
locally: 222 tests. The fix went into main with
[codigest#22](https://github.com/NaNIsaac/codigest/pull/22).

### What I take from it

A redaction rule runs on input nobody chose: whatever a command happened to print. That makes its
worst case the case that matters. Two habits would have caught this before the benchmark did:

- for every regex that scans untrusted text, ask whether a run of the same character class can be
  matched in more than one way by a repeated group (here, `[A-Za-z][a-z0-9]*` repeated, where the
  first class contains the second);
- give the redaction pass a timing test on long, unremarkable input, not only correctness tests on
  short lines that do contain secrets.

## Next

The cases are shared: the Rust tests read the same fixture file as the Python ones. The timing test
lives on the Python side, where the engine can backtrack. This note does not cover the other rules in
`redact.py`; checking each of them for the same shape is the obvious next step.
