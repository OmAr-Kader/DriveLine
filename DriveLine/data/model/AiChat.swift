//
//  AiChat.swift
//  DriveLine
//
//  Created by OmAr Kader on 06/11/2025.
//

import Foundation
import SwiftUISturdy

// MARK: - Create Session Request
@BackgroundActor
struct CreateSessionRequest: Codable {
    let title: String
    let text: String
    let isUser: Bool
}

// MARK: - Create Session Response
@BackgroundActor
struct CreateSessionResponse: Codable {
    let session: AiSession
    let message: AiMessage
}

// MARK: - Create Message Request
@BackgroundActor
struct CreateMessageRequest: Codable {
    let sessionId: String
    let text: String
    let isUser: Bool
}

@BackgroundActor
struct PushMessageRequest: Codable {
    let sessionId: String
    let text: String
    let saveQuestion: Bool
    let isTemp: Bool
}

@BackgroundActor
struct AiSession: Codable, Identifiable {
    let id: String
    let title: String
    let lastMessage: String
    let createdAt: Date
    let updatedAt: Date

    enum CodingKeys: String, CodingKey {
        case id
        case title
        case lastMessage
        case createdAt
        case updatedAt
    }

    init(from decoder: Decoder) throws {
        let container = try decoder.container(keyedBy: CodingKeys.self)
        id = try container.decode(String.self, forKey: .id)
        title = try container.decode(String.self, forKey: .title)
        lastMessage = try container.decode(String.self, forKey: .lastMessage)
        createdAt = try container.decodeISO8601Date(forKey: .createdAt)
        updatedAt = try container.decodeISO8601Date(forKey: .updatedAt)
    }
    
    func encode(to encoder: any Encoder) throws {
        var container = encoder.container(keyedBy: CodingKeys.self)
        try container.encode(id, forKey: .id)
        try container.encode(title, forKey: .title)
        try container.encode(lastMessage, forKey: .lastMessage)
        try container.encode(createdAt, forKey: .createdAt)
    }
}

@BackgroundActor
struct GetSessionsResponse: Codable {
    let sessions: [AiSession]
    
    init(from decoder: any Decoder) throws {
        let container = try decoder.container(keyedBy: CodingKeys.self)
        self.sessions = try container.decode([AiSession].self, forKey: .sessions)
    }
}

@MainActor
struct AiSessionData: Identifiable, Equatable, Sendable, Hashable {
    let idCloud: String
    let title: String
    let lastMessage: String
    let updatedAt: Date
    
    var id: String {
        "\(idCloud)\(updatedAt.toStringAFormat())\(lastMessage)\(title)"
    }
    
    static func == (lhs: Self, rhs: Self) -> Bool {
        lhs.id == rhs.id
    }
    
    init(id: String, title: String, lastMessage: String, updatedAt: Date = .now) {
        self.idCloud = id
        self.title = title
        self.lastMessage = lastMessage
        self.updatedAt = updatedAt
    }
    
    init(title: String, lastMessage: String, updatedAt: Date = .now) {
        self.idCloud = ""
        self.title = title
        self.lastMessage = lastMessage
        self.updatedAt = updatedAt
    }
    
    init(_ session: AiSession) {
        self.idCloud = session.id
        self.title = session.title
        self.lastMessage = session.lastMessage
        self.updatedAt = session.updatedAt
    }
}


// MARK: - Message Model
@BackgroundActor
struct AiMessage: Codable {
    let id: String
    let sessionId: String
    let text: String
    let isUser: Bool
    let createdAt: Date
    
    enum CodingKeys: String, CodingKey {
        case id
        case sessionId
        case text
        case isUser
        case createdAt
    }
    
    init(from decoder: Decoder) throws {
        let container = try decoder.container(keyedBy: CodingKeys.self)
        id = try container.decode(String.self, forKey: .id)
        sessionId = try container.decode(String.self, forKey: .sessionId)
        text = try container.decode(String.self, forKey: .text)
        isUser = try container.decode(Bool.self, forKey: .isUser)
        createdAt = try container.decodeISO8601Date(forKey: .createdAt)
    }
    
    func encode(to encoder: Encoder) throws {
        var container = encoder.container(keyedBy: CodingKeys.self)
        try container.encode(id, forKey: .id)
        try container.encode(sessionId, forKey: .sessionId)
        try container.encode(text, forKey: .text)
        try container.encode(isUser, forKey: .isUser)
    }
}

@BackgroundActor
struct GetMessagesResponse: Codable {
    let messages: [AiMessage]
}


@MainActor
struct AiMessageData: Identifiable, Equatable, Sendable {
    var idCloud: String
    let text: String
    let isUser: Bool
    let createdAt: Date
    var isFailedToUpload: Bool
    
    var id: String {
        "\(idCloud)\(text)"
    }

    static func == (lhs: Self, rhs: Self) -> Bool {
        lhs.id == rhs.id
    }
    
    init(text: String, isUser: Bool, createdAt: Date = .now) {
        self.idCloud = Const.AI_MESSAGE_LOCAL + UUID().uuidString
        self.text = text
        self.isUser = isUser
        self.createdAt = createdAt
        self.isFailedToUpload = false
    }

    init(idCloud: String, text: String, isUser: Bool, createdAt: Date = .now, isFailedToUpload: Bool = false) {
        self.idCloud = idCloud
        self.text = text
        self.isUser = isUser
        self.createdAt = createdAt
        self.isFailedToUpload = isFailedToUpload
    }
    
    init(_ message: AiMessage) {
        self.idCloud = message.id
        self.text = message.text
        self.isUser = message.isUser
        self.createdAt = message.createdAt
        self.isFailedToUpload = false
    }
    
    func copy(isFailedToUpload: Bool) -> Self {
        .init(idCloud: idCloud, text: text, isUser: isUser, createdAt: createdAt, isFailedToUpload: isFailedToUpload)
    }
}


// MARK: - Delete Response
struct DeleteResponse: Codable {
    let success: Bool
}
