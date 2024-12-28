import { AnimationMixer, Box3, Box3Helper, EventDispatcher, Vector3 } from 'three';
import {
  MONSTER_STATE_NAME,
  MONSTER_EVENTS,
  StateMachine,
  RunState,
  AttackState,
  DyingState,
  HurtState,
} from '../Common/StateMachine.js';

export class Monster extends EventDispatcher {
  constructor({ worldOctree, object, collider, target, clip, audio, buffer, healthBar }) {
    super();
    this.object = object;
    this.id = this.object.id;
    this.target = target;
    this.damage = 5;

    // Pysics Setting
    this._worldOctree = worldOctree;
    this._isGrounded = false;
    this._fallSpeed = 0;
    this.step = 5;

    // Reusable Vectors
    this.vector1 = new Vector3();
    this.vector2 = new Vector3();

    // Health Bar
    this.health = 100;
    this.healthBar = healthBar;
    this.healthBar.setPositionByObject(this.object, this.vector1.set(0, 0, 0));
    this.object.add(healthBar.object);

    // Colliders
    this.collider = collider;
    this.handBone = object.getObjectByName('mixamorigRightHand');
    this.attackCollider = new Box3();
    this.boxHelper = new Box3Helper(this.attackCollider, 0xff0000);

    // Attack Throttle
    this.lastAttackTime = 0;
    this.attackThrottleTime = 600;

    // State Machine
    this.mixer = new AnimationMixer(this.object);
    this.audio = audio;

    const runState = new RunState(this.mixer.clipAction(clip.run), this.audio, buffer.growl);
    const hurtState = new HurtState(this.mixer.clipAction(clip.hit), this.audio, buffer.growl);
    const attackState = new AttackState(this.mixer.clipAction(clip.attack), this.audio, buffer.attack);
    const dyingState = new DyingState(this.mixer.clipAction(clip.die), this.audio, buffer.growl);

    runState.addUpdateCallback(this.moveToTarget.bind(this));
    attackState.addUpdateCallback(this.attack.bind(this));
    dyingState.addExitCallback(() => {
      this.dispatchEvent({ type: 'die', monster: this });
    });

    this.states = {
      [MONSTER_STATE_NAME.RUN]: runState,
      [MONSTER_STATE_NAME.HURT]: hurtState,
      [MONSTER_STATE_NAME.ATTACK]: attackState,
      [MONSTER_STATE_NAME.DYING]: dyingState,
    };

    this.stateMachine = new StateMachine(this.states?.[MONSTER_STATE_NAME.RUN], this.states);

    for (let name in this.states) {
      this.states?.[name].addEventListener('endState', () => {
        this.stateMachine.handleEvent(MONSTER_EVENTS.ON_END_STATE);
      });
    }

    this._targetPosition = this.target.position.clone();
  }

  hit(damage) {
    this.stateMachine.handleEvent(MONSTER_EVENTS.GET_SHOT);
    this.health -= damage;
    this.healthBar.update(this.health);

    if (this.health <= 0) {
      this.stateMachine.handleEvent(MONSTER_EVENTS.EMPTY_HEALTH);
    }
  }

  attack() {
    const time = this.states?.[MONSTER_STATE_NAME.ATTACK].action.time;
    if (1 < time && time < 1.5) {
      const currentTime = Date.now();
      if (currentTime - this.lastAttackTime < this.attackThrottleTime) return;
      if (!this.target.collider.intersectsBox(this.attackCollider)) return;
      this.target.hit(this.damage);
      this.lastAttackTime = currentTime;
    }
  }
  moveToTarget(delta) {
    this._targetPosition.copy(this.target.position);
    this._targetPosition.y = this.collider.start.y - this.collider.radius;
    this.object.lookAt(this._targetPosition);
    const direction = this._targetPosition.sub(this.object.position).normalize();

    this.collider.translate(direction.multiplyScalar(delta));
  }

  _collide(something) {
    const d2 = this.collider.start.distanceToSquared(something.collider.start);
    const r = this.collider.radius + something.collider.radius;
    const r2 = r * r;

    if (d2 < r2) {
      const normal = this.vector1.subVectors(this.collider.start, something.collider.start).normalize();
      normal.y = 0;
      const d = r - Math.sqrt(d2);

      normal.multiplyScalar(d);
      this.collider.translate(this.vector2.copy(normal).multiplyScalar(d));
    }
  }

  _collideMonsters(monsters) {
    monsters.forEach(monster => {
      if (monster.id !== this.id) this._collide(monster);
    });
  }

  _collideCharacter() {
    this._collide(this.target);
  }

  _fall(delta) {
    this._fallSpeed -= 9.8 * 0.001 * delta;
    this.collider.translate(this.vector1.set(0, this._fallSpeed, 0));
  }

  _collideWorld() {
    this._isGrounded = false;
    const collisionResult = this._worldOctree.capsuleIntersect(this.collider);
    if (!collisionResult) return;

    if (collisionResult.normal.y > 0) {
      // Player is grounded.
      this._isGrounded = true;
      this._fallSpeed = 0;
    }

    if (collisionResult.depth >= 1e-10) {
      this.collider.translate(collisionResult.normal.multiplyScalar(collisionResult.depth));
    }
  }

  _playAnimation(delta) {
    this.mixer.update(delta);
  }

  _syncObjectToCollider() {
    this.object.position.copy(this.collider.start);
    this.object.position.y -= this.collider.radius;
  }

  update(delta, monsters) {
    this.handBone.getWorldPosition(this.vector1);
    this.attackCollider.setFromCenterAndSize(this.vector1, this.vector2.set(0.2, 0.2, 0.2));
    const distance = this.object.position.distanceTo(this.target.position);
    if (distance < 1.8) this.stateMachine.handleEvent(MONSTER_EVENTS.CLOSE_TO_TARGET);
    this.stateMachine.state.update(delta);

    for (let i = 0; i < this.step; i++) {
      if (!this._isGrounded) this._fall(delta / this.step);
      this._collideWorld();

      this._collideMonsters(monsters);
      this._collideCharacter();
    }
    this._syncObjectToCollider();

    this._playAnimation(delta);
  }

  dispose() {
    this.mixer.uncacheRoot(this.object);
  }

  remove() {
    this.object.removeFromParent();
    this.boxHelper.removeFromParent();

    this.dispose();
  }

  addToScene(scene) {
    scene.add(this.object);
    scene.add(this.boxHelper);
  }
}
