--- C:\work\amplify-new\backend\package.json ---

{
  "name": "backend",
  "version": "1.0.0",
  "main": "index.js",
  "scripts": {
       "build:shared": "tsc --build ../shared",
    "build:backend": "tsc --build",
    "build": "npm run build:shared && npm run build:backend",
    "start:prod": "node ./dist/server.js",
    "dev": "ts-node-dev --respawn --transpile-only ./server.ts",
    "start": "ts-node ./server.ts"
  },
  "keywords": [],
  "author": "",
  "license": "ISC",
  "description": "",
  "dependencies": {
    "@aws-sdk/client-s3": "^3.802.0",
    "@aws-sdk/s3-request-presigner": "^3.802.0",
    "archiver": "^7.0.1",
    "aws-sdk": "^2.1692.0",
    "bcrypt": "^5.1.1",
    "bcryptjs": "^3.0.2",
    "cloudinary": "^2.6.0",
    "cookie-parser": "^1.4.7",
    "cors": "^2.8.5",
    "dotenv": "^16.5.0",
    "express": "^5.1.0",
    "express-useragent": "^1.0.15",
    "geoip-lite": "^1.4.10",
    "jsonwebtoken": "^9.0.2",
    "luxon": "^3.6.1",
    "mongoose": "^8.13.2",
    "ms": "^2.1.3",
    "multer": "^1.4.5-lts.2",
    "node-cron": "^3.0.3",
    "nodemailer": "^6.10.0",
    "request-ip": "^3.3.0",
    "socket.io": "^4.8.1",
    "stripe": "^18.0.0"
  },
  "devDependencies": {
    "@types/bcrypt": "^5.0.2",
    "@types/bcryptjs": "^2.4.6",
    "@types/cookie-parser": "^1.4.8",
    "@types/cors": "^2.8.17",
    "@types/express": "^5.0.1",
    "@types/express-useragent": "^1.0.5",
    "@types/geoip-lite": "^1.4.4",
    "@types/jsonwebtoken": "^9.0.9",
    "@types/luxon": "^3.6.2",
    "@types/ms": "^2.1.0",
    "@types/multer": "^1.4.12",
    "@types/node": "^22.14.0",
    "@types/node-cron": "^3.0.11",
    "@types/nodemailer": "^6.4.17",
    "@types/request-ip": "^0.0.41",
    "@types/socket.io": "^3.0.1",
    "nodemon": "^3.1.9",
    "ts-node": "^10.9.2",
    "ts-node-dev": "^2.0.0",
    "typescript": "^5.8.2"
  }
}


--- C:\work\amplify-new\backend\server.ts ---

// src/server.ts
import express from "express";
import config from "./config/index";
import connectDB from "./config/db";
import errorMiddleware from "./middlewares/ErrorMiddleware";
import mainRoutes from "./routes/index"
import cors from "cors";
import cookieParser from "cookie-parser"; 
import { deviceInfoMiddleware } from "./middlewares/deviceInfo";
import http from "http";
import { initSocket } from "./socket";

const app = express();
console.log("Starting server...",config.frontend_base_url);
// ✅ CORS config
const allowedOrigins = [config.frontend_base_url as string,  "http://localhost:3000",];
app.use(
  cors({
    origin: (origin, callback) => {
      if (!origin || allowedOrigins.includes(origin)) {
        callback(null, true);
      } else {
        callback(new Error("Not allowed by CORS"));
      }
    },
    credentials: true,
  })
);

// Middleware to parse JSON bodies
app.use(express.json());
app.use(cookieParser());
app.set('trust proxy', true);
// this must come before any route that needs deviceInfo
app.use(deviceInfoMiddleware);

// Example route
app.get("/", (req, res) => {
  res.send("Hello World!");
});

app.use((req, res, next) => {
  console.log(`[${req.method}] ${req.url}`);
  // console.log('Body:', req.body);
  next();
});


// Place your other routes here
app.use("/api/v1", mainRoutes);

// Error handling middleware should be added after routes
app.use(errorMiddleware);

// Create an HTTP server from Express
const server = http.createServer(app);

// Initialize Socket.IO on that server
initSocket(server);

// Connect to the database and start the server
const PORT = config.port || 8008;
server.listen(PORT, async () => {
  await connectDB();
  console.log(`Server is running on port ${PORT}`);
});


--- C:\work\amplify-new\backend\tsconfig.json ---

{"extends": "../tsconfig.base.json",
  "compilerOptions": {
    "composite": true,

    /* Visit https://aka.ms/tsconfig to read more about this file */

    /* Projects */
    // "incremental": true,                              /* Save .tsbuildinfo files to allow for incremental compilation of projects. */
    // "composite": true,                                /* Enable constraints that allow a TypeScript project to be used with project references. */
    // "tsBuildInfoFile": "./.tsbuildinfo",              /* Specify the path to .tsbuildinfo incremental compilation file. */
    // "disableSourceOfProjectReferenceRedirect": true,  /* Disable preferring source files instead of declaration files when referencing composite projects. */
    // "disableSolutionSearching": true,                 /* Opt a project out of multi-project reference checking when editing. */
    // "disableReferencedProjectLoad": true,             /* Reduce the number of projects loaded automatically by TypeScript. */

    /* Language and Environment */
    "target": "es2016",                                  /* Set the JavaScript language version for emitted JavaScript and include compatible library declarations. */
    // "lib": [],                                        /* Specify a set of bundled library declaration files that describe the target runtime environment. */
    // "jsx": "preserve",                                /* Specify what JSX code is generated. */
    // "libReplacement": true,                           /* Enable lib replacement. */
    // "experimentalDecorators": true,                   /* Enable experimental support for legacy experimental decorators. */
    // "emitDecoratorMetadata": true,                    /* Emit design-type metadata for decorated declarations in source files. */
    // "jsxFactory": "",                                 /* Specify the JSX factory function used when targeting React JSX emit, e.g. 'React.createElement' or 'h'. */
    // "jsxFragmentFactory": "",                         /* Specify the JSX Fragment reference used for fragments when targeting React JSX emit e.g. 'React.Fragment' or 'Fragment'. */
    // "jsxImportSource": "",                            /* Specify module specifier used to import the JSX factory functions when using 'jsx: react-jsx*'. */
    // "reactNamespace": "",                             /* Specify the object invoked for 'createElement'. This only applies when targeting 'react' JSX emit. */
    // "noLib": true,                                    /* Disable including any library files, including the default lib.d.ts. */
    // "useDefineForClassFields": true,                  /* Emit ECMAScript-standard-compliant class fields. */
    // "moduleDetection": "auto",                        /* Control what method is used to detect module-format JS files. */

    /* Modules */
    "module": "commonjs",                                /* Specify what module code is generated. */
    "rootDir": ".",                                  /* Specify the root folder within your source files. */
    // "moduleResolution": "node10",                     /* Specify how TypeScript looks up a file from a given module specifier. */
    "baseUrl": ".",                                  /* Specify the base directory to resolve non-relative module names. */
    "paths": {"@shared/*":  ["../shared/dist/*"]},                                      /* Specify a set of entries that re-map imports to additional lookup locations. */
    // "rootDirs": [],                                   /* Allow multiple folders to be treated as one when resolving modules. */
    // "typeRoots": [],                                  /* Specify multiple folders that act like './node_modules/@types'. */
    // "types": [],                                      /* Specify type package names to be included without being referenced in a source file. */
    // "allowUmdGlobalAccess": true,                     /* Allow accessing UMD globals from modules. */
    // "moduleSuffixes": [],                             /* List of file name suffixes to search when resolving a module. */
    // "allowImportingTsExtensions": true,               /* Allow imports to include TypeScript file extensions. Requires '--moduleResolution bundler' and either '--noEmit' or '--emitDeclarationOnly' to be set. */
    // "rewriteRelativeImportExtensions": true,          /* Rewrite '.ts', '.tsx', '.mts', and '.cts' file extensions in relative import paths to their JavaScript equivalent in output files. */
    // "resolvePackageJsonExports": true,                /* Use the package.json 'exports' field when resolving package imports. */
    // "resolvePackageJsonImports": true,                /* Use the package.json 'imports' field when resolving imports. */
    // "customConditions": [],                           /* Conditions to set in addition to the resolver-specific defaults when resolving imports. */
    // "noUncheckedSideEffectImports": true,             /* Check side effect imports. */
    // "resolveJsonModule": true,                        /* Enable importing .json files. */
    // "allowArbitraryExtensions": true,                 /* Enable importing files with any extension, provided a declaration file is present. */
    // "noResolve": true,                                /* Disallow 'import's, 'require's or '<reference>'s from expanding the number of files TypeScript should add to a project. */

    /* JavaScript Support */
    // "allowJs": true,                                  /* Allow JavaScript files to be a part of your program. Use the 'checkJs' option to get errors from these files. */
    // "checkJs": true,                                  /* Enable error reporting in type-checked JavaScript files. */
    // "maxNodeModuleJsDepth": 1,                        /* Specify the maximum folder depth used for checking JavaScript files from 'node_modules'. Only applicable with 'allowJs'. */

    /* Emit */
    // "declaration": true,                              /* Generate .d.ts files from TypeScript and JavaScript files in your project. */
    // "declarationMap": true,                           /* Create sourcemaps for d.ts files. */
    // "emitDeclarationOnly": true,                      /* Only output d.ts files and not JavaScript files. */
    // "sourceMap": true,                                /* Create source map files for emitted JavaScript files. */
    // "inlineSourceMap": true,                          /* Include sourcemap files inside the emitted JavaScript. */
    // "noEmit": true,                                   /* Disable emitting files from a compilation. */
    // "outFile": "./",                                  /* Specify a file that bundles all outputs into one JavaScript file. If 'declaration' is true, also designates a file that bundles all .d.ts output. */
    "outDir": "dist",                                   /* Specify an output folder for all emitted files. */
    // "removeComments": true,                           /* Disable emitting comments. */
    // "importHelpers": true,                            /* Allow importing helper functions from tslib once per project, instead of including them per-file. */
    // "downlevelIteration": true,                       /* Emit more compliant, but verbose and less performant JavaScript for iteration. */
    // "sourceRoot": "",                                 /* Specify the root path for debuggers to find the reference source code. */
    // "mapRoot": "",                                    /* Specify the location where debugger should locate map files instead of generated locations. */
    // "inlineSources": true,                            /* Include source code in the sourcemaps inside the emitted JavaScript. */
    // "emitBOM": true,                                  /* Emit a UTF-8 Byte Order Mark (BOM) in the beginning of output files. */
    // "newLine": "crlf",                                /* Set the newline character for emitting files. */
    // "stripInternal": true,                            /* Disable emitting declarations that have '@internal' in their JSDoc comments. */
    // "noEmitHelpers": true,                            /* Disable generating custom helper functions like '__extends' in compiled output. */
    // "noEmitOnError": true,                            /* Disable emitting files if any type checking errors are reported. */
    // "preserveConstEnums": true,                       /* Disable erasing 'const enum' declarations in generated code. */
    // "declarationDir": "./",                           /* Specify the output directory for generated declaration files. */

    /* Interop Constraints */
    // "isolatedModules": true,                          /* Ensure that each file can be safely transpiled without relying on other imports. */
    // "verbatimModuleSyntax": true,                     /* Do not transform or elide any imports or exports not marked as type-only, ensuring they are written in the output file's format based on the 'module' setting. */
    // "isolatedDeclarations": true,                     /* Require sufficient annotation on exports so other tools can trivially generate declaration files. */
    // "erasableSyntaxOnly": true,                       /* Do not allow runtime constructs that are not part of ECMAScript. */
    // "allowSyntheticDefaultImports": true,             /* Allow 'import x from y' when a module doesn't have a default export. */
    "esModuleInterop": true,                             /* Emit additional JavaScript to ease support for importing CommonJS modules. This enables 'allowSyntheticDefaultImports' for type compatibility. */
    // "preserveSymlinks": true,                         /* Disable resolving symlinks to their realpath. This correlates to the same flag in node. */
    "forceConsistentCasingInFileNames": true,            /* Ensure that casing is correct in imports. */

    /* Type Checking */
    "strict": true,   
    "declaration": true,
"declarationMap": true,
"emitDeclarationOnly": false,
                                   /* Enable all strict type-checking options. */
    // "noImplicitAny": true,                            /* Enable error reporting for expressions and declarations with an implied 'any' type. */
    // "strictNullChecks": true,                         /* When type checking, take into account 'null' and 'undefined'. */
    // "strictFunctionTypes": true,                      /* When assigning functions, check to ensure parameters and the return values are subtype-compatible. */
    // "strictBindCallApply": true,                      /* Check that the arguments for 'bind', 'call', and 'apply' methods match the original function. */
    // "strictPropertyInitialization": true,             /* Check for class properties that are declared but not set in the constructor. */
    // "strictBuiltinIteratorReturn": true,              /* Built-in iterators are instantiated with a 'TReturn' type of 'undefined' instead of 'any'. */
    // "noImplicitThis": true,                           /* Enable error reporting when 'this' is given the type 'any'. */
    // "useUnknownInCatchVariables": true,               /* Default catch clause variables as 'unknown' instead of 'any'. */
    // "alwaysStrict": true,                             /* Ensure 'use strict' is always emitted. */
    // "noUnusedLocals": true,                           /* Enable error reporting when local variables aren't read. */
    // "noUnusedParameters": true,                       /* Raise an error when a function parameter isn't read. */
    // "exactOptionalPropertyTypes": true,               /* Interpret optional property types as written, rather than adding 'undefined'. */
    // "noImplicitReturns": true,                        /* Enable error reporting for codepaths that do not explicitly return in a function. */
    // "noFallthroughCasesInSwitch": true,               /* Enable error reporting for fallthrough cases in switch statements. */
    // "noUncheckedIndexedAccess": true,                 /* Add 'undefined' to a type when accessed using an index. */
    // "noImplicitOverride": true,                       /* Ensure overriding members in derived classes are marked with an override modifier. */
    // "noPropertyAccessFromIndexSignature": true,       /* Enforces using indexed accessors for keys declared using an indexed type. */
    // "allowUnusedLabels": true,                        /* Disable error reporting for unused labels. */
    // "allowUnreachableCode": true,                     /* Disable error reporting for unreachable code. */

    /* Completeness */
    // "skipDefaultLibCheck": true,                      /* Skip type checking .d.ts files that are included with TypeScript. */
    "skipLibCheck": true                                 /* Skip type checking all .d.ts files. */
  },
    "references": [{ "path": "../shared" }],
 "include": ["**/*.ts"],
  "exclude": ["node_modules","dist"]
}


