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
                        let _ = await Task { @MainActor in
                            delegate.app.findUserBase { it in
                                guard screenToGo == nil else {
                                    return
                                }
                                screenToGo = it != nil ? .HOME_SCREEN_ROUTE : .AUTH_SCREEN_ROUTE
                            }
                        }.result
                    }
                }
            }
        }
    }
}
