//
//  Course.swift
//  DriveLine
//
//  Created by OmAr Kader on 16/11/2025.
//


import SwiftUI
import Combine
import SwiftUISturdy


@BackgroundActor
struct ProvideCourseRequestRootRespond: Codable {
    let data: [ProvideCourseRequest]
    init(from decoder: Decoder) throws {
        let container = try decoder.container(keyedBy: CodingKeys.self)
        
        // Attempt to decode as array, filter out invalid items
        self.data = (try? container.decode([FailableDecodable<ProvideCourseRequest>].self, forKey: .data))?
            .compactMap { $0.value } ?? []
    }
}

@BackgroundActor
struct ProvideCourseRequest: Codable {
    let _id: String
    let techId: String
    let courseAdminId: Int
    let description: String
    let price: String
    let currency: String
    let sessions: Int
    let isActive: Bool// false of all days nil
    let images: [String]?
    let monday: AvailabilityInterval?
    let tuesday: AvailabilityInterval?
    let wednesday: AvailabilityInterval?
    let thursday: AvailabilityInterval?
    let friday: AvailabilityInterval?
    let saturday: AvailabilityInterval?
    let sunday: AvailabilityInterval?
    
    init(data: ProvideCourseData) {
        self._id = data._id
        self.techId = data.techId
        self.courseAdminId = data.courseAdminId
        self.description = data.description
        self.price = data.price
        self.currency = data.currency
        self.sessions = data.sessions
        self.isActive = data.isActive
        self.images = data.images
        self.monday = data.monday
        self.tuesday = data.tuesday
        self.wednesday = data.wednesday
        self.thursday = data.thursday
        self.friday = data.friday
        self.saturday = data.saturday
        self.sunday = data.sunday
    }
    
    init(techId: String, courseAdminId: Int, description: String, price: String, currency: String, sessions: Int, images: [String]?, monday: AvailabilityInterval?, tuesday: AvailabilityInterval?, wednesday: AvailabilityInterval?, thursday: AvailabilityInterval?, friday: AvailabilityInterval?, saturday: AvailabilityInterval?, sunday: AvailabilityInterval?) {
        self._id = ""
        self.techId = techId
        self.courseAdminId = courseAdminId
        self.description = description
        self.price = price
        self.currency = currency
        self.sessions = sessions
        self.isActive = monday != nil || tuesday != nil || wednesday != nil || thursday != nil || friday != nil || saturday != nil || sunday != nil
        self.images = images
        self.monday = monday
        self.tuesday = tuesday
        self.wednesday = wednesday
        self.thursday = thursday
        self.friday = friday
        self.saturday = saturday
        self.sunday = sunday
    }
    
