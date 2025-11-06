//
//  HomeView.swift
//  DriveLine
//
//  Created by OmAr Kader on 05/11/2025.
//

import SwiftUI
import SwiftUISturdy
import EventKit

@MainActor
struct HomeView: View {
    
    var app: BaseAppObserve
    let navigator: Navigator
    let manager = EventKitManager()

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
            Button {
                app.increaseCount()
            } label: {
                Text("Count: \(app.state.count)").foregroundStyle(.textOfApp)
            }.padding()
                .apply {
                    if #available(iOS 26.0, *) {
                        $0.glassEffect(.regular.tint(.blue).interactive())
                    } else {
                        $0.glassed(shape: Capsule(), tint: .blue)
                    }
                }//.id(app.state.count)
        }.toolbar(content: toolBarView)
            .navigationTitle("Home")
            .navigationBarHidden(false)
    }
    
    @ToolbarContentBuilder
    func toolBarView() -> some ToolbarContent {
        ToolbarItem(placement: .topBarTrailing) {
            
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
