class ErrorHandler extends Error {
  public statusCode: number;

  constructor(message: string, statusCode: number) {
    super(message);
    this.statusCode = statusCode;
    (Error as any).captureStackTrace(this, this.constructor);
  }
}

export default ErrorHandler;
