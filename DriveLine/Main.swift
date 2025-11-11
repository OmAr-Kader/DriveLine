//
//  Main.swift
//  DriveLine
//
//  Created by OmAr Kader on 05/11/2025.
//

import SwiftUI
import SwiftUISturdy
import UniformTypeIdentifiers

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
        }.tint(theme.textHintColor)/*.onAppear {
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
        Group {
            if #available(iOS 18.0, *) {
                home18
            } else {
                home
            }
        }.tint(.primaryOfApp).id("TabView").apply {
            switch obs.selectedTab {
            case .session: $0.visibleToolbar().toolbar(content: toolBarAiChatView)
            case .profile: $0.visibleToolbar().toolbar(content: toolBarProfileView)
            default: $0.hideToolbar()
            }
        }.onChange(obs.selectedTab, onSelectedChange)
    }
    
    private func onSelectedChange(_ new: HomeTabs) {
        switch new {
        case .session: forSession()
        default: break
        }
    }
    
    private func forSession() {
        guard obs.state.aiSessions.isEmpty else { return }
        obs.fetchAiSessions(app.state.userBase)
    }
    
    @available(iOS 18.0, *)
    @ViewBuilder
    var home18: some View {
        TabView(selection: obs.selectedTabBinding) {
            Tab("Home", systemImage: "house.fill", value: HomeTabs.home) {
                homeView
            }
            Tab("Schedule", systemImage: "calendar.and.person", value: HomeTabs.schedule) {
                scheduleView
            }
            Tab("Assistant", systemImage: "waveform", value: HomeTabs.session) {
                sessionView
            }
            Tab("Profile", systemImage: "person.fill", value: HomeTabs.profile, role: .search) {
                profileView
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
            
            scheduleView
                .tabItem {
                    Image(systemName: "calendar.and.person")
                    Text("Schedule")
                }
                .tag(HomeTabs.schedule)
            
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
        }
    }
    
    @ViewBuilder
    private var homeView: some View {
        HomeView(navigator: navigator, obs: $obs)
            .initialHomeScreen()
    }
    
    @ViewBuilder
    private var scheduleView: some View {
        ScheduleView(navigator: navigator, obs: $obs)
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
   
    @ToolbarContentBuilder
    func toolBarAiChatView() -> some ToolbarContent {
        ToolbarItem(placement: .topBarTrailing) {
            Button {
                navigator.navigateTo(.CHAT_SCREEN_ROUTE)
            } label: {
                Image.initial("plus".forImage(tint: .textOfApp, isSystem: true))
                .frame(size: 24)}
        }
    }
    
    @ToolbarContentBuilder
    func toolBarProfileView() -> some ToolbarContent {
        ToolbarItem(placement: .topBarTrailing) {
            Button {
                guard obs.state.user != nil else { return }
                self.obs.sheet(isEditSheet: true)
            } label: {
                Image.initial("pencil".forImage(tint: .textOfApp, isSystem: true))
                .frame(size: 24)}
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
