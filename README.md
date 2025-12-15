# DriveLine — iOS (SwiftUI) + NestJS/TypeScript Backend

<p align="center">
<img src="https://img.shields.io/badge/iOS-17.0+-blue" alt="iOS 17.0+">
<img src="https://img.shields.io/badge/SwiftUI-6.0-orange" alt="SwiftUI">
<img src="https://img.shields.io/badge/Backend-Node.js-green" alt="Backend Node.js">
<img src="https://img.shields.io/badge/Framework-NestJS-blue" alt="Framework NestJS">
<img src="https://img.shields.io/badge/Database-MongoDB-lightgreen" alt="Database MongoDB">
<img src="https://img.shields.io/badge/AI-Gemini-purple" alt="AI Gemini">
</p>

**DriveLine** is a full-stack project that combines an iOS SwiftUI app for driving schools, car maintenance, scheduling and in-car AI voice assistance (Gemini) with a Node.js + Express backend written in TypeScript (using Mongoose for MongoDB and Axios for HTTP requests). This README provides a complete, developer-focused overview: architecture, install & run steps, API examples, iOS integration notes (EventKit, Gemini voice assistant), environment variables, development tips and contribution guidelines.

A mobile-focused backend and service layer that powers a unified platform for:

* Driving schools management
* AI-powered voice assistant (Gemini)
* Car maintenance & fixing schedule integration using **EventKit**

This repository provides a clean, scalable, and production-ready backend built with **Node.js**, **NestJS**, **Express**, **TypeScript**, **Mongoose**, and **Axios**.

### Final App Version (Not Included)
- Docker containerization
- Flow Controller based on IP
- Prioritise the requests to give more importance to critical requests
- Advanced Caching Mechanism using Redis for Flow Controller and API Responses
- RabbitMQ with Separated port for Heavy Works (Gemini Request & Stripe Payment Gateway)
- More Security Layers
- Real-time Chat using Socket.IO
- Scheduled Car Maintenance with EventKit Integration
- Stripe Payment Gateway Integration for Subscriptions and Maintenance Services With PostgreSQL for stripe Database

-------------

### Screenshot

<table>
    <tr>
      <td> <img src="Screenshots/1.jpg"  width="300" height="649" alt="1"/> </td>
      <td> <img src="Screenshots/2.jpg"  width="300" height="649" alt="2"/> </td>
    </tr>
    <tr>
      <td> <img src="Screenshots/3.jpg"  width="300" height="649" alt="3"/> </td>
      <td> <img src="Screenshots/4.jpg"  width="300" height="649" alt="4"/> </td>
    </tr>
    <tr>
      <td> <img src="Screenshots/5.jpg"  width="300" height="649" alt="5"/> </td>
      <td> <img src="Screenshots/6.jpg"  width="300" height="649" alt="6"/> </td>
    </tr>
    <tr>
      <td> <img src="Screenshots/7.jpg"  width="300" height="649" alt="7"/> </td>
      <td> <img src="Screenshots/8.jpg"  width="300" height="649" alt="8"/> </td>
    </tr>
</table>

-------------

### Screen Records


https://github.com/user-attachments/assets/a2665e82-d7c9-40c4-b861-597c77832cfc


-------------

## 🌟 Core Features

### 🎓 Intelligent Driving School Management
- **Interactive Learning Modules**: Comprehensive driving theory with progress tracking
- **Instructor Matching**: AI-powered instructor pairing based on learning style and availability
- **Lesson Scheduling**: Real-time availability and booking system with conflict resolution
- **Progress Analytics**: Detailed performance metrics and skill development tracking
- **Road Test Preparation**: Mock tests and examination route familiarization

### 🔧 Advanced Vehicle Maintenance System
- **Maintenance Tracking**: Automated service interval monitoring and reminders
- **Digital Vehicle Health Records**: Complete maintenance history with service documentation
- **Predictive Maintenance**: AI-driven alerts for potential issues before they occur
- **Parts & Service Catalog**: Integrated database of maintenance procedures and replacement parts
- **Cost Tracking**: Service expense monitoring and budget planning

### 🗣️ AI Voice Assistant (Gemini Integration)
- **Natural Language Processing**: Voice-activated commands for hands-free operation
- **Context-Aware Assistance**: Intelligent responses based on current app context and user history
- **Maintenance Guidance**: Step-by-step voice instructions for common vehicle repairs
- **Learning Support**: Interactive Q&A for driving theory and practical skills
- **Smart Scheduling**: Voice-controlled calendar management for lessons and maintenance

### 📅 Intelligent Scheduling with EventKit
- **Seamless Calendar Integration**: Automatic synchronization with native iOS Calendar app
- **Conflict Resolution**: Smart scheduling that avoids timing conflicts across driving lessons and maintenance
- **Location-Based Reminders**: Geo-fenced notifications for appointments and maintenance due dates
- **Recurring Event Management**: Automated scheduling for regular maintenance and recurring lessons
- **Multi-Calendar Support**: Integration with personal, work, and custom vehicle calendars


## 🛠️ Tech Stack

### Client (iOS)

| Layer               | Technology                           |
| ------------------- | ------------------------------------ |
| Language            | Swift                                |
| UI Framework        | SwiftUI                              |
| Reactive Programming| Combine / async-await                |
| Calendar & Scheduling| EventKit                            |
| Voice I/O           | AVFoundation / Speech                |

