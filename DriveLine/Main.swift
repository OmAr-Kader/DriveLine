//
//  Main.swift
//  DriveLine
//
//  Created by OmAr Kader on 05/11/2025.
//

import SwiftUI
import SwiftUISturdy
import UniformTypeIdentifiers
import Combine

@MainActor
struct Main: View, Navigator {
    
    typealias Route = Screen

    @State var app: BaseAppObserve
    
    @NavState<Screen>
    private var navigationPath: NavigationPath
    
    @Inject
    private var theme: Theme
    
    var navigateTo: @MainActor (Screen) -> Void {
        return { screen in
            self.navigationPath.append(screen)
        }
    }
    
    @MainActor
    func navigateTo<T: Hashable>(screen: T) {
        self.navigationPath.append(screen)
    }

    var navigateToScreen: @MainActor (ScreenConfig, Screen) -> Void {
        return { args, screen in
            app.writeArguments(screen, args)
            self.navigationPath.append(screen)
        }
    }
    
    var navigateMain: @MainActor (Screen) -> Void {
        return { screen in
            withAnimation {
                self._navigationPath.mainScreen = screen
            }
        }
    }
    
    var navigateMainNoAnimation: @MainActor (Screen) -> Void {
        return { screen in
            withAnimation {
                self._navigationPath.mainScreen = screen
            }
        }
    }
    
    var backPress: @MainActor () -> Void {
        return {
            if !self.navigationPath.isEmpty {
                self.navigationPath.removeLast()
            }
        }
    }
    
    var backPressWithUpdate: @MainActor () -> Void {
        return {
            if !self.navigationPath.isEmpty {
                self.app.setNeedUpdate(true)
                self.navigationPath.removeLast()
            }
        }
    }
    
    var screenConfig: @MainActor (Screen) -> (any ScreenConfig)? {
        return { screen in
            return app.findArg(screen: screen)
        }
    }
    
    @MainActor
    init(app: BaseAppObserve, mainScreen: Screen) {
        self.app = app
        self._navigationPath = NavState(wrappedValue: NavigationPath(), mainScreen: mainScreen)
    }
    
    var body: some View {
        //let isSplash = app.state.homeScreen == Screen.SPLASH_SCREEN_ROUTE
        NavigationStack(path: $navigationPath) {
            targetScreen(
                _navigationPath.mainScreen, $app, navigator: self
            ).navigationDestination(for: Screen.self) { route in
                targetScreen(route, $app, navigator: self)
            }.navigationDestination(for: AiSessionData.self) { session in
                ChatScreen(app: $app, currentSessionId: session.idCloud)
            }
        }.tint(theme.textHintColor)
            .toolbarColorScheme(theme.isDarkMode ? .dark : .light, for: .tabBar)
            .toolbarColorScheme(theme.isDarkMode ? .dark : .light, for: .navigationBar)
        /*.onAppear {
            UIScrollView.appearance().bounces = false
        }*/
        /*.prepareStatusBarConfigurator(
          isSplash ? theme.background : theme.primary, isSplash, theme.isDarkStatusBarText
          )*/
    }
}

struct SplashScreen : View {
    
    private let theme = Theme(isDarkMode: UITraitCollection.current.userInterfaceStyle.isDarkMode)
    @State private var scale: Double = 1
    @State private var width: CGFloat = 50

    var body: some View {
        FullZStack {
            Image.initial("AppIcon".forImage())
                .scaleEffect(scale)
                .frame(width: width, height: width, alignment: .center)
                .onAppeared {
                    withAnimation(.easeInOut(duration: 0.7)) {
                        width = 150
                    }
                }
        }.ignoresSafeArea()
    }
}



struct HomeScreen: View {
    
    @Binding var app: BaseAppObserve
    let navigator: Navigator

    @State private var obs: HomeObserve = HomeObserve()
    
