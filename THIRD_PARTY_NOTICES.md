# Third-party notices

Berry Forest Adventure School includes the following third-party component.
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
