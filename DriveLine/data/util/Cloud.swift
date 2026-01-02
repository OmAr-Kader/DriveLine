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
public struct EncryptedCloud: Codable {
    let encrypted: String
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


enum CryptoMode: String {
    case doubleCrypto = "x-double-crypto"
    case sendOnly = "x-send-crypto"
    case receiveOnly = "x-receive-crypto"
}


extension URLSession {
    
    public static var skipCacheResult: URLSession {
        let config = URLSessionConfiguration.default
        config.waitsForConnectivity = true
        config.timeoutIntervalForRequest = 30
        config.timeoutIntervalForResource = 300
        config.httpMaximumConnectionsPerHost = 5
        
        // Smart caching
        config.requestCachePolicy = .reloadIgnoringLocalCacheData
        config.urlCache = URLCache(
            memoryCapacity: 50_000_000,  // 50 MB
            diskCapacity: 100_000_000     // 100 MB
        )
        config.tlsMinimumSupportedProtocolVersion = .TLSv12
        config.tlsMaximumSupportedProtocolVersion = .TLSv13
        
        config.httpShouldSetCookies = true
        config.httpCookieAcceptPolicy = .onlyFromMainDocumentDomain
        
        return URLSession(configuration: config, delegate: ServerTrustDelegate.shared, delegateQueue: nil)
    }
    
    /// A shared `URLSession` optimized for general use:
    /// - Enables HTTP pipelining and waits for connectivity.
    /// - Longer resource timeout and limited connections per host.
    /// - Uses an NO CACHE.
    public static var disableCache: URLSession {
        let config = URLSessionConfiguration.default
        config.waitsForConnectivity = true
        config.timeoutIntervalForRequest = 30
        config.timeoutIntervalForResource = 300
        config.httpMaximumConnectionsPerHost = 5
        
        config.tlsMinimumSupportedProtocolVersion = .TLSv12
        config.tlsMaximumSupportedProtocolVersion = .TLSv13
        
        config.httpShouldSetCookies = true
        config.httpCookieAcceptPolicy = .onlyFromMainDocumentDomain
        
        return URLSession(configuration: config, delegate: ServerTrustDelegate.shared, delegateQueue: nil)
    }
    
    /// A short-lived, ephemeral `URLSession` for sensitive requests:
    /// - No persistent disk cache; uses ephemeral configuration.
    /// - Shorter request timeout suitable for quick secure operations.
    public static var secure: URLSession {
        let config = URLSessionConfiguration.ephemeral
        config.timeoutIntervalForRequest = 15
        
        config.tlsMinimumSupportedProtocolVersion = .TLSv12
        config.tlsMaximumSupportedProtocolVersion = .TLSv13
        
        config.httpShouldSetCookies = true
        config.httpCookieAcceptPolicy = .onlyFromMainDocumentDomain
        return URLSession(configuration: config, delegate: ServerTrustDelegate.shared, delegateQueue: nil)
    }
}
