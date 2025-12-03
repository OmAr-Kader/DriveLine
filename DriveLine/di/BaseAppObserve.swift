import Foundation
import SwiftUI
import Observation
import SwiftUISturdy
import SwiftUIMacroSturdy
import CouchbaseLiteSwift

@Observable
final class BaseAppObserve: BaseObserver {
    
    @MainActor
    private(set) var state: AppObserveState = AppObserveState()
    
    private var prefsTask: Task<Void, Error>? = nil
    
    @BackgroundActor
    private var sinkPrefs: ListenerToken? = nil

    init() {
        @Inject
        var pro: Project
        super.init(project: pro)
        prefsTask?.cancel()
        prefsTask = tasker.backSync { [weak self] in
            self?.sinkPrefs?.remove()
            self?.project.pref.prefs { list in
                self?.mainSync {
                    self?.refreshPreferences(list.map({ PreferenceData($0) }))
                }
            } fetchToken: { token in
                self?.sinkPrefs = token
            } onFailed: { _ in
                
            }
        }
    }
    
    @MainActor
    func refreshPreferences(_ list: [PreferenceData]) {
        let userBase = fetchUserBase(list)
        self.state = self.state.copy(preferences: .set(list), userBase: .set(userBase))
    }
    
    private func inti(invoke: @BackgroundActor @escaping ([Preference]) async -> Void) {
        tasker.backSync {
            await invoke(await self.project.pref.prefs())
        }
    }
    
    @BackgroundActor
    private func intiBack(invoke: @BackgroundActor @escaping ([Preference]) async -> Void) async {
        await invoke(await self.project.pref.prefs())
    }

    @MainActor
    func findUserBase(
        invoke: @escaping @MainActor (UserBase?) -> Void
    ) {
        if (self.state.preferences.isEmpty) {
            self.inti { it in
                let userBase = await self.fetchUserBase(it)
                self.mainSync {
                    it.forEach { pref in
                        LogKit.print(pref.keyString, pref.value)
                    }
                    let list = it.map({ PreferenceData($0) })
                    self.state = self.state.copy(preferences: .set(list), userBase: .set(userBase))
                    invoke(userBase)
                }
            }
        } else {
            let list = self.state.preferences
            self.tasker.back {
                let userBase = await self.fetchUserBase(list)
                self.mainSync {
                    invoke(userBase)
                }
            }
        }
    }
    
    private func fetchUserBase(_ list: [PreferenceData]) -> UserBase? {
        let id = list.last { it in it.keyString == Const.PREF_USER_ID }?.value
        let name = list.last { it in it.keyString == Const.PREF_USER_NAME }?.value
        let email = list.last { it in it.keyString == Const.PREF_USER_EMAIL }?.value
        let userType = list.last { it in it.keyString == Const.PREF_USER_TYPE }?.value
        let token = list.last { it in it.keyString == Const.PREF_USER_TOKEN }?.value
        guard let id, let name, let email, let userType, let token else { return nil }
        return UserBase(id: id, name: name, email: email, accountType: userType, token: token)
    }
    
    private func fetchUserBase(_ list: [Preference]) -> UserBase? {
        let id = list.last { it in it.keyString == Const.PREF_USER_ID }?.value
        let name = list.last { it in it.keyString == Const.PREF_USER_NAME }?.value
        let email = list.last { it in it.keyString == Const.PREF_USER_EMAIL }?.value
        let userType = list.last { it in it.keyString == Const.PREF_USER_TYPE }?.value
        let token = list.last { it in it.keyString == Const.PREF_USER_TOKEN }?.value
        guard let id, let name, let email, let userType, let token else { return nil }
        return UserBase(id: id, name: name, email: email, accountType: userType, token: token)
    }

    func updateUserBase(userBase: UserBase, invoke: @escaping @MainActor () -> Void) {
        tasker.backSync {
            var list : [Preference] = []
            list.append(Preference(keyString: Const.PREF_USER_ID, value: userBase.id))
            list.append(Preference(keyString: Const.PREF_USER_NAME, value: userBase.name))
            list.append(Preference(keyString: Const.PREF_USER_EMAIL, value: userBase.email))
            list.append(Preference(keyString: Const.PREF_USER_TYPE, value: userBase.accountType))
            list.append(Preference(keyString: Const.PREF_USER_TOKEN, value: userBase.token))
            let _ = await self.project.pref.updatePref(list)
            await self.inti { it in
                self.mainSync {
                    let list = it.map({ PreferenceData($0) })
                    self.state = self.state.copy(preferences: .set(list))
                    invoke()
                }
            }
        }
    }
    
