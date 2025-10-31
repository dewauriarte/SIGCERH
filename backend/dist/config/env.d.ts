export declare const config: {
    readonly database: {
        readonly url: string;
        readonly logLevel: "error" | "warn" | "info" | "query";
    };
    readonly server: {
        readonly nodeEnv: "development" | "production" | "test";
        readonly port: number;
        readonly host: string;
        readonly isDevelopment: boolean;
        readonly isProduction: boolean;
        readonly isTest: boolean;
    };
    readonly security: {
        readonly jwt: {
            readonly secret: string;
            readonly expiresIn: string;
            readonly refreshExpiresIn: string;
        };
        readonly bcrypt: {
            readonly rounds: number;
        };
    };
    readonly cors: {
        readonly origin: string;
        readonly credentials: true;
    };
    readonly rateLimit: {
        readonly windowMs: number;
        readonly maxRequests: number;
    };
    readonly logging: {
        readonly level: "error" | "warn" | "info" | "debug";
        readonly filePath: string;
    };
    readonly ocr: {
        readonly geminiApiKey: string;
        readonly serviceUrl: string;
    };
    readonly email: {
        readonly smtp: {
            readonly host: string;
            readonly port: number;
            readonly user: string;
            readonly password: string;
        };
        readonly from: string;
    };
    readonly storage: {
        readonly uploadPath: string;
        readonly maxFileSizeMB: number;
        readonly maxFileSizeBytes: number;
    };
    readonly frontend: {
        readonly url: string;
    };
};
export type Config = typeof config;
//# sourceMappingURL=env.d.ts.map