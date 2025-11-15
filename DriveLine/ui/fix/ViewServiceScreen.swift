//
//  ViewServiceScreen.swift
//  DriveLine
//
//  Created by OmAr Kader on 15/11/2025.
//

import SwiftUI
import SwiftUISturdy

struct ViewServiceScreen: View {
    
    let navigator: Navigator
    
    @State private var data: ViewServiceData?
    
    var body: some View {
        ZStack {
            if let data = data {
                ViewService(navigator: navigator, data: data)
            }
        }.visibleToolbar().navigationTitle(data?.fix.title ?? "").onAppear {
            // Example load (simulate edit). Only load once.
            guard let config = navigator.screenConfig(.SERVICE_SCREEN) as? ServiceConfig else { return }
            self.data = config.service
        }
    }
}


fileprivate struct ViewService : View {
    
    let navigator: Navigator
    
    let data: ViewServiceData
    
    @State private var selectedPage: Int = 0
  
    @State var selectedDay: WeekDay = .monday

    var body: some View {
        VStack(spacing: 0) {
            VStack(alignment: .center) {
                if !data.data.images.isEmpty {
                    VStack {
                        TabView(selection: $selectedPage) {
                            ServiceCardImage(service: data.fix, tech: data.data.tech)
                                .frame(height: 140)
                                .tag(0)
                            ForEach(Array(data.data.images.enumerated()), id: \.offset) { idx, url in
                                AsyncImage(url: URL(string: url)) { phase in
                                    switch phase {
                                    case .empty:
                                        ProgressView()
                                    case .success(let img):
                                        img.resizable().scaledToFit()
                                    case .failure:
                                        Image(systemName: "person.fill")
                                            .resizable()
                                            .scaledToFit()
                                            .clipShape(RoundedRectangle(cornerRadius: 10))
                                    @unknown default:
                                        Image(systemName: "person.fill")
                                    }
                                }
                                .clipShape(RoundedRectangle(cornerRadius: 10))
                                .tag(idx + 1)
                            }
                        }
                        .frame(height: 140)
                        .tabViewStyle(PageTabViewStyle(indexDisplayMode: .never))
                        Spacer().height(10)
                        HStack(spacing: 8) {
                            ForEach(0..<(data.data.images.count + 1), id: \.self) { idx in
                                Circle()
                                    .fill(idx == selectedPage ? Color.blue : Color.gray.opacity(0.3))
                                    .frame(width: idx == selectedPage ? 10 : 8, height: idx == selectedPage ? 10 : 8)
                                    .animation(.easeInOut, value: selectedPage)
                            }
                        }
                        .frame(maxWidth: .infinity)
                        .padding(.top, 6)
                    }.padding(.horizontal, 20)
                } else {
                    ServiceCardImage(service: data.fix, tech: data.data.tech)
                        .frame(height: 140)
                        .padding(.horizontal, 20)
                }
            }
            Form {
                Section(header: Text("Service info")) {
                    Text(data.data.description)
                        .font(.headline)
                    
                    HStack {
                        Text("\(data.data.price) \(data.data.currency)")
                        Spacer()
                        Text("\(data.data.durationMinutes) minutes")
                    }
                }
                
                Section(header: Text("Edit availability — pick a day")) {
                    Picker("", selection: $selectedDay) {
                        ForEach(WeekDay.allCases) { day in
                            Text(day.short).tag(day)
                        }
                    }
                    .pickerStyle(.segmented)
                    .padding(.vertical, 4)
                    
                    DayAvailabilityEditor(
                        day: selectedDay,
                        interval: data.availabilities[selectedDay] ?? nil,
                        // Simple start binding: if no interval -> nil, setting start creates single-hour (start==end)
                        selectedStart: data.availabilities[selectedDay]??.startUTC,
                        // Simple end binding: if no interval -> nil, setting end creates single-hour (start==end)
                        selectedEnd: data.availabilities[selectedDay]??.endUTC,
                    )
                }
            }.padding(.horizontal, 20)
        }
    }
}

