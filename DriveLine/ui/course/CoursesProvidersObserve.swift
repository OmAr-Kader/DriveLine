//
//  CoursesProvidersObserve.swift
//  DriveLine
//
//  Created by OmAr Kader on 16/11/2025.
//


import SwiftUI
import SwiftUISturdy
import Observation

@MainActor
@Observable
final class CoursesProvidersObserve : BaseObserver {
    
    @MainActor
    private(set) var state: CoursesProvidersState = CoursesProvidersState()

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
    
    func loadProvicedCourses(userBase: UserBase?, course: Course) {
        guard let userBase else { return }
        self.state = self.state.copy(isLoading: .set(true), course: .set(course))
        self.tasker.back {
            await self.project.course.getCoursesByCourseAdminId(userBase: userBase, courseAdminId: course.adminId) { list in
                self.mainSync {
                    let listOfCourses = list.map({ GetACourseData(cloud: $0) })
                    withAnimation {
                        self.state = self.state.copy(isLoading: .set(false), listOfCourses: .set(listOfCourses))
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
    
    
    struct CoursesProvidersState {

        private(set) var isLoading: Bool = false
        private(set) var toast: Toast? = nil
        
        private(set) var listOfCourses: [GetACourseData] = []
        
        private(set) var course: Course? = nil

        @MainActor
        mutating func copy(
            isLoading: Update<Bool> = .keep,
            toast: Update<Toast?> = .keep,
            listOfCourses: Update<[GetACourseData]> = .keep,
            course: Update<Course> = .keep,
        ) -> Self {
            if case .set(let value) = isLoading { self.isLoading = value }
            if case .set(let value) = toast { self.toast = value }
            
            if case .set(let value) = listOfCourses { self.listOfCourses = value }
            if case .set(let value) = course { self.course = value }

            return self
        }
    }
    
}
