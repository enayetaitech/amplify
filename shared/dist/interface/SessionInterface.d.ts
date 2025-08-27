export interface ISession {
    _id: string;
    title: string;
    projectId: string;
    date: Date;
    startTime: string;
    duration: number;
    moderators: string[];
    timeZone: string;
    startAtEpoch: number;
    endAtEpoch: number;
    breakoutRoom: boolean;
}
//# sourceMappingURL=SessionInterface.d.ts.map