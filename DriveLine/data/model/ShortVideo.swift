//
//  ShortVideo.swift
//  DriveLine
//
//  Created by OmAr Kader on 10/11/2025.
//

import AVKit
import Combine
import SwiftUISturdy

@BackgroundActor
struct ShortVideo: Codable {
    let id: String
    let title: String
    let userId: String
    let link: String
    let thumbImageName: String
    let tags: [Int]
    let views: Int
    let createdAt: Date
    
    init(id: String, title: String, userId: String, link: String, thumbImageName: String, tags: [Int], views: Int, createdAt: Date) {
        self.id = id
        self.title = title
        self.userId = userId
        self.link = link
        self.thumbImageName = thumbImageName
        self.tags = tags
        self.views = views
        self.createdAt = createdAt
    }
    
    init(from decoder: any Decoder) throws {
        let container = try decoder.container(keyedBy: CodingKeys.self)
        self.id = try container.decode(String.self, forKey: .id)
        self.title = try container.decode(String.self, forKey: .title)
        self.userId = try container.decode(String.self, forKey: .userId)
        self.thumbImageName = try container.decode(String.self, forKey: .thumbImageName)
        self.link = try container.decode(String.self, forKey: .link)
        self.tags = try container.decode([Int].self, forKey: .tags)
        self.views = try container.decode(Int.self, forKey: .views)
        self.createdAt = try container.decodeISO8601Date(forKey: .createdAt)
    }
    
    enum CodingKeys : String, CodingKey {
        case id = "_id"
        case title
        case userId
        case link
        case thumbImageName
        case tags
        case views
        case createdAt
    }
}

@BackgroundActor
struct ShortVideoUser: Codable {
    let id: String
    let title: String
    let user: UserShort
    let link: String
    let thumbImageName: String
    let tags: [Int]
    let views: Int
    let createdAt: Date
    
    init(id: String, title: String, user: UserShort, link: String, thumbImageName: String, tags: [Int], views: Int, createdAt: Date) {
        self.id = id
        self.title = title
        self.user = user
        self.thumbImageName = thumbImageName
        self.link = link
        self.tags = tags
        self.views = views
        self.createdAt = createdAt
    }
    
    
    init(from decoder: any Decoder) throws {
        let container = try decoder.container(keyedBy: CodingKeys.self)
        self.id = try container.decode(String.self, forKey: .id)
        self.title = try container.decode(String.self, forKey: .title)
        self.user = try container.decode(UserShort.self, forKey: .user)
        self.thumbImageName = try container.decode(String.self, forKey: .thumbImageName)
        self.link = try container.decode(String.self, forKey: .link)
        self.tags = try container.decode([Int].self, forKey: .tags)
        self.views = try container.decode(Int.self, forKey: .views)
        self.createdAt = try container.decodeISO8601Date(forKey: .createdAt)
    }
    
    enum CodingKeys: String, CodingKey {
        case id = "_id"
        case title
        case user
        case link
        case thumbImageName
        case tags
        case views
        case createdAt
    }
    func encode(to encoder: Encoder) throws {
        var container = encoder.container(keyedBy: CodingKeys.self)
        // `id` is intentionally excluded
        try container.encode(title, forKey: .title)
        try container.encode(user, forKey: .user)
        try container.encode(link, forKey: .link)
        try container.encode(thumbImageName, forKey: .thumbImageName)
        try container.encode(tags, forKey: .tags)
        try container.encode(views, forKey: .views)
        try container.encode(createdAt, forKey: .createdAt)
    }
}

@BackgroundActor
struct UserShort: Codable {
    let id: String
    let name: String
    let role: String
    let image: String?
    
    init(id: String, name: String, role: String, image: String?) {
        self.id = id
        self.name = name
        self.role = role
        self.image = image
    }
    
    init(from decoder: any Decoder) throws {
        let container = try decoder.container(keyedBy: CodingKeys.self)
        self.id = try container.decode(String.self, forKey: .id)
        self.name = try container.decode(String.self, forKey: .name)
        self.role = try container.decode(String.self, forKey: .role)
        self.image = try container.decodeIfPresent(String.self, forKey: .image)
    }
    
