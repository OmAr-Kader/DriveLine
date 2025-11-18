//
//  ProfileVistorView.swift
//  DriveLine
//
//  Created by OmAr Kader on 18/11/2025.
//


import SwiftUI
import SwiftUISturdy
import Combine

struct ProfileVistorScreen: View {

    let navigator: Navigator
    @State private var userShort: UserShortData?

    @Binding var app: BaseAppObserve
    @State var obs: ProfileVistorObserve = ProfileVistorObserve()

    @State private var path = NavigationPath()

    @State private var selectedPage: Int = 0
    @State private var selectedCoursePage: Int = 0
    @Orientation private var orientation

    var locationText: String {
        guard let location = obs.state.visitor?.location else { return "" }
        let components = [location.building ?? "", location.street ?? "", location.city ?? ""].filter { !$0.isEmpty }
        return (location.unit != nil ? "Unit: \(location.unit!) - " : "") + components.joined(separator: ", ")
    }
    
    var body: some View {
        ZStack {
            VStack {
                // Profile Image
                if let profileImage = userShort?.image {
                    KingsImage(urlString: profileImage, size: CGSize(width: 120, height: 120), radius: 60, backColor: .backDarkSec)
                        .clipShape(Circle())
                        .overlay(
                            Circle()
                                .stroke(.primaryOfApp, lineWidth: 3)
                        )
                } else {
                    Image(systemName: "person.circle.fill")
                        .resizable()
                        .scaledToFill()
                        .frame(width: 120, height: 120)
                        .clipShape(Circle())
                        .overlay(
                            Circle()
                                .stroke(.primaryOfApp, lineWidth: 3)
                        )
                }
                Spacer().height(10)
                // Name
                Text(userShort?.name ?? "")
                    .font(.system(size: 28, weight: .bold))
                    .foregroundColor(.textOfApp)
                
                Spacer().height(10)
                // Location
                Text(locationText)
                    .font(.system(size: 16))
                    .foregroundColor(.textGray)
                    .multilineTextAlignment(.center)
                    .padding(.horizontal, 40)
                    .height(30)
                
                Spacer().height(10)
                
                ScrollView {
                    LazyVStack(spacing: 0) {
                        if !obs.state.visitorService.isEmpty {
                            VStack(spacing: 0) {
                                TabView(selection: $selectedPage) {
                                    ForEach(Array(obs.state.visitorService.enumerated()), id: \.offset) { idx, data in
                                        ServiceCardImage(data: data)
                                            .onTapGesture {
                                                guard let visitor = obs.state.visitor else { return }
                                                navigator.navigateToScreen(ServiceConfig(service: ViewServiceData(fix: data.fix, data: GetAServiceData(visitor, provided: data.service))), .SERVICE_SCREEN)
                                            }
                                    }
                                }
                                .frame(height: 140)
                                .tabViewStyle(PageTabViewStyle(indexDisplayMode: .never))
                                Spacer().height(10)
                                HStack(spacing: 8) {
                                    ForEach(0..<(obs.state.visitorService.count), id: \.self) { idx in
                                        Circle()
                                            .fill(idx == selectedPage ? .primaryOfApp : Color.gray.opacity(0.3))
                                            .frame(width: idx == selectedPage ? 10 : 8, height: idx == selectedPage ? 10 : 8)
                                            .animation(.easeInOut, value: selectedPage)
                                    }
                                }
                                .frame(maxWidth: .infinity)
                                .padding(.top, 6)
                            }.padding(.horizontal, 20)
                            Spacer().height(10)
                        }
                        if !obs.state.visitorCourses.isEmpty {
                            VStack(spacing: 0) {
                                TabView(selection: $selectedCoursePage) {
                                    ForEach(Array(obs.state.visitorCourses.enumerated()), id: \.offset) { idx, data in
                                        CourseCardImage(data: data)
                                            .onTapGesture {
                                                guard let visitor = obs.state.visitor else { return }
                                                navigator.navigateToScreen(CourseConfig(providedCourse: ViewCourseData(course: data.course, data: GetACourseData(visitor, provided: data.providedCourse))), .COURSE_SCREEN)
                                            }
                                    }
                                }
                                .frame(height: 140)
                                .tabViewStyle(PageTabViewStyle(indexDisplayMode: .never))
                                Spacer().height(10)
                                HStack(spacing: 8) {
                                    ForEach(0..<(obs.state.visitorCourses.count), id: \.self) { idx in
                                        Circle()
                                            .fill(idx == selectedCoursePage ? .primaryOfApp : Color.gray.opacity(0.3))
                                            .frame(width: idx == selectedCoursePage ? 10 : 8, height: idx == selectedCoursePage ? 10 : 8)
                                            .animation(.easeInOut, value: selectedCoursePage)
                                    }
                                }
                                .frame(maxWidth: .infinity)
                                .padding(.top, 6)
                            }.padding(.horizontal, 20)
                            
                            Spacer().height(10)
                        }
                        VStack {
                            videosGrid()
                        }.padding(.horizontal, 20)
                        Spacer()
                    }
                }
            }
            LoadingScreen(color: .primaryOfApp, backDarkAlpha: .backDarkAlpha, isLoading: obs.state.isLoading)
        }.toastView(toast: obs.toast, textColor: .textOfApp, backDarkSec: .backDarkSec)
            .onAppeared {
                guard let userShort = (navigator.screenConfig(.PROFILE_VISITOR_SCREEN_ROUTE) as? ProfileVisitorConfig)?.userShort else { return }
                self.userShort = userShort
                obs.fetchVisitorProfile(app.state.userBase, profileId: userShort.id)
            }
    }
    
    
    @ViewBuilder
    private func videosGrid() -> some View {
        // Determine orientation: portrait if height >= width
        let isPortrait = orientation.isPortrait
        let columnsCount = isPortrait ? 3 : 6
        let gridItem = Array(repeating: GridItem(.flexible(), spacing: 12), count: columnsCount)
        LazyVGrid(columns: gridItem) {
            ForEach(Array(obs.state.visitorShorts.enumerated()), id: \.offset) { index, item in
                ShortVideoTile(item: item)
                    .frame(height: isPortrait ? 140 : 120).onTapGesture {
                        navigator.navigateToScreen(VideoFeedConfig(shorts: obs.state.visitorShorts, currentIndex: index), .VIDEO_SHORT_SCREEN_ROUTE)
                    }
            }
        }.padding([.horizontal, .bottom])
    }
}

