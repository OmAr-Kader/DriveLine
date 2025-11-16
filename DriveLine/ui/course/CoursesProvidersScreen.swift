//
//  CoursesProvidersScreen.swift
//  DriveLine
//
//  Created by OmAr Kader on 16/11/2025.
//


import SwiftUI
import SwiftUISturdy
import Foundation

struct CoursesProvidersScreen: View {
    
    @Binding var app: BaseAppObserve
    let navigator: Navigator
    
    @State
    private var obs: CoursesProvidersObserve = CoursesProvidersObserve()
   
    var body: some View {
        ZStack {
            VStack {
                List {
                    ForEach(obs.state.listOfCourses) { item in
                        CourseCardImage(data: item)
                            .listRowBackground(Color.clear)
                            .onTapGesture {
                                guard let course = obs.state.course else { return }
                                navigator.navigateToScreen(CourseConfig(providedCourse: ViewCourseData(course: course, data: item)), .COURSE_SCREEN)
                            }
                    }
                }
            }
            LoadingScreen(color: .primaryOfApp, backDarkAlpha: .backDarkAlpha, isLoading: obs.state.isLoading)
        }.visibleToolbar()
            .navigationTitle(obs.state.course?.title ?? "")
            .onAppeared {
                load()
            }.toolbar {
                ToolbarItem(placement: .topBarTrailing) {
                    Button {
                        guard let course = obs.state.course else { return }
                        navigator.navigateToScreen(CreateEditCourseConfig(editCourse: nil, courseAdminId: course.adminId), .CREATE_EDIT_COURSE_ROUTE)
                    } label: {
                        Text("Join")
                    }
                }
            }.onAppear {
                guard app.state.needUpdate else { return }
                app.setNeedUpdate(false)
                load()
            }
    }
    
    private func load() {
        guard let config = navigator.screenConfig(.PROVICED_COURSE_LIST_SCREEN) as? ProvidedCoursesListConfig, let userBase = app.state.userBase else {
            return
        }
        LogKit.print(config.course.title)
        obs.loadProvicedCourses(userBase: userBase, course: config.course)
    }
}


fileprivate struct CourseCardImage: View {

    let data: GetACourseData

    var body: some View {
        ZStack(alignment: .bottomLeading) {
            HStack {
                RoundedRectangle(cornerRadius: 16, style: .continuous)
                    .fill(LinearGradient(colors: [.backDarkSec.opacity(0.25), Color(.systemBackground).opacity(0.16)], startPoint: .topLeading, endPoint: .bottomTrailing))
                    .background(.ultraThinMaterial)
                    .overlay(
                        RoundedRectangle(cornerRadius: 16)
                            .stroke(Color.white.opacity(0.06), lineWidth: 0.5)
                    )
                
            }
            LinearGradient(colors: [.black.opacity(0.0), .black.opacity(0.38)], startPoint: .center, endPoint: .bottom)
            HStack {
                VStack(alignment: .leading) {
                    Text(data.tech.name)
                        .foregroundStyle(.white)
                        .font(.headline).bold()
                    VStack(alignment: .leading) {
                        Text(data.tech.location?.city ?? "")
                            .foregroundStyle(.textHint)
                            .font(.subheadline)
                            .multilineTextAlignment(.leading)
                            .fixedSize(horizontal: true, vertical: false)
                    }.foregroundColor(.white)
                    Label("\(data.sessions) Sessions", systemImage: "flag")
                        .font(.subheadline)
                        .foregroundStyle(.textHint)
                        .labelStyle(HorizontalLabelStyle(spacing: 4))
                    
                    Spacer()
                    Label("\(data.price) \(data.currency)", systemImage: "dollarsign.circle")
                        .font(.subheadline)
                        .foregroundStyle(.textOfApp)
                        .labelStyle(HorizontalLabelStyle(spacing: 4))
                }.padding(12)
                Spacer()
                if let image = data.tech.image {
                    KingsImage(urlString: image, size: CGSize(140), radius: 10)
                        .onEnd()
                }
            }
        }
        .cornerRadius(14)
        .shadow(color: Color.black.opacity(0.12), radius: 8, x: 0, y: 6)
    }
}
