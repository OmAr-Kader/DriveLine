//
//  Course.swift
//  DriveLine
//
//  Created by OmAr Kader on 10/11/2025.
//

import AVKit
import Combine
import SwiftUI

struct Course: Identifiable {
    let id = UUID()
    let index: Int
    let title: String
    let subtitle: String
    let price: String
    let gradient: [Color]
    
    static var temp: [Course] {
        [
            Course(index: 1,
                   title: "Uniform driving\nhours (colved)",
                   subtitle: "01",
                   price: "39.00 €",
                   gradient: [Color(#colorLiteral(red: 0.098, green: 0.48, blue: 1.0, alpha: 1.0)),
                              Color(#colorLiteral(red: 0.443, green: 0.69, blue: 1.0, alpha: 1.0))]),
            Course(index: 2,
                   title: "Uniform driving\nhours (colved)",
                   subtitle: "02",
                   price: "1120.00 €",
                   gradient: [Color(#colorLiteral(red: 1, green: 0.86, blue: 0.09, alpha: 1.0)),
                              Color(#colorLiteral(red: 1, green: 0.94, blue: 0.7, alpha: 1.0))])
        ]
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
