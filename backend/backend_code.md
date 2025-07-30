--- C:\work\amplify-new\backend\package.json ---

```json
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
```

--- C:\work\amplify-new\backend\server.ts ---

```typescript
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
```

--- C:\work\amplify-new\backend\tsconfig.json ---

```json
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
    // "allowJs": true,                                  /* Allow JavaScript files to be a part of your program. Use the 'checkJS' option to get errors from these files. */
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
"emitDeclarationOnly": false,                                   /* Enable all strict type-checking options. */
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
```

--- C:\work\amplify-new\backend\config\db.ts ---

```typescript
import mongoose from "mongoose";
import config from "./index";

const connectDB = async () => {
  try {
    await mongoose.connect(config.database_url as string);
    console.log("MongoDB connected successfully");
  } catch (error) {
    console.error("MongoDB connection error:", error);
    process.exit(1);
  }
};

export default connectDB;
```

--- C:\work\amplify-new\backend\config\index.ts ---

```typescript
import dotenv from "dotenv";
dotenv.config();

const config = {
  port: process.env.PORT,
  database_url: process.env.DATABASE_URL,
  frontend_base_url: process.env.FRONTEND_BASE_URL,
  access_token_secret: process.env.ACCESS_TOKEN_SECRET,
  refresh_token_secret: process.env.REFRESH_TOKEN_SECRET,
  access_token_expiry: process.env.ACCESS_TOKEN_EXPIRY,
  refresh_token_expiry: process.env.REFRESH_TOKEN_EXPIRY,
  cloudinary_cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  cloudinary_api_key: process.env.CLOUDINARY_API_KEY,
  cloudinary_api_secret: process.env.CLOUDINARY_API_SECRET,
  smtp_host: process.env.SMTP_HOST,
  smtp_port: process.env.SMTP_PORT,
  smtp_service: process.env.SMTP_SERVICE,
  smtp_mail: process.env.SMTP_MAIL,
  smtp_password: process.env.SMTP_PASSWORD,
  stripe_publishable_key: process.env.STRIPE_PUBLISHABLE_KEY,
  stripe_secret_key: process.env.STRIPE_SECRET_KEY,
  aws_access_key_id: process.env.AWS_ACCESS_KEY_ID,
  aws_secret_access_key: process.env.AWS_SECRET_ACCESS_KEY,
  aws_region: process.env.AWS_REGION,
  aws_s3_bucket_name: process.env.AWS_S3_BUCKET_NAME,
};

export default config;
```

--- C:\work\amplify-new\backend\config\NodemailerConfig.ts ---

```typescript
import nodemailer from "nodemailer";
import config from "./index";

const transporter = nodemailer.createTransport({
  host: config.smtp_host,
  port: Number(config.smtp_port),
  service: config.smtp_service,
  auth: {
    user: config.smtp_mail,
    pass: config.smtp_password,
  },
});

export default transporter;
```

--- C:\work\amplify-new\backend\constants\emailTemplates.ts ---

```typescript
export const verificationEmailTemplate = (
  username: string,
  verificationLink: string
) => {
  return `
    <div style="font-family: Arial, sans-serif; line-height: 1.6;">
      <h2>Welcome to Our Platform, ${username}!</h2>
      <p>Thank you for registering. Please verify your email address by clicking the link below:</p>
      <p>
        <a href="${verificationLink}" style="background-color: #4CAF50; color: white; padding: 14px 25px; text-align: center; text-decoration: none; display: inline-block;">
          Verify Your Email
        </a>
      </p>
      <p>If you did not create an account, please ignore this email.</p>
      <p>Best regards,<br>The Team</p>
    </div>
  `;
};
```

--- C:\work\amplify-new\backend\constants\roles.ts ---

```typescript
export const ROLES = {
    PARTICIPANT: 'participant',
    MODERATOR: 'moderator',
    OBSERVER: 'observer',
    ADMIN: 'admin',
  };
```

--- C:\work\amplify-new\backend\controllers\LiveSessionController.ts ---

```typescript
import { Request, Response } from "express";
import { CatchErrorMiddleware } from "../middlewares/CatchErrorMiddleware";
import LiveSession from "../model/LiveSessionModel";
import { AuthenticatedRequest } from "../middlewares/authenticateJwt";
import { startLiveSession, joinLiveSession, endLiveSession } from "../processors/liveSession/sessionService";

export const startSession = CatchErrorMiddleware(async (req: AuthenticatedRequest, res: Response) => {
    const { projectId, sessionId } = req.body;
    const moderatorId = req.user?._id;

    if (!moderatorId) {
        return res.status(401).json({ message: "Unauthorized" });
    }

    const session = await startLiveSession(projectId, sessionId, moderatorId.toString());
    res.status(201).json(session);
});

export const joinSession = CatchErrorMiddleware(async (req: AuthenticatedRequest, res: Response) => {
    const { sessionId } = req.params;
    const userId = req.user?._id;
    const { role } = req.body; // 'participant' or 'observer'

    if (!userId) {
        return res.status(401).json({ message: "Unauthorized" });
    }

    const session = await joinLiveSession(sessionId, userId.toString(), role);
    res.status(200).json(session);
});

export const endSession = CatchErrorMiddleware(async (req: AuthenticatedRequest, res: Response) => {
    const { sessionId } = req.params;
    const moderatorId = req.user?._id;

    if (!moderatorId) {
        return res.status(401).json({ message: "Unauthorized" });
    }

    const session = await endLiveSession(sessionId, moderatorId.toString());
    res.status(200).json(session);
});

export const getSessionDetails = CatchErrorMiddleware(async (req: Request, res: Response) => {
    const { sessionId } = req.params;
    const session = await LiveSession.findById(sessionId).populate('moderator participants observers');
    if (!session) {
        return res.status(404).json({ message: "Session not found" });
    }
    res.status(200).json(session);
});
```

--- C:\work\amplify-new\backend\controllers\ModeratorController.ts ---

```typescript
import { Request, Response } from 'express';
import Moderator from '../model/ModeratorModel';
import { CatchErrorMiddleware } from '../middlewares/CatchErrorMiddleware';

// Get all moderators
export const getAllModerators = CatchErrorMiddleware(async (req: Request, res: Response) => {
    const moderators = await Moderator.find();
    res.status(200).json(moderators);
});

// Get a single moderator by ID
export const getModeratorById = CatchErrorMiddleware(async (req: Request, res: Response) => {
    const moderator = await Moderator.findById(req.params.id);
    if (!moderator) {
        return res.status(404).json({ message: 'Moderator not found' });
    }
    res.status(200).json(moderator);
});

// Create a new moderator
export const createModerator = CatchErrorMiddleware(async (req: Request, res: Response) => {
    const { userId, projectId, assignedSessions } = req.body;
    const newModerator = new Moderator({ userId, projectId, assignedSessions });
    await newModerator.save();
    res.status(201).json(newModerator);
});

// Update a moderator
export const updateModerator = CatchErrorMiddleware(async (req: Request, res: Response) => {
    const updatedModerator = await Moderator.findByIdAndUpdate(req.params.id, req.body, { new: true });
    if (!updatedModerator) {
        return res.status(404).json({ message: 'Moderator not found' });
    }
    res.status(200).json(updatedModerator);
});

// Delete a moderator
export const deleteModerator = CatchErrorMiddleware(async (req: Request, res: Response) => {
    const deletedModerator = await Moderator.findByIdAndDelete(req.params.id);
    if (!deletedModerator) {
        return res.status(404).json({ message: 'Moderator not found' });
    }
    res.status(200).json({ message: 'Moderator deleted successfully' });
});
```

--- C:\work\amplify-new\backend\controllers\ObserverDocumentController.ts ---

```typescript
import { Response } from 'express';
import { AuthenticatedRequest } from '../middlewares/authenticateJwt';
import ObserverDocument from '../model/ObserverDocumentModel';
import { CatchErrorMiddleware } from '../middlewares/CatchErrorMiddleware';
import { sendSuccess } from '../utils/responseHelpers';
import multer from 'multer';
import { uploadToS3 } from '../utils/uploadToS3';
import ErrorHandler from '../utils/ErrorHandler';

const upload = multer({ storage: multer.memoryStorage() });

export const uploadObserverDocument = [
    upload.single('file'),
    CatchErrorMiddleware(async (req: AuthenticatedRequest, res: Response) => {
        const { projectId, sessionId } = req.body;
        const userId = req.user?._id;
        const file = req.file;

        if (!file) {
            throw new ErrorHandler('No file uploaded.', 400);
        }

        const s3Url = await uploadToS3(file.buffer, file.originalname, file.mimetype);

        const newDocument = new ObserverDocument({
            project: projectId,
            session: sessionId,
            user: userId,
            fileName: file.originalname,
            fileType: file.mimetype,
            s3Url: s3Url,
        });

        await newDocument.save();
        sendSuccess(res, { message: 'Document uploaded successfully', document: newDocument });
    })
];

export const getObserverDocuments = CatchErrorMiddleware(async (req: AuthenticatedRequest, res: Response) => {
    const { projectId, sessionId } = req.query;
    const query: any = {};

    if (projectId) query.project = projectId;
    if (sessionId) query.session = sessionId;

    const documents = await ObserverDocument.find(query).populate('user', 'name email');
    sendSuccess(res, documents);
});
```

--- C:\work\amplify-new\backend\controllers\PaymentController.ts ---

```typescript
import { Request, Response } from "express";
import Stripe from "stripe";
import config from "../config";
import { CatchErrorMiddleware } from "../middlewares/CatchErrorMiddleware";
import { AuthenticatedRequest } from "../middlewares/authenticateJwt";

const stripe = new Stripe(config.stripe_secret_key as string, {
  apiVersion: "2024-04-10",
});

export const createPaymentIntent = CatchErrorMiddleware(
  async (req: AuthenticatedRequest, res: Response) => {
    const { amount, currency, paymentMethodId } = req.body;

    try {
      const paymentIntent = await stripe.paymentIntents.create({
        amount,
        currency,
        payment_method: paymentMethodId,
        confirm: true,
        automatic_payment_methods: {
          enabled: true,
          allow_redirects: "never",
        },
      });

      res.status(200).json({
        clientSecret: paymentIntent.client_secret,
        status: paymentIntent.status,
      });
    } catch (error: any) {
      res.status(400).json({ error: error.message });
    }
  }
);

export const getStripePublishableKey = (req: Request, res: Response) => {
  res.status(200).json({ publishableKey: config.stripe_publishable_key });
};
```

