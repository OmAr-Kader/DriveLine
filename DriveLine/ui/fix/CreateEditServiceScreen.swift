//
//  CreateEditServiceScreen.swift
//  DriveLine
//
//  Created by OmAr Kader on 14/11/2025.
//

import SwiftUI
import Foundation
import Combine
import SwiftUISturdy

struct CreateEditServiceScreen: View {
    
    @Binding var app: BaseAppObserve
    let navigator: Navigator

    @State private var obs = CreateEditServiceObserve()

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
                    
                    Section(header: Text("Service info")) {
                        TextField("Short description", text: $obs.descriptionText)
                            .textInputAutocapitalization(.sentences)
                        
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
                        
                        Stepper("\(obs.durationMinutes) minutes", value: $obs.durationMinutes, in: 10...480, step: 5)
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
                            if let userBase = app.state.userBase, let serviceAdminId = obs.serviceAdminId {
                                obs.makeRequest(userBase: userBase, serviceAdminId: serviceAdminId)
                            }
                        } label: {
                            Text("Submit").onCenter()
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
        }.navigationTitle(obs.vmHasLoadedOnce ? "Edit Service" : "Create Service")
            .onAppeared {
                // Example load (simulate edit). Only load once.
                guard !obs.vmHasLoadedOnce, let config = navigator.screenConfig(.CREATE_EDIT_FIX_SCREEN_ROUTE) as? CreateEditFixServiceConfig else {
                    navigator.backPress()
                    return
                }
                obs.serviceAdminId = config.serviceAdminId
                if !obs.vmHasLoadedOnce, let editService = config.editService  {
                    obs.loadFromExisting(editService)
                }
            }
    }
    
    @ViewBuilder
    private var pagerIndicator: some View {
        HStack(spacing: 8) {
            ForEach(0..<obs.images.count, id: \.self) { idx in
                Circle()
                    .fill(idx == obs.selectedPage ? Color.blue : Color.gray.opacity(0.3))
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

// MARK: - DayAvailabilityEditor (no @State inside)

fileprivate struct DayAvailabilityEditor: View {
    let day: WeekDay
    @Binding var interval: AvailabilityInterval?
    @Binding var selectedStart: Int?
    @Binding var selectedEnd: Int?
    var onSetRange: (Int, Int) -> Void
    var onClear: () -> Void

    var body: some View {
        VStack(alignment: .leading, spacing: 12) {
            HStack {
                Toggle(isOn: Binding(
                    get: { interval != nil },
                    set: { newVal in
                        if !newVal {
                            interval = nil
                            selectedStart = nil
                            selectedEnd = nil
                            onClear()
                        } else {
                            // initialize defaults using interval or sensible defaults
                            if let avail = interval {
                                selectedStart = avail.startUTC
                                selectedEnd = avail.endUTC
                            } else {
                                selectedStart = 9
                                selectedEnd = 9
                                onSetRange(selectedStart!, selectedEnd!)
                            }
                        }
                    }
                )) {
                    Text("Available on \(day.short)")
                }
            }

            if interval != nil {
                VStack(alignment: .leading) {
                    Text("Tap start hour, then end hour (0–23). Single hour = start == end.")
                        .font(.caption)
                        .foregroundColor(.secondary)

                    HourRangePicker(day: day, selectedStart: $selectedStart,
                                    selectedEnd: $selectedEnd) { s, e in
                        selectedStart = s
                        selectedEnd = e
                        onSetRange(s, e)
                    }

                    HStack {
                        if let s = selectedStart, let e = selectedEnd {
                            Text("Selected: \(formatHour(s))\(s == e ? "" : " — \(formatHour(e))")")
                        } else {
                            Text("No selection yet")
                        }
                        Spacer()
                        Button("Clear") {
                            selectedStart = nil
                            selectedEnd = nil
                            interval = nil
                            onClear()
                        }
                        .buttonStyle(.bordered)
                    }
                }
            }
        }
        .onChange(interval) { newVal in
            if let avail = newVal {
                selectedStart = avail.startUTC
                selectedEnd = avail.endUTC
            } else {
                selectedStart = nil
                selectedEnd = nil
            }
        }
        .onAppear {
            if let avail = interval {
                selectedStart = avail.startUTC
                selectedEnd = avail.endUTC
            } else {
                selectedStart = nil
                selectedEnd = nil
            }
        }
    }

    private func formatHour(_ hour: Int) -> String { String(format: "%02d:00", hour) }
}

// MARK: - HourRangePicker (simple pick logic, hours only)

fileprivate struct HourRangePicker: View {
    let day: WeekDay
    @Binding var selectedStart: Int?
    @Binding var selectedEnd: Int?
    var onChange: (Int, Int) -> Void

    // Present hours 0..23
    private let hours = Array(0...23)

    var body: some View {
        ScrollViewReader { proxy in
            ScrollView(.horizontal, showsIndicators: true) {
                HStack(spacing: 8) {
                    ForEach(hours, id: \.self) { hour in
                        HourChip(
                            hour: hour,
                            isInRange: isInRange(hour),
                            isStart: selectedStart == hour,
                            isEnd: selectedEnd == hour
                        )
                        .onTapGesture { tap(hour: hour) }
                    }
                }
                .padding(.vertical, 6)
            }.onAppear {
                guard let selectedStart else { return }
                proxy.scrollTo(selectedStart + 1)
            }.onChange(day) { new in
                guard let selectedStart else { return }
                proxy.scrollTo(selectedStart + 1)
            }
        }.frame(height: 48)
    }

    private func tap(hour: Int) {
        if selectedStart == nil {
            // first tap: single-hour
            selectedStart = hour
            selectedEnd = hour
            onChange(hour, hour)
            return
        }

        if selectedStart != nil && selectedEnd == selectedStart {
            // second tap: create a range
            let s = selectedStart!
            if hour < s {
                selectedStart = hour
                selectedEnd = s
                onChange(hour, s)
            } else {
                selectedEnd = hour
                onChange(s, hour)
            }
            return
        }

        if selectedStart != nil && selectedEnd != nil {
            // both exist: restart picking
            selectedStart = hour
            selectedEnd = hour
            onChange(hour, hour)
        }
    }


    private func isInRange(_ hour: Int) -> Bool {
        if let s = selectedStart, let e = selectedEnd {
            // inclusive: highlight hours from s..e
            return hour >= min(s, e) && hour <= max(s, e)
        } else {
            return false
        }
    }
}

// MARK: - HourChip

fileprivate struct HourChip: View {
    let hour: Int
    let isInRange: Bool
    let isStart: Bool
    let isEnd: Bool

    var body: some View {
        Text(String(format: "%02d:00", hour))
            .font(.callout)
            .padding(.horizontal, 10)
            .padding(.vertical, 8)
            .background(background)
            .cornerRadius(8)
            .overlay(
                RoundedRectangle(cornerRadius: 8)
                    .stroke(borderColor, lineWidth: (isStart || isEnd) ? 2 : 0.5)
            )
            .foregroundColor(.primary)
    }

    private var background: Color {
        isInRange ? Color.accentColor.opacity(0.2) : Color(.secondarySystemBackground)
    }

    private var borderColor: Color {
        if isStart { return Color.accentColor }
        if isEnd { return Color.accentColor }
        return Color(.separator)
    }
}
