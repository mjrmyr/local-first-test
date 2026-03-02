import Dexie, { type Table } from 'dexie';
import type { Athlete } from '../domain/models/athlete';
import type { TrainingZones } from '../domain/models/trainingZone';
import type { Threshold } from '../domain/models/threshold';

export class KaenoDB extends Dexie {
    athletes!: Table<Athlete>;
    trainingZones!: Table<TrainingZones>;
    thresholds!: Table<Threshold>;

    constructor() {
        super('kaenoDB');
        this.version(1).stores({
            athletes: 'id, deleted, updatedAt',
        });
        this.version(2).stores({
            athletes: 'id, deleted, updatedAt',
            trainingZones: 'id, discipline, metric, deleted, updatedAt',
        });
        this.version(3).stores({
            athletes: 'id, deleted, updatedAt',
            trainingZones: 'id, discipline, metric, deleted, updatedAt',
            thresholds: 'id, discipline, metric, deleted, updatedAt',
        });
    }
}

export const db = new KaenoDB();
