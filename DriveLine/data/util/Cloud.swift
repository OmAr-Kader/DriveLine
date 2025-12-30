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
public struct BaseMessageResponse: Codable {
    public let message: String
    
}

/// A response wrapper containing a boolean success indicator from API calls.
/// Encodes and decodes as a bare boolean value rather than a JSON object.
@BackgroundActor
public struct BaseSuccessResponse: Codable {
    public let success: Bool
}


@BackgroundActor
struct FailableSingleDecodable<T: Decodable>: Decodable {
    let value: T?
    
    init(from decoder: Decoder) throws {
        let container = try decoder.singleValueContainer()
        self.value = try? container.decode(T.self)
    }
}

@BackgroundActor
struct FailableDecodable<T: Decodable>: Decodable {
    let value: T?
    
    init(from decoder: Decoder) throws {
        // This doesn't consume/advance the decoder position
        self.value = try? T(from: decoder)
    }
}
