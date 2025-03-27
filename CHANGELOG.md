## [1.3.2](https://github.com/Byongho96/three-game-controls/compare/v1.3.1...v1.3.2) (2025-03-27)


### Bug Fixes

* include index.d.ts in exports for type resolution ([#66](https://github.com/Byongho96/three-game-controls/issues/66)) ([f436bd5](https://github.com/Byongho96/three-game-controls/commit/f436bd5e8b36d82f942194fa90408320be0be466))
* update car rotation logic in racing game ([#63](https://github.com/Byongho96/three-game-controls/issues/63)) ([de331c6](https://github.com/Byongho96/three-game-controls/commit/de331c68fee2686a8ce0825bdd5affbec33b08da))

## [1.3.1](https://github.com/Byongho96/three-game-controls/compare/v1.3.0...v1.3.1) (2025-02-21)


### Bug Fixes

* adjust object rotation calculation ([a4b94de](https://github.com/Byongho96/three-game-controls/commit/a4b94de8985da70f499726c7cad88964b3d096ad))
* modify to allow access to the Collider class ([0095255](https://github.com/Byongho96/three-game-controls/commit/009525537810edd112e2a7de043443fd2f40e605))

# [1.3.0](https://github.com/Byongho96/three-game-controls/compare/v1.2.0...v1.3.0) (2025-02-04)


### Features

* apply BVH to PhysicsControls ([d36cb38](https://github.com/Byongho96/three-game-controls/commit/d36cb38bc07a206b2d06da7cb88ab2377e1a3918))
* implement BVH class for optimized spatial complexity ([19b79f7](https://github.com/Byongho96/three-game-controls/commit/19b79f7f739b33470dccbff3170330bbe7a5b9e1))

# [1.2.0](https://github.com/Byongho96/three-game-controls/compare/v1.1.0...v1.2.0) (2025-01-16)


### Bug Fixes

* update landTolerance default value ([#49](https://github.com/Byongho96/three-game-controls/issues/49)) ([7e68fc2](https://github.com/Byongho96/three-game-controls/commit/7e68fc2a707248fc28ca2ab1e50b938d5a0a7640))


### Features

* create GyroMixin controllable via deviceOrientation ([#50](https://github.com/Byongho96/three-game-controls/issues/50)) ([f409640](https://github.com/Byongho96/three-game-controls/commit/f409640d83cba2e5abf1b953c0a5469b33d21130))

# [1.1.0](https://github.com/Byongho96/three-game-controls/compare/v1.0.0...v1.1.0) (2025-01-16)


### Bug Fixes

* modify to allow access to the Collider class ([06856d3](https://github.com/Byongho96/three-game-controls/commit/06856d3a4faf357fb54067e3f9956e60362a207e))


### Features

* supports touchevent on dragmixin ([#45](https://github.com/Byongho96/three-game-controls/issues/45)) ([716f3d8](https://github.com/Byongho96/three-game-controls/commit/716f3d80024afcd5ab348f92d7bdf4dde6e4deef))

# 1.0.0 (2025-01-14)


### Bug Fixes

* add jump up, jump down feature, delete jump asset ([#20](https://github.com/Byongho96/three-game-controls/issues/20)) ([984a75a](https://github.com/Byongho96/three-game-controls/commit/984a75a2687665f5ef5715ee4eb08ee170052708))
* change default rotateSpeed ([22cd0ee](https://github.com/Byongho96/three-game-controls/commit/22cd0eeeb7e96447d54dca46e6a4971b3d001f38))
* check if jump key is pressed to prevent unintended jump animation ([98ad67d](https://github.com/Byongho96/three-game-controls/commit/98ad67df36e4e0f3ed781e685e1aae050b36a4c8))
* correct incorrect file paths ([#35](https://github.com/Byongho96/three-game-controls/issues/35)) ([befa87b](https://github.com/Byongho96/three-game-controls/commit/befa87b8a036cdba944036e22bd7de43a35796d9))
* fix handler bindings and remove unnecessary code ([a0739ae](https://github.com/Byongho96/three-game-controls/commit/a0739ae6d9756487d19a969df6cfa768997a909a))
* fix option name, avoid redundant object creation ([134a396](https://github.com/Byongho96/three-game-controls/commit/134a3963b1ac28a056040afb782c71c7ad60934e))
* fix updateSync, updateCamera function ([e98840e](https://github.com/Byongho96/three-game-controls/commit/e98840e078db3f0fc4eabd6036ff3b366dc21f3b))
* fixed issue with axisSync never not working in ThirdPersonMouseDragControls ([5204e86](https://github.com/Byongho96/three-game-controls/commit/5204e866575fc65cfa822eb9560d27ffe2912c80))
* fixed issue with axisSync never not working in ThirdPersonPointerLockControls ([32e0098](https://github.com/Byongho96/three-game-controls/commit/32e00983327aba1b6f35c96acb94076c91980e0f))
* prevent monsters from running to target while dying ([f12a42c](https://github.com/Byongho96/three-game-controls/commit/f12a42c01618160c61b8135a4b0405ed4912d8e6))
* remove redundant parameter descriptions from comments ([6f4a210](https://github.com/Byongho96/three-game-controls/commit/6f4a2109553fdff700397b98ebe48b96e28cc2ab))
* remove unnecessary variable ([b70e57d](https://github.com/Byongho96/three-game-controls/commit/b70e57d4e7461ed36ddc0660d98abc7fa427bc2c))
* resolve issue where monsters do not disappear from the scene upon death ([50bbaf8](https://github.com/Byongho96/three-game-controls/commit/50bbaf8654ec7007b6766a6a85e8a348179078b9))
* resolve rendering issue when the gamepad inputsource cannot be found ([#19](https://github.com/Byongho96/three-game-controls/issues/19)) ([5cd1d09](https://github.com/Byongho96/three-game-controls/commit/5cd1d09d8b2fba4d559d680d2f7248b8e594c714))
* shoot example page enable VR ([#16](https://github.com/Byongho96/three-game-controls/issues/16)) ([0a2c314](https://github.com/Byongho96/three-game-controls/commit/0a2c31468e5097e043053f1d1d60f3b7e98776eb))
* unify key input types and rename function ([ac2a04d](https://github.com/Byongho96/three-game-controls/commit/ac2a04d46251147acf1940460f6c5528bbc8848f))
* update conditions for playing idle animation ([25e4f5e](https://github.com/Byongho96/three-game-controls/commit/25e4f5edaca2750b9d1d2215d950a67161920cc6))
* update rotation direction for third-person keyboard controls ([6886d3d](https://github.com/Byongho96/three-game-controls/commit/6886d3da1e4dd6ff05827aff73b928e249baf101))


### Features

* add acceleration feature to controls and animations ([#14](https://github.com/Byongho96/three-game-controls/issues/14)) ([33fcf2b](https://github.com/Byongho96/three-game-controls/commit/33fcf2b1618da3239230b95a46fdee080a5b91fb))
* add camera position Lerp (third person mouse drag controls) ([6a15d02](https://github.com/Byongho96/three-game-controls/commit/6a15d020bbc83e8415138ba4c4e1ff8e439acdd3))
* add class for managing character animations ([3da9dac](https://github.com/Byongho96/three-game-controls/commit/3da9dacaea8217fc603825dcf10deed0584576e4))
* add collision detection between user and monster ([1957e71](https://github.com/Byongho96/three-game-controls/commit/1957e7105026bceaca5291d5f5705f983c1ecd05))
* add collision detection between worldMap and moster ([8163cb9](https://github.com/Byongho96/three-game-controls/commit/8163cb998e51b58068ece6be0a952bc3895edbce))
* add control features, fix issues, and improve code readability ([75d7903](https://github.com/Byongho96/three-game-controls/commit/75d79035e67425c3cf2a8949b4782606b6f17636))
* add dispose method to healthbar ([87985d3](https://github.com/Byongho96/three-game-controls/commit/87985d3e81cb522790364c44407992eb9757c298))
* add example page for third-person pointer lock controls ([a4424d5](https://github.com/Byongho96/three-game-controls/commit/a4424d54df586f177e624e482c5e3b0b7fe7a61f))
* add jump up, jump down animation ([#17](https://github.com/Byongho96/three-game-controls/issues/17)) ([c798795](https://github.com/Byongho96/three-game-controls/commit/c7987950fad9a5f950ef9657bf9a900a7dc13e4b))
* add keyboard input parameters for first-person controls ([2edbc17](https://github.com/Byongho96/three-game-controls/commit/2edbc17ec7b617ef82ae13b666b99f0f241570a9))
* add min and max zoom constraints ([37b6125](https://github.com/Byongho96/three-game-controls/commit/37b61259d3d4c510b5a87c95ceb34feb6b4515db))
* add monster attack action ([89d2d37](https://github.com/Byongho96/three-game-controls/commit/89d2d37cdf5fd90eeb2d37441edd327534069309))
* add monster attackCollider ([f8a1226](https://github.com/Byongho96/three-game-controls/commit/f8a1226a7357899f88fe35a6650a7f147f418577))
* add monster collider on shoot example page ([2477b1c](https://github.com/Byongho96/three-game-controls/commit/2477b1cb8678e0bbccb7091763bbc4f95155a2aa))
* add monster health bar ([95a3895](https://github.com/Byongho96/three-game-controls/commit/95a38953ef5a0bc539e0df4b083f466daafccc03))
* add monsterStore ([ce1c780](https://github.com/Byongho96/three-game-controls/commit/ce1c7800e24b1c3418063743d1e4356a4942aa30))
* add rotation constraints for the controls ([e6fd220](https://github.com/Byongho96/three-game-controls/commit/e6fd2205e30268a7cb17717a117e2c9f0f36ae6b))
* add separate clamping for camera angles on upward and downward mouse movements ([e086b71](https://github.com/Byongho96/three-game-controls/commit/e086b71596cc6244927c24c1e74081932725216f))
* add VR camera control functionality ([#18](https://github.com/Byongho96/three-game-controls/issues/18)) ([0bdcae4](https://github.com/Byongho96/three-game-controls/commit/0bdcae4ac61f5f769e29bdbb0577b9d7a1764453))
* create physics-based character controller with keyboard inputs ([dd917f7](https://github.com/Byongho96/three-game-controls/commit/dd917f787514167b6bccf34d4e15b62ea049ed7d))
* create PhysicsCharacterControls class ([a73d609](https://github.com/Byongho96/three-game-controls/commit/a73d609ece1099dad28231a30a145e70f3c110ce))
* create shooting game example pages ([#15](https://github.com/Byongho96/three-game-controls/issues/15)) ([a39b0a2](https://github.com/Byongho96/three-game-controls/commit/a39b0a20f757eb4926ada2494f8e472200ed5932))
* first person mouse drag controls ([#7](https://github.com/Byongho96/three-game-controls/issues/7)) ([4394591](https://github.com/Byongho96/three-game-controls/commit/43945919a1757ff4e8f72bb61952afdb7ffbb85c))
* first person pointerlock controls ([37e15de](https://github.com/Byongho96/three-game-controls/commit/37e15de7c7adf0086d7cc2a507413876d22d25ed))
* implement gun change and shooting logic with damage handling ([#21](https://github.com/Byongho96/three-game-controls/issues/21)) ([e1654fd](https://github.com/Byongho96/three-game-controls/commit/e1654fddfe4733590efc1bfdb9467ee252d3199a))
* implement physics controller using octree structure ([edcebae](https://github.com/Byongho96/three-game-controls/commit/edcebae51b86fd00cee82da1b8c4570b4c19b23a))
* implement precise landing detection for jumpDown execution ([#31](https://github.com/Byongho96/three-game-controls/issues/31)) ([226241c](https://github.com/Byongho96/three-game-controls/commit/226241c8dea307865017f3fc379e2672f764ecef))
* implement third-person pointer lock controls ([0e887db](https://github.com/Byongho96/three-game-controls/commit/0e887db80d6e6199107c268594cf645b8248b8f0))
* implement x-axis rotation clamp ([be6f1ac](https://github.com/Byongho96/three-game-controls/commit/be6f1ac461c5ddd321769aeef0c9bef58f32521e))
* improve PhysicsControls functionality ([1be9af5](https://github.com/Byongho96/three-game-controls/commit/1be9af5c151772b9c90b325cda7c2c00bab9aa45))
* monster attack ([7262f48](https://github.com/Byongho96/three-game-controls/commit/7262f48cfdc76a09b3bd4d0a68496c1ecebf57f3))
* moster hit action ([bd364ea](https://github.com/Byongho96/three-game-controls/commit/bd364eaa4f5c8daa5fb0fa41a0da9e607520f694))
* remove unnecessary getContext, replace hardcoded width and height ([e0aaec0](https://github.com/Byongho96/three-game-controls/commit/e0aaec07604e374bdf1630d1b5605551d2991695))
* temp ([a9471a4](https://github.com/Byongho96/three-game-controls/commit/a9471a46b9c4e5b17084c265e06067abf87d6d3d))
