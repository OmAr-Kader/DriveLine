//
//  ShortVideo.swift
//  DriveLine
//
//  Created by OmAr Kader on 10/11/2025.
//

import AVKit
import Combine
import SwiftUISturdy
import SwiftUIMacroSturdy

@BackgroundActor
@SturdyFilterCodable(shouldHaveEmptyInit: true)
struct ShortVideo: Codable {
    let id: String
    @CodableKey("title")
    let text: String
    let userId: String
    let link: String
    let thumbImageName: String
    @CodableEmptyInit([])
    let tags: [Int]
    let views: Int
    //@CodableEmptyInit(Date.now)
    let createdAt: Date
    
    init(from decoder: any Decoder) throws {
        let container = try decoder.container(keyedBy: CodingKeys.self)
        self.id = try container.decode(String.self, forKey: .id)
        self.text = try container.decode(String.self, forKey: .text)
        self.userId = try container.decode(String.self, forKey: .userId)
        self.thumbImageName = "https://upload.wikimedia.org/wikipedia/commons/thumb/3/35/Neckertal_20150527-6384.jpg/1920px-Neckertal_20150527-6384.jpg"//try container.decode(String.self, forKey: .thumbImageName)
        self.link = "https://test-videos.co.uk/vids/bigbuckbunny/mp4/h264/1080/Big_Buck_Bunny_1080_10s_1MB.mp4"//try container.decode(String.self, forKey: .link)
        self.tags = try container.decode([Int].self, forKey: .tags)
        self.views = try container.decode(Int.self, forKey: .views)
        self.createdAt = try container.decodeISO8601Date(forKey: .createdAt)
    }
}

@BackgroundActor
@SturdyFilterCodable
struct ShortVideoUser: Codable {
    let id: String
    let title: String
    let user: UserShort
    let link: String
    let thumbImageName: String
    let tags: [Int]
    let views: Int
    let createdAt: Date
    
    init(from decoder: any Decoder) throws {
        let container = try decoder.container(keyedBy: CodingKeys.self)
        self.id = try container.decode(String.self, forKey: .id)
        self.title = try container.decode(String.self, forKey: .title)
        self.user = try container.decode(UserShort.self, forKey: .user)
        self.thumbImageName = "https://upload.wikimedia.org/wikipedia/commons/thumb/3/35/Neckertal_20150527-6384.jpg/1920px-Neckertal_20150527-6384.jpg"//try container.decode(String.self, forKey: .thumbImageName)
        self.link = "https://test-videos.co.uk/vids/bigbuckbunny/mp4/h264/1080/Big_Buck_Bunny_1080_10s_1MB.mp4"//try container.decode(String.self, forKey: .link)
        self.tags = try container.decode([Int].self, forKey: .tags)
        self.views = try container.decode(Int.self, forKey: .views)
        self.createdAt = try container.decodeISO8601Date(forKey: .createdAt)
    }
}

@BackgroundActor
@SturdyFilterCodable
struct UserShort: Codable {
    let id: String
    let name: String
    let role: String
    let image: String?
    
}

@BackgroundActor
struct UpdateShortVideoTags: Codable {
    let tags: [Int]
}

@BackgroundActor
struct GetShortsRespond: Codable {
    let data: [ShortVideo]
    init(from decoder: Decoder) throws {
        let container = try decoder.container(keyedBy: CodingKeys.self)
        
        // Attempt to decode as array, filter out invalid items
        self.data = (try? container.decode([FailableDecodable<ShortVideo>].self, forKey: .data))?
            .compactMap { $0.value } ?? []
    }
}

@BackgroundActor
struct ShortUserVideoList: Codable {
    let videos: [ShortVideoUser]
    
    init(from decoder: Decoder) throws {
        let container = try decoder.container(keyedBy: CodingKeys.self)
        
        // Attempt to decode as array, filter out invalid items
        self.videos = (try? container.decode([FailableDecodable<ShortVideoUser>].self, forKey: .videos))?
            .compactMap { $0.value } ?? []
    }
}

@BackgroundActor
struct ShortVideoList: Codable {
    let videos: [ShortVideo]
}

@BackgroundActor
struct GetShortsWithUserRespond: Codable {
    let data: ShortUserVideoList
    
    init(from decoder: Decoder) throws {
        let container = try decoder.container(keyedBy: CodingKeys.self)
        
        // Attempt to decode as array, filter out invalid items
        self.data = try container.decode(ShortUserVideoList.self, forKey: .data)
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
        "\(_id)\(title)\(link)"
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
        self.title = short.text
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
        "\(_id)\(title)\(link)"
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
        self.title = short.text
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
