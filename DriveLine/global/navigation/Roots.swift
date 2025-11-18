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

    var backPressWithUpdate: @MainActor () -> Void { get }

    var screenConfig: @MainActor (Screen) -> (any ScreenConfig)? { get }
    
    @MainActor
    func navigateTo<T: Hashable>(screen: T)
}

protocol ScreenConfig {}

@MainActor
struct SplashConfig: ScreenConfig {
   
}

@MainActor
struct CreateEditFixServiceConfig: ScreenConfig {
    let editService: ProvideServiceData?
    let serviceAdminId: Int
}

@MainActor
struct ServicesListConfig: ScreenConfig {
    let service: FixService
}

@MainActor
struct ServiceConfig: ScreenConfig {
    let service: ViewServiceData
}

@MainActor
struct ProfileVisitorConfig: ScreenConfig {
    let userShort: UserShortData
}

@MainActor
struct VideoFeedConfig: ScreenConfig {
    let shorts: [ShortVideoUserData]
    let currentIndex: Int
}

@MainActor
struct CreateEditCourseConfig: ScreenConfig {
    let editCourse: ProvideCourseData?
    let courseAdminId: Int
}

@MainActor
struct ProvidedCoursesListConfig: ScreenConfig {
    let course: Course
}

@MainActor
struct CourseConfig: ScreenConfig {
    let providedCourse: ViewCourseData
}

@MainActor
enum Screen : String, Hashable {
    
    case AUTH_SCREEN_ROUTE = "AUTH_SCREEN_ROUTE"
    case HOME_SCREEN_ROUTE = "HOME_SCREEN_ROUTE"
    case CHAT_SCREEN_ROUTE = "CHAT_SCREEN_ROUTE"
    
    case CREATE_EDIT_FIX_SCREEN_ROUTE = "CREATE_EDIT_FIX_SCREEN_ROUTE"
    case SERVICES_LIST_SCREEN = "SERVICES_LIST_SCREEN"
    case SERVICE_SCREEN = "SERVICE_SCREEN"
    
    case VIDEO_SHORT_SCREEN_ROUTE = "VIDEO_SHORT_SCREEN_ROUTE"
    case PROFILE_VISITOR_SCREEN_ROUTE = "PROFILE_VISITOR_SCREEN_ROUTE"

    case COURCES_LIST_SCREEN_ROUTE = "COURCES_LIST_SCREEN_ROUTE"
    
    case CREATE_EDIT_COURSE_ROUTE = "CREATE_EDIT_COURSE_ROUTE"
    case PROVICED_COURSE_LIST_SCREEN = "PROVICED_COURSE_LIST_SCREEN"
    case COURSE_SCREEN = "COURSE_SCREEN"
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
       case .CREATE_EDIT_FIX_SCREEN_ROUTE: CreateEditServiceScreen(app: app, navigator: navigator)
       case .SERVICES_LIST_SCREEN: FixServicesListScreen(app: app, navigator: navigator)
       case .SERVICE_SCREEN: ViewServiceScreen(navigator: navigator)
       case .PROFILE_VISITOR_SCREEN_ROUTE: ProfileVistorScreen(navigator: navigator, app: app)
       case .COURCES_LIST_SCREEN_ROUTE: CoursesListScreen(app: app, navigator: navigator)
       case .PROVICED_COURSE_LIST_SCREEN: CoursesProvidersScreen(app: app, navigator: navigator)
       case .CREATE_EDIT_COURSE_ROUTE: CreateEditCourseScreen(app: app, navigator: navigator)
       case .COURSE_SCREEN: ViewCourseScreen(navigator: navigator)
       case .VIDEO_SHORT_SCREEN_ROUTE: VideoFeedScreen(navigator: navigator)
       }
   }
}

