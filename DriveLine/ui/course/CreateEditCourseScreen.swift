//
//  CreateEditCourseScreen.swift
//  DriveLine
//
//  Created by OmAr Kader on 16/11/2025.
//

import SwiftUI
import Foundation
import Combine
import SwiftUISturdy

struct CreateEditCourseScreen: View {
    
    @Binding var app: BaseAppObserve
    let navigator: Navigator

    @State private var obs = CreateEditCourseObserve()

    var body: some View {
        ZStack {
            VStack(spacing: 0) {
                Form {
                    VStack(alignment: .center, spacing: 0) {
                        TabView(selection: $obs.selectedPage) {
                            ForEach(Array(obs.images.enumerated()), id: \.offset) { idx, url in
                                AsyncImage(url: URL(string: url)) { phase in
                                    switch phase {
                                    case .empty:
                                        ProgressView()
                                    case .success(let img):
                                        img.resizable().scaledToFit()
                                            .clipShape(RoundedRectangle(cornerRadius: 10))
                                    case .failure:
                                        Image(systemName: "person.fill")
                                            .resizable()
                                            .scaledToFit()
                                            .clipShape(RoundedRectangle(cornerRadius: 10))
                                    @unknown default:
                                        Image(systemName: "person.fill")
                                    }
                                }
                                .tag(idx)
                            }
                        }
                        .frame(height: 140)
                        .tabViewStyle(PageTabViewStyle(indexDisplayMode: .never))
                        HStack {
                            if !obs.images.isEmpty {
                                Button {
                                    obs.removeImage(index: obs.selectedPage)
                                } label: {
                                    Image(systemName: "delete.left")
                                        .resizable()
                                        .tint(.black)
                                        .padding(8)
                                        .frame(size: 30)
                                        .background(.red)
                                        .clipShape(Circle())
                                }
                                Spacer().width(40)
                            }
                            Button {
                                obs.addNewImage(img: "https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcRPEgUGIRO5X5zExd2A0tAclSkQY8koUSVohw&s")
                            } label: {
                                Image(systemName: "plus")
                                    .resizable()
                                    .tint(.black)
                                    .padding(8)
                                    .frame(size: 30)
                                    .background(.red)
                                    .clipShape(Circle())
                            }
                        }
                        Spacer().height(10)
                        pagerIndicator
                    }
                    .padding(.horizontal, 20)
                    .listRowBackground(Color.clear)
                    
                    Section(header: Text("Course info")) {
                        TextField("Short description", text: $obs.descriptionText)
                            .textInputAutocapitalization(.sentences)
                            .multilineTextAlignment(.leading)
                            .fixedSize(horizontal: true, vertical: false)
                        
                        HStack {
                            TextField("Price", text: $obs.priceText)
                                .keyboardType(.decimalPad)
                            
                            Menu(obs.currency) {
                                ForEach(["USD", "GBP", "EUR", "CAD", "NZD", "CHF", "JPY", "AUD"], id: \.self) { it in
                                    Button {
                                        obs.currency = it
                                    } label: {
                                        HStack {
                                            Text(it)
                                            Spacer()
                                            if obs.currency == it { Image(systemName: "checkmark") }
                                        }
                                    }
                                }
                            }
                        }
                        Stepper("\(obs.sessions) Sessions", value: $obs.sessions, in: 1...50, step: 1)
                    }
                    
                    Section(header: Text("Edit availability — pick a day")) {
                        Picker("", selection: $obs.selectedDay) {
                            ForEach(WeekDay.allCases) { day in
                                Text(day.short).tag(day)
                            }
                        }
                        .pickerStyle(.segmented)
                        .padding(.vertical, 4)
                        
                        DayAvailabilityEditor(
                            day: obs.selectedDay,
                            interval: Binding(
                                get: { obs.availabilities[obs.selectedDay] ?? nil },
                                set: { obs.availabilities[obs.selectedDay] = $0 }
                            ),
                            // Simple start binding: if no interval -> nil, setting start creates single-hour (start==end)
                            selectedStart: Binding<Int?>(
                                get: {
                                    guard let i = obs.availabilities[obs.selectedDay] ?? nil else { return nil }
                                    return i.startUTC
                                },
                                set: { newStart in
                                    guard let s = newStart else {
                                        obs.clearRange(for: obs.selectedDay)
                                        return
                                    }
                                    if let cur = obs.availabilities[obs.selectedDay] ?? nil {
                                        // keep end if possible, ensure start <= end by swapping if needed
                                        let e = cur.endUTC
                                        if s <= e {
                                            obs.setHours(for: obs.selectedDay, start: s, end: e)
                                        } else {
                                            // s > e => set start=e, end=s (swap) to keep invariant
                                            obs.setHours(for: obs.selectedDay, start: e, end: s)
                                        }
                                    } else {
                                        // create single-hour
                                        obs.setHours(for: obs.selectedDay, start: s, end: s)
                                    }
                                }
                            ),
                            // Simple end binding: if no interval -> nil, setting end creates single-hour (start==end)
                            selectedEnd: Binding<Int?>(
                                get: {
                                    guard let i = obs.availabilities[obs.selectedDay] ?? nil else { return nil }
                                    return i.endUTC
                                },
                                set: { newEnd in
                                    guard let e = newEnd else {
                                        obs.clearRange(for: obs.selectedDay)
                                        return
                                    }
                                    if let cur = obs.availabilities[obs.selectedDay] ?? nil {
                                        let s = cur.startUTC
                                        if s <= e {
                                            obs.setHours(for: obs.selectedDay, start: s, end: e)
                                        } else {
                                            // e < s => swap
                                            obs.setHours(for: obs.selectedDay, start: e, end: s)
                                        }
                                    } else {
                                        obs.setHours(for: obs.selectedDay, start: e, end: e)
                                    }
                                }
                            ),
                            onSetRange: { s, e in obs.setHours(for: obs.selectedDay, start: s, end: e) },
                            onClear: { obs.clearRange(for: obs.selectedDay) }
                        )
                    }
                    
                    Section {
                        Button {
                            guard let userBase = app.state.userBase, let courseAdminId = obs.courseAdminId else { return }
                            if obs.vmHasLoadedOnce {
                                obs.update(userBase: userBase, courseAdminId: courseAdminId) {
                                    TaskBackSwitcher {
                                        await Task.sleep(seconds: 1)
                                        TaskMainSwitcher {
                                            navigator.backPressWithUpdate()
                                        }
                                    }
                                }
                            } else {
                                obs.makeRequest(userBase: userBase, courseAdminId: courseAdminId) {
                                    TaskBackSwitcher {
                                        await Task.sleep(seconds: 1)
                                        TaskMainSwitcher {
                                            navigator.backPressWithUpdate()
                                        }
                                    }
                                }
                            }
                        } label: {
                            Text(obs.vmHasLoadedOnce ? "Update" : "Submit").onCenter()
                        }.frame(width: 320, height: 40)
                            .apply {
                                if #available(iOS 26.0, *) {
                                    $0.glassEffect(.regular.tint(.primaryOfApp).interactive())
                                } else {
                                    $0.clipShape(.capsule)
                                        .background(.primaryOfApp)
                                }
                            }
                            .listRowBackground(Color.clear)
                    }
                }.apply {
                    if #available(iOS 26.0, *) {
                        $0.scrollEdgeEffectStyle(.soft, for: .all)
                    }
                }
            }.navigationBarTitleDisplayMode(.inline)
            LoadingScreen(color: .primaryOfApp, backDarkAlpha: .backDarkAlpha, isLoading: obs.isLoading)
        }.navigationTitle(obs.vmHasLoadedOnce ? "Edit Course" : "Create Course")
            .onAppeared {
                // Example load (simulate edit). Only load once.
                guard !obs.vmHasLoadedOnce, let config = navigator.screenConfig(.CREATE_EDIT_COURSE_ROUTE) as? CreateEditCourseConfig else {
                    navigator.backPress()
                    return
                }
                obs.courseAdminId = config.courseAdminId
                if !obs.vmHasLoadedOnce, let editCourse = config.editCourse  {
                    obs.loadFromExisting(editCourse)
                }
            }
    }
    
    @ViewBuilder
    private var pagerIndicator: some View {
        HStack(spacing: 8) {
            ForEach(0..<obs.images.count, id: \.self) { idx in
                Circle()
                    .fill(idx == obs.selectedPage ? .primaryOfApp : Color.gray.opacity(0.3))
                    .frame(width: idx == obs.selectedPage ? 10 : 8, height: idx == obs.selectedPage ? 10 : 8)
                    .animation(.easeInOut, value: obs.selectedPage)
            }
        }
        .frame(maxWidth: .infinity)
        .padding(.top, 6)
    }

    
    func formatInterval(_ interval: AvailabilityInterval) -> String {
        if interval.startUTC == interval.endUTC {
            return String(format: "%02d:00", interval.startUTC)
        } else {
            return String(format: "%02d:00 — %02d:00", interval.startUTC, interval.endUTC)
        }
    }
}
