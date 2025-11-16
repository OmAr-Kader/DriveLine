//
//  CreateEditCourseObserve.swift
//  DriveLine
//
//  Created by OmAr Kader on 16/11/2025.
//

import SwiftUI
import SwiftUISturdy
import Combine
import Observation

@MainActor
@Observable
final class CreateEditCourseObserve: BaseObserver {
    var selectedPage: Int = 0
    var isLoading: Bool = false
    var toast: Toast?
    var courseAdminId: Int?
    
    var original: ProvideCourseData?

    var vmHasLoadedOnce = false

    var descriptionText: String = ""
    var priceText: String = ""
    var currency: String = "USD"
    var sessions: Int = 2
    var images: [String] = []
    
    // availabilities: single source of truth. Values store HOURS directly.
    var availabilities: [WeekDay: AvailabilityInterval?] = {
        var d = [WeekDay: AvailabilityInterval?]()
        WeekDay.allCases.forEach { d[$0] = nil }
        return d
    }()

    var selectedDay: WeekDay = .monday
    var errorMessage: String?

    init() {
        @Inject
        var pro: Project
        super.init(project: pro)
    }

    /// Set start/end ensuring invariants: clamp to [0,23] and ensure start <= end.
    func setHours(for day: WeekDay, start: Int, end: Int) {
        let s = clamp(start, lower: 0, upper: 23)
        let e = clamp(end, lower: 0, upper: 23)
        if s <= e {
            availabilities[day] = AvailabilityInterval(startUTC: s, endUTC: e)
        } else {
            // swap to keep start <= end
            availabilities[day] = AvailabilityInterval(startUTC: e, endUTC: s)
        }
    }

    func clearRange(for day: WeekDay) {
        availabilities[day] = nil
    }

    // Load existing ProvideCourseData (edit mode).
    func loadFromExisting(_ existing: ProvideCourseData) {
        original = existing
        descriptionText = existing.description
        priceText = existing.price
        currency = existing.currency
        sessions = existing.sessions
        images = existing.images ?? []
        availabilities[.monday] = existing.monday
        availabilities[.tuesday] = existing.tuesday
        availabilities[.wednesday] = existing.wednesday
        availabilities[.thursday] = existing.thursday
        availabilities[.friday] = existing.friday
        availabilities[.saturday] = existing.saturday
        availabilities[.sunday] = existing.sunday
        withAnimation {
            vmHasLoadedOnce = true
        }
    }

    // Build request
    @MainActor
    func makeRequest(userBase: UserBase, courseAdminId: Int, invoke: @escaping @Sendable @MainActor () -> Void) {
        guard validateAll() else { return }
        func val(_ d: WeekDay) -> AvailabilityInterval? { availabilities[d] ?? nil }
        withAnimation {
            self.isLoading = true
        }
        
        let techId = userBase.id
        let description = descriptionText
        let price = priceText
        let currency = currency
        let sessions = sessions
        let images = images
        let monday = val(.monday)
        let tuesday = val(.tuesday)
        let wednesday = val(.wednesday)
        let thursday = val(.thursday)
        let friday = val(.friday)
        let saturday = val(.saturday)
        let sunday = val(.sunday)
        self.tasker.back {
            let body = ProvideCourseRequest(
                techId: techId,
                courseAdminId: courseAdminId,
                description: description,
                price: price,
                currency: currency,
                sessions: sessions,
                images: images,
                monday: monday,
                tuesday: tuesday,
                wednesday: wednesday,
                thursday: thursday,
                friday: friday,
                saturday: saturday,
                sunday: sunday
            )
            await self.project.course.createCourse(userBase: userBase, body: body) { new in
                self.mainSync {
                    invoke()
                    withAnimation {
                        self.isLoading = false
                        self.toast = Toast(style: .success, message: "done")
                    }
                }
            } failed: { msg in
                self.mainSync {
                    withAnimation {
                        self.isLoading = false
                        self.toast = Toast(style: .error, message: "Failed")
                    }
                }
            }
            
        }
    }
    
    @MainActor
    func update(userBase: UserBase, courseAdminId: Int, invoke: @escaping @Sendable @MainActor () -> Void) {
        guard validateAll(), let original else { return }
        func val(_ d: WeekDay) -> AvailabilityInterval? { availabilities[d] ?? nil }
        withAnimation {
            self.isLoading = true
        }
        
        let description = descriptionText
        let price = priceText
        let currency = currency
        let sessions = sessions
        let images = images
        let monday = val(.monday)
        let tuesday = val(.tuesday)
        let wednesday = val(.wednesday)
        let thursday = val(.thursday)
        let friday = val(.friday)
        let saturday = val(.saturday)
        let sunday = val(.sunday)
        self.tasker.back {
            let isActive = monday != nil || tuesday != nil || wednesday != nil || thursday != nil || friday != nil || saturday != nil || sunday != nil

            let body = UpdateProvidedCourseRequest(original: original, description: description, price: price, currency: currency, sessions: sessions, images: images, isActive: isActive, monday: monday, tuesday: tuesday, wednesday: wednesday, thursday: thursday, friday: friday, saturday:  saturday, sunday: sunday)
            
            await self.project.course.updateCourse(userBase: userBase, courseProvidedId: original._id, body: body) { new in
                self.mainSync {
                    withAnimation {
                        invoke()
                        self.isLoading = false
                        self.toast = Toast(style: .success, message: "done")
                    }
                }
            } failed: { msg in
                self.mainSync {
                    withAnimation {
                        self.isLoading = false
                        self.toast = Toast(style: .error, message: "Failed")
                    }
                }
            }
        }
    }

    func validateAll() -> Bool {
        guard !descriptionText.trimmingCharacters(in: .whitespacesAndNewlines).isEmpty else {
            LogKit.print("Description must not be empty.")
            return false
        }
        guard !priceText.trimmingCharacters(in: .whitespacesAndNewlines).isEmpty else {
            LogKit.print("Price must not be empty.")
            return false
        }
        guard sessions > 0 else {
            LogKit.print("Sessions Number must be greater than 0.")
            return false
        }
        for day in WeekDay.allCases {
            if let interval = availabilities[day] ?? nil {
                // allow single hour (start == end)
                guard (0...23).contains(interval.startUTC) && (0...23).contains(interval.endUTC) else {
                    LogKit.print("\(day.short): hours must be 0..23.")
                    return false
                }
                guard interval.startUTC <= interval.endUTC else {
                    LogKit.print("\(day.short): start must be <= end.")
                    return false
                }
            }
        }
        return true
    }

    
    @MainActor
    func addNewImage(img: String) {
        var newImages = images
        newImages.append(img)
        withAnimation {
            images = newImages
        }
    }
    
    func removeImage(index: Int) {
        var newImages = images
        newImages.remove(at: index)
        withAnimation {
            images = newImages
        }
    }
    
    // MARK: - Utilities
    private func clamp(_ v: Int, lower: Int, upper: Int) -> Int {
        min(max(v, lower), upper)
    }
}
