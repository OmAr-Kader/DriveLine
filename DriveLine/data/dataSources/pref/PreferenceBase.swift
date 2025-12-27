import SwiftUISturdy
import SwiftData
import Combine

final class PreferenceBase : Sendable {
    
    private let repository: PrefRepo
    
    init(repository: PrefRepo) {
        self.repository = repository
    }
    
    @BackgroundActor
    func prefs() async -> [PreferenceData] {
        await repository.prefs().map { it in
            PreferenceData(from: it)
        }
    }
    
    @MainActor
    func observePrefs(invoke: @escaping @Sendable @BackgroundActor ([Preference]) -> Void) ->  AnyCancellable? {
        return repository.observePrefs(invoke: invoke)
    }
  
    @BackgroundActor
    func upsertPref(_ prefs: Preference) async -> Preference?  {
        return await repository.upsertPref(prefs)
    }
    
    @BackgroundActor
    func upsertPref(_ prefs: [Preference]) async -> [Preference]?  {
        return await repository.upsertPref(prefs)
    }
    
    @BackgroundActor
    func deletePref(key: String) async -> Int {
        return await repository.deletePref(key: key)
    }
    
    @BackgroundActor
    func deletePrefAll() async -> Int {
        return await repository.deletePrefAll()
    }
}
