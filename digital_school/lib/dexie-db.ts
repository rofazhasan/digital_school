import Dexie, { Table } from 'dexie';

export interface LocalExam {
    id: string;
    title: string;
    templateJson: any;
    questionsJson: any;
    downloadedAt: Date;
}

export interface LocalResponse {
    id?: number;
    examId: string;
    studentId: string;
    answers: Record<string, string>;
    score: number;
    timestamp: Date;
    syncStatus: 'pending' | 'synced';
    imageBlob?: Blob;
}

export class OMRDatabase extends Dexie {
    exams!: Table<LocalExam>;
    responses!: Table<LocalResponse>;

    constructor() {
        super('OMRScannerDB');
        this.version(1).stores({
            exams: 'id, title',
            responses: '++id, examId, studentId, syncStatus, timestamp'
        });
    }
}

export const db = new OMRDatabase();
