import { Request, Response, NextFunction } from "express";
import { ICustomError } from "../../shared/interface/ErrorInterface";
declare const errorMiddleware: (err: ICustomError, req: Request, res: Response, next: NextFunction) => void;
export default errorMiddleware;
//# sourceMappingURL=ErrorMiddleware.d.ts.map