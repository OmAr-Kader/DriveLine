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

extension BackgroundActor {
    public nonisolated func execute(_ work: @escaping @Sendable () -> Void) {
        queue.async(execute: work)
    }
    
    public static let operationQueue: OperationQueue = {
        let q = OperationQueue()
        q.name = "BackgroundActor.OperationQueue"
        q.qualityOfService = .userInitiated
        return q
    }()
    
    internal static let executor = OperationQueueExecutor(queue: operationQueue)

    nonisolated public static var sharedExecutor: UnownedSerialExecutor {
        executor.asUnownedSerialExecutor()
    }
}

final class OperationQueueExecutor: SerialExecutor {
    let queue: OperationQueue

    init(queue: OperationQueue) {
        self.queue = queue
        self.queue.maxConcurrentOperationCount = 1 // REQUIRED for actor isolation
    }

    func enqueue(_ job: UnownedJob) {
        queue.addOperation {
            job.runSynchronously(on: self.asUnownedSerialExecutor())
        }
    }

    nonisolated func asUnownedSerialExecutor() -> UnownedSerialExecutor {
        UnownedSerialExecutor(ordinary: self)
    }
}

