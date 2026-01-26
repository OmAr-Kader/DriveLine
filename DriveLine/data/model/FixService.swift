//
//  FixService.swift
//  DriveLine
//
//  Created by OmAr Kader on 13/11/2025.
//

import SwiftUI
import Foundation
import SwiftUISturdy

@BackgroundActor
struct ProvideServiceRequestRootRespond: Codable {
    let data: [ProvideServiceRequest]
    
    init(from decoder: Decoder) throws {
        let container = try decoder.container(keyedBy: CodingKeys.self)
        
        // Attempt to decode as array, filter out invalid items
        self.data = (try? container.decode([FailableDecodable<ProvideServiceRequest>].self, forKey: .data))?
            .compactMap { $0.value } ?? []
    }
}

@BackgroundActor
struct ProvideServiceRequest: Codable {
    let id: String
    let techId: String
    let serviceAdminId: Int
    let description: String
    let price: String
    let currency: String
    let durationMinutes: Int
    let isActive: Bool
    let images: [String]?
    let monday: AvailabilityIntervalNullable?
    let tuesday: AvailabilityIntervalNullable?
    let wednesday: AvailabilityIntervalNullable?
    let thursday: AvailabilityIntervalNullable?
    let friday: AvailabilityIntervalNullable?
    let saturday: AvailabilityIntervalNullable?
    let sunday: AvailabilityIntervalNullable?
    
    init(data: ProvideServiceData) {
        self.init(techId: data.techId, serviceAdminId: data.serviceAdminId, description: data.description, price: data.price, currency: data.currency, durationMinutes: data.durationMinutes, images: data.images, monday: data.monday, tuesday: data.tuesday, wednesday: data.wednesday, thursday: data.thursday, friday: data.friday, saturday: data.saturday, sunday: data.sunday)
    }
    
    init(techId: String, serviceAdminId: Int, description: String, price: String, currency: String, durationMinutes: Int, images: [String]?, monday: AvailabilityInterval?, tuesday: AvailabilityInterval?, wednesday: AvailabilityInterval?, thursday: AvailabilityInterval?, friday: AvailabilityInterval?, saturday: AvailabilityInterval?, sunday: AvailabilityInterval?) {
        self.id = ""
        self.techId = techId
        self.serviceAdminId = serviceAdminId
        self.description = description
        self.price = price
        self.currency = currency
        self.durationMinutes = durationMinutes
        self.isActive = monday != nil || tuesday != nil || wednesday != nil || thursday != nil || friday != nil || saturday != nil || sunday != nil
        self.images = images
        if let mon = monday {
            self.monday = AvailabilityIntervalNullable(startUTC: mon.startUTC, endUTC: mon.endUTC, dayOff: mon.dayOff)
        } else {
            self.monday = nil
        }
        if let tue = tuesday {
            self.tuesday = AvailabilityIntervalNullable(startUTC: tue.startUTC, endUTC: tue.endUTC, dayOff: tue.dayOff)
        } else {
            self.tuesday = nil
        }
        if let wed = wednesday {
            self.wednesday = AvailabilityIntervalNullable(startUTC: wed.startUTC, endUTC: wed.endUTC, dayOff: wed.dayOff)
        } else {
            self.wednesday = nil
        }
        if let thu = thursday {
            self.thursday = AvailabilityIntervalNullable(startUTC: thu.startUTC, endUTC: thu.endUTC, dayOff: thu.dayOff)
        } else {
            self.thursday = nil
        }
        if let fri = friday {
            self.friday = AvailabilityIntervalNullable(startUTC: fri.startUTC, endUTC: fri.endUTC, dayOff: fri.dayOff)
        } else {
            self.friday = nil
        }
        if let sat = saturday {
            self.saturday = AvailabilityIntervalNullable(startUTC: sat.startUTC, endUTC: sat.endUTC, dayOff: sat.dayOff)
        } else {
            self.saturday = nil
        }
        if let sun = sunday {
            self.sunday = AvailabilityIntervalNullable(startUTC: sun.startUTC, endUTC: sun.endUTC, dayOff: sun.dayOff)
        } else {
            self.sunday = nil
        }
    }
    
