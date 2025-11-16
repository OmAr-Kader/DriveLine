//
//  AllCoursesView.swift
//  DriveLine
//
//  Created by OmAr Kader on 13/11/2025.
//

import SwiftUI
import SwiftUISturdy

struct CoursesListScreen: View {
    
    @Binding var app: BaseAppObserve
    let navigator: Navigator
    
    @State var courses: [Course] = Course.sampleCourses

    var body: some View {
        VStack {
            List {
                ForEach(CourseCategory.allCases) { category in
                    // Only show sections with at least one course
                    let items = courses.filter { $0.course == category }
                    if !items.isEmpty {
                        Section(header: sectionHeader(for: category)) {
                            ForEach(items) { course in
                                CourseCardItem(course: course)
                                    .padding(.vertical, 7)
                                    .frame(height: 180)
                                    .listRowInsets(EdgeInsets(top: 8, leading: 12, bottom: 8, trailing: 12))
                                    .listRowBackground(Color.clear)
                                    .listRowSeparator(.hidden)
                                    .onTapGesture {
                                        navigator.navigateToScreen(ProvidedCoursesListConfig(course: course), .PROVICED_COURSE_LIST_SCREEN)
                                    }
                                
                            }
                        }
                    }
                }
            }.listStyle(.insetGrouped)
                .visibleToolbar()
                .navigationTitle("Courses")
        }
    }

    @ViewBuilder
    private func sectionHeader(for category: CourseCategory) -> some View {
        HStack(alignment: .center, spacing: 12) {
            VStack(alignment: .leading, spacing: 2) {
                Text(category.title)
                    .font(.headline)
                Text(category.subtitle)
                    .font(.caption)
                    .foregroundColor(.secondary)
            }
            Spacer()
        }
        .padding(.vertical, 6)
    }
}
