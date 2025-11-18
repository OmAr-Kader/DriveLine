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
struct VideoFeedScreen: View {
    
    let navigator: Navigator

    @State private var currentIndex: Int = -1
    @State private var shortVideos: [ShortVideoUserData] = []
    @State private var isInitialed = false

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
                            if let player, currentReadyLink == item.link {
                                VideoPlayer(player: player)
                                    .safeAreaPadding(.bottom, 60)
                                    .safeAreaPadding(.top, 80)
                            } else {
                                LoadingScreen(color: .textOfApp, backDarkAlpha: .backDarkAlpha, isLoading: true)
                                    .safeAreaPadding(.bottom, 60)
                                    .safeAreaPadding(.top, 80)
                            }
                            barDetail.onBottom()
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
                
                
            }.onChange(currentIndex, onChangeIndex)
            .background(TransparentNavigationBar()) // Apply transparency
            .toolbarBackground(.hidden)
            .navigationBarBackButtonHidden(false)
            .apply {
                if #available(iOS 26, *) {
                    $0.scrollEdgeEffectStyle(.soft, for: .top)
                        .scrollEdgeEffectHidden(true, for: .top)
                }
            }.toolbar {
                ToolbarItem(placement: .principal) {
                    HStack(alignment: .center) {
                    }.width(1500)
                }
            }.onAppeared {
                guard let config = navigator.screenConfig(.VIDEO_SHORT_SCREEN_ROUTE) as? VideoFeedConfig else { return }
                self.shortVideos = config.shorts
                self.currentIndex = config.currentIndex
                initial(url: config.shorts[safe: config.currentIndex]?.videoURL)
            }.onDisappear {
                player?.pause()
                sinkCancel?.cancel()
                sinkCancel = nil
                player = nil
            }
    }
    
    private func initial(url: URL?) {
        guard  let url else { return }
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
                currentReadyLink = shortVideos[currentIndex].link
            }
    }

    @ViewBuilder
    var barDetail: some View {
        let short = shortVideos[currentIndex]
        HStack(alignment: .center) {
            if let profileImage = short.user.image {
                KingsImage(urlString: profileImage, size: CGSize(width: 40, height: 40), radius: 20, backColor: .backDarkSec)
                    .clipShape(Circle())
            } else {
                Image(systemName: "person.circle.fill")
                    .resizable()
                    .scaledToFill()
                    .frame(width: 40, height: 40)
                    .clipShape(Circle())
            }
            Spacer(minLength: 0).width(7)
            VStack(alignment: .leading) {
                Text("\(short.title)")
                    .font(.subheadline)
                    .bold()
                Spacer().height(1)
                Text("\(short.user.name)")
                    .font(.subheadline)
            }
            Spacer()
        }.height(50).onTapGesture {
            navigator.navigateToScreen(ProfileVisitorConfig(userShort: short.user), .PROFILE_VISITOR_SCREEN_ROUTE)
        }.safeAreaPadding(.all)
    }
    
    @MainActor
    private func onChangeIndex(_ new: Int) {
        guard isInitialed else {
            isInitialed = true
            return
        }
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
                guard status == .readyToPlay else { return }
                
                player?.play()
                sinkCancel?.cancel()
                sinkCancel = nil
                currentReadyLink = shortVideos[currentIndex].link
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
