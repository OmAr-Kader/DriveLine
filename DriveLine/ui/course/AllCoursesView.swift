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
                                
                            }
                        }
                    }
                }
            }
            .listStyle(.insetGrouped)
            .visibleToolbar()
            .navigationTitle("Courses")
            .toolbar {
                ToolbarItem(placement: .topBarTrailing) {
                    Button {
                        
                    } label: {
                        Text("Join")
                    }
                }
            }
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

struct CourseCardItem: View {
    let course: Course
    
    var body: some View {
        ZStack(alignment: .leading) {
            RoundedRectangle(cornerRadius: 18, style: .continuous)
                .fill(
                    LinearGradient(
                        gradient: Gradient(colors: course.gradient),
                        startPoint: .topLeading,
                        endPoint: .bottomTrailing
                    )
                ).shadow(color: Color.black.opacity(0.12), radius: 6, x: 0, y: 4)
            //Color.black.opacity(0.5)
            VStack(alignment: .leading, spacing: 6) {
                Text(String(format: "%02d", course.index))
                    .foregroundColor(.white.opacity(0.95))
                    //.foregroundColor(course.isDark ? .black.opacity(0.95) : .white.opacity(0.95))
                    .font(.title2)
                    .bold()
                Text(course.title)
                    .foregroundColor(.white)
                    //.foregroundColor(course.isDark ? .black : .white)
                    .font(.subheadline)
                    .fixedSize(horizontal: false, vertical: true)
                    .multilineTextAlignment(.leading)
                    .lineLimit(2)

                Text(course.subtitle)
                    .foregroundColor(Color(UIColor(red: 0.8, green: 0.8, blue: 0.8, alpha: 1)))
                    //.foregroundColor(course.isDark ? Color(UIColor(red: 0.267, green: 0.267, blue: 0.267, alpha: 1)) : Color(UIColor(red: 0.8, green: 0.8, blue: 0.8, alpha: 1)))
                    .font(.subheadline)
                    .fixedSize(horizontal: false, vertical: true)
                    .multilineTextAlignment(.leading)
                    .lineLimit(2)
                Spacer()
                Text(course.price)
                    .font(.title3)
                    .bold()
                    .foregroundColor(Color(UIColor(red: 0.8, green: 0.8, blue: 0.8, alpha: 1)))
                    //.foregroundColor(course.isDark ? Color(UIColor(red: 0.267, green: 0.267, blue: 0.267, alpha: 1)) : Color(UIColor(red: 0.8, green: 0.8, blue: 0.8, alpha: 1)))
            }
            .padding(18)
        }.onCenter()
    }
}
