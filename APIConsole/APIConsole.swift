//
//  main.swift
//  APIConsole
//
//  Created by OmAr Kader on 09/11/2026.
//
/**
 
- Add In Prject (Not a target) -> Info new configuration -> Cloned From Debug -> `Test`
- chmod +x run-api-console.sh
- ./run-api-console.sh
 */

import Foundation
import SwiftUISturdy

@main
struct APIConsole {
    
    
    let auth: AuthBase
    let aiChat: AiChatBase
    let fix: FixServiceBase
    let course: CourseBase
    let short: ShortVideoBase
    let obs = BaseAppObserve

    init() {
        AppConfig.setIsDebuggerAttached(.off)
        let keychainManager = KeychainManager()
        let secureSession = SecureSessionManager(keychainManager: keychainManager)

        let urlSessions = AppURLSessions(
            baseURLSession: URLSession.skipCacheResult,
            disableCache: URLSession.disableCache,
            secure: URLSession.secure
        )

        auth = AuthBase(repo: AuthRepoImp(appSessions: urlSessions, secureSession: secureSession))
        aiChat = AiChatBase(repo: AiChatRepoImp(appSessions: urlSessions))
        fix = FixServiceBase(repo: FixServiceRepoImp(appSessions: urlSessions))
        course = CourseBase(repo: CourseRepoImp(appSessions: urlSessions))
        short = ShortVideoBase(repo: ShortVideoRepoImp(appSessions: urlSessions, secureSession: secureSession))
    }

    static func main() async {
        let app = APIConsole()
        LogKit.print("No user authorization added to", "\(SecureConst.BASE_TOKEN)")

        await app.auth.login(
            body: LoginRequest(
                email: SecureConst.email, password: SecureConst.password
            )
        ) { res in
            print("✅ Login success:")
        } failed: { msg in
            print("Login failed:", msg)
        }
    }
}
