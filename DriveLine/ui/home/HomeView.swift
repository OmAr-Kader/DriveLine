//
//  HomeView.swift
//  DriveLine
//
//  Created by OmAr Kader on 05/11/2025.
//

import SwiftUI
import SwiftUISturdy
import AVKit
import Combine
import Foundation

// MARK: - Views
@MainActor
struct HomeView: View {

    let navigator: Navigator

    @Binding var obs: HomeObserve

    @State private var selectedPage = 0
    
    // For adaptive grid columns based on orientation/size
    @Environment(\.horizontalSizeClass) private var hSizeClass
    @Environment(\.verticalSizeClass) private var vSizeClass
    
    var body: some View {
        GeometryReader { geo in
            ScrollView {
                VStack(alignment: .leading, spacing: 24) {
                    headerView
                    paidCoursesPager
                    pagerIndicator
                    Text("GearUp Reels")
                        .font(.title2)
                        .bold()
                        .padding(.horizontal)
                    
                    videosGrid(for: geo.size)
                }
                .padding(.top, 20)
            }
            .frame(width: geo.size.width, height: geo.size.height)
        }
    }
    
    @ViewBuilder
    private var headerView: some View {
        VStack(alignment: .leading, spacing: 6) {
            Text("Welcome back")
                .font(.title2)
                .foregroundColor(.secondary)
            Text("Domen")
                .font(.largeTitle)
                .bold()
            Text("10,12,2023")
                .font(.subheadline)
                .foregroundColor(.secondary)
        }
        .padding(.horizontal)
    }
    
    @ViewBuilder
    private var paidCoursesPager: some View {
        VStack(alignment: .leading) {
            HStack {
                Text("Our all course:")
                    .font(.headline)
                Spacer()
                Button(action: {
                    // action for view all
                }) {
                    Text("view all")
                        .font(.subheadline)
                        .foregroundColor(Color.blue)
                }
            }
            .padding(.horizontal)
            
            TabView(selection: $selectedPage) {
                ForEach(Array(obs.state.courses.enumerated()), id: \.1.id) { idx, course in
                    CourseCardView(course: course)
                        .padding(.horizontal, 16)
                        .tag(idx)
                }
            }
            .frame(height: 160)
            .tabViewStyle(PageTabViewStyle(indexDisplayMode: .never))
        }
    }
    
    @ViewBuilder
    private var pagerIndicator: some View {
        HStack(spacing: 8) {
            ForEach(0..<obs.state.courses.count, id: \.self) { idx in
                Circle()
                    .fill(idx == selectedPage ? Color.blue : Color.gray.opacity(0.3))
                    .frame(width: idx == selectedPage ? 10 : 8, height: idx == selectedPage ? 10 : 8)
                    .animation(.easeInOut, value: selectedPage)
            }
        }
        .frame(maxWidth: .infinity)
        .padding(.top, 6)
    }
    
    @ViewBuilder
    private func videosGrid(for size: CGSize) -> some View {
        // Determine orientation: portrait if height >= width
        let isPortrait = size.height >= size.width
        // Columns: 3 in portrait, 6 in landscape
        let columnsCount = isPortrait ? 3 : 6
        let gridItem = Array(repeating: GridItem(.flexible(), spacing: 12), count: columnsCount)
        LazyVGrid(columns: gridItem, spacing: 12) {
            ForEach(Array(obs.state.shortVideos.enumerated()), id: \.offset) { index, item in
                ShortVideoTile(item: item) { player in
                    let edit = obs.state.shortVideos.editItem(where: { $0.videoLink == item.videoLink }, edit: { $0.player = player })
                    withAnimation {
                        obs.updateVideos(edit)
                    }
                }.frame(height: isPortrait ? 140 : 120).onTapGesture {
                    self.obs.setFeedIndex((index, true))
                }
            }
        }.padding([.horizontal, .bottom])
    }
}

