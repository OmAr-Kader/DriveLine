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