    func encode(to encoder: Encoder) throws {
        var container = encoder.container(keyedBy: CodingKeys.self)
        
        try container.encode(techId, forKey: .techId)
        try container.encode(serviceAdminId, forKey: .serviceAdminId)
        try container.encode(description, forKey: .description)
        try container.encode(price, forKey: .price)
        try container.encode(currency, forKey: .currency)
        try container.encode(durationMinutes, forKey: .durationMinutes)
        try container.encode(isActive, forKey: .isActive)
        
        // Optional properties
        try container.encodeIfPresent(images, forKey: .images)
        try container.encodeIfPresent(monday, forKey: .monday)
        try container.encodeIfPresent(tuesday, forKey: .tuesday)
        try container.encodeIfPresent(wednesday, forKey: .wednesday)
        try container.encodeIfPresent(thursday, forKey: .thursday)
        try container.encodeIfPresent(friday, forKey: .friday)
        try container.encodeIfPresent(saturday, forKey: .saturday)
        try container.encodeIfPresent(sunday, forKey: .sunday)
    }
    

}

@BackgroundActor
struct UpdateProvidedServiceRequest: Codable {
    let description: String?
    let price: String?
    let currency: String?
    let durationMinutes: Int?
    let images: [String]?
    let isActive: Bool?// false of all days nil
    let monday: AvailabilityInterval?
    let tuesday: AvailabilityInterval?
    let wednesday: AvailabilityInterval?
    let thursday: AvailabilityInterval?
    let friday: AvailabilityInterval?
    let saturday: AvailabilityInterval?
    let sunday: AvailabilityInterval?
    
    init(description: String? = nil, price: String? = nil, currency: String? = nil, durationMinutes: Int? = nil, images: [String]? = nil, monday: AvailabilityInterval? = nil, tuesday: AvailabilityInterval?, wednesday: AvailabilityInterval?, thursday: AvailabilityInterval?, friday: AvailabilityInterval?, saturday: AvailabilityInterval?, sunday: AvailabilityInterval?) {
        self.description = description
        self.price = price
        self.currency = currency
        self.durationMinutes = durationMinutes
        self.images = images
        self.isActive = monday != nil || tuesday != nil || wednesday != nil || thursday != nil || friday != nil || saturday != nil || sunday != nil
        self.monday = monday
        self.tuesday = tuesday
        self.wednesday = wednesday
        self.thursday = thursday
        self.friday = friday
        self.saturday = saturday
        self.sunday = sunday
    }
    
    
    init(original: ProvideServiceData, description: String? = nil, price: String?, currency: String?, durationMinutes: Int?, images: [String]?, isActive: Bool, monday: AvailabilityInterval?, tuesday: AvailabilityInterval?, wednesday: AvailabilityInterval?, thursday: AvailabilityInterval?, friday: AvailabilityInterval?, saturday: AvailabilityInterval?, sunday: AvailabilityInterval?) {
        self.description = if original.description == description {
            nil
        } else {
            description
        }
        self.price = if original.price == price {
            nil
        } else {
            price
        }
        self.currency = if original.currency == currency {
            nil
        } else {
            currency
        }

        self.durationMinutes = if original.durationMinutes == durationMinutes {
            nil
        } else {
            durationMinutes
        }
        self.images = if original.images == images {
            nil
        } else {
            images
        }
        self.isActive = if original.isActive == isActive {
            nil
        } else {
            isActive
        }
        self.monday = if original.monday?.startUTC == monday?.startUTC && original.monday?.endUTC == monday?.endUTC {
            nil
        } else {
            monday
        }
        self.tuesday = if original.tuesday?.startUTC == tuesday?.startUTC && original.tuesday?.endUTC == tuesday?.endUTC {
            nil
        } else {
            tuesday
        }
        self.wednesday = if original.wednesday?.startUTC == wednesday?.startUTC && original.wednesday?.endUTC == wednesday?.endUTC {
            nil
        } else {
            wednesday
        }
        self.thursday = if original.thursday?.startUTC == thursday?.startUTC && original.thursday?.endUTC == thursday?.endUTC {
            nil
        } else {
            thursday
        }
        self.friday = if original.friday?.startUTC == friday?.startUTC && original.friday?.endUTC == friday?.endUTC {
            nil
        } else {
            friday
        }
        self.saturday = if original.saturday?.startUTC == saturday?.startUTC && original.saturday?.endUTC == saturday?.endUTC {
            nil
        } else {
            saturday
        }
        self.sunday = if original.sunday?.startUTC == sunday?.startUTC && original.sunday?.endUTC == sunday?.endUTC {
            nil
        } else {
            sunday
        }
    }
    
}


