# Session Handover: Fix ungated createOrUpdateRules() in CodacyCloud.clear()

> **Created:** 2026-02-19
> **From session:** Investigating and disabling Codacy for wiki/docs-only repos; discovered a bug in the Codacy VS Code extension
> **Target workspace:** `c:\Code - Libraries\codacy-vscode-extension`
> **Recommended model:** Medium (Sonnet) — well-defined single-function bug fix with clear pattern to follow

## Completed Work

- **Disabled Codacy for 5 wiki repos**: Added `.codacy/` to `.gitignore` and untracked committed Codacy files in Asset Registry Wiki, Matterhorn Wiki, Data Sheets, IRFQ Lötschberg. Obligations Wiki already had this.
- **Added per-repo settings**: Created `.vscode/settings.json` with `"codacy.guardrails.instructionsFile": "manual"` in all 5 wiki repos + Skills Common to prevent local `codacy.instructions.md` auto-creation.
- **Removed `codacy.instructions.md` from Skills Common**: Was polluting global AI context in every workspace that includes Skills Common as a folder (all of them). Already gitignored, just needed `git rm --cached`.
- **Forked codacy-vscode-extension**: Forked to `ralphpw/codacy-vscode-extension`, cloned to `c:\Code - Libraries\codacy-vscode-extension`.

## Remaining Work

### Task: Fix the bug and submit PR

**The Bug:** In `CodacyCloud.clear()` (line 549), `createOrUpdateRules()` is called whenever `isMCPConfigured()` is true, **without checking** the `codacy.guardrails.instructionsFile` setting. Every other call site in the codebase guards with:

```typescript
const generateRules = vscode.workspace.getConfiguration().get('codacy.guardrails.instructionsFile')
if (isMCPConfigured() && generateRules === 'automatic') {
    await createOrUpdateRules(...)
}
```

But `clear()` does:

```typescript
if (isMCPConfigured()) createOrUpdateRules()  // BUG: missing generateRules check
```

This means even with `"manual"` configured, the instructions file gets recreated when switching repos or clearing state.

**Files to read first:**
1. `c:\Code - Libraries\codacy-vscode-extension\src\git\CodacyCloud.ts` — lines 546-555 contain the buggy `clear()` method; lines 103 and 170 show the correct pattern
2. `c:\Code - Libraries\codacy-vscode-extension\src\test\suite\codacyCloud\codacyCloud.test.ts` — existing test file (mostly empty, has scaffolding)
3. `c:\Code - Libraries\codacy-vscode-extension\src\commands\createRules.ts` — contains `createOrUpdateRules()` function (line 291+)
4. `c:\Code - Libraries\codacy-vscode-extension\src\commands\configureMCP.ts` — contains `isMCPConfigured()` export

**Files to modify:**
1. `c:\Code - Libraries\codacy-vscode-extension\src\git\CodacyCloud.ts` — line 549: add the `generateRules === 'automatic'` guard to `clear()`
2. `c:\Code - Libraries\codacy-vscode-extension\src\test\suite\codacyCloud\codacyCloud.test.ts` — add tests proving the fix

**The Fix (line 549 of CodacyCloud.ts):**

Change:
```typescript
if (isMCPConfigured()) createOrUpdateRules()
```

To:
```typescript
const generateRules = vscode.workspace.getConfiguration().get('codacy.guardrails.instructionsFile')
if (isMCPConfigured() && generateRules === 'automatic') createOrUpdateRules()
```

**Key decisions already made:**
- The fix follows the exact same pattern used at lines 103/170 in the same file — no new convention needed
- The user insists on a unit test that demonstrates the bug and the fix before submitting the PR
- The fork is at `ralphpw/codacy-vscode-extension`, PR goes against `codacy/codacy-vscode-extension` `main`

**Test approach:**
- The existing test file uses sinon for mocking and has `MockRepository` + `MockExtensionContext` stubs
- Write a test that: (1) stubs `isMCPConfigured` to return `true`, (2) stubs `vscode.workspace.getConfiguration().get('codacy.guardrails.instructionsFile')` to return `'manual'`, (3) calls `clear()`, (4) asserts `createOrUpdateRules` was NOT called
- Write a companion test with `'automatic'` that asserts it IS called
- Look at how `configureMCP.ts` tests (if any) mock `isMCPConfigured` for guidance

**PR description should include:**
- Bug: `CodacyCloud.clear()` calls `createOrUpdateRules()` without checking `codacy.guardrails.instructionsFile` setting
- Impact: Instructions file is recreated even when user has explicitly set `"manual"`, defeating the purpose of the setting
- Fix: Add the same `generateRules === 'automatic'` guard used in all other call sites
- Tests: Added unit tests verifying the fix

**Constraints:**
- This project uses mocha + sinon for testing
- The `gh` CLI is not installed; PR must be created via GitHub web UI or by installing `gh` first
- The repo remote is `origin` pointing to `ralphpw/codacy-vscode-extension`

## Prompt for New Session

Paste this into a fresh Copilot chat:

```
Read `c:\Code - Libraries\codacy-vscode-extension\TODO-Fix-Clear-Bug.md` and execute the remaining work described in it. Fix the bug, write the tests, commit, push, and help me create the PR.
```
