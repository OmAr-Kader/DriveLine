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
                let collection = try database!.createCollection(name: "preferences")
                let index = ValueIndexConfiguration([Preference.CodingKeys.keyString.rawValue])
                try collection.createIndex(withName: "idx_preferences_key", config: index)
                return collection
            }
        }
    }
    
    @BackgroundActor
    var collectionShorts: Collection {
        get throws {
            if let collection = try database!.collection(name: "shorts") {
                return collection
            } else {
                let collection = try database!.createCollection(name: "shorts")
                // Create index
                let index = ValueIndexConfiguration([ShortVideoUser.CodingKeys.id.rawValue])
                try collection.createIndex(withName: "idx_short_video_key", config: index)
                return collection
            }
        }
    }
    
    @BackgroundActor
    func dropCollectionShorts() throws {
        try database?.deleteCollection(name: "shorts")
    }
    
    init() throws {
        Task { @BackgroundActor in
            let directory = FileManager.default.urls(for: .documentDirectory, in: .userDomainMask).first!.appendingPathComponent("CBLLogs").path()
            let fileConfig = CouchbaseLiteSwift.FileLogSink(level: .warning, directory: directory, usePlainText: false, maxKeptFiles: 5, maxFileSize: 1024 * 1024)
            CouchbaseLiteSwift.LogSinks.file = fileConfig
            
            let config = DatabaseConfiguration()
            self.database = try Database(name: "app_db", config: config)
        }
    }
    
}

// Just For remove the warring, it safe
extension ListenerToken : @retroactive @unchecked Sendable { }


extension ArrayObject {
    
    @BackgroundActor
    func toIntArray() -> [Int] {
        var arr = [Int]()
        for i in 0..<self.count {
            arr.append(self.int(at: i))
        }
        return arr
    }
}
