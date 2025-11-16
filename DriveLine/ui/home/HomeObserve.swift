//
//  ChatViewModel.swift
//  DriveLine
//
//  Created by OmAr Kader on 06/11/2025.
//

import Foundation
import SwiftUISturdy
import SwiftUI

@MainActor
@Observable
final class HomeObserve : BaseObserver {
    
    @MainActor
    private(set) var state: HomeObserveState = HomeObserveState()
    
    var selectedTab: HomeTabs = .home
    
    var selectedTabBinding: Binding<HomeTabs> {
        Binding {
            self.selectedTab
        } set: {
            self.selectedTab = $0
        }
    }
    
    var selectedCato: Binding<FixCategory> {
        Binding(get: { self.state.currentCato }, set: { self.setCurrentCato($0) })
    }
    
    var currentIndex: Binding<Int> {
        Binding {
            self.state.currentIndex.index
        } set: {
            self.state = self.state.copy(currentIndex: .set(($0, self.state.currentIndex.isFeed)))
        }
    }
    
    init() {
        @Inject
        var pro: Project
        super.init(project: pro)
    }
    
    var toast: Binding<Toast?> {
        Binding {
            self.state.toast
        } set: { newValue in
            self.state = self.state.copy(toast: .set(newValue))
        }
    }
    
    var isEditSheet: Binding<Bool> {
        Binding {
            self.state.isEditSheet
        } set: {
            self.sheet(isEditSheet: $0)
        }
    }
    
    @MainActor
    func fetchAiSessions(_ userBase: UserBase?) {
        guard let userBase else { return }
        LogKit.print("fetchAiSessions")
        self.state = self.state.copy(isLoading: .set(true))
        self.tasker.back {
            await self.project.aiChat.getSessions(userBase) { new in
                self.mainSync {
                    LogKit.print("fetchAiSessions -> \(new.count)")
                    let newSessions = new.map({ AiSessionData($0) }).sorted(by: { $0.updatedAt > $1.updatedAt })
                    withAnimation {
                        self.state = self.state.copy(isLoading: .set(false), aiSessions: .set(newSessions))
                    }
                }
            } failed: { _ in
                self.mainSync {
                    withAnimation {
                        self.state = self.state.copy(isLoading: .set(false), toast: .set(Toast(style: .error, message: "Failed")))
                    }
                }
            }
        }
    }
    
    @MainActor
    func onAiSessionsCreated(_ new: AiSessionData) {
        let updatedList = self.state.aiSessions.add(new).sorted(by: { $0.updatedAt > $1.updatedAt })
        withAnimation {
            self.state = self.state.copy(aiSessions: .set(updatedList))
        }
    }
    
    @MainActor
    func fetchProfile(_ userBase: UserBase?) {
        guard let userBase else { return }
        self.state = self.state.copy(isLoading: .set(true))
        self.tasker.back {
            await self.project.auth.fetchProfileById(user: userBase) { profile in
                self.mainSync {
                    do {
                        let fixs = FixService.sampleServices()
                        let newServices = try profile.services.map ({ item in
                            ProfileServiceData(service: ProvideServiceData(cloud: item), fix: try fixs.firstOrThrow(where: { $0.adminId == item.serviceAdminId }))
                        })
                        
                        let courses = Course.sampleCourses
                        let newProvided = try profile.courses.map ({ item in
                            ProfileCourseData(providedCourse: ProvideCourseData(cloud: item), course: try courses.firstOrThrow(where: { $0.adminId == item.courseAdminId }))
                        })

                        
                        self.state = self.state.copy(isLoading: .set(false), user: .set(profile.user), profileService: .set(newServices), profileCourses: .set(newProvided))
                    } catch {
                        withAnimation {
                            self.state = self.state.copy(isLoading: .set(false), toast: .set(Toast(style: .error, message: "Failed")))
                        }
                    }
                }
            } failed: { msg in
                self.mainSync {
                    withAnimation {
                        self.state = self.state.copy(isLoading: .set(false), toast: .set(Toast(style: .error, message: "Failed")))
                    }
                }
            }

        }
    }
    
