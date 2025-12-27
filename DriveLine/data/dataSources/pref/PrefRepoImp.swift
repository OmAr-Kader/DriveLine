import Foundation
import SwiftData
import Combine
import SwiftUISturdy

final class PrefRepoImp : PrefRepo, Sendable {
    
    private let swiftData: SwiftDataManager?
    
    init(swiftData: SwiftDataManager?) {
        self.swiftData = swiftData
    }
    
    @BackgroundActor
    func prefs() async -> [Preference] {
        return (try? await swiftData?.fetch(Preference.self, predicate: nil, sortBy: [SortDescriptor<Preference>(\.updatedAt, order: .reverse)])) ?? []
    }
    
    @MainActor
    func observePrefs(invoke: @escaping @Sendable @BackgroundActor ([Preference]) -> Void) ->  AnyCancellable? {
        TaskBackSwitcher {
            let list = await self.prefs()
            invoke(list)
        }
        return swiftData?.publisher(for: Preference.self)
            .receive(on: DispatchQueue.main)
            .sink { [weak self] event in
                guard let self = self else { return }
                TaskBackSwitcher {
                    let list = await self.prefs()
                    invoke(list)
                }
            }
    }
    
    @BackgroundActor
    func upsertPref(_ pref: Preference) async -> Preference? {
        LogKit.print("Upserting pref with key: \(pref.keyString) and value: \(pref.value)")
        return (try? await swiftData?.upsert([pref], matchingKeyPath: \.keyString) { existing, new in
            existing.value = new.value
            existing.updatedAt = Date()
        })?.first
    }
    
    @BackgroundActor
    func upsertPref(_ prefs: [Preference]) async -> [Preference]? {
        return (try? await swiftData?.upsert(prefs, matchingKeyPath: \.keyString) { existing, new in
            existing.value = new.value
            existing.updatedAt = Date()
        })
    }
    
    
    @BackgroundActor
    func deletePref(key: String) async -> Int {
        do {
            try await swiftData?.delete(Preference.self, where: \.keyString, equals: key)
            return Const.CLOUD_SUCCESS
        } catch {
            LogKit.print("Error deleting all prefs: \(error)")
            return Const.CLOUD_FAILED
        }
    }
    

    @BackgroundActor
    func deletePrefAll() async -> Int {
        do {
            try await self.swiftData?.deleteAll(Preference.self)
            return Const.CLOUD_SUCCESS
        } catch {
            LogKit.print("Error deleting all prefs: \(error)")
            return Const.CLOUD_FAILED
        }
    }
}