    func updateUserBase(name: String, email: String, invoke: @escaping @MainActor () -> Void) {
        tasker.backSync {
            var list : [Preference] = []
            list.append(Preference(keyString: Const.PREF_USER_NAME, value: name))
            list.append(Preference(keyString: Const.PREF_USER_EMAIL, value: email))
            let _ = await self.project.pref.updatePref(list)
            await self.inti { it in
                self.mainSync {
                    let list = it.map({ PreferenceData($0) })
                    self.state = self.state.copy(preferences: .set(list))
                    invoke()
                }
            }
        }
    }

    func findPrefString(
        key: String,
        value: @MainActor @escaping (String?) -> Void
    ) {
        if (self.state.preferences.isEmpty) {
            inti { it in
                let preference = it.first { it1 in it1.keyString == key }?.value
                self.mainSync {
                    let list = it.map({ PreferenceData($0) })
                    self.state = self.state.copy(preferences: .set(list))
                    value(preference)
                }
            }
        } else {
            let preference = self.state.preferences.first { it1 in it1.keyString == key }?.value
            self.tasker.mainSync {
                value(preference)
            }
        }
    }
    
    func tempUpdateUser() {
        guard let userBase = state.userBase else { return }
        self.tasker.back {
            await self.project.auth.updateUserById(userBase: userBase, user: UpdateUser(phone: "+201093937621")) { _ in
                
            } failed: { _ in
                
            }

        }
    }
    
    func updatePref(key: String, newValue: String, _ invoke: @MainActor @escaping () -> ()) {
        self.tasker.back {
            _ = await self.project.pref.updatePref(Preference(keyString: key, value: newValue), newValue: newValue)
            self.mainSync {
                invoke()
            }
        }
    }
    
    @MainActor
    func findArg(screen: Screen) -> (any ScreenConfig)? {
        return state.argOf(screen)
    }
    
    @MainActor
    func writeArguments(_ route: Screen,_ screenConfig: ScreenConfig) {
        state = state.copy(route, screenConfig)
    }
    
    @MainActor
    func setForUpdateSessions(_ forUpdateSessions: (newSession: AiSessionData?, needUpdateOnly: Bool)?) {
        state = state.copy(forUpdateSessions: .set(forUpdateSessions))
    }
    
    
    @MainActor
    func setNeedUpdate(_ needUpdate: Bool) {
        state = state.copy(needUpdate: .set(needUpdate))
    }
    
    @MainActor
    func signOut(_ invoke: @escaping @MainActor () -> Void,_ failed: @escaping @MainActor () -> Void) {
        tasker.back {
            let result = await self.project.pref.deletePrefAll()
            if result == Const.CLOUD_SUCCESS {
                self.mainSync {
                    invoke()
                }
            } else {
                self.mainSync {
                    failed()
                }
            }
        }
    }
    
    private func cancelSession() {
        prefsTask?.cancel()
        prefsTask = nil
    }
    
    
    @SturdyCopy
    struct AppObserveState {
        
        private(set) var preferences: [PreferenceData] = []
        private(set) var userBase: UserBase? = nil
        private(set) var forUpdateSessions: (newSession: AiSessionData?, needUpdateOnly: Bool)?
        private(set) var args = [Screen : any ScreenConfig]()

        private(set) var needUpdate: Bool = false
        
        mutating func argOf(_ screen: Screen) -> (any ScreenConfig)? {
            return args.first { (key: Screen, value: any ScreenConfig) in
                key == screen
            }?.value
        }
        
        mutating func copy<T : ScreenConfig>(_ screen: Screen, _ screenConfig: T) -> Self {
            args[screen] = screenConfig
            return self
        }
    }

}


enum HomeTabs: Hashable {
    case home, fix, session, profile, upload
}
