//
//  Gemini.swift
//  DriveLine
//
//  Created by OmAr Kader on 11/11/2025.
//

import Foundation
import SwiftUISturdy

@BackgroundActor
struct GeminiRequest: Codable, Sendable {
    struct Content: Codable, Sendable {
        struct Part: Codable, Sendable {
            let text: String
        }
        let parts: [Part]
    }
    let contents: [Content]
}

@BackgroundActor
struct GeminiResponse: Codable, Sendable {
    struct Candidate: Codable, Sendable {
        struct Content: Codable, Sendable {
            struct Part: Codable {
                let text: String?
            }
            let parts: [Part]
        }
        let content: Content
    }
    let candidates: [Candidate]?
}

enum GeminiError: Error, LocalizedError {
    case invalidURL
    case invalidResponse
    case apiError(status: Int, message: String)
    case noContent

    var errorDescription: String? {
        switch self {
        case .invalidURL:
            return "Invalid URL."
        case .invalidResponse:
            return "Invalid response."
        case .apiError(let status, let message):
            return "API error \(status): \(message)"
        case .noContent:
            return "No content returned."
        }
    }
}
