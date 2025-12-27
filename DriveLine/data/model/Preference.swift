//
//  Preference.swift
//  DriveLine
//
//  Created by OmAr Kader on 08/11/2025.
//

import SwiftUISturdy
import Foundation
import SwiftData


@Model
final class Preference {
    
    
    @Attribute(.unique) var id: UUID
    var keyString: String
    var value: String
    
    var createdAt: Date
    var updatedAt: Date
    
    init(id: UUID = .init(), keyString: String, value: String, createdAt: Date = .now, updatedAt: Date = .now) {
        self.id = id
        self.keyString = keyString
        self.value = value
        self.createdAt = createdAt
        self.updatedAt = updatedAt
    }

}

@BackgroundActor
public struct PreferenceData: Sendable, Identifiable {
    public let id: UUID
    var keyString: String
    var value: String
    
    var createdAt: Date
    var updatedAt: Date
    
    init(from pref: Preference) {
        self.id = pref.id
        self.keyString = pref.keyString
        self.value = pref.value
        self.createdAt = pref.createdAt
        self.updatedAt = pref.updatedAt
    }
}



public protocol DTOConvertible {
    associatedtype DTO: Sendable
    @BackgroundActor
    func toDTO() -> DTO
}

extension Preference: DTOConvertible {
    func toDTO() -> PreferenceData {
        PreferenceData(from: self)
    }
}
