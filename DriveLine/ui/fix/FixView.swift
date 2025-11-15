//
//  FixView.swift
//  DriveLine
//
//  Created by OmAr Kader on 10/11/2025.
//


import SwiftUI
import SwiftUISturdy

@MainActor
struct FixView: View {
    
    let navigator: Navigator
    
    @Binding var obs: HomeObserve
    
    private var columns: [GridItem] {
        let colCount: Int
#if os(iOS)
        colCount = (UIDevice.current.userInterfaceIdiom == .pad) ? 4 : 2
#else
        colCount = 3
#endif
        return Array(repeating: GridItem(.flexible(), spacing: 12), count: colCount)
    }
    
    var body: some View {
        VStack(spacing: 0) {
            Spacer().height(10)
            ScrollableSegmentedPicker(options: FixCategory.allCases, selectedOption: obs.selectedCato)
                .padding(.horizontal)
            
            ScrollView {
                LazyVGrid(columns: columns, spacing: 12) {
                    ForEach(obs.state.currentServices) { svc in
                        ServiceCardImage(service: svc)
                            .aspectRatio(1, contentMode: .fit)
                            .onTapGesture {
                                navigator.navigateToScreen(ServicesListConfig(service: svc), .SERVICES_LIST_SCREEN)
                            }
                    }
                }
                .padding(.top, 20)
                .padding(.horizontal)
                .padding(.bottom, 32)
            }
        }.onAppeared {
            obs.setCurrentCato(.maintenance)
        }
    }
}

fileprivate struct ServiceCardImage: View {
    let service: FixService
    
    var body: some View {
        ZStack(alignment: .bottomLeading) {
            if let imageName = service.bgImageName, !imageName.isEmpty {
                Image(imageName)
                    .resizable()
                    .scaledToFill()
                    .clipped()
                    .opacity(0.5)
            } else {
                RoundedRectangle(cornerRadius: 16, style: .continuous)
                    .fill(LinearGradient(colors: [service.color.opacity(0.25), Color(.systemBackground).opacity(0.16)], startPoint: .topLeading, endPoint: .bottomTrailing))
                    .background(.ultraThinMaterial)
                    .overlay(
                        RoundedRectangle(cornerRadius: 16)
                            .stroke(Color.white.opacity(0.06), lineWidth: 0.5)
                    )
            }
            LinearGradient(colors: [.black.opacity(0.0), .black.opacity(0.38)], startPoint: .center, endPoint: .bottom)
            VStack(alignment: .leading) {
                Text(service.title)
                    .foregroundStyle(.textOfApp)
                    .font(.subheadline).bold()
                Spacer()
                HStack(alignment: .center, spacing: 10) {
                    Image(systemName: service.iconName)
                        .font(.title2).bold()
                        .padding(8)
                        .background(Color.white.opacity(0.16))
                        .clipShape(RoundedRectangle(cornerRadius: 8))
                    
                    VStack(alignment: .leading, spacing: 2) {
                        Text(service.priceEstimate)
                            .foregroundStyle(.textOfApp)
                            .font(.caption2)
                        Label("\(service.durationMinutes)m", systemImage: "clock")
                            .font(.caption)
                            .foregroundStyle(.textHint)
                    }.foregroundColor(.white)
                    
                    Spacer()
                }
            }.padding(12)
        }
        .cornerRadius(14)
        .shadow(color: Color.black.opacity(0.12), radius: 8, x: 0, y: 6)
    }
}

/*extension UISegmentedControl {
    override open func didMoveToSuperview() {
        super.didMoveToSuperview()
        self.setContentHuggingPriority(.defaultLow, for: .vertical)  // << here !!
    }
}*/

struct ScrollableSegmentedPicker: View {
    let options: [FixCategory]
    @Binding var selectedOption: FixCategory
    @Namespace private var namespace
    
    @Inject
    private var theme: Theme
    
    var body: some View {
        ScrollViewReader { proxy in
            ScrollView(.horizontal, showsIndicators: false) {
                HStack(spacing: 0) {
                    ForEach(options, id: \.self) { option in
                        Text(option.title)
                            .font(.system(.subheadline, design: .default))
                            .fontWeight(.medium)
                            .foregroundColor(selectedOption == option ? Color(.textOfApp) : Color(.textHint))
                            .padding(.horizontal, 16)
                            .padding(.vertical, 6)
                            .background(
                                ZStack {
                                    if selectedOption == option {
                                        Capsule()
                                            .fill(theme.isDarkMode ? UIColor.darkGray.toC : .white)
                                            .matchedGeometryEffect(id: "background", in: namespace)
                                            .apply {
                                                if #available(iOS 26.0, *) {
                                                    $0.glassEffect(.clear.interactive())
                                                }
                                            }
                                    }
                                }
                            )
                            .contentShape(Rectangle())
                            .onTapGesture {
                                withAnimation(.interactiveSpring(response: 0.2, dampingFraction: 0.7)) {
                                    selectedOption = option
                                }
                                DispatchQueue.main.asyncAfter(deadline: .now() + 0.1) {
                                    withAnimation(.easeInOut(duration: 0.2)) {
                                        proxy.scrollTo(option, anchor: .center)
                                    }
                                }
                            }
                            .id(option)
                    }
                }.padding(2).background(Color(.systemGray5))
                    .clipShape(Capsule())
            }.scrollContentBackground(.hidden)
                .scrollClipDisabled(true)
                .scrollBounceBehavior(.basedOnSize)
        }
    }
}


/*

import SwiftUI
import SwiftUISturdy
import EventKit

@MainActor
struct EventView: View {
    
    
    @State
    private var manager = EventKitManager()
    
    @State private var eventStatus: String = "Not Determined"
    var body: some View {
        VStack {
            Button {
                event()
            } label: {
                Text("Event: \(eventStatus)").foregroundStyle(.textOfApp)
            }.padding()
                .apply {
                    if #available(iOS 26.0, *) {
                        $0.glassEffect(.regular.tint(.blue).interactive())
                    } else {
                        $0.glassed(shape: Capsule(), tint: .blue)
                    }
                }//.id(app.state.count)
            Spacer().height(20)
        }
    }
    
    
    func event() {
        Task {
            do {
                let granted = try await manager.requestCalendarAccess()
                if granted {
                    // Create an event
                    let tomorrow = Calendar.current.date(byAdding: .day, value: 1, to: Date())!
                    let endTime = Calendar.current.date(byAdding: .hour, value: 1, to: tomorrow)!
                    
                    let event = try manager.createEvent(
                        title: "Team Meeting",
                        startDate: tomorrow,
                        endDate: endTime,
                        location: "Conference Room A",
                        notes: "Discuss project updates",
                        alarms: [manager.createAlarm(minutesBefore: 60)],
                        isAllDay: false
                    )
                    if let title = event.title  {
                        eventStatus = "\(title) Created"
                    } else {
                        eventStatus = "Failed to create event"
                    }
                    
                    LogKit.print("Event: \(event.eventIdentifier ?? "nil")")
                    LogKit.print("Event created: \(event.title ?? "nil")")
                    
                    // Fetch events for next 7 days
                    let nextWeek = Calendar.current.date(byAdding: .day, value: 7, to: Date())!
                    let events = manager.fetchEvents(from: Date(), to: nextWeek)
                    LogKit.print("Found \(events.count) events")
                } else {
                    eventStatus = "No Calendar Access"
                }
            } catch {
                eventStatus = "Failed to create event"
                LogKit.print("Error: \(error.localizedDescription)")
            }
        }
    }
    
}
*/