### Backend (Server)

| Layer        | Technology         |
| ------------ | ------------       |
| Runtime      | Node.js            |
| Framework    | Express & Nest.js  |
| Language     | TypeScript         |
| Database     | MongoDB            |
| Database ORM | Mongoose           |
| HTTP Client  | Axios              |
| Authentication| JWT / OAuth       |


# Quick start — Backend (Express + TypeScript)

The backend folder in the repo folder: driveline-express-ts-api. (If you fork/clone, adjust paths accordingly.)  ￼

### Scripts:

```bash
npm install    # Install
npm run dev    # Start dev server
npm run build  # Compile TypeScript
npm start      # Run compiled JS
```

### 🛡️ Environment Variables

Required:

```env
MONGO_URL=
PORT=
GEMINI_API_KEY=
...
...
```

Optional values may be added depending on the integration roadmap.

# Quick start — Backend (NestJS + TypeScript)

Project folder: driveline-express-nest-ts-api (adjust path if you fork/clone).


### Install & run

```bash
# install deps
npm install

# dev mode (auto reload)
npm run start:dev

# build TypeScript
npm run build

# run built JS (production)
npm run start:prod
```

> Nest dev server uses `ts-node` / Nest CLI under the hood for `start:dev`. `start:prod` runs the compiled `dist/main.js`.

---

# Migration checklist (Express → NestJS)

Use this checklist after migration to confirm parity:

1. **Routing → Controllers**

   * Convert Express routes to `@Controller()` + `@Get()`, `@Post()` methods.
   * Keep route DTOs but switch to Nest-style DTO classes using `class-validator` decorators.

2. **Handlers → Services**

   * Business logic should live in `@Injectable()` services.
   * Controllers remain thin: validate input, call service, return response.

3. **Middlewares → Guards / Interceptors / Pipes**

   * Auth middleware → `AuthGuard` / `ApiKeyGuard` (`@UseGuards(...)`).
   * Validation middleware → `ValidationPipe` (set globally in `main.ts`).
   * Logging or response shaping → interceptors.

4. **Dependency Injection**

   * Replace `require()` / manual injection with Nest DI (`providers` in module metadata).
   * Make sure singleton/shared services are provided at the correct module scope.

5. **Mongoose**

   * Use `@nestjs/mongoose` with `MongooseModule.forRoot(process.env.MONGO_URI)` and `MongooseModule.forFeature([{ name: User.name, schema: UserSchema }])`.
   * Keep schema names consistent; prefer `schemaName` exact casing to avoid import/case issues on macOS/Linux.

6. **Error handling**

   * Replace centralized Express error-handler with Nest `HttpException` and (optionally) a custom `AllExceptionsFilter`.

7. **Global config**

   * Add `ConfigModule.forRoot({ isGlobal: true, envFilePath: '.env' })` and typed config with `registerAs()` if desired.

8. **Validation**

   * Use `class-validator` + `class-transformer` with `app.useGlobalPipes(new ValidationPipe({ whitelist: true, transform: true }))`.

9. **Authentication**

   * Implement `PassportModule` + `JwtModule` for JWT flows and create custom `ApiKeyGuard` for API key checks.

10. **CORS, rate limit, security**

    * Configure `app.enableCors()` and add helmet or rate-limiter (e.g., `express-rate-limit`) via Nest middlewares or using `@nestjs/throttler`.

11. **Static assets**

    * If you served static files in Express, use `app.useStaticAssets()` or configure `ServeStaticModule`.

12. **Tests**

    * Convert route-level tests to Nest’s testing utilities (`TestingModule`) using `@nestjs/testing`.

13. **Build outputs**

    * Source builds to `dist/` — do **not** commit `dist/` to git (usually). Add `dist/` to `.gitignore`. For some hosting providers you may need to build during deploy (see Deploy notes).


---


## 🧠 AI Voice Assistant (Gemini)

Core logic:

* Receives prompt from frontend
* Sends request to Gemini
* Normalizes output for mobile UI & voice

Dependencies:

* [https://www.npmjs.com/package/axios](https://www.npmjs.com/package/axios)


## 🗃️ Database Layer (Mongoose)

### Mongoose Resources

* MongoDB Node Driver: [https://www.mongodb.com/docs/drivers/node/current/integrations/mongoose-get-started/](https://www.mongodb.com/docs/drivers/node/current/integrations/mongoose-get-started/)
* Mongoose Docs: [https://www.npmjs.com/package/mongoose](https://www.npmjs.com/package/mongoose)

Schemas are organized under `/models` and follow TypeScript interfaces.

---

## 🌐 Express Backend

Official Docs:

* [https://expressjs.com/](https://expressjs.com/)

Routes are mounted like:

```ts
app.use('/api/service', serviceRoutes);
```

Each route connects to its controller and validates input using TypeScript.

---

## 📬 HTTP Client (Axios)

Axios is used for all outbound API calls:

* Gemini AI API
* External driving resources if needed

Docs:

* [https://www.npmjs.com/package/axios](https://www.npmjs.com/package/axios)

License

* DriveLine is licensed under the Apache-2.0 License.  ￼