// MARK: - DayAvailabilityEditor (no @State inside)
fileprivate struct DayAvailabilityEditor: View {
    let day: WeekDay
    let interval: AvailabilityInterval?
    var selectedStart: Int?
    var selectedEnd: Int?

    var body: some View {
        VStack(alignment: .leading, spacing: 12) {
            HStack {
                Text(interval != nil ? "Available on \(day.short)" : "Unavailable on \(day.short)")
                Spacer()
            }
            
            if interval != nil {
                HourRangePicker(day: day, selectedStart: selectedStart,
                                selectedEnd: selectedEnd)
                
                HStack {
                    if let s = selectedStart, let e = selectedEnd {
                        Text("Selected: \(formatHour(s))\(s == e ? "" : " — \(formatHour(e))")")
                    } else {
                        Text("No selection yet")
                    }
                    Spacer()
                }
            }
        }
    }

    private func formatHour(_ hour: Int) -> String { String(format: "%02d:00", hour) }
}

// MARK: - HourRangePicker (simple pick logic, hours only)

fileprivate struct HourRangePicker: View {
    let day: WeekDay
    let selectedStart: Int?
    let selectedEnd: Int?

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
                    .stroke(Color(.separator), lineWidth: 0.5)
            )
            .foregroundColor(.primary)
    }

    private var background: Color {
        isInRange ? Color(.primaryOfApp).opacity(0.2) : Color(.secondarySystemBackground)
    }
}

fileprivate struct ServiceCardImage: View {
    let service: FixService
    let tech: GetAServiceData.Tech?

    var body: some View {
        ZStack(alignment: .bottomLeading) {
            HStack {
                RoundedRectangle(cornerRadius: 16, style: .continuous)
                    .fill(LinearGradient(colors: [service.color.opacity(0.25), Color(.systemBackground).opacity(0.16)], startPoint: .topLeading, endPoint: .bottomTrailing))
                    .background(.ultraThinMaterial)
                    .overlay(
                        RoundedRectangle(cornerRadius: 16)
                            .stroke(Color.white.opacity(0.06), lineWidth: 0.5)
                    )
                
            }
            LinearGradient(colors: [.black.opacity(0.0), .black.opacity(0.38)], startPoint: .center, endPoint: .bottom)
            HStack {
                VStack(alignment: .leading) {
                    Text(tech?.name ?? "")
                        .foregroundStyle(.white)
                        .font(.subheadline).bold()
                    VStack(alignment: .leading) {
                        Text(tech?.locationStr ?? "")
                            .foregroundStyle(.white)
                            .font(.caption2)
                            .multilineTextAlignment(.leading)
                            .fixedSize(horizontal: false, vertical: true)
                    }.foregroundColor(.white)
                    Spacer()
                    HStack(alignment: .center, spacing: 10) {
                        Image(systemName: service.iconName)
                            .font(.title2).bold()
                            .padding(8)
                            .background(Color.white.opacity(0.16))
                            .clipShape(RoundedRectangle(cornerRadius: 8))
                        
                        Spacer()
                    }
                }.padding(12)
                Spacer()
                if let image = tech?.image,  let url = URL(string: image) {
                    AsyncImage(url: url) { phase in
                        switch phase {
                        case .empty:
                            ProgressView()
                        case .success(let img):
                            img.resizable().scaledToFill()
                        case .failure:
                            Image(systemName: "person.fill")
                                .resizable()
                                .scaledToFit()
                        @unknown default:
                            Image(systemName: "person.fill")
                        }
                    }
                    .frame(size: 140)
                    .clipShape(RoundedRectangle(cornerRadius: 10))
                    .onEnd()
                }
            }
        }
        .cornerRadius(14)
        .shadow(color: Color.black.opacity(0.12), radius: 8, x: 0, y: 6)
    }
}
