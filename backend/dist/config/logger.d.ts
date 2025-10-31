import winston from 'winston';
export declare const logger: winston.Logger;
export declare function logRequest(method: string, url: string, statusCode: number, duration: number): void;
export declare const morganStream: {
    write: (message: string) => void;
};
export declare const morganFormat = ":method :url :status :res[content-length] - :response-time ms";
export default logger;
//# sourceMappingURL=logger.d.ts.map