    var body: some View {
        ZStack {
            Group {
                if #available(iOS 18.0, *) {
                    home18
                } else {
                    home
                }
            }
        }.tint(.primaryOfApp).id("TabView").apply {
            switch obs.selectedTab {
            case .session: $0.visibleToolbar().toolbar(content: toolBarAiChatView)
            case .profile: $0.visibleToolbar().toolbar(content: toolBarProfileView)
            default: $0.hideToolbar()
            }
        }.onAppeared {
            obs.loadShorts(app.state.userBase)
        }.onChange(obs.selectedTab, onSelectedChange)
    }
    
    private func onSelectedChange(_ new: HomeTabs) {
        switch new {
        case .session: forSession()
        case .profile: forProfile()
        default: break
        }
    }
    
    private func forSession() {
        guard obs.state.aiSessions.isEmpty else { return }
        obs.fetchAiSessions(app.state.userBase)
    }
    
    private func forProfile() {
        //guard obs.state.user == nil else { return }
        obs.fetchProfile(app.state.userBase)
    }
    
    @available(iOS 18.0, *)
    @ViewBuilder
    var home18: some View {
        TabView(selection: obs.selectedTabBinding) {
            Tab("Home", systemImage: "house.fill", value: HomeTabs.home) {
                homeView
            }
            Tab("Care & Fix", systemImage: "wrench.and.screwdriver", value: HomeTabs.fix) {
                fixView
            }
            Tab("Assistant", systemImage: "waveform", value: HomeTabs.session) {
                sessionView
            }
            Tab("Profile", systemImage: "person.fill", value: HomeTabs.profile) {
                profileView
            }
            Tab("Push", systemImage: "square.and.arrow.up", value: HomeTabs.upload, role: .search) {
                uploadView
            }
        }
    }
    
    @ViewBuilder
    var home: some View {
        TabView(selection: obs.selectedTabBinding) {
            homeView
                .tabItem {
                    Image(systemName: "house.fill")
                    Text("Home")
                }
                .tag(HomeTabs.home)
            
            fixView
                .tabItem {
                    Image(systemName: "wrench.and.screwdriver")
                    Text("Care & Fix")
                }
                .tag(HomeTabs.fix)
            
            sessionView
                .tabItem {
                    Image(systemName: "waveform")
                    Text("Assistant")
                }
                .tag(HomeTabs.session)
            
            profileView
                .tabItem {
                    Image(systemName: "person.fill")
                    Text("Profile")
                }
                .tag(HomeTabs.profile)
            
            uploadView
                .tabItem {
                    Image(systemName: "square.and.arrow.up")
                    Text("Push")
                }
                .tag(HomeTabs.upload)
        }
    }
    
    @ViewBuilder
    private var homeView: some View {
        HomeView(navigator: navigator, name: app.state.userBase?.name ?? "", obs: $obs)
            .initialHomeScreen()
    }
    
    @ViewBuilder
    private var fixView: some View {
        FixView(navigator: navigator, obs: $obs)
            .initialHomeScreen()
    }
    
    @ViewBuilder
    private var sessionView: some View {
        SessionView(navigator: navigator, app: $app, obs: $obs)
            .initialHomeScreen()
    }
    
    @ViewBuilder
    private var profileView: some View {
        ProfileView(navigator: navigator, app: $app, obs: $obs)
            .initialHomeScreen()
    }
    
    @ViewBuilder
    private var uploadView: some View {
        UploadView(navigator: navigator, app: $app, obs: $obs)
            .initialHomeScreen()
    }
    
    @ToolbarContentBuilder
    func toolBarAiChatView() -> some ToolbarContent {
        ToolbarItem(placement: .topBarTrailing) {
            Button {
                guard !obs.state.isLoading else { return }
                navigator.navigateTo(.CHAT_SCREEN_ROUTE)
            } label: {
                Image.initial("plus".forImage(tint: .textOfApp, isSystem: true))
                .frame(size: 24)}
        }
    }
    
    @ToolbarContentBuilder
    func toolBarProfileView() -> some ToolbarContent {
        ToolbarItem(placement: .topBarTrailing) {
            Menu {
                Button {
                    guard obs.state.user != nil else { return }
                    self.obs.sheet(isEditSheet: true)
                } label: {
                    Label("Edit Profile", systemImage: "pencil")
                }
                
                Button(role: .destructive) {
                    self.app.signOut {
                        navigator.navigateMain(.AUTH_SCREEN_ROUTE)
                    } _: {
                        
                    }
                } label: {
                    Label("Sign Out", systemImage: "arrow.right.square")
                }
            } label: {
                Image(systemName: "ellipsis")
                    .rotationEffect(.degrees(90))
                    .frame(width: 24, height: 24)
            }
        }
    }
}

extension View {
    
    @ViewBuilder
    func initialHomeScreen() -> some View {
        padding(.bottom, 1)
            //.safeAreaInset(edge: .top) { Color.clear.frame(height: 0) }
            .safeAreaInset(edge: .bottom) { Color.clear.frame(height: 0) }
            .toolbarBackground(.hidden, for: .tabBar)
            .toolbarBackground(.hidden, for: .bottomBar)
            .toolbarBackground(.hidden, for: .navigationBar)
            .apply {
                if #available(iOS 26.0, *) {
                    $0.scrollEdgeEffectStyle(.soft, for: .all)
                        .contentMargins(.top, 1, for: .scrollContent)
                } else if #available(iOS 17.0, *) {
                    $0.contentMargins(.top, 1, for: .scrollContent)
                }
            }
    }
}
