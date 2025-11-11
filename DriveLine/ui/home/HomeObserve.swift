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
    
    struct HomeObserveState {

        private(set) var isLoading: Bool = false
        private(set) var toast: Toast? = nil
        
        private(set) var courses: [Course] = Course.temp
        private(set) var shortVideos: [ShortVideo] = ShortVideo.temp

        private(set) var aiSessions: [AiSessionData] = []

        private(set) var user: User? = nil
        private(set) var isEditSheet: Bool = false
        
        @MainActor
        mutating func copy(
            isLoading: Update<Bool> = .keep,
            toast: Update<Toast?> = .keep,
            courses: Update<[Course]> = .keep,
            shortVideos: Update<[ShortVideo]> = .keep,
            aiSessions: Update<[AiSessionData]> = .keep,
            user: Update<User?> = .keep,
            isEditSheet: Update<Bool> = .keep
        ) -> Self {
            if case .set(let value) = isLoading { self.isLoading = value }
            if case .set(let value) = toast { self.toast = value }
            
            if case .set(let value) = courses { self.courses = value }
            if case .set(let value) = shortVideos { self.shortVideos = value }

            if case .set(let value) = aiSessions { self.aiSessions = value }

            if case .set(let value) = user { self.user = value }
            if case .set(let value) = isEditSheet { self.isEditSheet = value }
            return self
        }
    }
}