fileprivate struct CourseCardView: View {
    let course: Course
    
    var body: some View {
        ZStack(alignment: .leading) {
            RoundedRectangle(cornerRadius: 18, style: .continuous)
                .fill(LinearGradient(gradient: Gradient(colors: course.gradient),
                                     startPoint: .topLeading,
                                     endPoint: .bottomTrailing))
                .shadow(color: Color.black.opacity(0.12), radius: 6, x: 0, y: 4)
            VStack(alignment: .leading, spacing: 6) {
                Text(String(format: "%02d", course.index))
                    .font(.title2)
                    .bold()
                    .foregroundColor(.white.opacity(0.95))
                Text(course.title)
                    .foregroundColor(.white)
                    .font(.subheadline)
                    .lineLimit(2)
                Spacer()
                Text(course.price)
                    .font(.title3)
                    .bold()
                    .foregroundColor(.white)
            }
            .padding(18)
        }
        .frame(maxWidth: .infinity)
    }
}

fileprivate struct ShortVideoTile: View {
    let item: ShortVideo
    let addPlayer: @MainActor (AVPlayer) -> Void
    
    @State private var sinkCancel: AnyCancellable?
    @State private var showPlayer: Bool = false
    
    var body: some View {
        ZStack(alignment: .bottom) {
            Rectangle()
                .foregroundColor(Color.gray.opacity(0.15))
                .overlay(
                    Group {
                        if let player = item.player, showPlayer {
                            SimpleVideoFill(player: player)
                                .clipped()
                                .animation(.smooth, value: true)
                        } else {
                            if UIImage(named: item.thumbImageName) != nil {
                                Image(item.thumbImageName)
                                    .resizable()
                                    .scaledToFill()
                                    .clipped()
                            } else {
                                LinearGradient(gradient: Gradient(colors: [Color.purple.opacity(0.6), Color.blue.opacity(0.4)]), startPoint: .top, endPoint: .bottom)
                            }
                        }
                    }
                ).cornerRadius(8).contentShape(Rectangle())
            LinearGradient(
                gradient: Gradient(colors: [Color.black.opacity(0.2), Color.black.opacity(0.7)]),
                startPoint: .top,
                endPoint: .bottom
            ).cornerRadius(10)
            
            Text(item.viewsText)
                .font(.caption)
                .foregroundColor(.white)
                .padding(6)
                .background(Color.black.opacity(0.5))
                .cornerRadius(6)
                .padding(8)
        }.onAppear {
            startPlayingMuted()
        }.onDisappear {
            stopAndCleanup()
        }
    }
    
    @MainActor
    private func startPlayingMuted() {
        if let player = item.player {
            guard player.timeControlStatus != .playing else { return }
            player.play()
            withAnimation {
                showPlayer = true
            }
        } else {
            guard sinkCancel == nil else { return }
            let player = AVPlayer(url: item.videoURL!)
            player.isMuted = true
            sinkCancel = player.currentItem?.publisher(for: \.status)
                .sink { status in
                    guard status == .readyToPlay else { return }
                    if let duration = player.currentItem?.duration {
                        player.seek(to: CMTime(seconds: duration.seconds * 0.1, preferredTimescale: 600))
                    }
                    player.play()
                    sinkCancel?.cancel()
                    sinkCancel = nil
                    showPlayer = true
                    addPlayer(player)
                }
        }
    }
    
    private func stopAndCleanup() {
        showPlayer = false
        item.player?.pause()
    }
}

fileprivate final class FillPlayerView: UIView {
    override class var layerClass: AnyClass { AVPlayerLayer.self }
    
    var player: AVPlayer? {
        get { (layer as! AVPlayerLayer).player }
        set {
            (layer as! AVPlayerLayer).player = newValue
        }
    }
    
    func configure(player: AVPlayer, gravity: AVLayerVideoGravity = .resizeAspectFill) {
        self.player = player
        let playerLayer = layer as! AVPlayerLayer
        playerLayer.videoGravity = gravity
        // ensure the layer matches view bounds
        playerLayer.frame = bounds
        playerLayer.needsDisplayOnBoundsChange = true
    }
    
    override func layoutSubviews() {
        super.layoutSubviews()
        (layer as! AVPlayerLayer).frame = bounds
    }
}

fileprivate struct SimpleVideoFill: UIViewRepresentable {
    let player: AVPlayer
    
    func makeUIView(context: Context) -> FillPlayerView {
        let view = FillPlayerView()
        view.configure(player: player)
        return view
    }
    
    func updateUIView(_ uiView: FillPlayerView, context: Context) {
        uiView.configure(player: player)
    }
}

