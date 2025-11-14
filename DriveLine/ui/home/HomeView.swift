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
    @Orientation private var orientation

    // For adaptive grid columns based on orientation/size
    @Environment(\.horizontalSizeClass) private var hSizeClass
    @Environment(\.verticalSizeClass) private var vSizeClass
    
    var body: some View {
        ScrollView {
            VStack(alignment: .leading) {
                headerView
                Spacer().height(24)
                paidCoursesPager
                Spacer().height(24)
                pagerIndicator
                Spacer().height(24)
                Text("GearUp Reels")
                    .font(.title2)
                    .bold()
                    .padding(.horizontal)
                Spacer().height(24)
                videosGrid()
            }.padding(.all, 0)
        }
    }
    
    @ViewBuilder
    private var headerView: some View {
        VStack(alignment: .leading) {
            Text("Welcome back")
                .font(.title2)
                .foregroundColor(.secondary)
            Spacer().height(6)
            Text("Domen")
                .font(.largeTitle)
                .bold()
            Spacer().height(6)
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
                Button {
                    navigator.navigateTo(.COURCES_LIST_SCREEN_ROUTE)
                } label: {
                    Text("view all")
                        .font(.subheadline)
                        .foregroundColor(Color.blue)
                }
            }.padding(.horizontal)
            
            TabView(selection: $selectedPage) {
                ForEach(Array(obs.state.courses.enumerated()), id: \.offset) { idx, course in
                    CourseCardItem(course: course)
                        .frame(height: 160)
                        .padding(15)
                        .tag(idx)
                }
            }
            .frame(height: 190)
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
    private func videosGrid() -> some View {
        // Determine orientation: portrait if height >= width
        let isPortrait = orientation.isPortrait
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
            //startPlayingMuted()
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