--- C:\work\amplify-new\backend\controllers\PollController.ts ---

```typescript
import { Request, Response } from 'express';
import Poll from '../model/PollModel';
import { CatchErrorMiddleware } from '../middlewares/CatchErrorMiddleware';
import { AuthenticatedRequest } from '../middlewares/authenticateJwt';
import { validateQuestions } from '../processors/poll/QuestionValidationProcessor';
import ErrorHandler from '../utils/ErrorHandler';

// Create a new poll
export const createPoll = CatchErrorMiddleware(async (req: AuthenticatedRequest, res: Response) => {
    const { title, questions, projectId, sessionId } = req.body;
    const createdBy = req.user?._id;

    if (!validateQuestions(questions)) {
        throw new ErrorHandler('Invalid question structure.', 400);
    }

    const newPoll = new Poll({ title, questions, createdBy, projectId, sessionId });
    await newPoll.save();
    res.status(201).json(newPoll);
});

// Get all polls for a project/session
export const getPolls = CatchErrorMiddleware(async (req: Request, res: Response) => {
    const { projectId, sessionId } = req.query;
    const query: any = {};
    if (projectId) query.projectId = projectId;
    if (sessionId) query.sessionId = sessionId;

    const polls = await Poll.find(query);
    res.status(200).json(polls);
});

// Get a single poll by ID
export const getPollById = CatchErrorMiddleware(async (req: Request, res: Response) => {
    const poll = await Poll.findById(req.params.id);
    if (!poll) {
        return res.status(404).json({ message: 'Poll not found' });
    }
    res.status(200).json(poll);
});

// Submit a response to a poll
export const submitPollResponse = CatchErrorMiddleware(async (req: AuthenticatedRequest, res: Response) => {
    const { pollId } = req.params;
    const { responses } = req.body; // responses: [{ questionId: string, answer: any }]
    const userId = req.user?._id;

    const poll = await Poll.findById(pollId);
    if (!poll) {
        return res.status(404).json({ message: 'Poll not found' });
    }

    responses.forEach((response: { questionId: string, answer: any }) => {
        const question = poll.questions.find(q => q._id.toString() === response.questionId);
        if (question) {
            question.responses.push({ user: userId, answer: response.answer });
        }
    });

    await poll.save();
    res.status(200).json({ message: 'Response submitted successfully' });
});

// Get poll results
export const getPollResults = CatchErrorMiddleware(async (req: Request, res: Response) => {
    const { pollId } = req.params;
    const poll = await Poll.findById(pollId).populate('questions.responses.user', 'name');
    if (!poll) {
        return res.status(404).json({ message: 'Poll not found' });
    }
    res.status(200).json(poll);
});
```

--- C:\work\amplify-new\backend\controllers\ProjectController.ts ---

```typescript
import { Request, Response } from "express";
import Project from "../model/ProjectModel";
import { CatchErrorMiddleware } from "../middlewares/CatchErrorMiddleware";
import { AuthenticatedRequest } from "../middlewares/authenticateJwt";
import { sendSuccess, sendError } from "../utils/responseHelpers";
import mongoose from "mongoose";
import Session from "../model/SessionModel";
import archiver from "archiver";
import ObserverDocument from "../model/ObserverDocumentModel";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";
import { S3Client, GetObjectCommand } from "@aws-sdk/client-s3";
import config from "../config";
import stream from "stream";

const s3Client = new S3Client({
  region: config.aws_region,
  credentials: {
    accessKeyId: config.aws_access_key_id as string,
    secretAccessKey: config.aws_secret_access_key as string,
  },
});

// Create a new project
export const createProject = CatchErrorMiddleware(
  async (req: AuthenticatedRequest, res: Response) => {
    const {
      name,
      description,
      startDate,
      endDate,
      projectType,
      status,
      client,
      budget,
      team,
      tasks,
      risks,
      deliverables,
    } = req.body;
    const createdBy = req.user?._id;

    const newProject = new Project({
      name,
      description,
      startDate,
      endDate,
      projectType,
      status,
      client,
      budget,
      team,
      tasks,
      risks,
      deliverables,
      createdBy,
    });

    await newProject.save();
    sendSuccess(res, newProject, 201);
  }
);

// Get all projects
export const getAllProjects = CatchErrorMiddleware(
  async (req: AuthenticatedRequest, res: Response) => {
    const projects = await Project.find({ createdBy: req.user?._id });
    sendSuccess(res, projects);
  }
);

// Get a single project by ID
export const getProjectById = CatchErrorMiddleware(
  async (req: Request, res: Response) => {
    const project = await Project.findById(req.params.id);
    if (!project) {
      return sendError(res, "Project not found", 404);
    }
    sendSuccess(res, project);
  }
);

// Update a project
export const updateProject = CatchErrorMiddleware(
  async (req: Request, res: Response) => {
    const updatedProject = await Project.findByIdAndUpdate(
      req.params.id,
      req.body,
      { new: true }
    );
    if (!updatedProject) {
      return sendError(res, "Project not found", 404);
    }
    sendSuccess(res, updatedProject);
  }
);

// Delete a project
export const deleteProject = CatchErrorMiddleware(
  async (req: Request, res: Response) => {
    const deletedProject = await Project.findByIdAndDelete(req.params.id);
    if (!deletedProject) {
      return sendError(res, "Project not found", 404);
    }
    sendSuccess(res, { message: "Project deleted successfully" });
  }
);

// Add a user to a project's team
export const addUserToProject = CatchErrorMiddleware(
  async (req: Request, res: Response) => {
    const { projectId, userId, role } = req.body;

    if (
      !mongoose.Types.ObjectId.isValid(projectId) ||
      !mongoose.Types.ObjectId.isValid(userId)
    ) {
      return sendError(res, "Invalid projectId or userId", 400);
    }

    const project = await Project.findById(projectId);
    if (!project) {
      return sendError(res, "Project not found", 404);
    }

    // Check if user is already in the team
    const userExists = project.team.some(
      (member) => member.user.toString() === userId
    );
    if (userExists) {
      return sendError(res, "User is already in the project team", 400);
    }

    project.team.push({ user: userId, role });
    await project.save();

    sendSuccess(res, project);
  }
);

// Remove a user from a project's team
export const removeUserFromProject = CatchErrorMiddleware(
  async (req: Request, res: Response) => {
    const { projectId, userId } = req.body;

    if (
      !mongoose.Types.ObjectId.isValid(projectId) ||
      !mongoose.Types.ObjectId.isValid(userId)
    ) {
      return sendError(res, "Invalid projectId or userId", 400);
    }

    const project = await Project.findById(projectId);
    if (!project) {
      return sendError(res, "Project not found", 404);
    }

    project.team = project.team.filter(
      (member) => member.user.toString() !== userId
    );
    await project.save();

    sendSuccess(res, project);
  }
);

export const getProjectSessions = CatchErrorMiddleware(
  async (req: Request, res: Response) => {
    const { projectId } = req.params;
    const sessions = await Session.find({ project: projectId });
    sendSuccess(res, sessions);
  }
);

export const downloadProjectFiles = CatchErrorMiddleware(
  async (req: Request, res: Response) => {
    const { projectId } = req.params;

    const documents = await ObserverDocument.find({ project: projectId });

    if (documents.length === 0) {
      return sendError(res, "No documents found for this project.", 404);
    }

    res.setHeader("Content-Type", "application/zip");
    res.setHeader(
      "Content-Disposition",
      `attachment; filename=project_${projectId}_files.zip`
    );

    const archive = archiver("zip", {
      zlib: { level: 9 },
    });

    archive.pipe(res);

    for (const doc of documents) {
      try {
        const command = new GetObjectCommand({
          Bucket: config.aws_s3_bucket_name,
          Key: doc.s3Url.split("/").pop(),
        });
        const signedUrl = await getSignedUrl(s3Client, command, {
          expiresIn: 3600,
        });

        // Use fetch to get the file stream
        const response = await fetch(signedUrl);
        if (!response.ok) {
          throw new Error(`Failed to fetch ${doc.fileName} from S3`);
        }
        const fileStream = response.body;
        if (fileStream) {
          // Convert web stream to Node.js stream
          const nodeStream = stream.Readable.fromWeb(
            fileStream as import("stream/web").ReadableStream<any>
          );
          archive.append(nodeStream, { name: doc.fileName });
        }
      } catch (error) {
        console.error(`Error processing file ${doc.fileName}:`, error);
        // Optionally, you can log this to a file or notify an admin
      }
    }

    archive.finalize();
  }
);
```

--- C:\work\amplify-new\backend\controllers\SessionController.ts ---

```typescript
import { Request, Response } from 'express';
import Session from '../model/SessionModel';
import { CatchErrorMiddleware } from '../middlewares/CatchErrorMiddleware';
import { AuthenticatedRequest } from '../middlewares/authenticateJwt';
import { sendSuccess, sendError } from '../utils/responseHelpers';
import { checkSessionConflict } from '../processors/session/sessionTimeConflictChecker';

// Create a new session
export const createSession = CatchErrorMiddleware(async (req: AuthenticatedRequest, res: Response) => {
    const { project, title, description, startTime, endTime, sessionType, status, participants, observers, moderators } = req.body;

    if (await checkSessionConflict(startTime, endTime, '')) {
        return sendError(res, 'Session time conflicts with an existing session.', 409);
    }

    const newSession = new Session({
        project,
        title,
        description,
        startTime,
        endTime,
        sessionType,
        status,
        participants,
        observers,
        moderators
    });

    await newSession.save();
    sendSuccess(res, newSession, 201);
});

// Get all sessions
export const getAllSessions = CatchErrorMiddleware(async (req: Request, res: Response) => {
    const sessions = await Session.find().populate('project', 'name');
    sendSuccess(res, sessions);
});

// Get a single session by ID
export const getSessionById = CatchErrorMiddleware(async (req: Request, res: Response) => {
    const session = await Session.findById(req.params.id).populate('project participants observers moderators', 'name email');
    if (!session) {
        return sendError(res, 'Session not found', 404);
    }
    sendSuccess(res, session);
});

// Update a session
export const updateSession = CatchErrorMiddleware(async (req: Request, res: Response) => {
    const { startTime, endTime } = req.body;
    const sessionId = req.params.id;

    if (await checkSessionConflict(startTime, endTime, sessionId)) {
        return sendError(res, 'Session time conflicts with an existing session.', 409);
    }

    const updatedSession = await Session.findByIdAndUpdate(sessionId, req.body, { new: true });
    if (!updatedSession) {
        return sendError(res, 'Session not found', 404);
    }
    sendSuccess(res, updatedSession);
});

// Delete a session
export const deleteSession = CatchErrorMiddleware(async (req: Request, res: Response) => {
    const deletedSession = await Session.findByIdAndDelete(req.params.id);
    if (!deletedSession) {
        return sendError(res, 'Session not found', 404);
    }
    sendSuccess(res, { message: 'Session deleted successfully' });
});
```