--- C:\work\amplify-new\backend\config\NodemailerConfig.ts ---

import nodemailer from 'nodemailer';
import config from './index';

const transporter = nodemailer.createTransport({
  host: config.email_host,
  port: config.email_port,
  secure: true, // use SSL
  auth: {
    user: config.email_user,
    pass: config.email_pass,
  },
} as nodemailer.TransportOptions);

export default transporter;


--- C:\work\amplify-new\backend\config\db.ts ---

import mongoose from "mongoose";
import config from "./index";

const connectDB = async () => {
  try {
    await mongoose.connect(config.database_url as string);
    console.log("MongoDB connected");
  } catch (error) {
    console.error("MongoDB connection error:", error);
    process.exit(1);
  }
};

export default connectDB;


--- C:\work\amplify-new\backend\config\index.ts ---

import dotenv from "dotenv";
dotenv.config();

const config = {
  port: process.env.PORT,
  database_url: process.env.DATABASE_URL,
  bcrypt_salt_rounds: process.env.BCRYPT_SALT_ROUNDS,
  jwt_access_secret: process.env.JWT_ACCESS_SECRET,
  jwt_refresh_secret: process.env.JWT_REFRESH_SECRET,
  jwt_access_expires_in: process.env.JWT_ACCESS_EXPIRES_IN,
  jwt_refresh_expires_in: process.env.JWT_REFRESH_EXPIRES_IN,
  frontend_base_url: process.env.FRONTEND_BASE_URL,
  email_host: process.env.EMAIL_HOST,
  email_port: process.env.EMAIL_PORT,
  email_user: process.env.EMAIL_USER,
  email_pass: process.env.EMAIL_PASS,
  stripe_secret_key: process.env.STRIPE_SECRET_KEY,
  aws_access_key_id: process.env.AWS_ACCESS_KEY_ID,
  aws_secret_access_key: process.env.AWS_SECRET_ACCESS_KEY,
  aws_region: process.env.AWS_REGION,
  aws_s3_bucket_name: process.env.AWS_S3_BUCKET_NAME,
};

export default config;


--- C:\work\amplify-new\backend\constants\emailTemplates.ts ---

export const verificationEmailTemplate = (name: string, verificationLink: string) => `
  <div style="font-family: Arial, sans-serif; line-height: 1.6;">
    <h2>Hello ${name},</h2>
    <p>Thank you for registering. Please verify your email by clicking the link below:</p>
    <a href="${verificationLink}" style="background-color: #4CAF50; color: white; padding: 14px 25px; text-align: center; text-decoration: none; display: inline-block;">Verify Email</a>
    <p>If you did not create an account, please ignore this email.</p>
  </div>
`;


--- C:\work\amplify-new\backend\constants\roles.ts ---

export const ROLES = {
    PARTICIPANT: 'participant',
    OBSERVER: 'observer',
    MODERATOR: 'moderator',
    ADMIN: 'admin',
  };
  


--- C:\work\amplify-new\backend\controllers\LiveSessionController.ts ---

import { Request, Response } from "express";
import catchAsync from "../utils/catchAsync";
import { LiveSessionService } from "../processors/liveSession/sessionService";
import sendResponse from "../utils/sendResponse";
import httpStatus from "http-status";

const createLiveSession = catchAsync(async (req: Request, res: Response) => {
    const result = await LiveSessionService.createLiveSession(req.body);
    sendResponse(res, {
        statusCode: httpStatus.CREATED,
        success: true,
        message: "Live session created successfully",
        data: result,
    });
});

const getLiveSessionById = catchAsync(async (req: Request, res: Response) => {
    const { id } = req.params;
    const result = await LiveSessionService.getLiveSessionById(id);
    sendResponse(res, {
        statusCode: httpStatus.OK,
        success: true,
        message: "Live session fetched successfully",
        data: result,
    });
});

const getAllLiveSessions = catchAsync(async (req: Request, res: Response) => {
    const result = await LiveSessionService.getAllLiveSessions();
    sendResponse(res, {
        statusCode: httpStatus.OK,
        success: true,
        message: "All live sessions fetched successfully",
        data: result,
    });
});

const updateLiveSession = catchAsync(async (req: Request, res: Response) => {
    const { id } = req.params;
    const result = await LiveSessionService.updateLiveSession(id, req.body);
    sendResponse(res, {
        statusCode: httpStatus.OK,
        success: true,
        message: "Live session updated successfully",
        data: result,
    });
});

const deleteLiveSession = catchAsync(async (req: Request, res: Response) => {
    const { id } = req.params;
    await LiveSessionService.deleteLiveSession(id);
    sendResponse(res, {
        statusCode: httpStatus.OK,
        success: true,
        message: "Live session deleted successfully",
        data: null,
    });
});

export const LiveSessionController = {
    createLiveSession,
    getLiveSessionById,
    getAllLiveSessions,
    updateLiveSession,
    deleteLiveSession,
};


--- C:\work\amplify-new\backend\controllers\ModeratorController.ts ---

import { Request, Response } from 'express';
import catchAsync from '../utils/catchAsync';
import { ModeratorService } from '../services/ModeratorService';
import sendResponse from '../utils/sendResponse';
import httpStatus from 'http-status';

const createModerator = catchAsync(async (req: Request, res: Response) => {
  const result = await ModeratorService.createModerator(req.body);
  sendResponse(res, {
    statusCode: httpStatus.CREATED,
    success: true,
    message: 'Moderator created successfully',
    data: result,
  });
});

const getModeratorById = catchAsync(async (req: Request, res: Response) => {
  const { id } = req.params;
  const result = await ModeratorService.getModeratorById(id);
  sendResponse(res, {
    statusCode: httpStatus.OK,
    success: true,
    message: 'Moderator fetched successfully',
    data: result,
  });
});

const getAllModerators = catchAsync(async (req: Request, res: Response) => {
  const result = await ModeratorService.getAllModerators();
  sendResponse(res, {
    statusCode: httpStatus.OK,
    success: true,
    message: 'All moderators fetched successfully',
    data: result,
  });
});

const updateModerator = catchAsync(async (req: Request, res: Response) => {
  const { id } = req.params;
  const result = await ModeratorService.updateModerator(id, req.body);
  sendResponse(res, {
    statusCode: httpStatus.OK,
    success: true,
    message: 'Moderator updated successfully',
    data: result,
  });
});

