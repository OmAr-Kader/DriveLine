//
//  BaseObserver.swift
//  DriveLine
//
//  Created by OmAr Kader on 05/11/2025.
//

import Foundation
import SwiftUISturdy

class BaseObserver : Sendable {
    
    let project: Project
        
    var tasker: Tasker = Tasker()
    
    init(project: Project) {
        self.project = project
    }
    
    @BackgroundActor
    @discardableResult
    func mainSync(block: @escaping @MainActor @Sendable () async -> Void) -> Task<Void, any Error>? {
        TaskMainSwitcher {
            self.tasker.mainSync(block: block)
        }
    }
    
    deinit {
        tasker.deInit()
    }
}
