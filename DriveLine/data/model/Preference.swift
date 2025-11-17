//
//  Preference.swift
//  DriveLine
//
//  Created by OmAr Kader on 08/11/2025.
//

import SwiftUISturdy
import CouchbaseLiteSwift
import Foundation

@MainActor
struct PreferenceData: Identifiable, Hashable, Sendable, Equatable {
    let id: String
    let keyString: String
    var value: String
    
    init(id: String, keyString: String, value: String) {
        self.id = id
        self.keyString = keyString
        self.value = value
    }
    
    init(_ pref: Preference) {
        self.id = pref.id
        self.keyString = pref.keyString
        self.value = pref.value
    }
    
    static func == (lhs: PreferenceData, rhs: PreferenceData) -> Bool {
        lhs.id == rhs.id && lhs.keyString == rhs.keyString
    }
}

@BackgroundActor
struct Preference: Codable {
    let id: String
    let keyString: String
    var value: String
    
    init(id: String = "pref::\(Date().timeIntervalSince1970 * 1000)", keyString: String, value: String) {
        self.id = id
        self.keyString = keyString
        self.value = value
    }
    
    func toDocument() -> MutableDocument {
        let doc = MutableDocument(id: id)
        doc.setString(keyString, forKey: Preference.CodingKeys.keyString.rawValue)
        doc.setString(value, forKey: Preference.CodingKeys.value.rawValue)
        return doc
    }
    
    static func fromDocument(_ doc: Document) -> Preference {
        return Preference(
            id: doc.id,
            keyString: doc.string(forKey: CodingKeys.keyString.rawValue) ?? "",
            value: doc.string(forKey: CodingKeys.value.rawValue) ?? ""
        )
    }
    
    enum CodingKeys: String, CodingKey {
        case id
        case keyString
        case value
    }
}