const deleteModerator = catchAsync(async (req: Request, res: Response) => {
  const { id } = req.params;
  await ModeratorService.deleteModerator(id);
  sendResponse(res, {
    statusCode: httpStatus.OK,
    success: true,
    message: 'Moderator deleted successfully',
    data: null,
  });
});

export const ModeratorController = {
  createModerator,
  getModeratorById,
  getAllModerators,
  updateModerator,
  deleteModerator,
};


--- C:\work\amplify-new\backend\controllers\ObserverDocumentController.ts ---

import { Request, Response } from 'express';
import catchAsync from '../utils/catchAsync';
import { ObserverDocumentService } from '../services/ObserverDocumentService';
import sendResponse from '../utils/sendResponse';
import httpStatus from 'http-status';

const createObserverDocument = catchAsync(async (req: Request, res: Response) => {
  const result = await ObserverDocumentService.createObserverDocument(req.body);
  sendResponse(res, {
    statusCode: httpStatus.CREATED,
    success: true,
    message: 'Observer document created successfully',
    data: result,
  });
});

const getObserverDocumentById = catchAsync(async (req: Request, res: Response) => {
  const { id } = req.params;
  const result = await ObserverDocumentService.getObserverDocumentById(id);
  sendResponse(res, {
    statusCode: httpStatus.OK,
    success: true,
    message: 'Observer document fetched successfully',
    data: result,
  });
});

const getAllObserverDocuments = catchAsync(async (req: Request, res: Response) => {
  const result = await ObserverDocumentService.getAllObserverDocuments();
  sendResponse(res, {
    statusCode: httpStatus.OK,
    success: true,
    message: 'All observer documents fetched successfully',
    data: result,
  });
});

const updateObserverDocument = catchAsync(async (req: Request, res: Response) => {
  const { id } = req.params;
  const result = await ObserverDocumentService.updateObserverDocument(id, req.body);
  sendResponse(res, {
    statusCode: httpStatus.OK,
    success: true,
    message: 'Observer document updated successfully',
    data: result,
  });
});

const deleteObserverDocument = catchAsync(async (req: Request, res: Response) => {
  const { id } = req.params;
  await ObserverDocumentService.deleteObserverDocument(id);
  sendResponse(res, {
    statusCode: httpStatus.OK,
    success: true,
    message: 'Observer document deleted successfully',
    data: null,
  });
});

export const ObserverDocumentController = {
  createObserverDocument,
  getObserverDocumentById,
  getAllObserverDocuments,
  updateObserverDocument,
  deleteObserverDocument,
};


--- C:\work\amplify-new\backend\controllers\PaymentController.ts ---

import { Request, Response } from 'express';
import catchAsync from '../utils/catchAsync';
import { PaymentService } from '../services/PaymentService';
import sendResponse from '../utils/sendResponse';
import httpStatus from 'http-status';

const createPaymentIntent = catchAsync(async (req: Request, res: Response) => {
  const { amount, currency } = req.body;
  const paymentIntent = await PaymentService.createPaymentIntent(amount, currency);
  sendResponse(res, {
    statusCode: httpStatus.CREATED,
    success: true,
    message: 'Payment intent created successfully',
    data: {
      clientSecret: paymentIntent.client_secret,
    },
  });
});

export const PaymentController = {
  createPaymentIntent,
};


--- C:\work\amplify-new\backend\controllers\PollController.ts ---

import { Request, Response } from 'express';
import catchAsync from '../utils/catchAsync';
import { PollService } from '../services/PollService';
import sendResponse from '../utils/sendResponse';
import httpStatus from 'http-status';

const createPoll = catchAsync(async (req: Request, res: Response) => {
  const result = await PollService.createPoll(req.body);
  sendResponse(res, {
    statusCode: httpStatus.CREATED,
    success: true,
    message: 'Poll created successfully',
    data: result,
  });
});

const getPollById = catchAsync(async (req: Request, res: Response) => {
  const { id } = req.params;
  const result = await PollService.getPollById(id);
  sendResponse(res, {
    statusCode: httpStatus.OK,
    success: true,
    message: 'Poll fetched successfully',
    data: result,
  });
});

const getAllPolls = catchAsync(async (req: Request, res: Response) => {
  const result = await PollService.getAllPolls();
  sendResponse(res, {
    statusCode: httpStatus.OK,
    success: true,
    message: 'All polls fetched successfully',
    data: result,
  });
});

const updatePoll = catchAsync(async (req: Request, res: Response) => {
  const { id } = req.params;
  const result = await PollService.updatePoll(id, req.body);
  sendResponse(res, {
    statusCode: httpStatus.OK,
    success: true,
message: 'Poll updated successfully',
    data: result,
  });
});

const deletePoll = catchAsync(async (req: Request, res: Response) => {
  const { id } = req.params;
  await PollService.deletePoll(id);
  sendResponse(res, {
    statusCode: httpStatus.OK,
    success: true,
    message: 'Poll deleted successfully',
    data: null,
  });
});

export const PollController = {
  createPoll,
  getPollById,
  getAllPolls,
  updatePoll,
  deletePoll,
};


--- C:\work\amplify-new\backend\controllers\ProjectController.ts ---

import { Request, Response } from 'express';
import catchAsync from '../utils/catchAsync';
import { ProjectService } from '../services/ProjectService';
import sendResponse from '../utils/sendResponse';
import httpStatus from 'http-status';

const createProject = catchAsync(async (req: Request, res: Response) => {
  const result = await ProjectService.createProject(req.body);
  sendResponse(res, {
    statusCode: httpStatus.CREATED,
    success: true,
    message: 'Project created successfully',
    data: result,
  });
});

const getProjectById = catchAsync(async (req: Request, res: Response) => {
  const { id } = req.params;
  const result = await ProjectService.getProjectById(id);
  sendResponse(res, {
    statusCode: httpStatus.OK,
    success: true,
    message: 'Project fetched successfully',
    data: result,
  });
});

const getAllProjects = catchAsync(async (req: Request, res: Response) => {
  const result = await ProjectService.getAllProjects();
  sendResponse(res, {
    statusCode: httpStatus.OK,
    success: true,
    message: 'All projects fetched successfully',
    data: result,
  });
});

const updateProject = catchAsync(async (req: Request, res: Response) => {
  const { id } = req.params;
  const result = await ProjectService.updateProject(id, req.body);
  sendResponse(res, {
    statusCode: httpStatus.OK,
    success: true,
    message: 'Project updated successfully',
    data: result,
  });
});

const deleteProject = catchAsync(async (req: Request, res: Response) => {
  const { id } = req.params;
  await ProjectService.deleteProject(id);
  sendResponse(res, {
    statusCode: httpStatus.OK,
    success: true,
    message: 'Project deleted successfully',
    data: null,
  });
});

export const ProjectController = {
  createProject,
  getProjectById,
  getAllProjects,
  updateProject,
  deleteProject,
};


--- C:\work\amplify-new\backend\controllers\SessionController.ts ---

import { Request, Response } from 'express';
import catchAsync from '../utils/catchAsync';
import { SessionService } from '../services/SessionService';
import sendResponse from '../utils/sendResponse';
import httpStatus from 'http-status';

const createSession = catchAsync(async (req: Request, res: Response) => {
  const result = await SessionService.createSession(req.body);
  sendResponse(res, {
    statusCode: httpStatus.CREATED,
    success: true,
    message: 'Session created successfully',
    data: result,
  });
});

const getSessionById = catchAsync(async (req: Request, res: Response) => {
  const { id } = req.params;
  const result = await SessionService.getSessionById(id);
  sendResponse(res, {
    statusCode: httpStatus.OK,
    success: true,
    message: 'Session fetched successfully',
    data: result,
  });
});

const getAllSessions = catchAsync(async (req: Request, res: Response) => {
  const result = await SessionService.getAllSessions();
  sendResponse(res, {
    statusCode: httpStatus.OK,
    success: true,
    message: 'All sessions fetched successfully',
    data: result,
  });
});

const updateSession = catchAsync(async (req: Request, res: Response) => {
  const { id } = req.params;
  const result = await SessionService.updateSession(id, req.body);
  sendResponse(res, {
    statusCode: httpStatus.OK,
    success: true,
    message: 'Session updated successfully',
    data: result,
  });
});

const deleteSession = catchAsync(async (req: Request, res: Response) => {
  const { id } = req.params;
  await SessionService.deleteSession(id);
  sendResponse(res, {
    statusCode: httpStatus.OK,
    success: true,
    message: 'Session deleted successfully',
    data: null,
  });
});

export const SessionController = {
  createSession,
  getSessionById,
  getAllSessions,
  updateSession,
  deleteSession,
};


--- C:\work\amplify-new\backend\controllers\SessionDeliverableController.ts ---

import { Request, Response } from 'express';
import catchAsync from '../utils/catchAsync';
import { SessionDeliverableService } from '../services/SessionDeliverableService';
import sendResponse from '../utils/sendResponse';
import httpStatus from 'http-status';

const createSessionDeliverable = catchAsync(async (req: Request, res: Response) => {
  const result = await SessionDeliverableService.createSessionDeliverable(req.body);
  sendResponse(res, {
    statusCode: httpStatus.CREATED,
    success: true,
    message: 'Session deliverable created successfully',
    data: result,
  });
});

const getSessionDeliverableById = catchAsync(async (req: Request, res: Response) => {
  const { id } = req.params;
  const result = await SessionDeliverableService.getSessionDeliverableById(id);
  sendResponse(res, {
    statusCode: httpStatus.OK,
    success: true,
    message: 'Session deliverable fetched successfully',
    data: result,
  });
});

const getAllSessionDeliverables = catchAsync(async (req: Request, res: Response) => {
  const result = await SessionDeliverableService.getAllSessionDeliverables();
  sendResponse(res, {
    statusCode: httpStatus.OK,
    success: true,
    message: 'All session deliverables fetched successfully',
    data: result,
  });
});

const updateSessionDeliverable = catchAsync(async (req: Request, res: Response) => {
  const { id } = req.params;
  const result = await SessionDeliverableService.updateSessionDeliverable(id, req.body);
  sendResponse(res, {
    statusCode: httpStatus.OK,
    success: true,
    message: 'Session deliverable updated successfully',
    data: result,
  });
});

