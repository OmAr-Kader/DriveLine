//
//  Cloud.swift
//  DriveLine
//
//  Created by OmAr Kader on 08/11/2025.
//

import Foundation
import SwiftUISturdy
import SwiftUI
/// A result type that represents an asynchronous operation's state with three possible cases.
/// - Note: Marked as `@unchecked Sendable` to allow usage across concurrency domains.
public enum Cloud<T> : @unchecked Sendable {
    case success(T)
    case failure(String)
    case loading
}

/// A response wrapper containing a single message string from API calls.
/// Encodes and decodes as a bare string value rather than a JSON object.
@BackgroundActor
public struct BaseMessageResponse: @BackgroundActor Codable {
    public let message: String
    
    public init(message: String) {
        self.message = message
    }
    
    public init(from decoder: any Decoder) throws {
        let container = try decoder.singleValueContainer()
        self.message = try container.decode(String.self)
    }
    
    public func encode(to encoder: any Encoder) throws {
        var container = encoder.singleValueContainer()
        try container.encode(message)
    }
}

/// A response wrapper containing a boolean success indicator from API calls.
/// Encodes and decodes as a bare boolean value rather than a JSON object.
@BackgroundActor
public struct BaseSuccessResponse: @BackgroundActor Codable {
    public let success: Bool
    
    public init(success: Bool) {
        self.success = success
    }
    
    public init(from decoder: any Decoder) throws {
        let container = try decoder.singleValueContainer()
        self.success = try container.decode(Bool.self)
    }
    
    public func encode(to encoder: any Encoder) throws {
        var container = encoder.singleValueContainer()
        try container.encode(success)
    }
}

public extension KeyedDecodingContainer {
    
    /// Decodes an ISO8601 formatted date string into a `Date` object.
    /// - Parameter key: The coding key for the date value.
    /// - Throws: `DecodingError` if the string cannot be parsed as a valid ISO8601 date.
    /// - Returns: A `Date` object parsed from the ISO8601 string.
    @BackgroundActor
    func decodeISO8601Date(forKey key: K) throws -> Date {
        let dateString = try decode(String.self, forKey: key)
        if let date = ISO8601DateFormatter.cached.date(from: dateString) {
            return date
        } else {
            throw DecodingError.dataCorruptedError(
                forKey: key,
                in: self,
                debugDescription: "Invalid date format: \(dateString)"
            )
        }
    }
}

// MARK: - ISO8601DateFormatter Cache
public extension ISO8601DateFormatter {
    
    /// A cached ISO8601 formatter configured to parse internet date-time with fractional seconds.
    /// Reusing this formatter improves performance by avoiding repeated initialization.
    @BackgroundActor
    static let cached: ISO8601DateFormatter = {
        let formatter = ISO8601DateFormatter()
        formatter.formatOptions = [.withInternetDateTime, .withFractionalSeconds]
        return formatter
    }()
}

extension Color {
    // Convert Color to hex string for upload
    func toHex() -> String? {
        guard let components = UIColor(self).cgColor.components else { return nil }
        
        let r = components[0]
        let g = components[1]
        let b = components[2]
        let a = components.count >= 4 ? components[3] : 1.0
        
        if a < 1.0 {
            // Include alpha if not fully opaque
            return String(format: "#%02lX%02lX%02lX%02lX",
                         lroundf(Float(r * 255)),
                         lroundf(Float(g * 255)),
                         lroundf(Float(b * 255)),
                         lroundf(Float(a * 255)))
        } else {
            return String(format: "#%02lX%02lX%02lX",
                         lroundf(Float(r * 255)),
                         lroundf(Float(g * 255)),
                         lroundf(Float(b * 255)))
        }
    }
    
    // Create Color from hex string received from server
    init?(hex: String) {
        var hexSanitized = hex.trimmingCharacters(in: .whitespacesAndNewlines)
        hexSanitized = hexSanitized.replacingOccurrences(of: "#", with: "")
        
        var rgb: UInt64 = 0
        guard Scanner(string: hexSanitized).scanHexInt64(&rgb) else { return nil }
        
        let length = hexSanitized.count
        let r, g, b, a: Double
        
        if length == 6 {
            r = Double((rgb & 0xFF0000) >> 16) / 255.0
            g = Double((rgb & 0x00FF00) >> 8) / 255.0
            b = Double(rgb & 0x0000FF) / 255.0
            a = 1.0
        } else if length == 8 {
            r = Double((rgb & 0xFF000000) >> 24) / 255.0
            g = Double((rgb & 0x00FF0000) >> 16) / 255.0
            b = Double((rgb & 0x0000FF00) >> 8) / 255.0
            a = Double(rgb & 0x000000FF) / 255.0
        } else {
            return nil
        }
        
        self.init(red: r, green: g, blue: b, opacity: a)
    }
}
