//
//  VideoFeedScreen.swift
//  DriveLine
//
//  Created by OmAr Kader on 13/11/2025.
//

import SwiftUI
import AVKit
import Combine
import SwiftUISturdy

@MainActor
struct VideoFeed: View {
    
    @Binding var currentIndex: Int
    let shortVideos: [ShortVideo]

    @State private var player: AVPlayer? = nil
    @State private var currentReadyLink: String = ""
    @State private var sinkCancel: AnyCancellable?
    @State private var boundaryObserverToken: Any?
    
    var body: some View {
        ZStack {
            ScrollView {
                LazyVStack(spacing: 0.0) {
                    ForEach(Array(shortVideos.enumerated()), id: \.offset) { index, item in
                        ZStack {
                            if let player, currentReadyLink == item.videoLink {
                                VideoPlayer(player: player)
                                    .safeAreaPadding(.bottom, 50)
                                    .safeAreaPadding(.top, 80)
                            } else {
                                LoadingScreen(color: .textOfApp, backDarkAlpha: .backDarkAlpha, isLoading: true)
                            }
                        }.background(.black)
                            .containerRelativeFrame(.vertical)
                            .id(index)
                    }
                }.scrollTargetLayout()
            }
        }.scrollTargetBehavior(.paging)
            .scrollIndicators(.hidden)
            .ignoresSafeArea()
            .scrollPosition(id: Binding<Int?>(get: { currentIndex }, set: {
                LogKit.print("---> \($0 ?? -1)")
                guard let newValue = $0 else { return }
                currentIndex = newValue
                
            })).onAppeared {
                guard  let url = shortVideos[currentIndex].videoURL else { return }
                do {
                    try AVAudioSession.sharedInstance().setCategory(.playback, mode: .default)
                    try AVAudioSession.sharedInstance().setActive(true)
                } catch {}
                
                let player = AVPlayer(url: url)
                player.actionAtItemEnd = .none
                sinkCancel = player.currentItem?.publisher(for: \.status)
                    .sink { status in
                        let _ = LogKit.print("-- publisher --", status == .readyToPlay)
                        guard status == .readyToPlay else { return }
                        
                        self.player = player
                        player.play()
                        sinkCancel?.cancel()
                        sinkCancel = nil
                        currentReadyLink = shortVideos[currentIndex].videoLink
                    }
                
            }.onChange(currentIndex, onChangeIndex)
            .background(TransparentNavigationBar()) // Apply transparency
            .toolbarBackground(.hidden)
            .navigationBarBackButtonHidden(false)
            .apply {
                if #available(iOS 26, *) {
                    $0.scrollEdgeEffectStyle(.soft, for: .top)
                        .scrollEdgeEffectHidden(true, for: .top)
                }
            }
            .toolbar {
                ToolbarItem(placement: .principal) {
                    HStack(alignment: .center) {
                    }.width(1500)
                }
            }
            .onDisappear {
                player?.pause()
                sinkCancel?.cancel()
                sinkCancel = nil
                player = nil
            }
    }
    
    @MainActor
    private func onChangeIndex(_ new: Int) {
        let _ = LogKit.print("-- onChangeIndex --", shortVideos[new].videoLink)
        guard let url = shortVideos[new].videoURL else { return }
        let newItem = AVPlayerItem(url: url)
        sinkCancel?.cancel()
        sinkCancel = nil
        if player?.timeControlStatus != .paused {
            player?.pause()
        }
        player?.replaceCurrentItem(with: newItem)
        sinkCancel = player?.currentItem?.publisher(for: \.status)
            .sink { [weak player] status in
                let _ = LogKit.print("-- publisher --", status == .readyToPlay)
                guard status == .readyToPlay else { return }
                
                player?.play()
                sinkCancel?.cancel()
                sinkCancel = nil
                currentReadyLink = shortVideos[currentIndex].videoLink
            }
    }
}


struct TransparentNavigationBar: UIViewControllerRepresentable {
    func makeUIViewController(context: Context) -> UIViewController {
        let controller = UIViewController()
        
        // Make navigation bar transparent
        if let navBar = controller.navigationController?.navigationBar {
            let appearance = UINavigationBarAppearance()
            appearance.configureWithTransparentBackground()
            navBar.standardAppearance = appearance
            navBar.scrollEdgeAppearance = appearance
            navBar.compactAppearance = appearance
        }
        
        return controller
    }
    
    func updateUIViewController(_ uiViewController: UIViewController, context: Context) {}
}