const deleteSessionDeliverable = catchAsync(async (req: Request, res: Response) => {
  const { id } = req.params;
  await SessionDeliverableService.deleteSessionDeliverable(id);
  sendResponse(res, {
    statusCode: httpStatus.OK,
    success: true,
    message: 'Session deliverable deleted successfully',
    data: null,
  });
});

export const SessionDeliverableController = {
  createSessionDeliverable,
  getSessionDeliverableById,
  getAllSessionDeliverables,
  updateSessionDeliverable,
  deleteSessionDeliverable,
};


--- C:\work\amplify-new\backend\controllers\TagController.ts ---

import { Request, Response } from 'express';
import catchAsync from '../utils/catchAsync';
import { TagService } from '../services/TagService';
import sendResponse from '../utils/sendResponse';
import httpStatus from 'http-status';

const createTag = catchAsync(async (req: Request, res: Response) => {
  const result = await TagService.createTag(req.body);
  sendResponse(res, {
    statusCode: httpStatus.CREATED,
    success: true,
    message: 'Tag created successfully',
    data: result,
  });
});

const getTagById = catchAsync(async (req: Request, res: Response) => {
  const { id } = req.params;
  const result = await TagService.getTagById(id);
  sendResponse(res, {
    statusCode: httpStatus.OK,
    success: true,
    message: 'Tag fetched successfully',
    data: result,
  });
});

const getAllTags = catchAsync(async (req: Request, res: Response) => {
  const result = await TagService.getAllTags();
  sendResponse(res, {
    statusCode: httpStatus.OK,
    success: true,
    message: 'All tags fetched successfully',
    data: result,
  });
});

const updateTag = catchAsync(async (req: Request, res: Response) => {
  const { id } = req.params;
  const result = await TagService.updateTag(id, req.body);
  sendResponse(res, {
    statusCode: httpStatus.OK,
    success: true,
    message: 'Tag updated successfully',
    data: result,
  });
});

const deleteTag = catchAsync(async (req: Request, res: Response) => {
  const { id } = req.params;
  await TagService.deleteTag(id);
  sendResponse(res, {
    statusCode: httpStatus.OK,
    success: true,
    message: 'Tag deleted successfully',
    data: null,
  });
});

export const TagController = {
  createTag,
  getTagById,
  getAllTags,
  updateTag,
  deleteTag,
};


--- C:\work\amplify-new\backend\controllers\UserController.ts ---

import { Request, Response } from "express";
import catchAsync from "../utils/catchAsync";
import { UserService } from "../services/UserService";
import sendResponse from "../utils/sendResponse";
import httpStatus from "http-status";
import { IUser } from "../interfaces/user";
import { RemovePasswordFromUserObject } from "../processors/user/RemovePasswordFromUserObjectProcessor";
import { UserActivityService } from "../services/UserActivityService";
import { IRequestWithUser } from "../interfaces/IRequestWithUser";

const registerUser = catchAsync(async (req: Request, res: Response) => {
  const result = await UserService.registerUser(req.body);
  sendResponse(res, {
    statusCode: httpStatus.CREATED,
    success: true,
    message: "User registered successfully",
    data: result,
  });
});

const loginUser = catchAsync(async (req: Request, res: Response) => {
  const { accessToken, refreshToken, user } = await UserService.loginUser(
    req.body
  );

  res.cookie("refreshToken", refreshToken, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
  });

  const userWithoutPassword = RemovePasswordFromUserObject.execute(
    user as IUser
  );

  sendResponse(res, {
    statusCode: httpStatus.OK,
    success: true,
    message: "User logged in successfully",
    data: {
      user: userWithoutPassword,
      accessToken,
    },
  });
});

const refreshToken = catchAsync(async (req: Request, res: Response) => {
  const { refreshToken } = req.cookies;
  const result = await UserService.refreshToken(refreshToken);
  sendResponse(res, {
    statusCode: httpStatus.OK,
    success: true,
    message: "Access token refreshed successfully",
    data: result,
  });
});

const getUserProfile = catchAsync(async (req: IRequestWithUser, res: Response) => {
  const userId = req.user?.id;
  const user = await UserService.getUserProfile(userId as string);
  sendResponse(res, {
    statusCode: httpStatus.OK,
    success: true,
    message: "User profile fetched successfully",
    data: user,
  });
});

const getAllUsers = catchAsync(async (req: Request, res: Response) => {
  const users = await UserService.getAllUsers();
  sendResponse(res, {
    statusCode: httpStatus.OK,
    success: true,
    message: "All users fetched successfully",
    data: users,
  });
});

const verifyEmail = catchAsync(async (req: Request, res: Response) => {
  const { token } = req.params;
  await UserService.verifyEmail(token);
  sendResponse(res, {
    statusCode: httpStatus.OK,
    success: true,
    message: "Email verified successfully",
    data: null,
  });
});

const getUserActivity = catchAsync(async (req: Request, res: Response) => {
  const { userId } = req.params;
  const activities = await UserActivityService.getUserActivity(userId);
  sendResponse(res, {
    statusCode: httpStatus.OK,
    success: true,
    message: "User activity fetched successfully",
    data: activities,
  });
});

export const UserController = {
  registerUser,
  loginUser,
  refreshToken,
  getUserProfile,
  getAllUsers,
  verifyEmail,
  getUserActivity,
};


--- C:\work\amplify-new\backend\middlewares\CatchErrorMiddleware.ts ---

import { Request, Response, NextFunction } from 'express';

// Utility to catch errors from async middleware/handlers
const catchAsync = (fn: (req: Request, res: Response, next: NextFunction) => Promise<any>) => 
  (req: Request, res: Response, next: NextFunction) => {
    Promise.resolve(fn(req, res, next)).catch(next);
  };

export default catchAsync;


--- C:\work\amplify-new\backend\middlewares\ErrorMiddleware.ts ---

import { Request, Response, NextFunction } from 'express';

const errorMiddleware = (err: any, req: Request, res: Response, next: NextFunction) => {
  console.error(err.stack);
  res.status(500).send('Something broke!');
};

export default errorMiddleware;


--- C:\work\amplify-new\backend\middlewares\authenticateJwt.ts ---

import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import config from '../config';
import { IRequestWithUser } from '../interfaces/IRequestWithUser';

export const authenticateJwt = (req: IRequestWithUser, res: Response, next: NextFunction) => {
  const authHeader = req.headers.authorization;

  if (authHeader) {
    const token = authHeader.split(' ')[1];

    jwt.verify(token, config.jwt_access_secret as string, (err, user) => {
      if (err) {
        return res.sendStatus(403); // Forbidden
      }
      req.user = user as { id: string; role: string };
      next();
    });
  } else {
    res.sendStatus(401); // Unauthorized
  }
};


--- C:\work\amplify-new\backend\middlewares\authorizeRoles.ts ---

import { Response, NextFunction } from 'express';
import { IRequestWithUser } from '../interfaces/IRequestWithUser';

export const authorizeRoles = (...allowedRoles: string[]) => {
  return (req: IRequestWithUser, res: Response, next: NextFunction) => {
    if (!req.user || !allowedRoles.includes(req.user.role)) {
      return res.status(403).json({ message: 'Forbidden' });
    }
    next();
  };
};


--- C:\work\amplify-new\backend\middlewares\deviceInfo.ts ---

import { Request, Response, NextFunction } from 'express';
import useragent from 'express-useragent';
import requestIp from 'request-ip';
import geoip from 'geoip-lite';
import { IRequestWithUser } from '../interfaces/IRequestWithUser';

export const deviceInfoMiddleware = (req: IRequestWithUser, res: Response, next: NextFunction) => {
  // User agent
  const source = req.headers['user-agent'] || '';
  req.useragent = useragent.parse(source);

  // IP address
  req.clientIp = requestIp.getClientIp(req);

  // Geolocation
  if (req.clientIp) {
    req.geolocation = geoip.lookup(req.clientIp);
  }

  next();
};


--- C:\work\amplify-new\backend\model\ChatModel.ts ---

import { Schema, model, Document } from 'mongoose';

export interface IChat extends Document {
  message: string;
  sender: Schema.Types.ObjectId;
  receiver: Schema.Types.ObjectId;
  timestamp: Date;
}

const ChatSchema = new Schema<IChat>({
  message: { type: String, required: true },
  sender: { type: Schema.Types.ObjectId, ref: 'User', required: true },
  receiver: { type: Schema.Types.ObjectId, ref: 'User', required: true },
  timestamp: { type: Date, default: Date.now },
});

export default model<IChat>('Chat', ChatSchema);


--- C:\work\amplify-new\backend\model\GroupMessage.ts ---

import { Schema, model, Document } from 'mongoose';

export interface IGroupMessage extends Document {
  message: string;
  sender: Schema.Types.ObjectId;
  group: Schema.Types.ObjectId;
  timestamp: Date;
}

const GroupMessageSchema = new Schema<IGroupMessage>({
  message: { type: String, required: true },
  sender: { type: Schema.Types.ObjectId, ref: 'User', required: true },
  group: { type: Schema.Types.ObjectId, ref: 'Group', required: true },
  timestamp: { type: Date, default: Date.now },
});

export default model<IGroupMessage>('GroupMessage', GroupMessageSchema);


--- C:\work\amplify-new\backend\model\LiveSessionModel.ts ---

import { Schema, model, Document } from 'mongoose';

export interface ILiveSession extends Document {
  title: string;
  description: string;
  startTime: Date;
  endTime: Date;
  participants: Schema.Types.ObjectId[];
  // Add other relevant fields
}

const LiveSessionSchema = new Schema<ILiveSession>({
  title: { type: String, required: true },
  description: { type: String, required: true },
  startTime: { type: Date, required: true },
  endTime: { type: Date, required: true },
  participants: [{ type: Schema.Types.ObjectId, ref: 'User' }],
});

export default model<ILiveSession>('LiveSession', LiveSessionSchema);


--- C:\work\amplify-new\backend\model\ModeratorModel.ts ---

import { Schema, model, Document } from 'mongoose';

export interface IModerator extends Document {
  user: Schema.Types.ObjectId;
  // Add other relevant fields
}

const ModeratorSchema = new Schema<IModerator>({
  user: { type: Schema.Types.ObjectId, ref: 'User', required: true },
});

export default model<IModerator>('Moderator', ModeratorSchema);


--- C:\work\amplify-new\backend\model\ObserverDocumentModel.ts ---

import { Schema, model, Document } from 'mongoose';

export interface IObserverDocument extends Document {
  title: string;
  url: string;
  uploadedBy: Schema.Types.ObjectId;
  // Add other relevant fields
}

