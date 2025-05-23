export interface IObserverDocument {
    _id: string;
    projectId: string;
    sessionId: string;
    displayName: string;
    size: number;
    storageKey: string;
    addedBy: string;
    addedByRole: "ADMIN" | "MODERATOR" | "OBSERVER";
    createdAt: Date;
    updatedAt: Date;
}
//# sourceMappingURL=ObserverDocumentInterface.d.ts.map