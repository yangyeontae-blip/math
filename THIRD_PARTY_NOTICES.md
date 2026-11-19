# Third-party notices

## Role-based game typography

- Titles and world signs: Maplestory Bold, copyright Nexon Korea Corporation. Official terms: https://maplestory.nexon.com/Media/Font. Unmodified font distribution and software embedding are permitted with the original copyright notice; selling or altering the font is prohibited.
- Body copy and numerals: Lotte Mart Dream Medium / Bold, copyright LOTTE Mart. Terms and embedding permission: https://www.sandollcloud.com/free-font/16813/LotteMartDream. Unmodified fonts are free for personal and commercial use; font modification, sale and CI/BI use are prohibited. Used for interface copy, not the game's logo.
- Buttons and tabs: Jua by Woowa Brothers, distributed through `@fontsource/jua` under SIL OFL 1.1.
- Short notes and NPC dialogue: Nanum Pen Script by NHN Corporation, under SIL OFL 1.1.
- Original TTF files remain unchanged. Complete notices and upstream/distribution links accompany them in `public/fonts/cozy/LICENSES.txt`, `Jua-OFL.txt` and `NanumPenScript-OFL.txt`. The in-game copyright dialog links to these notices.
- Previously bundled notebook fonts below remain available as fallbacks.

## Local notebook typography (OFL 1.1)

- `public/fonts/berry-forest-sans.woff2` is a renamed Korean/Latin subset of Noto Sans KR, retaining its variable weight axis.
- `public/fonts/berry-notebook-serif.woff2` is a renamed, static 700-weight title subset of Noto Serif KR.
- Noto Sans KR: Copyright 2014-2021 Adobe (http://www.adobe.com/), with Reserved Font Name 'Source'. Noto Serif KR: Copyright 2017-2023 Adobe (http://www.adobe.com/). Both derivatives remain under the SIL Open Font License 1.1.
- Complete licenses accompany the fonts: `public/fonts/LICENSE-NotoSansKR.txt` and `public/fonts/LICENSE-NotoSerifKR.txt`.
- Upstream: https://github.com/google/fonts/tree/main/ofl/notosanskr and https://github.com/google/fonts/tree/main/ofl/notoserifkr.
- `scripts/generate-design-fonts.py` builds these subsets from legally installed source fonts. Original copyright and license name records are preserved; derivative family names are Berry Forest Sans and Berry Notebook Serif.
- These files are bundled with the game, so viewing the interface does not request fonts from a third-party server.

Berry Forest Adventure School includes the following third-party components.
It is not covered by the project's proprietary license.

## three.js

- Project: https://threejs.org/
- Copyright © 2010-2025 three.js authors
- License: MIT License
- Full license text: https://github.com/mrdoob/three.js/blob/dev/LICENSE

The bundled dependency retains its own copyright and license terms.

## Supertonic 3 (optional, device-local Korean TTS)

- Code: https://github.com/supertone-oss-archive/supertonic/tree/1e9799e964ea4c0dad7cde993b65c3c813a7b373
- Copyright (c) 2025 Supertone Inc.; code license: MIT, included at `public/licenses/supertonic/CODE-LICENSE.txt`.
- `src/vendor/supertonic/helper.js` is adapted only to use ONNX Runtime's WASM-only entry point and add a provenance header.
- Original models and F1/M1 preset styles: https://huggingface.co/supertone-oss-archive/supertonic-3/tree/aafc6e32416a594460b32413efc49d7fe4ce6d46
- Smaller vector estimator and vocoder: https://huggingface.co/csukuangfj2/sherpa-onnx-supertonic-3-tts-int8-2026-05-11/tree/cca5a0e6c96e1d2c720986bf7e75fcc81dee3ae4 (int8 conversion by the sherpa-onnx project).
- Models, derivatives and generated speech remain subject to the original BigScience Open RAIL-M license, including its use restrictions. The complete original license is included at `public/licenses/supertonic/MODEL-LICENSE.txt` and linked before download. Model weights are unmodified pinned upstream downloads, not proprietary game assets.
- The model and preset voice files are downloaded only after the user chooses to prepare the voice. The initial download is approximately 160 MB including the execution runtime; no synthesis text or student save is sent to the model host. Speech is AI-generated, not a recording of a game character or teacher.

## ONNX Runtime Web

- Project: https://github.com/microsoft/onnxruntime
- Version: 1.24.3; license: MIT.
- Copyright (c) Microsoft Corporation. Full license: https://github.com/microsoft/onnxruntime/blob/v1.24.3/LICENSE
- Runtime WASM/module files load lazily from the pinned jsDelivr package only when neural speech is requested. Model and runtime hosts receive normal download requests; device/browser fallback speech follows the browser's voice-service behavior.

## 메이플스토리 서체

오른쪽 위 UI와 상태창은 넥슨이 제공한 메이플스토리 서체를 사용합니다. 원본 Light·Bold TTF를 기기에 포함하며 외부 글꼴 서버에 접속하지 않습니다. 저작권 및 이용조건 전체는 [글꼴 이용조건](public/fonts/LICENSE-Maplestory.txt)에 포함되어 있습니다.
