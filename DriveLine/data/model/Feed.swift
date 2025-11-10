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
}

struct ShortVideo: Identifiable {
    var id: String {
        videoURL.absoluteString + thumbImageName + ((player != nil) ? "player" : "nil")
    }
    
    let thumbImageName: String   // for preview; can be a remote URL string if you adapt
    let videoURL: URL
    let viewsText: String
    var player: AVPlayer?
    
    func copy(player: AVPlayer?) -> Self {
        ShortVideo(thumbImageName: thumbImageName, videoURL: videoURL, viewsText: viewsText, player: player)
    }
}
