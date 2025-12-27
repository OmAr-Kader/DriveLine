import Foundation
import SwiftUI
import Swinject
import SwiftUISturdy

// https://github.com/couchbase/couchbase-lite-ios.git
// https://github.com/Swinject/Swinject

/** ON APP */


struct AppURLSessions : Sendable {
    let baseURLSession: URLSession
    let noCache: URLSession
    let secure: URLSession
}

struct Project : Sendable {
    let urlSessions: AppURLSessions
    let pref: PreferenceBase
    let auth: AuthBase
    let aiChat: AiChatBase
    let fix: FixServiceBase
    let course: CourseBase
    let short: ShortVideoBase
}

func buildContainer() -> Container {
    let container = Container()
    let modelContainer = createModelContainer()
    let swiftData = SwiftDataManager(modelContainer: modelContainer)
    
    let urlSessions = AppURLSessions(
        baseURLSession: URLSession.customSession(), noCache: URLSession.api, secure: URLSession.secure()
    )
    let pro = Project(
        urlSessions: urlSessions,
        pref: PreferenceBase(repository: PrefRepoImp(swiftData: swiftData)),
        auth: AuthBase(repo: AuthRepoImp(appSessions: urlSessions)),
        aiChat: AiChatBase(repo: AiChatRepoImp(appSessions: urlSessions)),
        fix: FixServiceBase(repo: FixServiceRepoImp(appSessions: urlSessions)),
        course: CourseBase(repo: CourseRepoImp(appSessions: urlSessions)),
        short: ShortVideoBase(repo: ShortVideoRepoImp(appSessions: urlSessions))
    )
    let theme = Theme(isDarkMode: UITraitCollection.current.userInterfaceStyle.isDarkMode)
    container.register(Project.self) { _  in
        return pro
    }.inObjectScope(.container)
    container.register(AppURLSessions.self) { _  in
        return urlSessions
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
