//
//  Local.swift
//  DriveLine
//
//  Created by OmAr Kader on 08/11/2025.
//

import Foundation
import SwiftData
import SwiftUISturdy

public struct PersistentStoreConfiguration {
    public enum StorageType {
        case sqlite(url: URL)
        case inMemory
    }
    let type: StorageType
    
    public static func defaultStore() -> PersistentStoreConfiguration {
        // Default to Application Support / SQLite
        let fm = FileManager.default
        let appSupport = try? fm.url(for: .applicationSupportDirectory, in: .userDomainMask, appropriateFor: nil, create: true)
        let directory = appSupport ?? fm.temporaryDirectory
        let dbURL = directory.appendingPathComponent("SwiftData.sqlite")
        return PersistentStoreConfiguration(type: .sqlite(url: dbURL))
    }
    
    // Internal convenience mapping to SwiftData's ModelPersistentStoreConfiguration depending on API shape.
    // NOTE: The exact initializer names may vary across SDK versions; adapt to your SDK.
    var underlying: ModelPersistentStoreConfiguration {
        switch type {
        case .sqlite(let url):
            return .sql(url: url)
        case .inMemory:
            return .inMemory
        }
    }
}

// MARK: - Extensions: ModelPersistentStoreConfiguration shim
//
// SwiftData public API surface may vary across SDK versions. If your SDK uses a different initializer
// or name for store description, update these shims to match the SDK.
//
// The code below assumes a convenience enum/initializers exist (these are placeholders to illustrate).
// Replace with actual initializers from your SDK (e.g., .sqlite(path:), .inMemory, PersistentStoreConfiguration).
//
public struct ModelPersistentStoreConfiguration {
    fileprivate enum Kind {
        case sqlite(URL)
        case inMemory
    }
    fileprivate let kind: Kind
    
    fileprivate static func sql(url: URL) -> ModelPersistentStoreConfiguration {
        ModelPersistentStoreConfiguration(kind: .sqlite(url))
    }
    
    fileprivate static var inMemory: ModelPersistentStoreConfiguration {
        ModelPersistentStoreConfiguration(kind: .inMemory)
    }
}


func createModelContainer() -> ModelContainer? {
    do {
        let schema = Schema([Preference.self])
        let configuration = ModelConfiguration(
            schema: schema,
            isStoredInMemoryOnly: false,
            allowsSave: true
        )
        let modelContainer = try ModelContainer(
            for: schema,
            configurations: [configuration]
        )
        
        return modelContainer
    } catch {
        LogKit.print("Failed to initialize ModelContainer: \(error)")
        return nil
    }
}