//=>////////////////////////////////////////////////

@BackgroundActor
struct GetAServiceRootRespond: Codable {
    let data: [GetAServiceRespond]
    init(from decoder: Decoder) throws {
        let container = try decoder.container(keyedBy: CodingKeys.self)
        
        // Attempt to decode as array, filter out invalid items
        self.data = (try? container.decode([FailableDecodable<GetAServiceRespond>].self, forKey: .data))?
            .compactMap { $0.value } ?? []
    }
}

@BackgroundActor
struct GetAServiceRespond: Codable {
    let id: String
    let tech: Tech
    let serviceAdminId: Int
    let description: String
    let price: String
    let currency: String
    let durationMinutes: Int
    let images: [String]?
    let isActive: Bool
    let monday: AvailabilityIntervalNullable?
    let tuesday: AvailabilityIntervalNullable?
    let wednesday: AvailabilityIntervalNullable?
    let thursday: AvailabilityIntervalNullable?
    let friday: AvailabilityIntervalNullable?
    let saturday: AvailabilityIntervalNullable?
    let sunday: AvailabilityIntervalNullable?
    
    struct Tech : Codable {
        let id: String
        let name: String
        let email: String
        let phone: String
        let age: Int?
        let image: String?
        let location: UserLocation?
        enum CodingKeys: String, CodingKey {
            case id
            case name
            case email
            case phone
            case age
            case image
            case location
        }
        
        
        init(id: String, name: String, email: String, phone: String, age: Int?, image: String?, location: UserLocation?) {
            self.id = id
            self.name = name
            self.email = email
            self.phone = phone
            self.age = age
            self.image = image
            self.location = location
        }
        
        init(data: GetAServiceData.Tech) {
            self.id = data.id
            self.name = data.name
            self.email = data.email
            self.phone = data.phone
            self.age = data.age
            self.image = data.image
            self.location = data.location
        }
    }

    enum CodingKeys: String, CodingKey {
        case id
        case tech
        case serviceAdminId
        case description
        case price
        case currency
        case durationMinutes
        case isActive
        case images
        case monday
        case tuesday
        case wednesday
        case thursday
        case friday
        case saturday
        case sunday
    }
}

struct AvailabilityInterval: Codable, Hashable, Sendable {
    var startUTC: Int
    var endUTC: Int
    var dayOff: Bool
}

struct AvailabilityIntervalNullable: Codable, Hashable, Sendable {
    var startUTC: Int?
    var endUTC: Int?
    var dayOff: Bool?
}

//=>////////////////////////////////////////////////

@MainActor
struct ProfileServiceData: Identifiable, Sendable, Hashable {
    let service: ProvideServiceData
    let fix: FixService
    var id: String {
        "\(fix.adminId)" + service.id + service.price + service.currency + "\(service.durationMinutes)" + service.description
    }
}

@MainActor
struct ProvideServiceData: Identifiable, Sendable, Hashable {
    let _id: String
    let techId: String
    let serviceAdminId: Int
    let description: String
    let price: String
    let currency: String
    let durationMinutes: Int
    let isActive: Bool// false of all days nil
    let images: [String]?
    let monday: AvailabilityInterval?
    let tuesday: AvailabilityInterval?
    let wednesday: AvailabilityInterval?
    let thursday: AvailabilityInterval?
    let friday: AvailabilityInterval?
    let saturday: AvailabilityInterval?
    let sunday: AvailabilityInterval?
    
    var id: String {
        "\(techId)\(serviceAdminId)\(price)\(description)"
    }
    
