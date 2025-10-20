// shared/interfaces/IObserverDocument.ts
export interface IObserverDocument {
  _id: string;
  projectId: string;
  displayName: string;
  size: number;
  storageKey: string;
  addedBy: string;
  addedByRole: "ADMIN" | "MODERATOR" | "OBSERVER";
  createdAt: Date;
  updatedAt: Date;
}
