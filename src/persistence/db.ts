import Dexie, { type Table } from 'dexie';
import type { Athlete } from '../domain/models/athlete';
import type { TrainingZones } from '../domain/models/trainingZone';

export class KaenoDB extends Dexie {
    athletes!: Table<Athlete>;
    trainingZones!: Table<TrainingZones>;

    constructor() {
        super('kaenoDB');
        this.version(1).stores({
            athletes: 'id, deleted, updatedAt',
        });
        this.version(2).stores({
            athletes: 'id, deleted, updatedAt',
            trainingZones: 'id, discipline, metric, deleted, updatedAt',
        });
    }
}

export const db = new KaenoDB();
