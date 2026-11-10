//
//  Helper.swift
//  DriveLine
//
//  Created by OmAr Kader on 10/11/2026.
//

import Foundation
import SwiftUISturdy
@testable import DriveLine


// MARK: - Core

@MainActor
class BaseTestsCore {
    let project: Project
    let app: BaseAppObserve
    let auth: AuthAppObserve

    init() {
#if DEBUG
        AppConfig.setIsDebuggerAttached(LogKitLevel.failure)
#else
        AppConfig.setIsDebuggerAttached(LogKitLevel.off)
#endif
        let app = projectGenerator()
        self.project = app.0
        self.app = BaseAppObserve(pro: app.0, secureSession: app.2)
        auth = AuthAppObserve(pro: app.0)
    }

    
     /// Login + update user + handshake.
     /// Calls `invoke` with the final UserBase on success, `failed` on any error (then rethrows).
     func login(
         invoke: @escaping @MainActor (UserBase) -> Void,
         failed: @escaping @MainActor (String) -> Void
     ) async throws {
         do {
             print("1. Starting login")
             let userBase: UserBase = try await awaitCallback("login") { success, failed in
                 auth.login(email: SecureConst.email, password: SecureConst.password) {
                     print("2. Login callback")
                     success($0)
                 } failed: {
                     failed($0)
                 }
             }
             print("3. Login completed")

             let updatedUserBase: UserBase = try await awaitCallback("updateUserBase") { success, _ in
                 app.updateUserBase(userBase: userBase) {
                     print("4. User updated")
                     success($0)
                 }
             }

             print("5. Starting handshake")
             try await awaitCompletion("shakeHands") { success, failed in
                 app.shakeHands(userBase: updatedUserBase) {
                     print("6. Handshake completed")
                     success()
                 } failed: {
                     failed($0)
                 }
             }

             invoke(updatedUserBase)
         } catch {
             failed(error.localizedDescription)
             throw error
         }
     }
    
    func checkUserOrlogin(
        invoke: @escaping @MainActor (UserBase) -> Void,
        failed: @escaping @MainActor (String) -> Void
    ) async throws {
        do {
            let userBase: UserBase? = await withCheckedContinuation { continuation in
                app.findUserBase { userBase in
                    continuation.resume(returning: userBase)
                }
            }
            
            if let userBase {
                print("1. Starting handshake")
                app.shakeHands(userBase: userBase) {
                    print("6. Handshake completed")
                    invoke(userBase)
                } failed: {
                    failed($0)
                }
                return
            }
            try await login(invoke: invoke, failed: failed)
        } catch {
            failed(error.localizedDescription)
            throw error
        }
    }

}

// MARK: - Helpers

struct CallbackError: Error, LocalizedError {
    let message: String
    var errorDescription: String? { message }
}

/// Resumes the continuation exactly once.
/// If all callbacks are released without any being called, the await fails
/// with a clear error instead of leaking.
private final class ContinuationGate<T>: @unchecked Sendable {
    private let lock = NSLock()
    private var continuation: CheckedContinuation<T, any Error>?
    private let label: String

    init(_ label: String, _ continuation: CheckedContinuation<T, any Error>) {
        self.label = label
        self.continuation = continuation
    }

    func resume(_ result: Result<T, any Error>) {
        lock.lock()
        let c = continuation
        continuation = nil
        lock.unlock()
        c?.resume(with: result)
    }

    deinit {
        guard let continuation else { return }
        continuation.resume(
            throwing: CallbackError(message: "\(label): callbacks released without being called")
        )
    }
}

/// Sync callback API that returns a value: `(success: (T) -> Void, failed: (String) -> Void)`
@MainActor
func awaitCallback<T>(
    _ label: String,
    _ operation: (@escaping (T) -> Void, @escaping (String) -> Void) -> Void
) async throws -> T {
    try await withCheckedThrowingContinuation { continuation in
        let gate = ContinuationGate<T>(label, continuation)
        operation(
            { gate.resume(.success($0)) },
            { gate.resume(.failure(CallbackError(message: "\(label): \($0)"))) }
        )
    }
}

/// Sync callback API with NO result: `(success: () -> Void, failed: (String) -> Void)`
@MainActor
func awaitCompletion(
    _ label: String,
    _ operation: (@escaping () -> Void, @escaping (String) -> Void) -> Void
) async throws {
    try await withCheckedThrowingContinuation { (continuation: CheckedContinuation<Void, any Error>) in
        let gate = ContinuationGate<Void>(label, continuation)
        operation(
            { gate.resume(.success(())) },
            { gate.resume(.failure(CallbackError(message: "\(label): \($0)"))) }
        )
    }
}

/// Callback API that itself must be awaited (e.g. fetchLast50Videos).
@MainActor
func awaitCallbackAsync<T>(
    _ label: String,
    _ operation: @escaping @MainActor (@escaping (T) -> Void, @escaping (String) -> Void) async -> Void
) async throws -> T {
    try await withCheckedThrowingContinuation { continuation in
        let gate = ContinuationGate<T>(label, continuation)
        Task { @MainActor in
            await operation(
                { gate.resume(.success($0)) },
                { gate.resume(.failure(CallbackError(message: "\(label): \($0)"))) }
            )
        }
    }
}

