//
//  Authorization.swift
//  DriveLine
//
//  Created by OmAr Kader on 08/11/2025.
//

import Foundation
import SwiftUISturdy

@BackgroundActor
struct RegisterRequest: Codable, Sendable {
    let name: String
    let email: String
    let phone: String
    let role: String
    let password: String
}

@BackgroundActor
struct LoginRequest: Codable, Sendable {
    let email: String
    let password: String
}

@BackgroundActor
struct LoginResponse: Codable, Sendable {
    let message: String
    let token: String
    let user: User
}

@BackgroundActor
struct User: Codable, Sendable {
    let id: String
    let name: String
    let email: String
    let role: String
    let age: Int?
    let image: String?
    let location: UserLocation?

    init(id: String, name: String, email: String, role: String, age: Int?, image: String?, location: UserLocation?) {
        self.id = id
        self.name = name
        self.email = email
        self.role = role
        self.age = age
        self.image = image
        self.location = location
    }
    init(from decoder: any Decoder) throws {
        let container = try decoder.container(keyedBy: CodingKeys.self)
        self.id = try container.decode(String.self, forKey: .id)
        self.name = try container.decode(String.self, forKey: .name)
        self.email = try container.decode(String.self, forKey: .email)
        self.role = try container.decode(String.self, forKey: .role)
        self.age = try container.decodeIfPresent(Int.self, forKey: .age)
        self.image = try container.decodeIfPresent(String.self, forKey: .image)
        self.location = try container.decodeIfPresent(UserLocation.self, forKey: .location)
    }
    
    init(userBase: UserBase, userEdit: UserEdit) {
        self.id = userBase.id
        self.name = userEdit.name
        self.email = userBase.email
        self.role = userBase.accountType
        self.age = userEdit.age
        self.image = userEdit.image
        self.location = UserLocation(city: userEdit.city, unit: userEdit.unit, street: userEdit.street, building: userEdit.building)
    }
    
    enum CodingKeys: String, CodingKey {
        case id = "_id"
        case name
        case email
        case role
        case age
        case image
        case location
    }
}


@BackgroundActor
struct UserLocation: Codable, Sendable {
    let city: String?
    let unit: String?
    let street: String?
    let building: String?
    
}

@MainActor
struct UserEdit: Sendable, Identifiable {
    
    var id: String {
        name + "\(age ?? 0)" + (city ?? "") + (street ?? "") + (building ?? "") + (unit ?? "")
    }
    
    var name: String
    var age: Int?
    var city: String?
    var street: String?
    var building: String?
    var unit: String?
    var image: String?
    
    init(name: String, age: Int? = nil, city: String? = nil, street: String? = nil, building: String? = nil, unit: String? = nil, image: String? = nil) {
        self.name = name
        self.age = age
        self.city = city
        self.street = street
        self.building = building
        self.unit = unit
        self.image = image
    }
    
    init(user: User) {
        self.name = user.name
        self.age = user.age
        self.city = user.location?.city
        self.street = user.location?.street
        self.building = user.location?.building
        self.unit = user.location?.unit
        self.image = user.image
    }
    
    @MainActor
    mutating func copy(
        name: Update<String> = .keep,
        age: Update<Int> = .keep,
        city: Update<String> = .keep,
        street: Update<String> = .keep,
        building: Update<String> = .keep,
        unit: Update<String> = .keep,
        image: Update<String> = .keep,
    ) -> Self {
        if case .set(let value) = name { self.name = value }
        if case .set(let value) = age { self.age = value }
        if case .set(let value) = city { self.city = value }
        if case .set(let value) = street { self.street = value }
        if case .set(let value) = building { self.building = value }
        if case .set(let value) = unit { self.unit = value }
        if case .set(let value) = image { self.image = value }
        return self
    }
}
