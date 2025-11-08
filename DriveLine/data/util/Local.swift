//
//  Local.swift
//  DriveLine
//
//  Created by OmAr Kader on 08/11/2025.
//

import Foundation
import CouchbaseLiteSwift
import SwiftUISturdy

actor CouchbaseLocal : Sendable {
    
    @BackgroundActor
    var database: Database?
    
    
    @BackgroundActor
    var collectionPreferences: Collection {
        get throws {
            if let collection = try database!.collection(name: "preferences") {
                return collection
            } else {
                return try database!.createCollection(name: "preferences")
            }
        }
    }
    
    init() throws {
        Task { @BackgroundActor in
            let directory = FileManager.default.urls(for: .documentDirectory, in: .userDomainMask).first!.appendingPathComponent("CBLLogs").path()
            let fileConfig = CouchbaseLiteSwift.FileLogSink(level: .warning, directory: directory, usePlainText: false, maxKeptFiles: 5, maxFileSize: 1024 * 1024)
            CouchbaseLiteSwift.LogSinks.file = fileConfig
            
            let config = DatabaseConfiguration()
            self.database = try Database(name: "app_db", config: config)
            
            
            // Create index
            if let collection = try? collectionPreferences {
                let index = ValueIndexConfiguration([Preference.CodingKeys.keyString.rawValue])
                try collection.createIndex(withName: "idx_preferences_key", config: index)
            }
        }
    }
    
}

// Just For remove the warring, it safe
extension ListenerToken : @retroactive @unchecked Sendable { }