--- C:\work\amplify-new\backend\controllers\SessionDeliverableController.ts ---

```typescript
import { Request, Response } from 'express';
import SessionDeliverable from '../model/SessionDeliverableModel';
import { CatchErrorMiddleware } from '../middlewares/CatchErrorMiddleware';
import { AuthenticatedRequest } from '../middlewares/authenticateJwt';
import { sendSuccess, sendError } from '../utils/responseHelpers';
import multer from 'multer';
import { uploadToS3 } from '../utils/uploadToS3';
import ErrorHandler from '../utils/ErrorHandler';

const upload = multer({ storage: multer.memoryStorage() });

export const uploadDeliverable = [
    upload.single('file'),
    CatchErrorMiddleware(async (req: AuthenticatedRequest, res: Response) => {
        const { projectId, sessionId, description } = req.body;
        const uploadedBy = req.user?._id;
        const file = req.file;

        if (!file) {
            throw new ErrorHandler('No file uploaded.', 400);
        }

        const s3Url = await uploadToS3(file.buffer, file.originalname, file.mimetype);

        const newDeliverable = new SessionDeliverable({
            project: projectId,
            session: sessionId,
            uploadedBy,
            fileName: file.originalname,
            fileType: file.mimetype,
            s3Url,
            description,
        });

        await newDeliverable.save();
        sendSuccess(res, { message: 'Deliverable uploaded successfully', deliverable: newDeliverable });
    })
];

export const getDeliverables = CatchErrorMiddleware(async (req: Request, res: Response) => {
    const { projectId, sessionId } = req.query;
    const query: any = {};

    if (projectId) query.project = projectId;
    if (sessionId) query.session = sessionId;

    const deliverables = await SessionDeliverable.find(query).populate('uploadedBy', 'name email');
    sendSuccess(res, deliverables);
});

export const updateDeliverable = CatchErrorMiddleware(async (req: Request, res: Response) => {
    const { id } = req.params;
    const { description, status } = req.body;

    const deliverable = await SessionDeliverable.findById(id);
    if (!deliverable) {
        return sendError(res, 'Deliverable not found', 404);
    }

    if (description) deliverable.description = description;
    if (status) deliverable.status = status;

    await deliverable.save();
    sendSuccess(res, deliverable);
});

export const deleteDeliverable = CatchErrorMiddleware(async (req: Request, res: Response) => {
    const { id } = req.params;
    const deletedDeliverable = await SessionDeliverable.findByIdAndDelete(id);
    if (!deletedDeliverable) {
        return sendError(res, 'Deliverable not found', 404);
    }
    sendSuccess(res, { message: 'Deliverable deleted successfully' });
});
```

--- C:\work\amplify-new\backend\controllers\TagController.ts ---

```typescript
import { Request, Response } from 'express';
import Tag from '../model/TagModel';
import { CatchErrorMiddleware } from '../middlewares/CatchErrorMiddleware';
import { AuthenticatedRequest } from '../middlewares/authenticateJwt';
import { sendSuccess, sendError } from '../utils/responseHelpers';

// Create a new tag
export const createTag = CatchErrorMiddleware(async (req: AuthenticatedRequest, res: Response) => {
    const { name, description } = req.body;
    const createdBy = req.user?._id;

    const newTag = new Tag({ name, description, createdBy });
    await newTag.save();
    sendSuccess(res, newTag, 201);
});

// Get all tags
export const getAllTags = CatchErrorMiddleware(async (req: AuthenticatedRequest, res: Response) => {
    const tags = await Tag.find({ createdBy: req.user?._id });
    sendSuccess(res, tags);
});

// Get a single tag by ID
export const getTagById = CatchErrorMiddleware(async (req: Request, res: Response) => {
    const tag = await Tag.findById(req.params.id);
    if (!tag) {
        return sendError(res, 'Tag not found', 404);
    }
    sendSuccess(res, tag);
});

// Update a tag
export const updateTag = CatchErrorMiddleware(async (req: Request, res: Response) => {
    const updatedTag = await Tag.findByIdAndUpdate(req.params.id, req.body, { new: true });
    if (!updatedTag) {
        return sendError(res, 'Tag not found', 404);
    }
    sendSuccess(res, updatedTag);
});

// Delete a tag
export const deleteTag = CatchErrorMiddleware(async (req: Request, res: Response) => {
    const deletedTag = await Tag.findByIdAndDelete(req.params.id);
    if (!deletedTag) {
        return sendError(res, 'Tag not found', 404);
    }
    sendSuccess(res, { message: 'Tag deleted successfully' });
});
```

--- C:\work\amplify-new\backend\controllers\UserController.ts ---

```typescript
import { Request, Response, NextFunction } from "express";
import User from "../model/UserModel";
import { CatchErrorMiddleware } from "../middlewares/CatchErrorMiddleware";
import ErrorHandler from "../utils/ErrorHandler";
import { sendToken } from "../utils/tokenService";
import { sendVerificationEmail } from "../processors/sendEmail/sendVerifyAccountEmailProcessor";
import { AuthenticatedRequest } from "../middlewares/authenticateJwt";
import { removePasswordFromUser } from "../processors/user/removePasswordFromUserObjectProcessor";
import { isValidEmail } from "../processors/isValidEmail";
import { isStrongPassword } from "../processors/user/isStrongPasswordProcessor";

// User Registration
export const registerUser = CatchErrorMiddleware(
  async (req: Request, res: Response, next: NextFunction) => {
    const { name, email, password, role } = req.body;

    if (!name || !email || !password) {
      return next(new ErrorHandler("Please provide all required fields", 400));
    }

    if (!isValidEmail(email)) {
      return next(new ErrorHandler("Invalid email format", 400));
    }

    if (!isStrongPassword(password)) {
      return next(
        new ErrorHandler(
          "Password must be at least 8 characters long and contain at least one uppercase letter, one lowercase letter, one number, and one special character",
          400
        )
      );
    }

    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return next(new ErrorHandler("User already exists", 409));
    }

    const user = await User.create({ name, email, password, role });
    await sendVerificationEmail(user, req);

    res.status(201).json({
      success: true,
      message: `Verification email sent to ${user.email}`,
    });
  }
);

// Verify User Account
export const verifyUser = CatchErrorMiddleware(
  async (req: Request, res: Response, next: NextFunction) => {
    const { token } = req.params;
    const user = await User.findOne({
      verificationToken: token,
      verificationTokenExpires: { $gt: Date.now() },
    });

    if (!user) {
      return next(new ErrorHandler("Invalid or expired token", 400));
    }

    user.isVerified = true;
    user.verificationToken = undefined;
    user.verificationTokenExpires = undefined;
    await user.save();

    sendToken(user, 200, res);
  }
);

// User Login
export const loginUser = CatchErrorMiddleware(
  async (req: Request, res: Response, next: NextFunction) => {
    const { email, password } = req.body;

    if (!email || !password) {
      return next(new ErrorHandler("Please provide email and password", 400));
    }

    const user = await User.findOne({ email }).select("+password");
    if (!user) {
      return next(new ErrorHandler("Invalid credentials", 401));
    }

    const isPasswordMatched = await user.comparePassword(password);
    if (!isPasswordMatched) {
      return next(new ErrorHandler("Invalid credentials", 401));
    }

    if (!user.isVerified) {
      return next(new ErrorHandler("Please verify your email to login", 403));
    }

    sendToken(user, 200, res);
  }
);

// User Logout
export const logoutUser = CatchErrorMiddleware(
  (req: Request, res: Response) => {
    res.cookie("accessToken", "", {
      httpOnly: true,
      expires: new Date(0),
    });
    res.cookie("refreshToken", "", {
      httpOnly: true,
      expires: new Date(0),
    });
    res.status(200).json({ success: true, message: "Logged out" });
  }
);

// Get User Profile
export const getUserProfile = CatchErrorMiddleware(
  async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
    const userId = req.user?._id;
    if (!userId) {
      return next(new ErrorHandler("User not found", 404));
    }
    const user = await User.findById(userId);
    if (!user) {
      return next(new ErrorHandler("User not found", 404));
    }
    res.status(200).json({ success: true, user: removePasswordFromUser(user) });
  }
);

// Update User Profile
export const updateUserProfile = CatchErrorMiddleware(
  async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
    const userId = req.user?._id;
    if (!userId) {
      return next(new ErrorHandler("User not found", 404));
    }
    const { name, email } = req.body;
    const user = await User.findById(userId);

    if (!user) {
      return next(new ErrorHandler("User not found", 404));
    }

    if (email && email !== user.email) {
      if (!isValidEmail(email)) {
        return next(new ErrorHandler("Invalid email format", 400));
      }
      const existingUser = await User.findOne({ email });
      if (existingUser) {
        return next(new ErrorHandler("Email already in use", 409));
      }
      user.email = email;
    }

    if (name) {
      user.name = name;
    }

    await user.save();
    res.status(200).json({ success: true, user: removePasswordFromUser(user) });
  }
);

// Update User Password
export const updateUserPassword = CatchErrorMiddleware(
  async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
    const userId = req.user?._id;
    if (!userId) {
      return next(new ErrorHandler("User not found", 404));
    }
    const { oldPassword, newPassword } = req.body;
    const user = await User.findById(userId).select("+password");

    if (!user) {
      return next(new ErrorHandler("User not found", 404));
    }

    const isPasswordMatched = await user.comparePassword(oldPassword);
    if (!isPasswordMatched) {
      return next(new ErrorHandler("Incorrect old password", 401));
    }

    if (!isStrongPassword(newPassword)) {
      return next(
        new ErrorHandler(
          "Password must be at least 8 characters long and contain at least one uppercase letter, one lowercase letter, one number, and one special character",
          400
        )
      );
    }

    user.password = newPassword;
    await user.save();

    res
      .status(200)
      .json({ success: true, message: "Password updated successfully" });
  }
);

// Get all users (Admin only)
export const getAllUsers = CatchErrorMiddleware(
  async (req: Request, res: Response) => {
    const users = await User.find();
    const usersWithoutPasswords = users.map(removePasswordFromUser);
    res.status(200).json({ success: true, users: usersWithoutPasswords });
  }
);

// Get user by ID (Admin only)
export const getUserById = CatchErrorMiddleware(
  async (req: Request, res: Response, next: NextFunction) => {
    const user = await User.findById(req.params.id);
    if (!user) {
      return next(
        new ErrorHandler(`User not found with id: ${req.params.id}`, 404)
      );
    }
    res.status(200).json({ success: true, user: removePasswordFromUser(user) });
  }
);

// Update user role (Admin only)
export const updateUserRole = CatchErrorMiddleware(
  async (req: Request, res: Response, next: NextFunction) => {
    const user = await User.findById(req.params.id);
    if (!user) {
      return next(
        new ErrorHandler(`User not found with id: ${req.params.id}`, 404)
      );
    }

    user.role = req.body.role;
    await user.save();

    res.status(200).json({ success: true, user: removePasswordFromUser(user) });
  }
);

// Delete user (Admin only)
export const deleteUser = CatchErrorMiddleware(
  async (req: Request, res: Response, next: NextFunction) => {
    const user = await User.findById(req.params.id);
    if (!user) {
      return next(
        new ErrorHandler(`User not found with id: ${req.params.id}`, 404)
      );
    }

    await user.deleteOne();
    res.status(200).json({ success: true, message: "User deleted" });
  }
);
```

