import SwiftUISturdy
import SwiftData
import Combine

internal protocol PrefRepo : Sendable {
            
    @BackgroundActor
    func prefs() async -> [Preference]
    
    func observePrefs(invoke: @escaping @Sendable @BackgroundActor ([Preference]) -> Void) ->  AnyCancellable?

    @BackgroundActor
    func upsertPref(_ pref: Preference) async -> Preference?
    
    @BackgroundActor
    func upsertPref(_ prefs: [Preference]) async -> [Preference]?
    
    @BackgroundActor
    func deletePref(key: String) async -> Int
    
    @BackgroundActor
    func deletePrefAll() async -> Int
    
}
