# SC3010: Axios npm supply-chain reproduction

This project demonstrates a transitive dependency executing code during `npm install`, while the victim application continues to work. Every package is a locally authored stand-in. The only simulated payload is a fixed proof-of-execution text file inside the installed dependency.

## Run

Use Node.js 20 or newer and npm 10 or newer, already installed on macOS. No other dependencies are needed. From this directory in the VS Code terminal:

```sh
npm run setup
npm run demo:all
```

`setup` packs three local tarballs and verifies the clean baseline. `demo:all` creates fresh vulnerable and protected victim directories, installs the same compromised tarball in each, runs the application, and checks the results. It prints the actual npm commands and npm's captured output. There are no manual prompts or artificial delays. Any failed check exits with a nonzero status instead of printing PASS.

Setup and installation use offline mode with audit, funding, and update notifications disabled. npm uses a project-local cache and empty user/global config files. Child npm processes discard inherited `npm_config_*` settings so a personal `ignore-scripts` setting cannot silently change the experiment. No demonstration code makes network requests, reads credentials, or downloads malware. Research links below are for reading separately.

## The real incident

On March 31, 2026, an attacker used a hijacked Axios maintainer npm account to publish compromised versions `1.14.1` and `0.30.4`. Axios's source code stayed unchanged; its package manifest gained `plain-crypto-js@4.2.1` as a runtime dependency. npm resolved that dependency and executed its `postinstall` hook during installation. The hook ran an obfuscated dropper that retrieved platform-specific remote access malware. See [Unit 42's attack analysis, especially “Details of the Axios Supply Chain Attack”](https://unit42.paloaltonetworks.com/axios-supply-chain-attack/).

The other supplied reference is [Trend Micro's Axios incident report](https://www.trendmicro.com/en_gb/research/26/c/axios-npm-package-compromised.html). The mechanism described here follows Unit 42's analysis.

## What this reproduces

```text
victim application
  └─ axios-demo@1.14.1         unchanged application code
       └─ plain-crypto-js@4.2.1
            └─ postinstall → PROOF_OF_EXECUTION.txt
```

The clean package is `axios-demo@1.14.0`; the compromised package is `axios-demo@1.14.1`. Their `index.js` files are byte-for-byte identical. Besides the version number, the compromised manifest adds only one dependency. The victim declares only `axios-demo`: npm, rather than our runner, installs the transitive dependency and invokes its lifecycle hook.

The package name `axios-demo` distinguishes the imitation from real Axios. Its promise-based `get('/course')` returns a fixed local response; it is not a complete HTTP client. This implements the `1.14.1` branch of the mechanism, not a separate `0.30.4` example. The locally authored `plain-crypto-js` uses the incident's name and version for recognition, but contains none of the original malicious code. The demo omits account takeover, registry publication, obfuscation, malware delivery, persistence, and forensic cleanup.

`npm pack` creates real tarballs. Setup rewrites the compromised package's transitive `file:` dependency to an absolute local tarball path in a temporary staging directory before packing. This avoids relative-path ambiguity when npm installs the tarball elsewhere. The npm file specification uses raw spaces rather than URL encoding. Re-run setup after moving the project; the generated compromised archive is specific to this checkout's location. No local registry or server is required.

`--foreground-scripts` makes npm's real lifecycle output visible. The vulnerable install explicitly uses `--ignore-scripts=false`; the protected install uses `--ignore-scripts`. Both install identical archives, checked through lockfile integrity values and installed source bytes.

## Results and verification

```sh
npm test
```

The test rebuilds all archives, verifies the clean application, and runs both demonstrations twice. Before the second run it plants stale files, including a proof file in the protected directory, to check that automatic cleanup removes them. It also copies the source to a temporary directory whose path contains spaces and verifies setup and the demo there, then removes that copy. Each demonstration also checks:

- npm's dependency tree contains the expected transitive dependency.
- The installed parent manifest adds the expected local dependency.
- The installed application code matches the clean source.
- The dependency's source and lifecycle script match the harmless local package.
- The vulnerable proof file has the exact expected content and the hook's output appears.
- The protected proof file is absent and the hook's output does not appear.
- Both applications return the asserted status and course data.
- All lockfile resolutions are local; both cases use the same package integrity values.

After a run, inspect:

```text
.demo/vulnerable/node_modules/plain-crypto-js/PROOF_OF_EXECUTION.txt
.demo/protected/node_modules/plain-crypto-js/   (no proof file)
.demo/results.json                            (checked results and integrity values)
```

Every demo run deletes and recreates just the two generated victim directories. Setup deletes and recreates `dist/` and `.demo/`. Keep personal files outside those directories. The npm cache remains between demo runs for speed; setup recreates it, so verification also exercises a fresh cache.

## Why the mitigation helps

According to [npm's `ignore-scripts` documentation](https://docs.npmjs.com/cli/v11/commands/npm-install/#ignore-scripts), this option prevents package scripts from running during installation. The compromised dependency is still installed, but its hook cannot create the proof file. This blocks the reproduced install-time execution path.

It does not remove or certify the dependency. Malicious code could run later when imported, called, or explicitly executed. Explicit `npm run` commands still execute the named script even with `ignore-scripts`; legitimate packages may also need installation scripts to build native code or prepare assets. Use reviewed dependency changes, vetted package sources, lockfiles and integrity checks, and isolated build environments alongside lifecycle restrictions. A lockfile can faithfully pin a malicious package, so integrity alone does not establish trust.

## Files

```text
packages/axios-clean/          clean manifest and local API
packages/axios-compromised/    same API, one added dependency
packages/plain-crypto-js/      harmless dependency and real postinstall
victim/app.cjs                 application with response assertions
scripts/common.mjs            npm execution and fresh victim creation
scripts/setup.mjs             packaging and clean baseline check
scripts/demo.mjs              attack/mitigation comparison and assertions
scripts/test.mjs              repeat-run and cleanup verification
RECORDING_GUIDE.md             one-minute screen plan and narration
dist/                         generated tarballs and local npm cache
.demo/                        generated installations and evidence
```