--- C:\work\amplify-new\backend\middlewares\authenticateJwt.ts ---

```typescript
import { Request, Response, NextFunction } from "express";
import jwt from "jsonwebtoken";
import config from "../config";
import ErrorHandler from "../utils/ErrorHandler";
import User, { IUser } from "../model/UserModel";
import { CatchErrorMiddleware } from "./CatchErrorMiddleware";

export interface AuthenticatedRequest extends Request {
  user?: IUser;
}

export const authenticateJwt = CatchErrorMiddleware(
  async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
    const accessToken = req.cookies.accessToken;

    if (!accessToken) {
      return next(new ErrorHandler("Authentication token is missing", 401));
    }

    try {
      const decoded = jwt.verify(
        accessToken,
        config.access_token_secret as string
      ) as { id: string };
      const user = await User.findById(decoded.id);

      if (!user) {
        return next(new ErrorHandler("User not found", 404));
      }

      req.user = user;
      next();
    } catch (error) {
      return next(new ErrorHandler("Invalid or expired token", 403));
    }
  }
);
```

--- C:\work\amplify-new\backend\middlewares\authorizeRoles.ts ---

```typescript
import { Response, NextFunction } from "express";
import { AuthenticatedRequest } from "./authenticateJwt";
import ErrorHandler from "../utils/ErrorHandler";

export const authorizeRoles = (...roles: string[]) => {
  return (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
    if (!req.user || !roles.includes(req.user.role)) {
      return next(
        new ErrorHandler(
          `Role (${req.user?.role}) is not allowed to access this resource`,
          403
        )
      );
    }
    next();
  };
};
```

--- C:\work\amplify-new\backend\middlewares\CatchErrorMiddleware.ts ---

```typescript
import { Request, Response, NextFunction } from "express";

type AsyncFunction = (
  req: Request,
  res: Response,
  next: NextFunction
) => Promise<any>;

export const CatchErrorMiddleware =
  (theFunc: AsyncFunction) =>
  (req: Request, res: Response, next: NextFunction) => {
    Promise.resolve(theFunc(req, res, next)).catch(next);
  };
```

--- C:\work\amplify-new\backend\middlewares\deviceInfo.ts ---

```typescript
import { Request, Response, NextFunction } from 'express';
import useragent from 'express-useragent';
import requestIp from 'request-ip';
import geoip from 'geoip-lite';

export interface DeviceInfo {
    ip: string;
    browser: string;
    os: string;
    platform: string;
    device: string;
    source: string;
    isMobile: boolean;
    isDesktop: boolean;
    isBot: boolean;
    geo?: geoip.Lookup | null;
}

// Extend the Express Request interface
declare global {
    namespace Express {
        interface Request {
            deviceInfo?: DeviceInfo;
        }
    }
}

export const deviceInfoMiddleware = (req: Request, res: Response, next: NextFunction) => {
    const source = req.headers['user-agent'] || '';
    const ua = useragent.parse(source);
    const clientIp = requestIp.getClientIp(req);

    const geo = clientIp ? geoip.lookup(clientIp) : null;

    req.deviceInfo = {
        ip: clientIp || 'Unknown',
        browser: ua.browser,
        os: ua.os,
        platform: ua.platform,
        device: ua.isMobile ? 'Mobile' : (ua.isDesktop ? 'Desktop' : 'Other'),
        source: ua.source,
        isMobile: ua.isMobile,
        isDesktop: ua.isDesktop,
        isBot: ua.isBot,
        geo: geo
    };

    next();
};
```

--- C:\work\amplify-new\backend\middlewares\ErrorMiddleware.ts ---

```typescript
import { Request, Response, NextFunction } from "express";
import ErrorHandler from "../utils/ErrorHandler";

const errorMiddleware = (
  err: any,
  req: Request,
  res: Response,
  next: NextFunction
) => {
  err.statusCode = err.statusCode || 500;
  err.message = err.message || "Internal Server Error";

  // Wrong Mongoose Object ID Error
  if (err.name === "CastError") {
    const message = `Resource not found. Invalid: ${err.path}`;
    err = new ErrorHandler(message, 400);
  }

  // Handling Mongoose Validation Error
  if (err.name === "ValidationError") {
    const message = Object.values(err.errors)
      .map((value: any) => value.message)
      .join(", ");
    err = new ErrorHandler(message, 400);
  }

  // Handling Mongoose duplicate key errors
  if (err.code === 11000) {
    const message = `Duplicate ${Object.keys(err.keyValue)} entered`;
    err = new ErrorHandler(message, 400);
  }

  // Handling wrong JWT error
  if (err.name === "JsonWebTokenError") {
    const message = "JSON Web Token is invalid. Try Again!!!";
    err = new ErrorHandler(message, 400);
  }

  // Handling Expired JWT error
  if (err.name === "TokenExpiredError") {
    const message = "JSON Web Token is expired. Try Again!!!";
    err = new ErrorHandler(message, 400);
  }

  res.status(err.statusCode).json({
    success: false,
    message: err.message,
  });
};

export default errorMiddleware;
```

--- C:\work\amplify-new\backend\model\ChatModel.ts ---

```typescript
import mongoose, { Schema, Document } from 'mongoose';

export interface IChat extends Document {
    project: mongoose.Types.ObjectId;
    session: mongoose.Types.ObjectId;
    user: mongoose.Types.ObjectId;
    message: string;
    timestamp: Date;
    type: 'participant-waiting' | 'participant-meeting' | 'observer-waiting' | 'observer-meeting';
}

const ChatSchema: Schema = new Schema({
    project: { type: Schema.Types.ObjectId, ref: 'Project', required: true },
    session: { type: Schema.Types.ObjectId, ref: 'Session', required: true },
    user: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    message: { type: String, required: true },
    timestamp: { type: Date, default: Date.now },
    type: { type: String, required: true, enum: ['participant-waiting', 'participant-meeting', 'observer-waiting', 'observer-meeting'] }
});

export default mongoose.model<IChat>('Chat', ChatSchema);
```

--- C:\work\amplify-new\backend\model\GroupMessage.ts ---

```typescript
import mongoose, { Schema, Document } from 'mongoose';

export interface IGroupMessage extends Document {
    project: mongoose.Types.ObjectId;
    session: mongoose.Types.ObjectId;
    from: mongoose.Types.ObjectId;
    to: mongoose.Types.ObjectId[]; // Can be empty for broadcast to all in a role
    role: 'moderator' | 'participant' | 'observer'; // Role of the recipients
    message: string;
    timestamp: Date;
}

const GroupMessageSchema: Schema = new Schema({
    project: { type: Schema.Types.ObjectId, ref: 'Project', required: true },
    session: { type: Schema.Types.ObjectId, ref: 'Session', required: true },
    from: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    to: [{ type: Schema.Types.ObjectId, ref: 'User' }],
    role: { type: String, enum: ['moderator', 'participant', 'observer'] },
    message: { type: String, required: true },
    timestamp: { type: Date, default: Date.now }
});

export default mongoose.model<IGroupMessage>('GroupMessage', GroupMessageSchema);
```

--- C:\work\amplify-new\backend\model\LiveSessionModel.ts ---

```typescript
import mongoose, { Schema, Document } from 'mongoose';

export interface ILiveSession extends Document {
    project: mongoose.Types.ObjectId;
    session: mongoose.Types.ObjectId;
    moderator: mongoose.Types.ObjectId;
    participants: mongoose.Types.ObjectId[];
    observers: mongoose.Types.ObjectId[];
    startTime: Date;
    endTime?: Date;
    status: 'active' | 'ended';
}

const LiveSessionSchema: Schema = new Schema({
    project: { type: Schema.Types.ObjectId, ref: 'Project', required: true },
    session: { type: Schema.Types.ObjectId, ref: 'Session', required: true },
    moderator: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    participants: [{ type: Schema.Types.ObjectId, ref: 'User' }],
    observers: [{ type: Schema.Types.ObjectId, ref: 'User' }],
    startTime: { type: Date, default: Date.now },
    endTime: { type: Date },
    status: { type: String, enum: ['active', 'ended'], default: 'active' }
});

export default mongoose.model<ILiveSession>('LiveSession', LiveSessionSchema);
```

