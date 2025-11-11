import SwiftUI
import Combine
import SwiftUISturdy


@MainActor
protocol Navigator : Sendable {
    
    var navigateTo: @MainActor (Screen) -> Void { get }
    
    var navigateToScreen: @MainActor (ScreenConfig, Screen) -> Void { get }
    
    var navigateMain: @MainActor (Screen) -> Void { get }
    
    var navigateMainNoAnimation: @MainActor (Screen) -> Void { get }
    
    var backPress: @MainActor () -> Void { get }
    
    var screenConfig: @MainActor (Screen) -> (any ScreenConfig)? { get }
    
    @MainActor
    func navigateTo<T: Hashable>(screen: T)
}

protocol ScreenConfig {}

@MainActor
struct SplashConfig: ScreenConfig {
   
}

@MainActor
enum Screen : String, Hashable {
    
    case AUTH_SCREEN_ROUTE = "AUTH_SCREEN_ROUTE"
    case HOME_SCREEN_ROUTE = "HOME_SCREEN_ROUTE"
    case CHAT_SCREEN_ROUTE = "CHAT_SCREEN_ROUTE"
}


extension View {
   
   @ViewBuilder func targetScreen(
       _ target: Screen,
       _ app: Binding<BaseAppObserve>,
       navigator: any Navigator
   ) -> some View {
       switch target {
       case .AUTH_SCREEN_ROUTE: AuthScreen(app: app, navigator: navigator)
       case .HOME_SCREEN_ROUTE: HomeScreen(app: app, navigator: navigator)
       case .CHAT_SCREEN_ROUTE: ChatScreen(app: app)
       }
   }
}