const ObserverDocumentSchema = new Schema<IObserverDocument>({
  title: { type: String, required: true },
  url: { type: String, required: true },
  uploadedBy: { type: Schema.Types.ObjectId, ref: 'User', required: true },
});

export default model<IObserverDocument>('ObserverDocument', ObserverDocumentSchema);


--- C:\work\amplify-new\backend\model\ObserverGroupMessage.ts ---

import { Schema, model, Document } from 'mongoose';

export interface IObserverGroupMessage extends Document {
  message: string;
  sender: Schema.Types.ObjectId;
  group: Schema.Types.ObjectId;
  timestamp: Date;
}

const ObserverGroupMessageSchema = new Schema<IObserverGroupMessage>({
  message: { type: String, required: true },
  sender: { type: Schema.Types.ObjectId, ref: 'User', required: true },
  group: { type: Schema.Types.ObjectId, ref: 'ObserverGroup', required: true },
  timestamp: { type: Date, default: Date.now },
});

export default model<IObserverGroupMessage>('ObserverGroupMessage', ObserverGroupMessageSchema);


--- C:\work\amplify-new\backend\model\ObserverWaitingRoomChatModel.ts ---

import { Schema, model, Document } from 'mongoose';

export interface IObserverWaitingRoomChat extends Document {
  message: string;
  sender: Schema.Types.ObjectId;
  session: Schema.Types.ObjectId;
  timestamp: Date;
}

const ObserverWaitingRoomChatSchema = new Schema<IObserverWaitingRoomChat>({
  message: { type: String, required: true },
  sender: { type: Schema.Types.ObjectId, ref: 'User', required: true },
  session: { type: Schema.Types.ObjectId, ref: 'LiveSession', required: true },
  timestamp: { type: Date, default: Date.now },
});

export default model<IObserverWaitingRoomChat>('ObserverWaitingRoomChat', ObserverWaitingRoomChatSchema);


--- C:\work\amplify-new\backend\model\ParticipantMeetingChatModel.ts ---

import { Schema, model, Document } from 'mongoose';

export interface IParticipantMeetingChat extends Document {
  message: string;
  sender: Schema.Types.ObjectId;
  session: Schema.Types.ObjectId;
  timestamp: Date;
}

const ParticipantMeetingChatSchema = new Schema<IParticipantMeetingChat>({
  message: { type: String, required: true },
  sender: { type: Schema.Types.ObjectId, ref: 'User', required: true },
  session: { type: Schema.Types.ObjectId, ref: 'LiveSession', required: true },
  timestamp: { type: Date, default: Date.now },
});

export default model<IParticipantMeetingChat>('ParticipantMeetingChat', ParticipantMeetingChatSchema);


--- C:\work\amplify-new\backend\model\ParticipantWaitingRoomChatModel.ts ---

import { Schema, model, Document } from 'mongoose';

export interface IParticipantWaitingRoomChat extends Document {
  message: string;
  sender: Schema.Types.ObjectId;
  session: Schema.Types.ObjectId;
  timestamp: Date;
}

const ParticipantWaitingRoomChatSchema = new Schema<IParticipantWaitingRoomChat>({
  message: { type: String, required: true },
  sender: { type: Schema.Types.ObjectId, ref: 'User', required: true },
  session: { type: Schema.Types.ObjectId, ref: 'LiveSession', required: true },
  timestamp: { type: Date, default: Date.now },
});

export default model<IParticipantWaitingRoomChat>('ParticipantWaitingRoomChat', ParticipantWaitingRoomChatSchema);


--- C:\work\amplify-new\backend\model\PollModel.ts ---

import { Schema, model, Document } from 'mongoose';

export interface IPoll extends Document {
  question: string;
  options: string[];
  votes: number[];
  createdBy: Schema.Types.ObjectId;
}

const PollSchema = new Schema<IPoll>({
  question: { type: String, required: true },
  options: [{ type: String, required: true }],
  votes: [{ type: Number, default: 0 }],
  createdBy: { type: Schema.Types.ObjectId, ref: 'User', required: true },
});

export default model<IPoll>('Poll', PollSchema);


--- C:\work\amplify-new\backend\model\ProjectFormModel.ts ---

import { Schema, model, Document } from 'mongoose';

export interface IProjectForm extends Document {
  projectId: Schema.Types.ObjectId;
  formSchema: any; // Flexible schema for different forms
  formData: any;
}

const ProjectFormSchema = new Schema<IProjectForm>({
  projectId: { type: Schema.Types.ObjectId, ref: 'Project', required: true },
  formSchema: { type: Schema.Types.Mixed, required: true },
  formData: { type: Schema.Types.Mixed },
});

export default model<IProjectForm>('ProjectForm', ProjectFormSchema);


--- C:\work\amplify-new\backend\model\ProjectModel.ts ---

import { Schema, model, Document } from 'mongoose';

export interface IProject extends Document {
  name: string;
  description: string;
  owner: Schema.Types.ObjectId;
  members: Schema.Types.ObjectId[];
}

const ProjectSchema = new Schema<IProject>({
  name: { type: String, required: true },
  description: { type: String, required: true },
  owner: { type: Schema.Types.ObjectId, ref: 'User', required: true },
  members: [{ type: Schema.Types.ObjectId, ref: 'User' }],
});

export default model<IProject>('Project', ProjectSchema);


--- C:\work\amplify-new\backend\model\SessionDeliverableModel.ts ---

import { Schema, model, Document } from 'mongoose';

export interface ISessionDeliverable extends Document {
  title: string;
  description: string;
  fileUrl: string;
  session: Schema.Types.ObjectId;
}

const SessionDeliverableSchema = new Schema<ISessionDeliverable>({
  title: { type: String, required: true },
  description: { type: String, required: true },
  fileUrl: { type: String, required: true },
  session: { type: Schema.Types.ObjectId, ref: 'Session', required: true },
});

export default model<ISessionDeliverable>('SessionDeliverable', SessionDeliverableSchema);


--- C:\work\amplify-new\backend\model\SessionModel.ts ---

import { Schema, model, Document } from 'mongoose';

export interface ISession extends Document {
  title: string;
  description: string;
  startTime: Date;
  endTime: Date;
  project: Schema.Types.ObjectId;
}

const SessionSchema = new Schema<ISession>({
  title: { type: String, required: true },
  description: { type: String, required: true },
  startTime: { type: Date, required: true },
  endTime: { type: Date, required: true },
  project: { type: Schema.Types.ObjectId, ref: 'Project', required: true },
});

export default model<ISession>('Session', SessionSchema);


--- C:\work\amplify-new\backend\model\TagModel.ts ---

import { Schema, model, Document } from 'mongoose';

export interface ITag extends Document {
  name: string;
  color: string;
}

const TagSchema = new Schema<ITag>({
  name: { type: String, required: true, unique: true },
  color: { type: String, required: true },
});

export default model<ITag>('Tag', TagSchema);


--- C:\work\amplify-new\backend\model\UserActivityModel.ts ---

import { Schema, model, Document } from 'mongoose';

export interface IUserActivity extends Document {
  userId: Schema.Types.ObjectId;
  activityType: string;
  ipAddress: string;
  device: string;
  browser: string;
  os: string;
  country: string;
  timestamp: Date;
}

const UserActivitySchema = new Schema<IUserActivity>({
  userId: { type: Schema.Types.ObjectId, ref: 'User', required: true },
  activityType: { type: String, required: true },
  ipAddress: { type: String },
  device: { type: String },
  browser: { type: String },
  os: { type: String },
  country: { type: String },
  timestamp: { type: Date, default: Date.now },
});

export default model<IUserActivity>('UserActivity', UserActivitySchema);


--- C:\work\amplify-new\backend\model\UserModel.ts ---

import { Schema, model } from "mongoose";
import { IUser } from "../interfaces/user";
import bcrypt from "bcrypt";
import config from "../config";

const UserSchema = new Schema<IUser>(
  {
    name: { type: String, required: true },
    email: { type: String, required: true, unique: true },
    password: { type: String, required: true },
    role: { type: String, enum: ["user", "admin"], default: "user" },
    isVerified: { type: Boolean, default: false },
    verificationToken: { type: String },
  },
  {
    timestamps: true,
  }
);

UserSchema.pre<IUser>("save", async function (next) {
  if (this.isModified("password")) {
    this.password = await bcrypt.hash(
      this.password,
      Number(config.bcrypt_salt_rounds)
    );
  }
  next();
});

export default model<IUser>("User", UserSchema);


--- C:\work\amplify-new\backend\processors\liveSession\sessionService.ts ---

import LiveSession, { ILiveSession } from '../../model/LiveSessionModel';

export const LiveSessionService = {
  async createLiveSession(data: Partial<ILiveSession>): Promise<ILiveSession> {
    const liveSession = new LiveSession(data);
    return await liveSession.save();
  },

  async getLiveSessionById(id: string): Promise<ILiveSession | null> {
    return await LiveSession.findById(id).populate('participants');
  },

  async getAllLiveSessions(): Promise<ILiveSession[]> {
    return await LiveSession.find().populate('participants');
  },

  async updateLiveSession(id: string, data: Partial<ILiveSession>): Promise<ILiveSession | null> {
    return await LiveSession.findByIdAndUpdate(id, data, { new: true });
  },

  async deleteLiveSession(id: string): Promise<void> {
    await LiveSession.findByIdAndDelete(id);
  },
};


--- C:\work\amplify-new\backend\processors\poll\QuestionValidationProcessor.ts ---

import { IPoll } from '../../model/PollModel';

export class QuestionValidationProcessor {
  static validate(pollData: Partial<IPoll>): void {
    if (!pollData.question || pollData.question.trim() === '') {
      throw new Error('Question cannot be empty.');
    }
    // Add more validation rules as needed
  }
}


--- C:\work\amplify-new\backend\processors\sendEmail\SendVerifyAccountEmailProcessor.ts ---

import transporter from '../../config/NodemailerConfig';
import { verificationEmailTemplate } from '../../constants/emailTemplates';

export class SendVerifyAccountEmailProcessor {
  static async execute(name: string, email: string, verificationLink: string) {
    const mailOptions = {
      from: process.env.EMAIL_USER,
      to: email,
      subject: 'Verify Your Email',
      html: verificationEmailTemplate(name, verificationLink),
    };

    await transporter.sendMail(mailOptions);
  }
}


--- C:\work\amplify-new\backend\processors\session\sessionTimeConflictChecker.ts ---

