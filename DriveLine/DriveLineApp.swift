//
//  DriveLineApp.swift
//  DriveLine
//
//  Created by OmAr Kader on 05/11/2025.
//

import SwiftUI

@main
struct DriveLineApp: App {
    @UIApplicationDelegateAdaptor(AppDelegate.self) var delegate

    @State var screenToGo: Screen?

    var body: some Scene {
        WindowGroup {
            ZStack {
                if let screenToGo {
                    Main(app: delegate.app, mainScreen: screenToGo)
                } else {
                    SplashScreen().task {
                        let startTime = DispatchTime.now().uptimeNanoseconds
                        let screenToGo: Screen = await withCheckedContinuation { continuation in
                            delegate.app.findUserBase { userBase in
                                continuation.resume(returning: userBase != nil ? .HOME_SCREEN_ROUTE : .AUTH_SCREEN_ROUTE)
                            }
                        }
                        let elapsed = DispatchTime.now().uptimeNanoseconds - startTime
                        let elapsedMs = Double(elapsed) / 1_000_000  // convert to milliseconds
                        let remainingMs = max(0, 700 - elapsedMs)    // 1000 ms = 1 sec
                        
                        if remainingMs > 0 {
                            try? await Task.sleep(nanoseconds: UInt64(remainingMs * 1_000_000))
                        }

                        Task { @MainActor in
                            withAnimation {
                                self.screenToGo = screenToGo
                            }
                        }

                        /*let _ = await Task { @MainActor in
                            delegate.app.findUserBase { it in
                                guard screenToGo == nil else {
                                    return
                                }
                                screenToGo = it != nil ? .HOME_SCREEN_ROUTE : .AUTH_SCREEN_ROUTE
                            }
                        }.result*/
                    }
                }
            }
        }
    }
}
