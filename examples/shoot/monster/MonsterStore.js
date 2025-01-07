export class MonsterStore {

	constructor() {

		this.length = 0;
		this._monsters = [];

	}

	add( monster ) {

		this._monsters.push( monster );
		this.length = this._monsters.length;

		monster.addEventListener( 'die', event => {

			this.delete( event.monster );

		} );

	}

	delete( monster ) {

		const monsterIndex = this._monsters.indexOf( monster );
		if ( monsterIndex == - 1 ) return;
		this._monsters.splice( monsterIndex, 1 );

		monster.remove();

	}

	findMonsterByObject( object ) {

		return this._monsters.find( monster => monster.object.getObjectById( object.id ) );

	}

	get monsters() {

		return this._monsters;

	}

	get objects() {

		return this._monsters.map( monster => monster.object );

	}

}