    @MainActor
    func fetchUser(_ userBase: UserBase?) {
        guard let userBase else { return }
        self.state = self.state.copy(isLoading: .set(true))
        self.tasker.back {
            await self.project.auth.fetchUserById(user: userBase) { user in
                self.mainSync {
                    withAnimation {
                        self.state = self.state.copy(isLoading: .set(false), user: .set(user))
                    }
                }
            } failed: { _ in
                self.mainSync {
                    withAnimation {
                        self.state = self.state.copy(isLoading: .set(false), toast: .set(Toast(style: .error, message: "Failed")))
                    }
                }
            }
        }
    }
    
    @MainActor
    func fetchTechServices(_ userBase: UserBase?) {
        guard let userBase else { return }
        self.state = self.state.copy(isLoading: .set(true))
        self.tasker.back {
            await self.project.fix.getServicesByTech(userBase: userBase, techId: userBase.id) { list in
                self.mainSync {
                    do {
                        let fixs = FixService.sampleServices()
                        let newServices = try list.map ({ item in
                            ProfileServiceData(service: ProvideServiceData(cloud: item), fix: try fixs.firstOrThrow(where: { $0.adminId == item.serviceAdminId }))
                        })
                        self.state = self.state.copy(isLoading: .set(false), profileService: .set(newServices))
                    } catch {
                        withAnimation {
                            self.state = self.state.copy(isLoading: .set(false), toast: .set(Toast(style: .error, message: "Failed")))
                        }
                    }
                }
                
            } failed: { msg in
                self.mainSync {
                    withAnimation {
                        self.state = self.state.copy(isLoading: .set(false), toast: .set(Toast(style: .error, message: "Failed")))
                    }
                }
            }
        }
    }
    
    
    @MainActor
    func fetchTechCourses(_ userBase: UserBase?) {
        guard let userBase else { return }
        self.state = self.state.copy(isLoading: .set(true))
        self.tasker.back {
            await self.project.course.getCoursesByTech(userBase: userBase, techId: userBase.id) { list in
                self.mainSync {
                    do {
                        let courses = Course.sampleCourses
                        let newProvided = try list.map ({ item in
                            ProfileCourseData(providedCourse: ProvideCourseData(cloud: item), course: try courses.firstOrThrow(where: { $0.adminId == item.courseAdminId }))
                        })
                        self.state = self.state.copy(isLoading: .set(false), profileCourses: .set(newProvided))
                    } catch {
                        withAnimation {
                            self.state = self.state.copy(isLoading: .set(false), toast: .set(Toast(style: .error, message: "Failed")))
                        }
                    }
                }
                
            } failed: { msg in
                self.mainSync {
                    withAnimation {
                        self.state = self.state.copy(isLoading: .set(false), toast: .set(Toast(style: .error, message: "Failed")))
                    }
                }
            }
        }
    }
    
    
    @MainActor
    func updateUser(userBase: UserBase?, userEdit: UserEdit, invoke: @escaping @Sendable @MainActor (User) -> Void) {
        guard let userBase else { return }
        self.state = self.state.copy(isLoading: .set(true))
        self.tasker.back {
            let user = User(userBase: userBase, userEdit: userEdit)
            await self.project.auth.updateUserById(token: userBase.token, user: user) { base in
                self.mainSync {
                    invoke(user)
                }
            } failed: { _ in
                self.mainSync {
                    withAnimation {
                        self.state = self.state.copy(isLoading: .set(false), toast: .set(Toast(style: .error, message: "Failed")))
                    }
                }
            }

        }
    }
    
    @MainActor
    func offLoading(user: User) {
        withAnimation {
            self.state = self.state.copy(isLoading: .set(false), user: .set(user), isEditSheet: .set(false))
        }
    }
    
    @MainActor
    func sheet(isEditSheet: Bool) {
        withAnimation {
            self.state = self.state.copy(isEditSheet: .set(isEditSheet))
        }
    }
    
    @MainActor
    func updateVideos(_ shortVideos: [ShortVideo]) {
        withAnimation {
            self.state = self.state.copy(shortVideos: .set(shortVideos))
        }
    }
    
