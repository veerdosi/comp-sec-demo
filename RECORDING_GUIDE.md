# One-minute VS Code recording on macOS

## Before recording

1. Open this project folder in VS Code. Run `npm run setup`, then `npm test` in the integrated terminal. Both must exit successfully.
2. Open `packages/axios-compromised/package.json` and `packages/plain-crypto-js/postinstall.js` in editor tabs. Keep the dependency entry and hook readable.
3. Use a 16–18 px terminal font, a wide window (about 120 columns), and enough terminal height for roughly 45 lines. Hide the sidebar if needed. Clear the terminal with Command-K, or use `clear`.
4. Have `npm run demo:all` ready to type. Only this command needs to run during recording. It shows PROTECTED first and waits for Enter before VULNERABLE. Keep the pause while explaining the safe result, then press Enter at about 38 seconds. The complete output should fit in the expanded terminal; scroll briefly if your screen is smaller. Turn off Wi-Fi if you want to visibly demonstrate offline operation.

## Screen plan and exact narration

Read the quoted sentences verbatim at about 140 words per minute. Use the timestamps as pacing marks; pause as needed to reach the next mark. A rehearsal sets the exact 60-second duration for your speaking pace.

| Time | Show | Say |
| --- | --- | --- |
| 00–12 s | Compromised manifest; point at `plain-crypto-js`. | “Attackers compromised Axios by adding a dependency without changing its application code. This offline reproduction uses local packages and a harmless postinstall hook to show the confidentiality risk.” |
| 12–23 s | Open `postinstall.js`; point at the fixed `.env` read and boolean receipt. | “Both installations receive a synthetic environment file with a fake API key. The hook reads only this fixture and verifies it without printing or copying the key.” |
| 23–38 s | Run `npm run demo:all`. Hold at the Enter prompt; point at PROTECTED, BLOCKED, and the working application. | “First, the protected installation uses ignore-scripts. The compromised dependency is installed, but its hook never runs. Credential access is blocked, no proof file appears, and the application still works.” |
| 38–50 s | Press Enter. Point at VULNERABLE, SUCCESS, and the proof result. | “Now I press Enter. The vulnerable installation runs the same dependency's hook. It successfully reads the dummy credential and creates evidence, while the application continues working normally.” |
| 50–60 s | Keep PASS and both credential-access results visible. | “The checks verify identical packages and repeatable results. Ignore-scripts blocks installation hooks, but imported malicious code could still read files later. Dependency review remains necessary.” |

The terminal's npm output is captured from real subprocesses and printed after each command finishes. “Verified” and “PASS” appear only after filesystem, dependency-tree, lockfile, and application checks succeed. Timing varies with the machine. The only deliberate wait is the Enter prompt between the protected and vulnerable stages. No real credential is accessed and the fake key is never printed.