--- C:\work\amplify-new\backend\model\ModeratorModel.ts ---

```typescript
import mongoose, { Schema, Document } from 'mongoose';

export interface IModerator extends Document {
    userId: mongoose.Types.ObjectId;
    projectId: mongoose.Types.ObjectId;
    assignedSessions: mongoose.Types.ObjectId[];
}

const ModeratorSchema: Schema = new Schema({
    userId: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    projectId: { type: Schema.Types.ObjectId, ref: 'Project', required: true },
    assignedSessions: [{ type: Schema.Types.ObjectId, ref: 'Session' }]
});

export default mongoose.model<IModerator>('Moderator', ModeratorSchema);
```

--- C:\work\amplify-new\backend\model\ObserverDocumentModel.ts ---

```typescript
import mongoose, { Schema, Document } from 'mongoose';

export interface IObserverDocument extends Document {
    project: mongoose.Types.ObjectId;
    session: mongoose.Types.ObjectId;
    user: mongoose.Types.ObjectId; // The observer who uploaded it
    fileName: string;
    fileType: string;
    s3Url: string;
    uploadDate: Date;
}

const ObserverDocumentSchema: Schema = new Schema({
    project: { type: Schema.Types.ObjectId, ref: 'Project', required: true },
    session: { type: Schema.Types.ObjectId, ref: 'Session', required: true },
    user: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    fileName: { type: String, required: true },
    fileType: { type: String, required: true },
    s3Url: { type: String, required: true },
    uploadDate: { type: Date, default: Date.now }
});

export default mongoose.model<IObserverDocument>('ObserverDocument', ObserverDocumentSchema);
```

--- C:\work\amplify-new\backend\model\ObserverGroupMessage.ts ---

```typescript
import mongoose, { Schema, Document } from 'mongoose';

export interface IObserverGroupMessage extends Document {
    project: mongoose.Types.ObjectId;
    session: mongoose.Types.ObjectId;
    from: mongoose.Types.ObjectId; // Moderator
    message: string;
    timestamp: Date;
}

const ObserverGroupMessageSchema: Schema = new Schema({
    project: { type: Schema.Types.ObjectId, ref: 'Project', required: true },
    session: { type: Schema.Types.ObjectId, ref: 'Session', required: true },
    from: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    message: { type: String, required: true },
    timestamp: { type: Date, default: Date.now }
});

export default mongoose.model<IObserverGroupMessage>('ObserverGroupMessage', ObserverGroupMessageSchema);
```

--- C:\work\amplify-new\backend\model\ObserverWaitingRoomChatModel.ts ---

```typescript
import mongoose, { Schema, Document } from 'mongoose';

export interface IObserverWaitingRoomChat extends Document {
    project: mongoose.Types.ObjectId;
    session: mongoose.Types.ObjectId;
    user: mongoose.Types.ObjectId; // Observer or Moderator
    message: string;
    timestamp: Date;
}

const ObserverWaitingRoomChatSchema: Schema = new Schema({
    project: { type: Schema.Types.ObjectId, ref: 'Project', required: true },
    session: { type: Schema.Types.ObjectId, ref: 'Session', required: true },
    user: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    message: { type: String, required: true },
    timestamp: { type: Date, default: Date.now }
});

export default mongoose.model<IObserverWaitingRoomChat>('ObserverWaitingRoomChat', ObserverWaitingRoomChatSchema);
```

--- C:\work\amplify-new\backend\model\ParticipantMeetingChatModel.ts ---

```typescript
import mongoose, { Schema, Document } from 'mongoose';

export interface IParticipantMeetingChat extends Document {
    project: mongoose.Types.ObjectId;
    session: mongoose.Types.ObjectId;
    user: mongoose.Types.ObjectId; // Participant or Moderator
    message: string;
    timestamp: Date;
}

const ParticipantMeetingChatSchema: Schema = new Schema({
    project: { type: Schema.Types.ObjectId, ref: 'Project', required: true },
    session: { type: Schema.Types.ObjectId, ref: 'Session', required: true },
    user: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    message: { type: String, required: true },
    timestamp: { type: Date, default: Date.now }
});

export default mongoose.model<IParticipantMeetingChat>('ParticipantMeetingChat', ParticipantMeetingChatSchema);
```

--- C:\work\amplify-new\backend\model\ParticipantWaitingRoomChatModel.ts ---

```typescript
import mongoose, { Schema, Document } from 'mongoose';

export interface IParticipantWaitingRoomChat extends Document {
    project: mongoose.Types.ObjectId;
    session: mongoose.Types.ObjectId;
    user: mongoose.Types.ObjectId; // Participant or Moderator
    message: string;
    timestamp: Date;
}

const ParticipantWaitingRoomChatSchema: Schema = new Schema({
    project: { type: Schema.Types.ObjectId, ref: 'Project', required: true },
    session: { type: Schema.Types.ObjectId, ref: 'Session', required: true },
    user: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    message: { type: String, required: true },
    timestamp: { type: Date, default: Date.now }
});

export default mongoose.model<IParticipantWaitingRoomChat>('ParticipantWaitingRoomChat', ParticipantWaitingRoomChatSchema);
```

--- C:\work\amplify-new\backend\model\PollModel.ts ---

```typescript
import mongoose, { Schema, Document } from 'mongoose';

export interface IQuestion extends Document {
    questionText: string;
    questionType: 'multiple-choice' | 'single-choice' | 'text' | 'rating';
    options?: string[];
    responses: {
        user: mongoose.Types.ObjectId;
        answer: any;
    }[];
}

export interface IPoll extends Document {
    title: string;
    questions: IQuestion[];
    createdBy: mongoose.Types.ObjectId;
    projectId: mongoose.Types.ObjectId;
    sessionId: mongoose.Types.ObjectId;
    createdAt: Date;
}

const QuestionSchema: Schema = new Schema({
    questionText: { type: String, required: true },
    questionType: { type: String, required: true, enum: ['multiple-choice', 'single-choice', 'text', 'rating'] },
    options: [{ type: String }],
    responses: [{
        user: { type: Schema.Types.ObjectId, ref: 'User' },
        answer: Schema.Types.Mixed
    }]
});

const PollSchema: Schema = new Schema({
    title: { type: String, required: true },
    questions: [QuestionSchema],
    createdBy: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    projectId: { type: Schema.Types.ObjectId, ref: 'Project', required: true },
    sessionId: { type: Schema.Types.ObjectId, ref: 'Session', required: true },
    createdAt: { type: Date, default: Date.now }
});

export default mongoose.model<IPoll>('Poll', PollSchema);
```

--- C:\work\amplify-new\backend\model\ProjectFormModel.ts ---

```typescript
import mongoose, { Schema, Document } from 'mongoose';

export interface IProjectForm extends Document {
    projectId: mongoose.Types.ObjectId;
    formSchema: any; // Flexible schema for form builder
    responses: {
        userId: mongoose.Types.ObjectId;
        responseData: any;
        submittedAt: Date;
    }[];
}

const ProjectFormSchema: Schema = new Schema({
    projectId: { type: Schema.Types.ObjectId, ref: 'Project', required: true },
    formSchema: { type: Schema.Types.Mixed, required: true },
    responses: [{
        userId: { type: Schema.Types.ObjectId, ref: 'User' },
        responseData: { type: Schema.Types.Mixed },
        submittedAt: { type: Date, default: Date.now }
    }]
});

export default mongoose.model<IProjectForm>('ProjectForm', ProjectFormSchema);
```

--- C:\work\amplify-new\backend\model\ProjectModel.ts ---

```typescript
import mongoose, { Schema, Document } from 'mongoose';

export interface IProject extends Document {
    name: string;
    description: string;
    startDate: Date;
    endDate: Date;
    projectType: string;
    status: 'planning' | 'in-progress' | 'completed' | 'on-hold';
    client: string;
    budget: number;
    team: {
        user: mongoose.Types.ObjectId;
        role: string;
    }[];
    tasks: {
        title: string;
        description: string;
        assignedTo: mongoose.Types.ObjectId;
        dueDate: Date;
        status: 'todo' | 'in-progress' | 'done';
    }[];
    risks: {
        description: string;
        mitigation: string;
        probability: 'low' | 'medium' | 'high';
        impact: 'low' | 'medium' | 'high';
    }[];
    deliverables: {
        name: string;
        description: string;
        dueDate: Date;
        status: 'pending' | 'completed';
    }[];
    createdBy: mongoose.Types.ObjectId;
}

const ProjectSchema: Schema = new Schema({
    name: { type: String, required: true },
    description: { type: String, required: true },
    startDate: { type: Date, required: true },
    endDate: { type: Date, required: true },
    projectType: { type: String },
    status: { type: String, enum: ['planning', 'in-progress', 'completed', 'on-hold'], default: 'planning' },
    client: { type: String },
    budget: { type: Number },
    team: [{
        user: { type: Schema.Types.ObjectId, ref: 'User' },
        role: { type: String }
    }],
    tasks: [{
        title: { type: String },
        description: { type: String },
        assignedTo: { type: Schema.Types.ObjectId, ref: 'User' },
        dueDate: { type: Date },
        status: { type: String, enum: ['todo', 'in-progress', 'done'] }
    }],
    risks: [{
        description: { type: String },
        mitigation: { type: String },
        probability: { type: String, enum: ['low', 'medium', 'high'] },
        impact: { type: String, enum: ['low', 'medium', 'high'] }
    }],
    deliverables: [{
        name: { type: String },
        description: { type: String },
        dueDate: { type: Date },
        status: { type: String, enum: ['pending', 'completed'] }
    }],
    createdBy: { type: Schema.Types.ObjectId, ref: 'User', required: true }
});

export default mongoose.model<IProject>('Project', ProjectSchema);
```

--- C:\work\amplify-new\backend\model\SessionDeliverableModel.ts ---

