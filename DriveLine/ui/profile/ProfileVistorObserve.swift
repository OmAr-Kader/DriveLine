//
//  ProfileVistorObserve.swift
//  DriveLine
//
//  Created by OmAr Kader on 18/11/2025.
//


import Foundation
import SwiftUISturdy
import SwiftUI

@MainActor
@Observable
final class ProfileVistorObserve : BaseObserver {
    
    
    @MainActor
    private(set) var state: ProfileVistorState = ProfileVistorState()
    
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
    

    @MainActor
    func fetchVisitorProfile(_ userBase: UserBase?, profileId: String) {
        guard let userBase else { return }
        self.state = self.state.copy(isLoading: .set(true), visitor: .set(nil), visitorService: .set([]), visitorCourses: .set([]), visitorShorts: .set([]))
        self.tasker.back {
            await self.project.auth.fetchProfileById(user: userBase, profileId: profileId) { profile in
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
                        
                        self.state = self.state.copy(isLoading: .set(false), visitor: .set(profile.user), visitorService: .set(newServices), visitorCourses: .set(newProvided), visitorShorts: .set(newShorts))
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
    
    
    struct ProfileVistorState {

        private(set) var isLoading: Bool = false
        private(set) var toast: Toast? = nil

        private(set) var visitor: User? = nil
        private(set) var visitorService: [ProfileServiceData] = []
        private(set) var visitorCourses: [ProfileCourseData] = []
        private(set) var visitorShorts: [ShortVideoUserData] = []

        @MainActor
        mutating func copy(
            isLoading: Update<Bool> = .keep,
            toast: Update<Toast?> = .keep,
            visitor: Update<User?> = .keep,
            visitorService: Update<[ProfileServiceData]> = .keep,
            visitorCourses: Update<[ProfileCourseData]> = .keep,
            visitorShorts: Update<[ShortVideoUserData]> = .keep
        ) -> Self {
            if case .set(let value) = isLoading { self.isLoading = value }
            if case .set(let value) = toast { self.toast = value }

            if case .set(let value) = visitor { self.visitor = value }
            if case .set(let value) = visitorService { self.visitorService = value }
            if case .set(let value) = visitorCourses { self.visitorCourses = value }
            if case .set(let value) = visitorShorts { self.visitorShorts = value }

            return self
        }
    }
    
}

