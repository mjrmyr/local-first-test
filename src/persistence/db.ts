import Dexie, { type Table } from 'dexie';
import type { Athlete } from '../domain/models/athlete';

export class KaenoDB extends Dexie {
    athletes!: Table<Athlete>;

    constructor() {
        super('kaenoDB');
        this.version(1).stores({
            athletes: 'id, deleted, updatedAt',
        });
    }
}

export const db = new KaenoDB();