```typescript
import mongoose, { Schema, Document } from 'mongoose';

export interface ISessionDeliverable extends Document {
    project: mongoose.Types.ObjectId;
    session: mongoose.Types.ObjectId;
    uploadedBy: mongoose.Types.ObjectId;
    fileName: string;
    fileType: string;
    s3Url: string;
    description?: string;
    status: 'pending-review' | 'approved' | 'rejected';
    uploadDate: Date;
}

const SessionDeliverableSchema: Schema = new Schema({
    project: { type: Schema.Types.ObjectId, ref: 'Project', required: true },
    session: { type: Schema.Types.ObjectId, ref: 'Session', required: true },
    uploadedBy: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    fileName: { type: String, required: true },
    fileType: { type: String, required: true },
    s3Url: { type: String, required: true },
    description: { type: String },
    status: { type: String, enum: ['pending-review', 'approved', 'rejected'], default: 'pending-review' },
    uploadDate: { type: Date, default: Date.now }
});

export default mongoose.model<ISessionDeliverable>('SessionDeliverable', SessionDeliverableSchema);
```

--- C:\work\amplify-new\backend\model\SessionModel.ts ---

```typescript
import mongoose, { Schema, Document } from 'mongoose';

export interface ISession extends Document {
    project: mongoose.Types.ObjectId;
    title: string;
    description: string;
    startTime: Date;
    endTime: Date;
    sessionType: 'focus-group' | 'interview' | 'workshop';
    status: 'scheduled' | 'in-progress' | 'completed' | 'cancelled';
    participants: mongoose.Types.ObjectId[];
    observers: mongoose.Types.ObjectId[];
    moderators: mongoose.Types.ObjectId[];
}

const SessionSchema: Schema = new Schema({
    project: { type: Schema.Types.ObjectId, ref: 'Project', required: true },
    title: { type: String, required: true },
    description: { type: String },
    startTime: { type: Date, required: true },
    endTime: { type: Date, required: true },
    sessionType: { type: String, enum: ['focus-group', 'interview', 'workshop'], required: true },
    status: { type: String, enum: ['scheduled', 'in-progress', 'completed', 'cancelled'], default: 'scheduled' },
    participants: [{ type: Schema.Types.ObjectId, ref: 'User' }],
    observers: [{ type: Schema.Types.ObjectId, ref: 'User' }],
    moderators: [{ type: Schema.Types.ObjectId, ref: 'User' }]
});

export default mongoose.model<ISession>('Session', SessionSchema);
```

--- C:\work\amplify-new\backend\model\TagModel.ts ---

```typescript
import mongoose, { Schema, Document } from 'mongoose';

export interface ITag extends Document {
    name: string;
    description?: string;
    createdBy: mongoose.Types.ObjectId;
}

const TagSchema: Schema = new Schema({
    name: { type: String, required: true, unique: true },
    description: { type: String },
    createdBy: { type: Schema.Types.ObjectId, ref: 'User', required: true }
});

export default mongoose.model<ITag>('Tag', TagSchema);
```

--- C:\work\amplify-new\backend\model\UserActivityModel.ts ---

```typescript
import mongoose, { Schema, Document } from 'mongoose';

export interface IUserActivity extends Document {
    userId: mongoose.Types.ObjectId;
    activityType: 'login' | 'logout' | 'project_creation' | 'session_join';
    timestamp: Date;
    details: any;
}

const UserActivitySchema: Schema = new Schema({
    userId: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    activityType: { type: String, required: true },
    timestamp: { type: Date, default: Date.now },
    details: { type: Schema.Types.Mixed }
});

export default mongoose.model<IUserActivity>('UserActivity', UserActivitySchema);
```

--- C:\work\amplify-new\backend\model\UserModel.ts ---

```typescript
import mongoose, { Schema, Document } from "mongoose";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import crypto from "crypto";
import config from "../config";
import { ROLES } from "../constants/roles";

export interface IUser extends Document {
  name: string;
  email: string;
  password?: string;
  role: string;
  isVerified: boolean;
  verificationToken?: string;
  verificationTokenExpires?: Date;
  createdAt: Date;
  comparePassword(password: string): Promise<boolean>;
  getVerificationToken(): string;
}

const UserSchema: Schema = new Schema({
  name: {
    type: String,
    required: [true, "Please enter your name"],
  },
  email: {
    type: String,
    required: [true, "Please enter your email"],
    unique: true,
    match: [/.+\@.+\..+/, "Please fill a valid email address"],
  },
  password: {
    type: String,
    required: [true, "Please enter your password"],
    minlength: [8, "Password must be at least 8 characters"],
    select: false,
  },
  role: {
    type: String,
    enum: Object.values(ROLES),
    default: ROLES.PARTICIPANT,
  },
  isVerified: {
    type: Boolean,
    default: false,
  },
  verificationToken: String,
  verificationTokenExpires: Date,
  createdAt: {
    type: Date,
    default: Date.now,
  },
});

// Hash password before saving
UserSchema.pre<IUser>("save", async function (next) {
  if (!this.isModified("password") || !this.password) {
    return next();
  }
  this.password = await bcrypt.hash(this.password, 10);
  next();
});

// Compare user password
UserSchema.methods.comparePassword = async function (
  enteredPassword
): Promise<boolean> {
  if (!this.password) {
    return false;
  }
  return await bcrypt.compare(enteredPassword, this.password);
};

// Generate verification token
UserSchema.methods.getVerificationToken = function (): string {
  const verificationToken = crypto.randomBytes(20).toString("hex");

  this.verificationToken = crypto
    .createHash("sha256")
    .update(verificationToken)
    .digest("hex");

  this.verificationTokenExpires = new Date(Date.now() + 10 * 60 * 1000); // 10 minutes

  return verificationToken;
};

export default mongoose.model<IUser>("User", UserSchema);
```

--- C:\work\amplify-new\backend\processors\isValidEmail.ts ---

```typescript
export const isValidEmail = (email: string): boolean => {
    const emailRegex = /^[^
@]+@[^
@]+\.[^
@]+$/;
    return emailRegex.test(email);
  };
```

--- C:\work\amplify-new\backend\processors\liveSession\sessionService.ts ---

```typescript
import LiveSession from "../../model/LiveSessionModel";
import Session from "../../model/SessionModel";
import ErrorHandler from "../../utils/ErrorHandler";

export const startLiveSession = async (projectId: string, sessionId: string, moderatorId: string) => {
    const sessionDetails = await Session.findById(sessionId);
    if (!sessionDetails) {
        throw new ErrorHandler("Session not found", 404);
    }

    // Check if the moderator is assigned to this session
    if (!sessionDetails.moderators.includes(moderatorId as any)) {
        throw new ErrorHandler("Moderator not authorized for this session", 403);
    }

    const liveSession = new LiveSession({
        project: projectId,
        session: sessionId,
        moderator: moderatorId,
        participants: [],
        observers: [],
        status: 'active'
    });

    await liveSession.save();
    return liveSession;
};

export const joinLiveSession = async (sessionId: string, userId: string, role: 'participant' | 'observer') => {
    const liveSession = await LiveSession.findOne({ session: sessionId, status: 'active' });
    if (!liveSession) {
        throw new ErrorHandler("Live session not found or not active", 404);
    }

    if (role === 'participant' && !liveSession.participants.includes(userId as any)) {
        liveSession.participants.push(userId as any);
    } else if (role === 'observer' && !liveSession.observers.includes(userId as any)) {
        liveSession.observers.push(userId as any);
    }

    await liveSession.save();
    return liveSession;
};

export const endLiveSession = async (sessionId: string, moderatorId: string) => {
    const liveSession = await LiveSession.findOne({ session: sessionId, status: 'active' });
    if (!liveSession) {
        throw new ErrorHandler("Live session not found or not active", 404);
    }

    if (liveSession.moderator.toString() !== moderatorId) {
        throw new ErrorHandler("Only the moderator can end the session", 403);
    }

    liveSession.status = 'ended';
    liveSession.endTime = new Date();
    await liveSession.save();

    // Also update the main session status
    await Session.findByIdAndUpdate(sessionId, { status: 'completed' });

    return liveSession;
};
```

--- C:\work\amplify-new\backend\processors\poll\QuestionValidationProcessor.ts ---

```typescript
import { IQuestion } from "../../model/PollModel";

export const validateQuestions = (questions: IQuestion[]): boolean => {
    if (!Array.isArray(questions) || questions.length === 0) {
        return false;
    }

    for (const q of questions) {
        if (!q.questionText || !q.questionType) {
            return false;
        }
        if ((q.questionType === 'multiple-choice' || q.questionType === 'single-choice') && (!q.options || q.options.length === 0)) {
            return false;
        }
    }

    return true;
};
```

--- C:\work\amplify-new\backend\processors\sendEmail\sendVerifyAccountEmailProcessor.ts ---

```typescript
import { Request } from "express";
import { IUser } from "../../model/UserModel";
import transporter from "../../config/NodemailerConfig";
import { verificationEmailTemplate } from "../../constants/emailTemplates";
import config from "../../config";

export const sendVerificationEmail = async (
  user: IUser,
  req: Request
): Promise<void> => {
  const verificationToken = user.getVerificationToken();
  await user.save({ validateBeforeSave: false });

  const verificationUrl = `${config.frontend_base_url}/verify-email/${verificationToken}`;

  const mailOptions = {
    from: config.smtp_mail,
    to: user.email,
    subject: "Verify Your Account",
    html: verificationEmailTemplate(user.name, verificationUrl),
  };

  await transporter.sendMail(mailOptions);
};
```

--- C:\work\amplify-new\backend\processors\session\sessionTimeConflictChecker.ts ---

```typescript
import Session from '../../model/SessionModel';

export const checkSessionConflict = async (startTime: Date, endTime: Date, sessionIdToExclude?: string): Promise<boolean> => {
    const query: any = {
        $or: [
            { startTime: { $lt: endTime, $gte: startTime } },
            { endTime: { $gt: startTime, $lte: endTime } },
            { startTime: { $lte: startTime }, endTime: { $gte: endTime } }
        ]
    };

    if (sessionIdToExclude) {
        query._id = { $ne: sessionIdToExclude };
    }

    const conflictingSession = await Session.findOne(query);
    return !!conflictingSession;
};
```

