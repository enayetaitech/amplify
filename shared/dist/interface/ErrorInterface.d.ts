export interface ICustomError extends Error {
    statusCode?: number;
    message: string;
    name: string;
    code?: number;
    keyValue?: any;
    path?: string;
}
//# sourceMappingURL=ErrorInterface.d.ts.map