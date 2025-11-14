//
//  FixService.swift
//  DriveLine
//
//  Created by OmAr Kader on 13/11/2025.
//

import SwiftUI
import Foundation
import SwiftUISturdy

struct ProvideNewServiceRequest: Codable {
    let techId: String
    let serviceAdminId: Int
    let description: String
    let price: String
    let currency: String
    let durationMinutes: Int
    let isActive: Bool// false of all days nil
    let monday: AvailabilityInterval?
    let tuesday: AvailabilityInterval?
    let wednesday: AvailabilityInterval?
    let thursday: AvailabilityInterval?
    let friday: AvailabilityInterval?
    let saturday: AvailabilityInterval?
    let sunday: AvailabilityInterval?
}

struct UpdateProvidedServiceRequest: Codable {
    let price: Double?
    let currency: String?
    let durationMinutes: Int?
    let isActive: Bool// false of all days nil
    let monday: AvailabilityInterval?
    let tuesday: AvailabilityInterval?
    let wednesday: AvailabilityInterval?
    let thursday: AvailabilityInterval?
    let friday: AvailabilityInterval?
    let saturday: AvailabilityInterval?
    let sunday: AvailabilityInterval?
    
}

//=>////////////////////////////////////////////////

struct GetAServiceRootRespond: Codable {
    let data: [GetAServiceRespond]
}
struct GetAServiceRespond: Codable {
    let id: String
    let tech: Tech
    let serviceAdminId: Int
    let description: String
    let price: String
    let currency: String
    let durationMinutes: Int
    let isActive: Bool// false of all days nil
    let monday: AvailabilityInterval?
    let tuesday: AvailabilityInterval?
    let wednesday: AvailabilityInterval?
    let thursday: AvailabilityInterval?
    let friday: AvailabilityInterval?
    let saturday: AvailabilityInterval?
    let sunday: AvailabilityInterval?
    
    struct Tech : Codable {
        let id: String
        let name: String
        let email: String
        let role: String
        let age: Int?
        let image: String?
        let location: UserLocation?
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

