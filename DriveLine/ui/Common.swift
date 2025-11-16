//
//  common.swift
//  DriveLine
//
//  Created by OmAr Kader on 16/11/2025.
//

import SwiftUI
import SwiftUISturdy

// MARK: - DayAvailability (no @State inside)
struct DayAvailability: View {
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
                HourRangeView(day: day, selectedStart: selectedStart,
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

// MARK: - HourRangeView (simple pick logic, hours only)

struct HourRangeView: View {
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
                        HourChipView(
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

// MARK: - HourChipView
struct HourChipView: View {
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


// MARK: - DayAvailabilityEditor (no @State inside)
struct DayAvailabilityEditor: View {
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

struct HourRangePicker: View {
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

struct HourChip: View {
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
