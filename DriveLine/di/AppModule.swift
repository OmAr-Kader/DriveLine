import Foundation
import SwiftUI
import Swinject
import SwiftUISturdy

// https://github.com/couchbase/couchbase-lite-ios.git
// https://github.com/Swinject/Swinject

/** ON APP */

struct Project : Sendable {
    let pref: PreferenceBase
}

func buildContainer() -> Container {
    let container = Container()
    
    let pro = Project(
        pref: PreferenceBase(repository: PrefRepoImp(db: try? CouchbaseLocal()))
    )
    let theme = Theme(isDarkMode: UITraitCollection.current.userInterfaceStyle.isDarkMode)
    container.register(Project.self) { _  in
        return pro
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
