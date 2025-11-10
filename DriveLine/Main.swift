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

    var app: BaseAppObserve
        
    
    @NavState<Screen>
    private var navigationPath: NavigationPath
    
    @Inject
    private var theme: Theme
    
    var navigateTo: @MainActor (Screen) -> Void {
        return { screen in
            self.navigationPath.append(screen)
        }
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
                _navigationPath.mainScreen, app, navigator: self
            ).navigationDestination(for: Screen.self) { route in
                targetScreen(route, app, navigator: self)
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
    
    var app: BaseAppObserve
    let navigator: Navigator
    private let obs: HomeObserve = HomeObserve()

    @State private var selectedTab = 0
    @State private var isLoading = true

    @Inject
    private var theme: Theme
    var body: some View {
        Group {
            if #available(iOS 18.0, *) {
                TabView(selection: $selectedTab) {
                    Tab(value: 0) {
                        HomeView(obs: obs).initialHomeScreen()
                    } label: {
                        Label("Home", systemImage: "house.fill")
                    }
                    Tab("Schedule", systemImage: "calendar.and.person", value: 1) {
                        ScheduleView(app: app, navigator: navigator).initialHomeScreen()
                    }
                    Tab("Assistant", systemImage: "waveform", value: 2) {
                        ChatView(obs: obs).initialHomeScreen()
                    }
                    Tab("Profile", systemImage: "person.fill", value: 3, role: .search) {
                        ProfileView(app: app, obs: obs).initialHomeScreen()
                    }
                    /*
                    Tab("Search", systemImage: "magnifyingglass", value: 1) {
                        SearchView(app: app, navigator: navigator)
                    }
                    Tab("Favorites", systemImage: "heart.fill", value: 2) {
                        FavoritesView(app: app, navigator: navigator)
                    }*/
                }.apply {
                    if selectedTab == 3 {
                        $0.visibleToolbar()
                            .toolbar {
                                ToolbarItem(placement: .topBarTrailing) {
                                    Button {
                                        guard obs.state.user != nil else { return }
                                        self.obs.sheet(isEditSheet: true)
                                    } label: {
                                        Image.initial("pencil".forImage(tint: .textOfApp, isSystem: true))
                                            .frame(size: 24)}
                                }
                            }
                    } else {
                        $0.hideToolbar()
                    }
                }
            } else {
                TabView(selection: $selectedTab) {
                    HomeView(obs: obs)
                        .initialHomeScreen()
                        .tabItem {
                            Image(systemName: "house.fill")
                            Text("Home")
                        }
                        .tag(0)
                    
                    ScheduleView(app: app, navigator: navigator)
                        .initialHomeScreen()
                        .tabItem {
                            Image(systemName: "calendar.and.person")
                            Text("Schedule")
                        }
                        .tag(1)
                    
                    ChatView(obs: obs)
                        .initialHomeScreen()
                        .tabItem {
                            Image(systemName: "waveform")
                            Text("Assistant")
                        }
                        .tag(2)
                    
                    ProfileView(app: app, obs: obs)
                        .initialHomeScreen()
                        .tabItem {
                            Image(systemName: "person.fill")
                            Text("Profile")
                        }
                        .tag(3)
                }.apply {
                    if selectedTab == 3 {
                        $0.visibleToolbar()
                            .toolbar {
                                ToolbarItem(placement: .topBarTrailing) {
                                    Button {
                                        guard obs.state.user != nil else { return }
                                        self.obs.sheet(isEditSheet: true)
                                    } label: {
                                        Image.initial("pencil".forImage(tint: .textOfApp, isSystem: true))
                                            .frame(size: 24)}
                                }
                            }
                    } else {
                        $0.hideToolbar()
                    }
                }
            }
        }.tint(.primaryOfApp)
            /*.onDisappear {
                Task {
                    obs.shortVideos.forEach {
                        $0.player = nil
                    }
                }
            }*/
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