    init(cloud: ProvideServiceRequest) {
        self._id = cloud.id
        self.techId = cloud.techId
        self.serviceAdminId = cloud.serviceAdminId
        self.description = cloud.description
        self.price = cloud.price
        self.currency = cloud.currency
        self.durationMinutes = cloud.durationMinutes
        self.isActive = cloud.isActive
        self.images = cloud.images
        if let mon = cloud.monday, mon.startUTC != nil || mon.endUTC != nil || mon.dayOff != nil {
            self.monday = AvailabilityInterval(startUTC: mon.startUTC ?? 0, endUTC: mon.endUTC ?? 0, dayOff: mon.dayOff ?? false)
        } else {
            self.monday = nil
        }
        if let tue = cloud.tuesday, tue.startUTC != nil || tue.endUTC != nil || tue.dayOff != nil {
            self.tuesday = AvailabilityInterval(startUTC: tue.startUTC ?? 0, endUTC: tue.endUTC ?? 0, dayOff: tue.dayOff ?? false)
        } else {
            self.tuesday = nil
        }
        if let wed = cloud.wednesday, wed.startUTC != nil || wed.endUTC != nil || wed.dayOff != nil {
            self.wednesday = AvailabilityInterval(startUTC: wed.startUTC ?? 0, endUTC: wed.endUTC ?? 0, dayOff: wed.dayOff ?? false)
        } else {
            self.wednesday = nil
        }
        if let thu = cloud.thursday, thu.startUTC != nil || thu.endUTC != nil || thu.dayOff != nil {
            self.thursday = AvailabilityInterval(startUTC: thu.startUTC ?? 0, endUTC: thu.endUTC ?? 0, dayOff: thu.dayOff ?? false)
        } else {
            self.thursday = nil
        }
        if let fri = cloud.friday, fri.startUTC != nil || fri.endUTC != nil || fri.dayOff != nil {
            self.friday = AvailabilityInterval(startUTC: fri.startUTC ?? 0, endUTC: fri.endUTC ?? 0, dayOff: fri.dayOff ?? false)
        } else {
            self.friday = nil
        }
        if let sat = cloud.saturday, sat.startUTC != nil || sat.endUTC != nil || sat.dayOff != nil {
            self.saturday = AvailabilityInterval(startUTC: sat.startUTC ?? 0, endUTC: sat.endUTC ?? 0, dayOff: sat.dayOff ?? false)
        } else {
            self.saturday = nil
        }
        if let sun = cloud.sunday, sun.startUTC != nil || sun.endUTC != nil || sun.dayOff != nil {
            self.sunday = AvailabilityInterval(startUTC: sun.startUTC ?? 0, endUTC: sun.endUTC ?? 0, dayOff: sun.dayOff ?? false)
        } else {
            self.sunday = nil
        }
    }
    
    
    /*init(techId: String, serviceAdminId: Int, description: String, price: String, currency: String, durationMinutes: Int, images: [String]?, monday: AvailabilityInterval?, tuesday: AvailabilityInterval?, wednesday: AvailabilityInterval?, thursday: AvailabilityInterval?, friday: AvailabilityInterval?, saturday: AvailabilityInterval?, sunday: AvailabilityInterval?) {
        self.techId = techId
        self.serviceAdminId = serviceAdminId
        self.description = description
        self.price = price
        self.currency = currency
        self.durationMinutes = durationMinutes
        self.isActive = monday != nil || tuesday != nil || wednesday != nil || thursday != nil || friday != nil || saturday != nil || sunday != nil
        self.images = images
        self.monday = monday
        self.tuesday = tuesday
        self.wednesday = wednesday
        self.thursday = thursday
        self.friday = friday
        self.saturday = saturday
        self.sunday = sunday
    }*/
}

@MainActor
struct ViewServiceData: Sendable, Hashable {
    let fix: FixService
    let data: GetAServiceData
    
    // availabilities: single source of truth. Values store HOURS directly.
    private(set) var availabilities: [WeekDay: AvailabilityInterval?]
    
    init(fix: FixService, data: GetAServiceData) {
        self.fix = fix
        self.data = data
        self.availabilities = {
            var d = [WeekDay: AvailabilityInterval?]()
            WeekDay.allCases.forEach { d[$0] = nil }
            return d
        }()
        availabilities[.monday] = data.monday
        availabilities[.tuesday] = data.tuesday
        availabilities[.wednesday] = data.wednesday
        availabilities[.thursday] = data.thursday
        availabilities[.friday] = data.friday
        availabilities[.saturday] = data.saturday
        availabilities[.sunday] = data.sunday
    }
}

