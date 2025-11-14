//
//  Course.swift
//  DriveLine
//
//  Created by OmAr Kader on 10/11/2025.
//

import AVKit
import Combine
import SwiftUI
import SwiftUISturdy


struct Course: Identifiable, Equatable {
    let id = UUID()
    let courseId: Int
    let isDark: Bool
    let title: String
    let subtitle: String
    let price: String
    let gradient: [Color]
    let course: CourseCategory

    // computed index used by CourseCardView
    var index: Int { courseId }

    init(courseId: Int, title: String, subtitle: String, price: String, gradient: [Color], isDark: Bool) {
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
            var i = 1
            func c(_ category: CourseCategory, _ title: String, _ subtitle: String, _ price: String, _ gradient: [Color], _ isDark: Bool) -> Course {
                defer { i += 1 }
                return Course(courseId: category.rawValue, title: title, subtitle: subtitle, price: price, gradient: gradient, isDark: isDark)
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
        var i = 1
        func c(_ category: CourseCategory, _ title: String, _ subtitle: String, _ price: String, _ gradient: [Color], _ isDark: Bool) -> Course {
            defer { i += 1 }
            return Course(courseId: category.rawValue, title: title, subtitle: subtitle, price: price, gradient: gradient, isDark: isDark)
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


struct ShortVideo: Identifiable, Hashable {
    var id: String {
        videoLink + thumbImageName + ((player != nil) ? "player" : "nil")
    }
    
    let thumbImageName: String   // for preview; can be a remote URL string if you adapt
    let videoLink: String
    
    let viewsText: String
    var player: AVPlayer?
    
    var videoURL: URL? {
        URL(string: videoLink)!
    }
    
    init(thumbImageName: String, videoLink: String, viewsText: String, player: AVPlayer? = nil) {
        self.thumbImageName = thumbImageName
        self.videoLink = videoLink
        self.viewsText = viewsText
        self.player = player
    }
    
    init() {
        self.thumbImageName = ""
        self.videoLink = ""
        self.viewsText = ""
    }
    
    static var temp: [ShortVideo] {
        {
            // Example: use remote mp4 URLs or bundle file URLs (Bundle.main.url(forResource...))
            let sampleURLs: [String] = [
                "https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/BigBuckBunny.mp4",
                "https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ElephantsDream.mp4",
                "https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/Sintel.mp4",
                "https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/TearsOfSteel.mp4",
                "https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/VolkswagenGTIReview.mp4",
                "https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ForBiggerJoyrides.mp4"
            ]
            var list: [ShortVideo] = []
            for i in 0..<sampleURLs.count {
                list.append(ShortVideo(thumbImageName: "thumb\(i)", videoLink: sampleURLs[i], viewsText: "\(Int.random(in: 3...30))M views"))
            }
            return list
        }()
    }
    
    func copy(player: AVPlayer?) -> Self {
        ShortVideo(thumbImageName: thumbImageName, videoLink: videoLink, viewsText: viewsText, player: player)
    }
}