    func encode(to encoder: Encoder) throws {
        var container = encoder.container(keyedBy: CodingKeys.self)
        
        try container.encode(techId, forKey: .techId)
        try container.encode(courseAdminId, forKey: .courseAdminId)
        try container.encode(description, forKey: .description)
        try container.encode(price, forKey: .price)
        try container.encode(currency, forKey: .currency)
        try container.encode(sessions, forKey: .sessions)
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
struct UpdateProvidedCourseRequest: Codable {
    let description: String?
    let price: String?
    let currency: String?
    let sessions: Int?
    let images: [String]?
    let isActive: Bool?// false of all days nil
    let monday: AvailabilityInterval?
    let tuesday: AvailabilityInterval?
    let wednesday: AvailabilityInterval?
    let thursday: AvailabilityInterval?
    let friday: AvailabilityInterval?
    let saturday: AvailabilityInterval?
    let sunday: AvailabilityInterval?
    
    init(description: String? = nil, price: String? = nil, currency: String? = nil, sessions: Int? = nil, images: [String]? = nil, monday: AvailabilityInterval? = nil, tuesday: AvailabilityInterval?, wednesday: AvailabilityInterval?, thursday: AvailabilityInterval?, friday: AvailabilityInterval?, saturday: AvailabilityInterval?, sunday: AvailabilityInterval?) {
        self.description = description
        self.price = price
        self.currency = currency
        self.sessions = sessions
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
    
    
    init(original: ProvideCourseData, description: String? = nil, price: String?, currency: String?, sessions: Int?, images: [String]?, isActive: Bool, monday: AvailabilityInterval?, tuesday: AvailabilityInterval?, wednesday: AvailabilityInterval?, thursday: AvailabilityInterval?, friday: AvailabilityInterval?, saturday: AvailabilityInterval?, sunday: AvailabilityInterval?) {
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

        self.sessions = if original.sessions == sessions {
            nil
        } else {
            sessions
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
struct GetACourseRootRespond: Codable {
    let data: [GetACourseRespond]
    
    init(from decoder: Decoder) throws {
        let container = try decoder.container(keyedBy: CodingKeys.self)
        
        // Attempt to decode as array, filter out invalid items
        self.data = (try? container.decode([FailableDecodable<GetACourseRespond>].self, forKey: .data))?
            .compactMap { $0.value } ?? []
    }
}

@BackgroundActor
struct GetACourseRespond: Codable {
    let id: String
    let tech: Tech
    let courseAdminId: Int
    let description: String
    let price: String
    let currency: String
    let sessions: Int
    let images: [String]?
    let isActive: Bool
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
        let phone: String
        let age: Int?
        let image: String?
        let location: UserLocation?
        enum CodingKeys: String, CodingKey {
            case id = "_id"
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
        
        init(data: GetACourseData.Tech) {
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
        case id = "_id"
        case tech
        case courseAdminId
        case description
        case price
        case currency
        case sessions
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

//=>////////////////////////////////////////////////

@MainActor
struct ProfileCourseData: Identifiable, Sendable, Hashable {
    let providedCourse: ProvideCourseData
    let course: Course
    var id: String {
        "\(course.adminId)" + providedCourse.id + providedCourse.price + providedCourse.currency + "\(providedCourse.sessions)" + providedCourse.description
    }
}

@MainActor
struct ProvideCourseData: Identifiable, Sendable, Hashable {
    let _id: String
    let techId: String
    let courseAdminId: Int
    let description: String
    let price: String
    let currency: String
    let sessions: Int
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
        techId + String(courseAdminId) + price + description
    }
    
    init(cloud: ProvideCourseRequest) {
        self._id = cloud._id
        self.techId = cloud.techId
        self.courseAdminId = cloud.courseAdminId
        self.description = cloud.description
        self.price = cloud.price
        self.currency = cloud.currency
        self.sessions = cloud.sessions
        self.isActive = cloud.isActive
        self.images = cloud.images
        self.monday = cloud.monday
        self.tuesday = cloud.tuesday
        self.wednesday = cloud.wednesday
        self.thursday = cloud.thursday
        self.friday = cloud.friday
        self.saturday = cloud.saturday
        self.sunday = cloud.sunday
    }
}

@MainActor
struct ViewCourseData: Sendable, Hashable {
    let course: Course
    let data: GetACourseData
    
    // availabilities: single source of truth. Values store HOURS directly.
    private(set) var availabilities: [WeekDay: AvailabilityInterval?]
    
    init(course: Course, data: GetACourseData) {
        self.course = course
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
struct GetACourseData: Identifiable, Sendable, Hashable {
    let id: String
    let tech: Tech
    let courseAdminId: Int
    let description: String
    let price: String
    let currency: String
    let sessions: Int
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
        
        init(cloud: GetACourseRespond.Tech) {
            self.id = cloud.id
            self.name = cloud.name
            self.email = cloud.email
            self.phone = cloud.phone
            self.age = cloud.age
            self.image = cloud.image
            self.location = cloud.location
        }
    }
    
    init(cloud: GetACourseRespond) {
        self.id = cloud.id
        self.tech = GetACourseData.Tech(cloud: cloud.tech)
        self.courseAdminId = cloud.courseAdminId
        self.description = cloud.description
        self.price = cloud.price
        self.currency = cloud.currency
        self.sessions = cloud.sessions
        self.images = cloud.images ?? []
        self.isActive = cloud.isActive
        self.monday = cloud.monday
        self.tuesday = cloud.tuesday
        self.wednesday = cloud.wednesday
        self.thursday = cloud.thursday
        self.friday = cloud.friday
        self.saturday = cloud.saturday
        self.sunday = cloud.sunday
    }
    
    init(_ user: User, provided: ProvideCourseData) {
        self.id = provided.id
        self.tech = GetACourseData.Tech(id: user.id, name: user.name, phone: user.phone, email: user.email, age: user.age, image: user.image, location: user.location)
        self.courseAdminId = provided.courseAdminId
        self.description = provided.description
        self.price = provided.price
        self.currency = provided.currency
        self.sessions = provided.sessions
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



//->////////////////////////////////////


struct Course: Identifiable, Equatable, Hashable {
    let id = UUID()
    let adminId: Int
    let courseId: Int
    let isDark: Bool
    let title: String
    let subtitle: String
    let price: String
    let gradient: [Color]
    let course: CourseCategory

    // computed index used by CourseCardView
    var index: Int { adminId + 1 }

    init(adminId: Int, courseId: Int, title: String, subtitle: String, price: String, gradient: [Color], isDark: Bool) {
        self.adminId = adminId
        self.courseId = courseId
        self.isDark = isDark
        self.title = title
        self.subtitle = subtitle
        self.price = price
        self.gradient = gradient
        self.course = CourseCategory(rawValue: courseId) ?? .drivingEfficiency
    }

    // sample data
    static var sampleCourses: [Course] {
            var i = 0
            func c(_ category: CourseCategory, _ title: String, _ subtitle: String, _ price: String, _ gradient: [Color], _ isDark: Bool) -> Course {
                defer { i += 1 }
                return Course(adminId: i, courseId: category.rawValue, title: title, subtitle: subtitle, price: price, gradient: gradient, isDark: isDark)
            }

            return [
                
                // 1. Driving Efficiency & Safety
                c(.drivingEfficiency, "Fuel Efficiency Mastery", "Driving habits that reduce fuel consumption.", "29.00 €",
                  [Color(#colorLiteral(red: 0.06, green: 0.35, blue: 0.8, alpha: 1)).margeColors(Color.black, 0.3), Color(#colorLiteral(red: 0.19, green: 0.77, blue: 0.92, alpha: 1)).margeColors(Color.black, 0.2)], false),

                c(.drivingEfficiency, "Safe Driving Techniques", "Braking, cornering, and emergency maneuvers.", "35.00 €",
                  [Color(#colorLiteral(red: 0.06, green: 0.2, blue: 0.6, alpha: 1)).margeColors(Color.black, 0.3), Color(#colorLiteral(red: 0.2, green: 0.5, blue: 0.9, alpha: 1)).margeColors(Color.black, 0.2)], false),

                c(.drivingEfficiency, "Tire Safety & Selection", "How to pick, inspect, and rotate tires.", "24.00 €",
                  [Color(#colorLiteral(red: 0.1, green: 0.35, blue: 0.15, alpha: 1)).margeColors(Color.black, 0.3), Color(#colorLiteral(red: 0.3, green: 0.8, blue: 0.5, alpha: 1)).margeColors(Color.black, 0.2)], false),

                c(.drivingEfficiency, "Car Technology Awareness", "Using ADAS, cruise control, sensors, and infotainment properly.", "39.00 €",
                  [Color(#colorLiteral(red: 0.65, green: 0.2, blue: 0.9, alpha: 1)).margeColors(Color.black, 0.3), Color(#colorLiteral(red: 0.2, green: 0.6, blue: 0.95, alpha: 1)).margeColors(Color.black, 0.2)], false),
                
                // 2. Essential Maintenance
                c(.essentialMaintenance, "Car Care Basics", "Oil, filters, tire pressure, coolant, wipers.", "39.00 €",
                  [Color(#colorLiteral(red: 0.09, green: 0.39, blue: 0.95, alpha: 1)).margeColors(Color.black, 0.3), Color(#colorLiteral(red: 0.34, green: 0.72, blue: 1.0, alpha: 1)).margeColors(Color.black, 0.2)], false),

                c(.essentialMaintenance, "DIY Maintenance & Inspections", "Checking fluids, belts, battery, and brakes.", "49.00 €",
                  [Color(#colorLiteral(red: 0.11, green: 0.7, blue: 0.35, alpha: 1)).margeColors(Color.black, 0.3), Color(#colorLiteral(red: 0.6, green: 0.9, blue: 0.7, alpha: 1)).margeColors(Color.black, 0.2)], true),

                c(.essentialMaintenance, "Seasonal Car Care", "Preparing for winter/summer conditions.", "29.00 €",
                  [Color(#colorLiteral(red: 1.0, green: 0.6, blue: 0.1, alpha: 1)).margeColors(Color.black, 0.3), Color(#colorLiteral(red: 1.0, green: 0.85, blue: 0.35, alpha: 1)).margeColors(Color.black, 0.2)], true),

                c(.essentialMaintenance, "Understanding Dashboard Warnings", "Meaning and quick responses to common warnings.", "19.00 €",
                  [Color(#colorLiteral(red: 0.55, green: 0.2, blue: 0.85, alpha: 1)).margeColors(Color.black, 0.3), Color(#colorLiteral(red: 0.8, green: 0.5, blue: 0.95, alpha: 1)).margeColors(Color.black, 0.2)], false),

                // 3. Electric & Hybrid Vehicle Awareness
                c(.evAwareness, "Intro to EVs and Hybrids", "How electric vehicles work.", "45.00 €",
                  [Color(#colorLiteral(red: 0.25, green: 0.15, blue: 0.9, alpha: 1)).margeColors(Color.black, 0.3), Color(#colorLiteral(red: 0.35, green: 0.75, blue: 0.9, alpha: 1)).margeColors(Color.black, 0.2)], false),

                c(.evAwareness, "Charging and Battery Care", "Safe charging, battery health, and range optimization.", "39.00 €",
                  [Color(#colorLiteral(red: 0.0, green: 0.55, blue: 0.3, alpha: 1)).margeColors(Color.black, 0.3), Color(#colorLiteral(red: 0.2, green: 0.9, blue: 0.75, alpha: 1)).margeColors(Color.black, 0.2)], false),

                c(.evAwareness, "EV Maintenance Basics", "Key differences from traditional engines.", "59.00 €",
                  [Color(#colorLiteral(red: 0.1, green: 0.2, blue: 0.6, alpha: 1)).margeColors(Color.black, 0.3), Color(#colorLiteral(red: 0.25, green: 0.6, blue: 0.9, alpha: 1)).margeColors(Color.black, 0.2)], false),

                // 4. Fundamental Technical Training
                c(.fundamentalTraining, "Automotive Systems Overview", "Engine, transmission, suspension, electrical.", "120.00 €",
                  [Color(#colorLiteral(red: 0.15, green: 0.15, blue: 0.6, alpha: 1)).margeColors(Color.black, 0.3), Color(#colorLiteral(red: 0.5, green: 0.6, blue: 1.0, alpha: 1)).margeColors(Color.black, 0.2)], false),

                c(.fundamentalTraining, "Mechanical Diagnostics", "Identifying and fixing common faults.", "140.00 €",
                  [Color(#colorLiteral(red: 0.25, green: 0.3, blue: 0.95, alpha: 1)).margeColors(Color.black, 0.3), Color(#colorLiteral(red: 0.65, green: 0.75, blue: 1.0, alpha: 1)).margeColors(Color.black, 0.2)], true),

                c(.fundamentalTraining, "Auto-Electrical Fundamentals", "Wiring diagrams, relays, fuses, and sensors.", "150.00 €",
                  [Color(#colorLiteral(red: 0.25, green: 0.25, blue: 0.25, alpha: 1)).margeColors(Color.black, 0.3), Color(#colorLiteral(red: 0.25, green: 0.55, blue: 0.9, alpha: 1)).margeColors(Color.black, 0.2)], false),

                c(.fundamentalTraining, "OBD-II & ECU Basics", "Reading and interpreting diagnostic codes.", "99.00 €",
                  [Color(#colorLiteral(red: 0.82, green: 0.17, blue: 0.24, alpha: 1)).margeColors(Color.black, 0.3), Color(#colorLiteral(red: 1.0, green: 0.5, blue: 0.6, alpha: 1)).margeColors(Color.black, 0.2)], true),

                // 5. Advanced Diagnostics & Repair
                c(.advancedDiagnostics, "Advanced Engine Diagnostics", "Using oscilloscopes, data loggers, and scanners.", "280.00 €",
                  [Color(#colorLiteral(red: 0.06, green: 0.06, blue: 0.06, alpha: 1)).margeColors(Color.black, 0.3), Color(#colorLiteral(red: 0.35, green: 0.35, blue: 0.35, alpha: 1)).margeColors(Color.black, 0.2)], false),

                c(.advancedDiagnostics, "Fuel Injection & Emission Systems", "Modern emission controls and troubleshooting.", "240.00 €",
                  [Color(#colorLiteral(red: 0.85, green: 0.22, blue: 0.2, alpha: 1)).margeColors(Color.black, 0.3), Color(#colorLiteral(red: 1.0, green: 0.55, blue: 0.32, alpha: 1)).margeColors(Color.black, 0.2)], true),

                c(.advancedDiagnostics, "Transmission & Drivetrain Systems", "CVT, DCT, and AWD maintenance.", "230.00 €",
                  [Color(#colorLiteral(red: 0.09, green: 0.25, blue: 0.6, alpha: 1)).margeColors(Color.black, 0.3), Color(#colorLiteral(red: 0.2, green: 0.6, blue: 0.9, alpha: 1)).margeColors(Color.black, 0.2)], false),

                c(.advancedDiagnostics, "HVAC Systems", "Heating, ventilation, and air conditioning repair.", "130.00 €",
                  [Color(#colorLiteral(red: 0.0, green: 0.55, blue: 0.8, alpha: 1)).margeColors(Color.black, 0.3), Color(#colorLiteral(red: 0.5, green: 0.85, blue: 0.95, alpha: 1)).margeColors(Color.black, 0.2)], true),

                // 6. Electric & Hybrid Vehicle Technology
                c(.evTechnology, "High-Voltage Safety & Handling", "Working safely around EV systems.", "160.00 €",
                  [Color(#colorLiteral(red: 0.1, green: 0.7, blue: 0.55, alpha: 1)).margeColors(Color.black, 0.3), Color(#colorLiteral(red: 0.0, green: 0.5, blue: 0.7, alpha: 1)).margeColors(Color.black, 0.2)], true),

                c(.evTechnology, "Hybrid System Diagnostics", "Battery management, inverter, and motor testing.", "310.00 €",
                  [Color(#colorLiteral(red: 0.25, green: 0.8, blue: 0.6, alpha: 1)).margeColors(Color.black, 0.3), Color(#colorLiteral(red: 0.1, green: 0.35, blue: 0.6, alpha: 1)).margeColors(Color.black, 0.2)], true),

                c(.evTechnology, "EV Maintenance & Repair", "Thermal management, software updates, and regeneration systems.", "350.00 €",
                  [Color(#colorLiteral(red: 0.5, green: 0.2, blue: 0.9, alpha: 1)).margeColors(Color.black, 0.3), Color(#colorLiteral(red: 0.1, green: 0.6, blue: 0.9, alpha: 1)).margeColors(Color.black, 0.2)], true),

                // 7. Computer & Software Integration
                c(.softwareIntegration, "Automotive Software & ECU Programming", "Flashing, coding, reprogramming modules.", "320.00 €",
                  [Color(#colorLiteral(red: 0.12, green: 0.22, blue: 0.28, alpha: 1)).margeColors(Color.black, 0.3), Color(#colorLiteral(red: 0.25, green: 0.35, blue: 0.85, alpha: 1)).margeColors(Color.black, 0.2)], false),

                c(.softwareIntegration, "CAN Bus & Communication Networks", "Deep dive into data protocols.", "199.00 €",
                  [Color(#colorLiteral(red: 0.06, green: 0.12, blue: 0.24, alpha: 1)).margeColors(Color.black, 0.3), Color(#colorLiteral(red: 0.12, green: 0.3, blue: 0.85, alpha: 1)).margeColors(Color.black, 0.2)], false),

                c(.softwareIntegration, "ADAS Calibration & Sensor Alignment", "Cameras, radar, LiDAR, and control systems.", "220.00 €",
                  [Color(#colorLiteral(red: 0.12, green: 0.6, blue: 0.25, alpha: 1)).margeColors(Color.black, 0.3), Color(#colorLiteral(red: 0.05, green: 0.5, blue: 0.9, alpha: 1)).margeColors(Color.black, 0.2)], false),

                c(.softwareIntegration, "Telematics & Connected Vehicles", "GPS, IoT, and real-time diagnostics.", "150.00 €",
                  [Color(#colorLiteral(red: 0.07, green: 0.35, blue: 0.65, alpha: 1)).margeColors(Color.black, 0.3), Color(#colorLiteral(red: 0.25, green: 0.75, blue: 0.95, alpha: 1)).margeColors(Color.black, 0.2)], false),

                // 8. Body, Paint & Aesthetics
                c(.bodyPaint, "Body Repair Techniques", "Dent removal, welding, and panel alignment.", "190.00 €",
                  [Color(#colorLiteral(red: 0.95, green: 0.25, blue: 0.12, alpha: 1)).margeColors(Color.black, 0.3), Color(#colorLiteral(red: 0.9568627477, green: 0.6588235497, blue: 0.5450980663, alpha: 1)).margeColors(Color.black, 0.2)], true),

                c(.bodyPaint, "Automotive Painting & Refinishing", "Color matching, blending, and clear coating.", "200.00 €",
                  [Color(#colorLiteral(red: 1.0, green: 0.6, blue: 0.25, alpha: 1)).margeColors(Color.black, 0.3), Color(#colorLiteral(red: 0.98, green: 0.8, blue: 0.6, alpha: 1)).margeColors(Color.black, 0.2)], true),

                c(.bodyPaint, "Detailing & Interior Restoration", "Cleaning, polishing, leather care, ceramic coating.", "89.00 €",
                  [Color(#colorLiteral(red: 0.15, green: 0.55, blue: 0.95, alpha: 1)).margeColors(Color.black, 0.3), Color(#colorLiteral(red: 0.2, green: 0.85, blue: 0.9, alpha: 1)).margeColors(Color.black, 0.2)], true),

                // 9. Specialized Training
                c(.specialized, "Diesel Engine Technology", "Turbochargers, injectors, and emission systems.", "210.00 €",
                  [Color(#colorLiteral(red: 0.25, green: 0.2, blue: 0.05, alpha: 1)).margeColors(Color.black, 0.3), Color(#colorLiteral(red: 0.7, green: 0.5, blue: 0.25, alpha: 1)).margeColors(Color.black, 0.2)], false),

                c(.specialized, "Performance Tuning & ECU Remapping", "Power optimization and safe limits.", "340.00 €",
                  [Color(#colorLiteral(red: 0.9, green: 0.05, blue: 0.15, alpha: 1)).margeColors(Color.black, 0.3), Color(#colorLiteral(red: 0.55, green: 0.05, blue: 0.5, alpha: 1)).margeColors(Color.black, 0.2)], false),

                c(.specialized, "Suspension & Alignment Mastery", "Geometry setup and comfort tuning.", "170.00 €",
                  [Color(#colorLiteral(red: 0.05, green: 0.25, blue: 0.25, alpha: 1)).margeColors(Color.black, 0.3), Color(#colorLiteral(red: 0.25, green: 0.7, blue: 0.5, alpha: 1)).margeColors(Color.black, 0.2)], false),

                c(.specialized, "Brake System Diagnostics", "ABS, EBD, and modern electronic braking systems.", "160.00 €",
                  [Color(#colorLiteral(red: 0.2, green: 0.1, blue: 0.2, alpha: 1)).margeColors(Color.black, 0.3), Color(#colorLiteral(red: 0.7, green: 0.1, blue: 0.2, alpha: 1)).margeColors(Color.black, 0.2)], false),

                // 10. Management
                c(.management, "Workshop Management & Customer Service", "Run your auto shop and retain customers.", "199.00 €",
                  [Color(#colorLiteral(red: 0.98, green: 0.8, blue: 0.2, alpha: 1)).margeColors(Color.black, 0.3), Color(#colorLiteral(red: 0.9, green: 0.55, blue: 0.1, alpha: 1)).margeColors(Color.black, 0.2)], true),

                c(.management, "Automotive Parts Inventory Control", "Optimize stock, reduce waste, and automate ordering.", "179.00 €",
                  [Color(#colorLiteral(red: 0.95, green: 0.7, blue: 0.25, alpha: 1)).margeColors(Color.black, 0.3), Color(#colorLiteral(red: 0.9, green: 0.9, blue: 0.25, alpha: 1)).margeColors(Color.black, 0.2)], true),

                c(.management, "Digital Diagnostics Tools Setup", "Select and configure modern diagnostic tools.", "129.00 €",
                  [Color(#colorLiteral(red: 0.25, green: 0.35, blue: 0.95, alpha: 1)).margeColors(Color.black, 0.3), Color(#colorLiteral(red: 0.55, green: 0.75, blue: 1.0, alpha: 1)).margeColors(Color.black, 0.2)], true),

                c(.management, "Marketing for Auto Businesses", "Social media, branding, reviews — practical tactics.", "149.00 €",
                  [Color(#colorLiteral(red: 0.6, green: 0.2, blue: 0.9, alpha: 1)).margeColors(Color.black, 0.3), Color(#colorLiteral(red: 0.95, green: 0.55, blue: 1.0, alpha: 1)).margeColors(Color.black, 0.2)], true)
            ]
        }

    static var temp: [Course] {
        var i = 0
        func c(_ category: CourseCategory, _ title: String, _ subtitle: String, _ price: String, _ gradient: [Color], _ isDark: Bool) -> Course {
            defer { i += 1 }
            return Course(adminId: i, courseId: category.rawValue, title: title, subtitle: subtitle, price: price, gradient: gradient, isDark: isDark)
        }

        return [
            // 1. Driving Efficiency & Safety
            c(.drivingEfficiency, "Fuel Efficiency Mastery", "Driving habits that reduce fuel consumption.", "29.00 €",
              [Color(#colorLiteral(red: 0.06, green: 0.35, blue: 0.8, alpha: 1)).margeColors(Color.black, 0.3), Color(#colorLiteral(red: 0.19, green: 0.77, blue: 0.92, alpha: 1)).margeColors(Color.black, 0.2)], false),

            c(.drivingEfficiency, "Safe Driving Techniques", "Braking, cornering, and emergency maneuvers.", "35.00 €",
              [Color(#colorLiteral(red: 0.06, green: 0.2, blue: 0.6, alpha: 1)).margeColors(Color.black, 0.3), Color(#colorLiteral(red: 0.2, green: 0.5, blue: 0.9, alpha: 1)).margeColors(Color.black, 0.2)], false),

            c(.drivingEfficiency, "Tire Safety & Selection", "How to pick, inspect, and rotate tires.", "24.00 €",
              [Color(#colorLiteral(red: 0.1, green: 0.35, blue: 0.15, alpha: 1)).margeColors(Color.black, 0.3), Color(#colorLiteral(red: 0.3, green: 0.8, blue: 0.5, alpha: 1)).margeColors(Color.black, 0.2)], false),

            c(.drivingEfficiency, "Car Technology Awareness", "Using ADAS, cruise control, sensors, and infotainment properly.", "39.00 €",
              [Color(#colorLiteral(red: 0.65, green: 0.2, blue: 0.9, alpha: 1)).margeColors(Color.black, 0.3), Color(#colorLiteral(red: 0.2, green: 0.6, blue: 0.95, alpha: 1)).margeColors(Color.black, 0.2)], false),
        ]
    }
}

enum CourseCategory: Int, CaseIterable, Identifiable {
    case drivingEfficiency = 0
    case essentialMaintenance = 1
    case evAwareness = 2
    case fundamentalTraining = 3
    case advancedDiagnostics = 4
    case evTechnology = 5
    case softwareIntegration = 6
    case bodyPaint = 7
    case specialized = 8
    case management = 9

    var id: Int { rawValue }

    var title: String {
        switch self {
        case .drivingEfficiency: return "Driving Efficiency & Safety"
        case .essentialMaintenance: return "Essential Maintenance"
        case .evAwareness: return "Electric & Hybrid Vehicle Awareness"
        case .fundamentalTraining: return "Fundamental Technical Training"
        case .advancedDiagnostics: return "Advanced Diagnostics & Repair"
        case .evTechnology: return "Electric & Hybrid Vehicle Technology"
        case .softwareIntegration: return "Computer & Software Integration"
        case .bodyPaint: return "Body, Paint & Aesthetics"
        case .specialized: return "Specialized Training"
        case .management: return "Management"
        }
    }

    var subtitle: String {
        switch self {
        case .essentialMaintenance: return "Owner-focused: basic care & inspections"
        case .drivingEfficiency: return "Owner-focused: economy & safety"
        case .evAwareness: return "Owner-focused: EV basics & charging"
        case .fundamentalTraining: return "Technician: mechanical & electrical basics"
        case .advancedDiagnostics: return "Technician: deep diagnostics & repairs"
        case .evTechnology: return "Technician: EV/hybrid high-voltage work"
        case .softwareIntegration: return "Technician: software, CAN, ADAS & telematics"
        case .bodyPaint: return "Technician: bodywork and finishing"
        case .specialized: return "Technician: niche advanced topics"
        case .management: return "Owners & managers: running the business"
        }
    }
}
