# Changelog

## [2.2.0](https://github.com/prabhjeet-me/WakeyWakey/compare/@prabhjeet.me/wakeywakey-v2.1.0...@prabhjeet.me/wakeywakey-v2.2.0) (2026-03-01)


### Features

* **speaker:** configurable volume for up, down & ping + play ping if silence detected ([26ee01b](https://github.com/prabhjeet-me/WakeyWakey/commit/26ee01bc10394e351384fd962f5de001f58795f3))
* **speaker:** set source function to change output device ([2d2c148](https://github.com/prabhjeet-me/WakeyWakey/commit/2d2c148971b211646877718a1b86b1cead49b6c1))


### Bug Fixes

* **orb:** use timer instead of clock (three) ([a975a55](https://github.com/prabhjeet-me/WakeyWakey/commit/a975a556f10151f0f235c877dbd62e681bf7a754))
* **provider:** throw if mic not initialized ([c1ddabb](https://github.com/prabhjeet-me/WakeyWakey/commit/c1ddabb6b046accc47250a51945ae5538f3461d6))

## [2.1.0](https://github.com/prabhjeet-me/WakeyWakey/compare/@prabhjeet.me/wakeywakey-v2.0.0...@prabhjeet.me/wakeywakey-v2.1.0) (2026-03-01)


### Features

* **orb:** added initialized state ([2635345](https://github.com/prabhjeet-me/WakeyWakey/commit/26353452634cfc956b43546d56263aafb29ce7cd))


### Bug Fixes

* **audio:** filter speech events to avoid firing if muted ([f1179b0](https://github.com/prabhjeet-me/WakeyWakey/commit/f1179b08d5ba1475e0b27f2354767a90d209907a))
* **orb:** eslint fixes ([aa68916](https://github.com/prabhjeet-me/WakeyWakey/commit/aa689165b6147190f4c428adb9b56bd7f94d4bae))
* **speaker:** reset orb state after audio chunks are done playing ([fae9bcb](https://github.com/prabhjeet-me/WakeyWakey/commit/fae9bcb74deebb7e26f67f00f4b894c60a1a18d2))
* **speech-recognition:** don't transcribe if muted ([6b3fbd5](https://github.com/prabhjeet-me/WakeyWakey/commit/6b3fbd54c8ff49d6cb8d744ef204f08346705599))

## [2.0.0](https://github.com/prabhjeet-me/WakeyWakey/compare/@prabhjeet.me/wakeywakey-v1.1.0...@prabhjeet.me/wakeywakey-v2.0.0) (2026-02-28)


### ⚠ BREAKING CHANGES

* recoding event emit interim transcript & audio chunks

### Features

* added PTT mode ([541b939](https://github.com/prabhjeet-me/WakeyWakey/commit/541b9399cec45b29df27c034cfbb0fb244fc617c))
* **audio:** implemented mic mute/unmute ([126eb6a](https://github.com/prabhjeet-me/WakeyWakey/commit/126eb6a3ca48f829709be0f2d4e26aa71385b7d9))
* **audio:** use speech recognition API for detecting wakeword ([7a1aea9](https://github.com/prabhjeet-me/WakeyWakey/commit/7a1aea90e2efe534664c3912234bc430f16f770b))
* **microphone-service:** expose audio context ([40db0a6](https://github.com/prabhjeet-me/WakeyWakey/commit/40db0a660cfe095420289e4f999d0590762c59da))
* **microphone-service:** expose sourceNode ([3c712a2](https://github.com/prabhjeet-me/WakeyWakey/commit/3c712a22bf33d3aab1d343fae05f71c14b5b73df))
* **microphone:** ability to adjust gain on runtime ([0d11dbb](https://github.com/prabhjeet-me/WakeyWakey/commit/0d11dbb210d1a07426eabdc614444039cefc57a9))
* **microphone:** configurable rnn, native noise suppression & other controls ([f1c2e73](https://github.com/prabhjeet-me/WakeyWakey/commit/f1c2e73851a86437138d56ef7cf9dbf334eef099))
* **orb-component:** configurable particles & radius ([b02398c](https://github.com/prabhjeet-me/WakeyWakey/commit/b02398c4d1ca6569c7948c50f8a85c89eee95665))
* **orb-component:** updated for 4 states (idle, listening, speaking, thinking) + service ([1a2c7b6](https://github.com/prabhjeet-me/WakeyWakey/commit/1a2c7b6023fde60c43eeaf31bb0c3cd4745911ce))
* recoding event emit interim transcript & audio chunks ([44fb0c3](https://github.com/prabhjeet-me/WakeyWakey/commit/44fb0c3f907b892567f6408d13a66b52a337162b))
* updated orb, animate orb based on input mic & audio ([63f9c90](https://github.com/prabhjeet-me/WakeyWakey/commit/63f9c907a726301a7a19f4ef81077fe211de522b))


### Bug Fixes

* **audio:** keep capturing chunks till threshold is reached so no audio is lost ([3220ca9](https://github.com/prabhjeet-me/WakeyWakey/commit/3220ca94811d845f263f73278d25663f64974b76))

## [1.1.0](https://github.com/prabhjeet-me/WakeyWakey/compare/@prabhjeet.me/wakeywakey-v1.0.1...@prabhjeet.me/wakeywakey-v1.1.0) (2026-02-24)


### Features

* **bridge-service:** ready event now emits instance of internal services ([4c3de6a](https://github.com/prabhjeet-me/WakeyWakey/commit/4c3de6aff768ddab97ff92e29def101c2ebf7b8a))


### Bug Fixes

* **audio:** cleanup + exception if permission not granted ([9f859ef](https://github.com/prabhjeet-me/WakeyWakey/commit/9f859efed7922aadd59c8e015bc669a8a9606701))
* **microphone:** in case of multiple microphones ([b265290](https://github.com/prabhjeet-me/WakeyWakey/commit/b2652908ec383a4240771bf9b7ff35b721bca748))

## [1.0.1](https://github.com/prabhjeet-me/WakeyWakey/compare/@prabhjeet.me/wakeywakey-v1.0.0...@prabhjeet.me/wakeywakey-v1.0.1) (2026-02-23)


### Bug Fixes

* updated peerDependencies ([a3317bf](https://github.com/prabhjeet-me/WakeyWakey/commit/a3317bf33fc0bfe3aa45fc1338bc9a9a317f3620))
* updated peerDependencies ([4c31134](https://github.com/prabhjeet-me/WakeyWakey/commit/4c31134bc0536ffc2d94cc55cdde1fbf0eab5d6d))

## 1.0.0 (2026-02-23)


### Features

* added orb component for voice animation ([16c4a4a](https://github.com/prabhjeet-me/WakeyWakey/commit/16c4a4af999c1d6005cf9284247d7e49601f43c1))
* **audio-service:** force start/stop recording ([76ca29a](https://github.com/prabhjeet-me/WakeyWakey/commit/76ca29a507d2907a5b3108eedcfb37d723c5b686))
* **audio-service:** silence detection ([3c88e27](https://github.com/prabhjeet-me/WakeyWakey/commit/3c88e27fb1af440b077a5a81e99136aa73495edf))
* **audio-service:** utilize pipeline & detect wakeword ([d5c2d9b](https://github.com/prabhjeet-me/WakeyWakey/commit/d5c2d9b4ea346db859c65c77cb7bf32e3d3d2539))
* **audio:** audio service to fire event on speech with vad score ([200e15f](https://github.com/prabhjeet-me/WakeyWakey/commit/200e15f7c9cc6ee213e4e396824ce5a7e254d493))
* bundled up/down sound ([f79c0d3](https://github.com/prabhjeet-me/WakeyWakey/commit/f79c0d342785a12d50e917bf2b6c19993eccae03))
* config & model service for storing inference sessions ([131b861](https://github.com/prabhjeet-me/WakeyWakey/commit/131b8615fe3944c5e76997ca3140429f2ac1dc0f))
* **config-service:** added mode DEFAULT | VOICE_CHAT ([3300d6b](https://github.com/prabhjeet-me/WakeyWakey/commit/3300d6b38876a5d2359cd80898e78b917cf06d84))
* **config:** added config service ([2dd2dbd](https://github.com/prabhjeet-me/WakeyWakey/commit/2dd2dbd3d8051adc1b230c445947978f5135680a))
* **event:** event service for firing events ([2cbbf9e](https://github.com/prabhjeet-me/WakeyWakey/commit/2cbbf9ec91d0feb64f5402caf817a145408086ea))
* implemented pipeline for wakeword detection ([723427f](https://github.com/prabhjeet-me/WakeyWakey/commit/723427f9933ba312738562fe71ff43f6127cdb7f))
* implemented VOICE_CHAT mode ([99035c3](https://github.com/prabhjeet-me/WakeyWakey/commit/99035c3c34befcfe854fa3a273446f823ea2d846))
* **microphone-service:** added noise suppression ([1e5a4c2](https://github.com/prabhjeet-me/WakeyWakey/commit/1e5a4c2323dd3bbb39e909707b110cd56b1b1192))
* **microphone:** get sampled audio using audio worklet ([598876b](https://github.com/prabhjeet-me/WakeyWakey/commit/598876bfb198bd55ce94aaa0d4844688cfff7c80))
* **orb-component:** manage own state for voice activity ([2a52485](https://github.com/prabhjeet-me/WakeyWakey/commit/2a52485215e6f9655c0043a344d7b1c1552195f4))
* **orb-component:** start/stop recording by clicking on orb ([5b29cd9](https://github.com/prabhjeet-me/WakeyWakey/commit/5b29cd9ae14598930e1c7cf67384105ac993e743))
* **platform:** added platform service ([ce1f7b4](https://github.com/prabhjeet-me/WakeyWakey/commit/ce1f7b45fb10aa514173563d3974135cd37148c1))
* separated orb component logic ([4b93d5f](https://github.com/prabhjeet-me/WakeyWakey/commit/4b93d5f2903628d0ed222affc51dca569ade3ee6))
* **speaker-service:** play up/down based on event by self ([5f49b56](https://github.com/prabhjeet-me/WakeyWakey/commit/5f49b56b323a21892bd5e35f89b1df7dc05398ce))
* **speaker:** added play up & down sounds ([5a0d136](https://github.com/prabhjeet-me/WakeyWakey/commit/5a0d13650204a58a8cbf44b813157f23a23d83f8))
* **speech recognition:** implemented speech transcript for command ([620c63b](https://github.com/prabhjeet-me/WakeyWakey/commit/620c63b33985588bfdc3e53e67ee43ead9ae5371))
* **speech-recognition:** refactor + reset fn ([57d5494](https://github.com/prabhjeet-me/WakeyWakey/commit/57d54943a39edf14a4fd4c69348887ada96c6035))
* **store:** store service for storing inference sessions ([6cda5c4](https://github.com/prabhjeet-me/WakeyWakey/commit/6cda5c491fc65257fbd3e9de0a1629beb9cf82d5))
* **vad:** implemented voice activity detection using Silero VAD v4 ([9f9bfe3](https://github.com/prabhjeet-me/WakeyWakey/commit/9f9bfe327e726eaf95c8269d2e461ab00a4b7d12))
* wakey wakey component for output events ([6653c2f](https://github.com/prabhjeet-me/WakeyWakey/commit/6653c2f1b93e5ae847e911dc2f0b8b88757ef661))


### Bug Fixes

* **microphone:** cluttering sound ([8f2622b](https://github.com/prabhjeet-me/WakeyWakey/commit/8f2622b300dc1f17a0e7e328140cec11e98ad7ae))
* **microphone:** noise suppression & echo cancellation ([dc36380](https://github.com/prabhjeet-me/WakeyWakey/commit/dc3638000cbc929d48492be5d3298df58637f194))
* refactor configs & services ([5ab94e5](https://github.com/prabhjeet-me/WakeyWakey/commit/5ab94e5dfaf7a6036d5218f22373e0c9c3fde450))
* speech recognition cleanup ([6719b4c](https://github.com/prabhjeet-me/WakeyWakey/commit/6719b4cacc3b4d85857d96f8ddd827bbc2edd7cf))
* **vad-service:** utilize model service for accessing vad session ([a11123f](https://github.com/prabhjeet-me/WakeyWakey/commit/a11123fd68da00c7c705ddf02ab0ea03eaa8025f))
