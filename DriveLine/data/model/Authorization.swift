//
//  Authorization.swift
//  DriveLine
//
//  Created by OmAr Kader on 08/11/2025.
//

import Foundation
import SwiftUISturdy
import SwiftUIMacroSturdy

@BackgroundActor
struct RegisterRequest: Codable, Sendable {
    let name: String
    let email: String
    let phone: String
    let role: String
    let password: String
}

@BackgroundActor
struct ShakeHandsRequest: Codable, Sendable {
    let publicKey: String
}

@BackgroundActor
struct ShakeHandsResponse: Codable, Sendable {
    let serverPublicKey: String
    let status: String
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
struct UpdateUser: Codable, Sendable {
    let name: String?
    let phone: String?
    let role: String?
    let age: Int?
    let image: String?
    let location: UserLocation?

    init(name: String? = nil, phone: String? = nil, role: String? = nil, age: Int? = nil, image: String? = nil, location: UserLocation? = nil) {
        self.name = name
        self.phone = phone
        self.role = role
        self.age = age
        self.image = image
        self.location = location
    }
    init(from decoder: any Decoder) throws {
        let container = try decoder.container(keyedBy: CodingKeys.self)
        self.name = try container.decodeIfPresent(String.self, forKey: .name)
        self.phone = try container.decodeIfPresent(String.self, forKey: .phone)
        self.role = try container.decodeIfPresent(String.self, forKey: .role)
        self.age = try container.decodeIfPresent(Int.self, forKey: .age)
        self.image = try container.decodeIfPresent(String.self, forKey: .image)
        self.location = try container.decodeIfPresent(UserLocation.self, forKey: .location)
    }
    
    func encode(to encoder: any Encoder) throws {
        var container = encoder.container(keyedBy: CodingKeys.self)
        try container.encodeIfPresent(name, forKey: .name)
        try container.encodeIfPresent(phone, forKey: .phone)
        try container.encodeIfPresent(role, forKey: .role)
        try container.encodeIfPresent(age, forKey: .age)
        try container.encodeIfPresent(image, forKey: .image)
        try container.encodeIfPresent(location, forKey: .location)
    }
    
    init(userBase: UserBase, userEdit: UserEdit) {
        self.name = userEdit.name
        self.phone = userEdit.phone
        self.role = userBase.accountType
        self.age = userEdit.age
        self.image = userEdit.image
        self.location = UserLocation(city: userEdit.city, unit: userEdit.unit, street: userEdit.street, building: userEdit.building)
    }
    
    enum CodingKeys: String, CodingKey {
        case name
        case phone
        case role
        case age
        case image
        case location
    }

    
}

@BackgroundActor
struct GetProfileResponse: Codable, Sendable {
    let profile: Profile
}

@BackgroundActor
struct Profile: Codable, Sendable {
    let user: User
    let services: [ProvideServiceRequest]
    let courses: [ProvideCourseRequest]
    let shorts: [ShortVideo]
    
    init(from decoder: any Decoder) throws {
        let container = try decoder.container(keyedBy: CodingKeys.self)
        self.user = try container.decode(User.self, forKey: .user)
        self.services = try container.decode([ProvideServiceRequest].self, forKey: .services)
        self.courses = try container.decode([ProvideCourseRequest].self, forKey: .courses)
        self.shorts = try container.decode([ShortVideo].self, forKey: .shorts)
    }
}

@BackgroundActor
struct User: Codable, Sendable {
    let id: String
    let name: String
    let email: String
    let phone: String
    let role: String
    let age: Int?
    let image: String?
    let location: UserLocation?

    init(id: String, name: String, email: String, phone: String, role: String, age: Int?, image: String?, location: UserLocation?) {
        self.id = id
        self.name = name
        self.email = email
        self.phone = phone
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
        self.phone = try container.decode(String.self, forKey: .phone)
        self.role = try container.decode(String.self, forKey: .role)
        self.age = try container.decodeIfPresent(Int.self, forKey: .age)
        self.image = try container.decodeIfPresent(String.self, forKey: .image)
        self.location = try container.decodeIfPresent(UserLocation.self, forKey: .location)
    }
    
    init(userBase: UserBase, userEdit: UserEdit) {
        self.id = userBase.id
        self.name = userEdit.name
        self.email = userBase.email
        self.phone = userEdit.phone
        self.role = userBase.accountType
        self.age = userEdit.age
        self.image = userEdit.image
        self.location = UserLocation(city: userEdit.city, unit: userEdit.unit, street: userEdit.street, building: userEdit.building)
    }
    
    enum CodingKeys: String, CodingKey {
        case id
        case name
        case email
        case role
        case phone
        case age
        case image
        case location
    }
}


@BackgroundActor
struct UserLocation: Codable, Sendable, Hashable {
    let city: String?
    let unit: String?
    let street: String?
    let building: String?
    
}

@MainActor
@SturdyCopy
struct UserEdit: Sendable, Identifiable {
    
    @NoCopy
    var id: String {
        "\(name)\(age ?? 0)\(city ?? "")\(street ?? "")\(building ?? "")\(unit ?? "")"
    }
    
    var name: String
    var phone: String
    var age: Int?
    var city: String?
    var street: String?
    var building: String?
    var unit: String?
    var image: String?
    
    init(name: String, phone: String, age: Int? = nil, city: String? = nil, street: String? = nil, building: String? = nil, unit: String? = nil, image: String? = nil) {
        self.name = name
        self.phone = phone
        self.age = age
        self.city = city
        self.street = street
        self.building = building
        self.unit = unit
        self.image = image
    }
    
    init(user: User) {
        self.name = user.name
        self.phone = user.phone
        self.age = user.age
        self.city = user.location?.city
        self.street = user.location?.street
        self.building = user.location?.building
        self.unit = user.location?.unit
        self.image = user.image
    }
    
}