--- C:\work\amplify-new\backend\processors\user\isStrongPasswordProcessor.ts ---

```typescript
export const isStrongPassword = (password: string): boolean => {
    const strongPasswordRegex = new RegExp(
      "^(?=.*[a-z])(?=.*[A-Z])(?=.*[0-9])(?=.*[!@#$%^&*])(?=.{8,})"
    );
    return strongPasswordRegex.test(password);
  };
```

--- C:\work\amplify-new\backend\processors\user\isValidEmailProcessor.ts ---

```typescript
export const isValidEmail = (email: string): boolean => {
    const emailRegex = /^[^
@]+@[^
@]+\.[^
@]+$/;
    return emailRegex.test(email);
  };
```

--- C:\work\amplify-new\backend\processors\user\removePasswordFromUserObjectProcessor.ts ---

```typescript
import { IUser } from "../../model/UserModel";

export const removePasswordFromUser = (user: IUser): Partial<IUser> => {
  const userObj = user.toObject();
  delete userObj.password;
  return userObj;
};
```

--- C:\work\amplify-new\backend\routes\index.ts ---

```typescript
import { Router } from "express";
import userRoutes from "./user/userRoutes";
import projectRoutes from "./project/projectRoutes";
import sessionRoutes from "./session/SessionRoutes";
import tagRoutes from "./tag/TagRoutes";
import moderatorRoutes from "./moderator/ModeratorRoutes";
import observerDocumentRoutes from "./observerDocument/ObserverDocumentRoutes";
import paymentRoutes from "./payment/PaymentRoutes";
import pollRoutes from "./poll/PollRoutes";
import sessionDeliverableRoutes from "./sessionDeliverable/SessionDeliverableRoutes";
import liveSessionRoutes from "./liveSession/LiveSessionRoutes";

const router = Router();

router.use("/users", userRoutes);
router.use("/projects", projectRoutes);
router.use("/sessions", sessionRoutes);
router.use("/tags", tagRoutes);
router.use("/moderators", moderatorRoutes);
router.use("/observer-documents", observerDocumentRoutes);
router.use("/payments", paymentRoutes);
router.use("/polls", pollRoutes);
router.use("/session-deliverables", sessionDeliverableRoutes);
router.use("/live-sessions", liveSessionRoutes);

export default router;
```

--- C:\work\amplify-new\backend\routes\liveSession\LiveSessionRoutes.ts ---

```typescript
import { Router } from 'express';
import { startSession, joinSession, endSession, getSessionDetails } from '../../controllers/LiveSessionController';
import { authenticateJwt } from '../../middlewares/authenticateJwt';
import { authorizeRoles } from '../../middlewares/authorizeRoles';
import { ROLES } from '../../constants/roles';

const router = Router();

router.post('/start', authenticateJwt, authorizeRoles(ROLES.MODERATOR), startSession);
router.post('/:sessionId/join', authenticateJwt, joinSession);
router.post('/:sessionId/end', authenticateJwt, authorizeRoles(ROLES.MODERATOR), endSession);
router.get('/:sessionId', authenticateJwt, getSessionDetails);

export default router;
```

--- C:\work\amplify-new\backend\routes\moderator\ModeratorRoutes.ts ---

```typescript
import { Router } from 'express';
import {
    getAllModerators,
    getModeratorById,
    createModerator,
    updateModerator,
    deleteModerator
} from '../../controllers/ModeratorController';
import { authenticateJwt } from '../../middlewares/authenticateJwt';
import { authorizeRoles } from '../../middlewares/authorizeRoles';
import { ROLES } from '../../constants/roles';

const router = Router();

router.use(authenticateJwt, authorizeRoles(ROLES.ADMIN));

router.route('/')
    .get(getAllModerators)
    .post(createModerator);

router.route('/:id')
    .get(getModeratorById)
    .put(updateModerator)
    .delete(deleteModerator);

export default router;
```

--- C:\work\amplify-new\backend\routes\observerDocument\ObserverDocumentRoutes.ts ---

```typescript
import { Router } from 'express';
import { uploadObserverDocument, getObserverDocuments } from '../../controllers/ObserverDocumentController';
import { authenticateJwt } from '../../middlewares/authenticateJwt';
import { authorizeRoles } from '../../middlewares/authorizeRoles';
import { ROLES } from '../../constants/roles';

const router = Router();

router.post('/upload', authenticateJwt, authorizeRoles(ROLES.OBSERVER, ROLES.ADMIN), uploadObserverDocument);
router.get('/', authenticateJwt, authorizeRoles(ROLES.MODERATOR, ROLES.ADMIN), getObserverDocuments);

export default router;
```

--- C:\work\amplify-new\backend\routes\payment\PaymentRoutes.ts ---

```typescript
import { Router } from 'express';
import { createPaymentIntent, getStripePublishableKey } from '../../controllers/PaymentController';
import { authenticateJwt } from '../../middlewares/authenticateJwt';

const router = Router();

router.post('/create-payment-intent', authenticateJwt, createPaymentIntent);
router.get('/stripe-key', getStripePublishableKey);

export default router;
```

--- C:\work\amplify-new\backend\routes\poll\PollRoutes.ts ---

```typescript
import { Router } from 'express';
import {
    createPoll,
    getPolls,
    getPollById,
    submitPollResponse,
    getPollResults
} from '../../controllers/PollController';
import { authenticateJwt } from '../../middlewares/authenticateJwt';
import { authorizeRoles } from '../../middlewares/authorizeRoles';
import { ROLES } from '../../constants/roles';

const router = Router();

router.post('/', authenticateJwt, authorizeRoles(ROLES.MODERATOR, ROLES.ADMIN), createPoll);
router.get('/', authenticateJwt, getPolls);
router.get('/:id', authenticateJwt, getPollById);
router.post('/:pollId/submit', authenticateJwt, submitPollResponse);
router.get('/:pollId/results', authenticateJwt, authorizeRoles(ROLES.MODERATOR, ROLES.ADMIN), getPollResults);

export default router;
```

--- C:\work\amplify-new\backend\routes\project\projectRoutes.ts ---

```typescript
import { Router } from "express";
import {
  createProject,
  getAllProjects,
  getProjectById,
  updateProject,
  deleteProject,
  addUserToProject,
  removeUserFromProject,
  getProjectSessions,
  downloadProjectFiles,
} from "../../controllers/ProjectController";
import { authenticateJwt } from "../../middlewares/authenticateJwt";
import { authorizeRoles } from "../../middlewares/authorizeRoles";
import { ROLES } from "../../constants/roles";

const router = Router();

router.use(authenticateJwt);

router
  .route("/")
  .post(authorizeRoles(ROLES.ADMIN, ROLES.MODERATOR), createProject)
  .get(getAllProjects);

router
  .route("/:id")
  .get(getProjectById)
  .put(authorizeRoles(ROLES.ADMIN, ROLES.MODERATOR), updateProject)
  .delete(authorizeRoles(ROLES.ADMIN), deleteProject);

router.post(
  "/add-user",
  authorizeRoles(ROLES.ADMIN, ROLES.MODERATOR),
  addUserToProject
);
router.post(
  "/remove-user",
  authorizeRoles(ROLES.ADMIN, ROLES.MODERATOR),
  removeUserFromProject
);

router.get("/:projectId/sessions", getProjectSessions);
router.get(
  "/:projectId/download-files",
  authorizeRoles(ROLES.ADMIN, ROLES.MODERATOR),
  downloadProjectFiles
);

export default router;
```

--- C:\work\amplify-new\backend\routes\session\SessionRoutes.ts ---

```typescript
import { Router } from 'express';
import {
    createSession,
    getAllSessions,
    getSessionById,
    updateSession,
    deleteSession
} from '../../controllers/SessionController';
import { authenticateJwt } from '../../middlewares/authenticateJwt';
import { authorizeRoles } from '../../middlewares/authorizeRoles';
import { ROLES } from '../../constants/roles';

const router = Router();

router.use(authenticateJwt, authorizeRoles(ROLES.ADMIN, ROLES.MODERATOR));

router.route('/')
    .post(createSession)
    .get(getAllSessions);

router.route('/:id')
    .get(getSessionById)
    .put(updateSession)
    .delete(deleteSession);

export default router;
```

--- C:\work\amplify-new\backend\routes\sessionDeliverable\SessionDeliverableRoutes.ts ---

```typescript
import { Router } from 'express';
import {
    uploadDeliverable,
    getDeliverables,
    updateDeliverable,
    deleteDeliverable
} from '../../controllers/SessionDeliverableController';
import { authenticateJwt } from '../../middlewares/authenticateJwt';
import { authorizeRoles } from '../../middlewares/authorizeRoles';
import { ROLES } from '../../constants/roles';

const router = Router();

router.post('/upload', authenticateJwt, uploadDeliverable);
router.get('/', authenticateJwt, getDeliverables);
router.put('/:id', authenticateJwt, authorizeRoles(ROLES.MODERATOR, ROLES.ADMIN), updateDeliverable);
router.delete('/:id', authenticateJwt, authorizeRoles(ROLES.MODERATOR, ROLES.ADMIN), deleteDeliverable);

export default router;
```

--- C:\work\amplify-new\backend\routes\tag\TagRoutes.ts ---

```typescript
import { Router } from 'express';
import {
    createTag,
    getAllTags,
    getTagById,
    updateTag,
    deleteTag
} from '../../controllers/TagController';
import { authenticateJwt } from '../../middlewares/authenticateJwt';
import { authorizeRoles } from '../../middlewares/authorizeRoles';
import { ROLES } from '../../constants/roles';

const router = Router();

router.use(authenticateJwt, authorizeRoles(ROLES.ADMIN, ROLES.MODERATOR));

router.route('/')
    .post(createTag)
    .get(getAllTags);

router.route('/:id')
    .get(getTagById)
    .put(updateTag)
    .delete(deleteTag);

export default router;
```

--- C:\work\amplify-new\backend\routes\user\userRoutes.ts ---

