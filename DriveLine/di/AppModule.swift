import Foundation
import SwiftUI
import Swinject
import SwiftUISturdy

// https://github.com/couchbase/couchbase-lite-ios.git
// https://github.com/Swinject/Swinject

/** ON APP */


func projectGenerator() -> (Project, AppURLSessions, SecureSessionManager) {
#if DEBUG
    AppConfig.setIsDebuggerAttached(LogKitLevel.all)
#else
    AppConfig.setIsDebuggerAttached(LogKitLevel.off)
#endif
    let modelContainer = createModelContainer()
    
    let swiftData = SwiftDataManager(modelContainer: modelContainer)
    let keychainManager = KeychainManager()
    let secureSession = SecureSessionManager(keychainManager: keychainManager)
    
    let urlSessions = AppURLSessions(
        baseURLSession: URLSession.skipCacheResult, disableCache: URLSession.disableCache, secure: URLSession.secure
    )
    let pro = Project(
        urlSessions: urlSessions,
        pref: PreferenceBase(repository: PrefRepoImp(swiftData: swiftData)),
        auth: AuthBase(repo: AuthRepoImp(appSessions: urlSessions, secureSession: secureSession)),
        aiChat: AiChatBase(repo: AiChatRepoImp(appSessions: urlSessions)),
        fix: FixServiceBase(repo: FixServiceRepoImp(appSessions: urlSessions)),
        course: CourseBase(repo: CourseRepoImp(appSessions: urlSessions)),
        short: ShortVideoBase(repo: ShortVideoRepoImp(appSessions: urlSessions, secureSession: secureSession))
    )
    return (pro, urlSessions, secureSession)
}


func buildContainer() -> Container {
    let container = Container()
    let (pro, urlSessions, secureSession) = projectGenerator()
    let theme = Theme(isDarkMode: ColorScheme.isDarkMode)
    container.register(Project.self) { _  in
        return pro
    }.inObjectScope(.container)
    container.register(AppURLSessions.self) { _  in
        return urlSessions
    }.inObjectScope(.container)
    container.register(SecureSessionManager.self) { _  in
        return secureSession
    }.inObjectScope(.container)
    container.register(Theme.self) { _  in
        return theme
    }.inObjectScope(.container)
    return container
}


final class Resolver {

    @MainActor
    static let shared = Resolver()
    
    //get the IOC container
    private let container = buildContainer()
    
    @MainActor
    func resolve<T>(_ type: T.Type) -> T {
        container.resolve(T.self)!
    }
}

@propertyWrapper
struct Inject<I> {
    let wrappedValue: I
    @MainActor
    init() {
        self.wrappedValue = Resolver.shared.resolve(I.self)
    }
}
