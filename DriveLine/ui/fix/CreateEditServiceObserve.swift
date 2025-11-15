//
//  ServiceObserve.swift
//  DriveLine
//
//  Created by OmAr Kader on 14/11/2025.
//

import SwiftUI
import SwiftUISturdy
import Observation

@MainActor
@Observable
final class CreateEditServiceObserve: BaseObserver {
    var selectedPage: Int = 0
    var isLoading: Bool = false
    var toast: Toast?
    var serviceAdminId: Int?

    var vmHasLoadedOnce = false

    var descriptionText: String = ""
    var priceText: String = ""
    var currency: String = "USD"
    var durationMinutes: Int = 60
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

    // Load existing ProvideNewServiceRequest (edit mode).
    func loadFromExisting(_ existing: ProvideServiceRequest) {
        descriptionText = existing.description
        priceText = existing.price
        currency = existing.currency
        durationMinutes = existing.durationMinutes
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
    func makeRequest(userBase: UserBase, serviceAdminId: Int) {
        guard validateAll() else { return }
        func val(_ d: WeekDay) -> AvailabilityInterval? { availabilities[d] ?? nil }
        withAnimation {
            self.isLoading = true
        }
        
        let techId = userBase.id
        let serviceAdminId = serviceAdminId
        let description = descriptionText
        let price = priceText
        let currency = currency
        let durationMinutes = durationMinutes
        let images = images
        let monday = val(.monday)
        let tuesday = val(.tuesday)
        let wednesday = val(.wednesday)
        let thursday = val(.thursday)
        let friday = val(.friday)
        let saturday = val(.saturday)
        let sunday = val(.sunday)
        self.tasker.back {
            let body = ProvideServiceRequest(
                techId: techId,
                serviceAdminId: serviceAdminId,
                description: description,
                price: price,
                currency: currency,
                durationMinutes: durationMinutes,
                images: images,
                monday: monday,
                tuesday: tuesday,
                wednesday: wednesday,
                thursday: thursday,
                friday: friday,
                saturday: saturday,
                sunday: sunday
            )
            await self.project.fix.createService(userBase: userBase, body: body) { new in
                self.mainSync {
                    withAnimation {
                        self.isLoading = false
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
        guard durationMinutes > 0 else {
            LogKit.print("Duration must be greater than 0.")
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
