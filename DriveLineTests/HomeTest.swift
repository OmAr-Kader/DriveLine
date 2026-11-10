import Foundation
import Testing
import SwiftUISturdy
@testable import DriveLine


@MainActor
struct HomeTest {
   
    let core: DriveLineTestsCore = DriveLineTestsCore()
    // MARK: Tests

    @Test("Auth login", .timeLimit(.minutes(1)))
    func authLogin() async throws {
        try await core.login { userBase in
            print("Logged in:", userBase)
        } failed: {
            Issue.record("Login failed: \($0)")
        }
        print("9. Test completed")
    }

    @Test("Fetch last 50 videos", .timeLimit(.minutes(1)))
    func videos() async throws {
        try await core.checkUserOrlogin { _ in } failed: {
            Issue.record("Login failed: \($0)")
        }

        try await core.fetchVideos { count in
            #expect(count > 0)
        } failed: {
            Issue.record("Fetch failed: \($0)")
        }
    }
}

@MainActor
class DriveLineTestsCore: BaseTestsCore {
   

    /// Videos fetch, independent of login. Requires `app.state.userBase` to be set.
    func fetchVideos(
        invoke: @escaping @MainActor (Int) -> Void,
        failed: @escaping @MainActor (String) -> Void
    ) async throws {
        do {
            print("7. Starting videos fetch")
            let count: Int = try await awaitCallbackAsync("fetchLast50Videos") { success, failed in
                guard let userBase = self.app.state.userBase else {
                    failed("userBase nil")
                    return
                }
                await self.project.short.fetchLast50Videos(
                    userBase: userBase,
                    limit: 20,
                    skip: 0,
                    needCache: false
                ) { shorts in
                    print("8. Videos fetched:", shorts.count)
                    success(shorts.count)
                } failed: {
                    failed($0)
                }
            }
            invoke(count)
        } catch {
            failed(error.localizedDescription)
            throw error
        }
    }

}