```typescript
import { Router } from "express";
import {
  registerUser,
  verifyUser,
  loginUser,
  logoutUser,
  getUserProfile,
  updateUserProfile,
  updateUserPassword,
  getAllUsers,
  getUserById,
  updateUserRole,
  deleteUser,
} from "../../controllers/UserController";
import { authenticateJwt } from "../../middlewares/authenticateJwt";
import { authorizeRoles } from "../../middlewares/authorizeRoles";
import { ROLES } from "../../constants/roles";

const router = Router();

router.post("/register", registerUser);
router.post("/verify/:token", verifyUser);
router.post("/login", loginUser);
router.post("/logout", logoutUser);

router.get("/profile", authenticateJwt, getUserProfile);
router.put("/profile", authenticateJwt, updateUserProfile);
router.put("/password", authenticateJwt, updateUserPassword);

// Admin routes
router.get(
  "/",
  authenticateJwt,
  authorizeRoles(ROLES.ADMIN),
  getAllUsers
);
router
  .route("/:id")
  .get(authenticateJwt, authorizeRoles(ROLES.ADMIN), getUserById)
  .put(authenticateJwt, authorizeRoles(ROLES.ADMIN), updateUserRole)
  .delete(authenticateJwt, authorizeRoles(ROLES.ADMIN), deleteUser);

export default router;
```

--- C:\work\amplify-new\backend\socket\index.ts ---

```typescript
import { Server as SocketIOServer, Socket } from "socket.io";
import http from "http";
import { handleJoinRoom } from "./handlers/joinRoom";
import { handleParticipantWaitingRoomChat } from "./handlers/participantWaitingRoomChat";
import { handleParticipantMeetingChat } from "./handlers/participantMeetingChat";
import { handleObserverWaitingRoomChat } from "./handlers/observerWaitingRoomChat";
import { handleSessionControl } from "./handlers/sessionControl";
import { handleActivityLog } from "./handlers/activityLogger";
import config from "../config";

export const initSocket = (server: http.Server) => {
  const io = new SocketIOServer(server, {
    cors: {
      origin: config.frontend_base_url,
      methods: ["GET", "POST"],
      credentials: true,
    },
  });

  io.on("connection", (socket: Socket) => {
    console.log("A user connected:", socket.id);

    // Room joining handler
    handleJoinRoom(socket);

    // Chat handlers
    handleParticipantWaitingRoomChat(socket, io);
    handleParticipantMeetingChat(socket, io);
    handleObserverWaitingRoomChat(socket, io);

    // Session control handlers
    handleSessionControl(socket, io);

    // Activity logger
    handleActivityLog(socket);

    socket.on("disconnect", () => {
      console.log("User disconnected:", socket.id);
    });
  });
};
```

--- C:\work\amplify-new\backend\socket\handlers\activityLogger.ts ---

```typescript
import { Socket } from 'socket.io';
import UserActivity from '../../model/UserActivityModel';

export const handleActivityLog = (socket: Socket) => {
    socket.on('logActivity', async (data) => {
        try {
            const { userId, activityType, details } = data;
            if (userId && activityType) {
                const activity = new UserActivity({
                    userId,
                    activityType,
                    details
                });
                await activity.save();
            }
        } catch (error) {
            console.error('Error logging activity:', error);
        }
    });
};
```

--- C:\work\amplify-new\backend\socket\handlers\joinRoom.ts ---

```typescript
import { Socket } from 'socket.io';

export const handleJoinRoom = (socket: Socket) => {
    socket.on('joinRoom', (room) => {
        socket.join(room);
        console.log(`Socket ${socket.id} joined room ${room}`);
    });
};
```

--- C:\work\amplify-new\backend\socket\handlers\observerWaitingRoomChat.ts ---

```typescript
import { Server, Socket } from 'socket.io';
import ObserverWaitingRoomChat from '../../model/ObserverWaitingRoomChatModel';

export const handleObserverWaitingRoomChat = (socket: Socket, io: Server) => {
    socket.on('observerWaitingRoomMessage', async (data) => {
        try {
            const { project, session, user, message } = data;
            const chatMessage = new ObserverWaitingRoomChat({
                project,
                session,
                user,
                message
            });
            await chatMessage.save();
            io.to(`session-observers-waiting-${session}`).emit('newObserverWaitingRoomMessage', chatMessage);
        } catch (error) {
            console.error('Error handling observer waiting room message:', error);
        }
    });
};
```

--- C:\work\amplify-new\backend\socket\handlers\participantMeetingChat.ts ---

```typescript
import { Server, Socket } from 'socket.io';
import ParticipantMeetingChat from '../../model/ParticipantMeetingChatModel';

export const handleParticipantMeetingChat = (socket: Socket, io: Server) => {
    socket.on('participantMeetingMessage', async (data) => {
        try {
            const { project, session, user, message } = data;
            const chatMessage = new ParticipantMeetingChat({
                project,
                session,
                user,
                message
            });
            await chatMessage.save();
            io.to(`session-participants-meeting-${session}`).emit('newParticipantMeetingMessage', chatMessage);
        } catch (error) => {
            console.error('Error handling participant meeting message:', error);
        }
    });
};
```

--- C:\work\amplify-new\backend\socket\handlers\participantWaitingRoomChat.ts ---

```typescript
import { Server, Socket } from 'socket.io';
import ParticipantWaitingRoomChat from '../../model/ParticipantWaitingRoomChatModel';

export const handleParticipantWaitingRoomChat = (socket: Socket, io: Server) => {
    socket.on('participantWaitingRoomMessage', async (data) => {
        try {
            const { project, session, user, message } = data;
            const chatMessage = new ParticipantWaitingRoomChat({
                project,
                session,
                user,
                message
            });
            await chatMessage.save();
            io.to(`session-participants-waiting-${session}`).emit('newParticipantWaitingRoomMessage', chatMessage);
        } catch (error) {
            console.error('Error handling participant waiting room message:', error);
        }
    });
};
```

--- C:\work\amplify-new\backend\socket\handlers\sessionControl.ts ---

```typescript
import { Server, Socket } from 'socket.io';

export const handleSessionControl = (socket: Socket, io: Server) => {
    // Moderator admits a participant from waiting room to main session
    socket.on('admitParticipant', (data) => {
        const { sessionId, participantId } = data;
        io.to(`session-participants-waiting-${sessionId}`).emit('participantAdmitted', { participantId });
        // Logic to move participant socket to the main session room
    });

    // Moderator starts the session for all participants
    socket.on('startSessionForAll', (data) => {
        const { sessionId } = data;
        io.to(`session-participants-waiting-${sessionId}`).emit('sessionStarted');
    });

    // Moderator ends the session
    socket.on('endSessionForAll', (data) => {
        const { sessionId } = data;
        io.to(`session-participants-meeting-${sessionId}`).emit('sessionEnded');
        io.to(`session-observers-meeting-${sessionId}`).emit('sessionEnded');
    });
};
```

--- C:\work\amplify-new\backend\types\express-useragent.d.ts ---

```typescript
import { Request } from 'express';
import { Details } from 'express-useragent';

declare module 'express' {
  interface Request {
    useragent?: Details;
  }
}
```

--- C:\work\amplify-new\backend\utils\ErrorHandler.ts ---

```typescript
class ErrorHandler extends Error {
  statusCode: number;

  constructor(message: string, statusCode: number) {
    super(message);
_Generated by Gemini
    this.statusCode = statusCode;
    Error.captureStackTrace(this, this.constructor);
  }
}

export default ErrorHandler;
```

--- C:\work\amplify-new\backend\utils\multer.ts ---

```typescript
import multer from 'multer';

// Configure multer for file uploads
const storage = multer.diskStorage({
    destination: (req, file, cb) => {
        cb(null, 'uploads/');
    },
    filename: (req, file, cb) => {
        cb(null, `${Date.now()}-${file.originalname}`);
    }
});

const upload = multer({ storage });

export default upload;
```

--- C:\work\amplify-new\backend\utils\responseHelpers.ts ---

```typescript
import { Response } from 'express';

export const sendSuccess = (res: Response, data: any, statusCode: number = 200) => {
    res.status(statusCode).json({
        success: true,
        data
    });
};

export const sendError = (res: Response, message: string, statusCode: number = 500) => {
    res.status(statusCode).json({
        success: false,
        message
    });
};
```

--- C:\work\amplify-new\backend\utils\tokenService.ts ---

```typescript
import { Response } from "express";
import { IUser } from "../model/UserModel";
import config from "../config";
import ms from "ms";

interface ITokenOptions {
  expires: Date;
  httpOnly: boolean;
  secure?: boolean;
}

export const sendToken = (user: IUser, statusCode: number, res: Response) => {
  const accessToken = user.getSignedToken();
  const refreshToken = user.getRefreshToken();

  // Set cookie options
  const accessTokenExpire = new Date(
    Date.now() + ms(config.access_token_expiry || "5m")
  );
  const refreshTokenExpire = new Date(
    Date.now() + ms(config.refresh_token_expiry || "3d")
  );

  const accessTokenOptions: ITokenOptions = {
    expires: accessTokenExpire,
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
  };

  const refreshTokenOptions: ITokenOptions = {
    expires: refreshTokenExpire,
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
  };

  res.cookie("accessToken", accessToken, accessTokenOptions);
  res.cookie("refreshToken", refreshToken, refreshTokenOptions);

  res.status(statusCode).json({
    success: true,
    user,
    accessToken,
  });
};
```

--- C:\work\amplify-new\backend\utils\uploadToS3.ts ---

```typescript
import { S3Client, PutObjectCommand } from "@aws-sdk/client-s3";
import config from "../config";

const s3Client = new S3Client({
  region: config.aws_region,
  credentials: {
    accessKeyId: config.aws_access_key_id as string,
    secretAccessKey: config.aws_secret_access_key as string,
  },
});

export const uploadToS3 = async (fileBuffer: Buffer, fileName: string, mimeType: string): Promise<string> => {
  const key = `observer-documents/${Date.now()}_${fileName}`;
  
  const command = new PutObjectCommand({
    Bucket: config.aws_s3_bucket_name,
    Key: key,
    Body: fileBuffer,
    ContentType: mimeType,
  });

  await s3Client.send(command);

  return `https://${config.aws_s3_bucket_name}.s3.${config.aws_region}.amazonaws.com/${key}`;
};
```