@MainActor
struct GetAServiceData: Identifiable, Sendable, Hashable {
    let id: String
    let tech: Tech
    let serviceAdminId: Int
    let description: String
    let price: String
    let currency: String
    let durationMinutes: Int
    let images: [String]
    let isActive: Bool
    let monday: AvailabilityInterval?
    let tuesday: AvailabilityInterval?
    let wednesday: AvailabilityInterval?
    let thursday: AvailabilityInterval?
    let friday: AvailabilityInterval?
    let saturday: AvailabilityInterval?
    let sunday: AvailabilityInterval?
    
    struct Tech: Identifiable, Sendable, Hashable {
        let id: String
        let name: String
        let email: String
        let phone: String
        let age: Int?
        let image: String?
        let location: UserLocation?
        
        var locationStr: String? {
            guard let location = location else { return nil }
            let components = [location.building ?? "", location.street ?? "", location.city ?? ""].filter { !$0.isEmpty }
            return (location.unit != nil ? "Unit: \(location.unit!) - " : "") + components.joined(separator: ", ")
        }
        
        init(id: String, name: String, phone: String, email: String, age: Int?, image: String?, location: UserLocation?) {
            self.id = id
            self.name = name
            self.email = email
            self.phone = phone
            self.age = age
            self.image = image
            self.location = location
        }
        
        init(cloud: GetAServiceRespond.Tech) {
            self.id = cloud.id
            self.name = cloud.name
            self.email = cloud.email
            self.phone = cloud.phone
            self.age = cloud.age
            self.image = cloud.image
            self.location = cloud.location
        }
    }
    
    init(cloud: GetAServiceRespond) {
        self.id = cloud.id
        self.tech = GetAServiceData.Tech(cloud: cloud.tech)
        self.serviceAdminId = cloud.serviceAdminId
        self.description = cloud.description
        self.price = cloud.price
        self.currency = cloud.currency
        self.durationMinutes = cloud.durationMinutes
        self.images = cloud.images ?? []
        self.isActive = cloud.isActive
        if let mon = cloud.monday, mon.startUTC != nil || mon.endUTC != nil || mon.dayOff != nil {
            self.monday = AvailabilityInterval(startUTC: mon.startUTC ?? 0, endUTC: mon.endUTC ?? 0, dayOff: mon.dayOff ?? false)
        } else {
            self.monday = nil
        }
        if let tue = cloud.tuesday, tue.startUTC != nil || tue.endUTC != nil || tue.dayOff != nil {
            self.tuesday = AvailabilityInterval(startUTC: tue.startUTC ?? 0, endUTC: tue.endUTC ?? 0, dayOff: tue.dayOff ?? false)
        } else {
            self.tuesday = nil
        }
        if let wed = cloud.wednesday, wed.startUTC != nil || wed.endUTC != nil || wed.dayOff != nil {
            self.wednesday = AvailabilityInterval(startUTC: wed.startUTC ?? 0, endUTC: wed.endUTC ?? 0, dayOff: wed.dayOff ?? false)
        } else {
            self.wednesday = nil
        }
        if let thu = cloud.thursday, thu.startUTC != nil || thu.endUTC != nil || thu.dayOff != nil {
            self.thursday = AvailabilityInterval(startUTC: thu.startUTC ?? 0, endUTC: thu.endUTC ?? 0, dayOff: thu.dayOff ?? false)
        } else {
            self.thursday = nil
        }
        if let fri = cloud.friday, fri.startUTC != nil || fri.endUTC != nil || fri.dayOff != nil {
            self.friday = AvailabilityInterval(startUTC: fri.startUTC ?? 0, endUTC: fri.endUTC ?? 0, dayOff: fri.dayOff ?? false)
        } else {
            self.friday = nil
        }
        if let sat = cloud.saturday, sat.startUTC != nil || sat.endUTC != nil || sat.dayOff != nil {
            self.saturday = AvailabilityInterval(startUTC: sat.startUTC ?? 0, endUTC: sat.endUTC ?? 0, dayOff: sat.dayOff ?? false)
        } else {
            self.saturday = nil
        }
        if let sun = cloud.sunday, sun.startUTC != nil || sun.endUTC != nil || sun.dayOff != nil {
            self.sunday = AvailabilityInterval(startUTC: sun.startUTC ?? 0, endUTC: sun.endUTC ?? 0, dayOff: sun.dayOff ?? false)
        } else {
            self.sunday = nil
        }
    }
    