import Session, { ISession } from '../../model/SessionModel';

export class SessionTimeConflictChecker {
  static async check(sessionData: Partial<ISession>): Promise<boolean> {
    const { startTime, endTime, project } = sessionData;
    const conflictingSession = await Session.findOne({
      project,
      $or: [
        { startTime: { $lt: endTime, $gte: startTime } },
        { endTime: { $gt: startTime, $lte: endTime } },
      ],
    });
    return !!conflictingSession;
  }
}


--- C:\work\amplify-new\backend\processors\user\IsStrongPasswordProcessor.ts ---

export class IsStrongPasswordProcessor {
    static execute(password: string): boolean {
      // Add your strong password validation logic here
      // For example, require at least 8 characters, one uppercase, one lowercase, one number, and one special character
      const strongPasswordRegex = new RegExp(
        "^(?=.*[a-z])(?=.*[A-Z])(?=.*[0-9])(?=.*[!@#$%^&*])(?=.{8,})"
      );
      return strongPasswordRegex.test(password);
    }
  }
  


--- C:\work\amplify-new\backend\processors\user\IsValidEmailProcessor.ts ---

export class IsValidEmailProcessor {
    static execute(email: string): boolean {
      const emailRegex = new RegExp(
        "^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$"
      );
      return emailRegex.test(email);
    }
  }
  


--- C:\work\amplify-new\backend\processors\user\RemovePasswordFromUserObjectProcessor.ts ---

import { IUser } from "../../interfaces/user";

export class RemovePasswordFromUserObject {
  static execute(user: IUser): Omit<IUser, 'password'> {
    const { password, ...userWithoutPassword } = user.toObject ? user.toObject() : user;
    return userWithoutPassword;
  }
}


--- C:\work\amplify-new\backend\routes\index.ts ---

import { Router } from "express";
import userRoutes from "./user/userRoutes";
import projectRoutes from "./project/projectRoutes";
import sessionRoutes from "./session/SessionRoutes";
import tagRoutes from "./tag/TagRoutes";
import pollRoutes from "./poll/PollRoutes";
import paymentRoutes from "./payment/PaymentRoutes";
import observerDocumentRoutes from "./observerDocument/ObserverDocumentRoutes";
import moderatorRoutes from "./moderator/ModeratorRoutes";
import liveSessionRoutes from "./liveSession/LiveSessionRoutes";
import sessionDeliverableRoutes from "./sessionDeliverable/SessionDeliverableRoutes";

const router = Router();

const moduleRoutes = [
  {
    path: "/users",
    route: userRoutes,
  },
  {
    path: "/projects",
    route: projectRoutes,
  },
  {
    path: "/sessions",
    route: sessionRoutes,
  },
  {
    path: "/tags",
    route: tagRoutes,
  },
  {
    path: "/polls",
    route: pollRoutes,
  },
  {
    path: "/payments",
    route: paymentRoutes,
  },
  {
    path: "/observer-documents",
    route: observerDocumentRoutes,
  },
  {
    path: "/moderators",
    route: moderatorRoutes,
  },
  {
    path: "/live-sessions",
    route: liveSessionRoutes,
  },
  {
    path: "/session-deliverables",
    route: sessionDeliverableRoutes,
  },
];

moduleRoutes.forEach((route) => router.use(route.path, route.route));

export default router;


--- C:\work\amplify-new\backend\routes\liveSession\LiveSessionRoutes.ts ---

import { Router } from 'express';
import { LiveSessionController } from '../../controllers/LiveSessionController';
import { authenticateJwt } from '../../middlewares/authenticateJwt';
import { authorizeRoles } from '../../middlewares/authorizeRoles';
import { ROLES } from '../../constants/roles';

const router = Router();

router.post(
  '/',
  authenticateJwt,
  authorizeRoles(ROLES.ADMIN, ROLES.MODERATOR),
  LiveSessionController.createLiveSession
);

router.get('/', LiveSessionController.getAllLiveSessions);

router.get('/:id', LiveSessionController.getLiveSessionById);

router.put(
  '/:id',
  authenticateJwt,
  authorizeRoles(ROLES.ADMIN, ROLES.MODERATOR),
  LiveSessionController.updateLiveSession
);

router.delete(
  '/:id',
  authenticateJwt,
  authorizeRoles(ROLES.ADMIN, ROLES.MODERATOR),
  LiveSessionController.deleteLiveSession
);

export default router;


--- C:\work\amplify-new\backend\routes\moderator\ModeratorRoutes.ts ---

import { Router } from 'express';
import { ModeratorController } from '../../controllers/ModeratorController';
import { authenticateJwt } from '../../middlewares/authenticateJwt';
import { authorizeRoles } from '../../middlewares/authorizeRoles';
import { ROLES } from '../../constants/roles';

const router = Router();

router.post(
  '/',
  authenticateJwt,
  authorizeRoles(ROLES.ADMIN),
  ModeratorController.createModerator
);

router.get('/', ModeratorController.getAllModerators);

router.get('/:id', ModeratorController.getModeratorById);

router.put(
  '/:id',
  authenticateJwt,
  authorizeRoles(ROLES.ADMIN),
  ModeratorController.updateModerator
);

router.delete(
  '/:id',
  authenticateJwt,
  authorizeRoles(ROLES.ADMIN),
  ModeratorController.deleteModerator
);

export default router;


--- C:\work\amplify-new\backend\routes\observerDocument\ObserverDocumentRoutes.ts ---

import { Router } from 'express';
import { ObserverDocumentController } from '../../controllers/ObserverDocumentController';
import { authenticateJwt } from '../../middlewares/authenticateJwt';
import { authorizeRoles } from '../../middlewares/authorizeRoles';
import { ROLES } from '../../constants/roles';

const router = Router();

router.post(
  '/',
  authenticateJwt,
  authorizeRoles(ROLES.ADMIN, ROLES.MODERATOR),
  ObserverDocumentController.createObserverDocument
);

router.get('/', ObserverDocumentController.getAllObserverDocuments);

router.get('/:id', ObserverDocumentController.getObserverDocumentById);

router.put(
  '/:id',
  authenticateJwt,
  authorizeRoles(ROLES.ADMIN, ROLES.MODERATOR),
  ObserverDocumentController.updateObserverDocument
);

router.delete(
  '/:id',
  authenticateJwt,
  authorizeRoles(ROLES.ADMIN, ROLES.MODERATOR),
  ObserverDocumentController.deleteObserverDocument
);

export default router;


--- C:\work\amplify-new\backend\routes\payment\PaymentRoutes.ts ---

import { Router } from 'express';
import { PaymentController } from '../../controllers/PaymentController';
import { authenticateJwt } from '../../middlewares/authenticateJwt';

const router = Router();

router.post(
  '/create-payment-intent',
  authenticateJwt,
  PaymentController.createPaymentIntent
);

export default router;


--- C:\work\amplify-new\backend\routes\poll\PollRoutes.ts ---

import { Router } from 'express';
import { PollController } from '../../controllers/PollController';
import { authenticateJwt } from '../../middlewares/authenticateJwt';
import { authorizeRoles } from '../../middlewares/authorizeRoles';
import { ROLES } from '../../constants/roles';

const router = Router();

router.post(
  '/',
  authenticateJwt,
  authorizeRoles(ROLES.ADMIN, ROLES.MODERATOR),
  PollController.createPoll
);

router.get('/', PollController.getAllPolls);

router.get('/:id', PollController.getPollById);

router.put(
  '/:id',
  authenticateJwt,
  authorizeRoles(ROLES.ADMIN, ROLES.MODERATOR),
  PollController.updatePoll
);

router.delete(
  '/:id',
  authenticateJwt,
  authorizeRoles(ROLES.ADMIN, ROLES.MODERATOR),
  PollController.deletePoll
);

export default router;


--- C:\work\amplify-new\backend\routes\project\projectRoutes.ts ---

import { Router } from 'express';
import { ProjectController } from '../../controllers/ProjectController';
import { authenticateJwt } from '../../middlewares/authenticateJwt';
import { authorizeRoles } from '../../middlewares/authorizeRoles';
import { ROLES } from '../../constants/roles';

const router = Router();

router.post(
  '/',
  authenticateJwt,
  authorizeRoles(ROLES.ADMIN),
  ProjectController.createProject
);

router.get('/', ProjectController.getAllProjects);

router.get('/:id', ProjectController.getProjectById);

router.put(
  '/:id',
  authenticateJwt,
  authorizeRoles(ROLES.ADMIN),
  ProjectController.updateProject
);

router.delete(
  '/:id',
  authenticateJwt,
  authorizeRoles(ROLES.ADMIN),
  ProjectController.deleteProject
);

export default router;


--- C:\work\amplify-new\backend\routes\session\SessionRoutes.ts ---

import { Router } from 'express';
import { SessionController } from '../../controllers/SessionController';
import { authenticateJwt } from '../../middlewares/authenticateJwt';
import { authorizeRoles } from '../../middlewares/authorizeRoles';
import { ROLES } from '../../constants/roles';

const router = Router();

router.post(
  '/',
  authenticateJwt,
  authorizeRoles(ROLES.ADMIN),
  SessionController.createSession
);

router.get('/', SessionController.getAllSessions);

router.get('/:id', SessionController.getSessionById);

router.put(
  '/:id',
  authenticateJwt,
  authorizeRoles(ROLES.ADMIN),
  SessionController.updateSession
);

router.delete(
  '/:id',
  authenticateJwt,
  authorizeRoles(ROLES.ADMIN),
  SessionController.deleteSession
);

export default router;


--- C:\work\amplify-new\backend\routes\sessionDeliverable\SessionDeliverableRoutes.ts ---

import { Router } from 'express';
import { SessionDeliverableController } from '../../controllers/SessionDeliverableController';
import { authenticateJwt } from '../../middlewares/authenticateJwt';
import { authorizeRoles } from '../../middlewares/authorizeRoles';
import { ROLES } from '../../constants/roles';

const router = Router();

router.post(
  '/',
  authenticateJwt,
  authorizeRoles(ROLES.ADMIN, ROLES.MODERATOR),
  SessionDeliverableController.createSessionDeliverable
);

router.get('/', SessionDeliverableController.getAllSessionDeliverables);

router.get('/:id', SessionDeliverableController.getSessionDeliverableById);

router.put(
  '/:id',
  authenticateJwt,
  authorizeRoles(ROLES.ADMIN, ROLES.MODERATOR),
  SessionDeliverableController.updateSessionDeliverable
);

