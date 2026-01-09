//
//  ChatViewModel.swift
//  DriveLine
//
//  Created by OmAr Kader on 06/11/2025.
//

import Foundation
import SwiftUISturdy
import SwiftUIMacroSturdy
import SwiftUI

@MainActor
@Observable
final class HomeObserve : BaseObserver {
    
    @MainActor
    private(set) var state: HomeObserveState = HomeObserveState()
    
    @ObservationIgnored
    private let pageSize: Int = 20
    @ObservationIgnored
    private var currentPage = 0
    @ObservationIgnored
    private var canLoadMore: Bool = true

    private var prefetchThreshold: Int { max(5, pageSize / 4) }

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
    func loadShorts(_ userBase: UserBase?) {
        guard let userBase, case .idle = state.shortsLoadState, canLoadMore else { return }
        self.state = self.state.copy(shortsLoadState: .set(.loading))
        self.tasker.back {
            await self.project.short.fetchLast50Videos(userBase: userBase, limit: self.pageSize, skip: self.currentPage, crypted: .receiveOnly) { shorts in
                self.mainSync {
                    let list = shorts.map({ ShortVideoUserData($0) }).sorted(by: { $0.createdAt > $1.createdAt })
                    LogKit.print("Local Short Videos Cound", shorts.count)
                    self.currentPage += 20
                    if list.isEmpty || list.count < 10 {
                        self.canLoadMore = false
                    }
                    withAnimation {
                        var newList = self.state.shortVideos
                        newList.append(contentsOf: list)
                        self.state = self.state.copy(shortVideos: .set(newList), shortsLoadState: .set(.idle))
                    }
                }
            } failed: { msg in
                self.mainSync {
                    self.canLoadMore = false
                    withAnimation {
                        self.state = self.state.copy(shortsLoadState: .set(.idle))
                    }
                }
            }

        }
    }
    
    @MainActor
    func shouldPrefetch(itemIndex: Int) -> Bool {
        guard case .idle = state.shortsLoadState,
              state.shortVideos.count - itemIndex <= prefetchThreshold
        else { return false }
        
        return true
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
            await self.project.auth.fetchProfileById(user: userBase, profileId: userBase.id, crypted: .receiveOnly) { profile in
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
                        
                        let newShorts = profile.shorts.map ({ item in
                            ShortVideoUserData(profile.user, short: (item))
                        })
                        
                        self.state = self.state.copy(isLoading: .set(false), user: .set(profile.user), profileService: .set(newServices), profileCourses: .set(newProvided), profileShorts: .set(newShorts))
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
    func updateVideos(_ shortVideos: [ShortVideoUserData]) {
        withAnimation {
            self.state = self.state.copy(shortVideos: .set(shortVideos))
        }
    }
    
    @MainActor
    func updateProfileVideos(_ shortVideos: [ShortVideoUserData]) {
        withAnimation {
            self.state = self.state.copy(profileShorts: .set(shortVideos))
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
    
    @MainActor
    func deleteSession(userBase: UserBase?, sessionId: String) {
        guard let userBase else { return }
        self.state = self.state.copy(isLoading: .set(true))
        self.tasker.back {
            await self.project.aiChat.deleteSession(userBase, id: sessionId) { _ in
                self.mainSync {
                    var sessions = self.state.aiSessions
                    sessions.removeAll(where: { $0.idCloud == sessionId })
                    withAnimation {
                        self.state = self.state.copy(isLoading: .set(false), aiSessions: .set(sessions))
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
    
    
    @SturdyCopy
    struct HomeObserveState {
        
        private(set) var isLoading: Bool = false
        private(set) var toast: Toast? = nil
        
        private(set) var courses: [Course] = Course.temp
        private(set) var shortVideos: [ShortVideoUserData] = []
        private(set) var shortsLoadState: LazyLoadState = .idle
        
        private(set) var services: [FixService] = FixService.sampleServices()
        private(set) var currentServices: [FixService] = []
        private(set) var currentCato: FixCategory = .maintenance
        
        private(set) var aiSessions: [AiSessionData] = []
        
        private(set) var user: User? = nil
        private(set) var profileService: [ProfileServiceData] = []
        private(set) var profileCourses: [ProfileCourseData] = []
        private(set) var profileShorts: [ShortVideoUserData] = []
        private(set) var isEditSheet: Bool = false
    }
}