fileprivate struct ServiceCardImage: View {
    //let service: FixService
    let data: ProfileServiceData

    var body: some View {
        ZStack(alignment: .bottomLeading) {
            HStack {
                RoundedRectangle(cornerRadius: 16, style: .continuous)
                    .fill(LinearGradient(colors: [data.fix.color.opacity(0.25), Color(.systemBackground).opacity(0.16)], startPoint: .topLeading, endPoint: .bottomTrailing))
                    .background(.ultraThinMaterial)
                    .overlay(
                        RoundedRectangle(cornerRadius: 16)
                            .stroke(Color.white.opacity(0.06), lineWidth: 0.5)
                    )
                
            }
            LinearGradient(colors: [.black.opacity(0.0), .black.opacity(0.38)], startPoint: .center, endPoint: .bottom)
            HStack {
                VStack(alignment: .leading) {
                    Text(data.fix.title)
                        .foregroundStyle(.white)
                        .font(.headline).bold()
                    VStack(alignment: .leading) {
                        Label {
                            Text(data.service.isActive ? "Active" : "Not Active")
                        } icon: {
                            Image(systemName: "circle.fill")
                                .foregroundColor(data.service.isActive ? Color.green : Color.red)
                        }.labelStyle(HorizontalLabelStyle(spacing: 4))
                    }.foregroundColor(.white)
                    
                    Spacer()
                    Label("\(data.service.price) \(data.service.currency)", systemImage: "dollarsign.circle")
                        .font(.subheadline)
                        .foregroundStyle(.textOfApp)
                        .labelStyle(HorizontalLabelStyle(spacing: 4))
                }.padding(12)
                Spacer()
                HStack {
                    Image(systemName: data.fix.iconName)
                        .font(.title2).bold()
                        .padding(8)
                        .background(Color.white.opacity(0.16))
                        .clipShape(RoundedRectangle(cornerRadius: 8))
                }.padding(15).onBottomEnd()
            }
        }
        .cornerRadius(14)
        .shadow(color: Color.black.opacity(0.12), radius: 8, x: 0, y: 6)
    }
}



fileprivate struct CourseCardImage: View {
    //let service: FixService
    let data: ProfileCourseData

    var body: some View {
        ZStack(alignment: .bottomLeading) {
            HStack {
                RoundedRectangle(cornerRadius: 16, style: .continuous)
                    .fill(LinearGradient(colors: [(data.course.gradient.first ?? .gray).opacity(0.25), Color(.systemBackground).opacity(0.16)], startPoint: .topLeading, endPoint: .bottomTrailing))
                    .background(.ultraThinMaterial)
                    .overlay(
                        RoundedRectangle(cornerRadius: 16)
                            .stroke(Color.white.opacity(0.06), lineWidth: 0.5)
                    )
                
            }
            LinearGradient(colors: [.black.opacity(0.0), .black.opacity(0.38)], startPoint: .center, endPoint: .bottom)
            HStack {
                VStack(alignment: .leading) {
                    Text(data.course.title)
                        .foregroundStyle(.white)
                        .font(.headline).bold()
                    VStack(alignment: .leading) {
                        Label {
                            Text(data.providedCourse.isActive ? "Active" : "Not Active")
                        } icon: {
                            Image(systemName: "circle.fill")
                                .foregroundColor(data.providedCourse.isActive ? Color.green : Color.red)
                        }.labelStyle(HorizontalLabelStyle(spacing: 4))
                    }.foregroundColor(.white)
                    
                    Spacer()
                    Label("\(data.providedCourse.price) \(data.providedCourse.currency)", systemImage: "dollarsign.circle")
                        .font(.subheadline)
                        .foregroundStyle(.textOfApp)
                        .labelStyle(HorizontalLabelStyle(spacing: 4))
                }.padding(12)
                Spacer()
                HStack {
                    Label("\(data.providedCourse.sessions)", systemImage: "flag")
                        .font(.subheadline)
                        .foregroundStyle(.textHint)
                        .labelStyle(HorizontalLabelStyle(spacing: 4))
                }.padding(15).onBottomEnd()
            }
        }
        .cornerRadius(14)
        .shadow(color: Color.black.opacity(0.12), radius: 8, x: 0, y: 6)
    }
}



fileprivate struct ShortVideoTile: View {
    let item: ShortVideoUserData
    
    var body: some View {
        ZStack(alignment: .bottom) {
            Rectangle()
                .foregroundColor(Color.gray.opacity(0.15))
                .overlay(
                    Group {
                        KingsFisherImage(urlString: item.thumbImageName)
                            .scaledToFill()
                            .clipped()
                    }
                ).cornerRadius(8).contentShape(Rectangle())
            HStack {
                Text(item.title)
                    .font(.caption)
                    .lineLimit(2)
                    .foregroundColor(.white)
                    .padding(.top, 4)
                Spacer()
            }.background(LinearGradient(
                gradient: Gradient(colors: [Color.black.opacity(0.4), Color.black.opacity(0.05)]),
                startPoint: .bottom,
                endPoint: .top
            ))
        }
    }
    
}
