# One-minute VS Code recording on macOS

## Before recording

1. Open this project folder in VS Code. Run `npm run setup`, then `npm test` in the integrated terminal. Both must exit successfully.
2. Open `packages/axios-compromised/package.json` and `packages/plain-crypto-js/postinstall.js` in editor tabs. Keep the dependency entry and hook readable.
3. Use a 16–18 px terminal font, a wide window (about 120 columns), and enough terminal height for roughly 40 lines. Hide the sidebar if needed. Clear the terminal with Command-K, or use `clear`.
4. Have `npm run demo:all` ready to type. Only this command needs to run during recording. The complete output should fit in the expanded terminal; scroll briefly if your screen is smaller. Turn off Wi-Fi if you want to visibly demonstrate offline operation.

## Screen plan and exact narration

Read the quoted sentences verbatim at about 140 words per minute. Use the timestamps as pacing marks; pause as needed to reach the next mark. A rehearsal sets the exact 60-second duration for your speaking pace.

| Time | Show | Say |
| --- | --- | --- |
| 00–15 s | Compromised package manifest; point at `plain-crypto-js`. | “On March thirty-first, twenty twenty-six, attackers published compromised Axios versions with unchanged application code. They added plain-crypto-js as a dependency. This local demonstration reproduces that installation mechanism using harmless packages.” |
| 15–25 s | Open `postinstall.js`; point at the file write. | “The dependency has a real postinstall hook. Its only payload writes this proof file inside node_modules. It never accesses credentials or makes network requests.” |
| 25–38 s | Expand terminal and run `npm run demo:all`. Point at VULNERABLE and the hook output. | “I run the automated comparison. In the vulnerable installation, npm resolves the transitive dependency and executes its hook. The proof file is created, and the application still works.” |
| 38–49 s | Point at PROTECTED, `--ignore-scripts`, and ABSENT. | “The protected installation uses the same packages with ignore-scripts. The dependency is installed, but its hook is blocked. The proof file is absent, and the application works again.” |
| 49–60 s | Keep both results and PASS visible. | “The checks verify identical package integrity and both application results. Ignore-scripts blocks installation hooks, but malicious code could still execute later when imported. Reviewing dependency changes remains necessary.” |

The terminal's npm output is captured from real subprocesses and printed after each command finishes. “Verified” and “PASS” appear only after filesystem, dependency-tree, lockfile, and application checks succeed. Timing varies with the machine; the runner adds no waits.