router.delete(
  '/:id',
  authenticateJwt,
  authorizeRoles(ROLES.ADMIN, ROLES.MODERATOR),
  SessionDeliverableController.deleteSessionDeliverable
);

export default router;


--- C:\work\amplify-new\backend\routes\tag\TagRoutes.ts ---

import { Router } from 'express';
import { TagController } from '../../controllers/TagController';
import { authenticateJwt } from '../../middlewares/authenticateJwt';
import { authorizeRoles } from '../../middlewares/authorizeRoles';
import { ROLES } from '../../constants/roles';

const router = Router();

router.post(
  '/',
  authenticateJwt,
  authorizeRoles(ROLES.ADMIN, ROLES.MODERATOR),
  TagController.createTag
);

router.get('/', TagController.getAllTags);

router.get('/:id', TagController.getTagById);

router.put(
  '/:id',
  authenticateJwt,
  authorizeRoles(ROLES.ADMIN, ROLES.MODERATOR),
  TagController.updateTag
);

router.delete(
  '/:id',
  authenticateJwt,
  authorizeRoles(ROLES.ADMIN, ROLES.MODERATOR),
  TagController.deleteTag
);

export default router;


--- C:\work\amplify-new\backend\routes\user\userRoutes.ts ---

import { Router } from "express";
import { UserController } from "../../controllers/UserController";
import { authenticateJwt } from "../../middlewares/authenticateJwt";
import { authorizeRoles } from "../../middlewares/authorizeRoles";
import { ROLES } from "../../constants/roles";

const router = Router();

router.post("/register", UserController.registerUser);
router.post("/login", UserController.loginUser);
router.post("/refresh-token", UserController.refreshToken);
router.get("/me", authenticateJwt, UserController.getUserProfile);
router.get(
  "/",
  authenticateJwt,
  authorizeRoles(ROLES.ADMIN),
  UserController.getAllUsers
);
router.get("/verify/:token", UserController.verifyEmail);
router.get(
  "/:userId/activity",
  authenticateJwt,
  authorizeRoles(ROLES.ADMIN),
  UserController.getUserActivity
);

export default router;


--- C:\work\amplify-new\backend\services\ModeratorService.ts ---

import Moderator, { IModerator } from '../model/ModeratorModel';

export const ModeratorService = {
  async createModerator(data: Partial<IModerator>): Promise<IModerator> {
    const moderator = new Moderator(data);
    return await moderator.save();
  },

  async getModeratorById(id: string): Promise<IModerator | null> {
    return await Moderator.findById(id).populate('user');
  },

  async getAllModerators(): Promise<IModerator[]> {
    return await Moderator.find().populate('user');
  },

  async updateModerator(id: string, data: Partial<IModerator>): Promise<IModerator | null> {
    return await Moderator.findByIdAndUpdate(id, data, { new: true });
  },

  async deleteModerator(id: string): Promise<void> {
    await Moderator.findByIdAndDelete(id);
  },
};


--- C:\work\amplify-new\backend\services\ObserverDocumentService.ts ---

import ObserverDocument, { IObserverDocument } from '../model/ObserverDocumentModel';

export const ObserverDocumentService = {
  async createObserverDocument(data: Partial<IObserverDocument>): Promise<IObserverDocument> {
    const observerDocument = new ObserverDocument(data);
    return await observerDocument.save();
  },

  async getObserverDocumentById(id: string): Promise<IObserverDocument | null> {
    return await ObserverDocument.findById(id).populate('uploadedBy');
  },

  async getAllObserverDocuments(): Promise<IObserverDocument[]> {
    return await ObserverDocument.find().populate('uploadedBy');
  },

  async updateObserverDocument(id: string, data: Partial<IObserverDocument>): Promise<IObserverDocument | null> {
    return await ObserverDocument.findByIdAndUpdate(id, data, { new: true });
  },

  async deleteObserverDocument(id: string): Promise<void> {
    await ObserverDocument.findByIdAndDelete(id);
  },
};


--- C:\work\amplify-new\backend\services\PaymentService.ts ---

import Stripe from 'stripe';
import config from '../config';

const stripe = new Stripe(config.stripe_secret_key as string, {
  apiVersion: '2023-10-16',
});

export const PaymentService = {
  async createPaymentIntent(amount: number, currency: string): Promise<Stripe.PaymentIntent> {
    const paymentIntent = await stripe.paymentIntents.create({
      amount,
      currency,
    });
    return paymentIntent;
  },
};


--- C:\work\amplify-new\backend\services\PollService.ts ---

import Poll, { IPoll } from '../model/PollModel';
import { QuestionValidationProcessor } from '../processors/poll/QuestionValidationProcessor';

export const PollService = {
  async createPoll(data: Partial<IPoll>): Promise<IPoll> {
    QuestionValidationProcessor.validate(data);
    const poll = new Poll(data);
    return await poll.save();
  },

  async getPollById(id: string): Promise<IPoll | null> {
    return await Poll.findById(id).populate('createdBy');
  },

  async getAllPolls(): Promise<IPoll[]> {
    return await Poll.find().populate('createdBy');
  },

  async updatePoll(id: string, data: Partial<IPoll>): Promise<IPoll | null> {
    QuestionValidationProcessor.validate(data);
    return await Poll.findByIdAndUpdate(id, data, { new: true });
  },

  async deletePoll(id: string): Promise<void> {
    await Poll.findByIdAndDelete(id);
  },
};


--- C:\work\amplify-new\backend\services\ProjectService.ts ---

import Project, { IProject } from '../model/ProjectModel';

export const ProjectService = {
  async createProject(data: Partial<IProject>): Promise<IProject> {
    const project = new Project(data);
    return await project.save();
  },

  async getProjectById(id: string): Promise<IProject | null> {
    return await Project.findById(id).populate('owner members');
  },

  async getAllProjects(): Promise<IProject[]> {
    return await Project.find().populate('owner members');
  },

  async updateProject(id: string, data: Partial<IProject>): Promise<IProject | null> {
    return await Project.findByIdAndUpdate(id, data, { new: true });
  },

  async deleteProject(id: string): Promise<void> {
    await Project.findByIdAndDelete(id);
  },
};


--- C:\work\amplify-new\backend\services\SessionDeliverableService.ts ---

import SessionDeliverable, { ISessionDeliverable } from '../model/SessionDeliverableModel';

export const SessionDeliverableService = {
  async createSessionDeliverable(data: Partial<ISessionDeliverable>): Promise<ISessionDeliverable> {
    const sessionDeliverable = new SessionDeliverable(data);
    return await sessionDeliverable.save();
  },

  async getSessionDeliverableById(id: string): Promise<ISessionDeliverable | null> {
    return await SessionDeliverable.findById(id).populate('session');
  },

  async getAllSessionDeliverables(): Promise<ISessionDeliverable[]> {
    return await SessionDeliverable.find().populate('session');
  },

  async updateSessionDeliverable(id: string, data: Partial<ISessionDeliverable>): Promise<ISessionDeliverable | null> {
    return await SessionDeliverable.findByIdAndUpdate(id, data, { new: true });
  },

  async deleteSessionDeliverable(id: string): Promise<void> {
    await SessionDeliverable.findByIdAndDelete(id);
  },
};


--- C:\work\amplify-new\backend\services\SessionService.ts ---

import Session, { ISession } from '../model/SessionModel';
import { SessionTimeConflictChecker } from '../processors/session/sessionTimeConflictChecker';

export const SessionService = {
  async createSession(data: Partial<ISession>): Promise<ISession> {
    const hasConflict = await SessionTimeConflictChecker.check(data);
    if (hasConflict) {
      throw new Error('Session time conflicts with an existing session.');
    }
    const session = new Session(data);
    return await session.save();
  },

  async getSessionById(id: string): Promise<ISession | null> {
    return await Session.findById(id).populate('project');
  },

  async getAllSessions(): Promise<ISession[]> {
    return await Session.find().populate('project');
  },

  async updateSession(id: string, data: Partial<ISession>): Promise<ISession | null> {
    const hasConflict = await SessionTimeConflictChecker.check(data);
    if (hasConflict) {
      throw new Error('Session time conflicts with an existing session.');
    }
    return await Session.findByIdAndUpdate(id, data, { new: true });
  },

  async deleteSession(id: string): Promise<void> {
    await Session.findByIdAndDelete(id);
  },
};


--- C:\work\amplify-new\backend\services\TagService.ts ---

import Tag, { ITag } from '../model/TagModel';

export const TagService = {
  async createTag(data: Partial<ITag>): Promise<ITag> {
    const tag = new Tag(data);
    return await tag.save();
  },

  async getTagById(id: string): Promise<ITag | null> {
    return await Tag.findById(id);
  },

  async getAllTags(): Promise<ITag[]> {
    return await Tag.find();
  },

  async updateTag(id: string, data: Partial<ITag>): Promise<ITag | null> {
    return await Tag.findByIdAndUpdate(id, data, { new: true });
  },

  async deleteTag(id: string): Promise<void> {
    await Tag.findByIdAndDelete(id);
  },
};


--- C:\work\amplify-new\backend\services\UserActivityService.ts ---

import UserActivity, { IUserActivity } from '../model/UserActivityModel';

export const UserActivityService = {
  async recordActivity(activityData: Partial<IUserActivity>): Promise<IUserActivity> {
    const activity = new UserActivity(activityData);
    return await activity.save();
  },

  async getUserActivity(userId: string): Promise<IUserActivity[]> {
    return await UserActivity.find({ userId }).sort({ timestamp: -1 });
  },
};


--- C:\work\amplify-new\backend\services\UserService.ts ---

import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";
import User from "../model/UserModel";
import config from "../config";
import { IUser } from "../interfaces/user";
import { IsValidEmailProcessor } from "../processors/user/IsValidEmailProcessor";
import { IsStrongPasswordProcessor } from "../processors/user/IsStrongPasswordProcessor";
import { SendVerifyAccountEmailProcessor } from "../processors/sendEmail/SendVerifyAccountEmailProcessor";
import { RemovePasswordFromUserObject } from "../processors/user/RemovePasswordFromUserObjectProcessor";
import { UserActivityService } from "./UserActivityService";
import { IRequestWithUser } from "../interfaces/IRequestWithUser";