    @MainActor
    func setFeedIndex(_ currentIndex: (Int, Bool)) {
        withAnimation {
            self.state = self.state.copy(currentIndex: .set(currentIndex))
        }
    }
    
    @MainActor
    func setCurrentCato(_ currentCato: FixCategory) {
        let newServices = self.state.services.filter { $0.category == currentCato }
        withAnimation(.easeInOut) {
            self.state = self.state.copy(currentServices: .set(newServices), currentCato: .set(currentCato))
        }
    }
    
    
    @MainActor
    func updateTechService(_ userBase: UserBase?, ) {
        guard let userBase else { return }
        self.state = self.state.copy(isLoading: .set(true))
        self.tasker.back {
            await self.project.fix.getServicesByTech(userBase: userBase, techId: userBase.id) { list in
                self.mainSync {
                    do {
                        let fixs = FixService.sampleServices()
                        let newServices = try list.map ({ item in
                            ProfileServiceData(service: ProvideServiceData(cloud: item), fix: try fixs.firstOrThrow(where: { $0.adminId == item.serviceAdminId }))
                        })
                        self.state = self.state.copy(isLoading: .set(false), profileService: .set(newServices))
                    } catch {
                        withAnimation {
                            self.state = self.state.copy(isLoading: .set(false), toast: .set(Toast(style: .error, message: "Failed")))
                        }
                    }
                }
                //
            } failed: { msg in
                self.mainSync {
                    withAnimation {
                        self.state = self.state.copy(isLoading: .set(false), toast: .set(Toast(style: .error, message: "Failed")))
                    }
                }
            }
        }
    }
    
    struct HomeObserveState {

        private(set) var isLoading: Bool = false
        private(set) var toast: Toast? = nil
        
        private(set) var courses: [Course] = Course.temp
        private(set) var shortVideos: [ShortVideo] = ShortVideo.temp
        private(set) var currentIndex: (index: Int, isFeed: Bool) = (0, false)

        private(set) var services: [FixService] = FixService.sampleServices() // MARK: Change
        private(set) var currentServices: [FixService] = []
        private(set) var currentCato: FixCategory = .maintenance
        
        private(set) var aiSessions: [AiSessionData] = []

        private(set) var user: User? = nil
        private(set) var profileService: [ProfileServiceData] = []
        private(set) var profileCourses: [ProfileCourseData] = []
        private(set) var isEditSheet: Bool = false
        
        @MainActor
        mutating func copy(
            isLoading: Update<Bool> = .keep,
            toast: Update<Toast?> = .keep,
            courses: Update<[Course]> = .keep,
            shortVideos: Update<[ShortVideo]> = .keep,
            currentIndex: Update<(index: Int, isFeed: Bool)> = .keep,
            services: Update<[FixService]> = .keep,
            currentServices: Update<[FixService]> = .keep,
            currentCato: Update<FixCategory> = .keep,
            aiSessions: Update<[AiSessionData]> = .keep,
            user: Update<User?> = .keep,
            profileService: Update<[ProfileServiceData]> = .keep,
            profileCourses: Update<[ProfileCourseData]> = .keep,
            isEditSheet: Update<Bool> = .keep
        ) -> Self {
            if case .set(let value) = isLoading { self.isLoading = value }
            if case .set(let value) = toast { self.toast = value }
            
            if case .set(let value) = courses { self.courses = value }
            if case .set(let value) = shortVideos { self.shortVideos = value }
            if case .set(let value) = currentIndex { self.currentIndex = value }

            if case .set(let value) = services { self.services = value }
            if case .set(let value) = currentServices { self.currentServices = value }
            if case .set(let value) = currentCato { self.currentCato = value }

            if case .set(let value) = aiSessions { self.aiSessions = value }

            if case .set(let value) = user { self.user = value }
            if case .set(let value) = profileService { self.profileService = value }
            if case .set(let value) = profileCourses { self.profileCourses = value }
            if case .set(let value) = isEditSheet { self.isEditSheet = value }
            return self
        }
    }
}