    init(_ user: User, provided: ProvideServiceData) {
        self.id = provided.id
        self.tech = GetAServiceData.Tech(id: user.id, name: user.name, phone: user.phone, email: user.email, age: user.age, image: user.image, location: user.location)
        self.serviceAdminId = provided.serviceAdminId
        self.description = provided.description
        self.price = provided.price
        self.currency = provided.currency
        self.durationMinutes = provided.durationMinutes
        self.images = provided.images ?? []
        self.isActive = provided.isActive
        self.monday = provided.monday
        self.tuesday = provided.tuesday
        self.wednesday = provided.wednesday
        self.thursday = provided.thursday
        self.friday = provided.friday
        self.saturday = provided.saturday
        self.sunday = provided.sunday
    }
}

//=>////////////////////////////////////////////////

struct FixService: Identifiable, Sendable, Hashable {
    let id: String
    let adminId: Int // 0,1,2
    let categoryId: Int
    let title: String          // e.g. "Oil Change"
    let iconName: String       // SF Symbol or asset name
    let color: Color           // primary accent for the card
    let durationMinutes: Int  // optional expected duration
    let priceEstimate: String // optional price or range
    var bgImageName: String?   // optional background image asset name
    let category: FixCategory?

    init(id: String = UUID().uuidString,
         adminId: Int = Int.random(in: 0..<100000000),
         categoryId: Int,
         title: String,
         iconName: String,
         color: Color,
         durationMinutes: Int,
         priceEstimate: String,
         bgImageName: String? = nil,
    ) {
        self.id = id
        self.adminId = adminId
        self.categoryId = categoryId
        self.title = title
        self.iconName = iconName
        self.color = color
        self.durationMinutes = durationMinutes
        self.priceEstimate = priceEstimate
        self.bgImageName = bgImageName
        
        self.category = FixCategory(rawValue: categoryId) ?? .none
    }
    //FixCategory
}

// MARK: - Sample Data (two-word list)

enum FixCategory: Int, CaseIterable, Identifiable {
    case maintenance = 0
    case performance = 1
    case systems = 2
    case comfortCare = 3
    
    var title: String {
        switch self {
        case .maintenance: "Maintenance"
        case .performance: "Performance"
        case .systems: "Systems"
        case .comfortCare: "Comfort & Care"
        }
    }
    
    var id: Int { rawValue }
}

enum WeekDay: Int, CaseIterable, Identifiable {
    case monday = 1, tuesday, wednesday, thursday, friday, saturday, sunday
    var id: Int { rawValue }
    var short: String {
        switch self {
        case .monday: return "Mon"
        case .tuesday: return "Tue"
        case .wednesday: return "Wed"
        case .thursday: return "Thu"
        case .friday: return "Fri"
        case .saturday: return "Sat"
        case .sunday: return "Sun"
        }
    }
}


