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

}   

protocol ScreenConfig {}

@MainActor
public struct SplashConfig: ScreenConfig {
   
}

@MainActor
struct SubScreenConfig: ScreenConfig {
   let title: String
}

@MainActor
enum Screen : Hashable {
   
   case AUTH_SCREEN_ROUTE
   case HOME_SCREEN_ROUTE
}


extension View {
   
   @ViewBuilder func targetScreen(
       _ target: Screen,
       _ app: BaseAppObserve,
       navigator: any Navigator
   ) -> some View {
       switch target {
       case .AUTH_SCREEN_ROUTE: AuthScreen(app: app, navigator: navigator)
       case .HOME_SCREEN_ROUTE: HomeScreen(app: app, navigator: navigator)
       }
   }
}