    enum CodingKeys: String, CodingKey {
        case id = "_id"
        case tech
        case serviceAdminId
        case description
        case price
        case currency
        case durationMinutes
        case isActive
        case monday
        case tuesday
        case wednesday
        case thursday
        case friday
        case saturday
        case sunday
    }
}

struct AvailabilityInterval: Codable, Hashable {
    var startUTC: Int
    var endUTC: Int
}

//=>////////////////////////////////////////////////

struct FixService: Identifiable, Hashable {
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


extension FixService {
    static func sampleServices() -> [FixService] {
        [
            FixService(categoryId: FixCategory.maintenance.rawValue, title: "Oil Change", iconName: "drop.fill", color: .orange, durationMinutes: 30, priceEstimate: "$40 - $80"),
            FixService(categoryId: FixCategory.performance.rawValue, title: "Tire Rotation", iconName: "arrow.2.squarepath", color: .mint, durationMinutes: 45, priceEstimate: "$20 - $50"),
            FixService(categoryId: FixCategory.performance.rawValue, title: "Brake Service", iconName: "exclamationmark.triangle.fill", color: .red, durationMinutes: 60, priceEstimate: "$80 - $300"),
            FixService(categoryId: FixCategory.systems.rawValue, title: "Battery Check", iconName: "bolt.car.fill", color: .yellow, durationMinutes: 15, priceEstimate: "$40 - $80"),
            FixService(categoryId: FixCategory.systems.rawValue, title: "Engine Diagnostics", iconName: "cpu.fill", color: .indigo, durationMinutes: 50, priceEstimate: "$40 - $80"),
            FixService(categoryId: FixCategory.systems.rawValue, title: "Transmission Service", iconName: "gearshape.fill", color: .purple, durationMinutes: 120, priceEstimate: "$40 - $80"),
            FixService(categoryId: FixCategory.comfortCare.rawValue, title: "AC Service", iconName: "snow", color: .cyan, durationMinutes: 45, priceEstimate: "$40 - $80"),
            FixService(categoryId: FixCategory.performance.rawValue, title: "Suspension Check", iconName: "car.2.fill", color: .teal, durationMinutes: 40, priceEstimate: "$40 - $80"),
            FixService(categoryId: FixCategory.performance.rawValue, title: "Wheel Alignment", iconName: "ruler.fill", color: .brown, durationMinutes: 50, priceEstimate: "$40 - $80"),
            FixService(categoryId: FixCategory.maintenance.rawValue, title: "Fluid Top-Up", iconName: "drop.triangle.fill", color: .blue, durationMinutes: 20, priceEstimate: "$40 - $80"),
            FixService(categoryId: FixCategory.maintenance.rawValue, title: "Filter Replace", iconName: "wind", color: .gray, durationMinutes: 25, priceEstimate: "$40 - $80"),
            FixService(categoryId: FixCategory.systems.rawValue, title: "Light Check", iconName: "lightbulb.fill", color: .yellow, durationMinutes: 15, priceEstimate: "$40 - $80"),
            FixService(categoryId: FixCategory.systems.rawValue, title: "Wiper Replace", iconName: "windshield.front.and.wiper", color: .cyan, durationMinutes: 10, priceEstimate: "$40 - $80"),
            FixService(categoryId: FixCategory.systems.rawValue, title: "Exhaust Check", iconName: "tuningfork", color: .orange, durationMinutes: 25, priceEstimate: "$40 - $80"),
            FixService(categoryId: FixCategory.maintenance.rawValue, title: "Safety Inspect", iconName: "checkmark.shield.fill", color: .green, durationMinutes: 30, priceEstimate: "$40 - $80"),
            FixService(categoryId: FixCategory.maintenance.rawValue, title: "Full Service", iconName: "wrench.and.screwdriver.fill", color: .pink, durationMinutes: 180, priceEstimate: "$40 - $80"),
            FixService(categoryId: FixCategory.performance.rawValue, title: "Tire Balance", iconName: "circle.grid.cross", color: .mint, durationMinutes: 30, priceEstimate: "$40 - $80"),
            FixService(categoryId: FixCategory.performance.rawValue, title: "Tire Repair", iconName: "bandage.fill", color: .red, durationMinutes: 35, priceEstimate: "$40 - $80"),
            FixService(categoryId: FixCategory.performance.rawValue, title: "Steering Check", iconName: "steeringwheel", color: .indigo, durationMinutes: 30, priceEstimate: "$40 - $80"),
            FixService(categoryId: FixCategory.comfortCare.rawValue, title: "Heating Check", iconName: "thermometer", color: .red, durationMinutes: 25, priceEstimate: "$40 - $80"),
            FixService(categoryId: FixCategory.systems.rawValue, title: "Emission Test", iconName: "leaf.fill", color: .green, durationMinutes: 20, priceEstimate: "$40 - $80"),
            FixService(categoryId: FixCategory.comfortCare.rawValue, title: "Car Wash", iconName: "sparkles", color: .blue, durationMinutes: 25, priceEstimate: "$40 - $80"),
            FixService(categoryId: FixCategory.comfortCare.rawValue, title: "Interior Clean", iconName: "square.stack.3d.up.fill", color: .gray, durationMinutes: 45, priceEstimate: "$40 - $80"),
            FixService(categoryId: FixCategory.systems.rawValue, title: "Battery Jumpstart", iconName: "battery.100.bolt", color: .yellow, durationMinutes: 15, priceEstimate: "$40 - $80"),
            FixService(categoryId: FixCategory.comfortCare.rawValue, title: "Roadside Assist", iconName: "phone.fill", color: .red, durationMinutes: 60, priceEstimate: "$40 - $80")
        ]
    }
}