extension FixService {
    static func sampleServices() -> [FixService] {
        [
            FixService(adminId: 0, categoryId: FixCategory.maintenance.rawValue, title: "Oil Change", iconName: "drop.fill", color: .orange, durationMinutes: 30, priceEstimate: "$40 - $80"),
            FixService(adminId: 1, categoryId: FixCategory.performance.rawValue, title: "Tire Rotation", iconName: "arrow.2.squarepath", color: .mint, durationMinutes: 45, priceEstimate: "$20 - $50"),
            FixService(adminId: 2, categoryId: FixCategory.performance.rawValue, title: "Brake Service", iconName: "exclamationmark.triangle.fill", color: .red, durationMinutes: 60, priceEstimate: "$80 - $300"),
            FixService(adminId: 3, categoryId: FixCategory.systems.rawValue, title: "Battery Check", iconName: "bolt.car.fill", color: .yellow, durationMinutes: 15, priceEstimate: "$40 - $80"),
            FixService(adminId: 4, categoryId: FixCategory.systems.rawValue, title: "Engine Diagnostics", iconName: "cpu.fill", color: .indigo, durationMinutes: 50, priceEstimate: "$40 - $80"),
            FixService(adminId: 5, categoryId: FixCategory.systems.rawValue, title: "Transmission Service", iconName: "gearshape.fill", color: .purple, durationMinutes: 120, priceEstimate: "$40 - $80"),
            FixService(adminId: 6, categoryId: FixCategory.comfortCare.rawValue, title: "AC Service", iconName: "snow", color: .cyan, durationMinutes: 45, priceEstimate: "$40 - $80"),
            FixService(adminId: 7, categoryId: FixCategory.performance.rawValue, title: "Suspension Check", iconName: "car.2.fill", color: .teal, durationMinutes: 40, priceEstimate: "$40 - $80"),
            FixService(adminId: 8, categoryId: FixCategory.performance.rawValue, title: "Wheel Alignment", iconName: "ruler.fill", color: .brown, durationMinutes: 50, priceEstimate: "$40 - $80"),
            FixService(adminId: 9, categoryId: FixCategory.maintenance.rawValue, title: "Fluid Top-Up", iconName: "drop.triangle.fill", color: .blue, durationMinutes: 20, priceEstimate: "$40 - $80"),
            FixService(adminId: 10, categoryId: FixCategory.maintenance.rawValue, title: "Filter Replace", iconName: "wind", color: .gray, durationMinutes: 25, priceEstimate: "$40 - $80"),
            FixService(adminId: 11, categoryId: FixCategory.systems.rawValue, title: "Light Check", iconName: "lightbulb.fill", color: .yellow, durationMinutes: 15, priceEstimate: "$40 - $80"),
            FixService(adminId: 12, categoryId: FixCategory.systems.rawValue, title: "Wiper Replace", iconName: "windshield.front.and.wiper", color: .cyan, durationMinutes: 10, priceEstimate: "$40 - $80"),
            FixService(adminId: 13, categoryId: FixCategory.systems.rawValue, title: "Exhaust Check", iconName: "tuningfork", color: .orange, durationMinutes: 25, priceEstimate: "$40 - $80"),
            FixService(adminId: 14, categoryId: FixCategory.maintenance.rawValue, title: "Safety Inspect", iconName: "checkmark.shield.fill", color: .green, durationMinutes: 30, priceEstimate: "$40 - $80"),
            FixService(adminId: 15, categoryId: FixCategory.maintenance.rawValue, title: "Full Service", iconName: "wrench.and.screwdriver.fill", color: .pink, durationMinutes: 180, priceEstimate: "$40 - $80"),
            FixService(adminId: 16, categoryId: FixCategory.performance.rawValue, title: "Tire Balance", iconName: "circle.grid.cross", color: .mint, durationMinutes: 30, priceEstimate: "$40 - $80"),
            FixService(adminId: 17, categoryId: FixCategory.performance.rawValue, title: "Tire Repair", iconName: "bandage.fill", color: .red, durationMinutes: 35, priceEstimate: "$40 - $80"),
            FixService(adminId: 18, categoryId: FixCategory.performance.rawValue, title: "Steering Check", iconName: "steeringwheel", color: .indigo, durationMinutes: 30, priceEstimate: "$40 - $80"),
            FixService(adminId: 19, categoryId: FixCategory.comfortCare.rawValue, title: "Heating Check", iconName: "thermometer", color: .red, durationMinutes: 25, priceEstimate: "$40 - $80"),
            FixService(adminId: 20, categoryId: FixCategory.systems.rawValue, title: "Emission Test", iconName: "leaf.fill", color: .green, durationMinutes: 20, priceEstimate: "$40 - $80"),
            FixService(adminId: 21, categoryId: FixCategory.comfortCare.rawValue, title: "Car Wash", iconName: "sparkles", color: .blue, durationMinutes: 25, priceEstimate: "$40 - $80"),
            FixService(adminId: 22, categoryId: FixCategory.comfortCare.rawValue, title: "Interior Clean", iconName: "square.stack.3d.up.fill", color: .gray, durationMinutes: 45, priceEstimate: "$40 - $80"),
            FixService(adminId: 23, categoryId: FixCategory.systems.rawValue, title: "Battery Jumpstart", iconName: "battery.100.bolt", color: .yellow, durationMinutes: 15, priceEstimate: "$40 - $80"),
            FixService(adminId: 24, categoryId: FixCategory.comfortCare.rawValue, title: "Roadside Assist", iconName: "phone.fill", color: .red, durationMinutes: 60, priceEstimate: "$40 - $80")
        ]
    }
}