export const UserService = {
  async registerUser(userData: IUser) {
    const { name, email, password } = userData;

    if (!IsValidEmailProcessor.execute(email)) {
      throw new Error("Invalid email format");
    }

    if (!IsStrongPasswordProcessor.execute(password)) {
      throw new Error("Password is not strong enough");
    }

    const existingUser = await User.findOne({ email });
    if (existingUser) {
      throw new Error("User already exists");
    }

    const verificationToken = jwt.sign(
      { email },
      config.jwt_access_secret as string,
      { expiresIn: "1d" }
    );

    const user = new User({
      name,
      email,
      password,
      verificationToken,
    });

    await user.save();

    const verificationLink = `${config.frontend_base_url}/verify-email?token=${verificationToken}`;
    await SendVerifyAccountEmailProcessor.execute(
      name,
      email,
      verificationLink
    );

    return {
      message:
        "User registered successfully. Please check your email to verify your account.",
    };
  },

  async loginUser(loginData: Pick<IUser, "email" | "password">) {
    const { email, password } = loginData;
    const user = await User.findOne({ email });

    if (!user) {
      throw new Error("Invalid credentials");
    }

    if (!user.isVerified) {
      throw new Error("Please verify your email before logging in");
    }

    const isPasswordMatch = await bcrypt.compare(password, user.password);
    if (!isPasswordMatch) {
      throw new Error("Invalid credentials");
    }

    const accessToken = jwt.sign(
      { id: user._id, role: user.role },
      config.jwt_access_secret as string,
      { expiresIn: config.jwt_access_expires_in }
    );

    const refreshToken = jwt.sign(
      { id: user._id },
      config.jwt_refresh_secret as string,
      { expiresIn: config.jwt_refresh_expires_in }
    );

    // await UserActivityService.recordActivity({
    //   userId: user._id,
    //   activityType: 'login',
    //   ipAddress: req.clientIp,
    //   device: req.useragent?.platform,
    //   browser: req.useragent?.browser,
    //   os: req.useragent?.os,
    //   country: req.geolocation?.country,
    // });

    return {
      accessToken,
      refreshToken,
      user,
    };
  },

  async refreshToken(token: string) {
    if (!token) {
      throw new Error("Refresh token not found");
    }

    const decoded = jwt.verify(
      token,
      config.jwt_refresh_secret as string
    ) as {
      id: string;
    };
    const user = await User.findById(decoded.id);

    if (!user) {
      throw new Error("User not found");
    }

    const accessToken = jwt.sign(
      { id: user._id, role: user.role },
      config.jwt_access_secret as string,
      { expiresIn: config.jwt_access_expires_in }
    );

    return {
      accessToken,
    };
  },

  async getUserProfile(userId: string) {
    const user = await User.findById(userId);
    if (!user) {
      throw new Error("User not found");
    }
    return RemovePasswordFromUserObject.execute(user);
  },

  async getAllUsers() {
    const users = await User.find();
    return users.map((user) => RemovePasswordFromUserObject.execute(user));
  },

  async verifyEmail(token: string) {
    try {
      const decoded = jwt.verify(token, config.jwt_access_secret as string) as {
        email: string;
      };
      const user = await User.findOne({ email: decoded.email });

      if (!user) {
        throw new Error("User not found");
      }

      user.isVerified = true;
      user.verificationToken = undefined;
      await user.save();
    } catch (error) {
      throw new Error("Invalid or expired verification token");
    }
  },
};


--- C:\work\amplify-new\backend\socket\handlers\activityLogger.ts ---

import { Socket } from 'socket.io';
import { UserActivityService } from '../../services/UserActivityService';

export const handleActivityLogging = (socket: Socket) => {
  socket.on('logActivity', async (data) => {
    try {
      await UserActivityService.recordActivity(data);
      socket.emit('activityLogged', { success: true });
    } catch (error) {
      socket.emit('activityLogError', { message: (error as Error).message });
    }
  });
};


--- C:\work\amplify-new\backend\socket\handlers\joinRoom.ts ---

import { Socket } from 'socket.io';

export const handleJoinRoom = (socket: Socket) => {
  socket.on('joinRoom', (room) => {
    socket.join(room);
    console.log(`User ${socket.id} joined room ${room}`);
  });
};


--- C:\work\amplify-new\backend\socket\handlers\observerWaitingRoomChat.ts ---

import { Socket } from 'socket.io';
import ObserverWaitingRoomChat from '../../model/ObserverWaitingRoomChatModel';

export const handleObserverWaitingRoomChat = (socket: Socket) => {
  socket.on('observerWaitingRoomMessage', async (data) => {
    try {
      const chatMessage = new ObserverWaitingRoomChat(data);
      await chatMessage.save();
      socket.to(data.session).emit('newObserverWaitingRoomMessage', chatMessage);
    } catch (error) {
      socket.emit('chatError', { message: (error as Error).message });
    }
  });
};


--- C:\work\amplify-new\backend\socket\handlers\participantMeetingChat.ts ---

import { Socket } from 'socket.io';
import ParticipantMeetingChat from '../../model/ParticipantMeetingChatModel';

export const handleParticipantMeetingChat = (socket: Socket) => {
  socket.on('participantMeetingMessage', async (data) => {
    try {
      const chatMessage = new ParticipantMeetingChat(data);
      await chatMessage.save();
      socket.to(data.session).emit('newParticipantMeetingMessage', chatMessage);
    } catch (error) {
      socket.emit('chatError', { message: (error as Error).message });
    }
  });
};


--- C:\work\amplify-new\backend\socket\handlers\participantWaitingRoomChat.ts ---

import { Socket } from 'socket.io';
import ParticipantWaitingRoomChat from '../../model/ParticipantWaitingRoomChatModel';

export const handleParticipantWaitingRoomChat = (socket: Socket) => {
  socket.on('participantWaitingRoomMessage', async (data) => {
    try {
      const chatMessage = new ParticipantWaitingRoomChat(data);
      await chatMessage.save();
      socket.to(data.session).emit('newParticipantWaitingRoomMessage', chatMessage);
    } catch (error) {
      socket.emit('chatError', { message: (error as Error).message });
    }
  });
};


--- C:\work\amplify-new\backend\socket\handlers\sessionControl.ts ---

import { Socket } from 'socket.io';

export const handleSessionControl = (socket: Socket) => {
  socket.on('startSession', (sessionId) => {
    // Add logic to start the session
    socket.to(sessionId).emit('sessionStarted');
  });

  socket.on('endSession', (sessionId) => {
    // Add logic to end the session
    socket.to(sessionId).emit('sessionEnded');
  });
};


--- C:\work\amplify-new\backend\socket\index.ts ---

import { Server as SocketIOServer, Socket } from 'socket.io';
import http from 'http';
import { handleJoinRoom } from './handlers/joinRoom';
import { handleParticipantWaitingRoomChat } from './handlers/participantWaitingRoomChat';
import { handleObserverWaitingRoomChat } from './handlers/observerWaitingRoomChat';
import { handleParticipantMeetingChat } from './handlers/participantMeetingChat';
import { handleSessionControl } from './handlers/sessionControl';
import { handleActivityLogging } from './handlers/activityLogger';

export const initSocket = (server: http.Server) => {
  const io = new SocketIOServer(server, {
    cors: {
      origin: '*', // Adjust for your frontend URL
      methods: ['GET', 'POST'],
    },
  });

  io.on('connection', (socket: Socket) => {
    console.log('A user connected:', socket.id);

    handleJoinRoom(socket);
    handleParticipantWaitingRoomChat(socket);
    handleObserverWaitingRoomChat(socket);
    handleParticipantMeetingChat(socket);
    handleSessionControl(socket);
    handleActivityLogging(socket);

    socket.on('disconnect', () => {
      console.log('User disconnected:', socket.id);
    });
  });

  return io;
};


--- C:\work\amplify-new\backend\types\express-useragent.d.ts ---

import { UAParser } from 'ua-parser-js';

declare global {
  namespace Express {
    interface Request {
      useragent?: UAParser.IResult;
      clientIp?: string;
      geolocation?: any;
    }
  }
}


--- C:\work\amplify-new\backend\utils\ResponseHelpers.ts ---

import { Response } from 'express';

export const sendSuccess = (res: Response, data: any, message = 'Success', statusCode = 200) => {
  res.status(statusCode).json({
    success: true,
    message,
    data,
  });
};

export const sendError = (res: Response, message = 'An error occurred', statusCode = 500) => {
  res.status(statusCode).json({
    success: false,
    message,
  });
};


--- C:\work\amplify-new\backend\utils\catchAsync.ts ---

import { Request, Response, NextFunction } from 'express';

const catchAsync = (fn: (req: Request, res: Response, next: NextFunction) => Promise<any>) => {
  return (req: Request, res: Response, next: NextFunction) => {
    fn(req, res, next).catch(next);
  };
};

export default catchAsync;


--- C:\work\amplify-new\backend\utils\sendResponse.ts ---

import { Response } from 'express';

type IApiResponse<T> = {
  statusCode: number;
  success: boolean;
  message?: string | null;
  data?: T | null;
};

const sendResponse = <T>(res: Response, data: IApiResponse<T>): void => {
  const responseData: IApiResponse<T> = {
    statusCode: data.statusCode,
    success: data.success,
    message: data.message || null,
    data: data.data || null,
  };

  res.status(data.statusCode).json(responseData);
};

export default sendResponse;


--- C:\work\amplify-new\backend\utils\tokenService.ts ---

import jwt from 'jsonwebtoken';
import config from '../config';

export const generateToken = (payload: object, secret: string, expiresIn: string) => {
  return jwt.sign(payload, secret, { expiresIn });
};

export const verifyToken = (token: string, secret: string) => {
  try {
    return jwt.verify(token, secret);
  } catch (error) {
    return null;
  }
};


--- C:\work\amplify-new\backend\utils\uploadToS3.ts ---

import { S3Client, PutObjectCommand } from "@aws-sdk/client-s3";
import config from "../config";

const s3Client = new S3Client({
  region: config.aws_region,
  credentials: {
    accessKeyId: config.aws_access_key_id as string,
    secretAccessKey: config.aws_secret_access_key as string,
  },
});

export const uploadToS3 = async (file: Express.Multer.File, key: string) => {
  const params = {
    Bucket: config.aws_s3_bucket_name,
    Key: key,
    Body: file.buffer,
    ContentType: file.mimetype,
  };

  try {
    const command = new PutObjectCommand(params);
    await s3Client.send(command);
    return `https://${config.aws_s3_bucket_name}.s3.${config.aws_region}.amazonaws.com/${key}`;
  } catch (error) {
    console.error("Error uploading to S3:", error);
    throw error;
  }
};