    enum CodingKeys: String, CodingKey {
        case id = "_id", name, role, image
    }
}

@BackgroundActor
struct UpdateShortVideoTags: Codable {
    let tags: [Int]
}

@BackgroundActor
struct GetShortsRespond: Codable {
    let data: [ShortVideo]
}

@BackgroundActor
struct GetShortsWithUserRespond: Codable {
    let data: [ShortVideoUser]
    
    init(from decoder: Decoder) throws {
        let container = try decoder.container(keyedBy: CodingKeys.self)
        
        // Attempt to decode as array, filter out invalid items
        self.data = (try? container.decode([FailableDecodable<ShortVideoUser>].self, forKey: .data))?
            .compactMap { $0.value } ?? []
    }
}

@MainActor
struct ShortVideoData: Identifiable, Hashable {
    let _id: String
    let title: String
    let link: String
    let thumbImageName: String
    let tags: [Int]
    let views: Int
    let createdAt: Date

    var id: String {
        _id + title + link
    }
    
    var player: AVPlayer?
    
    var videoURL: URL? {
        URL(string: link)!
    }
    
    init(id: String, title: String, link: String, thumbImageName: String, tags: [Int], views: Int, createdAt: Date, player: AVPlayer? = nil) {
        self._id = id
        self.title = title
        self.link = link
        self.thumbImageName = thumbImageName
        self.tags = tags
        self.views = views
        self.createdAt = createdAt
        self.player = player
    }
    
    init(_ short: ShortVideo) {
        self._id = short.id
        self.title = short.title
        self.link = short.link
        self.thumbImageName = short.thumbImageName
        self.tags = short.tags
        self.views = short.views
        self.createdAt = short.createdAt
    }
    
    
    func copy(player: AVPlayer?) -> Self {
        ShortVideoData(id: _id, title: title, link: link, thumbImageName: thumbImageName, tags: tags, views: views, createdAt: createdAt, player: player)
    }
}

@MainActor
struct ShortVideoUserData: Identifiable, Hashable, Equatable {
    let _id: String
    let title: String
    let user: UserShortData
    let link: String
    let thumbImageName: String
    let tags: [Int]
    let views: Int
    let createdAt: Date

    var id: String {
        _id + title + link
    }
    var player: AVPlayer?
    
    var videoURL: URL? {
        URL(string: link)!
    }
    
    static func == (lhs: Self, rhs: Self) -> Bool {
        lhs.id == rhs.id
    }
    
    init(id: String, title: String, user: UserShortData, link: String, thumbImageName: String, tags: [Int], views: Int, createdAt: Date, player: AVPlayer? = nil) {
        self._id = id
        self.title = title
        self.user = user
        self.link = link
        self.thumbImageName = thumbImageName
        self.tags = tags
        self.views = views
        self.createdAt = createdAt
        self.player = player
    }
    
    init(_ short: ShortVideoUser) {
        self._id = short.id
        self.title = short.title
        self.user = UserShortData(short.user)
        self.link = short.link
        self.thumbImageName = short.thumbImageName
        self.tags = short.tags
        self.views = short.views
        self.createdAt = short.createdAt
    }
    
    init(_ user: User, short: ShortVideo) {
        self._id = short.id
        self.title = short.title
        self.user = UserShortData(id: user.id, name: user.name, role: user.role, image: user.image)
        self.link = short.link
        self.thumbImageName = short.thumbImageName
        self.tags = short.tags
        self.views = short.views
        self.createdAt = short.createdAt
        
    }
    
    func copy(player: AVPlayer?) -> Self {
        ShortVideoUserData(id: _id, title: title, user: user, link: link, thumbImageName: thumbImageName, tags: tags, views: views, createdAt: createdAt, player: player)
    }
}

@MainActor
struct UserShortData: Sendable, Identifiable, Hashable {
    let id: String
    let name: String
    let role: String
    let image: String?
    
    init(id: String, name: String, role: String, image: String?) {
        self.id = id
        self.name = name
        self.role = role
        self.image = image
    }
    
    init(_ short: UserShort) {
        self.id = short.id
        self.name = short.name
        self.role = short.role
        self.image = short.image
    }
    
}
